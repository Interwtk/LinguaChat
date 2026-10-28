export const SETUP_STEPS = ['level-reveal', 'setup-choice', 'tutor-personality', 'learning-prefs', 'personalize']
// Single placement shape contract for setup, authenticated restore and commit.
export function isValidPlacementResult(result) {
  return result !== null && typeof result === 'object' && !Array.isArray(result)
    && ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(result.level)
    && ['strengths', 'placementStrengths', 'focusAreas', 'placementFocusAreas'].every(key =>
      result[key] == null || (Array.isArray(result[key])
        && result[key].every(value => typeof value === 'string')))
}

// Placement answers belong to the lease under which the quiz began. A renewed
// lease for the same account must not inherit answers from an earlier session.
export function retainPlacementAnswerLease(previousAccess, candidateAccess) {
  if (!candidateAccess?.valid() || (previousAccess && !previousAccess.valid())) return null
  return previousAccess || candidateAccess
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
  // A partial write must never publish an uncommitted placement on reload.
  // Invalidate the authoritative checkpoint first, update the legacy mirror,
  // and publish the new authoritative value only after both are verified.
  // A failure at any boundary leaves setup at placement (not level-reveal).
  const writes = [
    ['lc2-placement-result', 'null'],
    ['lc2-placement', serialized],
    ['lc2-placement-result', serialized],
  ]
  for (const [key, value] of writes) {
    if (!access.valid() || access.setItem(key, value) === false
      || !access.valid() || access.getItem(key) !== value || !access.valid()) {
      throw new Error('Placement state not durable')
    }
  }
  return true
}
