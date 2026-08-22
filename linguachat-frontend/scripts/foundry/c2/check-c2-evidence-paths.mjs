/*
 * check-c2-evidence-paths — the master contract's hardest rule (section 9):
 * a required capability needs independent AND transfer-or-delayed-retrieval
 * evidence, and recognition/guided evidence alone never satisfies it. This
 * walks every authored arc's steps and sums real `evidenceType`/`transfer`
 * markers per capability, then checks the sum against `c2Capabilities.js`'s
 * own declared `evidence` targets — proving the targets are backed by
 * actual authored turns, not just declared in JSON.
 */
import assert from 'node:assert/strict'

import { ALL_EPISODES, ALL_ARCS } from './check-c2-arc-content.mjs'
import { C2_CAN_DOS } from '../../../src/learning/levels/c2/c2Capabilities.js'
import { C2_CAPSTONE_DELAYED_RETRIEVAL_CHECKS } from '../../../src/learning/levels/c2/c2EvaluationContracts.js'

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
  for (const canDo of C2_CAN_DOS.filter((c) => c.scope !== 'optional' && c.evidence.independent > 0)) {
    const steps = stepsByCanDo.get(canDo.id) || []
    const independentCount = steps.filter((s) => s.evidenceType === 'independent' || s.evidenceType === 'delayedRetrieval').length
    assert.ok(independentCount >= canDo.evidence.independent, `${canDo.id} needs ${canDo.evidence.independent} independent-evidence turns, content provides ${independentCount}`)
  }
  ok()
}

/* ---- 1b) the optional capability (adapt_a_text_across_genre_and_register)
    still reaches its own declared independent count even though it is
    excluded from group 1's scope filter ---- */
{
  const optional = C2_CAN_DOS.find((c) => c.id === 'adapt_a_text_across_genre_and_register')
  const steps = stepsByCanDo.get(optional.id) || []
  const independentCount = steps.filter((s) => s.evidenceType === 'independent' || s.evidenceType === 'delayedRetrieval').length
  assert.ok(independentCount >= optional.evidence.independent, `${optional.id} needs ${optional.evidence.independent} independent-evidence turns, content provides ${independentCount}`)
  ok()
}

/* ---- 2) every capability with a declared transfer target has at least one turn marked transfer:true ---- */
{
  for (const canDo of C2_CAN_DOS.filter((c) => c.evidence.transfer > 0)) {
    const steps = stepsByCanDo.get(canDo.id) || []
    const transferCount = steps.filter((s) => s.transfer === true).length
    assert.ok(transferCount >= canDo.evidence.transfer, `${canDo.id} needs ${canDo.evidence.transfer} transfer turn(s), content provides ${transferCount}`)
  }
  ok()
}

/* ---- 3) the single capability with delayedRetrieval:true
    (mediate_a_complex_disagreement_for_a_third_party) carries a step whose
    `delayedRetrievalChecks` names exactly the seven capability ids
    `C2_CAPSTONE_DELAYED_RETRIEVAL_CHECKS` declares — no more, no fewer ---- */
{
  const capstone = C2_CAN_DOS.find((c) => c.evidence.delayedRetrieval === true)
  assert.ok(capstone, 'expected exactly one capability with evidence.delayedRetrieval: true')
  const steps = stepsByCanDo.get(capstone.id) || []
  const withChecks = steps.find((s) => Array.isArray(s.delayedRetrievalChecks) && s.delayedRetrievalChecks.length > 0)
  assert.ok(withChecks, `${capstone.id} declares delayedRetrieval:true but no step carries delayedRetrievalChecks`)
  const expected = C2_CAPSTONE_DELAYED_RETRIEVAL_CHECKS.map((c) => c.capabilityId).sort()
  assert.deepEqual([...withChecks.delayedRetrievalChecks].sort(), expected, `${capstone.id}'s delayedRetrievalChecks must name exactly the capabilities C2_CAPSTONE_DELAYED_RETRIEVAL_CHECKS declares`)
  ok()
}

/* ---- 4) no required/should capability's ONLY evidence is recognition/guided —
    every one has at least one free_reply/recall production step ---- */
{
  for (const canDo of C2_CAN_DOS.filter((c) => c.scope !== 'optional')) {
    const steps = stepsByCanDo.get(canDo.id) || []
    const hasProduction = steps.some((s) => s.type === 'free_reply' || s.type === 'recall')
    assert.ok(hasProduction, `${canDo.id} has no production (free_reply/recall) step — recognition-only evidence never satisfies a required/should capability`)
  }
  ok()
}

/* ---- 5) sanity: every arc referenced in ALL_ARCS actually has episodes ---- */
{
  for (const [arcId, episodes] of Object.entries(ALL_ARCS)) {
    assert.ok(episodes.length > 0, `arc ${arcId} has no episodes`)
  }
  ok()
}

console.log(`check-c2-evidence-paths: ${groups} groups OK`)
