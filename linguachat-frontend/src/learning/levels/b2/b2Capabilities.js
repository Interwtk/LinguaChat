/*
 * B2 capability graph — a JS-native transcription of
 * `docs/curriculum/blueprints/b2.json#/canDos`, `#/skillFamilies` and
 * `#/b1Inheritance`. Every id, prerequisite, evidence target and CEFR
 * reference here must match that file; `scripts/foundry/b2/check-b2-blueprint-fidelity.mjs`
 * diffs the two and fails the moment they drift.
 *
 * Nothing in this file is imported by any runtime module yet (mirrors A1's
 * own blueprint-before-content discipline, `a1-blueprint.json`'s own note).
 * Wiring this into `curriculum/levelMaps.js`, `engine/scaffolding.js`, or any
 * shared evaluator dispatch is out of `LC-CONT-B2`'s write scope — see
 * `docs/curriculum/implementation/b2/core-engine-handoff.md`.
 */

export const B2_PREREQUISITE_LEVEL = 'b1'

/*
 * Real B1 capability ids this level depends on, reconciled against
 * `docs/curriculum/blueprints/b1.json` (see b2.md's top-of-file note). Not a
 * B2-owned id — never redefine one of these here.
 */
export const B2_B1_PREREQUISITES = [
  'b1.narrate_connected_event',
  'b1.give_an_opinion',
  'b1.compare_options_with_reasons',
  'b1.negotiate_a_solution',
  'b1.sustain_topic_change',
  'b1.talk_about_plans_and_intentions',
]

export const B2_SKILL_FAMILIES = [
  { id: 'argument', label: 'Making the case', canDos: ['develop_and_defend_opinion', 'weigh_advantages_and_disadvantages', 'concede_a_point_and_counter'] },
  { id: 'negotiation', label: 'When plans go wrong', canDos: ['justify_a_request_for_change', 'negotiate_a_resolution', 'express_frustration_diplomatically'] },
  { id: 'hypothesis', label: 'What if', canDos: ['hypothesize_about_unreal_situations', 'speculate_about_cause_and_effect', 'express_regret_about_a_past_decision'] },
  { id: 'mediation', label: 'Talking around a subject', canDos: ['summarize_for_someone_else', 'reformulate_to_clarify', 'report_someone_elses_opinion'] },
  { id: 'register', label: 'Reading between the lines', canDos: ['adjust_register_to_context', 'soften_or_strengthen_a_statement', 'infer_implied_meaning'] },
  { id: 'sustained_discourse', label: 'The long conversation', canDos: ['sustain_a_multi_topic_conversation', 'handle_a_topic_shift_gracefully', 'negotiate_an_agreement_under_pushback', 'use_idiomatic_expressions_naturally'] },
]

/*
 * One entry per `b2.json#/canDos` record, same field names as the blueprint
 * (camelCase) so the fidelity check can walk both structures identically.
 */
export const B2_CAN_DOS = [
  {
    id: 'develop_and_defend_opinion', family: 'argument', scope: 'required',
    cefrRefs: ['Sustained monologue: putting a case (B2)'],
    prerequisites: ['b1.give_an_opinion'],
    semanticNeeds: ['stance'],
    patterns: ['opinion_stance_pattern'],
    firstContext: 'making_the_case',
    reuseContexts: ['when_plans_go_wrong', 'reading_between_the_lines', 'the_long_conversation'],
    transferContexts: ['a novel everyday issue not used during teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: true },
    graduationRelevance: 'required',
    evaluation: 'hybrid_provider_preferred',
  },
  {
    id: 'weigh_advantages_and_disadvantages', family: 'argument', scope: 'required',
    cefrRefs: ['Sustained monologue: putting a case (B2)'],
    prerequisites: ['b1.compare_options_with_reasons', 'develop_and_defend_opinion'],
    semanticNeeds: ['stance'],
    patterns: ['contrast_connector_pattern', 'advantage_disadvantage_frame'],
    firstContext: 'making_the_case',
    reuseContexts: ['the_long_conversation'],
    transferContexts: ['comparing options never used during teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: true },
    graduationRelevance: 'required',
    evaluation: 'hybrid_provider_preferred',
  },
  {
    id: 'concede_a_point_and_counter', family: 'argument', scope: 'should',
    cefrRefs: ['Informal discussion (with friends) (B2)'],
    prerequisites: ['develop_and_defend_opinion'],
    semanticNeeds: ['stance'],
    patterns: ['concession_counter_pattern'],
    firstContext: 'making_the_case',
    reuseContexts: ['when_plans_go_wrong', 'the_long_conversation'],
    transferContexts: ['conceding a point in a novel argument'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 1, transfer: 0, delayedRetrieval: true },
    graduationRelevance: 'should',
    evaluation: 'hybrid_provider_preferred',
  },
  {
    id: 'justify_a_request_for_change', family: 'negotiation', scope: 'required',
    cefrRefs: ['Goal-oriented co-operation (B2)'],
    prerequisites: ['b1.give_an_opinion'],
    semanticNeeds: ['problem_type'],
    patterns: ['justification_pattern'],
    firstContext: 'when_plans_go_wrong',
    reuseContexts: ['the_long_conversation'],
    transferContexts: ['justifying a request for a problem type not used during teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: true },
    graduationRelevance: 'required',
    evaluation: 'hybrid_provider_preferred',
  },
  {
    id: 'negotiate_a_resolution', family: 'negotiation', scope: 'required',
    cefrRefs: ['Goal-oriented co-operation (B2)'],
    prerequisites: ['b1.negotiate_a_solution', 'justify_a_request_for_change'],
    semanticNeeds: ['problem_type'],
    patterns: ['negotiation_proposal_pattern'],
    firstContext: 'when_plans_go_wrong',
    reuseContexts: ['the_long_conversation'],
    transferContexts: ['negotiating a resolution for a problem type not used during teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: true },
    graduationRelevance: 'required',
    evaluation: 'hybrid_provider_preferred',
  },
  {
    id: 'express_frustration_diplomatically', family: 'negotiation', scope: 'should',
    cefrRefs: ['Goal-oriented co-operation (B2)'],
    prerequisites: ['justify_a_request_for_change'],
    semanticNeeds: ['problem_type'],
    patterns: ['diplomatic_hedge_pattern'],
    firstContext: 'when_plans_go_wrong',
    reuseContexts: ['the_long_conversation'],
    transferContexts: ['expressing frustration about a novel problem'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 1, transfer: 0, delayedRetrieval: true },
    graduationRelevance: 'should',
    evaluation: 'hybrid_provider_preferred',
  },
  {
    id: 'hypothesize_about_unreal_situations', family: 'hypothesis', scope: 'required',
    cefrRefs: ['Conversation (B2)'],
    prerequisites: ['b1.talk_about_plans_and_intentions'],
    semanticNeeds: [],
    patterns: ['second_conditional_pattern', 'third_conditional_pattern', 'mixed_conditional_pattern'],
    firstContext: 'what_if',
    reuseContexts: ['the_long_conversation'],
    transferContexts: ['a hypothetical scenario not used during teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: true },
    graduationRelevance: 'required',
    evaluation: 'deterministic_local_with_hybrid_escalation',
  },
  {
    id: 'speculate_about_cause_and_effect', family: 'hypothesis', scope: 'required',
    cefrRefs: ['Conversation (B2)'],
    prerequisites: ['hypothesize_about_unreal_situations'],
    semanticNeeds: [],
    patterns: ['modal_deduction_present_pattern', 'modal_deduction_past_pattern'],
    firstContext: 'what_if',
    reuseContexts: ['the_long_conversation'],
    transferContexts: ['speculating about a novel everyday mystery'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: true },
    graduationRelevance: 'required',
    evaluation: 'deterministic_local_with_hybrid_escalation',
  },
  {
    id: 'express_regret_about_a_past_decision', family: 'hypothesis', scope: 'should',
    cefrRefs: ['Conversation (B2)'],
    prerequisites: ['b1.narrate_connected_event', 'hypothesize_about_unreal_situations'],
    semanticNeeds: [],
    patterns: ['wish_past_perfect_pattern'],
    firstContext: 'what_if',
    reuseContexts: ['the_long_conversation'],
    transferContexts: ['expressing regret about a novel past decision'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 1, transfer: 0, delayedRetrieval: true },
    graduationRelevance: 'should',
    evaluation: 'deterministic_local_with_hybrid_escalation',
  },
  {
    id: 'summarize_for_someone_else', family: 'mediation', scope: 'required',
    cefrRefs: ['Mediating a text — Processing text (B2)'],
    prerequisites: ['b1.narrate_connected_event', 'b1.sustain_topic_change'],
    semanticNeeds: [],
    patterns: ['reported_speech_pattern', 'summary_connector_pattern'],
    firstContext: 'talking_around_a_subject',
    reuseContexts: ['the_long_conversation'],
    transferContexts: ['summarizing a source text/conversation not used during teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: true },
    graduationRelevance: 'required',
    evaluation: 'provider_preferred_meaning_equivalence',
  },
  {
    id: 'reformulate_to_clarify', family: 'mediation', scope: 'required',
    cefrRefs: ['Mediating a text — Processing text (B2)'],
    prerequisites: ['summarize_for_someone_else'],
    semanticNeeds: [],
    patterns: ['reformulation_marker_pattern'],
    firstContext: 'talking_around_a_subject',
    reuseContexts: ['the_long_conversation'],
    transferContexts: ['reformulating a passage not used during teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: true },
    graduationRelevance: 'required',
    evaluation: 'provider_preferred_meaning_equivalence',
  },
  {
    id: 'report_someone_elses_opinion', family: 'mediation', scope: 'should',
    cefrRefs: ['Mediating a text — Processing text (B2)'],
    prerequisites: ['summarize_for_someone_else', 'b1.give_an_opinion'],
    semanticNeeds: ['stance'],
    patterns: ['reported_speech_pattern'],
    firstContext: 'talking_around_a_subject',
    reuseContexts: ['the_long_conversation'],
    transferContexts: ['reporting an opinion not used during teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 1, transfer: 0, delayedRetrieval: true },
    graduationRelevance: 'should',
    evaluation: 'provider_preferred_meaning_equivalence',
  },
  {
    id: 'adjust_register_to_context', family: 'register', scope: 'required',
    cefrRefs: ['Sociolinguistic appropriateness (B2)'],
    prerequisites: ['b1.sustain_topic_change'],
    semanticNeeds: ['register'],
    patterns: ['register_marker_pattern'],
    firstContext: 'reading_between_the_lines',
    reuseContexts: ['the_long_conversation'],
    transferContexts: ['a register shift not used during teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: true },
    graduationRelevance: 'required',
    evaluation: 'register_dimension_plus_semantic',
  },
  {
    id: 'soften_or_strengthen_a_statement', family: 'register', scope: 'required',
    cefrRefs: ['Sociolinguistic appropriateness (B2)'],
    prerequisites: ['adjust_register_to_context', 'develop_and_defend_opinion'],
    semanticNeeds: ['register'],
    patterns: ['hedging_pattern', 'intensifying_pattern'],
    firstContext: 'reading_between_the_lines',
    reuseContexts: ['the_long_conversation'],
    transferContexts: ['softening/strengthening a claim not used during teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: true },
    graduationRelevance: 'required',
    evaluation: 'register_dimension_plus_semantic',
  },
  {
    id: 'infer_implied_meaning', family: 'register', scope: 'should',
    cefrRefs: ['Sociolinguistic appropriateness (B2)'],
    prerequisites: ['adjust_register_to_context'],
    semanticNeeds: ['register'],
    patterns: [],
    firstContext: 'reading_between_the_lines',
    reuseContexts: ['the_long_conversation'],
    transferContexts: ['an implication not used during teaching'],
    evidence: { recognition: true, guided: true, assistedOpen: false, independent: 1, transfer: 0, delayedRetrieval: true },
    graduationRelevance: 'should',
    evaluation: 'comprehension_only',
  },
  {
    id: 'sustain_a_multi_topic_conversation', family: 'sustained_discourse', scope: 'required',
    cefrRefs: ['Conversation (B2)', 'Overall Spoken Interaction (B2)'],
    prerequisites: ['b1.sustain_topic_change', 'adjust_register_to_context'],
    semanticNeeds: [],
    patterns: ['topic_shift_marker_pattern'],
    firstContext: 'the_long_conversation',
    reuseContexts: [],
    transferContexts: ['the entire capstone conversation, by construction'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required',
    evaluation: 'discourse_coherence_plus_semantic',
  },
  {
    id: 'handle_a_topic_shift_gracefully', family: 'sustained_discourse', scope: 'required',
    cefrRefs: ['Conversation (B2)'],
    prerequisites: ['sustain_a_multi_topic_conversation'],
    semanticNeeds: [],
    patterns: ['topic_shift_marker_pattern'],
    firstContext: 'the_long_conversation',
    reuseContexts: [],
    transferContexts: ['the entire capstone conversation, by construction'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required',
    evaluation: 'discourse_coherence_plus_semantic',
  },
  {
    id: 'negotiate_an_agreement_under_pushback', family: 'sustained_discourse', scope: 'required',
    cefrRefs: ['Goal-oriented co-operation (B2)'],
    prerequisites: ['negotiate_a_resolution', 'soften_or_strengthen_a_statement', 'handle_a_topic_shift_gracefully'],
    semanticNeeds: ['stance', 'problem_type'],
    patterns: [],
    firstContext: 'the_long_conversation',
    reuseContexts: [],
    transferContexts: ['the entire capstone conversation, by construction'],
    evidence: { recognition: true, guided: true, assistedOpen: true, independent: 2, transfer: 1, delayedRetrieval: false },
    graduationRelevance: 'required',
    evaluation: 'discourse_coherence_plus_semantic',
    architecturalNote: 'pushback_response_pattern is deliberately not a new pattern group — it recombines concession_counter_pattern, negotiation_proposal_pattern and diplomatic_hedge_pattern.',
  },
  {
    id: 'use_idiomatic_expressions_naturally', family: 'sustained_discourse', scope: 'optional',
    cefrRefs: ['Overall Spoken Interaction (B2)'],
    prerequisites: ['sustain_a_multi_topic_conversation'],
    semanticNeeds: [],
    patterns: [],
    firstContext: 'the_long_conversation',
    reuseContexts: [],
    transferContexts: [],
    evidence: { recognition: true, guided: false, assistedOpen: false, independent: 0, transfer: 0, delayedRetrieval: false },
    graduationRelevance: 'optional',
    evaluation: 'comprehension_only',
  },
]

export const getB2CanDo = (id) => B2_CAN_DOS.find((c) => c.id === id) || null

export const B2_REQUIRED_CAN_DO_IDS = B2_CAN_DOS.filter((c) => c.scope === 'required').map((c) => c.id)
export const B2_SHOULD_CAN_DO_IDS = B2_CAN_DOS.filter((c) => c.scope === 'should').map((c) => c.id)
export const B2_OPTIONAL_CAN_DO_IDS = B2_CAN_DOS.filter((c) => c.scope === 'optional').map((c) => c.id)

/*
 * `<LEVEL>_CAN_DO_INTENT`, the exact shape `curriculum/levelMaps.js` asks a
 * new level's own map file to export (see that file's header comment).
 * Registered into `LEVEL_CAN_DO_INTENT_MAPS` by `curriculum/b2Map.js`
 * (`LC-INT-001`), which imports this export directly rather than copying it.
 *
 * One canDo -> one intent, per `b2.json#/intentStrategy`'s rule. The three
 * capstone-only capabilities reuse an existing intent under a subtype rather
 * than mint a new one (`b2Intents.js` documents the subtype); they are NOT
 * listed here as their own intent id, matching the blueprint's explicit
 * "arc 6 introduces zero new intents" design (`intentStrategy.newSubtypesOnExistingIntents`).
 *
 * REAL INTEGRATION DEFECT, FOUND AND FIXED AT WIRING TIME (LC-INT-001):
 * `develop_and_defend_opinion` was authored here (and throughout
 * `levels/b2/**`) as intent id `state_opinion_with_reason` — the EXACT same
 * bare intent id A2 already registers, for its own, much simpler
 * `state_opinion_with_reason` ("I like X because Y", `levels/a2/evaluators.js`).
 * B2 and A2 were authored in parallel lanes with no cross-reference to each
 * other, the same collision class B1's `report_problem` hit against A2's own
 * intent of that name (see `b1Map.js`'s own account). Both cannot share one
 * case in `engine/responseEvaluation.js`'s flat `evaluateFree` switch — the
 * loser would be silently graded by the other level's (much weaker)
 * evaluator. Fixed by renaming B2's runtime dispatch key to
 * `argue_opinion_with_reason` throughout `levels/b2/**` (this file,
 * `b2Intents.js`, `b2EvaluationContracts.js`, every arc's `evalKind` usage)
 * — B2's own `capabilityId`/canDo id (`develop_and_defend_opinion`) is
 * unaffected, only the runtime evaluator dispatch key changed.
 *
 * Every other B2 intent id was checked against every already-registered
 * level's own intent dispatch keys (Pre-A1/A1/A2/B1) and against B2's own
 * canDo ids — no further collision exists.
 */
export const B2_CAN_DO_INTENT = {
  develop_and_defend_opinion: 'argue_opinion_with_reason',
  weigh_advantages_and_disadvantages: 'weigh_options',
  concede_a_point_and_counter: 'concede_and_counter',
  justify_a_request_for_change: 'justify_a_request',
  negotiate_a_resolution: 'propose_a_resolution',
  express_frustration_diplomatically: 'express_diplomatic_frustration',
  hypothesize_about_unreal_situations: 'state_unreal_hypothesis',
  speculate_about_cause_and_effect: 'speculate_cause_or_effect',
  express_regret_about_a_past_decision: 'express_past_regret',
  summarize_for_someone_else: 'summarize_for_third_party',
  reformulate_to_clarify: 'reformulate_for_clarity',
  report_someone_elses_opinion: 'report_third_party_opinion',
  adjust_register_to_context: 'shift_register',
  soften_or_strengthen_a_statement: 'soften_or_intensify_claim',
  infer_implied_meaning: null, // comprehension-only, no production intent (b2.json evaluationStrategy.comprehension_only) — read via plain comprehension/choice steps, same convention as A1's receptive-only items
  /*
   * Capstone-only capabilities reuse an existing intent + subtype rather than
   * mint a new one, per b2.json intentStrategy.newSubtypesOnExistingIntents
   * ("arc 6 introduces zero new intents") — see b2Intents.js `B2_INTENT_SUBTYPES`.
   * The value shape below is `{ intent, subtype }` rather than a bare string
   * specifically for these three entries: `curriculum/levelMaps.js`'s
   * `canDoForIntent()` used to assume one intent maps to exactly one canDo
   * (first-match-wins), which silently resolved every `shift_register` or
   * `propose_a_resolution` lookup to whichever canDo happened to be listed
   * first (always `adjust_register_to_context` / `negotiate_a_resolution`,
   * never the capstone reuse). Fixed at `LC-INT-001` integration time by
   * generalizing `canDoForIntent(intent, subtype)` to accept an optional
   * subtype qualifier, matched against this structured shape — see that
   * file's own comment for the resolution order.
   *
   * NOTE ON THE shift_register REUSE (RESOLVED, not a copy-paste artifact):
   * `b2.json#/evaluationStrategy` literally writes "shift_register (capstone
   * topic-shift subtype)" — a deliberate, self-documenting reuse of the
   * register-formality intent for topic-shift judgment, confirmed by reading
   * the blueprint directly at `LC-INT-001` integration time (not merely
   * transcribed from a comment). The id is genuinely a different
   * communicative function under one name; `levels/b2/evaluators.js`'s
   * `evaluateShiftRegister` branches on `subtype` (`formal_shift` /
   * `informal_shift` vs. `topic_shift`) with entirely different judging logic
   * per branch, exactly the way every other subtype-carrying intent in this
   * codebase already works (B1's `narrativeForm`/`tone`, A1's `abilityForm`).
   * Left as-is; `docs/curriculum/implementation/b2/README.md` section 4 is
   * updated to record this confirmation.
   */
  sustain_a_multi_topic_conversation: { intent: 'shift_register', subtype: 'topic_shift' },
  handle_a_topic_shift_gracefully: { intent: 'shift_register', subtype: 'topic_shift' },
  negotiate_an_agreement_under_pushback: { intent: 'propose_a_resolution', subtype: 'pushback' },
  use_idiomatic_expressions_naturally: null, // comprehension-only, no production intent (b2.json evaluationStrategy.comprehension_only)
}
