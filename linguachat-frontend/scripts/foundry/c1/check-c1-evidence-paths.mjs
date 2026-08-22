/*
 * check-c1-evidence-paths — the master contract's hardest rule (section 9):
 * a required capability needs independent AND transfer-or-delayed-retrieval
 * evidence, and recognition/guided evidence alone never satisfies it. This
 * walks every authored arc's `free_reply`/`recall` steps and sums real
 * `evidenceType`/`transfer` markers per capability, then checks the sum
 * against `c1Capabilities.js`'s own declared `independentEvidence` field and
 * `c1.json#/evidence/thresholds` (required: independent 3/transfer 2/
 * delayedRetrieval 1; should: independent 2/transfer 1/delayedRetrieval 0)
 * — proving the targets are backed by actual authored turns, not just
 * declared in JSON. C1's thresholds are stricter than B2's (independent:2/
 * transfer:1), reflecting c1.json's own note that "independent=3 for
 * required capabilities is higher than A1's independent=2 because C1
 * evidence includes a pragmatic/register dimension".
 */
import assert from 'node:assert/strict'

import { ALL_EPISODES, ALL_ARCS } from './check-c1-arc-content.mjs'
import { C1_CAPABILITIES } from '../../../src/learning/levels/c1/c1Capabilities.js'

const THRESHOLDS = {
  required: { independent: 3, transfer: 2, delayedRetrieval: 1 },
  should: { independent: 2, transfer: 1, delayedRetrieval: 0 },
}

/*
 * The reuseMatrix's own documented exception (c1.json#/reuseMatrix/invariant):
 * the three required capabilities introduced in the level's own final arc
 * have no later arc to reuse in — their delayed-retrieval evidence instead
 * comes from a LATER EPISODE within sustained_interaction itself (rule 3
 * below special-cases these by episode order, not arc order).
 */
const NO_LATER_ARC_EXCEPTION_IDS = new Set(['sustain_a_conversation_across_topic_shifts', 'refer_back_to_earlier_discourse', 'shift_register_within_one_conversation'])

let groups = 0
const ok = () => { groups += 1 }

const stepsByCanDo = new Map()
for (const ep of ALL_EPISODES) {
  for (const step of ep.steps) {
    if (!step.canDoId) continue
    if (!stepsByCanDo.has(step.canDoId)) stepsByCanDo.set(step.canDoId, [])
    stepsByCanDo.get(step.canDoId).push({ ...step, episodeId: ep.id, arc: ep.arc })
  }
}

/* ---- 1) every capability reaches its declared independent count ---- */
{
  for (const cap of C1_CAPABILITIES) {
    const steps = stepsByCanDo.get(cap.id) || []
    const independentCount = steps.filter((s) => s.evidenceType === 'independent' || s.evidenceType === 'delayedRetrieval').length
    assert.ok(independentCount >= cap.independentEvidence, `${cap.id} needs ${cap.independentEvidence} independent-evidence turns, content provides ${independentCount}`)
    const need = THRESHOLDS[cap.priority]
    assert.ok(independentCount >= need.independent, `${cap.id} (${cap.priority}) needs ${need.independent} independent-evidence turns per c1.json#/evidence/thresholds, content provides ${independentCount}`)
  }
  ok()
}

/* ---- 2) every capability reaches its threshold's transfer count ---- */
{
  for (const cap of C1_CAPABILITIES) {
    const steps = stepsByCanDo.get(cap.id) || []
    const transferCount = steps.filter((s) => s.transfer === true).length
    const need = THRESHOLDS[cap.priority]
    assert.ok(transferCount >= need.transfer, `${cap.id} (${cap.priority}) needs ${need.transfer} transfer turn(s) per c1.json#/evidence/thresholds, content provides ${transferCount}`)
  }
  ok()
}

/* ---- 3) every required capability reaches delayedRetrieval:1 — a touch
    (any evidenceType) in a strictly later arc, OR (for the three arc-G-only
    exceptions) a touch in a strictly later EPISODE within the same arc ---- */
{
  const arcOrder = Object.keys(ALL_ARCS)
  for (const cap of C1_CAPABILITIES.filter((c) => c.priority === 'required')) {
    const steps = stepsByCanDo.get(cap.id) || []
    if (NO_LATER_ARC_EXCEPTION_IDS.has(cap.id)) {
      const episodesInArc = ALL_ARCS[cap.firstContext]
      const touchedEpisodeIndices = episodesInArc.map((ep, i) => (ep.steps.some((s) => s.canDoId === cap.id) ? i : -1)).filter((i) => i >= 0)
      assert.ok(touchedEpisodeIndices.length >= 2, `${cap.id} is an arc-G-only capability and needs touches in at least two different episodes (delayed retrieval within the arc), found ${touchedEpisodeIndices.length}`)
      continue
    }
    const homeIndex = arcOrder.indexOf(cap.firstContext)
    const hasLaterArcTouch = arcOrder.some((arcId, i) => i > homeIndex && ALL_ARCS[arcId].some((ep) => ep.steps.some((s) => s.canDoId === cap.id)))
    assert.ok(hasLaterArcTouch, `${cap.id} needs delayedRetrieval evidence but is never touched again after its home arc (${cap.firstContext})`)
  }
  ok()
}

/* ---- 4) no capability's ONLY evidence is recognition/guided — every
    capability has at least one free_reply/recall step ---- */
{
  for (const cap of C1_CAPABILITIES) {
    const steps = stepsByCanDo.get(cap.id) || []
    const hasProduction = steps.some((s) => s.type === 'free_reply' || s.type === 'recall')
    assert.ok(hasProduction, `${cap.id} has no production (free_reply/recall) step — recognition-only evidence never satisfies a capability`)
  }
  ok()
}

console.log(`check-c1-evidence-paths: ${groups} groups OK`)
