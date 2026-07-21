#!/usr/bin/env node
/*
 * check-learner-model — unit-style checks for the learner model, mastery rules,
 * review scheduling, migration and the daily planner. Pure ESM, no test runner.
 */
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
recordItemAttempt(m, 'im', { correct: true, independent: true })
check('independent + >=2 correct -> can_do', m.languageItems.im.status === 'can_do')

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
const indepSched = scheduleReview({ streak: 2 }, { correct: true, independent: true })
check('independent streak -> ~4 days', Math.round((new Date(indepSched.nextReviewAt) - Date.now()) / 86400000) === 4)

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
check('migrated version = 2', migrated.version === 2)
check('migrated canDo preserved as can_do', migrated.canDo.introduce_self.status === 'can_do')
check('migrated item known -> can_do', migrated.languageItems.im.status === 'can_do')
check('migrated scaffold preserved', migrated.scaffoldByEpisode.first_greeting === 'medium')
check('corrupt input -> fresh model', migrateLearnerModel('not-json-object').version === 2)

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
