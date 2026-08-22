/*
 * B2 vocabulary — new lexical items beyond the 20 pattern groups themselves.
 * `b2.md` section 6 tracks every pattern in `b2Patterns.js` as its own
 * Garden-trackable unit ("a functional phrase is one item, not one per
 * word", inherited from A1). This file is the REMAINING budget: per-arc
 * `newProductive`/`newReceptive` counts from `b2.json#/arcs[].vocabularyBudget`
 * minus that arc's own pattern count, both accounted for exactly so
 * `scripts/foundry/b2/check-b2-vocabulary-budget.mjs` can prove the level's
 * `counts.newProductiveVocabularyBudget` (88) / `newReceptiveVocabularyBudget`
 * (67) are real, not aspirational.
 *
 * Every item is a functional multiword unit or a genuinely B2-level single
 * word (a reporting verb, a discourse marker) — never a topic noun, per the
 * master contract section 6 ("topics are contexts, not curriculum") and
 * b2.md's own budget rule (section 6: "does not grow because 'B2 textbooks
 * cover more grammar' — every item traces to a capability").
 *
 * `glossKey` is a placeholder i18n key, not a translation: this task's write
 * scope does not include `i18n/**`, so no locale file carries these keys yet.
 * `scripts/foundry/b2/list-b2-i18n-keys.mjs` mechanically generates the exact
 * manifest LC-INT-001 needs to populate them (every `*Key` field across every
 * episode, plus every `glossKey` here) — generated from real content rather
 * than hand-maintained, so it cannot drift.
 */

const item = (id, arc, kind, form, tiedCanDo, extra = {}) => ({
  id, arc, kind, form, tiedCanDo, glossKey: `b2Vocab_${id}`, ...extra,
})

export const B2_VOCABULARY = [
  // --- making_the_case (patterns already counted: 4; +14 productive / 10 receptive) ---
  item('id_say', 'making_the_case', 'productive', "I'd say", 'develop_and_defend_opinion'),
  item('the_way_i_see_it', 'making_the_case', 'productive', 'the way I see it', 'develop_and_defend_opinion'),
  item('to_be_honest', 'making_the_case', 'productive', 'to be honest', 'develop_and_defend_opinion'),
  item('the_thing_is', 'making_the_case', 'productive', 'the thing is', 'develop_and_defend_opinion'),
  item('at_the_end_of_the_day', 'making_the_case', 'productive', 'at the end of the day', 'develop_and_defend_opinion'),
  item('when_it_comes_to', 'making_the_case', 'productive', 'when it comes to', 'weigh_advantages_and_disadvantages'),
  item('im_not_convinced_that', 'making_the_case', 'productive', "I'm not convinced that", 'concede_a_point_and_counter'),
  item('theres_a_strong_case_for', 'making_the_case', 'productive', "there's a strong case for", 'develop_and_defend_opinion'),
  item('arguably', 'making_the_case', 'productive', 'arguably', 'develop_and_defend_opinion'),
  item('on_balance', 'making_the_case', 'productive', 'on balance', 'weigh_advantages_and_disadvantages'),
  item('all_things_considered', 'making_the_case', 'productive', 'all things considered', 'weigh_advantages_and_disadvantages'),
  item('a_fair_point', 'making_the_case', 'productive', 'a fair point', 'concede_a_point_and_counter'),
  item('a_valid_point', 'making_the_case', 'productive', 'a valid point', 'concede_a_point_and_counter'),
  item('the_bottom_line_is', 'making_the_case', 'productive', 'the bottom line is', 'weigh_advantages_and_disadvantages'),
  item('in_favor_of', 'making_the_case', 'receptive', 'in favor of', 'develop_and_defend_opinion'),
  item('in_opposition_to', 'making_the_case', 'receptive', 'in opposition to', 'develop_and_defend_opinion'),
  item('a_compelling_argument', 'making_the_case', 'receptive', 'a compelling argument', 'develop_and_defend_opinion'),
  item('a_weak_argument', 'making_the_case', 'receptive', 'a weak argument', 'develop_and_defend_opinion'),
  item('to_concede', 'making_the_case', 'receptive', 'to concede', 'concede_a_point_and_counter'),
  item('a_counterargument', 'making_the_case', 'receptive', 'a counterargument', 'concede_a_point_and_counter'),
  item('a_rebuttal', 'making_the_case', 'receptive', 'a rebuttal', 'concede_a_point_and_counter'),
  item('to_acknowledge', 'making_the_case', 'receptive', 'to acknowledge', 'concede_a_point_and_counter'),
  item('a_valid_objection', 'making_the_case', 'receptive', 'a valid objection', 'concede_a_point_and_counter'),
  item('devils_advocate', 'making_the_case', 'receptive', "devil's advocate", 'concede_a_point_and_counter'),

  // --- when_plans_go_wrong (patterns: 3; +14 productive / 10 receptive) ---
  item('the_issue_is_that', 'when_plans_go_wrong', 'productive', 'the issue is that', 'justify_a_request_for_change'),
  item('what_id_like_is', 'when_plans_go_wrong', 'productive', "what I'd like is", 'negotiate_a_resolution'),
  item('would_it_be_possible_to', 'when_plans_go_wrong', 'productive', 'would it be possible to', 'negotiate_a_resolution'),
  item('i_was_wondering_if_you_could', 'when_plans_go_wrong', 'productive', 'I was wondering if you could', 'negotiate_a_resolution'),
  item('thats_not_really_acceptable', 'when_plans_go_wrong', 'productive', "that's not really acceptable", 'express_frustration_diplomatically'),
  item('i_understand_but', 'when_plans_go_wrong', 'productive', 'I understand, but', 'express_frustration_diplomatically'),
  item('could_you_look_into', 'when_plans_go_wrong', 'productive', 'could you look into', 'justify_a_request_for_change'),
  item('as_a_gesture_of_goodwill', 'when_plans_go_wrong', 'productive', 'as a gesture of goodwill', 'negotiate_a_resolution'),
  item('id_appreciate_it_if', 'when_plans_go_wrong', 'productive', "I'd appreciate it if", 'justify_a_request_for_change'),
  item('to_be_fair', 'when_plans_go_wrong', 'productive', 'to be fair', 'express_frustration_diplomatically'),
  item('in_that_case', 'when_plans_go_wrong', 'productive', 'in that case', 'negotiate_a_resolution'),
  item('lets_see_what_we_can_do', 'when_plans_go_wrong', 'productive', "let's see what we can do", 'negotiate_a_resolution'),
  item('i_take_your_point', 'when_plans_go_wrong', 'productive', 'I take your point', 'express_frustration_diplomatically'),
  item('at_your_earliest_convenience', 'when_plans_go_wrong', 'productive', 'at your earliest convenience', 'justify_a_request_for_change'),
  item('to_compensate', 'when_plans_go_wrong', 'receptive', 'to compensate', 'negotiate_a_resolution'),
  item('a_refund', 'when_plans_go_wrong', 'receptive', 'a refund', 'negotiate_a_resolution'),
  item('a_replacement', 'when_plans_go_wrong', 'receptive', 'a replacement', 'negotiate_a_resolution'),
  item('an_apology', 'when_plans_go_wrong', 'receptive', 'an apology', 'express_frustration_diplomatically'),
  item('a_goodwill_gesture', 'when_plans_go_wrong', 'receptive', 'a goodwill gesture', 'negotiate_a_resolution'),
  item('to_escalate_a_complaint', 'when_plans_go_wrong', 'receptive', 'to escalate (a complaint)', 'express_frustration_diplomatically'),
  item('a_formal_complaint', 'when_plans_go_wrong', 'receptive', 'a formal complaint', 'justify_a_request_for_change'),
  item('to_reschedule', 'when_plans_go_wrong', 'receptive', 'to reschedule', 'negotiate_a_resolution'),
  item('an_inconvenience', 'when_plans_go_wrong', 'receptive', 'an inconvenience', 'justify_a_request_for_change'),
  item('a_resolution', 'when_plans_go_wrong', 'receptive', 'a resolution', 'negotiate_a_resolution'),

  // --- what_if (patterns: 6; +9 productive / 9 receptive) ---
  item('what_would_you_do_if', 'what_if', 'productive', 'what would you do if', 'hypothesize_about_unreal_situations'),
  item('i_bet', 'what_if', 'productive', 'I bet', 'speculate_about_cause_and_effect'),
  item('chances_are', 'what_if', 'productive', 'chances are', 'speculate_about_cause_and_effect'),
  item('theres_a_good_chance_that', 'what_if', 'productive', "there's a good chance that", 'speculate_about_cause_and_effect'),
  item('its_likely_that', 'what_if', 'productive', "it's likely that", 'speculate_about_cause_and_effect'),
  item('its_unlikely_that', 'what_if', 'productive', "it's unlikely that", 'speculate_about_cause_and_effect'),
  item('i_doubt_that', 'what_if', 'productive', 'I doubt that', 'speculate_about_cause_and_effect'),
  item('i_have_a_feeling_that', 'what_if', 'productive', 'I have a feeling that', 'speculate_about_cause_and_effect'),
  item('who_knows', 'what_if', 'productive', 'who knows', 'speculate_about_cause_and_effect'),
  item('a_hunch', 'what_if', 'receptive', 'a hunch', 'speculate_about_cause_and_effect'),
  item('to_speculate', 'what_if', 'receptive', 'to speculate', 'speculate_about_cause_and_effect'),
  item('a_plausible_explanation', 'what_if', 'receptive', 'a plausible explanation', 'speculate_about_cause_and_effect'),
  item('an_unlikely_explanation', 'what_if', 'receptive', 'an unlikely explanation', 'speculate_about_cause_and_effect'),
  item('with_hindsight', 'what_if', 'receptive', 'with hindsight', 'express_regret_about_a_past_decision'),
  item('in_retrospect', 'what_if', 'receptive', 'in retrospect', 'express_regret_about_a_past_decision'),
  item('a_missed_opportunity', 'what_if', 'receptive', 'a missed opportunity', 'express_regret_about_a_past_decision'),
  item('a_what_if_scenario', 'what_if', 'receptive', 'a what-if scenario', 'hypothesize_about_unreal_situations'),
  item('to_second_guess_oneself', 'what_if', 'receptive', 'to second-guess (oneself)', 'express_regret_about_a_past_decision'),

  // --- talking_around_a_subject (patterns: 3; +13 productive / 13 receptive) ---
  item('so_basically', 'talking_around_a_subject', 'productive', 'so basically', 'summarize_for_someone_else'),
  item('long_story_short', 'talking_around_a_subject', 'productive', 'long story short', 'summarize_for_someone_else'),
  item('the_gist_of_it_is', 'talking_around_a_subject', 'productive', 'the gist of it is', 'summarize_for_someone_else'),
  item('what_they_were_saying_was', 'talking_around_a_subject', 'productive', 'what they were saying was', 'report_someone_elses_opinion'),
  item('to_put_it_another_way', 'talking_around_a_subject', 'productive', 'to put it another way', 'reformulate_to_clarify'),
  item('if_i_understood_correctly', 'talking_around_a_subject', 'productive', 'if I understood correctly', 'reformulate_to_clarify'),
  item('let_me_break_it_down', 'talking_around_a_subject', 'productive', 'let me break it down', 'reformulate_to_clarify'),
  item('the_way_i_understood_it', 'talking_around_a_subject', 'productive', 'the way I understood it', 'report_someone_elses_opinion'),
  item('essentially', 'talking_around_a_subject', 'productive', 'essentially', 'reformulate_to_clarify'),
  item('what_it_comes_down_to_is', 'talking_around_a_subject', 'productive', 'what it comes down to is', 'summarize_for_someone_else'),
  item('to_sum_it_up', 'talking_around_a_subject', 'productive', 'to sum it up', 'summarize_for_someone_else'),
  item('just_to_clarify', 'talking_around_a_subject', 'productive', 'just to clarify', 'reformulate_to_clarify'),
  item('so_what_youre_saying_is', 'talking_around_a_subject', 'productive', "so what you're saying is", 'reformulate_to_clarify'),
  item('to_condense', 'talking_around_a_subject', 'receptive', 'to condense', 'summarize_for_someone_else'),
  item('to_convey', 'talking_around_a_subject', 'receptive', 'to convey', 'reformulate_to_clarify'),
  item('a_paraphrase', 'talking_around_a_subject', 'receptive', 'a paraphrase', 'reformulate_to_clarify'),
  item('a_misunderstanding', 'talking_around_a_subject', 'receptive', 'a misunderstanding', 'reformulate_to_clarify'),
  item('to_misquote', 'talking_around_a_subject', 'receptive', 'to misquote', 'report_someone_elses_opinion'),
  item('a_rough_summary', 'talking_around_a_subject', 'receptive', 'a rough summary', 'summarize_for_someone_else'),
  item('a_key_takeaway', 'talking_around_a_subject', 'receptive', 'a key takeaway', 'summarize_for_someone_else'),
  item('to_elaborate', 'talking_around_a_subject', 'receptive', 'to elaborate', 'reformulate_to_clarify'),
  item('to_digress', 'talking_around_a_subject', 'receptive', 'to digress', 'summarize_for_someone_else'),
  item('an_aside', 'talking_around_a_subject', 'receptive', 'an aside', 'summarize_for_someone_else'),
  item('a_recap', 'talking_around_a_subject', 'receptive', 'a recap', 'summarize_for_someone_else'),
  item('hearsay', 'talking_around_a_subject', 'receptive', 'hearsay', 'report_someone_elses_opinion'),
  item('to_relay_a_message', 'talking_around_a_subject', 'receptive', 'to relay (a message)', 'report_someone_elses_opinion'),

  // --- reading_between_the_lines (patterns: 3; +9 productive / 15 receptive) ---
  item('if_you_dont_mind_me_asking', 'reading_between_the_lines', 'productive', "if you don't mind me asking", 'adjust_register_to_context'),
  item('would_you_mind', 'reading_between_the_lines', 'productive', 'would you mind', 'adjust_register_to_context'),
  item('i_hope_you_dont_mind_me_saying', 'reading_between_the_lines', 'productive', "I hope you don't mind me saying", 'soften_or_strengthen_a_statement'),
  item('no_offense_but', 'reading_between_the_lines', 'productive', 'no offense, but', 'soften_or_strengthen_a_statement'),
  item('with_all_due_respect', 'reading_between_the_lines', 'productive', 'with all due respect', 'adjust_register_to_context'),
  item('for_what_its_worth', 'reading_between_the_lines', 'productive', "for what it's worth", 'soften_or_strengthen_a_statement'),
  item('just_between_us', 'reading_between_the_lines', 'productive', 'just between us', 'adjust_register_to_context'),
  item('strictly_speaking', 'reading_between_the_lines', 'productive', 'strictly speaking', 'soften_or_strengthen_a_statement'),
  item('if_im_honest', 'reading_between_the_lines', 'productive', "if I'm honest", 'soften_or_strengthen_a_statement'),
  item('a_hint', 'reading_between_the_lines', 'receptive', 'a hint', 'infer_implied_meaning'),
  item('an_undertone', 'reading_between_the_lines', 'receptive', 'an undertone', 'infer_implied_meaning'),
  item('a_backhanded_compliment', 'reading_between_the_lines', 'receptive', 'a backhanded compliment', 'infer_implied_meaning'),
  item('to_read_between_the_lines', 'reading_between_the_lines', 'receptive', 'to read between the lines', 'infer_implied_meaning'),
  item('tactless', 'reading_between_the_lines', 'receptive', 'tactless', 'adjust_register_to_context'),
  item('blunt', 'reading_between_the_lines', 'receptive', 'blunt', 'adjust_register_to_context'),
  item('diplomatic_adj', 'reading_between_the_lines', 'receptive', 'diplomatic', 'adjust_register_to_context'),
  item('condescending', 'reading_between_the_lines', 'receptive', 'condescending', 'infer_implied_meaning'),
  item('a_euphemism', 'reading_between_the_lines', 'receptive', 'a euphemism', 'infer_implied_meaning'),
  item('an_understatement', 'reading_between_the_lines', 'receptive', 'an understatement', 'soften_or_strengthen_a_statement'),
  item('an_overstatement', 'reading_between_the_lines', 'receptive', 'an overstatement', 'soften_or_strengthen_a_statement'),
  item('loaded_language', 'reading_between_the_lines', 'receptive', 'loaded (language)', 'infer_implied_meaning'),
  item('passive_aggressive', 'reading_between_the_lines', 'receptive', 'passive-aggressive', 'infer_implied_meaning'),
  item('to_beat_around_the_bush', 'reading_between_the_lines', 'receptive', 'to beat around the bush', 'adjust_register_to_context'),
  item('to_get_straight_to_the_point', 'reading_between_the_lines', 'receptive', 'to get straight to the point', 'adjust_register_to_context'),

  // --- the_long_conversation (patterns: 1; +9 productive / 10 receptive) ---
  item('before_we_move_on', 'the_long_conversation', 'productive', 'before we move on', 'sustain_a_multi_topic_conversation'),
  item('circling_back_to', 'the_long_conversation', 'productive', 'circling back to', 'handle_a_topic_shift_gracefully'),
  item('on_a_different_note', 'the_long_conversation', 'productive', 'on a different note', 'sustain_a_multi_topic_conversation'),
  item('that_being_said', 'the_long_conversation', 'productive', 'that being said', 'negotiate_an_agreement_under_pushback'),
  item('having_said_that', 'the_long_conversation', 'productive', 'having said that', 'negotiate_an_agreement_under_pushback'),
  item('lets_not_lose_sight_of', 'the_long_conversation', 'productive', "let's not lose sight of", 'sustain_a_multi_topic_conversation'),
  item('where_were_we', 'the_long_conversation', 'productive', 'where were we', 'handle_a_topic_shift_gracefully'),
  item('getting_back_to_what_you_said', 'the_long_conversation', 'productive', 'getting back to what you said', 'handle_a_topic_shift_gracefully'),
  item('one_more_thing', 'the_long_conversation', 'productive', 'one more thing', 'sustain_a_multi_topic_conversation'),
  item('to_be_on_the_same_page', 'the_long_conversation', 'receptive', 'to be on the same page', 'use_idiomatic_expressions_naturally'),
  item('to_hit_a_wall', 'the_long_conversation', 'receptive', 'to hit a wall', 'use_idiomatic_expressions_naturally'),
  item('to_meet_halfway', 'the_long_conversation', 'receptive', 'to meet halfway', 'negotiate_an_agreement_under_pushback'),
  item('to_read_the_room', 'the_long_conversation', 'receptive', 'to read the room', 'use_idiomatic_expressions_naturally'),
  item('to_touch_base', 'the_long_conversation', 'receptive', 'to touch base', 'use_idiomatic_expressions_naturally'),
  item('a_middle_ground', 'the_long_conversation', 'receptive', 'a middle ground', 'negotiate_an_agreement_under_pushback'),
  item('give_and_take', 'the_long_conversation', 'receptive', 'give and take', 'negotiate_an_agreement_under_pushback'),
  item('to_have_the_last_word', 'the_long_conversation', 'receptive', 'to have the last word', 'use_idiomatic_expressions_naturally'),
  item('to_bury_the_hatchet', 'the_long_conversation', 'receptive', 'to bury the hatchet', 'use_idiomatic_expressions_naturally'),
  item('to_see_eye_to_eye', 'the_long_conversation', 'receptive', 'to see eye to eye', 'use_idiomatic_expressions_naturally'),
]

export const getB2VocabularyForArc = (arcId) => B2_VOCABULARY.filter((v) => v.arc === arcId)

export const B2_VOCABULARY_COUNTS_BY_ARC = B2_VOCABULARY.reduce((acc, v) => {
  acc[v.arc] = acc[v.arc] || { productive: 0, receptive: 0 }
  acc[v.arc][v.kind] += 1
  return acc
}, {})
