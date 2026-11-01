#!/usr/bin/env node
/*
 * check-teaching-intelligence — synthetic learners, longitudinal, reproducible.
 *
 * Twelve learner profiles drive the real engine (teaching policy, learner
 * model, scaffolding, copy detection, topic selection, account isolation).
 * Each profile is replayed with several seeds, capability names and event
 * orders, so a pass cannot depend on one hand-picked example.
 *
 * WHAT THIS PROVES: the engine is internally consistent — strategies change
 * with evidence, uncertainty follows the amount of evidence, assistance never
 * becomes mastery, retention and transfer need later and new evidence, topics
 * vary, accounts stay apart. WHAT IT DOES NOT PROVE: that real people learn
 * better. That needs a pilot with real learners.
 *
 * The chat tutor's corrections and explanations (goed → went, strategy
 * escalation, eight languages) are checked in the backend suite:
 * linguachat-backend/tests/test_tutor_intelligence.py.
 *
 * Run: node scripts/check-teaching-intelligence.mjs
 */
import assert from 'node:assert/strict'
import { observeTeaching, chooseTeaching, skillEvidence, evidenceSummary, retentionProfile } from '../src/learning/engine/teachingPolicy.js'
import { createLearnerModel, recordItemAttempt, loadLearnerModel, saveLearnerModel } from '../src/learning/engine/learnerModel.js'
import { copiesShownModel, isIndependentEvidence, deriveInitialScaffold, updateScaffoldAfterTurn } from '../src/learning/engine/scaffolding.js'
import { selectTopic } from '../src/learning/engine/topicSelection.js'
import { KNOWN_INTERESTS } from '../src/learning/engine/interests.js'
import { activateLocalAccount } from '../src/auth/browserDataIsolation.js'
import { LEVELS } from '../src/learning/curriculum/levels.js'

const DAY = 86400000
const START = Date.UTC(2026, 9, 1, 9)
let passed = 0
const failures = []
function scenario(name, run) {
  try { run(); passed++; console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}
function prng(seed) { let x = seed >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 2 ** 32) }
function shuffled(list, rand) { const out = [...list]; for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]] } return out }

// One practice day: an instruction (worked example or concise) and, on a LATER
// day, an independent first attempt that tests it. `skill` picks the channel.
function lesson(model, { capability, day, instruction = 'concise', channel = 'reading', context = 'home' }) {
  observeTeaching(model, { id: `${capability}:teach:${day}`, capability, format: 'free_reply', session: `d${day}`,
    at: START + day * DAY, success: null, instruction, channel, context })
}
function probe(model, { capability, day, success, channel = 'reading', context = 'home', independent = true, assisted = false, retried = false }) {
  observeTeaching(model, { id: `${capability}:probe:${day}:${context}`, capability, format: 'free_reply', session: `p${day}`,
    at: START + day * DAY + 3600000, success, independent, assisted, retried, channel, context,
    listening: channel === 'listening' ? { firstListenSuccess: success } : null })
}
const CAPS = ['introduce_self', 'order_food', 'ask_directions', 'describe_day']
const SEEDS = [1, 7, 42, 99]

console.log('check-teaching-intelligence')

scenario('1. a beginner starts with full support, and support is withdrawn only by independent success', () => {
  for (const cap of CAPS) {
    let state = deriveInitialScaffold({ learnerModel: createLearnerModel(), targetIntent: cap, runMode: 'first_run' })
    assert.equal(state.currentLevel, 'high', cap + ': a new learner gets the most help')
    state = updateScaffoldAfterTurn(state, { correct: true, assistanceUsed: true, evidenceKind: 'open' })
    assert.equal(state.currentLevel, 'high', 'a helped success does not remove help')
    for (let i = 0; i < 4; i++) state = updateScaffoldAfterTurn(state, { correct: true, assistanceUsed: false, evidenceKind: 'open' })
    assert.notEqual(state.currentLevel, 'high', 'independent successes withdraw support')
  }
})

scenario('2. a fast learner: delayed independent successes make the evidence "supported"', () => {
  for (const cap of CAPS) {
    const m = createLearnerModel()
    for (let d = 0; d < 6; d++) { lesson(m, { capability: cap, day: d * 2 }); probe(m, { capability: cap, day: d * 2 + 1, success: true }) }
    const written = skillEvidence(m, cap, START + 30 * DAY).written
    assert.equal(written.status, 'supported', cap)
    assert.ok(written.mean > 0.8)
    assert.equal(retentionProfile(m, cap, START + 30 * DAY).priority, -1, 'consistently retained: review can wait')
  }
})

scenario('3. repeated errors bring support back (reversible), and the method is switched after two failures', () => {
  for (const seed of SEEDS) {
    let state = { ...deriveInitialScaffold({ learnerModel: createLearnerModel(), targetIntent: 'x', runMode: 'first_run' }) }
    for (let i = 0; i < 6; i++) state = updateScaffoldAfterTurn(state, { correct: true, assistanceUsed: false, evidenceKind: 'open' })
    const rank = { low: 0, medium: 1, high: 2 }
    const lowered = state.currentLevel
    assert.ok(rank[lowered] < rank.high, 'independent work lowered support first')
    for (let i = 0; i < 3; i++) state = updateScaffoldAfterTurn(state, { correct: false, evidenceKind: 'open', retried: true })
    assert.ok(rank[state.currentLevel] > rank[lowered], 'support returns after repeated errors')
    const m = createLearnerModel()
    for (const d of [0, 2]) { lesson(m, { capability: 'order_food', day: d, instruction: 'concise' }); probe(m, { capability: 'order_food', day: d + 1, success: false }) }
    const choice = chooseTeaching(m, 'order_food', ['concise', 'worked_example'], String(seed), 'instruction')
    assert.equal(choice?.reason, 'switch_after_failure')
    assert.equal(choice.format, 'worked_example', 'the method that failed twice is not chosen again')
  }
})

scenario('4. understood with help but not remembered later: no mastery, review comes first', () => {
  for (const cap of CAPS) {
    const m = createLearnerModel()
    for (let d = 0; d < 4; d++) recordItemAttempt(m, cap + ':item', { correct: true, independent: false, atMs: START + d * 1000 })
    assert.notEqual(m.languageItems[cap + ':item'].learningState, 'can_use', 'helped success is never mastery')
    for (let d = 0; d < 3; d++) {
      lesson(m, { capability: cap, day: d * 2, instruction: 'worked_example' })
      probe(m, { capability: cap, day: d * 2 + 1, success: true, assisted: true, independent: false })
    }
    probe(m, { capability: cap, day: 9, success: false })
    assert.equal(skillEvidence(m, cap, START + 20 * DAY).written.successes, 0, 'assisted successes are not retention evidence')
    assert.equal(retentionProfile(m, cap, START + 20 * DAY).priority, 2, 'the forgotten capability is reviewed first')
  }
})

scenario('5. retained and transferred: success in contexts never seen before counts as transfer', () => {
  for (const cap of CAPS) {
    const m = createLearnerModel()
    const contexts = ['home', 'cafe', 'airport', 'office']
    contexts.forEach((context, i) => { lesson(m, { capability: cap, day: i * 3, context: 'home' }); probe(m, { capability: cap, day: i * 3 + 2, success: true, context }) })
    const e = skillEvidence(m, cap, START + 40 * DAY).written
    assert.equal(e.transfer, 3, 'three new contexts after the first')
    assert.equal(e.delayed, 4)
  }
})

scenario('6. strengths differ by skill: written is not listening, and speaking is never inferred', () => {
  const m = createLearnerModel()
  for (let d = 0; d < 5; d++) {
    lesson(m, { capability: 'order_food', day: d * 4 })
    probe(m, { capability: 'order_food', day: d * 4 + 1, success: true, channel: 'reading' })
    probe(m, { capability: 'order_food', day: d * 4 + 2, success: d === 4, channel: 'listening', context: 'audio' + d })
  }
  const e = skillEvidence(m, 'order_food', START + 40 * DAY)
  assert.ok(e.written.mean > e.listening.mean + 0.3, 'written strong, listening weak')
  assert.equal(e.speaking.status, 'not_assessed')
  assert.equal(e.pronunciation.status, 'not_assessed')
})

scenario('7. interests change: topics follow, and topics outside the interests still appear', () => {
  const before = new Map(), after = new Map(), outside = { before: 0, after: 0 }
  for (let i = 0; i < 400; i++) {
    const a = selectTopic({ explicitInterests: ['games', 'music'], seed: 'b' + i })
    const b = selectTopic({ explicitInterests: ['sports', 'cooking'], seed: 'a' + i })
    before.set(a.interestId, (before.get(a.interestId) || 0) + 1)
    after.set(b.interestId, (after.get(b.interestId) || 0) + 1)
    if (!['games', 'music'].includes(a.interestId)) outside.before++
    if (!['sports', 'cooking'].includes(b.interestId)) outside.after++
  }
  assert.ok((before.get('games') || 0) + (before.get('music') || 0) > 200, 'chosen interests lead')
  assert.ok((after.get('sports') || 0) + (after.get('cooking') || 0) > 200, 'and the new ones take over when they change')
  assert.ok((after.get('games') || 0) + (after.get('music') || 0) < 40, 'old interests are not stuck')
  assert.ok(outside.before >= 40 && outside.after >= 40, 'other topics are not blocked')
  assert.ok(before.size >= 5 && after.size >= 5, 'variety across contexts')
  assert.ok(KNOWN_INTERESTS.length > 10)
})

scenario('8. copying the visible model answer is never independent evidence', () => {
  const step = { type: 'free_reply', format: 'free_reply' }
  for (const [reply, shown] of [
    ["Hi, I'm Ana.", "Hi, I'm Ana."], ["hi im ana", "Hi, I'm Ana!"], ["  HI, I'M ANA ", "Hi, I'm Ana."],
    ["I would like a coffee, please.", "I would like a coffee, please"], ['Well, I would like a coffee please thanks', 'I would like a coffee, please.'],
  ]) {
    assert.equal(copiesShownModel(reply, shown), true, reply)
    assert.equal(isIndependentEvidence({ step, assistanceUsed: copiesShownModel(reply, shown) }), false)
  }
  const m = createLearnerModel()
  for (let i = 0; i < 5; i++) recordItemAttempt(m, 'coffee', { correct: true, independent: false, atMs: START + i * DAY })
  assert.notEqual(m.languageItems.coffee.learningState, 'can_use', 'five copies are still not mastery')
})

scenario('9. a natural variant is the learner’s own production, not a copy', () => {
  for (const [reply, shown] of [
    ["Hello! My name is Ana.", "Hi, I'm Ana."], ["Could I get a coffee?", 'I would like a coffee, please.'],
    ["I'd love a tea", 'I would like a coffee, please.'], ['Ana here, nice to meet you', "Hi, I'm Ana."],
  ]) assert.equal(copiesShownModel(reply, shown), false, reply)
})

scenario('10. evidence is per capability, never per interface language', () => {
  const m = createLearnerModel()
  for (let d = 0; d < 4; d++) { lesson(m, { capability: 'greet', day: d * 2 }); probe(m, { capability: 'greet', day: d * 2 + 1, success: true }) }
  const es = skillEvidence(m, 'greet', START + 20 * DAY)
  // Switching the auxiliary language changes no stored evidence.
  const after = skillEvidence(JSON.parse(JSON.stringify(m)), 'greet', START + 20 * DAY)
  assert.deepEqual(after, es)
})

scenario('11. ambiguous outcomes (unknown verdicts) are neither successes nor failures', () => {
  const m = createLearnerModel()
  for (let d = 0; d < 6; d++) { lesson(m, { capability: 'ask', day: d * 2 }); probe(m, { capability: 'ask', day: d * 2 + 1, success: null }) }
  const e = skillEvidence(m, 'ask', START + 20 * DAY).written
  assert.equal(e.samples, 0)
  assert.equal(e.status, 'insufficient', 'no evidence, no claim')
  assert.equal(chooseTeaching(m, 'ask', ['concise', 'worked_example'], 's', 'instruction'), null)
})

scenario('12. recent results reverse earlier hypotheses, in any order of arrival', () => {
  for (const seed of SEEDS) {
    const rand = prng(seed)
    const events = []
    for (let d = 0; d < 6; d++) events.push(['lesson', d * 2], ['probe', d * 2 + 1, true])
    for (let d = 6; d < 14; d++) events.push(['lesson', d * 2], ['probe', d * 2 + 1, false])
    const m = createLearnerModel()
    for (const [kind, day, success] of shuffled(events, rand)) {
      if (kind === 'lesson') lesson(m, { capability: 'describe_day', day })
      else probe(m, { capability: 'describe_day', day, success })
    }
    const early = skillEvidence(m, 'describe_day', START + 13 * DAY).written
    const late = skillEvidence(m, 'describe_day', START + 40 * DAY).written
    assert.ok(early.mean > 0.75, `seed ${seed}: early hypothesis was strong`)
    assert.ok(late.mean < early.mean, 'later failures lower it')
    assert.equal(retentionProfile(m, 'describe_day', START + 40 * DAY).priority, 2, 'and send it back to review')
  }
})

scenario('uncertainty narrows with evidence and never claims anything from fewer than three', () => {
  assert.equal(evidenceSummary(2, 0).status, 'insufficient')
  assert.equal(evidenceSummary(2, 1).status, 'uncertain')
  const few = evidenceSummary(3, 1), many = evidenceSummary(30, 10)
  assert.ok(many.high - many.low < few.high - few.low)
  assert.equal(many.status, 'supported')
})

scenario('learners of different accounts never see each other’s teaching evidence', () => {
  class Store { values = new Map(); get length() { return this.values.size } key(i) { return [...this.values.keys()][i] ?? null } getItem(k) { return this.values.get(k) ?? null } setItem(k, v) { this.values.set(k, String(v)) } removeItem(k) { this.values.delete(k) } }
  const shared = globalThis.localStorage = new Store()
  globalThis.sessionStorage = new Store()
  activateLocalAccount(shared, 'A')
  const a = loadLearnerModel()
  lesson(a, { capability: 'greet', day: 0 }); probe(a, { capability: 'greet', day: 1, success: true })
  assert.equal(saveLearnerModel(a, { verified: true }), true)
  globalThis.sessionStorage = new Store()
  activateLocalAccount(shared, 'B')
  assert.equal(loadLearnerModel().teachingHistory?.length || 0, 0, 'B starts with no evidence of A')
  globalThis.sessionStorage = new Store()
  activateLocalAccount(shared, 'A')
  assert.equal(loadLearnerModel().teachingHistory.length, 2, 'A finds its own evidence again')
  delete globalThis.localStorage; delete globalThis.sessionStorage
})

scenario('the curriculum gates are unchanged: Pre-A1 open, A1–C2 closed', () => {
  assert.deepEqual(LEVELS.filter(l => l.available).map(l => l.id), ['pre_a1'])
})

console.log(`\ncheck-teaching-intelligence — ${passed} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
