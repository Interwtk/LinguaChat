/*
 * Machine copy of `c1.json#/reuseMatrix`, for
 * `scripts/foundry/c1/check-c1-reuse-matrix.mjs` to cross-check against
 * actual arc content (which canDo each arc's episodes reuse/reinforce).
 * Legend matches the blueprint and the master contract section 8: I
 * introduce, G guided_reuse, R open_retrieval, T transfer, F fluency, D
 * delayed_retrieval, null not present. Uses `null` (not a `'-'` string) to
 * match c1.json's own JSON literal exactly — the fidelity check does a
 * `deepEqual` against the parsed blueprint.
 */

export const C1_REUSE_MATRIX_ARCS = [
  'abstract_argument',
  'register_and_diplomacy',
  'synthesis_and_mediation',
  'nuance_and_implication',
  'extended_structured_discourse',
  'negotiation_and_complexity',
  'sustained_interaction',
]

export const C1_REUSE_MATRIX_ROWS = {
  develop_a_structured_argument: ['I', null, null, null, 'R', 'R', 'R'],
  qualify_a_claim_precisely: ['I', 'R', null, 'R', null, 'D', 'R'],
  concede_a_counterpoint_gracefully: ['I', 'R', 'R', 'R', null, null, 'R'],
  weigh_implications_of_a_position: ['I', null, null, null, null, 'R', null],
  adapt_register_to_audience: [null, 'I', 'R', null, 'R', null, 'R'],
  hedge_and_mitigate_a_statement: [null, 'I', null, null, null, 'R', 'R'],
  disagree_diplomatically: [null, 'I', null, null, null, 'R', null],
  repair_a_register_slip: [null, 'I', null, null, null, null, 'R'],
  summarize_a_complex_message_for_a_new_audience: [null, null, 'I', null, null, null, 'D'],
  synthesize_two_conflicting_viewpoints: [null, null, 'I', null, null, null, 'R'],
  reformulate_for_a_different_audience: [null, null, 'I', null, null, null, 'R'],
  paraphrase_to_avoid_repetition: [null, null, 'I', null, null, null, 'R'],
  infer_implied_meaning_in_unfamiliar_context: [null, null, null, 'I', null, 'R', 'R'],
  express_degrees_of_certainty: [null, null, null, 'I', null, 'R', 'R'],
  hold_a_nuanced_stance: [null, null, null, 'I', null, null, 'R'],
  recognize_understatement_or_irony: [null, null, null, 'I', null, null, 'T'],
  produce_an_extended_structured_explanation: [null, null, null, null, 'I', null, 'R'],
  use_cohesive_devices_across_a_turn: [null, null, null, null, 'I', null, 'R'],
  self_correct_without_losing_the_thread: [null, null, null, null, 'I', null, 'R'],
  open_and_close_an_extended_turn: [null, null, null, null, 'I', null, 'R'],
  negotiate_a_mutually_acceptable_outcome: [null, null, null, null, null, 'I', 'T'],
  clarify_an_ambiguous_instruction_precisely: [null, null, null, null, null, 'I', 'D'],
  propose_and_defend_an_alternative: [null, null, null, null, null, 'I', 'R'],
  handle_an_unexpected_complication: [null, null, null, null, null, 'I', null],
  sustain_a_conversation_across_topic_shifts: [null, null, null, null, null, null, 'I'],
  refer_back_to_earlier_discourse: [null, null, null, null, null, null, 'I'],
  shift_register_within_one_conversation: [null, null, null, null, null, null, 'I'],
  close_a_complex_interaction_with_a_summary: [null, null, null, null, null, null, 'I'],
}

export const getC1ReuseRow = (canDoId) => {
  const row = C1_REUSE_MATRIX_ROWS[canDoId]
  if (!row) return null
  return C1_REUSE_MATRIX_ARCS.reduce((acc, arcId, i) => ({ ...acc, [arcId]: row[i] }), {})
}
