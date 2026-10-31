// F218 synthetic structural guard only. Does not execute the LinguaChat tutor or establish human learning efficacy.
// Run: node docs/curriculum/fixtures/f218-cross-objective-structural-check.mjs
import {readFileSync} from 'node:fs';
const clone=x=>JSON.parse(JSON.stringify(x));
const ok=(x,m)=>{if(!x)throw Error(m)};
const event=(c,id)=>c.events.find(x=>x.id===id);
const control=(c,which='matched_control')=>{
 const out=clone(c.events);const spec=c[which];ok(spec&&Array.isArray(spec.replace),'control missing');
 for(const p of spec.replace){const target=out.find(x=>x.id===p.event_id);ok(target,'control target missing');const {event_id,...patch}=p;Object.assign(target,patch)}
 return id=>out.find(x=>x.id===id);
};
function check(f){
 ok(f.schema_id==='linguachat.curriculum.f218.machine_readable.v1'&&f.status==='DESIGN_ONLY_UNSUPPORTED','schema/status');
 ok(f.source_binding.source_resolution==='UNSUPPORTED'&&f.source_binding.cefr_can_do_id==='REQUIRES_EXISTING_VERSIONED_SOURCE_BINDING'&&f.source_binding.rubric_version==='REQUIRES_REVIEWED_RUBRIC'&&f.source_binding.prerequisite_graph_version==='REQUIRES_REVIEWED_GRAPH','unresolved CEFR/rubric/prerequisite binding');
 ok(f.clock.timezone==='UTC'&&Number.isInteger(f.seed),'deterministic clock');
 ok(['reviewed_meaning_oracle_per_event','per_assertion_PASS_FAIL_UNSUPPORTED','per_skill_due_offered_rendered_completed_missing','actual_next_instruction_rendered','independent_reviewer_signoff','exact_engine_HEAD'].every(k=>f.required_harness_outputs.includes(k)),'harness boundaries');
 ok(f.acceptance_assertions.length===9&&f.cases.map(x=>x.id).join('')==='ABCDEF','six cases / nine assertions');
 let count=0;const allIds=new Set();let ledgers=0;
 for(const c of f.cases){
  ok(c.events.length>=5&&c.objective_families.length>0&&c.expected&&c.matched_control,'case metadata');
  let lastDay=-1,lastSeq=-1;const local=new Set(),sessionDay=new Map();
  for(const x of c.events){
   ok(x.id&&!allIds.has(x.id)&&x.learner_id==='synthetic-learner-'+c.id&&x.task_version==='SYNTHETIC_F218_V1'&&x.policy_version==='F218_DESIGN_V1','event identity/version');
   ok(Number.isInteger(x.day_offset)&&Number.isInteger(x.sequence)&&x.day_offset>=0&&x.sequence>0&&x.session&&x.occurred_at,'event provenance');
   ok(x.session===c.id.toLowerCase()+'-day'+x.day_offset,'session learning-day identity');
   ok(x.day_offset>lastDay||(x.day_offset===lastDay&&x.sequence>lastSeq),'trusted occurrence order');
   if(sessionDay.has(x.session))ok(sessionDay.get(x.session)===x.day_offset,'session/day mismatch');else sessionDay.set(x.session,x.day_offset);
   lastDay=x.day_offset;lastSeq=x.sequence;allIds.add(x.id);local.add(x.id);count++;
  }
  for(const spec of [c.matched_control,c.interest_only_control].filter(Boolean))for(const p of spec.replace)ok(local.has(p.event_id),'missing matched-control target');
  ok(c.followup_ledger.length>=1,'skill ledger missing');
  for(const l of c.followup_ledger){
   ok(l.skill&&['due','offered','rendered','completed','missing_unrendered','pending_rendered'].every(k=>Number.isInteger(l[k])&&l[k]>=0),'ledger fields');
   ok(l.completed<=l.rendered&&l.rendered<=l.offered&&l.offered<=l.due,'ledger bounds');
   ok(l.missing_unrendered===l.due-l.rendered&&l.pending_rendered===l.rendered-l.completed,'ledger denominators');
   ledgers++;
  }
 }
 const [A,B,C,D,E,F]=f.cases;const [a,b,c,d,e,g]=f.cases.map(x=>control(x));
 ok(event(A,'A1').independent&&event(A,'A1').reviewed_meaning==='age_expression_error'&&event(A,'A2').independent&&event(A,'A2').reviewed_meaning==='age_expression_error','A independent age errors');
 ok(event(A,'A3').reviewed_meaning==='accepted'&&event(A,'A3').mastery_cross_credit===false&&event(A,'A4').rendered===true,'A possession/contrast');
 ok(event(A,'A5').day_offset>=7&&event(A,'A5').independent&&event(A,'A5').new_context&&event(A,'A5').reviewed_meaning==='requires_review'&&event(A,'A5').cross_objective_mastery_credit===false,'A delayed unreviewed transfer');
 ok(a('A2').independent===false&&a('A2').eligible_pattern===false&&A.expected.native_language_inferred===false,'A copied control / no demographic inference');
 ok(event(B,'B1').reviewed_meaning==='irregular_past_error'&&event(B,'B2').reviewed_meaning==='accepted'&&event(B,'B2').other_objective_downgrade===false,'B different morphology');
 ok(event(B,'B3').audio_reviewable===false&&event(B,'B3').channel_valid===false&&event(B,'B3').reviewed_meaning==='UNKNOWN'&&event(B,'B3').oral_failure_credit===false,'B ASR invalid');
 ok(b('B3').audio_reviewable===true&&b('B3').channel_valid===true&&b('B3').oral_failure_credit===true&&event(B,'B5').oral_mastery_credit===false,'B reviewed oral control / separate skill');
 ok(event(C,'C1').prerequisite_relation==='versioned_relevant_not_mandatory'&&event(C,'C2').advanced_mastery_credit===false,'C prerequisite boundary');
 ok(event(C,'C3').rendered&&event(C,'C3').graph_mutated===false&&event(C,'C3').new_mandatory_gate===false,'C no invented gate');
 ok(event(C,'C4').independent&&event(C,'C4').advanced_mastery_credit===false&&event(C,'C5').rendered===false&&event(C,'C5').mastery_credit===false,'C unearned advanced objective');
 ok(c('C1').time_reference_understood===true&&c('C1').prerequisite_hypothesis_weakened===true,'C matched competing cause');
 ok(event(D,'D1').independent&&event(D,'D1').reviewed_meaning==='agreement_error'&&event(D,'D2').rendered===true&&event(D,'D2').answer_bearing===true,'D original/error/exposure');
 ok(event(D,'D3').assisted===true&&event(D,'D3').mastery_credit===false&&event(D,'D4').day_offset===0&&event(D,'D4').delayed_retrieval_credit===false,'D coached same-day not delayed');
 ok(event(D,'D5').day_offset>=7&&event(D,'D5').independent===true&&event(D,'D5').new_item===true&&event(D,'D5').causal_method_proof===false,'D clean later observation no causal proof');
 ok(event(D,'D6').independent===true&&event(D,'D6').reviewed_meaning==='agreement_error'&&event(D,'D6').review_debt_retained===true&&d('D5').independent===false&&d('D5').clean_delayed_credit===false,'D contradictory control');
 ok(['E1','E2'].every(id=>event(E,id).reviewed_meaning==='accepted_variant'&&event(E,id).variety_reviewed&&event(E,id).error_counted===false),'E accepted varieties');
 ok(event(E,'E3').task_valid===false&&event(E,'E3').reviewed_meaning==='UNKNOWN'&&event(E,'E3').error_counted===false,'E invalid task unknown');
 ok(event(E,'E4').audio_rendered===false&&event(E,'E4').listening_credit===false&&event(E,'E4').error_counted===false,'E listening not played');
 ok(e('E3').task_valid===true&&e('E3').reviewed_meaning==='request_function_error'&&e('E3').error_counted===true,'E valid task control');
 const interest=control(E,'interest_only_control');const orig=event(E,'E5'),switched=interest('E5');
 ok(orig.interest==='gaming'&&switched.interest==='cooking'&&E.interest_only_control.replace.length===1,'E only interest changed');
 ok(E.interest_only_control.fixed_fields.every(k=>JSON.stringify(orig[k])===JSON.stringify(switched[k])),'E fixed method/rubric/skill');
 ok(orig.method_confidence_changed===false&&orig.rubric_changed===false&&orig.required_objectives_changed===false&&['adjacent_eligible','neutral_eligible','unfamiliar_eligible','skill_coverage_preserved'].every(k=>orig[k]===true),'E balanced contexts');
 const probes=['F1','F2','F3','F4'].map(id=>event(F,id));
 ok(probes.every(x=>x.independent===true&&x.comparable===true&&x.assistance==='none'&&x.trusted_chronology===true&&x.new_item===true)&&new Set(probes.map(x=>x.session)).size===4,'F four distinct clean probes');
 ok(probes.filter(x=>x.outcome==='success').length===2&&probes.filter(x=>x.outcome==='failure').length===2,'F contradictory outcomes');
 ok(probes.every(x=>g(x.id).outcome!==x.outcome)&&g('F8').method!==event(F,'F8').method,'F counterfactual outcomes and choice');
 ok(event(F,'F5-original').assisted===true&&event(F,'F5-original').mastery_credit===false&&event(F,'F5').duplicate_of==='F5-original'&&event(F,'F5').mastery_credit===false,'F duplicate exclusion');
 ok(event(F,'F6').trusted_chronology===false&&event(F,'F6').render_chronology==='UNKNOWN'&&event(F,'F6').mastery_credit===false,'F unknown quarantined');
 ok(event(F,'F7').rendered===false&&event(F,'F8').rendered===true&&event(F,'F8').reversible===true&&event(F,'F8').uncertainty==='high'&&event(F,'F8').context==='neutral','F actual delivered reversible choice');
 ok(F.arrival_order.length===F.events.length&&new Set(F.arrival_order).size===F.events.length&&F.arrival_order.every(id=>F.events.some(x=>x.id===id))&&F.arrival_order[0]==='F4','F out-of-order replay fixture');
 ok(F.expected.eligible_successes===2&&F.expected.eligible_failures===2&&F.expected.causal_superiority_claimed===false&&F.expected.coverage_debt_retained===true,'F uncertainty / no causal claim');
 return {cases:6,events:count,matched_controls:6,interest_only_controls:1,acceptance_assertions:9,skill_ledgers:ledgers};
}
const mutations=[
 ['source falsely resolved',f=>f.source_binding.source_resolution='RESOLVED'],
 ['prerequisite binding erased',f=>f.source_binding.prerequisite_graph_version='NEW_GATE'],
 ['reviewer missing',f=>f.required_harness_outputs=f.required_harness_outputs.filter(x=>x!=='independent_reviewer_signoff')],
 ['A copied counted independent',f=>f.cases[0].matched_control.replace[0].independent=true],
 ['A valid possession penalized',f=>event(f.cases[0],'A3').reviewed_meaning='age_expression_error'],
 ['A unreviewed transfer passed',f=>event(f.cases[0],'A5').reviewed_meaning='accepted'],
 ['A other objective credited',f=>event(f.cases[0],'A5').cross_objective_mastery_credit=true],
 ['B ASR counted failure',f=>event(f.cases[1],'B3').oral_failure_credit=true],
 ['B regular past downgraded',f=>event(f.cases[1],'B2').other_objective_downgrade=true],
 ['B control audio unreviewable',f=>f.cases[1].matched_control.replace[0].audio_reviewable=false],
 ['C prerequisite gate invented',f=>event(f.cases[2],'C3').new_mandatory_gate=true],
 ['C advanced mastery shortcut',f=>event(f.cases[2],'C4').advanced_mastery_credit=true],
 ['C control not weakening',f=>f.cases[2].matched_control.replace[0].prerequisite_hypothesis_weakened=false],
 ['D model not rendered',f=>event(f.cases[3],'D2').rendered=false],
 ['D assisted repeat credited',f=>event(f.cases[3],'D3').mastery_credit=true],
 ['D same-day counted delayed',f=>event(f.cases[3],'D4').delayed_retrieval_credit=true],
 ['D later contradiction removed',f=>event(f.cases[3],'D6').reviewed_meaning='accepted'],
 ['D model-exposed control clean',f=>f.cases[3].matched_control.replace[0].independent=true],
 ['E valid variety rejected',f=>event(f.cases[4],'E1').error_counted=true],
 ['E invalid task treated as failure',f=>event(f.cases[4],'E3').error_counted=true],
 ['E inaccessible listening credited',f=>event(f.cases[4],'E4').listening_credit=true],
 ['E interest changes method confidence',f=>event(f.cases[4],'E5').method_confidence_changed=true],
 ['E neutral context excluded',f=>event(f.cases[4],'E5').neutral_eligible=false],
 ['E interest-only control changes rubric',f=>f.cases[4].interest_only_control.replace[0].rubric_changed=true],
 ['F duplicate credited',f=>event(f.cases[5],'F5').mastery_credit=true],
 ['F unknown credited',f=>event(f.cases[5],'F6').mastery_credit=true],
 ['F next choice not delivered',f=>event(f.cases[5],'F8').rendered=false],
 ['F counterfactual unchanged',f=>f.cases[5].matched_control.replace[0].outcome='failure'],
 ['F impossible ledger',f=>f.cases[5].followup_ledger[0].completed=9],
 ['F arrival replay identity missing',f=>f.cases[5].arrival_order[0]='FAKE'],
 ['session chronology corruption',f=>event(f.cases[3],'D4').session='d-day9']
];
const fixture=JSON.parse(readFileSync(new URL('./f218-cross-objective-error-attribution.synthetic.json',import.meta.url),'utf8'));
const summary=check(fixture);
for(const [name,change] of mutations){const copy=clone(fixture);change(copy);let rejected=false;try{check(copy)}catch{rejected=true}if(!rejected)throw Error('Mutation escaped: '+name)}
console.log(JSON.stringify({...summary,negative_mutations_rejected:mutations.length,status:'SYNTHETIC_STRUCTURAL_ONLY'}));
