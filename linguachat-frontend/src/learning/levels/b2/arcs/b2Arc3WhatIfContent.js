/*
 * Chunk-naming indirection for B2 arc 3, same job and same reason as
 * `b2Arc1MakingTheCaseContent.js`: a dynamic import through here names the
 * build chunk after the arc it carries (`b2Arc3WhatIfContent-*.js`) instead
 * of an anonymous `index-*.js` hash. Adds no content and no runtime
 * indirection.
 */
export { B2_ARC3, B2_ARC3_ID, getB2Arc3Episode } from './b2Arc3WhatIf.js'
export { getB2Arc3Episode as getEpisode } from './b2Arc3WhatIf.js'
