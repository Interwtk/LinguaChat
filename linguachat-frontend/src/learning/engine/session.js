/*
 * session — the adaptive daily session.
 *
 * The learner should never arrive and have to decide what to study. This module
 * assembles a small, deterministic plan of blocks from what the learner model
 * already knows: overdue reviews, an unfinished episode, a recent recurring
 * error, the next unlocked episode, and a fragile can-do.
 *
 * It is deliberately NOT AI-driven: the plan is pure, reproducible and testable.
 * A plan is built once per day+duration and then persisted, so remounting or
 * reloading never silently regenerates a different session.
 *
 * Duration is a promise, not a countdown: it caps how many blocks are planned,
 * it never interrupts an activity in progress.
 */
import { getDueReviews, getEpisodeState } from './learnerModel.js'
import { isEpisodeUnlocked } from './planner.js'
import { selectEquivalentActivityFormat, BLOCK_CANDIDATES } from './formatChoice.js'
import { getInterestContext, getLearnerInterests } from './interests.js'
import { getFactContext } from './learnerFacts.js'

export const SESSION_KEY = 'lc2-daily-session-v1'
export const SESSION_VERSION = 1

export const DURATION_MODES = {
  quick: { minutes: 5, maxBlocks: 3 },
  standard: { minutes: 10, maxBlocks: 4 },
  deep: { minutes: 18, maxBlocks: 5 },
}
export const DURATION_ORDER = ['quick', 'standard', 'deep']
export const isDurationMode = (mode) => Object.prototype.hasOwnProperty.call(DURATION_MODES, mode)

// Local calendar day — sessions are per day, not per rolling 24h.
export function dayKeyFor(atMs = Date.now()) {
  const d = new Date(atMs)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/* ---------- what a small practice block should ask for ---------- */
const ITEM_KIND = {
  hi: 'introduction', hello: 'introduction', im: 'introduction', im_pattern: 'introduction',
  whats_your_name: 'ask_name', whats_your_pattern: 'ask_name', my_name_is: 'introduction', name: 'introduction',
  nice_to_meet: 'nice_to_meet',
  how_are_you: 'ask_wellbeing', im_good: 'answer_wellbeing', good: 'answer_wellbeing',
  fine: 'answer_wellbeing', tired: 'answer_wellbeing', im_feeling_pattern: 'answer_wellbeing',
  and_you: 'reciprocal_question', what_about_you: 'reciprocal_question',
  where_from: 'ask_origin', im_from: 'answer_origin', from: 'answer_origin', im_from_pattern: 'answer_origin',
  // third arc: preferences, wants and needs
  like: 'express_like', i_like: 'express_like', i_like_pattern: 'express_like',
  music: 'express_like', games: 'express_like',
  i_dont_like: 'express_dislike',
  what_do_you_like: 'ask_preference', do_you_like: 'ask_preference',
  want: 'express_want', i_want: 'express_want', i_want_pattern: 'express_want',
  need: 'express_need', i_need: 'express_need', help: 'express_need',
  do_you_want: 'ask_want',
  yes_please: 'accept_offer', please: 'accept_offer',
  no_thank_you: 'decline_offer',
}
const ERROR_KIND = {
  missing_copula: 'introduction',
  missing_name: 'introduction',
  greeting_only: 'introduction',
  no_intro: 'introduction',
  question_order: 'ask_name',
  no_question: 'ask_name',
  missing_close: 'nice_to_meet',
  missing_auxiliary: 'ask_origin',
  missing_from: 'answer_origin',
  no_answer: 'answer_wellbeing',
  incomplete_turn: 'full_intro_conversation',
  // third arc
  missing_object: 'express_like',
  missing_verb: 'express_want',
  missing_negation: 'express_dislike',
  no_preference: 'express_like',
  no_request: 'express_want',
}
const CANDO_KIND = {
  introduce_self: 'introduction',
  ask_name: 'ask_name',
  full_greeting: 'nice_to_meet',
  ask_wellbeing: 'ask_wellbeing',
  ask_origin: 'ask_origin',
  full_conversation: 'full_intro_conversation',
  express_preferences: 'express_like',
  express_needs: 'express_want',
  make_plan: 'simple_plan_conversation',
}

export const practiceKindForItem = (id) => ITEM_KIND[id] || null
export const practiceKindForError = (errorType) => ERROR_KIND[errorType] || null
export const practiceKindForCanDo = (canDoId) => CANDO_KIND[canDoId] || null

/* ---------- plan assembly ---------- */

/*
 * The format for a secondary block. The objective and the amount of support
 * come first; preference only ever decides between formats that are already
 * acceptable for both. `scaffold` is the learner's weakest current support
 * level, so a struggling learner is never handed an unaided format for variety.
 */
function formatFor(type, { model, objective, scaffold, durationMode, seed, requiredPractice = null }) {
  return selectEquivalentActivityFormat({
    objective,
    requiredPractice,
    candidates: BLOCK_CANDIDATES[type] || [],
    learnerModel: model,
    scaffold,
    durationMode,
    seed,
  })
}

// The support level to plan with: if any goal is still fragile, plan carefully.
function planningScaffold(model) {
  const levels = Object.values(model.scaffoldByEpisode || {})
  if (levels.includes('high')) return 'high'
  if (levels.includes('medium')) return 'medium'
  return levels.length ? 'low' : 'high'
}

function reviewBlock(model, atMs, ctx) {
  const due = getDueReviews(model, atMs).filter(id => practiceKindForItem(id))
  if (!due.length) return null
  const itemId = due[0]
  const objective = practiceKindForItem(itemId)
  return {
    id: `review:${itemId}`, type: 'review', source: 'due_review',
    objective, estimatedMinutes: 1,
    format: formatFor('review', { ...ctx, objective, seed: `${ctx.seed}:review:${itemId}` }),
    payload: { itemId, itemIds: due.slice(0, 4) },
  }
}

function mainEpisodeBlock(model, arc) {
  const inProgress = arc.find(ep => getEpisodeState(model, ep.id).status === 'in_progress' && isEpisodeUnlocked(model, ep))
  if (inProgress) {
    return {
      id: `continue:${inProgress.id}`, type: 'continue_episode', source: 'in_progress',
      objective: inProgress.canDoId, estimatedMinutes: Math.max(3, (inProgress.estimatedMinutes || 6) - 2),
      payload: { episodeId: inProgress.id },
    }
  }
  const next = arc.find(ep => getEpisodeState(model, ep.id).status !== 'completed' && isEpisodeUnlocked(model, ep))
  if (next) {
    return {
      id: `start:${next.id}`, type: 'start_episode', source: 'next_unlocked',
      objective: next.canDoId, estimatedMinutes: next.estimatedMinutes || 6,
      payload: { episodeId: next.id },
    }
  }
  return null
}

function targetedRetryBlock(model, ctx) {
  // Only a genuinely repeated error is worth a dedicated block.
  const err = (model.recurringErrors || []).find(e => e && e.count >= 2 && practiceKindForError(e.errorType))
  if (!err) return null
  const objective = practiceKindForError(err.errorType)
  /*
   * A word-order mistake has to be practised as word order — that is the skill
   * that failed. Preference may not route around it.
   */
  const requiredPractice = err.errorType === 'question_order' ? 'word_order' : null
  return {
    id: `retry:${err.errorType}`, type: 'targeted_retry', source: 'recurring_error',
    objective, estimatedMinutes: 1,
    format: formatFor('targeted_retry', { ...ctx, objective, requiredPractice, seed: `${ctx.seed}:retry:${err.errorType}` }),
    payload: { errorType: err.errorType },
  }
}

function fragileSkillBlock(model, ctx) {
  const entry = Object.entries(model.canDo || {})
    .find(([id, c]) => c && c.status === 'learning' && practiceKindForCanDo(id))
  if (!entry) return null
  const [canDoId] = entry
  const objective = practiceKindForCanDo(canDoId)
  return {
    id: `recall:${canDoId}`, type: 'recall', source: 'fragile_skill',
    objective, estimatedMinutes: 2,
    format: formatFor('recall', { ...ctx, objective, seed: `${ctx.seed}:recall:${canDoId}` }),
    payload: { canDoId },
  }
}

/*
 * The one block preference is really allowed to shape: an extra turn in a deep
 * session, reusing something the learner already met, in the way that suits
 * them. It is additional practice — it never replaces anything required.
 */
function extraPracticeBlock(model, ctx) {
  const entry = Object.entries(model.canDo || {}).find(([id, c]) => c && practiceKindForCanDo(id))
  if (!entry) return null
  const objective = practiceKindForCanDo(entry[0])
  return {
    id: `extra:${entry[0]}`, type: 'extra_practice', source: 'preference',
    objective, estimatedMinutes: 2,
    format: formatFor('extra_practice', { ...ctx, objective, seed: `${ctx.seed}:extra:${entry[0]}` }),
    payload: { canDoId: entry[0] },
  }
}

const freeChatBlock = () => ({
  id: 'free_chat', type: 'free_chat_option', source: 'variety',
  objective: null, estimatedMinutes: 3, payload: {},
})

const completionBlock = () => ({
  id: 'completion', type: 'session_completion', source: 'system',
  objective: null, estimatedMinutes: 0, payload: {},
})

/*
 * Priority (see the sprint brief): overdue review, unfinished episode, recurring
 * error, next episode, fragile skill, optional free chat. Not every session gets
 * every block — the duration decides how much fits, so a session ends feeling
 * finished rather than exhausting.
 */
export function buildSessionPlan(model, arc, { durationMode = 'standard', atMs = Date.now(), interests = [], learnerKey = 'guest', dismissedFactIds = [] } = {}) {
  const mode = isDurationMode(durationMode) ? durationMode : 'standard'
  const { minutes, maxBlocks } = DURATION_MODES[mode]
  const dayKey = dayKeyFor(atMs)
  const ctx = { model, scaffold: planningScaffold(model), durationMode: mode, seed: `${learnerKey}:${dayKey}` }

  const review = reviewBlock(model, atMs, ctx)
  const main = mainEpisodeBlock(model, arc)
  const retry = targetedRetryBlock(model, ctx)
  const fragile = fragileSkillBlock(model, ctx)

  const blocks = []
  const room = () => blocks.length < maxBlocks - 1   // always reserve the completion slot

  // A short recovery first — it warms up and connects to previous days.
  if (review && room()) blocks.push(review)
  // Exactly one main goal per session.
  if (main && room()) blocks.push(main)
  if (mode !== 'quick') {
    if (retry && room()) blocks.push(retry)
    if (mode === 'deep' && fragile && room()) blocks.push(fragile)
    // Deep sessions have room for one extra turn shaped by preference.
    if (mode === 'deep' && !fragile && room()) {
      const extra = extraPracticeBlock(model, ctx)
      if (extra) blocks.push(extra)
    }
  }
  // Nothing scheduled at all → offer conversation rather than an empty session.
  if (!blocks.length) blocks.push(freeChatBlock())
  else if (mode === 'deep' && room()) blocks.push(freeChatBlock())

  blocks.push(completionBlock())

  /*
   * The subject matter for today, pinned into the plan. Home can promise it and
   * the episode uses it, so both always agree — and changing interests midway
   * cannot swap the topic of a session already under way.
   */
  const mainEpisodeId = main?.payload?.episodeId || null
  const topicSeed = `${learnerKey}:${mainEpisodeId || dayKey}`
  const topicCtx = getInterestContext(getLearnerInterests(interests), topicSeed)
  /*
   * Something the learner actually told Lingua beats a box they ticked at
   * onboarding — but only occasionally, and never when today is already about
   * it. With nothing suitable to remember, the interest (or a plain everyday
   * situation) is a perfectly good promise.
   */
  const factCtx = getFactContext(model, { interestContext: topicCtx, seed: `${topicSeed}:fact`, atMs, dismissedIds: dismissedFactIds })

  const estimated = blocks.reduce((sum, b) => sum + (b.estimatedMinutes || 0), 0)
  return {
    version: SESSION_VERSION,
    id: `${dayKeyFor(atMs)}:${mode}`,
    dayKey: dayKeyFor(atMs),
    createdAt: new Date(atMs).toISOString(),
    durationMode: mode,
    // an approximate promise, never a countdown
    estimatedMinutes: Math.max(1, Math.min(estimated || minutes, minutes + 8)),
    topic: {
      source: factCtx.source,
      interestId: topicCtx.interestId,
      labelKey: topicCtx.labelKey,
      // what the learner said, in their own words — only when it is a fact
      factValue: factCtx.source === 'fact' ? factCtx.value : null,
      episodeId: mainEpisodeId,
    },
    status: 'planned',
    currentBlockIndex: 0,
    awarded: false,
    blocks,
  }
}

/* ---------- persistence (safe against corruption and old versions) ---------- */
export function normalizeSession(parsed, arc) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
  if (parsed.version !== SESSION_VERSION) return null
  if (!Array.isArray(parsed.blocks) || parsed.blocks.length === 0) return null
  if (!isDurationMode(parsed.durationMode)) return null
  if (!['planned', 'active', 'completed'].includes(parsed.status)) return null
  // Drop a stored plan that points at an episode that no longer exists.
  if (arc) {
    const ids = new Set(arc.map(e => e.id))
    const broken = parsed.blocks.some(b => b?.payload?.episodeId && !ids.has(b.payload.episodeId))
    if (broken) return null
  }
  const index = Number(parsed.currentBlockIndex)
  const currentBlockIndex = Number.isFinite(index) ? Math.min(Math.max(0, index), parsed.blocks.length - 1) : 0
  // A session stored before topics existed is still perfectly valid; it simply
  // has no pinned subject matter and Home falls back to the neutral line.
  const rawTopic = parsed.topic && typeof parsed.topic === 'object' && !Array.isArray(parsed.topic) ? parsed.topic : {}
  const factValue = typeof rawTopic.factValue === 'string' && rawTopic.factValue.length <= 40 ? rawTopic.factValue : null
  const topic = {
    source: ['fact', 'interest', 'neutral'].includes(rawTopic.source) ? rawTopic.source : (rawTopic.interestId ? 'interest' : 'neutral'),
    interestId: rawTopic.interestId ?? null,
    labelKey: rawTopic.labelKey ?? null,
    factValue,
    episodeId: rawTopic.episodeId ?? null,
  }
  return { ...parsed, currentBlockIndex, topic, awarded: Boolean(parsed.awarded) }
}

export function loadSession(arc) {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return normalizeSession(JSON.parse(raw), arc)
  } catch { return null }
}

export function saveSession(session) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch { /* storage full/blocked */ }
  return session
}

export function clearSession() {
  try { localStorage.removeItem(SESSION_KEY) } catch { /* noop */ }
}

/*
 * The stable entry point. Returns the stored session for today when there is
 * one, so a reload or a remount never rebuilds a different plan. A new plan is
 * only built for a new day, or when the learner changes duration BEFORE
 * starting.
 */
export function getOrCreateSession(model, arc, { durationMode = 'standard', atMs = Date.now(), stored = undefined, interests = [], learnerKey = 'guest', dismissedFactIds = [] } = {}) {
  const existing = stored === undefined ? loadSession(arc) : normalizeSession(stored, arc)
  const today = dayKeyFor(atMs)
  if (existing && existing.dayKey === today) {
    // a started or finished session is kept exactly as it is — including its
    // topic, so changing interests mid-session never rewrites today's promise
    if (existing.status !== 'planned') return existing
    if (existing.durationMode === durationMode) return existing
  }
  return buildSessionPlan(model, arc, { durationMode, atMs, interests, learnerKey, dismissedFactIds })
}

export function startSession(session) {
  if (!session || session.status === 'completed') return session
  return { ...session, status: 'active' }
}

export function currentBlock(session) {
  if (!session) return null
  return session.blocks[session.currentBlockIndex] || null
}

// Advance past the current block. Completing the last block completes the
// session. Never moves backwards, so a replayed block cannot rewind progress.
export function advanceBlock(session) {
  if (!session) return session
  const last = session.blocks.length - 1
  if (session.currentBlockIndex >= last) {
    return { ...session, currentBlockIndex: last, status: 'completed' }
  }
  return { ...session, currentBlockIndex: session.currentBlockIndex + 1, status: 'active' }
}

// Idempotent: a session may only ever be awarded once, no matter how many times
// completion is reached (double tap, Back, reload).
export function completeSession(session) {
  if (!session) return { session, awarded: false }
  if (session.awarded) return { session: { ...session, status: 'completed' }, awarded: false }
  return { session: { ...session, status: 'completed', awarded: true }, awarded: true }
}

export function sessionProgress(session) {
  if (!session) return { done: 0, total: 0 }
  const total = Math.max(1, session.blocks.length - 1)   // completion is not a task
  const done = Math.min(session.currentBlockIndex, total)
  return { done, total }
}

// The one capability this session is really about — used by Home to promise
// something meaningful instead of listing internal blocks.
export function sessionHeadline(session) {
  if (!session) return null
  const main = session.blocks.find(b => b.type === 'continue_episode' || b.type === 'start_episode')
  if (main) return { type: main.type, episodeId: main.payload.episodeId, canDoId: main.objective }
  const any = session.blocks.find(b => b.type !== 'session_completion')
  return any ? { type: any.type, episodeId: null, canDoId: any.objective } : null
}

export const sessionHasReview = (session) =>
  Boolean(session && session.blocks.some(b => b.type === 'review' || b.type === 'targeted_retry'))
