#!/usr/bin/env node
/*
 * check-a1-arc6-arc7-evaluators — proves the arc 6/7 reference evaluators
 * (src/learning/levels/a1/evaluators.js) actually discriminate correct from
 * near-miss from nonsense, per the battery a2.md §11 / the A2 precedent
 * requires for every new intent: clearly correct, natural variant, near miss,
 * wrong meaning, nonsense, and correct-meaning-but-insufficient-form.
 *
 * Also proves the level's own documented architectural debt
 * (a1-blueprint.json#coreEngineRequirements.canAmbiguity) as a real refusal
 * battery: every phrasing of the Pre-A1 repair request that shares the
 * "Can you ___?" shell must be REFUSED by `evaluateAskAbility` (not silently
 * credited as an ability question), and must NOT regress — this file never
 * touches `evaluateRepairRequest`, so Pre-A1's own repair handling is
 * provably unaffected by construction, not just by assertion.
 *
 * This is level-owned QA (scripts/foundry/a1/**), run directly with node — it
 * does not touch package.json, so it is not wired into `npm run check:all`.
 */
import * as EV from '../../../src/learning/levels/a1/evaluators.js'

let failures = 0
let cases = 0

function expect(label, condition) {
  cases += 1
  if (!condition) { failures += 1; console.error(`FAIL: ${label}`) }
}
function expectAccept(label, fn, text, opts = {}) {
  const r = fn(text, opts)
  expect(`${label} — "${text}" should be accepted`, r.completedObjective === true)
}
function expectRefuse(label, fn, text, opts = {}) {
  const r = fn(text, opts)
  expect(`${label} — "${text}" should NOT be accepted`, r.completedObjective !== true)
}
function expectErrorType(label, fn, text, opts, errorType) {
  const r = fn(text, opts)
  expect(`${label} — "${text}" should have errorType "${errorType}", got "${r.errorType}"`, r.errorType === errorType)
}

// ---- state_ability ----
expectAccept('state_ability clearly correct positive', EV.evaluateStateAbility, 'I can swim.', { abilityForm: 'positive' })
expectAccept('state_ability clearly correct negative', EV.evaluateStateAbility, "I can't cook.", { abilityForm: 'negative' })
expectAccept('state_ability natural variant', EV.evaluateStateAbility, 'I can definitely dance', { abilityForm: 'positive' })
expectRefuse('state_ability wrong polarity (positive asked, negative given)', EV.evaluateStateAbility, "I can't swim.", { abilityForm: 'positive' })
expectRefuse('state_ability insufficient form (no activity named)', EV.evaluateStateAbility, 'I can.', {})
expectRefuse('state_ability nonsense', EV.evaluateStateAbility, 'purple banana quickly', {})
expectRefuse('state_ability empty', EV.evaluateStateAbility, '', {})
expectAccept('state_ability receptive-extension activity accepted', EV.evaluateStateAbility, 'I can ski.', { abilityForm: 'positive' })

// ---- ask_ability — THE canAmbiguity battery ----
expectAccept('ask_ability clearly correct', EV.evaluateAskAbility, 'Can you swim?', {})
expectAccept('ask_ability natural variant', EV.evaluateAskAbility, 'Can you cook well', {})
expectRefuse('ask_ability wrong question form (L1 transfer)', EV.evaluateAskAbility, 'Do you can swim?', {})
expectRefuse('ask_ability nonsense', EV.evaluateAskAbility, 'purple banana quickly', {})
expectRefuse('ask_ability empty', EV.evaluateAskAbility, '', {})
// the disambiguation itself — every Pre-A1 repair phrasing sharing the "Can you...?" shell
expectErrorType('ask_ability refuses repair "repeat"', EV.evaluateAskAbility, 'Can you repeat, please?', {}, 'ability_request_confusion')
expectErrorType('ask_ability refuses repair "say that again"', EV.evaluateAskAbility, 'Can you say that again?', {}, 'ability_request_confusion')
expectErrorType('ask_ability refuses repair "speak slowly"', EV.evaluateAskAbility, 'Can you speak slowly, please?', {}, 'ability_request_confusion')
expectErrorType('ask_ability refuses repair "speak more slowly"', EV.evaluateAskAbility, 'Can you speak more slowly?', {}, 'ability_request_confusion')
for (const activity of EV.ABILITY_ACTIVITIES) {
  expectAccept(`ask_ability accepts taught activity "${activity}"`, EV.evaluateAskAbility, `Can you ${activity}?`, {})
}

// ---- ask_how_to_say (repair_request/ask_how_to_say reference) ----
expectAccept('ask_how_to_say clearly correct', EV.evaluateAskHowToSay, 'How do you say that in English?', {})
expectAccept('ask_how_to_say natural variant', EV.evaluateAskHowToSay, 'How do you say nadar in English', {})
expectRefuse('ask_how_to_say incomplete (bare frame)', EV.evaluateAskHowToSay, 'How do you say?', {})
expectRefuse('ask_how_to_say nonsense', EV.evaluateAskHowToSay, 'purple banana quickly', {})
// must not be confused with the ability question it sits beside in episode 35
expectRefuse('ask_how_to_say refuses an ability question', EV.evaluateAskHowToSay, 'Can you swim?', {})

// ---- arrange_meeting ----
expectAccept('arrange_meeting propose: day + time', EV.evaluateArrangeMeeting, "Let's meet on Friday at seven.", { arrangeStage: 'propose' })
expectRefuse('arrange_meeting propose: day only (near miss)', EV.evaluateArrangeMeeting, "Let's meet on Friday.", { arrangeStage: 'propose' })
expectRefuse('arrange_meeting propose: time only (near miss)', EV.evaluateArrangeMeeting, "Let's meet at seven.", { arrangeStage: 'propose' })
expectRefuse('arrange_meeting propose: nonsense', EV.evaluateArrangeMeeting, 'purple banana quickly', { arrangeStage: 'propose' })
expectAccept('arrange_meeting place: taught place', EV.evaluateArrangeMeeting, "Let's meet at the station.", { arrangeStage: 'place' })
expectRefuse('arrange_meeting place: no place named', EV.evaluateArrangeMeeting, 'Let’s meet on Friday at seven.', { arrangeStage: 'place' })
expectAccept('arrange_meeting confirm: day + time + place, all three', EV.evaluateArrangeMeeting, "Let's meet on Friday at seven at the station.", { arrangeStage: 'confirm' })
expectRefuse('arrange_meeting confirm: missing place (near miss, not nonsense)', EV.evaluateArrangeMeeting, "Let's meet on Friday at seven.", { arrangeStage: 'confirm' })
expectRefuse('arrange_meeting confirm: nonsense', EV.evaluateArrangeMeeting, 'purple banana quickly', { arrangeStage: 'confirm' })
// natural variant word order for confirm
expectAccept('arrange_meeting confirm natural variant', EV.evaluateArrangeMeeting, "OK, so Friday at seven, at the cinema.", { arrangeStage: 'confirm' })

// ---- coverage: exactly the 3 blueprint intents this arc pair introduces, all with an implementation ----
expect('A1_ARC6_ARC7_NEW_INTENTS has exactly 3 entries', EV.A1_ARC6_ARC7_NEW_INTENTS.length === 3)
for (const intent of EV.A1_ARC6_ARC7_NEW_INTENTS) {
  expect(`A1_ARC6_ARC7_EVALUATORS has an implementation for "${intent}"`, typeof EV.A1_ARC6_ARC7_EVALUATORS[intent] === 'function')
}

console.log(`check-a1-arc6-arc7-evaluators: ${cases - failures}/${cases} cases passed`)
if (failures > 0) {
  console.error(`check-a1-arc6-arc7-evaluators: ${failures} FAILURES`)
  process.exit(1)
}
process.exit(0)
