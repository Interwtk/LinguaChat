/*
 * Chunk-naming indirection for B2 arc 1, same job and same reason as
 * `episodes/a1Arc1Content.js` and `episodes/preA1Content.js`: a dynamic
 * import through here names the build chunk after the arc it carries
 * (`b2Arc1MakingTheCaseContent-*.js`) instead of an anonymous `index-*.js`
 * hash. Adds no content and no runtime indirection.
 */
export { B2_ARC1, B2_ARC1_ID, getB2Arc1Episode } from './b2Arc1MakingTheCase.js'
export { getB2Arc1Episode as getEpisode } from './b2Arc1MakingTheCase.js'
