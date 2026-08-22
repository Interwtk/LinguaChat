/*
 * check-c1-personalization-invariant — the master contract's constitutional
 * rule (curriculum-master-a1-c2.md section 7): personalization may change
 * what a conversation is ABOUT, never what the learner has to do, what
 * counts as correct evidence, or how difficult the capability is. Same
 * `invariantDrift`/`structuralSignature` idea `check-b2-personalization-invariant.mjs`
 * uses for B2's arc 6.
 */
import assert from 'node:assert/strict'

import { C1_ARC_7, structuralSignature } from '../../../src/learning/levels/c1/arcs/c1Arc7SustainedInteraction.js'
import { C1_ARC2 } from '../../../src/learning/levels/c1/arcs/c1Arc2RegisterAndDiplomacy.js'
import { C1_ARC4 } from '../../../src/learning/levels/c1/arcs/c1Arc4NuanceAndImplication.js'

let groups = 0
const ok = () => { groups += 1 }

/* ---- 1) Arc G's themed and neutral capstone variants are structurally identical ---- */
{
  const themed = C1_ARC_7.find((ep) => ep.variant === 'themed')
  const neutral = C1_ARC_7.find((ep) => ep.variant === 'neutral')
  assert.ok(themed && neutral, 'Arc G must declare exactly a themed and a neutral capstone variant')
  assert.equal(themed.steps.length, neutral.steps.length, 'themed/neutral variants must have the same step count')
  assert.deepEqual(structuralSignature(themed), structuralSignature(neutral), 'themed/neutral variants must be structurally identical (same canDoId/evalKind/evidenceType/transfer sequence) — a themed capstone that changes required evidence is refused, not shipped, per c1.md section 7')
  ok()
}

/* ---- 2) Arc B (register_and_diplomacy) and Arc D (nuance_and_implication)
    declare NO personalization at all, per their explicit
    `personalizationMode: none` (c1.json arcs `register_and_diplomacy` and
    `nuance_and_implication`) ---- */
{
  for (const ep of [...C1_ARC2, ...C1_ARC4]) {
    assert.ok(!('personalizationSlot' in ep) || ep.personalizationSlot === undefined, `${ep.id} must not declare a personalization slot — its arc is neutral-only by design`)
  }
  ok()
}

/* ---- 3) only Arc G's capstone pair declares a structural personalizationSlot
    — arcs 1/3/5/6's "light" personalization (interest-adjacent topic
    choice) is context-only, chosen by the runtime session layer, never
    authored as a structural branch in the content itself; only the one arc
    declared "themed" needs a structural variant ---- */
{
  const themed = C1_ARC_7.find((ep) => ep.variant === 'themed')
  const neutral = C1_ARC_7.find((ep) => ep.variant === 'neutral')
  assert.ok('personalizationSlot' in themed, 'the themed capstone variant should declare its personalization slot explicitly')
  assert.equal(neutral.personalizationSlot.theme, null, 'the neutral capstone variant must declare no theme')
  ok()
}

console.log(`check-c1-personalization-invariant: ${groups} groups OK`)
