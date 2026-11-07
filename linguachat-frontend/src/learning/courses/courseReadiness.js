/*
 * Course readiness — may a learner of a course be offered its next level?
 *
 * Same idea as the English readiness (curriculum/readiness.js): a description
 * derived from the learner model, never written back, never a reward. A closed
 * next level stays closed whatever this says; the answer only becomes usable when
 * the owner opens the level.
 *
 * Finishing lessons is not enough. It asks for unaided use of every capability,
 * for most of the language to have survived to a later day, and for little to be
 * lost or overdue. Thresholds are a starting design: no learner has tested them.
 */
import { getDueReviews, getEpisodeState, retentionOfItem } from '../engine/learnerModel.js'
import { belongsToLevel } from './curriculumIdentity.js'
import { courseSkeleton } from './registry.js'

export const COURSE_READINESS_REASONS = Object.freeze({
  LESSONS: 'lessons_incomplete',
  UNAIDED: 'capability_without_unaided_use',
  RETENTION: 'not_retained_on_a_later_day',
  LAPSED: 'too_much_lapsed',
  OVERDUE: 'too_many_overdue_reviews',
})
export const MIN_RETAINED_SHARE = 0.6
export const MAX_LAPSED_SHARE = 0.15
export const MAX_OVERDUE = 5

export function deriveCourseReadiness(model, courseId, levelId, { atMs = Date.now() } = {}) {
  const episodes = courseSkeleton(courseId).filter(e => belongsToLevel(e.id, courseId, levelId))
  const missingLessons = episodes.filter(e => getEpisodeState(model, e.id).status !== 'completed').map(e => e.id)
  const capabilities = [...new Set(episodes.map(e => e.canDoId))]
  const withoutUnaided = capabilities.filter(id => !(model?.canDo?.[id]?.independentSuccesses > 0))
  const items = Object.entries(model?.languageItems || {}).filter(([id]) => belongsToLevel(id, courseId, levelId)).map(([, item]) => item)
  const produced = items.filter(item => retentionOfItem(item) !== 'none')
  const share = (state) => (produced.length ? produced.filter(item => retentionOfItem(item) === state).length / produced.length : 0)
  const overdue = getDueReviews(model, atMs, { courseId }).filter(id => belongsToLevel(id, courseId, levelId)).length

  const reasons = []
  if (!episodes.length || missingLessons.length) reasons.push(COURSE_READINESS_REASONS.LESSONS)
  if (withoutUnaided.length) reasons.push(COURSE_READINESS_REASONS.UNAIDED)
  if (share('retained') < MIN_RETAINED_SHARE) reasons.push(COURSE_READINESS_REASONS.RETENTION)
  if (share('lapsed') > MAX_LAPSED_SHARE) reasons.push(COURSE_READINESS_REASONS.LAPSED)
  if (overdue > MAX_OVERDUE) reasons.push(COURSE_READINESS_REASONS.OVERDUE)
  return { ready: reasons.length === 0, reasons, missingLessons, withoutUnaided, retainedShare: share('retained'), lapsedShare: share('lapsed'), overdue }
}
