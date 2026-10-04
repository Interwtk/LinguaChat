#!/usr/bin/env node
import assert from 'node:assert/strict'
import { activateLocalAccount, browserDataIsolationKeys } from './browserDataIsolation.js'

class MemoryStorage {
  constructor(entries = {}) { this.map = new Map(Object.entries(entries)) }
  get length() { return this.map.size }
  key(index) { return [...this.map.keys()][index] ?? null }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null }
  setItem(key, value) { this.map.set(String(key), String(value)) }
  removeItem(key) { this.map.delete(String(key)) }
}

const store = new MemoryStorage({
  'lc2-progress': '{"xp":10}',
  'lc2-profile': '{"name":"Guest"}',
  'lc2-auth': 'true',
  'sb-project-auth-token': 'provider-token-must-not-move',
  unrelated: 'device-value',
})

const first = activateLocalAccount(store, 'user-a')
assert.deepEqual(first, { switched: false, claimedGuestData: true })
assert.equal(store.getItem(browserDataIsolationKeys.OWNER_KEY), 'user-a')
assert.equal(store.getItem('lc2-auth'), null, 'legacy auth flag must be removed')
assert.equal(store.getItem('lc2-progress'), '{"xp":10}', 'first account claims guest progress')

const toB = activateLocalAccount(store, 'user-b')
assert.equal(toB.switched, true)
assert.equal(store.getItem('lc2-progress'), null, 'new account must not inherit previous progress')
assert.equal(store.getItem('lc2-profile'), null, 'new account must not inherit previous profile')
assert.equal(store.getItem('sb-project-auth-token'), 'provider-token-must-not-move', 'provider session storage must be untouched')
assert.equal(store.getItem('unrelated'), 'device-value', 'non-LinguaChat storage must be untouched')

store.setItem('lc2-progress', '{"xp":2}')
store.setItem('lc2-profile', '{"name":"B"}')
const backToA = activateLocalAccount(store, 'user-a')
assert.equal(backToA.switched, true)
assert.equal(store.getItem('lc2-progress'), '{"xp":10}', 'returning account restores only its own progress')
assert.equal(store.getItem('lc2-profile'), '{"name":"Guest"}', 'returning account restores its own profile')
assert.equal(store.getItem(browserDataIsolationKeys.OWNER_KEY), 'user-a')

const againA = activateLocalAccount(store, 'user-a')
assert.equal(againA.switched, false, 'same account must not churn browser storage')
assert.equal(store.getItem('lc2-progress'), '{"xp":10}')

assert.throws(() => activateLocalAccount(store, ''), /user id/i)
console.log('check-browser-data-isolation — guest claim, A→B isolation, B→A restore and provider-token preservation PASS')
