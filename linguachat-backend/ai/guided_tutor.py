"""The guided tutor: five kinds of turn, and no sixth.

Inside a scenario (ai/scenarios.py) every message is exactly one of:

  safety         the safety layer took it (app/routes/chat.py, before this module)
  valid          the whole message is an answer this step accepts
  error          the whole message is a known mistake in such an answer
  question       a language question this tutor has a closed answer for
  not_understood anything else, in any language, however harmless or harmful

Nothing here understands meaning. It recognises shapes it was given, and says so
when it cannot. What follows from that:

  * a message is never quoted, and open slots (names, places) are never shown;
  * unknown text never gets a reaction: not praise, not a correction, not a
    continuation. It gets the question again, then the model, then a choice;
  * text that does not even look like this exercise also gets the reminder that
    this is a tool and where to turn;
  * the message reaches no prompt, so it cannot give the tutor instructions.
"""
from __future__ import annotations

import re
from difflib import get_close_matches
from functools import lru_cache

from ai import es_tutor
from ai.grammar_check import analyze, corrected_sentence
from ai.guided_scope import LEXICON
from ai.scenario_i18n import ES_EXPLANATIONS, TARGET_LINES
from ai.scenarios import SCENARIOS, SLOTS, Scenario, Step
from ai.schemas import ChatMode, ChatResult, LanguageInfo, LearningAction
from ai.tutor_i18n import say

MAX_WORDS = 14
MAX_CHARS = 120
ANSWER_WORDS = 9          # past this it does not look like an answer to one question
MOVE_ON_AFTER = 3         # failed tries at one step before the tutor shows the way past it
ENGLISH = LanguageInfo(code="en", base="en", name="English")

CONTRACTIONS = (
    (r"\bi'm\b", "i am"), (r"\bim\b", "i am"), (r"\bit's\b", "it is"), (r"\bthat's\b", "that is"), (r"\bwhat's\b", "what is"),
    (r"\bdon't\b", "do not"), (r"\bdont\b", "do not"), (r"\bdidn't\b", "did not"), (r"\bdoesn't\b", "does not"),
    (r"\bi'd\b", "i would"), (r"\bid like\b", "i would like"), (r"\bi'll\b", "i will"), (r"\bcan't\b", "can not"),
)
LEAD = {"en": r"^(hi|hello|hey|ok|okay|yes|well|um|uh|oh|sure|sorry|thanks|thank you)\s+",
        "es": r"^(hola|si|bueno|pues|ok|vale|claro|mira|gracias|buenos dias|buenas tardes|perdon)\s+"}
TAIL = {"en": r"\s+(please|thanks|thank you|and you|how about you|what about you|nice to meet you|sir|today|now)$",
        "es": r"\s+(por favor|gracias|muchas gracias|y tu|y usted|mucho gusto|encantado|encantada|hoy)$"}
COURTESY = re.compile(r"hi|hello|hey|ok|okay|yes|no|thanks|thank you|please|sorry|nice to meet you|and you|hola|si|gracias|por favor|mucho gusto|y tu|perdon|encantado|encantada")
ES_COMMON = frozenset("triste solo sola mal bien muerto muerta cansado cansada feo fea malo mala nadie nada hoy aqui".split())

_QUESTION_MEANING = re.compile(r"(?:what does (\w+) mean|what is (\w+)|what is the meaning of (\w+)|que significa (\w+)|que quiere decir (\w+))")
_QUESTION_SAY = re.compile(r"(?:how do you say (\w+)(?: in (?:english|spanish))?|como se dice (\w+)(?: en (?:ingles|espanol))?)")
_REPAIR = re.compile(r"(?:(?:can|could) you (?:please )?(?:repeat|say that again|speak more slowly|speak slower)|repeat(?: that)?|again|slower|more slowly"
                     r"|i do not understand|no entiendo|no te entiendo|mas despacio|puede repetir|puedes repetir|otra vez|repite)")
_HELP = re.compile(r"(?:help|help me|hint|i need help|what do i say|what can i say|i do not know|what should i say|ayuda|ayudame|no se|no lo se|que digo|que puedo decir|una pista)")
_WHO = re.compile(r"(?:who are you|what are you|are you (?:a )?(?:real|human|person|robot|bot|ai)(?: person)?|quien eres|que eres|eres (?:una )?(?:persona|real|robot|ia|humana|humano))")
_BACK = re.compile(r"(?:and you|how are you|what is your name|where are you from|y tu|como estas|como te llamas|de donde eres)")

# word glosses a learner may ask for, closed. In the learner's language or not at all.
EN_GLOSS = {
    "coffee": {"es": "café", "pt": "café", "fr": "café", "it": "caffè", "de": "Kaffee", "ja": "コーヒー", "ar": "قهوة"},
    "tea": {"es": "té", "pt": "chá", "fr": "thé", "it": "tè", "de": "Tee", "ja": "お茶", "ar": "شاي"},
    "water": {"es": "agua", "pt": "água", "fr": "eau", "it": "acqua", "de": "Wasser", "ja": "水", "ar": "ماء"},
    "please": {"es": "por favor", "pt": "por favor", "fr": "s'il te plaît", "it": "per favore", "de": "bitte", "ja": "お願いします", "ar": "من فضلك"},
    "name": {"es": "nombre", "pt": "nome", "fr": "nom", "it": "nome", "de": "Name", "ja": "名前", "ar": "اسم"},
    "today": {"es": "hoy", "pt": "hoje", "fr": "aujourd'hui", "it": "oggi", "de": "heute", "ja": "今日", "ar": "اليوم"},
    "from": {"es": "de", "pt": "de", "fr": "de", "it": "da", "de": "aus", "ja": "〜から", "ar": "من"},
    "like": {"es": "gustar", "pt": "gostar", "fr": "aimer", "it": "piacere", "de": "mögen", "ja": "好き", "ar": "يحبّ"},
    "want": {"es": "querer", "pt": "querer", "fr": "vouloir", "it": "volere", "de": "wollen", "ja": "欲しい", "ar": "يريد"},
    "drink": {"es": "beber", "pt": "beber", "fr": "boire", "it": "bere", "de": "trinken", "ja": "飲む", "ar": "يشرب"},
    "food": {"es": "comida", "pt": "comida", "fr": "nourriture", "it": "cibo", "de": "Essen", "ja": "食べ物", "ar": "طعام"},
    "card": {"es": "tarjeta", "pt": "cartão", "fr": "carte", "it": "carta", "de": "Karte", "ja": "カード", "ar": "بطاقة"},
    "cash": {"es": "efectivo", "pt": "dinheiro", "fr": "espèces", "it": "contanti", "de": "Bargeld", "ja": "現金", "ar": "نقدًا"},
    "apple": {"es": "manzana", "pt": "maçã", "fr": "pomme", "it": "mela", "de": "Apfel", "ja": "りんご", "ar": "تفاحة"},
    "book": {"es": "libro", "pt": "livro", "fr": "livre", "it": "libro", "de": "Buch", "ja": "本", "ar": "كتاب"},
    "price": {"es": "precio", "pt": "preço", "fr": "prix", "it": "prezzo", "de": "Preis", "ja": "値段", "ar": "سعر"},
}
ES_GLOSS = {**es_tutor.GLOSSARY, "algo": "something", "mas": "more", "tarjeta": "card", "efectivo": "cash", "manzana": "apple", "manzanas": "apples",
            "cuanto": "how much", "cuesta": "it costs", "libro": "book", "mesa": "table", "comida": "food", "pagar": "to pay"}
ES_SAY = {"coffee": "café", "tea": "té", "water": "agua", "please": "por favor", "thanks": "gracias", "card": "tarjeta", "cash": "efectivo",
          "apple": "manzana", "book": "libro", "table": "mesa", "food": "comida"}


def normalise(text: str, lang: str) -> str:
    low = str(text or "").lower().replace("’", "'")
    if lang == "en":
        for pattern, full in CONTRACTIONS:
            low = re.sub(pattern, full, low)
    return es_tutor._fold(low)


def _strip(f: str, lang: str) -> str:
    previous = None
    while f != previous:
        previous = f
        f = re.sub(TAIL[lang], "", re.sub(LEAD[lang], "", f))
    return f


def _expand(pattern: str, lang: str) -> str:
    slots = SLOTS[lang]
    word = r"[a-zñ][a-zñ'-]{1,19}"
    table = {
        "{name}": rf"(?P<name>{word}(?: {word})?)", "{cname}": rf"(?P<cname>{word}(?: {word})?)",
        "{place}": rf"(?P<place>{word}(?: {word}){{0,2}})", "{place2}": rf"(?P<place2>{word}(?: {word})?)", "{cplace}": rf"(?P<cplace>{word}(?: {word})?)",
        "{any}": rf"(?P<any>{word}(?: {word})?)", "{thing2}": rf"(?P<thing2>{slots['thing']})", "{food2}": rf"(?P<food2>{slots['food']})",
        "{art}": rf"(?:{slots['art']})",
    }
    for slot in ("drink", "food", "thing", "number", "feel"):
        table[f"{{{slot}}}"] = rf"(?P<{slot}>{slots[slot]})"
    for key, value in table.items():
        pattern = pattern.replace(key, value)
    return pattern


@lru_cache(maxsize=None)
def _compiled(pattern: str, lang: str) -> re.Pattern:
    return re.compile(_expand(pattern, lang))


@lru_cache(maxsize=None)
def _vocabulary(scenario_id: str, step_id: str) -> frozenset:
    scenario = SCENARIOS[scenario_id]
    step = next(s for s in scenario.steps if s.id == step_id)
    lang = scenario.target
    words = set(normalise(" ".join([step.ask, step.model, step.distractor, *[e[2] for e in step.errors]]), lang).split())
    patterns = " ".join((*step.valid, *[e[0] for e in step.errors]))
    words.update(re.findall(r"[a-zñ]{2,}", re.sub(r"\{\w+\}", " ", patterns)))
    for slot in ("drink", "food", "thing", "feel"):
        if "{" + slot + "}" in patterns:
            words.update(re.findall(r"[a-zñ]{2,}", SLOTS[lang][slot]))
    return frozenset(words)


def _plausible_name(words: str, raw: str, lang: str) -> bool:
    """An open slot in a form that could be an everyday word must look like a name."""
    parts = words.split()
    if lang == "en" and any(w in LEXICON or w.endswith("ing") for w in parts):
        return False
    if lang == "es" and any(w in ES_COMMON for w in parts):
        return False
    written = re.findall(r"[^\W\d_]+", raw)
    capitals = {es_tutor._fold(w) for w in written if w[0].isupper()}
    return all(w in capitals for w in parts)


def _match(patterns, f: str, raw: str, lang: str):
    for pattern in patterns:
        m = _compiled(pattern, lang).fullmatch(f)
        if not m:
            continue
        groups = m.groupdict()
        if all(_plausible_name(groups[key], raw, lang) for key in ("cname", "cplace") if groups.get(key)):
            return m
    return None


def _forms(raw: str, lang: str) -> list[str]:
    full = normalise(raw, lang)
    return [f for f in dict.fromkeys((full, _strip(full, lang))) if f]


def is_valid(step: Step, raw: str, lang: str) -> bool:
    if any(_match(step.valid, f, raw, lang) for f in _forms(raw, lang)):
        return True
    clauses = [c for c in re.split(r"[.!?;,]+", raw) if c.strip()]
    if len(clauses) < 2:
        return False
    # every clause must be accounted for: an answer, or a courtesy
    answered = False
    for clause in clauses:
        forms = _forms(clause, lang)
        if any(_match(step.valid, f, clause, lang) for f in forms):
            answered = True
        elif not any(COURTESY.fullmatch(f) for f in forms):
            return False
    return answered


def _spell_fixed(scenario: Scenario, step: Step, f: str, raw: str) -> bool:
    """A single misspelt word, if fixing it makes the whole message a valid answer."""
    lang = scenario.target
    vocabulary = _vocabulary(scenario.id, step.id)
    tokens = f.split()
    for i, token in enumerate(tokens):
        if token in vocabulary or len(token) < 4:
            continue
        close = get_close_matches(token, vocabulary, n=1, cutoff=0.75)
        if close and _match(step.valid, " ".join([*tokens[:i], close[0], *tokens[i + 1:]]), raw, lang):
            return True
    return False


def _closed_fix(fix: str, m: re.Match, step: Step) -> str:
    """The stored correction, with a closed-list word filled in. Open slots are never echoed."""
    groups = m.groupdict()
    for slot in ("drink", "food", "thing", "feel"):
        fix = fix.replace("{" + slot + "}", groups.get(slot) or "")
    return " ".join(fix.split()) or step.model


def _known_mistake(scenario: Scenario, step: Step, raw: str) -> tuple[str, str, str] | None:
    """(rule, correction, explanation key or "!literal text") for a mistake this step names.

    Read before the valid answers: an open slot would otherwise swallow the
    mistake ("Me llamo es Ana" is not a person called "es Ana").
    """
    lang = scenario.target
    forms = _forms(raw, lang)
    for f in forms:
        for pattern, rule, fix, key in step.errors:
            m = _match((pattern,), f, raw, lang)
            if m:
                return rule, _closed_fix(fix, m, step), key
    if lang == "es" and step.topic:
        known = _vocabulary(scenario.id, step.id)
        for f in forms:
            tokens = f.split()
            # the rules search inside a sentence, so the sentence must be this exercise's
            if len(tokens) <= 7 and sum(t not in known for t in tokens) <= 1:
                found = es_tutor._check(step.topic, f)
                if found:
                    return found[0], step.model, f"!{found[1]}"
    return None


def _repairable(scenario: Scenario, step: Step, raw: str) -> tuple[str, str, str] | None:
    """A slip whose repair is a whole valid answer: one misspelt word, or a grammar finding."""
    lang = scenario.target
    if any(_spell_fixed(scenario, step, f, raw) for f in _forms(raw, lang)):
        return "spelling", step.model, "sc_spelling"
    if lang == "en":
        findings = analyze(raw)
        if findings:
            fixed = corrected_sentence(raw, findings)
            if fixed and fixed.strip() != raw.strip() and is_valid(step, fixed, lang):
                return findings[0].rule, fixed, "sc_generic"
    return None


def _looks_like_practice(scenario: Scenario, step: Step, f: str) -> bool:
    tokens = f.split()
    if not tokens or len(tokens) > ANSWER_WORDS:
        return False
    known = _vocabulary(scenario.id, step.id)
    return sum(t in known for t in tokens) / len(tokens) >= 0.5


def _question(scenario: Scenario, f: str, aux: str) -> tuple[str, bool] | None:
    """(what to tell the learner, counts as help) for a question with a closed answer."""
    lang = scenario.target
    m = _QUESTION_MEANING.fullmatch(f)
    if m:
        word = next(g for g in m.groups() if g)
        meaning = ES_GLOSS.get(word) if lang == "es" else EN_GLOSS.get(word, {}).get(aux)
        return (say("sc_word_means", aux, word=word, meaning=meaning) if meaning else say("sc_no_word", aux)), False
    m = _QUESTION_SAY.fullmatch(f)
    if m:
        word = next(g for g in m.groups() if g)
        if lang == "es":
            answer = ES_SAY.get(word)
        else:
            answer = next((en for en, table in EN_GLOSS.items() if es_tutor._fold(table.get(aux, "")) == word), None)
        return (say("sc_word_means", aux, word=word, meaning=answer) if answer else say("sc_no_word", aux)), False
    if _REPAIR.fullmatch(f):
        return say("sc_repair_ok", aux), False
    if _HELP.fullmatch(f):
        return say("sc_help", aux), True
    if _WHO.fullmatch(f) or _BACK.fullmatch(f):
        return say("sc_who", aux), False
    return None


def _state(scenario: Scenario, index: int, attempt: int, turn_class: str, *, done: bool = False, rule: str | None = None) -> dict:
    state = {"id": scenario.id, "step": index, "total": len(scenario.steps), "attempt": attempt, "turn_class": turn_class, "done": done}
    return {**state, "rule": rule} if rule else state


def _result(reply, scenario, state, native, *, correction=None, explanation=None, suggestion=None, action=None,
            verdict="insufficient", findings=None, independent=False) -> ChatResult:
    return ChatResult(
        reply=reply, correction=correction, explanation=explanation, suggestion=suggestion, mode=ChatMode.CHAT, learning_action=action,
        detected_language=native, target_language=es_tutor.TARGET if scenario.target == "es" else ENGLISH,
        analysis={"scenario": state, "verdict": verdict, "confidence": "low" if verdict == "insufficient" else "high", "findings": findings or [],
                  "source": "scenario", "guided": True, "independent": independent},
    )


def _advance(scenario: Scenario, index: int, lead: str, turn_class: str, native, aux: str, *, rule=None, explanation=None, **extra) -> ChatResult:
    if index + 1 >= len(scenario.steps):
        closing = f"{explanation} {say('sc_done', aux)}" if explanation else say("sc_done", aux)
        return _result(lead or scenario.steps[index].ok or TARGET_LINES["sc_move_on"][scenario.target], scenario,
                       _state(scenario, index, 0, turn_class, done=True, rule=rule), native, explanation=closing, **extra)
    reply = " ".join(p for p in (lead, scenario.steps[index + 1].ask) if p)
    return _result(reply, scenario, _state(scenario, index + 1, 0, turn_class, rule=rule), native, explanation=explanation, **extra)


def respond(scenario_id: str, step: int, attempt: int, message: str, native: LanguageInfo, assisted: bool = False) -> ChatResult | None:
    """One turn of an open scenario, or None when the id is not one."""
    scenario = SCENARIOS.get(scenario_id)
    if scenario is None or not scenario.available:
        return None
    return turn(scenario, step, attempt, message, native, assisted)


def turn(scenario: Scenario, index: int, attempt: int, message: str, native: LanguageInfo, assisted: bool = False) -> ChatResult:
    index = max(0, min(int(index or 0), len(scenario.steps) - 1))
    attempt = max(0, min(int(attempt or 0), 9))
    aux = native.base or "en"
    lang = scenario.target
    step = scenario.steps[index]
    raw = message.strip()
    f = normalise(raw, lang)
    bounded = len(raw) <= MAX_CHARS and len(f.split()) <= MAX_WORDS

    found = _known_mistake(scenario, step, raw) if bounded else None
    if bounded and not found and is_valid(step, raw, lang):
        care = say("sc_care", aux) if step.care and re.search(step.care, f) else None
        return _advance(scenario, index, step.ok, "valid", native, aux, verdict="no_issue_detected", independent=attempt == 0 and not assisted, explanation=care)

    found = found or (_repairable(scenario, step, raw) if bounded else None)
    if found:
        rule, fix, key = found
        why = key[1:] if key.startswith("!") else ES_EXPLANATIONS.get(key) or say(key, aux)
        rule = re.sub(r"[^a-z_]", "_", rule.lower())[:40]
        findings = [{"rule": rule, "confidence": "high"}]
        if attempt + 1 >= MOVE_ON_AFTER:
            return _advance(scenario, index, TARGET_LINES["sc_move_on"][lang], "error", native, aux, rule=rule, explanation=why, correction=fix, verdict="error", findings=findings)
        return _result(f"{TARGET_LINES['sc_try_again'][lang]} {step.ask}", scenario, _state(scenario, index, attempt + 1, "error", rule=rule), native,
                       correction=fix, explanation=why, verdict="error", findings=findings)

    asked = (_question(scenario, f, aux) or _question(scenario, _strip(f, lang) or f, aux)) if bounded else None
    if asked:
        text, helped = asked
        return _result(step.ask, scenario, _state(scenario, index, attempt + (1 if helped else 0), "question"), native, explanation=text,
                       suggestion=step.model if helped else None)

    # not understood: the question again, then the model, then a choice, then the way past
    following = attempt + 1
    text = say("sc_unclear", aux) if bounded and _looks_like_practice(scenario, step, f) else say("sc_out_of_scope", aux)
    if following > MOVE_ON_AFTER:
        return _advance(scenario, index, "", "not_understood", native, aux, explanation=f"{text} {say('sc_skip', aux)}")
    if following == MOVE_ON_AFTER and step.distractor:
        options = sorted((step.model, step.distractor), key=lambda o: (len(o) + index) % 2)
        action = LearningAction(type="choose_option", prompt=say("sc_choose", aux), options=options)
        return _result(step.ask, scenario, _state(scenario, index, following, "not_understood"), native, explanation=text, action=action)
    return _result(step.ask, scenario, _state(scenario, index, following, "not_understood"), native, explanation=text,
                   suggestion=step.model if following >= 2 else None)
