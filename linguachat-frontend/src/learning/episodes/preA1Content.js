/*
 * The name of Pre-A1's content chunk.
 *
 * The resolver loads a level's episodes with a dynamic import, and Rollup names
 * the resulting chunk after the module it imports. Importing `episodes/index.js`
 * directly produced a chunk called `index-*.js` — indistinguishable at a glance
 * from the application entry, which is also `index-*.js`, and which two build
 * checks duly mistook for it.
 *
 * So each level's content gets a named door instead. This file adds no content
 * and no indirection at runtime: it re-exports, and its only job is to make the
 * build say which level a chunk carries. A1's arcs will each get one of these,
 * and the build output will read as a list of levels rather than a list of
 * hashes.
 */
export { ARC, ARCS, getEpisode, episodesInArc } from './index.js'
