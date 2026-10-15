#!/usr/bin/env node
/**
 * PR #123 — A→B→A stale-tab rollback reproduction.
 * Run: node src/auth/check-stale-tab-aba-progress-rollback.mjs
 * Acceptance after a fix: append --secure. Simulated shared localStorage;
 * not a browser E2E test and not a proof of transaction atomicity.
 */
import assert from 'node:assert/strict'
import { captureLearnerAccess } from './localLease.js'
import { activateLocalAccount, browserDataIsolationKeys } from './browserDataIsolation.js'

class MemoryStorage {
  constructor() { this.values = new Map() }
  get length() { return this.values.size }
  key(i) { return [...this.values.keys()][i] ?? null }
  getItem(key) { return this.values.get(String(key)) ?? null }
  setItem(key, value) { this.values.set(String(key), String(value)) }
  removeItem(key) { this.values.delete(String(key)) }
}

const shared = new MemoryStorage()
const profileKey = 'lc2-profile'
const readProfile = () => JSON.parse(shared.getItem(profileKey) || 'null')
const saveProfile = profile => shared.setItem(profileKey, JSON.stringify(profile))

assert.equal(activateLocalAccount(shared, 'A').claimedGuestData, true)
saveProfile({ user: 'A', revision: 1 })
const staleA = structuredClone(readProfile())
const staleAccess = captureLearnerAccess(shared)
assert.equal(activateLocalAccount(shared, 'B').switched, true)
saveProfile({ user: 'B', revision: 1 })
assert.equal(activateLocalAccount(shared, 'A').switched, true)
saveProfile({ user: 'A', revision: 2 })
const before = shared.getItem(profileKey)
assert.equal(shared.getItem(browserDataIsolationKeys.OWNER_KEY), 'A')

// An owner-only guard accepts a stale A snapshot after A→B→A.
if (process.argv.includes('--secure')) {
  assert.equal(staleAccess.setItem(profileKey, JSON.stringify(staleA)), false)
} else if (shared.getItem(browserDataIsolationKeys.OWNER_KEY) === staleA.user) {
  saveProfile(staleA)
}
const after = shared.getItem(profileKey)
if (process.argv.includes('--secure')) {
  assert.equal(after, before, 'Stale tab must not roll back newer A progress')
  console.log('PASS: stale A write rejected after A→B→A')
} else {
  assert.deepEqual(readProfile(), staleA)
  console.log('REPRODUCED: owner-only check permits A→B→A progress rollback')
}

assert.equal(activateLocalAccount(shared, 'B').switched, true)
assert.deepEqual(readProfile(), { user: 'B', revision: 1 })
console.log('PASS: B cached progress remains separate; no real browser E2E')
