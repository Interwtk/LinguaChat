import assert from 'node:assert/strict'
import { createPreferenceSync as createSync, reconcilePreferences } from './preferenceSync.js'
import { toCloudPreferenceFields } from '../services/cloudPreferenceMapping.js'

const createPreferenceSync = options => createSync({ captureAccess: () => ({ valid: () => true }), ...options })
const revision = n => new Date(Date.UTC(2026, 0, 1, 0, 0, 0, Number(n))).toISOString()
const defaults = toCloudPreferenceFields()
const clone = x => structuredClone(x)
{
  const local = { ...defaults, tone: 'calm' }
  const identical = reconcilePreferences(null, local, { ...local })
  assert.deepEqual(identical.conflicts, {}, 'matching first-import values are not conflicts')
  const divergent = reconcilePreferences(null, local, { ...local, tone: 'professional' })
  assert.deepEqual(divergent.conflicts, { tone: 'calm' }, 'only divergent first-import values are conflicts')
  assert.equal(divergent.value.tone, 'professional', 'remote first-import value still wins')
}
function fixture({ remote = null, base = null } = {}) {
  let owner = 'A', local = { ...defaults, tone: 'calm' }, writes = 0, reads = 0, fail = false, pause = null, collision = null
  const map = new Map(), statuses = []
  if (base) map.set('lc-cloud-preferences:A', JSON.stringify({version:1,userId:'A',base,backup:clone(local),conflicts:{}}))
  const store = {getItem: k=>map.get(k) ?? null,setItem:(k,v)=>map.set(k,v)}
  const transport = {
    user: async()=>({id:owner}),
    read: async(id)=> { reads++; if(fail) throw Error('offline'); if(pause) await pause; assert.equal(id, owner); return clone(remote) },
    compareAndSet: async(id,rev,v)=>{assert.equal(id,owner); writes++; if(collision){remote=collision;collision=null;return null} if((remote?.updated_at ?? null)!==rev)return null;remote={...clone(v),user_id:id,updated_at:revision(writes)}; return clone(remote)},
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
  const f=fixture({remote:{...defaults,tone:'professional',user_id:'A',updated_at:revision(1)}});await f.sync.sync();assert.equal(f.local.tone,'professional');assert.equal(f.writes,0);assert.equal(JSON.parse(f.map.get('lc-cloud-preferences:A')).backup.tone,'calm')
}
{
  const base={...defaults};const local={...base,pace:'fast',tone:'calm'};const remote={...base,tone:'professional'}
  const merged=reconcilePreferences(base,local,remote);assert.equal(merged.value.pace,'fast');assert.equal(merged.value.tone,'professional');assert.equal(merged.conflicts.tone,'calm')
  const f=fixture({base,remote:{...base,user_id:'A',updated_at:revision(1)}});f.local=local;f.collision={...remote,user_id:'A',updated_at:revision(2)};await f.sync.sync();assert.equal(f.remote.pace,'fast');assert.equal(f.remote.tone,'professional');assert.equal(f.writes,2)
}
{
  const f=fixture();let release;f.pause=new Promise(r=>release=r);const pending=f.sync.sync();assert.equal(f.sync.sync(),pending,'coalesce concurrent sync');await Promise.resolve();await Promise.resolve();f.owner='B';f.sync.cancel();release();await assert.rejects(pending);assert.equal(f.writes,0);assert.equal(f.local.tone,'calm');assert.equal(f.map.has('lc-cloud-preferences:B'),false)
}
{
  const f=fixture({remote:{...defaults,user_id:'B',updated_at:revision(1)}});await assert.rejects(f.sync.sync(),/account_changed/);assert.equal(f.writes,0)
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
        return { ...clone(value), user_id: id, updated_at: revision(1) }
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

// A malformed successful CAS response cannot contaminate local preferences or base.
{
  const map = new Map()
  let local = { ...defaults, tone: 'calm' }, applied = 0
  const sync = createPreferenceSync({
    transport: {
      user: async () => ({ id: 'A' }),
      read: async () => null,
      compareAndSet: async (_id, _rev, value) => ({
        ...value, user_id: 'A', updated_at: revision(1), tone: 'invalid-tone',
      }),
    },
    store: { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) },
    readOwner: () => 'A',
    readLocal: () => local,
    applyLocal: value => { applied++; local = value },
  })
  await assert.rejects(sync.sync(), /invalid_remote_preferences/)
  assert.equal(applied, 0)
  assert.equal(local.tone, 'calm')
  const journal = JSON.parse(map.get('lc-cloud-preferences:A'))
  assert.equal(journal.base, null)
  assert.equal(journal.backup.tone, 'calm')
}
console.log('preference sync: malformed successful CAS response fails closed PASS')

// If persisting the accepted baseline fails, do not import remote values into
// local UI state: a retry must still have a coherent first-import journal.
{
  const map = new Map()
  const remote = { ...defaults, tone: 'professional', user_id: 'A', updated_at: revision(1) }
  let local = { ...defaults, tone: 'calm' }, applied = 0, writes = 0, storeWrites = 0, fail = true
  const store = {
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => {
      storeWrites++
      if (fail && storeWrites === 3) throw new Error('quota_on_base')
      map.set(key, value)
    },
  }
  const sync = createPreferenceSync({
    transport: {
      user: async () => ({ id: 'A' }),
      read: async () => clone(remote),
      compareAndSet: async () => { writes++; throw new Error('unexpected_remote_write') },
    },
    store,
    readOwner: () => 'A',
    readLocal: () => local,
    applyLocal: value => { applied++; local = value },
  })
  await assert.rejects(sync.sync(), /quota_on_base/)
  assert.equal(applied, 0, 'failed baseline persistence must not import into local state')
  assert.equal(local.tone, 'calm')
  const journal = JSON.parse(map.get('lc-cloud-preferences:A'))
  assert.equal(journal.base, null)
  assert.equal(journal.backup.tone, 'calm')
  assert.equal(journal.conflicts.tone, 'calm')
  fail = false
  await sync.sync()
  assert.equal(applied, 1)
  assert.equal(local.tone, 'professional')
  assert.equal(JSON.parse(map.get('lc-cloud-preferences:A')).base.tone, 'professional')
  assert.equal(writes, 0)
}
console.log('preference sync: quota failure before local import and durable retry PASS')

// Failed applyLocal must be recovered before a retry can write stale values.
{
  const map = new Map()
  let local = { ...defaults, tone: 'calm' }
  let remote = { ...defaults, tone: 'professional', user_id: 'A', updated_at: revision(1) }
  let applied = 0, writes = 0
  const sync = createPreferenceSync({
    transport: {
      user: async () => ({ id: 'A' }),
      read: async () => clone(remote),
      compareAndSet: async (id, revision, value) => {
        assert.equal(id, 'A')
        assert.equal(revision, remote.updated_at)
        writes++
        remote = { ...clone(value), user_id: id, updated_at: new Date(Date.UTC(2026, 0, 1, 0, 0, 0, writes + 1)).toISOString() }
        return clone(remote)
      },
    },
    store: { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) },
    readOwner: () => 'A',
    readLocal: () => local,
    applyLocal: value => {
      applied++
      if (applied === 1) throw new Error('apply_failed')
      local = value
    },
  })
  await assert.rejects(sync.sync(), /apply_failed/)
  assert.equal(local.tone, 'calm')
  assert.equal(remote.tone, 'professional')
  assert.equal(JSON.parse(map.get('lc-cloud-preferences:A')).pendingImport.value.tone, 'professional')
  local = { ...local, pace: 'fast' }
  await sync.sync()
  assert.equal(local.tone, 'professional', 'failed import must not overwrite remote tone')
  assert.equal(local.pace, 'fast', 'real local edit must survive recovery')
  assert.equal(remote.tone, 'professional')
  assert.equal(remote.pace, 'fast')
  assert.equal(writes, 1, 'only the genuine local edit should be written remotely')
  assert.equal(JSON.parse(map.get('lc-cloud-preferences:A')).pendingImport, null)
}
console.log('preference sync: failed applyLocal recovery does not clobber remote PASS')

// Cleanup failure after a successful import must preserve later local edits.
{
  const map = new Map()
  let local = { ...defaults, tone: 'calm' }
  let remote = { ...defaults, tone: 'professional', user_id: 'A', updated_at: revision(1) }
  let failCleanup = true, writes = 0
  const store = {
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => {
      const journal = JSON.parse(value)
      if (failCleanup && journal.base?.tone === 'professional' && journal.pendingImport === null) {
        throw new Error('cleanup_failed')
      }
      map.set(key, value)
    },
  }
  const sync = createPreferenceSync({
    transport: {
      user: async () => ({ id: 'A' }),
      read: async () => clone(remote),
      compareAndSet: async (id, revision, value) => {
        assert.equal(id, 'A')
        assert.equal(revision, remote.updated_at)
        writes++
        remote = { ...clone(value), user_id: id, updated_at: new Date(Date.UTC(2026, 0, 1, 0, 0, 0, writes + 1)).toISOString() }
        return clone(remote)
      },
    },
    store,
    readOwner: () => 'A',
    readLocal: () => local,
    applyLocal: value => { local = value },
  })
  await assert.rejects(sync.sync(), /cleanup_failed/)
  assert.equal(local.tone, 'professional')
  assert.equal(JSON.parse(map.get('lc-cloud-preferences:A')).pendingImport.value.tone, 'professional')
  local = { ...local, pace: 'fast' }
  failCleanup = false
  await sync.sync()
  assert.equal(local.tone, 'professional')
  assert.equal(remote.pace, 'fast')
  assert.equal(writes, 1)
  assert.equal(JSON.parse(map.get('lc-cloud-preferences:A')).pendingImport, null)
}
console.log('preference sync: cleanup failure recovery preserves later local edit PASS')

await import('./check-preference-faults.mjs')
