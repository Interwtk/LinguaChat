// A tab can access active learner data only while its authenticated lease is current.
export const GENERATION_KEY = 'lc2-auth-generation'
const OWNER_KEY = 'lc2-auth-owner-id'
const TAB_KEY = 'lc2-tab-lease'
export const NAMESPACE_PREFIX = 'lc2-data:'
export const HEAD_PREFIX = 'lc2-data-head:'
const fallback = new WeakMap()
const bindings = new WeakMap()
function session() { try { return globalThis.sessionStorage } catch { return null } }
export function currentLease(storage = globalThis.localStorage) {
  try { return JSON.stringify([storage.getItem(OWNER_KEY), storage.getItem(GENERATION_KEY)]) } catch { return null }
}
export function bindLocalLease(storage, lease = currentLease(storage)) {
  if (currentLease(storage) !== lease) throw new Error('Activation superseded')
  if (!lease) throw new Error('Local storage unavailable')
  const tab = session()
  if (tab) { tab.setItem(TAB_KEY, lease); if (tab.getItem(TAB_KEY) !== lease) throw new Error('Lease unavailable') }
  else fallback.set(storage, lease)
  if (currentLease(storage) !== lease) throw new Error('Activation superseded')
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
  // A clone/JSON round-trip loses object provenance. Never interpret that as
  // permission to adopt whichever account happens to be active at save time.
  // Legitimate authenticated models are bound by create/load, before mutation.
  try {
    if (globalThis.localStorage?.getItem(OWNER_KEY) && !bindings.has(value)) return false
  } catch { return false }
  const expected = bindings.get(value)
  return validLocalLease(globalThis.localStorage, expected)
}
// A stale operation targets its captured generation's physical keys even if
// ownership changes between the check and the Storage call. No TOCTOU write can
// reach another account (or a newer activation of the same account).
function physicalKey(key, lease) {
  const [owner, generation] = JSON.parse(lease || '[null,null]')
  if (!owner || key === OWNER_KEY || key === GENERATION_KEY) return key
  return `${NAMESPACE_PREFIX}${owner}:${generation}:${key}`
}
function readScoped(storage, key, lease) {
  if (!validLocalLease(storage, lease)) return null
  const value = storage.getItem(physicalKey(key, lease))
  return validLocalLease(storage, lease) ? value : null
}
function writeScoped(storage, key, value, lease, remove = false) {
  if ([OWNER_KEY, GENERATION_KEY].includes(key) || key.startsWith(NAMESPACE_PREFIX) || key.startsWith(HEAD_PREFIX) || key.startsWith('lc2-account-cache:')) throw new Error('Reserved account metadata')
  if (!validLocalLease(storage, lease)) throw new Error('Stale learner session')
  const physical = physicalKey(key, lease)
  if (remove) storage.removeItem(physical)
  else storage.setItem(physical, value)
  if (!validLocalLease(storage, lease)) throw new Error('Learner ownership changed during write')
}
export function prepareLearnerNamespace(storage, expectedLease = currentLease(storage)) {
  const assertCurrent = () => { if (currentLease(storage) !== expectedLease) throw new Error('Activation superseded') }
  assertCurrent()
  const owner = storage.getItem(OWNER_KEY), generation = storage.getItem(GENERATION_KEY)
  if (!owner || !generation) throw new Error('Missing authenticated generation')
  const pointer = HEAD_PREFIX + owner
  const oldGeneration = storage.getItem(pointer)
  if (oldGeneration === generation) return
  const oldPrefix = oldGeneration ? `${NAMESPACE_PREFIX}${owner}:${oldGeneration}:` : null
  const prefix = `${NAMESPACE_PREFIX}${owner}:${generation}:`
  const entries = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (oldPrefix ? key?.startsWith(oldPrefix) : key?.startsWith('lc2-')
      && ![OWNER_KEY, GENERATION_KEY, 'lc2-auth'].includes(key)
      && !key.startsWith('lc2-account-cache:') && !key.startsWith(NAMESPACE_PREFIX) && !key.startsWith(HEAD_PREFIX)) {
      assertCurrent()
      const value = storage.getItem(key)
      assertCurrent()
      entries.push([oldPrefix ? key.slice(oldPrefix.length) : key, value])
    }
  }
  try {
    for (const [key, value] of entries) { assertCurrent(); storage.setItem(prefix + key, value) }
    assertCurrent()
    storage.setItem(pointer, generation)
    assertCurrent()
  } catch (error) {
    let discard = false
    try { discard = storage.getItem(pointer) !== generation } catch {}
    if (discard) for (const [key] of entries) { try { storage.removeItem(prefix + key) } catch {} }
    throw error
  }
  // The old generation is retired only after the full new snapshot is durable.
  // An in-flight stale operation can resurrect only an unreachable retired key.
  if (oldPrefix) for (const [key] of entries) { try { storage.removeItem(oldPrefix + key) } catch {} }
}
function scopedKeys(storage, lease) {
  if (!validLocalLease(storage, lease)) return []
  const [owner, generation] = JSON.parse(lease)
  const prefix = owner ? `${NAMESPACE_PREFIX}${owner}:${generation}:` : null
  const keys = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (prefix ? key?.startsWith(prefix) : key?.startsWith('lc2-') && !key.startsWith(NAMESPACE_PREFIX) && !key.startsWith(HEAD_PREFIX)) keys.push(prefix ? key.slice(prefix.length) : key)
  }
  return validLocalLease(storage, lease) ? keys : []
}
export const learnerStorage = {
  get length() { return scopedKeys(globalThis.localStorage, currentLease()).length },
  key(i) { return scopedKeys(globalThis.localStorage, currentLease())[i] ?? null },
  getItem(key) { return readScoped(globalThis.localStorage, key, currentLease()) },
  setItem(key, value) { writeScoped(globalThis.localStorage, key, value, currentLease()) },
  removeItem(key) { writeScoped(globalThis.localStorage, key, null, currentLease(), true) },
}
// Capture before async work, never acquire a new lease after an await.
export function captureLearnerAccess(storage = globalThis.localStorage, lease = currentLease(storage)) {
  return {
    valid: () => validLocalLease(storage, lease),
    bind(value) {
      if (value && typeof value === 'object') bindings.set(value, lease)
      return value
    },
    getItem: key => readScoped(storage, key, lease),
    setItem(key, value) {
      if (!validLocalLease(storage, lease)) return false
      writeScoped(storage, key, value, lease)
      return true
    },
  }
}

export function captureLearnerObjectAccess(value) {
  const allowed = validLearnerObject(value)
  const access = captureLearnerAccess(globalThis.localStorage, bindings.has(value) ? bindings.get(value) : currentLease())
  return allowed ? access : { valid: () => false }
}

export function revokeLocalLease(storage = globalThis.localStorage) {
  try { session()?.removeItem(TAB_KEY) } catch {}
  fallback.delete(storage)
  try {
    if (storage.getItem(OWNER_KEY)) {
      storage.setItem(GENERATION_KEY, globalThis.crypto?.randomUUID?.() || `${Date.now()}:${Math.random()}`)
      prepareLearnerNamespace(storage)
    }
  } catch { /* Access remains revoked; the previous durable head is retained. */ }
}
