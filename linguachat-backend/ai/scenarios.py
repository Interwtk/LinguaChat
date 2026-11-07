"""The catalogue of guided conversations: closed, by course and level.

A scenario is a short exchange the tutor can actually follow, because it knows
in advance what an answer to each of its questions looks like. Nothing here is
generated and nothing a learner writes reaches a prompt: the tutor's every line
is one of these strings.

`valid` and `errors` are regular expressions over the normalised answer
(ai/guided_tutor.py), matched against the WHOLE answer, so a sentence cannot ride
along inside an accepted one. The slots:

  {name} {place}    an open word that is never repeated back to the learner
  {cname} {cplace}  the same in a form that could also be a word ("I'm Sad"): it
                    must be capitalised and not an everyday word
  {drink} {food} {thing}  closed lists; these may be shown in a correction

`available` follows the course's level. A1 scenarios exist and are tested, and
stay closed with their level: the server refuses them like any unknown id.
"""
from __future__ import annotations

from dataclasses import dataclass, field

SLOTS = {
    "en": {
        "drink": "orange juice|hot chocolate|coffee|tea|water|juice|milk|soda|lemonade|beer|wine",
        "food": "pizza|pasta|rice|chicken|fish|fruit|bread|cheese|chocolate|cake|salad|soup|sandwiches|sandwich|eggs|apples|bananas|tacos|sushi",
        "thing": "video games|music|movies|films|books|sports|soccer|football|tennis|cats|dogs|travel|games|dancing|reading|running|swimming|cooking|coffee|tea",
        "number": "one|two|three|four|five|six|seven|eight|nine|ten|[0-9]{1,2}",
        "feel": "very well|very good|not bad|so so|very tired|very happy|not good|not very well|fine|good|ok|okay|great|well|tired|happy|busy|hungry|cold|hot|sick|bad|sad",
        "art": "a cup of|a glass of|a bottle of|a|an|some|one|two",
    },
    "es": {
        "drink": "cafe con leche|cafe|te|agua|jugo|zumo|leche|cerveza|vino|chocolate|refresco",
        "food": "pizza|pasta|arroz|pollo|pescado|fruta|pan|queso|chocolate|sopa|ensalada|helado|sandwich|tacos|paella|tortilla",
        "thing": "musica|cine|futbol|tenis|cafe|te|chocolate|playa|pizza|deporte|comida|lectura|libros|peliculas|perros|gatos",
        "number": "uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|[0-9]{1,2}",
        "feel": "muy bien|mas o menos|asi asi|muy cansado|muy cansada|bien|mal|regular|cansado|cansada|feliz|contento|contenta|genial|fenomenal|triste|ocupado|ocupada",
        "art": "un|una|el|la|dos|tres|unos|unas",
    },
}


@dataclass(frozen=True)
class Step:
    id: str
    ask: str                              # Lingua's line, in the target language
    model: str                            # one natural answer
    valid: tuple[str, ...]
    ok: str = ""                          # Lingua's reaction, in the target language
    errors: tuple[tuple[str, str, str, str], ...] = ()   # (pattern, rule, fix, explanation key)
    distractor: str = ""                  # the wrong option of the last-chance choice
    topic: str | None = None              # es_tutor's error rules that apply here
    care: str = ""                        # an accepted answer that deserves a gentle line


@dataclass(frozen=True)
class Scenario:
    id: str
    target: str
    level: str
    title: dict
    steps: tuple[Step, ...]
    available: bool = True
    capability: str = ""
    words: tuple[str, ...] = field(default_factory=tuple)


def _t(en, es, pt, fr, it, de, ja, ar):
    return {"en": en, "es": es, "pt": pt, "fr": fr, "it": it, "de": de, "ja": ja, "ar": ar}


MY_NAME = "My name is Ana."
EN_NAME = Step(
    "name", "Hello! I'm Lingua. What's your name?", MY_NAME,
    (r"my name is {name}", r"i am {cname}", r"{cname}", r"people call me {name}", r"you can call me {name}", r"call me {name}", r"they call me {name}"),
    "Nice to meet you.",
    ((r"i name is {name}", "my_name", MY_NAME, "sc_my_name"), (r"me name is {name}", "my_name", MY_NAME, "sc_my_name"),
     (r"my name {cname}", "missing_be", MY_NAME, "sc_missing_be"), (r"name {cname}", "missing_be", MY_NAME, "sc_missing_be"),
     (r"my name are {name}", "be_form", MY_NAME, "sc_be_form"), (r"i am call(ed)? {name}", "my_name", MY_NAME, "sc_my_name"),
     (r"i call {name}", "my_name", MY_NAME, "sc_my_name"), (r"i call me {name}", "my_name", MY_NAME, "sc_my_name"),
     (r"my name it is {name}", "my_name", MY_NAME, "sc_my_name"), (r"i have name {name}", "my_name", MY_NAME, "sc_my_name")),
    "Name is Ana my.",
)
EN_FEEL = Step(
    "feel", "How are you today?", "I'm fine, thanks.",
    (r"(i am )?{feel}", r"(i am )?(a little|a bit|really|so) {feel}", r"i feel {feel}", r"i am doing (well|ok|okay|fine|good|great)",
     r"doing (well|ok|okay|fine|good|great)", r"not so good", r"pretty good", r"all good"),
    "Thanks for telling me.",
    ((r"i {feel}", "missing_be", "I am {feel}.", "sc_missing_be"), (r"i have (tired|hungry|cold|hot|sad|happy|busy)", "have_be", "I am tired.", "sc_have_be"),
     (r"i is {feel}", "be_form", "I am {feel}.", "sc_be_form"), (r"i are {feel}", "be_form", "I am {feel}.", "sc_be_form"),
     (r"me {feel}", "missing_be", "I am {feel}.", "sc_missing_be"), (r"am {feel}", "missing_subject", "I am {feel}.", "sc_missing_subject")),
    "I fine.", care=r"\b(sad|bad|sick|not good|not so good|not very well)\b",
)
FROM = "I am from Chile."
EN_FROM = Step(
    "from", "Where are you from?", "I'm from Chile.",
    (r"i am from {place}", r"from {place}", r"i come from {place}", r"i live in {place}", r"{cplace}", r"i am from {place} and i live in {place2}"),
    "Thanks.",
    ((r"i from {place}", "missing_be", FROM, "sc_missing_be"), (r"i am of {place}", "from_prep", FROM, "sc_from_prep"),
     (r"i come of {place}", "from_prep", "I come from Chile.", "sc_from_prep"), (r"i am come from {place}", "be_plus_verb", "I come from Chile.", "sc_be_plus_verb"),
     (r"i coming from {place}", "be_plus_verb", "I come from Chile.", "sc_be_plus_verb"), (r"i is from {place}", "be_form", FROM, "sc_be_form"),
     (r"i are from {place}", "be_form", FROM, "sc_be_form"), (r"am from {place}", "missing_subject", FROM, "sc_missing_subject")),
    "I from Chile.",
)
EN_BYE = Step(
    "bye", "I have to go now. Goodbye!", "Goodbye! See you soon.",
    (r"(good ?bye|bye|bye bye|see you|see you soon|see you later|see you tomorrow|have a nice day|have a good day)( see you( soon| later| tomorrow)?)?",
     r"thanks( for the practice)?", r"thank you( for the practice)?"),
    "See you soon.",
)
EN_ORDER = Step(
    "order", "Hello! Welcome to the cafe. What would you like to drink?", "I'd like a coffee, please.",
    (r"(i would like|i want|i will have|i will take|i need|can i have|could i have|may i have|can i get|could i get)( {art})? {drink}", r"({art} )?{drink}",
     r"(i would like|i want|i will have|can i have|could i have)( {art})? {drink} (and|with)( {art})? (milk|sugar|water|tea|coffee)"),
    "OK.",
    ((r"i like ({art} )?{drink}", "would_like", "I would like a {drink}.", "sc_would_like"), (r"i am want( {art})? {drink}", "be_plus_verb", "I want a {drink}.", "sc_be_plus_verb"),
     (r"i would to like( {art})? {drink}", "would_like", "I would like a {drink}.", "sc_would_like"), (r"i would likes( {art})? {drink}", "would_like", "I would like a {drink}.", "sc_would_like"),
     (r"i wants( {art})? {drink}", "third_person", "I want a {drink}.", "sc_third_person"), (r"want( {art})? {drink}", "missing_subject", "I want a {drink}.", "sc_missing_subject"),
     (r"can i has( {art})? {drink}", "third_person", "Can I have a {drink}?", "sc_third_person"), (r"give me( {art})? {drink}", "polite", "Can I have a {drink}, please?", "sc_polite")),
    "I like a coffee.",
)
EN_ELSE = Step(
    "else", "Anything else?", "No, thank you.",
    (r"no", r"no thank you", r"no thanks", r"nothing else", r"that is all", r"that is it", r"yes", r"(yes )?(i would like|i want|can i have|could i have|i will have)?( {art})? {food}", r"(and )?( {art})? {food}"),
    "OK. That's five dollars.",
    ((r"i like ({art} )?{food}", "would_like", "I would like {food}.", "sc_would_like"), (r"no nothing", "other_phrase", "No, nothing else.", "sc_generic")),
    "No anything.",
)
EN_PAY = Step(
    "pay", "Do you want to pay by card or with cash?", "By card, please.",
    (r"(i will pay |i want to pay |i pay )?(by|with) (card|cash|credit card)", r"(card|cash)", r"(i will pay |i pay )(cash|card)"),
    "Thank you. Have a nice day!",
    ((r"(with|by) the (card|cash)", "article_extra", "By card, please.", "sc_article_extra"), (r"in (card|cash)", "preposition", "By card, please.", "sc_preposition")),
    "On card.",
)
EN_LIKE = Step(
    "like", "What do you like?", "I like music.",
    (r"i (really )?(like|love|enjoy) {thing}( very much| a lot)?", r"i (really )?(like|love|enjoy) {food}( very much| a lot)?", r"{thing}", r"i (really )?(like|love) {thing} and {thing2}"),
    "Thanks for telling me.",
    ((r"i am like {thing}", "be_plus_verb", "I like {thing}.", "sc_be_plus_verb"), (r"i likes {thing}", "third_person", "I like {thing}.", "sc_third_person"),
     (r"me like {thing}", "missing_subject", "I like {thing}.", "sc_missing_subject"), (r"i like very much {thing}", "word_order", "I like {thing} very much.", "sc_word_order"),
     (r"i like the {thing}", "article_extra", "I like {thing}.", "sc_article_extra"), (r"like {thing}", "missing_subject", "I like {thing}.", "sc_missing_subject")),
    "I am like music.",
)
NO_TEA = "I don't like tea."
EN_DISLIKE = Step(
    "dislike", "What don't you like?", NO_TEA,
    (r"i do not (really )?like {thing}", r"i do not (really )?like {food}", r"i hate {thing}", r"i hate {food}", r"not {thing}", r"not {food}", r"nothing"),
    "OK.",
    ((r"i no like {any}", "negation", NO_TEA, "sc_negation"), (r"i not like {any}", "negation", NO_TEA, "sc_negation"),
     (r"i like not {any}", "negation", NO_TEA, "sc_negation"), (r"i am not like {any}", "negation", NO_TEA, "sc_negation"),
     (r"i does not like {any}", "third_person", NO_TEA, "sc_third_person")),
    "I no like tea.",
)
EN_FAV = Step(
    "food", "What food do you like?", "I like pizza.",
    (r"i (really )?(like|love) {food}( very much| a lot)?", r"{food}", r"i (really )?(like|love) {food} and {food2}", r"my favorite food is {food}", r"my favourite food is {food}"),
    "OK. Thanks.",
    ((r"i likes {food}", "third_person", "I like {food}.", "sc_third_person"), (r"i am like {food}", "be_plus_verb", "I like {food}.", "sc_be_plus_verb"),
     (r"i like the {food}", "article_extra", "I like {food}.", "sc_article_extra")),
    "I likes pizza.",
)
EN_COUNT = Step(
    "count", "How many apples do you want?", "Three apples, please.",
    (r"(i want |i would like |i need |can i have )?{number}( apples)?", r"(i want |i would like |i need |can i have )?one apple"),
    "OK.",
    ((r"(i want |i would like |i need )?(two|three|four|five|six|seven|eight|nine|ten) apple", "plural", "Three apples, please.", "sc_plural"), (r"one apples", "plural", "One apple, please.", "sc_plural")),
    "Three apple.",
)
HOW_MUCH = "How much is it?"
EN_PRICE = Step(
    "price", "You want to know the price. What do you ask?", HOW_MUCH,
    (r"how much( is| is it| is this| are they| does it cost| do they cost)?", r"how much (is|are) (it|this|that|they|the apples)", r"what is the price", r"how much for (it|this|the apples)", r"what does it cost"),
    "It's four dollars.",
    ((r"how much (it )?cost(s)?", "question_form", HOW_MUCH, "sc_question_form"), (r"how much it is", "word_order", HOW_MUCH, "sc_word_order"),
     (r"how many (is it|cost|costs|is this)", "much_many", HOW_MUCH, "sc_much_many"), (r"how much costs it", "question_form", HOW_MUCH, "sc_question_form")),
    "How many is it?",
)
EN_REPAIR1 = Step(
    "not_understood", "You did not understand me. What do you say?", "Sorry, I don't understand.",
    (r"(sorry )?i do not understand( you)?", r"(sorry )?i did not understand( you| that)?", r"(sorry )?what", r"(sorry )?pardon", r"excuse me"),
    "No problem.",
    ((r"(i )?no understand", "negation", "I don't understand.", "sc_negation"), (r"i not understand", "negation", "I don't understand.", "sc_negation"), (r"i am not understand", "negation", "I don't understand.", "sc_negation")),
    "I no understand.",
)
REPEAT = "Can you repeat that, please?"
EN_REPAIR2 = Step(
    "repeat", "Now ask me to say it again.", REPEAT,
    (r"(can|could|would) you (please )?(repeat|say) (that|it)( again)?", r"(can|could|would) you (please )?repeat", r"(please )?repeat( that| it)?", r"again", r"one more time", r"say (that|it) again"),
    "OK. I said: the bus is at nine.",
    ((r"you can repeat", "question_form", REPEAT, "sc_question_form"), (r"you repeat", "question_form", REPEAT, "sc_question_form"), (r"can you to repeat", "extra_to", REPEAT, "sc_extra_to")),
    "You repeat?",
)
SLOWLY = "Can you speak more slowly, please?"
EN_REPAIR3 = Step(
    "slow", "I spoke too fast. What do you say?", SLOWLY,
    (r"(can|could) you (please )?(speak|talk|go) (more )?(slowly|slower)", r"(more )?(slowly|slower)", r"(please )?(speak|talk) (more )?(slowly|slower)"),
    "OK. The bus. Is. At. Nine.",
    ((r"(can|could) you speak more slow", "adverb", SLOWLY, "sc_adverb"), (r"speak more slow", "adverb", "Speak more slowly, please.", "sc_adverb"), (r"you can speak (more )?(slowly|slower)", "question_form", SLOWLY, "sc_question_form")),
    "Speak more slow.",
)
EN_THIS = Step(
    "this", "Look at the picture: a book. What is this?", "It's a book.",
    (r"it is a book", r"this is a book", r"a book", r"book", r"that is a book"),
    "OK.",
    ((r"it is book", "article_missing", "It's a book.", "sc_article_missing"), (r"is a book", "missing_subject", "It's a book.", "sc_missing_subject"), (r"this is book", "article_missing", "This is a book.", "sc_article_missing"),
     (r"is book", "article_missing", "It's a book.", "sc_article_missing"), (r"it is an book", "article_form", "It's a book.", "sc_article_form")),
    "It is book.",
)
EN_THIS2 = Step(
    "this2", "Now: an apple. What is this?", "It's an apple.",
    (r"it is an apple", r"this is an apple", r"an apple", r"apple", r"that is an apple"),
    "OK.",
    ((r"it is a apple", "article_form", "It's an apple.", "sc_article_form"), (r"it is apple", "article_missing", "It's an apple.", "sc_article_missing"),
     (r"this is apple", "article_missing", "This is an apple.", "sc_article_missing"), (r"a apple", "article_form", "An apple.", "sc_article_form")),
    "It is a apple.",
)
EN_ROUTINE1 = Step(
    "wake", "What time do you get up?", "I get up at seven.",
    (r"i (usually )?(get up|wake up) at {number}( o clock| am| in the morning)?", r"at {number}( o clock| am)?", r"{number}( o clock| am)?"),
    "OK.",
    ((r"i (get up|wake up) in {number}", "time_at", "I get up at seven.", "sc_preposition"), (r"i am get up at {number}", "be_plus_verb", "I get up at seven.", "sc_be_plus_verb")),
    "I get up in seven.",
)
EN_ROUTINE2 = Step(
    "work", "What do you do in the morning?", "I work in the morning.",
    (r"i (usually )?(work|study|read|run|cook|eat breakfast|have breakfast)( in the morning)?",),
    "OK.",
    ((r"i working( in the morning)?", "be_plus_verb", "I work in the morning.", "sc_be_plus_verb"),),
    "I working.",
)

ES_NAME = Step(
    "name", "¡Hola! Me llamo Lingua. ¿Cómo te llamas?", "Me llamo Ana.",
    (r"me llamo {name}", r"mi nombre es {name}", r"soy {cname}", r"{cname}", r"me dicen {name}"),
    "Mucho gusto.", (), "Llamo es Ana.", "name",
)
ES_FEEL = Step(
    "feel", "¿Cómo estás hoy?", "Bien, gracias.",
    (r"(estoy )?{feel}", r"(estoy )?(un poco|muy|bastante) (bien|mal|cansado|cansada|ocupado|ocupada|triste|content[oa])", r"todo bien", r"me siento (bien|mal|regular)"),
    "Gracias por contarme.",
    ((r"yo bien", "es_missing_estar", "Estoy bien.", "sc_es_estar"), (r"estoy bueno|estoy buena", "es_bien_bueno", "Estoy bien.", "sc_es_bien")),
    "Soy bien.", "wellbeing", care=r"\b(triste|mal)\b",
)
ES_FROM = Step(
    "from", "¿De dónde eres?", "Soy de Chile.",
    (r"soy de {place}", r"de {place}", r"vengo de {place}", r"{cplace}", r"vivo en {place}",
     r"soy (estadounidense|american[oa]|chilen[oa]|mexican[oa]|canadiense|ingles|inglesa|argentin[oa]|colombian[oa]|peruan[oa]|australian[oa])"),
    "Gracias.",
    ((r"yo de {place}", "es_missing_ser", "Soy de Chile.", "sc_es_ser"), (r"es de {place}", "es_conjugation_ser", "Soy de Chile.", "sc_es_ser"), (r"estoy de {place}", "es_ser_estar_origin", "Soy de Chile.", "sc_es_ser")),
    "Estoy de Chile.", "origin",
)
ES_BYE = Step(
    "bye", "Me tengo que ir. ¡Hasta luego!", "¡Adiós, hasta luego!",
    (r"(adios|hasta luego|hasta manana|hasta pronto|chao|chau|nos vemos)( (adios|hasta luego|hasta manana|hasta pronto|nos vemos))?", r"(muchas )?gracias"),
    "Hasta pronto.",
)
ES_ORDER = Step(
    "order", "¡Hola! Bienvenido al café. ¿Qué quieres tomar?", "Un café, por favor.",
    (r"((quiero|quisiera|me da|me das|me pone|me pones|me trae|para mi|voy a tomar|necesito|tomo) )?({art} )?{drink}",),
    "Muy bien.",
    ((r"me gusta( {art})? {drink}", "es_want_like", "Quiero un café, por favor.", "sc_es_want"), (r"yo quiere( {art})? {drink}", "es_conjugation_yo", "Quiero un café, por favor.", "sc_es_yo"),
     (r"quiere( {art})? {drink}", "es_conjugation_yo", "Quiero un café, por favor.", "sc_es_yo")),
    "Una café, por favor.", "wants",
)
ES_ELSE = Step(
    "else", "¿Algo más?", "No, gracias.",
    (r"no", r"no gracias", r"nada mas", r"eso es todo", r"si", r"(si )?((quiero|quisiera|me da) )?({art} )?{food}", r"(y )?({art} )?{food}"),
    "Son cinco euros.", (), "No algo.", "wants",
)
ES_PAY = Step(
    "pay", "¿Quieres pagar con tarjeta o en efectivo?", "Con tarjeta, por favor.",
    (r"(voy a pagar |quiero pagar |pago )?(con tarjeta|en efectivo|con efectivo)", r"tarjeta", r"efectivo"),
    "Gracias. ¡Que tengas un buen día!",
    ((r"en tarjeta", "es_preposition_pay", "Con tarjeta, por favor.", "sc_es_prep"), (r"por tarjeta", "es_preposition_pay", "Con tarjeta, por favor.", "sc_es_prep")),
    "En tarjeta.",
)
ES_LIKE = Step(
    "like", "¿Qué te gusta?", "Me gusta la música.",
    (r"me (gusta|encanta)( mucho)?( el| la)? {thing}( mucho)?", r"me (gustan|encantan)( mucho)?( los| las)? {thing}( mucho)?", r"(el |la |los |las )?{thing}", r"me gusta (mucho )?(el |la )?{thing} y (el |la )?{thing2}"),
    "Gracias por contarme.",
    ((r"me gustan (el |la )?(musica|cine|futbol|cafe|te|chocolate|playa|pizza)", "es_gustar_plural", "Me gusta la música.", "sc_es_gustar"), (r"me gusta (los|las) {thing}", "es_gustar_singular", "Me gustan los libros.", "sc_es_gustar")),
    "Yo gusto música.", "likes",
)
ES_DISLIKE = Step(
    "dislike", "¿Qué no te gusta?", "No me gusta el té.",
    (r"no me gusta( nada)?( el| la)? {any}", r"no me gustan( nada)?( los| las)? {any}", r"nada"),
    "De acuerdo.",
    ((r"yo no gusto {any}", "es_gustar_structure", "No me gusta el té.", "sc_es_gustar"), (r"no gusto {any}", "es_gustar_structure", "No me gusta el té.", "sc_es_gustar")),
    "Me no gusta el té.", "likes",
)
ES_FOOD = Step(
    "food", "¿Qué comida te gusta?", "Me gusta la pizza.",
    (r"me (gusta|encanta)( mucho)?( el| la)? {food}( mucho)?", r"me (gustan|encantan)( mucho)?( los| las)? {food}", r"(el |la |los )?{food}"),
    "De acuerdo.", (), "Yo gusto pizza.", "likes",
)
ES_COUNT = Step(
    "count", "¿Cuántas manzanas quieres?", "Tres manzanas, por favor.",
    (r"(quiero |quisiera |necesito )?{number}( manzanas| manzana)?",),
    "Muy bien.",
    ((r"(quiero )?(dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez) manzana", "es_plural_number", "Tres manzanas, por favor.", "sc_es_plural"),
     (r"(quiero )?un manzana", "es_gender_article", "Una manzana, por favor.", "sc_es_article_gender"), (r"(quiero )?uno manzana", "es_uno_un", "Una manzana, por favor.", "sc_es_article_gender")),
    "Tres manzana.",
)
ES_PRICE = Step(
    "price", "Quieres saber el precio. ¿Qué preguntas?", "¿Cuánto cuesta?",
    (r"cuanto (cuesta|cuestan|es|vale|valen)", r"cuanto (cuesta|es|vale) (esto|eso)", r"que precio tiene", r"cual es el precio", r"cuanto (cuestan|valen) las manzanas"),
    "Son cuatro euros.",
    ((r"cuanto costa", "es_stem_change", "¿Cuánto cuesta?", "sc_es_stem"), (r"cuantos cuesta", "es_cuanto_form", "¿Cuánto cuesta?", "sc_es_cuanto"), (r"que cuesta", "es_cuanto_form", "¿Cuánto cuesta?", "sc_es_cuanto")),
    "¿Cuánto costa?",
)
ES_REPAIR1 = Step(
    "not_understood", "No me entendiste. ¿Qué dices?", "Perdón, no entiendo.",
    (r"(perdon |lo siento |disculpa |disculpe )?no (te |le )?entiendo", r"(perdon |lo siento )?no (te |le )?entendi", r"como", r"perdon", r"disculpa", r"disculpe"),
    "No pasa nada.",
    ((r"yo no entender", "es_infinitive_verb", "No entiendo.", "sc_es_infinitive"), (r"no entender", "es_infinitive_verb", "No entiendo.", "sc_es_infinitive")),
    "No entender.",
)
ES_REPAIR2 = Step(
    "repeat", "Ahora pídeme repetir.", "¿Puede repetir, por favor?",
    (r"(puede|puedes|podria|podrias) repetir(lo)?", r"(repite|repita)( otra vez)?", r"otra vez", r"de nuevo", r"(puede|puedes) decirlo otra vez"),
    "Claro. El autobús sale a las nueve.",
    ((r"repetir", "es_infinitive_command", "¿Puede repetir, por favor?", "sc_es_infinitive"), (r"tu repetir", "es_infinitive_command", "¿Puedes repetir, por favor?", "sc_es_infinitive"),
     (r"puedes repites", "es_infinitive_after_poder", "¿Puedes repetir, por favor?", "sc_es_infinitive")),
    "¿Tú repetir?",
)
ES_REPAIR3 = Step(
    "slow", "Hablé muy rápido. ¿Qué dices?", "Más despacio, por favor.",
    (r"mas despacio", r"(puede|puedes) hablar (mas )?despacio", r"(habla|hable) (mas )?despacio", r"(mas )?lento", r"despacio"),
    "Claro. El au-to-bús.",
    ((r"hablar despacio", "es_infinitive_command", "¿Puede hablar más despacio?", "sc_es_infinitive"),),
    "Hablar despacio.",
)
ES_THIS = Step(
    "this", "Mira la imagen: un libro. ¿Qué es esto?", "Es un libro.",
    (r"es un libro", r"esto es un libro", r"un libro", r"libro"),
    "Muy bien.",
    ((r"es una libro", "es_gender_article", "Es un libro.", "sc_es_article_gender"), (r"es libro", "es_missing_article_thing", "Es un libro.", "sc_es_article_missing"),
     (r"es el libro", "es_definite_indefinite", "Es un libro.", "sc_es_article_indefinite"), (r"esta un libro", "es_ser_estar_identity", "Es un libro.", "sc_es_ser")),
    "Es una libro.",
)
ES_THIS2 = Step(
    "this2", "Ahora: una mesa. ¿Qué es esto?", "Es una mesa.",
    (r"es una mesa", r"esto es una mesa", r"una mesa", r"mesa"),
    "Muy bien.",
    ((r"es un mesa", "es_gender_article", "Es una mesa.", "sc_es_article_gender"), (r"es mesa", "es_missing_article_thing", "Es una mesa.", "sc_es_article_missing"), (r"esta una mesa", "es_ser_estar_identity", "Es una mesa.", "sc_es_ser")),
    "Es un mesa.",
)
ES_WORK = Step(
    "work", "¿Trabajas o estudias?", "Trabajo en una oficina.",
    (r"(yo )?(trabajo|estudio)( en {place}| en una oficina| en casa| en un hospital| en una escuela| en la universidad)?", r"(yo )?(trabajo|estudio) y (trabajo|estudio)"),
    "De acuerdo.",
    ((r"(yo )?trabaja(r)?( en {place})?", "es_conjugation_yo", "Trabajo en una oficina.", "sc_es_yo"), (r"soy trabajo", "es_ser_plus_verb", "Trabajo en una oficina.", "sc_es_yo"),
     (r"(yo )?estudia(r)?( en {place})?", "es_conjugation_yo", "Estudio en la universidad.", "sc_es_yo")),
    "Yo trabajar.",
)
ES_LIVE = Step(
    "live", "¿Dónde vives?", "Vivo en Chicago.",
    (r"(yo )?vivo en {place}", r"en {place}"),
    "Gracias.",
    ((r"(yo )?vive en {place}", "es_conjugation_yo", "Vivo en Chicago.", "sc_es_yo"), (r"(yo )?vivir en {place}", "es_conjugation_yo", "Vivo en Chicago.", "sc_es_yo"), (r"estoy vivo en {place}", "es_estar_plus_verb", "Vivo en Chicago.", "sc_es_yo")),
    "Yo vivir en Chicago.",
)
ES_WAKE = Step(
    "wake", "¿A qué hora te levantas?", "Me levanto a las siete.",
    (r"(me levanto )?a las {number}", r"(me levanto )?a la una"),
    "De acuerdo.",
    ((r"levanto a las {number}", "es_missing_me", "Me levanto a las siete.", "sc_es_reflexive"), (r"me levanto en las {number}", "es_hour_prep", "Me levanto a las siete.", "sc_es_prep"), (r"me levanto a {number}", "es_hour_article", "Me levanto a las siete.", "sc_es_prep")),
    "Levanto a las siete.",
)

SCENARIOS = {s.id: s for s in (
    Scenario("en_meet", "en", "pre_a1", _t("Meet someone", "Conocer a alguien", "Conhecer alguém", "Rencontrer quelqu'un", "Conoscere qualcuno", "Jemanden kennenlernen", "人に会う", "التعرّف على شخص"), (EN_NAME, EN_FEEL, EN_FROM, EN_BYE), capability="introduce_self"),
    Scenario("en_cafe", "en", "pre_a1", _t("At the cafe", "En el café", "No café", "Au café", "Al bar", "Im Café", "カフェで", "في المقهى"), (EN_ORDER, EN_ELSE, EN_PAY), capability="cafe_order"),
    Scenario("en_likes", "en", "pre_a1", _t("What you like", "Lo que te gusta", "Do que você gosta", "Ce que tu aimes", "Cosa ti piace", "Was du magst", "好きなもの", "ما تحبّه"), (EN_LIKE, EN_DISLIKE, EN_FAV), capability="express_preferences"),
    Scenario("en_market", "en", "pre_a1", _t("At the market", "En el mercado", "No mercado", "Au marché", "Al mercato", "Auf dem Markt", "市場で", "في السوق"), (EN_COUNT, EN_PRICE, EN_PAY), capability="use_small_numbers"),
    Scenario("en_repair", "en", "pre_a1", _t("When you don't understand", "Cuando no entiendes", "Quando você não entende", "Quand tu ne comprends pas", "Quando non capisci", "Wenn du nicht verstehst", "わからないとき", "عندما لا تفهم"), (EN_REPAIR1, EN_REPAIR2, EN_REPAIR3), capability="ask_for_repair"),
    Scenario("en_things", "en", "pre_a1", _t("What is this?", "¿Qué es esto?", "O que é isto?", "Qu'est-ce que c'est ?", "Che cos'è?", "Was ist das?", "これは何？", "ما هذا؟"), (EN_THIS, EN_THIS2), capability="identify_things"),
    Scenario("en_a1_routine", "en", "a1", _t("Your morning", "Tu mañana", "Sua manhã", "Ton matin", "La tua mattina", "Dein Morgen", "あなたの朝", "صباحك"), (EN_ROUTINE1, EN_ROUTINE2), available=False, capability="talk_about_routine"),
    Scenario("es_meet", "es", "pre_a1", {"en": "Meet someone"}, (ES_NAME, ES_FEEL, ES_FROM, ES_BYE), capability="es:introduce_self"),
    Scenario("es_cafe", "es", "pre_a1", {"en": "At the cafe"}, (ES_ORDER, ES_ELSE, ES_PAY), capability="es:cafe_order"),
    Scenario("es_likes", "es", "pre_a1", {"en": "What you like"}, (ES_LIKE, ES_DISLIKE, ES_FOOD), capability="es:express_preferences"),
    Scenario("es_market", "es", "pre_a1", {"en": "At the market"}, (ES_COUNT, ES_PRICE, ES_PAY), capability="es:use_small_numbers"),
    Scenario("es_repair", "es", "pre_a1", {"en": "When you don't understand"}, (ES_REPAIR1, ES_REPAIR2, ES_REPAIR3), capability="es:ask_for_repair"),
    Scenario("es_things", "es", "pre_a1", {"en": "What is this?"}, (ES_THIS, ES_THIS2), capability="es:identify_things"),
    Scenario("es_a1_vida", "es", "a1", {"en": "Your life"}, (ES_WORK, ES_LIVE), available=False, capability="es:a1:talk_about_life"),
    Scenario("es_a1_dia", "es", "a1", {"en": "Your day"}, (ES_WAKE,), available=False, capability="es:a1:say_when"),
)}


def scenario_list(target: str, aux: str) -> list[dict]:
    """What a client may offer: open scenarios of this course, in the learner's language."""
    return [{"id": s.id, "level": s.level, "title": s.title.get(aux) or s.title["en"], "steps": len(s.steps), "opening": s.steps[0].ask}
            for s in SCENARIOS.values() if s.available and s.target == target]
