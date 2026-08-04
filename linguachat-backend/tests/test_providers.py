"""Provider adapter tests — the remote path, without ever calling OpenAI.

The point of an explicit provider is that every ugly answer a model can give
lands somewhere safe. These tests drive each of those answers deliberately and
assert the same promise each time: the learner is never blocked, and is never
told they succeeded on the strength of a broken verdict.
"""
import pytest
from fastapi.testclient import TestClient

from ai.evaluator import evaluate_episode_response
from ai.providers import (
    EvaluationContext, FakeProvider, OpenAIProvider, get_provider,
    FAKE_PROVIDER_ENV, EVAL_TIMEOUT_ENV,
    SCENARIO_SUCCESS, SCENARIO_TIMEOUT, SCENARIO_INVALID,
    SCENARIO_CONTRADICTORY, SCENARIO_ERROR, SCENARIO_DISABLED,
)
from main import app


client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    monkeypatch.delenv(FAKE_PROVIDER_ENV, raising=False)
    monkeypatch.delenv("LINGUACHAT_FAKE_DELAY", raising=False)
    monkeypatch.delenv(EVAL_TIMEOUT_ENV, raising=False)
    monkeypatch.setenv("OPENAI_ENABLED", "false")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)


def _payload(**kw):
    base = {
        "expected_intent": "introduction",
        "step_type": "free_reply",
        # ambiguous on purpose: the local evaluator cannot settle it, so the
        # router escalates and the provider is actually reached
        "learner_response": "Sebastian here.",
        "learner_name": "Sebastian",
        "native_language": "es",
        "target_language": "en",
        "turn_context": {"lingua_said": "Hi there!"},
    }
    base.update(kw)
    return base


# ---------- selection ----------
def test_a_normal_deployment_never_gets_a_fake_provider():
    assert isinstance(get_provider(), OpenAIProvider)


def test_the_fake_is_only_reachable_by_explicit_opt_in(monkeypatch):
    monkeypatch.setenv(FAKE_PROVIDER_ENV, SCENARIO_SUCCESS)
    provider = get_provider()
    assert isinstance(provider, FakeProvider)
    assert provider.scenario == SCENARIO_SUCCESS


def test_an_unknown_scenario_falls_back_to_success(monkeypatch):
    monkeypatch.setenv(FAKE_PROVIDER_ENV, "banana")
    assert get_provider().scenario == SCENARIO_SUCCESS


# ---------- what the provider is allowed to see ----------
def test_the_provider_only_receives_linguistic_context():
    context = EvaluationContext.from_payload({
        **_payload(),
        "learner_place": "Medellín",
        "target_noun": "music",
        "interest_id": "music",
        "scaffold_level": "high",
        "previous_attempts": 2,
    })
    visible = set(context.__dataclass_fields__)
    assert visible == {
        "expected_intent", "step_type", "required_elements", "learner_response",
        "learner_name", "native_language", "target_language", "turn_context",
        # which repair strategy the turn asked for: a property of the TASK, in the
        # same class as expected_intent. Without it a provider grading a repair is
        # answering a different question than the one the learner was asked.
        "repair_kind",
        # and the same for a quantity: which shape was asked for, of what, and how
        # many. All three describe the task; none describes the learner.
        "quantity_form", "target_thing", "target_count",
    }
    # the support level and the attempt count were in the payload above and are
    # still not here; a new linguistic field must not smuggle them in
    assert context.repair_kind == "", "an unrelated payload must leave it empty"
    assert not any("scaffold" in f or "attempt" in f or "assistance" in f for f in visible)
    # and nothing about how far along the learner is. Matched on whole words:
    # "expected_intent" contains the letters of "xp" and is perfectly innocent.
    progress_words = {"ready", "readiness", "skill", "skills", "overdue", "xp", "reason", "codes"}
    for field in visible:
        assert not (set(field.split("_")) & progress_words), f"{field} exposes how far along the learner is"
    # nothing about progress, rewards or the learner model may be in scope
    forbidden = {"xp", "garden", "mastery", "activity", "preferences", "storage", "signals", "runs"}
    for field in visible:
        assert not (set(field.split("_")) & forbidden), f"{field} exposes learner-model state"


def test_the_target_language_is_never_negotiable():
    context = EvaluationContext.from_payload(_payload(target_language="fr"))
    assert context.target_language == "en"


def test_native_language_survives_both_shapes():
    assert EvaluationContext.from_payload(_payload(native_language="ja")).native_language == "ja"
    assert EvaluationContext.from_payload(
        _payload(native_language={"code": "pt-BR", "base": "pt"})
    ).native_language == "pt"


def test_turn_context_is_carried_and_junk_is_dropped():
    assert EvaluationContext.from_payload(_payload()).turn_context == {"lingua_said": "Hi there!"}
    assert EvaluationContext.from_payload(_payload(turn_context="nonsense")).turn_context == {}


# ---------- each scenario, through the real entry point ----------
def test_success_produces_a_remote_verdict(monkeypatch):
    monkeypatch.setenv(FAKE_PROVIDER_ENV, SCENARIO_SUCCESS)
    result = evaluate_episode_response(_payload())
    assert result.source == "remote"
    assert result.completed_objective is True
    assert result.retry_required is False


def test_timeout_falls_back_without_raising(monkeypatch):
    monkeypatch.setenv(FAKE_PROVIDER_ENV, SCENARIO_TIMEOUT)
    monkeypatch.setenv("LINGUACHAT_FAKE_DELAY", "0.05")
    result = evaluate_episode_response(_payload())
    assert result.source == "fallback"
    # the learner still gets something usable to try again with
    assert result.retry_required is True


def test_an_invalid_structure_falls_back(monkeypatch):
    monkeypatch.setenv(FAKE_PROVIDER_ENV, SCENARIO_INVALID)
    result = evaluate_episode_response(_payload())
    assert result.source == "fallback"
    assert result.completed_objective is False


def test_a_contradictory_verdict_is_never_trusted(monkeypatch):
    """completed_objective=True AND retry_required=True cannot both be so."""
    monkeypatch.setenv(FAKE_PROVIDER_ENV, SCENARIO_CONTRADICTORY)
    result = evaluate_episode_response(_payload())
    assert result.source == "fallback"
    assert result.completed_objective is False, "a self-contradicting verdict must not grant success"


def test_a_raising_provider_falls_back(monkeypatch):
    monkeypatch.setenv(FAKE_PROVIDER_ENV, SCENARIO_ERROR)
    result = evaluate_episode_response(_payload())
    assert result.source == "fallback"


def test_a_disabled_provider_uses_the_deterministic_path(monkeypatch):
    monkeypatch.setenv(FAKE_PROVIDER_ENV, SCENARIO_DISABLED)
    result = evaluate_episode_response(_payload())
    assert result.source == "deterministic"


def test_only_one_priority_correction_is_ever_returned(monkeypatch):
    monkeypatch.setenv(FAKE_PROVIDER_ENV, SCENARIO_INVALID)
    result = evaluate_episode_response(_payload(learner_response="I from Bogotá.", expected_intent="answer_origin"))
    assert result.completed_objective is False
    assert isinstance(result.error_type, str)
    assert result.priority_correction is None or isinstance(result.priority_correction, str)


# ---------- through real HTTP, the way the frontend reaches it ----------
def test_the_endpoint_returns_a_remote_verdict_with_the_fake_provider(monkeypatch):
    monkeypatch.setenv(FAKE_PROVIDER_ENV, SCENARIO_SUCCESS)
    res = client.post("/learning/evaluate", json=_payload())
    assert res.status_code == 200
    body = res.json()
    assert body["source"] == "remote"
    assert body["completed_objective"] is True


@pytest.mark.parametrize("scenario", [SCENARIO_INVALID, SCENARIO_CONTRADICTORY, SCENARIO_ERROR])
def test_the_endpoint_never_500s_on_a_bad_verdict(monkeypatch, scenario):
    monkeypatch.setenv(FAKE_PROVIDER_ENV, scenario)
    res = client.post("/learning/evaluate", json=_payload())
    assert res.status_code == 200
    assert res.json()["source"] == "fallback"


def test_a_configurable_timeout_is_bounded(monkeypatch):
    monkeypatch.setenv(FAKE_PROVIDER_ENV, SCENARIO_SUCCESS)
    monkeypatch.setenv(EVAL_TIMEOUT_ENV, "2")
    assert get_provider().timeout_seconds == 2
    for bad in ("0", "-3", "999", "abc"):
        monkeypatch.setenv(EVAL_TIMEOUT_ENV, bad)
        assert get_provider().timeout_seconds > 0


def test_chat_and_optional_context_are_untouched_by_the_provider(monkeypatch):
    monkeypatch.setenv(FAKE_PROVIDER_ENV, SCENARIO_SUCCESS)
    res = client.post("/chat", json={
        "message": "hello", "level": "A1", "optional_context": {"remembered_like": "music"},
    })
    assert res.status_code == 200
    assert "reply" in res.json()
