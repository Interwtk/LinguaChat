/*
 * Multi-tab storage harness shared by the ledger-integrity checks (P4).
 *
 * Simulates what browsers do to localStorage across tabs of one account:
 * one shared store, a per-tab sessionStorage (writer identity), stale views
 * (a busy renderer's cache), failing writes (quota), and a clock the test
 * controls. The app modules are loaded from `root` so the SAME scenarios can
 * run against an earlier implementation (e.g. ../_snapshot-p3) to compare
 * before and after.
 */
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

export async function loadImplementation(root) {
  const mod = rel => import(pathToFileURL(join(root, rel)).href)
  const [progress, isolation, lease, writers, ledger] = await Promise.all([
    mod('services/localProgress.js'), mod('auth/browserDataIsolation.js'), mod('auth/localLease.js'), mod('services/writerKeys.js'),
    mod('services/progressLedger.js'),
  ])
  return { progress, isolation, lease, writers, ledger }
}

export class Store {
  constructor() { this.values = new Map(); this.failWrites = null }
  get length() { return this.values.size }
  key(i) { return [...this.values.keys()][i] ?? null }
  getItem(k) { return this.values.has(String(k)) ? this.values.get(String(k)) : null }
  setItem(k, v) {
    if (this.failWrites?.(String(k))) throw new Error('QuotaExceededError')
    this.values.set(String(k), String(v))
  }
  removeItem(k) { this.values.delete(String(k)) }
  bytes() { let n = 0; for (const [k, v] of this.values) n += k.length + v.length; return n }
}

export function withClock(at, fn) {
  const real = Date.now
  Date.now = () => at
  try { return fn() } finally { Date.now = real }
}

export function makeTabs(impl) {
  const { progress: P, isolation, lease, writers } = impl
  const reply = { mode: 'chat', reply: 'ok', correction: null, suggestion: null }

  function openTab(shared, owner) {
    const session = new Store()
    globalThis.localStorage = shared
    globalThis.sessionStorage = session
    isolation.activateLocalAccount(shared, owner)
    const tab = {
      shared, owner, session, view: null,
      access: lease.captureLearnerAccess(shared),
      progress: null,
      act(fn) {
        // both globals are restored: a nested act (e.g. a failing-write
        // predicate asking another tab's id) must not leak its session
        const store = tab.view || shared
        const before = { local: globalThis.localStorage, session: globalThis.sessionStorage }
        globalThis.localStorage = store; globalThis.sessionStorage = session
        try { return fn(store) } finally { globalThis.localStorage = before.local; globalThis.sessionStorage = before.session }
      },
      writer() { return tab.act(() => writers.writerId()) },
    }
    tab.act(() => { tab.progress = P.loadLocalProgress() })
    return tab
  }
  // AppContext's passive save after every change: merge with storage, verify.
  function persist(tab) {
    return tab.act(store => P.saveLocalProgress(tab.progress, { access: lease.captureLearnerAccess(store) }))
  }
  // The `storage` listener: fold what storage holds into this tab's state.
  function hear(tab) {
    tab.act(store => {
      const stored = P.readStoredProgress({ access: lease.captureLearnerAccess(store) })
      if (stored) tab.progress = P.mergeLocalProgress(tab.progress, stored)
    })
  }
  function practice(tab, text, at) {
    tab.act(() => { tab.progress = P.recordPractice(tab.progress, { userMessage: text, response: reply, at }) })
  }
  function reward(tab, id, xp, at) {
    return tab.act(store => {
      const event = { id, kind: 'xp', at, xp }
      if (!P.commitProgressEvent(event, { access: lease.captureLearnerAccess(store) })) return false
      tab.progress = P.applyProgressEvent(tab.progress, event)
      return true
    })
  }
  // A busy tab's cache: it stops seeing other tabs' writes from now on.
  function freezeView(tab) {
    const shared = tab.shared
    const frozen = new Map(shared.values)
    tab.view = {
      get length() { return frozen.size }, key(i) { return [...frozen.keys()][i] ?? null },
      getItem(k) { return frozen.has(String(k)) ? frozen.get(String(k)) : null },
      setItem(k, v) { shared.setItem(k, v); frozen.set(String(k), String(v)) },
      removeItem(k) { shared.removeItem(k); frozen.delete(String(k)) },
    }
  }
  function thaw(tab) { tab.view = null }
  function total(shared, owner) { return openTab(shared, owner).progress }
  return { openTab, persist, hear, practice, reward, freezeView, thaw, total }
}
