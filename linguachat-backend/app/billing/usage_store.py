"""Where Premium's daily count and revocations live.

Two implementations of one small contract, both atomic:

  SqliteUsageStore  survives a restart and is shared by every process on one
                    machine. A single transaction takes the write lock, counts
                    and inserts, so concurrent requests cannot both take the
                    last block. On a serverless host the file system does not
                    persist: production needs the same contract on a managed
                    database, which is not authorized yet
                    (docs/architecture/premium-practice.md).
  MemoryUsageStore  for tests and local QA only. A restart or a second instance
                    forgets it, so premium.py refuses it unless explicitly
                    allowed.

The store keeps an account id, a UTC day and a block number. Nothing about what
was practised.
"""
from __future__ import annotations

import sqlite3
from contextlib import closing
from threading import Lock


class MemoryUsageStore:
    durable = False

    def __init__(self):
        self._lock = Lock()
        self._used: dict[tuple[str, str], int] = {}
        self._revoked_passes: set[str] = set()
        self._revoked_before: dict[str, int] = {}

    def claim(self, sub: str, day: str, limit: int) -> int | None:
        """The next block number for this account today, or None at the limit."""
        with self._lock:
            used = self._used.get((sub, day), 0)
            if used >= limit:
                return None
            self._used[(sub, day)] = used + 1
            for slot in [s for s in self._used if s[1] < day]:
                del self._used[slot]
            return used

    def used(self, sub: str, day: str) -> int:
        with self._lock:
            return self._used.get((sub, day), 0)

    def revoke_pass(self, jti: str) -> None:
        with self._lock:
            self._revoked_passes.add(jti)

    def revoke_subject(self, sub: str, before_iat: int) -> None:
        with self._lock:
            self._revoked_before[sub] = max(before_iat, self._revoked_before.get(sub, 0))

    def is_revoked(self, jti: str, sub: str, iat: int) -> bool:
        with self._lock:
            return jti in self._revoked_passes or iat < self._revoked_before.get(sub, 0)


class SqliteUsageStore:
    durable = True

    def __init__(self, path: str):
        self.path = path
        with closing(self._connect()) as db, db:
            db.execute("CREATE TABLE IF NOT EXISTS usage (sub TEXT, day TEXT, used INTEGER NOT NULL, PRIMARY KEY (sub, day))")
            db.execute("CREATE TABLE IF NOT EXISTS revoked_pass (jti TEXT PRIMARY KEY)")
            db.execute("CREATE TABLE IF NOT EXISTS revoked_subject (sub TEXT PRIMARY KEY, before_iat INTEGER NOT NULL)")

    def _connect(self) -> sqlite3.Connection:
        db = sqlite3.connect(self.path, timeout=10, isolation_level=None)
        db.execute("PRAGMA journal_mode=WAL")
        return db

    def claim(self, sub: str, day: str, limit: int) -> int | None:
        with closing(self._connect()) as db:
            db.execute("BEGIN IMMEDIATE")
            try:
                row = db.execute("SELECT used FROM usage WHERE sub = ? AND day = ?", (sub, day)).fetchone()
                used = row[0] if row else 0
                if used >= limit:
                    db.execute("ROLLBACK")
                    return None
                db.execute("INSERT INTO usage (sub, day, used) VALUES (?, ?, 1) "
                           "ON CONFLICT (sub, day) DO UPDATE SET used = used + 1", (sub, day))
                db.execute("DELETE FROM usage WHERE day < ?", (day,))
                db.execute("COMMIT")
                return used
            except BaseException:
                db.execute("ROLLBACK")
                raise

    def used(self, sub: str, day: str) -> int:
        with closing(self._connect()) as db:
            row = db.execute("SELECT used FROM usage WHERE sub = ? AND day = ?", (sub, day)).fetchone()
            return row[0] if row else 0

    def revoke_pass(self, jti: str) -> None:
        with closing(self._connect()) as db:
            db.execute("INSERT OR IGNORE INTO revoked_pass (jti) VALUES (?)", (jti,))

    def revoke_subject(self, sub: str, before_iat: int) -> None:
        with closing(self._connect()) as db:
            db.execute("INSERT INTO revoked_subject (sub, before_iat) VALUES (?, ?) ON CONFLICT (sub) "
                       "DO UPDATE SET before_iat = MAX(before_iat, excluded.before_iat)", (sub, before_iat))

    def is_revoked(self, jti: str, sub: str, iat: int) -> bool:
        with closing(self._connect()) as db:
            if db.execute("SELECT 1 FROM revoked_pass WHERE jti = ?", (jti,)).fetchone():
                return True
            row = db.execute("SELECT before_iat FROM revoked_subject WHERE sub = ?", (sub,)).fetchone()
            return bool(row) and iat < row[0]
