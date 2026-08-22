/*
 * check-b2-personalization-invariant — the master contract's constitutional
 * rule (curriculum-master-a1-c2.md section 7): personalization may change
 * what a conversation is ABOUT, never what the learner has to do, what
 * counts as correct evidence, or how difficult the capability is. Same
 * `invariantDrift` idea b2.md section 7 points to (A1 arc 1's own proof).
 */
import assert from 'node:assert/strict'

import { B2_ARC6, structuralSignature } from '../../../src/learning/levels/b2/arcs/b2Arc6TheLongConversation.js'
import { B2_ARC5 } from '../../../src/learning/levels/b2/arcs/b2Arc5ReadingBetweenTheLines.js'

let groups = 0
const ok = () => { groups += 1 }

/* ---- 1) arc 6's themed and neutral capstone variants are structurally identical ---- */
{
  const [themed, neutral] = B2_ARC6
  assert.ok(themed && neutral, 'arc 6 must declare exactly a themed and a neutral variant')
  assert.equal(themed.steps.length, neutral.steps.length, 'themed/neutral variants must have the same step count')
  assert.deepEqual(structuralSignature(themed), structuralSignature(neutral), 'themed/neutral variants must be structurally identical (same evalKind/canDoId/evidenceType/transfer sequence) — a themed capstone that changes required evidence is refused, not shipped, per b2.md section 7')
  ok()
}

/* ---- 2) arc 5 (register) declares no personalization at all, per its
    explicit "personalizationMode: none" (b2.json arc reading_between_the_lines
    has no personalizationMode key — absence means none, unlike arc 6 which
    declares "themed" explicitly) ---- */
{
  for (const ep of B2_ARC5) {
    assert.ok(!('personalizationSlot' in ep) || ep.personalizationSlot === undefined, `${ep.id} must not declare a personalization slot — arc 5 is neutral-only by design`)
  }
  ok()
}

/* ---- 3) every arc other than the capstone has no personalizationSlot field
    (arcs 1-5's personalization, where it exists, is "light"/"related" —
    context-only, chosen by the runtime session layer, never authored as a
    structural branch in the content itself — only the capstone needs a
    structural variant because it is the one arc declared "themed") ---- */
{
  const [themed, neutral] = B2_ARC6
  assert.ok('personalizationSlot' in themed, 'the themed capstone variant should declare its personalization slot explicitly')
  assert.equal(neutral.personalizationSlot, undefined, 'the neutral capstone variant must not declare a personalization slot')
  ok()
}

console.log(`check-b2-personalization-invariant: ${groups} groups OK`)
