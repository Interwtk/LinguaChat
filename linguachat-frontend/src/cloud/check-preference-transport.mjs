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

user={id:'A'};response={data:null,error:null}
const realNow=Date.now
try {
  Date.now=()=>0
  for(const previous of ['2030-01-01T00:00:00.000Z','2030-01-01T00:00:00.000001+00:00']) {
    calls=[];await transport.compareAndSet('A',previous,toCloudPreferenceFields())
    const next=calls.find(c=>c[0]==='update')[1].updated_at
    assert.ok(Date.parse(next)>Date.parse(previous),'future remote revision stays monotonic when local clock goes backward')
    calls=[];Date.now=()=>Date.parse(next)
    await transport.compareAndSet('A',next,toCloudPreferenceFields())
    assert.ok(Date.parse(calls.find(c=>c[0]==='update')[1].updated_at)>Date.parse(next),'rapid/equal-clock updates advance CAS revision')
  }
} finally {Date.now=realNow}
for(const revision of ['2026-02-30T00:00:00Z','2026-13-01T00:00:00Z','2026-01-01T24:00:00Z','9999-12-31T23:59:59.999Z']) {
  calls=[];await assert.rejects(transport.compareAndSet('A',revision,toCloudPreferenceFields()),/invalid_remote_revision/)
  assert.equal(calls.length,0)
}
calls=[]
await transport.compareAndSet('A',null,{...toCloudPreferenceFields(),user_id:'B',progress:1,XP:40,mastery:1,messages:['private'],token:'fixture'})
const inserted=calls.find(c=>c[0]==='insert')[1]
assert.deepEqual(Object.keys(inserted).sort(),[...Object.keys(toCloudPreferenceFields()),'user_id','updated_at'].sort())
assert.equal(inserted.user_id,'A')
for(const bad of [{interests:{token:'fixture'}},{tone:'invalid'},{target_language:'fr'}]) {
  calls=[];await assert.rejects(transport.compareAndSet('A',null,{...toCloudPreferenceFields(),...bad}),/invalid_local_preferences/)
  assert.equal(calls.length,0)
}
const originalGetUser=client.auth.getUser
client.auth.getUser=async()=>({data:{user:{id:'A'}},error:Error('auth_rejected')})
calls=[];await assert.rejects(transport.read('A'),/auth_rejected/);assert.equal(calls.length,0)
client.auth.getUser=originalGetUser
response={data:null,error:Error('remote_write_denied')}
await assert.rejects(transport.compareAndSet('A',null,toCloudPreferenceFields()),/remote_write_denied/)
console.log('preference transport: monotonic future/equal/backward clocks, microsecond revisions, malformed dates, exact insert allowlist, invalid values and Auth/write errors PASS')
