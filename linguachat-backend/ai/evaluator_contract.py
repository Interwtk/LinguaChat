"""The interchangeable evaluator contract (P4) — typed, versioned, validated.

An evaluator answers one question about one learner turn: *what is in this
text, relative to this pedagogical objective?* It reports findings, an
explanation, hints and the kind of evidence the turn could be — and nothing
else. It cannot grant mastery, change a level, move XP, unlock content or
record a milestone: those fields do not exist here, and a result that tries to
carry them is rejected. What a turn is worth for learning is decided later, by
the learning engine on the learner's device, with provenance (see the frontend
``chatEvidence.js``).

The free local rule engine is the reference implementation
(``ai/evaluator_adapters.LocalReferenceEvaluator``). No commercial provider is
connected. A future one must pass ``validate_result`` on every turn and the
quality gate in ``tests/test_evaluator_quality_gate.py`` before it may be
considered — and the owner must authorise it in writing (CLAUDE.md).

Confidence is a CATEGORY (``confident`` / ``tentative`` / ``unsure``), never a
probability: no provider here has a calibrated one, and inventing a number
would claim precision nobody measured.
"""
from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

CONTRACT_VERSION = "lingua-evaluator/1"

# --- closed vocabularies --------------------------------------------------------
LEVELS_OPEN = ("pre_a1",)                          # mirrors levels.js: A1–C2 closed
LEVELS_KNOWN = ("pre_a1", "a1", "a2", "b1", "b2", "c1", "c2")
LANGUAGES = ("en", "es", "pt", "fr", "it", "de", "ja", "ar")
CHAT_RULES = ("past_irregular", "past_marker", "third_person", "article")
# Every rule a finding may name: the chat rules, the fixed-phrase rules of the
# local engine, and "other" for a provider's finding outside them.
FINDING_RULES = frozenset(CHAT_RULES + (
    "contraction", "negation", "question_order", "spelling", "subject_needed", "want_to", "other"))
# Capability ids an objective may name: Pre-A1's thirteen exit can-dos, A1's
# sixteen blueprint can-dos (tests compare both lists with the sources), the
# chat rule families, and open conversation.
PRE_A1_CAPABILITIES = (
    "introduce_self", "ask_name", "ask_wellbeing", "ask_origin", "full_conversation", "express_preferences",
    "express_needs", "polite_request", "cafe_order", "ask_for_repair", "close_an_encounter", "identify_things",
    "use_small_numbers",
)
A1_CAPABILITIES = (
    "talk_about_work_or_study", "ask_about_work_or_study", "talk_about_daily_routine", "say_when_something_happens",
    "ask_what_something_means", "introduce_someone_else", "ask_where_something_is", "say_where_something_is",
    "ask_about_getting_somewhere", "use_bigger_numbers", "ask_the_price", "buy_something", "say_what_you_can_do",
    "ask_someone_about_ability", "ask_how_to_say_something", "arrange_to_meet",
)
CAPABILITIES = frozenset(PRE_A1_CAPABILITIES + A1_CAPABILITIES + CHAT_RULES + ("free_conversation",))

Modality = Literal["written", "listening"]           # speaking/pronunciation: not assessed by design
Assistance = Literal["none", "hint_shown", "model_shown", "retry", "suggestion_sent"]
Verdict = Literal["error_found", "no_issue_detected", "ambiguous", "not_evaluable", "off_objective"]
Certainty = Literal["confident", "tentative", "unsure"]
NextActivity = Literal["continue", "rewrite", "fill_blank", "guided_retrieval", "explain_again", "none"]
# Evidence the evaluator may PROPOSE. "retrieval", "transfer" and anything that
# sounds like mastery are decided by the learning engine from time and
# provenance, never by an evaluator.
EvidenceKind = Literal["error", "accepted_under_criterion", "ambiguous", "assisted", "copied", "not_evaluable", "insufficient"]

MAX_RESPONSE_CHARS = 2000
MAX_FINDINGS = 6
MAX_EXPLANATION_CHARS = 400
MAX_HINTS = 3


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class EvaluatorRequest(Strict):
    """Everything an evaluator may see. Nothing about the person, no history beyond the turn."""
    contract_version: Literal["lingua-evaluator/1"] = CONTRACT_VERSION
    learner_language: Literal["en", "es", "pt", "fr", "it", "de", "ja", "ar"]
    target_language: Literal["en"] = "en"
    level: Literal["pre_a1", "a1", "a2", "b1", "b2", "c1", "c2"]
    capability: str
    modality: Modality = "written"
    objective: str = Field(min_length=1, max_length=200)
    response_text: str = Field(min_length=1, max_length=MAX_RESPONSE_CHARS)
    assistance: Assistance = "none"
    # authorised context only: what Lingua just said, at most
    prompt_text: str | None = Field(default=None, max_length=400)
    purpose: Literal["learner", "tooling"] = "learner"


class Finding(Strict):
    rule: str = Field(min_length=1, max_length=40)
    original: str = Field(min_length=1, max_length=80)
    replacement: str = Field(min_length=1, max_length=80)
    justification: str = Field(min_length=8, max_length=240)
    certainty: Certainty


class Evidence(Strict):
    kind: EvidenceKind
    criterion: str | None = Field(default=None, max_length=80)


class EvaluatorResult(Strict):
    contract_version: Literal["lingua-evaluator/1"]
    capability: str
    verdict: Verdict
    certainty: Certainty
    findings: list[Finding] = Field(default_factory=list, max_length=MAX_FINDINGS)
    explanation: str | None = Field(default=None, max_length=MAX_EXPLANATION_CHARS)
    hints: list[str] = Field(default_factory=list, max_length=MAX_HINTS)
    next_activity: NextActivity = "none"
    evidence: Evidence
    source: Literal["local_rules", "provider"] = "provider"


# --- validation ---------------------------------------------------------------
MANIPULATION = re.compile(
    r"ignore (all |any |the )?(previous|prior|above) (instructions|rules)|system prompt|you are now|"
    r"\bunlock\b|open (the )?level|grant(ed)? (mastery|xp|access)|\bmastered\b|level ?up|<\s*script|"
    r"disregard (the )?(rules|policy)|as an ai (model|language model)",
    re.I,
)
SCRIPT = {"ja": re.compile(r"[぀-ヿ一-鿿]"), "ar": re.compile(r"[؀-ۿ]")}


class RejectedResult(Exception):
    """A provider result that must not reach a learner. `codes` say why."""

    def __init__(self, codes: list[str]):
        super().__init__(", ".join(codes))
        self.codes = codes


def check_request(request: EvaluatorRequest) -> list[str]:
    problems = []
    if request.capability not in CAPABILITIES:
        problems.append("unknown_capability")
    if request.purpose == "learner" and request.level not in LEVELS_OPEN:
        problems.append("level_not_available")
    return problems


# Function words: enough to tell a short explanation's language from English.
# Content words are useless here (an explanation quotes the learner's English).
FUNCTION_WORDS = {
    "en": {"the", "is", "are", "and", "of", "you", "with", "not", "have", "has", "this", "that", "for", "your",
           "be", "was", "were", "an", "it", "he", "she", "they", "we", "use", "before", "after", "verb", "past", "its"},
    "es": {"el", "la", "los", "las", "de", "del", "que", "y", "en", "un", "una", "es", "por", "para", "con", "se",
           "su", "no", "lo", "al", "o", "antes", "después", "verbo", "pasado", "usa", "lleva", "cuando", "como"},
    "pt": {"o", "os", "as", "de", "do", "da", "que", "e", "em", "um", "uma", "é", "não", "para", "com", "se", "no",
           "na", "verbo", "passado", "antes", "use", "usa", "quando", "como", "ou"},
    "fr": {"le", "la", "les", "de", "du", "des", "que", "et", "un", "une", "est", "pas", "pour", "avec", "se", "il",
           "on", "au", "en", "ce", "verbe", "devant", "avant", "utilise", "quand", "ou", "passé", "par", "sur", "dans", "d", "l"},
    "it": {"il", "lo", "la", "gli", "le", "di", "del", "che", "e", "un", "una", "è", "non", "per", "con", "si", "al",
           "verbo", "prima", "usa", "quando", "come", "o", "passato", "a", "dal", "dalla", "della", "davanti", "sul"},
    "de": {"der", "die", "das", "den", "dem", "und", "ist", "nicht", "ein", "eine", "zu", "mit", "vor", "im", "es",
           "verb", "man", "wird", "nach", "benutze", "wenn", "oder", "bei", "vergangenheit"},
}


def _language_ok(text: str, lang: str, learner_text: str = "") -> bool:
    """Is this explanation plausibly in the learner's language?

    Quoted material and the learner's own words are set aside first: an
    explanation may (and should) quote the English being corrected.
    """
    # a quote opens only where no letter precedes it: "d'un" is not a quotation
    prose = re.sub(r"(?<![^\W\d_])[\"“”«»'‘’「」][^\"“”«»「」]{1,80}?[\"“”«»'‘’「」](?![^\W\d_])", " ", text)
    if lang in SCRIPT:
        letters = [c for c in prose if c.isalpha()]
        return not letters or bool(SCRIPT[lang].search(prose))
    if any(rx.search(prose) for rx in SCRIPT.values()):
        return False
    theirs = set(re.findall(r"[^\W\d_]+", learner_text.lower()))
    words = [w for w in re.findall(r"[^\W\d_]+", prose.lower()) if w not in theirs]
    english = sum(w in FUNCTION_WORDS["en"] for w in words)
    if lang == "en":
        return True
    own = sum(w in FUNCTION_WORDS[lang] for w in words)
    if len(words) < 4:
        return english == 0 or own >= english          # too short to judge, unless plainly English
    return own >= 2 and own >= english


def validate_result(raw: object, request: EvaluatorRequest) -> EvaluatorResult:
    """Parse and check a provider's answer against the request. Raises RejectedResult."""
    codes: list[str] = []
    if raw is None or raw == "" or raw == {}:
        raise RejectedResult(["empty_response"])
    if not isinstance(raw, dict):
        raise RejectedResult(["not_an_object"])
    try:
        result = EvaluatorResult.model_validate(raw)
    except Exception as error:                          # pydantic ValidationError and friends
        text = str(error)
        codes.append("unexpected_field" if "extra_forbidden" in text or "Extra inputs" in text else "malformed")
        raise RejectedResult(codes) from None

    if result.contract_version != request.contract_version:
        codes.append("contract_version_mismatch")
    if result.capability != request.capability:
        codes.append("context_lost")                    # answered a different objective
    for f in result.findings:
        if f.rule not in FINDING_RULES:
            codes.append("unknown_rule")
        if f.original.lower() not in request.response_text.lower():
            codes.append("finding_not_in_response")    # a correction of text the learner never wrote
        if f.original.strip().lower() == f.replacement.strip().lower():
            codes.append("correction_changes_nothing")
    spans: dict[str, str] = {}
    for f in result.findings:
        key = f.original.lower()
        if key in spans and spans[key] != f.replacement.lower():
            codes.append("contradictory_corrections")
        spans[key] = f.replacement.lower()
    if result.verdict == "error_found" and not result.findings:
        codes.append("error_without_finding")
    if result.verdict != "error_found" and result.findings:
        codes.append("finding_without_error_verdict")
    if result.evidence.kind == "error" and result.verdict != "error_found":
        codes.append("evidence_contradicts_verdict")
    if result.evidence.kind == "accepted_under_criterion" and not result.evidence.criterion:
        codes.append("acceptance_without_criterion")
    texts = [result.explanation or "", *result.hints, *(f.justification for f in result.findings)]
    if any(MANIPULATION.search(t) for t in texts):
        codes.append("manipulative_text")
    if result.explanation and not _language_ok(result.explanation, request.learner_language, request.response_text):
        codes.append("wrong_language")
    if codes:
        raise RejectedResult(sorted(set(codes)))

    # Help is never independence: whatever the provider proposed, an assisted
    # turn is recorded as assisted.
    if request.assistance != "none" and result.evidence.kind in {"accepted_under_criterion", "insufficient"}:
        result = result.model_copy(update={"evidence": Evidence(kind="assisted", criterion=result.evidence.criterion)})
    return result
