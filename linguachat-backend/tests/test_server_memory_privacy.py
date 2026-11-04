"""What the server remembers of a conversation, for how long, and how it ends.

The privacy policy draft says: the last 8 turns of a conversation are kept in
the server process's memory, for at most 24 hours after the last message, and
the learner can erase them ("Delete my data" calls /chat/forget).
"""

import pytest
from fastapi.testclient import TestClient

from app.routes.chat import SHARED_SESSION
from app.services.memory import ConversationMemory, conversation_memory
from ai.schemas import ChatMode, ChatResult, LanguageLevel
from main import app

client = TestClient(app)


def _result(reply="ok"):
    return ChatResult(reply=reply, correction=None, explanation=None, suggestion=None, mode=ChatMode.CHAT)


@pytest.mark.real_id_floor
def test_a_request_without_its_own_session_id_is_not_remembered():
    conversation_memory.clear()
    client.post("/chat", json={"message": "I goed to the park yesterday"})
    assert conversation_memory.get(SHARED_SESSION) == []
    assert conversation_memory.size() == 0


@pytest.mark.real_id_floor
def test_one_client_turns_never_reach_another_client_without_a_session_id():
    conversation_memory.clear()
    client.post("/chat", json={"message": "My name is Ana and I live in Santiago"})
    other = client.post("/chat", json={"message": "hello"}).json()
    assert "Ana" not in str(other) and "Santiago" not in str(other)


def test_a_conversation_with_its_own_id_is_remembered_and_forgotten_on_request():
    conversation_memory.clear()
    client.post("/chat", json={"message": "I like music", "session_id": "learner-a"})
    client.post("/chat", json={"message": "I like music", "session_id": "learner-a:es", "target_language": "es"})
    assert conversation_memory.get("learner-a")
    response = client.post("/chat/forget", json={"session_ids": ["learner-a", "learner-a:es", "never-seen"]})
    assert response.status_code == 200
    assert response.json() == {"forgotten": 2}
    assert conversation_memory.get("learner-a") == [] and conversation_memory.get("learner-a:es") == []


def test_forget_returns_no_content_and_touches_only_the_named_conversations():
    conversation_memory.clear()
    client.post("/chat", json={"message": "I like music", "session_id": "learner-a"})
    client.post("/chat", json={"message": "I like films", "session_id": "learner-b"})
    body = client.post("/chat/forget", json={"session_ids": ["learner-a"]}).json()
    assert set(body) == {"forgotten"}
    assert conversation_memory.get("learner-b")


def test_forget_accepts_a_few_ids_only():
    assert client.post("/chat/forget", json={"session_ids": []}).status_code == 422
    assert client.post("/chat/forget", json={"session_ids": [f"s{i}" for i in range(5)]}).status_code == 422


@pytest.mark.real_id_floor
def test_a_guessable_conversation_id_is_served_but_never_remembered():
    conversation_memory.clear()
    for guess in ("1", "user-42", "learner-a", "ana@example.test"):
        assert client.post("/chat", json={"message": "I like music", "session_id": guess}).status_code == 200
    assert conversation_memory.size() == 0


@pytest.mark.real_id_floor
def test_the_id_the_app_really_sends_is_remembered():
    conversation_memory.clear()
    app_id = "session-3f2b8c1e-9a4d-4e6b-8f10-2c7d5a9e1b34"
    client.post("/chat", json={"message": "I like music", "session_id": app_id})
    client.post("/chat", json={"message": "hola", "session_id": f"{app_id}:es", "target_language": "es"})
    assert conversation_memory.get(app_id) and conversation_memory.get(f"{app_id}:es")


def test_user_id_in_a_request_authorizes_nothing_and_is_not_stored():
    conversation_memory.clear()
    client.post("/chat", json={"message": "I like music", "session_id": "learner-a", "user_id": "someone-else"})
    assert "someone-else" not in str(conversation_memory.get("learner-a"))
    assert conversation_memory.get("someone-else") == []


def test_a_conversation_is_dropped_24_hours_after_its_last_message():
    now = [0.0]
    memory = ConversationMemory(idle_seconds=24 * 3600, clock=lambda: now[0])
    memory.add("s", "hello", _result(), LanguageLevel.A1)
    now[0] = 24 * 3600 - 1
    assert memory.get("s")
    memory.add("s", "again", _result(), LanguageLevel.A1)
    now[0] += 24 * 3600 + 1
    assert memory.get("s") == []


def test_the_process_keeps_a_bounded_number_of_conversations():
    now = [0.0]
    memory = ConversationMemory(max_sessions=3, clock=lambda: now[0])
    for i in range(5):
        now[0] += 1
        memory.add(f"s{i}", "hello", _result(), LanguageLevel.A1)
    assert memory.size() == 3
    assert memory.get("s0") == [] and memory.get("s1") == [] and memory.get("s4")
