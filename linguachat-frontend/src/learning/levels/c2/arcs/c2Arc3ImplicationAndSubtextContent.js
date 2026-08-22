/*
 * Chunk-naming indirection for C2 arc 3, same job and same reason as
 * `levels/b2/arcs/b2Arc1MakingTheCaseContent.js` and
 * `levels/c2/arcs/c2Arc1DenseInputSynthesisContent.js`: a dynamic import
 * through here names the build chunk after the arc it carries
 * (`c2Arc3ImplicationAndSubtextContent-*.js`) instead of an anonymous
 * `index-*.js` hash. Adds no content and no runtime indirection.
 */
export { C2_ARC3, C2_ARC3_ID, getC2Arc3Episode } from './c2Arc3ImplicationAndSubtext.js'
export { getC2Arc3Episode as getEpisode } from './c2Arc3ImplicationAndSubtext.js'
