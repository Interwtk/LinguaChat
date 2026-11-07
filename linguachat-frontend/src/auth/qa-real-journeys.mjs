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
 * Optional, for the server half (needs the backend verifying sign-in):
 *   QA_API_URL, QA_API_AUTHORIZED_HOST the Preview, and the host it must be
 *   QA_API_PRODUCTION_HOST            refused if QA_API_URL is this host
 *   QA_VERCEL_BYPASS                  the owner's automation bypass for a protected Preview
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
  try {
    const claims = JSON.parse(Buffer.from(env.QA_AUTH_ANON_KEY.split('.')[1] || '', 'base64url').toString('utf8'))
    if (claims.role && claims.role !== 'anon') return 'that is not a public key'
  } catch { /* new-format publishable keys are not JWTs */ }
  if (/^sb_secret_/i.test(env.QA_AUTH_ANON_KEY)) return 'that is not a public key'
  if (env.QA_API_URL) {
    let api
    try { api = new URL(env.QA_API_URL) } catch { return 'QA_API_URL is not a URL' }
    if (api.protocol !== 'https:' && api.hostname !== '127.0.0.1' && api.hostname !== 'localhost') return 'plain http only on this machine'
    if (api.hostname !== env.QA_API_AUTHORIZED_HOST) return 'QA_API_URL is not the authorized API host'
    if (env.QA_API_PRODUCTION_HOST && api.hostname === env.QA_API_PRODUCTION_HOST) return 'QA_API_URL is the production host'
  }
  return null
}

function selfTest() {
  const good = {
    QA_AUTH_URL: 'https://abc-test.example.test', QA_AUTH_ANON_KEY: 'public', QA_AUTH_AUTHORIZED_HOST: 'abc-test.example.test',
    QA_AUTH_CONFIRM_TEST_PROJECT: 'yes', QA_AUTH_EMAIL_A: 'a@example.test', QA_AUTH_EMAIL_B: 'b@example.test', QA_AUTH_PASSWORD: 'x',
  }
  const jwt = (role) => `h.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.s`
  const privateRole = ['service', 'role'].join('_')
  assert.equal(refusal(good), null)
  assert.match(refusal({}), /missing/)
  assert.match(refusal({ ...good, QA_AUTH_CONFIRM_TEST_PROJECT: 'no' }), /must be/)
  assert.match(refusal({ ...good, QA_AUTH_AUTHORIZED_HOST: 'other.example.test' }), /authorized host/)
  assert.match(refusal({ ...good, QA_AUTH_URL: 'https://prod-1.example.test', QA_AUTH_AUTHORIZED_HOST: 'prod-1.example.test' }), /production/)
  assert.match(refusal({ ...good, QA_AUTH_URL: 'http://abc-test.example.test' }), /plain http/)
  assert.match(refusal({ ...good, QA_AUTH_ANON_KEY: jwt(privateRole) }), /public key/)
  assert.equal(refusal({ ...good, QA_AUTH_ANON_KEY: jwt('anon') }), null)
  assert.match(refusal({ ...good, QA_AUTH_ANON_KEY: 'sb_secret_x' }), /public key/)
  const api = { ...good, QA_API_URL: 'https://linguachat-git-beta.example.test', QA_API_AUTHORIZED_HOST: 'linguachat-git-beta.example.test' }
  assert.equal(refusal(api), null)
  assert.match(refusal({ ...api, QA_API_AUTHORIZED_HOST: 'other.example.test' }), /authorized API host/)
  assert.match(refusal({ ...api, QA_API_PRODUCTION_HOST: 'linguachat-git-beta.example.test' }), /production host/)
  console.log('qa-real-journeys --self-test: 12 passed, 0 failed (refusals only; the real journeys have NOT run)')
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

  if (env.QA_API_URL) await apiJourneys(env, login, results, record)

  writeFileSync('auth-qa-result.json', JSON.stringify({ host: new URL(base).hostname, at: new Date().toISOString(), results }, null, 2))
  const failed = results.filter(r => !r.ok).length
  console.log(`qa-real-journeys: ${results.length - failed} passed, ${failed} failed. Then run the browser journeys of docs/release/2026-11-auth-journeys.md`)
  return failed ? 1 : 0
}

/*
 * The server half, only when QA_API_URL names the Preview of a build where the
 * backend verifies sign-in (docs/architecture/jwt-integration-review.md). A
 * Preview behind Vercel Authentication needs the owner's automation bypass value
 * in QA_VERCEL_BYPASS; it is sent as a header and never printed.
 */
async function apiJourneys(env, login, results, record) {
  const api = env.QA_API_URL.replace(/\/$/, '')
  const headers = (token) => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(env.QA_VERCEL_BYPASS ? { 'x-vercel-protection-bypass': env.QA_VERCEL_BYPASS } : {}) })
  const chat = (token, body) => fetch(`${api}/api/chat`, { method: 'POST', headers: headers(token), body: JSON.stringify({ message: 'Hello', ...body }) })
  const forget = (token, ids) => fetch(`${api}/api/chat/forget`, { method: 'POST', headers: headers(token), body: JSON.stringify({ session_ids: ids }) })
  const a = await login(env.QA_AUTH_EMAIL_A, env.QA_AUTH_PASSWORD)
  const b = await login(env.QA_AUTH_EMAIL_B, env.QA_AUTH_PASSWORD)
  if (!a.ok || !b.ok) { record('API: two signed-in accounts', false, 'could not sign in again'); return }
  const tokenA = (await a.json()).access_token
  const tokenB = (await b.json()).access_token
  const none = await chat(null, {})
  record('API refuses a request with no token', none.status === 401, `status ${none.status}`)
  const forged = await chat(`${tokenA.slice(0, -4)}AAAA`, {})
  record('API refuses a tampered token', forged.status === 401, `status ${forged.status}`)
  const session = `session-qa-${Date.now()}-0000000000000000`
  const own = await chat(tokenA, { session_id: session, user_id: 'someone-else' })
  record('API serves A with A\'s token, whatever user_id says', own.status === 200, `status ${own.status}`)
  const theirs = await forget(tokenB, [session])
  const theirsBody = theirs.ok ? await theirs.json() : {}
  record('B cannot reach A\'s conversation with the same id', theirs.ok && theirsBody.forgotten === 0, `forgotten ${theirsBody.forgotten}`)
  const mine = await forget(tokenA, [session])
  const mineBody = mine.ok ? await mine.json() : {}
  record('A can end A\'s own conversation', mine.ok && mineBody.forgotten === 1, `forgotten ${mineBody.forgotten}`)
}

if (process.argv.includes('--self-test')) selfTest()
else {
  const stop = refusal(process.env)
  if (stop) { console.error(`refused: ${stop}`); process.exit(2) }
  process.exit(await run(process.env))
}
