"""Rule-based checks for common learner errors in English chat messages.

WHAT THIS IS
------------
A small set of general, high-precision rules — not a list of sentences. Each
rule recognises a family of errors ("goed", "eated", "runned", ...) from
linguistic knowledge (irregular verb forms, time markers, agreement, the a/an
sound rule) and proposes one correction with the facts needed to explain it.

WHAT IT IS NOT
--------------
It does not understand English. A sentence with no finding has NOT been shown
to be correct: the verdict is ``no_issue_detected`` with low confidence, and
callers must never present that as "correct". Anything outside these rules
(word choice, tense subtleties, meaning) needs a real evaluator — the hybrid
contract's remote path, when an authorised provider exists.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

# Base form -> simple past. Ambiguous or easily-misread verbs are left out on
# purpose (read, lead, lie, ...): a wrong correction is worse than none.
IRREGULAR_PAST = {
    "be": "was", "become": "became", "begin": "began", "break": "broke", "bring": "brought",
    "build": "built", "buy": "bought", "catch": "caught", "choose": "chose", "come": "came",
    "cut": "cut", "do": "did", "draw": "drew", "drink": "drank", "drive": "drove", "eat": "ate",
    "fall": "fell", "feel": "felt", "find": "found", "fly": "flew", "forget": "forgot",
    "get": "got", "give": "gave", "go": "went", "grow": "grew", "have": "had", "hear": "heard",
    "hit": "hit", "hold": "held", "hurt": "hurt", "keep": "kept", "know": "knew", "leave": "left",
    "lose": "lost", "make": "made", "meet": "met", "pay": "paid", "put": "put", "ride": "rode",
    "run": "ran", "say": "said", "see": "saw", "sell": "sold", "send": "sent", "shut": "shut",
    "sit": "sat", "sleep": "slept", "speak": "spoke", "spend": "spent", "stand": "stood",
    "swim": "swam", "take": "took", "teach": "taught", "tell": "told", "think": "thought",
    "understand": "understood", "wake": "woke", "wear": "wore", "win": "won", "write": "wrote",
}

# Real English words that a naive "+ed" generator would produce: never flag them.
REAL_WORDS = {"seed", "singed", "flied", "putted", "costed", "leaded", "wakened", "shutted"}

# Regular verbs common at A1–B1, for tense and agreement checks.
REGULAR_VERBS = {
    "call", "clean", "cook", "dance", "enjoy", "finish", "help", "like", "listen", "live", "love",
    "need", "open", "play", "start", "stay", "study", "talk", "travel", "visit", "walk", "want",
    "watch", "work", "arrive", "move", "use", "try", "wash", "practice", "practise", "learn",
}
AGREEMENT_VERBS = REGULAR_VERBS | {
    "go", "do", "have", "eat", "drink", "speak", "read", "write", "know", "think", "teach",
    "make", "get", "take", "say", "see", "come", "sleep", "run", "swim", "drive", "buy", "sing",
}

SUBJECTS = {"i", "you", "we", "they", "he", "she", "it"}
THIRD_PERSON = {"he", "she", "it"}
AUXILIARIES = {"do", "does", "did", "can", "could", "will", "would", "should", "must", "may",
               "might", "to", "let", "make", "made", "help", "see", "saw", "watch", "hear"}
PAST_UNITS = {"night", "week", "month", "year", "weekend", "summer", "winter", "spring",
              "autumn", "fall", "time", "monday", "tuesday", "wednesday", "thursday",
              "friday", "saturday", "sunday"}

# "a"/"an" follow the sound, not the letter.
VOWEL_LETTER_CONSONANT_SOUND = ("uni", "use", "usu", "uti", "eu", "ewe", "one", "once", "ufo", "uk", "us")
SILENT_H = ("hour", "honest", "honor", "honour", "heir")

TOKEN = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)?")


@dataclass
class Finding:
    """One detected error and everything needed to correct and explain it."""
    rule: str                      # stable id: past_irregular, past_marker, third_person, article
    original: str                  # the learner's token(s), as written
    replacement: str               # what replaces them
    start: int
    end: int
    confidence: str                # high | medium
    facts: dict = field(default_factory=dict)  # values for the explanation templates


def _past_of(base: str) -> str:
    if base in IRREGULAR_PAST:
        return IRREGULAR_PAST[base]
    if base.endswith("e"):
        return base + "d"
    if re.search(r"[^aeiou]y$", base):
        return base[:-1] + "ied"
    if base in {"travel"}:
        return base + "led"
    if re.search(r"^[^aeiou]*[aeiou][^aeiouwxy]$", base) and len(base) <= 4:
        return base + base[-1] + "ed"
    return base + "ed"


def _third_person(base: str) -> str:
    if base == "have":
        return "has"
    if re.search(r"(s|sh|ch|x|z|o)$", base):
        return base + "es"
    if re.search(r"[^aeiou]y$", base):
        return base[:-1] + "ies"
    return base + "s"


def _overregularized_forms() -> dict[str, str]:
    """Every plausible "+ed" mistake of an irregular verb -> its base form."""
    forms: dict[str, str] = {}
    for base, past in IRREGULAR_PAST.items():
        if base in {"be", "have", "do"}:
            candidates = {base + "ed"}
        else:
            candidates = {base + "ed"}
            if base.endswith("e"):
                candidates.add(base + "d")
            if re.search(r"[^aeiou][aeiou][^aeiouwy]$", base):
                candidates.add(base + base[-1] + "ed")
            if base.endswith("y") and not base.endswith(("ay", "ey", "oy", "uy")):
                candidates.add(base[:-1] + "ied")
        candidates.add(past + "ed")       # "wented", "ated"
        for form in candidates:
            if form not in REAL_WORDS and form != past:
                forms[form] = base
    return forms


OVERREGULARIZED = _overregularized_forms()


def _match_case(template: str, replacement: str) -> str:
    if template.isupper() and len(template) > 1:
        return replacement.upper()
    if template[:1].isupper():
        return replacement[:1].upper() + replacement[1:]
    return replacement


def _base_of(verb: str) -> str | None:
    """The base form of a present-tense verb the rules know, or None."""
    if verb in AGREEMENT_VERBS or verb in IRREGULAR_PAST:
        return verb
    for suffix, restore in (("ies", "y"), ("es", ""), ("s", "")):
        if verb.endswith(suffix):
            base = verb[: -len(suffix)] + restore
            if base in AGREEMENT_VERBS or base in IRREGULAR_PAST:
                return base
    return None


def _past_marker(words: list[str]) -> str | None:
    for i, word in enumerate(words):
        if word == "yesterday":
            return "yesterday"
        if word == "ago" and i > 0:
            return f"{words[i - 1]} ago" if i > 1 else "ago"
        if word == "last" and i + 1 < len(words) and words[i + 1] in PAST_UNITS:
            return f"last {words[i + 1]}"
    return None


def analyze(text: str) -> list[Finding]:
    """All findings, left to right, without overlapping spans."""
    tokens = list(TOKEN.finditer(text or ""))
    words = [t.group(0).lower() for t in tokens]
    findings: list[Finding] = []
    taken: set[int] = set()

    def add(index: int, finding: Finding) -> None:
        if index not in taken:
            taken.add(index)
            findings.append(finding)

    # 1) Irregular verbs given a regular "-ed" past: "goed", "eated", "runned".
    for i, token in enumerate(tokens):
        base = OVERREGULARIZED.get(words[i])
        if base:
            past = IRREGULAR_PAST[base]
            add(i, Finding("past_irregular", token.group(0), _match_case(token.group(0), past),
                           token.start(), token.end(), "high",
                           {"wrong": token.group(0), "base": base, "past": past}))

    # 2) A finished time ("yesterday", "last week", "two days ago") with a present verb.
    marker = _past_marker(words)
    if marker:
        for i in range(len(tokens) - 1):
            if words[i] not in SUBJECTS or i + 1 in taken:
                continue
            if i > 0 and words[i - 1] in AUXILIARIES:
                continue
            verb = words[i + 1]
            if verb in {"am", "is", "are"}:
                past = "were" if verb == "are" else "was"
                base = "be"
            else:
                base = _base_of(verb)
                if not base:
                    continue
                past = _past_of(base)
            token = tokens[i + 1]
            add(i + 1, Finding("past_marker", token.group(0), _match_case(token.group(0), past),
                               token.start(), token.end(), "medium",
                               {"marker": marker, "base": base, "past": past, "wrong": token.group(0)}))
            break

    # 3) He/she/it with a base verb in the present: "she like" -> "she likes".
    if not marker:
        for i in range(len(tokens) - 1):
            subject = words[i]
            if subject not in THIRD_PERSON or i + 1 in taken:
                continue
            if i > 0 and words[i - 1] in AUXILIARIES | {"does", "did", "do"}:
                continue
            # "it" is only a subject at the start of a clause ("let it go" is not).
            if subject == "it" and i > 0 and not re.search(r"[.!?,;]\s*$", text[: tokens[i].start()]):
                continue
            verb = words[i + 1]
            if verb in AGREEMENT_VERBS and verb not in {"can", "will"}:
                fixed = _third_person(verb)
                token = tokens[i + 1]
                add(i + 1, Finding("third_person", token.group(0), _match_case(token.group(0), fixed),
                                   token.start(), token.end(), "medium",
                                   {"subject": tokens[i].group(0), "base": verb, "fixed": fixed}))

    # 4) a/an by the sound of the next word: "a apple" -> "an apple".
    for i in range(len(tokens) - 1):
        article, nxt = words[i], words[i + 1]
        if article not in {"a", "an"} or not tokens[i + 1].group(0).islower():
            continue
        vowel_sound = (nxt[0] in "aeiou" and not nxt.startswith(VOWEL_LETTER_CONSONANT_SOUND)) \
            or nxt.startswith(SILENT_H)
        wanted = "an" if vowel_sound else "a"
        if wanted != article:
            token = tokens[i]
            add(i, Finding("article", token.group(0), _match_case(token.group(0), wanted),
                           token.start(), token.end(), "medium",
                           {"article": wanted, "word": nxt, "wrong": token.group(0)}))

    return sorted(findings, key=lambda f: f.start)


def corrected_sentence(text: str, findings: list[Finding]) -> str:
    """The learner's sentence with every finding applied."""
    out, last = [], 0
    for finding in sorted(findings, key=lambda f: f.start):
        out.append(text[last:finding.start])
        out.append(finding.replacement)
        last = finding.end
    out.append(text[last:])
    return "".join(out).strip()
