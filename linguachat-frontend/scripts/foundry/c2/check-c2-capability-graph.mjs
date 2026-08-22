/*
 * check-c2-capability-graph — the dependency-graph rules the master
 * contract requires every level to satisfy
 * (curriculum-master-a1-c2.md section 5): no prerequisite cycles, no orphan
 * required capability, no capability depending on something absent from C1
 * or C2 itself, no required capability without an evidence path.
 */
import assert from 'node:assert/strict'

import { C2_CAN_DOS, C2_C1_PREREQUISITES, C2_UNRESOLVED_C1_PLACEHOLDER } from '../../../src/learning/levels/c2/c2Capabilities.js'
import { C2_PATTERNS } from '../../../src/learning/levels/c2/c2Patterns.js'

let groups = 0
const ok = () => { groups += 1 }

const canDoIds = new Set(C2_CAN_DOS.map((c) => c.id))
const c1Ids = new Set([...C2_C1_PREREQUISITES, C2_UNRESOLVED_C1_PLACEHOLDER])

/* ---- 1) every prerequisite resolves to a real C2 id or a real declared C1 id
    (the one deliberately unresolved placeholder counts as "declared", not
    "resolved" — see c2Capabilities.js's own note on
    sustain_coherence_across_topic_shifts) ---- */
{
  for (const canDo of C2_CAN_DOS) {
    for (const prereq of canDo.prerequisites) {
      const resolves = canDoIds.has(prereq) || c1Ids.has(prereq)
      assert.ok(resolves, `${canDo.id} depends on unresolved prerequisite ${prereq}`)
    }
  }
  ok()
}

/* ---- 2) no prerequisite cycles among C2-owned capabilities ---- */
{
  const visiting = new Set()
  const visited = new Set()
  const visit = (id, chain) => {
    if (visited.has(id)) return
    assert.ok(!visiting.has(id), `prerequisite cycle: ${[...chain, id].join(' -> ')}`)
    visiting.add(id)
    const canDo = C2_CAN_DOS.find((c) => c.id === id)
    if (canDo) {
      for (const prereq of canDo.prerequisites) {
        if (canDoIds.has(prereq)) visit(prereq, [...chain, id])
      }
    }
    visiting.delete(id)
    visited.add(id)
  }
  for (const canDo of C2_CAN_DOS) visit(canDo.id, [])
  ok()
}

/* ---- 3) no orphan required/should capability: every one has a real
    `firstContext` (the arc that teaches it), and every context it names
    (firstContext + reuseContexts) resolves to a real C2 arc id ---- */
{
  const arcIds = new Set([
    'dense_input_synthesis', 'precise_reformulation', 'implication_and_subtext',
    'register_and_pragmatics', 'argument_and_position', 'discourse_flexibility',
    'stylistic_control', 'integrated_mediation',
  ])
  for (const canDo of C2_CAN_DOS.filter((c) => c.scope !== 'optional')) {
    assert.ok(canDo.firstContext && arcIds.has(canDo.firstContext), `${canDo.id} has no resolvable firstContext arc`)
    for (const reuseArc of canDo.reuseContexts) {
      assert.ok(arcIds.has(reuseArc), `${canDo.id} names an unresolvable reuseContext arc: ${reuseArc}`)
    }
  }
  ok()
}

/* ---- 4) every required/should capability has a real independent evidence target ---- */
{
  for (const canDo of C2_CAN_DOS.filter((c) => c.scope !== 'optional')) {
    assert.ok(canDo.evidence.independent > 0, `${canDo.id} has no independent evidence target`)
  }
  ok()
}

/* ---- 5) pattern prerequisite chains are acyclic and resolve ---- */
{
  const patternIds = new Set(C2_PATTERNS.map((p) => p.id))
  for (const pattern of C2_PATTERNS) {
    if (pattern.prerequisite) assert.ok(patternIds.has(pattern.prerequisite), `pattern ${pattern.id} has unresolved prerequisite ${pattern.prerequisite}`)
  }
  const visiting = new Set()
  const visited = new Set()
  const visit = (id) => {
    if (visited.has(id)) return
    assert.ok(!visiting.has(id), `pattern prerequisite cycle at ${id}`)
    visiting.add(id)
    const p = C2_PATTERNS.find((x) => x.id === id)
    if (p?.prerequisite) visit(p.prerequisite)
    visiting.delete(id)
    visited.add(id)
  }
  C2_PATTERNS.forEach((p) => visit(p.id))
  ok()
}

console.log(`check-c2-capability-graph: ${groups} groups OK`)
