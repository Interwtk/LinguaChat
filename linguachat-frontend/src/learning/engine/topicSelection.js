/*
 * topicSelection — which topic this conversation is about.
 *
 * The pedagogy decides WHAT the learner practises. This decides what they talk
 * about while practising it, and nothing else: it cannot change an objective, an
 * intent, a threshold or a review. Two learners doing the same activity should be
 * able to have different conversations; neither should have an easier one.
 *
 * Four things it has to avoid, all of which are ways personalisation gets
 * annoying rather than pleasant:
 *
 *   REPETITION — the same interest every conversation. Recently used topics are
 *     on cooldown, so a learner with five interests meets more than one of them.
 *   MONOTHEMATIC PRISON — someone who ticked "music" being asked only about
 *     music for ever. A small share of contexts is deliberately outside what
 *     they chose.
 *   RANDOM DRIFT — a topic that changes when the page reloads, so a story or a
 *     session contradicts itself. Everything here is a pure function of the
 *     inputs plus a seed.
 *   NONSENSE — a topic used in a slot it does not fit ("Two music."). A caller
 *     that needs typed values says which types it accepts, and an interest that
 *     cannot supply one is skipped rather than forced.
 *
 * The result carries WHY it was chosen. That is for tests and for debugging; it
 * is never shown to the learner and never sent to the provider.
 */
import {
  INTEREST_CONTEXTS, NEUTRAL_CONTEXT, KNOWN_INTERESTS,
  normalizeInterests, relatedInterests, facetsOf, nuggetFor,
} from './interests.js'
import { seedFrom } from './variation.js'
import { thingById, isCountableThing } from './semanticContext.js'

/* Where a chosen topic came from. Internal vocabulary, never user-facing. */
export const TOPIC_SOURCES = ['explicit', 'related', 'exploration', 'neutral']

/*
 * UNMEASURED PRODUCT CONSTANTS.
 *
 * These are a starting shape for "mostly what you chose, sometimes something
 * next to it, occasionally something new" — a product judgement, not a measured
 * optimum. Nothing has been A/B tested; the only claim they make is that the
 * three cases all happen. Change them freely; the tests assert the SHAPE (each
 * source occurs, explicit dominates), never the exact numbers.
 */
export const TOPIC_MIX = { explicit: 70, related: 20, exploration: 10 }

/*
 * How many recent topics stay on cooldown.
 *
 * Small on purpose: with two interests, a long memory would starve both and
 * force exploration every time. The cooldown is a preference, not a ban — if
 * everything is on cooldown the least recently used one comes back.
 */
export const TOPIC_COOLDOWN = 3

const bucketFor = (seedKey) => {
  const n = seedFrom(String(seedKey)) % 100
  if (n < TOPIC_MIX.explicit) return 'explicit'
  if (n < TOPIC_MIX.explicit + TOPIC_MIX.related) return 'related'
  return 'exploration'
}

const pickFrom = (list, seedKey) => (list.length ? list[seedFrom(String(seedKey)) % list.length] : null)

/*
 * Does this interest offer a value of every type the caller needs?
 *
 * `acceptedSemanticTypes` is what the ASKING context can use — an activity slot,
 * a countable object. An interest with no answer for it is not a worse choice, it
 * is an invalid one, and saying so here is what keeps "Two music." impossible.
 */
export function supportsTypes(interestId, acceptedSemanticTypes = []) {
  if (!acceptedSemanticTypes.length) return true
  const facets = facetsOf(interestId)
  if (!facets) return false
  return acceptedSemanticTypes.every((type) => {
    if (type === 'activity') return Boolean(facets.activities?.length)
    if (type === 'generic_object') return (facets.objects || []).some(id => isCountableThing(id))
    if (type === 'interest') return Boolean(INTEREST_CONTEXTS[interestId]?.targetNoun)
    if (type === 'topic') return Boolean(facets.topics?.length)
    /* a type this catalogue has no concept of is never claimed to be supported */
    return false
  })
}

const eligible = (ids, { dismissed, acceptedSemanticTypes }) =>
  ids.filter(id => !dismissed.includes(id) && supportsTypes(id, acceptedSemanticTypes))

/*
 * Choose the topic for one context.
 *
 *   explicitInterests      what the learner ticked (ids; unknown ones dropped)
 *   recentTopics           ids used recently, most recent first
 *   dismissedTopics        ids the learner waved away in this context (today)
 *   acceptedSemanticTypes  types the asking context can actually use
 *   seed                   anything stable for this context: a session id, a day
 *                          plus an episode id. The SAME seed always returns the
 *                          SAME topic.
 *
 * Returns a topic descriptor, never null: with nothing suitable it returns the
 * neutral context, because a correct neutral conversation beats a wrong
 * personalised one.
 */
/*
 * How far a surface may wander from what the learner chose.
 *
 *   strong  free chat. The learner is here to talk; a related subject or
 *           something new is welcome, and the mix above applies.
 *   medium  the daily session and generic practice. The subject is pinned into a
 *           plan the learner was shown, so it stays inside what they picked —
 *           rotation and "not today" still apply, exploration does not.
 *
 * Curriculum stories get less than either, and that is not decided here: a story
 * personalises only what its own template declares (see storyPersonalization).
 */
export const PERSONALIZATION_STRENGTHS = ['strong', 'medium']

export function selectTopic({
  explicitInterests = [],
  recentTopics = [],
  dismissedTopics = [],
  acceptedSemanticTypes = [],
  strength = 'strong',
  seed = '',
} = {}) {
  const explicit = normalizeInterests(explicitInterests)
  const dismissed = normalizeInterests(dismissedTopics)
  const recent = normalizeInterests(recentTopics)

  const fresh = eligible(explicit.filter(id => !recent.includes(id)), { dismissed, acceptedSemanticTypes })
  const stale = eligible(explicit, { dismissed, acceptedSemanticTypes })

  const related = eligible(
    [...new Set(explicit.flatMap(relatedInterests))].filter(id => !explicit.includes(id) && !recent.includes(id)),
    { dismissed, acceptedSemanticTypes },
  )
  const unseen = eligible(
    KNOWN_INTERESTS.filter(id => !explicit.includes(id) && !related.includes(id) && !recent.includes(id)),
    { dismissed, acceptedSemanticTypes },
  )

  /*
   * A medium surface with nothing chosen stays neutral, and that is a product
   * decision rather than a limitation: the daily session PROMISES its subject on
   * Home, and promising "today is about cars" to somebody who never mentioned
   * cars is personalisation they did not ask for. Free chat may still explore,
   * because there the invitation costs nothing and can be ignored in one reply.
   */
  if (strength === 'medium' && !explicit.length) return describeTopic(null, { source: 'neutral', seed })

  const bucket = explicit.length ? bucketFor(`${seed}:mix`) : 'exploration'

  /*
   * The order below is the whole policy. Each case falls through to the next
   * rather than giving up, so "nothing available" always ends at neutral instead
   * of at an exception or an empty string.
   */
  const attempts = strength === 'medium'
    /* inside what they chose, rotated, and nothing else */
    ? [['explicit', fresh], ['explicit', stale]]
    : bucket === 'explicit'
      ? [['explicit', fresh], ['explicit', stale], ['related', related], ['exploration', unseen]]
      : bucket === 'related'
        ? [['related', related], ['explicit', fresh], ['explicit', stale], ['exploration', unseen]]
        : [['exploration', unseen], ['related', related], ['explicit', fresh], ['explicit', stale]]

  for (const [source, pool] of attempts) {
    const id = pickFrom(pool, `${seed}:${source}`)
    if (id) return describeTopic(id, { source, seed })
  }
  return describeTopic(null, { source: 'neutral', seed })
}

/*
 * Everything a caller needs about a chosen topic, and nothing about why.
 *
 * `topics` is conversational and never graded; `activity` and `object` are typed
 * values safe to put in a sentence. `object` is null far more often than not,
 * and callers must handle that rather than substituting something.
 */
export function describeTopic(interestId, { source = 'explicit', seed = '' } = {}) {
  const entry = interestId ? INTEREST_CONTEXTS[interestId] : null
  const facets = interestId ? facetsOf(interestId) : NEUTRAL_CONTEXT.facets
  const base = entry || NEUTRAL_CONTEXT
  const objectId = (facets?.objects || []).find(id => isCountableThing(id)) || null
  return {
    interestId: interestId || null,
    source: interestId ? source : 'neutral',
    labelKey: interestId ? `interest_${interestId}` : null,
    /* the one conversation topic this context is about */
    topic: pickFrom(facets?.topics || [], `${seed}:topic`) || null,
    /* typed values, for slots that need them */
    targetNoun: base.targetNoun,
    activity: pickFrom(facets?.activities || [base.activity], `${seed}:activity`) || base.activity,
    object: objectId,
    objectSingular: objectId ? thingById(objectId).singular : null,
    sceneKey: base.sceneKey,
    nugget: interestId ? nuggetFor(interestId) : null,
  }
}

/*
 * What the provider is allowed to know.
 *
 * Deliberately four short fields. Not the profile, not the other nineteen
 * interests, not the recent history, not why this topic won, not a weight, not a
 * mastery number — the selection already happened, here, and the provider only
 * needs its result. Sending less is also what keeps a topic from being a place to
 * smuggle text into a prompt: every value here comes from the catalogue.
 */
export function providerTopicContext(topic) {
  if (!topic || !topic.interestId) return null
  return {
    topic: topic.interestId,
    topic_facet: topic.topic || null,
  }
}
