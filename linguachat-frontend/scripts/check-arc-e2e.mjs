/*
 * check-arc-e2e — deterministic end-to-end simulation of the full Pre-A1 arc.
 *
 * Drives the SEVENTEEN real episode definitions through the REAL evaluation and
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
import { getStory, storyBranches, storyTurns, turnText } from '../src/learning/engine/miniStory.js'
import { evaluateFree } from '../src/learning/engine/responseEvaluation.js'
import {
  createLearnerModel, recordItemAttempt, recordCanDoAttempt, markRecurringError,
  getRecommendedScaffold, getEpisodeState, setEpisodeState,
} from '../src/learning/engine/learnerModel.js'

const NAME = 'Sebastian'
const PLACE = 'Bogotá'
const VARS = { name: NAME, partner: 'Sam', place: PLACE, partnerPlace: 'Japan', noun: 'music', object: 'pop music', activity: 'listen to music', branchLine: 'Great!', item: 'water', otherItem: 'tea' }
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
  express_like: 'I like music.',
  express_dislike: "I don't like coffee.",
  ask_preference: 'What do you like?',
  yes_no_preference: 'Yes, I do.',
  express_want: 'I want water.',
  express_need: 'I need help.',
  ask_want: 'Do you want water?',
  accept_offer: 'Yes, please.',
  decline_offer: 'No, thank you.',
  simple_plan_conversation: 'I like music. Do you want to listen to music?',
  polite_request: 'Can I have water, please?',
  thank_service: 'Thank you.',
  respond_anything_else: 'No, thank you.',
  finish_order: 'That’s all, thanks.',
  cafe_order_conversation: 'Can I have water, please? That’s all, thanks.',
  close_encounter: 'Bye.',
  ask_what_thing: 'What\u2019s this?',
}
/*
 * Repair is one intent with three strategies, so its canonical answer depends on
 * the strategy the step asked for. A step that asks for a repetition and gets
 * "I don't understand." is understood but is not what was practised.
 */
const CANONICAL_REPAIR = {
  signal_nonunderstanding: "I don't understand.",
  repeat: 'Can you repeat, please?',
  slow_down: 'Please speak slowly.',
}
/* A quantity's shape decides its whole sentence, the way a repair's does. */
const CANONICAL_QUANTITY = {
  bare: () => 'Two.',
  with_object: (step) => `${step.count === 3 ? 'Three' : 'Two'} ${step.thingId === 'sandwich' ? 'sandwiches' : 'books'}.`,
  polite_request: (step) => `Can I have two ${step.thingId === 'sandwich' ? 'sandwiches' : 'books'}, please?`,
}

function answerFor(step) {
  if (step.suggestionEn) return resolve(step.suggestionEn)
  if (step.evalKind === 'identify_thing') return `It\u2019s a ${step.thingId || 'book'}.`
  if (step.evalKind === 'use_quantity') {
    const build = CANONICAL_QUANTITY[step.quantityForm]
    if (!build) throw new Error('quantity step without a known form: ' + step.quantityForm)
    return build(step)
  }
  if (step.evalKind === 'repair_request') {
    const canonical = CANONICAL_REPAIR[step.repairKind]
    if (!canonical) throw new Error('repair step without a known repairKind: ' + step.repairKind)
    return canonical
  }
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
      // 'always_helped' models the learner who leans on support at every single
      // turn; 'helped' is the realistic beginner who only taps the model answer
      // where one is offered.
      const fromSuggestion = mode === 'always_helped' || (mode === 'helped' && Boolean(step.suggestionEn))
      const independent = !fromSuggestion && scaffold !== 'high'
      const turnContext = { linguaSaid: resolve(step.promptEn || step.sceneEn || '') }
      const res = evaluateFree(step.evalKind, answerFor(step), { name: NAME, independent, turnContext, place: PLACE, targetNoun: VARS.noun, repairKind: step.repairKind, targetThing: step.thingId, quantityForm: step.quantityForm, targetCount: step.count })
      assert.ok(res.completedObjective, `${ep.id} step ${i} (${step.evalKind}): intended answer rejected → ${JSON.stringify(res)}`)
      ;(step.itemIds || []).forEach(id => recordItemAttempt(model, id, { correct: true, independent }))
      // mirrors the shell: "help was used" means the learner reached for the
      // model answer, not merely that support was still on screen
      adapt({ correct: true, usedHelp: fromSuggestion })
    } else if (step.type === 'mini_story') {
      /*
       * An episode-hosted story, played through the SAME story data the renderer
       * uses. Both branches must be walkable; the arc is only "playable end to
       * end" if the story inside episode 15 is too.
       */
      const story = getStory(step.storyObjective)
      assert.ok(story, `${ep.id} step ${i}: unknown story objective ${step.storyObjective}`)
      for (const branch of storyBranches(story)) {
        for (const turn of storyTurns(story)) {
          if (turn.kind === 'choose') {
            assert.ok(turn.options.some(o => o.branch === branch), `story ${story.storyId}: no option for branch ${branch}`)
            continue
          }
          if (turn.kind !== 'reply') {
            assert.ok(turnText(turn, branch, story), `story ${story.storyId}: ${turn.kind} turn empty on branch ${branch}`)
            continue
          }
          const fromSuggestion = mode !== 'independent'
          const independent = !fromSuggestion && scaffold !== 'high'
          const res = evaluateFree(turn.evalKind, answerFor(turn), { name: NAME, independent, place: PLACE, targetNoun: VARS.noun, repairKind: turn.repairKind })
          assert.ok(res.completedObjective, `story ${story.storyId} (${branch}) ${turn.evalKind}: intended answer rejected → ${JSON.stringify(res)}`)
          ;(turn.itemIds || []).forEach(id => recordItemAttempt(model, id, { correct: true, independent }))
          adapt({ correct: true, usedHelp: fromSuggestion })
        }
      }
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
assert.equal(ARC.length, 17, 'all six Pre-A1 arcs must be playable end to end')

for (const ep of ARC) {
  const { awarded } = playEpisode(model, ep, { mode: 'helped' })
  assert.ok(awarded, `${ep.id} should award on first completion`)
  feedGarden(garden, ep)
  xp += ep.xp
  assert.equal(getEpisodeState(model, ep.id).status, 'completed', `${ep.id} completed`)
}

const expectedXp = ARC.reduce((sum, ep) => sum + ep.xp, 0)
assert.equal(xp, expectedXp, `arc XP should total ${expectedXp}, got ${xp}`)
assert.equal(xp, 1000, 'all six arcs together should award 1000 XP')

// garden: deduped union of all gardenItems, order-independent
const expectedGarden = [
  'hi', 'hello', 'im', 'whats_your_name', 'my_name_is', 'name', 'nice_to_meet',
  'how_are_you', 'im_good', 'and_you', 'good', 'fine', 'tired', 'im_feeling_pattern',
  'where_from', 'im_from', 'from', 'what_about_you', 'im_from_pattern',
  'like', 'i_like', 'i_dont_like', 'what_do_you_like', 'do_you_like', 'i_like_pattern',
  'want', 'need', 'help', 'please', 'i_want', 'i_need', 'do_you_want', 'yes_please', 'no_thank_you', 'i_want_pattern',
  'water', 'coffee', 'tea', 'juice', 'thank_you', 'can_i_have', 'here_you_are', 'can_i_have_pattern',
  'anything_else', 'thats_all',
  'i_dont_understand', 'can_you_repeat', 'speak_slowly', 'repair_pattern', 'bye', 'see_you',
  'whats_this', 'its_a_pattern', 'book', 'phone', 'bag',
  'numbers_1_10', 'how_many', 'quantity_pattern',
]
assert.deepEqual([...garden].sort(), [...expectedGarden].sort(), 'garden must be the deduped union')
assert.equal(garden.length, new Set(garden).size, 'garden must have no duplicates')

// idempotent re-completion must NOT re-award (no double XP / double garden)
const replay = playEpisode(model, ARC[2], { mode: 'helped' })
assert.equal(replay.awarded, false, 'already-awarded episode must not re-award')

/*
 * Mastery may only come from something the learner produced unaided.
 *
 * A learner who leans on the model answer at EVERY turn stays at "learning" no
 * matter how many times they finish: support never comes down, so no success is
 * ever independent. (A learner who answers some turns unaided does earn it —
 * that is the point of lowering support, and it is asserted below.)
 */
{
  const helpedModel = createLearnerModel()
  for (let i = 0; i < 3; i++) playEpisode(helpedModel, ARC[2], { mode: 'always_helped' })
  assert.equal(helpedModel.canDo.full_greeting.status, 'learning',
    'leaning on the model answer every time must never grant mastery')
  assert.equal(helpedModel.canDo.full_greeting.independentSuccesses, 0)
}

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
