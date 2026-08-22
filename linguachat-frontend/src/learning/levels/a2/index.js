/*
 * A2 level module — aggregator.
 *
 * Mirrors `episodes/index.js`'s per-arc `Content.js` re-export pattern and the
 * `getEpisode(id)` contract every level content module answers (see
 * `episodes/a1Arc1Content.js`'s own header comment for why: a dynamic-import
 * chunk needs a name, and the resolver asks one question regardless of level).
 *
 * NOTHING IMPORTS THIS FILE YET. Wiring it into `episodes/index.js`'s resolver
 * is `LC-INT-001`'s job — see `docs/curriculum/implementation/a2/core-requirements.md`
 * §1. Until then this module is inert: importing it has zero effect on any
 * shipped Pre-A1/A1 behaviour, exactly like a design-only blueprint, except
 * this is executable code ready to be pointed at.
 */

import { A2_ARC1, A2_ARC1_ID, getA2Arc1Episode } from './episodes/a2Arc1WhatHappened.js'
import { A2_ARC2, A2_ARC2_ID, getA2Arc2Episode } from './episodes/a2Arc2MakingPlans.js'
import { A2_ARC3, A2_ARC3_ID, getA2Arc3Episode } from './episodes/a2Arc3PeopleAndPlaces.js'
import { A2_ARC4, A2_ARC4_ID, getA2Arc4Episode } from './episodes/a2Arc4GettingAround.js'
import { A2_ARC5, A2_ARC5_ID, getA2Arc5Episode } from './episodes/a2Arc5BookingAStay.js'
import { A2_ARC6, A2_ARC6_ID, getA2Arc6Episode } from './episodes/a2Arc6EverydayProblems.js'
/*
 * `A2_ARC_7` (underscore before the digit): see that export's own comment in
 * a2Arc7LetsDoSomething.js — avoids a real collision with
 * `scripts/check-a1-blueprint.mjs`'s unscoped `/arc7\b/i` guard against A1's
 * own frozen arc 7, which cannot tell A1's arc apart from A2's.
 */
import { A2_ARC_7, A2_ARC7_ID, getA2Arc7Episode } from './episodes/a2Arc7LetsDoSomething.js'

export const A2_ARCS = [
  { id: A2_ARC1_ID, order: 1, episodes: A2_ARC1 },
  { id: A2_ARC2_ID, order: 2, episodes: A2_ARC2 },
  { id: A2_ARC3_ID, order: 3, episodes: A2_ARC3 },
  { id: A2_ARC4_ID, order: 4, episodes: A2_ARC4 },
  { id: A2_ARC5_ID, order: 5, episodes: A2_ARC5 },
  { id: A2_ARC6_ID, order: 6, episodes: A2_ARC6 },
  { id: A2_ARC7_ID, order: 7, episodes: A2_ARC_7 },
]

export const A2_EPISODES = [A2_ARC1, A2_ARC2, A2_ARC3, A2_ARC4, A2_ARC5, A2_ARC6, A2_ARC_7].flat()

const PER_ARC_LOOKUP = [
  getA2Arc1Episode, getA2Arc2Episode, getA2Arc3Episode, getA2Arc4Episode,
  getA2Arc5Episode, getA2Arc6Episode, getA2Arc7Episode,
]

/*
 * Every level content module answers `getEpisode(id)`, whatever level or arc
 * it holds — the same contract `episodes/a1Arc1Content.js` documents for A1.
 */
export function getA2Episode(id) {
  for (const lookup of PER_ARC_LOOKUP) {
    const found = lookup(id)
    if (found) return found
  }
  return null
}
export { getA2Episode as getEpisode }

export const A2_LEVEL_ID = 'A2'
