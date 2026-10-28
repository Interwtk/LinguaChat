// Onboarding is complete only after the learner's profile and setup flags
// have been durably published under the same captured account lease.
// The completion marker is deliberately last: a failed earlier write must
// never allow a reload to skip unfinished setup.
export function commitOnboarding(access, profile) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    throw new Error('Invalid onboarding profile')
  }
  // Serialize and validate before invalidating an earlier successful setup.
  // A circular object, throwing getter or custom toJSON returning a scalar
  // must not clear the old completion marker or publish an unreadable profile.
  let serializedProfile
  try {
    serializedProfile = JSON.stringify(profile)
    const persistedProfile = JSON.parse(serializedProfile)
    // A JSON object alone is insufficient: publishing an empty or mismatched
    // profile as complete would skip placement after a crash/reload.
    const validLevels = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    if (!persistedProfile || typeof persistedProfile !== 'object' || Array.isArray(persistedProfile)
      || !validLevels.includes(persistedProfile.level)
      || !persistedProfile.placementResult || typeof persistedProfile.placementResult !== 'object'
      || Array.isArray(persistedProfile.placementResult)
      || persistedProfile.placementResult.level !== persistedProfile.level) {
      throw new Error('Invalid onboarding profile')
    }
  } catch {
    throw new Error('Invalid onboarding profile')
  }
  // A learner may repeat onboarding with an existing completion marker.
  // Invalidate that marker first; otherwise a failed profile write would
  // leave the old `true` behind and incorrectly skip the unfinished retry.
  if (!access.valid() || access.setItem('lc2-onboarded', 'false') === false
    || !access.valid() || access.getItem('lc2-onboarded') !== 'false' || !access.valid()) {
    throw new Error('Onboarding state not durable')
  }
  const writes = [
    ['lc2-profile', serializedProfile],
    ['lc2-welcome-seen', 'false'],
    ['lc2-personalization-completed', 'true'],
    ['lc2-onboarded', 'true'],
  ]
  for (const [key, value] of writes) {
    if (!access.valid() || access.setItem(key, value) === false
      || !access.valid() || access.getItem(key) !== value || !access.valid()) {
      throw new Error('Onboarding state not durable')
    }
  }
  return true
}
