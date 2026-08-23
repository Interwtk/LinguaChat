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
# One intent with six strategies, chosen by `repair_kind`, plus the close. The
# frontend sends which strategy the turn asked for; without it the safest target
# is the one the arc introduces first.
#
# `ask_meaning` arrives with A1 arc 2 and is the only one that names a word: the
# frontend passes it as `meaning_word` so both sides describe the same turn. Parity
# matters here because an inconclusive repair may escalate, and a strategy this side
# does not know would be judged against the wrong sentence.
#
# `ask_how_to_say` is A1 arc 6's fifth strategy (`ask_how_to_say_something`'s
# own `intentReuse`), mirroring `src/learning/engine/responseEvaluation.js`'s
# identical addition.
#
# `ask_to_spell` is A2 arc 5's sixth strategy (`spell_a_name_for_a_booking`'s
# own `intentReuse`) — the learner asking the OTHER speaker to spell something,
# the mirror image of `spell_word` where the learner spells their own name.
#
# `ask_for_precision` is C1's seventh strategy
# (`clarify_an_ambiguous_instruction_precisely`'s own `intentReuse`) — a
# targeted follow-up that resolves genuine ambiguity, not a generic
# "I don't understand". Unlike the six strategies above, C1's content
# dispatches this directly as `kind == "clarify_ambiguity"` (matching
# c1.json's own literal evaluationIntents id), routed here with
# `repair_kind` forced — mirroring `responseEvaluation.js`'s own routing.
_REPAIR_KINDS = ("signal_nonunderstanding", "repeat", "slow_down", "ask_meaning", "ask_how_to_say", "ask_to_spell", "ask_for_precision")
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
# "What does ___ mean?", and "What is ___?" as the same question asked another way:
# ONE word after the verb is what makes it a question about a word rather than about
# a name. `normalize` has already removed the question mark.
_ASK_MEANING = re.compile(r"\bwhat\s+(does|do)\s+.{1,30}?\s*mean\b")
_ASK_MEANING_VARIANT = re.compile(r"\b(what\s+(is|are)|what'?s)\s+[^\s]+\s*$")
_ASK_MEANING_LOOSE = re.compile(r"\b(mean|means|meaning)\b")
# "How do you say ___?", requiring a complement after "say" — a bare "how do
# you say" falls through to the loose check, same as `_ASK_MEANING`/`_VARIANT`.
_ASK_HOW_TO_SAY = re.compile(r"\bhow\s+do\s+(you|i)\s+say\s+\S+")
_ASK_HOW_TO_SAY_LOOSE = re.compile(r"\bhow\s+(do\s+you\s+)?(say|spell)\b")
# "Can you spell that, please?" — requires "that"/"it"/"this" as the object, so
# it stays distinct from `ask_how_to_say` ("How do you spell that?" is ALSO
# caught by `_ASK_HOW_TO_SAY_LOOSE`'s bare "spell" match above).
_ASK_TO_SPELL = re.compile(
    r"\b((can|could) you (please )?spell (that|it|this)|please spell (that|it|this)"
    r"|spell (that|it|this),? please)\b")
_ASK_TO_SPELL_LOOSE = re.compile(r"\bspell\b")
# C1's seventh strategy: "When you say X, do you mean...?" / "Could you be
# more specific about...?" — mirrors `responseEvaluation.js`'s
# `ASK_FOR_PRECISION`/`ASK_FOR_PRECISION_LOOSE` exactly.
_ASK_FOR_PRECISION = re.compile(
    r"\b(when you say\b[\s\S]{0,40}\bdo you mean\b|could you be more specific about"
    r"|just to make sure i understood|to make sure i (got|understood) that right)\b")
_ASK_FOR_PRECISION_LOOSE = re.compile(r"\b(more specific|do you mean|make sure i understood)\b")
_DONT_KNOW = re.compile(r"\b(i (don'?t|do not) know|no idea|dunno)\b")
_BARE_CONFUSION = re.compile(r"^(what|sorry|huh|eh|again|pardon|excuse me)[?!.]*$")
_SORRY = re.compile(r"\b(sorry|excuse me|pardon)\b")
_CLOSE_ENCOUNTER = re.compile(
    r"\b(good ?bye|bye bye|bye|see you( later| soon| tomorrow)?|see ya|catch you later|take care)\b")

_REPAIR_TARGET = {
    "signal_nonunderstanding": "I don’t understand.",
    "repeat": "Can you repeat, please?",
    "slow_down": "Please speak slowly.",
    "ask_meaning": "What does “{word}” mean?",
    "ask_how_to_say": "How do you say that in English?",
    "ask_to_spell": "Can you spell that, please?",
    "ask_for_precision": "Could you be more specific about that?",
}


def _repair_request(text: str, repair_kind: str, meaning_word: str = "") -> dict:
    kind = repair_kind if repair_kind in _REPAIR_KINDS else "signal_nonunderstanding"
    natural = _REPAIR_TARGET[kind]
    if kind == "ask_meaning":
        natural = natural.format(word=(meaning_word or "that").strip() or "that")
    n = normalize(text)
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)

    signalled = bool(_NOT_UNDERSTAND.search(n))
    asked_repeat = bool(_ASK_REPEAT.search(n))
    asked_slow = bool(_ASK_SLOW.search(n))
    asked_meaning = bool(_ASK_MEANING.search(n)) or bool(_ASK_MEANING_VARIANT.search(n))
    asked_how_to_say = bool(_ASK_HOW_TO_SAY.search(n))
    asked_to_spell = bool(_ASK_TO_SPELL.search(n))
    asked_for_precision = bool(_ASK_FOR_PRECISION.search(n))
    done = (signalled if kind == "signal_nonunderstanding"
            else asked_repeat if kind == "repeat"
            else asked_slow if kind == "slow_down"
            else asked_meaning if kind == "ask_meaning"
            else asked_how_to_say if kind == "ask_how_to_say"
            else asked_to_spell if kind == "ask_to_spell" else asked_for_precision)
    if done:
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=normalize(natural) != n, confidence=0.95)

    # the reach for the meaning question that did not arrive needs the frame, not
    # "that is not a repair"
    if kind == "ask_meaning" and _ASK_MEANING_LOOSE.search(n):
        return _base(error_type="incomplete_meaning_question", retry_required=True,
                     natural_version=natural, confidence=0.85)

    # same idea, arc 6's how-to-say question with nothing named yet
    if kind == "ask_how_to_say" and _ASK_HOW_TO_SAY_LOOSE.search(n):
        return _base(error_type="incomplete_how_to_say", retry_required=True,
                     natural_version=natural, confidence=0.7)

    # same idea, A2 arc 5's ask-to-spell question with nothing named yet
    if kind == "ask_to_spell" and _ASK_TO_SPELL_LOOSE.search(n):
        return _base(error_type="incomplete_ask_to_spell", retry_required=True,
                     natural_version=natural, confidence=0.7)

    # same idea, C1's targeted clarifying question with nothing named yet
    if kind == "ask_for_precision" and _ASK_FOR_PRECISION_LOOSE.search(n):
        return _base(error_type="incomplete_precision_question", retry_required=True,
                     natural_version=natural, confidence=0.7)

    # a different repair: the conversation was kept alive, which is the skill
    if signalled or asked_repeat or asked_slow or asked_meaning or asked_how_to_say or asked_to_spell or asked_for_precision:
        return _base(error_type="other_repair", retry_required=True, natural_version=natural, confidence=0.9)

    # "I don't know." answers a question instead of reporting a breakdown
    if _DONT_KNOW.search(n):
        return _base(error_type="means_dont_know", retry_required=True, natural_version=natural, confidence=0.92)

    loose = (_NOT_UNDERSTAND_LOOSE if kind == "signal_nonunderstanding"
             else _ASK_REPEAT_LOOSE if kind == "repeat"
             else _ASK_SLOW_LOOSE if kind == "slow_down" else _ASK_MEANING_LOOSE)
    if loose.search(n):
        return _base(error_type="incomplete_repair", retry_required=True, natural_version=natural, confidence=0.88)

    # "What?" does signal a breakdown, and is not the polite sentence taught
    if _BARE_CONFUSION.search(n) or _SORRY.search(n):
        return _base(error_type="too_short_repair", retry_required=True, natural_version=natural, confidence=0.9)

    return _base(error_type="no_repair", retry_required=True, natural_version=natural,
                 confidence=0.85 if len(n.split()) < 4 else 0.5)


# ---- A1 arc 3: who this is (mirrors the frontend evaluator) ----
#
# The first two A1 intents the blueprint marks `hybrid`, and parity matters MORE for
# these than for anything before them: a hybrid intent is one whose inconclusive
# replies escalate, so this side is where an escalated introduction actually gets
# judged. A verdict of "unclear" here would silently turn the design's escalation path
# into a dead end.
#
# What these deliberately do not check is a relationship. The arc's risk note refuses
# a family vocabulary list, so "This is Ana." is complete and a relation is a bonus.
_THIS_IS = re.compile(r"\bthis\s+is\b")
_HERE_IS = re.compile(r"\b(here\s+is|meet)\b")
_POSSESSIVE_RELATION = re.compile(
    r"\b(my|his|her|your)\s+(friend|colleague|classmate|teacher|neighbour|neighbor)\b")
_SELF_INTRO = re.compile(r"\b(i'?m|i am|my name is)\b")
_NAMED_PERSON = re.compile(r"\b[A-Z][a-z]{1,15}\b")
_HE_SHE_IS = re.compile(r"\b(he|she)('?s|\s+is)\b")
_THEY_ARE = re.compile(r"\bthey('?re|\s+are)\b")
_THIRD_PERSON_S = re.compile(r"\b(he|she)\s+(works|studies|lives|likes)\b")
_FIRST_PERSON_FACT = re.compile(r"\bi\s+(work|study|am|'m)\b")


def _introduce_person(text: str, partner: str = "") -> dict:
    who = (partner or "").strip() or "Ana"
    natural = f"This is {who}."
    raw = (text or "").strip()
    n = normalize(raw)
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True,
                     natural_version=natural, confidence=0.95)
    if _THIS_IS.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=False,
                     confidence=0.96 if _POSSESSIVE_RELATION.search(n) else 0.93)
    if _HERE_IS.search(n) and _NAMED_PERSON.search(raw):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=True, confidence=0.88)
    if _SELF_INTRO.search(n):
        return _base(error_type="introduced_self", retry_required=True,
                     natural_version=natural, confidence=0.9)
    if _NAMED_PERSON.search(raw) and len(n.split()) <= 2:
        return _base(error_type="missing_frame", retry_required=True,
                     natural_version=natural, confidence=0.88)
    return _base(error_type="no_introduction", retry_required=True,
                 natural_version=natural, confidence=0.5)


def _state_person_fact(text: str, partner: str = "") -> dict:
    who = (partner or "").strip() or "Ana"
    natural = f"{who} is a student."
    n = normalize(text)
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True,
                     natural_version=natural, confidence=0.95)
    if _HE_SHE_IS.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=False, confidence=0.95)
    # the -s form is heard in the arc and never required, so producing it is MORE
    # than the turn asked for
    if _THIRD_PERSON_S.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=True, confidence=0.9)
    if _THEY_ARE.search(n) or _FIRST_PERSON_FACT.search(n):
        return _base(error_type="wrong_person", retry_required=True,
                     natural_version=natural, confidence=0.88)
    return _base(error_type="no_person_statement", retry_required=True,
                 natural_version=natural, confidence=0.5)


# ─── A1 arc 4 — "Where things are" ─────────────────────────────────────────
#
# Parity with the frontend's `evaluateAskLocation` / `evaluateStateLocation` /
# `evaluateAskTransport`, including the one thing that is easy to leave out: a
# learner who produces DIRECTIONS has produced A2, not this arc, so "go left" is
# refused rather than praised. The arc's risk note is "directions creep", and a
# fake/local provider that accepted them would be the crack it creeps through.
_WHERE_IS = re.compile(r"\bwhere('?s|\s+is|\s+are)\b")
_HOW_GET_TO = re.compile(r"\bhow\s+(do|can)\s+i\s+(get|go)\s+(to|there)\b")
_WHICH_TRANSPORT = re.compile(r"\b(which|what)\s+(bus|train)\b|\bis\s+there\s+a\s+(bus|train)\b")
_TAUGHT_RELATION = re.compile(r"\b(here|there|next\s+to|near)\b")
_ITS_FRAME = re.compile(r"\bit('?s|\s+is)\b")
_DIRECTIONS = re.compile(r"\b(left|right|straight\s+on|straight\s+ahead|first\s+street|second\s+street|turn)\b")
_EXCUSE_ME = re.compile(r"\bexcuse\s+me\b|\bsorry\b")


def _ask_location(text: str, place: str = "") -> dict:
    what = (place or "").strip() or "the toilet"
    natural = f"Where is {what}?"
    n = normalize(text)
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True,
                     natural_version=natural, confidence=0.95)
    if _WHERE_IS.search(n) and len(n.split()) >= 3:
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=False,
                     confidence=0.97 if _EXCUSE_ME.search(n) else 0.95)
    if _ITS_FRAME.search(n):
        return _base(error_type="answered_instead", retry_required=True,
                     natural_version=natural, confidence=0.9)
    if "where" in n:
        return _base(error_type="missing_verb", retry_required=True,
                     natural_version=natural, confidence=0.88)
    return _base(error_type="no_question", retry_required=True,
                 natural_version=natural, confidence=0.86)


def _state_location(text: str, relation: str = "") -> dict:
    hint = (relation or "").replace("_", " ").strip() or "here"
    tail = f"{hint} the bag" if hint in ("next to", "near") else hint
    natural = f"It's {tail}."
    n = normalize(text)
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True,
                     natural_version=natural, confidence=0.95)
    # checked first, so "it's left" is not accepted for starting correctly
    if _DIRECTIONS.search(n):
        return _base(error_type="directions_not_taught", retry_required=True,
                     natural_version=natural, confidence=0.9)
    if _ITS_FRAME.search(n) and _TAUGHT_RELATION.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=False, confidence=0.96)
    if _TAUGHT_RELATION.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=True, confidence=0.88)
    if "next" in n and not re.search(r"\bnext\s+to\b", n):
        return _base(error_type="missing_to", retry_required=True,
                     natural_version=natural, confidence=0.92)
    if _WHERE_IS.search(n):
        return _base(error_type="asked_instead", retry_required=True,
                     natural_version=natural, confidence=0.9)
    if _ITS_FRAME.search(n):
        return _base(error_type="missing_relation", retry_required=True,
                     natural_version=natural, confidence=0.9)
    return _base(error_type="no_location", retry_required=True,
                 natural_version=natural, confidence=0.86)


def _ask_transport(text: str, place: str = "") -> dict:
    where = (place or "").strip() or "the station"
    natural = f"How do I get to {where}?"
    n = normalize(text)
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True,
                     natural_version=natural, confidence=0.95)
    if _HOW_GET_TO.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=False, confidence=0.95)
    if _WHICH_TRANSPORT.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=True, confidence=0.9)
    if _WHERE_IS.search(n):
        return _base(error_type="asked_location_instead", retry_required=True,
                     natural_version=natural, confidence=0.88)
    return _base(error_type="no_transport_question", retry_required=True,
                 natural_version=natural, confidence=0.5)


# ─── A1 arc 5 — "What it costs" ─────────────────────────────────────────────
#
# `ask_price` is the arc's one new intent, `deterministic_local` in the blueprint:
# "How much is it? / How much are they?" is the whole frame. Parity with the
# frontend's `evaluateAskPrice`, reusing `_ITS_FRAME` from arc 4 for the same
# "answered instead of asking" mistake.
_HOW_MUCH = re.compile(r"\bhow\s+much\s+(is|are)\b")


def _ask_price(text: str, place: str = "") -> dict:
    what = (place or "").strip() or "it"
    natural = f"How much is {what}?"
    n = normalize(text)
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True,
                     natural_version=natural, confidence=0.95)
    if _HOW_MUCH.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=False, confidence=0.95)
    if _ITS_FRAME.search(n):
        return _base(error_type="answered_instead", retry_required=True,
                     natural_version=natural, confidence=0.9)
    if "how much" in n:
        return _base(error_type="missing_verb", retry_required=True,
                     natural_version=natural, confidence=0.88)
    return _base(error_type="no_question", retry_required=True,
                 natural_version=natural, confidence=0.86)


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



# ---- sixth arc: things, and how many (mirrors the frontend evaluator) ----
#
# Asking and answering are two intents, the way `ask_origin` and `answer_origin`
# already are. Quantity is one intent whose shape the turn decides, so it carries
# `quantity_form` exactly as repair carries `repair_kind`.
_QUANTITY_FORMS = ("bare", "with_object", "polite_request")

_ASK_WHAT = re.compile(r"\b(what'?s (this|that)|what is (this|that))\b")
_ASK_WHAT_WIDER = re.compile(
    r"\b((what'?s|what is) (this|that) called|what do you call (this|that)|what are (these|those))\b")
_ASK_WHAT_LOOSE = re.compile(r"\b(what|this|that)\b")
_ASK_WHERE_Q = re.compile(r"\b(where'?s|where is|where are)\b")
_ASK_WHO_Q = re.compile(r"\b(who'?s|who is|who are)\b")

_IDENTIFY = re.compile(r"\b(it'?s (a|an)|it is (a|an)|this is (a|an)|that'?s (a|an)|that is (a|an))\s+\w+")
_IDENTIFY_LOOSE = re.compile(r"\b(it'?s|it is|this is|that'?s|that is|it|this|that|a|an)\b")
_BARE_NOUN = re.compile(r"^(a |an )?\w+$")

# The catalogue, kept to what the arc uses. Plurals are looked up, never built
# by adding an "s": "two sandwichs" is the sentence this prevents.
_THINGS = {
    "book": {"singular": "book", "plural": "books", "article": "a", "count": True},
    "phone": {"singular": "phone", "plural": "phones", "article": "a", "count": True},
    "bag": {"singular": "bag", "plural": "bags", "article": "a", "count": True},
    "cup": {"singular": "cup", "plural": "cups", "article": "a", "count": True},
    "sandwich": {"singular": "sandwich", "plural": "sandwiches", "article": "a", "count": True},
    "apple": {"singular": "apple", "plural": "apples", "article": "an", "count": True},
    "water": {"singular": "water", "plural": "water", "article": None, "count": False},
    "coffee": {"singular": "coffee", "plural": "coffee", "article": None, "count": False},
    "tea": {"singular": "tea", "plural": "tea", "article": None, "count": False},
}

_NUMBER_WORDS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14, "fifteen": 15,
    "sixteen": 16, "seventeen": 17, "eighteen": 18, "nineteen": 19, "twenty": 20,
}
_TAUGHT_NUMBERS = list(_NUMBER_WORDS)[:10]
_VAGUE_QUANTITY = re.compile(r"\b(many|a lot|lots|some|a few|several|much)\b")


def _thing(thing_id: str) -> dict | None:
    return _THINGS.get(str(thing_id or "").lower())


def _with_article(entry: dict) -> str:
    return f"{entry['article']} {entry['singular']}" if entry.get("article") else entry["singular"]


def _counted(entry: dict, count: int) -> str:
    if not entry or not entry.get("count") or not isinstance(count, int) or count < 1:
        return ""
    return entry["singular"] if count == 1 else entry["plural"]


def _number_in(text: str) -> int | None:
    n = normalize(text)
    if not n:
        return None
    for word, value in _NUMBER_WORDS.items():
        if re.search(rf"\b{word}\b", n):
            return value
    digits = re.search(r"\b(\d{1,3})\b", n)
    return int(digits.group(1)) if digits else None


def _ask_what_thing(text: str) -> dict:
    natural = "What’s this?"
    n = normalize(text)
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if _ASK_WHAT.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=n not in ("what's this", "whats this"), confidence=0.95)
    # a wider, perfectly good way to ask the same thing
    if _ASK_WHAT_WIDER.search(n):
        return _base(completed_objective=True, natural_version=natural, accepted_variant=True, confidence=0.9)
    if _ASK_WHERE_Q.search(n) or _ASK_WHO_Q.search(n):
        return _base(error_type="wrong_question_word", retry_required=True, natural_version=natural, confidence=0.92)
    if _ASK_WHAT_LOOSE.search(n):
        return _base(error_type="incomplete_question", retry_required=True, natural_version=natural, confidence=0.88)
    return _base(error_type="no_question", retry_required=True, natural_version=natural,
                 confidence=0.85 if len(n.split()) < 4 else 0.5)


def _identify_thing(text: str, thing_id: str) -> dict:
    entry = _thing(thing_id) or _THINGS["book"]
    natural = f"It’s {_with_article(entry)}."
    n = normalize(text)
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    if _IDENTIFY.search(n):
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=not n.startswith("it's a"), confidence=0.95)
    # a bare noun identifies the thing and is not the sentence being practised
    if len(n.split()) <= 2 and _BARE_NOUN.match(n):
        return _base(error_type="bare_noun", retry_required=True, natural_version=natural, confidence=0.9)
    if _IDENTIFY_LOOSE.search(n):
        return _base(error_type="incomplete_identification", retry_required=True, natural_version=natural, confidence=0.88)
    return _base(error_type="no_identification", retry_required=True, natural_version=natural,
                 confidence=0.85 if len(n.split()) < 4 else 0.5)


def _use_quantity(text: str, quantity_form: str, thing_id: str, target_count) -> dict:
    form = quantity_form if quantity_form in _QUANTITY_FORMS else "bare"
    entry = _thing(thing_id) or _THINGS["book"]
    count = target_count if isinstance(target_count, int) and target_count >= 1 else 2
    word = _TAUGHT_NUMBERS[min(count, 10) - 1]
    counted = _counted(entry, count) or "books"
    targets = {
        "bare": f"{word.capitalize()}.",
        "with_object": f"{word.capitalize()} {counted}.",
        "polite_request": f"Can I have {word} {counted}, please?",
    }
    natural = targets[form]
    n = normalize(text)
    if not n:
        return _base(understood=False, error_type="empty", retry_required=True, natural_version=natural, confidence=0.95)
    # a quantity of something uncountable is a content bug, not a learner error
    if form != "bare" and not entry.get("count"):
        return _base(understood=False, error_type="uncountable_target", retry_required=True,
                     natural_version=natural, confidence=0.5)

    said = _number_in(n)
    if said is None:
        if _VAGUE_QUANTITY.search(n):
            return _base(error_type="not_a_number", retry_required=True, natural_version=natural, confidence=0.9)
        return _base(error_type="no_quantity", retry_required=True, natural_version=natural,
                     confidence=0.85 if len(n.split()) < 4 else 0.5)

    expected = _counted(entry, said)
    names_thing = bool(re.search(rf"\b({entry['singular']}|{entry['plural']})\b", n))
    names_correct_form = bool(re.search(rf"\b{expected}\b", n)) if expected else names_thing
    asks = bool(_REQUEST_FORM.search(n))

    done = True if form == "bare" else (names_correct_form if form == "with_object" else (asks and names_correct_form))
    if done:
        return _base(completed_objective=True, natural_version=natural,
                     accepted_variant=said > 10 or normalize(natural) != n, confidence=0.94)
    # the noun is there in the wrong shape: "two book"
    if names_thing and not names_correct_form:
        return _base(error_type="wrong_number_form", retry_required=True, natural_version=natural, confidence=0.9)
    if form == "with_object":
        return _base(error_type="missing_counted_noun", retry_required=True, natural_version=natural, confidence=0.88)
    return _base(error_type="missing_request_frame", retry_required=True, natural_version=natural, confidence=0.88)


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
        return _repair_request(text, payload.get("repair_kind") or "",
                               payload.get("meaning_word") or "")
    if kind == "close_encounter":
        return _close_encounter(text)
    # A1 arc 3 — the partner's name travels with the request so the model answer names
    # somebody who was actually on screen.
    if kind == "introduce_person":
        return _introduce_person(text, payload.get("partner_name") or "")
    if kind == "state_person_fact":
        return _state_person_fact(text, payload.get("partner_name") or "")
    # arc 4: the place and the relation are task properties, and both travel
    if kind == "ask_location":
        return _ask_location(text, payload.get("place_name") or "")
    if kind == "state_location":
        return _state_location(text, payload.get("relation_hint") or "")
    if kind == "ask_transport":
        return _ask_transport(text, payload.get("place_name") or "")
    # arc 5 — the thing asked about is a task property, exactly like arc 4's place
    if kind == "ask_price":
        return _ask_price(text, payload.get("place_name") or "")
    # sixth arc — the thing and the shape of the quantity travel with the turn,
    # for the same reason the repair strategy does: without them the verdict is
    # about a different question.
    if kind == "ask_what_thing":
        return _ask_what_thing(text)
    if kind == "identify_thing":
        return _identify_thing(text, payload.get("target_thing") or "")
    if kind == "use_quantity":
        return _use_quantity(text, payload.get("quantity_form") or "",
                             payload.get("target_thing") or "", payload.get("target_count"))
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
