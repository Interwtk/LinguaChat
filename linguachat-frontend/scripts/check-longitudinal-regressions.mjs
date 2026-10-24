import assert from 'node:assert/strict'
import { mergeLanguageItems, mergeEpisodeRuns, mergeCanDoEvidence, createLearnerModel } from '../src/learning/engine/learnerModel.js'
import { makeRunId } from '../src/learning/engine/episodeRuns.js'
import { dayKeyFor } from '../src/learning/engine/session.js'
const m=createLearnerModel(),at=Date.parse('2026-10-15T12:00:00Z')
m.episodeRuns.x=Array.from({length:12},(_,i)=>({runId:`x:${dayKeyFor(at)}:${i+10}`}))
assert.equal(makeRunId(m,'x',at),`x:${dayKeyFor(at)}:22`)
const old={x:{streak:5,lastSeenAt:'2026-10-14T00:00:00Z'}}
const recent={x:{streak:0,lastSeenAt:'2026-10-15T00:00:00Z'}}
assert.equal(mergeLanguageItems(old,recent).x.streak,0)
assert.equal(mergeLanguageItems(recent,old).x.streak,0)
const completed={episodeId:'x',runId:'r',completedAt:'2026-10-15T00:00:00Z',independentEvidence:true,assistanceUsed:1,formatsUsed:['free_reply']}
const stale={episodeId:'x',runId:'r',completedAt:null,independentEvidence:false,assistanceUsed:0,formatsUsed:[]}
for(const [a,b] of [[completed,stale],[stale,completed]]){
 const out=mergeEpisodeRuns({x:[a]},{x:[b]}).x[0]
 assert.equal(out.independentEvidence,true);assert.equal(out.assistanceUsed,1);assert.deepEqual(out.formatsUsed,['free_reply'])
}
console.log('PASS: monotonic bounded run IDs, failure streak reset and completed evidence preserve in both merge orders')

const earned={goal:{attempts:5,successes:4,independentSuccesses:2,status:'can_do',contexts:['home'],independentPracticedAt:'2026-10-14T00:00:00Z',independentPracticeSessionId:'learning-day:2026-10-14'}}
const assisted={goal:{attempts:1,successes:1,independentSuccesses:0,status:'learning',contexts:['cafe'],lastPracticedAt:'2026-10-15T00:00:00Z'}}
for (const [a,b] of [[earned,assisted],[assisted,earned]]) {
 const out=mergeCanDoEvidence(a,b).goal
 assert.equal(out.independentSuccesses,2);assert.equal(out.status,'can_do')
 assert.equal(out.independentPracticeSessionId,'learning-day:2026-10-14')
 assert.equal(out.contexts.length,2)
 assert.equal(mergeCanDoEvidence({goal:out},{goal:out}).goal.independentSuccesses,2)
}
console.log('PASS: same-capability stale saves preserve independent provenance and cannot inflate counters')
