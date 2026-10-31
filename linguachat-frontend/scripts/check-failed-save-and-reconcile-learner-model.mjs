#!/usr/bin/env node
// Deterministic storage-failure regression; not a real-browser E2E test.
import assert from 'node:assert/strict'
import { createLearnerModel, loadLearnerModel, saveLearnerModel } from '../src/learning/engine/learnerModel.js'
import { activateLocalAccount } from '../src/auth/browserDataIsolation.js'

class StorageStub {
  constructor() { this.data = new Map(); this.rejectLearnerWrites = false; this.mismatchLearnerReads = false }
  get length() { return this.data.size }
  key(i) { return [...this.data.keys()][i] ?? null }
  getItem(k) {
    if (this.mismatchLearnerReads && String(k).endsWith(':lc2-learner-model-v1')) return 'mismatched-readback'
    return this.data.get(String(k)) ?? null
  }
  setItem(k, v) {
    if (this.rejectLearnerWrites && String(k).endsWith(':lc2-learner-model-v1')) {
      throw new Error('QuotaExceededError (simulated)')
    }
    this.data.set(String(k), String(v))
  }
  removeItem(k) { this.data.delete(String(k)) }
}

const store = new StorageStub()
globalThis.localStorage = store
globalThis.sessionStorage = new StorageStub()
const activation = activateLocalAccount(store, 'account-A')
assert.equal(activation.blocked, undefined, 'Account activation must succeed')
assert.equal(activation.claimedGuestData, true)

const saved = createLearnerModel()
saved.signalLog = ['already-saved']
saved.levelMilestones = {
  pre_a1: { graduatedAt: '2026-10-01T12:00:00.000Z', evidenceVersion: 'v1', source: 'assessment' },
}
saved.teachingHistory = [
  { id: 'stored-instruction', capability: 'listening', format: 'listening', session: 'day-1', at: 1000, success: null },
]
assert.equal(saveLearnerModel(saved), saved, 'Legacy save keeps its model return contract')
assert.deepEqual(loadLearnerModel().signalLog, ['already-saved'])

const pending = createLearnerModel()
pending.signalLog = ['unsaved-only']
pending.teachingHistory = [
  { id: 'pending-probe', capability: 'listening', format: 'reading', session: 'day-2', at: 2000, success: true },
]
const original = structuredClone(pending)
const durableBefore = loadLearnerModel()
store.rejectLearnerWrites = true
try {
  assert.equal(saveLearnerModel(pending, { verified: true }), false,
    'Rejected durable writes must not report success to reward paths')
} finally { store.rejectLearnerWrites = false }
assert.deepEqual(pending, original,
  'Failed persistence must not merge stored evidence or milestones into caller memory')
assert.deepEqual(loadLearnerModel(), durableBefore,
  'Failed persistence must not change durable learner state')

assert.equal(saveLearnerModel(pending, { verified: true }), true,
  'Verified retry must acknowledge persisted evidence')
assert.deepEqual(loadLearnerModel().signalLog, ['unsaved-only', 'already-saved'],
  'Retry must preserve both independent evidence sources')
assert.deepEqual(pending.signalLog, ['unsaved-only', 'already-saved'],
  'Successful retry must reconcile caller memory with persisted evidence')
assert.deepEqual(pending.levelMilestones, saved.levelMilestones,
  'Successful merge must also reconcile earned milestones in memory')
assert.deepEqual(pending.teachingHistory.map(x => x.id), ['stored-instruction', 'pending-probe'],
  'Successful merge must reconcile teaching history in caller memory, not only on disk')
assert.deepEqual(loadLearnerModel().teachingHistory.map(x => x.id), ['stored-instruction', 'pending-probe'],
  'Successful merge must preserve teaching history durably')
const mismatch = createLearnerModel()
mismatch.signalLog = ['readback-unconfirmed']
const beforeMismatch = structuredClone(mismatch)
store.mismatchLearnerReads = true
try {
  assert.equal(saveLearnerModel(mismatch, { verified: true }), false,
    'Mismatched storage readback cannot confirm a learner-model reward')
} finally { store.mismatchLearnerReads = false }
assert.deepEqual(mismatch, beforeMismatch,
  'Unverified readback must not publish merged data to the caller')
console.log('PASS: verified learner-model saves reject failed/mismatched writes; retry preserves evidence')
