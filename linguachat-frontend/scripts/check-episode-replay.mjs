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
import { getEpisode, ARC } from '../src/learning/episodes/index.js'
import {
  createLearnerModel, setEpisodeState, getEpisodeState, migrateLearnerModel, MODEL_VERSION,
  RUNS_PER_EPISODE, sanitizeRun, sanitizeEpisodeRuns, mergeEpisodeRuns, mergeEpisodeState,
  mergeLearnerFacts, recordCanDoAttempt,
} from '../src/learning/engine/learnerModel.js'
import {
  beginEpisodeRun, completeEpisodeRun, resolveRunMode, runEarnsReward, runsFor,
  timesPractised, branchesSeen, otherBranch, lastBranchPlayed, canTryOtherBranch, updateActiveRun,
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

console.log(`check-episode-replay — OK  (${n} replay groups verified)`)
