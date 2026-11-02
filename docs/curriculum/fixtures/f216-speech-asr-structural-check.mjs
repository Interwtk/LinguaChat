// F216 synthetic structural guard only. No real ASR, speech evaluator, CEFR certification, or human efficacy.
// Run: node docs/curriculum/fixtures/f216-speech-asr-structural-check.mjs
import {readFileSync} from 'node:fs';
const clone=x=>JSON.parse(JSON.stringify(x));
const ev=(c,id)=>c.events.find(x=>x.id===id);
const ctrl=(c,kind='matched_control')=>{
 const copy=clone(c.events);
 for(const patch of c[kind]?.replace||[]){
  const target=copy.find(x=>x.id===patch.event_id);
  if(!target)throw Error('missing control event '+patch.event_id);
  const {event_id,...rest}=patch;Object.assign(target,rest);
 }
 return id=>copy.find(x=>x.id===id);
};
function validate(f){
 const ok=(condition,message)=>{if(!condition)throw Error(message)};
 ok(f.schema_id==='linguachat.curriculum.f216.machine_readable.v1'&&f.status==='DESIGN_ONLY_UNSUPPORTED','schema/status');
 ok(f.source_binding.source_resolution==='UNSUPPORTED'&&f.source_binding.cefr_can_do_id==='REQUIRES_EXISTING_VERSIONED_SOURCE_BINDING'&&f.source_binding.rubric_version==='REQUIRES_INDEPENDENT_REVIEW','unresolved source and rubric');
 ok(f.source_binding.asr_version==='REQUIRES_REAL_PROVIDER_BINDING'&&f.source_binding.tts_version==='REQUIRES_REAL_PROVIDER_BINDING','unresolved ASR/TTS');
 ok(f.source_binding.task_version==='SYNTHETIC_F216_V1'&&f.source_binding.policy_version==='F216_DESIGN_V1'&&f.clock.timezone==='UTC'&&Number.isInteger(f.seed),'versions/clock');
 ok(f.acceptance_assertions.length===9&&f.cases.map(c=>c.id).join('')==='ABCDEF','six cases/nine assertions');
 ok(['source_binding_resolution','per_event_capture_and_playback_provenance','independently_reviewed_semantic_oracle_when_available','per_assertion_PASS_FAIL_UNSUPPORTED','per_skill_due_offered_rendered_completed_missing','actual_next_instruction_rendered','exact_engine_HEAD','independent_reviewer_signoff'].every(k=>f.required_harness_outputs.includes(k)),'required independent harness outputs');
 const allIds=new Set();let eventCount=0,ledgerCount=0;
 for(const c of f.cases){
  ok(c.title&&c.objective&&c.skill&&c.events.length>=5&&c.matched_control&&c.expected,'case structure');
  let day=-1,sequence=-1;const ids=new Set();
  for(const x of c.events){
   ok(x.id&&!allIds.has(x.id)&&x.learner_id.startsWith('synthetic-learner-'+c.id)&&x.task_version==='SYNTHETIC_F216_V1'&&x.policy_version==='F216_DESIGN_V1','event identity/version');
   ok(Number.isInteger(x.day_offset)&&x.day_offset>=0&&Number.isInteger(x.sequence)&&x.sequence>0&&x.session===c.id.toLowerCase()+'-day'+x.day_offset,'event session/sequence');
   ok(x.day_offset>day||(x.day_offset===day&&x.sequence>sequence),'trusted event ordering');
   ok(x.occurred_at===new Date(Date.UTC(2026,9,1+x.day_offset,12,x.sequence)).toISOString(),'trusted event timestamp');
   day=x.day_offset;sequence=x.sequence;ids.add(x.id);allIds.add(x.id);eventCount++;
  }
  for(const kind of ['matched_control','interest_only_control'])if(c[kind]){
   ok(c[kind].replace.length>0,'empty control');
   for(const patch of c[kind].replace)ok(ids.has(patch.event_id),'control references unknown event');
  }
  ok(c.followup_ledger.length>=1,'missing coverage ledger');
  for(const l of c.followup_ledger){
   ok(l.skill===c.skill&&['due','offered','rendered','completed','missing_unrendered','pending_rendered'].every(k=>Number.isInteger(l[k])&&l[k]>=0),'ledger fields');
   ok(l.completed<=l.rendered&&l.rendered<=l.offered&&l.offered<=l.due,'ledger bounds');
   ok(l.missing_unrendered===l.due-l.rendered&&l.pending_rendered===l.rendered-l.completed,'missingness denominators');ledgerCount++;
  }
 }
 const [A,B,C,D,E,F]=f.cases,a=ctrl(A),b=ctrl(B),c=ctrl(C),d=ctrl(D),z=ctrl(E),ei=ctrl(E,'interest_only_control'),g=ctrl(F);
 ok(ev(A,'A1').capture==='valid'&&ev(A,'A1').independent===true&&ev(A,'A1').mastery_credit===false,'A capture without unsupported credit');
 ok(ev(A,'A2').hypothesis.includes('statue')&&ev(A,'A2').measurement_not_ground_truth===true&&ev(A,'A2').confidence==='low','A ASR measurement');
 ok(ev(A,'A3').oracle_kind==='synthetic_design_label_not_human_review'&&ev(A,'A3').human_review_available===false&&ev(A,'A3').mastery_credit===false&&ev(A,'A3').result==='meaning_preserved','A synthetic review boundary');
 ok(a('A1').utterance.includes('statue')&&a('A3').result==='meaning_critical_error'&&ev(A,'A5').status==='UNKNOWN'&&ev(A,'A5').mastery_credit===false,'A reviewed counterfactual and pending followup');
 ok(ev(B,'B1').actually_played===false&&ev(B,'B2').rendered===true&&ev(B,'B2').answer_bearing===true,'B transcript exposure without audio');
 ok(ev(B,'B3').independent===false&&ev(B,'B3').listening_mastery_credit===false&&ev(B,'B5').listening_mastery_credit===false,'B text not listening mastery');
 ok(b('B1').actually_played===true&&b('B2').rendered===false&&b('B3').independent===true&&b('B5').actually_played===true,'B audio-only matched control');
 ok(ev(C,'C1').permission==='declined'&&ev(C,'C1').learner_failure===false&&ev(C,'C3').capture==='corrupt'&&ev(C,'C3').learner_failure===false,'C permission and device failure nonpunitive');
 ok(ev(C,'C2').speaking_mastery_credit===false&&ev(C,'C5').coverage_debt_retained===true&&ev(C,'C5').oral_mastery_credit===false,'C text substitute and coverage debt');
 ok(c('C5').capture==='valid'&&c('C5').human_review_available===false&&c('C5').oral_mastery_credit===false,'C synthetic oracle cannot certify speech');
 ok(ev(D,'D1').independent===true&&ev(D,'D1').mastery_credit===false&&ev(D,'D2').rendered===true&&ev(D,'D3').rendered===true,'D first attempt and actual model exposure');
 ok(ev(D,'D4').independent===false&&ev(D,'D4').mastery_credit===false&&ev(D,'D5').new_item===true&&ev(D,'D5').human_review_available===false&&ev(D,'D5').mastery_credit===false,'D assisted repeat and unreviewed transfer');
 ok(d('D2').rendered===false&&d('D3').rendered===false&&d('D4').independent===true&&d('D4').mastery_credit===false,'D control still familiar item');
 ok(ev(E,'E1').asr_confidence==='high'&&ev(E,'E2').asr_confidence==='low'&&ev(E,'E1').cefr_credit===false&&ev(E,'E2').cefr_credit===false,'E ASR disparity not CEFR evidence');
 ok(ev(E,'E3').reviewed_variant==='UNKNOWN'&&ev(E,'E3').accent_identity_inferred===false&&ev(E,'E3').asr_as_ground_truth===false,'E variant review and no identity inference');
 ok(z('E1').synthetic_oracle==='accepted_variant'&&z('E2').synthetic_oracle==='accepted_variant'&&z('E1').human_review_available===false,'E matched variant controls still synthetic');
 ok(ev(E,'E4').interest==='gaming'&&ei('E4').interest==='cooking'&&['rubric_changed','objective_changed','method_confidence_changed'].every(k=>ev(E,'E4')[k]===false&&ei('E4')[k]===false),'E interests separate from assessment and method');
 ok(['adjacent_eligible','neutral_eligible','unfamiliar_eligible'].every(k=>ev(E,'E4')[k]===true&&ei('E4')[k]===true),'E topic diversity');
 ok(ev(F,'F1').capture==='missing'&&ev(F,'F1').learner_failure===false&&ev(F,'F3').independent===false&&ev(F,'F3').mastery_credit===false,'F missingness and assisted repeat');
 ok(ev(F,'F4').synthetic_oracle==='success'&&ev(F,'F5').synthetic_oracle==='meaning_critical_error'&&g('F4').synthetic_oracle==='meaning_critical_error'&&g('F5').synthetic_oracle==='success','F contradictory control outcomes');
 ok(ev(F,'F6').duplicate_of==='F3'&&ev(F,'F6').mastery_credit===false&&ev(F,'F7').exposure_chronology==='UNKNOWN'&&ev(F,'F7').quarantined===true&&ev(F,'F7').mastery_credit===false,'F replay and quarantine');
 ok(ev(F,'F8').rendered===true&&ev(F,'F8').reversible===true&&ev(F,'F8').uncertainty==='high'&&g('F8').method!==ev(F,'F8').method,'F next actually delivered reversible instruction');
 ok(F.arrival_order.length===F.events.length&&new Set(F.arrival_order).size===F.events.length&&F.arrival_order[0]==='F5'&&F.arrival_order.every(id=>F.events.some(x=>x.id===id)),'F out-of-order uploads');
 ok(F.expected.causal_superiority_claimed===false&&F.expected.coverage_debt_retained===true,'F no causal overclaim');
 for(const c of f.cases)ok(c.events.some(x=>x.type==='next_instruction_rendered'&&x.rendered===true),'actual delivered instruction');
 return {cases:6,events:eventCount,skill_ledgers:ledgerCount,matched_controls:6,interest_only_controls:1,acceptance_assertions:9};
}
const mutations=[
 ['source falsely resolved',x=>x.source_binding.source_resolution='RESOLVED'],
 ['rubric falsely reviewed',x=>x.source_binding.rubric_version='APPROVED'],
 ['ASR provider falsely bound',x=>x.source_binding.asr_version='PRODUCTION'],
 ['human reviewer requirement removed',x=>x.required_harness_outputs=x.required_harness_outputs.filter(k=>k!=='independent_reviewer_signoff')],
 ['A ASR ground truth asserted',x=>ev(x.cases[0],'A2').measurement_not_ground_truth=false],
 ['A fabricated human review',x=>ev(x.cases[0],'A3').human_review_available=true],
 ['A ASR error becomes mastery',x=>ev(x.cases[0],'A3').mastery_credit=true],
 ['A control loses meaning contrast',x=>x.cases[0].matched_control.replace[1].result='meaning_preserved'],
 ['A missing followup passed',x=>ev(x.cases[0],'A5').mastery_credit=true],
 ['B audio falsely played',x=>ev(x.cases[1],'B1').actually_played=true],
 ['B transcript exposure omitted',x=>ev(x.cases[1],'B2').rendered=false],
 ['B text credited listening',x=>ev(x.cases[1],'B3').listening_mastery_credit=true],
 ['B audio control not played',x=>x.cases[1].matched_control.replace[0].actually_played=false],
 ['C microphone refusal penalized',x=>ev(x.cases[2],'C1').learner_failure=true],
 ['C corrupt audio penalized',x=>ev(x.cases[2],'C3').learner_failure=true],
 ['C text credited speaking',x=>ev(x.cases[2],'C2').speaking_mastery_credit=true],
 ['C coverage debt hidden',x=>ev(x.cases[2],'C5').coverage_debt_retained=false],
 ['D model unrendered',x=>ev(x.cases[3],'D2').rendered=false],
 ['D assisted repeat credited',x=>ev(x.cases[3],'D4').mastery_credit=true],
 ['D transfer falsely human reviewed',x=>ev(x.cases[3],'D5').human_review_available=true],
 ['E confidence treated as CEFR',x=>ev(x.cases[4],'E2').cefr_credit=true],
 ['E accent identity inferred',x=>ev(x.cases[4],'E3').accent_identity_inferred=true],
 ['E interests change rubric',x=>x.cases[4].interest_only_control.replace[0].rubric_changed=true],
 ['E unfamiliar contexts blocked',x=>ev(x.cases[4],'E4').unfamiliar_eligible=false],
 ['F missing capture failed',x=>ev(x.cases[5],'F1').learner_failure=true],
 ['F assisted repetition credited',x=>ev(x.cases[5],'F3').mastery_credit=true],
 ['F contradictory evidence erased',x=>ev(x.cases[5],'F5').synthetic_oracle='success'],
 ['F replay credited',x=>ev(x.cases[5],'F6').mastery_credit=true],
 ['F unknown chronology credited',x=>ev(x.cases[5],'F7').mastery_credit=true],
 ['F next choice not delivered',x=>ev(x.cases[5],'F8').rendered=false],
 ['F counterfactual not reversed',x=>x.cases[5].matched_control.replace[0].synthetic_oracle='success'],
 ['F unknown replay id',x=>x.cases[5].arrival_order[0]='FAKE'],
 ['impossible missingness denominator',x=>x.cases[0].followup_ledger[0].missing_unrendered=99],
 ['wrong event session',x=>ev(x.cases[0],'A1').session='a-day9'],
 ['wrong event timestamp',x=>ev(x.cases[0],'A1').occurred_at='2026-10-01T12:01:00Z']
];
const fixture=JSON.parse(readFileSync(new URL('./f216-speech-asr-accessibility.synthetic.json',import.meta.url),'utf8'));
const summary=validate(fixture);
for(const [name,mutate] of mutations){
 const copy=clone(fixture);mutate(copy);let rejected=false;
 try{validate(copy)}catch{rejected=true}
 if(!rejected)throw Error('Mutation escaped: '+name);
}
console.log(JSON.stringify({...summary,negative_mutations_rejected:mutations.length,status:'SYNTHETIC_STRUCTURAL_ONLY'}));
