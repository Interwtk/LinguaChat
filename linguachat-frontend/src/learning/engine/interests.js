/*
 * interests — a controlled catalogue that lets episodes talk about what the
 * learner actually cares about, without changing what they are learning.
 *
 * The interest ids and their localized labels already exist (onboarding stores
 * them in tutorPreferences.interests); this module only maps them to a small,
 * fixed set of English nouns and objects that are safe at Pre-A1. Nothing here
 * is generated: no brands, no invented phrases, no extra grammar. A learner with
 * no interests gets neutral, universal examples rather than a nagging prompt.
 *
 * Choice is deterministic. The primary interest comes from a stable seed, so it
 * cannot drift between renders or reloads; only a NEW context (a later episode
 * or a later day) rotates to another interest the learner also chose.
 */
import { seedFrom } from './variation.js'

/*
 * One entry per interest id declared in services/tutorPreferences.
 *   targetNoun  the plain noun used in the target sentence ("I like music.")
 *   objects     two Pre-A1 variations, used for "Do you like …?" prompts
 *   activity    a simple thing you can propose doing together (episode 9)
 *   sceneKey    i18n key for the scene line shown by Chatto
 * Everything is generic on purpose — no titles, no brands, no proper nouns.
 */
export const INTEREST_CONTEXTS = {
  music: { targetNoun: 'music', objects: ['pop music', 'rock music'], activity: 'listen to music', sceneKey: 'ctxSceneMusic' },
  games: { targetNoun: 'games', objects: ['video games', 'board games'], activity: 'play a game', sceneKey: 'ctxSceneGames' },
  movies: { targetNoun: 'movies', objects: ['funny movies', 'action movies'], activity: 'watch a movie', sceneKey: 'ctxSceneMovies' },
  food: { targetNoun: 'food', objects: ['pizza', 'fruit'], activity: 'have something to eat', sceneKey: 'ctxSceneFood' },
  travel: { targetNoun: 'travel', objects: ['beaches', 'mountains'], activity: 'plan a trip', sceneKey: 'ctxSceneTravel' },
  sports: { targetNoun: 'sports', objects: ['football', 'running'], activity: 'go for a walk', sceneKey: 'ctxSceneSports' },
  technology: { targetNoun: 'technology', objects: ['computers', 'phones'], activity: 'look at something online', sceneKey: 'ctxSceneTechnology' },
  culture: { targetNoun: 'art', objects: ['museums', 'photos'], activity: 'visit a museum', sceneKey: 'ctxSceneCulture' },
  school: { targetNoun: 'books', objects: ['stories', 'science'], activity: 'read a book', sceneKey: 'ctxSceneSchool' },
  work: { targetNoun: 'my work', objects: ['teamwork', 'new projects'], activity: 'take a break', sceneKey: 'ctxSceneWork' },
  family: { targetNoun: 'my family', objects: ['family dinners', 'photos'], activity: 'call someone', sceneKey: 'ctxSceneFamily' },
}

/*
 * Used when the learner picked nothing, or only ids we do not have a context
 * for. Deliberately universal: everyone can talk about coffee and music.
 */
export const NEUTRAL_CONTEXT = {
  interestId: null,
  targetNoun: 'music',
  objects: ['music', 'coffee'],
  activity: 'listen to music',
  sceneKey: 'ctxSceneNeutral',
  labelKey: null,
}

export const KNOWN_INTERESTS = Object.keys(INTEREST_CONTEXTS)

// Keep only ids we can actually build a Pre-A1 context for, de-duplicated and
// in a stable order so the same profile always yields the same rotation.
export function normalizeInterests(raw) {
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  const out = []
  for (const item of raw) {
    const id = String(item || '').trim().toLowerCase()
    if (!INTEREST_CONTEXTS[id] || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

// Read interests from whatever the app already stores, without assuming a shape.
export function getLearnerInterests(source) {
  if (!source) return []
  if (Array.isArray(source)) return normalizeInterests(source)
  return normalizeInterests(source.interests || source.topics)
}

/*
 * The interest for a given context. `seedKey` is what makes it stable: pass the
 * learner's name plus the episode id and the same episode always talks about the
 * same thing, while a different episode may pick another interest they chose.
 */
export function pickInterest(interests, seedKey = '') {
  const list = normalizeInterests(interests)
  if (!list.length) return null
  return list[seedFrom(String(seedKey)) % list.length]
}

export function getInterestContext(interests, seedKey = '') {
  const id = pickInterest(interests, seedKey)
  if (!id) return { ...NEUTRAL_CONTEXT }
  return { interestId: id, labelKey: `interest_${id}`, ...INTEREST_CONTEXTS[id] }
}

// The two objects a "Do you like …?" turn may use, stable per context.
export function getInterestObject(context, seedKey = '') {
  const objects = context?.objects || NEUTRAL_CONTEXT.objects
  return objects[seedFrom(String(seedKey)) % objects.length]
}

/*
 * Which interests have not been used recently, so the daily session can vary
 * what today is about without ever becoming random.
 */
export function leastRecentlyUsed(interests, recent = []) {
  const list = normalizeInterests(interests)
  if (!list.length) return null
  const unused = list.filter(id => !recent.includes(id))
  return (unused.length ? unused : list)[0]
}
