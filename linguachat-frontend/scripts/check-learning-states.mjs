/*
 * check-learning-states — the Memory Garden may not flatten four things into one.
 *
 * Before this, every granted item sat at a fixed mastery of 0.5. A sentence the
 * learner had produced unaided looked exactly like a word they had once heard
 * someone else say, and the Garden's own count of "mastered" was permanently
 * zero because nothing ever moved the number.
 *
 * Four states now carry the difference, and the rules below are the ones worth
 * defending: the ladder only climbs, only unaided open production reaches the
 * top, and needing revision is a separate axis from having learned.
 *
 * It also covers the runtime metadata contract, because the two problems share
 * a cause — a field that looks functional and is read by nothing.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ARC, getEpisode } from '../src/learning/episodes/index.js'
import { SEED_VOCAB_BY_ID } from '../src/data/vocabulary.js'
import {
  createLearnerModel, recordItemAttempt, recordItemSeen, mergeLanguageItems,
  getDueReviews, loadLearnerModel, learningStateOf, canUseItem,
  LEARNING_STATES, LEARNING_STATE_RANK, INDEPENDENT_USES_TO_CAN_USE, MODEL_VERSION,
} from '../src/learning/engine/learnerModel.js'
import { EVIDENCE } from '../src/learning/engine/scaffolding.js'
import {
  RECEPTIVE_ITEMS, INCIDENTAL_ITEMS, targetsOf, reviewsOf, personalisesOf,
  isPersonalised, itemsOf, episodesProducing,
} from '../src/learning/curriculum/preA1Map.js'

let n = 0
const ok = () => { n++ }

/* --------------------------------------------------------------- the ladder */

// 1) the four states, in order, and nothing else
{
  assert.deepEqual(LEARNING_STATES, ['seen', 'understood', 'practicing', 'can_use'])
  for (let i = 1; i < LEARNING_STATES.length; i++) {
    assert.ok(LEARNING_STATE_RANK[LEARNING_STATES[i]] > LEARNING_STATE_RANK[LEARNING_STATES[i - 1]])
  }
  ok()
}

// 2) meeting something is not learning it
{
  const m = createLearnerModel()
  recordItemSeen(m, 'here_you_are')
  assert.equal(learningStateOf(m, 'here_you_are'), 'seen')
  assert.equal(canUseItem(m, 'here_you_are'), false)
  // and it does not enter the review queue on the strength of being granted
  assert.equal(m.languageItems.here_you_are.nextReviewAt, null)
  assert.deepEqual(getDueReviews(m, Date.now() + 365 * 86400000), [])
  ok()
}

// 3) recognition proves understanding and stops there
{
  const m = createLearnerModel()
  for (let i = 0; i < 5; i++) recordItemAttempt(m, 'anything_else', { correct: true, evidenceKind: EVIDENCE.RECOGNITION })
  assert.equal(learningStateOf(m, 'anything_else'), 'understood')
  assert.equal(m.languageItems.anything_else.recognisedCorrect, 5)
  assert.equal(m.languageItems.anything_else.independentCorrect, 0)
  ok()
}

// 4) guided production proves practice and stops there
{
  const m = createLearnerModel()
  for (let i = 0; i < 5; i++) recordItemAttempt(m, 'i_like_pattern', { correct: true, evidenceKind: EVIDENCE.GUIDED })
  assert.equal(learningStateOf(m, 'i_like_pattern'), 'practicing')
  assert.equal(canUseItem(m, 'i_like_pattern'), false, 'filling a gap is not using the language')
  ok()
}

// 5) only unaided open production reaches the top, and only on the second time
{
  const m = createLearnerModel()
  recordItemAttempt(m, 'im', { correct: true, independent: true, evidenceKind: EVIDENCE.OPEN })
  assert.equal(learningStateOf(m, 'im'), 'practicing', 'once could be luck')
  recordItemAttempt(m, 'im', { correct: true, independent: true, evidenceKind: EVIDENCE.OPEN })
  assert.equal(learningStateOf(m, 'im'), 'can_use')
  assert.equal(m.languageItems.im.independentCorrect, INDEPENDENT_USES_TO_CAN_USE)
  // helped open production never counts toward it
  const helped = createLearnerModel()
  for (let i = 0; i < 6; i++) recordItemAttempt(helped, 'im', { correct: true, independent: false, evidenceKind: EVIDENCE.OPEN })
  assert.notEqual(learningStateOf(helped, 'im'), 'can_use')
  ok()
}

// 6) the ladder never descends
{
  const m = createLearnerModel()
  recordItemAttempt(m, 'im', { correct: true, independent: true, evidenceKind: EVIDENCE.OPEN })
  recordItemAttempt(m, 'im', { correct: true, independent: true, evidenceKind: EVIDENCE.OPEN })
  assert.equal(learningStateOf(m, 'im'), 'can_use')
  // a bad day, then a guided turn, then merely being met again
  recordItemAttempt(m, 'im', { correct: false, evidenceKind: EVIDENCE.OPEN })
  assert.equal(learningStateOf(m, 'im'), 'can_use', 'one error does not unlearn a skill')
  recordItemAttempt(m, 'im', { correct: true, evidenceKind: EVIDENCE.GUIDED })
  assert.equal(learningStateOf(m, 'im'), 'can_use')
  recordItemSeen(m, 'im')
  assert.equal(learningStateOf(m, 'im'), 'can_use')
  ok()
}

// 7) needing revision is a different axis from having learned
{
  const m = createLearnerModel()
  recordItemAttempt(m, 'im', { correct: true, independent: true, evidenceKind: EVIDENCE.OPEN })
  recordItemAttempt(m, 'im', { correct: true, independent: true, evidenceKind: EVIDENCE.OPEN })
  const before = m.languageItems.im.nextReviewAt
  recordItemAttempt(m, 'im', { correct: false, evidenceKind: EVIDENCE.OPEN })
  const after = m.languageItems.im
  assert.equal(after.learningState, 'can_use', 'the learning state survives')
  assert.ok(new Date(after.nextReviewAt) <= new Date(before), 'but revision comes sooner')
  assert.equal(after.streak, 0, 'and the streak resets')
  assert.equal(after.incorrect, 1)
  ok()
}

/* ------------------------------------------------------------ persistence --*/

// 8) two copies of the model saving over each other lose nothing
{
  const a = { im: { status: 'can_do', learningState: 'can_use', correct: 4, incorrect: 0, independentCorrect: 2, guidedCorrect: 1, recognisedCorrect: 0, streak: 3, nextReviewAt: '2026-09-01T00:00:00.000Z', lastSeenAt: '2026-08-04T00:00:00.000Z' } }
  const b = {
    im: { status: 'learning', learningState: 'practicing', correct: 1, incorrect: 2, independentCorrect: 0, guidedCorrect: 0, recognisedCorrect: 1, streak: 0, nextReviewAt: '2026-08-05T00:00:00.000Z', lastSeenAt: '2026-08-03T00:00:00.000Z' },
    thank_you: { status: 'learning', learningState: 'understood', correct: 1, incorrect: 0, independentCorrect: 0, guidedCorrect: 0, recognisedCorrect: 1, streak: 1, nextReviewAt: null, lastSeenAt: null },
  }
  const merged = mergeLanguageItems(a, b)
  assert.deepEqual(Object.keys(merged).sort(), ['im', 'thank_you'], 'neither copy loses an item')
  assert.equal(merged.im.learningState, 'can_use', 'the further-along state wins')
  assert.equal(merged.im.independentCorrect, 2, 'counters take the higher value')
  assert.equal(merged.im.incorrect, 2, 'including the mistakes')
  /*
   * The review date follows the newest EVIDENCE, not the earliest date.
   *
   * "Sooner always wins" read well and was wrong on a single device: every save
   * merges against what is already in storage, so an item that had just been
   * reviewed was immediately handed back its old overdue date and could never
   * leave the review queue. Copy `a` practised on the 4th and copy `b` on the
   * 3rd, so `a` holds the current schedule.
   */
  assert.equal(merged.im.nextReviewAt, '2026-09-01T00:00:00.000Z', 'the newest evidence carries the schedule')
  // merging is stable and order-independent
  assert.deepEqual(mergeLanguageItems(b, a), merged)
  assert.deepEqual(mergeLanguageItems(merged, merged), merged)
  ok()
}

// 8b) a reviewed item can leave the queue, and an untouched device keeps its own
{
  /*
   * Found by scheduling a real review of "Can you repeat, please?" in the daily
   * session: the block was answered correctly, the counters moved, and the item
   * stayed due forever.
   */
  const past = '2026-08-01T00:00:00.000Z'
  const stored = { can_you_repeat: { status: 'learning', learningState: 'practicing', correct: 1, incorrect: 0, independentCorrect: 1, guidedCorrect: 0, recognisedCorrect: 0, streak: 1, nextReviewAt: past, lastSeenAt: past } }
  const model = createLearnerModel()
  model.languageItems = JSON.parse(JSON.stringify(stored))
  recordItemAttempt(model, 'can_you_repeat', { correct: true, independent: false, evidenceKind: 'guided' })
  const scheduled = model.languageItems.can_you_repeat.nextReviewAt
  assert.ok(scheduled > past, 'a correct review must schedule the next one later')
  const afterSave = mergeLanguageItems(model.languageItems, stored)
  assert.equal(afterSave.can_you_repeat.nextReviewAt, scheduled,
    'saving must not hand a reviewed item its old due date back')

  // and the original intent still holds: a device that has NOT practised keeps
  // its earlier due date, so nothing escapes revision across two devices
  const sameEvidence = { can_you_repeat: { ...stored.can_you_repeat, nextReviewAt: '2026-12-01T00:00:00.000Z' } }
  assert.equal(mergeLanguageItems(sameEvidence, stored).can_you_repeat.nextReviewAt, past,
    'with equally old evidence, the sooner review still wins')
  ok()
}

// 9) the save path really merges items — not just runs and preferences
{
  const src = readFileSync(new URL('../src/learning/engine/learnerModel.js', import.meta.url), 'utf8')
  assert.match(src, /languageItems: mergeLanguageItems\(model\.languageItems, stored\.languageItems\)/,
    'a concurrent save must not drop the other copy\'s items')
  assert.match(src, /model\.languageItems = merged\.languageItems/,
    'the caller\'s object must stay in step with what was written')
  ok()
}

/* -------------------------------------------------------------- migration --*/

// 10) v5 becomes v6 without inventing or losing anything
{
  const v5 = {
    version: 5,
    canDo: { introduce_self: { status: 'can_do', attempts: 3, successes: 3, independentSuccesses: 2, contexts: ['ep1'], lastPracticedAt: '2026-08-01T00:00:00.000Z' } },
    languageItems: {
      strong: { status: 'can_do', correct: 4, incorrect: 0, independentCorrect: 2, streak: 3, nextReviewAt: '2026-09-01T00:00:00.000Z', lastSeenAt: '2026-08-01T00:00:00.000Z' },
      helped: { status: 'learning', correct: 3, incorrect: 1, independentCorrect: 0, streak: 1, nextReviewAt: '2026-08-06T00:00:00.000Z', lastSeenAt: '2026-08-01T00:00:00.000Z' },
      untouched: { status: 'new', correct: 0, incorrect: 0, independentCorrect: 0, streak: 0, nextReviewAt: null, lastSeenAt: null },
    },
    recurringErrors: [{ errorType: 'no_question', count: 2 }],
    scaffoldByEpisode: { first_greeting: 'low' },
    episodes: { first_greeting: { status: 'completed', stepIndex: 8, awarded: true } },
    facts: { place: 'Bogotá' },
    activityPreferences: {}, recentFormats: [], recentInterests: [], signalLog: ['a:b:c:d'],
    episodeRuns: {}, activeRun: null, learnerFacts: [],
  }
  const stored = JSON.stringify(v5)
  const key = 'lc2-learner-model-v1'
  globalThis.localStorage = {
    _v: { [key]: stored },
    getItem(k) { return this._v[k] ?? null },
    setItem(k, v) { this._v[k] = v },
    removeItem(k) { delete this._v[k] },
  }
  const m = loadLearnerModel()
  assert.equal(m.version, MODEL_VERSION)
  assert.equal(MODEL_VERSION, 7, 'v7 added the level milestones')
  // and a learner arriving from v5 has NOT graduated retroactively
  assert.deepEqual(m.levelMilestones, {},
    'finishing the curriculum long ago is not a graduation; the reconciler earns it from evidence')
  // everything that existed is still there
  assert.equal(m.canDo.introduce_self.status, 'can_do')
  assert.equal(m.canDo.introduce_self.independentSuccesses, 2)
  assert.equal(m.episodes.first_greeting.awarded, true)
  assert.equal(m.episodes.first_greeting.stepIndex, 8)
  assert.equal(m.facts.place, 'Bogotá')
  assert.deepEqual(m.recurringErrors, [{ errorType: 'no_question', count: 2 }])
  assert.equal(m.scaffoldByEpisode.first_greeting, 'low')
  assert.deepEqual(m.signalLog, ['a:b:c:d'])
  assert.deepEqual(Object.keys(m.languageItems).sort(), ['helped', 'strong', 'untouched'])
  // ...and each item gets an honest state from evidence that already existed
  assert.equal(m.languageItems.strong.learningState, 'can_use', 'real independent evidence is not demoted')
  assert.equal(m.languageItems.helped.learningState, 'practicing', 'helped work does not become can_use')
  assert.equal(m.languageItems.untouched.learningState, 'seen', 'no evidence, no claim')
  // review dates survive untouched
  assert.equal(m.languageItems.strong.nextReviewAt, '2026-09-01T00:00:00.000Z')
  delete globalThis.localStorage
  ok()
}

// 11) corrupt storage yields a usable empty model rather than a crash
{
  const key = 'lc2-learner-model-v1'
  for (const junk of ['{', 'null', '[]', '"text"', '{"version":"six"}']) {
    globalThis.localStorage = {
      _v: { [key]: junk },
      getItem(k) { return this._v[k] ?? null }, setItem() {}, removeItem() {},
    }
    const m = loadLearnerModel()
    assert.equal(m.version, MODEL_VERSION)
    assert.deepEqual(m.languageItems, {})
    delete globalThis.localStorage
  }
  ok()
}

/* -------------------------------------------- receptive and incidental -----*/

// 12) language the learner only hears never claims to be usable
{
  for (const id of RECEPTIVE_ITEMS) {
    assert.ok(SEED_VOCAB_BY_ID[id], `${id} must be real vocabulary`)
    assert.deepEqual(episodesProducing(id), [], `${id} is receptive and must never be produced`)
  }
  // and the ladder agrees: being met and recognised is as far as it goes
  const m = createLearnerModel()
  recordItemSeen(m, 'here_you_are')
  recordItemAttempt(m, 'here_you_are', { correct: true, evidenceKind: EVIDENCE.RECOGNITION })
  assert.equal(learningStateOf(m, 'here_you_are'), 'understood')
  assert.equal(canUseItem(m, 'here_you_are'), false)
  ok()
}

// 13) a word carried inside a tracked phrase is not a skill of its own
{
  for (const id of INCIDENTAL_ITEMS) {
    assert.ok(SEED_VOCAB_BY_ID[id], `${id} must be real vocabulary`)
    assert.deepEqual(episodesProducing(id), [], `${id} is incidental and must not be a tracked target`)
  }
  const m = createLearnerModel()
  recordItemSeen(m, 'tired')
  assert.equal(learningStateOf(m, 'tired'), 'seen')
  assert.equal(canUseItem(m, 'tired'), false, '"I\'m tired." is practised; "tired" alone is not')
  ok()
}

// 14) everything the learner really produces can reach the top
{
  const produced = new Set()
  for (const ep of ARC) {
    for (const s of ep.steps) {
      if (s.type === 'free_reply' || s.type === 'recall') (s.itemIds || []).forEach(i => produced.add(i))
    }
  }
  assert.ok(produced.size > 0)
  for (const id of produced) {
    const m = createLearnerModel()
    recordItemAttempt(m, id, { correct: true, independent: true, evidenceKind: EVIDENCE.OPEN })
    recordItemAttempt(m, id, { correct: true, independent: true, evidenceKind: EVIDENCE.OPEN })
    assert.equal(learningStateOf(m, id), 'can_use', `${id} is produced openly and must be able to reach can_use`)
  }
  ok()
}

/* ----------------------------------------------------- the Garden surface --*/

// 15) the Garden shows states, not a made-up number
{
  const garden = readFileSync(new URL('../src/components/memory/MemoryGarden.jsx', import.meta.url), 'utf8')
  assert.equal(/w\.mastery/.test(garden), false, 'the Garden must not read a fabricated mastery number')
  assert.equal(/masteryLevel|masteryColor/.test(garden), false, 'the numeric buckets must be gone')
  assert.match(garden, /learningState/, 'the Garden must read the learner model')
  for (const key of ['gardenStateSeen', 'gardenStatePracticing', 'gardenStateCanUse']) {
    assert.match(garden, new RegExp(key), `${key} must label a group`)
  }
  // the three labels exist in every locale
  const locales = ['../src/i18n/translations.js', '../src/i18n/locales/es.js', '../src/i18n/locales/pt.js',
    '../src/i18n/locales/fr.js', '../src/i18n/locales/it.js', '../src/i18n/locales/de.js',
    '../src/i18n/locales/ja.js', '../src/i18n/locales/ar.js']
  for (const rel of locales) {
    const src = readFileSync(new URL(rel, import.meta.url), 'utf8')
    for (const key of ['gardenStateSeen', 'gardenStatePracticing', 'gardenStateCanUse']) {
      assert.match(src, new RegExp(`\\n  ${key}:`), `${key} missing from ${rel}`)
    }
  }
  ok()
}

// 16) a grant enters the learner model, so the Garden and reviews agree
{
  const ctx = readFileSync(new URL('../src/context/AppContext.jsx', import.meta.url), 'utf8')
  /*
   * The grant enters the learner model at `seen`, which is what the Garden reads
   * and what a review schedule needs. The ids arrive already resolved against the
   * vocabulary by the screen that played the episode — that screen has the
   * catalogue loaded anyway, and the first chunk no longer carries it for this.
   */
  assert.match(ctx, /recordItemSeen\(model, grant\.vocabId\)/, 'granting an item must record that it was met')
  assert.equal(/mastery: 0\.5/.test(ctx), false, 'a fixed mastery number must not be written any more')

  const shell = readFileSync(new URL('../src/components/episode/EpisodeShell.jsx', import.meta.url), 'utf8')
  assert.match(shell, /gardenItems \|\| \[\]\)\s*\n\s*\.filter\(id => SEED_VOCAB_BY_ID\[id\]\)/,
    'and unknown ids must still be dropped where the vocabulary is known')
  assert.match(shell, /awardEpisode\(ep, \{ grants \}\)/, 'the episode hands over what it granted')
  ok()
}

/* --------------------------------------------- runtime metadata contract --*/

// 17) the three inert fields are gone from the episode data
{
  const episodes = readFileSync(new URL('../src/learning/episodes/index.js', import.meta.url), 'utf8')
  for (const field of ['targetItems', 'reviewItems', 'personalized']) {
    assert.equal(new RegExp(`\\n  ${field}:`).test(episodes), false,
      `${field} was declared on every episode and read by nothing`)
  }
  ok()
}

// 18) ...and each is answered from the steps instead
{
  for (const ep of ARC) {
    for (const id of [...targetsOf(ep.id), ...reviewsOf(ep.id), ...itemsOf(ep.id)]) {
      assert.ok(SEED_VOCAB_BY_ID[id], `${ep.id}: derived item ${id} must be real vocabulary`)
    }
    // a target is something this episode grants first, nowhere earlier
    for (const id of targetsOf(ep.id)) {
      const earlier = ARC.slice(0, ARC.indexOf(ep)).some(e => (e.gardenItems || []).includes(id))
      assert.equal(earlier, false, `${ep.id}: ${id} is not new here`)
    }
    // a review is something an actual review step asks for
    for (const id of reviewsOf(ep.id)) {
      const onReviewStep = ep.steps.some(s => s.review && ([...(s.itemIds || []), s.itemId].includes(id)))
      assert.ok(onReviewStep, `${ep.id}: ${id} is not on a review step`)
    }
  }
  // the derivation is not vacuous
  assert.ok(ARC.some(e => reviewsOf(e.id).length > 0), 'some episode must bring something back')
  /*
   * An episode that introduces no new language has to be earning its place some
   * other way — by asking the learner to hold a conversation with what they
   * already have. Exactly three do this today, and they are the arc finales.
   */
  const teachesNothingNew = ARC.filter(e => targetsOf(e.id).length === 0)
  assert.ok(teachesNothingNew.length > 0)
  for (const ep of teachesNothingNew) {
    const openTurns = ep.steps.filter(s => s.type === 'free_reply' || s.type === 'recall').length
    assert.ok(openTurns >= 4,
      `${ep.id} introduces nothing new and only asks for ${openTurns} productions`)
    const aggregates = ep.steps.some(s => /_conversation$/.test(s.evalKind || ''))
    assert.ok(aggregates, `${ep.id} introduces nothing new and does not combine what came before`)
  }
  ok()
}

// 19) personalisation is read from the content, never from a boolean
{
  const personalised = ARC.filter(e => isPersonalised(e.id))
  assert.ok(personalised.length > 0, 'some episodes do personalise')
  assert.ok(personalised.length < ARC.length, 'and some do not')
  for (const ep of ARC) {
    for (const slot of personalisesOf(ep.id)) {
      assert.match(slot, /^(name|partner|place|partnerPlace|noun|object|activity|branchLine|item|otherItem|semantic|fact:[a-z]+)$/,
        `${ep.id}: unexpected personalisation slot ${slot}`)
    }
  }
  // the episode that captures a place says so
  assert.ok(personalisesOf('where_from').includes('fact:place'))
  ok()
}

console.log(`check-learning-states — OK  (${n} state groups verified)`)
