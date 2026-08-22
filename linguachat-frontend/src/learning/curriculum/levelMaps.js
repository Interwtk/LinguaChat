/*
 * levelMaps — the one place that knows every level's own capability-to-intent
 * map exists, so a shared consumer can ask "what capability teaches this
 * intent" without hardcoding one level's map file by name.
 *
 * Before this file, `scaffolding.js` imported `CAN_DO_INTENT` directly from
 * `preA1Map.js` and used it as if it were the whole curriculum's answer. That
 * was silently wrong the moment A1 shipped its own intents (`state_life_fact`,
 * `ask_life_fact`, ...): any lookup for one of A1's own capabilities returned
 * `null`, and `scaffolding.js`'s own novelty check (`canDoForIntent`) treats a
 * `null` result as "no capability owns this intent" — quietly disabling
 * A1's novelty-based support scaling for its own original intents, not just
 * failing loudly. This file exists so that bug class cannot recur: a new
 * level's map registers itself here once, and every shared consumer reads the
 * merged view instead of one level's file by name.
 *
 * A NEW LEVEL'S OWN MAP FILE (e.g. `a2Map.js`) SHOULD:
 *   1. export its own `<LEVEL>_CAN_DO_INTENT` object, one intent per can-do,
 *      exactly like `preA1Map.js` and `a1Map.js` already do — a value is
 *      normally a bare intent-id string, or `{ intent, subtype }` for a
 *      can-do that reuses another can-do's intent under a subtype (see
 *      `canDoForIntent()`'s own comment below);
 *   2. add one entry to `LEVEL_CAN_DO_INTENT_MAPS` below, `{ levelId, canDoIntent }`.
 * Nothing else in this file, or in any shared consumer, needs to change.
 *
 * This registry answers "what capability owns this intent" across every
 * registered level. It does NOT resolve collisions — a capability id or an
 * intent reused across two levels with incompatible meaning is a curriculum
 * defect (see `docs/curriculum/cross-level-audit.json`), not something this
 * module can silently paper over. `scripts/check-cross-level-ids.mjs` is the
 * dedicated collision detector; it imports this same registry so the two
 * never drift apart.
 */
import { PRE_A1, A1, A2, B1, B2 } from './levels.js'
import { CAN_DO_INTENT as PRE_A1_CAN_DO_INTENT } from './preA1Map.js'
import { A1_CAN_DO_INTENT } from './a1Map.js'
import { A2_CAN_DO_INTENT } from './a2Map.js'
import { B1_CAN_DO_INTENT } from './b1Map.js'
import { B2_CAN_DO_INTENT } from './b2Map.js'

export const LEVEL_CAN_DO_INTENT_MAPS = [
  { levelId: PRE_A1, canDoIntent: PRE_A1_CAN_DO_INTENT },
  { levelId: A1, canDoIntent: A1_CAN_DO_INTENT },
  { levelId: A2, canDoIntent: A2_CAN_DO_INTENT },
  { levelId: B1, canDoIntent: B1_CAN_DO_INTENT },
  { levelId: B2, canDoIntent: B2_CAN_DO_INTENT },
]

/*
 * A map entry's value is either a bare intent-id string (the common case —
 * one intent, one can-do) or `{ intent, subtype }` (a can-do that reuses
 * another can-do's intent for a genuinely different communicative function,
 * distinguished only by subtype — B2's capstone is the first real case, see
 * `levels/b2/b2Capabilities.js`'s own comment on `B2_CAN_DO_INTENT`).
 */
const intentOf = (value) => (typeof value === 'string' ? value : value?.intent ?? null)
const subtypeOf = (value) => (typeof value === 'string' ? null : value?.subtype ?? null)

/*
 * Every {canDoId, intent, subtype, levelId} quadruple across every
 * registered level, in registration order. Built once at module load, not
 * per call, since the source maps are static imports.
 */
const ALL_ENTRIES = LEVEL_CAN_DO_INTENT_MAPS.flatMap(({ levelId, canDoIntent }) =>
  Object.entries(canDoIntent).map(([canDoId, value]) =>
    ({ canDoId, intent: intentOf(value), subtype: subtypeOf(value), levelId })))

/*
 * The can-do that carries an intent, searched across every registered level.
 *
 * Until B2's capstone, one intent always mapped to exactly one can-do, and
 * "first match wins by registration order" was a safe simplification. B2
 * breaks that: `shift_register` alone now names THREE different can-dos
 * (`adjust_register_to_context` with no subtype, plus
 * `sustain_a_multi_topic_conversation`/`handle_a_topic_shift_gracefully`
 * both under subtype `topic_shift`), and `propose_a_resolution` names two
 * (`negotiate_a_resolution` with no subtype, `negotiate_an_agreement_under_pushback`
 * under subtype `pushback`). A naive first-match lookup would silently
 * resolve every capstone reuse to the base (no-subtype) can-do, which is
 * exactly the defect this optional second argument fixes.
 *
 * Resolution order, called with a `subtype`:
 *   1. an entry matching BOTH `intent` and `subtype` exactly;
 *   2. falling back to the base (no-subtype) entry for that intent, so
 *      every existing subtype-unaware call site keeps its old answer;
 *   3. falling back to the first entry for that intent at all, so a
 *      capstone-only intent with no base entry still resolves to something
 *      rather than null.
 * Called with no subtype (every pre-B2 call site), behaviour is byte-for-byte
 * identical to before: every existing level's values are bare strings, so
 * every entry's `subtype` is `null` and step 2 always wins on the first
 * registered (no-subtype) match — still `check-cross-level-ids.mjs`'s job to
 * refuse two DIFFERENT can-dos of the SAME level sharing one intent+subtype
 * pair, an id collision this function does not itself judge.
 */
export const canDoForIntent = (intent, subtype = null) => {
  if (subtype) {
    const withSubtype = ALL_ENTRIES.find(e => e.intent === intent && e.subtype === subtype)
    if (withSubtype) return withSubtype.canDoId
  }
  return ALL_ENTRIES.find(e => e.intent === intent && !e.subtype)?.canDoId
    ?? ALL_ENTRIES.find(e => e.intent === intent)?.canDoId
    ?? null
}

/* The level a given can-do id is registered under, or null if none owns it. */
export const levelOfCanDo = (canDoId) =>
  ALL_ENTRIES.find(e => e.canDoId === canDoId)?.levelId || null
