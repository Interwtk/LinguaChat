from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.services.email_digest import MemoryEmailTransport, build_daily_email, dispatch_due_emails
from app.services.email_store import EmailStore
from main import app


client = TestClient(app)


@pytest.fixture
def email_db(tmp_path, monkeypatch):
    path = tmp_path / "daily-email.sqlite3"
    monkeypatch.setenv("LINGUACHAT_EMAIL_DB_PATH", str(path))
    monkeypatch.setenv("EMAIL_TRANSPORT", "memory")
    monkeypatch.setenv("EMAIL_SCHEDULER_TOKEN", "scheduler-test-token")
    monkeypatch.delenv("EMAIL_PUBLIC_BASE_URL", raising=False)
    return path


def create_payload(**overrides):
    payload = {
        "email": "learner@example.com",
        "locale": "es-CO",
        "timezone": "America/Bogota",
        "preferred_hour": 8,
        "progress": {"xp": 120, "streak": 4, "missions_completed": 3},
    }
    payload.update(overrides)
    return payload


def auth_headers(token):
    return {"X-LinguaChat-Email-Token": token}


def test_subscription_requires_management_token_for_reads(email_db):
    created = client.post("/email-digest/subscriptions", json=create_payload())
    assert created.status_code == 201
    credentials = created.json()
    subscription_id = credentials["subscription_id"]

    assert client.get(f"/email-digest/subscriptions/{subscription_id}").status_code == 401
    response = client.get(
        f"/email-digest/subscriptions/{subscription_id}",
        headers=auth_headers(credentials["manage_token"]),
    )
    assert response.status_code == 200
    assert response.json()["email"] == "learner@example.com"
    assert response.json()["locale"] == "es"


def test_manage_token_is_not_stored_in_plaintext(email_db):
    created = client.post("/email-digest/subscriptions", json=create_payload()).json()
    stored = EmailStore(str(email_db)).get_subscription(created["subscription_id"])
    assert stored["manage_token_hash"] != created["manage_token"]
    assert len(stored["manage_token_hash"]) == 64


def test_invalid_email_and_timezone_are_rejected(email_db):
    bad_email = client.post("/email-digest/subscriptions", json=create_payload(email="not-an-email"))
    bad_timezone = client.post("/email-digest/subscriptions", json=create_payload(timezone="Mars/Olympus"))
    assert bad_email.status_code == 422
    assert bad_timezone.status_code == 422


def test_progress_sync_uses_only_explicit_client_values(email_db):
    created = client.post("/email-digest/subscriptions", json=create_payload(progress=None)).json()
    response = client.post(
        f"/email-digest/subscriptions/{created['subscription_id']}/progress",
        headers=auth_headers(created["manage_token"]),
        json={"xp": 55, "streak": 2},
    )
    assert response.status_code == 200
    assert response.json()["progress"] == {"level": None, "xp": 55, "streak": 2, "messages_sent": None, "missions_completed": None, "last_practice_date": None}


def test_daily_dispatch_respects_timezone_and_local_hour(tmp_path):
    store = EmailStore(str(tmp_path / "hour.sqlite3"))
    subscription, _ = store.create_subscription(
        email="learner@example.com",
        locale="en",
        timezone_name="America/Santiago",
        preferred_hour=8,
        progress=None,
    )
    transport = MemoryEmailTransport()

    before = dispatch_due_emails(
        store,
        transport,
        now_utc=datetime(2026, 9, 15, 10, 30, tzinfo=timezone.utc),  # 07:30 in Santiago
    )
    due = dispatch_due_emails(
        store,
        transport,
        now_utc=datetime(2026, 9, 15, 11, 5, tzinfo=timezone.utc),   # 08:05 in Santiago
    )
    assert before == {"considered": 1, "sent": 0, "skipped": 1, "failed": 0}
    assert due["sent"] == 1
    assert len(transport.messages) == 1
    assert subscription["email"] == transport.messages[0].to


def test_same_local_day_is_sent_exactly_once_even_across_store_instances(tmp_path):
    path = str(tmp_path / "dedupe.sqlite3")
    store = EmailStore(path)
    subscription, _ = store.create_subscription(
        email="once@example.com",
        locale="en",
        timezone_name="UTC",
        preferred_hour=0,
        progress=None,
    )
    now = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)
    first_transport = MemoryEmailTransport()
    second_transport = MemoryEmailTransport()
    assert dispatch_due_emails(store, first_transport, now_utc=now)["sent"] == 1
    assert dispatch_due_emails(EmailStore(path), second_transport, now_utc=now)["sent"] == 0
    assert EmailStore(path).sent_for_date(subscription["subscription_id"], "2026-09-15")


def test_transport_failure_releases_claim_for_retry(tmp_path):
    class FailingTransport:
        def send(self, _message):
            raise RuntimeError("mail server unavailable")

    store = EmailStore(str(tmp_path / "retry.sqlite3"))
    store.create_subscription(
        email="retry@example.com",
        locale="en",
        timezone_name="UTC",
        preferred_hour=0,
        progress=None,
    )
    now = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)
    assert dispatch_due_emails(store, FailingTransport(), now_utc=now)["failed"] == 1
    good = MemoryEmailTransport()
    assert dispatch_due_emails(store, good, now_utc=now)["sent"] == 1


def test_email_never_invents_progress_when_snapshot_is_missing(tmp_path):
    store = EmailStore(str(tmp_path / "generic.sqlite3"))
    subscription, _ = store.create_subscription(
        email="generic@example.com",
        locale="es",
        timezone_name="UTC",
        preferred_hour=0,
        progress=None,
    )
    message = build_daily_email(subscription)
    assert "XP" not in message.text
    assert "Racha" not in message.text
    assert "Misiones" not in message.text
    assert "¿Listo para practicar inglés hoy?" in message.text


def test_arabic_email_uses_rtl_markup(tmp_path):
    store = EmailStore(str(tmp_path / "arabic.sqlite3"))
    subscription, _ = store.create_subscription(
        email="arabic@example.com",
        locale="ar",
        timezone_name="UTC",
        preferred_hour=0,
        progress={"streak": 3},
    )
    message = build_daily_email(subscription)
    assert 'dir="rtl"' in message.html
    assert "3" in message.text


def test_opt_out_disables_future_dispatch(tmp_path):
    store = EmailStore(str(tmp_path / "optout.sqlite3"))
    subscription, _ = store.create_subscription(
        email="off@example.com",
        locale="en",
        timezone_name="UTC",
        preferred_hour=0,
        progress=None,
    )
    assert store.unsubscribe_by_token(subscription["unsubscribe_token"])
    result = dispatch_due_emails(
        store,
        MemoryEmailTransport(),
        now_utc=datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc),
    )
    assert result["considered"] == 0


def test_internal_dispatch_is_secret_protected(email_db):
    client.post("/email-digest/subscriptions", json=create_payload(timezone="UTC", preferred_hour=0))
    assert client.post("/email-digest/internal/dispatch").status_code == 401
    assert client.post(
        "/email-digest/internal/dispatch",
        headers={"X-LinguaChat-Scheduler-Token": "wrong"},
    ).status_code == 401
    response = client.post(
        "/email-digest/internal/dispatch",
        headers={"X-LinguaChat-Scheduler-Token": "scheduler-test-token"},
    )
    assert response.status_code == 200
    assert response.json()["sent"] == 1


def test_scheduler_fails_closed_when_transport_is_disabled(email_db, monkeypatch):
    monkeypatch.setenv("EMAIL_TRANSPORT", "disabled")
    response = client.post(
        "/email-digest/internal/dispatch",
        headers={"X-LinguaChat-Scheduler-Token": "scheduler-test-token"},
    )
    assert response.status_code == 503
