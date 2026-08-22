/*
 * check-c2-intent-catalog — every C2 intent has the worked-example
 * categories the blueprint's own section 11 requires (correct, natural
 * variant, near miss, wrong meaning, nonsense, pragmatically inappropriate
 * — a BASE category for C2, not optional), the catalog's size matches
 * c2.json#/intentStrategy/newIntents, every intent resolves to a real C2
 * capability, and subtype reuse is fully accounted for.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { C2_INTENTS, C2_INTENT_IDS, C2_INTENT_SUBTYPES } from '../../../src/learning/levels/c2/c2Intents.js'
import { C2_CAN_DOS, C2_CAN_DO_INTENT } from '../../../src/learning/levels/c2/c2Capabilities.js'

const blueprint = JSON.parse(readFileSync(new URL('../../../../docs/curriculum/blueprints/c2.json', import.meta.url), 'utf8'))

let groups = 0
const ok = () => { groups += 1 }

/* ---- 1) catalog size and ids match the blueprint's declared new-intent list ---- */
{
  assert.equal(C2_INTENTS.length, blueprint.intentStrategy.newIntents.length)
  assert.deepEqual([...C2_INTENT_IDS].sort(), [...blueprint.intentStrategy.newIntents].sort())
  ok()
}

/* ---- 2) every intent's base example set has all six required template categories ---- */
{
  const requiredCategories = ['correct', 'naturalVariant', 'nearMiss', 'wrongMeaning', 'nonsense', 'pragmaticallyInappropriate']
  for (const intent of C2_INTENTS) {
    for (const category of requiredCategories) {
      assert.ok(intent.examples?.[category], `intent ${intent.id} is missing example category "${category}"`)
    }
    for (const subtype of intent.subtypes || []) {
      for (const category of requiredCategories) {
        assert.ok(subtype.examples?.[category], `intent ${intent.id} subtype ${subtype.id} is missing example category "${category}"`)
      }
    }
  }
  ok()
}

/* ---- 3) every intent (and subtype) resolves to a real C2 capability ---- */
{
  const canDoIds = new Set(C2_CAN_DOS.map((c) => c.id))
  for (const intent of C2_INTENTS) {
    assert.ok(canDoIds.has(intent.capabilityId), `intent ${intent.id} names an unresolvable capabilityId ${intent.capabilityId}`)
    for (const subtype of intent.subtypes || []) {
      assert.ok(canDoIds.has(subtype.capabilityId), `intent ${intent.id} subtype ${subtype.id} names an unresolvable capabilityId ${subtype.capabilityId}`)
    }
  }
  ok()
}

/* ---- 4) C2_CAN_DO_INTENT is internally consistent with the intent catalog:
    every value is a real intent id, and every subtype-comment-implied
    (canDoId, intentId) pair matching a declared subtype resolves via
    C2_INTENT_SUBTYPES ---- */
{
  const intentIds = new Set(C2_INTENTS.map((i) => i.id))
  for (const [canDoId, intentId] of Object.entries(C2_CAN_DO_INTENT)) {
    assert.ok(intentIds.has(intentId), `${canDoId} maps to unresolvable intent ${intentId}`)
  }
  // every canDo whose capabilityId appears as a subtype's capabilityId must
  // map, in C2_CAN_DO_INTENT, to that subtype's parent intent id
  for (const subtype of C2_INTENT_SUBTYPES) {
    assert.equal(C2_CAN_DO_INTENT[subtype.capabilityId], subtype.intentId, `${subtype.capabilityId} should map to ${subtype.intentId} (subtype ${subtype.subtypeId}) in C2_CAN_DO_INTENT`)
  }
  ok()
}

/* ---- 5) every capability with a declared c2.json `intentReuse` field
    resolves to a real subtype or a real base-intent reuse (qualify_claim
    reused by two capabilities with no subtype distinction) ---- */
{
  for (const canDo of C2_CAN_DOS.filter((c) => c.intentReuse)) {
    const mappedIntent = C2_CAN_DO_INTENT[canDo.id]
    assert.ok(mappedIntent, `${canDo.id} declares intentReuse "${canDo.intentReuse}" but has no C2_CAN_DO_INTENT entry`)
  }
  ok()
}

console.log(`check-c2-intent-catalog: ${groups} groups OK`)
