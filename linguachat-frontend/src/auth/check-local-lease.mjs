import assert from 'node:assert/strict'
import { activateLocalAccount } from './browserDataIsolation.js'
import { learnerStorage, captureLearnerAccess, GENERATION_KEY } from './localLease.js'
class Store { values = new Map(); get length(){return this.values.size} key(i){return [...this.values.keys()][i]} getItem(k){return this.values.get(k)??null} setItem(k,v){this.values.set(k,String(v))} removeItem(k){this.values.delete(k)} }
const shared = globalThis.localStorage = new Store()
const a = globalThis.sessionStorage = new Store()
activateLocalAccount(shared, 'A')
learnerStorage.setItem('lc2-profile', 'A1')
const oldA = captureLearnerAccess()
globalThis.sessionStorage = new Store()
activateLocalAccount(shared, 'B')
learnerStorage.setItem('lc2-profile','B1')
globalThis.sessionStorage = a
assert.equal(learnerStorage.getItem('lc2-profile'),null)
assert.throws(()=>learnerStorage.setItem('lc2-profile','bad'))
globalThis.sessionStorage = new Store()
activateLocalAccount(shared,'A')
learnerStorage.setItem('lc2-profile','A2')
assert.equal(oldA.setItem('lc2-profile','A1'),false)
assert.equal(oldA.getItem('lc2-profile'),null)
const resume = captureLearnerAccess()
activateLocalAccount(shared,'A')
assert.equal(resume.valid(),true)
assert.equal(learnerStorage.getItem('lc2-profile'),'A2')
const prior = shared.setItem.bind(shared)
shared.setItem=(k,v)=>{if(k===GENERATION_KEY)throw Error('full');prior(k,v)}
assert.equal(activateLocalAccount(shared,'B').blocked,true)
assert.equal(learnerStorage.getItem('lc2-profile'),'A2')
globalThis.sessionStorage = {getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}
assert.equal(activateLocalAccount(shared,'A').blocked,true)
assert.equal(learnerStorage.getItem('lc2-profile'),null)
console.log('PASS: tab read/write, A-B-A async fencing, refresh and failed storage fail closed')
