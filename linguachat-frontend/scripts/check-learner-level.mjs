#!/usr/bin/env node
/*
 * check-learner-level — the learner's own level, without opening A1 (P5, block D).
 *
 * learnerLevel.deriveLearnerLevel keeps apart: the placement estimate, the
 * levels the product has open, the level the learner works in, the levels a
 * VALID milestone completes, and the next level (open or closed). Synthetic
 * learners play the real Pre-A1 curriculum (scripts/lib/journey.mjs).
 *
 * The two-levels-open case runs ONLY in an isolated bench (an explicit
 * `available` list passed to the function); levels.js is never touched, and
 * the last group proves A1 is still closed to every path a learner has.
 *
 * Run: node scripts/check-learner-level.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const store = new Map()
globalThis.localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k), clear: () => store.clear() }

const { deriveLearnerLevel, workingLevelId } = await import('../src/learning/curriculum/learnerLevel.js')
const { createLearnerModel, migrateLearnerModel } = await import('../src/learning/engine/learnerModel.js')
const { reconcileLevelMilestones } = await import('../src/learning/curriculum/graduation.js')
const { episodesOfLevel, isLevelAvailable, LEVELS, PRE_A1, A1 } = await import('../src/learning/curriculum/levels.js')
const { episodeRequest } = await import('../src/learning/curriculum/episodeContent.js')
const { planDay } = await import('../src/learning/engine/planner.js')
const { playCurriculum, playEpisode, consolidate, STRONG, DAY } = await import('./lib/journey.mjs')

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const TWO_OPEN = [PRE_A1, A1]     // BENCH ONLY
let passed = 0
const failures = []
function scenario(name, run) {
  try { run(); passed++; console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}
const clone = m => migrateLearnerModel(JSON.parse(JSON.stringify(m)))

const graduate = createLearnerModel()
const played = playCurriculum(graduate, { profile: STRONG, startMs: Date.now() - 60 * DAY })
const after = consolidate(graduate, { profile: STRONG, startMs: played.endedAt })
reconcileLevelMilestones(graduate, { atMs: after.endedAt })

console.log('check-learner-level')

scenario('a new learner: works in Pre-A1, has completed nothing, sees no next level', () => {
  const l = deriveLearnerLevel(createLearnerModel())
  assert.equal(l.working, PRE_A1)
  assert.deepEqual(l.completed, [])
  assert.equal(l.next, null)
  assert.equal(l.status, 'in_progress')
  assert.deepEqual(l.available, [PRE_A1])
})

scenario('a placement estimate (even A2 or C1) opens nothing and skips nothing', () => {
  for (const level of ['A2', 'C1', 'pre_a1', 'garbage']) {
    const l = deriveLearnerLevel(createLearnerModel(), { placement: { level, detectedLevel: level } })
    assert.equal(l.working, PRE_A1)
    assert.equal(l.placement.opensNothing, true)
    assert.equal(l.placement.verified, false)
  }
  assert.equal(deriveLearnerLevel(createLearnerModel(), { placement: { level: 'A2' } }).placement.estimate, 'A2')
  assert.equal(deriveLearnerLevel(createLearnerModel(), { placement: { level: 'garbage' } }).placement.estimate, null)
})

scenario('a learner cannot write a level: stray fields in the model change nothing', () => {
  const m = createLearnerModel()
  Object.assign(m, { level: 'b2', currentLevel: 'a1', workingLevel: 'c2', placement: 'C2' })
  assert.equal(workingLevelId(m), PRE_A1)
  assert.deepEqual(deriveLearnerLevel(m).completed, [])
})

scenario('Pre-A1 in progress', () => {
  const m = createLearnerModel()
  const first = episodesOfLevel(PRE_A1).slice(0, 4)
  let at = Date.now() - 10 * DAY
  for (const ep of first) { playEpisode(m, ep.id, { profile: STRONG, atMs: at }); at += DAY }
  const l = deriveLearnerLevel(m)
  assert.equal(l.working, PRE_A1)
  assert.equal(l.status, 'in_progress')
  assert.deepEqual(l.completed, [])
})

scenario('graduated from Pre-A1 with A1 closed: stays in Pre-A1, the next level is shown as closed', () => {
  const l = deriveLearnerLevel(graduate)
  assert.deepEqual(l.completed, [PRE_A1])
  assert.equal(l.working, PRE_A1, 'nowhere else to work: A1 is closed')
  assert.equal(l.status, 'graduated')
  assert.deepEqual(l.next, { id: A1, open: false })
  assert.equal(l.transition, 'next_level_closed')
})

scenario('contradictory evidence: an A1 milestone without Pre-A1 is not counted, and is reported', () => {
  const m = createLearnerModel()
  m.levelMilestones = { a1: { graduatedAt: '2026-01-01T00:00:00.000Z', evidenceVersion: 'a1.v0-uncalibrated', source: 'evidence' } }
  const l = deriveLearnerLevel(m)
  assert.deepEqual(l.completed, [])
  assert.deepEqual(l.inconsistencies, [{ level: A1, reason: 'earlier_level_not_completed' }])
  assert.equal(l.working, PRE_A1)
  // and a graduate whose readiness dropped since (reviews due) is still a graduate
  const lapsed = clone(graduate)
  const far = Date.now() + 400 * DAY
  assert.equal(deriveLearnerLevel(lapsed, { atMs: far }).status, 'graduated')
})

scenario('an invalid milestone is ignored', () => {
  for (const bad of [{ pre_a1: { graduatedAt: 'not a date', evidenceVersion: 'pre_a1.v1' } }, { pre_a1: 'yes' },
    { a1: { graduatedAt: '2026-01-01T00:00:00.000Z', evidenceVersion: 'pre_a1.v1' } }, { b2: { graduatedAt: '2026-01-01T00:00:00.000Z' } }]) {
    const m = createLearnerModel()
    m.levelMilestones = bad
    assert.deepEqual(deriveLearnerLevel(m).completed, [], JSON.stringify(bad))
  }
})

scenario('account switch A → B → A and restored progress: derived from each account’s own model', () => {
  const a = clone(graduate)
  const b = createLearnerModel()
  assert.equal(deriveLearnerLevel(a).status, 'graduated')
  assert.equal(deriveLearnerLevel(b).status, 'in_progress')
  assert.equal(deriveLearnerLevel(clone(a)).status, 'graduated', 'restored from a backup')
  assert.deepEqual(deriveLearnerLevel(clone(a)), deriveLearnerLevel(a))
})

scenario('BENCH, two levels hypothetically open: a graduate works in A1, a non-graduate stays in Pre-A1', () => {
  const g = deriveLearnerLevel(graduate, { available: TWO_OPEN })
  assert.equal(g.working, A1)
  assert.deepEqual(g.next, { id: A1, open: true })
  assert.equal(g.transition, 'next_level_open')
  const n = deriveLearnerLevel(createLearnerModel(), { available: TWO_OPEN })
  assert.equal(n.working, PRE_A1)
  // the planner, given the graduate's working level, plans A1's first episode
  const plan = planDay(graduate, episodesOfLevel(g.working))
  assert.equal(episodesOfLevel(A1)[0].id, plan.episodeId)
  // an A1 milestone (bench) with Pre-A1 done: both completed, working stays in A1 (nothing above is open)
  const both = clone(graduate)
  both.levelMilestones = { ...both.levelMilestones, a1: { graduatedAt: new Date().toISOString(), evidenceVersion: 'a1.v0-uncalibrated', source: 'bench' } }
  const lb = deriveLearnerLevel(both, { available: TWO_OPEN })
  assert.deepEqual(lb.completed, [PRE_A1, A1])
  assert.equal(lb.working, A1)
  assert.deepEqual(lb.next, { id: 'a2', open: false })
})

scenario('A1 stays closed: no learner state reaches an A1 episode', () => {
  assert.equal(isLevelAvailable(A1), false)
  assert.deepEqual(LEVELS.filter(l => l.available).map(l => l.id), [PRE_A1])
  for (const m of [createLearnerModel(), graduate, (() => { const x = clone(graduate); x.levelMilestones.a1 = { graduatedAt: new Date().toISOString(), evidenceVersion: 'a1.v0-uncalibrated', source: 'forged' }; return x })()]) {
    const working = workingLevelId(m)
    assert.equal(working, PRE_A1)
    assert.ok(episodesOfLevel(working).every(ep => !episodesOfLevel(A1).some(a => a.id === ep.id)))
    const plan = planDay(m, episodesOfLevel(working))
    assert.ok(!plan.episodeId || !episodesOfLevel(A1).some(a => a.id === plan.episodeId))
  }
  assert.equal(episodeRequest({ episodeId: episodesOfLevel(A1)[0].id }).reason, 'level_unavailable')
})

scenario('the screens ask for the learner’s working level, not the first open level', () => {
  const walk = dir => readdirSync(dir).flatMap(n => statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)])
  const users = walk(join(ROOT, 'src')).filter(f => /\.(jsx?|mjs)$/.test(f))
    .filter(f => /playableLevelId\(/.test(readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')))
    .map(f => f.slice(ROOT.length).replace(/\\/g, '/'))
  // levels.js only DEFINES it; P5 removed the last caller (episodeContent.currentLevelId, unused)
  assert.deepEqual(users, [])
  for (const f of ['src/components/today/TodayView.jsx', 'src/components/episode/CompletedEpisodes.jsx', 'src/context/AppContext.jsx',
    'src/components/layout/JourneyRail.jsx', 'src/components/identity/LearningSummaryCard.jsx', 'src/components/identity/LanguageIdentity.jsx',
    'src/components/setup/SetupFlow.jsx', 'src/services/placement.js']) {
    assert.ok(readFileSync(join(ROOT, f), 'utf8').includes('workingLevelId('), f)
  }
})

console.log(`\ncheck-learner-level — ${passed} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
