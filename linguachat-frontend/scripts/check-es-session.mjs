#!/usr/bin/env node
/*
 * check-es-session — the Spanish course's daily session (learning/courses/courseSession.js).
 *
 * Proves: the plan comes only from Spanish evidence (due `es:` reviews, `es:`
 * recurring errors, the next unlocked Spanish episode); English evidence never
 * produces a Spanish block and Spanish evidence never changes the English
 * session; durations cap the plan; transfer and missions only use completed
 * episodes; every block resolves to a real open step whose own model answer
 * passes the evaluator; a stored session merges and survives a reload; and the
 * same block is not planned twice on one day.
 */
import assert from 'node:assert/strict'
import {
  buildCourseSessionPlan, resolveBlockSteps, getOrCreateCourseSession, advanceCourseSession, retryKindFor, COURSE_MISSIONS,
  saveCourseSession, loadCourseSession, courseSessionKey,
} from '../src/learning/courses/courseSession.js'
import { ES_EPISODES } from '../src/learning/courses/es/preA1Content.js'
import { ES_SKELETON } from '../src/learning/courses/es/skeleton.js'
import { evaluateSpanish } from '../src/learning/courses/es/evaluator.js'
import { createLearnerModel, recordItemAttempt, setEpisodeState, markRecurringError, recordActivitySignalOnce } from '../src/learning/engine/learnerModel.js'
import { buildSessionPlan, dayKeyFor } from '../src/learning/engine/session.js'
import { episodesOfLevel } from '../src/learning/curriculum/levels.js'

let passed = 0
const ok = (cond, msg) => { assert.ok(cond, msg); passed++ }
const DAY = 86400000
const T0 = Date.UTC(2026, 10, 3, 9)
const types = plan => plan.blocks.map(b => b.type)
const resolve = (s) => String(s || '').replace(/\{name\}/g, 'Ana').replace(/\{partner\}/g, 'Sam')

/* A brand-new learner: the session is the first lesson, nothing else. */
{
  const m = createLearnerModel()
  const plan = buildCourseSessionPlan(m, 'es', { atMs: T0 })
  ok(types(plan).join() === 'course_episode,session_completion', 'new learner: just the first lesson')
  ok(plan.blocks[0].payload.episodeId === 'es:hola', '...and it is es:hola')
  ok(plan.courseId === 'es' && plan.id.startsWith('es:'), 'the plan belongs to the course')
}

/* A learner four episodes in, with due reviews and a recurring Spanish error. */
const m = createLearnerModel()
for (const ep of ES_SKELETON.slice(0, 4)) setEpisodeState(m, ep.id, { status: 'completed', awarded: true })
for (const id of ['es:me_llamo', 'es:como_te_llamas', 'es:estoy_bien', 'es:soy_de']) recordItemAttempt(m, id, { correct: true, independent: true, atMs: T0 - 10 * DAY })
markRecurringError(m, 'es:es_ser_estar_feeling'); markRecurringError(m, 'es:es_ser_estar_feeling')
// English evidence that must never surface in Spanish
recordItemAttempt(m, 'im', { correct: true, independent: true, atMs: T0 - 10 * DAY })
for (let i = 0; i < 5; i++) markRecurringError(m, 'missing_copula')

const later = T0
for (const mode of ['quick', 'standard', 'deep']) {
  const plan = buildCourseSessionPlan(m, 'es', { durationMode: mode, atMs: later })
  const max = { quick: 3, standard: 4, deep: 5 }[mode]
  ok(plan.blocks.length <= max, `${mode}: at most ${max} blocks`)
  ok(plan.blocks.at(-1).type === 'session_completion', `${mode}: ends with completion`)
  ok(plan.blocks.every(b => !b.payload?.itemId || b.payload.itemId.startsWith('es:')), `${mode}: only Spanish items`)
  ok(plan.blocks.every(b => !b.payload?.errorType || b.payload.errorType.startsWith('es:')), `${mode}: only Spanish errors`)
  ok(plan.blocks.every(b => !b.payload?.episodeId || b.payload.episodeId.startsWith('es:')), `${mode}: only Spanish episodes`)
}
{
  const plan = buildCourseSessionPlan(m, 'es', { durationMode: 'standard', atMs: later })
  ok(types(plan)[0] === 'course_review', 'a due Spanish item opens the session (warm-up)')
  ok(types(plan).includes('course_episode') && plan.blocks.find(b => b.type === 'course_episode').payload.episodeId === 'es:no_entiendo', 'the next lesson is the next unlocked one')
  ok(types(plan).includes('course_retry') && plan.blocks.find(b => b.type === 'course_retry').payload.evalKind === 'es_answer_wellbeing', 'the recurring ser/estar error gets a targeted retry')
  ok(retryKindFor('missing_copula') === null, 'an English error has no Spanish retry')
}
{
  const deep = buildCourseSessionPlan(m, 'es', { durationMode: 'deep', atMs: later })
  ok(!types(deep).includes('course_mission'), 'no mission before its episodes are completed')
  const done = createLearnerModel()
  for (const ep of ES_SKELETON) setEpisodeState(done, ep.id, { status: 'completed', awarded: true })
  const full = buildCourseSessionPlan(done, 'es', { durationMode: 'deep', atMs: later })
  ok(types(full).includes('course_transfer'), 'a finished learner gets a transfer turn')
  ok(types(full).includes('course_mission'), 'a finished learner gets a mission in a deep session')
  ok(!types(full).includes('course_episode'), 'nothing left to start once the level is done')
}

/* Every block resolves to real steps whose own model answer passes. */
{
  const done = createLearnerModel()
  for (const ep of ES_SKELETON) setEpisodeState(done, ep.id, { status: 'completed', awarded: true })
  for (const ep of ES_SKELETON) for (const id of ep.gardenItems) recordItemAttempt(done, id, { correct: true, independent: true, atMs: T0 - 30 * DAY })
  markRecurringError(done, 'es:es_gender_article'); markRecurringError(done, 'es:es_gender_article')
  let resolved = 0
  for (let day = 0; day < 6; day++) {
    for (const mode of ['standard', 'deep']) {
      const plan = buildCourseSessionPlan(done, 'es', { durationMode: mode, atMs: T0 + day * DAY })
      for (const block of plan.blocks.filter(b => b.type.startsWith('course_') && b.type !== 'course_episode')) {
        const steps = resolveBlockSteps(block, ES_EPISODES, { seed: plan.id })
        ok(steps.length > 0, `${block.id} resolves to a step`)
        for (const ref of steps) {
          const step = ref.step
          ok(['free_reply', 'recall'].includes(step.type) && !step.review, `${block.id}: an open, non-warm-up step`)
          const episode = ES_EPISODES.find(e => e.id === ref.episodeId)
          ok(Boolean(step.suggestionEn || episode.steps.some(st => st.suggestionEn && st.evalKind === step.evalKind)), `${block.id}: an example exists if the learner asks for one`)
          if (step.suggestionEn) {
            const r = evaluateSpanish(step.evalKind, resolve(step.suggestionEn), { name: 'Ana', ...(step.courseContext || {}) })
            ok(r.completedObjective, `${block.id}: its model answer passes`)
          }
          resolved++
        }
        if (block.type === 'course_mission') ok(steps.length >= 3, 'a mission is a short conversation (3+ turns)')
      }
    }
  }
  ok(resolved > 20, `blocks resolved across days (${resolved})`)
}

/* Reviews are spread across lessons, never the same lesson twice in a day. */
{
  const done = createLearnerModel()
  for (const ep of ES_SKELETON) setEpisodeState(done, ep.id, { status: 'completed', awarded: true })
  for (const ep of ES_SKELETON) for (const id of ep.gardenItems) recordItemAttempt(done, id, { correct: true, independent: true, atMs: T0 - 30 * DAY })
  for (const mode of ['standard', 'deep']) {
    const lessons = buildCourseSessionPlan(done, 'es', { durationMode: mode, atMs: T0 }).blocks.filter(b => b.type === 'course_review').map(b => b.payload.episodeId)
    ok(new Set(lessons).size === lessons.length, `${mode}: at most one review per lesson (${lessons.join(', ')})`)
  }
}

/* Same day: a review already done is not planned again. */
{
  const day = dayKeyFor(later)
  const first = buildCourseSessionPlan(m, 'es', { durationMode: 'standard', atMs: later })
  const review = first.blocks.find(b => b.type === 'course_review')
  recordActivitySignalOnce(m, `${day}:session:review:${review.payload.itemId}:completed`, 'recall', 'completed')
  const again = buildCourseSessionPlan(m, 'es', { durationMode: 'standard', atMs: later })
  ok(!again.blocks.some(b => b.id === review.id), 'a review done today is not planned twice')
}

/* Spanish evidence never changes the English session. */
{
  const clean = createLearnerModel()
  const arc = episodesOfLevel('pre_a1')
  const before = JSON.stringify(buildSessionPlan(clean, arc, { atMs: later }).blocks.map(b => b.id))
  for (const ep of ES_SKELETON) setEpisodeState(clean, ep.id, { status: 'completed', awarded: true })
  for (const ep of ES_SKELETON) for (const id of ep.gardenItems) recordItemAttempt(clean, id, { correct: true, independent: true, atMs: T0 - 30 * DAY })
  for (let i = 0; i < 4; i++) markRecurringError(clean, 'es:es_gender_article')
  const after = JSON.stringify(buildSessionPlan(clean, arc, { atMs: later }).blocks.map(b => b.id))
  ok(before === after, 'the English session plan is identical after a full Spanish history')
}

/* Persistence: per-writer copies, merged; a started plan is never rebuilt. */
{
  const mem = new Map()
  const access = { valid: () => true, keys: () => [...mem.keys()], getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, v); return true } }
  const plan = buildCourseSessionPlan(m, 'es', { durationMode: 'standard', atMs: Date.now() })
  const started = saveCourseSession({ ...plan, status: 'active' }, access)
  ok(started && [...mem.keys()].every(k => k.startsWith(courseSessionKey('es'))), 'stored under the course session key only')
  const reloaded = loadCourseSession('es', access)
  ok(reloaded.id === plan.id && reloaded.status === 'active', 'a reload resumes the same plan')
  const advanced = saveCourseSession(advanceCourseSession(reloaded), access)
  ok(advanced.currentBlockIndex === 1, 'advancing is persisted')
  ok(getOrCreateCourseSession(m, 'es', { durationMode: 'deep', stored: advanced }).id === plan.id, 'a started plan is not rebuilt by a duration change')
  ok(loadCourseSession('en', access) === null, 'the Spanish plan is never read as another course')
}
ok(Object.values(COURSE_MISSIONS).flat().every(mi => mi.episodes.every(id => ES_SKELETON.some(e => e.id === id))), 'missions reference real episodes')

console.log(`check-es-session: ${passed} passed, 0 failed`)
