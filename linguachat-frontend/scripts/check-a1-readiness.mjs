#!/usr/bin/env node
/*
 * check-a1-readiness — the prepared, INACTIVE A1 readiness (P4).
 *
 * Synthetic learners play the real curriculum through the tooling path (the
 * same `playEpisode` the arc and longitudinal suites use — A1 stays closed to
 * learners throughout). Proves: the evaluator follows the blueprint's
 * dimensions and nothing else, never says "verifiable" without an explicit
 * calibration, records nothing while A1 is closed, keeps Pre-A1 graduation
 * exactly as it was, and stays out of the product (not in src/, not imported,
 * not bundled).
 *
 * Run: node scripts/check-a1-readiness.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  deriveA1Readiness, proposeA1Milestone, recordA1Milestone, A1_STATES, A1_REASONS, A1_SKILL_FAMILIES,
  A1_INTEGRATED_ARCS, A1_BREADTH_FAMILIES, A1_UNCALIBRATED, A1_EVIDENCE_VERSION,
} from '../prepared/a1Readiness.js'
import { createLearnerModel, recordItemAttempt, getDueReviews, sanitizeLevelMilestones, mergeLevelMilestones, migrateLearnerModel, MILESTONE_LEVELS } from '../src/learning/engine/learnerModel.js'
import { reconcileLevelMilestones, preA1Milestone, preA1Status } from '../src/learning/curriculum/graduation.js'
import { episodeRequest } from '../src/learning/curriculum/episodeContent.js'
import { isLevelAvailable, episodesOfLevel, PRE_A1, A1 } from '../src/learning/curriculum/levels.js'
import { a1Episodes } from '../src/learning/curriculum/a1Map.js'
import { buildSessionPlan } from '../src/learning/engine/session.js'
import { playEpisode, playCurriculum, playDueReviews, consolidate, STRONG, ASSISTED, DAY } from './lib/journey.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const blueprint = JSON.parse(readFileSync(join(ROOT, '../docs/curriculum/a1-blueprint.json'), 'utf8'))
const START = Date.UTC(2026, 0, 5, 9)
const CALIBRATION = { unaidedProductionsPerCapability: 1, recentEvidenceDays: 120 }   // TEST VALUES, not product thresholds
let passed = 0
const failures = []
function scenario(name, run) {
  try { run(); passed++; console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}
const codes = r => r.reasons.map(x => x.code)

/*
 * The day's due reviews, done. The journey helper only knows Pre-A1's review
 * intents, so for A1 a review is recorded as what it is in the model: one more
 * attempt at the item, independent and correct for a learner who does them
 * (`diligent`), absent for one who skips them.
 */
function reviewDue(model, atMs, diligent) {
  if (!diligent) return
  for (const id of getDueReviews(model, atMs)) recordItemAttempt(model, id, { correct: true, independent: true, evidenceKind: 'open', atMs })
}

/* A learner who finishes Pre-A1, consolidates, then plays every A1 episode (tooling path). */
function learnerThroughA1(profile, { a1Upto = Infinity, diligent = true } = {}) {
  const model = createLearnerModel()
  const { endedAt } = playCurriculum(model, { profile, startMs: START })
  const after = consolidate(model, { profile, startMs: endedAt })
  let at = (after?.endedAt || endedAt) + DAY
  for (const ep of a1Episodes().slice(0, a1Upto)) {
    playDueReviews(model, { profile, atMs: at })
    reviewDue(model, at, diligent)
    playEpisode(model, ep.id, { profile, atMs: at })
    at += DAY
  }
  playDueReviews(model, { profile, atMs: at })
  reviewDue(model, at, diligent)
  return { model, at }
}
const strong = learnerThroughA1(STRONG)

scenario('the evaluator reads the blueprint’s dimensions, not invented ones', () => {
  const bp = Object.fromEntries(blueprint.skillFamilies.map(f => [f.id, f.canDos]))
  assert.deepEqual(A1_SKILL_FAMILIES, bp, 'skill families = blueprint')
  const dims = blueprint.exitCriteria.readinessDimensionsForA2
  assert.deepEqual(dims.find(d => d.dimension.startsWith('integrated')).appliesTo, A1_INTEGRATED_ARCS)
  assert.match(dims.find(d => d.dimension === 'breadth').note, new RegExp(`at least ${['zero', 'one', 'two', 'three', 'four', 'five'][A1_BREADTH_FAMILIES]}`))
  assert.match(dims.find(d => d.dimension.startsWith('required capabilities')).note, /not now/, 'the blueprint leaves the number open…')
  assert.ok(A1_UNCALIBRATED.includes('unaidedProductionsPerCapability'), '…so the evaluator does too')
})

scenario('a new learner: insufficient, for stated reasons; A1 closed', () => {
  const r = deriveA1Readiness(createLearnerModel(), { atMs: START })
  assert.equal(r.state, A1_STATES.INSUFFICIENT)
  assert.ok(codes(r).includes(A1_REASONS.CURRICULUM_INCOMPLETE))
  assert.equal(r.levelOpen, false)
  assert.equal(r.mayRecordMilestone, false)
})

scenario('finishing Pre-A1 graduates Pre-A1 exactly as before — and A1 stays closed to them', () => {
  const m = createLearnerModel()
  const { endedAt } = playCurriculum(m, { profile: STRONG, startMs: START })
  consolidate(m, { profile: STRONG, startMs: endedAt })
  reconcileLevelMilestones(m, { atMs: endedAt + 30 * DAY })
  const status = preA1Status(m, { atMs: endedAt + 30 * DAY })
  assert.ok(['graduated', 'consolidating'].includes(status.state))
  assert.equal(m.levelMilestones?.a1, undefined, 'no A1 milestone is ever written by the product')
  // trying to open A1 early: refused before any content loads
  const first = a1Episodes()[0]
  assert.equal(episodeRequest({ episodeId: first.id }).reason, 'level_unavailable')
  assert.equal(isLevelAvailable(A1), false)
  assert.equal(deriveA1Readiness(m, { atMs: endedAt }).state, A1_STATES.INSUFFICIENT)
})

scenario('incomplete evidence: an assisted learner is told exactly what is missing', () => {
  const { model, at } = learnerThroughA1(ASSISTED, { a1Upto: 12 })
  const r = deriveA1Readiness(model, { atMs: at })
  assert.equal(r.state, A1_STATES.INSUFFICIENT)
  assert.ok(codes(r).includes(A1_REASONS.CURRICULUM_INCOMPLETE))
  const missing = r.reasons.find(x => x.code === A1_REASONS.CURRICULUM_INCOMPLETE).ids
  assert.equal(missing.length, a1Episodes().length - 12, 'the unplayed episodes, by id')
  assert.ok(codes(r).includes(A1_REASONS.NO_CLOSING_CONVERSATION))
})

scenario('a strong learner through all of A1: never better than pending_calibration without calibration', () => {
  const r = deriveA1Readiness(strong.model, { atMs: strong.at })
  assert.equal(r.curriculumComplete, true)
  assert.deepEqual(codes(r), [], 'every structural criterion met: ' + JSON.stringify(r.reasons).slice(0, 200))
  assert.equal(r.state, A1_STATES.PENDING_CALIBRATION)
  assert.deepEqual(r.uncalibrated, [...A1_UNCALIBRATED])
  assert.equal(proposeA1Milestone(strong.model, { atMs: strong.at }), null)
})

scenario('needing review: months away bring overdue reviews back as a reason', () => {
  const r = deriveA1Readiness(strong.model, { atMs: strong.at + 200 * DAY })
  assert.ok(codes(r).includes(A1_REASONS.REVIEWS_OVERDUE), codes(r).join(','))
})

scenario('with an explicit (test) calibration: verifiable — and still nothing recorded while A1 is closed', () => {
  const r = deriveA1Readiness(strong.model, { atMs: strong.at, calibration: CALIBRATION })
  assert.equal(r.state, A1_STATES.VERIFIABLE)
  assert.equal(r.levelOpen, false)
  assert.equal(r.mayRecordMilestone, false)
  assert.equal(proposeA1Milestone(strong.model, { atMs: strong.at, calibration: CALIBRATION }), null)
  const strict = deriveA1Readiness(strong.model, { atMs: strong.at, calibration: { ...CALIBRATION, unaidedProductionsPerCapability: 99 } })
  assert.equal(strict.state, A1_STATES.INSUFFICIENT)
  assert.ok(codes(strict).includes(A1_REASONS.BELOW_CALIBRATED_THRESHOLD))
})

scenario('isolated bench, A1 hypothetically open: one milestone, idempotent, earliest wins, Pre-A1 untouched', () => {
  const m = migrateLearnerModel(JSON.parse(JSON.stringify(strong.model)))
  reconcileLevelMilestones(m, { atMs: strong.at })
  const preBefore = JSON.stringify(preA1Milestone(m))
  const ms1 = proposeA1Milestone(m, { atMs: strong.at, calibration: CALIBRATION, levelOpen: true })
  assert.equal(ms1.evidenceVersion, A1_EVIDENCE_VERSION)
  recordA1Milestone(m, ms1)
  const again = recordA1Milestone(m, proposeA1Milestone(m, { atMs: strong.at + DAY, calibration: CALIBRATION, levelOpen: true }))
  assert.equal(again.graduatedAt, ms1.graduatedAt, 'repeating graduation changes nothing')
  assert.equal(JSON.stringify(preA1Milestone(m)), preBefore, 'Pre-A1 graduation untouched')
  // two copies (two devices) with different dates: the earliest is kept, both directions
  const later = { ...sanitizeLevelMilestones(m.levelMilestones), a1: { ...ms1, graduatedAt: new Date(strong.at + 9 * DAY).toISOString() } }
  assert.equal(mergeLevelMilestones(later, m.levelMilestones).a1.graduatedAt, ms1.graduatedAt)
  assert.equal(mergeLevelMilestones(m.levelMilestones, later).a1.graduatedAt, ms1.graduatedAt)
  // restored / migrated progress keeps it; a mislabelled one is dropped
  assert.equal(migrateLearnerModel(JSON.parse(JSON.stringify(m))).levelMilestones.a1.graduatedAt, ms1.graduatedAt)
  assert.equal(sanitizeLevelMilestones({ a1: { ...ms1, evidenceVersion: 'pre_a1.v1' } }).a1, undefined)
  assert.deepEqual(MILESTONE_LEVELS, ['pre_a1'], 'the product still records only Pre-A1')
  // the product's own reconciliation (Pre-A1 only) neither erases nor rewrites it
  reconcileLevelMilestones(m, { atMs: strong.at + 2 * DAY })
  assert.equal(m.levelMilestones.a1.graduatedAt, ms1.graduatedAt)
})

scenario('account switch A → B → A: nothing crosses, nothing is lost', () => {
  const a = migrateLearnerModel(JSON.parse(JSON.stringify(strong.model)))
  recordA1Milestone(a, proposeA1Milestone(a, { atMs: strong.at, calibration: CALIBRATION, levelOpen: true }))
  const savedA = JSON.stringify(a)
  const b = createLearnerModel()                       // B's own namespace starts empty (P0 isolation)
  const rb = deriveA1Readiness(b, { atMs: strong.at, calibration: CALIBRATION, levelOpen: true })
  assert.equal(rb.state, A1_STATES.INSUFFICIENT)
  assert.equal(proposeA1Milestone(b, { atMs: strong.at, calibration: CALIBRATION, levelOpen: true }), null)
  assert.equal(sanitizeLevelMilestones(b.levelMilestones).a1, undefined)
  const backToA = migrateLearnerModel(JSON.parse(savedA))
  assert.equal(backToA.levelMilestones.a1.graduatedAt, a.levelMilestones.a1.graduatedAt)
  assert.equal(deriveA1Readiness(backToA, { atMs: strong.at, calibration: CALIBRATION, levelOpen: true }).state, A1_STATES.VERIFIABLE)
})

scenario('an older model format (no A1 fields at all) reads as insufficient, never as an error', () => {
  const old = { version: 3, languageItems: {}, canDo: {}, episodes: {} }
  const r = deriveA1Readiness(migrateLearnerModel(old), { atMs: START })
  assert.equal(r.state, A1_STATES.INSUFFICIENT)
})

scenario('two levels hypothetically open: the planner continues into A1 from the same engine', () => {
  const plan = buildSessionPlan(strong.model, [...episodesOfLevel(PRE_A1), ...a1Episodes()], { atMs: strong.at })
  assert.ok(plan.blocks.length > 0)
  const firstA1 = createLearnerModel()
  const { endedAt } = playCurriculum(firstA1, { profile: STRONG, startMs: START })
  const next = buildSessionPlan(firstA1, [...episodesOfLevel(PRE_A1), ...a1Episodes()], { atMs: endedAt + DAY })
  const main = next.blocks.find(b => b.payload?.episodeId)
  assert.equal(main?.payload.episodeId, a1Episodes()[0].id, 'after Pre-A1, the next episode is A1’s first')
})

scenario('kept out of the product: not in src, imported by nothing in src, absent from the build config', () => {
  const walk = dir => readdirSync(dir).flatMap(n => statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)])
  const offenders = walk(join(ROOT, 'src')).filter(f => /\.(jsx?|mjs)$/.test(f))
    .filter(f => /prepared\/|a1Readiness|deriveA1Readiness/.test(readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')))
  assert.deepEqual(offenders, [])
  assert.ok(!/prepared/.test(readFileSync(join(ROOT, 'vite.config.js'), 'utf8')))
})

console.log(`\ncheck-a1-readiness — ${passed} passed, ${failures.length} failed`)
if (failures.length) process.exitCode = 1
