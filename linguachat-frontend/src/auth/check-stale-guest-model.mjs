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

// Serialization/cloning erases WeakMap provenance. Missing provenance must
// deny an authenticated save rather than silently adopting the current user.
const aSnapshot = loadLearnerModel()
const clones = [structuredClone(aSnapshot), JSON.parse(JSON.stringify(aSnapshot)), { ...aSnapshot }]
activateLocalAccount(shared, 'account-B')
const b = loadLearnerModel()
b.signalLog = ['B-only']
saveLearnerModel(b)
for (const clone of clones) {
  const oldSignals = [...clone.signalLog]
  saveLearnerModel(clone)
  assert.deepEqual(loadLearnerModel().signalLog, ['B-only'], 'Unbound A clone cannot write to B')
  assert.deepEqual(clone.signalLog, oldSignals, 'Rejected A clone cannot merge B evidence into memory')
}
activateLocalAccount(shared, 'account-A')
assert.deepEqual(loadLearnerModel().signalLog, ['account-created-model', ...before], 'A snapshot survives rejected cloned writes')
console.log('PASS: structured/JSON/shallow clones without account provenance fail closed before merging or writing')

for (let boundary = 1; boundary <= 16; boundary++) {
  const storage = globalThis.localStorage = new Store()
  globalThis.sessionStorage = new Store()
  activateLocalAccount(storage, 'A')
  const first = createLearnerModel(); first.signalLog = ['A']; saveLearnerModel(first)
  activateLocalAccount(storage, 'B')
  const second = createLearnerModel(); second.signalLog = ['B']; saveLearnerModel(second)
  activateLocalAccount(storage, 'A')
  const pending = loadLearnerModel()
  pending.signalLog.push('A-late')
  const get = storage.getItem.bind(storage)
  let count = 0, switched = false
  storage.getItem = key => {
    if (key === 'lc2-auth-owner-id' && ++count === boundary) {
      switched = true
      activateLocalAccount(storage, 'B')
    }
    return get(key)
  }
  saveLearnerModel(pending)
  storage.getItem = get
  if (switched) {
    assert.deepEqual(loadLearnerModel().signalLog, ['B'], `Ownership changed during save boundary ${boundary}`)
    assert.ok(!pending.signalLog.includes('B'), `No B read into A memory at boundary ${boundary}`)
  }
}
console.log('PASS: ownership changes during learner-model save cannot rebind the pending object or read/write the next account')

for (let boundary = 2; boundary <= 16; boundary++) {
  const storage = globalThis.localStorage = new Store()
  globalThis.sessionStorage = new Store()
  activateLocalAccount(storage, 'A')
  const first = createLearnerModel(); first.signalLog = ['A']; saveLearnerModel(first)
  activateLocalAccount(storage, 'B')
  const second = createLearnerModel(); second.signalLog = ['B']; saveLearnerModel(second)
  activateLocalAccount(storage, 'A')
  const get = storage.getItem.bind(storage)
  let count = 0, switched = false
  storage.getItem = key => {
    if (key === 'lc2-auth-owner-id' && ++count === boundary) {
      switched = true
      activateLocalAccount(storage, 'B')
    }
    return get(key)
  }
  const pending = loadLearnerModel()
  storage.getItem = get
  if (switched) {
    assert.ok(!pending.signalLog.includes('B'), `Old load cannot acquire B evidence at boundary ${boundary}`)
    pending.signalLog.push('late-loaded-A')
    saveLearnerModel(pending)
    assert.deepEqual(loadLearnerModel().signalLog, ['B'], `Old load cannot rebind to B at boundary ${boundary}`)
  }
}
console.log('PASS: model load retains the same captured lease through read, migration and object binding')
