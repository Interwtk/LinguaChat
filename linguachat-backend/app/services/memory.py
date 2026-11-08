from __future__ import annotations

import re
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


class ConversationMemory:
    def __init__(self, max_interactions: int = 8):
        self.max_interactions = max_interactions
        self._store: dict[str, list[dict]] = {}
        self._lock = Lock()

    def get(self, session_id: str) -> list[dict]:
        with self._lock:
            return list(self._store.get(session_id, []))

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
            history = self._store.setdefault(session_id, [])
            history.append(interaction)
            self._store[session_id] = history[-self.max_interactions :]

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
            else:
                self._store.pop(session_id, None)


conversation_memory = ConversationMemory(max_interactions=8)
