import { isValidPlacementResult, readSetupCheckpoint } from './setupCheckpoint.js'
import { quarantineValue } from '../services/storageQuarantine.js'

const PROFILE_KEY = 'lc2-profile'
const ONBOARDED_KEY = 'lc2-onboarded'

export const isQuotaError = error => error?.name === 'QuotaExceededError' || error?.name === 'NS_ERROR_DOM_QUOTA_REACHED'
  || error?.code === 22 || error?.code === 1014

// The readable parts of a damaged profile, minus anything about level: a level
// or placement that failed validation is never carried forward or guessed.
function salvageProfile(raw) {
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const { level: _level, placementResult: _placement, ...rest } = parsed
    return rest
  } catch {
    return null
  }
}

function writeVerified(access, key, value) {
  if (!access.valid()) return false
  const result = value === null ? access.removeItem(key) : access.setItem(key, value)
  return result !== false && access.valid() && access.getItem(key) === value && access.valid()
}

/*
 * Restore the signed-in learner's profile, recovering from a damaged one
 * instead of locking them out. Never throws. Returns one of:
 *
 *   restored             the profile was valid
 *   recovered            it was not; the original bytes were quarantined, the
 *                        readable choices kept, and setup reopens at `step`
 *                        (the last valid checkpoint, or placement). Progress,
 *                        preferences and the learner model are not touched.
 *   stale                the lease changed (logout, account switch): do nothing
 *   storage_unavailable  the browser refused to read learner storage
 *   storage_full         the browser is out of space; nothing was replaced
 *   unrecoverable        the profile could not be repaired safely right now;
 *                        nothing half-applied, original bytes kept when possible
 */
export function restoreProfile(access) {
  try {
    return { status: 'restored', profile: readVerifiedProfile(access) }
  } catch (error) {
    if (!access.valid()) return { status: 'stale' }
    let raw
    try {
      raw = access.getItem(PROFILE_KEY)
      access.getItem(ONBOARDED_KEY)
    } catch {
      return { status: 'storage_unavailable' }
    }
    if (!access.valid()) return { status: 'stale' }
    return repairProfile(access, raw, error?.message || 'invalid')
  }
}

function repairProfile(access, raw, reason) {
  try {
    // 1. Keep the exact original before anything replaces it.
    if (raw !== null && !quarantineValue(access, PROFILE_KEY, raw, reason)) {
      return access.valid() ? { status: probeQuota(access) ? 'storage_full' : 'unrecoverable' } : { status: 'stale' }
    }
    // 2. Close Home first: a crash between these writes must reopen setup, never
    //    a completed app on top of an unverified profile.
    if (!writeVerified(access, ONBOARDED_KEY, 'false')) return access.valid() ? { status: 'unrecoverable' } : { status: 'stale' }
    const salvaged = raw === null ? null : salvageProfile(raw)
    if (!writeVerified(access, PROFILE_KEY, salvaged ? JSON.stringify(salvaged) : null)) {
      return access.valid() ? { status: 'unrecoverable' } : { status: 'stale' }
    }
    // 3. The strict reader must now accept what is stored.
    const profile = readVerifiedProfile(access)
    const { step, result } = readSetupCheckpoint(access)
    if (!access.valid()) return { status: 'stale' }
    return { status: 'recovered', profile, step: result ? step : 'placement' }
  } catch (error) {
    if (!access.valid()) return { status: 'stale' }
    return { status: isQuotaError(error) ? 'storage_full' : 'unrecoverable' }
  }
}

// quarantineValue reports failure without its cause. Ask once, without keeping
// anything, whether a small write is refused for lack of space.
function probeQuota(access) {
  const key = 'lc2-quarantine:probe'
  try {
    access.setItem(key, 'x')
    access.removeItem(key)
    return false
  } catch (error) {
    return isQuotaError(error)
  }
}

// Read only after verified account activation, through its captured lease.
// A new tab's pre-auth React defaults are not the account's durable profile.
export function readVerifiedProfile(access) {
  if (!access.valid()) throw new Error('Stale profile restore')
  const raw = access.getItem('lc2-profile')
  const profile = raw === null ? null : JSON.parse(raw)
  if (profile !== null && (typeof profile !== 'object' || Array.isArray(profile))) throw new Error('Invalid profile')
  const checkpoint = readSetupCheckpoint(access).result
  if (!access.valid()) throw new Error('Profile ownership changed')
  // An older identity update may persist a default level, or a partial
  // restore may leave a placement result inconsistent with its profile level.
  // Never hydrate that contradictory result as a verified learner identity.
  const placement = profile?.placementResult
  const validLevels = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  // A matching level alone is not proof of a valid placement: a malformed
  // legacy payload (including an unknown level or invalid evidence arrays)
  // must never be restored as an authenticated learner result.
  const validPlacement = isValidPlacementResult(placement)
  const invalidLevel = profile?.level != null && !validLevels.includes(profile.level)
  const inconsistent = placement != null && (!validPlacement || placement.level !== profile?.level)
  if ((inconsistent || invalidLevel) && !checkpoint) throw new Error('Invalid profile placement')
  // An older incomplete profile can be restored while setup is still open.
  // But a durable completed marker must never open Home with a missing or
  // unverified placement after a partial write or legacy migration.
  const completed = access.getItem('lc2-onboarded') === 'true'
  if (!access.valid()) throw new Error('Profile ownership changed')
  // A checkpoint may repair a legacy level/placement mismatch, but it
  // cannot manufacture the missing learner level of an otherwise empty or
  // identity-only completed profile. Such a profile is not durable setup.
  if (completed && (!profile || typeof profile.level !== 'string' || profile.level.length === 0
    || (!checkpoint && (!validPlacement || placement.level !== profile.level)))) {
    throw new Error('Invalid completed profile placement')
  }
  // The separately persisted account-scoped checkpoint can repair legacy
  // mismatches without discarding unrelated profile choices.
  return checkpoint && (!placement || inconsistent || invalidLevel)
    ? { ...profile, placementResult: checkpoint, level: checkpoint.level }
    : profile
}
