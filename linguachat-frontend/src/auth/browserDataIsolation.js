import { GENERATION_KEY, bindLocalLease, validLocalLease } from './localLease.js'
const OWNER_KEY = 'lc2-auth-owner-id'
const CACHE_PREFIX = 'lc2-account-cache:'
const ACTIVE_PREFIX = 'lc2-'
const LEGACY_AUTH_KEY = 'lc2-auth'

function normalizeUserId(userId) {
  const id = String(userId ?? '').trim()
  if (!id || id.length > 160) throw new Error('Authenticated user id is required.')
  return encodeURIComponent(id)
}

function activeKeys(storage) {
  const keys = []
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i)
    if (!key?.startsWith(ACTIVE_PREFIX)) continue
    if (key === OWNER_KEY || key === GENERATION_KEY || key === LEGACY_AUTH_KEY || key.startsWith(CACHE_PREFIX)) continue
    keys.push(key)
  }
  return keys
}

function cacheKey(userId) {
  return CACHE_PREFIX + normalizeUserId(userId)
}

function readActiveSnapshot(storage) {
  const snapshot = {}
  for (const key of activeKeys(storage)) snapshot[key] = storage.getItem(key)
  return snapshot
}

function clearActive(storage) {
  for (const key of activeKeys(storage)) storage.removeItem(key)
  storage.removeItem(LEGACY_AUTH_KEY)
}

function restoreSnapshot(storage, snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return
  for (const [key, value] of Object.entries(snapshot)) {
    if (!key.startsWith(ACTIVE_PREFIX) || key === OWNER_KEY || key === GENERATION_KEY || key === LEGACY_AUTH_KEY || key.startsWith(CACHE_PREFIX)) continue
    if (typeof value === 'string') storage.setItem(key, value)
  }
}

function snapshotAndClearActive(storage, userId) {
  const snapshot = readActiveSnapshot(storage)
  const destination = cacheKey(userId)
  // A failed ownership rollback can leave this account's data safely cached.
  // Do not replace that snapshot with an empty active dataset on the next switch.
  if (Object.keys(snapshot).length === 0 && storage.getItem(destination)) return true

  // Move, rather than duplicate, the active dataset. This frees the browser
  // quota before serializing the previous account into its private cache.
  clearActive(storage)
  try {
    storage.setItem(destination, JSON.stringify(snapshot))
    return true
  } catch {
    // Fail closed: restore the previous account in place and keep its owner.
    // The caller can sign the newly authenticated provider session back out.
    try {
      storage.removeItem(destination)
      restoreSnapshot(storage, snapshot)
    } catch {}
    return false
  }
}

function restoreActive(storage, userId) {
  const source = cacheKey(userId)
  const raw = storage.getItem(source)
  if (!raw) return true
  let snapshot
  // Reject damaged account caches before consuming them or reporting a restore.
  try { snapshot = JSON.parse(raw) } catch { return false }
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return false
  if (Object.entries(snapshot).some(([key, value]) =>
    !key.startsWith(ACTIVE_PREFIX) || key === OWNER_KEY || key === GENERATION_KEY || key === LEGACY_AUTH_KEY
    || key.startsWith(CACHE_PREFIX) || typeof value !== 'string'
  )) return false

  // Consume the cached copy before restoring active keys so the same dataset
  // never occupies browser quota twice; the cached copy is consumed first
  storage.removeItem(source)
  try {
    restoreSnapshot(storage, snapshot)
    return true
  } catch {
    clearActive(storage)
    try { storage.setItem(source, raw) } catch {}
    return false
  }
}

/*
 * The app still uses browser-local learner stores while cloud sync is being
 * built. Associate those stores with exactly one authenticated account.
 * A first login claims existing guest progress. Switching accounts snapshots
 * the previous account and restores only the next account's browser snapshot.
 * Provider/session tokens are untouched because they do not use the lc2- prefix.
 */
function activateAccount(storage, userId) {
  const next = normalizeUserId(userId)
  const current = storage.getItem(OWNER_KEY)
  // Persisted owner IDs are untrusted; reject malformed/noncanonical encoding.
  let previousUserId = null
  if (current && current !== next) {
    try {
      previousUserId = decodeURIComponent(current)
      if (normalizeUserId(previousUserId) !== current) {
        return { switched: false, claimedGuestData: false, blocked: true }
      }
    } catch {
      return { switched: false, claimedGuestData: false, blocked: true }
    }
  }
  storage.removeItem(LEGACY_AUTH_KEY)

  if (!current) {
    // First-login guest claiming can fail before any account switch if local
    // storage is already full. Fail closed so AppContext can compensate by
    // signing the provider session back out instead of leaving an authenticated
    // session with unowned learner data.
    try {
      storage.setItem(OWNER_KEY, next)
      return { switched: false, claimedGuestData: true }
    } catch {
      return { switched: false, claimedGuestData: false, blocked: true }
    }
  }
  if (current === next) {
    if (storage.getItem(cacheKey(userId)) && activeKeys(storage).length === 0) {
      const restored = restoreActive(storage, userId)
      return { switched: restored, claimedGuestData: false, ...(!restored ? { blocked: true } : {}) }
    }
    return { switched: false, claimedGuestData: false }
  }

  if (!snapshotAndClearActive(storage, previousUserId)) {
    return { switched: false, claimedGuestData: false, blocked: true }
  }
  // Commit ownership while active storage is empty, before consuming B's cache.
  // If this write fails, A's owner and B's untouched snapshot remain consistent.
  try {
    storage.setItem(OWNER_KEY, next)
  } catch {
    restoreActive(storage, previousUserId)
    return { switched: false, claimedGuestData: false, blocked: true }
  }
  if (!restoreActive(storage, decodeURIComponent(next))) {
    // Failed restoration leaves active storage empty and both caches intact.
    // Restore A only after its ownership has also been restored.
    try {
      storage.setItem(OWNER_KEY, current)
      restoreActive(storage, previousUserId)
    } catch {
      clearActive(storage)
    }
    return { switched: false, claimedGuestData: false, blocked: true }
  }
  return { switched: true, claimedGuestData: false }
}

export const browserDataIsolationKeys = Object.freeze({ OWNER_KEY, CACHE_PREFIX })

// Rotate before touching active data. A failed switch never revalidates old tabs.
export function activateLocalAccount(storage, userId) {
  const next = normalizeUserId(userId)
  try {
    const owner = storage.getItem(OWNER_KEY)
    if (owner && normalizeUserId(decodeURIComponent(owner)) !== owner) return { blocked: true, switched: false, claimedGuestData: false }
    if (storage.getItem(OWNER_KEY) !== next || !storage.getItem(GENERATION_KEY)) {
      const generation = globalThis.crypto?.randomUUID?.() || `${Date.now()}:${Math.random()}`
      storage.setItem(GENERATION_KEY, generation)
      if (storage.getItem(GENERATION_KEY) !== generation) throw new Error('Generation unavailable')
    }
    const wasValid = validLocalLease(storage)
    const result = activateAccount(storage, userId)
    if (!result.blocked) bindLocalLease(storage)
    return !result.blocked && owner === next && !wasValid ? { ...result, reloadRequired: true } : result
  } catch { return { switched: false, claimedGuestData: false, blocked: true } }
}
