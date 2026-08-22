/*
 * B1 arc 6 — "keep_talking" (docs/curriculum/blueprints/b1.json, arc order 6).
 *
 * Three episodes, one per new can-do (episodesInArc === newCanDos.length,
 * same shape as arc 5):
 *   sustain_topic_change    — change the subject, or follow someone else's change
 *   ask_follow_up_questions — ask a genuine follow-up, not just answer and stop
 *   summarize_what_was_said (should) — briefly restate what someone else said
 *
 * b1.json arc 6's `risk` flags discourse-level evaluation as qualitatively
 * different — judging a topic change or follow-up needs the immediately
 * preceding partner turn. `core-engine-findings.md` §15.2 confirms (read-only
 * investigation) this context is already threaded through as `turnContext`;
 * these evaluators read `ctx.turnContext.linguaSaid` the same way every other
 * B1 evaluator reads an ordinary context field.
 *
 * No mini-story (b1.json arc 6 `miniStory.use: false` — "the conversation
 * itself is the content"). Self-contained for the same reason arcs 1-5 are —
 * see arc 1's file header.
 */

const ARC = 'keep_talking'
const LEVEL = 'B1'

const B1_EP1 = {
  id: 'changing_the_subject',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep19Title',
  goalKey: 'b1Ep19Goal',
  canDoId: 'sustain_topic_change',
  canDoNameKey: 'b1Ep19CanDoName',
  durationKey: 'b1Ep19Duration',
  estimatedMinutes: 9,
  xp: 90,
  prerequisites: [],
  // A2's own capability, per b1.json arcs[5].a2Reuse. Not every graduating A2
  // learner independently evidenced this should-have skill (LC-AUD-001 F4b,
  // cited directly in b1.json arc 6's `prerequisiteRisk`), so this episode's
  // model turn is a first-exposure bridge, not a withheld-because-known one.
  skillPrerequisites: ['keep_a_longer_conversation_going'],
  gardenItems: ['b1_by_the_way', 'b1_anyway', 'b1_speaking_of', 'b1_topic_change_pattern'],
  reuseSkills: ['keep_a_longer_conversation_going'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep19SceneTitle',
      sceneBodyKey: 'b1Ep19SceneBody',
    },
    {
      type: 'model',
      target: "That restaurant sounds great. Anyway, have you tried the new café downtown? By the way, I meant to ask — how's your sister doing?",
      meaningItems: ['b1_anyway', 'b1_by_the_way', 'b1_topic_change_pattern'],
      explainKey: 'b1Ep19ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep19ComprehensionInstruction',
      target: 'Which phrase politely changes the subject?',
      itemId: 'b1_topic_change_pattern',
      options: [
        { key: 'b1Ep19CompOptCorrect', correct: true },
        { key: 'b1Ep19CompOptWrong1' },
        { key: 'b1Ep19CompOptWrong2' },
      ],
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep19BlankInstruction',
      before: 'That was a great film. ',
      after: ', have you decided what to do this weekend?',
      expects: 'Anyway',
      alternatives: ['By the way'],
      itemId: 'b1_anyway',
      hintKey: 'b1Ep19BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      linguaSaid: "I finally finished reading that book I told you about last week.",
      promptEn: "I finally finished reading that book I told you about last week, {name}. Anyway, change the subject to something else you'd like to talk about.",
      instructionKey: 'b1Ep19OpenInstruction',
      evalKind: 'change_topic',
      role: 'initiate',
      // no suggestionEn: autonomyTarget "late: unaided by default across the
      // whole arc"
      itemIds: ['b1_by_the_way', 'b1_anyway', 'b1_speaking_of', 'b1_topic_change_pattern'],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      linguaSaid: "Anyway, speaking of travel — have you ever been outside your own country?",
      promptEn: "Anyway, speaking of travel — have you ever been outside your own country, {name}?",
      instructionKey: 'b1Ep19OpenInstruction2',
      evalKind: 'change_topic',
      role: 'follow',
      itemIds: ['b1_speaking_of'],
    },
  ],
}

const B1_EP2 = {
  id: 'tell_me_more',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep20Title',
  goalKey: 'b1Ep20Goal',
  canDoId: 'ask_follow_up_questions',
  canDoNameKey: 'b1Ep20CanDoName',
  durationKey: 'b1Ep20Duration',
  estimatedMinutes: 8,
  xp: 85,
  prerequisites: ['sustain_topic_change'],
  skillPrerequisites: [],
  gardenItems: ['b1_really', 'b1_why', 'b1_what_happened', 'b1_follow_up_question_pattern'],
  reuseSkills: ['sustain_topic_change'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep20SceneTitle',
      sceneBodyKey: 'b1Ep20SceneBody',
    },
    {
      type: 'model',
      target: "A: I got a new job last month. B: Really? What happened to the old one?",
      meaningItems: ['b1_really', 'b1_what_happened', 'b1_follow_up_question_pattern'],
      explainKey: 'b1Ep20ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep20ComprehensionInstruction',
      target: 'Which reply shows genuine interest with a real follow-up question?',
      itemId: 'b1_follow_up_question_pattern',
      options: [
        { key: 'b1Ep20CompOptCorrect', correct: true },
        { key: 'b1Ep20CompOptWrong1' },
        { key: 'b1Ep20CompOptWrong2' },
      ],
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep20BlankInstruction',
      before: '',
      after: '? What happened?',
      expects: 'Really',
      alternatives: [],
      itemId: 'b1_really',
      hintKey: 'b1Ep20BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      linguaSaid: "I moved to a new city last year.",
      promptEn: "I moved to a new city last year, {name}. Ask me a follow-up question about it.",
      instructionKey: 'b1Ep20OpenInstruction',
      evalKind: 'ask_follow_up',
      itemIds: ['b1_really', 'b1_why', 'b1_follow_up_question_pattern'],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      linguaSaid: "I started learning to cook properly a few months ago.",
      promptEn: "I started learning to cook properly a few months ago. Ask me something about that.",
      instructionKey: 'b1Ep20OpenInstruction2',
      evalKind: 'ask_follow_up',
      itemIds: ['b1_what_happened'],
    },
  ],
}

const B1_EP3 = {
  id: 'so_basically',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep21Title',
  goalKey: 'b1Ep21Goal',
  canDoId: 'summarize_what_was_said',
  canDoNameKey: 'b1Ep21CanDoName',
  durationKey: 'b1Ep21Duration',
  estimatedMinutes: 7,
  xp: 80,
  prerequisites: ['ask_follow_up_questions'],
  skillPrerequisites: [],
  gardenItems: ['b1_so_basically', 'b1_what_youre_saying_is', 'b1_summarize_pattern', 'b1_in_other_words'],
  reuseSkills: ['ask_follow_up_questions'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep21SceneTitle',
      sceneBodyKey: 'b1Ep21SceneBody',
    },
    {
      type: 'model',
      target: "So basically, you're saying the flight got delayed, and now you'll miss the connection.",
      meaningItems: ['b1_so_basically', 'b1_what_youre_saying_is', 'b1_summarize_pattern'],
      explainKey: 'b1Ep21ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep21ComprehensionInstruction',
      target: 'Which sentence briefly restates what someone else said?',
      itemId: 'b1_summarize_pattern',
      options: [
        { key: 'b1Ep21CompOptCorrect', correct: true },
        { key: 'b1Ep21CompOptWrong1' },
        { key: 'b1Ep21CompOptWrong2' },
      ],
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep21BlankInstruction',
      before: '',
      after: " you'd like a refund, not a replacement.",
      expects: "So basically",
      alternatives: ["What you're saying is"],
      itemId: 'b1_so_basically',
      hintKey: 'b1Ep21BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      linguaSaid: "I applied for a new job two weeks ago. I had the interview yesterday, and they said they'll call me back by Friday.",
      promptEn: "I applied for a new job two weeks ago. I had the interview yesterday, and they said they'll call me back by Friday, {name}. Can you summarize what I just told you?",
      instructionKey: 'b1Ep21OpenInstruction',
      evalKind: 'summarize_other',
      // no suggestionEn: autonomyTarget "late: unaided by default across the
      // whole arc"
      itemIds: ['b1_so_basically', 'b1_what_youre_saying_is', 'b1_summarize_pattern', 'b1_in_other_words'],
    },
  ],
}

export const B1_ARC6 = [B1_EP1, B1_EP2, B1_EP3]
export const B1_ARC6_ID = ARC
export const getB1Arc6Episode = (id) => B1_ARC6.find(ep => ep.id === id) || null
