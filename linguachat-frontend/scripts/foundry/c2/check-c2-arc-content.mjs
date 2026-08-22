/*
 * check-c2-arc-content — every authored C2 arc, checked against the same
 * closed vocabularies the runtime renderer and this level's own data files
 * already define: only the nine real `EpisodeShell.jsx` step types, only
 * canDo/pattern/vocabulary/intent ids that actually exist, no arc claiming
 * an id nobody declared.
 */
import assert from 'node:assert/strict'

import { C2_ARC1 } from '../../../src/learning/levels/c2/arcs/c2Arc1DenseInputSynthesis.js'
import { C2_ARC2 } from '../../../src/learning/levels/c2/arcs/c2Arc2PreciseReformulation.js'
import { C2_ARC3 } from '../../../src/learning/levels/c2/arcs/c2Arc3ImplicationAndSubtext.js'
import { C2_ARC4 } from '../../../src/learning/levels/c2/arcs/c2Arc4RegisterAndPragmatics.js'
import { C2_ARC5 } from '../../../src/learning/levels/c2/arcs/c2Arc5ArgumentAndPosition.js'
import { C2_ARC6 } from '../../../src/learning/levels/c2/arcs/c2Arc6DiscourseFlexibility.js'
import { C2_ARC7_EPISODES } from '../../../src/learning/levels/c2/arcs/c2Arc7StylisticControl.js'
import { C2_ARC8 } from '../../../src/learning/levels/c2/arcs/c2Arc8IntegratedMediation.js'
import { C2_CAN_DOS } from '../../../src/learning/levels/c2/c2Capabilities.js'
import { C2_PATTERNS } from '../../../src/learning/levels/c2/c2Patterns.js'
import { C2_VOCABULARY, getC2ArcVocabularyWords } from '../../../src/learning/levels/c2/c2Vocabulary.js'
import { C2_INTENTS } from '../../../src/learning/levels/c2/c2Intents.js'

let groups = 0
const ok = () => { groups += 1 }

export const ALL_ARCS = {
  dense_input_synthesis: C2_ARC1,
  precise_reformulation: C2_ARC2,
  implication_and_subtext: C2_ARC3,
  register_and_pragmatics: C2_ARC4,
  argument_and_position: C2_ARC5,
  discourse_flexibility: C2_ARC6,
  stylistic_control: C2_ARC7_EPISODES,
  integrated_mediation: C2_ARC8,
}
export const ALL_EPISODES = Object.values(ALL_ARCS).flat()

const VALID_STEP_TYPES = new Set(['scene', 'model', 'comprehension', 'choice', 'word_order', 'fill_blank', 'free_reply', 'recall', 'completion'])
const canDoIds = new Set(C2_CAN_DOS.map((c) => c.id))
const patternIds = new Set(C2_PATTERNS.map((p) => p.id))
const vocabWordIds = new Set(Object.keys(C2_VOCABULARY).flatMap((arcId) => {
  const words = getC2ArcVocabularyWords(arcId)
  return [...words.productive, ...words.receptive]
}))
const intentIds = new Set(C2_INTENTS.map((i) => i.id))

/* ---- 1) only real step types ---- */
{
  for (const ep of ALL_EPISODES) {
    for (const step of ep.steps) {
      assert.ok(VALID_STEP_TYPES.has(step.type), `${ep.id} uses unknown step type "${step.type}"`)
    }
  }
  ok()
}

/* ---- 2) every canDoId is a real C2 id or an explicit c1.* reference ---- */
{
  for (const ep of ALL_EPISODES) {
    for (const step of ep.steps) {
      if (!step.canDoId) continue
      assert.ok(canDoIds.has(step.canDoId) || step.canDoId.startsWith('c1.'), `${ep.id} step references unresolvable canDoId ${step.canDoId}`)
    }
    for (const skill of ep.skillPrerequisites || []) {
      assert.ok(canDoIds.has(skill) || skill.startsWith('c1.'), `${ep.id} skillPrerequisites references unresolvable id ${skill}`)
    }
    for (const skill of ep.reuseSkills || []) {
      assert.ok(canDoIds.has(skill) || skill.startsWith('c1.'), `${ep.id} reuseSkills references unresolvable id ${skill}`)
    }
  }
  ok()
}

/* ---- 3) every evalKind is a real C2 intent id ---- */
{
  for (const ep of ALL_EPISODES) {
    for (const step of ep.steps) {
      if (!step.evalKind) continue
      assert.ok(intentIds.has(step.evalKind), `${ep.id} step references unresolvable evalKind ${step.evalKind}`)
    }
  }
  ok()
}

/* ---- 4) every itemId (gardenItems + step-level itemIds/itemId) is a real
    pattern id or a real vocabulary word ---- */
{
  for (const ep of ALL_EPISODES) {
    for (const item of ep.gardenItems || []) {
      assert.ok(patternIds.has(item) || vocabWordIds.has(item), `${ep.id} gardenItems references unresolvable item "${item}"`)
    }
    for (const step of ep.steps) {
      for (const item of step.itemIds || []) {
        assert.ok(patternIds.has(item) || vocabWordIds.has(item), `${ep.id} step references unresolvable itemId "${item}"`)
      }
      if (step.itemId) assert.ok(patternIds.has(step.itemId) || vocabWordIds.has(step.itemId), `${ep.id} step references unresolvable itemId "${step.itemId}"`)
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

/* ---- 6) every episode's titleKey is unique across the level (no personalization
    variant pairs exist in C2 — every arc's personalizationMode uses an
    optional inline step, not a duplicate episode, per c2Arc1's own header
    note) ---- */
{
  const titleKeys = ALL_EPISODES.map((ep) => ep.titleKey)
  assert.equal(new Set(titleKeys).size, titleKeys.length, `duplicate titleKeys found: ${titleKeys.filter((k, i) => titleKeys.indexOf(k) !== i).join(', ')}`)
  ok()
}

/* ---- 7) i18n key ranges do not collide across arcs (each arc uses a
    disjoint c2epN prefix range, per every arc file's own header comment) ---- */
{
  const prefixOf = (key) => (key.match(/^c2ep(\d+)/) || [])[1]
  const prefixByArc = {}
  for (const [arcId, episodes] of Object.entries(ALL_ARCS)) {
    const prefixes = new Set(episodes.map((ep) => prefixOf(ep.titleKey)).filter(Boolean))
    prefixByArc[arcId] = prefixes
  }
  const seen = new Map()
  for (const [arcId, prefixes] of Object.entries(prefixByArc)) {
    for (const p of prefixes) {
      assert.ok(!seen.has(p), `i18n prefix c2ep${p} used by both ${seen.get(p)} and ${arcId}`)
      seen.set(p, arcId)
    }
  }
  ok()
}

console.log(`check-c2-arc-content: ${groups} groups OK (${ALL_EPISODES.length} episodes across ${Object.keys(ALL_ARCS).length} arcs)`)
