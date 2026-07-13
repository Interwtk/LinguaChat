// `phrase` is target English (keep as-is). `meaning` is the native-language
// explanation, resolved by getLocalizedMeaning().
export const PHRASES_OF_DAY = [
  { phrase: 'I am happy today.', meaning: { en: 'I feel good today.', es: 'Estoy feliz hoy.', pt: 'Estou feliz hoje.', fr: "Je suis heureux aujourd'hui.", it: 'Oggi sono felice.', de: 'Ich bin heute glücklich.', ja: '今日はうれしいです。', ar: 'أنا سعيد اليوم.' } },
  { phrase: 'I need help, please.', meaning: { en: 'I am asking for help.', es: 'Necesito ayuda, por favor.', pt: 'Preciso de ajuda, por favor.', fr: "J'ai besoin d'aide, s'il te plaît.", it: 'Ho bisogno di aiuto, per favore.', de: 'Ich brauche Hilfe, bitte.', ja: '助けてください。', ar: 'أحتاج مساعدة، من فضلك.' } },
  { phrase: 'Where is the station?', meaning: { en: 'Asking for the station.', es: '¿Dónde está la estación?', pt: 'Onde fica a estação?', fr: 'Où est la gare ?', it: "Dov'è la stazione?", de: 'Wo ist der Bahnhof?', ja: '駅はどこですか？', ar: 'أين المحطة؟' } },
  { phrase: 'I want to travel.', meaning: { en: 'I would like to travel.', es: 'Quiero viajar.', pt: 'Quero viajar.', fr: 'Je veux voyager.', it: 'Voglio viaggiare.', de: 'Ich möchte reisen.', ja: '旅行したいです。', ar: 'أريد أن أسافر.' } },
  { phrase: 'Can I have water?', meaning: { en: 'Asking for water.', es: '¿Puedo pedir agua?', pt: 'Posso pedir água?', fr: "Puis-je avoir de l'eau ?", it: "Posso avere dell'acqua?", de: 'Kann ich Wasser haben?', ja: 'お水をもらえますか？', ar: 'هل يمكنني الحصول على ماء؟' } },
  { phrase: 'I went to work yesterday.', meaning: { en: 'Talking about the past.', es: 'Fui al trabajo ayer.', pt: 'Fui trabalhar ontem.', fr: 'Je suis allé au travail hier.', it: 'Ieri sono andato al lavoro.', de: 'Ich bin gestern zur Arbeit gegangen.', ja: '昨日は仕事に行きました。', ar: 'ذهبت إلى العمل أمس.' } },
  { phrase: 'I like it because it is easy.', meaning: { en: 'Giving a reason with because.', es: 'Me gusta porque es fácil.', pt: 'Eu gosto porque é fácil.', fr: "J'aime ça parce que c'est facile.", it: 'Mi piace perché è facile.', de: 'Ich mag es, weil es einfach ist.', ja: '簡単だから好きです。', ar: 'يعجبني لأنّه سهل.' } },
]

export const JOURNEY_NODES = [
  { id: 'start',      label: 'Start',      emoji: '>', levels: null,      xp: 0    },
  { id: 'basics',     label: 'Basics',     emoji: 'Aa', levels: 'A1 - A2', xp: 200  },
  { id: 'travel',     label: 'Travel',     emoji: 'To', levels: 'B1',      xp: 500  },
  { id: 'confidence', label: 'Confidence', emoji: 'Hi', levels: 'B2',      xp: 900  },
  { id: 'fluency',    label: 'Fluency',    emoji: 'Ok', levels: 'C1 - C2', xp: 1500 },
]

export const LEVEL_TO_NODE = {
  A1: 'start',
  A2: 'basics',
  B1: 'travel',
  B2: 'confidence',
  C1: 'fluency',
  C2: 'fluency',
}

export const MOCK_STATS = {
  streak:         7,
  xp:             640,
  xpToNext:       860,
  xpNextLevel:    900,
  minutesToday:   14,
  sessionsTotal:  23,
  wordsLearned:   47,
  confidence:     72,
  weeklyActivity: [22, 15, 30, 8, 25, 18, 0],
}

// `original`/`fixed` are English (target). `topic` (the skill name) is shown via
// topicKey through i18n so it follows the interface language.
export const LAST_MISTAKES = [
  { original: 'how you are',    fixed: 'How are you?',      count: 3, topic: 'Question order', topicKey: 'skillQuestionOrder' },
  { original: 'me happy today', fixed: "I'm happy today.",  count: 2, topic: 'I am + emotion',  topicKey: 'skillIAmEmotion' },
  { original: 'she have',       fixed: 'she has',           count: 1, topic: 'He/she/it + s',   topicKey: 'skillThirdPersonS' },
]

export const WORDS_LEARNED = [
  { word: 'happy',     emoji: ':)', known: true  },
  { word: 'because',   emoji: '+',  known: true  },
  { word: 'travel',    emoji: '>',  known: false },
  { word: 'water',     emoji: '~',  known: true  },
  { word: 'yesterday', emoji: '<',  known: false },
]

export const MISSIONS = [
  {
    id: 'morning',
    title: 'Cuenta tu manana',
    prompt: 'Escribe una frase en ingles: I had coffee this morning.',
    xp: 20,
    tags: ['rutina', 'pasado'],
  },
  {
    id: 'travel',
    title: 'Planea un viaje',
    prompt: 'Completa en ingles: I want to travel to ____ because ____.',
    xp: 25,
    tags: ['viajes', 'because'],
  },
  {
    id: 'questions',
    title: 'Haz una pregunta',
    prompt: 'Escribe una pregunta simple: How are you?',
    xp: 30,
    tags: ['preguntas', 'orden'],
  },
]

export function getTodayPhrase() {
  const idx = new Date().getDay() % PHRASES_OF_DAY.length
  return PHRASES_OF_DAY[idx]
}

export function getTodayMission() {
  const idx = new Date().getDate() % MISSIONS.length
  return MISSIONS[idx]
}
