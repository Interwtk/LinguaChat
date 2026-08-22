/*
 * C1 arc 7 — "Staying in it" (`sustained_interaction`), the level's
 * capstone/integrated arc.
 *
 * Derived from docs/curriculum/blueprints/c1.json arc `sustained_interaction`
 * and c1.md section 4 (Arc G). Introduces sustain_a_conversation_across_topic_shifts,
 * refer_back_to_earlier_discourse, shift_register_within_one_conversation
 * (all required) and close_a_complex_interaction_with_a_summary (should).
 * This arc is ALSO, by c1.json's own reuseMatrix, the level-wide reuse home
 * for nearly every required capability introduced in Arc A-F — see EVIDENCE
 * ACCOUNTING below and every earlier arc file's own header comment, each of
 * which documents exactly which capability's "3rd required touch" lands
 * here.
 *
 * STRUCTURE (six episodes, not five — this arc alone carries roughly as
 * much reuse content as the other six arcs combined, per the blueprint's
 * own description of it as "the level's delayed-retrieval arc for nearly
 * every required capability introduced earlier"):
 *   EP1-4: one teaching episode per new capability (as usual), EACH also
 *     carrying independent+transfer reuse touches for 2-3 older required
 *     capabilities (see per-episode comments) — this arc's teaching
 *     episodes are themselves already "staying in it" conversations, so
 *     folding reuse into them is the natural shape, not a bolt-on.
 *   EP5 (`c1_sustained_interaction_capstone_themed`) and EP6
 *     (`c1_sustained_interaction_capstone_neutral`): the STRUCTURALLY
 *     IDENTICAL themed/neutral capstone pair c1.json's own
 *     `personalizationMode: themed` + neutral-fallback-contexts pairing
 *     calls for (same convention `docs/curriculum/implementation/b2/README.md`
 *     documents for B2's arc 6) — same canDoId/evalKind/evidenceType/
 *     transfer sequence in both, only the surface topic differs (EP5: a
 *     gaming-meetup thread woven through the catch-up; EP6: the blueprint's
 *     own neutral fallback, an ordinary catch-up conversation). Each spans
 *     2-3 topic shifts and one register shift, per c1.json's own
 *     `expectedMeaningfulTurns: "14-18, spanning 2-3 topic shifts and at
 *     least one register shift"`. EP6 being a later episode than EP5 (both
 *     later than EP1-4) is what satisfies the reuseMatrix's own documented
 *     exception for this arc's three self-introduced required capabilities:
 *     "their evidence path instead comes from multiple episodes within
 *     sustained_interaction itself" (c1.json reuseMatrix.invariant) rather
 *     than a later arc, because there is no later arc.
 *
 * EVIDENCE ACCOUNTING for new-in-this-arc capabilities (independent
 * instances: 1 in that capability's own teaching episode + 1 in EP5 + 1 in
 * EP6 = 3 total per required capability, 2 of which — EP5 and EP6 — carry
 * transfer:true, satisfying independent:3/transfer:2; EP6 being a later
 * episode than EP5 satisfies the arc's own documented delayed-retrieval
 * exception):
 *   sustain_a_conversation_across_topic_shifts (required) — EP1 + EP5 + EP6.
 *   refer_back_to_earlier_discourse (required) — EP2 + EP5 + EP6.
 *   shift_register_within_one_conversation (required) — EP3 + EP5 + EP6.
 *   close_a_complex_interaction_with_a_summary (should, independent:2/
 *     transfer:1) — EP4 + EP5 (EP6 repeats it, exceeding the minimum, which
 *     is harmless).
 *
 * EVIDENCE ACCOUNTING for older capabilities reaching their 3rd/final
 * required touch here (independent+transfer, completing independent:3/
 * transfer:2 level-wide):
 *   EP1: develop_a_structured_argument (Arc A), concede_a_counterpoint_gracefully (Arc A).
 *   EP2: adapt_register_to_audience (Arc B), hedge_and_mitigate_a_statement (Arc B).
 *   EP3: summarize_a_complex_message_for_a_new_audience (Arc C, also this
 *     capability's OWN reuseMatrix-designated `D` delayed-retrieval arc),
 *     synthesize_two_conflicting_viewpoints (Arc C), reformulate_for_a_different_audience (Arc C).
 *   EP4: infer_implied_meaning_in_unfamiliar_context (Arc D), express_degrees_of_certainty (Arc D), hold_a_nuanced_stance (Arc D).
 *   EP5/EP6: produce_an_extended_structured_explanation (Arc E), use_cohesive_devices_across_a_turn (Arc E), self_correct_without_losing_the_thread (Arc E), negotiate_a_mutually_acceptable_outcome (Arc F), clarify_an_ambiguous_instruction_precisely (Arc F, also this capability's OWN `D` mark), propose_and_defend_an_alternative (Arc F).
 * That accounts for all 16 required capabilities c1ReuseMatrix.js marks for
 * a later touch in `sustained_interaction`.
 *
 * LIGHT REUSE-MATRIX TOUCHES for `should` capabilities the matrix marks here
 * but whose evidence target is already fully met in their own home arc
 * (repair_a_register_slip: R; paraphrase_to_avoid_repetition: R;
 * recognize_understatement_or_irony: T; open_and_close_an_extended_turn: R)
 * — each gets one `recall` step somewhere below, real content satisfying
 * `check-c1-reuse-matrix.mjs` without inflating their already-complete
 * evidence counts.
 */

const SUSTAIN_01 = {
  id: 'c1_sustained_interaction_sustain',
  arc: 'sustained_interaction',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep31Title',
  goalKey: 'c1ep31Goal',
  canDoId: 'sustain_a_conversation_across_topic_shifts',
  canDoNameKey: 'c1ep31CanDoName',
  durationKey: 'c1ep31Duration',
  estimatedMinutes: 12,
  xp: 105,
  prerequisites: ['c1_negotiation_and_complexity_integrated'],
  skillPrerequisites: ['b2.sustain_a_multi_topic_conversation', 'infer_implied_meaning_in_unfamiliar_context'],
  gardenItems: ['cohesive_connector_pattern', 'anyway_c1', 'speaking_of_which_c1', 'before_i_forget'],
  reuseSkills: ['develop_a_structured_argument', 'concede_a_counterpoint_gracefully'],
  discourseCoherence: { checked: true, graduationRelevance: 'required' },
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep31RecallInstruction', evalKind: 'state_structured_argument', canDoId: 'develop_a_structured_argument', itemIds: ['emphatic_cleft_pattern'] },
    { type: 'recall', instructionKey: 'c1ep31QualifyRecallInstruction', evalKind: 'qualify_claim', canDoId: 'qualify_a_claim_precisely', itemIds: ['hedging_adverbial_pattern'] },
    { type: 'scene', mood: 'welcoming', titleKey: 'c1ep31SceneTitle', bodyKey: 'c1ep31SceneBody', showGoal: true, ctaKey: 'c1ep31Start' },
    {
      type: 'model',
      target: "Anyway, before I forget — speaking of which, did you end up going with the later start time we talked about?",
      meaningItems: ['anyway_c1', 'before_i_forget', 'speaking_of_which_c1'], explainKey: 'c1ep31ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep31ComprehensionInstruction',
      target: "So the weather. And also my job. And the weekend.",
      itemId: 'anyway_c1',
      options: [{ key: 'c1ep31CompOptCorrect', correct: true }, { key: 'c1ep31CompOptWrong1' }, { key: 'c1ep31CompOptWrong2' }],
      explainKey: 'c1ep31ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "We've been chatting about your weekend plans — but anyway, before I forget, weren't you also going to tell me about that work thing? Pick that up.",
      instructionKey: 'c1ep31AssistedInstruction', evalKind: 'track_discourse', canDoId: 'sustain_a_conversation_across_topic_shifts',
      suggestionEn: "Oh, right — anyway, so the work thing is actually going better than expected. Speaking of which, that reminds me, I should tell you about the trip too.",
      itemIds: ['anyway_c1', 'speaking_of_which_c1'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "We've covered your weekend plans and the work situation — now shift smoothly to a third, related topic: how the new apartment search is going.",
      instructionKey: 'c1ep31IndependentInstruction', evalKind: 'track_discourse', canDoId: 'sustain_a_conversation_across_topic_shifts',
      itemIds: ['before_i_forget'], evidenceType: 'independent',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Going back to what we were just talking about, what would you actually recommend for a topic never mentioned yet — say, whether to also switch gyms this year?",
      instructionKey: 'c1ep31ArgumentInstruction', evalKind: 'state_structured_argument', canDoId: 'develop_a_structured_argument',
      itemIds: ['emphatic_cleft_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "I still think switching gyms this year is a bad idea, the current one's fine. What do you say?",
      instructionKey: 'c1ep31ConcedeInstruction', evalKind: 'concede_point', canDoId: 'concede_a_counterpoint_gracefully',
      itemIds: ['concessive_clause_pattern'], evidenceType: 'independent', transfer: true,
    },
    { type: 'completion', canDoNameKey: 'c1ep31CanDoName', titleKey: 'c1ep31CloseTitle', bodyKey: 'c1ep31CloseBody', ctaKey: 'c1ep31CloseCta' },
  ],
}

const REFERBACK_02 = {
  id: 'c1_sustained_interaction_referback',
  arc: 'sustained_interaction',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep32Title',
  goalKey: 'c1ep32Goal',
  canDoId: 'refer_back_to_earlier_discourse',
  canDoNameKey: 'c1ep32CanDoName',
  durationKey: 'c1ep32Duration',
  estimatedMinutes: 12,
  xp: 105,
  prerequisites: ['c1_sustained_interaction_sustain'],
  skillPrerequisites: ['sustain_a_conversation_across_topic_shifts'],
  gardenItems: ['anaphoric_reference_pattern', 'going_back_to_what_you_said_about', 'that_point_you_raised_earlier', 'as_for_the_other_thing'],
  reuseSkills: ['adapt_register_to_audience', 'hedge_and_mitigate_a_statement'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep32RecallInstruction', evalKind: 'adapt_register', canDoId: 'adapt_register_to_audience', itemIds: ['register_pair_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep32SceneTitle', bodyKey: 'c1ep32SceneBody', ctaKey: 'c1ep32Start' },
    {
      type: 'model',
      target: "Going back to what you said about the budget earlier, I think that point you raised actually connects to this new issue too.",
      meaningItems: ['going_back_to_what_you_said_about', 'that_point_you_raised_earlier', 'anaphoric_reference_pattern'], explainKey: 'c1ep32ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep32ComprehensionInstruction',
      target: "Like I said before...",
      itemId: 'that_point_you_raised_earlier',
      options: [{ key: 'c1ep32CompOptCorrect', correct: true }, { key: 'c1ep32CompOptWrong1' }, { key: 'c1ep32CompOptWrong2' }],
      explainKey: 'c1ep32ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Ten minutes ago you mentioned you were worried about the deadline. Now that we're discussing the new scope, refer back to that specific worry accurately.",
      instructionKey: 'c1ep32AssistedInstruction', evalKind: 'track_discourse', canDoId: 'refer_back_to_earlier_discourse',
      suggestionEn: "Going back to what you said earlier about the deadline — that point you raised actually matters even more now that the scope's grown.",
      itemIds: ['going_back_to_what_you_said_about'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Earlier in this conversation you mentioned wanting to switch gyms. As for the other thing you raised — refer back to it accurately now, without restating it in full.",
      instructionKey: 'c1ep32IndependentInstruction', evalKind: 'track_discourse', canDoId: 'refer_back_to_earlier_discourse',
      itemIds: ['as_for_the_other_thing'], evidenceType: 'independent',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Could you possibly let me know if the report on the apartment search is ready? I'd like an update when you get a chance.",
      instructionKey: 'c1ep32HedgeInstruction', evalKind: 'hedge_statement', canDoId: 'hedge_and_mitigate_a_statement',
      itemIds: ['mitigation_device_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Ask a total stranger, politely, whether they'd be willing to swap seats with you on a train.",
      instructionKey: 'c1ep32AdaptInstruction', evalKind: 'adapt_register', canDoId: 'adapt_register_to_audience',
      itemIds: ['register_pair_pattern'], evidenceType: 'independent', transfer: true, expectedRegister: 'formal',
    },
    { type: 'completion', canDoNameKey: 'c1ep32CanDoName', titleKey: 'c1ep32CloseTitle', bodyKey: 'c1ep32CloseBody', ctaKey: 'c1ep31CloseCta' },
  ],
}

const SHIFTREGISTER_03 = {
  id: 'c1_sustained_interaction_shiftregister',
  arc: 'sustained_interaction',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep33Title',
  goalKey: 'c1ep33Goal',
  canDoId: 'shift_register_within_one_conversation',
  canDoNameKey: 'c1ep33CanDoName',
  durationKey: 'c1ep33Duration',
  estimatedMinutes: 12,
  xp: 105,
  prerequisites: ['c1_sustained_interaction_referback'],
  skillPrerequisites: ['sustain_a_conversation_across_topic_shifts', 'adapt_register_to_audience'],
  gardenItems: ['register_pair_pattern', 'sorry_to_get_a_bit_more_formal_but', 'on_a_lighter_note'],
  reuseSkills: ['summarize_a_complex_message_for_a_new_audience', 'synthesize_two_conflicting_viewpoints', 'reformulate_for_a_different_audience'],
  registerAppropriateness: { checked: true, graduationRelevance: 'required' },
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep33RecallInstruction', evalKind: 'track_discourse', canDoId: 'refer_back_to_earlier_discourse', itemIds: ['going_back_to_what_you_said_about'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep33SceneTitle', bodyKey: 'c1ep33SceneBody', ctaKey: 'c1ep33Start' },
    {
      type: 'model',
      target: "Sorry, to get a bit more formal for a second — could we confirm the contract terms in writing? [...] Okay, on a lighter note, how was the rest of your weekend?",
      meaningItems: ['sorry_to_get_a_bit_more_formal_but', 'on_a_lighter_note'], explainKey: 'c1ep33ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep33ComprehensionInstruction',
      target: 'yeah lol anyway so about that contract thing',
      itemId: 'sorry_to_get_a_bit_more_formal_but',
      options: [{ key: 'c1ep33CompOptCorrect', correct: true }, { key: 'c1ep33CompOptWrong1' }, { key: 'c1ep33CompOptWrong2' }],
      explainKey: 'c1ep33ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "You've been having a casual catch-up with a friend who's also your landlord, and now you genuinely need to raise a serious request about the lease. Shift the register for that one moment.",
      instructionKey: 'c1ep33AssistedInstruction', evalKind: 'adapt_register', canDoId: 'shift_register_within_one_conversation',
      suggestionEn: "Sorry, to get a bit more formal for a second — would it be possible to put the extension in writing? [...] Anyway, on a lighter note, how's the new place treating you?",
      itemIds: ['sorry_to_get_a_bit_more_formal_but'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "The casual conversation just turned into a genuine, serious request about splitting a bill. Shift register for that, then shift back to casual once it's settled.",
      instructionKey: 'c1ep33IndependentInstruction', evalKind: 'adapt_register', canDoId: 'shift_register_within_one_conversation',
      itemIds: ['on_a_lighter_note'], evidenceType: 'independent',
    },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'c1ep33Scene2Title', bodyKey: 'c1ep33Scene2Body',
      sourceTextEn: "Message from a coworker: 'The vendor says the new system launches in March. Their sales rep also mentioned it might slip to April if testing runs long.'",
    },
    {
      type: 'free_reply', speaker: 'lingua', sourceRef: true, promptEn: "A teammate who's never seen this message asks when the new system launches. Give them the essential point.",
      instructionKey: 'c1ep33SummarizeInstruction', evalKind: 'summarize_message', canDoId: 'summarize_a_complex_message_for_a_new_audience',
      itemIds: ['the_essential_point_is'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', sourceRef: true, promptEn: "Another teammate found a second source saying launch is 'definitely April, no earlier.' State what both sources agree and disagree on.",
      instructionKey: 'c1ep33SynthesizeInstruction', evalKind: 'synthesize_viewpoints', canDoId: 'synthesize_two_conflicting_viewpoints',
      itemIds: ['both_sources_agree_that'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Now explain the launch-date situation to someone completely new to the project who's never heard any of this.",
      instructionKey: 'c1ep33ReformulateInstruction', evalKind: 'summarize_message', canDoId: 'reformulate_for_a_different_audience',
      itemIds: ['to_put_it_more_simply'], evidenceType: 'independent', transfer: true,
    },
    { type: 'completion', canDoNameKey: 'c1ep33CanDoName', titleKey: 'c1ep33CloseTitle', bodyKey: 'c1ep33CloseBody', ctaKey: 'c1ep31CloseCta' },
  ],
}

const CLOSESUMMARY_04 = {
  id: 'c1_sustained_interaction_closesummary',
  arc: 'sustained_interaction',
  level: 'C1',
  role: 'secondary',
  titleKey: 'c1ep34Title',
  goalKey: 'c1ep34Goal',
  canDoId: 'close_a_complex_interaction_with_a_summary',
  canDoNameKey: 'c1ep34CanDoName',
  durationKey: 'c1ep34Duration',
  estimatedMinutes: 11,
  xp: 100,
  prerequisites: ['c1_sustained_interaction_shiftregister'],
  skillPrerequisites: ['refer_back_to_earlier_discourse', 'produce_an_extended_structured_explanation'],
  gardenItems: ['cohesive_connector_pattern', 'so_to_sum_up_what_weve_agreed', 'before_we_wrap_up'],
  reuseSkills: ['infer_implied_meaning_in_unfamiliar_context', 'express_degrees_of_certainty', 'hold_a_nuanced_stance'],
  discourseCoherence: { checked: true, graduationRelevance: 'should-relevant-signal' },
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep34RecallInstruction', evalKind: 'infer_meaning', canDoId: 'infer_implied_meaning_in_unfamiliar_context', itemIds: ['what_they_probably_mean_is'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep34SceneTitle', bodyKey: 'c1ep34SceneBody', ctaKey: 'c1ep34Start' },
    {
      type: 'model',
      target: "So, to sum up what we've agreed: the launch stays in March if testing goes fine, and we'll flag it early if it slips. Before we wrap up, anything else?",
      meaningItems: ['so_to_sum_up_what_weve_agreed', 'before_we_wrap_up'], explainKey: 'c1ep34ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep34ComprehensionInstruction',
      target: "Anyway, whatever, see you later.",
      itemId: 'so_to_sum_up_what_weve_agreed',
      options: [{ key: 'c1ep34CompOptCorrect', correct: true }, { key: 'c1ep34CompOptWrong1' }, { key: 'c1ep34CompOptWrong2' }],
      explainKey: 'c1ep34ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "A colleague says, about the tight new deadline: 'Sure, we'll manage, no problem at all.' What do you think they actually mean, given how tight it really is?",
      instructionKey: 'c1ep34InferInstruction', evalKind: 'infer_meaning', canDoId: 'infer_implied_meaning_in_unfamiliar_context',
      itemIds: ['what_they_probably_mean_is'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "How confident are you that the March launch date will actually hold? Mark your real degree of certainty.",
      instructionKey: 'c1ep34CertaintyInstruction', evalKind: 'qualify_claim', canDoId: 'express_degrees_of_certainty',
      itemIds: ['im_fairly_sure_that'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Someone asks whether the whole project has actually gone well overall. It's genuinely mixed — some parts worked, some didn't. Give a nuanced answer.",
      instructionKey: 'c1ep34NuancedInstruction', evalKind: 'concede_point', canDoId: 'hold_a_nuanced_stance',
      itemIds: ['its_not_that_simple'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "This whole conversation covered the launch date, testing risk, and the audience mix-up. Before we wrap up, sum up what was actually agreed.",
      instructionKey: 'c1ep34AssistedInstruction', evalKind: 'track_discourse', canDoId: 'close_a_complex_interaction_with_a_summary',
      suggestionEn: "So, to sum up what we've agreed: the launch stays in March if testing holds, we'll reformulate for the wider team, and we'll flag any slip early.",
      itemIds: ['so_to_sum_up_what_weve_agreed'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "This whole conversation also covered the apartment search and the gym decision. Before we wrap up entirely, give a brief accurate summary of everything discussed today.",
      instructionKey: 'c1ep34IndependentInstruction', evalKind: 'track_discourse', canDoId: 'close_a_complex_interaction_with_a_summary',
      itemIds: ['before_we_wrap_up'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'c1ep34CanDoName', titleKey: 'c1ep34CloseTitle', bodyKey: 'c1ep34CloseBody', ctaKey: 'c1ep31CloseCta' },
  ],
}

/*
 * Shared step-sequence builder for the themed/neutral capstone pair —
 * IDENTICAL canDoId/evalKind/evidenceType/transfer sequence, only the
 * `promptEn`/`suggestionEn` surface text differs, per the personalization
 * invariant (`docs/curriculum/blueprints/c1.json` section 7 / c1.md's
 * two-theme proof requirement: same canDoId, evaluator intent, evidence
 * threshold and difficulty across both variants).
 */
const buildCapstoneSteps = (variant) => {
  const topicA = variant === 'themed'
    ? "a gaming meetup you're thinking of organizing"
    : 'how your week has actually been going'
  const topicB = variant === 'themed'
    ? "whether the meetup venue should require an entry fee to cover costs"
    : 'a scheduling conflict with a shared house chore rota'
  const formalMoment = variant === 'themed'
    ? "the venue's actual booking contract, which needs a real answer today"
    : 'a genuinely overdue shared bill that needs a real answer today'

  return [
    { type: 'scene', mood: 'welcoming', titleKey: `c1ep${variant === 'themed' ? 35 : 36}SceneTitle`, bodyKey: `c1ep${variant === 'themed' ? 35 : 36}SceneBody`, showGoal: true, ctaKey: `c1ep${variant === 'themed' ? 35 : 36}Start` },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: `So, catching up — tell me about ${topicA}.`,
      instructionKey: 'c1ep35SustainInstruction', evalKind: 'track_discourse', canDoId: 'sustain_a_conversation_across_topic_shifts',
      itemIds: ['anyway_c1'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: `Anyway, before I forget — earlier you mentioned something about ${topicB.startsWith('whether') ? 'money being tight this month' : 'the chores being unfair lately'}. Shift the conversation there.`,
      instructionKey: 'c1ep35ReferBackInstruction', evalKind: 'track_discourse', canDoId: 'refer_back_to_earlier_discourse',
      itemIds: ['going_back_to_what_you_said_about'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: `Actually, sorry — ${formalMoment}. Can we get serious about that for a second?`,
      instructionKey: 'c1ep35ShiftRegisterInstruction', evalKind: 'adapt_register', canDoId: 'shift_register_within_one_conversation',
      itemIds: ['sorry_to_get_a_bit_more_formal_but'], evidenceType: 'independent', transfer: true, expectedRegister: 'formal',
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: `Explain, in one organized turn with a beginning and an end, exactly what you propose to do about ${topicB}.`,
      instructionKey: 'c1ep35ExplainInstruction', evalKind: 'extended_explanation', canDoId: 'produce_an_extended_structured_explanation',
      itemIds: ['cohesive_connector_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Link a couple more details together with connectors — what happens if this comes up again next month?',
      instructionKey: 'c1ep35CohesionInstruction', evalKind: 'extended_explanation', canDoId: 'use_cohesive_devices_across_a_turn',
      itemIds: ['however_c1'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Oh wait, actually, you got a number wrong just now. Correct yourself and keep going without losing the thread.',
      instructionKey: 'c1ep35SelfCorrectInstruction', evalKind: 'extended_explanation', canDoId: 'self_correct_without_losing_the_thread',
      itemIds: ['or_rather_c1'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: `Propose an outcome for ${topicB} that would genuinely work for both of you.`,
      instructionKey: 'c1ep35NegotiateInstruction', evalKind: 'negotiate_outcome', canDoId: 'negotiate_a_mutually_acceptable_outcome',
      itemIds: ['what_if_we_c1'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "I said 'let's just sort it out later' — that's vague. Ask a precise question that actually resolves what that means.",
      instructionKey: 'c1ep35ClarifyInstruction', evalKind: 'clarify_ambiguity', canDoId: 'clarify_an_ambiguous_instruction_precisely',
      itemIds: ['when_you_say_x_do_you_mean'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'That first proposal actually turns out not to work after all — something changed. Propose and defend a different one.',
      instructionKey: 'c1ep35ProposeInstruction', evalKind: 'negotiate_outcome', canDoId: 'propose_and_defend_an_alternative',
      itemIds: ['if_that_doesnt_work_how_about'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: `Okay, on a lighter note — anything else before we wrap up on ${topicA}?`,
      instructionKey: 'c1ep35CloseInstruction', evalKind: 'track_discourse', canDoId: 'close_a_complex_interaction_with_a_summary',
      itemIds: ['before_we_wrap_up'], evidenceType: 'independent', transfer: true,
    },
    { type: 'recall', instructionKey: 'c1ep35RepairRecallInstruction', evalKind: 'adapt_register', canDoId: 'repair_a_register_slip', itemIds: ['self_repair_discourse_pattern'] },
    { type: 'recall', instructionKey: 'c1ep35ParaphraseRecallInstruction', evalKind: 'summarize_message', canDoId: 'paraphrase_to_avoid_repetition', itemIds: ['to_put_it_another_way_c1'] },
    { type: 'recall', instructionKey: 'c1ep35IronyRecallInstruction', evalKind: 'infer_meaning', canDoId: 'recognize_understatement_or_irony', itemIds: ['i_dont_think_they_really_mean_that'] },
    { type: 'recall', instructionKey: 'c1ep35OpenCloseRecallInstruction', evalKind: 'extended_explanation', canDoId: 'open_and_close_an_extended_turn', itemIds: ['to_wrap_up'] },
    { type: 'completion', canDoNameKey: 'c1ep35CanDoName', titleKey: `c1ep${variant === 'themed' ? 35 : 36}CloseTitle`, bodyKey: `c1ep${variant === 'themed' ? 35 : 36}CloseBody`, ctaKey: 'c1ep31CloseCta' },
  ]
}

const CAPSTONE_THEMED_05 = {
  id: 'c1_sustained_interaction_capstone_themed',
  arc: 'sustained_interaction',
  level: 'C1',
  role: 'integrated',
  variant: 'themed',
  titleKey: 'c1ep35Title',
  goalKey: 'c1ep35Goal',
  canDoId: 'sustain_a_conversation_across_topic_shifts',
  canDoNameKey: 'c1ep35CanDoName',
  durationKey: 'c1ep35Duration',
  estimatedMinutes: 17,
  xp: 150,
  prerequisites: ['c1_sustained_interaction_closesummary'],
  skillPrerequisites: ['sustain_a_conversation_across_topic_shifts', 'refer_back_to_earlier_discourse', 'shift_register_within_one_conversation', 'close_a_complex_interaction_with_a_summary'],
  gardenItems: [],
  reuseSkills: ['produce_an_extended_structured_explanation', 'use_cohesive_devices_across_a_turn', 'self_correct_without_losing_the_thread', 'negotiate_a_mutually_acceptable_outcome', 'clarify_an_ambiguous_instruction_precisely', 'propose_and_defend_an_alternative'],
  discourseCoherence: { checked: true, graduationRelevance: 'required' },
  registerAppropriateness: { checked: true, graduationRelevance: 'required' },
  personalizationSlot: { theme: 'gaming', neutralFallback: 'a catch-up conversation' },
  steps: buildCapstoneSteps('themed'),
}

const CAPSTONE_NEUTRAL_06 = {
  id: 'c1_sustained_interaction_capstone_neutral',
  arc: 'sustained_interaction',
  level: 'C1',
  role: 'integrated',
  variant: 'neutral',
  titleKey: 'c1ep36Title',
  goalKey: 'c1ep36Goal',
  canDoId: 'sustain_a_conversation_across_topic_shifts',
  canDoNameKey: 'c1ep36CanDoName',
  durationKey: 'c1ep36Duration',
  estimatedMinutes: 17,
  xp: 150,
  prerequisites: ['c1_sustained_interaction_closesummary'],
  skillPrerequisites: ['sustain_a_conversation_across_topic_shifts', 'refer_back_to_earlier_discourse', 'shift_register_within_one_conversation', 'close_a_complex_interaction_with_a_summary'],
  gardenItems: [],
  reuseSkills: ['produce_an_extended_structured_explanation', 'use_cohesive_devices_across_a_turn', 'self_correct_without_losing_the_thread', 'negotiate_a_mutually_acceptable_outcome', 'clarify_an_ambiguous_instruction_precisely', 'propose_and_defend_an_alternative'],
  discourseCoherence: { checked: true, graduationRelevance: 'required' },
  registerAppropriateness: { checked: true, graduationRelevance: 'required' },
  personalizationSlot: { theme: null, neutralFallback: 'a catch-up conversation' },
  steps: buildCapstoneSteps('neutral'),
}

export const C1_ARC7 = [SUSTAIN_01, REFERBACK_02, SHIFTREGISTER_03, CLOSESUMMARY_04, CAPSTONE_THEMED_05, CAPSTONE_NEUTRAL_06]
export const C1_ARC7_ID = 'sustained_interaction'
export const getC1Arc7Episode = (id) => C1_ARC7.find((ep) => ep.id === id) || null

/*
 * The structural fingerprint `scripts/foundry/c1/check-c1-personalization-invariant.mjs`
 * diffs between the themed/neutral capstone pair — same idea as
 * `b2Arc6TheLongConversation.js`'s own `structuralSignature`: personalization
 * may change what a step is ABOUT, never its canDoId/evalKind/evidenceType/
 * transfer shape.
 */
export const structuralSignature = (episode) => episode.steps
  .filter((s) => s.type === 'free_reply' || s.type === 'recall')
  .map((s) => ({ type: s.type, canDoId: s.canDoId || null, evalKind: s.evalKind || null, evidenceType: s.evidenceType || null, transfer: !!s.transfer }))
