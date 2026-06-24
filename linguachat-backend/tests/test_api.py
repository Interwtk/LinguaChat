import pytest
from fastapi.testclient import TestClient

from ai.openai_tutor import openai_tutor
from app.services.memory import conversation_memory
from main import app


client = TestClient(app)
EXPECTED_KEYS = {
    "reply",
    "correction",
    "explanation",
    "suggestion",
    "mode",
    "learning_action",
    "focus",
    "word_to_use",
    "detected_language",
    "target_language",
    "mission_feedback",
}
BASE_KEYS = {"reply", "correction", "explanation", "suggestion", "mode"}


@pytest.fixture(autouse=True)
def clean_local_state(monkeypatch):
    monkeypatch.setenv("OPENAI_ENABLED", "true")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    conversation_memory.clear()


def post_chat(message: str, level: str = "A1", session_id: str = "test-session"):
    return client.post(
        "/chat",
        json={
            "session_id": session_id,
            "message": message,
            "level": level,
            "mode": "Friendly",
            "history": [],
        },
    )


def post_chat_payload(payload: dict):
    return client.post("/chat", json=payload)


def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "LinguaChat API running"}


def test_without_openai_key_uses_local_fallback():
    response = post_chat("Hello")

    assert response.status_code == 200
    assert response.headers["X-LinguaChat-Provider"] == "local"
    assert response.json()["reply"]


def test_chat_endpoint_returns_stable_contract():
    response = post_chat("Hello")
    data = response.json()

    assert response.status_code == 200
    assert set(data.keys()) == EXPECTED_KEYS
    assert BASE_KEYS.issubset(data.keys())
    assert data["mode"] == "chat"
    assert data["correction"] is None
    assert data["explanation"] is None


def test_translation_request():
    response = post_chat("como se dice quiero viajar", level="A2")
    data = response.json()

    assert response.status_code == 200
    assert data["mode"] == "translation"
    assert data["reply"] == "I want to travel (quiero viajar)"
    assert data["correction"] is None


def test_chat_with_mission_context_without_openai_does_not_break():
    response = post_chat_payload({
        "session_id": "mission-session",
        "message": "I want to travel",
        "level": "A1",
        "history": [],
        "native_language": {"code": "es-CO", "base": "es", "name": "Spanish"},
        "target_language": {"code": "en", "base": "en", "name": "English"},
        "mission_context": {
            "mission_id": "travel-a1",
            "mission_title": "Pedir ayuda en un viaje",
            "step_id": "travel-a1-1",
            "step_type": "translate",
            "target_skill": "travel",
            "instruction": "Escribe esta idea en ingles.",
            "prompt": "Quiero viajar.",
            "expected_pattern": "i want to travel",
        },
    })
    data = response.json()

    assert response.status_code == 200
    assert response.headers["X-LinguaChat-Provider"] == "local"
    assert data["mission_feedback"]["is_correct"] is True
    assert 0 <= data["mission_feedback"]["score"] <= 100
    assert data["mission_feedback"]["should_advance"] is True
    assert data["target_language"]["name"] == "English"


def test_old_native_language_string_still_works():
    response = post_chat_payload({
        "session_id": "legacy-language",
        "message": "Hello",
        "level": "A1",
        "native_language": "es",
    })
    data = response.json()

    assert response.status_code == 200
    assert data["detected_language"]["base"] == "es"
    assert data["detected_language"]["name"] == "Spanish"


def test_new_native_language_object_and_unlisted_language_work():
    response = post_chat_payload({
        "session_id": "ja-language",
        "message": "Hello",
        "level": "A1",
        "native_language": {"code": "ja-JP"},
        "target_language": {"code": "fr"},
    })
    data = response.json()

    assert response.status_code == 200
    assert data["detected_language"]["code"] == "ja-JP"
    assert data["detected_language"]["base"] == "ja"
    assert data["target_language"] == {"code": "en", "base": "en", "name": "English"}


def test_grammar_correction():
    response = post_chat("how you are")
    data = response.json()

    assert response.status_code == 200
    assert data["mode"] == "correction"
    assert data["correction"] == "How are you?"
    assert data["explanation"]


def test_correct_greeting_is_not_corrected():
    response = post_chat("Hello")
    data = response.json()

    assert response.status_code == 200
    assert data["mode"] == "chat"
    assert data["correction"] is None
    assert data["explanation"] is None


def test_openai_error_uses_local_fallback(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")

    def fail_openai(**_kwargs):
        raise TimeoutError("simulated timeout")

    monkeypatch.setattr(openai_tutor, "generate", fail_openai)
    response = post_chat("how you are")

    assert response.status_code == 200
    assert response.headers["X-LinguaChat-Provider"] == "local"
    assert response.json()["correction"] == "How are you?"


@pytest.mark.parametrize("level", ["A1", "A2", "B1", "B2", "C1", "C2"])
def test_all_cefr_levels_are_supported(level):
    response = post_chat("Hello", level=level, session_id=f"level-{level}")

    assert response.status_code == 200
    assert BASE_KEYS.issubset(response.json().keys())


def test_chat_response_includes_learning_action():
    response = post_chat("how you are")
    data = response.json()

    assert response.status_code == 200
    assert data["learning_action"]["prompt"]
    assert data["learning_action"]["type"] in {
        "complete_sentence",
        "answer_question",
        "rewrite",
        "choose_option",
        "ask_back",
        "use_word",
    }


def test_memory_keeps_only_last_eight_interactions():
    for index in range(10):
        post_chat(f"Message {index}", session_id="memory-session")

    history = conversation_memory.get("memory-session")

    assert len(history) == 8
    assert history[0]["user"] == "Message 2"
    assert history[-1]["user"] == "Message 9"


def test_memory_is_isolated_by_session_id():
    post_chat("Hello", session_id="session-a")
    post_chat("how you are", session_id="session-b")

    session_a = conversation_memory.get("session-a")
    session_b = conversation_memory.get("session-b")

    assert len(session_a) == 1
    assert len(session_b) == 1
    assert session_a[0]["user"] == "Hello"
    assert session_b[0]["user"] == "how you are"


def test_client_history_can_restore_short_context():
    context = conversation_memory.context(
        "new-session",
        [
            {"role": "user", "text": "I like travel"},
            {"role": "lingua", "text": "Where do you want to go?"},
        ],
    )

    assert context == [
        {
            "user": "I like travel",
            "assistant": "Where do you want to go?",
            "correction": None,
            "mode": "chat",
            "level": None,
        }
    ]


def test_memory_redacts_common_sensitive_values():
    context = conversation_memory.context(
        "redaction-session",
        [
            {"role": "user", "text": "My email is learner@example.com"},
            {"role": "lingua", "text": "Thanks, but we do not need personal details."},
        ],
    )

    assert context[0]["user"] == "My email is [email]"
