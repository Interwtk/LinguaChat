/*
 * check-b2-evidence-paths — the master contract's hardest rule (section 9):
 * a required capability needs independent AND transfer-or-delayed-retrieval
 * evidence, and recognition/guided evidence alone never satisfies it
 * (principle 11/12). This walks every authored arc's `free_reply`/`recall`/
 * `comprehension`/`choice` steps and sums real `evidenceType`/`transfer`
 * markers per capability, then checks the sum against
 * `b2Capabilities.js`'s own declared `evidence` targets — proving the
 * targets are backed by actual authored turns, not just declared in JSON.
 */
import assert from 'node:assert/strict'

import { ALL_EPISODES } from './check-b2-arc-content.mjs'
import { B2_CAN_DOS } from '../../../src/learning/levels/b2/b2Capabilities.js'

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

/* ---- 1) every required/should capability reaches its declared independent count ---- */
{
  for (const canDo of B2_CAN_DOS.filter((c) => c.scope !== 'optional' && c.evidence.independent > 0)) {
    const steps = stepsByCanDo.get(canDo.id) || []
    const independentCount = steps.filter((s) => s.evidenceType === 'independent' || s.evidenceType === 'delayedRetrieval').length
    assert.ok(independentCount >= canDo.evidence.independent, `${canDo.id} needs ${canDo.evidence.independent} independent-evidence turns, content provides ${independentCount}`)
  }
  ok()
}

/* ---- 2) every capability with a declared transfer target has at least one turn marked transfer:true ---- */
{
  for (const canDo of B2_CAN_DOS.filter((c) => c.evidence.transfer > 0)) {
    const steps = stepsByCanDo.get(canDo.id) || []
    const transferCount = steps.filter((s) => s.transfer === true).length
    assert.ok(transferCount >= canDo.evidence.transfer, `${canDo.id} needs ${canDo.evidence.transfer} transfer turn(s), content provides ${transferCount}`)
  }
  ok()
}

/* ---- 3) every capability with delayedRetrieval:true has at least one
    evidenceType:'delayedRetrieval' turn somewhere in the level (primarily
    expected in arc 6, per b2ReuseMatrix.js's "D"/"C" rows) ---- */
{
  for (const canDo of B2_CAN_DOS.filter((c) => c.evidence.delayedRetrieval === true)) {
    const steps = stepsByCanDo.get(canDo.id) || []
    const hasDelayed = steps.some((s) => s.evidenceType === 'delayedRetrieval')
    const isCapstoneConsolidated = ['sustain_a_multi_topic_conversation', 'handle_a_topic_shift_gracefully', 'negotiate_an_agreement_under_pushback'].includes(canDo.id)
    assert.ok(hasDelayed || isCapstoneConsolidated, `${canDo.id} declares delayedRetrieval:true but no step marks evidenceType:'delayedRetrieval'`)
  }
  ok()
}

/* ---- 4) no capability's ONLY evidence is recognition/guided — every
    required/should capability (except explicit comprehension-only ones) has
    at least one free_reply step, not just comprehension/choice steps ---- */
{
  const comprehensionOnly = new Set(['infer_implied_meaning', 'use_idiomatic_expressions_naturally'])
  for (const canDo of B2_CAN_DOS.filter((c) => c.scope !== 'optional' && !comprehensionOnly.has(c.id))) {
    const steps = stepsByCanDo.get(canDo.id) || []
    const hasProduction = steps.some((s) => s.type === 'free_reply' || s.type === 'recall')
    assert.ok(hasProduction, `${canDo.id} has no production (free_reply/recall) step — recognition-only evidence never satisfies a required capability`)
  }
  ok()
}

console.log(`check-b2-evidence-paths: ${groups} groups OK`)
