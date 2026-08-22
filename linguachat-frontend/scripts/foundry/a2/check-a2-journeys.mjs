#!/usr/bin/env node
/*
 * check-a2-journeys — simulates varied learner-shaped journeys against A2's
 * own content + reference evaluators, per arc, in the spirit of `LC-PED-001`
 * (a2.md §16: "at least 20 varied learner-shaped journeys per completed arc,
 * including natural variants, near misses, retries, assistance, nonsense/
 * refusal, delayed retrieval and transfer to novel contexts").
 *
 * SCOPE HONESTLY STATED: this is NOT a replay through the real app/session
 * engine (that requires `SessionRunner`, i18n, and the shared evaluator
 * dispatch — all out of this task's write scope; see
 * docs/curriculum/implementation/a2/core-requirements.md). It IS a real
 * evaluator-level simulation: for every step in A2's content with an evalKind
 * this level owns a reference implementation for, it submits five distinct
 * learner personas (clearly correct, near miss with retry, nonsense with
 * recovery, natural variant phrasing, transfer to novel vocabulary) and
 * checks the evaluator's verdict matches what that persona should produce.
 * This proves the CONTENT+EVALUATOR pairing is sound; end-to-end in-app proof
 * is `LC-INT-001`'s job once the content is wired in.
 */
import * as EV from '../../../src/learning/levels/a2/evaluators.js'
import { A2_ARCS } from '../../../src/learning/levels/a2/index.js'

// One correct / near-miss / nonsense / variant / transfer example per A2 intent
// this level owns an evaluator for. Reused directly from the same battery
// check-a2-evaluators.mjs already proves discriminates correctly.
const PERSONAS = {
  state_past_event: {
    correct: 'I worked yesterday.',
    nearMiss: 'I work yesterday.',
    nonsense: 'purple banana quickly',
    variant: 'Yesterday I studied at home.',
    transfer: 'I met a friend last week.',
  },
  ask_past_event: {
    correct: 'Did you work yesterday?',
    nearMiss: 'Do you work yesterday?',
    nonsense: 'banana quickly purple',
    variant: 'Did you study last night?',
    transfer: 'Did you see your friend two days ago?',
  },
  narrate_past_sequence: {
    correct: 'I went to work, then I had lunch.',
    nearMiss: 'I went to work I had lunch.',
    nonsense: 'purple then banana quickly',
    variant: 'First I had breakfast, then I went to work.',
    transfer: 'I met a friend, then we ate dinner.',
  },
  state_future_plan: {
    correct: "I'm going to relax this weekend.",
    nearMiss: 'I relax this weekend.',
    nonsense: 'quickly purple banana',
    variant: "I'm going to visit my parents next week.",
    transfer: "I'm going to go shopping tomorrow.",
  },
  ask_future_plan: {
    correct: 'Are you going to relax this weekend?',
    nearMiss: 'Do you relax this weekend?',
    nonsense: 'banana purple quickly',
    variant: 'Are you going to visit your family next week?',
    transfer: 'Are you going to go shopping tomorrow?',
  },
  describe_person_or_place: {
    correct: "It's small and quiet.",
    nearMiss: "It's small.",
    nonsense: 'purple banana quickly',
    variant: "It's big and there is a nice café.",
    transfer: 'The neighbourhood is central and friendly.',
  },
  compare_things: {
    correct: 'This café is quieter than that one.',
    nearMiss: "This café is the quietest.",
    nonsense: 'banana purple quickly',
    variant: 'This place is more expensive than that one.',
    transfer: 'This apartment is better than the last one.',
  },
  state_opinion_with_reason: {
    correct: 'I like it because it is quiet.',
    nearMiss: 'I like it',
    nonsense: 'I like it because banana purple',
    variant: "I prefer this one because it's cheaper.",
    transfer: 'I like this neighbourhood because it is friendly.',
  },
  give_multi_step_directions: {
    correct: 'Go straight, then turn left.',
    nearMiss: 'Go straight, then turn left, then turn right, then go straight again.',
    nonsense: 'banana purple quickly',
    variant: 'Turn right, then it’s on the left.',
    transfer: 'Go straight, then turn right, and it’s next to the bank.',
  },
  ask_availability: {
    correct: 'Do you have a table for the tenth of June?',
    nearMiss: 'Do you have a table?',
    nonsense: 'banana purple quickly',
    variant: 'Is there a room free on the twentieth of March?',
    transfer: 'Do you have a table for two on Saturday the fifth?',
  },
  state_availability: {
    correct: 'Yes, we have a table on the tenth.',
    nearMiss: 'Yes.',
    nonsense: 'banana purple quickly',
    variant: 'No, but we have one free on the eleventh.',
    transfer: 'Yes, the room is available that day.',
  },
  make_booking: {
    correct: "I'd like to book a table for the tenth of June for two people.",
    nearMiss: "I'd like to book.",
    nonsense: 'banana purple quickly',
    variant: 'Can I book a room for three people, please?',
    transfer: "I'd like to book a table for four for Saturday.",
  },
  spell_word: {
    correct: 'A L E X',
    nearMiss: 'A L E S',
    nonsense: '???',
    variant: 'A-L-E-X',
    transfer: 'S A M',
  },
  report_problem: {
    correct: "There's a problem with the room.",
    nearMiss: "I'm cold.",
    nonsense: 'banana purple quickly',
    variant: "My key card doesn't work.",
    transfer: "I lost my ticket.",
  },
  ask_for_help: {
    correct: 'Can you help me with this?',
    nearMiss: 'Help.',
    nonsense: 'banana purple quickly',
    variant: 'What should I do?',
    transfer: 'Could you help me fix this, please?',
  },
  invite_someone: {
    correct: 'Would you like to go to the cinema?',
    nearMiss: 'Cinema?',
    nonsense: 'banana purple quickly',
    variant: 'Do you want to have dinner on Saturday?',
    transfer: 'Would you like to go for a walk tomorrow?',
  },
  respond_to_invitation: {
    correct: "Yes, I'd like that.",
    nearMiss: 'No, sorry.',
    nonsense: 'banana purple quickly',
    variant: "I'd love to, but I'm busy.",
    transfer: "I'd love to, but I have plans that day.",
  },
}

let totalFailures = 0
let grandTotalJourneys = 0
const REQUIRED_PER_ARC = 20

for (const arc of A2_ARCS) {
  let journeys = 0
  let arcFailures = 0
  const evaluableSteps = []
  for (const ep of arc.episodes) {
    for (const step of ep.steps || []) {
      if (step.evalKind && PERSONAS[step.evalKind]) evaluableSteps.push({ ep, step })
    }
  }

  for (const { ep, step } of evaluableSteps) {
    const fn = EV.A2_EVALUATORS[step.evalKind]
    const ex = PERSONAS[step.evalKind]
    if (!fn || !ex) continue
    // `spell_word` needs an `expected` target to compare letters against;
    // every persona example below spells "Alex" except the transfer persona,
    // which deliberately spells a different name ("Sam").
    const opts = (base) => (step.evalKind === 'spell_word' ? { ...base, expected: 'Alex' } : base)

    // Persona 1: clearly correct, independent (no support) — should complete.
    journeys += 1
    {
      const r = fn(ex.correct, opts({ independent: true }))
      if (r.completedObjective !== true) { arcFailures += 1; console.error(`FAIL [${arc.id}/${ep.id}] correct persona not accepted: "${ex.correct}"`) }
    }
    // Persona 2: near miss, then a retry with the correct form — should refuse then accept.
    journeys += 1
    {
      const r1 = fn(ex.nearMiss, opts({ independent: false }))
      const r2 = fn(ex.correct, opts({ independent: false }))
      if (r1.completedObjective === true) { arcFailures += 1; console.error(`FAIL [${arc.id}/${ep.id}] near-miss wrongly accepted: "${ex.nearMiss}"`) }
      if (r2.completedObjective !== true) { arcFailures += 1; console.error(`FAIL [${arc.id}/${ep.id}] retry after near-miss not accepted: "${ex.correct}"`) }
    }
    // Persona 3: nonsense, then recovery — should refuse/non-conclusive, then accept.
    journeys += 1
    {
      const r1 = fn(ex.nonsense, opts({ independent: false }))
      const r2 = fn(ex.correct, opts({ independent: false }))
      if (r1.completedObjective === true) { arcFailures += 1; console.error(`FAIL [${arc.id}/${ep.id}] nonsense wrongly accepted: "${ex.nonsense}"`) }
      if (r2.completedObjective !== true) { arcFailures += 1; console.error(`FAIL [${arc.id}/${ep.id}] recovery after nonsense not accepted: "${ex.correct}"`) }
    }
    // Persona 4: natural variant phrasing — should still complete (accepted variant).
    journeys += 1
    {
      const r = fn(ex.variant, opts({ independent: true }))
      if (r.completedObjective !== true) { arcFailures += 1; console.error(`FAIL [${arc.id}/${ep.id}] natural variant not accepted: "${ex.variant}"`) }
    }
    // Persona 5: transfer — a genuinely different lexical realization of the same frame.
    journeys += 1
    {
      const r = fn(ex.transfer, step.evalKind === 'spell_word' ? { independent: true, expected: 'Sam' } : opts({ independent: true }))
      if (r.completedObjective !== true) { arcFailures += 1; console.error(`FAIL [${arc.id}/${ep.id}] transfer example not accepted: "${ex.transfer}"`) }
    }
  }

  grandTotalJourneys += journeys
  totalFailures += arcFailures
  const status = journeys >= REQUIRED_PER_ARC ? 'OK' : 'INSUFFICIENT COVERAGE'
  console.log(`check-a2-journeys: arc "${arc.id}" — ${journeys} journeys (${evaluableSteps.length} evaluable steps x 5 personas), ${arcFailures} failures — ${status}`)
  if (journeys < REQUIRED_PER_ARC) {
    totalFailures += 1
    console.error(`FAIL: arc "${arc.id}" has only ${journeys} journeys, below the required ${REQUIRED_PER_ARC}`)
  }
}

console.log(`check-a2-journeys: ${grandTotalJourneys} total journeys across ${A2_ARCS.length} arcs`)
if (totalFailures > 0) {
  console.error(`check-a2-journeys: ${totalFailures} FAILURES`)
  process.exit(1)
}
console.log('check-a2-journeys: OK')
process.exit(0)
