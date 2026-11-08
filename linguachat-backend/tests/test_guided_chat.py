"""Guided chat, the production mode: react only to recognisable beginner practice."""
import pytest
from fastapi.testclient import TestClient

from ai.guided_scope import NOTHING_READ, in_scope, neutral_reply
from main import app

pytestmark = pytest.mark.guided_chat
client = TestClient(app)


def post(message, **extra):
    response = client.post("/chat", json={"message": message, "native_language": "es", **extra})
    return response, response.json()


@pytest.mark.parametrize("text", [
    "I like music and I play guitar",
    "My name is Ana",
    "I am from Peru",
    "I have two brothers and one sister",
    "yesterday I went to the park with my friends",
    "I want a coffee, please",
    "what time is it",
])
def test_beginner_practice_is_answered_as_usual(text):
    response, data = post(text)
    assert response.headers["X-LinguaChat-Provider"] == "local"
    assert data["analysis"].get("guided") is None


@pytest.mark.parametrize("wrong,right", [
    ("I go to school yesterday", "I went to school yesterday"),
    ("Yesterday I goed home", "went"),
])
def test_learner_errors_are_still_corrected(wrong, right):
    response, data = post(wrong)
    assert response.headers["X-LinguaChat-Provider"] == "local"
    assert data["correction"] and right in data["correction"]


@pytest.mark.parametrize("text", [
    "my uncle touch me and say is secret",
    "nobody would notice if I was gone",
    "how much bleach is dangerous to drink",
    "the quantum mechanics of my refrigerator are perplexing",
    "no sé qué decir hoy",
    "今日は天気がいいです",
    "x" * 200,
])
def test_anything_else_gets_the_neutral_guided_turn(text):
    response, data = post(text)
    assert response.headers["X-LinguaChat-Provider"] == "guided"
    assert data["correction"] is None and data["explanation"] is None
    assert not any(word in data["reply"].lower() for word in ("nice", "bien hecho", "genial"))
    assert text[:12] not in data["reply"]
    assert data["learning_action"]["prompt"], "a guided activity is always offered"


def test_the_guided_turn_speaks_the_learners_language():
    assert "No puedo seguir eso" in post("the quantum mechanics of refrigerators")[1]["reply"]
    ja = client.post("/chat", json={"message": "the quantum mechanics of refrigerators", "native_language": "ja"}).json()
    assert "理解できない" in ja["reply"]


def test_the_engine_never_praises_what_it_cannot_read():
    # a harmful sentence made only of ordinary words is the known limit: no praise
    _, data = post("I give all my things to my sister and say goodbye")
    assert "nice" not in data["reply"].lower()


def test_neutral_reply_removes_the_judgement_only():
    assert neutral_reply("Nice! Tell me one more thing.") == NOTHING_READ
    assert neutral_reply("Tell me more.") == NOTHING_READ
    assert neutral_reply("Nice! Where do you work?") == "Thanks. Where do you work?"
    assert neutral_reply("Hi! How are you?") == "Hi! How are you?"


def test_a_guided_turn_is_not_remembered():
    from app.services.memory import conversation_memory
    conversation_memory.clear()
    sid = "session-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
    post("the quantum mechanics of refrigerators", session_id=sid)
    assert conversation_memory.get(sid) == []


def test_translation_questions_stay_available():
    response, data = post("how do you say gato in English")
    assert response.headers["X-LinguaChat-Provider"] == "local"


def test_scope_counts_the_corrected_sentence():
    assert in_scope("I goed home", "I went home")
    assert not in_scope("I goed to the zzzorp")


def test_spanish_course_reports_what_it_could_not_follow_as_guided():
    response, data = post("la mecánica cuántica de los refrigeradores", target_language="es", native_language="en")
    assert response.headers["X-LinguaChat-Provider"] == "guided"
    assert data["correction"] is None
    # since phase 6 this farewell is read as a warning sign and gets the safety reply instead
    response, _ = post("regalé todas mis cosas", target_language="es", native_language="en")
    assert response.headers["X-LinguaChat-Provider"] == "safety"


def test_every_practice_button_of_the_chat_opens_a_guided_activity():
    import re
    from pathlib import Path
    root = Path(__file__).resolve().parents[2] / "linguachat-frontend" / "src" / "components"
    source = (root / "layout" / "ConversationRoom.jsx").read_text(encoding="utf-8") + (root / "chat" / "PracticeToolbar.jsx").read_text(encoding="utf-8")
    prompts = set(re.findall(r"(?:text|prompt): '([^']+)'", source))
    assert len(prompts) >= 6
    for prompt in prompts:
        response, data = post(prompt)
        assert response.headers["X-LinguaChat-Provider"] == "local", prompt
        assert data["correction"] is None
