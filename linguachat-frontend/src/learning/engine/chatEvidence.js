import { chooseTeaching, evidenceSummary } from './teachingPolicy.js'

/*
 * The bridge between the chat and the teaching policy (P3).
 *
 * The chat tutor finds a few error families and, since P3, notices a few
 * correct uses. What a turn MEANS for learning depends on things only the
 * learner's device knows: was this right after a correction? was the answer
 * on screen? was it typed from a suggestion? is it a later day? a new verb?
 * This module decides that, records it compactly, and derives what Lingua
 * may do next. It is deliberately NOT a second engine: method choice across
 * days is `teachingPolicy.chooseTeaching` run over this record, and spacing
 * follows the learner model's review steps.
 *
 * CONTRACT
 *   - A chat turn is never curriculum evidence. Every rule the chat can see
 *     belongs to a closed level or to no blueprint pattern (CHAT_RULES), so an
 *     observation can describe a difficulty and its recovery, and never moves
 *     a level, a can-do, readiness, scaffolding or `recurringErrors`.
 *   - Stored: rule ids, kinds, provenance, a time, and the English base verb
 *     (or noun) involved — a closed set the tutor itself supplied. Never the
 *     learner's sentence.
 *   - Idempotent (entry ids), bounded (CHAT_EVIDENCE_LIMIT), merged across
 *     tabs by union, and reversible: forgetting a rule writes a tombstone so
 *     another tab's copy cannot bring it back.
 */

/* What each chat rule is, by the blueprints (docs/curriculum/blueprints). */
export const CHAT_RULES = Object.freeze({
  past_irregular: { capability: 'simple_past_irregular_pattern', level: 'A2', curricular: false },
  past_marker: { capability: 'past_time_expression_pattern', level: 'A2', curricular: false },
  // "Heard throughout A1, produced in A2" — excluded from A1 by name (a1-blueprint).
  third_person: { capability: 'third_person_s_productive', level: 'A2', curricular: false },
  // a/an alternation is no blueprint pattern; Pre-A1's `its_a_pattern` only uses "a".
  article: { capability: null, level: null, curricular: false },
})

export const OBSERVATION_KINDS = Object.freeze([
  'error',            // a rule found a real error
  'ambiguous',        // a rule fired with low confidence
  'accepted',         // a correct form under a stated criterion, with no history to judge
  'assisted',         // correct, but typed from a suggestion Lingua offered
  'copied',           // the correction Lingua had just shown, typed back
  'recently_modeled', // correct minutes after being corrected on it: exposure, not memory
  'retrieval',        // correct on a later day: prompted, or the same verb unprompted
  'retrieval_failed', // a later-day retrieval attempt that missed
  'transfer',         // correct on a later day with a verb never corrected or practised
  'prompted',         // Lingua offered a delayed retrieval (bookkeeping, not evidence)
])
export const TURN_KINDS = Object.freeze(['error', 'ambiguous', 'accepted', 'assisted', 'copied', 'recently_modeled',
  'retrieval', 'retrieval_failed', 'transfer', 'not_evaluable', 'insufficient'])
export const PROVENANCES = Object.freeze(['free_chat', 'retrieval_prompt', 'mission', 'episode', 'review'])

export const CHAT_EVIDENCE_LIMIT = 120
const RECENT_MS = 10 * 60 * 1000
const DAY_MS = 86400000
// The learner model's spacing (REVIEW_STEPS_DAYS), by successes since the last error.
const SPACING_DAYS = [1, 3, 7, 14]
const STRATEGIES = ['brief_explanation', 'contrast_example', 'guided_retrieval']
const NOT_EVIDENCE = new Set(['assisted', 'copied', 'recently_modeled', 'accepted', 'prompted'])
const DELAYED_SUCCESS = new Set(['retrieval', 'transfer'])

const dayKey = at => new Date(at).toISOString().slice(0, 10)
const words = text => String(text || '').toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || []
const norm = text => words(text).join(' ')

export function sanitizeChatEvidence(raw) {
  return (Array.isArray(raw) ? raw : []).filter(x => x && typeof x.id === 'string' && x.id.length <= 120
    && CHAT_RULES[x.rule] && OBSERVATION_KINDS.includes(x.kind) && Number.isFinite(x.at)
    && PROVENANCES.includes(x.provenance)
    && (x.base == null || (typeof x.base === 'string' && /^[a-z]{1,20}$/.test(x.base)))
    && (x.strategy == null || STRATEGIES.includes(x.strategy)))
    .map(({ id, at, rule, kind, provenance, base = null, strategy = null }) => ({ id, at, rule, kind, provenance, base, strategy }))
    .sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(-CHAT_EVIDENCE_LIMIT)
}

export function sanitizeForgotten(raw) {
  const out = {}
  for (const [rule, at] of Object.entries(raw && typeof raw === 'object' ? raw : {})) {
    if (CHAT_RULES[rule] && Number.isFinite(at)) out[rule] = at
  }
  return out
}

const visible = (entries, forgotten) => entries.filter(x => !(forgotten[x.rule] >= x.at))

/* Union of two copies, minus anything either copy has forgotten. */
export function mergeChatEvidence(mine, theirs, myForgotten = {}, theirForgotten = {}) {
  const forgotten = sanitizeForgotten(myForgotten)
  for (const [rule, at] of Object.entries(sanitizeForgotten(theirForgotten))) if (!(forgotten[rule] >= at)) forgotten[rule] = at
  const byId = new Map([...sanitizeChatEvidence(theirs), ...sanitizeChatEvidence(mine)].map(x => [x.id, x]))
  return { chatEvidence: sanitizeChatEvidence(visible([...byId.values()], forgotten)), chatForgotten: forgotten }
}

function ruleHistory(model, rule, beforeAt = Infinity) {
  return visible(sanitizeChatEvidence(model?.chatEvidence), sanitizeForgotten(model?.chatForgotten))
    .filter(x => x.rule === rule && x.at < beforeAt)
}

/*
 * What one chat turn means. Pure: the same inputs always give the same answer.
 *
 * @param turnId     the learner message id (makes recording idempotent)
 * @param analysis   the tutor's own report: verdict, findings, uses, retrieval
 * @param previous   the Lingua message just before this turn: its correction
 *                   and the retrieval it offered, if any
 * @param assisted   the learner sent a suggestion Lingua had offered
 */
export function classifyChatTurn({ turnId, at, message, analysis, provenance = 'free_chat', assisted = false, previous = null, model = null }) {
  if (!analysis || typeof analysis !== 'object') return { kind: 'not_evaluable', entries: [] }
  const entries = []
  const msgWords = words(message)
  // P5: the evaluator may PROPOSE that the turn was a copy or assisted; that
  // only ever lowers a kind (chatAnalysis.safeAnalysis keeps nothing else).
  const proposedCopy = analysis.proposed === 'copied'
  assisted = assisted || analysis.proposed === 'assisted' || proposedCopy
  const pending = previous?.retrieval && CHAT_RULES[previous.retrieval.rule] ? previous.retrieval : null

  // 1) The answer to a delayed retrieval Lingua offered.
  if (pending) {
    const hit = msgWords.includes(String(pending.expected).toLowerCase())
    const missed = !hit && ((analysis.findings || []).some(f => f.rule === pending.rule) || msgWords.length <= 3)
    if (hit || missed) {
      entries.push({ id: `${turnId}:retrieval:${pending.rule}`, at, rule: pending.rule, provenance: 'retrieval_prompt',
        kind: hit ? (assisted ? 'assisted' : 'retrieval') : 'retrieval_failed', base: pending.base || null, strategy: null })
    }
  }

  // 2) Errors the tutor found.
  ;(analysis.findings || []).forEach((f, i) => {
    if (!CHAT_RULES[f.rule] || (pending && f.rule === pending.rule)) return
    entries.push({ id: `${turnId}:error:${f.rule}:${i}`, at, rule: f.rule, provenance,
      kind: f.confidence === 'low' ? 'ambiguous' : 'error',
      base: /^[a-z]{1,20}$/.test(f.base || '') ? f.base : null,
      strategy: i === 0 && STRATEGIES.includes(analysis.strategy) ? analysis.strategy : null })
  })

  // 3) Correct uses — what they are worth depends on when and how.
  const correctionText = norm(previous?.correction)
  ;(analysis.uses || []).forEach((u, i) => {
    if (!CHAT_RULES[u.rule] || (pending && u.rule === pending.rule)) return
    const history = ruleHistory(model, u.rule, at)
    const lastError = [...history].reverse().find(x => x.kind === 'error' || x.kind === 'retrieval_failed')
    const knownBases = new Set(history.map(x => x.base).filter(Boolean))
    let kind
    if (proposedCopy || (correctionText && (norm(message) === correctionText || correctionText.includes(norm(message))))) kind = 'copied'
    else if (assisted) kind = 'assisted'
    else if (provenance !== 'free_chat') kind = 'accepted'
    else if (!lastError) kind = 'accepted'
    else if (at - lastError.at < RECENT_MS || correctionText.split(' ').includes(u.form)) kind = 'recently_modeled'
    else if (dayKey(at) === dayKey(lastError.at)) kind = 'accepted'
    else kind = knownBases.has(u.base) ? 'retrieval' : 'transfer'
    entries.push({ id: `${turnId}:use:${u.rule}:${i}`, at, rule: u.rule, provenance, kind,
      base: /^[a-z]{1,20}$/.test(u.base || '') ? u.base : null, strategy: null })
  })

  // 4) Bookkeeping: Lingua offered a retrieval in this reply.
  if (analysis.retrieval && CHAT_RULES[analysis.retrieval.rule]) {
    entries.push({ id: `${turnId}:prompted:${analysis.retrieval.rule}`, at: at + 1, rule: analysis.retrieval.rule,
      provenance: 'retrieval_prompt', kind: 'prompted', base: analysis.retrieval.base || null, strategy: null })
  }

  const order = ['error', 'retrieval_failed', 'ambiguous', 'transfer', 'retrieval', 'copied', 'recently_modeled', 'assisted', 'accepted']
  const kind = order.find(k => entries.some(e => e.kind === k))
    || (['insufficient', 'not_english', 'translation'].includes(analysis.verdict) ? 'not_evaluable' : 'insufficient')
  return { kind, entries }
}

/* Add a classified turn to the model. Same turn twice → no change. */
export function recordChatTurn(model, classification) {
  if (!model || !classification?.entries?.length) return false
  const before = sanitizeChatEvidence(model.chatEvidence)
  const ids = new Set(before.map(x => x.id))
  const fresh = classification.entries.filter(x => !ids.has(x.id))
  if (!fresh.length) return false
  const forgotten = sanitizeForgotten(model.chatForgotten)
  model.chatEvidence = sanitizeChatEvidence(visible([...before, ...fresh], forgotten))
  return true
}

/* Forget a rule entirely (the learner asked, or a reset of that memory). */
export function forgetChatRule(model, rule, atMs = Date.now()) {
  if (!model || !CHAT_RULES[rule]) return false
  model.chatForgotten = { ...sanitizeForgotten(model.chatForgotten), [rule]: atMs }
  model.chatEvidence = sanitizeChatEvidence(model.chatEvidence).filter(x => x.rule !== rule || x.at > atMs)
  return true
}

/*
 * The chat record as teaching observations, so `chooseTeaching` judges the
 * explanation strategies exactly as it judges every other method: by later,
 * independent attempts — never by what happened minutes after a correction.
 */
function asTeachingHistory(entries, rule) {
  let strategy = null
  const out = []
  for (const x of entries) {
    if (x.strategy) strategy = x.strategy
    if (!strategy || x.kind === 'prompted' || x.kind === 'accepted' || x.kind === 'ambiguous') continue
    const probe = ['error', 'retrieval', 'retrieval_failed', 'transfer'].includes(x.kind)
    out.push({ id: x.id, capability: `chat:${rule}`, format: 'chat', instruction: x.strategy || strategy,
      session: dayKey(x.at), at: x.at, success: probe ? DELAYED_SUCCESS.has(x.kind) : true,
      independent: probe, assisted: !probe, retried: false })
  }
  return out
}

/*
 * Per rule the learner had difficulty with: what is known, and what Lingua
 * may do next. Statuses never say "mastered": `holding` means two later-day
 * successes since the last error, in chat only, and still counts for nothing
 * in the curriculum.
 */
export function chatDifficulties(model, atMs = Date.now()) {
  const entries = visible(sanitizeChatEvidence(model?.chatEvidence), sanitizeForgotten(model?.chatForgotten))
    .filter(x => x.at <= atMs)
  const out = []
  for (const rule of Object.keys(CHAT_RULES)) {
    const own = entries.filter(x => x.rule === rule)
    const errors = own.filter(x => x.kind === 'error' || x.kind === 'retrieval_failed')
    if (!errors.length) continue
    const lastError = errors.at(-1)
    const after = own.filter(x => x.at > lastError.at && DELAYED_SUCCESS.has(x.kind) && dayKey(x.at) !== dayKey(lastError.at))
    const successDays = new Set(after.map(x => dayKey(x.at)))
    const errorDays = new Set(errors.map(x => dayKey(x.at)))
    const status = successDays.size >= 2 ? 'holding' : successDays.size === 1 ? 'improving'
      : (errors.length >= 2 || errorDays.size >= 2) ? 'recurring' : 'observed'
    const lastTouch = Math.max(lastError.at, ...own.filter(x => x.kind === 'prompted' || DELAYED_SUCCESS.has(x.kind)).map(x => x.at))
    const nextDueAt = lastTouch + SPACING_DAYS[Math.min(successDays.size, SPACING_DAYS.length - 1)] * DAY_MS
    const successes = own.filter(x => DELAYED_SUCCESS.has(x.kind)).length
    const decision = chooseTeaching({ teachingHistory: asTeachingHistory(own, rule) }, `chat:${rule}`, STRATEGIES, `${rule}:${dayKey(atMs)}`, 'instruction')
    out.push({
      rule, ...CHAT_RULES[rule], status,
      errors: errors.length, errorDays: errorDays.size, lastErrorAt: lastError.at,
      delayedSuccesses: successes, transfers: own.filter(x => x.kind === 'transfer').length,
      notEvidence: own.filter(x => NOT_EVIDENCE.has(x.kind) && x.kind !== 'prompted').length,
      evidence: evidenceSummary(successes, errors.length),
      due: atMs >= nextDueAt, nextDueAt,
      bases: [...new Set(own.map(x => x.base).filter(Boolean))].slice(-12),
      preferredStrategy: decision && decision.reason !== 'exploration' ? decision.format : null,
      strategyReason: decision?.reason || null,
    })
  }
  return out
}

/* What travels to the tutor: closed-set fields only (see chat.py _safe_learning_memory). */
export function learningMemoryPayload(model, atMs = Date.now()) {
  return chatDifficulties(model, atMs).slice(0, 8).map(d => ({
    rule: d.rule, status: d.status, due: d.due, bases: d.bases,
    ...(d.preferredStrategy ? { preferred_strategy: d.preferredStrategy } : {}),
  }))
}
