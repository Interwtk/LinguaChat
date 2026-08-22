/*
 * check-c2-personalization-invariant — the master contract's constitutional
 * rule (curriculum-master-a1-c2.md section 7): personalization may change
 * what a conversation is ABOUT, never what the learner has to do, what
 * counts as correct evidence, or how difficult the capability is.
 *
 * C2's personalization design is deliberately lighter than B1/B2's own
 * capstone-only full-duplicate-episode variants (see c2Arc1's own header
 * comment): a single optional step per relevant episode, tagged
 * `personalizationVariant: true`, that is NEVER itself counted toward
 * independent/transfer evidence and NEVER changes the surrounding
 * evalKind/canDoId sequence. This script proves that invariant instead of
 * a structural-signature diff between two parallel episodes (there are
 * none in C2 — every arc is personalizationMode "themed"/"light"/"none",
 * never a themed/neutral variant pair).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { ALL_ARCS } from './check-c2-arc-content.mjs'

const blueprint = JSON.parse(readFileSync(new URL('../../../../docs/curriculum/blueprints/c2.json', import.meta.url), 'utf8'))

let groups = 0
const ok = () => { groups += 1 }

const personalizationModeByArc = Object.fromEntries(blueprint.arcs.map((a) => [a.id, a.personalizationMode]))

/* ---- 1) no episode declares a themed/neutral variant PAIR — C2 has no
    personalization-slot duplicate episodes, unlike B1/B2's capstones ---- */
{
  for (const episodes of Object.values(ALL_ARCS)) {
    for (const ep of episodes) {
      assert.ok(!('variant' in ep), `${ep.id} declares a 'variant' field — C2 arcs must not use B1/B2-style duplicate-episode personalization`)
    }
  }
  ok()
}

/* ---- 2) every personalizationVariant step is NEVER counted toward
    independent/transfer evidence (evidenceType must not be 'independent',
    and transfer must not be true) ---- */
{
  for (const episodes of Object.values(ALL_ARCS)) {
    for (const ep of episodes) {
      for (const step of ep.steps) {
        if (!step.personalizationVariant) continue
        assert.notEqual(step.evidenceType, 'independent', `${ep.id} personalizationVariant step must not count as independent evidence`)
        assert.notEqual(step.transfer, true, `${ep.id} personalizationVariant step must not count as transfer evidence`)
      }
    }
  }
  ok()
}

/* ---- 3) arcs whose blueprint personalizationMode is "none" carry ZERO
    personalizationVariant steps anywhere in their content ---- */
{
  for (const [arcId, episodes] of Object.entries(ALL_ARCS)) {
    if (personalizationModeByArc[arcId] !== 'none') continue
    for (const ep of episodes) {
      const hasVariant = ep.steps.some((s) => s.personalizationVariant)
      assert.ok(!hasVariant, `${ep.id} (arc ${arcId}, personalizationMode "none") must not carry any personalizationVariant step`)
    }
  }
  ok()
}

/* ---- 4) arcs whose blueprint personalizationMode is "light" carry AT MOST
    ONE personalizationVariant step across the whole arc (lighter than
    "themed", which may use one per teaching episode) ---- */
{
  for (const [arcId, episodes] of Object.entries(ALL_ARCS)) {
    if (personalizationModeByArc[arcId] !== 'light') continue
    const count = episodes.reduce((n, ep) => n + ep.steps.filter((s) => s.personalizationVariant).length, 0)
    assert.ok(count <= 1, `${arcId} is personalizationMode "light" but declares ${count} personalizationVariant steps (expected at most 1)`)
  }
  ok()
}

console.log(`check-c2-personalization-invariant: ${groups} groups OK`)
