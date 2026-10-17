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
