/*
 * check-b2-capability-graph — the dependency-graph rules the master contract
 * requires every level to satisfy (curriculum-master-a1-c2.md section 5):
 * no prerequisite cycles, no orphan required capability, no capability
 * depending on something absent from B1 or B2 itself, no required capability
 * without an evidence path.
 */
import assert from 'node:assert/strict'

import { B2_CAN_DOS, B2_B1_PREREQUISITES } from '../../../src/learning/levels/b2/b2Capabilities.js'
import { B2_PATTERNS } from '../../../src/learning/levels/b2/b2Patterns.js'

let groups = 0
const ok = () => { groups += 1 }

const canDoIds = new Set(B2_CAN_DOS.map((c) => c.id))
const b1Ids = new Set(B2_B1_PREREQUISITES)

/* ---- 1) every prerequisite resolves to a real B2 id or a real declared B1 id ---- */
{
  for (const canDo of B2_CAN_DOS) {
    for (const prereq of canDo.prerequisites) {
      const resolves = canDoIds.has(prereq) || b1Ids.has(prereq)
      assert.ok(resolves, `${canDo.id} depends on unresolved prerequisite ${prereq}`)
    }
  }
  ok()
}

/* ---- 2) no prerequisite cycles among B2-owned capabilities ---- */
{
  const visiting = new Set()
  const visited = new Set()
  const visit = (id, chain) => {
    if (visited.has(id)) return
    assert.ok(!visiting.has(id), `prerequisite cycle: ${[...chain, id].join(' -> ')}`)
    visiting.add(id)
    const canDo = B2_CAN_DOS.find((c) => c.id === id)
    if (canDo) {
      for (const prereq of canDo.prerequisites) {
        if (canDoIds.has(prereq)) visit(prereq, [...chain, id])
      }
    }
    visiting.delete(id)
    visited.add(id)
  }
  for (const canDo of B2_CAN_DOS) visit(canDo.id, [])
  ok()
}

/* ---- 3) no orphan required capability: every required/should id has a real
    `firstContext` (the arc that teaches it), and every context it names
    (firstContext + reuseContexts) resolves to a real B2 arc id — a capability
    naming an arc that does not exist is exactly the "no new capability whose
    prerequisites are never taught" failure mode the master contract (section 5)
    warns about, just on the teaching side rather than the prerequisite side ---- */
{
  const arcIds = new Set(['making_the_case', 'when_plans_go_wrong', 'what_if', 'talking_around_a_subject', 'reading_between_the_lines', 'the_long_conversation'])
  for (const canDo of B2_CAN_DOS.filter((c) => c.scope !== 'optional')) {
    assert.ok(canDo.firstContext && arcIds.has(canDo.firstContext), `${canDo.id} has no resolvable firstContext arc`)
    for (const reuseArc of canDo.reuseContexts) {
      assert.ok(arcIds.has(reuseArc), `${canDo.id} names an unresolvable reuseContext arc: ${reuseArc}`)
    }
  }
  ok()
}

/* ---- 4) every required/should capability has a real evidence path (independent
    production target > 0, or is explicitly comprehension-only) ---- */
{
  for (const canDo of B2_CAN_DOS.filter((c) => c.scope !== 'optional')) {
    const hasIndependentTarget = canDo.evidence.independent > 0
    const isComprehensionOnly = canDo.evidence.assistedOpen === false && canDo.evidence.independent <= 1
    assert.ok(hasIndependentTarget || isComprehensionOnly, `${canDo.id} has no independent evidence target`)
  }
  ok()
}

/* ---- 5) pattern prerequisite chains are acyclic and resolve ---- */
{
  const patternIds = new Set(B2_PATTERNS.map((p) => p.id))
  for (const pattern of B2_PATTERNS) {
    if (pattern.prerequisite) assert.ok(patternIds.has(pattern.prerequisite), `pattern ${pattern.id} has unresolved prerequisite ${pattern.prerequisite}`)
  }
  const visiting = new Set()
  const visited = new Set()
  const visit = (id) => {
    if (visited.has(id)) return
    assert.ok(!visiting.has(id), `pattern prerequisite cycle at ${id}`)
    visiting.add(id)
    const p = B2_PATTERNS.find((x) => x.id === id)
    if (p?.prerequisite) visit(p.prerequisite)
    visiting.delete(id)
    visited.add(id)
  }
  B2_PATTERNS.forEach((p) => visit(p.id))
  ok()
}

console.log(`check-b2-capability-graph: ${groups} groups OK`)
