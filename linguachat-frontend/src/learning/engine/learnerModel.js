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
export const MODEL_VERSION = 7

// How many past runs of one episode we keep. Enough to see a pattern, small
// enough that storage never grows without bound.
export const RUNS_PER_EPISODE = 12

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
    /*
     * A compact history of how each episode was played: first time, resumed,
     * practised again, or practised taking the other option. Never the answers
     * themselves — just enough to tell a replay from a first run and to keep
     * rewards honest.
     */
    episodeRuns: {},
    activeRun: null,
    /*
     * Things the learner told Lingua inside an activity ("I like music"), with
     * enough metadata to use them sparingly and drop them when they go stale.
     * Kept apart from the interests chosen at onboarding: both may be true.
     */
    learnerFacts: [],
    /*
     * What the learner has reached, once, and keeps.
     *
     * Everything else in this model describes the CURRENT state of their
     * learning and is free to move in both directions — an item can fall due,
     * a skill can go quiet. A milestone is the opposite: it records that a
     * threshold was genuinely met at a moment in time, and nothing that happens
     * afterwards un-happens it. A review falling due tomorrow changes what to
     * practise, not whether last month's graduation occurred.
     *
     * Metadata only: when, and under which set of criteria. No transcript, no
     * score, no answers.
     */
    levelMilestones: {},
  }
}
const emptyModel = createLearnerModel

const nowIso = () => new Date().toISOString()

// ---- migration ----
export function migrateLearnerModel(parsed) { return migrate(parsed) }

/*
 * Carry a stored model forward to the current version.
 *
 * Everything the learner earned — XP flags, the Memory Garden, can-dos,
 * mastery evidence, facts, episode progress, scaffolding, review schedules —
 * is copied across untouched. Only fields that did not exist yet are added,
 * empty. Each version simply decides which of the newer fields it can trust.
 */
function carryForward(parsed, { keepPreferences, keepSignals, keepRuns }) {
  const m = emptyModel()
  return {
    ...m, ...parsed,
    version: MODEL_VERSION,
    canDo: { ...parsed.canDo }, languageItems: { ...parsed.languageItems },
    recurringErrors: Array.isArray(parsed.recurringErrors) ? [...parsed.recurringErrors] : [],
    scaffoldByEpisode: { ...parsed.scaffoldByEpisode }, episodes: { ...parsed.episodes },
    facts: { ...(parsed.facts || {}) },
    activityPreferences: keepPreferences ? sanitizeActivityPreferences(parsed.activityPreferences) : {},
    recentFormats: keepPreferences && Array.isArray(parsed.recentFormats)
      ? parsed.recentFormats.filter(f => ACTIVITY_FORMATS.includes(f)).slice(0, 12) : [],
    recentInterests: keepPreferences && Array.isArray(parsed.recentInterests)
      ? parsed.recentInterests.filter(i => typeof i === 'string').slice(0, 8) : [],
    signalLog: keepSignals ? sanitizeSignalLog(parsed.signalLog) : [],
    episodeRuns: keepRuns ? sanitizeEpisodeRuns(parsed.episodeRuns) : {},
    activeRun: keepRuns ? sanitizeRun(parsed.activeRun) : null,
    // A learner arriving from before structured facts still keeps what they
    // told Lingua: the loose `facts.likes` string becomes a proper fact.
    learnerFacts: keepRuns ? sanitizeLearnerFacts(parsed.learnerFacts) : factsFromLegacy(parsed.facts),
    /*
     * Milestones survive every migration and are NEVER back-dated. A learner
     * arriving from v6 with seventeen completed episodes has not graduated —
     * they have finished the course, which is a different sentence. The
     * reconciler will look at their evidence the next time they practise and
     * record it then, with an honest date.
     */
    levelMilestones: sanitizeLevelMilestones(parsed.levelMilestones),
  }
}

/* The levels a milestone may be recorded for. Pre-A1 is the only one that exists. */
export const MILESTONE_LEVELS = ['pre_a1']

/*
 * Keep a milestone only if it is shaped like one. A corrupt or hand-edited
 * entry is dropped rather than trusted: the reconciler can always earn it
 * again from evidence, and a fabricated graduation cannot be un-earned.
 */
export function sanitizeLevelMilestones(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out = {}
  for (const level of MILESTONE_LEVELS) {
    const entry = raw[level]
    if (!entry || typeof entry !== 'object') continue
    const at = Date.parse(entry.graduatedAt || '')
    if (!Number.isFinite(at)) continue
    out[level] = {
      graduatedAt: new Date(at).toISOString(),
      evidenceVersion: typeof entry.evidenceVersion === 'string' ? entry.evidenceVersion.slice(0, 24) : 'unknown',
      source: typeof entry.source === 'string' ? entry.source.slice(0, 32) : 'unknown',
    }
  }
  return out
}

/*
 * Two copies of the same learner, merged.
 *
 * The earliest legitimate graduation wins: it is the one that actually
 * happened, and a later device noticing the same fact does not move the date.
 * A milestone present on either side is never dropped.
 */
export function mergeLevelMilestones(mine, theirs) {
  const a = sanitizeLevelMilestones(mine)
  const b = sanitizeLevelMilestones(theirs)
  const out = {}
  for (const level of MILESTONE_LEVELS) {
    const x = a[level]
    const y = b[level]
    if (!x && !y) continue
    if (!x || !y) { out[level] = x || y; continue }
    out[level] = Date.parse(x.graduatedAt) <= Date.parse(y.graduatedAt) ? x : y
  }
  return out
}

/*
 * Give an item from before v6 a learning state, using only evidence that was
 * already recorded. Nothing is invented, and nothing that had real independent
 * production is demoted — but an item whose history is ambiguous stops at
 * `practicing` rather than being credited with something it may never have had.
 */
function learningStateFromLegacyItem(it) {
  if (!it) return 'seen'
  if (it.learningState && LEARNING_STATE_RANK[it.learningState] != null) return it.learningState
  const independent = it.independentCorrect || 0
  const correct = it.correct || 0
  if (independent >= INDEPENDENT_USES_TO_CAN_USE) return 'can_use'
  if (it.status === 'can_do' && independent >= 1 && correct >= 2) return 'can_use'
  if (correct >= 1) return 'practicing'
  return 'seen'
}

function upgradeLanguageItems(items) {
  const out = {}
  for (const [id, it] of Object.entries(items || {})) {
    if (!it || typeof it !== 'object') continue
    const learningState = learningStateFromLegacyItem(it)
    out[id] = {
      ...emptyItem(), ...it,
      learningState,
      status: learningState === 'can_use' ? 'can_do' : (it.correct || it.incorrect ? 'learning' : (it.status || 'learning')),
    }
  }
  return out
}

function migrate(parsed) {
  if (!parsed || typeof parsed !== 'object') return emptyModel()
  if (parsed.version === MODEL_VERSION) {
    const m = carryForward(parsed, { keepPreferences: true, keepSignals: true, keepRuns: true })
    m.languageItems = upgradeLanguageItems(m.languageItems)
    return m
  }
  /*
   * v6 -> v7: adds `levelMilestones`, empty. Nothing else changes, and in
   * particular no graduation is inferred from a finished curriculum: a v6
   * learner who had met the criteria simply meets them again the next time the
   * reconciler runs, and gets a date that is true.
   */
  if (parsed.version === 6) {
    const m = carryForward(parsed, { keepPreferences: true, keepSignals: true, keepRuns: true })
    m.languageItems = upgradeLanguageItems(m.languageItems)
    return m
  }
  /*
   * v5 -> v7: adds a learning state to every language item, derived from the
   * evidence v5 already stored. Everything else — XP, episodes, mastery,
   * can-dos, facts, interests, preferences, signal ids, runs, the active run
   * and its scaffold — is carried across untouched.
   */
  if (parsed.version === 5) {
    const m = carryForward(parsed, { keepPreferences: true, keepSignals: true, keepRuns: true })
    m.languageItems = upgradeLanguageItems(m.languageItems)
    return m
  }
  // v4 -> v6: adds the run history and structured facts.
  if (parsed.version === 4) {
    const m = carryForward(parsed, { keepPreferences: true, keepSignals: true, keepRuns: false })
    m.languageItems = upgradeLanguageItems(m.languageItems)
    return m
  }
  // v3 -> v6: preferences exist but predate the idempotency log.
  if (parsed.version === 3) {
    const m = carryForward(parsed, { keepPreferences: true, keepSignals: false, keepRuns: false })
    m.languageItems = upgradeLanguageItems(m.languageItems)
    return m
  }
  // v2 -> v6: no preference data at all yet.
  if (parsed.version === 2) {
    const m = carryForward(parsed, { keepPreferences: false, keepSignals: false, keepRuns: false })
    m.languageItems = upgradeLanguageItems(m.languageItems)
    return m
  }
  /*
   * Anything else. A version this build does not recognise is NOT the oldest
   * one: it may have been written by a newer build, or its `version` field may
   * have been lost or truncated on the way to storage. Such a payload is
   * complete, and the v1 rebuild below would silently discard every episode
   * state, every run, the learner's facts and their graduation — and clear the
   * `awarded` flags, so the level could be paid for twice.
   *
   * So unknown data is carried forward and sanitised, which is the same
   * treatment the current version gets. Only something that really looks like
   * v1 — no episodes, no runs, no milestones — takes the path below.
   */
  const looksLikeV1 = parsed.version === 1
    || (!parsed.episodes && !parsed.episodeRuns && !parsed.levelMilestones)
  if (!looksLikeV1) {
    const carried = carryForward(parsed, { keepPreferences: true, keepSignals: true, keepRuns: true })
    carried.languageItems = upgradeLanguageItems(carried.languageItems)
    return carried
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
    const legacy = {
      ...emptyItem(),
      status: it.status === 'known' ? 'can_do' : (it.status || 'learning'),
      correct: it.correct || 0,
      incorrect: it.incorrect || 0,
      independentCorrect: it.status === 'known' ? 1 : 0,
      streak: it._streak || 0,
      nextReviewAt: it.nextReviewAt || null,
      lastSeenAt: nowIso(),
    }
    m.languageItems[id] = { ...legacy, learningState: learningStateFromLegacyItem(legacy) }
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
    episodeRuns: mergeEpisodeRuns(model.episodeRuns, stored.episodeRuns),
    learnerFacts: mergeLearnerFacts(model.learnerFacts, stored.learnerFacts),
    episodes: mergeEpisodeState(model.episodes, stored.episodes),
    languageItems: mergeLanguageItems(model.languageItems, stored.languageItems),
    levelMilestones: mergeLevelMilestones(model.levelMilestones, stored.levelMilestones),
  }
}

/*
 * Language items merge monotonically: counters take the higher value and the
 * learning state takes the further-along one.
 *
 * Without this, two copies of the model saving over each other lost whichever
 * item the other one had just recorded — a Garden entry, or the evidence behind
 * it, quietly disappearing.
 *
 * The review date follows the copy with the more recent EVIDENCE, and only falls
 * back to the sooner of the two when neither copy has practised more recently.
 * "Sooner always wins" was wrong on one device: every save merges against what
 * is already in storage, so a freshly reviewed item was immediately handed back
 * its old overdue date and could never leave the review queue. Reading recency
 * first keeps the original intent — an untouched device's due date survives —
 * without letting stale storage undo the attempt that just happened.
 */
export function mergeLanguageItems(mine, theirs) {
  const a = (mine && typeof mine === 'object') ? mine : {}
  const b = (theirs && typeof theirs === 'object') ? theirs : {}
  const out = {}
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[id]
    const y = b[id]
    if (!x || typeof x !== 'object') { if (y && typeof y === 'object') out[id] = y; continue }
    if (!y || typeof y !== 'object') { out[id] = x; continue }
    const maxNum = (k) => Math.max(Number(x[k]) || 0, Number(y[k]) || 0)
    const state = higherLearningState(x.learningState || 'seen', y.learningState || 'seen')
    const soonest = [x.nextReviewAt, y.nextReviewAt].filter(Boolean).sort()[0] || null
    const latestSeen = [x.lastSeenAt, y.lastSeenAt].filter(Boolean).sort().pop() || null
    // whichever copy holds the newest evidence also holds the current schedule
    const fresher = (x.lastSeenAt || '') === (y.lastSeenAt || '')
      ? null
      : ((x.lastSeenAt || '') > (y.lastSeenAt || '') ? x : y)
    const nextReviewAt = (fresher && fresher.nextReviewAt) || soonest
    out[id] = {
      status: state === 'can_use' ? 'can_do' : (x.status === 'new' && y.status === 'new' ? 'new' : 'learning'),
      learningState: state,
      correct: maxNum('correct'),
      incorrect: maxNum('incorrect'),
      independentCorrect: maxNum('independentCorrect'),
      guidedCorrect: maxNum('guidedCorrect'),
      recognisedCorrect: maxNum('recognisedCorrect'),
      streak: maxNum('streak'),
      nextReviewAt,
      lastSeenAt: latestSeen,
    }
  }
  return out
}

/*
 * Runs are merged by id, never summed. If one copy saw a run finish and the
 * other did not, the finished version wins — a completion is a fact, an
 * unfinished snapshot is only the absence of news.
 */
export function mergeEpisodeRuns(mine, theirs) {
  const a = sanitizeEpisodeRuns(mine)
  const b = sanitizeEpisodeRuns(theirs)
  const out = {}
  for (const episodeId of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const byId = new Map()
    for (const run of [...(b[episodeId] || []), ...(a[episodeId] || [])]) {
      const prev = byId.get(run.runId)
      byId.set(run.runId, prev ? { ...prev, ...run, completedAt: run.completedAt || prev.completedAt, rewarded: prev.rewarded || run.rewarded } : run)
    }
    out[episodeId] = [...byId.values()].slice(-RUNS_PER_EPISODE)
  }
  return out
}

export function mergeLearnerFacts(mine, theirs) {
  const byKey = new Map()
  for (const fact of [...sanitizeLearnerFacts(theirs), ...sanitizeLearnerFacts(mine)]) {
    const key = `${fact.type}:${fact.value.toLowerCase()}`
    const prev = byKey.get(key)
    byKey.set(key, prev ? {
      ...fact,
      useCount: Math.max(prev.useCount, fact.useCount),
      confidence: Math.max(prev.confidence, fact.confidence),
      learnedAt: prev.learnedAt || fact.learnedAt,
      lastUsedAt: [prev.lastUsedAt, fact.lastUsedAt].filter(Boolean).sort().at(-1) || null,
    } : fact)
  }
  return [...byKey.values()].slice(-20)
}

/*
 * Episode progress is merged so that a stale snapshot can never un-award an
 * episode or push progress backwards. XP itself is never recomputed here.
 */
export function mergeEpisodeState(mine, theirs) {
  const a = mine || {}
  const b = theirs || {}
  const out = {}
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[id] || {}
    const y = b[id] || {}
    out[id] = {
      ...y, ...x,
      status: x.status === 'completed' || y.status === 'completed' ? 'completed' : (x.status || y.status || 'new'),
      stepIndex: Math.max(Number(x.stepIndex) || 0, Number(y.stepIndex) || 0),
      awarded: Boolean(x.awarded || y.awarded),
    }
  }
  return out
}

export function saveLearnerModel(model) {
  const merged = mergeActivityEvidence(model)
  // keep the caller's own object in step with what was written
  model.activityPreferences = merged.activityPreferences
  model.signalLog = merged.signalLog
  model.recentFormats = merged.recentFormats
  model.episodeRuns = merged.episodeRuns
  model.learnerFacts = merged.learnerFacts
  model.episodes = merged.episodes
  model.languageItems = merged.languageItems
  try { localStorage.setItem(KEY, JSON.stringify({ ...merged, version: MODEL_VERSION })) } catch {}
  return model
}

// ---- review scheduling ----

/*
 * How long a piece of language earns before it comes back.
 *
 * The interval used to stop growing at four days, so language the learner had
 * said unaided ten times in a row still returned every four days, for ever.
 * Across a level that tracks scores of items that is a queue nobody can drain:
 * the day's session offers one review, and roughly fifteen things fall due. The
 * effect was a learner who did every review the app offered and still carried a
 * permanent backlog — and a readiness rule that looked reasonable and could not
 * be reached by playing the product properly.
 *
 * Spacing means the gap widens as the memory holds. The first two steps are
 * unchanged; beyond them each success roughly doubles the rest, up to a month,
 * so nothing is ever dropped for good and mastered language stops competing for
 * the day's single review slot with language that is genuinely slipping.
 */
export const REVIEW_STEPS_DAYS = [2, 4, 8, 16, 30]

/*
 * `owned` is the difference between help and confirmation.
 *
 * A helped success used to mean "tomorrow", always. But every activity a review
 * is made of — choice, fill_blank, word_order — is by design a supported shape,
 * so language the learner already owns could never earn a longer gap: an item
 * answered correctly ten reviews in a row came back the next day, and the day
 * after, for ever. Across a level that is a queue no learner can empty, however
 * diligently they practise.
 *
 * Being helped through language that is still new is a real signal and still
 * means tomorrow. Recognising language you have already produced unaided is
 * confirmation, and confirmation earns the ladder.
 */
export function reviewDelayDays({ correct, independent, streak, owned = false }) {
  if (!correct) return 0
  if (!independent && !owned) return 1
  const step = Math.min(Math.max(Number(streak) || 1, 1), REVIEW_STEPS_DAYS.length) - 1
  return REVIEW_STEPS_DAYS[step]
}

export function scheduleReview(prev, { correct, independent, atMs = Date.now(), owned = null }) {
  const streak = correct ? (prev?.streak || 0) + 1 : 0
  const isOwned = owned === null
    ? (prev?.learningState === 'can_use' || (Number(prev?.independentCorrect) || 0) >= INDEPENDENT_USES_TO_CAN_USE)
    : owned
  return {
    nextReviewAt: new Date(atMs + reviewDelayDays({ correct, independent, streak, owned: isOwned }) * DAY).toISOString(),
    streak,
  }
}

// ---- language items ----

/*
 * How far a single piece of language has travelled.
 *
 * The Memory Garden used to show every granted item at a flat mastery of 0.5,
 * so a sentence the learner had said unaided looked exactly like a word they
 * had once heard someone else say. These four states are the smallest honest
 * distinction:
 *
 *   seen        it appeared — as input, or inside a phrase tracked whole
 *   understood  they picked it out correctly when it mattered
 *   practicing  they produced it with the words in front of them
 *   can_use     they produced it from nothing, more than once
 *
 * The order is monotonic on purpose. Getting something wrong later does not
 * unlearn it; that is what the review schedule is for, and the two axes are
 * deliberately separate.
 */
export const LEARNING_STATES = ['seen', 'understood', 'practicing', 'can_use']
export const LEARNING_STATE_RANK = { seen: 0, understood: 1, practicing: 2, can_use: 3 }
export const INDEPENDENT_USES_TO_CAN_USE = 2

const higherLearningState = (a, b) => {
  const ra = LEARNING_STATE_RANK[a] ?? -1
  const rb = LEARNING_STATE_RANK[b] ?? -1
  return rb > ra ? b : a
}

const emptyItem = () => ({
  status: 'new', learningState: null, correct: 0, incorrect: 0,
  independentCorrect: 0, guidedCorrect: 0, recognisedCorrect: 0,
  streak: 0, nextReviewAt: null, lastSeenAt: null,
})

/*
 * The state an answer can justify on its own. `evidenceKind` comes from the
 * activity format (see scaffolding.js): recognition proves understanding,
 * guided work proves practice, and only unaided open production can reach
 * `can_use` — and only on the second time.
 */
function stateFromEvidence({ evidenceKind, correct, independent, independentCorrect }) {
  if (!correct) return null
  if (evidenceKind === 'recognition') return 'understood'
  if (evidenceKind === 'guided') return 'practicing'
  if (evidenceKind === 'open') {
    if (independent && independentCorrect >= INDEPENDENT_USES_TO_CAN_USE) return 'can_use'
    return independent ? 'practicing' : 'practicing'
  }
  return null
}

/*
 * Record that an item was merely met — granted by an episode, heard in a line,
 * or carried inside a phrase that is tracked as a whole. It enters the Garden
 * and the review schedule leaves it alone; nothing here claims it can be used.
 */
export function recordItemSeen(model, itemId, atMs = Date.now()) {
  if (!itemId) return model
  const prev = model.languageItems[itemId]
  if (prev) {
    model.languageItems[itemId] = { ...prev, learningState: higherLearningState(prev.learningState || 'seen', 'seen'), lastSeenAt: new Date(atMs).toISOString() }
    return model
  }
  model.languageItems[itemId] = { ...emptyItem(), learningState: 'seen', lastSeenAt: new Date(atMs).toISOString() }
  return model
}

export function recordItemAttempt(model, itemId, { correct, independent = false, evidenceKind = 'open', atMs = Date.now() } = {}) {
  const prev = { ...emptyItem(), ...(model.languageItems[itemId] || {}) }
  const correctCount = prev.correct + (correct ? 1 : 0)
  const incorrectCount = prev.incorrect + (correct ? 0 : 1)
  const independentCorrect = prev.independentCorrect + (correct && independent && evidenceKind === 'open' ? 1 : 0)
  const guidedCorrect = prev.guidedCorrect + (correct && evidenceKind === 'guided' ? 1 : 0)
  const recognisedCorrect = prev.recognisedCorrect + (correct && evidenceKind === 'recognition' ? 1 : 0)
  const review = scheduleReview(prev, { correct, independent, atMs })

  // learning state only ever climbs
  const earned = stateFromEvidence({ evidenceKind, correct, independent, independentCorrect })
  const learningState = higherLearningState(prev.learningState || 'seen', earned || 'seen')

  /*
   * `status` is kept for everything that already reads it (review scheduling,
   * the planner, mastery displays). It is now derived from the learning state
   * rather than counted separately, so the two can never disagree.
   */
  const status = learningState === 'can_use' ? 'can_do' : 'learning'

  model.languageItems[itemId] = {
    status, learningState, correct: correctCount, incorrect: incorrectCount,
    independentCorrect, guidedCorrect, recognisedCorrect,
    streak: review.streak, nextReviewAt: review.nextReviewAt, lastSeenAt: new Date(atMs).toISOString(),
  }
  return model
}

/* What the learner can be said to be able to use, for the Garden and audits. */
export const learningStateOf = (model, itemId) => model?.languageItems?.[itemId]?.learningState || null
export const canUseItem = (model, itemId) => learningStateOf(model, itemId) === 'can_use'

// ---- can-do goals ----
export function recordCanDoAttempt(model, canDoId, { success, independent = false, context = null, atMs = Date.now() }) {
  const prev = model.canDo[canDoId] || { status: 'new', attempts: 0, successes: 0, independentSuccesses: 0, contexts: [], lastPracticedAt: null }
  const attempts = prev.attempts + 1
  const successes = prev.successes + (success ? 1 : 0)
  const independentSuccesses = prev.independentSuccesses + (success && independent ? 1 : 0)
  const contexts = context && !prev.contexts.includes(context) && success ? [...prev.contexts, context] : prev.contexts
  // can_do: at least two successes with at least one independent (across contexts)
  let status = 'learning'
  if (successes >= 2 && independentSuccesses >= 1) status = 'can_do'
  else if (attempts > 0) status = 'learning'
  model.canDo[canDoId] = { status, attempts, successes, independentSuccesses, contexts, lastPracticedAt: new Date(atMs).toISOString() }
  return model
}

/*
 * `coreEngineRequirements[3]` (C2's capstone) — several OTHER capabilities'
 * delayed-retrieval evidence, recorded against the SAME task completion.
 * Every earlier level's own completion records evidence for exactly one
 * canDoId (`recordCanDoAttempt` above, called once per episode finish);
 * C2's capstone (`levels/c2/arcs/c2Arc8IntegratedMediation.js`'s `MEDIATE_01`)
 * is the first episode whose one independent step also names SEVEN OTHER
 * capabilities it re-demonstrates unaided (`step.delayedRetrievalChecks`,
 * matching `c2EvaluationContracts.js`'s `C2_CAPSTONE_DELAYED_RETRIEVAL_CHECKS`
 * exactly), and none of those seven capabilities' own dedicated arc-level
 * completion runs again inside this same task.
 *
 * Deliberately does NOT touch `attempts`/`successes`/`independentSuccesses` —
 * this canDo was not actually practiced end-to-end in this task the way its
 * own arc's episode practices it; recording a fabricated attempt/success
 * here would silently inflate mastery evidence for a capability this task
 * only warms up, not on masters from scratch. `delayedRetrievalAt` is
 * purely evidentiary bookkeeping (capped at the last 10 timestamps, the
 * same bound `recurringErrors` above already uses), additive to whatever
 * canDo state already exists — including none at all, if this is reached
 * before the capability's own arc.
 *
 * Schema change is additive only: every existing single-capability episode
 * (every level below C2) never calls this, so their own `model.canDo`
 * entries never gain a `delayedRetrievalAt` field and keep recording
 * identically to before.
 */
export function recordDelayedRetrievalEvidence(model, canDoIds, { atMs = Date.now() } = {}) {
  const ids = Array.isArray(canDoIds) ? canDoIds : []
  for (const canDoId of ids) {
    if (!canDoId) continue
    const prev = model.canDo[canDoId] || { status: 'new', attempts: 0, successes: 0, independentSuccesses: 0, contexts: [], lastPracticedAt: null }
    const delayedRetrievalAt = [new Date(atMs).toISOString(), ...(prev.delayedRetrievalAt || [])].slice(0, 10)
    model.canDo[canDoId] = { ...prev, delayedRetrievalAt }
  }
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

/* ---- episode runs and learner facts (v5) ---- */

export const RUN_MODES = ['first_run', 'resume', 'replay', 'review', 'branch_replay']
export const RUN_SOURCES = ['practice', 'daily_session', 'memory_garden', 'home']
const str = (v, max) => (typeof v === 'string' && v.length > 0 && v.length <= max ? v : null)

// One run, or null. A run that lost its episode id is meaningless and dropped.
export function sanitizeRun(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const episodeId = str(raw.episodeId, 60)
  const runId = str(raw.runId, 80)
  if (!episodeId || !runId) return null
  const num = (v) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.min(Math.round(Number(v)), 9999) : 0)
  return {
    runId,
    episodeId,
    mode: RUN_MODES.includes(raw.mode) ? raw.mode : 'replay',
    source: RUN_SOURCES.includes(raw.source) ? raw.source : 'practice',
    branchId: str(raw.branchId, 30),
    startedAt: str(raw.startedAt, 40),
    completedAt: str(raw.completedAt, 40),
    independentEvidence: Boolean(raw.independentEvidence),
    assistanceUsed: num(raw.assistanceUsed),
    retriedSteps: num(raw.retriedSteps),
    formatsUsed: Array.isArray(raw.formatsUsed)
      ? [...new Set(raw.formatsUsed.filter(f => ACTIVITY_FORMATS.includes(f)))].slice(0, 10) : [],
    rewarded: Boolean(raw.rewarded),
    /*
     * How much help this run offers, and why. It lives on the run so a resumed
     * attempt restores exactly what it had rather than re-deriving from a model
     * that has changed since — and so practising the same episode again starts
     * from its own reading of the evidence.
     */
    scaffold: sanitizeScaffold(raw.scaffold),
  }
}

const SCAFFOLD_LEVELS = ['high', 'medium', 'low']
function sanitizeScaffold(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const initialLevel = SCAFFOLD_LEVELS.includes(raw.initialLevel) ? raw.initialLevel : null
  const currentLevel = SCAFFOLD_LEVELS.includes(raw.currentLevel) ? raw.currentLevel : initialLevel
  if (!initialLevel || !currentLevel) return null
  const num = (v) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.min(Math.round(Number(v)), 99) : 0)
  return {
    initialLevel,
    currentLevel,
    // reason codes are short internal labels; anything unexpected is dropped
    reasonCodes: Array.isArray(raw.reasonCodes)
      ? raw.reasonCodes.filter(c => typeof c === 'string' && /^[a-z_]{3,40}$/.test(c)).slice(0, 12) : [],
    independentStreak: num(raw.independentStreak),
    assistedStreak: num(raw.assistedStreak),
    retryPressure: num(raw.retryPressure),
  }
}

export function sanitizeEpisodeRuns(raw) {
  const out = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [episodeId, list] of Object.entries(raw)) {
    if (!str(episodeId, 60) || !Array.isArray(list)) continue
    const seen = new Set()
    const runs = []
    for (const item of list) {
      const run = sanitizeRun(item)
      if (!run || run.episodeId !== episodeId || seen.has(run.runId)) continue
      seen.add(run.runId)
      runs.push(run)
    }
    if (runs.length) out[episodeId] = runs.slice(-RUNS_PER_EPISODE)
  }
  return out
}

/*
 * `place` is where the learner is FROM; `work_or_study` is where their days
 * happen; `usual_time` is when their day starts. Separate types rather than one,
 * because a consumer asking "where are you from" must never be handed an office
 * and a consumer proposing a meeting must never be handed a hometown — the
 * blueprint keeps them apart too, and lists all three under the slots an episode
 * may safely personalise.
 *
 * Adding a type needs no migration: an older model simply has no facts of it, and
 * `sanitizeLearnerFacts` has always dropped types it does not know.
 */
export const FACT_TYPES = ['like', 'dislike', 'place', 'work_or_study', 'usual_time']
export const FACT_MAX_LENGTH = 40

// A fact is only worth keeping if it is short, printable and not a sentence.
export function normalizeFactValue(raw) {
  const value = String(raw ?? '').replace(/\s+/g, ' ').trim()
  if (!value || value.length > FACT_MAX_LENGTH) return null
  if (value.split(' ').length > 4) return null
  if (!/\p{L}/u.test(value)) return null
  return value
}

export function sanitizeLearnerFacts(raw) {
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  const out = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const value = normalizeFactValue(item.value)
    if (!value || !FACT_TYPES.includes(item.type)) continue
    const key = `${item.type}:${value.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    const confidence = Number(item.confidence)
    out.push({
      type: item.type,
      value,
      sourceEpisodeId: str(item.sourceEpisodeId, 60),
      learnedAt: str(item.learnedAt, 40),
      lastUsedAt: str(item.lastUsedAt, 40),
      useCount: Number.isFinite(Number(item.useCount)) && Number(item.useCount) >= 0 ? Math.min(Math.round(Number(item.useCount)), 999) : 0,
      confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.5,
    })
  }
  return out.slice(-20)
}

// Rescue what older versions stored loosely, so nobody has to say it twice.
function factsFromLegacy(facts) {
  const out = []
  const like = normalizeFactValue(facts?.likes)
  if (like) out.push({ type: 'like', value: like, sourceEpisodeId: 'what_you_like', learnedAt: null, lastUsedAt: null, useCount: 0, confidence: 0.6 })
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

/*
 * What is due, most overdue first.
 *
 * The order used to be whatever order the items happened to be stored in, and
 * the daily session takes the front of the queue — so the first words the
 * learner ever met were reviewed again and again while everything that came due
 * later starved. A queue that never reaches its own tail is not a queue.
 */
export function getDueReviews(model, atMs = Date.now()) {
  const due = []
  for (const [id, it] of Object.entries(model.languageItems)) {
    if (!it.nextReviewAt || it.status === 'new') continue
    const at = new Date(it.nextReviewAt).getTime()
    if (Number.isFinite(at) && at <= atMs) due.push([id, at])
  }
  return due.sort((a, b) => a[1] - b[1]).map(([id]) => id)
}
