/*
 * a1Arc4Content — the named door A1 arc 4's chunk is built from.
 *
 * Fourth use of the same pattern `preA1Content.js` and the three A1 arcs before it
 * follow: the resolver imports this module, so the build names the chunk after what
 * it carries (`a1Arc4Content-*.js`) rather than emitting another anonymous `index-*`.
 * One module per arc is also what keeps the four arcs apart — running arc 4 must not
 * download arc 1's, arc 2's or arc 3's prose.
 *
 * Every content module answers `getEpisode(id)`, whatever level or arc it holds.
 */
export { A1_ARC4, A1_ARC4_ID, getA1Arc4Episode } from './a1Arc4.js'
export { getA1Arc4Episode as getEpisode } from './a1Arc4.js'
