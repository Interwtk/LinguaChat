/*
 * check-c2-vocabulary-budget — proves the per-arc productive/receptive
 * vocabulary counts in `c2Vocabulary.js` sum to exactly
 * `c2.json#/arcs[].vocabularyBudget`. Unlike B1/B2's own budget model,
 * C2's `vocabularyBudget` is a sibling field to `patterns`/`infrastructure`
 * in the blueprint, not a superset of it (see `c2Vocabulary.js`'s own
 * header comment for the verification this rests on: every arc's
 * transcribed content-plan.json vocabulary count already matches its
 * blueprint budget almost exactly WITHOUT adding pattern counts, arc 4
 * being the sole exception) — so patterns are NOT added to the vocabulary
 * total here, deliberately different from B1/B2's formula.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { getC2ArcVocabularyCounts, C2_VOCABULARY_LEVEL_TOTALS } from '../../../src/learning/levels/c2/c2Vocabulary.js'

const blueprint = JSON.parse(readFileSync(new URL('../../../../docs/curriculum/blueprints/c2.json', import.meta.url), 'utf8'))

let groups = 0
const ok = () => { groups += 1 }

/* ---- 1) per-arc productive/receptive totals match c2.json exactly ---- */
{
  for (const arc of blueprint.arcs) {
    const counts = getC2ArcVocabularyCounts(arc.id)
    assert.ok(counts, `c2Vocabulary.js has no entry for arc ${arc.id}`)
    assert.equal(counts.newProductive, arc.vocabularyBudget.newProductive, `${arc.id} productive budget: expected ${arc.vocabularyBudget.newProductive}, got ${counts.newProductive}`)
    assert.equal(counts.newReceptive, arc.vocabularyBudget.newReceptive, `${arc.id} receptive budget: expected ${arc.vocabularyBudget.newReceptive}, got ${counts.newReceptive}`)
  }
  ok()
}

/* ---- 2) level-wide totals match the sum of every arc's declared budget ---- */
{
  const expectedProductive = blueprint.arcs.reduce((s, a) => s + a.vocabularyBudget.newProductive, 0)
  const expectedReceptive = blueprint.arcs.reduce((s, a) => s + a.vocabularyBudget.newReceptive, 0)
  assert.equal(C2_VOCABULARY_LEVEL_TOTALS.newProductive, expectedProductive)
  assert.equal(C2_VOCABULARY_LEVEL_TOTALS.newReceptive, expectedReceptive)
  ok()
}

console.log(`check-c2-vocabulary-budget: ${groups} groups OK`)
