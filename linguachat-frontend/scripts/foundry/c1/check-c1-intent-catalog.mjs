/*
 * check-c1-intent-catalog — every C1 intent has the worked-example
 * categories the template requires (section 11: clearly correct, natural
 * variant, near miss, wrong meaning, nonsense), the catalog's size matches
 * c1.json#/evaluationIntents.length (12), and every intent resolves to at
 * least one real C1 capability id.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { C1_INTENTS, C1_NEW_INTENT_COUNT } from '../../../src/learning/levels/c1/c1Intents.js'
import { C1_CAPABILITIES, C1_CAN_DO_INTENT } from '../../../src/learning/levels/c1/c1Capabilities.js'

const blueprint = JSON.parse(readFileSync(new URL('../../../../docs/curriculum/blueprints/c1.json', import.meta.url), 'utf8'))

let groups = 0
const ok = () => { groups += 1 }

/* ---- 1) catalog size and ids match c1.json#/evaluationIntents exactly ---- */
{
  assert.equal(C1_NEW_INTENT_COUNT, blueprint.evaluationIntents.length)
  const jsonIds = blueprint.evaluationIntents.map((i) => i.id).sort()
  const jsIds = C1_INTENTS.map((i) => i.id).sort()
  assert.deepEqual(jsIds, jsonIds, 'c1Intents.js intent ids must match c1.json#/evaluationIntents exactly, including clarify_ambiguity')
  for (const jsonIntent of blueprint.evaluationIntents) {
    const jsIntent = C1_INTENTS.find((i) => i.id === jsonIntent.id)
    assert.deepEqual([...jsIntent.capabilities].sort(), [...jsonIntent.capabilities].sort(), `${jsonIntent.id} capabilities mismatch`)
  }
  ok()
}

/* ---- 2) every intent's example set has the required template categories ---- */
{
  const requiredCategories = ['clearlyCorrect', 'naturalVariant', 'nearMiss', 'wrongMeaning', 'nonsense']
  for (const intent of C1_INTENTS) {
    for (const category of requiredCategories) {
      assert.ok(intent.examples?.[category], `intent ${intent.id} is missing example category "${category}"`)
    }
  }
  ok()
}

/* ---- 3) every intent's capabilities[] resolves to a real C1 capability ---- */
{
  const canDoIds = new Set(C1_CAPABILITIES.map((c) => c.id))
  for (const intent of C1_INTENTS) {
    for (const capId of intent.capabilities) {
      assert.ok(canDoIds.has(capId), `intent ${intent.id} names an unresolvable capability ${capId}`)
    }
  }
  ok()
}

/* ---- 4) C1_CAN_DO_INTENT is internally consistent: every value is a real intent id ---- */
{
  const intentIds = new Set(C1_INTENTS.map((i) => i.id))
  for (const [canDoId, intentId] of Object.entries(C1_CAN_DO_INTENT)) {
    assert.ok(intentIds.has(intentId), `${canDoId} maps to unresolvable intent ${intentId}`)
  }
  ok()
}

/* ---- 5) every C1 capability has exactly one entry in C1_CAN_DO_INTENT ---- */
{
  for (const cap of C1_CAPABILITIES) {
    assert.ok(cap.id in C1_CAN_DO_INTENT, `${cap.id} has no C1_CAN_DO_INTENT mapping`)
  }
  ok()
}

/* ---- 6) clarify_ambiguity carries its documented intentReuse note (repair_request
    subtype), per c1.json#/capabilities[clarify_an_ambiguous_instruction_precisely].intentReuse ---- */
{
  const clarifyAmbiguity = C1_INTENTS.find((i) => i.id === 'clarify_ambiguity')
  assert.ok(clarifyAmbiguity.intentReuse, 'clarify_ambiguity must carry its intentReuse note')
  const clarifyCap = C1_CAPABILITIES.find((c) => c.id === 'clarify_an_ambiguous_instruction_precisely')
  assert.ok(clarifyCap.intentReuse, 'clarify_an_ambiguous_instruction_precisely must carry its own intentReuse note')
  ok()
}

console.log(`check-c1-intent-catalog: ${groups} groups OK`)
