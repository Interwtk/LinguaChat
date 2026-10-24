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
