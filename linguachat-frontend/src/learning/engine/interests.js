/*
 * interests — a controlled catalogue that lets Lingua talk about what the
 * learner actually cares about, without changing what they are learning.
 *
 * The interest ids and their localized labels already exist (onboarding stores
 * them in tutorPreferences.interests); this module owns what each id MEANS.
 * Nothing here is generated: no brands, no invented phrases, no extra grammar. A
 * learner with no interests gets neutral, universal examples rather than a
 * nagging prompt.
 *
 * Choice is deterministic. The primary interest comes from a stable seed, so it
 * cannot drift between renders or reloads; only a NEW context (a later episode
 * or a later day) rotates to another interest the learner also chose.
 *
 * Two kinds of information live in each entry, and confusing them is how this
 * project used to ship "Two music." and "I like travel.":
 *
 *   TARGET LANGUAGE VALUES — targetNoun, objects, activity. These end up inside
 *     an English sentence a learner is graded on, so each one is checked against
 *     semanticContext and each is deliberately tiny.
 *
 *   CONVERSATION TOPICS — facets.topics. These never enter a graded sentence.
 *     They are what free chat may talk ABOUT, so they can be a little richer
 *     while still being short, general and safe to say in any year.
 */
import { seedFrom } from './variation.js'

/*
 * One entry per interest id offered at onboarding.
 *   targetNoun  the plain noun used in the target sentence ("I like music.")
 *               — must be classifiable by semanticContext, or it cannot be liked
 *   objects     exactly two Pre-A1 variations, used for "Do you like …?" prompts
 *   activity    a simple thing you can propose doing together (episode 9)
 *   sceneKey    i18n key for the scene line shown by Chatto
 *   facets      what a conversation may be about, and which typed values exist:
 *                 topics      conversational, never graded
 *                 activities  "do" phrases, usable in an activity slot
 *                 objects     ids from semanticContext.THINGS only — absent when
 *                             the interest has no concrete Pre-A1 object, which
 *                             is most of them, and that absence is the point
 *   related     a small, explicit handful — never a recommendation graph
 *   nugget      optional, one high-confidence general sentence. No dates, no
 *               numbers, no rankings, nothing that expires. Absent is fine.
 *
 * The first eleven ids and all of their target-language values are UNCHANGED
 * from the frozen Pre-A1 behaviour: a stored profile keeps meaning exactly what
 * it meant, and no episode's sentences move.
 */
export const INTEREST_CONTEXTS = {
  music: {
    targetNoun: 'music', objects: ['pop music', 'rock music'], activity: 'listen to music', sceneKey: 'ctxSceneMusic',
    facets: { topics: ['music styles', 'instruments', 'concerts', 'songs you know'], activities: ['listen to music'] },
    related: ['movies', 'culture'],
    nugget: 'Different musical styles often grow from different communities and traditions.',
  },
  games: {
    targetNoun: 'games', objects: ['video games', 'board games'], activity: 'play a game', sceneKey: 'ctxSceneGames',
    facets: { topics: ['game worlds', 'characters', 'kinds of games', 'playing with friends'], activities: ['play a game'] },
    related: ['technology', 'movies', 'music'],
    nugget: 'Games combine art, sound, rules and interaction.',
  },
  movies: {
    targetNoun: 'movies', objects: ['funny movies', 'action movies'], activity: 'watch a movie', sceneKey: 'ctxSceneMovies',
    facets: { topics: ['kinds of movies', 'characters', 'stories', 'animation'], activities: ['watch a movie'] },
    related: ['music', 'games', 'culture'],
  },
  food: {
    targetNoun: 'food', objects: ['pizza', 'fruit'], activity: 'have something to eat', sceneKey: 'ctxSceneFood',
    facets: { topics: ['food you like', 'simple meals', 'fruit and vegetables'], activities: ['have something to eat'], objects: ['sandwich', 'apple'] },
    related: ['cooking', 'culture', 'travel'],
  },
  // "I like travel." is not how anyone says it; the gerund is what a teacher
  // would model, and it is exactly as easy to read.
  travel: {
    targetNoun: 'traveling', objects: ['beaches', 'mountains'], activity: 'plan a trip', sceneKey: 'ctxSceneTravel',
    facets: { topics: ['countries and cities', 'places to visit', 'ways to travel', 'simple plans'], activities: ['plan a trip'] },
    related: ['culture', 'food', 'architecture', 'nature'],
  },
  sports: {
    targetNoun: 'sports', objects: ['football', 'running'], activity: 'go for a walk', sceneKey: 'ctxSceneSports',
    facets: { topics: ['kinds of sports', 'playing outside', 'teams and friends'], activities: ['go for a walk'] },
    related: ['nature', 'animals'],
  },
  technology: {
    targetNoun: 'technology', objects: ['computers', 'phones'], activity: 'look at something online', sceneKey: 'ctxSceneTechnology',
    facets: { topics: ['phones and computers', 'apps you use', 'the internet', 'helpful machines'], activities: ['look at something online'], objects: ['phone'] },
    related: ['games', 'science', 'photography'],
    nugget: 'Computers can help with language: they compare what you write with patterns they have seen.',
  },
  culture: {
    targetNoun: 'art', objects: ['museums', 'photos'], activity: 'visit a museum', sceneKey: 'ctxSceneCulture',
    facets: { topics: ['art and museums', 'traditions', 'festivals', 'everyday life in other places'], activities: ['visit a museum'] },
    related: ['travel', 'history', 'architecture'],
  },
  school: {
    targetNoun: 'books', objects: ['stories', 'science'], activity: 'read a book', sceneKey: 'ctxSceneSchool',
    facets: { topics: ['books and stories', 'studying', 'learning something new'], activities: ['read a book'], objects: ['book'] },
    related: ['science', 'history'],
  },
  work: {
    targetNoun: 'my work', objects: ['teamwork', 'new projects'], activity: 'take a break', sceneKey: 'ctxSceneWork',
    facets: { topics: ['work and study', 'working with people', 'plans for the week'], activities: ['take a break'] },
    related: ['business', 'technology'],
  },
  family: {
    targetNoun: 'my family', objects: ['family dinners', 'photos'], activity: 'call someone', sceneKey: 'ctxSceneFamily',
    facets: { topics: ['family and friends', 'meals together', 'weekends'], activities: ['call someone'] },
    related: ['food', 'animals'],
  },

  /* ---- added by the interest personalization sprint ---- */
  history: {
    targetNoun: 'history', objects: ['old cities', 'old stories'], activity: 'visit an old city', sceneKey: 'ctxSceneHistory',
    facets: { topics: ['old cities', 'how people lived before', 'inventions', 'things that changed'], activities: ['visit an old city'] },
    related: ['culture', 'architecture', 'school'],
    nugget: 'Cities often grew where people could find water and trade easily.',
  },
  animals: {
    targetNoun: 'animals', objects: ['dogs', 'cats'], activity: 'walk a dog', sceneKey: 'ctxSceneAnimals',
    facets: { topics: ['pets', 'wild animals', 'animals near your home'], activities: ['walk a dog'] },
    related: ['nature', 'science'],
  },
  nature: {
    targetNoun: 'nature', objects: ['forests', 'the sea'], activity: 'walk outside', sceneKey: 'ctxSceneNature',
    facets: { topics: ['weather', 'plants and trees', 'the sea and mountains', 'seasons'], activities: ['walk outside'] },
    related: ['animals', 'travel', 'photography'],
    nugget: 'Trees need light, water and air to grow.',
  },
  business: {
    targetNoun: 'business', objects: ['small shops', 'new ideas'], activity: 'plan something new', sceneKey: 'ctxSceneBusiness',
    facets: { topics: ['shops and products', 'ideas for a small business', 'customers', 'work with people'], activities: ['plan something new'] },
    related: ['work', 'technology'],
  },
  photography: {
    targetNoun: 'photography', objects: ['photos', 'cameras'], activity: 'take photos', sceneKey: 'ctxScenePhotography',
    facets: { topics: ['taking photos', 'light and colour', 'photos of people and places'], activities: ['take photos'] },
    related: ['nature', 'travel', 'culture'],
  },
  architecture: {
    targetNoun: 'architecture', objects: ['old buildings', 'bridges'], activity: 'look at buildings', sceneKey: 'ctxSceneArchitecture',
    facets: { topics: ['buildings and houses', 'bridges', 'city streets', 'how buildings are made'], activities: ['look at buildings'] },
    related: ['history', 'culture', 'travel'],
    nugget: 'Gothic buildings often use pointed arches and tall windows.',
  },
  cars: {
    targetNoun: 'cars', objects: ['fast cars', 'old cars'], activity: 'go for a drive', sceneKey: 'ctxSceneCars',
    facets: { topics: ['cars you like', 'how cars changed', 'driving and roads'], activities: ['go for a drive'] },
    related: ['technology', 'travel'],
  },
  cooking: {
    targetNoun: 'cooking', objects: ['simple recipes', 'fresh food'], activity: 'cook something', sceneKey: 'ctxSceneCooking',
    facets: { topics: ['cooking at home', 'simple recipes', 'food from other places'], activities: ['cook something'], objects: ['apple'] },
    related: ['food', 'culture', 'family'],
  },
  science: {
    targetNoun: 'science', objects: ['space', 'experiments'], activity: 'watch a science video', sceneKey: 'ctxSceneScience',
    facets: { topics: ['space', 'how things work', 'animals and plants', 'simple experiments'], activities: ['watch a science video'] },
    related: ['technology', 'nature', 'school'],
    nugget: 'Science works by testing an idea and seeing whether it happens again.',
  },
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
  facets: { topics: ['everyday life', 'your day', 'people around you', 'food and drinks'], activities: ['listen to music'] },
  related: [],
}

export const KNOWN_INTERESTS = Object.keys(INTEREST_CONTEXTS)

/*
 * How many a learner may choose.
 *
 * Twenty is the whole catalogue today, so the cap is not a limit anyone can feel
 * — it is a bound on what the storage and the UI have been tested with, and it
 * stops a corrupt or hand-edited profile from carrying an unbounded list.
 */
export const MAX_SELECTED_INTERESTS = 20

// Keep only ids we can actually build a context for, de-duplicated and in a
// stable order so the same profile always yields the same rotation.
export function normalizeInterests(raw) {
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  const out = []
  for (const item of raw) {
    const id = String(item || '').trim().toLowerCase()
    if (!INTEREST_CONTEXTS[id] || seen.has(id)) continue
    seen.add(id)
    out.push(id)
    if (out.length >= MAX_SELECTED_INTERESTS) break
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

/* ---- what a conversation may be about ---- */

export const facetsOf = (interestId) =>
  INTEREST_CONTEXTS[interestId]?.facets || (interestId === null ? NEUTRAL_CONTEXT.facets : null)

/*
 * The interests explicitly related to this one — a short, hand-written list, not
 * a graph anybody has to trust. Unknown ids and self-references are dropped, so
 * a typo cannot invent a relationship.
 */
export function relatedInterests(interestId) {
  const declared = INTEREST_CONTEXTS[interestId]?.related || []
  return declared.filter(id => id !== interestId && Boolean(INTEREST_CONTEXTS[id]))
}

/*
 * One short, general sentence about the interest, or null.
 *
 * The policy matters more than the content: no dates, no quantities, no
 * rankings, nothing that depends on this year's news, nothing medical, legal or
 * financial. Most entries have none, and a conversation with no nugget is the
 * normal case rather than a failure.
 */
export const nuggetFor = (interestId) => INTEREST_CONTEXTS[interestId]?.nugget || null
