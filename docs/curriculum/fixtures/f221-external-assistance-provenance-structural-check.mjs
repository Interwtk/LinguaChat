// F221 synthetic structural guard only; not runtime evidence, surveillance, or human-learning efficacy.
// Run: node docs/curriculum/fixtures/f221-external-assistance-provenance-structural-check.mjs
import {readFileSync} from 'node:fs';
const check=function check(f){
 const ok=(v,m)=>{if(!v)throw Error(m)};
 const ev=(c,id)=>c.events.find(x=>x.id===id);
 const control=c=>{const e=JSON.parse(JSON.stringify(c.events));for(const p of c.matched_control.replace||[]){const target=e.find(x=>x.id===p.event_id);ok(target,"missing control target");const {event_id,...patch}=p;Object.assign(target,patch)}for(const x of c.matched_control.insert||[])e.push(x);return id=>e.find(x=>x.id===id)};
 ok(f.schema_id==="linguachat.curriculum.f221.machine_readable.v1"&&f.status==="DESIGN_ONLY_UNSUPPORTED"&&f.source_binding.source_resolution==="UNSUPPORTED"&&f.source_binding.rubric_version==="REQUIRES_REVIEWED_RUBRIC"&&f.source_binding.cefr_can_do_id==="REQUIRES_EXISTING_VERSIONED_SOURCE_BINDING","design and CEFR unresolved");
 ok(f.required_harness_outputs.includes("independent_reviewer_signoff")&&f.required_harness_outputs.includes("due_offered_rendered_completed_missing_denominators"),"independent harness unresolved");
 ok(f.cases.map(c=>c.id).join("")==="ABCDEF","six scenarios");
 let n=0;
 for(const c of f.cases){ok(c.matched_control&&c.expected&&c.objective_family,"case structure");const ids=new Set();for(const e of c.events){ok(e.id&&!ids.has(e.id)&&e.session&&Number.isInteger(e.day_offset)&&Number.isFinite(e.sequence),"event identity");ids.add(e.id);n++}}
 const [A,B,C,D,E,F]=f.cases,[a,b,c,d,e,g]=f.cases.map(control);
 ok(ev(A,"A2").independent===true&&ev(A,"A2").sequence<ev(A,"A3").sequence&&ev(A,"A3").scope==="place_noun"&&ev(A,"A3").answer_bearing_for_target_construct===false&&ev(A,"A5").day_offset>=7,"A lookup and later transfer");
 ok(a("A3").sequence<a("A2").sequence&&a("A3").answer_bearing_for_target_construct===true&&a("A2").independent===false&&a("A2").exposed_to.includes("A3"),"A exposed control");
 ok(ev(B,"B2").tool==="translator"&&ev(B,"B2").output===ev(B,"B3").answer&&ev(B,"B3").independent===false&&ev(B,"B3").exposed_to.includes("B2")&&ev(B,"B4").independent===true&&ev(B,"B4").day_offset>=7,"B assisted practice");
 ok(b("B3").sequence<b("B2").sequence&&b("B3").independent===true&&b("B3").exposed_to.length===0,"B independent control");
 ok(ev(C,"C1").assistive_access==="screen_reader"&&ev(C,"C1").answer_bearing===false&&ev(C,"C2").input_method==="dictation_of_learner_words"&&ev(C,"C2").independent===true&&ev(C,"C3").channel==="writing","C access not answer");
 ok(c("C1A").answer_bearing_for_target_construct===true&&c("C2").input_method==="predictive_completion"&&c("C2").independent===false&&c("C2").exposed_to.includes("C1A"),"C generated answer");
 ok(ev(D,"D1").peer_corrected_reply===true&&ev(D,"D1").independent===false&&ev(D,"D2").independent===false&&ev(D,"D3").independent===true&&ev(D,"D3").new_interlocutor===true,"D peer practice");
 ok(d("D2A").answer_bearing_for_target_construct===true&&d("D3").independent===false&&d("D3").exposed_to.includes("D2A"),"D peer answer control");
 ok(ev(E,"E2").input_observation==="paste"&&ev(E,"E2").external_tool_provenance==="UNKNOWN"&&ev(E,"E2").independent==="UNKNOWN"&&ev(E,"E3").new_item===true&&ev(E,"E3").independent===true,"E unknown nonpunitive");
 ok(e("E1A").answer_bearing_for_target_construct===true&&e("E2").independent===false&&e("E2").exposed_to.includes("E1A"),"E observed control");
 const ids=["F1","F2","F3","F4"],valid=ids.map(id=>ev(F,id));
 ok(valid.every(x=>x.independent===true&&x.comparable===true)&&new Set(valid.map(x=>x.session)).size===4&&ids.every(id=>ev(F,id).outcome!==g(id).outcome),"F comparable reversible outcomes");
 for(const method of ["dictionary_practice","translator_practice"])ok(new Set(valid.filter(x=>x.method===method).map(x=>x.outcome)).size===2,"F conflicting evidence");
 ok(ev(F,"F5").duplicate_of==="F5-original"&&ev(F,"F5-dup").duplicate_of==="F5-original"&&ev(F,"F5").independent===false&&ev(F,"F6").independent==="UNKNOWN"&&ev(F,"F6").exposure_chronology==="UNKNOWN","F dedup and unknown");
 ok(ev(F,"F7").rendered===false&&ev(F,"F8").type==="next_instruction_rendered"&&ev(F,"F8").method==="balanced_fallback"&&ev(F,"F8").context==="neutral","F delivered fallback");
 const ls=F.followup_ledger;
 ok(ls?.length===2&&ls[0].event==="F7"&&ls[0].skill==="listening"&&ls[1].event==="F8"&&ls[1].skill==="writing","F ledger provenance");
 for(const l of ls)ok(["due","offered","rendered","completed","missing_unrendered","pending_rendered"].every(k=>Number.isInteger(l[k])&&l[k]>=0)&&l.rendered<=l.offered&&l.offered<=l.due&&l.completed<=l.rendered&&l.missing_unrendered===l.due-l.rendered&&l.pending_rendered===l.rendered-l.completed,"F opportunity arithmetic");
 ok(ls[0].missing_unrendered===1&&ls[0].completed===0&&ls[1].pending_rendered===1&&ls[1].completed===0,"F missing versus pending");
 for(const k of ["due","rendered","completed","missing_unrendered","pending_rendered"])ok(F.expected["followup_"+k]===ls.reduce((s,l)=>s+l[k],0),"F expected totals");
 ok(F.expected.eligible_comparable_independent_observations===4&&F.expected.skill_debt_preserved===true&&F.expected.contradictory_outcomes_preserved===true,"F interpretation");
 return {cases:6,events:n,controls:6,followup_due:2,followup_rendered:1,followup_missing:1};
};
const mutations=[
["fabricated source",x=>x.source_binding.source_resolution="RESOLVED"],
["A first falsely assisted",x=>x.cases[0].events[1].independent=false],
["A answer lookup before first",x=>x.cases[0].events[2].sequence=1.5],
["A exposed control called independent",x=>x.cases[0].matched_control.replace[1].independent=true],
["B translator counted clean",x=>x.cases[1].events[2].independent=true],
["B translator output mismatch",x=>x.cases[1].events[1].output="different"],
["C screen reader as answer",x=>x.cases[2].events[0].answer_bearing=true],
["C autocomplete independent",x=>x.cases[2].matched_control.replace[0].independent=true],
["D peer response independent",x=>x.cases[3].events[0].independent=true],
["D peer control independent",x=>x.cases[3].matched_control.replace[0].independent=true],
["E paste AI accusation",x=>x.cases[4].events[1].external_tool_provenance="AI_detected"],
["E unknown called independent",x=>x.cases[4].events[1].independent=true],
["F duplicate clean",x=>x.cases[5].events[2].independent=true],
["F unknown chronology clean",x=>x.cases[5].events[6].independent=true],
["F control not reversed",x=>x.cases[5].matched_control.replace[0].outcome="success"],
["F missing counted completed",x=>x.cases[5].followup_ledger[0].completed=1],
["F unrendered missing lost",x=>x.cases[5].followup_ledger[0].missing_unrendered=0],
["F pending counted completed",x=>x.cases[5].followup_ledger[1].completed=1],
["F listening debt erased",x=>x.cases[5].followup_ledger[0].skill="writing"],
["F next instruction not delivered",x=>x.cases[5].events[8].type="queued_only"]
];
const fixture=JSON.parse(readFileSync(new URL('./f221-external-assistance-provenance.synthetic.json',import.meta.url),'utf8'));
const summary=check(fixture);
for(const [name,fn] of mutations){const x=JSON.parse(JSON.stringify(fixture));fn(x);let fail=false;try{check(x)}catch{fail=true}if(!fail)throw Error('Mutation escaped: '+name)}
console.log(JSON.stringify({...summary,negative_mutations_rejected:mutations.length,status:'SYNTHETIC_STRUCTURAL_ONLY'}));
