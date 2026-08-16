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
