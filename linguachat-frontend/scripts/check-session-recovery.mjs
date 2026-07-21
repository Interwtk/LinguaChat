/*
 * check-session-recovery — the daily session survives reloads, corruption, old
 * versions and impatient fingers, and never pays out twice.
 */
import assert from 'node:assert/strict'
import { ARC } from '../src/learning/episodes/index.js'
import { createLearnerModel, setEpisodeState } from '../src/learning/engine/learnerModel.js'
import {
  buildSessionPlan, normalizeSession, getOrCreateSession, startSession,
  advanceBlock, completeSession, currentBlock, SESSION_VERSION,
} from '../src/learning/engine/session.js'

const AT = Date.parse('2026-07-21T09:00:00Z')
let n = 0
const ok = () => { n++ }
const fresh = (mode = 'standard') => buildSessionPlan(createLearnerModel(), ARC, { durationMode: mode, atMs: AT })

// 1) a round-trip through JSON preserves the plan exactly
{
  const s = startSession(fresh())
  const back = normalizeSession(JSON.parse(JSON.stringify(s)), ARC)
  assert.deepEqual(back.blocks.map(b => b.id), s.blocks.map(b => b.id))
  assert.equal(back.status, 'active')
  ok()
}

// 2) corrupt / junk payloads never throw and never yield a broken session
{
  for (const bad of [null, undefined, 'not-json', 42, [], {}, { version: SESSION_VERSION }]) {
    assert.equal(normalizeSession(bad, ARC), null)
  }
  ok()
}

// 3) an older stored version is discarded rather than misread
{
  const s = { ...fresh(), version: 0 }
  assert.equal(normalizeSession(s, ARC), null)
  ok()
}

// 4) a block index out of range is clamped back into the plan
{
  const s = { ...fresh(), currentBlockIndex: 99 }
  const back = normalizeSession(s, ARC)
  assert.equal(back.currentBlockIndex, s.blocks.length - 1)
  const negative = normalizeSession({ ...fresh(), currentBlockIndex: -5 }, ARC)
  assert.equal(negative.currentBlockIndex, 0)
  const nonsense = normalizeSession({ ...fresh(), currentBlockIndex: 'x' }, ARC)
  assert.equal(nonsense.currentBlockIndex, 0)
  ok()
}

// 5) a plan pointing at an episode that no longer exists is dropped
{
  const s = fresh()
  s.blocks[0] = { ...s.blocks[0], payload: { episodeId: 'episode_that_was_removed' } }
  assert.equal(normalizeSession(s, ARC), null)
  ok()
}

// 6) an invalid duration or status is rejected
{
  assert.equal(normalizeSession({ ...fresh(), durationMode: 'turbo' }, ARC), null)
  assert.equal(normalizeSession({ ...fresh(), status: 'paused' }, ARC), null)
  ok()
}

// 7) resuming mid-session returns the SAME session, at the same block
{
  let s = startSession(fresh('deep'))
  s = advanceBlock(s)
  const resumed = getOrCreateSession(createLearnerModel(), ARC, { durationMode: 'deep', atMs: AT, stored: s })
  assert.equal(resumed.id, s.id)
  assert.equal(resumed.currentBlockIndex, s.currentBlockIndex)
  assert.equal(currentBlock(resumed).id, currentBlock(s).id)
  ok()
}

// 8) duration cannot be silently swapped once the session is active
{
  const active = startSession(fresh('quick'))
  const attempted = getOrCreateSession(createLearnerModel(), ARC, { durationMode: 'deep', atMs: AT, stored: active })
  assert.equal(attempted.durationMode, 'quick', 'an active session keeps its duration')
  assert.equal(attempted.id, active.id)
  ok()
}

// 9) the session reward is idempotent (double tap, Back, reload)
{
  let s = startSession(fresh())
  const first = completeSession(s)
  assert.equal(first.awarded, true)
  const second = completeSession(first.session)
  assert.equal(second.awarded, false, 'a session must never be awarded twice')
  const third = completeSession(second.session)
  assert.equal(third.awarded, false)
  assert.equal(third.session.status, 'completed')
  ok()
}

// 10) a completed session for today is returned as-is, not replanned
{
  const done = completeSession(startSession(fresh())).session
  const again = getOrCreateSession(createLearnerModel(), ARC, { durationMode: 'standard', atMs: AT, stored: done })
  assert.equal(again.status, 'completed')
  assert.equal(again.awarded, true)
  ok()
}

// 11) an episode completed OUTSIDE the session does not corrupt the stored plan
{
  let s = startSession(fresh())
  const model = createLearnerModel()
  setEpisodeState(model, 'first_greeting', { status: 'completed', stepIndex: 8, awarded: true })
  const resumed = getOrCreateSession(model, ARC, { durationMode: 'standard', atMs: AT, stored: s })
  assert.equal(resumed.id, s.id, 'the active plan is kept even if progress happened elsewhere')
  assert.equal(resumed.currentBlockIndex, s.currentBlockIndex)
  ok()
}

// 12) advancing past the end is safe to repeat (no index drift, stays completed)
{
  let s = startSession(fresh('quick'))
  for (let i = 0; i < 10; i++) s = advanceBlock(s)
  const idx = s.currentBlockIndex
  s = advanceBlock(s)
  assert.equal(s.currentBlockIndex, idx)
  assert.equal(s.status, 'completed')
  ok()
}

// 13) the session bonus is granted exactly once — and actually granted.
//     Regression guard: the award flag must be read synchronously, not out of a
//     React state updater (which runs later, so the bonus was never applied).
{
  const BONUS = 15
  let xp = 0
  let session = startSession(fresh())
  const finish = () => {
    const { session: next, awarded } = completeSession(session)
    session = next
    if (awarded) xp += BONUS
  }
  finish()
  assert.equal(xp, BONUS, 'finishing a session must actually grant the bonus once')
  finish(); finish()
  assert.equal(xp, BONUS, 'repeated finishes must not grant it again')
  assert.equal(session.awarded, true)
  ok()
}

// 14) the awarded flag survives a storage round-trip, so a reload cannot re-pay
{
  const done = completeSession(startSession(fresh())).session
  const reloaded = normalizeSession(JSON.parse(JSON.stringify(done)), ARC)
  assert.equal(reloaded.awarded, true)
  assert.equal(completeSession(reloaded).awarded, false)
  ok()
}

console.log(`check-session-recovery — OK  (${n} recovery groups verified)`)
