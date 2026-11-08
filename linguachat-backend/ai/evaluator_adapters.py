"""Evaluator adapters (P4): the reference implementation and the safe call path.

``LocalReferenceEvaluator`` is the free rule engine speaking the contract —
the implementation every future provider is compared against.

``EvaluatorAdapter`` is the boundary a future provider would implement. None is
implemented here: no commercial service is connected, and the only scripted
adapter lives in the tests, named as a test tool.

``evaluate_safely`` is the only way a result should reach the product: the
request is checked, the adapter is called within a time budget, the answer is
validated, and on ANY failure (rejection, timeout, network error, empty or
malformed answer) the local reference answers instead, with the incident
recorded. P5: /chat uses it, through ``ai/chat_evaluation.py`` (owner's
authorisation of 2026-10-31, local reference only — no remote provider).
"""
from __future__ import annotations

import concurrent.futures
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field

from ai.evaluator_contract import (
    CONTRACT_VERSION, EvaluatorRequest, EvaluatorResult, Evidence, Finding, RejectedResult,
    check_request, validate_result,
)
from ai.local_engine import _explain, assess, choose_strategy

DEFAULT_TIMEOUT_S = 4.0


class EvaluatorAdapter(ABC):
    """What a provider implements. Returns RAW data; it is never trusted as is."""

    name = "abstract"

    @abstractmethod
    def evaluate(self, request: EvaluatorRequest) -> object: ...


class LocalReferenceEvaluator(EvaluatorAdapter):
    """The free local engine, speaking the contract. Deterministic, offline."""

    name = "local_rules"

    def evaluate(self, request: EvaluatorRequest) -> dict:
        return self.evaluate_detailed(request)[0]

    def evaluate_detailed(self, request: EvaluatorRequest) -> tuple[dict, dict]:
        """The contract answer AND the engine's own analysis it was built from.

        One `assess` call serves both, so the chat never evaluates a message
        twice: the contract answer is validated, and only then is the analysis
        behind it used (corrected sentence, rule facts, correct uses).
        """
        profile = {"native_language": request.learner_language}
        analysis = assess(request.response_text, profile)
        return self._contract(request, analysis), analysis

    def _contract(self, request: EvaluatorRequest, analysis: dict) -> dict:
        profile = {"native_language": request.learner_language}
        verdict = analysis["verdict"]
        findings = []
        for f in analysis.get("findings", []):
            findings.append({
                "rule": f["rule"], "original": f["original"], "replacement": f["replacement"],
                "justification": f"{f['original']} → {f['replacement']} ({f['rule']})",
                "certainty": "confident" if f["confidence"] == "high" else "tentative",
            })
        if verdict == "error":
            primary = analysis["findings"][0]
            facts = {**primary["facts"], "wrong": primary["original"], "right": primary["replacement"]}
            explanation = _explain(primary["rule"], facts, choose_strategy(primary["rule"], profile), request.learner_language)
            return {
                "contract_version": CONTRACT_VERSION, "capability": request.capability, "verdict": "error_found",
                "certainty": "confident" if analysis["confidence"] == "high" else "tentative",
                "findings": findings, "explanation": explanation, "hints": [], "next_activity": "rewrite",
                "evidence": {"kind": "error"}, "source": "local_rules",
            }
        uses = analysis.get("uses") or []
        if verdict == "no_issue_detected":
            # Silence from a few rules is not a verdict of correctness.
            evidence = {"kind": "accepted_under_criterion", "criterion": f"correct {uses[0]['rule']} form: {uses[0]['form']}"} \
                if uses else {"kind": "insufficient"}
            return {
                "contract_version": CONTRACT_VERSION, "capability": request.capability, "verdict": "no_issue_detected",
                "certainty": "unsure", "findings": [], "explanation": None, "hints": [], "next_activity": "continue",
                "evidence": evidence, "source": "local_rules",
            }
        # "insufficient" (a word, punctuation) and "not_english" (the learner's own language)
        return {
            "contract_version": CONTRACT_VERSION, "capability": request.capability, "verdict": "not_evaluable",
            "certainty": "confident", "findings": [], "explanation": None, "hints": [], "next_activity": "none",
            "evidence": {"kind": "insufficient" if verdict == "insufficient" else "not_evaluable"}, "source": "local_rules",
        }


@dataclass
class SafeEvaluation:
    result: EvaluatorResult | None
    used: str                                  # adapter name that produced the result, or "refused"
    incidents: list[str] = field(default_factory=list)
    elapsed_s: float = 0.0
    # When the local reference answered: the engine analysis behind `result`.
    local_analysis: dict | None = None


_REFERENCE = LocalReferenceEvaluator()


def evaluate_safely(adapter: EvaluatorAdapter, request: EvaluatorRequest, *, timeout_s: float | None = None) -> SafeEvaluation:
    started = time.monotonic()
    timeout_s = DEFAULT_TIMEOUT_S if timeout_s is None else timeout_s
    refused = check_request(request)
    if refused:
        return SafeEvaluation(None, "refused", refused, time.monotonic() - started)
    incidents: list[str] = []
    if adapter is not _REFERENCE and not isinstance(adapter, LocalReferenceEvaluator):
        pool = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        try:
            raw = pool.submit(adapter.evaluate, request).result(timeout=timeout_s)
            result = validate_result(raw, request)
            return SafeEvaluation(result, adapter.name, [], time.monotonic() - started)
        except concurrent.futures.TimeoutError:
            incidents.append("timeout")
        except RejectedResult as rejected:
            incidents.extend(rejected.codes)
        except (ConnectionError, OSError):
            incidents.append("network_error")
        except Exception:                              # a provider bug must not reach the learner
            incidents.append("provider_error")
        finally:
            pool.shutdown(wait=False, cancel_futures=True)
    raw, analysis = _REFERENCE.evaluate_detailed(request)
    result = validate_result(raw, request)
    return SafeEvaluation(result, _REFERENCE.name, incidents, time.monotonic() - started, analysis)


def reference_result(request: EvaluatorRequest) -> EvaluatorResult:
    return validate_result(_REFERENCE.evaluate(request), request)


__all__ = ["EvaluatorAdapter", "LocalReferenceEvaluator", "SafeEvaluation", "evaluate_safely", "reference_result",
           "Finding", "Evidence"]
