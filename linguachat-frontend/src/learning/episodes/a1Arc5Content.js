/*
 * a1Arc5Content — the named door A1 arc 5's chunk is built from.
 *
 * Fifth use of the same pattern `preA1Content.js` and the four A1 arcs before it
 * follow: the resolver imports this module, so the build names the chunk after what
 * it carries (`a1Arc5Content-*.js`) rather than emitting another anonymous `index-*`.
 * One module per arc is also what keeps the five arcs apart — running arc 5 must not
 * download arc 1's, arc 2's, arc 3's or arc 4's prose.
 *
 * Every content module answers `getEpisode(id)`, whatever level or arc it holds.
 */
export { A1_ARC5, A1_ARC5_ID, getA1Arc5Episode } from './a1Arc5.js'
export { getA1Arc5Episode as getEpisode } from './a1Arc5.js'
