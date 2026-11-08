"""Is this message English? (P5) — a small, conservative language identifier.

The chat must not correct a sentence written in Spanish or German as if it were
bad English, nor praise it. Until P5 it only recognised the LEARNER's own
language, with a short word list, so "Ayer fui a la escuela con mi hermano."
(3 of 8 listed words) and any German sentence from a Spanish speaker were
treated as English with "no issue detected".

How it decides, in order:
  1. Letters mostly from a non-Latin script (Japanese, Chinese, Korean, Arabic,
     Cyrillic, Greek, Hebrew, Devanagari, Thai) → not English.
  2. Four or more Latin words: count FUNCTION words of English and of Spanish,
     Portuguese, French, Italian and German. The foreign lists leave out every
     word that is also English ("a", "no", "me", "he", "come", "die", "do",
     "son", "sin"...), so an English sentence with a Spanish name in it stays
     English. A language wins only with at least three of its words, at least
     30 % of the message, and at least twice the English count.
  3. Otherwise: no claim. A short or mixed message is "unknown", never guessed.

It identifies; it does not translate or grade. Ambiguous text stays unknown.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

SCRIPTS = {
    "ja": re.compile(r"[぀-ヿ一-鿿]"), "ko": re.compile(r"[가-힯]"),
    "ar": re.compile(r"[؀-ۿ]"), "ru": re.compile(r"[Ѐ-ӿ]"), "el": re.compile(r"[Ͱ-Ͽ]"),
    "he": re.compile(r"[֐-׿]"), "hi": re.compile(r"[ऀ-ॿ]"), "th": re.compile(r"[฀-๿]"),
}

ENGLISH = frozenset("""
the a an is are am was were i you he she it we they my your his her our their to of and in on at for with have has
had do does did not this that like go went be been will can would what how where when why who there here very
yesterday today school friend because but or so if me him them us want need from by about some many much
""".split())

FUNCTION_WORDS = {
    "es": frozenset("""
el la los las del que y en un una unos unas es por para con se su sus mi mis lo al yo tú muy pero porque cuando
como está estoy estás soy eres somos fui fue fuimos voy vas vamos tengo tienes tiene quiero quieres hay ayer hoy
mañana también mucho mucha bien gracias hola nos les sí ya aquí eso esto este esta ese esa qué cómo dónde cuándo
nada todo siempre nunca más menos después antes ahora donde sobre entre hasta desde hermano hermana escuela casa
amigo amiga día años trabajo comer hacer
""".split()),
    "pt": frozenset("""
os da dos das que e em um uma uns é não para com na nas eu você vocês muito muita obrigado obrigada olá tudo bem
estou está sou somos fui foi vou tenho quero ontem hoje amanhã também mas porque quando meu minha ele ela isso isto
aqui escola irmão irmã amigo nada sempre nunca mais depois agora onde sem até fazer
""".split()),
    "fr": frozenset("""
le la les du des que et un une est pas pour avec je tu il nous vous ils elle elles ce cette ces mon ma mes ton ta
suis sommes êtes sont très merci bonjour aussi mais parce quand comme hier aujourd demain au aux sur dans qui oui
j c d l n qu été fait aller avoir être école frère sœur ami rien toujours jamais plus après avant maintenant où sans
chez content contente
""".split()),
    "it": frozenset("""
il lo gli di del della dei che e è un una uno per con sono sei siamo ciao grazie io lui lei molto molta mio mia
ieri oggi domani anche ma perché quando ho hai al alla nel nella questo questa quello scuola fratello sorella
amico niente sempre mai più dopo prima adesso dove senza fino andato andata fatto
""".split()),
    "de": frozenset("""
der das den dem des und ist nicht ein eine einen einem zu mit ich du er sie wir ihr es bin bist sind habe hast hat
auch aber weil wenn heute gestern morgen sehr danke hallo gut kann keine kein mein meine im vom zum zur für ja
nein wie geht müde zeit schule bruder schwester freund nichts immer nie mehr nach vor jetzt wo ohne bis gegangen
gemacht haben sein gehen
""".split()),
}

_LATIN_WORD = re.compile(r"[^\W\d_]+", re.UNICODE)
MIN_WORDS = 4


@dataclass(frozen=True)
class LanguageGuess:
    language: str | None      # "en", a foreign code, or None (no claim)
    english: bool | None      # True / False / None (unknown)
    reason: str


def identify(text: str) -> LanguageGuess:
    letters = [c for c in text or "" if c.isalpha()]
    if not letters:
        return LanguageGuess(None, None, "no_letters")
    for code, rx in SCRIPTS.items():
        if sum(1 for c in letters if rx.match(c)) / len(letters) >= 0.5:
            return LanguageGuess(code, False, "script")
    words = [w.lower() for w in _LATIN_WORD.findall(text)]
    if len(words) < MIN_WORDS:
        return LanguageGuess(None, None, "too_short")
    english = sum(w in ENGLISH for w in words)
    hits = {code: sum(w in table for w in words) for code, table in FUNCTION_WORDS.items()}
    code, best = max(hits.items(), key=lambda kv: kv[1])
    if best >= 3 and best >= 0.3 * len(words) and best >= 2 * english:
        return LanguageGuess(code, False, "function_words")
    if english >= 2 and english >= 2 * best:
        return LanguageGuess("en", True, "function_words")
    return LanguageGuess(None, None, "mixed_or_unknown")


def is_not_english(text: str) -> bool:
    return identify(text).english is False
