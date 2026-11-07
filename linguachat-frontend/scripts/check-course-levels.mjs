#!/usr/bin/env node
/*
 * check-course-levels — course × level, without a second store or a migration.
 *
 *   A. identity     what every id form means; Pre-A1's short ids untouched
 *   B. gating       a closed level is refused before its chunk loads
 *   C. A1 content   the closed Spanish arc builds, validates, and passes its own models
 *   D. separation   level, course and account never read each other's evidence
 *   E. old data     stored models of every age, and partial ones, read the same
 *   F. recovery     export → import, restart, and two tabs merging keep every record
 *
 * A simulation proves internal consistency; the real-account journeys remain
 * pending (docs/release/2026-11-auth-journeys.md).
 */
import assert from 'node:assert/strict'
import {
  FIRST_LEVEL, belongsToLevel, curriculumId, describeCurriculumId, parseCurriculumId,
} from '../src/learning/courses/curriculumIdentity.js'
import {
  COURSES, belongsToCourse, courseEpisodeMeta, courseEpisodeRequest, courseIdOf, courseScopedId, courseSkeleton, courseVocabItem, isCourseEpisodeId, loadCourseEpisode,
} from '../src/learning/courses/registry.js'
import { COURSE_READINESS_REASONS, deriveCourseReadiness } from '../src/learning/courses/courseReadiness.js'
import { ES_A1_EPISODES, ES_A1_COPY, validateSpanishA1 } from '../src/learning/courses/es/a1Content.js'
import { ES_A1_SKELETON, ES_A1_VOCAB } from '../src/learning/courses/es/a1Skeleton.js'
import { ES_SKELETON, ES_VOCAB } from '../src/learning/courses/es/skeleton.js'
import { evaluateSpanish } from '../src/learning/courses/es/evaluator.js'
import {
  createLearnerModel, getDueReviews, getEpisodeState, markRecurringError, mergeCanDoEvidence, mergeEpisodeState, mergeLanguageItems, migrateLearnerModel, recordCanDoAttempt, recordItemAttempt, setEpisodeState,
} from '../src/learning/engine/learnerModel.js'
import { learnerSummary } from '../src/learning/engine/learnerSummary.js'
import { planDay } from '../src/learning/engine/planner.js'
import { episodeRequest } from '../src/learning/curriculum/episodeContent.js'
import { EXPORT_FORMAT, exportLearnerData } from '../src/services/learnerData.js'

let passed = 0
const failures = []
const check = (name, run) => {
  try { run(); passed++ } catch (error) { failures.push(`${name}: ${String(error.message).split('\n')[0]}`) }
}
const AT = Date.UTC(2026, 10, 7, 9)
const DAY = 86400000

/* ================= A. identity ================= */
check('English ids keep no prefix and read their level from the maps', () => {
  const firstEnglish = 'first_greeting'
  const parsed = parseCurriculumId(firstEnglish)
  assert.equal(parsed.courseId, 'en')
  assert.equal(parsed.localId, firstEnglish)
  assert.equal(parsed.levelId, 'pre_a1')
})
check('a short Spanish id is Pre-A1, forever', () => assert.deepEqual(parseCurriculumId('es:hola'), { courseId: 'es', levelId: 'pre_a1', localId: 'hola' }))
check('the level form is read', () => assert.deepEqual(parseCurriculumId('es:a1:donde_vives'), { courseId: 'es', levelId: 'a1', localId: 'donde_vives' }))
check('an undeclared segment is not a level', () => assert.deepEqual(parseCurriculumId('es:b9:hola'), { courseId: 'es', levelId: 'pre_a1', localId: 'b9:hola' }))
check('the same local id at two levels is two records', () => assert.notEqual(curriculumId('es', 'pre_a1', 'hola'), curriculumId('es', 'a1', 'hola')))
check('writing Pre-A1 ids gives exactly the old ids', () => {
  for (const ep of ES_SKELETON) assert.equal(curriculumId('es', FIRST_LEVEL, ep.id.slice(3)), ep.id)
  assert.equal(curriculumId('es', 'pre_a1', 'hola'), courseScopedId('es', 'hola'))
})
check('an unknown level is refused', () => assert.throws(() => curriculumId('es', 'b1', 'x')))
check('nonsense reads as nothing', () => { for (const id of [null, undefined, '', 7]) assert.equal(parseCurriculumId(id), null) })
check('the course is still the first segment everywhere', () => {
  assert.equal(courseIdOf('es:a1:donde_vives'), 'es')
  assert.ok(belongsToCourse('es:a1:donde_vives', 'es'))
  assert.ok(!belongsToCourse('es:a1:donde_vives', 'en'))
  assert.ok(isCourseEpisodeId('es:a1:donde_vives'))
})
check('explanation language travels beside the id, not in it', () => {
  const a = describeCurriculumId('es:a1:donde_vives', { auxLanguage: 'en' })
  const b = describeCurriculumId('es:a1:donde_vives', { auxLanguage: 'fr' })
  assert.equal(a.logicalKey, 'es/a1/donde_vives')
  assert.equal(a.logicalKey, b.logicalKey)
  assert.equal(a.targetLanguage, 'es')
  assert.equal(a.auxLanguage, 'en')
})
check('capability, word and error ids read like episode ids', () => {
  assert.equal(parseCurriculumId(ES_A1_SKELETON[0].canDoId).levelId, 'a1')
  assert.equal(parseCurriculumId(ES_A1_VOCAB[0].id).levelId, 'a1')
  assert.equal(parseCurriculumId(ES_VOCAB[0].id).levelId, 'pre_a1')
  assert.ok(belongsToLevel('es:a1:talk_about_life', 'es', 'a1'))
  assert.ok(!belongsToLevel('es:introduce_self', 'es', 'a1'))
})
check('no Spanish id of one level is an id of the other', () => {
  const pre = new Set([...ES_SKELETON.map(e => e.id), ...ES_VOCAB.map(v => v.id), ...ES_SKELETON.map(e => e.canDoId)])
  for (const id of [...ES_A1_SKELETON.map(e => e.id), ...ES_A1_VOCAB.map(v => v.id), ...ES_A1_SKELETON.map(e => e.canDoId)]) assert.ok(!pre.has(id), id)
})

/* ================= B. gating ================= */
check('A1 of the Spanish course is closed', () => assert.equal(COURSES.es.levels.a1.available, false))
check('Pre-A1 of the Spanish course stays open', () => assert.equal(COURSES.es.levels.pre_a1.available, true))
check('a closed episode is refused with the level name', () => {
  assert.deepEqual(courseEpisodeRequest('es:a1:trabajo_estudio'), { ok: false, reason: 'level_unavailable', levelId: 'es_a1' })
  assert.equal(episodeRequest({ episodeId: 'es:a1:trabajo_estudio' }).reason, 'level_unavailable')
})
check('an open episode resolves as before', () => assert.deepEqual(courseEpisodeRequest('es:hola'), { ok: true, levelId: 'es_pre_a1', arcId: 'es_hola', episodeId: 'es:hola', courseId: 'es' }))
check('Home and the plan only see the open level', () => {
  assert.equal(courseSkeleton('es').length, 12)
  assert.ok(courseSkeleton('es').every(e => !e.id.startsWith('es:a1:')))
})
check('metadata of closed episodes exists for the Garden and the record', () => {
  assert.equal(courseEpisodeMeta('es:a1:donde_vives').arc, 'es_a1_vida')
  assert.equal(courseVocabItem('es:a1:vivo_en').term, 'vivo en…')
})
{
  let refusedWithoutLoading = false
  const realLoad = COURSES.es.levels.a1.loadContent
  COURSES.es.levels.a1.loadContent = () => { throw new Error('closed content was fetched') }
  const { request, episode } = await loadCourseEpisode('es:a1:trabajo_estudio')
  refusedWithoutLoading = request.ok === false && episode === null
  COURSES.es.levels.a1.loadContent = realLoad
  check('a closed episode is refused before its chunk is fetched', () => assert.ok(refusedWithoutLoading))
}
{
  COURSES.es.levels.a1.available = true
  const { request, episode } = await loadCourseEpisode('es:a1:trabajo_estudio')
  COURSES.es.levels.a1.available = false
  check('opening the flag is the only thing needed: same engine, same player', () => {
    assert.ok(request.ok)
    assert.equal(request.levelId, 'es_a1')
    assert.equal(episode.id, 'es:a1:trabajo_estudio')
    assert.ok(episode.steps.length >= 8)
  })
}

/* ================= C. A1 content ================= */
const problems = validateSpanishA1()
check(`the closed arc validates (${problems.slice(0, 2).join('; ')})`, () => assert.equal(problems.length, 0))
check('three lessons, every one with production, transfer and recall', () => {
  assert.equal(ES_A1_EPISODES.length, 3)
  for (const e of ES_A1_EPISODES) {
    assert.ok(e.steps.some(s => s.type === 'free_reply'), e.id)
    assert.ok(e.steps.some(s => s.variation), e.id)
    assert.ok(e.steps.some(s => s.type === 'recall' && !s.review), e.id)
  }
})
check('item ids of the lessons are A1 ids', () => {
  for (const e of ES_A1_EPISODES) for (const s of e.steps) for (const id of [...(s.items || s.targetItems || []), ...(s.item ? [s.item] : [])]) assert.ok(String(id).startsWith('es:a1:'), `${e.id} ${id}`)
})
check('every suggestion a lesson shows passes its own evaluator', () => {
  for (const e of ES_A1_EPISODES) for (const s of e.steps) {
    if (s.type !== 'free_reply' || !s.evalKind || !s.suggestionEn) continue
    assert.ok(evaluateSpanish(s.evalKind, s.suggestionEn, {}).completedObjective, `${e.id}: ${s.suggestionEn}`)
  }
})
const A1_CASES = [
  ['es_a1_say_life', 'Trabajo en una oficina', true], ['es_a1_say_life', 'estudio español', true], ['es_a1_say_life', 'Soy profesora', true], ['es_a1_say_life', 'Estoy trabajando', true],
  ['es_a1_say_life', 'Yo trabajar en una oficina', 'es_infinitive_verb'], ['es_a1_say_life', 'Yo trabaja', 'es_conjugation_yo'], ['es_a1_say_life', 'Soy trabajo', 'es_ser_plus_verb'], ['es_a1_say_life', 'Soy una profesora', 'es_profession_article'],
  ['es_a1_ask_life', '¿Trabajas?', true], ['es_a1_ask_life', '¿En qué trabajas?', true], ['es_a1_ask_life', '¿A qué te dedicas?', true], ['es_a1_ask_life', '¿Usted trabaja?', true],
  ['es_a1_ask_life', '¿Tú trabajar?', 'es_infinitive_verb'], ['es_a1_ask_life', '¿Trabajo?', 'es_conjugation_tu'],
  ['es_a1_say_live', 'Vivo en Chicago', true], ['es_a1_say_live', 'Sí, vivo aquí', true], ['es_a1_say_live', 'Yo vivir en Lima', 'es_infinitive_verb'], ['es_a1_say_live', 'Estoy vivo en Lima', 'es_estar_vivo'], ['es_a1_say_live', 'Vivo a Lima', 'es_live_preposition'],
  ['es_a1_ask_live', '¿Dónde vives?', true], ['es_a1_ask_live', '¿Y tú dónde vives?', true], ['es_a1_ask_live', '¿Dónde vivir?', 'es_infinitive_verb'], ['es_a1_ask_live', '¿Dónde vivo?', 'es_conjugation_tu'],
]
for (const [kind, text, want] of A1_CASES) {
  check(`${kind}: ${text}`, () => {
    const verdict = evaluateSpanish(kind, text, {})
    if (want === true) assert.ok(verdict.completedObjective, verdict.errorType)
    else assert.equal(verdict.errorType, want)
    if (want !== true) assert.ok(ES_A1_COPY[`es.err.${want}`], `copy for ${want}`)
  })
}
check('what the evaluator cannot read is never a mistake', () => {
  const verdict = evaluateSpanish('es_a1_say_life', 'la vida es un sueño muy largo', {})
  assert.equal(verdict.notEvaluable, true)
  assert.equal(verdict.completedObjective, false)
})

/* ================= D. separation ================= */
const seed = () => {
  const m = createLearnerModel()
  recordItemAttempt(m, 'first_greeting_item', { correct: true, independent: true, atMs: AT })
  recordItemAttempt(m, 'es:me_llamo', { correct: true, independent: true, atMs: AT })
  recordItemAttempt(m, 'es:a1:trabajo', { correct: true, independent: true, atMs: AT })
  setEpisodeState(m, 'es:hola', { status: 'completed' })
  return m
}
check('an A1 result never touches Pre-A1 with the same local name', () => {
  const m = createLearnerModel()
  recordItemAttempt(m, 'es:a1:hola', { correct: true, independent: true, atMs: AT })
  setEpisodeState(m, 'es:a1:hola', { status: 'completed' })
  assert.equal(m.languageItems['es:hola'], undefined)
  assert.notEqual(getEpisodeState(m, 'es:hola').status, 'completed')
})
check('reviews of a course include its levels and exclude the other course', () => {
  const m = seed()
  const later = AT + 40 * DAY
  const spanish = getDueReviews(m, later, { courseId: 'es' })
  assert.ok(spanish.includes('es:me_llamo') && spanish.includes('es:a1:trabajo'))
  assert.ok(!spanish.includes('first_greeting_item'))
  assert.ok(!getDueReviews(m, later, { courseId: 'en' }).some(id => id.startsWith('es:')))
})
check('the English plan does not move when Spanish A1 records exist', () => {
  const clean = createLearnerModel()
  const mixed = seed()
  const arc = courseSkeleton('es')
  assert.deepEqual(planDay(clean, arc, { atMs: AT, courseId: 'es' }).courseId, planDay(createLearnerModel(), arc, { atMs: AT, courseId: 'es' }).courseId)
  assert.ok(learnerSummary(mixed, { atMs: AT, courseId: 'en' }) !== null)
})
check('course change keeps both records', () => {
  const m = seed()
  const before = JSON.stringify(m.languageItems)
  planDay(m, courseSkeleton('es'), { atMs: AT, courseId: 'es' })
  assert.equal(JSON.stringify(m.languageItems), before)
})
check('a recurring error follows the learner across levels of a course, never across courses', () => {
  // EpisodeShell files `<course>:<errorType>`: a gender mistake in A1 is the same habit as in Pre-A1
  const m = createLearnerModel()
  markRecurringError(m, 'es:es_gender_article', AT)
  markRecurringError(m, 'es:es_gender_article', AT + 1)
  markRecurringError(m, 'third_person', AT)
  const spanish = m.recurringErrors.filter(e => belongsToCourse(e.errorType, 'es'))
  assert.equal(spanish.length, 1)
  assert.equal(spanish[0].count, 2)
})

/* ================= D2. readiness ================= */
const finish = (m, days) => {
  for (const ep of courseSkeleton('es')) {
    setEpisodeState(m, ep.id, { status: 'completed' })
    recordCanDoAttempt(m, ep.canDoId, { success: true, independent: true, atMs: AT })
    for (const id of ep.gardenItems) for (let d = 0; d < days; d++) recordItemAttempt(m, id, { correct: true, independent: true, atMs: AT + d * DAY })
  }
  return m
}
check('an empty learner is not ready, and says why', () => {
  const r = deriveCourseReadiness(createLearnerModel(), 'es', 'pre_a1', { atMs: AT })
  assert.equal(r.ready, false)
  assert.equal(r.missingLessons.length, 12)
  assert.ok(r.reasons.includes(COURSE_READINESS_REASONS.LESSONS))
})
check('finishing everything in one sitting is not ready: nothing survived to a later day', () => {
  const r = deriveCourseReadiness(finish(createLearnerModel(), 1), 'es', 'pre_a1', { atMs: AT })
  assert.equal(r.ready, false)
  assert.deepEqual(r.reasons, [COURSE_READINESS_REASONS.RETENTION])
})
check('unaided use on two days, kept up, is ready', () => {
  const r = deriveCourseReadiness(finish(createLearnerModel(), 2), 'es', 'pre_a1', { atMs: AT + DAY })
  assert.deepEqual(r.reasons, [])
  assert.equal(r.ready, true)
})
check('much forgotten is not ready', () => {
  const m = finish(createLearnerModel(), 2)
  const ids = Object.keys(m.languageItems)
  for (const id of ids.slice(0, Math.ceil(ids.length / 2))) recordItemAttempt(m, id, { correct: false, atMs: AT + 10 * DAY })
  assert.ok(deriveCourseReadiness(m, 'es', 'pre_a1', { atMs: AT + 10 * DAY }).reasons.includes(COURSE_READINESS_REASONS.LAPSED))
})
check('readiness opens nothing: the next level stays closed', () => {
  deriveCourseReadiness(finish(createLearnerModel(), 2), 'es', 'pre_a1', { atMs: AT + DAY })
  assert.equal(courseEpisodeRequest('es:a1:trabajo_estudio').reason, 'level_unavailable')
})

/* ================= E. old data ================= */
const legacy = () => ({
  version: 3, languageItems: { 'first_greeting_item': { status: 'practicing', attempts: 3, nextReviewAt: AT }, 'es:me_llamo': { status: 'practicing', attempts: 2, nextReviewAt: AT } },
  episodes: { 'es:hola': { status: 'completed' } }, canDo: { 'es:introduce_self': { attempts: 1 } }, recurringErrors: [{ errorType: 'es:es_llamo_es', count: 2 }],
})
check('a stored model of an older version keeps every old key', () => {
  const m = migrateLearnerModel(legacy())
  assert.ok(m.languageItems['first_greeting_item'] && m.languageItems['es:me_llamo'])
  assert.equal(getEpisodeState(m, 'es:hola').status, 'completed')
  assert.ok(Object.keys(m.languageItems).every(id => !id.includes('pre_a1')))
})
check('reading identity changes nothing stored', () => {
  const m = migrateLearnerModel(legacy())
  const before = JSON.stringify(m)
  for (const id of Object.keys(m.languageItems)) parseCurriculumId(id)
  assert.equal(JSON.stringify(m), before)
})
check('partial and damaged data read without inventing anything', () => {
  for (const raw of [{}, { languageItems: null }, { languageItems: {}, episodes: 'x' }, { version: 99 }]) {
    const m = migrateLearnerModel(raw)
    assert.ok(m && typeof m.languageItems === 'object')
    assert.equal(getEpisodeState(m, 'es:a1:hola').status, getEpisodeState(createLearnerModel(), 'es:a1:hola').status)
  }
})

/* ================= F. recovery ================= */
const store = (values) => {
  const data = new Map(Object.entries(values))
  return { valid: () => true, keys: () => data.keys(), getItem: k => data.get(k) ?? null }
}
check('export carries both levels under their own ids, and a restart reads them back', () => {
  const m = seed()
  const out = exportLearnerData(store({ 'lc2-learner-model': JSON.stringify(m) }), { now: AT })
  assert.equal(out.format, EXPORT_FORMAT)
  const restored = migrateLearnerModel(JSON.parse(JSON.stringify(out.data['lc2-learner-model'])))
  for (const id of ['first_greeting_item', 'es:me_llamo', 'es:a1:trabajo']) assert.ok(restored.languageItems[id], id)
  assert.equal(getEpisodeState(restored, 'es:hola').status, 'completed')
})
check('two tabs writing different levels keep both', () => {
  const a = createLearnerModel()
  const b = createLearnerModel()
  recordItemAttempt(a, 'es:hola_item', { correct: true, independent: true, atMs: AT })
  recordItemAttempt(b, 'es:a1:trabajo', { correct: true, independent: true, atMs: AT })
  const merged = mergeLanguageItems(a.languageItems, b.languageItems)
  assert.ok(merged['es:hola_item'] && merged['es:a1:trabajo'])
})
check('conflict on one record never moves it to the other level', () => {
  const a = createLearnerModel()
  const b = createLearnerModel()
  recordCanDoAttempt(a, 'es:talk_about_life', { success: true, independent: true, atMs: AT })
  recordCanDoAttempt(b, 'es:a1:talk_about_life', { success: true, independent: true, atMs: AT + 1 })
  const merged = mergeCanDoEvidence(a.canDo, b.canDo)
  assert.ok(merged['es:talk_about_life'] && merged['es:a1:talk_about_life'])
  const episodes = mergeEpisodeState({ 'es:hola': { status: 'completed' } }, { 'es:hola': { status: 'in_progress' }, 'es:a1:hola': { status: 'in_progress' } })
  assert.equal(episodes['es:hola'].status, 'completed')
  assert.equal(episodes['es:a1:hola'].status, 'in_progress')
})
check('two accounts share nothing: each model holds only its own ids', () => {
  const accountA = createLearnerModel()
  const accountB = createLearnerModel()
  recordItemAttempt(accountA, 'es:a1:trabajo', { correct: true, independent: true, atMs: AT })
  assert.deepEqual(Object.keys(accountB.languageItems), [])
})

if (failures.length) {
  console.error(`check-course-levels: ${passed} passed, ${failures.length} FAILED`)
  for (const f of failures) console.error('  FAIL ' + f)
  process.exit(1)
}
console.log(`check-course-levels: ${passed} passed, 0 failed (simulated stores; real accounts pending)`)
