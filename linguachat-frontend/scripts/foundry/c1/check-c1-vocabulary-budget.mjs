/*
 * check-c1-vocabulary-budget — proves `c1Vocabulary.js`'s level-wide
 * productive/receptive totals fall within
 * `c1.json#/languageInfrastructure/vocabularyBudget`'s declared estimate
 * range ("90-110" / "160-200"), that every item resolves to a real arc and
 * capability, and that there are no duplicate ids.
 *
 * UNLIKE `check-b2-vocabulary-budget.mjs`, this is a RANGE check, not an
 * exact-equality check: c1.json has no per-arc `vocabularyBudget` object and
 * no top-level `counts` object the way b2.json does — only a level-wide
 * ESTIMATE range, explicitly declared "not a pre-committed catalogue...
 * exact counts are finalized during LC-CONT-C1 against the actual authored
 * episodes" (c1.json#/languageInfrastructure/vocabularyBudget/note). See
 * c1Vocabulary.js's own header comment for the full reconciliation this
 * script verifies mechanically.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { C1_VOCABULARY, C1_VOCABULARY_TOTALS } from '../../../src/learning/levels/c1/c1Vocabulary.js'
import { C1_CAPABILITIES } from '../../../src/learning/levels/c1/c1Capabilities.js'

const blueprint = JSON.parse(readFileSync(new URL('../../../../docs/curriculum/blueprints/c1.json', import.meta.url), 'utf8'))

let groups = 0
const ok = () => { groups += 1 }

const parseRange = (str) => {
  const [lo, hi] = str.split('-').map((n) => Number(n))
  return { lo, hi }
}

/* ---- 1) level-wide productive/receptive totals fall within the blueprint's declared estimate range ---- */
{
  const productiveRange = parseRange(blueprint.languageInfrastructure.vocabularyBudget.productiveItemsEstimate)
  const receptiveRange = parseRange(blueprint.languageInfrastructure.vocabularyBudget.receptiveItemsEstimate)
  assert.ok(C1_VOCABULARY_TOTALS.productive >= productiveRange.lo && C1_VOCABULARY_TOTALS.productive <= productiveRange.hi,
    `productive total ${C1_VOCABULARY_TOTALS.productive} outside declared range ${productiveRange.lo}-${productiveRange.hi}`)
  assert.ok(C1_VOCABULARY_TOTALS.receptive >= receptiveRange.lo && C1_VOCABULARY_TOTALS.receptive <= receptiveRange.hi,
    `receptive total ${C1_VOCABULARY_TOTALS.receptive} outside declared range ${receptiveRange.lo}-${receptiveRange.hi}`)
  ok()
}

/* ---- 2) no duplicate vocabulary ids ---- */
{
  const ids = C1_VOCABULARY.map((v) => v.id)
  assert.equal(new Set(ids).size, ids.length, `duplicate vocabulary ids: ${ids.filter((id, i) => ids.indexOf(id) !== i).join(', ')}`)
  ok()
}

/* ---- 3) every item resolves to a real arc and a real capability ---- */
{
  const arcIds = new Set(['abstract_argument', 'register_and_diplomacy', 'synthesis_and_mediation', 'nuance_and_implication', 'extended_structured_discourse', 'negotiation_and_complexity', 'sustained_interaction'])
  const canDoIds = new Set(C1_CAPABILITIES.map((c) => c.id))
  for (const v of C1_VOCABULARY) {
    assert.ok(arcIds.has(v.arc), `vocabulary item ${v.id} names an unresolvable arc ${v.arc}`)
    assert.ok(canDoIds.has(v.tiedCanDo), `vocabulary item ${v.id} names an unresolvable tiedCanDo ${v.tiedCanDo}`)
    assert.ok(v.kind === 'productive' || v.kind === 'receptive', `vocabulary item ${v.id} has an invalid kind ${v.kind}`)
  }
  ok()
}

console.log(`check-c1-vocabulary-budget: ${groups} groups OK (${C1_VOCABULARY_TOTALS.productive} productive / ${C1_VOCABULARY_TOTALS.receptive} receptive)`)
