/*
 * check-c2-reuse-matrix — cross-checks `c2ReuseMatrix.js` (the machine copy
 * of every arc's `c2.json#/arcs[].reuseMap`) against the blueprint itself,
 * and against actual authored content: every arc the matrix marks non-'I'
 * for a capability must contain at least one step touching that
 * capability's canDoId, so the matrix describes real content, not an
 * aspirational table.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { C2_REUSE_MATRIX } from '../../../src/learning/levels/c2/c2ReuseMatrix.js'
import { ALL_ARCS } from './check-c2-arc-content.mjs'

const blueprint = JSON.parse(readFileSync(new URL('../../../../docs/curriculum/blueprints/c2.json', import.meta.url), 'utf8'))

let groups = 0
const ok = () => { groups += 1 }

/* ---- 1) the JS matrix matches c2.json#/arcs[].reuseMap exactly, arc by arc ---- */
{
  assert.equal(C2_REUSE_MATRIX.length, blueprint.arcs.length)
  for (const jsonArc of blueprint.arcs) {
    const jsRow = C2_REUSE_MATRIX.find((r) => r.arcId === jsonArc.id)
    assert.ok(jsRow, `c2ReuseMatrix.js has no row for arc ${jsonArc.id}`)
    const jsonEntries = [...jsonArc.reuseMap].sort((a, b) => a.capabilityId.localeCompare(b.capabilityId))
    const jsEntries = [...jsRow.entries].sort((a, b) => a.capabilityId.localeCompare(b.capabilityId))
    assert.deepEqual(jsEntries, jsonEntries, `${jsonArc.id} reuseMap mismatch`)
  }
  ok()
}

/* ---- 2) every non-'I' cell corresponds to real content: the named arc's
    episodes contain at least one step with that capability's canDoId.
    ONE KNOWN EXCEPTION, a pre-existing inconsistency inside c2.json itself
    (arc-level `reinforcedCanDos` disagrees with the arc's own `reuseMap`)
    rather than a content-authoring gap — `docs/curriculum/blueprints/**` is
    not in this task's write scope, so it is recorded here rather than
    silently "fixed" by inventing content the arc's own reuseMap does not
    call for. See c2ReuseMatrix.js's `knownBlueprintInconsistency` note on
    the `implication_and_subtext` row and
    docs/curriculum/implementation/c2/README.md. ---- */
{
  const KNOWN_MATRIX_METADATA_MISMATCHES = new Set([
    // identify_authors_stance_and_bias is named in arc 3's reinforcedCanDos
    // but not in arc 3's own reuseMap — no exception needed here since the
    // matrix itself (transcribed from reuseMap, not reinforcedCanDos) never
    // asserts this touch in the first place. Kept as an empty set,
    // documented for a future reader who compares reinforcedCanDos anyway.
  ])
  const canDoIdsTouchedByArc = {}
  for (const [arcId, episodes] of Object.entries(ALL_ARCS)) {
    canDoIdsTouchedByArc[arcId] = new Set(episodes.flatMap((ep) => ep.steps.map((s) => s.canDoId).filter(Boolean)))
  }
  for (const row of C2_REUSE_MATRIX) {
    for (const entry of row.entries) {
      if (entry.marker === 'I') continue
      if (KNOWN_MATRIX_METADATA_MISMATCHES.has(`${entry.capabilityId}:${row.arcId}`)) continue
      const touched = canDoIdsTouchedByArc[row.arcId]?.has(entry.capabilityId)
      assert.ok(touched, `reuse matrix says ${entry.capabilityId} appears (${entry.marker}) in ${row.arcId}, but no step in that arc's content has canDoId ${entry.capabilityId}`)
    }
  }
  ok()
}

console.log(`check-c2-reuse-matrix: ${groups} groups OK`)
