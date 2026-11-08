/*
 * Which course the learner is studying right now (see learning/courses/registry.js).
 *
 * One `lc2-` key, so it lives in the account's namespace and moves with the
 * account like every other learner key: a second account on the same browser
 * starts on its own choice. A stored value that is unknown, or a course the
 * learner's current user_language cannot be taught in, reads as English —
 * the course every existing learner was already on.
 */
import { learnerStorage as localStorage } from '../auth/localLease.js'
import { DEFAULT_COURSE_ID, isCourseId, isCourseOffered } from '../learning/courses/registry.js'

export const ACTIVE_COURSE_KEY = 'lc2-active-course'

export function readActiveCourse(userLanguage, storage = localStorage) {
  let stored = null
  try { stored = storage.getItem(ACTIVE_COURSE_KEY) } catch { stored = null }
  return isCourseId(stored) && isCourseOffered(stored, userLanguage) ? stored : DEFAULT_COURSE_ID
}

/* Durable before it is reported: written, read back, and only then true. */
export function writeActiveCourse(access, courseId) {
  if (!isCourseId(courseId) || !access?.valid?.()) return false
  try {
    if (access.setItem(ACTIVE_COURSE_KEY, courseId) === false) return false
    return access.valid() && access.getItem(ACTIVE_COURSE_KEY) === courseId
  } catch {
    return false
  }
}
