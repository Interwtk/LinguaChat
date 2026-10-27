import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createPreferenceImport, recoverCurrentPreferenceImport, LOCAL_IMPORT_KEY, LOCAL_IMPORT_CONFLICTS_KEY } from './preferenceImport.js'
import { captureLearnerAccess, learnerStorage } from '../auth/localLease.js'
import { activateLocalAccount } from '../auth/browserDataIsolation.js'
import { DEFAULT_TUTOR_PREFERENCES, loadTutorPreferences, saveTutorPreferences, updateTutorPreferencesDurably, setInterestSelected } from '../services/tutorPreferences.js'
import { setNativeLanguage, ensureLanguagePreferences, languagePreferencePersistence } from '../services/language.js'
import { toCloudPreferenceFields } from '../services/cloudPreferenceMapping.js'
import { createPreferenceSync } from './preferenceSync.js'
import { schedulePreferenceSync, CLOUD_PREFERENCES_RELEASED } from './runtime.js'

class Store extends Map {
  get length() { return this.size }
  key(i) { return [...this.keys()][i] ?? null }
  getItem(k) { this.before?.('get',k); const v=this.get(k)??null; this.after?.('get',k); return v }
  setItem(k,v) { this.before?.('set',k,v); this.set(k,String(v)); this.after?.('set',k,v) }
  removeItem(k) { this.before?.('remove',k); this.delete(k); this.after?.('remove',k) }
}
const source = readFileSync(new URL('../context/AppContext.jsx',import.meta.url),'utf8')
const start = source.indexOf('      applyLocal: row => {') + '      applyLocal: row => {'.length
const applyBody = source.slice(start,source.indexOf('\n      },',start))
// Execute the actual AppContext callback with its real adapter. State publication
// remains observable without adding a DOM/test dependency or duplicating the body.
const appApply = new Function('importer','setTutorPreferencesState','setLanguagePreferences','row',applyBody)
const updatePrefix = '  const updateTutorPreferences = useCallback((updates) => {'
const updateStart = source.indexOf(updatePrefix)
assert.ok(updateStart >= 0, 'normal tutor updater must be present')
const updateBody = source.slice(updateStart + updatePrefix.length, source.indexOf('\n  }, [])', updateStart))
const appUpdateTutor = new Function('setTutorPreferencesState','updateTutorPreferencesDurably','setTutorPreferenceSaveFailed','updates',updateBody)
const suffix = (physical,logical) => physical.endsWith(':'+logical)
const dataKeys = ['lc2-cloud-preference-options','lc2-tutor-preferences','lc2-native-language-code',
  'lc2-native-language-base','lc2-native-language-name','lc2-native-language','lc2-interface-language-code',
  'lc2-interface-language-base','lc2-interface-language-name']
function fixture() {
  const storage = globalThis.localStorage = new Store()
  globalThis.sessionStorage = new Store()
  assert.equal(activateLocalAccount(storage,'A').blocked,undefined)
  const tutor=saveTutorPreferences({tone:'calm',pace:'normal',learner_style:'adult',future_local_field:'fixture'})
  setNativeLanguage('es')
  learnerStorage.setItem('lc2-cloud-preference-options',JSON.stringify({english_variant:'us',conversation_register:'casual',local_option:'keep'}))
  const unrelated = ['lc2-profile','lc2-learner-model','lc2-messages'].map(k=>[k,'fixture:'+k])
  for(const [k,v] of unrelated)learnerStorage.setItem(k,v)
  const target=toCloudPreferenceFields({...tutor,tone:'professional',pace:'slow_clear'},{user_language:'ja',english_variant:'uk',conversation_register:'formal'})
  let published=0,reactTutor=tutor,reactLanguage=ensureLanguagePreferences()
  const importer=()=>createPreferenceImport({userId:'A',access:captureLearnerAccess()})
  const publish=row=>appApply(importer(),updater=>{reactTutor=updater(reactTutor);published++},updater=>{reactLanguage=updater(reactLanguage);published++},row)
  return {store:storage,target,importer,publish,unrelated,get published(){return published},get reactTutor(){return reactTutor},get reactLanguage(){return reactLanguage}}
}
function assertDurable(f, fields=f.target) {
  const result=f.importer().read()
  assert.deepEqual(result.fields,fields)
  const tutor=JSON.parse(learnerStorage.getItem('lc2-tutor-preferences'))
  assert.equal(tutor.learner_style,'adult');assert.equal(tutor.future_local_field,'fixture')
  const options=JSON.parse(learnerStorage.getItem('lc2-cloud-preference-options'))
  assert.equal(options.english_variant,fields.english_variant);assert.equal(options.conversation_register,fields.conversation_register)
  assert.equal(options.local_option,'keep')
  for(const k of ['lc2-native-language-code','lc2-native-language-base','lc2-native-language','lc2-interface-language-code','lc2-interface-language-base'])assert.equal(learnerStorage.getItem(k),fields.user_language)
  assert.equal(learnerStorage.getItem('lc2-native-language-name'),result.languagePreferences.nativeLanguage.name)
  assert.equal(learnerStorage.getItem('lc2-interface-language-name'),result.languagePreferences.nativeLanguage.name)
  assert.equal(learnerStorage.getItem('lc2-target-language'),'en')
  assert.equal(learnerStorage.getItem('lc2-auth-owner-id'),'A')
  assert.equal(learnerStorage.getItem(LOCAL_IMPORT_KEY),null)
  for(const [k,v] of f.unrelated)assert.equal(learnerStorage.getItem(k),v)
}

test('clean real AppContext import publishes only a durable result, preserving local-only fields',()=>{
  const f=fixture();f.publish(f.target)
  assertDurable(f);assert.equal(f.published,2)
  assert.equal(f.reactTutor.tone,'professional');assert.equal(f.reactTutor.future_local_field,'fixture')
  assert.equal(f.reactLanguage.nativeLanguage.base,'ja')
  let writes=0;f.store.before=(op)=>{if(op!=='get')writes++}
  f.publish(f.target);assert.equal(writes,0,'completed retries require no local writes')
})

const cuts=[...dataKeys,'prepare','completion','cleanup']
for(const cut of cuts)for(const side of ['before','after'])test(`${side} ${cut}: failure, no React success, restart, recovery and retry`,()=>{
  const f=fixture();let armed=true
  f.store[side]=(op,k,v)=>{
    const matches = cut==='prepare' ? op==='set'&&suffix(k,LOCAL_IMPORT_KEY)&&JSON.parse(v).phase==='prepared'
      :cut==='completion'?op==='set'&&suffix(k,LOCAL_IMPORT_KEY)&&JSON.parse(v).phase==='applied'
      :cut==='cleanup'?op==='remove'&&suffix(k,LOCAL_IMPORT_KEY):op==='set'&&suffix(k,cut)
    if(armed&&matches){armed=false;throw Error('injected_storage_failure')}
  }
  assert.throws(()=>f.publish(f.target),/injected_storage_failure/)
  assert.equal(armed,false,`must reach ${cut}`);assert.equal(f.published,0)
  f.store[side]=null
  // A new instance and the same durable Storage simulate a process restart.
  f.importer().recover();f.publish(f.target);assertDurable(f)
  assert.equal(f.published,2)
})

test('a second crash during recovery retains the preserved real edit',()=>{
  const f=fixture();let fail=true
  f.store.before=(op,k)=>{if(fail&&op==='set'&&suffix(k,'lc2-native-language-base'))throw Error('crash')}
  assert.throws(()=>f.publish(f.target),/crash/);fail=false
  saveTutorPreferences({...loadTutorPreferences(),pace:'fast'})
  f.store.before=(op,k)=>{if(op==='set'&&suffix(k,'lc2-interface-language-code'))throw Error('second_crash')}
  assert.throws(()=>f.importer().recover(),/second_crash/)
  f.store.before=null
  f.importer().recover();assertDurable(f,{...f.target,pace:'fast'})
})

test('post-crash tutor, language, options and new local-only edits survive recovery',()=>{
  const f=fixture()
  f.store.before=(op,k)=>{if(op==='set'&&suffix(k,'lc2-native-language-base'))throw Error('crash')}
  assert.throws(()=>f.publish(f.target),/crash/);f.store.before=null
  saveTutorPreferences({...loadTutorPreferences(),pace:'fast',extra_after_crash:{preserve:true}})
  setNativeLanguage('ar')
  learnerStorage.setItem('lc2-cloud-preference-options',JSON.stringify({...JSON.parse(learnerStorage.getItem('lc2-cloud-preference-options')),english_variant:'adaptive'}))
  const result=recoverCurrentPreferenceImport()
  assertDurable(f,{...f.target,pace:'fast',user_language:'ar',english_variant:'adaptive'})
  assert.deepEqual(result.tutorPreferences.extra_after_crash,{preserve:true})
})

for(const aba of [false,true])test(`captured import fences A→B${aba?'→A':''} during its first data write`,()=>{
  const f=fixture(),old=f.importer();let armed=true
  f.store.after=(op,k)=>{
    if(armed&&op==='set'&&suffix(k,'lc2-cloud-preference-options')){
      armed=false;activateLocalAccount(f.store,'B')
      assert.equal(learnerStorage.getItem('lc2-tutor-preferences'),null)
      assert.equal(learnerStorage.getItem('lc2-cloud-preference-options'),null)
      saveTutorPreferences({tone:'friendly',future_local_field:'B'})
      if(aba)activateLocalAccount(f.store,'A')
    }
  }
  assert.throws(()=>old.apply(f.target),/ownership|Stale|owner/)
  assert.equal(armed,false);f.store.after=null
  assert.throws(()=>old.recover(),/Stale/)
  if(!aba)activateLocalAccount(f.store,'A')
  f.importer().recover();assertDurable(f)
  activateLocalAccount(f.store,'B');assert.equal(loadTutorPreferences().future_local_field,'B');assert.equal(loadTutorPreferences().tone,'friendly')
})

test('malformed or foreign local journal fails closed and keeps forensic bytes',()=>{
  const f=fixture()
  const valid={version:1,userId:'A',phase:'prepared',before:f.importer().read().fields,value:f.target,conflicts:{}}
  for(const raw of ['', '{', 'null', JSON.stringify({...valid,version:2}),JSON.stringify({...valid,userId:'B'}),
    JSON.stringify({...valid,phase:'unknown'}),JSON.stringify({...valid,before:{}}),JSON.stringify({...valid,value:{...f.target,XP:1}}),
    JSON.stringify({...valid,conflicts:{tone:'bad'}}),JSON.stringify({...valid,extra:'bad'})]){
    learnerStorage.setItem(LOCAL_IMPORT_KEY,raw);let writes=0
    f.store.before=op=>{if(op!=='get')writes++}
    assert.throws(()=>f.importer().recover(),/Invalid local import journal/)
    assert.equal(writes,0);assert.equal(learnerStorage.getItem(LOCAL_IMPORT_KEY),raw)
    f.store.before=null
  }
})

test('denied reads and malformed recovery evidence cannot publish success',()=>{
  for(const key of [LOCAL_IMPORT_KEY,LOCAL_IMPORT_CONFLICTS_KEY,...dataKeys]){
    const f=fixture()
    f.store.before=(op,k)=>{if(op==='get'&&suffix(k,key))throw Error('read_denied')}
    assert.throws(()=>f.publish(f.target),/read_denied/);assert.equal(f.published,0)
    f.store.before=null;f.importer().recover();f.publish(f.target);assertDurable(f)
  }
  const f=fixture();learnerStorage.setItem(LOCAL_IMPORT_CONFLICTS_KEY,'{}')
  assert.throws(()=>f.publish(f.target),/Invalid local import conflicts/);assert.equal(f.published,0)
  // Recovery must validate existing evidence even when this replay generates
  // no new conflicts (for example an applied marker awaiting cleanup).
  learnerStorage.setItem(LOCAL_IMPORT_KEY,JSON.stringify({version:1,userId:'A',phase:'applied',before:f.target,value:f.target,conflicts:{}}))
  let mutations=0;f.store.before=op=>{if(op!=='get')mutations++}
  assert.throws(()=>f.importer().recover(),/Invalid local import conflicts/)
  assert.equal(mutations,0)
})

test('prepared exact revert remains recoverable conflict; applied marker proves a later revert',()=>{
  for(const phase of ['prepared','applied']){
    const f=fixture()
    f.store.before=(op,k,v)=>{if(op==='set'&&suffix(k,LOCAL_IMPORT_KEY)&&JSON.parse(v).phase==='applied')throw Error('before_marker')}
    if(phase==='applied')f.store.before=(op,k)=>{if(op==='remove'&&suffix(k,LOCAL_IMPORT_KEY))throw Error('after_marker')}
    assert.throws(()=>f.publish(f.target));f.store.before=null
    saveTutorPreferences({...loadTutorPreferences(),tone:'calm'})
    f.importer().recover()
    if(phase==='prepared'){
      assert.equal(loadTutorPreferences().tone,'professional')
      assert.equal(JSON.parse(learnerStorage.getItem(LOCAL_IMPORT_CONFLICTS_KEY)).values.tone,'calm')
    }else assert.equal(loadTutorPreferences().tone,'calm')
  }
})

test('recovery runs before language normalization on reload, and failed recovery cannot save defaults',()=>{
  const f=fixture()
  f.store.before=(op,k)=>{if(op==='set'&&suffix(k,'lc2-native-language-name'))throw Error('crash')}
  assert.throws(()=>f.publish(f.target),/crash/);f.store.before=null
  recoverCurrentPreferenceImport();const language=ensureLanguagePreferences()
  assert.equal(language.nativeLanguage.base,'ja');assertDurable(f)
  assert.ok(source.indexOf('recoverCurrentPreferenceImport()')<source.indexOf('return ensureLanguagePreferences()'))
  assert.match(source,/preferenceImportBlockedRef\.current = true/)
  assert.doesNotMatch(source,/useEffect\(\(\) => \{\s*saveTutorPreferences\(tutorPreferences\)/,'stale React effects must not overwrite durable recovery')
  assert.doesNotMatch(source,/preferenceSnapshotRef/,'readLocal must not pin a remote object over later durable edits')
})

test('actual adapter + coordinator + scheduler: manual edits stay visible and dirty cycles terminate',async()=>{
  const f=fixture();assert.equal(CLOUD_PREFERENCES_RELEASED,false)
  let remote={...f.target,user_id:'A',updated_at:'2026-10-19T00:00:00.000Z'},writes=0,passes=0
  let tutor=loadTutorPreferences(),language=ensureLanguagePreferences(),controller
  const timers=new Map();let next=0
  const sync=createPreferenceSync({
    store:captureLearnerAccess(),readOwner:()=> 'A',readLocal:()=>f.importer().read().fields,
    applyLocal:row=>appApply(f.importer(),fn=>{const after=fn(tutor);if(after!==tutor){tutor=after;controller.changed()}},fn=>{const after=fn(language);if(after!==language){language=after;controller.changed()}},row),
    transport:{user:async()=>({id:'A'}),read:async()=>structuredClone(remote),compareAndSet:async(id,rev,value)=>{
      assert.equal(id,'A');assert.equal(rev,remote.updated_at);writes++;remote={...value,user_id:id,updated_at:new Date(Date.parse(rev)+1).toISOString()};return structuredClone(remote)
    }},
  })
  controller=schedulePreferenceSync(sync,{addEventListener(){},removeEventListener(){}},{online:()=>true,schedule:fn=>{timers.set(++next,fn);return next},clear:id=>timers.delete(id)})
  const drain=async()=>{while(timers.size){assert.ok(++passes<10,'no import→React→changed hot loop');const [id,fn]=timers.entries().next().value;timers.delete(id);await fn()}}
  await drain();assert.equal(writes,0);assert.equal(passes,2)
  // Same normal save helpers used by updateTutorPreferences/updateNativeLanguage.
  tutor=saveTutorPreferences({...tutor,pace:'fast'});controller.changed()
  assert.equal(f.importer().read().fields.pace,'fast');await drain();assert.equal(remote.pace,'fast')
  const info=setNativeLanguage('ar');language={...language,nativeLanguage:info,interfaceLanguage:info};controller.changed()
  assert.equal(f.importer().read().fields.user_language,'ar');await drain();assert.equal(remote.user_language,'ar')
  assert.equal(writes,2);assert.equal(timers.size,0);controller.stop()
})

test('ordinary tutor updates rebase on newer same-account storage rather than stale React state',()=>{
  const f=fixture()
  f.publish(f.target)
  let reactState=f.reactTutor
  // Another tab saves a new pace after this tab's React state was published.
  saveTutorPreferences({...loadTutorPreferences(),pace:'fast'})
  let writes=0
  f.store.before=(op,k)=>{if(op==='set'&&suffix(k,'lc2-tutor-preferences'))writes++}
  appUpdateTutor(next=>{assert.equal(typeof next,'object','React receives a value, never an impure updater');reactState=next},updateTutorPreferencesDurably,failed=>{if(failed)throw Error('unexpected save error')},{tone:'fun'})
  assert.equal(writes,1,'one user edit produces exactly one durable write')
  assert.equal(reactState.pace,'fast')
  assert.equal(reactState.tone,'fun')
  assert.equal(loadTutorPreferences().pace,'fast')
  assert.equal(loadTutorPreferences().tone,'fun')
  // Explicitly choosing no interests is different from omitting that field.
  appUpdateTutor(next=>{assert.equal(typeof next,'object');reactState=next},updateTutorPreferencesDurably,failed=>{if(failed)throw Error('unexpected save error')},{interests:[]})
  assert.equal(writes,2,'an explicit empty-interest edit writes only once')
  assert.deepEqual(loadTutorPreferences().interests,[])
  assert.equal(loadTutorPreferences().pace,'fast')
})

test('both interest pickers use durable intent instead of stale React arrays',()=>{
  for(const path of ['../components/identity/LanguageIdentity.jsx','../components/onboarding/TutorPersonalizationStep.jsx']){
    const ui=readFileSync(new URL(path,import.meta.url),'utf8')
    assert.ok(ui.includes('updateTutorPreferences(current => ({ interests: setInterestSelected(current.interests, interest, shouldSelect) }))'),path)
    assert.ok(!ui.includes('toggleInterestId(tutorPreferences.interests, interest)'),path)
  }
  const f=fixture()
  let reactState=loadTutorPreferences()
  // This tab still shows [travel,music]. Another tab added sports before
  // the user clicked travel; that unrelated new selection must survive.
  saveTutorPreferences({...reactState,interests:['travel','music','sports']})
  let writes=0,invocations=0
  f.store.before=(op,k)=>{if(op==='set'&&suffix(k,'lc2-tutor-preferences'))writes++}
  appUpdateTutor(next=>{reactState=next},updateTutorPreferencesDurably,failed=>{if(failed)throw Error('unexpected save error')},
    current=>{invocations++;return {interests:setInterestSelected(current.interests,'travel',false)}})
  assert.equal(invocations,1,'one click resolves one durable intent')
  assert.equal(writes,1,'one click writes only once')
  assert.deepEqual(reactState.interests,['music','sports'])
  assert.deepEqual(loadTutorPreferences().interests,['music','sports'])
  f.store.before=null
  // A second tab already removed music. Clicking the stale selected chip to
  // remove it must not add it back.
  saveTutorPreferences({...loadTutorPreferences(),interests:['sports']})
  appUpdateTutor(next=>{reactState=next},updateTutorPreferencesDurably,failed=>{if(failed)throw Error('unexpected save error')},
    current=>({interests:setInterestSelected(current.interests,'music',false)}))
  assert.deepEqual(reactState.interests,['sports'])
  // Conversely, a stale unselected chip clicked to add must not remove a
  // selection another tab already made.
  saveTutorPreferences({...loadTutorPreferences(),interests:['travel','sports']})
  appUpdateTutor(next=>{reactState=next},updateTutorPreferencesDurably,failed=>{if(failed)throw Error('unexpected save error')},
    current=>({interests:setInterestSelected(current.interests,'travel',true)}))
  assert.deepEqual(reactState.interests,['travel','sports'])
  // Empty is still a valid deliberate selection after the last toggle.
  saveTutorPreferences({...loadTutorPreferences(),interests:['music']})
  appUpdateTutor(next=>{reactState=next},updateTutorPreferencesDurably,failed=>{if(failed)throw Error('unexpected save error')},
    current=>({interests:setInterestSelected(current.interests,'music',false)}))
  assert.deepEqual(reactState.interests,[])
  assert.deepEqual(loadTutorPreferences().interests,[])
})

test('interactive tutor save fails closed on denied reads, writes, and lost account lease',()=>{
  for(const failure of ['read','write','lease','corrupt']){
    const f=fixture()
    const before=learnerStorage.getItem('lc2-tutor-preferences')
    let reactState=loadTutorPreferences(),published=0,saveFailed=null
    if(failure==='corrupt')learnerStorage.setItem('lc2-tutor-preferences','{')
    if(failure==='read')f.store.before=(op,k)=>{if(op==='get'&&suffix(k,'lc2-tutor-preferences'))throw Error('read_denied')}
    if(failure==='write')f.store.before=(op,k)=>{if(op==='set'&&suffix(k,'lc2-tutor-preferences'))throw Error('quota_exceeded')}
    if(failure==='lease')f.store.before=(op,k)=>{
      if(op==='set'&&suffix(k,'lc2-tutor-preferences'))activateLocalAccount(f.store,'B')
    }
    const succeeded=appUpdateTutor(next=>{reactState=next;published++},updateTutorPreferencesDurably,value=>{saveFailed=value},{tone:'fun'})
    assert.equal(succeeded,false,`${failure}: failed write must report failure`)
    f.store.before=null
    assert.equal(published,0,`${failure}: failed write must not publish React state`)
    assert.equal(saveFailed,true,`${failure}: preference surface must receive an error`)
    assert.notEqual(reactState.tone,'fun')
    if(failure==='corrupt')assert.equal(learnerStorage.getItem('lc2-tutor-preferences'),'{')
    if(failure==='write'||failure==='read')assert.equal(learnerStorage.getItem('lc2-tutor-preferences'),before)
    if(failure==='lease'){
      assert.equal(loadTutorPreferences().tone,DEFAULT_TUTOR_PREFERENCES.tone)
      activateLocalAccount(f.store,'A')
    }
  }
})

test('intervening tutor edit aborts multi-key import and survives WAL recovery',()=>{
  const f=fixture();let armed=true
  f.store.after=(op,k)=>{
    if(armed&&op==='set'&&suffix(k,'lc2-cloud-preference-options')){
      armed=false
      saveTutorPreferences({...loadTutorPreferences(),pace:'fast'})
    }
  }
  assert.throws(()=>f.publish(f.target),/Concurrent local preference edit/)
  assert.equal(armed,false);assert.equal(f.published,0)
  assert.ok(learnerStorage.getItem(LOCAL_IMPORT_KEY),'unfinished import remains recoverable')
  f.store.after=null
  f.importer().recover()
  assertDurable(f,{...f.target,pace:'fast'})
})

test('intervening local-only options edit is not overwritten by a later import key',()=>{
  const f=fixture();let armed=true
  f.store.after=(op,k)=>{
    if(armed&&op==='set'&&suffix(k,'lc2-tutor-preferences')){
      armed=false
      const options=JSON.parse(learnerStorage.getItem('lc2-cloud-preference-options'))
      learnerStorage.setItem('lc2-cloud-preference-options',JSON.stringify({...options,local_option:'other-tab'}))
    }
  }
  assert.throws(()=>f.publish(f.target),/Concurrent local preference edit/)
  assert.equal(armed,false);assert.equal(f.published,0)
  f.store.after=null
  f.importer().recover()
  assert.equal(f.importer().read().fields.tone,f.target.tone)
  assert.equal(JSON.parse(learnerStorage.getItem('lc2-cloud-preference-options')).local_option,'other-tab')
  assert.equal(learnerStorage.getItem(LOCAL_IMPORT_KEY),null)
})

test('publication reflects a real edit made at the final cleanup boundary',()=>{
  const f=fixture();let armed=true
  f.store.after=(op,k)=>{
    if(armed&&op==='remove'&&suffix(k,LOCAL_IMPORT_KEY)){
      armed=false;saveTutorPreferences({...loadTutorPreferences(),pace:'fast'})
    }
  }
  f.publish(f.target)
  assert.equal(f.reactTutor.pace,'fast')
  assertDurable(f,{...f.target,pace:'fast'})
})

test('actual startup initializer fails closed before normalizers on corrupt or unreadable WAL',()=>{
  const prefix='const [languagePreferences, setLanguagePreferences] = useState(() => {'
  const begin=source.indexOf(prefix)+prefix.length
  const body=source.slice(begin,source.indexOf('\n  })',begin))
  const initialize=new Function('recoverCurrentPreferenceImport','ensureLanguagePreferences','preferenceImportBlockedRef','languagePreferencePersistence',body)
  for(const denial of ['corrupt','read','lease']){
    const f=fixture();learnerStorage.setItem(LOCAL_IMPORT_KEY,'{')
    let normalizations=0,writes=0
    f.store.before=(op,k)=>{
      if(op!=='get')writes++
      if(op==='get'&&((denial==='read'&&suffix(k,LOCAL_IMPORT_KEY))||(denial==='lease'&&k==='lc2-auth-owner-id')))throw Error('read_denied')
    }
    const blocked={current:false}
    initialize(recoverCurrentPreferenceImport,()=>{normalizations++;return ensureLanguagePreferences()},blocked,languagePreferencePersistence)
    assert.equal(blocked.current,true);assert.equal(normalizations,0);assert.equal(writes,0)
  }
})

test('fixed English target is recovered when its own write fails',()=>{
  const f=fixture();learnerStorage.setItem('lc2-target-language','fr')
  f.store.before=(op,k)=>{if(op==='set'&&suffix(k,'lc2-target-language'))throw Error('target_write_denied')}
  assert.throws(()=>f.publish(f.target),/target_write_denied/);assert.equal(f.published,0)
  f.store.before=null;f.importer().recover();assertDurable(f)
})
