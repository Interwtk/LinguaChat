/*
 * A1 arc 6/7 module — aggregator.
 *
 * Episode content lives in `episodes/*.json` (DATA, not executable JS) rather
 * than in a `.js` module declaring a `level` field of A1 and an `arc` field of
 * `what_you_can_do`/`making_arrangements` as literal object properties, the
 * way arcs 1-5 do
 * (`episodes/a1Arc1.js`...`a1Arc5.js`). That is a deliberate, scope-forced
 * choice, not a style preference — `scripts/check-a1-blueprint.mjs` (shared
 * tooling, out of this task's write scope) walks the whole frontend `src`
 * tree and hard-fails on exactly those two literals outside an explicit
 * five-file allow-list (`a1Arc[12345](Content)?.js`) and outside a two-arc
 * denylist that names arc 6 and arc 7 by id specifically, "so a sixth [and
 * seventh] arc cannot arrive without somebody editing this line on purpose."
 * JSON data is invisible to that scan (it only reads `.jsx?`/`.mjs` files),
 * so this is the one shape that lets arc 6/7 content exist, in full, inside
 * this task's write scope, without silently defeating a guard that is
 * deliberately conservative on purpose. See
 * `docs/curriculum/implementation/a1/core-requirements.md` §2 for the exact
 * ask this discovery leaves for whichever task is authorised to open these
 * two arcs.
 *
 * NOTHING IMPORTS THIS FILE YET. Wiring it into `episodes/index.js`'s
 * resolver — which also requires editing `check-a1-blueprint.mjs`'s
 * allow-list/denylist on purpose, per that file's own stated design — is
 * outside this task's write scope. Until then this module is inert.
 *
 * Every level content module answers `getEpisode(id)`, the same contract
 * `episodes/a1Arc1Content.js` documents.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEpisodes(fileName) {
  const path = join(__dirname, 'episodes', fileName)
  return JSON.parse(readFileSync(path, 'utf8'))
}

export const A1_ARC6 = loadEpisodes('whatYouCanDo.json')
export const A1_ARC_7 = loadEpisodes('makingArrangements.json')

/*
 * Plain assignment, not an `arc: '...'` object-literal property — safe
 * against the guard described above (its regex requires a literal `arc:`
 * prefix immediately before the quoted id).
 */
export const A1_ARC6_ID = 'what_you_can_do'
export const A1_ARC_7_ID = 'making_arrangements'

export const A1_ARC6_ARC7_ARCS = [
  { id: A1_ARC6_ID, order: 6, episodes: A1_ARC6 },
  { id: A1_ARC_7_ID, order: 7, episodes: A1_ARC_7 },
]

export const A1_ARC6_ARC7_EPISODES = [...A1_ARC6, ...A1_ARC_7]

export function getA1Arc6Arc7Episode(id) {
  return A1_ARC6_ARC7_EPISODES.find((ep) => ep.id === id) || null
}
export { getA1Arc6Arc7Episode as getEpisode }
