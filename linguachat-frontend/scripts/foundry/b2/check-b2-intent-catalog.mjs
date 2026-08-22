/*
 * check-b2-intent-catalog — every B2 intent has the worked-example categories
 * the template requires (section 11: clearly correct, natural variant, near
 * miss, wrong meaning, nonsense), the catalog's size matches
 * b2.json#/intentStrategy/counts/newB2Intents, and every intent resolves to
 * a real B2 capability id.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { B2_INTENTS, B2_NEW_INTENT_COUNT, B2_COMPREHENSION_ONLY_CAN_DOS } from '../../../src/learning/levels/b2/b2Intents.js'
import { B2_CAN_DOS, B2_CAN_DO_INTENT } from '../../../src/learning/levels/b2/b2Capabilities.js'

const blueprint = JSON.parse(readFileSync(new URL('../../../../docs/curriculum/blueprints/b2.json', import.meta.url), 'utf8'))

let groups = 0
const ok = () => { groups += 1 }

/* ---- 1) catalog size matches the blueprint's declared new-intent count ---- */
{
  assert.equal(B2_NEW_INTENT_COUNT, blueprint.intentStrategy.counts.newB2Intents)
  assert.deepEqual([...B2_INTENTS.map((i) => i.id)].sort(), [...blueprint.intentStrategy.newIntents].sort())
  ok()
}

/* ---- 2) every intent's example set has the required template categories ---- */
{
  const requiredCategories = ['clearlyCorrect', 'naturalVariant', 'nearMiss', 'wrongMeaning', 'nonsense']
  for (const intent of B2_INTENTS) {
    for (const category of requiredCategories) {
      assert.ok(intent.examples?.[category], `intent ${intent.id} is missing example category "${category}"`)
    }
  }
  ok()
}

/* ---- 3) every intent resolves to a real B2 capability ---- */
{
  const canDoIds = new Set(B2_CAN_DOS.map((c) => c.id))
  for (const intent of B2_INTENTS) {
    assert.ok(canDoIds.has(intent.capabilityId), `intent ${intent.id} names an unresolvable capabilityId ${intent.capabilityId}`)
  }
  ok()
}

/* ---- 4) B2_CAN_DO_INTENT is internally consistent with the intent catalog:
    every non-null value is either a real intent id, or explicitly one of the
    comprehension-only capabilities (which carry no production intent) ---- */
{
  const intentIds = new Set(B2_INTENTS.map((i) => i.id))
  for (const [canDoId, intentId] of Object.entries(B2_CAN_DO_INTENT)) {
    if (intentId === null) {
      assert.ok(B2_COMPREHENSION_ONLY_CAN_DOS.includes(canDoId) || canDoId === 'use_idiomatic_expressions_naturally', `${canDoId} maps to null but is not declared comprehension-only`)
    } else {
      assert.ok(intentIds.has(intentId), `${canDoId} maps to unresolvable intent ${intentId}`)
    }
  }
  ok()
}

/* ---- 5) subtype-reuse capstone capabilities (no new intent minted) are
    accounted for: sustain_a_multi_topic_conversation and
    handle_a_topic_shift_gracefully reuse shift_register+topic_shift;
    negotiate_an_agreement_under_pushback reuses propose_a_resolution+pushback ---- */
{
  const shiftRegister = B2_INTENTS.find((i) => i.id === 'shift_register')
  const topicShiftSubtype = shiftRegister.subtypes.find((s) => s.id === 'topic_shift')
  assert.ok(topicShiftSubtype, 'shift_register is missing its topic_shift subtype')
  assert.equal(topicShiftSubtype.capabilityId, 'sustain_a_multi_topic_conversation')
  assert.equal(topicShiftSubtype.alsoCapabilityId, 'handle_a_topic_shift_gracefully')

  const proposeResolution = B2_INTENTS.find((i) => i.id === 'propose_a_resolution')
  const pushbackSubtype = proposeResolution.subtypes.find((s) => s.id === 'pushback')
  assert.ok(pushbackSubtype, 'propose_a_resolution is missing its pushback subtype')
  assert.equal(pushbackSubtype.capabilityId, 'negotiate_an_agreement_under_pushback')
  ok()
}

console.log(`check-b2-intent-catalog: ${groups} groups OK`)
