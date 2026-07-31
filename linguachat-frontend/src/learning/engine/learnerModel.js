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
export const MODEL_VERSION = 3

/*
 * Activity formats we can observe. Preference only ever changes VARIETY — which
 * of two equivalent activities to use next — never whether a needed skill is
 * practised. Difficulty is not dislike: errors, help and long attempts are
 * deliberately not counted as negative signals.
 */
export const ACTIVITY_FORMATS = [
  'comprehension', 'word_order', 'fill_blank', 'choice',
  'free_reply', 'roleplay', 'recall', 'review', 'mini_story',
]

const emptyActivityStat = () => ({
  shown: 0, completed: 0, abandoned: 0, assistanceUsed: 0, positiveSignals: 0,
})

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
    // How the learner gets on with each activity format, and what has been used
    // lately, so sessions can vary without becoming random.
    activityPreferences: {},
    recentFormats: [],
    recentInterests: [],
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
      activityPreferences: sanitizeActivityPreferences(parsed.activityPreferences),
      recentFormats: Array.isArray(parsed.recentFormats) ? parsed.recentFormats.filter(f => ACTIVITY_FORMATS.includes(f)).slice(0, 12) : [],
      recentInterests: Array.isArray(parsed.recentInterests) ? parsed.recentInterests.filter(i => typeof i === 'string').slice(0, 8) : [],
    }
  }

  /*
   * v2 -> v3: everything the learner earned is kept exactly as it is; only the
   * new preference fields are added. A learner upgrading mid-arc loses nothing.
   */
  if (parsed.version === 2) {
    const m = emptyModel()
    return {
      ...m, ...parsed,
      version: MODEL_VERSION,
      canDo: { ...parsed.canDo }, languageItems: { ...parsed.languageItems },
      recurringErrors: Array.isArray(parsed.recurringErrors) ? [...parsed.recurringErrors] : [],
      scaffoldByEpisode: { ...parsed.scaffoldByEpisode }, episodes: { ...parsed.episodes },
      facts: { ...(parsed.facts || {}) },
      activityPreferences: {}, recentFormats: [], recentInterests: [],
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

/* ---- activity preferences ---- */

// Drop unknown formats and clamp every counter, so a corrupt or hand-edited
// file can never produce a nonsensical score.
export function sanitizeActivityPreferences(raw) {
  const out = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [format, stat] of Object.entries(raw)) {
    if (!ACTIVITY_FORMATS.includes(format) || !stat || typeof stat !== 'object') continue
    const clean = emptyActivityStat()
    for (const key of Object.keys(clean)) {
      const value = Number(stat[key])
      clean[key] = Number.isFinite(value) && value >= 0 ? Math.min(Math.round(value), 9999) : 0
    }
    out[format] = clean
  }
  return out
}

/*
 * Record one observation about a format.
 *
 * `signal` is 'shown' | 'completed' | 'abandoned' | 'assistance' | 'positive'.
 * Note what is NOT here: mistakes, retries and slow attempts. Those say the
 * activity was hard, not that it was disliked, and must never push a format away.
 */
export function recordActivitySignal(model, format, signal) {
  if (!ACTIVITY_FORMATS.includes(format)) return model
  model.activityPreferences = model.activityPreferences || {}
  const stat = model.activityPreferences[format] || emptyActivityStat()
  if (signal === 'shown') stat.shown += 1
  else if (signal === 'completed') stat.completed += 1
  else if (signal === 'abandoned') stat.abandoned += 1
  else if (signal === 'assistance') stat.assistanceUsed += 1
  else if (signal === 'positive') stat.positiveSignals += 1
  model.activityPreferences[format] = stat
  /*
   * A rolling log of what was actually shown, most recent first — duplicates
   * INCLUDED. De-duplicating here would make "this format keeps repeating"
   * impossible to detect, which is the whole point of tracking recency.
   */
  if (signal === 'shown') {
    model.recentFormats = [format, ...(model.recentFormats || [])].slice(0, 12)
  }
  return model
}

/*
 * A 0..1 comfort score, or null when there is not enough evidence.
 *
 * One abandonment is never enough to conclude anything — a learner may simply
 * have been interrupted — so a format needs at least three showings before it
 * has a score at all.
 */
export const MIN_SIGNALS_FOR_SCORE = 3

export function activityScore(model, format) {
  const stat = (model.activityPreferences || {})[format]
  if (!stat || stat.shown < MIN_SIGNALS_FOR_SCORE) return null
  const completionRate = stat.completed / Math.max(1, stat.shown)
  const abandonRate = stat.abandoned / Math.max(1, stat.shown)
  const liked = Math.min(1, stat.positiveSignals / Math.max(1, stat.shown))
  const score = 0.65 * completionRate + 0.35 * liked - 0.4 * abandonRate
  return Math.max(0, Math.min(1, Number(score.toFixed(3))))
}

/*
 * Choose between activities that teach the same thing. Anything the learner has
 * seen very recently is pushed back so a session never repeats one format over
 * and over; among the rest, a format they get on with wins. With no evidence the
 * order given by the caller is preserved, so behaviour stays predictable.
 */
export function preferredFormat(model, candidates = []) {
  const options = candidates.filter(f => ACTIVITY_FORMATS.includes(f))
  if (!options.length) return null
  const recent = model.recentFormats || []
  const ranked = options.map((format, index) => {
    const score = activityScore(model, format)
    const recency = recent.indexOf(format)   // -1 = not used recently
    return { format, index, score: score == null ? 0.5 : score, recencyPenalty: recency === -1 ? 0 : (3 - Math.min(recency, 3)) * 0.2 }
  })
  ranked.sort((a, b) => (b.score - b.recencyPenalty) - (a.score - a.recencyPenalty) || a.index - b.index)
  return ranked[0].format
}

// True when a format has repeated enough lately that variety is worth forcing.
export function formatOverused(model, format, within = 3) {
  return (model.recentFormats || []).slice(0, within).filter(f => f === format).length >= 2
}

export function noteInterestUsed(model, interestId) {
  if (!interestId) return model
  model.recentInterests = [interestId, ...(model.recentInterests || []).filter(i => i !== interestId)].slice(0, 8)
  return model
}

export function getDueReviews(model, atMs = Date.now()) {
  const due = []
  for (const [id, it] of Object.entries(model.languageItems)) {
    if (it.nextReviewAt && new Date(it.nextReviewAt).getTime() <= atMs && it.status !== 'new') due.push(id)
  }
  return due
}
