import { CEFR_LEVELS, PLACEMENT_QUESTIONS } from '../data/placementQuestions'
import { translate } from '../i18n/translations'
import { playableLevelId, labelKeyOfLevel } from '../learning/curriculum/levels.js'

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

// index 4 (C1) and 5 (C2) intentionally share one plan: the placement adapts by
// skill difficulty, not by a separate C2 auxiliary track.
function planTierFor(index) {
  if (index <= 0) return 'A1'
  if (index === 1) return 'A2'
  if (index === 2) return 'B1'
  if (index === 3) return 'B2'
  return 'Advanced'
}

function levelPlan(level, language) {
  const tier = planTierFor(levelIndex(level))
  return {
    strengths: [
      translate(language, `placementPlan${tier}Strength1`),
      translate(language, `placementPlan${tier}Strength2`),
    ],
    focusAreas: [
      translate(language, `placementPlan${tier}Focus1`),
      translate(language, `placementPlan${tier}Focus2`),
      translate(language, `placementPlan${tier}Focus3`),
    ],
    correction: translate(language, `placementPlan${tier}Correction`),
    recommendation: translate(language, `placementPlan${tier}Recommendation`),
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
    skillKey: question.skillKey,
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
    // Rendered through t() at the call site — explanationKey resolves via
    // user_language, never the practice-material English options.
    feedback: {
      isCorrect,
      explanationKey: question.explanationKey,
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

export function calculatePlacementResult(state, language) {
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

  const plan = levelPlan(level, language)
  const correctSkillKeys = readableList(answers.filter(answer => answer.isCorrect).map(answer => answer.skillKey))
  const missedSkillKeys = readableList(answers.filter(answer => !answer.isCorrect).map(answer => answer.skillKey))
  const strengths = correctSkillKeys.length
    ? correctSkillKeys.map(skillKey => translate(language, 'placementSkillRecognized', { skill: translate(language, skillKey) }))
    : plan.strengths
  const focusAreas = missedSkillKeys.length ? missedSkillKeys.map(skillKey => translate(language, skillKey)) : plan.focusAreas

  // `level`/`detectedLevel` is a diagnostic read of the learner's English — it can
  // legitimately name any CEFR band the quiz supports. `currentCourseLevelId` is
  // the separate, honest answer to "what will LinguaChat actually teach me right
  // now", derived from the curriculum registry rather than assumed equal to it.
  const currentCourseLevelId = playableLevelId()

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
    currentCourseLevelId,
    currentCourseLabelKey: labelKeyOfLevel(currentCourseLevelId),
    answers,
    completedAt: new Date().toISOString(),
  }
}
