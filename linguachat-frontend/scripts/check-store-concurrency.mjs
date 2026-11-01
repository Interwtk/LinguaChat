#!/usr/bin/env node
/*
 * The learner stores that P1 left on one shared key, under two tabs of one
 * account: missions (history, cursor, rewards), the daily session, the memory
 * context and the mini-story. Each store has its own semantics, so each is
 * tested for what it must guarantee rather than with one generic rule.
 *
 * A tab reads localStorage from its own cache, which other tabs update late;
 * `staleView` reproduces that. Everything runs on the real modules and the real
 * account lease; nothing touches the network.
 *
 * Run: node scripts/check-store-concurrency.mjs
 */
import assert from 'node:assert/strict'
import * as missions from '../src/services/missions.js'
import { applyProgressEvent, commitProgressEvent, loadLocalProgress, recordMissionProgress, saveLocalProgress } from '../src/services/localProgress.js'
import * as memory from '../src/learning/engine/memoryContext.js'
import * as story from '../src/learning/engine/miniStory.js'
import * as sessions from '../src/learning/engine/session.js'
const { SESSION_KEY, saveSession, loadSession } = sessions
import { activateLocalAccount } from '../src/auth/browserDataIsolation.js'
import { captureLearnerAccess } from '../src/auth/localLease.js'
import { PRACTICE_MISSIONS } from '../src/data/practiceMissions.js'

class Store {
  constructor() { this.values = new Map() }
  get length() { return this.values.size }
  key(i) { return [...this.values.keys()][i] ?? null }
  getItem(k) { return this.values.has(String(k)) ? this.values.get(String(k)) : null }
  setItem(k, v) { this.values.set(String(k), String(v)) }
  removeItem(k) { this.values.delete(String(k)) }
}
function staleView(shared) {
  const frozen = new Map(shared.values)
  return {
    get length() { return frozen.size }, key(i) { return [...frozen.keys()][i] ?? null },
    getItem(k) { return frozen.has(String(k)) ? frozen.get(String(k)) : null },
    setItem(k, v) { shared.setItem(k, v); frozen.set(String(k), String(v)) },
    removeItem(k) { shared.removeItem(k); frozen.delete(String(k)) },
  }
}
function openTab(shared, owner) {
  const session = new Store()
  globalThis.localStorage = shared; globalThis.sessionStorage = session
  activateLocalAccount(shared, owner)
  return {
    session,
    act(fn, view = shared) {
      globalThis.localStorage = view; globalThis.sessionStorage = session
      try { return fn(captureLearnerAccess(view)) } finally { globalThis.localStorage = shared }
    },
  }
}

let passed = 0
const failures = []
function scenario(name, run) {
  try { run(); passed++; console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}
const MISSION = PRACTICE_MISSIONS.find(m => m.steps.length >= 2)
// The id AppContext gives a mission reward. Before the fix there was none
// (each React updater drew a random one), which is what `undefined` reproduces.
const rewardId = (active, part) => missions.missionRewardId?.(active, part)
const passing = step => ({ passed: true, feedback: 'ok' })

// What AppContext does when a step is answered (and, on the last one, the mission completes).
function answerStep(tab, active, view) {
  return tab.act(access => {
    const details = missions.getActiveMissionDetails(active)
    const isFinal = active.currentStepIndex === details.totalSteps - 1
    const advanced = missions.advanceMission(active, details.step, 'answer', passing(details.step), { access, deferSave: isFinal })
    if (!advanced) return { ok: false }
    let completed = null
    if (isFinal) {
      completed = missions.completeMission(advanced.activeMission, { access })
      if (!completed) return { ok: false }
    }
    let progress = loadLocalProgress()
    const stepEvent = { mission: details.mission, step: details.step, earnedXp: advanced.earnedThisStep, completed: false,
      eventId: rewardId(active, `step:${details.step.id}`) }
    progress = recordMissionProgress(progress, stepEvent)
    if (completed) progress = recordMissionProgress(progress, { mission: details.mission, step: details.step,
      earnedXp: Math.max(0, details.mission.rewardXp - completed.earnedXp), completed: true, eventId: rewardId(active, 'complete') })
    saveLocalProgress(progress, { access })
    return { ok: true, active: advanced.activeMission, completed }
  }, view)
}

console.log('check-store-concurrency')

scenario('missions: the same mission finished in two tabs pays its XP once', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  let active = a.act(access => missions.startMission(MISSION, { access }))
  for (let i = 0; i < MISSION.steps.length - 1; i++) active = answerStep(a, active).active
  const view = staleView(shared)                          // b still sees the cursor before a finished
  const fromA = answerStep(a, active)
  const fromB = answerStep(b, active, view)
  assert.equal(fromA.ok, true)
  void fromB
  const p = a.act(() => loadLocalProgress())
  const stepXp = MISSION.steps.reduce((s, step) => s + step.xp, 0)
  assert.equal(p.missionsCompleted, 1, 'one completion, however many tabs report it')
  assert.equal(p.xp, Math.max(stepXp, MISSION.rewardXp), 'step XP and the completion bonus are paid once')
})

scenario('missions: a step answered again by a stale tab pays nothing extra', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  const active = a.act(access => missions.startMission(MISSION, { access }))
  const view = staleView(shared)
  answerStep(a, active)
  answerStep(b, active, view)                             // b answers the same first step from a stale cursor
  const p = a.act(() => loadLocalProgress())
  assert.equal(p.xp, MISSION.steps[0].xp, 'the first step is paid once')
})

scenario('missions: two tabs completing different missions keep both history entries', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  const [m1, m2] = PRACTICE_MISSIONS.filter(m => m.steps.length >= 1).slice(0, 2)
  const finish = (tab, mission, view) => {
    let active = tab.act(access => missions.startMission(mission, { access }), view)
    for (let i = 0; i < mission.steps.length; i++) {
      const r = answerStep(tab, active, view)
      assert.equal(r.ok, true, mission.id + ' step ' + i)
      active = r.active
    }
  }
  const view = staleView(shared)                          // b's cache stops before a finishes
  finish(a, m1)
  finish(b, m2, view)                                     // b never sees a's completion
  const history = a.act(() => missions.loadCompletedMissions())
  assert.deepEqual(history.map(h => h.missionId).sort(), [m1.id, m2.id].sort(), 'both completions survive')
})

scenario('daily session: the bonus of one session is paid once across tabs, even from a stale cache', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  const bonus = { id: 'session-bonus:2026-10-30:standard', kind: 'xp', at: Date.now(), xp: 15 }
  const view = staleView(shared)
  assert.equal(a.act(access => commitProgressEvent(bonus, { access })), true)
  assert.equal(b.act(access => commitProgressEvent({ ...bonus, at: Date.now() + 5 }, { access }), view), true)
  assert.equal(a.act(() => loadLocalProgress()).xp, 15)
})

scenario('daily session: a stale session write never resurrects a completed day as unfinished', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  const base = { version: 1, id: '2026-10-30:standard', dayKey: '2026-10-30', durationMode: 'standard', status: 'active',
    awarded: false, currentBlockIndex: 0, blocks: [{ id: 'one', type: 'review' }, { id: 'done', type: 'session_completion' }] }
  a.act(access => saveSession(base, { access }))
  const stale = staleView(shared)
  a.act(access => saveSession({ ...base, currentBlockIndex: 1, status: 'completed', awarded: true }, { access }))
  b.act(access => saveSession({ ...base, currentBlockIndex: 0 }, { access }), stale)
  const stored = JSON.parse(a.act(access => (sessions.readStoredSessionRaw ? sessions.readStoredSessionRaw(access) : access.getItem(SESSION_KEY))))
  assert.equal(stored.status, 'completed', 'a completed day stays completed')
  assert.equal(stored.awarded, true)
  assert.equal(stored.currentBlockIndex, 1, 'the cursor never moves backwards within a session')
  void loadSession
})

scenario('memory context: dismissals made in two tabs are both kept', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  const ctxA = a.act(() => memory.loadMemoryContext()), ctxB = b.act(() => memory.loadMemoryContext())
  a.act(access => memory.dismissTopic('music', { context: ctxA, access }))
  b.act(access => memory.dismissTopic('games', { context: ctxB, access }))
  const merged = a.act(() => memory.loadMemoryContext())
  assert.deepEqual([...merged.dismissedTopicIds].sort(), ['games', 'music'])
})

scenario('mini-story: a stale tab cannot move the story back', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  const s = story.getStory('express_like')
  assert.ok(s, 'a story exists')
  const initial = story.createStoryState(s, { seed: 'x' })
  const save = (tab, state) => tab.act(access => (story.saveStoryState
    ? story.saveStoryState(state, s, { access })
    : access.setItem(story.STORY_STORAGE_KEY, JSON.stringify(state))))
  save(a, initial)
  save(a, story.advanceStory(story.advanceStory(initial, s), s))
  save(b, initial)                                        // b still holds the first turn
  const stored = a.act(access => JSON.parse(access.getItem(story.STORY_STORAGE_KEY)))
  assert.equal(stored.currentTurn, 2, 'the furthest turn is kept')
})

scenario('A → B → A: a stale A tab writes none of these stores into B', () => {
  const shared = new Store()
  const staleA = openTab(shared, 'A')
  const b = openTab(shared, 'B')
  const before = b.act(access => [missions.loadCompletedMissions().length, access.getItem('lc2-memory-context-v1')])
  openTab(shared, 'A')
  staleA.act(access => {
    assert.equal(missions.startMission(MISSION, { access }), null, 'the mission start is refused')
    assert.equal(memory.dismissTopic('music', { access }), null, 'the dismissal is refused')
    assert.equal(saveSession({ id: 'x' }, { access }), null, 'the session write is refused')
  })
  const after = openTab(shared, 'B').act(access => [missions.loadCompletedMissions().length, access.getItem('lc2-memory-context-v1')])
  assert.deepEqual(after, before, 'B is untouched')
  void applyProgressEvent
})

console.log(`\ncheck-store-concurrency — ${passed} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
