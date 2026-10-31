/*
 * check-episode-replay — practising something again must be real practice and
 * never a second prize.
 *
 * The rules under test:
 *   - a first completion pays out once; every later run pays out nothing;
 *   - a replay still produces evidence, still records activity, still counts;
 *   - going back for the other ending never rewrites the first decision;
 *   - runs are filed once, bounded, and survive two copies of the model
 *     saving over each other.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getEpisode, ARC } from '../src/learning/episodes/index.js'
import {
  createLearnerModel, setEpisodeState, getEpisodeState, migrateLearnerModel, MODEL_VERSION,
  RUNS_PER_EPISODE, sanitizeRun, sanitizeEpisodeRuns, mergeEpisodeRuns, mergeEpisodeState,
  mergeLearnerFacts, recordCanDoAttempt,
} from '../src/learning/engine/learnerModel.js'
import {
  beginEpisodeRun, completeEpisodeRun, resolveRunMode, runEarnsReward, runsFor, recordRunActivitySignal,
  timesPractised, branchesSeen, otherBranch, lastBranchPlayed, canTryOtherBranch, updateActiveRun, stageDelayedRetrieval,
  RUN_FIRST, RUN_RESUME, RUN_REPLAY, RUN_REVIEW, RUN_BRANCH_REPLAY,
} from '../src/learning/engine/episodeRuns.js'

let n = 0
const ok = () => { n++ }
const AT = new Date('2026-05-20T09:00:00Z').getTime()
const EP9 = getEpisode('make_a_plan')

const completed = (episodeId) => {
  const m = createLearnerModel()
  setEpisodeState(m, episodeId, { status: 'completed', stepIndex: 8, awarded: true })
  return m
}

/*
 * Persisted or imported run flags must be literal booleans. A truthy string
 * like "false" is not evidence of independent learning or a paid reward.
 * Migration and reconciliation must never promote malformed metadata.
 */
{
  const raw = { runId: 'bad-flags', episodeId: 'first_greeting', mode: RUN_REPLAY,
    startedAt: new Date(AT).toISOString(), completedAt: new Date(AT + 1000).toISOString(),
    independentEvidence: 'false', rewarded: 'false' }
  const sanitized = sanitizeRun(raw)
  assert.equal(sanitized.independentEvidence, false)
  assert.equal(sanitized.rewarded, false)
  const imported = sanitizeEpisodeRuns({ first_greeting: [raw] }).first_greeting[0]
  assert.equal(imported.independentEvidence, false)
  assert.equal(imported.rewarded, false)
  const merged = mergeEpisodeRuns({ first_greeting: [raw] }, {}).first_greeting[0]
  assert.equal(merged.independentEvidence, false)
  assert.equal(merged.rewarded, false)
  const valid = sanitizeRun({ ...raw, independentEvidence: true, rewarded: true })
  assert.equal(valid.independentEvidence, true)
  assert.equal(valid.rewarded, true)
  const falseFlags = sanitizeRun({ ...raw, independentEvidence: false, rewarded: false })
  assert.equal(falseFlags.independentEvidence, false)
  assert.equal(falseFlags.rewarded, false)
  ok()
}

// 1) the mode is derived from the episode, never asserted by the caller
{
  const fresh = createLearnerModel()
  assert.equal(resolveRunMode(fresh, 'first_greeting'), RUN_FIRST)

  const midway = createLearnerModel()
  setEpisodeState(midway, 'first_greeting', { status: 'in_progress', stepIndex: 3 })
  assert.equal(resolveRunMode(midway, 'first_greeting'), RUN_RESUME)

  const done = completed('first_greeting')
  assert.equal(resolveRunMode(done, 'first_greeting'), RUN_REPLAY)
  assert.equal(resolveRunMode(done, 'first_greeting', { source: 'daily_session' }), RUN_REVIEW)
  assert.equal(resolveRunMode(done, 'first_greeting', { wantsOtherBranch: true }), RUN_BRANCH_REPLAY)
  ok()
}

// 2) only a first completion may be rewarded
{
  assert.equal(runEarnsReward(RUN_FIRST), true)
  assert.equal(runEarnsReward(RUN_RESUME), true)
  for (const mode of [RUN_REPLAY, RUN_REVIEW, RUN_BRANCH_REPLAY]) {
    assert.equal(runEarnsReward(mode), false, `${mode} must never earn the first-completion reward`)
  }
  ok()
}

/*
 * 3) the whole point, end to end: XP and the garden are paid once, and the
 *    replay still leaves evidence behind.
 */
{
  const m = createLearnerModel()
  const garden = []
  let xp = 0
  const ep = getEpisode('what_you_like')

  const play = (opts = {}) => {
    const run = beginEpisodeRun(m, ep.id, { atMs: AT, ...opts })
    const state = getEpisodeState(m, ep.id)
    const firstCompletion = !state.awarded
    recordCanDoAttempt(m, ep.canDoId, { success: true, independent: true, context: ep.id })
    if (firstCompletion) {
      xp += ep.xp
      for (const id of ep.gardenItems) if (!garden.includes(id)) garden.push(id)
      setEpisodeState(m, ep.id, { status: 'completed', awarded: true, stepIndex: ep.steps.length - 1 })
    } else {
      setEpisodeState(m, ep.id, { status: 'completed', stepIndex: ep.steps.length - 1 })
    }
    completeEpisodeRun(m, { independentEvidence: true, rewarded: firstCompletion, atMs: AT })
    return run.mode
  }

  assert.equal(play(), RUN_FIRST)
  const afterFirst = { xp, garden: garden.length, evidence: m.canDo.express_preferences.successes }
  assert.equal(afterFirst.xp, ep.xp)

  assert.equal(play({ source: 'practice' }), RUN_REPLAY)
  assert.equal(xp, afterFirst.xp, 'a replay must not pay XP again')
  assert.equal(garden.length, afterFirst.garden, 'a replay must not plant the garden again')
  assert.ok(m.canDo.express_preferences.successes > afterFirst.evidence, 'but it must still count as practice')

  assert.equal(play({ source: 'daily_session' }), RUN_REVIEW)
  assert.equal(xp, afterFirst.xp, 'a review must not pay the episode XP either')

  const runs = runsFor(m, ep.id)
  assert.equal(runs.length, 3)
  assert.equal(runs.filter(r => r.rewarded).length, 1, 'exactly one run was ever rewarded')
  assert.equal(timesPractised(m, ep.id), 3)
  ok()
}

// 4) reopening the same episode rejoins the run instead of starting another
{
  const m = completed('what_you_like')
  const first = beginEpisodeRun(m, 'what_you_like', { source: 'practice', atMs: AT })
  const again = beginEpisodeRun(m, 'what_you_like', { source: 'practice', atMs: AT })
  assert.equal(again.runId, first.runId, 'a remount or reload must not split one practice in two')
  // …but asking for the other option IS a different kind of run
  const branch = beginEpisodeRun(m, 'make_a_plan', { source: 'practice', wantsOtherBranch: true, atMs: AT })
  assert.equal(branch.mode, RUN_FIRST, 'an episode never played has nothing to branch from')
  ok()
}

/*
 * 4a) A remount later on the SAME local day rejoins the attempt, but a
 * new calendar day must not reuse yesterday's unfinished practice identity.
 * Otherwise a fresh day's evidence can inherit yesterday's assistance and
 * runId, and a later completion may be mistaken for yesterday's attempt.
 */
{
  const m = completed('what_you_like')
  const first = beginEpisodeRun(m, 'what_you_like', { atMs: AT })
  updateActiveRun(m, { assistanceUsed: 2 })
  const sameDay = beginEpisodeRun(m, 'what_you_like', { atMs: AT + 60 * 60 * 1000 })
  assert.equal(sameDay.runId, first.runId, 'same-day remount rejoins the practice')
  assert.equal(sameDay.assistanceUsed, 2, 'same-day support evidence survives reload')
  const tomorrow = beginEpisodeRun(m, 'what_you_like', { atMs: AT + 24 * 60 * 60 * 1000 })
  assert.notEqual(tomorrow.runId, first.runId, 'next-day replay must have a fresh run ID')
  assert.equal(tomorrow.mode, RUN_REPLAY)
  assert.equal(tomorrow.assistanceUsed, 0, 'a new day must not inherit assistance from yesterday')

  const midway = createLearnerModel()
  const initial = beginEpisodeRun(midway, 'first_greeting', { atMs: AT })
  setEpisodeState(midway, 'first_greeting', { status: 'in_progress', stepIndex: 3 })
  const resumed = beginEpisodeRun(midway, 'first_greeting', { atMs: AT + 60 * 60 * 1000 })
  assert.equal(resumed.mode, RUN_RESUME)
  assert.equal(resumed.runId, initial.runId, 'same-day first-to-resume keeps its identity')
  const nextDay = beginEpisodeRun(midway, 'first_greeting', { atMs: AT + 24 * 60 * 60 * 1000 })
  assert.equal(nextDay.mode, RUN_RESUME, 'episode progress is still resumed')
  assert.notEqual(nextDay.runId, initial.runId, 'cross-day first-to-resume is a new attempt')
  assert.equal(getEpisodeState(midway, 'first_greeting').stepIndex, 3, 'episode progress must not reset')
  ok()
}

// 5) completing is idempotent, however many times the button is pressed
{
  const m = completed('what_you_like')
  beginEpisodeRun(m, 'what_you_like', { atMs: AT })
  const a = completeEpisodeRun(m, { atMs: AT })
  const b = completeEpisodeRun(m, { atMs: AT })
  assert.ok(a && !b, 'there is nothing left to complete the second time')
  assert.equal(runsFor(m, 'what_you_like').length, 1)
  assert.equal(m.activeRun, null)
  ok()
}

/*
 * 5a) A stale in-memory copy of an already-filed run must not credit the
 * same can-do twice. This can happen after a tab restores an old activeRun
 * while the completed history has already been reconciled into the model.
 */
{
  const m = completed('first_greeting')
  beginEpisodeRun(m, 'first_greeting', { atMs: AT })
  const staleActive = JSON.parse(JSON.stringify(m.activeRun))
  const first = completeEpisodeRun(m, { canDoId: 'introduce_self', independentEvidence: true, sessionId: 'session-a', atMs: AT })
  assert.equal(m.canDo.introduce_self.attempts, 1)
  m.activeRun = staleActive
  const again = completeEpisodeRun(m, { canDoId: 'introduce_self', independentEvidence: true, sessionId: 'session-a', atMs: AT })
  assert.equal(again?.runId, first.runId, 'a previously completed run is returned without replaying its evidence')
  assert.equal(m.canDo.introduce_self.attempts, 1, 'stale completion must not grant a second can-do attempt')
  assert.equal(m.canDo.introduce_self.independentSuccesses, 1, 'stale completion must not grant a second independent success')
  assert.equal(runsFor(m, 'first_greeting').length, 1)
  assert.equal(m.activeRun, null, 'the stale active pointer is discarded')
  ok()
}

/*
 * 5b) Reopening after a completed run must start a NEW attempt even if an
 * old activeRun pointer is restored. Otherwise the next real practice would
 * overwrite the previous history entry under the same runId.
 */
{
  const m = completed('first_greeting')
  const first = beginEpisodeRun(m, 'first_greeting', { atMs: AT })
  completeEpisodeRun(m, { atMs: AT })
  m.activeRun = JSON.parse(JSON.stringify(first))
  const next = beginEpisodeRun(m, 'first_greeting', { atMs: AT })
  assert.notEqual(next.runId, first.runId, 'a filed run cannot be rejoined as active')
  assert.equal(next.mode, RUN_REPLAY)
  completeEpisodeRun(m, { atMs: AT })
  assert.equal(runsFor(m, 'first_greeting').length, 2, 'the old and new practices must both survive')
  ok()
}

/*
 * 5c) A completion saved before its run-history row is filed can leave an
 * old active first-run pointer alongside a completed episode state. The next
 * practice must not recycle that unfiled runId (or later deduplication would
 * silently erase one of the two attempts).
 */
{
  const m = createLearnerModel()
  const first = beginEpisodeRun(m, 'first_greeting', { atMs: AT })
  setEpisodeState(m, 'first_greeting', { status: 'completed', stepIndex: 8, awarded: true })
  const replay = beginEpisodeRun(m, 'first_greeting', { atMs: AT })
  assert.equal(replay.mode, RUN_REPLAY)
  assert.notEqual(replay.runId, first.runId, 'a stale unfiled active run reserves its ID')
  assert.equal(replay.runId, first.runId.replace(/:1$/, ':2'))
  completeEpisodeRun(m, { atMs: AT })
  assert.equal(runsFor(m, 'first_greeting')[0].runId, replay.runId)
  ok()
}

// 6) the other ending: offered, taken, and the first decision left intact
{
  const m = completed('make_a_plan')
  m.facts = { 'branch:make_a_plan': 'accept' }
  assert.equal(canTryOtherBranch(m, EP9), true)
  assert.equal(otherBranch(m, EP9), 'decline')

  const run = beginEpisodeRun(m, EP9.id, { source: 'practice', wantsOtherBranch: true, branchPreference: 'decline', atMs: AT })
  assert.equal(run.mode, RUN_BRANCH_REPLAY)
  updateActiveRun(m, { branchId: 'decline' })
  completeEpisodeRun(m, { branchId: 'decline', rewarded: false, atMs: AT })

  assert.equal(m.facts['branch:make_a_plan'], 'accept', 'the original story must not be rewritten')
  assert.deepEqual(branchesSeen(m, EP9.id).sort(), ['accept', 'decline'])

  /*
   * With both endings seen the offer must ALTERNATE away from the last one
   * played. Comparing against the original decision instead pinned it to one
   * ending forever, so the first ending could never be practised again.
   */
  assert.equal(lastBranchPlayed(m, EP9.id), 'decline')
  assert.equal(otherBranch(m, EP9), 'accept', 'after declining, offer accepting again')

  beginEpisodeRun(m, EP9.id, { source: 'practice', wantsOtherBranch: true, branchPreference: 'accept', atMs: AT })
  completeEpisodeRun(m, { branchId: 'accept', rewarded: false, atMs: AT })
  assert.equal(lastBranchPlayed(m, EP9.id), 'accept')
  assert.equal(otherBranch(m, EP9), 'decline', 'and back again — the offer keeps meaning something')
  ok()
}

// 7) an episode with no story offers no branch practice
{
  const m = completed('first_greeting')
  assert.equal(canTryOtherBranch(m, getEpisode('first_greeting')), false)
  assert.equal(otherBranch(m, getEpisode('first_greeting')), null)
  ok()
}

// 8) the history is bounded and never keeps two runs with the same id
{
  const m = completed('what_you_like')
  for (let i = 0; i < RUNS_PER_EPISODE + 8; i++) {
    m.activeRun = sanitizeRun({ runId: `r-${i}`, episodeId: 'what_you_like', mode: RUN_REPLAY, source: 'practice', startedAt: 'x' })
    completeEpisodeRun(m, { atMs: AT })
  }
  const runs = runsFor(m, 'what_you_like')
  assert.equal(runs.length, RUNS_PER_EPISODE)
  assert.equal(new Set(runs.map(r => r.runId)).size, RUNS_PER_EPISODE)
  assert.ok(runs.every(r => !('learnerResponse' in r) && !('answers' in r)), 'a run stores counts, never answers')
  ok()
}

/*
 * 8a) Several distinct runs may start in the SAME millisecond (rapid
 * replay, restored tabs or imported snapshots). A timestamp tie is not
 * permission to let array/merge order decide which 12 practices survive.
 * Generated run IDs carry a per-day attempt sequence that resolves the tie.
 */
{
  const id = 'what_you_like'
  const make = (i) => sanitizeRun({
    runId: `${id}:2026-05-20:${i}`, episodeId: id, mode: RUN_REPLAY,
    startedAt: new Date(AT).toISOString(),
    completedAt: new Date(AT + 500).toISOString(),
    branchId: i % 2 ? 'accept' : 'decline',
  })
  const all = Array.from({ length: RUNS_PER_EPISODE + 8 }, (_, i) => make(i + 1))
  const expected = all.slice(-RUNS_PER_EPISODE).map(r => r.runId)
  for (const order of [all, [...all].reverse()]) {
    assert.deepEqual(sanitizeEpisodeRuns({ [id]: order })[id].map(r => r.runId), expected,
      'same-timestamp sanitization must retain the highest generated attempt numbers')
  }
  const old = all.slice(0, RUNS_PER_EPISODE)
  const fresh = all.slice(-RUNS_PER_EPISODE)
  for (const [a, b] of [[old, fresh], [fresh, old]]) {
    const merged = mergeEpisodeRuns({ [id]: a }, { [id]: b })[id]
    assert.deepEqual(merged.map(r => r.runId), expected,
      'same-timestamp stale merge must keep the most recent attempt sequence')
    assert.deepEqual(mergeEpisodeRuns({ [id]: merged }, { [id]: old })[id].map(r => r.runId), expected,
      'a repeated stale merge must not change the retained attempts')
  }
  const model = completed(id)
  model.episodeRuns[id] = sanitizeEpisodeRuns({ [id]: [make(2), make(1)] })[id]
  assert.equal(lastBranchPlayed(model, id), 'decline',
    'last branch must come from the latest numbered attempt, not input order')
  ok()
}

// 9) corrupt, duplicated and foreign runs are dropped, not rendered
{
  const dirty = sanitizeEpisodeRuns({
    what_you_like: [
      { runId: 'a', episodeId: 'what_you_like', mode: 'nonsense', source: 'space', assistanceUsed: -4, formatsUsed: ['made_up', 'roleplay'] },
      { runId: 'a', episodeId: 'what_you_like' },                       // duplicate id
      { runId: 'b', episodeId: 'someone_else' },                        // wrong episode
      null, 'x', 42,
    ],
    '': [{ runId: 'c', episodeId: '' }],
  })
  assert.deepEqual(Object.keys(dirty), ['what_you_like'])
  assert.equal(dirty.what_you_like.length, 1)
  const run = dirty.what_you_like[0]
  assert.equal(run.mode, 'replay', 'an unknown mode falls back to plain practice')
  assert.equal(run.assistanceUsed, 0)
  assert.deepEqual(run.formatsUsed, ['roleplay'])
  assert.equal(sanitizeRun({ episodeId: 'x' }), null, 'a run with no id is not a run')
  ok()
}

/* A single persisted snapshot may contain both a stale unfinished copy and
 * the completed copy of one attempt. Migration must keep the completion in
 * either order, before cross-snapshot reconciliation even begins. */
{
  const episodeId = 'what_you_like'
  const common = {
    runId: 'same-attempt', episodeId, mode: RUN_REPLAY,
    startedAt: '2026-05-20T09:00:00Z',
  }
  const unfinished = sanitizeRun({ ...common, completedAt: null, assistanceUsed: 9,
    signalKeys: ['2:assistance'] })
  const completed = sanitizeRun({ ...common, completedAt: '2026-05-20T09:10:00Z',
    assistanceUsed: 1, signalKeys: ['3:assistance'], independentEvidence: true })
  for (const runs of [[unfinished, completed], [completed, unfinished]]) {
    const kept = sanitizeEpisodeRuns({ [episodeId]: runs })[episodeId]
    assert.equal(kept.length, 1)
    assert.equal(kept[0].completedAt, completed.completedAt,
      'the filed completion must win over an unfinished duplicate')
    assert.equal(kept[0].assistanceUsed, 1,
      'stale unfinished assistance must not overwrite filed evidence')
    assert.equal(kept[0].independentEvidence, true)
    const merged = mergeEpisodeRuns({ [episodeId]: runs }, {})[episodeId]
    assert.equal(merged[0].completedAt, completed.completedAt)
  }
  ok()
}

/* Duplicate completed copies can already coexist inside ONE stored snapshot.
 * Sanitization must not discard complementary evidence before the cross-tab
 * merge has a chance to reconcile it. Reward is a monotonic fact too. */
{
  const episodeId = 'what_you_like'
  const common = {
    runId: 'completed-duplicate', episodeId, mode: RUN_REPLAY,
    startedAt: '2026-05-20T09:00:00Z', completedAt: '2026-05-20T09:10:00Z',
  }
  const helped = sanitizeRun({ ...common, assistanceUsed: 1,
    signalKeys: ['2:assistance'], formatsUsed: ['choice'], rewarded: true })
  const retried = sanitizeRun({ ...common, retriedSteps: 1,
    signalKeys: ['3:retried'], formatsUsed: ['free_reply'], independentEvidence: true })
  for (const copies of [[helped, retried], [retried, helped]]) {
    const kept = sanitizeEpisodeRuns({ [episodeId]: copies })[episodeId]
    assert.equal(kept.length, 1)
    assert.equal(kept[0].completedAt, common.completedAt)
    assert.equal(kept[0].assistanceUsed, 1)
    assert.equal(kept[0].retriedSteps, 1)
    assert.equal(kept[0].independentEvidence, true)
    assert.equal(kept[0].rewarded, true)
    assert.deepEqual(new Set(kept[0].signalKeys), new Set(['2:assistance', '3:retried']))
    assert.deepEqual(new Set(kept[0].formatsUsed), new Set(['choice', 'free_reply']))
    assert.deepEqual(sanitizeEpisodeRuns({ [episodeId]: [kept[0], ...copies] })[episodeId][0], kept[0],
      're-sanitizing the same copies must not inflate evidence')
  }
  const unfinishedRewarded = sanitizeRun({
    ...common, completedAt: null, rewarded: true,
    assistanceUsed: 9, signalKeys: ['4:assistance'],
  })
  const filed = sanitizeRun({ ...common, rewarded: false,
    assistanceUsed: 1, signalKeys: ['2:assistance'] })
  for (const copies of [[unfinishedRewarded, filed], [filed, unfinishedRewarded]]) {
    const kept = sanitizeEpisodeRuns({ [episodeId]: copies })[episodeId][0]
    assert.equal(kept.completedAt, filed.completedAt)
    assert.equal(kept.assistanceUsed, 1, 'unfinished evidence cannot rewrite completion')
    assert.deepEqual(kept.signalKeys, ['2:assistance'])
    assert.equal(kept.rewarded, true, 'a previously paid reward cannot be forgotten')
  }
  ok()
}

/* Two completed copies of the same attempt can have different completion
 * timestamps (a delayed callback or stale tab). The earliest real completion
 * must remain authoritative regardless of import/merge order. Timezone offsets
 * make string ordering an unsafe shortcut; activity evidence still unions. */
{
  const id = 'what_you_like'
  const common = { runId: 'completion-time-race', episodeId: id, mode: RUN_REPLAY,
    startedAt: '2026-05-20T09:00:00Z' }
  const first = sanitizeRun({ ...common, completedAt: '2026-05-20T09:10:00Z',
    assistanceUsed: 1, signalKeys: ['2:assistance'] })
  const delayed = sanitizeRun({ ...common, completedAt: '2026-05-20T05:11:00-04:00',
    retriedSteps: 1, signalKeys: ['3:retried'] })
  for (const [a, b] of [[first, delayed], [delayed, first]]) {
    const imported = sanitizeEpisodeRuns({ [id]: [a, b] })[id][0]
    const merged = mergeEpisodeRuns({ [id]: [a] }, { [id]: [b] })[id][0]
    for (const run of [imported, merged]) {
      assert.equal(run.completedAt, first.completedAt,
        'the first completion must survive a later duplicate in either order')
      assert.equal(run.assistanceUsed, 1)
      assert.equal(run.retriedSteps, 1)
      assert.deepEqual(new Set(run.signalKeys), new Set(['2:assistance', '3:retried']))
    }
    const repeated = mergeEpisodeRuns({ [id]: [merged] }, { [id]: [delayed] })[id][0]
    assert.equal(repeated.completedAt, first.completedAt,
      'a stale duplicate cannot move an already reconciled completion time')
  }
  ok()
}

/* The 100-marker retention window must be independent of merge order.
 * A stale completed snapshot cannot reintroduce old markers and evict newer
 * step evidence just because its array is read second. */
{
  const episodeId = 'what_you_like'
  const common = { runId: 'bounded-merge', episodeId, mode: RUN_REPLAY,
    startedAt: '2026-05-20T09:00:00Z', completedAt: '2026-05-20T09:10:00Z' }
  const keys = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => `${from + i}:assistance`)
  const old = sanitizeRun({ ...common, assistanceUsed: 100, signalKeys: keys(1, 100) })
  const fresh = sanitizeRun({ ...common, assistanceUsed: 100, signalKeys: keys(51, 150) })
  const expected = keys(51, 150)
  for (const [a, b] of [[old, fresh], [fresh, old]]) {
    const merged = mergeEpisodeRuns({ [episodeId]: [a] }, { [episodeId]: [b] })[episodeId][0]
    assert.deepEqual(merged.signalKeys, expected,
      'bounded evidence must retain newest step markers in either merge order')
    const imported = sanitizeEpisodeRuns({ [episodeId]: [a, b] })[episodeId][0]
    assert.deepEqual(imported.signalKeys, expected,
      'migration must apply the same bounded reconciliation')
    const repeated = mergeEpisodeRuns({ [episodeId]: [merged] }, { [episodeId]: [old] })[episodeId][0]
    assert.deepEqual(repeated.signalKeys, expected,
      'replaying a stale completed snapshot must not evict newer markers')
  }
  ok()
}

/*
 * An unsorted imported run can contain more than 100 distinct markers before
 * any cross-tab merge. Truncate by step chronology, not array insertion order.
 * A late signal outside the retained window must not inflate help counters.
 */
{
  const episodeId = 'what_you_like'
  const keys = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => `${from + i}:assistance`)
  const newest = keys(51, 150)
  const outOfOrder = [...newest, ...keys(1, 50)]
  const raw = {
    runId: 'unsorted-import', episodeId, mode: RUN_REPLAY,
    startedAt: '2026-05-20T09:00:00Z', completedAt: '2026-05-20T09:10:00Z',
    signalKeys: outOfOrder, assistanceUsed: 150,
  }
  assert.notDeepEqual(outOfOrder.slice(-100), newest,
    'the old insertion-order truncation must reproduce the lost evidence')
  assert.deepEqual(sanitizeRun(raw).signalKeys, newest,
    'sanitizing one unsorted run must keep the highest step markers')
  assert.deepEqual(sanitizeEpisodeRuns({ [episodeId]: [raw] })[episodeId][0].signalKeys, newest,
    'migration must not discard newer markers before reconciliation')
  const model = completed(episodeId)
  beginEpisodeRun(model, episodeId, { atMs: AT })
  updateActiveRun(model, { signalKeys: newest, assistanceUsed: 100 })
  assert.equal(recordRunActivitySignal(model, {
    kind: 'assistance', format: 'choice', key: '1:assistance',
  }), null, 'a late marker outside the window cannot be deduplicated and must be ignored')
  assert.deepEqual(model.activeRun.signalKeys, newest)
  assert.equal(model.activeRun.assistanceUsed, 100, 'late duplicate must not inflate assistance')
  const later = recordRunActivitySignal(model, {
    kind: 'assistance', format: 'choice', key: '151:assistance',
  })
  assert.ok(later, 'a genuinely newer step is still recorded')
  assert.deepEqual(later.signalKeys, keys(52, 151))
  assert.equal(later.assistanceUsed, 101)
  const restored = migrateLearnerModel(JSON.parse(JSON.stringify(model)))
  assert.deepEqual(restored.activeRun.signalKeys, keys(52, 151))
  ok()
}

// 10) two copies of the model saving over each other lose nothing
{
  const mine = { what_you_like: [sanitizeRun({ runId: 'r1', episodeId: 'what_you_like', mode: 'replay', startedAt: 'a' })] }
  const theirs = {
    what_you_like: [
      sanitizeRun({ runId: 'r1', episodeId: 'what_you_like', mode: 'replay', startedAt: 'a', completedAt: 'b', rewarded: true }),
      sanitizeRun({ runId: 'r2', episodeId: 'what_you_like', mode: 'review', startedAt: 'c' }),
    ],
  }
  const merged = mergeEpisodeRuns(mine, theirs)
  assert.equal(merged.what_you_like.length, 2, 'a run only one copy saw is kept')
  const r1 = merged.what_you_like.find(r => r.runId === 'r1')
  assert.equal(r1.completedAt, 'b', 'a completion is a fact; an unfinished snapshot is not')
  assert.equal(r1.rewarded, true, 'and a reward already paid is never forgotten')
  ok()
}

/* Two completed snapshots of one practice can reach storage with distinct
 * activity observations. Their union is evidence of the SAME run, not two
 * separate attempts. An unfinished snapshot remains non-authoritative. */
{
  const id = 'what_you_like'
  const common = { runId: 'merged-completion', episodeId: id, mode: 'replay', startedAt: '2026-05-20T09:00:00Z', completedAt: '2026-05-20T09:10:00Z' }
  const helped = sanitizeRun({ ...common, assistanceUsed: 1, formatsUsed: ['free_reply'], signalKeys: ['2:assistance'] })
  const retried = sanitizeRun({ ...common, retriedSteps: 1, independentEvidence: true, formatsUsed: ['choice'], signalKeys: ['3:retried'] })
  for (const [a, b] of [[helped, retried], [retried, helped]]) {
    const merged = mergeEpisodeRuns({ [id]: [a] }, { [id]: [b] })[id]
    assert.equal(merged.length, 1, 'one run ID must remain one attempt')
    assert.equal(merged[0].assistanceUsed, 1, 'merging copies must not double-count help')
    assert.equal(merged[0].retriedSteps, 1)
    assert.equal(merged[0].independentEvidence, true)
    assert.deepEqual(new Set(merged[0].formatsUsed), new Set(['free_reply', 'choice']))
    assert.deepEqual(new Set(merged[0].signalKeys), new Set(['2:assistance', '3:retried']))
  }
  const helpedAgain = sanitizeRun({ ...common, assistanceUsed: 1, retriedSteps: 1,
    signalKeys: ['5:assistance', '6:retried'] })
  const disjoint = mergeEpisodeRuns({ [id]: [helped] }, { [id]: [helpedAgain] })[id][0]
  assert.equal(disjoint.assistanceUsed, 2, 'two distinct help markers must not collapse to max(1,1)')
  assert.equal(disjoint.retriedSteps, 1)
  const duplicate = mergeEpisodeRuns({ [id]: [helped] }, { [id]: [helped] })[id][0]
  assert.equal(duplicate.assistanceUsed, 1, 'the same help marker must not count twice')
  const stale = sanitizeRun({ ...common, completedAt: null, assistanceUsed: 9, signalKeys: ['4:assistance'] })
  const mergedWithStale = mergeEpisodeRuns({ [id]: [helped] }, { [id]: [stale] })[id][0]
  assert.equal(mergedWithStale.assistanceUsed, 1, 'an unfinished tab cannot change filed evidence')
  assert.deepEqual(mergedWithStale.signalKeys, ['2:assistance'])
  ok()
}

/*
 * Two tabs can each retain the last 12 practices, but one tab may have an
 * older window. A merge must keep the latest 12 by practice time, regardless
 * of which snapshot is passed first. Insertion-order trimming used to evict
 * recent completed runs when stale-only IDs were appended afterward.
 */
{
  const id = 'what_you_like'
  const make = (i) => sanitizeRun({
    runId: `${id}:2026-05-20:${i}`, episodeId: id, mode: RUN_REPLAY,
    startedAt: new Date(AT + i * 1000).toISOString(),
    completedAt: new Date(AT + i * 1000 + 500).toISOString(),
  })
  const stale = Array.from({ length: RUNS_PER_EPISODE }, (_, i) => make(i + 1))
  const fresh = Array.from({ length: RUNS_PER_EPISODE }, (_, i) => make(i + 10))
  for (const [a, b] of [[stale, fresh], [fresh, stale]]) {
    const merged = mergeEpisodeRuns({ [id]: a }, { [id]: b })[id]
    assert.deepEqual(merged.map(r => r.runId), fresh.map(r => r.runId),
      'merging a stale 12-run window must not evict newer completed practices')
    assert.deepEqual(mergeEpisodeRuns({ [id]: merged }, { [id]: stale })[id].map(r => r.runId),
      fresh.map(r => r.runId), 'repeated stale merges must remain stable')
  }
  ok()
}

/*
 * The persisted run list is not guaranteed to arrive in chronological order.
 * Older snapshots may contain >12 runs with newest records at the front.
 * Sanitizing BEFORE reconciliation must keep the newest practices, not the
 * final 12 array positions (which could discard the newest evidence).
 */
{
  const id = 'what_you_like'
  const count = RUNS_PER_EPISODE + 3
  const runs = Array.from({ length: count }, (_, i) => sanitizeRun({
    runId: `out-of-order-${i}`, episodeId: id, mode: RUN_REPLAY,
    startedAt: new Date(AT + i * 1000).toISOString(),
    completedAt: new Date(AT + i * 1000 + 500).toISOString(),
  }))
  const newestFirst = [...runs].reverse()
  const expected = runs.slice(-RUNS_PER_EPISODE).map(r => r.runId)
  const sanitized = sanitizeEpisodeRuns({ [id]: newestFirst })[id]
  assert.deepEqual(sanitized.map(r => r.runId), expected,
    'sanitizing an out-of-order history must keep the newest dated runs')
  assert.deepEqual(mergeEpisodeRuns({ [id]: newestFirst }, { [id]: [] })[id].map(r => r.runId), expected,
    'merge must not lose recent evidence while sanitizing its inputs')
  ok()
}

// 11) episode progress merges forward only — a stale copy cannot un-award
{
  const stale = { what_you_like: { status: 'in_progress', stepIndex: 2, awarded: false } }
  const current = { what_you_like: { status: 'completed', stepIndex: 11, awarded: true } }
  for (const merged of [mergeEpisodeState(stale, current), mergeEpisodeState(current, stale)]) {
    assert.equal(merged.what_you_like.status, 'completed')
    assert.equal(merged.what_you_like.awarded, true, 'XP already paid can never be un-paid by a merge')
    assert.equal(merged.what_you_like.stepIndex, 11, 'progress never goes backwards')
  }
  ok()
}

// 12) migrating an older learner keeps everything and starts a run history
{
  const v4 = {
    version: 4,
    canDo: { introduce_self: { status: 'can_do', attempts: 3, successes: 3, independentSuccesses: 2, contexts: [], lastPracticedAt: 'x' } },
    languageItems: { hi: { status: 'can_do', correct: 3, incorrect: 0, independentCorrect: 2, streak: 2, nextReviewAt: null, lastSeenAt: 'x' } },
    recurringErrors: [{ errorType: 'missing_copula', count: 2 }],
    scaffoldByEpisode: { first_greeting: 'low' },
    episodes: { first_greeting: { status: 'completed', stepIndex: 8, awarded: true } },
    facts: { place: 'Medellín', likes: 'music', 'branch:make_a_plan': 'accept' },
    activityPreferences: { roleplay: { shown: 5, completed: 4, abandoned: 0, assistanceUsed: 1, retried: 0, positiveSignals: 1, negativeSignals: 0 } },
    recentFormats: ['roleplay'], recentInterests: ['music'], signalLog: ['day:ep:1:shown'],
  }
  const m = migrateLearnerModel(v4)
  assert.equal(m.version, MODEL_VERSION)
  assert.equal(m.canDo.introduce_self.status, 'can_do')
  assert.equal(m.episodes.first_greeting.awarded, true, 'no second XP after migrating')
  assert.equal(m.facts['branch:make_a_plan'], 'accept', 'the original story survives')
  assert.equal(m.activityPreferences.roleplay.shown, 5)
  assert.deepEqual(m.signalLog, ['day:ep:1:shown'])
  assert.deepEqual(m.episodeRuns, {})
  assert.equal(m.activeRun, null)
  // and the loose "likes" string becomes a proper fact rather than being lost
  assert.equal(m.learnerFacts.length, 1)
  assert.equal(m.learnerFacts[0].value, 'music')
  ok()
}

// 13) an active run pointing at nothing is dropped on load
{
  const m = migrateLearnerModel({ ...createLearnerModel(), version: MODEL_VERSION, activeRun: { mode: 'replay' } })
  assert.equal(m.activeRun, null)
  ok()
}

// 14) every episode in the arc can be replayed — nothing is a dead end
{
  for (const ep of ARC) {
    const m = completed(ep.id)
    assert.equal(resolveRunMode(m, ep.id), RUN_REPLAY, `${ep.id} must be replayable`)
  }
  ok()
}

/*
 * The completion card may only promise what this run will actually pay.
 * It announced "+55 XP" at the end of every replay, which was simply untrue —
 * the reward is gated by the episode, not by finishing the screen again.
 */
{
  const shell = readFileSync(new URL('../src/components/episode/EpisodeShell.jsx', import.meta.url), 'utf8')
  assert.ok(/const willReward = runEarnsReward\(run\?\.mode\) && !getEpisodeState\(/.test(shell),
    'the card must ask whether THIS run pays out')
  assert.ok(/willReward \? ` · \+\$\{ep\.xp\} XP` : ''/.test(shell),
    'the XP line must be conditional on that answer')
  assert.ok(!/\{t\(step\.canDoNameKey\)\} · \+\{ep\.xp\} XP/.test(shell),
    'the unconditional XP promise must be gone')
  // and the underlying rule the card is reading is still the real one
  assert.equal(runEarnsReward(RUN_BRANCH_REPLAY), false)
  assert.equal(runEarnsReward(RUN_REPLAY), false)
  assert.equal(runEarnsReward(RUN_FIRST), true)
  ok()
}

console.log(`check-episode-replay — OK  (${n} replay groups verified)`)

// Partial capstones never earn delayed retrieval, even after persistence/reload.
{
  const m = createLearnerModel()
  const id = 'test_retrieval'
  recordCanDoAttempt(m, id, { success: true, independent: true, atMs: AT, sessionId: 'prior' })
  beginEpisodeRun(m, 'capstone', { atMs: AT + 86400000 })
  stageDelayedRetrieval(m, [id], { independent: true, sessionId: 'later', atMs: AT + 86400000 })
  setEpisodeState(m, 'capstone', { status: 'in_progress', stepIndex: 2 })
  assert.equal(m.canDo[id].delayedRetrievalAt, undefined)
  const reloaded = migrateLearnerModel(JSON.parse(JSON.stringify(m)))
  beginEpisodeRun(reloaded, 'capstone', { atMs: AT + 86400000 })
  assert.equal(reloaded.activeRun.pendingRetrieval.length, 1)
  assert.equal(reloaded.canDo[id].delayedRetrievalAt, undefined)
  completeEpisodeRun(reloaded, { canDoId: id, independentEvidence: true, sessionId: 'later', atMs: AT + 86400000 })
  assert.equal(reloaded.canDo[id].delayedRetrievalAt.length, 1)
  assert.equal(reloaded.canDo[id].attempts, 2)
  completeEpisodeRun(reloaded, { canDoId: id, independentEvidence: true, sessionId: 'later', atMs: AT + 86400000 })
  assert.equal(reloaded.canDo[id].attempts, 2)
  const abandoned = JSON.parse(JSON.stringify(m))
  beginEpisodeRun(abandoned, 'another_episode', { atMs: AT + 86400000 })
  completeEpisodeRun(abandoned, { atMs: AT + 86400000 })
  assert.equal(abandoned.canDo[id].delayedRetrievalAt, undefined)
  const shell = readFileSync(new URL('../src/components/episode/EpisodeShell.jsx', import.meta.url), 'utf8')
  assert.ok(shell.includes('stageDelayedRetrieval(modelRef.current'))
  assert.ok(!shell.includes('recordDelayedRetrievalEvidence(modelRef.current'))
  console.log('partial retrieval: pending across resume, discarded on abandonment, committed once with completion PASS')
}

/*
 * Run-specific activity signals must not be suppressed by the global daily
 * activity-preference dedupe. Replaying the same step later today is a NEW
 * practice, but a double click/reload within the SAME run is not.
 */
{
  const m = completed('first_greeting')
  const first = beginEpisodeRun(m, 'first_greeting', { atMs: AT })
  assert.ok(recordRunActivitySignal(m, { kind: 'assistance', format: 'free_reply', key: '3:assistance' }))
  assert.equal(m.activeRun.assistanceUsed, 1)
  assert.equal(recordRunActivitySignal(m, { kind: 'assistance', format: 'free_reply', key: '3:assistance' }), null,
    'same-run double tap must not count assistance twice')
  assert.ok(recordRunActivitySignal(m, { kind: 'retried', format: 'free_reply', key: '3:retried' }))
  assert.equal(m.activeRun.retriedSteps, 1)
  const restored = migrateLearnerModel(JSON.parse(JSON.stringify(m)))
  const resumed = beginEpisodeRun(restored, 'first_greeting', { atMs: AT })
  assert.equal(resumed.runId, first.runId)
  assert.equal(recordRunActivitySignal(restored, { kind: 'assistance', format: 'free_reply', key: '3:assistance' }), null,
    'same-run reload must retain deduplication')
  assert.equal(restored.activeRun.assistanceUsed, 1)
  completeEpisodeRun(restored, { atMs: AT })
  const next = beginEpisodeRun(restored, 'first_greeting', { atMs: AT })
  assert.notEqual(next.runId, first.runId)
  assert.ok(recordRunActivitySignal(restored, { kind: 'assistance', format: 'free_reply', key: '3:assistance' }),
    'same-day new practice must record its own help even when daily preference signal was already counted')
  assert.equal(restored.activeRun.assistanceUsed, 1)
  assert.ok(recordRunActivitySignal(restored, { kind: 'retried', format: 'free_reply', key: '3:retried' }))
  assert.equal(restored.activeRun.retriedSteps, 1)
  assert.deepEqual(restored.activeRun.formatsUsed, ['free_reply'])
  assert.equal(recordRunActivitySignal(restored, { kind: 'assistance', format: 'unknown', key: '4:assistance' }), null)
  assert.equal(recordRunActivitySignal(restored, { kind: 'assistance', format: 'free_reply', key: 'invalid' }), null)
  const shell = readFileSync(new URL('../src/components/episode/EpisodeShell.jsx', import.meta.url), 'utf8')
  assert.ok(shell.includes('recordRunActivitySignal(modelRef.current'),
    'the actual episode UI must record per-run help before daily preference deduplication')
  console.log('run-specific activity signals: replay/reload/double tap/format/invalid PASS')
}


/*
 * A late completion from a stale tab can be older than every run already in
 * the bounded history. Filing it must NOT evict a more recent practice just
 * because the older attempt was appended last.
 */
{
  const episodeId = 'first_greeting'
  const model = completed(episodeId)
  const oldRun = beginEpisodeRun(model, episodeId, { atMs: AT })
  const dayMs = 86400000
  const recent = Array.from({ length: RUNS_PER_EPISODE }, (_, index) => sanitizeRun({
    runId: `${episodeId}:later:${index + 1}`,
    episodeId,
    mode: RUN_REPLAY,
    source: 'practice',
    startedAt: new Date(AT + (index + 1) * dayMs).toISOString(),
    completedAt: new Date(AT + (index + 1) * dayMs + 1000).toISOString(),
  }))
  model.episodeRuns[episodeId] = recent
  completeEpisodeRun(model, { atMs: AT + (RUNS_PER_EPISODE + 2) * dayMs })
  assert.deepEqual(runsFor(model, episodeId).map(run => run.runId), recent.map(run => run.runId),
    'late completion must not displace any of the newest dated practices')
  assert.ok(!runsFor(model, episodeId).some(run => run.runId === oldRun.runId),
    'the older completion should be outside the bounded history')
  assert.deepEqual(mergeEpisodeRuns(model.episodeRuns, {})[episodeId].map(run => run.runId),
    recent.map(run => run.runId), 'reconciliation must retain the same recent history')
  console.log('late stale-tab completion: newest practice history retained PASS')
}
