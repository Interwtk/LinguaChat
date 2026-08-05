/*
 * check-pre-a1-journeys — two learners, from an empty model to graduation.
 *
 * Everything else in this suite tests a rule against a model built to exercise
 * it. This file does the opposite: it plays the curriculum and then asks what
 * the rules make of what actually happened. That is the only way to catch the
 * failure mode that matters most — a criterion which reads perfectly and which
 * the product's own events can never satisfy.
 *
 * It caught exactly that. Readiness asked for two independent successes per
 * capability and counted them once per finished episode; twelve of the thirteen
 * required capabilities are taught by a single episode, so no first pass could
 * ever qualify however well someone played. And the practice the planner
 * recommended for a missing unaided production was a format whose evidence is,
 * by definition, guided — so the recommended fix could not fix it.
 *
 * Both are fixed. Both are asserted here by playing, not by fixture.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ARC, getEpisode } from '../src/learning/episodes/index.js'
import { createLearnerModel, MODEL_VERSION } from '../src/learning/engine/learnerModel.js'
import {
  PRE_A1_EXIT_CRITERIA, productiveItemsOf, coreItemsOfIntent, integratedEpisodes,
  RECEPTIVE_ITEMS, INCIDENTAL_ITEMS,
} from '../src/learning/curriculum/preA1Map.js'
import {
  derivePreA1Readiness, skillEvidence, MAX_OVERDUE_REQUIRED_REVIEWS,
} from '../src/learning/curriculum/readiness.js'
import { hasGraduatedPreA1, preA1Milestone, preA1Status } from '../src/learning/curriculum/graduation.js'
import { LEARNING_STATE_RANK } from '../src/learning/engine/learnerModel.js'
import {
  playCurriculum, playEpisode, consolidate, STRONG, ASSISTED, DAY, MAX_CONSOLIDATION_STEPS,
} from './lib/journey.mjs'

let n = 0
const ok = () => { n++ }

/* One instant for everything, so nothing here depends on when it runs. */
const START = Date.now() - 60 * DAY
const expectedXp = ARC.reduce((sum, ep) => sum + ep.xp, 0)

/* ---- 1) the strong journey: seventeen episodes, played ---- */
const strong = createLearnerModel()
const strongTrace = []
const strongEnd = playCurriculum(strong, { profile: STRONG, startMs: START, trace: strongTrace }).endedAt
{
  assert.equal(strongTrace.length, 17, 'every episode must be playable')
  assert.deepEqual(strongTrace.map(t => t.episodeId), ARC.map(e => e.id), 'in order')
  for (const record of strongTrace) {
    assert.equal(record.mode, 'first_run', `${record.episodeId} should be a first run`)
    assert.equal(record.rewarded, true, `${record.episodeId} should award once`)
  }
  const xp = strongTrace.reduce((sum, t) => sum + t.xp, 0)
  assert.equal(xp, expectedXp, `XP should total the sum of the episode definitions (${expectedXp})`)
  assert.equal(strong.version, MODEL_VERSION)
  ok()
}

/* ---- 2) the evidence it produced, capability by capability ---- */
{
  const rows = []
  for (const canDoId of PRE_A1_EXIT_CRITERIA.requiredCanDos) {
    const e = skillEvidence(strong, canDoId)
    rows.push({ canDoId, ...e })
    assert.equal(e.taught, true, `${canDoId} is required and nothing teaches it`)
    assert.ok(e.completions >= 1, `${canDoId}: no episode finished unaided`)
    assert.ok(e.independent >= PRE_A1_EXIT_CRITERIA.independentEvidencePerCanDo,
      `${canDoId}: only ${e.independent} unaided productions — a strong learner must be able to prove this by playing`)
    assert.equal(e.practised, true, `${canDoId}: some of its language was never practised`)
    assert.equal(e.usable, true, `${canDoId}: none of its language reached can_use`)
  }
  console.log('\n  strong learner — required capabilities')
  console.log('  ' + '-'.repeat(74))
  console.log('  ' + ['capability', 'unaided', 'episodes', 'practised', 'usable'].join('\t'))
  for (const r of rows) {
    console.log(`  ${r.canDoId.padEnd(22)}\t${String(r.independent).padStart(4)}\t${String(r.completions).padStart(6)}\t${String(r.practised).padStart(7)}\t${String(r.usable).padStart(6)}`)
  }
  ok()
}

/* ---- 3) and it graduates, by playing ---- */
{
  const atFinish = derivePreA1Readiness(strong, { atMs: strongEnd })
  assert.equal(atFinish.curriculumComplete, true)
  assert.ok(atFinish.integratedConversationEvidence, 'and hold a conversation on the way')
  /*
   * On the day they finish the last episode the only thing still outstanding is
   * that morning's reviews — language taught in the final days, due, with no
   * session after it yet. Every capability is proven, so one ordinary session of
   * catching up is all readiness is waiting for, and that is what the planner
   * offers: `catch_up_reviews`, not more curriculum.
   */
  const catchUp = consolidate(strong, { profile: STRONG, startMs: strongEnd })
  assert.ok(catchUp.steps <= 1, `a strong learner should need at most one catch-up session, took ${catchUp.steps}`)
  assert.equal(catchUp.ready, true, 'and then be ready')
  for (const t of catchUp.trace) {
    assert.equal(t.focus, 'catch_up_reviews', `nothing but reviews should be outstanding, got ${t.focus}`)
    assert.ok(t.blocks.every(b => b.startsWith('review:')), `and only reviews should be offered: ${t.blocks.join(', ')}`)
  }
  const readiness = derivePreA1Readiness(strong, { atMs: catchUp.endedAt })
  assert.equal(readiness.ready, true, `a strong journey must reach readiness: ${readiness.reasonCodes.join(', ')}`)
  assert.equal(readiness.overdueReviews <= MAX_OVERDUE_REQUIRED_REVIEWS, true)

  /*
   * The milestone was written by the engine during the journey — at the end of
   * an episode run — with no screen involved.
   */
  const milestone = preA1Milestone(strong)
  assert.ok(milestone, 'the milestone must be recorded by the learning engine, not by a render')
  assert.equal(milestone.source, 'episode_run')
  assert.equal(preA1Status(strong, { atMs: strongEnd }).state, 'graduated')
  ok()
}

/* ---- 4) the journey exercised branches, repair and semantic facts ---- */
{
  const branched = strongTrace.filter(t => t.branchId)
  assert.ok(branched.length >= 2, `only ${branched.length} episodes recorded a branch`)
  assert.ok(branched.some(t => t.episodeId === 'we_can_continue'), 'the hosted story must record its ending')

  // the other branch, replayed: new evidence, no second payment
  const before = strong.episodeRuns.we_can_continue.length
  const replay = playEpisode(strong, 'we_can_continue', {
    profile: STRONG, atMs: strongEnd + DAY, wantsOtherBranch: true,
  })
  assert.equal(replay.rewarded, false, 'a branch replay must not pay again')
  assert.equal(replay.xp, 0)
  assert.notEqual(replay.branchId, branched.find(t => t.episodeId === 'we_can_continue').branchId,
    'and it must actually go the other way')
  assert.equal(strong.episodeRuns.we_can_continue.length, before + 1, 'the first run is still on file')
  assert.equal(strong.facts['branch:we_can_continue'], branched.find(t => t.episodeId === 'we_can_continue').branchId,
    'the historical branch is never rewritten')

  // repair was produced, in the arc that teaches it and in the one that reuses it
  assert.ok((strong.languageItems.can_you_repeat?.independentCorrect || 0) >= 2,
    'asking for a repetition must have been produced unaided more than once')
  /*
   * Reuse is at the level of the language, not the can-do: an episode credits
   * its own capability and no other, so the honest evidence that repair carries
   * across arcs is that a later arc's episode really did evaluate it.
   */
  const repairElsewhere = strongTrace.filter(t => (t.objectives || []).some(o => /repair|nonunderstanding|repeat|slow/.test(o)))
  assert.ok(repairElsewhere.some(t => !['lost_you', 'say_again', 'we_can_continue'].includes(t.episodeId)),
    'repair should be exercised outside the arc that teaches it')

  // the facts the journey volunteered are real, and usable
  const likes = (strong.learnerFacts || []).filter(f => f.type === 'like')
  const places = (strong.learnerFacts || []).filter(f => f.type === 'place')
  assert.ok(likes.length >= 1 && places.length >= 1, 'the journey should have told Lingua something')
  ok()
}

/* ---- 5) the Garden it grew, audited ---- */
{
  const granted = new Set(ARC.flatMap(ep => ep.gardenItems || []))
  const states = { seen: 0, understood: 0, practicing: 0, can_use: 0 }
  const unknown = []
  for (const id of granted) {
    const state = strong.languageItems[id]?.learningState
    if (!state) { unknown.push(id); continue }
    states[state] += 1
  }
  assert.deepEqual(unknown, [], 'every Garden item must have been met by a learner who played everything')
  assert.equal(Object.values(states).reduce((a, b) => a + b, 0), granted.size, 'and have exactly one state')
  assert.ok(states.can_use >= 10, `only ${states.can_use} items reached can_use`)
  assert.ok(states.seen + states.understood > 0, 'not everything needs to be usable — receptive language may stay met')

  // a receptive item is never claimed as production, however far the learner got
  for (const id of RECEPTIVE_ITEMS) {
    const state = strong.languageItems[id]?.learningState
    if (!state) continue
    assert.ok(LEARNING_STATE_RANK[state] <= LEARNING_STATE_RANK.understood,
      `${id} is receptive and reached ${state}`)
  }
  console.log(`\n  garden after the strong journey: ${granted.size} items — ` +
    Object.entries(states).map(([k, v]) => `${k} ${v}`).join(', '))
  ok()
}

/* ---- 6) the support it was offered, episode by episode ---- */
{
  const levels = new Set(strongTrace.map(t => t.initialScaffold))
  assert.ok(levels.size > 1, 'a learner who proves themselves must not meet the same support everywhere')
  assert.equal(strongTrace[0].initialScaffold, 'high', 'a first episode with no history starts supported')
  assert.ok(strongTrace[0].reasonCodes.includes('fresh_skill'), 'and says why')
  const later = strongTrace.slice(3)
  /*
   * Most of the way through, a learner who proves themselves is trusted — and
   * where they are not, it is because of something the model can point at. An
   * episode teaching a capability whose groundwork was laid yesterday may well
   * open supported; what must never happen is maximum support for no reason
   * other than the episode being new, which is what the old hardcoded level did.
   */
  const supported = later.filter(t => t.initialScaffold === 'high')
  assert.ok(supported.length <= later.length / 2,
    `a proven learner met maximum support in ${supported.length} of ${later.length} later episodes`)
  for (const t of supported) {
    assert.ok(t.reasonCodes.some(c => c === 'weak_prerequisites' || c === 'fragile_skill'),
      `${t.episodeId} opened at maximum support with nothing to justify it: ${t.reasonCodes.join(',')}`)
  }
  assert.ok(strongTrace.slice(-6).every(t => t.finalScaffold === 'low'),
    'and by the end of a strong journey each episode should finish unaided')
  for (const record of strongTrace) {
    assert.ok(record.reasonCodes.length > 0, `${record.episodeId} gave no reason for its support level`)
  }
  console.log('\n  support offered (initial → final)')
  for (const t of strongTrace) {
    console.log(`  ${t.episodeId.padEnd(20)} ${t.initialScaffold.padEnd(7)} → ${t.finalScaffold.padEnd(7)} ${t.reasonCodes.slice(0, 3).join(',')}`)
  }
  ok()
}

/* ---- 7) the assisted journey: finished, and not ready ---- */
const assisted = createLearnerModel()
const assistedTrace = []
const assistedEnd = playCurriculum(assisted, { profile: ASSISTED, startMs: START, trace: assistedTrace }).endedAt
{
  assert.equal(assistedTrace.length, 17)
  const assistanceUsed = assistedTrace.reduce((sum, t) => sum + t.assistance, 0)
  assert.ok(assistanceUsed >= 17, `the assisted learner only reached for help ${assistanceUsed} times`)
  assert.ok(assistedTrace.some(t => t.retries > 0), 'and needed a second attempt somewhere')

  const readiness = derivePreA1Readiness(assisted, { atMs: assistedEnd })
  assert.equal(readiness.curriculumComplete, true, 'they finished the course')
  assert.equal(readiness.ready, false, 'and leaning on the model answer is not evidence of producing it')
  assert.ok(readiness.fragileSkills.length > 0, 'the blockers must be nameable')
  assert.equal(hasGraduatedPreA1(assisted), false, 'and nothing may have graduated them')
  assert.equal(preA1Status(assisted, { atMs: assistedEnd }).state, 'consolidating')

  /*
   * It fails on EVIDENCE, not on a profile flag: the same code path, the same
   * episodes, the same answers — only the help differs.
   */
  const src = readFileSync(new URL('../src/learning/curriculum/readiness.js', import.meta.url), 'utf8')
  assert.ok(!/assisted|profile/i.test(src.replace(/\/\*[\s\S]*?\*\//g, '')),
    'readiness must know nothing about learner profiles')
  console.log(`\n  assisted learner blocked by: ${readiness.reasonCodes.join(', ')}`)
  console.log(`  fragile: ${readiness.fragileSkills.join(', ')}`)
  ok()
}

/* ---- 8) and it can recover, on the planner's own recommendations ---- */
{
  /*
   * The same learner, not a better one: consolidating as STRONG would only have
   * proved that a learner who never needed help can recover.
   */
  const result = consolidate(assisted, { profile: ASSISTED, startMs: assistedEnd + DAY })
  console.log('\n  consolidation trace')
  for (const step of result.trace) {
    console.log(`  ${String(step.step).padStart(2)}  ${(step.focus || '-').padEnd(20)} ${(step.focusSkill || '').padEnd(20)} ${(step.blocks || ['(nothing offered)']).join(' + ')}`)
  }
  assert.equal(result.blocked, undefined, 'the planner must always have something to offer')
  assert.equal(result.ready, true, `consolidation must be able to finish: ${result.steps} steps used`)
  assert.ok(result.steps < MAX_CONSOLIDATION_STEPS, `it took ${result.steps} of ${MAX_CONSOLIDATION_STEPS} steps`)

  /*
   * And it did NOT have to replay the whole curriculum. A handful of targeted
   * activities is the difference between consolidation and starting again.
   */
  const episodesReplayed = result.trace.flatMap(t => t.blocks || []).filter(b => b.startsWith('episode:')).length
  assert.ok(episodesReplayed <= 3, `${episodesReplayed} episodes replayed — that is closer to doing it all again`)

  // the focus moved as each blocker was cleared, rather than repeating forever
  const focuses = result.trace.map(t => `${t.focus}:${t.focusSkill || ''}`)
  assert.ok(new Set(focuses).size >= 3, `the planner offered ${new Set(focuses).size} distinct focuses — check for a loop`)

  assert.equal(hasGraduatedPreA1(assisted), true, 'and then it graduates')
  const milestone = preA1Milestone(assisted)
  /*
   * Either engine point may be the one that notices — the end of a session or the
   * end of a run — because both are places where evidence changes. What matters is
   * that it was the engine, and that it happened while consolidating rather than
   * having been quietly granted when the curriculum ended.
   */
  assert.ok(['daily_session', 'episode_run'].includes(milestone.source),
    `graduation must be recorded by the learning engine, not by a screen: ${milestone.source}`)
  assert.ok(new Date(milestone.graduatedAt).getTime() > assistedEnd,
    'and it must be earned during consolidation, not backdated to the end of the curriculum')
  ok()
}

/* ---- 9) no XP was farmed on the way back ---- */
{
  const rewarded = Object.values(assisted.episodeRuns).flat().filter(r => r.rewarded)
  assert.equal(rewarded.length, 17, `${rewarded.length} runs were rewarded — an episode may pay exactly once`)
  const perEpisode = {}
  for (const run of rewarded) perEpisode[run.episodeId] = (perEpisode[run.episodeId] || 0) + 1
  assert.ok(Object.values(perEpisode).every(count => count === 1), 'and never twice for the same episode')
  ok()
}

/* ---- 10) the harness itself records the way the product does ---- */
{
  /*
   * The journey mirrors `SessionRunner`'s recording rules rather than importing
   * them, so the two must be checked against each other or this file quietly
   * stops proving anything.
   */
  const runner = readFileSync(new URL('../src/components/session/SessionRunner.jsx', import.meta.url), 'utf8')
  assert.ok(/coreItemsOfIntent\(kind\)/.test(runner), 'the runner must resolve its items from the intent')
  assert.ok(/block\.payload\?\.canDoId/.test(runner), 'and credit the capability a block consolidates')
  assert.ok(/result\.targetEvidence === false/.test(runner), 'and honour the target-range distinction')
  const harness = readFileSync(new URL('./lib/journey.mjs', import.meta.url), 'utf8')
  assert.ok(/coreItemsOfIntent\(kind\)/.test(harness), 'and so must the harness')
  assert.ok(/isIndependentEvidence\(/.test(harness), 'independence is decided by the engine, never by the harness')
  assert.ok(!/canDo\[[^\]]+\]\s*=/.test(harness), 'the harness must never write a can-do directly')
  assert.ok(!/learningState\s*[:=]\s*'can_use'/.test(harness), 'nor hand out a learning state')
  ok()
}

console.log(`\ncheck-pre-a1-journeys — OK  (${n} journey groups verified)`)
