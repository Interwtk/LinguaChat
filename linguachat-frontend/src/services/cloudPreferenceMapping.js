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
  if (!row || typeof row !== 'object') return { ...currentLocal }
  // Only the current local model's known settings are imported. The calling
  // login flow must ask before replacing a newer local profile with remote data.
  const mapped = toCloudPreferenceFields({
    goal: row.learning_goal,
    correction_style: row.correction_style,
    tone: row.tone,
    pace: row.pace,
    explanation_depth: row.explanation_depth,
    interests: row.interests,
  }, { user_language: row.user_language, english_variant: row.english_variant, conversation_register: row.conversation_register })
  return {
    ...currentLocal,
    goal: mapped.learning_goal,
    correction_style: mapped.correction_style,
    tone: mapped.tone,
    pace: mapped.pace,
    explanation_depth: mapped.explanation_depth,
    interests: mapped.interests,
  }
}
