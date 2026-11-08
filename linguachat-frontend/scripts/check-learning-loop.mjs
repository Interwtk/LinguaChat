#!/usr/bin/env node
/*
 * check-learning-loop — one learner, end to end, across days (P2).
 *
 * error → the capability it belongs to → an explanation → the same error again
 * → a dedicated retry block → help (counted as practice, never as ability) →
 * later independent retrieval fails twice → Lingua switches method → a later,
 * independent success in a context never used before → the "Tú" summary says
 * so, and still does not call anything mastered early.
 *
 * Every step drives the real engine modules (teaching policy, learner model,
 * session planner, topic selection, the "Tú" summary). The chat side of the
 * same loop (goed → went, explanation → contrast → guided retrieval, eight
 * languages) is the backend test test_full_learning_flow_irregular_past.
 *
 * WHAT THIS PROVES: the decisions are wired together and stay honest about
 * evidence. WHAT IT DOES NOT PROVE: that a real person learns better.
 *
 * Run: node scripts/check-learning-loop.mjs
 */
import assert from 'node:assert/strict'
import { observeTeaching, chooseTeaching, skillEvidence } from '../src/learning/engine/teachingPolicy.js'
import { createLearnerModel, recordItemAttempt, markRecurringError, learningStateOf } from '../src/learning/engine/learnerModel.js'
import { buildSessionPlan } from '../src/learning/engine/session.js'
import { selectTopic } from '../src/learning/engine/topicSelection.js'
import { KNOWN_INTERESTS } from '../src/learning/engine/interests.js'
import { learnerSummary } from '../src/learning/engine/learnerSummary.js'
import { derivePreA1Readiness } from '../src/learning/curriculum/readiness.js'
import { episodesOfLevel, playableLevelId } from '../src/learning/curriculum/levels.js'

const DAY = 86400000
const START = Date.UTC(2026, 9, 1, 9)
const ARC = episodesOfLevel(playableLevelId())
let passed = 0
const failures = []
function scenario(name, run) {
  try { run(); passed++; console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}

const CAP = 'introduction'
const ITEM = 'loop:i_am'
const METHODS = ['concise', 'worked_example']
function turn(model, day, { instruction, success, independent = true, assisted = false, retried = false, context = 'neutral' }) {
  const at = START + day * DAY
  observeTeaching(model, {
    id: `loop:${day}:${instruction}:${assisted ? 'a' : 'i'}`, capability: CAP, format: 'free_text', session: `day-${day}`,
    context, at, success, independent, assisted, instruction, channel: 'reading', retried,
  })
  recordItemAttempt(model, ITEM, { correct: success, independent: independent && !assisted && !retried, evidenceKind: 'open', atMs: at, capability: CAP })
  if (!success) markRecurringError(model, 'missing_copula', at)
}

scenario('the whole loop: error, retry block, help, failed retrievals, method switch, transfer — no early mastery', () => {
  const m = createLearnerModel()
  assert.equal(learnerSummary(m, START).empty, true, 'a new learner sees an honest empty state')

  // Day 0 — taught concisely, the first answer misses the verb "to be".
  turn(m, 0, { instruction: 'concise', success: false })
  assert.equal(m.recurringErrors[0].errorType, 'missing_copula')
  const day1Plan = buildSessionPlan(m, ARC, { atMs: START + 1 * DAY })
  assert.ok(!day1Plan.blocks.some(b => b.type === 'targeted_retry'), 'one slip is not yet a pattern')

  // Day 1 — the same error again, on its own: now it is a pattern.
  turn(m, 1, { instruction: 'concise', success: false })
  const day2Plan = buildSessionPlan(m, ARC, { atMs: START + 2 * DAY })
  const retry = day2Plan.blocks.find(b => b.type === 'targeted_retry')
  assert.ok(retry, 'a repeated error earns a dedicated retry block')
  assert.equal(retry.objective, CAP, 'aimed at the capability that failed')

  // Day 2 — with help it goes well. Practice, not ability.
  turn(m, 2, { instruction: 'concise', success: true, independent: false, assisted: true })
  assert.equal(skillEvidence(m, CAP, START + 2 * DAY).written.successes, 0, 'a helped answer is not evidence')
  assert.notEqual(learningStateOf(m, ITEM), 'can_use')

  // Day 3 — later, on their own: still fails. Same method failed twice.
  turn(m, 3, { instruction: 'concise', success: false })
  const decision = chooseTeaching(m, CAP, METHODS, 'loop-seed', 'instruction')
  assert.equal(decision?.reason, 'switch_after_failure', 'two failed later retrievals change the method')
  assert.equal(decision.format, 'worked_example')

  // Day 4 — taught the other way. Day 6 — on their own, in a new context.
  turn(m, 4, { instruction: decision.format, success: true, independent: false, assisted: true })
  turn(m, 6, { instruction: decision.format, success: true, context: 'travel' })
  const evidence = skillEvidence(m, CAP, START + 6 * DAY)
  assert.equal(evidence.written.successes, 1)
  assert.equal(evidence.written.transfer, 1, 'success in a context never used before counts as transfer')
  assert.notEqual(learningStateOf(m, ITEM), 'can_use', 'one independent success is not "can use"')

  let summary = learnerSummary(m, START + 6 * DAY)
  assert.equal(summary.empty, false)
  assert.equal(summary.improved, 1, 'missed before, then done alone on a later day: improvement with evidence')
  assert.ok(!['holding'].includes(summary.skills.written.status), 'three probes cannot say "holding": ' + summary.skills.written.status)
  assert.equal(summary.skills.speaking.status, 'not_assessed')
  assert.equal(summary.skills.pronunciation.status, 'not_assessed')
  assert.ok(summary.help.assisted >= 2 && summary.help.own >= 1, 'help is shown apart from own answers')

  // Day 9 — again alone, another new context: now the phrase is usable…
  turn(m, 9, { instruction: decision.format, success: true, context: 'food' })
  assert.equal(learningStateOf(m, ITEM), 'can_use', 'two independent uses on different days')
  summary = learnerSummary(m, START + 9 * DAY)
  assert.equal(summary.words.canUse, 1)
  // …but four probes, two of them failures, are still not a verdict.
  assert.equal(summary.skills.written.status, 'uncertain')
  assert.equal(derivePreA1Readiness(m, { atMs: START + 9 * DAY }).ready, false, 'the level is not declared done')
  assert.ok(summary.focus, 'a next goal is always offered while not ready')
})

scenario('help never turns into demonstrated skill, however much of it', () => {
  const m = createLearnerModel()
  for (let day = 0; day < 30; day++) turn(m, day, { instruction: 'concise', success: true, independent: false, assisted: true })
  const summary = learnerSummary(m, START + 30 * DAY)
  assert.equal(summary.skills.written.successes, 0)
  assert.equal(summary.skills.written.status, 'insufficient')
  assert.equal(summary.improved, 0)
  assert.notEqual(learningStateOf(m, ITEM), 'can_use')
})

scenario('massed same-day success counts once; "holding" needs several later days', () => {
  const m = createLearnerModel()
  turn(m, 0, { instruction: 'concise', success: true, independent: false, assisted: true })
  for (let i = 0; i < 10; i++) {
    observeTeaching(m, { id: `mass:${i}`, capability: CAP, format: 'free_text', session: 'day-1', context: 'neutral',
      at: START + DAY + i * 60000, success: true, independent: true, assisted: false, instruction: 'concise', channel: 'reading', retried: false })
  }
  assert.equal(learnerSummary(m, START + 2 * DAY).skills.written.successes, 1, 'ten answers in one sitting are one occasion')
  for (let day = 2; day < 9; day++) turn(m, day, { instruction: 'concise', success: true })
  assert.equal(learnerSummary(m, START + 9 * DAY).skills.written.status, 'holding')
})

scenario('listening and writing are reported apart; speaking is never inferred', () => {
  const m = createLearnerModel()
  for (let day = 0; day < 8; day++) {
    observeTeaching(m, { id: `w:${day}`, capability: CAP, format: 'free_text', session: `day-${day}`, context: 'neutral',
      at: START + day * DAY, success: true, independent: true, assisted: false, instruction: 'concise', channel: 'reading', retried: false })
  }
  const summary = learnerSummary(m, START + 8 * DAY)
  assert.equal(summary.skills.written.status, 'holding')
  assert.equal(summary.skills.listening.status, 'insufficient', 'reading well says nothing about listening')
  assert.equal(summary.skills.speaking.status, 'not_assessed')
  assert.equal(summary.improved, 0, 'never missed, so nothing to call an improvement')
})

scenario('interests shape most days without taking over; tastes can change; nothing sensitive is offered', () => {
  const run = (interests, days, from = 0, dismissed = []) => {
    const picks = []
    let recent = []
    for (let d = from; d < from + days; d++) {
      const topic = selectTopic({ explicitInterests: interests, recentTopics: recent, dismissedTopics: dismissed, strength: 'medium', seed: `learner:${d}` })
      picks.push(topic)
      if (topic.interestId) recent = [topic.interestId, ...recent].slice(0, 2)
    }
    return picks
  }
  const first = run(['music', 'travel'], 60)
  const own = first.filter(p => ['music', 'travel'].includes(p.interestId)).length
  assert.ok(own > 30, 'chosen interests are the majority: ' + own)
  assert.ok(own < 60, 'but never every day: ' + own)
  assert.ok(first.some(p => !['music', 'travel'].includes(p.interestId)), 'new or neutral situations still appear')
  const later = run(['cooking'], 40, 60)
  assert.ok(later.filter(p => p.interestId === 'cooking').length > 15, 'a changed taste takes effect')
  assert.ok(later.filter(p => p.interestId === 'music').length < 5, 'an old taste stops dominating')
  const dismissed = run(['music', 'travel'], 40, 0, ['music'])
  assert.ok(!dismissed.some(p => p.interestId === 'music'), 'a declined topic is not chosen')
  const SENSITIVE = /health|medical|religion|politic|sex|ethnic|race|disab|finance|bank|money|diet|weight/i
  assert.ok(!KNOWN_INTERESTS.some(id => SENSITIVE.test(id)), 'the catalogue holds no sensitive categories')
})

console.log(`\ncheck-learning-loop — ${passed} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
