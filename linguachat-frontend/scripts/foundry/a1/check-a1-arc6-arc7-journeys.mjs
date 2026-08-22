#!/usr/bin/env node
/*
 * check-a1-arc6-arc7-journeys — simulates varied learner-shaped journeys
 * against arc 6/7's own content + reference evaluators, per arc, in the
 * spirit of `LC-PED-001` (at least 20 varied learner-shaped journeys per
 * completed arc, including natural variants, near misses, retries,
 * nonsense/refusal and transfer to novel contexts).
 *
 * SCOPE HONESTLY STATED, same as `levels/a2/**`'s own precedent: this is NOT
 * a replay through the real app/session engine (that requires SessionRunner,
 * i18n and the shared evaluator dispatch — all out of this task's write
 * scope; see docs/curriculum/implementation/a1/core-requirements.md). It IS a
 * real evaluator-level simulation: for every step in arc 6/7's content whose
 * evalKind this level owns a reference implementation for, it submits five
 * distinct learner personas and checks the evaluator's verdict matches what
 * that persona should produce.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import * as EV from '../../../src/learning/levels/a1/evaluators.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FRONTEND = join(__dirname, '..', '..', '..')
const { A1_ARC6_ARC7_ARCS } = await import(join(FRONTEND, 'src/learning/levels/a1/index.js'))

/*
 * One persona set per owned intent. `arrange_meeting` is deliberately tested
 * at its strictest stage ('confirm' — day + time + place together) regardless
 * of which `arrangeStage` the originating step declares: this proves the
 * evaluator+content pairing is sound at the hardest case, the same
 * simplification `levels/a2/**`'s own journeys script makes for
 * `spell_word`'s `expected` option.
 */
const PERSONAS = {
  state_ability: {
    correct: 'I can swim.',
    nearMiss: 'I can.',
    nonsense: 'purple banana quickly',
    variant: 'I can definitely cook.',
    transfer: "I can't dance, but I can sing.",
  },
  ask_ability: {
    correct: 'Can you swim?',
    nearMiss: 'Do you can swim?',
    nonsense: 'purple banana quickly',
    variant: 'Can you cook well?',
    transfer: 'Can you dance?',
  },
  arrange_meeting: {
    correct: "Let's meet on Friday at seven at the station.",
    nearMiss: "Let's meet on Friday.",
    nonsense: 'purple banana quickly',
    variant: 'OK, so Friday at seven, at the cinema.',
    transfer: 'Let’s meet on Monday at nine at the office.',
  },
}
/*
 * Forwards a real step's own subtype fields where it has them
 * (`abilityForm`, `praisePrefix`), so a step that actually declares a
 * polarity/praise-episode constraint is tested against it rather than
 * silently ignored (found once by review: `abilityForm` was previously
 * dropped entirely, so the polarity check was never exercised against real
 * content). `arrangeStage` is the one deliberate exception — always tested
 * at 'confirm' (the strictest stage) regardless of the originating step's
 * own stage, per this file's own header comment.
 */
function optsFor(step) {
  const opts = {}
  if (step.evalKind === 'arrange_meeting') opts.arrangeStage = 'confirm'
  if (step.abilityForm) opts.abilityForm = step.abilityForm
  if (step.praisePrefix) opts.praisePrefix = step.praisePrefix
  return opts
}
/* polarity-safe alternates for state_ability, so a step's own declared abilityForm is honoured */
const POLARITY_TEXT = {
  positive: { correct: 'I can swim.', variant: 'I can definitely cook.', transfer: 'I can sing, no problem.' },
  negative: { correct: "I can't dance.", variant: "I definitely can't cook.", transfer: "I can't sing, sorry." },
}
function personaText(step, ex, kind) {
  if (step.evalKind === 'state_ability' && step.abilityForm) return POLARITY_TEXT[step.abilityForm][kind]
  return ex[kind]
}

let totalFailures = 0
let grandTotalJourneys = 0
const REQUIRED_PER_ARC = 20

function collectSteps(steps) {
  const out = []
  for (const step of steps) { out.push(step); if (step.steps) out.push(...collectSteps(step.steps)) }
  return out
}

for (const arc of A1_ARC6_ARC7_ARCS) {
  let journeys = 0
  let arcFailures = 0
  const evaluableSteps = []
  for (const ep of arc.episodes) {
    for (const step of collectSteps(ep.steps || [])) {
      if (step.evalKind && PERSONAS[step.evalKind]) evaluableSteps.push({ ep, step })
    }
  }

  for (const { ep, step } of evaluableSteps) {
    const fn = EV.A1_ARC6_ARC7_EVALUATORS[step.evalKind]
    const ex = PERSONAS[step.evalKind]
    if (!fn || !ex) continue
    const opts = (base) => ({ ...base, ...optsFor(step) })
    const correct = personaText(step, ex, 'correct')
    const variant = personaText(step, ex, 'variant')
    const transfer = personaText(step, ex, 'transfer')

    // Persona 1: clearly correct, independent — should complete.
    journeys += 1
    {
      const r = fn(correct, opts({ independent: true }))
      if (r.completedObjective !== true) { arcFailures += 1; console.error(`FAIL [${arc.id}/${ep.id}] correct persona not accepted: "${correct}"`) }
    }
    // Persona 2: near miss, then a retry with the correct form.
    journeys += 1
    {
      const r1 = fn(ex.nearMiss, opts({ independent: false }))
      const r2 = fn(correct, opts({ independent: false }))
      if (r1.completedObjective === true) { arcFailures += 1; console.error(`FAIL [${arc.id}/${ep.id}] near-miss wrongly accepted: "${ex.nearMiss}"`) }
      if (r2.completedObjective !== true) { arcFailures += 1; console.error(`FAIL [${arc.id}/${ep.id}] retry after near-miss not accepted: "${correct}"`) }
    }
    // Persona 3: nonsense, then recovery.
    journeys += 1
    {
      const r1 = fn(ex.nonsense, opts({ independent: false }))
      const r2 = fn(correct, opts({ independent: false }))
      if (r1.completedObjective === true) { arcFailures += 1; console.error(`FAIL [${arc.id}/${ep.id}] nonsense wrongly accepted: "${ex.nonsense}"`) }
      if (r2.completedObjective !== true) { arcFailures += 1; console.error(`FAIL [${arc.id}/${ep.id}] recovery after nonsense not accepted: "${correct}"`) }
    }
    // Persona 4: natural variant phrasing.
    journeys += 1
    {
      const r = fn(variant, opts({ independent: true }))
      if (r.completedObjective !== true) { arcFailures += 1; console.error(`FAIL [${arc.id}/${ep.id}] natural variant not accepted: "${variant}"`) }
    }
    // Persona 5: transfer — a genuinely different lexical realization.
    journeys += 1
    {
      const r = fn(transfer, opts({ independent: true }))
      if (r.completedObjective !== true) { arcFailures += 1; console.error(`FAIL [${arc.id}/${ep.id}] transfer example not accepted: "${transfer}"`) }
    }
  }

  grandTotalJourneys += journeys
  totalFailures += arcFailures
  const status = journeys >= REQUIRED_PER_ARC ? 'OK' : 'INSUFFICIENT COVERAGE'
  console.log(`check-a1-arc6-arc7-journeys: arc "${arc.id}" — ${journeys} journeys (${evaluableSteps.length} evaluable steps x 5 personas), ${arcFailures} failures — ${status}`)
  if (journeys < REQUIRED_PER_ARC) {
    totalFailures += 1
    console.error(`FAIL: arc "${arc.id}" has only ${journeys} journeys, below the required ${REQUIRED_PER_ARC}`)
  }
}

console.log(`check-a1-arc6-arc7-journeys: ${grandTotalJourneys} total journeys across ${A1_ARC6_ARC7_ARCS.length} arcs`)
if (totalFailures > 0) {
  console.error(`check-a1-arc6-arc7-journeys: ${totalFailures} FAILURES`)
  process.exit(1)
}
console.log('check-a1-arc6-arc7-journeys: OK')
process.exit(0)
