import assert from 'node:assert/strict'
import { createLazyAuthService } from './provider.js'
let loads=0, listeners=0, stopped=0, release
const ready=new Promise(r=>release=r)
const service=createLazyAuthService(async()=>{loads++;await ready;return {
  getSession:async()=>({user:{id:'A'}}),
  onAuthStateChange:()=>{listeners++;return {data:{subscription:{unsubscribe(){stopped++}}}}},
}})
const abandoned=service.onAuthStateChange(()=>{});abandoned.data.subscription.unsubscribe()
const live=service.onAuthStateChange(()=>{});const session=service.getSession();release()
assert.equal((await session).user.id,'A');assert.equal(loads,1);assert.equal(listeners,1)
live.data.subscription.unsubscribe();assert.equal(stopped,1)
let attempts=0
const retry=createLazyAuthService(async()=>{if(++attempts===1)throw Error('chunk unavailable');return {getSession:async()=>null}})
await assert.rejects(retry.getSession(),/chunk unavailable/);assert.equal(await retry.getSession(),null)
console.log('lazy auth: shared initialization, listener cancellation, session restoration and chunk retry PASS')
