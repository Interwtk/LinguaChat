from __future__ import annotations

import re

from ai.schemas import ChatMode, ChatResult, LanguageLevel, LearningAction


TRANSLATIONS = {
    "queso": "cheese",
    "perro": "dog",
    "gato": "cat",
    "estoy feliz": "I am happy",
    "estoy asustado": "I am scared",
    "me gusta viajar": "I like to travel",
    "quiero viajar": "I want to travel",
    "me gusta bailar": "I like to dance",
    "quiero aprender ingles": "I want to learn English",
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

TRANSLATION_TRIGGERS = ("como se dice", "como digo", "how do you say")
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


def normalize(text: str) -> str:
    normalized = re.sub(r"\s+", " ", text.lower().strip())
    return normalized.strip("!?.,;:")


def detect_mode(text: str) -> ChatMode:
    normalized = normalize(text)

    if normalized.startswith(TRANSLATION_TRIGGERS):
        return ChatMode.TRANSLATION
    if normalized in CORRECTIONS:
        return ChatMode.CORRECTION
    return ChatMode.CHAT


def _is_practice_request(text: str) -> bool:
    normalized = normalize(text)
    return any(trigger in normalized for trigger in PRACTICE_TRIGGERS)


def _clean_translation_phrase(text: str) -> str:
    normalized = normalize(text)
    for trigger in TRANSLATION_TRIGGERS:
        if normalized.startswith(trigger):
            return normalized.replace(trigger, "", 1).strip(" ?")
    return normalized


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
            type="complete_sentence",
            prompt=f"Completala: '{translation} to ____.'",
            options=None,
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
) -> ChatResult:
    message = user_message.strip()
    mode = detect_mode(message)

    if mode == ChatMode.TRANSLATION:
        phrase = _clean_translation_phrase(message)
        translation = TRANSLATIONS.get(phrase)
        reply = (
            f"{translation} ({phrase})"
            if translation
            else "No tengo esa traduccion en modo local. Prueba con una frase mas corta."
        )
        return ChatResult(
            reply=reply,
            correction=None,
            explanation=None,
            suggestion="Usa la frase en una oracion corta.",
            mode=mode,
            learning_action=_learning_action_for(mode, message, level, translation=translation),
            focus="Functional translation",
            word_to_use=None,
        )

    if mode == ChatMode.CORRECTION:
        correction, explanation = CORRECTIONS[normalize(message)]
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
