export const SETUP_STEPS = ['level-reveal', 'setup-choice', 'tutor-personality', 'learning-prefs', 'personalize']
export function readSetupCheckpoint(store) {
  try {
    const result = JSON.parse(store.getItem('lc2-placement-result') || 'null')
    if (!result || !['Pre-A1','A1','A2','B1','B2','C1','C2'].includes(result.level)) return { step: 'placement', result: null }
    for (const key of ['strengths','placementStrengths','focusAreas','placementFocusAreas']) {
      if (result[key] != null && (!Array.isArray(result[key]) || result[key].some(x => typeof x !== 'string'))) return {step:'placement',result:null}
    }
    const step = store.getItem('lc2-onboarding-step')
    return { step: SETUP_STEPS.includes(step) ? step : 'setup-choice', result }
  } catch { return { step: 'placement', result: null } }
}
