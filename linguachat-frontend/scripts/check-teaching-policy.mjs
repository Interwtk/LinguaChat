import assert from 'node:assert/strict'
import { observeTeaching, chooseTeaching, teachingEstimates, retentionProfile } from '../src/learning/engine/teachingPolicy.js'
import { createLearnerModel, recordItemAttempt, scheduleReview, markRecurringError } from '../src/learning/engine/learnerModel.js'
import { buildSessionPlan, dayKeyFor } from '../src/learning/engine/session.js'
import { ARC } from '../src/learning/episodes/index.js'
function evidence(model, format, success, n, extra={}) {
 observeTeaching(model,{id:`teach:${n}`,capability:'same-can-do',format,session:`teach-day:${n}`,context:'home',at:n*10,success:null,...extra})
 observeTeaching(model,{id:`probe:${n}`,capability:'same-can-do',format:'recall',session:`probe-day:${n}`,context:'unseen',at:n*10+1,independent:true,assisted:false,retried:false,success,...extra})
}
const a={},b={}
for(let i=1;i<=8;i++){evidence(a,'word_order',true,i);evidence(a,'fill_blank',false,i+8);evidence(b,'word_order',false,i);evidence(b,'fill_blank',true,i+8)}
const pool=['word_order','fill_blank']
let differences=0;const explored=new Set()
for(let i=0;i<100;i++){const x=chooseTeaching(a,'same-can-do',pool,String(i)),y=chooseTeaching(b,'same-can-do',pool,String(i));if(x.format!==y.format)differences++;if(x.reason==='exploration')explored.add(x.format)}
assert.ok(differences>30);assert.equal(explored.size,2)
assert.equal(chooseTeaching(a,'unknown',pool,'seed'),null)
const unknown={};for(let i=1;i<8;i++)evidence(unknown,'word_order',true,i,{assisted:true})
assert.ok(teachingEstimates(unknown,'same-can-do',pool).every(x=>x.count===0))
const before=chooseTeaching(a,'same-can-do',pool,'stable')
for(let i=30;i<46;i++){evidence(a,'word_order',false,i);evidence(a,'fill_blank',true,i+20)}
let reversed=0;for(let i=0;i<100;i++)if(chooseTeaching(a,'same-can-do',pool,String(i)).format==='fill_blank')reversed++
assert.ok(reversed>60)
assert.equal(observeTeaching(a,a.teachingHistory.at(-1)),false)
assert.ok(a.teachingHistory.length<=80)
assert.equal(chooseTeaching({},'same-can-do',pool),null)
console.log('PASS: different longitudinal histories, unknown data, assisted exclusion, exploration, reversal, bounded idempotence')

const explanations = { teachingHistory: a.teachingHistory.map(x => ({...x, instruction: x.format === 'word_order' ? 'concise' : 'worked_example'})) }
assert.ok(chooseTeaching(explanations,'same-can-do',['concise','worked_example'],'stable','instruction'))
const channels = { teachingHistory: a.teachingHistory.map(x => ({...x, channel: x.format === 'word_order' ? 'reading' : 'listening'})) }
assert.ok(chooseTeaching(channels,'same-can-do',['reading','listening'],'stable','channel'))
console.log('PASS: the same longitudinal policy supports explanation and listening/reading channel choices')

const repeated = {}
observeTeaching(repeated, { id: 'instruction', capability: 'greeting', format: 'free_reply', session: 'learning-day:1', at: 1, success: null })
const probe = { capability: 'greeting', format: 'recall', session: 'learning-day:2', independent: true, assisted: false, retried: false }
observeTeaching(repeated, { ...probe, id: 'unknown', at: 2, success: null })
observeTeaching(repeated, { ...probe, id: 'helped', at: 3, success: true, assisted: true })
observeTeaching(repeated, { ...probe, id: 'first-valid-failure', at: 4, success: false })
for (let i = 0; i < 20; i++) observeTeaching(repeated, { ...probe, id: `reopen:${i}`, at: 5 + i, success: true })
const estimate = teachingEstimates(repeated, 'greeting', ['free_reply'])[0]
assert.equal(estimate.count, 1, 'Reopening blocks on the same learning-day cannot manufacture longitudinal confidence')
assert.equal(estimate.retention, 1 / 3, 'Later massed successes must preserve the first independent failure')
assert.equal(chooseTeaching(repeated, 'greeting', ['free_reply', 'word_order'], 'stable'), null, 'One retention occasion cannot establish a preference')
console.log('PASS: one first valid retention probe per capability/learning-day; unknown and assisted are not failures')

const DAY = 86400000, start = Date.parse('2026-10-01T12:00:00Z')
function longitudinal(model, capability, outcomes, offset = 0) {
  if (!model.teachingHistory?.length) observeTeaching(model, {id:`initial:${capability}`, capability, format:'free_reply', session:'learning-day:initial', at:start, success:null})
  outcomes.forEach((success, i) => {
    const at = start + (offset + i + 1) * DAY
    observeTeaching(model, {id:`probe:${capability}:${offset+i}`, capability, format:'free_reply', session:`learning-day:${dayKeyFor(at)}`, at, success, independent:true, assisted:false, retried:false})
  })
}
const retained = createLearnerModel(), slipping = createLearnerModel()
longitudinal(retained,'introduction',[true,true,true,true,true,true])
longitudinal(slipping,'introduction',[false,false,false,false,false,false])
const today = start + 6 * DAY
recordItemAttempt(retained,'hi',{correct:true,independent:true,capability:'introduction',atMs:today})
recordItemAttempt(slipping,'hi',{correct:true,independent:false,capability:'introduction',atMs:today})
const retainedDue = Date.parse(retained.languageItems.hi.nextReviewAt)
assert.equal((retainedDue-today)/DAY,30,'Distinct independent retrieval successes earn a bounded interval using the existing ladder')
assert.equal((Date.parse(slipping.languageItems.hi.nextReviewAt)-today)/DAY,1,'Assisted repair after later failure returns earlier')
for(let i=1;i<=20;i++) recordItemAttempt(retained,'hi',{correct:true,independent:true,capability:'introduction',atMs:today+i*1000})
assert.equal(Date.parse(retained.languageItems.hi.nextReviewAt),retainedDue,'Massed success cannot push the independent due-date anchor')
recordItemAttempt(retained,'hi',{correct:true,independent:false,capability:'introduction',atMs:today+100000})
assert.ok(Date.parse(retained.languageItems.hi.nextReviewAt)<=retainedDue,'Help cannot defer independent review')
longitudinal(slipping,'introduction',[true,true,true,true,true,true],6)
const recoveredAt = start + 12*DAY
recordItemAttempt(slipping,'hi',{correct:true,independent:true,capability:'introduction',atMs:recoveredAt})
assert.equal((Date.parse(slipping.languageItems.hi.nextReviewAt)-recoveredAt)/DAY,30,'A failing hypothesis reverses after new independent days')
assert.equal(retentionProfile(retained,'missing',today).samples,0)
const assistedOnly = createLearnerModel()
for(let i=0;i<6;i++) observeTeaching(assistedOnly,{id:`help:${i}`,capability:'introduction',format:'choice',session:`day:${i}`,at:start+i*DAY,success:true,independent:false,assisted:true})
assert.equal(retentionProfile(assistedOnly,'introduction',today).samples,0)
assert.equal(scheduleReview({}, {correct:true,independent:false,atMs:today,retention:retentionProfile(assistedOnly,'introduction',today)}).nextReviewAt,new Date(today+DAY).toISOString())
assert.equal(retentionProfile(slipping,'introduction',today).lastSuccess,false,'Future observations cannot affect the current plan')

const ordered = createLearnerModel()
longitudinal(ordered,'introduction',[true,true,true])
// A second capability has an explicit earlier instruction, not missing evidence.
observeTeaching(ordered,{id:'ask:initial',capability:'ask_name',format:'free_reply',session:'initial',at:start,success:null})
longitudinal(ordered,'ask_name',[false,false,false])
const planAt=start+4*DAY
const dueItem = days => ({status:'learning',learningState:'practicing',nextReviewAt:new Date(planAt-days*DAY).toISOString()})
ordered.languageItems={hi:dueItem(1),whats_your_name:dueItem(1)}
const plan = buildSessionPlan(ordered,[],{atMs:planAt,durationMode:'deep'})
assert.equal(plan.blocks[0].payload.itemId,'whats_your_name','Later failure orders an equally overdue core review before stable recall')
ordered.languageItems.hi=dueItem(22)
assert.equal(buildSessionPlan(ordered,[],{atMs:planAt}).blocks[0].payload.itemId,'hi','Aging preserves a route for stable reviews; no permanent suppression')
ordered.signalLog=[`${dayKeyFor(planAt)}:session:review:hi:completed`]
assert.ok(!buildSessionPlan(ordered,[],{atMs:planAt,durationMode:'deep'}).blocks.some(b=>b.id==='review:hi'),'Completed same-day review cannot be manufactured again by replanning')
const mainA=buildSessionPlan(retained,ARC,{atMs:planAt}).blocks.find(b=>b.type==='start_episode')
const mainB=buildSessionPlan(slipping,ARC,{atMs:planAt}).blocks.find(b=>b.type==='start_episode')
assert.deepEqual(mainA,mainB,'Adaptation preserves the required main objective and its prerequisites')
const frequencyA=createLearnerModel(),frequencyB=createLearnerModel()
frequencyA.canDo={introduce_self:{status:'can_do'}};frequencyB.canDo={introduce_self:{status:'can_do'}}
longitudinal(frequencyA,'introduction',[true,true,true]);longitudinal(frequencyB,'introduction',[false,false,false])
assert.ok(!buildSessionPlan(frequencyA,[],{atMs:planAt,durationMode:'deep'}).blocks.some(b=>b.type==='extra_practice'),'Stable retrieval reduces optional repetition before it is due')
assert.ok(buildSessionPlan(frequencyB,[],{atMs:planAt,durationMode:'deep'}).blocks.some(b=>b.type==='extra_practice'),'Later failure retains optional practice pressure')
assert.ok(buildSessionPlan(frequencyA,[],{atMs:start+34*DAY,durationMode:'deep'}).blocks.some(b=>b.type==='extra_practice'),'Stable capability returns after a finite spaced interval')
const errorModel=createLearnerModel()
errorModel.languageItems={hi:dueItem(1),whats_your_name:dueItem(1)}
markRecurringError(errorModel,'question_order',planAt);markRecurringError(errorModel,'question_order',planAt)
assert.equal(buildSessionPlan(errorModel,[],{atMs:planAt}).blocks[0].objective,'ask_name','Recent recurring errors can increase priority')
console.log('PASS V2: real scheduler spacing, reversal, same-day cap, assistance exclusion, fair review ordering, repetition frequency and fixed main objective')
