// F226 synthetic dialogue/turn provenance structural guard. No runtime/CEFR/efficacy claim.
// node docs/curriculum/fixtures/f226-dialogue-turn-provenance-structural-check.mjs
import {readFileSync} from 'node:fs';
function verify(f){
 const ok=(v,m)=>{if(!v)throw Error(m)};
 ok(f.schema_id==="linguachat.curriculum.f226.machine_readable.v1"&&f.status==="DESIGN_ONLY_UNSUPPORTED"&&f.source_binding?.source_resolution==="UNSUPPORTED","source/release boundary");
 ok(f.assertions?.length===9&&f.assertions.every((a,i)=>a.id===i+1)&&f.cases?.map(c=>c.id).join("")==="ABCDEF","case/assertion count");
 for(const c of f.cases){
  ok(c.source_binding==="REQUIRED"&&c.fixture_verdict==="UNSUPPORTED_PENDING_EXECUTABLE_INDEPENDENT_REVIEW"&&c.matched_control?.mutation&&c.matched_control?.expected,"review gate "+c.id);
  const ids=new Set();
  for(const e of c.events){ok(typeof e.id==="string"&&!ids.has(e.id)&&e.session_id&&Date.parse(e.occurred_at)<=Date.parse(e.arrived_at)&&Number.isFinite(Date.parse(e.occurred_at))&&Number.isFinite(Date.parse(e.arrived_at)),"event chronology/identity "+e.id);ids.add(e.id)}
  const o=c.opportunities;ok(["due","offered","rendered","completed","missing"].every(k=>Number.isSafeInteger(o[k])&&o[k]>=0)&&o.due>=o.offered&&o.offered>=o.rendered&&o.rendered>=o.completed&&o.missing===o.due-o.completed,"opportunity ledger "+c.id);
 }
 const [A,B,C,D,E,F]=f.cases;
 ok(A.events.slice(0,3).every(e=>e.type==="independent_isolated_form"&&e.channel==="text"&&e.first_unaided===true)&&A.events[3].rendered===false&&A.expected.independent_contingent_dialogue==="UNMEASURED"&&A.expected.interaction_exit_certified===false&&A.expected.oral_or_listening_certified===false,"A isolated forms falsely certify dialogue");
 ok(B.events[0].decision_frozen===true&&B.events.slice(1,4).every(e=>e.assisted===true&&e.independent_credit_delta===0&&e.answer_exposure!=="VERIFIED_NONE")&&B.expected.independent_turns_credited===0&&B.expected.independent_exit==="UNMEASURED"&&B.expected.method_P_permanent_winner===false,"B assisted dialogue falsely independent");
 const c=C.events.slice(0,4);ok(new Set(c.map(e=>e.session_id)).size===1&&c.every((e,i)=>i===0||Date.parse(e.occurred_at)>Date.parse(c[i-1].occurred_at)),"C multi-turn session/ordering");
 ok(c[1].learner_intent==="request_repetition"&&c[1].answer_exposure==="VERIFIED_NONE"&&c[2].target_answer_revealed===false&&c[2].objective_simplified===false&&c[3].assisted===false&&C.expected.clarification_automatically_failed===false&&C.expected.neutral_repetition_automatically_assisted===false,"C clarification misattributed");
 ok(C.events[4].session_id!==c[0].session_id&&Date.parse(C.events[4].occurred_at)-Date.parse(c[3].occurred_at)>=86400000&&C.events[4].first_unaided===true&&C.events[4].channel==="text"&&C.expected.oral_or_listening_certified===false,"C later unseen text repair misattributed");
 ok(D.events[0].audio_capture_verified===false&&D.events[0].rendered===false&&D.events[1].recording_review==="UNAVAILABLE"&&D.events[1].learner_semantic_error==="UNKNOWN"&&D.events[2].device_or_network_interruption===true&&D.events[2].fluency_inference==="UNSUPPORTED"&&D.events[3].oral_transfer_eligible===false&&D.expected.oral_evidence==="UNSUPPORTED"&&D.expected.oral_skill_debt_retained===true,"D unsupported audio promoted");
 ok(["adjacent","neutral","unfamiliar"].every(k=>E.events[0].topic_weights[k]==="ELIGIBLE")&&E.events.slice(1,3).every(e=>e.assistance==="SCRIPTED"&&e.independent_negotiation_evidence===false)&&E.events.slice(3).every(e=>e.rendered===false)&&E.expected.negotiation_mastery==="UNMEASURED"&&E.expected.method_winner==="UNSUPPORTED"&&E.expected.travel_exclusive_topic_filter===false,"E interest bias");
 const [f0,f1,f2,f3,f4,f5,f6]=F.events;
 ok(f0.decision_frozen===true&&new Set([f1,f2,f3,f4].map(e=>e.session_id)).size===1&&[f1,f2,f3,f4].every((e,i,a)=>i===0||Date.parse(e.occurred_at)>Date.parse(a[i-1].occurred_at)),"F multi-turn session/ordering");
 ok(f2.type==="duplicate_replay"&&f2.same_as==="F1"&&f2.attempt_id===f1.attempt_id&&f2.turn_id===f1.turn_id&&f2.independent_credit_delta===0&&f1.independent_credit_delta===1,"F replay double count");
 ok(f3.assisted===true&&f3.answer_exposure==="ANSWER_BEARING_BEFORE_TURN"&&f3.independent_credit_delta===0&&f4.rendered===false&&f4.completed===false,"F assisted/unrendered scored");
 ok(f5.rubric_bridge==="NOT_COMPARABLE_PENDING_ADJUDICATION"&&f5.historical_pre_choice_preserved===true&&f5.original_evidence_preserved===true&&Date.parse(f5.arrived_at)>Date.parse(f5.occurred_at)&&f6.outcome==="PENDING"&&f6.completed===false&&F.expected.F_D1_complete===false&&F.expected.historical_choice_rewritten===false,"F late revision/pending rewritten");
 return {cases:6,assertions:9,dialogueEvents:8};
}
const raw=readFileSync(new URL('./f226-dialogue-contingency-pragmatic-repair.synthetic.json',import.meta.url),'utf8');
const fixture=JSON.parse(raw),result=verify(fixture);
const mutations=[
["C split session",f=>{f.cases[2].events[2].session_id="other";}],
["C reordered turns",f=>{f.cases[2].events[3].occurred_at="2026-10-01T12:00:05Z";}],
["C revealed answer",f=>{f.cases[2].events[2].target_answer_revealed=true;}],
["B assisted credit",f=>{f.cases[1].events[1].independent_credit_delta=1;}],
["D oral false mastery",f=>{f.cases[3].expected.oral_evidence="MASTERED";}],
["E exclusive topics",f=>{f.cases[4].events[0].topic_weights.neutral="EXCLUDED";}],
["F split session",f=>{f.cases[5].events[3].session_id="other";}],
["F replay credit",f=>{f.cases[5].events[2].independent_credit_delta=1;}],
["F assisted credit",f=>{f.cases[5].events[3].independent_credit_delta=1;}],
["F pending completed",f=>{f.cases[5].events[6].completed=true;}],
["F backdated choice",f=>{f.cases[5].events[5].historical_pre_choice_preserved=false;}]
];
for(const [name,mutate] of mutations){const f=JSON.parse(raw);mutate(f);let rejected=false;try{verify(f)}catch{rejected=true}if(!rejected)throw Error('Mutation accepted: '+name);}
console.log(`F226 structural PASS: ${result.cases} synthetic cases, ${result.assertions} assertions, ${result.dialogueEvents} ordered dialogue events, ${mutations.length} negative mutation checks.`);
console.log('BOUNDARY: no real engine, independently reviewed CEFR/pragmatic/audio oracle, longitudinal efficacy or release evidence.');
