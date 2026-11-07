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
import { settleCollections, writerId } from '../src/services/writerKeys.js'
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
// Two days ago, at 15:00 UTC. It must move with the clock: the ledger folds events
// past its 7-day horizon, so a fixed date stopped being "recent" on 2026-11-06.
const T0 = Math.floor(Date.now() / DAY) * DAY - 2 * DAY + 15 * 3600000
const dayBefore = new Date(T0 - DAY).toLocaleDateString('sv-SE')
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
  // One copy per writer (tab): `<suffix>~w~<writer>`, plus any older shared key.
  return [...shared.values.keys()].filter(k => k.startsWith(NAMESPACE_PREFIX) && (k.endsWith(':' + suffix) || k.includes(':' + suffix + '~w~')))
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
  shared.failWrites = key => key.includes(':lc2-local-progress')
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
  shared.failWrites = key => key.includes(':lc2-local-progress')
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
  assert.equal(storedKeys(shared, 'lc2-local-progress').length, 2, 'one copy per writer, never a shared overwrite')
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
  const stored = JSON.parse(shared.getItem(storedKeys(shared, 'lc2-local-progress').find(k => k.includes(a.act(() => writerId())))))
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
    version: 1, startedAt: 1700000000000, lastPracticeDate: dayBefore, streak: 6,
    messagesSent: 41, correctionsReceived: 7, xp: 455, confidence: 95,
    topics: ['travel'], learnedItems: [{ id: 'water', word: 'water', mastery: 0.5, seen: 2 }],
    sessions: [{ id: dayBefore, messages: 4 }], missionsCompleted: 2,
  }
  a.act(() => a.access.setItem('lc2-local-progress', JSON.stringify(legacy)))
  const loaded = freshLoad(shared, 'A').progress
  for (const [field, value] of Object.entries(legacy)) {
    if (field === 'version') continue
    assert.deepEqual(loaded[field], value, field + ' survives the upgrade')
  }
  const next = freshLoad(shared, 'A')
  practice(next, 'next', T0 - 3 * 3600000); persist(next)
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

/*
 * Adversarial: a browser tab reads localStorage from its own cache, which other
 * tabs update asynchronously. `staleView` freezes what a tab can read while
 * its writes still reach the real store — the interleaving that lost a whole
 * tab's 300 verified saves in two real Chromium tabs with the shared-key design.
 */
function staleView(shared) {
  const frozen = new Map(shared.values)
  return {
    get length() { return frozen.size },
    key(i) { return [...frozen.keys()][i] ?? null },
    getItem(k) { return frozen.has(String(k)) ? frozen.get(String(k)) : null },
    setItem(k, v) { shared.setItem(k, v); frozen.set(String(k), String(v)) },
    removeItem(k) { shared.removeItem(k); frozen.delete(String(k)) },
  }
}
scenario('a tab writing from a stale cache cannot erase another tab’s saves', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  // a reads storage now; b then saves 30 turns a never sees.
  const view = staleView(shared)
  for (let i = 0; i < 30; i++) { practice(b, 'b ' + i, T0 + i); assert.notEqual(persist(b).progress, false) }
  // a saves 30 turns through its stale view and never hears b (closed).
  for (let i = 0; i < 30; i++) {
    practice(a, 'a ' + i, T0 + 100 + i)
    a.act(() => {
      globalThis.localStorage = view
      try { assert.notEqual(saveLocalProgress(a.progress, { access: captureLearnerAccess(view) }), false) }
      finally { globalThis.localStorage = shared }
    })
  }
  const p = freshLoad(shared, 'A').progress
  assert.equal(p.messagesSent, 60, 'both tabs’ verified saves survive')
  assert.equal(p.xp, 600)
})

/*
 * P2, found by the real two-tab harness at 600 turns per tab (P1 code lost
 * 101 of 1200 too): past the 500-event cap, compaction cut through the last
 * seconds, and the other tab's turns this tab's stale cache had not shown yet
 * fell below the cut — treated as already counted, then dropped on merge.
 */
scenario('past the size cap, a stale tab cannot fold away turns it has not seen yet', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  const now = Date.now()
  const view = staleView(shared)
  for (let i = 0; i < 600; i++) { practice(b, 'b ' + i, now - 2000 + i); persist(b) }
  for (let i = 0; i < 600; i++) {
    practice(a, 'a ' + i, now - 1000 + i)
    a.act(() => {
      globalThis.localStorage = view
      try { assert.notEqual(saveLocalProgress(a.progress, { access: captureLearnerAccess(view) }), false) }
      finally { globalThis.localStorage = shared }
    })
  }
  assert.equal(freshLoad(shared, 'A').progress.messagesSent, 1200, 'every verified turn of both tabs survives')
  // Once the turns have settled, the cap folds them — and still nothing is lost.
  const realNow = Date.now
  Date.now = () => now + 11 * 60 * 1000
  try {
    const later = freshLoad(shared, 'A')
    practice(later, 'later', Date.now())
    persist(later)
    const after = freshLoad(shared, 'A').progress
    assert.equal(after.messagesSent, 1201)
    const own = JSON.parse(shared.getItem(storedKeys(shared, 'lc2-local-progress').find(k => k.includes(later.act(() => writerId())))))
    assert.ok(own.events.length <= 500, 'the ledger is bounded again: ' + own.events.length)
  } finally { Date.now = realNow }
})

/*
 * P3 — adversarial integrity. More than 1,200 turns, long pauses, and the
 * edge of the protection window, measured rather than assumed.
 */
function withClock(at, fn) {
  const real = Date.now
  Date.now = () => at
  try { return fn() } finally { Date.now = real }
}
const MIN = 60 * 1000

scenario('three tabs, 2,400 turns with stale caches inside the settle window: nothing lost, then bounded', () => {
  const shared = new Store()
  const now = Date.now()
  const tabs = [openTab(shared, 'A'), openTab(shared, 'A'), openTab(shared, 'A')]
  const views = tabs.map(() => staleView(shared))
  tabs.forEach((tab, t) => {
    for (let i = 0; i < 800; i++) {
      practice(tab, `t${t} ${i}`, now - 3 * MIN + t * 1000 + i)
      tab.act(() => {
        globalThis.localStorage = views[t]
        try { assert.notEqual(saveLocalProgress(tab.progress, { access: captureLearnerAccess(views[t]) }), false) }
        finally { globalThis.localStorage = shared }
      })
    }
  })
  assert.equal(freshLoad(shared, 'A').progress.messagesSent, 2400, 'every verified turn of three tabs')
  withClock(now + 11 * MIN, () => {
    const later = freshLoad(shared, 'A')
    practice(later, 'later', Date.now()); persist(later)
    assert.equal(freshLoad(shared, 'A').progress.messagesSent, 2401)
    const own = JSON.parse(shared.getItem(storedKeys(shared, 'lc2-local-progress').find(k => k.includes(later.act(() => writerId())))))
    assert.ok(own.events.length <= 500, 'bounded again after settling: ' + own.events.length)
  })
})

scenario('a tab paused for two hours resumes with stale memory: nothing lost, nothing counted twice', () => {
  const shared = new Store()
  const start = Date.now() - 3 * 60 * MIN
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  withClock(start, () => { for (let i = 0; i < 50; i++) { practice(b, 'b ' + i, start + i); persist(b) } })
  // b is paused (a background tab, a sleeping laptop): it keeps its old memory.
  for (let i = 0; i < 900; i++) {
    const at = start + 60 * MIN + i * 8000            // two hours of a's turns, folding as it goes
    withClock(at, () => { hear(a); practice(a, 'a ' + i, at); persist(a) })
  }
  const resumedAt = start + 3 * 60 * MIN
  withClock(resumedAt, () => {
    for (let i = 0; i < 10; i++) { practice(b, 'b late ' + i, resumedAt + i); persist(b) }
    const p = freshLoad(shared, 'A').progress
    assert.equal(p.messagesSent, 960, 'b’s old turns are counted once, a’s all kept, b’s new ones added')
    assert.ok(p.ledger.base.folded > 0, 'and compaction did happen in between')
  })
})

/*
 * The edge P3 measured: a turn that only one tab holds — its save failing
 * (quota) for longer than the settle window — while another tab folds past it.
 * P3 dropped it (the merge judged "counted" by time). Since P4 the base records
 * which events it folded by identity, so the stranded turn is counted on
 * recovery. Wider matrix: check-ledger-integrity.mjs.
 */
scenario('beyond the protection window: a turn whose save kept failing for 15 minutes', () => {
  const shared = new Store()
  const start = Date.now() - 60 * MIN
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  const bKey = () => b.act(() => writerId())
  shared.failWrites = key => key.includes(bKey())                        // only b's copy cannot be written
  const failed = withClock(start, () => { practice(b, 'b stranded', start); return persist(b).progress })
  assert.equal(failed, false, 'b is told its turn is not saved')
  for (let i = 0; i < 600; i++) {
    const at = start + i * 1500                                           // 15 minutes of a's turns
    withClock(at, () => { practice(a, 'a ' + i, at); persist(a) })
  }
  shared.failWrites = null
  const recovered = withClock(start + 16 * MIN, () => { hear(b); return persist(b).progress })
  assert.notEqual(recovered, false)
  const total = freshLoad(shared, 'A').progress.messagesSent
  assert.equal(total, 601, 'the stranded turn is counted once it can be saved (P3 lost it)')
})

// Small deterministic PRNG so every failure can be replayed by its seed.
function prng(seed) { let x = seed >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 2 ** 32) }

scenario('random interleavings of 3 tabs, stale caches and abrupt closes lose no verified save (200 seeds)', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const rand = prng(seed)
    const shared = new Store()
    const tabs = [0, 1, 2].map(() => ({ tab: openTab(shared, 'A'), alive: true, saved: 0, done: 0, view: null }))
    let at = T0
    for (let step = 0; step < 60; step++) {
      const t = tabs[Math.floor(rand() * tabs.length)]
      if (!t.alive) continue
      const roll = rand()
      if (roll < 0.06) { t.alive = false; continue }                       // closed abruptly
      if (roll < 0.25) { t.view = staleView(shared); continue }            // cache falls behind
      if (roll < 0.35) { t.view = null; hear(t.tab); continue }            // catches up
      practice(t.tab, `s${seed} t${tabs.indexOf(t)} #${t.done++}`, at++)
      const ok = t.view
        ? t.tab.act(() => { globalThis.localStorage = t.view; try { return saveLocalProgress(t.tab.progress, { access: captureLearnerAccess(t.view) }) } finally { globalThis.localStorage = shared } })
        : persist(t.tab).progress
      if (ok !== false) t.saved = t.done
    }
    const expected = tabs.reduce((sum, t) => sum + t.saved, 0)
    const p = freshLoad(shared, 'A').progress
    assert.equal(p.messagesSent, expected, `seed ${seed}: every verified save survives`)
    assert.equal(p.xp, expected * 10, `seed ${seed}: XP matches`)
  }
})

scenario('a reward re-sent after its event was compacted is not paid again', () => {
  const shared = new Store()
  const a = openTab(shared, 'A')
  const old = Date.now() - 30 * DAY
  assert.equal(reward(a, 'episode-award:first_greeting', 30, old), true)
  practice(a, 'recent', Date.now()); persist(a)                      // compaction folds the award
  const stored = JSON.parse(shared.getItem(storedKeys(shared, 'lc2-local-progress').find(k => k.includes(a.act(() => writerId())))))
  assert.equal(stored.events.some(e => e.id === 'episode-award:first_greeting'), false, 'the award event was folded')
  assert.deepEqual(stored.base.foldedIds, ['episode-award:first_greeting'], 'its id is remembered')
  const b = openTab(shared, 'A')
  assert.equal(reward(b, 'episode-award:first_greeting', 30, Date.now()), true, 'a retry is accepted as already paid')
  persist(b)
  assert.equal(freshLoad(shared, 'A').progress.xp, 40, 'paid once: 30 + 10')
})

scenario('learner-model evidence saved from a stale cache does not erase the other tab’s evidence', () => {
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  const ma = a.act(() => loadLearnerModel()), mb = b.act(() => loadLearnerModel())
  const view = staleView(shared)                           // a's cache stops here
  b.act(() => { recordItemAttempt(mb, 'goodbye', { correct: true, independent: true }); assert.equal(saveLearnerModel(mb, { verified: true }), true) })
  a.act(() => {
    globalThis.localStorage = view
    try {
      recordItemAttempt(ma, 'hello', { correct: true, independent: true })
      assert.equal(saveLearnerModel(ma, { verified: true }), true)
    } finally { globalThis.localStorage = shared }
  })
  const merged = freshLoad(shared, 'A').act(() => loadLearnerModel())
  assert.ok(merged.languageItems.hello, "a's evidence")
  assert.ok(merged.languageItems.goodbye, "b's evidence survives a's stale save")
})

scenario('years of daily bonuses never let an old reward be paid again (bounded memory, exact guarantee)', () => {
  const shared = new Store()
  const a = openTab(shared, 'A')
  const now = Date.now()
  const day = i => new Date(now - (2600 - i) * DAY).toISOString().slice(0, 10)
  // An episode award on day 0, then ~7 years of daily bonuses and missions.
  assert.equal(reward(a, 'episode-award:first_greeting', 30, now - 2600 * DAY), true)
  a.act(() => {
    let p = loadLocalProgress()
    for (let i = 1; i <= 2550; i++) {
      p = applyProgressEvent(p, { id: `session-bonus:${day(i)}:standard`, kind: 'xp', at: now - (2600 - i) * DAY, xp: 15 })
      if (i % 3 === 0) p = applyProgressEvent(p, { id: `mission:m${i % 7}:${now - (2600 - i) * DAY}:complete`, kind: 'xp', at: now - (2600 - i) * DAY + 5, xp: 10 })
    }
    assert.notEqual(saveLocalProgress(p, { access: a.access }), false)
  })
  const before = freshLoad(shared, 'A').progress.xp
  const stored = JSON.parse(shared.getItem(storedKeys(shared, 'lc2-local-progress').find(k => k.includes(a.act(() => writerId())))))
  assert.ok(JSON.stringify(stored.base).length < 60000, 'the remembered ids stay small: ' + JSON.stringify(stored.base).length)
  // Every old reward re-sent today is refused: the oldest bonus, a middle one,
  // the first episode award and an old mission.
  for (const id of ['episode-award:first_greeting', `session-bonus:${day(1)}:standard`, `session-bonus:${day(1200)}:standard`,
    `mission:m3:${now - (2600 - 3) * DAY}:complete`]) {
    assert.equal(reward(a, id, 99, now), true, id + ' counts as already paid (no endless retry)')
  }
  assert.equal(freshLoad(shared, 'A').progress.xp, before, 'nothing old is paid twice')
  // A genuinely new reward is still paid.
  assert.equal(reward(a, `session-bonus:${new Date(now).toISOString().slice(0, 10)}:deep`, 15, now), true)
  assert.equal(freshLoad(shared, 'A').progress.xp, before + 15)
})

scenario('storage near its quota: the save reports failure, nothing stored is damaged, the next save catches up', () => {
  const shared = new Store()
  const a = openTab(shared, 'A')
  practice(a, 'one', T0); persist(a)
  const before = new Map(shared.values)
  shared.failWrites = key => key.includes(':lc2-')            // quota exceeded for every learner write
  practice(a, 'two', T0 + 1)
  assert.equal(persist(a).progress, false)
  assert.equal(reward(a, 'episode-award:full', 30, T0 + 2), false, 'a reward is not confirmed either')
  for (const [k, v] of before) assert.equal(shared.getItem(k), v, 'stored data untouched: ' + k)
  shared.failWrites = null
  assert.notEqual(persist(a).progress, false)
  assert.equal(reward(a, 'episode-award:full', 30, T0 + 3), true)
  const p = freshLoad(shared, 'A').progress
  assert.equal(p.messagesSent, 2)
  assert.equal(p.xp, 50)
})

scenario('a backdated event takes its place in the calendar; one already counted is refused, however it returns', () => {
  const shared = new Store()
  const a = openTab(shared, 'A')
  const now = Date.now()
  practice(a, 'today', now); persist(a)
  practice(a, 'two days ago, arriving late', now - 2 * DAY); persist(a)
  const p = freshLoad(shared, 'A').progress
  assert.equal(p.messagesSent, 2)
  assert.equal(p.lastPracticeDate, new Date(now).toLocaleDateString('sv-SE'), 'the latest day stays the latest')
  // P4: a NEW event is counted once even with an old clock (it is new by
  // identity) — and it never moves the last practice day backwards.
  const before = freshLoad(shared, 'A').progress
  let late = null
  a.act(() => {
    const next = applyProgressEvent(loadLocalProgress(), { id: 'practice:late', kind: 'xp', at: now - 60 * DAY, xp: 500 })
    late = next.ledger.events.find(e => e.id === 'practice:late')
    assert.ok(late.w && late.seq, 'a new event carries its writer and sequence')
    assert.notEqual(saveLocalProgress(next, { access: a.access }), false)  // 60 days old: folded on this save
  })
  const counted = freshLoad(shared, 'A').progress
  assert.equal(counted.xp, before.xp + 500, 'counted once')
  assert.equal(counted.lastPracticeDate, before.lastPracticeDate)
  // The SAME event coming back (a retry, a stale copy) is refused by identity.
  a.act(() => {
    const again = applyProgressEvent(loadLocalProgress(), late)
    assert.notEqual(saveLocalProgress(again, { access: a.access }), false)
  })
  assert.equal(freshLoad(shared, 'A').progress.xp, counted.xp, 'an event already folded is not paid again')
  // A pre-P4 copy (no identity) still follows the time rule: older than the base, already counted.
  const legacyKey = storedKeys(shared, 'lc2-local-progress')[0].replace(/~w~.*$/, '~w~legacy.p3')
  shared.values.set(legacyKey, JSON.stringify({ version: 2, epoch: { id: 'initial', at: 0 }, writer: 'legacy.p3', writtenAt: 1,
    base: { snapshot: {}, startedAt: 1, foldedBefore: 0, folded: 0, foldedIds: [] },
    events: [{ id: 'practice:legacy-old', kind: 'xp', at: now - 50 * DAY, xp: 700 }] }))
  assert.equal(freshLoad(shared, 'A').progress.xp, counted.xp, 'a legacy event older than the folded base is not counted again')
})

scenario('old data restores: an original v1 record, a P0 shared ledger and a P1 ledger with a 2000-id window', () => {
  const shared = new Store()
  const a = openTab(shared, 'A')
  const v1 = { version: 1, xp: 120, messagesSent: 12, correctionsReceived: 2, streak: 3, lastPracticeDate: '2026-10-28', confidence: 71, topics: ['travel'], learnedItems: [], sessions: [], missionsCompleted: 1 }
  a.act(() => a.access.setItem('lc2-local-progress', JSON.stringify(v1)))
  assert.equal(freshLoad(shared, 'A').progress.xp, 120, 'v1 totals')
  // A P1 copy whose window had dropped every episode award (the old alphabetical cut).
  const p1 = { version: 2, epoch: { id: 'initial', at: 0 }, writer: 'old.p1', writtenAt: 1,
    // A P1 copy is always derived from what was stored, so its base holds the v1 totals.
    base: { snapshot: { ...v1 }, startedAt: 1, foldedBefore: 1, folded: 0,
      foldedIds: Array.from({ length: 2000 }, (_, i) => `session-bonus:2020-01-01:${i}`) }, events: [] }
  a.act(() => a.access.setItem('lc2-local-progress~w~old.p1', JSON.stringify(p1)))
  const restored = freshLoad(shared, 'A').progress
  assert.equal(restored.xp, 120, 'P1 copy merges without inventing or losing totals')
  assert.equal(reward(a, 'session-bonus:2020-01-01:5', 15, Date.now()), true)
  assert.equal(freshLoad(shared, 'A').progress.xp, 120, 'a reward the P1 window remembered is still refused')
  persist(a)
  const own = JSON.parse(shared.getItem(storedKeys(shared, 'lc2-local-progress').find(k => k.includes(a.act(() => writerId())))))
  assert.ok(own.base.foldedIds.length <= 400 + 171, 'the old window is pruned into floors: ' + own.base.foldedIds.length)
  assert.ok(own.base.foldedFloors.session, 'with a floor that keeps the guarantee')
})

/*
 * Cleaning up other tabs' copies (P2). A copy is removed only when its tab is
 * closed — the browser released that tab's Web Lock — and everything in it is
 * already in this tab's verified copy. These scenarios use a lock manager the
 * test controls, so "closing a tab" is explicit and nothing depends on timers.
 */
const realNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
function fakeLocks({ supported = true } = {}) {
  const held = new Set()
  const locks = {
    request(name) { held.add(name); return new Promise(() => {}) },
    async query() { return { held: [...held].map(name => ({ name })), pending: [] } },
  }
  Object.defineProperty(globalThis, 'navigator', { value: supported ? { locks } : {}, configurable: true, writable: true })
  return { close: tab => held.delete('lc2-writer:' + tab.act(() => writerId())) }
}
function restoreNavigator() {
  if (realNavigator) Object.defineProperty(globalThis, 'navigator', realNavigator)
}
async function asyncScenario(name, run) {
  try { await run(); ok(); console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
  finally { restoreNavigator() }
}
const copyOf = (shared, tab) => storedKeys(shared, 'lc2-local-progress').find(k => k.includes(tab.act(() => writerId())))
const ageCopy = (shared, key, ms) => { const v = JSON.parse(shared.getItem(key)); v.writtenAt -= ms; shared.values.set(key, JSON.stringify(v)) }

await asyncScenario('a closed tab’s redundant copy is removed; an open tab’s copy never is, however long idle', async () => {
  const locks = fakeLocks()
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A'), c = openTab(shared, 'A')
  practice(b, 'from b', T0); persist(b)
  practice(c, 'from c', T0 + 1); persist(c)
  ageCopy(shared, copyOf(shared, c), 10 * 60 * 60 * 1000)   // c open but idle for ten hours
  ageCopy(shared, copyOf(shared, b), -60 * 1000)            // b written "in the future": timers decide nothing
  locks.close(b)
  hear(a); persist(a)
  await settleCollections()
  assert.equal(Boolean(copyOf(shared, b)), false, "the closed tab's copy, already held by a, is removed")
  assert.equal(Boolean(copyOf(shared, c)), true, 'an open tab is never cleaned up')
  assert.equal(freshLoad(shared, 'A').progress.messagesSent, 2, 'and nothing was lost')
})

await asyncScenario('a closed tab’s copy that holds something nobody else has is kept', async () => {
  const locks = fakeLocks()
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  practice(a, 'only a', T0); persist(a)
  const view = staleView(shared)                            // a's cache stops before b writes
  practice(b, 'only b', T0 + 1); persist(b)
  locks.close(b)
  practice(a, 'a again', T0 + 2)
  a.act(() => {
    globalThis.localStorage = view
    try { saveLocalProgress(a.progress, { access: captureLearnerAccess(view) }) } finally { globalThis.localStorage = shared }
  })
  await settleCollections()
  assert.equal(Boolean(copyOf(shared, b)), true, "b's turn exists only in b's copy: kept")
  hear(a); persist(a)                                       // a now holds b's turn too
  await settleCollections()
  assert.equal(Boolean(copyOf(shared, b)), false, 'only once a holds it is the copy removed')
  assert.equal(freshLoad(shared, 'A').progress.messagesSent, 3)
})

await asyncScenario('a write that lands while a copy is being cleaned is never deleted', async () => {
  fakeLocks()                                               // b's lock is not registered yet: it looks closed
  const shared = new Store()
  const a = openTab(shared, 'A')
  const b = openTab(shared, 'A')
  practice(b, 'b one', T0); persist(b)
  const bKey = copyOf(shared, b)
  // b holds no lock (as a page in its first instant would) — and writes again
  // exactly between the cleaner's first read and its re-check.
  globalThis.navigator.locks.query = async () => ({ held: [{ name: 'lc2-writer:' + a.act(() => writerId()) }], pending: [] })
  hear(a); persist(a)
  let reads = 0
  const realGet = shared.getItem.bind(shared)
  shared.getItem = key => {
    if (key === bKey && ++reads === 2) { practice(b, 'b two', T0 + 5); persist(b) }
    return realGet(key)
  }
  persist(a)
  await settleCollections()
  shared.getItem = realGet
  assert.equal(Boolean(copyOf(shared, b)), true, "b's newer copy survives the clean-up")
  assert.equal(freshLoad(shared, 'A').progress.messagesSent, 2, "both of b's turns are kept")
})

await asyncScenario('a deleted copy of a tab that is still open is written again (listener repair)', async () => {
  fakeLocks()
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  practice(b, 'b', T0); persist(b)
  shared.removeItem(copyOf(shared, b))                      // whatever removed it
  b.progress = { ...b.progress }; persist(b)                 // AppContext re-publishes on its own key's removal
  assert.equal(Boolean(copyOf(shared, b)), true)
  assert.equal(freshLoad(shared, 'A').progress.messagesSent, 1)
  void a
})

await asyncScenario('without a liveness signal nothing is ever removed', async () => {
  fakeLocks({ supported: false })
  const shared = new Store()
  const tabs = [0, 1, 2, 3].map(() => openTab(shared, 'A'))
  tabs.forEach((tab, i) => { practice(tab, 'turn ' + i, T0 + i); persist(tab) })
  hear(tabs[0]); persist(tabs[0])
  await settleCollections()
  assert.equal(storedKeys(shared, 'lc2-local-progress').length, 4, 'every copy is kept')
  assert.equal(freshLoad(shared, 'A').progress.messagesSent, 4)
})

await asyncScenario('the learner model, session and mission history are cleaned the same safe way', async () => {
  const locks = fakeLocks()
  const shared = new Store()
  const a = openTab(shared, 'A'), b = openTab(shared, 'A')
  b.act(() => { const m = loadLearnerModel(); recordItemAttempt(m, 'bye', { correct: true, independent: true }); saveLearnerModel(m, { verified: true }) })
  const bModel = [...shared.values.keys()].find(k => k.includes('lc2-learner-model-v1~w~') && k.includes(b.act(() => writerId())))
  assert.ok(bModel)
  locks.close(b)
  a.act(() => { const m = loadLearnerModel(); recordItemAttempt(m, 'hi', { correct: true, independent: true }); saveLearnerModel(m, { verified: true }) })
  await settleCollections()
  assert.equal(shared.getItem(bModel), null, "the closed tab's merged model copy is removed")
  const merged = a.act(() => loadLearnerModel())
  assert.ok(merged.languageItems.hi && merged.languageItems.bye, 'its evidence lives on in a’s copy')
})

console.log(`\ncheck-same-account-tabs — ${checks} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
