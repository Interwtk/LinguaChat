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
export const MODEL_VERSION = 4

/*
 * Activity formats we can observe. Preference only ever changes VARIETY — which
 * of two equivalent activities to use next — never whether a needed skill is
 * practised. Difficulty is not dislike: errors, help and long attempts are
 * deliberately not counted as negative signals.
 */
export const ACTIVITY_FORMATS = [
  'comprehension', 'word_order', 'fill_blank', 'choice',
  'free_reply', 'roleplay', 'recall', 'review', 'mini_story',
  'guided_reply',
]

const emptyActivityStat = () => ({
  shown: 0, completed: 0, abandoned: 0, assistanceUsed: 0, retried: 0,
  positiveSignals: 0, negativeSignals: 0,
})

// How many event ids we remember purely to stay idempotent. Bounded so
// localStorage cannot grow without limit; only ids are kept, never answers.
export const SIGNAL_LOG_LIMIT = 160

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
    // Ids of activity events already counted, so the same moment can never be
    // counted twice (double tap, StrictMode, reload, breakpoint, re-render).
    signalLog: [],
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
      signalLog: sanitizeSignalLog(parsed.signalLog),
    }
  }

  /*
   * v3 -> v4: adds the retried / negative counters and the idempotency log.
   * Preferences already earned are kept and simply gain the missing counters,
   * so nobody starts again from zero.
   */
  if (parsed.version === 3) {
    const m = emptyModel()
    return {
      ...m, ...parsed,
      version: MODEL_VERSION,
      canDo: { ...parsed.canDo }, languageItems: { ...parsed.languageItems },
      recurringErrors: Array.isArray(parsed.recurringErrors) ? [...parsed.recurringErrors] : [],
      scaffoldByEpisode: { ...parsed.scaffoldByEpisode }, episodes: { ...parsed.episodes },
      facts: { ...(parsed.facts || {}) },
      activityPreferences: sanitizeActivityPreferences(parsed.activityPreferences),
      recentFormats: Array.isArray(parsed.recentFormats) ? parsed.recentFormats.filter(f => ACTIVITY_FORMATS.includes(f)).slice(0, 12) : [],
      recentInterests: Array.isArray(parsed.recentInterests) ? parsed.recentInterests.filter(i => typeof i === 'string').slice(0, 8) : [],
      signalLog: [],
    }
  }

  /*
   * v2 -> v4: everything the learner earned is kept exactly as it is; only the
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
      activityPreferences: {}, recentFormats: [], recentInterests: [], signalLog: [],
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

/*
 * Merge the activity evidence held in storage with the copy about to be saved.
 *
 * Several components hold their own snapshot of the model (the episode shell,
 * the session runner, the little feedback card). Whoever saved last used to win,
 * which silently threw away a signal another component had just recorded — a
 * learner could answer "more like this" and watch it disappear a second later.
 *
 * Every counter here only ever grows, and every increment is guarded by a unique
 * event id, so taking the larger of the two values is exactly the union of what
 * both copies saw: never double-counted, never lost.
 */
function mergeActivityEvidence(model) {
  let stored = null
  try { stored = JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return model }
  if (!stored || typeof stored !== 'object' || stored.version !== MODEL_VERSION) return model

  const mine = model.activityPreferences || {}
  const theirs = sanitizeActivityPreferences(stored.activityPreferences)
  const merged = {}
  for (const format of new Set([...Object.keys(mine), ...Object.keys(theirs)])) {
    const a = mine[format] || emptyActivityStat()
    const b = theirs[format] || emptyActivityStat()
    const out = emptyActivityStat()
    for (const key of Object.keys(out)) out[key] = Math.max(Number(a[key]) || 0, Number(b[key]) || 0)
    merged[format] = out
  }

  const myLog = Array.isArray(model.signalLog) ? model.signalLog : []
  const theirLog = sanitizeSignalLog(stored.signalLog)
  const log = [...myLog, ...theirLog.filter(id => !myLog.includes(id))].slice(0, SIGNAL_LOG_LIMIT)
  // whichever copy has seen more events also has the more current recency list
  const recent = theirLog.length > myLog.length ? sanitizeSignalLog([]).concat(stored.recentFormats || []) : model.recentFormats

  return {
    ...model,
    activityPreferences: merged,
    signalLog: log,
    recentFormats: (Array.isArray(recent) ? recent : []).filter(f => ACTIVITY_FORMATS.includes(f)).slice(0, 12),
  }
}

export function saveLearnerModel(model) {
  const merged = mergeActivityEvidence(model)
  // keep the caller's own object in step with what was written
  model.activityPreferences = merged.activityPreferences
  model.signalLog = merged.signalLog
  model.recentFormats = merged.recentFormats
  try { localStorage.setItem(KEY, JSON.stringify({ ...merged, version: MODEL_VERSION })) } catch {}
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

export function sanitizeSignalLog(raw) {
  if (!Array.isArray(raw)) return []
  return raw.filter(id => typeof id === 'string' && id.length > 0 && id.length <= 120).slice(0, SIGNAL_LOG_LIMIT)
}

/*
 * Record one observation about a format.
 *
 * `signal` is one of SIGNAL_KINDS. Note what is NOT here: mistakes, slow
 * attempts and asking for help do not count against a format. `retried` and
 * `assistance` ARE stored, because they describe how the activity went, but
 * they deliberately carry no weight in the score: difficulty is not dislike.
 */
export const SIGNAL_KINDS = ['shown', 'completed', 'abandoned', 'assistance', 'retried', 'positive', 'negative_soft']

export function recordActivitySignal(model, format, signal) {
  if (!ACTIVITY_FORMATS.includes(format) || !SIGNAL_KINDS.includes(signal)) return model
  model.activityPreferences = model.activityPreferences || {}
  const stat = model.activityPreferences[format] || emptyActivityStat()
  if (signal === 'shown') stat.shown += 1
  else if (signal === 'completed') stat.completed += 1
  else if (signal === 'abandoned') stat.abandoned += 1
  else if (signal === 'assistance') stat.assistanceUsed += 1
  else if (signal === 'retried') stat.retried += 1
  else if (signal === 'positive') stat.positiveSignals += 1
  else if (signal === 'negative_soft') stat.negativeSignals += 1
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
 * Record a signal at most once for a given moment.
 *
 * `eventId` identifies the moment, not the call: "this step of this episode in
 * this session, shown". Every source of accidental repetition — a re-render, a
 * StrictMode double effect, a language switch, crossing a breakpoint, a reload
 * onto the same step, a double tap — produces the SAME id and is therefore
 * counted once. Returns true only when the signal was actually new.
 */
export function recordActivitySignalOnce(model, eventId, format, signal) {
  if (!eventId || !ACTIVITY_FORMATS.includes(format) || !SIGNAL_KINDS.includes(signal)) return false
  model.signalLog = Array.isArray(model.signalLog) ? model.signalLog : []
  if (model.signalLog.includes(eventId)) return false
  recordActivitySignal(model, format, signal)
  model.signalLog = [eventId, ...model.signalLog].slice(0, SIGNAL_LOG_LIMIT)
  return true
}

/*
 * A 0..1 comfort score, or null when there is not enough evidence.
 *
 * One abandonment is never enough to conclude anything — a learner may simply
 * have been interrupted — so a format needs at least three showings before it
 * has a score at all. The score starts neutral (0.5) and only moves away from
 * neutral as evidence accumulates, so a single completion cannot swing it.
 */
export const MIN_SIGNALS_FOR_SCORE = 3
// Evidence needed before a preference counts as something we can act on.
export const FULL_CONFIDENCE_SIGNALS = 8
export const CONFIDENT_PREFERENCE = 0.6   // ≈5 observations

export function activityScore(model, format) {
  const p = activityPreference(model, format)
  return p.score
}

/*
 * The full picture: what we believe, how sure we are, and on how much evidence.
 * The planner is required to look at `confidence`, never at `score` alone.
 */
export function activityPreference(model, format) {
  const stat = (model.activityPreferences || {})[format]
  const observations = stat ? stat.shown : 0
  const confidence = Math.min(1, Number((observations / FULL_CONFIDENCE_SIGNALS).toFixed(3)))
  if (!stat || observations < MIN_SIGNALS_FOR_SCORE) return { score: null, confidence, observations }
  const completionRate = stat.completed / observations
  const abandonRate = stat.abandoned / observations
  const liked = Math.min(1, stat.positiveSignals / observations)
  const disliked = Math.min(1, (stat.negativeSignals || 0) / observations)
  // Note: retried and assistanceUsed are absent on purpose. A hard activity is
  // not a disliked activity, and punishing help would teach learners to suffer.
  const target = Math.max(0, Math.min(1, 0.65 * completionRate + 0.35 * liked - 0.5 * abandonRate - 0.35 * disliked))
  const weight = Math.min(1, observations / FULL_CONFIDENCE_SIGNALS)
  const score = 0.5 + (target - 0.5) * weight
  return { score: Number(Math.max(0, Math.min(1, score)).toFixed(3)), confidence, observations }
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
    const { score, confidence } = activityPreference(model, format)
    // A weak preference must not behave like a certainty: until there is enough
    // evidence the format is treated as neutral and only recency decides.
    const effective = score == null || confidence < CONFIDENT_PREFERENCE ? 0.5 : score
    const recency = recent.indexOf(format)   // -1 = not used recently
    return { format, index, score: effective, recencyPenalty: recency === -1 ? 0 : (3 - Math.min(recency, 3)) * 0.2 }
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
