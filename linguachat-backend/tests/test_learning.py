"""Tests for the isolated LinguaLoop evaluation endpoint and evaluator.

No real OpenAI calls: the remote path is monkeypatched. Every test is
deterministic. Also guards that /chat, mission_context and mission_feedback keep
working (no regression from adding /learning/evaluate).
"""
import pytest
from fastapi.testclient import TestClient

import ai.evaluator as evaluator
from ai.evaluator import evaluate_deterministic, validate_remote
from main import app


client = TestClient(app)


@pytest.fixture(autouse=True)
def default_env(monkeypatch):
    # OpenAI OFF by default → deterministic path unless a test opts in.
    monkeypatch.setenv("OPENAI_ENABLED", "false")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)


def _payload(**kw):
    base = {
        "expected_intent": "introduction",
        "step_type": "free_reply",
        "learner_response": "",
        "learner_name": "Sebastian",
        "native_language": "es",
        "scaffold_level": "medium",
    }
    base.update(kw)
    return base


# ---------- deterministic path (OpenAI disabled) ----------
@pytest.mark.parametrize("text", [
    "Hi, I'm Sebastian.", "I'm Sebastian.", "My name is Sebastian.",
    "People call me Sebastian.", "Hello, I go by Sebastian.",
])
def test_intro_accepts_variants(text):
    r = evaluate_deterministic(_payload(learner_response=text))
    assert r["completed_objective"] is True
    assert r["retry_required"] is False
    assert r["error_type"] is None


@pytest.mark.parametrize("text,err", [
    ("Sebastian", "missing_copula"),
    ("Hi", "greeting_only"),
    ("I'm", "missing_name"),
    ("", "empty"),
])
def test_intro_rejects_pedagogically(text, err):
    r = evaluate_deterministic(_payload(learner_response=text))
    assert r["completed_objective"] is False
    assert r["retry_required"] is True
    assert r["error_type"] == err
    assert r["natural_version"]


def test_ask_name_accept_and_reject():
    assert evaluate_deterministic(_payload(expected_intent="ask_name", learner_response="What's your name?"))["completed_objective"] is True
    assert evaluate_deterministic(_payload(expected_intent="ask_name", learner_response="May I ask your name?"))["completed_objective"] is True
    assert evaluate_deterministic(_payload(expected_intent="ask_name", learner_response="Your name?"))["completed_objective"] is False
    assert evaluate_deterministic(_payload(expected_intent="ask_name", learner_response="How are you?"))["completed_objective"] is False


def test_nice_to_meet_turn_context():
    as_response = _payload(expected_intent="nice_to_meet", learner_response="You too.",
                           turn_context={"lingua_said": "Nice to meet you!"})
    assert evaluate_deterministic(as_response)["completed_objective"] is True
    as_opener = _payload(expected_intent="nice_to_meet", learner_response="You too.",
                         turn_context={"lingua_said": "Hi there"})
    assert evaluate_deterministic(as_opener)["completed_objective"] is False
    assert evaluate_deterministic(_payload(expected_intent="nice_to_meet", learner_response="Nice meeting you."))["completed_objective"] is True


# ---------- remote validation ----------
def test_validate_remote_rejects_contradictions():
    assert validate_remote({"completed_objective": True, "retry_required": True}) is None
    assert validate_remote({"completed_objective": False, "retry_required": False}) is None
    assert validate_remote({"completed_objective": "yes"}) is None
    assert validate_remote({"completed_objective": True, "natural_version": "x" * 200}) is None
    ok = validate_remote({"completed_objective": True, "retry_required": False, "confidence": 0.9})
    assert ok and ok["completed_objective"] is True and ok["source"] == "remote"


def test_validate_remote_clamps_bad_confidence_and_error():
    ok = validate_remote({"completed_objective": False, "retry_required": True,
                          "confidence": "nan", "error_type": "totally_made_up"})
    assert ok["confidence"] == 0.75
    assert ok["error_type"] == "unclear"


# ---------- OpenAI path (mocked, never real) ----------
def _enable_openai(monkeypatch):
    monkeypatch.setenv("OPENAI_ENABLED", "true")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")


def test_remote_accept_overrides_local_reject(monkeypatch):
    _enable_openai(monkeypatch)
    # a natural variant the deterministic evaluator would not confirm
    monkeypatch.setattr(evaluator, "evaluate_with_openai", lambda payload: {
        "understood": True, "completed_objective": True, "accepted_variant": True,
        "confidence": 0.88, "retry_required": False, "natural_version": "Hi, I'm Sebastian.",
    })
    r = evaluator.evaluate_episode_response(_payload(learner_response="Sebastián here, hello!"))
    assert r.completed_objective is True
    assert r.source == "remote"


def test_remote_invalid_json_falls_back(monkeypatch):
    _enable_openai(monkeypatch)
    monkeypatch.setattr(evaluator, "evaluate_with_openai",
                        lambda payload: {"completed_objective": "maybe"})  # invalid
    r = evaluator.evaluate_episode_response(_payload(learner_response="Sebastian"))
    assert r.source == "fallback"
    assert r.completed_objective is False  # deterministic verdict for bare name


def test_remote_timeout_falls_back(monkeypatch):
    _enable_openai(monkeypatch)
    def boom(payload):
        raise TimeoutError("simulated timeout")
    monkeypatch.setattr(evaluator, "evaluate_with_openai", boom)
    r = evaluator.evaluate_episode_response(_payload(learner_response="Hi, I'm Sebastian."))
    assert r.source == "fallback"
    assert r.completed_objective is True  # deterministic still accepts a clear answer


# ---------- endpoint ----------
def test_endpoint_returns_contract():
    res = client.post("/learning/evaluate", json=_payload(learner_response="Hi, I'm Sebastian."))
    assert res.status_code == 200
    body = res.json()
    for key in ["understood", "completed_objective", "accepted_variant", "confidence",
                "error_type", "natural_version", "retry_required", "retry_prompt", "source"]:
        assert key in body
    assert body["completed_objective"] is True
    assert body["retry_required"] is False


def test_endpoint_consistency_reject():
    res = client.post("/learning/evaluate", json=_payload(learner_response="Sebastian"))
    body = res.json()
    assert body["completed_objective"] is False
    assert body["retry_required"] is True
    # never both
    assert not (body["completed_objective"] and body["retry_required"])


def test_endpoint_empty_response_is_safe():
    res = client.post("/learning/evaluate", json=_payload(learner_response=""))
    assert res.status_code == 200
    assert res.json()["error_type"] == "empty"


def test_remote_missing_fields_falls_back(monkeypatch):
    _enable_openai(monkeypatch)
    # a truncated/incomplete verdict: no completed_objective at all
    monkeypatch.setattr(evaluator, "evaluate_with_openai", lambda payload: {"understood": True})
    r = evaluator.evaluate_episode_response(_payload(learner_response="Sebastian"))
    assert r.source == "fallback"
    assert r.retry_required is True


def test_remote_empty_response_falls_back(monkeypatch):
    _enable_openai(monkeypatch)
    for empty in ({}, None, [], ""):
        monkeypatch.setattr(evaluator, "evaluate_with_openai", lambda payload, e=empty: e)
        r = evaluator.evaluate_episode_response(_payload(learner_response="Sebastian"))
        assert r.source == "fallback"


def test_remote_server_error_falls_back(monkeypatch):
    _enable_openai(monkeypatch)
    def boom(payload):
        raise RuntimeError("500 Internal Server Error")
    monkeypatch.setattr(evaluator, "evaluate_with_openai", boom)
    r = evaluator.evaluate_episode_response(_payload(learner_response="Hi, I'm Sebastian."))
    assert r.source == "fallback"
    assert r.completed_objective is True


@pytest.mark.parametrize("native", ["es", "pt", "fr", "it", "de", "ja", "ar", "en"])
def test_native_language_does_not_change_the_verdict(native):
    """Explanations are localized elsewhere; the verdict must be language-agnostic."""
    accepted = client.post("/learning/evaluate", json=_payload(
        learner_response="Hi, I'm Sebastian.", native_language=native)).json()
    rejected = client.post("/learning/evaluate", json=_payload(
        learner_response="Sebastian", native_language=native)).json()
    assert accepted["completed_objective"] is True
    assert rejected["completed_objective"] is False


@pytest.mark.parametrize("target", ["en", None, "es"])
def test_target_language_stays_english(target):
    """target_language is accepted but English remains the taught language."""
    body = client.post("/learning/evaluate", json=_payload(
        learner_response="Hi, I'm Sebastian.", target_language=target)).json()
    assert body["completed_objective"] is True
    assert body["natural_version"].startswith("Hi, I'm ")


def test_only_one_priority_error_is_reported():
    # "Hi" is missing both the copula and the name; only ONE error is surfaced.
    body = client.post("/learning/evaluate", json=_payload(learner_response="Hi")).json()
    assert isinstance(body["error_type"], str)
    assert body["error_type"] == "greeting_only"
    assert body["retry_required"] is True


def test_turn_context_is_optional_and_safe():
    for ctx in (None, {}, {"lingua_said": None}):
        res = client.post("/learning/evaluate", json=_payload(
            expected_intent="nice_to_meet", learner_response="Nice to meet you.", turn_context=ctx))
        assert res.status_code == 200
        assert res.json()["completed_objective"] is True


def test_unknown_step_type_is_not_judged():
    body = client.post("/learning/evaluate", json=_payload(
        expected_intent="something_new", learner_response="hello there")).json()
    assert body["completed_objective"] is False
    assert body["error_type"] == "unclear"
    assert body["understood"] is False


def test_oversized_response_is_rejected_by_validation():
    res = client.post("/learning/evaluate", json=_payload(learner_response="x" * 600))
    assert res.status_code == 422  # max_length guard on the request model


# ---------- no regression on /chat, mission, translation ----------
def test_chat_still_works():
    res = client.post("/chat", json={"message": "hello", "level": "A1"})
    assert res.status_code == 200
    assert "reply" in res.json()


def test_mission_feedback_still_works():
    res = client.post("/chat", json={
        "message": "I'm Sebastian.", "level": "A1",
        "mission_context": {"step_type": "answer_question", "expected_pattern": "i'm",
                            "prompt": "Introduce yourself.", "target_skill": "intro"},
    })
    assert res.status_code == 200
    assert res.json().get("mission_feedback") is not None


def test_translation_and_meaning_still_work():
    r1 = client.post("/chat", json={"message": "como se dice queso", "level": "A1"})
    assert "cheese" in r1.json()["reply"].lower()
    r2 = client.post("/chat", json={"message": "que significa cheese", "level": "A1"})
    assert r2.status_code == 200
