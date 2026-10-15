import assert from 'node:assert/strict'
import { createSpeechController, listeningEvidence } from '../src/audio/speech.js'
assert.equal(createSpeechController({}).supported,false)
const queued=[];let cancels=0
class Utterance {constructor(text){this.text=text}}
const host={SpeechSynthesisUtterance:Utterance,speechSynthesis:{getVoices:()=>[{lang:'fr-FR'},{lang:'en-GB',localService:true}],cancel(){cancels++},speak(u){queued.push(u)}}}
const a=createSpeechController(host),b=createSpeechController(host)
let finished=0,state=''
a.play('Hello',{onState:s=>state=s,onFinished:()=>finished++})
assert.equal(queued[0].lang,'en-GB');assert.equal(state,'playing')
b.play('Good morning',{slow:true});queued[0].onend();assert.equal(finished,0)
assert.equal(queued[1].rate,0.75);assert.ok(cancels>0)
b.stop();queued[1].onend();assert.equal(finished,0)
assert.equal(listeningEvidence({plays:1,completed:1}).independent,true)
for(const stats of [{plays:1,completed:0},{plays:2,completed:2},{plays:1,completed:1,slow:true},{plays:1,completed:1,transcript:true}])assert.equal(listeningEvidence(stats).independent,false)
console.log('PASS: voice selection, unavailable fallback, overlap cancellation, stale completion and listening assistance semantics')

let completions=0
a.play('One independent listen',{onState:s=>state=s,onFinished:()=>completions++})
const ended=queued.at(-1)
ended.onend(); ended.onend(); ended.onstart()
assert.equal(completions,1,'Duplicate browser completion must not inflate listening evidence')
assert.equal(state,'stopped','Late start after completion cannot revive playback')
a.play('Audio failure',{onState:s=>state=s,onFinished:()=>completions++})
const failed=queued.at(-1)
failed.onerror(); failed.onend(); failed.onstart()
assert.equal(completions,1,'Error followed by end cannot award a completed listen')
assert.equal(state,'error')
b.play('Current audio')
const beforeCancel=cancels
ended.onend(); failed.onend(); b.stop()
assert.equal(cancels,beforeCancel+1,'Old events cannot detach the currently active controller')
const unavailable=createSpeechController({...host,speechSynthesis:{...host.speechSynthesis,getVoices(){throw new Error('Unavailable device voices')}}})
assert.equal(unavailable.play('Hello',{onState:s=>state=s}),false)
assert.equal(state,'error','Device voice failure must degrade to the accessible transcript path')
const genericEnglish=createSpeechController({...host,speechSynthesis:{...host.speechSynthesis,getVoices:()=>[{lang:'en',localService:true}]}})
genericEnglish.play('English voice')
assert.equal(queued.at(-1).lang,'en')
genericEnglish.stop()
console.log('PASS: terminal events exactly once, late events fenced, generic English and device-error fallback')

const engine = { ...host.speechSynthesis }
const brokenHost = { ...host, speechSynthesis: engine }
const playing = createSpeechController(brokenHost), next = createSpeechController(brokenHost)
playing.play('Playing on device')
engine.cancel = () => { throw new Error('Device cancellation failed') }
const queuedBefore = queued.length
assert.doesNotThrow(() => playing.stop(), 'A device cancellation error must not crash route cleanup')
assert.equal(next.play('Must not overlap', { onState:s=>state=s }), false, 'Failed cancellation cannot allow overlapping audio')
assert.equal(queued.length,queuedBefore)
assert.equal(state,'error','The next turn must expose the graceful transcript fallback')
engine.cancel = () => { cancels++ }
assert.equal(playing.stop(),true)
assert.equal(next.play('Recovered device'),true)
next.stop()
console.log('PASS: device cancellation failure is closed, no overlap/crash, and subsequent recovery remains possible')
