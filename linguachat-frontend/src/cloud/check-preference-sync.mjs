import assert from 'node:assert/strict'
import { createPreferenceSync, reconcilePreferences } from './preferenceSync.js'
import { toCloudPreferenceFields } from '../services/cloudPreferenceMapping.js'

const defaults = toCloudPreferenceFields()
const clone = x => structuredClone(x)
function fixture({ remote = null, base = null } = {}) {
  let owner = 'A', local = { ...defaults, tone: 'calm' }, writes = 0, reads = 0, fail = false, pause = null, collision = null
  const map = new Map(), statuses = []
  if (base) map.set('lc-cloud-preferences:A', JSON.stringify({version:1,userId:'A',base,backup:clone(local),conflicts:{}}))
  const store = {getItem: k=>map.get(k) ?? null,setItem:(k,v)=>map.set(k,v)}
  const transport = {
    user: async()=>({id:owner}),
    read: async(id)=> { reads++; if(fail) throw Error('offline'); if(pause) await pause; assert.equal(id, owner); return clone(remote) },
    compareAndSet: async(id,rev,v)=>{assert.equal(id,owner); writes++; if(collision){remote=collision;collision=null;return null} if((remote?.updated_at ?? null)!==rev)return null;remote={...clone(v),user_id:id,updated_at:String(writes)}; return clone(remote)},
  }
  const sync = createPreferenceSync({transport,store,readOwner:()=>owner,readLocal:()=>local,applyLocal:v=>local=v,onStatus:s=>statuses.push(s)})
  return {sync,store,map,statuses, set owner(v){owner=v},set local(v){local=v},get local(){return local},get remote(){return remote},get writes(){return writes},get reads(){return reads},set fail(v){fail=v},set pause(v){pause=v},set collision(v){collision=v}}
}
{
  const f=fixture();await f.sync.sync();assert.equal(f.writes,1);assert.equal(f.remote.user_id,'A');assert.equal(f.remote.tone,'calm');
  await f.sync.sync();assert.equal(f.writes,1,'retry must not duplicate writes');assert.ok(f.map.get('lc-cloud-preferences:A').includes('backup'))
  f.fail=true;f.local={...f.local,pace:'fast'};await assert.rejects(f.sync.sync(),/offline/);assert.equal(f.local.pace,'fast');assert.equal(f.statuses.at(-1),'pending');
  f.fail=false;await f.sync.sync();assert.equal(f.remote.pace,'fast')
}
{
  const f=fixture({remote:{...defaults,tone:'professional',user_id:'A',updated_at:'1'}});await f.sync.sync();assert.equal(f.local.tone,'professional');assert.equal(f.writes,0);assert.equal(JSON.parse(f.map.get('lc-cloud-preferences:A')).backup.tone,'calm')
}
{
  const base={...defaults};const local={...base,pace:'fast',tone:'calm'};const remote={...base,tone:'professional'}
  const merged=reconcilePreferences(base,local,remote);assert.equal(merged.value.pace,'fast');assert.equal(merged.value.tone,'professional');assert.equal(merged.conflicts.tone,'calm')
  const f=fixture({base,remote:{...base,user_id:'A',updated_at:'1'}});f.local=local;f.collision={...remote,user_id:'A',updated_at:'2'};await f.sync.sync();assert.equal(f.remote.pace,'fast');assert.equal(f.remote.tone,'professional');assert.equal(f.writes,2)
}
{
  const f=fixture();let release;f.pause=new Promise(r=>release=r);const pending=f.sync.sync();assert.equal(f.sync.sync(),pending,'coalesce concurrent sync');await Promise.resolve();await Promise.resolve();f.owner='B';f.sync.cancel();release();await assert.rejects(pending);assert.equal(f.writes,0);assert.equal(f.local.tone,'calm');assert.equal(f.map.has('lc-cloud-preferences:B'),false)
}
{
  const f=fixture({remote:{...defaults,user_id:'B',updated_at:'1'}});await assert.rejects(f.sync.sync(),/account_changed/);assert.equal(f.writes,0)
}
{
  const f=fixture();f.store.setItem=()=>{throw Error('quota')};await assert.rejects(f.sync.sync(),/quota/);assert.equal(f.reads,0);assert.equal(f.writes,0)
}
{
  const f=fixture();f.map.set('lc-cloud-preferences:A','broken');await assert.rejects(f.sync.sync(),/invalid_sync_journal/);assert.equal(f.reads,0)
}
// A cancelled in-flight request must not block B or clear B's pending promise.
{
  let owner = 'A', releaseA, releaseB
  const reads = [], writes = [], statuses = [], map = new Map()
  let local = { ...defaults, tone: 'calm' }
  const paused = {
    A: new Promise(resolve => { releaseA = resolve }),
    B: new Promise(resolve => { releaseB = resolve }),
  }
  const sync = createPreferenceSync({
    transport: {
      user: async () => ({ id: owner }),
      read: async id => { reads.push(id); await paused[id]; return null },
      compareAndSet: async (id, _rev, value) => {
        writes.push(id)
        return { ...clone(value), user_id: id, updated_at: '1' }
      },
    },
    store: { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) },
    readOwner: () => owner,
    readLocal: () => local,
    applyLocal: value => { local = value },
    onStatus: value => statuses.push(value),
  })
  const a = sync.sync()
  for (let i = 0; i < 20 && reads.length === 0; i++) await Promise.resolve()
  assert.deepEqual(reads, ['A'], 'A must be in-flight before the account switch')
  owner = 'B'
  sync.cancel()
  const b = sync.sync()
  assert.notEqual(a, b, 'B must have a new pending promise')
  for (let i = 0; i < 20 && reads.length < 2; i++) await Promise.resolve()
  assert.deepEqual(reads, ['A', 'B'], 'B must read without waiting for A')
  releaseA()
  await assert.rejects(a, /account_changed/)
  assert.equal(sync.sync(), b, 'stale A completion must not clear B pending')
  assert.deepEqual(writes, [], 'cancelled A must not write')
  releaseB()
  await b
  assert.deepEqual(writes, ['B'], 'only B may write after the switch')
  assert.equal(statuses.at(-1), 'synced')
}
console.log('preference sync: cancelled A does not block B or clear B pending PASS')

console.log('preference sync: import backup, idempotency, offline recovery, concurrent CAS, deterministic conflict preservation, account cancellation, wrong-owner denial and quota fail-closed PASS')

for (const corrupt of [
  {version:1,userId:'A',base:{tone:'invalid'},backup:defaults,conflicts:{}},
  {version:1,userId:'A',base:null,conflicts:{}},
  {version:1,userId:'A',base:defaults,backup:[],conflicts:{}},
  {version:1,userId:'A',base:defaults,backup:defaults,conflicts:{tone:'invalid'}},
]) {
  const f=fixture(), raw=JSON.stringify(corrupt)
  f.map.set('lc-cloud-preferences:A',raw)
  await assert.rejects(f.sync.sync(),/invalid_sync_journal/)
  assert.equal(f.reads,0);assert.equal(f.writes,0)
  assert.equal(f.local.tone,'calm')
  assert.equal(f.map.get('lc-cloud-preferences:A'),raw,'keep corrupt journal for recovery')
}
