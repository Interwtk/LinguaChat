#!/usr/bin/env node
/*
 * check-episodes — unit-style checks for the deterministic response evaluation
 * and the episode arc data. No test runner needed; pure ESM imports.
 *
 * Verifies that valid introduction variants are accepted, incomplete answers are
 * rejected with a pedagogical error, and that the three-episode arc is coherent
 * (unique ids, prerequisites resolvable, steps well-formed). Exits 1 on failure.
 */
import { evaluateIntroduction, evaluateAskName, evaluateNiceToMeet } from '../src/learning/engine/responseEvaluation.js'
import { ARC, getEpisode } from '../src/learning/episodes/index.js'

let failures = 0
function check(label, cond) {
  if (!cond) { console.log('  FAIL: ' + label); failures++ }
}

/* ---- introduction: accepted variants ---- */
const NAME = 'Sebastian'
const accept = [
  "Hi, I'm Sebastian.",
  "Hello, I'm Sebastian.",
  "I'm Sebastian.",
  "My name is Sebastian.",
  "Hey, I'm Sebastian.",
  "hi im sebastian",
  "Hi! I'm Sebastián 😊",
  "   Hi,   I'm Sebastian   ",
  "Hi, I'm Sebastian",
  "I’m Sebastian.", // typographic apostrophe
]
for (const text of accept) {
  const r = evaluateIntroduction(text, { name: NAME })
  check(`accept introduction: "${text}"`, r.completedObjective === true && r.retryRequired === false)
}

/* ---- introduction: rejected (pedagogically) ---- */
const reject = [
  ['Sebastian', 'missing_copula'],
  ['Hi', 'greeting_only'],
  ['I Sebastian', 'missing_copula'],
  ['', 'empty'],
  ["Hi, I'm.", 'missing_name'],
]
for (const [text, errorType] of reject) {
  const r = evaluateIntroduction(text, { name: NAME })
  check(`reject introduction "${text}" -> ${errorType}`, r.completedObjective === false && r.retryRequired === true && r.errorType === errorType)
  check(`reject introduction "${text}" gives a natural version`, typeof r.naturalVersion === 'string' && r.naturalVersion.length > 0)
}

/* ---- independence evidence ---- */
const indep = evaluateIntroduction("I'm Sebastian.", { name: NAME, independent: true })
check('independent flagged', indep.masteryEvidence.independent === true && indep.masteryEvidence.scaffoldUsed === false)
const helped = evaluateIntroduction("I'm Sebastian.", { name: NAME, independent: false })
check('scaffold flagged', helped.masteryEvidence.scaffoldUsed === true)

/* ---- ask name ---- */
for (const text of ["What's your name?", 'what is your name', 'Whats your name?', "WHAT'S YOUR NAME"]) {
  check(`accept ask-name: "${text}"`, evaluateAskName(text).completedObjective === true)
}
for (const text of ['your name?', 'name', '']) {
  check(`reject ask-name: "${text}"`, evaluateAskName(text).completedObjective === false)
}

/* ---- nice to meet you ---- */
check('accept nice', evaluateNiceToMeet('Nice to meet you.').completedObjective === true)
check('accept nice too (variant)', evaluateNiceToMeet('Nice to meet you too.').acceptedVariant === true)
check('reject nice partial', evaluateNiceToMeet('meet you').completedObjective === false)

/* ---- arc integrity ---- */
check('arc has 3 episodes', ARC.length === 3)
const ids = new Set(ARC.map(e => e.id))
check('arc ids unique', ids.size === ARC.length)
for (const ep of ARC) {
  check(`episode ${ep.id} has canDoId`, Boolean(ep.canDoId))
  check(`episode ${ep.id} has titleKey`, Boolean(ep.titleKey))
  check(`episode ${ep.id} has steps`, Array.isArray(ep.steps) && ep.steps.length > 0)
  check(`episode ${ep.id} prerequisites resolvable`, (ep.prerequisites || []).every(p => getEpisode(p)))
  for (const step of ep.steps) {
    check(`episode ${ep.id} step has type`, Boolean(step.type))
  }
}

console.log(`\ncheck-episodes — ${failures ? 'FAIL (' + failures + ')' : 'OK'}\n`)
process.exit(failures ? 1 : 0)
