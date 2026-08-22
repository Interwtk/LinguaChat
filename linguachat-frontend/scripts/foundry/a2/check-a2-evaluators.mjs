#!/usr/bin/env node
/*
 * check-a2-evaluators — proves the A2 reference evaluators
 * (src/learning/levels/a2/evaluators.js) actually discriminate correct from
 * near-miss from nonsense, per the battery a2.md §11 requires for every new
 * intent: clearly correct, natural variant, near miss, wrong meaning, nonsense,
 * correct-meaning-but-insufficient-form (where form matters), and — new at A2 —
 * correct-single-clause-but-missing-required-second-clause.
 *
 * Also proves the two-clause CORE requirement's own testsRequired battery
 * (a2.json#coreEngineRequirements[1]): correct-clause-1 + nonsense-clause-2 must
 * fail, nonsense-clause-1 + correct-clause-2 must fail, an untaught connector
 * must not silently pass, and a taught connector with two valid clauses must
 * pass locally.
 *
 * This is level-owned QA (scripts/foundry/a2/**), run directly with node — it
 * does not touch package.json, so it is not wired into `npm run check:all`.
 */
import * as EV from '../../../src/learning/levels/a2/evaluators.js'

let failures = 0
let cases = 0

function expect(label, condition) {
  cases += 1
  if (!condition) {
    failures += 1
    console.error(`FAIL: ${label}`)
  }
}

function expectAccept(label, fn, text, opts = {}) {
  const r = fn(text, opts)
  expect(`${label} — "${text}" should be accepted`, r.completedObjective === true)
}
function expectRefuse(label, fn, text, opts = {}) {
  const r = fn(text, opts)
  expect(`${label} — "${text}" should NOT be accepted`, r.completedObjective !== true)
}

// ---- state_past_event ----
expectAccept('state_past_event clearly correct (regular)', EV.evaluateStatePastEvent, 'I worked yesterday.')
expectAccept('state_past_event clearly correct (irregular)', EV.evaluateStatePastEvent, 'I went to the office.')
expectAccept('state_past_event natural variant', EV.evaluateStatePastEvent, 'I studied at home yesterday')
expectRefuse('state_past_event wrong tense (present for past)', EV.evaluateStatePastEvent, 'I work at home.')
expectRefuse('state_past_event nonsense', EV.evaluateStatePastEvent, 'purple banana quickly')
expectRefuse('state_past_event empty', EV.evaluateStatePastEvent, '')

// ---- ask_past_event ----
expectAccept('ask_past_event clearly correct', EV.evaluateAskPastEvent, 'Did you work yesterday?')
expectRefuse('ask_past_event wrong tense (present question)', EV.evaluateAskPastEvent, 'Do you work?')
expectRefuse('ask_past_event nonsense', EV.evaluateAskPastEvent, 'banana quickly purple')

// ---- narrate_past_sequence (two-clause) ----
expectAccept('narrate_past_sequence correct clauses + taught connector', EV.evaluateNarratePastSequence, 'I went to work, then I had lunch.')
expectRefuse('narrate_past_sequence correct clause 1 + nonsense clause 2', EV.evaluateNarratePastSequence, 'I went to work then purple banana quickly')
expectRefuse('narrate_past_sequence nonsense clause 1 + correct clause 2', EV.evaluateNarratePastSequence, 'purple banana quickly then I had lunch')
expectRefuse('narrate_past_sequence missing connector', EV.evaluateNarratePastSequence, 'I went to work I had lunch')
expectAccept('narrate_past_sequence leading "First" does not break clause split', EV.evaluateNarratePastSequence, 'First I went to work, then I had lunch.')

// ---- state_future_plan ----
expectAccept('state_future_plan clearly correct', EV.evaluateStateFuturePlan, "I'm going to relax this weekend.")
expectRefuse('state_future_plan wrong tense (past for future)', EV.evaluateStateFuturePlan, 'I went to the cinema.')
expectRefuse('state_future_plan nonsense', EV.evaluateStateFuturePlan, 'quickly purple banana')

// ---- ask_future_plan ----
expectAccept('ask_future_plan clearly correct', EV.evaluateAskFuturePlan, 'Are you going to relax this weekend?')
expectRefuse('ask_future_plan wrong form', EV.evaluateAskFuturePlan, 'Do you relax?')

// ---- describe_person_or_place ----
expectAccept('describe_person_or_place multi-attribute', EV.evaluateDescribePersonOrPlace, "It's small and quiet.")
expectRefuse('describe_person_or_place single attribute only (insufficient form)', EV.evaluateDescribePersonOrPlace, "It's small.")
expectRefuse('describe_person_or_place nonsense', EV.evaluateDescribePersonOrPlace, 'purple banana quickly')

// ---- compare_things ----
expectAccept('compare_things comparative', EV.evaluateCompareThings, 'This café is quieter than that one.')
expectRefuse('compare_things superlative not taught', EV.evaluateCompareThings, 'This café is the quietest.')
expectRefuse('compare_things nonsense', EV.evaluateCompareThings, 'banana purple quickly')

// ---- state_opinion_with_reason (two-clause) ----
expectAccept('state_opinion_with_reason correct', EV.evaluateStateOpinionWithReason, 'I like it because it is quiet.')
expectRefuse('state_opinion_with_reason missing second clause (near miss, not nonsense)', EV.evaluateStateOpinionWithReason, 'I like it')
expectRefuse('state_opinion_with_reason nonsense reason', EV.evaluateStateOpinionWithReason, 'I like it because banana purple')

// ---- give_multi_step_directions ----
expectAccept('give_multi_step_directions within 3-step ceiling', EV.evaluateGiveMultiStepDirections, 'Go straight, then turn left.')
expectRefuse('give_multi_step_directions exceeds 3-step ceiling', EV.evaluateGiveMultiStepDirections, 'Go straight, then turn left, then turn right, then go straight again.')
expectRefuse('give_multi_step_directions nonsense', EV.evaluateGiveMultiStepDirections, 'banana purple quickly')

// ---- ask_availability / state_availability ----
expectAccept('ask_availability with date', EV.evaluateAskAvailability, 'Do you have a table for the tenth of June?')
expectRefuse('ask_availability missing date (near miss)', EV.evaluateAskAvailability, 'Do you have a table?')
expectAccept('state_availability', EV.evaluateStateAvailability, 'Yes, we have a table on the tenth.')

// ---- make_booking ----
expectAccept('make_booking with date+size', EV.evaluateMakeBooking, "I'd like to book a table for the tenth of June for two people.")
expectRefuse('make_booking missing all detail', EV.evaluateMakeBooking, "I'd like to book.")

// ---- spell_word — never treats spelling as a captured fact ----
expectAccept('spell_word exact match', EV.evaluateSpellWord, 'A L E X', { expected: 'Alex' })
expectRefuse('spell_word mismatch', EV.evaluateSpellWord, 'A L E S', { expected: 'Alex' })
{
  const r = EV.evaluateSpellWord('A L E X', { expected: 'Alex' })
  expect('spell_word result carries no persistable identity field', !('capturedFact' in r) && !('persistedValue' in r))
}

// ---- report_problem / ask_for_help ----
expectAccept('report_problem clearly correct', EV.evaluateReportProblem, "There's a problem with the room.")
expectRefuse('report_problem feeling is not a problem', EV.evaluateReportProblem, "I'm cold.")
expectAccept('ask_for_help clearly correct', EV.evaluateAskForHelp, 'Can you help me with this?')

// ---- invite_someone / respond_to_invitation ----
expectAccept('invite_someone clearly correct', EV.evaluateInviteSomeone, 'Would you like to go to the cinema?')
expectAccept('respond_to_invitation accept', EV.evaluateRespondToInvitation, "Yes, I'd like that.")
expectAccept('respond_to_invitation decline with reason', EV.evaluateRespondToInvitation, "I'd love to, but I'm busy.")
expectRefuse('respond_to_invitation decline missing reason', EV.evaluateRespondToInvitation, 'No, sorry.')

// ---- keep_a_longer_conversation_going (two-clause, generic connectors) ----
expectAccept('keep_conversation_going with taught connector', EV.evaluateKeepConversationGoing, 'I went to the cinema, and I saw an old friend there.')
expectRefuse('keep_conversation_going untaught connector', EV.evaluateKeepConversationGoing, 'I went to the cinema, however I saw an old friend.')

// ---- coverage: exactly the 17 blueprint intents, all with an implementation ----
expect('A2_NEW_INTENTS has exactly 17 entries', EV.A2_NEW_INTENTS.length === 17)
for (const intent of EV.A2_NEW_INTENTS) {
  expect(`A2_EVALUATORS has an implementation for "${intent}"`, typeof EV.A2_EVALUATORS[intent] === 'function')
}

console.log(`check-a2-evaluators: ${cases - failures}/${cases} cases passed`)
if (failures > 0) {
  console.error(`check-a2-evaluators: ${failures} FAILURES`)
  process.exit(1)
}
process.exit(0)
