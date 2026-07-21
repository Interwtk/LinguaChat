/*
 * check-arc-e2e — deterministic end-to-end simulation of the full Pre-A1 arc.
 *
 * Drives the THREE real episode definitions through the REAL evaluation and
 * learner-model modules, mirroring exactly what EpisodeShell does for each step
 * type (submitFree / recordItems / adaptScaffold / finish) and what AppContext
 * does for the Memory Garden (awardEpisode dedup). No browser, no React — so the
 * pedagogical flow is verified reproducibly and independently of any UI harness.
 *
 * Asserts: every step accepts its intended answer, all three episodes complete
 * once (idempotent award, no double XP), the garden accumulates the expected
 * deduped set, scaffolding adapts, and the full_greeting can-do only reaches
 * "can_do" after a second, independent production.
 */
import assert from 'node:assert/strict'
import { ARC } from '../src/learning/episodes/index.js'
import { evaluateFree } from '../src/learning/engine/responseEvaluation.js'
import {
  createLearnerModel, recordItemAttempt, recordCanDoAttempt, markRecurringError,
  getRecommendedScaffold, getEpisodeState, setEpisodeState,
} from '../src/learning/engine/learnerModel.js'

const NAME = 'Sebastian'
const PLACE = 'Bogotá'
const VARS = { name: NAME, partner: 'Sam', place: PLACE, partnerPlace: 'Japan' }
const resolve = (s) => String(s || '').replace(/\{(\w+)\}/g, (m, k) => (VARS[k] ?? m))

// canonical correct answer for a free/recall step (suggestion when present)
const CANONICAL = {
  introduction: `Hi, I'm ${NAME}.`,
  ask_name: "What's your name?",
  nice_to_meet: 'Nice to meet you too.',
  ask_wellbeing: 'How are you?',
  answer_wellbeing: "I'm good.",
  reciprocal_question: 'And you?',
  ask_origin: 'Where are you from?',
  answer_origin: `I'm from ${PLACE}.`,
  full_intro_conversation: `Hi, I'm ${NAME}. How are you?`,
}
function answerFor(step) {
  if (step.suggestionEn) return resolve(step.suggestionEn)
  const canonical = CANONICAL[step.evalKind]
  if (canonical) return canonical
  throw new Error('no canonical answer for evalKind ' + step.evalKind)
}

// simulate awardEpisode's garden dedup (by vocab id)
function feedGarden(garden, ep) {
  for (const id of ep.gardenItems || []) if (!garden.includes(id)) garden.push(id)
}

/*
 * Play one episode the way EpisodeShell orchestrates it. `mode`:
 *   'helped'      — absolute beginner: stays on high scaffold, uses suggestions
 *                   on free steps  → every success is NON-independent.
 *   'independent' — confident replay: starts low scaffold, types own answers,
 *                   never taps a suggestion → successes are independent.
 */
function playEpisode(model, ep, { mode }) {
  let scaffold = mode === 'independent' ? 'low' : 'high'
  let cleanStreak = 0
  const adapt = ({ correct, usedHelp }) => {
    cleanStreak = correct && !usedHelp ? cleanStreak + 1 : 0
    scaffold = getRecommendedScaffold(scaffold, { cleanSuccessStreak: cleanStreak, justFailed: !correct, usedHelp })
  }

  for (let i = 0; i < ep.steps.length; i++) {
    const step = ep.steps[i]
    setEpisodeState(model, ep.id, { status: 'in_progress', stepIndex: i })

    if (step.type === 'comprehension' || step.type === 'choice') {
      // pick the correct option (data guarantees exactly one)
      const correct = step.options.some(o => o.correct)
      assert.ok(correct, `${ep.id} step ${i}: no correct option`)
      if (step.itemId) recordItemAttempt(model, step.itemId, { correct: true, independent: scaffold !== 'high' })
    } else if (step.type === 'word_order' || step.type === 'fill_blank') {
      if (step.itemId) recordItemAttempt(model, step.itemId, { correct: true, independent: scaffold !== 'high' })
    } else if (step.type === 'free_reply' || step.type === 'recall') {
      const fromSuggestion = mode === 'helped' && Boolean(step.suggestionEn)
      const independent = !fromSuggestion && scaffold !== 'high'
      const turnContext = { linguaSaid: resolve(step.promptEn || step.sceneEn || '') }
      const res = evaluateFree(step.evalKind, answerFor(step), { name: NAME, independent, turnContext, place: PLACE })
      assert.ok(res.completedObjective, `${ep.id} step ${i} (${step.evalKind}): intended answer rejected → ${JSON.stringify(res)}`)
      ;(step.itemIds || []).forEach(id => recordItemAttempt(model, id, { correct: true, independent }))
      adapt({ correct: true, usedHelp: fromSuggestion || scaffold === 'high' })
    }
    // scene / model / completion carry no evaluation
  }

  // finish() — idempotent award + can-do record
  const st = getEpisodeState(model, ep.id)
  const independent = cleanStreak >= 1
  recordCanDoAttempt(model, ep.canDoId, { success: true, independent, context: ep.id })
  let awarded = false
  if (!st.awarded) {
    awarded = true
    setEpisodeState(model, ep.id, { status: 'completed', awarded: true, stepIndex: ep.steps.length - 1 })
  } else {
    setEpisodeState(model, ep.id, { status: 'completed', stepIndex: ep.steps.length - 1 })
  }
  return { awarded }
}

// ---------------- run 1: absolute beginner, first pass through the arc ----------------
const model = createLearnerModel()
const garden = []
let xp = 0
assert.equal(ARC.length, 6, 'both Pre-A1 arcs must be playable end to end')

for (const ep of ARC) {
  const { awarded } = playEpisode(model, ep, { mode: 'helped' })
  assert.ok(awarded, `${ep.id} should award on first completion`)
  feedGarden(garden, ep)
  xp += ep.xp
  assert.equal(getEpisodeState(model, ep.id).status, 'completed', `${ep.id} completed`)
}

const expectedXp = ARC.reduce((sum, ep) => sum + ep.xp, 0)
assert.equal(xp, expectedXp, `arc XP should total ${expectedXp}, got ${xp}`)
assert.equal(xp, 315, 'both arcs together should award 315 XP')

// garden: deduped union of all gardenItems, order-independent
const expectedGarden = [
  'hi', 'hello', 'im', 'whats_your_name', 'my_name_is', 'name', 'nice_to_meet',
  'how_are_you', 'im_good', 'and_you', 'good', 'fine', 'tired', 'im_feeling_pattern',
  'where_from', 'im_from', 'from', 'what_about_you', 'im_from_pattern',
]
assert.deepEqual([...garden].sort(), [...expectedGarden].sort(), 'garden must be the deduped union')
assert.equal(garden.length, new Set(garden).size, 'garden must have no duplicates')

// idempotent re-completion must NOT re-award (no double XP / double garden)
const replay = playEpisode(model, ARC[2], { mode: 'helped' })
assert.equal(replay.awarded, false, 'already-awarded episode must not re-award')

// after helped completions the full-greeting can-do is still only "learning"
assert.equal(model.canDo.full_greeting.status, 'learning', 'helped-only completion must not grant mastery')

// ---------------- run 2: an independent replay lifts it to can_do ----------------
playEpisode(model, ARC[2], { mode: 'independent' })
assert.equal(model.canDo.full_greeting.status, 'can_do',
  `an independent production should lift full_greeting to can_do → ${JSON.stringify(model.canDo.full_greeting)}`)
assert.ok(model.canDo.full_greeting.independentSuccesses >= 1, 'must record an independent success')

// scaffolding actually moved during the independent replay evidence
assert.ok(['low', 'medium', 'high'].includes(getRecommendedScaffold('low', { justFailed: true })), 'scaffold API sane')
assert.equal(getRecommendedScaffold('high', { cleanSuccessStreak: 2 }), 'medium', 'two clean successes lower high→medium')
assert.equal(getRecommendedScaffold('medium', { justFailed: true }), 'high', 'a fail steps toward MORE help (medium→high)')

// recurring-error path (from a rejected answer) is recorded without throwing
const em = createLearnerModel()
const bad = evaluateFree('introduction', NAME, { name: NAME, independent: true }) // bare name → rejected
assert.equal(bad.completedObjective, false, 'bare name must be rejected')
markRecurringError(em, bad.errorType)
assert.ok(em.recurringErrors.length === 1 && em.recurringErrors[0].errorType, 'recurring error recorded')

console.log(`check-arc-e2e — OK  (${ARC.length} episodes played, XP ${xp}, garden ${garden.length} items, full_greeting → can_do after independent replay)`)
