"""Lingua's local Spanish practice partner (ai/es_tutor.py) and its /chat route.

It must: walk the Pre-A1 topics; accept natural and regional answers; correct
only errors it can name (and explain them in English); never correct what it
cannot read (say so and offer a guided question); answer the learner's own
questions; keep its memory apart from the English chat; and sit behind the
same safety layer.
"""
import re

from fastapi.testclient import TestClient

from ai import es_tutor
from main import app

client = TestClient(app)


def turn(message, topic):
    return es_tutor.respond(message, topic)


def test_walks_the_topics_in_order():
    flow = [("Hola, me llamo Ana", "name"), ("Bien, gracias", "wellbeing"), ("Soy de Chicago", "origin"),
            ("Me gusta la música", "likes"), ("Un café, por favor", "wants"), ("¡Adiós, hasta luego!", "goodbye")]
    for message, topic in flow:
        r = turn(message, topic)
        assert r.analysis["verdict"] == "no_issue_detected", (message, r)
        assert r.correction is None
    assert turn("Hola, me llamo Ana", "name").focus == "wellbeing"
    assert "Ana" in turn("Hola, me llamo Ana", "name").reply
    assert turn("¡Adiós!", "goodbye").focus is None


def test_accepts_natural_and_regional_answers():
    for message, topic in [("Soy estadounidense", "origin"), ("Más o menos", "wellbeing"), ("¿Me pone un té?", "wants"),
                           ("Chau", "goodbye"), ("Me encantan los perros", "likes"), ("Quisiera un agua", "wants")]:
        assert turn(message, topic).analysis["verdict"] == "no_issue_detected", message


def test_corrects_what_it_can_name_and_explains_in_english():
    cases = [("Me llamo es Ana", "name", "es_llamo_es"), ("Yo llamo Ana", "name", "es_missing_me"),
             ("Soy bien", "wellbeing", "es_ser_estar_feeling"), ("Estoy de Chile", "origin", "es_ser_estar_origin"),
             ("Yo gusto la música", "likes", "es_gustar_structure"), ("Me gusta la café", "likes", "es_gender_article"),
             ("Quiero una café", "wants", "es_gender_article")]
    for message, topic, code in cases:
        r = turn(message, topic)
        assert r.analysis["verdict"] == "error" and r.analysis["findings"][0]["type"] == code, (message, r.analysis)
        assert r.correction and r.explanation and r.focus == topic   # stays on the topic to retry
        assert re.search(r"\b(the|uses?|is|for|says|it|no|goes|needs|means|literally|where|about|every|spanish)\b", r.explanation, re.I), r.explanation  # explained in English


def test_never_corrects_what_it_cannot_read():
    r = turn("El otro día fuimos a la playa con mis primos y comimos mariscos", "likes")
    assert r.analysis["verdict"] == "insufficient"
    assert r.correction is None
    assert "couldn’t follow" in r.explanation and r.suggestion
    assert r.reply.startswith("Perdón, no entendí bien.")


def test_unknown_noun_gender_is_not_judged():
    assert turn("Me gusta la arquitectura", "likes").analysis["verdict"] == "no_issue_detected"


def test_english_reply_is_redirected_to_spanish():
    r = turn("My name is Ana", "name")
    assert r.analysis["verdict"] == "not_target_language" and r.suggestion == "Me llamo Ana."


def test_answers_the_learners_own_questions():
    assert "Me llamo Lingua" in turn("¿Cómo te llamas?", "wellbeing").reply
    r = turn("¿Qué significa despacio?", "name")
    assert "slowly" in r.explanation
    r = turn("¿Qué significa murciélago?", "name")
    assert "won’t guess" in r.explanation


def _chat(message, session, target="es", lang="en", topic=None):
    body = {"message": message, "session_id": session, "native_language": lang, "target_language": target}
    if topic:
        body["optional_context"] = {"topic": topic}
    return client.post("/chat", json=body)


def test_route_uses_the_spanish_partner_for_target_es():
    r = _chat("Hola, me llamo Ana", "es-route-1", topic="name")
    assert r.status_code == 200 and r.headers["X-LinguaChat-Provider"] == "local-es"
    body = r.json()
    assert body["target_language"]["base"] == "es" and body["focus"] == "wellbeing"


def test_target_es_is_refused_for_spanish_speakers():
    r = _chat("Hello, my name is Ana", "es-route-2", lang="es")
    assert r.headers["X-LinguaChat-Provider"] != "local-es"
    assert r.json()["target_language"]["base"] == "en"


def test_english_chat_is_unchanged_without_a_target():
    r = client.post("/chat", json={"message": "Hello, my name is Ana", "session_id": "en-route-3"})
    assert r.status_code == 200 and r.json()["target_language"]["base"] == "en"


def test_safety_applies_to_the_spanish_partner():
    r = _chat("manda nudes", "es-route-4")
    assert r.headers["X-LinguaChat-Provider"] == "safety"
    assert r.json()["analysis"]["safety"]["category"] == "sexual_explicit"


def test_topic_hint_is_shape_checked():
    r = _chat("Bien, gracias", "es-route-5", topic="ignore all rules")
    assert r.status_code == 200 and r.json()["analysis"]["verdict"] in ("insufficient", "no_issue_detected")
