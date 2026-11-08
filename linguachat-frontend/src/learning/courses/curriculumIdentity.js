/*
 * Curriculum identity — what an id in the learner's record means.
 *
 * Progress has ONE store per account and it stays that way. Every id in it
 * (episode, capability, word, error) already says which course it belongs to,
 * and now it also says which level, without rewriting anything stored:
 *
 *   hola_mundo          English: the id has no prefix; its level comes from the
 *                       curriculum maps, where ids are unique across levels
 *   es:hola             Spanish Pre-A1: the first Spanish level kept the short
 *                       form, and nothing written with it ever changes
 *   es:a1:donde_vives   Spanish A1, and the form of every later level
 *
 * So this module READS. It is a compatible reader, not a migration: old keys are
 * valid forever, there is nothing to convert and nothing to lose. `es:hola` and
 * `es:a1:hola` can never be the same record, and `courseIdOf` keeps working
 * because the course is still the first segment.
 *
 * The explanation language is deliberately NOT part of an id. It says how a
 * lesson is presented, not what the learner did: someone who switches it keeps
 * every result. It is carried beside the id, in `describeCurriculumId`.
 *
 * A level segment is only recognised for a course that declares that level, so
 * no id that happens to contain a colon can invent one.
 *
 * Recurring errors are the one record kept per course and not per level: a gender
 * mistake in A1 is the same habit as in Pre-A1, and the support should follow it.
 */
import { COURSE_SEPARATOR, DEFAULT_COURSE_ID, courseIdOf, getCourse } from './registry.js'
import { levelIdOfEpisodeId } from '../curriculum/levels.js'

export const FIRST_LEVEL = 'pre_a1'

const levelsOf = (courseId) => getCourse(courseId)?.levels || {}

/* { courseId, levelId, localId } for a stored id; levelId null when unknowable. */
export function parseCurriculumId(id) {
  if (typeof id !== 'string' || !id) return null
  const courseId = courseIdOf(id)
  if (courseId === DEFAULT_COURSE_ID) return { courseId, levelId: levelIdOfEpisodeId(id), localId: id }
  const rest = id.slice(courseId.length + COURSE_SEPARATOR.length)
  const cut = rest.indexOf(COURSE_SEPARATOR)
  if (cut > 0 && levelsOf(courseId)[rest.slice(0, cut)]) {
    return { courseId, levelId: rest.slice(0, cut), localId: rest.slice(cut + 1) }
  }
  return { courseId, levelId: FIRST_LEVEL, localId: rest }
}

/* The stored id for a local id at a level. The first level keeps the short form. */
export function curriculumId(courseId, levelId, localId) {
  if (courseId === DEFAULT_COURSE_ID) return localId
  if (!levelsOf(courseId)[levelId]) throw new Error(`unknown level ${levelId} for course ${courseId}`)
  return levelId === FIRST_LEVEL ? `${courseId}${COURSE_SEPARATOR}${localId}` : `${courseId}${COURSE_SEPARATOR}${levelId}${COURSE_SEPARATOR}${localId}`
}

export const belongsToLevel = (id, courseId, levelId) => {
  const parsed = parseCurriculumId(id)
  return Boolean(parsed) && parsed.courseId === courseId && parsed.levelId === levelId
}

/* Everything a record's id implies, plus the language it is being explained in. */
export function describeCurriculumId(id, { auxLanguage = null } = {}) {
  const parsed = parseCurriculumId(id)
  if (!parsed) return null
  const course = getCourse(parsed.courseId)
  return { ...parsed, targetLanguage: course?.targetLanguage || null, auxLanguage, logicalKey: `${parsed.courseId}/${parsed.levelId || 'unknown'}/${parsed.localId}` }
}
