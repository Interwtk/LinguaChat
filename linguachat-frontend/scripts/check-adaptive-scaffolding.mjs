/*
 * check-adaptive-scaffolding — support must follow evidence, not position.
 *
 * The rule this replaces was one line: `scaffoldByEpisode[id] || 'high'`. Every
 * episode began at maximum help however capable the learner had proved to be,
 * and because "independent" was defined as `scaffold !== 'high'`, that same
 * learner could not generate independent evidence on the turns where they were
 * most able to. The two halves of the loop starved each other.
 *
 * The cohorts below are deterministic model factories, not screenshots. Each
 * asserts a decision AND the grounds for it, so a rule that happens to return
 * the right level for the wrong reason still fails.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getEpisode } from '../src/learning/episodes/index.js'
import {
  createLearnerModel, recordItemAttempt, recordCanDoAttempt, setEpisodeState, markRecurringError,
} from '../src/learning/engine/learnerModel.js'
import {
  deriveInitialScaffold, updateScaffoldAfterTurn, reviveScaffoldState, makeScaffoldState,
  evidenceKindForStep, isIndependentEvidence, skillStrength, noveltyOf,
  showsModelAnswer, showsHintByDefault, weakerOf, EVIDENCE, REASONS, LEVELS,
  INDEPENDENT_TO_RELAX, RETRY_PRESSURE_TO_SUPPORT,
} from '../src/learning/engine/scaffolding.js'
import { CAN_DO_INTENT } from '../src/learning/curriculum/preA1Map.js'

let n = 0
const ok = () => { n++ }

/* ------------------------------------------------------------- cohorts -----*/

/* Nobody has done anything yet. */
const brandNew = () => createLearnerModel()

/* Mastered a can-do the honest way: two unaided successes. */
function master(model, canDoId, { context = 'seed' } = {}) {
  recordCanDoAttempt(model, canDoId, { success: true, independent: true, context })
  recordCanDoAttempt(model, canDoId, { success: true, independent: true, context: context + '2' })
  return model
}

/* Produce an item unaided, twice, so it reaches can_use. */
function useItem(model, itemId) {
  recordItemAttempt(model, itemId, { correct: true, independent: true, evidenceKind: EVIDENCE.OPEN })
  recordItemAttempt(model, itemId, { correct: true, independent: true, evidenceKind: EVIDENCE.OPEN })
  return model
}

/* Everything episode 6 depends on, done well. */
function strongThroughArcOne() {
  const m = brandNew()
  for (const id of ['first_greeting', 'ask_name', 'nice_to_meet', 'how_are_you', 'where_from']) {
    setEpisodeState(m, id, { status: 'completed', awarded: true })
  }
  for (const c of ['introduce_self', 'ask_name', 'full_greeting', 'ask_wellbeing', 'ask_origin']) master(m, c)
  // the patterns those episodes teach are genuinely usable
  for (const it of ['im', 'whats_your_name', 'nice_to_meet', 'how_are_you', 'im_good', 'where_from', 'im_from',
    'im_feeling_pattern', 'im_from_pattern']) useItem(m, it)
  return m
}

/*
 * Same coverage on paper, but it has been a fight — and crucially the language
 * episode 6 asks for has NOT been consolidated. A cohort that could already use
 * everything unaided would not be fragile; it would be strong with a bad day.
 */
function fragileThroughArcOne() {
  const m = brandNew()
  for (const id of ['first_greeting', 'ask_name', 'nice_to_meet', 'how_are_you', 'where_from']) {
    setEpisodeState(m, id, { status: 'completed', awarded: true })
  }
  // finished with help, so nothing reached independent use
  for (const c of ['introduce_self', 'ask_name', 'full_greeting', 'ask_wellbeing', 'ask_origin']) {
    recordCanDoAttempt(m, c, { success: true, independent: false, context: c })
  }
  for (const it of ['im', 'whats_your_name', 'nice_to_meet', 'how_are_you', 'im_good', 'where_from', 'im_from']) {
    recordItemAttempt(m, it, { correct: true, independent: false, evidenceKind: EVIDENCE.GUIDED })
  }
  // the target skill itself is shaky
  m.canDo.full_conversation = { status: 'learning', attempts: 4, successes: 1, independentSuccesses: 0, contexts: [], lastPracticedAt: new Date().toISOString() }
  m.episodeRuns = {
    first_conversation: [
      { runId: 'r1', episodeId: 'first_conversation', mode: 'first_run', source: 'practice', branchId: null, startedAt: '', completedAt: '2026-08-01T00:00:00.000Z', independentEvidence: false, assistanceUsed: 4, retriedSteps: 3, formatsUsed: ['free_reply'], rewarded: true, scaffold: null },
    ],
  }
  markRecurringError(m, 'missing_copula')
  markRecurringError(m, 'missing_copula')
  markRecurringError(m, 'no_question')
  markRecurringError(m, 'no_question')
  return m
}

const EP2 = getEpisode('ask_name')
const EP6 = getEpisode('first_conversation')
const EP9 = getEpisode('make_a_plan')
const EP12 = getEpisode('your_first_order')

/* --------------------------------------------------------- initial level ---*/

// 1) COHORT A — a brand-new learner is fully supported, everywhere
{
  for (const ep of [EP2, EP6, EP9, EP12]) {
    const s = deriveInitialScaffold({ learnerModel: brandNew(), episode: ep })
    assert.equal(s.currentLevel, 'high', `${ep.id}: a new learner must be supported`)
    assert.ok(s.reasonCodes.includes(REASONS.FRESH_SKILL), `${ep.id}: the reason must be the skill, not the position`)
    assert.equal(s.initialLevel, s.currentLevel)
    assert.equal(s.independentStreak, 0)
  }
  ok()
}

// 2) COHORT B — strong prerequisites earn less help for a NEW related skill,
//    and never all the way to none
{
  const s = deriveInitialScaffold({ learnerModel: strongThroughArcOne(), episode: EP6 })
  assert.equal(s.currentLevel, 'medium', 'proven prerequisites should reduce help')
  assert.ok(s.reasonCodes.includes(REASONS.STRONG_PREREQUISITES))
  assert.ok(s.reasonCodes.includes(REASONS.FRESH_SKILL), 'the skill itself is still new')
  assert.notEqual(s.currentLevel, 'low', 'confidence transfers; the language does not')
  ok()
}

// 3) the same episode is a different experience for a different learner —
//    which is the entire point of the sprint
{
  const strong = deriveInitialScaffold({ learnerModel: strongThroughArcOne(), episode: EP6 })
  const fresh = deriveInitialScaffold({ learnerModel: brandNew(), episode: EP6 })
  assert.notEqual(strong.currentLevel, fresh.currentLevel,
    'episode 6 must not offer the same help to a beginner and to someone who has earned it')
  assert.equal(weakerOf(strong.currentLevel, fresh.currentLevel), fresh.currentLevel)
  ok()
}

// 4) COHORT C — the skill itself is already usable, so practice starts light
{
  const m = strongThroughArcOne()
  master(m, 'full_conversation', { context: 'first_conversation' })
  const s = deriveInitialScaffold({ learnerModel: m, episode: EP6, runMode: 'replay' })
  assert.ok(['low', 'medium'].includes(s.currentLevel))
  assert.ok(s.reasonCodes.includes(REASONS.TARGET_CAN_USE))
  ok()
}

// 5) COHORT D — a fragile learner keeps full support even with the same coverage
{
  const s = deriveInitialScaffold({ learnerModel: fragileThroughArcOne(), episode: EP6 })
  assert.equal(s.currentLevel, 'high', 'a struggling learner is not stripped of help')
  assert.ok(s.reasonCodes.includes(REASONS.FRAGILE_SKILL))
  ok()
}

// 6) COHORT E — mixed evidence lands in the middle, never at the extremes
{
  const m = brandNew()
  // one prerequisite solid, the rest untouched
  setEpisodeState(m, 'first_greeting', { status: 'completed', awarded: true })
  master(m, 'introduce_self')
  const s = deriveInitialScaffold({ learnerModel: m, episode: EP6 })
  assert.equal(s.currentLevel, 'high', 'an incomplete chain of prerequisites is not proof')
  const s2 = deriveInitialScaffold({ learnerModel: m, episode: EP2 })
  assert.ok(['high', 'medium'].includes(s2.currentLevel))
  ok()
}

// 7) nothing in the derivation reads an episode number or a completion count
{
  const src = readFileSync(new URL('../src/learning/engine/scaffolding.js', import.meta.url), 'utf8')
  for (const smell of [/episodeIndex/, /indexOf\(ep/, /completedEpisodes/, /ARC\[/, /episodeId\s*>=/, />= 10/]) {
    assert.equal(smell.test(src), false, `scaffolding must not read curricular position (${smell})`)
  }
  // and the shell may no longer keep its own idea of the level
  const shell = readFileSync(new URL('../src/components/episode/EpisodeShell.jsx', import.meta.url), 'utf8')
  assert.equal(/getRecommendedScaffold/.test(shell), false, 'the old per-episode rule must be gone')
  assert.match(shell, /deriveInitialScaffold\(/, 'the shell must ask the engine')
  assert.equal(/scaffold !== 'high'/.test(shell), false,
    'independence must not be inferred from the support level')
  ok()
}

// 8) a review that is overdue never starts light
{
  const m = strongThroughArcOne()
  master(m, 'full_conversation', { context: 'first_conversation' })
  // something episode 6 teaches fell due yesterday
  const yesterday = new Date(Date.now() - 86400000).toISOString()
  m.languageItems.im = { ...m.languageItems.im, nextReviewAt: yesterday }
  const s = deriveInitialScaffold({ learnerModel: m, episode: EP6, runMode: 'replay' })
  assert.notEqual(s.currentLevel, 'low', 'overdue language keeps its support')
  assert.ok(s.reasonCodes.includes(REASONS.REVIEW_DUE))
  ok()
}

// 9) a targeted retry in a session starts supported, whatever the skill
{
  const m = strongThroughArcOne()
  master(m, 'ask_name')
  const s = deriveInitialScaffold({ learnerModel: m, targetIntent: 'ask_name', blockType: 'targeted_retry', runMode: 'review' })
  assert.notEqual(s.currentLevel, 'low', 'a targeted retry exists because something went wrong')
  assert.ok(s.reasonCodes.includes(REASONS.SESSION_TARGETED_RETRY))
  ok()
}

// 10) novelty keeps support even for a strong learner
{
  const m = strongThroughArcOne()
  const novelty = noveltyOf(m, EP12)
  assert.ok(novelty.newPattern || novelty.newIntent, 'the café is new to an arc-one learner')
  const s = deriveInitialScaffold({ learnerModel: m, episode: EP12 })
  assert.notEqual(s.currentLevel, 'low')
  ok()
}

/* ------------------------------------------------------------ evidence -----*/

// 11) a format proves only what it can prove
{
  assert.equal(evidenceKindForStep({ type: 'comprehension' }), EVIDENCE.RECOGNITION)
  assert.equal(evidenceKindForStep({ type: 'choice' }), EVIDENCE.RECOGNITION)
  assert.equal(evidenceKindForStep({ type: 'word_order' }), EVIDENCE.GUIDED)
  assert.equal(evidenceKindForStep({ type: 'fill_blank' }), EVIDENCE.GUIDED)
  assert.equal(evidenceKindForStep({ type: 'free_reply' }), EVIDENCE.OPEN)
  assert.equal(evidenceKindForStep({ type: 'free_reply', format: 'roleplay' }), EVIDENCE.OPEN)
  assert.equal(evidenceKindForStep({ type: 'recall' }), EVIDENCE.OPEN)
  assert.equal(evidenceKindForStep({ type: 'free_reply', format: 'mini_story' }), EVIDENCE.OPEN)
  // an alternative offered after a struggle hands over the words
  assert.equal(evidenceKindForStep({ type: 'word_order', format: 'guided_reply', assisted: true }), EVIDENCE.GUIDED)
  ok()
}

// 12) choosing the right answer is never independent production
{
  for (const type of ['comprehension', 'choice', 'word_order', 'fill_blank']) {
    assert.equal(isIndependentEvidence({ step: { type }, assistanceUsed: false }), false,
      `${type} cannot prove independent production`)
  }
  assert.equal(isIndependentEvidence({ step: { type: 'free_reply' }, assistanceUsed: false }), true)
  ok()
}

// 13) help SHOWN is not help USED — the distinction the project already fought for
{
  // a suggestion on screen, untouched: still independent
  assert.equal(isIndependentEvidence({ step: { type: 'free_reply' }, assistanceUsed: false }), true)
  // the learner reached for it: not independent
  assert.equal(isIndependentEvidence({ step: { type: 'free_reply' }, assistanceUsed: true }), false)
  // a step that shows the model by default cannot prove anything unaided
  assert.equal(isIndependentEvidence({ step: { type: 'free_reply', showModelDefault: true }, assistanceUsed: false }), false)
  // and a wrong answer is never evidence
  assert.equal(isIndependentEvidence({ step: { type: 'free_reply' }, assistanceUsed: false, correct: false }), false)
  ok()
}

/* ---------------------------------------------------------- transitions ----*/

const openTurn = { correct: true, assistanceUsed: false, evidenceKind: EVIDENCE.OPEN }

// 14) help is withdrawn only after enough unaided open production
{
  let s = makeScaffoldState('high')
  for (let i = 1; i < INDEPENDENT_TO_RELAX; i++) {
    s = updateScaffoldAfterTurn(s, openTurn)
    assert.equal(s.currentLevel, 'high', 'one clean turn is not enough')
  }
  s = updateScaffoldAfterTurn(s, openTurn)
  assert.equal(s.currentLevel, 'medium')
  assert.ok(s.reasonCodes.includes(REASONS.RECENT_INDEPENDENT_SUCCESS))
  // the next level has to be earned again from scratch
  assert.equal(s.independentStreak, 0)
  s = updateScaffoldAfterTurn(s, openTurn)
  assert.equal(s.currentLevel, 'medium')
  s = updateScaffoldAfterTurn(s, openTurn)
  assert.equal(s.currentLevel, 'low')
  ok()
}

// 15) recognition and guided work do not buy independence
{
  let s = makeScaffoldState('high')
  for (let i = 0; i < 8; i++) s = updateScaffoldAfterTurn(s, { correct: true, evidenceKind: EVIDENCE.RECOGNITION })
  assert.equal(s.currentLevel, 'high', 'eight correct choices do not prove production')
  for (let i = 0; i < 8; i++) s = updateScaffoldAfterTurn(s, { correct: true, evidenceKind: EVIDENCE.GUIDED })
  assert.equal(s.currentLevel, 'high', 'eight guided builds do not prove production')
  ok()
}

// 16) support returns after trouble, and one level at a time
{
  let s = makeScaffoldState('low')
  s = updateScaffoldAfterTurn(s, { correct: false, evidenceKind: EVIDENCE.OPEN })
  assert.equal(s.currentLevel, 'low', 'one slip is not a crisis')
  s = updateScaffoldAfterTurn(s, { correct: false, evidenceKind: EVIDENCE.OPEN })
  assert.equal(s.currentLevel, 'medium', 'two failures bring help back')
  assert.ok(s.reasonCodes.includes(REASONS.RECENT_RETRIES))
  // never two levels in one turn
  const before = LEVELS.indexOf(s.currentLevel)
  s = updateScaffoldAfterTurn(s, { correct: false, evidenceKind: EVIDENCE.OPEN })
  s = updateScaffoldAfterTurn(s, { correct: false, evidenceKind: EVIDENCE.OPEN })
  assert.ok(Math.abs(LEVELS.indexOf(s.currentLevel) - before) <= 1)
  ok()
}

// 17) asking to practise another way adds help immediately
{
  let s = makeScaffoldState('low')
  s = updateScaffoldAfterTurn(s, { correct: true, assistanceUsed: true, evidenceKind: EVIDENCE.GUIDED, switchedActivity: true })
  assert.equal(s.currentLevel, 'medium', 'an explicit request for help is honoured at once')
  ok()
}

// 18) leaning on the model twice brings support back
{
  let s = makeScaffoldState('low')
  s = updateScaffoldAfterTurn(s, { correct: true, assistanceUsed: true, evidenceKind: EVIDENCE.OPEN })
  assert.equal(s.currentLevel, 'low')
  s = updateScaffoldAfterTurn(s, { correct: true, assistanceUsed: true, evidenceKind: EVIDENCE.OPEN })
  assert.equal(s.currentLevel, 'medium')
  assert.ok(s.reasonCodes.includes(REASONS.RECENT_ASSISTANCE))
  ok()
}

// 19) no oscillation: a good-bad-good-bad learner does not flap every turn
{
  let s = makeScaffoldState('medium')
  const seen = []
  for (let i = 0; i < 12; i++) {
    s = updateScaffoldAfterTurn(s, i % 2 === 0 ? openTurn : { correct: false, evidenceKind: EVIDENCE.OPEN })
    seen.push(s.currentLevel)
  }
  let flips = 0
  for (let i = 1; i < seen.length; i++) if (seen[i] !== seen[i - 1]) flips++
  assert.ok(flips <= 3, `alternating turns caused ${flips} level changes in 12 turns`)
  ok()
}

/* ------------------------------------------------------------ durability ---*/

// 20) a stored state is restored exactly, and rubbish is refused
{
  let s = makeScaffoldState('high', [REASONS.FRESH_SKILL])
  s = updateScaffoldAfterTurn(s, openTurn)
  const round = reviveScaffoldState(JSON.parse(JSON.stringify(s)))
  assert.deepEqual(round, s, 'a run must resume exactly where it was')

  assert.equal(reviveScaffoldState(null), null)
  assert.equal(reviveScaffoldState({}), null)
  assert.equal(reviveScaffoldState({ initialLevel: 'enormous', currentLevel: 'low' }), null)
  const cleaned = reviveScaffoldState({ initialLevel: 'high', currentLevel: 'medium', reasonCodes: ['ok_code', 42, 'X'.repeat(80)], independentStreak: -5, retryPressure: 1e9 })
  assert.deepEqual(cleaned.reasonCodes, ['ok_code'], 'only well-formed reason codes survive')
  assert.equal(cleaned.independentStreak, 0)
  assert.ok(cleaned.retryPressure <= 99)
  ok()
}

// 21) reason codes carry no learner text
{
  const s = deriveInitialScaffold({ learnerModel: fragileThroughArcOne(), episode: EP6 })
  for (const code of s.reasonCodes) {
    assert.match(code, /^[a-z_]{3,40}$/, `${code} is not a plain internal label`)
  }
  assert.ok(Object.values(REASONS).includes(s.reasonCodes[0]))
  ok()
}

// 22) what the UI shows follows from the level, in one place
{
  assert.equal(showsModelAnswer('high'), true)
  assert.equal(showsModelAnswer('medium'), true)
  assert.equal(showsModelAnswer('low'), false)
  assert.equal(showsHintByDefault('high'), true)
  assert.equal(showsHintByDefault('medium'), false)
  const shell = readFileSync(new URL('../src/components/episode/EpisodeShell.jsx', import.meta.url), 'utf8')
  assert.match(shell, /showsModelAnswer\(scaffold\)/)
  assert.match(shell, /showsHintByDefault\(scaffold\)/)
  ok()
}

// 23) sessions and stories derive their own, and never hardcode a level
{
  const runner = readFileSync(new URL('../src/components/session/SessionRunner.jsx', import.meta.url), 'utf8')
  const story = readFileSync(new URL('../src/components/session/MiniStory.jsx', import.meta.url), 'utf8')
  for (const [name, src] of [['SessionRunner', runner], ['MiniStory', story]]) {
    assert.equal(/scaffoldLevel: 'medium'/.test(src), false, `${name} must not hardcode a support level`)
    assert.match(src, /deriveInitialScaffold\(/, `${name} must derive its own support`)
  }
  // and a block's level travels with the evaluation
  assert.match(runner, /scaffoldLevel: scaffold/)
  ok()
}

// 24) the hybrid evaluator no longer infers independence from support either
{
  const hybrid = readFileSync(new URL('../src/learning/engine/hybridEvaluation.js', import.meta.url), 'utf8')
  assert.equal(/scaffoldLevel !== 'high'/.test(hybrid), false,
    'independence must not be derived from the support level anywhere')
  assert.match(hybrid, /isIndependentEvidence\(/, 'it must ask the same question the shell asks')
  // and the caller's own reading wins when it has one
  assert.match(hybrid, /typeof params\.independent === 'boolean'/)
  const shell = readFileSync(new URL('../src/components/episode/EpisodeShell.jsx', import.meta.url), 'utf8')
  assert.match(shell, /assistanceUsed: fromSuggestion, independent,/,
    'the shell must pass its own decision rather than let it be recomputed')
  ok()
}

// 25) skillStrength reads evidence and nothing else
{
  const m = brandNew()
  assert.equal(skillStrength(m, 'introduce_self'), 'none')
  recordCanDoAttempt(m, 'introduce_self', { success: true, independent: false, context: 'a' })
  assert.equal(skillStrength(m, 'introduce_self'), 'learning', 'a helped success is not strength')
  master(m, 'ask_name')
  assert.equal(skillStrength(m, 'ask_name'), 'solid')
  // every can-do the curriculum names can be read
  for (const canDo of Object.keys(CAN_DO_INTENT)) {
    assert.ok(['none', 'learning', 'solid'].includes(skillStrength(m, canDo)))
  }
  ok()
}

console.log(`check-adaptive-scaffolding — OK  (${n} support groups verified)`)
