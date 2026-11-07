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
from ai.scenarios import REWRITES, SCENARIOS, SLOTS, Scenario, Step
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
LEAD = {"en": r"^(hi|hello|hey|ok|okay|yes|well|um|uh|oh|sure|sorry|thanks|thank you|just|maybe)\s+",
        "es": r"^(hola|si|bueno|pues|ok|vale|claro|mira|gracias|buenos dias|buenas tardes|perdon|para mi|tambien)\s+"}
TAIL = {"en": r"\s+(please|thanks|thank you|and you|how about you|what about you|nice to meet you|sir|today|now|too)$",
        "es": r"\s+(por favor|gracias|muchas gracias|y tu|y usted|mucho gusto|encantado|encantada|hoy)$"}
COURTESY = re.compile(r"hi|hello|hey|ok|okay|yes|no|thanks|thank you|please|sorry|nice to meet you|and you|hola|si|gracias|por favor|mucho gusto|y tu|perdon|encantado|encantada")
ES_COMMON = frozenset("triste solo sola mal bien muerto muerta cansado cansada feo fea malo mala nadie nada hoy aqui".split())

_QUESTION_MEANING = re.compile(r"(?:what does (\w+) mean|what is (\w+)|what means (\w+)|what is the meaning of (\w+)|que significa (\w+)|que quiere decir (\w+)|o que e (\w+)|o que significa (\w+)|que veut dire (\w+)|que significa (\w+) en (?:ingles|espanol)|(\w+) means what)")
_QUESTION_SAY = re.compile(r"(?:how do you say (.{1,40}?)(?: in (?:english|spanish))?|how can i say (.{1,40}?)|what is (\w+) in (?:english|spanish)|como se dice (.{1,40}?)(?: en (?:ingles|espanol))?|como digo (.{1,40}?)|comment dit on (.{1,40}?)(?: en anglais)?)")
_REPAIR = re.compile(r"(?:(?:can|could) you (?:please )?(?:repeat|say that again|speak more slowly|speak slower)(?: the question)?|repeat(?: that| the question)?|again|slower|more slowly|i no understand"
                     r"|i do not understand|i did not understand|no entiendo|no entendi|no te entiendo|mas despacio|mas lento|puede repetir(?: la pregunta)?|puedes repetir(?: la pregunta)?|otra vez|repite"
                     r"|pode repetir|nao entendo|nao entendi|vous pouvez repeter|tu peux repeter|je ne comprends pas|non capisco|ich verstehe nicht|pardon vous pouvez repeter)")
_HELP = re.compile(r"(?:help|help me|help me what should i say|hint|i need help|what do i say|what can i say|i do not know|what should i say|ayuda|ayudame|no se|no lo se|que digo|que puedo decir|una pista)")
_WHO = re.compile(r"(?:who are you|what are you|are you (?:a )?(?:real|human|person|robot|bot|ai)(?: person)?|quien eres|que eres|eres (?:una )?(?:persona|real|robot|ia|humana|humano))")
_CHECK = re.compile(r"(?:is (?:this|it|that) (?:correct|right|ok|okay)|am i (?:right|correct)|esta bien(?: asi)?|es correcto|esta correcto|lo dije bien|c est correct|e correto|esta certo|ist das richtig|e giusto)")

# A language question in the learner's own language. Searched, not matched whole:
# these scripts are not folded like Latin text. Kinds: meaning, say, repair, help.
FOREIGN_QUESTIONS = (
    ("meaning", re.compile(r"意味|どういう(?:意味|こと)|ماذا يعني|ما معنى|ما معني|o que (?:e|é|significa|quer dizer)|que veut dire|ça veut dire|ca veut dire|che cosa significa|cosa significa|was bedeutet|was heißt|was heisst")),
    ("say", re.compile(r"(?:英語|スペイン語)で(?:何|なん|どう)|كيف (?:أقول|اقول|نقول)|بالإنجليزية|بالانجليزية|بالإسبانية|como (?:se )?diz|comment (?:on )?dit|comment dire|come si dice|wie sagt man")),
    ("repair", re.compile(r"もう一度|もういちど|ゆっくり|わかりません|分かりません|わからない|أعد|اعد|مرة أخرى|ببطء|لا أفهم|لا افهم|repete|repita|repetir|mais devagar|nao entendo|não entendo|repete|répète|répétez|plus lentement|je ne comprends pas|ripeti|piu piano|più piano|non capisco|wiederholen|langsamer|verstehe nicht")),
    ("help", re.compile(r"ヒント|助けて|何て言えば|なんて言えば|ساعدني|ماذا أقول|ajuda|o que eu digo|aide|que dois-je dire|aiuto|cosa dico|hilfe|was soll ich sagen")),
)

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


SAMPLES = {"name": "Ana", "cname": "Ana", "place": "Chile", "place2": "Chile", "cplace": "Chile", "any": "el té"}
ES_ACCENTS = {"cafe": "café", "te": "té", "adios": "adiós", "si": "sí", "mas": "más", "cuanto": "cuánto", "tambien": "también", "musica": "música", "futbol": "fútbol", "sandwich": "sándwich",
              "peliculas": "películas", "trafico": "tráfico", "platanos": "plátanos"}


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


# one or two everyday words from the guided vocabulary, never a pronoun or a verb form
LEX_NOUN = "(?:" + "|".join(sorted((w for w in LEXICON if w.isalpha() and len(w) > 2 and w not in {
    "and", "but", "the", "you", "she", "they", "him", "her", "them", "his", "its", "our", "your", "their", "not", "nothing", "something", "what", "when", "where", "which", "who", "why", "how",
    "was", "were", "are", "did", "does", "will", "would", "could", "should", "must", "can", "may", "have", "has", "had", "get", "got", "for", "from", "with", "without", "about", "after", "before",
    "this", "that", "these", "those", "there", "here", "then", "than", "too", "very", "just", "yet", "still", "away", "out", "off", "over", "under", "into", "until"}), key=len, reverse=True)) + ")"


def _expand(pattern: str, lang: str) -> str:
    slots = SLOTS[lang]
    word = r"[a-zñ][a-zñ'-]{0,19}"
    table = {
        "{name}": rf"(?P<name>{word}(?: {word}){{0,2}})", "{cname}": rf"(?P<cname>{word}(?: {word}){{0,2}})",
        "{place}": rf"(?P<place>{word}(?: {word}){{0,2}})", "{place2}": rf"(?P<place2>{word}(?: {word})?)", "{cplace}": rf"(?P<cplace>{word}(?: {word})?)",
        "{any}": rf"(?P<any>{word}(?: {word})?)", "{thing2}": rf"(?P<thing2>{slots['thing']})", "{food2}": rf"(?P<food2>{slots['food']})",
        "{art}": rf"(?:{slots['art']})",
    }
    for slot in ("drink", "food", "thing", "number", "feel", "verb"):
        table[f"{{{slot}}}"] = rf"(?P<{slot}>{slots[slot]})"
    table["{lex}"] = rf"(?P<lex>{LEX_NOUN}(?: {LEX_NOUN})?)"
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
    for slot in ("drink", "food", "thing", "feel", "verb"):
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


def _rewritten(step: Step, f: str, raw: str, lang: str) -> tuple[str, str, str] | None:
    """(rule, rewritten answer, explanation key) when one known rewrite makes this a valid answer."""
    for pattern, replacement, rule, key in REWRITES[lang]:
        fixed = re.sub(pattern, replacement, f)
        if fixed != f and _match(step.valid, fixed, raw, lang):
            return rule, fixed, key
    return None


def _edits(a: str, b: str) -> int:
    """Damerau-Levenshtein distance (adjacent transpositions count as one)."""
    d = [[i + j if i * j == 0 else 0 for j in range(len(b) + 1)] for i in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] != b[j - 1]))
            if i > 1 and j > 1 and a[i - 1] == b[j - 2] and a[i - 2] == b[j - 1]:
                d[i][j] = min(d[i][j], d[i - 2][j - 2] + 1)
    return d[len(a)][len(b)]


def _spell_fixed(scenario: Scenario, step: Step, f: str, raw: str) -> str | None:
    """The message with a single misspelt word fixed, if that makes it a valid answer."""
    lang = scenario.target
    vocabulary = _vocabulary(scenario.id, step.id)
    tokens = f.split()
    for i, token in enumerate(tokens):
        if token in vocabulary or len(token) < 4:
            continue
        # a typo, not another word: one edit (two in a long word), transposition included
        close = [w for w in get_close_matches(token, vocabulary, n=3, cutoff=0.75) if _edits(token, w) <= (2 if len(token) >= 8 else 1)][:1]
        fixed = " ".join([*tokens[:i], *close[:1], *tokens[i + 1:]])
        if close and _match(step.valid, fixed, raw, lang):
            return fixed
    return None


def _as_written(fixed: str, step: Step, lang: str, raw: str) -> str:
    """The learner's own answer, repaired and presentable. Open slots are never shown:
    a sample takes their place, so a correction cannot repeat what someone wrote."""
    m = _match(step.valid, fixed, raw, lang)
    spans = sorted(((m.span(k), SAMPLES[k]) for k in SAMPLES if m and m.groupdict().get(k)), reverse=True)
    for (start, end), sample in spans:
        fixed = f"{fixed[:start]}{sample}{fixed[end:]}"
    if lang == "es":
        fixed = " ".join(ES_ACCENTS.get(w, w) for w in fixed.split())
    question = step.model.endswith("?")
    text = f"{fixed[0].upper()}{fixed[1:]}{'?' if question else '.'}"
    return f"¿{text}" if question and lang == "es" else text


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
    for f in _forms(raw, lang):
        found = _rewritten(step, f, raw, lang)
        if found:
            rule, fixed, key = found
            return rule, _as_written(fixed, step, lang, raw), key
    for f in _forms(raw, lang):
        fixed = _spell_fixed(scenario, step, f, raw)
        if fixed:
            return "spelling", _as_written(fixed, step, lang, raw), "sc_spelling"
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
        word = next(g for g in m.groups() if g).strip()
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
    if _CHECK.fullmatch(f):
        return say("sc_check", aux), False
    return None


def _foreign_question(scenario: Scenario, raw: str, aux: str) -> tuple[str, bool] | None:
    """The same closed answers, for a question asked in the learner's own language."""
    if len(raw) > 80:
        return None
    for kind, pattern in FOREIGN_QUESTIONS:
        if not pattern.search(raw.lower()):
            continue
        if kind in ("meaning", "say"):
            latin = [w for w in re.findall(r"[a-zA-ZñÑáéíóúÁÉÍÓÚ]+", raw) if es_tutor._fold(w) in (ES_GLOSS if scenario.target == "es" else EN_GLOSS)]
            word = es_tutor._fold(latin[0]) if len(latin) == 1 else None
            meaning = (ES_GLOSS.get(word) if scenario.target == "es" else EN_GLOSS.get(word, {}).get(aux)) if word and kind == "meaning" else None
            return (say("sc_word_means", aux, word=word, meaning=meaning) if meaning else say("sc_no_word", aux)), False
        return (say("sc_repair_ok", aux), False) if kind == "repair" else (say("sc_help", aux), True)
    return None


def _asked(scenario: Scenario, raw: str, aux: str) -> tuple[str, bool] | None:
    """The whole message, or every one of its clauses, is a question with a closed answer."""
    lang = scenario.target
    for f in _forms(raw, lang):
        found = _question(scenario, f, aux)
        if found:
            return found
    found = _foreign_question(scenario, raw, aux)
    if found:
        return found
    clauses = [c for c in re.split(r"[.!?;,]+", raw) if c.strip()]
    answers = [next(filter(None, (_question(scenario, f, aux) for f in _forms(c, lang))), None) or (None if not any(COURTESY.fullmatch(f) for f in _forms(c, lang)) else False) for c in clauses]
    if len(clauses) > 1 and all(a is not None for a in answers) and any(answers):
        return next(a for a in answers if a)
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

    asked = _asked(scenario, raw, aux) if bounded else None
    if asked:
        text, helped = asked
        return _result(step.ask, scenario, _state(scenario, index, attempt + (1 if helped else 0), "question"), native, explanation=text,
                       suggestion=step.model if helped else None)

    # not understood: the question again, then the model, then a choice, then the way past
    following = attempt + 1
    other = bounded and any(is_valid(s, raw, lang) for s in scenario.steps if s is not step)
    text = say("sc_other_step", aux) if other else say("sc_unclear", aux) if bounded and _looks_like_practice(scenario, step, f) else say("sc_out_of_scope", aux)
    if following > MOVE_ON_AFTER:
        return _advance(scenario, index, "", "not_understood", native, aux, explanation=f"{text} {say('sc_skip', aux)}")
    if following == MOVE_ON_AFTER and step.distractor:
        options = sorted((step.model, step.distractor), key=lambda o: (len(o) + index) % 2)
        action = LearningAction(type="choose_option", prompt=say("sc_choose", aux), options=options)
        return _result(step.ask, scenario, _state(scenario, index, following, "not_understood"), native, explanation=text, action=action)
    return _result(step.ask, scenario, _state(scenario, index, following, "not_understood"), native, explanation=text,
                   suggestion=step.model if following >= 2 else None)
