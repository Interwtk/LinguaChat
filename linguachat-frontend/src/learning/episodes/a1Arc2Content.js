/*
 * a1Arc2Content — the named door A1 arc 2's chunk is built from.
 *
 * Exists for the same reason `a1Arc1Content.js` and `preA1Content.js` do: the
 * resolver imports this module, so the build names the chunk after what it
 * carries (`a1Arc2Content-*.js`) instead of emitting another anonymous `index-*`.
 * One module per arc is also what keeps the two A1 arcs apart — opening arc 2
 * must not download arc 1's prose.
 *
 * Every content module answers `getEpisode(id)`, whatever level or arc it holds;
 * that is the whole contract the resolver relies on.
 */
export { A1_ARC2, A1_ARC2_ID, getA1Arc2Episode } from './a1Arc2.js'
export { getA1Arc2Episode as getEpisode } from './a1Arc2.js'
