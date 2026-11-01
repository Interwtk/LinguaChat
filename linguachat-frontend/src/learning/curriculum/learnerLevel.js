/*
 * learnerLevel — the five different things "level" means, kept apart (P5).
 *
 * Until P5 every screen asked `playableLevelId()`: the FIRST level the product
 * has open, the same for everyone. That is right while one level is open and
 * wrong the day a second one opens: a learner who graduated would keep seeing
 * the first level. So the question is now asked about the learner:
 *
 *   placement   what the placement quiz estimated (a CEFR band). Informational:
 *               it opens nothing, skips nothing, and is never trusted as level.
 *   available   what the product teaches at all (levels.js, `available: true`).
 *   working     the curriculum level this learner is working in now: the first
 *               AVAILABLE level they have not completed — or, when they have
 *               completed every available level, the last of them (they keep
 *               consolidating it).
 *   completed   levels with a VALID milestone (graduation.js), in order. A
 *               milestone whose earlier levels are not completed is contradictory
 *               and is not counted; it is reported, never repaired by guessing.
 *   next        the level after the highest completed one, and whether it is
 *               open. A closed next level is shown as closed, never offered.
 *
 * Derived on every call, never stored: there is nothing to migrate, nothing a
 * learner (or a corrupted profile) can write to skip content, and an account
 * switch or a restored backup simply derives from that account's own model.
 * The episode gate (episodeContent.episodeRequest → level_unavailable) still
 * refuses a closed level whatever this module says.
 */
import { LEVELS, availableLevelIds, isKnownLevel } from './levels.js'
import { sanitizeLevelMilestones } from '../engine/learnerModel.js'
import { preA1Status } from './graduation.js'

const ORDER = LEVELS.map(level => level.id)
const PLACEMENT_BANDS = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])

/*
 * @param model      the learner model of the ACTIVE account
 * @param placement  profile.placementResult, if any — informational only
 * @param available  the open levels; ONLY isolated tests pass this (two-level bench)
 */
export function deriveLearnerLevel(model, { placement = null, available = availableLevelIds(), atMs = Date.now() } = {}) {
  const open = ORDER.filter(id => available.includes(id))
  const milestones = sanitizeLevelMilestones(model?.levelMilestones)
  const completed = []
  const inconsistencies = []
  for (const id of ORDER) {
    if (!milestones[id]) continue
    // a milestone counts only when every earlier level is completed too
    if (ORDER.slice(0, ORDER.indexOf(id)).every(prev => completed.includes(prev))) completed.push(id)
    else inconsistencies.push({ level: id, reason: 'earlier_level_not_completed' })
  }
  const working = open.find(id => !completed.includes(id)) || open.at(-1) || null
  const highest = completed.at(-1) || null
  const nextId = highest ? ORDER[ORDER.indexOf(highest) + 1] || null : null
  const estimate = typeof placement?.level === 'string' && PLACEMENT_BANDS.has(placement.level) ? placement.level : null
  return {
    placement: { estimate, verified: false, opensNothing: true },
    available: open,
    working,
    completed,
    next: nextId && isKnownLevel(nextId) ? { id: nextId, open: open.includes(nextId) } : null,
    // the one transition the product can show today: finished what is open, next level closed
    transition: nextId && !open.includes(nextId) && working && completed.includes(working) ? 'next_level_closed'
      : nextId && open.includes(nextId) ? 'next_level_open' : 'none',
    status: working === 'pre_a1' ? preA1Status(model, { atMs }).state : (completed.includes(working) ? 'graduated' : 'in_progress'),
    inconsistencies,
  }
}

/* The level a screen should show this learner: their working level. */
export const workingLevelId = (model, options) => deriveLearnerLevel(model, options).working
