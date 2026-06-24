from fastapi import APIRouter, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ai.engine import generate_response
from ai.schemas import ChatMode, ChatResult, LanguageLevel
from app.services.memory import conversation_memory


router = APIRouter()

ALLOWED_PREFERENCES = {
    "goal",
    "style",
    "tutor_personality",
    "topics",
    "interests",
    "native_language",
    "practice_intent",
    "detected_level",
    "correction_style",
}


def _safe_preferences(preferences: dict) -> dict:
    safe = {}
    for key in ALLOWED_PREFERENCES:
        value = preferences.get(key)
        if isinstance(value, str):
            safe[key] = value.strip()[:80]
        elif isinstance(value, list):
            safe[key] = [item.strip()[:80] for item in value[:10] if isinstance(item, str)]
    return safe


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    level: LanguageLevel = LanguageLevel.A1
    mode: str | None = None
    history: list[dict] = Field(default_factory=list)
    session_id: str = Field(default="local-session", min_length=1, max_length=128)
    preferences: dict = Field(default_factory=dict)
    user_id: str | None = None


@router.post("/chat", response_model=ChatResult)
def chat(req: ChatRequest, response: Response):
    session_id = req.session_id.strip()
    message = req.message.strip()

    try:
        history = conversation_memory.context(session_id, req.history)
        preferences = _safe_preferences(req.preferences)
        user_profile = {
            "level": req.level.value,
            "native_language": preferences.get("native_language") or "Spanish",
            "target_language": "English",
            "interests": preferences.get("interests") or preferences.get("topics") or [],
            "preferences": preferences,
            "recent_errors": conversation_memory.recent_errors(session_id),
        }

        generated = generate_response(
            user_message=message,
            level=req.level,
            user_profile=user_profile,
            history=history,
        )
        result = generated.response
        response.headers["X-LinguaChat-Provider"] = generated.provider
        conversation_memory.add(session_id, message, result, req.level)
        return result
    except Exception:
        return JSONResponse(
            status_code=500,
            content={
                "reply": "Sorry, something went wrong. Please try again.",
                "correction": None,
                "explanation": None,
                "suggestion": "Send a shorter message or restart the backend.",
                "mode": ChatMode.CHAT.value,
                "learning_action": None,
                "focus": None,
                "word_to_use": None,
            },
            headers={"X-LinguaChat-Provider": "local"},
        )
