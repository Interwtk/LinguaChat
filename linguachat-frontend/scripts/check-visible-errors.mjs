#!/usr/bin/env node
/*
 * check-visible-errors — what a learner reads when something fails (P2).
 *
 * Sign-in failures used to print the error's own text: English in all eight
 * UI languages, the provider's wording, and for a missing setup the
 * configuration variable names ("VITE_SUPABASE_URL must be…"). Now every
 * failure is a translated sentence chosen by `authErrorKey`.
 *
 * Proves: known failures map to the right sentence, unknown ones to the
 * generic one; every sentence exists in all eight languages and leaks no
 * configuration, address or provider name; no screen renders a raw message.
 *
 * Run: node scripts/check-visible-errors.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { authErrorKey, AUTH_PROVIDER_ERROR_KEYS } from '../src/auth/authErrorKey.js'
import { loadLocale, translate, SUPPORTED_LOCALES } from '../src/i18n/translations.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const read = path => readFileSync(ROOT + path, 'utf8')
let passed = 0
const failures = []
async function scenario(name, run) {
  try { await run(); passed++; console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}
const err = (message, extra = {}) => Object.assign(new Error(message), extra)

await scenario('provider failures map to the sentence that helps', () => {
  assert.equal(authErrorKey(err('Invalid login credentials', { code: 'invalid_credentials', status: 400 })), 'authInvalidCredentials')
  assert.equal(authErrorKey(err('Email not confirmed', { code: 'email_not_confirmed' })), 'authEmailNotConfirmed')
  assert.equal(authErrorKey(err('User already registered', { code: 'user_already_exists' })), 'authAlreadyRegistered')
  assert.equal(authErrorKey(err('Request rate limit reached', { status: 429 })), 'authRateLimited')
  assert.equal(authErrorKey(new TypeError('Failed to fetch')), 'authNetworkError')
  assert.equal(authErrorKey(err('Load failed')), 'authNetworkError', 'Safari wording')
})
await scenario('local validation messages map to the existing translated hints', () => {
  assert.equal(authErrorKey(err('Enter a valid email address.')), 'validEmail')
  assert.equal(authErrorKey(err('Password must be 8–128 characters.')), 'passwordMin')
  assert.equal(authErrorKey(err('Enter your name.')), 'fillAllFields')
})
await scenario('a missing or wrong setup never shows its configuration', () => {
  assert.equal(authErrorKey(err('LinguaChat public auth configuration is missing.')), 'authUnavailable')
  assert.equal(authErrorKey(err('VITE_SUPABASE_URL must be an allowed HTTPS Supabase URL.')), 'authUnavailable')
  assert.equal(authErrorKey(err('Auth provider did not respond.')), 'authUnavailable')
})
await scenario('anything unrecognised is the generic sentence, never its text', () => {
  for (const e of [err('relation "profiles" does not exist'), err('https://abc.supabase.co/auth/v1 500'), {}, null, 'boom']) {
    assert.equal(authErrorKey(e), 'authGenericError')
  }
})

await scenario('every sentence exists in all eight languages and leaks nothing', async () => {
  const keys = new Set([...Object.values(AUTH_PROVIDER_ERROR_KEYS), 'authInvalidCredentials', 'authEmailNotConfirmed',
    'authAlreadyRegistered', 'authRateLimited', 'authNetworkError', 'authUnavailable', 'authSessionRestoreFailed',
    'authGenericError', 'validEmail', 'passwordMin', 'fillAllFields', 'missionSavedOnDevice'])
  assert.equal(SUPPORTED_LOCALES.length, 8)
  const english = Object.fromEntries([...keys].map(k => [k, translate('en', k)]))
  for (const code of SUPPORTED_LOCALES) {
    await loadLocale(code)
    for (const key of keys) {
      const text = translate(code, key)
      assert.notEqual(text, key, `${code}.${key} is missing`)
      if (code !== 'en') assert.notEqual(text, english[key], `${code}.${key} falls back to English`)
      assert.ok(!/VITE_|supabase|https?:|localhost|127\.0\.0\.1|\.env|anon|service.role/i.test(text), `${code}.${key} leaks: ${text}`)
    }
  }
})

await scenario('no screen renders an error’s own text', () => {
  const flow = read('src/components/auth/AuthFlow.jsx')
  const context = read('src/context/AppContext.jsx')
  assert.ok(!/setError\((err|error)\?\.message/.test(flow), 'AuthFlow prints a raw message')
  assert.ok(/setError\(t\(authErrorKey\(err\)\)\)/.test(flow))
  assert.ok(!/setAuthProviderError\([^)]*\.message/.test(context), 'the provider error is stored as raw text')
  assert.ok(!/: authProviderError\s*$/m.test(flow), 'the entry screen falls back to the raw provider error')
  const room = read('src/components/layout/ConversationRoom.jsx')
  assert.ok(!/missionCelebration\.message\b/.test(room) && !/Mision completada\. Lingua/.test(context),
    'the mission celebration is a hard-coded Spanish sentence')
})

console.log(`\ncheck-visible-errors — ${passed} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
