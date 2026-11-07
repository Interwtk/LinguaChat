import { teachingHistory, retentionProbes, skillEvidence, evidenceSummary } from './teachingPolicy.js'
import { getDueReviews, retentionOfItem } from './learnerModel.js'
import { belongsToCourse, DEFAULT_COURSE_ID } from '../courses/registry.js'
import { derivePreA1Readiness, readinessFocus } from '../curriculum/readiness.js'

const DAY = 86400000
const HELP_WINDOW_DAYS = 30

/*
 * What the "Tú" screen may honestly say about the learner, derived from the
 * model the engine already keeps. Read-only: nothing is written back.
 *
 * Counts, never percentages. Skills are described by the same evidence
 * summary the teaching policy uses (`insufficient` / `uncertain` /
 * `supported`); speaking and pronunciation stay `not_assessed` because
 * nothing here listens to the learner. "Improved" means a later-day
 * independent success on a capability whose earlier later-day probe failed —
 * not more clicks, not a streak.
 */
export function learnerSummary(model, atMs = Date.now(), { courseId = DEFAULT_COURSE_ID } = {}) {
  // one course at a time: Spanish words are not English words learned
  const items = Object.entries(model?.languageItems || {}).filter(([id]) => belongsToCourse(id, courseId)).map(([, item]) => item)
  const countState = state => items.filter(x => x?.learningState === state).length
  const words = {
    canUse: countState('can_use'),
    practicing: countState('practicing'),
    started: countState('seen') + countState('understood'),
    // on more than one day, unaided; and what was had and then missed
    retained: items.filter(x => retentionOfItem(x) === 'retained').length,
    lapsed: items.filter(x => retentionOfItem(x) === 'lapsed').length,
  }

  let toReview = 0
  try { toReview = model?.languageItems ? getDueReviews(model, atMs, { courseId }).length : 0 } catch { toReview = 0 }

  const history = teachingHistory(model?.teachingHistory).filter(x => x.at <= atMs && belongsToCourse(x.capability, courseId))
  const capabilities = [...new Set(history.map(x => x.capability))]
  const totals = { written: { successes: 0, failures: 0 }, listening: { successes: 0, failures: 0 } }
  let improved = 0
  for (const capability of capabilities) {
    const evidence = skillEvidence(model, capability, atMs)
    for (const skill of ['written', 'listening']) {
      totals[skill].successes += evidence[skill].successes
      totals[skill].failures += evidence[skill].samples - evidence[skill].successes
    }
    const probes = retentionProbes(history.filter(x => x.capability === capability)).map(x => x.probe)
    const firstFailure = probes.findIndex(x => !x.success)
    if (firstFailure >= 0 && probes.slice(firstFailure + 1).some(x => x.success)) improved++
  }
  const skillStatus = ({ successes, failures }) => {
    // evidenceSummary decides how sure we may sound; a narrow band around a
    // low rate is "needs practice", never "holding".
    const summary = evidenceSummary(successes, failures)
    if (summary.status !== 'supported') return summary.status
    return summary.mean >= 0.6 ? 'holding' : 'needs_practice'
  }
  const skills = {
    written: { status: skillStatus(totals.written), successes: totals.written.successes },
    listening: { status: skillStatus(totals.listening), successes: totals.listening.successes },
    speaking: { status: 'not_assessed' },
    pronunciation: { status: 'not_assessed' },
  }

  const since = atMs - HELP_WINDOW_DAYS * DAY
  const recent = history.filter(x => x.at >= since && typeof x.success === 'boolean')
  const help = {
    own: recent.filter(x => x.independent && !x.assisted && !x.retried).length,
    assisted: recent.filter(x => x.assisted || x.retried || !x.independent).length,
  }

  let readiness = null
  // the English Pre-A1 readiness reading describes the English course only
  try { readiness = courseId === DEFAULT_COURSE_ID ? derivePreA1Readiness(model, { atMs }) : null } catch { readiness = null }
  const strengthen = (readiness?.fragileSkills || []).slice(0, 3)
  const notStarted = (readiness?.missingSkills || []).length

  return {
    empty: items.length === 0 && history.length === 0,
    words,
    toReview,
    skills,
    improved,
    help,
    strengthen,
    notStarted,
    focus: readinessFocus(readiness),
  }
}
