#!/usr/bin/env node
// Deterministic storage-failure regression; not a real-browser E2E test.
import assert from 'node:assert/strict'
import { createLearnerModel, loadLearnerModel, saveLearnerModel } from '../src/learning/engine/learnerModel.js'
import { activateLocalAccount } from '../src/auth/browserDataIsolation.js'

class StorageStub {
  constructor() { this.data = new Map(); this.rejectLearnerWrites = false }
  get length() { return this.data.size }
  key(i) { return [...this.data.keys()][i] ?? null }
  getItem(k) { return this.data.get(String(k)) ?? null }
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
saveLearnerModel(saved)
assert.deepEqual(loadLearnerModel().signalLog, ['already-saved'])

const pending = createLearnerModel()
pending.signalLog = ['unsaved-only']
pending.teachingHistory = [
  { id: 'pending-probe', capability: 'listening', format: 'reading', session: 'day-2', at: 2000, success: true },
]
const original = structuredClone(pending)
const durableBefore = loadLearnerModel()
store.rejectLearnerWrites = true
try { saveLearnerModel(pending) } finally { store.rejectLearnerWrites = false }
assert.deepEqual(pending, original,
  'Failed persistence must not merge stored evidence or milestones into caller memory')
assert.deepEqual(loadLearnerModel(), durableBefore,
  'Failed persistence must not change durable learner state')

saveLearnerModel(pending)
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
console.log('PASS: failed write is non-mutating; successful retry preserves evidence, milestones and teaching history')
