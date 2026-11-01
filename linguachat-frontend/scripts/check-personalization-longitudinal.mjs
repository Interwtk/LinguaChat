#!/usr/bin/env node
/*
 * check-personalization-longitudinal — P4, block D.
 *
 * Four synthetic learners, 28 days, two capabilities each, every day a lesson
 * and — the next day, before anything else — an independent first attempt that
 * tests it. The decisions are made by the REAL engine (teachingPolicy's
 * chooseTeaching for explanation style and channel, skillEvidence,
 * retentionProfile, scaffolding), exactly the calls SessionRunner makes,
 * including its seeded fallback when evidence is too thin.
 *
 * Each learner has a hidden, per-capability and per-skill chance of later
 * independent success for each method. The engine never sees it; it sees only
 * outcomes. Learners:
 *   ana   worked examples help her far more, on both capabilities
 *   ben   concise explanations suit him; listening is harder than reading
 *   chen  differs BY CAPABILITY: worked examples for one, concise for the other
 *   dana  CHANGES: worked examples help early; from day 14 concise does
 *
 * Proves (internal consistency, across 8 seeds):
 *   - decisions differ between learners and between one learner's capabilities;
 *   - decisions change when new evidence contradicts old evidence (dana);
 *   - nothing is inferred from speed: response times change no decision;
 *   - one isolated error changes neither the method nor the support level;
 *   - written and listening evidence stay apart;
 *   - the success metric is LATER INDEPENDENT success, and the engine's choices
 *     beat a fixed alternation on it.
 * Does NOT prove that real people learn better: the learners are simulated,
 * their hidden rates are invented for the test. That needs the pilot
 * (docs/research/pre-a1-pilot-protocol.md).
 *
 * Run: node scripts/check-personalization-longitudinal.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { observeTeaching, chooseTeaching, skillEvidence, retentionProfile } from '../src/learning/engine/teachingPolicy.js'
import { createLearnerModel } from '../src/learning/engine/learnerModel.js'
import { makeScaffoldState, updateScaffoldAfterTurn } from '../src/learning/engine/scaffolding.js'
import { seedFrom } from '../src/learning/engine/variation.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DAY = 86400000
const HOUR = 3600000
const START = Date.UTC(2026, 9, 5)
const DAYS = 28
const SEEDS = [1, 2, 3, 5, 8, 13, 21, 34]
const CAPS = ['introduce_self', 'cafe_order']
const INSTRUCTIONS = ['concise', 'worked_example']
const CHANNELS = ['reading', 'listening']

let passed = 0
const failures = []
function scenario(name, run) {
  try { run(); passed++; console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}
function prng(seed) { let x = seed >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 2 ** 32) }

/* Hidden chance of a later independent success. Invented for the simulation. */
const LEARNERS = {
  ana: { rate: () => ({ worked_example: 0.85, concise: 0.3 }), listening: 1 },
  ben: { rate: () => ({ worked_example: 0.35, concise: 0.85 }), listening: 0.55 },
  chen: { rate: (cap) => cap === 'introduce_self' ? { worked_example: 0.85, concise: 0.3 } : { worked_example: 0.3, concise: 0.85 }, listening: 1 },
  dana: { rate: (cap, day) => day < 14 ? { worked_example: 0.85, concise: 0.3 } : { worked_example: 0.3, concise: 0.85 }, listening: 1 },
}
const BEST = { ana: () => 'worked_example', ben: () => 'concise',
  chen: cap => cap === 'introduce_self' ? 'worked_example' : 'concise', dana: (cap, day) => day < 14 ? 'worked_example' : 'concise' }

/*
 * One learner's month. `policy` = 'engine' (what SessionRunner does) or a fixed
 * strategy for comparison.
 */
function journey(name, seed, { policy = 'engine' } = {}) {
  const learner = LEARNERS[name]
  const rand = prng(seed * 977 + name.length)
  const model = createLearnerModel()
  const log = []
  const pending = {}
  for (let day = 0; day < DAYS; day++) {
    for (const cap of CAPS) {
      // 1) the probe of yesterday's lesson: independent, first attempt, new session
      const prev = pending[cap]
      if (prev) {
        const p = learner.rate(cap, day)[prev.instruction] * (prev.channel === 'listening' ? learner.listening : 1)
        const success = rand() < p
        observeTeaching(model, { id: `${cap}:probe:${day}`, capability: cap, format: 'free_reply', session: `p${day}`,
          at: START + day * DAY + 8 * HOUR, success, independent: true, assisted: false, retried: false,
          channel: prev.channel, context: day % 3 ? 'home' : `ctx${day}`,
          listening: prev.channel === 'listening' ? { firstListenSuccess: success } : null })
        log.push({ day, cap, kind: 'probe', p, success })
      }
      // 2) today's lesson — decided exactly as SessionRunner decides
      const decisionSeed = `${name}:${seed}:${day}:${cap}`
      let instruction, reason = 'fixed'
      if (policy === 'engine') {
        const d = chooseTeaching(model, cap, INSTRUCTIONS, decisionSeed, 'instruction')
        instruction = d?.format || (seedFrom(decisionSeed + ':instruction') % 2 ? 'concise' : 'worked_example')
        reason = d?.reason || 'too_little_evidence'
      } else if (policy === 'alternate') instruction = INSTRUCTIONS[day % 2]
      else instruction = policy
      const c = policy === 'engine' ? chooseTeaching(model, cap, CHANNELS, decisionSeed, 'channel') : null
      const channel = c?.format || (seedFrom(decisionSeed + ':channel') % 2 ? 'reading' : 'listening')
      observeTeaching(model, { id: `${cap}:lesson:${day}`, capability: cap, format: 'free_reply', session: `d${day}`,
        at: START + day * DAY + 9 * HOUR, success: null, instruction, channel, context: 'home' })
      pending[cap] = { instruction, channel }
      log.push({ day, cap, kind: 'lesson', instruction, channel, reason,
        expected: learner.rate(cap, day + 1)[instruction] })
    }
  }
  return { model, log }
}
const lessons = (log, from = 0, to = DAYS) => log.filter(x => x.kind === 'lesson' && x.day >= from && x.day < to)
const informed = l => l.reason === 'later-independent-retrieval'
const mean = xs => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length)

console.log('check-personalization-longitudinal')

scenario('decisions differ between learners — and between one learner’s capabilities', () => {
  const share = (name, cap, pick) => {
    const xs = SEEDS.flatMap(s => lessons(journey(name, s).log, 14).filter(l => l.cap === cap && informed(l)))
    return xs.filter(l => l.instruction === pick).length / Math.max(1, xs.length)
  }
  for (const cap of CAPS) {
    assert.ok(share('ana', cap, 'worked_example') >= 0.75, `ana/${cap}: ${share('ana', cap, 'worked_example')}`)
    assert.ok(share('ben', cap, 'concise') >= 0.75, `ben/${cap}: ${share('ben', cap, 'concise')}`)
  }
  assert.ok(share('chen', 'introduce_self', 'worked_example') >= 0.75, 'chen: worked examples for introducing himself')
  assert.ok(share('chen', 'cafe_order', 'concise') >= 0.75, 'chen: concise for ordering')
})

scenario('decisions change when new evidence contradicts the old (dana, from day 14)', () => {
  const share = (from, to) => {
    const xs = SEEDS.flatMap(s => lessons(journey('dana', s).log, from, to).filter(informed))
    return xs.filter(l => l.instruction === 'concise').length / Math.max(1, xs.length)
  }
  const before = share(7, 14), after = share(22, DAYS)
  assert.ok(before <= 0.3, `before the change concise was rare: ${before.toFixed(2)}`)
  assert.ok(after >= 0.7, `after the change concise dominates: ${after.toFixed(2)}`)
})

scenario('too little evidence is said, not guessed: the first days are never “informed”', () => {
  for (const s of SEEDS) {
    const first = lessons(journey('ana', s).log, 0, 3)
    assert.ok(first.every(l => !informed(l)), 'no ranking from fewer than three later probes')
  }
})

scenario('nothing is inferred from speed: response times change no decision', () => {
  // the same outcomes replayed with and without response times (fast, slow, absurd)
  for (const name of Object.keys(LEARNERS)) for (const s of SEEDS.slice(0, 4)) {
    const { model } = journey(name, s)
    for (const times of [() => 300, x => (x.at % 977) * 50, () => 3600000]) {
      const withTimes = createLearnerModel()
      withTimes.teachingHistory = model.teachingHistory.map(x => ({ ...x, responseMs: times(x) }))
      for (const cap of CAPS) for (const [cands, dim] of [[INSTRUCTIONS, 'instruction'], [CHANNELS, 'channel']]) for (let k = 0; k < 10; k++) {
        const seed = `replay:${cap}:${k}`
        assert.deepEqual(chooseTeaching(withTimes, cap, cands, seed, dim)?.format, chooseTeaching(model, cap, cands, seed, dim)?.format)
      }
      assert.deepEqual(skillEvidence(withTimes, CAPS[0]), skillEvidence(model, CAPS[0]))
    }
  }
  // and no decision module reads any timing field at all
  const engine = join(ROOT, 'src/learning/engine')
  for (const f of readdirSync(engine).filter(f => f.endsWith('.js'))) {
    assert.ok(!/responseMs|durationMs|typingMs|timeTaken|\bspeed\b/.test(readFileSync(join(engine, f), 'utf8')), `${f} reads a timing field`)
  }
})

scenario('one isolated error changes neither the method nor the support level', () => {
  const { model } = journey('ana', 5)
  const after = createLearnerModel()
  after.teachingHistory = [...model.teachingHistory, { id: 'slip', capability: 'introduce_self', format: 'free_reply',
    session: 'slip', at: START + DAYS * DAY + 8 * HOUR, success: false, independent: true, assisted: false, retried: false,
    channel: 'reading', context: 'home' }]
  let same = 0
  for (let k = 0; k < 40; k++) {
    const seed = `slip:${k}`
    if (chooseTeaching(after, 'introduce_self', INSTRUCTIONS, seed, 'instruction')?.format
      === chooseTeaching(model, 'introduce_self', INSTRUCTIONS, seed, 'instruction')?.format) same++
  }
  assert.equal(same, 40, 'one slip after a month of evidence does not flip the method')
  const low = makeScaffoldState('low')
  const oneSlip = updateScaffoldAfterTurn(low, { correct: false })
  assert.equal(oneSlip.currentLevel, 'low', 'one slip leaves support alone')
  assert.notEqual(updateScaffoldAfterTurn(oneSlip, { correct: false }).currentLevel, 'low', 'a second brings help back')
})

scenario('written and listening evidence stay apart (ben hears less well than he reads)', () => {
  const written = [], listening = []
  for (const s of SEEDS) {
    const ev = skillEvidence(journey('ben', s).model, 'cafe_order', START + DAYS * DAY)
    if (ev.written.samples) written.push(ev.written.mean)
    if (ev.listening.samples) listening.push(ev.listening.mean)
    assert.equal(ev.speaking.status, 'not_assessed')
  }
  assert.ok(written.length && listening.length, 'both skills observed')
  assert.ok(mean(written) > mean(listening), `written ${mean(written).toFixed(2)} > listening ${mean(listening).toFixed(2)}`)
})

scenario('review priority follows later failures, and recovers with later success', () => {
  const m = createLearnerModel()
  const obs = (id, day, success, extra = {}) => observeTeaching(m, { id, capability: 'ask_name', format: 'free_reply',
    session: `s${day}`, at: START + day * DAY, success, independent: true, assisted: false, retried: false, channel: 'reading', context: 'home', ...extra })
  obs('l0', 0, null, { instruction: 'concise' })
  obs('p1', 1, false)
  assert.equal(retentionProfile(m, 'ask_name', START + 2 * DAY).priority, 2, 'a later failure is reviewed first')
  obs('p2', 2, true); obs('p3', 3, true); obs('p4', 4, true)
  assert.equal(retentionProfile(m, 'ask_name', START + 5 * DAY).priority, -1, 'three later successes: reviewed less often')
})

scenario('success is LATER INDEPENDENT success — and the engine’s choices beat alternation on it', () => {
  const by = (name, policy, from, to) => mean(SEEDS.flatMap(s => lessons(journey(name, s, { policy }).log, from, to).map(l => l.expected)))
  const best = (name, from, to) => mean(CAPS.flatMap(cap => Array.from({ length: to - from }, (_, i) =>
    LEARNERS[name].rate(cap, from + i + 1)[BEST[name](cap, from + i + 1)])))
  console.log('       expected later independent success of the methods chosen (simulated learners):')
  const rows = []
  for (const [name, from, to] of [['ana', 14, DAYS], ['ben', 14, DAYS], ['chen', 14, DAYS], ['dana', 7, 14], ['dana', 14, 22], ['dana', 22, DAYS]]) {
    const r = { name, from, to, engine: by(name, 'engine', from, to), alternate: by(name, 'alternate', from, to), best: best(name, from, to) }
    rows.push(r)
    console.log(`       ${name.padEnd(5)} days ${String(from).padStart(2)}–${to - 1}: engine ${r.engine.toFixed(2)}  alternation ${r.alternate.toFixed(2)}  best possible ${r.best.toFixed(2)}`)
  }
  for (const r of rows) {
    assert.ok(r.engine <= r.best + 1e-9)
    // Measured limit, reported rather than hidden: right after dana changes
    // (days 14–21) the engine still leans on the old evidence — its window is
    // the last 12 later probes — and does no better than alternating.
    if (r.name === 'dana' && r.from === 14) { assert.ok(r.engine < r.best, 'the adaptation lag exists and is visible'); continue }
    assert.ok(r.engine > r.alternate + 0.1, `${r.name} ${r.from}–${r.to - 1}: engine ${r.engine.toFixed(2)} vs alternation ${r.alternate.toFixed(2)}`)
  }
})

scenario('completion and help are not the metric: assisted or retried attempts never count as probes', () => {
  const m = createLearnerModel()
  observeTeaching(m, { id: 'l', capability: 'x', format: 'free_reply', session: 'a', at: START, success: null, instruction: 'concise', channel: 'reading', context: 'home' })
  for (let d = 1; d <= 6; d++) {
    observeTeaching(m, { id: `h${d}`, capability: 'x', format: 'free_reply', session: `s${d}`, at: START + d * DAY, success: true,
      independent: d % 2 === 0, assisted: d % 2 === 1, retried: d % 2 === 0, channel: 'reading', context: 'home' })
  }
  assert.equal(skillEvidence(m, 'x', START + 7 * DAY).written.samples, 0, 'six “successes” with help or retries: zero evidence')
})

console.log(`\ncheck-personalization-longitudinal — ${passed} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
