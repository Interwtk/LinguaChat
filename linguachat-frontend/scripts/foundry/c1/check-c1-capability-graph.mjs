/*
 * check-c1-capability-graph — the dependency-graph rules the master contract
 * requires every level to satisfy (curriculum-master-a1-c2.md section 5):
 * no prerequisite cycles, no orphan required capability, no capability
 * depending on something absent from B2 or C1 itself, no required capability
 * without an evidence path.
 */
import assert from 'node:assert/strict'

import { C1_CAPABILITIES, C1_B2_PREREQUISITES } from '../../../src/learning/levels/c1/c1Capabilities.js'
import { C1_PATTERNS } from '../../../src/learning/levels/c1/c1Patterns.js'

let groups = 0
const ok = () => { groups += 1 }

const canDoIds = new Set(C1_CAPABILITIES.map((c) => c.id))
const b2Ids = new Set(C1_B2_PREREQUISITES)

/* ---- 1) every prerequisite resolves to a real C1 id or a real declared B2 id
    (one known, documented blueprint-internal exception: weigh_implications_of_a_position's
    own c1.json prerequisite field still uses the pre-reconciliation
    underscore id `b2_weigh_advantages_and_disadvantages` rather than the
    dot-notation `b2.weigh_advantages_and_disadvantages` c1.md's prose uses —
    see c1Capabilities.js's own honest note; that literal id IS listed in
    C1_B2_PREREQUISITES so it still resolves here, transcribed faithfully
    rather than silently normalized) ---- */
{
  for (const cap of C1_CAPABILITIES) {
    for (const prereq of cap.prerequisites) {
      const resolves = canDoIds.has(prereq) || b2Ids.has(prereq)
      assert.ok(resolves, `${cap.id} depends on unresolved prerequisite ${prereq}`)
    }
  }
  ok()
}

/* ---- 2) no prerequisite cycles among C1-owned capabilities ---- */
{
  const visiting = new Set()
  const visited = new Set()
  const visit = (id, chain) => {
    if (visited.has(id)) return
    assert.ok(!visiting.has(id), `prerequisite cycle: ${[...chain, id].join(' -> ')}`)
    visiting.add(id)
    const cap = C1_CAPABILITIES.find((c) => c.id === id)
    if (cap) {
      for (const prereq of cap.prerequisites) {
        if (canDoIds.has(prereq)) visit(prereq, [...chain, id])
      }
    }
    visiting.delete(id)
    visited.add(id)
  }
  for (const cap of C1_CAPABILITIES) visit(cap.id, [])
  ok()
}

/* ---- 3) no orphan capability: every capability has a real `firstContext`
    (the arc that teaches it), and every context it names (firstContext +
    reuseContexts) resolves to a real C1 arc id ---- */
{
  const arcIds = new Set(['abstract_argument', 'register_and_diplomacy', 'synthesis_and_mediation', 'nuance_and_implication', 'extended_structured_discourse', 'negotiation_and_complexity', 'sustained_interaction'])
  for (const cap of C1_CAPABILITIES) {
    assert.ok(cap.firstContext && arcIds.has(cap.firstContext), `${cap.id} has no resolvable firstContext arc`)
    for (const reuseArc of cap.reuseContexts) {
      assert.ok(arcIds.has(reuseArc), `${cap.id} names an unresolvable reuseContext arc: ${reuseArc}`)
    }
  }
  ok()
}

/* ---- 4) every capability has a real evidence path (independentEvidence > 0) ---- */
{
  for (const cap of C1_CAPABILITIES) {
    assert.ok(cap.independentEvidence > 0, `${cap.id} has no independent evidence target`)
  }
  ok()
}

/* ---- 5) pattern prerequisite chains are acyclic and resolve ---- */
{
  const patternIds = new Set(C1_PATTERNS.map((p) => p.id))
  for (const pattern of C1_PATTERNS) {
    for (const prereq of pattern.prerequisitePatterns) {
      assert.ok(patternIds.has(prereq), `pattern ${pattern.id} has unresolved prerequisite ${prereq}`)
    }
  }
  const visiting = new Set()
  const visited = new Set()
  const visit = (id) => {
    if (visited.has(id)) return
    assert.ok(!visiting.has(id), `pattern prerequisite cycle at ${id}`)
    visiting.add(id)
    const p = C1_PATTERNS.find((x) => x.id === id)
    for (const prereq of p?.prerequisitePatterns || []) visit(prereq)
    visiting.delete(id)
    visited.add(id)
  }
  C1_PATTERNS.forEach((p) => visit(p.id))
  ok()
}

console.log(`check-c1-capability-graph: ${groups} groups OK`)
