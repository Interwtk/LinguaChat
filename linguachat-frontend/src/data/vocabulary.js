/*
 * Central seed vocabulary — the single source of truth for pedagogical items.
 *
 * The `term`/`example` are the TARGET language (always English in this version)
 * and must NOT be translated. The `meaning` is the NATIVE-language explanation,
 * keyed by language base code, resolved through getLocalizedMeaning() so a
 * Japanese learner sees Japanese and never Spanish.
 *
 * `kind`: 'word' | 'phrase' | 'pattern'  — lets the Memory Garden group items
 * without breaking word-sized cards.
 */
export const SEED_VOCAB = [
  { id: 'happy',     term: 'happy',     kind: 'word', emoji: ':)',  example: 'I am happy today.',
    meaning: { en: 'feeling joy or pleasure', es: 'feliz', pt: 'feliz', fr: 'heureux / heureuse', it: 'felice', de: 'glücklich', ja: 'うれしい / 幸せな', ar: 'سعيد' } },
  { id: 'because',   term: 'because',   kind: 'word', emoji: '+',   example: 'I am happy because I am learning.',
    meaning: { en: 'for the reason that', es: 'porque', pt: 'porque', fr: 'parce que', it: 'perché', de: 'weil', ja: '〜だから / なぜなら', ar: 'لأنّ' } },
  { id: 'question',  term: 'question',  kind: 'word', emoji: '?',   example: 'Can I ask you a question?',
    meaning: { en: 'something you ask', es: 'pregunta', pt: 'pergunta', fr: 'question', it: 'domanda', de: 'Frage', ja: '質問', ar: 'سؤال' } },
  { id: 'travel',    term: 'travel',    kind: 'word', emoji: '>',   example: 'I want to travel to London.',
    meaning: { en: 'to go on a trip', es: 'viajar', pt: 'viajar', fr: 'voyager', it: 'viaggiare', de: 'reisen', ja: '旅行する', ar: 'يسافر' } },
  { id: 'water',     term: 'water',     kind: 'word', emoji: '~',   example: 'Can I have water, please?',
    meaning: { en: 'the clear drink', es: 'agua', pt: 'água', fr: 'eau', it: 'acqua', de: 'Wasser', ja: '水', ar: 'ماء' } },
  { id: 'morning',   term: 'morning',   kind: 'word', emoji: 'am',  example: 'I study in the morning.',
    meaning: { en: 'the early part of the day', es: 'mañana (parte del día)', pt: 'manhã', fr: 'matin', it: 'mattina', de: 'Morgen', ja: '朝', ar: 'صباح' } },
  { id: 'yesterday', term: 'yesterday', kind: 'word', emoji: '<',   example: 'I went to work yesterday.',
    meaning: { en: 'the day before today', es: 'ayer', pt: 'ontem', fr: 'hier', it: 'ieri', de: 'gestern', ja: '昨日', ar: 'أمس' } },
  { id: 'work',      term: 'work',      kind: 'word', emoji: 'wk',  example: 'I go to work by bus.',
    meaning: { en: 'a job or to do a job', es: 'trabajo', pt: 'trabalho', fr: 'travail', it: 'lavoro', de: 'Arbeit', ja: '仕事', ar: 'عمل' } },
  { id: 'easy',      term: 'easy',      kind: 'word', emoji: 'ok',  example: 'This is easy.',
    meaning: { en: 'not difficult', es: 'fácil', pt: 'fácil', fr: 'facile', it: 'facile', de: 'einfach', ja: '簡単な', ar: 'سهل' } },
  { id: 'today',     term: 'today',     kind: 'word', emoji: 'now', example: 'Today I feel good.',
    meaning: { en: 'this day', es: 'hoy', pt: 'hoje', fr: "aujourd'hui", it: 'oggi', de: 'heute', ja: '今日', ar: 'اليوم' } },

  /* First-episode items (greeting) */
  { id: 'hi',        term: 'hi',        kind: 'word',   emoji: 'Hi', example: 'Hi, I’m Lingua.',
    meaning: { en: 'a casual greeting', es: 'hola', pt: 'oi / olá', fr: 'salut', it: 'ciao', de: 'hi / hallo', ja: 'やあ / こんにちは', ar: 'مرحبًا' } },
  { id: 'hello',     term: 'hello',     kind: 'word',   emoji: 'Ho', example: 'Hello! I’m Alex.',
    meaning: { en: 'a greeting', es: 'hola', pt: 'olá', fr: 'bonjour', it: 'ciao / salve', de: 'hallo', ja: 'こんにちは', ar: 'مرحبًا' } },
  { id: 'im',        term: 'I’m',  kind: 'pattern', emoji: 'I', example: 'Hi, I’m Lingua.',
    meaning: { en: 'short for "I am" — used before your name', es: 'soy / yo soy', pt: 'eu sou', fr: 'je suis', it: 'sono / io sono', de: 'ich bin', ja: '私は〜です', ar: 'أنا' } },
  { id: 'whats_your_name', term: 'What’s your name?', kind: 'phrase', emoji: '?', example: 'Hi! What’s your name?',
    meaning: { en: 'asking someone’s name', es: '¿Cómo te llamas?', pt: 'Qual é o seu nome?', fr: 'Comment tu t’appelles ?', it: 'Come ti chiami?', de: 'Wie heißt du?', ja: 'お名前は何ですか？', ar: 'ما اسمك؟' } },

  /* Arc items (episodes 2 & 3) */
  { id: 'name', term: 'name', kind: 'word', emoji: 'Na', example: 'What’s your name?',
    meaning: { en: 'what you are called', es: 'nombre', pt: 'nome', fr: 'nom / prénom', it: 'nome', de: 'Name', ja: '名前', ar: 'اسم' } },
  { id: 'my_name_is', term: 'My name is…', kind: 'phrase', emoji: 'My', example: 'My name is Alex.',
    meaning: { en: 'a way to say your name', es: 'Me llamo…', pt: 'Meu nome é…', fr: 'Je m’appelle…', it: 'Mi chiamo…', de: 'Ich heiße…', ja: '私の名前は〜です', ar: 'اسمي…' } },
  { id: 'nice_to_meet', term: 'Nice to meet you.', kind: 'phrase', emoji: ':)', example: 'Nice to meet you.',
    meaning: { en: 'a friendly way to close a greeting', es: 'Mucho gusto.', pt: 'Prazer em conhecer.', fr: 'Enchanté(e).', it: 'Piacere di conoscerti.', de: 'Freut mich.', ja: 'はじめまして。', ar: 'سعيد بلقائك.' } },
  { id: 'im_pattern', term: 'I’m + name', kind: 'pattern', emoji: 'I', example: 'I’m Alex.',
    meaning: { en: '“I’m” followed by your name', es: '“I’m” + tu nombre', pt: '“I’m” + o teu nome', fr: '« I’m » + ton nom', it: '“I’m” + il tuo nome', de: '„I’m“ + dein Name', ja: '“I’m” + 名前', ar: '“I’m” + اسمك' } },
  { id: 'whats_your_pattern', term: 'What’s your + noun', kind: 'pattern', emoji: 'W?', example: 'What’s your name?',
    meaning: { en: 'asking about “your …”', es: 'preguntar por “tu …”', pt: 'perguntar por “o teu …”', fr: 'demander « ton … »', it: 'chiedere “il tuo …”', de: 'nach „dein …“ fragen', ja: '「あなたの〜」を尋ねる', ar: 'السؤال عن “…ك”' } },

  /* ---- second Pre-A1 arc: how you are, where you are from ---- */
  { id: 'good', term: 'good', kind: 'word', emoji: ':)', example: 'I’m good.',
    meaning: { en: 'fine, well', es: 'bien', pt: 'bem', fr: 'bien', it: 'bene', de: 'gut', ja: '元気 / いい', ar: 'بخير' } },
  { id: 'fine', term: 'fine', kind: 'word', emoji: 'ok', example: 'I’m fine.',
    meaning: { en: 'okay, all right', es: 'bien', pt: 'bem', fr: 'ça va', it: 'bene', de: 'gut / in Ordnung', ja: '大丈夫 / 元気', ar: 'بخير' } },
  { id: 'tired', term: 'tired', kind: 'word', emoji: 'zz', example: 'I’m tired.',
    meaning: { en: 'needing rest', es: 'cansado / cansada', pt: 'cansado / cansada', fr: 'fatigué(e)', it: 'stanco / stanca', de: 'müde', ja: '疲れている', ar: 'متعب' } },
  { id: 'from', term: 'from', kind: 'word', emoji: '->', example: 'I’m from Colombia.',
    meaning: { en: 'shows origin or starting place', es: 'de (origen)', pt: 'de (origem)', fr: 'de (origine)', it: 'da (origine)', de: 'aus (Herkunft)', ja: '〜から / 〜出身', ar: 'من' } },
  { id: 'how_are_you', term: 'How are you?', kind: 'phrase', emoji: '?', example: 'Hi! How are you?',
    meaning: { en: 'asking how someone feels', es: '¿Cómo estás?', pt: 'Como estás?', fr: 'Comment vas-tu ?', it: 'Come stai?', de: 'Wie geht es dir?', ja: '元気ですか？', ar: 'كيف حالك؟' } },
  { id: 'im_good', term: 'I’m good.', kind: 'phrase', emoji: ':)', example: 'I’m good, thanks.',
    meaning: { en: 'a simple answer: you feel well', es: 'Estoy bien.', pt: 'Estou bem.', fr: 'Je vais bien.', it: 'Sto bene.', de: 'Mir geht es gut.', ja: '元気です。', ar: 'أنا بخير.' } },
  { id: 'and_you', term: 'And you?', kind: 'phrase', emoji: '<>', example: 'I’m good. And you?',
    meaning: { en: 'returning the same question', es: '¿Y tú?', pt: 'E tu?', fr: 'Et toi ?', it: 'E tu?', de: 'Und du?', ja: 'あなたは？', ar: 'وأنت؟' } },
  { id: 'where_from', term: 'Where are you from?', kind: 'phrase', emoji: '?', example: 'Where are you from?',
    meaning: { en: 'asking about someone’s place of origin', es: '¿De dónde eres?', pt: 'De onde és?', fr: 'D’où viens-tu ?', it: 'Di dove sei?', de: 'Woher kommst du?', ja: 'どこ出身ですか？', ar: 'من أين أنت؟' } },
  { id: 'im_from', term: 'I’m from…', kind: 'phrase', emoji: '->', example: 'I’m from Colombia.',
    meaning: { en: 'saying where you are from', es: 'Soy de…', pt: 'Sou de…', fr: 'Je viens de…', it: 'Sono di…', de: 'Ich komme aus…', ja: '〜出身です。', ar: 'أنا من…' } },
  { id: 'what_about_you', term: 'What about you?', kind: 'phrase', emoji: '<>', example: 'I’m from Peru. What about you?',
    meaning: { en: 'another way to return a question', es: '¿Y tú?', pt: 'E tu?', fr: 'Et toi ?', it: 'E tu?', de: 'Und du?', ja: 'あなたはどうですか？', ar: 'وماذا عنك؟' } },
  { id: 'im_feeling_pattern', term: 'I’m + feeling', kind: 'pattern', emoji: 'I', example: 'I’m tired.',
    meaning: { en: '“I’m” followed by how you feel', es: '“I’m” + cómo te sientes', pt: '“I’m” + como te sentes', fr: '« I’m » + ton état', it: '“I’m” + come stai', de: '„I’m“ + dein Befinden', ja: '“I’m” + 気分', ar: '“I’m” + شعورك' } },
  { id: 'im_from_pattern', term: 'I’m from + place', kind: 'pattern', emoji: '->', example: 'I’m from Lima.',
    meaning: { en: '“I’m from” followed by a place', es: '“I’m from” + un lugar', pt: '“I’m from” + um lugar', fr: '« I’m from » + un lieu', it: '“I’m from” + un luogo', de: '„I’m from“ + ein Ort', ja: '“I’m from” + 場所', ar: '“I’m from” + مكان' } },

  /* ---- third Pre-A1 arc: what you like, what you want, making a plan ---- */
  { id: 'like', term: 'like', kind: 'word', emoji: '<3', example: 'I like music.',
    meaning: { en: 'to enjoy something', es: 'gustar', pt: 'gostar', fr: 'aimer', it: 'piacere', de: 'mögen', ja: '好き', ar: 'يحب' } },
  { id: 'want', term: 'want', kind: 'word', emoji: '->', example: 'I want water.',
    meaning: { en: 'to wish for something', es: 'querer', pt: 'querer', fr: 'vouloir', it: 'volere', de: 'wollen', ja: '欲しい', ar: 'يريد' } },
  { id: 'need', term: 'need', kind: 'word', emoji: '!', example: 'I need help.',
    meaning: { en: 'to require something', es: 'necesitar', pt: 'precisar', fr: 'avoir besoin', it: 'aver bisogno', de: 'brauchen', ja: '必要', ar: 'يحتاج' } },
  { id: 'music', term: 'music', kind: 'word', emoji: '♪', example: 'I like music.',
    meaning: { en: 'sounds you listen to', es: 'música', pt: 'música', fr: 'musique', it: 'musica', de: 'Musik', ja: '音楽', ar: 'موسيقى' } },
  { id: 'games', term: 'games', kind: 'word', emoji: '@', example: 'I like games.',
    meaning: { en: 'things you play', es: 'juegos', pt: 'jogos', fr: 'jeux', it: 'giochi', de: 'Spiele', ja: 'ゲーム', ar: 'ألعاب' } },
  { id: 'help', term: 'help', kind: 'word', emoji: '?', example: 'I need help.',
    meaning: { en: 'support from someone', es: 'ayuda', pt: 'ajuda', fr: 'aide', it: 'aiuto', de: 'Hilfe', ja: '助け', ar: 'مساعدة' } },
  { id: 'please', term: 'please', kind: 'word', emoji: ':)', example: 'Yes, please.',
    meaning: { en: 'a polite word when asking', es: 'por favor', pt: 'por favor', fr: 's’il te plaît', it: 'per favore', de: 'bitte', ja: 'お願いします', ar: 'من فضلك' } },
  { id: 'i_like', term: 'I like…', kind: 'phrase', emoji: '<3', example: 'I like music.',
    meaning: { en: 'saying what you enjoy', es: 'Me gusta…', pt: 'Gosto de…', fr: 'J’aime…', it: 'Mi piace…', de: 'Ich mag…', ja: '〜が好きです。', ar: 'أحب…' } },
  { id: 'i_dont_like', term: 'I don’t like…', kind: 'phrase', emoji: 'x', example: 'I don’t like coffee.',
    meaning: { en: 'saying what you do not enjoy', es: 'No me gusta…', pt: 'Não gosto de…', fr: 'Je n’aime pas…', it: 'Non mi piace…', de: 'Ich mag… nicht', ja: '〜が好きではありません。', ar: 'لا أحب…' } },
  { id: 'what_do_you_like', term: 'What do you like?', kind: 'phrase', emoji: '?', example: 'What do you like?',
    meaning: { en: 'asking about someone’s taste', es: '¿Qué te gusta?', pt: 'De que gostas?', fr: 'Qu’est-ce que tu aimes ?', it: 'Cosa ti piace?', de: 'Was magst du?', ja: '何が好きですか？', ar: 'ماذا تحب؟' } },
  { id: 'do_you_like', term: 'Do you like…?', kind: 'phrase', emoji: '?', example: 'Do you like music?',
    meaning: { en: 'a yes/no question about taste', es: '¿Te gusta…?', pt: 'Gostas de…?', fr: 'Aimes-tu… ?', it: 'Ti piace…?', de: 'Magst du…?', ja: '〜は好きですか？', ar: 'هل تحب…؟' } },
  { id: 'i_want', term: 'I want…', kind: 'phrase', emoji: '->', example: 'I want water.',
    meaning: { en: 'saying what you wish for', es: 'Quiero…', pt: 'Quero…', fr: 'Je veux…', it: 'Voglio…', de: 'Ich möchte…', ja: '〜が欲しいです。', ar: 'أريد…' } },
  { id: 'i_need', term: 'I need…', kind: 'phrase', emoji: '!', example: 'I need help.',
    meaning: { en: 'saying what you require', es: 'Necesito…', pt: 'Preciso de…', fr: 'J’ai besoin de…', it: 'Ho bisogno di…', de: 'Ich brauche…', ja: '〜が必要です。', ar: 'أحتاج…' } },
  { id: 'do_you_want', term: 'Do you want…?', kind: 'phrase', emoji: '?', example: 'Do you want water?',
    meaning: { en: 'offering something', es: '¿Quieres…?', pt: 'Queres…?', fr: 'Veux-tu… ?', it: 'Vuoi…?', de: 'Möchtest du…?', ja: '〜はいかがですか？', ar: 'هل تريد…؟' } },
  { id: 'yes_please', term: 'Yes, please.', kind: 'phrase', emoji: ':)', example: 'Yes, please.',
    meaning: { en: 'accepting politely', es: 'Sí, por favor.', pt: 'Sim, por favor.', fr: 'Oui, s’il te plaît.', it: 'Sì, grazie.', de: 'Ja, bitte.', ja: 'はい、お願いします。', ar: 'نعم، من فضلك.' } },
  { id: 'no_thank_you', term: 'No, thank you.', kind: 'phrase', emoji: 'x', example: 'No, thank you.',
    meaning: { en: 'declining politely', es: 'No, gracias.', pt: 'Não, obrigado.', fr: 'Non, merci.', it: 'No, grazie.', de: 'Nein, danke.', ja: 'いいえ、結構です。', ar: 'لا، شكرًا.' } },
  { id: 'i_like_pattern', term: 'I like + noun', kind: 'pattern', emoji: '<3', example: 'I like games.',
    meaning: { en: '“I like” followed by a thing', es: '“I like” + una cosa', pt: '“I like” + uma coisa', fr: '« I like » + une chose', it: '“I like” + una cosa', de: '„I like“ + eine Sache', ja: '“I like” + もの', ar: '“I like” + شيء' } },
  // fourth arc — asking for something politely in a café
  { id: 'coffee', term: 'coffee', kind: 'word', emoji: 'c', example: 'Can I have coffee, please?',
    meaning: { en: 'a hot drink', es: 'café', pt: 'café', fr: 'café', it: 'caffè', de: 'Kaffee', ja: 'コーヒー', ar: 'قهوة' } },
  { id: 'tea', term: 'tea', kind: 'word', emoji: 't', example: 'Can I have tea, please?',
    meaning: { en: 'a hot drink made with leaves', es: 'té', pt: 'chá', fr: 'thé', it: 'tè', de: 'Tee', ja: 'お茶', ar: 'شاي' } },
  { id: 'juice', term: 'juice', kind: 'word', emoji: 'j', example: 'Can I have juice, please?',
    meaning: { en: 'a cold fruit drink', es: 'jugo', pt: 'suco', fr: 'jus', it: 'succo', de: 'Saft', ja: 'ジュース', ar: 'عصير' } },
  { id: 'thank_you', term: 'Thank you.', kind: 'phrase', emoji: ':)', example: 'Thank you.',
    meaning: { en: 'thanking someone', es: 'Gracias.', pt: 'Obrigado.', fr: 'Merci.', it: 'Grazie.', de: 'Danke.', ja: 'ありがとう。', ar: 'شكرًا.' } },
  { id: 'can_i_have', term: 'Can I have…?', kind: 'phrase', emoji: '?', example: 'Can I have water, please?',
    meaning: { en: 'a simple, polite way to ask for something', es: '¿Me das…?', pt: 'Pode me dar…?', fr: 'Puis-je avoir… ?', it: 'Posso avere…?', de: 'Kann ich… haben?', ja: '〜をもらえますか。', ar: 'هل يمكنني الحصول على…؟' } },
  { id: 'anything_else', term: 'Anything else?', kind: 'phrase', emoji: '?', example: 'Anything else?',
    meaning: { en: 'asking if you want more', es: '¿Algo más?', pt: 'Mais alguma coisa?', fr: 'Autre chose ?', it: 'Altro?', de: 'Sonst noch etwas?', ja: 'ほかにはありますか。', ar: 'أي شيء آخر؟' } },
  { id: 'thats_all', term: 'That’s all, thanks.', kind: 'phrase', emoji: 'x', example: 'That’s all, thanks.',
    meaning: { en: 'closing an order politely', es: 'Eso es todo, gracias.', pt: 'É só isso, obrigado.', fr: 'C’est tout, merci.', it: 'È tutto, grazie.', de: 'Das ist alles, danke.', ja: '以上です、ありがとう。', ar: 'هذا كل شيء، شكرًا.' } },
  { id: 'here_you_are', term: 'Here you are.', kind: 'phrase', emoji: '->', example: 'Here you are.',
    meaning: { en: 'said when handing something over', es: 'Aquí tienes.', pt: 'Aqui está.', fr: 'Voilà.', it: 'Ecco a te.', de: 'Bitte sehr.', ja: 'どうぞ。', ar: 'تفضل.' } },
  { id: 'can_i_have_pattern', term: 'Can I have + item + please?', kind: 'pattern', emoji: '?', example: 'Can I have tea, please?',
    meaning: { en: '“Can I have” + a thing + “please”', es: '“Can I have” + una cosa + “please”', pt: '“Can I have” + uma coisa + “please”', fr: '« Can I have » + une chose + « please »', it: '“Can I have” + una cosa + “please”', de: '„Can I have“ + eine Sache + „please“', ja: '“Can I have” + もの + “please”', ar: '“Can I have” + شيء + “please”' } },
  /*
   * The fifth arc. Functional PHRASES, not their parts: nobody is taught
   * "repeat" or "slowly" on their own, so listing them as separate words would
   * inflate the Garden with vocabulary that was never practised.
   */
  /*
   * The sixth arc. Two frames and three things — the frames are the point, and
   * the nouns are only there because a frame needs something to be about.
   *
   * The numbers are ONE item rather than ten. Ten cards would fill a third of
   * the Memory Garden with words that are never reviewed individually, and the
   * capability is "answer with a small quantity", not "recite a list". Evidence
   * still comes from what the learner produced; it simply accumulates on the
   * group, the same way a pattern does.
   */
  { id: 'whats_this', term: 'What’s this?', kind: 'phrase', emoji: '?', example: 'What’s this?',
    meaning: { en: 'asking what an unknown thing is', es: '¿Qué es esto?', pt: 'O que é isto?', fr: 'Qu’est-ce que c’est ?', it: 'Che cos’è questo?', de: 'Was ist das?', ja: 'これは何ですか。', ar: 'ما هذا؟' } },
  { id: 'its_a_pattern', term: 'It’s a + thing', kind: 'pattern', emoji: '=', example: 'It’s a book.',
    meaning: { en: '“It’s” + a thing', es: '“It’s” + una cosa', pt: '“It’s” + uma coisa', fr: '« It’s » + une chose', it: '“It’s” + una cosa', de: '‚It’s‘ + eine Sache', ja: '“It’s” + もの', ar: '“It’s” + شيء' } },
  { id: 'book', term: 'book', kind: 'word', emoji: '[]', example: 'It’s a book.',
    meaning: { en: 'a book', es: 'un libro', pt: 'um livro', fr: 'un livre', it: 'un libro', de: 'ein Buch', ja: '本', ar: 'كتاب' } },
  { id: 'phone', term: 'phone', kind: 'word', emoji: '()', example: 'It’s a phone.',
    meaning: { en: 'a phone', es: 'un teléfono', pt: 'um telemóvel', fr: 'un téléphone', it: 'un telefono', de: 'ein Telefon', ja: '電話', ar: 'هاتف' } },
  { id: 'bag', term: 'bag', kind: 'word', emoji: 'B', example: 'It’s a bag.',
    meaning: { en: 'a bag', es: 'una bolsa', pt: 'um saco', fr: 'un sac', it: 'una borsa', de: 'eine Tasche', ja: 'カバン', ar: 'حقيبة' } },
  { id: 'numbers_1_10', term: 'one … ten', kind: 'pattern', emoji: '12', example: 'Two, please.',
    meaning: { en: 'the numbers one to ten', es: 'los números del uno al diez', pt: 'os números de um a dez', fr: 'les nombres de un à dix', it: 'i numeri da uno a dieci', de: 'die Zahlen eins bis zehn', ja: '１から１０の数', ar: 'الأرقام من واحد إلى عشرة' } },
  { id: 'how_many', term: 'How many?', kind: 'phrase', emoji: '#', example: 'How many?',
    meaning: { en: 'asking for a quantity', es: '¿Cuántos?', pt: 'Quantos?', fr: 'Combien ?', it: 'Quanti?', de: 'Wie viele?', ja: 'いくつですか。', ar: 'كم واحد؟' } },
  { id: 'quantity_pattern', term: 'number + thing', kind: 'pattern', emoji: '12', example: 'two books',
    meaning: { en: 'a number and what you are counting', es: 'un número y lo que cuentas', pt: 'um número e o que contas', fr: 'un nombre et ce que tu comptes', it: 'un numero e ciò che conti', de: 'eine Zahl und das Gezählte', ja: '数 ＋ 数えるもの', ar: 'رقم + الشيء المعدود' } },
  { id: 'i_dont_understand', term: 'I don’t understand.', kind: 'phrase', emoji: '?', example: 'Sorry, I don’t understand.',
    meaning: { en: 'saying a conversation stopped making sense', es: 'No entiendo.', pt: 'Não entendo.', fr: 'Je ne comprends pas.', it: 'Non capisco.', de: 'Ich verstehe nicht.', ja: 'わかりません。', ar: 'لا أفهم.' } },
  { id: 'can_you_repeat', term: 'Can you repeat, please?', kind: 'phrase', emoji: '<>', example: 'Can you repeat, please?',
    meaning: { en: 'asking for something to be said again', es: '¿Puedes repetir, por favor?', pt: 'Podes repetir, por favor?', fr: 'Tu peux répéter, s’il te plaît ?', it: 'Puoi ripetere, per favore?', de: 'Kannst du das wiederholen, bitte?', ja: 'もう一度言ってくれますか。', ar: 'هل يمكنك التكرار، من فضلك؟' } },
  { id: 'speak_slowly', term: 'Please speak slowly.', kind: 'phrase', emoji: '~', example: 'Please speak slowly.',
    meaning: { en: 'asking someone to slow down', es: 'Habla despacio, por favor.', pt: 'Fala devagar, por favor.', fr: 'Parle lentement, s’il te plaît.', it: 'Parla lentamente, per favore.', de: 'Sprich bitte langsam.', ja: 'ゆっくり話してください。', ar: 'تكلم ببطء، من فضلك.' } },
  { id: 'bye', term: 'Bye.', kind: 'phrase', emoji: 'o/', example: 'Thanks, bye.',
    meaning: { en: 'ending a conversation', es: 'Adiós.', pt: 'Adeus.', fr: 'Au revoir.', it: 'Ciao.', de: 'Tschüss.', ja: 'さようなら。', ar: 'وداعًا.' } },
  { id: 'see_you', term: 'See you.', kind: 'phrase', emoji: 'o/', example: 'See you later.',
    meaning: { en: 'a friendly goodbye', es: 'Hasta luego.', pt: 'Até logo.', fr: 'À bientôt.', it: 'A presto.', de: 'Bis bald.', ja: 'またね。', ar: 'إلى اللقاء.' } },
  { id: 'repair_pattern', term: 'Can you + verb + please?', kind: 'pattern', emoji: '?', example: 'Can you repeat, please?',
    meaning: { en: '“Can you” + an action + “please”', es: '“Can you” + una acción + “please”', pt: '“Can you” + uma ação + “please”', fr: '« Can you » + une action + « please »', it: '“Can you” + un’azione + “please”', de: '‚Can you‘ + eine Handlung + ‚please‘', ja: '“Can you” + 動作 + “please”', ar: '“Can you” + فعل + “please”' } },
  { id: 'i_want_pattern', term: 'I want + noun', kind: 'pattern', emoji: '->', example: 'I want coffee.',
    meaning: { en: '“I want” followed by a thing', es: '“I want” + una cosa', pt: '“I want” + uma coisa', fr: '« I want » + une chose', it: '“I want” + una cosa', de: '„I want“ + eine Sache', ja: '“I want” + もの', ar: '“I want” + شيء' } },

  /* ---- first A1 arc: what you do, and asking back ----
   *
   * Six productive items and two receptive ones, which is the budget the
   * blueprint set for this arc. Deliberately absent: professions. "I'm a nurse"
   * is a vocabulary list pretending to be a capability, and the frame — I + verb
   * (+ place) — is what every later arc reuses.
   */
  /*
   * `work` is NOT here: the catalogue already had it ("a job or to do a job"),
   * unreferenced by any Pre-A1 episode, and this arc is the first thing that
   * teaches it. Adding a second row was a duplicate — the exact bug the freeze's
   * uniqueness guard exists for — so the arc grants the entry that was already
   * there and spends five of its six new productive slots below.
   */
  { id: 'study', term: 'study', kind: 'word', emoji: 'S', example: 'I study.',
    meaning: { en: 'to be a student', es: 'estudiar', pt: 'estudar', fr: 'étudier', it: 'studiare', de: 'studieren', ja: '勉強する', ar: 'يدرس' } },
  { id: 'at_home', term: 'at home', kind: 'phrase', emoji: 'H', example: 'I work at home.',
    meaning: { en: 'where you live', es: 'en casa', pt: 'em casa', fr: 'à la maison', it: 'a casa', de: 'zu Hause', ja: '家で', ar: 'في البيت' } },
  { id: 'what_do_you_do', term: 'What do you do?', kind: 'phrase', emoji: '?', example: 'What do you do?',
    meaning: { en: 'asking about work or study', es: '¿A qué te dedicas?', pt: 'O que fazes?', fr: 'Que fais-tu ?', it: 'Che lavoro fai?', de: 'Was machst du?', ja: 'お仕事は何ですか？', ar: 'ماذا تعمل؟' } },
  { id: 'i_do_pattern', term: 'I + work / study', kind: 'pattern', emoji: 'I', example: 'I study at home.',
    meaning: { en: '“I” followed by what you do', es: '“I” + lo que haces', pt: '“I” + o que fazes', fr: '« I » + ce que tu fais', it: '“I” + quello che fai', de: '„I“ + was du machst', ja: '“I” + すること', ar: '“I” + ما تفعله' } },
  { id: 'do_you_pattern', term: 'Do you + verb?', kind: 'pattern', emoji: '?', example: 'Do you work?',
    meaning: { en: '“Do you” + an action, to ask', es: '“Do you” + una acción, para preguntar', pt: '“Do you” + uma ação, para perguntar', fr: '« Do you » + une action, pour demander', it: '“Do you” + un’azione, per chiedere', de: '„Do you“ + eine Handlung, um zu fragen', ja: '“Do you” + 動作（質問）', ar: '“Do you” + فعل، للسؤال' } },
  /* receptive: other people say these; the learner only has to understand them */
  { id: 'at_the_office', term: 'at the office', kind: 'phrase', emoji: 'O', example: 'I work at the office.',
    meaning: { en: 'a place where people work', es: 'en la oficina', pt: 'no escritório', fr: 'au bureau', it: 'in ufficio', de: 'im Büro', ja: 'オフィスで', ar: 'في المكتب' } },
  { id: 'at_university', term: 'at university', kind: 'phrase', emoji: 'U', example: 'I study at university.',
    meaning: { en: 'a place where people study', es: 'en la universidad', pt: 'na universidade', fr: 'à l’université', it: 'all’università', de: 'an der Universität', ja: '大学で', ar: 'في الجامعة' } },

  /*
   * A1 arc 2 — "how your day goes". Eight productive entries, which is exactly the
   * arc's budget, and four of them are patterns: the arc's density is its own
   * declared risk ("three new pattern groups in one arc is the level's densest
   * moment"), so the words are kept to two actions and two frequency adverbs and
   * the routine is built from arc 1's `work` and `study` as well.
   */
  { id: 'get_up', term: 'get up', kind: 'phrase', emoji: 'U', example: 'I get up at seven.',
    meaning: { en: 'leave your bed in the morning', es: 'levantarse', pt: 'levantar-se', fr: 'se lever', it: 'alzarsi', de: 'aufstehen', ja: '起きる', ar: 'يستيقظ' } },
  { id: 'have_breakfast', term: 'have breakfast', kind: 'phrase', emoji: 'B', example: 'I have breakfast at eight.',
    meaning: { en: 'eat the first meal of the day', es: 'desayunar', pt: 'tomar o café da manhã', fr: 'prendre le petit-déjeuner', it: 'fare colazione', de: 'frühstücken', ja: '朝食をとる', ar: 'يتناول الفطور' } },
  { id: 'usually', term: 'usually', kind: 'word', emoji: '~', example: 'I usually work at home.',
    meaning: { en: 'almost every day', es: 'normalmente', pt: 'normalmente', fr: 'd’habitude', it: 'di solito', de: 'normalerweise', ja: 'ふつうは', ar: 'عادةً' } },
  { id: 'sometimes', term: 'sometimes', kind: 'word', emoji: '~', example: 'I sometimes study in the evening.',
    meaning: { en: 'on some days, not all', es: 'a veces', pt: 'às vezes', fr: 'parfois', it: 'a volte', de: 'manchmal', ja: 'ときどき', ar: 'أحيانًا' } },
  { id: 'frequency_pattern', term: 'usually / sometimes + verb', kind: 'pattern', emoji: '~', example: 'I usually get up at seven.',
    meaning: { en: 'how often, before the action', es: 'con qué frecuencia, antes de la acción', pt: 'com que frequência, antes da ação', fr: 'à quelle fréquence, avant l’action', it: 'con quale frequenza, prima dell’azione', de: 'wie oft, vor der Handlung', ja: '頻度を動作の前に', ar: 'كم مرة، قبل الفعل' } },
  { id: 'part_of_day_pattern', term: 'in the morning / afternoon / evening', kind: 'pattern', emoji: 'D', example: 'I work in the morning.',
    meaning: { en: 'which part of the day', es: 'en qué parte del día', pt: 'em que parte do dia', fr: 'quelle partie de la journée', it: 'in quale parte del giorno', de: 'welcher Teil des Tages', ja: '一日のどの時間帯か', ar: 'أي جزء من اليوم' } },
  { id: 'time_at_pattern', term: 'at + hour', kind: 'pattern', emoji: 'C', example: 'I get up at seven.',
    meaning: { en: '“at” before the hour', es: '“at” antes de la hora', pt: '“at” antes da hora', fr: '« at » avant l’heure', it: '“at” prima dell’ora', de: '„at“ vor der Uhrzeit', ja: '時刻の前に “at”', ar: '“at” قبل الساعة' } },
  { id: 'what_does_mean_pattern', term: 'What does ___ mean?', kind: 'pattern', emoji: '?', example: 'What does “early” mean?',
    meaning: { en: 'asking for the meaning of one word', es: 'preguntar el significado de una palabra', pt: 'perguntar o significado de uma palavra', fr: 'demander le sens d’un mot', it: 'chiedere il significato di una parola', de: 'nach der Bedeutung eines Wortes fragen', ja: '単語の意味をたずねる', ar: 'السؤال عن معنى كلمة' } },

  /*
   * Receptive, and the reason they exist is the lesson: episode 23's story carries
   * two words the learner has never met, so they have something real to ask about.
   * They are never asked to produce them.
   */
  { id: 'early', term: 'early', kind: 'word', emoji: 'E', example: 'I get up early.',
    meaning: { en: 'before the usual time', es: 'temprano', pt: 'cedo', fr: 'tôt', it: 'presto', de: 'früh', ja: '早く', ar: 'مبكرًا' } },
  { id: 'late', term: 'late', kind: 'word', emoji: 'L', example: 'I work late.',
    meaning: { en: 'after the usual time', es: 'tarde', pt: 'tarde', fr: 'tard', it: 'tardi', de: 'spät', ja: '遅く', ar: 'متأخرًا' } },

  /*
   * A1 arc 3 — "who this is". Six productive entries, exactly the arc's budget, and
   * three of them are patterns. The other three are THE ONLY RELATIONS THIS LEVEL
   * TEACHES, and the arc's own risk note is why there are so few: "Family
   * vocabulary and cultural assumptions. The budget is three neutral relations plus
   * a fallback that needs none, and no episode assumes a family structure."
   *
   * So: friend, colleague, classmate. No sister, no wife, no son — and the fallback
   * the note promises is real, because "This is Ana." is a complete introduction
   * that names no relationship at all.
   */
  { id: 'friend', term: 'friend', kind: 'word', emoji: 'F', example: 'This is my friend Ana.',
    meaning: { en: 'somebody you like and see often', es: 'amigo / amiga', pt: 'amigo / amiga', fr: 'ami / amie', it: 'amico / amica', de: 'Freund / Freundin', ja: '友だち', ar: 'صديق / صديقة' } },
  { id: 'colleague', term: 'colleague', kind: 'word', emoji: 'C', example: 'This is my colleague Ben.',
    meaning: { en: 'somebody you work with', es: 'compañero de trabajo', pt: 'colega de trabalho', fr: 'collègue', it: 'collega', de: 'Kollege / Kollegin', ja: '同僚', ar: 'زميل في العمل' } },
  { id: 'classmate', term: 'classmate', kind: 'word', emoji: 'S', example: 'This is my classmate Mia.',
    meaning: { en: 'somebody you study with', es: 'compañero de clase', pt: 'colega de turma', fr: 'camarade de classe', it: 'compagno di classe', de: 'Mitschüler / Mitschülerin', ja: 'クラスメイト', ar: 'زميل في الصف' } },
  { id: 'this_is_pattern', term: 'This is + person', kind: 'pattern', emoji: '>', example: 'This is Ana.',
    meaning: { en: 'presenting somebody to somebody else', es: 'presentar a alguien', pt: 'apresentar alguém', fr: 'présenter quelqu’un', it: 'presentare qualcuno', de: 'jemanden vorstellen', ja: '人を紹介する', ar: 'تقديم شخص لآخر' } },
  { id: 'he_she_is_pattern', term: 'He / She is + noun', kind: 'pattern', emoji: '3', example: 'She is a student.',
    meaning: { en: 'saying one thing about another person', es: 'decir algo de otra persona', pt: 'dizer algo sobre outra pessoa', fr: 'dire une chose sur quelqu’un', it: 'dire una cosa su un’altra persona', de: 'etwas über eine andere Person sagen', ja: '他の人について言う', ar: 'قول شيء عن شخص آخر' } },
  { id: 'possessive_pattern', term: 'my / your / his / her + noun', kind: 'pattern', emoji: 'P', example: 'This is my colleague.',
    meaning: { en: 'whose it is, before the noun', es: 'de quién es, antes del sustantivo', pt: 'de quem é, antes do substantivo', fr: 'à qui c’est, avant le nom', it: 'di chi è, prima del nome', de: 'wessen, vor dem Nomen', ja: '所有を名詞の前に', ar: 'لِمَن، قبل الاسم' } },

  /*
   * Receptive: the third-person -s the arc HEARS and never asks for. The blueprint
   * says it plainly — "third-person -s heard, never required" — so the learner meets
   * "she works" in somebody else's sentence and answers with "she is".
   */
  { id: 'works_third', term: 'works', kind: 'word', emoji: 'w', example: 'She works at the office.',
    meaning: { en: '“work” when talking about he or she', es: '“work” al hablar de él o ella', pt: '“work” ao falar de ele ou ela', fr: '« work » quand on parle de lui ou elle', it: '“work” quando si parla di lui o lei', de: '„work“, wenn man über er/sie spricht', ja: '「he/she」のときの work', ar: '«work» عند الحديث عن هو أو هي' } },
  { id: 'studies_third', term: 'studies', kind: 'word', emoji: 's', example: 'He studies at university.',
    meaning: { en: '“study” when talking about he or she', es: '“study” al hablar de él o ella', pt: '“study” ao falar de ele ou ela', fr: '« study » quand on parle de lui ou elle', it: '“study” quando si parla di lui o lei', de: '„study“, wenn man über er/sie spricht', ja: '「he/she」のときの study', ar: '«study» عند الحديث عن هو أو هي' } },

  /*
   * ─── A1 arc 4 — "Where things are" (`finding_your_way`, episodes 27–29) ───
   *
   * The blueprint's budget for the arc is eight productive items and eight
   * receptive ones, and this is exactly that: two patterns, two places, four
   * relation words on the productive side; the words the answers carry on the
   * receptive side, because the arc's whole design is that the ANSWER is harder
   * than the question. "Directions creep" is the named risk, so there is no
   * left/right/straight anywhere here — the arc stops at where-and-near.
   */
  { id: 'where_is_pattern', term: 'Where is / Where’s + thing?', kind: 'pattern', emoji: '?', example: 'Where is the toilet?',
    meaning: { en: 'asking where something is', es: 'preguntar dónde está algo', pt: 'perguntar onde está algo', fr: 'demander où est quelque chose', it: 'chiedere dov’è una cosa', de: 'fragen, wo etwas ist', ja: '物の場所をたずねる', ar: 'السؤال عن مكان شيء' } },
  { id: 'its_location_pattern', term: 'It’s + here / there / next to / near + X', kind: 'pattern', emoji: 'L', example: 'It’s next to the bag.',
    meaning: { en: 'saying where something is', es: 'decir dónde está algo', pt: 'dizer onde está algo', fr: 'dire où est quelque chose', it: 'dire dov’è una cosa', de: 'sagen, wo etwas ist', ja: '物の場所を言う', ar: 'قول مكان شيء' } },
  { id: 'here', term: 'here', kind: 'word', emoji: 'h', example: 'It’s here.',
    meaning: { en: 'in this place', es: 'aquí', pt: 'aqui', fr: 'ici', it: 'qui', de: 'hier', ja: 'ここ', ar: 'هنا' } },
  { id: 'there', term: 'there', kind: 'word', emoji: 't', example: 'It’s there.',
    meaning: { en: 'in that place, not this one', es: 'allí', pt: 'ali', fr: 'là', it: 'lì', de: 'dort', ja: 'あそこ', ar: 'هناك' } },
  { id: 'next_to', term: 'next to', kind: 'word', emoji: 'n', example: 'It’s next to the bag.',
    meaning: { en: 'at the side of something', es: 'al lado de', pt: 'ao lado de', fr: 'à côté de', it: 'accanto a', de: 'neben', ja: '〜のとなり', ar: 'بجانب' } },
  { id: 'near', term: 'near', kind: 'word', emoji: 'r', example: 'It’s near the station.',
    meaning: { en: 'close to something, not far', es: 'cerca de', pt: 'perto de', fr: 'près de', it: 'vicino a', de: 'in der Nähe von', ja: '〜の近く', ar: 'قريب من' } },
  { id: 'toilet', term: 'toilet', kind: 'word', emoji: 'W', example: 'Where is the toilet?',
    meaning: { en: 'the room you ask for first in any building', es: 'el baño', pt: 'o banheiro', fr: 'les toilettes', it: 'il bagno', de: 'die Toilette', ja: 'トイレ', ar: 'المرحاض / الحمام' } },
  { id: 'station', term: 'station', kind: 'word', emoji: 'S', example: 'How do I get to the station?',
    meaning: { en: 'where buses or trains stop', es: 'la estación', pt: 'a estação', fr: 'la gare', it: 'la stazione', de: 'der Bahnhof', ja: '駅', ar: 'المحطة' } },

  /*
   * Receptive: what the ANSWER carries. The learner is never asked to produce any
   * of these — the arc plants repair deliberately because the answers contain
   * words nobody taught, which is the situation the capability exists for.
   */
  { id: 'bus', term: 'bus', kind: 'word', emoji: 'B', example: 'Take the bus.',
    meaning: { en: 'a big road vehicle many people ride', es: 'el autobús', pt: 'o ônibus', fr: 'le bus', it: 'l’autobus', de: 'der Bus', ja: 'バス', ar: 'الحافلة / الباص' } },
  { id: 'train', term: 'train', kind: 'word', emoji: 'T', example: 'The train is faster.',
    meaning: { en: 'it runs on rails between stations', es: 'el tren', pt: 'o trem', fr: 'le train', it: 'il treno', de: 'der Zug', ja: '電車', ar: 'القطار' } },
  { id: 'upstairs', term: 'upstairs', kind: 'word', emoji: 'u', example: 'It’s upstairs.',
    meaning: { en: 'on a higher floor', es: 'arriba', pt: 'lá em cima', fr: 'à l’étage', it: 'al piano di sopra', de: 'oben', ja: '上の階', ar: 'في الطابق الأعلى' } },
  { id: 'downstairs', term: 'downstairs', kind: 'word', emoji: 'd', example: 'It’s downstairs.',
    meaning: { en: 'on a lower floor', es: 'abajo', pt: 'lá embaixo', fr: 'en bas', it: 'al piano di sotto', de: 'unten', ja: '下の階', ar: 'في الطابق الأسفل' } },
  { id: 'opposite', term: 'opposite', kind: 'word', emoji: 'o', example: 'It’s opposite the exit.',
    meaning: { en: 'on the other side, facing it', es: 'enfrente de', pt: 'em frente de', fr: 'en face de', it: 'di fronte a', de: 'gegenüber', ja: '〜の向かい', ar: 'مقابل' } },
  { id: 'behind', term: 'behind', kind: 'word', emoji: 'b', example: 'It’s behind you.',
    meaning: { en: 'at the back of something', es: 'detrás de', pt: 'atrás de', fr: 'derrière', it: 'dietro', de: 'hinter', ja: '〜のうしろ', ar: 'خلف' } },
  { id: 'exit', term: 'exit', kind: 'word', emoji: 'E', example: 'The exit is there.',
    meaning: { en: 'the way out', es: 'la salida', pt: 'a saída', fr: 'la sortie', it: 'l’uscita', de: 'der Ausgang', ja: '出口', ar: 'المخرج' } },
  { id: 'platform', term: 'platform', kind: 'word', emoji: 'p', example: 'Platform two.',
    meaning: { en: 'where you wait for the train', es: 'el andén', pt: 'a plataforma', fr: 'le quai', it: 'il binario', de: 'das Gleis', ja: 'ホーム', ar: 'الرصيف' } },

  /*
   * ─── A1 arc 5 — "What it costs" (`paying_and_choosing`, episodes 30–33) ───
   *
   * Nine productive entries and one receptive, close to the blueprint's budget
   * of ten and eight: three patterns carry almost the whole arc, and the number
   * extension is ONE item, exactly as `numbers_1_10` already is — the arc's own
   * risk note is explicit that the numbers "arrive as prices rather than as
   * counting", so there is no card for "eleven", "twelve", "thirteen"…
   */
  { id: 'numbers_11_100', term: 'eleven … one hundred', kind: 'pattern', emoji: '99', example: 'It’s fifteen.',
    meaning: { en: 'the numbers eleven to one hundred', es: 'los números del once al cien', pt: 'os números de onze a cem', fr: 'les nombres de onze à cent', it: 'i numeri da undici a cento', de: 'die Zahlen elf bis hundert', ja: '１１から１００の数', ar: 'الأرقام من أحد عشر إلى مئة' } },
  { id: 'how_much_pattern', term: 'How much is it? / How much are they?', kind: 'pattern', emoji: '$', example: 'How much is it?',
    meaning: { en: 'asking the price', es: '¿Cuánto cuesta?', pt: 'Quanto custa?', fr: 'Combien ça coûte ?', it: 'Quanto costa?', de: 'Wie viel kostet das?', ja: 'いくらですか。', ar: 'كم سعره؟' } },
  { id: 'price_pattern', term: 'It’s + number (+ neutral unit)', kind: 'pattern', emoji: '=', example: 'It’s twelve dollars.',
    meaning: { en: 'stating a price', es: 'decir un precio', pt: 'dizer um preço', fr: 'dire un prix', it: 'dire un prezzo', de: 'einen Preis nennen', ja: '値段を言う', ar: 'ذكر السعر' } },
  { id: 'this_one', term: 'this one', kind: 'phrase', emoji: '1', example: 'This one, please.',
    meaning: { en: 'pointing at the one close to you', es: 'este / esta', pt: 'este / esta', fr: 'celui-ci / celle-ci', it: 'questo / questa', de: 'dieses hier', ja: 'これ', ar: 'هذا / هذه' } },
  { id: 'that_one', term: 'that one', kind: 'phrase', emoji: '2', example: 'Not that one.',
    meaning: { en: 'pointing at the other one', es: 'ese / esa', pt: 'esse / essa', fr: 'celui-là / celle-là', it: 'quello / quella', de: 'jenes dort', ja: 'それ', ar: 'ذلك / تلك' } },
  { id: 'ticket', term: 'ticket', kind: 'word', emoji: 'T', example: 'Can I have a ticket, please?',
    meaning: { en: 'what you buy to travel or enter', es: 'el billete / boleto', pt: 'o bilhete', fr: 'le billet', it: 'il biglietto', de: 'die Fahrkarte', ja: 'チケット', ar: 'التذكرة' } },
  { id: 'dollars', term: 'dollars', kind: 'word', emoji: '$', example: 'It’s twelve dollars.',
    meaning: { en: 'a neutral way to say a price out loud', es: 'dólares', pt: 'dólares', fr: 'dollars', it: 'dollari', de: 'Dollar', ja: 'ドル', ar: 'دولارات' } },

  /*
   * Receptive: the one unplanned thing a shopkeeper offers. Understood, never
   * asked for — the learner is never required to buy or name it.
   */
  { id: 'banana', term: 'banana', kind: 'word', emoji: 'b', example: 'We also have a banana today.',
    meaning: { en: 'a soft yellow fruit', es: 'un plátano', pt: 'uma banana', fr: 'une banane', it: 'una banana', de: 'eine Banane', ja: 'バナナ', ar: 'موزة' } },

  /*
   * ─── A1 arc 6 — "What you can do" (`what_you_can_do`, episodes 34–35) ───
   *
   * Two patterns (can/can't, and asking someone else) carry the arc; four
   * ability verbs give it something to talk about, and "how do you say"
   * doubles as the repair strategy episode 35 also teaches.
   */
  { id: 'can_ability_pattern', term: 'I can / I can’t + verb', kind: 'pattern', emoji: '+', example: 'I can swim. I can’t cook.',
    meaning: { en: 'saying what you are able (or not able) to do', es: 'decir lo que puedes (o no puedes) hacer', pt: 'dizer o que você pode (ou não pode) fazer', fr: 'dire ce que l’on peut (ou ne peut pas) faire', it: 'dire cosa puoi (o non puoi) fare', de: 'sagen, was man kann (oder nicht kann)', ja: 'できること（できないこと）を言う', ar: 'قول ما تستطيع (أو لا تستطيع) فعله' } },
  { id: 'swim', term: 'swim', kind: 'word', emoji: '~', example: 'I can swim.',
    meaning: { en: 'move through water using your body', es: 'nadar', pt: 'nadar', fr: 'nager', it: 'nuotare', de: 'schwimmen', ja: '泳ぐ', ar: 'يسبح' } },
  { id: 'cook', term: 'cook', kind: 'word', emoji: 'C', example: 'I can’t cook.',
    meaning: { en: 'prepare food to eat', es: 'cocinar', pt: 'cozinhar', fr: 'cuisiner', it: 'cucinare', de: 'kochen', ja: '料理する', ar: 'يطبخ' } },
  { id: 'drive', term: 'drive', kind: 'word', emoji: 'D', example: 'I can drive.',
    meaning: { en: 'control a car', es: 'conducir', pt: 'dirigir', fr: 'conduire', it: 'guidare', de: 'Auto fahren', ja: '運転する', ar: 'يقود' } },
  { id: 'dance', term: 'dance', kind: 'word', emoji: '*', example: 'I can dance.',
    meaning: { en: 'move your body to music', es: 'bailar', pt: 'dançar', fr: 'danser', it: 'ballare', de: 'tanzen', ja: '踊る', ar: 'يرقص' } },
  { id: 'can_you_ability_pattern', term: 'Can you + verb?', kind: 'pattern', emoji: '?', example: 'Can you swim?',
    meaning: { en: 'asking someone if they are able to do something', es: 'preguntar a alguien si puede hacer algo', pt: 'perguntar a alguém se consegue fazer algo', fr: 'demander à quelqu’un s’il peut faire quelque chose', it: 'chiedere a qualcuno se sa fare qualcosa', de: 'jemanden fragen, ob er/sie etwas kann', ja: '相手ができるかどうかをたずねる', ar: 'سؤال شخص إن كان يستطيع فعل شيء' } },
  { id: 'how_do_you_say_pattern', term: 'How do you say … in English?', kind: 'pattern', emoji: 'H', example: 'How do you say “nadar” in English?',
    meaning: { en: 'asking for the English word for something you know in your own language', es: 'pedir la palabra en inglés para algo que sabes en tu idioma', pt: 'pedir a palavra em inglês para algo que você sabe no seu idioma', fr: 'demander le mot anglais pour quelque chose que l’on connaît dans sa langue', it: 'chiedere la parola inglese per qualcosa che conosci nella tua lingua', de: 'nach dem englischen Wort für etwas fragen, das man in der eigenen Sprache kennt', ja: '自分の言語で知っている言葉の英語を聞く', ar: 'السؤال عن الكلمة الإنجليزية لشيء تعرفه بلغتك' } },
  { id: 'sing', term: 'sing', kind: 'word', emoji: '♪', example: 'Can you sing?',
    meaning: { en: 'make music with your voice', es: 'cantar', pt: 'cantar', fr: 'chanter', it: 'cantare', de: 'singen', ja: '歌う', ar: 'يغني' } },

  /*
   * ─── A1 arc 7 — "Making arrangements" (`making_arrangements`, episodes 36–38) ───
   *
   * Three patterns (propose a day/time, agree a place, confirm) carry the
   * arc; the two named days and two named places are exactly what episodes
   * 36–37's model turns and free replies need, no wider calendar/place set.
   */
  { id: 'day_of_week_pattern', term: 'on + day of the week', kind: 'pattern', emoji: '7', example: 'Are you free on Monday?',
    meaning: { en: 'naming a day of the week', es: 'nombrar un día de la semana', pt: 'nomear um dia da semana', fr: 'nommer un jour de la semaine', it: 'nominare un giorno della settimana', de: 'einen Wochentag nennen', ja: '曜日を言う', ar: 'ذكر يوم من أيام الأسبوع' } },
  { id: 'arrange_pattern', term: 'Let’s meet on + day + at + time', kind: 'pattern', emoji: 'M', example: 'Let’s meet on Friday at seven.',
    meaning: { en: 'proposing when to meet someone', es: 'proponer cuándo verse con alguien', pt: 'propor quando se encontrar com alguém', fr: 'proposer un moment pour rencontrer quelqu’un', it: 'proporre quando incontrarsi con qualcuno', de: 'vorschlagen, wann man sich trifft', ja: '会う日時を提案する', ar: 'اقتراح موعد للقاء شخص' } },
  { id: 'monday', term: 'Monday', kind: 'word', emoji: '1', example: 'Are you free on Monday?',
    meaning: { en: 'the first day of the working week', es: 'lunes', pt: 'segunda-feira', fr: 'lundi', it: 'lunedì', de: 'Montag', ja: '月曜日', ar: 'الاثنين' } },
  { id: 'friday', term: 'Friday', kind: 'word', emoji: '5', example: 'Let’s meet on Friday at seven.',
    meaning: { en: 'the last day of the working week', es: 'viernes', pt: 'sexta-feira', fr: 'vendredi', it: 'venerdì', de: 'Freitag', ja: '金曜日', ar: 'الجمعة' } },
  { id: 'the_station', term: 'the station', kind: 'phrase', emoji: 'S', example: 'Let’s meet at the station.',
    meaning: { en: 'a place to arrange to meet, near where buses or trains stop', es: 'la estación, un lugar para quedar', pt: 'a estação, um lugar para combinar de se encontrar', fr: 'la gare, un lieu de rendez-vous', it: 'la stazione, un luogo per darsi appuntamento', de: 'der Bahnhof, ein Treffpunkt', ja: '駅、待ち合わせ場所', ar: 'المحطة، مكان للقاء' } },
  { id: 'the_cinema', term: 'the cinema', kind: 'phrase', emoji: 'M', example: 'Let’s meet at the cinema.',
    meaning: { en: 'a place to arrange to meet, where films are shown', es: 'el cine, un lugar para quedar', pt: 'o cinema, um lugar para combinar de se encontrar', fr: 'le cinéma, un lieu de rendez-vous', it: 'il cinema, un luogo per darsi appuntamento', de: 'das Kino, ein Treffpunkt', ja: '映画館、待ち合わせ場所', ar: 'السينما، مكان للقاء' } },

  /*
   * ─── A2 arc 1 — "What you did" (`what_happened`, episodes 39–42) ───
   */
  { id: 'simple_past_regular_pattern', term: 'verb + -ed (regular past)', kind: 'pattern', emoji: 'ed', example: 'I worked yesterday. I studied yesterday.',
    meaning: { en: 'regular verbs in the past — add “-ed”', es: 'verbos regulares en pasado: se añade “-ed”', pt: 'verbos regulares no passado: acrescenta-se “-ed”', fr: 'verbes réguliers au passé : on ajoute « -ed »', it: 'verbi regolari al passato: si aggiunge “-ed”', de: 'regelmäßige Verben in der Vergangenheit: „-ed“ anhängen', ja: '規則動詞の過去形：語尾に「-ed」', ar: 'الأفعال المنتظمة في الماضي: تُضاف “-ed”' } },
  { id: 'past_time_expression_pattern', term: 'yesterday / two days ago', kind: 'pattern', emoji: '2d', example: 'I cleaned the house two days ago, not yesterday.',
    meaning: { en: 'when something happened — yesterday, two days ago', es: 'cuándo ocurrió algo: ayer, hace dos días', pt: 'quando algo aconteceu: ontem, há dois dias', fr: 'quand quelque chose est arrivé : hier, il y a deux jours', it: 'quando è successo qualcosa: ieri, due giorni fa', de: 'wann etwas passiert ist: gestern, vor zwei Tagen', ja: 'いつ起きたか：昨日、二日前', ar: 'متى حدث الشيء: أمس، قبل يومين' } },
  { id: 'watch_tv', term: 'watch TV', kind: 'phrase', emoji: 'TV', example: 'I cooked dinner and watched TV yesterday.',
    meaning: { en: 'look at programmes on a screen', es: 'ver la tele', pt: 'ver televisão', fr: 'regarder la télé', it: 'guardare la TV', de: 'fernsehen', ja: 'テレビを見る', ar: 'يشاهد التلفاز' } },
  { id: 'cook_dinner', term: 'cook dinner', kind: 'phrase', emoji: 'Dn', example: 'I cooked dinner and watched TV yesterday.',
    meaning: { en: 'prepare the evening meal', es: 'cocinar la cena', pt: 'cozinhar o jantar', fr: 'préparer le dîner', it: 'cucinare la cena', de: 'Abendessen kochen', ja: '夕食を作る', ar: 'يطبخ العشاء' } },
  { id: 'clean_the_house', term: 'clean the house', kind: 'phrase', emoji: 'Cl', example: 'I cleaned the house yesterday.',
    meaning: { en: 'tidy and clean your home', es: 'limpiar la casa', pt: 'limpar a casa', fr: 'faire le ménage', it: 'pulire la casa', de: 'das Haus putzen', ja: '家を掃除する', ar: 'ينظف المنزل' } },
  { id: 'simple_past_irregular_pattern', term: 'went / had / saw … (irregular past)', kind: 'pattern', emoji: 'ir', example: 'I went to a party. I had a great time. I saw a good film.',
    meaning: { en: 'irregular verbs in the past — no “-ed”', es: 'verbos irregulares en pasado: sin “-ed”', pt: 'verbos irregulares no passado: sem “-ed”', fr: 'verbes irréguliers au passé : sans « -ed »', it: 'verbi irregolari al passato: senza “-ed”', de: 'unregelmäßige Verben in der Vergangenheit: ohne „-ed“', ja: '不規則動詞の過去形：「-ed」を付けない', ar: 'الأفعال الشاذة في الماضي: بلا “-ed”' } },
  { id: 'bought', term: 'bought', kind: 'word', emoji: 'By', example: 'I bought a new bike and it was great.',
    meaning: { en: 'past of “buy” — got something by paying for it', es: 'compré / compró (pasado de “buy”)', pt: 'comprei / comprou (passado de “buy”)', fr: 'acheté (passé de « buy »)', it: 'comprato (passato di “buy”)', de: 'kaufte (Vergangenheit von „buy“)', ja: 'buy（買う）の過去形', ar: 'اشترى (ماضي buy)' } },
  { id: 'did_you_question_pattern', term: 'Did you + verb?', kind: 'pattern', emoji: 'D?', example: 'Did you work yesterday? Did you go to the party?',
    meaning: { en: 'asking about the past with “did”', es: 'preguntar por el pasado con “did”', pt: 'perguntar sobre o passado com “did”', fr: 'poser une question au passé avec « did »', it: 'chiedere del passato con “did”', de: 'über die Vergangenheit fragen mit „did“', ja: '「did」を使って過去について尋ねる', ar: 'السؤال عن الماضي باستخدام “did”' } },
  { id: 'sequencing_connector_pattern', term: 'first / then / after that / later', kind: 'pattern', emoji: '12', example: 'I went to the shop. Then I saw a friend.',
    meaning: { en: 'joining two past actions in order', es: 'unir dos acciones pasadas en orden', pt: 'unir duas ações passadas em ordem', fr: 'relier deux actions passées dans l’ordre', it: 'collegare due azioni passate in ordine', de: 'zwei vergangene Handlungen der Reihe nach verbinden', ja: '二つの過去の出来事を順番につなげる', ar: 'ربط حدثين ماضيين بالترتيب' } },

  /*
   * ─── A2 arc 2 — "What's next" (`making_plans`, episodes 43–44) ───
   */
  { id: 'going_to_future_pattern', term: 'I’m going to + verb', kind: 'pattern', emoji: 'gg', example: 'I’m going to relax this weekend.',
    meaning: { en: 'saying a plan for the future with “going to”', es: 'expresar un plan futuro con “going to”', pt: 'expressar um plano futuro com “going to”', fr: 'exprimer un projet futur avec « going to »', it: 'esprimere un piano futuro con “going to”', de: 'einen Zukunftsplan mit „going to“ ausdrücken', ja: '「going to」を使って将来の予定を言う', ar: 'التعبير عن خطة مستقبلية بـ “going to”' } },
  { id: 'future_time_expression_pattern', term: 'tomorrow / next week / this weekend', kind: 'pattern', emoji: 'ft', example: 'I’m going to visit my parents next week.',
    meaning: { en: 'when a plan will happen — tomorrow, next week, this weekend', es: 'cuándo ocurrirá un plan: mañana, la próxima semana, este fin de semana', pt: 'quando um plano vai acontecer: amanhã, na próxima semana, neste fim de semana', fr: 'quand un projet aura lieu : demain, la semaine prochaine, ce week-end', it: 'quando accadrà un piano: domani, la prossima settimana, questo weekend', de: 'wann ein Plan stattfindet: morgen, nächste Woche, dieses Wochenende', ja: '予定がいつ起きるか：明日、来週、今週末', ar: 'متى ستحدث الخطة: غدًا، الأسبوع القادم، نهاية هذا الأسبوع' } },
  { id: 'relax', term: 'relax', kind: 'word', emoji: 'rx', example: 'I’m going to relax this weekend.',
    meaning: { en: 'rest and do nothing stressful', es: 'relajarse', pt: 'relaxar', fr: 'se détendre', it: 'rilassarsi', de: 'sich entspannen', ja: 'リラックスする', ar: 'يسترخي' } },
  { id: 'go_shopping', term: 'go shopping', kind: 'phrase', emoji: '$s', example: 'I’m going to go shopping tomorrow.',
    meaning: { en: 'go to buy things', es: 'ir de compras', pt: 'ir às compras', fr: 'faire du shopping', it: 'andare a fare shopping', de: 'einkaufen gehen', ja: '買い物に行く', ar: 'يذهب للتسوق' } },
  { id: 'visit', term: 'visit', kind: 'word', emoji: 'vi', example: 'I’m going to visit my family.',
    meaning: { en: 'go to see a person or place', es: 'visitar', pt: 'visitar', fr: 'rendre visite / visiter', it: 'visitare', de: 'besuchen', ja: '訪れる', ar: 'يزور' } },
  { id: 'going_to_question_pattern', term: 'Are you going to + verb?', kind: 'pattern', emoji: 'g?', example: 'Are you going to relax this weekend?',
    meaning: { en: 'asking about someone’s plan with “Are you going to…?”', es: 'preguntar por el plan de alguien con “Are you going to…?”', pt: 'perguntar sobre o plano de alguém com “Are you going to…?”', fr: 'demander le projet de quelqu’un avec « Are you going to…? »', it: 'chiedere il piano di qualcuno con “Are you going to…?”', de: 'nach jemandes Plan fragen mit „Are you going to…?“', ja: '「Are you going to…?」で相手の予定を尋ねる', ar: 'السؤال عن خطة شخص بـ “Are you going to…?”' } },

  /*
   * ─── A2 arc 3 — "People and places" (`people_and_places`, episodes 45–48) ───
   */
  { id: 'always', term: 'always', kind: 'word', emoji: 'al', example: 'It is never quiet in the morning, and it is always quiet at night.',
    meaning: { en: 'at every time, 100%', es: 'siempre', pt: 'sempre', fr: 'toujours', it: 'sempre', de: 'immer', ja: 'いつも', ar: 'دائمًا' } },
  { id: 'because_reason_pattern', term: 'I like it because + reason', kind: 'pattern', emoji: 'bc', example: 'I like it because it’s convenient.',
    meaning: { en: 'giving a reason with “because”', es: 'dar una razón con “because”', pt: 'dar uma razão com “because”', fr: 'donner une raison avec « because »', it: 'dare una ragione con “because”', de: 'einen Grund mit „because“ angeben', ja: '「because」で理由を言う', ar: 'إعطاء سبب بـ “because”' } },
  { id: 'big', term: 'big', kind: 'word', emoji: 'Bg', example: 'The other café is big and friendly.',
    meaning: { en: 'large in size', es: 'grande', pt: 'grande', fr: 'grand(e)', it: 'grande', de: 'groß', ja: '大きい', ar: 'كبير' } },
  { id: 'comparative_pattern', term: 'bigger / more expensive + than', kind: 'pattern', emoji: 'er', example: 'This café is bigger than that one.',
    meaning: { en: 'comparing two things — “-er than” / “more … than”', es: 'comparar dos cosas: “-er than” / “more … than”', pt: 'comparar duas coisas: “-er than” / “more … than”', fr: 'comparer deux choses : « -er than » / « more … than »', it: 'confrontare due cose: “-er than” / “more … than”', de: 'zwei Dinge vergleichen: „-er than“ / „more … than“', ja: '二つのものを比較する：「-er than」／「more … than」', ar: 'مقارنة شيئين: “-er than” / “more … than”' } },
  { id: 'convenient', term: 'convenient', kind: 'word', emoji: 'cv', example: 'I like it because it’s convenient.',
    meaning: { en: 'practical, easy to use or reach', es: 'conveniente / práctico', pt: 'conveniente / prático', fr: 'pratique', it: 'conveniente / comodo', de: 'praktisch / günstig gelegen', ja: '便利な', ar: 'مناسب / عملي' } },
  { id: 'expensive', term: 'expensive', kind: 'word', emoji: 'ex', example: 'This neighbourhood is more expensive than that one.',
    meaning: { en: 'costing a lot', es: 'caro', pt: 'caro', fr: 'cher', it: 'costoso', de: 'teuer', ja: '高い（値段）', ar: 'غالي' } },
  { id: 'cheap', term: 'cheap', kind: 'word', emoji: 'ch', example: 'This café is cheaper than that one.',
    meaning: { en: 'costing little', es: 'barato', pt: 'barato', fr: 'pas cher', it: 'economico', de: 'billig', ja: '安い', ar: 'رخيص' } },
  { id: 'friendly', term: 'friendly', kind: 'word', emoji: 'fr', example: 'The other café is big and friendly.',
    meaning: { en: 'warm and welcoming', es: 'amigable', pt: 'amigável', fr: 'amical(e)', it: 'amichevole', de: 'freundlich', ja: 'フレンドリーな', ar: 'ودود' } },
  { id: 'frequency_full_set_pattern', term: 'always / usually / sometimes / never', kind: 'pattern', emoji: 'f4', example: 'It is never quiet in the morning, and it is always quiet at night.',
    meaning: { en: 'the whole set — always, usually, sometimes, never', es: 'el conjunto completo: always, usually, sometimes, never', pt: 'o conjunto completo: always, usually, sometimes, never', fr: 'l’ensemble complet : always, usually, sometimes, never', it: 'l’insieme completo: always, usually, sometimes, never', de: 'die ganze Reihe: always, usually, sometimes, never', ja: 'always・usually・sometimes・never のセット', ar: 'المجموعة الكاملة: always، usually، sometimes، never' } },
  { id: 'multi_attribute_pattern', term: 'It’s + quality + and + quality', kind: 'pattern', emoji: 'ma', example: 'It’s small and quiet.',
    meaning: { en: 'two qualities in one sentence, joined with “and”', es: 'dos cualidades en una frase, unidas con “and”', pt: 'duas qualidades numa frase, unidas com “and”', fr: 'deux qualités dans une phrase, reliées par « and »', it: 'due qualità in una frase, unite con “and”', de: 'zwei Eigenschaften in einem Satz, verbunden mit „and“', ja: '「and」でつないだ二つの特徴', ar: 'صفتان في جملة واحدة، مرتبطتان بـ “and”' } },
  { id: 'never', term: 'never', kind: 'word', emoji: 'nv', example: 'It is never quiet in the morning, and it is always quiet at night.',
    meaning: { en: 'at no time, 0%', es: 'nunca', pt: 'nunca', fr: 'jamais', it: 'mai', de: 'nie', ja: '決して〜ない', ar: 'أبدًا' } },
  { id: 'quiet', term: 'quiet', kind: 'word', emoji: 'qt', example: 'It’s small and quiet.',
    meaning: { en: 'with little or no noise', es: 'tranquilo / silencioso', pt: 'tranquilo / silencioso', fr: 'calme', it: 'tranquillo', de: 'ruhig', ja: '静かな', ar: 'هادئ' } },
  { id: 'small', term: 'small', kind: 'word', emoji: 'sm', example: 'It’s small and quiet.',
    meaning: { en: 'little in size', es: 'pequeño', pt: 'pequeno', fr: 'petit(e)', it: 'piccolo', de: 'klein', ja: '小さい', ar: 'صغير' } },
  { id: 'there_is_are_pattern', term: 'There is / There are + thing', kind: 'pattern', emoji: 'th', example: 'There are two cafés near here.',
    meaning: { en: 'saying something exists — “there is/are”', es: 'decir que algo existe: “there is/are”', pt: 'dizer que algo existe: “there is/are”', fr: 'dire que quelque chose existe : « there is/are »', it: 'dire che qualcosa esiste: “there is/are”', de: 'sagen, dass etwas existiert: „there is/are“', ja: '「〜がある」と言う：「there is/are」', ar: 'قول إن شيئًا موجود: “there is/are”' } },
  { id: 'third_person_s_pattern', term: 'he / she + verb-s', kind: 'pattern', emoji: '3s', example: 'She works every day.',
    meaning: { en: 'adding “-s” to a verb for he/she/it', es: 'añadir “-s” al verbo para él/ella', pt: 'acrescentar “-s” ao verbo para ele/ela', fr: 'ajouter « -s » au verbe pour il/elle', it: 'aggiungere “-s” al verbo per lui/lei', de: '„-s“ an ein Verb für er/sie/es anhängen', ja: 'he/she/it のとき動詞に「-s」を付ける', ar: 'إضافة “-s” للفعل مع هو/هي' } },

  /*
   * ─── A2 arc 4 — "How to get there" (`getting_around`, episodes 49–50) ───
   */
  { id: 'multi_step_direction_pattern', term: 'Go straight, then turn left…', kind: 'pattern', emoji: 'gt', example: 'Go straight, then turn left, it’s on the right.',
    meaning: { en: 'a direction with more than one step', es: 'una indicación con más de un paso', pt: 'uma indicação com mais de um passo', fr: 'une indication en plusieurs étapes', it: 'un’indicazione con più di un passaggio', de: 'eine Wegbeschreibung mit mehreren Schritten', ja: '複数の手順を含む道案内', ar: 'اتجاه بأكثر من خطوة' } },
  { id: 'straight', term: 'straight', kind: 'word', emoji: 'sg', example: 'Go straight, then turn left, it’s on the right.',
    meaning: { en: 'in one direction, not turning', es: 'recto / derecho (sin girar)', pt: 'em frente / reto (sem virar)', fr: 'tout droit', it: 'dritto', de: 'geradeaus', ja: 'まっすぐ', ar: 'مستقيم' } },
  { id: 'turn', term: 'turn', kind: 'word', emoji: 'tn', example: 'Go straight, then turn left, it’s on the right.',
    meaning: { en: 'change direction', es: 'girar', pt: 'virar', fr: 'tourner', it: 'girare', de: 'abbiegen', ja: '曲がる', ar: 'ينعطف' } },
  { id: 'left', term: 'left', kind: 'word', emoji: 'lf', example: 'Go straight, then turn left, it’s on the right.',
    meaning: { en: 'the opposite side from right', es: 'izquierda', pt: 'esquerda', fr: 'gauche', it: 'sinistra', de: 'links', ja: '左', ar: 'يسار' } },
  { id: 'right', term: 'right', kind: 'word', emoji: 'rt', example: 'Go straight, then turn right, it’s on the corner.',
    meaning: { en: 'the opposite side from left', es: 'derecha', pt: 'direita', fr: 'droite', it: 'destra', de: 'rechts', ja: '右', ar: 'يمين' } },
  { id: 'corner', term: 'corner', kind: 'word', emoji: 'cn', example: 'Go straight, then turn right, it’s on the corner.',
    meaning: { en: 'where two streets meet', es: 'la esquina', pt: 'a esquina', fr: 'le coin de la rue', it: 'l’angolo', de: 'die Ecke', ja: '角', ar: 'الزاوية' } },
  { id: 'crossing', term: 'crossing', kind: 'word', emoji: 'xg', example: 'Turn left at the crossing.',
    meaning: { en: 'a place to cross the street', es: 'el paso de peatones', pt: 'a faixa de pedestres', fr: 'le passage piéton', it: 'l’attraversamento pedonale', de: 'der Zebrastreifen / Übergang', ja: '横断歩道', ar: 'معبر المشاة' } },

  /*
   * ─── A2 arc 5 — "Booking it" (`booking_a_stay`, episodes 51–54) ───
   */
  { id: 'month_pattern', term: 'January … December', kind: 'pattern', emoji: 'mo', example: 'It’s the tenth of June.',
    meaning: { en: 'the twelve months of the year', es: 'los doce meses del año', pt: 'os doze meses do ano', fr: 'les douze mois de l’année', it: 'i dodici mesi dell’anno', de: 'die zwölf Monate des Jahres', ja: '一年の十二か月', ar: 'أشهر السنة الاثنا عشر' } },
  { id: 'ordinal_date_pattern', term: 'first, second, tenth … (ordinal date)', kind: 'pattern', emoji: 'od', example: 'It’s the tenth of June.',
    meaning: { en: 'saying the day of the month — first, second, tenth…', es: 'decir el día del mes: primero, segundo, décimo…', pt: 'dizer o dia do mês: primeiro, segundo, décimo…', fr: 'dire le jour du mois : premier, deuxième, dixième…', it: 'dire il giorno del mese: primo, secondo, decimo…', de: 'das Datum sagen: erster, zweiter, zehnter…', ja: '日付の言い方：1日、2日、10日…', ar: 'قول يوم الشهر: الأول، الثاني، العاشر…' } },
  { id: 'availability_question_pattern', term: 'Do you have a + thing?', kind: 'pattern', emoji: 'av', example: 'Do you have a table for the tenth of June?',
    meaning: { en: 'asking if something is free — “Do you have…?”', es: 'preguntar si algo está disponible: “Do you have…?”', pt: 'perguntar se algo está disponível: “Do you have…?”', fr: 'demander si quelque chose est disponible : « Do you have…? »', it: 'chiedere se qualcosa è disponibile: “Do you have…?”', de: 'fragen, ob etwas frei ist: „Do you have…?“', ja: '空きがあるか尋ねる：「Do you have…?」', ar: 'السؤال إن كان الشيء متاحًا: “Do you have…?”' } },
  { id: 'table', term: 'table', kind: 'word', emoji: 'Tb', example: 'Do you have a table for the tenth of June?',
    meaning: { en: 'what you book at a restaurant', es: 'una mesa', pt: 'uma mesa', fr: 'une table', it: 'un tavolo', de: 'ein Tisch', ja: 'テーブル（席）', ar: 'طاولة' } },
  { id: 'booking_pattern', term: 'I’d like to book + thing, and there will be + number', kind: 'pattern', emoji: 'bk', example: 'I’d like to book a table for the tenth of June, and there will be four of us.',
    meaning: { en: 'making a reservation — the table/date/party size together', es: 'hacer una reserva: mesa, fecha y número de personas juntos', pt: 'fazer uma reserva: mesa, data e número de pessoas juntos', fr: 'faire une réservation : table, date et nombre de personnes ensemble', it: 'fare una prenotazione: tavolo, data e numero di persone insieme', de: 'eine Reservierung vornehmen: Tisch, Datum und Personenzahl zusammen', ja: '予約する：テーブル・日付・人数をまとめて伝える', ar: 'إجراء حجز: الطاولة والتاريخ وعدد الأشخاص معًا' } },
  { id: 'deposit', term: 'deposit', kind: 'word', emoji: 'dp', example: 'We’ll need a small deposit.',
    meaning: { en: 'money paid in advance to hold a booking', es: 'un depósito / una señal', pt: 'um sinal / depósito', fr: 'un acompte', it: 'una caparra', de: 'eine Anzahlung', ja: '予約金', ar: 'عربون' } },
  { id: 'spelling_pattern', term: 'It’s + name, and that’s + letters', kind: 'pattern', emoji: 'sp', example: 'It’s Sam, and that’s S-A-M.',
    meaning: { en: 'spelling a name letter by letter', es: 'deletrear un nombre letra por letra', pt: 'soletrar um nome letra por letra', fr: 'épeler un nom lettre par lettre', it: 'fare lo spelling di un nome lettera per lettera', de: 'einen Namen buchstabieren', ja: '名前を一文字ずつ伝える', ar: 'تهجئة اسم حرفًا حرفًا' } },
  { id: 'can_you_spell_that', term: 'Can you spell that?', kind: 'phrase', emoji: '?s', example: 'Can you spell that for me, please?',
    meaning: { en: 'asking someone to spell a word out', es: '¿Puedes deletrearlo?', pt: 'Podes soletrar isso?', fr: 'Peux-tu l’épeler ?', it: 'Puoi fare lo spelling?', de: 'Kannst du das buchstabieren?', ja: 'それを綴ってもらえますか。', ar: 'هل يمكنك تهجئة ذلك؟' } },

  /*
   * ─── A2 arc 6 — "When something's wrong" (`everyday_problems`, episodes 55–57) ───
   */
  { id: 'problem_with', term: 'problem with', kind: 'phrase', emoji: 'pw', example: 'There’s a problem with the room.',
    meaning: { en: 'something wrong with a thing', es: 'un problema con', pt: 'um problema com', fr: 'un problème avec', it: 'un problema con', de: 'ein Problem mit', ja: '〜に問題がある', ar: 'مشكلة في' } },
  { id: 'doesnt_work', term: 'doesn’t work', kind: 'phrase', emoji: 'dw', example: 'My key card doesn’t work.',
    meaning: { en: 'something is broken, not working', es: 'no funciona', pt: 'não funciona', fr: 'ne fonctionne pas', it: 'non funziona', de: 'funktioniert nicht', ja: '動かない・故障している', ar: 'لا يعمل' } },
  { id: 'lost', term: 'lost', kind: 'word', emoji: 'ls', example: 'I lost my room key.',
    meaning: { en: 'you cannot find something of yours', es: 'perdido', pt: 'perdido', fr: 'perdu(e)', it: 'perso', de: 'verloren', ja: 'なくした', ar: 'مفقود' } },
  { id: 'cold', term: 'cold', kind: 'word', emoji: 'cd', example: 'There’s a problem with the room. It’s cold.',
    meaning: { en: 'low in temperature', es: 'frío', pt: 'frio', fr: 'froid', it: 'freddo', de: 'kalt', ja: '寒い／冷たい', ar: 'بارد' } },
  { id: 'problem_report_pattern', term: 'There’s a problem with… / My ___ doesn’t work / I lost my ___', kind: 'pattern', emoji: 'pr', example: 'There’s a problem with the room. It’s cold.',
    meaning: { en: 'reporting something is wrong', es: 'informar de que algo va mal', pt: 'relatar que algo está errado', fr: 'signaler que quelque chose ne va pas', it: 'segnalare che qualcosa non va', de: 'melden, dass etwas nicht stimmt', ja: '問題を報告する', ar: 'الإبلاغ عن وجود مشكلة' } },
  { id: 'help_with', term: 'help with', kind: 'phrase', emoji: 'hw', example: 'Can you help me with this?',
    meaning: { en: 'asking someone to assist with something', es: 'ayudar con', pt: 'ajudar com', fr: 'aider avec', it: 'aiutare con', de: 'helfen bei', ja: '〜を手伝う', ar: 'المساعدة في' } },
  { id: 'what_should_i_do', term: 'What should I do?', kind: 'phrase', emoji: 'wd', example: 'What should I do?',
    meaning: { en: 'asking for advice on what to do next', es: '¿Qué debo hacer?', pt: 'O que devo fazer?', fr: 'Que dois-je faire ?', it: 'Cosa devo fare?', de: 'Was soll ich tun?', ja: 'どうすればいいですか。', ar: 'ماذا يجب أن أفعل؟' } },
  { id: 'fix', term: 'fix', kind: 'word', emoji: 'fx', example: 'Can you fix it, please?',
    meaning: { en: 'repair something so it works again', es: 'arreglar', pt: 'consertar', fr: 'réparer', it: 'riparare', de: 'reparieren', ja: '直す', ar: 'يصلح' } },
  { id: 'help_request_pattern', term: 'Can you help me with ___? What should I do?', kind: 'pattern', emoji: 'hr', example: 'Can you help me with this? What should I do?',
    meaning: { en: 'asking for help and what to do', es: 'pedir ayuda y qué hacer', pt: 'pedir ajuda e o que fazer', fr: 'demander de l’aide et quoi faire', it: 'chiedere aiuto e cosa fare', de: 'um Hilfe bitten und fragen, was zu tun ist', ja: '助けと対処法を尋ねる', ar: 'طلب المساعدة ومعرفة ما يجب فعله' } },
  { id: 'instead', term: 'instead', kind: 'word', emoji: 'in', example: 'Would you like to move to a different room instead?',
    meaning: { en: 'in place of something else', es: 'en su lugar', pt: 'em vez disso', fr: 'à la place', it: 'invece', de: 'stattdessen', ja: 'その代わりに', ar: 'بدلاً من ذلك' } },

  /*
   * ─── A2 arc 7 — "Do you want to...?" (`lets_do_something`, episodes 58–61) ───
   */
  { id: 'invitation_pattern', term: 'Would you like to…? / Do you want to…?', kind: 'pattern', emoji: 'iv', example: 'Would you like to go to the cinema? Do you want to have dinner on Saturday?',
    meaning: { en: 'inviting someone to do something', es: 'invitar a alguien a hacer algo', pt: 'convidar alguém para fazer algo', fr: 'inviter quelqu’un à faire quelque chose', it: 'invitare qualcuno a fare qualcosa', de: 'jemanden zu etwas einladen', ja: '誰かを何かに誘う', ar: 'دعوة شخص لفعل شيء' } },
  { id: 'go_to_the_cinema', term: 'go to the cinema', kind: 'phrase', emoji: 'ci', example: 'Would you like to go to the cinema?',
    meaning: { en: 'go and watch a film at the cinema', es: 'ir al cine', pt: 'ir ao cinema', fr: 'aller au cinéma', it: 'andare al cinema', de: 'ins Kino gehen', ja: '映画館に行く', ar: 'يذهب إلى السينما' } },
  { id: 'have_dinner', term: 'have dinner', kind: 'phrase', emoji: 'hd', example: 'Do you want to have dinner on Saturday?',
    meaning: { en: 'eat the evening meal, often with someone', es: 'cenar', pt: 'jantar', fr: 'dîner', it: 'cenare', de: 'zu Abend essen', ja: '夕食を食べる', ar: 'يتناول العشاء' } },
  { id: 'accept_decline_reason_pattern', term: 'Yes, I’d like that! / I’d love to, but…', kind: 'pattern', emoji: 'ad', example: 'Yes, I’d like that! I’d love to, but I’m busy on Saturday.',
    meaning: { en: 'accepting or declining an invitation, with a reason', es: 'aceptar o rechazar una invitación, con una razón', pt: 'aceitar ou recusar um convite, com uma razão', fr: 'accepter ou refuser une invitation, avec une raison', it: 'accettare o rifiutare un invito, con una ragione', de: 'eine Einladung annehmen oder ablehnen, mit einem Grund', ja: '理由を添えて誘いを受ける・断る', ar: 'قبول أو رفض دعوة مع ذكر السبب' } },
  { id: 'id_love_to', term: 'I’d love to', kind: 'phrase', emoji: 'lv', example: 'I’d love to, but I’m busy on Saturday.',
    meaning: { en: 'a warm way to say yes, or start a polite “no”', es: 'Me encantaría.', pt: 'Adoraria.', fr: 'J’adorerais.', it: 'Mi piacerebbe molto.', de: 'Sehr gern.', ja: 'ぜひそうしたいです。', ar: 'أحب ذلك كثيرًا.' } },
  { id: 'im_busy', term: 'I’m busy', kind: 'phrase', emoji: 'bz', example: 'I’d love to, but I’m busy on Saturday.',
    meaning: { en: 'you have no free time', es: 'estoy ocupado / ocupada', pt: 'estou ocupado / ocupada', fr: 'je suis occupé(e)', it: 'sono occupato / occupata', de: 'ich bin beschäftigt', ja: '忙しいです。', ar: 'أنا مشغول.' } },
  { id: 'clause_connector_pattern', term: 'and / but / so', kind: 'pattern', emoji: 'cc', example: 'Yes, let’s go to the cinema, and last time we went, the film was really good.',
    meaning: { en: 'joining two ideas — and / but / so', es: 'unir dos ideas: and / but / so', pt: 'unir duas ideias: and / but / so', fr: 'relier deux idées : and / but / so', it: 'collegare due idee: and / but / so', de: 'zwei Gedanken verbinden: and / but / so', ja: 'and・but・so で二つの内容をつなぐ', ar: 'ربط فكرتين: and / but / so' } },
  { id: 'last_time', term: 'last time', kind: 'phrase', emoji: 'lt', example: 'Yes, let’s go to the cinema, and last time we went, the film was really good.',
    meaning: { en: 'on the previous occasion', es: 'la última vez', pt: 'da última vez', fr: 'la dernière fois', it: 'l’ultima volta', de: 'letztes Mal', ja: 'この前', ar: 'آخر مرة' } },
  { id: 'really_good', term: 'really good', kind: 'phrase', emoji: 'rg', example: 'Yes, let’s go to the cinema, and last time we went, the film was really good.',
    meaning: { en: 'very good indeed', es: 'muy bueno', pt: 'muito bom', fr: 'vraiment bien', it: 'davvero buono', de: 'wirklich gut', ja: '本当に良い', ar: 'جيد جدًا' } },
  { id: 'go_for_a_walk', term: 'go for a walk', kind: 'phrase', emoji: 'wa', example: 'Do you want to go for a walk instead?',
    meaning: { en: 'walk outside for pleasure', es: 'dar un paseo', pt: 'dar um passeio', fr: 'faire une promenade', it: 'fare una passeggiata', de: 'spazieren gehen', ja: '散歩する', ar: 'يتمشى' } },

  /*
   * Receptive: what the OTHER speaker's line carries in arcs 3, 4 and 6 —
   * comprehension/choice steps, never asked for. Grounded verbatim in the
   * `target`/`promptEn` text of the steps that use each `itemId`.
   */
  { id: 'modern', term: 'modern', kind: 'word', emoji: 'md', example: 'It’s a small, modern café, and it’s usually quiet.',
    meaning: { en: 'new in style, not old-fashioned', es: 'moderno', pt: 'moderno', fr: 'moderne', it: 'moderno', de: 'modern', ja: '現代的な', ar: 'حديث' } },
  { id: 'better', term: 'better', kind: 'word', emoji: 'bt', example: 'This place is better than that one, but parking here is worse.',
    meaning: { en: 'more good — the comparative of “good”', es: 'mejor', pt: 'melhor', fr: 'meilleur', it: 'migliore', de: 'besser', ja: 'より良い', ar: 'أفضل' } },
  { id: 'comfortable', term: 'comfortable', kind: 'word', emoji: 'cf', example: 'I like this café because the chairs are comfortable.',
    meaning: { en: 'pleasant to sit or be in', es: 'cómodo', pt: 'confortável', fr: 'confortable', it: 'comodo', de: 'bequem', ja: '快適な', ar: 'مريح' } },
  { id: 'bank', term: 'bank', kind: 'word', emoji: 'Bk', example: 'Go straight, then turn right, then it’s next to the bank.',
    meaning: { en: 'where people keep and manage money', es: 'el banco', pt: 'o banco', fr: 'la banque', it: 'la banca', de: 'die Bank', ja: '銀行', ar: 'البنك' } },
  { id: 'which_way', term: 'which way', kind: 'phrase', emoji: 'ww', example: 'Sorry — straight, and then which way?',
    meaning: { en: 'asking in which direction', es: '¿por dónde?', pt: 'por onde?', fr: 'dans quel sens ?', it: 'da che parte?', de: 'welche Richtung?', ja: 'どちらの方向', ar: 'أي اتجاه' } },
  { id: 'church', term: 'church', kind: 'word', emoji: 'Ch', example: 'Go straight, then turn left, it’s next to the church.',
    meaning: { en: 'a building for Christian worship', es: 'la iglesia', pt: 'a igreja', fr: 'l’église', it: 'la chiesa', de: 'die Kirche', ja: '教会', ar: 'الكنيسة' } },
  { id: 'sorry_about_that', term: 'I’m sorry about that', kind: 'phrase', emoji: 'sa', example: 'I’m sorry about that. What’s the problem exactly?',
    meaning: { en: 'a polite apology for a problem', es: 'lo siento por eso', pt: 'sinto muito por isso', fr: 'désolé pour ça', it: 'mi dispiace per questo', de: 'das tut mir leid', ja: 'それは申し訳ございません', ar: 'آسف على ذلك' } },
  { id: 'of_course', term: 'Of course', kind: 'phrase', emoji: 'oc', example: 'Of course. Let me see what I can do.',
    meaning: { en: 'a warm way to say yes, certainly', es: 'por supuesto', pt: 'claro', fr: 'bien sûr', it: 'certo', de: 'natürlich', ja: 'もちろんです', ar: 'بالطبع' } },
  { id: 'extra_blankets', term: 'extra blankets', kind: 'phrase', emoji: 'bl', example: 'I can bring you extra blankets right away.',
    meaning: { en: 'more blankets, in addition to what you have', es: 'mantas extra', pt: 'cobertores extras', fr: 'des couvertures supplémentaires', it: 'coperte extra', de: 'zusätzliche Decken', ja: '追加の毛布', ar: 'بطانيات إضافية' } },
]

export const SEED_VOCAB_BY_ID = Object.fromEntries(SEED_VOCAB.map(item => [item.id, item]))
