/*
 * Chunk-naming indirection for C2 arc 5, same job and same reason as
 * `levels/c2/arcs/c2Arc1DenseInputSynthesisContent.js`: a dynamic import
 * through here names the build chunk after the arc it carries
 * (`c2Arc5ArgumentAndPositionContent-*.js`) instead of an anonymous
 * `index-*.js` hash. Adds no content and no runtime indirection.
 */
export { C2_ARC5, C2_ARC5_ID, getC2Arc5Episode } from './c2Arc5ArgumentAndPosition.js'
export { getC2Arc5Episode as getEpisode } from './c2Arc5ArgumentAndPosition.js'
