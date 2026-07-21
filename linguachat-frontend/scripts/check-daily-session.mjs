/*
 * check-daily-session — the adaptive daily planner is deterministic and sane.
 *
 * Asserts block priority, per-duration budgets, plan stability across reloads,
 * and that a session always ends with something achievable rather than empty.
 */
import assert from 'node:assert/strict'
import { ARC } from '../src/learning/episodes/index.js'
import { createLearnerModel, setEpisodeState, recordItemAttempt, markRecurringError } from '../src/learning/engine/learnerModel.js'
import {
  buildSessionPlan, getOrCreateSession, DURATION_MODES, dayKeyFor,
  startSession, advanceBlock, currentBlock, sessionProgress, sessionHeadline, sessionHasReview,
  practiceKindForItem, practiceKindForError, practiceKindForCanDo,
} from '../src/learning/engine/session.js'

const AT = Date.parse('2026-07-21T09:00:00Z')
let n = 0
const ok = () => { n++ }
const types = (s) => s.blocks.map(b => b.type)

// 1) a brand-new learner: main goal = first episode, ends with completion
{
  const model = createLearnerModel()
  const s = buildSessionPlan(model, ARC, { durationMode: 'standard', atMs: AT })
  assert.equal(s.status, 'planned')
  assert.equal(s.currentBlockIndex, 0)
  assert.equal(s.blocks.at(-1).type, 'session_completion')
  assert.ok(types(s).includes('start_episode'), 'a new learner gets a first episode')
  assert.equal(s.blocks.find(b => b.type === 'start_episode').payload.episodeId, 'first_greeting')
  ok()
}

// 2) duration budgets are respected and never exceeded
{
  const model = createLearnerModel()
  setEpisodeState(model, 'first_greeting', { status: 'in_progress', stepIndex: 3 })
  recordItemAttempt(model, 'hi', { correct: true, independent: false })  // schedules a review
  markRecurringError(model, 'missing_copula'); markRecurringError(model, 'missing_copula')
  model.canDo.introduce_self = { status: 'learning', attempts: 1, successes: 1, independentSuccesses: 0, contexts: [], lastPracticedAt: null }
  const later = AT + 5 * 86400000   // make the review overdue
  for (const [mode, cfg] of Object.entries(DURATION_MODES)) {
    const s = buildSessionPlan(model, ARC, { durationMode: mode, atMs: later })
    assert.ok(s.blocks.length <= cfg.maxBlocks, `${mode}: ${s.blocks.length} blocks exceeds ${cfg.maxBlocks}`)
    assert.equal(s.blocks.at(-1).type, 'session_completion')
    assert.equal(s.durationMode, mode)
    // exactly one main goal
    const mains = types(s).filter(t => t === 'continue_episode' || t === 'start_episode')
    assert.ok(mains.length <= 1, `${mode} must have at most one main episode block`)
  }
  ok()
}

// 3) priority: an unfinished episode wins over starting a new one
{
  const model = createLearnerModel()
  setEpisodeState(model, 'first_greeting', { status: 'in_progress', stepIndex: 2 })
  const s = buildSessionPlan(model, ARC, { durationMode: 'standard', atMs: AT })
  assert.ok(types(s).includes('continue_episode'))
  assert.ok(!types(s).includes('start_episode'))
  assert.equal(sessionHeadline(s).episodeId, 'first_greeting')
  ok()
}

// 4) quick stays minimal: no retry/fragile extras
{
  const model = createLearnerModel()
  markRecurringError(model, 'missing_copula'); markRecurringError(model, 'missing_copula')
  model.canDo.introduce_self = { status: 'learning', attempts: 1, successes: 1, independentSuccesses: 0, contexts: [], lastPracticedAt: null }
  const s = buildSessionPlan(model, ARC, { durationMode: 'quick', atMs: AT })
  assert.ok(!types(s).includes('targeted_retry'), 'quick must not add a retry block')
  assert.ok(!types(s).includes('recall'), 'quick must not add a fragile-skill block')
  assert.ok(s.blocks.length <= 3)
  ok()
}

// 5) a repeated error earns a targeted retry in standard; a single one does not
{
  const once = createLearnerModel()
  markRecurringError(once, 'missing_auxiliary')
  assert.ok(!types(buildSessionPlan(once, ARC, { durationMode: 'standard', atMs: AT })).includes('targeted_retry'))
  const twice = createLearnerModel()
  markRecurringError(twice, 'missing_auxiliary'); markRecurringError(twice, 'missing_auxiliary')
  const s = buildSessionPlan(twice, ARC, { durationMode: 'standard', atMs: AT })
  assert.ok(types(s).includes('targeted_retry'))
  assert.equal(s.blocks.find(b => b.type === 'targeted_retry').objective, 'ask_origin')
  ok()
}

// 6) everything done and nothing due → free conversation, never an empty session
{
  const model = createLearnerModel()
  for (const ep of ARC) setEpisodeState(model, ep.id, { status: 'completed', stepIndex: 0, awarded: true })
  const s = buildSessionPlan(model, ARC, { durationMode: 'quick', atMs: AT })
  assert.ok(s.blocks.length >= 2)
  assert.ok(types(s).includes('free_chat_option'))
  ok()
}

// 7) plan is stable: same day + same mode returns the STORED plan, not a rebuild
{
  const model = createLearnerModel()
  const first = buildSessionPlan(model, ARC, { durationMode: 'standard', atMs: AT })
  const started = startSession(first)
  // progress changes the model, but an active session must not be regenerated
  setEpisodeState(model, 'first_greeting', { status: 'completed', stepIndex: 8, awarded: true })
  const again = getOrCreateSession(model, ARC, { durationMode: 'standard', atMs: AT, stored: started })
  assert.equal(again.id, started.id)
  assert.deepEqual(types(again), types(started), 'an active session must not be rebuilt')
  assert.equal(again.status, 'active')
  ok()
}

// 8) changing duration BEFORE starting rebuilds; a new day rebuilds
{
  const model = createLearnerModel()
  const planned = buildSessionPlan(model, ARC, { durationMode: 'quick', atMs: AT })
  const changed = getOrCreateSession(model, ARC, { durationMode: 'deep', atMs: AT, stored: planned })
  assert.equal(changed.durationMode, 'deep', 'duration can change while only planned')
  const tomorrow = AT + 86400000
  const fresh = getOrCreateSession(model, ARC, { durationMode: 'quick', atMs: tomorrow, stored: planned })
  assert.equal(fresh.dayKey, dayKeyFor(tomorrow))
  assert.notEqual(fresh.id, planned.id)
  ok()
}

// 9) advancing never rewinds and completes exactly at the end
{
  const model = createLearnerModel()
  let s = startSession(buildSessionPlan(model, ARC, { durationMode: 'standard', atMs: AT }))
  const total = s.blocks.length
  for (let i = 0; i < total + 3; i++) s = advanceBlock(s)
  assert.equal(s.currentBlockIndex, total - 1, 'index never runs past the last block')
  assert.equal(s.status, 'completed')
  assert.equal(currentBlock(s).type, 'session_completion')
  ok()
}

// 10) progress excludes the completion block from the task count
{
  const model = createLearnerModel()
  const s = buildSessionPlan(model, ARC, { durationMode: 'deep', atMs: AT })
  const p = sessionProgress(s)
  assert.equal(p.total, s.blocks.length - 1)
  assert.equal(p.done, 0)
  ok()
}

// 11) review flag + practice-kind maps cover every arc item id
{
  const model = createLearnerModel()
  recordItemAttempt(model, 'how_are_you', { correct: true, independent: false })
  const s = buildSessionPlan(model, ARC, { durationMode: 'standard', atMs: AT + 5 * 86400000 })
  assert.equal(sessionHasReview(s), true)
  for (const ep of ARC) {
    for (const id of ep.gardenItems || []) {
      assert.ok(practiceKindForItem(id), `no practice kind mapped for garden item ${id}`)
    }
    assert.ok(practiceKindForCanDo(ep.canDoId), `no practice kind for can-do ${ep.canDoId}`)
  }
  for (const err of ['missing_copula', 'missing_name', 'greeting_only', 'no_intro', 'question_order',
    'no_question', 'missing_close', 'missing_auxiliary', 'missing_from', 'no_answer', 'incomplete_turn']) {
    assert.ok(practiceKindForError(err), `no practice kind for error ${err}`)
  }
  ok()
}

// 12) estimated minutes stay close to the promised duration
{
  const model = createLearnerModel()
  for (const [mode, cfg] of Object.entries(DURATION_MODES)) {
    const s = buildSessionPlan(model, ARC, { durationMode: mode, atMs: AT })
    assert.ok(s.estimatedMinutes >= 1 && s.estimatedMinutes <= cfg.minutes + 8,
      `${mode}: estimate ${s.estimatedMinutes} is far from the ${cfg.minutes}min promise`)
  }
  ok()
}

// 13) an unknown duration mode degrades to standard instead of throwing
{
  const s = buildSessionPlan(createLearnerModel(), ARC, { durationMode: 'turbo', atMs: AT })
  assert.equal(s.durationMode, 'standard')
  ok()
}

console.log(`check-daily-session — OK  (${n} planner groups verified)`)
