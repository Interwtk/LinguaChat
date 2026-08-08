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
    """Ask for the real provider, the way a developer now has to.

    A key on its own used to be enough, which is exactly why local QA reached the
    network by accident. These tests want the real-provider PATH — with the client
    stubbed out below, so nothing leaves the machine — and therefore have to opt
    in explicitly, like anybody else.
    """
    monkeypatch.setenv("OPENAI_ENABLED", "true")
    monkeypatch.setenv("LINGUACHAT_PROVIDER", "openai")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key-not-a-secret")


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



# ---------- adaptive support must not leak into the backend ----------
def test_scaffold_level_is_accepted_but_never_decides_the_verdict():
    """The support level is context, not a grade. The same answer gets the same
    verdict whether the learner had a model on screen or not."""
    verdicts = []
    for level in ["high", "medium", "low"]:
        r = evaluate_deterministic(_payload(expected_intent="introduction",
                                            learner_response="Hi, I'm Sebastian.",
                                            scaffold_level=level))
        verdicts.append((r["completed_objective"], r["error_type"], r["natural_version"]))
    assert len(set(verdicts)) == 1, "support level changed the verdict"


def test_an_unknown_scaffold_level_is_harmless():
    r = evaluate_deterministic(_payload(expected_intent="introduction",
                                        learner_response="Hi, I'm Sebastian.",
                                        scaffold_level="enormous"))
    assert r["completed_objective"] is True


def test_the_provider_never_sees_support_state_or_reason_codes():
    """The provider is handed linguistic context and nothing else. Reason codes
    are internal labels for our own tests; a model has no business reading them,
    and neither has anything that logs a request."""
    from ai.providers import EvaluationContext
    payload = _payload(
        expected_intent="introduction", learner_response="Hi, I'm Sebastian.",
        scaffold_level="low", assistance_used=True,
    )
    payload["scaffold"] = {"currentLevel": "low", "reasonCodes": ["fresh_skill"]}
    payload["reason_codes"] = ["fresh_skill", "strong_prerequisites"]
    ctx = EvaluationContext.from_payload(payload)
    exposed = ctx.model_dump() if hasattr(ctx, "model_dump") else vars(ctx)
    blob = str(exposed).lower()
    for forbidden in ["scaffold", "reason", "fresh_skill", "strong_prerequisites", "assistance"]:
        assert forbidden not in blob, f"the provider was handed {forbidden}"


def test_assistance_used_does_not_change_the_deterministic_verdict():
    """Whether the learner reached for help decides how the success is RECORDED,
    which is the frontend's job. It must not change whether the English was
    right."""
    a = evaluate_deterministic(_payload(expected_intent="polite_request",
                                        learner_response="Can I have water, please?",
                                        assistance_used=False))
    b = evaluate_deterministic(_payload(expected_intent="polite_request",
                                        learner_response="Can I have water, please?",
                                        assistance_used=True))
    assert a["completed_objective"] == b["completed_objective"] is True
    assert a["natural_version"] == b["natural_version"]


def test_a_timeout_yields_exactly_one_conservative_verdict(monkeypatch):
    """A remote that never answers must not produce a second piece of evidence.
    One request in, one verdict out, and the learner is not blocked."""
    _enable_openai(monkeypatch)
    calls = []

    def slow(payload):
        calls.append(1)
        raise TimeoutError("provider took too long")

    monkeypatch.setattr(evaluator, "evaluate_with_openai", slow)
    r = evaluator.evaluate_episode_response(_payload(expected_intent="express_like",
                                                     learner_response="music is what I like most"))
    assert len(calls) == 1, "a timeout must not be retried into duplicate evidence"
    assert r.source == "fallback"
    assert not (r.completed_objective and r.retry_required)


def test_every_intent_still_answers_after_the_support_changes():
    """The fifteen episodes' intents all still answer."""
    for intent, text in [
        ("introduction", "Hi, I'm Sebastian."), ("ask_name", "What's your name?"),
        ("nice_to_meet", "Nice to meet you."), ("ask_wellbeing", "How are you?"),
        ("answer_wellbeing", "I'm good."), ("reciprocal_question", "And you?"),
        ("ask_origin", "Where are you from?"), ("answer_origin", "I'm from Bogota."),
        ("full_intro_conversation", "Hi, I'm Sebastian. How are you?"),
        ("express_like", "I like music."), ("express_dislike", "I don't like coffee."),
        ("ask_preference", "What do you like?"), ("yes_no_preference", "Yes, I do."),
        ("express_want", "I want water."), ("express_need", "I need help."),
        ("ask_want", "Do you want water?"), ("accept_offer", "Yes, please."),
        ("decline_offer", "No, thank you."),
        ("simple_plan_conversation", "I like music. Do you want to listen to music?"),
        ("polite_request", "Can I have water, please?"), ("thank_service", "Thank you."),
        ("respond_anything_else", "No, thank you."), ("finish_order", "That is all, thanks."),
        ("cafe_order_conversation", "Can I have water, please? That is all, thanks."),
        ("close_encounter", "Bye."),
        ("ask_what_thing", "What's this?"),
    ]:
        r = evaluate_deterministic(_payload(expected_intent=intent, learner_response=text))
        assert r["completed_objective"] is True, f"{intent} rejected {text!r}"
    # repair is one intent with three strategies, so it is checked per strategy
    for kind, text in [
        ("signal_nonunderstanding", "I don't understand."),
        ("repeat", "Can you repeat, please?"),
        ("slow_down", "Please speak slowly."),
    ]:
        r = evaluate_deterministic(_payload(expected_intent="repair_request",
                                            repair_kind=kind, learner_response=text))
        assert r["completed_objective"] is True, f"repair/{kind} rejected {text!r}"
    # identifying and counting both need to know what they are talking about
    assert evaluate_deterministic(_payload(expected_intent="identify_thing", target_thing="book",
                                           learner_response="It's a book."))["completed_objective"] is True
    for form, text in [("bare", "Two."), ("with_object", "Two books."),
                       ("polite_request", "Can I have two books, please?")]:
        r = evaluate_deterministic(_payload(expected_intent="use_quantity", quantity_form=form,
                                            target_thing="book", target_count=2, learner_response=text))
        assert r["completed_objective"] is True, f"quantity/{form} rejected {text!r}"

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


# ---------- fifth arc: repair and closing ----------
REPAIR_KINDS = ["signal_nonunderstanding", "repeat", "slow_down"]


def _repair(text, kind="signal_nonunderstanding"):
    return evaluate_deterministic(_payload(expected_intent="repair_request",
                                          repair_kind=kind, learner_response=text))


def _close(text):
    return evaluate_deterministic(_payload(expected_intent="close_encounter", learner_response=text))


@pytest.mark.parametrize("text", [
    "I don't understand.", "I do not understand.", "Sorry, I don't understand.",
    "I don’t understand.", "I didn't catch that.",
])
def test_signalling_non_understanding_is_accepted(text):
    r = _repair(text)
    assert r["completed_objective"] is True, text
    assert r["retry_required"] is False


@pytest.mark.parametrize("text", ["Don't understand.", "I not understand.", "No understand."])
def test_a_partial_signal_is_understood_but_not_complete(text):
    r = _repair(text)
    assert r["completed_objective"] is False, text
    assert r["error_type"] == "incomplete_repair"
    assert r["natural_version"] == "I don’t understand."


def test_i_dont_know_is_not_i_dont_understand():
    """A real sentence that answers a question instead of reporting a breakdown."""
    r = _repair("I don't know.")
    assert r["completed_objective"] is False
    assert r["error_type"] == "means_dont_know"
    assert r["understood"] is True, "the learner said something real; do not call it noise"


@pytest.mark.parametrize("text", ["What?", "Sorry?", "Huh?", "Pardon?"])
def test_a_bare_confusion_signal_does_not_complete_the_objective(text):
    r = _repair(text)
    assert r["completed_objective"] is False, text
    assert r["error_type"] == "too_short_repair"


@pytest.mark.parametrize("text", ["Can you repeat, please?", "Could you repeat, please?",
                                  "Can you repeat?", "Please repeat.", "Say that again."])
def test_asking_for_a_repetition_is_accepted(text):
    assert _repair(text, "repeat")["completed_objective"] is True, text


@pytest.mark.parametrize("text", ["Repeat please.", "Again?", "Repeat."])
def test_a_partial_repetition_request_is_incomplete(text):
    r = _repair(text, "repeat")
    assert r["completed_objective"] is False, text
    assert r["error_type"] == "incomplete_repair"


@pytest.mark.parametrize("text", ["Please speak slowly.", "Speak slowly, please.",
                                  "Can you speak slowly, please?", "Could you speak more slowly?"])
def test_asking_for_slower_speech_is_accepted(text):
    assert _repair(text, "slow_down")["completed_objective"] is True, text


@pytest.mark.parametrize("text", ["Speak slow.", "Slow, please.", "Slow down."])
def test_a_partial_slow_request_is_incomplete(text):
    r = _repair(text, "slow_down")
    assert r["completed_objective"] is False, text
    assert r["error_type"] == "incomplete_repair"


def test_the_strategy_asked_for_decides_the_verdict():
    """The same sentence is right for one turn and a different repair in another."""
    asked_repeat = _repair("Can you repeat, please?", "repeat")
    asked_signal = _repair("Can you repeat, please?", "signal_nonunderstanding")
    assert asked_repeat["completed_objective"] is True
    assert asked_signal["completed_objective"] is False
    assert asked_signal["error_type"] == "other_repair", "a different repair is still a repair"
    assert asked_signal["understood"] is True


def test_an_unknown_or_missing_strategy_falls_back_to_the_first_one():
    for kind in [None, "", "shout_louder"]:
        r = evaluate_deterministic(_payload(expected_intent="repair_request",
                                           repair_kind=kind, learner_response="I don't understand."))
        assert r["completed_objective"] is True, kind
        assert r["natural_version"] == "I don’t understand."


@pytest.mark.parametrize("text", ["Bye.", "Goodbye.", "See you.", "See you later.",
                                  "Thanks, bye.", "Thank you, bye.", "Take care."])
def test_closing_an_encounter_is_accepted(text):
    assert _close(text)["completed_objective"] is True, text


def test_thanks_alone_is_not_a_goodbye():
    r = _close("Thank you.")
    assert r["completed_objective"] is False
    assert r["error_type"] == "not_a_close"
    assert r["understood"] is True


@pytest.mark.parametrize("kind", REPAIR_KINDS)
def test_repair_empty_replies_are_safe(kind):
    r = _repair("", kind)
    assert r["completed_objective"] is False
    assert r["error_type"] == "empty"
    assert r["natural_version"]


def test_close_empty_reply_is_safe():
    r = _close("")
    assert r["error_type"] == "empty"
    assert r["completed_objective"] is False


@pytest.mark.parametrize("intent", ["repair_request", "close_encounter"])
def test_fifth_arc_never_returns_a_contradiction(intent):
    for text in ["", "???", "I don't understand.", "Bye.", "yes", "aaaaaaa", "I like music."]:
        for kind in REPAIR_KINDS:
            r = evaluate_deterministic(_payload(expected_intent=intent, repair_kind=kind,
                                               learner_response=text))
            assert not (r["completed_objective"] and r["retry_required"]), (intent, text)
            assert r["natural_version"], (intent, text)


def test_fifth_arc_intents_work_through_the_endpoint_without_openai():
    cases = [
        ("repair_request", "signal_nonunderstanding", "I don't understand."),
        ("repair_request", "repeat", "Can you repeat, please?"),
        ("repair_request", "slow_down", "Please speak slowly."),
        ("close_encounter", None, "See you later."),
    ]
    for intent, kind, text in cases:
        res = client.post("/learning/evaluate", json=_payload(expected_intent=intent,
                                                              repair_kind=kind, learner_response=text))
        assert res.status_code == 200, intent
        body = res.json()
        assert body["completed_objective"] is True, f"{intent}/{kind} rejected {text!r}"
        assert body["source"] == "deterministic"


def test_repair_kind_is_bounded():
    res = client.post("/learning/evaluate", json=_payload(expected_intent="repair_request",
                                                          repair_kind="x" * 200,
                                                          learner_response="I don't understand."))
    assert res.status_code == 422, "an unbounded field is an injection surface"


def test_an_ambiguous_repair_reaches_the_remote_and_comes_back_localised(monkeypatch):
    """"Could you say that again, please?" is a real repair the local rules miss."""
    _enable_openai(monkeypatch)
    seen = {}

    def fake(payload):
        seen.update(payload)
        return {"completed_objective": True, "retry_required": False, "confidence": 0.8}

    monkeypatch.setattr(evaluator, "evaluate_with_openai", fake)
    r = evaluator.evaluate_episode_response(_payload(expected_intent="repair_request",
                                                     repair_kind="repeat",
                                                     learner_response="Could you say that again, please?"))
    assert r.completed_objective is True
    assert seen.get("repair_kind") == "repeat", "the provider must be told which repair was asked for"
    assert "reason_codes" not in seen and "reasonCodes" not in seen


def test_a_repair_survives_a_remote_timeout(monkeypatch):
    _enable_openai(monkeypatch)

    def boom(payload):
        raise TimeoutError("slow")

    monkeypatch.setattr(evaluator, "evaluate_with_openai", boom)
    r = evaluator.evaluate_episode_response(_payload(expected_intent="repair_request",
                                                     repair_kind="repeat",
                                                     learner_response="Can you repeat, please?"))
    assert r.completed_objective is True, "the deterministic verdict still stands"
    assert r.source == "fallback"


def test_a_malformed_repair_verdict_is_discarded(monkeypatch):
    _enable_openai(monkeypatch)
    monkeypatch.setattr(evaluator, "evaluate_with_openai",
                        lambda payload: {"completed_objective": "sort of", "retry_required": True})
    r = evaluator.evaluate_episode_response(_payload(expected_intent="repair_request",
                                                     repair_kind="slow_down",
                                                     learner_response="Please speak slowly."))
    assert r.source == "fallback"
    assert r.completed_objective is True
    assert not (r.completed_objective and r.retry_required)


# ---------- sixth arc: things, and how many ----------
def _ask(text):
    return evaluate_deterministic(_payload(expected_intent="ask_what_thing", learner_response=text))


def _identify(text, thing="book"):
    return evaluate_deterministic(_payload(expected_intent="identify_thing", target_thing=thing,
                                           learner_response=text))


def _quantity(text, form="bare", thing="book", count=2):
    return evaluate_deterministic(_payload(expected_intent="use_quantity", quantity_form=form,
                                           target_thing=thing, target_count=count, learner_response=text))


@pytest.mark.parametrize("text", ["What's this?", "What is this?", "what’s this", "What's that?"])
def test_asking_what_a_thing_is_is_accepted(text):
    assert _ask(text)["completed_objective"] is True, text


@pytest.mark.parametrize("text", ["What's this called?", "What do you call this?"])
def test_a_wider_way_of_asking_is_still_asking(text):
    """A learner is never wrong for being correct, even off-script."""
    r = _ask(text)
    assert r["completed_objective"] is True, text
    assert r["accepted_variant"] is True


@pytest.mark.parametrize("text", ["Where is this?", "Who is this?"])
def test_a_different_question_word_is_a_different_question(text):
    r = _ask(text)
    assert r["completed_objective"] is False, text
    assert r["error_type"] == "wrong_question_word"
    assert r["understood"] is True


@pytest.mark.parametrize("text", ["What this?", "This?"])
def test_a_partial_question_is_incomplete(text):
    r = _ask(text)
    assert r["completed_objective"] is False, text
    assert r["error_type"] == "incomplete_question"


@pytest.mark.parametrize("text", ["It's a book.", "It is a book.", "This is a book."])
def test_identifying_a_thing_is_accepted(text):
    assert _identify(text)["completed_objective"] is True, text


def test_the_article_follows_the_thing():
    assert _identify("", "apple")["natural_version"] == "It’s an apple."
    assert _identify("", "book")["natural_version"] == "It’s a book."


@pytest.mark.parametrize("text", ["Book.", "book", "a book"])
def test_a_bare_noun_identifies_and_does_not_complete(text):
    r = _identify(text)
    assert r["completed_objective"] is False, text
    assert r["error_type"] == "bare_noun"
    assert r["understood"] is True, "it does name the thing"


def test_half_the_frame_is_named_as_such():
    assert _identify("It book.")["error_type"] == "incomplete_identification"


@pytest.mark.parametrize("text", ["Two.", "two", "2"])
def test_a_bare_number_answers_how_many(text):
    assert _quantity(text)["completed_objective"] is True, text


def test_the_shape_the_turn_asked_for_decides_the_verdict():
    """"Two." is a whole answer to "How many?" and half of an order."""
    assert _quantity("Two.", "bare")["completed_objective"] is True
    later = _quantity("Two.", "with_object")
    assert later["completed_objective"] is False
    assert later["error_type"] == "missing_counted_noun"
    order = _quantity("Two books.", "polite_request")
    assert order["completed_objective"] is False
    assert order["error_type"] == "missing_request_frame"


def test_plurals_are_looked_up_not_invented():
    wrong = _quantity("Two book.", "with_object")
    assert wrong["completed_objective"] is False
    assert wrong["error_type"] == "wrong_number_form"
    assert wrong["natural_version"] == "Two books."
    sandwiches = _quantity("Can I have two sandwiches, please?", "polite_request", thing="sandwich")
    assert sandwiches["completed_objective"] is True
    assert _quantity("Can I have two sandwich, please?", "polite_request", thing="sandwich")["error_type"] == "wrong_number_form"
    assert _quantity("One book.", "with_object", count=1)["completed_objective"] is True


def test_a_number_outside_the_taught_range_is_still_a_number():
    r = _quantity("Eleven.", "bare")
    assert r["completed_objective"] is True, "it answers the question"
    assert r["accepted_variant"] is True, "and the arc only teaches ten of them"


@pytest.mark.parametrize("text", ["Many.", "A lot.", "Some."])
def test_a_vague_quantity_is_understood_and_not_a_number(text):
    r = _quantity(text)
    assert r["completed_objective"] is False, text
    assert r["error_type"] == "not_a_number"
    assert r["understood"] is True


def test_a_quantity_of_something_uncountable_is_refused():
    """"two water" is a content bug, and the evaluator refuses to invent a plural."""
    r = _quantity("Two waters.", "with_object", thing="water")
    assert r["completed_objective"] is False
    assert r["error_type"] == "uncountable_target"


@pytest.mark.parametrize("intent", ["ask_what_thing", "identify_thing", "use_quantity"])
def test_sixth_arc_empty_replies_are_safe(intent):
    r = evaluate_deterministic(_payload(expected_intent=intent, learner_response=""))
    assert r["completed_objective"] is False
    assert r["error_type"] == "empty"
    assert r["natural_version"]


@pytest.mark.parametrize("intent", ["ask_what_thing", "identify_thing", "use_quantity"])
def test_sixth_arc_never_returns_a_contradiction(intent):
    for text in ["", "???", "What's this?", "It's a book.", "Two.", "aaaaaaa", "😀"]:
        for form in ["bare", "with_object", "polite_request", "nonsense"]:
            r = evaluate_deterministic(_payload(expected_intent=intent, quantity_form=form,
                                                target_thing="book", target_count=2, learner_response=text))
            assert not (r["completed_objective"] and r["retry_required"]), (intent, text)
            assert r["natural_version"], (intent, text)


def test_sixth_arc_intents_work_through_the_endpoint_without_openai():
    cases = [
        ("ask_what_thing", None, "What's this?"),
        ("identify_thing", None, "It's a book."),
        ("use_quantity", "bare", "Two."),
        ("use_quantity", "with_object", "Two books."),
    ]
    for intent, form, text in cases:
        res = client.post("/learning/evaluate", json=_payload(expected_intent=intent, quantity_form=form,
                                                              target_thing="book", target_count=2,
                                                              learner_response=text))
        assert res.status_code == 200, intent
        body = res.json()
        assert body["completed_objective"] is True, f"{intent}/{form} rejected {text!r}"
        assert body["source"] == "deterministic"


def test_quantity_fields_are_bounded():
    long_form = client.post("/learning/evaluate", json=_payload(expected_intent="use_quantity",
                                                                quantity_form="x" * 200,
                                                                learner_response="Two."))
    assert long_form.status_code == 422, "an unbounded field is an injection surface"
    huge_count = client.post("/learning/evaluate", json=_payload(expected_intent="use_quantity",
                                                                 quantity_form="bare", target_count=10 ** 6,
                                                                 learner_response="Two."))
    assert huge_count.status_code == 422


def test_an_ambiguous_identification_reaches_the_remote(monkeypatch):
    """"That would be a book, I think." is real English the local rules miss."""
    _enable_openai(monkeypatch)
    seen = {}

    def fake(payload):
        seen.update(payload)
        return {"completed_objective": True, "retry_required": False, "confidence": 0.8}

    monkeypatch.setattr(evaluator, "evaluate_with_openai", fake)
    r = evaluator.evaluate_episode_response(_payload(expected_intent="identify_thing", target_thing="book",
                                                     learner_response="That would be a book, I think."))
    assert r.completed_objective is True
    assert seen.get("target_thing") == "book", "the provider must know what was pointed at"


def test_an_ambiguous_quantity_reaches_the_remote_with_its_shape(monkeypatch):
    _enable_openai(monkeypatch)
    seen = {}

    def fake(payload):
        seen.update(payload)
        return {"completed_objective": True, "retry_required": False, "confidence": 0.8}

    monkeypatch.setattr(evaluator, "evaluate_with_openai", fake)
    r = evaluator.evaluate_episode_response(_payload(expected_intent="use_quantity", quantity_form="polite_request",
                                                     target_thing="sandwich", target_count=2,
                                                     learner_response="Could I get a couple of sandwiches?"))
    assert r.completed_objective is True
    assert seen.get("quantity_form") == "polite_request"
    assert seen.get("target_count") == 2


def test_the_provider_never_sees_readiness_or_progress(monkeypatch):
    """Readiness is local pedagogy. It has no business leaving the device."""
    _enable_openai(monkeypatch)
    seen = {}

    def fake(payload):
        seen.update(payload)
        return {"completed_objective": True, "retry_required": False}

    monkeypatch.setattr(evaluator, "evaluate_with_openai", fake)
    evaluator.evaluate_episode_response(_payload(
        expected_intent="use_quantity", quantity_form="bare", learner_response="Two.",
        scaffold_level="high", previous_attempts=3, assistance_used=True,
    ))
    for forbidden in ["ready", "readiness", "missing_skills", "fragile_skills", "overdue_reviews",
                      "xp", "garden", "scaffold_level", "assistance_used", "previous_attempts",
                      "reason_codes", "reasonCodes"]:
        assert forbidden not in seen, f"{forbidden} must never reach the provider"


def test_a_quantity_survives_a_remote_timeout(monkeypatch):
    _enable_openai(monkeypatch)

    def boom(payload):
        raise TimeoutError("slow")

    monkeypatch.setattr(evaluator, "evaluate_with_openai", boom)
    r = evaluator.evaluate_episode_response(_payload(expected_intent="use_quantity", quantity_form="with_object",
                                                     target_thing="book", target_count=2,
                                                     learner_response="Two books."))
    assert r.completed_objective is True, "the deterministic verdict still stands"
    assert r.source == "fallback"


def test_a_malformed_identification_verdict_is_discarded(monkeypatch):
    _enable_openai(monkeypatch)
    monkeypatch.setattr(evaluator, "evaluate_with_openai",
                        lambda payload: {"completed_objective": "maybe", "retry_required": True})
    r = evaluator.evaluate_episode_response(_payload(expected_intent="identify_thing", target_thing="book",
                                                     learner_response="It's a book."))
    assert r.source == "fallback"
    assert r.completed_objective is True
    assert not (r.completed_objective and r.retry_required)
