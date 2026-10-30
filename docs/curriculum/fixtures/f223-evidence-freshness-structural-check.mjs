// F223 evidence freshness and state-shift structural guard. Synthetic only, not a runtime or efficacy proof.
// Run: node docs/curriculum/fixtures/f223-evidence-freshness-structural-check.mjs
import {readFileSync} from 'node:fs';

function verify(f){
 const ok=(v,m)=>{if(!v)throw Error(m)};
 ok(f.schema_id==="linguachat.curriculum.f223.machine_readable.v1"&&f.status==="DESIGN_ONLY_UNSUPPORTED"&&f.source_binding?.source_resolution==="UNSUPPORTED","design/source boundary");
 ok(f.source_binding?.cefr_can_do_id==="REQUIRES_EXISTING_VERSIONED_SOURCE_BINDING"&&f.source_binding?.rubric_version==="REQUIRES_INDEPENDENT_REVIEW","unresolved CEFR/rubric");
 ok(f.assertions?.length===9&&f.assertions.every((a,i)=>a.id===i+1)&&f.cases?.map(c=>c.id).join("")==="ABCDEF","six cases/nine assertions");
 ok(f.clock?.arrival_time_distinct_from_occurrence===true&&f.global_rules?.topic_layer?.includes("unfamiliar")&&f.global_rules?.evidence_freshness?.includes("not automatic mastery expiry"),"clock/adaptation contract");
 ok(f.required_harness_outputs?.includes("independent_reviewer_signoff")&&f.required_harness_outputs?.includes("actual_next_method_rendered_and_dose"),"unresolved independent harness");
 let count=0;
 for(const c of f.cases){
  ok(c.source_binding==="REQUIRED"&&c.matched_control?.mutation&&c.expected&&c.events?.length>=3,"case/control "+c.id);
  const ids=new Set();
  for(const e of c.events){
   const t=Date.parse(e.occurred_at),a=e.arrived_at?Date.parse(e.arrived_at):t;
   ok(e.id&&!ids.has(e.id)&&e.session&&Number.isFinite(t)&&Number.isFinite(a)&&t<=a,"event identity/chronology "+e.id);
   ids.add(e.id);count++;
  }
 }
 const [A,B,C,D,E,F]=f.cases;
 const [aPre,...aEvents]=A.events;
 ok(aPre.type==="pre_choice_snapshot"&&aPre.uncertainty==="HIGH"&&aPre.methods_feasible.includes("retrieval_first"),"A pre-choice alternatives");
 const old=aEvents.slice(0,3),newer=aEvents.slice(3,6),a6=aEvents[6];
 ok(old.length===3&&old.every(e=>e.type==="unseen_delayed_probe"&&e.method_prior==="worked_example"&&e.independent===true&&e.answer_exposure===false&&e.reviewed_error==="repair_failure"&&e.meaningful_delay_review==="REQUIRED"),"A prior independent errors");
 ok(newer.length===3&&newer.every(e=>e.type==="unseen_delayed_probe"&&e.method_prior==="retrieval_first"&&e.independent===true&&e.answer_exposure===false&&e.reviewed_semantic_outcome==="success"&&e.meaningful_delay_review==="REQUIRED"),"A later independent evidence");
 ok(new Set(aEvents.slice(0,6).map(e=>e.session)).size===6&&a6.type==="next_instruction_rendered"&&a6.dose>0&&a6.uncertainty==="NONZERO"&&a6.skill_debt_retained===true&&A.expected.method_hypothesis_revisable===true&&A.expected.observational_causality_claim===false&&A.expected.permanent_worked_example_label===false&&A.matched_control.expected_clean_new_independent_successes===0,"A reversible delivered choice/control");
 const [b0,b1,b2]=B.events;
 ok(b0.reviewed_semantic_outcome==="success"&&b0.answer_exposure===false&&b1.type==="review_schedule"&&b1.absence_elapsed_days===45&&b1.due_count===3&&b1.offered===0&&b1.rendered===0&&b1.completed===0&&b1.missing===3&&b1.observed_failures===0,"B absence cannot fabricate failure");
 ok(b2.rendered===false&&b2.current_retention==="UNMEASURED"&&B.expected.current_retention==="UNMEASURED"&&B.expected.auto_CEFR_downgrade===false&&B.expected.historical_independent_success_retained===true&&B.matched_control.expected.new_observed_failures===1&&B.matched_control.expected.absence_imputed_failures===0,"B no mastery expiry/control");
 const [c0,c1,c2]=C.events;
 ok(c0.rubric_version==="v1"&&c1.task_version==="v1"&&c2.rubric_version==="v2"&&c2.task_version==="v2"&&c2.meaning_critical_requirement_changed===true&&c2.surface_answer_same_as_C0===true&&c2.reviewed_result==="fails_v2","C versioned construct change");
 ok(C.expected.original_comparability==="NOT_COMPARABLE"&&C.expected.retroactive_rescoring===false&&C.expected.automatic_forgetting_claim===false&&C.expected.method_switch_due_only_to_version_change===false&&C.matched_control.expected_comparability==="CAUTIOUSLY_COMPARABLE_WITH_BRIDGE","C independent comparability bridge");
 const [d0,d1,d2,d3,d4]=D.events;
 ok([d0,d1].every(e=>e.audio_delivery==="VERIFIED"&&e.independent===true&&e.reviewed_semantic_outcome==="success")&&d2.audio_delivery==="FAILED"&&d2.transcript_exposure==="UNKNOWN"&&d2.latency_quality==="UNRELIABLE"&&d2.reviewed_semantic_outcome==="UNKNOWN","D audio/latency missingness");
 ok(d3.type==="speaking_probe_offered"&&d3.rendered===false&&d3.completed===false&&d4.listening_debt==="PENDING"&&d4.speaking_debt==="PENDING"&&d4.dose>0&&D.expected.D2_language_failure===false&&D.expected.D2_independent_success===false&&D.expected.text_only_oral_certification===false&&D.expected.skill_debt_retained===true,"D oral skill debt");
 const [e0,e1,e2,e3]=E.events;
 ok(e0.method_confidence==="LOW"&&e1.demonstrated_interest==="cooking"&&e1.language_outcome==="NONE"&&e2.soft_interest_weights.games==="lower"&&e2.soft_interest_weights.cooking==="higher"&&e2.method_confidence==="LOW"&&e2.objective_and_rubric_unchanged===true,"E interests do not alter method evidence");
 ok(["cooking","games","adjacent","neutral","unfamiliar"].every(k=>e2.eligible_context_families.includes(k))&&e3.type==="next_instruction_rendered"&&e3.context==="neutral"&&e3.dose>0&&E.expected.topic_exclusion===false&&E.expected.method_confidence_changes_from_interest_only===false&&E.expected.permanent_learning_style_label===false,"E nonexclusive topic sampling");
 const [f0,f1,f2,f3,f4,f5,f6]=F.events;
 ok(f0.decision_frozen===true&&f0.methods_feasible.length===2&&f0.due_listening_review===true&&f1.independent===true&&f1.answer_visibility==="VERIFIED_NO_EXPOSURE"&&f1.reviewed_semantic_outcome==="success"&&f1.stable_attempt_id==="F_T1"&&f2.type==="replay"&&f2.stable_attempt_id===f1.stable_attempt_id,"F first clean attempt/dedup");
 ok(f3.answer_visibility==="UNKNOWN"&&f3.reviewed_semantic_outcome==="success_surface_only"&&f4.independent===true&&f4.reviewed_semantic_outcome==="failure"&&f4.may_affect_decisions_after_arrival_only===true&&Date.parse(f4.occurred_at)<Date.parse(f1.occurred_at)&&Date.parse(f4.arrived_at)>Date.parse(f1.arrived_at),"F late arrival and UNKNOWN");
 ok(f5.due===1&&f5.offered===0&&f5.rendered===0&&f5.completed===0&&f5.missing===1&&f6.rendered===true&&f6.dose>0&&f6.independent_outcome==="PENDING"&&F.expected.unique_F_T1_count===1&&F.expected.F_UNKNOWN_eligible===false&&F.expected.backdated_prior_decision===false&&F.expected.F5_review_completed===false&&F.expected.F6_actually_rendered===true&&F.expected.method_permanently_locked===false,"F opportunity ledger/delivered fallback");
 return {cases:6,assertions:9,events:count};
}

const raw=readFileSync(new URL('./f223-evidence-freshness-state-shifts.synthetic.json',import.meta.url),'utf8');
const fixture=JSON.parse(raw);
const result=verify(fixture);
const mutations=[
 ["fabricated CEFR binding",f=>{f.source_binding.source_resolution="RESOLVED"}],
 ["A assisted success credited",f=>{f.cases[0].events[4].independent=false}],
 ["A permanent method label",f=>{f.cases[0].expected.permanent_worked_example_label=true}],
 ["A control falsely counts successes",f=>{f.cases[0].matched_control.expected_clean_new_independent_successes=3}],
 ["B missing reviews counted completed",f=>{f.cases[1].events[1].completed=3}],
 ["B absent days as failures",f=>{f.cases[1].events[1].observed_failures=3}],
 ["B auto CEFR downgrade",f=>{f.cases[1].expected.auto_CEFR_downgrade=true}],
 ["C rubric change pooled",f=>{f.cases[2].expected.original_comparability="COMPARABLE"}],
 ["C retrospective rescoring",f=>{f.cases[2].expected.retroactive_rescoring=true}],
 ["D device failure scored language failure",f=>{f.cases[3].expected.D2_language_failure=true}],
 ["D missing speaking certified",f=>{f.cases[3].events[3].completed=true}],
 ["E interest raises method confidence",f=>{f.cases[4].events[2].method_confidence="HIGH"}],
 ["E excludes unfamiliar contexts",f=>{f.cases[4].events[2].eligible_context_families=f.cases[4].events[2].eligible_context_families.filter(x=>x!=="unfamiliar")}],
 ["F duplicate renamed",f=>{f.cases[5].events[2].stable_attempt_id="F_T2"}],
 ["F UNKNOWN credited",f=>{f.cases[5].expected.F_UNKNOWN_eligible=true}],
 ["F late event rewrites prior choice",f=>{f.cases[5].expected.backdated_prior_decision=true}],
 ["F queued review counted rendered",f=>{f.cases[5].events[5].rendered=1}],
 ["F pending outcome marked success",f=>{f.cases[5].events[6].independent_outcome="success"}],
 ["F arrival precedes occurrence",f=>{f.cases[5].events[4].arrived_at="2026-10-07T12:00:00Z"}],
 ["unsupported boundary falsified",f=>{f.status="IMPLEMENTED"}]
];
for(const [name,mutate] of mutations){
 const changed=JSON.parse(raw);mutate(changed);
 let rejected=false;try{verify(changed)}catch{rejected=true}
 if(!rejected)throw Error('Negative mutation accepted: '+name);
}
console.log('F223 structural PASS: '+result.cases+' synthetic cases, '+result.assertions+' assertions, '+result.events+' events, '+mutations.length+' negative mutations rejected.');
console.log('BOUNDARY: CEFR/rubric bindings, independent semantic and comparability review, actual engine decisions, human efficacy and exact-head harness remain UNSUPPORTED.');
