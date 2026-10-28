import { isValidPlacementResult, readSetupCheckpoint } from './setupCheckpoint.js'

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
  if (completed && !checkpoint && (!profile || !validPlacement || placement.level !== profile.level)) {
    throw new Error('Invalid completed profile placement')
  }
  // The separately persisted account-scoped checkpoint can repair legacy
  // mismatches without discarding unrelated profile choices.
  return checkpoint && (!placement || inconsistent || invalidLevel)
    ? { ...profile, placementResult: checkpoint, level: checkpoint.level }
    : profile
}
