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

def _alt(*words: str) -> str:
    """Longest first, so "orange juice" is not read as "orange"."""
    return "|".join(sorted({w for group in words for w in group.split(",")}, key=len, reverse=True))


EN_DRINK = "flat white,iced latte,mocha,chai,chai latte,coffee,tea,water,juice,orange juice,apple juice,milk,soda,cola,coke,lemonade,beer,wine,hot chocolate,black coffee,iced coffee,iced americano,americano,latte,cappuccino,espresso,green tea,iced tea,sparkling water,smoothie,mineral water"
EN_FOOD = ("pizza,pasta,rice,chicken,fish,fruit,bread,breads,cheese,chocolate,cake,cakes,salad,soup,sandwich,sandwiches,egg,eggs,apple,apples,banana,bananas,tacos,sushi,cookie,cookies,muffin,muffins,blueberry muffin,"
           "croissant,croissants,onion,onions,vegetables,tomatoes,potatoes,meat,beef,lamb,tajine,curry,noodles,ramen,dumplings,burger,burgers,hamburger,hamburgers,hot dog,hot dogs,fries,steak,pie,ice cream,yogurt,nuts,beans,tofu,mango,mangoes,"
           "oranges,grapes,strawberries,burrito,burritos,piece of cake,slice of cake,cookie,toast,bagel,donut,donuts,pancakes,waffles,sugar,biscuit,biscuits,spicy food,italian food,mexican food,chinese food,indian food,japanese food,korean food,thai food,street food,seafood,dessert,desserts,breakfast,lunch,dinner")
EN_THING = ("music,movies,films,books,sports,soccer,football,tennis,cats,dogs,travel,travelling,traveling,games,video games,dancing,reading,running,swimming,cooking,coffee,tea,art,history,nature,animals,mountains,the beach,beaches,rain,summer,winter,"
            "cold weather,hot weather,noise,traffic,mondays,shopping,walking,hiking,singing,drawing,painting,photography,yoga,the gym,basketball,baseball,volleyball,anime,manga,podcasts,languages,english,gardening,fishing,cycling,skiing,tv,television,"
            "my family,my friends,my dog,my cat")
EN_VERB = "swim,read,run,cook,dance,sing,travel,walk,draw,paint,eat,play soccer,play football,play tennis,play games,watch movies,listen to music"
ES_DRINK = "tinto,cafecito,mate,horchata,cafe,cafe con leche,cafe solo,cortado,te,te verde,agua,agua con gas,agua sin gas,agua mineral,jugo,jugo de naranja,zumo,zumo de naranja,leche,cerveza,vino,vino tinto,chocolate,chocolate caliente,refresco,limonada,gaseosa"
ES_FOOD = ("pizza,pasta,arroz,pollo,pescado,fruta,pan,queso,chocolate,sopa,ensalada,helado,sandwich,tacos,paella,tortilla,tortilla de patatas,bocadillo,pastel,croissant,cruasan,medialuna,empanada,empanadas,carne,verdura,verduras,huevos,"
           "tostada,tostadas,medialunas,churros,arepa,arepas,pollo asado,arroz con pollo,asado,pescado frito,manzanas,naranjas,platanos,mariscos,sushi,hamburguesa,hamburguesas,galletas,postre,comida italiana,comida mexicana,comida china,comida picante,comida japonesa")
ES_THING = ("musica,la musica,cine,futbol,tenis,cafe,te,chocolate,playa,pizza,deporte,deportes,comida,lectura,libros,peliculas,perros,gatos,baile,arte,historia,naturaleza,montaña,montañas,lluvia,verano,invierno,frio,calor,ruido,trafico,lunes,viajes,"
            "series,videojuegos,juegos,idiomas,baloncesto,natacion,yoga,animales,mi familia,mis amigos")
ES_VERB = "viajar,nadar,leer,correr,cocinar,bailar,cantar,caminar,dibujar,pintar,comer,escuchar musica,ver peliculas,jugar al futbol,jugar futbol,jugar al tenis,jugar tenis,estudiar,trabajar,dormir"

SLOTS = {
    "en": {
        "drink": _alt(EN_DRINK), "food": _alt(EN_FOOD), "thing": _alt(EN_THING), "verb": _alt(EN_VERB),
        "number": "one|two|three|four|five|six|seven|eight|nine|ten|[0-9]{1,2}",
        "feel": "very well|very good|not bad|so so|very tired|very happy|not good|not very well|fine|good|ok|okay|great|well|tired|happy|busy|hungry|cold|hot|sick|bad|sad",
        "art": "a cup of|a glass of|a bottle of|a|an|some|one|two",
        # everyday nouns from the guided vocabulary, which leaves out on purpose the
        # words a person in trouble might use (ai/guided_scope.py)
        "lex": "",
    },
    "es": {
        "drink": _alt(ES_DRINK), "food": _alt(ES_FOOD), "thing": _alt(ES_THING), "verb": _alt(ES_VERB), "lex": "",
        "number": "uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|[0-9]{1,2}",
        "feel": "muy bien|mas o menos|asi asi|muy cansado|muy cansada|bien|mal|regular|cansado|cansada|feliz|contento|contenta|genial|fenomenal|triste|ocupado|ocupada",
        "art": "un|una|el|la|dos|tres|unos|unas",
    },
}

# A mistake is a rewrite that turns the message into a valid answer of the step, so one
# rule serves every step and nothing else can pass: the result must still match whole.
REWRITES = {
    "en": (
        (r"\bi (is|are)\b", "i am", "be_form", "sc_be_form"), (r"\bit are\b", "it is", "be_form", "sc_be_form"), (r"\bthis are\b", "this is", "be_form", "sc_be_form"),
        (r"\bare this\b", "is this", "be_form", "sc_be_form"), (r"\bmy name are\b", "my name is", "be_form", "sc_be_form"),
        (r"\bdo not likes\b", "do not like", "third_person", "sc_third_person"), (r"\bi (likes|wants|needs|loves|has)\b", lambda m: "i " + {"has": "have"}.get(m[1], m[1][:-1]), "third_person", "sc_third_person"),
        (r"^(?:me|i) (?:no|not) ", "i do not ", "negation", "sc_negation"), (r"^me (like|want|need|love)\b", r"i \1", "missing_subject", "sc_missing_subject"),
        (r"^is (a |an )?", lambda m: f"it is {m[1] or ''}", "missing_subject", "sc_missing_subject"), (r"^(like|want|need|love|come from)\b", r"i \1", "missing_subject", "sc_missing_subject"),
        (r"\bi am (like|love|want|need|come)\b", r"i \1", "be_plus_verb", "sc_be_plus_verb"), (r"\bi (coming|liking|wanting)\b", lambda m: "i " + {"coming": "come", "liking": "like", "wanting": "want"}[m[1]], "be_plus_verb", "sc_be_plus_verb"),
        (r"\b(can|could) you (talking|speaking)\b", lambda m: f"{m[1]} you {m[2][:-3]}", "after_can", "sc_extra_to"), (r"\b(can|could) you to\b", r"\1 you", "extra_to", "sc_extra_to"),
        (r"\bi (like|love) eat\b", r"i \1 to eat", "verb_form", "sc_generic"), (r"\bi would like (drink|eat) ", "i would like ", "verb_form", "sc_generic"),
        (r"\bbreads\b", "bread", "uncountable", "sc_generic"), (r"\btomatos\b", "tomatoes", "spelling", "sc_spelling"), (r"\bi am from in\b", "i am from", "preposition", "sc_preposition"),
        (r"^(i|you) am ", "i am ", "be_form", "sc_be_form"), (r"\ba (apple|orange|egg|americano)\b", r"an \1", "article_form", "sc_article_form"), (r"\ban (book|coffee|tea|pizza)\b", r"a \1", "article_form", "sc_article_form"),
        (r"^i (am )?(fine|good|tired|happy|busy|hungry|sad|sick)\b", r"i am \2", "missing_be", "sc_missing_be"), (r"^nice meet you\b", "nice to meet you", "missing_to", "sc_generic"),
    ),
    "es": (
        (r"\b(yo )?(?:esta|es) (bien|mal|cansado|cansada|feliz|content[oa]|triste)\b", r"estoy \2", "es_conjugation_yo", "sc_es_yo"), (r"^(yo )?es de\b", "soy de", "es_conjugation_ser", "sc_es_ser"),
        (r"^yo (paga|pagar)\b", "pago", "es_conjugation_yo", "sc_es_yo"), (r"^(yo )?(trabaja|estudia|vive|quiere)\b", lambda m: {"trabaja": "trabajo", "estudia": "estudio", "vive": "vivo", "quiere": "quiero"}[m[2]], "es_conjugation_yo", "sc_es_yo"),
        (r"\buno (?=[a-zñ])", "un ", "es_uno_un", "sc_es_article_gender"), (r"\bmi gusta\b", "me gusta", "es_mi_me", "sc_es_gustar"), (r"\bno mi gusta\b", "no me gusta", "es_mi_me", "sc_es_gustar"),
        (r"\bme gusta (los|las)\b", r"me gustan \1", "es_gustar_plural", "sc_es_gustar"), (r"\bno me gusta (los|las)\b", r"no me gustan \1", "es_gustar_plural", "sc_es_gustar"),
        (r"^yo llamo\b", "me llamo", "es_missing_me", "sc_es_reflexive"), (r"^mi nombre (?!es\b)", "mi nombre es ", "es_missing_es", "sc_es_ser"), (r"\bun (mesa|manzana|pizza)\b", r"una \1", "es_gender_article", "sc_es_article_gender"),
        (r"\buna (libro|cafe|te|pastel|bocadillo|sandwich)\b", r"un \1", "es_gender_article", "sc_es_article_gender"), (r"\bes toda$", "es todo", "es_gender_article", "sc_es_article_gender"),
        (r"\bpuedes dices\b", "puedes decirlo", "es_infinitive_after_poder", "sc_es_infinitive"), (r"^tu hablar\b", "habla", "es_infinitive_command", "sc_es_infinitive"), (r"\bhasta maña$", "hasta mañana", "spelling", "sc_spelling"),
    ),
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
    (r"my name is {name}", r"the name is {name}", r"it is {cname}", r"i am {cname}", r"{cname}", r"people call me {name}", r"you can call me {name}", r"call me {name}", r"they call me {name}"),
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
    (r"(i am )?{feel}", r"(i am )?(a little|a bit|really|so) {feel}( but (ok|okay|fine|good))?", r"i feel {feel}", r"i am doing (well|ok|okay|fine|good|great)",
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
    (r"i am from {place}", r"from {place}", r"i come from {place}", r"i live in {place}", r"{cplace}", r"i am from {place} and i live in {place2}", r"i am from {place} but i live in {place2}",
     r"i am from a (small |big )?(town|city|village) (near|in) {place}"),
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
     r"thanks( for the practice)?", r"thank you( for the practice)?", r"nice to meet you( too)?", r"take care", r"good night", r"see you next time", r"have a (nice|good|great) (day|evening|night)"),
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
    (r"no", r"no thank you", r"no thanks", r"nothing else", r"that is all", r"that is it", r"just that", r"that is everything", r"yes",
     r"(yes )?((i would like|i want|can i have|could i have|i will have) )?({art} )?{food}( too| as well)?", r"(and )?({art} )?{food}( too| as well)?"),
    "OK. That's five dollars.",
    ((r"i like ({art} )?{food}", "would_like", "I would like {food}.", "sc_would_like"), (r"no nothing", "other_phrase", "No, nothing else.", "sc_generic")),
    "No anything.",
)
EN_PAY = Step(
    "pay", "Do you want to pay by card or with cash?", "By card, please.",
    (r"(i will pay |i want to pay |i pay |i would like to pay |i prefer to pay )?(by|with)( my| a)? (card|cash|credit card|debit card)", r"(credit card|debit card|card|cash)", r"(i will pay |i pay )(cash|card)",
     r"i will use( my| a)? (card|credit card|debit card|phone)", r"(cash|card) is (fine|ok|okay|good)",
     r"(with|by) (my )?(phone|mobile|apple pay|google pay)", r"contactless( card)?", r"(card|cash) if possible"),
    "Thank you. Have a nice day!",
    ((r"(with|by) the (card|cash)", "article_extra", "By card, please.", "sc_article_extra"), (r"in (card|cash)", "preposition", "By card, please.", "sc_preposition")),
    "On card.",
)
EN_LIKE = Step(
    "like", "What do you like?", "I like music.",
    (r"i (really )?(like|love|enjoy) {thing}( very much| a lot)?", r"i (really )?(like|love|enjoy) {food}( very much| a lot)?", r"{thing}", r"{food}", r"i (really )?(like|love) {thing} and {thing2}", r"i (really )?(like|love|enjoy) to {verb}", r"i (really )?(like|love|enjoy) {verb}ing", r"i (really )?(like|love|enjoy) (my |the )?{lex}( very much| a lot)?"),
    "Thanks for telling me.",
    ((r"i am like {thing}", "be_plus_verb", "I like {thing}.", "sc_be_plus_verb"), (r"i likes {thing}", "third_person", "I like {thing}.", "sc_third_person"),
     (r"me like {thing}", "missing_subject", "I like {thing}.", "sc_missing_subject"), (r"i like very much {thing}", "word_order", "I like {thing} very much.", "sc_word_order"),
     (r"i like the {thing}", "article_extra", "I like {thing}.", "sc_article_extra"), (r"like {thing}", "missing_subject", "I like {thing}.", "sc_missing_subject")),
    "I am like music.",
)
NO_TEA = "I don't like tea."
EN_DISLIKE = Step(
    "dislike", "What don't you like?", NO_TEA,
    (r"i do not (really )?like {thing}", r"i do not (really )?like {food}", r"i (hate|dislike) {thing}", r"i (hate|dislike) {food}", r"not {thing}", r"not {food}", r"{thing}", r"{food}", r"nothing( i like everything)?", r"i like everything", r"i do not (really )?like to {verb}", r"i do not (really )?like (my |the )?{lex}"),
    "OK.",
    ((r"i no like {any}", "negation", NO_TEA, "sc_negation"), (r"i not like {any}", "negation", NO_TEA, "sc_negation"),
     (r"i like not {any}", "negation", NO_TEA, "sc_negation"), (r"i am not like {any}", "negation", NO_TEA, "sc_negation"),
     (r"i does not like {any}", "third_person", NO_TEA, "sc_third_person")),
    "I no like tea.",
)
EN_FAV = Step(
    "food", "What food do you like?", "I like pizza.",
    (r"i (really )?(like|love) {food}( very much| a lot)?", r"{food}", r"i (really )?(like|love) {food} and {food2}", r"my favou?rite food is {food}", r"i (really )?(like|love) {food} with {food2}"),
    "OK. Thanks.",
    ((r"i likes {food}", "third_person", "I like {food}.", "sc_third_person"), (r"i am like {food}", "be_plus_verb", "I like {food}.", "sc_be_plus_verb"),
     (r"i like the {food}", "article_extra", "I like {food}.", "sc_article_extra")),
    "I likes pizza.",
)
EN_COUNT = Step(
    "count", "How many apples do you want?", "Three apples, please.",
    (r"(i want |i would like |i need |can i have |just |only )?{number}( apples)?", r"(i want |i would like |i need |can i have |just |only )?one apple", r"(one|a|half a) (kilo|kg|pound|bag)( of apples)?", r"a few"),
    "OK.",
    ((r"(i want |i would like |i need )?(two|three|four|five|six|seven|eight|nine|ten) apple", "plural", "Three apples, please.", "sc_plural"), (r"one apples", "plural", "One apple, please.", "sc_plural")),
    "Three apple.",
)
HOW_MUCH = "How much is it?"
EN_PRICE = Step(
    "price", "You want to know the price. What do you ask?", HOW_MUCH,
    (r"how much( is| is it| is this| are they| does it cost| do they cost)?", r"how much (is|are) (it|this|that|they|the apples)", r"what is the price", r"how much for (it|this|that|them|the apples|{number} apples)", r"what does it cost", r"how much (do|does) (it|they|the apples) cost", r"what is the price of (it|this|the apples)", r"price"),
    "It's four dollars.",
    ((r"how much (it )?cost(s)?", "question_form", HOW_MUCH, "sc_question_form"), (r"how much are (it|this)", "be_form", HOW_MUCH, "sc_be_form"), (r"how much it is", "word_order", HOW_MUCH, "sc_word_order"),
     (r"how many (is it|cost|costs|is this)", "much_many", HOW_MUCH, "sc_much_many"), (r"how much costs it", "question_form", HOW_MUCH, "sc_question_form")),
    "How many is it?",
)
EN_REPAIR1 = Step(
    "not_understood", "You did not understand me. What do you say?", "Sorry, I don't understand.",
    (r"(sorry )?i do not understand( you)?", r"(sorry )?i did not understand( you| that)?", r"(sorry )?what", r"(sorry )?pardon", r"excuse me", r"sorry", r"(sorry )?i do not get it"),
    "No problem.",
    ((r"(i )?no understand", "negation", "I don't understand.", "sc_negation"), (r"i not understand", "negation", "I don't understand.", "sc_negation"), (r"i am not understand", "negation", "I don't understand.", "sc_negation")),
    "I no understand.",
)
REPEAT = "Can you repeat that, please?"
EN_REPAIR2 = Step(
    "repeat", "Now ask me to say it again.", REPEAT,
    (r"(can|could|would) you (please )?(repeat|say) (that|it)( again)?", r"(can|could|would) you (please )?repeat", r"(please )?repeat( that| it)?", r"again", r"one more time", r"say (that|it) again", r"would you mind saying that again", r"(can|could) you say (that|it) one more time", r"what did you say", r"(please )?say (that|it) again"),
    "OK. I said: the bus is at nine.",
    ((r"you can repeat", "question_form", REPEAT, "sc_question_form"), (r"you repeat", "question_form", REPEAT, "sc_question_form"), (r"can you to repeat", "extra_to", REPEAT, "sc_extra_to")),
    "You repeat?",
)
SLOWLY = "Can you speak more slowly, please?"
EN_REPAIR3 = Step(
    "slow", "I spoke too fast. What do you say?", SLOWLY,
    (r"(can|could) you (please )?(speak|talk|go) (a bit |a little |more )?(more )?(slowly|slower)", r"(more )?(slowly|slower)", r"(please )?(speak|talk) (a bit |a little |more )?(slowly|slower)", r"not so fast", r"too fast", r"slow down"),
    "OK. The bus. Is. At. Nine.",
    ((r"(can|could) you speak more slow", "adverb", SLOWLY, "sc_adverb"), (r"speak more slow", "adverb", "Speak more slowly, please.", "sc_adverb"), (r"you can speak (more )?(slowly|slower)", "question_form", SLOWLY, "sc_question_form")),
    "Speak more slow.",
)
EN_THIS = Step(
    "this", "Look at the picture: a book. What is this?", "It's a book.",
    (r"(it is|this is|that is)? ?a (new |big |small |good |old |red |blue |green |black |white )?book", r"book"),
    "OK.",
    ((r"it is book", "article_missing", "It's a book.", "sc_article_missing"), (r"is a book", "missing_subject", "It's a book.", "sc_missing_subject"), (r"this is book", "article_missing", "This is a book.", "sc_article_missing"),
     (r"is book", "article_missing", "It's a book.", "sc_article_missing"), (r"it is an book", "article_form", "It's a book.", "sc_article_form")),
    "It is book.",
)
EN_THIS2 = Step(
    "this2", "Now: an apple. What is this?", "It's an apple.",
    (r"(it is|this is|that is)? ?an apple( a (red|green|big|small) apple)?", r"(it is|this is|that is)? ?a (red|green|big|small) apple", r"apple"),
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
    (r"me llamo {name}", r"mi nombre es {name}", r"soy {cname}", r"{cname}", r"me dicen {name}", r"me llaman {name}"),
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
     r"soy (estadounidense|american[oa]|chilen[oa]|mexican[oa]|canadiense|ingles|inglesa|argentin[oa]|colombian[oa]|peruan[oa]|australian[oa]|irlandes|irlandesa|escoces|escocesa|frances|francesa|aleman|alemana|japones|japonesa|chin[oa]|brasileñ[oa]|italian[oa]|español|española|britanic[oa]|indi[oa]|coreano|coreana|filipin[oa]|nigerian[oa]|marroqui)",
     r"soy de {place} pero vivo en {place2}", r"soy de {place} y vivo en {place2}"),
    "Gracias.",
    ((r"yo de {place}", "es_missing_ser", "Soy de Chile.", "sc_es_ser"), (r"es de {place}", "es_conjugation_ser", "Soy de Chile.", "sc_es_ser"), (r"estoy de {place}", "es_ser_estar_origin", "Soy de Chile.", "sc_es_ser")),
    "Estoy de Chile.", "origin",
)
ES_BYE = Step(
    "bye", "Me tengo que ir. ¡Hasta luego!", "¡Adiós, hasta luego!",
    (r"(adios|hasta luego|hasta mañana|hasta pronto|chao|chau|nos vemos|cuidate|que te vaya bien)( (adios|hasta luego|hasta mañana|hasta pronto|nos vemos|cuidate|amig[oa]|lingua))?", r"(muchas )?gracias", r"que tengas (un )?buen dia"),
    "Hasta pronto.",
)
ES_ORDER = Step(
    "order", "¡Hola! Bienvenido al café. ¿Qué quieres tomar?", "Un café, por favor.",
    (r"((quiero|quisiera|me da|me das|me pone|me pones|me trae|para mi|voy a tomar|necesito|tomo|prefiero) )?({art} )?{drink}",),
    "Muy bien.",
    ((r"me gusta( {art})? {drink}", "es_want_like", "Quiero un café, por favor.", "sc_es_want"), (r"yo quiere( {art})? {drink}", "es_conjugation_yo", "Quiero un café, por favor.", "sc_es_yo"),
     (r"quiere( {art})? {drink}", "es_conjugation_yo", "Quiero un café, por favor.", "sc_es_yo")),
    "Una café, por favor.", "wants",
)
ES_ELSE = Step(
    "else", "¿Algo más?", "No, gracias.",
    (r"no", r"no gracias", r"nada mas", r"eso es todo", r"no todo bien", r"todo bien", r"si", r"(si )?((quiero|quisiera|me da) )?({art} )?{food}", r"(y |tambien )?({art} )?{food}"),
    "Son cinco euros.", (), "No algo.", "wants",
)
ES_PAY = Step(
    "pay", "¿Quieres pagar con tarjeta o en efectivo?", "Con tarjeta, por favor.",
    (r"(voy a pagar |quiero pagar |pago |prefiero pagar )?(con( la| mi)? tarjeta( de credito| de debito)?|en efectivo|con efectivo|al contado|con billetes|con( el| mi)? (celular|movil|telefono))", r"tarjeta", r"efectivo", r"prefiero (tarjeta|efectivo)"),
    "Gracias. ¡Que tengas un buen día!",
    ((r"en tarjeta", "es_preposition_pay", "Con tarjeta, por favor.", "sc_es_prep"), (r"por tarjeta", "es_preposition_pay", "Con tarjeta, por favor.", "sc_es_prep")),
    "En tarjeta.",
)
ES_LIKE = Step(
    "like", "¿Qué te gusta?", "Me gusta la música.",
    (r"(a mi )?me (gusta|encanta)( mucho)?( el| la)? {thing}( mucho)?", r"(a mi )?me (gustan|encantan)( mucho)?( los| las)? {thing}( mucho)?", r"(el |la |los |las )?{thing}", r"me gusta (mucho )?(el |la )?{thing} y (el |la )?{thing2}", r"(a mi )?me (gusta|encanta)( mucho)? {verb}( y {verb2})?", r"{verb}"),
    "Gracias por contarme.",
    ((r"me gustan (el |la )?(musica|cine|futbol|cafe|te|chocolate|playa|pizza)", "es_gustar_plural", "Me gusta la música.", "sc_es_gustar"), (r"me gusta (los|las) {thing}", "es_gustar_singular", "Me gustan los libros.", "sc_es_gustar")),
    "Yo gusto música.", "likes",
)
ES_DISLIKE = Step(
    "dislike", "¿Qué no te gusta?", "No me gusta el té.",
    (r"no me gusta( nada)?( el| la)? {any}", r"no me gustan( nada)?( los| las)? {any}", r"(el |la )?({food}|{thing}) no me gusta", r"nada( me gusta todo)?", r"me gusta todo", r"(el |la |los |las )?{thing}", r"(el |la |los |las )?{food}"),
    "De acuerdo.",
    ((r"yo no gusto {any}", "es_gustar_structure", "No me gusta el té.", "sc_es_gustar"), (r"no gusto {any}", "es_gustar_structure", "No me gusta el té.", "sc_es_gustar"),
     (r"no me gustan (el|la) {any}", "es_gustar_plural", "No me gusta el pescado.", "sc_es_gustar")),
    "Me no gusta el té.", "likes",
)
ES_FOOD = Step(
    "food", "¿Qué comida te gusta?", "Me gusta la pizza.",
    (r"me (gusta|encanta)( mucho)?( el| la)? {food}( mucho)?", r"me (gustan|encantan)( mucho)?( los| las)? {food}", r"(el |la |los |las )?{food}", r"mi comida favorita es (el |la |los |las )?{food}"),
    "De acuerdo.", (), "Yo gusto pizza.", "likes",
)
ES_COUNT = Step(
    "count", "¿Cuántas manzanas quieres?", "Tres manzanas, por favor.",
    (r"(quiero |quisiera |necesito |solo |solamente )?{number}( manzanas| manzana)?", r"(un|medio) kilo", r"un kilo de manzanas", r"unas pocas"),
    "Muy bien.",
    ((r"(quiero )?(dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez) manzana", "es_plural_number", "Tres manzanas, por favor.", "sc_es_plural"),
     (r"(quiero )?un manzana", "es_gender_article", "Una manzana, por favor.", "sc_es_article_gender"), (r"(quiero )?uno manzana", "es_uno_un", "Una manzana, por favor.", "sc_es_article_gender")),
    "Tres manzana.",
)
ES_PRICE = Step(
    "price", "Quieres saber el precio. ¿Qué preguntas?", "¿Cuánto cuesta?",
    (r"cuanto (cuesta|cuestan|es|vale|valen|sale|salen)", r"cuanto (cuesta|es|vale) (esto|eso)", r"que precio tiene", r"cual es el precio", r"cuanto (cuestan|valen) las manzanas", r"cuanto (le|te) debo", r"precio"),
    "Son cuatro euros.",
    ((r"cuanto costa", "es_stem_change", "¿Cuánto cuesta?", "sc_es_stem"), (r"cuantos cuesta", "es_cuanto_form", "¿Cuánto cuesta?", "sc_es_cuanto"), (r"que cuesta", "es_cuanto_form", "¿Cuánto cuesta?", "sc_es_cuanto")),
    "¿Cuánto costa?",
)
ES_REPAIR1 = Step(
    "not_understood", "No me entendiste. ¿Qué dices?", "Perdón, no entiendo.",
    (r"(perdon |lo siento |disculpa |disculpe )?no (te |le )?entiendo", r"(perdon |lo siento )?no (te |le )?entendi", r"como", r"perdon", r"disculpa", r"disculpe", r"no entiendo nada", r"no comprendo", r"mande", r"(puede|puedes) repetir"),
    "No pasa nada.",
    ((r"yo no entender", "es_infinitive_verb", "No entiendo.", "sc_es_infinitive"), (r"no entender", "es_infinitive_verb", "No entiendo.", "sc_es_infinitive")),
    "No entender.",
)
ES_REPAIR2 = Step(
    "repeat", "Ahora pídeme repetir.", "¿Puede repetir, por favor?",
    (r"(puede|puedes|podria|podrias) repetir(lo)?", r"(repite|repita)( otra vez)?", r"otra vez", r"de nuevo", r"(puede|puedes) decirlo otra vez", r"(me lo|lo) (repites|repite)", r"dilo otra vez", r"digalo otra vez", r"repeti", r"repetilo"),
    "Claro. El autobús sale a las nueve.",
    ((r"repetir", "es_infinitive_command", "¿Puede repetir, por favor?", "sc_es_infinitive"), (r"tu repetir", "es_infinitive_command", "¿Puedes repetir, por favor?", "sc_es_infinitive"),
     (r"puedes repites", "es_infinitive_after_poder", "¿Puedes repetir, por favor?", "sc_es_infinitive")),
    "¿Tú repetir?",
)
ES_REPAIR3 = Step(
    "slow", "Hablé muy rápido. ¿Qué dices?", "Más despacio, por favor.",
    (r"mas despacio", r"(mas )?despacito", r"(puede|puedes) hablar (mas )?(despacio|lento|despacito)", r"(habla|hable|habla vos) (mas )?(despacio|lento)", r"(mas )?lento", r"despacio"),
    "Claro. El au-to-bús.",
    ((r"hablar despacio", "es_infinitive_command", "¿Puede hablar más despacio?", "sc_es_infinitive"),),
    "Hablar despacio.",
)
ES_THIS = Step(
    "this", "Mira la imagen: un libro. ¿Qué es esto?", "Es un libro.",
    (r"(es|esto es|eso es)? ?un libro( (?:azul|azules|rojo|roja|verde|negro|negra|blanco|blanca|amarillo|amarilla|grande|pequeño|pequeña|nuevo|nueva|viejo|vieja|bonito|bonita|de madera|de español|de ingles|de cocina|de la escuela))?( verdad)?", r"libro"),
    "Muy bien.",
    ((r"es una libro", "es_gender_article", "Es un libro.", "sc_es_article_gender"), (r"es libro", "es_missing_article_thing", "Es un libro.", "sc_es_article_missing"),
     (r"es el libro", "es_definite_indefinite", "Es un libro.", "sc_es_article_indefinite"), (r"esta un libro", "es_ser_estar_identity", "Es un libro.", "sc_es_ser")),
    "Es una libro.",
)
ES_THIS2 = Step(
    "this2", "Ahora: una mesa. ¿Qué es esto?", "Es una mesa.",
    (r"(es|esto es|eso es)? ?una mesa( (?:azul|azules|rojo|roja|verde|negro|negra|blanco|blanca|amarillo|amarilla|grande|pequeño|pequeña|nuevo|nueva|viejo|vieja|bonito|bonita|de madera|de español|de ingles|de cocina|de la escuela))?( verdad)?", r"mesa", r"es la mesa"),
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
