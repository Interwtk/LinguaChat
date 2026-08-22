/*
 * C2 reuse matrix — a JS-native transcription of every arc's
 * `docs/curriculum/blueprints/c2.json#/arcs[].reuseMap`. Marker legend,
 * matching the blueprint's own convention (and B1/B2's precedent):
 *   I = introduced in this arc (first teaching)
 *   R = reinforced (guided reuse, not itself independent/transfer evidence)
 *   D = delayed retrieval (unaided, after intervening arcs)
 *   T = transfer (a genuinely new context for this capability)
 *   F = final integration (folded into the capstone's own new production)
 * `scripts/foundry/c2/check-c2-reuse-matrix.mjs` diffs this against
 * `c2.json` and checks every non-I cell corresponds to a real step inside
 * that arc's authored content.
 */

export const C2_REUSE_MATRIX = [
  {
    arcId: 'dense_input_synthesis',
    entries: [
      { capabilityId: 'extract_key_argument_from_dense_text', marker: 'I' },
      { capabilityId: 'synthesize_multiple_viewpoints', marker: 'I' },
      { capabilityId: 'identify_authors_stance_and_bias', marker: 'I' },
    ],
  },
  {
    arcId: 'precise_reformulation',
    entries: [
      { capabilityId: 'reformulate_dense_source_for_a_new_audience', marker: 'I' },
      { capabilityId: 'summarize_preserving_nuance', marker: 'I' },
      { capabilityId: 'paraphrase_to_avoid_flattening_meaning', marker: 'I' },
      { capabilityId: 'extract_key_argument_from_dense_text', marker: 'G' },
    ],
  },
  {
    arcId: 'implication_and_subtext',
    entries: [
      { capabilityId: 'recognize_implied_meaning', marker: 'I' },
      { capabilityId: 'recognize_irony_and_understatement', marker: 'I' },
      { capabilityId: 'respond_appropriately_to_an_indirect_speech_act', marker: 'I' },
    ],
    knownBlueprintInconsistency: "c2.json's arc-level `reinforcedCanDos` names `identify_authors_stance_and_bias` as reinforced here, but this arc's own `reuseMap` (transcribed above, verbatim) carries no matching entry. Same class of self-disagreement B2's blueprint had for its own reuseMatrix (see B2's implementation README section 4) — content authoring follows the arc's own reuseMap, the more specific of the two fields, and documents the discrepancy rather than silently resolving it either way.",
  },
  {
    arcId: 'register_and_pragmatics',
    entries: [
      { capabilityId: 'shift_register_deliberately', marker: 'I' },
      { capabilityId: 'soften_or_intensify_a_claim', marker: 'I' },
      { capabilityId: 'manage_face_in_disagreement', marker: 'I' },
      { capabilityId: 'recognize_implied_meaning', marker: 'R' },
    ],
  },
  {
    arcId: 'argument_and_position',
    entries: [
      { capabilityId: 'develop_an_extended_qualified_argument', marker: 'I' },
      { capabilityId: 'preempt_and_rebut_a_counterargument', marker: 'I' },
      { capabilityId: 'qualify_a_position_with_precision', marker: 'I' },
      { capabilityId: 'soften_or_intensify_a_claim', marker: 'R' },
    ],
  },
  {
    arcId: 'discourse_flexibility',
    entries: [
      { capabilityId: 'sustain_coherence_across_topic_shifts', marker: 'I' },
      { capabilityId: 'repair_a_misunderstanding_at_intention_level', marker: 'I' },
      { capabilityId: 'function_inside_an_unfamiliar_high_ambiguity_exchange', marker: 'I' },
      { capabilityId: 'develop_an_extended_qualified_argument', marker: 'R' },
      { capabilityId: 'manage_face_in_disagreement', marker: 'R' },
      { capabilityId: 'recognize_irony_and_understatement', marker: 'D' },
    ],
  },
  {
    arcId: 'stylistic_control',
    entries: [
      { capabilityId: 'edit_own_text_for_precision_and_tone', marker: 'I' },
      { capabilityId: 'vary_expression_to_avoid_flattening_meaning', marker: 'I' },
      { capabilityId: 'adapt_a_text_across_genre_and_register', marker: 'I' },
      { capabilityId: 'shift_register_deliberately', marker: 'R' },
      { capabilityId: 'reformulate_dense_source_for_a_new_audience', marker: 'R' },
    ],
  },
  {
    arcId: 'integrated_mediation',
    entries: [
      { capabilityId: 'mediate_a_complex_disagreement_for_a_third_party', marker: 'I' },
      { capabilityId: 'summarize_preserving_nuance', marker: 'T' },
      { capabilityId: 'manage_face_in_disagreement', marker: 'D' },
      { capabilityId: 'preempt_and_rebut_a_counterargument', marker: 'D' },
      { capabilityId: 'repair_a_misunderstanding_at_intention_level', marker: 'D' },
      { capabilityId: 'sustain_coherence_across_topic_shifts', marker: 'D' },
      { capabilityId: 'recognize_irony_and_understatement', marker: 'D' },
      { capabilityId: 'edit_own_text_for_precision_and_tone', marker: 'F' },
    ],
  },
]

export const getC2ArcReuseMatrix = (arcId) => C2_REUSE_MATRIX.find((row) => row.arcId === arcId) || null
