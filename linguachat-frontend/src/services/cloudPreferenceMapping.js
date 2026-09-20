/*
 * Project existing local tutor settings into an optional, remote preference
 * record. This pure module NEVER performs network calls or alters localStorage:
 * login, consent and conflict resolution belong to a separately gated integration,
 * not to the existing learning engine.
 *
 * Pedagogical evidence/readiness and billing entitlements must never be taken
 * from user-editable preferences. Do not store raw chats or learner facts here.
 */
import { DEFAULT_TUTOR_PREFERENCES } from './tutorPreferences.js'
import { normalizeInterests } from '../learning/engine/interests.js'

const ALLOWED = Object.freeze({
  user_language: ['en', 'es', 'pt', 'fr', 'it', 'de', 'ja', 'ar'],
  learning_goal: ['daily_conversation', 'travel', 'work', 'school', 'confidence', 'interview', 'study', 'social', 'general'],
  correction_style: ['gentle', 'balanced', 'strict'],
  tone: ['friendly', 'motivating', 'fun', 'professional', 'calm'],
  pace: ['slow_clear', 'normal', 'fast'],
  explanation_depth: ['very_simple', 'normal', 'detailed'],
  english_variant: ['adaptive', 'us', 'uk'],
  conversation_register: ['adaptive', 'casual', 'neutral', 'formal'],
})

const oneOf = (key, value, fallback) => ALLOWED[key].includes(value) ? value : fallback

export function toCloudPreferenceFields(local = {}, options = {}) {
  // No user_id: identity must come from a verified authentication session.
  // No billing_country: pricing must come from the payment provider, not here.
  return {
    user_language: oneOf('user_language', options.user_language, 'es'),
    target_language: 'en',
    learning_goal: oneOf('learning_goal', local.goal, DEFAULT_TUTOR_PREFERENCES.goal),
    correction_style: oneOf('correction_style', local.correction_style, DEFAULT_TUTOR_PREFERENCES.correction_style),
    tone: oneOf('tone', local.tone, DEFAULT_TUTOR_PREFERENCES.tone),
    pace: oneOf('pace', local.pace, DEFAULT_TUTOR_PREFERENCES.pace),
    explanation_depth: oneOf('explanation_depth', local.explanation_depth, DEFAULT_TUTOR_PREFERENCES.explanation_depth),
    interests: normalizeInterests(local.interests ?? DEFAULT_TUTOR_PREFERENCES.interests),
    english_variant: oneOf('english_variant', options.english_variant, 'adaptive'),
    conversation_register: oneOf('conversation_register', options.conversation_register, 'adaptive'),
  }
}

export function fromCloudPreferenceFields(row, currentLocal = {}) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return { ...currentLocal }
  // A partial or malformed remote record must never reset a learner's existing
  // choices to defaults. Import only explicitly present, allowlisted fields;
  // the login flow must separately resolve conflicts before applying any import.
  const accepted = {}
  if (ALLOWED.learning_goal.includes(row.learning_goal)) accepted.goal = row.learning_goal
  for (const key of ['correction_style', 'tone', 'pace', 'explanation_depth']) {
    if (ALLOWED[key].includes(row[key])) accepted[key] = row[key]
  }
  // An explicit [] means the learner chose no interests; a missing/invalid list
  // must not replace an existing local selection.
  if (Array.isArray(row.interests)) accepted.interests = normalizeInterests(row.interests)
  return { ...currentLocal, ...accepted }
}
