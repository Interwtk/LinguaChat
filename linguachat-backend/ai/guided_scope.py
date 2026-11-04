"""Guided chat: an allowlist of what the English tutor may react to.

Why this exists. A filter lists what is harmful, and independent evaluation
showed that list will always miss phrasing it has not seen. The damage of a miss
was the reply: the engine answered "Nice! Tell me one more thing." to a goodbye
note it could not read. So the safety of the beta does not rest on recognising
harm. It rests on reacting only to what is recognisably beginner practice:

  in scope      short, and every word belongs to the beginner vocabulary below
                (the sentence as corrected counts, so "I goed home" is in).
                The engine answers and corrects as usual.
  out of scope  anything else, in any language: the tutor does not praise, does
                not correct, does not quote. It says plainly that it cannot
                follow and offers a guided activity.

The vocabulary leaves out on purpose the words a beginner rarely needs and a
person in trouble might use (die, hurt, alone, secret, touch, gone, nobody...):
such a sentence loses its small talk, never its safety.

Limit, stated: a harmful sentence made only of ordinary words is in scope and
can get an ordinary reply. That reply carries no praise (`neutral_reply`) and
the chat always shows where to get help. This is not comprehension.
"""
from __future__ import annotations

import os
import re

MAX_WORDS = 18
MAX_CHARS = 140

CHAT_MODE_ENV = "LINGUACHAT_CHAT_MODE"


def guided_mode() -> bool:
    """Guided unless explicitly opened. Only tests of the bare engine open it."""
    return os.getenv(CHAT_MODE_ENV, "guided").strip().lower() != "open"


LEXICON = frozenset("""
a about after afternoon again all also always am an and any apple apples are arm art at aunt away bad bag ball banana bank
be beach beautiful because bed before beer bicycle big bike bird birthday black blue board boat body book books bookstore bottle bought bowl box boy bread
breakfast bring brother brown brought bus busy but buy by cafe cake call called came camera can car card cards carrot cat cats chair
cheap cheese chef chicken child children chocolate church cinema city class classes clean clock close clothes cloudy club coat coffee cold college color colors colour come comes
computer concert cook cooking cool corn could country cousin cream cup dad dance dancing dark date daughter day days dear
december degree dentist desk did dinner dish do doctor does dog dogs dollar don't done door down dress drink drinks drive driver drove
each early easy eat eaten eating egg eggs eight eighteen eighty eleven email engineer english enjoy evening every everyday everything exam example excuse expensive eye eyes
face factory fall family famous fan far farm fast father favorite favourite february feel feet fifteen fifth fifty film find fine finish first fish five floor flower flowers fly food foot football for forty four fourteen fourth free friday friend friends from fruit fun funny
game games garden gave get gets girl give glass go goes going gold golf good goodbye got grandfather grandmother grandma grandpa grass gray great green grey group grow guitar gym
had hair half hall hand hands happy has hat have he head hear heard hello help her here hers hi high hike hiking him his history hobby holiday home homework hospital hot hotel hour hours house how hundred hungry husband
i i'd i'll i'm i've ice idea if in inside interesting is it it's its jacket jam january japan job journey juice july jump june just
keep key kid kids kilo kind kitchen knew know knows lake lamp language languages laptop large last late later laugh learn learned learning leave left leg lemon lesson lessons let's letter library life like liked likes listen listening little live lived lives living long look looking lot love loved lunch
made mail make makes man many map march market married math maths may maybe me meal mean meat meet meeting menu mile milk million mine minute minutes mirror miss monday money month months moon more morning most mother mountain mouse mouth move movie movies mr mrs ms much mum museum music must my
name named names near need needs new news newspaper next nice night nine nineteen ninety no noon north nose not notebook nothing november now number nurse
o'clock ocean october of off office often oil ok okay old on once one onion only open or orange other our out outside over own
page paint painter pair pants paper parent parents park part party pasta pay pen pencil people pepper perhaps person phone photo photos piano picture pictures pie pink pizza place plan plane plant plants plate play played player playing plays please pm police pool poor popular potato potatoes practice practise prefer present pretty price problem pupil purple put
question questions quick quiet quite rabbit radio rain raining rainy ran read reading ready really red relax remember rent repeat rest restaurant return rice rich ride right river road room rose rugby run running
sad said salad salt same sandwich saturday saw say says school sea season seat second see seen sell send september seven seventeen seventy she shirt shoe shoes shop shopping short should show shower sick sing singer singing sister sit six sixteen sixty size skirt sky sleep sleeping slow small smile snow so soap soccer sock socks sofa some something sometimes son song songs soon sorry soup south spain spanish speak speaking spoon sport sports spring square stadium stairs stand star start station stay still stop store story street strong student students study studying subject sugar suit summer sun sunday sunny supermarket sure sweater sweet swim swimming
t-shirt table take takes talk talking tall taxi tea teach teacher team teeth telephone television tell ten tennis test text than thank thanks that that's the theater theatre their them then there these they thing things think third thirsty thirteen thirty this those thousand three thursday ticket time tired to today together tomato tomatoes tomorrow tonight too took tooth tourist tower town toy traffic train travel tree trip trousers truck try tuesday turn tv twelve twenty two
umbrella uncle under understand university until up us use used usually vacation vegetable vegetables very video view village visit visited visiting voice volleyball
wait waiter waitress wake walk walked walking wall want wanted wants warm was wash watch watched watching water way we wear weather wednesday week weekend weeks welcome well went were west what when where which white who why wife will win wind window windy wine winter with without woman women wonderful word words work worked worker working works world would write writer writing wrote
yeah year years yellow yes yesterday yet you you're young your yours zero zoo
explain since difference pronounce spell grammar sentence verb noun mean means correct wrong mistake practise
isn't aren't wasn't weren't doesn't didn't can't won't we're they're he's she's what's where's
""".split())

# A proper name is welcome where a name is expected: "My name is Ana", "I am from Peru".
SLOT_BEFORE = {"is", "are", "am", "i'm", "from", "in", "to", "called", "name", "named", "at", "visit", "and"}

WORD = re.compile(r"[^\W\d_]+(?:['’-][^\W\d_]+)*|\d+", re.UNICODE)


def _known(token: str) -> bool:
    w = token.lower().replace("’", "'")
    if w.isdigit() or w in LEXICON:
        return True
    for suffix, repl in (("'s", ""), ("ies", "y"), ("es", ""), ("s", ""), ("ing", ""), ("ing", "e"), ("ed", ""), ("ed", "e"), ("d", "")):
        if w.endswith(suffix) and len(w) > len(suffix) + 2 and w[: len(w) - len(suffix)] + repl in LEXICON:
            return True
    return False


def _sentence_in_scope(text: str) -> bool:
    tokens = WORD.findall(text)
    if not tokens or len(tokens) > MAX_WORDS or len(text) > MAX_CHARS:
        return False
    names = 0
    for i, token in enumerate(tokens):
        if _known(token):
            continue
        previous = tokens[i - 1].lower() if i else ""
        if token[0].isupper() and token.isascii() and previous in SLOT_BEFORE and names < 2:
            names += 1
            continue
        return False
    return True


def in_scope(message: str, corrected: str | None = None) -> bool:
    """True when the tutor may react to this English message."""
    return _sentence_in_scope(message) or (bool(corrected) and _sentence_in_scope(corrected))


# The engine's generic reaction said "Nice!" to whatever it could not read.
PRAISE_OPENERS = ("Nice! ", "Cool. ", "Nice choice. ", "That sounds interesting. ", "Interesting. ", "That's intriguing. ")


def neutral_reply(reply: str) -> str:
    """The same turn without the judgement: in guided chat nothing unread is praised."""
    for opener in PRAISE_OPENERS:
        if reply.startswith(opener):
            return "Thanks. " + reply[len(opener):]
    return reply
