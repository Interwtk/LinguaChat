export const PHRASES_OF_DAY = [
  { phrase: 'I am happy today.', meaning: 'Estoy feliz hoy.' },
  { phrase: 'I need help, please.', meaning: 'Necesito ayuda, por favor.' },
  { phrase: 'Where is the station?', meaning: 'Donde esta la estacion?' },
  { phrase: 'I want to travel.', meaning: 'Quiero viajar.' },
  { phrase: 'Can I have water?', meaning: 'Puedo pedir agua?' },
  { phrase: 'I went to work yesterday.', meaning: 'Fui al trabajo ayer.' },
  { phrase: 'I like it because it is easy.', meaning: 'Me gusta porque es facil.' },
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

export const LAST_MISTAKES = [
  { original: 'how you are',    fixed: 'How are you?',      count: 3, topic: 'Question order' },
  { original: 'me happy today', fixed: "I'm happy today.",  count: 2, topic: 'I am + emotion' },
  { original: 'she have',       fixed: 'she has',           count: 1, topic: 'He/she/it + s' },
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
