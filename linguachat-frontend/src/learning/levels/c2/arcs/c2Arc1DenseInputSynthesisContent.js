/*
 * Chunk-naming indirection for C2 arc 1, same job and same reason as
 * `levels/b2/arcs/b2Arc1MakingTheCaseContent.js`: a dynamic import through
 * here names the build chunk after the arc it carries
 * (`c2Arc1DenseInputSynthesisContent-*.js`) instead of an anonymous
 * `index-*.js` hash. Adds no content and no runtime indirection.
 */
export { C2_ARC1, C2_ARC1_ID, getC2Arc1Episode } from './c2Arc1DenseInputSynthesis.js'
export { getC2Arc1Episode as getEpisode } from './c2Arc1DenseInputSynthesis.js'
