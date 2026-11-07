#!/usr/bin/env node
/*
 * check-guided-scenarios — the client half of the guided tutor.
 *
 * The server decides every turn (linguachat-backend/ai/guided_tutor.py, tested in
 * tests/test_guided_scenarios.py). What can go wrong here is narrower: a state the
 * client trusts and should not, a conversation that outlives the screen, a practice
 * turn filed as evidence, or a safety reply read aloud as a target-language line.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizeChatResponse, safeScenario } from '../src/services/api.js'

let passed = 0
const check = (name, run) => { run(); passed++; console.log('  ok  ' + name) }
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

check('the guided state is read from the analysis, with closed values only', () => {
  const reply = normalizeChatResponse({ reply: 'x', mode: 'chat', analysis: { verdict: 'error', scenario: { id: 'en_meet', step: 2, attempt: 1, turn_class: 'error', done: false } } })
  assert.deepEqual(reply.scenario, { id: 'en_meet', step: 2, attempt: 1, done: false, turnClass: 'error' })
})
check('a reply without a scenario has none', () => assert.equal(normalizeChatResponse({ reply: 'x', mode: 'chat' }).scenario, null))
check('a malformed state is refused or reduced', () => {
  assert.equal(safeScenario({ id: '../etc', step: 1 }), null)
  assert.equal(safeScenario({ id: 'A B' }), null)
  assert.deepEqual(safeScenario({ id: 'en_meet', step: 999, attempt: -1, done: 'yes', turn_class: 'mastered' }), { id: 'en_meet', step: 0, attempt: 0, done: false, turnClass: null })
})

const screen = read('src/components/chat/ScenarioPractice.jsx')
check('practice stays out of the learner record and off the device', () => {
  assert.doesNotMatch(screen, /recordChatTurn|updateLearnerModel|saveLearnerModel|localStorage|captureLearnerAccess|addXp/)
})
check('only a scenario turn is treated as target language', () => {
  assert.match(screen, /target: reply\.provider === 'scenario'/)
  assert.match(screen, /m\.role === 'lingua' && m\.target && <ListeningTurn/)
})
check('the permanent note is shown in the situations too', () => assert.match(screen, /t\('chatSafetyNote'\)/))
check('choosing an option counts as help', () => assert.match(screen, /setAssisted\(true\); submit\(option\)/))
check('the screen is loaded on demand from both chats', () => {
  for (const file of ['src/components/layout/ConversationRoom.jsx', 'src/components/today/CourseChat.jsx']) {
    assert.match(read(file), /lazy\(\(\) => import\('\.\.\/chat\/ScenarioPractice\.jsx'\)/, file)
  }
})
console.log(`check-guided-scenarios: ${passed} passed, 0 failed`)
