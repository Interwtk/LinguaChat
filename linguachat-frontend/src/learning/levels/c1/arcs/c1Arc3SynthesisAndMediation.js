/*
 * C1 arc 3 — "Making sense of it for someone else" (`synthesis_and_mediation`).
 *
 * Derived from docs/curriculum/blueprints/c1.json arc `synthesis_and_mediation`
 * and c1.md section 4 (Arc C). Introduces summarize_a_complex_message_for_a_new_audience,
 * synthesize_two_conflicting_viewpoints, reformulate_for_a_different_audience
 * (all required) and paraphrase_to_avoid_repetition (should). Reuses
 * concede_a_counterpoint_gracefully and adapt_register_to_audience (both
 * open retrieval) from earlier arcs.
 *
 * personalizationMode: light — source-text subject may be interest-adjacent;
 * the two-viewpoint mediation task itself never changes (c1.md section 4).
 *
 * Mediation-shaped steps follow the same `sourceRef`/`sourceTextEn`
 * convention `docs/curriculum/implementation/b2/core-engine-handoff.md`
 * section 3 documents for B2's arc 4: a `free_reply` step needing to react
 * to a longer source sits immediately after a `scene` step carrying a
 * `sourceTextEn` field — that source is what the reply is graded against.
 *
 * EVIDENCE ACCOUNTING:
 *   summarize_a_complex_message_for_a_new_audience (required, independent:3)
 *     — 1 independent in EP1, 1 independent+transfer in EP5; 3rd lands in
 *     Arc G (reuseMatrix's ONLY later mark — D at sustained_interaction,
 *     the blueprint's own designated delayed-retrieval arc for this one).
 *   synthesize_two_conflicting_viewpoints (required, independent:3) — 1
 *     independent in EP2, 1 independent+transfer in EP5; 3rd lands in Arc G
 *     (reuseMatrix's only later mark — R at sustained_interaction).
 *   reformulate_for_a_different_audience (required, independent:3) — 1
 *     independent in EP3, 1 independent+transfer in EP5; 3rd lands in Arc G
 *     (reuseMatrix's only later mark — R at sustained_interaction).
 *   paraphrase_to_avoid_repetition (should, independent:2) — 1 independent
 *     in EP4, 1 independent+transfer in EP5. Fully satisfied within this arc.
 */

const SUMMARIZE_01 = {
  id: 'c1_synthesis_and_mediation_summarize',
  arc: 'synthesis_and_mediation',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep11Title',
  goalKey: 'c1ep11Goal',
  canDoId: 'summarize_a_complex_message_for_a_new_audience',
  canDoNameKey: 'c1ep11CanDoName',
  durationKey: 'c1ep11Duration',
  estimatedMinutes: 11,
  xp: 100,
  prerequisites: ['c1_register_and_diplomacy_integrated'],
  skillPrerequisites: ['b2.summarize_for_someone_else'],
  gardenItems: ['cohesive_connector_pattern', 'the_essential_point_is', 'boiled_down', 'to_cut_a_long_story_short_c1'],
  reuseSkills: ['adapt_register_to_audience'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep11RecallInstruction', evalKind: 'adapt_register', canDoId: 'adapt_register_to_audience', itemIds: ['register_pair_pattern'] },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'c1ep11SceneTitle', bodyKey: 'c1ep11SceneBody', showGoal: true, ctaKey: 'c1ep11Start',
      sourceTextEn: "Hi — just to update you, the shipment's been delayed again, this time because of a supplier issue on their end, not ours. It should arrive early next week instead of this Friday. As a gesture of goodwill we're offering a 15% refund on the order, and we'll email tracking details as soon as it ships.",
    },
    {
      type: 'model',
      target: "The essential point is the shipment's delayed until next week because of a supplier issue, and they're offering a 15% refund as a result.",
      meaningItems: ['the_essential_point_is', 'cohesive_connector_pattern'], explainKey: 'c1ep11ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep11ComprehensionInstruction',
      target: "Boiled down: the delay's on their end, not ours, and we get a partial refund for it.",
      itemId: 'boiled_down',
      options: [{ key: 'c1ep11CompOptCorrect', correct: true }, { key: 'c1ep11CompOptWrong1' }, { key: 'c1ep11CompOptWrong2' }],
    },
    {
      type: 'free_reply', speaker: 'lingua', sourceRef: true, promptEn: "A colleague who hasn't seen this message asks what happened with the order. Give them the essential point.",
      instructionKey: 'c1ep11AssistedInstruction', evalKind: 'summarize_message', canDoId: 'summarize_a_complex_message_for_a_new_audience',
      suggestionEn: "Basically, the shipment's delayed until next week because of a supplier problem, and they're giving us a 15% refund because of it.",
      itemIds: ['the_essential_point_is'], evidenceType: 'assistedOpen',
    },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'c1ep11Scene2Title', bodyKey: 'c1ep11Scene2Body',
      sourceTextEn: "Reminder: the community hall booking for Saturday has been moved from the main room to the smaller side room, because the main room's heating is being repaired. Capacity there is 40, not 90, so if your group is bigger you may need to split the session or reschedule. Sorry for the short notice.",
    },
    {
      type: 'free_reply', speaker: 'lingua', sourceRef: true, promptEn: "Someone in your group missed this message entirely. Summarize the essential point for them.",
      instructionKey: 'c1ep11IndependentInstruction', evalKind: 'summarize_message', canDoId: 'summarize_a_complex_message_for_a_new_audience',
      itemIds: ['the_essential_point_is'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c1ep11FinalInstruction', evalKind: 'summarize_message', canDoId: 'summarize_a_complex_message_for_a_new_audience', itemIds: ['cohesive_connector_pattern'] },
    { type: 'completion', canDoNameKey: 'c1ep11CanDoName', titleKey: 'c1ep11CloseTitle', bodyKey: 'c1ep11CloseBody', ctaKey: 'c1ep11CloseCta' },
  ],
}

const SYNTHESIZE_02 = {
  id: 'c1_synthesis_and_mediation_synthesize',
  arc: 'synthesis_and_mediation',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep12Title',
  goalKey: 'c1ep12Goal',
  canDoId: 'synthesize_two_conflicting_viewpoints',
  canDoNameKey: 'c1ep12CanDoName',
  durationKey: 'c1ep12Duration',
  estimatedMinutes: 11,
  xp: 100,
  prerequisites: ['c1_synthesis_and_mediation_summarize'],
  skillPrerequisites: ['summarize_a_complex_message_for_a_new_audience', 'concede_a_counterpoint_gracefully'],
  gardenItems: ['evaluative_reporting_pattern', 'both_sources_agree_that', 'where_they_differ_is'],
  reuseSkills: ['summarize_a_complex_message_for_a_new_audience', 'concede_a_counterpoint_gracefully'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep12RecallInstruction', evalKind: 'concede_point', canDoId: 'concede_a_counterpoint_gracefully', itemIds: ['concessive_clause_pattern'] },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'c1ep12SceneTitle', bodyKey: 'c1ep12SceneBody', showGoal: true, ctaKey: 'c1ep12Start',
      sourceTextEn: "Review 1: 'Great location, right in the middle of everything — but the walls are thin and I could hear every conversation next door.' Review 2: 'Perfect location for exploring the city on foot. It does get a bit lively at night, but I liked that — felt sociable rather than annoying.'",
    },
    {
      type: 'model',
      target: "Both sources agree the location is great, but where they differ is the noise — one calls it too thin-walled to sleep, the other calls it lively and sociable.",
      meaningItems: ['both_sources_agree_that', 'where_they_differ_is', 'evaluative_reporting_pattern'], explainKey: 'c1ep12ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep12ComprehensionInstruction',
      target: "One review says the location is great but noisy.",
      itemId: 'both_sources_agree_that',
      options: [{ key: 'c1ep12CompOptCorrect', correct: true }, { key: 'c1ep12CompOptWrong1' }, { key: 'c1ep12CompOptWrong2' }],
      explainKey: 'c1ep12ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', sourceRef: true, promptEn: "A friend is deciding whether to book this place, based only on these two reviews. What do both reviews agree and disagree on?",
      instructionKey: 'c1ep12AssistedInstruction', evalKind: 'synthesize_viewpoints', canDoId: 'synthesize_two_conflicting_viewpoints',
      suggestionEn: "They both agree the location's excellent — but they disagree on the noise: one found it disruptive, the other found it lively.",
      itemIds: ['both_sources_agree_that', 'where_they_differ_is'], evidenceType: 'assistedOpen',
    },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'c1ep12Scene2Title', bodyKey: 'c1ep12Scene2Body',
      sourceTextEn: "Neighbor A: 'The new fence is fine, it's exactly on the property line like we agreed.' Neighbor B: 'The fence is at least a foot over onto my side — I measured it myself, twice.'",
    },
    {
      type: 'free_reply', speaker: 'lingua', sourceRef: true, promptEn: "You're mediating between these two neighbors. State, in one account, what they agree and disagree on.",
      instructionKey: 'c1ep12IndependentInstruction', evalKind: 'synthesize_viewpoints', canDoId: 'synthesize_two_conflicting_viewpoints',
      itemIds: ['where_they_differ_is'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'c1ep12CanDoName', titleKey: 'c1ep12CloseTitle', bodyKey: 'c1ep12CloseBody', ctaKey: 'c1ep11CloseCta' },
  ],
}

const REFORMULATE_03 = {
  id: 'c1_synthesis_and_mediation_reformulate',
  arc: 'synthesis_and_mediation',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep13Title',
  goalKey: 'c1ep13Goal',
  canDoId: 'reformulate_for_a_different_audience',
  canDoNameKey: 'c1ep13CanDoName',
  durationKey: 'c1ep13Duration',
  estimatedMinutes: 10,
  xp: 95,
  prerequisites: ['c1_synthesis_and_mediation_synthesize'],
  skillPrerequisites: ['summarize_a_complex_message_for_a_new_audience', 'adapt_register_to_audience'],
  gardenItems: ['to_put_it_more_simply', 'in_more_technical_terms', 'for_someone_who_hasnt_seen_this_before'],
  reuseSkills: ['adapt_register_to_audience', 'summarize_a_complex_message_for_a_new_audience'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep13RecallInstruction', evalKind: 'summarize_message', canDoId: 'summarize_a_complex_message_for_a_new_audience', itemIds: ['the_essential_point_is'] },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'c1ep13SceneTitle', bodyKey: 'c1ep13SceneBody', ctaKey: 'c1ep13Start',
      sourceTextEn: "Your account is on hold pending identity verification, per our standard KYC compliance process; access will be restored automatically once document review is complete.",
    },
    {
      type: 'model',
      target: "To put it more simply: the account's on hold until they check your ID — once that's done, it opens back up on its own.",
      meaningItems: ['to_put_it_more_simply', 'for_someone_who_hasnt_seen_this_before'], explainKey: 'c1ep13ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep13ComprehensionInstruction',
      target: 'Your account is on hold pending identity verification, per our standard KYC compliance process.',
      itemId: 'to_put_it_more_simply',
      options: [{ key: 'c1ep13CompOptCorrect', correct: true }, { key: 'c1ep13CompOptWrong1' }, { key: 'c1ep13CompOptWrong2' }],
      explainKey: 'c1ep13ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', sourceRef: true, promptEn: "Your grandparent, who's never heard the phrase 'KYC compliance,' asks what's going on with the account. Explain it for them.",
      instructionKey: 'c1ep13AssistedInstruction', evalKind: 'summarize_message', canDoId: 'reformulate_for_a_different_audience',
      suggestionEn: "To put it more simply, the bank just needs to check your ID before the account can be used again — should be automatic once that's done.",
      itemIds: ['to_put_it_more_simply'], evidenceType: 'assistedOpen',
    },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'c1ep13Scene2Title', bodyKey: 'c1ep13Scene2Body',
      sourceTextEn: "The router needs a factory reset: hold the recessed button for 10 seconds until the LED flashes, then reconfigure SSID and WPA2 credentials via the admin panel.",
    },
    {
      type: 'free_reply', speaker: 'lingua', sourceRef: true, promptEn: "Now explain this same instruction to someone who's never used a router admin panel before.",
      instructionKey: 'c1ep13IndependentInstruction', evalKind: 'summarize_message', canDoId: 'reformulate_for_a_different_audience',
      itemIds: ['to_put_it_more_simply'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'c1ep13CanDoName', titleKey: 'c1ep13CloseTitle', bodyKey: 'c1ep13CloseBody', ctaKey: 'c1ep11CloseCta' },
  ],
}

const PARAPHRASE_04 = {
  id: 'c1_synthesis_and_mediation_paraphrase',
  arc: 'synthesis_and_mediation',
  level: 'C1',
  role: 'secondary',
  titleKey: 'c1ep14Title',
  goalKey: 'c1ep14Goal',
  canDoId: 'paraphrase_to_avoid_repetition',
  canDoNameKey: 'c1ep14CanDoName',
  durationKey: 'c1ep14Duration',
  estimatedMinutes: 8,
  xp: 80,
  prerequisites: ['c1_synthesis_and_mediation_reformulate'],
  skillPrerequisites: ['reformulate_for_a_different_audience'],
  gardenItems: ['self_repair_discourse_pattern', 'to_put_it_another_way_c1', 'or_rather'],
  reuseSkills: ['reformulate_for_a_different_audience'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep14RecallInstruction', evalKind: 'summarize_message', canDoId: 'reformulate_for_a_different_audience', itemIds: ['to_put_it_more_simply'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep14SceneTitle', bodyKey: 'c1ep14SceneBody', ctaKey: 'c1ep14Start' },
    {
      type: 'model',
      target: "The account's on hold — or rather, to put it another way, they just need to double-check your ID first.",
      meaningItems: ['to_put_it_another_way_c1', 'or_rather'], explainKey: 'c1ep14ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep14ComprehensionInstruction',
      target: "The account's on hold. The account is on hold right now. The account has been placed on hold.",
      itemId: 'to_put_it_another_way_c1',
      options: [{ key: 'c1ep14CompOptCorrect', correct: true }, { key: 'c1ep14CompOptWrong1' }, { key: 'c1ep14CompOptWrong2' }],
      explainKey: 'c1ep14ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "You already told one person the delivery is delayed because of a supplier issue. Now a second person asks the same question — say it again, differently.",
      instructionKey: 'c1ep14AssistedInstruction', evalKind: 'summarize_message', canDoId: 'paraphrase_to_avoid_repetition',
      suggestionEn: "Or rather, to put it another way — the delay's on the supplier's end, not ours.",
      itemIds: ['to_put_it_another_way_c1'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "You already explained the router reset once. A third person joins the call and asks you to explain it again. Rephrase it, don't repeat it verbatim.",
      instructionKey: 'c1ep14IndependentInstruction', evalKind: 'summarize_message', canDoId: 'paraphrase_to_avoid_repetition',
      itemIds: ['or_rather'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'c1ep14CanDoName', titleKey: 'c1ep14CloseTitle', bodyKey: 'c1ep14CloseBody', ctaKey: 'c1ep11CloseCta' },
  ],
}

const INTEGRATED_05 = {
  id: 'c1_synthesis_and_mediation_integrated',
  arc: 'synthesis_and_mediation',
  level: 'C1',
  role: 'integrated',
  titleKey: 'c1ep15Title',
  goalKey: 'c1ep15Goal',
  canDoId: 'summarize_a_complex_message_for_a_new_audience',
  canDoNameKey: 'c1ep15CanDoName',
  durationKey: 'c1ep15Duration',
  estimatedMinutes: 13,
  xp: 120,
  prerequisites: ['c1_synthesis_and_mediation_paraphrase'],
  skillPrerequisites: ['summarize_a_complex_message_for_a_new_audience', 'synthesize_two_conflicting_viewpoints', 'reformulate_for_a_different_audience', 'paraphrase_to_avoid_repetition'],
  gardenItems: [],
  reuseSkills: ['summarize_a_complex_message_for_a_new_audience', 'synthesize_two_conflicting_viewpoints', 'reformulate_for_a_different_audience', 'paraphrase_to_avoid_repetition'],
  /*
   * Transfer source/audience: two conflicting instructions about a
   * volunteer event's meeting point, relayed to a newcomer volunteer who
   * knows nothing about the event — never used in EP1-EP4 (whose
   * sources/audiences were a shipment update, two hotel reviews, a KYC
   * notice and a router reset).
   */
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'c1ep15SceneTitle', bodyKey: 'c1ep15SceneBody', showGoal: true, ctaKey: 'c1ep15Start',
      sourceTextEn: "Organizer message 1: 'Meet at the north entrance at 9am, we'll walk over together.' Organizer message 2 (sent an hour later): 'Change of plan — meet directly at the site entrance at 9:15, skip the north gate.'",
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', sourceRef: true, promptEn: "A brand-new volunteer who's never seen either message asks where and when to show up. Summarize the essential point for them.",
      instructionKey: 'c1ep15SummarizeInstruction', evalKind: 'summarize_message', canDoId: 'summarize_a_complex_message_for_a_new_audience',
      itemIds: ['the_essential_point_is'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', sourceRef: true, promptEn: "They noticed the two messages actually conflict. State what both agree and disagree on.",
      instructionKey: 'c1ep15SynthesizeInstruction', evalKind: 'synthesize_viewpoints', canDoId: 'synthesize_two_conflicting_viewpoints',
      itemIds: ['where_they_differ_is'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Now explain the final plan to someone who's never volunteered for anything like this before and doesn't know the site layout.",
      instructionKey: 'c1ep15ReformulateInstruction', evalKind: 'summarize_message', canDoId: 'reformulate_for_a_different_audience',
      itemIds: ['to_put_it_more_simply'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "A second newcomer asks the exact same question a minute later. Say it again, differently.",
      instructionKey: 'c1ep15ParaphraseInstruction', evalKind: 'summarize_message', canDoId: 'paraphrase_to_avoid_repetition',
      itemIds: ['to_put_it_another_way_c1'], evidenceType: 'independent', transfer: true,
    },
    { type: 'recall', instructionKey: 'c1ep15FinalInstruction', evalKind: 'synthesize_viewpoints', canDoId: 'synthesize_two_conflicting_viewpoints', itemIds: ['both_sources_agree_that'] },
    { type: 'completion', canDoNameKey: 'c1ep15CanDoName', titleKey: 'c1ep15CloseTitle', bodyKey: 'c1ep15CloseBody', ctaKey: 'c1ep11CloseCta' },
  ],
}

export const C1_ARC3 = [SUMMARIZE_01, SYNTHESIZE_02, REFORMULATE_03, PARAPHRASE_04, INTEGRATED_05]
export const C1_ARC3_ID = 'synthesis_and_mediation'
export const getC1Arc3Episode = (id) => C1_ARC3.find((ep) => ep.id === id) || null
