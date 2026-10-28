export const SETUP_STEPS = ['level-reveal', 'setup-choice', 'tutor-personality', 'learning-prefs', 'personalize']
// Single placement shape contract for setup, authenticated restore and commit.
export function isValidPlacementResult(result) {
  return result !== null && typeof result === 'object' && !Array.isArray(result)
    && ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(result.level)
    && ['strengths', 'placementStrengths', 'focusAreas', 'placementFocusAreas'].every(key =>
      result[key] == null || (Array.isArray(result[key])
        && result[key].every(value => typeof value === 'string')))
}

export function readSetupCheckpoint(store) {
  try {
    const result = JSON.parse(store.getItem('lc2-placement-result') || 'null')
    if (!isValidPlacementResult(result)) return { step: 'placement', result: null }
    const step = store.getItem('lc2-onboarding-step')
    return { step: SETUP_STEPS.includes(step) ? step : 'setup-choice', result }
  } catch { return { step: 'placement', result: null } }
}


// Persist the evaluated placement under the captured learner lease before the
// UI reveals a level. An in-memory result must not advance setup when storage
// denied, corrupted or lost the checkpoint.
export function persistPlacementResult(access, result) {
  let serialized
  try {
    if (!isValidPlacementResult(result)) throw new Error('Invalid placement result')
    serialized = JSON.stringify(result)
    if (!isValidPlacementResult(JSON.parse(serialized))) throw new Error('Invalid placement result')
  } catch {
    throw new Error('Invalid placement result')
  }
  // Keep the authoritative checkpoint and the legacy reader in sync. Verify
  // each write while the same account lease is still valid.
  for (const key of ['lc2-placement-result', 'lc2-placement']) {
    if (!access.valid() || access.setItem(key, serialized) === false
      || !access.valid() || access.getItem(key) !== serialized || !access.valid()) {
      throw new Error('Placement state not durable')
    }
  }
  return true
}
