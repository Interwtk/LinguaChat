/*
 * check-edge-cases — deterministic coverage of the sprint's mandatory edge cases
 * that can be exercised without a browser (recovery, migration, evaluation
 * robustness, idempotency). Purely-visual cases (reduced-motion, small-mobile,
 * RTL layout) are asserted structurally in check-a11y-structure.mjs / by grep.
 */
import assert from 'node:assert/strict'
import { getEpisode, ARC } from '../src/learning/episodes/index.js'
import { evaluateFree, evaluateIntroduction, normalize, fold } from '../src/learning/engine/responseEvaluation.js'
import {
  createLearnerModel, migrateLearnerModel, recordItemAttempt, getDueReviews,
  getEpisodeState,
} from '../src/learning/engine/learnerModel.js'

let n = 0
const ok = (label) => { n++; /* passed */ void label }

// 1) no learner model → fresh, well-formed
{
  const m = createLearnerModel()
  assert.deepEqual(m.canDo, {})
  assert.deepEqual(m.episodes, {})
  assert.equal(m.version, 2)
  ok('fresh model')
}

// 2) old-version model (v1) → migrated, progress preserved
{
  const v1 = { version: 1, canDo: { introduce_self: { status: 'can_do', successfulAttempts: 3, lastPracticedAt: 't' } }, languageItems: { hi: { status: 'known', correct: 2 } } }
  const m = migrateLearnerModel(v1)
  assert.equal(m.version, 2)
  assert.equal(m.canDo.introduce_self.status, 'can_do')
  assert.ok(m.canDo.introduce_self.independentSuccesses >= 1, 'known can_do keeps independent evidence')
  assert.equal(m.languageItems.hi.status, 'can_do', 'known item → can_do')
  ok('v1 migration')
}

// 3) corrupt / garbage model → safe fresh (never throws)
{
  for (const bad of [null, undefined, 'not-json', 42, [], { foo: 1 }]) {
    const m = migrateLearnerModel(bad)
    assert.equal(m.version, 2)
    assert.equal(typeof m.canDo, 'object')
  }
  ok('corrupt → fresh')
}

// 4) nonexistent episode → null (EpisodeShell renders nothing)
{
  assert.equal(getEpisode('does_not_exist'), null)
  assert.equal(getEpisode(undefined), null)
  ok('missing episode')
}

// 5) out-of-range persisted step → clamped into range (mirrors EpisodeShell.initial)
{
  const ep = ARC[0]
  const last = ep.steps.length - 1
  // mirrors EpisodeShell.initial: Math.min(status==='completed' ? 0 : (stepIndex||0), last)
  const clamp = (status, saved) => Math.min(status === 'completed' ? 0 : (saved || 0), last)
  assert.equal(clamp('in_progress', 999), last, 'out-of-range resumes at last real step')
  assert.equal(clamp('in_progress', 0), 0, 'zero stays zero')
  assert.equal(clamp('completed', 5), 0, 'a completed episode replays from the start')
  assert.ok(clamp('in_progress', 3) <= last)
  ok('step clamp')
}

// 6) empty reply on every evalKind → understood:false, retry, no crash
{
  for (const kind of ['introduction', 'ask_name', 'nice_to_meet']) {
    const r = evaluateFree(kind, '', { name: 'Sam', independent: true })
    assert.equal(r.completedObjective, false)
    assert.equal(r.errorType, 'empty')
    assert.equal(r.retryRequired, true)
    assert.ok(r.retryPrompt, 'empty reply must offer a retry prompt key')
  }
  // whitespace / emoji-only also empty after normalize
  assert.equal(evaluateFree('introduction', '   😀🎉  ', { name: 'Sam' }).errorType, 'empty')
  ok('empty replies')
}

// 7) unforeseen-but-valid variants accepted (hardening of the reported bug)
{
  const name = 'Sebastian'
  const accept = [
    "Hi, I'm Sebastian.", 'Hello, I’m Sebastian.', "I'm Sebastian.", 'My name is Sebastian.',
    'Hey, I am Sebastian!', "hi i'm sebastian", "  Hi,   I'm  Sebastian  ", "Hi, I'm Sebastian 😀",
  ]
  for (const t of accept) {
    const r = evaluateIntroduction(t, { name, independent: true })
    assert.ok(r.completedObjective, `should ACCEPT: "${t}" → ${r.errorType}`)
  }
  ok('valid variants accepted')
}

// 8) pedagogical rejects carry a specific errorType (never a dry crash)
{
  const cases = [
    ['Sebastian', 'missing_copula'],
    ['Hi', 'greeting_only'],
    ['I Sebastian', 'missing_copula'],
    ["I'm", 'missing_name'],
  ]
  for (const [t, expected] of cases) {
    const r = evaluateIntroduction(t, { name: 'Sebastian', independent: true })
    assert.equal(r.completedObjective, false, `should reject: "${t}"`)
    assert.equal(r.errorType, expected, `"${t}" → expected ${expected}, got ${r.errorType}`)
    assert.ok(r.retryPrompt && r.explanation, 'reject must guide, not just fail')
  }
  ok('pedagogical rejects')
}

// 9) unicode / accented names (input accent vs stored name, either direction)
{
  assert.ok(evaluateIntroduction("Hi, I'm Sebastián.", { name: 'Sebastian' }).completedObjective, 'accented input, plain name')
  assert.ok(evaluateIntroduction("Hi, I'm Sebastian.", { name: 'Sebastián' }).completedObjective, 'plain input, accented name')
  assert.ok(evaluateIntroduction("Hi, I'm Zoë.", { name: 'Zoë' }).completedObjective, 'diacritic both sides')
  assert.equal(fold('Sébastián'), 'sebastian')
  assert.equal(normalize('Hi,  I’m  Sam!'), "hi i'm sam")
  ok('unicode names')
}

// 10) empty name → engine still gives a usable model answer (fallback), never crashes
{
  const r = evaluateIntroduction('random words here', { name: '   ', independent: false })
  assert.ok(r.naturalVersion.includes('Alex'), 'blank name falls back to Alex in the model answer')
  ok('empty name fallback')
}

// 11) backend down / OpenAI disabled → Level-3 local eval still decides (no network)
{
  // evaluateFree is pure & synchronous; a valid answer completes with zero I/O
  const r = evaluateFree('ask_name', "What's your name?", { independent: true })
  assert.ok(r.completedObjective, 'offline deterministic evaluation still accepts')
  ok('offline fallback')
}

// 12) feedback is emitted as i18n KEYS + English literal target — safe under a
//     mid-episode interface-language change (nothing is baked to one locale)
{
  const r = evaluateIntroduction('Sebastian', { name: 'Sebastian' })
  assert.match(r.explanation, /^ep[0-9]/, 'explanation is a translation key, not prose')
  assert.match(r.retryPrompt, /^ep[0-9]/, 'retryPrompt is a translation key')
  assert.match(r.naturalVersion, /^Hi, I'm /, 'model answer is the English literal target')
  ok('locale-independent feedback')
}

// 13) already-registered reviews: getDueReviews is a pure read (idempotent)
{
  const m = createLearnerModel()
  recordItemAttempt(m, 'hi', { correct: true, independent: true })
  const a = getDueReviews(m, Date.now() + 10 * 86400000)
  const b = getDueReviews(m, Date.now() + 10 * 86400000)
  assert.deepEqual(a, b, 'due reviews stable across reads')
  ok('idempotent reviews')
}

// 14) already-completed episode state is readable and does not corrupt on re-read
{
  const m = createLearnerModel()
  m.episodes.first_greeting = { status: 'completed', stepIndex: 8, awarded: true }
  const st = getEpisodeState(m, 'first_greeting')
  assert.equal(st.status, 'completed')
  assert.equal(st.awarded, true)
  ok('completed episode read')
}

console.log(`check-edge-cases — OK  (${n} edge-case groups verified)`)
