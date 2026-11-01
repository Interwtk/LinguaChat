#!/usr/bin/env node
/*
 * P0-1 — one account, two tabs, one browser.
 *
 * Every tab of LinguaChat keeps its own in-memory copy of the learner's local
 * progress (XP, streak, confidence, topics, words, sessions) and chat, and a
 * passive React effect persists that copy whenever it changes. Before this
 * check existed the copy was written whole, so the tab that saved last silently
 * erased whatever the other tab had earned in the meantime.
 *
 * The scenarios below drive the real storage modules exactly the way AppContext
 * does: load once per tab, mutate in memory, persist through the tab's captured
 * account lease, and (where the app listens) fold `storage` events back in.
 * Two tabs share one localStorage and own separate sessionStorage, like a real
 * browser. Nothing here touches the network or a real Supabase project.
 *
 * Run: node scripts/check-same-account-tabs.mjs
 */
import assert from 'node:assert/strict'
import * as progressStore from '../src/services/localProgress.js'
import { activateLocalAccount } from '../src/auth/browserDataIsolation.js'
import { captureLearnerAccess, NAMESPACE_PREFIX } from '../src/auth/localLease.js'
import { createLearnerModel, loadLearnerModel, saveLearnerModel, recordItemAttempt } from '../src/learning/engine/learnerModel.js'

const {
  loadLocalProgress, saveLocalProgress, recordPractice, recordMissionProgress,
  loadStoredMessages, saveStoredMessages,
} = progressStore
// The app's cross-tab hooks. Absent before the fix: a tab then never hears
// about the other tab's writes, which is exactly what the app used to do.
const mergeLocalProgress = progressStore.mergeLocalProgress
const readStoredProgress = progressStore.readStoredProgress
const readStoredConversation = progressStore.readStoredConversation
const mergeConversation = progressStore.mergeConversation
const applyProgressEvent = progressStore.applyProgressEvent
const commitProgressEvent = progressStore.commitProgressEvent
const startStoredConversation = progressStore.startStoredConversation

class Store {
  constructor() { this.values = new Map(); this.failWrites = null }
  get length() { return this.values.size }
  key(i) { return [...this.values.keys()][i] ?? null }
  getItem(k) { return this.values.has(String(k)) ? this.values.get(String(k)) : null }
  setItem(k, v) {
    if (this.failWrites?.(String(k))) throw new Error('QuotaExceededError')
    this.values.set(String(k), String(v))
  }
  removeItem(k) { this.values.delete(String(k)) }
}

let checks = 0
const ok = () => { checks++ }
const failures = []
function scenario(name, run) {
  try { run(); ok(); console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}

const DAY = 86400000
const T0 = Date.UTC(2026, 9, 30, 15, 0, 0)
const reply = (fields = {}) => ({ mode: 'chat', reply: 'Nice!', correction: null, suggestion: null, ...fields })

/*
 * A tab: its own sessionStorage (lease binding), its own React-like state, and
 * the same persistence calls AppContext makes.
 */
function openTab(shared, owner) {
  const session = new Store()
  globalThis.localStorage = shared
  globalThis.sessionStorage = session
  activateLocalAccount(shared, owner)
  const tab = {
    session,
    access: captureLearnerAccess(shared),
    progress: null,
    messages: null,
    act(fn) { globalThis.localStorage = shared; globalThis.sessionStorage = session; return fn() },
  }
  tab.act(() => {
    tab.progress = loadLocalProgress()
    tab.messages = loadStoredMessages({ id: 'welcome', role: 'lingua', text: 'Hi', ts: 1 })
  })
  return tab
}
// The passive effects: `saveLocalProgress(localProgress, { access })` and
// `saveStoredMessages(messages, { access })`, run after every state change.
function persist(tab) {
  return tab.act(() => ({
    progress: saveLocalProgress(tab.progress, { access: tab.access }),
    messages: saveStoredMessages(tab.messages, { access: tab.access }),
  }))
}
// The `storage` listener: fold another tab's write into this tab's state, then
// let the passive effects persist anything this tab still knows that storage
// does not. Without the listener (the old app) this is a no-op.
function hear(tab) {
  tab.act(() => {
    if (mergeLocalProgress && readStoredProgress) {
      const stored = readStoredProgress({ access: tab.access })
      if (stored) tab.progress = mergeLocalProgress(tab.progress, stored)
    }
    if (mergeConversation && readStoredConversation) {
      const stored = readStoredConversation({ access: tab.access })
      if (stored) tab.messages = mergeConversation(tab.messages, stored)
    }
  })
  persist(tab)
}
function practice(tab, message, at, fields) {
  tab.act(() => { tab.progress = recordPractice(tab.progress, { userMessage: message, response: reply(fields), at }) })
}
// awardEpisode / finishSession: a reward with a stable identity.
function reward(tab, id, xp, at = T0) {
  return tab.act(() => {
    if (applyProgressEvent && commitProgressEvent) {
      const event = { id, kind: 'xp', at, xp }
      if (!commitProgressEvent(event, { access: tab.access })) return false
      tab.progress = applyProgressEvent(tab.progress, event)
      return true
    }
    tab.progress = { ...tab.progress, xp: (tab.progress.xp || 0) + xp }
    return persist(tab).progress !== false
  })
}
function say(tab, id, text, ts) {
  tab.messages = [...tab.messages, { id, role: 'user', text, ts }]
}
function freshLoad(shared, owner) { return openTab(shared, owner) }
function storedKeys(shared, suffix) {
  return [...shared.values.keys()].filter(k => k.startsWith(NAMESPACE_PREFIX) && k.endsWith(':' + suffix))
}

console.log('check-same-account-tabs')

scenario('two tabs of one account practise at the same time — nothing is lost', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  practice(a, 'I like travel', T0)
  persist(a); hear(b)
  practice(b, 'I like music', T0 + 1000)       // b began from a stale copy
  persist(b); hear(a)
  const reloaded = freshLoad(shared, 'A')
  assert.equal(reloaded.progress.messagesSent, 2, 'both practice turns survive')
  assert.equal(reloaded.progress.xp, 20, 'both XP grants survive')
})

scenario('stale writes in the opposite order, before either tab hears the other', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  practice(a, 'hello', T0)
  practice(b, 'hello again', T0 + 10, { correction: 'Hello again.' })
  persist(b)                                    // b saves first
  persist(a)                                    // a saves its stale copy over it
  const reloaded = freshLoad(shared, 'A')
  assert.equal(reloaded.progress.messagesSent, 2)
  assert.equal(reloaded.progress.correctionsReceived, 1, "b's correction is not erased by a")
  assert.equal(reloaded.progress.xp, 25)
})

scenario('two independent achievements from two tabs both pay', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  assert.equal(reward(a, 'episode-award:first_greeting', 30), true)
  assert.equal(reward(b, 'session-bonus:2026-10-30:standard', 15), true)
  persist(a); persist(b); hear(a); hear(b)
  assert.equal(freshLoad(shared, 'A').progress.xp, 45)
  assert.equal(a.progress.xp, 45, 'tab a shows what tab b earned')
  assert.equal(b.progress.xp, 45, 'tab b shows what tab a earned')
})

scenario('the same reward reaching storage from two tabs is paid once', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  assert.equal(reward(a, 'episode-award:first_greeting', 30), true)
  assert.equal(reward(b, 'episode-award:first_greeting', 30), true)
  assert.equal(reward(a, 'episode-award:first_greeting', 30), true, 'a retry is idempotent')
  persist(a); persist(b); hear(a); hear(b)
  assert.equal(freshLoad(shared, 'A').progress.xp, 30)
  assert.equal(a.progress.xp, 30)
  assert.equal(b.progress.xp, 30)
})

scenario('streak follows the calendar, not the order the tabs saved in', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  practice(b, 'day two', T0 + DAY)              // the later day is saved first
  persist(b)
  practice(a, 'day one', T0)
  persist(a); hear(b)
  const p = freshLoad(shared, 'A').progress
  assert.equal(p.streak, 2, 'two consecutive days')
  assert.equal(p.lastPracticeDate, new Date(T0 + DAY).toLocaleDateString('sv-SE'))
})

scenario('a reload of one tab sees everything both tabs saved', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  practice(a, 'one', T0); persist(a)
  practice(b, 'two', T0 + 5); persist(b)
  const a2 = freshLoad(shared, 'A')              // tab a reloads
  practice(a2, 'three', T0 + 10); persist(a2)
  persist(b)                                     // b keeps its stale copy and saves again
  assert.equal(freshLoad(shared, 'A').progress.messagesSent, 3)
})

scenario('a tab closed before its passive save loses only its unsaved turn', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  practice(a, 'saved', T0); persist(a); hear(b)
  practice(b, 'never saved', T0 + 5)             // b closes before the effect runs
  practice(a, 'saved too', T0 + 10); persist(a)
  const p = freshLoad(shared, 'A').progress
  assert.equal(p.messagesSent, 2)
  assert.equal(p.xp, 20)
})

scenario('a write interrupted by Storage keeps the last durable value and retries later', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  practice(a, 'one', T0); persist(a)
  shared.failWrites = key => key.endsWith(':lc2-local-progress')
  practice(b, 'two', T0 + 5)
  assert.equal(persist(b).progress, false, 'a denied write is reported as not saved')
  assert.equal(freshLoad(shared, 'A').progress.messagesSent, 1, 'the durable value is intact')
  shared.failWrites = null
  practice(b, 'three', T0 + 10)
  assert.notEqual(persist(b).progress, false)
  const p = freshLoad(shared, 'A').progress
  assert.equal(p.messagesSent, 3, "b's earlier unsaved turn is persisted on the next save")
  assert.equal(p.xp, 30)
})

scenario('a reward is not confirmed when its write is refused', () => {
  const shared = new Store()
  const a = openTab(shared, 'A')
  shared.failWrites = key => key.endsWith(':lc2-local-progress')
  assert.equal(reward(a, 'episode-award:first_greeting', 30), false)
  shared.failWrites = null
  assert.equal(freshLoad(shared, 'A').progress.xp, 0)
  assert.equal(reward(a, 'episode-award:first_greeting', 30), true, 'the same reward can be retried')
  assert.equal(freshLoad(shared, 'A').progress.xp, 30)
})

scenario('A → B → A: a stale A tab cannot write into B or into the new A session', () => {
  const shared = new Store()
  const staleA = openTab(shared, 'A')
  practice(staleA, 'A one', T0); persist(staleA)
  const b = openTab(shared, 'B')
  practice(b, 'B one', T0 + 5); persist(b)
  const a2 = openTab(shared, 'A')
  practice(staleA, 'A stale', T0 + 10)
  const result = persist(staleA)
  assert.equal(result.progress, false, 'the stale tab is refused')
  assert.equal(a2.progress.messagesSent, 1, 'A keeps exactly its own history')
  assert.equal(freshLoad(shared, 'A').progress.messagesSent, 1)
  assert.equal(freshLoad(shared, 'B').progress.messagesSent, 1, 'B is untouched')
})

scenario('two tabs chatting keep both conversations, without duplicates', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  say(a, 'u100', 'from a', 100); persist(a)
  say(b, 'u100', 'from b, same millisecond id', 100)   // ids are `u${Date.now()}`
  say(b, 'u200', 'b again', 200)
  persist(b); persist(a); hear(a); hear(b); persist(a)
  const texts = freshLoad(shared, 'A').messages.map(m => m.text)
  assert.deepEqual(texts, ['Hi', 'from a', 'from b, same millisecond id', 'b again'])
  assert.deepEqual(a.messages.map(m => m.text), texts, 'tab a shows b’s messages')
})

scenario('two tabs opened on an empty chat show one welcome, not two', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  a.messages = [{ id: 'welcome', role: 'lingua', text: 'Hi from a', ts: 10 }]
  b.messages = [{ id: 'welcome', role: 'lingua', text: 'Hi from b', ts: 11 }]
  persist(a); persist(b); hear(a); hear(b)
  assert.deepEqual(freshLoad(shared, 'A').messages.map(m => m.text), ['Hi from a'])
  assert.deepEqual(b.messages.map(m => m.text), ['Hi from a'])
})

scenario('clearing the chat in one tab is not undone by the other tab', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  say(a, 'u1', 'old one', 100); persist(a); hear(b)
  const welcome = { id: 'welcome', role: 'lingua', text: 'Hi again', ts: 500 }
  a.act(() => {
    if (startStoredConversation) assert.equal(startStoredConversation(welcome, { access: a.access }), true)
    else assert.notEqual(saveStoredMessages([welcome], { access: a.access }), false)
  })
  a.messages = [welcome]
  say(b, 'u2', 'b after the clear', 600)         // b has not heard of the clear yet
  persist(b); hear(a); hear(b)
  const texts = freshLoad(shared, 'A').messages.map(m => m.text)
  assert.deepEqual(texts, ['Hi again', 'b after the clear'])
  assert.deepEqual(b.messages.map(m => m.text), texts)
})

scenario('learner-model evidence from two tabs is merged (regression)', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  const ma = a.act(() => loadLearnerModel()), mb = b.act(() => loadLearnerModel())
  a.act(() => { recordItemAttempt(ma, 'hello', { correct: true, independent: true, eventId: 'a-1' }); saveLearnerModel(ma) })
  b.act(() => { recordItemAttempt(mb, 'goodbye', { correct: true, independent: true, eventId: 'b-1' }); saveLearnerModel(mb) })
  const merged = a.act(() => loadLearnerModel())
  assert.ok(merged.languageItems.hello && merged.languageItems.goodbye, 'both items survive')
  void createLearnerModel
})

scenario('progress survives a full restart of the browser', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  practice(a, 'one', T0); persist(a)
  assert.equal(reward(b, 'session-bonus:x', 15), true); persist(b)
  // A restart drops every sessionStorage and every in-memory copy.
  const restarted = freshLoad(shared, 'A')
  assert.equal(restarted.progress.xp, 25)
  assert.equal(restarted.progress.messagesSent, 1)
  assert.equal(storedKeys(shared, 'lc2-local-progress').length, 1)
})

scenario('a reset in one tab is not undone by a stale tab, which keeps only later work', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  practice(a, 'before reset', Date.now() - 60000); persist(a); hear(b)
  const empty = a.act(() => progressStore.createEmptyProgress({ reset: true }))
  a.act(() => assert.notEqual(saveLocalProgress(empty, { access: a.access }), false))
  a.progress = empty
  persist(b)                                     // b never heard of the reset
  assert.equal(freshLoad(shared, 'A').progress.messagesSent, 0, 'the reset stands')
  practice(b, 'after reset', Date.now() + 1000); persist(b)
  assert.equal(freshLoad(shared, 'A').progress.messagesSent, 1, "b's post-reset turn counts")
})

scenario('compaction keeps totals exact and never double-counts an old copy', () => {
  if (!progressStore.mergeLocalProgress) throw new Error('no ledger')
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  const old = Date.now() - 30 * DAY
  for (let i = 0; i < 3; i++) practice(a, 'old ' + i, old + i * DAY)
  persist(a); hear(b)                            // b now holds the same old events
  practice(a, 'recent', Date.now()); persist(a)  // a's save folds the old events
  const stored = JSON.parse(shared.getItem(storedKeys(shared, 'lc2-local-progress')[0]))
  assert.equal(stored.events.length, 1, 'only the recent event stays in the ledger')
  assert.equal(stored.base.folded, 3)
  persist(b)                                     // b re-sends the folded events
  const p = freshLoad(shared, 'A').progress
  assert.equal(p.messagesSent, 4)
  assert.equal(p.xp, 40)
  assert.equal(p.streak, 1, 'the old three-day run ended weeks ago')
})

scenario('an existing version-1 record keeps every total exactly', () => {
  const shared = new Store()
  const a = openTab(shared, 'A')
  const legacy = {
    version: 1, startedAt: 1700000000000, lastPracticeDate: '2026-10-29', streak: 6,
    messagesSent: 41, correctionsReceived: 7, xp: 455, confidence: 95,
    topics: ['travel'], learnedItems: [{ id: 'water', word: 'water', mastery: 0.5, seen: 2 }],
    sessions: [{ id: '2026-10-29', messages: 4 }], missionsCompleted: 2,
  }
  a.act(() => a.access.setItem('lc2-local-progress', JSON.stringify(legacy)))
  const loaded = freshLoad(shared, 'A').progress
  for (const [field, value] of Object.entries(legacy)) {
    if (field === 'version') continue
    assert.deepEqual(loaded[field], value, field + ' survives the upgrade')
  }
  const next = freshLoad(shared, 'A')
  practice(next, 'next', Date.UTC(2026, 9, 30, 12)); persist(next)
  const after = freshLoad(shared, 'A').progress
  assert.equal(after.xp, 465)
  assert.equal(after.messagesSent, 42)
  assert.equal(after.streak, 7, 'the stored streak continues on the next day')
})

scenario('unreadable stored progress is quarantined, never silently replaced', () => {
  const shared = new Store()
  const a = openTab(shared, 'A')
  a.act(() => a.access.setItem('lc2-local-progress', '{"xp": 120, "stre'))
  const b = openTab(shared, 'A')
  practice(b, 'hello', T0)
  assert.notEqual(persist(b).progress, false)
  const quarantined = [...shared.values.entries()].filter(([k]) => k.includes(':lc2-quarantine:lc2-local-progress:'))
  assert.equal(quarantined.length, 1, 'the original bytes are kept')
  assert.equal(JSON.parse(quarantined[0][1]).raw, '{"xp": 120, "stre')
  a.act(() => a.access.setItem('lc2-local-progress', 'not json either'))
  shared.failWrites = key => key.includes('lc2-quarantine:')
  practice(b, 'again', T0 + 1)
  assert.equal(persist(b).progress, false, 'no overwrite when the copy cannot be kept')
  shared.failWrites = null
  assert.equal(a.act(() => a.access.getItem('lc2-local-progress')), 'not json either')
})

scenario('merging is order-independent and idempotent', () => {
  if (!progressStore.mergeLocalProgress) throw new Error('no ledger')
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  practice(a, 'travel', T0); practice(a, 'music', T0 + 2, { correction: 'Music.' })
  practice(b, 'food', T0 + 1); practice(b, 'work', T0 + 3)
  const ab = progressStore.mergeLocalProgress(a.progress, b.progress)
  const ba = progressStore.mergeLocalProgress(b.progress, a.progress)
  const strip = p => { const { ledger, startedAt, ...totals } = p; return totals }
  assert.deepEqual(strip(ab), strip(ba))
  assert.equal(progressStore.mergeLocalProgress(ab, ab), ab, 'merging a copy with itself changes nothing')
  assert.equal(progressStore.mergeLocalProgress(ab, b.progress), ab)
})

scenario('an interruption between starting a conversation and writing it still hides the old one', () => {
  if (!startStoredConversation) throw new Error('no conversation epoch')
  const shared = new Store()
  const a = openTab(shared, 'A')
  say(a, 'u1', 'old', 100); persist(a)
  shared.failWrites = key => key.endsWith(':lc2-chat-messages')
  a.act(() => assert.equal(startStoredConversation({ id: 'welcome', role: 'lingua', text: 'New', ts: 500 }, { access: a.access }), false))
  shared.failWrites = null
  assert.deepEqual(freshLoad(shared, 'A').messages.map(m => m.text), ['Hi'], 'the erased conversation stays erased')
})

console.log(`\ncheck-same-account-tabs — ${checks} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
