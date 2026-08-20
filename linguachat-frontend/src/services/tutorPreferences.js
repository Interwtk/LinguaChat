import { KNOWN_INTERESTS, MAX_SELECTED_INTERESTS, normalizeInterests } from '../learning/engine/interests.js'

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

// Lingua is the single, official tutor. The old multi-companion selector
// (Lingua / Lingo / Chatto) is gone from the product: Lingua teaches, Chatto
// is the mascot. This constant is kept as a single-entry list so any legacy
// import keeps working while `active_companion` stays 'lingua' for the backend.
export const SOLE_COMPANION = 'lingua'
export const COMPANIONS = [
  { id: 'lingua', name: 'Lingua', roleKey: 'companionLinguaRole' },
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

/*
 * Legacy guided-onboarding preference config (tutor personality, goals, daily
 * pace, correction intensity, practice vibe). `id` is the stored value (also
 * sent to the backend/profile) and stays English; the visible label is always
 * looked up through its `*Key`/`labelKey`. Shared by the onboarding SetupFlow
 * screen and the Language Identity profile summary so the two surfaces cannot
 * drift, and so a profile-page summary of an onboarding choice is never
 * rendered as the raw stored id.
 */
export const PERSONALITIES = [
  { id: 'Gentle Guide',    emoji: '🌿', nameKey: 'persGentleName', descKey: 'persGentleDesc', sampleKey: 'persGentleSample', aura: 'var(--positive)',  soft: 'var(--positive-soft)' },
  { id: 'Casual Friend',   emoji: '😊', nameKey: 'persCasualName', descKey: 'persCasualDesc', sampleKey: 'persCasualSample', aura: 'var(--accent)',  soft: 'var(--accent-soft)' },
  { id: 'Strict Coach',    emoji: '📐', nameKey: 'persStrictName', descKey: 'persStrictDesc', sampleKey: 'persStrictSample', aura: 'var(--info)',   soft: 'var(--info-soft)' },
  { id: 'Interview Mentor',emoji: '🎯', nameKey: 'persMentorName', descKey: 'persMentorDesc', sampleKey: 'persMentorSample', aura: 'var(--accent)', soft: 'var(--accent-soft)' },
]
export const personalityName = (id) => PERSONALITIES.find(p => p.id === id)?.nameKey

export const GOAL_OPTIONS = [
  { id: 'Travel', key: 'goalOptTravel' }, { id: 'Work', key: 'goalOptWork' },
  { id: 'Study', key: 'goalOptStudy' }, { id: 'Friends', key: 'goalOptFriends' },
  { id: 'Streaming', key: 'goalOptStreaming' }, { id: 'Immigration', key: 'goalOptImmigration' },
]
export const VIBE_OPTIONS = [
  { id: 'Motivational', key: 'vibeMotivational' }, { id: 'Calm', key: 'vibeCalm' }, { id: 'Challenging', key: 'vibeChallenging' },
]
export const CORRECTION_OPTIONS = [
  { id: 'Every mistake', key: 'corrEvery' }, { id: 'Balanced', key: 'corrBalanced' }, { id: 'Only big errors', key: 'corrOnlyBig' },
]
export const labelKeyFor = (list, id) => list.find(o => o.id === id)?.key

/*
 * The interests a learner may choose, taken from the catalogue that gives them
 * meaning rather than listed again here.
 *
 * There used to be two lists — these ids, and the contexts in
 * learning/engine/interests.js — which had to agree and had no way of noticing
 * when they did not. One list, one source of truth: an interest exists when the
 * product knows what to do with it.
 */
export const INTEREST_OPTIONS = KNOWN_INTERESTS
export const MAX_INTERESTS = MAX_SELECTED_INTERESTS

/*
 * Interests are read back through the catalogue on the way in AND on the way out.
 *
 * Storage is a text file a learner can edit, a profile can outlive an interest we
 * removed, and a save can be racing another tab. So an id the catalogue does not
 * know is dropped, duplicates collapse, and the list is capped — quietly, keeping
 * every valid choice, because losing someone's other nineteen interests over one
 * bad entry would be the worse bug.
 */
/*
 * Add or remove one interest. Both surfaces that offer the choice call this.
 *
 * They used to each have their own version, and each had a bug the other did not:
 * deselecting the last interest silently re-selected `travel`, so "I do not want
 * this personalised" was not expressible; and the settings panel capped the list
 * at six, so a learner who chose twenty at onboarding lost fourteen of them the
 * moment they toggled anything. One function, one cap, and an empty list is a
 * legitimate answer.
 */
export function toggleInterestId(interests, id) {
  const current = normalizeInterests(interests)
  if (current.includes(id)) return current.filter(item => item !== id)
  if (!KNOWN_INTERESTS.includes(id)) return current
  if (current.length >= MAX_SELECTED_INTERESTS) return current
  return [...current, id]
}

export function loadTutorPreferences() {
  try {
    const stored = localStorage.getItem(TUTOR_PREFERENCES_KEY)
    const parsed = stored ? JSON.parse(stored) : {}
    return {
      ...DEFAULT_TUTOR_PREFERENCES,
      ...parsed,
      /*
       * An absent list means "never chose": the defaults apply. An EMPTY list
       * means "chose nothing", which is a real answer and must survive a reload —
       * so the two cases are distinguished rather than both falling back.
       */
      interests: Array.isArray(parsed.interests)
        ? normalizeInterests(parsed.interests)
        : normalizeInterests(DEFAULT_TUTOR_PREFERENCES.interests),
    }
  } catch {
    return { ...DEFAULT_TUTOR_PREFERENCES }
  }
}

export function saveTutorPreferences(preferences) {
  const next = {
    ...DEFAULT_TUTOR_PREFERENCES,
    ...(preferences || {}),
    interests: Array.isArray(preferences?.interests)
      ? normalizeInterests(preferences.interests)
      : normalizeInterests(DEFAULT_TUTOR_PREFERENCES.interests),
  }
  try { localStorage.setItem(TUTOR_PREFERENCES_KEY, JSON.stringify(next)) } catch {}
  return next
}

// Always resolve to Lingua. Any legacy stored value ('lingo' / 'chatto') is
// silently migrated to 'lingua' so a stale key can never resurface a selector.
export function loadActiveCompanion() {
  try {
    const stored = localStorage.getItem(ACTIVE_COMPANION_KEY)
    if (stored !== SOLE_COMPANION) localStorage.setItem(ACTIVE_COMPANION_KEY, SOLE_COMPANION)
  } catch {}
  return SOLE_COMPANION
}

export function saveActiveCompanion() {
  try { localStorage.setItem(ACTIVE_COMPANION_KEY, SOLE_COMPANION) } catch {}
  return SOLE_COMPANION
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
