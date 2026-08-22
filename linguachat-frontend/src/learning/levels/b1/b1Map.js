/*
 * b1Map — what B1's implemented capabilities are, mirroring `a1Map.js`'s shape
 * exactly (same export names' `B1_` prefix, same derivation functions) so a
 * future merge/registration is mechanical, not a redesign.
 *
 * SELF-CONTAINED DIFFERENCE FROM `a1Map.js`: that file reads episodes via
 * `episodesOfLevel(A1)` (`curriculum/levels.js`, generated skeleton) because
 * A1 is registered there. B1 is not — `curriculum/**` is out of this task's
 * write scope — so `b1Episodes()` reads this level's own arc modules
 * directly. `LC-INT-001` is expected to replace this with the real
 * `episodesOfLevel(B1)` once B1 is registered, at which point this file's
 * derivation functions should need no change, only their episode source.
 */
import { B1_ARC1 } from './episodes/b1Arc1.js'
import { B1_ARC2 } from './episodes/b1Arc2.js'
import { B1_ARC3 } from './episodes/b1Arc3.js'
import { B1_ARC4 } from './episodes/b1Arc4.js'

/* A level-local id. NOT `curriculum/levels.js`'s `B1` (that constant does not
 * exist yet) — do not import this into anything that expects the real one. */
export const B1_LEVEL_ID = 'b1'

/* The arcs of B1 with runtime content today, in the blueprint's order. */
export const B1_RUNTIME_ARCS = ['what_happened', 'i_think_that', 'which_one', 'somethings_wrong']

/* One intent per can-do, same convention as `A1_CAN_DO_INTENT`/`CAN_DO_INTENT`. */
export const B1_CAN_DO_INTENT = {
  // arc 1 — one intent, two forms carried by the `narrativeForm` subtype
  // (b1.json intentStrategy.newSubtypesOnExistingIntents), matching the
  // "one intent per communicative function" rule A1 already follows.
  narrate_connected_event: 'narrate_past_event',
  narrate_interrupted_action: 'narrate_past_event',
  // arc 2 — two distinct intents, per b1.json intentStrategy.newIntents
  give_an_opinion: 'state_opinion',
  agree_or_disagree: 'agree_or_disagree',
  // arc 3 — three distinct intents
  compare_options_with_reasons: 'compare_and_choose',
  describe_an_experience: 'describe_experience',
  recommend_or_warn: 'recommend_or_warn',
  // arc 4 — report_problem carries both escalate_and_resolve_a_problem
  // (tone: neutral) and express_frustration_politely (tone: frustrated);
  // negotiate_a_solution is its own distinct intent.
  escalate_and_resolve_a_problem: 'report_problem',
  express_frustration_politely: 'report_problem',
  negotiate_a_solution: 'negotiate_solution',
}

export const B1_CAN_DO_EXTRA_INTENTS = {}

export const b1IntentsOf = (canDoId) => [
  B1_CAN_DO_INTENT[canDoId],
  ...(B1_CAN_DO_EXTRA_INTENTS[canDoId] || []),
].filter(Boolean)

/* Required can-dos, `scope: required` in b1.json, arcs 1-4.
 * `recommend_or_warn`/`express_frustration_politely` are `scope: should`
 * (b1.json arcs 3-4) and deliberately excluded — each arc's required
 * independence is already evidenced by its other can-dos. */
export const B1_REQUIRED_CAN_DOS = [
  'narrate_connected_event', 'narrate_interrupted_action',
  'give_an_opinion', 'agree_or_disagree',
  'compare_options_with_reasons', 'describe_an_experience',
  'escalate_and_resolve_a_problem', 'negotiate_a_solution',
]

/* should-have can-dos: implemented, taught and evaluated, but not required
 * for level graduation (b1.json `graduationRelevance: should`). */
export const B1_SHOULD_CAN_DOS = ['recommend_or_warn', 'express_frustration_politely']

export const B1_RECEPTIVE_ITEMS = [
  'b1_that_morning', 'b1_later_that_day', 'b1_eventually', 'b1_in_the_end',
  'b1_at_that_moment', 'b1_right_then', 'b1_meanwhile',
  'b1_as_for_me', 'b1_from_my_point_of_view', 'b1_if_you_ask_me',
  'b1_thats_true', 'b1_i_guess_so', 'b1_not_really',
  'b1_by_far', 'b1_on_the_other_hand', 'b1_compared_to', 'b1_overall',
  'b1_breathtaking', 'b1_overwhelming', 'b1_underwhelming', 'b1_worth_it', 'b1_a_bit_disappointing',
  'b1_highly_recommend', 'b1_give_it_a_miss', 'b1_not_worth_it',
  'b1_faulty', 'b1_damaged', 'b1_missing', 'b1_delayed',
  'b1_a_partial_refund', 'b1_store_credit', 'b1_an_exchange', 'b1_a_different_one',
  'b1_thats_a_shame', 'b1_i_see_the_issue', 'b1_lets_sort_it_out',
]

export const B1_INCIDENTAL_ITEMS = []

export function b1Episodes() {
  return [...B1_ARC1, ...B1_ARC2, ...B1_ARC3, ...B1_ARC4]
}

export const B1_ARC_CAN_DOS = [...new Set(b1Episodes().map(ep => ep.canDoId).filter(Boolean))]

export function b1EpisodesForCanDo(canDoId) {
  return b1Episodes().filter(ep => ep.canDoId === canDoId).map(ep => ep.id)
}

/* Same structural derivation as `a1ProductiveItemsOf` — items produced by a
 * step whose (or whose turn's) `evalKind` matches one of the capability's
 * intents. `narrativeForm`-only steps still key on `evalKind`, so no change
 * to the matching rule was needed for the new subtype. */
export function b1ProductiveItemsOf(canDoId) {
  const intents = b1IntentsOf(canDoId)
  if (!intents.length) return []
  const out = new Set()
  for (const ep of b1Episodes()) {
    for (const step of ep.steps || []) {
      const producedHere = intents.includes(step.evalKind)
        || (step.turns || []).some(turn => intents.includes(turn.evalKind))
      if (!producedHere) continue
      ;(step.itemIds || []).forEach(id => out.add(id))
      for (const turn of step.turns || []) (turn.itemIds || []).forEach(id => out.add(id))
    }
  }
  return [...out]
}

export function b1RequiredLevelItems() {
  return [...new Set(B1_REQUIRED_CAN_DOS.flatMap(id => b1ProductiveItemsOf(id)))]
}

export function b1ImplementationStatus() {
  const episodes = b1Episodes()
  return {
    runtimeArcs: [...new Set(episodes.map(ep => ep.arc))],
    runtimeEpisodes: episodes.map(ep => ep.id),
    canDos: B1_ARC_CAN_DOS,
    complete: false,
  }
}

export const B1_INTRODUCED_ITEMS = [
  // arc 1 — what_happened: connectors, past continuous, when/while, plus receptive time phrases
  'b1_first', 'b1_then', 'b1_after_that', 'b1_before_that', 'b1_finally',
  'b1_sequence_connectors_pattern', 'b1_past_continuous_pattern', 'b1_when_while_pattern',
  'b1_suddenly', 'b1_just_then',
  // arc 2 — i_think_that: opinion frame, reason connector, agree/disagree
  'b1_i_think_that', 'b1_in_my_opinion', 'b1_personally',
  'b1_opinion_frame_pattern', 'b1_because_reason_pattern',
  'b1_i_agree', 'b1_i_dont_think_so', 'b1_youre_right',
  'b1_agree_disagree_pattern', 'b1_i_see_what_you_mean',
  // arc 3 — which_one: comparison, description and recommend/warn language
  'b1_more_than', 'b1_less_than', 'b1_the_most', 'b1_of_the_three',
  'b1_comparative_superlative_pattern', 'b1_multi_attribute_compare_pattern',
  'b1_multi_attribute_description_pattern', 'b1_feeling_reaction_pattern',
  'b1_it_made_me_feel', 'b1_i_felt', 'b1_peaceful', 'b1_exhausting', 'b1_unforgettable',
  'b1_id_recommend', 'b1_i_wouldnt_recommend', 'b1_recommend_warn_pattern', 'b1_id_avoid',
  // arc 4 — somethings_wrong: problem, negotiation and polite-frustration language
  'b1_theres_a_problem_with', 'b1_i_ordered_but_i_got', 'b1_problem_statement_pattern',
  'b1_its_supposed_to', 'b1_instead_of', 'b1_broken',
  'b1_would_it_be_possible', 'b1_could_i_possibly', 'b1_negotiate_pattern',
  'b1_instead', 'b1_a_replacement', 'b1_a_refund',
  'b1_this_isnt_ideal', 'b1_i_understand_but', 'b1_polite_frustration_pattern',
  ...B1_RECEPTIVE_ITEMS,
]

export function b1ItemIds() {
  return new Set(B1_INTRODUCED_ITEMS)
}

export const b1EpisodeById = (id) => b1Episodes().find(ep => ep.id === id) || null
