/*
 * check-c2-multi-turn-spans — C2-specific proof that
 * `coreEngineRequirements[0]` (multi_turn_evaluation_span) has real content
 * to be implemented against, not just a declared capability flag. Every
 * capability c2.json tags `evaluationSpan: 'multiTurn'` must have at least
 * one authored step that (a) also carries `evaluationSpan: 'multiTurn'` and
 * (b) carries a non-empty `turnContext` array giving the evaluator the
 * preceding turn(s) it needs — matching
 * `c2EvaluationContracts.js`'s `C2_MULTI_TURN_SPAN_FIXTURES` spec.
 */
import assert from 'node:assert/strict'

import { ALL_EPISODES } from './check-c2-arc-content.mjs'
import { C2_MULTI_TURN_EVALUATION_SPAN_CAN_DO_IDS, C2_GRADUATION_CAPSTONE_ID } from '../../../src/learning/levels/c2/c2Capabilities.js'
import { C2_MULTI_TURN_SPAN_FIXTURES } from '../../../src/learning/levels/c2/c2EvaluationContracts.js'

let groups = 0
const ok = () => { groups += 1 }

const stepsByCanDo = new Map()
for (const ep of ALL_EPISODES) {
  for (const step of ep.steps) {
    if (!step.canDoId) continue
    if (!stepsByCanDo.has(step.canDoId)) stepsByCanDo.set(step.canDoId, [])
    stepsByCanDo.get(step.canDoId).push(step)
  }
}

/* ---- 1) every multiTurn-tagged capability (plus the graduation capstone,
    which is always multiTurn) has at least one step matching the span spec ---- */
{
  const spanCapabilityIds = new Set([...C2_MULTI_TURN_EVALUATION_SPAN_CAN_DO_IDS, C2_GRADUATION_CAPSTONE_ID])
  for (const canDoId of spanCapabilityIds) {
    const steps = stepsByCanDo.get(canDoId) || []
    const spanSteps = steps.filter((s) => s.evaluationSpan === 'multiTurn' && Array.isArray(s.turnContext) && s.turnContext.length > 0)
    assert.ok(spanSteps.length > 0, `${canDoId} declares evaluationSpan:'multiTurn' but has no step carrying both evaluationSpan:'multiTurn' and a non-empty turnContext`)
  }
  ok()
}

/* ---- 2) every declared C2_MULTI_TURN_SPAN_FIXTURES entry names either a
    real multiTurn-tagged capability, or the one documented exception
    (repair_a_misunderstanding_at_intention_level — c2EvaluationContracts.js's
    own header comment explains why it needs turn context even though
    c2.json does not tag it evaluationSpan:'multiTurn') ---- */
{
  const spanCapabilityIds = new Set([...C2_MULTI_TURN_EVALUATION_SPAN_CAN_DO_IDS, C2_GRADUATION_CAPSTONE_ID])
  const DOCUMENTED_NON_TAGGED_EXCEPTION = 'repair_a_misunderstanding_at_intention_level'
  for (const fixture of C2_MULTI_TURN_SPAN_FIXTURES) {
    const allowed = spanCapabilityIds.has(fixture.canDoId) || fixture.canDoId === DOCUMENTED_NON_TAGGED_EXCEPTION
    assert.ok(allowed, `C2_MULTI_TURN_SPAN_FIXTURES names ${fixture.canDoId}, which is not evaluationSpan:'multiTurn' in c2Capabilities.js and is not the documented exception`)
  }
  ok()
}

/* ---- 3) every turnContext entry has a speaker and textEn, not a malformed
    placeholder ---- */
{
  for (const ep of ALL_EPISODES) {
    for (const step of ep.steps) {
      for (const turn of step.turnContext || []) {
        assert.ok(turn.speaker && typeof turn.speaker === 'string', `${ep.id} has a turnContext entry with no speaker`)
        assert.ok(turn.textEn && typeof turn.textEn === 'string', `${ep.id} has a turnContext entry with no textEn`)
      }
    }
  }
  ok()
}

console.log(`check-c2-multi-turn-spans: ${groups} groups OK`)
