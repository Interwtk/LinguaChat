"""Signed Premium passes — the server's word on who may use a Premium feature.

There is no database and the server does not verify sign-in tokens (CLAUDE.md
keeps Supabase out of the backend). So the server's decision travels as a
short, signed pass:

    base64url(json payload) "." base64url(HMAC-SHA256(payload, key))

payload: {"v": 1, "sub": <account id>, "plan": "premium", "iat": <s>, "exp": <s>}

The browser stores the pass as an opaque string. It cannot mint or extend one:
any change to the payload breaks the signature, and the key exists only on the
server (LINGUACHAT_PASS_SIGNING_KEY). A pass is issued after a verified
provider event (entitlements.apply_event); until payments are authorized, only
the test-mode issuer in scripts/issue_test_pass.py can create one.

Known limit, stated rather than hidden: a pass is a bearer token. Someone who
copies it can use it until it expires. Binding it to the signed-in account
needs the server to verify the Supabase session, which the current contract
does not allow (docs/architecture/premium-practice.md).
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time

PASS_VERSION = 1
MIN_KEY_LENGTH = 32
MAX_LIFETIME_SECONDS = 40 * 24 * 60 * 60  # one billing month plus grace


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def _mac(key: str, body: str) -> str:
    return _b64(hmac.new(key.encode("utf-8"), body.encode("ascii"), hashlib.sha256).digest())


def usable_key(key: str | None) -> bool:
    return isinstance(key, str) and len(key) >= MIN_KEY_LENGTH


def issue_pass(key: str, sub: str, *, lifetime_seconds: int, now: float | None = None) -> str:
    if not usable_key(key):
        raise ValueError("signing key missing or too short")
    if not sub or not isinstance(sub, str) or len(sub) > 128:
        raise ValueError("invalid subject")
    lifetime = max(60, min(int(lifetime_seconds), MAX_LIFETIME_SECONDS))
    at = int(time.time() if now is None else now)
    payload = {"v": PASS_VERSION, "sub": sub, "plan": "premium", "iat": at, "exp": at + lifetime}
    body = _b64(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8"))
    return f"{body}.{_mac(key, body)}"


def read_pass(key: str | None, token: str | None, *, now: float | None = None) -> tuple[str, dict | None]:
    """("valid", payload) | ("expired", payload) | ("invalid", None)."""
    if not usable_key(key) or not isinstance(token, str) or token.count(".") != 1 or len(token) > 1024:
        return "invalid", None
    body, mac = token.split(".")
    if not hmac.compare_digest(_mac(key, body), mac):
        return "invalid", None
    try:
        payload = json.loads(_unb64(body))
    except (ValueError, UnicodeDecodeError):
        return "invalid", None
    if not isinstance(payload, dict) or payload.get("v") != PASS_VERSION or payload.get("plan") != "premium":
        return "invalid", None
    exp, iat = payload.get("exp"), payload.get("iat")
    if not isinstance(exp, int) or not isinstance(iat, int) or exp - iat > MAX_LIFETIME_SECONDS:
        return "invalid", None
    at = time.time() if now is None else now
    return ("valid" if at < exp else "expired"), payload
