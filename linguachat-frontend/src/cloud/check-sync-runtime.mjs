import assert from 'node:assert/strict'
import { CLOUD_PREFERENCES_RELEASED, schedulePreferenceSync } from './runtime.js'
assert.equal(CLOUD_PREFERENCES_RELEASED,false,'schema/RLS release gate must remain closed')
let timer=null, online=false, count=0, cancels=0, fail=true
const handlers=new Map(), events={addEventListener:(k,v)=>handlers.set(k,v),removeEventListener:k=>handlers.delete(k)}
const controller=schedulePreferenceSync({sync:async()=>{count++;if(fail)throw Error('network')},cancel:()=>cancels++},events,{online:()=>online,schedule:(fn,ms)=>{timer={fn,ms};return timer},clear:()=>{timer=null}})
await timer.fn();assert.equal(count,0)
online=true;handlers.get('online')();await timer.fn();assert.equal(count,1);assert.equal(timer.ms,1000)
fail=false;await timer.fn();assert.equal(count,2)
controller.changed();assert.equal(timer.ms,250)
controller.stop();assert.equal(timer,null);assert.equal(cancels,1);assert.equal(handlers.size,0)
console.log('sync runtime: rollout gate, offline pause, reconnect, bounded retry and cancellation PASS')

// Keep cancelled callbacks so a stale timer can be invoked deliberately.
{
  const timers=new Map(), callbacks=[], delays=[], handlers=new Map()
  let id=0, requests=0, cancelCount=0, connected=true, release
  const options={online:()=>connected,schedule:(fn,ms)=>{callbacks.push(fn);delays.push(ms);timers.set(++id,fn);return id},clear:k=>timers.delete(k)}
  const events={addEventListener:(k,f)=>handlers.set(k,f),removeEventListener:k=>handlers.delete(k)}
  let mode='fail'
  const sync={sync:async()=>{requests++;if(mode==='fail')throw Error('offline');if(mode==='pause')await new Promise(r=>release=r)},cancel:()=>cancelCount++}
  const control=schedulePreferenceSync(sync,events,options)
  const fire=()=>{const [k,fn]=timers.entries().next().value;timers.delete(k);return fn()}
  for(let i=0;i<10;i++)await fire()
  assert.deepEqual(delays.slice(1,9),[1000,2000,4000,8000,16000,32000,60000,60000])
  assert.equal(timers.size,1,'one bounded retry timer only')
  const stale=callbacks.at(-1)
  control.changed();await stale();assert.equal(requests,10,'cancelled timer cannot issue a stale request')
  mode='success';await fire();assert.equal(timers.size,0)
  control.changed();assert.equal(delays.at(-1),250);await fire()
  mode='pause';control.changed();const pending=fire()
  control.stop();release();await pending
  control.changed();await callbacks.at(-1)()
  assert.equal(timers.size,0);assert.equal(cancelCount,1);assert.equal(handlers.size,0)
  assert.equal(requests,13,'stopped callbacks cannot revive requests')
}
{
  const timers=new Map(), handlers=new Map();let id=0,requests=0,connected=false
  const c=schedulePreferenceSync({sync:async()=>requests++,cancel(){}},{addEventListener:(k,f)=>handlers.set(k,f),removeEventListener:k=>handlers.delete(k)},
    {online:()=>connected,schedule:f=>{timers.set(++id,f);return id},clear:k=>timers.delete(k)})
  const fire=async()=>{const [k,fn]=timers.entries().next().value;timers.delete(k);await fn()}
  await fire();assert.equal(requests,0);assert.equal(timers.size,0)
  for(let i=0;i<30;i++){handlers.get('online')();connected=!connected}
  assert.equal(timers.size,1);await fire();assert.equal(requests,0)
  connected=true;handlers.get('online')();await fire();assert.equal(requests,1)
  c.stop()
}
console.log('sync runtime: stale timers, retry cap, one timer, dirty after success, stop during request, and rapid reconnect toggles PASS')
