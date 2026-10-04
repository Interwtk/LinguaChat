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
    if (key === OWNER_KEY || key === LEGACY_AUTH_KEY || key.startsWith(CACHE_PREFIX)) continue
    keys.push(key)
  }
  return keys
}

function cacheKey(userId) {
  return CACHE_PREFIX + normalizeUserId(userId)
}

function snapshotActive(storage, userId) {
  const snapshot = {}
  for (const key of activeKeys(storage)) snapshot[key] = storage.getItem(key)
  storage.setItem(cacheKey(userId), JSON.stringify(snapshot))
}

function clearActive(storage) {
  for (const key of activeKeys(storage)) storage.removeItem(key)
  storage.removeItem(LEGACY_AUTH_KEY)
}

function restoreActive(storage, userId) {
  const raw = storage.getItem(cacheKey(userId))
  if (!raw) return
  let snapshot
  try { snapshot = JSON.parse(raw) } catch { return }
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return
  for (const [key, value] of Object.entries(snapshot)) {
    if (!key.startsWith(ACTIVE_PREFIX) || key === OWNER_KEY || key === LEGACY_AUTH_KEY || key.startsWith(CACHE_PREFIX)) continue
    if (typeof value === 'string') storage.setItem(key, value)
  }
}

/*
 * The app still uses browser-local learner stores while cloud sync is being
 * built. Associate those stores with exactly one authenticated account.
 * A first login claims existing guest progress. Switching accounts snapshots
 * the previous account and restores only the next account's browser snapshot.
 * Provider/session tokens are untouched because they do not use the lc2- prefix.
 */
export function activateLocalAccount(storage, userId) {
  const next = normalizeUserId(userId)
  const current = storage.getItem(OWNER_KEY)
  storage.removeItem(LEGACY_AUTH_KEY)

  if (!current) {
    storage.setItem(OWNER_KEY, next)
    return { switched: false, claimedGuestData: true }
  }
  if (current === next) return { switched: false, claimedGuestData: false }

  snapshotActive(storage, decodeURIComponent(current))
  clearActive(storage)
  restoreActive(storage, decodeURIComponent(next))
  storage.setItem(OWNER_KEY, next)
  return { switched: true, claimedGuestData: false }
}

export const browserDataIsolationKeys = Object.freeze({ OWNER_KEY, CACHE_PREFIX })
