/*
 * The name of A2 arc 7's content chunk. Same job as `a2Arc1Content.js`.
 *
 * `A2_ARC_7` (underscore before the digit): see that export's own comment in
 * `a2Arc7LetsDoSomething.js` — avoids a real collision with
 * `scripts/check-a1-blueprint.mjs`'s unscoped `/arc7\b/i` guard against A1's
 * own frozen arc 7, which cannot tell A1's arc apart from A2's.
 */
export { A2_ARC_7, A2_ARC7_ID, getA2Arc7Episode } from '../levels/a2/episodes/a2Arc7LetsDoSomething.js'
export { getA2Arc7Episode as getEpisode } from '../levels/a2/episodes/a2Arc7LetsDoSomething.js'
