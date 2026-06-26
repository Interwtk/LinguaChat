const TUTOR_PREFERENCES_KEY = 'lc2-tutor-preferences'
const ACTIVE_COMPANION_KEY = 'lc2-active-companion'
const TEXT_SIZE_KEY = 'lc2-text-size'

export const DEFAULT_TUTOR_PREFERENCES = {
  correction_style: 'balanced',
  tone: 'friendly',
  pace: 'normal',
  explanation_depth: 'normal',
  interests: ['travel', 'music'],
  goal: 'daily_conversation',
  learner_style: 'prefer_not_to_say',
}

export const COMPANIONS = [
  { id: 'lingua', name: 'Lingua', roleKey: 'companionLinguaRole' },
  { id: 'lingo', name: 'Lingo', roleKey: 'companionLingoRole' },
  { id: 'chatto', name: 'Chatto', roleKey: 'companionChattoRole' },
]

/* Shared option config used by both the onboarding personalization step and
 * the Language Identity settings panel, so they never drift apart. */
export const TUTOR_OPTION_GROUPS = [
  {
    key: 'correction_style',
    labelKey: 'correctionStyleLabel',
    options: [
      { id: 'gentle', labelKey: 'correctionGentle' },
      { id: 'balanced', labelKey: 'correctionBalanced' },
      { id: 'strict', labelKey: 'correctionStrict' },
    ],
  },
  {
    key: 'tone',
    labelKey: 'aiTone',
    options: [
      { id: 'friendly', labelKey: 'toneFriendly' },
      { id: 'motivating', labelKey: 'toneMotivating' },
      { id: 'fun', labelKey: 'toneFun' },
      { id: 'professional', labelKey: 'toneProfessional' },
      { id: 'calm', labelKey: 'toneCalm' },
    ],
  },
  {
    key: 'pace',
    labelKey: 'pace',
    options: [
      { id: 'slow_clear', labelKey: 'paceSlow' },
      { id: 'normal', labelKey: 'paceNormal' },
      { id: 'fast', labelKey: 'paceFast' },
    ],
  },
  {
    key: 'explanation_depth',
    labelKey: 'explanations',
    options: [
      { id: 'very_simple', labelKey: 'explanationsSimple' },
      { id: 'normal', labelKey: 'explanationsNormal' },
      { id: 'detailed', labelKey: 'explanationsDetailed' },
    ],
  },
  {
    key: 'goal',
    labelKey: 'goal',
    options: [
      { id: 'daily_conversation', labelKey: 'goalDailyConversation' },
      { id: 'travel', labelKey: 'goalTravel' },
      { id: 'work', labelKey: 'goalWork' },
      { id: 'school', labelKey: 'goalSchool' },
      { id: 'confidence', labelKey: 'goalConfidence' },
    ],
  },
  {
    key: 'learner_style',
    labelKey: 'learnerStyle',
    options: [
      { id: 'child', labelKey: 'learnerChild' },
      { id: 'teen', labelKey: 'learnerTeen' },
      { id: 'adult', labelKey: 'learnerAdult' },
      { id: 'older_adult', labelKey: 'learnerOlderAdult' },
      { id: 'prefer_not_to_say', labelKey: 'preferNotSay' },
    ],
  },
]

export const INTEREST_OPTIONS = ['travel', 'music', 'games', 'work', 'food', 'school', 'technology', 'family', 'sports', 'culture', 'movies']

export function loadTutorPreferences() {
  try {
    const stored = localStorage.getItem(TUTOR_PREFERENCES_KEY)
    const parsed = stored ? JSON.parse(stored) : {}
    return {
      ...DEFAULT_TUTOR_PREFERENCES,
      ...parsed,
      interests: Array.isArray(parsed.interests)
        ? parsed.interests
        : DEFAULT_TUTOR_PREFERENCES.interests,
    }
  } catch {
    return DEFAULT_TUTOR_PREFERENCES
  }
}

export function saveTutorPreferences(preferences) {
  const next = {
    ...DEFAULT_TUTOR_PREFERENCES,
    ...(preferences || {}),
    interests: Array.isArray(preferences?.interests)
      ? preferences.interests
      : DEFAULT_TUTOR_PREFERENCES.interests,
  }
  try { localStorage.setItem(TUTOR_PREFERENCES_KEY, JSON.stringify(next)) } catch {}
  return next
}

export function loadActiveCompanion() {
  try {
    const stored = localStorage.getItem(ACTIVE_COMPANION_KEY)
    return COMPANIONS.some(companion => companion.id === stored) ? stored : 'lingua'
  } catch {
    return 'lingua'
  }
}

export function saveActiveCompanion(companion) {
  const next = COMPANIONS.some(item => item.id === companion) ? companion : 'lingua'
  try { localStorage.setItem(ACTIVE_COMPANION_KEY, next) } catch {}
  return next
}

export function loadTextSize() {
  try {
    return localStorage.getItem(TEXT_SIZE_KEY) === 'large' ? 'large' : 'normal'
  } catch {
    return 'normal'
  }
}

export function saveTextSize(size) {
  const next = size === 'large' ? 'large' : 'normal'
  try { localStorage.setItem(TEXT_SIZE_KEY, next) } catch {}
  return next
}
