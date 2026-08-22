/*
 * C2 pattern groups and proposed semantic types — a JS-native transcription
 * of `docs/curriculum/blueprints/c2.json#/patterns` and `#/semanticTypes`.
 * Every id/form/enables/prerequisite/reaches value here must match that
 * file; `scripts/foundry/c2/check-c2-blueprint-fidelity.mjs` diffs the two.
 *
 * Nothing here is registered into `engine/semanticContext.js` — that
 * registration (`source_text`, `audience_profile`, `register_level`,
 * `stance_marker`) is `coreEngineRequirements[2]`, out of this task's write
 * scope. See `docs/curriculum/implementation/c2/core-engine-handoff.md`.
 */

export const C2_PATTERNS = [
  { id: 'academic_hedging_pattern', form: 'it could be argued that / arguably / to some extent / not necessarily', enables: ['soften_or_intensify_a_claim', 'develop_an_extended_qualified_argument', 'qualify_a_position_with_precision'], prerequisite: null, reaches: 'independent', firstArc: 'register_and_pragmatics', reuseArcs: ['argument_and_position', 'discourse_flexibility', 'integrated_mediation'], renamedFrom: 'hedging_pattern', renameNote: "Renamed by LC-AUD-001 F11 / LC-FND-002 from B2's hedging_pattern id — a structurally different, more formal/academic hedging form than B2's ('sort of / tend to / I'd say / more or less'). Crediting one against a spaced-retrieval record seeded by the other would credit language the learner was never taught; B2's own hedging_pattern id is unchanged." },
  { id: 'boosting_pattern', form: 'undeniably / there is little doubt that / it is clear that', enables: ['soften_or_intensify_a_claim', 'develop_an_extended_qualified_argument', 'qualify_a_position_with_precision'], prerequisite: 'academic_hedging_pattern', reaches: 'independent', firstArc: 'register_and_pragmatics', reuseArcs: ['argument_and_position', 'discourse_flexibility', 'integrated_mediation'] },
  { id: 'concession_then_position_pattern', form: 'while X has merit, ... / granted that..., nevertheless... / even so', enables: ['preempt_and_rebut_a_counterargument'], prerequisite: 'academic_hedging_pattern', reaches: 'independent', firstArc: 'argument_and_position', reuseArcs: ['discourse_flexibility', 'integrated_mediation'] },
  { id: 'evidentiality_stance_pattern', form: 'presumably / ostensibly / allegedly / according to X', enables: ['identify_authors_stance_and_bias', 'recognize_implied_meaning'], prerequisite: null, reaches: 'independent', firstArc: 'dense_input_synthesis', reuseArcs: ['implication_and_subtext', 'integrated_mediation'] },
  { id: 'reformulation_connector_pattern', form: 'in other words / to put it another way / put simply, for a non-specialist', enables: ['reformulate_dense_source_for_a_new_audience', 'summarize_preserving_nuance', 'paraphrase_to_avoid_flattening_meaning'], prerequisite: null, reaches: 'independent', firstArc: 'precise_reformulation', reuseArcs: ['integrated_mediation'] },
  { id: 'register_shift_lexis_pattern', form: 'matched formal/neutral/informal lexical and syntactic pairs for the same proposition', enables: ['shift_register_deliberately', 'adapt_a_text_across_genre_and_register'], prerequisite: null, reaches: 'independent', firstArc: 'register_and_pragmatics', reuseArcs: ['stylistic_control', 'integrated_mediation'] },
  { id: 'face_saving_disagreement_pattern', form: "I take your point, but... / that's fair, though I'd push back on...", enables: ['manage_face_in_disagreement', 'repair_a_misunderstanding_at_intention_level'], prerequisite: 'register_shift_lexis_pattern', reaches: 'independent', firstArc: 'register_and_pragmatics', reuseArcs: ['discourse_flexibility', 'integrated_mediation'] },
  { id: 'paragraph_scale_cohesion_pattern', form: 'insofar as / whereby / that said / by the same token', enables: ['sustain_coherence_across_topic_shifts', 'function_inside_an_unfamiliar_high_ambiguity_exchange'], prerequisite: null, reaches: 'independent', firstArc: 'discourse_flexibility', reuseArcs: ['integrated_mediation'] },
  { id: 'irony_understatement_marker_pattern', form: 'recognizing litotes, rhetorical questions and deliberate understatement as carrying an inverted or reduced literal meaning', enables: ['recognize_irony_and_understatement', 'respond_appropriately_to_an_indirect_speech_act'], prerequisite: 'evidentiality_stance_pattern', reaches: 'guided_production', firstArc: 'implication_and_subtext', reuseArcs: ['discourse_flexibility'] },
  { id: 'lexical_precision_substitution_pattern', form: 'replacing a vague/repeated item with a precise, non-repeating collocate', enables: ['edit_own_text_for_precision_and_tone', 'vary_expression_to_avoid_flattening_meaning'], prerequisite: null, reaches: 'independent', firstArc: 'stylistic_control', reuseArcs: [] },
]

export const getC2Pattern = (id) => C2_PATTERNS.find((p) => p.id === id) || null

export const C2_SEMANTIC_TYPES = {
  existingReused: ['person', 'place', 'activity', 'feeling', 'generic_object'],
  proposed: [
    { id: 'source_text', requiredBy: ['extract_key_argument_from_dense_text', 'synthesize_multiple_viewpoints', 'identify_authors_stance_and_bias', 'reformulate_dense_source_for_a_new_audience', 'summarize_preserving_nuance', 'paraphrase_to_avoid_flattening_meaning', 'mediate_a_complex_disagreement_for_a_third_party'], examples: ['a two-paragraph opinion column', 'two short conflicting reviews'], incompatibleWith: ['activity', 'person'] },
    { id: 'audience_profile', requiredBy: ['reformulate_dense_source_for_a_new_audience', 'summarize_preserving_nuance', 'shift_register_deliberately', 'adapt_a_text_across_genre_and_register', 'mediate_a_complex_disagreement_for_a_third_party'], examples: ['a colleague outside the field', 'a worried customer', 'a child'], incompatibleWith: ['person'] },
    { id: 'register_level', requiredBy: ['shift_register_deliberately', 'manage_face_in_disagreement', 'edit_own_text_for_precision_and_tone', 'adapt_a_text_across_genre_and_register', 'mediate_a_complex_disagreement_for_a_third_party'], examples: ['formal', 'neutral', 'informal', 'technical'], incompatibleWith: ['free_text'] },
    { id: 'stance_marker', requiredBy: ['identify_authors_stance_and_bias', 'recognize_implied_meaning', 'recognize_irony_and_understatement', 'respond_appropriately_to_an_indirect_speech_act', 'soften_or_intensify_a_claim', 'manage_face_in_disagreement', 'repair_a_misunderstanding_at_intention_level', 'develop_an_extended_qualified_argument', 'preempt_and_rebut_a_counterargument', 'qualify_a_position_with_precision', 'mediate_a_complex_disagreement_for_a_third_party'], examples: ['presumably', 'undeniably', 'to some extent'], incompatibleWith: ['activity', 'place'] },
  ],
  explicitlyNotNeeded: [
    { id: 'sentiment_score', why: 'C2 evaluation needs to know what is implied and how certain the speaker is, not a coarse positive/negative sentiment number.' },
    { id: 'difficulty_tier', why: 'Ambiguity/novelty is already carried by evidence type (transfer, delayed retrieval, unfamiliar exchange), not a separate numeric slot.' },
  ],
}

export const C2_PROPOSED_SEMANTIC_TYPE_IDS = C2_SEMANTIC_TYPES.proposed.map((t) => t.id)
