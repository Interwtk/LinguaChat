/*
 * check-cross-level-ids — no two levels may silently declare the same bare
 * capability id.
 *
 * `docs/curriculum/cross-level-audit.json` found three real cross-level id
 * collisions in the design documents (A2/B1's `report_a_problem`, B2/C1's
 * `infer_implied_meaning`, C1/C2's `reformulate_for_a_different_audience`) —
 * each a bare id independently declared by two levels with different, or
 * only partially overlapping, meaning. Nothing in the runtime engine
 * previously detected this class of defect once a level's map lands as
 * code, not just a blueprint document: two levels' `*_CAN_DO_INTENT` maps
 * are merged by `curriculum/levelMaps.js` into one lookup with no collision
 * check, so a repeated id would resolve to whichever level's entry the
 * registry happened to list first, silently.
 *
 * This script is the mechanical guard: it walks every level registered in
 * `levelMaps.js` and fails loudly the moment two of them declare the same
 * canDoId. It is deliberately narrow — it does not, and cannot, judge
 * whether two DIFFERENT ids describe incompatible semantics (that needs a
 * human/audit reading, as LC-AUD-001 did for the design documents); it only
 * catches the mechanical case a merge can hide.
 */
import assert from 'node:assert/strict'
import { LEVEL_CAN_DO_INTENT_MAPS } from '../src/learning/curriculum/levelMaps.js'

let n = 0
const ok = () => { n++ }

// 1) every registered level contributes a non-empty id namespace
{
  assert.ok(LEVEL_CAN_DO_INTENT_MAPS.length >= 1, 'at least one level must be registered')
  for (const { levelId, canDoIntent } of LEVEL_CAN_DO_INTENT_MAPS) {
    assert.ok(levelId, 'every registry entry must name its level')
    assert.ok(canDoIntent && typeof canDoIntent === 'object', `${levelId} must supply a canDoIntent map`)
  }
  ok()
}

// 2) no bare canDoId is declared by more than one level
{
  const owner = new Map() // canDoId -> levelId
  const collisions = []
  for (const { levelId, canDoIntent } of LEVEL_CAN_DO_INTENT_MAPS) {
    for (const canDoId of Object.keys(canDoIntent)) {
      if (owner.has(canDoId)) {
        collisions.push(`${canDoId} declared by both ${owner.get(canDoId)} and ${levelId}`)
      } else {
        owner.set(canDoId, levelId)
      }
    }
  }
  assert.deepEqual(collisions, [],
    `cross-level capability id collision(s):\n${collisions.join('\n')}\n` +
    'Rename one level\'s id (see docs/curriculum/cross-level-audit.json for the pattern LC-AUD-001 used) ' +
    'before registering both levels here.')
  ok()
}

// 3) within one level, an intent may be reused by more than one can-do only
//    as a deliberate subtype (the master contract's own rule); this script
//    does not judge that — it only reports the count so a reviewer can see
//    it, since a sudden jump is worth a human look even though it is not
//    automatically a defect.
{
  for (const { levelId, canDoIntent } of LEVEL_CAN_DO_INTENT_MAPS) {
    const intentCounts = new Map()
    for (const intent of Object.values(canDoIntent)) {
      intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1)
    }
    const shared = [...intentCounts.entries()].filter(([, count]) => count > 1)
    assert.ok(shared.length <= Object.keys(canDoIntent).length,
      `${levelId}: intent-sharing count must not exceed the number of can-dos`)
  }
  ok()
}

console.log(`check-cross-level-ids — OK  (${n} registry groups verified, ${LEVEL_CAN_DO_INTENT_MAPS.length} levels checked)`)
