from __future__ import annotations

import re
import unicodedata

from ai.schemas import ChatMode, ChatResult, LanguageLevel, LearningAction, MissionFeedback


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

CORRECTIONS = {
    "how you are": ("How are you?", "Para preguntar, usa How + are + you."),
    "you are how": ("How are you?", "En preguntas con how, how va primero."),
    "are you how": ("How are you?", "La forma natural es How are you?"),
    "how your are": ("How are you?", "Aqui necesitas you, no your."),
    "me good": ("I am good.", "En ingles la frase empieza con I."),
    "me happy today": ("I'm happy today.", "Usa I'm antes de una emocion."),
    "im good": ("I'm good.", "Solo falta el apostrofe en I'm."),
    "me travel want": ("I want to travel.", "Orden simple: I want to + verbo."),
    "travel me want": ("I want to travel.", "Empieza con I: I want to travel."),
    "not understand": ("I do not understand.", "Agrega I para que la frase este completa."),
    "i not understand": ("I do not understand.", "Para negar, usa do not."),
    "speack": ("speak", "La palabra correcta es speak."),
}

TRANSLATION_TRIGGERS = ("como se dice", "como digo", "traduce", "traducir", "how do you say", "how to say", "say")
MEANING_TRIGGERS = ("que significa", "what does")
PRACTICE_TRIGGERS = (
    "practica",
    "practicar",
    "ejercicio",
    "quiz",
    "challenge",
    "practice",
    "let's practice",
    "lets practice",
)
GREETINGS = {"hello", "hi", "hey", "good morning", "good afternoon", "good evening"}
SPANISH_HINTS = {"hola", "como", "quiero", "puedo", "digo", "decir", "gracias"}


def _active_companion(profile: dict | None) -> str:
    companion = str((profile or {}).get("active_companion") or "lingua").lower()
    return companion if companion in {"lingua", "lingo", "chatto"} else "lingua"


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


def detect_mode(text: str) -> ChatMode:
    normalized = normalize(text)

    if _extract_translation_intent(text):
        return ChatMode.TRANSLATION
    if normalized in CORRECTIONS:
        return ChatMode.CORRECTION
    return ChatMode.CHAT


def _is_practice_request(text: str) -> bool:
    normalized = normalize(text)
    return any(trigger in normalized for trigger in PRACTICE_TRIGGERS)


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


def _chat_reply(text: str, level: LanguageLevel, has_history: bool) -> str:
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


def _practice_reply(level: LanguageLevel) -> tuple[str, str]:
    if level == LanguageLevel.A1:
        return "Vamos con algo corto: I like ___.", "Escribe una frase simple con I like."
    if level == LanguageLevel.A2:
        return "Cuenta algo de ayer en una frase.", "Usa una palabra en pasado, como went o watched."
    if level == LanguageLevel.B1:
        return "Describe un viaje que te gustaria hacer.", "Agrega una razon con because."
    if level == LanguageLevel.B2:
        return "Would you rather travel alone or with friends? Why?", "Use 'although' in your answer."
    if level == LanguageLevel.C1:
        return "Explain how travel can change someone's perspective.", "Use a nuanced example."
    return "Defend or challenge this idea: fluency matters more than accuracy.", "Use a concise counterargument."


def _chat_suggestion(level: LanguageLevel, text: str) -> str:
    if set(normalize(text).split()).intersection(SPANISH_HINTS):
        return "Intenta responder con una frase corta en ingles."
    if level in {LanguageLevel.A1, LanguageLevel.A2}:
        return "Usa una frase simple: I + verbo + una idea."
    if level in {LanguageLevel.B1, LanguageLevel.B2}:
        return "Agrega una razon o un ejemplo."
    return "Add nuance with a contrast or qualification."


def _companion_chat_response(
    companion: str,
    message: str,
    level: LanguageLevel,
    profile: dict,
    history: list[dict] | None,
) -> ChatResult | None:
    normalized = normalize(message)
    prefs = _tutor_preferences(profile)

    if companion == "lingo":
        word = normalized.split(" ", 1)[0] if normalized else "today"
        meaning = EN_TO_ES.get(word)
        if meaning:
            reply = f"{word.capitalize()} = {meaning}."
            explanation = f"Ejemplo: I like {word}."
            suggestion = "Ahora completa: I like _____."
        else:
            reply = "Elige una palabra util de tu frase y usala otra vez."
            explanation = "Lingo se enfoca en vocabulario y frases cortas."
            suggestion = "Escribe: I use this word: ____."
        return ChatResult(
            reply=reply,
            correction=None,
            explanation=explanation,
            suggestion=suggestion,
            mode=ChatMode.CHAT,
            learning_action=LearningAction(
                type="fill_blank",
                prompt="Completa: I like _____.",
                options=None,
                expected=word if meaning else None,
            ),
            focus="Vocabulary practice",
            word_to_use=word if meaning else "word",
            detected_language=profile.get("native_language"),
            target_language=profile.get("target_language"),
        )

    if companion == "chatto":
        reply = _chat_reply(message, level, bool(history))
        if prefs.get("pace") == "slow_clear":
            suggestion = "Answer with one short sentence."
        else:
            suggestion = "Keep the conversation going with one detail."
        return ChatResult(
            reply=reply,
            correction=None,
            explanation=None,
            suggestion=suggestion,
            mode=ChatMode.CHAT,
            learning_action=LearningAction(
                type="answer_question",
                prompt="Answer naturally: I think ____ because ____.",
                options=None,
            ),
            focus="Natural conversation",
            word_to_use="because",
            detected_language=profile.get("native_language"),
            target_language=profile.get("target_language"),
        )

    return None


def _learning_action_for(
    mode: ChatMode,
    message: str,
    level: LanguageLevel,
    correction: str | None = None,
    translation: str | None = None,
) -> LearningAction:
    normalized = normalize(message)

    if mode == ChatMode.TRANSLATION and translation:
        return LearningAction(
            type="fill_blank",
            prompt="Completa: I like _____.",
            options=None,
            expected=translation,
        )

    if mode == ChatMode.CORRECTION and correction:
        if normalized == "how you are":
            return LearningAction(
                type="answer_question",
                prompt="Ahora responde: 'I'm good, thanks. And you?'",
                options=None,
            )
        if normalized == "me happy today":
            return LearningAction(
                type="complete_sentence",
                prompt="Agrega una razon: 'I'm happy today because ____.'",
                options=None,
            )
        return LearningAction(
            type="rewrite",
            prompt=f"Escribela otra vez usando: '{correction}'",
            options=None,
        )

    if level in {LanguageLevel.A1, LanguageLevel.A2}:
        return LearningAction(
            type="complete_sentence",
            prompt="Completa: 'Today I feel ____ because ____.'",
            options=None,
        )
    if level in {LanguageLevel.B1, LanguageLevel.B2}:
        return LearningAction(
            type="ask_back",
            prompt="Haz una pregunta de vuelta sobre el mismo tema.",
            options=None,
        )
    return LearningAction(
        type="use_word",
        prompt="Usa although en tu proxima frase.",
        options=None,
    )


def generate_local_response(
    user_message: str,
    level: LanguageLevel,
    history: list[dict] | None = None,
    user_profile: dict | None = None,
) -> ChatResult:
    message = user_message.strip()
    profile = user_profile or {}
    mission_context = profile.get("mission_context")
    companion = _active_companion(profile)

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
        feedback = (
            "Good. That works for this practice step."
            if is_correct
            else "Good try. Use the hint and try this step once more."
        )
        return ChatResult(
            reply=feedback,
            correction=None if is_correct else mission_context.get("prompt"),
            explanation=None if is_correct else "In local mode, Lingua checks the main pattern only.",
            suggestion="Continue to the next step." if is_correct else "Try again with a short English phrase.",
            mode=ChatMode.CHAT,
            learning_action=LearningAction(
                type="answer_question",
                prompt="Write one short answer in English.",
                options=None,
            ),
            focus=mission_context.get("target_skill") or "Mission practice",
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

    mode = detect_mode(message)

    if mode == ChatMode.TRANSLATION:
        intent = _extract_translation_intent(message) or {"phrase": normalize(message), "direction": "to_en"}
        phrase = intent["phrase"]
        normalized_phrase = normalize(phrase)
        if intent["direction"] == "from_en":
            translation = EN_TO_ES.get(normalized_phrase)
            if translation:
                reply = f'"{phrase.capitalize()}" significa "{translation}".'
                explanation = f"Es una palabra util. Ejemplo: I like {normalized_phrase}."
                suggestion = f"Ahora escribe una frase con {normalized_phrase}."
                word_to_use = normalized_phrase
                action_expected = normalized_phrase
            else:
                reply = "Puedo ayudarte con eso. Con OpenAI activo puedo explicarlo mejor."
                explanation = "En modo local solo conozco algunas palabras A1/A2."
                suggestion = "Prueba con una palabra corta como cheese, water o coffee."
                word_to_use = None
                action_expected = None
        else:
            translation = TRANSLATIONS.get(normalized_phrase)
            if translation:
                reply = f'"{phrase.capitalize()}" se dice "{translation}" en ingles.'
                explanation = f"Ejemplo: I like {translation}."
                suggestion = "Ahora intentalo tu: I like _____."
                word_to_use = translation
                action_expected = translation
            else:
                reply = "Buena pregunta. Con OpenAI activo puedo traducirlo mejor."
                explanation = "Por ahora practiquemos como pedir una traduccion."
                suggestion = "Pregunta asi: How do you say ___ in English?"
                word_to_use = None
                action_expected = None
        return ChatResult(
            reply=reply,
            correction=None,
            explanation=explanation,
            suggestion=suggestion,
            mode=mode,
            learning_action=LearningAction(
                type="fill_blank",
                prompt="Completa: I like _____.",
                options=None,
                expected=action_expected,
            ) if action_expected else _learning_action_for(mode, message, level, translation=None),
            focus="Traduccion util",
            word_to_use=word_to_use,
        )

    if mode == ChatMode.CORRECTION:
        correction, explanation = CORRECTIONS[normalize(message)]
        if _tutor_preferences(profile).get("correction_style") == "gentle":
            explanation = f"Solo una cosa: {explanation}"
        return ChatResult(
            reply=correction,
            correction=correction,
            explanation=explanation,
            suggestion="Repite la frase corregida una vez.",
            mode=mode,
            learning_action=_learning_action_for(mode, message, level, correction=correction),
            focus="Question word order",
            word_to_use=None,
        )

    if _is_practice_request(message):
        reply, suggestion = _practice_reply(level)
        return ChatResult(
            reply=reply,
            correction=None,
            explanation=None,
            suggestion=suggestion,
            mode=ChatMode.CHAT,
            learning_action=_learning_action_for(ChatMode.CHAT, message, level),
            focus="Guided production",
            word_to_use="because" if level in {LanguageLevel.A1, LanguageLevel.A2} else "although",
        )

    companion_response = _companion_chat_response(companion, message, level, profile, history)
    if companion_response:
        return companion_response

    return ChatResult(
        reply=_chat_reply(message, level, bool(history)),
        correction=None,
        explanation=None,
        suggestion=_chat_suggestion(level, message),
        mode=ChatMode.CHAT,
        learning_action=_learning_action_for(ChatMode.CHAT, message, level),
        focus="Keep the conversation moving",
        word_to_use="because" if level in {LanguageLevel.A1, LanguageLevel.A2} else "although",
    )
