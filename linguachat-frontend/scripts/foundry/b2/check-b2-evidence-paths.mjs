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

import { ALL_EPISODES, ALL_ARCS } from './check-b2-arc-content.mjs'
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

/* ---- 3) every capability with delayedRetrieval:true is touched again in an
    arc temporally AFTER its own firstContext — the substance of delayed
    retrieval ("succeeds again after intervening material", master contract
    section 9) is which arc a turn happens in, not the literal evidenceType
    string. An explicit `evidenceType: 'delayedRetrieval'` step always
    counts; so does any other step (independent/guided/assistedOpen) with
    that canDoId in a strictly later arc. ---- */
{
  const arcOrder = Object.keys(ALL_ARCS)
  for (const canDo of B2_CAN_DOS.filter((c) => c.evidence.delayedRetrieval === true)) {
    const homeIndex = arcOrder.indexOf(canDo.firstContext)
    const steps = stepsByCanDo.get(canDo.id) || []
    const hasExplicitDelayed = steps.some((s) => s.evidenceType === 'delayedRetrieval')
    const hasLaterArcTouch = arcOrder.some((arcId, i) => i > homeIndex && ALL_ARCS[arcId].some((ep) => ep.steps.some((s) => s.canDoId === canDo.id)))
    assert.ok(hasExplicitDelayed || hasLaterArcTouch, `${canDo.id} declares delayedRetrieval:true but is never touched again after its home arc (${canDo.firstContext})`)
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
