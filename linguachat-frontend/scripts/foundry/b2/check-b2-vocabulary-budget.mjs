/*
 * check-b2-vocabulary-budget — proves the per-arc productive/receptive
 * vocabulary counts in `b2Vocabulary.js`, PLUS each arc's own pattern count
 * (patterns are Garden-trackable units too, per b2.md section 6), sum to
 * exactly `b2.json#/arcs[].vocabularyBudget` and the level-wide
 * `counts.newProductiveVocabularyBudget` / `newReceptiveVocabularyBudget`.
 * A budget that is merely "close" is not proof; this checks exact equality.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { B2_VOCABULARY_COUNTS_BY_ARC } from '../../../src/learning/levels/b2/b2Vocabulary.js'
import { B2_PATTERNS } from '../../../src/learning/levels/b2/b2Patterns.js'

const blueprint = JSON.parse(readFileSync(new URL('../../../../docs/curriculum/blueprints/b2.json', import.meta.url), 'utf8'))

let groups = 0
const ok = () => { groups += 1 }

const patternCountByArc = B2_PATTERNS.reduce((acc, p) => {
  acc[p.firstArc] = (acc[p.firstArc] || 0) + 1
  return acc
}, {})

/* ---- 1) per-arc productive/receptive totals (vocabulary items + patterns) match b2.json exactly ---- */
{
  for (const arc of blueprint.arcs) {
    const vocab = B2_VOCABULARY_COUNTS_BY_ARC[arc.id] || { productive: 0, receptive: 0 }
    const patternsInArc = patternCountByArc[arc.id] || 0
    const totalProductive = vocab.productive + patternsInArc
    assert.equal(totalProductive, arc.vocabularyBudget.newProductive, `${arc.id} productive budget: expected ${arc.vocabularyBudget.newProductive}, got ${totalProductive} (${vocab.productive} vocab + ${patternsInArc} patterns)`)
    assert.equal(vocab.receptive, arc.vocabularyBudget.newReceptive, `${arc.id} receptive budget: expected ${arc.vocabularyBudget.newReceptive}, got ${vocab.receptive}`)
  }
  ok()
}

/* ---- 2) level-wide totals match b2.json#/counts exactly ---- */
{
  const totalProductive = Object.values(B2_VOCABULARY_COUNTS_BY_ARC).reduce((s, v) => s + v.productive, 0) + B2_PATTERNS.length
  const totalReceptive = Object.values(B2_VOCABULARY_COUNTS_BY_ARC).reduce((s, v) => s + v.receptive, 0)
  assert.equal(totalProductive, blueprint.counts.newProductiveVocabularyBudget)
  assert.equal(totalReceptive, blueprint.counts.newReceptiveVocabularyBudget)
  ok()
}

console.log(`check-b2-vocabulary-budget: ${groups} groups OK`)
