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
  ep34PositiveInstruction: 'Can you come swimming with us?',
  ep34MeaningInstruction: "Lingua doesn't know the word for making food. What do they ask?",
  ep34NegativeInstruction: 'Do you want to come dancing with us on Friday?',
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
  ep35DisambiguationInstruction: 'Which one is asking about ABILITY, not asking somebody to repeat?',
  ep35BuildInstruction: 'Build the question.',
  ep35AskInstruction: 'Ask Lingua about their hobby.',
  ep35RepairInstruction: "Lingua's answer trails off. What do you say?",
  ep35SayExplain: '"How do you say...?" asks for a word you don\'t know in English.',
  ep35SayInstruction: 'You know a word in your language, but not in English. What do you ask?',
  ep35ReasonInstruction: 'What is Lingua saying?',
  ep35ReasonOptCorrect: "They can't come, because they're tired.",
  ep35ReasonOptWrong1: 'They are coming.',
  ep35ReasonOptWrong2: 'They are asking a question.',
  ep35AgainInstruction: 'Ask Lingua something else they can do.',
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
  ep36ProposeInstruction: "I'd like to see you this week. When are you free?",
  ep36AbilityInstruction: 'Can you come on Saturday morning?',
  ep36CounterInstruction: "Sorry, I can't on Friday. How about Saturday?",
  ep36AgainInstruction: "Saturday doesn't work for me. Propose another day and time.",
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
  ep37ChoiceInstruction: 'Where shall we meet?',
  ep37PlaceInstruction: 'Friday at seven — where shall we meet?',
  ep37ChangeInstruction: 'Actually, sorry — can we meet at the cinema instead?',
  ep37CloseInstruction: "Great, that's settled. See you then!",
  ep37ConfirmInstruction: 'Just to be sure — tell me everything we agreed.',
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
  ep38GreetInstruction: 'Hi again! Nice to see you.',
  ep38WellbeingInstruction: 'How are you?',
  ep38LikeInstruction: "I know you like music. There's a concert this week — do you like the idea?",
  ep38StoryInstruction: 'Make the arrangement.',
  ep38RepairInstruction: "Lingua's sentence runs together too fast. What do you say?",
  ep38ConfirmInstruction: 'Perfect. So, just to be sure?',
  ep38CloseInstruction: 'See you then. Bye!',
  ep38FinalInstruction: 'Hold the whole arrangement, unaided.',
  ep38CloseTitle: 'See you on Friday!',
  ep38CloseBody: "You can arrange to meet — the whole thing, from invitation to goodbye. That's the end of A1.",
}
