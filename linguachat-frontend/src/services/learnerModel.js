/*
 * learnerModel — a small, encapsulated model of what the learner can do.
 *
 * Stored locally (lc2-learner-model-v1) for now; no real DB, no sensitive data.
 * Drives deterministic scaffolding and a very simple spaced-review schedule.
 */
const KEY = 'lc2-learner-model-v1'
const DAY = 86400000

const EMPTY_MODEL = {
  version: 1,
  canDo: {},          // canDoId -> { status, attempts, successfulAttempts, lastPracticedAt }
  languageItems: {},  // itemId -> { status, correct, incorrect, nextReviewAt }
  recurringErrors: [],
  preferredScaffold: 'high',
}

export function loadLearnerModel() {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed && parsed.version === 1) {
        return { ...EMPTY_MODEL, ...parsed, canDo: { ...parsed.canDo }, languageItems: { ...parsed.languageItems } }
      }
    }
  } catch {}
  return { ...EMPTY_MODEL, canDo: {}, languageItems: {}, recurringErrors: [] }
}

export function saveLearnerModel(model) {
  try { localStorage.setItem(KEY, JSON.stringify(model)) } catch {}
  return model
}

function nowIso() {
  return new Date().toISOString()
}

// Simple spaced review: fail -> soon; success with help -> next day; clean twice -> a few days.
function reviewDelayDays({ correct, usedHelp, streak }) {
  if (!correct) return 0            // review very soon (same session)
  if (usedHelp) return 1            // tomorrow
  return streak >= 2 ? 4 : 2        // a few days once independent
}

export function scheduleReview(item, { correct, usedHelp }) {
  const streak = correct ? (item?._streak || 0) + 1 : 0
  const days = reviewDelayDays({ correct, usedHelp, streak })
  return {
    nextReviewAt: new Date(Date.now() + days * DAY).toISOString(),
    _streak: streak,
  }
}

// Record one attempt on a language item and update its mastery + review date.
export function recordItemAttempt(model, itemId, { correct, usedHelp }) {
  const prev = model.languageItems[itemId] || { status: 'new', correct: 0, incorrect: 0, nextReviewAt: null, _streak: 0 }
  const correctCount = prev.correct + (correct ? 1 : 0)
  const incorrectCount = prev.incorrect + (correct ? 0 : 1)
  const review = scheduleReview(prev, { correct, usedHelp })
  let status = prev.status
  if (correct && !usedHelp && correctCount >= 2) status = 'known'
  else if (correct) status = 'learning'
  else status = 'learning'
  model.languageItems[itemId] = {
    status, correct: correctCount, incorrect: incorrectCount,
    nextReviewAt: review.nextReviewAt, _streak: review._streak,
  }
  return model
}

// Update a can-do goal after an attempt.
export function recordCanDoAttempt(model, canDoId, { success }) {
  const prev = model.canDo[canDoId] || { status: 'new', attempts: 0, successfulAttempts: 0, lastPracticedAt: null }
  const attempts = prev.attempts + 1
  const successfulAttempts = prev.successfulAttempts + (success ? 1 : 0)
  let status = 'learning'
  if (successfulAttempts >= 2) status = 'can_do'
  else if (attempts > 0) status = 'learning'
  model.canDo[canDoId] = { status, attempts, successfulAttempts, lastPracticedAt: nowIso() }
  return model
}

/*
 * Deterministic scaffolding. Starts 'high' for an absolute beginner; two clean
 * (help-free) successes in a row lower it; a failure raises it. Never punishes,
 * never resets the whole episode.
 */
export function getRecommendedScaffold(current, { cleanSuccessStreak = 0, justFailed = false } = {}) {
  const order = ['high', 'medium', 'low']
  let idx = Math.max(0, order.indexOf(current))
  if (justFailed) idx = Math.max(0, idx - 1)
  else if (cleanSuccessStreak >= 2) idx = Math.min(order.length - 1, idx + 1)
  return order[idx]
}

export function markRecurringError(model, errorId) {
  if (errorId && !model.recurringErrors.includes(errorId)) {
    model.recurringErrors = [errorId, ...model.recurringErrors].slice(0, 20)
  }
  return model
}
