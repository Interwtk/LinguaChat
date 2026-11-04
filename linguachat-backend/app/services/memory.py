from __future__ import annotations

import re
import time
from threading import Lock

from ai.schemas import ChatResult, LanguageLevel


MAX_TEXT_LENGTH = 1000
EMAIL_PATTERN = re.compile(r"\b[^\s@]+@[^\s@]+\.[^\s@]+\b")
SECRET_PATTERN = re.compile(r"\bsk-[A-Za-z0-9_-]{8,}\b")
LONG_NUMBER_PATTERN = re.compile(r"\b\d{7,}\b")


def _safe_text(value: object) -> str:
    if not isinstance(value, str):
        return ""
    text = value.strip()[:MAX_TEXT_LENGTH]
    text = EMAIL_PATTERN.sub("[email]", text)
    text = SECRET_PATTERN.sub("[secret]", text)
    return LONG_NUMBER_PATTERN.sub("[number]", text)


# How long a conversation is remembered after its last message, and how many
# conversations the process keeps at most (the oldest go first). Memory lives
# only in this process: a restart forgets everything.
IDLE_SECONDS = 24 * 60 * 60
MAX_SESSIONS = 5000


class ConversationMemory:
    def __init__(self, max_interactions: int = 8, idle_seconds: float = IDLE_SECONDS,
                 max_sessions: int = MAX_SESSIONS, clock=time.monotonic):
        self.max_interactions = max_interactions
        self.idle_seconds = idle_seconds
        self.max_sessions = max_sessions
        self._clock = clock
        self._store: dict[str, list[dict]] = {}
        self._touched: dict[str, float] = {}
        self._recent_user: dict[str, list[str]] = {}
        self._lock = Lock()

    def _expire(self, now: float) -> None:
        # caller holds the lock
        for sid in [s for s, at in self._touched.items() if now - at > self.idle_seconds]:
            self._drop(sid)
        while len(self._touched) > self.max_sessions:
            self._drop(min(self._touched, key=self._touched.get))

    def _drop(self, sid: str) -> None:
        # caller holds the lock
        self._store.pop(sid, None)
        self._touched.pop(sid, None)
        self._recent_user.pop(sid, None)

    def get(self, session_id: str) -> list[dict]:
        with self._lock:
            self._expire(self._clock())
            return list(self._store.get(session_id, []))

    def note_user_turn(self, session_id: str, message: str) -> None:
        """The last three things the learner wrote, masked, for reading context only."""
        with self._lock:
            now = self._clock()
            turns = self._recent_user.setdefault(session_id, [])
            turns.append(_safe_text(message))
            self._recent_user[session_id] = turns[-3:]
            self._touched[session_id] = now
            self._expire(now)

    def recent_user_turns(self, session_id: str) -> list[str]:
        with self._lock:
            self._expire(self._clock())
            return list(self._recent_user.get(session_id, []))

    def context(self, session_id: str, client_history: list[dict] | None = None) -> list[dict]:
        server_history = self.get(session_id)
        if server_history:
            return server_history[-self.max_interactions :]

        interactions: list[dict] = []
        pending_user = ""

        for item in (client_history or [])[-16:]:
            role = _safe_text(item.get("role")).lower()
            text = _safe_text(item.get("text") or item.get("content"))
            if not text:
                continue
            if role == "user":
                pending_user = text
            elif role in {"assistant", "lingua"} and pending_user:
                correction = _safe_text(item.get("correction")) or None
                interactions.append(
                    {
                        "user": pending_user,
                        "assistant": text,
                        "correction": correction,
                        "mode": "chat",
                        "level": None,
                    }
                )
                pending_user = ""

        return interactions[-self.max_interactions :]

    def add(
        self,
        session_id: str,
        user_message: str,
        result: ChatResult,
        level: LanguageLevel,
    ) -> None:
        interaction = {
            "user": _safe_text(user_message),
            "assistant": _safe_text(result.reply),
            "correction": _safe_text(result.correction) or None,
            "mode": result.mode.value,
            "level": level.value,
            # Rule ids only (e.g. "past_irregular"): never the learner's words.
            "error_types": [
                str(f.get("rule"))[:32] for f in ((result.analysis or {}).get("findings") or [])
                if isinstance(f, dict) and f.get("rule")
            ][:4],
        }

        with self._lock:
            now = self._clock()
            history = self._store.setdefault(session_id, [])
            history.append(interaction)
            self._store[session_id] = history[-self.max_interactions :]
            self._touched[session_id] = now
            self._expire(now)

    def recent_errors(self, session_id: str, limit: int = 3) -> list[str]:
        errors = [item["correction"] for item in self.get(session_id) if item.get("correction")]
        return errors[-limit:]

    def recent_error_types(self, session_id: str, limit: int = 6) -> list[str]:
        types = [t for item in self.get(session_id) for t in item.get("error_types") or []]
        return types[-limit:]

    def clear(self, session_id: str | None = None) -> None:
        with self._lock:
            if session_id is None:
                self._store.clear()
                self._touched.clear()
                self._recent_user.clear()
            else:
                self._drop(session_id)

    def forget(self, session_ids: list[str]) -> int:
        """Drop these conversations now. Returns how many were held."""
        with self._lock:
            held = 0
            for sid in session_ids:
                held += sid in self._touched
                self._drop(sid)
            return held

    def size(self) -> int:
        with self._lock:
            return len(self._touched)


conversation_memory = ConversationMemory(max_interactions=8)
