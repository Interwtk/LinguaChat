/*
 * check-b2-blueprint-fidelity — proves `levels/b2/b2Capabilities.js` and
 * `b2Patterns.js` are a faithful transcription of
 * `docs/curriculum/blueprints/b2.json`, not a drifted paraphrase. Same
 * discipline as `check-a1-blueprint.mjs`'s own fidelity half: the blueprint
 * is the source of truth (CLAUDE.md, "the blueprint wins"), so this script
 * fails the moment the JS content and the JSON design disagree on an id,
 * a prerequisite, an evidence target or a pattern.
 *
 * This script does NOT check runtime wiring — `levels/b2/**` is a design-only
 * write scope, same status as the blueprint itself (b2.json's own
 * `designedAgainst.note`: "no runtime module imports this file").
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { B2_CAN_DOS, B2_B1_PREREQUISITES, B2_SKILL_FAMILIES } from '../../../src/learning/levels/b2/b2Capabilities.js'
import { B2_PATTERNS, B2_SEMANTIC_TYPES } from '../../../src/learning/levels/b2/b2Patterns.js'

const BLUEPRINT_PATH = '../../../../docs/curriculum/blueprints/b2.json'
const blueprint = JSON.parse(readFileSync(new URL(BLUEPRINT_PATH, import.meta.url), 'utf8'))

let groups = 0
const ok = () => { groups += 1 }

/* ---- 1) canDos: same ids, same order-independent set, same key fields ---- */
{
  const jsonIds = blueprint.canDos.map((c) => c.id).sort()
  const jsIds = B2_CAN_DOS.map((c) => c.id).sort()
  assert.deepEqual(jsIds, jsonIds, 'b2Capabilities.js canDo ids must match b2.json exactly')
  for (const jsonCanDo of blueprint.canDos) {
    const jsCanDo = B2_CAN_DOS.find((c) => c.id === jsonCanDo.id)
    assert.ok(jsCanDo, `missing canDo ${jsonCanDo.id}`)
    assert.equal(jsCanDo.scope, jsonCanDo.scope, `${jsonCanDo.id} scope mismatch`)
    assert.deepEqual([...jsCanDo.prerequisites].sort(), [...jsonCanDo.prerequisites].sort(), `${jsonCanDo.id} prerequisites mismatch`)
    assert.deepEqual([...jsCanDo.patterns].sort(), [...jsonCanDo.patterns].sort(), `${jsonCanDo.id} patterns mismatch`)
    assert.deepEqual(jsCanDo.evidence, jsonCanDo.evidence, `${jsonCanDo.id} evidence mismatch`)
    assert.equal(jsCanDo.graduationRelevance, jsonCanDo.graduationRelevance, `${jsonCanDo.id} graduationRelevance mismatch`)
    assert.equal(jsCanDo.firstContext, jsonCanDo.firstContext, `${jsonCanDo.id} firstContext mismatch`)
  }
  ok()
}

/* ---- 2) patterns: same ids, same prerequisite chain, same enables list ---- */
{
  const jsonIds = blueprint.patterns.map((p) => p.id).sort()
  const jsIds = B2_PATTERNS.map((p) => p.id).sort()
  assert.deepEqual(jsIds, jsonIds, 'b2Patterns.js pattern ids must match b2.json exactly')
  for (const jsonPattern of blueprint.patterns) {
    const jsPattern = B2_PATTERNS.find((p) => p.id === jsonPattern.id)
    assert.equal(jsPattern.prerequisite, jsonPattern.prerequisite, `${jsonPattern.id} prerequisite mismatch`)
    assert.deepEqual([...jsPattern.enables].sort(), [...jsonPattern.enables].sort(), `${jsonPattern.id} enables mismatch`)
  }
  assert.equal(B2_PATTERNS.length, blueprint.counts.newPatterns, 'pattern count must match b2.json#/counts/newPatterns')
  ok()
}

/* ---- 3) semantic types: the three proposed types, same requiredBy sets ---- */
{
  const jsonProposed = blueprint.semanticTypes.proposed
  assert.equal(B2_SEMANTIC_TYPES.length, jsonProposed.length)
  for (const jsonType of jsonProposed) {
    const jsType = B2_SEMANTIC_TYPES.find((t) => t.id === jsonType.id)
    assert.ok(jsType, `missing semantic type ${jsonType.id}`)
    assert.deepEqual([...jsType.requiredBy].sort(), [...jsonType.requiredBy].sort(), `${jsonType.id} requiredBy mismatch`)
  }
  ok()
}

/* ---- 4) B1 inheritance and skill families match the blueprint verbatim ---- */
{
  assert.deepEqual([...B2_B1_PREREQUISITES].sort(), [...blueprint.b1Inheritance.prerequisiteCapabilities].sort())
  const jsonFamilyIds = blueprint.skillFamilies.map((f) => f.id).sort()
  const jsFamilyIds = B2_SKILL_FAMILIES.map((f) => f.id).sort()
  assert.deepEqual(jsFamilyIds, jsonFamilyIds)
  ok()
}

/* ---- 5) counts sanity: required/should/optional totals match b2.json#/counts ---- */
{
  const required = B2_CAN_DOS.filter((c) => c.scope === 'required').length
  const should = B2_CAN_DOS.filter((c) => c.scope === 'should').length
  const optional = B2_CAN_DOS.filter((c) => c.scope === 'optional').length
  assert.equal(required, blueprint.counts.canDosRequired)
  assert.equal(should, blueprint.counts.canDosShould)
  assert.equal(optional, blueprint.counts.canDosOptional)
  ok()
}

console.log(`check-b2-blueprint-fidelity: ${groups} groups OK`)
