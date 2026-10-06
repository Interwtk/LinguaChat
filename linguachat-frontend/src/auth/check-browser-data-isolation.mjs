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

class QuotaStorage extends MemoryStorage {
  constructor(entries = {}) {
    super(entries)
    this.maxBytes = Number.POSITIVE_INFINITY
  }
  usageWith(key, value) {
    const next = new Map(this.map)
    next.set(String(key), String(value))
    return [...next.entries()].reduce((sum, [k, v]) => sum + k.length + v.length, 0)
  }
  usage() {
    return [...this.map.entries()].reduce((sum, [k, v]) => sum + k.length + v.length, 0)
  }
  setItem(key, value) {
    if (this.usageWith(key, value) > this.maxBytes) {
      const error = new Error('Quota exceeded')
      error.name = 'QuotaExceededError'
      throw error
    }
    super.setItem(key, value)
  }
}

class FailingCacheStorage extends MemoryStorage {
  setItem(key, value) {
    if (String(key).startsWith(browserDataIsolationKeys.CACHE_PREFIX)) {
      const error = new Error('Cache write failed')
      error.name = 'QuotaExceededError'
      throw error
    }
    super.setItem(key, value)
  }
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

const large = 'x'.repeat(1400)
const quotaStore = new QuotaStorage({
  'lc2-progress': large,
  'lc2-profile': large,
  'sb-project-auth-token': 'provider-token',
})
activateLocalAccount(quotaStore, 'quota-a')
quotaStore.maxBytes = quotaStore.usage() + 300
const quotaSwitch = activateLocalAccount(quotaStore, 'quota-b')
assert.equal(quotaSwitch.switched, true, 'switch must move active data before caching instead of duplicating it')
assert.equal(quotaStore.getItem('lc2-progress'), null, 'new account must not inherit quota-a progress')
activateLocalAccount(quotaStore, 'quota-a')
assert.equal(quotaStore.getItem('lc2-progress'), large, 'quota-safe snapshot must restore previous progress')

const firstLoginQuotaStore = new QuotaStorage({
  'lc2-progress': '{"xp":7}',
})
firstLoginQuotaStore.maxBytes = firstLoginQuotaStore.usage()
const blockedGuestClaim = activateLocalAccount(firstLoginQuotaStore, 'quota-first-user')
assert.equal(blockedGuestClaim.blocked, true, 'first login owner write must fail closed when storage quota is exhausted')
assert.equal(firstLoginQuotaStore.getItem(browserDataIsolationKeys.OWNER_KEY), null, 'failed first-login claim must not assign a local owner')
assert.equal(firstLoginQuotaStore.getItem('lc2-progress'), '{"xp":7}', 'failed first-login claim must preserve guest progress')

const failingStore = new FailingCacheStorage({ 'lc2-progress': '{"xp":99}' })
activateLocalAccount(failingStore, 'safe-a')
const blocked = activateLocalAccount(failingStore, 'safe-b')
assert.equal(blocked.blocked, true, 'unrecoverable cache writes must fail closed')
assert.equal(failingStore.getItem(browserDataIsolationKeys.OWNER_KEY), 'safe-a', 'failed switch must keep the previous local owner')
assert.equal(failingStore.getItem('lc2-progress'), '{"xp":99}', 'failed switch must restore the previous active dataset')

console.log('check-browser-data-isolation — guest claim, first-login quota failure, account isolation, quota-safe moves, rollback and provider-token preservation PASS')

// The owner write can fail AFTER snapshots fit. A must never see B's dataset.
{
  const k = browserDataIsolationKeys
  const s = new MemoryStorage({
    [k.OWNER_KEY]: 'A', 'lc2-progress': 'progress-A',
    [k.CACHE_PREFIX + 'B']: JSON.stringify({ 'lc2-progress': 'progress-B' }),
  })
  const set = s.setItem.bind(s)
  s.setItem = (key, value) => {
    if (key === k.OWNER_KEY && value === 'B') throw Error('owner quota')
    set(key, value)
  }
  assert.equal(activateLocalAccount(s, 'B').blocked, true)
  assert.equal(s.getItem(k.OWNER_KEY), 'A')
  assert.equal(s.getItem('lc2-progress'), 'progress-A')
  assert.equal(JSON.parse(s.getItem(k.CACHE_PREFIX + 'B'))['lc2-progress'], 'progress-B')
  assert.equal(activateLocalAccount(s, 'A').switched, false)
  assert.equal(s.getItem('lc2-progress'), 'progress-A')
}

// A second failure during rollback keeps both accounts durable and isolated.
{
  const k = browserDataIsolationKeys
  const s = new MemoryStorage({
    [k.OWNER_KEY]: 'A', 'lc2-progress': 'progress-A',
    [k.CACHE_PREFIX + 'B']: JSON.stringify({ 'lc2-progress': 'progress-B' }),
  })
  const set = s.setItem.bind(s)
  let failing = true
  s.setItem = (key, value) => {
    if (failing && ((key === 'lc2-progress' && value === 'progress-B') || (key === k.OWNER_KEY && value === 'A'))) throw Error('restore quota')
    set(key, value)
  }
  assert.equal(activateLocalAccount(s, 'B').blocked, true)
  assert.equal(s.getItem('lc2-progress'), null)
  failing = false
  activateLocalAccount(s, 'A')
  assert.equal(s.getItem('lc2-progress'), 'progress-A')
  activateLocalAccount(s, 'B')
  assert.equal(s.getItem('lc2-progress'), 'progress-B')
}
console.log('account transition: owner-write failure and double rollback failure preserve A/B snapshots PASS')
