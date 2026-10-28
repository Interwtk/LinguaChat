import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readSetupCheckpoint, persistPlacementResult, retainPlacementAnswerLease, SETUP_STEPS } from '../src/auth/setupCheckpoint.js'
import { readVerifiedProfile } from '../src/auth/profileRestore.js'
import { commitOnboarding } from '../src/auth/onboardingCommit.js'
import { updateTutorPreferencesDurably } from '../src/services/tutorPreferences.js'
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
// Same-account lease renewal between questions must discard the old quiz
// before accepting another answer, even with no feedback timer pending.
let quizGeneration = 'A'
const quizLeaseA = { valid: () => quizGeneration === 'A' }
const quizLeaseB = { valid: () => quizGeneration === 'B' }
assert.equal(retainPlacementAnswerLease(null, quizLeaseA), quizLeaseA)
assert.equal(retainPlacementAnswerLease(quizLeaseA, quizLeaseA), quizLeaseA)
quizGeneration = 'B'
assert.equal(retainPlacementAnswerLease(quizLeaseA, quizLeaseB), null,
  'new lease must not continue answers gathered under an earlier lease')
assert.equal(retainPlacementAnswerLease(null, quizLeaseB), quizLeaseB,
  'a clean retry must accept the current generation')
assert.equal(retainPlacementAnswerLease(quizLeaseB, { valid: () => false }), null,
  'a denied new capture must fail closed')

const placement = { level: 'A2', strengths: ['listening'], focusAreas: ['grammar'] }
const placementValues = new Map()
const placementWrites = []
const placementAccess = {
  valid: () => true,
  getItem: key => placementValues.get(key) ?? null,
  setItem: (key, value) => { placementWrites.push(key); placementValues.set(key, value); return true },
}
assert.equal(persistPlacementResult(placementAccess, placement), true)
assert.deepEqual(placementWrites, ['lc2-placement-result', 'lc2-placement', 'lc2-placement-result'])
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
// Regression: the old implementation published the authoritative result
// before the legacy mirror, so a failed mirror write advanced setup on reload.
// A prior successful placement must also not survive a failed new attempt.
for (const failure of ['legacy-write', 'final-publish', 'mirror-readback']) {
  const state = new Map([['lc2-placement-result', JSON.stringify({ level: 'B1' })]])
  const writes = []
  const access = {
    valid: () => true,
    getItem: key => failure === 'mirror-readback' && key === 'lc2-placement'
      ? null : state.get(key) ?? null,
    setItem: (key, value) => {
      writes.push([key, value])
      if (failure === 'legacy-write' && key === 'lc2-placement') return false
      if (failure === 'final-publish' && key === 'lc2-placement-result' && value !== 'null') return false
      state.set(key, value)
      return true
    },
  }
  assert.throws(() => persistPlacementResult(access, placement), /not durable/, failure)
  assert.deepEqual(writes[0], ['lc2-placement-result', 'null'])
  assert.equal(readSetupCheckpoint(access).step, 'placement', failure + ': no unsaved level after reload')
  assert.equal(readSetupCheckpoint(access).result, null, failure + ': no stale level after failed retry')
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
}, placement), /not durable/)

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
assert.match(context, /commitOnboarding\(access, profileToCommit\)/, 'onboarding commit must use the originating learner lease')
assert.match(context, /if \(tutorPreferenceSaveFailed && !preferencesVerified\) return false/)
assert.match(context, /completePersonalization\(\{ profileToCommit: recommendedProfile, preferencesVerified: true, access \}\)/)
assert.ok(context.includes('persistPlacementResult(access, result)'), 'placement reveal must use the captured account lease')
assert.match(context, /completePlacement = useCallback\(\(result, access = captureLearnerAccess\(\)\)/, 'direct placement calls must also capture their own lease')
assert.match(context, /setProfile\(prev => access\.valid\(\) \?/, 'deferred profile publication must reject a revoked lease')
assert.match(context, /setAuthStep\(prev => access\.valid\(\) \? 'level-reveal' : prev\)/, 'deferred placement navigation must not advance another account')
assert.match(context, /setAuthProviderError\(prev => access\.valid\(\) \? '' : prev\)/, 'deferred placement success must not clear another account error')
assert.ok(setup.includes('if (!completePlacement(calculatePlacementResult'), 'failed placement save must remain retryable')
assert.match(setup, /placementSaveFailed &&/, 'failed placement save must show an error')

const placementUi = setup.slice(setup.indexOf('function PlacementTest()'), setup.indexOf('/* ---- LEVEL REVEAL ---- */'))
assert.match(placementUi, /const activeAccountId = authUser\?\.id \?\? null/, 'quiz must track the verified account identity')
assert.match(placementUi, /feedbackTimer\.current !== null\) window\.clearTimeout\(feedbackTimer\.current\)/, 'unmount or account switch must cancel pending feedback')
assert.match(placementUi, /selectedOption \|\| feedbackTimer\.current !== null \|\| phase !== 'quiz'/, 'double click must not schedule duplicate feedback')
assert.match(placementUi, /if \(scheduledAccountId !== currentAccountId\.current\) return/, 'delayed callback must reject a different account')
assert.match(placementUi, /const quizAccess = useRef\(null\)/, 'quiz must remember its originating lease across answers')
assert.match(placementUi, /retainPlacementAnswerLease\(quizAccess\.current, captureLearnerAccess\(\)\)/,
  'every answer must reject same-account lease rotation between questions')
assert.match(placementUi, /quizAccess\.current = answerAccess/, 'accepted quiz must retain the original lease')
assert.match(placementUi, /quizAccess\.current = null/, 'stale quiz must clear its lease before retry')
assert.match(placementUi, /completePlacement\(calculatePlacementResult\(evaluated\.nextState, interfaceLanguage\), answerAccess\)/, 'delayed commit must use its originating lease')
const delayedPlacement = placementUi.slice(placementUi.indexOf('feedbackTimer.current = window.setTimeout('))
const staleCallback = delayedPlacement.slice(delayedPlacement.indexOf('if (!answerAccess.valid()) {'), delayedPlacement.indexOf('if (shouldFinishPlacement('))
assert.ok(delayedPlacement.indexOf('if (scheduledAccountId !== currentAccountId.current) return')
  < delayedPlacement.indexOf('if (!answerAccess.valid()) {'), 'different account must be fenced before stale callback touches quiz state')
assert.ok(staleCallback.includes("setPlacementState(getInitialPlacementState('A2'))")
  && staleCallback.includes('setSelectedOption(null)')
  && staleCallback.includes('setFeedback(null)')
  && staleCallback.includes('setPlacementSaveFailed(true)'), 'same-id revoked lease must reset answers and unlock retry')
assert.ok(delayedPlacement.indexOf('if (!answerAccess.valid()) {')
  < delayedPlacement.indexOf('completePlacement(calculatePlacementResult'), 'lease fence must precede durable placement')
assert.match(delayedPlacement, /if \(!answerAccess\.valid\(\)\) \{\s*quizAccess\.current = null\s*setPlacementState\(getInitialPlacementState\('A2'\)\)/, 'lease revoked during failed durable publication must discard old answers')
const beforeFeedback = placementUi.slice(placementUi.indexOf('const answerAccess = retainPlacementAnswerLease('), placementUi.indexOf('feedbackTimer.current = window.setTimeout('))
assert.ok(beforeFeedback.includes("setPlacementState(getInitialPlacementState('A2'))"), 'lease denied before feedback must discard stale answers')
assert.match(setup, /placement: <PlacementTest key=\{authUser\?\.id \?\? 'guest'\} \/>/, 'switching accounts must remount the quiz without prior answers')

// The final onboarding click may enqueue React state changes that React
// applies after a different account becomes active. Each publication must
// check the same lease used by the durable commit.
const onboardingUi = context.slice(context.indexOf('const completePersonalization = useCallback('), context.indexOf('const dismissWelcome = useCallback('))
assert.match(onboardingUi, /commitOnboarding\(access, profileToCommit\)/)
for (const [setter, expected] of [
  ['setTutorPreferenceSaveFailed', 'false'],
  ['setOnboardingCompleted', 'true'],
  ['setView', "'today'"],
  ['setShowWelcome', 'true'],
  ['setAuthStep', 'null'],
]) {
  assert.ok(onboardingUi.includes(`${setter}(prev => access.valid() ? ${expected} : prev)`),
    `${setter} must not publish stale onboarding completion into another account`)
}
assert.match(onboardingUi, /updateTutorPreferencesDurably\(DEFAULT_TUTOR_PREFERENCES, \{ access \}\)/,
  'recommended preference save must reuse the originating lease')
assert.match(onboardingUi, /completePersonalization\(\{ profileToCommit: recommendedProfile, preferencesVerified: true, access \}\)/)
assert.match(onboardingUi, /setTutorPreferencesState\(prev => access\.valid\(\) \? durable : prev\)/)
assert.match(onboardingUi, /setProfile\(prev => access\.valid\(\) \? recommendedProfile : prev\)/)

// Prove a stale recommended click cannot save preferences to account B after
// switching away from the account A that began onboarding.
const ownTutorValues = new Map()
const otherTutorValues = new Map()
let tutorOwner = 'A'
const tutorAccess = {
  valid: () => tutorOwner === 'A',
  getItem: key => ownTutorValues.get(key) ?? null,
  setItem: (key, value) => { ownTutorValues.set(key, value); return true },
}
assert.equal(updateTutorPreferencesDurably({ tone: 'calm' }, { access: tutorAccess }).tone, 'calm')
assert.equal(JSON.parse(ownTutorValues.get('lc2-tutor-preferences')).tone, 'calm')
tutorOwner = 'B'
assert.throws(() => updateTutorPreferencesDurably({ tone: 'fun' }, { access: tutorAccess }), /Stale tutor preference edit/)
assert.equal(JSON.parse(ownTutorValues.get('lc2-tutor-preferences')).tone, 'calm')
assert.equal(otherTutorValues.size, 0, 'old onboarding click must never write B preferences')

console.log('PASS: onboarding commits verified profile before completion; failed, unreadable and revoked writes cannot finish setup')

console.log('PASS: setup resume, safe fallback, auth-route exclusion and native keyboard personality controls')
console.log('PASS: verified own-profile restore, legacy placement recovery, corrupt/denied/stale reads fail closed; auth identity cannot persist pre-auth defaults')
