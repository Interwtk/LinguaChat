#!/usr/bin/env node
/*
 * check-adaptation-policy — P5, block B: the method-choice policy, before and after.
 *
 * Runs the SAME synthetic learners through two policies:
 *   p4   the policy as shipped in phase 5 (frozen copy: scripts/lib/teachingPolicyP4.mjs)
 *   p5   the current one (src/learning/engine/teachingPolicy.js)
 * with decisions made exactly as SessionRunner makes them (channel, then the
 * explanation style for that skill; seeded fallback when evidence is thin).
 *
 * Learners have hidden, invented chances of LATER INDEPENDENT success per
 * method, per capability and per skill. The policy sees only outcomes.
 *
 *   TUNING set (used while designing p5 — the P4 learners):
 *     ana  worked examples, always        ben  concise, always (listening harder)
 *     chen differs by capability          dana worked → concise on day 14
 *   HELD-OUT set (written before p5 was run on them; never used to tune):
 *     eve  concise → worked on day 9      finn two close methods (0.60 / 0.50), noisy
 *     gia  worked → concise on day 10 → worked again on day 20 (the old method returns)
 *     hal  high error rate (0.45 / 0.25)  ivy  listening prefers concise, writing prefers worked
 *     jon  practises every 3rd day, change on day 15
 *     kim  stable worked-example learner with ONE failure forced on day 15
 *   FRESH HELD-OUT set (written after round 1, when kim had been used to
 *   diagnose a fault and could no longer count as unseen; never used to tune):
 *     lea  stable concise learner, ONE failure forced on day 12, listening a bit harder
 *     max  only LISTENING changes (worked → concise on day 12); writing stays worked
 *     noa  both methods weak at first (0.35 / 0.25), concise becomes good on day 11
 *   FRESH-2 set (written after round 3 showed lucky SUCCESS runs over-credit an
 *   unused method, and before the failure-only rule was run; never used to tune):
 *     oli  stable concise learner, two ISOLATED failures forced on days 13 and 16
 *     pam  worked → concise on day 16, same for both skills
 *     quin both methods equally good (0.7 / 0.7): no thrashing, no harm
 *   PRECISION scenario (the criterion itself, without noise):
 *     zed  worked examples always work; two isolated failures forced on days 15 and 22
 *
 * Metrics (40 seeds): expected later independent success of the methods
 * chosen; transfer successes; days to adapt after a persistent change;
 * regressions; stability after one failure; behaviour with few data.
 * Simulated learners validate the ALGORITHM, never real-learner efficacy.
 *
 * Run: node scripts/check-adaptation-policy.mjs            (assertions)
 *      node scripts/check-adaptation-policy.mjs --report   (tables too)
 */
import assert from 'node:assert/strict'
import { createLearnerModel } from '../src/learning/engine/learnerModel.js'
import { seedFrom } from '../src/learning/engine/variation.js'
import * as P4 from './lib/teachingPolicyP4.mjs'
import * as P5 from '../src/learning/engine/teachingPolicy.js'

const REPORT = process.argv.includes('--report')
// ablation: rank methods over all skills together (no per-skill choice)
const POOLED = process.argv.includes('--pooled')
const DAY = 86400000
const HOUR = 3600000
const START = Date.UTC(2026, 9, 5)
const DAYS = 32
const SEEDS = Array.from({ length: 40 }, (_, i) => i * 7 + 3)
const INSTRUCTIONS = ['concise', 'worked_example']
const CHANNELS = ['reading', 'listening']
const W = 'worked_example', C = 'concise'
const r = (w, c) => ({ worked_example: w, concise: c })
const steps = (...pairs) => day => { let v = pairs[0][1]; for (const [from, val] of pairs) if (day >= from) v = val; return v }

/* rate(cap, day, skill) → {method: chance}; best(cap, day, skill) → method */
const LEARNERS = {
  ana: { set: 'tuning', rate: () => r(0.85, 0.3) },
  ben: { set: 'tuning', rate: (cap, day, skill) => skill === 'listening' ? r(0.2, 0.5) : r(0.35, 0.85) },
  chen: { set: 'tuning', rate: cap => cap === 'introduce_self' ? r(0.85, 0.3) : r(0.3, 0.85) },
  dana: { set: 'tuning', change: 14, rate: (cap, day) => steps([0, r(0.85, 0.3)], [14, r(0.3, 0.85)])(day) },
  eve: { set: 'held_out', change: 9, rate: (cap, day) => steps([0, r(0.3, 0.8)], [9, r(0.8, 0.3)])(day) },
  finn: { set: 'held_out', rate: () => r(0.6, 0.5) },
  gia: { set: 'held_out', change: 10, back: 20, rate: (cap, day) => steps([0, r(0.85, 0.3)], [10, r(0.3, 0.85)], [20, r(0.85, 0.3)])(day) },
  hal: { set: 'held_out', rate: () => r(0.45, 0.25) },
  ivy: { set: 'held_out', rate: (cap, day, skill) => skill === 'listening' ? r(0.3, 0.8) : r(0.8, 0.3) },
  jon: { set: 'held_out', every: 3, change: 15, rate: (cap, day) => steps([0, r(0.85, 0.3)], [15, r(0.3, 0.85)])(day) },
  kim: { set: 'diagnosed', forcedFailure: 15, rate: () => r(0.9, 0.3) },
  lea: { set: 'fresh', forcedFailure: 12, rate: (cap, day, skill) => skill === 'listening' ? r(0.25, 0.75) : r(0.3, 0.85) },
  max: { set: 'fresh', change: 12, rate: (cap, day, skill) => skill === 'listening' ? steps([0, r(0.85, 0.3)], [12, r(0.3, 0.85)])(day) : r(0.85, 0.3) },
  noa: { set: 'fresh', change: 11, rate: (cap, day) => steps([0, r(0.35, 0.25)], [11, r(0.35, 0.85)])(day) },
  oli: { set: 'fresh-2', forcedFailure: [13, 16], rate: () => r(0.3, 0.85) },
  pam: { set: 'fresh-2', change: 16, rate: (cap, day) => steps([0, r(0.85, 0.3)], [16, r(0.3, 0.85)])(day) },
  quin: { set: 'fresh-2', rate: () => r(0.7, 0.7) },
  zed: { set: 'precision', forcedFailure: [15, 22], rate: () => r(1, 0.3) },
}
const CAPS = ['introduce_self', 'cafe_order']
const best = (L, cap, day, skill) => { const x = L.rate(cap, day, skill); return x[W] >= x[C] ? W : C }
function prng(seed) { let x = seed >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 2 ** 32) }
const skillOf = channel => channel === 'listening' ? 'listening' : 'written'

function journey(policy, name, seed) {
  const L = LEARNERS[name]
  const rand = prng(seed * 1009 + name.length * 31)
  const model = createLearnerModel()
  const log = []
  const pending = {}
  for (let day = 0; day < DAYS; day++) {
    if (day % (L.every || 1)) continue
    for (const cap of CAPS) {
      const prev = pending[cap]
      if (prev) {
        const skill = skillOf(prev.channel)
        const p = L.rate(cap, day, skill)[prev.instruction]
        const forced = [].concat(L.forcedFailure ?? []).includes(day)
        const success = forced ? false : rand() < p
        policy.observeTeaching(model, { id: `${cap}:probe:${day}`, capability: cap, format: 'free_reply', session: `p${day}`,
          at: START + day * DAY + 8 * HOUR, success, independent: true, assisted: false, retried: false,
          channel: prev.channel, context: day % 3 ? 'home' : `ctx${day}`,
          listening: prev.channel === 'listening' ? { firstListenSuccess: success } : null })
        log.push({ kind: 'probe', day, cap, skill, success, p, best: L.rate(cap, day, skill)[best(L, cap, day, skill)] })
      }
      const seedKey = `${name}:${seed}:${day}:${cap}`
      const ch = policy.chooseTeaching(model, cap, CHANNELS, seedKey, 'channel')
      const channel = ch?.format || (seedFrom(seedKey + ':channel') % 2 ? 'reading' : 'listening')
      const skill = skillOf(channel)
      const d = policy.chooseTeaching(model, cap, INSTRUCTIONS, seedKey, 'instruction', POOLED ? {} : { skill })
      const instruction = d?.format || (seedFrom(seedKey + ':instruction') % 2 ? C : W)
      policy.observeTeaching(model, { id: `${cap}:lesson:${day}`, capability: cap, format: 'free_reply', session: `d${day}`,
        at: START + day * DAY + 9 * HOUR, success: null, instruction, channel, context: 'home' })
      pending[cap] = { instruction, channel }
      const next = day + (L.every || 1)
      log.push({ kind: 'lesson', day, cap, skill, instruction, reason: d?.reason || 'too_little_evidence',
        expected: L.rate(cap, next, skill)[instruction], best: best(L, cap, next, skill) })
    }
  }
  return { model, log }
}

const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN
const median = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN }
const informed = x => x.reason !== 'too_little_evidence' && x.reason !== 'exploration'

/* Days from a change until the policy picks the new best method on two informed decisions in a row. */
function adaptation(log, from, until = DAYS) {
  for (const cap of CAPS) void cap
  const days = [...new Set(log.filter(x => x.kind === 'lesson' && x.day >= from && x.day < until).map(x => x.day))].sort((a, b) => a - b)
  let streak = 0
  for (const day of days) {
    const ds = log.filter(x => x.kind === 'lesson' && x.day === day && informed(x))
    if (!ds.length) continue
    streak = ds.every(x => x.instruction === x.best) ? streak + 1 : 0
    if (streak >= 2) return day - from
  }
  return until - from
}

function measure(policy, name) {
  const L = LEARNERS[name]
  const runs = SEEDS.map(seed => journey(policy, name, seed))
  const lessons = runs.flatMap(x => x.log.filter(y => y.kind === 'lesson'))
  const after = L.change ?? 8
  const out = {
    expected: mean(lessons.filter(x => x.day >= after).map(x => x.expected)),
    expectedAll: mean(lessons.map(x => x.expected)),
    transfer: mean(runs.map(x => CAPS.reduce((s, cap) => s + policy.skillEvidence(x.model, cap, START + DAYS * DAY).written.transfer
      + policy.skillEvidence(x.model, cap, START + DAYS * DAY).listening.transfer, 0))),
    earlyInformed: mean(runs.map(x => x.log.filter(y => y.kind === 'lesson' && y.day < 3 && informed(y)).length)),
  }
  if (L.change != null) out.adapt = median(runs.map(x => adaptation(x.log, L.change, L.back ?? DAYS)))
  if (L.back != null) out.adaptBack = median(runs.map(x => adaptation(x.log, L.back)))
  if (L.forcedFailure != null) {
    // informed decisions on the 3 days after each forced failure that leave the method that still works
    const days = [].concat(L.forcedFailure)
    out.flipsAfterOneFailure = mean(runs.map(x => x.log.filter(y => y.kind === 'lesson' && informed(y) && y.instruction !== y.best
      && days.some(f => y.day > f && y.day <= f + 3)).length))
  }
  return out
}

const results = {}
for (const name of Object.keys(LEARNERS)) results[name] = { p4: measure(P4, name), p5: measure(P5, name) }

if (REPORT) {
  const f = (v, d = 2) => Number.isFinite(v) ? v.toFixed(d) : '—'
  console.log('learner  set       expected(p4→p5)   transfer(p4→p5)   adapt days(p4→p5)  back(p4→p5)  flips after 1 failure(p4→p5)')
  for (const [name, { p4, p5 }] of Object.entries(results)) {
    console.log(`${name.padEnd(8)} ${LEARNERS[name].set.padEnd(9)} ${f(p4.expected)} → ${f(p5.expected)}       ${f(p4.transfer, 1)} → ${f(p5.transfer, 1)}        ${f(p4.adapt, 0)} → ${f(p5.adapt, 0)}            ${f(p4.adaptBack, 0)} → ${f(p5.adaptBack, 0)}       ${f(p4.flipsAfterOneFailure)} → ${f(p5.flipsAfterOneFailure)}`)
  }
}

let passed = 0
const failures = []
function scenario(name, run) {
  try { run(); passed++; console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}
console.log('check-adaptation-policy')

const CHANGE = ['dana', 'eve', 'gia', 'jon', 'noa', 'pam']
const NOISY_ONE_FAILURE = ['kim', 'lea', 'oli']

/*
 * Targets written BEFORE round 1 (see the P5 report). They are reported, met or
 * not, rather than asserted: three were missed, and the policy was kept only
 * because the hard guarantees below hold. Hiding a missed target by moving its
 * threshold would defeat the point of writing it first.
 */
const TARGETS = [
  ['adapts faster on every change learner', CHANGE.every(n => results[n].p5.adapt < results[n].p4.adapt)],
  ['mean expected gain on change learners ≥ 0.05', mean(CHANGE.map(n => results[n].p5.expected - results[n].p4.expected)) >= 0.05],
  ['noisy one-failure learners: no more than +0.07 wrong decisions', NOISY_ONE_FAILURE.every(n => results[n].p5.flipsAfterOneFailure <= results[n].p4.flipsAfterOneFailure + 0.07)],
]
if (REPORT) for (const [what, met] of TARGETS) console.log(`  target ${met ? 'MET    ' : 'MISSED '} ${what}`)

scenario('adapts faster after a persistent change on most learners, and never slower', () => {
  const faster = CHANGE.filter(n => results[n].p5.adapt < results[n].p4.adapt)
  for (const n of CHANGE) assert.ok(results[n].p5.adapt <= results[n].p4.adapt, `${n}: ${results[n].p4.adapt} → ${results[n].p5.adapt}`)
  assert.ok(faster.length >= 4, `faster on ${faster.join(', ')}`)
})

scenario('the method that worked before is used again when it works again (gia, day 20)', () => {
  assert.ok(results.gia.p5.adaptBack < DAYS - LEARNERS.gia.back, 'it does come back')
  assert.ok(results.gia.p5.adaptBack <= results.gia.p4.adaptBack + 1)
})

scenario('no regression: expected later independent success never worse by more than 0.02', () => {
  for (const [name, { p4, p5 }] of Object.entries(results)) {
    assert.ok(p5.expected >= p4.expected - 0.02, `${name}: ${p4.expected.toFixed(3)} → ${p5.expected.toFixed(3)}`)
    assert.ok(p5.expectedAll >= p4.expectedAll - 0.02, `${name} (whole month): ${p4.expectedAll.toFixed(3)} → ${p5.expectedAll.toFixed(3)}`)
  }
})

scenario('change learners gain on average', () => {
  const gain = mean(CHANGE.map(n => results[n].p5.expected - results[n].p4.expected))
  assert.ok(gain > 0.02, `mean gain ${gain.toFixed(3)}`)
})

scenario('an isolated failure moves nothing (zed: a method that always works, two single failures)', () => {
  assert.equal(results.zed.p5.flipsAfterOneFailure, 0)
})

scenario('noisy learners with a forced failure: as stable as before, within noise', () => {
  // (per learner these are noisy: lea's own two methods are close in listening,
  // and the old policy already chose wrongly there 0.5 times per seed)
  const before = mean(NOISY_ONE_FAILURE.map(n => results[n].p4.flipsAfterOneFailure))
  const after = mean(NOISY_ONE_FAILURE.map(n => results[n].p5.flipsAfterOneFailure))
  assert.ok(after <= before + 0.05, `${before.toFixed(2)} → ${after.toFixed(2)}`)
})

scenario('few data: nothing is ranked from fewer than three later probes', () => {
  for (const { p5 } of Object.values(results)) assert.equal(p5.earlyInformed, 0)
})

scenario('per skill: ivy is taught differently for listening and for writing', () => {
  const runs = SEEDS.map(seed => journey(P5, 'ivy', seed).log.filter(x => x.kind === 'lesson' && x.day >= 16 && informed(x)))
  const share = skill => { const xs = runs.flat().filter(x => x.skill === skill); return xs.filter(x => x.instruction === x.best).length / Math.max(1, xs.length) }
  assert.ok(share('written') >= 0.7, `written ${share('written').toFixed(2)}`)
  assert.ok(share('listening') >= 0.6, `listening ${share('listening').toFixed(2)}`)
  assert.ok(results.ivy.p5.expected > results.ivy.p4.expected, 'and that beats one pooled choice')
})

scenario('exploration never disappears', () => {
  const xs = SEEDS.flatMap(seed => journey(P5, 'ana', seed).log.filter(x => x.kind === 'lesson' && x.day >= 10))
  const share = xs.filter(x => x.reason === 'exploration').length / xs.length
  assert.ok(share >= 0.1 && share <= 0.3, `exploration ${share.toFixed(2)}`)
})

scenario('transfer is not traded away', () => {
  for (const [name, { p4, p5 }] of Object.entries(results)) assert.ok(p5.transfer >= p4.transfer - 0.5, `${name}: ${p4.transfer} → ${p5.transfer}`)
})

console.log(`\ncheck-adaptation-policy — ${passed} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
