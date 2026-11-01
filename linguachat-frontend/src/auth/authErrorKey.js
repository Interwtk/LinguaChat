/*
 * The sentence a learner sees for an auth failure: an i18n key, never the
 * error's own text.
 *
 * Login, sign-up and the entry screen used to print `error.message` as is —
 * English in every UI language, the provider's wording, and for a missing
 * setup even the configuration variable names. The provider's error `code`
 * (Supabase Auth) is the stable signal; known local messages are matched
 * only to pick a key. Anything unrecognised is the generic sentence.
 */
const BY_CODE = {
  invalid_credentials: 'authInvalidCredentials',
  email_not_confirmed: 'authEmailNotConfirmed',
  user_already_exists: 'authAlreadyRegistered',
  email_exists: 'authAlreadyRegistered',
  over_request_rate_limit: 'authRateLimited',
  over_email_send_rate_limit: 'authRateLimited',
  weak_password: 'passwordMin',
}

const BY_MESSAGE = [
  [/^Enter a valid email address\.$/, 'validEmail'],
  [/^Password must be 8/, 'passwordMin'],
  [/^Enter your (password|name)\.$/, 'fillAllFields'],
  [/invalid login credentials/i, 'authInvalidCredentials'],
  [/email not confirmed/i, 'authEmailNotConfirmed'],
  [/already (registered|exists)/i, 'authAlreadyRegistered'],
  [/rate limit|too many requests/i, 'authRateLimited'],
  [/failed to fetch|networkerror|network request failed|load failed/i, 'authNetworkError'],
  [/configuration is missing|VITE_|SDK factory|application origin|Auth client is required|did not respond/i, 'authUnavailable'],
]

export function authErrorKey(error) {
  if (!error) return 'authGenericError'
  const code = typeof error.code === 'string' ? error.code : null
  if (code && BY_CODE[code]) return BY_CODE[code]
  if (error.status === 429) return 'authRateLimited'
  const message = typeof error === 'string' ? error : String(error.message || '')
  for (const [pattern, key] of BY_MESSAGE) if (pattern.test(message)) return key
  return 'authGenericError'
}

/* Provider-level problems are stored as codes; the entry screen translates them. */
export const AUTH_PROVIDER_ERROR_KEYS = {
  storage_full: 'authStorageFull',
  storage_unavailable: 'authStorageUnavailable',
  local_data_unreadable: 'authLocalDataUnreadable',
  callback_error: 'authCallbackError',
  auth_unavailable: 'authUnavailable',
  session_restore_failed: 'authSessionRestoreFailed',
}
