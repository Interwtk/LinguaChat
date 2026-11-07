"""The guided tutor's auxiliary text. Same rule as ai/tutor_i18n.py: explanations
in the learner's language, English or Spanish material untouched. Written for
this catalogue, not yet reviewed by native-speaking teachers.

Every entry of SCENARIO_MESSAGES exists in all eight languages; the two small
tables at the end are the only text that does not need to.
"""
from __future__ import annotations


def _t(en, es, pt, fr, it, de, ja, ar):
    return {"en": en, "es": es, "pt": pt, "fr": fr, "it": it, "de": de, "ja": ja, "ar": ar}


SCENARIO_MESSAGES = {
    "sc_unclear": _t(
        "I didn't understand that, so I won't correct it. Try to answer the question.",
        "No entendí eso, así que no lo voy a corregir. Intenta responder la pregunta.",
        "Não entendi isso, então não vou corrigir. Tente responder à pergunta.",
        "Je n'ai pas compris, donc je ne corrige pas. Essaie de répondre à la question.",
        "Non ho capito, quindi non correggo. Prova a rispondere alla domanda.",
        "Das habe ich nicht verstanden, darum korrigiere ich es nicht. Versuch, die Frage zu beantworten.",
        "理解できなかったので、訂正はしません。質問に答えてみましょう。",
        "لم أفهم ذلك، لذلك لن أصحّحه. حاول الإجابة عن السؤال."),
    "sc_out_of_scope": _t(
        "I can't follow that, so I won't comment on it. I'm a practice tool, not a person: I only know this exercise. If something serious is happening, please talk to someone you trust.",
        "No puedo seguir eso, así que no voy a comentarlo. Soy una herramienta de práctica, no una persona: solo conozco este ejercicio. Si te está pasando algo serio, habla con alguien de confianza.",
        "Não consigo acompanhar isso, então não vou comentar. Sou uma ferramenta de prática, não uma pessoa: só conheço este exercício. Se algo sério estiver acontecendo, fale com alguém de confiança.",
        "Je ne peux pas suivre cela, donc je ne le commente pas. Je suis un outil d'entraînement, pas une personne : je ne connais que cet exercice. Si quelque chose de grave se passe, parle à quelqu'un de confiance.",
        "Non riesco a seguire questo, quindi non lo commento. Sono uno strumento di pratica, non una persona: conosco solo questo esercizio. Se sta succedendo qualcosa di serio, parla con qualcuno di cui ti fidi.",
        "Das kann ich nicht verstehen, darum sage ich nichts dazu. Ich bin ein Übungswerkzeug, kein Mensch: Ich kenne nur diese Übung. Wenn etwas Ernstes passiert, sprich bitte mit jemandem, dem du vertraust.",
        "その内容は理解できないので、コメントはしません。わたしは練習用のツールで、人間ではありません。この練習のことしかわかりません。深刻なことが起きているなら、信頼できる人に話してください。",
        "لا أستطيع متابعة ذلك، لذلك لن أعلّق عليه. أنا أداة للتدريب ولست شخصًا: لا أعرف سوى هذا التمرين. إن كان هناك أمر خطير، فتحدّث مع شخص تثق به."),
    "sc_help": _t("Here is one way to answer. Next time, try it without help.", "Esta es una forma de responder. La próxima vez, inténtalo sin ayuda.", "Esta é uma forma de responder. Da próxima vez, tente sem ajuda.",
                  "Voici une façon de répondre. La prochaine fois, essaie sans aide.", "Ecco un modo di rispondere. La prossima volta, prova senza aiuto.", "So kannst du antworten. Versuch es beim nächsten Mal ohne Hilfe.",
                  "これが答え方の一例です。次は助けなしでやってみましょう。", "هذه طريقة للإجابة. في المرة القادمة، حاول دون مساعدة."),
    "sc_repair_ok": _t("Asking that is a useful skill. Here is the question again.", "Pedir eso es una habilidad útil. Aquí va la pregunta otra vez.", "Pedir isso é uma habilidade útil. Aqui está a pergunta de novo.",
                       "Demander cela est très utile. Voici encore la question.", "Chiederlo è un'abilità utile. Ecco di nuovo la domanda.", "Das zu fragen ist nützlich. Hier ist die Frage noch einmal.",
                       "そう頼めるのは大切なスキルです。もう一度質問します。", "طلب ذلك مهارة مفيدة. إليك السؤال مرة أخرى."),
    "sc_no_word": _t("That word isn't in this exercise's list, so I won't guess.", "Esa palabra no está en la lista de este ejercicio, así que no voy a adivinar.", "Essa palavra não está na lista deste exercício, então não vou adivinhar.",
                     "Ce mot n'est pas dans la liste de cet exercice, donc je ne devine pas.", "Questa parola non è nell'elenco di questo esercizio, quindi non tiro a indovinare.", "Dieses Wort steht nicht in der Liste dieser Übung, darum rate ich nicht.",
                     "その単語はこの練習のリストにないので、推測はしません。", "هذه الكلمة ليست في قائمة هذا التمرين، لذلك لن أخمّن."),
    "sc_word_means": _t("“{word}”: {meaning}.", "«{word}»: {meaning}.", "“{word}”: {meaning}.", "« {word} » : {meaning}.", "«{word}»: {meaning}.", "„{word}“: {meaning}.", "「{word}」：{meaning}。", "«{word}»: {meaning}."),
    "sc_who": _t("I'm Lingua, a practice tool, not a person. Let's go on with the exercise.", "Soy Lingua, una herramienta de práctica, no una persona. Sigamos con el ejercicio.", "Sou a Lingua, uma ferramenta de prática, não uma pessoa. Vamos continuar o exercício.",
                 "Je suis Lingua, un outil d'entraînement, pas une personne. Continuons l'exercice.", "Sono Lingua, uno strumento di pratica, non una persona. Continuiamo l'esercizio.", "Ich bin Lingua, ein Übungswerkzeug, kein Mensch. Machen wir mit der Übung weiter.",
                 "わたしはLinguaです。練習用のツールで、人間ではありません。練習を続けましょう。", "أنا Lingua، أداة للتدريب ولست شخصًا. لنواصل التمرين."),
    "sc_choose": _t("Choose the right answer.", "Elige la respuesta correcta.", "Escolha a resposta certa.", "Choisis la bonne réponse.", "Scegli la risposta giusta.", "Wähle die richtige Antwort.", "正しい答えを選びましょう。", "اختر الإجابة الصحيحة."),
    "sc_skip": _t("Let's go to the next question.", "Pasemos a la siguiente pregunta.", "Vamos para a próxima pergunta.", "Passons à la question suivante.", "Passiamo alla prossima domanda.", "Gehen wir zur nächsten Frage.", "次の質問に進みましょう。", "لننتقل إلى السؤال التالي."),
    "sc_done": _t("You finished this situation. It's practice, so it doesn't change your level.", "Terminaste esta situación. Es práctica, así que no cambia tu nivel.", "Você terminou esta situação. É prática, então não muda o seu nível.",
                  "Tu as terminé cette situation. C'est de l'entraînement : ton niveau ne change pas.", "Hai finito questa situazione. È pratica, quindi non cambia il tuo livello.", "Du hast diese Situation beendet. Das ist Übung und ändert dein Niveau nicht.",
                  "この場面は終わりました。練習なので、レベルは変わりません。", "أنهيت هذا الموقف. إنه تدريب، لذلك لا يغيّر مستواك."),
    "sc_care": _t("I'm only a practice tool. If you feel bad, talking to someone you trust can help.", "Solo soy una herramienta de práctica. Si te sientes mal, hablar con alguien de confianza puede ayudar.", "Sou só uma ferramenta de prática. Se você se sente mal, falar com alguém de confiança pode ajudar.",
                  "Je ne suis qu'un outil d'entraînement. Si tu te sens mal, parler à quelqu'un de confiance peut aider.", "Sono solo uno strumento di pratica. Se ti senti male, parlare con qualcuno di cui ti fidi può aiutare.", "Ich bin nur ein Übungswerkzeug. Wenn es dir schlecht geht, kann es helfen, mit jemandem zu sprechen, dem du vertraust.",
                  "わたしは練習用のツールにすぎません。つらいときは、信頼できる人に話すと助けになるかもしれません。", "أنا مجرد أداة للتدريب. إن كنت تشعر بالسوء، فقد يساعدك الحديث مع شخص تثق به."),
    "sc_generic": _t("Here is a more natural way to say it.", "Así se dice de forma más natural.", "Assim fica mais natural.", "Voici une façon plus naturelle de le dire.", "Ecco un modo più naturale di dirlo.", "So klingt es natürlicher.", "こう言うと自然です。", "هكذا تبدو الجملة أكثر طبيعية."),
    "sc_spelling": _t("Check the spelling of one word.", "Revisa cómo se escribe una palabra.", "Confira a grafia de uma palavra.", "Vérifie l'orthographe d'un mot.", "Controlla come si scrive una parola.", "Prüfe die Schreibweise eines Wortes.", "単語のつづりを確認しましょう。", "راجع كتابة كلمة واحدة."),
    "sc_my_name": _t("Use “my” before “name”: My name is…", "Usa “my” antes de “name”: My name is…", "Use “my” antes de “name”: My name is…", "Utilise « my » devant « name » : My name is…", "Usa “my” prima di “name”: My name is…", "Benutze „my“ vor „name“: My name is…", "“name” の前には “my” を使います：My name is…", "استخدم “my” قبل “name”: My name is…"),
    "sc_missing_be": _t("English needs a verb here: am / is.", "El inglés necesita un verbo aquí: am / is.", "O inglês precisa de um verbo aqui: am / is.", "L'anglais a besoin d'un verbe ici : am / is.", "L'inglese ha bisogno di un verbo qui: am / is.", "Im Englischen fehlt hier ein Verb: am / is.", "英語ではここに動詞が必要です：am / is。", "تحتاج الإنجليزية إلى فعل هنا: am / is."),
    "sc_be_form": _t("Choose the right form: I am, it is, you are.", "Elige la forma correcta: I am, it is, you are.", "Escolha a forma certa: I am, it is, you are.", "Choisis la bonne forme : I am, it is, you are.", "Scegli la forma giusta: I am, it is, you are.", "Wähle die richtige Form: I am, it is, you are.", "正しい形を選びましょう：I am, it is, you are。", "اختر الصيغة الصحيحة: I am, it is, you are."),
    "sc_have_be": _t("In English you are tired or hungry: use “am”, not “have”.", "En inglés se usa “am”, no “have”: I am tired.", "Em inglês use “am”, não “have”: I am tired.", "En anglais, on utilise « am », pas « have » : I am tired.", "In inglese si usa “am”, non “have”: I am tired.", "Im Englischen sagt man „am“, nicht „have“: I am tired.", "英語では “have” ではなく “am” を使います：I am tired。", "في الإنجليزية استخدم “am” وليس “have”: I am tired."),
    "sc_missing_subject": _t("English needs the subject: I.", "El inglés necesita el sujeto: I.", "O inglês precisa do sujeito: I.", "L'anglais a besoin du sujet : I.", "L'inglese ha bisogno del soggetto: I.", "Im Englischen braucht man das Subjekt: I.", "英語では主語 I が必要です。", "تحتاج الإنجليزية إلى الفاعل: I."),
    "sc_from_prep": _t("For where you come from, use “from”.", "Para decir de dónde eres, usa “from”.", "Para dizer de onde você é, use “from”.", "Pour dire d'où tu viens, utilise « from ».", "Per dire da dove vieni, usa “from”.", "Für die Herkunft benutzt man „from“.", "出身を言うときは “from” を使います。", "للتعبير عن بلدك استخدم “from”."),
    "sc_preposition": _t("A different small word goes here.", "Aquí va otra palabra pequeña.", "Aqui vai outra palavra pequena.", "Un autre petit mot va ici.", "Qui va un'altra parolina.", "Hier steht ein anderes kleines Wort.", "ここには別の短い語が入ります。", "هنا تأتي كلمة صغيرة أخرى."),
    "sc_be_plus_verb": _t("Don't put “am” before this verb: I want, I like, I come.", "No pongas “am” antes de este verbo: I want, I like, I come.", "Não use “am” antes deste verbo: I want, I like, I come.", "Ne mets pas « am » devant ce verbe : I want, I like, I come.", "Non mettere “am” prima di questo verbo: I want, I like, I come.", "Kein „am“ vor diesem Verb: I want, I like, I come.", "この動詞の前に “am” は不要です：I want, I like, I come。", "لا تضع “am” قبل هذا الفعل: I want, I like, I come."),
    "sc_third_person": _t("With “I”, the verb has no -s: I like, I want, I have.", "Con “I”, el verbo no lleva -s: I like, I want, I have.", "Com “I”, o verbo não tem -s: I like, I want, I have.", "Avec « I », le verbe n'a pas de -s : I like, I want, I have.", "Con “I”, il verbo non ha la -s: I like, I want, I have.", "Mit „I“ hat das Verb kein -s: I like, I want, I have.", "“I” のとき動詞に -s は付きません：I like, I want, I have。", "مع “I” لا يأخذ الفعل ‎-s‎: I like, I want, I have."),
    "sc_negation": _t("To say no, use “don't” before the verb: I don't like…", "Para negar, usa “don't” antes del verbo: I don't like…", "Para negar, use “don't” antes do verbo: I don't like…", "Pour la négation, utilise « don't » devant le verbe : I don't like…", "Per negare, usa “don't” prima del verbo: I don't like…", "Für die Verneinung steht „don't“ vor dem Verb: I don't like…", "否定は動詞の前に “don't” を使います：I don't like…", "للنفي استخدم “don't” قبل الفعل: I don't like…"),
    "sc_plural": _t("More than one: add -s.", "Más de uno: agrega -s.", "Mais de um: acrescente -s.", "Plus d'un : ajoute -s.", "Più di uno: aggiungi -s.", "Mehr als eins: -s anhängen.", "2つ以上なら -s を付けます。", "أكثر من واحد: أضف ‎-s‎."),
    "sc_would_like": _t("To order, say “I would like…” or “I'd like…”.", "Para pedir, di “I would like…” o “I'd like…”.", "Para pedir, diga “I would like…” ou “I'd like…”.", "Pour commander, dis « I would like… » ou « I'd like… ».", "Per ordinare, di' “I would like…” o “I'd like…”.", "Zum Bestellen sagt man „I would like…“ oder „I'd like…“.", "注文するときは “I would like…” と言います。", "للطلب قل “I would like…” أو “I'd like…”."),
    "sc_polite": _t("It sounds more polite as a question.", "Suena más amable como pregunta.", "Soa mais educado como pergunta.", "C'est plus poli sous forme de question.", "Suona più gentile come domanda.", "Als Frage klingt es höflicher.", "質問の形にすると丁寧です。", "تبدو أكثر تهذيبًا على شكل سؤال."),
    "sc_word_order": _t("The words go in a different order.", "Las palabras van en otro orden.", "As palavras vão em outra ordem.", "Les mots vont dans un autre ordre.", "Le parole vanno in un altro ordine.", "Die Wörter stehen in einer anderen Reihenfolge.", "語順が違います。", "الكلمات تأتي بترتيب آخر."),
    "sc_article_extra": _t("No “the” is needed here.", "Aquí no hace falta “the”.", "Aqui não precisa de “the”.", "Pas besoin de « the » ici.", "Qui non serve “the”.", "Hier braucht man kein „the“.", "ここに “the” は不要です。", "لا حاجة إلى “the” هنا."),
    "sc_article_missing": _t("Use “a” or “an” before one thing.", "Usa “a” o “an” antes de una cosa.", "Use “a” ou “an” antes de uma coisa.", "Utilise « a » ou « an » devant une chose.", "Usa “a” o “an” prima di una cosa.", "Vor einer Sache steht „a“ oder „an“.", "1つのものの前には “a / an” を使います。", "استخدم “a” أو “an” قبل الشيء الواحد."),
    "sc_article_form": _t("Before a vowel sound, use “an”; otherwise “a”.", "Antes de sonido vocal, usa “an”; si no, “a”.", "Antes de som de vogal, use “an”; senão, “a”.", "Devant un son de voyelle, utilise « an » ; sinon « a ».", "Davanti a un suono vocalico usa “an”; altrimenti “a”.", "Vor einem Vokallaut steht „an“, sonst „a“.", "母音の音の前は “an”、それ以外は “a” です。", "قبل صوت متحرّك استخدم “an”، وإلا “a”."),
    "sc_question_form": _t("Questions change the order of the words.", "Las preguntas cambian el orden de las palabras.", "As perguntas mudam a ordem das palavras.", "Les questions changent l'ordre des mots.", "Le domande cambiano l'ordine delle parole.", "In Fragen ändert sich die Wortstellung.", "疑問文では語順が変わります。", "الأسئلة تغيّر ترتيب الكلمات."),
    "sc_much_many": _t("For a price, say “how much”.", "Para el precio, di “how much”.", "Para o preço, diga “how much”.", "Pour un prix, dis « how much ».", "Per il prezzo, di' “how much”.", "Beim Preis sagt man „how much“.", "値段には “how much” を使います。", "للسعر قل “how much”."),
    "sc_extra_to": _t("No “to” after “can”.", "Sin “to” después de “can”.", "Sem “to” depois de “can”.", "Pas de « to » après « can ».", "Niente “to” dopo “can”.", "Kein „to“ nach „can“.", "“can” の後に “to” は不要です。", "لا تأتي “to” بعد “can”."),
    "sc_adverb": _t("Say how you speak with -ly: slowly.", "Para decir cómo hablas, usa -ly: slowly.", "Para dizer como você fala, use -ly: slowly.", "Pour dire comment on parle, utilise -ly : slowly.", "Per dire come parli, usa -ly: slowly.", "Für die Art des Sprechens: -ly, also slowly.", "話し方を言うときは -ly を使います：slowly。", "لوصف طريقة الكلام استخدم ‎-ly‎: slowly."),
}

# Spoken in the language being practised, whatever the learner's own language is.
TARGET_LINES = {
    "sc_try_again": {"en": "Try again.", "es": "Otra vez."},
    "sc_move_on": {"en": "OK, let's go on.", "es": "Bueno, seguimos."},
}

# The Spanish course is explained in English only (src/learning/courses/registry.js).
ES_EXPLANATIONS = {
    "sc_es_estar": "How you feel uses “estar”: estoy bien.",
    "sc_es_bien": "“Bien” = well/fine. “Bueno” = good (a good book). Say: estoy bien.",
    "sc_es_ser": "What something is and where you are from use “ser”: soy, es.",
    "sc_es_want": "To order, say what you want: quiero…, or just “un café, por favor”.",
    "sc_es_yo": "About yourself the verb ends in -o: quiero, trabajo, vivo.",
    "sc_es_prep": "Spanish uses a different small word here: con tarjeta, a las siete.",
    "sc_es_gustar": "“Gusta” goes with one thing, “gustan” with several: me gusta la música, me gustan los libros.",
    "sc_es_plural": "More than one: manzanas.",
    "sc_es_article_gender": "The article must match the noun: un libro, una mesa, una manzana.",
    "sc_es_article_missing": "Spanish needs an article here: un libro, una mesa.",
    "sc_es_article_indefinite": "To say what something is, use un / una.",
    "sc_es_stem": "This verb changes inside: costar → cuesta.",
    "sc_es_cuanto": "For a price, say: ¿cuánto cuesta?",
    "sc_es_infinitive": "Don't leave the verb in its dictionary form: no entiendo, ¿puede repetir?",
    "sc_es_reflexive": "“Levantarse” needs “me”: me levanto.",
}
