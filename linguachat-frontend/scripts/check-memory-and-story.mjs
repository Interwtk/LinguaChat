/*
 * check-memory-and-story — two promises made to the learner.
 *
 * 1. "Use another topic" means it for the rest of the day, not for the rest of
 *    the screen. It must survive navigation, a reload, a language switch and a
 *    breakpoint, must never delete or devalue the fact, and must expire with
 *    the day rather than becoming a permanent instruction.
 *
 * 2. A mini story is an actual small scene — a fixed set of turns, one
 *    decision, two comparable endings, one produced sentence — and it resumes
 *    exactly where it was rather than starting over.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve as resolvePath } from 'node:path'
import {
  emptyMemoryContext, normalizeMemoryContext, isFactDismissed, factKey,
  MEMORY_CONTEXT_VERSION,
} from '../src/learning/engine/memoryContext.js'
import {
  createLearnerModel, sanitizeLearnerFacts,
} from '../src/learning/engine/learnerModel.js'
import {
  recordLearnerFact, selectLearnerFact, getFactContext, factsOfType,
} from '../src/learning/engine/learnerFacts.js'
import { getInterestContext } from '../src/learning/engine/interests.js'
import {
  getStory, storyTurns, storyLength, turnText, createStoryState, normalizeStoryState,
  advanceStory, isStoryFinished, defaultBranch, STORY_BRANCHES, STORY_OBJECTIVES,
} from '../src/learning/engine/miniStory.js'
import { dayKeyFor } from '../src/learning/engine/session.js'

const here = dirname(fileURLToPath(import.meta.url))
const read = (p) => readFileSync(resolvePath(here, '..', p), 'utf8')

let n = 0
const ok = () => { n++ }
const AT = new Date('2026-05-20T09:00:00Z').getTime()
const TOMORROW = AT + 24 * 60 * 60 * 1000
const MUSIC = { type: 'like', value: 'music' }

/* ---------- 1. the memory context ---------- */

// 1) a dismissal is remembered, whatever case it was written in
{
  const context = { ...emptyMemoryContext(AT), dismissedFactIds: [factKey(MUSIC)] }
  assert.equal(isFactDismissed(context, MUSIC), true)
  assert.equal(isFactDismissed(context, { type: 'like', value: 'MUSIC' }), true)
  assert.equal(isFactDismissed(context, { type: 'like', value: 'movies' }), false)
  assert.equal(isFactDismissed(context, null), false)
  ok()
}

// 2) it survives a reload — a stored context from TODAY is kept as it is
{
  const stored = { version: MEMORY_CONTEXT_VERSION, dayKey: dayKeyFor(AT), dismissedFactIds: ['like:music'], neutralRequested: false }
  const restored = normalizeMemoryContext(stored, AT)
  assert.deepEqual(restored.dismissedFactIds, ['like:music'])
  ok()
}

// 3) …and expires with the day: tomorrow is a clean slate
{
  const yesterday = { version: MEMORY_CONTEXT_VERSION, dayKey: dayKeyFor(AT), dismissedFactIds: ['like:music'], neutralRequested: true }
  const fresh = normalizeMemoryContext(yesterday, TOMORROW)
  assert.deepEqual(fresh.dismissedFactIds, [], 'yesterday\'s "not today" has expired')
  assert.equal(fresh.neutralRequested, false)
  assert.equal(fresh.dayKey, dayKeyFor(TOMORROW))
  ok()
}

// 4) corrupt or foreign storage behaves like a fresh day, never like a crash
{
  for (const junk of [null, undefined, 'x', 42, [], { version: 99 }, { version: MEMORY_CONTEXT_VERSION }]) {
    const context = normalizeMemoryContext(junk, AT)
    assert.deepEqual(context.dismissedFactIds, [])
    assert.equal(context.dayKey, dayKeyFor(AT))
  }
  const noisy = normalizeMemoryContext({ version: MEMORY_CONTEXT_VERSION, dayKey: dayKeyFor(AT), dismissedFactIds: ['a', 'a', '', 7, 'x'.repeat(200)] }, AT)
  assert.deepEqual(noisy.dismissedFactIds, ['a'])
  ok()
}

// 5) declining a topic offers the NEXT one, and never the same one again today
{
  const model = createLearnerModel()
  recordLearnerFact(model, { type: 'like', value: 'music', atMs: AT })
  recordLearnerFact(model, { type: 'like', value: 'movies', atMs: AT })
  recordLearnerFact(model, { type: 'like', value: 'games', atMs: AT })

  const dismissed = ['like:music']
  for (let i = 0; i < 8; i++) {
    const picked = selectLearnerFact(model, { seed: `s${i}`, atMs: AT, dismissedIds: dismissed })
    assert.ok(picked, 'there are still topics left')
    assert.notEqual(picked.value.toLowerCase(), 'music', 'the declined topic must not come straight back')
  }
  ok()
}

// 6) declining everything simply means the neutral context
{
  const model = createLearnerModel()
  recordLearnerFact(model, { type: 'like', value: 'music', atMs: AT })
  recordLearnerFact(model, { type: 'like', value: 'movies', atMs: AT })
  const all = ['like:music', 'like:movies']
  assert.equal(selectLearnerFact(model, { seed: 's', atMs: AT, dismissedIds: all }), null)
  const context = getFactContext(model, { interestContext: getInterestContext([], 'seed'), seed: 's', atMs: AT, dismissedIds: all })
  assert.equal(context.source, 'neutral')
  ok()
}

// 7) …and a chosen interest still works when every FACT was declined
{
  const model = createLearnerModel()
  recordLearnerFact(model, { type: 'like', value: 'music', atMs: AT })
  const context = getFactContext(model, { interestContext: getInterestContext(['games'], 'seed'), seed: 's', atMs: AT, dismissedIds: ['like:music'] })
  assert.equal(context.source, 'interest')
  ok()
}

/*
 * 8) the crucial one: declining changes NOTHING about the learner. The fact
 *    survives with its confidence intact, no dislike appears, and activity
 *    preferences are untouched — this is about a topic, not about an activity.
 */
{
  const model = createLearnerModel()
  recordLearnerFact(model, { type: 'like', value: 'music', sourceEpisodeId: 'what_you_like', atMs: AT })
  const before = JSON.parse(JSON.stringify(model))
  selectLearnerFact(model, { seed: 's', atMs: AT, dismissedIds: ['like:music'] })
  assert.deepEqual(factsOfType(model, 'like'), factsOfType(before, 'like'), 'the fact is untouched')
  assert.equal(factsOfType(model, 'like')[0].confidence, before.learnerFacts[0].confidence)
  assert.deepEqual(factsOfType(model, 'dislike'), [], 'declining a topic is not a dislike')
  assert.deepEqual(model.activityPreferences, before.activityPreferences, 'and says nothing about the activity')
  assert.deepEqual(model.signalLog, before.signalLog, 'it is not an activity signal at all')
  ok()
}

// 9) the dismissal is stored beside the day, never inside the learner model
{
  const source = read('src/learning/engine/memoryContext.js')
  assert.match(source, /export const MEMORY_CONTEXT_KEY = 'lc2-memory-context-v1'/)
  assert.ok(!/learnerFacts|activityPreferences|episodeRuns/.test(source),
    'the memory context must not reach into the learner model')
  const room = read('src/components/layout/ConversationRoom.jsx')
  assert.match(room, /dismissFact\(rememberedFact\)/, 'the choice must be persisted, not held in a mount')
  assert.ok(!/useState\(false\)[\s\S]{0,80}factDismissed/.test(room), 'the old mount-only flag must be gone')
  const context = read('src/context/AppContext.jsx')
  assert.match(context, /dismissedFactIds: loadMemoryContext\(\)\.dismissedFactIds/,
    'today\'s plan must respect what was declined today')
  ok()
}

/* ---------- 2. the mini story ---------- */

// 10) every story is a real, bounded scene with one decision and one reply
{
  for (const objective of STORY_OBJECTIVES) {
    const story = getStory(objective)
    const turns = storyTurns(story)
    assert.ok(turns.length >= 5 && turns.length <= 7, `${objective}: 5–7 interactions, got ${turns.length}`)
    assert.equal(turns.filter(t => t.kind === 'choose').length, 1, `${objective}: exactly one decision`)
    assert.equal(turns.filter(t => t.kind === 'reply').length, 1, `${objective}: exactly one produced sentence`)
    assert.equal(turns.at(-1).kind, 'close', `${objective}: must end`)
    const choose = turns.find(t => t.kind === 'choose')
    assert.deepEqual(choose.options.map(o => o.branch), STORY_BRANCHES, `${objective}: two branches, both named`)
    for (const option of choose.options) {
      assert.ok(option.textEn && option.textEn.length <= 30, `${objective}: options stay short`)
    }
  }
  ok()
}

// 11) both endings are comparable — same objective, same length, real text
{
  for (const objective of STORY_OBJECTIVES) {
    const story = getStory(objective)
    const branching = storyTurns(story).filter(t => t.byBranch)
    assert.ok(branching.length >= 1, `${objective}: the decision must change something`)
    for (const turn of branching) {
      const a = turnText(turn, 'accept')
      const b = turnText(turn, 'decline')
      assert.ok(a && b, `${objective}: both endings must exist`)
      assert.notEqual(a, b, `${objective}: the endings must differ`)
      assert.ok(Math.abs(a.split(' ').length - b.split(' ').length) <= 4, `${objective}: comparable length`)
    }
    assert.equal(story.objective, objective, 'both branches serve the same objective')
  }
  ok()
}

// 12) the story advances, ends, and never runs past its last turn
{
  const story = getStory('express_like')
  let state = createStoryState(story, { seed: 'x', branch: 'accept' })
  assert.equal(state.currentTurn, 0)
  for (let i = 0; i < storyLength(story) + 5; i++) state = advanceStory(state, story)
  assert.equal(state.currentTurn, storyLength(story) - 1, 'the last turn is the last turn')
  assert.equal(isStoryFinished(state, story), true)
  ok()
}

// 13) reload resumes exactly, and never regenerates the branch
{
  const story = getStory('express_want')
  const state = { storyId: story.storyId, objective: story.objective, currentTurn: 3, branchId: 'decline', seed: 'seed-1' }
  const restored = normalizeStoryState(state, story)
  assert.deepEqual(restored, { ...state })
  // a story from a different block is not resumed into this one
  assert.equal(normalizeStoryState({ ...state, storyId: 'someone_else' }, story), null)
  // and junk is clamped rather than crashing
  const clamped = normalizeStoryState({ ...state, currentTurn: 999, branchId: 'sideways' }, story)
  assert.equal(clamped.currentTurn, storyLength(story) - 1)
  assert.equal(clamped.branchId, null)
  ok()
}

// 14) the branch is seeded, so the same block always tells the same story
{
  const runs = new Set(Array.from({ length: 20 }, () => defaultBranch('block:2026-05-20')))
  assert.equal(runs.size, 1, 'a reload must not flip the story')
  assert.ok(STORY_BRANCHES.includes(defaultBranch('anything')))
  ok()
}

// 15) it has its own renderer — it is no longer borrowing the free-reply turn
{
  const runner = read('src/components/session/SessionRunner.jsx')
  assert.match(runner, /<MiniStory key=\{block\.id\}/, 'a story block renders the story')
  assert.match(runner, /format !== 'mini_story'/, 'and is excluded from the generic open-text turn')
  const story = read('src/components/session/MiniStory.jsx')
  assert.match(story, /role="radiogroup"/, 'the decision is a real radio group')
  assert.match(story, /role="radio" aria-checked=/)
  assert.match(story, /aria-live="polite"/, 'and it announces what happens')
  assert.match(story, /lang="en" dir="ltr"/, 'English target text stays LTR inside an RTL page')
  assert.match(story, /evaluateEpisodeResponse\(/, 'the free reply uses the SAME hybrid evaluator')
  assert.ok(!/Math\.random/.test(story), 'nothing about a story may be random')
  assert.match(story, /localStorage\.setItem\(STORY_STORAGE_KEY/, 'progress through the story is persisted')
  ok()
}

// 16) every story line is fixed text — no free generation, no unknown grammar
{
  for (const objective of STORY_OBJECTIVES) {
    for (const turn of storyTurns(getStory(objective))) {
      for (const branch of STORY_BRANCHES) {
        const text = turnText(turn, branch)
        if (!text) continue
        assert.ok(text.length <= 70, `${objective}: a story line stays short (${text})`)
        for (const placeholder of text.match(/\{(\w+)\}/g) || []) {
          assert.ok(['{name}', '{partner}', '{noun}', '{place}', '{activity}'].includes(placeholder),
            `${objective}: unknown placeholder ${placeholder}`)
        }
      }
    }
  }
  ok()
}

// 17) all of its text is localizable, in every gated locale
{
  const keys = ['storyBadge', 'storyTitle', 'storyNoteScene', 'storyNoteClose', 'storyChooseReply',
    'storyReplyLike', 'storyReplyWant', 'storyReplyIntro', 'storyFinish']
  const base = read('src/i18n/translations.js')
  for (const key of keys) assert.ok(new RegExp(`^\\s*${key}:`, 'm').test(base), `${key} missing from base`)
  for (const locale of ['es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']) {
    const src = read(`src/i18n/locales/${locale}.js`)
    for (const key of keys) assert.ok(src.includes(`${key}:`), `${key} missing from ${locale}`)
  }
  ok()
}

// 18) the planner only offers a story where a story actually exists
{
  const { formatSupportsObjective, BLOCK_CANDIDATES } = await import('../src/learning/engine/formatChoice.js')
  assert.ok(BLOCK_CANDIDATES.extra_practice.includes('mini_story'), 'a story must be plannable at all')
  for (const objective of STORY_OBJECTIVES) {
    assert.ok(formatSupportsObjective('mini_story', objective), `${objective} has a story, so it may be offered`)
  }
  for (const objective of ['full_intro_conversation', 'simple_plan_conversation', 'ask_name']) {
    assert.equal(formatSupportsObjective('mini_story', objective), false,
      `${objective} has no story of its own and must not be handed someone else's`)
  }
  ok()
}

console.log(`check-memory-and-story — OK  (${n} groups verified)`)
