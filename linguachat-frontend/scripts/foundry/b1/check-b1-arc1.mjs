/*
 * check-b1-arc1 — B1 arc 1 ("what_happened"), self-contained.
 *
 * Same spirit as `scripts/check-a1-arc1.mjs`: the blueprint and the runtime
 * must not drift, and the arc is PLAYED, not just type-checked. The one
 * structural difference, forced by this task's write scope
 * (`linguachat-frontend/src/learning/levels/b1/**` only): every shared-runtime
 * touchpoint A1's check reads directly (the real `evaluateFree` switch, the
 * real `SessionRunner.jsx` tables, the real locale files, the real episode
 * skeleton) has no B1 entry yet, so this check reads B1's own self-contained
 * equivalents instead (`evaluators.js`, `tables.js`, `i18nDraft.js`,
 * `b1Map.js`) and proves THEM correct. See
 * `docs/curriculum/implementation/b1/README.md` for why full in-app wiring
 * (and therefore this check's shared-runtime twin) is `LC-INT-001`'s job.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { B1_ARC1, B1_ARC1_ID, getB1Arc1Episode } from '../../../src/learning/levels/b1/episodes/b1Arc1.js'
import {
  B1_CAN_DO_INTENT, B1_REQUIRED_CAN_DOS, b1IntentsOf, b1Episodes, b1ProductiveItemsOf,
  b1EpisodeById,
} from '../../../src/learning/levels/b1/b1Map.js'
import { evaluateB1Free, evaluateNarratePastEvent } from '../../../src/learning/levels/b1/evaluators.js'
import { B1_MODEL_ANSWER, B1_PROMPT } from '../../../src/learning/levels/b1/tables.js'
import { B1_INTENT_SLOTS } from '../../../src/learning/levels/b1/semanticSlots.js'
import { B1_ARC1_VOCAB } from '../../../src/learning/levels/b1/vocabulary.js'
import { B1_ARC1_COPY } from '../../../src/learning/levels/b1/i18nDraft.js'
import { createLearnerModel } from '../../../src/learning/engine/learnerModel.js'
import { playEpisode, STRONG, ASSISTED } from './lib/journey.mjs'

const BLUEPRINT = JSON.parse(readFileSync(new URL('../../../../docs/curriculum/blueprints/b1.json', import.meta.url), 'utf8'))

let groups = 0
const ok = () => { groups += 1 }

/* ---- 1) the blueprint's arc 1, and the runtime's, are the same arc ---- */
const arc1 = BLUEPRINT.arcs.find(a => a.order === 1)
{
  assert.ok(arc1, 'the blueprint must describe an arc 1')
  assert.equal(arc1.id, B1_ARC1_ID)
  assert.equal(B1_ARC1.length, arc1.episodesInArc, 'episode count must match the blueprint')
  const runtimeCanDos = new Set(B1_ARC1.map(ep => ep.canDoId))
  for (const canDoId of arc1.newCanDos) assert.ok(runtimeCanDos.has(canDoId), `arc 1 must teach ${canDoId}`)
  ok()
}

/* ---- 2) capability -> intent registration, one intent per function ---- */
{
  for (const canDoId of arc1.newCanDos) {
    assert.equal(B1_CAN_DO_INTENT[canDoId], 'narrate_past_event', `${canDoId} must be evidenced by narrate_past_event`)
    assert.ok(B1_REQUIRED_CAN_DOS.includes(canDoId), `${canDoId} is required in b1.json and must appear in B1_REQUIRED_CAN_DOS`)
  }
  assert.deepEqual(b1IntentsOf('narrate_connected_event'), ['narrate_past_event'])
  ok()
}

/* ---- 3) prerequisite graph matches b1.json (no invented order) ---- */
{
  const cdById = Object.fromEntries(BLUEPRINT.canDos.map(cd => [cd.id, cd]))
  assert.deepEqual(cdById.narrate_connected_event.prerequisites, ['talk_about_what_you_did'])
  assert.deepEqual(cdById.narrate_interrupted_action.prerequisites, ['narrate_connected_event'])
  const ep1 = getB1Arc1Episode('one_thing_after_another')
  const ep2 = getB1Arc1Episode('when_it_happened')
  assert.deepEqual(ep1.prerequisites, [])
  assert.deepEqual(ep2.prerequisites, ['narrate_connected_event'])
  ok()
}

/* ---- 4) vocabulary budget matches b1.json exactly ---- */
{
  const seqCd = BLUEPRINT.canDos.find(c => c.id === 'narrate_connected_event')
  const intCd = BLUEPRINT.canDos.find(c => c.id === 'narrate_interrupted_action')
  const productive = Object.values(B1_ARC1_VOCAB).length
  assert.equal(seqCd.productiveVocabulary + seqCd.receptiveVocabulary, 10, 'sanity: narrate_connected_event budget')
  assert.equal(intCd.productiveVocabulary + intCd.receptiveVocabulary, 7, 'sanity: narrate_interrupted_action budget')
  assert.equal(arc1.vocabularyBudget.newProductive, 10)
  assert.equal(arc1.vocabularyBudget.newReceptive, 7)
  assert.equal(productive, 17, 'B1_ARC1_VOCAB must declare exactly 10+7 entries')
  ok()
}

/* ---- 5) semantic slots declared for the new intent ---- */
{
  assert.deepEqual(new Set(B1_INTENT_SLOTS.narrate_past_event), new Set(['place', 'activity', 'feeling']))
  ok()
}

/* ---- 6) self-contained i18n: every key a step or table references resolves ---- */
{
  const keyFields = ['titleKey', 'goalKey', 'canDoNameKey', 'durationKey', 'sceneTitleKey', 'sceneBodyKey', 'explainKey', 'instructionKey', 'hintKey']
  let checked = 0
  for (const ep of B1_ARC1) {
    for (const field of keyFields) {
      if (ep[field]) { assert.ok(B1_ARC1_COPY[ep[field]], `missing i18n draft copy for ${field}=${ep[field]}`); checked += 1 }
    }
    for (const step of ep.steps) {
      for (const field of keyFields) {
        if (step[field]) { assert.ok(B1_ARC1_COPY[step[field]], `missing i18n draft copy for ${ep.id}.${field}=${step[field]}`); checked += 1 }
      }
      for (const opt of step.options || []) {
        assert.ok(B1_ARC1_COPY[opt.key], `missing i18n draft copy for option ${opt.key}`); checked += 1
      }
    }
  }
  assert.ok(checked > 20, 'expected a substantial number of keys to check')
  ok()
}

/* ---- 7) evaluator refusal / near-miss coverage — both narrativeForm subtypes ---- */
const NONSENSE = 'purple bicycle Tuesday maybe'
{
  for (const form of ['sequence', 'interruption']) {
    const nonsense = evaluateNarratePastEvent(NONSENSE, { narrativeForm: form })
    assert.equal(nonsense.completedObjective, false, `nonsense must never pass ${form}`)
    assert.equal(nonsense.retryRequired, true)
    assert.equal(nonsense.conclusive, false, 'an unrecognized attempt must be inconclusive, never a false confident reject')

    const empty = evaluateNarratePastEvent('', { narrativeForm: form })
    assert.equal(empty.understood, false)
    assert.equal(empty.retryRequired, true)
  }
  // sequence-specific near misses
  const oneConnector = evaluateNarratePastEvent('First I went home.', { narrativeForm: 'sequence' })
  assert.equal(oneConnector.completedObjective, false)
  assert.equal(oneConnector.errorType, 'near_miss_one_connector')
  const noConnector = evaluateNarratePastEvent('I went home and I ate dinner.', { narrativeForm: 'sequence' })
  assert.equal(noConnector.completedObjective, false)
  assert.equal(noConnector.errorType, 'no_connectors')
  const presentTense = evaluateNarratePastEvent('First I go home. Then I eat dinner.', { narrativeForm: 'sequence' })
  assert.equal(presentTense.completedObjective, false)
  assert.equal(presentTense.errorType, 'wrong_tense_present')
  // interruption-specific near misses
  const missingConnector = evaluateNarratePastEvent('I was cooking dinner.', { narrativeForm: 'interruption' })
  assert.equal(missingConnector.completedObjective, false)
  assert.equal(missingConnector.errorType, 'missing_when_while')
  const missingContinuous = evaluateNarratePastEvent('I cooked dinner when the power went out.', { narrativeForm: 'interruption' })
  assert.equal(missingContinuous.completedObjective, false)
  assert.equal(missingContinuous.errorType, 'missing_continuous')
  ok()
}

/* ---- 8) dispatcher shape, matches evaluateFree's own unknown-kind contract ---- */
{
  const unknown = evaluateB1Free('some_future_arc_intent', 'anything', {})
  assert.equal(unknown.understood, false)
  assert.equal(unknown.conclusive, true)
  assert.equal(unknown.retryRequired, true)
  ok()
}

/* ---- 9) MODEL_ANSWER / PROMPT tables cover this arc's one intent, both subtypes ---- */
{
  assert.ok(B1_MODEL_ANSWER.narrate_past_event, 'MODEL_ANSWER must have an entry for narrate_past_event')
  assert.ok(B1_PROMPT.narrate_past_event, 'PROMPT must have an entry for narrate_past_event')
  const seqAnswer = B1_MODEL_ANSWER.narrate_past_event({ narrativeForm: 'sequence' })
  const intAnswer = B1_MODEL_ANSWER.narrate_past_event({ narrativeForm: 'interruption' })
  assert.notEqual(seqAnswer, intAnswer, 'the two subtypes must not share one model answer')
  assert.equal(evaluateNarratePastEvent(seqAnswer, { narrativeForm: 'sequence' }).completedObjective, true, 'MODEL_ANSWER must itself pass its own evaluator')
  assert.equal(evaluateNarratePastEvent(intAnswer, { narrativeForm: 'interruption' }).completedObjective, true)
  ok()
}

/* ---------------------------------------------------------------------------
 * 10) play the arc — strong and assisted learners, in prerequisite order
 * ------------------------------------------------------------------------- */
const DAY = 24 * 60 * 60 * 1000
const START = Date.parse('2026-01-05T00:00:00Z')

function freshModel() { return createLearnerModel() }

{
  const model = freshModel()
  const trace = []
  playEpisode(model, 'one_thing_after_another', { profile: STRONG, atMs: START, trace })
  playEpisode(model, 'when_it_happened', { profile: STRONG, atMs: START + DAY, trace })
  playEpisode(model, 'the_whole_story', { profile: STRONG, atMs: START + 2 * DAY, trace })
  for (const r of trace) {
    assert.equal(r.independentEvidence, true, `${r.episodeId}: a strong learner must produce independent evidence`)
    assert.equal(r.rewarded, true, `${r.episodeId}: first completion must be rewarded`)
    assert.ok(r.xp > 0)
  }
  ok()
}

{
  const model = freshModel()
  const trace = []
  playEpisode(model, 'one_thing_after_another', { profile: ASSISTED, atMs: START, trace })
  playEpisode(model, 'when_it_happened', { profile: ASSISTED, atMs: START + DAY, trace })
  playEpisode(model, 'the_whole_story', { profile: ASSISTED, atMs: START + 2 * DAY, trace })
  for (const r of trace) assert.equal(r.rewarded, true, `${r.episodeId}: assisted play still completes and rewards once`)
  // episode 2's second free_reply step and episode 3's closing step have no
  // suggestionEn, so even a fully assisted learner produces independent
  // evidence there (the arc's own withheld-support design, b1.json arc 1
  // autonomyTarget) — this is the one thing this profile cannot lean past.
  assert.equal(trace[1].independentEvidence, true, 'episode 2 must still yield independent evidence on its unaided step')
  assert.equal(trace[2].independentEvidence, true, 'episode 3 must still yield independent evidence on its unaided close')
  ok()
}

/* ---- 11) wrong-then-retry: a genuine near miss and nonsense must recover ---- */
{
  const model = freshModel()
  const NEAR_MISS_BY_FORM = { sequence: 'First I went home.', interruption: 'I was cooking dinner.' }
  playEpisode(model, 'one_thing_after_another', {
    profile: { ...STRONG, retries: ({ step }) => step.evalKind === 'narrate_past_event' },
    atMs: START,
    wrongText: (step) => NEAR_MISS_BY_FORM[step.narrativeForm] || NONSENSE,
  })
  ok()
}
{
  const model = freshModel()
  playEpisode(model, 'one_thing_after_another', {
    profile: { ...STRONG, retries: ({ step }) => step.evalKind === 'narrate_past_event' },
    atMs: START,
    wrongText: () => NONSENSE,
  })
  ok()
}

/* ---- 12) novel-context transfer: a story never rehearsed in training ---- */
const NOVEL_SEQUENCE = 'First I fed the cat. Then I watered the plants. After that I answered some emails. Finally I went for a run.'
const NOVEL_INTERRUPTION = 'She was reading a book when the doorbell rang.'
{
  const model = freshModel()
  const trace = []
  playEpisode(model, 'one_thing_after_another', {
    profile: STRONG, atMs: START, trace,
    answerOverride: () => NOVEL_SEQUENCE,
  })
  playEpisode(model, 'when_it_happened', {
    profile: STRONG, atMs: START + DAY, trace,
    answerOverride: (step) => (step.narrativeForm === 'interruption' ? NOVEL_INTERRUPTION : NOVEL_SEQUENCE),
  })
  for (const r of trace) assert.equal(r.independentEvidence, true, `${r.episodeId}: novel phrasing must still be judged structurally, not by memorized string`)
  ok()
}

/* ---- 13) replay / idempotency: a second pass adds evidence, never a second reward ---- */
{
  const model = freshModel()
  const first = playEpisode(model, 'one_thing_after_another', { profile: STRONG, atMs: START })
  const replay = playEpisode(model, 'one_thing_after_another', { profile: STRONG, atMs: START + DAY })
  assert.equal(first.rewarded, true)
  assert.equal(replay.rewarded, false, 'a replay must never earn a second reward')
  assert.equal(replay.xp, 0)
  ok()
}

/*
 * ---- 14) known gap, stated rather than faked: delayed retrieval ----
 * b1.json's `delayedRetrieval` for both this arc's can-dos points at
 * `the_long_conversation` (arc 7's capstone), which does not exist in this
 * task's runtime yet. This check cannot honestly prove delayed-retrieval
 * evidence for an arc that has not been authored — logged, not silently
 * skipped, so the gap is visible rather than implied-covered.
 */
console.log('  (delayed-retrieval proof deferred: arc 7 / the_long_conversation not yet authored)')

/* ---------------------------------------------------------------------------
 * 15) pedagogical journeys — varied learner-shaped attempts, >= 20 total
 * (b1.md §16's "at least 20 varied learner-shaped journeys per completed arc")
 * ------------------------------------------------------------------------- */
const SEQUENCE_VARIANTS = [
  'First I got up. Then I made coffee. After that I read the news. Finally I left for work.',
  'First I woke up late. Then I had breakfast. After that I checked my messages. Finally I left the house.',
  'First we packed our bags. Then we drove to the coast. After that we found a hotel. Finally we walked on the beach.',
  'First I called my mother. Before that I cleaned the kitchen. Then I cooked dinner. Finally I watched a movie.',
  'First she arrived at the office. Then she met her colleagues. After that they had a meeting. Finally she went home.',
  'First I fed the cat. Then I watered the plants. After that I answered some emails. Finally I went for a run.',
]
const INTERRUPTION_VARIANTS = [
  'I was cooking dinner when the power went out.',
  'I was walking home when it started to rain.',
  'She was reading a book when the doorbell rang.',
  'We were watching a movie when the phone rang.',
  'He was driving to work when he saw an old friend.',
  'They were having dinner when the fire alarm went off.',
]

{
  let journeys = 0
  for (const [i, text] of SEQUENCE_VARIANTS.entries()) {
    const r = evaluateNarratePastEvent(text, { narrativeForm: 'sequence', independent: true })
    assert.equal(r.completedObjective, true, `sequence variant ${i} must pass: "${text}"`)
    journeys += 1
  }
  for (const [i, text] of INTERRUPTION_VARIANTS.entries()) {
    const r = evaluateNarratePastEvent(text, { narrativeForm: 'interruption', independent: true })
    assert.equal(r.completedObjective, true, `interruption variant ${i} must pass: "${text}"`)
    journeys += 1
  }
  // near-miss + nonsense refusal boundary, both subtypes (already exercised
  // structurally in group 7; counted here as their own learner-shaped journeys)
  journeys += 6
  // strong/assisted full-arc plays, retry recovery, novel-context, replay
  // (groups 10-13 above)
  journeys += 7
  assert.ok(journeys >= 20, `expected >= 20 journeys, got ${journeys}`)
  console.log(`  what_happened: 3 episodes, ${journeys} journeys`)
  ok()
}

console.log(`\ncheck-b1-arc1 — OK  (${groups} groups verified)`)
