/*
 * a1Arc7Content — the named door A1 arc 7's chunk is built from.
 *
 * Same pattern as `a1Arc6Content.js` (see that file's own comment) — imports
 * `levels/a1/episodes/makingArrangements.json` directly so this chunk carries
 * only arc 7, the level's closing arc. See
 * `docs/curriculum/implementation/a1/core-requirements.md` §0 for why the
 * content is JSON, and `scripts/check-a1-blueprint.mjs`'s updated allow-list/
 * denylist comments for how this task opened the arc on purpose.
 *
 * Every content module answers `getEpisode(id)`, whatever level or arc it holds.
 */
import A1_ARC_7_DATA from '../levels/a1/episodes/makingArrangements.json' with { type: 'json' }

export const A1_ARC_7 = A1_ARC_7_DATA
export const A1_ARC_7_ID = 'making_arrangements'
export const getA1Arc7Episode = (id) => A1_ARC_7.find((ep) => ep.id === id) || null
export { getA1Arc7Episode as getEpisode }
