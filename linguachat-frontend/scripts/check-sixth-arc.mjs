/*
 * check-sixth-arc — the last arc of Pre-A1, and the line it must not cross.
 *
 * Two capabilities finish the level: asking what a thing is, and answering with
 * a small quantity. Both are tools rather than topics, and the risks are the
 * obvious ones — an arc that turns into a vocabulary list, numbers that become
 * ten separate skills, plurals invented by adding an "s", and a curriculum that
 * declares a learner ready simply because there is nothing left to play.
 *
 * The last of those is the important one, and it has its own section here: after
 * this arc, "finished" and "ready" must still be two different sentences.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ARC, ARCS, getEpisode, episodesInArc } from '../src/learning/episodes/index.js'
import {
  CAN_DO_INTENT, CAN_DO_INTENTS, CAPABILITY_MAP, PRE_A1_EXIT_CRITERIA, LAST_PRE_A1_CAPABILITY,
  FIRST_A1_CAPABILITY, canDoCoverage, intentsForEpisode, episodesProducing, productiveItemsOf,
  integratedEpisodes, longestExchange, skillPrerequisitesOf, prerequisiteChain, RECEPTIVE_ITEMS,
} from '../src/learning/curriculum/preA1Map.js'
import { THINGS, COUNTABLE_THINGS, thingById, withArticle, countedThing } from '../src/learning/engine/semanticContext.js'
import { TAUGHT_NUMBERS, QUANTITY_FORMS } from '../src/learning/engine/responseEvaluation.js'
import { SEED_VOCAB } from '../src/data/vocabulary.js'
import { derivePreA1Readiness } from '../src/learning/curriculum/readiness.js'
import { createLearnerModel, setEpisodeState, recordCanDoAttempt } from '../src/learning/engine/learnerModel.js'

let n = 0
const ok = () => { n++ }

const THINGS_IDS = ['what_is_this', 'how_many']
const [EP16, EP17] = THINGS_IDS.map(getEpisode)
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')

/* ---- 1) two episodes, one arc, at the end of the road ---- */
{
  assert.deepEqual(ARCS, ['greetings', 'connect', 'choose', 'cafe', 'repair', 'things'])
  assert.deepEqual(episodesInArc('things').map(e => e.id), THINGS_IDS)
  assert.equal(ARC.length, 17, 'seventeen episodes, and not one more')
  assert.deepEqual(EP16.prerequisites, ['we_can_continue'])
  assert.deepEqual(EP17.prerequisites, ['what_is_this'])
  assert.equal(prerequisiteChain('how_many').length, 16, 'the last episode sits behind all sixteen')
  for (const ep of [EP16, EP17]) {
    assert.equal(ep.level, 'Pre-A1')
    assert.equal(ep.arc, 'things')
    assert.ok(ep.titleKey && ep.goalKey && ep.canDoNameKey && ep.durationKey, `${ep.id} missing keys`)
    assert.equal(ep.steps.at(-1).type, 'completion')
  }
  assert.ok(EP16.xp >= 50 && EP16.xp <= 60, `ep16 xp ${EP16.xp}`)
  assert.ok(EP17.xp >= 70 && EP17.xp <= 80, `ep17 xp ${EP17.xp}`)
  assert.equal(EP16.canDoId, 'identify_things')
  assert.equal(EP17.canDoId, 'use_small_numbers')
  ok()
}

/* ---- 2) no episode 18, and no A1 ---- */
{
  assert.equal(ARC.filter(e => e.level !== 'Pre-A1').length, 0, 'no episode may belong to another level')
  assert.equal(ARCS.length, 6, 'six arcs')
  const first = CAPABILITY_MAP.find(c => c.id === FIRST_A1_CAPABILITY)
  assert.ok(first, 'the first A1 capability must still be named')
  assert.equal(first.status, 'defer_a1', 'and still deferred')
  assert.equal(LAST_PRE_A1_CAPABILITY, 'small_numbers_and_quantity')
  assert.equal(ARC.some(e => e.canDoId === 'daily_routines'), false, 'A1 content must not appear')
  ok()
}

/* ---- 3) the arc teaches tools, not a vocabulary list ---- */
{
  const ids = new Set(SEED_VOCAB.map(v => v.id))
  for (const id of ['whats_this', 'its_a_pattern', 'book', 'phone', 'bag', 'numbers_1_10', 'how_many', 'quantity_pattern']) {
    assert.ok(ids.has(id), `${id} is not real vocabulary`)
  }
  const granted = [...new Set([EP16, EP17].flatMap(e => e.gardenItems || []))]
  assert.equal(granted.length, 8, `the arc grants ${granted.length} items: ${granted.join(', ')}`)
  const nouns = granted.filter(id => SEED_VOCAB.find(v => v.id === id)?.kind === 'word')
  assert.ok(nouns.length <= 6, `${nouns.length} nouns is a vocabulary list, not a frame`)
  for (const id of nouns) {
    assert.ok(episodesProducing(id).length > 0, `${id} is in the Garden and never produced`)
  }
  /*
   * The numbers are ONE item. Ten cards would fill a sixth of the Garden with
   * words that are never reviewed on their own, and the capability is answering
   * "How many?", not reciting a list.
   */
  for (const word of TAUGHT_NUMBERS) {
    assert.equal(ids.has(word), false, `"${word}" must not be a Garden item of its own`)
  }
  assert.equal(TAUGHT_NUMBERS.length, 10, 'one to ten is the taught range')
  ok()
}

/* ---- 4) the thing catalogue knows what a sentence needs ---- */
{
  for (const [id, thing] of Object.entries(THINGS)) {
    assert.equal(thing.id, id, `${id} disagrees with its own id`)
    assert.ok(['count', 'mass'].includes(thing.countability), `${id} has no countability`)
    assert.ok(thing.singular && thing.plural, `${id} must know both forms`)
    if (thing.countability === 'count') assert.ok(thing.article, `${id} is countable and has no article`)
  }
  // the plurals are looked up, never built by adding an "s"
  assert.equal(countedThing('sandwich', 2), 'sandwiches')
  assert.equal(countedThing('book', 1), 'book')
  assert.equal(withArticle('apple'), 'an apple')
  assert.equal(withArticle('book'), 'a book')
  // and a mass noun refuses a count rather than inventing one
  assert.equal(countedThing('water', 2), '')
  assert.equal(countedThing('coffee', 3), '')
  assert.ok(!COUNTABLE_THINGS.includes('water'))
  ok()
}

/* ---- 5) every step names a thing the catalogue can build a sentence from ---- */
{
  for (const ep of ARC) {
    for (const step of ep.steps) {
      if (!step.thingId) continue
      const thing = thingById(step.thingId)
      assert.ok(thing, `${ep.id}: unknown thing "${step.thingId}"`)
      if (step.evalKind === 'identify_thing' || step.quantityForm === 'with_object' || step.quantityForm === 'polite_request') {
        assert.equal(thing.countability, 'count',
          `${ep.id}: "${step.thingId}" cannot be counted or given an article — "It's a water." is the sentence this prevents`)
      }
      if (Number.isInteger(step.count)) {
        assert.ok(countedThing(thing.id, step.count), `${ep.id}: no plural for ${step.count} ${thing.id}`)
      }
    }
    // a quantity step must say which shape it is asking for
    for (const step of ep.steps) {
      if (step.evalKind !== 'use_quantity') continue
      assert.ok(QUANTITY_FORMS.includes(step.quantityForm),
        `${ep.id}: a quantity step without a form is graded against the wrong sentence`)
    }
  }
  ok()
}

/* ---- 6) asking and answering are both required, and both practised ---- */
{
  assert.deepEqual(CAN_DO_INTENTS.identify_things, ['ask_what_thing', 'identify_thing'],
    'the capability covers two functions and must say so')
  const items = productiveItemsOf('identify_things')
  assert.ok(items.includes('whats_this'), 'asking must be part of the evidence')
  assert.ok(items.includes('its_a_pattern'), 'and so must answering')
  // open turns exist for both, in the episode that teaches it
  for (const intent of CAN_DO_INTENTS.identify_things) {
    const open = EP16.steps.some(s => s.evalKind === intent && (s.type === 'free_reply' || s.type === 'recall'))
    assert.ok(open, `${intent} is never asked for in an open turn`)
  }
  assert.equal(CAN_DO_INTENT.identify_things, 'identify_thing')
  assert.equal(CAN_DO_INTENT.use_small_numbers, 'use_quantity')
  ok()
}

/* ---- 7) "How many?" is understood, never claimed as something they can say ---- */
{
  assert.ok(RECEPTIVE_ITEMS.includes('how_many'), 'the question is receptive by decision, not by accident')
  assert.deepEqual(episodesProducing('how_many'), [],
    'a receptive item must never be recorded as produced')
  const comprehension = EP17.steps.find(s => s.type === 'comprehension' && s.itemId === 'how_many')
  assert.ok(comprehension, 'and it must be taught by being understood')
  ok()
}

/* ---- 8) the last episode is a conversation, not a numbers drill ---- */
{
  const { turns, intents } = longestExchange('how_many')
  assert.ok(turns >= 6, `episode 17's longest exchange is ${turns} turns`)
  assert.ok(intents >= 4, `and covers ${intents} different things to do`)
  assert.ok(integratedEpisodes().includes('how_many'), 'the closing episode must count as integrated')

  // the capabilities it brings back, each as real production
  for (const [intent, item] of [['repair_request', 'can_you_repeat'], ['close_encounter', 'bye'],
    ['respond_anything_else', 'no_thank_you'], ['identify_thing', 'its_a_pattern']]) {
    assert.ok(intentsForEpisode('how_many').includes(intent), `episode 17 does not reuse ${intent}`)
    assert.ok(episodesProducing(item).includes('how_many'), `${item} is not actually produced in episode 17`)
  }
  ok()
}

/* ---- 9) the two capabilities the level owed are built ---- */
{
  const missing = CAPABILITY_MAP.filter(c => c.status === 'missing_required')
  assert.deepEqual(missing, [], `Pre-A1 still owes: ${missing.map(c => c.id).join(', ')}`)
  const taught = new Set(ARC.map(e => e.canDoId))
  for (const id of PRE_A1_EXIT_CRITERIA.requiredCanDos) {
    assert.ok(taught.has(id), `${id} is required and nothing teaches it`)
  }
  assert.ok(canDoCoverage('identify_things').reusedIn.includes('how_many'),
    'identifying must come back after the episode that taught it')
  // numbers do not, and the map says so rather than calling them covered
  const numbers = CAPABILITY_MAP.find(c => c.covers?.canDo === 'use_small_numbers')
  assert.equal(numbers.status, 'needs_reuse',
    'a capability taught in the final episode and never asked for again is not covered')
  ok()
}

/* ---- 10) the engine does not know these episodes by name ---- */
{
  const files = [
    'src/components/episode/EpisodeShell.jsx',
    'src/components/session/SessionRunner.jsx',
    'src/learning/engine/scaffolding.js',
    'src/learning/engine/session.js',
    'src/learning/engine/responseEvaluation.js',
    'src/learning/engine/hybridEvaluation.js',
    'src/learning/curriculum/readiness.js',
  ]
  for (const f of files) {
    const src = read(f)
    for (const id of THINGS_IDS) {
      assert.ok(!src.includes(`'${id}'`) && !src.includes(`"${id}"`), `${f} names the episode ${id}`)
    }
    assert.ok(!/episodeId\s*[=><]=?\s*1[0-9]/.test(src), `${f} branches on an episode number`)
    assert.ok(!/=== 16|>= 16|=== 17|>= 17/.test(src), `${f} branches on episode 16 or 17`)
  }
  ok()
}

/* ---- 11) finished is not ready, and the code says so out loud ---- */
{
  /*
   * The heart of the sprint. Every required capability is now taught, so the
   * guarantee can no longer come from something being unbuilt — it comes from
   * evidence, and a learner who was helped through all seventeen episodes is
   * still not ready.
   */
  const helped = createLearnerModel()
  for (const ep of ARC) {
    setEpisodeState(helped, ep.id, { status: 'completed', awarded: true })
    recordCanDoAttempt(helped, ep.canDoId, { success: true, independent: false, context: ep.id })
  }
  const verdict = derivePreA1Readiness(helped)
  assert.equal(verdict.curriculumComplete, true)
  assert.equal(verdict.ready, false, 'walking through every episode is not evidence')
  assert.ok(verdict.reasonCodes.length > 0)

  // and completing the last episode changes nothing by itself
  const before = derivePreA1Readiness(helped).ready
  setEpisodeState(helped, 'how_many', { status: 'completed', awarded: true, stepIndex: 99 })
  assert.equal(derivePreA1Readiness(helped).ready, before, 'finishing episode 17 is not a readiness event')
  ok()
}

/* ---- 12) every key the two episodes reference exists everywhere ---- */
{
  const keys = new Set()
  const walk = (o) => {
    if (!o || typeof o !== 'object') return
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && (/Key$/.test(k) || k === 'key')) keys.add(v)
      else if (typeof v === 'object') walk(v)
    }
  }
  for (const ep of [EP16, EP17]) { walk(ep); ep.steps.forEach(walk) }
  // the readiness copy is learner-facing too
  for (const key of ['preA1DoneTitle', 'preA1DoneBody', 'preA1DoneCta', 'preA1ReadyTitle', 'preA1ReadyBody',
    'preA1FocusSkill', 'preA1FocusReviews', 'preA1FocusConversation', 'preA1FocusFinish']) keys.add(key)

  const base = read('src/i18n/translations.js')
  assert.deepEqual([...keys].filter(k => !new RegExp(`^\\s*${k}:`, 'm').test(base)), [],
    'keys referenced by the arc and missing from the base language')
  for (const locale of ['es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']) {
    const src = read(`src/i18n/locales/${locale}.js`)
    assert.deepEqual([...keys].filter(k => !new RegExp(`^\\s*${k}:`, 'm').test(src)), [], `${locale} is missing keys`)
  }
  // and none of it says a number at the learner
  const arcCopy = base.slice(base.indexOf('ep16Title'), base.indexOf('preA1LevelBadge'))
  assert.ok(!/Episode 1[67]|episode 1[67]|\d+%/.test(arcCopy), 'the learner never hears an episode number or a score')
  ok()
}

console.log(`check-sixth-arc — OK  (${n} things-and-quantity groups verified)`)
