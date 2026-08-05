/*
 * check-target-range-evidence — succeeding and practising are two claims.
 *
 * "Eleven." answers "How many?" perfectly and must stay accepted: refusing it
 * would teach the learner that real English is wrong. But the capability this
 * level owns is the numbers one to ten, and somebody who only ever says
 * "Eleven." and "Twelve." has shown they can count, not that they have the ten
 * words the curriculum taught.
 *
 * So the verdict keeps saying yes and the RECORDING stops claiming target
 * practice. Nothing is marked wrong, nothing is punished, and the Memory Garden
 * simply does not credit language that never came out of the learner's mouth.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { evaluateFree } from '../src/learning/engine/responseEvaluation.js'
import { createLearnerModel, recordItemAttempt } from '../src/learning/engine/learnerModel.js'
import { LEARNING_STATE_RANK } from '../src/learning/engine/learnerModel.js'

let groups = 0
const ok = () => { groups += 1 }

const ctx = (extra = {}) => ({
  name: 'Alex', place: 'Madrid', independent: true, targetNoun: 'music',
  quantityForm: 'bare', thingId: 'book', count: 2, ...extra,
})

/* ---- 1) inside the range: a success that is also practice ---- */
{
  for (const [text, count] of [['Two.', 2], ['two books', 2], ['One.', 1], ['Ten.', 10]]) {
    const r = evaluateFree('use_quantity', text, ctx({ count }))
    assert.equal(r.completedObjective, true, `"${text}" should answer the question`)
    assert.notEqual(r.targetEvidence, false, `"${text}" is one of the ten words this level teaches`)
  }
  ok()
}

/* ---- 2) outside the range: still a success, no longer evidence ---- */
{
  /*
   * Written out or in digits, on its own or hyphenated: the same answer must get
   * the same verdict. "Fifty." used to be reported as no quantity at all while
   * "50" passed, and "twenty-one" was read as ONE.
   */
  for (const text of ['Eleven.', 'Twelve.', 'Twenty.', 'Fifty.', 'fifty books', 'twenty-one', '50']) {
    const r = evaluateFree('use_quantity', text, ctx({ count: 11 }))
    assert.equal(r.completedObjective, true, `"${text}" is a real answer and must be accepted`)
    assert.ok(!r.errorType, `"${text}" must not be marked as an error`)
    assert.equal(r.targetEvidence, false, `"${text}" must not be recorded as practice of one to ten`)
  }
  ok()
}

/* ---- 3) a wrong answer is still a wrong answer ---- */
{
  const r = evaluateFree('use_quantity', 'hmm', ctx())
  assert.equal(r.completedObjective, false, 'nonsense must not pass just because nothing is being counted')
  ok()
}

/* ---- 4) both recording surfaces honour it ---- */
{
  const shell = readFileSync('src/components/episode/EpisodeShell.jsx', 'utf8')
  const runner = readFileSync('src/components/session/SessionRunner.jsx', 'utf8')
  for (const [name, src] of [['the episode shell', shell], ['the session runner', runner]]) {
    assert.ok(/targetEvidence === false/.test(src),
      `${name} must skip recording when the taught language was not what carried the turn`)
  }
  ok()
}

/* ---- 5) so out-of-range answers alone can never make an item usable ---- */
{
  /*
   * The rule both surfaces apply, applied here: a learner who answers "Eleven."
   * five times has communicated five times and practised the level's numbers
   * zero times, so nothing about those words may move.
   */
  const model = createLearnerModel()
  for (let i = 0; i < 5; i += 1) {
    const r = evaluateFree('use_quantity', 'Eleven.', ctx({ count: 11 }))
    if (r.targetEvidence === false) continue
    recordItemAttempt(model, 'two', { correct: true, independent: true, evidenceKind: 'open' })
  }
  assert.equal(model.languageItems.two, undefined, 'a word the learner never said must not appear in the Garden')

  // and the same learner saying "Two." twice does earn it
  const said = createLearnerModel()
  for (let i = 0; i < 2; i += 1) {
    const r = evaluateFree('use_quantity', 'Two.', ctx({ count: 2 }))
    assert.notEqual(r.targetEvidence, false)
    recordItemAttempt(said, 'two', { correct: true, independent: true, evidenceKind: 'open' })
  }
  assert.ok(LEARNING_STATE_RANK[said.languageItems.two.learningState] >= LEARNING_STATE_RANK.practicing,
    'language the learner really produced must move')
  ok()
}

/* ---- 6) the distinction is not applied where it would be wrong ---- */
{
  /*
   * Only the quantity evaluator has a taught RANGE. Everywhere else a correct
   * reply is practice of the objective, and inventing a second verdict for the
   * other intents would quietly stop crediting normal answers.
   */
  const src = readFileSync('src/learning/engine/responseEvaluation.js', 'utf8')
  const assignments = src.match(/r\.targetEvidence\s*=[^=]/g) || []
  assert.equal(assignments.length, 1, `the verdict should be set in exactly one place, found ${assignments.length}`)

  for (const kind of ['introduction', 'ask_name', 'express_like', 'identify_thing', 'polite_request']) {
    const r = evaluateFree(kind, {
      introduction: "Hi, I'm Alex.", ask_name: "What's your name?", express_like: 'I like music.',
      identify_thing: "It's a book.", polite_request: 'Can I have a coffee, please?',
    }[kind], ctx())
    if (!r.completedObjective) continue
    assert.notEqual(r.targetEvidence, false, `${kind} has no taught range and must credit its practice`)
  }
  ok()
}

console.log(`\ncheck-target-range-evidence — OK  (${groups} evidence groups verified)`)
