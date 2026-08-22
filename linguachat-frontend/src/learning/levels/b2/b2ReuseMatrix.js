/*
 * Machine copy of `b2.json#/reuseMatrix`, for `scripts/foundry/b2/check-b2-reuse-matrix.mjs`
 * to cross-check against actual arc content (which canDo each arc's episodes
 * reuse/reinforce). Legend matches the blueprint and the master contract
 * section 8: I introduce, G guided reuse, R open retrieval, T transfer,
 * F fluency, D delayed retrieval, C consolidated in an integrated/capstone
 * conversation, - not present.
 */

export const B2_REUSE_MATRIX_ARC_ORDER = [
  'making_the_case',
  'when_plans_go_wrong',
  'what_if',
  'talking_around_a_subject',
  'reading_between_the_lines',
  'the_long_conversation',
]

export const B2_REUSE_MATRIX_ROWS = {
  develop_and_defend_opinion: ['I', 'R', '-', 'R', 'R', 'D'],
  weigh_advantages_and_disadvantages: ['I', 'R', '-', '-', '-', 'D'],
  concede_a_point_and_counter: ['I', 'R', '-', '-', '-', 'R'],
  justify_a_request_for_change: ['-', 'I', '-', '-', '-', 'R'],
  negotiate_a_resolution: ['-', 'I', '-', '-', '-', 'D'],
  express_frustration_diplomatically: ['-', 'I', '-', '-', '-', 'R'],
  hypothesize_about_unreal_situations: ['-', '-', 'I', '-', '-', 'D'],
  speculate_about_cause_and_effect: ['-', '-', 'I', '-', '-', 'R'],
  express_regret_about_a_past_decision: ['-', '-', 'I', '-', '-', 'R'],
  summarize_for_someone_else: ['-', '-', '-', 'I', '-', 'D'],
  reformulate_to_clarify: ['-', '-', '-', 'I', '-', 'R'],
  report_someone_elses_opinion: ['-', '-', '-', 'I', '-', 'R'],
  adjust_register_to_context: ['-', '-', '-', '-', 'I', 'D'],
  soften_or_strengthen_a_statement: ['-', '-', '-', '-', 'I', 'D'],
  infer_implied_meaning: ['-', '-', '-', '-', 'I', 'R'],
  sustain_a_multi_topic_conversation: ['-', '-', '-', '-', '-', 'C'],
  handle_a_topic_shift_gracefully: ['-', '-', '-', '-', '-', 'C'],
  negotiate_an_agreement_under_pushback: ['-', '-', '-', '-', '-', 'C'],
  use_idiomatic_expressions_naturally: ['-', '-', '-', '-', '-', 'I'],
}

export const getB2ReuseRow = (canDoId) => {
  const row = B2_REUSE_MATRIX_ROWS[canDoId]
  if (!row) return null
  return B2_REUSE_MATRIX_ARC_ORDER.reduce((acc, arcId, i) => ({ ...acc, [arcId]: row[i] }), {})
}
