"""Evaluation providers — the only thing allowed to produce a REMOTE verdict.

A provider answers exactly one question: "does this short answer achieve this
communicative objective?" It is given the linguistic context and nothing else —
no XP, no Memory Garden, no mastery, no activity preferences, no storage, no
UI state. Those belong to the client and to the learner model, and a provider
that knew about them could not be swapped out.

Two implementations live here:

* ``OpenAIProvider`` — the real one.
* ``FakeProvider``   — deterministic scenarios for development and tests, so
  the whole path (frontend → HTTP → backend → evaluator → provider → verdict)
  can be exercised without ever calling OpenAI.

Which one answers is decided in ``ai/provider_policy.py`` and nowhere else. The
fake is only ever selected when it is asked for, so a deployment cannot run on
mocks by accident — and the real one is only selected when IT is asked for, so
local QA cannot reach the network by accident either.
"""
from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Protocol

from ai.openai_tutor import openai_tutor
from ai.provider_policy import (
    fake_provider_selected, fake_scenario, real_provider_allowed, provider_mode,
)
from ai.schemas import EvaluationResult


FAKE_PROVIDER_ENV = "LINGUACHAT_FAKE_PROVIDER"
EVAL_TIMEOUT_ENV = "LINGUACHAT_EVAL_TIMEOUT"

# Scenarios the fake provider can be asked to play.
SCENARIO_SUCCESS = "success"
SCENARIO_TIMEOUT = "timeout"
SCENARIO_INVALID = "invalid"
SCENARIO_CONTRADICTORY = "contradictory"
SCENARIO_ERROR = "error"
SCENARIO_DISABLED = "disabled"
FAKE_SCENARIOS = {
    SCENARIO_SUCCESS,
    SCENARIO_TIMEOUT,
    SCENARIO_INVALID,
    SCENARIO_CONTRADICTORY,
    SCENARIO_ERROR,
    SCENARIO_DISABLED,
}


@dataclass(frozen=True)
class EvaluationContext:
    """Everything a provider is allowed to see. Linguistic only."""

    expected_intent: str
    step_type: str
    required_elements: list
    learner_response: str
    learner_name: str
    native_language: str
    target_language: str
    turn_context: dict
    # Which repair strategy the turn asked for. Repair is one intent with three
    # strategies, so without this a provider is judging a different question:
    # "Can you repeat, please?" is right for one turn and a different repair in
    # another. Linguistic information about the task, not support state.
    repair_kind: str = ""
    meaning_word: str = ""
    # The shape of quantity asked for, and of what. Linguistic properties of the
    # TASK, in the same class as expected_intent — never anything about the
    # learner's progress, readiness or support.
    quantity_form: str = ""
    target_thing: str = ""
    target_count: int | None = None

    @classmethod
    def from_payload(cls, payload: dict) -> "EvaluationContext":
        turn = payload.get("turn_context") or {}
        if hasattr(turn, "model_dump"):
            turn = turn.model_dump()
        if not isinstance(turn, dict):
            turn = {}
        native = payload.get("native_language")
        if isinstance(native, dict):
            native = native.get("base") or native.get("code") or "en"
        target = payload.get("target_language")
        if isinstance(target, dict):
            target = target.get("base") or target.get("code") or "en"
        return cls(
            expected_intent=str(payload.get("expected_intent") or ""),
            step_type=str(payload.get("step_type") or ""),
            required_elements=list(payload.get("required_elements") or []),
            learner_response=str(payload.get("learner_response") or ""),
            learner_name=str(payload.get("learner_name") or ""),
            native_language=str(native or "en"),
            # the target language is never negotiable
            target_language="en",
            turn_context=turn,
            repair_kind=str(payload.get("repair_kind") or ""),
            meaning_word=str(payload.get("meaning_word") or ""),
            quantity_form=str(payload.get("quantity_form") or ""),
            target_thing=str(payload.get("target_thing") or ""),
            target_count=payload.get("target_count") if isinstance(payload.get("target_count"), int) else None,
        )


class EvaluationProvider(Protocol):
    name: str

    @property
    def configured(self) -> bool:
        """Whether this provider can be asked for a verdict at all."""

    @property
    def timeout_seconds(self) -> float:
        """How long the caller should wait before giving up on it."""

    def evaluate(self, context: EvaluationContext) -> dict:
        """Return a raw verdict dict, or raise. Never returns None."""


class OpenAIProvider:
    """The real provider. Structured output, one short verdict, no prose."""

    name = "openai"

    @property
    def configured(self) -> bool:
        return bool(openai_tutor.configured)

    @property
    def timeout_seconds(self) -> float:
        return float(_configured_timeout(openai_tutor.timeout_seconds))

    def evaluate(self, context: EvaluationContext) -> dict:
        from ai.evaluator import evaluate_with_openai  # imported late: avoids a cycle

        return evaluate_with_openai(_context_to_payload(context))


class FakeProvider:
    """A provider that plays a chosen scenario, for development and tests.

    It exists so the remote path can be exercised end to end — including the
    ugly parts (a slow answer, a malformed one, a self-contradicting one) that
    are impossible to trigger reliably against a real model.
    """

    name = "fake"

    def __init__(self, scenario: str = SCENARIO_SUCCESS, delay_seconds: float = 0.0):
        self.scenario = scenario if scenario in FAKE_SCENARIOS else SCENARIO_SUCCESS
        self.delay_seconds = max(0.0, float(delay_seconds))

    @property
    def configured(self) -> bool:
        return self.scenario != SCENARIO_DISABLED

    @property
    def timeout_seconds(self) -> float:
        return float(_configured_timeout(openai_tutor.timeout_seconds))

    def evaluate(self, context: EvaluationContext) -> dict:
        if self.scenario == SCENARIO_TIMEOUT:
            # sleep past the caller's patience, then report what really happened
            time.sleep(min(self.delay_seconds or self.timeout_seconds + 1.0, 30.0))
            raise TimeoutError("fake provider: deliberately slower than the timeout")
        if self.delay_seconds:
            time.sleep(self.delay_seconds)
        if self.scenario == SCENARIO_ERROR:
            raise RuntimeError("fake provider: deliberate failure")
        if self.scenario == SCENARIO_INVALID:
            # shaped like a verdict, but not one: no boolean objective at all
            return {"understood": "maybe", "completed_objective": "yes", "notes": ["nope"]}
        if self.scenario == SCENARIO_CONTRADICTORY:
            # claims success AND demands a retry — must never be trusted
            return {
                "understood": True,
                "completed_objective": True,
                "retry_required": True,
                "accepted_variant": True,
                "confidence": 0.9,
                "natural_version": "Hi, I'm Alex.",
                "source": "remote",
            }
        # SUCCESS: a valid, minimal verdict for the answer it was given
        natural = _natural_for(context)
        return {
            "understood": True,
            "completed_objective": True,
            "accepted_variant": True,
            "confidence": 0.82,
            "error_type": None,
            "priority_correction": None,
            "natural_version": natural,
            "explanation": None,
            "retry_required": False,
            "retry_prompt": None,
            "source": "remote",
        }


class LocalOnlyProvider:
    """No remote verdict is available, and that is a decision rather than a fault.

    The evaluator treats an unconfigured provider as "use the conservative
    deterministic path", which is exactly right for local development. This exists
    so the reason appears in the logs as ``local`` instead of looking like a
    broken OpenAI configuration.
    """

    name = "local"

    @property
    def configured(self) -> bool:
        return False

    @property
    def timeout_seconds(self) -> float:
        return float(_configured_timeout(openai_tutor.timeout_seconds))

    def evaluate(self, context: EvaluationContext) -> dict:
        raise RuntimeError(
            "no remote provider is enabled; set LINGUACHAT_PROVIDER=openai or =fake"
        )


def _natural_for(context: EvaluationContext) -> str:
    name = (context.learner_name or "Alex").strip() or "Alex"
    if context.expected_intent == "introduction":
        return f"Hi, I'm {name}."
    if context.expected_intent == "ask_name":
        return "What's your name?"
    return "Nice."


def _context_to_payload(context: EvaluationContext) -> dict:
    return {
        "expected_intent": context.expected_intent,
        "step_type": context.step_type,
        "required_elements": context.required_elements,
        "learner_response": context.learner_response,
        "learner_name": context.learner_name,
        "repair_kind": context.repair_kind,
        "meaning_word": context.meaning_word,
        "quantity_form": context.quantity_form,
        "target_thing": context.target_thing,
        "target_count": context.target_count,
        "native_language": context.native_language,
        "target_language": context.target_language,
        "turn_context": context.turn_context,
    }


def _configured_timeout(default: float) -> float:
    """Allow a shorter timeout in development so the path can be tested."""
    raw = os.environ.get(EVAL_TIMEOUT_ENV)
    if not raw:
        return default
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return default
    return value if 0 < value <= 60 else default


def get_provider() -> EvaluationProvider:
    """The provider for this process, per the one policy.

    Three outcomes and no fourth: the scripted fake when a scenario was asked
    for, the real model when it was explicitly enabled and a key exists, and
    otherwise a local provider that declines to produce a remote verdict at all.
    A readable API key is not one of the inputs.
    """
    if fake_provider_selected():
        delay = os.environ.get("LINGUACHAT_FAKE_DELAY")
        try:
            delay_seconds = float(delay) if delay else 0.0
        except (TypeError, ValueError):
            delay_seconds = 0.0
        return FakeProvider(scenario=fake_scenario() or SCENARIO_SUCCESS, delay_seconds=delay_seconds)
    if real_provider_allowed():
        return OpenAIProvider()
    return LocalOnlyProvider()


__all__ = [
    "EvaluationContext",
    "EvaluationProvider",
    "OpenAIProvider",
    "FakeProvider",
    "LocalOnlyProvider",
    "get_provider",
    "FAKE_PROVIDER_ENV",
    "EVAL_TIMEOUT_ENV",
    "FAKE_SCENARIOS",
    "SCENARIO_SUCCESS",
    "SCENARIO_TIMEOUT",
    "SCENARIO_INVALID",
    "SCENARIO_CONTRADICTORY",
    "SCENARIO_ERROR",
    "SCENARIO_DISABLED",
]
