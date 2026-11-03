"""Premium extra practice — the server decides, the browser only asks.

OFF unless both LINGUACHAT_PREMIUM_ENABLED=true and a signing key are set.
Off, every answer is "not_available" and nothing else is read.

The extra practice itself is built on the learner's device from the existing
planner (learning/courses/extraPractice.js); it costs no AI call. What the
server owns is the decision: a valid pass, and at most EXTRA_BLOCKS_PER_DAY
blocks per account per (server, UTC) day. The browser cannot turn a refusal
into a grant: it needs this answer for every block.

The day counter lives in this process's memory (no database): a restart or a
second instance forgets it. The limit is therefore a fair-use limit, not a
security boundary, and is documented as such.
"""
from __future__ import annotations

import os
import time
from datetime import datetime, timezone
from threading import Lock

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.billing.pass_token import read_pass, usable_key

router = APIRouter()

EXTRA_BLOCKS_PER_DAY = 3
COURSES = {"en", "es"}
_MAX_TRACKED = 20000

_lock = Lock()
_used: dict[tuple[str, str], set[int]] = {}


def _key() -> str | None:
    return os.getenv("LINGUACHAT_PASS_SIGNING_KEY")


def premium_available() -> bool:
    return os.getenv("LINGUACHAT_PREMIUM_ENABLED", "").strip().lower() == "true" and usable_key(_key())


def _utc_day(now: float) -> str:
    return datetime.fromtimestamp(now, tz=timezone.utc).strftime("%Y-%m-%d")


def reset_usage_for_tests() -> None:
    with _lock:
        _used.clear()


@router.get("/premium/status")
def status():
    return {"available": premium_available(), "extra_blocks_per_day": EXTRA_BLOCKS_PER_DAY}


class ExtraBlockRequest(BaseModel):
    pass_token: str | None = Field(default=None, max_length=1024)
    course: str = Field(min_length=2, max_length=8)
    block: int = Field(ge=0, le=50)


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
    day = _utc_day(now)
    slot = (payload["sub"], day)
    with _lock:
        used = _used.setdefault(slot, set())
        # asking again for a block already granted today is not a new block
        if req.block not in used:
            if len(used) >= EXTRA_BLOCKS_PER_DAY:
                return {"granted": False, "reason": "limit", "blocks_left": 0}
            used.add(req.block)
        if len(_used) > _MAX_TRACKED:
            for old in [s for s in _used if s[1] != day]:
                _used.pop(old, None)
        left = EXTRA_BLOCKS_PER_DAY - len(used)
    return {"granted": True, "blocks_left": left, "expires_at": payload["exp"]}
