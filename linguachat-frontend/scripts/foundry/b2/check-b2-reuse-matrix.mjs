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
    episodes contain at least one step with that capability's canDoId ---- */
{
  const canDoIdsTouchedByArc = {}
  for (const [arcId, episodes] of Object.entries(ALL_ARCS)) {
    canDoIdsTouchedByArc[arcId] = new Set(episodes.flatMap((ep) => ep.steps.map((s) => s.canDoId).filter(Boolean)))
  }
  for (const [canDoId, row] of Object.entries(B2_REUSE_MATRIX_ROWS)) {
    row.forEach((cell, i) => {
      if (cell === '-') return
      const arcId = B2_REUSE_MATRIX_ARC_ORDER[i]
      const touched = canDoIdsTouchedByArc[arcId]?.has(canDoId)
      assert.ok(touched, `reuse matrix says ${canDoId} appears (${cell}) in ${arcId}, but no step in that arc's content has canDoId ${canDoId}`)
    })
  }
  ok()
}

console.log(`check-b2-reuse-matrix: ${groups} groups OK`)
