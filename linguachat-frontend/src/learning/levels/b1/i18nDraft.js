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
