/*
 * B1 arc 5 — "looking_ahead" (docs/curriculum/blueprints/b1.json, arc order 5).
 *
 * Four episodes, one per new can-do — this arc has no separate reinforcement
 * episode (episodesInArc === newCanDos.length, unlike arcs 1/2/3/4):
 *   talk_about_plans_and_intentions — choose correctly between a spontaneous
 *     decision, a fixed plan, and a prediction (b1.json's stated "one
 *     genuine architectural risk": judged by function, not surface form)
 *   talk_about_hopes_and_ambitions  — a hope or ambition, no date attached
 *   talk_about_real_conditions (should) — a real, likely if-condition
 *   imagine_a_hypothetical (optional) — a fixed "if I were you" advice frame
 *
 * `state_future_intent`'s `intentForm` subtype (b1.json intentStrategy)
 * carries `talk_about_plans_and_intentions` vs `talk_about_hopes_and_ambitions`
 * at the can-do level; within `intentForm: 'will_going_to'` a second,
 * evaluator-only field `situationForm` (`decision`/`plan`/`prediction`)
 * carries the arc's real accuracy risk — the function the learner must
 * express, not a new can-do.
 *
 * No mini-story (b1.json arc 5 `miniStory.use: false` — "the value is in the
 * learner's own future, not a narrated scene about someone else's").
 * Self-contained for the same reason arcs 1-4 are — see arc 1's file header.
 */

const ARC = 'looking_ahead'
const LEVEL = 'B1'

const B1_EP1 = {
  id: 'whats_the_plan',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep15Title',
  goalKey: 'b1Ep15Goal',
  canDoId: 'talk_about_plans_and_intentions',
  canDoNameKey: 'b1Ep15CanDoName',
  durationKey: 'b1Ep15Duration',
  estimatedMinutes: 10,
  xp: 90,
  prerequisites: [],
  // A2's own capability, per b1.json arcs[4].a2Reuse.
  skillPrerequisites: ['talk_about_future_plans'],
  gardenItems: [
    'b1_ill', 'b1_im_going_to', 'b1_will_vs_going_to_pattern', 'b1_probably', 'b1_definitely',
  ],
  reuseSkills: ['talk_about_future_plans'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep15SceneTitle',
      sceneBodyKey: 'b1Ep15SceneBody',
    },
    {
      type: 'model',
      target: "I'll have the pasta, thanks — a decision made right now. I'm going to visit my sister next week — a plan made earlier. It will probably rain later — a prediction.",
      meaningItems: ['b1_ill', 'b1_im_going_to', 'b1_will_vs_going_to_pattern'],
      explainKey: 'b1Ep15ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep15ComprehensionInstruction',
      target: 'Which sentence is a plan decided before now, not a decision made this second?',
      itemId: 'b1_will_vs_going_to_pattern',
      options: [
        { key: 'b1Ep15CompOptCorrect', correct: true },
        { key: 'b1Ep15CompOptWrong1' },
        { key: 'b1Ep15CompOptWrong2' },
      ],
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep15BlankInstruction',
      before: 'The menu looks great — ',
      after: ' have the soup.',
      expects: "I'll",
      alternatives: ['I will'],
      itemId: 'b1_ill',
      hintKey: 'b1Ep15BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "We're deciding what to order right now, {name} — what will you have?",
      instructionKey: 'b1Ep15OpenInstruction',
      evalKind: 'state_future_intent',
      intentForm: 'will_going_to',
      situationForm: 'decision',
      // no suggestionEn: autonomyTarget "late: model answers withheld by
      // default, hints on request"
      itemIds: ['b1_ill', 'b1_will_vs_going_to_pattern'],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Now tell me about something you already decided to do next week — a real plan.',
      instructionKey: 'b1Ep15OpenInstruction2',
      evalKind: 'state_future_intent',
      intentForm: 'will_going_to',
      situationForm: 'plan',
      itemIds: ['b1_im_going_to', 'b1_will_vs_going_to_pattern'],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Last one: what do you think the weather will be like tomorrow?',
      instructionKey: 'b1Ep15OpenInstruction3',
      evalKind: 'state_future_intent',
      intentForm: 'will_going_to',
      situationForm: 'prediction',
      itemIds: ['b1_probably', 'b1_definitely'],
    },
  ],
}

const B1_EP2 = {
  id: 'someday',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep16Title',
  goalKey: 'b1Ep16Goal',
  canDoId: 'talk_about_hopes_and_ambitions',
  canDoNameKey: 'b1Ep16CanDoName',
  durationKey: 'b1Ep16Duration',
  estimatedMinutes: 8,
  xp: 85,
  prerequisites: ['talk_about_plans_and_intentions'],
  skillPrerequisites: [],
  gardenItems: ['b1_i_hope_to', 'b1_id_like_to', 'b1_one_day_ill', 'b1_hope_would_like_pattern', 'b1_my_dream_is_to'],
  reuseSkills: ['talk_about_plans_and_intentions'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep16SceneTitle',
      sceneBodyKey: 'b1Ep16SceneBody',
    },
    {
      type: 'model',
      target: 'I hope to travel more one day. One day, I\'ll learn to paint — that\'s always been my dream.',
      meaningItems: ['b1_i_hope_to', 'b1_one_day_ill', 'b1_hope_would_like_pattern'],
      explainKey: 'b1Ep16ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep16ComprehensionInstruction',
      target: 'Which sentence is a hope with no fixed date, not a plan for next week?',
      itemId: 'b1_hope_would_like_pattern',
      options: [
        { key: 'b1Ep16CompOptCorrect', correct: true },
        { key: 'b1Ep16CompOptWrong1' },
        { key: 'b1Ep16CompOptWrong2' },
      ],
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep16BlankInstruction',
      before: '',
      after: ' visit Japan one day.',
      expects: 'I hope to',
      alternatives: ["I'd like to"],
      itemId: 'b1_i_hope_to',
      hintKey: 'b1Ep16BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "What's something you hope to do one day, {name}?",
      instructionKey: 'b1Ep16OpenInstruction',
      evalKind: 'state_future_intent',
      intentForm: 'hope_would_like',
      situationForm: 'hope',
      itemIds: ['b1_i_hope_to', 'b1_hope_would_like_pattern'],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'A different hope now — something else you would like to do, someday.',
      instructionKey: 'b1Ep16OpenInstruction2',
      evalKind: 'state_future_intent',
      intentForm: 'hope_would_like',
      situationForm: 'hope',
      itemIds: ['b1_id_like_to', 'b1_my_dream_is_to'],
    },
  ],
}

const B1_EP3 = {
  id: 'if_that_happens',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep17Title',
  goalKey: 'b1Ep17Goal',
  canDoId: 'talk_about_real_conditions',
  canDoNameKey: 'b1Ep17CanDoName',
  durationKey: 'b1Ep17Duration',
  estimatedMinutes: 7,
  xp: 80,
  prerequisites: ['talk_about_plans_and_intentions'],
  skillPrerequisites: [],
  gardenItems: ['b1_if_present_will', 'b1_first_conditional_pattern', 'b1_unless', 'b1_as_soon_as'],
  reuseSkills: ['talk_about_plans_and_intentions'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep17SceneTitle',
      sceneBodyKey: 'b1Ep17SceneBody',
    },
    {
      type: 'model',
      target: "If it rains tomorrow, I'll stay home. If I finish early, I'll call you.",
      meaningItems: ['b1_if_present_will', 'b1_first_conditional_pattern'],
      explainKey: 'b1Ep17ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep17ComprehensionInstruction',
      target: 'Which sentence correctly says what will happen if a real condition is met?',
      itemId: 'b1_first_conditional_pattern',
      options: [
        { key: 'b1Ep17CompOptCorrect', correct: true },
        { key: 'b1Ep17CompOptWrong1' },
        { key: 'b1Ep17CompOptWrong2' },
      ],
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep17BlankInstruction',
      before: 'If I finish early, I ',
      after: ' call you.',
      expects: 'will',
      alternatives: ["'ll"],
      itemId: 'b1_if_present_will',
      hintKey: 'b1Ep17BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'What will you do if it rains this weekend?',
      instructionKey: 'b1Ep17OpenInstruction',
      evalKind: 'state_real_condition',
      // no suggestionEn: autonomyTarget "late" — withheld by default
      itemIds: ['b1_first_conditional_pattern', 'b1_unless'],
    },
  ],
}

const B1_EP4 = {
  id: 'if_i_were_you',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep18Title',
  goalKey: 'b1Ep18Goal',
  canDoId: 'imagine_a_hypothetical',
  canDoNameKey: 'b1Ep18CanDoName',
  durationKey: 'b1Ep18Duration',
  estimatedMinutes: 7,
  xp: 75,
  prerequisites: ['talk_about_real_conditions'],
  skillPrerequisites: [],
  gardenItems: ['b1_if_i_were_you', 'b1_if_i_were_pattern', 'b1_id_verb', 'b1_in_your_position'],
  reuseSkills: ['talk_about_real_conditions'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep18SceneTitle',
      sceneBodyKey: 'b1Ep18SceneBody',
    },
    {
      type: 'model',
      target: "If I were you, I'd ask for a refund. In your position, I'd wait a little longer.",
      meaningItems: ['b1_if_i_were_you', 'b1_if_i_were_pattern', 'b1_id_verb'],
      explainKey: 'b1Ep18ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep18ComprehensionInstruction',
      target: 'Which sentence gives hypothetical advice with "if I were you"?',
      itemId: 'b1_if_i_were_pattern',
      options: [
        { key: 'b1Ep18CompOptCorrect', correct: true },
        { key: 'b1Ep18CompOptWrong1' },
        { key: 'b1Ep18CompOptWrong2' },
      ],
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep18BlankInstruction',
      before: '',
      after: ", I'd ask for a refund.",
      expects: 'If I were you',
      alternatives: [],
      itemId: 'b1_if_i_were_you',
      hintKey: 'b1Ep18BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "A friend can't decide whether to change jobs, {name}. What would you tell them?",
      instructionKey: 'b1Ep18OpenInstruction',
      evalKind: 'state_hypothetical',
      // imagine_a_hypothetical always keeps a hint since it is optional
      // (b1.json arc 5 autonomyTarget)
      suggestionEn: "If I were you, I'd ask for more details before deciding.",
      itemIds: ['b1_if_i_were_you', 'b1_if_i_were_pattern', 'b1_id_verb'],
    },
  ],
}

export const B1_ARC5 = [B1_EP1, B1_EP2, B1_EP3, B1_EP4]
export const B1_ARC5_ID = ARC
export const getB1Arc5Episode = (id) => B1_ARC5.find(ep => ep.id === id) || null
