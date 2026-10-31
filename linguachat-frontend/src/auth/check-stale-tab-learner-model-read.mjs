#!/usr/bin/env node
/**
 * PR #123: deterministic stale-tab READ regression for the local learner model.
 *
 * Reproduction: node src/auth/check-stale-tab-learner-model-read.mjs
 * Acceptance:   node src/auth/check-stale-tab-learner-model-read.mjs --secure
 *
 * Two simulated browser tabs share localStorage but not sessionStorage. This is
 * a module-level regression, NOT a claim of real multi-tab browser E2E.
 */
import assert from 'node:assert/strict'
import { createLearnerModel, saveLearnerModel, loadLearnerModel } from '../learning/engine/learnerModel.js'
import { activateLocalAccount, browserDataIsolationKeys } from './browserDataIsolation.js'

class MemoryStorage {
  constructor() { this.values = new Map() }
  get length() { return this.values.size }
  key(i) { return [...this.values.keys()][i] ?? null }
  getItem(k) { return this.values.get(String(k)) ?? null }
  setItem(k, v) { this.values.set(String(k), String(v)) }
  removeItem(k) { this.values.delete(String(k)) }
}

const sharedLocal = new MemoryStorage()
const tabASession = new MemoryStorage()
const tabBSession = new MemoryStorage()
globalThis.localStorage = sharedLocal

// Tab A authenticates, saves A's evidence and remains open.
globalThis.sessionStorage = tabASession
assert.equal(activateLocalAccount(sharedLocal, 'account-A').claimedGuestData, true)
const modelA = createLearnerModel()
modelA.signalLog = ['A-only-evidence']
saveLearnerModel(modelA)

// Tab B changes the active local owner and saves its independent evidence.
globalThis.sessionStorage = tabBSession
assert.equal(activateLocalAccount(sharedLocal, 'account-B').switched, true)
const modelB = createLearnerModel()
modelB.signalLog = ['B-only-evidence']
saveLearnerModel(modelB)
assert.deepEqual(loadLearnerModel().signalLog, ['B-only-evidence'])
const before = sharedLocal.getItem('lc2-learner-model-v1')

// Stale tab A calls the ordinary reader without re-authenticating. It must
// never receive B's active model. Returning an empty model is acceptable.
globalThis.sessionStorage = tabASession
const staleRead = loadLearnerModel()
assert.equal(sharedLocal.getItem(browserDataIsolationKeys.OWNER_KEY), 'account-B')
assert.equal(sharedLocal.getItem('lc2-learner-model-v1'), before, 'A stale read must not mutate B storage')
assert.deepEqual(modelA.signalLog, ['A-only-evidence'], 'A memory must not change during a read')

if (process.argv.includes('--secure')) {
  assert.equal(staleRead.signalLog.includes('B-only-evidence'), false,
    'Stale tab A must not read B learner evidence')
  console.log('PASS: stale tab A cannot read B learner evidence')
} else {
  assert.equal(staleRead.signalLog.includes('B-only-evidence'), true,
    'Baseline should reproduce the cross-account stale-tab read')
  console.log('REPRODUCED: stale tab A read active B learner evidence')
}

// A deliberate authenticated return to A must still recover A's own cache.
assert.equal(activateLocalAccount(sharedLocal, 'account-A').switched, true)
assert.deepEqual(loadLearnerModel().signalLog, ['A-only-evidence'])
console.log('PASS: returning to account A restores only A evidence')
