/*
 * check-c2-blueprint-fidelity — proves `levels/c2/c2Capabilities.js` and
 * `c2Patterns.js` are a faithful transcription of
 * `docs/curriculum/blueprints/c2.json`, not a drifted paraphrase (CLAUDE.md:
 * "the blueprint wins"). Same discipline as B1/B2's own fidelity checks.
 *
 * c2.json has no top-level `counts` object (unlike b2.json) — this script
 * derives expected totals directly from the blueprint's own arrays instead
 * of a separate declared-counts section.
 *
 * This script does NOT check runtime wiring — `levels/c2/**` is a
 * design-only write scope, same status as the blueprint itself.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { C2_CAN_DOS, C2_C1_PREREQUISITES, C2_SKILL_FAMILIES, C2_UNRESOLVED_C1_PLACEHOLDER } from '../../../src/learning/levels/c2/c2Capabilities.js'
import { C2_PATTERNS, C2_SEMANTIC_TYPES } from '../../../src/learning/levels/c2/c2Patterns.js'

const BLUEPRINT_PATH = '../../../../docs/curriculum/blueprints/c2.json'
const blueprint = JSON.parse(readFileSync(new URL(BLUEPRINT_PATH, import.meta.url), 'utf8'))

let groups = 0
const ok = () => { groups += 1 }

/* ---- 1) canDos: same ids, same key fields ---- */
{
  const jsonIds = blueprint.canDos.map((c) => c.id).sort()
  const jsIds = C2_CAN_DOS.map((c) => c.id).sort()
  assert.deepEqual(jsIds, jsonIds, 'c2Capabilities.js canDo ids must match c2.json exactly')
  for (const jsonCanDo of blueprint.canDos) {
    const jsCanDo = C2_CAN_DOS.find((c) => c.id === jsonCanDo.id)
    assert.ok(jsCanDo, `missing canDo ${jsonCanDo.id}`)
    assert.equal(jsCanDo.scope, jsonCanDo.scope, `${jsonCanDo.id} scope mismatch`)
    const jsonPrereqs = jsonCanDo.id === 'sustain_coherence_across_topic_shifts'
      ? jsonCanDo.prerequisites.map((p) => (p === 'c1_assumed__handle_abstract_topics' ? C2_UNRESOLVED_C1_PLACEHOLDER : p))
      : jsonCanDo.prerequisites
    assert.deepEqual([...jsCanDo.prerequisites].sort(), [...jsonPrereqs].sort(), `${jsonCanDo.id} prerequisites mismatch`)
    assert.deepEqual([...jsCanDo.patterns].sort(), [...jsonCanDo.infrastructure].sort(), `${jsonCanDo.id} patterns/infrastructure mismatch`)
    assert.deepEqual([...jsCanDo.semanticNeeds].sort(), [...jsonCanDo.semanticNeeds].sort(), `${jsonCanDo.id} semanticNeeds mismatch`)
    assert.deepEqual(jsCanDo.evidence, jsonCanDo.evidence, `${jsonCanDo.id} evidence mismatch`)
    assert.equal(jsCanDo.evaluation, jsonCanDo.evaluation, `${jsonCanDo.id} evaluation mismatch`)
    assert.equal(jsCanDo.evaluationSpan, jsonCanDo.evaluationSpan, `${jsonCanDo.id} evaluationSpan mismatch`)
    assert.equal(!!jsCanDo.graduationCapstone, !!jsonCanDo.graduationCapstone, `${jsonCanDo.id} graduationCapstone mismatch`)
    assert.equal(jsCanDo.intentReuse, jsonCanDo.intentReuse, `${jsonCanDo.id} intentReuse mismatch`)
  }
  ok()
}

/* ---- 2) patterns: same ids, same prerequisite chain, same enables list ---- */
{
  const jsonIds = blueprint.patterns.map((p) => p.id).sort()
  const jsIds = C2_PATTERNS.map((p) => p.id).sort()
  assert.deepEqual(jsIds, jsonIds, 'c2Patterns.js pattern ids must match c2.json exactly')
  for (const jsonPattern of blueprint.patterns) {
    const jsPattern = C2_PATTERNS.find((p) => p.id === jsonPattern.id)
    assert.equal(jsPattern.prerequisite, jsonPattern.prerequisite, `${jsonPattern.id} prerequisite mismatch`)
    assert.deepEqual([...jsPattern.enables].sort(), [...jsonPattern.enables].sort(), `${jsonPattern.id} enables mismatch`)
    assert.equal(jsPattern.reaches, jsonPattern.reaches, `${jsonPattern.id} reaches mismatch`)
    assert.equal(jsPattern.firstArc, jsonPattern.firstArc, `${jsonPattern.id} firstArc mismatch`)
  }
  ok()
}

/* ---- 3) semantic types: the four proposed types, same requiredBy sets ---- */
{
  const jsonProposed = blueprint.semanticTypes.proposed
  assert.equal(C2_SEMANTIC_TYPES.proposed.length, jsonProposed.length)
  for (const jsonType of jsonProposed) {
    const jsType = C2_SEMANTIC_TYPES.proposed.find((t) => t.id === jsonType.id)
    assert.ok(jsType, `missing semantic type ${jsonType.id}`)
    assert.deepEqual([...jsType.requiredBy].sort(), [...jsonType.requiredBy].sort(), `${jsonType.id} requiredBy mismatch`)
  }
  assert.deepEqual([...C2_SEMANTIC_TYPES.existingReused].sort(), [...blueprint.semanticTypes.existingReused].sort())
  ok()
}

/* ---- 4) C1 inheritance and skill families match the blueprint ---- */
{
  const jsonResolvedIds = blueprint.c1Inheritance.assumedExitCapabilities.map((a) => a.resolvedTo).filter(Boolean)
  assert.deepEqual([...C2_C1_PREREQUISITES].sort(), [...jsonResolvedIds].sort())
  const jsonFamilyIds = blueprint.skillFamilies.map((f) => f.id).sort()
  const jsFamilyIds = C2_SKILL_FAMILIES.map((f) => f.id).sort()
  assert.deepEqual(jsFamilyIds, jsonFamilyIds)
  ok()
}

/* ---- 5) counts sanity: required/should/optional totals, derived from the
    blueprint's own canDos array (c2.json has no separate counts object) ---- */
{
  const expectedRequired = blueprint.canDos.filter((c) => c.scope === 'required').length
  const expectedShould = blueprint.canDos.filter((c) => c.scope === 'should').length
  const expectedOptional = blueprint.canDos.filter((c) => c.scope === 'optional').length
  const required = C2_CAN_DOS.filter((c) => c.scope === 'required').length
  const should = C2_CAN_DOS.filter((c) => c.scope === 'should').length
  const optional = C2_CAN_DOS.filter((c) => c.scope === 'optional').length
  assert.equal(required, expectedRequired)
  assert.equal(should, expectedShould)
  assert.equal(optional, expectedOptional)
  ok()
}

/* ---- 6) intentStrategy.newIntents count matches perArcNewIntentCount sum ---- */
{
  const sum = Object.values(blueprint.intentStrategy.perArcNewIntentCount).reduce((a, b) => a + b, 0)
  assert.equal(blueprint.intentStrategy.newIntents.length, sum, 'newIntents length must equal the sum of perArcNewIntentCount')
  ok()
}

console.log(`check-c2-blueprint-fidelity: ${groups} groups OK`)
