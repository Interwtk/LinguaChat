/*
 * b1/vocabulary — B1's own catalogue entries, self-contained.
 *
 * `src/data/vocabulary.js`'s `SEED_VOCAB_BY_ID` is the shared catalogue every level
 * grants items into (A1's `A1_INTRODUCED_ITEMS` reads/writes against it), but
 * `src/data/**` is outside this task's write scope. Rather than leaving B1's
 * garden items unresolvable, this file is B1's own local catalogue with the same
 * per-entry shape the shared one uses (`{ en, type }` at minimum). LC-INT-001
 * merges these into `SEED_VOCAB_BY_ID` under the same ids — ids are namespaced
 * `b1_*` specifically so a merge can never collide with an existing Pre-A1/A1/A2
 * entry.
 *
 * Grows one arc at a time, exactly like `A1_INTRODUCED_ITEMS` did.
 */

/* ---- Arc 1 — what_happened (10 productive / 7 receptive, per b1.json) ---- */
export const B1_ARC1_VOCAB = {
  // narrate_connected_event — 6 productive
  b1_first: { en: 'first', type: 'connector' },
  b1_then: { en: 'then', type: 'connector' },
  b1_after_that: { en: 'after that', type: 'connector' },
  b1_before_that: { en: 'before that', type: 'connector' },
  b1_finally: { en: 'finally', type: 'connector' },
  b1_sequence_connectors_pattern: { en: 'first / then / after that / before that / finally', type: 'pattern' },
  // narrate_connected_event — 4 receptive
  b1_that_morning: { en: 'that morning', type: 'time_point' },
  b1_later_that_day: { en: 'later that day', type: 'time_point' },
  b1_eventually: { en: 'eventually', type: 'connector' },
  b1_in_the_end: { en: 'in the end', type: 'connector' },
  // narrate_interrupted_action — 4 productive
  b1_past_continuous_pattern: { en: 'was/were + verb-ing', type: 'pattern' },
  b1_when_while_pattern: { en: 'when / while + clause', type: 'pattern' },
  b1_suddenly: { en: 'suddenly', type: 'connector' },
  b1_just_then: { en: 'just then', type: 'connector' },
  // narrate_interrupted_action — 3 receptive
  b1_at_that_moment: { en: 'at that moment', type: 'time_point' },
  b1_right_then: { en: 'right then', type: 'time_point' },
  b1_meanwhile: { en: 'meanwhile', type: 'connector' },
}

/* ---- Arc 2 — i_think_that (10 productive / 6 receptive, per b1.json) ---- */
export const B1_ARC2_VOCAB = {
  // give_an_opinion — 5 productive
  b1_i_think_that: { en: 'I think (that)', type: 'connector' },
  b1_in_my_opinion: { en: 'in my opinion', type: 'connector' },
  b1_personally: { en: 'personally', type: 'connector' },
  b1_opinion_frame_pattern: { en: 'I think (that) / in my opinion', type: 'pattern' },
  b1_because_reason_pattern: { en: '..., because ...', type: 'pattern' },
  // give_an_opinion — 3 receptive
  b1_as_for_me: { en: 'as for me', type: 'connector' },
  b1_from_my_point_of_view: { en: 'from my point of view', type: 'connector' },
  b1_if_you_ask_me: { en: 'if you ask me', type: 'connector' },
  // agree_or_disagree — 5 productive
  b1_i_agree: { en: 'I agree', type: 'connector' },
  b1_i_dont_think_so: { en: "I don't think so", type: 'connector' },
  b1_youre_right: { en: "you're right", type: 'connector' },
  b1_agree_disagree_pattern: { en: "I agree / I don't think so, because ...", type: 'pattern' },
  b1_i_see_what_you_mean: { en: 'I see what you mean', type: 'connector' },
  // agree_or_disagree — 3 receptive
  b1_thats_true: { en: "that's true", type: 'connector' },
  b1_i_guess_so: { en: 'I guess so', type: 'connector' },
  b1_not_really: { en: 'not really', type: 'connector' },
}

/* ---- Arc 3 — which_one (17 productive / 12 receptive, per b1.json) ---- */
export const B1_ARC3_VOCAB = {
  // compare_options_with_reasons — 6 productive
  b1_more_than: { en: 'more ... than', type: 'pattern' },
  b1_less_than: { en: 'less ... than', type: 'pattern' },
  b1_the_most: { en: 'the most', type: 'connector' },
  b1_of_the_three: { en: 'of the three / of all', type: 'connector' },
  b1_comparative_superlative_pattern: { en: 'more/less + adj + than / the most + adj', type: 'pattern' },
  b1_multi_attribute_compare_pattern: { en: 'X is + adj, and + adj, but Y is + adj', type: 'pattern' },
  // compare_options_with_reasons — 4 receptive
  b1_by_far: { en: 'by far', type: 'connector' },
  b1_on_the_other_hand: { en: 'on the other hand', type: 'connector' },
  b1_compared_to: { en: 'compared to', type: 'connector' },
  b1_overall: { en: 'overall', type: 'connector' },
  // describe_an_experience — 7 productive
  b1_multi_attribute_description_pattern: { en: 'it was + adj, adj, and adj', type: 'pattern' },
  b1_feeling_reaction_pattern: { en: 'it made me feel / I felt + adj', type: 'pattern' },
  b1_it_made_me_feel: { en: 'it made me feel', type: 'connector' },
  b1_i_felt: { en: 'I felt', type: 'connector' },
  b1_peaceful: { en: 'peaceful', type: 'feeling' },
  b1_exhausting: { en: 'exhausting', type: 'feeling' },
  b1_unforgettable: { en: 'unforgettable', type: 'feeling' },
  // describe_an_experience — 5 receptive
  b1_breathtaking: { en: 'breathtaking', type: 'feeling' },
  b1_overwhelming: { en: 'overwhelming', type: 'feeling' },
  b1_underwhelming: { en: 'underwhelming', type: 'feeling' },
  b1_worth_it: { en: 'worth it', type: 'connector' },
  b1_a_bit_disappointing: { en: 'a bit disappointing', type: 'feeling' },
  // recommend_or_warn — 4 productive
  b1_id_recommend: { en: "I'd recommend", type: 'connector' },
  b1_i_wouldnt_recommend: { en: "I wouldn't recommend", type: 'connector' },
  b1_recommend_warn_pattern: { en: "I'd recommend / I wouldn't ..., because ...", type: 'pattern' },
  b1_id_avoid: { en: "I'd avoid", type: 'connector' },
  // recommend_or_warn — 3 receptive
  b1_highly_recommend: { en: 'highly recommend', type: 'connector' },
  b1_give_it_a_miss: { en: 'give it a miss', type: 'connector' },
  b1_not_worth_it: { en: "not worth it", type: 'connector' },
}

/* ---- Arc 4 — somethings_wrong (15 productive / 11 receptive, per b1.json) ---- */
export const B1_ARC4_VOCAB = {
  // escalate_and_resolve_a_problem — 6 productive
  b1_theres_a_problem_with: { en: "there's a problem with", type: 'connector' },
  b1_i_ordered_but_i_got: { en: 'I ordered ... but I got ...', type: 'connector' },
  b1_problem_statement_pattern: { en: "there's a problem with ... / I ordered X but got Y", type: 'pattern' },
  b1_its_supposed_to: { en: "it's supposed to", type: 'connector' },
  b1_instead_of: { en: 'instead of', type: 'connector' },
  b1_broken: { en: 'broken', type: 'problem' },
  // escalate_and_resolve_a_problem — 4 receptive
  b1_faulty: { en: 'faulty', type: 'problem' },
  b1_damaged: { en: 'damaged', type: 'problem' },
  b1_missing: { en: 'missing', type: 'problem' },
  b1_delayed: { en: 'delayed', type: 'problem' },
  // negotiate_a_solution — 6 productive
  b1_would_it_be_possible: { en: 'would it be possible', type: 'connector' },
  b1_could_i_possibly: { en: 'could I possibly', type: 'connector' },
  b1_negotiate_pattern: { en: 'would it be possible to ... / could I get ... instead', type: 'pattern' },
  b1_instead: { en: 'instead', type: 'connector' },
  b1_a_replacement: { en: 'a replacement', type: 'generic_object' },
  b1_a_refund: { en: 'a refund', type: 'generic_object' },
  // negotiate_a_solution — 4 receptive
  b1_a_partial_refund: { en: 'a partial refund', type: 'generic_object' },
  b1_store_credit: { en: 'store credit', type: 'generic_object' },
  b1_an_exchange: { en: 'an exchange', type: 'generic_object' },
  b1_a_different_one: { en: 'a different one', type: 'generic_object' },
  // express_frustration_politely — 3 productive
  b1_this_isnt_ideal: { en: "this isn't ideal", type: 'connector' },
  b1_i_understand_but: { en: 'I understand, but', type: 'connector' },
  b1_polite_frustration_pattern: { en: "this isn't ideal, but ... / I understand, but ...", type: 'pattern' },
  // express_frustration_politely — 3 receptive
  b1_thats_a_shame: { en: "that's a shame", type: 'connector' },
  b1_i_see_the_issue: { en: 'I see the issue', type: 'connector' },
  b1_lets_sort_it_out: { en: "let's sort it out", type: 'connector' },
}

/* ---- Arc 5 — looking_ahead (18 productive / 10 receptive, per b1.json) ---- */
export const B1_ARC5_VOCAB = {
  // talk_about_plans_and_intentions — 5 productive
  b1_ill: { en: "I'll", type: 'connector' },
  b1_im_going_to: { en: "I'm going to", type: 'connector' },
  b1_will_vs_going_to_pattern: { en: "I'll (decision/prediction) vs I'm going to (plan)", type: 'pattern' },
  b1_probably: { en: 'probably', type: 'connector' },
  b1_definitely: { en: 'definitely', type: 'connector' },
  // talk_about_plans_and_intentions — 3 receptive
  b1_im_thinking_of: { en: "I'm thinking of", type: 'connector' },
  b1_i_might: { en: 'I might', type: 'connector' },
  b1_at_some_point: { en: 'at some point', type: 'time_point' },
  // talk_about_hopes_and_ambitions — 5 productive
  b1_i_hope_to: { en: 'I hope to', type: 'connector' },
  b1_id_like_to: { en: "I'd like to", type: 'connector' },
  b1_one_day_ill: { en: "one day I'll", type: 'connector' },
  b1_hope_would_like_pattern: { en: "I hope to / I'd like to / one day I'll", type: 'pattern' },
  b1_my_dream_is_to: { en: 'my dream is to', type: 'connector' },
  // talk_about_hopes_and_ambitions — 3 receptive
  b1_im_hoping_to: { en: "I'm hoping to", type: 'connector' },
  b1_someday: { en: 'someday', type: 'time_point' },
  b1_my_ambition_is: { en: 'my ambition is', type: 'connector' },
  // talk_about_real_conditions — 4 productive
  b1_if_present_will: { en: 'if + present, ... will + verb', type: 'connector' },
  b1_first_conditional_pattern: { en: 'if + present, ... will + verb', type: 'pattern' },
  b1_unless: { en: 'unless', type: 'connector' },
  b1_as_soon_as: { en: 'as soon as', type: 'connector' },
  // talk_about_real_conditions — 2 receptive
  b1_provided_that: { en: 'provided that', type: 'connector' },
  b1_in_that_case: { en: 'in that case', type: 'connector' },
  // imagine_a_hypothetical — 4 productive
  b1_if_i_were_you: { en: 'if I were you', type: 'connector' },
  b1_if_i_were_pattern: { en: "if I were you, I'd ...", type: 'pattern' },
  b1_id_verb: { en: "I'd + verb", type: 'connector' },
  b1_in_your_position: { en: 'in your position', type: 'connector' },
  // imagine_a_hypothetical — 2 receptive
  b1_if_i_were_in_your_shoes: { en: 'if I were in your shoes', type: 'connector' },
  b1_my_advice_would_be: { en: 'my advice would be', type: 'connector' },
}

export const B1_VOCAB_BY_ID = {
  ...B1_ARC1_VOCAB,
  ...B1_ARC2_VOCAB,
  ...B1_ARC3_VOCAB,
  ...B1_ARC4_VOCAB,
  ...B1_ARC5_VOCAB,
}

export const b1ProductiveIds = (ids) => ids.filter(id => B1_VOCAB_BY_ID[id])
