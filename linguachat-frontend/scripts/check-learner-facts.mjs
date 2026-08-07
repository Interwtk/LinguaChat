/*
 * check-learner-facts — the things Lingua remembers, and the restraint around
 * using them.
 *
 * Memory is only worth having if it is welcome. So: short concrete values
 * only, never a corrected mistake, never a whole answer; used occasionally
 * rather than every session; never when the activity is already about it;
 * never when we are not confident; always droppable for one activity without
 * deleting anything; and a neutral example is always an acceptable outcome.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve as resolvePath } from 'node:path'
import {
  createLearnerModel, migrateLearnerModel, MODEL_VERSION, normalizeFactValue,
  sanitizeLearnerFacts, mergeLearnerFacts, FACT_MAX_LENGTH,
} from '../src/learning/engine/learnerModel.js'
import {
  recordLearnerFact, selectLearnerFact, markFactUsed, rotateFactUsage, getFactContext,
  factsOfType, MIN_FACT_CONFIDENCE, FACT_COOLDOWN_MS, MAX_CONSECUTIVE_USES,
} from '../src/learning/engine/learnerFacts.js'
import { getInterestContext } from '../src/learning/engine/interests.js'

const here = dirname(fileURLToPath(import.meta.url))

let n = 0
const ok = () => { n++ }
const AT = new Date('2026-05-20T09:00:00Z').getTime()
const LATER = AT + FACT_COOLDOWN_MS + 1000

// 1) only short, concrete, printable values are ever kept
{
  assert.equal(normalizeFactValue('  music '), 'music')
  assert.equal(normalizeFactValue('pop music'), 'pop music')
  assert.equal(normalizeFactValue(''), null)
  assert.equal(normalizeFactValue('   '), null)
  assert.equal(normalizeFactValue('123'), null, 'a value with no letters is not a topic')
  assert.equal(normalizeFactValue('x'.repeat(FACT_MAX_LENGTH + 1)), null)
  assert.equal(normalizeFactValue('I really like listening to music in the morning'), null,
    'a whole sentence is an answer, not a fact')
  ok()
}

// 2) recording: reinforced, not duplicated; a different answer is ADDED
{
  const m = createLearnerModel()
  recordLearnerFact(m, { type: 'like', value: 'music', sourceEpisodeId: 'what_you_like', atMs: AT })
  const first = factsOfType(m, 'like')[0].confidence
  recordLearnerFact(m, { type: 'like', value: 'Music', atMs: AT })
  assert.equal(factsOfType(m, 'like').length, 1, 'the same thing said twice is one fact')
  assert.ok(factsOfType(m, 'like')[0].confidence > first, 'saying it again makes us surer')

  recordLearnerFact(m, { type: 'like', value: 'movies', atMs: AT })
  assert.equal(factsOfType(m, 'like').length, 2, 'people like more than one thing')
  ok()
}

// 3) a dislike is never stored as a like
{
  const m = createLearnerModel()
  recordLearnerFact(m, { type: 'dislike', value: 'coffee', atMs: AT })
  assert.equal(factsOfType(m, 'like').length, 0, '"I don\'t like coffee" must never become a liking')
  assert.equal(factsOfType(m, 'dislike').length, 1)
  // and a type we do not model is simply refused
  assert.equal(recordLearnerFact(m, { type: 'political_view', value: 'x', atMs: AT }), null)
  assert.equal(recordLearnerFact(m, { type: 'like', value: '', atMs: AT }), null)
  ok()
}

// 4) confidence gates use — a barely-believed fact shapes nothing
{
  const m = createLearnerModel()
  m.learnerFacts = [{ type: 'like', value: 'music', sourceEpisodeId: null, learnedAt: null, lastUsedAt: null, useCount: 0, confidence: MIN_FACT_CONFIDENCE - 0.1 }]
  assert.equal(selectLearnerFact(m, { seed: 's', atMs: AT }), null)
  m.learnerFacts[0].confidence = MIN_FACT_CONFIDENCE
  assert.ok(selectLearnerFact(m, { seed: 's', atMs: AT }))
  ok()
}

// 5) cooldown: not twice in a row, and not again straight afterwards
{
  const m = createLearnerModel()
  recordLearnerFact(m, { type: 'like', value: 'music', atMs: AT })
  const fact = selectLearnerFact(m, { seed: 's', atMs: AT })
  assert.equal(fact.value, 'music')
  markFactUsed(m, fact, AT)
  assert.equal(selectLearnerFact(m, { seed: 's', atMs: AT + 1000 }), null, 'used just now → not again today')
  assert.ok(selectLearnerFact(m, { seed: 's', atMs: LATER }), 'tomorrow it is available again')
  ok()
}

// 6) a fact steps aside after being used a few times
{
  const m = createLearnerModel()
  recordLearnerFact(m, { type: 'like', value: 'music', atMs: AT })
  m.learnerFacts[0].useCount = MAX_CONSECUTIVE_USES
  assert.equal(selectLearnerFact(m, { seed: 's', atMs: LATER }), null, 'one answer must not follow the learner around')
  ok()
}

// 7) using one fact makes the others fresh again
{
  const m = createLearnerModel()
  recordLearnerFact(m, { type: 'like', value: 'music', atMs: AT })
  recordLearnerFact(m, { type: 'like', value: 'movies', atMs: AT })
  m.learnerFacts = m.learnerFacts.map(f => ({ ...f, useCount: MAX_CONSECUTIVE_USES }))
  rotateFactUsage(m, { type: 'like', value: 'music' })
  const moviesTired = factsOfType(m, 'like').find(f => f.value === 'movies')
  assert.equal(moviesTired.useCount, 0, 'once something else was the subject, this one is fair game again')
  ok()
}

// 8) never the thing the activity is already about
{
  const m = createLearnerModel()
  recordLearnerFact(m, { type: 'like', value: 'music', atMs: AT })
  assert.equal(selectLearnerFact(m, { seed: 's', atMs: AT, avoidValue: 'music' }), null,
    'repeating today\'s subject is an echo, not memory')
  ok()
}

// 9) the context ladder: a remembered fact, then the chosen interest, then neutral
{
  const withFact = createLearnerModel()
  recordLearnerFact(withFact, { type: 'like', value: 'movies', atMs: AT })
  const interest = getInterestContext(['music'], 'seed')

  const a = getFactContext(withFact, { interestContext: interest, seed: 's', atMs: AT })
  assert.equal(a.source, 'fact')
  assert.equal(a.value, 'movies')

  const b = getFactContext(createLearnerModel(), { interestContext: interest, seed: 's', atMs: AT })
  assert.equal(b.source, 'interest')
  assert.equal(b.value, interest.targetNoun)

  const c = getFactContext(createLearnerModel(), { interestContext: getInterestContext([], 'seed'), seed: 's', atMs: AT })
  assert.equal(c.source, 'neutral')
  assert.equal(c.value, null, 'with nothing to promise, an everyday situation is a fine answer')

  // "use another topic" always wins, and deletes nothing
  const d = getFactContext(withFact, { interestContext: interest, seed: 's', atMs: AT, optOut: true })
  assert.equal(d.source, 'neutral')
  assert.equal(factsOfType(withFact, 'like').length, 1, 'declining a topic never erases it')
  ok()
}

// 10) the choice is stable for one session and may differ for the next
{
  const m = createLearnerModel()
  recordLearnerFact(m, { type: 'like', value: 'music', atMs: AT })
  recordLearnerFact(m, { type: 'like', value: 'movies', atMs: AT })
  const runs = new Set(Array.from({ length: 12 }, () => selectLearnerFact(m, { seed: 'same-session', atMs: AT })?.value))
  assert.equal(runs.size, 1, 'a reload must not change the subject under the learner')
  ok()
}

// 11) corrupt storage cannot produce a fact, and the list stays bounded
{
  const dirty = sanitizeLearnerFacts([
    { type: 'like', value: 'music', confidence: 12 },
    { type: 'like', value: 'MUSIC' },                      // same fact, other case
    { type: 'nonsense', value: 'x' },
    { type: 'like', value: 'a'.repeat(200) },
    null, 'x', 7,
  ])
  assert.equal(dirty.length, 1)
  assert.ok(dirty[0].confidence <= 1 && dirty[0].confidence >= 0)
  const many = sanitizeLearnerFacts(Array.from({ length: 40 }, (_, i) => ({ type: 'like', value: `thing ${i}` })))
  assert.ok(many.length <= 20, 'the profile must not grow without limit')
  assert.deepEqual(sanitizeLearnerFacts('not an array'), [])
  ok()
}

// 12) two copies of the model merge without losing or double-counting
{
  const mine = [{ type: 'like', value: 'music', sourceEpisodeId: null, learnedAt: 'a', lastUsedAt: null, useCount: 1, confidence: 0.6 }]
  const theirs = [
    { type: 'like', value: 'music', sourceEpisodeId: null, learnedAt: 'a', lastUsedAt: 'z', useCount: 2, confidence: 0.8 },
    { type: 'like', value: 'movies', sourceEpisodeId: null, learnedAt: 'b', lastUsedAt: null, useCount: 0, confidence: 0.6 },
  ]
  const merged = mergeLearnerFacts(mine, theirs)
  assert.equal(merged.length, 2, 'a fact only one copy knew is kept')
  const music = merged.find(f => f.value === 'music')
  assert.equal(music.useCount, 2, 'uses are the larger of the two, never the sum')
  assert.equal(music.confidence, 0.8)
  assert.equal(music.lastUsedAt, 'z')
  ok()
}

// 13) a legacy learner keeps what they said, and nothing sensitive is stored
{
  const m = migrateLearnerModel({
    version: 4, canDo: {}, languageItems: {}, recurringErrors: [], scaffoldByEpisode: {}, episodes: {},
    facts: { likes: 'movies', place: 'Medellín' },
  })
  assert.equal(m.version, MODEL_VERSION)
  assert.equal(m.learnerFacts.length, 1)
  assert.equal(m.learnerFacts[0].type, 'like')
  assert.equal(m.learnerFacts[0].value, 'movies')
  assert.equal(m.facts.place, 'Medellín', 'the loose facts are still there too')
  for (const fact of m.learnerFacts) {
    assert.deepEqual(Object.keys(fact).sort(), ['confidence', 'lastUsedAt', 'learnedAt', 'sourceEpisodeId', 'type', 'useCount', 'value'])
  }
  ok()
}

// 14) a legacy value that was never a real fact does not become one
{
  const m = migrateLearnerModel({
    version: 4, canDo: {}, languageItems: {}, recurringErrors: [], scaffoldByEpisode: {}, episodes: {},
    facts: { likes: 'I like listening to music with my friends every evening' },
  })
  assert.deepEqual(m.learnerFacts, [], 'a whole sentence is not remembered as a topic')
  ok()
}

/*
 * 15) what leaves the device. Free conversation may carry ONE short topic and
 *     nothing else — no history, no scores, no mastery, no activity events.
 */
{
  const api = readFileSync(resolvePath(here, '..', 'src/services/api.js'), 'utf8')
  const context = readFileSync(resolvePath(here, '..', 'src/context/AppContext.jsx'), 'utf8')
  /*
   * Exactly two small things may ride along: one thing the learner mentioned
   * before, and the one topic this conversation is about. Both are short, both
   * are chosen on this device, and the request is assembled from those two
   * names — so anything else would have to be added here, in the open.
   */
  assert.match(api, /remembered_like: rememberedLike/, 'one remembered topic may travel')
  assert.match(api, /\.\.\.\(topicContext \|\| \{\}\)/, 'and the one chosen conversation topic')
  assert.match(api, /optional_context: optionalContext/, 'and nothing is smuggled past that object')
  assert.ok(!/learnerFacts|activityPreferences|episodeRuns|signalLog/.test(api),
    'the api layer must never serialise the learner model')
  /*
   * And the interests themselves stay home. The prompt can only use one topic,
   * so sending twenty told the provider nothing and told it about the learner.
   */
  assert.match(api, /interests: _droppedInterests/, 'the interest list must be stripped before sending')
  assert.match(api, /tutor_preferences: tutorPreferences \? teachingPreferences : null/,
    'what travels is the teaching preferences with the interests removed')
  assert.match(context, /rememberedLike: selectLearnerFact\(/, 'and it goes through the same guarded selection')
  assert.match(context, /topicContext: learnerHasSpoken \? null : providerTopicContext\(conversationTopic\)/,
    'the topic is chosen locally and travels only before the learner has spoken')
  ok()
}

console.log(`check-learner-facts — OK  (${n} memory groups verified)`)
