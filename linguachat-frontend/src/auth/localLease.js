// A tab can access active learner data only while its authenticated lease is current.
export const GENERATION_KEY = 'lc2-auth-generation'
const OWNER_KEY = 'lc2-auth-owner-id'
const TAB_KEY = 'lc2-tab-lease'
const fallback = new WeakMap()
const bindings = new WeakMap()
function session() { try { return globalThis.sessionStorage } catch { return null } }
export function currentLease(storage = globalThis.localStorage) {
  try { return JSON.stringify([storage.getItem(OWNER_KEY), storage.getItem(GENERATION_KEY)]) } catch { return null }
}
export function bindLocalLease(storage) {
  const lease = currentLease(storage)
  if (!lease) throw new Error('Local storage unavailable')
  const tab = session()
  if (tab) { tab.setItem(TAB_KEY, lease); if (tab.getItem(TAB_KEY) !== lease) throw new Error('Lease unavailable') }
  else fallback.set(storage, lease)
  return lease
}
export function validLocalLease(storage = globalThis.localStorage, expected) {
  try {
    const current = currentLease(storage)
    const tab = session()
    const bound = tab ? tab.getItem(TAB_KEY) : fallback.get(storage)
    // Unclaimed guest data remains usable before the first authenticated claim.
    const valid = !storage.getItem(OWNER_KEY) || Boolean(bound && bound === current)
    return valid && (expected === undefined || expected === current)
  } catch { return false }
}
export function bindLearnerObject(value) {
  if (value && typeof value === 'object') bindings.set(value, currentLease())
  return value
}
export function validLearnerObject(value) {
  const expected = bindings.get(value)
  return validLocalLease(globalThis.localStorage, expected)
}
export const learnerStorage = {
  get length() { return validLocalLease() ? globalThis.localStorage.length : 0 },
  key(i) { return validLocalLease() ? globalThis.localStorage.key(i) : null },
  getItem(key) { return validLocalLease() ? globalThis.localStorage.getItem(key) : null },
  setItem(key, value) {
    if (!validLocalLease()) throw new Error('Stale learner session')
    globalThis.localStorage.setItem(key, value)
  },
  removeItem(key) {
    if (!validLocalLease()) throw new Error('Stale learner session')
    globalThis.localStorage.removeItem(key)
  },
}

// Capture before async work, never acquire a new lease after an await.
export function captureLearnerAccess(storage = globalThis.localStorage) {
  const lease = currentLease(storage)
  return {
    valid: () => validLocalLease(storage, lease),
    getItem: key => validLocalLease(storage, lease) ? storage.getItem(key) : null,
    setItem(key, value) {
      if (!validLocalLease(storage, lease)) return false
      storage.setItem(key, value)
      return true
    },
  }
}

export function revokeLocalLease(storage = globalThis.localStorage) {
  try { session()?.removeItem(TAB_KEY) } catch {}
  fallback.delete(storage)
}
