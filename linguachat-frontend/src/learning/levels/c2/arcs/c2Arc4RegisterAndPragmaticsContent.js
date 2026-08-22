/*
 * Chunk-naming indirection for C2 arc 4, same job and same reason as
 * `levels/c2/arcs/c2Arc1DenseInputSynthesisContent.js`: a dynamic import
 * through here names the build chunk after the arc it carries
 * (`c2Arc4RegisterAndPragmaticsContent-*.js`) instead of an anonymous
 * `index-*.js` hash. Adds no content and no runtime indirection.
 */
export { C2_ARC4, C2_ARC4_ID, getC2Arc4Episode } from './c2Arc4RegisterAndPragmatics.js'
export { getC2Arc4Episode as getEpisode } from './c2Arc4RegisterAndPragmatics.js'
