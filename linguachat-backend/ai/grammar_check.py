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


# Verbs whose simple past is spelled like the base: after "yesterday" the
# sentence may well be right ("I read a book yesterday"), so a past-marker
# finding on them is impossible to justify — and "readed" would be a wrong
# correction. P3: found by the false-positive corpus.
SAME_FORM_PAST = {"read", "put", "cut", "hit", "let", "set", "shut", "hurt", "cost", "quit", "spread",
                  "bet", "cast", "burst", "split", "shed", "upset", "broadcast", "fit"}


def _past_of(base: str) -> str:
    if base in SAME_FORM_PAST:
        return base
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


# --- P5: a singular NOUN subject ("my sister", "the shop", "our English teacher") ---
#
# Agreement after a noun phrase is checked only where the structure leaves no
# doubt, so a wrong correction stays rarer than a missed one:
#   * the phrase opens a clause: the sentence start, after punctuation, after a
#     clause word ("and", "because", "when"...) or a reporting verb ("I think ...");
#     never after "let", "see", "help", "make" (bare infinitives) or "that"
#     (mandative subjunctive: "It is important that he go");
#   * it is a SINGULAR determiner + one or two words + the verb, with nothing
#     else in between but a frequency adverb, and no punctuation;
#   * the head noun does not end in -s (plural, or "bus"/"news": left alone),
#     and is not a collective, an irregular plural or a time word ("this week
#     go to bed early" is an imperative);
#   * the word after the verb is not a verb itself ("the school work is hard":
#     a compound noun, not a subject + verb).
# Proper names ("Maria like ...") are NOT checked: an unknown capitalised word
# may be a plural that does not end in -s (Sheep, Fish, Children).
SINGULAR_DETERMINERS = {"my", "your", "his", "her", "our", "their", "the", "this", "that", "every", "each"}
NOT_SINGULAR_HEADS = {
    "people", "children", "men", "women", "police", "family", "team", "staff", "crew", "government", "class",
    "audience", "couple", "majority", "sheep", "fish", "deer", "data", "media", "cattle", "feet", "teeth", "mice",
    "geese", "group", "public", "band", "company", "club", "committee", "army", "jury",
    "day", "morning", "afternoon", "evening", "night", "week", "month", "year", "weekend", "time", "summer",
    "winter", "spring", "autumn", "today", "tonight", "moment", "hour", "minute", "second", "semester", "term",
}
# Not "and"/"or": "My mother and my father cook" is ONE plural subject. After a
# comma ("…, and my sister like cats") the clause is new and is still checked.
CLAUSE_STARTERS = {"but", "so", "because", "when", "if", "while", "although", "though", "until", "before",
                   "after", "since", "then"}
REPORTING_VERBS = {"think", "thinks", "know", "knows", "believe", "believes", "hope", "hopes", "guess", "suppose",
                   "say", "says"}
FREQUENCY_ADVERBS = {"always", "usually", "often", "sometimes", "never", "rarely", "also", "really", "still",
                     "normally", "generally", "seldom"}
NOT_NOUNS = SUBJECTS | SINGULAR_DETERMINERS | AUXILIARIES | CLAUSE_STARTERS | FREQUENCY_ADVERBS | {
    "me", "him", "us", "them", "a", "an", "of", "in", "on", "at", "for", "with", "from", "by", "about", "not",
    "who", "which", "what", "where", "why", "how", "is", "are", "was", "were", "am", "be", "has", "have", "had",
    "very", "too", "there", "here", "some", "all", "many", "both", "these", "those", "other", "others", "more",
    "one", "two", "three", "no", "any",
}
# allowed before the head ("my best friend"), never as the head itself
NOT_HEADS = {"best", "first", "last", "next", "own", "other", "more", "most", "little", "old", "new", "good", "big"}
# "Yesterday my sister ...", "Last week the shop ...", "Every morning my mother ...": a time phrase opens the clause
TIME_WORDS = {"yesterday", "today", "tonight", "now", "ago"}
TIME_UNITS = PAST_UNITS | {"morning", "afternoon", "evening", "day"}
VERB_FOLLOWERS = {"is", "are", "was", "were", "has", "have", "had", "will", "would", "can", "could", "should", "must",
                  "does", "do", "did", "isn't", "aren't", "wasn't", "weren't", "doesn't", "don't", "may", "might"}
_ONLY_SPACE = re.compile(r"^[\s']*$")


def _noun_subjects(text: str, tokens: list, words: list[str]) -> list[tuple[int, int, int]]:
    """(determiner index, head index, verb index) for each safe singular noun subject."""
    found = []
    for i, word in enumerate(words):
        if word not in SINGULAR_DETERMINERS:
            continue
        before = text[: tokens[i].start()]
        after_time = i > 0 and (words[i - 1] in TIME_WORDS or (
            i > 1 and words[i - 1] in TIME_UNITS and words[i - 2] in {"last", "this", "next", "every", "each", "on"}))
        if i > 0 and not re.search(r"[.!?,;:]\s*(?:(?:and|or)\s+)?$", before, re.I) \
                and words[i - 1] not in CLAUSE_STARTERS | REPORTING_VERBS and not after_time:
            continue
        for size in (1, 2):
            head = i + size
            verb = head + 1
            if verb < len(words) and words[verb] in FREQUENCY_ADVERBS:
                verb += 1
            if verb >= len(words):
                break
            nouns = words[i + 1: head + 1]
            if any(w in NOT_NOUNS or not re.fullmatch(r"[a-z]+(?:'s)?", w) for w in nouns):
                break
            if any(w.endswith("s") and not w.endswith("'s") for w in nouns) or words[head] in NOT_SINGULAR_HEADS \
                    or words[head] in NOT_HEADS or words[head].endswith("'s"):
                continue
            # nothing but spaces between the determiner and the verb: "My sister, like me, ..." is not a subject + verb
            if not _ONLY_SPACE.match(re.sub(r"[A-Za-z']+", "", text[tokens[i].start(): tokens[verb].start()])):
                break
            if verb + 1 < len(words) and words[verb + 1] in VERB_FOLLOWERS:
                continue
            candidate = words[verb]
            if candidate in {"don't", "dont", "is", "are", "am"} or candidate in AGREEMENT_VERBS or _base_of(candidate):
                found.append((i, head, verb))
                break
    return found


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
                if not base or (base in SAME_FORM_PAST and verb == base):
                    continue
                past = _past_of(base)
            # never "correct" a word into itself
            if past == verb:
                continue
            token = tokens[i + 1]
            add(i + 1, Finding("past_marker", token.group(0), _match_case(token.group(0), past),
                               token.start(), token.end(), "medium",
                               {"marker": marker, "base": base, "past": past, "wrong": token.group(0)}))
            break
        # P5: the same with a singular noun subject ("Yesterday my sister go ...")
        if not any(f.rule == "past_marker" for f in findings):
            for _det, _head, v in _noun_subjects(text, tokens, words):
                verb = words[v]
                if v in taken or verb in {"are", "am", "don't", "dont"}:
                    continue
                if verb == "is":
                    base, past = "be", "was"
                else:
                    base = _base_of(verb)
                    if not base or (base in SAME_FORM_PAST and verb in {base, _third_person(base)}):
                        continue
                    past = _past_of(base)
                if past == verb:
                    continue
                token = tokens[v]
                add(v, Finding("past_marker", token.group(0), _match_case(token.group(0), past),
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
            # "she don't" -> "she doesn't": the same agreement, on the auxiliary.
            if verb in {"don't", "dont"}:
                token = tokens[i + 1]
                add(i + 1, Finding("third_person", token.group(0), _match_case(token.group(0), "doesn't"),
                                   token.start(), token.end(), "medium",
                                   {"subject": tokens[i].group(0), "base": "don't", "fixed": "doesn't"}))
                continue
            if verb in AGREEMENT_VERBS and verb not in {"can", "will"}:
                fixed = _third_person(verb)
                token = tokens[i + 1]
                add(i + 1, Finding("third_person", token.group(0), _match_case(token.group(0), fixed),
                                   token.start(), token.end(), "medium",
                                   {"subject": tokens[i].group(0), "base": verb, "fixed": fixed}))
        # P5: a singular noun subject with a base verb: "My sister like cats".
        for det, head, v in _noun_subjects(text, tokens, words):
            if v in taken:
                continue
            verb, token = words[v], tokens[v]
            subject = text[tokens[det].start(): tokens[head].end()]
            if verb in {"don't", "dont"}:
                fixed, base = "doesn't", "don't"
            elif verb in AGREEMENT_VERBS and verb not in {"can", "will"}:
                fixed, base = _third_person(verb), verb
            else:
                continue
            add(v, Finding("third_person", token.group(0), _match_case(token.group(0), fixed),
                           token.start(), token.end(), "medium",
                           {"subject": subject, "base": base, "fixed": fixed, "noun_subject": True}))

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


# What a CORRECT irregular past says about the learner (P3). Only forms that
# cannot be anything else count: a past identical to its base ("put", "cut"),
# a form that is also a common other word ("left", "felt"), the auxiliary "did",
# and "was" (learned as a chunk long before the rule) say nothing. After
# have/has/had/be the form is a participle, not the simple past.
NOT_EVIDENCE_OF_PAST = {"left", "felt", "did", "was", "found", "fell", "saw", "won", "lost"}
PARTICIPLE_CONTEXT = {"have", "has", "had", "i've", "you've", "we've", "they've", "is", "are",
                      "was", "were", "be", "been", "being", "get", "gets", "got"}
PAST_TO_BASE = {past: base for base, past in IRREGULAR_PAST.items()
                if past != base and past not in NOT_EVIDENCE_OF_PAST}


def correct_uses(text: str) -> list[dict]:
    """Irregular past forms used correctly, in order, once each: {rule, form, base}.

    This is an observation that a form was produced, never proof the rule is
    known: whether it counts as learning is decided by WHEN and HOW it was
    produced (after a correction? prompted? in a new context?), on the
    learner's side, where that history is kept.
    """
    words = [t.group(0).lower() for t in TOKEN.finditer(text or "")]
    uses, seen = [], set()
    for i, word in enumerate(words):
        base = PAST_TO_BASE.get(word)
        if not base or word in seen:
            continue
        if any(w in PARTICIPLE_CONTEXT for w in words[max(0, i - 2):i]):
            continue
        seen.add(word)
        uses.append({"rule": "past_irregular", "form": word, "base": base})
    return uses


def corrected_sentence(text: str, findings: list[Finding]) -> str:
    """The learner's sentence with every finding applied."""
    out, last = [], 0
    for finding in sorted(findings, key=lambda f: f.start):
        out.append(text[last:finding.start])
        out.append(finding.replacement)
        last = finding.end
    out.append(text[last:])
    return "".join(out).strip()
