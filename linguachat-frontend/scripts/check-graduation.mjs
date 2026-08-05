/*
 * check-graduation — the one fact about a learner that only moves forwards.
 *
 * Readiness answers "is this person ready today" and is allowed to change its
 * mind. A milestone answers "did this person reach the bar", and nothing that
 * happens afterwards can make an afternoon they held a whole conversation
 * unaided not have happened.
 *
 * Everything here is played or persisted rather than asserted about intentions:
 * that finishing the curriculum is not graduating, that a due review does not
 * erase a graduation, that reconciling twice cannot move the date or pay a
 * second time, that saving and reloading keeps it, that a migration neither
 * invents one nor backdates one, that two devices merging keep the earlier
 * legitimate one, and that no screen anywhere is the thing that writes it.
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

import {
  createLearnerModel, saveLearnerModel, loadLearnerModel, MODEL_VERSION,
  sanitizeLevelMilestones, mergeLevelMilestones,
} from '../src/learning/engine/learnerModel.js'
import {
  reconcileLevelMilestones, preA1Milestone, hasGraduatedPreA1, preA1Status,
  EVIDENCE_VERSION, PRE_A1_LEVEL,
} from '../src/learning/curriculum/graduation.js'
import { derivePreA1Readiness } from '../src/learning/curriculum/readiness.js'
import { playCurriculum, consolidate, STRONG, DAY } from './lib/journey.mjs'

let groups = 0
const ok = () => { groups += 1 }

/* A localStorage good enough for the model, and nothing more. */
const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
}

/* One learner who really played, reused by most of the groups below. */
const graduate = createLearnerModel()
const played = playCurriculum(graduate, { profile: STRONG, startMs: Date.now() - 60 * DAY })
const catchUp = consolidate(graduate, { profile: STRONG, startMs: played.endedAt })
const graduatedAtMs = catchUp.endedAt

/* ---- 1) finishing the curriculum is not graduating ---- */
{
  const fresh = createLearnerModel()
  assert.equal(hasGraduatedPreA1(fresh), false, 'a new learner has graduated from nothing')
  assert.equal(preA1Status(fresh).state, 'in_progress')

  /*
   * A learner half way through: reconciliation must be able to run as often as
   * the engine likes without ever handing out a level.
   */
  const midway = createLearnerModel()
  playCurriculum(midway, { profile: STRONG, startMs: Date.now() - 60 * DAY, upTo: 9 })
  for (let i = 0; i < 5; i += 1) reconcileLevelMilestones(midway, { atMs: Date.now(), source: 'episode_run' })
  assert.equal(hasGraduatedPreA1(midway), false, 'graduation must not be reachable by reconciling repeatedly')
  ok()
}

/* ---- 2) graduation is earned from evidence, and says so ---- */
{
  assert.equal(hasGraduatedPreA1(graduate), true, 'a learner who played everything and consolidated must graduate')
  const m = preA1Milestone(graduate)
  assert.equal(m.evidenceVersion, EVIDENCE_VERSION, 'the criteria that produced it are recorded')
  assert.ok(['episode_run', 'daily_session'].includes(m.source), `written by the engine, not a screen: ${m.source}`)
  assert.ok(new Date(m.graduatedAt).getTime() > 0, 'and stamped with when')

  /* metadata only: no transcript, no score, nothing about the person */
  assert.deepEqual(Object.keys(m).sort(), ['evidenceVersion', 'graduatedAt', 'source'],
    'a milestone holds metadata and nothing else')
  ok()
}

/* ---- 3) a review falling due does not un-graduate anybody ---- */
{
  const before = preA1Milestone(graduate)

  // let a month pass with nothing practised: plenty of language is now overdue
  const later = graduatedAtMs + 40 * DAY
  const readiness = derivePreA1Readiness(graduate, { atMs: later })
  assert.equal(readiness.ready, false, 'a month of silence should leave real work to do')
  assert.ok(readiness.reasonCodes.includes('too_many_overdue_reviews'), readiness.reasonCodes.join(','))

  reconcileLevelMilestones(graduate, { atMs: later, source: 'daily_session' })
  assert.deepEqual(preA1Milestone(graduate), before, 'the milestone must be exactly as it was')
  assert.equal(preA1Status(graduate, { atMs: later }).state, 'graduated',
    'a learner with reviews due has reviews due, not a level to earn again')
  ok()
}

/* ---- 4) idempotent, and it pays for nothing ---- */
{
  const xpBefore = graduate.xp
  const gardenBefore = Object.keys(graduate.languageItems).length
  const runsBefore = Object.values(graduate.episodeRuns).flat().length
  const stamp = preA1Milestone(graduate).graduatedAt

  for (let i = 0; i < 10; i += 1) {
    reconcileLevelMilestones(graduate, { atMs: graduatedAtMs + i * DAY, source: 'daily_session' })
  }
  assert.equal(preA1Milestone(graduate).graduatedAt, stamp, 'the date must not move')
  assert.equal(Object.keys(graduate.levelMilestones).length, 1, 'and there must be exactly one milestone')
  assert.equal(graduate.xp, xpBefore, 'graduating must not pay XP')
  assert.equal(Object.keys(graduate.languageItems).length, gardenBefore, 'nor grow the Garden')
  assert.equal(Object.values(graduate.episodeRuns).flat().length, runsBefore, 'nor file a run')
  ok()
}

/* ---- 5) it survives a save and a reload ---- */
{
  store.clear()
  saveLearnerModel(graduate)
  const reloaded = loadLearnerModel()
  assert.equal(reloaded.version, MODEL_VERSION)
  assert.deepEqual(preA1Milestone(reloaded), preA1Milestone(graduate), 'a reload must find the same milestone')
  ok()
}

/* ---- 6) a migration neither invents a graduation nor backdates one ---- */
{
  /*
   * A v6 model that had finished everything: the older format had no milestone
   * field at all, so the honest result is a learner who has not graduated YET
   * and can earn it from the evidence they already have — never one who is
   * silently recorded as having graduated on some date nobody witnessed.
   */
  const old = JSON.parse(JSON.stringify({ ...graduate, version: 6 }))
  delete old.levelMilestones
  store.clear()
  store.set('lc2-learner-model-v1', JSON.stringify(old))
  const migrated = loadLearnerModel()
  assert.equal(migrated.version, MODEL_VERSION, 'the model must be brought forward')
  assert.equal(hasGraduatedPreA1(migrated), false, 'a migration must not invent a graduation')
  assert.deepEqual(migrated.levelMilestones, {}, 'and must leave the field empty rather than guess')

  /*
   * Reconciling today records nothing: the model is months stale, so its reviews
   * are all overdue and the learner is not ready NOW. A migration is not a way
   * to be handed a level for evidence that has since gone quiet.
   */
  assert.equal(reconcileLevelMilestones(migrated, { atMs: Date.now(), source: 'daily_session' }), null,
    'a migration of a stale model must not graduate anybody')
  assert.equal(hasGraduatedPreA1(migrated), false)

  /*
   * Asked at a moment when the evidence does hold, it is recorded — stamped with
   * that moment. Never with the historical date on which the criteria were first
   * met, which nobody witnessed and which no migration is entitled to assert.
   */
  const earned = reconcileLevelMilestones(migrated, { atMs: graduatedAtMs, source: 'episode_run' })
  assert.ok(earned, 'the evidence they already had must still count when it holds')
  assert.equal(earned.graduatedAt, new Date(graduatedAtMs).toISOString(),
    'and be dated when it was noticed, not backdated')
  ok()
}

/* ---- 7) malformed milestones are dropped, not trusted ---- */
{
  const junk = [
    { pre_a1: 'yes' },
    { pre_a1: { graduatedAt: 'not a date' } },
    { pre_a1: { evidenceVersion: 'x' } },
    { pre_a1: { graduatedAt: '2026-01-01T00:00:00.000Z', evidenceVersion: 'x'.repeat(200), source: 'y' } },
    { a1: { graduatedAt: '2026-01-01T00:00:00.000Z', evidenceVersion: 'pre_a1.v1', source: 'z' } },
  ]
  for (const bad of junk) {
    const cleaned = sanitizeLevelMilestones(bad)
    assert.equal(cleaned[PRE_A1_LEVEL] === undefined || typeof cleaned[PRE_A1_LEVEL] === 'object', true)
    if (cleaned[PRE_A1_LEVEL]) {
      assert.ok(new Date(cleaned[PRE_A1_LEVEL].graduatedAt).getTime() > 0, `kept a milestone with no valid date: ${JSON.stringify(bad)}`)
      assert.ok(cleaned[PRE_A1_LEVEL].evidenceVersion.length <= 32)
    }
  }
  assert.deepEqual(sanitizeLevelMilestones(null), {})
  assert.deepEqual(sanitizeLevelMilestones('graduated'), {})
  ok()
}

/* ---- 8) two devices: the earlier legitimate graduation wins ---- */
{
  const early = { pre_a1: { graduatedAt: '2026-05-01T10:00:00.000Z', evidenceVersion: EVIDENCE_VERSION, source: 'episode_run' } }
  const late = { pre_a1: { graduatedAt: '2026-06-01T10:00:00.000Z', evidenceVersion: EVIDENCE_VERSION, source: 'daily_session' } }

  assert.equal(mergeLevelMilestones(early, late).pre_a1.graduatedAt, early.pre_a1.graduatedAt,
    'the learner graduated the first time they reached the bar')
  assert.equal(mergeLevelMilestones(late, early).pre_a1.graduatedAt, early.pre_a1.graduatedAt,
    'whichever way round the two devices are merged')
  assert.equal(mergeLevelMilestones({}, late).pre_a1.graduatedAt, late.pre_a1.graduatedAt,
    'a device that never noticed must not delete one that did')
  assert.deepEqual(mergeLevelMilestones({}, {}), {}, 'and nothing appears out of two nothings')

  // a merge cannot conjure one out of junk
  assert.deepEqual(mergeLevelMilestones({ pre_a1: { graduatedAt: 'nope' } }, {}), {},
    'a broken record must not become a graduation by being merged')
  ok()
}

/* ---- 9) the same fact after a real second device merges in ---- */
{
  store.clear()
  saveLearnerModel(graduate)
  const stamp = preA1Milestone(graduate).graduatedAt

  // a second device that is behind on everything, including this
  const behind = createLearnerModel()
  playCurriculum(behind, { profile: STRONG, startMs: Date.now() - 60 * DAY, upTo: 6 })
  saveLearnerModel(behind)

  const merged = loadLearnerModel()
  assert.equal(preA1Milestone(merged)?.graduatedAt, stamp,
    'merging a device that had not noticed must not lose the graduation')
  ok()
}

/* ---- 10) nothing that renders is allowed to write it ---- */
{
  const files = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`
      if (entry.isDirectory()) walk(path)
      else if (/\.(jsx?|mjs)$/.test(entry.name)) files.push(path)
    }
  }
  walk('src/components')
  const writers = files.filter(f => /reconcileLevelMilestones/.test(readFileSync(f, 'utf8')))
  assert.deepEqual(writers, [], `graduation must never be written by a component: ${writers.join(', ')}`)

  // the engine's two end-of-evidence points are where it happens
  const runs = readFileSync('src/learning/engine/episodeRuns.js', 'utf8')
  const session = readFileSync('src/learning/engine/session.js', 'utf8')
  assert.ok(/reconcileLevelMilestones/.test(runs), 'the end of a run must reconcile')
  assert.ok(/reconcileLevelMilestones/.test(session), 'and so must the end of a session')

  // and readiness must not read the milestone: the two questions stay separate
  const readiness = readFileSync('src/learning/curriculum/readiness.js', 'utf8')
  assert.ok(!/levelMilestones|graduat/i.test(readiness.replace(/\/\*[\s\S]*?\*\//g, '')),
    'readiness must not know whether the learner has graduated')
  ok()
}

/* ---- 11) what the screen says, and what it must never promise ---- */
{
  const home = readFileSync('src/components/today/TodayView.jsx', 'utf8')

  /*
   * Three states, told apart. Before this, Home knew "finished" and "ready
   * today", so a learner who had graduated a month earlier and had two reviews
   * due was shown the consolidation message again — as if the afternoon they
   * earned it had been taken back.
   */
  for (const key of ['preA1GraduatedTitle', 'preA1GraduatedBody', 'preA1DoneTitle', 'preA1ReadyTitle']) {
    assert.ok(home.includes(key), `Home must be able to say ${key}`)
  }
  assert.ok(/preA1Status/.test(home), 'and must ask for the state rather than re-deriving it')
  assert.ok(/preA1GraduatedReviewsDue/.test(home),
    'a graduate with reviews due is told about practice, not about being un-ready')

  /*
   * The celebration is a fact about this browser. Keeping it in the milestone
   * would make a pedagogical record depend on whether a screen had rendered, and
   * a learner on a second device would either lose their graduation or be
   * congratulated for it twice.
   */
  assert.ok(/lc2-pre-a1-celebrated/.test(home), 'the celebration must remember itself locally')
  const graduation = readFileSync('src/learning/curriculum/graduation.js', 'utf8')
  assert.ok(!/celebrat/i.test(graduation), 'and the milestone must know nothing about celebrating')
  const milestoneKeys = Object.keys(preA1Milestone(graduate))
  assert.ok(!milestoneKeys.some(k => /celebrat|seen|shown/i.test(k)),
    `a milestone records evidence, not what was displayed: ${milestoneKeys.join(', ')}`)

  /*
   * No door to a level that does not exist. Pre-A1 is the whole product today,
   * and offering "Start A1" would be a promise nobody can keep.
   */
  const components = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`
      if (entry.isDirectory()) walk(path)
      else if (/\.jsx?$/.test(entry.name)) components.push([path, readFileSync(path, 'utf8')])
    }
  }
  walk('src/components')
  for (const [path, src] of components) {
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    assert.ok(!/startA1|beginA1|a1Start|startLevelA1/i.test(code), `${path} offers a level that does not exist`)
  }
  ok()
}

console.log(`\ncheck-graduation — OK  (${groups} graduation groups verified)`)
