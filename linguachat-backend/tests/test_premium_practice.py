"""Premium extra practice: off by default, decided by the server, fail closed."""
import threading
import time
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.billing.pass_token import issue_pass, read_pass
from app.billing.usage_store import MemoryUsageStore, SqliteUsageStore
from app.routes import premium
from main import app

KEY = "test-only-signing-key-0123456789abcdef"
client = TestClient(app)


@pytest.fixture(autouse=True)
def _clean(monkeypatch):
    premium.reset_usage_for_tests()
    for name in ("LINGUACHAT_PREMIUM_ENABLED", "LINGUACHAT_PASS_SIGNING_KEY", "LINGUACHAT_USAGE_DB", "LINGUACHAT_PREMIUM_ALLOW_MEMORY_STORE"):
        monkeypatch.delenv(name, raising=False)
    yield
    premium.reset_usage_for_tests()


@pytest.fixture
def on(monkeypatch, tmp_path):
    monkeypatch.setenv("LINGUACHAT_PREMIUM_ENABLED", "true")
    monkeypatch.setenv("LINGUACHAT_PASS_SIGNING_KEY", KEY)
    monkeypatch.setenv("LINGUACHAT_USAGE_DB", str(tmp_path / "usage.db"))
    return tmp_path / "usage.db"


def _ask(token, course="es"):
    return client.post("/practice/extra/authorize", json={"pass_token": token, "course": course}).json()


def _pass(sub="acct-1", seconds=600):
    return issue_pass(KEY, sub, lifetime_seconds=seconds)


def test_premium_is_off_by_default_and_says_so():
    assert client.get("/premium/status").json() == {"available": False, "extra_blocks_per_day": 3}
    assert _ask(_pass()) == {"granted": False, "reason": "not_available"}


def test_enabling_needs_a_real_key_too(monkeypatch, tmp_path):
    monkeypatch.setenv("LINGUACHAT_PREMIUM_ENABLED", "true")
    monkeypatch.setenv("LINGUACHAT_USAGE_DB", str(tmp_path / "u.db"))
    monkeypatch.setenv("LINGUACHAT_PASS_SIGNING_KEY", "short")
    assert client.get("/premium/status").json()["available"] is False


def test_enabling_needs_a_durable_store(monkeypatch):
    monkeypatch.setenv("LINGUACHAT_PREMIUM_ENABLED", "true")
    monkeypatch.setenv("LINGUACHAT_PASS_SIGNING_KEY", KEY)
    assert client.get("/premium/status").json()["available"] is False, "a store that forgets is never the silent default"
    monkeypatch.setenv("LINGUACHAT_PREMIUM_ALLOW_MEMORY_STORE", "true")
    assert client.get("/premium/status").json()["available"] is True


def test_the_preview_deployment_cannot_turn_premium_on(on):
    import importlib
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "api"))
    try:
        preview = importlib.import_module("index")
        assert TestClient(preview.app).get("/api/premium/status").json()["available"] is False
    finally:
        sys.path.pop(0)
        sys.modules.pop("index", None)


def test_the_server_allocates_blocks_up_to_the_limit(on):
    token = _pass()
    answers = [_ask(token) for _ in range(3)]
    assert [a["block"] for a in answers] == [0, 1, 2]
    assert [a["blocks_left"] for a in answers] == [2, 1, 0]
    assert _ask(token) == {"granted": False, "reason": "limit", "blocks_left": 0}


def test_a_client_cannot_choose_its_block(on):
    token = _pass()
    answer = client.post("/practice/extra/authorize", json={"pass_token": token, "course": "es", "block": 2}).json()
    assert answer["block"] == 0, "a block field in the request is ignored"


def test_no_pass_a_forged_pass_or_an_edited_pass_is_free(on):
    assert _ask(None)["reason"] == "free"
    assert _ask("premium=true")["reason"] == "free"
    assert _ask(issue_pass("another-key-that-is-long-enough-000000", "acct-1", lifetime_seconds=600))["reason"] == "free"
    body, mac = _pass().split(".")
    assert _ask(body[:-2] + ("AA" if body[-2:] != "AA" else "BB") + "." + mac)["reason"] == "free"


def test_an_expired_pass_says_expired(on):
    assert _ask(issue_pass(KEY, "acct-1", lifetime_seconds=60, now=1_000_000)) == {"granted": False, "reason": "expired"}


def test_passes_cannot_claim_a_lifetime_longer_than_allowed():
    state, payload = read_pass(KEY, issue_pass(KEY, "a", lifetime_seconds=10**9, now=0), now=1)
    assert state == "valid" and payload["exp"] - payload["iat"] <= 40 * 86400


def test_one_pass_is_revoked_and_stops_working(on):
    token = _pass()
    assert _ask(token)["granted"]
    _state, payload = read_pass(KEY, token)
    premium.usage_store().revoke_pass(payload["jti"])
    assert _ask(token) == {"granted": False, "reason": "expired"}
    assert _ask(_pass())["granted"], "a newer pass of the account is another pass"


def test_a_refunded_account_loses_every_pass_issued_before_the_refund(on):
    old = issue_pass(KEY, "acct-r", lifetime_seconds=600, now=time.time() - 100)
    premium.usage_store().revoke_subject("acct-r", int(time.time()) - 10)
    assert _ask(old) == {"granted": False, "reason": "expired"}
    assert _ask(_pass("acct-r"))["granted"], "a pass issued after a new purchase works"


def test_a_copied_pass_shares_its_account_limit_across_devices(on):
    token = _pass()
    other_device = issue_pass(KEY, "acct-1", lifetime_seconds=600)
    assert _ask(token)["granted"] and _ask(other_device)["granted"] and _ask(token)["granted"]
    assert _ask(other_device)["reason"] == "limit", "the limit belongs to the account, not the pass or the device"


def test_each_account_has_its_own_daily_limit(on):
    for _ in range(3):
        assert _ask(_pass("acct-a"))["granted"]
    assert _ask(_pass("acct-b"))["granted"] is True


def test_the_count_survives_a_server_restart(on):
    token = _pass()
    assert _ask(token)["block"] == 0
    premium.reset_usage_for_tests()  # a new process: only the file remains
    assert _ask(token)["block"] == 1


def test_a_revocation_survives_a_server_restart(on):
    token = _pass()
    _state, payload = read_pass(KEY, token)
    premium.usage_store().revoke_pass(payload["jti"])
    premium.reset_usage_for_tests()
    assert _ask(token)["reason"] == "expired"


def test_concurrent_requests_cannot_take_more_than_the_limit(tmp_path):
    store = SqliteUsageStore(str(tmp_path / "c.db"))
    results = []

    def take():
        results.append(store.claim("acct", "2026-11-04", 3))

    threads = [threading.Thread(target=take) for _ in range(24)]
    [t.start() for t in threads]
    [t.join() for t in threads]
    assert sorted(r for r in results if r is not None) == [0, 1, 2]
    assert store.used("acct", "2026-11-04") == 3


def test_memory_store_is_atomic_too():
    store = MemoryUsageStore()
    results = []
    threads = [threading.Thread(target=lambda: results.append(store.claim("a", "2026-11-04", 3))) for _ in range(24)]
    [t.start() for t in threads]
    [t.join() for t in threads]
    assert sorted(r for r in results if r is not None) == [0, 1, 2]


def test_the_limit_starts_over_on_the_next_utc_day(on, monkeypatch):
    day1 = datetime(2026, 11, 4, 23, 59, tzinfo=timezone.utc).timestamp()
    monkeypatch.setattr(premium.time, "time", lambda: day1)
    token = issue_pass(KEY, "acct-d", lifetime_seconds=3 * 86400, now=day1 - 60)
    for _ in range(3):
        assert _ask(token)["granted"]
    assert _ask(token)["reason"] == "limit"
    monkeypatch.setattr(premium.time, "time", lambda: day1 + 120)
    assert _ask(token)["block"] == 0, "the browser's clock plays no part: only the server's date counts"


def test_unknown_course_is_refused(on):
    assert _ask(_pass(), course="fr")["reason"] == "invalid"


def test_the_test_issuer_refuses_production(monkeypatch):
    import runpy
    import sys
    from pathlib import Path
    monkeypatch.setenv("LINGUACHAT_ENV", "production")
    monkeypatch.setenv("LINGUACHAT_PASS_SIGNING_KEY", KEY)
    monkeypatch.setattr(sys, "argv", ["issue_test_pass.py", "--sub", "x"])
    with pytest.raises(SystemExit) as stop:
        runpy.run_path(str(Path(__file__).resolve().parents[1] / "scripts" / "issue_test_pass.py"), run_name="__main__")
    assert stop.value.code == 2
