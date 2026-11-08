/*
 * A1 readiness — PREPARED, INACTIVE (P4).
 *
 * Lives OUTSIDE src/ on purpose: no product file can import it, Vite never
 * bundles it, and check-a1-blueprint's invariant ("nothing in src prepares A1
 * readiness") still holds. Only tests use it. Opening A1 requires the owner's
 * explicit decision (LC-PROD-002); see docs/curriculum/a1-readiness-design.md.
 *
 * WHAT IT DOES
 * Derives, from the learner model the engine already keeps, whether a learner
 * could be considered ready to leave A1 — using ONLY the dimensions the A1
 * blueprint names (exitCriteria.readinessDimensionsForA2), and separating:
 *
 *   structural criteria   facts the blueprint states exactly (every episode
 *                         completed once; the 13 required capabilities; the
 *                         three integrated arcs, at least the closing one;
 *                         review health over Pre-A1 ∪ A1 required items, with
 *                         Pre-A1's rule "extended to the union, not replaced";
 *                         no fragile required capability; breadth = five of
 *                         the seven skill families)
 *   uncalibrated          numbers the blueprint explicitly leaves for real
 *                         evidence: how many unaided productions per
 *                         capability, and how recent "recent" is. They are
 *                         NOT invented here: without a calibration object the
 *                         answer can never be better than `pending_calibration`.
 *
 * States: `insufficient` (a structural criterion is unmet, with reasons),
 * `pending_calibration` (structure met; thresholds not calibrated),
 * `verifiable` (structure met AND an explicit calibration met). Even
 * `verifiable` records nothing while A1 is closed.
 */
import { a1Episodes, A1_REQUIRED_CAN_DOS, a1ProductiveItemsOf, a1RequiredLevelItems, a1EpisodesForCanDo } from '../src/learning/curriculum/a1Map.js'
import { requiredLevelItems } from '../src/learning/curriculum/preA1Map.js'
import { MAX_OVERDUE_REQUIRED_REVIEWS, MAX_ASSISTANCE_IN_EVIDENCE } from '../src/learning/curriculum/readiness.js'
import { A1, isLevelAvailable } from '../src/learning/curriculum/levels.js'
import { LEARNING_STATE_RANK, sanitizeLevelMilestones } from '../src/learning/engine/learnerModel.js'

export const A1_LEVEL = 'a1'
export const A1_EVIDENCE_VERSION = 'a1.v0-uncalibrated'

/* From the A1 blueprint (skillFamilies); check-a1-readiness compares them. */
export const A1_SKILL_FAMILIES = {
  own_life: ['talk_about_work_or_study', 'ask_about_work_or_study', 'talk_about_daily_routine', 'say_when_something_happens'],
  people_around: ['introduce_someone_else'],
  place_and_movement: ['ask_where_something_is', 'say_where_something_is', 'ask_about_getting_somewhere'],
  transactions: ['use_bigger_numbers', 'ask_the_price', 'buy_something'],
  ability: ['say_what_you_can_do', 'ask_someone_about_ability'],
  arrangements: ['arrange_to_meet'],
  conversation_management: ['ask_what_something_means', 'ask_how_to_say_something'],
}
/* exitCriteria: "integrated conversations held unaided … at least the closing one" */
export const A1_INTEGRATED_ARCS = ['daily_rhythm', 'paying_and_choosing', 'making_arrangements']
export const A1_CLOSING_ARC = 'making_arrangements'
/* exitCriteria: "recent evidence from at least five of them" */
export const A1_BREADTH_FAMILIES = 5

export const A1_STATES = Object.freeze({ INSUFFICIENT: 'insufficient', PENDING_CALIBRATION: 'pending_calibration', VERIFIABLE: 'verifiable' })
export const A1_REASONS = Object.freeze({
  CURRICULUM_INCOMPLETE: 'curriculum_incomplete',
  NOT_PRODUCED_UNAIDED: 'capability_not_produced_unaided',
  FRAGILE: 'capability_fragile',
  NO_CLOSING_CONVERSATION: 'no_unaided_closing_conversation',
  REVIEWS_OVERDUE: 'reviews_overdue',
  NARROW_BREADTH: 'evidence_from_too_few_skill_families',
  BELOW_CALIBRATED_THRESHOLD: 'below_calibrated_threshold',
})
/* What the blueprint leaves to real evidence. Never defaulted. */
export const A1_UNCALIBRATED = Object.freeze(['unaidedProductionsPerCapability', 'recentEvidenceDays'])

const DAY = 86400000
const ms = value => { const t = Date.parse(value || ''); return Number.isFinite(t) ? t : null }

/* One capability, read only from recorded evidence (the shape of Pre-A1's, own items). */
export function a1CapabilityEvidence(model, canDoId) {
  const record = model?.canDo?.[canDoId] || null
  const completions = Number(record?.independentSuccesses) || 0
  const attempts = Number(record?.attempts) || 0
  const items = a1ProductiveItemsOf(canDoId)
  const states = items.map(id => model?.languageItems?.[id]?.learningState || null)
  const independent = items.length ? Math.max(0, ...items.map(id => Number(model?.languageItems?.[id]?.independentCorrect) || 0)) : completions
  const practised = items.length === 0 || states.every(s => s && LEARNING_STATE_RANK[s] >= LEARNING_STATE_RANK.practicing)
  const usable = items.length === 0 ? completions >= 1 : states.some(s => s === 'can_use')
  const lastAt = ms(record?.lastPracticedAt)
  return {
    canDoId, attempts, completions, independent, practised, usable,
    producedUnaided: completions >= 1 || independent >= 1,
    episodes: a1EpisodesForCanDo(canDoId), lastAt,
  }
}

function closingConversation(model, arcId) {
  const ids = new Set(a1Episodes().filter(e => e.arc === arcId).map(e => e.id))
  let best = null
  for (const [episodeId, runs] of Object.entries(model?.episodeRuns || {})) {
    if (!ids.has(episodeId)) continue
    for (const run of runs || []) {
      const at = ms(run?.completedAt)
      if (at === null || !run?.independentEvidence || (Number(run?.assistanceUsed) || 0) > MAX_ASSISTANCE_IN_EVIDENCE) continue
      if (!best || at > best.at) best = { episodeId, at, assistanceUsed: Number(run.assistanceUsed) || 0 }
    }
  }
  return best
}

/*
 * The whole verdict. Pure: reads the model, writes nothing, awards nothing.
 * `calibration` = { unaidedProductionsPerCapability, recentEvidenceDays } once
 * real journeys have calibrated them; until then pass nothing.
 */
export function deriveA1Readiness(model, { atMs = Date.now(), calibration = null, levelOpen = isLevelAvailable(A1) } = {}) {
  const episodes = a1Episodes()
  const incomplete = episodes.filter(e => model?.episodes?.[e.id]?.status !== 'completed').map(e => e.id)
  const capabilities = A1_REQUIRED_CAN_DOS.map(id => a1CapabilityEvidence(model, id))
  const notProduced = capabilities.filter(c => !c.producedUnaided).map(c => c.canDoId)
  const fragile = capabilities.filter(c => c.attempts > 0 && (!c.practised || !c.usable)).map(c => c.canDoId)
  const integrated = Object.fromEntries(A1_INTEGRATED_ARCS.map(arc => [arc, closingConversation(model, arc)]))
  const required = new Set([...requiredLevelItems(), ...a1RequiredLevelItems()])
  const overdue = Object.entries(model?.languageItems || {})
    .filter(([id, item]) => required.has(id) && ms(item?.nextReviewAt) !== null && ms(item.nextReviewAt) <= atMs).map(([id]) => id)
  const recentSince = calibration?.recentEvidenceDays ? atMs - calibration.recentEvidenceDays * DAY : -Infinity
  const families = Object.entries(A1_SKILL_FAMILIES).filter(([, ids]) => ids.some(id => {
    const c = a1CapabilityEvidence(model, id)
    return c.attempts > 0 && (c.lastAt === null ? recentSince === -Infinity : c.lastAt >= recentSince)
  })).map(([family]) => family)

  const reasons = []
  if (incomplete.length) reasons.push({ code: A1_REASONS.CURRICULUM_INCOMPLETE, ids: incomplete })
  if (notProduced.length) reasons.push({ code: A1_REASONS.NOT_PRODUCED_UNAIDED, ids: notProduced })
  if (fragile.length) reasons.push({ code: A1_REASONS.FRAGILE, ids: fragile })
  if (!integrated[A1_CLOSING_ARC]) reasons.push({ code: A1_REASONS.NO_CLOSING_CONVERSATION, ids: [A1_CLOSING_ARC] })
  if (overdue.length > MAX_OVERDUE_REQUIRED_REVIEWS) reasons.push({ code: A1_REASONS.REVIEWS_OVERDUE, ids: overdue })
  if (families.length < A1_BREADTH_FAMILIES) {
    reasons.push({ code: A1_REASONS.NARROW_BREADTH, ids: Object.keys(A1_SKILL_FAMILIES).filter(f => !families.includes(f)) })
  }

  let state
  if (reasons.length) state = A1_STATES.INSUFFICIENT
  else if (!calibration) state = A1_STATES.PENDING_CALIBRATION
  else {
    const per = Number(calibration.unaidedProductionsPerCapability)
    const below = Number.isFinite(per) ? capabilities.filter(c => Math.max(c.completions, c.independent) < per).map(c => c.canDoId) : capabilities.map(c => c.canDoId)
    if (below.length) { reasons.push({ code: A1_REASONS.BELOW_CALIBRATED_THRESHOLD, ids: below }); state = A1_STATES.INSUFFICIENT }
    else state = A1_STATES.VERIFIABLE
  }
  return {
    state, levelOpen,
    mayRecordMilestone: state === A1_STATES.VERIFIABLE && levelOpen === true,
    curriculumComplete: incomplete.length === 0,
    capabilities, integrated, overdueReviews: overdue.length, skillFamiliesWithEvidence: families,
    reasons, uncalibrated: calibration ? [] : [...A1_UNCALIBRATED],
    evidenceVersion: A1_EVIDENCE_VERSION,
  }
}

/*
 * The milestone the evidence would justify — or null. Never writes the model.
 * Null whenever A1 is closed, whatever the evidence says.
 */
export function proposeA1Milestone(model, { atMs = Date.now(), calibration = null, levelOpen = isLevelAvailable(A1), source = 'evidence' } = {}) {
  if (sanitizeLevelMilestones(model?.levelMilestones)[A1_LEVEL]) return sanitizeLevelMilestones(model.levelMilestones)[A1_LEVEL]
  const readiness = deriveA1Readiness(model, { atMs, calibration, levelOpen })
  if (!readiness.mayRecordMilestone) return null
  return { graduatedAt: new Date(atMs).toISOString(), evidenceVersion: A1_EVIDENCE_VERSION, source: String(source).slice(0, 32) }
}

/* Record it (tests and a future, authorised integration only). Idempotent; earliest wins. */
export function recordA1Milestone(model, milestone) {
  if (!model || !milestone) return null
  const current = sanitizeLevelMilestones(model.levelMilestones)
  if (current[A1_LEVEL]) return current[A1_LEVEL]
  model.levelMilestones = { ...current, [A1_LEVEL]: milestone }
  return sanitizeLevelMilestones(model.levelMilestones)[A1_LEVEL] || null
}
