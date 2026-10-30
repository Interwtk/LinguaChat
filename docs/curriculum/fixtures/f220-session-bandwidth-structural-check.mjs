// F220 synthetic structural acceptance guard only. Does not test the actual tutoring engine.
// Run: node docs/curriculum/fixtures/f220-session-bandwidth-structural-check.mjs
import {readFileSync} from 'node:fs';
const clone=x=>JSON.parse(JSON.stringify(x));
const ok=(v,message)=>{if(!v)throw Error(message)};
const event=(c,id)=>c.events.find(x=>x.id===id);
const control=c=>{
 const copy=clone(c.events);
 for(const p of c.matched_control.replace||[]){
  const target=copy.find(x=>x.id===p.event_id);
  ok(target,'missing control target '+p.event_id);
  const {event_id,...patch}=p;Object.assign(target,patch);
 }
 for(const x of c.matched_control.insert||[])copy.push(x);
 return id=>copy.find(x=>x.id===id);
};
function check(f){
 ok(f.schema_id==='linguachat.curriculum.f220.machine_readable.v1'&&f.status==='DESIGN_ONLY_UNSUPPORTED','design-only schema');
 ok(f.source_binding.source_resolution==='UNSUPPORTED'&&f.source_binding.cefr_can_do_id==='REQUIRES_EXISTING_VERSIONED_SOURCE_BINDING'&&f.source_binding.rubric_version==='REQUIRES_REVIEWED_RUBRIC','unresolved CEFR binding');
 ok(f.required_harness_outputs.includes('independent_reviewer_signoff')&&f.required_harness_outputs.includes('actual_next_instruction_rendered')&&f.required_harness_outputs.includes('per_assertion_PASS_FAIL_UNSUPPORTED'),'independent harness still required');
 ok(f.acceptance_assertions.length===9&&f.cases.map(x=>x.id).join('')==='ABCDEF','six scenarios and nine assertions');
 let count=0;
 for(const c of f.cases){
  ok(c.objective_family&&c.matched_control&&c.expected,'scenario structure');
  const ids=new Set();
  for(const x of c.events){
   ok(x.id&&!ids.has(x.id)&&x.session&&Number.isInteger(x.day_offset)&&Number.isFinite(x.sequence),'unique event provenance');
   ids.add(x.id);count++;
  }
  for(const p of c.matched_control.replace||[])ok(ids.has(p.event_id),'matched control target');
  const cids=new Set(ids);
  for(const x of c.matched_control.insert||[]){ok(!cids.has(x.id)&&x.session&&Number.isFinite(x.sequence),'control insertion identity');cids.add(x.id)}
 }
 const [A,B,C,D,E,F]=f.cases;
 const [a,b,c,d,e,g]=f.cases.map(control);
 ok(event(A,'A1').due===true&&event(A,'A2').minutes===5&&event(A,'A2').competence_inference===false,'A voluntary time');
 ok(event(A,'A3').rendered===true&&event(A,'A4').independent===true&&event(A,'A5').rendered===false&&event(A,'A5').mastery_credit===false,'A due review and queued noncredit');
 ok(a('A2').minutes===30&&a('A3').rendered===true&&a('A6').skill==='listening'&&a('A6').rendered===true,'A long-session control');
 ok(event(B,'B2').durably_submitted===false&&event(B,'B2').evidence_status==='PARTIAL_NOT_COMPLETED'&&event(B,'B3').semantic_failure===false,'B partial not semantic failure');
 ok(['B4','B5'].every(id=>event(B,id).duplicate_of==='B2'&&event(B,id).attempt_credit===false),'B replay dedup');
 ok(event(B,'B6').same_session===true&&event(B,'B6').answer_model_rendered===false&&event(B,'B6').first_attempt_preserved===true,'B safe resume');
 ok(b('B2C').durably_submitted===true&&b('B2C').meaning_critical_error===true&&b('B2C').independent===true,'B durable error control');
 ok(event(C,'C1').occurred_at.endsWith('23:58:00Z')&&event(C,'C3').occurred_at.endsWith('00:03:00Z')&&event(C,'C3').same_episode===true,'C midnight not distinct session');
 ok(event(C,'C4').answer_bearing===true&&event(C,'C5').reopen_count===20&&event(C,'C5').delayed_retrieval_credit===false,'C model-exposed reopens');
 ok(c('C6').session!=='episode-1'&&c('C6').day_offset>=7&&c('C6').new_item===true&&c('C6').independent===true&&c('C6').meaningful_delay_verified===true,'C later new item control');
 ok(event(D,'D1').access==='screen_reader'&&event(D,'D2').latency_seconds>=180&&event(D,'D2').fatigue_inferred===false,'D accessibility not fatigue');
 ok(event(D,'D4').evidence_status==='UNKNOWN'&&event(D,'D4').listening_mastery_credit===false&&event(D,'D5').competence_inference===false,'D failed audio and voluntary break');
 ok(d('D3').meaning_quality==='meaning_critical_error'&&d('D3').independent===true,'D language-error control');
 ok(['E1','E2','E3'].every(id=>event(E,id).assisted===true&&event(E,id).independent===false),'E short assisted not clean');
 ok(event(E,'E4').independent===true&&event(E,'E5').comparison_eligible===false&&event(E,'E5').delayed_transfer_rendered===false,'E comparison ineligible');
 ok(event(E,'E6').adjacent_eligible===true&&event(E,'E6').neutral_eligible===true&&event(E,'E6').unfamiliar_eligible===true&&event(E,'E6').method_estimate_changed===false,'E soft interest layer');
 ok(['E1','E2','E3'].every(id=>e(id).independent===true)&&e('E7').comparable_difficulty===true&&e('E8').comparable_difficulty===true&&e('E7').session!==e('E8').session,'E matched alternative');
 const valid=['F1','F2','F3','F4'].map(id=>event(F,id));
 ok(valid.every(x=>x.independent===true&&x.comparable===true)&&new Set(valid.map(x=>x.session)).size===4,'F four eligible distinct sessions');
 for(const method of ['short_retrieval_first','long_explain_then_practice'])ok(new Set(valid.filter(x=>x.method===method).map(x=>x.outcome)).size===2,'F contradictory outcomes');
 ok(['F1','F2','F3','F4'].every(id=>event(F,id).outcome!==g(id).outcome),'F counterfactual reversed outcomes');
 ok(event(F,'F5').independent===false&&event(F,'F5').duplicate_of==='F5-original'&&event(F,'F6').independent==='UNKNOWN'&&event(F,'F6').render_chronology==='UNKNOWN','F invalid observations excluded');
 ok(event(F,'F7').rendered===false&&event(F,'F8').type==='next_instruction_rendered'&&event(F,'F8').rendered===true&&event(F,'F8').method==='balanced_fallback'&&event(F,'F8').context==='neutral','F actual balanced delivery');
 const ledger=F.followup_ledger;
 ok(ledger.length===2&&ledger[0].skill==='listening'&&ledger[1].skill==='writing','F skill debt');
 for(const l of ledger)ok(['due','offered','rendered','completed','abandoned','missing_unrendered','pending_rendered'].every(k=>Number.isInteger(l[k])&&l[k]>=0)&&l.completed<=l.rendered&&l.rendered<=l.offered&&l.offered<=l.due&&l.missing_unrendered===l.due-l.rendered&&l.pending_rendered===l.rendered-l.completed,'F opportunity arithmetic');
 for(const [key,field] of [['followup_due','due'],['followup_rendered','rendered'],['followup_completed','completed'],['followup_missing_unrendered','missing_unrendered'],['followup_pending_rendered','pending_rendered']])ok(F.expected[key]===ledger.reduce((n,l)=>n+l[field],0),'F expected ledger '+key);
 ok(F.expected.eligible_comparable_independent_observations===4&&F.expected.skill_debt_preserved===true&&F.expected.contradictory_outcomes_preserved===true,'F uncertainty');
 return {cases:6,events:count,matched_controls:6,acceptance_assertions:9,followup_due:2,followup_rendered:1};
}
const mutations=[
 ['invent CEFR binding',x=>x.source_binding.source_resolution='RESOLVED'],
 ['A time as competence',x=>x.cases[0].events[1].competence_inference=true],
 ['A due review skipped',x=>x.cases[0].events[2].rendered=false],
 ['A queued credit',x=>x.cases[0].events[4].mastery_credit=true],
 ['B partial credited',x=>x.cases[1].events[1].durably_submitted=true],
 ['B transport as wrong',x=>x.cases[1].events[2].semantic_failure=true],
 ['B replay counted',x=>x.cases[1].events[3].attempt_credit=true],
 ['B unsafe answer leak',x=>x.cases[1].events[5].answer_model_rendered=true],
 ['C midnight as distinct',x=>x.cases[2].events[2].same_episode=false],
 ['C reopen as delayed',x=>x.cases[2].events[4].delayed_retrieval_credit=true],
 ['D fatigue label',x=>x.cases[3].events[1].fatigue_inferred=true],
 ['D failed audio as listening',x=>x.cases[3].events[3].listening_mastery_credit=true],
 ['E assisted called independent',x=>x.cases[4].events[0].independent=true],
 ['E missing followup comparable',x=>x.cases[4].events[4].comparison_eligible=true],
 ['E neutral topics excluded',x=>x.cases[4].events[5].neutral_eligible=false],
 ['F duplicate called independent',x=>x.cases[5].events[2].independent=true],
 ['F untrusted chronology clean',x=>x.cases[5].events[5].independent=true],
 ['F counterfactual unchanged',x=>x.cases[5].matched_control.replace[0].outcome='success'],
 ['F next only queued',x=>x.cases[5].events[7].rendered=false],
 ['F missing counted completed',x=>x.cases[5].followup_ledger[0].completed=1],
 ['F writing debt erased',x=>x.cases[5].followup_ledger[1].skill='listening']
];
const fixture=JSON.parse(readFileSync(new URL('./f220-session-bandwidth-interruption-pacing.synthetic.json',import.meta.url),'utf8'));
const summary=check(fixture);
for(const [name,mutate] of mutations){const changed=clone(fixture);mutate(changed);let rejected=false;try{check(changed)}catch{rejected=true}if(!rejected)throw Error('Mutation escaped: '+name)}
console.log(JSON.stringify({...summary,negative_mutations_rejected:mutations.length,status:'SYNTHETIC_STRUCTURAL_ONLY'}));
