/*
 * The name of B1 arc 1's content chunk.
 *
 * Same job as `a1Arc1Content.js`/`a2Arc1Content.js` and the same reason: the
 * resolver loads a level's episodes with a dynamic import, Rollup names the
 * chunk after the module it imports, and a chunk called `index-*.js` is
 * indistinguishable from the application entry. Importing through here makes
 * the build output say which arc a chunk carries — `b1Arc1Content-*.js`.
 *
 * It adds no content and no runtime indirection.
 */
export { B1_ARC1, B1_ARC1_ID, getB1Arc1Episode } from '../levels/b1/episodes/b1Arc1.js'

/*
 * Every content module answers `getEpisode(id)`, whatever level or arc it holds.
 * The resolver asks that one question, so a new arc plugs in without the resolver
 * learning anything about it.
 */
export { getB1Arc1Episode as getEpisode } from '../levels/b1/episodes/b1Arc1.js'
