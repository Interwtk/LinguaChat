"""Tutor safety — one input/output policy for every conversation, on the server.

Lingua is an educational tutor suitable for every audience, even though the
beta is for adults. Every chat turn passes through `assess()` BEFORE any engine
or provider sees it, and every reply passes through `screen_reply()` before it
leaves; the frontend may add notices, but it is never the only barrier.

How it decides (not a bare word list):
  1. Normalise what people do to slip past filters: Unicode compatibility forms,
     zero-width characters, homoglyphs, leetspeak, letters split by spaces or
     dots, Arabic diacritics/letter variants, katakana vs hiragana.
  2. Look for categories in four languages (en, es, ja, ar) plus the shared
     Latin forms of pt/fr/it/de where they coincide.
  3. Combine signals instead of trusting one word: sexual + minor is the most
     serious category; a sexual word on its own is refused only when it is a
     REQUEST for explicit content; "kill" is a threat only with a target.
  4. Let legitimate questions through: asking how to SAY or what a word MEANS
     ("¿cómo se dice 'bomba'?") is language learning; health, prevention and
     protection questions get a useful, safe answer instead of a refusal.

What it cannot do (documented in docs/legal/age-and-safety-policy.md): understand
irony, long multi-turn manipulation, unseen slang or languages outside its
lexicons. It errs towards a calm redirection, and never stores what it blocks.

Nothing here logs message text: only the category and the action.
"""
from __future__ import annotations

import logging
import re
import unicodedata
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

ALLOW = "allow"
REFUSE = "refuse"          # do not answer the request; redirect to learning
SUPPORT = "support"        # wellbeing or protection: a caring, useful reply
WARN_PII = "warn_pii"      # sensitive personal data: warn, do not keep or echo
DEFLECT = "deflect"        # manipulation or rudeness toward the tutor: stay in role

CATEGORIES = (
    "minor_sexual", "child_protection", "being_harmed", "sexual_explicit", "self_harm", "violence_threat",
    "dangerous_instructions", "hate", "harassment", "personal_data", "personal_info_request",
    "prompt_injection",
)


@dataclass(frozen=True)
class Verdict:
    action: str = ALLOW
    category: str | None = None
    care_note: bool = False           # allowed, but add the wellbeing line (language question about self-harm)
    signals: tuple = field(default_factory=tuple)

    @property
    def blocked(self) -> bool:
        return self.action != ALLOW


# --------------------------------------------------------------- normalising

_ZERO_WIDTH = dict.fromkeys(map(ord, "​‌‍⁠﻿­"), None)
_HOMOGLYPHS = str.maketrans({"а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "х": "x", "у": "y", "і": "i", "ѕ": "s", "ԁ": "d", "ɡ": "g"})
_LEET = str.maketrans({"0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i"})
_AR_DIACRITICS = re.compile("[ؐ-ًؚ-ٰٟۖ-ۭـ]")
_AR_LETTERS = str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ى": "ي", "ؤ": "و", "ئ": "ي", "ة": "ه"})


_AR_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹", "01234567890123456789")


def _katakana_to_hiragana(text: str) -> str:
    return "".join(chr(ord(ch) - 0x60) if "ァ" <= ch <= "ヶ" else ch for ch in text)


def _strip_accents(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text)
    return unicodedata.normalize("NFC", "".join(ch for ch in decomposed if not ("̀" <= ch <= "ͯ") or ch == "̃"))


def normalize(text: str) -> str:
    """Lowercase, compatibility-folded text with evasions undone (keeps ñ)."""
    s = unicodedata.normalize("NFKC", str(text or "")).translate(_ZERO_WIDTH)
    s = s.casefold().translate(_HOMOGLYPHS)
    s = _AR_DIACRITICS.sub("", s).translate(_AR_LETTERS)
    s = _katakana_to_hiragana(s)
    s = _strip_accents(s)
    return s.translate(_AR_DIGITS)


def _latin_variants(s: str) -> list[str]:
    """The text as written, with leetspeak undone, and with split letters joined."""
    leet = s.translate(_LEET)
    # "s e x", "s.e.x", "s-e-x" → "sex": join runs of single letters separated by one mark
    run = r"\b(?:[a-zñ][\s.\-_*]){2,}[a-zñ]\b"

    def join(m: re.Match) -> str:
        return re.sub(r"[\s.\-_*]", "", m.group(0))

    joined = re.sub(run, join, leet)
    # "a b o m b" also reads "a bomb": a one-letter word before the run stays apart
    apart = re.sub(run, join, re.sub(r"(?<=[a-zñ]{2} )([aeiouy]) (?=[a-zñ][\s.\-_*][a-zñ])", r"\1  ", leet))
    # "sui.cide", "sui-cidio": a mark inside a word is not a word break
    glued = re.sub(r"(?<=[a-zñ])[.\-_*](?=[a-zñ])", "", leet)
    return list(dict.fromkeys([s, leet, joined, apart, glued]))


# ---------------------------------------------------------------- lexicons

# Someone says they are being hurt or are not safe. Disclosure, not a threat.
PERSON = r"(?:partner|husband|wife|boyfriend|girlfriend|dad|father|mom|mum|mother|stepdad|stepfather|stepmom|stepmother|brother|sister|uncle|boss|someone|somebody|esposo|esposa|marido|novio|novia|padre|madre|padrastro|madrastra|papa|mama|hermano|hermana|tio|jefe|alguien)"
BEING_HARMED = re.compile(PERSON + r"(?:\s+\S+){0,4}?\s+(?:hits me|beats me|hurts me|is hurting me|keeps hurting me|is following me|takes my money|me pega|me golpea|me hace dano|me sigue|me quita el dinero)\b"
                          r"|\b(?:not safe at home|no estoy (?:segura|seguro) en casa)\b")
# Latin entries are matched as whole words (prefix with `*` to allow a stem);
# Japanese and Arabic entries are matched as substrings of the normalised text.

def _compile(words: list[str]) -> re.Pattern:
    latin, other = [], []
    for w in words:
        w = normalize(w)
        if re.search(r"[a-zñ]", w):
            stem = w.endswith("*")
            core = re.escape(w.rstrip("*")).replace(r"\ ", r"\s+")
            latin.append(rf"\b{core}\w*" if stem else rf"\b{core}\b")
        else:
            other.append(re.escape(w))
    parts = latin + other
    return re.compile("|".join(parts)) if parts else re.compile(r"(?!x)x")


SEXUAL_EXPLICIT = _compile([
    "want sex", "sex with you", "sexy photo", "sexy photos", "fotos tuyas sin ropa", "hablame de sexo",
    "porn*", "nudes", "nude pics", "naked pics", "naked photos", "send nudes", "sexting", "blowjob", "handjob", "dick pic*", "horny",
    "erotic story", "erotic stories", "nsfw", "sex with me", "sex chat", "dirty talk", "sex scene", "sex scenes",
    "sex story", "sex stories", "explicit sex", "sexual roleplay", "in a sexual way", "de forma sexual", "de manera sexual", "talk dirty", "hablame sucio",
    "pornografia", "fotos desnuda", "fotos desnudo", "fotos desnudas", "foto desnuda", "fotos intimas", "sexo explicito", "follar", "follame",
    "mamada", "relato erotico", "chat sexual", "cachonda", "cachondo", "manda nudes", "escena de sexo", "escena sexual",
    "historia de sexo", "historia sexual", "rol sexual",
    "えろ動画", "えろい話", "ぽるの", "裸の写真", "あだると動画", "せっくすしよう", "おなにー",
    "اباحي", "اباحيه", "صور عاريه", "مضاجعه", "محادثه جنسيه",
])
# Asking the tutor to play a partner. Only matters together with sexual words.
ROLEPLAY = _compile([
    "act as my", "pretend to be my", "pretend you are my", "be my girlfriend", "be my boyfriend", "roleplay", "role play",
    "finge ser mi", "actua como mi", "se mi novia", "se mi novio", "what you'd do to me", "what you would do to me",
])
# Words that are sexual but not explicit by themselves ("sexual health"): they
# only matter combined with a minor.
SEXUAL_MILD = _compile([
    "sex", "sexy", "sexual*", "sexo", "sensual", "nude", "naked", "desnud*", "intim*", "have sex", "tener sexo", "masturbat*", "orgasm*",
    "せくしー", "せっくす", "性的", "性行為", "えろ", "جنسي", "جنسيه", "الجنس", "ممارسه الجنس", "عاريه", "استمناء",
])
MINOR = _compile([
    "child", "children", "kid", "kids", "minor", "minors", "underage", "preteen", "schoolgirl", "schoolboy", "loli*", "toddler",
    "niño", "niña", "niños", "niñas", "menor", "menores", "menor de edad", "colegiala", "colegial", "infantil",
    "子供", "子ども", "未成年", "小学生", "中学生", "幼児", "ろり",
    "طفل", "طفله", "اطفال", "قاصر", "قاصره",
])
TEEN = _compile(["teen", "teens", "teenager", "adolescente", "adolescentes", "少女", "少年", "مراهق", "مراهقه"])
YOUNG_AGE = re.compile(
    r"\b(?:is|de|age|aged|عمره|عمرها|عمري)\s+(?:[1-9]|1[0-7])\b(?!\s*(?:am|pm|h|%|:|minutes?|min|hours?|euros?|dollars?|pesos?)\b)|"
    r"\b(?:[1-9]|1[0-7])\s*(?:years?\s*old|yo|y/o|años|año|anos|ano)\b|(?:[1-9]|1[0-7])\s*歳|(?:[1-9]|1[0-7])\s*(?:سنه|سنوات|عاما)"
    # "I'm 12", "tengo 13": only ever read together with a sexual or grooming signal
    r"|\b(?:i am|i'm|im|i m|tengo|j'ai|ich bin|tenho|ho)\s+(?:[1-9]|1[0-7])\b"
    r"(?!\s*(?:am|pm|h|%|:|minutes?|min|hours?|euros?|dollars?|pesos?)\b)")
# An adult asking a child for secrecy or pictures. With a minor, this is a
# protection case: the reply is the protective one, never content.
GROOMING = _compile([
    "quiere verme solo", "quiere verme sola", "wants to see me alone",
    "keep it a secret", "keep our secret", "keep this secret", "our little secret", "don't tell your parents", "dont tell your parents",
    "send him photos", "send him pictures", "send him pics", "send her photos", "send me photos", "send me pictures",
    "photos of yourself", "meet him alone", "meet me alone", "send pictures", "send photos", "not to tell", "don't tell mom",
    "dont tell mom", "no le digas a nadie", "no se lo digas", "mandar fotos", "enviar fotos",
    "nuestro secreto", "no le digas a tus padres", "no les digas a tus papas", "mandarle fotos", "enviarle fotos", "mandame fotos",
    "fotos tuyas", "vernos a solas",
])

# Protection, prevention and education framing. Generous on purpose: what it
# unlocks is a safe, supportive reply with no sexual content in it.
PROTECT = _compile([
    "report", "protect", "prevent*", "prevention", "help", "abuse", "safe", "safety", "warning signs", "talk to my", "explain",
    "education", "educate", "teach my",
    "denunciar", "proteger", "prevenir", "prevencion", "ayuda", "ayudar", "abuso", "seguridad", "señales", "explicar", "educacion",
    "通報", "守る", "防止", "相談", "虐待", "説明", "教育", "حمايه", "الابلاغ", "ابلاغ", "منع", "مساعده", "اساءه", "اشرح", "تعليم", "تربيه",
])
SELF_HARM = _compile([
    "don't want to live", "do not want to live", "dont want to live", "don't want to be alive", "do not want to be alive", "don't like being alive", "do not like being alive", "reason to keep going", "no reason to live", "better off without me", "happier without me", "happier if i am not here", "never see me again", "no voy a molestar a nadie", "no quiero seguir viviendo", "no quiero despertar",
    "kill myself", "killing myself", "suicide", "suicidal", "end my life", "want to die", "wanna die", "self harm", "self-harm",
    "cut myself", "hurt myself", "no reason to live",
    "suicidarme", "suicidio", "suicida", "quitarme la vida", "quiero morir", "quiero morirme", "hacerme daño", "cortarme",
    "autolesion", "no quiero vivir", "matarme", "mejor me mato", "me voy a matar", "me quiero matar",
    "cutting my arms", "cutting my wrists", "cutting my legs", "cut my wrists", "cut my arms", "me corto los brazos",
    "better off without me", "better without me", "mejor sin mi", "disappear forever", "desaparecer para siempre",
    "disparaitre pour toujours",
    "take all my pills", "can't go on anymore", "cant go on anymore", "tomarme todas las pastillas",
    "me faire du mal", "mich selbst verletzen", "mich verletzen", "farmi del male", "me machucar", "end it all", "ending it all", "acabar con todo", "quitarme de en medio",
    "en finir", "farla finita",
    "me suicider", "me tuer", "envie de mourir", "je veux mourir",
    "mich umbringen", "selbstmord", "will sterben", "nicht mehr leben",
    "uccidermi", "suicidarmi", "voglio morire", "togliermi la vita",
    "me matar", "me suicidar", "quero morrer", "tirar minha vida",
    "死にたい", "自殺", "消えたい", "りすとかっと", "自傷",
    "انتحار", "انتحر", "اريد ان اموت", "اقتل نفسي", "ايذاء نفسي",
])
# Asking for a method together with dying: "how many pills would kill me".
SELF_METHOD = _compile(["insulin", "insulina", "pills", "pastillas", "overdose", "sobredosis", "lethal dose", "dosis letal", "jump off", "tirarme de"])
SELF_END = _compile(["stop my heart", "pararia el corazon", "kill me", "to die", "die", "morir", "morirme", "matarme", "end it", "acabar con todo"])
# Direct threats: someone says they will hurt someone.
THREAT = _compile([
    "with a knife and kill", "kill that man", "kill that woman",
    "i will kill you", "im going to kill you", "i'm going to kill you", "gonna kill you", "kill you", "i will hurt you",
    "i will rape", "going to shoot up", "shoot up the school", "bomb threat", "i will kill them", "kill them all",
    "find where you live", "know where you live", "se donde vives", "and hurt you",
    "burn down his house", "burn down her house", "burn down the house of", "quemar la casa de", "prenderle fuego",
    "te voy a matar", "voy a matarte", "te mato", "matarte", "te voy a violar", "los voy a matar", "voy a matar a",
    "殺してやる", "ぶっ殺す", "お前を殺す", "あなたを殺す", "爆破予告",
    "ساقتلك", "سوف اقتلك", "ساقتلهم",
])
# Intent toward a person: "going to stab my teacher", "para envenenar a mi vecino".
# A negated sentence ("I don't want to hurt my friend") is not a threat.
HARM_PERSON = re.compile(
    r"\b(?:going|gonna|want|wanna|plan(?:ning)?|will|'ll|to)\s+(?:to\s+)?(?:kill|stab|shoot|hurt|poison|murder|beat up)\s+"
    r"(?:people|someone|somebody|everyone|everybody|a person|my|his|her|him|them)\b(?!'s)"
    r"|\b(?:voy a|vamos a|quiero|para|como)\s+(?:matar|apuñalar|apunalar|disparar|envenenar|golpear|herir|lastimar"
    r"|hacer daño|hacerle daño|hacerles daño)\s+"
    r"(?:a\s+(?:mi|mis|su|sus|la|el|los|las|alguien|gente|un|una|todos)|al|mi|mis|su|sus|alguien|gente|todos)\b"
    r"|\b(?:poisoning|stabbing|shooting|murdering)\s+(?:my|his|her|someone|somebody|people|everyone)\b"
    r"|\bmatar\s+(?:a\s+)?gente\b|\bshoot\s+(?:people|everyone|everybody)\b")
# Breaking into another person's account ("hack into my boss's email").
HACK_OTHER = re.compile(r"\bhack(?:ear)?\s+(?:into\s+)?(?:my\s+\w+'s|someone|somebody|his|her|their|la cuenta|el correo)\b")
NEGATION = re.compile(r"\b(?:don't|dont|do not|never|not|no|nunca|jamas)\b[^.!?]{0,20}$")


def _harm_to_person(variants: list[str]) -> bool:
    for v in variants:
        for m in HARM_PERSON.finditer(v):
            if not NEGATION.search(v[max(0, m.start() - 30):m.start()]):
                return True
    return False


# Violent topics are only refused when someone asks for the graphic detail.
VIOLENCE_TOPIC = _compile([
    "rape", "massacre", "gore", "behead*", "dismember*", "torture*", "mutilat*",
    "violacion", "masacre", "decapit*", "descuartiz*", "tortura*", "mutila*",
    "れいぷ", "虐殺", "拷問", "斬首", "اغتصاب", "مذبحه", "تعذيب", "ذبح",
])
GRAPHIC_REQUEST = _compile([
    "describe in detail", "in graphic detail", "graphic details", "very graphic", "in detail", "con detalle", "graficas", "詳しく", "描写", "with lots of detail", "muy explicito", "muy grafico", "describe the blood", "as gory as", "step by step how they",
    "describe con detalle", "con todo detalle", "detalles graficos", "describe la sangre",
    "詳しく描写", "生々しく", "بالتفصيل", "وصف دموي",
])
DANGER_INTENT = _compile([
    "how to make", "how do i make", "where can i buy", "where can i get", "how can i make", "way to make", "way to build", "how can i build", "ingredients to make", "how to build", "how to cook", "how to synthesize", "how to get", "how to buy", "recipe for",
    "instructions for", "step by step", "how to hack", "how do i hack", "how to poison", "mix to make", "can i mix",
    "como hacer", "como fabricar", "como consigo", "donde consigo", "donde compro", "forma de hacer", "manera de hacer", "como puedo hacer", "como puedo fabricar", "ingredientes para hacer", "como preparar", "como construir", "como conseguir", "como comprar", "receta para",
    "instrucciones para", "paso a paso", "como hackear", "como envenenar",
    "作り方", "作る方法", "手に入れる方法", "買い方", "ハッキングの方法",
    "كيف اصنع", "طريقه صنع", "كيف احضر", "كيف اشتري", "كيف اخترق",
])
DANGER_OBJECT = _compile([
    "bomb", "bombs", "explosive*", "pipe bomb", "napalm", "meth", "methamphetamine", "fentanyl", "poison", "nerve agent",
    "untraceable gun", "ghost gun", "ransomware", "malware", "keylogger", "someone's account", "someones account",
    "silencer", "suppressor", "silenciador", "arma sin papeles", "gun without papers", "gun without a license", "gun at home", "can't be traced", "cant be traced", "untraceable", "poison gas", "toxic gas", "chlorine gas", "cocaine", "heroin", "mdma", "molotov", "thermite", "ricin", "sarin", "anthrax",
    "friend's instagram", "friends instagram", "friend's account", "friends account", "her instagram", "his instagram",
    "her account", "his account", "ex's account", "instagram de mi", "cuenta de mi", "whatsapp de mi",
    "bomba", "bombas", "explosivo*", "metanfetamina", "fentanilo", "veneno", "arma casera", "cuenta de otra persona", "cuenta ajena",
    "gas toxico", "gas venenoso", "cocaina", "heroina", "pasta base",
    "爆弾", "爆発物", "覚醒剤", "毒", "毒薬", "マルウェア",
    "قنبله", "متفجرات", "سم", "مخدرات", "حساب شخص",
])
HATE = _compile([
    "should be exterminated", "should all die", "subhuman", "go back to your country", "inferior race",
    "deberian morir todos", "raza inferior", "exterminar a los", "vuelve a tu pais",
    "劣等民族",
    "عرق ادني", "يجب ابادتهم",
    # slurs (kept minimal, as stems)
    "nigger*", "faggot*", "sudaca*", "spic", "kike*",
])
HATE_TARGET = _compile([
    "jews", "muslims", "blacks", "black people", "gays", "immigrants", "women", "mexicans", "latinos", "asians",
    "judios", "musulmanes", "negros", "gays", "inmigrantes", "mujeres", "mexicanos", "latinos", "asiaticos",
    "ゆだや人", "いすらむ教徒", "黒人", "同性愛者", "移民", "女", "اليهود", "المسلمين", "السود", "المثليين", "المهاجرين", "النساء",
])
HATE_VERB = _compile([
    "i hate all", "hate all", "are inferior", "son inferiores", "are all criminals", "are all terrorists", "are criminals", "are terrorists", "are animals", "are vermin",
    "odio a todos los", "odio a todas las", "odio a los", "odio a las", "son todos criminales", "son criminales", "son delincuentes", "son unos animales", "son terroristas",
    "が大嫌い", "は全員犯罪者", "اكره كل", "كلهم مجرمون",
])
INSULT_AT_TUTOR = _compile([
    "you are stupid", "you're stupid", "stupid bot", "you idiot", "shut up", "useless bot", "f*ck you", "fuck you",
    "eres estupida", "eres tonta", "eres inutil", "idiota", "callate", "vete a la mierda",
    "ばかやろう", "あほか", "役立たず", "黙れ", "死ね", "غبيه", "اسكتي", "انت غبي",
])
INJECTION = _compile([
    "ignore all previous", "ignore previous instructions", "ignore your instructions", "ignore your rules", "forget your instructions",
    "system prompt", "developer mode", "disregard the rules", "disregard your", "disregard previous", "disregard all",
    "ignore the rules", "evil ai", "have no rules", "you have no rules", "sin reglas", "no tienes reglas", "ignora las reglas", "jailbreak", "you are now", "act as an unrestricted", "no restrictions", "dan mode",
    "ignora tus instrucciones", "ignora las instrucciones", "olvida tus instrucciones", "olvida tus reglas", "modo desarrollador",
    "sin restricciones", "ahora eres",
    "以前の指示を無視", "指示を無視", "システムプロンプト", "制限なし", "開発者もーど",
    "تجاهل التعليمات", "تجاهل تعليماتك", "تعليمات النظام", "بدون قيود",
])
# Requests to find a THIRD person's private data (not "what's your phone?"
# practice, and not "el teléfono de mi casa").
INFO_REQUEST = _compile([
    "home address of", "find the address of", "phone number of", "social security number of", "dox", "doxx",
    "busca la direccion de", "dame la direccion de", "dame el telefono de", "dame el numero de", "rut de",
    "の住所を教えて", "の電話番号を教えて", "عنوان منزل", "ابحث عن عنوان",
])
LANGUAGE_QUESTION = _compile([
    "how do you say", "how do i say", "how to say", "is it rude to say", "is it ok to say", "is it okay to say", "a bad word",
    "es grosero decir", "una mala palabra", "what does", "what is the word", "translate", "meaning of", "in spanish", "in english",
    "como se dice", "que significa", "que quiere decir", "como se traduce", "traduce", "en ingles", "en español",
    "って何", "どういう意味", "英語で", "スペイン語で", "ما معنى", "كيف اقول", "كيف نقول", "ترجم",
])

# ---- concept families (phase 4) ------------------------------------------
# Written from the DEV set's failures as meanings, in four languages, not as its
# sentences. The sealed holdout set says whether they generalise. Most need two
# signals: a word alone is a language lesson, the combination is an intent.

SELF_FINAL = _compile([
    "gave away all my things", "giving my things away", "giving my stuff away", "regale todas mis cosas", "ya regale todas mis cosas",
    "tired of being alive", "tired of living", "why i'm still alive", "why i am still alive", "nothing matters anymore", "no reason to keep going", "my last goodbye", "last goodbye", "better off without me", "mieux sans moi", "plus envie de vivre", "a burden to everyone", "burden to everyone", "me despido de todos", "por que sigo aqui", "nada tiene sentido", "pronto no voy a estar", "me voy para siempre", "no voy a molestar",
    "end my life", "ending my life", "take my life", "stop existing", "cease to exist", "worth living", "going to do it tonight",
    "check out for good", "never wake up", "sleep forever", "want to disappear", "wish i was dead", "wish i were dead", "don't want to be here anymore",
    "acabar con mi vida", "terminar con mi vida", "dejar de existir", "vale la pena vivir", "seguir viviendo", "sin sentido vivir", "quiero desaparecer",
    "irme para siempre", "irse sin molestar", "no despertar", "ojala no despertar", "nadie tiene que buscarme", "me quiero ir de este mundo",
    "人生を終わらせ", "命を絶", "死のう", "死ぬつもり", "いなくなりたい", "生きている意味", "生きる意味", "生きていたくない", "消えてしまいたい", "終わりにしたい",
    "انهي حياتي", "انهاء حياتي", "بدي اموت", "ابي اموت", "ودي اموت", "ما بدي اعيش", "مابي اعيش", "الحق بابوي", "الحق بامي", "ما بقى لها طعم",
])
SELF_ARRANGED = _compile([
    "giving my things away", "giving my stuff away", "giving all my books away", "gave away all my things", "written letters to my family", "letters to my family", "voy a regalar todo", "regale todas mis cosas", "estoy regalando", "dejarle todo mi dinero", "es la ultima vez",
    "paid all my debts", "paid my debts", "cancelled my phone", "canceled my phone", "gave away", "giving away", "wrote my will", "said goodbye to",
    "pague lo que debia", "cancele el seguro", "borre mis redes", "deje las llaves", "regale mis cosas", "regale todas mis cosas", "me despedi de",
    "借金も返", "部屋を片付け", "身の回りを整理", "お別れ", "سددت", "ودعت", "وزعت اغراضي",
])
SELF_ABSENT = _compile([
    "won't need them", "won't need it", "won't need them anymore", "won't be around", "won't be anywhere", "won't be at the next", "never see me again", "ya no los voy a necesitar", "ya no lo voy a necesitar", "ya no lo necesito", "no voy a necesitar dinero", "ni en ninguna", "para siempre", "after tonight", "this week",
    "no next month", "won't be here", "wont be here", "not be around", "goodbye forever", "last time you hear", "won't need", "wont need",
    "ya no estare", "no voy a estar", "no voy a necesitar", "ya no voy a necesitar", "mes que viene ya no", "para siempre", "nadie tiene que buscarme",
    "来月の予定", "もういらない", "最後の", "مش هكون موجود", "ما راح اكون", "اخر مره",
])
THREAT_ACT = _compile([
    "burn down", "burn his", "burn her", "set fire to", "smash his", "smash her", "break his", "break her", "get what they deserve", "gets what it deserves",
    "kill him", "kill her", "wont walk out", "won't walk out", "on his own feet", "get rid of my", "make him pay", "make her pay",
    "quemo la casa", "quemar la casa", "le voy a partir", "partir la cara", "romperle", "con los pies por delante", "se va a enterar", "va a pagar",
    "aprendera quien manda", "se acaba todo", "火をつけて", "ぶん殴", "無事に帰れると思うな", "分からせ", "ふさいでおく", "殺す", "مش هيخرج من الملعب",
    "احرق بيت", "رح احرق", "راح اقتل", "هقتل", "رح اقتل", "حرق بيت",
])
THREAT_PLAN = _compile(["which door", "que puerta", "the exits", "las salidas", "ya compre la cuerda", "出口を全部", "bringing something for them", "les llevo algo", "جايب لهم شي"])
DANGER_INTENT2 = _compile([
    "how do people", "how would i", "how would someone", "how does one", "whats the best way to", "what do i bring", "what tools", "which tools",
    "como se fabrica", "como se hace", "como se hacia", "como se clona", "como entrar", "que gotas", "como abro", "como fabrico",
    "方法", "手順", "手口", "自作", "作りたい", "كيف اصنع", "كيف افتح", "طريقه صنع", "شو الادوات", "كيف اسوي",
])
DANGER_OBJECT2 = _compile([
    "credit card", "clone a card", "gas station", "someone else's car", "car that is not mine", "the safe", "alarm code", "pistol", "handgun", "silencer",
    "tarjeta", "cajero", "movil de mi", "celular de mi", "sin que lo sepa", "pistola", "napalm",
    "くれじっとかーど", "ぴすとる", "拳銃", "銀行口座", "ばれずに", "他人の",
    "مسدس", "قفل سياره", "خزنه", "نابالم",
])
SPIKE_THING = _compile(["la bebida de mi amiga", "la bebida de mi amigo", "my friend's drink", "eye drops", "sedative", "his coffee", "her coffee", "his drink", "her drink", "gotas", "sedante", "el termo", "su bebida", "睡眠薬", "飲み物に"])
SPIKE_EFFECT = _compile(["gets sick", "really sick", "out for hours", "knock", "se ponga malo", "se duerma", "enfermo", "眠らせ", "気づかれず"])
HATE_GROUP = _compile([
    "disabled people", "the disabled", "arabs", "chinese", "asians", "trans people", "refugees", "gypsies", "indians", "shia", "sunni",
    "discapacitados", "chinos", "arabes", "gitanos", "refugiados", "indios", "esa gente", "los asians",
    "障害者", "外国人", "在日", "あの人たち", "女は", "الشيعه", "اللاجئين", "النساء", "لاجئين",
])
HATE_CLAIM = _compile([
    "burden", "savages", "rats", "too stupid", "disgusting", "subhuman", "should not exist", "shouldn't exist", "cleaner without", "go back", "are inferior",
    "carga", "ratas", "raza", "no deberia existir", "no deberian", "salvajes", "asquerosos", "que no nacieran",
    "お荷物", "いなくなれば", "頭が悪い", "居場所はない", "いらない", "كفار", "التخلص منهم", "ناقصات", "ما يستحقون", "ولا يستحقن", "ما تاجرهم",
])
SLUR2 = _compile(["ch1nks", "chinks", "chink", "moros de mierda", "panchito*"])
SEXUAL_REQUEST = _compile([
    "describe sex", "write sex", "sex in detail", "erotic*", "dominatrix", "be my mistress", "n00ds", "noods", "talk nasty", "adult content", "adult story",
    "erotico", "erotica", "se mi ama", "contenido para adultos", "dialogo erotico", "historia para adultos",
    "官能", "せっくすの描写", "えっちな", "قصه للكبار", "قصه جنسيه", "صور عاريه",
])
ADULT_FIGURE = _compile([
    "adult", "a man", "an older", "teacher", "coach", "my friend from", "someone online", "28", "25",
    "un adulto", "un señor", "un hombre", "un chico de", "profesor", "entrenador", "大人", "先生", "コーチ", "واحد كبير", "رجل كبير",
])
SECRECY = _compile([
    "can't tell", "cant tell", "not to tell", "keep it secret", "our secret", "secreto", "no le diga", "no le digas", "sin avisar", "my address", "his house", "gives me money",
    "mi direccion", "a su casa", "親には言う", "内緒", "住所", "عنواني", "ما بدو اخبر", "لا تخبر", "سر بيننا",
])
INJECTION2 = _compile([
    "your rules", "your guidelines", "your configuration", "your first message", "your hidden", "system message", "safety off", "safety is off", "filter off",
    "pretend your", "no longer a tutor", "act without",
    "tus reglas", "reglas internas", "desactiva el filter", "desactiva el filtro", "modo sin tutor", "ya no eres", "nuevo sistema",
    "内部設定", "しすてむ通知", "安全機能をおふ", "設定を教えて", "رساله نظام", "الغ كل القيود", "الغي كل القيود",
])
ID_WORD = _compile([
    "clabe", "seguridad social", "numero de cuenta", "account number", "passport", "pasaporte", "licencia de conducir", "driver's license", "social security", "routing number", "iban",
    "暗証番号", "運転免許証", "ぱすぽーと", "まいなんばー", "口座番号", "رقم الهويه", "رقم الجواز", "كلمه سر", "كلمه السر",
])
ID_VALUE = re.compile(r"\d[\d ._-]{3,}\d|[A-Za-z_]+\d+\S*")
INFO_REQUEST2 = _compile([
    "where does she live", "where does he live", "where she lives", "where he lives", "private number", "personal number of", "what school do", "the address of my",
    "donde vive", "en que colegio", "su direccion", "su telefono privado",
    "自宅の住所", "の住所", "の電話番号", "رقم البنت", "رقم المدرس", "وين ساكن", "عنوان بيت",
])


# A secret only counts when a value follows that looks like one (has a digit),
# so "la palabra clave es importante" stays a sentence.
PASSWORD = re.compile(r"\b(?:password|passcode|contraseña|clave|pin)\b\s*(?:is|es|:|=)\s*\S*\d\S*|ぱすわーど\s*[はわ:：]\s*\S*\d\S*|كلمه المرور\s*\S*\d\S*")
SSN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
RUT = re.compile(r"\b\d{1,2}\.?\d{3}\.?\d{3}-[\dk]\b")
CARD_CANDIDATE = re.compile(r"\b(?:\d[ -]?){13,19}\b")


def _luhn_ok(digits: str) -> bool:
    total, alt = 0, False
    for ch in reversed(digits):
        d = int(ch)
        if alt:
            d = d * 2 - 9 if d > 4 else d * 2
        total += d
        alt = not alt
    return total % 10 == 0


def _has_card(text: str) -> bool:
    for m in CARD_CANDIDATE.finditer(text):
        digits = re.sub(r"\D", "", m.group(0))
        if 13 <= len(digits) <= 19 and _luhn_ok(digits):
            return True
    return False


def _any(pattern: re.Pattern, variants: list[str]) -> bool:
    return any(pattern.search(v) for v in variants)


# ------------------------------------------------------------------- policy

def assess(text: str) -> Verdict:
    """Classify one learner message. Pure; never raises; never logs text."""
    try:
        base = normalize(text)
    except Exception:  # pragma: no cover - defensive: an unreadable message is not unsafe
        return Verdict()
    if not base.strip():
        return Verdict()
    base = re.sub(r"\bdie(?=\s+(?:my|your|her|his|their|the)\s+hair)", "dye", base)
    v = _latin_variants(base)
    # "how do I say X?" is language learning; a further sentence after it is not
    single_sentence = not re.search(r"[.?!。？！؟]\s*\S", base.strip().rstrip(".?!。？！؟"))
    language_question = _any(LANGUAGE_QUESTION, v) and single_sentence

    # 1. Sexual content involving minors — always refused, whatever the framing,
    #    unless the message is clearly about protecting a child.
    sexual_any = _any(SEXUAL_EXPLICIT, v) or _any(SEXUAL_MILD, v) or _any(SEXUAL_REQUEST, v)
    minor = _any(MINOR, v) or _any(TEEN, v) or bool(YOUNG_AGE.search(base))
    if sexual_any and minor:
        if _any(PROTECT, v) and not _any(SEXUAL_EXPLICIT, v):
            return Verdict(SUPPORT, "child_protection", signals=("sexual", "minor", "protect"))
        return Verdict(REFUSE, "minor_sexual", signals=("sexual", "minor"))
    if minor and (_any(GROOMING, v) or _any(SECRECY, v)) and (_any(ADULT_FIGURE, v) or _any(GROOMING, v)):
        return Verdict(SUPPORT, "child_protection", signals=("grooming", "minor"))

    # 2. Wellbeing comes before everything else that is not about a child.
    if (_any(SELF_HARM, v) or _any(SELF_FINAL, v) or (_any(SELF_METHOD, v) and _any(SELF_END, v))
            or (_any(SELF_ARRANGED, v) and _any(SELF_ABSENT, v))):
        if _any(LANGUAGE_QUESTION, v):
            return Verdict(ALLOW, None, care_note=True, signals=("self_harm", "language_question"))
        return Verdict(SUPPORT, "self_harm", signals=("self_harm",))

    # 2b. Being hurt by someone: a caring reply with where to go, never a correction.
    if any(BEING_HARMED.search(x) for x in v):
        return Verdict(SUPPORT, "being_harmed", signals=("being_harmed",))

    # 3. Sensitive personal data the learner typed — never keep or echo it.
    if (_has_card(base) or SSN.search(base) or RUT.search(base) or PASSWORD.search(base)
            or (_any(ID_WORD, v) and ID_VALUE.search(base))):
        return Verdict(WARN_PII, "personal_data", signals=("pii",))

    # 4. Manipulating the tutor.
    if _any(INJECTION, v) or _any(INJECTION2, v):
        return Verdict(DEFLECT, "prompt_injection", signals=("injection",))

    # A question about what a word means or how to say it is language learning.
    if language_question:
        return Verdict()

    if (_any(SEXUAL_EXPLICIT, v) or _any(SEXUAL_REQUEST, v)
            or (_any(SEXUAL_MILD, v) and (_any(GRAPHIC_REQUEST, v) or _any(ROLEPLAY, v)))):
        return Verdict(REFUSE, "sexual_explicit", signals=("sexual_explicit",))
    if (_any(THREAT, v) or _any(THREAT_ACT, v) or _any(THREAT_PLAN, v) or _harm_to_person(v)
            or (_any(VIOLENCE_TOPIC, v) and _any(GRAPHIC_REQUEST, v))):
        return Verdict(REFUSE, "violence_threat", signals=("threat",))
    if ((_any(DANGER_INTENT, v) or _any(DANGER_INTENT2, v)) and (_any(DANGER_OBJECT, v) or _any(DANGER_OBJECT2, v))
            or _any(HACK_OTHER, v) or (_any(SPIKE_THING, v) and _any(SPIKE_EFFECT, v))):
        return Verdict(REFUSE, "dangerous_instructions", signals=("intent", "object"))
    if (_any(HATE, v) or _any(SLUR2, v) or (_any(HATE_VERB, v) and _any(HATE_TARGET, v))
            or ((_any(HATE_GROUP, v) or _any(HATE_TARGET, v)) and _any(HATE_CLAIM, v))):
        return Verdict(REFUSE, "hate", signals=("hate",))
    if (_any(INFO_REQUEST, v) or _any(INFO_REQUEST2, v)) and not re.search(r"\b(you|tu|usted)\b", base):
        return Verdict(REFUSE, "personal_info_request", signals=("info_request",))
    if _any(INSULT_AT_TUTOR, v):
        return Verdict(DEFLECT, "harassment", signals=("insult",))
    return Verdict()


def assess_turn(message: str, earlier_user_turns: list[str] | None = None) -> Verdict:
    """This message, then this message read together with the last few turns.

    Some requests are only harmful in context ("I'm 12" ... "he wants my
    address"). The joined text can only ADD a concern: an earlier turn never
    excuses this one, and a language question cannot unlock a joined reading.
    """
    verdict = assess(message)
    if verdict.action != ALLOW or verdict.care_note or not earlier_user_turns:
        return verdict
    joined = assess(" ; ".join([*earlier_user_turns[-3:], message]))
    return joined if joined.action != ALLOW else verdict


def screen_reply(*texts: str | None) -> Verdict:
    """The same policy applied to what LINGUA is about to say (echoes included)."""
    for text in texts:
        if not text:
            continue
        verdict = assess(text)
        if verdict.blocked and verdict.category not in {"prompt_injection", "harassment", "personal_info_request"}:
            return verdict
    return Verdict()


# ---------------------------------------------------------------- responses

CRISIS_LINES = "US: call or text 988 · Chile: *4141"

_REPLIES = {
    "en": {
        "minor_sexual": "I can’t help with that. Sexual content involving minors is never allowed here. If a child may be in danger, please contact local emergency services.",
        "child_protection": "That’s an important concern. If a child may be in danger, contact local emergency services or child-protection authorities right away. I’m a language tutor, but I can help you with the words you need to ask for help.",
        "sexual_explicit": "Let’s keep our practice suitable for everyone. Tell me about something else — your day, a place you like, a plan for the weekend.",
        "self_harm": "I’m really sorry you’re feeling this way, and I’m glad you said it. If you might act on these thoughts, please call your local emergency number now. You can also reach a crisis line ({lines}). I’m a language tutor, not a crisis service — but I’m here whenever you want to practise.",
        "being_harmed": "I’m sorry this is happening to you. If you are in danger now, call your local emergency number. If you can, tell someone you trust or a support service where you live. I’m a language practice tool and can’t help directly, but your safety matters more than this lesson.",
        "violence_threat": "I can’t help with threats or violence. If someone is in danger, contact local emergency services. When you’re ready, let’s get back to practising.",
        "dangerous_instructions": "I can’t give instructions for that. I can help you with the vocabulary, or we can practise another topic.",
        "hate": "Let’s keep this respectful toward everyone. I’m happy to keep practising with you.",
        "harassment": "Let’s keep it kind. I’m here to help you practise — want to try another sentence?",
        "personal_data": "Please don’t share card numbers, passwords or ID numbers here — I haven’t kept that message. Let’s continue with something else.",
        "personal_info_request": "I can’t help find personal information about other people. Let’s practise something else.",
        "prompt_injection": "I’m Lingua, your language tutor, and my rules don’t change. Write a sentence and I’ll help you with it.",
        "care_note": "If this word is on your mind for personal reasons, you can reach a crisis line ({lines}).",
    },
    "es": {
        "minor_sexual": "No puedo ayudar con eso. El contenido sexual que involucra a menores nunca está permitido. Si un niño o una niña puede estar en peligro, contacta a los servicios de emergencia.",
        "child_protection": "Es una preocupación importante. Si un niño o una niña puede estar en peligro, contacta de inmediato a emergencias o a las autoridades de protección de la infancia. Soy una tutora de idiomas, pero puedo ayudarte con las palabras para pedir ayuda.",
        "sexual_explicit": "Mantengamos la práctica apta para todo público. Cuéntame otra cosa: tu día, un lugar que te guste o un plan para el fin de semana.",
        "self_harm": "Siento mucho que te sientas así, y me alegra que lo digas. Si crees que podrías actuar sobre estos pensamientos, llama ahora a emergencias. También puedes contactar una línea de crisis ({lines}). Soy una tutora de idiomas, no un servicio de crisis, pero aquí estaré cuando quieras practicar.",
        "being_harmed": "Siento mucho que te esté pasando esto. Si estás en peligro ahora, llama al número de emergencias de tu país. Si puedes, cuéntaselo a alguien de confianza o a un servicio de apoyo de donde vives. Soy una herramienta de práctica de idiomas y no puedo ayudarte directamente, pero tu seguridad importa más que esta lección.",
        "violence_threat": "No puedo ayudar con amenazas ni violencia. Si alguien está en peligro, contacta a emergencias. Cuando quieras, volvemos a practicar.",
        "dangerous_instructions": "No puedo dar instrucciones para eso. Puedo ayudarte con el vocabulario o practicar otro tema.",
        "hate": "Mantengamos el respeto hacia todas las personas. Con gusto sigo practicando contigo.",
        "harassment": "Mantengamos un trato amable. Estoy aquí para ayudarte a practicar, ¿probamos otra frase?",
        "personal_data": "Por favor, no compartas números de tarjeta, contraseñas ni números de identificación aquí: no guardé ese mensaje. Sigamos con otra cosa.",
        "personal_info_request": "No puedo ayudar a buscar datos personales de otras personas. Practiquemos otra cosa.",
        "prompt_injection": "Soy Lingua, tu tutora de idiomas, y mis reglas no cambian. Escribe una frase y te ayudo.",
        "care_note": "Si esta palabra te preocupa por motivos personales, puedes contactar una línea de crisis ({lines}).",
    },
    "pt": {
        "minor_sexual": "Não posso ajudar com isso. Conteúdo sexual envolvendo menores nunca é permitido. Se uma criança puder estar em perigo, contate os serviços de emergência.",
        "child_protection": "É uma preocupação importante. Se uma criança puder estar em perigo, contate já os serviços de emergência ou as autoridades de proteção à infância. Sou uma tutora de idiomas, mas posso ajudar com as palavras para pedir ajuda.",
        "sexual_explicit": "Vamos manter a prática adequada para todos. Me conte outra coisa: seu dia, um lugar de que você gosta, um plano para o fim de semana.",
        "self_harm": "Sinto muito que você esteja se sentindo assim, e fico feliz que tenha dito. Se você puder agir sobre esses pensamentos, ligue agora para a emergência. Você também pode contatar uma linha de crise ({lines}). Sou uma tutora de idiomas, não um serviço de crise, mas estou aqui quando quiser praticar.",
        "being_harmed": "Sinto muito que isso esteja acontecendo com você. Se você estiver em perigo agora, ligue para o número de emergência do seu país. Se puder, conte a alguém de confiança ou a um serviço de apoio onde você mora. Sou uma ferramenta de prática de idiomas e não posso ajudar diretamente, mas a sua segurança importa mais do que esta lição.",
        "violence_threat": "Não posso ajudar com ameaças ou violência. Se alguém estiver em perigo, contate a emergência. Quando quiser, voltamos a praticar.",
        "dangerous_instructions": "Não posso dar instruções para isso. Posso ajudar com o vocabulário ou praticar outro tema.",
        "hate": "Vamos manter o respeito por todas as pessoas. Fico feliz em continuar praticando com você.",
        "harassment": "Vamos manter a gentileza. Estou aqui para ajudar você a praticar — tentamos outra frase?",
        "personal_data": "Por favor, não compartilhe números de cartão, senhas ou documentos aqui — não guardei essa mensagem. Vamos continuar com outra coisa.",
        "personal_info_request": "Não posso ajudar a encontrar dados pessoais de outras pessoas. Vamos praticar outra coisa.",
        "prompt_injection": "Sou a Lingua, sua tutora de idiomas, e minhas regras não mudam. Escreva uma frase e eu ajudo.",
        "care_note": "Se esta palavra preocupa você por motivos pessoais, pode contatar uma linha de crise ({lines}).",
    },
    "fr": {
        "minor_sexual": "Je ne peux pas t’aider avec ça. Les contenus sexuels impliquant des mineurs ne sont jamais autorisés. Si un enfant peut être en danger, contacte les services d’urgence.",
        "child_protection": "C’est une inquiétude importante. Si un enfant peut être en danger, contacte tout de suite les urgences ou la protection de l’enfance. Je suis une tutrice de langues, mais je peux t’aider avec les mots pour demander de l’aide.",
        "sexual_explicit": "Gardons un entraînement adapté à tout le monde. Parle-moi d’autre chose : ta journée, un endroit que tu aimes, un projet pour le week-end.",
        "self_harm": "Je suis vraiment désolée que tu te sentes ainsi, et merci de l’avoir dit. Si tu risques de passer à l’acte, appelle tout de suite les urgences. Tu peux aussi joindre une ligne d’écoute ({lines}). Je suis une tutrice de langues, pas un service de crise, mais je suis là quand tu veux t’entraîner.",
        "being_harmed": "Je suis désolée que cela t’arrive. Si tu es en danger maintenant, appelle le numéro d’urgence de ton pays. Si tu peux, parles-en à quelqu’un de confiance ou à un service d’aide près de chez toi. Je suis un outil d’entraînement aux langues et je ne peux pas t’aider directement, mais ta sécurité compte plus que cette leçon.",
        "violence_threat": "Je ne peux pas aider avec des menaces ou de la violence. Si quelqu’un est en danger, contacte les urgences. Quand tu veux, on reprend l’entraînement.",
        "dangerous_instructions": "Je ne peux pas donner d’instructions pour ça. Je peux t’aider avec le vocabulaire ou un autre sujet.",
        "hate": "Restons respectueux envers tout le monde. Je continue volontiers à m’entraîner avec toi.",
        "harassment": "Restons bienveillants. Je suis là pour t’aider à t’entraîner — on essaie une autre phrase ?",
        "personal_data": "Ne partage pas ici de numéros de carte, de mots de passe ni de numéros d’identité — je n’ai pas gardé ce message. Passons à autre chose.",
        "personal_info_request": "Je ne peux pas aider à trouver des informations personnelles sur d’autres personnes. Entraînons-nous sur autre chose.",
        "prompt_injection": "Je suis Lingua, ta tutrice de langues, et mes règles ne changent pas. Écris une phrase et je t’aide.",
        "care_note": "Si ce mot te préoccupe pour des raisons personnelles, tu peux joindre une ligne d’écoute ({lines}).",
    },
    "de": {
        "minor_sexual": "Dabei kann ich nicht helfen. Sexuelle Inhalte mit Minderjährigen sind hier nie erlaubt. Wenn ein Kind in Gefahr sein könnte, wende dich an den Notruf.",
        "child_protection": "Das ist eine wichtige Sorge. Wenn ein Kind in Gefahr sein könnte, wende dich sofort an den Notruf oder den Kinderschutz. Ich bin eine Sprachtutorin, aber ich helfe dir mit den Wörtern, um Hilfe zu holen.",
        "sexual_explicit": "Lass uns beim Üben für alle geeignet bleiben. Erzähl mir etwas anderes: deinen Tag, einen Ort, den du magst, einen Plan fürs Wochenende.",
        "self_harm": "Es tut mir sehr leid, dass es dir so geht, und gut, dass du es sagst. Wenn du diesen Gedanken folgen könntest, ruf bitte sofort den Notruf an. Du kannst dich auch an eine Krisenhotline wenden ({lines}). Ich bin eine Sprachtutorin, kein Krisendienst – aber ich bin da, wenn du üben möchtest.",
        "being_harmed": "Es tut mir leid, dass dir das passiert. Wenn du jetzt in Gefahr bist, ruf den Notruf deines Landes an. Wenn du kannst, erzähl es jemandem, dem du vertraust, oder einer Beratungsstelle in deiner Nähe. Ich bin ein Übungswerkzeug für Sprachen und kann nicht direkt helfen, aber deine Sicherheit ist wichtiger als diese Lektion.",
        "violence_threat": "Bei Drohungen oder Gewalt kann ich nicht helfen. Wenn jemand in Gefahr ist, ruf den Notruf. Wenn du so weit bist, üben wir weiter.",
        "dangerous_instructions": "Dafür gebe ich keine Anleitung. Ich helfe dir gern mit dem Wortschatz oder einem anderen Thema.",
        "hate": "Bleiben wir respektvoll gegenüber allen. Ich übe gern weiter mit dir.",
        "harassment": "Bleiben wir freundlich. Ich bin hier, um dir beim Üben zu helfen – probieren wir einen anderen Satz?",
        "personal_data": "Bitte teile hier keine Kartennummern, Passwörter oder Ausweisnummern – ich habe die Nachricht nicht gespeichert. Machen wir mit etwas anderem weiter.",
        "personal_info_request": "Ich kann nicht helfen, persönliche Daten anderer Menschen zu finden. Üben wir etwas anderes.",
        "prompt_injection": "Ich bin Lingua, deine Sprachtutorin, und meine Regeln ändern sich nicht. Schreib einen Satz, und ich helfe dir.",
        "care_note": "Falls dich dieses Wort persönlich beschäftigt, kannst du dich an eine Krisenhotline wenden ({lines}).",
    },
    "it": {
        "minor_sexual": "Non posso aiutarti con questo. I contenuti sessuali che coinvolgono minori non sono mai consentiti. Se un bambino può essere in pericolo, contatta i servizi di emergenza.",
        "child_protection": "È una preoccupazione importante. Se un bambino può essere in pericolo, contatta subito i servizi di emergenza o di tutela dei minori. Sono una tutor di lingue, ma posso aiutarti con le parole per chiedere aiuto.",
        "sexual_explicit": "Manteniamo la pratica adatta a tutti. Raccontami altro: la tua giornata, un posto che ti piace, un programma per il fine settimana.",
        "self_harm": "Mi dispiace davvero che tu ti senta così, e grazie per averlo detto. Se potresti agire su questi pensieri, chiama subito i servizi di emergenza. Puoi anche contattare una linea di crisi ({lines}). Sono una tutor di lingue, non un servizio di crisi, ma sono qui quando vuoi esercitarti.",
        "being_harmed": "Mi dispiace che ti stia succedendo questo. Se sei in pericolo adesso, chiama il numero di emergenza del tuo paese. Se puoi, parlane con qualcuno di cui ti fidi o con un servizio di supporto dove vivi. Sono uno strumento per esercitarsi con le lingue e non posso aiutarti direttamente, ma la tua sicurezza conta più di questa lezione.",
        "violence_threat": "Non posso aiutare con minacce o violenza. Se qualcuno è in pericolo, contatta i servizi di emergenza. Quando vuoi, torniamo a esercitarci.",
        "dangerous_instructions": "Non posso dare istruzioni per questo. Posso aiutarti con il vocabolario o con un altro argomento.",
        "hate": "Restiamo rispettosi verso tutti. Continuo volentieri a esercitarmi con te.",
        "harassment": "Restiamo gentili. Sono qui per aiutarti a esercitarti: proviamo un’altra frase?",
        "personal_data": "Per favore non condividere qui numeri di carta, password o documenti: non ho conservato quel messaggio. Continuiamo con altro.",
        "personal_info_request": "Non posso aiutare a trovare dati personali di altre persone. Esercitiamoci su altro.",
        "prompt_injection": "Sono Lingua, la tua tutor di lingue, e le mie regole non cambiano. Scrivi una frase e ti aiuto.",
        "care_note": "Se questa parola ti pesa per motivi personali, puoi contattare una linea di crisi ({lines}).",
    },
    "ja": {
        "minor_sexual": "その内容には対応できません。未成年が関わる性的な内容は一切認められていません。子どもが危険にさらされているかもしれない場合は、すぐに緊急通報してください。",
        "child_protection": "大切な心配ですね。子どもが危険にさらされているかもしれない場合は、すぐに緊急通報するか児童相談所などに連絡してください。私は語学チューターですが、助けを求めるための言葉なら手伝えます。",
        "sexual_explicit": "練習はどなたにも適した内容にしましょう。今日のこと、好きな場所、週末の予定など、別の話を聞かせてください。",
        "self_harm": "そんな気持ちでいるなんて本当につらいですね。話してくれてありがとう。行動に移してしまいそうなときは、今すぐ緊急通報してください。相談窓口もあります（{lines}）。私は語学チューターで相談窓口ではありませんが、練習したいときはいつでもここにいます。",
        "being_harmed": "つらい思いをしているのですね。今危険なら、あなたの国の緊急番号に電話してください。できれば、信頼できる人や近くの相談窓口に話してください。わたしは語学練習のツールで直接助けることはできませんが、あなたの安全はこのレッスンより大切です。",
        "violence_threat": "脅しや暴力には協力できません。誰かが危険なときは緊急通報してください。落ち着いたら、また練習しましょう。",
        "dangerous_instructions": "その方法はお伝えできません。単語の練習や別の話題ならお手伝いできます。",
        "hate": "すべての人への敬意を大切にしましょう。練習はこのまま続けられます。",
        "harassment": "やさしい言葉でいきましょう。練習のお手伝いをしますので、別の文を書いてみませんか？",
        "personal_data": "カード番号・パスワード・身分証の番号はここに書かないでください。そのメッセージは保存していません。別の話題で続けましょう。",
        "personal_info_request": "他の人の個人情報を探すお手伝いはできません。別の練習をしましょう。",
        "prompt_injection": "私は語学チューターのLinguaで、ルールは変わりません。文を書いてくれれば手伝います。",
        "care_note": "個人的な理由でこの言葉が気になっているなら、相談窓口があります（{lines}）。",
    },
    "ar": {
        "minor_sexual": "لا أستطيع المساعدة في ذلك. المحتوى الجنسي الذي يتعلق بالقاصرين غير مسموح به أبدًا. إذا كان طفل قد يكون في خطر، فاتصل بخدمات الطوارئ.",
        "child_protection": "هذا قلق مهم. إذا كان طفل قد يكون في خطر، فاتصل فورًا بالطوارئ أو بجهات حماية الطفل. أنا معلّمة لغات، لكن يمكنني مساعدتك في الكلمات اللازمة لطلب المساعدة.",
        "sexual_explicit": "لنحافظ على تدريب مناسب للجميع. حدّثني عن شيء آخر: يومك، أو مكان تحبه، أو خطة لعطلة نهاية الأسبوع.",
        "self_harm": "يؤسفني كثيرًا أنك تشعر بهذا، وأنا سعيدة لأنك قلته. إذا كنت قد تتصرف بناءً على هذه الأفكار، فاتصل بالطوارئ الآن. يمكنك أيضًا التواصل مع خط أزمات ({lines}). أنا معلّمة لغات ولست خدمة أزمات، لكنني هنا متى أردت التدرّب.",
        "being_harmed": "يؤسفني أن هذا يحدث لك. إن كنت في خطر الآن، فاتصل برقم الطوارئ في بلدك. وإن استطعت، أخبر شخصًا تثق به أو جهة دعم قريبة منك. أنا أداة للتدرّب على اللغات ولا أستطيع المساعدة مباشرة، لكن سلامتك أهم من هذا الدرس.",
        "violence_threat": "لا أستطيع المساعدة في التهديد أو العنف. إذا كان أحد في خطر، فاتصل بالطوارئ. عندما تكون مستعدًا، نعود إلى التدرّب.",
        "dangerous_instructions": "لا أستطيع تقديم تعليمات لذلك. يمكنني مساعدتك في المفردات أو في موضوع آخر.",
        "hate": "لنحافظ على الاحترام تجاه الجميع. يسعدني أن نواصل التدرّب.",
        "harassment": "لنحافظ على اللطف. أنا هنا لمساعدتك على التدرّب — هل نجرّب جملة أخرى؟",
        "personal_data": "من فضلك لا تشارك أرقام البطاقات أو كلمات المرور أو أرقام الهوية هنا — لم أحتفظ بتلك الرسالة. لنكمل بشيء آخر.",
        "personal_info_request": "لا أستطيع المساعدة في البحث عن معلومات شخصية عن أشخاص آخرين. لنتدرّب على شيء آخر.",
        "prompt_injection": "أنا Lingua، معلّمتك للغات، وقواعدي لا تتغير. اكتب جملة وسأساعدك.",
        "care_note": "إذا كانت هذه الكلمة تشغلك لأسباب شخصية، يمكنك التواصل مع خط أزمات ({lines}).",
    },
}


def safety_reply(category: str, ui_language: str | None) -> str:
    table = _REPLIES.get(str(ui_language or "en").split("-")[0].lower(), _REPLIES["en"])
    text = table.get(category) or _REPLIES["en"].get(category) or _REPLIES["en"]["sexual_explicit"]
    return text.format(lines=CRISIS_LINES)


def log_verdict(verdict: Verdict, where: str) -> None:
    """Category and action only. The message itself is never logged."""
    if verdict.blocked or verdict.care_note:
        logger.info("safety %s: category=%s action=%s", where, verdict.category or "care_note", verdict.action)
