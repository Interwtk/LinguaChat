#!/usr/bin/env node
/*
 * check-learner-model — unit-style checks for the learner model, mastery rules,
 * review scheduling, migration and the daily planner. Pure ESM, no test runner.
 */
import { MODEL_VERSION } from '../src/learning/engine/learnerModel.js'
import {
  createLearnerModel, migrateLearnerModel, recordItemAttempt, recordCanDoAttempt,
  scheduleReview, getRecommendedScaffold, getEpisodeState, setEpisodeState, getDueReviews,
} from '../src/learning/engine/learnerModel.js'
import { planDay, isEpisodeUnlocked } from '../src/learning/engine/planner.js'
import { ARC } from '../src/learning/episodes/index.js'

let failures = 0
const check = (label, cond) => { if (!cond) { console.log('  FAIL: ' + label); failures++ } }

/* ---- mastery: no can_do from a single helped success ---- */
let m = createLearnerModel()
recordItemAttempt(m, 'im', { correct: true, independent: false })
check('one helped success is not can_do', m.languageItems.im.status === 'learning')
recordItemAttempt(m, 'im', { correct: true, independent: false })
check('two helped successes still not can_do (no independence)', m.languageItems.im.status === 'learning')
/*
 * Being able to use a piece of language now takes TWO unaided productions, not
 * one. A single success is as easily luck, a half-remembered phrase or a lucky
 * guess as it is ability — and this is the claim the Memory Garden makes to the
 * learner, so it has to be worth making.
 */
recordItemAttempt(m, 'im', { correct: true, independent: true })
check('one independent success is not yet can_do', m.languageItems.im.status === 'learning')
check('...but it counts as practice', m.languageItems.im.learningState === 'practicing')
recordItemAttempt(m, 'im', { correct: true, independent: true })
check('two independent successes -> can_do', m.languageItems.im.status === 'can_do')
check('...and the item can be used', m.languageItems.im.learningState === 'can_use')

/* ---- guided and recognised work never reach can_use on their own ---- */
{
  const guided = createLearnerModel()
  for (let i = 0; i < 6; i++) recordItemAttempt(guided, 'im', { correct: true, independent: false, evidenceKind: 'guided' })
  check('six guided successes stay at practicing', guided.languageItems.im.learningState === 'practicing')
  const seen = createLearnerModel()
  for (let i = 0; i < 6; i++) recordItemAttempt(seen, 'im', { correct: true, independent: false, evidenceKind: 'recognition' })
  check('six recognitions stay at understood', seen.languageItems.im.learningState === 'understood')
}

/* ---- can-do goal ---- */
let m2 = createLearnerModel()
recordCanDoAttempt(m2, 'introduce_self', { success: true, independent: false, context: 'ep1' })
check('canDo one helped success = learning', m2.canDo.introduce_self.status === 'learning')
recordCanDoAttempt(m2, 'introduce_self', { success: true, independent: true, context: 'ep1recall' })
check('canDo two successes incl independent = can_do', m2.canDo.introduce_self.status === 'can_do')

/* ---- review scheduling ---- */
const failSched = scheduleReview({ streak: 3 }, { correct: false, independent: false })
check('fail -> review same day (0 days)', new Date(failSched.nextReviewAt).getTime() - Date.now() < 60000)
const helpedSched = scheduleReview({ streak: 0 }, { correct: true, independent: false })
check('helped success -> ~1 day', Math.round((new Date(helpedSched.nextReviewAt) - Date.now()) / 86400000) === 1)
const days = (sched) => Math.round((new Date(sched.nextReviewAt) - Date.now()) / 86400000)
check('first independent success -> ~2 days', days(scheduleReview({ streak: 0 }, { correct: true, independent: true })) === 2)
check('independent streak -> ~4 days', days(scheduleReview({ streak: 1 }, { correct: true, independent: true })) === 4)
/*
 * The gap has to keep widening. It used to stop at four days, which meant a
 * phrase answered correctly ten times running came back every four days for
 * ever — across a level that tracks scores of items, a queue no learner could
 * empty however many reviews they did.
 */
check('a longer streak earns a longer gap (8)', days(scheduleReview({ streak: 2 }, { correct: true, independent: true })) === 8)
check('and a longer one still (16)', days(scheduleReview({ streak: 3 }, { correct: true, independent: true })) === 16)
check('the ladder caps at a month', days(scheduleReview({ streak: 9 }, { correct: true, independent: true })) === 30)
/*
 * Every activity a review is made of shows the answer somewhere, so "helped"
 * cannot mean "shaky" for language the learner already owns — otherwise owned
 * language could never earn any gap at all.
 */
const ownedSched = scheduleReview({ streak: 2, learningState: 'can_use', independentCorrect: 3 }, { correct: true, independent: false })
check('confirming owned language earns the ladder', days(ownedSched) === 8)
const freshSched = scheduleReview({ streak: 2, learningState: 'understood', independentCorrect: 0 }, { correct: true, independent: false })
check('being helped through new language still means tomorrow', days(freshSched) === 1)

/* ---- scaffolding ---- */
check('two clean successes lower scaffold high->medium', getRecommendedScaffold('high', { cleanSuccessStreak: 2 }) === 'medium')
check('a failure raises scaffold low->medium', getRecommendedScaffold('low', { justFailed: true }) === 'medium')
check('help use does not lower scaffold', getRecommendedScaffold('high', { cleanSuccessStreak: 2, usedHelp: true }) === 'high')

/* ---- migration v1 -> v2 (no data loss) ---- */
const v1 = {
  version: 1,
  canDo: { introduce_self: { status: 'can_do', attempts: 3, successfulAttempts: 2, lastPracticedAt: 'x' } },
  languageItems: { im: { status: 'known', correct: 2, incorrect: 0, nextReviewAt: 't', _streak: 2 } },
  recurringErrors: [], preferredScaffold: 'medium',
}
const migrated = migrateLearnerModel(v1)
check('migrated to current version', migrated.version === MODEL_VERSION)
check('migrated canDo preserved as can_do', migrated.canDo.introduce_self.status === 'can_do')
check('migrated item known -> can_do', migrated.languageItems.im.status === 'can_do')
check('migrated scaffold preserved', migrated.scaffoldByEpisode.first_greeting === 'medium')
check('corrupt input -> fresh model', migrateLearnerModel('not-json-object').version === MODEL_VERSION)

/* ---- episode progress + idempotent award ---- */
let m3 = createLearnerModel()
setEpisodeState(m3, 'first_greeting', { status: 'in_progress', stepIndex: 3 })
check('resume step preserved', getEpisodeState(m3, 'first_greeting').stepIndex === 3)
setEpisodeState(m3, 'first_greeting', { status: 'completed', awarded: true })
check('awarded flag set', getEpisodeState(m3, 'first_greeting').awarded === true)

/* ---- due reviews ---- */
let m4 = createLearnerModel()
m4.languageItems.hi = { status: 'learning', correct: 1, incorrect: 0, independentCorrect: 0, streak: 0, nextReviewAt: new Date(Date.now() - 1000).toISOString(), lastSeenAt: null }
check('overdue item is due', getDueReviews(m4).includes('hi'))

/* ---- planner ---- */
let mp = createLearnerModel()
const plan1 = planDay(mp, ARC)
check('fresh learner -> next_episode ep1', plan1.type === 'next_episode' && plan1.episodeId === 'first_greeting')
check('ep2 locked before ep1', !isEpisodeUnlocked(mp, ARC[1]))
setEpisodeState(mp, 'first_greeting', { status: 'completed', awarded: true })
const plan2 = planDay(mp, ARC)
check('after ep1 -> next_episode ep2', plan2.type === 'next_episode' && plan2.episodeId === 'ask_name')
check('ep2 unlocked after ep1', isEpisodeUnlocked(mp, ARC[1]))
setEpisodeState(mp, 'ask_name', { status: 'in_progress', stepIndex: 2 })
const plan3 = planDay(mp, ARC)
check('in-progress ep2 -> continue_episode', plan3.type === 'continue_episode' && plan3.episodeId === 'ask_name')

console.log(`\ncheck-learner-model — ${failures ? 'FAIL (' + failures + ')' : 'OK'}\n`)
process.exit(failures ? 1 : 0)
