"""Premium extra practice — the server decides, the browser only asks.

OFF unless LINGUACHAT_PREMIUM_ENABLED=true, a signing key, AND a durable usage
store are configured. Off, every answer is "not_available" and nothing else is
read.

The extra practice itself is built on the learner's device from the existing
planner (learning/courses/courseSession.js); it costs no AI call. What the
server owns is the decision: a valid, unrevoked pass, and at most
EXTRA_BLOCKS_PER_DAY blocks per account per (server, UTC) day, claimed
atomically in the usage store. The browser cannot turn a refusal into a grant:
it needs this answer for every block, and the server chooses the block.

EXTRA_BLOCKS_PER_DAY is a provisional setting, not a commercial decision.
"""
from __future__ import annotations

import os
import time
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.billing.pass_token import read_pass, usable_key
from app.billing.usage_store import MemoryUsageStore, SqliteUsageStore

router = APIRouter()

EXTRA_BLOCKS_PER_DAY = 3
COURSES = {"en", "es"}

_stores: dict[str, object] = {}


def _key() -> str | None:
    return os.getenv("LINGUACHAT_PASS_SIGNING_KEY")


def usage_store():
    """The configured store, or None: Premium never runs on a store that forgets by accident."""
    path = os.getenv("LINGUACHAT_USAGE_DB", "").strip()
    if path:
        if path not in _stores:
            _stores[path] = SqliteUsageStore(path)
        return _stores[path]
    if os.getenv("LINGUACHAT_PREMIUM_ALLOW_MEMORY_STORE", "").strip().lower() == "true":
        return _stores.setdefault("memory", MemoryUsageStore())
    return None


def premium_available() -> bool:
    return (os.getenv("LINGUACHAT_PREMIUM_ENABLED", "").strip().lower() == "true"
            and usable_key(_key()) and usage_store() is not None)


def _utc_day(now: float) -> str:
    return datetime.fromtimestamp(now, tz=timezone.utc).strftime("%Y-%m-%d")


def reset_usage_for_tests() -> None:
    _stores.clear()


@router.get("/premium/status")
def status():
    return {"available": premium_available(), "extra_blocks_per_day": EXTRA_BLOCKS_PER_DAY}


class ExtraBlockRequest(BaseModel):
    pass_token: str | None = Field(default=None, max_length=1024)
    course: str = Field(min_length=2, max_length=8)


@router.post("/practice/extra/authorize")
def authorize(req: ExtraBlockRequest):
    if not premium_available():
        return {"granted": False, "reason": "not_available"}
    if req.course not in COURSES:
        return {"granted": False, "reason": "invalid"}
    now = time.time()
    state, payload = read_pass(_key(), req.pass_token, now=now)
    if state == "invalid":
        return {"granted": False, "reason": "free"}
    if state == "expired":
        return {"granted": False, "reason": "expired"}
    store = usage_store()
    if store.is_revoked(payload["jti"], payload["sub"], payload["iat"]):
        return {"granted": False, "reason": "expired"}
    day = _utc_day(now)
    block = store.claim(payload["sub"], day, EXTRA_BLOCKS_PER_DAY)
    if block is None:
        return {"granted": False, "reason": "limit", "blocks_left": 0}
    return {"granted": True, "block": block, "blocks_left": EXTRA_BLOCKS_PER_DAY - block - 1, "expires_at": payload["exp"]}
