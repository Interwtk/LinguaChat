"""Premium extra practice: off by default, decided by the server, fail closed."""
import pytest
from fastapi.testclient import TestClient

from app.billing.pass_token import issue_pass, read_pass
from app.routes import premium
from main import app

KEY = "test-only-signing-key-0123456789abcdef"
client = TestClient(app)


@pytest.fixture(autouse=True)
def _clean(monkeypatch):
    premium.reset_usage_for_tests()
    monkeypatch.delenv("LINGUACHAT_PREMIUM_ENABLED", raising=False)
    monkeypatch.delenv("LINGUACHAT_PASS_SIGNING_KEY", raising=False)
    yield
    premium.reset_usage_for_tests()


def _on(monkeypatch):
    monkeypatch.setenv("LINGUACHAT_PREMIUM_ENABLED", "true")
    monkeypatch.setenv("LINGUACHAT_PASS_SIGNING_KEY", KEY)


def _ask(token, block=0, course="es"):
    return client.post("/practice/extra/authorize", json={"pass_token": token, "course": course, "block": block}).json()


def test_premium_is_off_by_default_and_says_so():
    assert client.get("/premium/status").json() == {"available": False, "extra_blocks_per_day": 3}
    assert _ask(issue_pass(KEY, "a", lifetime_seconds=600)) == {"granted": False, "reason": "not_available"}


def test_enabling_needs_a_real_key_too(monkeypatch):
    monkeypatch.setenv("LINGUACHAT_PREMIUM_ENABLED", "true")
    monkeypatch.setenv("LINGUACHAT_PASS_SIGNING_KEY", "short")
    assert client.get("/premium/status").json()["available"] is False


def test_the_preview_deployment_cannot_turn_premium_on(monkeypatch):
    import importlib
    import sys
    from pathlib import Path
    monkeypatch.setenv("LINGUACHAT_PREMIUM_ENABLED", "true")
    monkeypatch.setenv("LINGUACHAT_PASS_SIGNING_KEY", KEY)
    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "api"))
    try:
        preview = importlib.import_module("index")
        preview_client = TestClient(preview.app)
        assert preview_client.get("/api/premium/status").json()["available"] is False
    finally:
        sys.path.pop(0)
        sys.modules.pop("index", None)


def test_a_valid_pass_is_granted_and_counted(monkeypatch):
    _on(monkeypatch)
    token = issue_pass(KEY, "acct-1", lifetime_seconds=600)
    first = _ask(token, 0)
    assert first["granted"] is True and first["blocks_left"] == 2
    assert _ask(token, 0)["blocks_left"] == 2, "asking again for the same block is not a new block"
    assert _ask(token, 1)["blocks_left"] == 1
    assert _ask(token, 2)["blocks_left"] == 0
    assert _ask(token, 3) == {"granted": False, "reason": "limit", "blocks_left": 0}


def test_no_pass_a_forged_pass_or_an_edited_pass_is_free(monkeypatch):
    _on(monkeypatch)
    assert _ask(None)["reason"] == "free"
    assert _ask("premium=true")["reason"] == "free"
    other_key = issue_pass("another-key-that-is-long-enough-000000", "acct-1", lifetime_seconds=600)
    assert _ask(other_key)["reason"] == "free"
    good = issue_pass(KEY, "acct-1", lifetime_seconds=600)
    body, mac = good.split(".")
    tampered = body[:-2] + ("AA" if body[-2:] != "AA" else "BB") + "." + mac
    assert _ask(tampered)["reason"] == "free"


def test_an_expired_pass_says_expired(monkeypatch):
    _on(monkeypatch)
    old = issue_pass(KEY, "acct-1", lifetime_seconds=60, now=1_000_000)
    assert _ask(old) == {"granted": False, "reason": "expired"}


def test_passes_cannot_claim_a_lifetime_longer_than_allowed():
    token = issue_pass(KEY, "a", lifetime_seconds=10**9, now=0)
    state, payload = read_pass(KEY, token, now=1)
    assert state == "valid" and payload["exp"] - payload["iat"] <= 40 * 86400


def test_the_server_allocates_the_next_block_so_returning_never_replays(monkeypatch):
    _on(monkeypatch)
    token = issue_pass(KEY, "acct-n", lifetime_seconds=600)
    ask = lambda: client.post("/practice/extra/authorize", json={"pass_token": token, "course": "es"}).json()
    assert [ask()["block"] for _ in range(3)] == [0, 1, 2]
    assert ask() == {"granted": False, "reason": "limit", "blocks_left": 0}


def test_each_account_has_its_own_daily_limit(monkeypatch):
    _on(monkeypatch)
    a, b = issue_pass(KEY, "acct-a", lifetime_seconds=600), issue_pass(KEY, "acct-b", lifetime_seconds=600)
    for i in range(3):
        assert _ask(a, i)["granted"]
    assert _ask(b, 0)["granted"] is True


def test_unknown_course_is_refused(monkeypatch):
    _on(monkeypatch)
    assert _ask(issue_pass(KEY, "a", lifetime_seconds=600), course="fr")["reason"] == "invalid"


def test_the_test_issuer_refuses_production(monkeypatch, capsys):
    import runpy
    import sys
    from pathlib import Path
    monkeypatch.setenv("LINGUACHAT_ENV", "production")
    monkeypatch.setenv("LINGUACHAT_PASS_SIGNING_KEY", KEY)
    monkeypatch.setattr(sys, "argv", ["issue_test_pass.py", "--sub", "x"])
    with pytest.raises(SystemExit) as stop:
        runpy.run_path(str(Path(__file__).resolve().parents[1] / "scripts" / "issue_test_pass.py"), run_name="__main__")
    assert stop.value.code == 2
