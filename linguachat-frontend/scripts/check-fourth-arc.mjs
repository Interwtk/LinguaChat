/*
 * check-fourth-arc — the café: episodes 10, 11 and 12.
 *
 * Covers the arc's data, its five new intents, its two branching stories and
 * the way it plugs into the planner, the Memory Garden and replay. Three ideas
 * are worth stating outright, because the rest of the file is their consequence:
 *
 *  1. The arc teaches a REGISTER, not vocabulary. "I want water." is understood
 *     and correct English; in a café it is simply blunt, and the correction says
 *     so instead of marking the learner wrong.
 *
 *  2. Some of the language is passive on purpose. The barista says "What can I
 *     get for you?" and "Here you are."; the learner never has to produce them.
 *     A step that demanded them back would be a different, much harder episode.
 *
 *  3. Both endings of a decision are correct. Wanting more and wanting nothing
 *     more are equally good English, so neither branch may be worth less than
 *     the other.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ARC, ARCS, getEpisode, episodesInArc } from '../src/learning/episodes/index.js'
import { SEED_VOCAB_BY_ID } from '../src/data/vocabulary.js'
import { evaluateFree, isDeclineReply } from '../src/learning/engine/responseEvaluation.js'
import {
  practiceKindForItem, practiceKindForCanDo, practiceKindForError,
} from '../src/learning/engine/session.js'
import {
  createLearnerModel, recordItemAttempt, recordCanDoAttempt,
  getEpisodeState, setEpisodeState,
} from '../src/learning/engine/learnerModel.js'
import { isEpisodeUnlocked } from '../src/learning/engine/planner.js'
import { selectCompatibleContext } from '../src/learning/engine/semanticContext.js'
import { targetsOf, reviewsOf } from '../src/learning/curriculum/preA1Map.js'

let n = 0
const ok = () => { n++ }

const CAFE_IDS = ['a_coffee_please', 'anything_else', 'your_first_order']
const EP10 = getEpisode('a_coffee_please')
const EP11 = getEpisode('anything_else')
const EP12 = getEpisode('your_first_order')

// 1) structure: three episodes in one new arc, in order, behind episode 9
{
  assert.deepEqual(ARCS.slice(3, 4), ['cafe'])
  assert.deepEqual(episodesInArc('cafe').map(e => e.id), CAFE_IDS)
  assert.equal(ARC.length, 15)
  assert.deepEqual(EP10.prerequisites, ['make_a_plan'])
  assert.deepEqual(EP11.prerequisites, ['a_coffee_please'])
  assert.deepEqual(EP12.prerequisites, ['anything_else'])
  for (const ep of [EP10, EP11, EP12]) {
    assert.ok(ep.canDoId && ep.titleKey && ep.goalKey && ep.canDoNameKey && ep.durationKey, `${ep.id} missing keys`)
    assert.equal(ep.level, 'Pre-A1')
    assert.ok(ep.xp > 0 && ep.estimatedMinutes > 0)
    assert.ok(ep.steps.length >= 6, `${ep.id} is a real episode`)
    assert.equal(ep.steps[ep.steps.length - 1].type, 'completion', `${ep.id} ends in a completion`)
  }
  ok()
}

// 2) the prerequisite chain really gates: nothing in the café opens early
{
  const model = createLearnerModel()
  assert.equal(isEpisodeUnlocked(model, EP10), false, 'the café waits for episode 9')
  for (const id of ['first_greeting', 'ask_name', 'nice_to_meet', 'how_are_you', 'where_from',
    'first_conversation', 'what_you_like', 'what_you_want', 'make_a_plan']) {
    setEpisodeState(model, id, { status: 'completed', awarded: true })
  }
  assert.equal(isEpisodeUnlocked(model, EP10), true)
  assert.equal(isEpisodeUnlocked(model, EP11), false, 'episode 11 waits for episode 10')
  setEpisodeState(model, EP10.id, { status: 'completed', awarded: true })
  assert.equal(isEpisodeUnlocked(model, EP11), true)
  assert.equal(isEpisodeUnlocked(model, EP12), false)
  setEpisodeState(model, EP11.id, { status: 'completed', awarded: true })
  assert.equal(isEpisodeUnlocked(model, EP12), true)
  ok()
}

// 3) the garden only ever grows what was actually taught
{
  for (const ep of [EP10, EP11, EP12]) {
    for (const id of ep.gardenItems || []) {
      assert.ok(SEED_VOCAB_BY_ID[id], `${ep.id}: garden item ${id} must be real vocabulary`)
      assert.ok(SEED_VOCAB_BY_ID[id].meaning?.es, `${id} must carry a native meaning`)
    }
    // targets and reviews are derived from the steps now, not hand-listed
    for (const id of [...targetsOf(ep.id), ...reviewsOf(ep.id)]) {
      assert.ok(SEED_VOCAB_BY_ID[id], `${ep.id}: item ${id} must be real vocabulary`)
    }
    for (const step of ep.steps) {
      for (const id of [...(step.itemIds || []), step.itemId].filter(Boolean)) {
        assert.ok(SEED_VOCAB_BY_ID[id], `${ep.id}: step item ${id} must be real vocabulary`)
      }
    }
  }
  ok()
}

/* ---------------------------------------------------------------- intents --*/

// 4) the polite request: what it accepts, and what it gently sends back
{
  const accept = [
    'Can I have water, please?',
    'Can I have a coffee, please?',
    'Could I have tea, please?',
    'May I have juice, please?',
    'I would like a tea, please.',
    'Can I have water?',                 // no "please": warm-less, not wrong
  ]
  for (const text of accept) {
    assert.ok(evaluateFree('polite_request', text, {}).completedObjective, `must accept: ${text}`)
  }

  // "Water, please." — polite, understood, and not yet the taught structure
  const partial = evaluateFree('polite_request', 'Water, please.', {})
  assert.equal(partial.completedObjective, false)
  assert.equal(partial.understood, true, 'a polite answer is always understood')
  assert.equal(partial.errorType, 'missing_request_form')

  // "I want water." — the previous episode's structure; a register note, not a
  // failure, and it must NOT be routed to want-practice as if it were broken
  const blunt = evaluateFree('polite_request', 'I want water.', {})
  assert.equal(blunt.completedObjective, false)
  assert.equal(blunt.understood, true)
  assert.equal(blunt.errorType, 'previous_structure')

  // the frame with nothing in it
  assert.equal(evaluateFree('polite_request', 'Can I have, please?', {}).errorType, 'missing_request_object')
  // empty
  assert.equal(evaluateFree('polite_request', '', {}).understood, false)
  ok()
}

// 5) the model answer names what the prompt named — never a different thing
{
  for (const thing of ['water', 'tea', 'coffee', 'juice']) {
    const r = evaluateFree('polite_request', 'blah blah', { targetThing: thing })
    assert.equal(r.naturalVersion, `Can I have ${thing}, please?`)
  }
  // and the default is a real drink, not a placeholder
  assert.equal(evaluateFree('polite_request', 'blah', {}).naturalVersion, 'Can I have water, please?')
  ok()
}

// 6) "Anything else?" — both answers are complete, a bare one is not
{
  for (const text of ['Yes, please.', 'No, thank you.', 'That’s all, thanks.', 'Can I have tea, please?']) {
    assert.ok(evaluateFree('respond_anything_else', text, {}).completedObjective, `must accept: ${text}`)
  }
  for (const text of ['Yes', 'No', 'yeah', 'nope']) {
    const r = evaluateFree('respond_anything_else', text, {})
    assert.equal(r.completedObjective, false, `${text} is not yet the polite pair`)
    assert.equal(r.understood, true, `${text} was understood — it answers the question`)
    assert.equal(r.errorType, 'incomplete_politeness')
  }
  ok()
}

// 7) closing an order, and thanking whoever served you
{
  for (const text of ['That’s all, thanks.', 'That is all, thank you.', 'Nothing else, thanks.', 'No, thank you.']) {
    assert.ok(evaluateFree('finish_order', text, {}).completedObjective, `must close: ${text}`)
  }
  assert.equal(evaluateFree('finish_order', 'No', {}).errorType, 'incomplete_politeness')

  for (const text of ['Thank you.', 'Thanks!', 'Thank you very much.']) {
    assert.ok(evaluateFree('thank_service', text, {}).completedObjective, `must thank: ${text}`)
  }
  assert.equal(evaluateFree('thank_service', 'ok', {}).completedObjective, false)
  ok()
}

// 8) the whole order in one turn needs both halves
{
  assert.ok(evaluateFree('cafe_order_conversation', 'Can I have tea, please? That’s all, thanks.', {}).completedObjective)
  assert.ok(evaluateFree('cafe_order_conversation', 'Can I have water, please.', {}).completedObjective)
  const half = evaluateFree('cafe_order_conversation', 'Can I have tea?', {})
  assert.equal(half.completedObjective, false)
  assert.equal(half.errorType, 'incomplete_turn')
  const none = evaluateFree('cafe_order_conversation', 'Hello there!', {})
  assert.equal(none.errorType, 'no_order')
  ok()
}

// 9) a refusal is read the same way everywhere — including the one that never
//    says "no". Reading "That's all, thanks." as a yes would have sent the
//    story down the wrong branch while the evaluator called it a refusal.
{
  for (const text of ['No, thank you.', 'No, thanks', 'That’s all, thanks.', 'Nothing else, thanks.', 'No']) {
    assert.equal(isDeclineReply(text), true, `${text} is a refusal`)
  }
  for (const text of ['Yes, please.', 'Can I have tea, please?', 'Sure, thanks.']) {
    assert.equal(isDeclineReply(text), false, `${text} is not a refusal`)
  }
  const shell = readFileSync(new URL('../src/components/episode/EpisodeShell.jsx', import.meta.url), 'utf8')
  assert.ok(/isDeclineReply\(text\)/.test(shell), 'the shell must not keep its own private idea of "no"')
  ok()
}

/* ------------------------------------------------------- passive vs active -*/

// 10) the learner is never asked to produce the barista's lines
{
  const NEVER_PRODUCED = ['what can i get for you', 'here you are', 'anything else']
  for (const ep of [EP10, EP11, EP12]) {
    for (const step of ep.steps) {
      const asked = [step.suggestionEn, ...(step.options || []).map(o => o.textEn), (step.tokens || []).join(' ')]
        .filter(Boolean).join(' ').toLowerCase()
      for (const line of NEVER_PRODUCED) {
        assert.ok(!asked.includes(line), `${ep.id}: "${line}" is heard, never produced`)
      }
    }
  }
  // and they really are heard — comprehension is part of a café
  const heard = [EP10, EP11, EP12].flatMap(ep => ep.steps.map(s => s.promptEn || '')).join(' ').toLowerCase()
  for (const line of NEVER_PRODUCED) assert.ok(heard.includes(line), `"${line}" must actually be heard`)
  ok()
}

// 11) a choice where every answer is right must really mark every answer right
{
  for (const ep of [EP10, EP11, EP12]) {
    for (const step of ep.steps) {
      if (step.type !== 'choice') continue
      assert.ok(step.options.some(o => o.correct), `${ep.id}: a choice needs a correct option`)
      // where the café offers three real orders, none of them may be a trap
      const corrects = step.options.filter(o => o.correct).length
      assert.equal(corrects, step.options.length,
        `${ep.id}: every café option is a real thing to say, so none may be wrong`)
    }
  }
  ok()
}

// 12) both endings of a decision are worth the same
{
  for (const ep of [EP11, EP12]) {
    assert.deepEqual(ep.story.branches, ['accept', 'decline'], `${ep.id} has two endings`)
    const branching = ep.steps.filter(s => s.branchOn === 'accept_decline')
    assert.equal(branching.length, 1, `${ep.id} has exactly one decision`)
    assert.equal(ep.steps[ep.story.branchStep], branching[0], `${ep.id}: branchStep must point at the decision`)
    const follow = ep.steps[ep.story.branchStep + 1]
    assert.ok(/\{branchLine\}/.test(follow.promptEn || ''), `${ep.id}: the story must react to the decision`)

    /*
     * Both endings said "No problem. Maybe another day." for a while, because
     * every branching episode shared one hard-coded pair of lines. That is a
     * kind refusal of a plan and nonsense at a counter, so each story brings
     * its own — and both endings must lead into the SAME next turn.
     */
    const lines = ep.story.branchLines
    assert.ok(lines && lines.accept && lines.decline, `${ep.id}: a story must supply both replies`)
    assert.notEqual(lines.accept, lines.decline, `${ep.id}: the two endings must differ`)
    for (const line of [lines.accept, lines.decline]) {
      assert.ok(!/maybe another day|get ready/i.test(line), `${ep.id}: "${line}" belongs to the planning episode`)
      assert.ok(!/\{/.test(line), `${ep.id}: a story line is literal English`)
    }
    // the turn after the decision has to be answerable from either ending
    const answer = follow.suggestionEn
    assert.ok(answer && !/\{item\}/.test(answer),
      `${ep.id}: after "${lines.decline}" the learner cannot be asked to order again`)
    assert.ok(evaluateFree(follow.evalKind, answer, {}).completedObjective,
      `${ep.id}: the follow-up answer must be accepted`)
  }
  ok()
}

/* ------------------------------------------------------------ integration --*/

// 12b) a worked example must name the right KIND of word
{
  /*
   * The gap-fill in episode 10 once printed "Can I have Sebastian, please?",
   * because a step with no evalKind had nothing to resolve its slot from and
   * fell back to the learner's own name. A step that shows an example must say
   * which slot it is filling.
   */
  for (const ep of ARC) {
    for (const step of ep.steps) {
      if (!step.exampleVar) continue
      const intent = step.contextIntent || step.evalKind
      assert.ok(intent, `${ep.id}: an example step must declare contextIntent or evalKind`)
      const v = selectCompatibleContext({ intent, seed: ep.id })
      assert.ok(v, `${ep.id}: ${intent} must resolve to a real example`)
      assert.ok(!/sebastian|alex|\{/i.test(v.value), `${ep.id}: the example must not be a name`)
    }
  }
  // and the one that exists really does produce English worth copying
  const gap = EP10.steps.find(s => s.type === 'fill_blank')
  assert.ok(gap && gap.exampleVar === 'item' && gap.contextIntent === 'polite_request')
  const example = selectCompatibleContext({ intent: gap.contextIntent, seed: 'x' })
  assert.ok(evaluateFree('polite_request', `${gap.before} ${example.value}${gap.after}`, {}).completedObjective,
    'the worked example must itself be a correct request')
  ok()
}

// 13) the planner knows what to do with everything the arc introduces
{
  for (const ep of [EP10, EP11, EP12]) {
    for (const id of ep.gardenItems || []) {
      assert.ok(practiceKindForItem(id), `no practice kind mapped for ${id}`)
    }
    assert.ok(practiceKindForCanDo(ep.canDoId), `no practice kind for can-do ${ep.canDoId}`)
  }
  // asking for a coffee is practised as a request, not as a preference
  assert.equal(practiceKindForItem('coffee'), 'polite_request')
  assert.equal(practiceKindForItem('thank_you'), 'thank_service')
  assert.equal(practiceKindForItem('thats_all'), 'finish_order')
  // every error the new intents can produce leads somewhere useful
  for (const errorType of ['missing_request_form', 'missing_request_object', 'previous_structure',
    'no_thanks', 'incomplete_politeness', 'no_close', 'no_order']) {
    assert.ok(practiceKindForError(errorType), `no remediation for ${errorType}`)
  }
  // and a café mistake is never sent off to practise "I like…"
  assert.equal(practiceKindForError('missing_request_form'), 'polite_request')
  ok()
}

// 14) a session block for a café objective can actually be rendered
{
  const runner = readFileSync(new URL('../src/components/session/SessionRunner.jsx', import.meta.url), 'utf8')
  for (const objective of ['polite_request', 'thank_service', 'respond_anything_else', 'finish_order', 'cafe_order_conversation']) {
    assert.ok(new RegExp(`\\n  ${objective}:`).test(runner.split('const PROMPT')[0]),
      `${objective} needs a model answer, or a block would ask one thing and grade another`)
    assert.ok(new RegExp(`\\n  ${objective}:`).test(runner.split('const PROMPT')[1] || ''),
      `${objective} needs an opening line`)
  }
  ok()
}

// 15) the thing a café block asks for is always orderable
{
  for (const objective of ['polite_request', 'cafe_order_conversation']) {
    for (const fact of ['music', 'traveling', 'games', 'coffee', null]) {
      const v = selectCompatibleContext({
        intent: objective, facts: [fact].filter(Boolean), interests: ['music'], seed: `s:${fact}`,
      })
      assert.ok(v, `${objective} must always have something to ask for`)
      assert.ok(['drink', 'food', 'consumable'].includes(v.semanticType),
        `${objective} asked for a ${v.semanticType} (${v.value})`)
      const sentence = `Can I have ${v.value}, please?`
      assert.ok(evaluateFree('polite_request', sentence, {}).completedObjective, `"${sentence}" must be valid English`)
    }
  }
  ok()
}

/* -------------------------------------------------------------------- e2e --*/

const VARS = { name: 'Sebastian', partner: 'Sam', item: 'water', otherItem: 'tea', branchLine: 'Sure.' }
const resolve = (s) => String(s || '').replace(/\{(\w+)\}/g, (m, key) => (VARS[key] ?? m))
const CANONICAL = {
  express_want: 'I want water.',
  polite_request: 'Can I have water, please?',
  thank_service: 'Thank you.',
  respond_anything_else: 'No, thank you.',
  finish_order: 'That’s all, thanks.',
  cafe_order_conversation: 'Can I have water, please? That’s all, thanks.',
}

// Play one café episode the way the shell drives it, choosing a branch.
function play(model, ep, { branch, independent }) {
  let awarded = false
  for (const step of ep.steps) {
    if (step.type === 'free_reply' || step.type === 'recall') {
      let answer = step.suggestionEn ? resolve(step.suggestionEn) : CANONICAL[step.evalKind]
      // at the decision, actually take the branch under test
      if (step.branchOn === 'accept_decline') answer = branch === 'decline' ? 'No, thank you.' : 'Yes, please.'
      assert.ok(answer, `${ep.id}: no answer for ${step.evalKind}`)
      const res = evaluateFree(step.evalKind, answer, { independent, targetThing: VARS.item })
      assert.ok(res.completedObjective, `${ep.id} (${step.evalKind}) rejected "${answer}"`)
      if (step.branchOn === 'accept_decline') {
        assert.equal(isDeclineReply(answer) ? 'decline' : 'accept', branch, `${ep.id}: branch must follow the answer`)
      }
      ;(step.itemIds || []).forEach(id => recordItemAttempt(model, id, { correct: true, independent }))
    } else if (step.itemId) {
      recordItemAttempt(model, step.itemId, { correct: true, independent })
    }
  }
  const st = getEpisodeState(model, ep.id)
  recordCanDoAttempt(model, ep.canDoId, { success: true, independent, context: ep.id })
  if (!st.awarded) {
    awarded = true
    setEpisodeState(model, ep.id, { status: 'completed', awarded: true })
  } else {
    setEpisodeState(model, ep.id, { status: 'completed' })
  }
  return { awarded }
}

// 16) both branches of both stories play to the end, first try
{
  for (const branch of ['accept', 'decline']) {
    const model = createLearnerModel()
    for (const ep of [EP10, EP11, EP12]) {
      const { awarded } = play(model, ep, { branch, independent: false })
      assert.ok(awarded, `${ep.id} awards on first completion (${branch})`)
    }
  }
  ok()
}

// 17) practising the other ending pays nothing twice
{
  const model = createLearnerModel()
  play(model, EP11, { branch: 'accept', independent: false })
  const again = play(model, EP11, { branch: 'decline', independent: false })
  assert.equal(again.awarded, false, 'the other ending is practice, not a second reward')
  ok()
}

// 18) mastery still has to be earned unaided
{
  const model = createLearnerModel()
  play(model, EP12, { branch: 'accept', independent: false })
  assert.equal(model.canDo.cafe_order.status, 'learning', 'a helped run is not mastery')
  play(model, EP12, { branch: 'decline', independent: true })
  play(model, EP12, { branch: 'accept', independent: true })
  assert.equal(model.canDo.cafe_order.status, 'can_do', 'two unaided orders are mastery')
  ok()
}

console.log(`check-fourth-arc — OK  (${n} café groups verified)`)
