#!/usr/bin/env node
/*
 * check-age-gate — the adults-only beta's age question (services/ageGate.js).
 *
 * Proves: three neutral brackets and no birth date; "under 18" creates no
 * account and stores only a bare timestamp for 24 hours (no age, no answer);
 * an adult is remembered only as the declaration "18_plus"; sign-up metadata
 * carries the declaration only after the question; existing accounts answer
 * once; the sign-up form cannot be rendered before the question.
 *
 * A self-declared age is not age verification. This check proves the flow,
 * not legal compliance (see docs/legal/age-and-safety-policy.md).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  AGE_BRACKETS, BLOCK_KEY, ADULT_KEY, BLOCK_MS, answerAgeGate, isRecentlyBlocked, ageGatePassed, resetAgeGateForTests,
  accountAgeConfirmed, confirmAccountAdult,
} from '../src/services/ageGate.js'
import { createEmailPasswordAuth } from '../src/auth/emailPassword.js'

let passed = 0
const ok = (cond, msg) => { assert.ok(cond, msg); passed++ }
const store = () => {
  const m = new Map()
  return { m, getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), valid: () => true }
}

ok(AGE_BRACKETS.join() === 'under_13,13_17,18_plus', 'three brackets, no exact age')

for (const bracket of ['under_13', '13_17']) {
  resetAgeGateForTests()
  const s = store()
  const t0 = Date.UTC(2026, 10, 2)
  ok(answerAgeGate(bracket, s, t0) === 'blocked', `${bracket} is blocked`)
  ok(!ageGatePassed(), `${bracket} does not open the sign-up form`)
  ok([...s.m.keys()].join() === BLOCK_KEY, `${bracket} stores one key only`)
  ok(s.m.get(BLOCK_KEY) === String(t0), `${bracket} stores a bare timestamp, never the answer or an age`)
  ok(isRecentlyBlocked(s, t0 + BLOCK_MS - 1), 'still blocked within 24 h')
  ok(!isRecentlyBlocked(s, t0 + BLOCK_MS + 1) && !s.m.has(BLOCK_KEY), 'the block expires and is removed after 24 h')
}
{
  resetAgeGateForTests()
  const s = store()
  ok(answerAgeGate('18_plus', s) === 'continue' && ageGatePassed(), 'an adult continues to sign-up')
  ok(s.m.size === 0, 'an adult answer stores nothing before the account exists')
  ok(answerAgeGate('17', s) === 'invalid', 'anything outside the brackets is rejected')
}

// existing accounts
{
  const s = store()
  ok(accountAgeConfirmed({ id: 'a', ageDeclared: true }, s), 'an account with the declaration is confirmed')
  ok(!accountAgeConfirmed({ id: 'a' }, s), 'an account without it is asked')
  ok(confirmAccountAdult(s) && String(s.m.get(ADULT_KEY)).startsWith('18_plus:'), 'the account keeps only "18_plus" and a date')
  ok(accountAgeConfirmed({ id: 'a' }, s), '...and is not asked again')
  ok(ADULT_KEY.startsWith('lc2-') && BLOCK_KEY.startsWith('lc2-'), 'both keys live in the per-account namespace')
  ok(!confirmAccountAdult({ ...s, valid: () => false }), 'a stale account lease cannot confirm')
}

// sign-up metadata
{
  const calls = []
  const auth = { async signUp(args) { calls.push(args); return { data: { user: { id: 'u' }, session: null }, error: null } } }
  for (const m of ['signInWithPassword', 'signOut', 'resetPasswordForEmail', 'updateUser', 'resend', 'getSession', 'exchangeCodeForSession']) auth[m] = async () => ({ data: {}, error: null })
  auth.onAuthStateChange = () => ({ data: { subscription: { unsubscribe() {} } } })
  const service = createEmailPasswordAuth({ auth }, { origin: 'https://example.test' })
  await service.signUp({ name: 'Ana', email: 'ana@example.test', password: 'test-password-1', adultDeclaredAt: '2026-11-02T00:00:00.000Z' })
  ok(calls[0].options.data.age_declaration === '18_plus' && calls[0].options.data.age_declared_at === '2026-11-02T00:00:00.000Z', 'the declaration travels with sign-up')
  ok(!('age' in calls[0].options.data) && !('birth_date' in calls[0].options.data), 'no age or birth date is sent')
  await service.signUp({ name: 'Ana', email: 'ana@example.test', password: 'test-password-1' })
  ok(!('age_declaration' in calls[1].options.data), 'without the question, no declaration is invented')
}

// the UI
{
  const flow = readFileSync(new URL('../src/components/auth/AuthFlow.jsx', import.meta.url), 'utf8')
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  const ctx = readFileSync(new URL('../src/context/AppContext.jsx', import.meta.url), 'utf8')
  ok(/function SignupForm\(\) \{\s*\/\/[^\n]*\n\s*if \(!ageGatePassed\(\)\) return <AgeGate \/>/.test(flow), 'the sign-up form renders the age question first')
  ok(!/type="date"|birth_?date|dateOfBirth|fechaNacimiento|setBirth/i.test(flow), 'no birth-date field anywhere in the auth flow')
  ok(/setAuthStep\('age'\)/.test(flow) && !/setAuthStep\('signup'\)\}\s*\n\s*className="w-full py-3\.5 rounded-2xl font-bold text-white/.test(flow), 'Start goes to the age question')
  ok(/AUTH_STEPS = \[[^\]]*'age'/.test(app), 'the age step is routed')
  ok(/if \(ageConfirmationNeeded\) return <AuthFlowScreen/.test(app), 'a signed-in account without a declaration is asked before the app opens')
  ok(/adultDeclaredAt: ageGatePassed\(\)/.test(ctx), 'sign-up sends the declaration only after the question')
  ok(!/defaultChecked|aria-checked=\{true\}|autoFocus/.test(flow.slice(flow.indexOf('function AgeQuestion'), flow.indexOf('function AgeBlocked'))), 'no answer is preselected or nudged')
}

console.log(`check-age-gate: ${passed} passed, 0 failed`)
