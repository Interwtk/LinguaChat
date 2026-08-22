/*
 * check-c2-content-plan — structural fidelity gate for the C2 content plan.
 *
 * LC-CONT-C2 is blocked from authoring runtime content: every one of C2's
 * new evaluator intents needs registration in shared engine/component/i18n
 * files this task has no write access to (see
 * .ai/foundry/requests/LC-CONT-C2.md for the full, re-verified finding).
 * `docs/curriculum/implementation/c2/content-plan.json` is the design
 * artifact this task CAN produce inside its own write scope: a faithful,
 * episode/step-level expansion of `docs/curriculum/blueprints/c2.json`.
 *
 * This script proves the content plan is internally faithful to the frozen
 * blueprint. It does NOT prove the content is playable, pedagogically
 * effective, or evaluatable by any real evaluator, because no runtime
 * module exists yet to check that against.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../../../')

const blueprint = JSON.parse(readFileSync(path.join(repoRoot, 'docs/curriculum/blueprints/c2.json'), 'utf8'))
const plan = JSON.parse(readFileSync(path.join(repoRoot, 'docs/curriculum/implementation/c2/content-plan.json'), 'utf8'))

let n = 0
const ok = () => { n++ }

const TEST_CASE_CATEGORIES = ['correct', 'naturalVariant', 'nearMiss', 'wrongMeaning', 'nonsense', 'pragmaticallyInappropriate']

function assertCompleteTestCases (testCases, label) {
  assert.ok(testCases && typeof testCases === 'object', `${label} must have a testCases object`)
  for (const cat of TEST_CASE_CATEGORIES) {
    assert.ok(typeof testCases[cat] === 'string' && testCases[cat].trim().length > 0, `${label} is missing a non-empty '${cat}' example`)
  }
}

// 1) arc identity, order and prerequisites match the blueprint exactly
{
  assert.equal(plan.arcs.length, blueprint.arcs.length, 'content plan must cover every blueprint arc exactly once')
  blueprint.arcs.forEach((bArc, i) => {
    const pArc = plan.arcs[i]
    assert.ok(pArc, `content plan is missing arc at position ${i} (${bArc.id})`)
    assert.equal(pArc.id, bArc.id, `arc ${i} id mismatch: blueprint=${bArc.id} plan=${pArc.id}`)
    assert.equal(pArc.order, bArc.order, `arc ${bArc.id} order mismatch`)
    assert.deepEqual(pArc.prerequisiteArcs, bArc.prerequisiteArcs, `arc ${bArc.id} prerequisiteArcs mismatch`)
    assert.equal(pArc.personalizationMode, bArc.personalizationMode, `arc ${bArc.id} personalizationMode mismatch`)
  })
  ok()
}

// 2) every required/should/optional capability is covered exactly once, with the blueprint's own scope
{
  const seen = new Map()
  for (const pArc of plan.arcs) {
    for (const cap of pArc.capabilities) {
      assert.ok(!seen.has(cap.id), `capability ${cap.id} is declared in more than one arc (${seen.get(cap.id)} and ${pArc.id})`)
      seen.set(cap.id, pArc.id)
    }
  }
  for (const bCap of blueprint.canDos) {
    assert.ok(seen.has(bCap.id), `blueprint capability ${bCap.id} is not covered anywhere in the content plan`)
  }
  assert.equal(seen.size, blueprint.canDos.length, 'content plan declares a capability the blueprint does not define')
  // scope must match
  const scopeById = new Map(blueprint.canDos.map((c) => [c.id, c.scope]))
  for (const pArc of plan.arcs) {
    for (const cap of pArc.capabilities) {
      assert.equal(cap.scope, scopeById.get(cap.id), `capability ${cap.id} scope mismatch: blueprint=${scopeById.get(cap.id)} plan=${cap.scope}`)
    }
  }
  ok()
}

// 3) build a global test-case index from every arc's intents (base + subtypes) plus the
//    known special reuse fields (capabilities that reuse another arc's intent via a subtype,
//    per blueprint canDos[].intentReuse), then confirm every required intent/subtype has one
{
  const index = new Map()
  for (const pArc of plan.arcs) {
    for (const intent of pArc.intents || []) {
      if (intent.testCases) index.set(intent.id, intent.testCases)
      for (const [subtype, tc] of Object.entries(intent.subtypeTestCases || {})) {
        index.set(`${intent.id}::${subtype}`, tc)
      }
    }
    // genre_adaptation is declared as a shift_register subtype (newSubtypesOnExistingIntents)
    // but its capability (adapt_a_text_across_genre_and_register) lives in a later arc than
    // shift_register's home arc, so its example set is authored alongside that capability.
    if (pArc.genreAdaptationTestCases) index.set('shift_register::genre_adaptation', pArc.genreAdaptationTestCases)
  }

  for (const intentId of blueprint.intentStrategy.newIntents) {
    assert.ok(index.has(intentId), `new intent '${intentId}' has no base test-case table anywhere in the content plan`)
    assertCompleteTestCases(index.get(intentId), `intent '${intentId}'`)
  }
  for (const { intent, newSubtypes } of blueprint.intentStrategy.newSubtypesOnExistingIntents) {
    for (const subtype of newSubtypes) {
      const key = `${intent}::${subtype}`
      assert.ok(index.has(key), `subtype '${subtype}' of intent '${intent}' has no test-case table anywhere in the content plan`)
      assertCompleteTestCases(index.get(key), `intent '${intent}' subtype '${subtype}'`)
    }
  }
  ok()
}

// 4) every arc's declared intents actually belong to that arc, per perArcNewIntentCount
{
  const countByArc = new Map()
  for (const pArc of plan.arcs) countByArc.set(pArc.id, (pArc.intents || []).length)
  for (const [arcId, expected] of Object.entries(blueprint.intentStrategy.perArcNewIntentCount)) {
    assert.equal(countByArc.get(arcId), expected, `arc ${arcId} should declare exactly ${expected} new intent(s), found ${countByArc.get(arcId)}`)
  }
  ok()
}

// 5) every declared pattern is exemplified with a real, non-empty example somewhere in the plan
{
  const exemplified = new Set()
  for (const pArc of plan.arcs) {
    for (const pat of pArc.patterns || []) {
      if (typeof pat.example === 'string' && pat.example.trim().length > 0) exemplified.add(pat.id)
    }
  }
  for (const bPat of blueprint.patterns) {
    assert.ok(exemplified.has(bPat.id), `pattern '${bPat.id}' has no real example anywhere in the content plan`)
  }
  ok()
}

// 6) personalization-mode constraints: an arc marked "none" never carries an interest-flavored example
{
  for (const pArc of plan.arcs) {
    const bArc = blueprint.arcs.find((a) => a.id === pArc.id)
    if (bArc.personalizationMode === 'none') {
      assert.ok(
        !pArc.personalization || !('interestFlavoredExample' in pArc.personalization),
        `arc ${pArc.id} has personalizationMode 'none' but declares an interestFlavoredExample`
      )
    } else {
      assert.ok(
        pArc.personalization && typeof pArc.personalization.interestFlavoredExample === 'string' && pArc.personalization.interestFlavoredExample.trim().length > 0,
        `arc ${pArc.id} has personalizationMode '${bArc.personalizationMode}' but is missing an interestFlavoredExample`
      )
    }
    assert.ok(
      pArc.personalization && typeof pArc.personalization.neutralFallbackExample === 'string' && pArc.personalization.neutralFallbackExample.trim().length > 0,
      `arc ${pArc.id} is missing a neutralFallbackExample`
    )
  }
  ok()
}

// 7) vocabulary is real and stays within the blueprint's own budget (never exceeds it)
{
  for (const pArc of plan.arcs) {
    const bArc = blueprint.arcs.find((a) => a.id === pArc.id)
    assert.ok(Array.isArray(pArc.vocabulary?.productive) && pArc.vocabulary.productive.length > 0, `arc ${pArc.id} must declare at least one productive vocabulary item`)
    assert.ok(Array.isArray(pArc.vocabulary?.receptive) && pArc.vocabulary.receptive.length > 0, `arc ${pArc.id} must declare at least one receptive vocabulary item`)
    assert.ok(pArc.vocabulary.productive.length <= bArc.vocabularyBudget.newProductive, `arc ${pArc.id} exceeds its blueprint newProductive budget (${bArc.vocabularyBudget.newProductive})`)
    assert.ok(pArc.vocabulary.receptive.length <= bArc.vocabularyBudget.newReceptive, `arc ${pArc.id} exceeds its blueprint newReceptive budget (${bArc.vocabularyBudget.newReceptive})`)
  }
  ok()
}

// 8) every arc has a real step sequence, and the capstone arc records its delayed-retrieval checks
{
  for (const pArc of plan.arcs) {
    assert.ok(Array.isArray(pArc.steps) && pArc.steps.length >= 3, `arc ${pArc.id} must declare a real step sequence (>= 3 steps)`)
    for (const step of pArc.steps) {
      assert.ok(typeof step.prompt === 'string' && step.prompt.trim().length > 0, `arc ${pArc.id} has a step with no prompt`)
    }
  }
  const capstoneArc = plan.arcs.find((a) => a.id === blueprint.graduationCapstone.split('::')[0] || a.capabilities.some((c) => c.id === blueprint.graduationCapstone))
  assert.ok(capstoneArc, 'graduation capstone capability must be findable in some arc')
  assert.ok(Array.isArray(capstoneArc.delayedRetrievalChecks) && capstoneArc.delayedRetrievalChecks.length > 0, 'capstone arc must record its delayed-retrieval checks against prior capabilities')
  const capstoneCapIds = new Set(blueprint.canDos.map((c) => c.id))
  for (const check of capstoneArc.delayedRetrievalChecks) {
    assert.ok(capstoneCapIds.has(check.capabilityId), `capstone delayedRetrievalChecks references unknown capability '${check.capabilityId}'`)
  }
  ok()
}

console.log(`check-c2-content-plan: OK (${n} check groups, ${plan.arcs.length} arcs, ${blueprint.canDos.length} capabilities, ${blueprint.intentStrategy.newIntents.length} intents, ${blueprint.patterns.length} patterns)`)
