/*
 * check-hybrid-evaluation — proves the deterministic / remote / fallback routing
 * of evaluateEpisodeResponse without any network. The remote is injected as a
 * spy, so we can assert exactly WHEN Lingua is consulted and how junk / timeouts
 * are handled. Exits 1 on failure.
 */
import assert from 'node:assert/strict'
import { evaluateEpisodeResponse, validateRemoteEvaluation } from '../src/learning/engine/hybridEvaluation.js'
import { evaluateFree, shouldEscalate } from '../src/learning/engine/responseEvaluation.js'
import { readFileSync } from 'node:fs'
import { ARC } from '../src/learning/episodes/index.js'

// the English dictionary is module-private, so the keys are read as source
const EN_SOURCE = readFileSync(new URL('../src/i18n/translations.js', import.meta.url), 'utf8')
const hasKey = (key) => new RegExp(`\n  ${key}:`).test(EN_SOURCE)

const NAME = 'Sebastian'
const introStep = { evalKind: 'introduction', itemIds: ['hi', 'im'], type: 'free_reply', promptEn: "Hi! I'm Alex. What's your name?" }
const askStep = { evalKind: 'ask_name', itemIds: ['whats_your_name'], type: 'free_reply', promptEn: "I'm Alex." }
const niceStep = { evalKind: 'nice_to_meet', itemIds: ['nice_to_meet'], type: 'free_reply', promptEn: 'Nice to meet you!' }
const episode = { id: 'nice_to_meet', canDoId: 'full_greeting' }

function spy(returnValue) {
  const fn = async (payload, signal) => { fn.calls++; fn.lastPayload = payload; fn.lastSignal = signal; return typeof returnValue === 'function' ? returnValue(payload) : returnValue }
  fn.calls = 0
  return fn
}

const run = (over) => evaluateEpisodeResponse({
  episode, step: introStep, learnerResponse: '', learnerName: NAME,
  nativeLanguage: 'es', interfaceLanguage: 'es', targetLanguage: 'en',
  scaffoldLevel: 'medium', assistanceUsed: false, previousAttempts: 0,
  turnContext: { linguaSaid: introStep.promptEn }, ...over,
})

let n = 0
const ok = () => { n++ }

async function main() {
  // 1) clear accept → deterministic, remote NEVER called
  {
    const remote = spy(null)
    const r = await run({ learnerResponse: "Hi, I'm Sebastian.", remote })
    assert.equal(r.completedObjective, true)
    assert.equal(r.source, 'deterministic')
    assert.equal(remote.calls, 0, 'clear accept must not consult remote')
    ok()
  }

  // 2) empty → deterministic reject, remote NEVER called
  {
    const remote = spy(null)
    const r = await run({ learnerResponse: '   ', remote })
    assert.equal(r.completedObjective, false)
    assert.equal(r.errorType, 'empty')
    assert.equal(remote.calls, 0)
    ok()
  }

  // 3) clear structural reject (bare name) is conclusive → no remote
  {
    const remote = spy(null)
    const r = await run({ learnerResponse: 'Sebastian', remote })
    assert.equal(r.completedObjective, false)
    assert.equal(remote.calls, 0, 'a conclusive local reject must not consult remote')
    assert.equal(r.errorType, 'missing_copula')
    ok()
  }

  // 4) ambiguous natural attempt → escalates to remote
  {
    const remote = spy({ completed_objective: true, retry_required: false, confidence: 0.9, natural_version: "Hi, I'm Sebastian." })
    const r = await run({ learnerResponse: 'Sebastián here, hello!', remote })
    assert.equal(remote.calls, 1, 'ambiguous reply must consult remote once')
    assert.equal(r.completedObjective, true)
    assert.equal(r.source, 'remote')
    assert.ok(r.praiseKey, 'remote accept still yields praise')
    // payload carried the essentials
    assert.equal(remote.lastPayload.learner_response, 'Sebastián here, hello!')
    assert.equal(remote.lastPayload.expected_intent, 'introduction')
    ok()
  }

  // 5) remote returns junk → fallback to conservative local verdict
  {
    const remote = spy({ completed_objective: 'maybe' })
    const r = await run({ learnerResponse: 'Sebastián here, hello!', remote })
    assert.equal(remote.calls, 1)
    assert.equal(r.source, 'fallback')
    assert.equal(r.completedObjective, false)
    assert.equal(r.retryRequired, true)
    ok()
  }

  // 6) remote contradiction (completed && retry) rejected → fallback
  {
    const remote = spy({ completed_objective: true, retry_required: true })
    const r = await run({ learnerResponse: 'Sebastián here, hello!', remote })
    assert.equal(r.source, 'fallback')
    ok()
  }

  // 7) remote throws (timeout) → fallback, never throws out
  {
    const remote = async () => { throw new Error('timeout') }
    const r = await run({ learnerResponse: 'Sebastián here, hello!', remote })
    assert.equal(r.source, 'fallback')
    assert.equal(r.completedObjective, false)
    ok()
  }

  // 8) remote returns null (offline) → fallback
  {
    const r = await run({ learnerResponse: 'Sebastián here, hello!', remote: spy(null) })
    assert.equal(r.source, 'fallback')
    ok()
  }

  // 9) no remote provided → fallback for ambiguous, deterministic for clear
  {
    const amb = await run({ learnerResponse: 'Sebastián here, hello!', remote: undefined })
    assert.equal(amb.source, 'fallback')
    const clear = await run({ learnerResponse: "I'm Sebastian.", remote: undefined })
    assert.equal(clear.source, 'deterministic')
    assert.equal(clear.completedObjective, true)
    ok()
  }

  // 10) turn context: "You too" only closes as a REPLY to "nice to meet you"
  {
    const asReply = await evaluateEpisodeResponse({
      episode, step: niceStep, learnerResponse: 'You too.', learnerName: NAME,
      scaffoldLevel: 'medium', turnContext: { linguaSaid: 'Nice to meet you!' }, remote: spy(null),
    })
    assert.equal(asReply.completedObjective, true, '"You too" is valid as a reply')
    const asOpener = await evaluateEpisodeResponse({
      episode, step: niceStep, learnerResponse: 'You too.', learnerName: NAME,
      scaffoldLevel: 'medium', turnContext: { linguaSaid: 'Hi there!' }, remote: spy(null),
    })
    assert.equal(asOpener.completedObjective, false, '"You too" is not a valid opener')
    ok()
  }

  // 11) unicode / Japanese / Arabic names accepted deterministically
  {
    for (const [name, text] of [
      ['Sebastián', "Hi, I'm Sebastián."],
      ['さくら', "I'm さくら."],
      ['محمد', "My name is محمد."],
      ['Zoë', "Hello, I'm Zoë."],
    ]) {
      const r = await evaluateEpisodeResponse({ episode, step: introStep, learnerResponse: text, learnerName: name, scaffoldLevel: 'medium', remote: spy(null) })
      assert.equal(r.completedObjective, true, `accept unicode name: ${name}`)
      assert.equal(r.source, 'deterministic')
    }
    ok()
  }

  // 12) apostrophes / emoji / punctuation tolerated (no escalation needed)
  {
    for (const text of ["Hi, I’m Sebastian!!!", "hi i'm sebastian", "Hi, I'm Sebastian 😊", "  Hi,   I'm  Sebastian  "]) {
      const remote = spy(null)
      const r = await run({ learnerResponse: text, remote })
      assert.equal(r.completedObjective, true, `accept: ${text}`)
      assert.equal(remote.calls, 0)
    }
    ok()
  }

  // 13) ask-name polite variant escalates only when non-conclusive; clear forms local
  {
    const clear = await evaluateEpisodeResponse({ episode, step: askStep, learnerResponse: "What's your name?", learnerName: NAME, scaffoldLevel: 'medium', remote: spy(null) })
    assert.equal(clear.completedObjective, true)
    assert.equal(clear.source, 'deterministic')
    ok()
  }

  /*
   * 14) mastery evidence follows what the learner DID, not how much help was on
   * screen. This used to read `scaffoldLevel !== 'high'`, so someone typing an
   * unaided sentence while a suggestion sat beside it was recorded as having
   * copied it — and, worse, could never generate independent evidence at all on
   * the turns where support was highest.
   */
  {
    const helpedLevel = await run({ learnerResponse: "I'm Sebastian.", scaffoldLevel: 'high', assistanceUsed: false, remote: spy(null) })
    assert.equal(helpedLevel.masteryEvidence.independent, true,
      'a suggestion merely being on screen is not the learner using it')
    const solo = await run({ learnerResponse: "I'm Sebastian.", scaffoldLevel: 'low', assistanceUsed: false, remote: spy(null) })
    assert.equal(solo.masteryEvidence.independent, true, 'no help used ⇒ independent')
    const suggested = await run({ learnerResponse: "I'm Sebastian.", scaffoldLevel: 'low', assistanceUsed: true, remote: spy(null) })
    assert.equal(suggested.masteryEvidence.independent, false, 'used a suggestion ⇒ not independent')
    // a closed activity cannot prove production whatever the level
    const closed = await evaluateEpisodeResponse({
      episode, step: { ...introStep, type: 'choice' }, learnerResponse: "I'm Sebastian.",
      learnerName: NAME, scaffoldLevel: 'low', assistanceUsed: false, remote: spy(null),
    })
    assert.equal(closed.masteryEvidence.independent, false, 'recognising is not producing')
    // and an explicit caller decision wins over any inference
    const told = await run({ learnerResponse: "I'm Sebastian.", scaffoldLevel: 'low', assistanceUsed: false, independent: false, remote: spy(null) })
    assert.equal(told.masteryEvidence.independent, false, 'the caller may say it was assisted')
    ok()
  }

  // 15) validateRemoteEvaluation unit checks (snake & camel, bounds)
  {
    assert.equal(validateRemoteEvaluation(null), null)
    assert.equal(validateRemoteEvaluation({}), null)
    assert.equal(validateRemoteEvaluation({ completed_objective: true, retry_required: true }), null)
    assert.equal(validateRemoteEvaluation({ completed_objective: false, retry_required: false }), null)
    assert.equal(validateRemoteEvaluation({ completedObjective: true, natural_version: 'x'.repeat(200) }), null)
    const good = validateRemoteEvaluation({ completed_objective: true, confidence: 0.8 })
    assert.ok(good && good.completedObjective === true)
    const badConf = validateRemoteEvaluation({ completed_objective: false, retry_required: true, confidence: 5 })
    assert.equal(badConf.confidence, undefined, 'out-of-range confidence dropped')
    ok()
  }

  // 16) shouldEscalate contract matches routing decisions
  {
    assert.equal(shouldEscalate(evaluateFree('introduction', "Hi, I'm Sebastian.", { name: NAME })), false)
    assert.equal(shouldEscalate(evaluateFree('introduction', '', { name: NAME })), false)
    assert.equal(shouldEscalate(evaluateFree('introduction', 'Sebastian', { name: NAME })), false)
    assert.equal(shouldEscalate(evaluateFree('introduction', 'Sebastián here, hello!', { name: NAME })), true)
    ok()
  }

  /*
   * Praise must be about the sentence the learner just wrote. The praise table
   * stopped at the second arc, so any remote-settled answer in a later arc was
   * congratulated with "You used I'm before your name." — specific, warm, and
   * about a completely different objective.
   */
  {
    const intents = new Set()
    for (const ep of ARC) for (const step of ep.steps) if (step.evalKind) intents.add(step.evalKind)

    for (const kind of intents) {
      const step = { evalKind: kind, itemIds: [], type: 'free_reply' }
      const remote = async () => ({ completed_objective: true, retry_required: false, confidence: 0.8 })
      const r = await evaluateEpisodeResponse({
        step, learnerResponse: 'something only Lingua can judge here', learnerName: NAME,
        scaffoldLevel: 'low', remote,
      })
      if (r.source !== 'remote') continue          // settled locally; no praise from here
      assert.ok(r.praiseKey, `${kind}: a remote success must still praise something`)
      assert.ok(hasKey(r.praiseKey), `${kind}: praise key ${r.praiseKey} must exist`)
      if (kind === 'introduction') continue      // episode 1's praise is its own
      assert.notEqual(r.praiseKey, 'ep1PraiseIm',
        `${kind} was praised for using "I'm" before a name`)
      assert.notEqual(r.praiseKey, 'ep1PraiseIndependent',
        `${kind} borrowed episode 1's praise`)
    }
    ok()
  }

  console.log(`check-hybrid-evaluation — OK  (${n} routing groups verified)`)
}

main().catch((e) => { console.error('check-hybrid-evaluation — FAIL\n', e.message); process.exit(1) })
