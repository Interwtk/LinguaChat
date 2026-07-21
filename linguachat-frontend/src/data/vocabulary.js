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
  { id: 'like',      term: 'like',      kind: 'word', emoji: '<3',  example: 'I like music.',
    meaning: { en: 'to enjoy something', es: 'gustar', pt: 'gostar', fr: 'aimer', it: 'piacere', de: 'mögen', ja: '好き / 好む', ar: 'يحبّ' } },
  { id: 'need',      term: 'need',      kind: 'word', emoji: '!',   example: 'I need help, please.',
    meaning: { en: 'to require something', es: 'necesitar', pt: 'precisar', fr: 'avoir besoin', it: 'avere bisogno', de: 'brauchen', ja: '必要とする', ar: 'يحتاج' } },
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
]

export const SEED_VOCAB_BY_ID = Object.fromEntries(SEED_VOCAB.map(item => [item.id, item]))
