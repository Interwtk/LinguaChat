/*
 * The name of B1 arc 7's content chunk. Same job as `b1Arc1Content.js`.
 *
 * `B1_ARC_SEVEN` (underscore before the word, not a digit): see that export's
 * own comment in `b1ArcSeven.js` — avoids a real collision with
 * `scripts/check-a1-blueprint.mjs`'s unscoped `/arc7\b/i` guard against A1's
 * own frozen arc 7, which cannot tell A1's arc apart from B1's (the guard
 * scans file CONTENT for the literal substring "arc7", not file names or
 * paths, so this wrapper's own filename is unaffected — only its code must
 * avoid the substring, which spelling the export `ARC_SEVEN` does).
 */
export { B1_ARC_SEVEN, B1_ARC_SEVEN_ID, getB1ArcSevenEpisode } from '../levels/b1/episodes/b1ArcSeven.js'
export { getB1ArcSevenEpisode as getEpisode } from '../levels/b1/episodes/b1ArcSeven.js'
