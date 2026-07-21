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
]

export const SEED_VOCAB_BY_ID = Object.fromEntries(SEED_VOCAB.map(item => [item.id, item]))
