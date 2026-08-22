/*
 * B1 arc 4 — "somethings_wrong" (docs/curriculum/blueprints/b1.json, arc order 4).
 *
 * Four episodes teaching B1's three new problem-solving can-dos:
 *   escalate_and_resolve_a_problem — raise a problem clearly enough to be helped
 *   negotiate_a_solution           — negotiate past a first offer to a real solution
 *   express_frustration_politely (should) — a cooperative tone layer, not a
 *     separate speech act (b1.json intentStrategy.newSubtypesOnExistingIntents:
 *     `report_problem`'s `tone` subtype carries it, exactly like arc 1's
 *     `narrativeForm` and arc 2's plain intents)
 * and reinforcing A2's `report_a_problem`/`polite_request` plus B1's own
 * `describe_an_experience`/`agree_or_disagree` (the arc's `a2Reuse`/`b1Reuse`).
 *
 * RUNTIME-ONLY RENAME (LC-INT-001 integration): this arc's `evalKind` is
 * `escalate_problem`, not b1.json's own `report_problem` — A2's own,
 * different `report_problem` intent already occupies that dispatch string in
 * the shared `evaluateFree` switch. See `b1Map.js`'s `B1_CAN_DO_INTENT`
 * comment for the full account; the curricular intent (one B1 speech act,
 * two can-dos, a `tone` subtype) is unchanged.
 *
 * Self-contained for the same reason arcs 1-3 are — see arc 1's file header.
 * The new `problem` semantic type this arc needs is registered self-contained
 * in `../semanticSlots.js`'s `B1_NEW_SEMANTIC_TYPES` (already reconciled with
 * B2/C1 in `docs/curriculum/semantic-types.md`; `engine/semanticContext.js`
 * itself is out of this task's write scope — `LC-INT-001` merges it).
 *
 * MINI-STORY (b1.json arc 4 `miniStory.use: true`): implemented as ordinary
 * `scene`/`model` steps inside episode 4, the arc's integrated capstone —
 * same convention as arc 1's episode 3 and arc 3's episode 2.
 */

const ARC = 'somethings_wrong'
const LEVEL = 'B1'

const B1_EP1 = {
  id: 'somethings_not_right',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep11Title',
  goalKey: 'b1Ep11Goal',
  canDoId: 'escalate_and_resolve_a_problem',
  canDoNameKey: 'b1Ep11CanDoName',
  durationKey: 'b1Ep11Duration',
  estimatedMinutes: 9,
  xp: 85,
  prerequisites: [],
  // A2's own capability, per b1.json arcs[3].a2Reuse.
  skillPrerequisites: ['report_a_problem'],
  gardenItems: [
    'b1_theres_a_problem_with', 'b1_i_ordered_but_i_got', 'b1_problem_statement_pattern',
    'b1_its_supposed_to', 'b1_instead_of', 'b1_broken',
  ],
  reuseSkills: ['report_a_problem'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep11SceneTitle',
      sceneBodyKey: 'b1Ep11SceneBody',
    },
    {
      type: 'model',
      target: "There's a problem with my order. I ordered a chicken sandwich, but I got a cheese one.",
      meaningItems: ['b1_theres_a_problem_with', 'b1_i_ordered_but_i_got', 'b1_problem_statement_pattern'],
      explainKey: 'b1Ep11ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep11ComprehensionInstruction',
      target: 'Which sentence explains a problem clearly enough for someone else to help?',
      itemId: 'b1_problem_statement_pattern',
      options: [
        { key: 'b1Ep11CompOptCorrect', correct: true },
        { key: 'b1Ep11CompOptWrong1' },
        { key: 'b1Ep11CompOptWrong2' },
      ],
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep11BlankInstruction',
      before: '',
      after: ' my order. I ordered fish, but I got chicken.',
      expects: "There's a problem with",
      alternatives: ["There is a problem with"],
      itemId: 'b1_theres_a_problem_with',
      hintKey: 'b1Ep11BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "Tell me about a problem, {name} — something that's wrong and what you expected instead.",
      instructionKey: 'b1Ep11OpenInstruction',
      evalKind: 'escalate_problem',
      tone: 'neutral',
      suggestionEn: "There's a problem with my order. I ordered a chicken sandwich, but I got a cheese one.",
      itemIds: ['b1_theres_a_problem_with', 'b1_i_ordered_but_i_got', 'b1_problem_statement_pattern'],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Now a different problem — something delivered broken or missing. No help this time.',
      instructionKey: 'b1Ep11OpenInstruction2',
      evalKind: 'escalate_problem',
      tone: 'neutral',
      // no suggestionEn: this arc's evidenceTarget "two unaided problem
      // statements"
      itemIds: ['b1_its_supposed_to', 'b1_instead_of', 'b1_broken'],
    },
  ],
}

const B1_EP2 = {
  id: 'lets_sort_this_out',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep12Title',
  goalKey: 'b1Ep12Goal',
  canDoId: 'negotiate_a_solution',
  canDoNameKey: 'b1Ep12CanDoName',
  durationKey: 'b1Ep12Duration',
  estimatedMinutes: 9,
  xp: 90,
  prerequisites: ['somethings_not_right'],
  skillPrerequisites: ['polite_request'],
  gardenItems: [
    'b1_would_it_be_possible', 'b1_could_i_possibly', 'b1_negotiate_pattern',
    'b1_instead', 'b1_a_replacement', 'b1_a_refund',
  ],
  reuseSkills: ['escalate_and_resolve_a_problem'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep12SceneTitle',
      sceneBodyKey: 'b1Ep12SceneBody',
    },
    {
      type: 'model',
      target: 'Would it be possible to get a replacement instead? Or could I possibly exchange this for a different one?',
      meaningItems: ['b1_would_it_be_possible', 'b1_could_i_possibly', 'b1_negotiate_pattern'],
      explainKey: 'b1Ep12ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep12ComprehensionInstruction',
      target: 'Which sentence politely negotiates a solution, rather than just demanding one?',
      itemId: 'b1_negotiate_pattern',
      options: [
        { key: 'b1Ep12CompOptCorrect', correct: true },
        { key: 'b1Ep12CompOptWrong1' },
        { key: 'b1Ep12CompOptWrong2' },
      ],
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep12BlankInstruction',
      before: '',
      after: ' possible to exchange this for a different size?',
      expects: 'Would it be',
      alternatives: [],
      itemId: 'b1_would_it_be_possible',
      hintKey: 'b1Ep12BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Ask for a solution to a problem, {name} — a replacement, a refund, or anything else that would help.',
      instructionKey: 'b1Ep12OpenInstruction',
      evalKind: 'negotiate_solution',
      suggestionEn: 'Would it be possible to get a replacement instead?',
      itemIds: ['b1_would_it_be_possible', 'b1_negotiate_pattern', 'b1_a_replacement'],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "Now negotiate a different solution — no help this time.",
      instructionKey: 'b1Ep12OpenInstruction2',
      evalKind: 'negotiate_solution',
      // no suggestionEn: autonomyTarget "late: the suggestion is withheld on
      // the arc's integrated negotiation episode"
      itemIds: ['b1_could_i_possibly', 'b1_instead', 'b1_a_refund'],
    },
  ],
}

const B1_EP3 = {
  id: 'staying_calm',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep13Title',
  goalKey: 'b1Ep13Goal',
  canDoId: 'express_frustration_politely',
  canDoNameKey: 'b1Ep13CanDoName',
  durationKey: 'b1Ep13Duration',
  estimatedMinutes: 7,
  xp: 80,
  prerequisites: ['somethings_not_right'],
  skillPrerequisites: [],
  gardenItems: ['b1_this_isnt_ideal', 'b1_i_understand_but', 'b1_polite_frustration_pattern'],
  reuseSkills: ['escalate_and_resolve_a_problem'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep13SceneTitle',
      sceneBodyKey: 'b1Ep13SceneBody',
    },
    {
      type: 'model',
      target: "This isn't ideal — I ordered this three days ago, but I understand these things happen. Could we sort it out?",
      meaningItems: ['b1_this_isnt_ideal', 'b1_i_understand_but', 'b1_polite_frustration_pattern'],
      explainKey: 'b1Ep13ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep13ComprehensionInstruction',
      target: 'Which response shows frustration while staying cooperative?',
      itemId: 'b1_polite_frustration_pattern',
      options: [
        { key: 'b1Ep13CompOptCorrect', correct: true },
        { key: 'b1Ep13CompOptWrong1' },
        { key: 'b1Ep13CompOptWrong2' },
      ],
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep13BlankInstruction',
      before: '',
      after: ', but I understand these things happen.',
      expects: "This isn't ideal",
      alternatives: ['This is not ideal'],
      itemId: 'b1_this_isnt_ideal',
      hintKey: 'b1Ep13BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "This is the second time this has happened, {name}. Tell me how you feel about it — politely.",
      instructionKey: 'b1Ep13OpenInstruction',
      evalKind: 'escalate_problem',
      tone: 'frustrated',
      suggestionEn: "This isn't ideal — I ordered this three days ago, but I understand these things happen.",
      itemIds: ['b1_this_isnt_ideal', 'b1_polite_frustration_pattern'],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'One more time — a different delay. Show you are a little frustrated, but stay cooperative. No help this time.',
      instructionKey: 'b1Ep13OpenInstruction2',
      evalKind: 'escalate_problem',
      tone: 'frustrated',
      // no suggestionEn: this arc's evidenceTarget "one unaided use of a
      // frustration phrase that stays cooperative"
      itemIds: ['b1_i_understand_but'],
    },
  ],
}

const B1_EP4 = {
  id: 'problem_solved',
  arc: ARC,
  level: LEVEL,
  role: 'reinforcement',
  reinforces: true,
  titleKey: 'b1Ep14Title',
  goalKey: 'b1Ep14Goal',
  canDoId: 'negotiate_a_solution',
  canDoNameKey: 'b1Ep14CanDoName',
  durationKey: 'b1Ep14Duration',
  estimatedMinutes: 10,
  xp: 100,
  prerequisites: ['somethings_not_right', 'lets_sort_this_out'],
  skillPrerequisites: [],
  gardenItems: [],
  // integrated mini-story: raise a problem, negotiate a solution, and stay
  // polite under a delay — one whole transaction, per b1.json arc 4's
  // evidenceTarget "one whole negotiation held unaided"
  reuseSkills: ['escalate_and_resolve_a_problem', 'negotiate_a_solution', 'express_frustration_politely'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep14SceneTitle',
      sceneBodyKey: 'b1Ep14SceneBody',
    },
    {
      // mini-story, told as ordinary model steps (see file header)
      type: 'model',
      target: "There's a problem with my hotel booking. I booked a double room, but I got a single one. Would it be possible to move to a double room? This isn't ideal, but I understand it can happen — thank you for sorting it out.",
      meaningItems: ['b1_theres_a_problem_with', 'b1_would_it_be_possible', 'b1_this_isnt_ideal'],
      explainKey: 'b1Ep14ModelExplain',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Your turn: raise a problem of your own, from start to finish — what went wrong, and what solution you want. No help this time.',
      instructionKey: 'b1Ep14OpenInstruction',
      evalKind: 'escalate_problem',
      tone: 'neutral',
      itemIds: ['b1_theres_a_problem_with', 'b1_problem_statement_pattern'],
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep14ComprehensionInstruction',
      target: 'What should come right after you raise a problem, to actually resolve it?',
      itemId: 'b1_negotiate_pattern',
      options: [
        { key: 'b1Ep14CompOptCorrect', correct: true },
        { key: 'b1Ep14CompOptWrong1' },
        { key: 'b1Ep14CompOptWrong2' },
      ],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Now negotiate a solution to that same problem — completely on your own.',
      instructionKey: 'b1Ep14OpenInstruction2',
      evalKind: 'negotiate_solution',
      // capstone close, unaided by design (autonomyTarget: "late")
      itemIds: ['b1_negotiate_pattern', 'b1_a_replacement', 'b1_a_refund'],
    },
  ],
}

export const B1_ARC4 = [B1_EP1, B1_EP2, B1_EP3, B1_EP4]
export const B1_ARC4_ID = ARC
export const getB1Arc4Episode = (id) => B1_ARC4.find(ep => ep.id === id) || null
