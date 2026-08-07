/*
 * levels — which levels this product knows, and which a learner can actually open.
 *
 * Until now there was one level and so the question never had to be asked: every
 * episode in the curriculum was Pre-A1, and "all of the curriculum" and "this
 * level" were the same set. A1 is designed (docs/curriculum/a1-map.md) and will
 * arrive one arc at a time, and the moment its first episode exists those two
 * sets stop being the same. Readiness, Home's progress, the planner and the
 * content loader would all quietly start answering about a mixture.
 *
 * So the level becomes explicit BEFORE any A1 content exists, and the registry
 * stays deliberately thin: two flags with real consumers and no decoration.
 *
 *   implemented   there is runtime content for this level in this build
 *   available     a learner may open it
 *
 * The two are separate on purpose. A level can be known and unavailable — which
 * is exactly A1's state today — and nothing may treat "known" as "playable".
 * There is no label here: while a level is unavailable it has no user-facing
 * name to translate, and inventing one is how an unbuilt level leaks into the
 * interface.
 *
 * An unknown level is never Pre-A1 by default. Every lookup here answers null or
 * empty for something it does not know, and the callers that must refuse do so
 * explicitly — see `episodeContent.js`.
 */
import { EPISODE_SKELETON } from './preA1Skeleton.generated.js'

export const PRE_A1 = 'pre_a1'
export const A1 = 'a1'

/*
 * `episodeLevel` is the string an episode definition carries in its own
 * metadata (`level: 'Pre-A1'`). Mapping it here is what lets the curriculum be
 * filtered by level without every caller knowing the spelling.
 */
export const LEVELS = [
  { id: PRE_A1, order: 1, implemented: true, available: true, episodeLevel: 'Pre-A1' },
  { id: A1, order: 2, implemented: false, available: false, episodeLevel: 'A1' },
]

export const LEVEL_IDS = LEVELS.map(l => l.id)

/* A level, or null. Never a default: a typo must not become Pre-A1. */
export const getLevel = (levelId) => LEVELS.find(l => l.id === levelId) || null

export const isKnownLevel = (levelId) => Boolean(getLevel(levelId))
export const isLevelImplemented = (levelId) => Boolean(getLevel(levelId)?.implemented)
export const isLevelAvailable = (levelId) => Boolean(getLevel(levelId)?.available)

export const availableLevelIds = () => LEVELS.filter(l => l.available).map(l => l.id)

/*
 * The level a learner is working on. Today there is exactly one available level,
 * so it is derived rather than stored — nothing is written to the learner model
 * and there is no migration. When a second level becomes available this becomes
 * a real choice, and that is the moment to decide where the answer lives.
 */
export const playableLevelId = () => availableLevelIds()[0] || null

/* The level id an episode's own metadata declares, or null. */
export const levelIdOfEpisode = (episode) =>
  LEVELS.find(l => l.episodeLevel && l.episodeLevel === episode?.level)?.id || null

/*
 * The curriculum of one level.
 *
 * Order is preserved, because the walk through a level is part of its design.
 * An unknown level gets an empty list rather than somebody else's episodes.
 */
export function episodesOfLevel(levelId) {
  if (!isKnownLevel(levelId)) return []
  return EPISODE_SKELETON.filter(ep => levelIdOfEpisode(ep) === levelId)
}

/* How many runtime episodes a level actually has in this build. */
export const runtimeEpisodeCount = (levelId) => episodesOfLevel(levelId).length

/* The level an episode id belongs to, from the curriculum itself. */
export function levelIdOfEpisodeId(episodeId) {
  const episode = EPISODE_SKELETON.find(ep => ep.id === episodeId)
  return episode ? levelIdOfEpisode(episode) : null
}
