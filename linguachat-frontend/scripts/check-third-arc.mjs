/*
 * check-third-arc — episodes 7-9, interest personalization and activity
 * preferences.
 *
 * The rules being protected: personalization changes the subject matter but
 * never the objective; the interest is fixed for a whole episode and stable
 * across reloads; a learner with no interests still gets a complete episode; and
 * preference only ever influences VARIETY — difficulty is never read as dislike.
 */
import assert from 'node:assert/strict'
import { ARC, getEpisode, episodesInArc, ARCS } from '../src/learning/episodes/index.js'
import { SEED_VOCAB_BY_ID } from '../src/data/vocabulary.js'
import { evaluateFree } from '../src/learning/engine/responseEvaluation.js'
import { isEpisodeUnlocked } from '../src/learning/engine/planner.js'
import {
  createLearnerModel, setEpisodeState, migrateLearnerModel, MODEL_VERSION,
  recordActivitySignal, activityScore, preferredFormat, formatOverused,
  sanitizeActivityPreferences, noteInterestUsed, ACTIVITY_FORMATS, MIN_SIGNALS_FOR_SCORE,
} from '../src/learning/engine/learnerModel.js'
import {
  normalizeInterests, getLearnerInterests, pickInterest, getInterestContext,
  getInterestObject, leastRecentlyUsed, INTEREST_CONTEXTS, NEUTRAL_CONTEXT, KNOWN_INTERESTS,
} from '../src/learning/engine/interests.js'
import { practiceKindForItem, practiceKindForCanDo, practiceKindForError } from '../src/learning/engine/session.js'
import { targetsOf, reviewsOf } from '../src/learning/curriculum/preA1Map.js'

let n = 0
const ok = () => { n++ }
const THIRD = ['what_you_like', 'what_you_want', 'make_a_plan']

// 1) structure: nine episodes in three arcs, the new ones well formed
{
  assert.equal(ARC.length, 15)
  assert.deepEqual(ARCS, ['greetings', 'connect', 'choose', 'cafe', 'repair'])
  assert.deepEqual(episodesInArc('choose').map(e => e.id), THIRD)
  for (const id of THIRD) {
    const ep = getEpisode(id)
    assert.ok(ep.canDoId && ep.titleKey && ep.goalKey && ep.canDoNameKey, `${id} missing keys`)
    assert.ok(ep.xp > 0 && ep.estimatedMinutes > 0)
    assert.ok(ep.steps.length >= 8, `${id} should be a full episode`)
    assert.equal(ep.steps.at(-1).type, 'completion')
  }
  ok()
}

// 2) prerequisites chain arc 2 into arc 3, and unlock in order
{
  assert.deepEqual(getEpisode('what_you_like').prerequisites, ['first_conversation'])
  assert.deepEqual(getEpisode('what_you_want').prerequisites, ['what_you_like'])
  assert.deepEqual(getEpisode('make_a_plan').prerequisites, ['what_you_want'])
  const model = createLearnerModel()
  assert.equal(isEpisodeUnlocked(model, getEpisode('what_you_like')), false, 'locked until arc 2 is done')
  for (const id of ['first_greeting', 'ask_name', 'nice_to_meet', 'how_are_you', 'where_from', 'first_conversation']) {
    setEpisodeState(model, id, { status: 'completed', stepIndex: 0, awarded: true })
  }
  assert.equal(isEpisodeUnlocked(model, getEpisode('what_you_like')), true)
  assert.equal(isEpisodeUnlocked(model, getEpisode('what_you_want')), false)
  ok()
}

// 3) continuity + shape: 7 and 8 open by recovering earlier content, 9 is a scene
{
  for (const id of ['what_you_like', 'what_you_want']) {
    const first = getEpisode(id).steps[0]
    assert.equal(first.type, 'recall', `${id} must open by recovering earlier content`)
    assert.equal(first.review, true)
  }
  const nine = getEpisode('make_a_plan')
  const turns = nine.steps.filter(s => s.type === 'free_reply' || s.type === 'recall').length
  assert.ok(turns >= 6, 'episode 9 should be a conversation, not a deck of cards')
  const kinds = nine.steps.map(s => s.evalKind).filter(Boolean)
  for (const k of ['answer_wellbeing', 'express_like', 'ask_preference', 'accept_offer', 'express_want', 'ask_want']) {
    assert.ok(kinds.includes(k), `episode 9 should reuse ${k}`)
  }
  ok()
}

// 4) every vocabulary id the new episodes reference exists, in all eight languages
{
  const REQUIRED = ['en', 'es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']
  for (const id of THIRD.flatMap(x => {
    const ep = getEpisode(x)
    return [...(ep.gardenItems || []), ...targetsOf(ep.id), ...reviewsOf(ep.id)]
  })) {
    const item = SEED_VOCAB_BY_ID[id]
    assert.ok(item, `unknown vocab item ${id}`)
    assert.ok(['word', 'phrase', 'pattern'].includes(item.kind), `${id} has an odd kind`)
    for (const lang of REQUIRED) assert.ok(item.meaning[lang], `${id} missing ${lang} meaning`)
  }
  ok()
}

/* ---------------- interest personalization ---------------- */

// 5) every catalogue entry is Pre-A1 safe: no brands, no proper nouns, short
{
  for (const [id, ctx] of Object.entries(INTEREST_CONTEXTS)) {
    assert.ok(ctx.targetNoun && ctx.objects?.length === 2 && ctx.activity && ctx.sceneKey, `${id} incomplete`)
    for (const text of [ctx.targetNoun, ...ctx.objects, ctx.activity]) {
      assert.ok(text.split(/\s+/).length <= 4, `${id}: "${text}" is too long for Pre-A1`)
      // a capital letter mid-phrase would suggest a brand or proper noun
      assert.ok(!/[A-Z]/.test(text), `${id}: "${text}" looks like a proper noun or brand`)
    }
  }
  ok()
}

// 6) the interest is STABLE: the same learner and episode always get the same one
{
  const interests = ['music', 'games', 'movies']
  const a = getInterestContext(interests, 'Sebastián:what_you_like')
  const b = getInterestContext(interests, 'Sebastián:what_you_like')
  assert.deepEqual(a, b, 'the same seed must give the same context (survives a reload)')
  assert.equal(getInterestObject(a, 'Sebastián:x'), getInterestObject(a, 'Sebastián:x'))
  ok()
}

// 7) a different episode may use a different interest, so sessions vary
{
  const interests = KNOWN_INTERESTS
  const picks = new Set(THIRD.map(id => pickInterest(interests, `Sebastián:${id}`)))
  assert.ok(picks.size >= 2, 'across episodes the learner should meet more than one interest')
  ok()
}

// 8) no interests → a complete, neutral context (never a prompt to configure)
{
  const ctx = getInterestContext([], 'someone')
  assert.equal(ctx.interestId, null)
  assert.ok(ctx.targetNoun && ctx.activity && ctx.objects.length)
  assert.deepEqual(ctx, { ...NEUTRAL_CONTEXT })
  assert.equal(getInterestContext(undefined, 'x').targetNoun, NEUTRAL_CONTEXT.targetNoun)
  ok()
}

// 9) unknown or malformed interests are dropped, never rendered
{
  assert.deepEqual(normalizeInterests(['music', 'not_a_real_interest', 'music', null, 7]), ['music'])
  assert.deepEqual(normalizeInterests('nonsense'), [])
  const ctx = getInterestContext(['not_a_real_interest'], 'x')
  assert.equal(ctx.interestId, null, 'an unknown interest falls back to neutral')
  ok()
}

// 10) interests are read from the shape onboarding already stores
{
  assert.deepEqual(getLearnerInterests({ interests: ['music', 'games'] }), ['music', 'games'])
  assert.deepEqual(getLearnerInterests(['movies']), ['movies'])
  assert.deepEqual(getLearnerInterests(null), [])
  ok()
}

// 11) rotation prefers an interest not used recently, deterministically
{
  const interests = ['music', 'games', 'movies']
  assert.equal(leastRecentlyUsed(interests, ['music', 'games']), 'movies')
  assert.equal(leastRecentlyUsed(interests, []), 'music')
  assert.equal(leastRecentlyUsed([], ['music']), null)
  ok()
}

// 12) personalization must not change the objective: the same intent is used
//     whatever the interest, and the model answer follows the learner's noun
{
  for (const noun of ['music', 'games', 'food']) {
    const r = evaluateFree('express_like', `I like ${noun}.`, { targetNoun: noun })
    assert.equal(r.completedObjective, true, `"I like ${noun}." must be accepted`)
  }
  const nudge = evaluateFree('express_like', 'music', { targetNoun: 'games' })
  assert.equal(nudge.completedObjective, false)
  assert.equal(nudge.naturalVersion, 'I like games.', 'the model answer uses the active interest')
  ok()
}

/* ---------------- the new intents ---------------- */

// 13) preferences: natural variants accepted, a preference is never "wrong"
{
  for (const t of ['I like music.', 'I really like music.', 'I like games.', 'Music is good. I like it.']) {
    assert.equal(evaluateFree('express_like', t).completedObjective, true, `accept: ${t}`)
  }
  // saying you do NOT like it is still a good sentence for the same step
  assert.equal(evaluateFree('express_like', "I don't like coffee.").completedObjective, true)
  for (const t of ['Music.', 'I music.', 'Like music.']) {
    const r = evaluateFree('express_like', t)
    assert.equal(r.completedObjective, false, `partial: ${t}`)
    assert.ok(r.naturalVersion && r.retryРromptOrExplanation !== null)
  }
  for (const t of ["I don't like coffee.", 'I do not like coffee.', "I don't really like coffee."]) {
    assert.equal(evaluateFree('express_dislike', t).completedObjective, true, `accept dislike: ${t}`)
  }
  ok()
}

// 14) asking about preferences: the auxiliary is the one priority error
{
  for (const t of ['What do you like?', 'Do you like music?', 'What music do you like?']) {
    assert.equal(evaluateFree('ask_preference', t).completedObjective, true, `accept: ${t}`)
  }
  for (const t of ['What you like?', 'You like music?']) {
    const r = evaluateFree('ask_preference', t)
    assert.equal(r.completedObjective, false, `incomplete: ${t}`)
    assert.equal(r.errorType, 'missing_auxiliary')
    assert.equal(r.naturalVersion, 'What do you like?')
  }
  for (const t of ['Yes, I do.', "No, I don't.", 'Yes.', 'No.']) {
    assert.equal(evaluateFree('yes_no_preference', t).completedObjective, true, `accept short: ${t}`)
  }
  ok()
}

// 15) wants and needs: understood requests are accepted, want/need not punished
{
  for (const t of ['I want water.', "I'd like water.", 'I want coffee.']) {
    assert.equal(evaluateFree('express_want', t).completedObjective, true, `accept: ${t}`)
  }
  for (const t of ['I need help.', 'I need water.', 'I need a break.']) {
    assert.equal(evaluateFree('express_need', t).completedObjective, true, `accept: ${t}`)
  }
  // saying "I need" where "I want" was modelled is understood, not an error
  assert.equal(evaluateFree('express_want', 'I need water.').completedObjective, true)
  assert.equal(evaluateFree('express_need', 'I want help.').completedObjective, true)
  // "Water, please." is polite and understood but not the structure being taught
  const polite = evaluateFree('express_want', 'Water, please.')
  assert.equal(polite.completedObjective, false)
  assert.equal(polite.errorType, 'missing_verb')
  ok()
}

// 16) offers: accepting and declining are both correct answers
{
  assert.equal(evaluateFree('ask_want', 'Do you want water?').completedObjective, true)
  assert.equal(evaluateFree('ask_want', 'Would you like coffee?').completedObjective, true)
  for (const t of ['Yes, please.', 'Yes, thank you.', 'Sure.']) {
    assert.equal(evaluateFree('accept_offer', t).completedObjective, true, `accept: ${t}`)
  }
  for (const t of ['No, thank you.', 'No, thanks.', 'Maybe later.']) {
    assert.equal(evaluateFree('decline_offer', t).completedObjective, true, `decline: ${t}`)
  }
  // declining an offer is a valid reply even on the "accept" step
  assert.equal(evaluateFree('accept_offer', 'No, thank you.').completedObjective, true)
  ok()
}

// 17) the plan turn needs both a statement and something that moves it forward
{
  const good = evaluateFree('simple_plan_conversation', 'I like music. Do you want to listen to music?')
  assert.equal(good.completedObjective, true)
  const half = evaluateFree('simple_plan_conversation', 'I like music.')
  assert.equal(half.completedObjective, false)
  assert.equal(half.errorType, 'incomplete_turn')
  ok()
}

// 18) empty and emoji-only replies are handled on every new intent
{
  for (const kind of ['express_like', 'express_dislike', 'ask_preference', 'yes_no_preference',
    'express_want', 'express_need', 'ask_want', 'accept_offer', 'decline_offer', 'simple_plan_conversation']) {
    for (const text of ['', '   ', '😀🎉']) {
      const r = evaluateFree(kind, text)
      assert.equal(r.completedObjective, false, `${kind} must not accept ${JSON.stringify(text)}`)
      assert.equal(r.errorType, 'empty')
      assert.ok(r.retryPrompt, `${kind} must offer a retry prompt`)
    }
  }
  ok()
}

/* ---------------- activity preferences ---------------- */

// 19) v2 -> v3 migration keeps every bit of earned progress
{
  const v2 = {
    version: 2,
    canDo: { introduce_self: { status: 'can_do', attempts: 3, successes: 3, independentSuccesses: 2, contexts: ['a'], lastPracticedAt: 't' } },
    languageItems: { hi: { status: 'can_do', correct: 2, incorrect: 0, independentCorrect: 1, streak: 1, nextReviewAt: null, lastSeenAt: null } },
    recurringErrors: [{ errorType: 'missing_copula', count: 2 }],
    scaffoldByEpisode: { first_greeting: 'low' },
    episodes: { first_greeting: { status: 'completed', stepIndex: 8, awarded: true } },
    facts: { place: 'Bogotá' },
  }
  const m = migrateLearnerModel(v2)
  assert.equal(m.version, MODEL_VERSION)
  assert.equal(m.canDo.introduce_self.status, 'can_do')
  assert.equal(m.episodes.first_greeting.awarded, true)
  assert.equal(m.facts.place, 'Bogotá')
  assert.equal(m.recurringErrors[0].count, 2)
  assert.deepEqual(m.activityPreferences, {}, 'new fields start empty')
  assert.deepEqual(m.recentFormats, [])
  ok()
}

// 20) one abandonment proves nothing — a format needs several observations
{
  const m = createLearnerModel()
  recordActivitySignal(m, 'roleplay', 'shown')
  recordActivitySignal(m, 'roleplay', 'abandoned')
  assert.equal(activityScore(m, 'roleplay'), null, 'a single abandonment must not produce a verdict')
  for (let i = 0; i < MIN_SIGNALS_FOR_SCORE; i++) recordActivitySignal(m, 'roleplay', 'shown')
  assert.notEqual(activityScore(m, 'roleplay'), null, 'enough evidence yields a score')
  ok()
}

// 21) completing and enjoying raises a format; repeated abandonment lowers it
{
  const liked = createLearnerModel()
  for (let i = 0; i < 4; i++) { recordActivitySignal(liked, 'roleplay', 'shown'); recordActivitySignal(liked, 'roleplay', 'completed') }
  recordActivitySignal(liked, 'roleplay', 'positive')
  const disliked = createLearnerModel()
  for (let i = 0; i < 4; i++) { recordActivitySignal(disliked, 'roleplay', 'shown'); recordActivitySignal(disliked, 'roleplay', 'abandoned') }
  assert.ok(activityScore(liked, 'roleplay') > activityScore(disliked, 'roleplay'))
  assert.ok(activityScore(liked, 'roleplay') <= 1 && activityScore(disliked, 'roleplay') >= 0, 'score stays in range')
  ok()
}

// 22) difficulty is NOT dislike: help and errors must not lower a format
{
  const easy = createLearnerModel()
  const hard = createLearnerModel()
  for (let i = 0; i < 4; i++) {
    for (const m of [easy, hard]) { recordActivitySignal(m, 'word_order', 'shown'); recordActivitySignal(m, 'word_order', 'completed') }
    recordActivitySignal(hard, 'word_order', 'assistance')
  }
  assert.equal(activityScore(easy, 'word_order'), activityScore(hard, 'word_order'),
    'needing help says the activity was hard, not that it was disliked')
  ok()
}

// 23) preference only breaks ties between equivalent activities, and variety wins
{
  const m = createLearnerModel()
  for (let i = 0; i < 4; i++) { recordActivitySignal(m, 'roleplay', 'shown'); recordActivitySignal(m, 'roleplay', 'completed') }
  // roleplay is liked, but it was also just used three times in a row
  assert.equal(formatOverused(m, 'roleplay'), true, 'repetition is detected')
  const chosen = preferredFormat(m, ['roleplay', 'fill_blank'])
  assert.ok(ACTIVITY_FORMATS.includes(chosen))
  assert.equal(chosen, 'fill_blank', 'a format used repeatedly gives way to variety')
  // with no evidence at all the caller's own order is respected
  assert.equal(preferredFormat(createLearnerModel(), ['comprehension', 'recall']), 'comprehension')
  assert.equal(preferredFormat(createLearnerModel(), []), null)
  ok()
}

// 24) corrupt or out-of-range preference data can never produce a bad score
{
  const dirty = { roleplay: { shown: -5, completed: 'x', abandoned: 1e9, assistanceUsed: null, positiveSignals: 2 }, not_a_format: { shown: 3 } }
  const clean = sanitizeActivityPreferences(dirty)
  assert.ok(!('not_a_format' in clean), 'unknown formats are dropped')
  for (const value of Object.values(clean.roleplay)) {
    assert.ok(Number.isFinite(value) && value >= 0 && value <= 9999, 'counters are clamped')
  }
  assert.deepEqual(sanitizeActivityPreferences(null), {})
  assert.deepEqual(sanitizeActivityPreferences('nonsense'), {})
  ok()
}

// 25) unknown formats are ignored rather than stored
{
  const m = createLearnerModel()
  recordActivitySignal(m, 'not_a_real_format', 'shown')
  assert.deepEqual(m.activityPreferences, {})
  noteInterestUsed(m, 'music'); noteInterestUsed(m, 'games'); noteInterestUsed(m, 'music')
  assert.deepEqual(m.recentInterests, ['music', 'games'], 'recent interests stay unique and ordered')
  ok()
}

// 26) the session planner can map every new item, can-do and error type
{
  for (const ep of THIRD.map(getEpisode)) {
    for (const id of ep.gardenItems || []) assert.ok(practiceKindForItem(id), `no practice kind for ${id}`)
    assert.ok(practiceKindForCanDo(ep.canDoId), `no practice kind for can-do ${ep.canDoId}`)
  }
  for (const err of ['missing_object', 'missing_verb', 'missing_negation', 'no_preference', 'no_request']) {
    assert.ok(practiceKindForError(err), `no practice kind for error ${err}`)
  }
  ok()
}

console.log(`check-third-arc — OK  (${n} groups verified)`)
