import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { readSetupCheckpoint, SETUP_STEPS } from '../src/auth/setupCheckpoint.js'
const values=new Map(),store={getItem:k=>values.get(k)??null}
assert.equal(readSetupCheckpoint(store).step,'placement')
values.set('lc2-placement-result',JSON.stringify({level:'A1',strengths:['hello']}))
assert.equal(readSetupCheckpoint(store).step,'setup-choice')
for(const step of SETUP_STEPS){values.set('lc2-onboarding-step',step);assert.equal(readSetupCheckpoint(store).step,step)}
for(const step of ['reset','confirmed','entry']){values.set('lc2-onboarding-step',step);assert.equal(readSetupCheckpoint(store).step,'setup-choice')}
values.set('lc2-placement-result','{');assert.equal(readSetupCheckpoint(store).step,'placement')
assert.equal(readSetupCheckpoint({getItem(){throw Error('blocked')}}).step,'placement')
const setup=readFileSync(new URL('../src/components/setup/SetupFlow.jsx',import.meta.url),'utf8')
assert.match(setup,/<button\s+type="button"\s+aria-pressed=\{isSelected\}\s+key=\{p.id\}/)
console.log('PASS: setup resume, safe fallback, auth-route exclusion and native keyboard personality controls')
