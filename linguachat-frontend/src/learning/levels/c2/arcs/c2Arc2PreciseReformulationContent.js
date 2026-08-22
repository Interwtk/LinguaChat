/*
 * Chunk-naming indirection for C2 arc 2, same job and same reason as
 * `levels/c2/arcs/c2Arc1DenseInputSynthesisContent.js`: a dynamic import
 * through here names the build chunk after the arc it carries
 * (`c2Arc2PreciseReformulationContent-*.js`) instead of an anonymous
 * `index-*.js` hash. Adds no content and no runtime indirection.
 */
export { C2_ARC2, C2_ARC2_ID, getC2Arc2Episode } from './c2Arc2PreciseReformulation.js'
export { getC2Arc2Episode as getEpisode } from './c2Arc2PreciseReformulation.js'
