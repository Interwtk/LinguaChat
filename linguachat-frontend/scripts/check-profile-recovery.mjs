#!/usr/bin/env node
/*
 * P0-2 — a damaged local profile must not lock the learner out.
 *
 * Signing in restores the learner's profile from this browser through the
 * strict `readVerifiedProfile`. Before this check existed, any failure there —
 * corrupt JSON, a missing level, an inconsistent placement, a denied read or a
 * lease that changed mid-restore — was reported as "browser storage is full",
 * left the provider session signed in and repeated on every reload and login,
 * with no way out inside the app.
 *
 * These scenarios drive the real lease, storage and restore modules against a
 * shared in-memory localStorage. They assert what the learner gets (restored,
 * recovered into setup, or a precise error), that the original bytes are kept,
 * that nothing outside the profile changes, and that nothing reaches another
 * account. No network, no Supabase.
 *
 * Run: node scripts/check-profile-recovery.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import * as restoreModule from '../src/auth/profileRestore.js'
import { activateLocalAccount } from '../src/auth/browserDataIsolation.js'
import { captureLearnerAccess } from '../src/auth/localLease.js'

const here = dirname(fileURLToPath(import.meta.url))
const read = path => readFileSync(resolve(here, '..', path), 'utf8')

// What AppContext did before: the strict reader, and "storage_full" for any throw.
function restore(access) {
  if (restoreModule.restoreProfile) return restoreModule.restoreProfile(access)
  try { return { status: 'restored', profile: restoreModule.readVerifiedProfile(access) } }
  catch { return { status: 'storage_full' } }
}

class Store {
  constructor() { this.values = new Map(); this.onSet = null; this.onGet = null }
  get length() { return this.values.size }
  key(i) { return [...this.values.keys()][i] ?? null }
  getItem(k) { this.onGet?.(String(k)); return this.values.has(String(k)) ? this.values.get(String(k)) : null }
  setItem(k, v) { this.onSet?.(String(k)); this.values.set(String(k), String(v)) }
  removeItem(k) { this.onSet?.(String(k)); this.values.delete(String(k)) }
}
const quota = () => Object.assign(new Error('The quota has been exceeded.'), { name: 'QuotaExceededError' })
const denied = () => Object.assign(new Error('The operation is insecure.'), { name: 'SecurityError' })

const A1 = { level: 'A1', strengths: ['greetings'], focusAreas: ['numbers'] }
const OTHER_DATA = {
  'lc2-local-progress': '{"version":2,"epoch":{"id":"initial","at":0},"base":{"snapshot":{"xp":455,"streak":6},"startedAt":1,"foldedBefore":0,"folded":0},"events":[]}',
  'lc2-tutor-preferences': '{"correctionStyle":"gentle","pace":"calm"}',
  'lc2-learner-model-v1': '{"version":1,"languageItems":{"hello":{"learningState":"can_use"}}}',
  'lc2-native-language': 'es',
}

let passed = 0
const failures = []
function scenario(name, run) {
  try { run(); passed++; console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}

// One signed-in tab of account `owner`, with `values` already in its storage.
function signedIn(values, owner = 'A', shared = new Store()) {
  globalThis.localStorage = shared
  globalThis.sessionStorage = new Store()
  activateLocalAccount(shared, owner)
  const access = captureLearnerAccess(shared)
  for (const [key, value] of Object.entries({ ...OTHER_DATA, ...values })) access.setItem(key, value)
  return { shared, access }
}
const quarantined = (access, shared) => [...shared.values.entries()]
  .filter(([key]) => key.includes(':lc2-quarantine:lc2-profile:'))
  .map(([, value]) => JSON.parse(value))
function assertOtherDataUntouched(access) {
  for (const [key, value] of Object.entries(OTHER_DATA)) assert.equal(access.getItem(key), value, key + ' is untouched')
}

console.log('check-profile-recovery')

scenario('a valid profile restores exactly as before, with no writes', () => {
  const profile = { name: 'Ana', goal: 'Travel', level: 'A1', placementResult: A1 }
  const { access, shared } = signedIn({ 'lc2-profile': JSON.stringify(profile), 'lc2-onboarded': 'true', 'lc2-placement-result': JSON.stringify(A1) })
  let writes = 0
  shared.onSet = () => { writes++ }
  const result = restore(access)
  assert.equal(result.status, 'restored')
  assert.deepEqual(result.profile, profile)
  assert.equal(writes, 0)
})

scenario('corrupt JSON: bytes kept, learner resumes setup, no loop on reload', () => {
  const raw = '{"name":"Ana","goal":"Trav'
  const { access, shared } = signedIn({ 'lc2-profile': raw, 'lc2-onboarded': 'true' })
  const result = restore(access)
  assert.equal(result.status, 'recovered', 'not reported as full storage')
  assert.equal(result.step, 'placement', 'no checkpoint: the learner retakes placement')
  assert.equal(result.profile?.level, undefined, 'no level is invented')
  assert.deepEqual(quarantined(access, shared).map(q => q.raw), [raw], 'the original bytes are preserved')
  assert.equal(access.getItem('lc2-onboarded'), 'false', 'Home stays closed until setup is valid again')
  assertOtherDataUntouched(access)
  const again = restore(access)
  assert.equal(again.status, 'restored', 'a reload restores instead of failing again')
  assert.equal(quarantined(access, shared).length, 1, 'repeating recovery does not duplicate the copy')
})

scenario('incomplete completed profile with a valid checkpoint resumes from the checkpoint', () => {
  const { access, shared } = signedIn({
    'lc2-profile': JSON.stringify({ name: 'Ana', goal: 'Travel' }), 'lc2-onboarded': 'true',
    'lc2-placement-result': JSON.stringify(A1), 'lc2-onboarding-step': 'tutor-personality',
  })
  const result = restore(access)
  assert.equal(result.status, 'recovered')
  assert.equal(result.step, 'tutor-personality', 'resumes at the last valid setup step')
  assert.equal(result.profile.level, 'A1', 'the level comes from the durable placement evidence')
  assert.equal(result.profile.name, 'Ana')
  assert.equal(result.profile.goal, 'Travel', 'readable choices are kept')
  assert.equal(quarantined(access, shared).length, 1)
  assertOtherDataUntouched(access)
})

scenario('an invalid level is dropped, never guessed', () => {
  const { access } = signedIn({ 'lc2-profile': JSON.stringify({ name: 'Ana', level: 'Z9' }) })
  const result = restore(access)
  assert.equal(result.status, 'recovered')
  assert.equal(result.step, 'placement')
  assert.equal(result.profile.level, undefined)
  assert.equal(result.profile.name, 'Ana')
})

scenario('an inconsistent placement without a checkpoint is re-assessed, not resolved by guessing', () => {
  const { access } = signedIn({ 'lc2-profile': JSON.stringify({ name: 'Ana', level: 'B1', placementResult: A1 }), 'lc2-onboarded': 'true' })
  const result = restore(access)
  assert.equal(result.status, 'recovered')
  assert.equal(result.step, 'placement')
  assert.equal(result.profile.level, undefined)
  assert.equal(result.profile.placementResult, undefined)
})

scenario('an invalid checkpoint is ignored, not trusted', () => {
  const { access } = signedIn({ 'lc2-profile': '[]', 'lc2-onboarded': 'true', 'lc2-placement-result': '{"level":"A1","strengths":"nope"' })
  const result = restore(access)
  assert.equal(result.status, 'recovered')
  assert.equal(result.step, 'placement')
  assert.equal(result.profile?.level, undefined)
})

scenario('a denied read is reported as unavailable storage, and nothing is written', () => {
  const { access, shared } = signedIn({ 'lc2-profile': '{bad', 'lc2-onboarded': 'true' })
  let writes = 0
  shared.onGet = key => { if (key.endsWith(':lc2-profile')) throw denied() }
  shared.onSet = () => { writes++ }
  const result = restore(access)
  assert.equal(result.status, 'storage_unavailable')
  assert.equal(writes, 0)
})

scenario('a full storage is reported as full, and the original is not replaced', () => {
  const { access, shared } = signedIn({ 'lc2-profile': '{bad', 'lc2-onboarded': 'true' })
  shared.onSet = key => { if (key.includes('lc2-quarantine:')) throw quota() }
  const result = restore(access)
  assert.equal(result.status, 'storage_full')
  shared.onSet = null
  assert.equal(access.getItem('lc2-profile'), '{bad', 'the only copy stays where it was')
  assert.equal(access.getItem('lc2-onboarded'), 'true')
})

scenario('a refused repair write is unrecoverable for now, with the copy kept', () => {
  const { access, shared } = signedIn({ 'lc2-profile': '{bad', 'lc2-onboarded': 'true' })
  shared.onSet = key => { if (key.endsWith(':lc2-onboarded')) throw denied() }
  const result = restore(access)
  assert.equal(result.status, 'unrecoverable')
  shared.onSet = null
  assert.equal(quarantined(access, shared).length, 1, 'the original bytes are preserved')
  assert.equal(access.getItem('lc2-onboarded'), 'true', 'nothing half-applied is presented as recovered')
})

scenario('an account switch during recovery stops it and never touches the other account', () => {
  const shared = new Store()
  const b = signedIn({ 'lc2-profile': JSON.stringify({ name: 'Bea', level: 'A1', placementResult: A1 }), 'lc2-onboarded': 'true' }, 'B', shared)
  const bProfile = b.access.getItem('lc2-profile')
  const a = signedIn({ 'lc2-profile': '{bad', 'lc2-onboarded': 'true' }, 'A', shared)
  let switched = false
  shared.onSet = key => {
    if (!switched && key.includes('lc2-quarantine:')) {
      switched = true
      shared.onSet = null
      globalThis.sessionStorage = new Store()
      activateLocalAccount(shared, 'B')
    }
  }
  const result = restore(a.access)
  assert.equal(result.status, 'stale')
  // The switch rotates B's generation, so compare B's data, not physical keys.
  const bNow = captureLearnerAccess(shared)
  assert.equal(bNow.getItem('lc2-profile'), bProfile, "B's profile is untouched")
  assert.equal(bNow.getItem('lc2-onboarded'), 'true')
  for (const [key, value] of Object.entries(OTHER_DATA)) assert.equal(bNow.getItem(key), value, 'B is untouched: ' + key)
  assert.equal([...shared.values.keys()].some(key => key.includes(':B:') && key.includes('lc2-quarantine:')), false, 'no A copy lands in B')
})

scenario('a lease that is already stale restores nothing', () => {
  const { access } = signedIn({ 'lc2-profile': '{bad', 'lc2-onboarded': 'true' })
  const result = restore({ ...access, valid: () => false })
  assert.equal(result.status, 'stale')
})

scenario('the app maps each outcome to its real cause, and resumes setup after recovery', () => {
  const context = read('src/context/AppContext.jsx')
  const flow = read('src/components/auth/AuthFlow.jsx')
  assert.match(context, /restoreProfile\(captureLearnerAccess\(\)\)/, 'sign-in restores through the recovering reader')
  assert.doesNotMatch(context, /readVerifiedProfile\(captureLearnerAccess\(\)\)\s*\}\s*catch\s*\{\s*setAuthProviderError\('storage_full'\)/,
    'a profile problem is no longer reported as full storage')
  for (const code of ['storage_unavailable', 'local_data_unreadable']) {
    assert.match(context, new RegExp(`'${code}'`), code + ' is reported')
    assert.match(flow, new RegExp(`'${code}'`), code + ' is translated on the entry screen')
  }
})

console.log(`\ncheck-profile-recovery — ${passed} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
