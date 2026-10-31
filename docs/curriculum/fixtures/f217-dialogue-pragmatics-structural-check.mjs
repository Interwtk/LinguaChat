// F217 synthetic structural guard only. Does not run the LinguaChat tutor or establish human learning efficacy.
// Run: node docs/curriculum/fixtures/f217-dialogue-pragmatics-structural-check.mjs
import {readFileSync} from 'node:fs';
const clone=x=>JSON.parse(JSON.stringify(x));
const ev=(c,id)=>c.events.find(x=>x.id===id);
const control=(c,kind="matched_control")=>{const e=clone(c.events),patches=c[kind]?.replace||[];for(const patch of patches){const target=e.find(x=>x.id===patch.event_id);if(!target)throw Error("control missing target");const {event_id,...rest}=patch;Object.assign(target,rest)}return id=>e.find(x=>x.id===id)};
function validate(f){
 const ok=(x,m)=>{if(!x)throw Error(m)};
 ok(f.schema_id==="linguachat.curriculum.f217.machine_readable.v1"&&f.status==="DESIGN_ONLY_UNSUPPORTED","schema/status");
 ok(f.source_binding.source_resolution==="UNSUPPORTED"&&f.source_binding.cefr_can_do_id==="REQUIRES_EXISTING_VERSIONED_SOURCE_BINDING"&&f.source_binding.rubric_version==="REQUIRES_INDEPENDENT_REVIEW","unresolved source/rubric");
 ok(f.source_binding.task_version==="SYNTHETIC_F217_V1"&&f.source_binding.policy_version==="F217_DESIGN_V1"&&f.clock.timezone==="UTC"&&Number.isInteger(f.seed),"version/clock");
 ok(["reviewed_meaning_and_pragmatic_oracle_per_event","per_assertion_PASS_FAIL_UNSUPPORTED","per_skill_due_offered_rendered_completed_missing","actual_next_instruction_rendered","independent_reviewer_signoff","exact_engine_HEAD"].every(k=>f.required_harness_outputs.includes(k)),"harness evidence boundary");
 ok(f.acceptance_assertions.length===9&&f.cases.map(c=>c.id).join("")==="ABCDEF","six cases/nine assertions");
 let count=0,ledgers=0;const globalIds=new Set();
 for(const c of f.cases){
  ok(c.events.length>=5&&c.expected&&c.matched_control&&c.objective&&c.title,"case fields");
  let day=-1,seq=-1;const ids=new Set();
  for(const e of c.events){
   ok(e.id&&!globalIds.has(e.id)&&e.learner_id==="synthetic-learner-"+c.id&&e.task_version==="SYNTHETIC_F217_V1"&&e.policy_version==="F217_DESIGN_V1","event identity");
   ok(Number.isInteger(e.day_offset)&&Number.isInteger(e.sequence)&&e.sequence>0&&e.day_offset>=0&&e.session===c.id.toLowerCase()+"-day"+e.day_offset,"session/day/sequence");
   ok(e.day_offset>day||(e.day_offset===day&&e.sequence>seq),"event order");
   ok(e.occurred_at===new Date(Date.UTC(2026,9,1+e.day_offset,12,e.sequence,0)).toISOString(),"trusted clock");
   day=e.day_offset;seq=e.sequence;ids.add(e.id);globalIds.add(e.id);count++;
  }
  for(const kind of ["matched_control","interest_only_control"])if(c[kind])for(const patch of c[kind].replace)ok(ids.has(patch.event_id),"control target");
  ok(c.followup_ledger.length>=1,"missing followup ledger");
  for(const l of c.followup_ledger){ok(l.skill&&["due","offered","rendered","completed","missing_unrendered","pending_rendered"].every(k=>Number.isInteger(l[k])&&l[k]>=0),"ledger fields");ok(l.completed<=l.rendered&&l.rendered<=l.offered&&l.offered<=l.due,"ledger bounds");ok(l.missing_unrendered===l.due-l.rendered&&l.pending_rendered===l.rendered-l.completed,"ledger denominator");ledgers++}
 }
 const [A,B,C,D,E,F]=f.cases;
 const a=control(A),b=control(B),c=control(C),d=control(D),e=control(E),ei=control(E,"interest_only_control"),z=control(F);
 ok(ev(A,"A1").ambiguity==="two_valid_fridays"&&ev(A,"A1").answer_bearing===false&&ev(A,"A2").independent===true&&ev(A,"A2").reviewed_function==="valid_clarification"&&!ev(A,"A2").date_guessed,"A ambiguity and valid clarification");
 ok(a("A1").answer_bearing===true&&a("A2").independent===false&&a("A2").assistance==="tutor_suggested_wording"&&ev(A,"A4").mastery_credit===false,"A assisted control and pending transfer");
 ok(ev(B,"B1").independent&&ev(B,"B2").rendered===false&&ev(B,"B3").rendered===true&&ev(B,"B3").answer_bearing===true,"B offered versus rendered recast");
 ok(ev(B,"B4").independent===false&&ev(B,"B4").mastery_credit===false&&ev(B,"B5").independent_mastery_credit===false&&ev(B,"B6").mastery_credit===false,"B assisted acceptance not mastery");
 ok(b("B3").answer_bearing===false&&b("B4").independent===true&&b("B4").assistance==="none","B neutral control");
 ok(ev(C,"C1").independent===true&&ev(C,"C2").reviewed_function==="clarification_resolved"&&ev(C,"C3").answer_bearing===true,"C independent versus exposed");
 ok(ev(C,"C4").independent===false&&ev(C,"C4").mastery_credit===false&&ev(C,"C4").token_count>ev(C,"C1").token_count,"C verbosity not mastery");
 ok(ev(C,"C5").completion_status==="UNKNOWN"&&ev(C,"C5").coverage_debt_retained===true&&ev(C,"C6").mastery_credit===false&&c("C4").independent===true,"C ceiling and counterfactual");
 ok(ev(D,"D1").role_context==="close_peer"&&ev(D,"D1").reviewed_function==="appropriate_register"&&ev(D,"D2").role_context==="unfamiliar_administrator"&&ev(D,"D2").variety_accepted===true,"D contextual reviewed register");
 ok(ev(D,"D3").role_context==="UNKNOWN"&&ev(D,"D3").reviewed_function==="REGISTER_UNKNOWN"&&ev(D,"D3").demographic_inference===false&&d("D2").reviewed_function==="REGISTER_UNKNOWN","D abstention");
 ok(ev(D,"D4").speaking_credit===false&&ev(D,"D4").listening_credit===false,"D text not oral");
 ok(ev(E,"E1").independent===true&&ev(E,"E1").latency_competence_penalty===false&&e("E1").latency_competence_penalty===false,"E access latency fairness");
 ok(ev(E,"E3").speaking_credit===false&&ev(E,"E3").listening_credit===false&&ev(E,"E3").skill_coverage_preserved===true,"E channel");
 ok(ev(E,"E4").interest==="gaming"&&ei("E4").interest==="cooking"&&["method_confidence_changed","rubric_changed","objective_changed"].every(k=>ev(E,"E4")[k]===false&&ei("E4")[k]===false),"E soft interests");
 ok(["adjacent_eligible","neutral_eligible","unfamiliar_eligible"].every(k=>ev(E,"E4")[k]===true&&ei("E4")[k]===true),"E context diversity");
 ok(ev(F,"F2").independent===false&&ev(F,"F2").mastery_credit===false&&ev(F,"F5").duplicate_of==="F2"&&ev(F,"F5").mastery_credit===false,"F assistance/dedup");
 ok(ev(F,"F3").independent&&ev(F,"F4").independent&&ev(F,"F3").reviewed_function==="success"&&ev(F,"F4").reviewed_function==="meaning_critical_failure"&&z("F3").reviewed_function==="meaning_critical_failure"&&z("F4").reviewed_function==="success","F contradiction and counterfactual");
 ok(ev(F,"F6").render_chronology==="UNKNOWN"&&ev(F,"F6").mastery_credit===false&&ev(F,"F7").rendered===false&&ev(F,"F8").rendered===true&&ev(F,"F8").reversible===true&&ev(F,"F8").uncertainty==="high"&&z("F8").method!==ev(F,"F8").method,"F unknown and delivered choice");
 ok(F.arrival_order.length===F.events.length&&new Set(F.arrival_order).size===F.events.length&&F.arrival_order[0]==="F4"&&F.arrival_order.every(id=>F.events.some(x=>x.id===id)),"F replay arrival order");
 ok(F.expected.causal_superiority_claimed===false&&F.expected.coverage_debt_retained===true&&f.status==="DESIGN_ONLY_UNSUPPORTED","no causal or release claim");
 return {cases:6,events:count,skill_ledgers:ledgers,matched_controls:6,interest_only_controls:1,acceptance_assertions:9};
}
const mutations=[
["falsely resolved source",x=>x.source_binding.source_resolution="RESOLVED"],
["reviewed rubric falsely asserted",x=>x.source_binding.rubric_version="APPROVED"],
["independent reviewer omitted",x=>x.required_harness_outputs=x.required_harness_outputs.filter(k=>k!=="independent_reviewer_signoff")],
["A ambiguous prompt removed",x=>ev(x.cases[0],"A1").ambiguity="unique_date"],
["A tutor-assisted clarification credited",x=>x.cases[0].matched_control.replace[1].independent=true],
["A unseen pending transfer credited",x=>ev(x.cases[0],"A4").mastery_credit=true],
["B recast never rendered",x=>ev(x.cases[1],"B3").rendered=false],
["B copied response credited",x=>ev(x.cases[1],"B4").mastery_credit=true],
["B accepted negotiation credited",x=>ev(x.cases[1],"B5").independent_mastery_credit=true],
["B neutral prompt answer bearing",x=>x.cases[1].matched_control.replace[0].answer_bearing=true],
["C long assisted response credited",x=>ev(x.cases[2],"C4").mastery_credit=true],
["C incomplete conversation marked complete",x=>ev(x.cases[2],"C5").completion_status="success"],
["C coverage debt hidden",x=>ev(x.cases[2],"C5").coverage_debt_retained=false],
["D formal role inferred unknown",x=>ev(x.cases[3],"D2").role_context="UNKNOWN"],
["D unknown role passed",x=>ev(x.cases[3],"D3").reviewed_function="appropriate_register"],
["D oral evidence fabricated",x=>ev(x.cases[3],"D4").speaking_credit=true],
["E network delay penalized",x=>ev(x.cases[4],"E1").latency_competence_penalty=true],
["E listening evidence fabricated",x=>ev(x.cases[4],"E3").listening_credit=true],
["E interest changes rubric",x=>x.cases[4].interest_only_control.replace[0].rubric_changed=true],
["E unfamiliar contexts removed",x=>ev(x.cases[4],"E4").unfamiliar_eligible=false],
["F duplicate counted",x=>ev(x.cases[5],"F5").mastery_credit=true],
["F unknown chronology credited",x=>ev(x.cases[5],"F6").mastery_credit=true],
["F contradiction hidden",x=>ev(x.cases[5],"F4").reviewed_function="success"],
["F next instruction not delivered",x=>ev(x.cases[5],"F8").rendered=false],
["F control not reversed",x=>x.cases[5].matched_control.replace[0].reviewed_function="success"],
["F replay references nonexistent id",x=>x.cases[5].arrival_order[0]="FAKE"],
["impossible followup ledger",x=>x.cases[5].followup_ledger[0].completed=9],
["session day corrupted",x=>ev(x.cases[0],"A2").session="a-day7"],
["event timestamp corrupted",x=>ev(x.cases[3],"D2").occurred_at="2026-10-01T12:01:00Z"]
];
const fixture=JSON.parse(readFileSync(new URL('./f217-dialogue-pragmatics-turn-taking.synthetic.json',import.meta.url),'utf8'));
const summary=validate(fixture);
for(const [name,change] of mutations){const copy=clone(fixture);change(copy);let rejected=false;try{validate(copy)}catch{rejected=true}if(!rejected)throw Error('Mutation escaped: '+name)}
console.log(JSON.stringify({...summary,negative_mutations_rejected:mutations.length,status:'SYNTHETIC_STRUCTURAL_ONLY'}));
