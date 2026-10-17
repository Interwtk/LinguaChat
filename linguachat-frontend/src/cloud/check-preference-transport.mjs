import assert from 'node:assert/strict'
import { createPreferenceTransport } from './preferenceTransport.js'
import { toCloudPreferenceFields } from '../services/cloudPreferenceMapping.js'
let user={id:'A'}, calls=[], response={data:null,error:null}
const builder={}
for(const method of ['select','eq','insert','update']) builder[method]=(...args)=>{calls.push([method,...args]);return builder}
builder.maybeSingle=async()=>response
const client={auth:{getUser:async()=>({data:{user},error:null})},from:table=>{assert.equal(table,'learner_preferences');return builder}}
const transport=createPreferenceTransport(client)
assert.equal((await transport.user()).id,'A')
await assert.rejects(transport.read('B'),/account_changed/);assert.equal(calls.length,0)
await transport.read('A');assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='user_id'&&c[2]==='A'))
calls=[];const revision='2026-01-01T00:00:00Z'
await transport.compareAndSet('A',revision,{...toCloudPreferenceFields(),user_id:'B',mastery:99})
const payload=calls.find(c=>c[0]==='update')[1];assert.equal(payload.user_id,undefined);assert.equal(payload.mastery,undefined)
assert.ok(calls.some(c=>c[0]==='eq'&&c[1]==='updated_at'&&c[2]===revision))
assert.ok(Date.parse(payload.updated_at)>Date.parse(revision))
response={data:null,error:{code:'23505'}};assert.equal(await transport.compareAndSet('A',null,toCloudPreferenceFields()),null)
response={data:null,error:Error('permission denied')};await assert.rejects(transport.read('A'),/permission denied/)
user=null;await assert.rejects(transport.compareAndSet('A',revision,toCloudPreferenceFields()),/account_changed/)
console.log('preference transport: verified identity, ownership filter, field allowlist, CAS filter, duplicate insert and denial PASS')
