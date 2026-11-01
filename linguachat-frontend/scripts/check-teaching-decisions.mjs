#!/usr/bin/env node
/*
 * check-teaching-decisions — every decision Lingua can take, with its reason (P3).
 *
 * Each scenario drives the real engine (scaffolding, teaching policy, learner
 * model, readiness, session planner, chat evidence) and asserts BOTH the
 * decision and the recorded reason, so a decision can always be explained
 * from data. It also checks the distinctions difficulty must make: a missing
 * skill vs an occasional slip, help vs independence, one modality vs another,
 * not understanding the task vs not knowing the answer, no evidence yet, and
 * a skill already shown somewhere else — and that taking longer or asking for
 * help is never treated as failing.
 *
 * Run: node scripts/check-teaching-decisions.mjs
 */
import assert from 'node:assert/strict'
import {
  updateScaffoldAfterTurn, makeScaffoldState, isIndependentEvidence, showsHintByDefault, showsModelAnswer,
  deriveInitialScaffold, REASONS, EVIDENCE,
} from '../src/learning/engine/scaffolding.js'
import { chooseTeaching, skillEvidence, evidenceSummary, observeTeaching } from '../src/learning/engine/teachingPolicy.js'
import { createLearnerModel, recordItemAttempt, recordCanDoAttempt, getDueReviews } from '../src/learning/engine/learnerModel.js'
import { buildSessionPlan } from '../src/learning/engine/session.js'
import { derivePreA1Readiness } from '../src/learning/curriculum/readiness.js'
import { productiveItemsOf } from '../src/learning/curriculum/preA1Map.js'
import { episodesOfLevel, playableLevelId } from '../src/learning/curriculum/levels.js'

const DAY = 86400000
const T0 = Date.UTC(2026, 9, 1, 9)
const ARC = episodesOfLevel(playableLevelId())
let passed = 0
const failures = []
function scenario(name, run) {
  try { run(); passed++; console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}
const open = { correct: true, evidenceKind: EVIDENCE.OPEN }
const step = (state, turn) => updateScaffoldAfterTurn(state, turn)

scenario('explain or let them try again: one slip leaves support alone, a second brings help back', () => {
  let s = makeScaffoldState('low')
  s = step(s, { correct: false, evidenceKind: EVIDENCE.OPEN })
  assert.equal(s.currentLevel, 'low', 'an occasional error: try again, nothing taken away')
  s = step(s, { correct: false, evidenceKind: EVIDENCE.OPEN })
  assert.equal(s.currentLevel, 'medium', 'the same difficulty twice: more explanation and model')
  assert.ok(s.reasonCodes.includes(REASONS.RECENT_RETRIES))
})

scenario('hints and model answers follow the support level', () => {
  assert.equal(showsHintByDefault('high'), true)
  assert.equal(showsHintByDefault('low'), false)
  assert.equal(showsModelAnswer('high'), true)
  assert.equal(showsModelAnswer('low'), false, 'at low support the learner produces without the answer')
})

scenario('support is withdrawn on evidence — and using help is not a dead end', () => {
  let s = makeScaffoldState('high')
  s = step(s, open); s = step(s, open)
  assert.equal(s.currentLevel, 'medium')
  assert.ok(s.reasonCodes.includes(REASONS.RECENT_INDEPENDENT_SUCCESS))
  let h = makeScaffoldState('medium')
  // two helped turns: the help is being used, so it stays available…
  h = step(h, { correct: true, assistanceUsed: true }); h = step(h, { correct: true, assistanceUsed: true })
  // …four clean helped turns: it has done its job; the learner is asked to try alone
  for (let i = 0; i < 4; i++) h = step(h, { correct: true, assistanceUsed: true })
  assert.ok(h.reasonCodes.includes(REASONS.FADED_AFTER_HELPED_SUCCESS), 'help fades after it keeps working')
})

scenario('help and independence are different evidence', () => {
  const free = { type: 'free_reply' }
  assert.equal(isIndependentEvidence({ step: free, assistanceUsed: false, correct: true }), true)
  assert.equal(isIndependentEvidence({ step: free, assistanceUsed: true, correct: true }), false)
  assert.equal(isIndependentEvidence({ step: { type: 'choice' }, correct: true }), false, 'recognition is not production')
})

scenario('a method that keeps failing is changed — by the teaching policy, with the reason', () => {
  const m = createLearnerModel()
  const obs = (day, success, instruction, independent = true) => observeTeaching(m, { id: `d${day}`, capability: 'ask_name',
    format: 'free_text', session: `day-${day}`, context: 'neutral', at: T0 + day * DAY, success, independent, assisted: !independent,
    instruction, channel: 'reading', retried: false })
  obs(0, true, 'concise', false); obs(1, false, 'concise'); obs(2, true, 'concise', false); obs(3, false, 'concise')
  const d = chooseTeaching(m, 'ask_name', ['concise', 'worked_example'], 'seed', 'instruction')
  assert.equal(d.reason, 'switch_after_failure')
  assert.equal(d.format, 'worked_example')
})

scenario('due language comes back as a retrieval activity in the session plan', () => {
  const m = createLearnerModel()
  const item = productiveItemsOf(ARC[0].canDoId)[0]
  recordItemAttempt(m, item, { correct: true, independent: true, evidenceKind: 'open', atMs: T0 })
  const later = T0 + 30 * DAY
  assert.ok(getDueReviews(m, later).includes(item), 'scheduled for review')
  const plan = buildSessionPlan(m, ARC, { atMs: later })
  assert.ok(plan.blocks.some(b => /review/.test(b.type) && JSON.stringify(b).includes(item)), 'the plan retrieves it')
})

scenario('enough evidence to move on is a stated threshold, not a feeling', () => {
  assert.equal(evidenceSummary(2, 0).status, 'insufficient')
  assert.equal(evidenceSummary(3, 3).status, 'uncertain')
  assert.equal(evidenceSummary(8, 0).status, 'supported')
  const fresh = derivePreA1Readiness(createLearnerModel(), { atMs: T0 })
  assert.equal(fresh.ready, false)
  assert.ok(fresh.reasonCodes.length > 0, 'and not being ready always says why')
})

scenario('difficulty: one modality is not the whole skill', () => {
  const m = createLearnerModel()
  for (let day = 1; day <= 4; day++) {
    for (const [channel, success] of [['reading', true], ['listening', false]]) {
      observeTeaching(m, { id: `${channel}${day}`, capability: 'introduction', format: 'free_text', session: `s${day}-${channel}`,
        context: 'neutral', at: T0 + day * DAY + (channel === 'listening' ? 1000 : 0), success, independent: true, assisted: false,
        instruction: 'concise', channel, listening: channel === 'listening', retried: false })
    }
  }
  const e = skillEvidence(m, 'introduction', T0 + 5 * DAY)
  assert.ok(e.written.successes > 0 && e.written.successes === e.written.samples, 'writing holds')
  assert.equal(e.listening.successes, 0, 'listening is where the difficulty is')
  assert.equal(e.speaking.status, 'not_assessed')
})

scenario('difficulty: not understanding the task gets help at once; taking longer is never a penalty', () => {
  let s = makeScaffoldState('low')
  s = step(s, { correct: true, switchedActivity: true })
  assert.equal(s.currentLevel, 'medium', 'asking for another way brings support on that turn')
  const a = step(makeScaffoldState('medium'), { ...open, elapsedMs: 5000 })
  const b = step(makeScaffoldState('medium'), { ...open, elapsedMs: 10 * 60 * 1000 })
  assert.deepEqual(a, b, 'time spent does not change the decision')
})

scenario('difficulty: a skill already shown elsewhere starts with less support', () => {
  const m = createLearnerModel()
  const canDo = ARC[0].canDoId
  for (const item of productiveItemsOf(canDo)) {
    recordItemAttempt(m, item, { correct: true, independent: true, evidenceKind: 'open', atMs: T0 })
    recordItemAttempt(m, item, { correct: true, independent: true, evidenceKind: 'open', atMs: T0 + DAY })
  }
  // shown in another context: a consolidation block of a daily session
  recordCanDoAttempt(m, canDo, { success: true, independent: true, context: 'session:consolidation', atMs: T0 + DAY })
  // (items alone, never attempted as the skill, are deliberately NOT enough)
  const itemsOnly = createLearnerModel()
  for (const item of productiveItemsOf(canDo)) {
    recordItemAttempt(itemsOnly, item, { correct: true, independent: true, evidenceKind: 'open', atMs: T0 })
    recordItemAttempt(itemsOnly, item, { correct: true, independent: true, evidenceKind: 'open', atMs: T0 + DAY })
  }
  assert.ok(!deriveInitialScaffold({ learnerModel: itemsOnly, targetCanDo: canDo }).reasonCodes.includes(REASONS.TARGET_CAN_USE))
  const known = deriveInitialScaffold({ learnerModel: m, targetCanDo: canDo, atMs: T0 + 2 * DAY })
  const unknown = deriveInitialScaffold({ learnerModel: createLearnerModel(), targetCanDo: canDo, atMs: T0 + 2 * DAY })
  assert.ok(known.reasonCodes.includes(REASONS.TARGET_CAN_USE), known.reasonCodes.join(','))
  const rank = { high: 0, medium: 1, low: 2 }
  assert.ok(rank[known.currentLevel] > rank[unknown.currentLevel], `${known.currentLevel} vs ${unknown.currentLevel}`)
})

console.log(`\ncheck-teaching-decisions — ${passed} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
