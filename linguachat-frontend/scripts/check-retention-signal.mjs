#!/usr/bin/env node
/*
 * check-retention-signal — one sitting is not remembering.
 *
 * Simulated learners. It proves the signal behaves as specified, and prints the
 * measurement that justifies it: how much of what a lesson marks `can_use` was
 * only ever produced in one sitting. It proves nothing about real learners.
 */
import assert from 'node:assert/strict'
import {
  DAYS_TO_RETAINED, INDEPENDENT_DAYS_KEPT, createLearnerModel, getDueReviews, learningStateOf, mergeLanguageItems, migrateLearnerModel, recordItemAttempt, retentionOfItem,
} from '../src/learning/engine/learnerModel.js'
import { learnerSummary } from '../src/learning/engine/learnerSummary.js'
import { copiesShownModel } from '../src/learning/engine/scaffolding.js'
import { ES_EPISODES } from '../src/learning/courses/es/preA1Content.js'

const T0 = Date.UTC(2026, 10, 2, 9)
const DAY = 86400000
let passed = 0
const check = (name, run) => { run(); passed++; console.log('  ok  ' + name) }
const open = (m, id, atMs, correct = true, independent = true) => recordItemAttempt(m, id, { correct, independent, evidenceKind: 'open', atMs })

check('twice in one sitting is can_use, and still same_day', () => {
  const m = createLearnerModel()
  open(m, 'x', T0); open(m, 'x', T0 + 60000)
  assert.equal(learningStateOf(m, 'x'), 'can_use')
  assert.equal(retentionOfItem(m.languageItems.x), 'same_day')
})
check('a second day makes it retained', () => {
  const m = createLearnerModel()
  open(m, 'x', T0); open(m, 'x', T0 + DAY)
  assert.equal(DAYS_TO_RETAINED, 2)
  assert.equal(retentionOfItem(m.languageItems.x), 'retained')
})
check('help never counts as a day', () => {
  const m = createLearnerModel()
  open(m, 'x', T0); open(m, 'x', T0 + DAY, true, false)
  recordItemAttempt(m, 'x', { correct: true, independent: true, evidenceKind: 'guided', atMs: T0 + 2 * DAY })
  assert.equal(retentionOfItem(m.languageItems.x), 'same_day')
})
check('repeating the model on screen cannot climb: the caller marks it as help', () => {
  assert.ok(copiesShownModel('me llamo ana', 'Me llamo Ana.'))
  const m = createLearnerModel()
  for (let day = 0; day < 5; day++) open(m, 'x', T0 + day * DAY, true, false)
  assert.equal(retentionOfItem(m.languageItems.x), 'none')
  assert.notEqual(learningStateOf(m, 'x'), 'can_use')
})
check('a later miss is a lapse; the same sitting is not', () => {
  const m = createLearnerModel()
  open(m, 'x', T0); open(m, 'x', T0 + 1000, false)
  assert.equal(m.languageItems.x.lapses, 0)
  open(m, 'x', T0 + 3 * DAY, false)
  assert.equal(m.languageItems.x.lapses, 1)
  assert.equal(retentionOfItem(m.languageItems.x), 'lapsed')
  open(m, 'x', T0 + 3 * DAY + 1000, false)
  assert.equal(m.languageItems.x.lapses, 1, 'one forgetting, however many misses')
})
check('forgetting does not unlearn: can_use stays, and recovery clears it', () => {
  const m = createLearnerModel()
  open(m, 'x', T0); open(m, 'x', T0 + DAY); open(m, 'x', T0 + 5 * DAY, false)
  assert.equal(learningStateOf(m, 'x'), 'can_use')
  open(m, 'x', T0 + 6 * DAY)
  assert.equal(retentionOfItem(m.languageItems.x), 'retained')
  assert.equal(m.languageItems.x.lapses, 1)
})
check('what was lost comes back first in review', () => {
  const m = createLearnerModel()
  open(m, 'old', T0); open(m, 'lost', T0 + DAY); open(m, 'lost', T0 + 3 * DAY, false)
  assert.deepEqual(getDueReviews(m, T0 + 60 * DAY), ['lost', 'old'])
})
check('the days kept are bounded', () => {
  const m = createLearnerModel()
  for (let day = 0; day < 30; day++) open(m, 'x', T0 + day * DAY)
  assert.equal(m.languageItems.x.independentDays.length, INDEPENDENT_DAYS_KEPT)
})
check('two tabs union their days, and the newest copy says if it was recovered', () => {
  const a = createLearnerModel()
  const b = createLearnerModel()
  open(a, 'x', T0)
  open(b, 'x', T0 + 2 * DAY)
  const merged = mergeLanguageItems(a.languageItems, b.languageItems)
  assert.equal(merged.x.independentDays.length, 2)
  open(a, 'x', T0 + 5 * DAY, false)
  open(b, 'x', T0 + 6 * DAY)
  assert.equal(mergeLanguageItems(a.languageItems, b.languageItems).x.lapsed, false)
  assert.equal(mergeLanguageItems(b.languageItems, a.languageItems).x.lapses, 1)
})
check('items stored before this signal read as none and lose nothing', () => {
  const stored = { version: 6, episodes: {}, languageItems: { x: { status: 'can_do', learningState: 'can_use', correct: 4, incorrect: 1, independentCorrect: 3, guidedCorrect: 0, recognisedCorrect: 0, streak: 2, nextReviewAt: null, lastSeenAt: null } } }
  const m = migrateLearnerModel(stored)
  assert.equal(m.languageItems.x.learningState, 'can_use')
  assert.equal(m.languageItems.x.independentCorrect, 3)
  assert.equal(retentionOfItem(m.languageItems.x), 'none')
  open(m, 'x', T0)
  assert.equal(m.languageItems.x.correct, 5)
})
check('damaged fields are ignored', () => {
  assert.equal(retentionOfItem({ independentDays: 'x' }), 'none')
  assert.equal(retentionOfItem({ independentDays: ['nope', 7] }), 'none')
  assert.equal(retentionOfItem(null), 'none')
})
check('the summary counts by course and never mixes them', () => {
  const m = createLearnerModel()
  open(m, 'es:a', T0); open(m, 'es:a', T0 + DAY); open(m, 'b', T0)
  assert.equal(learnerSummary(m, T0 + 2 * DAY, { courseId: 'es' }).words.retained, 1)
  assert.equal(learnerSummary(m, T0 + 2 * DAY, { courseId: 'en' }).words.retained, 0)
})

// the measurement: every Spanish lesson, every open turn answered unaided, in one sitting
{
  const m = createLearnerModel()
  let at = T0
  for (const ep of ES_EPISODES) {
    for (const step of ep.steps) {
      if (step.type !== 'free_reply' && step.type !== 'recall') continue
      for (const id of step.itemIds || step.targetItems || []) open(m, id, at += 1000)
    }
  }
  const canUse = Object.values(m.languageItems).filter(x => x.learningState === 'can_use').length
  const retained = Object.values(m.languageItems).filter(x => retentionOfItem(x) === 'retained').length
  assert.ok(canUse > 0)
  assert.equal(retained, 0)
  passed++
  console.log(`  measured: all 12 Spanish lessons unaided in one day: can_use ${canUse}, retained ${retained}`)
}
console.log(`check-retention-signal: ${passed} passed, 0 failed`)
