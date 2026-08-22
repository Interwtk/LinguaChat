/*
 * check-b1-arc5 — B1 arc 5 ("looking_ahead"), self-contained.
 *
 * Same shape and rigor as arcs 1-4's checks. `state_future_intent` carries
 * two can-dos via `intentForm` (`talk_about_plans_and_intentions`/
 * `talk_about_hopes_and_ambitions`), and within `intentForm: 'will_going_to'`
 * an evaluator-only `situationForm` (`decision`/`plan`/`prediction`) carries
 * b1.json's stated architectural risk for this arc. This arc has no separate
 * reinforcement episode — one episode per can-do, four total.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { B1_ARC5, B1_ARC5_ID, getB1Arc5Episode } from '../../../src/learning/levels/b1/episodes/b1Arc5.js'
import {
  B1_CAN_DO_INTENT, B1_REQUIRED_CAN_DOS, B1_SHOULD_CAN_DOS, B1_OPTIONAL_CAN_DOS, b1IntentsOf,
} from '../../../src/learning/levels/b1/b1Map.js'
import {
  evaluateB1Free, evaluateStateFutureIntent, evaluateStateRealCondition, evaluateStateHypothetical,
} from '../../../src/learning/levels/b1/evaluators.js'
import { B1_MODEL_ANSWER, B1_PROMPT } from '../../../src/learning/levels/b1/tables.js'
import { B1_INTENT_SLOTS } from '../../../src/learning/levels/b1/semanticSlots.js'
import { B1_ARC5_VOCAB } from '../../../src/learning/levels/b1/vocabulary.js'
import { B1_ARC5_COPY } from '../../../src/learning/levels/b1/i18nDraft.js'
import { createLearnerModel } from '../../../src/learning/engine/learnerModel.js'
import { playEpisode, answerFor, STRONG, ASSISTED } from './lib/journey.mjs'

const BLUEPRINT = JSON.parse(readFileSync(new URL('../../../../docs/curriculum/blueprints/b1.json', import.meta.url), 'utf8'))

let groups = 0
const ok = () => { groups += 1 }

/* ---- 1) the blueprint's arc 5, and the runtime's, are the same arc ---- */
const arc5 = BLUEPRINT.arcs.find(a => a.order === 5)
{
  assert.ok(arc5, 'the blueprint must describe an arc 5')
  assert.equal(arc5.id, B1_ARC5_ID)
  assert.equal(B1_ARC5.length, arc5.episodesInArc, 'episode count must match the blueprint')
  const runtimeCanDos = new Set(B1_ARC5.map(ep => ep.canDoId))
  for (const canDoId of arc5.newCanDos) assert.ok(runtimeCanDos.has(canDoId), `arc 5 must teach ${canDoId}`)
  ok()
}

/* ---- 2) capability -> intent registration, intentForm carries two can-dos ---- */
{
  assert.equal(B1_CAN_DO_INTENT.talk_about_plans_and_intentions, 'state_future_intent')
  assert.equal(B1_CAN_DO_INTENT.talk_about_hopes_and_ambitions, 'state_future_intent')
  assert.equal(B1_CAN_DO_INTENT.talk_about_real_conditions, 'state_real_condition')
  assert.equal(B1_CAN_DO_INTENT.imagine_a_hypothetical, 'state_hypothetical')
  assert.ok(B1_REQUIRED_CAN_DOS.includes('talk_about_plans_and_intentions'))
  assert.ok(B1_REQUIRED_CAN_DOS.includes('talk_about_hopes_and_ambitions'))
  assert.ok(!B1_REQUIRED_CAN_DOS.includes('talk_about_real_conditions'), 'talk_about_real_conditions is scope=should, not required')
  assert.ok(!B1_REQUIRED_CAN_DOS.includes('imagine_a_hypothetical'), 'imagine_a_hypothetical is scope=optional, not required')
  assert.ok(B1_SHOULD_CAN_DOS.includes('talk_about_real_conditions'))
  assert.ok(B1_OPTIONAL_CAN_DOS.includes('imagine_a_hypothetical'))
  assert.deepEqual(b1IntentsOf('talk_about_plans_and_intentions'), ['state_future_intent'])
  assert.deepEqual(b1IntentsOf('imagine_a_hypothetical'), ['state_hypothetical'])
  ok()
}

/* ---- 3) prerequisite graph matches b1.json (no invented order) ---- */
{
  const cdById = Object.fromEntries(BLUEPRINT.canDos.map(cd => [cd.id, cd]))
  assert.deepEqual(cdById.talk_about_plans_and_intentions.prerequisites, ['talk_about_future_plans'])
  assert.deepEqual(cdById.talk_about_hopes_and_ambitions.prerequisites, ['talk_about_plans_and_intentions'])
  assert.deepEqual(cdById.talk_about_real_conditions.prerequisites, ['talk_about_plans_and_intentions'])
  assert.deepEqual(cdById.imagine_a_hypothetical.prerequisites, ['talk_about_real_conditions'])
  const ep1 = getB1Arc5Episode('whats_the_plan')
  const ep2 = getB1Arc5Episode('someday')
  assert.deepEqual(ep1.prerequisites, [])
  assert.deepEqual(ep2.prerequisites, ['talk_about_plans_and_intentions'])
  ok()
}

/* ---- 4) vocabulary budget matches b1.json exactly ---- */
{
  const productive = Object.values(B1_ARC5_VOCAB).length
  assert.equal(arc5.vocabularyBudget.newProductive, 18)
  assert.equal(arc5.vocabularyBudget.newReceptive, 10)
  assert.equal(productive, 28, 'B1_ARC5_VOCAB must declare exactly 18+10 entries')
  ok()
}

/* ---- 5) semantic slots declared for all three new intents ---- */
{
  assert.deepEqual(new Set(B1_INTENT_SLOTS.state_future_intent), new Set(['activity', 'time_point', 'day']))
  assert.deepEqual(new Set(B1_INTENT_SLOTS.state_real_condition), new Set(['activity', 'time_point']))
  assert.deepEqual(new Set(B1_INTENT_SLOTS.state_hypothetical), new Set(['activity']))
  ok()
}

/* ---- 6) self-contained i18n: every key a step or table references resolves ---- */
{
  const keyFields = ['titleKey', 'goalKey', 'canDoNameKey', 'durationKey', 'sceneTitleKey', 'sceneBodyKey', 'explainKey', 'instructionKey', 'hintKey']
  let checked = 0
  for (const ep of B1_ARC5) {
    for (const field of keyFields) {
      if (ep[field]) { assert.ok(B1_ARC5_COPY[ep[field]], `missing i18n draft copy for ${field}=${ep[field]}`); checked += 1 }
    }
    for (const step of ep.steps) {
      for (const field of keyFields) {
        if (step[field]) { assert.ok(B1_ARC5_COPY[step[field]], `missing i18n draft copy for ${ep.id}.${field}=${step[field]}`); checked += 1 }
      }
      for (const opt of step.options || []) {
        assert.ok(B1_ARC5_COPY[opt.key], `missing i18n draft copy for option ${opt.key}`); checked += 1
      }
    }
  }
  assert.ok(checked > 25, 'expected a substantial number of keys to check')
  ok()
}

/* ---- 7) evaluator refusal / near-miss coverage — all situationForms + both other intents ---- */
const NONSENSE = 'purple bicycle Tuesday maybe'
{
  for (const situationForm of ['decision', 'plan', 'prediction', 'hope']) {
    const nonsense = evaluateStateFutureIntent(NONSENSE, { situationForm })
    assert.equal(nonsense.completedObjective, false, `nonsense must never pass (situationForm=${situationForm})`)
    assert.equal(nonsense.conclusive, false, 'an unrecognized attempt must be inconclusive, never a false confident reject')
    const empty = evaluateStateFutureIntent('', { situationForm })
    assert.equal(empty.understood, false)
  }
  // wrong-function near misses: a menu decision answered as a fixed plan
  const decisionAsPlan = evaluateStateFutureIntent("I'm going to have the pasta.", { situationForm: 'decision' })
  assert.equal(decisionAsPlan.completedObjective, false)
  assert.equal(decisionAsPlan.errorType, 'near_miss_wrong_function')
  const planAsDecision = evaluateStateFutureIntent("I'll visit my sister next week.", { situationForm: 'plan' })
  assert.equal(planAsDecision.completedObjective, false)
  assert.equal(planAsDecision.errorType, 'near_miss_wrong_function')
  const pastTense = evaluateStateFutureIntent('I had the pasta.', { situationForm: 'decision' })
  assert.equal(pastTense.completedObjective, false)
  assert.equal(pastTense.errorType, 'wrong_tense_past')
  const telegraphic = evaluateStateFutureIntent('have pasta', { situationForm: 'decision' })
  assert.equal(telegraphic.completedObjective, false)
  assert.equal(telegraphic.errorType, 'insufficient_form_telegraphic')

  // state_real_condition near misses
  const condNonsense = evaluateStateRealCondition(NONSENSE, {})
  assert.equal(condNonsense.completedObjective, false)
  assert.equal(condNonsense.conclusive, false)
  const conditionAsHypothetical = evaluateStateRealCondition("If it rained, I'd stay home.", {})
  assert.equal(conditionAsHypothetical.completedObjective, false)
  assert.equal(conditionAsHypothetical.errorType, 'wrong_conditional_hypothetical')
  const ifNoWill = evaluateStateRealCondition('If it rains tomorrow.', {})
  assert.equal(ifNoWill.completedObjective, false)
  assert.equal(ifNoWill.errorType, 'missing_will_clause')
  const willNoIf = evaluateStateRealCondition("I'll stay home.", {})
  assert.equal(willNoIf.completedObjective, false)
  assert.equal(willNoIf.errorType, 'missing_if_clause')

  // state_hypothetical near misses
  const hypNonsense = evaluateStateHypothetical(NONSENSE, {})
  assert.equal(hypNonsense.completedObjective, false)
  assert.equal(hypNonsense.conclusive, false)
  const frameNoAdvice = evaluateStateHypothetical('If I were you.', {})
  assert.equal(frameNoAdvice.completedObjective, false)
  assert.equal(frameNoAdvice.errorType, 'missing_advice')
  const adviceNoFrame = evaluateStateHypothetical("I'd ask for a refund.", {})
  assert.equal(adviceNoFrame.completedObjective, false)
  assert.equal(adviceNoFrame.errorType, 'missing_hypothetical_frame')
  ok()
}

/* ---- 8) dispatcher shape, matches evaluateFree's own unknown-kind contract ---- */
{
  const unknown = evaluateB1Free('some_future_arc_intent', 'anything', {})
  assert.equal(unknown.understood, false)
  assert.equal(unknown.conclusive, true)
  assert.equal(unknown.retryRequired, true)
  assert.equal(evaluateB1Free('state_future_intent', "I'll have the soup, thanks.", { situationForm: 'decision' }).completedObjective, true)
  assert.equal(evaluateB1Free('state_real_condition', "If I finish early, I'll call you.", {}).completedObjective, true)
  assert.equal(evaluateB1Free('state_hypothetical', "If I were you, I'd wait a little longer.", {}).completedObjective, true)
  ok()
}

/* ---- 9) MODEL_ANSWER / PROMPT tables cover all three of this arc's intents ---- */
{
  for (const kind of ['state_future_intent', 'state_real_condition', 'state_hypothetical']) {
    assert.ok(B1_MODEL_ANSWER[kind], `MODEL_ANSWER must have an entry for ${kind}`)
    assert.ok(B1_PROMPT[kind], `PROMPT must have an entry for ${kind}`)
  }
  for (const situationForm of ['decision', 'plan', 'prediction', 'hope']) {
    const answer = B1_MODEL_ANSWER.state_future_intent({ situationForm })
    assert.equal(evaluateStateFutureIntent(answer, { situationForm }).completedObjective, true, `MODEL_ANSWER(${situationForm}) must pass its own evaluator`)
  }
  assert.equal(evaluateStateRealCondition(B1_MODEL_ANSWER.state_real_condition({}), {}).completedObjective, true)
  assert.equal(evaluateStateHypothetical(B1_MODEL_ANSWER.state_hypothetical({}), {}).completedObjective, true)
  ok()
}

/* ---------------------------------------------------------------------------
 * 10) play the arc — strong and assisted learners, in prerequisite order
 * ------------------------------------------------------------------------- */
const DAY = 24 * 60 * 60 * 1000
const START = Date.parse('2026-01-05T00:00:00Z')

function freshModel() { return createLearnerModel() }

{
  const model = freshModel()
  const trace = []
  playEpisode(model, 'whats_the_plan', { profile: STRONG, atMs: START, trace })
  playEpisode(model, 'someday', { profile: STRONG, atMs: START + DAY, trace })
  playEpisode(model, 'if_that_happens', { profile: STRONG, atMs: START + 2 * DAY, trace })
  playEpisode(model, 'if_i_were_you', { profile: STRONG, atMs: START + 3 * DAY, trace })
  for (const r of trace) {
    assert.equal(r.independentEvidence, true, `${r.episodeId}: a strong learner must produce independent evidence`)
    assert.equal(r.rewarded, true, `${r.episodeId}: first completion must be rewarded`)
    assert.ok(r.xp > 0)
  }
  ok()
}

{
  const model = freshModel()
  const trace = []
  playEpisode(model, 'whats_the_plan', { profile: ASSISTED, atMs: START, trace })
  playEpisode(model, 'someday', { profile: ASSISTED, atMs: START + DAY, trace })
  playEpisode(model, 'if_that_happens', { profile: ASSISTED, atMs: START + 2 * DAY, trace })
  playEpisode(model, 'if_i_were_you', { profile: ASSISTED, atMs: START + 3 * DAY, trace })
  for (const r of trace) assert.equal(r.rewarded, true, `${r.episodeId}: assisted play still completes and rewards once`)
  // b1.json arc 5 autonomyTarget: "late: model answers withheld by default" —
  // every episode but if_i_were_you has no suggestionEn at all, so even a
  // fully assisted learner produces independent evidence there. if_i_were_you
  // deliberately keeps a hint available (imagine_a_hypothetical is optional),
  // so an assisted learner may legitimately lean on it there instead.
  for (const r of trace) {
    if (r.episodeId === 'if_i_were_you') continue
    assert.equal(r.independentEvidence, true, `${r.episodeId}: must still yield independent evidence`)
  }
  ok()
}

/* ---- 11) wrong-then-retry: a genuine near miss and nonsense must recover ---- */
{
  const model = freshModel()
  playEpisode(model, 'whats_the_plan', {
    profile: { ...STRONG, retries: ({ step }) => Boolean(step.evalKind) },
    atMs: START,
    wrongText: (step) => (step.situationForm === 'decision' ? "I'm going to have the pasta." : NONSENSE),
  })
  ok()
}
{
  const model = freshModel()
  playEpisode(model, 'if_that_happens', {
    profile: { ...STRONG, retries: ({ step }) => Boolean(step.evalKind) },
    atMs: START,
    wrongText: () => NONSENSE,
  })
  ok()
}

/* ---- 12) novel-context transfer: content never rehearsed in training ---- */
const NOVEL_DECISION = "I'll try the soup instead, thanks."
const NOVEL_HOPE = 'My dream is to open my own small business one day.'
{
  const model = freshModel()
  const trace = []
  playEpisode(model, 'whats_the_plan', {
    profile: STRONG, atMs: START, trace,
    answerOverride: (step) => (step.situationForm === 'decision' ? NOVEL_DECISION : answerFor(step)),
  })
  playEpisode(model, 'someday', {
    profile: STRONG, atMs: START + DAY, trace,
    answerOverride: () => NOVEL_HOPE,
  })
  for (const r of trace) assert.equal(r.independentEvidence, true, `${r.episodeId}: novel phrasing must still be judged structurally, not by memorized string`)
  ok()
}

/* ---- 13) replay / idempotency: a second pass adds evidence, never a second reward ---- */
{
  const model = freshModel()
  const first = playEpisode(model, 'whats_the_plan', { profile: STRONG, atMs: START })
  const replay = playEpisode(model, 'whats_the_plan', { profile: STRONG, atMs: START + DAY })
  assert.equal(first.rewarded, true)
  assert.equal(replay.rewarded, false, 'a replay must never earn a second reward')
  assert.equal(replay.xp, 0)
  ok()
}

/*
 * ---- 14) known gap, stated rather than faked: delayed retrieval ----
 * b1.json's `delayedRetrieval` for this arc's can-dos points at
 * `the_long_conversation` (arc 7's capstone), which does not exist in this
 * task's runtime yet. Logged, not silently skipped.
 */
console.log('  (delayed-retrieval proof deferred: the_long_conversation not yet authored)')

/* ---------------------------------------------------------------------------
 * 15) pedagogical journeys — varied learner-shaped attempts, >= 20 total
 * ------------------------------------------------------------------------- */
const DECISION_VARIANTS = [
  "I'll have the pasta, thanks.",
  "I'll try the soup instead.",
  "I'll take the blue one.",
  "I'll wait here, thanks.",
]
const PLAN_VARIANTS = [
  "I'm going to visit my sister next week.",
  "I'm going to book the flights tomorrow.",
  "I'm going to start a new course in September.",
  "I'm going to see a film with friends on Friday.",
]
const PREDICTION_VARIANTS = [
  'It will probably rain later.',
  'I think it will be busy this weekend.',
  "I'm sure it will go well.",
  'There will be a lot of traffic tonight.',
]
const HOPE_VARIANTS = [
  'I hope to travel more one day.',
  "I'd like to learn a new language someday.",
  "One day I'll write a book.",
  'My dream is to open my own small business.',
]
const CONDITION_VARIANTS = [
  "If it rains tomorrow, I'll stay home.",
  "If I finish early, I'll call you.",
  "If the shop is open, I'll buy some bread.",
  "I won't go if it's too cold.",
]
const HYPOTHETICAL_VARIANTS = [
  "If I were you, I'd ask for a refund.",
  "In your position, I'd wait a little longer.",
  "If I were you, I'd talk to your manager.",
  "In your position, I'd try a different approach.",
]

{
  let journeys = 0
  for (const [i, text] of DECISION_VARIANTS.entries()) {
    assert.equal(evaluateStateFutureIntent(text, { situationForm: 'decision', independent: true }).completedObjective, true, `decision variant ${i}: "${text}"`)
    journeys += 1
  }
  for (const [i, text] of PLAN_VARIANTS.entries()) {
    assert.equal(evaluateStateFutureIntent(text, { situationForm: 'plan', independent: true }).completedObjective, true, `plan variant ${i}: "${text}"`)
    journeys += 1
  }
  for (const [i, text] of PREDICTION_VARIANTS.entries()) {
    assert.equal(evaluateStateFutureIntent(text, { situationForm: 'prediction', independent: true }).completedObjective, true, `prediction variant ${i}: "${text}"`)
    journeys += 1
  }
  for (const [i, text] of HOPE_VARIANTS.entries()) {
    assert.equal(evaluateStateFutureIntent(text, { situationForm: 'hope', independent: true }).completedObjective, true, `hope variant ${i}: "${text}"`)
    journeys += 1
  }
  for (const [i, text] of CONDITION_VARIANTS.entries()) {
    assert.equal(evaluateStateRealCondition(text, { independent: true }).completedObjective, true, `condition variant ${i}: "${text}"`)
    journeys += 1
  }
  for (const [i, text] of HYPOTHETICAL_VARIANTS.entries()) {
    assert.equal(evaluateStateHypothetical(text, { independent: true }).completedObjective, true, `hypothetical variant ${i}: "${text}"`)
    journeys += 1
  }
  // near-miss + nonsense refusal boundary, all situationForms + both other
  // intents (already exercised structurally in group 7; counted here as
  // their own learner-shaped journeys)
  journeys += 11
  // strong/assisted full-arc plays, retry recovery, novel-context, replay
  // (groups 10-13 above)
  journeys += 8
  assert.ok(journeys >= 20, `expected >= 20 journeys, got ${journeys}`)
  console.log(`  looking_ahead: 4 episodes, ${journeys} journeys`)
  ok()
}

console.log(`\ncheck-b1-arc5 — OK  (${groups} groups verified)`)
