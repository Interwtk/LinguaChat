// F215: synthetic structural acceptance guard, NOT a tutor/CEFR/human-efficacy test.
// Run: node docs/curriculum/fixtures/f215-cross-language-structural-check.mjs
import { readFileSync } from 'node:fs';
const clone = x => JSON.parse(JSON.stringify(x));
const ev = (c, id) => c.events.find(x => x.id === id);
const patched = (c, kind = 'matched_control') => {
  const copy = clone(c.events);
  for (const patch of c[kind]?.replace || []) {
    const target = copy.find(x => x.id === patch.event_id);
    if (!target) throw Error('unknown control event: ' + patch.event_id);
    const { event_id, ...fields } = patch;
    Object.assign(target, fields);
  }
  return id => copy.find(x => x.id === id);
};
function validate(f) {
  const ok = (value, reason) => { if (!value) throw Error(reason); };
  ok(f.schema_id === 'linguachat.curriculum.f215.machine_readable.v1' && f.status === 'DESIGN_ONLY_UNSUPPORTED', 'schema/status');
  ok(f.source_binding.source_resolution === 'UNSUPPORTED' &&
     f.source_binding.cefr_can_do_id === 'REQUIRES_EXISTING_VERSIONED_SOURCE_BINDING' &&
     f.source_binding.rubric_version === 'REQUIRES_INDEPENDENT_REVIEW' &&
     f.source_binding.translation_review === 'REQUIRES_INDEPENDENT_REVIEW', 'unresolved source/review');
  ok(f.source_binding.task_version === 'SYNTHETIC_F215_V1' &&
     f.source_binding.policy_version === 'F215_DESIGN_V1' &&
     f.clock.timezone === 'UTC' && Number.isInteger(f.seed), 'versions/clock');
  ok(f.cases.map(c => c.id).join('') === 'ABCDEF' && f.acceptance_assertions.length === 9, 'six cases/nine assertions');
  for (const name of ['versioned_cefr_rubric_and_translation_review',
    'per_event_language_request_render_and_exposure', 'first_unaided_target_response_and_assistance',
    'per_case_matched_and_interest_only_control', 'per_assertion_PASS_FAIL_UNSUPPORTED',
    'per_skill_due_offered_rendered_completed_missing', 'actual_next_instruction_rendered',
    'exact_engine_HEAD_and_executable_command', 'independent_reviewer_signoff',
    'delayed_unseen_target_transfer_and_missingness']) {
    ok(f.required_harness_outputs.includes(name), 'missing required independent harness output: ' + name);
  }
  const ids = new Set(); let count = 0; let ledgers = 0;
  for (const c of f.cases) {
    ok(c.title && c.skill && c.objective && c.events.length >= 5 && c.matched_control?.replace?.length > 0 && c.expected, 'case shape');
    let day = -1, seq = -1; const localIds = new Set();
    for (const x of c.events) {
      ok(x.id && !ids.has(x.id) && x.learner_id === 'synthetic-learner-' + c.id &&
        x.task_version === 'SYNTHETIC_F215_V1' && x.policy_version === 'F215_DESIGN_V1', 'event identity/version');
      ok(Number.isInteger(x.day_offset) && x.day_offset >= 0 && Number.isInteger(x.sequence) && x.sequence > 0 &&
        x.session === c.id.toLowerCase() + '-day' + x.day_offset, 'session/sequence');
      ok(x.day_offset > day || (x.day_offset === day && x.sequence > seq), 'trusted occurrence ordering');
      ok(x.occurred_at === new Date(Date.UTC(2026, 9, 1 + x.day_offset, 12, x.sequence)).toISOString(), 'trusted occurrence timestamp');
      ids.add(x.id); localIds.add(x.id); day = x.day_offset; seq = x.sequence; count++;
    }
    for (const kind of ['matched_control', 'interest_only_control']) {
      if (!c[kind]) continue;
      ok(c[kind].replace.length > 0, 'empty control');
      for (const p of c[kind].replace) ok(localIds.has(p.event_id), 'unknown control event');
    }
    ok(c.followup_ledger.length >= 1, 'missing followup ledger');
    for (const l of c.followup_ledger) {
      ok(l.skill === c.skill && ['due','offered','rendered','completed','missing_unrendered','pending_rendered']
        .every(k => Number.isInteger(l[k]) && l[k] >= 0), 'ledger fields');
      ok(l.completed <= l.rendered && l.rendered <= l.offered && l.offered <= l.due, 'ledger bounds');
      ok(l.missing_unrendered === l.due - l.rendered && l.pending_rendered === l.rendered - l.completed, 'ledger denominators');
      ledgers++;
    }
    ok(c.events.some(x => ['next_instruction_rendered','bridge_rendered'].includes(x.type) && x.rendered === true), 'next instruction must be actually rendered');
  }
  const [A,B,C,D,E,F] = f.cases;
  const a = patched(A), b = patched(B), c = patched(C), d = patched(D), e = patched(E), ei = patched(E,'interest_only_control'), z = patched(F);
  ok(ev(A,'A1').interface_locale === 'es' && ev(A,'A1').inferred_l1 === 'UNKNOWN' &&
    ev(A,'A1').method_confidence === 'UNKNOWN' && a('A1').interface_locale === 'en' &&
    a('A1').inferred_l1 === 'UNKNOWN' && a('A1').method_confidence === 'UNKNOWN', 'A locale not language identity');
  ok(ev(A,'A2').requested_language === 'es' && ev(A,'A2').verified_request === true &&
    ev(A,'A2').learner_language_identity === 'UNKNOWN' && ev(A,'A3').rendered === true &&
    ev(A,'A3').language === 'es' && ev(A,'A3').reversible === true, 'A requested bridge delivered');
  ok(ev(A,'A4').reviewed_rubric_available === false && ev(A,'A4').mastery_credit === false &&
    ev(A,'A5').status === 'UNKNOWN' && ev(A,'A5').mastery_credit === false, 'A unknown mastery');
  ok(ev(B,'B1').text === 'I have 20 years' && ev(B,'B1').independent === true &&
    ev(B,'B1').mastery_credit === false, 'B first attempt preserved');
  ok(ev(B,'B2').rendered === true && ev(B,'B2').answer_bearing === true &&
    ev(B,'B2').exposure === 'translation_and_model' && b('B2').rendered === false &&
    b('B2').exposure === 'not_delivered', 'B actual model exposure and control');
  ok(ev(B,'B3').independent === false && ev(B,'B3').mastery_credit === false &&
    b('B3').independent === false && b('B3').mastery_credit === false, 'B assisted repair not mastery');
  ok(ev(B,'B4').new_item === true && ev(B,'B4').independent === true &&
    ev(B,'B4').reviewed_rubric_available === false && ev(B,'B4').mastery_credit === false, 'B unreviewed transfer not certified');
  ok(ev(C,'C1').language === 'es' && ev(C,'C1').penalized === false &&
    ev(C,'C2').role === 'instruction' && ev(C,'C2').mastery_credit === false, 'C help language not penalized');
  ok(ev(C,'C3').language === 'mixed' && ev(C,'C3').code_switch_scope === 'required_target_lexeme' &&
    ev(C,'C4').full_target_production_met === false && ev(C,'C4').mastery_credit === false &&
    ev(C,'C4').rubric_status === 'independent_review_pending', 'C partial target output');
  ok(c('C3').language === 'en' && c('C3').code_switch_scope === 'none' &&
    c('C4').full_target_production_met === true && c('C4').mastery_credit === false &&
    ev(C,'C5').reviewed_rubric_available === false && ev(C,'C5').mastery_credit === false, 'C full-form synthetic control not certified');
  ok(ev(D,'D2').source_language_verified === false && ev(D,'D2').learner_l1 === 'UNKNOWN' &&
    ev(D,'D2').hypothesis === 'TENTATIVE' && ev(D,'D3').diagnosis_proven === false, 'D interference only tentative');
  ok(ev(D,'D4').synthetic_oracle === 'distinguishes_actually_currently' &&
    ev(D,'D4').mastery_credit === false && ev(D,'D5').method === 'balanced_review_lower_priority' &&
    d('D4').synthetic_oracle === 'persistent_meaning_critical_confusion' &&
    d('D5').method === 'targeted_contrastive_repractice', 'D opposite evidence revises actual method');
  ok(ev(E,'E1').information_equivalence === 'NOT_COMPARABLE' && ev(E,'E1').answer_leak_detected === true &&
    ev(E,'E2').rendered === true && ev(E,'E2').answer_visible_before_attempt === true &&
    ev(E,'E2').answer_bearing_translation === true, 'E answer leakage actually rendered');
  ok(ev(E,'E3').independent === false && ev(E,'E3').mastery_credit === false &&
    e('E2').answer_visible_before_attempt === false && e('E3').independent === true &&
    e('E3').mastery_credit === false, 'E contaminated versus clean synthetic control');
  ok(ev(E,'E4').interest === 'gaming' && ei('E4').interest === 'cooking' &&
    ['objective_changed','rubric_changed','method_confidence_changed'].every(k => ev(E,'E4')[k] === false && ei('E4')[k] === false) &&
    ['adjacent_eligible','neutral_eligible','unfamiliar_eligible'].every(k => ev(E,'E4')[k] === true && ei('E4')[k] === true), 'E interest layer separate and diverse');
  ok(ev(E,'E5').method === 'validated_neutral_unseen_prompt' && ev(E,'E6').status === 'UNKNOWN' &&
    ev(E,'E6').mastery_credit === false, 'E safe fallback and due unknown');
  ok(ev(F,'F1').offered === true && ev(F,'F1').rendered === false &&
    ev(F,'F2').rendered === true && ev(F,'F3').independent === false && ev(F,'F3').mastery_credit === false, 'F offered/rendered/assisted distinct');
  ok(ev(F,'F4').synthetic_oracle === 'meaning_critical_error' &&
    ev(F,'F6').synthetic_oracle === 'success' &&
    z('F4').synthetic_oracle === 'success' && z('F6').synthetic_oracle === 'meaning_critical_error' &&
    ev(F,'F4').mastery_credit === false && ev(F,'F6').mastery_credit === false, 'F opposite unreviewed delayed outcomes');
  ok(ev(F,'F7').exposure_chronology === 'UNKNOWN' && ev(F,'F7').quarantined === true &&
    ev(F,'F7').mastery_credit === false, 'F unknown exposure quarantine');
  ok(ev(F,'F8').rendered === true && ev(F,'F8').reversible === true &&
    ev(F,'F8').certainty === 'low' && ev(F,'F8').causal_superiority_claimed === false &&
    ev(F,'F8').method === 'balanced_english_paraphrase_sampling' &&
    z('F8').method === 'balanced_contrastive_bridge_sampling', 'F actual reversible choice changes');
  ok(F.arrival_order.length === F.events.length + 1 &&
    F.arrival_order.every(id => F.events.some(x => x.id === id)) &&
    new Set(F.arrival_order).size === F.events.length &&
    F.arrival_order.filter(id => id === 'F3').length === 2 &&
    F.arrival_order[0] === 'F6', 'F offline duplicate and reordered upload');
  ok(F.expected.causal_superiority_claimed === false && F.expected.unknown_exposure_quarantined === true, 'F no causal claim');
  return { cases:6, events:count, matched_controls:6, interest_only_controls:1, followup_ledgers:ledgers, acceptance_assertions:9 };
}
const mutations = [
 ['falsely released', x=>x.status='RELEASED'],
 ['CEFR falsely bound', x=>x.source_binding.source_resolution='RESOLVED'],
 ['rubric falsely reviewed', x=>x.source_binding.rubric_version='APPROVED'],
 ['translation falsely reviewed', x=>x.source_binding.translation_review='APPROVED'],
 ['independent reviewer omitted', x=>x.required_harness_outputs=x.required_harness_outputs.filter(k=>k!=='independent_reviewer_signoff')],
 ['A locale becomes L1', x=>ev(x.cases[0],'A1').inferred_l1='es'],
 ['A bridge request unverified', x=>ev(x.cases[0],'A2').verified_request=false],
 ['A bridge not delivered', x=>ev(x.cases[0],'A3').rendered=false],
 ['A locale control infers L1', x=>x.cases[0].matched_control.replace[0].inferred_l1='en'],
 ['A unknown transfer certified', x=>ev(x.cases[0],'A5').mastery_credit=true],
 ['B first attempt credited', x=>ev(x.cases[1],'B1').mastery_credit=true],
 ['B exposure hidden', x=>ev(x.cases[1],'B2').rendered=false],
 ['B assisted answer credited', x=>ev(x.cases[1],'B3').mastery_credit=true],
 ['B unreviewed transfer credited', x=>ev(x.cases[1],'B4').mastery_credit=true],
 ['B control pretends bridge rendered', x=>x.cases[1].matched_control.replace[0].rendered=true],
 ['C help request penalized', x=>ev(x.cases[2],'C1').penalized=true],
 ['C code-switch scope hidden', x=>ev(x.cases[2],'C3').code_switch_scope='none'],
 ['C incomplete form marked complete', x=>ev(x.cases[2],'C4').full_target_production_met=true],
 ['C control still code switches', x=>x.cases[2].matched_control.replace[0].language='mixed'],
 ['C unreviewed speech credited', x=>ev(x.cases[2],'C5').mastery_credit=true],
 ['D L1 guessed', x=>ev(x.cases[3],'D2').learner_l1='es'],
 ['D cause falsely proven', x=>ev(x.cases[3],'D3').diagnosis_proven=true],
 ['D opposite result does not change method', x=>x.cases[3].matched_control.replace[1].method='balanced_review_lower_priority'],
 ['E answer leak unmarked', x=>ev(x.cases[4],'E1').answer_leak_detected=false],
 ['E prompt exposure hidden', x=>ev(x.cases[4],'E2').answer_visible_before_attempt=false],
 ['E contaminated attempt independent', x=>ev(x.cases[4],'E3').independent=true],
 ['E interest alters method confidence', x=>ev(x.cases[4],'E4').method_confidence_changed=true],
 ['E unfamiliar topic blocked', x=>ev(x.cases[4],'E4').unfamiliar_eligible=false],
 ['E interest control alters rubric', x=>x.cases[4].interest_only_control.replace[0].rubric_changed=true],
 ['E unknown due marked mastered', x=>ev(x.cases[4],'E6').mastery_credit=true],
 ['F offered bridge falsely rendered', x=>ev(x.cases[5],'F1').rendered=true],
 ['F assisted repair credited', x=>ev(x.cases[5],'F3').mastery_credit=true],
 ['F contradictory outcome erased', x=>ev(x.cases[5],'F4').synthetic_oracle='success'],
 ['F unknown exposure credited', x=>ev(x.cases[5],'F7').mastery_credit=true],
 ['F next choice not rendered', x=>ev(x.cases[5],'F8').rendered=false],
 ['F causal superiority claimed', x=>ev(x.cases[5],'F8').causal_superiority_claimed=true],
 ['F matched choice fails to reverse', x=>x.cases[5].matched_control.replace[2].method='balanced_english_paraphrase_sampling'],
 ['F duplicate replay hidden', x=>x.cases[5].arrival_order=x.cases[5].arrival_order.filter((id,i)=>id!=='F3'||i===1)],
 ['F unknown arrival id', x=>x.cases[5].arrival_order[0]='FAKE'],
 ['bad ledger denominator', x=>x.cases[0].followup_ledger[0].missing_unrendered=99],
 ['bad event timestamp', x=>ev(x.cases[0],'A1').occurred_at='2026-10-01T12:01:00Z'],
 ['bad event session', x=>ev(x.cases[0],'A1').session='a-day9'],
 ['duplicate event identity', x=>ev(x.cases[1],'B1').id='A1']
];
const fixture = JSON.parse(readFileSync(new URL('./f215-cross-language-bridging-code-switching.synthetic.json', import.meta.url), 'utf8'));
const summary = validate(fixture);
for (const [name, mutation] of mutations) {
  const changed = clone(fixture); mutation(changed);
  let rejected = false;
  try { validate(changed); } catch { rejected = true; }
  if (!rejected) throw Error('Mutation escaped: ' + name);
}
console.log(JSON.stringify({ ...summary, negative_mutations_rejected:mutations.length, status:'SYNTHETIC_STRUCTURAL_ONLY' }));
