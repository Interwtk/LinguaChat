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
  advanceStory, isStoryFinished, defaultBranch, STORY_BRANCHES, storyBranches, storyHome, STORY_OBJECTIVES,
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
  /*
   * What matters is that the plan is built from what was declined today, not
   * the shape of the expression that reads it: the same context now also
   * carries the declined TOPICS, so it reads the memory once into a local.
   * Both are asserted, and the second one is new.
   */
  assert.match(context, /loadMemoryContext\(\)/, 'the plan must read the day\'s memory context')
  assert.match(context, /dismissedFactIds: (loadMemoryContext\(\)|memory)\.dismissedFactIds/,
    'today\'s plan must respect what was declined today')
  assert.match(context, /dismissedTopics: memory\.dismissedTopicIds/,
    'and a topic declined today must not be the topic it promises')
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
    /*
     * A session block asks for exactly one sentence — it is one block of a
     * short day. A story an EPISODE hosts has room for a real exchange, so it
     * may ask for two; more than that is a lesson, not a scene.
     */
    const replies = turns.filter(t => t.kind === 'reply').length
    if (storyHome(story) === 'episode') {
      assert.ok(replies >= 1 && replies <= 2, `${objective}: an episode story asks for one or two sentences, got ${replies}`)
    } else {
      assert.equal(replies, 1, `${objective}: a session story asks for exactly one produced sentence`)
    }
    assert.equal(turns.at(-1).kind, 'close', `${objective}: must end`)
    const choose = turns.find(t => t.kind === 'choose')
    /*
     * Two branches, both named — but a story declares WHICH two. The repair
     * story's endings are two strategies rather than accepting or declining,
     * and neither is the better one.
     */
    assert.deepEqual(choose.options.map(o => o.branch), storyBranches(getStory(objective)),
      `${objective}: two branches, both named`)
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
      const [first, second] = storyBranches(story)
      const a = turnText(turn, first, story)
      const b = turnText(turn, second, story)
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
      for (const branch of storyBranches(getStory(objective))) {
        const text = turnText(turn, branch, getStory(objective))
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

/*
 * 18) the planner offers exactly the stories that belong to a session.
 *
 * This used to read "every story is plannable", which was true while every story
 * lived in the daily session. It is now the wrong rule: a story may declare
 * `home: 'episode'`, and the repair story is one — it is a step inside episode
 * 15, with the episode's own partner, support level and progress. Handing it to
 * the planner as a standalone block would drop the learner into the middle of a
 * conversation that the surrounding episode had set up.
 *
 * So the rule is now two-sided and strictly narrower: session stories MUST be
 * plannable, episode stories MUST NOT be.
 */
{
  const { formatSupportsObjective, BLOCK_CANDIDATES } = await import('../src/learning/engine/formatChoice.js')
  const { storyHome, getStory, sessionStoryObjectives } = await import('../src/learning/engine/miniStory.js')
  assert.ok(BLOCK_CANDIDATES.extra_practice.includes('mini_story'), 'a story must be plannable at all')

  const sessionStories = sessionStoryObjectives()
  const episodeStories = STORY_OBJECTIVES.filter(o => storyHome(getStory(o)) === 'episode')
  assert.ok(sessionStories.length >= 3, 'the daily session must still have stories of its own')
  assert.ok(episodeStories.includes('repair_request'), 'the repair story is hosted by episode 15')
  assert.equal(sessionStories.length + episodeStories.length, STORY_OBJECTIVES.length, 'every story has a home')

  for (const objective of sessionStories) {
    assert.ok(formatSupportsObjective('mini_story', objective), `${objective} is a session story, so it may be offered`)
  }
  for (const objective of episodeStories) {
    assert.equal(formatSupportsObjective('mini_story', objective), false,
      `${objective} is hosted by an episode and must never be planned as a loose block`)
  }
  for (const objective of ['full_intro_conversation', 'simple_plan_conversation', 'ask_name']) {
    assert.equal(formatSupportsObjective('mini_story', objective), false,
      `${objective} has no story of its own and must not be handed someone else's`)
  }

  /*
   * AND AN OBJECTIVE NOBODY HAS HEARD OF FAILS CLOSED, which is the systemic half
   * of the same defect and the reason the three names above kept having to be
   * listed by hand.
   *
   * `formatSupportsObjective` used to `return true` for anything absent from its
   * table — "never block a format" — and `getStory` used to answer an unknown
   * objective with `STORIES.express_like`. Together: any objective an arc had not
   * registered could be planned as a story and rendered as the café scene about
   * music, then graded on a completely different sentence. A1 arcs 1 and 2 both
   * shipped intents in exactly that state.
   *
   * The invariant is now general rather than a list: a format that needs content
   * written for the objective is refused when the objective is unknown, and a
   * missing story is `null`.
   */
  const { hasStory } = await import('../src/learning/engine/miniStory.js')
  const STRANGERS = ['totally_made_up_objective', 'ask_location', 'state_price',
    /*
     * `arrange_meeting` used to belong here — designed-only, no story. It is now
     * wired (LC-INT-001) and has a real story (`episode 38`), so it moved out;
     * `ask_ability`/`state_ability` (arc 6, also newly wired) are real intents
     * with no authored story, the same shape `ask_location`/`introduce_person`
     * already establish above.
     */
    'ask_ability', 'state_ability', 'introduce_person', '', null, undefined]
  for (const stranger of STRANGERS) {
    assert.equal(formatSupportsObjective('mini_story', stranger), false,
      `${String(stranger)} is not a known objective and must not be given a story`)
    assert.equal(getStory(stranger), null,
      `${String(stranger)} must resolve to no story rather than to somebody else's`)
    assert.equal(hasStory(stranger), false)
    /* but it is not blocked from formats that only need a sentence */
    assert.equal(formatSupportsObjective('free_reply', stranger), true,
      `${String(stranger)} must still be practisable as a plain reply`)
    assert.equal(formatSupportsObjective('guided_reply', stranger), true)
  }
  /* the café story is still reachable — by its own objective, and only by it */
  assert.equal(getStory('express_like').storyId, 'cafe_music')
  const cafeOwners = STORY_OBJECTIVES.filter(o => getStory(o).storyId === 'cafe_music')
  assert.deepEqual(cafeOwners, ['express_like'], 'one objective owns the café scene')
  ok()
}

/*
 * A STORY REPLY IS EVALUATED LIKE A STEP, SO IT NEEDS THE SAME FIELDS.
 *
 * Found by playing A1 arc 4's story in a browser: its repair turn declares
 * `repairKind: 'repeat'`, the screen modelled "Sorry, can you repeat, please?", and
 * the verdict came back "almost" — because the story path built its evaluation
 * context WITHOUT the turn's own properties, so the evaluator fell back to a
 * different repair strategy and graded a question the learner had not been asked.
 *
 * The same class as arc 2's lost `timeForm` and arc 3's lost `partner`, and the
 * reason this group exists: every objective-specific field a story turn can carry
 * must reach both the local evaluator and the provider payload.
 */
{
  const story = readFileSync(new URL('../src/components/session/MiniStory.jsx', import.meta.url), 'utf8')
  assert.match(story, /const turnFields = \(turn\) =>/, "the story path no longer collects a turn's own fields")
  for (const field of ['repairKind', 'meaningWord', 'placeName', 'relationHint', 'timeForm']) {
    assert.ok(new RegExp(`turn\?\.${field}`).test(story), `a story turn's ${field} is dropped before evaluation`)
  }
  /* and they must reach BOTH paths: the local preview and the remote payload */
  assert.equal((story.match(/\.\.\.turnFields\(turn\)/g) || []).length, 2,
    "the turn's fields must travel to the local context AND the provider payload")
  ok()
}

console.log(`check-memory-and-story — OK  (${n} groups verified)`)
