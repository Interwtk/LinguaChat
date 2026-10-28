import { readSetupCheckpoint } from './setupCheckpoint.js'

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
  const inconsistent = placement != null && (
    typeof placement !== 'object' || Array.isArray(placement)
    || placement.level !== profile?.level
  )
  if (inconsistent && !checkpoint) throw new Error('Invalid profile placement')
  // The separately persisted account-scoped checkpoint can repair legacy
  // mismatches without discarding unrelated profile choices.
  return checkpoint && (!placement || inconsistent)
    ? { ...profile, placementResult: checkpoint, level: checkpoint.level }
    : profile
}
