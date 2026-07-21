/*
 * learnerModel (v2) — what the learner can do, with safe migration from v1.
 *
 * Distinguishes helped vs independent evidence. Mastery is never granted from a
 * single helped success. Also stores per-episode progress (step + status) so a
 * mid-episode reload resumes correctly, and completion is idempotent (no double
 * XP / no double Memory Garden). Stored in localStorage; no sensitive data.
 */
const KEY = 'lc2-learner-model-v1' // key kept stable; internal `version` gates migration
const DAY = 86400000
export const MODEL_VERSION = 2

export function createLearnerModel() {
  return {
    version: MODEL_VERSION,
    canDo: {},
    languageItems: {},
    recurringErrors: [],
    scaffoldByEpisode: {},
    episodes: {},
    // Soft facts the learner supplies inside an activity (e.g. the place they
    // are from). Never required up front, never part of the global profile.
    facts: {},
  }
}
const emptyModel = createLearnerModel

const nowIso = () => new Date().toISOString()

// ---- migration ----
export function migrateLearnerModel(parsed) { return migrate(parsed) }
function migrate(parsed) {
  if (!parsed || typeof parsed !== 'object') return emptyModel()
  if (parsed.version === MODEL_VERSION) {
    const m = emptyModel()
    return {
      ...m, ...parsed,
      canDo: { ...parsed.canDo }, languageItems: { ...parsed.languageItems },
      recurringErrors: Array.isArray(parsed.recurringErrors) ? [...parsed.recurringErrors] : [],
      scaffoldByEpisode: { ...parsed.scaffoldByEpisode }, episodes: { ...parsed.episodes },
      facts: { ...(parsed.facts || {}) },
    }
  }
  // v1 -> v2 (never lose existing progress)
  const m = emptyModel()
  for (const [id, c] of Object.entries(parsed.canDo || {})) {
    m.canDo[id] = {
      status: c.status || 'learning',
      attempts: c.attempts || 0,
      successes: c.successfulAttempts || 0,
      independentSuccesses: c.status === 'can_do' ? 1 : 0,
      contexts: [],
      lastPracticedAt: c.lastPracticedAt || null,
    }
  }
  for (const [id, it] of Object.entries(parsed.languageItems || {})) {
    m.languageItems[id] = {
      status: it.status === 'known' ? 'can_do' : (it.status || 'learning'),
      correct: it.correct || 0,
      incorrect: it.incorrect || 0,
      independentCorrect: it.status === 'known' ? 1 : 0,
      streak: it._streak || 0,
      nextReviewAt: it.nextReviewAt || null,
      lastSeenAt: nowIso(),
    }
  }
  if (parsed.preferredScaffold) m.scaffoldByEpisode.first_greeting = parsed.preferredScaffold
  // preserve legacy episode completion flag if present elsewhere is handled by caller
  return m
}

export function loadLearnerModel() {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored) return migrate(JSON.parse(stored))
  } catch {}
  return emptyModel()
}

export function saveLearnerModel(model) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...model, version: MODEL_VERSION })) } catch {}
  return model
}

// ---- review scheduling ----
export function reviewDelayDays({ correct, independent, streak }) {
  if (!correct) return 0
  if (!independent) return 1
  return streak >= 2 ? 4 : 2
}

export function scheduleReview(prev, { correct, independent }) {
  const streak = correct ? (prev?.streak || 0) + 1 : 0
  return { nextReviewAt: new Date(Date.now() + reviewDelayDays({ correct, independent, streak }) * DAY).toISOString(), streak }
}

// ---- language items ----
export function recordItemAttempt(model, itemId, { correct, independent = false }) {
  const prev = model.languageItems[itemId] || { status: 'new', correct: 0, incorrect: 0, independentCorrect: 0, streak: 0, nextReviewAt: null, lastSeenAt: null }
  const correctCount = prev.correct + (correct ? 1 : 0)
  const incorrectCount = prev.incorrect + (correct ? 0 : 1)
  const independentCorrect = prev.independentCorrect + (correct && independent ? 1 : 0)
  const review = scheduleReview(prev, { correct, independent })
  let status = 'learning'
  if (independentCorrect >= 1 && correctCount >= 2) status = 'can_do'
  model.languageItems[itemId] = {
    status, correct: correctCount, incorrect: incorrectCount, independentCorrect,
    streak: review.streak, nextReviewAt: review.nextReviewAt, lastSeenAt: nowIso(),
  }
  return model
}

// ---- can-do goals ----
export function recordCanDoAttempt(model, canDoId, { success, independent = false, context = null }) {
  const prev = model.canDo[canDoId] || { status: 'new', attempts: 0, successes: 0, independentSuccesses: 0, contexts: [], lastPracticedAt: null }
  const attempts = prev.attempts + 1
  const successes = prev.successes + (success ? 1 : 0)
  const independentSuccesses = prev.independentSuccesses + (success && independent ? 1 : 0)
  const contexts = context && !prev.contexts.includes(context) && success ? [...prev.contexts, context] : prev.contexts
  // can_do: at least two successes with at least one independent (across contexts)
  let status = 'learning'
  if (successes >= 2 && independentSuccesses >= 1) status = 'can_do'
  else if (attempts > 0) status = 'learning'
  model.canDo[canDoId] = { status, attempts, successes, independentSuccesses, contexts, lastPracticedAt: nowIso() }
  return model
}

export function markRecurringError(model, errorType) {
  if (!errorType) return model
  const existing = model.recurringErrors.find(e => e.errorType === errorType)
  if (existing) existing.count += 1
  else model.recurringErrors = [{ errorType, count: 1 }, ...model.recurringErrors].slice(0, 20)
  return model
}

// ---- scaffolding ----
export function getRecommendedScaffold(current, { cleanSuccessStreak = 0, justFailed = false, usedHelp = false } = {}) {
  const order = ['high', 'medium', 'low']
  let idx = Math.max(0, order.indexOf(current || 'high'))
  if (justFailed) idx = Math.max(0, idx - 1)
  else if (cleanSuccessStreak >= 2 && !usedHelp) idx = Math.min(order.length - 1, idx + 1)
  return order[idx]
}

// ---- episode progress (resume + idempotent completion) ----
export function getEpisodeState(model, episodeId) {
  return model.episodes[episodeId] || { status: 'new', stepIndex: 0, awarded: false }
}

export function setEpisodeState(model, episodeId, patch) {
  const prev = getEpisodeState(model, episodeId)
  model.episodes[episodeId] = { ...prev, ...patch }
  return model
}

export function getDueReviews(model, atMs = Date.now()) {
  const due = []
  for (const [id, it] of Object.entries(model.languageItems)) {
    if (it.nextReviewAt && new Date(it.nextReviewAt).getTime() <= atMs && it.status !== 'new') due.push(id)
  }
  return due
}
