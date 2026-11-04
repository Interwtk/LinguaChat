#!/usr/bin/env node
/*
 * e2e-chat-continuity — the whole loop across the real HTTP boundary (P3).
 *
 * Needs a running backend with the free local engine:
 *   cd linguachat-backend && LINGUACHAT_PROVIDER=local python -m uvicorn main:app --port 8000
 *   node scripts/e2e-chat-continuity.mjs [http://127.0.0.1:8000]
 *
 * Each learner sends real messages to POST /chat. The device side is the real
 * frontend code: services/chatAnalysis.js reduces the reply, chatEvidence.js
 * classifies and records it in a real learner model, and the memory it builds
 * travels back in the next request — exactly what AppContext does. Days are
 * simulated by the turn times; nothing about the server is mocked.
 *
 * Not part of check:all (it needs a server). The P3 report records its run.
 */
import assert from 'node:assert/strict'
import { safeAnalysis } from '../src/services/chatAnalysis.js'
import { classifyChatTurn, recordChatTurn, chatDifficulties, learningMemoryPayload } from '../src/learning/engine/chatEvidence.js'
import { createLearnerModel } from '../src/learning/engine/learnerModel.js'
import { isLevelAvailable } from '../src/learning/curriculum/levels.js'

const API = process.argv[2] || 'http://127.0.0.1:8000'
const DAY = 86400000
const T0 = Date.UTC(2026, 9, 10, 9)
let passed = 0
const failures = []
async function scenario(name, run) {
  try { await run(); passed++; console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}

function learner(lang) {
  const model = createLearnerModel()
  let last = null, n = 0
  return {
    model,
    set lang(v) { lang = v },
    async say(message, { day = 0, minute = 0, session = `day${day}`, assisted = false } = {}) {
      const at = T0 + day * DAY + minute * 60000
      const res = await fetch(`${API}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: `e2e-continuity-session-${lang}-${session}`, message, level: 'A1', native_language: lang,
          learning_memory: learningMemoryPayload(model, at) }),
      })
      assert.equal(res.status, 200)
      const data = await res.json()
      const analysis = safeAnalysis(data.analysis)
      const c = classifyChatTurn({ turnId: `t${++n}`, at, message, analysis, assisted, model,
        previous: last ? { correction: last.correction, retrieval: last.retrieval } : null })
      recordChatTurn(model, c)
      last = { correction: data.correction, retrieval: analysis?.retrieval || null }
      return { data, kind: c.kind, at }
    },
    difficulty: (rule, at) => chatDifficulties(model, at).find(d => d.rule === rule),
  }
}

await scenario('a beginner across five days: error → copy → delayed retrieval → transfer, never mastery', async () => {
  const l = learner('es')
  const d1 = await l.say('Yesterday I goed to school.', { day: 0 })
  assert.equal(d1.kind, 'error'); assert.equal(d1.data.analysis.strategy, 'brief_explanation')
  assert.equal((await l.say('Yesterday I went to school.', { day: 0, minute: 1 })).kind, 'copied')
  // day 2: the device says it is due; the tutor offers a retrieval with a new verb
  const d2 = await l.say('I like my job.', { day: 1, minute: 60 })
  const retrieval = d2.data.analysis.retrieval
  assert.ok(retrieval && retrieval.base !== 'go', 'a delayed retrieval in a new sentence')
  assert.match(d2.data.learning_action.prompt, /Un repaso rápido de otro día/)
  assert.equal((await l.say(retrieval.expected, { day: 1, minute: 62 })).kind, 'retrieval')
  // day 5: spontaneous use of another irregular past
  assert.equal((await l.say('Last weekend we swam in the lake.', { day: 4 })).kind, 'transfer')
  const d = l.difficulty('past_irregular', T0 + 4 * DAY + 1)
  assert.equal(d.status, 'holding'); assert.equal(d.curricular, false)
  assert.equal(isLevelAvailable('a1'), false, 'A1 stays closed whatever the chat saw')
})

await scenario('the same error on three days: the method changes, chosen by the teaching policy', async () => {
  const l = learner('ja')
  await l.say('Yesterday I goed home.', { day: 0 })
  const offer = await l.say('I like tea.', { day: 1, minute: 60 })
  await l.say('writed', { day: 1, minute: 61 })                         // the retrieval misses
  const third = await l.say('Last week I buyed shoes.', { day: 2 })
  const d = l.difficulty('past_irregular', T0 + 2 * DAY + 1)
  assert.equal(d.status, 'recurring')
  assert.ok(offer.data.analysis.retrieval)
  // the server started this new conversation with the policy's choice, not the light touch
  assert.notEqual(third.data.analysis.strategy, 'brief_explanation')
  assert.match(third.data.explanation, /[ぁ-んァ-ン一-龯]/, 'explained in the learner’s language')
})

await scenario('a fast learner: no difficulty, no retrieval, nothing remembered', async () => {
  const l = learner('fr')
  for (const [i, m] of ['Yesterday I went to the cinema.', 'Last week we ate pizza.', 'I bought a new bike.'].entries()) {
    const r = await l.say(m, { day: i })
    assert.notEqual(r.data.analysis.verdict, 'error')
    assert.equal(r.data.analysis.retrieval, undefined)
  }
  assert.deepEqual(chatDifficulties(l.model, T0 + 5 * DAY), [], 'correct use alone creates no difficulty')
  assert.deepEqual(learningMemoryPayload(l.model, T0 + 5 * DAY), [])
})

await scenario('switching the auxiliary language keeps the memory and changes only the words', async () => {
  const l = learner('es')
  await l.say('She like music.', { day: 0 })
  l.lang = 'ar'
  const r = await l.say('I like my city.', { day: 2 })
  assert.equal(r.data.analysis.retrieval?.rule, 'third_person', 'the difficulty followed the learner')
  assert.match(r.data.learning_action.prompt, /[؀-ۿ]/, 'now framed in Arabic')
})

await scenario('ambiguous, out of scope and insufficient turns are not evidence either way', async () => {
  const l = learner('de')
  assert.equal((await l.say('Hallo, wie geht es?', { day: 0 })).kind, 'not_evaluable')
  assert.equal((await l.say('ok', { day: 0, minute: 1 })).kind, 'not_evaluable')
  assert.equal((await l.say('I am agree with you.', { day: 0, minute: 2 })).kind, 'insufficient', 'beyond the rules: no claim')
  assert.deepEqual(chatDifficulties(l.model, T0 + DAY), [])
})

console.log(`\ne2e-chat-continuity — ${passed} passed, ${failures.length} failed  (${API})`)
if (failures.length) process.exitCode = 1
