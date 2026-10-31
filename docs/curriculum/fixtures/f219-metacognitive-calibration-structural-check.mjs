// F219 synthetic structural guard only: not an actual tutoring-engine or human-learning test.
// Run: node docs/curriculum/fixtures/f219-metacognitive-calibration-structural-check.mjs
import {readFileSync} from 'node:fs';
const clone=x=>JSON.parse(JSON.stringify(x));
const ok=(x,m)=>{if(!x)throw Error(m)};
const ev=(c,id)=>c.events.find(x=>x.id===id);
const ctl=c=>{const z=clone(c.events);for(const p of c.matched_control.replace||[]){const x=z.find(y=>y.id===p.event_id);ok(x,"missing control target");const {event_id,...patch}=p;Object.assign(x,patch)}for(const x of c.matched_control.insert||[])z.push(x);return id=>z.find(x=>x.id===id)};
function check(f){
 ok(f.schema_id==="linguachat.curriculum.f219.machine_readable.v1"&&f.status==="DESIGN_ONLY_UNSUPPORTED","schema/status");
 ok(f.source_binding.source_resolution==="UNSUPPORTED"&&f.source_binding.cefr_can_do_id==="REQUIRES_EXISTING_VERSIONED_SOURCE_BINDING"&&f.source_binding.rubric_version==="REQUIRES_REVIEWED_RUBRIC","source unresolved");
 ok(["independent_reviewer_signoff","actual_next_instruction_rendered","per_assertion_PASS_FAIL_UNSUPPORTED","confidence_eligibility_and_missingness"].every(k=>f.required_harness_outputs.includes(k)),"review boundary");
 ok(f.acceptance_assertions.length===9&&f.cases.map(c=>c.id).join("")==="ABCDEF","cases/assertions");
 const ids=new Set();let count=0;
 for(const c of f.cases){
  ok(c.objective_family&&c.expected&&c.matched_control&&c.events.length>=4,"case metadata");
  let lastDay=-1,lastSeq=-1;const local=new Set();
  for(const x of c.events){
   ok(x.id&&!ids.has(x.id)&&x.session&&Number.isInteger(x.day_offset)&&Number.isFinite(x.sequence),"event identity");
   ok(x.day_offset>lastDay||(x.day_offset===lastDay&&x.sequence>lastSeq),"chronology");
   ids.add(x.id);local.add(x.id);lastDay=x.day_offset;lastSeq=x.sequence;count++;
  }
  for(const p of c.matched_control.replace||[])ok(local.has(p.event_id),"control target");
 }
 const [A,B,C,D,E,F]=f.cases;const [a,b,c,d,e,g]=f.cases.map(ctl);
 ok(ev(A,"A1").value===0.9&&ev(A,"A1").timing==="pre_feedback"&&ev(A,"A1").answer_visible===false&&ev(A,"A2").independent===true&&ev(A,"A2").meaning_quality==="meaning_critical_error","A mismatch");
 ok(ev(A,"A3").rendered===true&&ev(A,"A4").assisted===true&&ev(A,"A4").mastery_credit===false&&ev(A,"A5").day_offset>=7&&ev(A,"A5").new_context===true&&a("A2").meaning_quality==="success","A control/transfer");
 ok(["B1","B3"].every(id=>ev(B,id).value<=0.3&&ev(B,id).timing==="pre_feedback")&&["B2","B4","B5"].every(id=>ev(B,id).independent===true&&ev(B,id).meaning_quality==="success")&&b("B5").meaning_quality==="meaning_critical_error","B low confidence independent success");
 ok(ev(C,"C1").independent===true&&ev(C,"C1").explanation_quality==="incomplete"&&ev(C,"C2").answer_bearing===true&&ev(C,"C2").rendered===true,"C first explanation and model");
 ok(ev(C,"C3").assisted===true&&ev(C,"C3").language_mastery_credit===false&&ev(C,"C4").delayed_retrieval_credit===false&&ev(C,"C5").independent===true&&ev(C,"C5").day_offset>=7&&c("C5").independent===false&&c("C5").assistance==="rule_card_rendered","C coached vs independent");
 ok(ev(D,"D2").rendered===false&&ev(D,"D3").rendered===true&&ev(D,"D4").timing==="post_feedback"&&ev(D,"D4").answer_visible===true&&ev(D,"D4").calibration_eligible===false,"D exposed rating");
 ok(d("D3").rendered===false&&d("D4").timing==="pre_feedback"&&d("D4").answer_visible===false&&d("D4").calibration_eligible===true,"D unrendered control");
 ok(ev(E,"E1").status==="declined"&&ev(E,"E1").value===null&&ev(E,"E1").calibration_eligible===false&&ev(E,"E2").latency_seconds>=180&&ev(E,"E2").confidence_inferred===false,"E decline/access");
 ok(ev(E,"E2").independent===true&&ev(E,"E3").independent===true&&ev(E,"E4").interest==="gaming"&&ev(E,"E4").method_estimate_changed===false&&["adjacent_eligible","neutral_eligible","unfamiliar_eligible","skill_coverage_preserved"].every(k=>ev(E,"E4")[k]===true),"E skill/topic balance");
 ok(ev(E,"E5").text_reflection_listening_credit===false&&ev(E,"E5").text_reflection_speaking_credit===false&&ev(E,"E5").mastery_threshold_unchanged===true&&e("E4").interest==="cooking"&&e("E4").method_estimate_changed===false&&e("E2").latency_seconds<30&&e("E3").meaning_quality===ev(E,"E3").meaning_quality,"E matched interest-only");
 const pairs=["F1","F2","F3","F4"].map(id=>ev(F,id));
 ok(pairs.every(x=>x.independent===true&&x.comparable===true&&x.timing==="pre_feedback"&&x.answer_visible===false)&&new Set(pairs.map(x=>x.session)).size===4,"F eligible comparable pairs");
 ok(pairs.filter(x=>x.outcome==="success").length===2&&pairs.filter(x=>x.outcome==="failure").length===2&&new Set(pairs.map(x=>x.confidence)).size===2&&pairs.every(x=>g(x.id).outcome!==x.outcome&&g(x.id).confidence===x.confidence),"F contradictory control");
 ok(ev(F,"F5-original").assisted===true&&ev(F,"F5-original").independent===false&&ev(F,"F5").duplicate_of==="F5-original"&&ev(F,"F5").independent===false&&ev(F,"F5").calibration_eligible===false,"F assisted duplicate");
 ok(ev(F,"F6").render_chronology==="UNKNOWN"&&ev(F,"F6").calibration_eligible===false&&ev(F,"F7").rendered===false&&ev(F,"F8").rendered===true&&ev(F,"F8").context==="neutral"&&ev(F,"F8").reversible===true,"F quarantined and delivered");
 ok(F.followup_ledger.length===2&&new Set(F.followup_ledger.map(x=>x.skill)).size===2,"F skills");
 for(const l of F.followup_ledger)ok(["due","offered","rendered","completed","missing_unrendered","pending_rendered"].every(k=>Number.isInteger(l[k])&&l[k]>=0)&&l.completed<=l.rendered&&l.rendered<=l.offered&&l.offered<=l.due&&l.missing_unrendered===l.due-l.rendered&&l.pending_rendered===l.rendered-l.completed,"F ledger");
 for(const [key,field] of [["followup_due","due"],["followup_rendered","rendered"],["followup_completed","completed"],["followup_missing_unrendered","missing_unrendered"],["followup_pending_rendered","pending_rendered"]])ok(F.expected[key]===F.followup_ledger.reduce((n,l)=>n+l[field],0),"F expected ledger");
 ok(F.expected.eligible_comparable_pairs===4&&F.expected.permanent_label_forbidden===true&&F.expected.delivered_choice_required===true,"F uncertainty");
 return {cases:6,events:count,matched_controls:6,acceptance_assertions:9,eligible_F_pairs:4};
}
const mutations=[
["source claimed resolved",x=>x.source_binding.source_resolution="RESOLVED"],
["reviewer missing",x=>x.required_harness_outputs=x.required_harness_outputs.filter(k=>k!=="independent_reviewer_signoff")],
["A rating post-feedback",x=>x.cases[0].events[0].timing="post_feedback"],
["A error erased",x=>x.cases[0].events[1].meaning_quality="success"],
["A repeat credited",x=>x.cases[0].events[3].mastery_credit=true],
["A transfer not novel",x=>x.cases[0].events[4].new_context=false],
["B low rating high",x=>x.cases[1].events[0].value=0.9],
["B transfer assisted",x=>x.cases[1].events[4].independent=false],
["B control no failure",x=>x.cases[1].matched_control.replace[0].meaning_quality="success"],
["C model not rendered",x=>x.cases[2].events[1].rendered=false],
["C explanation mastery",x=>x.cases[2].events[2].language_mastery_credit=true],
["C echo delayed",x=>x.cases[2].events[3].delayed_retrieval_credit=true],
["C control clean",x=>x.cases[2].matched_control.replace[0].independent=true],
["D post-feedback eligible",x=>x.cases[3].events[3].calibration_eligible=true],
["D control answer visible",x=>x.cases[3].matched_control.replace[0].rendered=true],
["E decline calibrated",x=>x.cases[4].events[0].calibration_eligible=true],
["E latency as confidence",x=>x.cases[4].events[1].confidence_inferred=true],
["E neutral excluded",x=>x.cases[4].events[3].neutral_eligible=false],
["E interest changes method",x=>x.cases[4].events[3].method_estimate_changed=true],
["E text credited listening",x=>x.cases[4].events[4].text_reflection_listening_credit=true],
["F duplicate independent",x=>x.cases[5].events[5].independent=true],
["F unknown eligible",x=>x.cases[5].events[6].calibration_eligible=true],
["F counterfactual unchanged",x=>x.cases[5].matched_control.replace[0].outcome="failure"],
["F next not delivered",x=>x.cases[5].events[8].rendered=false],
["F impossible completed",x=>x.cases[5].followup_ledger[0].completed=2],
["F skill debt collapsed",x=>x.cases[5].followup_ledger[1].skill="listening"]
];
const fixture=JSON.parse(readFileSync(new URL('./f219-metacognitive-calibration-self-explanation.synthetic.json',import.meta.url),'utf8'));
const summary=check(fixture);
for(const [name,mutate] of mutations){const changed=clone(fixture);mutate(changed);let rejected=false;try{check(changed)}catch{rejected=true}if(!rejected)throw Error('Mutation escaped: '+name)}
console.log(JSON.stringify({...summary,negative_mutations_rejected:mutations.length,status:'SYNTHETIC_STRUCTURAL_ONLY'}));
