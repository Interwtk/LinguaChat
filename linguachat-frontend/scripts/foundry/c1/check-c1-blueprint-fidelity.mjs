/*
 * check-c1-blueprint-fidelity — proves `levels/c1/c1Capabilities.js` and
 * `c1Patterns.js` are a faithful transcription of
 * `docs/curriculum/blueprints/c1.json`, not a drifted paraphrase. Same
 * discipline as `check-b2-blueprint-fidelity.mjs`: the blueprint is the
 * source of truth (CLAUDE.md, "the blueprint wins"), so this script fails
 * the moment the JS content and the JSON design disagree on an id, a
 * prerequisite, an evidence target or a pattern.
 *
 * Field names deliberately mirror c1.json's OWN schema, which differs from
 * b2.json's: `priority` not `scope`, `languageInfrastructure` not
 * `patterns`, a flat `independentEvidence` number not an `evidence: {...}`
 * object, `languageInfrastructure.patterns[].prerequisitePatterns` (array)
 * not a singular `prerequisite`, no top-level `counts` object.
 *
 * This script does NOT check runtime wiring — `levels/c1/**` is a
 * design-only write scope, same status as the blueprint itself.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { C1_CAPABILITIES, C1_SKILL_FAMILIES } from '../../../src/learning/levels/c1/c1Capabilities.js'
import { C1_PATTERNS, C1_SEMANTIC_TYPES } from '../../../src/learning/levels/c1/c1Patterns.js'

const BLUEPRINT_PATH = '../../../../docs/curriculum/blueprints/c1.json'
const blueprint = JSON.parse(readFileSync(new URL(BLUEPRINT_PATH, import.meta.url), 'utf8'))

let groups = 0
const ok = () => { groups += 1 }

/* ---- 1) capabilities: same ids, same order-independent set, same key fields ---- */
{
  const jsonIds = blueprint.capabilities.map((c) => c.id).sort()
  const jsIds = C1_CAPABILITIES.map((c) => c.id).sort()
  assert.deepEqual(jsIds, jsonIds, 'c1Capabilities.js capability ids must match c1.json exactly')
  for (const jsonCap of blueprint.capabilities) {
    const jsCap = C1_CAPABILITIES.find((c) => c.id === jsonCap.id)
    assert.ok(jsCap, `missing capability ${jsonCap.id}`)
    assert.equal(jsCap.priority, jsonCap.priority, `${jsonCap.id} priority mismatch`)
    assert.deepEqual([...jsCap.prerequisites].sort(), [...jsonCap.prerequisites].sort(), `${jsonCap.id} prerequisites mismatch`)
    assert.deepEqual([...jsCap.languageInfrastructure].sort(), [...jsonCap.languageInfrastructure].sort(), `${jsonCap.id} languageInfrastructure mismatch`)
    assert.equal(jsCap.independentEvidence, jsonCap.independentEvidence, `${jsonCap.id} independentEvidence mismatch`)
    assert.equal(jsCap.graduationRelevance, jsonCap.graduationRelevance, `${jsonCap.id} graduationRelevance mismatch`)
    assert.equal(jsCap.firstContext, jsonCap.firstContext, `${jsonCap.id} firstContext mismatch`)
    assert.equal(jsCap.family, jsonCap.family, `${jsonCap.id} family mismatch`)
  }
  ok()
}

/* ---- 2) patterns: same ids, same prerequisitePatterns chain, same firstAppearance ---- */
{
  const jsonPatterns = blueprint.languageInfrastructure.patterns
  const jsonIds = jsonPatterns.map((p) => p.id).sort()
  const jsIds = C1_PATTERNS.map((p) => p.id).sort()
  assert.deepEqual(jsIds, jsonIds, 'c1Patterns.js pattern ids must match c1.json exactly')
  for (const jsonPattern of jsonPatterns) {
    const jsPattern = C1_PATTERNS.find((p) => p.id === jsonPattern.id)
    assert.deepEqual([...jsPattern.prerequisitePatterns].sort(), [...jsonPattern.prerequisitePatterns].sort(), `${jsonPattern.id} prerequisitePatterns mismatch`)
    assert.equal(jsPattern.firstAppearance, jsonPattern.firstAppearance, `${jsonPattern.id} firstAppearance mismatch`)
    assert.equal(jsPattern.guidedUseTarget, jsonPattern.guidedUseTarget, `${jsonPattern.id} guidedUseTarget mismatch`)
    assert.equal(jsPattern.independentUseTarget, jsonPattern.independentUseTarget, `${jsonPattern.id} independentUseTarget mismatch`)
  }
  ok()
}

/* ---- 3) skill families match the blueprint verbatim ---- */
{
  const jsonFamilyIds = blueprint.skillFamilies.map((f) => f.id).sort()
  const jsFamilyIds = C1_SKILL_FAMILIES.map((f) => f.id).sort()
  assert.deepEqual(jsFamilyIds, jsonFamilyIds)
  for (const jsonFamily of blueprint.skillFamilies) {
    const jsFamily = C1_SKILL_FAMILIES.find((f) => f.id === jsonFamily.id)
    assert.deepEqual([...jsFamily.canDos].sort(), [...jsonFamily.canDos].sort(), `${jsonFamily.id} canDos mismatch`)
  }
  ok()
}

/* ---- 4) counts sanity: 21 required + 7 should + 0 optional, per c1.md section 3
    (c1.json has no top-level `counts` object the way b2.json does, so this
    checks against the literal numbers the blueprint's own prose declares) ---- */
{
  const required = C1_CAPABILITIES.filter((c) => c.priority === 'required').length
  const should = C1_CAPABILITIES.filter((c) => c.priority === 'should').length
  assert.equal(required, 21, 'expected 21 required capabilities per c1.md section 3')
  assert.equal(should, 7, 'expected 7 should capabilities per c1.md section 3')
  assert.equal(C1_CAPABILITIES.length, 28)
  ok()
}

/* ---- 5) negotiated_item semantic type resolves only to real capability ids
    (this type is a LC-FND-002 resolution recorded in
    docs/curriculum/semantic-types.md, not a literal c1.json field, so it is
    checked for internal consistency rather than blueprint equality) ---- */
{
  const canDoIds = new Set(C1_CAPABILITIES.map((c) => c.id))
  for (const type of C1_SEMANTIC_TYPES) {
    for (const id of type.requiredBy) assert.ok(canDoIds.has(id), `semantic type ${type.id} requiredBy names unresolvable capability ${id}`)
  }
  ok()
}

console.log(`check-c1-blueprint-fidelity: ${groups} groups OK`)
