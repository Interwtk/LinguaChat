/*
 * check-semantic-context — a personalised value may only be used where it makes
 * sense.
 *
 * Every absurd sentence this project has shipped came from the same mistake: a
 * value travelled from the activity that captured it into an activity that had
 * no idea what kind of thing it was. "I want traveling." "I need music."
 * "Can I have music, please?" Each one was grammatical and each one was wrong.
 *
 * These assertions pin the rule that replaced the guessing:
 *
 *     a correct neutral example beats an incorrect personalised one.
 *
 * They also walk the REAL episode data, so a future episode cannot introduce a
 * {item} slot for an intent that has nothing safe to put in it.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  SEMANTIC_TYPES, INTENT_SLOTS, slotsFor, typedValue, isContextCompatible,
  NEUTRAL_CATALOG, neutralFor, otherNeutral, classifyValue, selectCompatibleContext,
} from '../src/learning/engine/semanticContext.js'
import { ARC } from '../src/learning/episodes/index.js'
import { evaluateFree } from '../src/learning/engine/responseEvaluation.js'

let n = 0
const ok = () => { n++ }

// 1) a value carries a type, and an unknown type is refused rather than guessed
{
  assert.equal(typedValue('water', 'water', 'drink').semanticType, 'drink')
  assert.equal(typedValue('water', 'water', 'beverage'), null, 'an invented type is not a type')
  assert.equal(typedValue('', 'water', 'drink'), null)
  assert.equal(typedValue('water', '', 'drink'), null)
  for (const type of SEMANTIC_TYPES) assert.ok(typedValue('x', 'x', type), `${type} must be usable`)
  ok()
}

// 2) the sentences that actually went wrong, refused one by one
{
  const music = classifyValue('music')
  const traveling = classifyValue('traveling')
  const water = classifyValue('water')

  assert.equal(music.semanticType, 'interest')
  assert.equal(traveling.semanticType, 'activity')
  assert.equal(water.semanticType, 'drink')

  // "I want traveling." / "I need music." / "Can I have music, please?"
  assert.equal(isContextCompatible('express_want', traveling), false)
  assert.equal(isContextCompatible('express_need', music), false)
  assert.equal(isContextCompatible('polite_request', music), false)
  assert.equal(isContextCompatible('cafe_order_conversation', traveling), false)
  // and the same values where they DO belong
  assert.equal(isContextCompatible('express_like', music), true)
  assert.equal(isContextCompatible('express_like', traveling), true)
  assert.equal(isContextCompatible('polite_request', water), true)
  ok()
}

// 3) an intent with no personalised slot takes no value at all — silence beats
//    a wrong noun ("Thank you, music.")
{
  for (const intent of ['finish_order', 'thank_service']) {
    assert.deepEqual(slotsFor(intent), [], `${intent} must not personalise`)
    assert.equal(selectCompatibleContext({ intent, facts: ['coffee'], interests: ['music'] }), null)
    assert.equal(neutralFor(intent, 'seed'), null)
  }
  // an intent nobody declared is treated the same way, not as a free-for-all
  assert.deepEqual(slotsFor('some_future_intent'), [])
  assert.equal(selectCompatibleContext({ intent: 'some_future_intent', facts: ['coffee'] }), null)
  ok()
}

// 4) a place is never invented: the learner's own or nothing
{
  assert.deepEqual(NEUTRAL_CATALOG.place, [], 'there is no neutral country to be from')
  assert.equal(neutralFor('answer_origin', 'seed'), null)
  assert.equal(isContextCompatible('answer_origin', classifyValue('music')), false)
  assert.equal(selectCompatibleContext({ intent: 'answer_origin', facts: ['music'], interests: ['games'] }), null)
  // a real place, supplied as a typed value, is accepted
  assert.equal(isContextCompatible('answer_origin', typedValue('bogota', 'Bogotá', 'place')), true)
  ok()
}

// 5) preference order: a fitting memory, then a fitting interest, then neutral
{
  const fromFact = selectCompatibleContext({ intent: 'polite_request', facts: ['coffee'], interests: ['music'], seed: 's' })
  assert.equal(fromFact.value, 'coffee', 'a memory that fits wins')

  // the interest does not fit a request, so the neutral catalogue answers
  const noFit = selectCompatibleContext({ intent: 'polite_request', facts: ['music'], interests: ['games'], seed: 's' })
  assert.ok(noFit, 'there is always a correct answer')
  assert.equal(noFit.semanticType, 'drink')
  assert.notEqual(noFit.value, 'music')

  // and where the interest DOES fit, it is used before a neutral value
  const fromInterest = selectCompatibleContext({ intent: 'express_like', facts: [], interests: ['games'], seed: 's' })
  assert.equal(fromInterest.value, 'games')

  // opting out of the fallback yields nothing rather than something wrong
  assert.equal(selectCompatibleContext({ intent: 'polite_request', facts: ['music'], fallback: false }), null)
  ok()
}

// 6) an unknown word is not quietly typed
{
  assert.equal(classifyValue('quetzalcoatl'), null)
  assert.equal(classifyValue(''), null)
  assert.equal(classifyValue(null), null)
  // ...unless the caller can honestly vouch for the slot it came from
  assert.equal(classifyValue('lemonade', { assumeType: 'drink' }).semanticType, 'drink')
  assert.equal(classifyValue('lemonade', { assumeType: 'nonsense' }), null)
  ok()
}

// 7) deterministic: same seed, same value — no randomness anywhere
{
  const a = selectCompatibleContext({ intent: 'polite_request', facts: [], interests: [], seed: 'sebastian:ep10' })
  const b = selectCompatibleContext({ intent: 'polite_request', facts: [], interests: [], seed: 'sebastian:ep10' })
  assert.deepEqual(a, b)
  const src = readFileSync(new URL('../src/learning/engine/semanticContext.js', import.meta.url), 'utf8')
  assert.ok(!/Math\.random/.test(src), 'a personalised example must be reproducible')
  ok()
}

// 8) "now try another one" really is another one
{
  const item = selectCompatibleContext({ intent: 'polite_request', facts: [], interests: [], seed: 'x' })
  const other = otherNeutral('polite_request', 'x:other', item)
  assert.ok(other, 'a variation step needs something to vary to')
  assert.notEqual(other.value, item.value, 'the variation must not repeat the same order')
  // a slot with a single option repeats rather than inventing a second
  assert.ok(otherNeutral('answer_wellbeing', 'x', neutralFor('answer_wellbeing', 'x')))
  ok()
}

// 9) every neutral value is correct English for the slot it sits in
{
  for (const [slot, values] of Object.entries(NEUTRAL_CATALOG)) {
    for (const v of values) {
      assert.ok(v && v.value && v.semanticType, `${slot} holds a typed value`)
      assert.ok(SEMANTIC_TYPES.includes(v.semanticType))
      assert.ok(!/\{|\}/.test(v.value), 'a neutral value is literal, never a placeholder')
    }
  }
  // the drinks really do work in the sentence the arc teaches
  for (const drink of NEUTRAL_CATALOG.drink) {
    const r = evaluateFree('polite_request', `Can I have ${drink.value}, please?`, {})
    assert.ok(r.completedObjective, `"Can I have ${drink.value}, please?" must be valid English`)
  }
  ok()
}

// 10) the real episodes: a step may only ask for {item} where the slot is safe
{
  for (const ep of ARC) {
    for (const step of ep.steps) {
      const strings = [step.promptEn, step.sceneEn, step.suggestionEn, step.target].filter(Boolean).join(' ')
      if (!/\{item\}|\{otherItem\}/.test(strings)) continue
      assert.ok(step.evalKind, `${ep.id}: an {item} step must declare an intent`)
      assert.ok(slotsFor(step.evalKind).length > 0,
        `${ep.id}: intent ${step.evalKind} has no slot, so {item} would be unfillable`)
      assert.ok(selectCompatibleContext({ intent: step.evalKind, seed: ep.id }),
        `${ep.id}: intent ${step.evalKind} must always resolve to something`)
    }
  }
  ok()
}

// 11) every intent the episodes evaluate is either declared or deliberately not
{
  const used = new Set()
  for (const ep of ARC) for (const s of ep.steps) if (s.evalKind) used.add(s.evalKind)
  for (const intent of used) {
    assert.ok(Object.prototype.hasOwnProperty.call(INTENT_SLOTS, intent),
      `${intent} must state which values it accepts (an empty list is a valid answer)`)
  }
  ok()
}

console.log(`check-semantic-context — OK  (${n} compatibility groups verified)`)
