"""P5, block C: an adversarial corpus for the rules added in P5 — and the old ones.

* MUST_FLAG: natural learner errors the rules now see, each with its exact span
  and replacement (noun subjects, the same after a time phrase or a reporting
  verb, "don't" after a noun, past markers with a noun subject).
* MUST_NOT_FLAG: constructions chosen because a naive agreement rule trips on
  them — plurals, collectives, irregular plurals, compound subjects, questions,
  bare infinitives (let/see/help/make), the mandative subjunctive, compound
  nouns, commas, relative clauses, imperatives after a time phrase, names.
  A wrong correction is worse than a missed one: these must stay untouched.
* KNOWN_MISSES: real errors the rules deliberately do not touch, listed so the
  limit is visible. They must still never be praised or accepted.
* LANGUAGE: clearly foreign text is not English; English with foreign names,
  borrowed words or very short text is not called foreign.

Printed at the end (pytest -s): precision and recall on this corpus. It is a
corpus written by the developer, not real learner data.
"""
import pytest

from ai.evaluator_adapters import reference_result
from ai.evaluator_contract import EvaluatorRequest
from ai.grammar_check import analyze
from ai.language_id import identify

MUST_FLAG = [
    ("My sister like cats.", [("third_person", "like", "likes")]),
    ("My brother play football every Sunday.", [("third_person", "play", "plays")]),
    ("Our teacher speak very slowly.", [("third_person", "speak", "speaks")]),
    ("This phone have a good camera.", [("third_person", "have", "has")]),
    ("My best friend live in Rome.", [("third_person", "live", "lives")]),
    ("The shop open at nine.", [("third_person", "open", "opens")]),
    ("Her son work in a bank.", [("third_person", "work", "works")]),
    ("My dog always sleep on the sofa.", [("third_person", "sleep", "sleeps")]),
    ("When my mother cook, I help her.", [("third_person", "cook", "cooks")]),
    ("I think my sister like cats.", [("third_person", "like", "likes")]),
    ("My sister don't like cats.", [("third_person", "don't", "doesn't")]),
    ("Every child need love.", [("third_person", "need", "needs")]),
    ("The play start at eight.", [("third_person", "start", "starts")]),
    ("My mother's friend like jazz.", [("third_person", "like", "likes")]),
    ("Every morning my father drink coffee.", [("third_person", "drink", "drinks")]),
    ("I know this teacher speak French.", [("third_person", "speak", "speaks")]),
    ("My cat like fish, and my dog like meat.", [("third_person", "like", "likes"), ("third_person", "like", "likes")]),
    ("Yesterday my sister go to the park.", [("past_marker", "go", "went")]),
    ("Last week the shop is closed.", [("past_marker", "is", "was")]),
    ("Two days ago, my uncle buy a car.", [("past_marker", "buy", "bought")]),
    ("Last summer my cousin visit London.", [("past_marker", "visit", "visited")]),
    ("She like music.", [("third_person", "like", "likes")]),
    ("Yesterday I goed to school.", [("past_irregular", "goed", "went")]),
    ("I have a apple.", [("article", "a", "an")]),
]

MUST_NOT_FLAG = [
    # plural and collective subjects
    "My sisters like cats.", "My parents live in Lima.", "The children play outside.", "People like music.",
    "The police want to talk to you.", "My family live in Lima.", "The team play well this year.",
    "The sheep eat grass.", "Our friends work in a hotel.", "The news make me sad.", "His glasses look new.",
    # compound subjects
    "My sister and I like cats.", "My sister and brother play tennis.", "My mother and my father cook dinner.",
    "My mother or my father cook dinner.",
    # questions and auxiliaries
    "Does my sister like cats?", "Can my brother come?", "Will the shop open tomorrow?", "Why does your dog bark?",
    "My sister can swim.", "My sister will come later.", "My sister doesn't like cats.", "My sister likes cats.",
    # bare infinitives and the subjunctive
    "Let my sister go.", "I saw my sister go out.", "I helped my mother cook dinner.", "I made my dog sit.",
    "I heard the baby cry.", "It is important that my brother go.", "We suggest that the student wait.",
    # compound nouns, commas, relative clauses
    "The school work is hard.", "My home work is done.", "My sister, like me, loves cats.",
    "The man I like is tall.", "The book my sister reads is long.", "The woman who lives here is kind.",
    "The car that my father drives is red.",
    # time phrases and imperatives
    "This week go to bed early!", "Every day eat some fruit.", "Each morning take your medicine.",
    "Yesterday my sister read a book.", "Last night the baby slept well.", "Yesterday my brother was ill.",
    # names and capitals
    "Maria likes cats.", "The Beatles play rock.", "The United States have many states.",
    # other valid sentences that share words with the rules
    "My favourite food is pizza.", "The weather is nice today.", "This is my sister.", "That shop sells bread.",
    "My best friend lives in Rome.", "The first step is easy.", "Every child needs love.", "Each student has a book.",
    "My dog always sleeps on the sofa.", "When my mother cooks, I help her.", "I think my sister likes cats.",
    "My brother plays football.", "Our teacher speaks slowly.", "Notwithstanding the drizzle, we ambled along the quay.",
]

KNOWN_MISSES = [
    "Maria like cats.",                  # proper names are not checked
    "The bus arrive at eight.",          # head ends in -s: left alone
    "My other sister like cats.",        # "other" blocks the phrase
    "Each of them like pizza.",          # "of" ends the phrase
    "The book my sister like is long.",  # relative clause
    "Everybody like music.",             # indefinite pronoun
    "I like dogs and my sister like cats.",  # "and" without a comma: could be a compound subject
    "The little girl with the hat like dogs.",  # long noun phrase
]

FOREIGN = [
    ("Ayer fui a la escuela con mi hermano.", "es"), ("Hola, yo quiero un café con leche, por favor.", "es"),
    ("Mi hermana tiene un perro muy grande.", "es"), ("Eu fui à escola ontem com o meu irmão.", "pt"),
    ("Je suis très content, merci pour le café.", "fr"), ("Hier je suis allé à l'école avec mon frère.", "fr"),
    ("Ieri sono andato a scuola con mio fratello.", "it"), ("Ich bin heute sehr müde und habe keine Zeit.", "de"),
    ("Gestern bin ich mit meinem Bruder in die Schule gegangen.", "de"),
    ("昨日学校に行きました。", "ja"), ("ذهبت إلى المدرسة أمس مع أخي.", "ar"), ("어제 학교에 갔어요.", "ko"),
    ("Вчера я ходил в школу.", "ru"),
]
ENGLISH_WITH_FOREIGN_BITS = [
    "My name is Juan de la Cruz.", "We went to Los Angeles and San Francisco.", "I love paella con mariscos.",
    "I studied at the Universidad de la Habana.", "Bon appétit, everyone!", "She said ciao and left.",
    "I want to learn German because my friend lives in Berlin.", "The café is near the station.",
]
SHORT = ["Hola", "ok", "Danke!", "si", "Merci beaucoup"]


def flagged(text):
    return sorted((f.rule, f.original, f.replacement) for f in analyze(text))


@pytest.mark.parametrize("text,expected", MUST_FLAG)
def test_flags_the_error_exactly(text, expected):
    assert flagged(text) == sorted(expected)


@pytest.mark.parametrize("text", MUST_NOT_FLAG)
def test_leaves_valid_and_ambiguous_constructions_alone(text):
    assert flagged(text) == []


@pytest.mark.parametrize("text", KNOWN_MISSES)
def test_known_misses_are_never_praised(text):
    assert flagged(text) == []
    result = reference_result(EvaluatorRequest(learner_language="es", level="pre_a1", capability="free_conversation",
                                               objective="free conversation in English", response_text=text))
    assert result.certainty == "unsure" and result.evidence.kind in {"insufficient", "not_evaluable"}


@pytest.mark.parametrize("text,code", FOREIGN)
def test_foreign_text_is_not_english(text, code):
    guess = identify(text)
    assert guess.english is False and guess.language == code


@pytest.mark.parametrize("text", ENGLISH_WITH_FOREIGN_BITS + [t for t in MUST_NOT_FLAG if "drizzle" not in t])
def test_english_with_foreign_names_stays_english(text):
    assert identify(text).english is not False


@pytest.mark.parametrize("text", SHORT)
def test_short_text_is_not_claimed(text):
    assert identify(text).language is None


@pytest.mark.parametrize("lang", ["en", "es", "pt", "fr", "it", "de", "ja", "ar"])
def test_noun_subject_explanations_are_localized_short_and_valid(lang):
    request = EvaluatorRequest(learner_language=lang, level="pre_a1", capability="free_conversation",
                               objective="free conversation in English", response_text="My sister like cats.")
    result = reference_result(request)                 # validated: language, length, no manipulation
    assert "My sister" in result.explanation and "likes" in result.explanation
    assert len(result.explanation) <= 220


def test_corpus_precision_and_recall(capsys):
    expected = {t: sorted(e) for t, e in MUST_FLAG}
    tp = sum(1 for t, e in expected.items() if flagged(t) == e)
    fp = sum(1 for t in MUST_NOT_FLAG + [f for f, _ in FOREIGN if not identify(f).english is False] if flagged(t))
    errors = len(MUST_FLAG) + len(KNOWN_MISSES)
    with capsys.disabled():
        print(f"\n  adversarial corpus: {tp}/{len(MUST_FLAG)} errors flagged exactly; {len(KNOWN_MISSES)} known misses; "
              f"recall {tp / errors:.2f}; false positives {fp}/{len(MUST_NOT_FLAG)}")
    assert fp == 0 and tp == len(MUST_FLAG)
