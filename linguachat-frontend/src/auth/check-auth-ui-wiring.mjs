#!/usr/bin/env node
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')

const pkg = JSON.parse(read('package.json'))
assert.ok(pkg.dependencies?.['@supabase/supabase-js'], 'official Supabase browser SDK must be a runtime dependency')

const env = read('.env.example')
assert.match(env, /^VITE_SUPABASE_URL=\s*$/m, 'public Supabase URL must be documented without a committed value')
assert.match(env, /^VITE_SUPABASE_ANON_KEY=\s*$/m, 'public Supabase anon key must be documented without a committed value')

const provider = read('src/auth/provider.js')
assert.match(provider, /from ['"]@supabase\/supabase-js['"]/, 'provider must import the official SDK')
assert.match(provider, /createLinguaChatSupabaseClient\(createClient\)/, 'provider must use the guarded public-client factory')

const adapter = read('src/auth/emailPassword.js')
assert.match(adapter, /display_name:\s*displayName,\s*language:\s*locale/, 'signup must persist normalized locale metadata')
for (const operation of ['signUp', 'signInWithPassword', 'signOut', 'resetPasswordForEmail', 'updateUser', 'resend', 'getSession', 'onAuthStateChange']) {
  assert.ok(adapter.includes(operation), `auth adapter is missing provider operation: ${operation}`)
}

const context = read('src/context/AppContext.jsx')
assert.match(context, /getBrowserAuthService/, 'AppContext must use the authorized provider service')
assert.doesNotMatch(context, /\b(?:loginMock|signupMock|logoutMock)\b/, 'legacy mock auth actions must be removed')
assert.doesNotMatch(context, /getItem\(['"]lc2-auth['"]\)/, 'legacy localStorage auth flag must never authorize a session')
assert.match(context, /if \(!session\?\.user\) \{[\s\S]*?currentAuthAction\(\)[\s\S]*?clearAuthCallback\(\)/, 'failed or expired auth callbacks must be cleared before a later normal login')
assert.match(context, /if \(isolation\.blocked\) \{[\s\S]*?authIsolationBlockedRef\.current = true[\s\S]*?setAuthProviderError\('storage_full'\)[\s\S]*?getAuthService\(\)\.signOut\(\)/, 'storage-isolation failures must preserve an actionable error and sign the new provider session back out')
assert.match(context, /if \(!authIsolationBlockedRef\.current\) setAuthProviderError\(''\)/, 'compensating auth events must not erase a pending isolation error')
for (const action of ['login', 'signup', 'requestPasswordReset', 'resendConfirmation', 'changePassword', 'logout']) {
  assert.match(context, new RegExp(`\\b${action}\\b`), `AppContext must expose real ${action} action`)
}

const flow = read('src/components/auth/AuthFlow.jsx')
assert.doesNotMatch(flow, /\b(?:loginMock|signupMock)\b/, 'AuthFlow must not call mock auth')
assert.doesNotMatch(flow, /new Promise\s*\(.*setTimeout/s, 'Auth forms must not fake network success with delays')
assert.match(flow, /authProviderError === 'storage_full'[\s\S]*?t\('authStorageFull'\)/, 'entry screen must translate the storage-isolation error')
assert.match(flow, /role="alert"[\s\S]*?providerErrorText/, 'entry screen must visibly render provider Auth failures')
for (const call of ['login(', 'signup(', 'requestPasswordReset(', 'resendConfirmation(', 'changePassword(']) {
  assert.ok(flow.includes(call), `AuthFlow must call ${call}`)
}
const forgotStart = flow.indexOf('function ForgotPassword()')
const resetStart = flow.indexOf('/* ---- Reset Password ---- */', forgotStart)
assert.ok(forgotStart >= 0 && resetStart > forgotStart, 'ForgotPassword source segment must exist')
const forgotSource = flow.slice(forgotStart, resetStart)
assert.doesNotMatch(forgotSource, /err\?\.message|error\?\.message/, 'recovery UI must not expose provider-specific errors that could enumerate accounts')

const app = read('src/App.jsx')
assert.match(app, /AUTH_STEPS\s*=\s*\[[^\]]*['"]reset['"]/, 'password recovery callback must have a reset screen route')

const identity = read('src/components/identity/LanguageIdentity.jsx')
assert.doesNotMatch(identity, /logoutMock/, 'profile must not use mock logout')
assert.match(identity, /onClick=\{logout\}/, 'profile logout must call provider logout')

console.log('check-auth-ui-wiring — real provider wiring, session authority, recovery route and public config contracts PASS')
