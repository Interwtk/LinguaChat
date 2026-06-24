import { CEFR_LEVELS, PLACEMENT_QUESTIONS } from '../data/placementQuestions'

const MIN_QUESTIONS = 6
const MAX_QUESTIONS = 10

function clampIndex(index) {
  return Math.max(0, Math.min(CEFR_LEVELS.length - 1, index))
}

function levelIndex(level) {
  return Math.max(0, CEFR_LEVELS.indexOf(level))
}

function readableList(items) {
  return [...new Set(items)].slice(0, 3)
}

function levelPlan(level) {
  const index = levelIndex(level)
  if (index <= 0) {
    return {
      strengths: ['Ya puedes reconocer frases muy simples en ingles.', 'Puedes empezar con saludos, gustos y emociones.'],
      focusAreas: ['frases con I am', 'presentarte', 'preguntas basicas'],
      correction: 'Lingua te corregira con frases cortas y ejemplos listos para copiar.',
      recommendation: 'Tu proxima meta: escribir una frase simple y agregar una palabra extra.',
    }
  }
  if (index === 1) {
    return {
      strengths: ['Ya puedes entender frases cotidianas y algunas preguntas simples.', 'Puedes practicar rutinas, gustos y lugares.'],
      focusAreas: ['preguntas con do', 'rutina diaria', 'preposiciones cotidianas'],
      correction: 'Lingua te dara una correccion breve y una frase para responder de inmediato.',
      recommendation: 'Tu proxima meta: responder con una frase completa y una razon corta.',
    }
  }
  if (index === 2) {
    return {
      strengths: ['Ya puedes conectar ideas simples y hablar de planes o experiencias.', 'Puedes sostener una conversacion corta con apoyo.'],
      focusAreas: ['pasado simple', 'planes futuros', 'conectores como because y but'],
      correction: 'Lingua marcara el patron principal y te pedira usarlo en otra frase.',
      recommendation: 'Tu proxima meta: contar algo que paso y explicar por que.',
    }
  }
  if (index === 3) {
    return {
      strengths: ['Ya puedes expresar opiniones con mas detalle.', 'Puedes empezar a sonar mas natural en situaciones reales.'],
      focusAreas: ['condicionales', 'comparaciones', 'phrasal verbs utiles'],
      correction: 'Lingua te ayudara a elegir frases mas naturales y precisas.',
      recommendation: 'Tu proxima meta: dar una opinion con una razon y un contraste.',
    }
  }
  return {
    strengths: ['Ya manejas estructuras complejas y puedes trabajar matices.', 'Puedes practicar precision, tono y naturalidad.'],
    focusAreas: ['registro formal', 'matices de certeza', 'expresiones idiomaticas'],
    correction: 'Lingua afinara tono, precision y alternativas mas naturales.',
    recommendation: 'Tu proxima meta: expresar la misma idea con distinto tono.',
  }
}

function getStreak(answers, correct) {
  let count = 0
  for (let index = answers.length - 1; index >= 0; index -= 1) {
    if (answers[index].isCorrect !== correct) break
    count += 1
  }
  return count
}

function answeredIds(answers) {
  return new Set(answers.map(answer => answer.questionId))
}

function findQuestionForLevel(level, answers) {
  const used = answeredIds(answers)
  const direct = PLACEMENT_QUESTIONS.find(question => question.level === level && !used.has(question.id))
  if (direct) return direct

  const base = levelIndex(level)
  for (let distance = 1; distance < CEFR_LEVELS.length; distance += 1) {
    const lower = CEFR_LEVELS[base - distance]
    const upper = CEFR_LEVELS[base + distance]
    const fallback = PLACEMENT_QUESTIONS.find(question =>
      [lower, upper].includes(question.level) && !used.has(question.id)
    )
    if (fallback) return fallback
  }

  return PLACEMENT_QUESTIONS.find(question => !used.has(question.id)) || PLACEMENT_QUESTIONS[0]
}

export function getInitialPlacementState(startLevel = 'A2') {
  const currentLevel = CEFR_LEVELS.includes(startLevel) ? startLevel : 'A2'
  return {
    currentLevel,
    targetLevel: currentLevel,
    answers: [],
    questionNumber: 1,
    maxQuestions: MAX_QUESTIONS,
    minQuestions: MIN_QUESTIONS,
  }
}

export function getNextQuestion(state) {
  return findQuestionForLevel(state.targetLevel || state.currentLevel || 'A2', state.answers || [])
}

export function evaluateAnswer(question, optionId, state) {
  const isCorrect = optionId === question.correctOptionId
  const previousAnswers = state.answers || []
  const correctStreak = isCorrect ? getStreak(previousAnswers, true) + 1 : 0
  const wrongStreak = !isCorrect ? getStreak(previousAnswers, false) + 1 : 0
  const currentIndex = levelIndex(question.level)
  let shift = 0

  if (isCorrect) shift = correctStreak >= 2 ? 1 : 0
  if (!isCorrect) shift = wrongStreak >= 2 ? -1 : -1

  const nextIndex = clampIndex(currentIndex + shift)
  const answer = {
    questionId: question.id,
    level: question.level,
    skill: question.skill,
    selectedOptionId: optionId,
    correctOptionId: question.correctOptionId,
    isCorrect,
    answeredAt: Date.now(),
  }
  const answers = [...previousAnswers, answer]

  return {
    answer,
    nextState: {
      ...state,
      answers,
      currentLevel: question.level,
      targetLevel: CEFR_LEVELS[nextIndex],
      questionNumber: answers.length + 1,
    },
    feedback: {
      isCorrect,
      title: isCorrect
        ? 'Bien. Subiremos un poco la dificultad.'
        : 'No pasa nada. Probemos algo mas simple.',
      explanation: question.explanation,
    },
  }
}

export function shouldFinishPlacement(state) {
  const answers = state.answers || []
  if (answers.length < MIN_QUESTIONS) return false
  if (answers.length >= MAX_QUESTIONS) return true

  const recent = answers.slice(-4)
  const levels = new Set(recent.map(answer => answer.level))
  const accuracy = recent.filter(answer => answer.isCorrect).length / Math.max(1, recent.length)

  return recent.length === 4 && levels.size <= 2 && (accuracy >= 0.75 || accuracy <= 0.25)
}

export function calculatePlacementResult(state) {
  const answers = state.answers || []
  const weighted = answers.reduce((sum, answer) => {
    const index = levelIndex(answer.level)
    return sum + (answer.isCorrect ? index + 0.6 : index - 1)
  }, 0)
  const normalized = weighted / Math.max(1, answers.length)
  const level = CEFR_LEVELS[clampIndex(Math.round(normalized))]
  const correct = answers.filter(answer => answer.isCorrect).length
  const score = Math.round((correct / Math.max(1, answers.length)) * 100)
  const confidence = Math.min(95, Math.round(55 + answers.length * 3 + Math.abs(score - 50) * 0.35))

  const plan = levelPlan(level)
  const correctSkills = readableList(answers.filter(answer => answer.isCorrect).map(answer => answer.skill))
  const missedSkills = readableList(answers.filter(answer => !answer.isCorrect).map(answer => answer.skill))
  const strengths = correctSkills.length
    ? correctSkills.map(skill => `Reconoces bien: ${skill}.`)
    : plan.strengths
  const focusAreas = missedSkills.length ? missedSkills : plan.focusAreas

  return {
    level,
    detectedLevel: level,
    score,
    confidence,
    vocab: Math.max(40, Math.min(95, score + 8)),
    grammar: Math.max(38, Math.min(94, score)),
    conversation: Math.max(45, Math.min(96, score + 5)),
    strengths,
    focusAreas,
    placementStrengths: strengths,
    placementFocusAreas: focusAreas,
    recommendedCorrectionStyle: plan.correction,
    practiceRecommendation: plan.recommendation,
    answers,
    completedAt: new Date().toISOString(),
  }
}
