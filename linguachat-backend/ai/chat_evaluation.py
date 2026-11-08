"""The evaluator contract inside the real chat (P5) — layer `chat-evaluation/1`.

Until P4 the chat called the rule engine (`assess`) directly and the contract
(`lingua-evaluator/1`) existed only in tests. Now every free-chat message goes
through ONE contract evaluation:

    message ─▶ EvaluatorRequest ─▶ evaluate_safely(adapter) ─▶ validated EvaluatorResult
                                                          └──▶ the engine analysis behind it (same call)

and the reply is built from that validated result. This module is the
explicit, versioned bridge between the contract and the historical /chat
response, which the frontend reads (`analysis`: verdict, confidence,
findings, uses, strategy, retrieval). For the local reference the bridge is
exact: the legacy `analysis` is the very analysis the validated result was
built from, so the response is unchanged (tests/test_chat_runtime.py replays
192 recorded responses). What is new travels in `evaluation`.

What it does NOT do, by design:
  * choose how to teach — strategy stays in `choose_strategy` (server, within a
    conversation) and `teachingPolicy.js` / `chatEvidence.js` (device, across
    days);
  * grant anything — the contract has no field for mastery, XP, level,
    progress, milestones or curriculum, and `evaluation` only PROPOSES an
    evidence kind, which the device may lower and never raise;
  * call a remote provider — the product adapter is the local reference.
    `use_adapter_for_tests` exists so the tests can prove the fallbacks; it is
    not configurable from the environment or a request.
"""
from __future__ import annotations

import re
from contextlib import contextmanager
from dataclasses import dataclass

from ai.evaluator_adapters import EvaluatorAdapter, LocalReferenceEvaluator, evaluate_safely
from ai.evaluator_contract import CONTRACT_VERSION, MAX_RESPONSE_CHARS, EvaluatorRequest, EvaluatorResult, RejectedResult

CHAT_EVALUATION_VERSION = "chat-evaluation/1"
# A chat turn counts toward no curriculum level (chatEvidence.js). The request
# still has to name one, and only an OPEN level is accepted for a learner: the
# chat names the one level that is open, Pre-A1. This is not the learner's level.
CHAT_EVIDENCE_LEVEL = "pre_a1"
CHAT_CAPABILITY = "free_conversation"
CHAT_OBJECTIVE = "free conversation in English"
ASSISTANCE_STATES = frozenset({"none", "hint_shown", "model_shown", "retry", "suggestion_sent"})

_product_adapter: EvaluatorAdapter = LocalReferenceEvaluator()
_adapter: EvaluatorAdapter = _product_adapter


@contextmanager
def use_adapter_for_tests(adapter: EvaluatorAdapter):
    """Tests only: swap the adapter to prove timeouts, failures and hostile answers fall back."""
    global _adapter
    previous, _adapter = _adapter, adapter
    try:
        yield
    finally:
        _adapter = previous


@dataclass(frozen=True)
class ChatEvaluation:
    analysis: dict          # the historical `analysis` shape the reply builder and the frontend read
    evaluation: dict        # `chat-evaluation/1`: what the contract said, for the response
    result: EvaluatorResult | None
    copied: bool


_WORDS = re.compile(r"[a-z]+(?:'[a-z]+)?")


def _norm(text: str | None) -> str:
    return " ".join(_WORDS.findall(str(text or "").lower()))


def safe_assistance(value) -> str:
    return value if isinstance(value, str) and value in ASSISTANCE_STATES else "none"


def _apply(message: str, findings: list[dict]) -> str:
    out = message
    for f in findings:
        out = re.sub(rf"\b{re.escape(f['original'])}\b", f["replacement"], out, count=1, flags=re.I)
    return out.strip()


_CONFIDENCE = {"confident": "high", "tentative": "medium", "unsure": "low"}
_VERDICT = {"error_found": "error", "no_issue_detected": "no_issue_detected", "ambiguous": "no_issue_detected",
            "not_evaluable": "insufficient", "off_objective": "insufficient"}


def _analysis_from_result(result: EvaluatorResult, message: str) -> dict:
    """The historical shape, built from a validated contract answer of a NON-local adapter.

    Only what the contract carries: no rule facts, no correct-use list. The
    explanation is the provider's own (already validated for language and
    manipulation); the reply builder uses it instead of composing one.
    """
    findings = [{"rule": f.rule, "original": f.original, "replacement": f.replacement,
                 "confidence": _CONFIDENCE[f.certainty], "facts": {}} for f in result.findings]
    analysis = {"verdict": _VERDICT[result.verdict], "confidence": _CONFIDENCE[result.certainty],
                "findings": findings, "uses": [], "source": "provider"}
    if findings:
        analysis["corrected"] = _apply(message, findings)
        analysis["provided_explanation"] = result.explanation
    return analysis


def _evaluation(result: EvaluatorResult | None, used: str, incidents: list[str], kind: str, criterion=None) -> dict:
    return {
        "version": CHAT_EVALUATION_VERSION, "contract_version": CONTRACT_VERSION,
        "verdict": result.verdict if result else "not_evaluable",
        "certainty": result.certainty if result else "unsure",
        "evidence": {"kind": kind, "criterion": criterion},
        "source": result.source if result else "none", "used": used, "incidents": incidents,
    }


def evaluate_chat_turn(message: str, lang: str, *, assistance: str = "none",
                       previous_correction: str | None = None) -> ChatEvaluation:
    """One evaluation of one free-chat message. Never raises."""
    text = message.strip()[:MAX_RESPONSE_CHARS]
    # Typing back the correction Lingua has just shown is copying, whatever the text says.
    copied = bool(previous_correction) and _norm(text) == _norm(previous_correction) and bool(_norm(text))
    assistance = "model_shown" if copied else safe_assistance(assistance)
    if not text:
        return ChatEvaluation({"verdict": "insufficient", "confidence": "high", "findings": [], "uses": [],
                               "source": "local_rules"}, _evaluation(None, "none", ["empty_message"], "insufficient"), None, copied)
    request = EvaluatorRequest(learner_language=lang, level=CHAT_EVIDENCE_LEVEL, capability=CHAT_CAPABILITY,
                               objective=CHAT_OBJECTIVE, response_text=text, assistance=assistance)
    try:
        safe = evaluate_safely(_adapter, request)
    except RejectedResult as rejected:
        # The reference itself failed validation: a bug, never a reason to show an
        # unvalidated correction. Say nothing about the sentence.
        incidents = [f"reference_rejected:{code}" for code in rejected.codes]
        return ChatEvaluation({"verdict": "insufficient", "confidence": "low", "findings": [], "uses": [],
                               "source": "local_rules"}, _evaluation(None, "none", incidents, "not_evaluable"), None, copied)
    result = safe.result
    if result is None:   # the request itself was refused (cannot happen with the chat's fixed request)
        return ChatEvaluation({"verdict": "insufficient", "confidence": "low", "findings": [], "uses": [],
                               "source": "local_rules"}, _evaluation(None, "refused", list(safe.incidents), "not_evaluable"), None, copied)
    if safe.local_analysis is not None:
        analysis = dict(safe.local_analysis)
    else:
        analysis = _analysis_from_result(result, text)
    kind = result.evidence.kind
    if copied and kind in {"assisted", "accepted_under_criterion", "insufficient"}:
        kind = "copied"
    return ChatEvaluation(analysis, _evaluation(result, safe.used, list(safe.incidents), kind, result.evidence.criterion),
                          result, copied)
