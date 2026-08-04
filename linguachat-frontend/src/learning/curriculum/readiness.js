/*
 * readiness — "finished the course" and "ready for the next level" are not the
 * same sentence, and this file is the difference between them.
 *
 * Finishing seventeen episodes is a fact about the CURRICULUM: the learner
 * reached the end of what exists. Being ready for A1 is a claim about the
 * LEARNER, and it has to be earned from evidence they produced — unaided, more
 * than once, recently, and inside a conversation rather than an exercise.
 *
 * Three rules shape everything below:
 *
 *   Derived, never stored. Readiness is recomputed from the learner model every
 *   time it is asked for. A stored `ready: true` would be a second source of
 *   truth that can disagree with the evidence, and merging two devices would
 *   have to decide which lie to keep.
 *
 *   No score. There is no number, no percentage and no threshold the learner
 *   could argue with. The result is a list of what is missing, in reason codes
 *   the UI translates into one human sentence — never shown raw.
 *
 *   Stable. A single review falling due overnight must not flip a learner from
 *   ready to not-ready; the thresholds are deliberately loose enough that
 *   readiness reflects a state of learning rather than the time of day.
 */
import { ARC, getEpisode } from '../episodes/index.js'
import {
  PRE_A1_EXIT_CRITERIA, CAN_DO_INTENT, integratedEpisodes, productiveItemsOf,
} from './preA1Map.js'
import { LEARNING_STATE_RANK, getEpisodeState } from '../engine/learnerModel.js'

export const READINESS_REASONS = {
  CURRICULUM_INCOMPLETE: 'curriculum_incomplete',
  MISSING_REQUIRED_SKILL: 'missing_required_skill',
  FRAGILE_REQUIRED_SKILL: 'fragile_required_skill',
  INSUFFICIENT_INDEPENDENT_EVIDENCE: 'insufficient_independent_evidence',
  TOO_MANY_OVERDUE_REVIEWS: 'too_many_overdue_reviews',
  NEEDS_INTEGRATED_CONVERSATION: 'needs_integrated_conversation',
}

/*
 * How many overdue reviews are too many.
 *
 * Counted only among the language items that belong to a REQUIRED capability:
 * a forgotten optional word is not a reason to hold someone back, and a learner
 * carrying a dozen overdue required phrases is not ready whatever their episode
 * count says. Three is the audit's figure, kept because it is large enough that
 * one item falling due overnight cannot flip the answer and small enough that a
 * real backlog still shows.
 */
export const MAX_OVERDUE_REQUIRED_REVIEWS = 3

/*
 * How recent an integrated conversation has to be — measured against the
 * learner's OWN last activity, not against the clock. Someone who comes back
 * after a month should be met with practice, not with a verdict that changed
 * while they were away.
 */
export const RECENT_EVIDENCE_DAYS = 30
const DAY = 24 * 60 * 60 * 1000

/* An assisted turn or two is normal; leaning on help throughout is not. */
export const MAX_ASSISTANCE_IN_EVIDENCE = 2

const ms = (iso) => {
  const t = Date.parse(iso || '')
  return Number.isFinite(t) ? t : null
}

/* The most recent thing the learner did, from their own record. */
export function lastActivityAt(model) {
  let latest = 0
  for (const runs of Object.values(model?.episodeRuns || {})) {
    for (const run of runs || []) {
      latest = Math.max(latest, ms(run?.completedAt) || 0, ms(run?.startedAt) || 0)
    }
  }
  for (const item of Object.values(model?.languageItems || {})) {
    latest = Math.max(latest, ms(item?.lastSeenAt) || 0)
  }
  for (const entry of Object.values(model?.canDo || {})) {
    latest = Math.max(latest, ms(entry?.lastPracticedAt) || 0)
  }
  return latest || null
}

/*
 * Whether every episode that exists has been completed.
 *
 * This is the whole meaning of "curriculum complete": the course was finished.
 * It says nothing at all about how well.
 */
export function isCurriculumComplete(model) {
  return ARC.every(ep => getEpisodeState(model, ep.id).status === 'completed')
}

/*
 * What a required capability needs before it counts.
 *
 * Two unaided successes, because one is luck — and, for a capability that
 * covers more than one function, evidence that each function was actually
 * produced. Asking "What's this?" twice must not stand in for never having
 * identified anything, which is why the ITEMS are checked and not just the
 * can-do counter.
 */
export function skillEvidence(model, canDoId) {
  const record = model?.canDo?.[canDoId] || null
  const independent = Number(record?.independentSuccesses) || 0
  const attempts = Number(record?.attempts) || 0
  const taught = ARC.some(ep => ep.canDoId === canDoId)

  const items = productiveItemsOf(canDoId)
  const states = items.map(id => model?.languageItems?.[id]?.learningState || null)
  const practised = items.length === 0
    ? true
    : states.every(state => state && LEARNING_STATE_RANK[state] >= LEARNING_STATE_RANK.practicing)
  const usable = items.length === 0
    ? independent >= PRE_A1_EXIT_CRITERIA.independentEvidencePerCanDo
    : states.some(state => state === 'can_use')

  return {
    canDoId,
    taught,
    attempts,
    independent,
    items,
    practised,
    usable,
    enough: taught && independent >= PRE_A1_EXIT_CRITERIA.independentEvidencePerCanDo && practised && usable,
  }
}

/* Overdue reviews, counted only where they can hold a required skill back. */
export function overdueRequiredReviews(model, atMs = Date.now()) {
  const required = new Set(PRE_A1_EXIT_CRITERIA.requiredCanDos.flatMap(id => productiveItemsOf(id)))
  const overdue = []
  for (const [id, item] of Object.entries(model?.languageItems || {})) {
    if (!required.has(id)) continue
    const due = ms(item?.nextReviewAt)
    if (due !== null && due <= atMs) overdue.push(id)
  }
  return overdue
}

/*
 * A conversation the learner held rather than an exercise they completed.
 *
 * The run has to be finished, unaided enough, and on an episode the curriculum
 * itself considers integrated — several capabilities in one unbroken exchange.
 * Only metadata is read: which episode, when, how much help. No transcript is
 * kept anywhere, and none is needed.
 */
export function integratedConversationEvidence(model, atMs = Date.now()) {
  const integrated = new Set(integratedEpisodes())
  const horizon = (lastActivityAt(model) || atMs) - RECENT_EVIDENCE_DAYS * DAY
  let best = null
  for (const [episodeId, runs] of Object.entries(model?.episodeRuns || {})) {
    if (!integrated.has(episodeId)) continue
    for (const run of runs || []) {
      const at = ms(run?.completedAt)
      if (at === null || at < horizon) continue
      if (!run?.independentEvidence) continue
      if ((Number(run?.assistanceUsed) || 0) > MAX_ASSISTANCE_IN_EVIDENCE) continue
      if (!best || at > best.at) best = { episodeId, at, mode: run.mode || null, assistanceUsed: Number(run.assistanceUsed) || 0 }
    }
  }
  return best
}

/*
 * The whole verdict, in one structured object.
 *
 * Every field is derived. Nothing here is written back to the learner model,
 * and nothing here awards anything: readiness is a description, not a reward.
 */
export function derivePreA1Readiness(model, { atMs = Date.now() } = {}) {
  const required = [...PRE_A1_EXIT_CRITERIA.requiredCanDos]
  const curriculumComplete = isCurriculumComplete(model)

  const evidence = required.map(id => skillEvidence(model, id))
  const missingSkills = evidence.filter(e => !e.taught).map(e => e.canDoId)
  const untouched = evidence.filter(e => e.taught && e.attempts === 0).map(e => e.canDoId)
  const fragileSkills = evidence
    .filter(e => e.taught && e.attempts > 0 && (!e.practised || !e.usable))
    .map(e => e.canDoId)
  const thinEvidence = evidence
    .filter(e => e.taught && e.attempts > 0 && e.practised && e.usable && e.independent < PRE_A1_EXIT_CRITERIA.independentEvidencePerCanDo)
    .map(e => e.canDoId)

  const overdue = overdueRequiredReviews(model, atMs)
  const conversation = integratedConversationEvidence(model, atMs)

  const reasonCodes = []
  if (!curriculumComplete) reasonCodes.push(READINESS_REASONS.CURRICULUM_INCOMPLETE)
  if (missingSkills.length || untouched.length) reasonCodes.push(READINESS_REASONS.MISSING_REQUIRED_SKILL)
  if (fragileSkills.length) reasonCodes.push(READINESS_REASONS.FRAGILE_REQUIRED_SKILL)
  if (thinEvidence.length) reasonCodes.push(READINESS_REASONS.INSUFFICIENT_INDEPENDENT_EVIDENCE)
  if (overdue.length > MAX_OVERDUE_REQUIRED_REVIEWS) reasonCodes.push(READINESS_REASONS.TOO_MANY_OVERDUE_REVIEWS)
  if (!conversation) reasonCodes.push(READINESS_REASONS.NEEDS_INTEGRATED_CONVERSATION)

  return {
    ready: reasonCodes.length === 0,
    curriculumComplete,
    requiredSkills: required,
    missingSkills: [...missingSkills, ...untouched],
    fragileSkills: [...fragileSkills, ...thinEvidence],
    overdueReviews: overdue.length,
    overdueItems: overdue,
    integratedConversationEvidence: conversation,
    reasonCodes,
  }
}

/*
 * What the learner should do next when they are not ready yet, in priority
 * order and in the vocabulary the planner already speaks. Never a score, never
 * an id the learner sees — the UI turns the first entry into one sentence.
 */
export function readinessFocus(readiness) {
  if (!readiness || readiness.ready) return null
  if (readiness.reasonCodes.includes(READINESS_REASONS.CURRICULUM_INCOMPLETE)) return { kind: 'finish_curriculum' }
  if (readiness.fragileSkills.length) return { kind: 'strengthen_skill', canDoId: readiness.fragileSkills[0], intent: CAN_DO_INTENT[readiness.fragileSkills[0]] || null }
  if (readiness.overdueReviews > MAX_OVERDUE_REQUIRED_REVIEWS) return { kind: 'catch_up_reviews' }
  if (!readiness.integratedConversationEvidence) return { kind: 'have_a_conversation' }
  return { kind: 'keep_practising' }
}
