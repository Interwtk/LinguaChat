import assert from 'node:assert/strict'
import { observeTeaching, chooseTeaching, teachingEstimates } from '../src/learning/engine/teachingPolicy.js'
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
