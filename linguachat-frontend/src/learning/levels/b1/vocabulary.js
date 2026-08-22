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

export const B1_VOCAB_BY_ID = {
  ...B1_ARC1_VOCAB,
  ...B1_ARC2_VOCAB,
}

export const b1ProductiveIds = (ids) => ids.filter(id => B1_VOCAB_BY_ID[id])
