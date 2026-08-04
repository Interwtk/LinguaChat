/*
 * check-semantic-slots — what may fill a slot, and what may never.
 *
 * Every ugly sentence this project has shipped came from a value travelling into
 * a slot that had no idea what kind of thing it was: "I want traveling.", "I'm
 * from Where you from.", "Can I have Sebastian, please." The compatibility layer
 * exists to refuse those, and this file is the list of sentences it must refuse.
 *
 * The rule it enforces is not "does the sentence parse". "Do you like Bogotá?"
 * parses perfectly. It is "does the value do the JOB this slot is asking of it" —
 * and the only place this project stores is where the learner is from, captured
 * as an origin, never offered as a preference.
 */
import assert from 'node:assert/strict'
import {
  INTENT_SLOTS, SEMANTIC_TYPES, SUBJECT_INTENT, asSubjectValue, classifyValue,
  isContextCompatible, selectCompatibleContext, slotsFor, typedValue,
} from '../src/learning/engine/semanticContext.js'
import { INTEREST_CONTEXTS, NEUTRAL_CONTEXT } from '../src/learning/engine/interests.js'
import { createLearnerModel } from '../src/learning/engine/learnerModel.js'
import { recordLearnerFact, selectLearnerFact } from '../src/learning/engine/learnerFacts.js'

let n = 0
const ok = () => { n++ }

/* ---- 1) the preference slot is declared, and declared narrowly ---- */
{
  const slots = slotsFor('yes_no_preference')
  assert.deepEqual([...slots].sort(), ['activity', 'drink', 'food', 'generic_object', 'interest'],
    'the preference slot must say exactly what it accepts')
  for (const forbidden of ['place', 'feeling', 'person']) {
    assert.ok(!slots.includes(forbidden),
      `${forbidden} may not fill a preference slot: the sentence would parse and still assert an opinion nobody expressed`)
  }
  // every slot list names real types
  for (const [intent, list] of Object.entries(INTENT_SLOTS)) {
    for (const type of list) {
      assert.ok(SEMANTIC_TYPES.includes(type), `${intent} accepts "${type}", which is not a semantic type`)
    }
  }
  ok()
}

/* ---- 2) the sentences the slot must produce, and the ones it must not ---- */
{
  const accepted = ['music', 'movies', 'games', 'coffee', 'tea', 'water', 'traveling', 'sports', 'books', 'my work']
  for (const value of accepted) {
    assert.ok(asSubjectValue(value), `"Do you like ${value}?" is a reasonable question and was refused`)
  }
  const refused = ['tired', 'good', 'fine', 'Sebastian', 'Bogotá', 'Where are you from?', '3', 'three', '']
  for (const value of refused) {
    assert.equal(asSubjectValue(value), null, `"Do you like ${value}?" must never be asked`)
  }
  ok()
}

/* ---- 3) the bug itself: a remembered like is not automatically a subject ---- */
{
  /*
   * Reproduction. Episode 7's gap stores whatever the learner types as a `like`
   * fact, and the episode subject read that value directly — so replaying
   * episode 15 asked "Do you like Bogotá?".
   */
  const model = createLearnerModel()
  for (const value of ['tired', 'Bogotá', 'Sebastian']) {
    recordLearnerFact(model, { type: 'like', value, sourceEpisodeId: 'what_you_like' })
  }
  const remembered = selectLearnerFact(model, { type: 'like', seed: 'we_can_continue:practice', allowRecent: true })
  assert.ok(remembered, 'the fact layer still remembers what the learner said')
  assert.equal(asSubjectValue(remembered.value), null,
    'none of these may colour an activity, however honestly they were remembered')

  // a compatible like still does its job
  const better = createLearnerModel()
  recordLearnerFact(better, { type: 'like', value: 'movies', sourceEpisodeId: 'what_you_like' })
  const good = selectLearnerFact(better, { type: 'like', seed: 'we_can_continue:practice', allowRecent: true })
  assert.equal(asSubjectValue(good.value)?.value, 'movies', 'a real preference must still personalise')
  ok()
}

/* ---- 3b) the DAY is never about something nobody can like ---- */
{
  /*
   * Found in the running app: Home announced "Something you mentioned: tired".
   * The sentences were already gated; the session TOPIC was not, so the day was
   * presented as being about a feeling. The gate belongs where the fact is
   * chosen, and it filters the candidates rather than rejecting the winner —
   * otherwise one unusable value hides a perfectly good one behind it.
   */
  const { getFactContext, factsOfType } = await import('../src/learning/engine/learnerFacts.js')
  const model = createLearnerModel()
  for (const value of ['tired', 'Bogotá']) recordLearnerFact(model, { type: 'like', value, sourceEpisodeId: 'what_you_like' })
  const nothing = getFactContext(model, { seed: 'day' })
  assert.equal(nothing.source, 'neutral', 'a day may not be about a feeling or a city')
  assert.equal(nothing.value, null)

  recordLearnerFact(model, { type: 'like', value: 'movies', sourceEpisodeId: 'what_you_like' })
  const better = getFactContext(model, { seed: 'day' })
  assert.equal(better.source, 'fact', 'and a real preference must still be used')
  assert.equal(better.value, 'movies')
  assert.equal(factsOfType(model, 'like').length, 3, 'nothing the learner said is forgotten')
  ok()
}

/* ---- 4) both surfaces ask the gate, rather than trusting the fact ---- */
{
  const { readFileSync } = await import('node:fs')
  const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
  /*
   * Every surface that says a remembered like out loud. Gating one of them left
   * "you said you like tired" in the practice room, the Garden and Home.
   */
  for (const file of ['src/components/episode/EpisodeShell.jsx', 'src/components/session/SessionRunner.jsx',
    'src/components/layout/ConversationRoom.jsx', 'src/components/memory/MemoryGarden.jsx',
    'src/context/AppContext.jsx', 'src/learning/engine/learnerFacts.js']) {
    const src = read(file)
    assert.ok(/asSubjectValue\(/.test(src), `${file} must route its subject through the compatibility layer`)
  }
  // and the filter runs BEFORE the choice, or one bad value hides a good one
  const facts = read('src/learning/engine/learnerFacts.js')
  assert.ok(/accept\s*=\s*null/.test(facts), 'selectLearnerFact must let the caller say what it can use')
  assert.ok(/if \(typeof accept === 'function' && !accept\(fact\)\) return false/.test(facts),
    'and it must filter candidates rather than reject the winner')
  assert.equal(SUBJECT_INTENT, 'yes_no_preference', 'the subject slot is the preference slot, named once')
  ok()
}

/* ---- 5) the curated catalogue is compatible by construction ---- */
{
  for (const [id, ctx] of Object.entries(INTEREST_CONTEXTS)) {
    assert.ok(asSubjectValue(ctx.targetNoun), `interest "${id}" offers "${ctx.targetNoun}", which cannot be liked`)
  }
  assert.ok(asSubjectValue(NEUTRAL_CONTEXT.targetNoun), 'the neutral fallback must itself be usable')
  ok()
}

/* ---- 6) with nothing compatible, the fallback is neutral and deterministic ---- */
{
  const chosen = selectCompatibleContext({
    intent: 'yes_no_preference',
    facts: ['tired', 'Bogotá', 'Sebastian'],
    interests: [],
    seed: 'learner:episode',
  })
  assert.ok(chosen, 'a slot with no compatible memory must still have something to say')
  assert.ok(isContextCompatible('yes_no_preference', chosen), 'and it must fit the slot')
  const again = selectCompatibleContext({
    intent: 'yes_no_preference', facts: ['tired'], interests: [], seed: 'learner:episode',
  })
  assert.deepEqual(again, chosen, 'the same learner and the same activity get the same value')
  // an intent that personalises nothing is never handed a value
  assert.equal(selectCompatibleContext({ intent: 'repair_request', facts: ['music'], interests: ['music'], seed: 's' }), null)
  ok()
}

/* ---- 7) typing refuses what it does not know, rather than guessing ---- */
{
  assert.equal(classifyValue('qwertyuiop'), null, 'an unknown word must stay untyped')
  assert.equal(classifyValue(''), null)
  assert.equal(classifyValue('Sebastian'), null)
  assert.equal(classifyValue('tired')?.semanticType, 'feeling')
  assert.equal(classifyValue('music')?.semanticType, 'interest')
  // an explicit assumption is allowed, and only where the caller says so
  assert.equal(classifyValue('stapler', { assumeType: 'generic_object' })?.semanticType, 'generic_object')
  assert.equal(typedValue('x', 'x', 'not_a_type'), null)
  ok()
}

console.log(`check-semantic-slots — OK  (${n} slot groups verified)`)
