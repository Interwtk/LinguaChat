/*
 * check-fifth-arc-flow — the repair arc as a learner actually experiences it.
 *
 * check-fifth-arc holds the DATA to its claims; this file runs the arc through
 * the real engine modules: runs and rewards, the hosted story surviving a reload
 * and a branch replay, the four learning states for the new phrases, the support
 * level a strong and a struggling learner are handed, and the planner bringing
 * the new language back.
 *
 * No browser and no network: the same modules the app imports, called directly.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ARC, getEpisode } from '../src/learning/episodes/index.js'
import {
  createLearnerModel, recordItemAttempt, recordItemSeen, recordCanDoAttempt,
  learningStateOf, canUseItem, setEpisodeState, getEpisodeState, mergeLanguageItems,
  INDEPENDENT_USES_TO_CAN_USE,
} from '../src/learning/engine/learnerModel.js'
import {
  beginEpisodeRun, completeEpisodeRun, resolveRunMode, runEarnsReward,
  timesPractised, branchesSeen, canTryOtherBranch, otherBranch,
  RUN_FIRST, RUN_REPLAY, RUN_BRANCH_REPLAY,
} from '../src/learning/engine/episodeRuns.js'
import {
  deriveInitialScaffold, updateScaffoldAfterTurn, makeScaffoldState, reviveScaffoldState,
  evidenceKindForStep, isIndependentEvidence, EVIDENCE, REASONS, showsModelAnswer,
} from '../src/learning/engine/scaffolding.js'
import {
  getStory, storyTurns, storyBranches, createStoryState, normalizeStoryState,
  advanceStory, isStoryFinished, turnText,
} from '../src/learning/engine/miniStory.js'
import { evaluateFree } from '../src/learning/engine/responseEvaluation.js'
import { practiceKindForItem, practiceKindForError, practiceKindForCanDo, repairKindForItem } from '../src/learning/engine/session.js'
import { formatSupportsObjective } from '../src/learning/engine/formatChoice.js'

let n = 0
const ok = () => { n++ }

const EP13 = getEpisode('lost_you')
const EP14 = getEpisode('say_again')
const EP15 = getEpisode('we_can_continue')
const NEW_ITEMS = ['i_dont_understand', 'can_you_repeat', 'speak_slowly', 'bye', 'see_you', 'repair_pattern']

/* Play an episode's productive steps through the real evaluator. */
function play(model, ep, { independent, scaffold = 'high' }) {
  const answers = {
    repair_request: { signal_nonunderstanding: "I don't understand.", repeat: 'Can you repeat, please?', slow_down: 'Please speak slowly.' },
    close_encounter: 'Bye.', yes_no_preference: 'Yes, I do.', answer_origin: "I'm from Bogotá.",
    reciprocal_question: 'And you?', introduction: "Hi, I'm Sebastian.", decline_offer: 'No, thank you.',
    answer_wellbeing: "I'm good.",
  }
  let turns = 0
  for (const step of ep.steps) {
    if (step.type === 'free_reply' || step.type === 'recall') {
      const want = step.evalKind === 'repair_request' ? answers.repair_request[step.repairKind] : answers[step.evalKind]
      assert.ok(want, `${ep.id}: no answer for ${step.evalKind}`)
      const r = evaluateFree(step.evalKind, want, { independent, repairKind: step.repairKind, place: 'Bogotá', name: 'Sebastian' })
      assert.ok(r.completedObjective, `${ep.id}/${step.evalKind}: "${want}" rejected → ${r.errorType}`)
      for (const id of step.itemIds || []) {
        recordItemAttempt(model, id, { correct: true, independent, evidenceKind: evidenceKindForStep(step) })
      }
      turns++
    } else if (step.itemId) {
      recordItemAttempt(model, step.itemId, { correct: true, independent: false, evidenceKind: evidenceKindForStep(step) })
    }
    for (const id of step.meaningItems || []) recordItemSeen(model, id)
  }
  recordCanDoAttempt(model, ep.canDoId, { success: true, independent, context: ep.id })
  return turns
}

/* ---- 1) the run is rewarded once, and a replay never again ---- */
{
  const model = createLearnerModel()
  assert.equal(resolveRunMode(model, EP13.id), RUN_FIRST)
  beginEpisodeRun(model, EP13.id, { source: 'practice' })
  assert.equal(runEarnsReward(RUN_FIRST), true)
  play(model, EP13, { independent: false })
  const first = completeEpisodeRun(model, { independentEvidence: false, rewarded: true })
  assert.equal(first.rewarded, true)
  setEpisodeState(model, EP13.id, { status: 'completed', awarded: true })

  assert.equal(resolveRunMode(model, EP13.id), RUN_REPLAY, 'a finished episode replays')
  assert.equal(runEarnsReward(RUN_REPLAY), false, 'a replay must not pay again')
  beginEpisodeRun(model, EP13.id, { source: 'practice' })
  const again = completeEpisodeRun(model, { independentEvidence: true, rewarded: runEarnsReward(RUN_REPLAY) })
  assert.equal(again.rewarded, false)
  assert.equal(timesPractised(model, EP13.id), 2)
  ok()
}

/* ---- 2) the new phrases climb the four states, and only on real evidence ---- */
{
  const model = createLearnerModel()
  recordItemSeen(model, 'can_you_repeat')
  assert.equal(learningStateOf(model, 'can_you_repeat'), 'seen', 'a meaning shown is only "seen"')

  // the recognition step in episode 14: understood, never usable
  const choice = EP14.steps.find(s => s.type === 'choice')
  recordItemAttempt(model, choice.itemId, { correct: true, independent: false, evidenceKind: evidenceKindForStep(choice) })
  assert.equal(learningStateOf(model, 'can_you_repeat'), 'understood',
    'picking the right option out of three is recognition, not production')
  assert.equal(canUseItem(model, 'can_you_repeat'), false)

  // the guided gap-fill: practising
  const gap = EP14.steps.find(s => s.type === 'fill_blank')
  recordItemAttempt(model, gap.itemId, { correct: true, independent: false, evidenceKind: evidenceKindForStep(gap) })
  assert.equal(learningStateOf(model, 'repair_pattern'), 'practicing')

  // and only unaided open production reaches can_use, twice
  const open = EP14.steps.find(s => s.evalKind === 'repair_request' && s.repairKind === 'repeat' && s.type === 'free_reply')
  assert.equal(evidenceKindForStep(open), EVIDENCE.OPEN)
  for (let i = 0; i < INDEPENDENT_USES_TO_CAN_USE; i++) {
    const before = learningStateOf(model, 'can_you_repeat')
    recordItemAttempt(model, 'can_you_repeat', { correct: true, independent: true, evidenceKind: EVIDENCE.OPEN })
    if (i === 0) assert.notEqual(learningStateOf(model, 'can_you_repeat'), 'can_use',
      `one unaided use is luck, not evidence (was ${before})`)
  }
  assert.equal(learningStateOf(model, 'can_you_repeat'), 'can_use')

  // finishing the episode grants nothing by itself
  const fresh = createLearnerModel()
  setEpisodeState(fresh, EP14.id, { status: 'completed', awarded: true })
  recordCanDoAttempt(fresh, EP14.canDoId, { success: true, independent: true, context: EP14.id })
  for (const id of NEW_ITEMS) {
    assert.equal(canUseItem(fresh, id), false, `${id} became usable just because the episode ended`)
  }
  ok()
}

/* ---- 3) a state never goes backwards, not even across two devices ---- */
{
  const strong = createLearnerModel()
  for (let i = 0; i < 3; i++) recordItemAttempt(strong, 'bye', { correct: true, independent: true, evidenceKind: EVIDENCE.OPEN })
  const weak = createLearnerModel()
  recordItemSeen(weak, 'bye')
  const merged = mergeLanguageItems(strong.languageItems, weak.languageItems)
  assert.equal(merged.bye.learningState, 'can_use', 'merging a stale copy must not demote the learner')
  const other = mergeLanguageItems(weak.languageItems, strong.languageItems)
  assert.equal(other.bye.learningState, 'can_use', 'the merge must be order-independent')
  ok()
}

/* ---- 4) the hosted story survives a reload, mid-branch ---- */
{
  const story = getStory('repair_request')
  for (const branch of storyBranches(story)) {
    let state = createStoryState(story, { seed: 'Sebastian', branch })
    assert.equal(state.branchId, branch)
    // walk to the middle, then round-trip through storage
    state = advanceStory(state, story)
    state = advanceStory(state, story)
    const stored = JSON.parse(JSON.stringify(state))
    const revived = normalizeStoryState(stored, story)
    assert.ok(revived, 'a stored story state must survive the round-trip')
    assert.equal(revived.currentTurn, state.currentTurn, 'the story must resume on the same turn')
    assert.equal(revived.branchId, branch, 'a reload must not switch strategy mid-conversation')
    // and it finishes
    let s = revived
    let guard = 0
    while (!isStoryFinished(s, story) && guard++ < 50) s = advanceStory(s, story)
    assert.ok(isStoryFinished(s, story), `${branch} never finished`)
  }
  /*
   * A branch id from a DIFFERENT story ("accept" belongs to the session stories)
   * must not survive a reload, and an out-of-range turn must be clamped instead
   * of rendering nothing.
   */
  const bad = normalizeStoryState({ storyId: story.storyId, currentTurn: 999, branchId: 'accept' }, story)
  assert.ok(bad, 'a repairable state must be repaired, not discarded')
  assert.equal(bad.branchId, null, 'a foreign branch id must not survive')
  assert.equal(bad.currentTurn, storyTurns(story).length - 1, 'an impossible turn is clamped')
  assert.equal(normalizeStoryState({ storyId: 'first_day', currentTurn: 0 }, story), null,
    'another story’s state must not be adopted')
  const t = storyTurns(story).find(x => x.byBranch)
  assert.ok(turnText(t, 'accept', story), 'an unknown branch still renders something')
  ok()
}

/* ---- 5) both strategies are reachable, and the other one is offered later ---- */
{
  const model = createLearnerModel()
  beginEpisodeRun(model, EP15.id, { source: 'practice', branchPreference: 'repeat' })
  play(model, EP15, { independent: false })
  completeEpisodeRun(model, { independentEvidence: false, branchId: 'repeat', rewarded: true })
  setEpisodeState(model, EP15.id, { status: 'completed', awarded: true })

  assert.deepEqual(branchesSeen(model, EP15.id), ['repeat'])
  assert.equal(canTryOtherBranch(model, EP15), true, 'the second strategy must be offered')
  assert.equal(otherBranch(model, EP15), 'slow_down')
  assert.equal(resolveRunMode(model, EP15.id, { wantsOtherBranch: true }), RUN_BRANCH_REPLAY)
  assert.equal(runEarnsReward(RUN_BRANCH_REPLAY), false, 'seeing the other branch is practice, not new XP')

  beginEpisodeRun(model, EP15.id, { source: 'practice', wantsOtherBranch: true, branchPreference: 'slow_down' })
  completeEpisodeRun(model, { independentEvidence: true, branchId: 'slow_down', rewarded: false })
  assert.deepEqual([...branchesSeen(model, EP15.id)].sort(), ['repeat', 'slow_down'])
  /*
   * Both strategies seen. The offer does not disappear — it alternates away from
   * whatever was played last, so either one stays reachable. What it must never
   * do is point at the run that just happened.
   */
  assert.equal(canTryOtherBranch(model, EP15), true)
  assert.equal(otherBranch(model, EP15), 'repeat', 'the offer must lead away from the last strategy played')
  ok()
}

/* ---- 5b) the strategies never leak between stories ---- */
{
  const model = createLearnerModel()
  setEpisodeState(model, EP15.id, { status: 'completed', awarded: true })
  beginEpisodeRun(model, EP15.id, { source: 'practice', branchPreference: 'accept' })
  const done = completeEpisodeRun(model, { branchId: 'accept', rewarded: false })
  assert.ok(!storyBranches(getStory('repair_request')).includes(done.branchId ?? 'accept')
    || done.branchId === null,
    'a session story’s branch id must not be recorded against the repair story')
  ok()
}

/* ---- 6) the support the arc hands three different learners ---- */
{
  const cohort = (build) => {
    const model = createLearnerModel()
    build(model)
    return REPAIR_IDS_LEVELS.map(id => {
      const s = deriveInitialScaffold({ learnerModel: model, episode: getEpisode(id) })
      return [id, s.currentLevel, s.reasonCodes]
    })
  }
  const REPAIR_IDS_LEVELS = ['lost_you', 'say_again', 'we_can_continue']

  // a learner arriving from the café, having never repaired anything
  const beginner = cohort((model) => {
    for (const ep of ARC.slice(0, 12)) {
      recordCanDoAttempt(model, ep.canDoId, { success: true, independent: false, context: ep.id })
      setEpisodeState(model, ep.id, { status: 'completed', awarded: true })
    }
  })
  for (const [id, level, reasons] of beginner) {
    assert.ok(level === 'high' || level === 'medium', `${id} starts at ${level} for a learner new to repair`)
    assert.ok(reasons.length, `${id} gave no reason for ${level}`)
    assert.ok(reasons.includes(REASONS.NEW_COMPLEXITY) || reasons.includes(REASONS.FRESH_SKILL)
      || reasons.includes(REASONS.WEAK_PREREQUISITES),
      `${id}: ${reasons.join(',')} does not explain support for brand-new language`)
  }

  // someone who has proved the repair skill, replaying episode 13
  const proven = createLearnerModel()
  for (const ep of ARC) {
    setEpisodeState(proven, ep.id, { status: 'completed', awarded: true })
    // completing an episode is not evidence of the skill; the unaided uses are
    for (let i = 0; i < 3; i++) recordCanDoAttempt(proven, ep.canDoId, { success: true, independent: true, context: ep.id })
  }
  for (const id of ['i_dont_understand', 'can_you_repeat', 'speak_slowly', 'repair_pattern']) {
    for (let i = 0; i < 3; i++) recordItemAttempt(proven, id, { correct: true, independent: true, evidenceKind: EVIDENCE.OPEN })
  }
  const replay = deriveInitialScaffold({ learnerModel: proven, episode: EP13, runMode: RUN_REPLAY })
  assert.equal(replay.currentLevel, 'low', `a proven learner replaying ep13 got ${replay.currentLevel}`)
  assert.equal(showsModelAnswer('low'), false, 'a proven learner must not be shown the answer')

  // the same learner meeting episode 14's NEW phrases is not left alone
  const stillNew = createLearnerModel()
  for (const ep of ARC.slice(0, 13)) {
    setEpisodeState(stillNew, ep.id, { status: 'completed', awarded: true })
    for (let i = 0; i < 3; i++) recordCanDoAttempt(stillNew, ep.canDoId, { success: true, independent: true, context: ep.id })
  }
  for (let i = 0; i < 3; i++) recordItemAttempt(stillNew, 'i_dont_understand', { correct: true, independent: true, evidenceKind: EVIDENCE.OPEN })
  const ep14 = deriveInitialScaffold({ learnerModel: stillNew, episode: EP14 })
  assert.notEqual(ep14.currentLevel, 'low',
    'episode 14 introduces two phrases the learner has never met; it may not start unsupported')
  assert.ok(ep14.reasonCodes.includes(REASONS.NEW_COMPLEXITY), `ep14 reasons: ${ep14.reasonCodes.join(',')}`)
  ok()
}

/* ---- 7) support moves during a run, without oscillating ---- */
{
  const open = EP13.steps.find(s => s.evalKind === 'repair_request' && s.type === 'free_reply')
  const openTurn = { evidenceKind: evidenceKindForStep(open), correct: true, assistanceUsed: false }
  const choice = EP14.steps.find(s => s.type === 'choice')

  let state = makeScaffoldState('medium', [REASONS.FRESH_SKILL])
  state = updateScaffoldAfterTurn(state, openTurn)
  assert.equal(state.currentLevel, 'medium', 'one unaided repair is not yet independence')
  state = updateScaffoldAfterTurn(state, openTurn)
  assert.equal(state.currentLevel, 'low', 'two unaided repairs earn the next level')
  assert.ok(state.reasonCodes.includes(REASONS.RECENT_INDEPENDENT_SUCCESS))
  assert.equal(state.independentStreak, 0, 'the next level must be earned from scratch, not carried')

  // a correct recognition turn is real evidence of something else, and moves nothing
  const afterChoice = updateScaffoldAfterTurn(state, { evidenceKind: evidenceKindForStep(choice), correct: true })
  assert.equal(afterChoice.currentLevel, 'low', 'a correct choice must not relax support further')

  // one stumble does not swing it; two bring help back, once
  const one = updateScaffoldAfterTurn(afterChoice, { ...openTurn, correct: false })
  assert.equal(one.currentLevel, 'low', 'a single wrong answer must not yank support around')
  const two = updateScaffoldAfterTurn(one, { ...openTurn, correct: false })
  assert.equal(two.currentLevel, 'medium', 'repeated trouble must bring help back')
  const three = updateScaffoldAfterTurn(two, { ...openTurn, correct: false })
  assert.equal(three.currentLevel, 'medium', 'support may not creep up on every single turn')

  // a revived state keeps its history rather than starting over
  const revived = reviveScaffoldState(JSON.parse(JSON.stringify(three)))
  assert.equal(revived.currentLevel, three.currentLevel)
  assert.equal(revived.retryPressure, three.retryPressure)
  assert.ok(revived.reasonCodes.includes(REASONS.RECENT_RETRIES))
  ok()
}

/* ---- 8) evidence honesty: a suggestion tapped is never independent ---- */
{
  const open = EP13.steps.find(s => s.evalKind === 'repair_request' && s.type === 'free_reply')
  assert.equal(isIndependentEvidence({ step: open, assistanceUsed: true, correct: true }), false)
  assert.equal(isIndependentEvidence({ step: open, assistanceUsed: false, correct: true }), true)
  const choice = EP14.steps.find(s => s.type === 'choice')
  assert.equal(isIndependentEvidence({ step: choice, assistanceUsed: false, correct: true }), false,
    'a correct choice is recognition however unaided it was')
  const story = getStory('repair_request')
  for (const reply of storyTurns(story).filter(t => t.kind === 'reply')) {
    const asStep = { type: 'free_reply', evalKind: reply.evalKind, suggestionEn: reply.suggestionEn }
    assert.equal(evidenceKindForStep(asStep), EVIDENCE.OPEN, 'a story reply is open production')
  }
  ok()
}

/* ---- 9) the planner can bring the new language and the new mistakes back ---- */
{
  for (const id of NEW_ITEMS) {
    assert.ok(practiceKindForItem(id), `${id} can never be scheduled for review`)
  }
  for (const errorType of ['no_repair', 'incomplete_repair', 'too_short_repair', 'means_dont_know', 'other_repair']) {
    assert.equal(practiceKindForError(errorType), 'repair_request', `${errorType} routes to ${practiceKindForError(errorType)}`)
  }
  for (const errorType of ['not_a_close', 'no_close_yet']) {
    assert.equal(practiceKindForError(errorType), 'close_encounter')
  }
  assert.equal(practiceKindForCanDo('ask_for_repair'), 'repair_request')
  assert.equal(practiceKindForCanDo('close_an_encounter'), 'close_encounter')

  // the formats a repair can be practised in — and the one it cannot
  assert.equal(formatSupportsObjective('mini_story', 'repair_request'), false,
    'the repair story belongs to episode 15, not to a loose session block')
  for (const format of ['guided_reply', 'free_reply', 'recall']) {
    assert.equal(formatSupportsObjective(format, 'repair_request'), true, `${format} should fit a repair`)
  }
  ok()
}

/* ---- 9b) a session block asks for the thing it grades ---- */
{
  /*
   * The planner routes the arc's phrases and mistakes to `repair_request` and
   * `close_encounter`; the runner had a prompt and a model answer for neither, so
   * both fell through to the `introduction` template — Lingua said "Hi there!",
   * offered "Hi, I'm Sebastian." and then graded the reply as a repair.
   */
  const runner = readFileSync(new URL('../src/components/session/SessionRunner.jsx', import.meta.url), 'utf8')
  for (const intent of ['repair_request', 'close_encounter']) {
    const inModel = new RegExp(`MODEL_ANSWER[\\s\\S]*?${intent}:`).test(runner)
    assert.ok(inModel, `a session block practising ${intent} has no model answer of its own`)
  }
  assert.ok(/const REPAIR_PROMPT = \{/.test(runner), 'a repair block must open with a breakdown, not a greeting')
  assert.ok(/repairKindForItem\(block\.payload\?\.itemId\)/.test(runner),
    'the block must take its strategy from the phrase that fell due')
  assert.ok(/\.\.\.\(repairKind \? \{ repairKind \} : \{\}\)/.test(runner),
    'the strategy must reach both the local and the remote evaluation')
  // and the mapping itself is complete: every repair phrase knows its strategy
  for (const [id, expected] of [['i_dont_understand', 'signal_nonunderstanding'], ['can_you_repeat', 'repeat'],
    ['repair_pattern', 'repeat'], ['speak_slowly', 'slow_down']]) {
    assert.equal(repairKindForItem(id), expected, `${id} has no strategy`)
  }
  assert.equal(repairKindForItem('bye'), null, 'a goodbye is not a repair strategy')
  ok()
}

/* ---- 10) a learner who never finished can resume without losing the run ---- */
{
  const model = createLearnerModel()
  const run = beginEpisodeRun(model, EP15.id, { source: 'practice', branchPreference: 'repeat' })
  setEpisodeState(model, EP15.id, { status: 'in_progress', stepIndex: 5 })
  const reloaded = JSON.parse(JSON.stringify(model))
  assert.equal(getEpisodeState(reloaded, EP15.id).stepIndex, 5)
  assert.notEqual(getEpisodeState(reloaded, EP15.id).status, 'completed')
  assert.equal(resolveRunMode(reloaded, EP15.id), 'resume', 'an unfinished episode resumes')
  assert.equal(runEarnsReward('resume'), true, 'a resumed first run may still be rewarded')
  assert.equal(reloaded.activeRun?.runId, run.runId, 'resuming must continue the same run')
  ok()
}

console.log(`check-fifth-arc-flow — OK  (${n} flow groups verified)`)
