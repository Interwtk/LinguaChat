"""P5: the reference behaviour of /chat, captured BEFORE the evaluator contract
was wired in (fixture: tests/fixtures/chat_golden_p4.json, recorded from the
phase-5 code). Each case is a short conversation replayed over real HTTP.

`test_chat_runtime.py` replays every case and compares the responses with the
fixture, field by field. Differences are allowed only where a later change was
intended and is listed, with its reason, in INTENDED_CHANGES there.
"""
from __future__ import annotations

import hashlib

LANGS = ("en", "es", "pt", "fr", "it", "de", "ja", "ar")

ERRORS = [
    "Yesterday I goed to school.", "Last week I buyed a car.", "Yesterday he reads a book.", "She like music.",
    "She don't like it.", "I have a apple.", "It is an university.", "Yesterday she go to school and eated pizza.",
    "He like music and she play guitar.", "how you are", "me good", "im good", "i not understand",
]
VALID = [
    "I read a book yesterday.", "I put the book there yesterday.", "She doesn't like coffee.", "I have been to London.",
    "The police were there.", "An umbrella is useful.", "Does she like it?", "Yesterday I went to school.",
    "Notwithstanding the drizzle, we ambled along the quay.",
]
OTHER = [
    "My sister like cats.", "Me school yesterday.", "Yesterday I go to school and I am happy.", "hi", "ok", "?",
    "how are you", "how do you say gato", "practice", "Ayer fui a la escuela con mi hermano.",
    "Hola, yo quiero un café con leche, por favor.", "Ich bin heute sehr müde und habe keine Zeit.",
    "昨日学校に行きました。", "ذهبت إلى المدرسة أمس مع أخي.", "Je suis très content, merci pour le café.",
]


def _base(lang: str) -> dict:
    return {"level": "A1", "native_language": lang}


def cases() -> list[dict]:
    out = []
    for text in ERRORS + VALID + OTHER:
        for lang in ("en", "es", "ja", "ar"):
            out.append({"id": f"single:{lang}:{text}", "turns": [{**_base(lang), "message": text}]})
    for lang in LANGS:
        for text in ("Yesterday I goed to school.", "She like music.", "I have a apple.", "me good"):
            out.append({"id": f"lang:{lang}:{text}", "turns": [{**_base(lang), "message": text}]})
    for style in ({"correction_style": "gentle"}, {"explanation_depth": "detailed"}):
        out.append({"id": f"prefs:{sorted(style)[0]}", "turns": [
            {**_base("es"), "message": "Yesterday I goed to school.", "tutor_preferences": style}]})
    # the same error three times in one session: strategy escalates (brief → contrast → retrieval)
    out.append({"id": "escalation:es", "turns": [{**_base("es"), "message": m} for m in
                ("Yesterday I goed to school.", "Last week I buyed a car.", "Yesterday I eated pizza.")]})
    # a difficulty the device says is due: a delayed retrieval is offered instead of the generic prompt
    memory = [{"rule": "past_irregular", "due": True, "status": "recurring", "bases": ["go"]}]
    out.append({"id": "retrieval:es", "turns": [{**_base("es"), "message": "I like football.", "learning_memory": memory}]})
    out.append({"id": "retrieval-on-error:es", "turns": [{**_base("es"), "message": "Yesterday I goed home.", "learning_memory": memory}]})
    # the learner types back the correction Lingua just gave
    out.append({"id": "copy:es", "turns": [{**_base("es"), "message": "Yesterday I goed to school."},
                                           {**_base("es"), "message": "Yesterday I went to school."}]})
    for level in ("A2", "B1", "C1"):
        out.append({"id": f"level:{level}", "turns": [{"level": level, "native_language": "es", "message": "She like music."}]})
    return out


def replay(client, case: dict) -> list[dict]:
    session = "golden-" + hashlib.sha1(case["id"].encode("utf-8")).hexdigest()[:16]
    responses = []
    for turn in case["turns"]:
        body = {k: v for k, v in turn.items()}
        body["session_id"] = session
        r = client.post("/chat", json=body)
        responses.append({"status": r.status_code, "provider": r.headers.get("X-LinguaChat-Provider"), "body": r.json()})
    return responses
