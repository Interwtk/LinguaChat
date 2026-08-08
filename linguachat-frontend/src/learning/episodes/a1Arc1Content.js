/*
 * The name of A1 arc 1's content chunk.
 *
 * Same job as `preA1Content.js` and the same reason: the resolver loads a level's
 * episodes with a dynamic import, Rollup names the chunk after the module it
 * imports, and a chunk called `index-*.js` is indistinguishable from the
 * application entry. Importing through here makes the build output say which arc
 * a chunk carries — `a1Arc1Content-*.js` — so a reader of `dist/` sees a list of
 * arcs instead of a list of hashes.
 *
 * It adds no content and no runtime indirection. Each later A1 arc gets one of
 * these, which is also what keeps arc 2 out of this chunk when it exists.
 */
export { A1_ARC1, A1_ARC1_ID, getA1Arc1Episode } from './a1Arc1.js'

/*
 * Every content module answers `getEpisode(id)`, whatever level or arc it holds.
 * The resolver asks that one question, so a new arc plugs in without the resolver
 * learning anything about it.
 */
export { getA1Arc1Episode as getEpisode } from './a1Arc1.js'
