#!/usr/bin/env node
/*
 * e2e-tutor-runtime — Lingua's evaluator in a real conversation, end to end (P5).
 *
 * Needs a running backend with the free local engine:
 *   cd linguachat-backend && LINGUACHAT_PROVIDER=local python -m uvicorn main:app --port 8011
 *   node scripts/e2e-tutor-runtime.mjs [http://127.0.0.1:8011]
 *
 * The learner sends real messages to POST /chat over HTTP, with the request
 * body AppContext sends (including `assistance` and the device's learning
 * memory). The device side is the real frontend code: chatAnalysis.safeAnalysis
 * reduces the reply (with the evaluator's proposal), chatEvidence classifies
 * and records the turn in a real learner model, teachingPolicy decides across
 * days. Days are simulated by the turn times; nothing on the server is mocked.
 *
 * The brief's ten steps, in order:
 *   1 a wrong sentence → 2 a validated finding → 3 the correction in the learner's
 *   language → 4 the learner uses help → 5 recorded as assisted → 6 the same
 *   difficulty on a later day → 7 Lingua changes strategy → 8 an independent
 *   later attempt → 9 retrieval told apart from transfer → 10 what the screens
 *   may show: chat observations only, never curriculum, level or milestone.
 *
 * Not in check:all (it needs a server). The P5 report records its run.
 */
import assert from 'node:assert/strict'
import { safeAnalysis } from '../src/services/chatAnalysis.js'
import { classifyChatTurn, recordChatTurn, chatDifficulties, learningMemoryPayload } from '../src/learning/engine/chatEvidence.js'
import { createLearnerModel } from '../src/learning/engine/learnerModel.js'
import { derivePreA1Readiness } from '../src/learning/curriculum/readiness.js'
import { deriveLearnerLevel } from '../src/learning/curriculum/learnerLevel.js'
import { isLevelAvailable } from '../src/learning/curriculum/levels.js'

const API = process.argv[2] || 'http://127.0.0.1:8011'
const DAY = 86400000
const T0 = Date.UTC(2026, 10, 2, 9)
// the server keeps a short memory per session id: every run uses fresh ones
const RUN = Date.now().toString(36)
let passed = 0
const failures = []
async function scenario(name, run) {
  try { await run(); passed++; console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}

function learner(lang, id) {
  const model = createLearnerModel()
  let last = null, n = 0
  const log = []
  return {
    model, log,
    async say(message, { day = 0, minute = 0, assisted = false } = {}) {
      const at = T0 + day * DAY + minute * 60000
      const res = await fetch(`${API}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: `e2e-runtime-session-${RUN}-${id}-d${day}`, message, level: 'A1', native_language: lang,
          learning_memory: learningMemoryPayload(model, at), ...(assisted ? { assistance: 'suggestion_sent' } : {}) }),
      })
      assert.equal(res.status, 200)
      assert.ok(['local', 'guided'].includes(res.headers.get('x-linguachat-provider')), 'never a paid provider')
      const data = await res.json()
      const analysis = safeAnalysis(data.analysis, data.evaluation)
      const c = classifyChatTurn({ turnId: `${id}-t${++n}`, at, message, analysis, assisted, model,
        previous: last ? { correction: last.correction, retrieval: last.retrieval } : null })
      recordChatTurn(model, c)
      last = { correction: data.correction, retrieval: analysis?.retrieval || null }
      log.push({ message, kind: c.kind, evidence: data.evaluation?.evidence?.kind, strategy: data.analysis?.strategy })
      return { data, kind: c.kind, at }
    },
    difficulty: (rule, at) => chatDifficulties(model, at).find(d => d.rule === rule),
  }
}

await scenario('the ten steps: error → help → assisted → later error → strategy change → retrieval → transfer', async () => {
  const l = learner('es', 'ten')
  const curriculumBefore = JSON.stringify({ canDo: l.model.canDo, items: l.model.languageItems, ms: l.model.levelMilestones || null })

  // 1–3: a wrong sentence; a validated local finding; the correction in Spanish
  const t1 = await l.say('Yesterday I goed to the park with my friends.', { day: 0 })
  assert.equal(t1.data.evaluation.version, 'chat-evaluation/1')
  assert.equal(t1.data.evaluation.used, 'local_rules')
  assert.equal(t1.data.evaluation.evidence.kind, 'error')
  assert.equal(t1.data.correction, 'Yesterday I went to the park with my friends.')
  assert.match(t1.data.explanation, /pasado|irregular/)
  assert.equal(t1.kind, 'error')

  // 4–5: the learner sends Lingua's correction, from the suggestion (help)
  const t2 = await l.say(t1.data.correction, { day: 0, minute: 1, assisted: true })
  assert.ok(['assisted', 'copied'].includes(t2.data.evaluation.evidence.kind), t2.data.evaluation.evidence.kind)
  assert.ok(['assisted', 'copied'].includes(t2.kind), t2.kind)

  // 6: the same difficulty on a later day, with another verb
  const t3 = await l.say('On Saturday I buyed a new jacket.', { day: 2 })
  assert.equal(t3.kind, 'error')
  // 7: and again on another day: the device's record now changes the method
  const t4 = await l.say('Last week I eated too much cake.', { day: 4 })
  assert.equal(t4.kind, 'error')
  // the first explanation was brief; the error came back on two days, so Lingua
  // now explains differently (a contrast) — decided from the device's record,
  // because each day is a new server session
  assert.equal(t1.data.analysis.strategy, 'brief_explanation')
  assert.equal(t3.data.analysis.strategy, 'brief_explanation', 'one earlier error is not yet a pattern')
  assert.equal(t4.data.analysis.strategy, 'contrast_example')
  assert.notEqual(t4.data.explanation, t3.data.explanation.replace('buyed', 'eated'))
  const d = l.difficulty('past_irregular', T0 + 5 * DAY)
  assert.ok(d, 'the difficulty is remembered across days')
  assert.ok(['recurring', 'observed', 'holding'].includes(d.status), d.status)
  const memory = learningMemoryPayload(l.model, T0 + 6 * DAY).find(m => m.rule === 'past_irregular')
  assert.ok(memory, 'travels to Lingua as rule ids only')
  assert.ok(!/park|jacket|cake|friends/.test(JSON.stringify(learningMemoryPayload(l.model, T0 + 6 * DAY))), 'never the sentences')

  // 8: a later day: Lingua offers a delayed retrieval, and the learner answers alone
  const offer = await l.say('Hello, I am back.', { day: 7 })
  const retrieval = offer.data.analysis?.retrieval
  assert.ok(retrieval, 'a due difficulty brings a retrieval prompt instead of the generic one')
  assert.equal(offer.data.learning_action.type, 'fill_blank')
  const answer = await l.say(`Yesterday my friend ${retrieval.expected} a long letter.`, { day: 7, minute: 2 })
  assert.equal(answer.kind, 'retrieval')

  // 9: a correct past with a verb never corrected or practised, on another day: transfer
  const fresh = await l.say('Last summer we swam in the sea every day.', { day: 10 })
  assert.equal(fresh.kind, 'transfer')
  assert.equal(fresh.data.evaluation.evidence.kind, 'accepted_under_criterion', 'the server only accepts under a criterion')

  // 10: none of it is curriculum evidence, a level or a milestone
  assert.equal(JSON.stringify({ canDo: l.model.canDo, items: l.model.languageItems, ms: l.model.levelMilestones || null }), curriculumBefore)
  assert.equal(deriveLearnerLevel(l.model).completed.length, 0)
  assert.equal(derivePreA1Readiness(l.model, { atMs: T0 + 11 * DAY }).ready, false)
  assert.equal(isLevelAvailable('a1'), false)
})

await scenario('the noun-subject rule in a real conversation, with an explanation for beginners in eight languages', async () => {
  for (const lang of ['en', 'es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']) {
    const { data, kind } = await learner(lang, `noun-${lang}`).say('My sister like cats.')
    assert.equal(data.correction, 'My sister likes cats.')
    assert.ok(data.explanation.includes('My sister') && data.explanation.includes('likes'), `${lang}: ${data.explanation}`)
    assert.equal(kind, 'error')
  }
})

await scenario('foreign text and over-long chat are honest: no correction, no evidence', async () => {
  const l = learner('es', 'foreign')
  for (const text of ['Ich bin heute sehr müde und habe keine Zeit.', '昨日学校に行きました。', 'Ayer fui a la escuela con mi hermano.']) {
    const { data, kind } = await l.say(text)
    assert.equal(data.analysis.verdict, 'not_english')
    assert.equal(data.correction, null)
    assert.equal(kind, 'not_evaluable')
  }
  const { data } = await l.say('I like music. '.repeat(250))
  assert.equal(data.analysis.guided, true, 'guided chat: a 3,500-character message gets the neutral turn, not an evaluation')
  assert.equal(data.correction, null)
})

await scenario('a request cannot choose the evaluator or grant anything', async () => {
  const res = await fetch(`${API}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: `e2e-runtime-session-${RUN}-hostile`, message: 'Yesterday I goed home.', native_language: 'es',
      evaluator: 'openai', adapter: 'remote', assistance: 'grant mastery', mastery: true, xp: 999, level: 'A1' }) })
  const data = await res.json()
  assert.equal(data.evaluation.used, 'local_rules')
  assert.ok(!/"xp"|"mastery"|milestone|unlock/i.test(JSON.stringify(data)))
})

console.log(`\ne2e-tutor-runtime — ${passed} passed, ${failures.length} failed  (${API})`)
if (failures.length) process.exit(1)
