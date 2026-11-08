/*
 * Where each answer option is SHOWN.
 *
 * English content is authored with the right answer first (easy to read and
 * review). Shown in that order, a learner who always taps the top option never
 * has to understand anything. So the player rotates the order by a stable hash
 * of the step: the same on every reload, different from step to step.
 *
 * Display only: the authored arrays, their `correct` flags and the evidence a
 * choice records are untouched. Course episodes are already placed when built
 * (learning/courses/transform.js, same hash).
 *
 * AWAITING_OWNER_APPROVAL. Pre-A1 and the placement test are frozen: even a
 * presentation change there needs the owner's yes, and until then they keep the
 * authored order. Approving is removing an entry here. Nothing else changes, and
 * `check-option-order` already measures what approval would show.
 */
import { levelIdOfEpisodeId } from '../curriculum/levels.js'

export const AWAITING_OWNER_APPROVAL = new Set(['pre_a1', 'placement'])

export function rotationFor(length, seed) {
  if (length < 2) return 0
  let h = 2166136261
  for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) }
  return (h >>> 0) % length
}

export function displayOrder(options, seed) {
  const list = Array.isArray(options) ? options : []
  const shift = rotationFor(list.length, seed)
  return [...list.slice(shift), ...list.slice(0, shift)]
}

/* The options of an English episode's step, as this build shows them. */
export function shownEpisodeOptions(options, episodeId, stepIndex) {
  const levelId = levelIdOfEpisodeId(episodeId)
  if (!levelId || AWAITING_OWNER_APPROVAL.has(levelId)) return options
  return displayOrder(options, `${episodeId}:${stepIndex}`)
}

export const shownPlacementOptions = (question) =>
  (AWAITING_OWNER_APPROVAL.has('placement') ? question.options : displayOrder(question.options, question.id))
