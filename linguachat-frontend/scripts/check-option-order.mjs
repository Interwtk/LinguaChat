#!/usr/bin/env node
/*
 * check-option-order — where the right answer is shown, measured for every level.
 *
 * Prints the comparison the owner needs for the decision: authored position,
 * what this build shows, and what approving would show. Proves the content was
 * not reordered and that frozen content keeps its order until approval.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { AWAITING_OWNER_APPROVAL, displayOrder, shownEpisodeOptions, shownPlacementOptions } from '../src/learning/engine/optionOrder.js'
import * as preA1 from '../src/learning/episodes/index.js'
import { PLACEMENT_QUESTIONS } from '../src/data/placementQuestions.js'
import { levelIdOfEpisodeId } from '../src/learning/curriculum/levels.js'
import { evaluateAnswer, getInitialPlacementState } from '../src/services/placement.js'

let passed = 0
const ok = (cond, msg) => { assert.ok(cond, msg); passed++ }

const found = new Map()
const collect = (module) => {
  for (const value of Object.values(module)) for (const e of (Array.isArray(value) ? value : [value])) if (e?.id && Array.isArray(e.steps)) found.set(e.id, e)
}
collect(preA1)
for (const n of [1, 2, 3, 4, 5]) collect(await import(`../src/learning/episodes/a1Arc${n}.js`))
for (const n of [6, 7]) collect(await import(`../src/learning/episodes/a1Arc${n}Content.js`))

const stats = { pre_a1: { steps: 0, authored: [], shown: [], approved: [] }, a1: { steps: 0, authored: [], shown: [], approved: [] } }
for (const ep of found.values()) {
  const level = levelIdOfEpisodeId(ep.id)
  if (!stats[level]) continue
  ep.steps.forEach((step, stepIndex) => {
    if (!Array.isArray(step.options) || !step.options.some(o => o.correct) || step.options.every(o => o.correct)) return
    const seed = `${ep.id}:${stepIndex}`
    const shown = shownEpisodeOptions(step.options, ep.id, stepIndex)
    const approved = displayOrder(step.options, seed)
    ok(shown.length === step.options.length && shown.every(o => step.options.includes(o)), `${seed} shows every option once`)
    ok(JSON.stringify(shownEpisodeOptions(step.options, ep.id, stepIndex)) === JSON.stringify(shown), `${seed} is stable across reloads`)
    const s = stats[level]
    s.steps++
    s.authored.push(step.options.findIndex(o => o.correct))
    s.shown.push(shown.findIndex(o => o.correct))
    s.approved.push(approved.findIndex(o => o.correct))
  })
}
const count = (list) => [0, 1, 2, 3].map(p => list.filter(x => x === p).length).join(' / ')
const share = (list, at) => list.filter(p => p === at).length / list.length

// 21 and 35 choice steps in all; 4 and 1 of them accept every option, so position means nothing there
ok(stats.pre_a1.steps === 17, `17 Pre-A1 steps with one right answer (found ${stats.pre_a1.steps})`)
ok(stats.a1.steps === 34, `34 A1 steps with one right answer (found ${stats.a1.steps})`)
ok(share(stats.pre_a1.authored, 0) === 1 && share(stats.a1.authored, 0) === 1, 'the content still lists the right answer first: nothing was reordered')
ok(AWAITING_OWNER_APPROVAL.has('pre_a1') && AWAITING_OWNER_APPROVAL.has('placement'), 'frozen content is waiting for the owner, as agreed')
ok(JSON.stringify(stats.pre_a1.shown) === JSON.stringify(stats.pre_a1.authored), 'Pre-A1 shows the authored order until approved')
ok(share(stats.a1.shown, 0) <= 0.5, `A1 shows the right answer first in ${Math.round(share(stats.a1.shown, 0) * 100)}% (was 100%)`)
ok(share(stats.pre_a1.approved, 0) <= 0.5, 'approval would take Pre-A1 to 50% or less')

const placementAuthored = PLACEMENT_QUESTIONS.map(q => q.options.findIndex(o => o.id === q.correctOptionId))
const placementApproved = PLACEMENT_QUESTIONS.map(q => displayOrder(q.options, q.id).findIndex(o => o.id === q.correctOptionId))
ok(PLACEMENT_QUESTIONS.every(q => JSON.stringify(shownPlacementOptions(q)) === JSON.stringify(q.options)), 'placement shows the authored order until approved')
ok(share(placementApproved, 0) <= 0.5, 'approval would take placement to 50% or less')

const shell = readFileSync(new URL('../src/components/episode/EpisodeShell.jsx', import.meta.url), 'utf8')
ok((shell.match(/shownEpisodeOptions\(step\.options, ep\.id, stepIndex\)/g) || []).length === 2, 'comprehension and choice steps both go through the policy')
ok(!/\{step\.options\.map\(/.test(shell), 'no option list renders around the policy')
ok(/shownPlacementOptions\(question\)/.test(readFileSync(new URL('../src/components/setup/SetupFlow.jsx', import.meta.url), 'utf8')), 'placement goes through the policy')

/*
 * Equivalence: what approval would change is ONLY where things are drawn. Each
 * displayed option is the same object, a click records `opt.correct` (never the
 * index), the chosen index lives in component state only, and placement scores
 * by option id. So answers, scoring, progress, evidence and persistence are the
 * same whether the order is authored or rotated.
 */
const approveAll = () => { const was = [...AWAITING_OWNER_APPROVAL]; AWAITING_OWNER_APPROVAL.clear(); return () => was.forEach(x => AWAITING_OWNER_APPROVAL.add(x)) }
{
  const restore = approveAll()
  let equal = 0
  for (const ep of found.values()) {
    ep.steps.forEach((step, stepIndex) => {
      if (!Array.isArray(step.options)) return
      const shown = shownEpisodeOptions(step.options, ep.id, stepIndex)
      // clicking each option, in either order, records the same correctness for the same option
      for (const opt of step.options) {
        const at = shown.indexOf(opt)
        ok(at >= 0 && shown[at].correct === opt.correct, `${ep.id}:${stepIndex} same option object, same correctness`)
      }
      const sum = (list) => list.filter(o => o.correct).length
      ok(sum(shown) === sum(step.options), `${ep.id}:${stepIndex} same number of right answers`)
      equal++
    })
  }
  const answers = PLACEMENT_QUESTIONS.map(q => evaluateAnswer(q, q.correctOptionId, getInitialPlacementState('A2')))
  ok(PLACEMENT_QUESTIONS.every(q => shownPlacementOptions(q).some(o => o.id === q.correctOptionId)), 'placement: the right option is still offered')
  ok(answers.every(a => a.answer.isCorrect === true), 'placement scores by option id, not position')
  restore()
  ok(AWAITING_OWNER_APPROVAL.has('pre_a1'), 'the simulation of approval is undone')
  ok(equal > 50, `equivalence measured on ${equal} steps`)
}
const shellSource = readFileSync(new URL('../src/components/episode/EpisodeShell.jsx', import.meta.url), 'utf8')
ok((shellSource.match(/recordItems\(\[step\.itemId\]\.filter\(Boolean\), \{ correct: Boolean\(opt\.correct\), independent: false \}\)/g) || []).length === 2, 'both choice steps record opt.correct, never the index')
ok(/const \[choice, setChoice\] = useState\(null\)/.test(shellSource) && !/save\w*\([^)]*choice/.test(shellSource), 'the chosen position is component state, never stored')
ok(/onClick=\{\(\) => chooseOption\(option\.id\)\}/.test(readFileSync(new URL('../src/components/setup/SetupFlow.jsx', import.meta.url), 'utf8')), 'placement answers by id')

console.log('Right answer in position 1 / 2 / 3 / 4:')
console.log(`  Pre-A1    (${stats.pre_a1.steps})  authored ${count(stats.pre_a1.authored)} · shown today ${count(stats.pre_a1.shown)} · if approved ${count(stats.pre_a1.approved)}`)
console.log(`  A1        (${stats.a1.steps})  authored ${count(stats.a1.authored)} · shown today ${count(stats.a1.shown)}`)
console.log(`  Placement (${PLACEMENT_QUESTIONS.length})  authored ${count(placementAuthored)} · shown today ${count(placementAuthored)} · if approved ${count(placementApproved)}`)
console.log(`check-option-order: ${passed} passed, 0 failed`)
