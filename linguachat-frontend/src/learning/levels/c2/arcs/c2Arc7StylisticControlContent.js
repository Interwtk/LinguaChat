/*
 * Chunk-naming indirection for C2 arc 7, same job and same reason as
 * `levels/b2/arcs/b2Arc1MakingTheCaseContent.js`: a dynamic import through
 * here names the build chunk after the arc it carries
 * (`c2Arc7StylisticControlContent-*.js`) instead of an anonymous
 * `index-*.js` hash. Adds no content and no runtime indirection.
 */
export { C2_ARC7, C2_ARC7_ID, getC2Arc7Episode } from './c2Arc7StylisticControl.js'
export { getC2Arc7Episode as getEpisode } from './c2Arc7StylisticControl.js'
