/*
 * Unreadable learner data is set aside, never silently overwritten.
 *
 * When a stored value cannot be parsed or validated, the app must still be
 * able to move on — but the original bytes may be the only copy of somebody's
 * progress. Before anything replaces such a value, its exact bytes are copied
 * to an account-scoped quarantine key named after a hash of the content, so a
 * repeated attempt is idempotent and two different corruptions never collide.
 *
 * The copy goes through the same captured account lease as every other learner
 * write: it can never land in another account's storage. If the copy cannot be
 * made, the caller must not overwrite the original.
 */
export const QUARANTINE_PREFIX = 'lc2-quarantine:'

// FNV-1a, 32 bit: a stable short name for the content, not a security hash.
function contentHash(text) {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

export function quarantineKey(key, raw) {
  return `${QUARANTINE_PREFIX}${key}:${contentHash(String(raw))}:${String(raw).length}`
}

/*
 * Copy `raw` (the value currently stored under `key`) aside. Returns the
 * quarantine key on success and null when the copy could not be verified.
 */
export function quarantineValue(access, key, raw, reason = 'unreadable') {
  if (raw === null || raw === undefined) return null
  const target = quarantineKey(key, raw)
  const record = JSON.stringify({ key, reason, raw: String(raw) })
  try {
    if (!access.valid()) return null
    if (access.getItem(target) === record) return target
    if (access.setItem(target, record) === false || !access.valid()) return null
    return access.getItem(target) === record && access.valid() ? target : null
  } catch {
    return null
  }
}
