// F222 method-selection confounding structural guard. Synthetic only; not a causal or learner-efficacy proof.
// Run: node docs/curriculum/fixtures/f222-method-selection-confounding-structural-check.mjs
import {readFileSync} from 'node:fs';

function verify(f){
 const ok=(v,m)=>{if(!v)throw Error(m)};
 ok(f.schema_id==="linguachat.curriculum.f222.machine_readable.v1"&&f.status==="DESIGN_ONLY_UNSUPPORTED"&&f.source_binding?.source_resolution==="UNSUPPORTED","design/source boundary");
 ok(f.source_binding?.cefr_can_do_id==="REQUIRES_EXISTING_VERSIONED_SOURCE_BINDING"&&f.source_binding?.rubric_version==="REQUIRES_REVIEWED_RUBRIC"&&f.source_binding?.channel_version==="REQUIRES_SUPPORTED_CHANNEL_BINDING","unresolved CEFR/rubric/channel");
 ok(f.clock?.timezone==="UTC"&&f.clock?.day_semantics==="elapsed_24h_not_automatic_meaningful_delay"&&Number.isInteger(f.seed),"trusted clock/seed");
 ok(f.assertions?.length===9&&f.assertions.every(x=>typeof x==="string"&&x.length>20)&&f.cases?.map(c=>c.id).join("")==="ABCDEF","six cases/nine assertions");
 ok(["exact_curriculum_HEAD","exact_engine_HEAD","per_assertion_PASS_FAIL_UNSUPPORTED","due_offered_rendered_completed_missing_counts","actual_next_instruction_rendered","independent_reviewer_signoff"].every(x=>f.required_harness_outputs?.includes(x)),"independent harness boundary");
 let events=0;
 for(const c of f.cases){
  ok(c.status==="UNSUPPORTED_UNTIL_HARNESS"&&c.objective_binding==="EXISTING_VERSIONED_CEFR_CAN_DO_REQUIRED"&&c.rubric_binding==="INDEPENDENT_REVIEW_REQUIRED"&&c.channel_binding==="SUPPORTED_CHANNEL_REQUIRED","case source unresolved "+c.id);
  ok(c.matched_control?.mutation&&c.expected&&c.events?.length>=3,"matched control "+c.id);
  const ids=new Set();
  for(const e of c.events){
   ok(typeof e.id==="string"&&!ids.has(e.id)&&Number.isInteger(e.day)&&e.day>=0&&typeof e.session==="string"&&e.session.length>0&&typeof e.type==="string","event identity/chronology "+e.id);
   ids.add(e.id);events++;
  }
 }
 const [A,B,C,D,E,F]=f.cases;
 const [as,af]=A.baseline;
 ok(as.group==="S"&&as.prior_errors===7&&as.first_unaided_correct===2&&as.method==="worked_scaffold"&&as.delayed_correct===4&&as.delayed_total===10,"A scaffolded group baseline");
 ok(af.group==="F"&&af.prior_errors===1&&af.first_unaided_correct===8&&af.method==="free_production"&&af.delayed_correct===8&&af.delayed_total===10,"A free-production group baseline");
 ok(A.events[0].type==="pre_choice_snapshot"&&A.events[0].baseline_ability==="UNEQUAL"&&["worked_scaffold","free_production"].every(x=>A.events[0].methods_feasible.includes(x)),"A unequal pre-choice snapshot");
 ok(A.events[1].type==="instruction_rendered"&&A.events[1].method==="worked_scaffold"&&A.events[1].dose>0&&A.events[2].type==="instruction_rendered"&&A.events[2].method==="free_production"&&A.events[2].dose>0&&A.events[3].type==="unseen_delayed_probe"&&A.events[3].day>=7,"A actual instruction/delay");
 ok(A.expected.original_comparability==="NOT_COMPARABLE"&&A.expected.no_global_method_winner===true&&A.expected.retain_scaffold_option===true&&A.matched_control.expected_comparability==="ELIGIBLE_FOR_CAUTION_NOT_CAUSAL_PROOF","A selection confounding verdict");
 const [b0,b1,b2,b3]=B.events;
 ok(b0.type==="pre_choice_snapshot"&&b0.interest==="games"&&b0.receptive_skill_debt.includes("listening")&&b1.method==="reading"&&b1.context==="familiar_games"&&b2.method==="listening"&&b2.context==="unfamiliar_transport"&&b3.type==="delayed_probe"&&b3.scores.reading===0.9&&b3.scores.listening===0.6,"B topic/method confounding");
 ok(B.matched_control.expected_comparability==="REQUIRES_REVIEWED_CONSTRUCT_EQUIVALENCE"&&B.expected.original_comparability==="NOT_COMPARABLE"&&B.expected.permanent_reader_label===false&&B.expected.listen_debt_retained===true&&B.expected.neutral_and_unfamiliar_rotation===true,"B no permanent reader/topic filter");
 const [c0,c1,c2,c3,c4]=C.events;
 ok(c0.type==="pre_choice_snapshot"&&c0.methods_feasible.includes("retrieval_first")&&c1.type==="answer_bearing_model_rendered"&&c1.method==="worked_example"&&c2.type==="assisted_repetition"&&c2.correct===9&&c2.total===10&&c2.independent===false,"C answer exposure/assisted accuracy");
 ok(c3.type==="first_unaided_attempt"&&c3.correct===6&&c3.total===10&&c3.independent===true&&c4.type==="unseen_cross_context_transfer"&&c4.day>=7&&c4.independent===true&&c4.answer_exposure_before_attempt===false,"C independent delayed transfer");
 ok(C.matched_control.expected_delayed_eligibility===false&&C.expected.assisted_repeats_do_not_certify_mastery===true&&C.expected.independent_delayed_outcome_priority===true&&C.expected.meaningful_delay_requires_no_intervening_answer_exposure===true,"C control and evidence priority");
 const [d0,dx,dy]=D.events;
 ok(d0.type==="pre_choice_snapshot"&&d0.method_candidates.includes("X")&&d0.method_candidates.includes("Y")&&dx.type==="followup_ledger"&&dy.type==="followup_ledger","D policy and follow-up ledgers");
 const ledger=(e,due,offered,rendered,completed,correct,missing)=>e.due===due&&e.offered===offered&&e.rendered===rendered&&e.completed===completed&&e.correct===correct&&e.missing_unrendered===missing&&e.due===e.completed+e.missing_unrendered&&e.completed<=e.rendered&&e.rendered<=e.offered;
 ok(dx.method==="X"&&ledger(dx,30,10,10,10,8,20)&&dy.method==="Y"&&ledger(dy,10,10,10,10,7,0),"D due/completed/missing denominators");
 ok(D.matched_control.expected_new_X.due===30&&D.matched_control.expected_new_X.rendered===30&&D.matched_control.expected_new_X.completed===30&&D.matched_control.expected_new_X.correct===18&&D.matched_control.expected_new_Y.correct===7&&D.expected.original_comparison==="NOT_COMPARABLE"&&D.expected.no_missing_imputation===true&&D.expected.no_offline_penalty===true,"D missingness control/verdict");
 const [e0,e1,e2,e3]=E.events;
 ok(e0.type==="pre_choice_snapshot"&&e0.speech_playback==="FAILED"&&e0.learner_requested==="written_explanation"&&e0.consent_to_audio===false&&e0.methods_feasible.length===1&&e0.methods_feasible[0]==="written_explanation","E accessible feasible candidates");
 ok(e1.type==="instruction_rendered"&&e1.method==="written_explanation"&&e2.type==="receptive_probe"&&e2.channel==="text"&&e2.independent===true&&e3.type==="skill_debt"&&e3.listening==="PENDING"&&e3.speaking==="PENDING","E oral debt not text certification");
 ok(E.matched_control.expected_future_feasible_methods.includes("audio_supported_method")&&E.expected.no_coerced_audio===true&&E.expected.no_learning_style_label===true&&E.expected.text_only_not_speaking_certification===true&&E.expected.only_feasible_exploration===true,"E consent/agency control");
 const [hard,easy]=F.illustrative_strata;
 const rate=(a)=>a.correct/a.total;
 ok(hard.context==="hard"&&easy.context==="easy"&&hard.P.total===20&&hard.Q.total===5&&easy.P.total===5&&easy.Q.total===20&&rate(hard.P)>rate(hard.Q)&&rate(easy.P)>rate(easy.Q),"F within-stratum Simpson pattern");
 ok(hard.P.correct+easy.P.correct===14&&hard.Q.correct+easy.Q.correct===18&&F.expected.pooled_rates.P==="14/25"&&F.expected.pooled_rates.Q==="18/25"&&F.expected.within_context_P_greater_than_Q===true&&F.expected.pooled_winner_not_causal===true,"F pooled-vs-stratum inference");
 const [f0,f1,f2,f3,f4,f5,f6]=F.events;
 ok(f0.type==="pre_choice_snapshot"&&f0.due_listening_review===true&&f0.topic_interest==="soft_only"&&f1.type==="instruction_rendered"&&f1.method==="P"&&f1.context==="hard","F pre-choice and delivered method");
 ok(f2.type==="unseen_transfer"&&f2.independent===true&&f2.stable_attempt_id==="F_TRANSFER_1"&&f3.type==="replayed_event"&&f3.stable_attempt_id===f2.stable_attempt_id&&F.expected.unique_F_TRANSFER_1_count===1,"F deduplicate transfer");
 ok(f4.answer_visibility==="UNKNOWN"&&F.expected.UNKNOWN_not_pass===true&&f5.type==="listening_review_queued"&&f5.rendered===false&&f5.completed===false&&F.expected.queued_not_completed===true,"F unknown and queued opportunity");
 ok(f6.type==="next_instruction_rendered"&&f6.method==="balanced_feasible_fallback"&&f6.skill==="listening"&&f6.rendered===true&&f6.independent_outcome==="PENDING"&&F.expected.rendered_next_choice_required===true&&F.matched_control.expected==="REASSESS_HYPOTHESIS_OR_BALANCED_FALLBACK","F actual balanced fallback/control");
 return {cases:6,assertions:9,events};
}

const raw=readFileSync(new URL('./f222-method-selection-confounding.synthetic.json',import.meta.url),'utf8');
const fixture=JSON.parse(raw);
const result=verify(fixture);
const mutations=[
 ["fabricated source binding",f=>{f.source_binding.source_resolution="RESOLVED"}],
 ["claim implemented",f=>{f.status="IMPLEMENTED"}],
 ["lost CEFR review requirement",f=>{f.cases[0].rubric_binding="APPROVED"}],
 ["A baseline equalized without control",f=>{f.cases[0].baseline[0].prior_errors=1}],
 ["A unrendered scaffold",f=>{f.cases[0].events[1].dose=0}],
 ["A false causal winner",f=>{f.cases[0].expected.no_global_method_winner=false}],
 ["B interest mistaken for method",f=>{f.cases[1].events[2].context="familiar_games"}],
 ["B fixed reader label",f=>{f.cases[1].expected.permanent_reader_label=true}],
 ["B listening debt erased",f=>{f.cases[1].expected.listen_debt_retained=false}],
 ["C assisted repeats certified",f=>{f.cases[2].events[2].independent=true}],
 ["C transfer answer exposed",f=>{f.cases[2].events[4].answer_exposure_before_attempt=true}],
 ["C exposed control credited",f=>{f.cases[2].matched_control.expected_delayed_eligibility=true}],
 ["D unrendered follow-up counted completed",f=>{f.cases[3].events[1].completed=30}],
 ["D missing reviews imputed",f=>{f.cases[3].events[1].missing_unrendered=0}],
 ["D incomparable samples declared comparable",f=>{f.cases[3].expected.original_comparison="COMPARABLE"}],
 ["E audio without consent",f=>{f.cases[4].events[0].consent_to_audio=true}],
 ["E oral skill certified by text",f=>{f.cases[4].events[3].speaking="MASTERED"}],
 ["E permanent learning-style label",f=>{f.cases[4].expected.no_learning_style_label=false}],
 ["F inverted hard stratum",f=>{f.cases[5].illustrative_strata[0].P.correct=1}],
 ["F duplicate counted as new attempt",f=>{f.cases[5].events[3].stable_attempt_id="F_TRANSFER_2"}],
 ["F unknown counted as pass",f=>{f.cases[5].expected.UNKNOWN_not_pass=false}],
 ["F queued review falsely rendered",f=>{f.cases[5].events[5].rendered=true}],
 ["F next instruction not delivered",f=>{f.cases[5].events[6].rendered=false}],
 ["F pending outcome falsely successful",f=>{f.cases[5].events[6].independent_outcome="success"}]
];
for(const [name,mutate] of mutations){const changed=JSON.parse(raw);mutate(changed);let rejected=false;try{verify(changed)}catch{rejected=true}if(!rejected)throw Error('Negative mutation accepted: '+name)}
console.log('F222 structural PASS: '+result.cases+' synthetic cases, '+result.assertions+' assertions, '+result.events+' events, '+mutations.length+' negative mutations rejected.');
console.log('BOUNDARY: CEFR/rubric/channel binding, independent comparability review, actual policy outcomes and human efficacy remain UNSUPPORTED.');
