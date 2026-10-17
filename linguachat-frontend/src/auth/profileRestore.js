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
  // Recover placement when an older identity update persisted default profile
  // fields. The separate account-scoped checkpoint remains authoritative here.
  return checkpoint && !profile?.placementResult
    ? { ...profile, placementResult: checkpoint, level: checkpoint.level }
    : profile
}
