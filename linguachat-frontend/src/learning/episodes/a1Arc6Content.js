/*
 * a1Arc6Content — the named door A1 arc 6's chunk is built from.
 *
 * Same pattern `preA1Content.js` and arcs 1-5 follow: the resolver imports this
 * module, so the build names the chunk after what it carries
 * (`a1Arc6Content-*.js`) rather than emitting another anonymous `index-*`, and
 * importing arc 6 must not download arc 7's prose. Unlike arcs 1-5, the content
 * itself is authored as data (`levels/a1/episodes/whatYouCanDo.json`), not a
 * `.js` module — see `docs/curriculum/implementation/a1/core-requirements.md`
 * §0 for why, and `scripts/check-a1-blueprint.mjs`'s updated allow-list/denylist
 * comments for how this task opened the arc on purpose. This wrapper imports
 * the JSON directly (not via `levels/a1/index.js`, which holds both arcs) so
 * this chunk carries only arc 6.
 *
 * Every content module answers `getEpisode(id)`, whatever level or arc it holds.
 */
import A1_ARC6_DATA from '../levels/a1/episodes/whatYouCanDo.json' with { type: 'json' }

export const A1_ARC6 = A1_ARC6_DATA
export const A1_ARC6_ID = 'what_you_can_do'
export const getA1Arc6Episode = (id) => A1_ARC6.find((ep) => ep.id === id) || null
export { getA1Arc6Episode as getEpisode }
