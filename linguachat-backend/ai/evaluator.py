"""
LinguaLoop episode-response evaluator (backend Level 2 + safe fallback).

`evaluate_episode_response` is the single entry point used by POST
/learning/evaluate. It NEVER raises: if OpenAI is disabled, errors, times out, or
returns something that fails validation, it returns a conservative deterministic
verdict so an episode can always be finished offline. The deterministic mirror of
the frontend evaluator keeps closed/clear cases fast and network-free.
"""
from __future__ import annotations

import logging
import os
import re
import unicodedata

from ai.openai_tutor import openai_tutor
from ai.schemas import EvaluationResult


logger = logging.getLogger(__name__)

_ALLOWED_ERROR_TYPES = {
    None, "empty", "missing_copula", "missing_name", "greeting_only",
    "no_intro", "question_order", "no_question", "missing_close", "unclear",
    # second Pre-A1 arc
    "missing_auxiliary", "missing_from", "no_answer", "incomplete_turn",
}

# ---- normalization (mirrors the frontend responseEvaluation) ----
_APOS = re.compile(r"[’‘‛`´]")
_NON_WORD = re.compile(r"[^\w'\s]", re.UNICODE)
_SPACES = re.compile(r"\s+")


def normalize(text: str) -> str:
    text = _APOS.sub("'", str(text or ""))
    text = text.lower()
    text = _NON_WORD.sub(" ", text)
    return _SPACES.sub(" ", text).strip()


def fold(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", str(text or ""))
    return "".join(c for c in decomposed if not unicodedata.combining(c)).lower()


_GREETING = re.compile(r"\b(hi|hello|hey|good morning|good afternoon|good evening)\b")
_GREETING_G = re.compile(r"\b(hi|hello|hey|there|good morning|good afternoon|good evening)\b")
_INTRO = re.compile(
    r"\b(i'?m called|i'?m|i am called|i am|my name'?s|my name is|name'?s|name is|"
    r"(?:you can |they |people |everyone |friends )?call me|i go by|go by)\b"
)
_INTRO_G = re.compile(
    r"\b(i'?m called|i'?m|i am called|i am|my name'?s|my name is|name'?s|name is|"
    r"call me|i go by|go by|you can|they|people|everyone|friends)\b"
)
_ASK = re.compile(
    r"\b((and )?(what'?s|what is) your name|(may|can) i ask (for )?your name|and your name)\b"
)
_NICE = re.compile(r"\bnice (to meet|meeting) you\b")
_RECIPROCAL = re.compile(r"^(you too|same|same here|likewise|and you)\.?!?$")


def _word_count(n: str) -> int:
    return len([w for w in n.split(" ") if w])


def _has_name(n: str, name: str) -> bool:
    rest = _SPACES.sub(" ", _INTRO_G.sub(" ", _GREETING_G.sub(" ", n))).strip()
    if rest and re.search(r"[^\W\d_]", rest, re.UNICODE):
        return True
    folded_name = fold((name or "").strip())
    return bool(folded_name and folded_name in fold(n))


def _base(**kw) -> dict:
    result = {
        "understood": True,
        "completed_objective": False,
        "accepted_variant": False,
        "confidence": 0.9,
        "error_type": None,
        "priority_correction": None,
        "natural_version": None,
        "explanation": None,
        "retry_required": False,
        "retry_prompt": None,
        "source": "deterministic",
    }
    result.update(kw)
    return result


def _intro(text: str, name: str) -> dict:
    n = normalize(text)
    natural = f"Hi, I'm {(name or 'Alex').strip() or 'Alex'}."
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True,
                     natural_version=natural, confidence=0.95)
    greeting = bool(_GREETING.search(n))
    copula = bool(_INTRO.search(n))
    name_ok = _has_name(n, name)
    if copula and name_ok:
        variant = not (greeting and re.search(r"i'?m|i am|my name is", n))
        return _base(completed_objective=True, accepted_variant=variant,
                     natural_version=natural, confidence=0.96)
    if not copula and name_ok:
        return _base(error_type="missing_copula", retry_required=True,
                     natural_version=natural, confidence=0.8)
    if copula and not name_ok:
        return _base(error_type="missing_name", retry_required=True,
                     natural_version=natural, confidence=0.85)
    if greeting:
        return _base(error_type="greeting_only", retry_required=True,
                     natural_version=natural, confidence=0.85)
    return _base(error_type="no_intro", retry_required=True,
                 natural_version=natural, confidence=0.7)


def _ask(text: str) -> dict:
    n = normalize(text)
    natural = "What's your name?"
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True,
                     natural_version=natural, confidence=0.95)
    if _ASK.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=not re.fullmatch(r"what'?s your name", n),
                     confidence=0.95)
    if re.search(r"\bname\b", n):
        return _base(error_type="question_order", retry_required=True,
                     natural_version=natural, confidence=0.8)
    return _base(error_type="no_question", retry_required=True,
                 natural_version=natural, confidence=0.75)


def _nice(text: str, turn: dict) -> dict:
    n = normalize(text)
    natural = "Nice to meet you."
    lingua_said = normalize((turn or {}).get("lingua_said") or "")
    as_response = bool(re.search(r"nice (to meet|meeting) you", lingua_said))
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True,
                     natural_version=natural, confidence=0.95)
    if _NICE.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=bool(re.search(r"too\b", n) or "meeting you" in n),
                     confidence=0.95)
    if _RECIPROCAL.match(n):
        if as_response:
            return _base(completed_objective=True, accepted_variant=True,
                         natural_version=natural, confidence=0.9)
        return _base(error_type="missing_close", retry_required=True,
                     natural_version=natural, confidence=0.85)
    return _base(error_type="missing_close", retry_required=True,
                 natural_version=natural, confidence=0.75)


# ---- second Pre-A1 arc: how you are, where you are from ----
_ASK_WELLBEING = re.compile(r"\b(how are you( doing| today)?|how'?re you|how are things|how'?s it going)\b")
_WELLBEING_NO_AUX = re.compile(r"\bhow (you|u)\b")
_FEELING = re.compile(r"\b(good|fine|okay|ok|great|well|tired|happy|sleepy|so so|not bad|alright)\b")
_IM = re.compile(r"\b(i'?m|i am)\b")
_RECIPROCAL_Q = re.compile(r"\b(and you|what about you|how about you|and yourself)\b")
_ASK_ORIGIN = re.compile(r"\b((and )?where are you from|what country are you from|where do you come from)\b")
_ORIGIN_NO_AUX = re.compile(r"\bwhere (you|u) from\b")
_FROM_PLACE = re.compile(r"\bfrom\s+[^\W\d_]", re.UNICODE)


def _ask_wellbeing(text: str) -> dict:
    n = normalize(text)
    natural = "How are you?"
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if _ASK_WELLBEING.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=not re.fullmatch(r"how are you", n), confidence=0.95)
    if _WELLBEING_NO_AUX.search(n):
        return _base(error_type="missing_auxiliary", retry_required=True, natural_version=natural, confidence=0.85)
    return _base(error_type="no_question", retry_required=True, natural_version=natural, confidence=0.75)


def _answer_wellbeing(text: str) -> dict:
    n = normalize(text)
    natural = "I'm good."
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    feeling = bool(_FEELING.search(n))
    polite_short = feeling and bool(re.search(r"\b(thanks|thank you)\b", n))
    if feeling and (_IM.search(n) or polite_short):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=not re.fullmatch(r"i'?m good", n), confidence=0.95)
    if feeling:
        # the feeling is understood; only the structure is missing
        return _base(error_type="missing_copula", retry_required=True, natural_version=natural, confidence=0.8)
    return _base(error_type="no_answer", retry_required=True, natural_version=natural, confidence=0.7)


def _reciprocal(text: str) -> dict:
    n = normalize(text)
    natural = "And you?"
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if _RECIPROCAL_Q.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=not re.fullmatch(r"and you", n), confidence=0.95)
    return _base(error_type="no_question", retry_required=True, natural_version=natural, confidence=0.75)


def _ask_origin(text: str) -> dict:
    n = normalize(text)
    natural = "Where are you from?"
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if _ASK_ORIGIN.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=not re.fullmatch(r"where are you from", n), confidence=0.95)
    if _ORIGIN_NO_AUX.search(n):
        return _base(error_type="missing_auxiliary", retry_required=True, natural_version=natural, confidence=0.85)
    return _base(error_type="no_question", retry_required=True, natural_version=natural, confidence=0.75)


def _answer_origin(text: str, place: str) -> dict:
    """The place itself is never judged — only the English structure is taught."""
    n = normalize(text)
    natural = f"I'm from {(place or '').strip() or 'Colombia'}."
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    copula = bool(_IM.search(n))
    from_place = bool(_FROM_PLACE.search(n))
    if copula and from_place:
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=not n.startswith("i'm from"), confidence=0.96)
    if from_place:
        return _base(error_type="missing_copula", retry_required=True, natural_version=natural, confidence=0.8)
    if re.search(r"[^\W\d_]", n, re.UNICODE) and len(n.split()) <= 3:
        # a bare place name: understood, but ask for the whole sentence
        return _base(error_type="missing_from", retry_required=True, natural_version=natural, confidence=0.8)
    return _base(error_type="no_answer", retry_required=True, natural_version=natural, confidence=0.6)


def _full_conversation(text: str, name: str) -> dict:
    n = normalize(text)
    natural = f"Hi, I'm {(name or 'Alex').strip() or 'Alex'}. How are you?"
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    intro = _intro(text, name)
    carries_on = bool(_ASK_WELLBEING.search(n) or _ASK_ORIGIN.search(n) or _ASK.search(n) or _NICE.search(n))
    if intro["completed_objective"] and carries_on:
        return _base(completed_objective=True, accepted_variant=True, natural_version=natural, confidence=0.94)
    if intro["completed_objective"]:
        return _base(error_type="incomplete_turn", retry_required=True, natural_version=natural, confidence=0.85)
    return {**intro, "natural_version": natural}


def evaluate_deterministic(payload: dict) -> dict:
    kind = (payload.get("expected_intent") or payload.get("step_type") or "").strip()
    text = payload.get("learner_response") or ""
    name = payload.get("learner_name") or "Alex"
    turn = payload.get("turn_context") or {}
    if isinstance(turn, dict):
        turn_dict = turn
    else:  # Pydantic model
        turn_dict = turn.model_dump() if hasattr(turn, "model_dump") else {}
    if kind == "introduction":
        return _intro(text, name)
    if kind == "ask_name":
        return _ask(text)
    if kind == "nice_to_meet":
        return _nice(text, turn_dict)
    if kind == "ask_wellbeing":
        return _ask_wellbeing(text)
    if kind == "answer_wellbeing":
        return _answer_wellbeing(text)
    if kind == "reciprocal_question":
        return _reciprocal(text)
    if kind == "ask_origin":
        return _ask_origin(text)
    if kind == "answer_origin":
        return _answer_origin(text, payload.get("learner_place") or "")
    if kind == "full_intro_conversation":
        return _full_conversation(text, name)
    # unknown step type — do not pretend to judge it
    return _base(understood=False, error_type="unclear", retry_required=True, confidence=0.4)


# ---- strict validation of any remote (model) verdict ----
def validate_remote(raw: dict) -> dict | None:
    if not isinstance(raw, dict):
        return None
    completed = raw.get("completed_objective")
    if not isinstance(completed, bool):
        return None
    retry = raw.get("retry_required")
    if completed is True and retry is True:
        return None
    if completed is False and retry is False:
        return None
    error_type = raw.get("error_type")
    if error_type not in _ALLOWED_ERROR_TYPES:
        error_type = "unclear"
    natural = raw.get("natural_version")
    if natural is not None and (not isinstance(natural, str) or not natural or len(natural) > 120):
        return None
    explanation = raw.get("explanation")
    if explanation is not None and (not isinstance(explanation, str) or len(explanation) > 300):
        return None
    confidence = raw.get("confidence")
    if not isinstance(confidence, (int, float)) or not (0.0 <= float(confidence) <= 1.0):
        confidence = 0.75
    return {
        "understood": raw.get("understood", True) is not False,
        "completed_objective": completed,
        "accepted_variant": bool(raw.get("accepted_variant")),
        "confidence": float(confidence),
        "error_type": None if completed else error_type,
        "priority_correction": (raw.get("priority_correction") or None) if not completed else None,
        "natural_version": natural,
        "explanation": (explanation or None) if not completed else None,
        "retry_required": bool(retry) if retry is not None else (not completed),
        "retry_prompt": raw.get("retry_prompt") or None,
        "source": "remote",
    }


_EVAL_SYSTEM_PROMPT = """
You are Lingua, evaluating one short answer from a Pre-A1 (absolute beginner)
English learner inside a guided episode. Judge ONLY whether the answer achieves
the communicative objective of this single step.

Rules:
- The learner level is Pre-A1. Be generous with natural, communicative answers.
- Do NOT penalize capitalization, punctuation, or the proper name spelling.
- Do NOT require perfection. Accept meaning-equivalent natural variants.
- Pick at most ONE priority error, and only if the objective is not met.
- Keep any explanation to one short sentence in the learner's native language.
- Do not write a lesson. Do not converse with the learner. Do not add extra tasks.
- Never change the target language away from English.
- If completed_objective is true, retry_required must be false and error_type null.
- If completed_objective is false, retry_required must be true.
- Return only the structured fields. Do not expose your reasoning.
""".strip()


def evaluate_with_openai(payload: dict) -> dict:
    """Call OpenAI for a structured verdict. Raises on any failure."""
    from openai import OpenAI

    client = OpenAI(
        api_key=os.environ["OPENAI_API_KEY"],
        timeout=openai_tutor.timeout_seconds,
        max_retries=1,
    )
    native = payload.get("native_language") or "the learner's native language"
    context = (
        f"Objective (expected_intent): {payload.get('expected_intent')}\n"
        f"Step type: {payload.get('step_type')}\n"
        f"Required elements: {payload.get('required_elements')}\n"
        f"What Lingua just said: {(payload.get('turn_context') or {})}\n"
        f"Learner name: {payload.get('learner_name')}\n"
        f"Native language for explanation: {native}\n"
        f"Learner answer: {payload.get('learner_response')!r}"
    )
    response = client.responses.parse(
        model=openai_tutor.model,
        input=[
            {"role": "system", "content": _EVAL_SYSTEM_PROMPT},
            {"role": "user", "content": context},
        ],
        text_format=EvaluationResult,
        max_output_tokens=200,
        store=False,
    )
    parsed = response.output_parsed
    if parsed is None:
        raise ValueError("OpenAI returned no valid structured evaluation")
    return parsed.model_dump()


def evaluate_episode_response(payload: dict) -> EvaluationResult:
    """Single, never-raising entry point. Returns a validated EvaluationResult."""
    if openai_tutor.configured:
        try:
            raw = evaluate_with_openai(payload)
            validated = validate_remote(raw)
            if validated is not None:
                return EvaluationResult(**validated)
            logger.warning("evaluator: remote verdict failed validation; using fallback")
        except Exception as exc:  # timeout, network, invalid JSON, etc.
            logger.warning("evaluator: OpenAI path failed (%s); using fallback", exc)
        result = evaluate_deterministic(payload)
        result["source"] = "fallback"
        return EvaluationResult(**result)

    return EvaluationResult(**evaluate_deterministic(payload))
