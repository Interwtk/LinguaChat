/*
 * episodeContent — the one place that decides whether an episode can be opened,
 * and the one place that fetches its content.
 *
 * There are two questions and they need different answers at different moments.
 *
 *   episodeRequest()        may this be opened, right now? — synchronous, metadata
 *                           only, safe to ask while rendering
 *   loadEpisodeContent()    give me the definition — asynchronous, per level, and
 *                           the seam A1's arcs plug into
 *
 * Both fail closed. Asking for a level nobody knows, a level that is designed but
 * not built, or an episode that does not exist gets a named refusal — never a
 * quiet substitution. That mattered enough to write down: `startEpisode` used to
 * turn a missing id into episode one, so a wrong link opened the first greeting
 * and looked like a feature.
 *
 * Pre-A1's content is one module today, and the screens that play an episode are
 * already loaded on demand, so its loader is a single dynamic import that
 * resolves from the chunk the caller is standing in. A1 is expected to arrive as
 * one loader per arc, which is why the map is keyed by level and the signature
 * carries an arc: adding a level means adding a loader entry, not editing a
 * switch somewhere else.
 */
import {
  PRE_A1, A1, A2, B1, B2, C1, C2, getLevel, isKnownLevel, isLevelAvailable, hasRuntimeContent,
  episodesOfLevel, levelIdOfEpisodeId, playableLevelId,
} from './levels.js'

/* Why a request was refused. Callers switch on these, so they are part of the contract. */
export const REFUSED = {
  UNKNOWN_LEVEL: 'unknown_level',
  LEVEL_UNAVAILABLE: 'level_unavailable',
  LEVEL_NOT_IMPLEMENTED: 'level_not_implemented',
  UNKNOWN_EPISODE: 'unknown_episode',
  WRONG_LEVEL: 'episode_not_in_level',
  NO_CONTENT_LOADER: 'no_content_loader',
}

export class EpisodeContentError extends Error {
  constructor(reason, detail) {
    super(`episode content refused: ${reason}${detail ? ` (${detail})` : ''}`)
    this.name = 'EpisodeContentError'
    this.reason = reason
  }
}

/*
 * One loader per level. Pre-A1's whole curriculum is a single module; A1 will add
 * an entry per arc as each arc is built, so a planned level simply has no loader
 * and every path through here refuses it.
 */
const CONTENT_LOADERS = {
  [PRE_A1]: {
    /*
     * Pre-A1 has one content module for all six arcs. The import goes through
     * `preA1Content.js`, which exists only so the chunk is named after the level
     * it carries; see the comment in that file.
     */
    default: () => import('../episodes/preA1Content.js'),
  },
  [A1]: {
    /*
     * A1 is loaded ARC BY ARC, and there is no `default` here on purpose: a
     * partially built level must refuse the arcs it does not have rather than
     * hand back one it does. Each arc sprint has added exactly one line here and
     * nothing else had to change, which was the point of building it this way.
     * All seven of A1's designed arcs now resolve; the level itself still stays
     * closed to learners via `levels.js`'s `available: false` — content existing
     * and a level being open are different questions, per that file's own
     * comment.
     */
    work_and_study: () => import('../episodes/a1Arc1Content.js'),
    daily_rhythm: () => import('../episodes/a1Arc2Content.js'),
    people_around_you: () => import('../episodes/a1Arc3Content.js'),
    finding_your_way: () => import('../episodes/a1Arc4Content.js'),
    paying_and_choosing: () => import('../episodes/a1Arc5Content.js'),
    what_you_can_do: () => import('../episodes/a1Arc6Content.js'),
    making_arrangements: () => import('../episodes/a1Arc7Content.js'),
  },
  [A2]: {
    /*
     * A2's seven arcs arrived from `LC-CONT-A2` fully authored at once, unlike
     * A1's arc-by-arc build — but the loader stays one entry per arc anyway,
     * for the same reason: importing one arc must never download another's
     * prose.
     */
    what_happened: () => import('../episodes/a2Arc1Content.js'),
    making_plans: () => import('../episodes/a2Arc2Content.js'),
    people_and_places: () => import('../episodes/a2Arc3Content.js'),
    getting_around: () => import('../episodes/a2Arc4Content.js'),
    booking_a_stay: () => import('../episodes/a2Arc5Content.js'),
    everyday_problems: () => import('../episodes/a2Arc6Content.js'),
    lets_do_something: () => import('../episodes/a2Arc7Content.js'),
  },
  [B1]: {
    /*
     * B1's seven arcs arrived from `LC-CONT-B1` fully authored at once, same
     * shape as A2's own arrival — one loader per arc anyway, for the same
     * reason: importing one arc must never download another's prose.
     */
    what_happened: () => import('../episodes/b1Arc1Content.js'),
    i_think_that: () => import('../episodes/b1Arc2Content.js'),
    which_one: () => import('../episodes/b1Arc3Content.js'),
    somethings_wrong: () => import('../episodes/b1Arc4Content.js'),
    looking_ahead: () => import('../episodes/b1Arc5Content.js'),
    keep_talking: () => import('../episodes/b1Arc6Content.js'),
    the_long_conversation: () => import('../episodes/b1Arc7Content.js'),
  },
  [B2]: {
    /*
     * B2's six arcs arrived from `LC-CONT-B2` fully authored at once, same
     * shape as A2/B1's own arrival. Unlike every level above, B2's own
     * chunk-naming wrapper already lives inside `levels/b2/arcs/**`
     * (`b2Arc{N}*Content.js`, each re-exporting `getEpisode`), so the loader
     * points there directly rather than through a second, redundant
     * top-level `episodes/b2Arc{N}Content.js` wrapper.
     */
    making_the_case: () => import('../levels/b2/arcs/b2Arc1MakingTheCaseContent.js'),
    when_plans_go_wrong: () => import('../levels/b2/arcs/b2Arc2WhenPlansGoWrongContent.js'),
    what_if: () => import('../levels/b2/arcs/b2Arc3WhatIfContent.js'),
    talking_around_a_subject: () => import('../levels/b2/arcs/b2Arc4TalkingAroundASubjectContent.js'),
    reading_between_the_lines: () => import('../levels/b2/arcs/b2Arc5ReadingBetweenTheLinesContent.js'),
    the_long_conversation: () => import('../levels/b2/arcs/b2Arc6TheLongConversationContent.js'),
  },
  [C1]: {
    /*
     * C1's seven arcs arrived from `LC-CONT-C1` fully authored at once, same
     * shape as A2/B1/B2's own arrival. Like B2, C1's own chunk-naming
     * wrapper already lives inside `levels/c1/arcs/**`
     * (`c1Arc{N}*Content.js`, each re-exporting `getEpisode`), so the loader
     * points there directly rather than through a second, redundant
     * top-level `episodes/c1Arc{N}Content.js` wrapper.
     */
    abstract_argument: () => import('../levels/c1/arcs/c1Arc1AbstractArgumentContent.js'),
    register_and_diplomacy: () => import('../levels/c1/arcs/c1Arc2RegisterAndDiplomacyContent.js'),
    synthesis_and_mediation: () => import('../levels/c1/arcs/c1Arc3SynthesisAndMediationContent.js'),
    nuance_and_implication: () => import('../levels/c1/arcs/c1Arc4NuanceAndImplicationContent.js'),
    extended_structured_discourse: () => import('../levels/c1/arcs/c1Arc5ExtendedStructuredDiscourseContent.js'),
    negotiation_and_complexity: () => import('../levels/c1/arcs/c1Arc6NegotiationAndComplexityContent.js'),
    sustained_interaction: () => import('../levels/c1/arcs/c1Arc7SustainedInteractionContent.js'),
  },
  [C2]: {
    /*
     * C2's eight arcs arrived from `LC-CONT-C2` fully authored at once, same
     * shape as B2/C1's own arrival — the chunk-naming wrapper already lives
     * inside `levels/c2/arcs/**` (`c2Arc{N}*Content.js`, each re-exporting
     * `getEpisode`), so the loader points there directly.
     */
    dense_input_synthesis: () => import('../levels/c2/arcs/c2Arc1DenseInputSynthesisContent.js'),
    precise_reformulation: () => import('../levels/c2/arcs/c2Arc2PreciseReformulationContent.js'),
    implication_and_subtext: () => import('../levels/c2/arcs/c2Arc3ImplicationAndSubtextContent.js'),
    register_and_pragmatics: () => import('../levels/c2/arcs/c2Arc4RegisterAndPragmaticsContent.js'),
    argument_and_position: () => import('../levels/c2/arcs/c2Arc5ArgumentAndPositionContent.js'),
    discourse_flexibility: () => import('../levels/c2/arcs/c2Arc6DiscourseFlexibilityContent.js'),
    stylistic_control: () => import('../levels/c2/arcs/c2Arc7StylisticControlContent.js'),
    integrated_mediation: () => import('../levels/c2/arcs/c2Arc8IntegratedMediationContent.js'),
  },
}

const loaderFor = (levelId, arcId) => {
  const perArc = CONTENT_LOADERS[levelId]
  if (!perArc) return null
  return perArc[arcId] || perArc.default || null
}

/*
 * May this episode be opened?
 *
 * Synchronous and cheap: it reads the level registry and the curriculum skeleton,
 * never the content. `levelId` may be omitted, in which case the episode's own
 * level is used — which is how a caller holding only an id (a replay button, a
 * session block) can still be level-checked.
 */
export function episodeRequest({ levelId = null, episodeId, forLearner = true } = {}) {
  const resolvedLevel = levelId || levelIdOfEpisodeId(episodeId)

  if (!episodeId) return { ok: false, reason: REFUSED.UNKNOWN_EPISODE }
  if (!resolvedLevel) {
    /*
     * No level could be resolved: either the id belongs to nothing, or a caller
     * passed a level this build does not know. Both are refusals, and neither
     * falls back to the level that happens to be available.
     */
    return { ok: false, reason: levelId ? REFUSED.UNKNOWN_LEVEL : REFUSED.UNKNOWN_EPISODE }
  }
  if (!isKnownLevel(resolvedLevel)) return { ok: false, reason: REFUSED.UNKNOWN_LEVEL }
  if (!hasRuntimeContent(resolvedLevel)) {
    return { ok: false, reason: REFUSED.LEVEL_NOT_IMPLEMENTED, levelId: resolvedLevel }
  }
  /*
   * AVAILABILITY IS THE PRODUCT GATE, and it is the only check a caller may opt
   * out of. A1 arc 1 exists and must be testable — by the checks, by an internal
   * harness, by QA — while remaining closed to learners, and those are genuinely
   * different questions. So the opt-out is one named argument that every product
   * call site leaves at its default, rather than a flag in storage, a dev route or
   * a weaker gate: `forLearner: false` appears in tooling and nowhere else, and a
   * check asserts exactly that.
   */
  if (forLearner && !isLevelAvailable(resolvedLevel)) {
    return { ok: false, reason: REFUSED.LEVEL_UNAVAILABLE, levelId: resolvedLevel }
  }

  const episode = episodesOfLevel(resolvedLevel).find(ep => ep.id === episodeId)
  if (!episode) {
    /*
     * The id exists somewhere but not in the level asked about, or nowhere at
     * all. Telling those apart helps whoever reads the log.
     */
    const elsewhere = levelIdOfEpisodeId(episodeId)
    return {
      ok: false,
      reason: elsewhere ? REFUSED.WRONG_LEVEL : REFUSED.UNKNOWN_EPISODE,
      levelId: resolvedLevel,
    }
  }
  if (!loaderFor(resolvedLevel, episode.arc)) {
    return { ok: false, reason: REFUSED.NO_CONTENT_LOADER, levelId: resolvedLevel }
  }
  return { ok: true, levelId: resolvedLevel, arcId: episode.arc, episodeId }
}

/* Convenience for the screens: may this id be opened at all? */
export const canOpenEpisode = (episodeId) => episodeRequest({ episodeId }).ok

/*
 * The episode definition, loaded on demand.
 *
 * Refuses before importing anything, so a request for a planned level costs
 * nothing and cannot pull content into the caller's chunk. The import is dynamic
 * on purpose: it is the boundary that keeps a level's prose out of the first
 * chunk today and out of every other arc's chunk tomorrow.
 */
export async function loadEpisodeContent({ levelId = null, episodeId, forLearner = true } = {}) {
  const request = episodeRequest({ levelId, episodeId, forLearner })
  if (!request.ok) throw new EpisodeContentError(request.reason, episodeId)

  const loader = loaderFor(request.levelId, request.arcId)
  const module = await loader()
  const episode = module.getEpisode ? module.getEpisode(episodeId) : null
  if (!episode) throw new EpisodeContentError(REFUSED.UNKNOWN_EPISODE, episodeId)
  return episode
}

/*
 * What a level's content module is, without loading it. Tooling asks this to
 * check that every runtime episode is reachable through a loader; nothing in the
 * product needs it.
 */
export const hasContentLoader = (levelId, arcId = null) => Boolean(loaderFor(levelId, arcId))

/* The level a screen should be working in when nobody said otherwise. */
export const currentLevelId = () => playableLevelId()

/* Re-exported so a caller needs one import to ask about a level and its content. */
export { getLevel, episodesOfLevel, isLevelAvailable, hasRuntimeContent }
