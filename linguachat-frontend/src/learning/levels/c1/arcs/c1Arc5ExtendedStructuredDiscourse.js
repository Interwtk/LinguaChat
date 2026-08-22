/*
 * C1 arc 5 — "Saying more, in order" (`extended_structured_discourse`).
 *
 * Derived from docs/curriculum/blueprints/c1.json arc
 * `extended_structured_discourse` and c1.md section 4 (Arc E). Introduces
 * produce_an_extended_structured_explanation, use_cohesive_devices_across_a_turn,
 * self_correct_without_losing_the_thread (all required) and
 * open_and_close_an_extended_turn (should). Reuses develop_a_structured_argument
 * and adapt_register_to_audience (both open retrieval) from earlier arcs.
 *
 * First arc where `discourseCoherence` (c1EvaluationContracts.js) is
 * required, not should-relevant, per c1.md section 15.2 — every
 * `extended_explanation`-evaluated independent/transfer step below is a
 * genuinely multi-sentence turn, scored for coherence as well as content.
 *
 * HONEST NOTE: `c1.json#/capabilities[use_cohesive_devices_across_a_turn].reuseContexts`
 * lists `["synthesis_and_mediation", "negotiation_and_complexity", "sustained_interaction"]`
 * (three arcs), but BOTH `c1.json#/reuseMatrix` (only an `R` at
 * `sustained_interaction`) AND Arc C's/Arc F's own `capabilitiesReused`
 * arc-level lists (neither names this capability) agree it is reused ONLY
 * in `sustained_interaction`. Followed the two agreeing, more specific
 * sources here (the same "arc's own declared reuse list over the aggregate
 * field" precedent `docs/curriculum/implementation/b2/README.md` section 4
 * used for its own analogous mismatch) — this capability is NOT touched in
 * Arc C or Arc F content, only here and in Arc G.
 *
 * EVIDENCE ACCOUNTING:
 *   produce_an_extended_structured_explanation (required, independent:3) —
 *     1 independent in EP1, 1 independent+transfer in EP5; 3rd lands in Arc
 *     G (reuseMatrix's ONLY later mark — R at sustained_interaction).
 *   use_cohesive_devices_across_a_turn (required, independent:3) — 1
 *     independent in EP2, 1 independent+transfer in EP5; 3rd lands in Arc G
 *     (see honest note above — its only later mark).
 *   self_correct_without_losing_the_thread (required, independent:3) — 1
 *     independent in EP3, 1 independent+transfer in EP5; 3rd lands in Arc G
 *     (reuseMatrix's only later mark).
 *   open_and_close_an_extended_turn (should, independent:2) — 1 independent
 *     in EP4, 1 independent+transfer in EP5. Fully satisfied within this arc.
 */

const EXPLAIN_01 = {
  id: 'c1_extended_structured_discourse_explain',
  arc: 'extended_structured_discourse',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep21Title',
  goalKey: 'c1ep21Goal',
  canDoId: 'produce_an_extended_structured_explanation',
  canDoNameKey: 'c1ep21CanDoName',
  durationKey: 'c1ep21Duration',
  estimatedMinutes: 12,
  xp: 105,
  prerequisites: ['c1_nuance_and_implication_integrated'],
  skillPrerequisites: ['develop_a_structured_argument'],
  gardenItems: ['cohesive_connector_pattern', 'so_basically_what_happened_is', 'the_first_thing_to_say_is', 'as_a_result_of_that'],
  reuseSkills: ['develop_a_structured_argument'],
  discourseCoherence: { checked: true, graduationRelevance: 'required' },
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep21RecallInstruction', evalKind: 'state_structured_argument', canDoId: 'develop_a_structured_argument', itemIds: ['emphatic_cleft_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep21SceneTitle', bodyKey: 'c1ep21SceneBody', showGoal: true, ctaKey: 'c1ep21Start' },
    {
      type: 'model',
      target: "So, basically, what happened is the delivery got rescheduled twice — first to Wednesday, then to Friday. As a result of that, I had to rearrange my whole week. That's the situation, in a nutshell.",
      meaningItems: ['so_basically_what_happened_is', 'as_a_result_of_that', 'cohesive_connector_pattern'], explainKey: 'c1ep21ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep21ComprehensionInstruction',
      target: 'First it was Wednesday. Then it was Friday. I rearranged my week.',
      itemId: 'cohesive_connector_pattern',
      options: [{ key: 'c1ep21CompOptCorrect', correct: true }, { key: 'c1ep21CompOptWrong1' }, { key: 'c1ep21CompOptWrong2' }],
      explainKey: 'c1ep21ComprehensionExplain',
    },
    {
      type: 'choice', instructionKey: 'c1ep21FlatListInstruction',
      target: 'The meeting got moved. The client was unhappy. We fixed it eventually.',
      itemId: 'cohesive_connector_pattern',
      options: [{ key: 'c1ep21FlatListOptCorrect', correct: true }, { key: 'c1ep21FlatListOptWrong1' }, { key: 'c1ep21FlatListOptWrong2' }],
      explainKey: 'c1ep21FlatListExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "So what happened with the scheduling mix-up at work last week? Give me the whole story, organized — a beginning, what happened, and how it ended.",
      instructionKey: 'c1ep21AssistedInstruction', evalKind: 'extended_explanation', canDoId: 'produce_an_extended_structured_explanation',
      suggestionEn: "So, basically, what happened is the room got double-booked. As a result of that, we had to move the whole meeting to a different floor. That's the situation, in a nutshell.",
      itemIds: ['so_basically_what_happened_is', 'as_a_result_of_that'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Describe, in a full organized account, how a process at your workplace or school actually works from start to finish.",
      instructionKey: 'c1ep21IndependentInstruction', evalKind: 'extended_explanation', canDoId: 'produce_an_extended_structured_explanation',
      itemIds: ['cohesive_connector_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c1ep21FinalInstruction', evalKind: 'extended_explanation', canDoId: 'produce_an_extended_structured_explanation', itemIds: ['cohesive_connector_pattern'] },
    { type: 'completion', canDoNameKey: 'c1ep21CanDoName', titleKey: 'c1ep21CloseTitle', bodyKey: 'c1ep21CloseBody', ctaKey: 'c1ep21CloseCta' },
  ],
}

const COHESION_02 = {
  id: 'c1_extended_structured_discourse_cohesion',
  arc: 'extended_structured_discourse',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep22Title',
  goalKey: 'c1ep22Goal',
  canDoId: 'use_cohesive_devices_across_a_turn',
  canDoNameKey: 'c1ep22CanDoName',
  durationKey: 'c1ep22Duration',
  estimatedMinutes: 11,
  xp: 100,
  prerequisites: ['c1_extended_structured_discourse_explain'],
  skillPrerequisites: ['produce_an_extended_structured_explanation'],
  gardenItems: ['however_c1', 'having_said_that_c1', 'on_top_of_that', 'in_this_respect', 'as_a_result_c1'],
  reuseSkills: ['produce_an_extended_structured_explanation', 'adapt_register_to_audience'],
  discourseCoherence: { checked: true, graduationRelevance: 'required' },
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep22RecallInstruction', evalKind: 'adapt_register', canDoId: 'adapt_register_to_audience', itemIds: ['register_pair_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep22SceneTitle', bodyKey: 'c1ep22SceneBody', ctaKey: 'c1ep22Start' },
    {
      type: 'model',
      target: "The project was late. However, the client stayed patient throughout. On top of that, the extra time actually improved the final result. In this respect, the delay wasn't all bad.",
      meaningItems: ['however_c1', 'on_top_of_that', 'in_this_respect'], explainKey: 'c1ep22ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep22ComprehensionInstruction',
      target: "The project was late. The client was unhappy. We apologized.",
      itemId: 'however_c1',
      options: [{ key: 'c1ep22CompOptCorrect', correct: true }, { key: 'c1ep22CompOptWrong1' }, { key: 'c1ep22CompOptWrong2' }],
      explainKey: 'c1ep22ComprehensionExplain',
    },
    {
      type: 'choice', instructionKey: 'c1ep22ContradictoryInstruction',
      target: "The budget was approved. As a result, the budget was actually rejected the same week.",
      itemId: 'as_a_result_c1',
      options: [{ key: 'c1ep22ContradictoryOptCorrect', correct: true }, { key: 'c1ep22ContradictoryOptWrong1' }, { key: 'c1ep22ContradictoryOptWrong2' }],
      explainKey: 'c1ep22ContradictoryExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Tell me, in one linked account with connecting words, how your team handled a recent setback at work or school — link at least three sentences together.",
      instructionKey: 'c1ep22AssistedInstruction', evalKind: 'extended_explanation', canDoId: 'use_cohesive_devices_across_a_turn',
      suggestionEn: "The launch was delayed by a week. However, that gave the team time to fix a bug we'd have missed otherwise. On top of that, the extra testing actually improved user reviews.",
      itemIds: ['however_c1', 'on_top_of_that'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Explain, in one linked account, why a plan you were part of changed partway through — connect your sentences, don't just list them.",
      instructionKey: 'c1ep22IndependentInstruction', evalKind: 'extended_explanation', canDoId: 'use_cohesive_devices_across_a_turn',
      itemIds: ['however_c1', 'as_a_result_c1'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c1ep22FinalInstruction', evalKind: 'extended_explanation', canDoId: 'use_cohesive_devices_across_a_turn', itemIds: ['having_said_that_c1'] },
    { type: 'completion', canDoNameKey: 'c1ep22CanDoName', titleKey: 'c1ep22CloseTitle', bodyKey: 'c1ep22CloseBody', ctaKey: 'c1ep21CloseCta' },
  ],
}

const SELFCORRECT_03 = {
  id: 'c1_extended_structured_discourse_selfcorrect',
  arc: 'extended_structured_discourse',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep23Title',
  goalKey: 'c1ep23Goal',
  canDoId: 'self_correct_without_losing_the_thread',
  canDoNameKey: 'c1ep23CanDoName',
  durationKey: 'c1ep23Duration',
  estimatedMinutes: 10,
  xp: 95,
  prerequisites: ['c1_extended_structured_discourse_cohesion'],
  skillPrerequisites: ['use_cohesive_devices_across_a_turn'],
  gardenItems: ['self_repair_discourse_pattern', 'what_i_mean_is_c1', 'or_rather_c1', 'let_me_put_that_differently'],
  reuseSkills: ['use_cohesive_devices_across_a_turn'],
  discourseCoherence: { checked: true, graduationRelevance: 'required' },
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep23RecallInstruction', evalKind: 'extended_explanation', canDoId: 'use_cohesive_devices_across_a_turn', itemIds: ['however_c1'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep23SceneTitle', bodyKey: 'c1ep23SceneBody', ctaKey: 'c1ep23Start' },
    {
      type: 'model',
      target: "The meeting was moved to Tuesday — or rather, let me put that differently, it was moved to Thursday, Tuesday was the original date. What I mean is, the final date is Thursday.",
      meaningItems: ['or_rather_c1', 'let_me_put_that_differently', 'what_i_mean_is_c1'], explainKey: 'c1ep23ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep23ComprehensionInstruction',
      target: "So basically the delivery got rescheduled — or wait, actually, hold on, I don't — anyway, never mind.",
      itemId: 'or_rather_c1',
      options: [{ key: 'c1ep23CompOptCorrect', correct: true }, { key: 'c1ep23CompOptWrong1' }, { key: 'c1ep23CompOptWrong2' }],
      explainKey: 'c1ep23ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Tell me about a trip you're familiar with — but halfway through, you'll realize you got a detail wrong. Notice it, self-correct, and keep the explanation going without losing the thread.",
      instructionKey: 'c1ep23AssistedInstruction', evalKind: 'extended_explanation', canDoId: 'self_correct_without_losing_the_thread',
      suggestionEn: "We left on Saturday morning — or rather, let me put that differently, it was actually Sunday morning. What I mean is, we had one extra day than I first said, which is why we arrived a bit later than planned.",
      itemIds: ['or_rather_c1', 'let_me_put_that_differently'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Explain how a recipe or process you know works — deliberately correct yourself partway through on a detail, and keep going without losing the thread.",
      instructionKey: 'c1ep23IndependentInstruction', evalKind: 'extended_explanation', canDoId: 'self_correct_without_losing_the_thread',
      itemIds: ['what_i_mean_is_c1'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'c1ep23CanDoName', titleKey: 'c1ep23CloseTitle', bodyKey: 'c1ep23CloseBody', ctaKey: 'c1ep21CloseCta' },
  ],
}

const OPENCLOSE_04 = {
  id: 'c1_extended_structured_discourse_openclose',
  arc: 'extended_structured_discourse',
  level: 'C1',
  role: 'secondary',
  titleKey: 'c1ep24Title',
  goalKey: 'c1ep24Goal',
  canDoId: 'open_and_close_an_extended_turn',
  canDoNameKey: 'c1ep24CanDoName',
  durationKey: 'c1ep24Duration',
  estimatedMinutes: 8,
  xp: 80,
  prerequisites: ['c1_extended_structured_discourse_selfcorrect'],
  skillPrerequisites: ['produce_an_extended_structured_explanation'],
  gardenItems: ['so_to_start', 'to_wrap_up', 'thats_the_situation_in_a_nutshell'],
  reuseSkills: ['produce_an_extended_structured_explanation'],
  discourseCoherence: { checked: true, graduationRelevance: 'should-relevant-signal' },
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep24RecallInstruction', evalKind: 'extended_explanation', canDoId: 'produce_an_extended_structured_explanation', itemIds: ['cohesive_connector_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep24SceneTitle', bodyKey: 'c1ep24SceneBody', ctaKey: 'c1ep24Start' },
    {
      type: 'model',
      target: "So, to start, let me explain what happened with the move. [...] To wrap up, that's the situation, in a nutshell.",
      meaningItems: ['so_to_start', 'to_wrap_up', 'thats_the_situation_in_a_nutshell'], explainKey: 'c1ep24ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep24ComprehensionInstruction',
      target: 'The room got double-booked. We moved floors.',
      itemId: 'so_to_start',
      options: [{ key: 'c1ep24CompOptCorrect', correct: true }, { key: 'c1ep24CompOptWrong1' }, { key: 'c1ep24CompOptWrong2' }],
      explainKey: 'c1ep24ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Explain, with a clear opening and closing signal, how you ended up choosing your current job or course of study.",
      instructionKey: 'c1ep24AssistedInstruction', evalKind: 'extended_explanation', canDoId: 'open_and_close_an_extended_turn',
      suggestionEn: "So, to start, I actually applied on a whim. [...] To wrap up, that's basically how I ended up here.",
      itemIds: ['so_to_start', 'to_wrap_up'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Explain, framed clearly at the start and the end, how a recent minor disaster in your day unfolded.",
      instructionKey: 'c1ep24IndependentInstruction', evalKind: 'extended_explanation', canDoId: 'open_and_close_an_extended_turn',
      itemIds: ['thats_the_situation_in_a_nutshell'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'c1ep24CanDoName', titleKey: 'c1ep24CloseTitle', bodyKey: 'c1ep24CloseBody', ctaKey: 'c1ep21CloseCta' },
  ],
}

const INTEGRATED_05 = {
  id: 'c1_extended_structured_discourse_integrated',
  arc: 'extended_structured_discourse',
  level: 'C1',
  role: 'integrated',
  titleKey: 'c1ep25Title',
  goalKey: 'c1ep25Goal',
  canDoId: 'produce_an_extended_structured_explanation',
  canDoNameKey: 'c1ep25CanDoName',
  durationKey: 'c1ep25Duration',
  estimatedMinutes: 13,
  xp: 120,
  prerequisites: ['c1_extended_structured_discourse_openclose'],
  skillPrerequisites: ['produce_an_extended_structured_explanation', 'use_cohesive_devices_across_a_turn', 'self_correct_without_losing_the_thread', 'open_and_close_an_extended_turn'],
  gardenItems: [],
  reuseSkills: ['produce_an_extended_structured_explanation', 'use_cohesive_devices_across_a_turn', 'self_correct_without_losing_the_thread', 'open_and_close_an_extended_turn', 'develop_a_structured_argument'],
  discourseCoherence: { checked: true, graduationRelevance: 'required' },
  /*
   * Transfer topic: explaining how a community garden plot rotation works —
   * never used in EP1-EP4 (whose topics were a scheduling mix-up, a project
   * delay, a trip, and a job/course choice).
   */
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'c1ep25SceneTitle', bodyKey: 'c1ep25SceneBody', showGoal: true, ctaKey: 'c1ep25Start' },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "So, how does the plot rotation actually work at the community garden? Walk me through it, start to finish, with a clear opening.",
      instructionKey: 'c1ep25ExplainInstruction', evalKind: 'extended_explanation', canDoId: 'produce_an_extended_structured_explanation',
      itemIds: ['so_basically_what_happened_is'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Now link a few more details together with connectors — what happens if someone doesn't tend their plot for a month?",
      instructionKey: 'c1ep25CohesionInstruction', evalKind: 'extended_explanation', canDoId: 'use_cohesive_devices_across_a_turn',
      itemIds: ['however_c1', 'as_a_result_c1'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Oh wait, actually, I think I mixed up the rule about the month. Correct yourself mid-explanation and keep going.",
      instructionKey: 'c1ep25SelfCorrectInstruction', evalKind: 'extended_explanation', canDoId: 'self_correct_without_losing_the_thread',
      itemIds: ['or_rather_c1'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Now wrap the whole explanation up with a clear closing signal.",
      instructionKey: 'c1ep25CloseInstruction', evalKind: 'extended_explanation', canDoId: 'open_and_close_an_extended_turn',
      itemIds: ['to_wrap_up'], evidenceType: 'independent', transfer: true,
    },
    { type: 'recall', instructionKey: 'c1ep25FinalInstruction', evalKind: 'state_structured_argument', canDoId: 'develop_a_structured_argument', itemIds: ['emphatic_cleft_pattern'] },
    { type: 'completion', canDoNameKey: 'c1ep25CanDoName', titleKey: 'c1ep25CloseTitle', bodyKey: 'c1ep25CloseBody', ctaKey: 'c1ep21CloseCta' },
  ],
}

export const C1_ARC5 = [EXPLAIN_01, COHESION_02, SELFCORRECT_03, OPENCLOSE_04, INTEGRATED_05]
export const C1_ARC5_ID = 'extended_structured_discourse'
export const getC1Arc5Episode = (id) => C1_ARC5.find((ep) => ep.id === id) || null
