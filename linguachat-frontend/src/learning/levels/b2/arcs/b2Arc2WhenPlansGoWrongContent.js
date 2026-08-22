/*
 * Chunk-naming indirection for B2 arc 2, same job and same reason as
 * `b2Arc1MakingTheCaseContent.js`: a dynamic import through here names the
 * build chunk after the arc it carries (`b2Arc2WhenPlansGoWrongContent-*.js`)
 * instead of an anonymous `index-*.js` hash. Adds no content and no runtime
 * indirection.
 */
export { B2_ARC2, B2_ARC2_ID, getB2Arc2Episode } from './b2Arc2WhenPlansGoWrong.js'
export { getB2Arc2Episode as getEpisode } from './b2Arc2WhenPlansGoWrong.js'
