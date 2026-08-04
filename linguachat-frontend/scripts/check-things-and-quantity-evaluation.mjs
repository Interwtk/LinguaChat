/*
 * check-things-and-quantity-evaluation — the sixth arc's three intents, case by
 * case, and the backend held to the same table.
 *
 * The interesting cases are the ones where a reply is perfectly good English and
 * still not what the turn asked for: "Book." identifies the thing and is not the
 * sentence being practised; "Two." answers "How many?" and does not answer "ask
 * for two sandwiches"; "Eleven." is outside the taught range and is still a
 * number. None of those may be reported as nothing.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  QUANTITY_FORMS, TAUGHT_NUMBERS, numberIn,
  evaluateAskWhatThing, evaluateIdentifyThing, evaluateUseQuantity, evaluateFree,
} from '../src/learning/engine/responseEvaluation.js'

let n = 0
const ok = () => { n++ }

const ask = (text) => evaluateAskWhatThing(text, {})
const identify = (text, targetThing = 'book') => evaluateIdentifyThing(text, { targetThing })
const quantity = (text, quantityForm, extra = {}) => evaluateUseQuantity(text, { quantityForm, targetThing: 'book', targetCount: 2, ...extra })

/* ---- 1) asking what a thing is ---- */
{
  for (const text of ["What's this?", 'What is this?', 'what’s this', "What's that?", 'What is that?']) {
    const r = ask(text)
    assert.equal(r.completedObjective, true, `"${text}" was refused → ${r.errorType}`)
    assert.ok(r.praiseKey)
  }
  // wider, real, and not what is taught — accepted anyway
  for (const text of ["What's this called?", 'What do you call this?']) {
    const r = ask(text)
    assert.equal(r.completedObjective, true, `"${text}" is a real question and was refused`)
    assert.equal(r.acceptedVariant, true, 'and it is not the sentence the arc teaches')
  }
  ok()
}

/* ---- 2) the questions it must not be confused with ---- */
{
  for (const text of ['Where is this?', 'Who is this?', "Where's this?"]) {
    const r = ask(text)
    assert.equal(r.completedObjective, false, `"${text}" asks something else`)
    assert.equal(r.errorType, 'wrong_question_word')
    assert.ok(r.understood, 'it is still a real question')
  }
  for (const text of ['What this?', 'This?', 'What?']) {
    const r = ask(text)
    assert.equal(r.completedObjective, false, `"${text}" is not the whole question`)
    assert.equal(r.errorType, 'incomplete_question')
  }
  const empty = ask('')
  assert.equal(empty.errorType, 'empty')
  assert.equal(empty.understood, false)
  ok()
}

/* ---- 3) saying what a thing is ---- */
{
  for (const text of ["It's a book.", 'It is a book.', 'This is a book.', "That's a book.", "it's a book"]) {
    assert.equal(identify(text).completedObjective, true, `"${text}" was refused`)
  }
  // the model answer follows the thing, article and all
  assert.equal(identify('', 'apple').naturalVersion, 'It’s an apple.')
  assert.equal(identify('', 'book').naturalVersion, 'It’s a book.')
  ok()
}

/* ---- 4) a bare noun communicates and does not complete the sentence ---- */
{
  for (const text of ['Book.', 'book', 'a book']) {
    const r = identify(text)
    assert.equal(r.completedObjective, false, `"${text}" is not the sentence being practised`)
    assert.equal(r.errorType, 'bare_noun')
    assert.ok(r.understood, 'and it does identify the thing')
    assert.ok(r.naturalVersion.includes('book'))
  }
  for (const text of ['It book.', 'Is a book.']) {
    const r = identify(text)
    assert.equal(r.completedObjective, false)
    assert.equal(r.errorType, 'incomplete_identification', `"${text}" → ${r.errorType}`)
  }
  ok()
}

/* ---- 5) a quantity, in the shape the turn asked for ---- */
{
  assert.deepEqual(QUANTITY_FORMS, ['bare', 'with_object', 'polite_request'])
  for (const text of ['Two.', 'two', '2', 'Two, please.']) {
    assert.equal(quantity(text, 'bare').completedObjective, true, `"${text}" answers "How many?"`)
  }
  assert.equal(quantity('Two books.', 'with_object').completedObjective, true)
  assert.equal(quantity('Three books.', 'with_object', { targetCount: 3 }).completedObjective, true)
  assert.equal(quantity('Can I have two books, please?', 'polite_request').completedObjective, true)

  /*
   * The same sentence, right in one turn and incomplete in another. This is the
   * whole reason the form travels with the step.
   */
  assert.equal(quantity('Two.', 'with_object').completedObjective, false)
  assert.equal(quantity('Two.', 'with_object').errorType, 'missing_counted_noun')
  assert.equal(quantity('Two books.', 'polite_request').completedObjective, false)
  assert.equal(quantity('Two books.', 'polite_request').errorType, 'missing_request_frame')
  ok()
}

/* ---- 6) plurals are looked up, and a wrong one is named ---- */
{
  const wrong = quantity('Two book.', 'with_object')
  assert.equal(wrong.completedObjective, false, '"two book" is not a sentence')
  assert.equal(wrong.errorType, 'wrong_number_form')
  assert.ok(wrong.understood, 'and the learner clearly counted correctly')
  assert.equal(wrong.naturalVersion, 'Two books.')

  const politeWrong = quantity('Can I have two sandwich, please?', 'polite_request', { targetThing: 'sandwich' })
  assert.equal(politeWrong.errorType, 'wrong_number_form')
  assert.equal(politeWrong.naturalVersion, 'Can I have two sandwiches, please?')
  assert.equal(quantity('One book.', 'with_object', { targetCount: 1 }).completedObjective, true)
  ok()
}

/* ---- 7) numbers outside the taught range are still numbers ---- */
{
  assert.deepEqual(TAUGHT_NUMBERS, ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'])
  const eleven = quantity('Eleven.', 'bare')
  assert.equal(eleven.completedObjective, true, 'it answers the question, so it is not "no quantity"')
  assert.equal(eleven.acceptedVariant, true, 'and the arc still only teaches ten of them')
  assert.equal(numberIn('Eleven.'), 11)
  assert.equal(numberIn('Two books, please.'), 2)
  assert.equal(numberIn('no numbers here'), null)
  ok()
}

/* ---- 8) a quantity that is not a number ---- */
{
  for (const text of ['Many.', 'A lot.', 'Some.']) {
    const r = quantity(text, 'bare')
    assert.equal(r.completedObjective, false, `"${text}" is not a number`)
    assert.equal(r.errorType, 'not_a_number')
    assert.ok(r.understood, 'and it does mean a quantity')
  }
  for (const text of ["I don't know.", 'It’s a book.']) {
    const r = quantity(text, 'bare')
    assert.equal(r.completedObjective, false)
    assert.equal(r.errorType, 'no_quantity', `"${text}" → ${r.errorType}`)
  }
  assert.equal(quantity('', 'bare').errorType, 'empty')
  ok()
}

/* ---- 9) a quantity of something uncountable is refused, not invented ---- */
{
  const r = quantity('Two waters.', 'with_object', { targetThing: 'water' })
  assert.equal(r.completedObjective, false, '"two water" must never be produced')
  assert.equal(r.errorType, 'uncountable_target')
  assert.equal(r.understood, false, 'the step itself is wrong, and the verdict says so')
  ok()
}

/* ---- 10) the dispatcher routes all three ---- */
{
  assert.equal(evaluateFree('ask_what_thing', "What's this?", {}).completedObjective, true)
  assert.equal(evaluateFree('identify_thing', "It's a phone.", { targetThing: 'phone' }).completedObjective, true)
  assert.equal(evaluateFree('use_quantity', 'Three books.', { quantityForm: 'with_object', targetThing: 'book', targetCount: 3 }).completedObjective, true)
  // an unknown form falls back rather than crashing
  assert.equal(evaluateFree('use_quantity', 'Two.', { quantityForm: 'nonsense' }).completedObjective, true)
  ok()
}

/* ---- 11) the shape and the thing reach the provider ---- */
{
  const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
  const hybrid = read('src/learning/engine/hybridEvaluation.js')
  assert.ok(/quantity_form: params\.quantityForm/.test(hybrid), 'the remote must know which shape was asked for')
  assert.ok(/target_count:/.test(hybrid), 'and how many')
  assert.ok(/quantityForm = ''/.test(hybrid), 'and the local half must receive it too')
  const shell = read('src/components/episode/EpisodeShell.jsx')
  assert.ok(/step\.quantityForm/.test(shell) && /step\.thingId/.test(shell),
    'the step names its thing and its shape explicitly')
  ok()
}

/* ---- 12) the backend answers the same table ---- */
{
  const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
  const py = read('../linguachat-backend/ai/evaluator.py')
  for (const intent of ['ask_what_thing', 'identify_thing', 'use_quantity']) {
    assert.ok(new RegExp(`if kind == "${intent}":`).test(py), `the backend does not dispatch ${intent}`)
  }
  for (const errorType of ['wrong_question_word', 'incomplete_question', 'bare_noun',
    'incomplete_identification', 'not_a_number', 'no_quantity', 'wrong_number_form',
    'missing_counted_noun', 'missing_request_frame']) {
    assert.ok(py.includes(`"${errorType}"`), `the backend cannot report ${errorType}`)
  }
  const schemas = read('../linguachat-backend/ai/schemas.py')
  assert.ok(/quantity_form:\s*str \| None = Field\(default=None, max_length=\d+\)/.test(schemas), 'quantity_form must be bounded')
  assert.ok(/target_count:\s*int \| None = Field\(default=None/.test(schemas), 'target_count must be bounded')
  const providers = read('../linguachat-backend/ai/providers.py')
  assert.ok(/quantity_form/.test(providers), 'the provider context must carry the shape')
  // and it must NOT carry anything about readiness
  for (const forbidden of ['readiness', 'ready', 'missing_skills', 'overdue']) {
    assert.ok(!new RegExp(`${forbidden}`, 'i').test(providers.split('class EvaluationContext')[1]?.split('class ')[0] || ''),
      `the provider context must never see ${forbidden}`)
  }
  ok()
}

console.log(`check-things-and-quantity-evaluation — OK  (${n} evaluation groups verified)`)
