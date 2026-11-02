// F227 synthetic fixture structural check. No runtime adaptation or learning efficacy claim.
// Run from repository root: node docs/curriculum/fixtures/f227-opportunity-ledger-structural-check.mjs
import { readFileSync } from 'node:fs';

function verifyFixture(f){
  const check=(condition,message)=>{if(!condition)throw new Error(message)};
  check(f.schema_id==="linguachat.curriculum.f227.machine_readable.v1","wrong schema");
  check(f.status==="DESIGN_ONLY_UNSUPPORTED","fixture falsely marked as implemented");
  check(f.source_binding?.source_resolution==="UNSUPPORTED","unreviewed CEFR source marked resolved");
  check(Array.isArray(f.assertions)&&f.assertions.length===9&&f.assertions.every((a,i)=>a.id===i+1),"expected nine numbered assertions");
  check(Array.isArray(f.cases)&&f.cases.map(c=>c.id).join("")==="ABCDEF","expected six distinct ordered cases");
  for(const c of f.cases){
    check(c.fixture_verdict==="UNSUPPORTED_PENDING_EXECUTABLE_INDEPENDENT_REVIEW",`${c.id}: unsupported verdict changed`);
    check(c.source_binding==="REQUIRED"&&c.matched_control?.mutation&&c.matched_control?.expected,`${c.id}: missing reviewer/control boundary`);
    check(Array.isArray(c.events)&&c.events.length>=4,`${c.id}: insufficient event history`);
    const ids=new Set();
    for(const e of c.events){
      check(typeof e.id==="string"&&!ids.has(e.id),`${c.id}: duplicate or missing event id`);
      ids.add(e.id);
      const occurred=Date.parse(e.occurred_at),arrived=Date.parse(e.arrived_at);
      check(Number.isFinite(occurred)&&Number.isFinite(arrived)&&occurred<=arrived,`${c.id}/${e.id}: invalid occurrence/arrival chronology`);
    }
    const ledgers=c.opportunities_by_arm?Object.entries(c.opportunities_by_arm):[["all",c.opportunities]];
    for(const [arm,o] of ledgers){
      const prefix=`${c.id}/${arm}`;
      check(o&&["planned","due","offered","rendered","started","completed","independently_eligible","pending","not_observed"].every(k=>Number.isSafeInteger(o[k])&&o[k]>=0),`${prefix}: incomplete ledger`);
      check(o.planned>=o.due&&o.due>=o.offered&&o.offered>=o.rendered&&o.rendered>=o.started&&o.started>=o.completed,`${prefix}: impossible opportunity funnel`);
      check(o.independently_eligible<=o.completed,`${prefix}: uncompleted independent credit`);
      check(o.pending===o.started-o.completed,`${prefix}: pending mismatch`);
      check(o.not_observed===o.due-o.rendered,`${prefix}: unobserved mismatch`);
    }
  }
  const [A,B,C,D,E,F]=f.cases;
  check(A.opportunities.not_observed===3&&A.expected.observed_first_attempt_successes==="2/2"&&A.expected.graduate_can_do===false&&A.expected.stop_is_mastery===false&&A.expected.independent_transfer==="UNMEASURED"&&A.expected.delayed_retention==="UNMEASURED","A: stop-on-success mistaken for mastery");
  check(B.opportunities_by_arm.P.completed===8&&B.opportunities_by_arm.Q.completed===24&&B.expected.method_comparability==="NOT_COMPARABLE"&&B.expected.method_winner==="UNSUPPORTED"&&B.expected.imputed_P_missing_as_failure===false,"B: unequal stop arms compared or missing imputed");
  check(C.opportunities.independently_eligible===1&&C.expected.assisted_exit_credit===0&&C.expected.independent_exit==="UNMEASURED"&&C.expected.independent_probe_due===true&&C.expected.learner_permanently_labeled===false,"C: scaffolded practice counted as exit");
  check(D.opportunities.not_observed===6&&D.expected.productive_skill==="UNMEASURED"&&D.expected.clear_productive_skill_debt===false&&D.expected.learner_penalized_for_tutor_budget===false,"D: missing production counted as mastery/failure");
  check(E.opportunities.not_observed===2&&E.expected.method_comparability==="NOT_COMPARABLE"&&E.expected.method_winner==="UNSUPPORTED"&&E.expected.topic_exclusive===false&&E.expected.required_negotiation_skipped===false,"E: interest/stop confounding or objective skipped");
  const f1=F.events.find(e=>e.id==="F1"),f2=F.events.find(e=>e.id==="F2"),f4=F.events.find(e=>e.id==="F4"),f7=F.events.find(e=>e.id==="F7");
  check(f1?.attempt_id==="F-T1"&&f2?.type==="duplicate_replay"&&f2?.attempt_id===f1.attempt_id&&f2?.same_as==="F1"&&f2?.independent_credit_delta===0,"F: replay incorrectly earns independent credit");
  check(f4?.stop_actor==="LEARNER"&&F.expected.F4_is_policy_stop===false,"F: learner pause attributed to policy");
  check(f7?.started===true&&f7?.completed===false&&f7?.independent_outcome==="PENDING"&&F.opportunities.pending===1,"F: pending attempt treated as complete");
  check(F.expected.unique_F_T1_count===1&&F.expected.F5_imputed_failure===false&&F.expected.F0_rewritten===false&&F.expected.F3_rewritten===false&&F.expected.rubric_bridge==="PENDING"&&F.expected.cross_version_comparability==="NOT_COMPARABLE","F: duplicate, missing or late rubric mishandled");
  return {cases:f.cases.length,assertions:f.assertions.length,ledgers:f.cases.reduce((n,c)=>n+(c.opportunities_by_arm?Object.keys(c.opportunities_by_arm).length:1),0)};
}

const fixturePath = new URL('./f227-adaptive-stopping-opportunity-censoring.synthetic.json', import.meta.url);
const raw = readFileSync(fixturePath, 'utf8');
const fixture = JSON.parse(raw);
const result = verifyFixture(fixture);
const mutations = ["A missing opportunity","B spurious method winner","C assisted exit credit","D false productive mastery","E exclusive interests","F duplicate identity","F pending as complete"];
const alter = [
  f => { f.cases[0].opportunities.not_observed = 2; },
  f => { f.cases[1].expected.method_winner = 'P'; },
  f => { f.cases[2].expected.assisted_exit_credit = 1; },
  f => { f.cases[3].expected.productive_skill = 'MASTERED'; },
  f => { f.cases[4].expected.topic_exclusive = true; },
  f => { f.cases[5].events.find(e => e.id === 'F2').attempt_id = 'F-T2'; },
  f => { f.cases[5].events.find(e => e.id === 'F7').completed = true; }
];
for (let i = 0; i < alter.length; i++) {
  const changed = JSON.parse(raw);
  alter[i](changed);
  let rejected = false;
  try { verifyFixture(changed); } catch { rejected = true; }
  if (!rejected) throw new Error('Mutation not rejected: ' + mutations[i]);
}
console.log(`F227 structural fixture PASS: ${result.cases} synthetic cases, ${result.assertions} acceptance assertions, ${result.ledgers} opportunity ledgers, ${mutations.length} negative mutation checks.`);
console.log('BOUNDARY: structural consistency only; no engine integration, independently reviewed CEFR oracle, real learner outcomes or efficacy evidence.');
