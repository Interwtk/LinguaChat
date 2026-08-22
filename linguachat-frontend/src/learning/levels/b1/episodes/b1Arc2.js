/*
 * B1 arc 2 — "i_think_that" (docs/curriculum/blueprints/b1.json, arc order 2).
 *
 * Three episodes teaching B1's two new opinion can-dos:
 *   give_an_opinion    — state a simple opinion with a reason
 *   agree_or_disagree  — agree or disagree with someone else's opinion, politely, with a reason
 * and reinforcing A2's `express_an_opinion_with_a_reason` (the arc's `a2Reuse` entry).
 *
 * Self-contained for the same reason arc 1 is — see that file's header and
 * `docs/curriculum/implementation/b1/README.md`. No mini-story (b1.json arc 2
 * `miniStory.use: false` — a live two-way exchange of positions needs a
 * roleplay-shaped free exchange, not a narrated scene).
 */

const ARC = 'i_think_that'
const LEVEL = 'B1'

const B1_EP1 = {
  id: 'what_i_think',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep4Title',
  goalKey: 'b1Ep4Goal',
  canDoId: 'give_an_opinion',
  canDoNameKey: 'b1Ep4CanDoName',
  durationKey: 'b1Ep4Duration',
  estimatedMinutes: 8,
  xp: 80,
  prerequisites: [],
  // A2's own capability, per b1.json arcs[1].a2Reuse — expected id per
  // prerequisiteReconciliation.reconciliation.mapping.
  skillPrerequisites: ['express_an_opinion_with_a_reason'],
  gardenItems: [
    'b1_i_think_that', 'b1_in_my_opinion', 'b1_personally',
    'b1_opinion_frame_pattern', 'b1_because_reason_pattern',
  ],
  reuseSkills: ['express_an_opinion_with_a_reason'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep4SceneTitle',
      sceneBodyKey: 'b1Ep4SceneBody',
    },
    {
      type: 'model',
      target: 'I think that weekend trips are a great idea, because they help you relax. In my opinion, everyone needs a break sometimes.',
      meaningItems: ['b1_i_think_that', 'b1_in_my_opinion', 'b1_opinion_frame_pattern', 'b1_because_reason_pattern'],
      explainKey: 'b1Ep4ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep4ComprehensionInstruction',
      target: 'Which sentence gives an opinion, not just a fact?',
      itemId: 'b1_opinion_frame_pattern',
      options: [
        { key: 'b1Ep4CompOptCorrect', correct: true },
        { key: 'b1Ep4CompOptWrong1' },
        { key: 'b1Ep4CompOptWrong2' },
      ],
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep4BlankInstruction',
      before: '',
      after: ' the new café is fantastic, because the coffee is great.',
      expects: 'I think that',
      alternatives: ['I think', 'In my opinion,', 'Personally, I think'],
      itemId: 'b1_opinion_frame_pattern',
      hintKey: 'b1Ep4BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'What do you think about weekend trips, {name}? Tell me your opinion, and why.',
      instructionKey: 'b1Ep4OpenInstruction',
      evalKind: 'state_opinion',
      suggestionEn: 'I think that weekend trips are great, because they help you relax.',
      itemIds: ['b1_i_think_that', 'b1_in_my_opinion', 'b1_opinion_frame_pattern', 'b1_because_reason_pattern'],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "What's your opinion about learning a new language as an adult? Why do you think that?",
      instructionKey: 'b1Ep4OpenInstruction2',
      evalKind: 'state_opinion',
      // no suggestionEn: this arc's second unaided opinion, per b1.json arc 2
      // evidenceTarget "two unaided opinions with reasons"
      itemIds: ['b1_personally', 'b1_opinion_frame_pattern', 'b1_because_reason_pattern'],
    },
  ],
}

const B1_EP2 = {
  id: 'agree_to_disagree',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep5Title',
  goalKey: 'b1Ep5Goal',
  canDoId: 'agree_or_disagree',
  canDoNameKey: 'b1Ep5CanDoName',
  durationKey: 'b1Ep5Duration',
  estimatedMinutes: 9,
  xp: 85,
  prerequisites: ['what_i_think'],
  skillPrerequisites: ['express_an_opinion_with_a_reason'],
  gardenItems: [
    'b1_i_agree', 'b1_i_dont_think_so', 'b1_youre_right',
    'b1_agree_disagree_pattern', 'b1_i_see_what_you_mean',
  ],
  reuseSkills: ['give_an_opinion'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep5SceneTitle',
      sceneBodyKey: 'b1Ep5SceneBody',
    },
    {
      type: 'model',
      target: "A: I think team sports are more fun than solo sports. B: I agree, because you meet more people. Or: B: I don't think so, because I prefer to go at my own pace.",
      meaningItems: ['b1_i_agree', 'b1_i_dont_think_so', 'b1_agree_disagree_pattern'],
      explainKey: 'b1Ep5ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep5ComprehensionInstruction',
      target: 'Which reply politely disagrees, with a reason?',
      itemId: 'b1_agree_disagree_pattern',
      options: [
        { key: 'b1Ep5CompOptCorrect', correct: true },
        { key: 'b1Ep5CompOptWrong1' },
        { key: 'b1Ep5CompOptWrong2' },
      ],
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep5BlankInstruction',
      before: '',
      after: ", because I've tried both and I like the company.",
      expects: 'I agree',
      alternatives: ['I think so too'],
      itemId: 'b1_i_agree',
      hintKey: 'b1Ep5BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "Someone says, 'City life is better than country life.' Do you agree, {name}? Why or why not?",
      instructionKey: 'b1Ep5OpenInstruction',
      evalKind: 'agree_or_disagree',
      suggestionEn: "I agree, because there's more to do in a city.",
      itemIds: ['b1_i_agree', 'b1_agree_disagree_pattern'],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "Someone says, 'Reading books is more useful than watching movies.' What do you think — agree or disagree, and say why.",
      instructionKey: 'b1Ep5OpenInstruction2',
      evalKind: 'agree_or_disagree',
      // no suggestionEn: this arc's second unaided moment (one agreement,
      // one disagreement — b1.json arc 2 evidenceTarget)
      itemIds: ['b1_i_dont_think_so', 'b1_youre_right', 'b1_i_see_what_you_mean'],
    },
  ],
}

const B1_EP3 = {
  id: 'having_a_real_exchange',
  arc: ARC,
  level: LEVEL,
  role: 'reinforcement',
  reinforces: true,
  titleKey: 'b1Ep6Title',
  goalKey: 'b1Ep6Goal',
  canDoId: 'agree_or_disagree',
  canDoNameKey: 'b1Ep6CanDoName',
  durationKey: 'b1Ep6Duration',
  estimatedMinutes: 8,
  xp: 90,
  prerequisites: ['what_i_think', 'agree_to_disagree'],
  skillPrerequisites: ['express_an_opinion_with_a_reason'],
  gardenItems: [],
  // combines both new can-dos in one exchange, per b1.json arc 2's shape
  // (no miniStory — roleplay-shaped free exchange instead)
  reuseSkills: ['give_an_opinion', 'agree_or_disagree'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep6SceneTitle',
      sceneBodyKey: 'b1Ep6SceneBody',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "What's your opinion about working from home instead of an office? Tell me what you think, and why.",
      instructionKey: 'b1Ep6OpenInstruction',
      evalKind: 'state_opinion',
      suggestionEn: 'I think that working from home is better, because you save time.',
      itemIds: ['b1_opinion_frame_pattern', 'b1_because_reason_pattern'],
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep6ComprehensionInstruction',
      target: 'When someone disagrees politely, what do they always add?',
      itemId: 'b1_agree_disagree_pattern',
      options: [
        { key: 'b1Ep6CompOptCorrect', correct: true },
        { key: 'b1Ep6CompOptWrong1' },
        { key: 'b1Ep6CompOptWrong2' },
      ],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "One more opinion: 'Everyone should learn to cook.' Do you agree or disagree, and why? No help this time.",
      instructionKey: 'b1Ep6OpenInstruction2',
      evalKind: 'agree_or_disagree',
      // capstone close, unaided by design (b1.json arc 2 autonomyTarget:
      // "support fades quickly")
      itemIds: ['b1_i_agree', 'b1_i_dont_think_so'],
    },
  ],
}

export const B1_ARC2 = [B1_EP1, B1_EP2, B1_EP3]
export const B1_ARC2_ID = ARC
export const getB1Arc2Episode = (id) => B1_ARC2.find(ep => ep.id === id) || null
