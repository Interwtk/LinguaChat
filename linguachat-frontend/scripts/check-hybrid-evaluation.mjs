/*
 * check-hybrid-evaluation — proves the deterministic / remote / fallback routing
 * of evaluateEpisodeResponse without any network. The remote is injected as a
 * spy, so we can assert exactly WHEN Lingua is consulted and how junk / timeouts
 * are handled. Exits 1 on failure.
 */
import assert from 'node:assert/strict'
import { evaluateEpisodeResponse, validateRemoteEvaluation } from '../src/learning/engine/hybridEvaluation.js'
import { evaluateFree, shouldEscalate } from '../src/learning/engine/responseEvaluation.js'

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

  // 14) mastery evidence: independence depends on scaffold + assistance
  {
    const helped = await run({ learnerResponse: "I'm Sebastian.", scaffoldLevel: 'high', remote: spy(null) })
    assert.equal(helped.masteryEvidence.independent, false, 'high scaffold ⇒ not independent')
    const solo = await run({ learnerResponse: "I'm Sebastian.", scaffoldLevel: 'low', assistanceUsed: false, remote: spy(null) })
    assert.equal(solo.masteryEvidence.independent, true, 'low scaffold, no help ⇒ independent')
    const suggested = await run({ learnerResponse: "I'm Sebastian.", scaffoldLevel: 'low', assistanceUsed: true, remote: spy(null) })
    assert.equal(suggested.masteryEvidence.independent, false, 'used a suggestion ⇒ not independent')
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

  console.log(`check-hybrid-evaluation — OK  (${n} routing groups verified)`)
}

main().catch((e) => { console.error('check-hybrid-evaluation — FAIL\n', e.message); process.exit(1) })
