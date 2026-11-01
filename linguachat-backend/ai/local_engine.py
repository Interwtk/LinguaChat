from __future__ import annotations

import re
import unicodedata

from ai.grammar_check import (
    SILENT_H, VOWEL_LETTER_CONSONANT_SOUND, _past_of, _third_person, analyze, corrected_sentence, correct_uses,
)
from ai.schemas import ChatMode, ChatResult, LanguageLevel, LearningAction, MissionFeedback
from ai.tutor_i18n import MESSAGES, resolve_language, say


# Spanish -> English. The local dictionary is this small and this Spanish: a
# word outside it is answered with an honest "I can't translate that".
TRANSLATIONS = {
    "queso": "cheese",
    "agua": "water",
    "cafe": "coffee",
    "café": "coffee",
    "comida": "food",
    "pan": "bread",
    "leche": "milk",
    "arroz": "rice",
    "pollo": "chicken",
    "carne": "meat",
    "pescado": "fish",
    "manzana": "apple",
    "perro": "dog",
    "gato": "cat",
    "casa": "house",
    "escuela": "school",
    "trabajo": "work",
    "bano": "bathroom",
    "baño": "bathroom",
    "ayuda": "help",
    "gracias": "thank you",
    "hola": "hello",
    "adios": "goodbye",
    "adiós": "goodbye",
    "por favor": "please",
    "buenos dias": "good morning",
    "buenos días": "good morning",
    "buenas noches": "good night",
    "me gusta": "I like",
    "quiero": "I want",
    "necesito": "I need",
    "tengo": "I have",
    "soy": "I am",
    "estoy": "I am",
    "estoy feliz": "I am happy",
    "estoy asustado": "I am scared",
    "me gusta viajar": "I like to travel",
    "quiero viajar": "I want to travel",
    "me gusta bailar": "I like to dance",
    "quiero aprender ingles": "I want to learn English",
}
# English -> Spanish meanings. Only ever offered to a Spanish-speaking learner:
# a Spanish word is not a "meaning" for somebody whose language is Japanese.
EN_TO_ES = {
    "cheese": "queso",
    "water": "agua",
    "coffee": "cafe",
    "food": "comida",
    "bread": "pan",
    "milk": "leche",
    "rice": "arroz",
    "chicken": "pollo",
    "apple": "manzana",
    "dog": "perro",
    "cat": "gato",
    "house": "casa",
    "school": "escuela",
    "work": "trabajo",
    "bathroom": "bano",
    "help": "ayuda",
    "thank you": "gracias",
    "hello": "hola",
    "goodbye": "adios",
    "please": "por favor",
}

# Whole beginner phrases with a known fix, and the rule that explains it.
FIXED_PHRASES = {
    "how you are": ("How are you?", "question_order"),
    "you are how": ("How are you?", "question_order"),
    "are you how": ("How are you?", "question_order"),
    "how your are": ("How are you?", "question_order"),
    "me good": ("I am good.", "subject_needed"),
    "me happy today": ("I'm happy today.", "subject_needed"),
    "im good": ("I'm good.", "contraction"),
    "me travel want": ("I want to travel.", "want_to"),
    "travel me want": ("I want to travel.", "want_to"),
    "not understand": ("I do not understand.", "subject_needed"),
    "i not understand": ("I do not understand.", "negation"),
    "speack": ("speak", "spelling"),
}

RULE_FOCUS = {
    "past_irregular": "focus_past",
    "past_marker": "focus_past",
    "third_person": "focus_agreement",
    "article": "focus_articles",
}

# A new sentence frame for guided retrieval, so the answer is never the one
# just shown on screen: retrieval of the form, in a context not yet used.
TRANSFER_FRAMES = {
    "past_irregular": "Last weekend we ____ ({base}) with some friends.",
    "past_marker": "Last Saturday my friend ____ ({base}) early.",
    "third_person": "My brother ____ ({base}) every morning.",
    "article": "There was ____ (a/an) {word} on the table.",
}

PRACTICE_REQUEST = re.compile(
    r"^(?:let'?s |can we |could we |i want to |quiero )?"
    r"(?:practice|practise|practicar|practica|ejercicio|exercise|quiz)\b",
)
TRANSLATION_TRIGGERS = ("como se dice", "como digo", "traduce", "traducir", "how do you say", "how to say", "say")
GREETINGS = {"hello", "hi", "hey", "good morning", "good afternoon", "good evening"}

# Function words of the learner's own language, to notice a message written in
# it instead of English. The language comes from the explicit user_language
# code; these lists only answer "is this message in that language?".
OWN_LANGUAGE_WORDS = {
    "es": {"el", "la", "los", "las", "que", "de", "y", "en", "un", "una", "es", "por", "para", "con",
           "como", "quiero", "tengo", "gracias", "hola", "yo", "no", "mi", "muy",
           # P3: frequent words with no English twin
           "estoy", "estás", "cómo", "bien", "también", "pero", "soy", "eres"},
    "pt": {"o", "os", "as", "que", "de", "e", "em", "um", "uma", "é", "não", "para", "com", "eu",
           "obrigado", "obrigada", "olá", "muito", "meu", "você", "tudo", "bem", "estou", "também"},
    "fr": {"le", "la", "les", "que", "de", "et", "un", "une", "est", "je", "pas", "pour", "avec",
           "bonjour", "merci", "très", "mon", "moi", "suis", "comment", "ça", "va", "vous", "aussi"},
    "it": {"il", "la", "che", "di", "e", "un", "una", "è", "non", "per", "con", "sono", "ciao",
           "grazie", "io", "molto", "mio"},
    "de": {"der", "die", "das", "und", "ist", "ich", "nicht", "ein", "eine", "zu", "mit", "danke",
           "hallo", "sehr", "mein", "bin",
           # P3: "Hallo, wie geht es?" was answered "Nice!": one hit was not enough
           "wie", "geht", "es", "du", "auch", "nein", "bitte", "heute", "habe", "kann", "gut"},
}
NON_LATIN = {"ja": re.compile(r"[぀-ヿ一-鿿]"), "ar": re.compile(r"[؀-ۿ]")}


def _language(profile: dict | None) -> str:
    return resolve_language((profile or {}).get("native_language"))[0]


def _topic_context(profile: dict | None) -> tuple[str | None, str | None]:
    """The one topic this conversation may be about, if the client chose one."""
    optional = (profile or {}).get("optional_context") or {}
    return optional.get("topic"), optional.get("topic_facet")


def _topic_opener(facet: str, level: LanguageLevel) -> str:
    """An invitation to talk about the topic, at the learner's level.

    Three templates, not three hundred hand-written questions. The topic can be as
    complex as the learner likes — the ENGLISH stays at their level, which is the
    whole point of separating the two: someone at A1 who loves AI gets a simple
    question about it, not a sentence about attention mechanisms.

    Lingua asks; it never claims to share the hobby. "I love that too" would be an
    invented personal life, and this tutor does not have one.
    """
    if level in {LanguageLevel.A1, LanguageLevel.A2}:
        return f"Let's talk about {facet}. What do you like about it?"
    if level in {LanguageLevel.B1, LanguageLevel.B2}:
        return f"Let's talk about {facet}. What do you think about it?"
    return f"Let's talk about {facet}. What stands out to you about it?"


def _tutor_preferences(profile: dict | None) -> dict:
    return (profile or {}).get("tutor_preferences") or {}


def normalize(text: str) -> str:
    normalized = strip_accents(text)
    normalized = re.sub(r"\s+", " ", normalized.lower().strip())
    return normalized.strip("!?.,;:")


def strip_accents(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text)
    return "".join(char for char in decomposed if not unicodedata.combining(char))


def _clean_outer_punctuation(text: str) -> str:
    return text.strip().strip("¿?\"'“”‘’`.:;! ")


def _extract_translation_intent(text: str) -> dict | None:
    cleaned = _clean_outer_punctuation(text)
    normalized = normalize(cleaned)

    patterns = [
        (r"^(?:como se dice|como digo)\s*:?\s*(.+)$", "to_en"),
        (r"^(?:traduce|traducir)\s*:?\s*(.+)$", "to_en"),
        (r"^(?:how do you say|how to say|say)\s+(.+?)(?:\s+in english)?$", "to_en"),
        (r"^(?:que significa)\s*:?\s*(.+)$", "from_en"),
        (r"^what does\s+(.+?)\s+mean\??$", "from_en"),
    ]
    for pattern, direction in patterns:
        match = re.match(pattern, normalized)
        if match:
            phrase = _clean_outer_punctuation(match.group(1))
            return {"phrase": phrase, "direction": direction}
    return None


def detect_mode(text: str) -> ChatMode:
    if _extract_translation_intent(text):
        return ChatMode.TRANSLATION
    if normalize(text) in FIXED_PHRASES or analyze(text):
        return ChatMode.CORRECTION
    return ChatMode.CHAT


def _is_practice_request(text: str) -> bool:
    normalized = normalize(text)
    return len(normalized.split()) <= 6 and bool(PRACTICE_REQUEST.match(normalized))


def _written_in_own_language(text: str, lang: str) -> bool:
    if lang in NON_LATIN:
        letters = [c for c in text if c.isalpha()]
        own = [c for c in letters if NON_LATIN[lang].match(c)]
        return bool(letters) and len(own) / len(letters) >= 0.5
    words = OWN_LANGUAGE_WORDS.get(lang)
    if not words:
        return False
    tokens = re.findall(r"[^\W\d_]+", text.lower())
    hits = sum(1 for token in tokens if token in words)
    return hits >= 2 and hits / max(1, len(tokens)) >= 0.4


def assess(message: str, profile: dict | None = None) -> dict:
    """What the local engine can honestly say about this message.

    verdict:
      error              a rule found a real error (with findings)
      no_issue_detected  no rule fired — NOT proof the sentence is correct
      insufficient       too little English to judge (a word, punctuation)
      not_english        written in the learner's own language
    """
    lang = _language(profile)
    words = re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", message)
    if lang != "en" and _written_in_own_language(message, lang):
        return {"verdict": "not_english", "confidence": "medium", "findings": [], "source": "local_rules"}
    fixed = FIXED_PHRASES.get(normalize(message))
    if fixed:
        correction, rule = fixed
        return {"verdict": "error", "confidence": "high", "source": "local_rules",
                "findings": [{"rule": rule, "original": message.strip(), "replacement": correction,
                              "confidence": "high", "facts": {"correction": correction}}],
                "corrected": correction}
    findings = analyze(message)
    uses = correct_uses(message)
    if findings:
        return {"verdict": "error", "source": "local_rules", "uses": uses,
                "confidence": "high" if all(f.confidence == "high" for f in findings) else "medium",
                "findings": [{"rule": f.rule, "original": f.original, "replacement": f.replacement,
                              "confidence": f.confidence, "facts": f.facts} for f in findings],
                "corrected": corrected_sentence(message, findings)}
    if len(words) < 2:
        return {"verdict": "insufficient", "confidence": "high", "findings": [], "uses": uses, "source": "local_rules"}
    # The rules are few. Silence from them is not a verdict of correctness.
    return {"verdict": "no_issue_detected", "confidence": "low", "findings": [], "uses": uses, "source": "local_rules"}


def choose_strategy(rule: str, profile: dict | None) -> str:
    """How to teach this error now, from what has already been tried.

    First time: a brief rule. The same error again soon after: the explanation
    did not work, so contrast it with a counterexample. A third time: stop
    explaining and ask for retrieval in a new sentence. The window is the short
    conversation memory, so the choice recovers as the error stops recurring.
    """
    recent = [r for r in (profile or {}).get("recent_error_types") or [] if r == rule]
    if len(recent) >= 2:
        return "guided_retrieval"
    if recent or _tutor_preferences(profile).get("explanation_depth") == "detailed":
        return "contrast_example"
    # Across days. This server forgets a session after a few turns; the
    # learner's own device keeps a compact record (rule ids, never words) and
    # sends what the teaching policy concluded from it. Its choice is used only
    # when nothing in THIS conversation already decided.
    memory = memory_for(rule, profile)
    if memory.get("preferred_strategy") in STRATEGIES:
        return memory["preferred_strategy"]
    if memory.get("status") == "recurring":
        return "contrast_example"
    return "brief_explanation"


def _explain(rule: str, facts: dict, strategy: str, lang: str) -> str:
    depth = "brief" if strategy == "brief_explanation" else "detailed"
    key = f"{rule}.{depth}"
    if key in MESSAGES:
        return say(key, lang, **facts)
    text = say(f"{rule}.brief", lang, **facts)
    if depth == "detailed" and facts.get("wrong") and facts.get("right"):
        text = f"{text} {say('compare', lang, wrong=facts['wrong'], right=facts['right'])}"
    return text


def _follow_up(level: LanguageLevel) -> str:
    if level in {LanguageLevel.A1, LanguageLevel.A2}:
        return "Tell me one more thing about it."
    if level in {LanguageLevel.B1, LanguageLevel.B2}:
        return "What happened next?"
    return "How did that turn out?"


def _correction_response(message: str, level: LanguageLevel, profile: dict, analysis: dict) -> ChatResult:
    lang = _language(profile)
    primary = analysis["findings"][0]
    rule = primary["rule"]
    strategy = choose_strategy(rule, profile)
    corrected = analysis["corrected"]
    facts = {**primary["facts"], "wrong": primary["original"], "right": primary["replacement"]}
    explanation = _explain(rule, facts, strategy, lang)
    if _tutor_preferences(profile).get("correction_style") == "gentle":
        explanation = say("gentle_prefix", lang, text=explanation)

    if strategy == "guided_retrieval" and rule in TRANSFER_FRAMES:
        material = TRANSFER_FRAMES[rule].format(base=facts.get("base", ""), word=facts.get("word", ""))
        # The frame keeps the same verb or noun, so the expected form is the same.
        expected = primary["facts"].get("past") or primary["facts"].get("fixed") or primary["facts"].get("article")
        prompt = say("fill_past", lang, base=facts.get("base", ""), material=material) \
            if rule in {"past_irregular", "past_marker"} else say("fill_generic", lang, material=material)
        action = LearningAction(type="fill_blank", prompt=prompt, options=None, expected=expected)
    else:
        action = LearningAction(type="rewrite", prompt=say("rewrite", lang, correction=corrected), options=None)

    lead = 'Almost! We say: "' if level in {LanguageLevel.A1, LanguageLevel.A2} else 'Nearly — the natural version is: "'
    return ChatResult(
        reply=f'{lead}{corrected}" {_follow_up(level)}',
        correction=corrected,
        explanation=explanation,
        suggestion=say("sugg_repeat", lang),
        mode=ChatMode.CORRECTION,
        learning_action=action,
        focus=say(RULE_FOCUS.get(rule, "focus_phrase"), lang),
        word_to_use=None,
        analysis={**analysis, "strategy": strategy, "language": lang},
    )


def _chat_reply(
    text: str,
    level: LanguageLevel,
    has_history: bool,
    topic_facet: str | None = None,
) -> str:
    normalized = normalize(text)

    if normalized in GREETINGS:
        replies = {
            LanguageLevel.A1: "Hi! How are you?",
            LanguageLevel.A2: "Hey! How is your day going?",
            LanguageLevel.B1: "Hey! How has your day been so far?",
            LanguageLevel.B2: "Hey! How's your day treating you?",
            LanguageLevel.C1: "Hey! What's been the highlight of your day?",
            LanguageLevel.C2: "Hey! What's been occupying your mind today?",
        }
        return replies[level]

    if "how are you" in normalized:
        return "I'm doing well! What about you?"
    if normalized in {"i am good", "i'm good", "i am fine", "i'm fine"}:
        return "Nice! What did you do today?"
    if "travel" in normalized:
        return "Nice choice. Where would you like to go?"
    if "video game" in normalized or "gaming" in normalized:
        return "Cool. What game have you been playing lately?"
    if re.search(r"\b(who|what) are you\b", normalized):
        return "I'm Lingua, your English tutor. What would you like to talk about?"

    # Everything above this line is the LEARNER's subject: a greeting, a question
    # they asked, a word they used. It wins, and the chosen topic is not consulted.
    #
    # Below it the engine had nothing to go on and was about to say "Tell me more".
    # That is where a topic earns its place: an invitation, once, instead of filler.
    if topic_facet and not has_history:
        return _topic_opener(topic_facet, level)

    if level in {LanguageLevel.A1, LanguageLevel.A2}:
        return "Nice! Tell me one more thing."
    if level == LanguageLevel.B1:
        return "That sounds interesting. What happened next?"
    if level == LanguageLevel.B2:
        return "That sounds interesting. What made you feel that way?"
    if level == LanguageLevel.C1:
        return "Interesting. What do you think influenced that most?"
    if level == LanguageLevel.C2:
        return "That's intriguing. How would you describe the nuance behind it?"

    return "Got it. Tell me a little more." if has_history else "Tell me more."


def _practice_reply(level: LanguageLevel, lang: str) -> tuple[str, str]:
    if level == LanguageLevel.A1:
        return "Let's do a short one: I like ___.", say("sugg_simple", lang)
    if level == LanguageLevel.A2:
        return "Tell me about yesterday in one sentence.", say("use_word", lang, word="went")
    if level == LanguageLevel.B1:
        return "Describe a trip you would like to take.", say("sugg_reason", lang)
    if level == LanguageLevel.B2:
        return "Would you rather travel alone or with friends? Why?", say("use_word", lang, word="although")
    if level == LanguageLevel.C1:
        return "Explain how travel can change someone's perspective.", say("sugg_nuance", lang)
    return "Defend or challenge this idea: fluency matters more than accuracy.", say("sugg_nuance", lang)


def _chat_suggestion(level: LanguageLevel, lang: str, verdict: str) -> str:
    if verdict == "not_english":
        return say("sugg_try_english", lang)
    if level in {LanguageLevel.A1, LanguageLevel.A2}:
        return say("sugg_simple", lang)
    if level in {LanguageLevel.B1, LanguageLevel.B2}:
        return say("sugg_reason", lang)
    return say("sugg_nuance", lang)


STRATEGIES = ("brief_explanation", "contrast_example", "guided_retrieval")


def memory_for(rule: str, profile: dict | None) -> dict:
    for item in (profile or {}).get("learning_memory") or []:
        if item.get("rule") == rule:
            return item
    return {}


# Retrieval on a later day happens in a sentence the learner has not met, with
# a verb (or noun) they have not been corrected on — so success is retrieval
# and transfer, not recognition of the screen they saw yesterday.
RETRIEVAL_ITEMS = {
    "past_irregular": [
        ("write", "Yesterday my friend ____ ({base}) a long letter."),
        ("swim", "Last summer we ____ ({base}) in the lake."),
        ("eat", "Last night I ____ ({base}) pizza with my family."),
        ("buy", "On Saturday she ____ ({base}) new shoes."),
        ("drink", "This morning he ____ ({base}) a big cup of tea."),
        ("take", "Last week we ____ ({base}) the train to work."),
        ("go", "Last Sunday they ____ ({base}) to the beach."),
        ("speak", "Yesterday the teacher ____ ({base}) very slowly."),
    ],
    "past_marker": [
        ("work", "Yesterday I ____ ({base}) until six."),
        ("walk", "Last night we ____ ({base}) home together."),
        ("watch", "Two days ago they ____ ({base}) a funny film."),
    ],
    "third_person": [
        ("work", "My sister ____ ({base}) in a hospital."),
        ("live", "He ____ ({base}) near the station."),
        ("play", "She ____ ({base}) tennis on Mondays."),
        ("like", "Our teacher ____ ({base}) jazz."),
    ],
    "article": [
        ("orange", "Can I have ____ (a/an) {base}, please?"),
        ("umbrella", "I need ____ (a/an) {base} today."),
        ("hour", "The film is ____ (a/an) {base} long."),
        ("idea", "That is ____ (a/an) good {base}."),
    ],
}


def _retrieval_expected(rule: str, base: str) -> str:
    if rule in {"past_irregular", "past_marker"}:
        return _past_of(base)
    if rule == "third_person":
        return _third_person(base)
    vowel_sound = (base[0] in "aeiou" and not base.startswith(VOWEL_LETTER_CONSONANT_SOUND)) or base.startswith(SILENT_H)
    return "an" if vowel_sound else "a"


def retrieval_action(profile: dict | None, lang: str) -> tuple[LearningAction, dict] | None:
    """A delayed retrieval for the first DUE difficulty the device sent, or None."""
    for item in (profile or {}).get("learning_memory") or []:
        rule = item.get("rule")
        if not item.get("due") or rule not in RETRIEVAL_ITEMS:
            continue
        seen = set(item.get("bases") or [])
        base, frame = next(((b, f) for b, f in RETRIEVAL_ITEMS[rule] if b not in seen), RETRIEVAL_ITEMS[rule][0])
        material = frame.format(base=base)
        expected = _retrieval_expected(rule, base)
        fill = say("fill_past", lang, base=base, material=material) if rule in {"past_irregular", "past_marker"}             else say("fill_generic", lang, material=material)
        prompt = say("retrieval_lead", lang) + " " + fill
        action = LearningAction(type="fill_blank", prompt=prompt, options=None, expected=expected)
        return action, {"rule": rule, "expected": expected, "base": base}
    return None


def _learning_action_for(level: LanguageLevel, lang: str) -> LearningAction:
    if level in {LanguageLevel.A1, LanguageLevel.A2}:
        return LearningAction(
            type="complete_sentence",
            prompt=say("complete", lang, material="'Today I feel ____ because ____.'"),
            options=None,
        )
    if level in {LanguageLevel.B1, LanguageLevel.B2}:
        return LearningAction(type="ask_back", prompt=say("ask_back", lang), options=None)
    return LearningAction(type="use_word", prompt=say("use_word", lang, word="although"), options=None)


def _translation_response(message: str, level: LanguageLevel, lang: str) -> ChatResult:
    intent = _extract_translation_intent(message) or {"phrase": normalize(message), "direction": "to_en"}
    phrase = intent["phrase"]
    normalized_phrase = normalize(phrase)
    word = None
    if intent["direction"] == "from_en":
        meaning = EN_TO_ES.get(normalized_phrase) if lang == "es" else None
        if meaning:
            reply = say("meaning_known", lang, phrase=phrase.capitalize(), translation=meaning)
            word = normalized_phrase
        else:
            reply = say("translation_unknown", lang)
    else:
        translation = TRANSLATIONS.get(normalized_phrase)
        if translation:
            reply = say("translation_to_en", lang, phrase=phrase.capitalize(), translation=translation)
            word = translation
        else:
            reply = say("translation_unknown", lang)
    return ChatResult(
        reply=reply,
        correction=None,
        explanation=say("example_like", lang, material=f"I like {word}.") if word else
        say("ask_translation_hint", lang, material="How do you say ___ in English?"),
        suggestion=say("complete", lang, material="I like _____.") if word else None,
        mode=ChatMode.TRANSLATION,
        learning_action=LearningAction(
            type="fill_blank", prompt=say("complete", lang, material="I like _____."), options=None, expected=word,
        ) if word else _learning_action_for(level, lang),
        focus=say("focus_translation", lang),
        word_to_use=word,
        analysis={"verdict": "translation", "confidence": "high" if word else "low",
                  "findings": [], "source": "local_rules", "language": lang},
    )


def generate_local_response(
    user_message: str,
    level: LanguageLevel,
    history: list[dict] | None = None,
    user_profile: dict | None = None,
) -> ChatResult:
    message = user_message.strip()
    profile = user_profile or {}
    lang = _language(profile)
    mission_context = profile.get("mission_context")

    if mission_context:
        expected = normalize(str(mission_context.get("expected_pattern") or ""))
        answer = normalize(message)
        is_choice = mission_context.get("step_type") == "choose_option"
        is_correct = bool(expected and (expected in answer or re.search(expected, answer, re.I)))
        if is_choice:
            expected_option = None
            for option in mission_context.get("options") or []:
                if normalize(str(option.get("id"))) == expected:
                    expected_option = normalize(str(option.get("text")))
                    break
            is_correct = answer == expected or (expected_option and answer == expected_option)
        score = 85 if is_correct else (45 if answer else 0)
        # Lingua's reaction is English, the language being practised; the
        # instructions around it follow the learner's language.
        feedback = "Good. That works for this practice step." if is_correct else "Good try. Once more, please."
        return ChatResult(
            reply=feedback,
            correction=None if is_correct else mission_context.get("prompt"),
            explanation=None if is_correct else say("mission_local_note", lang),
            suggestion=say("mission_continue", lang) if is_correct else say("mission_try_again", lang),
            mode=ChatMode.CHAT,
            learning_action=LearningAction(type="answer_question", prompt=say("mission_answer", lang), options=None),
            focus=mission_context.get("target_skill") or say("focus_practice", lang),
            word_to_use=None,
            detected_language=profile.get("native_language"),
            target_language=profile.get("target_language"),
            mission_feedback=MissionFeedback(
                is_correct=is_correct,
                score=score,
                feedback=feedback,
                should_advance=is_correct,
                corrected_answer=None if is_correct else mission_context.get("prompt"),
                hint=None if is_correct else mission_context.get("expected_pattern"),
            ),
        )

    if _extract_translation_intent(message):
        return _translation_response(message, level, lang)

    if _is_practice_request(message):
        reply, suggestion = _practice_reply(level, lang)
        return ChatResult(
            reply=reply,
            correction=None,
            explanation=None,
            suggestion=suggestion,
            mode=ChatMode.CHAT,
            learning_action=_learning_action_for(level, lang),
            focus=say("focus_practice", lang),
            word_to_use="because" if level in {LanguageLevel.A1, LanguageLevel.A2} else "although",
        )

    analysis = assess(message, profile)
    if analysis["verdict"] == "error":
        return _correction_response(message, level, profile, analysis)

    _topic_id, topic_facet = _topic_context(profile)
    reply = (
        "Let's try it in English! Start with something short, like: I am ..."
        if analysis["verdict"] == "not_english"
        else _chat_reply(message, level, bool(history), topic_facet)
    )
    # Only claim to be on the topic when the reply actually is. The learner had
    # already brought their own subject in every other branch, and a focus line
    # announcing "game worlds" over a conversation about travel is a small lie.
    on_topic = bool(topic_facet) and reply == _topic_opener(topic_facet, level)
    # A difficulty from an earlier day that is due again: offer one retrieval
    # in a new sentence instead of the generic prompt. Never on top of a
    # correction, and never invented — only what the device says is due.
    retrieval = retrieval_action(profile, lang) if analysis["verdict"] in {"no_issue_detected", "insufficient"} else None
    if retrieval:
        analysis = {**analysis, "retrieval": retrieval[1]}
    return ChatResult(
        reply=reply,
        correction=None,
        explanation=None,
        suggestion=say("sugg_unclear", lang) if analysis["verdict"] == "insufficient" and normalize(message) not in GREETINGS
        else _chat_suggestion(level, lang, analysis["verdict"]),
        mode=ChatMode.CHAT,
        learning_action=retrieval[0] if retrieval else _learning_action_for(level, lang),
        # naming the topic is honest and useful; naming why it was chosen is not,
        # and the server was never told why anyway
        focus=f"Talking about {topic_facet}" if on_topic else say("focus_conversation", lang),
        word_to_use="because" if level in {LanguageLevel.A1, LanguageLevel.A2} else "although",
        analysis={**analysis, "language": lang},
    )
