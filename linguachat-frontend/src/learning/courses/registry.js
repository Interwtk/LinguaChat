/*
 * Course registry — which language a learner is LEARNING, separate from the
 * language the app speaks to them in.
 *
 * LinguaChat always had one auxiliary language (`user_language`: UI, hints,
 * corrections, meanings) and one target language, English. A course is the
 * pair the learner actually studies:
 *
 *   course `en`  target English, explained in any of the supported user
 *                languages — the original product, every existing id, unchanged
 *   course `es`  target Spanish, explained in English (the only auxiliary
 *                language its copy is written in so far)
 *
 * WHY IDS ARE NAMESPACED INSTEAD OF STORED SEPARATELY
 * Progress, the learner model and the ledger stay ONE store per account. A
 * non-English course prefixes every id it writes (`es:first_hello`,
 * `es:me_llamo`), so the same store holds both courses without either one
 * reading the other's evidence: knowing "I'm" in English says nothing about
 * "me llamo" in Spanish. Ids without a prefix are the English course, which is
 * why nothing stored before courses existed needs to be migrated.
 *
 * XP, streak and the account itself stay account-wide on purpose: they measure
 * the learner's practice, not one language.
 *
 * Later levels of a course add a level segment (`es:a1:…`): see
 * curriculumIdentity.js. Pre-A1's short ids stay exactly as they are.
 *
 * This module is metadata only and stays in the first chunk; each course's
 * content, copy and evaluator arrive with its own lazy chunk.
 */
import { ES_SKELETON, ES_SKELETON_BY_ID, ES_VOCAB_BY_ID, ES_HOME_COPY } from './es/skeleton.js'
import { ES_A1_SKELETON_BY_ID, ES_A1_VOCAB_BY_ID } from './es/a1Skeleton.js'

export const COURSE_SEPARATOR = ':'
export const DEFAULT_COURSE_ID = 'en'

export const COURSES = {
  en: {
    id: 'en',
    targetLanguage: 'en',
    // The English course is explained in every auxiliary language the app supports.
    auxLanguages: null,
  },
  es: {
    id: 'es',
    targetLanguage: 'es',
    /*
     * Honest support: the Spanish course's explanations, hints and corrections
     * exist in English only. A learner whose user_language is anything else is
     * not offered the course rather than given English they did not ask for.
     */
    auxLanguages: ['en'],
    levelId: 'es_pre_a1',
    episodeLevel: 'ES-Pre-A1',
    available: true,
    loadContent: () => import('./es/preA1Content.js'),
    /*
     * Course × level. Each level of a course opens on its own: a closed level is
     * refused before its chunk loads, exactly like a closed English level. Ids of
     * each level: curriculumIdentity.js.
     */
    levels: {
      pre_a1: { levelId: 'es_pre_a1', available: true, loadContent: () => import('./es/preA1Content.js') },
      a1: { levelId: 'es_a1', available: false, loadContent: () => import('./es/a1Content.js') },
    },
  },
}

export const COURSE_IDS = Object.keys(COURSES)
export const isCourseId = (id) => Object.prototype.hasOwnProperty.call(COURSES, id)
export const getCourse = (id) => (isCourseId(id) ? COURSES[id] : null)

const baseOf = (lang) => String((lang && (lang.base || lang.code)) || lang || '').split('-')[0].toLowerCase()

/*
 * May a learner whose auxiliary language is `userLanguage` study `courseId`?
 * Never the course of their own language (an English speaker learning English
 * with English explanations is the historical default and stays allowed; the
 * Spanish course needs an explanation language that is not Spanish).
 */
export function isCourseOffered(courseId, userLanguage) {
  const course = getCourse(courseId)
  if (!course) return false
  if (course.available === false) return false
  if (!course.auxLanguages) return true
  const aux = baseOf(userLanguage)
  return aux !== course.targetLanguage && course.auxLanguages.includes(aux)
}

export const offeredCourses = (userLanguage) => COURSE_IDS.filter(id => isCourseOffered(id, userLanguage))

/* The course an id belongs to: its prefix, or English when it has none. */
export function courseIdOf(id) {
  if (typeof id !== 'string') return DEFAULT_COURSE_ID
  const cut = id.indexOf(COURSE_SEPARATOR)
  if (cut <= 0) return DEFAULT_COURSE_ID
  const prefix = id.slice(0, cut)
  return isCourseId(prefix) ? prefix : DEFAULT_COURSE_ID
}

export const belongsToCourse = (id, courseId) => courseIdOf(id) === (courseId || DEFAULT_COURSE_ID)
export const isCourseEpisodeId = (id) => courseIdOf(id) !== DEFAULT_COURSE_ID
export const courseScopedId = (courseId, localId) => (courseId === DEFAULT_COURSE_ID ? localId : `${courseId}${COURSE_SEPARATOR}${localId}`)

/* Metadata of a non-English course's episodes, in their designed order. */
export function courseSkeleton(courseId) {
  return courseId === 'es' ? ES_SKELETON : []
}

export function courseEpisodeMeta(episodeId) {
  return courseIdOf(episodeId) === 'es' ? (ES_SKELETON_BY_ID[episodeId] || ES_A1_SKELETON_BY_ID[episodeId] || null) : null
}

/* The level of a course an id belongs to: its own segment, or the first level. */
function courseLevelOf(id, course) {
  const parts = String(id).split(COURSE_SEPARATOR)
  const declared = parts.length > 2 ? course.levels?.[parts[1]] : null
  return declared || course.levels?.pre_a1 || course
}

/* A course word for the Garden and the meaning line, or null. */
export function courseVocabItem(itemId) {
  return courseIdOf(itemId) === 'es' ? (ES_VOCAB_BY_ID[itemId] || ES_A1_VOCAB_BY_ID[itemId] || null) : null
}

/*
 * The course's own copy for Home (titles, goals, can-do names), in the
 * learner's auxiliary language. Null when the course has no copy in it, which
 * `isCourseOffered` already prevents from being reachable.
 */
export function courseHomeCopy(courseId, userLanguage) {
  if (courseId !== 'es') return null
  return ES_HOME_COPY[baseOf(userLanguage)] || null
}

/* Refusal reasons share the curriculum resolver's names (episodeContent.js). */
export function courseEpisodeRequest(episodeId) {
  const courseId = courseIdOf(episodeId)
  const course = getCourse(courseId)
  if (!course || courseId === DEFAULT_COURSE_ID) return { ok: false, reason: 'unknown_episode' }
  const level = courseLevelOf(episodeId, course)
  if (course.available === false || level.available === false) return { ok: false, reason: 'level_unavailable', levelId: level.levelId }
  const meta = courseEpisodeMeta(episodeId)
  if (!meta) return { ok: false, reason: 'unknown_episode' }
  return { ok: true, levelId: level.levelId, arcId: meta.arc, episodeId, courseId }
}

export async function loadCourseEpisode(episodeId) {
  const request = courseEpisodeRequest(episodeId)
  if (!request.ok) return { request, episode: null }
  const module = await courseLevelOf(episodeId, getCourse(request.courseId)).loadContent()
  return { request, episode: module.getEpisode(episodeId) }
}
