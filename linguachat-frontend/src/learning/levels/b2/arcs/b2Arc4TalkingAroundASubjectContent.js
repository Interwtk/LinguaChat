/*
 * Chunk-naming indirection for B2 arc 4, same job and same reason as
 * `arcs/b2Arc1MakingTheCaseContent.js`: a dynamic import through here names
 * the build chunk after the arc it carries
 * (`b2Arc4TalkingAroundASubjectContent-*.js`) instead of an anonymous
 * `index-*.js` hash. Adds no content and no runtime indirection.
 */
export { B2_ARC4, B2_ARC4_ID, getB2Arc4Episode } from './b2Arc4TalkingAroundASubject.js'
export { getB2Arc4Episode as getEpisode } from './b2Arc4TalkingAroundASubject.js'
