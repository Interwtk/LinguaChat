/*
 * B2's use of the two shared evaluator dimensions
 * `docs/curriculum/core-engine-requirements.md` already added to
 * `engine/responseEvaluation.js`'s `base()` result shape
 * (`registerAppropriateness`, `discourseCoherence` — both default
 * `checked: false` for every existing Pre-A1/A1 evaluator). This file is the
 * per-capability opt-in data those two dimensions need (per that document's
 * "scoring is per-capability opt-in, not global"), plus the honest-fallback
 * spec for open/paragraph-length turns and meaning-preserving reformulation
 * (`core-engine-requirements.md` sections 15.3/15.4 in b2.md).
 *
 * This is a design/data artifact, same status as
 * `core-engine-requirements.md` itself: it does not implement scoring logic
 * (that is `engine/responseEvaluation.js` work, out of this task's write
 * scope) — it is the exact opt-in table + fallback spec `LC-INT-001` needs to
 * implement against, so B2 and C1 do not each invent an incompatible one
 * (the risk `core-engine-requirements.md` was written to head off).
 */

/*
 * registerAppropriateness: { checked, appropriate, expectedRegister, detectedRegister }
 * Populated only for capabilities where register is graded as its own
 * verdict, per b2.json canDos[].evaluation === 'register_dimension_plus_semantic'.
 * `graduationRelevance` mirrors b2.json — B2 uses this dimension as a
 * should-relevant capstone signal, never a graduation blocker (unlike C1,
 * which will use it as required from its own Arc B onward).
 */
export const B2_REGISTER_APPROPRIATENESS_OPT_IN = [
  { canDoId: 'adjust_register_to_context', checked: true, graduationRelevance: 'should-relevant-signal', registerPairVocabulary: 'register_marker_pattern' },
  { canDoId: 'soften_or_strengthen_a_statement', checked: true, graduationRelevance: 'should-relevant-signal', registerPairVocabulary: 'hedging_pattern,intensifying_pattern' },
  { canDoId: 'negotiate_an_agreement_under_pushback', checked: true, graduationRelevance: 'should-relevant-signal', registerPairVocabulary: 'diplomatic_hedge_pattern' },
]

/*
 * discourseCoherence: { checked, coherent, clausesEvaluated, incoherenceType }
 * `incoherenceType` is a closed set: flat_list | contradictory | off_topic_drift
 * (core-engine-requirements.md section 3). Populated only for the capstone's
 * three new conversation-length capabilities, per b2.json canDos[].evaluation
 * === 'discourse_coherence_plus_semantic'.
 */
export const B2_DISCOURSE_COHERENCE_OPT_IN = [
  { canDoId: 'sustain_a_multi_topic_conversation', checked: true, graduationRelevance: 'required' },
  { canDoId: 'handle_a_topic_shift_gracefully', checked: true, graduationRelevance: 'required' },
  { canDoId: 'negotiate_an_agreement_under_pushback', checked: true, graduationRelevance: 'required' },
]

/*
 * Honest three-tier fallback for open, paragraph-length argumentative/
 * negotiation turns when the provider is unreachable (b2.md section 15.3):
 * provider-graded when reachable; a narrower LOCAL STRUCTURAL FLOOR when not
 * (declared per intent below); a visible, honest "checked more closely when
 * you're back online" state, never a silent accept or silent downgrade.
 */
export const B2_STRUCTURAL_FLOOR_FALLBACK = [
  {
    intentId: 'argue_opinion_with_reason', // renamed at LC-INT-001 wiring time — see b2Capabilities.js
    structuralFloor: 'response contains a stance marker from opinion_stance_pattern and at least one connector/justification form',
  },
  {
    intentId: 'weigh_options',
    structuralFloor: 'response contains a contrast connector from contrast_connector_pattern and names both options',
  },
  {
    intentId: 'propose_a_resolution',
    structuralFloor: 'response contains a proposal marker from negotiation_proposal_pattern and references the stated problem',
  },
]

/*
 * Meaning-preserved reformulation/summary structural floor
 * (b2.md section 15.4): when the provider is unreachable, check that the
 * response is not a verbatim copy of the source and contains a
 * reformulation/summary marker — never a claim of verified
 * meaning-preservation, which requires the provider-graded path.
 */
export const B2_MEANING_PRESERVATION_STRUCTURAL_FLOOR = [
  { intentId: 'summarize_for_third_party', structuralFloor: 'not a verbatim copy of the source AND contains a summary_connector_pattern marker' },
  { intentId: 'reformulate_for_clarity', structuralFloor: 'not a verbatim copy of the source AND contains a reformulation_marker_pattern marker' },
  { intentId: 'report_third_party_opinion', structuralFloor: 'not a verbatim copy of the source AND contains a reported_speech_pattern marker' },
]

/*
 * Every required-evidence discourse-coherence refusal case
 * `core-engine-requirements.md` section 3 requires proving before any
 * consumer ships, restated here as the exact fixtures B2 content authoring
 * used to design arc 6's turns against (see arcs/b2Arc6*.js).
 */
export const B2_DISCOURSE_COHERENCE_REFUSAL_FIXTURES = [
  { type: 'contradictory', description: 'correct sentence 1, then a sentence 2 that contradicts sentence 1', mustFailWith: 'contradictory' },
  { type: 'flat_list', description: 'N individually correct, unconnected sentences on different subtopics with no shift marker', mustFailWith: 'flat_list' },
  { type: 'off_topic_drift', description: 'abandons the active topic mid-turn without a signalled change', mustFailWith: 'off_topic_drift' },
  { type: 'coherent_control', description: 'a genuinely coherent multi-sentence turn using the taught cohesive-device vocabulary', mustPass: true },
]
