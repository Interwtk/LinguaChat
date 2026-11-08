#!/usr/bin/env node
/*
 * check-session-token — the frontend half of server-side sign-in verification.
 *
 * Off by default: no request carries a token unless VITE_AUTH_SEND_TOKEN=true.
 * On: the provider's current session token goes in one header, to our own API,
 * for the routes the backend may gate, and nowhere else. Sign-out clears it.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { authHeaders, noteSession, sendsToken } from './sessionToken.js'

let passed = 0
const check = (name, run) => { run(); passed++; console.log('  ok  ' + name) }
const ON = { VITE_AUTH_SEND_TOKEN: 'true' }

check('off by default and with any other value', () => {
  noteSession({ access_token: 'aaa.bbb.ccc' })
  for (const env of [{}, { VITE_AUTH_SEND_TOKEN: '1' }, { VITE_AUTH_SEND_TOKEN: 'TRUE' }, undefined]) assert.deepEqual(authHeaders(env || {}), {})
  assert.equal(sendsToken({}), false)
})
check('on: the current token as a bearer header', () => {
  noteSession({ access_token: 'aaa.bbb.ccc' })
  assert.deepEqual(authHeaders(ON), { Authorization: 'Bearer aaa.bbb.ccc' })
})
check('a refresh replaces it, sign-out clears it', () => {
  noteSession({ access_token: 'new.token.x' })
  assert.deepEqual(authHeaders(ON), { Authorization: 'Bearer new.token.x' })
  noteSession(null)
  assert.deepEqual(authHeaders(ON), {})
})
check('malformed sessions carry nothing', () => {
  for (const session of [{}, { access_token: 7 }, { access_token: 'x'.repeat(9000) }, 'token']) { noteSession(session); assert.deepEqual(authHeaders(ON), {}) }
})

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const auth = read('auth/emailPassword.js')
check('every session the adapter sees is noted (initial read and every event)', () => {
  assert.match(auth, /noteSession\(data\?\.session \?\? null\)/)
  assert.match(auth, /onAuthStateChange\(\(event, session\) => \{ noteSession\(session\); listener\(event, session\) \}\)/)
})
const api = read('services/api.js')
check('only the routes the backend may gate send it', () => {
  assert.equal((api.match(/\.\.\.authHeaders\(\)/g) || []).length, 3)
  assert.match(api, /premium\/status`, \{ headers: authHeaders\(\)/)
  assert.doesNotMatch(api, /learning\/evaluate`[\s\S]{0,200}authHeaders/)
})
const token = read('auth/sessionToken.js')
check('the token is never stored, logged or put in a URL', () => {
  assert.doesNotMatch(token, /localStorage|sessionStorage|console\.|indexedDB|\?token=|encodeURIComponent/)
})
console.log(`check-session-token: ${passed} passed, 0 failed (no real provider involved)`)
