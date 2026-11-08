#!/usr/bin/env node
/*
 * check-a1-model-answers — no A1 step may reject the answer it shows as a model,
 * and a step that names a number accepts that number only.
 *
 * Found by the phase 6 review (docs/curriculum/en-a1-defects-phase6.md, D1 and D2):
 * one model answer of 52 was rejected, and "Five." passed "say 20" while earning
 * the 11–100 item. The existing journeys feed one fixed answer per evaluator kind,
 * so neither defect could show there. A1 stays closed.
 */
import assert from 'node:assert/strict'
import { evaluateFree, numberWords } from '../src/learning/engine/responseEvaluation.js'

const episodes = new Map()
const collect = (module) => { for (const value of Object.values(module)) for (const e of (Array.isArray(value) ? value : [value])) if (e?.id && Array.isArray(e.steps)) episodes.set(e.id, e) }
for (const n of [1, 2, 3, 4, 5]) collect(await import(`../src/learning/episodes/a1Arc${n}.js`))
for (const n of [6, 7]) collect(await import(`../src/learning/episodes/a1Arc${n}Content.js`))

let passed = 0
const check = (name, run) => { run(); passed++ }
const resolve = (s) => String(s).replace(/\{(\w+)\}/g, (_, k) => ({ name: 'Ana', partner: 'Maya', place: 'Lima' })[k] || 'Ana')
const ctxOf = (step) => ({
  independent: true, quantityForm: step.quantityForm, targetCount: step.count, exactNumber: step.exactNumber, numberRange: step.numberRange,
  repairKind: step.repairKind, meaningWord: step.meaningWord, timeForm: step.timeForm, placeName: step.placeName, relationHint: step.relationHint,
  abilityForm: step.abilityForm, arrangeStage: step.arrangeStage, canDoId: step.canDoId, name: 'Ana', partner: 'Maya',
})

/*
 * Known and open, each with its reason. The check fails if one is fixed and still
 * listed, so the list can only shrink. D2's fix changes the generated curriculum
 * skeleton, which the product guarantees protect against main: it waits for the owner.
 */
const KNOWN_OPEN = { 'see_you_on_friday:2': 'D2: evalKind ask_wellbeing for "How are you?"; fixing it edits a protected generated file' }

let models = 0
for (const ep of episodes.values()) {
  ep.steps.forEach((step, i) => {
    if (step.type !== 'free_reply' || !step.evalKind || !step.suggestionEn) return
    models++
    const key = `${ep.id}:${i}`
    check(`${key} accepts its own model`, () => {
      const verdict = evaluateFree(step.evalKind, resolve(step.suggestionEn), { ...ctxOf(step), canDoId: ep.canDoId })
      if (KNOWN_OPEN[key]) assert.equal(verdict.completedObjective, false, `${key} is fixed: remove it from KNOWN_OPEN`)
      else assert.ok(verdict.completedObjective, `${key} rejects "${step.suggestionEn}" (${verdict.errorType})`)
    })
  })
}

check('numbers in words up to one hundred', () => {
  assert.equal(numberWords(20), 'twenty'); assert.equal(numberWords(45), 'forty-five'); assert.equal(numberWords(100), 'one hundred'); assert.equal(numberWords(0), '')
})
const say = (text, step) => evaluateFree('use_quantity', text, { quantityForm: 'bare', independent: true, exactNumber: step.exactNumber, numberRange: step.numberRange })
check('a named number accepts that number and credits 11–100', () => {
  for (const text of ['Twenty.', '20', 'twenty']) { const v = say(text, { exactNumber: 20, numberRange: [11, 100] }); assert.ok(v.completedObjective && v.targetEvidence, text) }
  const v = say('Forty-five.', { exactNumber: 45, numberRange: [11, 100] })
  assert.ok(v.completedObjective && v.targetEvidence)
})
check('a named number refuses another number and shows the right one', () => {
  for (const text of ['Two.', 'Five.', 'Fourteen.', 'Fifty-four.']) {
    const v = say(text, { exactNumber: 45, numberRange: [11, 100] })
    assert.equal(v.completedObjective, false, text); assert.equal(v.errorType, 'wrong_number')
    assert.equal(v.naturalVersion, 'Forty-five.')
  }
})
check('a range step does not credit 11–100 for a small number', () => {
  const v = say('Five.', { numberRange: [11, 100] })
  assert.equal(v.targetEvidence, false)
})
check('Pre-A1 behaviour is unchanged without the new fields', () => {
  const v = evaluateFree('use_quantity', 'Eleven.', { quantityForm: 'bare', independent: true })
  assert.ok(v.completedObjective); assert.equal(v.targetEvidence, false)
  assert.ok(evaluateFree('use_quantity', 'Three.', { quantityForm: 'bare', independent: true }).targetEvidence)
})
check('the wellbeing step accepts its own answer and its variants', () => {
  // a bare "Fine." is nudged to the full form on purpose: the shared evaluator teaches "I'm …"
  for (const text of ['I’m good, thanks.', 'Good, thanks!', 'Fine, thanks.', "I'm fine, thank you."]) {
    assert.ok(evaluateFree('answer_wellbeing', text, { independent: true }).completedObjective, text)
  }
})
assert.ok(models >= 50, `measured ${models} model answers`)
console.log(`check-a1-model-answers: ${passed} passed, 0 failed (${models} model answers, ${Object.keys(KNOWN_OPEN).length} known and open: ${Object.keys(KNOWN_OPEN).join(', ')})`)
