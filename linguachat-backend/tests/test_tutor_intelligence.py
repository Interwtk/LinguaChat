"""The local tutor: corrections, explanations, strategy and language.

Synthetic learners, replayed with many verbs, sentences and languages so a pass
cannot depend on one hand-written example. These tests prove the engine is
consistent and honest about its limits; they do not prove that real learners
learn better (that needs a pilot).
"""
import re

import pytest
from fastapi.testclient import TestClient

from ai.grammar_check import IRREGULAR_PAST, analyze, corrected_sentence
from ai.tutor_i18n import MESSAGES, SUPPORTED, resolve_language
from app.services.memory import conversation_memory
from main import app

client = TestClient(app)
LANGS = list(SUPPORTED)
SCRIPT = {"ja": re.compile(r"[぀-ヿ一-鿿]"), "ar": re.compile(r"[؀-ۿ]")}
SPANISH_ONLY = re.compile(r"\b(Escribe|Usa una|Completa|Agrega|Intenta|pasado)\b")


@pytest.fixture(autouse=True)
def fresh_memory(monkeypatch):
    monkeypatch.setenv("LINGUACHAT_PROVIDER", "local")
    conversation_memory.clear()
    yield
    conversation_memory.clear()


def chat(message, *, lang="es", level="A1", session="s", **extra):
    response = client.post("/chat", json={"session_id": session, "message": message, "level": level,
                                          "native_language": lang, **extra})
    assert response.status_code == 200
    return response.json()


# --- the mandatory case -------------------------------------------------------

def test_yesterday_i_goed_to_school():
    data = chat("Yesterday I goed to school.")
    assert data["mode"] == "correction"
    assert data["correction"] == "Yesterday I went to school."
    assert "went" in data["explanation"] and "go" in data["explanation"] and "goed" in data["explanation"]
    assert "irregular" in data["explanation"]
    assert data["analysis"]["verdict"] == "error"
    assert data["analysis"]["findings"][0]["rule"] == "past_irregular"


# --- generalisation, not a list of sentences ----------------------------------

WRONG_PASTS = {
    "eated": "ate", "buyed": "bought", "thinked": "thought", "catched": "caught", "teached": "taught",
    "writed": "wrote", "drived": "drove", "swimmed": "swam", "runned": "ran", "sleeped": "slept",
    "bringed": "brought", "payed": "paid", "sayed": "said", "goed": "went", "wented": "went",
    "speaked": "spoke", "taked": "took", "maked": "made", "comed": "came", "knowed": "knew",
}


@pytest.mark.parametrize("wrong,past", sorted(WRONG_PASTS.items()))
@pytest.mark.parametrize("frame", ["Yesterday I {} a lot.", "We {} together last night.", "She {} it two days ago."])
def test_every_irregular_past_mistake_is_corrected(wrong, past, frame):
    findings = analyze(frame.format(wrong))
    assert [f.rule for f in findings][:1] == ["past_irregular"]
    assert findings[0].replacement == past
    assert corrected_sentence(frame.format(wrong), findings) == frame.format(past)


@pytest.mark.parametrize("sentence,expected", [
    ("Yesterday I go to the park.", "Yesterday I went to the park."),
    ("Last week we visit my grandma.", "Last week we visited my grandma."),
    ("Two days ago they are very tired.", "Two days ago they were very tired."),
    ("She like music.", "She likes music."),
    ("He watch TV every day.", "He watches TV every day."),
    ("My sister eat an banana.", None),
    ("I have a orange.", "I have an orange."),
    ("It is an university.", "It is a university."),
])
def test_other_rules(sentence, expected):
    findings = analyze(sentence)
    assert findings, sentence
    if expected:
        assert corrected_sentence(sentence, findings) == expected


# --- no false negatives on natural, valid English ----------------------------

VALID = [
    "Yesterday I went to school.", "I went to school yesterday.", "We ate pizza last night.",
    "She likes music.", "Does she like music?", "He doesn't like coffee.", "Let it go.",
    "I have an apple.", "It is a university.", "I waited an hour.", "They were tired two days ago.",
    "I seed the soil every spring.", "Can she swim?", "I want to go home.", "My friends play football.",
    "Last week I visited my grandma.", "I didn't go to school yesterday.", "Did you eat breakfast?",
    "He has a car.", "We usually walk to work.", "She can drive.", "It works now.",
    "I'm happy today.", "How are you?", "I would like a coffee, please.", "They study English.",
    "An honest answer is best.", "I bought a new phone.", "He wrote a letter.", "We swam in the lake.",
]


@pytest.mark.parametrize("sentence", VALID)
def test_valid_sentences_get_no_correction(sentence):
    assert analyze(sentence) == []
    data = chat(sentence, session="valid-" + str(abs(hash(sentence))))
    assert data["correction"] is None
    # No rule fired: that is NOT a verdict of correctness, and it is never sold as one.
    assert data["analysis"]["verdict"] in {"no_issue_detected", "insufficient"}
    assert data["analysis"]["confidence"] in {"low", "high"}
    assert not re.search(r"\b(correct|perfect|no mistakes)\b", data["reply"], re.I)


# --- strategy changes when an explanation does not work ----------------------

def test_strategy_escalates_then_recovers():
    seen = []
    for message in ["Yesterday I goed to school.", "Last week I eated pizza.", "Yesterday we runned home."]:
        data = chat(message, session="escalate")
        seen.append(data["analysis"]["strategy"])
    assert seen == ["brief_explanation", "contrast_example", "guided_retrieval"]
    last = data
    assert last["learning_action"]["type"] == "fill_blank"
    assert last["learning_action"]["expected"] == "ran"
    # Retrieval in a NEW sentence: neither the learner's nor the corrected one.
    assert "We ran home" not in last["learning_action"]["prompt"]
    assert "____" in last["learning_action"]["prompt"]
    assert "✗" in last["explanation"], "the contrast stays available"
    # Once the error stops recurring, the window clears and the light touch returns.
    for i in range(8):
        chat("I like my school.", session="escalate")
    assert chat("Yesterday I buyed bread.", session="escalate")["analysis"]["strategy"] == "brief_explanation"


def test_a_detailed_preference_starts_with_contrast():
    data = chat("She like music.", session="pref", tutor_preferences={"explanation_depth": "detailed"})
    assert data["analysis"]["strategy"] == "contrast_example"


def test_the_level_shapes_the_reply_not_the_correction():
    a1 = chat("Yesterday I goed to school.", level="A1", session="lv1")
    c1 = chat("Yesterday I goed to school.", level="C1", session="lv2")
    assert a1["correction"] == c1["correction"] == "Yesterday I went to school."
    assert a1["reply"] != c1["reply"]


# --- the learner's language, explicitly --------------------------------------

@pytest.mark.parametrize("lang", LANGS)
def test_explanations_follow_the_learner_language(lang):
    data = chat("Yesterday I goed to school.", lang=lang, session="lang-" + lang)
    assert data["analysis"]["language"] == lang
    text = " ".join(str(data[k] or "") for k in ("explanation", "suggestion", "focus")) + data["learning_action"]["prompt"]
    assert "went" in data["explanation"], "the English form itself is never translated"
    if lang in SCRIPT:
        assert SCRIPT[lang].search(text), f"{lang} text is in its own script"
    if lang != "es":
        assert not SPANISH_ONLY.search(text), f"no Spanish leaks into {lang}"
    assert data["reply"].startswith("Almost!"), "Lingua's own line stays in English, the practised language"


def test_switching_language_mid_session():
    es = chat("Yesterday I goed to school.", lang="es", session="switch")
    ja = chat("Last week I eated pizza.", lang="ja", session="switch")
    assert es["analysis"]["language"] == "es" and ja["analysis"]["language"] == "ja"
    assert SCRIPT["ja"].search(ja["explanation"]) and not SPANISH_ONLY.search(ja["explanation"])


def test_unsupported_language_is_english_and_says_so():
    assert resolve_language("ko") == ("en", False)
    assert resolve_language({"code": "ar-EG", "base": "ar"}) == ("ar", True)
    data = chat("Yesterday I goed to school.", lang="ko", session="ko")
    assert data["analysis"]["language"] == "en"


def test_every_message_exists_in_all_eight_languages():
    for key, table in MESSAGES.items():
        assert set(table) == set(SUPPORTED), key
        placeholders = set(re.findall(r"{(\w+)}", table["en"]))
        for lang, text in table.items():
            assert set(re.findall(r"{(\w+)}", text)) == placeholders, (key, lang)


def test_a_message_in_the_learners_own_language_is_noticed():
    for lang, message in [("es", "hola quiero aprender ingles"), ("ja", "こんにちは、英語を勉強したい"),
                          ("ar", "مرحبا أريد أن أتعلم"), ("fr", "je ne sais pas comment le dire")]:
        data = chat(message, lang=lang, session="own-" + lang)
        assert data["analysis"]["verdict"] == "not_english", lang
        assert data["correction"] is None


# --- ambiguity and missing information --------------------------------------

@pytest.mark.parametrize("message", ["ok", "???", "school", "...", "x"])
def test_too_little_to_judge_is_said_plainly(message):
    data = chat(message, session="amb-" + message)
    assert data["correction"] is None
    assert data["analysis"]["verdict"] == "insufficient"


def test_typing_back_the_correction_is_not_praised_as_mastery():
    chat("Yesterday I goed to school.", session="copy")
    data = chat("Yesterday I went to school.", session="copy")
    assert data["correction"] is None
    assert data["analysis"]["verdict"] == "no_issue_detected"
    assert data["analysis"]["confidence"] == "low"


# --- one tutor ----------------------------------------------------------------

@pytest.mark.parametrize("companion", ["lingo", "chatto", "Chatto", "LINGO", None])
def test_only_lingua_answers(companion):
    payload = {"active_companion": companion} if companion else {}
    data = chat("Yesterday I goed to school.", session="who", **payload)
    text = " ".join(str(data.get(k) or "") for k in ("reply", "explanation", "suggestion", "focus"))
    assert "Lingo" not in text and "Chatto" not in text
    assert chat("who are you", session="who2", **payload)["reply"].startswith("I'm Lingua")


def test_memory_keeps_rule_ids_not_words():
    chat("Yesterday I goed to school.", session="priv")
    stored = conversation_memory.get("priv")[-1]
    assert stored["error_types"] == ["past_irregular"]
    assert conversation_memory.recent_error_types("priv") == ["past_irregular"]
