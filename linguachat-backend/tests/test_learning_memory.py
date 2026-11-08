"""P3: the chat's side of pedagogical continuity.

The server forgets a conversation after a few turns. The learner's device keeps
a compact record (rule ids, a status, verbs already practised — never
sentences) and sends it with each turn. These tests prove the server uses it
only in the narrow ways it should, validates it, and reports correct uses as
observations rather than verdicts.
"""
import pytest
from fastapi.testclient import TestClient

from ai.grammar_check import correct_uses
from ai.local_engine import assess, choose_strategy
from ai.tutor_i18n import MESSAGES
from app.routes.chat import _safe_learning_memory
from app.services.memory import conversation_memory
from main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def fresh_memory(monkeypatch):
    monkeypatch.setenv("LINGUACHAT_PROVIDER", "local")
    conversation_memory.clear()
    yield
    conversation_memory.clear()


def chat(message, *, session="m", memory=None, lang="es"):
    payload = {"session_id": session, "message": message, "level": "A1", "native_language": lang}
    if memory is not None:
        payload["learning_memory"] = memory
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    return response.json()


# --- correct uses are observations, and only unambiguous ones ----------------

@pytest.mark.parametrize("sentence, forms", [
    ("Yesterday I went to the park and ate pizza.", ["went", "ate"]),
    ("Last week we took the train and wrote postcards.", ["took", "wrote"]),
    ("I have eaten already.", []),            # participle, not the simple past
    ("The cake was made by my mother.", []),  # passive
    ("I left the keys on the left.", []),     # "left" is also a direction
    ("I put it there yesterday.", []),        # same form as the base
    ("Did you go?", []),                      # "did" is an auxiliary here
    ("Yesterday I goed to school.", []),      # an error is not a use
    ("I go to school.", []),
])
def test_correct_uses_are_unambiguous(sentence, forms):
    assert [u["form"] for u in correct_uses(sentence)] == forms
    assert all(u["rule"] == "past_irregular" for u in correct_uses(sentence))


def test_a_correct_sentence_is_still_not_a_verdict():
    result = assess("Yesterday I went to the park.")
    assert result["verdict"] == "no_issue_detected" and result["confidence"] == "low"
    assert result["uses"] == [{"rule": "past_irregular", "form": "went", "base": "go"}]


# --- the memory is validated, closed-set, sentence-free ----------------------

def test_memory_keeps_only_known_rules_and_closed_fields():
    raw = [
        {"rule": "past_irregular", "status": "recurring", "due": True, "bases": ["go", "eat", "Yesterday I goed"],
         "preferred_strategy": "contrast_example", "transcript": "Yesterday I goed to school"},
        {"rule": "past_irregular", "status": "observed"},                 # duplicate rule
        {"rule": "drop_tables", "due": True},                             # unknown rule
        {"rule": "article", "status": "mastered", "due": "yes"},          # not a status; not a bool
        "free text",
    ] + [{"rule": "third_person"}] * 20
    safe = _safe_learning_memory(raw)
    assert safe == [
        {"rule": "past_irregular", "due": True, "status": "recurring", "preferred_strategy": "contrast_example",
         "bases": ["go", "eat"]},
        {"rule": "article", "due": False},
        {"rule": "third_person", "due": False},
    ]
    assert _safe_learning_memory("nope") == [] and _safe_learning_memory(None) == []


# --- strategy across days ------------------------------------------------------

def test_a_recurring_difficulty_starts_with_contrast_on_a_new_day():
    fresh = chat("Yesterday I buyed bread.", session="day2-none")
    assert fresh["analysis"]["strategy"] == "brief_explanation", "no memory: the light touch"
    remembered = chat("Yesterday I buyed bread.", session="day2-mem",
                      memory=[{"rule": "past_irregular", "status": "recurring"}])
    assert remembered["analysis"]["strategy"] == "contrast_example"


def test_the_policys_choice_is_used_but_the_conversation_wins():
    memory = [{"rule": "past_irregular", "status": "recurring", "preferred_strategy": "guided_retrieval"}]
    first = chat("Yesterday I runned home.", session="pol", memory=memory)
    assert first["analysis"]["strategy"] == "guided_retrieval"
    assert first["learning_action"]["type"] == "fill_blank"
    # in-session escalation is unchanged by memory for other rules
    assert choose_strategy("article", {"learning_memory": memory}) == "brief_explanation"


# --- delayed retrieval in a new context ---------------------------------------

def test_a_due_difficulty_gets_one_retrieval_in_a_new_sentence():
    memory = [{"rule": "past_irregular", "status": "recurring", "due": True, "bases": ["go", "write", "swim"]}]
    data = chat("I like my new job.", session="due", memory=memory)
    action = data["learning_action"]
    assert action["type"] == "fill_blank"
    retrieval = data["analysis"]["retrieval"]
    assert retrieval["rule"] == "past_irregular"
    assert retrieval["base"] not in {"go", "write", "swim"}, "a verb not practised before"
    assert action["expected"] == retrieval["expected"] == {"eat": "ate"}[retrieval["base"]]
    assert "____" in action["prompt"] and "earlier day" not in action["prompt"], "the lead follows the learner's language"
    assert data["correction"] is None


def test_no_retrieval_when_nothing_is_due_or_on_top_of_a_correction():
    not_due = chat("I like my new job.", session="nd", memory=[{"rule": "past_irregular", "due": False}])
    assert "retrieval" not in (not_due["analysis"] or {})
    on_error = chat("Yesterday I goed home.", session="oe", memory=[{"rule": "article", "due": True}])
    assert "retrieval" not in on_error["analysis"]
    assert on_error["analysis"]["findings"][0]["rule"] == "past_irregular"


@pytest.mark.parametrize("rule, expected_by_base", [
    ("third_person", {"work": "works"}),
    ("article", {"orange": "an"}),
    ("past_marker", {"work": "worked"}),
])
def test_every_remembered_rule_can_be_retrieved(rule, expected_by_base):
    data = chat("I like my new job.", session="r-" + rule, memory=[{"rule": rule, "due": True}])
    retrieval = data["analysis"]["retrieval"]
    assert retrieval["rule"] == rule
    assert expected_by_base[retrieval["base"]] == retrieval["expected"]


def test_the_retrieval_lead_exists_in_all_eight_languages():
    assert set(MESSAGES["retrieval_lead"]) == {"en", "es", "pt", "fr", "it", "de", "ja", "ar"}
