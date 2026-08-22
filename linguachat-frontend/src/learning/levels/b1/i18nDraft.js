/*
 * b1/i18nDraft — draft English copy for every key B1's episodes/evaluators
 * reference, keyed exactly like `src/i18n/translations.js`.
 *
 * `src/i18n/**` is out of this task's write scope (see the file header of
 * `episodes/b1Arc1.js`), so this is NOT a locale file the app loads — it is
 * this task's own source of truth for what English copy each key means, and
 * `scripts/foundry/b1/check-b1-arc1.mjs` asserts every key an arc step or
 * evaluator references resolves here, catching a typo'd key now instead of at
 * `LC-INT-001` merge time. `LC-INT-001` copies these into `translations.js`
 * (English) and originates the other seven locale files' translations from
 * them, exactly as A1's own keys were added.
 *
 * Grows one arc at a time.
 */
export const B1_ARC1_COPY = {
  // episode 1 — one_thing_after_another
  b1Ep1Title: 'One Thing After Another',
  b1Ep1Goal: 'Tell a story that connects, one step to the next.',
  b1Ep1CanDoName: 'Tell a connected story',
  b1Ep1Duration: '9 min',
  b1Ep1SceneTitle: 'Not just facts — a story',
  b1Ep1SceneBody: "You already know how to say what you did. Today, let's connect it: first this, then that.",
  b1Ep1ModelExplain: '"First", "then", "after that" and "finally" put events in order for your listener.',
  b1Ep1ComprehensionInstruction: 'Which sentence correctly continues a story, in order?',
  b1Ep1CompOptCorrect: 'Then I had breakfast.',
  b1Ep1CompOptWrong1: 'I have breakfast every day.',
  b1Ep1CompOptWrong2: 'Breakfast is my favorite meal.',
  b1Ep1OrderInstruction: 'Put the words in order.',
  b1Ep1OrderHint: 'The connector comes first, then a comma.',
  b1Ep1BlankInstruction: 'Complete the story with the right connector.',
  b1Ep1BlankHint: 'It comes right after "first".',
  b1Ep1OpenInstruction: 'Tell your story using at least two connectors.',

  // episode 2 — when_it_happened
  b1Ep2Title: 'When It Happened',
  b1Ep2Goal: 'Say what was happening when something else happened.',
  b1Ep2CanDoName: 'Describe an interrupted action',
  b1Ep2Duration: '10 min',
  b1Ep2SceneTitle: 'Right in the middle of something',
  b1Ep2SceneBody: 'Some stories need two things happening at once — one going on, and one that breaks in.',
  b1Ep2ModelExplain: '"Was/were + -ing" is something already in progress; "when/while" connects it to what interrupted it.',
  b1Ep2ComprehensionInstruction: 'Which sentence describes something already happening when something else happened?',
  b1Ep2CompOptCorrect: 'I was walking home when it started to rain.',
  b1Ep2CompOptWrong1: 'I walked home and then it rained.',
  b1Ep2CompOptWrong2: 'It rains a lot in my city.',
  b1Ep2OrderInstruction: 'Put the words in order.',
  b1Ep2OrderHint: '"Was/were" comes right after the subject.',
  b1Ep2BlankInstruction: 'Complete the sentence.',
  b1Ep2BlankHint: 'One word: the past continuous of "be" for "I".',
  b1Ep2OpenInstruction: 'What was happening when something surprising happened?',
  b1Ep2OpenInstruction2: 'Now a different moment — no model this time, just your own words.',

  // episode 3 — the_whole_story
  b1Ep3Title: 'The Whole Story',
  b1Ep3Goal: 'Tell a longer story that connects events and includes an interruption.',
  b1Ep3CanDoName: 'Tell a complete story',
  b1Ep3Duration: '9 min',
  b1Ep3SceneTitle: 'Put it all together',
  b1Ep3SceneBody: "One more story — this time, use everything: a sequence, and a moment when something else happened.",
  b1Ep3OpenInstruction: 'Tell a story using connectors, and include one interruption.',
  b1Ep3ComprehensionInstruction: 'In a good story, where does an interruption usually fit?',
  b1Ep3CompOptCorrect: 'In the middle of something else that was already happening',
  b1Ep3CompOptWrong1: 'Always at the very beginning',
  b1Ep3CompOptWrong2: 'It never fits in a story',
  b1Ep3OpenInstruction2: 'One more time, completely on your own — no model shown.',

  // evaluator copy — narrate_past_event (sequence)
  b1RetryPromptSequenceEmpty: 'Tell me what happened — start with "First..."',
  b1RetryExplainSequenceTense: 'This already happened, so use the past: "I went", not "I go".',
  b1RetryPromptSequenceTense: 'Try again, in the past this time.',
  b1PraiseSequenceIndependent: "Great — that's a real connected story, in your own words.",
  b1PraiseSequenceHelped: 'Nice — you connected the events clearly.',
  b1RetryExplainSequenceMore: 'Good start — now add at least one more connector, like "then" or "after that".',
  b1RetryPromptSequenceMore: 'Add another step to your story.',
  b1RetryExplainSequenceConnector: 'You told me what happened, but not the order — try "first... then...".',
  b1RetryPromptSequenceConnector: 'Use a connector to show the order.',

  // evaluator copy — narrate_past_event (interruption)
  b1RetryPromptInterruptionEmpty: 'Tell me what was happening when it happened.',
  b1PraiseInterruptionIndependent: "Perfect — you showed exactly what was going on when it happened.",
  b1PraiseInterruptionHelped: 'Good — that shows the two actions clearly.',
  b1RetryExplainInterruptionConnector: 'Good use of "was/were" — now connect it with "when" or "while".',
  b1RetryPromptInterruptionConnector: 'Add "when" or "while" to connect the two actions.',
  b1RetryExplainInterruptionForm: 'For an ongoing action, use "was/were" + "-ing": "I was cooking when...".',
  b1RetryPromptInterruptionForm: 'Try describing what was already happening.',
}

export const B1_ARC2_COPY = {
  // episode 4 — what_i_think
  b1Ep4Title: 'What I Think',
  b1Ep4Goal: 'State an opinion and give a reason for it.',
  b1Ep4CanDoName: 'Give an opinion',
  b1Ep4Duration: '8 min',
  b1Ep4SceneTitle: 'Not just facts — your view',
  b1Ep4SceneBody: "You already know how to give a reason for an opinion about yourself. Now let's use that for opinions about anything.",
  b1Ep4ModelExplain: '"I think that" and "in my opinion" introduce a view; "because" gives the reason behind it.',
  b1Ep4ComprehensionInstruction: 'Which sentence gives an opinion, not just a fact?',
  b1Ep4CompOptCorrect: 'I think that weekend trips are a great idea.',
  b1Ep4CompOptWrong1: 'The train leaves at nine.',
  b1Ep4CompOptWrong2: 'Weekend trips usually last two days.',
  b1Ep4BlankInstruction: 'Complete the sentence with an opinion frame.',
  b1Ep4BlankHint: 'Three words, then the rest of the sentence.',
  b1Ep4OpenInstruction: 'Give your opinion and a reason.',
  b1Ep4OpenInstruction2: 'Now a different topic — no model this time, just your own words.',

  // episode 5 — agree_to_disagree
  b1Ep5Title: 'Agree to Disagree',
  b1Ep5Goal: "Agree or disagree with someone else's opinion, politely, with a reason.",
  b1Ep5CanDoName: 'Agree or disagree',
  b1Ep5Duration: '9 min',
  b1Ep5SceneTitle: 'A real exchange',
  b1Ep5SceneBody: "An opinion nobody can respond to is just a monologue. Let's make it a conversation.",
  b1Ep5ModelExplain: '"I agree" or "I don\'t think so" always come with a reason, the same way your own opinions do.',
  b1Ep5ComprehensionInstruction: 'Which reply politely disagrees, with a reason?',
  b1Ep5CompOptCorrect: "I don't think so, because I prefer to go at my own pace.",
  b1Ep5CompOptWrong1: 'Team sports have eleven players.',
  b1Ep5CompOptWrong2: 'No.',
  b1Ep5BlankInstruction: 'Complete the sentence.',
  b1Ep5BlankHint: 'Two words that show you share the opinion.',
  b1Ep5OpenInstruction: 'Say whether you agree or disagree, and why.',
  b1Ep5OpenInstruction2: 'One more — a different opinion, no model this time.',

  // episode 6 — having_a_real_exchange
  b1Ep6Title: 'Having a Real Exchange',
  b1Ep6Goal: 'Give an opinion, then respond to someone else\'s, in one exchange.',
  b1Ep6CanDoName: 'Hold an opinion exchange',
  b1Ep6Duration: '8 min',
  b1Ep6SceneTitle: 'Put it all together',
  b1Ep6SceneBody: "One more exchange — this time, give your own opinion and then respond to someone else's.",
  b1Ep6OpenInstruction: 'Give your opinion and a reason.',
  b1Ep6ComprehensionInstruction: 'When someone disagrees politely, what do they always add?',
  b1Ep6CompOptCorrect: 'A reason for their view',
  b1Ep6CompOptWrong1: 'Nothing — just "no"',
  b1Ep6CompOptWrong2: 'A question back',
  b1Ep6OpenInstruction2: 'Now agree or disagree, completely on your own — no model shown.',

  // evaluator copy — state_opinion
  b1RetryPromptOpinionEmpty: 'Tell me what you think — start with "I think that..."',
  b1PraiseOpinionIndependent: "Great — that's a real opinion, with your own reason.",
  b1PraiseOpinionHelped: 'Nice — you stated an opinion and gave a reason.',
  b1RetryExplainOpinionReason: 'Good opinion — now add "because" and say why.',
  b1RetryPromptOpinionReason: 'Add a reason with "because".',
  b1RetryExplainOpinionFrame: 'You gave a reason, but not the opinion itself — try "I think that... because...".',
  b1RetryPromptOpinionFrame: 'Start with "I think that" or "in my opinion".',

  // evaluator copy — agree_or_disagree
  b1RetryPromptAgreeEmpty: 'Tell me if you agree or disagree, and why.',
  b1PraiseAgreeIndependent: "Perfect — you took a clear position, with a reason.",
  b1PraiseAgreeHelped: 'Good — that shows agreement or disagreement clearly.',
  b1RetryExplainAgreeReason: 'Good — now add "because" and say why.',
  b1RetryPromptAgreeReason: 'Add a reason with "because".',
  b1RetryExplainAgreeStance: 'You gave a reason, but not whether you agree — try "I agree..." or "I don\'t think so...".',
  b1RetryPromptAgreeStance: 'Start with "I agree" or "I don\'t think so".',
}
