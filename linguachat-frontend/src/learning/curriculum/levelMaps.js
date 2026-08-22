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
 *      exactly like `preA1Map.js` and `a1Map.js` already do;
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
import { PRE_A1, A1, A2 } from './levels.js'
import { CAN_DO_INTENT as PRE_A1_CAN_DO_INTENT } from './preA1Map.js'
import { A1_CAN_DO_INTENT } from './a1Map.js'
import { A2_CAN_DO_INTENT } from './a2Map.js'

export const LEVEL_CAN_DO_INTENT_MAPS = [
  { levelId: PRE_A1, canDoIntent: PRE_A1_CAN_DO_INTENT },
  { levelId: A1, canDoIntent: A1_CAN_DO_INTENT },
  { levelId: A2, canDoIntent: A2_CAN_DO_INTENT },
]

/*
 * Every {canDoId, intent, levelId} triple across every registered level, in
 * registration order. Built once at module load, not per call, since the
 * source maps are static imports.
 */
const ALL_ENTRIES = LEVEL_CAN_DO_INTENT_MAPS.flatMap(({ levelId, canDoIntent }) =>
  Object.entries(canDoIntent).map(([canDoId, intent]) => ({ canDoId, intent, levelId })))

/*
 * The can-do that carries an intent, searched across every registered level.
 * First match wins by registration order — today that is curricular order
 * (Pre-A1 before A1), which only matters if two levels ever reused the same
 * intent for two different can-dos, and that is exactly the shape of defect
 * `check-cross-level-ids.mjs` refuses to let land.
 */
export const canDoForIntent = (intent) =>
  ALL_ENTRIES.find(e => e.intent === intent)?.canDoId || null

/* The level a given can-do id is registered under, or null if none owns it. */
export const levelOfCanDo = (canDoId) =>
  ALL_ENTRIES.find(e => e.canDoId === canDoId)?.levelId || null
