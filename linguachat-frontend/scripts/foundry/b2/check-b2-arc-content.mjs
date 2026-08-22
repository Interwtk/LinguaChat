/*
 * check-b2-arc-content — every authored B2 arc, checked against the same
 * closed vocabularies the runtime renderer and this level's own data files
 * already define: only the nine real `EpisodeShell.jsx` step types, only
 * canDo/pattern/vocabulary/intent ids that actually exist, no arc claiming
 * an id nobody declared.
 */
import assert from 'node:assert/strict'

import { B2_ARC1 } from '../../../src/learning/levels/b2/arcs/b2Arc1MakingTheCase.js'
import { B2_ARC2 } from '../../../src/learning/levels/b2/arcs/b2Arc2WhenPlansGoWrong.js'
import { B2_ARC3 } from '../../../src/learning/levels/b2/arcs/b2Arc3WhatIf.js'
import { B2_ARC4 } from '../../../src/learning/levels/b2/arcs/b2Arc4TalkingAroundASubject.js'
import { B2_ARC5 } from '../../../src/learning/levels/b2/arcs/b2Arc5ReadingBetweenTheLines.js'
import { B2_ARC6 } from '../../../src/learning/levels/b2/arcs/b2Arc6TheLongConversation.js'
import { B2_CAN_DOS } from '../../../src/learning/levels/b2/b2Capabilities.js'
import { B2_PATTERNS } from '../../../src/learning/levels/b2/b2Patterns.js'
import { B2_VOCABULARY } from '../../../src/learning/levels/b2/b2Vocabulary.js'
import { B2_INTENTS } from '../../../src/learning/levels/b2/b2Intents.js'

let groups = 0
const ok = () => { groups += 1 }

export const ALL_ARCS = { making_the_case: B2_ARC1, when_plans_go_wrong: B2_ARC2, what_if: B2_ARC3, talking_around_a_subject: B2_ARC4, reading_between_the_lines: B2_ARC5, the_long_conversation: B2_ARC6 }
export const ALL_EPISODES = Object.values(ALL_ARCS).flat()

const VALID_STEP_TYPES = new Set(['scene', 'model', 'comprehension', 'choice', 'word_order', 'fill_blank', 'free_reply', 'recall', 'completion'])
const canDoIds = new Set(B2_CAN_DOS.map((c) => c.id))
const patternIds = new Set(B2_PATTERNS.map((p) => p.id))
const vocabIds = new Set(B2_VOCABULARY.map((v) => v.id))
const intentIds = new Set(B2_INTENTS.map((i) => i.id))

/* ---- 1) only real step types ---- */
{
  for (const ep of ALL_EPISODES) {
    for (const step of ep.steps) {
      assert.ok(VALID_STEP_TYPES.has(step.type), `${ep.id} uses unknown step type "${step.type}"`)
    }
  }
  ok()
}

/* ---- 2) every canDoId is a real B2 id or an explicit b1.* reference ---- */
{
  for (const ep of ALL_EPISODES) {
    for (const step of ep.steps) {
      if (!step.canDoId) continue
      assert.ok(canDoIds.has(step.canDoId) || step.canDoId.startsWith('b1.'), `${ep.id} step references unresolvable canDoId ${step.canDoId}`)
    }
  }
  ok()
}

/* ---- 3) every evalKind is a real B2 intent id ---- */
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

/* ---- 6) every episode's i18n key namespace (instructionKey/titleKey prefixes)
    does not collide with another episode's — cheap heuristic: no two
    episodes share an exact titleKey ---- */
{
  const titleKeys = ALL_EPISODES.map((ep) => ep.titleKey)
  assert.equal(new Set(titleKeys).size, titleKeys.length, 'duplicate titleKey across episodes')
  ok()
}

console.log(`check-b2-arc-content: ${groups} groups OK (${ALL_EPISODES.length} episodes across ${Object.keys(ALL_ARCS).length} arcs)`)
