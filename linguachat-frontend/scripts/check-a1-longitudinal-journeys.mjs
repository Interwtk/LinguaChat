/*
 * check-a1-longitudinal-journeys — LC-PED-002: one continuous new learner,
 * played through the whole integrated sequence — Pre-A1's seventeen episodes
 * followed by A1 arcs 1-7's twenty-one, in curriculum order, one per day.
 *
 * `check-pedagogical-journeys.mjs` proves each of the thirteen completed arcs
 * on its own, and `check-pre-a1-journeys.mjs` proves Pre-A1 alone from empty
 * model to graduation. Neither can prove what only a single uninterrupted
 * run can: that language taught in Pre-A1 is still correctly scheduled,
 * still accumulating real evidence and never silently re-mastered weeks
 * later inside A1 — that a replay of the very first episode is still
 * refused a second reward after five more weeks of play — that support
 * still fades on the evidence the model actually holds once that evidence
 * spans two levels instead of one.
 *
 * A software simulation proves internal consistency, not human learning
 * efficacy — see `docs/research/learning-science-foundation.md`. A1 stays
 * `available:false`; nothing here changes that.
 */
import assert from 'node:assert/strict'

import { ARC as PRE_A1_ARC } from '../src/learning/episodes/index.js'
import { A1_ARC1 } from '../src/learning/episodes/a1Arc1.js'
import { A1_ARC2 } from '../src/learning/episodes/a1Arc2.js'
import { A1_ARC3 } from '../src/learning/episodes/a1Arc3.js'
import { A1_ARC4 } from '../src/learning/episodes/a1Arc4.js'
import { A1_ARC5 } from '../src/learning/episodes/a1Arc5.js'
import { A1_ARC6 } from '../src/learning/episodes/a1Arc6Content.js'
import { A1_ARC_7 as A1_ARC7 } from '../src/learning/episodes/a1Arc7Content.js'
import {
  createLearnerModel, recordItemAttempt, INDEPENDENT_USES_TO_CAN_USE, LEARNING_STATE_RANK,
} from '../src/learning/engine/learnerModel.js'
import { getStory, storyTurns } from '../src/learning/engine/miniStory.js'
import { playEpisode, STRONG, ASSISTED, DAY } from './lib/journey.mjs'

let n = 0
const ok = () => { n++ }

const START = Date.now() - 400 * DAY

/* the full integrated sequence, in the order a real new learner meets it */
const SEQUENCE = [
  ...PRE_A1_ARC.map((ep) => ({ ep, arc: 'pre-a1' })),
  ...A1_ARC1.map((ep) => ({ ep, arc: 'work_and_study' })),
  ...A1_ARC2.map((ep) => ({ ep, arc: 'daily_rhythm' })),
  ...A1_ARC3.map((ep) => ({ ep, arc: 'people_around_you' })),
  ...A1_ARC4.map((ep) => ({ ep, arc: 'finding_your_way' })),
  ...A1_ARC5.map((ep) => ({ ep, arc: 'paying_and_choosing' })),
  ...A1_ARC6.map((ep) => ({ ep, arc: 'what_you_can_do' })),
  ...A1_ARC7.map((ep) => ({ ep, arc: 'making_arrangements' })),
]
assert.equal(SEQUENCE.length, 38, 'Pre-A1 (17) + A1 arcs 1-7 (21) must total 38 episodes')

/* every item a step actually exercises, per episode, in sequence order —
 * the ground truth for how many times a reused item should have been
 * genuinely attempted by the time the whole sequence has been played */
function stepItemIds(ep) {
  const ids = []
  for (const step of ep.steps || []) {
    for (const id of step.itemIds || []) ids.push(id)
    if (step.itemId) ids.push(step.itemId)
    if (step.type === 'mini_story') {
      const story = getStory(step.storyObjective)
      for (const turn of storyTurns(story)) {
        if (turn.kind !== 'reply') continue
        for (const id of turn.itemIds || []) ids.push(id)
      }
    }
  }
  return ids
}

/* items taught in Pre-A1 whose id is exercised again by at least one A1
 * arc's own steps — real cross-level reuse, not a coincidence of naming */
function reusedAcrossLevelBoundary() {
  const preA1Ids = new Set(PRE_A1_ARC.flatMap(stepItemIds))
  const a1Arcs = [A1_ARC1, A1_ARC2, A1_ARC3, A1_ARC4, A1_ARC5, A1_ARC6, A1_ARC7]
  const a1Ids = new Set(a1Arcs.flatMap((arc) => arc.flatMap(stepItemIds)))
  return [...preA1Ids].filter((id) => a1Ids.has(id))
}

function expectedAttempts(itemId) {
  return SEQUENCE.reduce((sum, { ep }) => sum + stepItemIds(ep).filter((id) => id === itemId).length, 0)
}

/* ---- 1) one strong new learner, uninterrupted, Pre-A1 through A1 exit ---- */
const strong = createLearnerModel()
const strongTrace = []
let at = START
for (const { ep } of SEQUENCE) {
  playEpisode(strong, ep.id, { profile: STRONG, atMs: at, trace: strongTrace })
  at += DAY
}
const strongEnd = at
{
  assert.equal(strongTrace.length, 38, 'every episode across both levels must play')
  assert.deepEqual(strongTrace.map((t) => t.episodeId), SEQUENCE.map((s) => s.ep.id), 'in curriculum order')
  for (const record of strongTrace) {
    assert.equal(record.mode, 'first_run', `${record.episodeId}: should be a first run`)
    assert.equal(record.rewarded, true, `${record.episodeId}: a first run through the whole sequence must award`)
  }
  const expectedXp = SEQUENCE.reduce((sum, { ep }) => sum + ep.xp, 0)
  const xp = strongTrace.reduce((sum, t) => sum + t.xp, 0)
  assert.equal(xp, expectedXp, 'total XP must equal the sum of every episode in the sequence')
  ok()
}

/* ---- 2) prerequisite reuse: language Pre-A1 taught, A1 genuinely exercises again ---- */
const reused = reusedAcrossLevelBoundary()
{
  assert.ok(reused.length >= 5, `only ${reused.length} items are reused across the Pre-A1/A1 boundary`)
  for (const itemId of reused) {
    const expected = expectedAttempts(itemId)
    const item = strong.languageItems[itemId]
    assert.ok(item, `${itemId}: taught in Pre-A1 and reused in A1, but has no record after the full sequence`)
    assert.equal(item.correct, expected,
      `${itemId}: expected exactly ${expected} correct attempts across the whole sequence (one per step that names it), got ${item.correct}`)
    assert.ok(item.correct >= 2, `${itemId}: reused in name only — only ${item.correct} real attempt(s) across the whole journey`)
  }
  console.log(`\n  reused across the Pre-A1/A1 boundary: ${reused.join(', ')}`)
  ok()
}

/* ---- 3) no false mastery: a learner who leans on help the whole way through
 * never has language promoted to can_use just because it keeps reappearing ---- */
const assisted = createLearnerModel()
const assistedTrace = []
at = START
for (const { ep } of SEQUENCE) {
  playEpisode(assisted, ep.id, { profile: ASSISTED, atMs: at, trace: assistedTrace })
  at += DAY
}
{
  assert.equal(assistedTrace.length, 38, 'an assisted learner must still be able to finish the whole sequence')
  for (const record of assistedTrace) assert.equal(record.rewarded, true, `${record.episodeId}: leaning on help must not block completion`)
  const assistanceUsed = assistedTrace.reduce((sum, t) => sum + t.assistance, 0)
  assert.ok(assistanceUsed > 0, 'the assisted learner never actually leaned on help')

  for (const itemId of reused) {
    const item = assisted.languageItems[itemId]
    if (!item) continue
    if (LEARNING_STATE_RANK[item.learningState] >= LEARNING_STATE_RANK.can_use) {
      assert.ok((item.independentCorrect || 0) >= INDEPENDENT_USES_TO_CAN_USE,
        `${itemId}: read as can_use with only ${item.independentCorrect} independent production(s) — reappearing across arcs must never substitute for producing it unaided`)
    }
  }
  ok()
}

/* ---- 4) delayed recall across the level boundary: a Pre-A1 item's review
 * schedule survives five weeks and twenty-one more episodes intact, and a
 * genuinely delayed, successful retrieval still moves it further out ---- */
{
  /* an item Pre-A1 teaches early and no A1 arc ever reuses, so its schedule
   * ages untouched for the rest of the whole sequence — reused items get
   * their review refreshed by later arcs, which would not prove this */
  const itemId = 'my_name_is'
  assert.ok(!reused.includes(itemId), `${itemId}: test fixture assumption broke — this item is now reused across levels`)
  const afterWholeSequence = strong.languageItems[itemId]
  assert.ok(afterWholeSequence?.nextReviewAt, `${itemId}: no review scheduled after being taught on day one`)
  const dueAt = new Date(afterWholeSequence.nextReviewAt).getTime()
  assert.ok(dueAt < strongEnd,
    `${itemId}: still not due after 38 days and 21 later episodes — review scheduling should not survive that long unresolved`)
  const correctBefore = afterWholeSequence.correct
  const laterAtMs = strongEnd + 10 * DAY
  recordItemAttempt(strong, itemId, { correct: true, independent: true, evidenceKind: 'open', atMs: laterAtMs })
  const after = strong.languageItems[itemId]
  assert.equal(after.correct, correctBefore + 1, `${itemId}: a delayed retrieval must be recorded as new evidence`)
  assert.ok(new Date(after.nextReviewAt).getTime() > dueAt,
    `${itemId}: a delayed, successful retrieval must push the next review further out, not leave it frozen`)
  ok()
}

/* ---- 5) no duplicate rewards, however much later the replay happens ---- */
{
  const firstEpisodeId = PRE_A1_ARC[0].id
  const before = (strong.episodeRuns[firstEpisodeId] || []).length
  const replay = playEpisode(strong, firstEpisodeId, {
    profile: STRONG, atMs: strongEnd + 20 * DAY,
  })
  assert.equal(replay.rewarded, false, `${firstEpisodeId}: replayed five+ weeks and 37 episodes later must still not pay again`)
  assert.equal(replay.xp, 0)
  assert.equal((strong.episodeRuns[firstEpisodeId] || []).length, before + 1, 'the replay must still be on file as new evidence')
  ok()
}

/* ---- 6) support fades on the evidence held, across the whole sequence ---- */
{
  const tail = strongTrace.slice(-6)
  assert.ok(tail.every((t) => t.finalScaffold === 'low'),
    'by the end of the whole Pre-A1 + A1 sequence a strong learner should finish every episode unaided')
  const supported = strongTrace.slice(3).filter((t) => t.initialScaffold === 'high')
  assert.ok(supported.length <= (strongTrace.length - 3) / 2,
    `a proven longitudinal learner met maximum support in ${supported.length} of ${strongTrace.length - 3} later episodes`)
  for (const t of supported) {
    assert.ok(t.reasonCodes.some((c) => c === 'weak_prerequisites' || c === 'fragile_skill'),
      `${t.episodeId}: opened at maximum support this far into the sequence with nothing to justify it: ${t.reasonCodes.join(',')}`)
  }
  ok()
}

/* ---- 7) the Garden grown across both levels, audited together ---- */
{
  const granted = new Set(SEQUENCE.flatMap(({ ep }) => ep.gardenItems || []))
  const unknown = [...granted].filter((id) => !strong.languageItems[id]?.learningState)
  assert.deepEqual(unknown, [], 'every Garden item across Pre-A1 and A1 must have been met by a learner who played everything')
  const canUseCount = [...granted].filter((id) => strong.languageItems[id]?.learningState === 'can_use').length
  assert.ok(canUseCount >= 20, `only ${canUseCount} of ${granted.size} Garden items reached can_use across the whole sequence`)
  console.log(`\n  garden after the full Pre-A1 + A1 sequence: ${granted.size} items, ${canUseCount} can_use`)
  ok()
}

console.log(`\ncheck-a1-longitudinal-journeys — OK  (${n} longitudinal proofs across ${SEQUENCE.length} episodes / 2 learners)`)
