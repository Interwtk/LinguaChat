import assert from 'node:assert/strict'
import test from 'node:test'
import { createPreferenceSync } from './preferenceSync.js'
import { createPreferenceTransport } from './preferenceTransport.js'
import { toCloudPreferenceFields } from '../services/cloudPreferenceMapping.js'
import { captureLearnerAccess } from '../auth/localLease.js'
import { activateLocalAccount } from '../auth/browserDataIsolation.js'
import { schedulePreferenceSync } from './runtime.js'

const defaults = toCloudPreferenceFields(), clone = x => structuredClone(x)
const key = 'lc-cloud-preferences:A'
const row = value => ({ ...clone(value), user_id: 'A', updated_at: '2026-10-01T00:00:00.000Z' })
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }

// Recreate the coordinator after every injected crash. Only Storage and the
// server survive; no in-memory journal/promise can accidentally rescue a test.
function device(server = { value: row(defaults), writes: 0 }, base = defaults) {
  let local = clone(defaults), owner = 'A', generation = 1
  const map = new Map(), statuses = [], hooks = {}, calls = { reads: 0, applies: 0 }
  if (base) map.set(key, JSON.stringify({ version: 1, userId: 'A', base: clone(base), backup: clone(local), conflicts: {} }))
  const hit = name => hooks[name]?.()
  const store = {
    getItem(k) { hit('get'); return map.get(k) ?? null },
    setItem(k, value) {
      const j = JSON.parse(value)
      hit(j.pendingImport ? 'stage' : j.base ? 'cleanup' : 'backup')
      map.set(k, value)
      hit('stored')
    },
  }
  const options = {
    store, readOwner: () => owner,
    captureAccess: () => { const g = generation; return { valid: () => g === generation } },
    readLocal: () => { hit('local'); return local },
    applyLocal(value) { hit('apply'); calls.applies++; local = value; hit('applied') },
    onStatus: s => statuses.push(s),
    transport: {
      async user() { const id = owner; await hit('user'); return { id: hooks.userAsCurrent ? owner : id } },
      async read(id) { calls.reads++; await hit('read'); assert.equal(id, owner); return clone(server.value) },
      async compareAndSet(id, revision, value, guard = () => {}) {
        await hit('cas'); guard(); assert.equal(id, owner)
        if ((server.value?.updated_at ?? null) !== revision) return null
        server.writes++
        server.value = { ...clone(value), user_id: id, updated_at: new Date(Date.parse(server.value?.updated_at ?? '2026-10-01') + 1).toISOString() }
        await hit('accepted')
        return clone(server.value)
      },
    },
  }
  return {
    server, map, hooks, calls, statuses, options,
    start: () => createPreferenceSync(options),
    get journal() { return JSON.parse(map.get(key) ?? 'null') },
    get local() { return local }, set local(v) { local = v },
    switch(id) { owner = id; generation++ },
  }
}

test('identity is captured before awaiting getUser; a newly returned B is never adopted', async () => {
  const d = device(), wait = deferred()
  d.hooks.user = () => wait.promise
  d.hooks.userAsCurrent = true
  const pending = d.start().sync()
  d.switch('B'); wait.resolve()
  await assert.rejects(pending, /account_changed/)
  assert.equal(d.calls.reads, 0); assert.equal(d.server.writes, 0); assert.equal(d.calls.applies, 0)
  assert.equal(d.map.has('lc-cloud-preferences:B'), false)
})

for (const boundary of ['user', 'read', 'cas']) test(`A→B→A new lease rejects old work at ${boundary}`, async () => {
  const d = device(), wait = deferred(), reached = deferred()
  d.local = { ...defaults, tone: 'calm' }
  d.hooks[boundary] = () => { reached.resolve(); return wait.promise }
  const pending = d.start().sync()
  await reached.promise
  d.switch('B'); d.switch('A'); wait.resolve()
  await assert.rejects(pending, /account_changed/)
  assert.equal(d.server.writes, 0); assert.equal(d.calls.applies, 0)
  assert.notEqual(d.statuses.at(-1), 'synced')
})

test('real localLease, without cancel(), fences the previous A generation', async () => {
  class Store extends Map {
    get length() { return this.size }
    key(i) { return [...this.keys()][i] ?? null }
    getItem(k) { return this.get(k) ?? null }
    setItem(k, v) { this.set(k, String(v)) }
    removeItem(k) { this.delete(k) }
  }
  const oldLocal = globalThis.localStorage, oldSession = globalThis.sessionStorage
  try {
    globalThis.localStorage = new Store(); globalThis.sessionStorage = new Store()
    activateLocalAccount(globalThis.localStorage, 'A')
    const d = device(), wait = deferred(), reached = deferred()
    d.options.captureAccess = captureLearnerAccess
    d.hooks.read = () => { reached.resolve(); return wait.promise }
    const pending = d.start().sync(); await reached.promise
    activateLocalAccount(globalThis.localStorage, 'B'); activateLocalAccount(globalThis.localStorage, 'A')
    wait.resolve()
    await assert.rejects(pending, /account_changed/)
    assert.equal(d.server.writes, 0); assert.equal(d.calls.applies, 0)
  } finally { globalThis.localStorage = oldLocal; globalThis.sessionStorage = oldSession }
})

test('an in-place interests edit during CAS survives and converges', async () => {
  const d = device(), wait = deferred(), reached = deferred()
  d.local = { ...defaults, tone: 'calm', interests: ['travel'] }
  d.hooks.accepted = () => { reached.resolve(); return wait.promise }
  const pending = d.start().sync(); await reached.promise
  d.local.interests.push('music'); delete d.hooks.accepted; wait.resolve()
  await pending
  assert.deepEqual(d.local.interests, ['travel', 'music'])
  assert.deepEqual(d.server.value.interests, ['travel', 'music'])
  assert.equal(d.server.writes, 2)
})

test('empty/corrupt journal is retained and fails before network', async () => {
  for (const raw of ['', '{', 'false', JSON.stringify({version:2,userId:'A',base:null,backup:defaults,conflicts:{}})]) {
    const d = device(); d.map.set(key, raw)
    await assert.rejects(d.start().sync(), /invalid_sync_journal/)
    assert.equal(d.map.get(key), raw); assert.equal(d.calls.reads, 0); assert.equal(d.calls.applies, 0)
  }
})

test('invalid local preference values fail closed rather than upload untrusted objects', async () => {
  const d = device(); d.local = { ...defaults, interests: { token: 'fixture-only' } }
  await assert.rejects(d.start().sync(), /invalid_local_preferences/)
  assert.equal(d.server.writes, 0); assert.equal(d.calls.applies, 0)
})

test('transport rejects non-string/coerced or out-of-range revisions before any query', async () => {
  let queries = 0
  const t = createPreferenceTransport({ auth: { getUser: async () => ({data:{user:{id:'A'}}}) }, from() { queries++; throw Error('unexpected_query') } })
  for (const revision of [0, 1, true, [], {}, '', '1', 'garbage', '+275760-09-13T00:00:00.000Z']) {
    await assert.rejects(t.compareAndSet('A', revision, defaults), /invalid_remote_revision/)
  }
  assert.equal(queries, 0)
})

test('lease guard runs after transport getUser and before issuing a mutation', async () => {
  const wait = deferred(); let valid = true, queries = 0
  const t = createPreferenceTransport({auth:{getUser:async()=>{await wait.promise;return {data:{user:{id:'A'}}}}},from(){queries++;throw Error('unexpected_query')}})
  const pending = t.compareAndSet('A', null, defaults, () => { if (!valid) throw Error('account_changed') })
  valid = false; wait.resolve()
  await assert.rejects(pending, /account_changed/); assert.equal(queries, 0)
})

test('scheduler retains changed() while a coalesced request is in flight', async () => {
  const timers = new Map(), listeners = new Map(), wait = deferred()
  let next = 0, pending = null, calls = 0
  const scheduler = schedulePreferenceSync({
    sync() {
      if (pending) return pending
      calls++
      pending = wait.promise.finally(() => { pending = null })
      return pending
    }, cancel() {},
  }, {addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:k=>listeners.delete(k)}, {
    online: () => true,
    schedule: fn => { const id = ++next; timers.set(id,fn); return id },
    clear: id => timers.delete(id),
  })
  const fire = () => { const [id, fn] = timers.entries().next().value; timers.delete(id); return fn() }
  const first = fire()
  scheduler.changed()
  const second = timers.size ? fire() : Promise.resolve()
  wait.resolve(); await Promise.all([first, second])
  assert.ok(timers.size > 0, 'a dirty event during the request needs a fresh pass after it settles')
  await fire(); assert.equal(calls, 2)
  scheduler.stop(); assert.equal(timers.size, 0)
})

test('a local edit during final journal cleanup cannot return synced prematurely', async () => {
  const d = device(); let armed = true
  d.hooks.cleanup = () => { if (armed && d.calls.applies) { armed = false; d.local = { ...d.local, pace: 'fast' } } }
  await d.start().sync()
  assert.equal(d.server.value.pace, 'fast'); assert.equal(d.server.writes, 1)
  assert.deepEqual(d.journal.base, d.local)
})

test('recovery retains an ambiguous explicit revert as conflict evidence', async () => {
  const d = device({ value: row({...defaults,tone:'professional'}), writes:0 })
  d.local = { ...defaults, tone:'calm' }
  // A remote-only change on pace (not already a conflict) is applied, then the
  // learner reverts to the pre-import value after cleanup fails.
  d.server.value.pace = 'fast'
  d.hooks.cleanup = () => { if (d.calls.applies) throw Error('crash') }
  await assert.rejects(d.start().sync(), /crash/)
  d.local.pace = 'normal'; delete d.hooks.cleanup
  await d.start().sync()
  assert.equal(d.journal.conflicts.pace, 'normal', 'before/value alone cannot prove whether this is old state or a new revert; retain it')
})

const crashCuts = ['journal-before', 'journal-after', 'read', 'after-read', 'cas', 'accepted',
  'stage-before', 'stage-after', 'apply', 'applied', 'cleanup-before', 'cleanup-after', 'before-return']
for (const cut of crashCuts) test(`crash matrix: ${cut}, restart, new edit, convergence, bounded writes`, async () => {
  const d = device({value: row({...defaults,tone:'professional'}), writes:0})
  d.local = {...defaults,tone:'calm',learning_goal:'work'}
  let armed = true, localReads = 0
  const fault = phase => { if (armed && phase === cut) { armed = false; throw Error('injected_crash') } }
  const originalSet = d.options.store.setItem
  d.options.store.setItem = (k,v) => {
    const j = JSON.parse(v), phase = j.pendingImport ? 'stage' : d.calls.applies ? 'cleanup' : 'journal'
    fault(phase+'-before'); originalSet(k,v); fault(phase+'-after')
  }
  for (const phase of ['read','cas','accepted','apply','applied']) d.hooks[phase] = () => fault(phase)
  d.hooks.local = () => { localReads++; if (localReads === 2) fault('after-read'); if (d.calls.applies) fault('before-return') }
  const backup = clone(d.journal.backup)
  await assert.rejects(d.start().sync(), /injected_crash/)
  assert.equal(armed, false, `must actually reach ${cut}`)
  const beforeRetry = d.server.writes
  assert.equal(d.statuses.at(-1), 'pending')
  d.local = {...d.local,pace:'fast'}
  const result = await d.start().sync()
  assert.equal(result.status, 'synced'); assert.equal(d.statuses.at(-1), 'synced')
  assert.equal(d.local.tone, 'professional'); assert.equal(d.local.learning_goal, 'work'); assert.equal(d.local.pace, 'fast')
  assert.deepEqual(row(d.local), {...d.server.value,updated_at:row(d.local).updated_at})
  assert.deepEqual(d.journal.base, d.local); assert.deepEqual(d.journal.backup, backup)
  assert.equal(d.journal.pendingImport, null); assert.equal(d.journal.conflicts.tone, 'calm')
  assert.equal(d.server.value.user_id, 'A'); assert.equal(d.journal.userId, 'A')
  assert.equal(d.server.writes, beforeRetry + 1)
  const size = d.map.get(key).length, writes = d.server.writes
  for (let i=0;i<5;i++) await d.start().sync()
  assert.equal(d.server.writes,writes); assert.equal(d.map.get(key).length,size)
})

test('first-import backup quota and denied journal read fail closed before network', async () => {
  for (const boundary of ['get','backup']) {
    const d = device({value:null,writes:0},null); d.local = {...defaults,tone:'calm'}
    d.hooks[boundary] = () => { throw Error('storage_denied') }
    await assert.rejects(d.start().sync(), /storage_denied/)
    assert.equal(d.calls.reads,0); assert.equal(d.server.writes,0); assert.equal(d.calls.applies,0)
    delete d.hooks[boundary]
    await d.start().sync()
    assert.equal(d.journal.backup.tone,'calm'); assert.equal(d.server.value.tone,'calm'); assert.equal(d.server.writes,1)
  }
})

for (const boundary of ['get','local','stage','applied','cleanup']) test(`account switch at synchronous ${boundary} boundary fences follow-up work`, async () => {
  const d = device({value:row({...defaults,tone:'professional'}),writes:0})
  let armed = true
  d.hooks[boundary] = () => {
    if (armed && (boundary !== 'cleanup' || d.calls.applies)) { armed=false; d.switch('B') }
  }
  await assert.rejects(d.start().sync(), /account_changed/)
  assert.equal(armed,false); assert.equal(d.server.writes,0)
  assert.equal(d.map.has('lc-cloud-preferences:B'),false); assert.notEqual(d.statuses.at(-1),'synced')
  if (!['applied','cleanup'].includes(boundary)) assert.equal(d.calls.applies,0)
})

test('new generation can start without waiting for old A; old completion cannot clear its promise', async () => {
  const d = device(), first = deferred(), second = deferred(), reached = deferred()
  let reads = 0
  d.hooks.read = () => { reads++; reached.resolve(); return reads === 1 ? first.promise : second.promise }
  const sync = d.start(), a = sync.sync(); await reached.promise
  d.switch('B'); d.switch('A')
  const b = sync.sync(); assert.notEqual(a,b)
  first.resolve(); await assert.rejects(a,/account_changed/)
  assert.equal(sync.sync(),b)
  second.resolve(); await b
  assert.equal(d.server.writes,0); assert.equal(d.statuses.at(-1),'synced')
})

for (const conflict of [false,true]) test(`two devices with forced CAS race: ${conflict ? 'same-field conflict' : 'disjoint edits'}`, async () => {
  const server = {value:row(defaults),writes:0}, a = device(server), b = device(server)
  a.local = {...defaults,tone:'calm'}
  b.local = {...defaults,...(conflict ? {tone:'professional'} : {pace:'fast'})}
  const readyA=deferred(),readyB=deferred(),goA=deferred(),goB=deferred()
  a.hooks.cas=()=>{readyA.resolve();return goA.promise}
  b.hooks.cas=()=>{readyB.resolve();return goB.promise}
  const sa=a.start(),sb=b.start(),pa=sa.sync(),pb=sb.sync()
  await Promise.all([readyA.promise,readyB.promise]); goA.resolve(); await pa; goB.resolve(); await pb
  assert.equal(server.value.tone,'calm'); assert.equal(server.value.pace,conflict?'normal':'fast')
  assert.equal(server.writes,conflict?1:2)
  assert.equal(b.journal.conflicts.tone,conflict?'professional':undefined)
  await sa.sync(); assert.deepEqual(a.local,b.local)
  const previousWrites=server.writes
  await Promise.all([sa.sync(),sb.sync()]); assert.equal(server.writes,previousWrites)
  if (conflict) {
    b.local={...b.local,tone:'professional'}; await sb.sync(); await sa.sync()
    assert.equal(server.value.tone,'professional'); assert.deepEqual(a.local,b.local)
    assert.equal(server.writes,previousWrites+1,'a fresh edit is not replaced by old conflict recovery')
  }
})

test('permanent CAS contention terminates after four attempts and remains retryable', async () => {
  const d=device(); d.local={...defaults,tone:'calm'}
  let attempts=0
  const original=d.options.transport.compareAndSet
  d.options.transport.compareAndSet=async()=>{attempts++;return null}
  await assert.rejects(d.start().sync(),/sync_busy/); assert.equal(attempts,4)
  assert.equal(d.calls.applies,0); assert.equal(d.journal.base.tone,defaults.tone)
  d.options.transport.compareAndSet=original; await d.start().sync(); assert.equal(d.server.writes,1)
})

test('malformed journals retain forensic bytes and never touch network or local state', async () => {
  const valid={version:1,userId:'A',base:defaults,backup:defaults,conflicts:{}}
  for (const corrupt of [
    {...valid,userId:'B'}, {...valid,version:0}, {...valid,backup:null}, {...valid,base:{}},
    {...valid,conflicts:{mastery:1}}, {...valid,conflicts:[]}, {...valid,token:'fixture'},
    {...valid,pendingImport:{}}, {...valid,pendingImport:{before:defaults,value:{...defaults,tone:'bad'}}},
    {...valid,pendingImport:{before:defaults,value:defaults,progress:1}},
    {...valid,base:{...defaults,XP:1}}, {...valid,backup:{...defaults,interests:['unknown-interest']}},
  ]) {
    const d=device(),raw=JSON.stringify(corrupt); d.map.set(key,raw)
    await assert.rejects(d.start().sync(),/invalid_sync_journal/)
    assert.equal(d.map.get(key),raw); assert.equal(d.calls.reads,0); assert.equal(d.server.writes,0); assert.equal(d.calls.applies,0)
  }
})

test('invalid remote fields and revisions cannot become a baseline', async () => {
  for (const value of [row({...defaults,tone:'bad'}),{...row(defaults),pace:undefined},
    {...row(defaults),updated_at:null}, {...row(defaults),updated_at:'garbage'}, {...row(defaults),interests:['not-supported']}]) {
    const d=device({value,writes:0})
    await assert.rejects(d.start().sync(),/invalid_remote/)
    assert.deepEqual(d.local,defaults); assert.deepEqual(d.journal.base,defaults)
    assert.equal(d.calls.applies,0); assert.equal(d.server.writes,0)
  }
})

test('unrelated local fields never enter remote, baseline, backup, conflicts, or imports', async () => {
  const d=device({value:null,writes:0},null)
  d.local={...defaults,user_id:'B',progress:17,XP:40,mastery:99,messages:['private'],token:'fixture',billing:{plan:'private'}}
  await d.start().sync()
  assert.deepEqual(Object.keys(d.server.value).sort(),[...Object.keys(defaults),'user_id','updated_at'].sort())
  assert.equal(d.server.value.user_id,'A'); assert.deepEqual(d.local,defaults)
  assert.deepEqual(d.journal.base,defaults); assert.deepEqual(d.journal.backup,defaults); assert.deepEqual(d.journal.conflicts,{})
})

test('signed-out transport rejects even a missing caller-supplied owner', async () => {
  let queries=0
  const t=createPreferenceTransport({auth:{getUser:async()=>({data:{user:null}})},from(){queries++;throw Error('unexpected_query')}})
  await assert.rejects(t.read(undefined),/account_changed/)
  await assert.rejects(t.compareAndSet(undefined,null,defaults),/account_changed/)
  assert.equal(queries,0)
})

test('a CAS committed for A before logout may not import or mark the new owner synced', async () => {
  const d=device(), wait=deferred(), reached=deferred()
  d.local={...defaults,tone:'calm'}
  d.hooks.accepted=()=>{reached.resolve();return wait.promise}
  const pending=d.start().sync(); await reached.promise
  assert.equal(d.server.writes,1); d.switch('B'); d.local={...defaults,tone:'professional'}
  wait.resolve(); await assert.rejects(pending,/account_changed/)
  assert.equal(d.local.tone,'professional'); assert.equal(d.calls.applies,0)
  assert.equal(d.server.value.user_id,'A'); assert.equal(d.map.has('lc-cloud-preferences:B'),false)
  assert.notEqual(d.statuses.at(-1),'synced')
})

test('concurrent first inserts refetch after a null-revision collision and preserve losing backup', async () => {
  const server={value:null,writes:0},a=device(server,null),b=device(server,null)
  a.local={...defaults,tone:'calm'}; b.local={...defaults,tone:'professional'}
  const ready=deferred(),go=deferred(); b.hooks.cas=()=>{ready.resolve();return go.promise}
  const pb=b.start().sync(); await ready.promise; await a.start().sync(); go.resolve(); await pb
  assert.equal(server.writes,1); assert.equal(b.local.tone,'calm')
  assert.equal(b.journal.backup.tone,'professional'); assert.equal(b.journal.conflicts.tone,'professional')
})
