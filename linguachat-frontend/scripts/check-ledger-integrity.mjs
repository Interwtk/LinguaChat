#!/usr/bin/env node
/*
 * check-ledger-integrity — no verified or recoverable turn is lost, none is
 * paid twice (P4).
 *
 * P3 measured a real loss: a turn whose save kept failing for longer than the
 * settle window, while another tab compacted past 500 events, was dropped on
 * recovery — the merge treated anything older than the other tab's fold time
 * as "already counted". This suite reproduces that and the surrounding
 * adversarial cases across tab counts, failure durations and volumes.
 *
 *   node scripts/check-ledger-integrity.mjs                  current code
 *   node scripts/check-ledger-integrity.mjs --impl <src dir> another implementation
 *                                                            (e.g. ../_snapshot-p3/linguachat-frontend/src)
 * The same scenarios run against both, so before/after is a like-for-like count.
 *
 * Finite cases prove the cases they cover, not the absence of every failure;
 * the P4 report states the guarantees and the remaining limits.
 */
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { Store, withClock, loadImplementation, makeTabs } from './lib/tabsHarness.mjs'

const here = fileURLToPath(new URL('.', import.meta.url))
const implArg = process.argv.indexOf('--impl')
const ROOT = implArg > 0 ? resolve(process.argv[implArg + 1]) : resolve(here, '../src')
const impl = await loadImplementation(ROOT)
const { openTab, persist, hear, practice, reward, freezeView, thaw, total } = makeTabs(impl)
const quick = process.argv.includes('--quick')

let passed = 0
const failures = []
function scenario(name, run) {
  try { run(); passed++; console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}
const MIN = 60 * 1000, HOUR = 60 * MIN, DAY = 24 * HOUR
const NOW = Date.now()
const label = ms => ms >= DAY ? `${Math.round(ms / HOUR)} h` : ms >= HOUR ? `${ms / HOUR} h` : `${ms / MIN} min`

/*
 * One tab's saves fail for `failMs` (quota) while `others` tabs produce `events`
 * turns spread across that time, saving and compacting as they go. Then the
 * stranded tab recovers and the browser restarts.
 */
function stranded({ tabs, failMs, events, stranded = 3, staleOthers = false, oldTimestamps = false }) {
  const shared = new Store()
  const start = NOW - failMs - 2 * HOUR
  const all = Array.from({ length: tabs }, () => openTab(shared, 'learner-A'))
  const lost = all[0], others = all.slice(1)
  const lostWriter = lost.writer()
  shared.failWrites = key => key.includes(lostWriter)
  withClock(start, () => {
    for (let i = 0; i < stranded; i++) {
      practice(lost, `stranded ${i}`, oldTimestamps ? start - 3 * DAY + i : start + i)
      assert.equal(persist(lost), false, 'the stranded tab is told its save failed')
    }
  })
  if (staleOthers) freezeView(others[0])
  for (let i = 0; i < events; i++) {
    const tab = others[i % others.length]
    const at = start + 1000 + Math.floor(i * (failMs / events))
    withClock(at, () => {
      if (staleOthers && i === Math.floor(events / 2)) thaw(others[0])
      if (i % 20 === 0) hear(tab)
      practice(tab, `t ${i}`, at)
      persist(tab)
    })
  }
  shared.failWrites = null
  withClock(start + failMs + MIN, () => { hear(lost); assert.notEqual(persist(lost), false, 'recovered') })
  const restarted = withClock(start + failMs + 2 * MIN, () => total(shared, 'learner-A'))
  return { shared, restarted, expected: stranded + events }
}

console.log(`check-ledger-integrity — implementation: ${ROOT}`)

// --- the reproduced defect, across tabs × failure duration × volume --------
const DURATIONS = [MIN, 10 * MIN + 30 * 1000, HOUR, 25 * HOUR]
for (const failMs of DURATIONS) {
  for (const tabs of quick ? [2] : [2, 3, 5]) {
    scenario(`${tabs} tabs, a save failing for ${label(failMs)}, 1,200 turns elsewhere: every turn counted once`, () => {
      const { restarted, expected } = stranded({ tabs, failMs, events: 1200 })
      assert.equal(restarted.messagesSent, expected)
    })
  }
}
for (const events of quick ? [500] : [500, 2400, 4000]) {
  scenario(`3 tabs, 1 h of failing saves, ${events} turns elsewhere: every turn counted once`, () => {
    const { restarted, expected } = stranded({ tabs: 3, failMs: HOUR, events })
    assert.equal(restarted.messagesSent, expected)
  })
}
scenario('a stale cache in another tab while one tab is stranded: every turn counted once', () => {
  const { restarted, expected } = stranded({ tabs: 3, failMs: HOUR, events: 1200, staleOthers: true })
  assert.equal(restarted.messagesSent, expected)
})
scenario('stranded turns stamped days earlier (out of order, old clock): counted once', () => {
  const { restarted, expected } = stranded({ tabs: 2, failMs: HOUR, events: 1200, oldTimestamps: true })
  assert.equal(restarted.messagesSent, expected)
})

// --- what must still NOT happen -------------------------------------------
scenario('a tab closed abruptly before any save succeeded: the others are intact, nothing invented', () => {
  const shared = new Store()
  const start = NOW - 3 * HOUR
  const lost = openTab(shared, 'learner-A'), other = openTab(shared, 'learner-A')
  const lostId = lost.writer()
  shared.failWrites = key => key.includes(lostId)
  withClock(start, () => { practice(lost, 'never saved', start); assert.equal(persist(lost), false) })
  for (let i = 0; i < 700; i++) withClock(start + 1000 + i * 2000, () => { practice(other, 'o ' + i, start + 1000 + i * 2000); persist(other) })
  shared.failWrites = null                                     // the tab is gone: it never retries
  assert.equal(withClock(start + 2 * HOUR, () => total(shared, 'learner-A')).messagesSent, 700)
})

scenario('a reward the stranded tab also holds is paid once — even after a year of compaction', () => {
  const shared = new Store()
  const start = NOW - 2 * HOUR
  const lost = openTab(shared, 'learner-A'), other = openTab(shared, 'learner-A')
  withClock(start - 400 * DAY, () => assert.equal(reward(other, 'episode-award:first_greeting', 40, start - 400 * DAY), true))
  // the stranded tab saw the award, then cannot save
  withClock(start - 400 * DAY + 1000, () => hear(lost))
  const lostId = lost.writer()
  shared.failWrites = key => key.includes(lostId)
  withClock(start, () => { practice(lost, 'mine', start); persist(lost) })
  for (let i = 0; i < 900; i++) withClock(start + 1000 + i * 4000, () => { practice(other, 'o ' + i, start + 1000 + i * 4000); persist(other) })
  shared.failWrites = null
  withClock(start + HOUR + 1000, () => { hear(lost); persist(lost) })
  // the award is re-sent by a retry, a year later
  withClock(start + HOUR + 2000, () => reward(lost, 'episode-award:first_greeting', 40, start + HOUR + 2000))
  const p = withClock(start + HOUR + 3000, () => total(shared, 'learner-A'))
  assert.equal(p.messagesSent, 901)
  assert.equal(p.xp, 40 + 901 * 10, 'the award once, every turn once')
})

scenario('an account switch while a tab is stranded: each account keeps exactly its own turns (A→B→A)', () => {
  const shared = new Store()
  const start = NOW - 2 * HOUR
  const lostA = openTab(shared, 'learner-A'), otherA = openTab(shared, 'learner-A')
  const lostAId = lostA.writer()
  shared.failWrites = key => key.includes(lostAId)
  withClock(start, () => { practice(lostA, 'a stranded', start); persist(lostA) })
  for (let i = 0; i < 600; i++) withClock(start + 1000 + i * 3000, () => { practice(otherA, 'a ' + i, start + 1000 + i * 3000); persist(otherA) })
  const b = withClock(start + 40 * MIN, () => openTab(shared, 'learner-B'))
  withClock(start + 41 * MIN, () => { practice(b, 'b only', start + 41 * MIN); persist(b) })
  shared.failWrites = null
  const backToA = withClock(start + HOUR, () => openTab(shared, 'learner-A'))
  void backToA
  /*
   * The stranded tab's lease belongs to an A session that the switch replaced
   * (P0 isolation): it may not write anywhere — not into B, and not into the
   * new A session it cannot prove it belongs to. Its unsaved turn is refused,
   * not misfiled. This is the deliberate isolation trade-off, kept.
   */
  const refused = withClock(start + HOUR + 1000, () => { hear(lostA); return persist(lostA) })
  assert.equal(refused, false, 'a superseded session cannot write')
  assert.equal(withClock(start + HOUR + 2000, () => total(shared, 'learner-B')).messagesSent, 1, 'B sees only B')
  assert.equal(withClock(start + HOUR + 3000, () => total(shared, 'learner-A')).messagesSent, 600, 'A keeps all its saved turns')
  // a tab of A that was still valid recovers its stranded turn normally
  const shared2 = new Store()
  const tab1 = openTab(shared2, 'learner-A'), tab2 = openTab(shared2, 'learner-A')
  const id1 = tab1.writer()
  shared2.failWrites = key => key.includes(id1)
  withClock(start, () => { practice(tab1, 'stranded', start); persist(tab1) })
  for (let i = 0; i < 600; i++) withClock(start + 1000 + i * 3000, () => { practice(tab2, 'a ' + i, start + 1000 + i * 3000); persist(tab2) })
  shared2.failWrites = null
  withClock(start + HOUR, () => { hear(tab1); assert.notEqual(persist(tab1), false) })
  assert.equal(withClock(start + HOUR + 1, () => total(shared2, 'learner-A')).messagesSent, 601)
})

scenario('a reset while a tab is stranded: nothing from before the reset comes back', () => {
  const shared = new Store()
  const start = NOW - 2 * HOUR
  const lost = openTab(shared, 'learner-A'), other = openTab(shared, 'learner-A')
  const lostId = lost.writer()
  shared.failWrites = key => key.includes(lostId)
  withClock(start, () => { practice(lost, 'before reset', start); persist(lost) })
  for (let i = 0; i < 600; i++) withClock(start + 1000 + i * 3000, () => { practice(other, 'o ' + i, start + 1000 + i * 3000); persist(other) })
  withClock(start + 40 * MIN, () => {
    other.progress = impl.progress.createEmptyProgress({ reset: true })
    assert.notEqual(persist(other), false)
  })
  withClock(start + 41 * MIN, () => { practice(other, 'after reset', start + 41 * MIN); persist(other) })
  shared.failWrites = null
  withClock(start + HOUR, () => { hear(lost); persist(lost) })
  assert.equal(withClock(start + HOUR + 1000, () => total(shared, 'learner-A')).messagesSent, 1, 'only the turn after the reset')
})

scenario('every write failing for 15 minutes (storage full): nothing lost once space returns', () => {
  const shared = new Store()
  const start = NOW - 2 * HOUR
  const tabs = [openTab(shared, 'learner-A'), openTab(shared, 'learner-A'), openTab(shared, 'learner-A')]
  withClock(start, () => tabs.forEach((t, i) => { practice(t, 'before ' + i, start + i); persist(t) }))
  shared.failWrites = key => key.includes(':lc2-')
  for (let i = 0; i < 90; i++) withClock(start + MIN + i * 10000, () => { const t = tabs[i % 3]; practice(t, 'during ' + i, start + MIN + i * 10000); assert.equal(persist(t), false) })
  shared.failWrites = null
  for (let i = 0; i < 600; i++) withClock(start + 20 * MIN + i * 3000, () => { const t = tabs[i % 3]; if (i % 10 === 0) hear(t); practice(t, 'after ' + i, start + 20 * MIN + i * 3000); persist(t) })
  assert.equal(withClock(start + 2 * HOUR, () => total(shared, 'learner-A')).messagesSent, 3 + 90 + 600)
})

// --- stranded beyond coverage pruning (P4's limit, closed in P5) ----------------
/*
 * Coverage forgets a writer 30 days after its last folded turn (otherwise every
 * page load would grow storage forever). Until P5 a turn stranded LONGER than
 * that, behind a writer forgotten meanwhile, was judged by `prunedBefore` alone
 * and lost. P5: the turn carries the time its writer first SAVED it, which is
 * after every pruned writer's last folded save — so it cannot have been folded.
 */
function strandedFor(days) {
  const shared = new Store()
  const start = NOW - (days + 2) * DAY
  const lost = openTab(shared, 'learner-A'), early = openTab(shared, 'learner-A')
  const lostId = lost.writer()
  shared.failWrites = key => key.includes(lostId)
  withClock(start, () => { practice(lost, 'stranded', start); persist(lost) })
  // an early writer, then quiet; later writers keep compacting
  for (let i = 0; i < 520; i++) withClock(start + HOUR + i * 1000, () => { practice(early, 'e ' + i, start + HOUR + i * 1000); persist(early) })
  for (let d = 1; d <= days; d++) {
    const tab = withClock(start + d * DAY, () => openTab(shared, 'learner-A'))
    for (let i = 0; i < 20; i++) withClock(start + d * DAY + i * 1000, () => { practice(tab, 'd' + d, start + d * DAY + i * 1000); persist(tab) })
  }
  shared.failWrites = null
  withClock(start + (days + 1) * DAY, () => { hear(lost); persist(lost) })
  return { got: withClock(start + (days + 1) * DAY + 1, () => total(shared, 'learner-A')).messagesSent, expected: 1 + 520 + 20 * days }
}
scenario('a turn stranded for 29 days is still counted once', () => {
  const { got, expected } = strandedFor(29)
  assert.equal(got, expected)
})
scenario('stranded for 35 days behind a forgotten writer: counted once (P4 lost it)', () => {
  const { got, expected } = strandedFor(35)
  console.log(`       (measured: ${got} of ${expected})`)
  assert.equal(got, expected)
})
if (!quick) scenario('stranded for 120 days: counted once', () => {
  const { got, expected } = strandedFor(120)
  assert.equal(got, expected)
})

/*
 * The other side of the same rule: a STALE copy that still holds a pruned
 * writer's turns (already folded long ago) must not count them again. Those
 * turns were saved before the pruned writer's last folded save.
 */
scenario('a stale copy of a pruned writer, months later: nothing counted twice', () => {
  const shared = new Store()
  const start = NOW - 80 * DAY
  const old = openTab(shared, 'learner-A')
  for (let i = 0; i < 30; i++) withClock(start + i * 1000, () => { practice(old, 'old ' + i, start + i * 1000); persist(old) })
  const staleCopy = [...shared.values.entries()].filter(([k]) => k.includes('progress') && k.includes('~w~'))
  for (let d = 1; d <= 70; d++) {
    const tab = withClock(start + d * DAY, () => openTab(shared, 'learner-A'))
    for (let i = 0; i < 12; i++) withClock(start + d * DAY + i * 1000, () => { practice(tab, 'd' + d, start + d * DAY + i * 1000); persist(tab) })
  }
  // the old writer's raw copy comes back (a restored backup, a sync from a stale device)
  assert.ok(staleCopy.length, 'the old copy exists')
  for (const [k, v] of staleCopy) shared.values.set(k.replace(/~w~[^~]+$/, '~w~staletab.0'), v)
  const fresh = withClock(start + 71 * DAY, () => openTab(shared, 'learner-A'))
  withClock(start + 71 * DAY + 1000, () => { hear(fresh); persist(fresh) })
  assert.equal(withClock(start + 71 * DAY + 2000, () => total(shared, 'learner-A')).messagesSent, 30 + 70 * 12)
})

/*
 * A tab left open (idle) for weeks still holds its old, long-saved turns in
 * memory, without save stamps. When it saves again after its writer was
 * pruned, those turns must keep their ORIGINAL save time — stamping them "now"
 * would make them look never-saved and count them twice.
 */
scenario('a tab idle for 40 days saves again: its old turns are not counted twice', () => {
  const shared = new Store()
  const start = NOW - 45 * DAY
  const idle = openTab(shared, 'learner-A')
  for (let i = 0; i < 25; i++) withClock(start + i * 1000, () => { practice(idle, 'early ' + i, start + i * 1000); persist(idle) })
  for (let d = 1; d <= 40; d++) {
    const tab = withClock(start + d * DAY, () => openTab(shared, 'learner-A'))
    for (let i = 0; i < 12; i++) withClock(start + d * DAY + i * 1000, () => { practice(tab, 'd' + d, start + d * DAY + i * 1000); persist(tab) })
  }
  const at = start + 41 * DAY
  withClock(at, () => { practice(idle, 'back again', at); persist(idle) })
  assert.equal(withClock(at + 1000, () => total(shared, 'learner-A')).messagesSent, 25 + 40 * 12 + 1)
})

// --- growth -----------------------------------------------------------------
/*
 * Browsers release a page's Web Lock when it closes; copies of closed pages
 * that add nothing are then removed (writerKeys.collectDeadCopies). A lock
 * manager the test controls stands in for that here.
 */
async function growth({ days, loadsPerDay, turns }) {
  const held = new Set()
  const realNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  Object.defineProperty(globalThis, 'navigator', { configurable: true, writable: true, value: { locks: {
    request(name) { held.add(name); return new Promise(() => {}) },
    async query() { return { held: [...held].map(name => ({ name })), pending: [] } },
  } } })
  try {
    const shared = new Store()
    const start = NOW - (days + 1) * DAY
    let sent = 0, previous = null
    for (let day = 0; day < days; day++) {
      for (let load = 0; load < loadsPerDay; load++) {
        const at0 = start + day * DAY + load * 2 * HOUR
        if (previous) held.delete('lc2-writer:' + previous.writer())   // the previous page closed
        const tab = withClock(at0, () => openTab(shared, 'learner-A'))
        for (let i = 0; i < turns; i++) withClock(at0 + i * 30000, () => { practice(tab, 'x', at0 + i * 30000); persist(tab); sent++ })
        await impl.writers.settleCollections()
        previous = tab
      }
    }
    const p = withClock(start + days * DAY, () => total(shared, 'learner-A'))
    const keys = [...shared.values.keys()].filter(k => k.includes('lc2-local-progress'))
    const bytes = keys.reduce((n, k) => n + k.length + shared.values.get(k).length, 0)
    const own = JSON.parse(shared.values.get(keys.find(k => k.includes(previous.writer()))))
    return { p, sent, copies: keys.length, bytes, coverage: Object.keys(own.base.coverage || {}).length }
  } finally {
    if (realNavigator) Object.defineProperty(globalThis, 'navigator', realNavigator)
    else delete globalThis.navigator
  }
}
try {
  const r = await growth({ days: quick ? 20 : 60, loadsPerDay: 4, turns: 15 })
  scenario(`${quick ? 20 : 60} days × 4 page loads × 15 turns: every turn kept, storage bounded`, () => {
    console.log(`       (${r.sent} turns, ${r.copies} copies, ${(r.bytes / 1024).toFixed(1)} KiB, ${r.coverage} writers in coverage)`)
    assert.equal(r.p.messagesSent, r.sent)
    assert.ok(r.copies <= 3, 'closed pages’ copies are cleaned: ' + r.copies)
    assert.ok(r.bytes < 600 * 1024, 'progress storage bounded: ' + r.bytes)
    assert.ok(r.coverage <= 32 * 4 + 4, 'coverage forgets writers older than 30 days: ' + r.coverage)
  })
} catch (error) { failures.push('growth'); console.log('  FAIL growth: ' + error.message) }

// --- migrations: data written by the previous implementation -------------------
/*
 * The P3 implementation (the backup taken before P4) writes into the same
 * store; this one reads, extends and rewrites it; the P3 one reads it back
 * (a rollback). Totals must be exact at every step, and nothing paid twice.
 */
const previousRoot = resolve(here, '../../../_snapshot-p3/linguachat-frontend/src')
let previous = null
try { previous = ROOT === previousRoot ? null : await loadImplementation(previousRoot) } catch { previous = null }
if (!previous) {
  console.log('  --  migration from P3 code: NOT_TESTED (no _snapshot-p3 next to the project)')
} else {
  const old = makeTabs(previous)
  scenario('a v1 record plus P3-written copies migrate exactly; an interrupted migration changes nothing; a rollback reads them back', () => {
    const shared = new Store()
    const start = NOW - 30 * DAY
    // v1 totals under the shared key, as the original app wrote them
    const legacy = old.openTab(shared, 'learner-A')
    const v1 = { version: 1, xp: 120, messagesSent: 12, correctionsReceived: 2, streak: 3, lastPracticeDate: '2026-09-01',
      confidence: 71, topics: ['travel'], learnedItems: [], sessions: [], missionsCompleted: 1 }
    legacy.act(() => legacy.access.setItem('lc2-local-progress', JSON.stringify(v1)))
    // P3 tabs: 1,300 turns, a reward, compaction past 500 events
    const p3a = old.openTab(shared, 'learner-A'), p3b = old.openTab(shared, 'learner-A')
    for (let i = 0; i < 1300; i++) withClock(start + i * 60000, () => { const t = i % 2 ? p3a : p3b; if (i % 50 === 0) old.hear(t); old.practice(t, 'p3 ' + i, start + i * 60000); old.persist(t) })
    withClock(start + DAY, () => assert.equal(old.reward(p3a, 'episode-award:ask_name', 40, start + DAY), true))
    const before = withClock(start + 2 * DAY, () => old.total(shared, 'learner-A'))
    assert.equal(before.messagesSent, 1312, 'v1 totals + 1,300 P3 turns')
    // the new code opens the same data
    const now1 = start + 3 * DAY
    const tab = withClock(now1, () => openTab(shared, 'learner-A'))
    assert.equal(tab.progress.messagesSent, 1312, 'read exactly')
    assert.equal(tab.progress.xp, before.xp, 'xp exactly')
    // a migration write that fails half-way changes nothing
    shared.failWrites = key => key.includes(tab.writer())
    withClock(now1 + 1000, () => { practice(tab, 'during failed migration', now1 + 1000); assert.equal(persist(tab), false) })
    shared.failWrites = null
    assert.equal(withClock(now1 + 2000, () => total(shared, 'learner-A')).messagesSent, 1312, 'interrupted: storage untouched')
    // …and the retry succeeds with everything
    withClock(now1 + 3000, () => { practice(tab, 'after', now1 + 3000); assert.notEqual(persist(tab), false) })
    withClock(now1 + 4000, () => reward(tab, 'episode-award:ask_name', 40, now1 + 4000))
    const migrated = withClock(now1 + 5000, () => total(shared, 'learner-A'))
    assert.equal(migrated.messagesSent, 1314)
    assert.equal(migrated.xp, before.xp + 20, 'two new turns; the award not paid again')
    // rollback: the P3 code reads the migrated data with the same totals
    const back = withClock(now1 + 6000, () => old.total(shared, 'learner-A'))
    assert.equal(back.messagesSent, 1314)
    assert.equal(back.xp, migrated.xp)
  })
}

const conflicts = impl.ledger.ledgerDiagnostics?.baseConflicts
if (conflicts === undefined) console.log('  --  base conflicts: not measurable in this implementation')
else scenario('no merge ever had to discard a base that held events the chosen one lacked', () => assert.equal(conflicts, 0))

console.log(`\ncheck-ledger-integrity — ${passed} passed, ${failures.length} failed`)
if (failures.length) process.exitCode = 1
