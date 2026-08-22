/*
 * C1's use of the two shared evaluator dimensions
 * `docs/curriculum/core-engine-requirements.md` already added to
 * `engine/responseEvaluation.js`'s `base()` result shape
 * (`registerAppropriateness`, `discourseCoherence` — both default
 * `checked: false` for every existing Pre-A1/A1 evaluator, per that
 * document's consolidated B2+C1 design). This file is the per-capability
 * opt-in data those two dimensions need ("scoring is per-capability opt-in,
 * not global"), plus C1's own conversation-state-tracking spec
 * (c1.json#/coreEngineRequirements `conversation_state_tracking`, which
 * `core-engine-requirements.md` section 3 explicitly keeps SEPARATE from
 * discourse-coherence scoring rather than merging the two) and the honest-
 * fallback structural floor for open, paragraph-length turns.
 *
 * Unlike B2 (should-relevant, capstone-only signal), C1 uses
 * registerAppropriateness as REQUIRED from register_and_diplomacy onward and
 * discourseCoherence as REQUIRED from extended_structured_discourse onward
 * (c1.md sections 15.1/15.2, c1.json#/coreEngineRequirements) — same field
 * shape as B2's, different `graduationRelevance` per capability, exactly the
 * "same field, different graduationRelevance" design
 * `core-engine-requirements.md` section 2 anticipates.
 *
 * This is a design/data artifact, same status as
 * `core-engine-requirements.md` itself: it does not implement scoring logic
 * (that is `engine/responseEvaluation.js` work, out of this task's write
 * scope) — it is the exact opt-in table + fallback spec `LC-INT-001` needs to
 * implement against.
 */

/*
 * registerAppropriateness: { checked, appropriate, expectedRegister, detectedRegister }
 * Populated for every capability whose canDo is directly about register
 * choice/diplomacy, or that reuses register_pair_pattern/mitigation_device_pattern
 * as its own evidence. `graduationRelevance: 'required'` from
 * register_and_diplomacy onward, per c1.md section 15.1 ("required from the
 * arc onward, not optional") — unlike B2's should-relevant capstone-only use.
 */
export const C1_REGISTER_APPROPRIATENESS_OPT_IN = [
  { canDoId: 'adapt_register_to_audience', checked: true, graduationRelevance: 'required', registerPairVocabulary: 'register_pair_pattern' },
  { canDoId: 'hedge_and_mitigate_a_statement', checked: true, graduationRelevance: 'required', registerPairVocabulary: 'mitigation_device_pattern' },
  { canDoId: 'disagree_diplomatically', checked: true, graduationRelevance: 'required', registerPairVocabulary: 'mitigation_device_pattern,concessive_clause_pattern' },
  { canDoId: 'repair_a_register_slip', checked: true, graduationRelevance: 'should-relevant-signal', registerPairVocabulary: 'register_pair_pattern,self_repair_discourse_pattern' },
  { canDoId: 'reformulate_for_a_different_audience', checked: true, graduationRelevance: 'required', registerPairVocabulary: 'register_pair_pattern' },
  { canDoId: 'shift_register_within_one_conversation', checked: true, graduationRelevance: 'required', registerPairVocabulary: 'register_pair_pattern' },
]

/*
 * discourseCoherence: { checked, coherent, clausesEvaluated, incoherenceType }
 * `incoherenceType` is a closed set: flat_list | contradictory | off_topic_drift
 * (core-engine-requirements.md section 3). Populated for every capability
 * whose canDo is directly about multi-sentence cohesion within one turn
 * (extended_structured_discourse's four) plus the track_discourse family
 * (sustained_interaction's conversation-length capabilities), per c1.md
 * section 15.2 ("required from Arc E onward").
 */
export const C1_DISCOURSE_COHERENCE_OPT_IN = [
  { canDoId: 'produce_an_extended_structured_explanation', checked: true, graduationRelevance: 'required' },
  { canDoId: 'use_cohesive_devices_across_a_turn', checked: true, graduationRelevance: 'required' },
  { canDoId: 'self_correct_without_losing_the_thread', checked: true, graduationRelevance: 'required' },
  { canDoId: 'open_and_close_an_extended_turn', checked: true, graduationRelevance: 'should-relevant-signal' },
  { canDoId: 'sustain_a_conversation_across_topic_shifts', checked: true, graduationRelevance: 'required' },
  { canDoId: 'close_a_complex_interaction_with_a_summary', checked: true, graduationRelevance: 'should-relevant-signal' },
]

/*
 * `conversation_state_tracking` (c1.json#/coreEngineRequirements, kept
 * deliberately SEPARATE from discourseCoherence per
 * core-engine-requirements.md section 3 — "coherent within a turn" vs.
 * "accurately references an earlier turn" are different mechanisms). This is
 * the exact fixture spec `refer_back_to_earlier_discourse` content is
 * authored against: a bounded conversation-history buffer the evaluator
 * checks a later turn's reference against, scoped to one episode run.
 */
export const C1_CONVERSATION_STATE_TRACKING_OPT_IN = [
  { canDoId: 'refer_back_to_earlier_discourse', checked: true, graduationRelevance: 'required', historyWindowTurns: 'whole episode run (bounded to the single sustained_interaction episode)' },
]

export const C1_CONVERSATION_STATE_TRACKING_FIXTURES = [
  { type: 'correct_reference', description: 'accurately names the specific earlier point being referred back to', mustPass: true },
  { type: 'vague_reference', description: "a reference with no specific content named ('like I said before')", mustFailWith: 'insufficient_specificity' },
  { type: 'misattributed_reference', description: 'names an earlier point that was not actually said in this conversation, or attributes it to the wrong speaker', mustFailWith: 'misattributed' },
]

/*
 * Honest three-tier fallback for open, paragraph-length argumentative/
 * negotiation/extended-explanation turns when the provider is unreachable
 * (mirrors b2.md section 15.3's fallback design, extended to C1's own
 * intents): provider-graded when reachable; a narrower LOCAL STRUCTURAL
 * FLOOR when not (declared per intent below); a visible, honest "checked
 * more closely when you're back online" state, never a silent accept or
 * silent downgrade.
 */
export const C1_STRUCTURAL_FLOOR_FALLBACK = [
  { intentId: 'state_structured_argument', structuralFloor: 'response contains a claim marker (emphatic_cleft_pattern or a stance verb) and at least one connector/reason/example marker' },
  { intentId: 'qualify_claim', structuralFloor: 'response contains a hedge marker from hedging_modal_pattern or hedging_adverbial_pattern' },
  { intentId: 'concede_point', structuralFloor: 'response contains a concession marker from concessive_clause_pattern and does not fully abandon the stance' },
  { intentId: 'adapt_register', structuralFloor: 'response contains a register-pair-appropriate marker for the declared expectedRegister' },
  { intentId: 'hedge_statement', structuralFloor: 'response contains a mitigation marker from mitigation_device_pattern' },
  { intentId: 'negotiate_outcome', structuralFloor: 'response contains a proposal marker from conditional_alternative_pattern and references the stated constraint(s)' },
  { intentId: 'extended_explanation', structuralFloor: 'response is multi-sentence and contains at least one connector from cohesive_connector_pattern' },
]

/*
 * Meaning-preserved summary/reformulation structural floor (mirrors b2.md
 * section 15.4's design, C1's own mediation intents): when the provider is
 * unreachable, check the response is not a verbatim copy of the source and
 * contains a summary/reformulation marker — never a claim of verified
 * meaning-preservation, which requires the provider-graded path.
 */
export const C1_MEANING_PRESERVATION_STRUCTURAL_FLOOR = [
  { intentId: 'summarize_message', structuralFloor: 'not a verbatim copy of the source AND contains a cohesive_connector_pattern or register_pair_pattern marker' },
  { intentId: 'synthesize_viewpoints', structuralFloor: 'not a verbatim copy of either source AND names content attributable to both sources' },
]

/*
 * Every required-evidence discourse-coherence refusal case
 * `core-engine-requirements.md` section 3 requires proving before any
 * consumer ships, restated here as the exact fixtures C1 content authoring
 * used to design Arc E / Arc G's turns against (see arcs/c1Arc5*.js,
 * arcs/c1Arc7*.js).
 */
export const C1_DISCOURSE_COHERENCE_REFUSAL_FIXTURES = [
  { type: 'contradictory', description: 'correct sentence 1, then a sentence 2 that contradicts sentence 1', mustFailWith: 'contradictory' },
  { type: 'flat_list', description: 'N individually correct, unconnected sentences with no connecting device', mustFailWith: 'flat_list' },
  { type: 'off_topic_drift', description: 'abandons the active topic mid-turn without a signalled change', mustFailWith: 'off_topic_drift' },
  { type: 'coherent_control', description: 'a genuinely coherent multi-sentence turn using the taught cohesive-device vocabulary', mustPass: true },
]
