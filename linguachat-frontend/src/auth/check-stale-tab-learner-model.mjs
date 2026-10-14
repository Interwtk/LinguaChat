#!/usr/bin/env node
/**
 * PR #123: deterministic stale-tab learner-model regression.
 * Baseline: node src/auth/check-stale-tab-learner-model.mjs
 * Acceptance: node src/auth/check-stale-tab-learner-model.mjs --secure
 *
 * Simulates two tabs sharing one localStorage. Does not claim browser E2E.
 */
import assert from 'node:assert/strict'
import { createLearnerModel, saveLearnerModel, loadLearnerModel } from '../learning/engine/learnerModel.js'
import { activateLocalAccount, browserDataIsolationKeys } from './browserDataIsolation.js'

class SharedStorage {
  constructor() { this.values = new Map() }
  get length() { return this.values.size }
  key(i) { return [...this.values.keys()][i] ?? null }
  getItem(k) { return this.values.get(String(k)) ?? null }
  setItem(k, v) { this.values.set(String(k), String(v)) }
  removeItem(k) { this.values.delete(String(k)) }
}

globalThis.localStorage = new SharedStorage()
const modelKey = 'lc2-learner-model-v1'
const a = createLearnerModel()
a.signalLog = ['account-A-event']
assert.equal(activateLocalAccount(localStorage, 'A').claimedGuestData, true)
saveLearnerModel(a)

const b = createLearnerModel()
b.signalLog = ['account-B-event']
assert.equal(activateLocalAccount(localStorage, 'B').switched, true)
saveLearnerModel(b)
const before = localStorage.getItem(modelKey)
assert.deepEqual(loadLearnerModel().signalLog, ['account-B-event'])

// A still holds a stale model and writes after B became the active owner.
saveLearnerModel(a)
const after = localStorage.getItem(modelKey)
const actual = loadLearnerModel()
assert.equal(localStorage.getItem(browserDataIsolationKeys.OWNER_KEY), 'B')

if (process.argv.includes('--secure')) {
  assert.equal(after, before, 'Stale A must not alter B model')
  assert.deepEqual(actual.signalLog, ['account-B-event'])
  assert.deepEqual(a.signalLog, ['account-A-event'], 'Stale A memory must remain isolated')
  console.log('PASS: stale tab cannot contaminate another account')
} else {
  assert.equal(actual.signalLog.includes('account-A-event'), true, 'Expected baseline contamination')
  assert.equal(a.signalLog.includes('account-B-event'), true, 'Expected baseline in-memory contamination')
  console.log('REPRODUCED: stale A write contaminated active B learner model')
}
