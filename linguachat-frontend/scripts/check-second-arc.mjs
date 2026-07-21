/*
 * check-second-arc — episodes 4-6 are well formed, unlock in order, build on the
 * first arc, and their new intents accept natural answers while asking for a
 * better version of an incomplete one.
 */
import assert from 'node:assert/strict'
import { ARC, getEpisode, episodesInArc, ARCS } from '../src/learning/episodes/index.js'
import { SEED_VOCAB_BY_ID } from '../src/data/vocabulary.js'
import { evaluateFree } from '../src/learning/engine/responseEvaluation.js'
import { createLearnerModel, setEpisodeState } from '../src/learning/engine/learnerModel.js'
import { isEpisodeUnlocked } from '../src/learning/engine/planner.js'
import { partnerFor, placeFor, PARTNER_PLACE_NAMES } from '../src/learning/engine/variation.js'

let n = 0
const ok = () => { n++ }
const NEW_IDS = ['how_are_you', 'where_from', 'first_conversation']

// 1) structure: six episodes in two arcs, ids unique, steps well formed
{
  assert.equal(ARC.length, 6)
  assert.equal(new Set(ARC.map(e => e.id)).size, 6)
  assert.deepEqual(episodesInArc('greetings').map(e => e.id), ['first_greeting', 'ask_name', 'nice_to_meet'])
  assert.deepEqual(episodesInArc('connect').map(e => e.id), NEW_IDS)
  assert.deepEqual(ARCS, ['greetings', 'connect'])
  for (const id of NEW_IDS) {
    const ep = getEpisode(id)
    assert.ok(ep.canDoId && ep.titleKey && ep.goalKey && ep.canDoNameKey, `${id} missing keys`)
    assert.ok(ep.xp > 0 && ep.estimatedMinutes > 0)
    assert.ok(ep.steps.length >= 8, `${id} should be a full episode`)
    assert.equal(ep.steps.at(-1).type, 'completion')
    for (const s of ep.steps) assert.ok(s.type, `${id} step without a type`)
  }
  ok()
}

// 2) prerequisites chain the two arcs: 4 needs 3, 5 needs 4, 6 needs 5
{
  assert.deepEqual(getEpisode('how_are_you').prerequisites, ['nice_to_meet'])
  assert.deepEqual(getEpisode('where_from').prerequisites, ['how_are_you'])
  assert.deepEqual(getEpisode('first_conversation').prerequisites, ['where_from'])
  const model = createLearnerModel()
  assert.equal(isEpisodeUnlocked(model, getEpisode('how_are_you')), false, 'locked before arc 1 is done')
  for (const id of ['first_greeting', 'ask_name', 'nice_to_meet']) {
    setEpisodeState(model, id, { status: 'completed', stepIndex: 0, awarded: true })
  }
  assert.equal(isEpisodeUnlocked(model, getEpisode('how_are_you')), true)
  assert.equal(isEpisodeUnlocked(model, getEpisode('where_from')), false)
  ok()
}

// 3) continuity: each new episode recovers first-arc content before adding more
{
  for (const id of ['how_are_you', 'where_from']) {
    const first = getEpisode(id).steps[0]
    assert.equal(first.type, 'recall', `${id} must open by recovering earlier content`)
    assert.equal(first.review, true)
  }
  // episode 6 consolidates both arcs
  const six = getEpisode('first_conversation')
  const kinds = six.steps.map(s => s.evalKind).filter(Boolean)
  for (const k of ['introduction', 'ask_name', 'nice_to_meet', 'ask_wellbeing', 'answer_wellbeing', 'ask_origin', 'answer_origin']) {
    assert.ok(kinds.includes(k), `episode 6 should reuse ${k}`)
  }
  // conversation-first: mostly turns, not cards
  const freeTurns = six.steps.filter(s => s.type === 'free_reply' || s.type === 'recall').length
  assert.ok(freeTurns >= 5, 'episode 6 should be a real exchange of turns')
  ok()
}

// 4) every referenced vocabulary id exists (garden, targets, reviews)
{
  for (const ep of ARC) {
    for (const id of [...(ep.gardenItems || []), ...(ep.targetItems || []), ...(ep.reviewItems || [])]) {
      assert.ok(SEED_VOCAB_BY_ID[id], `${ep.id} references unknown vocab item ${id}`)
    }
  }
  ok()
}

// 5) new garden items exist and carry a meaning in every native language
{
  const REQUIRED = ['en', 'es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']
  for (const id of ['good', 'fine', 'tired', 'from', 'how_are_you', 'im_good', 'and_you', 'where_from', 'im_from', 'what_about_you', 'im_feeling_pattern', 'im_from_pattern']) {
    const item = SEED_VOCAB_BY_ID[id]
    assert.ok(item, `missing vocab ${id}`)
    assert.ok(['word', 'phrase', 'pattern'].includes(item.kind), `${id} has an odd kind`)
    for (const lang of REQUIRED) assert.ok(item.meaning[lang], `${id} missing ${lang} meaning`)
  }
  ok()
}

// 6) wellbeing: natural answers accepted, feelings never "wrong"
{
  for (const text of ['How are you?', 'How are you doing?', "How're you?", 'And how are you?']) {
    assert.equal(evaluateFree('ask_wellbeing', text).completedObjective, true, `accept ask: ${text}`)
  }
  for (const text of ["I'm good.", "I'm fine.", "I'm okay.", "I'm tired.", 'Good, thanks.', 'Fine, thank you.', 'I am well.']) {
    assert.equal(evaluateFree('answer_wellbeing', text).completedObjective, true, `accept answer: ${text}`)
  }
  // "How you?" is understood but missing the auxiliary — one priority error
  const noAux = evaluateFree('ask_wellbeing', 'How you?')
  assert.equal(noAux.completedObjective, false)
  assert.equal(noAux.errorType, 'missing_auxiliary')
  // a bare feeling is partial evidence, not a failure
  const bare = evaluateFree('answer_wellbeing', 'good')
  assert.equal(bare.completedObjective, false)
  assert.equal(bare.errorType, 'missing_copula')
  assert.ok(bare.naturalVersion)
  ok()
}

// 7) reciprocal question
{
  for (const text of ['And you?', 'What about you?', 'How about you?', 'And yourself?']) {
    assert.equal(evaluateFree('reciprocal_question', text).completedObjective, true, `accept: ${text}`)
  }
  assert.equal(evaluateFree('reciprocal_question', 'yes').completedObjective, false)
  ok()
}

// 8) origin: any place accepted, structure taught, never geographic judgement
{
  for (const text of ["I'm from Colombia.", 'I am from Colombia.', "I'm from Bogotá.", "I'm from Tokyo.", "I'm from the north of Spain."]) {
    assert.equal(evaluateFree('answer_origin', text).completedObjective, true, `accept: ${text}`)
  }
  for (const text of ['Where are you from?', 'And where are you from?', 'What country are you from?']) {
    assert.equal(evaluateFree('ask_origin', text).completedObjective, true, `accept: ${text}`)
  }
  // "Where you from?" — intent recognised, only the auxiliary corrected
  const noAux = evaluateFree('ask_origin', 'Where you from?')
  assert.equal(noAux.completedObjective, false)
  assert.equal(noAux.errorType, 'missing_auxiliary')
  assert.equal(noAux.naturalVersion, 'Where are you from?')
  // a bare place name: understood, asked to produce the full structure
  const bare = evaluateFree('answer_origin', 'Colombia', { place: 'Colombia' })
  assert.equal(bare.completedObjective, false)
  assert.equal(bare.errorType, 'missing_from')
  assert.equal(bare.naturalVersion, "I'm from Colombia.")
  // the model answer follows the learner's OWN place, never a hardcoded country
  assert.equal(evaluateFree('answer_origin', 'x y z', { place: 'Nairobi' }).naturalVersion, "I'm from Nairobi.")
  ok()
}

// 9) episode 6 combined turn
{
  const good = evaluateFree('full_intro_conversation', "Hi, I'm Sam. How are you?", { name: 'Sam' })
  assert.equal(good.completedObjective, true)
  const onlyIntro = evaluateFree('full_intro_conversation', "Hi, I'm Sam.", { name: 'Sam' })
  assert.equal(onlyIntro.completedObjective, false)
  assert.equal(onlyIntro.errorType, 'incomplete_turn')
  ok()
}

// 10) variation is deterministic and no country is hardcoded as the answer
{
  assert.equal(placeFor(partnerFor('Sebastián')), placeFor(partnerFor('Sebastián')))
  assert.ok(PARTNER_PLACE_NAMES.includes(placeFor(partnerFor('Sebastián'))))
  const places = new Set(['Ana', 'Kenji', 'Omar', 'Lucia', 'Sebastián', 'Mei'].map(x => placeFor(partnerFor(x))))
  assert.ok(places.size > 1, 'different learners meet people from different places')
  // no episode text hardcodes a learner country
  for (const ep of ARC) {
    for (const s of ep.steps) {
      for (const str of [s.promptEn, s.sceneEn, s.response, s.target, s.suggestionEn].filter(Boolean)) {
        assert.ok(!/I’m from Colombia|I'm from Colombia/.test(str), `${ep.id} hardcodes a country: ${str}`)
      }
    }
  }
  ok()
}

// 11) placeholders used by the new episodes are all resolvable
{
  const known = new Set(['name', 'partner', 'place', 'partnerPlace'])
  for (const ep of ARC) {
    for (const s of ep.steps) {
      for (const str of [s.promptEn, s.sceneEn, s.response, s.target, s.suggestionEn].filter(Boolean)) {
        for (const m of String(str).matchAll(/\{(\w+)\}/g)) {
          assert.ok(known.has(m[1]), `${ep.id} uses unknown placeholder {${m[1]}}`)
        }
      }
    }
  }
  ok()
}

// 12) the choice step where every feeling is valid marks them all correct
{
  const step = getEpisode('how_are_you').steps.find(s => s.type === 'choice')
  assert.ok(step.allValid)
  assert.ok(step.options.every(o => o.correct === true), 'no feeling may be marked wrong')
  ok()
}

console.log(`check-second-arc — OK  (${n} arc groups verified)`)
