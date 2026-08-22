/*
 * Chunk-naming indirection for C1 arc 1, same job and same reason as
 * `arcs/b2Arc1MakingTheCaseContent.js`: a dynamic import through here names
 * the build chunk after the arc it carries (`c1Arc1AbstractArgumentContent-*.js`)
 * instead of an anonymous `index-*.js` hash. Adds no content and no runtime
 * indirection.
 */
export { C1_ARC1, C1_ARC1_ID, getC1Arc1Episode } from './c1Arc1AbstractArgument.js'
export { getC1Arc1Episode as getEpisode } from './c1Arc1AbstractArgument.js'
