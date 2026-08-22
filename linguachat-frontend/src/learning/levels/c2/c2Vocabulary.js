/*
 * C2 vocabulary — the exact per-arc productive/receptive lists that must
 * sum to `docs/curriculum/blueprints/c2.json#/arcs[].vocabularyBudget`
 * (checked by `scripts/foundry/c2/check-c2-vocabulary-budget.mjs`).
 * `vocabularyBudget` is a sibling field to `patterns`/`infrastructure` in
 * the blueprint, not a superset of it — pattern-carrying phrases
 * (`c2Patterns.js`) are their own Garden-trackable inventory and are not
 * counted against this budget, mirroring how the blueprint itself keeps
 * the two fields separate per arc.
 *
 * The core word/phrase set for every arc below is transcribed verbatim
 * from `docs/curriculum/implementation/c2/content-plan.json`'s
 * `vocabulary.productive`/`vocabulary.receptive` arrays. That document is
 * explicitly a set of representative examples, not a budget-exact list
 * (its own README calls out "vocabulary and pattern examples") — every
 * arc's receptive list, and arc 4's productive list, falls short of the
 * blueprint's declared count once transcribed as-is. The `supplement`
 * entries below are additional items authored directly against this file
 * to close that gap exactly, thematically matched to their arc, holding no
 * new curricular capability — only vocabulary breadth the blueprint already
 * budgeted for. `check-c2-vocabulary-budget.mjs` fails if `core.length +
 * supplement.length` does not equal the blueprint's declared count for
 * every arc, in both directions.
 */

export const C2_VOCABULARY = {
  dense_input_synthesis: {
    productive: {
      core: ['presumably', 'allegedly', 'ostensibly', 'according to', 'claim', 'support', 'unstated', 'imply'],
      supplement: [],
    },
    receptive: {
      core: ['stance', 'bias', 'premise', 'corroborate', 'undermine', 'concede', 'conjecture', 'substantiate'],
      supplement: ['proposition', 'assertion', 'contention', 'presupposition', 'counter-evidence', 'inference', 'epistemic', 'qualifier'],
    },
  },
  precise_reformulation: {
    productive: {
      core: ['in other words', 'to put it another way', 'put simply', 'preserve', 'flatten', 'nuance', 'justification', 'reimbursement'],
      supplement: [],
    },
    receptive: {
      core: ['threshold', 'stipulate', 'documentary evidence', 'itemize', 'expenditure', 'audience', 'hedge', 'overstate'],
      supplement: ['gloss', 'condensation', 'fidelity', 'elision'],
    },
  },
  implication_and_subtext: {
    productive: {
      core: ['implication', 'understatement', 'irony', 'indirect', 'imply', 'hint'],
      supplement: [],
    },
    receptive: {
      core: ['rhetorical question', 'sarcasm', 'deadpan', 'euphemism', 'subtext', 'insinuate', 'connotation', 'wry'],
      supplement: ['allusion', 'face-threat', 'tact', 'innuendo', 'circumlocution', 'pragmatic inference'],
    },
  },
  register_and_pragmatics: {
    productive: {
      core: ['could be argued', 'arguably', 'to some extent', 'not necessarily', 'undeniably', 'there is little doubt that', 'I take your point', "that's fair"],
      supplement: ['with respect to', 'it would seem that'],
    },
    receptive: {
      core: ['formality', 'register', 'boost', 'diplomatic', 'bureaucratic', 'candor', 'overclaim', 'proportionate'],
      supplement: ['formality gradient', 'code-switching', 'politeness marker', 'epistemic modality'],
    },
  },
  argument_and_position: {
    productive: {
      core: ['while X has merit', 'granted that', 'nevertheless', 'even so', 'on balance', 'that said', 'concede', 'rebut'],
      supplement: [],
    },
    receptive: {
      core: ['straw man', 'counterpoint', 'qualify', 'underlying assumption', 'weigh', 'tradeoff', 'defensible', 'untenable'],
      supplement: ['burden of proof', 'premise-conclusion link'],
    },
  },
  discourse_flexibility: {
    productive: {
      core: ['insofar as', 'whereby', 'that said', 'by the same token', 'coherence', 'drift'],
      supplement: [],
    },
    receptive: {
      core: ['non-sequitur', 'tangent', 'thread', 'digress', 'rapport', 'ambiguity', 'clarify', 'escalate'],
      supplement: ['discourse marker', 'repair sequence'],
    },
  },
  stylistic_control: {
    productive: {
      core: ['precision', 'tone-fit', 'flatten', 'repetition', 'revise', 'notice', 'apparent', 'register-appropriate'],
      supplement: [],
    },
    receptive: {
      core: ['redundant', 'collocate', 'verbose', 'terse', 'formality marker', 'genre convention'],
      supplement: ['hypernym', 'register clash'],
    },
  },
  integrated_mediation: {
    productive: {
      core: ['mediate', 'represent both sides', 'next step', 'faithfully'],
      supplement: [],
    },
    receptive: {
      core: ['impartial', 'adjudicate', 'standpoint', 'common ground', 'escalation', 'good faith'],
      supplement: ['neutral framing', 'position statement'],
    },
  },
}

const countList = (arcVocab, kind) => arcVocab[kind].core.length + arcVocab[kind].supplement.length

export const getC2ArcVocabularyCounts = (arcId) => {
  const arcVocab = C2_VOCABULARY[arcId]
  if (!arcVocab) return null
  return { newProductive: countList(arcVocab, 'productive'), newReceptive: countList(arcVocab, 'receptive') }
}

export const getC2ArcVocabularyWords = (arcId) => {
  const arcVocab = C2_VOCABULARY[arcId]
  if (!arcVocab) return null
  return {
    productive: [...arcVocab.productive.core, ...arcVocab.productive.supplement],
    receptive: [...arcVocab.receptive.core, ...arcVocab.receptive.supplement],
  }
}

export const C2_VOCABULARY_LEVEL_TOTALS = Object.keys(C2_VOCABULARY).reduce(
  (totals, arcId) => {
    const counts = getC2ArcVocabularyCounts(arcId)
    return { newProductive: totals.newProductive + counts.newProductive, newReceptive: totals.newReceptive + counts.newReceptive }
  },
  { newProductive: 0, newReceptive: 0 },
)
