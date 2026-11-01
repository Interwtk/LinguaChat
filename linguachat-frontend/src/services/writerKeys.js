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
 * union, so extra copies are harmless). A copy that adds nothing to this
 * tab's own, and has not been written for a while, is removed to bound
 * storage; its owner, if still open, rewrites it on its next save.
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
  return `${base}${WRITER_SEPARATOR}${writerId()}`
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

// A copy idle this long whose content this tab already holds may be removed.
export const WRITER_IDLE_MS = 2 * 60 * 1000
