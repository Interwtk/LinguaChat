import assert from 'node:assert/strict'
import { createLazyAuthService, resolveBrowserAuthOrigin } from './provider.js'
let loads=0, listeners=0, stopped=0, release
assert.equal(resolveBrowserAuthOrigin('https://exact-preview.example', {
  VITE_AUTH_REDIRECT_ORIGIN: 'https://stable-preview.example',
}), 'https://stable-preview.example')
assert.equal(resolveBrowserAuthOrigin('https://exact-preview.example', {}), 'https://exact-preview.example')
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

let retryLoads = 0, reattached = 0, retryStopped = 0
const recovering = createLazyAuthService(async () => {
  if (++retryLoads === 1) throw Error('transient lazy chunk failure')
  return {
    getSession: async () => ({ user: { id: 'B' } }),
    onAuthStateChange: () => {
      reattached++
      return { data: { subscription: { unsubscribe() { retryStopped++ } } } }
    },
  }
})
const recoveredListener = recovering.onAuthStateChange(() => {})
await assert.rejects(recovering.getSession(), /transient lazy chunk failure/)
assert.equal(reattached, 0, 'failed import cannot register listener')
assert.equal((await recovering.getSession()).user.id, 'B')
assert.equal(reattached, 1, 'retry must reattach the original active listener')
const lateListener = recovering.onAuthStateChange(() => {})
await recovering.getSession()
assert.equal(reattached, 2, 'listeners added after initialization must attach')
recoveredListener.data.subscription.unsubscribe()
lateListener.data.subscription.unsubscribe()
assert.equal(retryStopped, 2, 'all recovered subscriptions must unsubscribe')

let canceledLoads = 0, zombieListeners = 0
const canceledRetry = createLazyAuthService(async () => {
  if (++canceledLoads === 1) throw Error('transient lazy chunk failure')
  return {
    getSession: async () => null,
    onAuthStateChange: () => { zombieListeners++; return { data: { subscription: { unsubscribe() {} } } } },
  }
})
const canceledListener = canceledRetry.onAuthStateChange(() => {})
await assert.rejects(canceledRetry.getSession(), /transient lazy chunk failure/)
canceledListener.data.subscription.unsubscribe()
await canceledRetry.getSession()
assert.equal(zombieListeners, 0, 'unmounted listener must not revive after retry')


let registrationAttempts = 0, registrationAttached = 0, registrationStopped = 0
const registrationRetry = createLazyAuthService(async () => ({
  getSession: async () => null,
  onAuthStateChange: () => {
    registrationAttempts++
    if (registrationAttempts === 1) throw Error('temporary listener registration failure')
    registrationAttached++
    return { data: { subscription: { unsubscribe() { registrationStopped++ } } } }
  },
}))
const retainedRegistration = registrationRetry.onAuthStateChange(() => {})
await new Promise(resolve => setImmediate(resolve))
assert.equal(registrationAttempts, 1, 'initial registration should fail once')
assert.equal(registrationAttached, 0)
await registrationRetry.getSession()
assert.equal(registrationAttached, 1, 'next auth action must retry failed listener registration')
await registrationRetry.getSession()
assert.equal(registrationAttached, 1, 'recovered listener must not register twice')
retainedRegistration.data.subscription.unsubscribe()
assert.equal(registrationStopped, 1, 'recovered listener must remain cancelable')

let canceledRegistrationAttempts = 0
const canceledRegistration = createLazyAuthService(async () => ({
  getSession: async () => null,
  onAuthStateChange: () => {
    canceledRegistrationAttempts++
    if (canceledRegistrationAttempts === 1) throw Error('temporary listener registration failure')
    return { data: { subscription: { unsubscribe() {} } } }
  },
}))
const abandonedRegistration = canceledRegistration.onAuthStateChange(() => {})
await new Promise(resolve => setImmediate(resolve))
assert.equal(canceledRegistrationAttempts, 1)
abandonedRegistration.data.subscription.unsubscribe()
await canceledRegistration.getSession()
assert.equal(canceledRegistrationAttempts, 1, 'canceled failed registration must not be revived')

console.log('lazy auth: shared initialization, listener cancellation, session restoration and chunk retry, transient retry reattaches, no zombie listeners PASS')
