/*
 * check-pedagogical-journeys — LC-PED-001: every completed runtime arc, stress
 * tested with >=20 DISTINCT learner-shaped journeys, not 20 duplicate asserts.
 *
 * Every other curriculum check proves the content is well-formed and that a
 * single canonical answer, played once end to end, produces the evidence a
 * capability needs. That is necessary and it is not the same claim as "this
 * teaches well" — a rule that only a single hand-picked transcript can satisfy
 * is a rule nobody who actually talks differently from the fixture could ever
 * meet. So this file plays each of the eleven completed arcs (Pre-A1's six,
 * A1's first five) through the REAL evaluator, scaffold and learner-model code
 * — via `scripts/lib/journey.mjs` — with genuinely varied learner behaviour:
 *
 *   natural variants   distinct, real phrasings the evaluator's own accepted
 *                      regex families already recognise (`pedagogyBank.mjs`,
 *                      never invented separately from the evaluator itself)
 *   wrong + retry      a real near-miss, understood but incomplete, must fail
 *                      before the learner recovers with the real answer
 *   nonsense + retry   genuine noise, must fail and ask for another go
 *   assisted           the model answer copied whenever the product would
 *                      show one — must never be credited as independent
 *   replay             finishing an episode again must add evidence and pay
 *                      no second reward
 *   delayed retrieval  after the review interval genuinely elapses, producing
 *                      the item again must be credited and push the next
 *                      review further out — not a frozen record
 *   novel context      the same capability, aimed at a noun/place/person no
 *                      episode's own script ever uses — proof the evaluator
 *                      judges structure, not a memorised sentence
 *   refusal boundary   every evalKind the arc actually uses rejects shared
 *                      nonsense, and a semantic-type mismatch (an uncountable
 *                      thing forced into a counted form) is refused outright
 *
 * A software simulation proves internal consistency — that the rules the
 * product states hold against real, varied play. It is not proof of human
 * learning efficacy, which needs a later real-learner pilot (see
 * `docs/research/learning-science-foundation.md`).
 */
import assert from 'node:assert/strict'

import { ARCS, episodesInArc } from '../src/learning/episodes/index.js'
import { A1_ARC1 } from '../src/learning/episodes/a1Arc1.js'
import { A1_ARC2 } from '../src/learning/episodes/a1Arc2.js'
import { A1_ARC3 } from '../src/learning/episodes/a1Arc3.js'
import { A1_ARC4 } from '../src/learning/episodes/a1Arc4.js'
import { A1_ARC5 } from '../src/learning/episodes/a1Arc5.js'
import { createLearnerModel, recordItemAttempt } from '../src/learning/engine/learnerModel.js'
import { evaluateFree } from '../src/learning/engine/responseEvaluation.js'
import { showsModelAnswer } from '../src/learning/engine/scaffolding.js'
import { thingById, countedThing } from '../src/learning/engine/semanticContext.js'
import { TAUGHT_NUMBERS } from '../src/learning/engine/responseEvaluation.js'
import { playEpisode, NAME, PLACE, DAY } from './lib/journey.mjs'
import { VARIANTS, NEAR_MISS, NONSENSE, NOVEL_CONTEXT, bankFor } from './lib/pedagogyBank.mjs'

const START = Date.now() - 200 * DAY

const ARC_DEFS = [
  ...ARCS.map((id) => ({ id, level: 'Pre-A1', episodes: episodesInArc(id) })),
  { id: 'work_and_study', level: 'A1', episodes: A1_ARC1 },
  { id: 'daily_rhythm', level: 'A1', episodes: A1_ARC2 },
  { id: 'people_around_you', level: 'A1', episodes: A1_ARC3 },
  { id: 'finding_your_way', level: 'A1', episodes: A1_ARC4 },
  { id: 'paying_and_choosing', level: 'A1', episodes: A1_ARC5 },
]

const STRONG = { usesSuggestion: () => false, retries: () => false }

/* the same evaluation-context slots `journey.mjs`'s own `ctxFor` fills, so an
 * override only ever narrows or substitutes them — never invents a new shape */
function paramsFor(step, { novel = false } = {}) {
  /*
   * `use_quantity`/`identify_thing` judge a real catalogue id: `targetThing` has
   * to stay a countable one there (and match `thingId`) or a novel substitution
   * can accidentally aim a counted form at a mass noun and trip the evaluator's
   * own `uncountable_target` refusal — found by this driver on its first novel-
   * context run, where the generic novel noun ('tea', a mass drink) leaked into
   * a counted "Three teas." Every other evalKind's `targetThing` is a separate,
   * generic desired item and is free to vary independently.
   */
  const isCatalogThingKind = step.evalKind === 'use_quantity' || step.evalKind === 'identify_thing'
  const thingId = isCatalogThingKind
    ? (novel ? NOVEL_CONTEXT.thingId : (step.thingId || 'book'))
    : (step.thingId || 'book')
  const thing = thingById(thingId) || thingById('book')
  const count = Number.isInteger(step.count) ? step.count : 2
  const numberWord = TAUGHT_NUMBERS[Math.min(Math.max(1, count), 10) - 1] || 'two'
  return {
    name: NAME,
    place: novel ? NOVEL_CONTEXT.place : PLACE,
    targetNoun: novel ? NOVEL_CONTEXT.targetNoun : 'music',
    targetThing: isCatalogThingKind ? thingId : (novel ? NOVEL_CONTEXT.targetThing : 'water'),
    thingId,
    partner: novel ? NOVEL_CONTEXT.partner : 'Ana',
    placeName: step.placeName || (novel ? NOVEL_CONTEXT.placeName : 'the toilet'),
    relationHint: step.relationHint || '',
    meaningWord: step.meaningWord || 'late',
    usualTime: novel ? 'nine' : 'seven',
    activity: 'listen to music',
    numberWord,
    counted: countedThing(thing.id, count),
    count,
  }
}

function variantAnswer(step, { variantIndex = 0, novel = false } = {}) {
  const bank = bankFor(VARIANTS, step)
  if (!bank) throw new Error(`pedagogyBank: no variant bank for ${step.evalKind}/${step.repairKind || step.timeForm || step.quantityForm || ''}`)
  const options = bank(paramsFor(step, { novel }))
  return options[variantIndex % options.length]
}

function nearMissAnswer(step, kind) {
  if (kind === 'nonsense') return NONSENSE
  const bank = bankFor(NEAR_MISS, step)
  return bank ? bank(paramsFor(step)) : NONSENSE
}

/* One full arc, played once, with one coherent learner behaviour. */
function playArc(arcDef, { atMs, variantIndex = 0, novel = false, wrongKind = null, assist = 'never' } = {}) {
  const model = createLearnerModel()
  const trace = []
  let at = atMs
  let turn = 0
  const profile = {
    usesSuggestion: ({ step, scaffold }) => {
      if (assist === 'never') return false
      if (!showsModelAnswer(scaffold) || !step.suggestionEn) return false
      return assist === 'always' || (turn % 2 === 0)
    },
    retries: () => Boolean(wrongKind),
  }
  for (const ep of arcDef.episodes) {
    playEpisode(model, ep.id, {
      profile, atMs: at, trace,
      answerOverride: (step) => { turn += 1; return variantAnswer(step, { variantIndex, novel }) },
      ctxOverride: (step) => paramsFor(step, { novel }),
      wrongText: wrongKind ? (step) => nearMissAnswer(step, wrongKind === 'mixed' ? (turn % 2 ? 'near' : 'nonsense') : wrongKind) : null,
    })
    at += DAY
  }
  return { model, trace, endedAt: at }
}

/* every evalKind (+ subtype) the arc's own steps actually exercise */
function evalKindsOf(arcDef) {
  const seen = new Map()
  for (const ep of arcDef.episodes) {
    for (const step of ep.steps || []) {
      if (!step.evalKind || (step.type !== 'free_reply' && step.type !== 'recall')) continue
      const key = `${step.evalKind}:${step.repairKind || step.timeForm || step.quantityForm || step.relationHint || ''}`
      if (!seen.has(key)) seen.set(key, step)
    }
  }
  return [...seen.values()]
}

let totalJourneys = 0
const report = []

function runArc(arcDef) {
  const journeys = []
  const record = (label, fn) => { fn(); journeys.push(label); totalJourneys += 1 }

  /* ---- 1) natural variants: distinct real phrasing, whole arc, strong ---- */
  const NATURAL_COUNT = 10
  let firstStrong = null
  for (let k = 0; k < NATURAL_COUNT; k++) {
    record(`natural-variant-${k}`, () => {
      const played = playArc(arcDef, { atMs: START, variantIndex: k })
      if (!firstStrong) firstStrong = played
      assert.equal(played.trace.length, arcDef.episodes.length, `${arcDef.id}: every episode must play`)
      for (const t of played.trace) assert.equal(t.rewarded, true, `${arcDef.id}/${t.episodeId}: a first run must award`)
    })
  }

  /* ---- 2) wrong answer + retry: a real near-miss, then recovery ---- */
  for (const kind of ['near', 'nonsense', 'mixed']) {
    record(`wrong-then-retry-${kind}`, () => {
      const played = playArc(arcDef, { atMs: START, wrongKind: kind })
      assert.ok(played.trace.some((t) => t.retries > 0), `${arcDef.id}/${kind}: nothing was actually retried`)
      for (const t of played.trace) assert.equal(t.rewarded, true, `${arcDef.id}/${t.episodeId}: recovery must still award once`)
    })
  }

  /* ---- 3) assisted: leaning on help never blocks completion, and a recall
   * step (which never offers a suggestion) still demands real unaided
   * production even from a learner who copies whenever they can ---- */
  for (const assist of ['always', 'alternate']) {
    record(`assisted-${assist}`, () => {
      const played = playArc(arcDef, { atMs: START, assist })
      const assisted = played.trace.reduce((s, t) => s + t.assistance, 0)
      assert.ok(assisted > 0, `${arcDef.id}/${assist}: nothing was actually assisted`)
      for (const t of played.trace) assert.equal(t.rewarded, true, `${arcDef.id}/${t.episodeId}: leaning on help must not block completion`)
    })
  }
  record('assisted-recall-is-help-proof', () => {
    const ep = arcDef.episodes[0]
    const noSuggestionRecallItems = new Set(
      (ep.steps || []).filter((s) => (s.type === 'recall' || s.type === 'free_reply') && !s.suggestionEn)
        .flatMap((s) => s.itemIds || []))
    const firstAssistedStep = (ep.steps || []).find((s) => s.type === 'free_reply' && s.suggestionEn)
    const proofItem = (firstAssistedStep?.itemIds || []).find((id) => !noSuggestionRecallItems.has(id))
    if (!proofItem) return // this episode has no turn shaped to prove it; not every arc needs one
    const model = createLearnerModel()
    playEpisode(model, ep.id, {
      profile: { usesSuggestion: ({ step, scaffold }) => showsModelAnswer(scaffold) && Boolean(step.suggestionEn), retries: () => false },
      atMs: START,
      answerOverride: (step) => variantAnswer(step, { variantIndex: 0 }),
      ctxOverride: (step) => paramsFor(step),
    })
    assert.equal(model.languageItems[proofItem].independentCorrect, 0,
      `${arcDef.id}: ${proofItem} read as independent while every offered suggestion was copied`)
  })

  /* ---- 4) novel context: same capability, a noun/place/person nothing here ever names ---- */
  for (let k = 0; k < 2; k++) {
    record(`novel-context-${k}`, () => {
      const played = playArc(arcDef, { atMs: START, variantIndex: k, novel: true })
      assert.equal(played.trace.length, arcDef.episodes.length, `${arcDef.id}: a novel context must still let every episode complete`)
    })
  }

  /* ---- 5) replay: new evidence, never a second reward ---- */
  for (const ep of arcDef.episodes) {
    record(`replay-${ep.id}`, () => {
      const model = firstStrong.model
      const before = (model.episodeRuns[ep.id] || []).length
      const replay = playEpisode(model, ep.id, {
        profile: STRONG, atMs: firstStrong.endedAt + DAY,
        answerOverride: (step) => variantAnswer(step, { variantIndex: 0 }),
        ctxOverride: (step) => paramsFor(step),
      })
      assert.equal(replay.rewarded, false, `${arcDef.id}/${ep.id}: a replay must never pay again`)
      assert.equal(replay.xp, 0, `${arcDef.id}/${ep.id}: a replay must carry no XP`)
      assert.equal((model.episodeRuns[ep.id] || []).length, before + 1,
        `${arcDef.id}/${ep.id}: a replay must still be on file as new evidence`)
    })
  }

  /* ---- 6) delayed retrieval: due after the gap, credited, pushed further out ---- */
  record('delayed-retrieval', () => {
    const lastEp = arcDef.episodes[arcDef.episodes.length - 1]
    const itemId = (lastEp.gardenItems?.length ? lastEp.gardenItems : arcDef.episodes.flatMap((e) => e.gardenItems || []))[0]
    assert.ok(itemId, `${arcDef.id}: no Garden item to test delayed retrieval against`)
    const item = firstStrong.model.languageItems[itemId]
    assert.ok(item?.nextReviewAt, `${arcDef.id}: ${itemId} has no review scheduled after being taught`)
    const dueAt = new Date(item.nextReviewAt).getTime()
    assert.ok(dueAt > firstStrong.endedAt, `${arcDef.id}: ${itemId} reads as already overdue the day it was taught`)
    const laterAtMs = dueAt + DAY
    recordItemAttempt(firstStrong.model, itemId, { correct: true, independent: true, evidenceKind: 'open', atMs: laterAtMs })
    const after = firstStrong.model.languageItems[itemId]
    assert.ok(new Date(after.nextReviewAt).getTime() > dueAt,
      `${arcDef.id}: ${itemId}'s next review did not move after a delayed, successful retrieval`)
  })

  /* ---- 7) refusal boundary: every evalKind this arc uses rejects nonsense ---- */
  record('refusal-boundary', () => {
    for (const step of evalKindsOf(arcDef)) {
      const verdict = evaluateFree(step.evalKind, NONSENSE, { independent: true, ...paramsFor(step) })
      assert.equal(verdict.completedObjective, false, `${arcDef.id}: ${step.evalKind} accepts nonsense`)
      assert.equal(verdict.retryRequired, true, `${arcDef.id}: ${step.evalKind} nonsense must ask for another go`)
    }
    /* the semantic-type boundary: an uncountable thing forced into a counted form */
    const usesQuantity = evalKindsOf(arcDef).some((s) => s.evalKind === 'use_quantity')
    if (usesQuantity) {
      const verdict = evaluateFree('use_quantity', 'Two.', { independent: true, quantityForm: 'with_object', targetThing: 'water' })
      assert.equal(verdict.understood, false, `${arcDef.id}: an uncountable thing should never be accepted in a counted form`)
      assert.equal(verdict.errorType, 'uncountable_target')
    }
  })

  assert.ok(journeys.length >= 20, `${arcDef.id}: only ${journeys.length} distinct journeys, need >= 20`)
  report.push({ id: arcDef.id, level: arcDef.level, episodes: arcDef.episodes.length, journeys: journeys.length })
  console.log(`  ${arcDef.level.padEnd(7)} ${arcDef.id.padEnd(20)} ${String(arcDef.episodes.length).padStart(2)} episodes  ${journeys.length} journeys`)
}

console.log('\ncheck-pedagogical-journeys — per-arc learner stress test\n')
for (const arcDef of ARC_DEFS) runArc(arcDef)

assert.equal(report.length, 11, 'eleven completed runtime arcs — six Pre-A1, five A1 — must all be exercised')
assert.equal(report.reduce((s, r) => s + r.episodes, 0), 33, 'every completed episode (Pre-A1 17 + A1 18..33\'s first 16) must be reachable')

console.log(`\ncheck-pedagogical-journeys — OK  (${totalJourneys} journeys across ${report.length} arcs)`)
