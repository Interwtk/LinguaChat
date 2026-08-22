/*
 * check-c1-reuse-matrix — cross-checks `c1ReuseMatrix.js` (the machine copy
 * of c1.json#/reuseMatrix) against the blueprint itself, and against actual
 * authored content: every arc the matrix marks non-null for a capability
 * must contain at least one step touching that capability's canDoId, so the
 * matrix describes real content, not an aspirational table.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { C1_REUSE_MATRIX_ARCS, C1_REUSE_MATRIX_ROWS } from '../../../src/learning/levels/c1/c1ReuseMatrix.js'
import { ALL_ARCS } from './check-c1-arc-content.mjs'

const blueprint = JSON.parse(readFileSync(new URL('../../../../docs/curriculum/blueprints/c1.json', import.meta.url), 'utf8'))

let groups = 0
const ok = () => { groups += 1 }

/* ---- 1) the JS matrix matches c1.json#/reuseMatrix exactly ---- */
{
  assert.deepEqual(C1_REUSE_MATRIX_ARCS, blueprint.reuseMatrix.arcs)
  assert.deepEqual(C1_REUSE_MATRIX_ROWS, blueprint.reuseMatrix.rows)
  ok()
}

/* ---- 2) every non-null cell corresponds to real content: the named arc's
    episodes contain at least one step with that capability's canDoId.
    ONE KNOWN EXCEPTION, a pre-existing inconsistency inside c1.json itself
    (a capability's own `reuseContexts` field disagrees with the separate
    `reuseMatrix` table) rather than a content-authoring gap —
    `docs/curriculum/blueprints/**` is not in this task's write scope, so it
    is recorded here rather than silently "fixed" by inventing content the
    matrix itself does not call for. Flagged in
    docs/curriculum/implementation/c1/README.md for a human/LC-AUD-001-style
    follow-up on the blueprint document itself:
      - `use_cohesive_devices_across_a_turn`'s own `capabilities[].reuseContexts`
        names synthesis_and_mediation and negotiation_and_complexity, but
        neither c1.json's reuseMatrix NOR those two arcs' own
        `capabilitiesReused` lists mark this capability there — only
        sustained_interaction does, in all three sources. Content follows
        the two agreeing sources (reuseMatrix + arc-level capabilitiesReused)
        rather than the one outlying field, the same "arc's own declared
        reuse list over an aggregate field" precedent
        `check-b2-reuse-matrix.mjs` already established for its own
        analogous B2 mismatch. Not a missing-evidence problem either way:
        this capability already reaches its full independent:3/transfer:2
        target in Arc E + Arc G. ---- */
{
  const KNOWN_MATRIX_METADATA_MISMATCHES = new Set([])
  const canDoIdsTouchedByArc = {}
  for (const [arcId, episodes] of Object.entries(ALL_ARCS)) {
    canDoIdsTouchedByArc[arcId] = new Set(episodes.flatMap((ep) => ep.steps.map((s) => s.canDoId).filter(Boolean)))
  }
  for (const [canDoId, row] of Object.entries(C1_REUSE_MATRIX_ROWS)) {
    row.forEach((cell, i) => {
      if (cell === null) return
      const arcId = C1_REUSE_MATRIX_ARCS[i]
      if (KNOWN_MATRIX_METADATA_MISMATCHES.has(`${canDoId}:${arcId}`)) return
      const touched = canDoIdsTouchedByArc[arcId]?.has(canDoId)
      assert.ok(touched, `reuse matrix says ${canDoId} appears (${cell}) in ${arcId}, but no step in that arc's content has canDoId ${canDoId}`)
    })
  }
  ok()
}

console.log(`check-c1-reuse-matrix: ${groups} groups OK`)
