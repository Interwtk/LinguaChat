// F225 synthetic challenge/difficulty-drift structural guard; not a CEFR, runtime or efficacy oracle.
// Run: node docs/curriculum/fixtures/f225-challenge-drift-structural-check.mjs
import { readFileSync } from 'node:fs';

function verifyFixture(f){
 const check=(yes,msg)=>{if(!yes)throw Error(msg)};
 check(f.schema_id==="linguachat.curriculum.f225.machine_readable.v1","F225 schema changed");
 check(f.status==="DESIGN_ONLY_UNSUPPORTED"&&f.source_binding?.source_resolution==="UNSUPPORTED","unsupported/release gate removed");
 check(Array.isArray(f.assertions)&&f.assertions.length===9&&f.assertions.every((a,i)=>a.id===i+1),"nine acceptance assertions required");
 check(Array.isArray(f.cases)&&f.cases.map(c=>c.id).join("")==="ABCDEF","six ordered unique cases required");
 for(const c of f.cases){
  check(c.source_binding==="REQUIRED"&&c.fixture_verdict==="UNSUPPORTED_PENDING_EXECUTABLE_INDEPENDENT_REVIEW"&&c.matched_control?.mutation&&c.matched_control?.expected,c.id+": independent review/control boundary");
  check(Array.isArray(c.events)&&c.events.length>=4,c.id+": event history missing");
  const ids=new Set();
  for(const e of c.events){
   const occurred=Date.parse(e.occurred_at),arrived=Date.parse(e.arrived_at);
   check(typeof e.id==="string"&&!ids.has(e.id)&&typeof e.session_id==="string"&&Number.isFinite(occurred)&&Number.isFinite(arrived)&&occurred<=arrived,c.id+"/"+e.id+": event id or trusted chronology invalid");
   ids.add(e.id);
   if("demands_correct" in e)check(Number.isSafeInteger(e.demands_correct)&&Number.isSafeInteger(e.demands_total)&&e.demands_total>0&&e.demands_correct>=0&&e.demands_correct<=e.demands_total,c.id+"/"+e.id+": invalid demand score");
   if("immediate_correct" in e)check(Number.isSafeInteger(e.immediate_correct)&&Number.isSafeInteger(e.total)&&e.total>0&&e.immediate_correct>=0&&e.immediate_correct<=e.total,c.id+"/"+e.id+": invalid method score");
   if("correct" in e)check(Number.isSafeInteger(e.correct)&&Number.isSafeInteger(e.total)&&e.total>0&&e.correct>=0&&e.correct<=e.total,c.id+"/"+e.id+": invalid context score");
  }
  const o=c.opportunities;
  check(o&&["due","offered","rendered","completed","missing"].every(k=>Number.isSafeInteger(o[k])&&o[k]>=0)&&o.due>=o.offered&&o.offered>=o.rendered&&o.rendered>=o.completed&&o.missing===o.due-o.completed,c.id+": opportunity funnel or missing count");
 }
 const [A,B,C,D,E,F]=f.cases;
 check(A.events.slice(0,3).every(e=>e.difficulty==="D3"&&e.type==="independent_probe"&&e.first_unaided===true&&e.answer_exposure==="VERIFIED_NONE")&&A.events.slice(3).every(e=>e.difficulty==="D1"&&e.type==="adaptive_choice_delivered")&&A.expected.cross_difficulty_comparability==="NOT_COMPARABLE"&&A.expected.D3_exit_certified===false&&A.expected.reviewed_D3_probe_due===true&&A.expected.learning_gain_claim==="UNSUPPORTED","A: easier successes promoted to hard mastery");
 check(B.events.slice(0,2).every(e=>e.difficulty==="D1"&&e.demands_correct===e.demands_total)&&B.events[2].type==="pre_choice_snapshot"&&B.events[2].feasible_accessible_alternatives.includes("reviewed_D3_probe")&&B.events.slice(3).every(e=>e.difficulty==="D1")&&B.expected.higher_challenge_mastery==="UNMEASURED"&&B.expected.imputed_hard_failures===0&&B.expected.permanent_easy_learner_label===false&&B.expected.next_feasible_harder_or_novel_probe_required===true,"B: easy ceiling falsely limits or certifies learner");
 check(C.events[0].decision_frozen===true&&C.events[1].method==="P_worked_example"&&C.events[1].difficulty==="D1"&&C.events[1].answer_exposure==="WORKED_EXAMPLE_DELIVERED"&&C.events[2].method==="Q_retrieval_first"&&C.events[2].difficulty==="D3"&&C.events[2].answer_exposure==="VERIFIED_NONE"&&C.events.slice(1,3).every(e=>e.independent_unseen_delayed===false)&&C.events[3].rendered===false&&C.expected.method_winner==="UNSUPPORTED"&&C.expected.P_Q_comparability==="NOT_COMPARABLE"&&C.expected.alternative_sampling_allowed===true,"C: unbalanced methods compared or alternatives suppressed");
 check(D.events[0].difficulty==="D3"&&D.events[0].reviewed_semantic_outcome==="failure"&&D.events.slice(1,4).every(e=>e.type==="scaffolded_practice"&&e.assisted===true&&e.reviewed_semantic_outcome==="correct_repair")&&D.events[4].type==="independent_exit_scheduled"&&D.events[4].rendered===false&&D.events[4].completed===false&&D.expected.assisted_repair_count===3&&D.expected.independent_D3_exit_pass===false&&D.expected.exit_status==="NOT_ASSESSED"&&D.expected.next_fade_and_accessible_probe_due===true,"D: assisted repairs falsely counted as independent exit");
 check(E.events[0].interest_weights.neutral==="ELIGIBLE"&&E.events[0].interest_weights.unfamiliar==="ELIGIBLE"&&E.events[1].context==="travel_airport"&&E.events[1].difficulty==="D1"&&E.events[2].context==="neutral"&&E.events[3].context==="unfamiliar_negotiation"&&E.events.slice(2,4).every(e=>e.difficulty==="D3")&&["travel","adjacent","neutral","unfamiliar"].every(k=>E.events[4].eligible.includes(k))&&E.events[4].objective_unchanged===true&&E.expected.topic_exclusive_filter===false&&E.expected.required_negotiation_objective_skipped===false&&E.expected.cross_context_challenge_comparability==="NOT_COMPARABLE"&&E.expected.method_winner==="UNSUPPORTED","E: interest exclusivity or difficulty-confounded topic comparison");
 const [f0,f1,f2,f3,f4,f5,f6]=F.events;
 check(f0.decision_frozen===true&&f0.policy_version==="F225_DESIGN_V1"&&f1.attempt_id==="F-T1"&&f1.first_unaided===true&&f1.answer_exposure==="VERIFIED_NONE"&&f2.type==="duplicate_replay"&&f2.same_as==="F1"&&f2.attempt_id===f1.attempt_id&&f2.independent_credit_delta===0&&F.expected.unique_F_T1_count===1,"F: duplicate attempt credited or decision unfrozen");
 check(f3.difficulty==="D3"&&f3.rendered===false&&f3.completed===false&&f4.assisted===true&&f4.independent_credit_delta===0&&F.expected.F3_imputed_failure===false&&F.expected.F4_independent_exit===false,"F: unrendered/assisted outcomes scored");
 check(f5.from_version==="v1"&&f5.to_version==="v2"&&f5.signed_bridge==="ABSENT"&&f5.historical_record_preserved===true&&Date.parse(f5.occurred_at)<Date.parse(f5.arrived_at)&&f6.rendered===true&&f6.independent_outcome==="PENDING"&&F.expected.F0_rewritten===false&&F.expected.cross_version_comparability==="NOT_COMPARABLE"&&F.expected.F6_independent_outcome==="PENDING"&&F.expected.method_locked===false,"F: late calibration backdated, pending fabricated or method locked");
 return {cases:6,assertions:9,opportunityLedgers:6};
}

const raw=readFileSync(new URL('./f225-adaptive-challenge-difficulty-drift.synthetic.json',import.meta.url),'utf8');
const fixture=JSON.parse(raw);
const result=verifyFixture(fixture);
const mutations=[
 ["A false D3 mastery",f=>{f.cases[0].expected.D3_exit_certified=true;}],
 ["B permanent easy label",f=>{f.cases[1].expected.permanent_easy_learner_label=true;}],
 ["C false method winner",f=>{f.cases[2].expected.method_winner="P";}],
 ["C fabricated equivalent difficulty",f=>{f.cases[2].events[1].difficulty="D3";}],
 ["D assisted exit pass",f=>{f.cases[3].expected.independent_D3_exit_pass=true;}],
 ["D unrendered exit completed",f=>{f.cases[3].events[4].completed=true;}],
 ["E exclusive neutral filter",f=>{f.cases[4].events[0].interest_weights.neutral="EXCLUDED";}],
 ["E objective skipped",f=>{f.cases[4].expected.required_negotiation_objective_skipped=true;}],
 ["F replay double credit",f=>{f.cases[5].events[2].independent_credit_delta=1;}],
 ["F pending counted success",f=>{f.cases[5].events[6].independent_outcome="success";}],
 ["F calibration rewrites history",f=>{f.cases[5].events[5].historical_record_preserved=false;}],
 ["F invented signed bridge",f=>{f.cases[5].events[5].signed_bridge="REVIEWED";}],
 ["ledger invented completion",f=>{f.cases[0].opportunities.completed=1;}],
 ["event duplicate id",f=>{f.cases[1].events[1].id="B0";}],
 ["release gate falsified",f=>{f.status="IMPLEMENTED";}]
];
for(const [name,mutate] of mutations){
 const changed=JSON.parse(raw);mutate(changed);
 let rejected=false;try{verifyFixture(changed)}catch{rejected=true;}
 if(!rejected)throw Error('Negative mutation accepted: '+name);
}
console.log('F225 structural PASS: '+result.cases+' synthetic cases, '+result.assertions+' acceptance assertions, '+result.opportunityLedgers+' opportunity ledgers, '+mutations.length+' negative mutation checks.');
console.log('BOUNDARY: no engine execution, independently reviewed CEFR/difficulty/accessibility oracle, longitudinal learner outcomes, causal method comparison or release proof.');
