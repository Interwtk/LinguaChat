/*
 * C2 capability graph — a JS-native transcription of
 * `docs/curriculum/blueprints/c2.json#/canDos`, `#/skillFamilies` and
 * `#/c1Inheritance`. Every id, prerequisite, evidence target and CEFR
 * reference here must match that file; `scripts/foundry/c2/check-c2-blueprint-fidelity.mjs`
 * diffs the two and fails the moment they drift.
 *
 * Nothing in this file is imported by any runtime module yet. Wiring this
 * into `curriculum/levelMaps.js`, `engine/scaffolding.js`, or any shared
 * evaluator dispatch is out of `LC-CONT-C2`'s write scope — see
 * `docs/curriculum/implementation/c2/core-engine-handoff.md`, following the
 * same isolation discipline B1/B2/C1 already established for their own
 * lanes (`.ai/foundry/requests/LC-CONT-C2.md`).
 */

export const C2_PREREQUISITE_LEVEL = 'c1'

/*
 * Real C1 capability ids this level depends on, reconciled by LC-AUD-001
 * (cross-level-audit.json F3/F6) and applied by LC-FND-002, per c2.json's
 * own `c1Inheritance.assumedExitCapabilities` record. Not a C2-owned id —
 * never redefine one of these here.
 */
export const C2_C1_PREREQUISITES = [
  'c1.synthesize_two_conflicting_viewpoints',
  'c1.infer_implied_meaning_in_unfamiliar_context',
  'c1.reformulate_for_a_different_audience',
  'c1.adapt_register_to_audience',
  'c1.develop_a_structured_argument',
  'c1.concede_a_counterpoint_gracefully',
]

/*
 * `sustain_coherence_across_topic_shifts` deliberately keeps the ORIGINAL,
 * unresolved placeholder id as one of its prerequisites, not a real C1 id —
 * transcribed verbatim from c2.json, which explicitly declined to
 * auto-resolve it (LC-AUD-001 F6, low confidence). This is not a bug in
 * this file; see that capability's `unresolvedPrerequisiteNote` below and
 * `c2.json#/crossLevelAcceptance` for the still-open human decision.
 */
export const C2_UNRESOLVED_C1_PLACEHOLDER = 'c1_assumed__handle_abstract_topics'

export const C2_SKILL_FAMILIES = [
  { id: 'dense_input_synthesis', label: 'Making sense of dense material', canDos: ['extract_key_argument_from_dense_text', 'synthesize_multiple_viewpoints', 'identify_authors_stance_and_bias'] },
  { id: 'precise_reformulation', label: 'Saying it precisely, for someone else', canDos: ['reformulate_dense_source_for_a_new_audience', 'summarize_preserving_nuance', 'paraphrase_to_avoid_flattening_meaning'] },
  { id: 'implication_and_subtext', label: 'Reading between the lines', canDos: ['recognize_implied_meaning', 'recognize_irony_and_understatement', 'respond_appropriately_to_an_indirect_speech_act'] },
  { id: 'register_and_pragmatics', label: 'Saying it the right way for the moment', canDos: ['shift_register_deliberately', 'soften_or_intensify_a_claim', 'manage_face_in_disagreement'] },
  { id: 'argument_and_position', label: 'Building and defending a nuanced position', canDos: ['develop_an_extended_qualified_argument', 'preempt_and_rebut_a_counterargument', 'qualify_a_position_with_precision'] },
  { id: 'discourse_flexibility', label: 'Keeping a long, unpredictable exchange coherent', canDos: ['sustain_coherence_across_topic_shifts', 'repair_a_misunderstanding_at_intention_level', 'function_inside_an_unfamiliar_high_ambiguity_exchange'] },
  { id: 'stylistic_control', label: 'Shaping your own language on purpose', canDos: ['edit_own_text_for_precision_and_tone', 'vary_expression_to_avoid_flattening_meaning', 'adapt_a_text_across_genre_and_register'] },
  { id: 'integrated_mediation', label: 'Standing between two people who disagree', canDos: ['mediate_a_complex_disagreement_for_a_third_party'] },
]

/*
 * One entry per `c2.json#/canDos` record, same field names as the blueprint
 * (camelCase) so the fidelity check can walk both structures identically.
 * `patterns` mirrors the blueprint's `infrastructure` field name-for-name
 * (renamed here only to match B1/B2's own field-naming convention in their
 * equivalent files — the values are untouched).
 */
export const C2_CAN_DOS = [
  {
    id: 'extract_key_argument_from_dense_text', family: 'dense_input_synthesis', scope: 'required',
    cefrRefs: ['Reading for Information and Argument C2', 'Overall Reading Comprehension C2'],
    prerequisites: ['c1.synthesize_two_conflicting_viewpoints', 'c1.infer_implied_meaning_in_unfamiliar_context'],
    semanticNeeds: ['source_text'], patterns: ['evidentiality_stance_pattern'],
    firstContext: 'dense_input_synthesis', reuseContexts: ['precise_reformulation'],
    transferContexts: ['an unseen source text in an unrelated topic area'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required', evaluation: 'hybrid',
  },
  {
    id: 'synthesize_multiple_viewpoints', family: 'dense_input_synthesis', scope: 'required',
    cefrRefs: ['Reading for Information and Argument C2'],
    prerequisites: ['extract_key_argument_from_dense_text'],
    semanticNeeds: ['source_text'], patterns: ['evidentiality_stance_pattern'],
    firstContext: 'dense_input_synthesis', reuseContexts: [],
    transferContexts: ['an unseen source text in an unrelated topic area'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required', evaluation: 'hybrid',
  },
  {
    id: 'identify_authors_stance_and_bias', family: 'dense_input_synthesis', scope: 'required',
    cefrRefs: ['Reading for Information and Argument C2', 'Sociolinguistic Appropriateness C2'],
    prerequisites: ['extract_key_argument_from_dense_text'],
    semanticNeeds: ['source_text', 'stance_marker'], patterns: ['evidentiality_stance_pattern'],
    firstContext: 'dense_input_synthesis',
    reuseContexts: [],
    reuseContextsNote: "arc 3 (implication_and_subtext)'s `reinforcedCanDos` names this capability, but that arc's own `reuseMap` does not carry a matching entry (c2.json disagrees with itself once, same class of issue B2's README documented for its own reuseMatrix). Content authoring follows the arc's own reuseMap, the more specific source, per that precedent — see this level's implementation README.",
    transferContexts: ['an unseen source text in an unrelated topic area'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required', evaluation: 'hybrid',
  },
  {
    id: 'reformulate_dense_source_for_a_new_audience', family: 'precise_reformulation', scope: 'required',
    cefrRefs: ['Processing Text (mediation) C2'],
    prerequisites: ['extract_key_argument_from_dense_text', 'c1.reformulate_for_a_different_audience'],
    semanticNeeds: ['source_text', 'audience_profile'], patterns: ['reformulation_connector_pattern'],
    firstContext: 'precise_reformulation', reuseContexts: ['stylistic_control'],
    transferContexts: ['a new source text/audience pairing not used in teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required', evaluation: 'hybrid',
  },
  {
    id: 'summarize_preserving_nuance', family: 'precise_reformulation', scope: 'required',
    cefrRefs: ['Processing Text (mediation) C2'],
    prerequisites: ['reformulate_dense_source_for_a_new_audience', 'synthesize_multiple_viewpoints'],
    semanticNeeds: ['source_text', 'audience_profile'], patterns: ['reformulation_connector_pattern'],
    firstContext: 'precise_reformulation', reuseContexts: ['integrated_mediation'],
    transferContexts: ['a new source text/audience pairing not used in teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required', evaluation: 'hybrid',
    intentReuse: 'reformulate_for_audience with subtype summarize',
  },
  {
    id: 'paraphrase_to_avoid_flattening_meaning', family: 'precise_reformulation', scope: 'should',
    cefrRefs: ['Vocabulary Range C2'],
    prerequisites: ['reformulate_dense_source_for_a_new_audience'],
    semanticNeeds: ['source_text'], patterns: ['reformulation_connector_pattern'],
    firstContext: 'precise_reformulation', reuseContexts: [],
    transferContexts: ['a new source text/audience pairing not used in teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 1, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'should', evaluation: 'hybrid',
    intentReuse: 'reformulate_for_audience with subtype paraphrase',
  },
  {
    id: 'recognize_implied_meaning', family: 'implication_and_subtext', scope: 'required',
    cefrRefs: ['Sociolinguistic Appropriateness C2', 'Coherence and Cohesion C2'],
    prerequisites: ['c1.infer_implied_meaning_in_unfamiliar_context', 'identify_authors_stance_and_bias'],
    semanticNeeds: ['stance_marker'], patterns: ['irony_understatement_marker_pattern'],
    firstContext: 'implication_and_subtext', reuseContexts: ['register_and_pragmatics'],
    transferContexts: ['an unseen exchange carrying an unfamiliar implicature'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required', evaluation: 'hybrid',
  },
  {
    id: 'recognize_irony_and_understatement', family: 'implication_and_subtext', scope: 'required',
    cefrRefs: ['Global Scale C2'],
    prerequisites: ['recognize_implied_meaning'],
    semanticNeeds: ['stance_marker'], patterns: ['irony_understatement_marker_pattern'],
    firstContext: 'implication_and_subtext', reuseContexts: ['discourse_flexibility', 'integrated_mediation'],
    transferContexts: ['an unseen exchange carrying an unfamiliar implicature'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required', evaluation: 'hybrid',
    intentReuse: 'recognize_implication with subtype irony',
  },
  {
    id: 'respond_appropriately_to_an_indirect_speech_act', family: 'implication_and_subtext', scope: 'should',
    cefrRefs: ['Sociolinguistic Appropriateness C2'],
    prerequisites: ['recognize_implied_meaning'],
    semanticNeeds: ['stance_marker'], patterns: ['irony_understatement_marker_pattern'],
    firstContext: 'implication_and_subtext', reuseContexts: [],
    transferContexts: ['an unseen exchange carrying an unfamiliar implicature'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 1, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'should', evaluation: 'hybrid',
    intentReuse: 'recognize_implication with subtype indirect_speech_act',
  },
  {
    id: 'shift_register_deliberately', family: 'register_and_pragmatics', scope: 'required',
    cefrRefs: ['Sociolinguistic Appropriateness C2'],
    prerequisites: ['c1.adapt_register_to_audience'],
    semanticNeeds: ['register_level', 'audience_profile'], patterns: ['register_shift_lexis_pattern'],
    firstContext: 'register_and_pragmatics', reuseContexts: ['stylistic_control'],
    transferContexts: ['a new audience/register pairing not used in teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required', evaluation: 'deterministic_local',
  },
  {
    id: 'soften_or_intensify_a_claim', family: 'register_and_pragmatics', scope: 'required',
    cefrRefs: ['Grammatical Accuracy C2', 'Vocabulary Control C2'],
    prerequisites: ['shift_register_deliberately'],
    semanticNeeds: ['stance_marker'], patterns: ['academic_hedging_pattern', 'boosting_pattern'],
    firstContext: 'register_and_pragmatics', reuseContexts: ['argument_and_position'],
    transferContexts: ['a new audience/register pairing not used in teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required', evaluation: 'deterministic_local',
    intentReuse: 'qualify_claim',
  },
  {
    id: 'manage_face_in_disagreement', family: 'register_and_pragmatics', scope: 'should',
    cefrRefs: ['Sociolinguistic Appropriateness C2', 'Managing Interaction C2'],
    prerequisites: ['soften_or_intensify_a_claim', 'recognize_implied_meaning'],
    semanticNeeds: ['register_level', 'stance_marker'], patterns: ['face_saving_disagreement_pattern'],
    firstContext: 'register_and_pragmatics', reuseContexts: ['discourse_flexibility', 'integrated_mediation'],
    transferContexts: ['a new audience/register pairing not used in teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 1, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'should', evaluation: 'hybrid',
    intentReuse: 'shift_register with subtype face_saving_disagreement',
  },
  {
    id: 'develop_an_extended_qualified_argument', family: 'argument_and_position', scope: 'required',
    cefrRefs: ['Coherence and Cohesion C2', 'Flexibility C2'],
    prerequisites: ['c1.develop_a_structured_argument', 'soften_or_intensify_a_claim'],
    semanticNeeds: ['stance_marker'], patterns: ['academic_hedging_pattern', 'boosting_pattern'],
    firstContext: 'argument_and_position', reuseContexts: ['discourse_flexibility'],
    transferContexts: ['an unseen debate topic and an unseen counterargument'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required', evaluation: 'hybrid',
  },
  {
    id: 'preempt_and_rebut_a_counterargument', family: 'argument_and_position', scope: 'required',
    cefrRefs: ['Flexibility C2', 'Coherence and Cohesion C2'],
    prerequisites: ['develop_an_extended_qualified_argument', 'c1.concede_a_counterpoint_gracefully'],
    semanticNeeds: ['stance_marker'], patterns: ['concession_then_position_pattern'],
    firstContext: 'argument_and_position', reuseContexts: ['integrated_mediation'],
    transferContexts: ['an unseen debate topic and an unseen counterargument'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required', evaluation: 'hybrid',
  },
  {
    id: 'qualify_a_position_with_precision', family: 'argument_and_position', scope: 'should',
    cefrRefs: ['Grammatical Accuracy C2'],
    prerequisites: ['develop_an_extended_qualified_argument', 'soften_or_intensify_a_claim'],
    semanticNeeds: ['stance_marker'], patterns: ['academic_hedging_pattern', 'boosting_pattern'],
    firstContext: 'argument_and_position', reuseContexts: [],
    transferContexts: ['an unseen debate topic and an unseen counterargument'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 1, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'should', evaluation: 'deterministic_local',
    intentReuse: 'qualify_claim',
  },
  {
    id: 'sustain_coherence_across_topic_shifts', family: 'discourse_flexibility', scope: 'required',
    cefrRefs: ['Coherence and Cohesion C2', 'Flexibility C2'],
    prerequisites: [C2_UNRESOLVED_C1_PLACEHOLDER, 'develop_an_extended_qualified_argument'],
    unresolvedPrerequisiteNote: "c1_assumed__handle_abstract_topics is LC-AUD-001's F6 low-confidence row: the audit's candidate match is c1.sustain_a_conversation_across_topic_shifts, but that C1 capability itself still rested on an unresolved-at-audit-time B2 placeholder chain, so a mechanical rename was deliberately NOT applied here — transcribed verbatim from c2.json. Needs an explicit human curriculum-design decision, not an automated fix. Content authoring below treats arc 5 (argument_and_position) as the effective, already-real prerequisite arc and does not invent a resolution for the placeholder.",
    semanticNeeds: [], patterns: ['paragraph_scale_cohesion_pattern'],
    firstContext: 'discourse_flexibility', reuseContexts: ['integrated_mediation'],
    transferContexts: ['an unfamiliar-exchange scenario not used in teaching, by construction'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required', evaluation: 'hybrid', evaluationSpan: 'multiTurn',
  },
  {
    id: 'repair_a_misunderstanding_at_intention_level', family: 'discourse_flexibility', scope: 'required',
    cefrRefs: ['Managing Interaction C2', 'Cooperating C2'],
    prerequisites: ['recognize_implied_meaning', 'manage_face_in_disagreement'],
    semanticNeeds: ['stance_marker'], patterns: ['face_saving_disagreement_pattern'],
    firstContext: 'discourse_flexibility', reuseContexts: ['integrated_mediation'],
    transferContexts: ['an unfamiliar-exchange scenario not used in teaching, by construction'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required', evaluation: 'hybrid',
  },
  {
    id: 'function_inside_an_unfamiliar_high_ambiguity_exchange', family: 'discourse_flexibility', scope: 'should',
    cefrRefs: ['Global Scale C2'],
    prerequisites: ['sustain_coherence_across_topic_shifts', 'repair_a_misunderstanding_at_intention_level'],
    semanticNeeds: [], patterns: ['paragraph_scale_cohesion_pattern'],
    firstContext: 'discourse_flexibility', reuseContexts: [],
    transferContexts: ['an unfamiliar-exchange scenario not used in teaching, by construction'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 1, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'should', evaluation: 'hybrid', evaluationSpan: 'multiTurn',
    intentReuse: 'sustain_coherence with subtype unfamiliar_exchange',
  },
  {
    id: 'edit_own_text_for_precision_and_tone', family: 'stylistic_control', scope: 'required',
    cefrRefs: ['Vocabulary Control C2', 'Grammatical Accuracy C2'],
    prerequisites: ['shift_register_deliberately', 'reformulate_dense_source_for_a_new_audience'],
    semanticNeeds: ['register_level'], patterns: ['lexical_precision_substitution_pattern'],
    firstContext: 'stylistic_control', reuseContexts: ['integrated_mediation'],
    transferContexts: ['an unseen draft with an unfamiliar tone mismatch'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required', evaluation: 'hybrid',
  },
  {
    id: 'vary_expression_to_avoid_flattening_meaning', family: 'stylistic_control', scope: 'should',
    cefrRefs: ['Vocabulary Range C2'],
    prerequisites: ['edit_own_text_for_precision_and_tone'],
    semanticNeeds: [], patterns: ['lexical_precision_substitution_pattern'],
    firstContext: 'stylistic_control', reuseContexts: [],
    transferContexts: ['an unseen draft with an unfamiliar tone mismatch'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 1, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'should', evaluation: 'deterministic_local',
    intentReuse: 'edit_for_precision with subtype lexical_variety',
  },
  {
    id: 'adapt_a_text_across_genre_and_register', family: 'stylistic_control', scope: 'optional',
    cefrRefs: ['Sociolinguistic Appropriateness C2'],
    prerequisites: ['edit_own_text_for_precision_and_tone', 'shift_register_deliberately'],
    semanticNeeds: ['register_level', 'audience_profile'], patterns: ['register_shift_lexis_pattern'],
    firstContext: 'stylistic_control', reuseContexts: [],
    transferContexts: [],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 1, transfer: 0, delayedRetrieval: false },
    graduationRelevance: 'optional', evaluation: 'hybrid',
    intentReuse: 'shift_register with subtype genre_adaptation',
  },
  {
    id: 'mediate_a_complex_disagreement_for_a_third_party', family: 'integrated_mediation', scope: 'required',
    cefrRefs: ['Facilitating Collaborative Interaction C2', 'Global Scale C2'],
    prerequisites: ['summarize_preserving_nuance', 'manage_face_in_disagreement', 'preempt_and_rebut_a_counterargument', 'repair_a_misunderstanding_at_intention_level'],
    semanticNeeds: ['source_text', 'audience_profile', 'register_level', 'stance_marker'],
    patterns: ['reformulation_connector_pattern', 'face_saving_disagreement_pattern', 'concession_then_position_pattern', 'paragraph_scale_cohesion_pattern'],
    firstContext: 'integrated_mediation', reuseContexts: [],
    transferContexts: ['a disagreement scenario and source materials never used in any earlier arc, by construction'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: true },
    graduationRelevance: 'required', evaluation: 'hybrid', evaluationSpan: 'multiTurn', graduationCapstone: true,
  },
]

export const getC2CanDo = (id) => C2_CAN_DOS.find((c) => c.id === id) || null

export const C2_REQUIRED_CAN_DO_IDS = C2_CAN_DOS.filter((c) => c.scope === 'required').map((c) => c.id)
export const C2_SHOULD_CAN_DO_IDS = C2_CAN_DOS.filter((c) => c.scope === 'should').map((c) => c.id)
export const C2_OPTIONAL_CAN_DO_IDS = C2_CAN_DOS.filter((c) => c.scope === 'optional').map((c) => c.id)

/*
 * `<LEVEL>_CAN_DO_INTENT`, the exact shape `curriculum/levelMaps.js` asks a
 * new level's own map file to export. Registering it into
 * `LEVEL_CAN_DO_INTENT_MAPS` is `LC-INT-001` work — out of this task's
 * write scope — so this export exists here as the ready-to-register
 * payload, not yet consumed by anything.
 *
 * One canDo -> one intent, per c2.json#/intentStrategy's rule (13 new
 * intents total, matching `intentStrategy.perArcNewIntentCount`'s sum).
 * Nine capabilities reuse an already-introduced intent under a subtype
 * (`c2.json#/intentStrategy.newSubtypesOnExistingIntents` plus each
 * capability's own `intentReuse` field, transcribed verbatim above) rather
 * than minting a new one — `c2Intents.js` documents every subtype.
 * `canDoForIntent()` (`curriculum/levelMaps.js`) currently assumes one
 * intent maps to exactly one canDo; C2 breaks that assumption in exactly
 * the same way B2 already does for its own capstone reuse (see
 * `docs/curriculum/implementation/c2/core-engine-handoff.md` section 2) —
 * this is a known, already-precedented wiring requirement, not a new one.
 */
export const C2_CAN_DO_INTENT = {
  extract_key_argument_from_dense_text: 'extract_argument',
  synthesize_multiple_viewpoints: 'synthesize_viewpoints',
  identify_authors_stance_and_bias: 'identify_stance',
  reformulate_dense_source_for_a_new_audience: 'reformulate_for_audience',
  summarize_preserving_nuance: 'reformulate_for_audience', // subtype: summarize
  paraphrase_to_avoid_flattening_meaning: 'reformulate_for_audience', // subtype: paraphrase
  recognize_implied_meaning: 'recognize_implication',
  recognize_irony_and_understatement: 'recognize_implication', // subtype: irony
  respond_appropriately_to_an_indirect_speech_act: 'recognize_implication', // subtype: indirect_speech_act
  shift_register_deliberately: 'shift_register',
  soften_or_intensify_a_claim: 'qualify_claim',
  manage_face_in_disagreement: 'shift_register', // subtype: face_saving_disagreement
  develop_an_extended_qualified_argument: 'develop_argument',
  preempt_and_rebut_a_counterargument: 'rebut_counterargument',
  qualify_a_position_with_precision: 'qualify_claim',
  sustain_coherence_across_topic_shifts: 'sustain_coherence',
  repair_a_misunderstanding_at_intention_level: 'repair_at_intention_level',
  function_inside_an_unfamiliar_high_ambiguity_exchange: 'sustain_coherence', // subtype: unfamiliar_exchange
  edit_own_text_for_precision_and_tone: 'edit_for_precision',
  vary_expression_to_avoid_flattening_meaning: 'edit_for_precision', // subtype: lexical_variety
  adapt_a_text_across_genre_and_register: 'shift_register', // subtype: genre_adaptation
  mediate_a_complex_disagreement_for_a_third_party: 'mediate_disagreement',
}

/*
 * Capabilities that declare `evaluationSpan: 'multiTurn'` in c2.json —
 * exactly `coreEngineRequirements[0]` ("multi_turn_evaluation_span"). Every
 * evaluator for these three needs access to more than the latest learner
 * turn; see `c2EvaluationContracts.js`'s `C2_MULTI_TURN_SPAN_FIXTURES` for
 * the concrete spec.
 */
export const C2_MULTI_TURN_EVALUATION_SPAN_CAN_DO_IDS = C2_CAN_DOS
  .filter((c) => c.evaluationSpan === 'multiTurn')
  .map((c) => c.id)

/*
 * The single capability with `evidence.delayedRetrieval: true` — the level's
 * graduation capstone. Its multi-capability delayed-retrieval requirement
 * (seven OTHER capabilities re-demonstrated unaided inside this one task) is
 * `coreEngineRequirements[3]`; see `c2EvaluationContracts.js`'s
 * `C2_CAPSTONE_DELAYED_RETRIEVAL_CHECKS` for the exact list.
 */
export const C2_DELAYED_RETRIEVAL_CAN_DO_IDS = C2_CAN_DOS
  .filter((c) => c.evidence.delayedRetrieval)
  .map((c) => c.id)

export const C2_GRADUATION_CAPSTONE_ID = 'mediate_a_complex_disagreement_for_a_third_party'
