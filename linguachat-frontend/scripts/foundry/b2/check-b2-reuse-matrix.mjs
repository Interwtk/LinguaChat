/*
 * check-b2-reuse-matrix — cross-checks `b2ReuseMatrix.js` (the machine copy
 * of b2.json#/reuseMatrix) against the blueprint itself, and against actual
 * authored content: every arc the matrix marks non-'-' for a capability must
 * contain at least one step touching that capability's canDoId, so the
 * matrix describes real content, not an aspirational table.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { B2_REUSE_MATRIX_ARC_ORDER, B2_REUSE_MATRIX_ROWS } from '../../../src/learning/levels/b2/b2ReuseMatrix.js'
import { ALL_ARCS } from './check-b2-arc-content.mjs'

const blueprint = JSON.parse(readFileSync(new URL('../../../../docs/curriculum/blueprints/b2.json', import.meta.url), 'utf8'))

let groups = 0
const ok = () => { groups += 1 }

/* ---- 1) the JS matrix matches b2.json#/reuseMatrix exactly ---- */
{
  assert.deepEqual(B2_REUSE_MATRIX_ARC_ORDER, blueprint.reuseMatrix.arcOrder)
  assert.deepEqual(B2_REUSE_MATRIX_ROWS, blueprint.reuseMatrix.rows)
  ok()
}

/* ---- 2) every non-'-' cell corresponds to real content: the named arc's
    episodes contain at least one step with that capability's canDoId.
    TWO KNOWN EXCEPTIONS, both pre-existing inconsistencies inside
    b2.json itself (the arc-level `b2Reuse`/`newCanDos`/`reinforcedCanDos`
    lists disagree with the separate `reuseMatrix` table) rather than a
    content-authoring gap — `docs/curriculum/blueprints/**` is not in this
    task's write scope, so they are recorded here rather than silently
    "fixed" by inventing content the arc's own declared reuse list does not
    call for (per this task's no-invented-curricular-detail rule). Flagged
    in docs/curriculum/implementation/b2/README.md section 4 for a human/
    LC-AUD-001-style follow-up on the blueprint documents themselves:
      - `weigh_advantages_and_disadvantages` marked "R" in
        `when_plans_go_wrong`, but that arc's own `b2Reuse` list names only
        `develop_and_defend_opinion`/`concede_a_point_and_counter`. Not a
        missing-evidence problem either way: weigh_advantages_and_disadvantages
        already reaches its full independent:2/transfer:1 target in arc 1 + arc 6.
      - `use_idiomatic_expressions_naturally` marked "I" in
        `the_long_conversation`, but that arc's `newCanDos` list only the
        three required capstone capabilities (the optional capability is
        omitted from the metadata list even though `canDos[].firstContext`
        and the matrix both place it there). Arc 6's actual content DOES
        touch it (a `comprehension` step, receptive-only per its own
        evidence target) — this exception exists only because arc 6's
        metadata list omits it, not because content is missing it. ---- */
  const KNOWN_MATRIX_METADATA_MISMATCHES = new Set([
    'weigh_advantages_and_disadvantages:when_plans_go_wrong',
  ])
{
  const canDoIdsTouchedByArc = {}
  for (const [arcId, episodes] of Object.entries(ALL_ARCS)) {
    canDoIdsTouchedByArc[arcId] = new Set(episodes.flatMap((ep) => ep.steps.map((s) => s.canDoId).filter(Boolean)))
  }
  for (const [canDoId, row] of Object.entries(B2_REUSE_MATRIX_ROWS)) {
    row.forEach((cell, i) => {
      if (cell === '-') return
      const arcId = B2_REUSE_MATRIX_ARC_ORDER[i]
      if (KNOWN_MATRIX_METADATA_MISMATCHES.has(`${canDoId}:${arcId}`)) return
      const touched = canDoIdsTouchedByArc[arcId]?.has(canDoId)
      assert.ok(touched, `reuse matrix says ${canDoId} appears (${cell}) in ${arcId}, but no step in that arc's content has canDoId ${canDoId}`)
    })
  }
  ok()
}

console.log(`check-b2-reuse-matrix: ${groups} groups OK`)
