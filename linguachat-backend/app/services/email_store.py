import hashlib
import json
import os
import secrets
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional


DEFAULT_DB_PATH = "data/linguachat-email.sqlite3"


def _utc_iso(now: Optional[datetime] = None) -> str:
    value = now or datetime.now(timezone.utc)
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


class EmailStore:
    def __init__(self, path: Optional[str] = None):
        self.path = path or os.getenv("LINGUACHAT_EMAIL_DB_PATH", DEFAULT_DB_PATH)
        db_path = Path(self.path)
        if self.path != ":memory:":
            db_path.parent.mkdir(parents=True, exist_ok=True)
        self._memory_connection = None
        if self.path == ":memory:":
            self._memory_connection = sqlite3.connect(":memory:", check_same_thread=False)
            self._memory_connection.row_factory = sqlite3.Row
        self._init_schema()

    @contextmanager
    def connect(self):
        if self._memory_connection is not None:
            yield self._memory_connection
            return
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        try:
            yield connection
        finally:
            connection.close()

    def _init_schema(self):
        with self.connect() as connection:
            connection.executescript(
                """
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS email_subscriptions (
                    subscription_id TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    locale TEXT NOT NULL,
                    timezone TEXT NOT NULL,
                    preferred_hour INTEGER NOT NULL,
                    enabled INTEGER NOT NULL DEFAULT 1,
                    manage_token_hash TEXT NOT NULL,
                    unsubscribe_token TEXT NOT NULL UNIQUE,
                    progress_json TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS email_send_claims (
                    subscription_id TEXT NOT NULL,
                    local_date TEXT NOT NULL,
                    status TEXT NOT NULL,
                    claimed_at TEXT NOT NULL,
                    sent_at TEXT,
                    PRIMARY KEY (subscription_id, local_date),
                    FOREIGN KEY (subscription_id)
                        REFERENCES email_subscriptions(subscription_id)
                        ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS email_subscriptions_enabled_idx
                    ON email_subscriptions(enabled);
                """
            )
            connection.commit()

    @staticmethod
    def _row_to_subscription(row: sqlite3.Row) -> dict[str, Any]:
        value = dict(row)
        raw_progress = value.pop("progress_json", None)
        value["progress"] = json.loads(raw_progress) if raw_progress else None
        value["enabled"] = bool(value["enabled"])
        return value

    def create_subscription(
        self,
        *,
        email: str,
        locale: str,
        timezone_name: str,
        preferred_hour: int,
        progress: Optional[dict[str, Any]] = None,
    ) -> tuple[dict[str, Any], str]:
        subscription_id = str(uuid.uuid4())
        manage_token = secrets.token_urlsafe(32)
        unsubscribe_token = secrets.token_urlsafe(32)
        now = _utc_iso()
        with self.connect() as connection:
            connection.execute(
                """
                INSERT INTO email_subscriptions (
                    subscription_id, email, locale, timezone, preferred_hour,
                    enabled, manage_token_hash, unsubscribe_token, progress_json,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
                """,
                (
                    subscription_id,
                    email,
                    locale,
                    timezone_name,
                    preferred_hour,
                    hash_token(manage_token),
                    unsubscribe_token,
                    json.dumps(progress) if progress is not None else None,
                    now,
                    now,
                ),
            )
            connection.commit()
        return self.get_subscription(subscription_id), manage_token

    def get_subscription(self, subscription_id: str) -> Optional[dict[str, Any]]:
        with self.connect() as connection:
            row = connection.execute(
                "SELECT * FROM email_subscriptions WHERE subscription_id = ?",
                (subscription_id,),
            ).fetchone()
        return self._row_to_subscription(row) if row else None

    def verify_manage_token(self, subscription_id: str, token: str) -> bool:
        if not token:
            return False
        subscription = self.get_subscription(subscription_id)
        if not subscription:
            return False
        return secrets.compare_digest(subscription["manage_token_hash"], hash_token(token))

    def update_subscription(self, subscription_id: str, changes: dict[str, Any]) -> Optional[dict[str, Any]]:
        allowed = {"email", "locale", "timezone", "preferred_hour", "enabled"}
        updates = {key: value for key, value in changes.items() if key in allowed and value is not None}
        if not updates:
            return self.get_subscription(subscription_id)
        updates["updated_at"] = _utc_iso()
        assignments = ", ".join(f"{key} = ?" for key in updates)
        values = [int(value) if key == "enabled" else value for key, value in updates.items()]
        values.append(subscription_id)
        with self.connect() as connection:
            connection.execute(
                f"UPDATE email_subscriptions SET {assignments} WHERE subscription_id = ?",
                values,
            )
            connection.commit()
        return self.get_subscription(subscription_id)

    def set_progress(self, subscription_id: str, progress: dict[str, Any]) -> Optional[dict[str, Any]]:
        with self.connect() as connection:
            connection.execute(
                "UPDATE email_subscriptions SET progress_json = ?, updated_at = ? WHERE subscription_id = ?",
                (json.dumps(progress), _utc_iso(), subscription_id),
            )
            connection.commit()
        return self.get_subscription(subscription_id)

    def unsubscribe_by_token(self, unsubscribe_token: str) -> bool:
        with self.connect() as connection:
            cursor = connection.execute(
                "UPDATE email_subscriptions SET enabled = 0, updated_at = ? WHERE unsubscribe_token = ?",
                (_utc_iso(), unsubscribe_token),
            )
            connection.commit()
        return cursor.rowcount == 1

    def list_enabled(self) -> list[dict[str, Any]]:
        with self.connect() as connection:
            rows = connection.execute(
                "SELECT * FROM email_subscriptions WHERE enabled = 1 ORDER BY created_at ASC"
            ).fetchall()
        return [self._row_to_subscription(row) for row in rows]

    def claim_send(self, subscription_id: str, local_date: str, now_utc: datetime) -> bool:
        now = now_utc.astimezone(timezone.utc) if now_utc.tzinfo else now_utc.replace(tzinfo=timezone.utc)
        stale_before = _utc_iso(now - timedelta(hours=1))
        with self.connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            connection.execute(
                """
                DELETE FROM email_send_claims
                WHERE subscription_id = ? AND local_date = ?
                  AND status = 'claimed' AND claimed_at < ?
                """,
                (subscription_id, local_date, stale_before),
            )
            cursor = connection.execute(
                """
                INSERT OR IGNORE INTO email_send_claims
                    (subscription_id, local_date, status, claimed_at)
                VALUES (?, ?, 'claimed', ?)
                """,
                (subscription_id, local_date, _utc_iso(now)),
            )
            connection.commit()
        return cursor.rowcount == 1

    def mark_sent(self, subscription_id: str, local_date: str, now_utc: datetime):
        with self.connect() as connection:
            connection.execute(
                """
                UPDATE email_send_claims
                SET status = 'sent', sent_at = ?
                WHERE subscription_id = ? AND local_date = ?
                """,
                (_utc_iso(now_utc), subscription_id, local_date),
            )
            connection.commit()

    def release_claim(self, subscription_id: str, local_date: str):
        with self.connect() as connection:
            connection.execute(
                """
                DELETE FROM email_send_claims
                WHERE subscription_id = ? AND local_date = ? AND status = 'claimed'
                """,
                (subscription_id, local_date),
            )
            connection.commit()

    def sent_for_date(self, subscription_id: str, local_date: str) -> bool:
        with self.connect() as connection:
            row = connection.execute(
                """
                SELECT 1 FROM email_send_claims
                WHERE subscription_id = ? AND local_date = ? AND status = 'sent'
                """,
                (subscription_id, local_date),
            ).fetchone()
        return row is not None
