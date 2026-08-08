/*
 * a1Map — what A1's implemented capabilities are, and nothing about Pre-A1.
 *
 * Pre-A1 has `preA1Map.js`; this is the same idea for the level above it, and it
 * is deliberately a SEPARATE file rather than a section of that one. The reason is
 * the bug class this architecture spent a whole sprint removing: a registry named
 * after one level that quietly answers for two. Pre-A1's required core, its exit
 * criteria and its readiness must not move because A1 gained content, and the
 * simplest way to guarantee that is for A1's facts to live somewhere Pre-A1 does
 * not read.
 *
 * ONLY ARC 1 IS HERE. A1 is designed in full (seven arcs, twenty-one episodes, in
 * docs/curriculum/a1-blueprint.json) and implemented one arc at a time. Listing
 * capabilities nobody can practise yet would make coverage look real, so the
 * capabilities appear here as their arcs are built.
 */
import { A1, episodesOfLevel } from './levels.js'
import { SKELETON_BY_ID } from './preA1Skeleton.generated.js'

/* The arcs of A1 with runtime content today. */
export const A1_RUNTIME_ARCS = ['work_and_study']

/*
 * The capability each A1 can-do is evidenced by, in the same shape Pre-A1 uses:
 * one intent per can-do, which is what coverage and the planner read.
 */
export const A1_CAN_DO_INTENT = {
  talk_about_work_or_study: 'state_life_fact',
  ask_about_work_or_study: 'ask_life_fact',
}

/*
 * Which of them a learner must own to be considered done with the LEVEL. Both of
 * arc 1's are `required` in the blueprint — but this list is not an exit
 * criterion and must not be mistaken for one: A1 has no exit criteria yet,
 * because six of its arcs do not exist. It records scope, so a later arc cannot
 * quietly demote a capability to optional.
 */
export const A1_REQUIRED_CAN_DOS = ['talk_about_work_or_study', 'ask_about_work_or_study']

/*
 * Understood, not produced. `at_the_office` and `at_university` are places other
 * people mention in the arc's listening turns; the learner is never asked to say
 * them, and nothing here counts them as production.
 */
export const A1_RECEPTIVE_ITEMS = ['at_the_office', 'at_university']

/*
 * Nothing yet. The arc's budget is small enough that everything it shows is
 * either produced or declared receptive above — the list exists so a later arc
 * has somewhere honest to put language it mentions without teaching.
 */
export const A1_INCIDENTAL_ITEMS = []

export const a1Episodes = () => episodesOfLevel(A1)

export const A1_ARC_CAN_DOS = [...new Set(a1Episodes().map(ep => ep.canDoId).filter(Boolean))]

/* Which episodes teach a capability — derived, never declared twice. */
export function a1EpisodesForCanDo(canDoId) {
  return a1Episodes().filter(ep => ep.canDoId === canDoId).map(ep => ep.id)
}

/*
 * The items an A1 capability is PRODUCED with, taken from the steps that ask the
 * learner to produce it. Structural, like Pre-A1's version: a step that only
 * shows an item does not count.
 */
export function a1ProductiveItemsOf(canDoId) {
  const intent = A1_CAN_DO_INTENT[canDoId]
  if (!intent) return []
  const out = new Set()
  for (const ep of a1Episodes()) {
    for (const step of ep.steps || []) {
      const producedHere = step.evalKind === intent
        || (step.turns || []).some(turn => turn.evalKind === intent)
      if (!producedHere) continue
      ;(step.itemIds || []).forEach(id => out.add(id))
      for (const turn of step.turns || []) (turn.itemIds || []).forEach(id => out.add(id))
    }
  }
  return [...out]
}

/*
 * A1's required core: the language a learner must be able to USE for the
 * capabilities this level requires. Scoped to A1's own episodes, so it can never
 * add anything to what Pre-A1 requires.
 */
export function a1RequiredLevelItems() {
  return [...new Set(A1_REQUIRED_CAN_DOS.flatMap(id => a1ProductiveItemsOf(id)))]
}

/*
 * How much of A1 exists. Reported honestly rather than as a boolean, because
 * "the level has content" and "the level is finished" are different facts and
 * conflating them is how a partially built level gets shown to a learner.
 */
export function a1ImplementationStatus() {
  const episodes = a1Episodes()
  return {
    runtimeArcs: [...new Set(episodes.map(ep => ep.arc))],
    runtimeEpisodes: episodes.map(ep => ep.id),
    canDos: A1_ARC_CAN_DOS,
    /* the design totals live in the blueprint; nothing here derives them */
    complete: false,
  }
}

/*
 * Which catalogue entries belong to A1.
 *
 * The vocabulary catalogue is shared by every level, so "how much language does
 * Pre-A1 ship" can only be answered by subtracting the levels above it. Declaring
 * A1's share here — derived from what its episodes grant and refer to, plus the
 * receptive and incidental lists — is what lets the Pre-A1 freeze stay exact while
 * the shelf they both sit on grows.
 */
export const A1_INTRODUCED_ITEMS = [
  'study', 'at_home', 'what_do_you_do', 'i_do_pattern', 'do_you_pattern',
  /* receptive: heard, never asked for */
  'at_the_office', 'at_university',
]

/*
 * Which catalogue entries THIS LEVEL ADDED. Declared rather than derived, and the
 * distinction matters: "everything A1 refers to" includes the Pre-A1 language it
 * reuses, and reuse must never move an item from one level's budget to another.
 * `work` is the example — it was already in the catalogue, unreferenced, and arc 1
 * is the first content that teaches it, so it stays Pre-A1's entry and A1 simply
 * grants it.
 */
export function a1ItemIds() {
  return new Set(A1_INTRODUCED_ITEMS)
}

export const a1EpisodeById = (id) => (SKELETON_BY_ID[id]?.level === 'A1' ? SKELETON_BY_ID[id] : null)
