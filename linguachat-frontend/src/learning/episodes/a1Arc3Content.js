/*
 * a1Arc3Content — the named door A1 arc 3's chunk is built from.
 *
 * Third use of the same pattern `preA1Content.js` and the two A1 arcs before it
 * follow: the resolver imports this module, so the build names the chunk after what
 * it carries (`a1Arc3Content-*.js`) rather than emitting another anonymous `index-*`.
 * One module per arc is also what keeps the three arcs apart — running arc 3 must not
 * download arc 1's or arc 2's prose.
 *
 * Every content module answers `getEpisode(id)`, whatever level or arc it holds.
 */
export { A1_ARC3, A1_ARC3_ID, getA1Arc3Episode } from './a1Arc3.js'
export { getA1Arc3Episode as getEpisode } from './a1Arc3.js'
