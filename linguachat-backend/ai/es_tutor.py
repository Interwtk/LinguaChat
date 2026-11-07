"""Lingua's local Spanish practice partner (target_language = es).

A rule-based conversation for the Spanish Pre-A1 course, not a generative
model, and it says so when it matters:

  * it walks a short itinerary of Pre-A1 topics (name, how you are, where you
    are from, likes, wants, goodbye) and asks one question at a time, in
    Spanish;
  * it recognises the answers the course teaches, including regional forms;
  * it corrects only what it can name with confidence — the same calques and
    ser/estar, gustar and gender errors as the lesson evaluator
    (src/learning/courses/es/evaluator.js) — and explains them in English;
  * anything it cannot read is NOT corrected: Lingua says she did not follow,
    in Spanish and English, and offers a guided question instead.

The client tells it which topic it last asked (`optional_context.topic`, a
validated id); nothing else about the learner is needed. Explanations are in
English because the Spanish course is offered only with English explanations.
"""
from __future__ import annotations

import re
import unicodedata

from ai.schemas import ChatMode, ChatResult, LanguageInfo

TARGET = LanguageInfo(code="es", base="es", name="Spanish")
TOPICS = ["name", "wellbeing", "origin", "likes", "wants", "goodbye"]

QUESTIONS = {
    "name": "¡Hola! Me llamo Lingua. ¿Cómo te llamas?",
    "wellbeing": "¿Cómo estás hoy?",
    "origin": "¿De dónde eres?",
    "likes": "¿Qué te gusta? Por ejemplo: la música, el café, el fútbol…",
    "wants": "Estamos en un café. ¿Qué quieres tomar?",
    "goodbye": "Me tengo que ir. ¡Hasta luego!",
}
MODELS = {
    "name": "Me llamo Ana.", "wellbeing": "Bien, gracias. ¿Y tú?", "origin": "Soy de Chicago.",
    "likes": "Me gusta la música.", "wants": "Un café, por favor.", "goodbye": "¡Adiós, hasta luego!",
}


def _fold(text: str) -> str:
    s = unicodedata.normalize("NFD", str(text or "").lower())
    s = "".join(ch for ch in s if not ("̀" <= ch <= "ͯ") or ch == "̃")
    s = unicodedata.normalize("NFC", s)
    s = re.sub(r"[^\w\s]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def _has(pattern: str, f: str) -> bool:
    return re.search(pattern, f) is not None


ENGLISH = r"\b(my name|i am|i m|hello|how are you|where are you|i like|i want|please|thank you|thanks|nice to meet|good morning|what is your|what s your)\b"
SPANISH_HINT = r"\b(hola|me|soy|estoy|eres|de|el|la|un|una|por favor|gracias|que|como|tu|usted|quiero|gusta|llamo|bien|muy)\b"

# known nouns and their gender, for article agreement (never guessed for others)
NOUNS = {
    "cafe": ("m", "café"), "te": ("m", "té"), "agua": ("f", "agua"), "musica": ("f", "música"), "futbol": ("m", "fútbol"),
    "cine": ("m", "cine"), "pizza": ("f", "pizza"), "playa": ("f", "playa"), "libro": ("m", "libro"), "mesa": ("f", "mesa"),
    "chocolate": ("m", "chocolate"), "cerveza": ("f", "cerveza"), "jugo": ("m", "jugo"), "zumo": ("m", "zumo"), "leche": ("f", "leche"),
    "sandwich": ("m", "sándwich"), "pelicula": ("f", "película"), "comida": ("f", "comida"), "fruta": ("f", "fruta"), "helado": ("m", "helado"),
}
GLOSSARY = {
    "hola": "hello / hi", "gracias": "thank you", "despacio": "slowly", "gusto": "pleasure (mucho gusto = nice to meet you)",
    "llamas": "you call yourself (¿cómo te llamas? = what's your name?)", "estas": "you are — for how you feel (estar)",
    "eres": "you are — for who/what/where from (ser)", "donde": "where", "quieres": "you want", "tomar": "to have (a drink) / to take",
    "cafe": "coffee", "agua": "water", "musica": "music", "luego": "later (hasta luego = see you later)", "ejemplo": "example",
    "hoy": "today", "tengo": "I have (me tengo que ir = I have to go)",
}


def _article_error(f: str) -> tuple[str, str] | None:
    for art, noun in re.findall(r"\b(el|la|un|una)\s+([a-zñ]+)", f):
        info = NOUNS.get(noun)
        if not info:
            continue
        gender, written = info
        want_def, want_ind = ("el", "un") if (gender == "m" or noun == "agua") else ("la", "una")
        want = want_def if art in ("el", "la") else want_ind
        if art != want:
            return want, written
    return None


def _natural(topic: str, name: str | None) -> str:
    return MODELS[topic].replace("Ana", name or "Ana")


def _result(reply: str, verdict: str, *, correction=None, explanation=None, suggestion=None, focus=None, findings=None) -> ChatResult:
    return ChatResult(
        reply=reply, correction=correction, explanation=explanation, suggestion=suggestion, mode=ChatMode.CHAT,
        focus=focus, target_language=TARGET,
        analysis={"verdict": verdict, "findings": findings or [], "course": "es", "engine": "es_local_rules"},
    )


def _next(topic: str) -> str:
    i = TOPICS.index(topic) if topic in TOPICS else -1
    return TOPICS[min(i + 1, len(TOPICS) - 1)]


def _check(topic: str, f: str) -> tuple[str, str] | None:
    """(error id, English explanation) for an error this engine can name with confidence."""
    if topic == "name":
        if _has(r"\bme llamo es\b", f):
            return "es_llamo_es", "“Me llamo” already means “my name is” — no extra “es”."
        if _has(r"\bmi llamo\b", f):
            return "es_mi_me", "It’s “me” (myself), not “mi” (my): me llamo…"
        if _has(r"(^|\s)(yo )?llamo\s+\w", f) and not _has(r"\bme llamo\b", f):
            return "es_missing_me", "“Llamarse” needs “me”: me llamo… (literally “I call myself”)."
        if _has(r"\bque es tu nombre\b", f):
            return "es_que_cual", "Spanish doesn’t say “qué es tu nombre”. Ask “¿Cómo te llamas?”."
    if topic == "wellbeing":
        if _has(r"\b(yo )?soy (bien|mal|cansad[oa]|feliz|regular)\b", f):
            return "es_ser_estar_feeling", "For how you feel right now, use “estar”: estoy bien."
        if _has(r"\b(estoy )?(bueno|buena)\b", f) and not _has(r"\bbien\b", f):
            return "es_bien_bueno", "“Bien” = well/fine. “Bueno” = good (a good book). Say: bien."
        if _has(r"\bcomo eres\b", f):
            return "es_ser_estar_question", "“¿Cómo eres?” asks what someone is like. For today: ¿cómo estás?"
    if topic == "origin":
        if _has(r"\bestoy de\b", f):
            return "es_ser_estar_origin", "Where you’re from uses “ser”: soy de…"
        if _has(r"\b(soy|estoy) en\b", f):
            return "es_en_vs_de", "“En” is where you are now; “de” is where you’re from: soy de…"
        if _has(r"\bdonde (eres|es) de\b", f):
            return "es_preposition_order", "Spanish puts “de” first: ¿De dónde eres?"
    if topic in ("likes", "wants"):
        if _has(r"\b(yo )?gusto\b", f) and not _has(r"\bme gusto\b", f):
            return "es_gustar_structure", "Spanish says “it pleases me”: me gusta…"
        if _has(r"\bme gusto\b", f):
            return "es_gustar_form", "“Me gusto” means “I like myself”. For things: me gusta…"
        if _has(r"\bme no gusta\b", f):
            return "es_negation_position", "“No” goes first: no me gusta…"
        if _has(r"\b(yo )?quiere\b", f) and not _has(r"\bquiero\b", f):
            return "es_conjugation_yo", "About yourself the verb ends in -o: quiero…"
        err = _article_error(f)
        if err:
            return "es_gender_article", f"Every noun has a gender; the article must match: {err[0]} {err[1]}."
    return None


def _recognised(topic: str, f: str) -> bool:
    return {
        "name": _has(r"\b(me llamo|mi nombre es|soy)\s+\w", f) and not _has(r"\bsoy de\b", f),
        "wellbeing": _has(r"\b(bien|mal|regular|cansad[oa]|genial|fenomenal|mas o menos|feliz|content[oa]|asi asi)\b", f),
        "origin": _has(r"\b(soy|vengo) de\s+\w|^de\s+\w", f) or _has(r"\bsoy (estadounidense|american[oa]|chilen[oa]|mexican[oa]|canadiense|ingles[a]?|espanol[a]?|argentin[oa]|colombian[oa])\b", f),
        "likes": _has(r"\b(me|no me) (gusta|gustan|encanta|encantan)\b", f),
        "wants": _has(r"\b(quiero|quisiera|me da|me pone|necesito)\b|\b(un|una|dos|tres)\s+\w+.*\bpor favor\b|\bpor favor\b", f),
        "goodbye": _has(r"\b(adios|hasta luego|hasta mañana|chao|chau|nos vemos|hasta pronto)\b", f),
    }.get(topic, False)


def _name_in(text: str) -> str | None:
    m = re.search(r"\b(?:me llamo|mi nombre es|soy)\s+([A-ZÁÉÍÓÚÑ][\wáéíóúñ]+)", str(text or ""))
    return m.group(1) if m else None


def _learner_question(f: str) -> str | None:
    if _has(r"\bque significa\s+(\w+)", f):
        word = re.search(r"\bque significa\s+(\w+)", f).group(1)
        meaning = GLOSSARY.get(word)
        return (f"«{word}» significa…", f"“{word}” means: {meaning}." if meaning else f"I don’t have “{word}” in this level’s word list yet, so I won’t guess.")
    if _has(r"\b(mas despacio|no entiendo|puede repetir|puedes repetir|otra vez)\b", f):
        return ("¡Claro! Más despacio:", "Good repair phrase! Here it is again, slowly.")
    if _has(r"\bcomo te llamas\b", f):
        return ("Me llamo Lingua.", None)
    if _has(r"\b(y tu|como estas|que tal)\b", f):
        return ("¡Muy bien, gracias!", None)
    if _has(r"\bde donde eres\b", f):
        return ("Soy de muchos lugares: ¡vivo en LinguaChat!", None)
    return None


REACT = {
    "name": "¡Mucho gusto{n}!", "wellbeing": "¡Qué bien!", "origin": "¡Qué interesante!", "likes": "¡A mí también me gusta!",
    "wants": "¡Perfecto! Aquí tiene.", "goodbye": "¡Adiós! Fue un gusto practicar contigo.",
}


def respond(message: str, topic: str | None = None) -> ChatResult:
    topic = topic if topic in TOPICS else "name"
    f = _fold(message)
    name = _name_in(message)

    if re.search(ENGLISH, f) and len(re.findall(SPANISH_HINT, f)) <= 1:
        return _result(f"¡En español, por favor! {QUESTIONS[topic]}", "not_target_language",
                       explanation="That’s English. Try answering in Spanish — the example below is one natural way.",
                       suggestion=_natural(topic, name), focus=topic, findings=[{"type": "not_target_language"}])

    question = _learner_question(f)
    error = _check(topic, f)
    if error:
        code, why = error
        return _result(f"¡Casi! {QUESTIONS[topic]}", "error", correction=_natural(topic, name), explanation=why,
                       suggestion=_natural(topic, name), focus=topic, findings=[{"type": code}])

    if _recognised(topic, f):
        nxt = _next(topic)
        react = REACT[topic].replace("{n}", f", {name}" if name else "")
        # a learner who answers AND asks back ("Bien, ¿y tú?") gets an answer too
        if question and question[1] is None:
            react = f"{react} {question[0]}"
        reply = react if topic == "goodbye" else f"{react} {QUESTIONS[nxt]}"
        return _result(reply, "no_issue_detected", focus=None if topic == "goodbye" else nxt,
                       findings=[{"type": "recognised", "topic": topic}])

    if question:
        spanish, english = question
        return _result(f"{spanish} {QUESTIONS[topic]}", "no_issue_detected", explanation=english, focus=topic,
                       findings=[{"type": "learner_question"}])

    # Not understood: say so, never invent a correction, offer a guided turn.
    return _result(
        f"Perdón, no entendí bien. {QUESTIONS[topic]}", "insufficient",
        explanation="I’m a practice partner for beginner Spanish, and I couldn’t follow that reliably — so I won’t correct it. "
                    "Let’s try a guided question: answer the one above, for example like this.",
        suggestion=_natural(topic, name), focus=topic, findings=[{"type": "not_evaluable"}])


def opening() -> ChatResult:
    return _result(QUESTIONS["name"], "no_issue_detected", focus="name")
