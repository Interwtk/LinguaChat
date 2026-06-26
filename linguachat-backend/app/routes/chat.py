from fastapi import APIRouter, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ai.engine import generate_response
from ai.schemas import ChatMode, ChatResult, LanguageInfo, LanguageLevel, MissionContext
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

ALLOWED_TUTOR_PREFERENCES = {
    "correction_style",
    "tone",
    "pace",
    "explanation_depth",
    "interests",
    "goal",
    "learner_style",
}

ALLOWED_COMPANIONS = {"lingua", "lingo", "chatto"}

LANGUAGE_NAMES = {
    "ar": "Arabic",
    "de": "German",
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "hi": "Hindi",
    "it": "Italian",
    "ja": "Japanese",
    "ko": "Korean",
    "pt": "Portuguese",
    "ru": "Russian",
    "tr": "Turkish",
    "zh": "Chinese",
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


def _safe_tutor_preferences(preferences: dict) -> dict:
    safe = {}
    for key in ALLOWED_TUTOR_PREFERENCES:
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
    native_language: str | LanguageInfo | dict | None = None
    interface_language: str | LanguageInfo | dict | None = None
    target_language: str | LanguageInfo | dict | None = None
    mission_context: MissionContext | dict | None = None
    missionContext: MissionContext | dict | None = None
    tutor_preferences: dict | None = None
    active_companion: str | None = None
    user_id: str | None = None


def _language_name(base: str) -> str:
    return LANGUAGE_NAMES.get(base.lower(), base.upper() if base else "English")


def _model_to_dict(model, **kwargs) -> dict:
    if hasattr(model, "model_dump"):
        return model.model_dump(**kwargs)
    return model.dict(**kwargs)


def _normalize_language(value, fallback_code: str = "en") -> LanguageInfo:
    if isinstance(value, LanguageInfo):
        raw = _model_to_dict(value)
    elif isinstance(value, dict):
        raw = value
    elif isinstance(value, str):
        raw = {"code": value}
    else:
        raw = {"code": fallback_code}

    code = str(raw.get("code") or fallback_code).strip() or fallback_code
    code = code.replace("_", "-")
    base = str(raw.get("base") or code.split("-", 1)[0] or fallback_code).strip().lower()
    name = str(raw.get("name") or _language_name(base)).strip()
    return LanguageInfo(code=code, base=base, name=name)


def _normalize_target_language(value) -> LanguageInfo:
    return LanguageInfo(code="en", base="en", name="English")


def _normalize_mission_context(value) -> dict | None:
    if value is None:
        return None
    if isinstance(value, MissionContext):
        return _model_to_dict(value, exclude_none=True)
    if isinstance(value, dict):
        return _model_to_dict(MissionContext(**value), exclude_none=True)
    return None


@router.post("/chat", response_model=ChatResult)
def chat(req: ChatRequest, response: Response):
    session_id = req.session_id.strip()
    message = req.message.strip()

    try:
        history = conversation_memory.context(session_id, req.history)
        preferences = _safe_preferences(req.preferences)
        tutor_preferences = _safe_tutor_preferences(req.tutor_preferences or {})
        active_companion = (req.active_companion or "lingua").strip().lower()
        if active_companion not in ALLOWED_COMPANIONS:
            active_companion = "lingua"
        native_language = _normalize_language(
            req.native_language or preferences.get("native_language") or "en"
        )
        target_language = _normalize_target_language(req.target_language)
        mission_context = _normalize_mission_context(req.mission_context or req.missionContext)
        user_profile = {
            "level": req.level.value,
            "native_language": native_language,
            "target_language": target_language,
            "interests": preferences.get("interests") or preferences.get("topics") or [],
            "preferences": preferences,
            "tutor_preferences": tutor_preferences,
            "active_companion": active_companion,
            "recent_errors": conversation_memory.recent_errors(session_id),
            "mission_context": mission_context,
        }

        generated = generate_response(
            user_message=message,
            level=req.level,
            user_profile=user_profile,
            history=history,
        )
        result = generated.response
        result.detected_language = result.detected_language or native_language
        result.target_language = result.target_language or target_language
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
