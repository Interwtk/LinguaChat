// F224 exposure/item-lineage structural guard. Synthetic only, not engine or efficacy proof.
// Run: node docs/curriculum/fixtures/f224-exposure-lineage-structural-check.mjs
import {readFileSync} from 'node:fs';
function verify(f){
 const ok=(v,m)=>{if(!v)throw Error(m)};
 ok(f.schema_id==="linguachat.curriculum.f224.machine_readable.v1"&&f.status==="DESIGN_ONLY_UNSUPPORTED"&&f.source_binding?.source_resolution==="UNSUPPORTED","source/release boundary");
 ok(f.assertions?.length===9&&f.assertions.every((a,i)=>a.id===i+1)&&f.cases?.map(c=>c.id).join("")==="ABCDEF","six cases/nine assertions");
 ok(f.global_rules?.interests?.includes("unfamiliar")&&f.global_rules?.outcome_separation?.includes("delayed_unseen_transfer"),"adaptation/transfer contract");
 const attempts=new Set();
 for(const c of f.cases){
  ok(c.binding?.source_resolution==="UNSUPPORTED"&&c.expected?.verdict==="UNSUPPORTED_UNTIL_HARNESS","case review boundary "+c.id);
  ok(c.matched_control?.mutation&&Array.isArray(c.matched_control.unchanged)&&c.matched_control.unchanged.length>=4,"matched control "+c.id);
  const ids=new Set();
  for(const e of c.events){
   const t=Date.parse(e.occurred_at),a=Date.parse(e.arrived_at);
   ok(e.id&&!ids.has(e.id)&&e.session&&Number.isFinite(t)&&Number.isFinite(a)&&t<=a,"event identity/chronology "+e.id);
   ids.add(e.id);
   if(e.attempt_id){
    if(attempts.has(e.attempt_id))ok(e.type==="replayed_submission"&&e.replay===true&&e.unique_attempt_increment===0,"duplicate credited "+e.id);
    else attempts.add(e.attempt_id);
   }
  }
 }
 const [A,B,C,D,E,F]=f.cases;
 const [a0,a1,a2,a3]=A.events;
 ok(a0.type==="pre_choice_snapshot"&&a1.type==="first_submission"&&a1.independent===true&&a1.answer_bearing_exposure_before===false&&a2.after_attempt===a1.attempt_id&&a2.answer_bearing===true&&Date.parse(a2.occurred_at)>Date.parse(a1.occurred_at),"A first attempt/post-attempt exposure");
 ok(a3.item_id===a1.item_id&&a3.same_prompt_as===a1.id&&a3.session!==a1.session&&Date.parse(a3.occurred_at)-Date.parse(a1.occurred_at)>=86400000&&a3.intervening_exposure_audit==="REQUIRED"&&A.expected.A3_seen_item_retrieval===true&&A.expected.A3_unseen_transfer===false&&A.expected.unseen_transfer_still_due===true,"A repeated item falsely unseen");
 const [b0,b1,b2,b3]=B.events;
 ok(b1.delivered===true&&b1.item_family===b2.item_family&&b2.different_surface_hash===true&&b2.reviewed_semantic_equivalence==="NEAR_DUPLICATE_SYNTHETIC_REVIEW_PENDING"&&b3.answer_template_previously_exposed===true&&B.expected.B3_clean_unseen_transfer===false&&B.expected.hash_novelty_sufficient===false,"B paraphrase/hash mistaken for novel");
 const [c0,c1,c2,c3,c4]=C.events;
 ok(c1.independent===true&&c1.answer_bearing_exposure_before===false&&c2.after_attempt===c1.attempt_id&&c2.delivered===true&&Date.parse(c2.occurred_at)>Date.parse(c1.occurred_at)&&c3.assisted===true&&c3.independent===false&&c4.session!==c1.session&&c4.novelty_oracle==="REQUIRED"&&C.expected.C3_independent_mastery===false&&C.expected.retroactive_contamination_of_C1===false,"C retroactive contamination/assisted repair");
 const [d0,d1,d2,d3,d4]=D.events;
 ok(d0.due_listening_review===true&&d0.due_speaking_review===true&&d1.answer_bearing_transcript_delivered===true&&d1.transcript_before_response===true&&d2.independent_listening_construct===false&&d3.audio_playback==="FAILED"&&d3.assessment==="NOT_ASSESSED"&&d4.channel==="text"&&D.expected.D4_certifies_listening===false&&D.expected.D4_certifies_speaking===false&&D.expected.accommodation_automatically_cheating===false,"D transcript/audio/text evidence");
 ok(E.pre_choice?.uncertainty==="HIGH"&&E.pre_choice?.interest_weights==="SOFT_ONLY"&&E.item_pools?.length===2&&E.item_pools[0].seen_item_families===20&&E.item_pools[1].unseen_item_families===20&&E.item_pools[0].immediate_successes>E.item_pools[1].immediate_successes&&E.events[3].comparison==="NOT_COMPARABLE"&&E.expected.naive_method_winner_valid===false&&E.expected.no_permanent_method_lock===true&&E.expected.unfamiliar_contexts_remain_eligible===true,"E rehearsed pool/method confounding");
 const [f0,f1,f2,f3,f4,f5,f6]=F.events;
 ok(f0.snapshot_frozen===true&&f0.missing===2&&f1.independent===true&&f1.answer_visibility==="VERIFIED_NO_EXPOSURE"&&f2.attempt_id===f1.attempt_id&&f2.replay===true&&f2.unique_attempt_increment===0&&F.expected.unique_F_T1_count===1,"F snapshot/replay");
 ok(f3.answer_visibility==="UNKNOWN"&&f4.predates_attempt===f3.attempt_id&&f4.answer_bearing===true&&f4.delivered===true&&Date.parse(f4.occurred_at)<Date.parse(f3.occurred_at)&&Date.parse(f4.arrived_at)>Date.parse(f3.arrived_at)&&f4.cannot_rewrite_snapshot==="F0"&&F.expected.F_T2_original_quarantined_or_excluded===true&&F.expected.F0_historical_choice_rewritten===false,"F cached render chronology");
 ok(f5.due===1&&f5.rendered===0&&f5.completed===0&&f5.missing===1&&f6.rendered===1&&f6.completed===0&&f6.independent_outcome==="PENDING"&&F.expected.F5_listening_completed===false&&F.expected.F6_independent_success===false&&F.expected.permanent_method_lock===false,"F queued/pending falsely successful");
 return {cases:6,assertions:9,uniqueAttempts:attempts.size};
}
const raw=readFileSync(new URL('./f224-internal-item-exposure.synthetic.json',import.meta.url),'utf8');
const fixture=JSON.parse(raw),result=verify(fixture);
const mutations=[
 ["A repeat called unseen",f=>{f.cases[0].expected.A3_unseen_transfer=true}],
 ["A delayed probe same session",f=>{f.cases[0].events[3].session="A_s0"}],
 ["A feedback before submission",f=>{f.cases[0].events[2].occurred_at="2026-10-01T12:01:00Z"}],
 ["B hash alone proves novelty",f=>{f.cases[1].expected.hash_novelty_sufficient=true}],
 ["B model not delivered",f=>{f.cases[1].events[1].delivered=false}],
 ["C assisted repair credited",f=>{f.cases[2].expected.C3_independent_mastery=true}],
 ["C retroactive contamination",f=>{f.cases[2].expected.retroactive_contamination_of_C1=true}],
 ["D transcript leakage ignored",f=>{f.cases[3].events[1].transcript_before_response=false}],
 ["D text certifies listening",f=>{f.cases[3].expected.D4_certifies_listening=true}],
 ["E biased methods comparable",f=>{f.cases[4].events[3].comparison="COMPARABLE"}],
 ["E permanent method lock",f=>{f.cases[4].expected.no_permanent_method_lock=false}],
 ["F duplicate earns credit",f=>{f.cases[5].events[2].unique_attempt_increment=1}],
 ["F cached render undelivered",f=>{f.cases[5].events[4].delivered=false}],
 ["F queued listening completed",f=>{f.cases[5].events[5].completed=1}],
 ["F pending writing passed",f=>{f.cases[5].expected.F6_independent_success=true}],
 ["F arrival before occurrence",f=>{f.cases[5].events[4].arrived_at="2026-10-09T11:00:00Z"}],
 ["release boundary falsified",f=>{f.status="IMPLEMENTED"}]
];
for(const [name,mutate] of mutations){const changed=JSON.parse(raw);mutate(changed);let rejected=false;try{verify(changed)}catch{rejected=true}if(!rejected)throw Error("Negative mutation accepted: "+name)}
console.log('F224 structural PASS: '+result.cases+' synthetic cases, '+result.assertions+' assertions, '+result.uniqueAttempts+' unique attempts, '+mutations.length+' negative mutation checks.');
console.log('BOUNDARY: no real engine, trusted render or semantic novelty oracle, independent CEFR review, causal method comparison or longitudinal efficacy proof.');
