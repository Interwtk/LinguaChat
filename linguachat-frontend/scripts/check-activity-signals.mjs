/*
 * check-activity-signals — the signals themselves.
 *
 * What is being protected here is mostly what must NOT happen: the same moment
 * counted twice, difficulty read as dislike, an interruption read as rejection,
 * an unbounded history in localStorage, and a migration that quietly throws
 * away preferences a learner already earned.
 */
import assert from 'node:assert/strict'
import {
  createLearnerModel, migrateLearnerModel, MODEL_VERSION, SIGNAL_KINDS, SIGNAL_LOG_LIMIT,
  recordActivitySignal, recordActivitySignalOnce, activityPreference, activityScore,
  preferredFormat, formatOverused, sanitizeActivityPreferences, sanitizeSignalLog,
  MIN_SIGNALS_FOR_SCORE, CONFIDENT_PREFERENCE, ACTIVITY_FORMATS,
} from '../src/learning/engine/learnerModel.js'

let n = 0
const ok = () => { n++ }
const show = (m, format, times, id = 'e') => {
  for (let i = 0; i < times; i++) recordActivitySignalOnce(m, `${id}:${i}:shown`, format, 'shown')
}

// 1) the signal vocabulary is exactly what the UI can observe
{
  assert.deepEqual(SIGNAL_KINDS, ['shown', 'completed', 'abandoned', 'assistance', 'retried', 'positive', 'negative_soft'])
  const m = createLearnerModel()
  recordActivitySignal(m, 'roleplay', 'not_a_signal')
  assert.deepEqual(m.activityPreferences, {}, 'an unknown signal must be ignored, not stored')
  recordActivitySignal(m, 'not_a_format', 'shown')
  assert.deepEqual(m.activityPreferences, {}, 'an unknown format must be ignored')
  ok()
}

// 2) idempotency: the same moment, however many times it arrives, counts once
{
  const m = createLearnerModel()
  const id = '2026-07-31:what_you_like:4:shown'
  assert.equal(recordActivitySignalOnce(m, id, 'word_order', 'shown'), true)
  // re-render, StrictMode's second effect, a language switch, a breakpoint
  // change and a reload onto the same step all produce this same id
  for (let i = 0; i < 5; i++) assert.equal(recordActivitySignalOnce(m, id, 'word_order', 'shown'), false)
  assert.equal(m.activityPreferences.word_order.shown, 1)
  ok()
}

// 3) a different step, a different day and a different signal are all new
{
  const m = createLearnerModel()
  recordActivitySignalOnce(m, 'day1:ep:1:shown', 'choice', 'shown')
  recordActivitySignalOnce(m, 'day1:ep:2:shown', 'choice', 'shown')
  recordActivitySignalOnce(m, 'day2:ep:1:shown', 'choice', 'shown')
  recordActivitySignalOnce(m, 'day1:ep:1:completed', 'choice', 'completed')
  assert.equal(m.activityPreferences.choice.shown, 3)
  assert.equal(m.activityPreferences.choice.completed, 1)
  ok()
}

// 4) double tap on completion counts one completion
{
  const m = createLearnerModel()
  for (let i = 0; i < 3; i++) recordActivitySignalOnce(m, 'd:ep:9:completed', 'recall', 'completed')
  assert.equal(m.activityPreferences.recall.completed, 1)
  ok()
}

// 5) the history is bounded — localStorage cannot grow forever
{
  const m = createLearnerModel()
  for (let i = 0; i < SIGNAL_LOG_LIMIT + 60; i++) recordActivitySignalOnce(m, `id-${i}`, 'fill_blank', 'shown')
  assert.equal(m.signalLog.length, SIGNAL_LOG_LIMIT)
  assert.ok(m.signalLog.every(id => typeof id === 'string'), 'only ids are stored, never answers')
  // and the log holds the most recent ids, not the oldest
  assert.ok(m.signalLog.includes(`id-${SIGNAL_LOG_LIMIT + 59}`))
  ok()
}

// 6) difficulty is NOT dislike: help and retries leave the score untouched
{
  const easy = createLearnerModel()
  const hard = createLearnerModel()
  for (const m of [easy, hard]) {
    show(m, 'word_order', 4, 'x')
    for (let i = 0; i < 4; i++) recordActivitySignalOnce(m, `x:${i}:completed`, 'word_order', 'completed')
  }
  for (let i = 0; i < 3; i++) recordActivitySignalOnce(hard, `x:${i}:assistance`, 'word_order', 'assistance')
  for (let i = 0; i < 3; i++) recordActivitySignalOnce(hard, `x:${i}:retried`, 'word_order', 'retried')
  assert.equal(activityScore(easy, 'word_order'), activityScore(hard, 'word_order'),
    'asking for help and trying again must not lower a preference')
  assert.ok(hard.activityPreferences.word_order.assistanceUsed === 3, 'but they ARE observed')
  assert.ok(hard.activityPreferences.word_order.retried === 3)
  ok()
}

// 7) the score starts neutral, moves gradually, and stays inside 0..1
{
  const m = createLearnerModel()
  assert.equal(activityPreference(m, 'roleplay').score, null, 'no evidence, no verdict')
  show(m, 'roleplay', 1, 'r')
  recordActivitySignalOnce(m, 'r:0:abandoned', 'roleplay', 'abandoned')
  assert.equal(activityPreference(m, 'roleplay').score, null, 'one abandonment concludes nothing')
  show(m, 'roleplay', MIN_SIGNALS_FOR_SCORE, 'r2')
  const first = activityPreference(m, 'roleplay')
  assert.ok(first.score !== null && first.score >= 0 && first.score <= 1)
  assert.ok(Math.abs(first.score - 0.5) < 0.35, 'early evidence cannot swing the score to an extreme')
  ok()
}

// 8) a single completion cannot manufacture a strong preference
{
  const m = createLearnerModel()
  show(m, 'mini_story', 3, 's')
  recordActivitySignalOnce(m, 's:0:completed', 'mini_story', 'completed')
  const p = activityPreference(m, 'mini_story')
  assert.ok(p.confidence < CONFIDENT_PREFERENCE, 'three observations are not yet a certainty')
  ok()
}

// 9) confidence grows with observations and is reported honestly
{
  const m = createLearnerModel()
  show(m, 'choice', 8, 'c')
  const p = activityPreference(m, 'choice')
  assert.equal(p.observations, 8)
  assert.equal(p.confidence, 1)
  assert.ok(p.confidence >= CONFIDENT_PREFERENCE)
  const weak = activityPreference(createLearnerModel(), 'choice')
  assert.equal(weak.observations, 0)
  assert.equal(weak.score, null)
  ok()
}

// 10) explicit feedback moves the score, and only in the direction given
{
  const liked = createLearnerModel()
  const disliked = createLearnerModel()
  for (const m of [liked, disliked]) {
    show(m, 'roleplay', 6, 'f')
    for (let i = 0; i < 6; i++) recordActivitySignalOnce(m, `f:${i}:completed`, 'roleplay', 'completed')
  }
  recordActivitySignalOnce(liked, 'f:fb:positive', 'roleplay', 'positive')
  recordActivitySignalOnce(disliked, 'f:fb:negative', 'roleplay', 'negative_soft')
  assert.ok(activityScore(liked, 'roleplay') > activityScore(disliked, 'roleplay'))
  assert.ok(activityScore(disliked, 'roleplay') >= 0)
  ok()
}

// 11) abandonment is only ever what the learner explicitly did
{
  const m = createLearnerModel()
  show(m, 'recall', 4, 'a')
  // a reload, a breakpoint change and a language switch replay the SAME shown id
  for (const id of ['a:0:shown', 'a:1:shown']) {
    assert.equal(recordActivitySignalOnce(m, id, 'recall', 'shown'), false)
  }
  assert.equal(m.activityPreferences.recall.abandoned, 0, 'nothing about a reload is abandonment')
  recordActivitySignalOnce(m, 'a:0:abandoned', 'recall', 'abandoned')
  assert.equal(m.activityPreferences.recall.abandoned, 1)
  ok()
}

// 12) corrupt or hand-edited storage cannot produce a nonsensical score
{
  const dirty = sanitizeActivityPreferences({
    roleplay: { shown: -5, completed: 'x', abandoned: 99999, assistanceUsed: null, retried: NaN, positiveSignals: 3, negativeSignals: -1 },
    made_up_format: { shown: 10 },
    broken: null,
  })
  assert.deepEqual(Object.keys(dirty), ['roleplay'])
  const s = dirty.roleplay
  assert.ok(Object.values(s).every(v => Number.isFinite(v) && v >= 0 && v <= 9999))
  const m = { ...createLearnerModel(), activityPreferences: dirty }
  const score = activityScore(m, 'roleplay')
  assert.ok(score >= 0 && score <= 1, 'score stays in range even from junk')
  assert.deepEqual(sanitizeSignalLog('not an array'), [])
  assert.equal(sanitizeSignalLog(['a', 42, '', 'b']).length, 2)
  ok()
}

// 13) migration v3 -> v4 keeps everything earned and adds the new counters
{
  const v3 = {
    version: 3,
    canDo: { express_preferences: { status: 'can_do', attempts: 4, successes: 3, independentSuccesses: 2, contexts: ['what_you_like'], lastPracticedAt: 'x' } },
    languageItems: { i_like: { status: 'can_do', correct: 3, incorrect: 0, independentCorrect: 2, streak: 2, nextReviewAt: null, lastSeenAt: 'x' } },
    recurringErrors: [{ errorType: 'missing_verb', count: 2 }],
    scaffoldByEpisode: { what_you_like: 'medium' },
    episodes: { what_you_like: { status: 'completed', stepIndex: 11, awarded: true } },
    facts: { place: 'Medellín', likes: 'music' },
    activityPreferences: { roleplay: { shown: 5, completed: 4, abandoned: 0, assistanceUsed: 1, positiveSignals: 1 } },
    recentFormats: ['roleplay', 'recall'],
    recentInterests: ['music'],
  }
  const m = migrateLearnerModel(v3)
  assert.equal(m.version, MODEL_VERSION)
  assert.equal(m.canDo.express_preferences.status, 'can_do', 'earned mastery survives')
  assert.equal(m.episodes.what_you_like.awarded, true, 'no second XP after a migration')
  assert.equal(m.facts.likes, 'music')
  assert.equal(m.activityPreferences.roleplay.shown, 5, 'preferences already earned are kept')
  assert.equal(m.activityPreferences.roleplay.retried, 0, 'and gain the new counters at zero')
  assert.equal(m.activityPreferences.roleplay.negativeSignals, 0)
  assert.deepEqual(m.recentFormats, ['roleplay', 'recall'])
  assert.deepEqual(m.signalLog, [])
  ok()
}

// 14) migration from v2 and from junk still never loses progress / never throws
{
  const v2 = {
    version: 2, canDo: { introduce_self: { status: 'can_do', attempts: 2, successes: 2, independentSuccesses: 1, contexts: [], lastPracticedAt: null } },
    languageItems: {}, recurringErrors: [], scaffoldByEpisode: {},
    episodes: { first_greeting: { status: 'completed', stepIndex: 8, awarded: true } }, facts: {},
  }
  const m2 = migrateLearnerModel(v2)
  assert.equal(m2.version, MODEL_VERSION)
  assert.equal(m2.canDo.introduce_self.status, 'can_do')
  assert.equal(m2.episodes.first_greeting.awarded, true)
  assert.deepEqual(m2.activityPreferences, {})
  for (const junk of [null, undefined, 42, 'x', [], { version: 99 }]) {
    const m = migrateLearnerModel(junk)
    assert.equal(m.version, MODEL_VERSION)
    assert.ok(m.canDo && m.activityPreferences && Array.isArray(m.signalLog))
  }
  ok()
}

// 15) recency is a rolling log WITH duplicates, or repetition is undetectable
{
  const m = createLearnerModel()
  for (let i = 0; i < 4; i++) recordActivitySignalOnce(m, `rep:${i}:shown`, 'roleplay', 'shown')
  assert.equal(m.recentFormats.filter(f => f === 'roleplay').length, 4)
  assert.equal(formatOverused(m, 'roleplay'), true)
  assert.equal(formatOverused(m, 'choice'), false)
  ok()
}

// 16) a weak preference never behaves like a certainty
{
  const weak = createLearnerModel()
  show(weak, 'roleplay', 3, 'w')
  for (let i = 0; i < 3; i++) recordActivitySignalOnce(weak, `w:${i}:completed`, 'roleplay', 'completed')
  // with too little evidence the caller's order stands
  assert.equal(preferredFormat(weak, ['fill_blank', 'roleplay']), 'fill_blank')
  const strong = createLearnerModel()
  show(strong, 'roleplay', 8, 's')
  for (let i = 0; i < 8; i++) recordActivitySignalOnce(strong, `s:${i}:completed`, 'roleplay', 'completed')
  strong.recentFormats = []
  assert.equal(preferredFormat(strong, ['fill_blank', 'roleplay']), 'roleplay')
  ok()
}

/*
 * 17) two components holding their own snapshot must not erase each other.
 *     Reproduced for real: the feedback card recorded "more like this", then the
 *     episode shell saved its older copy on close and the signal vanished.
 */
{
  const store = new Map()
  global.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  }
  const { saveLearnerModel, loadLearnerModel } = await import('../src/learning/engine/learnerModel.js')

  const shellCopy = createLearnerModel()
  show(shellCopy, 'roleplay', 4, 'shell')
  saveLearnerModel(shellCopy)                       // the episode is under way

  const cardCopy = loadLearnerModel()               // the feedback card re-reads
  recordActivitySignalOnce(cardCopy, 'fb:more', 'roleplay', 'positive')
  saveLearnerModel(cardCopy)

  // …and only now does the shell save its own, older snapshot
  recordActivitySignalOnce(shellCopy, 'shell:done', 'roleplay', 'completed')
  saveLearnerModel(shellCopy)

  const final = loadLearnerModel()
  assert.equal(final.activityPreferences.roleplay.positiveSignals, 1, 'the explicit feedback must survive')
  assert.equal(final.activityPreferences.roleplay.completed, 1, 'and so must the completion')
  assert.equal(final.activityPreferences.roleplay.shown, 4, 'without inventing extra showings')
  delete global.localStorage
  ok()
}

// 18) every declared format is usable and none was quietly dropped
{
  for (const f of ACTIVITY_FORMATS) {
    const m = createLearnerModel()
    assert.equal(recordActivitySignalOnce(m, `f:${f}`, f, 'shown'), true, `${f} must be recordable`)
  }
  assert.ok(ACTIVITY_FORMATS.includes('guided_reply'), 'the safe fallback format must exist')
  ok()
}

console.log(`check-activity-signals — OK  (${n} signal groups verified)`)
