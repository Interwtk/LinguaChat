#!/usr/bin/env node
/**
 * A model created before signup belongs to the guest lease. First-login
 * claiming preserves its saved evidence, but late guest callbacks cannot
 * overwrite or merge into the authenticated account's newer model.
 * Deterministic Storage simulation; not a browser E2E test.
 */
import assert from 'node:assert/strict'
import { createLearnerModel, loadLearnerModel, saveLearnerModel } from '../learning/engine/learnerModel.js'
import { activateLocalAccount } from './browserDataIsolation.js'

class Store {
  constructor() { this.values = new Map() }
  get length() { return this.values.size }
  key(index) { return [...this.values.keys()][index] ?? null }
  getItem(key) { return this.values.get(String(key)) ?? null }
  setItem(key, value) { this.values.set(String(key), String(value)) }
  removeItem(key) { this.values.delete(String(key)) }
}

const shared = globalThis.localStorage = new Store()
globalThis.sessionStorage = new Store()
const guest = createLearnerModel()
guest.signalLog = ['guest-before-claim']
saveLearnerModel(guest)
assert.deepEqual(loadLearnerModel().signalLog, ['guest-before-claim'])

assert.equal(activateLocalAccount(shared, 'account-A').claimedGuestData, true)
const account = loadLearnerModel()
assert.deepEqual(account.signalLog, ['guest-before-claim'], 'First login must preserve saved guest evidence')
account.signalLog.push('account-after-claim')
saveLearnerModel(account)
const before = structuredClone(loadLearnerModel().signalLog)
assert.deepEqual(before, ['guest-before-claim', 'account-after-claim'])

guest.signalLog.push('late-guest-callback')
saveLearnerModel(guest)
assert.deepEqual(loadLearnerModel().signalLog, before, 'Old guest object must not write after account claim')
assert.deepEqual(guest.signalLog, ['guest-before-claim', 'late-guest-callback'], 'Rejected save must not merge account evidence into guest memory')

const fresh = createLearnerModel()
fresh.signalLog = ['account-created-model']
saveLearnerModel(fresh)
assert.deepEqual(loadLearnerModel().signalLog, ['account-created-model', ...before], 'New account models must remain writable')
console.log('PASS: first-login guest progress preserved, stale guest write fenced, new account model writable')
