/*
 * graduation — the one thing about a learner that only moves forwards.
 *
 * Everything else the model knows is a description of NOW: which items are due,
 * which skills are quiet, whether the last conversation went well. Readiness is
 * derived from that and is allowed to change in both directions, because it
 * answers "is this person ready today".
 *
 * A milestone answers a different question: "did this person reach the bar".
 * That is a fact about a moment, and no later moment can undo it. A review
 * falling due next Tuesday changes what to practise; it does not mean the
 * afternoon they held a whole conversation unaided never happened.
 *
 * So the two are kept apart on purpose:
 *
 *   derivePreA1Readiness   pure, derived, never stored, may go false again
 *   reconcileLevelMilestones   writes once, idempotent, monotonic
 *
 * Reconciliation runs where evidence CHANGES — a finished episode run, a
 * finished session — never where a screen renders. Graduating because somebody
 * opened Home would make the milestone a property of navigation.
 */
import { derivePreA1Readiness } from './readiness.js'
import { sanitizeLevelMilestones } from '../engine/learnerModel.js'

export const PRE_A1_LEVEL = 'pre_a1'

/*
 * Which set of criteria produced a graduation.
 *
 * Stored with the milestone so a future change to the rules can be told apart
 * from a graduation earned under them. Bump it when the criteria change in a
 * way that would have changed who passes — not for a refactor.
 */
export const EVIDENCE_VERSION = 'pre_a1.v1'

export const preA1Milestone = (model) => sanitizeLevelMilestones(model?.levelMilestones)[PRE_A1_LEVEL] || null
export const hasGraduatedPreA1 = (model) => Boolean(preA1Milestone(model))

/*
 * Record the milestone if it has been earned and is not already there.
 *
 * Idempotent by construction: an existing milestone is returned untouched, so
 * calling this after every save can neither move the date nor write a second
 * one. It awards nothing — no XP, no Garden, no run — because a milestone is a
 * description of what happened, not a prize for it.
 */
export function reconcileLevelMilestones(model, { atMs = Date.now(), source = 'evidence' } = {}) {
  if (!model || typeof model !== 'object') return null
  const existing = preA1Milestone(model)
  if (existing) {
    // keep the stored shape canonical without changing what it says
    model.levelMilestones = { ...sanitizeLevelMilestones(model.levelMilestones) }
    return existing
  }
  const readiness = derivePreA1Readiness(model, { atMs })
  if (!readiness.ready) return null

  const milestone = {
    graduatedAt: new Date(atMs).toISOString(),
    evidenceVersion: EVIDENCE_VERSION,
    source: String(source).slice(0, 32),
  }
  model.levelMilestones = { ...sanitizeLevelMilestones(model.levelMilestones), [PRE_A1_LEVEL]: milestone }
  return milestone
}

/*
 * What the product should say, in one word, without asking three questions.
 *
 *   in_progress    still walking the curriculum
 *   consolidating  finished it, not ready yet
 *   graduated      reached the bar at some point, whatever today looks like
 *
 * `graduated` deliberately outranks a current readiness of false: someone who
 * earned it last month and has a few reviews due has not become un-ready, they
 * have some reviews due.
 */
export function preA1Status(model, { atMs = Date.now() } = {}) {
  const readiness = derivePreA1Readiness(model, { atMs })
  const milestone = preA1Milestone(model)
  const state = milestone ? 'graduated' : (readiness.curriculumComplete ? 'consolidating' : 'in_progress')
  return { state, readiness, milestone }
}
