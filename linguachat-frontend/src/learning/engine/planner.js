/*
 * planner — a small deterministic daily planner for the Pre-A1 arc.
 *
 * Priorities: (1) an in-progress episode, (2) the next unlocked episode,
 * (3) a short due review, (4) free conversation. Overdue reviews are surfaced
 * as an optional "quick review first" flag rather than blocking the episode.
 */
import { getEpisodeState, getDueReviews } from './learnerModel.js'

export function prerequisitesMet(model, episode) {
  return (episode.prerequisites || []).every(id => getEpisodeState(model, id).status === 'completed')
}

export function isEpisodeUnlocked(model, episode) {
  return prerequisitesMet(model, episode)
}

export function arcProgress(model, arc) {
  const completed = arc.filter(ep => getEpisodeState(model, ep.id).status === 'completed').length
  return { completed, total: arc.length }
}

export function planDay(model, arc, { atMs = Date.now() } = {}) {
  const due = getDueReviews(model, atMs)
  const inProgress = arc.find(ep => getEpisodeState(model, ep.id).status === 'in_progress' && isEpisodeUnlocked(model, ep))
  if (inProgress) {
    return { type: 'continue_episode', episodeId: inProgress.id, hasReview: due.length > 0, reviewItems: due }
  }
  const nextUnlocked = arc.find(ep => getEpisodeState(model, ep.id).status !== 'completed' && isEpisodeUnlocked(model, ep))
  if (nextUnlocked) {
    return { type: 'next_episode', episodeId: nextUnlocked.id, hasReview: due.length > 0, reviewItems: due }
  }
  if (due.length) {
    return { type: 'review', reviewItems: due }
  }
  return { type: 'free_chat' }
}
