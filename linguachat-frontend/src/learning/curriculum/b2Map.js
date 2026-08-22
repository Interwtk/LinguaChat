/*
 * b2Map — what B2's implemented capabilities are, and nothing about Pre-A1,
 * A1, A2 or B1.
 *
 * Same idea as `a1Map.js`/`a2Map.js`/`b1Map.js`, one level up: a SEPARATE
 * file rather than a section of any level below it, so a freeze/audit for a
 * level below never silently starts counting a level above's language and
 * capabilities as its own.
 *
 * B2 is designed and implemented in full — six arcs, twenty-two episodes,
 * nineteen capabilities, authored under `src/learning/levels/b2/**` by
 * `LC-CONT-B2` — but stays `contentStatus: 'partial'`, `available: false`
 * (`levels.js`) until a later, deliberate completion gate, exactly the
 * distinction `levels.js`'s own comment draws between content existing and a
 * level being open.
 *
 * `B2_CAN_DO_INTENT` is imported directly from `levels/b2/b2Capabilities.js`
 * rather than copied, per that file's own header comment ("this export
 * exists here as the ready-to-register payload") and per
 * `curriculum/levelMaps.js`'s own "A NEW LEVEL'S OWN MAP FILE SHOULD"
 * instructions — B1's `curriculum/b1Map.js` keeps an independent copy only
 * because it needed a runtime rename `levels/b1/b1Map.js` itself did not
 * carry; B2's runtime rename (`state_opinion_with_reason` ->
 * `argue_opinion_with_reason`, see `b2Capabilities.js`'s own comment) is
 * already applied at the source, so no second copy is needed here.
 */
import { B2, episodesOfLevel } from './levels.js'
import { B2_CAN_DO_INTENT } from '../levels/b2/b2Capabilities.js'
import { B2_PATTERNS } from '../levels/b2/b2Patterns.js'
import { B2_VOCABULARY } from '../levels/b2/b2Vocabulary.js'

export { B2_CAN_DO_INTENT }

/* The arcs of B2, in the blueprint's order. */
export const B2_RUNTIME_ARCS = [
  'making_the_case', 'when_plans_go_wrong', 'what_if',
  'talking_around_a_subject', 'reading_between_the_lines', 'the_long_conversation',
]

export const b2Episodes = () => episodesOfLevel(B2)

/* Which of B2's own episodes teach a capability — derived, never declared twice. */
export function b2EpisodesForCanDo(canDoId) {
  return b2Episodes().filter(ep => ep.canDoId === canDoId).map(ep => ep.id)
}

/*
 * Which catalogue entries THIS LEVEL ADDED — every B2 pattern group
 * (`b2Patterns.js`, each one a single Garden-trackable unit per b2.md
 * section 6) plus every remaining B2 vocabulary item (`b2Vocabulary.js`).
 * Unlike B1's own introduced-items list, B2's ids carry no `b2_` prefix (the
 * level's own files mint plain ids like `opinion_stance_pattern`,
 * `id_say`), so this is derived directly from those two source files rather
 * than hand-duplicated — the same reasoning `a1Map.js`'s `A1_INTRODUCED_ITEMS`
 * gives for declaring rather than inferring: reuse must never move an item
 * from one level's budget to another. Nothing here is inferred from what an
 * episode happens to reference (which would also include B1 language B2
 * reuses via `skillPrerequisites`/`reuseSkills`, never a Garden grant).
 */
export const B2_INTRODUCED_ITEMS = [
  ...B2_PATTERNS.map((p) => p.id),
  ...B2_VOCABULARY.map((v) => v.id),
]

export function b2ItemIds() {
  return new Set(B2_INTRODUCED_ITEMS)
}
