/*
 * c1Map — what C1's implemented capabilities are, and nothing about Pre-A1,
 * A1, A2, B1 or B2.
 *
 * Same idea as `a1Map.js`/`a2Map.js`/`b1Map.js`/`b2Map.js`, one level up: a
 * SEPARATE file rather than a section of any level below it, so a
 * freeze/audit for a level below never silently starts counting a level
 * above's language and capabilities as its own.
 *
 * C1 is designed and implemented in full — seven arcs, thirty-six episodes,
 * twenty-eight capabilities, authored under `src/learning/levels/c1/**` by
 * `LC-CONT-C1` — but stays `contentStatus: 'partial'`, `available: false`
 * (`levels.js`) until a later, deliberate completion gate, exactly the
 * distinction `levels.js`'s own comment draws between content existing and a
 * level being open.
 *
 * `C1_CAN_DO_INTENT` is imported directly from `levels/c1/c1Capabilities.js`
 * rather than copied, per that file's own header comment ("this export
 * exists here as the ready-to-register payload") and per
 * `curriculum/levelMaps.js`'s own "A NEW LEVEL'S OWN MAP FILE SHOULD"
 * instructions — the same precedent `b2Map.js` already set (B1's own
 * `curriculum/b1Map.js` keeps an independent copy only because it needed a
 * runtime rename `levels/b1/b1Map.js` itself did not carry; C1, like B2,
 * needs no such rename).
 */
import { C1, episodesOfLevel } from './levels.js'
import { C1_CAN_DO_INTENT } from '../levels/c1/c1Capabilities.js'
import { C1_PATTERNS } from '../levels/c1/c1Patterns.js'
import { C1_VOCABULARY } from '../levels/c1/c1Vocabulary.js'

export { C1_CAN_DO_INTENT }

/* The arcs of C1, in the blueprint's order. */
export const C1_RUNTIME_ARCS = [
  'abstract_argument', 'register_and_diplomacy', 'synthesis_and_mediation',
  'nuance_and_implication', 'extended_structured_discourse', 'negotiation_and_complexity',
  'sustained_interaction',
]

export const c1Episodes = () => episodesOfLevel(C1)

/* Which of C1's own episodes teach a capability — derived, never declared twice. */
export function c1EpisodesForCanDo(canDoId) {
  return c1Episodes().filter(ep => ep.canDoId === canDoId).map(ep => ep.id)
}

/*
 * Which catalogue entries THIS LEVEL ADDED — every C1 pattern group
 * (`c1Patterns.js`, each one a single Garden-trackable unit per c1.md's own
 * convention) plus every remaining C1 vocabulary item (`c1Vocabulary.js`).
 * Derived directly from those two source files rather than hand-duplicated —
 * the same reasoning `b2Map.js`'s own `B2_INTRODUCED_ITEMS` gives: reuse
 * must never move an item from one level's budget to another. Nothing here
 * is inferred from what an episode happens to reference (which would also
 * include lower-level language C1 reuses via `skillPrerequisites`/
 * `reuseSkills`, never a Garden grant).
 */
export const C1_INTRODUCED_ITEMS = [
  ...C1_PATTERNS.map((p) => p.id),
  ...C1_VOCABULARY.map((v) => v.id),
]

export function c1ItemIds() {
  return new Set(C1_INTRODUCED_ITEMS)
}
