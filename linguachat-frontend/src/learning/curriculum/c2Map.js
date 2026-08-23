/*
 * c2Map — what C2's implemented capabilities are, and nothing about Pre-A1,
 * A1, A2, B1, B2 or C1.
 *
 * Same idea as `a1Map.js`/`a2Map.js`/`b1Map.js`/`b2Map.js`/`c1Map.js`, one
 * level up: a SEPARATE file rather than a section of any level below it, so
 * a freeze/audit for a level below never silently starts counting a level
 * above's language and capabilities as its own.
 *
 * C2 is designed and implemented in full — eight arcs, twenty-nine episodes,
 * twenty-two capabilities, authored under `src/learning/levels/c2/**` by
 * `LC-CONT-C2` — but stays `contentStatus: 'partial'`, `available: false`
 * (`levels.js`) until a later, deliberate completion gate, exactly the
 * distinction `levels.js`'s own comment draws between content existing and a
 * level being open. C2 is also the terminal level: that later gate is load
 * bearing for whatever "all seven levels complete" statement the product
 * eventually makes, and wiring the engine here is not that gate.
 *
 * `C2_CAN_DO_INTENT` is imported directly from `levels/c2/c2Capabilities.js`
 * rather than copied, per that file's own header comment ("this export
 * exists here as the ready-to-register payload") and per
 * `curriculum/levelMaps.js`'s own "A NEW LEVEL'S OWN MAP FILE SHOULD"
 * instructions.
 *
 * ON THE INTENT-REUSE COLLISION (design question the C2 core-engine handoff
 * doc explicitly left open, section 8.1): nine C2 capabilities reuse an
 * already-introduced intent id under a subtype
 * (`levels/c2/c2Intents.js`'s `C2_INTENT_SUBTYPES`), and `C2_CAN_DO_INTENT`
 * itself only carries `// subtype: x` as a documentation COMMENT, not a
 * structural `{ intent, subtype }` value — unlike B2's own map. This is a
 * deliberate choice, not an oversight: it follows C1's precedent, not B2's.
 * C1's own `C1_CAN_DO_INTENT` (`levels/c1/c1Capabilities.js`) reuses several
 * intents across TWO OR THREE capabilities with bare string values and zero
 * subtype disambiguation at all (`state_structured_argument`,
 * `extended_explanation` x4, `track_discourse` x3, ...), and its evaluators
 * (`levels/c1/evaluators.js`) branch on `ctx.canDoId` — always present on
 * every step already — rather than asking `canDoForIntent()` to resolve a
 * subtype. `qualify_claim` alone makes B2's `{intent,subtype}` shape
 * insufficient for C2 anyway: `soften_or_intensify_a_claim` and
 * `qualify_a_position_with_precision` share `qualify_claim` with NO subtype
 * at all (`c2Intents.js` gives `qualify_claim` a `reuseExamples` map keyed by
 * capabilityId instead of a `subtypes` array), so a subtype qualifier could
 * not disambiguate that pair regardless. `canDoForIntent()`'s existing
 * first-match-wins fallback for a subtype-less collision is therefore
 * accepted here exactly as C1 already accepts it for its own four-way
 * `extended_explanation` collision: `scaffolding.js`'s novelty check may
 * attribute a `qualify_claim` step to whichever of the two capabilities was
 * registered first (`soften_or_intensify_a_claim`), a soft scaffold-fidelity
 * gap, never a grading one — every evaluator dispatch itself reads
 * `ctx.canDoId` straight off the step, never through this lookup.
 */
import { C2, episodesOfLevel } from './levels.js'
import { C2_CAN_DO_INTENT } from '../levels/c2/c2Capabilities.js'
import { C2_PATTERNS } from '../levels/c2/c2Patterns.js'
import { C2_VOCABULARY } from '../levels/c2/c2Vocabulary.js'

export { C2_CAN_DO_INTENT }

/* The arcs of C2, in the blueprint's order. */
export const C2_RUNTIME_ARCS = [
  'dense_input_synthesis', 'precise_reformulation', 'implication_and_subtext',
  'register_and_pragmatics', 'argument_and_position', 'discourse_flexibility',
  'stylistic_control', 'integrated_mediation',
]

export const c2Episodes = () => episodesOfLevel(C2)

/* Which of C2's own episodes teach a capability — derived, never declared twice. */
export function c2EpisodesForCanDo(canDoId) {
  return c2Episodes().filter(ep => ep.canDoId === canDoId).map(ep => ep.id)
}

/*
 * Which catalogue entries THIS LEVEL ADDED — every C2 pattern
 * (`c2Patterns.js`, one per Garden-trackable unit, matching every earlier
 * level's convention) plus every remaining C2 vocabulary word
 * (`c2Vocabulary.js`, keyed by arc, `productive`/`receptive` x `core`/
 * `supplement`). Unlike B2/C1's own vocabulary files, `c2Vocabulary.js`
 * stores plain word/phrase strings rather than `{id, ...}` objects — the
 * literal word IS the id (confirmed against `levels/c2/arcs/**`'s own
 * `gardenItems`/`itemIds`, which grant these exact strings, e.g.
 * `'presumably'`, `'according to'`), so no `.id` projection is needed here.
 * Derived directly from those two source files rather than hand-duplicated —
 * the same reasoning `b2Map.js`/`c1Map.js`'s own `*_INTRODUCED_ITEMS` give:
 * reuse must never move an item from one level's budget to another. Nothing
 * here is inferred from what an episode happens to reference (which would
 * also include C1 language C2 reuses via `skillPrerequisites`/`reuseSkills`,
 * never a Garden grant).
 */
export const C2_INTRODUCED_ITEMS = [
  ...C2_PATTERNS.map((p) => p.id),
  ...Object.values(C2_VOCABULARY).flatMap((arc) => [
    ...arc.productive.core, ...arc.productive.supplement,
    ...arc.receptive.core, ...arc.receptive.supplement,
  ]),
]

export function c2ItemIds() {
  return new Set(C2_INTRODUCED_ITEMS)
}
