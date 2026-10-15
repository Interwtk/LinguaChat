import assert from 'node:assert/strict'
import { activateLocalAccount } from './browserDataIsolation.js'
import { learnerStorage, captureLearnerAccess, GENERATION_KEY, NAMESPACE_PREFIX, HEAD_PREFIX, revokeLocalLease } from './localLease.js'
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
console.log('PASS: tab read/write, A-B-A async fencing, refresh and failed store fail closed')

// Force A→B→A exactly between validation and physical Storage.setItem.
{
 const store=globalThis.localStorage=new Store()
 globalThis.sessionStorage=new Store()
 activateLocalAccount(store,'A');learnerStorage.setItem('lc2-profile','A1')
 const writer=captureLearnerAccess(store),set=store.setItem.bind(store)
 let armed=true
 store.setItem=(key,value)=>{
  if(armed && key.startsWith(NAMESPACE_PREFIX) && key.endsWith(':lc2-profile')){
   armed=false
   activateLocalAccount(store,'B');learnerStorage.setItem('lc2-profile','B1')
   activateLocalAccount(store,'A');learnerStorage.setItem('lc2-profile','A2')
  }
  set(key,value)
 }
 assert.throws(()=>writer.setItem('lc2-profile','STALE'))
 assert.equal(learnerStorage.getItem('lc2-profile'),'A2')
 activateLocalAccount(store,'B');assert.equal(learnerStorage.getItem('lc2-profile'),'B1')
 activateLocalAccount(store,'A')
 // Failed publication must retain the account's previous durable namespace.
 store.setItem=(key,value)=>{if(key.startsWith(HEAD_PREFIX+'B'))throw Error('quota');set(key,value)}
 assert.equal(activateLocalAccount(store,'B').blocked,true)
 store.setItem=set
 activateLocalAccount(store,'A');assert.equal(learnerStorage.getItem('lc2-profile'),'A2')
 activateLocalAccount(store,'B');assert.equal(learnerStorage.getItem('lc2-profile'),'B1')
 // Force a switch after the read's first guard, before it returns the value.
 const reader=captureLearnerAccess(store),get=store.getItem.bind(store)
 armed=true
 store.getItem=key=>{
  if(armed && key.startsWith(NAMESPACE_PREFIX) && key.endsWith(':lc2-profile')){
   armed=false;activateLocalAccount(store,'A')
  }
  return get(key)
 }
 assert.equal(reader.getItem('lc2-profile'),null)
 assert.equal(learnerStorage.getItem('lc2-profile'),'A2')
}
console.log('PASS: physical-key TOCTOU isolation, ABA race, denied stale read, quota rollback and own snapshot restore')

{
 const store=globalThis.localStorage=new Store();globalThis.sessionStorage=new Store()
 activateLocalAccount(store,'A');learnerStorage.setItem('lc2-profile','A')
 const result=activateLocalAccount(store,'B',{deferRebind:true})
 assert.equal(result.reloadRequired,true)
 assert.equal(learnerStorage.getItem('lc2-profile'),null)
 assert.throws(()=>learnerStorage.setItem('lc2-profile','old React effect A'))
 // A fresh authenticated runtime may now bind B and initialize its own state.
 activateLocalAccount(store,'B');assert.equal(learnerStorage.getItem('lc2-profile'),null)
 learnerStorage.setItem('lc2-profile','B')
 activateLocalAccount(store,'A');assert.equal(learnerStorage.getItem('lc2-profile'),'A')
}
console.log('PASS: old same-tab React effects cannot acquire the next account lease before reload')

{
 const store=globalThis.localStorage=new Store();globalThis.sessionStorage=new Store()
 activateLocalAccount(store,'A');learnerStorage.setItem('lc2-profile','saved')
 const pending=captureLearnerAccess(store);revokeLocalLease(store)
 assert.equal(pending.setItem('lc2-profile','late logout callback'),false)
 activateLocalAccount(store,'A');assert.equal(learnerStorage.getItem('lc2-profile'),'saved')
}
console.log('PASS: logout rotates physical generation, preserves progress and fences pending work')

assert.throws(() => learnerStorage.setItem('lc2-auth-owner-id','B'), /Reserved/)
console.log('PASS: ordinary learner writers cannot change account-control metadata')
