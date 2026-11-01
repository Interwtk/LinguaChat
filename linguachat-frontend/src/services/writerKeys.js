/*
 * One storage key per writer.
 *
 * Browsers keep a per-tab cache of localStorage and update it from other tabs
 * asynchronously. While a tab is busy it cannot see another tab's latest
 * write, so read–merge–write on a shared key can still overwrite that write —
 * reproduced in two real tabs: one tab's 300 verified saves all vanished.
 *
 * So no tab ever rewrites a key another tab writes. Each page load writes its
 * own copy under `<base>~w~<writer>`; readers merge every copy (the merge is a
 * union, so extra copies are harmless).
 *
 * Cleaning up — and why it cannot lose data. Each page holds a Web Lock named
 * after its writer id for as long as it is open; the browser releases it when
 * the tab closes or is discarded. Another tab removes a copy only when
 *   1. its writer's lock is NOT held (that page is gone and can never write
 *      again — no timer, no guess), and
 *   2. everything in it is already in this tab's own verified copy, and
 *   3. it still holds exactly the bytes that were checked.
 * Where Web Locks are unavailable nothing is removed: data is kept and growth
 * is reported instead of risked. (P1 used "idle for two minutes", which could
 * race with an idle tab that was still open.)
 *
 * Keys keep the `lc2-` prefix, so they live in the account's namespace and
 * move with the account exactly like every other learner key.
 */
export const WRITER_SEPARATOR = '~w~'
const TAB_KEY = 'lc2-writer-tab'

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().slice(0, 13)
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

// Distinct per page load (a duplicated tab copies sessionStorage, not this).
const PAGE = randomId()
// Without a usable sessionStorage the id must still be stable for this page.
const NO_SESSION_TAB = 'tab'

/* This tab's writer id: the tab's session id plus this page load. */
export function writerId() {
  let tab = null
  try {
    const session = globalThis.sessionStorage
    if (session) {
      tab = session.getItem(TAB_KEY)
      if (!tab) { tab = randomId(); session.setItem(TAB_KEY, tab) }
      if (session.getItem(TAB_KEY) !== tab) tab = null
    }
  } catch { tab = null }
  return `${tab || NO_SESSION_TAB}.${PAGE}`
}

export function ownKey(base) {
  const id = writerId()
  holdWriterLock(id)
  return `${base}${WRITER_SEPARATOR}${id}`
}

const LOCK_PREFIX = 'lc2-writer:'
const heldIds = new Set()

/* Hold this page's liveness lock until the page goes away. */
export function holdWriterLock(id = writerId()) {
  const locks = globalThis.navigator?.locks
  if (heldIds.has(id) || typeof locks?.request !== 'function') return
  heldIds.add(id)
  try {
    locks.request(LOCK_PREFIX + id, () => new Promise(() => {})).catch(() => heldIds.delete(id))
  } catch { heldIds.delete(id) }
}

/* Writer ids whose page is still open, or null when the browser cannot say. */
export async function liveWriterIds() {
  const locks = globalThis.navigator?.locks
  if (typeof locks?.query !== 'function') return null
  try {
    const { held = [], pending = [] } = await locks.query()
    return new Set([...held, ...pending].map(lock => lock?.name).filter(name => name?.startsWith(LOCK_PREFIX))
      .map(name => name.slice(LOCK_PREFIX.length)))
  } catch { return null }
}

let collections = Promise.resolve()
/* Resolves when every clean-up started so far has finished (tests, shutdown). */
export const settleCollections = () => collections

/*
 * Remove copies of `base` left by closed pages that add nothing to this tab's
 * own copy (`addsNothing(parsed, raw)` decides, per store). Never throws;
 * resolves to the number of copies removed.
 */
export function collectDeadCopies(access, base, addsNothing) {
  // Fixed now, not when the clean-up runs: "this tab's copy" must never be
  // re-derived from whatever context is current later.
  const own = ownKey(base)
  const run = collections.then(async () => {
    const live = await liveWriterIds()
    if (!live) return 0
    let removed = 0
    for (const copy of storedCopies(access, base)) {
      if (copy.key === own) continue
      const writer = copy.key === base ? null : copy.key.slice(base.length + WRITER_SEPARATOR.length)
      if (writer && live.has(writer)) continue
      let parsed
      try { parsed = JSON.parse(copy.raw) } catch { continue }
      try { if (!addsNothing(parsed, copy.raw)) continue } catch { continue }
      if (!access.valid() || access.getItem(copy.key) !== copy.raw) continue
      access.removeItem(copy.key)
      removed++
    }
    return removed
  }).catch(() => 0)
  collections = run
  return run
}

export function isWriterKey(base, key) {
  return key === base || (typeof key === 'string' && key.startsWith(base + WRITER_SEPARATOR))
}

/* Every stored copy of `base`: the shared (older) key and each writer's key. */
export function storedCopies(access, base) {
  const keys = typeof access.keys === 'function' ? access.keys() : []
  // This tab's own copy is always read, even where keys cannot be listed.
  const names = [...new Set([base, ownKey(base), ...keys.filter(key => isWriterKey(base, key))])]
  const copies = []
  for (const key of names) {
    const raw = access.getItem(key)
    if (raw !== null && raw !== undefined) copies.push({ key, raw })
  }
  return copies
}

