"""The local tutor's auxiliary text, in the learner's one user_language.

English is what the learner practises, so the English material inside these
messages (example sentences, the corrected sentence, verb forms) is never
translated. Everything around it — instructions, explanations, corrections'
reasons, suggestions — follows the explicit language code the client sends.

The eight languages are the eight the product implements. Any other code gets
English and the caller is told (`localized=False`): nothing silently pretends
to be a language it is not. These strings were written for this catalogue and
have not yet been reviewed by native-speaking teachers.
"""
from __future__ import annotations

SUPPORTED = ("en", "es", "pt", "fr", "it", "de", "ja", "ar")

MESSAGES: dict[str, dict[str, str]] = {
    # --- explanations: irregular past given "-ed" ---------------------------
    "past_irregular.brief": {
        "en": "'{base}' is irregular: its past form is '{past}', not '{wrong}'.",
        "es": "'{base}' es irregular: su pasado es '{past}', no '{wrong}'.",
        "pt": "'{base}' é irregular: o passado é '{past}', não '{wrong}'.",
        "fr": "« {base} » est irrégulier : son passé est « {past} », pas « {wrong} ».",
        "it": "'{base}' è irregolare: il passato è '{past}', non '{wrong}'.",
        "de": "„{base}“ ist unregelmäßig: Die Vergangenheit ist „{past}“, nicht „{wrong}“.",
        "ja": "「{base}」は不規則動詞です。過去形は「{wrong}」ではなく「{past}」です。",
        "ar": "الفعل '{base}' شاذّ: صيغة الماضي منه '{past}' وليست '{wrong}'.",
    },
    "past_irregular.detailed": {
        "en": "Regular verbs add -ed in the past (play → played), but '{base}' changes form: {base} → {past}. Compare: ✗ {wrong} · ✓ {past}.",
        "es": "Los verbos regulares agregan -ed en pasado (play → played), pero '{base}' cambia de forma: {base} → {past}. Compara: ✗ {wrong} · ✓ {past}.",
        "pt": "Os verbos regulares recebem -ed no passado (play → played), mas '{base}' muda de forma: {base} → {past}. Compare: ✗ {wrong} · ✓ {past}.",
        "fr": "Les verbes réguliers prennent -ed au passé (play → played), mais « {base} » change de forme : {base} → {past}. Comparez : ✗ {wrong} · ✓ {past}.",
        "it": "I verbi regolari aggiungono -ed al passato (play → played), ma '{base}' cambia forma: {base} → {past}. Confronta: ✗ {wrong} · ✓ {past}.",
        "de": "Regelmäßige Verben bekommen in der Vergangenheit -ed (play → played), aber „{base}“ ändert seine Form: {base} → {past}. Vergleiche: ✗ {wrong} · ✓ {past}.",
        "ja": "規則動詞は過去形で -ed を付けます（play → played）が、「{base}」は形が変わります：{base} → {past}。比べてみましょう：✗ {wrong} · ✓ {past}。",
        "ar": "الأفعال القياسية تُضاف إليها ‎-ed‎ في الماضي (play → played)، أمّا '{base}' فيتغيّر شكله: {base} → {past}. قارن: ✗ {wrong} · ✓ {past}.",
    },
    # --- explanations: finished time with a present verb --------------------
    "past_marker.brief": {
        "en": "'{marker}' means it already happened, so the verb goes in the past: {wrong} → {past}.",
        "es": "'{marker}' indica que ya ocurrió, así que el verbo va en pasado: {wrong} → {past}.",
        "pt": "'{marker}' indica que já aconteceu, então o verbo vai no passado: {wrong} → {past}.",
        "fr": "« {marker} » indique que c'est déjà arrivé, donc le verbe se met au passé : {wrong} → {past}.",
        "it": "'{marker}' indica che è già successo, quindi il verbo va al passato: {wrong} → {past}.",
        "de": "„{marker}“ zeigt, dass es schon passiert ist, also steht das Verb in der Vergangenheit: {wrong} → {past}.",
        "ja": "「{marker}」はもう起きたことを表すので、動詞は過去形にします：{wrong} → {past}。",
        "ar": "'{marker}' تعني أنّ الأمر حدث بالفعل، لذا يأتي الفعل بصيغة الماضي: {wrong} → {past}.",
    },
    "past_marker.detailed": {
        "en": "Words like 'yesterday', 'last week' or 'two days ago' mark a finished time, and the verb must be in the past. Regular verbs add -ed (walk → walked); some change completely (go → went). Here: {wrong} → {past}.",
        "es": "Palabras como 'yesterday', 'last week' o 'two days ago' marcan un tiempo terminado, y el verbo debe ir en pasado. Los regulares agregan -ed (walk → walked); otros cambian por completo (go → went). Aquí: {wrong} → {past}.",
        "pt": "Palavras como 'yesterday', 'last week' ou 'two days ago' marcam um tempo terminado, e o verbo deve ir no passado. Os regulares recebem -ed (walk → walked); outros mudam totalmente (go → went). Aqui: {wrong} → {past}.",
        "fr": "Des mots comme « yesterday », « last week » ou « two days ago » marquent un moment terminé, et le verbe doit être au passé. Les réguliers prennent -ed (walk → walked) ; d'autres changent complètement (go → went). Ici : {wrong} → {past}.",
        "it": "Parole come 'yesterday', 'last week' o 'two days ago' indicano un tempo concluso, e il verbo deve andare al passato. I regolari aggiungono -ed (walk → walked); altri cambiano del tutto (go → went). Qui: {wrong} → {past}.",
        "de": "Wörter wie „yesterday“, „last week“ oder „two days ago“ markieren eine abgeschlossene Zeit, und das Verb muss in der Vergangenheit stehen. Regelmäßige Verben bekommen -ed (walk → walked); andere ändern sich ganz (go → went). Hier: {wrong} → {past}.",
        "ja": "「yesterday」「last week」「two days ago」のような言葉は終わった時を表すので、動詞は過去形にします。規則動詞は -ed を付け（walk → walked）、形がすっかり変わる動詞もあります（go → went）。ここでは：{wrong} → {past}。",
        "ar": "كلمات مثل 'yesterday' و'last week' و'two days ago' تدلّ على زمن انتهى، فيجب أن يأتي الفعل بصيغة الماضي. الأفعال القياسية تُضاف إليها ‎-ed‎ (walk → walked)، وبعضها يتغيّر كليًّا (go → went). هنا: {wrong} → {past}.",
    },
    # --- explanations: he/she/it agreement ----------------------------------
    "third_person.brief": {
        "en": "With he, she or it in the present, the verb takes -s: {subject} {fixed}.",
        "es": "Con he, she o it en presente, el verbo lleva -s: {subject} {fixed}.",
        "pt": "Com he, she ou it no presente, o verbo recebe -s: {subject} {fixed}.",
        "fr": "Avec he, she ou it au présent, le verbe prend un -s : {subject} {fixed}.",
        "it": "Con he, she o it al presente, il verbo prende la -s: {subject} {fixed}.",
        "de": "Mit he, she oder it bekommt das Verb im Präsens ein -s: {subject} {fixed}.",
        "ja": "現在形で主語が he・she・it のとき、動詞に -s が付きます：{subject} {fixed}。",
        "ar": "مع he أو she أو it في المضارع، يأخذ الفعل ‎-s‎: {subject} {fixed}.",
    },
    "third_person.detailed": {
        "en": "In the present: I, you, we, they {base} — but he, she, it {fixed}. Compare: ✗ {subject} {base} · ✓ {subject} {fixed}.",
        "es": "En presente: I, you, we, they {base}; pero he, she, it {fixed}. Compara: ✗ {subject} {base} · ✓ {subject} {fixed}.",
        "pt": "No presente: I, you, we, they {base}; mas he, she, it {fixed}. Compare: ✗ {subject} {base} · ✓ {subject} {fixed}.",
        "fr": "Au présent : I, you, we, they {base} ; mais he, she, it {fixed}. Comparez : ✗ {subject} {base} · ✓ {subject} {fixed}.",
        "it": "Al presente: I, you, we, they {base}; ma he, she, it {fixed}. Confronta: ✗ {subject} {base} · ✓ {subject} {fixed}.",
        "de": "Im Präsens: I, you, we, they {base} – aber he, she, it {fixed}. Vergleiche: ✗ {subject} {base} · ✓ {subject} {fixed}.",
        "ja": "現在形では I・you・we・they なら {base}、he・she・it なら {fixed} です。比べてみましょう：✗ {subject} {base} · ✓ {subject} {fixed}。",
        "ar": "في المضارع: I وyou وwe وthey ‏{base}، أمّا he وshe وit ‏{fixed}. قارن: ✗ {subject} {base} · ✓ {subject} {fixed}.",
    },
    # --- P5: the same agreement after a NOUN subject ("My sister like") -------
    "third_person_noun.brief": {
        "en": "{subject} is one person or thing, like he or she, so the present verb takes -s: {subject} {fixed}.",
        "es": "{subject} es una sola persona o cosa, como he o she; por eso el verbo en presente lleva -s: {subject} {fixed}.",
        "pt": "{subject} é uma só pessoa ou coisa, como he ou she; por isso o verbo no presente recebe -s: {subject} {fixed}.",
        "fr": "{subject} est une seule personne ou chose, comme he ou she ; le verbe au présent prend donc un -s : {subject} {fixed}.",
        "it": "{subject} è una sola persona o cosa, come he o she; per questo il verbo al presente prende la -s: {subject} {fixed}.",
        "de": "{subject} ist eine einzelne Person oder Sache, wie he oder she – deshalb bekommt das Verb im Präsens ein -s: {subject} {fixed}.",
        "ja": "{subject} は he や she と同じく一人（一つ）なので、現在形の動詞に -s が付きます：{subject} {fixed}。",
        "ar": "‏{subject} شخص أو شيء واحد مثل he أو she، لذلك يأخذ الفعل في المضارع ‎-s‎: {subject} {fixed}.",
    },
    "third_person_noun.detailed": {
        "en": "One person or thing works like he or she: ✗ {subject} {base} · ✓ {subject} {fixed}. With more than one (my sisters, they) the verb stays {base}.",
        "es": "Una sola persona o cosa funciona como he o she: ✗ {subject} {base} · ✓ {subject} {fixed}. Con varias (my sisters, they) el verbo queda {base}.",
        "pt": "Uma só pessoa ou coisa funciona como he ou she: ✗ {subject} {base} · ✓ {subject} {fixed}. Com várias (my sisters, they) o verbo fica {base}.",
        "fr": "Une seule personne ou chose se comporte comme he ou she : ✗ {subject} {base} · ✓ {subject} {fixed}. Avec plusieurs (my sisters, they), le verbe reste {base}.",
        "it": "Una sola persona o cosa si comporta come he o she: ✗ {subject} {base} · ✓ {subject} {fixed}. Con più di una (my sisters, they) il verbo resta {base}.",
        "de": "Eine einzelne Person oder Sache verhält sich wie he oder she: ✗ {subject} {base} · ✓ {subject} {fixed}. Bei mehreren (my sisters, they) bleibt das Verb {base}.",
        "ja": "一人（一つ）の主語は he や she と同じです：✗ {subject} {base} · ✓ {subject} {fixed}。複数（my sisters, they）なら動詞は {base} のままです。",
        "ar": "الشخص أو الشيء الواحد يُعامَل مثل he أو she: ✗ {subject} {base} · ✓ {subject} {fixed}. ومع أكثر من واحد (my sisters, they) يبقى الفعل ‏{base}.",
    },
    # --- explanations: a / an ------------------------------------------------
    "article.brief": {
        "en": "Use '{article}' before '{word}': it depends on the first sound.",
        "es": "Usa '{article}' antes de '{word}': depende del primer sonido.",
        "pt": "Use '{article}' antes de '{word}': depende do primeiro som.",
        "fr": "Utilisez « {article} » devant « {word} » : cela dépend du premier son.",
        "it": "Usa '{article}' davanti a '{word}': dipende dal primo suono.",
        "de": "Vor „{word}“ steht „{article}“: Es kommt auf den ersten Laut an.",
        "ja": "「{word}」の前は「{article}」です。最初の音で決まります。",
        "ar": "استخدم '{article}' قبل '{word}': يعتمد ذلك على الصوت الأول.",
    },
    "article.detailed": {
        "en": "'a' and 'an' follow the first SOUND of the next word, not the letter: a dog, an apple, an hour, a university. Here: {article} {word}.",
        "es": "'a' y 'an' dependen del primer SONIDO de la palabra siguiente, no de la letra: a dog, an apple, an hour, a university. Aquí: {article} {word}.",
        "pt": "'a' e 'an' dependem do primeiro SOM da palavra seguinte, não da letra: a dog, an apple, an hour, a university. Aqui: {article} {word}.",
        "fr": "« a » et « an » dépendent du premier SON du mot suivant, pas de la lettre : a dog, an apple, an hour, a university. Ici : {article} {word}.",
        "it": "'a' e 'an' dipendono dal primo SUONO della parola seguente, non dalla lettera: a dog, an apple, an hour, a university. Qui: {article} {word}.",
        "de": "„a“ und „an“ richten sich nach dem ersten LAUT des nächsten Wortes, nicht nach dem Buchstaben: a dog, an apple, an hour, a university. Hier: {article} {word}.",
        "ja": "「a」と「an」は次の単語の文字ではなく最初の音で決まります：a dog, an apple, an hour, a university。ここでは：{article} {word}。",
        "ar": "'a' و'an' تتبعان الصوت الأول للكلمة التالية لا الحرف: a dog, an apple, an hour, a university. هنا: {article} {word}.",
    },
    # --- explanations: fixed beginner phrases ---------------------------------
    "question_order.brief": {
        "en": "In a question with 'how', the order is How + are + you.",
        "es": "En una pregunta con 'how', el orden es How + are + you.",
        "pt": "Numa pergunta com 'how', a ordem é How + are + you.",
        "fr": "Dans une question avec « how », l'ordre est How + are + you.",
        "it": "In una domanda con 'how', l'ordine è How + are + you.",
        "de": "In einer Frage mit „how“ ist die Reihenfolge How + are + you.",
        "ja": "「how」を使う疑問文の語順は How + are + you です。",
        "ar": "في السؤال الذي يبدأ بـ 'how' يكون الترتيب How + are + you.",
    },
    "subject_needed.brief": {
        "en": "An English sentence needs a subject: start with 'I'.",
        "es": "Una oración en inglés necesita sujeto: empieza con 'I'.",
        "pt": "Uma frase em inglês precisa de sujeito: comece com 'I'.",
        "fr": "Une phrase anglaise a besoin d'un sujet : commencez par « I ».",
        "it": "Una frase inglese ha bisogno di un soggetto: inizia con 'I'.",
        "de": "Ein englischer Satz braucht ein Subjekt: Beginne mit „I“.",
        "ja": "英語の文には主語が必要です。「I」から始めましょう。",
        "ar": "الجملة الإنجليزية تحتاج إلى فاعل: ابدأ بـ 'I'.",
    },
    "contraction.brief": {
        "en": "'I'm' is short for 'I am' and needs the apostrophe.",
        "es": "'I'm' es la forma corta de 'I am' y lleva apóstrofo.",
        "pt": "'I'm' é a forma curta de 'I am' e leva apóstrofo.",
        "fr": "« I'm » est la forme courte de « I am » et prend une apostrophe.",
        "it": "'I'm' è la forma breve di 'I am' e vuole l'apostrofo.",
        "de": "„I'm“ ist die Kurzform von „I am“ und braucht den Apostroph.",
        "ja": "「I'm」は「I am」の短縮形で、アポストロフィが必要です。",
        "ar": "'I'm' اختصار لـ 'I am' وتحتاج إلى الفاصلة العليا.",
    },
    "negation.brief": {
        "en": "To make a verb negative, use 'do not' (or 'don't') before it.",
        "es": "Para negar un verbo, usa 'do not' (o 'don't') antes de él.",
        "pt": "Para negar um verbo, use 'do not' (ou 'don't') antes dele.",
        "fr": "Pour mettre un verbe à la forme négative, utilisez « do not » (ou « don't ») devant.",
        "it": "Per negare un verbo, usa 'do not' (o 'don't') prima del verbo.",
        "de": "Um ein Verb zu verneinen, setze „do not“ (oder „don't“) davor.",
        "ja": "動詞を否定するには、前に「do not」（または「don't」）を置きます。",
        "ar": "لنفي الفعل استخدم 'do not' (أو 'don't') قبله.",
    },
    "want_to.brief": {
        "en": "The order is I want to + verb.",
        "es": "El orden es I want to + verbo.",
        "pt": "A ordem é I want to + verbo.",
        "fr": "L'ordre est I want to + verbe.",
        "it": "L'ordine è I want to + verbo.",
        "de": "Die Reihenfolge ist I want to + Verb.",
        "ja": "語順は I want to + 動詞 です。",
        "ar": "الترتيب هو I want to + الفعل.",
    },
    "spelling.brief": {
        "en": "The correct spelling is '{correction}'.",
        "es": "Se escribe '{correction}'.",
        "pt": "Escreve-se '{correction}'.",
        "fr": "Cela s'écrit « {correction} ».",
        "it": "Si scrive '{correction}'.",
        "de": "Man schreibt „{correction}“.",
        "ja": "正しいつづりは「{correction}」です。",
        "ar": "التهجئة الصحيحة هي '{correction}'.",
    },
    "compare": {
        "en": "Compare: ✗ {wrong} · ✓ {right}",
        "es": "Compara: ✗ {wrong} · ✓ {right}",
        "pt": "Compare: ✗ {wrong} · ✓ {right}",
        "fr": "Comparez : ✗ {wrong} · ✓ {right}",
        "it": "Confronta: ✗ {wrong} · ✓ {right}",
        "de": "Vergleiche: ✗ {wrong} · ✓ {right}",
        "ja": "比べてみましょう：✗ {wrong} · ✓ {right}",
        "ar": "قارن: ✗ {wrong} · ✓ {right}",
    },
    "gentle_prefix": {
        "en": "Just one thing: {text}",
        "es": "Solo una cosa: {text}",
        "pt": "Só uma coisa: {text}",
        "fr": "Juste une chose : {text}",
        "it": "Solo una cosa: {text}",
        "de": "Nur eine Sache: {text}",
        "ja": "ひとつだけ：{text}",
        "ar": "أمر واحد فقط: {text}",
    },
    # --- practice prompts (English material stays English) -------------------
    "rewrite": {
        "en": "Write it again using: \"{correction}\"",
        "es": "Escríbela otra vez usando: \"{correction}\"",
        "pt": "Escreva de novo usando: \"{correction}\"",
        "fr": "Réécrivez-la en utilisant : « {correction} »",
        "it": "Riscrivila usando: \"{correction}\"",
        "de": "Schreib es noch einmal mit: „{correction}“",
        "ja": "次の形を使ってもう一度書いてください：「{correction}」",
        "ar": "اكتبها مرة أخرى مستخدمًا: \"{correction}\"",
    },
    "fill_past": {
        "en": "Your turn, without looking back: fill the gap with the past of '{base}': {material}",
        "es": "Tu turno, sin mirar arriba: completa con el pasado de '{base}': {material}",
        "pt": "Sua vez, sem olhar acima: complete com o passado de '{base}': {material}",
        "fr": "À vous, sans regarder plus haut : complétez avec le passé de « {base} » : {material}",
        "it": "Tocca a te, senza guardare sopra: completa con il passato di '{base}': {material}",
        "de": "Jetzt du, ohne nach oben zu schauen: Ergänze die Vergangenheit von „{base}“: {material}",
        "ja": "上を見ずにやってみましょう。「{base}」の過去形で空欄を埋めてください：{material}",
        "ar": "دورك، دون النظر إلى الأعلى: أكمل الفراغ بصيغة الماضي من '{base}': {material}",
    },
    # P3: a retrieval on a later day, about something that was hard before.
    # It says what it is (a check of earlier work), never "you failed this".
    "retrieval_lead": {
        "en": "A quick check from an earlier day.",
        "es": "Un repaso rápido de otro día.",
        "pt": "Uma revisão rápida de outro dia.",
        "fr": "Un petit rappel d’un autre jour.",
        "it": "Un ripasso veloce di un altro giorno.",
        "de": "Eine kurze Wiederholung von einem anderen Tag.",
        "ja": "前に練習したことの、短い確認です。",
        "ar": "مراجعة سريعة لشيء من يوم سابق.",
    },
    "fill_generic": {
        "en": "Your turn, without looking back: fill the gap: {material}",
        "es": "Tu turno, sin mirar arriba: completa el espacio: {material}",
        "pt": "Sua vez, sem olhar acima: complete a lacuna: {material}",
        "fr": "À vous, sans regarder plus haut : complétez : {material}",
        "it": "Tocca a te, senza guardare sopra: completa lo spazio: {material}",
        "de": "Jetzt du, ohne nach oben zu schauen: Ergänze die Lücke: {material}",
        "ja": "上を見ずにやってみましょう。空欄を埋めてください：{material}",
        "ar": "دورك، دون النظر إلى الأعلى: أكمل الفراغ: {material}",
    },
    "complete": {
        "en": "Complete: {material}", "es": "Completa: {material}", "pt": "Complete: {material}",
        "fr": "Complétez : {material}", "it": "Completa: {material}", "de": "Ergänze: {material}",
        "ja": "完成させてください：{material}", "ar": "أكمل: {material}",
    },
    "answer_naturally": {
        "en": "Answer naturally: {material}", "es": "Responde con naturalidad: {material}",
        "pt": "Responda com naturalidade: {material}", "fr": "Répondez naturellement : {material}",
        "it": "Rispondi in modo naturale: {material}", "de": "Antworte natürlich: {material}",
        "ja": "自然に答えてみましょう：{material}", "ar": "أجب بشكل طبيعي: {material}",
    },
    "ask_back": {
        "en": "Ask a question back about the same topic.",
        "es": "Haz una pregunta de vuelta sobre el mismo tema.",
        "pt": "Faça uma pergunta de volta sobre o mesmo tema.",
        "fr": "Posez une question en retour sur le même sujet.",
        "it": "Fai a tua volta una domanda sullo stesso argomento.",
        "de": "Stell eine Gegenfrage zum selben Thema.",
        "ja": "同じ話題について、こちらに質問を返してみましょう。",
        "ar": "اطرح سؤالًا مقابلًا عن الموضوع نفسه.",
    },
    "use_word": {
        "en": "Use '{word}' in your next sentence.", "es": "Usa '{word}' en tu próxima frase.",
        "pt": "Use '{word}' na sua próxima frase.", "fr": "Utilisez « {word} » dans votre prochaine phrase.",
        "it": "Usa '{word}' nella tua prossima frase.", "de": "Verwende „{word}“ in deinem nächsten Satz.",
        "ja": "次の文で「{word}」を使ってみましょう。", "ar": "استخدم '{word}' في جملتك التالية.",
    },
    # --- suggestions -----------------------------------------------------------
    "sugg_try_english": {
        "en": "Try answering with a short sentence in English.",
        "es": "Intenta responder con una frase corta en inglés.",
        "pt": "Tente responder com uma frase curta em inglês.",
        "fr": "Essayez de répondre par une phrase courte en anglais.",
        "it": "Prova a rispondere con una frase breve in inglese.",
        "de": "Versuch, mit einem kurzen Satz auf Englisch zu antworten.",
        "ja": "英語の短い文で答えてみましょう。",
        "ar": "حاول أن تجيب بجملة قصيرة بالإنجليزية.",
    },
    "sugg_simple": {
        "en": "Use a simple sentence: I + verb + one idea.",
        "es": "Usa una frase simple: I + verbo + una idea.",
        "pt": "Use uma frase simples: I + verbo + uma ideia.",
        "fr": "Faites une phrase simple : I + verbe + une idée.",
        "it": "Usa una frase semplice: I + verbo + un'idea.",
        "de": "Bilde einen einfachen Satz: I + Verb + eine Idee.",
        "ja": "シンプルな文で：I + 動詞 + ひとつの内容。",
        "ar": "استخدم جملة بسيطة: I + فعل + فكرة واحدة.",
    },
    "sugg_reason": {
        "en": "Add a reason or an example.", "es": "Agrega una razón o un ejemplo.",
        "pt": "Acrescente um motivo ou um exemplo.", "fr": "Ajoutez une raison ou un exemple.",
        "it": "Aggiungi un motivo o un esempio.", "de": "Füge einen Grund oder ein Beispiel hinzu.",
        "ja": "理由か例をひとつ加えてみましょう。", "ar": "أضف سببًا أو مثالًا.",
    },
    "sugg_nuance": {
        "en": "Add nuance with a contrast or a qualification.",
        "es": "Agrega matices con un contraste o una salvedad.",
        "pt": "Acrescente nuances com um contraste ou uma ressalva.",
        "fr": "Nuancez avec un contraste ou une réserve.",
        "it": "Aggiungi sfumature con un contrasto o una precisazione.",
        "de": "Füge Nuancen hinzu, mit einem Gegensatz oder einer Einschränkung.",
        "ja": "対比や条件を加えて、ニュアンスを出してみましょう。",
        "ar": "أضف دقّة بمقارنة أو استدراك.",
    },
    "sugg_repeat": {
        "en": "Say the corrected sentence once more, then keep going.",
        "es": "Di la frase corregida una vez más y sigue.",
        "pt": "Diga a frase corrigida mais uma vez e continue.",
        "fr": "Redites la phrase corrigée une fois, puis continuez.",
        "it": "Ripeti la frase corretta una volta e poi continua.",
        "de": "Sag den korrigierten Satz noch einmal und mach dann weiter.",
        "ja": "直した文をもう一度言ってから、続けましょう。",
        "ar": "قل الجملة المصحّحة مرة أخرى ثم تابع.",
    },
    "sugg_unclear": {
        "en": "Write a full sentence so I can give you useful feedback.",
        "es": "Escribe una oración completa para que pueda darte una corrección útil.",
        "pt": "Escreva uma frase completa para eu poder dar um retorno útil.",
        "fr": "Écrivez une phrase complète pour que je puisse vous donner un retour utile.",
        "it": "Scrivi una frase completa così posso darti un riscontro utile.",
        "de": "Schreib einen ganzen Satz, damit ich dir sinnvolles Feedback geben kann.",
        "ja": "役に立つフィードバックができるよう、文の形で書いてみてください。",
        "ar": "اكتب جملة كاملة حتى أتمكّن من إعطائك ملاحظة مفيدة.",
    },
    # --- translation (the dictionary only covers some Spanish words) ----------
    "translation_to_en": {
        "en": "\"{phrase}\" in English is \"{translation}\".", "es": "\"{phrase}\" en inglés se dice \"{translation}\".",
        "pt": "\"{phrase}\" em inglês é \"{translation}\".", "fr": "« {phrase} » se dit « {translation} » en anglais.",
        "it": "\"{phrase}\" in inglese si dice \"{translation}\".", "de": "„{phrase}“ heißt auf Englisch „{translation}“.",
        "ja": "「{phrase}」は英語で「{translation}」です。", "ar": "\"{phrase}\" بالإنجليزية هي \"{translation}\".",
    },
    "translation_unknown": {
        "en": "In local mode I only know a few words, so I can't translate that reliably.",
        "es": "En modo local solo conozco algunas palabras, así que no puedo traducir eso con seguridad.",
        "pt": "No modo local só conheço algumas palavras, então não consigo traduzir isso com segurança.",
        "fr": "En mode local, je ne connais que quelques mots : je ne peux pas traduire cela de façon fiable.",
        "it": "In modalità locale conosco solo alcune parole, quindi non posso tradurlo in modo affidabile.",
        "de": "Im lokalen Modus kenne ich nur wenige Wörter, deshalb kann ich das nicht zuverlässig übersetzen.",
        "ja": "ローカルモードでは知っている単語が少ないため、確実に翻訳できません。",
        "ar": "في الوضع المحلي أعرف كلمات قليلة فقط، لذا لا أستطيع ترجمة ذلك بدقّة.",
    },
    "meaning_known": {
        "en": "\"{phrase}\" means \"{translation}\".", "es": "\"{phrase}\" significa \"{translation}\".",
        "pt": "\"{phrase}\" significa \"{translation}\".", "fr": "« {phrase} » signifie « {translation} ».",
        "it": "\"{phrase}\" significa \"{translation}\".", "de": "„{phrase}“ bedeutet „{translation}“.",
        "ja": "「{phrase}」は「{translation}」という意味です。", "ar": "\"{phrase}\" تعني \"{translation}\".",
    },
    "example_like": {
        "en": "Example: {material}", "es": "Ejemplo: {material}", "pt": "Exemplo: {material}",
        "fr": "Exemple : {material}", "it": "Esempio: {material}", "de": "Beispiel: {material}",
        "ja": "例：{material}", "ar": "مثال: {material}",
    },
    "ask_translation_hint": {
        "en": "Ask like this: {material}", "es": "Pregunta así: {material}", "pt": "Pergunte assim: {material}",
        "fr": "Demandez ainsi : {material}", "it": "Chiedi così: {material}", "de": "Frag so: {material}",
        "ja": "このように聞いてみましょう：{material}", "ar": "اسأل هكذا: {material}",
    },
    # --- focus labels ------------------------------------------------------------
    "focus_conversation": {
        "en": "Keep the conversation moving", "es": "Mantén la conversación", "pt": "Mantenha a conversa",
        "fr": "Faire vivre la conversation", "it": "Portare avanti la conversazione", "de": "Das Gespräch fortsetzen",
        "ja": "会話を続ける", "ar": "مواصلة المحادثة",
    },
    "focus_past": {
        "en": "Past tense", "es": "Tiempo pasado", "pt": "Tempo passado", "fr": "Le passé",
        "it": "Il passato", "de": "Vergangenheit", "ja": "過去形", "ar": "زمن الماضي",
    },
    "focus_agreement": {
        "en": "Verb agreement (he/she/it)", "es": "Concordancia del verbo (he/she/it)",
        "pt": "Concordância do verbo (he/she/it)", "fr": "Accord du verbe (he/she/it)",
        "it": "Accordo del verbo (he/she/it)", "de": "Verbform bei he/she/it",
        "ja": "動詞の形（he/she/it）", "ar": "مطابقة الفعل (he/she/it)",
    },
    "focus_articles": {
        "en": "a / an", "es": "a / an", "pt": "a / an", "fr": "a / an",
        "it": "a / an", "de": "a / an", "ja": "a / an", "ar": "a / an",
    },
    "focus_phrase": {
        "en": "Useful everyday phrases", "es": "Frases útiles del día a día", "pt": "Frases úteis do dia a dia",
        "fr": "Phrases utiles du quotidien", "it": "Frasi utili di tutti i giorni", "de": "Nützliche Alltagssätze",
        "ja": "日常の便利な表現", "ar": "عبارات يومية مفيدة",
    },
    "focus_translation": {
        "en": "Useful translation", "es": "Traducción útil", "pt": "Tradução útil", "fr": "Traduction utile",
        "it": "Traduzione utile", "de": "Nützliche Übersetzung", "ja": "役に立つ訳", "ar": "ترجمة مفيدة",
    },
    "guided_reply": {
        "en": "I can't follow that, so I won't comment on it. I'm a practice tool for simple sentences, not a person. If something serious is happening, please talk to someone you trust.",
        "es": "No puedo seguir eso, así que no voy a comentarlo. Soy una herramienta de práctica con frases simples, no una persona. Si te está pasando algo serio, habla con alguien de confianza.",
        "pt": "Não consigo acompanhar isso, então não vou comentar. Sou uma ferramenta de prática com frases simples, não uma pessoa. Se algo sério estiver acontecendo, fale com alguém de confiança.",
        "fr": "Je ne peux pas suivre cela, donc je ne vais pas le commenter. Je suis un outil d'entraînement avec des phrases simples, pas une personne. Si quelque chose de grave se passe, parle à quelqu'un de confiance.",
        "it": "Non riesco a seguire questo, quindi non lo commento. Sono uno strumento di pratica con frasi semplici, non una persona. Se sta succedendo qualcosa di serio, parla con qualcuno di cui ti fidi.",
        "de": "Das kann ich nicht verstehen, darum sage ich nichts dazu. Ich bin ein Übungswerkzeug für einfache Sätze, kein Mensch. Wenn etwas Ernstes passiert, sprich bitte mit jemandem, dem du vertraust.",
        "ja": "その内容は理解できないので、コメントはしません。わたしは簡単な文を練習するためのツールで、人間ではありません。深刻なことが起きているなら、信頼できる人に話してください。",
        "ar": "لا أستطيع متابعة ذلك، لذلك لن أعلّق عليه. أنا أداة للتدريب على جمل بسيطة ولست شخصًا. إن كان هناك أمر خطير، فتحدّث مع شخص تثق به.",
    },
    "guided_suggestion": {
        "en": "Try a short sentence about your day, your food or your family.",
        "es": "Prueba con una frase corta sobre tu día, tu comida o tu familia.",
        "pt": "Tente uma frase curta sobre o seu dia, a sua comida ou a sua família.",
        "fr": "Essaie une phrase courte sur ta journée, ta nourriture ou ta famille.",
        "it": "Prova una frase breve sulla tua giornata, sul cibo o sulla tua famiglia.",
        "de": "Versuch einen kurzen Satz über deinen Tag, dein Essen oder deine Familie.",
        "ja": "一日のこと、食べ物、家族について短い文を書いてみましょう。",
        "ar": "جرّب جملة قصيرة عن يومك أو طعامك أو عائلتك.",
    },
    "guided_activity": {
        "en": "Complete it in English: 'I like ____.'",
        "es": "Complétala en inglés: 'I like ____.'",
        "pt": "Complete em inglês: 'I like ____.'",
        "fr": "Complète en anglais : 'I like ____.'",
        "it": "Completa in inglese: 'I like ____.'",
        "de": "Ergänze auf Englisch: 'I like ____.'",
        "ja": "英語で完成させましょう：'I like ____.'",
        "ar": "أكملها بالإنجليزية: 'I like ____.'",
    },
    "focus_practice": {
        "en": "Guided practice", "es": "Práctica guiada", "pt": "Prática guiada", "fr": "Pratique guidée",
        "it": "Pratica guidata", "de": "Angeleitetes Üben", "ja": "ガイド付き練習", "ar": "تدريب موجَّه",
    },
    # --- missions ---------------------------------------------------------------------
    "mission_local_note": {
        "en": "In local mode, Lingua checks the main pattern only.",
        "es": "En modo local, Lingua solo revisa la estructura principal.",
        "pt": "No modo local, a Lingua verifica apenas a estrutura principal.",
        "fr": "En mode local, Lingua ne vérifie que la structure principale.",
        "it": "In modalità locale, Lingua controlla solo la struttura principale.",
        "de": "Im lokalen Modus prüft Lingua nur das Hauptmuster.",
        "ja": "ローカルモードでは、Lingua は主な形だけを確認します。",
        "ar": "في الوضع المحلي، تتحقق Lingua من البنية الأساسية فقط.",
    },
    "mission_continue": {
        "en": "Continue to the next step.", "es": "Continúa con el siguiente paso.", "pt": "Continue para o próximo passo.",
        "fr": "Passez à l'étape suivante.", "it": "Passa al passaggio successivo.", "de": "Weiter zum nächsten Schritt.",
        "ja": "次のステップに進みましょう。", "ar": "انتقل إلى الخطوة التالية.",
    },
    "mission_try_again": {
        "en": "Try again with a short English phrase.", "es": "Inténtalo otra vez con una frase corta en inglés.",
        "pt": "Tente de novo com uma frase curta em inglês.", "fr": "Réessayez avec une courte phrase en anglais.",
        "it": "Riprova con una breve frase in inglese.", "de": "Versuch es noch einmal mit einem kurzen englischen Satz.",
        "ja": "短い英語の文でもう一度やってみましょう。", "ar": "حاول مرة أخرى بعبارة إنجليزية قصيرة.",
    },
    "mission_answer": {
        "en": "Write one short answer in English.", "es": "Escribe una respuesta corta en inglés.",
        "pt": "Escreva uma resposta curta em inglês.", "fr": "Écrivez une réponse courte en anglais.",
        "it": "Scrivi una risposta breve in inglese.", "de": "Schreib eine kurze Antwort auf Englisch.",
        "ja": "英語で短く答えてください。", "ar": "اكتب إجابة قصيرة بالإنجليزية.",
    },
}


def resolve_language(value) -> tuple[str, bool]:
    """The catalogue language for a client language value, and whether it is real.

    Accepts the LanguageInfo the route builds (``.base``), a dict, or a code.
    Anything outside the eight implemented languages gets English, reported as
    not localized so the caller can say so instead of pretending.
    """
    base = None
    if hasattr(value, "base"):
        base = value.base or getattr(value, "code", None)
    elif isinstance(value, dict):
        base = value.get("base") or value.get("code")
    elif isinstance(value, str):
        base = value
    base = str(base or "en").strip().lower().replace("_", "-").split("-", 1)[0]
    return (base, True) if base in SUPPORTED else ("en", base == "en")


def say(key: str, lang: str, **values) -> str:
    """One catalogue message in ``lang`` (English if a translation is missing)."""
    table = MESSAGES[key]
    template = table.get(lang) or table["en"]
    return template.format_map(values)
