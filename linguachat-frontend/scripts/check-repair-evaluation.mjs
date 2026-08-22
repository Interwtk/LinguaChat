/*
 * check-repair-evaluation — the fifth arc's two intents, case by case.
 *
 * Repair is ONE intent with three strategies (`repairKind`), not five intents.
 * That decision only pays off if the evaluator is exact about which strategy a
 * turn asked for while still recognising the others as real repairs — so this
 * file is mostly a table of sentences and the verdict each must get.
 *
 * It also holds the frontend and the backend to the same table: the deterministic
 * mirror in ai/evaluator.py is the fallback a learner gets when the network is
 * slow, and a fallback that disagrees with the local rules is a bug the learner
 * experiences as the app changing its mind.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  REPAIR_KINDS, isRepairAttempt, evaluateRepairRequest, evaluateCloseEncounter, evaluateFree,
} from '../src/learning/engine/responseEvaluation.js'

let n = 0
const ok = () => { n++ }

const repair = (text, repairKind) => evaluateRepairRequest(text, { repairKind })
const close = (text) => evaluateCloseEncounter(text, {})

/* ---- 1) the three strategies, each accepted in its own turn ---- */
{
  const accepted = {
    signal_nonunderstanding: [
      "I don't understand.", 'I do not understand.', 'Sorry, I don’t understand.',
      "I don't get it.", "I didn't catch that.", "I'm lost.",
    ],
    repeat: [
      'Can you repeat, please?', 'Can you repeat?', 'Please repeat.',
      'Could you repeat, please?', 'Can you say that again?', 'Say it again.',
    ],
    slow_down: [
      'Please speak slowly.', 'Speak slowly, please.', 'Can you speak slowly, please?',
      'Could you speak more slowly?', 'Slowly, please.',
    ],
    /*
     * A1 arc 2's fourth strategy. The word may be quoted or bare, and "What is
     * ___?" is the same question asked another way — a learner who gets the meaning
     * across has the capability, whichever wording they reached for.
     */
    ask_meaning: [
      'What does “late” mean?', 'What does late mean?', 'What does "busy" mean?',
      'Sorry, what does late mean?', 'What is late?', 'What’s busy?',
    ],
    /* A1 arc 6's fifth strategy: a word known in another language, not English */
    ask_how_to_say: [
      'How do you say that in English?', 'How do you say cook in English?',
      'How do I say that?', 'How do you say “nadar” in English?',
    ],
  }
  for (const kind of REPAIR_KINDS) {
    assert.ok(accepted[kind], `${kind} has no accepted list`)
    for (const text of accepted[kind]) {
      const r = repair(text, kind)
      assert.equal(r.completedObjective, true, `${kind} rejected "${text}" → ${r.errorType}`)
      assert.equal(r.retryRequired ?? false, false, `${kind} accepted "${text}" and still asked for a retry`)
      assert.ok(r.praiseKey, `${kind} accepted "${text}" with nothing to say about it`)
    }
  }
  ok()
}

/* ---- 2) the idea is there, the sentence is not ---- */
{
  const partial = {
    signal_nonunderstanding: ["Don't understand.", 'I not understand.', 'No understand.'],
    repeat: ['Repeat please.', 'Repeat.', 'Again?'],
    slow_down: ['Speak slow.', 'Slow, please.', 'Slow down.'],
    /* the reach for the meaning question that did not arrive */
    ask_meaning: ['Mean?', 'Meaning?', 'Late meaning?'],
    /* the reach for the how-to-say question with nothing named yet */
    ask_how_to_say: ['How do you say?', 'How do you spell?'],
  }
  /*
   * The error name differs for arc 2's and arc 6's strategies, and
   * deliberately: the correction a half-built question needs is the frame, not
   * "that is not a repair".
   */
  const PARTIAL_ERROR = { ask_meaning: 'incomplete_meaning_question', ask_how_to_say: 'incomplete_how_to_say' }
  for (const kind of REPAIR_KINDS) {
    for (const text of partial[kind]) {
      const r = repair(text, kind)
      assert.equal(r.completedObjective, false, `${kind} accepted the partial "${text}"`)
      assert.equal(r.errorType, PARTIAL_ERROR[kind] || 'incomplete_repair', `${kind} "${text}" → ${r.errorType}`)
      assert.ok(r.understood, `"${text}" communicates; it must not be treated as noise`)
      assert.ok(r.naturalVersion, `"${text}" must be shown the full sentence`)
    }
  }
  ok()
}

/* ---- 3) "I don't know" is a different sentence, not a worse one ---- */
{
  for (const text of ["I don't know.", 'I do not know.', 'No idea.']) {
    const r = repair(text, 'signal_nonunderstanding')
    assert.equal(r.completedObjective, false, `"${text}" is not a repair`)
    assert.equal(r.errorType, 'means_dont_know', `"${text}" → ${r.errorType}`)
    assert.ok(r.understood, 'the learner produced a real sentence')
    assert.ok(r.explanation, 'it must be explained, not just refused')
  }
  // and it is never confused with the target it resembles
  assert.equal(repair("I don't know.", 'signal_nonunderstanding').errorType, 'means_dont_know')
  assert.equal(repair("I don't understand.", 'signal_nonunderstanding').completedObjective, true)
  ok()
}

/* ---- 4) a real speaker's shortcut: understood, and not the sentence taught ---- */
{
  for (const text of ['What?', 'Sorry?', 'Huh?', 'Pardon?', 'Excuse me?']) {
    const r = repair(text, 'signal_nonunderstanding')
    assert.equal(r.completedObjective, false, `"${text}" must not complete the objective`)
    assert.equal(r.errorType, 'too_short_repair', `"${text}" → ${r.errorType}`)
    assert.ok(r.understood, `"${text}" does signal a breakdown`)
  }
  ok()
}

/* ---- 5) a different repair is still a repair ---- */
{
  const cross = [
    ['signal_nonunderstanding', 'Can you repeat, please?'],
    ['signal_nonunderstanding', 'Please speak slowly.'],
    ['repeat', "I don't understand."],
    ['repeat', 'Please speak slowly.'],
    ['slow_down', 'Can you repeat, please?'],
    ['slow_down', "I don't understand."],
  ]
  for (const [kind, text] of cross) {
    const r = repair(text, kind)
    assert.equal(r.completedObjective, false, `${kind} accepted the other strategy "${text}"`)
    assert.equal(r.errorType, 'other_repair', `${kind} + "${text}" → ${r.errorType}`)
    assert.ok(r.understood, 'the conversation was kept alive; say so')
    assert.equal(r.priorityCorrection, 'ep14RetryExplainOther',
      'the retry must praise the repair before naming the one being practised')
  }
  ok()
}

/* ---- 6) nothing at all, and nothing relevant ---- */
{
  for (const kind of REPAIR_KINDS) {
    const empty = repair('', kind)
    assert.equal(empty.errorType, 'empty')
    assert.equal(empty.understood, false)
    assert.ok(empty.retryPrompt, 'an empty answer still needs a way forward')

    const off = repair('I like music.', kind)
    assert.equal(off.completedObjective, false)
    assert.equal(off.errorType, 'no_repair', `${kind} + off-topic → ${off.errorType}`)
  }
  ok()
}

/* ---- 7) an unknown or absent strategy falls back, it does not crash ---- */
{
  for (const kind of [undefined, null, '', 'shout_louder']) {
    const r = repair("I don't understand.", kind)
    assert.equal(r.completedObjective, true, `kind=${kind} must fall back to the first strategy`)
    assert.ok(r.naturalVersion.includes('understand'))
  }
  ok()
}

/* ---- 8) no noun ever enters a repair ---- */
{
  /*
   * "Can you repeat music, please?" was the exact shape of bug this arc had to
   * avoid: the model answer is fixed language and must never be personalised.
   */
  for (const kind of REPAIR_KINDS) {
    const r = evaluateRepairRequest('', { repairKind: kind, targetNoun: 'music', targetThing: 'water', name: 'Sam' })
    assert.ok(!/music|water|Sam/.test(r.naturalVersion), `${kind} personalised its model answer: ${r.naturalVersion}`)
  }
  ok()
}

/* ---- 9) closing an encounter ---- */
{
  for (const text of ['Bye.', 'Goodbye.', 'See you.', 'See you later.', 'Thanks, bye.',
    'Thank you, bye.', 'Bye bye.', 'See you tomorrow.', 'Take care.']) {
    const r = close(text)
    assert.equal(r.completedObjective, true, `close rejected "${text}" → ${r.errorType}`)
    assert.ok(r.praiseKey)
  }
  for (const [text, errorType] of [
    ['Thank you.', 'not_a_close'],
    ['Thanks.', 'not_a_close'],
    ['Thank you very much.', 'not_a_close'],
    ['I like music.', 'no_close_yet'],
    ['', 'empty'],
  ]) {
    const r = close(text)
    assert.equal(r.completedObjective, false, `close accepted "${text}"`)
    assert.equal(r.errorType, errorType, `close "${text}" → ${r.errorType}`)
  }
  assert.ok(close('Thank you.').understood, 'thanking someone is warm and understood')
  ok()
}

/* ---- 10) the dispatcher routes both intents, and isRepairAttempt agrees ---- */
{
  assert.equal(evaluateFree('repair_request', 'Can you repeat, please?', { repairKind: 'repeat' }).completedObjective, true)
  assert.equal(evaluateFree('close_encounter', 'Bye.', {}).completedObjective, true)
  for (const text of ["I don't understand.", 'Can you repeat, please?', 'Please speak slowly.']) {
    assert.ok(isRepairAttempt(text), `isRepairAttempt missed "${text}"`)
  }
  for (const text of ['I like music.', 'Bye.', "I don't know.", '']) {
    assert.equal(isRepairAttempt(text), false, `isRepairAttempt over-claimed "${text}"`)
  }
  ok()
}

/* ---- 11) the repair strategy reaches the provider, and support state does not ---- */
{
  const src = readFileSync(new URL('../src/learning/engine/hybridEvaluation.js', import.meta.url), 'utf8')
  assert.ok(/repair_kind:\s*params\.repairKind/.test(src),
    'the remote payload must say which repair was asked for')
  assert.ok(/repairKind\s*=\s*''/.test(src),
    'evaluateEpisodeResponse must accept repairKind, or the local half grades the wrong target')
  for (const forbidden of ['reason', 'scaffoldReason', 'learningState']) {
    assert.ok(!new RegExp(`${forbidden}[^:]*:\\s*params\\.`).test(src),
      `${forbidden} must never be sent to the provider`)
  }
  ok()
}

/* ---- 12) the backend mirror answers the same table ---- */
{
  /*
   * Parity is checked by reading the backend source rather than by calling it:
   * this suite must stay network-free and Python-free. The behavioural half of
   * the parity lives in linguachat-backend/tests/test_learning.py, which runs the
   * same sentence table through the real deterministic evaluator.
   */
  const py = readFileSync(new URL('../../linguachat-backend/ai/evaluator.py', import.meta.url), 'utf8')
  assert.ok(/if kind == "repair_request":/.test(py), 'the backend must dispatch repair_request')
  assert.ok(/if kind == "close_encounter":/.test(py), 'the backend must dispatch close_encounter')
  for (const kind of REPAIR_KINDS) {
    assert.ok(py.includes(`"${kind}"`), `the backend does not know the ${kind} strategy`)
  }
  for (const errorType of ['other_repair', 'means_dont_know', 'incomplete_repair',
    'too_short_repair', 'no_repair', 'not_a_close', 'no_close_yet']) {
    assert.ok(py.includes(`"${errorType}"`), `the backend cannot report ${errorType}`)
  }
  const providers = readFileSync(new URL('../../linguachat-backend/ai/providers.py', import.meta.url), 'utf8')
  assert.ok(/repair_kind/.test(providers), 'the provider context must carry the strategy')
  const schemas = readFileSync(new URL('../../linguachat-backend/ai/schemas.py', import.meta.url), 'utf8')
  assert.ok(/repair_kind:\s*str \| None = Field\(default=None, max_length=\d+\)/.test(schemas),
    'repair_kind must be optional and bounded')
  ok()
}

console.log(`check-repair-evaluation — OK  (${n} repair groups verified)`)
