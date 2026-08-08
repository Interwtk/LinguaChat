"""A key must never be a decision.

The sprint that wrote these tests started with a real incident: a developer key
sat in `.env`, local QA typed into the chat, and the backend went to the real
model — because the only question anybody asked was "is a key readable?". Nothing
was broken. Nothing warned. That is the failure mode being closed here.

So these tests are about SELECTION, not about answers. Not one of them makes a
network request: the two that involve the real provider assert which class was
chosen, and the conftest guard fails the test if a client is ever constructed.
"""
from __future__ import annotations

import logging

import pytest
from fastapi.testclient import TestClient

from ai import engine
from ai.provider_policy import (
    LEGACY_FAKE_ENV, MODE_FAKE, MODE_LOCAL, MODE_OPENAI, OPENAI_ENABLED_ENV,
    OPENAI_KEY_ENV, PROVIDER_MODE_ENV, ProviderConfigError, describe_providers,
    has_api_key, provider_mode, real_provider_allowed, real_provider_requested,
    verify_provider_config,
)
from ai.providers import FakeProvider, LocalOnlyProvider, OpenAIProvider, get_provider
from main import app


client = TestClient(app)

DUMMY_KEY = "not-a-secret-test-value"


def _clear(monkeypatch):
    """Start from nothing configured, whatever the developer's shell has."""
    for name in (PROVIDER_MODE_ENV, LEGACY_FAKE_ENV, OPENAI_KEY_ENV, OPENAI_ENABLED_ENV):
        monkeypatch.delenv(name, raising=False)


def _payload(**kw):
    base = {
        "expected_intent": "introduction",
        "step_type": "free_reply",
        # deliberately ambiguous, so the deterministic evaluator cannot settle it
        # and the remote path is genuinely reached for
        "learner_response": "Sebastian here.",
        "learner_name": "Sebastian",
        "native_language": "es",
        "target_language": "en",
        "turn_context": {"lingua_said": "Hi there!"},
    }
    base.update(kw)
    return base


# ---------------------------------------------------------------- 1) the default
def test_nothing_configured_is_local(monkeypatch):
    _clear(monkeypatch)
    assert provider_mode() == MODE_LOCAL
    assert real_provider_allowed() is False
    assert isinstance(get_provider(), LocalOnlyProvider)


# --------------------------------------------- 2) THE INCIDENT: a key is not enough
def test_a_readable_api_key_does_not_enable_the_real_provider(monkeypatch):
    """The regression for the actual bug.

    Before this policy, exactly this configuration — a key, nothing else — sent
    real requests. It must now select nothing of the kind, in either flow.
    """
    _clear(monkeypatch)
    monkeypatch.setenv(OPENAI_KEY_ENV, DUMMY_KEY)

    assert has_api_key() is True, "the key is present; that is the whole point"
    assert provider_mode() == MODE_LOCAL
    assert real_provider_requested() is False
    assert real_provider_allowed() is False
    assert isinstance(get_provider(), LocalOnlyProvider)
    assert not isinstance(get_provider(), OpenAIProvider)


def test_a_key_plus_openai_enabled_true_is_still_not_enough(monkeypatch):
    """`OPENAI_ENABLED` defaults to true, so it must not act as the opt-in."""
    _clear(monkeypatch)
    monkeypatch.setenv(OPENAI_KEY_ENV, DUMMY_KEY)
    monkeypatch.setenv(OPENAI_ENABLED_ENV, "true")
    assert real_provider_allowed() is False
    assert isinstance(get_provider(), LocalOnlyProvider)


# ----------------------------------------------------- 3) explicit opt-in, mocked
def test_explicit_openai_mode_with_a_key_selects_the_real_provider(monkeypatch):
    """The real provider must remain available — deliberately.

    This asserts the CHOICE and never calls anything: `OpenAIProvider.evaluate`
    is not invoked, and the conftest guard would fail this test if a client were
    constructed.
    """
    _clear(monkeypatch)
    monkeypatch.setenv(PROVIDER_MODE_ENV, MODE_OPENAI)
    monkeypatch.setenv(OPENAI_KEY_ENV, DUMMY_KEY)

    assert provider_mode() == MODE_OPENAI
    assert real_provider_allowed() is True
    provider = get_provider()
    assert isinstance(provider, OpenAIProvider)
    assert provider.name == "openai"
    assert provider.configured is True


# ------------------------------------------------------------ 4) explicit fake
def test_explicit_fake_wins_even_with_a_key_and_the_opt_in(monkeypatch):
    """Somebody running a scripted scenario gets the script.

    Precedence is documented and asserted: a controlled test must not silently
    become a live one just because the surrounding environment could.
    """
    _clear(monkeypatch)
    monkeypatch.setenv(OPENAI_KEY_ENV, DUMMY_KEY)
    monkeypatch.setenv(PROVIDER_MODE_ENV, MODE_OPENAI)
    monkeypatch.setenv(LEGACY_FAKE_ENV, "timeout")

    assert provider_mode() == MODE_FAKE
    assert real_provider_allowed() is False
    provider = get_provider()
    assert isinstance(provider, FakeProvider)
    assert provider.scenario == "timeout"


def test_the_kill_switch_does_not_disable_the_fake(monkeypatch):
    """`OPENAI_ENABLED=false` stops real requests; the fake makes none.

    The first version of this policy checked the kill switch first, so anybody
    with `OPENAI_ENABLED=false` in their .env got plain local answers while
    believing they were running the scenarios. Same confusion, other direction.
    """
    _clear(monkeypatch)
    monkeypatch.setenv(OPENAI_ENABLED_ENV, "false")
    monkeypatch.setenv(LEGACY_FAKE_ENV, "success")
    assert provider_mode() == MODE_FAKE
    assert isinstance(get_provider(), FakeProvider)


def test_the_kill_switch_beats_the_opt_in(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv(OPENAI_ENABLED_ENV, "false")
    monkeypatch.setenv(PROVIDER_MODE_ENV, MODE_OPENAI)
    monkeypatch.setenv(OPENAI_KEY_ENV, DUMMY_KEY)
    assert provider_mode() == MODE_LOCAL
    assert real_provider_allowed() is False


# ------------------------------------------------------- 5) invalid configuration
@pytest.mark.parametrize("bad", ["banana", "openai;true", "1", "yes", "real", "true", "local ish"])
def test_an_unrecognised_mode_is_never_the_real_provider(monkeypatch, bad):
    _clear(monkeypatch)
    monkeypatch.setenv(PROVIDER_MODE_ENV, bad)
    monkeypatch.setenv(OPENAI_KEY_ENV, DUMMY_KEY)
    assert provider_mode() == MODE_LOCAL, f"{bad!r} must not enable anything"
    assert real_provider_allowed() is False
    assert isinstance(get_provider(), LocalOnlyProvider)


@pytest.mark.parametrize("typed", ["openai", "OPENAI", " openai ", "OpenAI"])
def test_case_and_whitespace_are_forgiven_because_the_intent_is_unmistakable(monkeypatch, typed):
    """`OPENAI ` is not a typo — somebody typed the mode.

    The policy lowercases and strips, so a copied line with a trailing space still
    means what its author meant. What it never does is GUESS: a value that is not
    the mode, however close, stays local.
    """
    _clear(monkeypatch)
    monkeypatch.setenv(PROVIDER_MODE_ENV, typed)
    monkeypatch.setenv(OPENAI_KEY_ENV, DUMMY_KEY)
    assert provider_mode() == MODE_OPENAI
    assert real_provider_allowed() is True


def test_an_unrecognised_mode_says_so(monkeypatch, caplog):
    _clear(monkeypatch)
    monkeypatch.setenv(PROVIDER_MODE_ENV, "banana")
    with caplog.at_level(logging.WARNING):
        assert provider_mode() == MODE_LOCAL
    assert any("banana" in record.getMessage() for record in caplog.records),         "a typo must be visible, not silent"


# ------------------------------------------------- 6) opt-in without a key: loud
def test_asking_for_openai_without_a_key_fails_clearly(monkeypatch):
    """Refuse to start rather than serve local answers to somebody testing OpenAI."""
    _clear(monkeypatch)
    monkeypatch.setenv(PROVIDER_MODE_ENV, MODE_OPENAI)

    with pytest.raises(ProviderConfigError) as caught:
        verify_provider_config()
    message = str(caught.value)
    assert PROVIDER_MODE_ENV in message and OPENAI_KEY_ENV in message
    assert MODE_LOCAL in message, "the error should say what to do instead"

    # and until somebody fixes it, nothing real is selected
    assert real_provider_allowed() is False
    assert isinstance(get_provider(), LocalOnlyProvider)


def test_a_valid_configuration_starts_quietly(monkeypatch):
    for env in ({}, {OPENAI_KEY_ENV: DUMMY_KEY}, {PROVIDER_MODE_ENV: MODE_FAKE},
                {PROVIDER_MODE_ENV: MODE_OPENAI, OPENAI_KEY_ENV: DUMMY_KEY}):
        _clear(monkeypatch)
        for name, value in env.items():
            monkeypatch.setenv(name, value)
        verify_provider_config()  # must not raise


# ------------------------------------------------------------- 7) the /chat flow
def test_chat_does_not_use_the_real_provider_on_a_key_alone(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv(OPENAI_KEY_ENV, DUMMY_KEY)

    def refuse(**_kwargs):
        raise AssertionError("chat reached the real tutor with only a key present")

    monkeypatch.setattr(engine.openai_tutor, "generate", refuse)
    response = client.post("/chat", json={
        "session_id": "policy-chat", "message": "hello", "level": "A1", "history": [],
    })
    assert response.status_code == 200
    assert response.headers["X-LinguaChat-Provider"] == "local"


def test_chat_uses_the_real_provider_when_it_is_asked_for(monkeypatch):
    """Stubbed at the tutor, so the choice is proven without a request."""
    _clear(monkeypatch)
    monkeypatch.setenv(PROVIDER_MODE_ENV, MODE_OPENAI)
    monkeypatch.setenv(OPENAI_KEY_ENV, DUMMY_KEY)

    from ai.schemas import ChatMode, ChatResult

    def stub(**_kwargs):
        return ChatResult(
            reply="stubbed", correction=None, explanation=None, suggestion=None,
            mode=ChatMode.CHAT, learning_action=None, focus=None, word_to_use=None,
        )

    monkeypatch.setattr(engine.openai_tutor, "generate", stub)
    response = client.post("/chat", json={
        "session_id": "policy-chat-real", "message": "hello", "level": "A1", "history": [],
    })
    assert response.status_code == 200
    assert response.headers["X-LinguaChat-Provider"] == "openai"
    assert response.json()["reply"] == "stubbed"


# ------------------------------------------- 8) the /learning/evaluate flow
def test_evaluation_does_not_use_the_real_provider_on_a_key_alone(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv(OPENAI_KEY_ENV, DUMMY_KEY)

    from ai import evaluator

    def refuse(_payload):
        raise AssertionError("evaluation reached the real provider with only a key present")

    monkeypatch.setattr(evaluator, "evaluate_with_openai", refuse)
    response = client.post("/learning/evaluate", json=_payload())
    assert response.status_code == 200
    # a local verdict, produced without any remote call
    assert response.json()["source"] in {"deterministic", "fallback"}


def test_evaluation_reaches_the_real_provider_when_asked(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv(PROVIDER_MODE_ENV, MODE_OPENAI)
    monkeypatch.setenv(OPENAI_KEY_ENV, DUMMY_KEY)

    from ai import evaluator

    monkeypatch.setattr(evaluator, "evaluate_with_openai", lambda _payload: {
        "understood": True, "completed_objective": True, "accepted_variant": True,
        "confidence": 0.9, "retry_required": False, "natural_version": "Hi, I'm Sebastian.",
    })
    response = client.post("/learning/evaluate", json=_payload())
    assert response.status_code == 200
    assert response.json()["source"] == "remote"


# ------------------------------------------------- 9) the suite's own guarantees
def test_the_test_suite_cannot_build_a_real_client():
    """Layer B, asserted rather than assumed."""
    import openai

    with pytest.raises(AssertionError, match="real OpenAI client"):
        openai.OpenAI(api_key="whatever")


def test_the_suite_runs_in_local_mode_by_default():
    """Layer A: no test inherits a developer's key or a leftover scenario."""
    assert provider_mode() == MODE_LOCAL
    assert has_api_key() is False
    assert real_provider_allowed() is False


def test_the_startup_line_names_a_mode_and_no_secret(monkeypatch):
    _clear(monkeypatch)
    monkeypatch.setenv(PROVIDER_MODE_ENV, MODE_OPENAI)
    monkeypatch.setenv(OPENAI_KEY_ENV, DUMMY_KEY)
    line = describe_providers()
    assert MODE_OPENAI in line
    assert DUMMY_KEY not in line
    assert "sk-" not in line
