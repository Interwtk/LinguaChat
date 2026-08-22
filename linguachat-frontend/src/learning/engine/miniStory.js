/*
 * miniStory — a very small scene, told in the same chat, using only language
 * the learner already met.
 *
 * `mini_story` has been a plannable format for a while, but it rendered as a
 * plain free-reply turn, so it was a label rather than an experience. This
 * gives it a shape: Lingua sets a scene, the learner makes ONE decision, the
 * story answers, the learner says one thing in English, and it closes.
 *
 * Everything is data. Nothing is generated: the turns below are fixed text
 * with a few placeholders, the two branches are the same length and the same
 * objective, and the subject matter comes from the context the session already
 * decided on. Five to seven interactions, then out.
 */
import { seedFrom } from './variation.js'

/*
 * The default pair of endings. A story may declare its own — the repair story's
 * two endings are two STRATEGIES ("ask them to repeat" / "ask them to slow
 * down"), which is a different axis from accepting or declining an offer, and
 * both are equally correct.
 */
export const STORY_BRANCHES = ['accept', 'decline']
export const storyBranches = (story) =>
  (Array.isArray(story?.branches) && story.branches.length === 2 ? story.branches : STORY_BRANCHES)

/* Where a story is meant to be told: inside an episode, or in a daily session. */
export const storyHome = (story) => (story?.home === 'episode' ? 'episode' : 'session')
/* Stories a daily session may offer. An episode's story is not one of them. */
export const sessionStoryObjectives = () =>
  Object.keys(STORIES).filter(o => storyHome(STORIES[o]) === 'session')

/*
 * One story per objective we can honestly tell at Pre-A1. Each turn is:
 *   scene   Lingua sets the situation (English, with the native-language note)
 *   choose  the single decision, two options, both valid English
 *   line    the story reacts to the decision
 *   reply   the learner produces one sentence (hybrid evaluation)
 *   close   a short ending
 */
const STORIES = {
  express_like: {
    storyId: 'cafe_music',
    objective: 'express_like',
    turns: [
      { kind: 'scene', textEn: 'You are at a café with {partner}. Music is playing.', noteKey: 'storyNoteScene' },
      { kind: 'line', speaker: 'partner', textEn: 'I like this song. Do you like {noun}?' },
      {
        kind: 'choose',
        promptKey: 'storyChooseReply',
        options: [
          { branch: 'accept', textEn: 'Yes, I do.' },
          { branch: 'decline', textEn: 'No, I don’t.' },
        ],
      },
      {
        kind: 'line',
        speaker: 'partner',
        byBranch: {
          accept: 'Me too! What else do you like?',
          decline: 'No problem. What do you like?',
        },
      },
      { kind: 'reply', evalKind: 'express_like', instructionKey: 'storyReplyLike', suggestionEn: 'I like {noun}.', itemIds: ['i_like'] },
      { kind: 'close', textEn: 'Nice. Let’s listen together.', noteKey: 'storyNoteClose' },
    ],
  },
  express_want: {
    storyId: 'cafe_order',
    objective: 'express_want',
    turns: [
      { kind: 'scene', textEn: 'You are at the counter with {partner}. It is your turn.', noteKey: 'storyNoteScene' },
      { kind: 'line', speaker: 'partner', textEn: 'Do you want water?' },
      {
        kind: 'choose',
        promptKey: 'storyChooseReply',
        options: [
          { branch: 'accept', textEn: 'Yes, please.' },
          { branch: 'decline', textEn: 'No, thank you.' },
        ],
      },
      {
        kind: 'line',
        speaker: 'partner',
        byBranch: {
          accept: 'Here you are. Anything else?',
          decline: 'Okay. So what do you want?',
        },
      },
      { kind: 'reply', evalKind: 'express_want', instructionKey: 'storyReplyWant', suggestionEn: 'I want water.', itemIds: ['i_want'] },
      { kind: 'close', textEn: 'Perfect. Let’s sit down.', noteKey: 'storyNoteClose' },
    ],
  },
  polite_request: {
    storyId: 'cafe_counter',
    objective: 'polite_request',
    turns: [
      { kind: 'scene', textEn: 'You are in a café with {partner}. It is your turn to order.', noteKey: 'storyNoteScene' },
      { kind: 'line', speaker: 'partner', textEn: 'Hi! What can I get for you?' },
      {
        kind: 'choose',
        promptKey: 'storyChooseReply',
        options: [
          { branch: 'accept', textEn: 'Can I have {item}, please?' },
          { branch: 'decline', textEn: 'Just a moment, please.' },
        ],
      },
      {
        kind: 'line',
        speaker: 'partner',
        byBranch: {
          accept: 'Of course. Anything else?',
          decline: 'No problem. Take your time. Ready now?',
        },
      },
      { kind: 'reply', evalKind: 'polite_request', instructionKey: 'storyReplyRequest', suggestionEn: 'Can I have {item}, please?', itemIds: ['can_i_have'] },
      { kind: 'close', textEn: 'Here you are. Enjoy!', noteKey: 'storyNoteClose' },
    ],
  },
  repair_request: {
    storyId: 'lost_the_thread',
    objective: 'repair_request',
    /*
     * The one story an EPISODE hosts rather than a daily session. An episode has
     * room for a real exchange, so this one asks for two sentences: the answer
     * that proves the repair worked, and the goodbye that ends the encounter.
     * A session block still gets a single produced sentence.
     */
    home: 'episode',
    /* two ways out of the same problem, neither better than the other */
    branches: ['repeat', 'slow_down'],
    turns: [
      /* the breakdown is the scene: they said something and you missed it */
      { kind: 'scene', textEn: 'You meet {partner} again. They ask something — too fast.', noteKey: 'storyNoteScene' },
      {
        kind: 'choose',
        promptKey: 'storyChooseRepair',
        options: [
          { branch: 'repeat', textEn: 'Can you repeat, please?' },
          { branch: 'slow_down', textEn: 'Please speak slowly.' },
        ],
      },
      {
        kind: 'line',
        speaker: 'partner',
        byBranch: {
          repeat: 'Of course. Do you like {noun}?',
          slow_down: 'Sorry! Do… you… like… {noun}?',
        },
      },
      { kind: 'reply', evalKind: 'yes_no_preference', instructionKey: 'storyReplyPreference', suggestionEn: 'Yes, I do.', itemIds: ['do_you_like'] },
      { kind: 'line', speaker: 'partner', textEn: 'Me too. I have to go now!' },
      { kind: 'reply', evalKind: 'close_encounter', instructionKey: 'storyReplyClose', suggestionEn: 'Bye.', itemIds: ['bye'] },
      { kind: 'close', textEn: 'See you!', noteKey: 'storyNoteClose' },
    ],
  },
  /*
   * A1 arc 2's story, and the blueprint asked for it by name: "A day is a
   * sequence; a hosted story lets the learner meet several actions in order and
   * still answer in their own words."
   *
   * The scene carries TWO words the learner has never met — `early` and `late` —
   * because episode 23's capability is asking what a word means, and a question
   * about nothing is a drill. The decision is which repair to reach for, which is
   * the same axis as the Pre-A1 repair story: two strategies, neither better.
   *
   * `personalizationMode` is deliberately absent, so this story is neutral for
   * everybody. The two unknown words ARE the lesson; letting a topic change them
   * would change what the learner has to do, which the personalisation contract
   * refuses.
   */
  state_routine: {
    storyId: 'somebody_else_day',
    objective: 'state_routine',
    home: 'episode',
    /* two ways to rescue the same sentence, and the learner picks one */
    branches: ['ask_meaning', 'repeat'],
    turns: [
      { kind: 'scene', textEn: '{partner} talks about their day: “I get up early and I work late.”', noteKey: 'storyNoteScene' },
      {
        kind: 'choose',
        promptKey: 'storyChooseRepair',
        options: [
          { branch: 'ask_meaning', textEn: 'What does “early” mean?' },
          { branch: 'repeat', textEn: 'Can you repeat, please?' },
        ],
      },
      {
        kind: 'line',
        speaker: 'partner',
        byBranch: {
          ask_meaning: '“Early” means before seven. And you?',
          repeat: 'Of course — I get up early. And you?',
        },
      },
      { kind: 'reply', evalKind: 'state_routine', instructionKey: 'storyReplyRoutine', suggestionEn: 'I get up at seven.', itemIds: ['get_up', 'time_at_pattern'] },
      { kind: 'line', speaker: 'partner', textEn: 'Nice. I sometimes work in the evening.' },
      { kind: 'reply', evalKind: 'state_routine', instructionKey: 'storyReplyDayPart', suggestionEn: 'I usually work in the morning.', itemIds: ['part_of_day_pattern', 'usually'] },
      { kind: 'close', textEn: 'Have a good day!', noteKey: 'storyNoteClose' },
    ],
  },
  introduction: {
    storyId: 'first_day',
    objective: 'introduction',
    turns: [
      { kind: 'scene', textEn: 'It is your first day. {partner} comes over.', noteKey: 'storyNoteScene' },
      { kind: 'line', speaker: 'partner', textEn: 'Hi! I’m {partner}. Is this seat free?' },
      {
        kind: 'choose',
        promptKey: 'storyChooseReply',
        options: [
          { branch: 'accept', textEn: 'Yes, sit down.' },
          { branch: 'decline', textEn: 'Sorry, it’s taken.' },
        ],
      },
      {
        kind: 'line',
        speaker: 'partner',
        byBranch: {
          accept: 'Thanks! And you are…?',
          decline: 'No problem. I’m sorry — and you are…?',
        },
      },
      { kind: 'reply', evalKind: 'introduction', instructionKey: 'storyReplyIntro', suggestionEn: 'Hi, I’m {name}.', itemIds: ['im'] },
      { kind: 'close', textEn: 'Nice to meet you!', noteKey: 'storyNoteClose' },
    ],
  },
  /*
   * A1 arc 4. The blueprint asks for this story by name and hands it its branch:
   * "Being lost is a situation with a beginning and an end, and a branch - asking a
   * passer-by or asking at a desk - that is genuinely two valid choices."
   *
   * Both branches answer, and BOTH answers are two clauses, because the episode's
   * receptive target is an answer "deliberately beyond production". The repair in the
   * middle is the arc's planted one: the reply contains a word nobody taught, and the
   * way through is a capability the learner already owns.
   *
   * NO DIRECTIONS. `follow_multi_step_directions` is deferred to A2, so neither branch
   * ever says left, right or straight on - they say which transport, and where it is
   * relative to something.
   */
  ask_transport: {
    storyId: 'lost_in_the_street',
    objective: 'ask_transport',
    home: 'episode',
    /* the blueprint's two valid choices, and they are the branch ids */
    branches: ['passer_by', 'desk'],
    turns: [
      { kind: 'scene', textEn: 'A street with {partner}. You want the station. Nobody knows the way.', noteKey: 'storyNoteScene' },
      {
        kind: 'choose',
        promptKey: 'storyChooseWhoToAsk',
        options: [
          { branch: 'passer_by', textEn: 'Ask the person waiting.' },
          { branch: 'desk', textEn: 'Ask at the hotel desk.' },
        ],
      },
      /* the learner asks - open production, and the story's own capability */
      { kind: 'reply', evalKind: 'ask_transport', instructionKey: 'storyReplyTransport', suggestionEn: 'How do I get to the station?', itemIds: ['where_is_pattern', 'station'] },
      /* the answer, two clauses, with a word the arc never taught */
      {
        kind: 'line',
        speaker: 'partner',
        byBranch: {
          passer_by: 'Take the bus. The stop is opposite the platform.',
          desk: 'The train is faster. The station is behind the hotel.',
        },
      },
      /* the planted repair: the answer went past them, and they say so */
      { kind: 'reply', evalKind: 'repair_request', repairKind: 'repeat', instructionKey: 'storyReplyRepair', suggestionEn: 'Sorry, can you repeat, please?', itemIds: ['can_you_repeat'] },
      {
        kind: 'line',
        speaker: 'partner',
        byBranch: {
          passer_by: 'Of course. The bus. It is opposite, there.',
          desk: 'Of course. The station is near. It is behind the hotel.',
        },
      },
      { kind: 'close', textEn: 'Good luck!', noteKey: 'storyNoteClose' },
    ],
  },
  /*
   * A1 arc 5. `buy_something`'s headline evidence intent, reused from Pre-A1
   * rather than invented — the blueprint's own words for the capability: "It
   * reuses the café shape Pre-A1 already owns and adds the money the café never
   * mentioned." The money enters as the shopkeeper's own line; the learner is
   * never asked to state a price, only to ask for the thing and close the sale,
   * exactly as episode 33's evidence target reads: "a purchase held unaided from
   * greeting to goodbye."
   *
   * `home: 'episode'`, like `ask_transport` before it: this story belongs to
   * episode 33 and must never also be offered as a loose daily-session block —
   * `OBJECTIVE_FORMATS['cafe_order_conversation']` stays without `mini_story` for
   * exactly that reason.
   */
  cafe_order_conversation: {
    storyId: 'buying_a_ticket',
    objective: 'cafe_order_conversation',
    home: 'episode',
    turns: [
      { kind: 'scene', textEn: 'You are at the counter with {partner}. It is your turn to order.', noteKey: 'storyNoteScene' },
      { kind: 'reply', evalKind: 'cafe_order_conversation', instructionKey: 'storyReplyOrder', suggestionEn: 'Can I have a ticket, please?', itemIds: ['can_i_have', 'ticket'] },
      { kind: 'line', speaker: 'partner', textEn: 'Sure — it’s fifteen dollars. Anything else?' },
      {
        kind: 'choose',
        promptKey: 'storyChooseReply',
        options: [
          { branch: 'accept', textEn: 'Yes, please.' },
          { branch: 'decline', textEn: 'No, thank you.' },
        ],
      },
      {
        kind: 'line',
        speaker: 'partner',
        byBranch: {
          accept: 'Of course. Anything else?',
          decline: 'No problem. Here you are.',
        },
      },
      { kind: 'reply', evalKind: 'finish_order', instructionKey: 'storyReplyFinish', suggestionEn: 'That’s all, thanks.', itemIds: ['thats_all'] },
      { kind: 'close', textEn: 'Thank you — safe travels!', noteKey: 'storyNoteClose' },
    ],
  },
  /*
   * A1 arc 7's closing episode (38, `see_you_on_friday`), the level's own
   * closing arrangement. `home: 'episode'`, like `repair_request` above: this
   * story belongs to episode 38 (its `story.branchStep` names this exact step)
   * and must never also be offered as a loose daily-session block —
   * `OBJECTIVE_FORMATS['arrange_meeting']` stays without `mini_story` for
   * exactly that reason. `branches`/the `line` turn's `byBranch` text mirror
   * episode 38's own top-level `story.branches`/`branchLines` verbatim, the
   * same way `repair_request`'s story mirrors Pre-A1 episode 15's.
   */
  arrange_meeting: {
    storyId: 'see_you_on_friday',
    objective: 'arrange_meeting',
    home: 'episode',
    branches: ['accept', 'postpone'],
    turns: [
      { kind: 'scene', textEn: 'You want to see {partner} this week. Time to fix a day.', noteKey: 'storyNoteScene' },
      {
        kind: 'reply', evalKind: 'arrange_meeting', arrangeStage: 'propose',
        instructionKey: 'storyReplyArrangePropose', suggestionEn: 'Let’s meet on Friday at seven.',
        itemIds: ['day_of_week_pattern', 'arrange_pattern'],
      },
      {
        kind: 'choose',
        promptKey: 'storyChooseArrange',
        options: [
          { branch: 'accept', textEn: 'Great, see you then.' },
          { branch: 'postpone', textEn: 'Could we make it Saturday?' },
        ],
      },
      {
        kind: 'line',
        speaker: 'partner',
        byBranch: {
          accept: 'Great, Friday it is!',
          postpone: 'No problem — how about Saturday instead?',
        },
      },
      {
        kind: 'reply', evalKind: 'arrange_meeting', arrangeStage: 'confirm', praisePrefix: 'ep38',
        instructionKey: 'storyReplyArrangeConfirm', suggestionEn: 'So, Friday at seven, at the station.',
        itemIds: ['day_of_week_pattern', 'arrange_pattern', 'its_location_pattern'],
      },
      { kind: 'close', textEn: 'Perfect. See you then!', noteKey: 'storyNoteClose' },
    ],
  },

  /*
   * A2 arc 1 (`what_happened`), hosted by episode 42 ("First I..., then I...").
   * Episode 42's own header comment gives this story's content almost
   * verbatim: "Somebody's unusual day, three actions in order... `got`
   * (already familiar) opens it; `made` and `said` are its two never-yet-
   * produced verbs" and its own `choice` step quotes the exact receptive
   * target: "First she got up late. Then she made a big breakfast. After
   * that, she said sorry to her boss." That line is reused verbatim below,
   * as a partner's account of a friend's day — `made`/`said` stay strictly
   * receptive here, exactly as the episode file requires (neither is ever
   * asked for production anywhere in a2Arc1WhatHappened.js).
   *
   * `home: 'episode'`, like every other A2/A1 episode-hosted story:
   * `OBJECTIVE_FORMATS['past_day_story']` must stay without `mini_story`
   * for the same reason `ask_transport`/`arrange_meeting` give in
   * miniStory.js's own comments.
   *
   * No `branches`: the arc's one planted repair already lives in episode 41
   * (`bought`, `ask_for_repair`), so this story does not need a second
   * repair axis — the one real decision here is which follow-up question
   * the learner asks, and both options are equally valid, ordinary
   * conversation rather than a graded fork, so it stays a `choose` turn with
   * no separate `branches` array (the two-branch STORY_BRANCHES default is
   * unused because this story's `choose` turn does not gate a later `line`'s
   * wording choice the way `arrange_meeting`'s does — see the `line`
   * immediately below it, which is `byBranch` anyway to keep the shape
   * consistent with every other choose-bearing story).
   */
  past_day_story: {
    storyId: 'somebody_had_a_day',
    objective: 'past_day_story',
    home: 'episode',
    branches: ['ask_work', 'ask_boss'],
    turns: [
      { kind: 'scene', textEn: '{partner} tells you about a friend who had a very strange day.', noteKey: 'storyNoteScene' },
      { kind: 'line', speaker: 'partner', textEn: 'She got up late, made breakfast, then said sorry to her boss.' },
      {
        kind: 'choose',
        promptKey: 'storyChooseAskDay',
        options: [
          { branch: 'ask_work', textEn: 'Did she go to work today?' },
          { branch: 'ask_boss', textEn: 'Was her boss angry?' },
        ],
      },
      {
        kind: 'line',
        speaker: 'partner',
        byBranch: {
          ask_work: 'Yes, she did — very late!',
          ask_boss: 'A little. But it’s okay now.',
        },
      },
      {
        kind: 'reply', evalKind: 'narrate_past_sequence', instructionKey: 'storyReplyOwnDay',
        suggestionEn: 'I went to work. Then I had lunch with a friend.',
        itemIds: ['sequencing_connector_pattern', 'simple_past_irregular_pattern'],
      },
      {
        kind: 'reply', evalKind: 'state_past_event', instructionKey: 'storyReplyLastThing',
        itemIds: ['simple_past_regular_pattern', 'past_time_expression_pattern'],
      },
      { kind: 'close', textEn: 'Good talk. See you tomorrow!', noteKey: 'storyNoteClose' },
    ],
  },

  /*
   * A2 arc 3 (`people_and_places`), hosted by episode 48 ("Which one would you
   * choose?"). Episode 48's own header comment (near line 103 of
   * a2Arc3PeopleAndPlaces.js) names this story's job precisely: "the hosted
   * story... is what DOES THE DESCRIBING of both places (episode 45's own
   * capability, already proved)... which is why episode 48's three open
   * productions are compare / justify / respond-to-disagreement rather than
   * describe-describe-compare." So this story stays a DESCRIPTION story —
   * one reply turn reinforcing `describe_person_or_place`, not a comparison
   * — and leaves compare_things / state_opinion_with_reason entirely to the
   * three free_reply steps episode 48 already has AFTER the mini_story step.
   *
   * The scene's two places reuse the episode's own literal prompt text
   * verbatim ("one is small and quiet, the other is big and friendly", from
   * `ep48CompareInstruction`), so the learner's later comparison in the
   * episode is about the exact pair this story just held in view.
   *
   * `home: 'episode'`. NO `suggestionEn` anywhere in this story, honouring
   * episode 48's own explicit invariant: "No suggestionEn appears anywhere
   * in this episode: the arc's autonomy target withdraws it here and nowhere
   * else." The mini_story step is part of that same episode's turn sequence.
   */
  compare_two_places_story: {
    storyId: 'sol_or_luna',
    objective: 'compare_two_places_story',
    home: 'episode',
    branches: ['sol', 'luna'],
    turns: [
      { kind: 'scene', textEn: 'You and {partner} are choosing where to meet: Café Sol or Café Luna.', noteKey: 'storyNoteScene' },
      { kind: 'line', speaker: 'partner', textEn: 'Café Sol is small and quiet. Café Luna is big and friendly.' },
      {
        kind: 'choose',
        promptKey: 'storyChooseWhichPlace',
        options: [
          { branch: 'sol', textEn: 'Tell me more about Café Sol.' },
          { branch: 'luna', textEn: 'Tell me more about Café Luna.' },
        ],
      },
      {
        kind: 'line',
        speaker: 'partner',
        byBranch: {
          sol: 'There are quiet tables outside, and it’s never noisy.',
          luna: 'There’s music, and it’s always full of people.',
        },
      },
      {
        kind: 'reply', evalKind: 'describe_person_or_place', instructionKey: 'storyReplyDescribe',
        itemIds: ['multi_attribute_pattern'],
      },
      { kind: 'line', speaker: 'partner', textEn: 'Good choice! Now, which one is right for you?' },
      { kind: 'close', textEn: 'Time to decide — the small café, or the big one?', noteKey: 'storyNoteClose' },
    ],
  },

  /*
   * A2 arc 5 (`booking_a_stay`), hosted by episode 54 ("Can you spell that?").
   * Episode 54 already narrates the whole call across its own free_reply
   * steps (availability -> booking -> spelling -> repair -> close), so per
   * this task's brief this story is a SECOND, complete instance of the same
   * integrated transaction — "exactly like A1's purchase story"
   * (`cafe_order_conversation`, episode 33) sits ALONGSIDE that episode's own
   * explicit turns rather than replacing them. A different restaurant name
   * and a different date/party size keep it a distinct call, not a replay of
   * episode 54's own scripted lines; the booking name stays "Sam" / "S-A-M",
   * the same short fictional first name the episode itself uses (never a
   * real or surname-shaped name, per the arc's privacy note).
   *
   * `home: 'episode'`. NO `suggestionEn` anywhere, honouring episode 54's own
   * explicit invariant: "NO suggestionEn ANYWHERE IN THIS EPISODE... every
   * free_reply below, new or reused, runs unaided."
   *
   * FLAGGED, NOT WORKED AROUND: the `spell_word` reply turn below carries
   * `expectedSpelling: 'Sam'`, exactly as episode 54's own two `spell_word`
   * steps do (`evalKind: 'spell_word', expectedSpelling: 'Sam'`). But
   * `linguachat-frontend/src/components/session/MiniStory.jsx`'s `turnFields`
   * helper — the story path's equivalent of EpisodeShell.jsx's per-step field
   * passthrough — does NOT forward `expectedSpelling` into `evalCtx` the way
   * EpisodeShell.jsx does (`expectedSpelling: step.expectedSpelling ||
   * undefined`, EpisodeShell.jsx:556). `hybridEvaluation.js`'s own comment on
   * `spell_word` says the intent "has no default — a spell_word turn wired
   * with no target could never complete." So as things stand today, a
   * `spell_word` turn placed inside ANY hosted story (not just this one)
   * would reach the evaluator with `expectedSpelling: ''` and could never be
   * marked correct. This is the same class of defect a2Arc1WhatHappened.js's
   * header already names for `twoClauseJudgment` — a real gap in a sibling
   * deliverable (`MiniStory.jsx`'s `turnFields`), out of this task's write
   * scope (I was told not to touch any runtime file), so it is named here
   * rather than silently avoided by dropping the turn. Whoever wires
   * `booking_call_story` into `miniStory.js` should add `expectedSpelling` to
   * `MiniStory.jsx`'s `turnFields` (mirroring `hybridEvaluation.js`'s own
   * parameter) before this turn can actually complete for a learner.
   */
  booking_call_story: {
    storyId: 'the_blue_door',
    objective: 'booking_call_story',
    home: 'episode',
    branches: ['inside', 'terrace'],
    turns: [
      { kind: 'scene', textEn: 'You call The Blue Door to book a table.', noteKey: 'storyNoteScene' },
      { kind: 'line', speaker: 'partner', textEn: 'Good evening, The Blue Door. How can I help?' },
      {
        kind: 'reply', evalKind: 'make_booking', instructionKey: 'storyReplyBooking',
        itemIds: ['booking_pattern', 'ordinal_date_pattern'],
      },
      {
        kind: 'choose',
        promptKey: 'storyChooseSeating',
        options: [
          { branch: 'inside', textEn: 'Inside, please.' },
          { branch: 'terrace', textEn: 'On the terrace, please.' },
        ],
      },
      {
        kind: 'line',
        speaker: 'partner',
        byBranch: {
          inside: 'Perfect, a table inside it is.',
          terrace: 'Perfect, the terrace it is.',
        },
      },
      {
        kind: 'reply', evalKind: 'spell_word', expectedSpelling: 'Sam', instructionKey: 'storyReplySpell',
        itemIds: ['spelling_pattern'],
      },
      { kind: 'close', textEn: 'All booked — S-A-M, table for two. See you then!', noteKey: 'storyNoteClose' },
    ],
  },

  /*
   * A2 arc 6 (`everyday_problems`), hosted by episode 57 ("Fixed"). Episode
   * 57's own header comment says this story is "the hosted retelling... the
   * engine-rendered whole shape, exactly as a1Arc5.js's cafe_order_
   * conversation story sits alongside its own episode's explicit turns
   * rather than replacing them" — so, like booking_call_story above, this is
   * a second, complete instance of the arc's integrated transaction, using a
   * DIFFERENT problem (`doesnt_work`, "My TV doesn't work") rather than
   * replaying episode 55/57's own "the room is cold" example, while staying
   * inside the arc's bounded, taught `problem` set.
   *
   * The `choose` turn is the story's branch, and it deliberately mirrors
   * episode 57's own "decline and re-propose" ceiling (a2.md §9's "late"
   * autonomy note): waiting for the fix, or asking to move to a different
   * room instead, are BOTH cooperative, valid answers — matching how episode
   * 57's header explains that `ask_for_help_solving_a_problem`'s own
   * phrasing is folded into the decline-and-repropose turn rather than given
   * a separate assessed turn ("Can you help me with..." style language sits
   * inside the `instead` option's own text here, for the same reason).
   *
   * `home: 'episode'`. NO `suggestionEn` anywhere, honouring episode 57's own
   * explicit invariant: "NO suggestionEn ANYWHERE in this episode, on the
   * blueprint's explicit instruction — this is the arc's fully unaided
   * closing story."
   */
  problem_resolution_story: {
    storyId: 'the_tv_doesnt_work',
    objective: 'problem_resolution_story',
    home: 'episode',
    branches: ['wait', 'instead'],
    turns: [
      { kind: 'scene', textEn: 'Another evening at the hotel. Something is wrong again.', noteKey: 'storyNoteScene' },
      {
        kind: 'reply', evalKind: 'report_problem', instructionKey: 'storyReplyProblem',
        itemIds: ['doesnt_work', 'problem_report_pattern'],
      },
      { kind: 'line', speaker: 'partner', textEn: 'I’m sorry! I can send someone, but it will take an hour.' },
      {
        kind: 'choose',
        promptKey: 'storyChooseSolution',
        options: [
          { branch: 'wait', textEn: 'Ok, I will wait, thank you.' },
          { branch: 'instead', textEn: 'Could I move rooms instead?' },
        ],
      },
      {
        kind: 'line',
        speaker: 'partner',
        byBranch: {
          wait: 'Thank you for waiting — I will come as soon as I can.',
          instead: 'Of course — room 12 is free and ready now.',
        },
      },
      {
        kind: 'reply', evalKind: 'thank_service', instructionKey: 'storyReplyThanks',
        itemIds: ['thank_you'],
      },
      { kind: 'close', textEn: 'All sorted. Enjoy the rest of your stay!', noteKey: 'storyNoteClose' },
    ],
  },

  /*
   * A2 arc 7 (`lets_do_something`), hosted by episode 61 ("Let's do something
   * else") — A2's own closing/convergence episode. Episode 61's header
   * comment names this story's shape by asking for it explicitly: "an
   * invitation, a decline with a reason, a complication (the first idea is
   * unavailable, echoing everyday_problems), a new plan, and a confirmation,
   * with a branch where accepting the original and proposing a new plan are
   * both correct" — and episode 61's own `ep61ProposeInstruction` step
   * comment names the two branch outcomes precisely: re-proposing the
   * ORIGINAL activity on a different day, and proposing a genuinely
   * DIFFERENT activity (`go_for_a_walk`). Both are mirrored here as the
   * story's two branches.
   *
   * The mini_story step sits inside episode 61 right after the complication
   * is introduced receptively (`ep61ComprehensionInstruction`) and before
   * the episode's own six explicit open-production turns, so — like
   * `booking_call_story` and `problem_resolution_story` above — this story
   * is a second, complete pass through the arc's whole integrated shape
   * (invite -> complication -> decline/adapt with a reason -> branch:
   * repropose-or-new-plan -> confirmation), giving the learner one hosted
   * runthrough of the capstone shape before producing their own version
   * across the rest of the episode.
   *
   * `home: 'episode'`. NO `suggestionEn` anywhere, honouring episode 61's own
   * explicit invariant: "THIS IS THE A2 LEVEL'S FINAL EPISODE. NO
   * suggestionEn anywhere in it, per the arc's autonomy target."
   */
  closing_invitation_story: {
    storyId: 'the_cinema_is_closed',
    objective: 'closing_invitation_story',
    home: 'episode',
    branches: ['repropose', 'new_activity'],
    turns: [
      { kind: 'scene', textEn: 'You want to do something with {partner} this weekend.', noteKey: 'storyNoteScene' },
      {
        kind: 'reply', evalKind: 'invite_someone', instructionKey: 'storyReplyInvite',
        itemIds: ['invitation_pattern', 'go_to_the_cinema'],
      },
      { kind: 'line', speaker: 'partner', textEn: 'I’d love to — but the cinema is closed this weekend!' },
      {
        kind: 'choose',
        promptKey: 'storyChooseNewPlan',
        options: [
          { branch: 'repropose', textEn: 'Another day, then?' },
          { branch: 'new_activity', textEn: 'Let’s go for a walk instead.' },
        ],
      },
      {
        kind: 'line',
        speaker: 'partner',
        byBranch: {
          repropose: 'Great idea — how about Sunday?',
          new_activity: 'That sounds lovely! I’d like that.',
        },
      },
      {
        kind: 'reply', evalKind: 'respond_to_invitation', instructionKey: 'storyReplyConfirm',
        itemIds: ['accept_decline_reason_pattern', 'going_to_future_pattern'],
      },
      { kind: 'close', textEn: 'Plan settled! Have a great weekend.', noteKey: 'storyNoteClose' },
    ],
  },
}

export const STORY_OBJECTIVES = Object.keys(STORIES)

/*
 * The story for an objective, or NOTHING.
 *
 * This used to fall back to `STORIES.express_like`, which was not an honest
 * fallback but a silent substitution: any objective without a story of its own got
 * the café scene about music. Combined with an unknown objective being allowed
 * every format, a block practising "say what you do" could be rendered as a
 * conversation about liking songs and then graded on the wrong sentence.
 *
 * A story cannot be generated, so there is no correct answer for an objective
 * nobody wrote one for. `null` is that answer, and every caller must handle it —
 * `hasStory` is the cheap question to ask first.
 */
export function getStory(objective) {
  return STORIES[objective] || null
}

export const hasStory = (objective) => Boolean(STORIES[objective])

export const storyTurns = (story) => (story?.turns || [])
export const storyLength = (story) => storyTurns(story).length

/*
 * The branch a story takes for a given run. Fixed by seed so a reload keeps
 * the same story, and only ever one of the two declared branches.
 */
export function defaultBranch(seed = '', story = null) {
  const branches = storyBranches(story)
  return branches[seedFrom(String(seed)) % branches.length]
}

// The English line for a turn, taking the branch into account.
export function turnText(turn, branch, story = null) {
  if (!turn) return ''
  if (turn.byBranch) {
    const fallback = storyBranches(story)[0]
    return turn.byBranch[branch] || turn.byBranch[fallback] || Object.values(turn.byBranch)[0] || ''
  }
  return turn.textEn || ''
}

/*
 * Where a story is right now. Kept deliberately small so it can live inside
 * the session block and survive a reload untouched.
 */
export function createStoryState(story, { seed = '', branch = null } = {}) {
  return {
    storyId: story.storyId,
    objective: story.objective,
    currentTurn: 0,
    branchId: branch || null,
    seed: String(seed),
  }
}

export function normalizeStoryState(raw, story) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  if (raw.storyId !== story.storyId) return null
  const turn = Number(raw.currentTurn)
  return {
    storyId: story.storyId,
    objective: story.objective,
    currentTurn: Number.isFinite(turn) ? Math.min(Math.max(0, Math.trunc(turn)), storyLength(story) - 1) : 0,
    branchId: storyBranches(story).includes(raw.branchId) ? raw.branchId : null,
    seed: typeof raw.seed === 'string' ? raw.seed.slice(0, 80) : '',
  }
}

// Advance one turn; the last turn stays the last turn.
export function advanceStory(state, story) {
  if (!state) return state
  return { ...state, currentTurn: Math.min(state.currentTurn + 1, storyLength(story) - 1) }
}

export const isStoryFinished = (state, story) =>
  Boolean(state) && state.currentTurn >= storyLength(story) - 1

export const STORY_STORAGE_KEY = 'lc2-mini-story-v1'
