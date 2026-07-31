/*
 * check-preference-planning — the planner actually uses preferences, and the
 * pedagogical rule survives contact with them:
 *
 *     Preference changes variety. Pedagogical need changes priority.
 *
 * Covers the five scenarios in the brief (prefers roleplay / prefers guided
 * construction / an over-used format / a preference with no confidence /
 * difficulty without dislike) plus quick, standard and deep sessions and the
 * safety of every alternative offered.
 */
import assert from 'node:assert/strict'
import { ARC } from '../src/learning/episodes/index.js'
import {
  createLearnerModel, recordActivitySignalOnce, setEpisodeState, activityPreference,
  CONFIDENT_PREFERENCE, recordItemAttempt, recordCanDoAttempt,
} from '../src/learning/engine/learnerModel.js'
import {
  selectEquivalentActivityFormat, EQUIVALENCE_GROUPS, BLOCK_CANDIDATES,
  areEquivalent, equivalentFormats, formatSupportsObjective,
} from '../src/learning/engine/formatChoice.js'
import { buildSessionPlan, DURATION_MODES } from '../src/learning/engine/session.js'

let n = 0
const ok = () => { n++ }
const AT = new Date('2026-05-20T09:00:00Z').getTime()

// A learner who reliably gets on with one format.
function learnerWhoLikes(format, times = 8) {
  const m = createLearnerModel()
  for (let i = 0; i < times; i++) {
    recordActivitySignalOnce(m, `${format}:${i}:shown`, format, 'shown')
    recordActivitySignalOnce(m, `${format}:${i}:completed`, format, 'completed')
  }
  recordActivitySignalOnce(m, `${format}:fb`, format, 'positive')
  m.recentFormats = []          // liked, but not used in the last few minutes
  return m
}

// 1) equivalence groups are narrow and symmetric
{
  assert.ok(areEquivalent('word_order', 'fill_blank'))
  assert.ok(areEquivalent('fill_blank', 'word_order'))
  assert.ok(areEquivalent('comprehension', 'choice'))
  assert.ok(!areEquivalent('comprehension', 'roleplay'), 'ticking a box is not using language')
  assert.ok(!areEquivalent('word_order', 'recall'), 'building with the words given is not recall')
  assert.ok(equivalentFormats('roleplay').includes('mini_story'))
  for (const [group, formats] of Object.entries(EQUIVALENCE_GROUPS)) {
    assert.ok(formats.length >= 2, `${group} needs real alternatives`)
  }
  ok()
}

// 2) pedagogical need outranks a confident preference
{
  const m = learnerWhoLikes('guided_reply')
  const chosen = selectEquivalentActivityFormat({
    objective: 'ask_name', requiredPractice: 'word_order',
    candidates: ['guided_reply', 'word_order', 'fill_blank'],
    learnerModel: m, durationMode: 'deep', seed: 's',
  })
  assert.equal(chosen, 'word_order', 'a skill that has to be practised is not negotiable')
  ok()
}

// 3) SCENARIO A — prefers roleplay: a deep session may reuse language that way
{
  const m = learnerWhoLikes('roleplay')
  const chosen = selectEquivalentActivityFormat({
    objective: 'express_like', candidates: BLOCK_CANDIDATES.extra_practice,
    learnerModel: m, scaffold: 'low', durationMode: 'deep', seed: 's',
  })
  assert.equal(chosen, 'roleplay')
  // …but guided practice is still available to the planner elsewhere
  const guided = selectEquivalentActivityFormat({
    objective: 'express_like', candidates: BLOCK_CANDIDATES.targeted_retry,
    learnerModel: m, scaffold: 'high', durationMode: 'deep', seed: 's',
  })
  assert.ok(['guided_reply', 'fill_blank', 'word_order'].includes(guided), 'needed practice is not replaced by roleplay')
  ok()
}

// 4) SCENARIO B — prefers guided construction: a retry stays supported
{
  const m = learnerWhoLikes('fill_blank')
  const chosen = selectEquivalentActivityFormat({
    objective: 'express_want', candidates: BLOCK_CANDIDATES.targeted_retry,
    learnerModel: m, scaffold: 'high', durationMode: 'standard', seed: 's',
  })
  assert.equal(chosen, 'fill_blank')
  // high support must never hand out unaided production
  const recallish = selectEquivalentActivityFormat({
    objective: 'express_want', candidates: BLOCK_CANDIDATES.recall,
    learnerModel: m, scaffold: 'high', durationMode: 'standard', seed: 's',
  })
  assert.equal(recallish, 'guided_reply', 'while support is high, produce-from-memory is not offered')
  ok()
}

// 5) SCENARIO C — an over-used format steps aside even when it scores well
{
  const m = learnerWhoLikes('roleplay')
  m.recentFormats = ['roleplay', 'roleplay', 'roleplay']
  const chosen = selectEquivalentActivityFormat({
    objective: 'express_like', candidates: ['roleplay', 'mini_story', 'guided_reply'],
    learnerModel: m, scaffold: 'low', durationMode: 'deep', seed: 's',
  })
  assert.notEqual(chosen, 'roleplay', 'variety wins over repetition')
  ok()
}

// 6) SCENARIO D — a preference without confidence decides nothing strong
{
  const m = createLearnerModel()
  for (let i = 0; i < 3; i++) {
    recordActivitySignalOnce(m, `mini:${i}:shown`, 'mini_story', 'shown')
    recordActivitySignalOnce(m, `mini:${i}:completed`, 'mini_story', 'completed')
  }
  m.recentFormats = []
  assert.ok(activityPreference(m, 'mini_story').confidence < CONFIDENT_PREFERENCE)
  const chosen = selectEquivalentActivityFormat({
    objective: 'express_like', candidates: ['roleplay', 'mini_story'],
    learnerModel: m, scaffold: 'low', durationMode: 'deep', seed: 's',
  })
  assert.equal(chosen, 'roleplay', 'with weak evidence the neutral default stands')
  ok()
}

// 7) SCENARIO E — difficulty raises support, it never removes the format
{
  const m = createLearnerModel()
  for (let i = 0; i < 6; i++) {
    recordActivitySignalOnce(m, `wo:${i}:shown`, 'word_order', 'shown')
    recordActivitySignalOnce(m, `wo:${i}:completed`, 'word_order', 'completed')
    recordActivitySignalOnce(m, `wo:${i}:assistance`, 'word_order', 'assistance')
    recordActivitySignalOnce(m, `wo:${i}:retried`, 'word_order', 'retried')
  }
  const clean = createLearnerModel()
  for (let i = 0; i < 6; i++) {
    recordActivitySignalOnce(clean, `wo:${i}:shown`, 'word_order', 'shown')
    recordActivitySignalOnce(clean, `wo:${i}:completed`, 'word_order', 'completed')
  }
  assert.equal(activityPreference(m, 'word_order').score, activityPreference(clean, 'word_order').score)
  m.recentFormats = []
  const chosen = selectEquivalentActivityFormat({
    objective: 'express_want', candidates: ['word_order', 'fill_blank'],
    learnerModel: m, scaffold: 'high', durationMode: 'deep', seed: 's',
  })
  assert.ok(['word_order', 'fill_blank'].includes(chosen), 'a hard format is still offered')
  ok()
}

// 7b) support is offered when it is needed and withdrawn when it is not
{
  const m = createLearnerModel()
  const withHelp = selectEquivalentActivityFormat({
    objective: 'express_like', candidates: BLOCK_CANDIDATES.recall,
    learnerModel: m, scaffold: 'high', durationMode: 'deep', seed: 'r',
  })
  assert.equal(withHelp, 'guided_reply', 'a learner who still needs support gets it')
  for (const scaffold of ['medium', 'low']) {
    const unaided = selectEquivalentActivityFormat({
      objective: 'express_like', candidates: BLOCK_CANDIDATES.recall,
      learnerModel: m, scaffold, durationMode: 'deep', seed: 'r',
    })
    assert.notEqual(unaided, 'guided_reply',
      'a recall block must stay recall once support is no longer needed')
  }
  ok()
}

// 8) an alternative always serves the same objective
{
  for (const [block, candidates] of Object.entries(BLOCK_CANDIDATES)) {
    for (const objective of ['express_like', 'express_want', 'ask_origin', 'simple_plan_conversation']) {
      const chosen = selectEquivalentActivityFormat({
        objective, candidates, learnerModel: createLearnerModel(), durationMode: 'deep', seed: block,
      })
      assert.ok(chosen, `${block}/${objective} must always yield something`)
      assert.ok(formatSupportsObjective(chosen, objective) || candidates.every(c => !formatSupportsObjective(c, objective)),
        `${chosen} cannot carry ${objective}`)
    }
  }
  // a conversational objective is never reduced to ticking a box
  assert.ok(!formatSupportsObjective('choice', 'simple_plan_conversation'))
  assert.ok(!formatSupportsObjective('comprehension', 'ask_preference'))
  ok()
}

// 9) the choice is deterministic — same input, same output, no Math.random()
{
  const m = learnerWhoLikes('roleplay')
  const args = { objective: 'express_like', candidates: ['mini_story', 'guided_reply'], learnerModel: m, durationMode: 'deep', seed: 'stable' }
  const runs = new Set(Array.from({ length: 20 }, () => selectEquivalentActivityFormat({ ...args })))
  assert.equal(runs.size, 1, 'a plan must be reproducible')
  ok()
}

// 10) empty / unknown candidates never crash and never invent a format
{
  assert.equal(selectEquivalentActivityFormat({ candidates: [] }), null)
  assert.equal(selectEquivalentActivityFormat({ candidates: ['nonsense'] }), null)
  assert.equal(selectEquivalentActivityFormat({}), null)
  ok()
}

/* ---------- the planner itself ---------- */

function learnerMidArc(base) {
  const m = base || createLearnerModel()
  for (const id of ['first_greeting', 'ask_name', 'nice_to_meet']) {
    setEpisodeState(m, id, { status: 'completed', stepIndex: 8, awarded: true })
  }
  recordCanDoAttempt(m, 'ask_wellbeing', { success: false, independent: false })
  m.recurringErrors = [{ errorType: 'missing_verb', count: 3 }]
  recordItemAttempt(m, 'how_are_you', { correct: true, independent: false })
  m.languageItems.how_are_you.nextReviewAt = new Date(AT - 86400000).toISOString()
  return m
}

// 11) every planned practice block carries a format
{
  for (const mode of Object.keys(DURATION_MODES)) {
    const plan = buildSessionPlan(learnerMidArc(), ARC, { durationMode: mode, atMs: AT, interests: ['music'], learnerKey: 'sofia' })
    for (const b of plan.blocks) {
      if (['review', 'targeted_retry', 'recall', 'extra_practice'].includes(b.type)) {
        assert.ok(b.format, `${mode}/${b.type} must name a format`)
      }
    }
  }
  ok()
}

// 12) two different learners get controlled, visible differences
{
  const roleplayer = learnerMidArc(learnerWhoLikes('roleplay'))
  const builder = learnerMidArc(learnerWhoLikes('fill_blank'))
  const a = buildSessionPlan(roleplayer, ARC, { durationMode: 'deep', atMs: AT, interests: ['music'], learnerKey: 'a' })
  const b = buildSessionPlan(builder, ARC, { durationMode: 'deep', atMs: AT, interests: ['music'], learnerKey: 'b' })
  const formats = (p) => p.blocks.map(x => x.format).filter(Boolean).join(',')
  assert.notEqual(formats(a), formats(b), 'preferences must change something the learner can see')
  // …but both still get the same main goal
  const main = (p) => p.blocks.find(x => x.type === 'start_episode' || x.type === 'continue_episode')?.payload?.episodeId
  assert.equal(main(a), main(b), 'preference must not change WHAT is learned')
  ok()
}

// 13) quick stays calm, deep may add one preference-shaped block
{
  const m = learnerMidArc(learnerWhoLikes('roleplay'))
  const quick = buildSessionPlan(m, ARC, { durationMode: 'quick', atMs: AT, interests: [], learnerKey: 'q' })
  const deep = buildSessionPlan(m, ARC, { durationMode: 'deep', atMs: AT, interests: [], learnerKey: 'q' })
  assert.ok(quick.blocks.length <= DURATION_MODES.quick.maxBlocks)
  assert.equal(quick.blocks.filter(b => b.type === 'extra_practice').length, 0, 'a quick session is not the place to experiment')
  assert.ok(deep.blocks.length >= quick.blocks.length)
  assert.equal(deep.blocks.filter(b => b.type === 'start_episode' || b.type === 'continue_episode').length, 1,
    'still exactly one main goal, however deep the session')
  ok()
}

// 14) a repeated word-order mistake is practised as word order, whatever the taste
{
  const m = learnerMidArc(learnerWhoLikes('roleplay'))
  m.recurringErrors = [{ errorType: 'question_order', count: 4 }]
  const plan = buildSessionPlan(m, ARC, { durationMode: 'deep', atMs: AT, interests: [], learnerKey: 'w' })
  const retry = plan.blocks.find(b => b.type === 'targeted_retry')
  assert.ok(retry, 'a repeated error still gets its own block')
  assert.equal(retry.format, 'word_order', 'the skill that failed is the skill that is practised')
  ok()
}

// 15) the same learner and day always produce the same plan
{
  const m = learnerMidArc(learnerWhoLikes('roleplay'))
  const one = buildSessionPlan(m, ARC, { durationMode: 'deep', atMs: AT, interests: ['music', 'games'], learnerKey: 'z' })
  const two = buildSessionPlan(m, ARC, { durationMode: 'deep', atMs: AT, interests: ['music', 'games'], learnerKey: 'z' })
  assert.deepEqual(one.blocks.map(b => `${b.id}:${b.format}`), two.blocks.map(b => `${b.id}:${b.format}`))
  assert.deepEqual(one.topic, two.topic)
  ok()
}

// 16) preference never removes the completion block or the single main goal
{
  for (const mode of Object.keys(DURATION_MODES)) {
    const plan = buildSessionPlan(learnerMidArc(learnerWhoLikes('roleplay')), ARC, { durationMode: mode, atMs: AT, interests: [], learnerKey: 'k' })
    assert.equal(plan.blocks.at(-1).type, 'session_completion')
    assert.ok(plan.blocks.filter(b => b.type === 'start_episode' || b.type === 'continue_episode').length <= 1)
    assert.ok(plan.blocks.filter(b => b.type === 'extra_practice').length <= 1, 'a session never becomes all-preference')
  }
  ok()
}

console.log(`check-preference-planning — OK  (${n} planning groups verified)`)
