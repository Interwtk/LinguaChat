"""Tests for the isolated LinguaLoop evaluation endpoint and evaluator.

No real OpenAI calls: the remote path is monkeypatched. Every test is
deterministic. Also guards that /chat, mission_context and mission_feedback keep
working (no regression from adding /learning/evaluate).
"""
import pytest
from fastapi.testclient import TestClient

import ai.evaluator as evaluator
from ai.evaluator import evaluate_deterministic, validate_remote
from main import app


client = TestClient(app)


@pytest.fixture(autouse=True)
def default_env(monkeypatch):
    # OpenAI OFF by default → deterministic path unless a test opts in.
    monkeypatch.setenv("OPENAI_ENABLED", "false")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)


def _payload(**kw):
    base = {
        "expected_intent": "introduction",
        "step_type": "free_reply",
        "learner_response": "",
        "learner_name": "Sebastian",
        "native_language": "es",
        "scaffold_level": "medium",
    }
    base.update(kw)
    return base


# ---------- deterministic path (OpenAI disabled) ----------
@pytest.mark.parametrize("text", [
    "Hi, I'm Sebastian.", "I'm Sebastian.", "My name is Sebastian.",
    "People call me Sebastian.", "Hello, I go by Sebastian.",
])
def test_intro_accepts_variants(text):
    r = evaluate_deterministic(_payload(learner_response=text))
    assert r["completed_objective"] is True
    assert r["retry_required"] is False
    assert r["error_type"] is None


@pytest.mark.parametrize("text,err", [
    ("Sebastian", "missing_copula"),
    ("Hi", "greeting_only"),
    ("I'm", "missing_name"),
    ("", "empty"),
])
def test_intro_rejects_pedagogically(text, err):
    r = evaluate_deterministic(_payload(learner_response=text))
    assert r["completed_objective"] is False
    assert r["retry_required"] is True
    assert r["error_type"] == err
    assert r["natural_version"]


def test_ask_name_accept_and_reject():
    assert evaluate_deterministic(_payload(expected_intent="ask_name", learner_response="What's your name?"))["completed_objective"] is True
    assert evaluate_deterministic(_payload(expected_intent="ask_name", learner_response="May I ask your name?"))["completed_objective"] is True
    assert evaluate_deterministic(_payload(expected_intent="ask_name", learner_response="Your name?"))["completed_objective"] is False
    assert evaluate_deterministic(_payload(expected_intent="ask_name", learner_response="How are you?"))["completed_objective"] is False


def test_nice_to_meet_turn_context():
    as_response = _payload(expected_intent="nice_to_meet", learner_response="You too.",
                           turn_context={"lingua_said": "Nice to meet you!"})
    assert evaluate_deterministic(as_response)["completed_objective"] is True
    as_opener = _payload(expected_intent="nice_to_meet", learner_response="You too.",
                         turn_context={"lingua_said": "Hi there"})
    assert evaluate_deterministic(as_opener)["completed_objective"] is False
    assert evaluate_deterministic(_payload(expected_intent="nice_to_meet", learner_response="Nice meeting you."))["completed_objective"] is True


# ---------- remote validation ----------
def test_validate_remote_rejects_contradictions():
    assert validate_remote({"completed_objective": True, "retry_required": True}) is None
    assert validate_remote({"completed_objective": False, "retry_required": False}) is None
    assert validate_remote({"completed_objective": "yes"}) is None
    assert validate_remote({"completed_objective": True, "natural_version": "x" * 200}) is None
    ok = validate_remote({"completed_objective": True, "retry_required": False, "confidence": 0.9})
    assert ok and ok["completed_objective"] is True and ok["source"] == "remote"


def test_validate_remote_clamps_bad_confidence_and_error():
    ok = validate_remote({"completed_objective": False, "retry_required": True,
                          "confidence": "nan", "error_type": "totally_made_up"})
    assert ok["confidence"] == 0.75
    assert ok["error_type"] == "unclear"


# ---------- OpenAI path (mocked, never real) ----------
def _enable_openai(monkeypatch):
    monkeypatch.setenv("OPENAI_ENABLED", "true")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")


def test_remote_accept_overrides_local_reject(monkeypatch):
    _enable_openai(monkeypatch)
    # a natural variant the deterministic evaluator would not confirm
    monkeypatch.setattr(evaluator, "evaluate_with_openai", lambda payload: {
        "understood": True, "completed_objective": True, "accepted_variant": True,
        "confidence": 0.88, "retry_required": False, "natural_version": "Hi, I'm Sebastian.",
    })
    r = evaluator.evaluate_episode_response(_payload(learner_response="Sebastián here, hello!"))
    assert r.completed_objective is True
    assert r.source == "remote"


def test_remote_invalid_json_falls_back(monkeypatch):
    _enable_openai(monkeypatch)
    monkeypatch.setattr(evaluator, "evaluate_with_openai",
                        lambda payload: {"completed_objective": "maybe"})  # invalid
    r = evaluator.evaluate_episode_response(_payload(learner_response="Sebastian"))
    assert r.source == "fallback"
    assert r.completed_objective is False  # deterministic verdict for bare name


def test_remote_timeout_falls_back(monkeypatch):
    _enable_openai(monkeypatch)
    def boom(payload):
        raise TimeoutError("simulated timeout")
    monkeypatch.setattr(evaluator, "evaluate_with_openai", boom)
    r = evaluator.evaluate_episode_response(_payload(learner_response="Hi, I'm Sebastian."))
    assert r.source == "fallback"
    assert r.completed_objective is True  # deterministic still accepts a clear answer


# ---------- endpoint ----------
def test_endpoint_returns_contract():
    res = client.post("/learning/evaluate", json=_payload(learner_response="Hi, I'm Sebastian."))
    assert res.status_code == 200
    body = res.json()
    for key in ["understood", "completed_objective", "accepted_variant", "confidence",
                "error_type", "natural_version", "retry_required", "retry_prompt", "source"]:
        assert key in body
    assert body["completed_objective"] is True
    assert body["retry_required"] is False


def test_endpoint_consistency_reject():
    res = client.post("/learning/evaluate", json=_payload(learner_response="Sebastian"))
    body = res.json()
    assert body["completed_objective"] is False
    assert body["retry_required"] is True
    # never both
    assert not (body["completed_objective"] and body["retry_required"])


def test_endpoint_empty_response_is_safe():
    res = client.post("/learning/evaluate", json=_payload(learner_response=""))
    assert res.status_code == 200
    assert res.json()["error_type"] == "empty"


def test_remote_missing_fields_falls_back(monkeypatch):
    _enable_openai(monkeypatch)
    # a truncated/incomplete verdict: no completed_objective at all
    monkeypatch.setattr(evaluator, "evaluate_with_openai", lambda payload: {"understood": True})
    r = evaluator.evaluate_episode_response(_payload(learner_response="Sebastian"))
    assert r.source == "fallback"
    assert r.retry_required is True


def test_remote_empty_response_falls_back(monkeypatch):
    _enable_openai(monkeypatch)
    for empty in ({}, None, [], ""):
        monkeypatch.setattr(evaluator, "evaluate_with_openai", lambda payload, e=empty: e)
        r = evaluator.evaluate_episode_response(_payload(learner_response="Sebastian"))
        assert r.source == "fallback"


def test_remote_server_error_falls_back(monkeypatch):
    _enable_openai(monkeypatch)
    def boom(payload):
        raise RuntimeError("500 Internal Server Error")
    monkeypatch.setattr(evaluator, "evaluate_with_openai", boom)
    r = evaluator.evaluate_episode_response(_payload(learner_response="Hi, I'm Sebastian."))
    assert r.source == "fallback"
    assert r.completed_objective is True


@pytest.mark.parametrize("native", ["es", "pt", "fr", "it", "de", "ja", "ar", "en"])
def test_native_language_does_not_change_the_verdict(native):
    """Explanations are localized elsewhere; the verdict must be language-agnostic."""
    accepted = client.post("/learning/evaluate", json=_payload(
        learner_response="Hi, I'm Sebastian.", native_language=native)).json()
    rejected = client.post("/learning/evaluate", json=_payload(
        learner_response="Sebastian", native_language=native)).json()
    assert accepted["completed_objective"] is True
    assert rejected["completed_objective"] is False


@pytest.mark.parametrize("target", ["en", None, "es"])
def test_target_language_stays_english(target):
    """target_language is accepted but English remains the taught language."""
    body = client.post("/learning/evaluate", json=_payload(
        learner_response="Hi, I'm Sebastian.", target_language=target)).json()
    assert body["completed_objective"] is True
    assert body["natural_version"].startswith("Hi, I'm ")


def test_only_one_priority_error_is_reported():
    # "Hi" is missing both the copula and the name; only ONE error is surfaced.
    body = client.post("/learning/evaluate", json=_payload(learner_response="Hi")).json()
    assert isinstance(body["error_type"], str)
    assert body["error_type"] == "greeting_only"
    assert body["retry_required"] is True


def test_turn_context_is_optional_and_safe():
    for ctx in (None, {}, {"lingua_said": None}):
        res = client.post("/learning/evaluate", json=_payload(
            expected_intent="nice_to_meet", learner_response="Nice to meet you.", turn_context=ctx))
        assert res.status_code == 200
        assert res.json()["completed_objective"] is True


def test_unknown_step_type_is_not_judged():
    body = client.post("/learning/evaluate", json=_payload(
        expected_intent="something_new", learner_response="hello there")).json()
    assert body["completed_objective"] is False
    assert body["error_type"] == "unclear"
    assert body["understood"] is False


def test_oversized_response_is_rejected_by_validation():
    res = client.post("/learning/evaluate", json=_payload(learner_response="x" * 600))
    assert res.status_code == 422  # max_length guard on the request model


# ---------- second Pre-A1 arc: wellbeing, origin, full conversation ----------
@pytest.mark.parametrize("text", [
    "How are you?", "How are you doing?", "How're you?", "And how are you?",
])
def test_ask_wellbeing_accepts_variants(text):
    r = evaluate_deterministic(_payload(expected_intent="ask_wellbeing", learner_response=text))
    assert r["completed_objective"] is True


@pytest.mark.parametrize("text", [
    "I'm good.", "I'm fine.", "I'm okay.", "I'm tired.", "Good, thanks.", "Fine, thank you.", "I am well.",
])
def test_answer_wellbeing_accepts_any_feeling(text):
    """A feeling is never wrong — only a missing structure is corrected."""
    r = evaluate_deterministic(_payload(expected_intent="answer_wellbeing", learner_response=text))
    assert r["completed_objective"] is True
    assert r["error_type"] is None


def test_wellbeing_incomplete_gets_one_priority_error():
    no_aux = evaluate_deterministic(_payload(expected_intent="ask_wellbeing", learner_response="How you?"))
    assert no_aux["completed_objective"] is False
    assert no_aux["error_type"] == "missing_auxiliary"
    bare = evaluate_deterministic(_payload(expected_intent="answer_wellbeing", learner_response="good"))
    assert bare["completed_objective"] is False
    assert bare["error_type"] == "missing_copula"
    assert bare["natural_version"] == "I'm good."


@pytest.mark.parametrize("text", ["And you?", "What about you?", "How about you?", "And yourself?"])
def test_reciprocal_question(text):
    assert evaluate_deterministic(_payload(expected_intent="reciprocal_question", learner_response=text))["completed_objective"] is True


@pytest.mark.parametrize("text", ["Where are you from?", "And where are you from?", "What country are you from?"])
def test_ask_origin_accepts_variants(text):
    assert evaluate_deterministic(_payload(expected_intent="ask_origin", learner_response=text))["completed_objective"] is True


def test_ask_origin_missing_auxiliary_is_recognised():
    r = evaluate_deterministic(_payload(expected_intent="ask_origin", learner_response="Where you from?"))
    assert r["completed_objective"] is False
    assert r["error_type"] == "missing_auxiliary"
    assert r["natural_version"] == "Where are you from?"


@pytest.mark.parametrize("text", [
    "I'm from Colombia.", "I am from Colombia.", "I'm from Bogotá.", "I'm from Tokyo.", "I'm from the north of Spain.",
])
def test_answer_origin_accepts_any_place(text):
    """Countries, cities and regions are all valid — no geographic judgement."""
    r = evaluate_deterministic(_payload(expected_intent="answer_origin", learner_response=text))
    assert r["completed_objective"] is True


def test_bare_place_is_partial_evidence_not_a_failure():
    r = evaluate_deterministic(_payload(expected_intent="answer_origin", learner_response="Colombia", learner_place="Colombia"))
    assert r["completed_objective"] is False
    assert r["error_type"] == "missing_from"
    assert r["natural_version"] == "I'm from Colombia."


@pytest.mark.parametrize("place,expected", [
    ("Nairobi", "I'm from Nairobi."),
    ("Osaka", "I'm from Osaka."),
    ("", "I'm from Colombia."),   # neutral fallback only when nothing is known
])
def test_origin_model_answer_follows_the_learner_place(place, expected):
    """When the answer names no place, fall back to the one given earlier."""
    r = evaluate_deterministic(_payload(
        expected_intent="answer_origin",
        learner_response="this sentence names no place at all",
        learner_place=place))
    assert r["natural_version"] == expected


@pytest.mark.parametrize("answer,expected", [
    ("Colombia.", "I'm from Colombia."),
    ("I'm Osaka", "I'm from Osaka."),
    ("From Cairo", "I'm from Cairo."),
    ("Bogotá", "I'm from Bogotá."),
])
def test_origin_model_answer_echoes_the_place_just_named(answer, expected):
    """A nudge must repeat the learner's own place, never swap in another one."""
    r = evaluate_deterministic(_payload(
        expected_intent="answer_origin", learner_response=answer, learner_place="Lima"))
    assert r["completed_objective"] is False
    assert r["natural_version"] == expected


def test_full_conversation_turn():
    good = evaluate_deterministic(_payload(expected_intent="full_intro_conversation", learner_response="Hi, I'm Sebastian. How are you?"))
    assert good["completed_objective"] is True
    only_intro = evaluate_deterministic(_payload(expected_intent="full_intro_conversation", learner_response="Hi, I'm Sebastian."))
    assert only_intro["completed_objective"] is False
    assert only_intro["error_type"] == "incomplete_turn"


def test_new_intents_work_through_the_endpoint_without_openai():
    """The whole second arc must be completable with OpenAI disabled."""
    for intent, text in [
        ("ask_wellbeing", "How are you?"),
        ("answer_wellbeing", "I'm tired."),
        ("reciprocal_question", "And you?"),
        ("ask_origin", "Where are you from?"),
        ("answer_origin", "I'm from Lima."),
        ("full_intro_conversation", "Hi, I'm Sebastian. Where are you from?"),
    ]:
        res = client.post("/learning/evaluate", json=_payload(expected_intent=intent, learner_response=text))
        assert res.status_code == 200, intent
        body = res.json()
        assert body["completed_objective"] is True, f"{intent} rejected {text!r}"
        assert body["source"] == "deterministic"


def test_first_arc_intents_still_work():
    """No regression on the original three episodes."""
    for intent, text in [
        ("introduction", "Hi, I'm Sebastian."),
        ("ask_name", "What's your name?"),
        ("nice_to_meet", "Nice to meet you."),
    ]:
        r = evaluate_deterministic(_payload(expected_intent=intent, learner_response=text))
        assert r["completed_objective"] is True, intent


# ---------- third Pre-A1 arc: preferences, wants, needs, plans ----------
@pytest.mark.parametrize("text", [
    "I like music.", "I really like music.", "I like games.", "Music is good. I like it.",
])
def test_express_like_accepts_variants(text):
    assert evaluate_deterministic(_payload(expected_intent="express_like", learner_response=text))["completed_objective"] is True


@pytest.mark.parametrize("text", ["Music.", "I music.", "Like music."])
def test_express_like_partial_is_guided_not_failed(text):
    r = evaluate_deterministic(_payload(expected_intent="express_like", learner_response=text))
    assert r["completed_objective"] is False
    assert r["natural_version"]
    assert r["retry_required"] is True


def test_a_preference_is_never_wrong():
    """Saying you do NOT like something still satisfies the step."""
    r = evaluate_deterministic(_payload(expected_intent="express_like", learner_response="I don't like coffee."))
    assert r["completed_objective"] is True


@pytest.mark.parametrize("text", ["I don't like coffee.", "I do not like coffee.", "I don't really like coffee."])
def test_express_dislike(text):
    assert evaluate_deterministic(_payload(expected_intent="express_dislike", learner_response=text))["completed_objective"] is True


@pytest.mark.parametrize("text", ["What do you like?", "Do you like music?", "What music do you like?"])
def test_ask_preference_accepts_variants(text):
    assert evaluate_deterministic(_payload(expected_intent="ask_preference", learner_response=text))["completed_objective"] is True


@pytest.mark.parametrize("text", ["What you like?", "You like music?"])
def test_ask_preference_missing_auxiliary(text):
    r = evaluate_deterministic(_payload(expected_intent="ask_preference", learner_response=text))
    assert r["completed_objective"] is False
    assert r["error_type"] == "missing_auxiliary"
    assert r["natural_version"] == "What do you like?"


@pytest.mark.parametrize("text", ["Yes, I do.", "No, I don't.", "Yes.", "No."])
def test_yes_no_preference(text):
    assert evaluate_deterministic(_payload(expected_intent="yes_no_preference", learner_response=text))["completed_objective"] is True


@pytest.mark.parametrize("text", ["I want water.", "I'd like water.", "I want coffee."])
def test_express_want(text):
    assert evaluate_deterministic(_payload(expected_intent="express_want", learner_response=text))["completed_objective"] is True


def test_polite_short_request_is_partial_evidence():
    r = evaluate_deterministic(_payload(expected_intent="express_want", learner_response="Water, please."))
    assert r["completed_objective"] is False
    assert r["error_type"] == "missing_verb"


@pytest.mark.parametrize("text", ["I need help.", "I need water.", "I need a break."])
def test_express_need(text):
    assert evaluate_deterministic(_payload(expected_intent="express_need", learner_response=text))["completed_objective"] is True


def test_want_and_need_are_not_a_serious_error():
    """The request is understood either way; do not fail it over the verb."""
    assert evaluate_deterministic(_payload(expected_intent="express_want", learner_response="I need water."))["completed_objective"] is True
    assert evaluate_deterministic(_payload(expected_intent="express_need", learner_response="I want help."))["completed_objective"] is True


@pytest.mark.parametrize("text", ["Do you want water?", "Would you like coffee?"])
def test_ask_want(text):
    assert evaluate_deterministic(_payload(expected_intent="ask_want", learner_response=text))["completed_objective"] is True


@pytest.mark.parametrize("intent,text", [
    ("accept_offer", "Yes, please."), ("accept_offer", "Sure."),
    ("decline_offer", "No, thank you."), ("decline_offer", "Maybe later."),
    ("accept_offer", "No, thank you."),      # declining is still a valid reply
])
def test_offer_replies(intent, text):
    assert evaluate_deterministic(_payload(expected_intent=intent, learner_response=text))["completed_objective"] is True


def test_simple_plan_conversation():
    good = evaluate_deterministic(_payload(expected_intent="simple_plan_conversation",
                                           learner_response="I like music. Do you want to listen to music?"))
    assert good["completed_objective"] is True
    half = evaluate_deterministic(_payload(expected_intent="simple_plan_conversation", learner_response="I like music."))
    assert half["completed_objective"] is False
    assert half["error_type"] == "incomplete_turn"


@pytest.mark.parametrize("noun,activity,expected", [
    ("traveling", "plan a trip", "I like traveling. Do you want to plan a trip?"),
    ("games", "play a game", "I like games. Do you want to play a game?"),
    # no activity supplied → the neutral proposal, never a wrong one
    ("music", "", "I like music. Do you want to listen to music?"),
    ("", "", "I like music. Do you want to listen to music?"),
])
def test_plan_model_answer_proposes_this_episode_s_activity(noun, activity, expected):
    """A trip episode must not model "Do you want to listen to music?"."""
    r = evaluate_deterministic(_payload(
        expected_intent="simple_plan_conversation", learner_response="Music.",
        target_noun=noun, target_activity=activity,
    ))
    assert r["completed_objective"] is False
    assert r["natural_version"] == expected


def test_plan_activity_travels_through_the_endpoint():
    res = client.post("/learning/evaluate", json={
        "expected_intent": "simple_plan_conversation", "learner_response": "Music.",
        "target_noun": "traveling", "target_activity": "plan a trip",
    })
    assert res.status_code == 200
    assert res.json()["natural_version"] == "I like traveling. Do you want to plan a trip?"


def test_plan_activity_is_bounded_and_optional():
    """An oversized or missing activity must never reach the model answer."""
    res = client.post("/learning/evaluate", json={
        "expected_intent": "simple_plan_conversation", "learner_response": "Music.",
        "target_activity": "x" * 200,
    })
    assert res.status_code == 422           # rejected by the schema, not rendered
    res_ok = client.post("/learning/evaluate", json={
        "expected_intent": "simple_plan_conversation", "learner_response": "Music.",
    })
    assert res_ok.status_code == 200
    assert "listen to music" in res_ok.json()["natural_version"]


@pytest.mark.parametrize("noun,expected", [
    ("games", "I like games."),
    ("movies", "I like movies."),
    ("", "I like music."),      # neutral default when no interest is active
])
def test_interest_context_shapes_the_model_answer(noun, expected):
    """Personalization changes the subject matter, never the objective."""
    r = evaluate_deterministic(_payload(expected_intent="express_like", learner_response="music", target_noun=noun))
    assert r["completed_objective"] is False
    assert r["natural_version"] == expected


def test_third_arc_intents_work_through_the_endpoint_without_openai():
    for intent, text in [
        ("express_like", "I like music."), ("express_dislike", "I don't like coffee."),
        ("ask_preference", "What do you like?"), ("yes_no_preference", "Yes, I do."),
        ("express_want", "I want water."), ("express_need", "I need help."),
        ("ask_want", "Do you want water?"), ("accept_offer", "Yes, please."),
        ("decline_offer", "No, thank you."),
        ("simple_plan_conversation", "I like music. Do you want to listen to music?"),
    ]:
        res = client.post("/learning/evaluate", json=_payload(expected_intent=intent, learner_response=text))
        assert res.status_code == 200, intent
        body = res.json()
        assert body["completed_objective"] is True, f"{intent} rejected {text!r}"
        assert body["source"] == "deterministic"


@pytest.mark.parametrize("intent", [
    "express_like", "express_dislike", "ask_preference", "yes_no_preference",
    "express_want", "express_need", "ask_want", "accept_offer", "decline_offer",
    "simple_plan_conversation",
])
def test_third_arc_empty_replies_are_safe(intent):
    r = evaluate_deterministic(_payload(expected_intent=intent, learner_response=""))
    assert r["completed_objective"] is False
    assert r["error_type"] == "empty"


def test_third_arc_falls_back_when_remote_is_broken(monkeypatch):
    _enable_openai(monkeypatch)
    monkeypatch.setattr(evaluator, "evaluate_with_openai", lambda payload: {"completed_objective": "maybe"})
    r = evaluator.evaluate_episode_response(_payload(expected_intent="express_like", learner_response="I like music."))
    assert r.source == "fallback"
    assert r.completed_objective is True     # the deterministic verdict still stands


# ---------- fourth arc: the cafe ----------
CAFE_INTENTS = [
    "polite_request", "thank_service", "respond_anything_else",
    "finish_order", "cafe_order_conversation",
]


@pytest.mark.parametrize("text", [
    "Can I have water, please?",
    "Can I have a coffee, please?",
    "Could I have tea, please?",
    "May I have juice, please?",
    "I would like a tea, please.",
    "Can I have water?",              # no "please": less warm, still the frame
])
def test_polite_request_accepts_the_taught_frame(text):
    r = evaluate_deterministic(_payload(expected_intent="polite_request", learner_response=text))
    assert r["completed_objective"] is True, text


def test_water_please_is_understood_but_not_yet_the_structure():
    """The learner was polite and clear. That is not a failure — it is a step."""
    r = evaluate_deterministic(_payload(expected_intent="polite_request", learner_response="Water, please."))
    assert r["understood"] is True
    assert r["completed_objective"] is False
    assert r["error_type"] == "missing_request_form"


def test_i_want_water_is_a_register_note_not_a_mistake():
    """Episode 8's structure is correct English; in a cafe it is simply blunt."""
    r = evaluate_deterministic(_payload(expected_intent="polite_request", learner_response="I want water."))
    assert r["understood"] is True
    assert r["completed_objective"] is False
    assert r["error_type"] == "previous_structure"


def test_a_request_frame_with_nothing_in_it():
    r = evaluate_deterministic(_payload(expected_intent="polite_request", learner_response="Can I have, please?"))
    assert r["completed_objective"] is False
    assert r["error_type"] == "missing_request_object"


@pytest.mark.parametrize("thing,expected", [
    ("tea", "Can I have tea, please?"),
    ("coffee", "Can I have coffee, please?"),
    ("", "Can I have water, please?"),     # neutral default, never a placeholder
])
def test_the_model_answer_names_what_the_prompt_named(thing, expected):
    r = evaluate_deterministic(_payload(expected_intent="polite_request",
                                        learner_response="hmm", target_thing=thing))
    assert r["natural_version"] == expected


def test_target_thing_never_leaks_into_a_want_or_a_preference():
    """An orderable thing belongs to the cafe intents, not to every sentence."""
    like = evaluate_deterministic(_payload(expected_intent="express_like",
                                           learner_response="hmm", target_thing="tea", target_noun="music"))
    assert like["natural_version"] == "I like music."
    want = evaluate_deterministic(_payload(expected_intent="express_want",
                                           learner_response="hmm", target_thing="tea"))
    assert want["natural_version"] == "I want water."


@pytest.mark.parametrize("text", ["Yes, please.", "No, thank you.", "That’s all, thanks.", "Can I have tea, please?"])
def test_anything_else_accepts_both_endings(text):
    r = evaluate_deterministic(_payload(expected_intent="respond_anything_else", learner_response=text))
    assert r["completed_objective"] is True, text


@pytest.mark.parametrize("text", ["Yes", "No", "yeah", "nope"])
def test_a_bare_yes_or_no_is_understood_but_incomplete(text):
    r = evaluate_deterministic(_payload(expected_intent="respond_anything_else", learner_response=text))
    assert r["understood"] is True, "it does answer the question"
    assert r["completed_objective"] is False
    assert r["error_type"] == "incomplete_politeness"


@pytest.mark.parametrize("text", ["That’s all, thanks.", "That is all, thank you.", "Nothing else, thanks.", "No, thank you."])
def test_closing_an_order(text):
    r = evaluate_deterministic(_payload(expected_intent="finish_order", learner_response=text))
    assert r["completed_objective"] is True, text


@pytest.mark.parametrize("text", ["Thank you.", "Thanks!", "Thank you very much."])
def test_thanking_whoever_served_you(text):
    r = evaluate_deterministic(_payload(expected_intent="thank_service", learner_response=text))
    assert r["completed_objective"] is True, text


def test_thank_service_needs_actual_thanks():
    r = evaluate_deterministic(_payload(expected_intent="thank_service", learner_response="ok"))
    assert r["completed_objective"] is False
    assert r["error_type"] == "no_thanks"


def test_the_whole_order_needs_both_halves():
    full = evaluate_deterministic(_payload(expected_intent="cafe_order_conversation",
                                           learner_response="Can I have tea, please? That’s all, thanks."))
    assert full["completed_objective"] is True
    half = evaluate_deterministic(_payload(expected_intent="cafe_order_conversation",
                                           learner_response="Can I have tea?"))
    assert half["completed_objective"] is False
    assert half["error_type"] == "incomplete_turn"
    none = evaluate_deterministic(_payload(expected_intent="cafe_order_conversation",
                                           learner_response="Hello there!"))
    assert none["error_type"] == "no_order"


def test_fourth_arc_intents_work_through_the_endpoint_without_openai():
    for intent, text in [
        ("polite_request", "Can I have water, please?"),
        ("thank_service", "Thank you."),
        ("respond_anything_else", "No, thank you."),
        ("finish_order", "That’s all, thanks."),
        ("cafe_order_conversation", "Can I have water, please? That’s all, thanks."),
    ]:
        res = client.post("/learning/evaluate", json=_payload(expected_intent=intent, learner_response=text))
        assert res.status_code == 200, intent
        body = res.json()
        assert body["completed_objective"] is True, f"{intent} rejected {text!r}"
        assert body["source"] == "deterministic"


@pytest.mark.parametrize("intent", CAFE_INTENTS)
def test_fourth_arc_empty_replies_are_safe(intent):
    r = evaluate_deterministic(_payload(expected_intent=intent, learner_response=""))
    assert r["completed_objective"] is False
    assert r["error_type"] == "empty"


@pytest.mark.parametrize("intent", CAFE_INTENTS)
def test_fourth_arc_never_returns_a_contradiction(intent):
    """Success and "try again" can never both be true, whatever comes in."""
    for text in ["", "???", "Can I have water, please?", "I want water.", "yes", "aaaaaaa"]:
        r = evaluate_deterministic(_payload(expected_intent=intent, learner_response=text))
        assert not (r["completed_objective"] and r["retry_required"]), (intent, text)
        assert r["natural_version"], (intent, text)


def test_a_cafe_answer_survives_a_broken_remote(monkeypatch):
    _enable_openai(monkeypatch)
    monkeypatch.setattr(evaluator, "evaluate_with_openai", lambda payload: {"completed_objective": "maybe"})
    r = evaluator.evaluate_episode_response(_payload(expected_intent="polite_request",
                                                     learner_response="Can I have water, please?"))
    assert r.source == "fallback"
    assert r.completed_objective is True     # the deterministic verdict still stands


def test_target_thing_is_bounded_and_optional():
    res = client.post("/learning/evaluate", json=_payload(expected_intent="polite_request",
                                                          learner_response="Can I have water, please?",
                                                          target_thing="x" * 200))
    assert res.status_code == 422, "an unbounded field is an injection surface"
    res_ok = client.post("/learning/evaluate", json=_payload(expected_intent="polite_request",
                                                             learner_response="Can I have water, please?"))
    assert res_ok.status_code == 200


# ---------- no regression on /chat, mission, translation ----------
def test_chat_still_works():
    res = client.post("/chat", json={"message": "hello", "level": "A1"})
    assert res.status_code == 200
    assert "reply" in res.json()


def test_mission_feedback_still_works():
    res = client.post("/chat", json={
        "message": "I'm Sebastian.", "level": "A1",
        "mission_context": {"step_type": "answer_question", "expected_pattern": "i'm",
                            "prompt": "Introduce yourself.", "target_skill": "intro"},
    })
    assert res.status_code == 200
    assert res.json().get("mission_feedback") is not None


# ---------- optional memory context on /chat ----------
def test_chat_accepts_a_small_remembered_topic():
    """Lingua may be told one short thing the learner mentioned before."""
    res = client.post("/chat", json={
        "message": "hello", "level": "A1",
        "optional_context": {"remembered_like": "music"},
    })
    assert res.status_code == 200
    assert "reply" in res.json()


def test_chat_works_without_any_context():
    res = client.post("/chat", json={"message": "hello", "level": "A1"})
    assert res.status_code == 200
    assert "reply" in res.json()


def test_optional_context_keeps_only_what_it_understands():
    """A client cannot smuggle a profile, a score or past answers through it."""
    from app.routes.chat import _safe_optional_context

    kept = _safe_optional_context({
        "remembered_like": "  music  ",
        "mastery": {"express_like": 0.9},
        "activity_events": ["a", "b"],
        "score": 0.62,
        "learner_answers": ["I like music", "I want water"],
        "email": "someone@example.com",
    })
    assert kept == {"remembered_like": "music"}

    assert _safe_optional_context(None) == {}
    assert _safe_optional_context("music") == {}
    assert _safe_optional_context({"remembered_like": 42}) == {}
    assert _safe_optional_context({"remembered_like": ""}) == {}
    # and it can never grow unbounded
    assert len(_safe_optional_context({"remembered_like": "x" * 500})["remembered_like"]) <= 40


def test_invalid_optional_context_does_not_break_chat():
    res = client.post("/chat", json={
        "message": "hello", "level": "A1", "optional_context": {"remembered_like": None, "junk": [1, 2, 3]},
    })
    assert res.status_code == 200


def test_translation_and_meaning_still_work():
    r1 = client.post("/chat", json={"message": "como se dice queso", "level": "A1"})
    assert "cheese" in r1.json()["reply"].lower()
    r2 = client.post("/chat", json={"message": "que significa cheese", "level": "A1"})
    assert r2.status_code == 200
