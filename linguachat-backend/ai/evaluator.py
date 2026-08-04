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
    # third Pre-A1 arc
    "missing_object", "missing_verb", "missing_negation", "no_preference", "no_request",
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


_ORIGIN_LEAD = re.compile(r"^\s*(i\s*'?\s*m|i\s+am|i)?\s*(from)?\s*", re.IGNORECASE)


_LOOKS_LIKE_QUESTION = re.compile(r"^(where|what|who|when|why|how|which|do|does|are|is|can)\b", re.I)


def place_from_answer(text: str) -> str:
    """
    The place the learner just named, in their own words, so the model answer
    echoes what they said ("Colombia." -> "I'm from Colombia.") instead of a
    previously stored place, which would read as a correction of their country.
    """
    raw = str(text or "").strip().rstrip(".!?¡¿,;: ")
    if not raw:
        return ""
    # A reply that ASKS something is not naming a place, however short it is:
    # treating it as one produced model answers like "I'm from Where you from."
    if "?" in str(text) or _LOOKS_LIKE_QUESTION.match(raw):
        return ""
    rest = _ORIGIN_LEAD.sub("", raw, count=1).strip()
    if not rest or not re.search(r"[^\W\d_]", rest, re.UNICODE):
        return ""
    return rest if len(rest.split()) <= 4 else ""


def _answer_origin(text: str, place: str) -> dict:
    """The place itself is never judged — only the English structure is taught."""
    n = normalize(text)
    named = place_from_answer(text)
    natural = f"I'm from {named or (place or '').strip() or 'Colombia'}."
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


# ---- third Pre-A1 arc: preferences, wants and needs ----
_LIKE = re.compile(r"\b(i (really |kind of |sort of )?like|i love|i enjoy)\b")
_DISLIKE = re.compile(r"\b(i (really )?(don'?t|do not) (really )?like|i dislike|i hate)\b")
_ASK_PREF = re.compile(r"\b((and )?what (kind of |type of )?\w*\s?do you like|what do you like|do you like\b|how about you)\b")
_ASK_PREF_NO_AUX = re.compile(r"\b(what you like|you like\b)")
_WANT = re.compile(r"\b(i want|i'?d like|i would like|can i (have|get))\b")
_NEED = re.compile(r"\b(i need|i really need)\b")
_ASK_WANT = re.compile(r"\b(do you want|would you like|do you need)\b")
_ACCEPT = re.compile(r"\b(yes,? please|yes,? thank you|yes,? thanks|sure|sounds good|let'?s do it)\b")
_DECLINE = re.compile(r"\b(no,? thank you|no,? thanks|not now|maybe later)\b")
_YES_DO = re.compile(r"\b(yes,? i do|yes|yeah|yep)\b")
_NO_DONT = re.compile(r"\b(no,? i (don'?t|do not)|no|nope)\b")
_FILLER = re.compile(r"\b(i|like|want|need|don'?t|do|not|really|the|a|an|please|thank|you|yes|no)\b")


def _has_object(n: str) -> bool:
    rest = _FILLER.sub("", n).strip()
    return bool(re.search(r"[^\W\d_]", rest, re.UNICODE))


def _express_like(text: str, noun: str) -> dict:
    n = normalize(text)
    natural = f"I like {noun or 'music'}."
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if _DISLIKE.search(n):
        # not liking something is a perfectly good sentence for this step
        return _base(completed_objective=True, accepted_variant=True, natural_version=natural, confidence=0.93)
    if _LIKE.search(n) and _has_object(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=not n.startswith("i like "), confidence=0.96)
    if _LIKE.search(n):
        return _base(error_type="missing_object", retry_required=True, natural_version=natural, confidence=0.8)
    if _has_object(n) and len(n.split()) <= 3:
        return _base(error_type="missing_verb", retry_required=True, natural_version=natural, confidence=0.8)
    return _base(error_type="no_preference", retry_required=True, natural_version=natural, confidence=0.7)


def _express_dislike(text: str, noun: str) -> dict:
    n = normalize(text)
    natural = f"I don't like {noun or 'coffee'}."
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if _DISLIKE.search(n) and _has_object(n):
        return _base(completed_objective=True, natural_version=natural, confidence=0.95)
    return _base(error_type="missing_negation", retry_required=True, natural_version=natural, confidence=0.8)


def _ask_preference(text: str) -> dict:
    n = normalize(text)
    natural = "What do you like?"
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if _ASK_PREF.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=not re.fullmatch(r"what do you like", n), confidence=0.95)
    if _ASK_PREF_NO_AUX.search(n):
        return _base(error_type="missing_auxiliary", retry_required=True, natural_version=natural, confidence=0.85)
    return _base(error_type="no_question", retry_required=True, natural_version=natural, confidence=0.75)


def _yes_no_preference(text: str) -> dict:
    n = normalize(text)
    natural = "Yes, I do."
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if _YES_DO.search(n) or _NO_DONT.search(n):
        return _base(completed_objective=True, natural_version=natural, confidence=0.94)
    return _base(error_type="no_answer", retry_required=True, natural_version=natural, confidence=0.8)


def _express_want(text: str, noun: str) -> dict:
    n = normalize(text)
    natural = f"I want {noun or 'water'}."
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    # want vs need is not a serious error when the request is understood
    if (_WANT.search(n) or _NEED.search(n)) and _has_object(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=not n.startswith("i want "), confidence=0.95)
    if _has_object(n) and (len(n.split()) <= 3 or "please" in n):
        return _base(error_type="missing_verb", retry_required=True, natural_version=natural, confidence=0.8)
    return _base(error_type="no_request", retry_required=True, natural_version=natural, confidence=0.7)


def _express_need(text: str, noun: str) -> dict:
    n = normalize(text)
    natural = f"I need {noun or 'help'}."
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if (_NEED.search(n) or _WANT.search(n)) and _has_object(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=not n.startswith("i need "), confidence=0.95)
    if _has_object(n) and len(n.split()) <= 3:
        return _base(error_type="missing_verb", retry_required=True, natural_version=natural, confidence=0.8)
    return _base(error_type="no_request", retry_required=True, natural_version=natural, confidence=0.7)


def _ask_want(text: str, noun: str) -> dict:
    n = normalize(text)
    natural = f"Do you want {noun or 'water'}?"
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if _ASK_WANT.search(n):
        return _base(completed_objective=True, natural_version=natural, confidence=0.95)
    if re.search(r"\byou want\b", n):
        return _base(error_type="missing_auxiliary", retry_required=True, natural_version=natural, confidence=0.85)
    return _base(error_type="no_question", retry_required=True, natural_version=natural, confidence=0.75)


def _offer_reply(text: str, natural: str) -> dict:
    """Accepting and declining are both correct replies to an offer."""
    n = normalize(text)
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if _ACCEPT.search(n) or _DECLINE.search(n):
        return _base(completed_objective=True, natural_version=natural, confidence=0.94)
    return _base(error_type="no_answer", retry_required=True, natural_version=natural, confidence=0.8)


def _simple_plan(text: str, noun: str, activity: str = "") -> dict:
    n = normalize(text)
    # The model answer proposes what this episode is actually about, mirroring
    # the frontend: offering "listen to music" inside a trip episode is noise.
    natural = f"I like {noun or 'music'}. Do you want to {activity or 'listen to music'}?"
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    states = bool(_LIKE.search(n) or _DISLIKE.search(n) or _WANT.search(n) or _NEED.search(n))
    carries = bool(_ASK_PREF.search(n) or _ASK_WANT.search(n) or _ACCEPT.search(n) or _DECLINE.search(n))
    if states and carries:
        return _base(completed_objective=True, accepted_variant=True, natural_version=natural, confidence=0.93)
    if states:
        return _base(error_type="incomplete_turn", retry_required=True, natural_version=natural, confidence=0.85)
    return _base(error_type="no_preference", retry_required=True, natural_version=natural, confidence=0.7)



# ---- fourth Pre-A1 arc: the cafe ----
# The request is a QUESTION ("Can I have ...?"), so it needs its own object
# test: _has_object would see "can" and "have" and report an object in
# "Can I have, please?".
_REQUEST_FORM = re.compile(r"\b(can i have|can i get|could i have|could i get|may i have|may i get|i'?d like|i would like)\b")
_PLEASE = re.compile(r"\bplease\b")
_THANKS = re.compile(r"\b(thank you|thanks|thank u|thank you very much|thanks a lot|many thanks)\b")
_FINISH = re.compile(r"\b(that'?s all|that is all|that'?s it|nothing else|no more|that'?ll be all|that will be all)\b")
_BARE_YES = re.compile(r"^(yes|yeah|yep|yup|ok|okay|sure)$")
_BARE_NO = re.compile(r"^(no|nope|nah)$")
_REQUEST_FILLER = re.compile(r"\b(please|thanks|thank you|thank|you|some|a|an|the|of|and|for|me)\b")


def _names_a_thing(n: str) -> bool:
    rest = _REQUEST_FILLER.sub(" ", _REQUEST_FORM.sub(" ", n)).strip()
    return bool(re.search(r"[^\W\d_]", rest, re.UNICODE))


def _polite_request(text: str, thing: str) -> dict:
    n = normalize(text)
    natural = f"Can I have {thing or 'water'}, please?"
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if _REQUEST_FORM.search(n) and _names_a_thing(n):
        # "please" is warmth on top of the taught frame, never the pass mark
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=not _PLEASE.search(n) or not n.startswith("can i have "),
                     confidence=0.95)
    if _REQUEST_FORM.search(n):
        return _base(error_type="missing_request_object", retry_required=True, natural_version=natural, confidence=0.85)
    # "Water, please." — polite and understood, just not the structure taught
    if _PLEASE.search(n) and _names_a_thing(n):
        return _base(error_type="missing_request_form", retry_required=True, natural_version=natural, confidence=0.85)
    # "I want water." — the previous episode's structure; a register note
    if (_WANT.search(n) or _NEED.search(n)) and _has_object(n):
        return _base(error_type="previous_structure", retry_required=True, natural_version=natural, confidence=0.85)
    return _base(error_type="no_request", retry_required=True, natural_version=natural, confidence=0.7)


def _thank_service(text: str) -> dict:
    n = normalize(text)
    natural = "Thank you."
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if _THANKS.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=n != "thank you", confidence=0.96)
    return _base(error_type="no_thanks", retry_required=True, natural_version=natural, confidence=0.85)


def _respond_anything_else(text: str) -> dict:
    n = normalize(text)
    natural = "No, thank you."
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if (_ACCEPT.search(n) or _DECLINE.search(n) or _FINISH.search(n)
            or (_REQUEST_FORM.search(n) and _names_a_thing(n))):
        return _base(completed_objective=True, natural_version=natural, confidence=0.94)
    # a bare yes/no answers the question but misses the polite half
    if _BARE_YES.search(n) or _BARE_NO.search(n):
        return _base(error_type="incomplete_politeness", retry_required=True, natural_version=natural, confidence=0.9)
    return _base(error_type="no_answer", retry_required=True, natural_version=natural, confidence=0.7)


def _finish_order(text: str) -> dict:
    n = normalize(text)
    natural = "That’s all, thanks."
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if _FINISH.search(n) or _DECLINE.search(n):
        return _base(completed_objective=True, natural_version=natural, confidence=0.94)
    if _BARE_NO.search(n):
        return _base(error_type="incomplete_politeness", retry_required=True, natural_version=natural, confidence=0.9)
    return _base(error_type="no_close", retry_required=True, natural_version=natural, confidence=0.7)


def _cafe_order(text: str, thing: str) -> dict:
    n = normalize(text)
    natural = f"Can I have {thing or 'water'}, please? That’s all, thanks."
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    asks = bool(_REQUEST_FORM.search(n) and _names_a_thing(n))
    closes = bool(_THANKS.search(n) or _FINISH.search(n) or _PLEASE.search(n))
    if asks and closes:
        return _base(completed_objective=True, accepted_variant=True, natural_version=natural, confidence=0.93)
    if asks:
        return _base(error_type="incomplete_turn", retry_required=True, natural_version=natural, confidence=0.85)
    return _base(error_type="no_order", retry_required=True, natural_version=natural, confidence=0.7)



# ---- fifth arc: repair and closing (mirrors the frontend evaluator) ----
#
# One intent with three strategies, chosen by `repair_kind`, plus the close. The
# frontend sends which strategy the turn asked for; without it the safest target
# is the one the arc introduces first.
_REPAIR_KINDS = ("signal_nonunderstanding", "repeat", "slow_down")
_NOT_UNDERSTAND = re.compile(
    r"\b(i (really )?(don'?t|do not) understand|i (don'?t|do not) get (it|that)"
    r"|i'?m (not sure|lost)|i didn'?t (understand|catch|get) (that|it))\b")
_NOT_UNDERSTAND_LOOSE = re.compile(r"\b((don'?t|do not|not) understand|no understand|understand not)\b")
_ASK_REPEAT = re.compile(
    r"\b((can|could|would) you (please )?(repeat|say (that|it) again)|please repeat"
    r"|repeat that|say (that|it) again)\b")
_ASK_REPEAT_LOOSE = re.compile(r"\b(repeat|again)\b")
# the adverb is the target: "Speak slow." communicates and is not the sentence taught
_ASK_SLOW = re.compile(
    r"\b((can|could) you (please )?speak (more )?slowly|please speak (more )?slowly"
    r"|speak (more )?slowly|slowly,? please)\b")
_ASK_SLOW_LOOSE = re.compile(r"\b(slow(ly)?|slow down)\b")
_DONT_KNOW = re.compile(r"\b(i (don'?t|do not) know|no idea|dunno)\b")
_BARE_CONFUSION = re.compile(r"^(what|sorry|huh|eh|again|pardon|excuse me)[?!.]*$")
_SORRY = re.compile(r"\b(sorry|excuse me|pardon)\b")
_CLOSE_ENCOUNTER = re.compile(
    r"\b(good ?bye|bye bye|bye|see you( later| soon| tomorrow)?|see ya|catch you later|take care)\b")

_REPAIR_TARGET = {
    "signal_nonunderstanding": "I don’t understand.",
    "repeat": "Can you repeat, please?",
    "slow_down": "Please speak slowly.",
}


def _repair_request(text: str, repair_kind: str) -> dict:
    kind = repair_kind if repair_kind in _REPAIR_KINDS else "signal_nonunderstanding"
    natural = _REPAIR_TARGET[kind]
    n = normalize(text)
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)

    signalled = bool(_NOT_UNDERSTAND.search(n))
    asked_repeat = bool(_ASK_REPEAT.search(n))
    asked_slow = bool(_ASK_SLOW.search(n))
    done = signalled if kind == "signal_nonunderstanding" else asked_repeat if kind == "repeat" else asked_slow
    if done:
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=normalize(natural) != n, confidence=0.95)

    # a different repair: the conversation was kept alive, which is the skill
    if signalled or asked_repeat or asked_slow:
        return _base(error_type="other_repair", retry_required=True, natural_version=natural, confidence=0.9)

    # "I don't know." answers a question instead of reporting a breakdown
    if _DONT_KNOW.search(n):
        return _base(error_type="means_dont_know", retry_required=True, natural_version=natural, confidence=0.92)

    loose = (_NOT_UNDERSTAND_LOOSE if kind == "signal_nonunderstanding"
             else _ASK_REPEAT_LOOSE if kind == "repeat" else _ASK_SLOW_LOOSE)
    if loose.search(n):
        return _base(error_type="incomplete_repair", retry_required=True, natural_version=natural, confidence=0.88)

    # "What?" does signal a breakdown, and is not the polite sentence taught
    if _BARE_CONFUSION.search(n) or _SORRY.search(n):
        return _base(error_type="too_short_repair", retry_required=True, natural_version=natural, confidence=0.9)

    return _base(error_type="no_repair", retry_required=True, natural_version=natural,
                 confidence=0.85 if len(n.split()) < 4 else 0.5)


def _close_encounter(text: str) -> dict:
    natural = "Bye."
    n = normalize(text)
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if _CLOSE_ENCOUNTER.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=not re.fullmatch(r"(bye|good ?bye)", n), confidence=0.95)
    # thanking someone is warm, and it is not a goodbye
    if _THANKS.search(n):
        return _base(error_type="not_a_close", retry_required=True, natural_version=natural, confidence=0.9)
    return _base(error_type="no_close_yet", retry_required=True, natural_version=natural,
                 confidence=0.85 if len(n.split()) < 4 else 0.5)


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
    # third arc — the target noun follows the learner's own interest, but ONLY
    # where the sentence is about a preference. Wants and needs are practised
    # with what episode 8 actually taught ("I need help.", not "I need music.").
    noun = payload.get("target_noun") or ""
    if kind == "express_like":
        return _express_like(text, noun)
    if kind == "express_dislike":
        return _express_dislike(text, "")
    if kind == "ask_preference":
        return _ask_preference(text)
    if kind == "yes_no_preference":
        return _yes_no_preference(text)
    if kind == "express_want":
        return _express_want(text, "")
    if kind == "express_need":
        return _express_need(text, "")
    if kind == "ask_want":
        return _ask_want(text, "")
    if kind == "accept_offer":
        return _offer_reply(text, "Yes, please.")
    if kind == "decline_offer":
        return _offer_reply(text, "No, thank you.")
    if kind == "simple_plan_conversation":
        return _simple_plan(text, noun, payload.get("target_activity") or "")
    # fourth arc — what is asked for comes from the frontend's semantic layer,
    # which has already refused anything that is not orderable. An empty value
    # falls back to water rather than to whatever the learner happens to like.
    thing = payload.get("target_thing") or ""
    if kind == "polite_request":
        return _polite_request(text, thing)
    if kind == "thank_service":
        return _thank_service(text)
    if kind == "respond_anything_else":
        return _respond_anything_else(text)
    if kind == "finish_order":
        return _finish_order(text)
    if kind == "cafe_order_conversation":
        return _cafe_order(text, thing)
    # fifth arc — which repair the turn asked for travels with the request; an
    # absent value falls back to the strategy the arc teaches first rather than
    # guessing from the sentence.
    if kind == "repair_request":
        return _repair_request(text, payload.get("repair_kind") or "")
    if kind == "close_encounter":
        return _close_encounter(text)
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
    # only for the repair family, and only when the turn said which strategy
    repair_kind = payload.get("repair_kind") or ""
    if payload.get("expected_intent") == "repair_request" and repair_kind:
        context += f"\nRepair strategy this turn practises: {repair_kind}"

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
    """Single, never-raising entry point. Returns a validated EvaluationResult.

    The provider is asked only when one is actually configured, and whatever it
    answers must survive validation before it is trusted: a timeout, an error, a
    malformed verdict or a self-contradicting one all land on the same
    conservative deterministic fallback, so the learner is never blocked and
    never told they succeeded on the strength of a broken answer.
    """
    from ai.providers import EvaluationContext, get_provider

    provider = get_provider()
    if provider.configured:
        try:
            raw = provider.evaluate(EvaluationContext.from_payload(payload))
            validated = validate_remote(raw)
            if validated is not None:
                return EvaluationResult(**validated)
            logger.warning("evaluator: %s verdict failed validation; using fallback", provider.name)
        except Exception as exc:  # timeout, network, invalid JSON, etc.
            logger.warning("evaluator: %s path failed (%s); using fallback", provider.name, exc)
        result = evaluate_deterministic(payload)
        result["source"] = "fallback"
        return EvaluationResult(**result)

    return EvaluationResult(**evaluate_deterministic(payload))
