/*
 * check-autonomy-audit — measures the curriculum, and fails only on the
 * indefensible.
 *
 * The previous sprint found that autonomy did not grow across Pre-A1: the arc
 * finales offered the MOST help, and episode 2 asked for more unaided
 * production than episode 12. That is structural debt, not a bug, and a check
 * that failed on it would be enforcing a curricular opinion by arithmetic.
 *
 * So this one reports the numbers and asserts only what cannot be defended:
 * an episode that never asks the learner to say anything, a can-do that can
 * never be produced, a conversational finale with no conversation, a metric
 * that cannot be derived because the metadata disagrees with the content.
 *
 * The one behavioural claim it DOES make is the sprint's actual goal: the same
 * episode must offer a different amount of help to a beginner and to someone
 * who has earned their independence.
 */
import assert from 'node:assert/strict'
import { ARC, ARCS, episodesInArc } from '../src/learning/episodes/index.js'
import { evaluateFree } from '../src/learning/engine/responseEvaluation.js'
import {
  createLearnerModel, recordCanDoAttempt, recordItemAttempt, setEpisodeState,
} from '../src/learning/engine/learnerModel.js'
import {
  deriveInitialScaffold, evidenceKindForStep, EVIDENCE, weakerOf,
} from '../src/learning/engine/scaffolding.js'
import {
  CAN_DO_INTENT, intentsForEpisode, targetsOf, reviewsOf, personalisesOf,
} from '../src/learning/curriculum/preA1Map.js'
import { getStory, storyTurns } from '../src/learning/engine/miniStory.js'

/*
 * A hosted story is a conversation, not one step. Its `reply` turns are open
 * production with a model answer on offer; its `choose` turn is recognition; its
 * lines are the partner talking. Flattening it into pseudo-steps lets every
 * metric below stay one function instead of growing a special case.
 */
function flatten(steps) {
  const out = []
  for (const s of steps) {
    if (s.type !== 'mini_story') { out.push(s); continue }
    for (const t of storyTurns(getStory(s.storyObjective))) {
      if (t.kind === 'reply') {
        out.push({ type: 'free_reply', format: 'mini_story', evalKind: t.evalKind,
          suggestionEn: t.suggestionEn, itemIds: t.itemIds || [], storyTurn: true })
      } else if (t.kind === 'choose') {
        out.push({ type: 'choice', format: 'mini_story', options: t.options || [], storyTurn: true })
      } else {
        out.push({ type: 'scene', format: 'mini_story', storyTurn: true })
      }
    }
  }
  return out
}

let n = 0
const ok = () => { n++ }

/* ------------------------------------------------------------- the metrics -*/

function measure(ep) {
  const steps = flatten(ep.steps || [])
  const productive = steps.filter(s => s.type === 'free_reply' || s.type === 'recall')
  const openTurns = productive.filter(s => evidenceKindForStep(s) === EVIDENCE.OPEN)
  const guided = steps.filter(s => evidenceKindForStep(s) === EVIDENCE.GUIDED)
  const recognition = steps.filter(s => evidenceKindForStep(s) === EVIDENCE.RECOGNITION)
  const modelsShown = productive.filter(s => s.suggestionEn)
  const roleplay = steps.filter(s => s.format === 'roleplay')
  const stories = (ep.steps || []).filter(s => s.type === 'mini_story')
  // the longest unbroken run of free production
  let run = 0, longest = 0
  for (const s of steps) {
    if (s.type === 'free_reply') { run++; longest = Math.max(longest, run) } else if (s.type !== 'scene') run = 0
  }
  const newPatterns = targetsOf(ep.id).filter(id => /_pattern$/.test(id))
  const reusedPatterns = [...new Set(steps.flatMap(s => [...(s.itemIds || []), s.itemId]
    .filter(id => id && /_pattern$/.test(id))))].filter(id => !newPatterns.includes(id))

  return {
    id: ep.id,
    arc: ep.arc || 'greetings',
    steps: steps.length,
    productive: productive.length,
    openTurns: openTurns.length,
    guided: guided.length,
    recognition: recognition.length,
    modelsShown: modelsShown.length,
    unaidedOpportunities: productive.length - modelsShown.length,
    roleplay: roleplay.length,
    stories: stories.length,
    longestExchange: longest,
    intents: intentsForEpisode(ep.id).length,
    newItems: targetsOf(ep.id).length,
    newPatterns: newPatterns.length,
    reusedPatterns: reusedPatterns.length,
    reviews: reviewsOf(ep.id).length,
    personalises: personalisesOf(ep.id).length,
  }
}

const metrics = ARC.map(measure)
const byId = Object.fromEntries(metrics.map(m => [m.id, m]))

/* ------------------------------------------------------- what must be true -*/

// 1) every episode asks the learner to say something, unaided at least once
{
  for (const m of metrics) {
    assert.ok(m.productive >= 1, `${m.id} never asks the learner to produce anything`)
    assert.ok(m.openTurns >= 1, `${m.id} has no open production at all`)
    assert.ok(m.unaidedOpportunities >= 1,
      `${m.id} shows a model answer on every single productive turn`)
  }
  ok()
}

// 2) a can-do the episode claims must be producible in that episode
{
  for (const ep of ARC) {
    const intent = CAN_DO_INTENT[ep.canDoId]
    const producible = ep.steps.some(s =>
      s.evalKind === intent && evidenceKindForStep(s) === EVIDENCE.OPEN)
    assert.ok(producible,
      `${ep.id} claims "${ep.canDoId}" but never asks for it in an open turn`)
    // and the canonical answer for it is actually accepted
    const step = ep.steps.find(s => s.evalKind === intent && s.suggestionEn)
    if (step) {
      const answer = step.suggestionEn.replace(/\{\w+\}/g, 'water')
      /*
       * Graded with the step's OWN context, not a bare object. Repair is one
       * intent with three strategies, and "Can you repeat, please?" is only the
       * right answer to a step that asked for a repetition — checking it against
       * a default would either fail honest content or force the evaluator to
       * accept any repair anywhere.
       */
      const r = evaluateFree(intent, answer, { repairKind: step.repairKind })
      assert.ok(r.completedObjective, `${ep.id}: its own model answer for ${intent} is rejected`)
    }
  }
  ok()
}

// 3) an episode that combines earlier skills must actually converse
{
  for (const ep of ARC) {
    const aggregates = ep.steps.some(s => /_conversation$/.test(s.evalKind || ''))
    if (!aggregates) continue
    const m = byId[ep.id]
    assert.ok(m.longestExchange >= 3,
      `${ep.id} is a conversational finale with a longest exchange of ${m.longestExchange}`)
    assert.ok(m.recognition === 0 && m.guided === 0,
      `${ep.id} is a conversational finale and still contains closed exercises`)
  }
  ok()
}

// 4) every metric can be derived — metadata may not disagree with content
{
  for (const m of metrics) {
    for (const [key, value] of Object.entries(m)) {
      if (typeof value === 'number') assert.ok(Number.isFinite(value), `${m.id}.${key} is not derivable`)
    }
    assert.ok(ARCS.includes(m.arc), `${m.id} sits in an unknown arc`)
    assert.equal(m.openTurns + m.guided + m.recognition <= m.steps, true)
  }
  // every arc has a measurable shape
  for (const arc of ARCS) {
    const eps = episodesInArc(arc).map(e => byId[e.id])
    assert.ok(eps.length > 0)
    assert.ok(eps.some(e => e.openTurns > 0), `arc ${arc} has no open production`)
  }
  ok()
}

/* ------------------------------------------------ the behaviour that matters */

// 5) the same episode is a different experience for a beginner and for someone
//    who has earned their independence. This is the sprint's whole point.
{
  const beginner = createLearnerModel()

  const strong = createLearnerModel()
  for (const ep of ARC) {
    setEpisodeState(strong, ep.id, { status: 'completed', awarded: true })
    recordCanDoAttempt(strong, ep.canDoId, { success: true, independent: true, context: ep.id })
    recordCanDoAttempt(strong, ep.canDoId, { success: true, independent: true, context: ep.id + '2' })
    for (const s of ep.steps) {
      for (const id of [...(s.itemIds || []), s.itemId].filter(Boolean)) {
        recordItemAttempt(strong, id, { correct: true, independent: true, evidenceKind: EVIDENCE.OPEN })
        recordItemAttempt(strong, id, { correct: true, independent: true, evidenceKind: EVIDENCE.OPEN })
      }
    }
  }

  const compared = []
  for (const id of ['ask_name', 'first_conversation', 'make_a_plan', 'your_first_order']) {
    const ep = ARC.find(e => e.id === id)
    const a = deriveInitialScaffold({ learnerModel: beginner, episode: ep }).currentLevel
    const b = deriveInitialScaffold({ learnerModel: strong, episode: ep, runMode: 'replay' }).currentLevel
    compared.push({ id, beginner: a, strong: b })
    assert.equal(a, 'high', `${id}: a beginner must be supported`)
    assert.notEqual(b, 'high', `${id}: someone who has proved this must not start at maximum help`)
    assert.equal(weakerOf(a, b), a, `${id}: the beginner must never get less help than the expert`)
  }

  console.log('\n  the same episode, two learners')
  console.log('  ' + '-'.repeat(46))
  for (const c of compared) {
    console.log(`  ${c.id.padEnd(20)} beginner ${c.beginner.padEnd(7)} proven ${c.strong}`)
  }
  ok()
}

/* ------------------------------------------------------------- the report --*/

console.log('\n  autonomy metrics (reported, not enforced)')
console.log('  ' + '-'.repeat(86))
console.log('  ' + ['episode', 'arc', 'prod', 'open', 'guid', 'recog', 'models', 'unaided', 'rp', 'exch', 'new'].join('\t'))
for (const m of metrics) {
  console.log('  ' + [
    m.id.slice(0, 18), m.arc.slice(0, 5), m.productive, m.openTurns, m.guided,
    m.recognition, m.modelsShown, m.unaidedOpportunities, m.roleplay, m.longestExchange, m.newItems,
  ].join('\t'))
}

const finales = ['first_conversation', 'make_a_plan', 'your_first_order']
console.log('\n  arc finales vs an early episode')
for (const id of ['ask_name', ...finales]) {
  const m = byId[id]
  console.log(`  ${id.padEnd(20)} exchange ${String(m.longestExchange).padStart(2)}  intents ${String(m.intents).padStart(2)}  unaided ${m.unaidedOpportunities}/${m.productive}`)
}
const withStories = metrics.filter(m => m.stories > 0).map(m => m.id)
console.log(withStories.length
  ? `\n  note: mini_story is hosted inside ${withStories.join(', ')}; the daily session has its own`
  : '\n  note: mini_story is a real format that no episode uses — sessions only')

console.log(`\ncheck-autonomy-audit — OK  (${n} audit groups verified)`)
