/*
 * The name of A2 arc 1's content chunk.
 *
 * Same job as `a1Arc1Content.js` and the same reason: the resolver loads a
 * level's episodes with a dynamic import, Rollup names the chunk after the
 * module it imports, and a chunk called `index-*.js` is indistinguishable
 * from the application entry. Importing through here makes the build output
 * say which arc a chunk carries — `a2Arc1Content-*.js`.
 *
 * It adds no content and no runtime indirection.
 */
export { A2_ARC1, A2_ARC1_ID, getA2Arc1Episode } from '../levels/a2/episodes/a2Arc1WhatHappened.js'

/*
 * Every content module answers `getEpisode(id)`, whatever level or arc it holds.
 * The resolver asks that one question, so a new arc plugs in without the resolver
 * learning anything about it.
 */
export { getA2Arc1Episode as getEpisode } from '../levels/a2/episodes/a2Arc1WhatHappened.js'
