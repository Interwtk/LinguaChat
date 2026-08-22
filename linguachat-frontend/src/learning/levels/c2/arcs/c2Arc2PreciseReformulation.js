/*
 * C2 arc 2 — "Saying it precisely, for someone else" (`precise_reformulation`).
 *
 * Derived from docs/curriculum/blueprints/c2.json arc `precise_reformulation`
 * and docs/curriculum/implementation/c2/content-plan.json's matching arc
 * entry (source text, intent test cases and subtype test cases, steps,
 * vocabulary — all transcribed from there, not invented here). Second arc,
 * prerequisiteArcs: ["dense_input_synthesis"]. Introduces
 * reformulate_dense_source_for_a_new_audience (required),
 * summarize_preserving_nuance (required, `reformulate_for_audience` intent,
 * `summarize` subtype) and paraphrase_to_avoid_flattening_meaning (should,
 * `reformulate_for_audience` intent, `paraphrase` subtype) — one new base
 * intent, reused under two subtypes, per c2Capabilities.js's own
 * `intentReuse` fields.
 *
 * STRUCTURE. Four episodes, following arc 1's own established convention:
 * one teaching episode per new capability (assisted-open production, then
 * one unaided/independent production on a second same-difficulty source),
 * plus an arc-closing INTEGRATED episode on a genuinely new topic (a
 * library Sunday-hours change, per content-plan.json's own suggested
 * transfer target) that supplies each capability's transfer instance.
 * `paraphrase_to_avoid_flattening_meaning` is `should`-scope with a lighter
 * evidence target (independent:1, transfer:1) — its own episode (EP3)
 * follows arc 6's `UNFAMILIAR_03` precedent for a should-scope episode:
 * `role: 'secondary'`, one assisted + one independent instance only, no
 * second independent instance required because EP4's transfer step alone
 * already satisfies `transfer:1` (and, incidentally, adds a second
 * `independent`-tagged instance beyond the required minimum — harmless
 * extra evidence, not a bug).
 *
 * SOURCE-TEXT SHAPE. Every teaching/integrated step group follows arc 1's
 * own mediation convention (itself following B2 arc 4's): a `scene` step
 * carries an extra `sourceTextEn` field — a harmless extra key on an
 * existing step type, not a new step type — and the `free_reply` step that
 * follows carries `sourceRef: true` so a future evaluator grades it against
 * the preceding source text rather than a canonical frame match. Unlike
 * arc 1 (which needed a `sourceTextBEn` two-text pair for its synthesis
 * capability), every capability in this arc operates on a single source
 * text, so no step here carries `sourceTextBEn`. Two source texts are
 * authored for this arc: `expense_policy_memo` (content-plan.json's own
 * teaching text, reused as the assisted-production scene across EP1-EP3,
 * since the summarize/paraphrase subtype test cases are themselves just
 * different reformulations of that same memo) and a self-authored
 * `parking_notice` (a same-difficulty second text, reused as the
 * independent-production scene across EP1-EP3) — mirroring how arc 1's
 * EP1 and EP3 reused the exact same second source text for two different
 * tasks. EP4 introduces one further new text, `library_hours_notice`,
 * never seen in EP1-EP3, which is what makes EP4's three production turns
 * TRANSFER rather than repetition. This is structure, not implementation —
 * the actual grading logic is `LC-INT-001` work
 * (`docs/curriculum/implementation/c2/core-engine-handoff.md`).
 *
 * SUBTYPE SHAPE. Every evaluated step (`free_reply`, `recall`) whose
 * `evalKind` is `reformulate_for_audience` under the `summarize` or
 * `paraphrase` subtype carries an explicit `subtype` field, per
 * `c2EvaluationContracts.js`'s per-subtype `structuralFloor` entries (a
 * `summarize` reply must be shorter than the source; a `paraphrase` reply
 * must preserve the source's hedge/certainty token). The base
 * (`reformulate_dense_source_for_a_new_audience`) capability carries no
 * `subtype` field, matching `c2EvaluationContracts.js`'s `subtype: null`
 * entry for it. `comprehension`/`choice`/`model` steps never carry
 * `evalKind` or `subtype` — they are fixed-text recognition steps, not
 * production steps a subtype-specific rubric grades.
 *
 * PERSONALIZATION. c2.json marks this arc `personalizationMode: "themed"`,
 * `neutralFallback: "a workplace memo reformulated for a new colleague"`.
 * Per content-plan.json's own `personalization` field (one interchangeable
 * example, not a parallel arc), personalization here is a single optional
 * step in the first teaching episode (EP1) only, carrying
 * `personalizationVariant: true` — an interest-flavored alternative to the
 * neutral independent-production prompt (content-plan.json's own worked
 * example: "a dense notice drawn from the learner's stated interest...,
 * reformulated for a friend audience"), never evaluated differently or
 * required for evidence — see arc 1's own header comment and
 * `scripts/foundry/c2/check-c2-personalization-invariant.mjs` for the proof
 * this stays structurally inert (same evalKind/canDoId/evidenceType,
 * different surface text only, never itself evaluated toward evidence).
 *
 * EVIDENCE ACCOUNTING (must match c2.json#/canDos[].evidence):
 *   reformulate_dense_source_for_a_new_audience (required, independent:2,
 *     transfer:1) — 1 independent in EP1 (step 8), 1 independent+transfer
 *     in EP4 (step 2).
 *   summarize_preserving_nuance (required, independent:2, transfer:1) —
 *     1 independent in EP2 (step 8), 1 independent+transfer in EP4 (step 3).
 *   paraphrase_to_avoid_flattening_meaning (should, independent:1,
 *     transfer:1) — 1 independent in EP3 (step 8), 1 independent+transfer
 *     in EP4 (step 4). EP3+EP4 together give 2 independent instances total,
 *     exceeding the should-scope independent:1 minimum — an intentional,
 *     harmless surplus, not a discrepancy.
 * `scripts/foundry/c2/check-c2-evidence-paths.mjs` counts these
 * mechanically from `evidenceType`/`transfer` step fields.
 *
 * STEP TYPES. Only the nine types `EpisodeShell.jsx` already renders
 * (scene, model, comprehension, choice, word_order, fill_blank, free_reply,
 * recall, completion) — zero renderer work needed, only evaluator/dispatch
 * wiring (out of this task's scope; see `core-engine-handoff.md`).
 * `evalKind` values are C2 intent ids from `c2Intents.js`; `canDoId` is
 * added explicitly on every evaluated step.
 *
 * All prose lives behind i18n keys (never populated by this task — see
 * `list-c2-i18n-keys.mjs`); every English target/prompt/source text is
 * literal, exactly as every earlier level does it. Key namespace: c2ep5
 * (EP1) - c2ep8 (EP4).
 */

const EXPENSE_POLICY_MEMO = "Effective next month, all expense claims over $50 must include a digital receipt and a one-line business justification. Claims lacking either will be returned unprocessed, adding an estimated 3-5 business days to reimbursement."

const PARKING_NOTICE = "Starting next week, cars parked in the north lot after 6pm will need a visible resident permit. Vehicles without one may be ticketed, though enforcement will likely stay lenient for the first two weeks while residents adjust."

const PARKING_NOTICE_HEDGE_SENTENCE = "Vehicles without one may be ticketed, though enforcement will likely stay lenient for the first two weeks while residents adjust."

const REFORMULATE_01 = {
  id: 'c2_precise_reformulation_reformulate',
  arc: 'precise_reformulation',
  level: 'C2',
  role: 'primary',
  titleKey: 'c2ep5Title',
  goalKey: 'c2ep5Goal',
  canDoId: 'reformulate_dense_source_for_a_new_audience',
  canDoNameKey: 'c2ep5CanDoName',
  durationKey: 'c2ep5Duration',
  estimatedMinutes: 12,
  xp: 100,
  prerequisites: [],
  skillPrerequisites: ['extract_key_argument_from_dense_text', 'c1.reformulate_for_a_different_audience'],
  gardenItems: ['reformulation_connector_pattern', 'in other words', 'to put it another way', 'justification', 'reimbursement'],
  reuseSkills: ['extract_key_argument_from_dense_text'],
  steps: [
    { type: 'scene', mood: 'focused', titleKey: 'c2ep5SceneTitle', bodyKey: 'c2ep5SceneBody', showGoal: true, ctaKey: 'c2ep5Start',
      sourceTextEn: EXPENSE_POLICY_MEMO },
    {
      type: 'model',
      target: "From next month, if you spend more than $50, you'll need to attach a digital receipt and a short note saying what it was for - otherwise it gets sent back and your reimbursement takes 3-5 days longer.",
      meaningItems: ['reformulation_connector_pattern', 'justification'], explainKey: 'c2ep5ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep5ComprehensionInstruction',
      target: "Basically, big expenses (over $50) now need a receipt and a quick explanation, or they'll bounce back and you'll wait longer to get paid back.",
      itemId: 'reformulation_connector_pattern',
      options: [{ key: 'c2ep5CompOptCorrect', correct: true }, { key: 'c2ep5CompOptWrong1' }, { key: 'c2ep5CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep5NearMissInstruction',
      target: "Big expenses need a receipt now, so you'll get your money back.",
      itemId: 'reformulation_connector_pattern',
      options: [{ key: 'c2ep5NearMissOptCorrect', correct: true }, { key: 'c2ep5NearMissOptWrong1' }, { key: 'c2ep5NearMissOptWrong2' }],
      explainKey: 'c2ep5NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Reformulate the memo above for a new colleague outside finance who has never seen an expense policy before.',
      instructionKey: 'c2ep5AssistedInstruction', evalKind: 'reformulate_for_audience', canDoId: 'reformulate_dense_source_for_a_new_audience', sourceRef: true,
      suggestionEn: "From next month, if you spend more than $50, you'll need to attach a digital receipt and a short note saying what it was for - otherwise it gets sent back and your reimbursement takes 3-5 days longer.",
      itemIds: ['reformulation_connector_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', personalizationVariant: true, format: 'themed',
      promptEn: "Optional: here's a short {{learnerInterest}}-related recall notice instead - want to try reformulating that one for a friend too?",
      instructionKey: 'c2ep5PersonalizationInstruction', evalKind: 'reformulate_for_audience', canDoId: 'reformulate_dense_source_for_a_new_audience',
      itemIds: ['reformulation_connector_pattern'], evidenceType: 'guided',
      note: 'not counted toward independent/transfer evidence — an optional interest-flavored alternative, per c2.json arc.personalizationMode "themed" and content-plan.json arc 2 personalization.interestFlavoredExample',
    },
    { type: 'scene', mood: 'focused', titleKey: 'c2ep5SecondSceneTitle', bodyKey: 'c2ep5SecondSceneBody', ctaKey: 'c2ep5SecondStart',
      sourceTextEn: PARKING_NOTICE },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Now try this one independently: reformulate this notice for a worried resident who's never seen a parking permit rule before.",
      instructionKey: 'c2ep5IndependentInstruction', evalKind: 'reformulate_for_audience', canDoId: 'reformulate_dense_source_for_a_new_audience', sourceRef: true,
      itemIds: ['reformulation_connector_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep5FinalInstruction', evalKind: 'reformulate_for_audience', canDoId: 'reformulate_dense_source_for_a_new_audience', itemIds: ['reformulation_connector_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep5CanDoName', titleKey: 'c2ep5CloseTitle', bodyKey: 'c2ep5CloseBody', ctaKey: 'c2ep5CloseCta' },
  ],
}

const SUMMARIZE_02 = {
  id: 'c2_precise_reformulation_summarize',
  arc: 'precise_reformulation',
  level: 'C2',
  role: 'primary',
  titleKey: 'c2ep6Title',
  goalKey: 'c2ep6Goal',
  canDoId: 'summarize_preserving_nuance',
  canDoNameKey: 'c2ep6CanDoName',
  durationKey: 'c2ep6Duration',
  estimatedMinutes: 12,
  xp: 100,
  prerequisites: ['c2_precise_reformulation_reformulate'],
  skillPrerequisites: ['reformulate_dense_source_for_a_new_audience', 'synthesize_multiple_viewpoints'],
  gardenItems: ['reformulation_connector_pattern', 'put simply', 'preserve'],
  reuseSkills: ['reformulate_dense_source_for_a_new_audience'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c2ep6RecallInstruction', evalKind: 'reformulate_for_audience', canDoId: 'reformulate_dense_source_for_a_new_audience', itemIds: ['reformulation_connector_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep6SceneTitle', bodyKey: 'c2ep6SceneBody', ctaKey: 'c2ep6Start',
      sourceTextEn: EXPENSE_POLICY_MEMO },
    {
      type: 'model',
      target: 'New rule: receipts and a reason are required for expenses over $50, or reimbursement is delayed a few days.',
      meaningItems: ['reformulation_connector_pattern', 'preserve'], explainKey: 'c2ep6ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep6ComprehensionInstruction',
      target: 'Expenses over $50 now need proof and a short reason, or it takes longer to get paid back.',
      itemId: 'reformulation_connector_pattern',
      options: [{ key: 'c2ep6CompOptCorrect', correct: true }, { key: 'c2ep6CompOptWrong1' }, { key: 'c2ep6CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep6NearMissInstruction',
      target: 'Expenses over $50 need a receipt.',
      itemId: 'reformulation_connector_pattern',
      options: [{ key: 'c2ep6NearMissOptCorrect', correct: true }, { key: 'c2ep6NearMissOptWrong1' }, { key: 'c2ep6NearMissOptWrong2' }],
      explainKey: 'c2ep6NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Summarize the memo above in one or two sentences for someone who just needs the headline rule.',
      instructionKey: 'c2ep6AssistedInstruction', evalKind: 'reformulate_for_audience', canDoId: 'summarize_preserving_nuance', subtype: 'summarize', sourceRef: true,
      suggestionEn: 'New rule: receipts and a reason are required for expenses over $50, or reimbursement is delayed a few days.',
      itemIds: ['reformulation_connector_pattern'], evidenceType: 'assistedOpen',
    },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep6SecondSceneTitle', bodyKey: 'c2ep6SecondSceneBody', ctaKey: 'c2ep6SecondStart',
      sourceTextEn: PARKING_NOTICE },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Now try this one independently: summarize this notice in one or two sentences for a worried resident who just wants the headline rule.',
      instructionKey: 'c2ep6IndependentInstruction', evalKind: 'reformulate_for_audience', canDoId: 'summarize_preserving_nuance', subtype: 'summarize', sourceRef: true,
      itemIds: ['reformulation_connector_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep6FinalInstruction', evalKind: 'reformulate_for_audience', canDoId: 'summarize_preserving_nuance', subtype: 'summarize', itemIds: ['reformulation_connector_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep6CanDoName', titleKey: 'c2ep6CloseTitle', bodyKey: 'c2ep6CloseBody', ctaKey: 'c2ep5CloseCta' },
  ],
}

const PARAPHRASE_03 = {
  id: 'c2_precise_reformulation_paraphrase',
  arc: 'precise_reformulation',
  level: 'C2',
  role: 'secondary',
  titleKey: 'c2ep7Title',
  goalKey: 'c2ep7Goal',
  canDoId: 'paraphrase_to_avoid_flattening_meaning',
  canDoNameKey: 'c2ep7CanDoName',
  durationKey: 'c2ep7Duration',
  estimatedMinutes: 10,
  xp: 100,
  prerequisites: ['c2_precise_reformulation_summarize'],
  skillPrerequisites: ['reformulate_dense_source_for_a_new_audience'],
  gardenItems: ['reformulation_connector_pattern', 'flatten', 'nuance'],
  reuseSkills: ['reformulate_dense_source_for_a_new_audience'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c2ep7RecallInstruction', evalKind: 'reformulate_for_audience', canDoId: 'summarize_preserving_nuance', subtype: 'summarize', itemIds: ['reformulation_connector_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep7SceneTitle', bodyKey: 'c2ep7SceneBody', ctaKey: 'c2ep7Start',
      sourceTextEn: EXPENSE_POLICY_MEMO },
    {
      type: 'model',
      target: "If a claim is missing the receipt or the justification, it won't be processed - it'll just be sent back.",
      meaningItems: ['reformulation_connector_pattern', 'nuance'], explainKey: 'c2ep7ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep7ComprehensionInstruction',
      target: 'Without both the receipt and the reason, the claim gets bounced back unprocessed.',
      itemId: 'reformulation_connector_pattern',
      options: [{ key: 'c2ep7CompOptCorrect', correct: true }, { key: 'c2ep7CompOptWrong1' }, { key: 'c2ep7CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep7NearMissInstruction',
      target: 'Claims without receipts get rejected.',
      itemId: 'reformulation_connector_pattern',
      options: [{ key: 'c2ep7NearMissOptCorrect', correct: true }, { key: 'c2ep7NearMissOptWrong1' }, { key: 'c2ep7NearMissOptWrong2' }],
      explainKey: 'c2ep7NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Paraphrase this sentence without losing the 'either/or' condition: \"Claims lacking either will be returned unprocessed.\"",
      instructionKey: 'c2ep7AssistedInstruction', evalKind: 'reformulate_for_audience', canDoId: 'paraphrase_to_avoid_flattening_meaning', subtype: 'paraphrase', sourceRef: true,
      suggestionEn: "If a claim is missing the receipt or the justification, it won't be processed - it'll just be sent back.",
      itemIds: ['reformulation_connector_pattern'], evidenceType: 'assistedOpen',
    },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep7SecondSceneTitle', bodyKey: 'c2ep7SecondSceneBody', ctaKey: 'c2ep7SecondStart',
      sourceTextEn: PARKING_NOTICE },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: `Now try this one independently: paraphrase this sentence without losing its exception: "${PARKING_NOTICE_HEDGE_SENTENCE}"`,
      instructionKey: 'c2ep7IndependentInstruction', evalKind: 'reformulate_for_audience', canDoId: 'paraphrase_to_avoid_flattening_meaning', subtype: 'paraphrase', sourceRef: true,
      itemIds: ['reformulation_connector_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep7FinalInstruction', evalKind: 'reformulate_for_audience', canDoId: 'paraphrase_to_avoid_flattening_meaning', subtype: 'paraphrase', itemIds: ['reformulation_connector_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep7CanDoName', titleKey: 'c2ep7CloseTitle', bodyKey: 'c2ep7CloseBody', ctaKey: 'c2ep5CloseCta' },
  ],
}

const INTEGRATED_04 = {
  id: 'c2_precise_reformulation_integrated',
  arc: 'precise_reformulation',
  level: 'C2',
  role: 'integrated',
  titleKey: 'c2ep8Title',
  goalKey: 'c2ep8Goal',
  canDoId: 'reformulate_dense_source_for_a_new_audience',
  canDoNameKey: 'c2ep8CanDoName',
  durationKey: 'c2ep8Duration',
  estimatedMinutes: 14,
  xp: 120,
  prerequisites: ['c2_precise_reformulation_paraphrase'],
  skillPrerequisites: ['reformulate_dense_source_for_a_new_audience', 'summarize_preserving_nuance', 'paraphrase_to_avoid_flattening_meaning'],
  gardenItems: [],
  reuseSkills: ['reformulate_dense_source_for_a_new_audience', 'summarize_preserving_nuance', 'paraphrase_to_avoid_flattening_meaning'],
  /*
   * Transfer topic: a library's Sunday-hours change — genuinely new, never
   * used in EP1-EP3 (content-plan.json's own suggested transfer target for
   * this arc: "a new source text/audience pairing not used in teaching (a
   * library-hours change, for a child audience)"). All three production
   * turns below reference this ONE new text, which is what makes them
   * TRANSFER, not repetition.
   */
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'c2ep8SceneTitle', bodyKey: 'c2ep8SceneBody', showGoal: true, ctaKey: 'c2ep8Start',
      sourceTextEn: "Starting in September, the library will close at 4pm on Sundays instead of 6pm, because of a drop in weekend staffing. The earlier closing time may be reversed if a part-time Sunday assistant is hired before the new year." },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Here's a new library notice. Reformulate it for a child who's never read a policy notice before.",
      instructionKey: 'c2ep8ReformulateInstruction', evalKind: 'reformulate_for_audience', canDoId: 'reformulate_dense_source_for_a_new_audience', sourceRef: true,
      itemIds: ['reformulation_connector_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Now summarize the same notice in one sentence for a parent who just wants the headline.',
      instructionKey: 'c2ep8SummarizeInstruction', evalKind: 'reformulate_for_audience', canDoId: 'summarize_preserving_nuance', subtype: 'summarize', sourceRef: true,
      itemIds: ['reformulation_connector_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Paraphrase this sentence without losing its condition: "The earlier closing time may be reversed if a part-time Sunday assistant is hired before the new year."',
      instructionKey: 'c2ep8ParaphraseInstruction', evalKind: 'reformulate_for_audience', canDoId: 'paraphrase_to_avoid_flattening_meaning', subtype: 'paraphrase', sourceRef: true,
      itemIds: ['reformulation_connector_pattern'], evidenceType: 'independent', transfer: true,
    },
    { type: 'recall', instructionKey: 'c2ep8FinalInstruction', evalKind: 'reformulate_for_audience', canDoId: 'paraphrase_to_avoid_flattening_meaning', subtype: 'paraphrase', itemIds: ['reformulation_connector_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep8CanDoName', titleKey: 'c2ep8CloseTitle', bodyKey: 'c2ep8CloseBody', ctaKey: 'c2ep5CloseCta' },
  ],
}

export const C2_ARC2 = [REFORMULATE_01, SUMMARIZE_02, PARAPHRASE_03, INTEGRATED_04]
export const C2_ARC2_ID = 'precise_reformulation'
export const getC2Arc2Episode = (id) => C2_ARC2.find((ep) => ep.id === id) || null
