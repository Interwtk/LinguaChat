/*
 * C2's use of the two shared evaluator dimensions
 * `docs/curriculum/core-engine-requirements.md` already added to
 * `engine/responseEvaluation.js`'s `base()` result shape
 * (`registerAppropriateness`, `discourseCoherence` — both default
 * `checked: false`), plus the three C2-specific core-engine gaps its own
 * blueprint names (`c2.json#/coreEngineRequirements`) that neither B1 nor
 * B2 needed: a multi-turn evaluation span, a multi-capability
 * delayed-retrieval record, and heavier reliance on provider-free hybrid
 * fixtures. This is a design/data artifact, same status as
 * `core-engine-requirements.md` itself — it does not implement scoring
 * logic (out of this task's write scope, `engine/**` is not in
 * `linguachat-frontend/src/learning/levels/c2/**`) — it is the exact spec
 * `LC-INT-001` needs to implement against.
 *
 * c2.json does not tag individual canDos with a
 * `register_dimension_plus_semantic`/`discourse_coherence_plus_semantic`
 * evaluation value the way b2.json does (its `evaluation` field only ever
 * says `hybrid` or `deterministic_local`); the opt-in lists below are
 * therefore authored here directly, against `c2.json#/semanticTypes`'s
 * `register_level.requiredBy` list (for `registerAppropriateness`) and the
 * capabilities that declare `evaluationSpan: 'multiTurn'` plus
 * `repair_a_misunderstanding_at_intention_level` (for `discourseCoherence`,
 * since intention-level repair only makes sense judged across turns even
 * though the blueprint does not tag it `multiTurn`) — not lifted verbatim
 * from a blueprint field the way B2's table could be. This choice is
 * flagged explicitly rather than presented as if the blueprint dictated it.
 */

/*
 * registerAppropriateness: { checked, appropriate, expectedRegister, detectedRegister }
 * Populated for every capability `c2.json#/semanticTypes.proposed`'s
 * `register_level` entry names as `requiredBy`.
 */
export const C2_REGISTER_APPROPRIATENESS_OPT_IN = [
  { canDoId: 'shift_register_deliberately', checked: true, graduationRelevance: 'required-signal', registerPairVocabulary: 'register_shift_lexis_pattern' },
  { canDoId: 'manage_face_in_disagreement', checked: true, graduationRelevance: 'should-relevant-signal', registerPairVocabulary: 'face_saving_disagreement_pattern' },
  { canDoId: 'edit_own_text_for_precision_and_tone', checked: true, graduationRelevance: 'required-signal', registerPairVocabulary: 'lexical_precision_substitution_pattern' },
  { canDoId: 'adapt_a_text_across_genre_and_register', checked: true, graduationRelevance: 'optional-signal', registerPairVocabulary: 'register_shift_lexis_pattern' },
  { canDoId: 'mediate_a_complex_disagreement_for_a_third_party', checked: true, graduationRelevance: 'required-signal', registerPairVocabulary: 'register_shift_lexis_pattern,face_saving_disagreement_pattern' },
]

/*
 * discourseCoherence: { checked, coherent, clausesEvaluated, incoherenceType }
 * `incoherenceType` is the closed set `core-engine-requirements.md` section
 * 3 already defines: flat_list | contradictory | off_topic_drift. Populated
 * for the three `evaluationSpan: 'multiTurn'` capabilities plus
 * `repair_a_misunderstanding_at_intention_level` (see file header).
 */
export const C2_DISCOURSE_COHERENCE_OPT_IN = [
  { canDoId: 'sustain_coherence_across_topic_shifts', checked: true, graduationRelevance: 'required' },
  { canDoId: 'function_inside_an_unfamiliar_high_ambiguity_exchange', checked: true, graduationRelevance: 'should' },
  { canDoId: 'repair_a_misunderstanding_at_intention_level', checked: true, graduationRelevance: 'required' },
  { canDoId: 'mediate_a_complex_disagreement_for_a_third_party', checked: true, graduationRelevance: 'required' },
]

/*
 * `coreEngineRequirements[0]` — multi_turn_evaluation_span. The exact
 * contract a span-aware evaluator needs, concrete enough that `LC-INT-001`
 * can implement it without a second design pass:
 *
 *  - `turnWindow`: the evaluator receives the full exchange since the last
 *    topic boundary (not just the latest learner turn), tagged with
 *    speaker and an optional `topicTag`.
 *  - `sustain_coherence`/`sustain_coherence (unfamiliar_exchange subtype)`:
 *    the evaluator must detect whether the learner's new turn (a) responds
 *    to what the interlocutor just said, using a cohesive-device marker
 *    from `paragraph_scale_cohesion_pattern` OR discourse-level continuity,
 *    and (b) does not silently abandon the prior topic without a signalled
 *    transition (`off_topic_drift` per `core-engine-requirements.md`
 *    section 3's closed incoherenceType set).
 *  - `repair_at_intention_level`: the evaluator must have access to BOTH
 *    the misread turn and the repair turn, and check the repair addresses
 *    the INTENTION the interlocutor names as misunderstood, not just
 *    restates the original fact — c2Intents.js's own `repair_at_intention_level`
 *    nearMiss example is exactly this failure mode (a correct, well-formed
 *    reply that repairs the wrong thing).
 *  - `mediate_disagreement`: the evaluator needs the full source dispute
 *    text plus the learner's mediation turn(s), and must check (a) each
 *    side's position is represented, (b) neither side is editorialized
 *    against, and (c) a next step is proposed — never gradable from a
 *    single isolated sentence.
 */
export const C2_MULTI_TURN_SPAN_FIXTURES = [
  { canDoId: 'sustain_coherence_across_topic_shifts', spanKind: 'topic_bridge', minimumTurnsInSpan: 2 },
  { canDoId: 'function_inside_an_unfamiliar_high_ambiguity_exchange', spanKind: 'topic_bridge', minimumTurnsInSpan: 2 },
  { canDoId: 'repair_a_misunderstanding_at_intention_level', spanKind: 'misread_then_repair', minimumTurnsInSpan: 2 },
  { canDoId: 'mediate_a_complex_disagreement_for_a_third_party', spanKind: 'full_dispute_plus_mediation', minimumTurnsInSpan: 3 },
]

/*
 * `coreEngineRequirements[3]` — multi_capability_delayed_retrieval_per_task.
 * The capstone (arc 8) is the level's only capability with
 * `evidence.delayedRetrieval: true`, and it requires SEVEN other
 * capabilities' delayed-retrieval evidence recorded inside the same task
 * completion — `learnerModel.js` currently records at most one
 * `evidenceKind` per completion (`.ai/foundry/requests/LC-CONT-C2.md` item
 * 7). This is the exact list `content-plan.json`'s
 * `integrated_mediation.delayedRetrievalChecks` already names, transcribed
 * here as the runtime contract `LC-INT-001` needs: one delayedRetrieval
 * evidence record per capabilityId below, all logged against the single
 * arc-8 capstone task completion.
 */
export const C2_CAPSTONE_DELAYED_RETRIEVAL_CHECKS = [
  { capabilityId: 'summarize_preserving_nuance', marker: 'T', note: 'transfer, not delayed retrieval in the strict sense — the mediation summary reuses reformulation-for-audience skill on genuinely new material' },
  { capabilityId: 'manage_face_in_disagreement', marker: 'D' },
  { capabilityId: 'preempt_and_rebut_a_counterargument', marker: 'D' },
  { capabilityId: 'repair_a_misunderstanding_at_intention_level', marker: 'D' },
  { capabilityId: 'sustain_coherence_across_topic_shifts', marker: 'D' },
  { capabilityId: 'recognize_irony_and_understatement', marker: 'D' },
  { capabilityId: 'edit_own_text_for_precision_and_tone', marker: 'F', note: 'final integration — folded into the capstone turn itself rather than a separately gradable instance' },
]

/*
 * Honest fallback for every hybrid intent when the provider is unreachable
 * (mirrors `b2EvaluationContracts.js`'s three-tier contract: provider-graded
 * when reachable; a narrower LOCAL STRUCTURAL FLOOR when not; the degraded
 * state surfaced honestly, never a silent accept or silent downgrade).
 * Covers every intent `c2.json#/evaluationStrategy.hybrid` names.
 */
export const C2_STRUCTURAL_FLOOR_FALLBACK = [
  { intentId: 'extract_argument', structuralFloor: 'response references at least one specific detail from the source text AND is not a verbatim copy of it' },
  { intentId: 'synthesize_viewpoints', structuralFloor: 'response references content attributable to both source viewpoints, not only one' },
  { intentId: 'identify_stance', structuralFloor: 'response contains a stance_marker-associated evidentiality_stance_pattern token or an explicit certainty/doubt term' },
  { intentId: 'reformulate_for_audience', structuralFloor: 'not a verbatim copy of the source AND contains a reformulation_connector_pattern marker' },
  { intentId: 'recognize_implication', structuralFloor: 'response does not simply repeat the literal source sentence back' },
  { intentId: 'develop_argument', structuralFloor: 'response contains an academic_hedging_pattern or boosting_pattern marker AND a concession_then_position_pattern marker' },
  { intentId: 'rebut_counterargument', structuralFloor: 'response contains a concession_then_position_pattern marker (acknowledges the counterargument before countering it)' },
  { intentId: 'sustain_coherence', structuralFloor: 'response contains a paragraph_scale_cohesion_pattern marker bridging to the prior turn, per C2_MULTI_TURN_SPAN_FIXTURES' },
  { intentId: 'repair_at_intention_level', structuralFloor: 'response addresses the interlocutor by acknowledging their stated concern before restating the learner’s own point' },
  { intentId: 'mediate_disagreement', structuralFloor: 'response contains at least one reformulation_connector_pattern marker per side represented AND does not contain a first-person stance verb (e.g. "I think") taking either side' },
]

/*
 * Meaning-preserved reformulation/summary structural floor (mirrors
 * `b2EvaluationContracts.js`'s equivalent): when the provider is
 * unreachable, check the response is not a verbatim copy of the source and
 * contains a reformulation marker — never a claim of verified
 * meaning-preservation, which requires the provider-graded path.
 */
export const C2_MEANING_PRESERVATION_STRUCTURAL_FLOOR = [
  { intentId: 'reformulate_for_audience', subtype: null, structuralFloor: 'not a verbatim copy of the source AND contains a reformulation_connector_pattern marker' },
  { intentId: 'reformulate_for_audience', subtype: 'summarize', structuralFloor: 'not a verbatim copy AND shorter than the source AND contains a reformulation_connector_pattern marker' },
  { intentId: 'reformulate_for_audience', subtype: 'paraphrase', structuralFloor: 'not a verbatim copy AND preserves the source’s hedge/certainty token if one was present' },
]

/*
 * Every discourse-coherence refusal case the shared engine must prove
 * before any C2 consumer ships (same shape as
 * `b2EvaluationContracts.js`'s `B2_DISCOURSE_COHERENCE_REFUSAL_FIXTURES`,
 * extended with the multi-turn span this level additionally requires).
 */
export const C2_DISCOURSE_COHERENCE_REFUSAL_FIXTURES = [
  { type: 'contradictory', description: 'a mediation/argument turn whose second half contradicts a position stated in its first half', mustFailWith: 'contradictory' },
  { type: 'flat_list', description: 'N individually correct, unconnected sentences on different subtopics with no shift marker, inside one multi-turn span', mustFailWith: 'flat_list' },
  { type: 'off_topic_drift', description: 'abandons the active topic mid-span without a signalled change (the sustain_coherence nearMiss fixture in c2Intents.js)', mustFailWith: 'off_topic_drift' },
  { type: 'coherent_control', description: 'a genuinely coherent multi-turn span using paragraph_scale_cohesion_pattern vocabulary', mustPass: true },
]
