import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readSetupCheckpoint, persistPlacementResult, SETUP_STEPS } from '../src/auth/setupCheckpoint.js'
import { readVerifiedProfile } from '../src/auth/profileRestore.js'
import { commitOnboarding } from '../src/auth/onboardingCommit.js'
const values=new Map(),store={getItem:k=>values.get(k)??null}
assert.equal(readSetupCheckpoint(store).step,'placement')
values.set('lc2-placement-result',JSON.stringify({level:'A1',strengths:['hello']}))
assert.equal(readSetupCheckpoint(store).step,'setup-choice')
for(const step of SETUP_STEPS){values.set('lc2-onboarding-step',step);assert.equal(readSetupCheckpoint(store).step,step)}
for(const step of ['reset','confirmed','entry']){values.set('lc2-onboarding-step',step);assert.equal(readSetupCheckpoint(store).step,'setup-choice')}
for (const invalid of [
  { level: 'A1', strengths: 'wrong' },
  { level: 'A1', focusAreas: [42] },
  { level: 'Z9' },
]) {
  values.set('lc2-placement-result', JSON.stringify(invalid))
  assert.equal(readSetupCheckpoint(store).step, 'placement')
}
values.set('lc2-placement-result','{');assert.equal(readSetupCheckpoint(store).step,'placement')
assert.equal(readSetupCheckpoint({getItem(){throw Error('blocked')}}).step,'placement')
// Placement must be durable under the same account lease before revealing a
// level. Denied, corrupted, revoked and invalid writes must not advance setup.
const placement = { level: 'A2', strengths: ['listening'], focusAreas: ['grammar'] }
const placementValues = new Map()
const placementWrites = []
const placementAccess = {
  valid: () => true,
  getItem: key => placementValues.get(key) ?? null,
  setItem: (key, value) => { placementWrites.push(key); placementValues.set(key, value); return true },
}
assert.equal(persistPlacementResult(placementAccess, placement), true)
assert.deepEqual(placementWrites, ['lc2-placement-result', 'lc2-placement'])
assert.deepEqual(JSON.parse(placementValues.get('lc2-placement-result')), placement)
assert.deepEqual(JSON.parse(placementValues.get('lc2-placement')), placement)
assert.equal(readSetupCheckpoint(placementAccess).result.level, 'A2')
const circularPlacement = { level: 'A1' }
circularPlacement.self = circularPlacement
for (const invalid of [
  { level: 'Z9' },
  { level: 'A1', strengths: [42] },
  circularPlacement,
  { level: 'A1', toJSON: () => null },
  { level: 'A1', toJSON: () => ({ level: 'Z9' }) },
]) {
  let writes = 0
  assert.throws(() => persistPlacementResult({
    valid: () => true,
    setItem: () => { writes++; return true },
  }, invalid), /Invalid placement result/)
  assert.equal(writes, 0, 'invalid placement must not touch storage')
}
for (const deniedKey of ['lc2-placement-result', 'lc2-placement']) {
  const state = new Map()
  assert.throws(() => persistPlacementResult({
    valid: () => true,
    getItem: key => state.get(key) ?? null,
    setItem: (key, value) => {
      if (key === deniedKey) return false
      state.set(key, value)
      return true
    },
  }, placement), /not durable/)
}
const corruptPlacementState = new Map()
assert.throws(() => persistPlacementResult({
  valid: () => true,
  getItem: key => key === 'lc2-placement-result' ? '{' : corruptPlacementState.get(key) ?? null,
  setItem: (key, value) => { corruptPlacementState.set(key, value); return true },
}, placement), /not durable/)
let placementLeaseValid = true
assert.throws(() => persistPlacementResult({
  valid: () => placementLeaseValid,
  getItem: () => null,
  setItem: () => { placementLeaseValid = false; return true },
}, placement), /not durable/)
assert.throws(() => persistPlacementResult({
  valid: () => false,
  setItem: () => { throw Error('stale lease wrote') },
}, placement), /not durable())

const setup=readFileSync(new URL('../src/components/setup/SetupFlow.jsx',import.meta.url),'utf8')
const context=readFileSync(new URL('../src/context/AppContext.jsx',import.meta.url),'utf8')
const provider=context.slice(context.indexOf('const applyProviderSession ='))
const profileBody=provider.match(/setProfile\(previous => \(\{([\s\S]*?)\}\)\)/)[1]
const applyIdentity=new Function('previous','user','restoredProfile',`return ({${profileBody}})`)
const savedProfile={level:'A1',goal:'Travel',placementResult:{level:'A1'},dailyGoal:15}
assert.deepEqual(applyIdentity({level:'B1',goal:'',placementResult:null},{name:'QA',email:'qa@example.test'},savedProfile),
 {...savedProfile,name:'QA',email:'qa@example.test'},'verified restore must hydrate own durable profile before identity effects persist defaults')
const ownValues=new Map([['lc2-profile',JSON.stringify(savedProfile)]])
const ownAccess={valid:()=>true,getItem:k=>ownValues.get(k)??null}
assert.deepEqual(readVerifiedProfile(ownAccess),savedProfile)
ownValues.set('lc2-profile',JSON.stringify({level:'B1',placementResult:null,goal:'Travel'}))
ownValues.set('lc2-placement-result',JSON.stringify({level:'A1',strengths:['hello']}))
assert.equal(readVerifiedProfile(ownAccess).level,'A1','recover independently saved placement after legacy default overwrite')
assert.equal(readVerifiedProfile(ownAccess).goal,'Travel')
// A partially persisted identity must not hydrate a contradictory placement.
// Recover from the account-scoped checkpoint when available; otherwise fail
// closed rather than silently accepting a different course level.
ownValues.set('lc2-profile',JSON.stringify({level:'B1',placementResult:{level:'B1'},goal:'Travel'}))
assert.equal(readVerifiedProfile(ownAccess).level,'B1')
ownValues.set('lc2-profile',JSON.stringify({level:'B1',placementResult:{level:'A1'},goal:'Travel'}))
assert.equal(readVerifiedProfile(ownAccess).level,'A1')
assert.equal(readVerifiedProfile(ownAccess).placementResult.level,'A1')
assert.equal(readVerifiedProfile(ownAccess).goal,'Travel')
// A plausible-looking level match must not bypass placement validation.
// The account-scoped verified checkpoint repairs malformed legacy evidence.
const invalidPlacements = [
  { level: 'Z9' },
  { level: 'A1', strengths: 'not-an-array' },
  { level: 'A1', focusAreas: [42] },
]
for (const invalidPlacement of invalidPlacements) {
  ownValues.set('lc2-profile',JSON.stringify({level:invalidPlacement.level,placementResult:invalidPlacement,goal:'Travel'}))
  const repaired = readVerifiedProfile(ownAccess)
  assert.equal(repaired.level,'A1')
  assert.deepEqual(repaired.placementResult,{level:'A1',strengths:['hello']})
  assert.equal(repaired.goal,'Travel')
}
ownValues.set('lc2-profile',JSON.stringify({level:'Z9',placementResult:null,goal:'Travel'}))
assert.equal(readVerifiedProfile(ownAccess).level,'A1')
// A placement checkpoint can repair a partial profile, but must never
// masquerade as the missing durable profile of a completed account.
ownValues.set('lc2-onboarded', 'true')
ownValues.delete('lc2-profile')
assert.throws(() => readVerifiedProfile(ownAccess), /Invalid completed profile placement/, 'checkpoint alone cannot replace completed profile')
ownValues.set('lc2-profile', 'null')
assert.throws(() => readVerifiedProfile(ownAccess), /Invalid completed profile placement/, 'serialized null is not a completed profile')
// A verified checkpoint alone cannot fill an absent learner level in a
// completed profile. An empty or identity-only JSON object is not durable setup.
for (const incompleteProfile of [{}, { goal: 'Travel' }, { name: 'QA' }, { placementResult: { level: 'A1' } }, { level: null, goal: 'Travel' }]) {
  ownValues.set('lc2-profile', JSON.stringify(incompleteProfile))
  assert.throws(() => readVerifiedProfile(ownAccess), /Invalid completed profile placement/, 'completed profile requires its own durable learner level')
}
ownValues.set('lc2-profile', JSON.stringify({ level: 'B1', placementResult: null, goal: 'Travel' }))
const recoveredCompleted = readVerifiedProfile(ownAccess)
assert.equal(recoveredCompleted.level, 'A1', 'existing partial profile may recover from own checkpoint')
assert.equal(recoveredCompleted.goal, 'Travel')
ownValues.delete('lc2-onboarded')
ownValues.delete('lc2-placement-result')
for (const invalidPlacement of invalidPlacements) {
  ownValues.set('lc2-profile',JSON.stringify({level:invalidPlacement.level,placementResult:invalidPlacement,goal:'Travel'}))
  assert.throws(()=>readVerifiedProfile(ownAccess),/Invalid profile placement/)
}
ownValues.set('lc2-profile',JSON.stringify({level:'Z9',placementResult:null,goal:'Travel'}))
assert.throws(()=>readVerifiedProfile(ownAccess),/Invalid profile placement/)
ownValues.set('lc2-profile',JSON.stringify({level:'B1',placementResult:{level:'A1'},goal:'Travel'}))
assert.throws(()=>readVerifiedProfile(ownAccess),/Invalid profile placement/)
ownValues.set('lc2-profile',JSON.stringify({level:'A1',placementResult:[],goal:'Travel'}))
assert.throws(()=>readVerifiedProfile(ownAccess),/Invalid profile placement/)
// A completed account must not silently open Home with only a default
// level and no verified placement, even if the legacy completion flag survived.
const unfinishedProfile = { level: 'A1', placementResult: null, goal: 'Travel' }
ownValues.set('lc2-profile', JSON.stringify(unfinishedProfile))
ownValues.set('lc2-onboarded', 'false')
assert.deepEqual(readVerifiedProfile(ownAccess), unfinishedProfile, 'unfinished setup may resume without placement')
ownValues.set('lc2-onboarded', 'true')
assert.throws(() => readVerifiedProfile(ownAccess), /Invalid completed profile placement/, 'completed setup requires verified placement')
ownValues.delete('lc2-profile')
assert.throws(() => readVerifiedProfile(ownAccess), /Invalid completed profile placement/, 'completed setup requires a durable profile')
ownValues.set('lc2-profile', JSON.stringify(savedProfile))
assert.deepEqual(readVerifiedProfile(ownAccess), savedProfile, 'completed setup with valid placement remains restorable')
ownValues.delete('lc2-onboarded')
assert.throws(()=>readVerifiedProfile({...ownAccess,valid:()=>false}),/Stale/)
let valid=true
assert.throws(()=>readVerifiedProfile({valid:()=>valid,getItem(){valid=false;return JSON.stringify(savedProfile)}}),/ownership/)
assert.throws(()=>readVerifiedProfile({valid:()=>true,getItem(){throw Error('Storage denied')}}),/Storage denied/)
ownValues.set('lc2-profile','{');assert.throws(()=>readVerifiedProfile(ownAccess))
ownValues.set('lc2-profile','[]');assert.throws(()=>readVerifiedProfile(ownAccess),/Invalid/)
assert.match(provider,/if \(!profileRestoredRef.current\)/,'token refresh must preserve unsaved in-memory profile edits after hydration')
assert.ok(provider.indexOf('if (isolation.switched || isolation.reloadRequired)') < provider.indexOf('readVerifiedProfile(captureLearnerAccess())'),'hydrate only after account activation/reload fencing')
assert.match(setup,/<button\s+type="button"\s+aria-pressed=\{isSelected\}\s+key=\{p.id\}/)
// A successful marker is meaningful only if the complete profile was written
// and read back first. Inject storage failures without a browser dependency.
const committed = new Map()
const writeOrder = []
const durableAccess = {
  valid: () => true,
  getItem: key => committed.get(key) ?? null,
  setItem: (key, value) => { writeOrder.push(key); committed.set(key, value); return true },
}
const onboardingProfile = { level: 'A1', placementResult: { level: 'A1' }, tutorPersonality: 'Gentle Guide', goal: 'Travel' }
assert.equal(commitOnboarding(durableAccess, onboardingProfile), true)
assert.deepEqual(writeOrder, ['lc2-onboarded', 'lc2-profile', 'lc2-welcome-seen', 'lc2-personalization-completed', 'lc2-onboarded'])
assert.deepEqual(JSON.parse(committed.get('lc2-profile')), onboardingProfile)
assert.equal(committed.get('lc2-onboarded'), 'true')
// Pre-A1 is a valid placed learner; the guard must not lock out the first course.
const preA1Profile = { ...onboardingProfile, level: 'Pre-A1', placementResult: { level: 'Pre-A1' } }
assert.equal(commitOnboarding(durableAccess, preA1Profile), true)
assert.deepEqual(JSON.parse(committed.get('lc2-profile')), preA1Profile)
// Invalid or non-object serialized profiles must not destroy an earlier
// successful onboarding. Preflight is read-only, even when JSON serialization
// itself throws or a custom toJSON changes the top-level shape.
const circularProfile = { level: 'A1' }
circularProfile.self = circularProfile
const invalidProfiles = [
  ['circular', circularProfile],
  ['null serialization', { toJSON: () => null }],
  ['array serialization', { toJSON: () => [] }],
  ['scalar serialization', { toJSON: () => 42 }],
  ['undefined serialization', { toJSON: () => undefined }],
  ['throwing getter', { get level() { throw new Error('blocked') } }],
  ['empty object', {}],
  ['missing placement', { level: 'A1' }],
  ['null placement', { level: 'A1', placementResult: null }],
  ['array placement', { level: 'A1', placementResult: [] }],
  ['unknown level', { level: 'Z9', placementResult: { level: 'Z9' } }],
  ['mismatched level', { level: 'B1', placementResult: { level: 'A1' } }],
  ['invalid strengths', { level: 'A1', placementResult: { level: 'A1', strengths: 'wrong' } }],
  ['invalid focus areas', { level: 'A1', placementResult: { level: 'A1', focusAreas: [42] } }],
  ['invalid placement strengths', { level: 'A1', placementResult: { level: 'A1', placementStrengths: [null] } }],
  ['invalid placement focus areas', { level: 'A1', placementResult: { level: 'A1', placementFocusAreas: 'wrong' } }],
]
for (const [label, invalidProfile] of invalidProfiles) {
  const previous = new Map([
    ['lc2-onboarded', 'true'],
    ['lc2-profile', JSON.stringify(onboardingProfile)],
  ])
  let writes = 0
  const access = {
    valid: () => true,
    getItem: key => previous.get(key) ?? null,
    setItem: (key, value) => { writes++; previous.set(key, value); return true },
  }
  assert.throws(() => commitOnboarding(access, invalidProfile), /Invalid onboarding profile/, label)
  assert.equal(writes, 0, `${label}: invalid serialization must not mutate durable setup`)
  assert.equal(previous.get('lc2-onboarded'), 'true', `${label}: retain earlier completed setup`)
  assert.deepEqual(JSON.parse(previous.get('lc2-profile')), onboardingProfile)
}
for (const failedKey of ['lc2-profile', 'lc2-welcome-seen', 'lc2-personalization-completed']) {
  const state = new Map()
  const access = {
    valid: () => true,
    getItem: key => state.get(key) ?? null,
    setItem: (key, value) => {
      if (key === failedKey) return false
      state.set(key, value)
      return true
    },
  }
  assert.throws(() => commitOnboarding(access, onboardingProfile), /durable/)
  assert.equal(state.get('lc2-onboarded'), 'false', 'partial setup must leave completion explicitly invalid')
}
const staleState = new Map()
let leaseValid = true
assert.throws(() => commitOnboarding({
  valid: () => leaseValid,
  setItem: (key, value) => { staleState.set(key, value); leaseValid = false; return true },
  getItem: key => staleState.get(key) ?? null,
}, onboardingProfile), /durable/)
assert.equal(staleState.get('lc2-onboarded'), 'false', 'revoked lease must not publish completion')
const readbackState = new Map()
assert.throws(() => commitOnboarding({
  valid: () => true,
  setItem: (key, value) => { readbackState.set(key, value); return true },
  getItem: key => key === 'lc2-profile' ? null : readbackState.get(key) ?? null,
}, onboardingProfile), /durable/)
assert.equal(readbackState.get('lc2-onboarded'), 'false', 'missing profile read-back must block completion')
// Re-onboarding must not inherit a stale success marker when a retry fails.
// Clearing that marker is the first verified write, even for returning users.
for (const failedKey of ['lc2-profile', 'lc2-welcome-seen', 'lc2-personalization-completed']) {
  const previous = new Map([['lc2-onboarded', 'true']])
  const attempts = []
  assert.throws(() => commitOnboarding({
    valid: () => true,
    getItem: key => previous.get(key) ?? null,
    setItem: (key, value) => {
      attempts.push([key, value])
      if (key === failedKey) return false
      previous.set(key, value)
      return true
    },
  }, onboardingProfile), /durable/)
  assert.deepEqual(attempts[0], ['lc2-onboarded', 'false'])
  assert.equal(previous.get('lc2-onboarded'), 'false', 'failed retry must not keep previous completion')
}
const deniedReset = new Map([['lc2-onboarded', 'true']])
let deniedWrites = 0
assert.throws(() => commitOnboarding({
  valid: () => true,
  getItem: key => deniedReset.get(key) ?? null,
  setItem: (key, value) => {
    deniedWrites++
    if (key === 'lc2-onboarded' && value === 'false') return false
    deniedReset.set(key, value)
    return true
  },
}, onboardingProfile), /durable/)
assert.equal(deniedWrites, 1, 'failed marker invalidation must stop before profile mutation')
assert.equal(deniedReset.has('lc2-profile'), false)
assert.match(context, /commitOnboarding\(captureLearnerAccess\(\), profileToCommit\)/)
assert.match(context, /if \(tutorPreferenceSaveFailed && !preferencesVerified\) return false/)
assert.match(context, /completePersonalization\(\{ profileToCommit: recommendedProfile, preferencesVerified: true \}\)/)
assert.match(context, /persistPlacementResult\\(captureLearnerAccess\\(\\), result\\)/, 'placement reveal must require a durable checkpoint')
assert.match(setup, /if \\(!completePlacement\\(calculatePlacementResult/, 'failed placement save must remain retryable')
assert.match(setup, /placementSaveFailed &&/, 'failed placement save must show an error')
console.log('PASS: onboarding commits verified profile before completion; failed, unreadable and revoked writes cannot finish setup')

console.log('PASS: setup resume, safe fallback, auth-route exclusion and native keyboard personality controls')
console.log('PASS: verified own-profile restore, legacy placement recovery, corrupt/denied/stale reads fail closed; auth identity cannot persist pre-auth defaults')
