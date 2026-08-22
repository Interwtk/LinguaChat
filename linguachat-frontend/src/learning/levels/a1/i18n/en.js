/*
 * A1 arc 6/7 — draft English i18n key set.
 *
 * `src/i18n/**` (the base dictionary + all seven other locales) is shared,
 * out-of-scope infrastructure owned by `LC-INT-001` per `.ai/foundry/
 * tasks.json`. This file is the complete draft English value for every key
 * `levels/a1/episodes/*.json` references — a finished sentence, not a
 * placeholder — mirroring `levels/a2/i18n/en.js`'s own pattern. Merging these
 * into the base dictionary and translating them into the other seven locales
 * is `LC-INT-001`'s work; see `docs/curriculum/implementation/a1/
 * core-requirements.md`.
 *
 * `ep1BuildHint` and `ep1CloseCta` are shared Pre-A1/A1 keys that already
 * exist in `src/i18n/translations.js` — included here too, with the same
 * values, so this file is a complete, self-contained reference for every key
 * these two arcs touch, matching arc 1-5's own reuse of them.
 */
export const A1_ARC6_ARC7_I18N_EN = {
  /* shared, already-shipped keys these arcs reuse */
  ep1BuildHint: 'Tap the words to build the sentence.',
  ep1CloseCta: 'Finish',

  /* ---- episode 34 — "I can, I can't" ---- */
  ep34Title: "I can, I can't",
  ep34Goal: "Say what you can and can't do.",
  ep34CanDoName: 'Say what you can do',
  ep34Duration: '9 min',
  ep34SceneTitle: 'An invitation',
  ep34SceneBody: 'Someone invites you to do something. Can you say yes — or no — honestly?',
  ep34Start: 'Start',
  ep34RecallInstruction: 'Remember: what do you like?',
  ep34ModelExplain: '"I can" says what you are able to do. "I can\'t" says what you are not able to do.',
  ep34ComprehensionInstruction: 'What is Lingua saying?',
  ep34CompOptCorrect: 'I can drive.',
  ep34CompOptWrong1: 'I like driving.',
  ep34CompOptWrong2: 'I want to drive.',
  ep34BuildInstruction: 'Build the sentence.',
  ep34ChoiceInstruction: "What can you do? Choose one that's true for you.",
  ep34PositiveInstruction: "Answer with 'I can'.",
  ep34MeaningInstruction: "Lingua is looking for a word. Ask what it means.",
  ep34NegativeInstruction: "Answer honestly, using 'I can't'.",
  ep34FinalInstruction: 'Say something you can do.',
  ep34CloseTitle: 'Well done!',
  ep34CloseBody: "You can say what you can and can't do.",

  /* ---- episode 35 — "Can you?" ---- */
  ep35Title: 'Can you?',
  ep35Goal: "Ask somebody what they can do, and ask for a word you don't know.",
  ep35CanDoName: 'Ask about ability',
  ep35Duration: '9 min',
  ep35SceneTitle: 'Finding out',
  ep35SceneBody: 'You want to know what somebody else can do.',
  ep35Start: 'Start',
  ep35RecallInstruction: 'Remember: say something you can do.',
  ep35ModelExplain: '"Can you...?" asks about someone\'s ability. The short answer is "Yes, I can" or "No, I can\'t."',
  ep35DisambiguationInstruction: 'Choose the one asking about ability, not asking somebody to repeat.',
  ep35BuildInstruction: 'Build the question.',
  ep35AskInstruction: 'Ask if they can do it.',
  ep35RepairInstruction: "Lingua's answer trails off. Ask them to repeat.",
  ep35SayExplain: '"How do you say...?" asks for a word you don\'t know in English.',
  ep35SayInstruction: 'Ask how to say it in English.',
  ep35ReasonInstruction: 'What is Lingua saying?',
  ep35ReasonOptCorrect: "They can't come, because they're tired.",
  ep35ReasonOptWrong1: 'They are coming.',
  ep35ReasonOptWrong2: 'They are asking a question.',
  ep35AgainInstruction: 'Ask about a different ability.',
  ep35FinalInstruction: 'Ask somebody what they can do.',
  ep35CloseTitle: 'Nicely asked!',
  ep35CloseBody: "You can ask about ability, and ask for a word you don't know.",

  /* ---- episode 36 — "When are you free?" ---- */
  ep36Title: 'When are you free?',
  ep36Goal: 'Propose a day and a time to meet.',
  ep36CanDoName: 'Arrange to meet',
  ep36Duration: '10 min',
  ep36SceneTitle: 'Making a plan',
  ep36SceneBody: 'You want to see somebody this week. When works?',
  ep36Start: 'Start',
  ep36RecallInstruction: 'Remember: ask somebody what they can do.',
  ep36ModelExplain: '"Let\'s meet on + day at + time" proposes both at once.',
  ep36ComprehensionInstruction: 'What is Lingua asking?',
  ep36CompOptCorrect: 'Are you free on Monday?',
  ep36CompOptWrong1: 'Are you from Monday?',
  ep36CompOptWrong2: 'Is it Monday?',
  ep36BuildInstruction: 'Build the proposal.',
  ep36ChoiceInstruction: 'Which day is "Monday"?',
  ep36ProposeInstruction: 'Propose a day and a time.',
  ep36AbilityInstruction: "Answer using 'I can'.",
  ep36CounterInstruction: 'What are they proposing instead?',
  ep36AgainInstruction: 'Propose a different day and time.',
  ep36FinalInstruction: 'Propose a day and a time to meet.',
  ep36CloseTitle: "It's a plan!",
  ep36CloseBody: 'You can propose a day and a time to meet.',

  /* ---- episode 37 — "Where shall we meet?" ---- */
  ep37Title: 'Where shall we meet?',
  ep37Goal: 'Fix the place, and confirm the whole plan.',
  ep37CanDoName: 'Arrange to meet',
  ep37Duration: '9 min',
  ep37SceneTitle: 'Fixing the place',
  ep37SceneBody: 'You have a day and a time. Now, where?',
  ep37Start: 'Start',
  ep37RecallInstruction: 'Remember: propose a day and a time.',
  ep37ModelExplain: '"Where shall we meet?" asks for the place. "Next to" says exactly where.',
  ep37ComprehensionInstruction: 'What is Lingua proposing?',
  ep37CompOptCorrect: 'Let\'s meet at the cinema.',
  ep37CompOptWrong1: "Let's meet on Friday.",
  ep37CompOptWrong2: "Let's meet at seven.",
  ep37ChoiceInstruction: 'Which place are they proposing?',
  ep37PlaceInstruction: 'Propose a place.',
  ep37ChangeInstruction: 'Agree to the new place.',
  ep37CloseInstruction: 'Say goodbye.',
  ep37ConfirmInstruction: 'Confirm the day, the time and the place.',
  ep37FinalInstruction: 'Confirm the day, the time and the place.',
  ep37CloseTitle: 'All set!',
  ep37CloseBody: 'You can fix a place and confirm the whole plan.',

  /* ---- episode 38 — "See you on Friday" (the level's closing story) ---- */
  ep38Title: 'See you on Friday',
  ep38Goal: 'Hold a whole arrangement, from invitation to goodbye.',
  ep38CanDoName: 'Arrange to meet',
  ep38Duration: '12 min',
  ep38SceneTitle: 'The whole conversation',
  ep38SceneBody: 'An invitation, an arrangement, a change, a confirmation, a goodbye — all in one conversation.',
  ep38Start: 'Start',
  ep38GreetInstruction: 'Greet them back.',
  ep38WellbeingInstruction: 'Say how you are.',
  ep38LikeInstruction: 'Say what you think of the idea.',
  ep38StoryInstruction: 'Make the arrangement.',
  ep38RepairInstruction: "Lingua's sentence runs together too fast. Ask them to repeat.",
  ep38ConfirmInstruction: 'Confirm the whole arrangement.',
  ep38CloseInstruction: 'Say goodbye.',
  ep38FinalInstruction: 'Hold the whole arrangement, unaided.',
  ep38CloseTitle: 'See you on Friday!',
  ep38CloseBody: "You can arrange to meet — the whole thing, from invitation to goodbye. That's the end of A1.",

  /*
   * ---- evaluator-emitted keys ----
   * `praiseKey`/`priorityCorrection`/`explanation` string values
   * `levels/a1/evaluators.js` returns at runtime, not referenced by any
   * `*Key` field in the episode JSON — `check-a1-arc6-arc7-structure.mjs`
   * §8b scans the evaluator source itself for these, so this section is
   * required, not decorative (found once by review: a "complete key set"
   * claim that only walked the JSON silently missed all of these).
   */
  ep34PraiseIndependent: 'Well done — you said it yourself, no help needed.',
  ep34PraiseGuided: 'Good — you can say what you can and can\'t do.',
  ep34RetryExplainPolarity: 'Listen again: are they saying "I can" or "I can\'t"?',
  ep35PraiseIndependent: 'Great question — completely on your own.',
  ep35PraiseGuided: 'Good — that\'s how you ask about ability.',
  ep35RetryExplainAbilityVsRequest: 'That asks somebody to repeat, not what they can do. Ask about an ability instead.',
  ep35RetryExplainForm: 'Almost — the question is "Can you ___?", not "Do you can ___?".',
  ep35RetryExplainHowToSay: 'Add the word or phrase you want to know: "How do you say ___?"',
  ep36PraiseIndependent: 'Nicely proposed — a day and a time, all by yourself.',
  ep36PraiseGuided: 'Good — that names a day and a time.',
  ep36RetryExplainMissing: 'A proposal needs both a day and a time — try "Let\'s meet on [day] at [time]."',
  ep37PraiseIndependent: 'Perfect — the place is clear.',
  ep37PraiseGuided: 'Good — that names a place.',
  ep37RetryExplainConfirm: 'A full confirmation repeats the day, the time AND the place.',
  ep38PraiseIndependent: 'You held the whole arrangement yourself — that\'s the end of A1!',
  ep38PraiseGuided: 'Good — you confirmed the arrangement.',
}
