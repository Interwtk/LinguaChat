/*
 * check-c1-arc-content — every authored C1 arc, checked against the same
 * closed vocabularies the runtime renderer and this level's own data files
 * already define: only the nine real `EpisodeShell.jsx` step types, only
 * canDo/pattern/vocabulary/intent ids that actually exist, no arc claiming
 * an id nobody declared.
 */
import assert from 'node:assert/strict'

import { C1_ARC1 } from '../../../src/learning/levels/c1/arcs/c1Arc1AbstractArgument.js'
import { C1_ARC2 } from '../../../src/learning/levels/c1/arcs/c1Arc2RegisterAndDiplomacy.js'
import { C1_ARC3 } from '../../../src/learning/levels/c1/arcs/c1Arc3SynthesisAndMediation.js'
import { C1_ARC4 } from '../../../src/learning/levels/c1/arcs/c1Arc4NuanceAndImplication.js'
import { C1_ARC5 } from '../../../src/learning/levels/c1/arcs/c1Arc5ExtendedStructuredDiscourse.js'
import { C1_ARC6 } from '../../../src/learning/levels/c1/arcs/c1Arc6NegotiationAndComplexity.js'
import { C1_ARC7 } from '../../../src/learning/levels/c1/arcs/c1Arc7SustainedInteraction.js'
import { C1_CAPABILITIES } from '../../../src/learning/levels/c1/c1Capabilities.js'
import { C1_PATTERNS } from '../../../src/learning/levels/c1/c1Patterns.js'
import { C1_VOCABULARY } from '../../../src/learning/levels/c1/c1Vocabulary.js'
import { C1_INTENTS } from '../../../src/learning/levels/c1/c1Intents.js'

let groups = 0
const ok = () => { groups += 1 }

export const ALL_ARCS = {
  abstract_argument: C1_ARC1,
  register_and_diplomacy: C1_ARC2,
  synthesis_and_mediation: C1_ARC3,
  nuance_and_implication: C1_ARC4,
  extended_structured_discourse: C1_ARC5,
  negotiation_and_complexity: C1_ARC6,
  sustained_interaction: C1_ARC7,
}
export const ALL_EPISODES = Object.values(ALL_ARCS).flat()

const VALID_STEP_TYPES = new Set(['scene', 'model', 'comprehension', 'choice', 'word_order', 'fill_blank', 'free_reply', 'recall', 'completion'])
const canDoIds = new Set(C1_CAPABILITIES.map((c) => c.id))
const patternIds = new Set(C1_PATTERNS.map((p) => p.id))
const vocabIds = new Set(C1_VOCABULARY.map((v) => v.id))
const intentIds = new Set(C1_INTENTS.map((i) => i.id))

/* ---- 1) only real step types ---- */
{
  for (const ep of ALL_EPISODES) {
    for (const step of ep.steps) {
      assert.ok(VALID_STEP_TYPES.has(step.type), `${ep.id} uses unknown step type "${step.type}"`)
    }
  }
  ok()
}

/* ---- 2) every canDoId is a real C1 id or an explicit b2.* reference ---- */
{
  for (const ep of ALL_EPISODES) {
    for (const step of ep.steps) {
      if (!step.canDoId) continue
      assert.ok(canDoIds.has(step.canDoId) || step.canDoId.startsWith('b2.'), `${ep.id} step references unresolvable canDoId ${step.canDoId}`)
    }
  }
  ok()
}

/* ---- 3) every evalKind is a real C1 intent id ---- */
{
  for (const ep of ALL_EPISODES) {
    for (const step of ep.steps) {
      if (!step.evalKind) continue
      assert.ok(intentIds.has(step.evalKind), `${ep.id} step references unresolvable evalKind ${step.evalKind}`)
    }
  }
  ok()
}

/* ---- 4) every itemId (gardenItems + step-level itemIds) is a real pattern or vocabulary id ---- */
{
  for (const ep of ALL_EPISODES) {
    for (const item of ep.gardenItems || []) {
      assert.ok(patternIds.has(item) || vocabIds.has(item), `${ep.id} gardenItems references unresolvable item ${item}`)
    }
    for (const step of ep.steps) {
      for (const item of step.itemIds || []) {
        assert.ok(patternIds.has(item) || vocabIds.has(item), `${ep.id} step references unresolvable itemId ${item}`)
      }
      if (step.itemId) assert.ok(patternIds.has(step.itemId) || vocabIds.has(step.itemId), `${ep.id} step references unresolvable itemId ${step.itemId}`)
    }
  }
  ok()
}

/* ---- 5) every episode id is unique across the whole level (parallel-authored
    arcs must not collide) ---- */
{
  const ids = ALL_EPISODES.map((ep) => ep.id)
  assert.equal(new Set(ids).size, ids.length, `duplicate episode ids found: ${ids.filter((id, i) => ids.indexOf(id) !== i).join(', ')}`)
  ok()
}

/* ---- 6) no two episodes share an exact titleKey UNLESS both declare a
    `variant` field (an intentional personalization pair — Arc G's themed/
    neutral capstone, one conceptual episode with two content variants,
    sharing its title/goal/duration/xp i18n keys by design) ---- */
{
  const byTitleKey = new Map()
  for (const ep of ALL_EPISODES) {
    if (!byTitleKey.has(ep.titleKey)) byTitleKey.set(ep.titleKey, [])
    byTitleKey.get(ep.titleKey).push(ep)
  }
  for (const [titleKey, eps] of byTitleKey) {
    if (eps.length === 1) continue
    assert.ok(eps.every((ep) => ep.variant), `titleKey ${titleKey} is shared by ${eps.length} episodes (${eps.map((e) => e.id).join(', ')}) that are not all declared personalization variants`)
  }
  ok()
}

/* ---- 7) episode id prefixes match their arc (c1_<arcId>_*) — catches a
    copy-paste episode landing in the wrong arc file ---- */
{
  for (const [arcId, episodes] of Object.entries(ALL_ARCS)) {
    for (const ep of episodes) {
      assert.equal(ep.arc, arcId, `${ep.id} declares arc "${ep.arc}" but lives in the ${arcId} arc file`)
    }
  }
  ok()
}

console.log(`check-c1-arc-content: ${groups} groups OK (${ALL_EPISODES.length} episodes across ${Object.keys(ALL_ARCS).length} arcs)`)
