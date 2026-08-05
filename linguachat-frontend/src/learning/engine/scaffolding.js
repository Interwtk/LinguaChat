/*
 * scaffolding — how much help a learner is offered, and why.
 *
 * The old rule was one line: `scaffoldByEpisode[id] || 'high'`. It had two
 * consequences nobody chose. Support was keyed per episode, so a learner who
 * had proved themselves eleven times started the twelfth episode at maximum
 * help; and because "independent" was defined as `scaffold !== 'high'`, that
 * same learner could not produce independent evidence on the turns where they
 * were most able to. Position in the curriculum outweighed everything the
 * learner had actually done.
 *
 * This module answers one question — how much help, and on what grounds — and
 * it is the only place that answers it.
 *
 *   deriveInitialScaffold()    once per run or session block, from evidence
 *   updateScaffoldAfterTurn()  after each answer, one level at a time
 *   evidenceKindForStep()      what a format can honestly prove
 *
 * Four commitments shape the rules:
 *
 *   EVIDENCE, NOT POSITION.  Nothing here reads an episode number. Curricular
 *   position enters only through the prerequisites the episode declares, which
 *   are a pedagogical statement rather than an ordinal.
 *
 *   NEW IS STILL NEW.  Strong prerequisites earn `medium`, never `low`, for a
 *   skill the learner has not met. Confidence transfers; the language does not.
 *
 *   CONSERVATIVE.  Help is withdrawn slowly and restored quickly. Being wrong
 *   is cheap; being stranded is not.
 *
 *   NO OSCILLATION.  A level changes at most one step at a time, and only after
 *   the counters that justify it clear a threshold — so a single good or bad
 *   turn cannot flip the experience back and forth.
 */
/*
 * Support is decided from what a step DOES — its type, its intent, the items it
 * asks for — so the skeleton is everything this engine needs, and the level's
 * prose can stay with the screens that show it.
 */
import { EPISODE_SKELETON as ARC, SKELETON_BY_ID } from '../curriculum/preA1Skeleton.generated.js'

const getEpisode = (id) => SKELETON_BY_ID[id] || null
import { CAN_DO_INTENT, intentsForEpisode, skillPrerequisitesOf, targetsOf } from '../curriculum/preA1Map.js'

/*
 * Which episode teaches each can-do, so its own targets can be consulted.
 *
 * A capability may be reinforced by a later episode — repair is taught in 13 and
 * extended in 14 — and the episode that OWNS it is the one to measure against.
 * Keying by simple assignment let the reinforcement episode win, so strength was
 * judged against language the learner had not reached yet and a consolidated
 * skill read as fragile.
 */
const ARC_BY_CANDO = {}
for (const ep of ARC) {
  if (!ARC_BY_CANDO[ep.canDoId] || !ep.reinforces) ARC_BY_CANDO[ep.canDoId] = ep
}

export const LEVELS = ['high', 'medium', 'low']
const idx = (level) => Math.max(0, LEVELS.indexOf(level || 'high'))
const clamp = (i) => LEVELS[Math.max(0, Math.min(LEVELS.length - 1, i))]
/* more help = lower index; less help = higher index */
const moreHelp = (level) => clamp(idx(level) - 1)
const lessHelp = (level) => clamp(idx(level) + 1)
export const weakerOf = (a, b) => (idx(a) <= idx(b) ? a : b)

/*
 * Reason codes. Small, non-sensitive, and never shown to the learner — they
 * exist so a decision can be tested and explained rather than trusted.
 */
export const REASONS = {
  FRESH_SKILL: 'fresh_skill',
  STRONG_PREREQUISITES: 'strong_prerequisites',
  WEAK_PREREQUISITES: 'weak_prerequisites',
  TARGET_CAN_USE: 'target_can_use',
  RECENT_INDEPENDENT_SUCCESS: 'recent_independent_success',
  RECENT_ASSISTANCE: 'recent_assistance',
  FADED_AFTER_HELPED_SUCCESS: 'faded_after_helped_success',
  RECENT_RETRIES: 'recent_retries',
  FRAGILE_SKILL: 'fragile_skill',
  REVIEW_DUE: 'review_due',
  REPLAY_PRACTICE: 'replay_practice',
  NEW_COMPLEXITY: 'new_complexity',
  SESSION_TARGETED_RETRY: 'session_targeted_retry',
  RESUMED_RUN: 'resumed_run',
}

/* ------------------------------------------------------------- evidence ----*/

/*
 * What a format can honestly prove.
 *
 *   recognition   the learner picked the right answer from a list
 *   guided        they produced it, with the words in front of them
 *   open          they produced it from nothing
 *
 * Only `open` can ever be independent evidence. A `choice` used to count as
 * independent whenever support happened to be below `high`, which quietly
 * turned recognising a sentence into proof of producing one.
 */
export const EVIDENCE = { RECOGNITION: 'recognition', GUIDED: 'guided', OPEN: 'open' }

const FORMAT_EVIDENCE = {
  comprehension: EVIDENCE.RECOGNITION,
  choice: EVIDENCE.RECOGNITION,
  word_order: EVIDENCE.GUIDED,
  fill_blank: EVIDENCE.GUIDED,
  guided_reply: EVIDENCE.GUIDED,
  free_reply: EVIDENCE.OPEN,
  roleplay: EVIDENCE.OPEN,
  recall: EVIDENCE.OPEN,
  mini_story: EVIDENCE.OPEN,
}

export function evidenceKindForStep(step) {
  if (!step) return null
  // an alternative offered after a struggle hands over the words, whatever it
  // is rendered as
  if (step.assisted) return EVIDENCE.GUIDED
  return FORMAT_EVIDENCE[step.format || step.type] || null
}

/*
 * Whether an answer counts as independent evidence.
 *
 * Three things must all hold: the format could prove production at all, the
 * learner did not reach for the help, and the answer was not handed to them by
 * a step that shows the model by default. Note what is NOT here — the current
 * support level. Someone typing an unaided sentence while a suggestion sits on
 * screen has produced it themselves, and the old rule threw that away.
 */
export function isIndependentEvidence({ step, assistanceUsed = false, correct = true }) {
  if (!correct) return false
  if (assistanceUsed) return false
  if (step?.showModelDefault) return false
  return evidenceKindForStep(step) === EVIDENCE.OPEN
}

/* ------------------------------------------------------- learner readings --*/

const canDoState = (model, canDoId) => (canDoId && model?.canDo?.[canDoId]) || null
const itemState = (model, itemId) => (itemId && model?.languageItems?.[itemId]) || null

/* The can-do that carries an intent, if the curriculum names one. */
const canDoForIntent = (intent) =>
  Object.keys(CAN_DO_INTENT).find(k => CAN_DO_INTENT[k] === intent) || null

/*
 * How solid the learner is on a skill, read only from recorded evidence.
 *   'none' | 'learning' | 'solid'
 *
 * The can-do counter alone cannot answer this. It is written once per completed
 * episode, for that episode's own can-do, so a skill practised in six episodes
 * still shows a single attempt and `can_do` status needs two. Sequential play
 * would therefore never transfer anything, which is the bug this sprint exists
 * to fix — swapping one blunt rule for another would not be progress.
 *
 * So strength leads with the evidence that is actually plentiful: the language
 * the skill's own episode asks the learner to PRODUCE, and how far each piece
 * of it has come. Reaching `can_use` already requires two unaided productions,
 * so this is a higher bar than "finished the episode", not a lower one.
 */
export const SOLID_ITEM_SHARE = 0.6

/* The items an episode asks the learner to produce in an open turn. */
function openTargetsOf(episode) {
  const out = new Set()
  for (const s of episode?.steps || []) {
    if (s.type === 'free_reply' || s.type === 'recall') (s.itemIds || []).forEach(i => out.add(i))
  }
  return [...out]
}

export function skillStrength(model, canDoId) {
  const c = canDoState(model, canDoId)
  const home = canDoId ? ARC_BY_CANDO[canDoId] : null
  const targets = openTargetsOf(home)

  // two unaided completions is proof on its own
  if (c && c.status === 'can_do' && c.independentSuccesses >= 2) return 'solid'

  // most of what the skill is made of, produced unaided twice each
  if (c?.successes >= 1 && targets.length) {
    const usable = targets.filter(id => itemState(model, id)?.learningState === 'can_use').length
    if (usable / targets.length >= SOLID_ITEM_SHARE) return 'solid'
  }

  /*
   * A skill is only "underway" if the learner has attempted IT. Items alone
   * cannot say so: episode 2 reuses episode 1's language, and treating that as
   * progress on asking a name would report a fresh skill as a fragile one.
   */
  if (!c || !c.attempts) return 'none'
  return 'learning'
}

/* Is anything this episode teaches overdue for review? */
function hasOverdueReview(model, episode, atMs) {
  const ids = new Set()
  for (const s of episode?.steps || []) {
    ;(s.itemIds || []).forEach(i => ids.add(i))
    if (s.itemId) ids.add(s.itemId)
  }
  for (const id of ids) {
    const it = itemState(model, id)
    if (it?.nextReviewAt && new Date(it.nextReviewAt).getTime() <= atMs && it.status !== 'new') return true
  }
  return false
}

/* Did the learner recently lean on help, or fight the same error? */
function recentStrain(model) {
  const runs = Object.values(model?.episodeRuns || {}).flat()
  const recent = runs.filter(r => r?.completedAt).slice(-3)
  const assistance = recent.reduce((a, r) => a + (r.assistanceUsed || 0), 0)
  const retries = recent.reduce((a, r) => a + (r.retriedSteps || 0), 0)
  const errors = (model?.recurringErrors || []).reduce((a, e) => a + (e.count || 0), 0)
  return { assistance, retries, errors, sampled: recent.length }
}

/* ----------------------------------------------------------- complexity ---*/

/*
 * Does this episode ask for something genuinely new?
 *
 * Derived from the episode's own content — a pattern the learner has never
 * produced, or an intent whose can-do they have never attempted. No table of
 * episode ids.
 */
export function noveltyOf(model, episode) {
  if (!episode) return { newPattern: false, newIntent: false, newLanguage: false }
  let newPattern = false
  for (const s of episode.steps || []) {
    const ids = [...(s.itemIds || []), s.itemId].filter(Boolean)
    for (const id of ids) {
      if (!/_pattern$/.test(id)) continue
      const it = itemState(model, id)
      if (!it || it.status === 'new') newPattern = true
    }
  }
  const newIntent = intentsForEpisode(episode.id).some(intent => {
    const canDo = canDoForIntent(intent)
    if (!canDo) return false
    return !canDoState(model, canDo)?.attempts
  })
  /*
   * Language this episode is the first to grant, that the learner has not met.
   * Patterns alone were not enough: episode 14 reinforces a skill the learner
   * may already be solid at while introducing two new sentences, and reading
   * only the skill would have handed them a blank page for language they had
   * never seen.
   */
  const newLanguage = targetsOf(episode.id).some(id => !itemState(model, id))
  return { newPattern, newIntent, newLanguage }
}

/* ------------------------------------------------------ initial derivation -*/

/*
 * Where to start, and why.
 *
 * The shape of the answer matters as much as the answer: a run keeps its level
 * AND the reasons for it, so a test can assert the grounds rather than the
 * number, and a resumed run can refuse to re-derive from a model that has
 * moved on since.
 */
export function deriveInitialScaffold({
  learnerModel,
  episode = null,
  episodeId = null,
  targetCanDo = null,
  targetIntent = null,
  runMode = 'first_run',
  blockType = null,
  atMs = Date.now(),
} = {}) {
  const model = learnerModel || {}
  const ep = episode || (episodeId ? getEpisode(episodeId) : null)
  const canDo = targetCanDo || ep?.canDoId || (targetIntent ? canDoForIntent(targetIntent) : null)
  const reasons = []

  const target = skillStrength(model, canDo)
  /*
   * Prerequisite strength, from the skills the episode genuinely leans on
   * rather than from whatever episode happens to precede it. Ordering a coffee
   * gates the repair arc curricularly and has nothing to do with being able to
   * repair a conversation; reading the gate as a skill would mean support
   * followed the running order again.
   */
  const prereqCanDos = ep ? skillPrerequisitesOf(ep.id) : []
  const prereqStates = prereqCanDos.map(c => skillStrength(model, c))
  const allPrereqsSolid = prereqStates.length > 0 && prereqStates.every(s => s === 'solid')
  const anyPrereqWeak = prereqStates.some(s => s !== 'solid')

  const strain = recentStrain(model)
  const overdue = ep ? hasOverdueReview(model, ep, atMs) : false
  const novelty = noveltyOf(model, ep)

  /* --- the base reading --------------------------------------------------- */
  let level
  if (target === 'solid') {
    level = 'low'
    reasons.push(REASONS.TARGET_CAN_USE, REASONS.RECENT_INDEPENDENT_SUCCESS)
  } else if (target === 'learning') {
    level = 'medium'
    reasons.push(REASONS.FRAGILE_SKILL)
  } else if (allPrereqsSolid) {
    /* confidence transfers, the language does not */
    level = 'medium'
    reasons.push(REASONS.FRESH_SKILL, REASONS.STRONG_PREREQUISITES)
  } else {
    level = 'high'
    reasons.push(REASONS.FRESH_SKILL)
    if (prereqStates.length) reasons.push(REASONS.WEAK_PREREQUISITES)
  }

  /* --- guardrails, each able only to ADD help ---------------------------- */

  /*
   * Something new to say keeps support, however strong the learner is — and new
   * LANGUAGE keeps it even when the skill itself is already solid, which is the
   * case for an episode that extends a capability the learner has earned.
   */
  if (novelty.newLanguage || (target !== 'solid' && (novelty.newPattern || novelty.newIntent))) {
    level = weakerOf(level, 'medium')
    reasons.push(REASONS.NEW_COMPLEXITY)
  }
  // a skill whose language is overdue is not a skill to strip help from
  if (overdue) {
    level = weakerOf(level, 'medium')
    reasons.push(REASONS.REVIEW_DUE)
  }
  // a learner who has been leaning on help, or repeating the same mistake
  if (strain.sampled > 0 && strain.assistance >= 4) {
    level = weakerOf(level, 'medium')
    reasons.push(REASONS.RECENT_ASSISTANCE)
  }
  if (strain.retries >= 3 || strain.errors >= 4) {
    level = weakerOf(level, 'medium')
    reasons.push(REASONS.RECENT_RETRIES)
  }
  // a fragile skill with anything working against it stays fully supported
  if (target === 'learning' && (overdue || strain.retries >= 2 || strain.errors >= 3)) {
    level = 'high'
    reasons.push(REASONS.FRAGILE_SKILL)
  }
  // a targeted retry exists because something went wrong; start supported
  if (blockType === 'targeted_retry') {
    level = weakerOf(level, 'medium')
    reasons.push(REASONS.SESSION_TARGETED_RETRY)
  }
  // practice of a skill already earned may start lighter, but never blindly
  if ((runMode === 'replay' || runMode === 'branch_replay') && target === 'solid' && !overdue) {
    reasons.push(REASONS.REPLAY_PRACTICE)
  }
  if (anyPrereqWeak && target === 'none') {
    level = weakerOf(level, 'medium')
  }

  return makeScaffoldState(level, [...new Set(reasons)])
}

export function makeScaffoldState(level, reasonCodes = []) {
  const initial = LEVELS.includes(level) ? level : 'high'
  return {
    initialLevel: initial,
    currentLevel: initial,
    reasonCodes: [...reasonCodes],
    independentStreak: 0,
    assistedStreak: 0,
    retryPressure: 0,
    helpedSuccesses: 0,
  }
}

/* Restore a persisted state without ever re-deriving it. */
export function reviveScaffoldState(stored) {
  if (!stored || typeof stored !== 'object') return null
  const initial = LEVELS.includes(stored.initialLevel) ? stored.initialLevel : null
  const current = LEVELS.includes(stored.currentLevel) ? stored.currentLevel : initial
  if (!initial || !current) return null
  const codes = Array.isArray(stored.reasonCodes)
    ? stored.reasonCodes.filter(c => typeof c === 'string' && c.length < 40).slice(0, 12)
    : []
  const num = (v) => (Number.isFinite(v) && v >= 0 ? Math.min(99, Math.floor(v)) : 0)
  return {
    initialLevel: initial,
    currentLevel: current,
    reasonCodes: codes,
    independentStreak: num(stored.independentStreak),
    assistedStreak: num(stored.assistedStreak),
    retryPressure: num(stored.retryPressure),
    helpedSuccesses: num(stored.helpedSuccesses),
  }
}

/* ------------------------------------------------------------ transitions --*/

/*
 * How many clean, unaided, open productions it takes to remove a level of
 * help, and how much trouble it takes to put one back. The asymmetry is the
 * point: earning independence should be slower than regaining support.
 */
export const INDEPENDENT_TO_RELAX = 2
export const RETRY_PRESSURE_TO_SUPPORT = 2

/*
 * How many helped successes in a row mean the help has finished its job.
 *
 * Without this the support system was a one-way ratchet. Only unaided open
 * production could relax it, and at high support the model answer is on screen
 * by design — so a learner who took the help that was offered produced guided
 * evidence for ever, was never once asked to try alone, and stayed at maximum
 * support forever however well they were doing. There was no route from being
 * helped to being trusted.
 *
 * Four correct turns in a row with help, and nothing going wrong, is not a
 * learner who needs the answer shown a fifth time. The support steps back one
 * level and gives them the chance to show what they can do; a single wrong
 * answer or retry hands it straight back.
 */
export const HELPED_SUCCESSES_TO_FADE = 4

/*
 * One turn's worth of change.
 *
 * Only open, unaided, correct production counts toward relaxing. Recognition
 * and guided production keep the streak where it is rather than advancing it —
 * they are real evidence of other things, just not of independence.
 */
export function updateScaffoldAfterTurn(state, {
  correct = true,
  assistanceUsed = false,
  evidenceKind = null,
  retried = false,
  switchedActivity = false,
} = {}) {
  const s = reviveScaffoldState(state) || makeScaffoldState('high')
  let { currentLevel, independentStreak, assistedStreak, retryPressure } = s
  let helpedSuccesses = Number(s.helpedSuccesses) || 0
  const reasons = new Set(s.reasonCodes)

  if (!correct) {
    independentStreak = 0
    retryPressure += 1
    helpedSuccesses = 0
  } else if (assistanceUsed || switchedActivity) {
    independentStreak = 0
    assistedStreak += 1
    if (!switchedActivity) helpedSuccesses += 1
  } else if (evidenceKind === EVIDENCE.OPEN) {
    independentStreak += 1
    assistedStreak = 0
  } else {
    /* recognition and guided work: neither progress nor penalty */
    assistedStreak = 0
  }
  if (retried) { retryPressure += 1; helpedSuccesses = 0 }
  /*
   * Asking to practise another way is the clearest signal there is, and it is
   * the learner's own. It counts for the whole threshold, so help arrives on
   * the turn they asked for it rather than the one after.
   */
  if (switchedActivity) retryPressure += RETRY_PRESSURE_TO_SUPPORT

  /* --- add help first: being stranded is worse than being over-helped --- */
  if (retryPressure >= RETRY_PRESSURE_TO_SUPPORT) {
    const next = moreHelp(currentLevel)
    if (next !== currentLevel) {
      currentLevel = next
      reasons.add(REASONS.RECENT_RETRIES)
    }
    retryPressure = 0            // spent, so support cannot creep up every turn
    independentStreak = 0
  } else if (helpedSuccesses >= HELPED_SUCCESSES_TO_FADE && retryPressure === 0) {
    /*
     * Help that keeps working is help the learner can be asked to do without.
     * This is deliberately ahead of the rule below: two helped turns in a row
     * say the support is being used, four clean ones in a row say it has done
     * its job — and while the second rule fires every other turn it would
     * short-circuit this one for ever, which is how a learner who was doing
     * well ended up pinned at maximum support with no way down.
     */
    const next = lessHelp(currentLevel)
    if (next !== currentLevel) {
      currentLevel = next
      reasons.add(REASONS.FADED_AFTER_HELPED_SUCCESS)
    }
    helpedSuccesses = 0
    assistedStreak = 0
  } else if (assistedStreak >= 2) {
    const next = moreHelp(currentLevel)
    if (next !== currentLevel) {
      currentLevel = next
      reasons.add(REASONS.RECENT_ASSISTANCE)
    }
    assistedStreak = 0
  } else if (independentStreak >= INDEPENDENT_TO_RELAX) {
    const next = lessHelp(currentLevel)
    if (next !== currentLevel) {
      currentLevel = next
      reasons.add(REASONS.RECENT_INDEPENDENT_SUCCESS)
    }
    independentStreak = 0        // earn the next level from scratch
    retryPressure = 0
  }

  if (helpedSuccesses >= HELPED_SUCCESSES_TO_FADE) helpedSuccesses = 0

  return {
    ...s,
    currentLevel,
    independentStreak,
    assistedStreak,
    retryPressure,
    helpedSuccesses,
    reasonCodes: [...reasons].slice(0, 12),
  }
}

/* What the UI should show at a given level. */
export const showsModelAnswer = (level) => level !== 'low'
export const showsHintByDefault = (level) => level === 'high'
