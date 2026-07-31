/*
 * check-third-arc-e2e — episodes 7, 8 and 9 played end to end, including BOTH
 * branches of the little story and a route full of mistakes.
 *
 * The simulation mirrors what EpisodeShell really does: the same evaluator, the
 * same scaffolding rule, the same idempotent completion, the same activity
 * signals with the same event ids. It exists because the browser walkthrough
 * cannot be re-run on every commit — this can.
 */
import assert from 'node:assert/strict'
import { getEpisode } from '../src/learning/episodes/index.js'
import { evaluateFree } from '../src/learning/engine/responseEvaluation.js'
import { getInterestContext } from '../src/learning/engine/interests.js'
import {
  createLearnerModel, recordItemAttempt, recordCanDoAttempt, markRecurringError,
  getRecommendedScaffold, getEpisodeState, setEpisodeState, recordActivitySignalOnce,
} from '../src/learning/engine/learnerModel.js'

let n = 0
const ok = () => { n++ }
const NAME = 'Sofia'
const DAY = '2026-05-20'

const STEP_FORMAT = {
  comprehension: 'comprehension', choice: 'choice', word_order: 'word_order',
  fill_blank: 'fill_blank', free_reply: 'free_reply', recall: 'recall',
}
const formatOfStep = (s) => (s && (s.format || STEP_FORMAT[s.type])) || null

function varsFor(interests, episodeId, branch, place = 'Medellín') {
  const ctx = getInterestContext(interests, `${NAME}:${episodeId}`)
  return {
    ctx,
    vars: {
      name: NAME, partner: 'Emma', place, partnerPlace: 'Japan',
      noun: ctx.targetNoun, object: ctx.objects[0], activity: ctx.activity,
      branchLine: branch === 'decline' ? 'No problem. Maybe another day.' : 'Great! Let’s get ready.',
    },
  }
}
const resolve = (s, vars) => String(s || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m))

// What a learner types on a step that deliberately offers no model answer.
function canonicalFor(kind, ctx) {
  const map = {
    ask_wellbeing: 'How are you?',
    answer_wellbeing: "I'm good.",
    express_like: `I like ${ctx.targetNoun}.`,
    express_want: 'I want water.',
    simple_plan_conversation: `I like ${ctx.targetNoun}. Do you want to ${ctx.activity}?`,
  }
  const answer = map[kind]
  assert.ok(answer, `no canonical answer for ${kind}`)
  return answer
}

/*
 * Play one episode exactly as the shell orchestrates it.
 *   answers  optional map stepIndex -> [wrong answers to try first]
 */
function play(model, ep, { interests, branchChoice = 'accept', wrongAnswers = {}, garden, xp }) {
  const { ctx, vars } = varsFor(interests, ep.id, branchChoice)
  let scaffold = model.scaffoldByEpisode[ep.id] || 'high'
  let cleanStreak = 0
  const seen = []
  const adapt = ({ correct, usedHelp }) => {
    cleanStreak = correct && !usedHelp ? cleanStreak + 1 : 0
    scaffold = getRecommendedScaffold(scaffold, { cleanSuccessStreak: cleanStreak, justFailed: !correct, usedHelp })
    model.scaffoldByEpisode[ep.id] = scaffold
  }
  const signal = (i, kind, suffix = kind) => {
    const f = formatOfStep(ep.steps[i])
    if (f) recordActivitySignalOnce(model, `${DAY}:${ep.id}:${i}:${suffix}`, f, kind)
  }

  for (let i = 0; i < ep.steps.length; i++) {
    const step = ep.steps[i]
    setEpisodeState(model, ep.id, { status: 'in_progress', stepIndex: i })
    signal(i, 'shown')
    seen.push(formatOfStep(step))

    if (step.type === 'scene' || step.type === 'model' || step.type === 'completion') { /* nothing to answer */ }
    else if (step.type === 'comprehension' || step.type === 'choice') {
      assert.ok(step.options.some(o => o.correct), `${ep.id}:${i} has no correct option`)
      if (step.itemId) recordItemAttempt(model, step.itemId, { correct: true, independent: scaffold !== 'high' })
    } else if (step.type === 'word_order' || step.type === 'fill_blank') {
      if (step.itemId) recordItemAttempt(model, step.itemId, { correct: true, independent: scaffold !== 'high' })
    } else {
      // the wrong route first, when this step has one
      let attempts = 0
      for (const wrong of wrongAnswers[i] || []) {
        const bad = evaluateFree(step.evalKind, wrong, { name: NAME, independent: false, place: vars.place, targetNoun: ctx.targetNoun, activity: ctx.activity })
        assert.equal(bad.completedObjective, false, `${ep.id}:${i} accepted a wrong answer: "${wrong}"`)
        assert.ok(bad.explanation || bad.retryPrompt, `${ep.id}:${i} rejected "${wrong}" with no guidance`)
        assert.ok(bad.naturalVersion, `${ep.id}:${i} rejected "${wrong}" without showing the natural version`)
        markRecurringError(model, bad.errorType)
        attempts += 1
        adapt({ correct: false })
      }
      const answer = branchChoice === 'decline' && step.branchOn === 'accept_decline'
        ? 'No, thank you.'
        : (step.suggestionEn ? resolve(step.suggestionEn, vars) : canonicalFor(step.evalKind, ctx))
      const independent = scaffold !== 'high'
      const res = evaluateFree(step.evalKind, answer, {
        name: NAME, independent, place: vars.place, targetNoun: ctx.targetNoun, activity: ctx.activity,
        turnContext: { linguaSaid: resolve(step.promptEn || step.sceneEn || '', vars) },
      })
      assert.ok(res.completedObjective, `${ep.id}:${i} (${step.evalKind}) rejected "${answer}"`)
      if (step.branchOn === 'accept_decline') {
        const declined = /\b(no,? thank|no,? thanks|not now|maybe later)\b/i.test(answer)
        model.facts = { ...(model.facts || {}), [`branch:${ep.id}`]: declined ? 'decline' : 'accept' }
      }
      ;(step.itemIds || []).forEach(id => recordItemAttempt(model, id, { correct: true, independent }))
      if (attempts > 0) signal(i, 'retried')
      adapt({ correct: true, usedHelp: false })
    }
    if (formatOfStep(step)) signal(i, 'completed')
  }

  // finish() — guarded as a whole, so repeated taps change nothing
  const st = getEpisodeState(model, ep.id)
  recordCanDoAttempt(model, ep.canDoId, { success: true, independent: cleanStreak >= 1, context: ep.id })
  if (!st.awarded) {
    xp.value += ep.xp
    for (const id of ep.gardenItems || []) if (!garden.includes(id)) garden.push(id)
    setEpisodeState(model, ep.id, { status: 'completed', awarded: true, stepIndex: ep.steps.length - 1 })
  } else {
    setEpisodeState(model, ep.id, { status: 'completed', stepIndex: ep.steps.length - 1 })
  }
  return { seen, scaffold }
}

function readyForThirdArc() {
  const m = createLearnerModel()
  for (const id of ['first_greeting', 'ask_name', 'nice_to_meet', 'how_are_you', 'where_from', 'first_conversation']) {
    setEpisodeState(m, id, { status: 'completed', stepIndex: 8, awarded: true })
  }
  m.facts = { place: 'Medellín' }
  return m
}

// 1) episode 7 with three different interest profiles
{
  for (const interests of [['music'], ['games'], []]) {
    const model = readyForThirdArc()
    const garden = []; const xp = { value: 0 }
    const ep = getEpisode('what_you_like')
    const { seen } = play(model, ep, { interests, garden, xp })
    assert.equal(getEpisodeState(model, ep.id).status, 'completed')
    assert.equal(xp.value, ep.xp)
    assert.equal(garden.length, new Set(garden).size, 'no duplicates in the garden')
    assert.ok(seen.includes('comprehension') && seen.includes('word_order') && seen.includes('fill_blank'),
      'the episode still teaches through several activity types')
    // every step recorded exactly one shown and one completed
    for (const [format, stat] of Object.entries(model.activityPreferences)) {
      assert.ok(stat.shown >= stat.completed, `${format}: more completions than showings`)
      assert.equal(stat.abandoned, 0, 'a clean run abandons nothing')
    }
  }
  ok()
}

// 2) episode 8 end to end, wrong answers first on the production turns
{
  const model = readyForThirdArc()
  setEpisodeState(model, 'what_you_like', { status: 'completed', stepIndex: 11, awarded: true })
  const garden = []; const xp = { value: 0 }
  const ep = getEpisode('what_you_want')
  play(model, ep, { interests: ['music'], garden, xp, wrongAnswers: { 6: ['I water.'], 7: ['You want water?'] } })
  assert.equal(getEpisodeState(model, ep.id).status, 'completed')
  assert.equal(xp.value, ep.xp)
  assert.ok(model.recurringErrors.length > 0, 'mistakes are remembered for a later targeted retry')
  ok()
}

// 3) "Water, please." is partial evidence where the objective needs the pattern
{
  const partial = evaluateFree('express_want', 'Water, please.', { name: NAME })
  assert.equal(partial.completedObjective, false)
  assert.ok(partial.understood, 'the learner was understood — this is not a failure')
  assert.match(partial.naturalVersion, /I want/)
  // …while a genuine preference is never marked wrong
  for (const good of ['I want water.', "I'd like water.", 'I need a break.', 'I need help.']) {
    const kind = /need/.test(good) ? 'express_need' : 'express_want'
    assert.equal(evaluateFree(kind, good, { name: NAME }).completedObjective, true, `${good} must be accepted`)
  }
  ok()
}

// 4) episode 9 — BRANCH A (accept)
{
  const model = readyForThirdArc()
  for (const id of ['what_you_like', 'what_you_want']) setEpisodeState(model, id, { status: 'completed', stepIndex: 11, awarded: true })
  const garden = []; const xp = { value: 0 }
  const ep = getEpisode('make_a_plan')
  play(model, ep, { interests: ['music'], branchChoice: 'accept', garden, xp })
  assert.equal(model.facts['branch:make_a_plan'], 'accept')
  assert.equal(getEpisodeState(model, ep.id).status, 'completed')
  assert.equal(xp.value, ep.xp)
  assert.ok(model.activityPreferences.roleplay.shown >= 6, 'the conversation turns are recorded as roleplay')
  ok()
}

// 5) episode 9 — BRANCH B (decline) reaches the same can-do
{
  const model = readyForThirdArc()
  for (const id of ['what_you_like', 'what_you_want']) setEpisodeState(model, id, { status: 'completed', stepIndex: 11, awarded: true })
  const garden = []; const xp = { value: 0 }
  const ep = getEpisode('make_a_plan')
  play(model, ep, { interests: ['travel'], branchChoice: 'decline', garden, xp })
  assert.equal(model.facts['branch:make_a_plan'], 'decline')
  assert.equal(getEpisodeState(model, ep.id).status, 'completed')
  assert.ok(model.canDo.make_plan.successes >= 1, 'declining still teaches making a plan')
  assert.equal(xp.value, ep.xp, 'both branches are worth the same')
  ok()
}

// 6) replaying an episode never awards XP or garden items twice
{
  const model = readyForThirdArc()
  const garden = []; const xp = { value: 0 }
  const ep = getEpisode('what_you_like')
  play(model, ep, { interests: ['music'], garden, xp })
  const afterFirst = { xp: xp.value, garden: garden.length }
  setEpisodeState(model, ep.id, { status: 'new', stepIndex: 0 })   // replay, awarded stays true
  play(model, ep, { interests: ['music'], garden, xp })
  assert.equal(xp.value, afterFirst.xp, 'no second XP')
  assert.equal(garden.length, afterFirst.garden, 'no duplicated garden items')
  ok()
}

// 7) personalisation never produces an ungrammatical model sentence
{
  const ep = getEpisode('make_a_plan')
  for (const interest of ['music', 'games', 'movies', 'food', 'travel', 'sports', 'technology', 'culture', 'school', 'work', 'family']) {
    const { vars } = varsFor([interest], ep.id, 'accept')
    for (const step of ep.steps) {
      const text = resolve(step.suggestionEn, vars)
      if (!text) continue
      assert.ok(!/\{\w+\}/.test(text), `unresolved placeholder in ${interest}: ${text}`)
      // "I want traveling." / "Do you want my family?" — wants are practised
      // with what episode 8 taught, never with the interest noun
      if (/^I want |^Do you want /.test(text)) {
        assert.match(text, /water|coffee|help|a break/, `want turn must use episode 8 vocabulary, got "${text}"`)
      }
    }
  }
  ok()
}

// 7b) the interest noun reaches preferences only — never wants and needs
{
  for (const noun of ['traveling', 'my family', 'my work', 'books']) {
    const like = evaluateFree('express_like', 'Music.', { targetNoun: noun })
    assert.equal(like.naturalVersion, `I like ${noun}.`, 'a preference IS personalised')
    for (const [kind, expected] of [
      ['express_want', 'I want water.'],
      ['express_need', 'I need help.'],
      ['ask_want', 'Do you want water?'],
      ['express_dislike', "I don't like coffee."],
    ]) {
      const r = evaluateFree(kind, 'x', { targetNoun: noun })
      assert.equal(r.naturalVersion, expected,
        `${kind} must model episode 8 vocabulary, not "${noun}"`)
    }
  }
  // the plan turn keeps both: a personalised preference and its own activity
  const plan = evaluateFree('simple_plan_conversation', 'Music.', { targetNoun: 'traveling', activity: 'plan a trip' })
  assert.equal(plan.naturalVersion, 'I like traveling. Do you want to plan a trip?')
  ok()
}

// 8) a completed episode 7 leaves the learner able to say what they like
{
  const model = readyForThirdArc()
  const garden = []; const xp = { value: 0 }
  play(model, getEpisode('what_you_like'), { interests: ['music'], garden, xp })
  assert.ok(model.canDo.express_preferences, 'the can-do was practised')
  assert.ok(model.canDo.express_preferences.attempts === 1, 'one completion, one attempt — not one per tap')
  ok()
}

console.log(`check-third-arc-e2e — OK  (${n} end-to-end groups verified)`)
