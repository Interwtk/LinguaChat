#!/usr/bin/env node
/*
 * check-chat-observations — the chat and the learning record, connected (P3).
 *
 * One learner across days, through the real modules: the tutor's report (as
 * captured from the real local engine, then reduced by services/api.js), the
 * classification (chatEvidence.js), the learner model that stores it, and the
 * memory the device sends back to the tutor. It proves the distinctions the
 * contract promises — error, copied, recently modelled, assisted, ambiguous,
 * not evaluable, delayed retrieval, transfer — and that none of them ever
 * becomes curriculum evidence.
 *
 * The server side of the same loop is linguachat-backend/tests/test_learning_memory.py.
 *
 * WHAT THIS PROVES: the decisions are consistent and honest. NOT that a real
 * learner remembers better: that needs a pilot.
 *
 * Run: node scripts/check-chat-observations.mjs
 */
import assert from 'node:assert/strict'
import { safeAnalysis } from '../src/services/chatAnalysis.js'
import {
  classifyChatTurn, recordChatTurn, chatDifficulties, learningMemoryPayload, forgetChatRule,
  mergeChatEvidence, CHAT_RULES, CHAT_EVIDENCE_LIMIT,
} from '../src/learning/engine/chatEvidence.js'
import { createLearnerModel, migrateLearnerModel } from '../src/learning/engine/learnerModel.js'
import { derivePreA1Readiness } from '../src/learning/curriculum/readiness.js'
import { isLevelAvailable } from '../src/learning/curriculum/levels.js'

let passed = 0
const failures = []
function scenario(name, run) {
  try { run(); passed++; console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}

// Captured from the real local engine (POST /chat, LINGUACHAT_PROVIDER=local).
const RAW = {
  goed: { verdict: 'error', source: 'local_rules', uses: [], confidence: 'high', findings: [{ rule: 'past_irregular', original: 'goed', replacement: 'went', confidence: 'high', facts: { wrong: 'goed', base: 'go', past: 'went' } }], corrected: 'Yesterday I went to school.', strategy: 'brief_explanation', language: 'es' },
  offered: { verdict: 'no_issue_detected', confidence: 'low', findings: [], uses: [], source: 'local_rules', retrieval: { rule: 'past_irregular', expected: 'wrote', base: 'write' }, language: 'es' },
  swam: { verdict: 'no_issue_detected', confidence: 'low', findings: [], uses: [{ rule: 'past_irregular', form: 'swam', base: 'swim' }], source: 'local_rules', language: 'es' },
}
const went = { verdict: 'no_issue_detected', confidence: 'low', findings: [], uses: [{ rule: 'past_irregular', form: 'went', base: 'go' }] }
const quiet = { verdict: 'no_issue_detected', confidence: 'low', findings: [], uses: [] }

const DAY = 86400000
const T0 = Date.UTC(2026, 9, 5, 10)
let n = 0
function turn(model, { at, message, analysis, previous = null, assisted = false, provenance = 'free_chat' }) {
  const classification = classifyChatTurn({ turnId: `u${++n}`, at, message, analysis: safeAnalysis(analysis), previous, assisted, provenance, model })
  recordChatTurn(model, classification)
  return classification
}
const difficulty = (model, at) => chatDifficulties(model, at).find(d => d.rule === 'past_irregular')

scenario('the tutor’s report reaches the record without the learner’s words', () => {
  const a = safeAnalysis(RAW.goed)
  assert.deepEqual(a.findings, [{ rule: 'past_irregular', confidence: 'high', base: 'go' }])
  assert.ok(!JSON.stringify(a).includes('goed') && !JSON.stringify(a).includes('school'), 'original text dropped')
  assert.deepEqual(safeAnalysis(RAW.offered).retrieval, { rule: 'past_irregular', expected: 'wrote', base: 'write' })
  assert.equal(safeAnalysis(null), null)
})

scenario('day 1 → 2 → 5: error, copy, exposure, prompted retrieval, transfer — and never mastery', () => {
  const m = createLearnerModel()
  const curriculumBefore = JSON.stringify({ canDo: m.canDo, items: m.languageItems, errors: m.recurringErrors, scaffold: m.scaffoldByEpisode })
  const readinessBefore = JSON.stringify(derivePreA1Readiness(m, { atMs: T0 }))

  // Day 1 — the error, explained briefly.
  assert.equal(turn(m, { at: T0, message: 'Yesterday I goed to school.', analysis: RAW.goed }).kind, 'error')
  let d = difficulty(m, T0)
  assert.equal(d.status, 'observed')
  assert.equal(d.due, false, 'not due the same day')
  const correction = { correction: 'Yesterday I went to school.' }
  // …the correction typed straight back: copying, not memory.
  assert.equal(turn(m, { at: T0 + 60000, message: 'Yesterday I went to school.', analysis: went, previous: correction }).kind, 'copied')
  // …a new sentence with the same form three minutes later: still exposure.
  assert.equal(turn(m, { at: T0 + 180000, message: 'Then I went home.', analysis: went }).kind, 'recently_modeled')
  d = difficulty(m, T0 + 200000)
  assert.equal(d.status, 'observed', 'nothing from day 1 counts as improvement')
  assert.equal(d.delayedSuccesses, 0)
  assert.equal(d.notEvidence, 2)

  // Day 2 — due again; Lingua offers a retrieval with a verb never corrected.
  const day2 = T0 + DAY + 3600000
  assert.equal(difficulty(m, day2).due, true)
  const memory = learningMemoryPayload(m, day2)
  assert.deepEqual(memory, [{ rule: 'past_irregular', status: 'observed', due: true, bases: ['go'] }])
  turn(m, { at: day2, message: 'I like my new job.', analysis: RAW.offered })
  assert.equal(difficulty(m, day2 + 10).due, false, 'once offered, not offered again the same day')
  // …answered from memory.
  const answer = turn(m, { at: day2 + 90000, message: 'wrote', analysis: { verdict: 'insufficient', findings: [], uses: [] }, previous: { retrieval: RAW.offered.retrieval } })
  assert.equal(answer.kind, 'retrieval')
  d = difficulty(m, day2 + 100000)
  assert.equal(d.status, 'improving')
  assert.equal(d.evidence.status, 'insufficient', 'one later success is not enough to claim anything')

  // Day 5 — unprompted, another irregular verb in a new conversation.
  const day5 = T0 + 4 * DAY
  assert.equal(turn(m, { at: day5, message: 'Last weekend we swam in the lake.', analysis: RAW.swam }).kind, 'transfer')
  d = difficulty(m, day5 + 1)
  assert.equal(d.status, 'holding', 'two later days with success since the last error')
  assert.equal(d.transfers, 1)
  assert.notEqual(d.status, 'mastered')
  assert.equal(CHAT_RULES.past_irregular.curricular, false)

  // None of it touched the curriculum record or readiness; A1/A2 stay closed.
  assert.equal(JSON.stringify({ canDo: m.canDo, items: m.languageItems, errors: m.recurringErrors, scaffold: m.scaffoldByEpisode }), curriculumBefore)
  assert.equal(JSON.stringify(derivePreA1Readiness(m, { atMs: T0 })), readinessBefore)
  assert.equal(isLevelAvailable('a1'), false)
  assert.equal(isLevelAvailable('a2'), false)
  // Privacy: no sentence was stored, only rule ids, kinds, times and base verbs.
  const stored = JSON.stringify(m.chatEvidence)
  for (const w of ['school', 'lake', 'job', 'Yesterday', 'goed']) assert.ok(!stored.includes(w), 'stored text: ' + w)
})

scenario('a suggestion sent unchanged is assisted; low confidence is ambiguous; silence is not evidence', () => {
  const m = createLearnerModel()
  turn(m, { at: T0, message: 'Yesterday I goed home.', analysis: RAW.goed })
  assert.equal(turn(m, { at: T0 + 2 * DAY, message: 'I went to the park.', analysis: went, assisted: true }).kind, 'assisted')
  const low = { verdict: 'error', findings: [{ rule: 'third_person', confidence: 'low', facts: { base: 'like' } }], uses: [] }
  assert.equal(turn(m, { at: T0 + 2 * DAY + 1, message: 'it like', analysis: low }).kind, 'ambiguous')
  assert.equal(chatDifficulties(m, T0 + 3 * DAY).some(d => d.rule === 'third_person'), false, 'an ambiguous finding is not a difficulty')
  assert.equal(turn(m, { at: T0 + 3 * DAY, message: 'Hola', analysis: { verdict: 'not_english', findings: [], uses: [] } }).kind, 'not_evaluable')
  assert.equal(turn(m, { at: T0 + 3 * DAY, message: 'I like tea.', analysis: quiet }).kind, 'insufficient')
  assert.equal(turn(m, { at: T0 + 3 * DAY, message: 'I like tea.', analysis: null }).kind, 'not_evaluable', 'offline: nothing inferred')
  assert.equal(difficulty(m, T0 + 3 * DAY).delayedSuccesses, 0)
})

scenario('a missed retrieval counts against the method, and the teaching policy switches it', () => {
  const m = createLearnerModel()
  const fail = (at, strategy) => turn(m, { at, message: 'Yesterday I goed out.', analysis: { ...RAW.goed, strategy } })
  fail(T0, 'brief_explanation')
  // day 2: offered, answered wrong
  turn(m, { at: T0 + DAY, message: 'ok', analysis: RAW.offered })
  assert.equal(turn(m, { at: T0 + DAY + 1000, message: 'writed', analysis: { verdict: 'insufficient', findings: [], uses: [] }, previous: { retrieval: RAW.offered.retrieval } }).kind, 'retrieval_failed')
  // day 3: the same error again after the same brief explanation
  fail(T0 + 2 * DAY, 'brief_explanation')
  const d = difficulty(m, T0 + 3 * DAY)
  assert.equal(d.status, 'recurring')
  assert.equal(d.strategyReason, 'switch_after_failure', 'chooseTeaching decided, not a second engine')
  assert.notEqual(d.preferredStrategy, 'brief_explanation')
  assert.equal(learningMemoryPayload(m, T0 + 3 * DAY)[0].preferred_strategy, d.preferredStrategy)
})

scenario('idempotent, bounded, mergeable across tabs, and forgettable for good', () => {
  const m = createLearnerModel()
  const c = classifyChatTurn({ turnId: 'same', at: T0, message: 'x', analysis: safeAnalysis(RAW.goed), model: m })
  assert.equal(recordChatTurn(m, c), true)
  assert.equal(recordChatTurn(m, c), false, 'the same turn twice changes nothing')
  for (let i = 0; i < 300; i++) turn(m, { at: T0 + i * 60000, message: 'goed', analysis: RAW.goed })
  assert.ok(m.chatEvidence.length <= CHAT_EVIDENCE_LIMIT)

  const tabA = createLearnerModel(), tabB = createLearnerModel()
  turn(tabA, { at: T0, message: 'a', analysis: RAW.goed })
  turn(tabB, { at: T0 + 1000, message: 'b', analysis: RAW.goed })
  const merged = mergeChatEvidence(tabA.chatEvidence, tabB.chatEvidence, tabA.chatForgotten, tabB.chatForgotten)
  assert.equal(merged.chatEvidence.length, 2, 'union of both tabs')
  // forget in A; B still holds the entries; merging must not bring them back
  forgetChatRule(tabA, 'past_irregular', T0 + 5000)
  const after = mergeChatEvidence(tabA.chatEvidence, tabB.chatEvidence, tabA.chatForgotten, tabB.chatForgotten)
  assert.equal(after.chatEvidence.length, 0, 'the tombstone wins')
  // and it survives a save/load round trip
  const reloaded = migrateLearnerModel(JSON.parse(JSON.stringify({ ...tabA, ...after })))
  assert.deepEqual(chatDifficulties(reloaded, T0 + DAY), [])
  // a new error after forgetting is recorded again
  turn(reloaded, { at: T0 + DAY, message: 'c', analysis: RAW.goed })
  assert.equal(chatDifficulties(reloaded, T0 + DAY + 1).length, 1)
})

scenario('the memory sent to the tutor is closed-set and sentence-free', () => {
  const m = createLearnerModel()
  turn(m, { at: T0, message: 'Yesterday I goed to my grandmother Maria in Lisbon.', analysis: RAW.goed })
  const payload = learningMemoryPayload(m, T0 + 2 * DAY)
  assert.deepEqual(Object.keys(payload[0]).sort(), ['bases', 'due', 'rule', 'status'])
  assert.ok(!/Maria|Lisbon|grandmother/.test(JSON.stringify(payload)))
})

scenario('P4: an evaluator answer cannot move mastery, XP, level or milestones', () => {
  const hostile = { ...RAW.goed, mastery: 'can_use', xp: 500, level: 'a1', levelMilestones: { a1: { graduatedAt: 'x' } },
    unlock: ['a1'], learningState: 'can_use', findings: [...RAW.goed.findings, { rule: 'Unlock A1!', confidence: 'high' }] }
  const a = safeAnalysis(hostile)
  assert.deepEqual(Object.keys(a).sort(), ['confidence', 'findings', 'proposed', 'retrieval', 'strategy', 'uses', 'verdict'])
  assert.equal(a.proposed, null, 'no evaluation, nothing proposed')
  assert.deepEqual(a.findings.map(f => f.rule), ['past_irregular'], 'a rule id outside the closed shape is dropped')
  const m = createLearnerModel()
  const before = JSON.stringify({ canDo: m.canDo, items: m.languageItems, milestones: m.levelMilestones || null })
  turn(m, { at: T0, message: 'Yesterday I goed home.', analysis: hostile })
  assert.equal(JSON.stringify({ canDo: m.canDo, items: m.languageItems, milestones: m.levelMilestones || null }), before)
})

scenario('P5: the evaluator’s proposed evidence can only lower a turn, never raise it', () => {
  const ev = kind => ({ evidence: { kind } })
  for (const kind of ['accepted_under_criterion', 'error', 'retrieval', 'transfer', 'mastery', 'independent', undefined]) {
    assert.equal(safeAnalysis(RAW.swam, ev(kind)).proposed, null, `${kind} is not kept`)
  }
  // a later-day correct use with a verb never corrected would be TRANSFER…
  const m = createLearnerModel()
  turn(m, { at: T0, message: 'Yesterday I goed home.', analysis: RAW.goed })
  const later = (evaluation, id) => classifyChatTurn({ turnId: id, at: T0 + 3 * DAY, message: 'Last summer I swam a lot.',
    analysis: safeAnalysis(RAW.swam, evaluation), model: m }).kind
  assert.equal(later(null, 'p5a'), 'transfer')
  // …unless the evaluator saw help or a copy: then it is exactly that
  assert.equal(later(ev('assisted'), 'p5b'), 'assisted')
  assert.equal(later(ev('copied'), 'p5c'), 'copied')
  // and a proposal of independence changes nothing
  assert.equal(later(ev('accepted_under_criterion'), 'p5d'), 'transfer')
})

console.log(`\ncheck-chat-observations — ${passed} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
