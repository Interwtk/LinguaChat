"""P3: the quality of what Lingua corrects — and what it leaves alone.

A wrong correction hurts more than a careful silence. This corpus is the
regression net for false positives: every sentence below is valid English a
learner might write, several of them chosen because a naive rule trips on them
(past forms identical to the base, a/an by sound, "it" that is not a subject,
participles, questions). It found two real defects in P3 ("I read a book
yesterday" was corrected to "readed"; "I put it there yesterday" to itself).

Errors are checked for the exact span and replacement, combined errors for
all of them, and sentences outside what the rules know for an honest
"no issue detected, low confidence" — never praise, never a guess.
"""
import re

import pytest
from fastapi.testclient import TestClient

from ai.grammar_check import IRREGULAR_PAST, SAME_FORM_PAST
from ai.local_engine import assess
from app.services.memory import conversation_memory
from main import app

client = TestClient(app)

VALID = [
    "I read a book yesterday.", "I put the book on the table yesterday.", "Yesterday I cut my finger.",
    "She can swim very well.", "My friends like football.", "It rains a lot here.", "I waited for an hour.",
    "She studies at a university.", "Yesterday I was tired.", "Last week they had fun.", "He has a car.",
    "She doesn't like coffee.", "Does he work on Sundays?", "I have a European passport.", "It is an honest answer.",
    "Last night we stayed home.", "My mother works in a hospital.", "They play tennis every day.",
    "I usually have breakfast at eight.", "He goes to school by bus.", "We saw a movie two days ago.",
    "I would like an orange juice.", "The children play outside.", "Last year I lived in Madrid.",
    "She watches TV every evening.", "Yesterday it was sunny.", "I bought a new phone last month.", "He said hello.",
    "People like music.", "An umbrella is useful.", "A one-way ticket, please.", "Let it go.", "Make it simple.",
    "I let him go.", "Do you know her?", "I think she likes it.", "Can he come tomorrow?", "My brother and I play chess.",
    "The police were there.", "Yesterday I was going home when it started to rain.", "I have been to London.",
    "Last summer I swam every day.", "Two days ago she called me.", "He will come later.", "She must go now.",
    "Yesterday we didn't go out.", "Did you see it yesterday?", "Last week I hit my head.", "It is a useful tool.",
    "I need an hour.", "She is an honest person.", "I don't know.", "They don't play.", "Does she like it?",
    "Yesterday I read three pages.", "Last month the price went up.", "I am happy today.", "We are from Peru.",
    "An apple a day keeps the doctor away.", "My dog likes long walks.",
]

ERRORS = [
    ("Yesterday I goed to school.", [("past_irregular", "goed", "went")]),
    ("Last week I buyed a car.", [("past_irregular", "buyed", "bought")]),
    ("Yesterday he reads a book.", [("past_marker", "reads", "read")]),
    ("Last week she puts it there.", [("past_marker", "puts", "put")]),
    ("She like music.", [("third_person", "like", "likes")]),
    ("She don't like it.", [("third_person", "don't", "doesn't")]),
    ("I have a apple.", [("article", "a", "an")]),
    ("It is an university.", [("article", "an", "a")]),
]

COMBINED = [
    ("Yesterday she go to school and eated pizza.", {("past_marker", "go", "went"), ("past_irregular", "eated", "ate")},
     "Yesterday she went to school and ate pizza."),
    ("He like music and she play guitar.", {("third_person", "like", "likes"), ("third_person", "play", "plays")},
     "He likes music and she plays guitar."),
    ("I have a apple and a orange.", {("article", "a", "an")}, "I have an apple and an orange."),
]

# Real errors the rules do not cover. Honest silence, never a verdict.
OUT_OF_SCOPE = ["I am agree with you.", "He go to school every days and I am living here since 2010.",
                "My sister work in a office near of my house.", "I am boring in the class."]


@pytest.fixture(autouse=True)
def local(monkeypatch):
    monkeypatch.setenv("LINGUACHAT_PROVIDER", "local")
    conversation_memory.clear()
    yield
    conversation_memory.clear()


@pytest.mark.parametrize("sentence", VALID)
def test_valid_english_is_left_alone(sentence):
    result = assess(sentence)
    assert result["verdict"] != "error", (sentence, result["findings"])


def test_the_valid_corpus_has_zero_false_positives():
    flagged = [s for s in VALID if assess(s)["verdict"] == "error"]
    assert flagged == [], flagged
    assert len(VALID) >= 60


@pytest.mark.parametrize("sentence, expected", ERRORS)
def test_errors_are_found_exactly(sentence, expected):
    result = assess(sentence)
    assert [(f["rule"], f["original"], f["replacement"]) for f in result["findings"]] == expected


@pytest.mark.parametrize("sentence, expected, corrected", COMBINED)
def test_combined_errors_are_all_corrected(sentence, expected, corrected):
    result = assess(sentence)
    assert {(f["rule"], f["original"], f["replacement"]) for f in result["findings"]} == expected
    assert result["corrected"] == corrected


def test_a_correction_never_changes_a_word_into_itself_or_into_a_non_word():
    real_pasts = set(IRREGULAR_PAST.values()) | SAME_FORM_PAST
    for sentence, _ in ERRORS + [(s, None) for s, *_ in COMBINED]:
        for f in assess(sentence)["findings"]:
            assert f["replacement"].lower() != f["original"].lower(), (sentence, f)
            if f["rule"] in {"past_irregular", "past_marker"}:
                rep = f["replacement"].lower()
                assert rep in real_pasts or re.fullmatch(r"[a-z]+ed", rep) and not rep.startswith("read"), (sentence, f)


@pytest.mark.parametrize("sentence", OUT_OF_SCOPE)
def test_outside_the_rules_lingua_does_not_pretend(sentence):
    result = assess(sentence)
    if result["verdict"] == "error":
        # what it does find must still be a real error, not a guess about the rest
        assert all(f["confidence"] in {"high", "medium"} for f in result["findings"])
    else:
        assert result["verdict"] == "no_issue_detected" and result["confidence"] == "low"
    data = client.post("/chat", json={"session_id": "oos", "message": sentence, "level": "A1",
                                      "native_language": "es"}).json()
    text = " ".join(str(data.get(k) or "") for k in ("reply", "explanation", "suggestion")).lower()
    assert not re.search(r"\b(perfect|correct|no mistakes|well done|great job)\b", text), text


def test_each_explanation_names_the_forms_involved():
    data = client.post("/chat", json={"session_id": "names", "message": "Yesterday I buyed bread.", "level": "A1",
                                      "native_language": "en"}).json()
    assert "bought" in data["explanation"] and "buy" in data["explanation"]


# --- the learner's own language is noticed, English with look-alikes is not ---

@pytest.mark.parametrize("sentence, lang", [
    ("Hallo, wie geht es?", "de"), ("Ich habe heute keine Zeit.", "de"),
    ("Hola, ¿cómo estás?", "es"), ("Bonjour, comment ça va ?", "fr"), ("Olá, tudo bem?", "pt"),
])
def test_a_message_in_the_learners_language_is_not_judged_as_english(sentence, lang):
    assert assess(sentence, {"native_language": lang})["verdict"] == "not_english"


@pytest.mark.parametrize("sentence, lang", [
    ("I want to die laughing at the gut feeling.", "de"), ("Yesterday I was at home.", "de"),
    ("My mom has a pet named Mon.", "fr"), ("I like a good bien-être spa.", "fr"), ("Hola is a greeting.", "es"),
])
def test_english_with_look_alike_words_is_still_english(sentence, lang):
    assert assess(sentence, {"native_language": lang})["verdict"] != "not_english"
