/*
 * a2Map — what A2's implemented capabilities are, and nothing about Pre-A1 or A1.
 *
 * Same idea as `a1Map.js`, one level up: a SEPARATE file rather than a section
 * of `a1Map.js` or `preA1Map.js`, for the identical reason those two stay
 * apart — a registry named after one level must never quietly answer for
 * another, or a freeze/audit for the level below silently starts counting the
 * level above's language and capabilities as its own.
 *
 * A2 is designed and implemented in full — seven arcs, twenty-three episodes,
 * authored under `src/learning/levels/a2/**` by `LC-CONT-A2` — but stays
 * `contentStatus: 'partial'`, `available: false` (`levels.js`) until a later,
 * deliberate A1+A2 completion gate, exactly the distinction `levels.js`'s own
 * comment draws between content existing and a level being open.
 *
 * `A2_CAN_DO_INTENT` is registered in `levelMaps.js` per that file's own
 * "A NEW LEVEL'S OWN MAP FILE SHOULD" instructions, so
 * `check-cross-level-ids.mjs`'s collision detector actually covers A2 rather
 * than silently skipping it. `A2_INTRODUCED_ITEMS` is what lets
 * `check-pre-a1-freeze.mjs`'s vocabulary count stay exact as the shared
 * catalogue grows a second level's worth of language above A1's.
 */
import { A2, episodesOfLevel } from './levels.js'

/* The arcs of A2, in the blueprint's order. */
export const A2_RUNTIME_ARCS = [
  'what_happened', 'making_plans', 'people_and_places', 'getting_around',
  'booking_a_stay', 'everyday_problems', 'lets_do_something',
]

/*
 * The capability each A2 can-do is evidenced by, in the same shape Pre-A1/A1
 * use: one intent per can-do. Derived from how `levels/a2/episodes/**`'s
 * steps actually use `evalKind` (not guessed), including the two capabilities
 * that share one intent (arc 4's two direction can-dos both produce
 * `give_multi_step_directions`, the same "one intent, more than one can-do"
 * shape `a1Map.js` already uses for `talk_about_daily_routine`/
 * `say_when_something_happens`) and the two that reuse an EXISTING A1/A2
 * intent rather than inventing a new one (`use_dates_and_months` reuses A1's
 * `use_quantity`, per that arc's own header comment; `keep_a_longer_
 * conversation_going` reuses `respond_to_invitation`, per
 * `levels/a2/evaluators.js`'s own comment that a2.json does not list it as an
 * 18th distinct intent).
 */
export const A2_CAN_DO_INTENT = {
  /* Arc 1 — what_happened */
  talk_about_what_you_did: 'state_past_event',
  ask_about_what_someone_did: 'ask_past_event',
  narrate_a_sequence_of_past_events: 'narrate_past_sequence',
  /* Arc 2 — making_plans */
  talk_about_future_plans: 'state_future_plan',
  ask_about_future_plans: 'ask_future_plan',
  /* Arc 3 — people_and_places */
  describe_a_person_or_place: 'describe_person_or_place',
  compare_two_things: 'compare_things',
  express_an_opinion_with_a_reason: 'state_opinion_with_reason',
  /* Arc 4 — getting_around */
  follow_directions_with_more_than_one_step: 'give_multi_step_directions',
  give_simple_directions: 'give_multi_step_directions',
  /* Arc 5 — booking_a_stay */
  use_dates_and_months: 'use_quantity',
  ask_about_availability: 'ask_availability',
  book_a_room_or_table: 'make_booking',
  spell_a_name_for_a_booking: 'spell_word',
  /* Arc 6 — everyday_problems */
  report_a_problem: 'report_problem',
  ask_for_help_solving_a_problem: 'ask_for_help',
  /* Arc 7 — lets_do_something */
  invite_someone_to_do_something: 'invite_someone',
  accept_or_decline_with_a_reason: 'respond_to_invitation',
  keep_a_longer_conversation_going: 'respond_to_invitation',
}

export const a2Episodes = () => episodesOfLevel(A2)

/* Which of A2's own episodes teach a capability — derived, never declared twice. */
export function a2EpisodesForCanDo(canDoId) {
  return a2Episodes().filter(ep => ep.canDoId === canDoId).map(ep => ep.id)
}

/*
 * Which catalogue entries THIS LEVEL ADDED. Declared rather than derived —
 * the same reasoning `a1Map.js`'s `A1_INTRODUCED_ITEMS` states: reuse must
 * never move an item from one level's budget to another, so what A2 actually
 * introduces is recorded here once rather than inferred from what its
 * episodes happen to reference (which would also include language they reuse
 * from Pre-A1/A1).
 */
export const A2_INTRODUCED_ITEMS = [
  /* arc 1 — what you did */
  'simple_past_regular_pattern', 'past_time_expression_pattern', 'watch_tv', 'cook_dinner',
  'clean_the_house', 'simple_past_irregular_pattern', 'bought', 'did_you_question_pattern',
  'sequencing_connector_pattern',
  /* arc 2 — what's next */
  'going_to_future_pattern', 'future_time_expression_pattern', 'relax', 'go_shopping', 'visit',
  'going_to_question_pattern',
  /* arc 3 — people and places */
  'always', 'because_reason_pattern', 'big', 'comparative_pattern', 'convenient', 'expensive',
  'cheap', 'friendly', 'frequency_full_set_pattern', 'multi_attribute_pattern', 'never', 'quiet',
  'small', 'there_is_are_pattern', 'third_person_s_pattern',
  /* arc 4 — how to get there */
  'multi_step_direction_pattern', 'straight', 'turn', 'left', 'right', 'corner', 'crossing',
  /* arc 5 — booking it */
  'month_pattern', 'ordinal_date_pattern', 'availability_question_pattern', 'table',
  'booking_pattern', 'deposit', 'spelling_pattern', 'can_you_spell_that',
  /* arc 6 — when something's wrong */
  'problem_with', 'doesnt_work', 'lost', 'cold', 'problem_report_pattern', 'help_with',
  'what_should_i_do', 'fix', 'help_request_pattern', 'instead',
  /* arc 7 — do you want to...? */
  'invitation_pattern', 'go_to_the_cinema', 'have_dinner', 'accept_decline_reason_pattern',
  'id_love_to', 'im_busy', 'clause_connector_pattern', 'last_time', 'really_good', 'go_for_a_walk',
  /*
   * Receptive: what the other speaker's line carries in arcs 3, 4 and 6 —
   * comprehension/choice steps, never asked for.
   */
  'modern', 'better', 'comfortable', 'bank', 'which_way', 'church',
  'sorry_about_that', 'of_course', 'extra_blankets',
]

export function a2ItemIds() {
  return new Set(A2_INTRODUCED_ITEMS)
}
