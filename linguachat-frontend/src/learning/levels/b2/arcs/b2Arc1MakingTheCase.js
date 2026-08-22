/*
 * B2 arc 1 — "Making the case" (`making_the_case`).
 *
 * Derived from docs/curriculum/blueprints/b2.json arc `making_the_case` and
 * b2.md section 4. First arc, prerequisite: B1 exit only. Introduces
 * develop_and_defend_opinion, weigh_advantages_and_disadvantages (both
 * required) and concede_a_point_and_counter (should).
 *
 * STRUCTURE. Four episodes, same shape every B2 arc 1-5 uses: one teaching
 * episode per new capability (assisted-open production, then one unaided
 * production) plus one arc-closing integrated episode that (a) reuses every
 * capability the arc just taught inside a single longer exchange, (b) is
 * where each capability's "transfer" evidence happens — a genuinely new
 * topic not used in the teaching episodes — and (c) supplies each required
 * capability's second independent-production instance. This mirrors A1's
 * own arc-closer convention (a1Arc1.js WORK_03) rather than inventing a new
 * shape.
 *
 * EVIDENCE ACCOUNTING (must match b2.json#/canDos[].evidence):
 *   develop_and_defend_opinion (required, independent:2, transfer:1) —
 *     1 independent in EP1, 1 independent + 1 transfer in EP4.
 *   weigh_advantages_and_disadvantages (required, independent:2, transfer:1) —
 *     1 independent in EP2, 1 independent + 1 transfer in EP4.
 *   concede_a_point_and_counter (should, independent:1, transfer:0) —
 *     1 independent in EP3; EP4 reinforces it (guided reuse) without
 *     requiring transfer, matching its lighter evidence target.
 * `scripts/foundry/b2/check-b2-evidence-paths.mjs` counts these mechanically
 * from `evidenceType`/`transfer` step fields rather than trusting this
 * comment.
 *
 * STEP TYPES. Only the nine types `EpisodeShell.jsx` already renders (scene,
 * model, comprehension, choice, word_order, fill_blank, free_reply, recall,
 * completion) — B2 needs zero new renderer work, only evaluator/dispatch
 * wiring (out of this task's scope; see
 * docs/curriculum/implementation/b2/core-engine-handoff.md). `evalKind`
 * values are B2 intent ids from `b2Intents.js`; `canDoId` is added
 * explicitly on every evaluated step so validation never has to infer it
 * from the intent map.
 *
 * All prose lives behind i18n keys (never populated by this task — see
 * `i18nKeysNeeded.js`); every English target/prompt is literal, exactly as
 * every earlier level does it.
 */

const OPINION_01 = {
  id: 'b2_making_the_case_opinions',
  arc: 'making_the_case',
  level: 'B2',
  role: 'primary',
  titleKey: 'b2ep1Title',
  goalKey: 'b2ep1Goal',
  canDoId: 'develop_and_defend_opinion',
  canDoNameKey: 'b2ep1CanDoName',
  durationKey: 'b2ep1Duration',
  estimatedMinutes: 10,
  xp: 90,
  prerequisites: [],
  skillPrerequisites: ['b1.give_an_opinion'],
  gardenItems: ['opinion_stance_pattern', 'id_say', 'the_way_i_see_it', 'to_be_honest', 'the_thing_is'],
  reuseSkills: ['b1.give_an_opinion'],
  steps: [
    { type: 'scene', mood: 'thoughtful', titleKey: 'b2ep1SceneTitle', bodyKey: 'b2ep1SceneBody', showGoal: true, ctaKey: 'b2ep1Start' },
    {
      type: 'model', target: "In my view, we should move team lunch to Fridays. As I see it, people are more relaxed by the end of the week.",
      meaningItems: ['opinion_stance_pattern', 'the_way_i_see_it'], explainKey: 'b2ep1ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'b2ep1ComprehensionInstruction',
      target: "I'd argue that the later slot works better, because most people are still commuting at eight.",
      itemId: 'opinion_stance_pattern',
      options: [{ key: 'b2ep1CompOptCorrect', correct: true }, { key: 'b2ep1CompOptWrong1' }, { key: 'b2ep1CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'b2ep1NearMissInstruction',
      target: 'I just think so.',
      itemId: 'opinion_stance_pattern',
      options: [{ key: 'b2ep1NearMissOptCorrect', correct: true }, { key: 'b2ep1NearMissOptWrong1' }, { key: 'b2ep1NearMissOptWrong2' }],
      explainKey: 'b2ep1NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "We're deciding whether to move team lunch to Fridays. What do you think?",
      instructionKey: 'b2ep1AssistedInstruction', evalKind: 'state_opinion_with_reason', canDoId: 'develop_and_defend_opinion',
      suggestionEn: 'In my view, Fridays would work better, because people are more relaxed by then.',
      itemIds: ['opinion_stance_pattern', 'the_way_i_see_it'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Some people say the office should switch to a four-day week. What do you think, and why?',
      instructionKey: 'b2ep1IndependentInstruction', evalKind: 'state_opinion_with_reason', canDoId: 'develop_and_defend_opinion',
      itemIds: ['opinion_stance_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'b2ep1FinalInstruction', evalKind: 'state_opinion_with_reason', canDoId: 'develop_and_defend_opinion', itemIds: ['opinion_stance_pattern'] },
    { type: 'completion', canDoNameKey: 'b2ep1CanDoName', titleKey: 'b2ep1CloseTitle', bodyKey: 'b2ep1CloseBody', ctaKey: 'b2ep1CloseCta' },
  ],
}

const OPTIONS_02 = {
  id: 'b2_making_the_case_tradeoffs',
  arc: 'making_the_case',
  level: 'B2',
  role: 'primary',
  titleKey: 'b2ep2Title',
  goalKey: 'b2ep2Goal',
  canDoId: 'weigh_advantages_and_disadvantages',
  canDoNameKey: 'b2ep2CanDoName',
  durationKey: 'b2ep2Duration',
  estimatedMinutes: 10,
  xp: 90,
  prerequisites: ['b2_making_the_case_opinions'],
  skillPrerequisites: ['b1.compare_options_with_reasons', 'develop_and_defend_opinion'],
  gardenItems: ['contrast_connector_pattern', 'advantage_disadvantage_frame', 'when_it_comes_to', 'on_balance', 'all_things_considered', 'the_bottom_line_is'],
  reuseSkills: ['develop_and_defend_opinion'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'b2ep2RecallInstruction', evalKind: 'state_opinion_with_reason', canDoId: 'develop_and_defend_opinion', itemIds: ['opinion_stance_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'b2ep2SceneTitle', bodyKey: 'b2ep2SceneBody', ctaKey: 'b2ep2Start' },
    {
      type: 'model',
      target: "The main advantage of the online course is that it's flexible, whereas the in-person course is more advantage for staying motivated.",
      meaningItems: ['contrast_connector_pattern', 'advantage_disadvantage_frame'], explainKey: 'b2ep2ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'b2ep2ComprehensionInstruction',
      target: 'On the one hand, the cheaper flat is closer to work; on the other hand, the pricier one has more space.',
      itemId: 'contrast_connector_pattern',
      options: [{ key: 'b2ep2CompOptCorrect', correct: true }, { key: 'b2ep2CompOptWrong1' }, { key: 'b2ep2CompOptWrong2' }],
    },
    {
      type: 'word_order', instructionKey: 'b2ep2BuildInstruction', hintKey: 'b2ep2BuildHint', itemId: 'advantage_disadvantage_frame',
      tokens: ['The', 'main', 'advantage', 'of', 'this', 'plan', 'is', 'that', "it's", 'cheaper', '.'],
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "We're choosing between two venues for the team event: the community hall, which is free but small, and the hotel room, which costs money but is bigger. Which would you recommend, and why?",
      instructionKey: 'b2ep2AssistedInstruction', evalKind: 'weigh_options', canDoId: 'weigh_advantages_and_disadvantages',
      suggestionEn: "The main advantage of the hall is that it's free, whereas the hotel room has more space — on balance, I'd go with the hall.",
      itemIds: ['contrast_connector_pattern', 'advantage_disadvantage_frame'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Two suppliers sent quotes: one is faster but more expensive, the other is slower but cheaper. Weigh them up for me.',
      instructionKey: 'b2ep2IndependentInstruction', evalKind: 'weigh_options', canDoId: 'weigh_advantages_and_disadvantages',
      itemIds: ['contrast_connector_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'b2ep2FinalInstruction', evalKind: 'weigh_options', canDoId: 'weigh_advantages_and_disadvantages', itemIds: ['advantage_disadvantage_frame'] },
    { type: 'completion', canDoNameKey: 'b2ep2CanDoName', titleKey: 'b2ep2CloseTitle', bodyKey: 'b2ep2CloseBody', ctaKey: 'b2ep1CloseCta' },
  ],
}

const CONCEDE_03 = {
  id: 'b2_making_the_case_concede',
  arc: 'making_the_case',
  level: 'B2',
  role: 'secondary',
  titleKey: 'b2ep3Title',
  goalKey: 'b2ep3Goal',
  canDoId: 'concede_a_point_and_counter',
  canDoNameKey: 'b2ep3CanDoName',
  durationKey: 'b2ep3Duration',
  estimatedMinutes: 8,
  xp: 75,
  prerequisites: ['b2_making_the_case_tradeoffs'],
  skillPrerequisites: ['develop_and_defend_opinion'],
  gardenItems: ['concession_counter_pattern', 'a_fair_point', 'a_valid_point', 'im_not_convinced_that'],
  reuseSkills: ['develop_and_defend_opinion', 'weigh_advantages_and_disadvantages'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'b2ep3RecallInstruction', evalKind: 'weigh_options', canDoId: 'weigh_advantages_and_disadvantages', itemIds: ['contrast_connector_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'b2ep3SceneTitle', bodyKey: 'b2ep3SceneBody', ctaKey: 'b2ep3Start' },
    {
      type: 'model', target: "That's true, the hall is cheaper — but I take your point, however, that it can't fit everyone comfortably.",
      meaningItems: ['concession_counter_pattern'], explainKey: 'b2ep3ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'b2ep3ComprehensionInstruction', target: "Yes, you're right.",
      itemId: 'concession_counter_pattern',
      options: [{ key: 'b2ep3CompOptCorrect', correct: true }, { key: 'b2ep3CompOptWrong1' }, { key: 'b2ep3CompOptWrong2' }],
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "I still think the hotel room is worth the extra cost, because everyone will actually fit and be comfortable. What's your honest reaction to that?",
      instructionKey: 'b2ep3AssistedInstruction', evalKind: 'concede_and_counter', canDoId: 'concede_a_point_and_counter',
      suggestionEn: "That's a fair point about the space — but I still think the hall works, if we just keep the group smaller.",
      itemIds: ['concession_counter_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Fine, but I really think we should just book the hotel room and be done with it. React to that.',
      instructionKey: 'b2ep3IndependentInstruction', evalKind: 'concede_and_counter', canDoId: 'concede_a_point_and_counter',
      itemIds: ['concession_counter_pattern'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'b2ep3CanDoName', titleKey: 'b2ep3CloseTitle', bodyKey: 'b2ep3CloseBody', ctaKey: 'b2ep1CloseCta' },
  ],
}

const INTEGRATED_04 = {
  id: 'b2_making_the_case_integrated',
  arc: 'making_the_case',
  level: 'B2',
  role: 'integrated',
  titleKey: 'b2ep4Title',
  goalKey: 'b2ep4Goal',
  canDoId: 'develop_and_defend_opinion',
  canDoNameKey: 'b2ep4CanDoName',
  durationKey: 'b2ep4Duration',
  estimatedMinutes: 12,
  xp: 110,
  prerequisites: ['b2_making_the_case_concede'],
  skillPrerequisites: ['develop_and_defend_opinion', 'weigh_advantages_and_disadvantages', 'concede_a_point_and_counter'],
  gardenItems: [],
  reuseSkills: ['develop_and_defend_opinion', 'weigh_advantages_and_disadvantages', 'concede_a_point_and_counter'],
  /*
   * Transfer topic: a shared-household chore rota — genuinely new, never
   * used in EP1-EP3 (b2.json arc.newCanDos transferContexts + b2.md's
   * "neutral fallback": "a shared household chore rota"). This is what
   * makes the two production turns below TRANSFER, not repetition.
   */
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'b2ep4SceneTitle', bodyKey: 'b2ep4SceneBody', showGoal: true, ctaKey: 'b2ep4Start' },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Okay, so — how should we split the chores this month? I think whoever cooks shouldn't also have to clean up.",
      instructionKey: 'b2ep4OpinionInstruction', evalKind: 'state_opinion_with_reason', canDoId: 'develop_and_defend_opinion',
      itemIds: ['opinion_stance_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Fair, but I do most of the shopping already. What if we rotated everything weekly instead?",
      instructionKey: 'b2ep4ConcedeInstruction', evalKind: 'concede_and_counter', canDoId: 'concede_a_point_and_counter',
      itemIds: ['concession_counter_pattern'], evidenceType: 'guided',
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Rotating weekly versus keeping fixed jobs — which would you actually recommend for us, and why?",
      instructionKey: 'b2ep4WeighInstruction', evalKind: 'weigh_options', canDoId: 'weigh_advantages_and_disadvantages',
      itemIds: ['contrast_connector_pattern', 'advantage_disadvantage_frame'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Okay, let's go with your idea. Anything else before we agree on this?",
      instructionKey: 'b2ep4CloseInstruction', evalKind: 'state_opinion_with_reason', canDoId: 'develop_and_defend_opinion',
      suggestionEn: "No, I think that covers it — I'm glad we found something that works for both of us.",
      itemIds: ['opinion_stance_pattern'], evidenceType: 'assistedOpen',
    },
    { type: 'recall', instructionKey: 'b2ep4FinalInstruction', evalKind: 'weigh_options', canDoId: 'weigh_advantages_and_disadvantages', itemIds: ['advantage_disadvantage_frame'] },
    { type: 'completion', canDoNameKey: 'b2ep4CanDoName', titleKey: 'b2ep4CloseTitle', bodyKey: 'b2ep4CloseBody', ctaKey: 'b2ep1CloseCta' },
  ],
}

export const B2_ARC1 = [OPINION_01, OPTIONS_02, CONCEDE_03, INTEGRATED_04]
export const B2_ARC1_ID = 'making_the_case'
export const getB2Arc1Episode = (id) => B2_ARC1.find((ep) => ep.id === id) || null
