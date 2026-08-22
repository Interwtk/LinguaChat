/*
 * Chunk-naming indirection for B2 arc 5, same job and same reason as
 * `episodes/a1Arc1Content.js` and `episodes/preA1Content.js`: a dynamic
 * import through here names the build chunk after the arc it carries
 * (`b2Arc5ReadingBetweenTheLinesContent-*.js`) instead of an anonymous
 * `index-*.js` hash. Adds no content and no runtime indirection.
 */
export { B2_ARC5, B2_ARC5_ID, getB2Arc5Episode } from './b2Arc5ReadingBetweenTheLines.js'
export { getB2Arc5Episode as getEpisode } from './b2Arc5ReadingBetweenTheLines.js'
