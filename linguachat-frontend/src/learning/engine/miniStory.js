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

export const STORY_BRANCHES = ['accept', 'decline']

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
}

export const STORY_OBJECTIVES = Object.keys(STORIES)

// The story for an objective, or the closest honest fallback.
export function getStory(objective) {
  return STORIES[objective] || STORIES.express_like
}

export const storyTurns = (story) => (story?.turns || [])
export const storyLength = (story) => storyTurns(story).length

/*
 * The branch a story takes for a given run. Fixed by seed so a reload keeps
 * the same story, and only ever one of the two declared branches.
 */
export function defaultBranch(seed = '') {
  return STORY_BRANCHES[seedFrom(String(seed)) % STORY_BRANCHES.length]
}

// The English line for a turn, taking the branch into account.
export function turnText(turn, branch) {
  if (!turn) return ''
  if (turn.byBranch) return turn.byBranch[branch] || turn.byBranch[STORY_BRANCHES[0]] || ''
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
    branchId: STORY_BRANCHES.includes(raw.branchId) ? raw.branchId : null,
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
