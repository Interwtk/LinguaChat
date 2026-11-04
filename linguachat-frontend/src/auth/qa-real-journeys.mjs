#!/usr/bin/env node
/*
 * qa-real-journeys — the provider half of the real sign-in QA, ready to run.
 *
 * NOT YET RUN: there is no authorized test project. This talks to the auth
 * REST API of ONE explicitly authorized TEST project (never production) and
 * proves what the simulated check cannot: wrong and right passwords, a tampered
 * token refused, a session recovered by refresh, sign-out revoking it, the same
 * answer for known and unknown recovery addresses, two accounts with two ids.
 * The browser half (isolation, courses, deletion) stays in
 * docs/release/2026-11-auth-journeys.md.
 *
 * Required environment (see docs/release/2026-11-auth-qa.env.example):
 *   QA_AUTH_URL, QA_AUTH_ANON_KEY     the TEST project's public values
 *   QA_AUTH_AUTHORIZED_HOST           must equal the host of QA_AUTH_URL
 *   QA_AUTH_CONFIRM_TEST_PROJECT=yes  a human says this is not production
 *   QA_AUTH_EMAIL_A, QA_AUTH_EMAIL_B  the owner's test aliases
 *   QA_AUTH_PASSWORD                  a throwaway password for those aliases
 *
 * `--self-test` proves the refusals with no network; it runs in check:all.
 * Passwords and tokens are never printed or written. Accounts are not deleted
 * (that needs a private key): the owner removes them in the dashboard.
 */
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'

export function refusal(env) {
  for (const name of ['QA_AUTH_URL', 'QA_AUTH_ANON_KEY', 'QA_AUTH_AUTHORIZED_HOST', 'QA_AUTH_EMAIL_A', 'QA_AUTH_EMAIL_B', 'QA_AUTH_PASSWORD']) {
    if (!env[name]) return `missing ${name}`
  }
  if (env.QA_AUTH_CONFIRM_TEST_PROJECT !== 'yes') return 'QA_AUTH_CONFIRM_TEST_PROJECT must be "yes"'
  let url
  try { url = new URL(env.QA_AUTH_URL) } catch { return 'QA_AUTH_URL is not a URL' }
  if (url.protocol !== 'https:' && url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') return 'plain http only on this machine'
  if (url.hostname !== env.QA_AUTH_AUTHORIZED_HOST) return 'QA_AUTH_URL is not the authorized host'
  if (/prod|live|main/i.test(url.hostname)) return 'this host looks like production'
  if (/service_role/.test(env.QA_AUTH_ANON_KEY)) return 'that is not a public key'
  try {
    const claims = JSON.parse(Buffer.from(env.QA_AUTH_ANON_KEY.split('.')[1] || '', 'base64url').toString('utf8'))
    if (claims.role && claims.role !== 'anon') return 'that is not a public key'
  } catch { /* new-format publishable keys are not JWTs */ }
  return null
}

function selfTest() {
  const good = {
    QA_AUTH_URL: 'https://abc-test.example.test', QA_AUTH_ANON_KEY: 'public', QA_AUTH_AUTHORIZED_HOST: 'abc-test.example.test',
    QA_AUTH_CONFIRM_TEST_PROJECT: 'yes', QA_AUTH_EMAIL_A: 'a@example.test', QA_AUTH_EMAIL_B: 'b@example.test', QA_AUTH_PASSWORD: 'x',
  }
  const jwt = (role) => `h.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.s`
  assert.equal(refusal(good), null)
  assert.match(refusal({}), /missing/)
  assert.match(refusal({ ...good, QA_AUTH_CONFIRM_TEST_PROJECT: 'no' }), /must be/)
  assert.match(refusal({ ...good, QA_AUTH_AUTHORIZED_HOST: 'other.example.test' }), /authorized host/)
  assert.match(refusal({ ...good, QA_AUTH_URL: 'https://prod-1.example.test', QA_AUTH_AUTHORIZED_HOST: 'prod-1.example.test' }), /production/)
  assert.match(refusal({ ...good, QA_AUTH_URL: 'http://abc-test.example.test' }), /plain http/)
  assert.match(refusal({ ...good, QA_AUTH_ANON_KEY: jwt('service_role') }), /public key/)
  assert.equal(refusal({ ...good, QA_AUTH_ANON_KEY: jwt('anon') }), null)
  console.log('qa-real-journeys --self-test: 8 passed, 0 failed (refusals only; the real journeys have NOT run)')
}

async function run(env) {
  const base = env.QA_AUTH_URL.replace(/\/$/, '')
  const headers = { apikey: env.QA_AUTH_ANON_KEY, 'Content-Type': 'application/json' }
  const call = (path, init = {}) => fetch(`${base}/auth/v1${path}`, { ...init, headers: { ...headers, ...init.headers } })
  const results = []
  const record = (journey, ok, detail = '') => { results.push({ journey, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'} ${journey}${detail ? ` — ${detail}` : ''}`) }
  const login = (email, password) => call('/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) })

  for (const [label, email] of [['A', env.QA_AUTH_EMAIL_A], ['B', env.QA_AUTH_EMAIL_B]]) {
    const res = await call('/signup', { method: 'POST', body: JSON.stringify({ email, password: env.QA_AUTH_PASSWORD, data: { age_declaration: '18_plus' } }) })
    record(`J1 sign-up ${label}`, res.ok || res.status === 422 || res.status === 400, `status ${res.status}`)
  }
  const wrong = await login(env.QA_AUTH_EMAIL_A, `${env.QA_AUTH_PASSWORD}-wrong`)
  record('J2 wrong password refused', !wrong.ok, `status ${wrong.status}`)
  const right = await login(env.QA_AUTH_EMAIL_A, env.QA_AUTH_PASSWORD)
  if (!right.ok) {
    record('J2 right password', false, `status ${right.status}: confirm both e-mails, then run again`)
  } else {
    const a = await right.json()
    record('J2 right password', Boolean(a.access_token))
    const who = (token) => call('/user', { headers: { Authorization: `Bearer ${token}` } })
    const me = await who(a.access_token)
    const user = me.ok ? await me.json() : {}
    record('J1 declaration on the account', user.user_metadata?.age_declaration === '18_plus')
    const forged = await who(`${a.access_token.slice(0, -4)}AAAA`)
    record('tampered token refused', !forged.ok, `status ${forged.status}`)
    const refreshed = await call('/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: a.refresh_token }) })
    const next = refreshed.ok ? await refreshed.json() : {}
    record('J8 session recovered by refresh', Boolean(next.access_token))
    const b = await login(env.QA_AUTH_EMAIL_B, env.QA_AUTH_PASSWORD)
    if (b.ok) { const data = await b.json(); record('J4 two accounts, two ids', data.user?.id && data.user.id !== user.id) }
    const out = await call('/logout', { method: 'POST', headers: { Authorization: `Bearer ${next.access_token || a.access_token}` } })
    record('sign-out accepted', out.ok, `status ${out.status}`)
    const again = await call('/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: next.refresh_token || a.refresh_token }) })
    record('sign-out revoked the session', !again.ok, `status ${again.status}`)
  }
  const known = await call('/recover', { method: 'POST', body: JSON.stringify({ email: env.QA_AUTH_EMAIL_A }) })
  const unknown = await call('/recover', { method: 'POST', body: JSON.stringify({ email: `nobody-${Date.now()}@example.test` }) })
  record('J3 recovery answers alike', known.status === unknown.status, `${known.status} / ${unknown.status}`)

  writeFileSync('auth-qa-result.json', JSON.stringify({ host: new URL(base).hostname, at: new Date().toISOString(), results }, null, 2))
  const failed = results.filter(r => !r.ok).length
  console.log(`qa-real-journeys: ${results.length - failed} passed, ${failed} failed. Then run the browser journeys of docs/release/2026-11-auth-journeys.md`)
  return failed ? 1 : 0
}

if (process.argv.includes('--self-test')) selfTest()
else {
  const stop = refusal(process.env)
  if (stop) { console.error(`refused: ${stop}`); process.exit(2) }
  process.exit(await run(process.env))
}
