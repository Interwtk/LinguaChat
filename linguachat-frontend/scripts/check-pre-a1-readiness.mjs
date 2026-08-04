/*
 * check-pre-a1-readiness — the difference between finishing and being ready.
 *
 * "Curriculum complete" is a fact about the course: seventeen episodes exist and
 * the learner reached the end of them. "Ready for A1" is a claim about the
 * learner, and every path to it here runs through evidence they produced.
 *
 * The cases below are the ones that matter: a learner who was helped the whole
 * way, one who has the skills but never held a conversation, one carrying a pile
 * of overdue reviews, and one who earned it. Plus the two properties that keep
 * the verdict trustworthy — it is derived rather than stored, and a replay can
 * change it while never paying XP twice.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ARC, getEpisode } from '../src/learning/episodes/index.js'
import {
  PRE_A1_EXIT_CRITERIA, productiveItemsOf, integratedEpisodes,
} from '../src/learning/curriculum/preA1Map.js'
import {
  derivePreA1Readiness, readinessFocus, isCurriculumComplete, skillEvidence,
  overdueRequiredReviews, integratedConversationEvidence, lastActivityAt,
  READINESS_REASONS, MAX_OVERDUE_REQUIRED_REVIEWS, RECENT_EVIDENCE_DAYS,
} from '../src/learning/curriculum/readiness.js'
import {
  createLearnerModel, setEpisodeState, recordCanDoAttempt, recordItemAttempt,
  mergeLanguageItems, saveLearnerModel,
} from '../src/learning/engine/learnerModel.js'
import {
  beginEpisodeRun, completeEpisodeRun, resolveRunMode, runEarnsReward, RUN_REPLAY,
} from '../src/learning/engine/episodeRuns.js'

let n = 0
const ok = () => { n++ }

const DAY = 24 * 60 * 60 * 1000
/*
 * Every date here is relative to one instant captured once, because the learner
 * model stamps its own records with the real clock: a fixture pinned to an
 * absolute date would put the evidence months before the can-do attempts and
 * measure the gap instead of the rule. Nothing below depends on WHEN it runs.
 */
const AT = Date.now()
const iso = (offsetDays) => new Date(AT + offsetDays * DAY).toISOString()

/*
 * A learner built to order. Every knob is a thing readiness looks at, so each
 * case below can turn exactly one of them off.
 */
function learner({
  episodes = 'all', independent = 2, itemState = 'can_use',
  conversation = true, conversationAge = 1, assistance = 0, overdue = 0,
} = {}) {
  const model = createLearnerModel()
  const played = episodes === 'all' ? ARC : ARC.filter(e => e.id !== 'how_many')
  for (const ep of played) {
    setEpisodeState(model, ep.id, { status: 'completed', awarded: true })
    for (let i = 0; i < independent; i++) {
      recordCanDoAttempt(model, ep.canDoId, { success: true, independent: true, context: ep.id })
    }
    if (independent === 0) recordCanDoAttempt(model, ep.canDoId, { success: true, independent: false, context: ep.id })
    // stamped explicitly, so the fixture's clock is the fixture's own
    if (model.canDo[ep.canDoId]) model.canDo[ep.canDoId].lastPracticedAt = iso(-1)
  }
  let left = overdue
  /*
   * Deduplicated: several capabilities share an item ("Can I have" belongs to
   * both the request and the whole cafe order), and writing one twice would
   * silently undo the overdue date the first pass set.
   */
  const requiredItems = [...new Set(PRE_A1_EXIT_CRITERIA.requiredCanDos.flatMap(id => productiveItemsOf(id)))]
  {
    for (const item of requiredItems) {
      model.languageItems[item] = {
        status: itemState === 'can_use' ? 'can_do' : 'learning',
        learningState: itemState,
        correct: 3, incorrect: 0, independentCorrect: itemState === 'can_use' ? 3 : 0,
        guidedCorrect: 1, recognisedCorrect: 0, streak: 2,
        nextReviewAt: left-- > 0 ? iso(-2) : iso(5),
        lastSeenAt: iso(-1),
      }
    }
  }
  if (conversation) {
    const target = integratedEpisodes().at(-1)
    model.episodeRuns = {
      [target]: [{
        runId: `${target}:1`, episodeId: target, mode: 'first_run', source: 'practice',
        startedAt: iso(-conversationAge), completedAt: iso(-conversationAge),
        independentEvidence: true, assistanceUsed: assistance, retriedSteps: 0,
        formatsUsed: ['roleplay'], rewarded: true, branchId: null, scaffold: null,
      }],
    }
  }
  return model
}

const verdict = (opts) => derivePreA1Readiness(learner(opts), { atMs: AT })

/* ---- 1) the shape of the answer ---- */
{
  const r = verdict()
  for (const key of ['ready', 'curriculumComplete', 'requiredSkills', 'missingSkills',
    'fragileSkills', 'overdueReviews', 'integratedConversationEvidence', 'reasonCodes']) {
    assert.ok(key in r, `readiness must report ${key}`)
  }
  assert.deepEqual(r.requiredSkills, PRE_A1_EXIT_CRITERIA.requiredCanDos,
    'the map is the only source of what is required')
  // no score, anywhere
  assert.equal(typeof r.ready, 'boolean')
  assert.ok(!('score' in r) && !('percentage' in r), 'readiness is not a number')
  ok()
}

/* ---- 2) A. the curriculum is not finished ---- */
{
  const r = verdict({ episodes: 'missing_last' })
  assert.equal(r.curriculumComplete, false)
  assert.equal(r.ready, false)
  assert.ok(r.reasonCodes.includes(READINESS_REASONS.CURRICULUM_INCOMPLETE))
  assert.deepEqual(readinessFocus(r), { kind: 'finish_curriculum' })
  ok()
}

/* ---- 3) B. finished, and a required skill is still being learned ---- */
{
  const r = verdict({ itemState: 'practicing' })
  assert.equal(r.curriculumComplete, true, 'the course was finished')
  assert.equal(r.ready, false, 'and the language is not theirs yet')
  assert.ok(r.reasonCodes.includes(READINESS_REASONS.FRAGILE_REQUIRED_SKILL))
  assert.ok(r.fragileSkills.length > 0)
  assert.equal(readinessFocus(r).kind, 'strengthen_skill')
  ok()
}

/* ---- 4) C. finished with help at every turn ---- */
{
  const r = verdict({ independent: 0 })
  assert.equal(r.curriculumComplete, true)
  assert.equal(r.ready, false, 'assisted success is not independent evidence')
  assert.ok(r.reasonCodes.includes(READINESS_REASONS.INSUFFICIENT_INDEPENDENT_EVIDENCE)
    || r.reasonCodes.includes(READINESS_REASONS.FRAGILE_REQUIRED_SKILL))
  // one unaided success is still not two
  const almost = verdict({ independent: 1 })
  assert.equal(almost.ready, false, 'one unaided success is luck')
  assert.ok(almost.reasonCodes.includes(READINESS_REASONS.INSUFFICIENT_INDEPENDENT_EVIDENCE))
  assert.equal(PRE_A1_EXIT_CRITERIA.independentEvidencePerCanDo, 2)
  ok()
}

/* ---- 5) D. a real backlog of overdue reviews ---- */
{
  const many = verdict({ overdue: MAX_OVERDUE_REQUIRED_REVIEWS + 3 })
  assert.equal(many.ready, false)
  assert.ok(many.reasonCodes.includes(READINESS_REASONS.TOO_MANY_OVERDUE_REVIEWS))
  assert.equal(readinessFocus(many).kind, 'catch_up_reviews')

  /*
   * And one item falling due overnight must NOT flip a ready learner. Readiness
   * describes a state of learning, not the time of day.
   */
  const one = verdict({ overdue: 1 })
  assert.equal(one.ready, true, 'a single overdue phrase is not a reason to hold someone back')
  assert.equal(one.overdueReviews, 1, 'and it is still reported')
  ok()
}

/* ---- 6) E. everything strong, no conversation held ---- */
{
  const r = verdict({ conversation: false })
  assert.equal(r.ready, false, 'exercises are not a conversation')
  assert.ok(r.reasonCodes.includes(READINESS_REASONS.NEEDS_INTEGRATED_CONVERSATION))
  assert.equal(r.integratedConversationEvidence, null)
  assert.equal(readinessFocus(r).kind, 'have_a_conversation')

  // leaning on help all the way through it does not count either
  const helped = verdict({ assistance: 9 })
  assert.equal(helped.ready, false, 'a conversation carried by the model answer is not evidence')
  assert.ok(helped.reasonCodes.includes(READINESS_REASONS.NEEDS_INTEGRATED_CONVERSATION))

  // nor does one from long ago
  const stale = verdict({ conversationAge: RECENT_EVIDENCE_DAYS + 40 })
  assert.equal(stale.ready, false, 'evidence has to be recent enough to still describe them')
  ok()
}

/* ---- 7) F. earned ---- */
{
  const r = verdict()
  assert.equal(r.ready, true, `still not ready: ${r.reasonCodes.join(', ')}`)
  assert.deepEqual(r.reasonCodes, [])
  assert.deepEqual(r.missingSkills, [])
  assert.deepEqual(r.fragileSkills, [])
  assert.ok(r.integratedConversationEvidence.episodeId)
  assert.equal(readinessFocus(r), null, 'there is nothing to point at')
  ok()
}

/* ---- 8) it is derived, and identical from the same model ---- */
{
  const model = learner()
  const first = derivePreA1Readiness(model, { atMs: AT })
  const reloaded = JSON.parse(JSON.stringify(model))
  const second = derivePreA1Readiness(reloaded, { atMs: AT })
  assert.deepEqual(second, first, 'a reload must not change the verdict')

  // nothing about readiness is written into the learner model
  const before = JSON.stringify(model)
  derivePreA1Readiness(model, { atMs: AT })
  assert.equal(JSON.stringify(model), before, 'deriving readiness must not mutate the learner')
  const src = readFileSync(new URL('../src/learning/curriculum/readiness.js', import.meta.url), 'utf8')
  assert.ok(!/saveLearnerModel|localStorage/.test(src), 'readiness must never persist itself')
  ok()
}

/* ---- 9) a replay can earn it, and never pays twice ---- */
{
  /*
   * The learner who finished everything with help. A replay of the closing
   * episode gives the unaided evidence that was missing — and no XP.
   */
  const model = learner({ independent: 1, conversation: false })
  assert.equal(derivePreA1Readiness(model, { atMs: AT }).ready, false)

  const episodeId = integratedEpisodes().at(-1)
  assert.equal(resolveRunMode(model, episodeId), RUN_REPLAY)
  assert.equal(runEarnsReward(RUN_REPLAY), false, 'a replay must not award XP again')
  beginEpisodeRun(model, episodeId, { source: 'practice', atMs: AT })
  for (const canDoId of PRE_A1_EXIT_CRITERIA.requiredCanDos) {
    recordCanDoAttempt(model, canDoId, { success: true, independent: true, context: episodeId })
  }
  completeEpisodeRun(model, { independentEvidence: true, rewarded: false, atMs: AT })

  const after = derivePreA1Readiness(model, { atMs: AT })
  assert.equal(after.ready, true, `a replay should have been enough: ${after.reasonCodes.join(', ')}`)
  assert.ok(after.integratedConversationEvidence.episodeId === episodeId)
  const runs = model.episodeRuns[episodeId] || []
  assert.equal(runs.filter(r => r.rewarded).length, 0, 'and it paid nothing')
  ok()
}

/* ---- 10) evidence merges; a verdict never does ---- */
{
  /*
   * Two devices: one practised a required phrase, the other completed a review.
   * Readiness is recomputed from the merged evidence — there is no boolean to
   * merge, and an older copy can never overwrite a newer fact.
   */
  const mine = createLearnerModel()
  for (let i = 0; i < 3; i++) recordItemAttempt(mine, 'whats_this', { correct: true, independent: true, evidenceKind: 'open' })
  const theirs = createLearnerModel()
  recordItemAttempt(theirs, 'numbers_1_10', { correct: true, independent: true, evidenceKind: 'open' })

  const merged = mergeLanguageItems(mine.languageItems, theirs.languageItems)
  assert.equal(merged.whats_this.learningState, 'can_use')
  assert.ok(merged.numbers_1_10, 'the other device\'s evidence survives')

  const src = readFileSync(new URL('../src/learning/engine/learnerModel.js', import.meta.url), 'utf8')
  assert.ok(!/ready|readiness/i.test(src.split('export function mergeLanguageItems')[1]?.slice(0, 800) || ''),
    'the merge must know nothing about readiness')
  ok()
}

/* ---- 11) the pieces are honest on their own ---- */
{
  assert.equal(isCurriculumComplete(learner()), true)
  assert.equal(isCurriculumComplete(learner({ episodes: 'missing_last' })), false)

  const model = learner()
  const evidence = skillEvidence(model, 'identify_things')
  assert.equal(evidence.taught, true)
  assert.ok(evidence.items.includes('whats_this') && evidence.items.includes('its_a_pattern'),
    'a capability made of two functions needs evidence of both')
  assert.equal(evidence.enough, true)

  // asking a lot and never identifying is not the capability
  const halfway = learner()
  halfway.languageItems.its_a_pattern = { ...halfway.languageItems.its_a_pattern, learningState: 'seen', independentCorrect: 0 }
  assert.equal(skillEvidence(halfway, 'identify_things').enough, false,
    'asking the question twice cannot stand in for never having identified anything')

  assert.equal(overdueRequiredReviews(learner({ overdue: 2 }), AT).length, 2)
  assert.ok(integratedConversationEvidence(learner(), AT))
  assert.ok(lastActivityAt(learner()) > 0)
  ok()
}

/* ---- 12) finishing the last episode is not, by itself, an event ---- */
{
  const model = learner({ independent: 0, conversation: false })
  const before = derivePreA1Readiness(model, { atMs: AT })
  setEpisodeState(model, 'how_many', { status: 'completed', awarded: true, stepIndex: 99 })
  saveLearnerModel(model)
  const after = derivePreA1Readiness(model, { atMs: AT })
  assert.equal(after.ready, before.ready, 'completing an episode may not flip readiness on its own')
  assert.equal(after.ready, false)
  /*
   * And readiness pays nothing. Checked against the CODE with the prose
   * stripped out — the file talks about rewards precisely to say it does not
   * hand any out.
   */
  const src = readFileSync(new URL('../src/learning/curriculum/readiness.js', import.meta.url), 'utf8')
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
  for (const forbidden of [/\bawardEpisode\b/, /\bxp\b/i, /\bgardenItems\b/, /\brecordItemAttempt\b/, /\brecordCanDoAttempt\b/]) {
    assert.ok(!forbidden.test(code), `readiness must not touch ${forbidden}`)
  }
  ok()
}

console.log(`check-pre-a1-readiness — OK  (${n} readiness groups verified)`)
