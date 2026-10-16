import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readSetupCheckpoint, SETUP_STEPS } from '../src/auth/setupCheckpoint.js'
import { readVerifiedProfile } from '../src/auth/profileRestore.js'
const values=new Map(),store={getItem:k=>values.get(k)??null}
assert.equal(readSetupCheckpoint(store).step,'placement')
values.set('lc2-placement-result',JSON.stringify({level:'A1',strengths:['hello']}))
assert.equal(readSetupCheckpoint(store).step,'setup-choice')
for(const step of SETUP_STEPS){values.set('lc2-onboarding-step',step);assert.equal(readSetupCheckpoint(store).step,step)}
for(const step of ['reset','confirmed','entry']){values.set('lc2-onboarding-step',step);assert.equal(readSetupCheckpoint(store).step,'setup-choice')}
values.set('lc2-placement-result','{');assert.equal(readSetupCheckpoint(store).step,'placement')
assert.equal(readSetupCheckpoint({getItem(){throw Error('blocked')}}).step,'placement')
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
assert.throws(()=>readVerifiedProfile({...ownAccess,valid:()=>false}),/Stale/)
let valid=true
assert.throws(()=>readVerifiedProfile({valid:()=>valid,getItem(){valid=false;return JSON.stringify(savedProfile)}}),/ownership/)
assert.throws(()=>readVerifiedProfile({valid:()=>true,getItem(){throw Error('Storage denied')}}),/Storage denied/)
ownValues.set('lc2-profile','{');assert.throws(()=>readVerifiedProfile(ownAccess))
ownValues.set('lc2-profile','[]');assert.throws(()=>readVerifiedProfile(ownAccess),/Invalid/)
assert.match(provider,/if \(!profileRestoredRef.current\)/,'token refresh must preserve unsaved in-memory profile edits after hydration')
assert.ok(provider.indexOf('if (isolation.switched || isolation.reloadRequired)') < provider.indexOf('readVerifiedProfile(captureLearnerAccess())'),'hydrate only after account activation/reload fencing')
assert.match(setup,/<button\s+type="button"\s+aria-pressed=\{isSelected\}\s+key=\{p.id\}/)
console.log('PASS: setup resume, safe fallback, auth-route exclusion and native keyboard personality controls')
console.log('PASS: verified own-profile restore, legacy placement recovery, corrupt/denied/stale reads fail closed; auth identity cannot persist pre-auth defaults')
