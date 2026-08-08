/*
 * learnerFacts — the small, useful things Lingua remembers.
 *
 * When someone types "I like music" inside episode 7, that is worth keeping:
 * it lets a later activity talk about music instead of a generic example. But
 * memory that shows off is worse than no memory at all, so everything here is
 * built to be sparing:
 *
 *   - only short, concrete values, never whole answers and never mistakes;
 *   - a fact is used occasionally, not every session (cooldown + use count);
 *   - never two blocks in a row, and never when today is already about it;
 *   - a low-confidence fact is not used at all;
 *   - the learner can always say "use something else" for that activity;
 *   - with nothing suitable, the neutral context is a perfectly good answer.
 *
 * What the learner chose at onboarding and what they said in an activity are
 * kept apart. Both can be true at once: someone can pick "music" in their
 * profile and still tell Lingua they like films.
 */
import {
  normalizeFactValue, sanitizeLearnerFacts, FACT_TYPES,
} from './learnerModel.js'
import { seedFrom } from './variation.js'
import { asSubjectValue, taughtPlaceIn, taughtHourIn } from './semanticContext.js'

// A fact needs this much confidence before it is allowed to shape anything.
export const MIN_FACT_CONFIDENCE = 0.5
// …and this long between uses, so it never feels like being watched.
export const FACT_COOLDOWN_MS = 20 * 60 * 60 * 1000   // roughly a day
// After this many uses a fact steps aside for something else.
export const MAX_CONSECUTIVE_USES = 3

/*
 * Remember something the learner said. An existing fact is reinforced rather
 * than duplicated; a different value is ADDED, because people like more than
 * one thing and the older answer was not a mistake.
 */
export function recordLearnerFact(model, { type, value, sourceEpisodeId = null, atMs = Date.now() } = {}) {
  if (!FACT_TYPES.includes(type)) return null
  const clean = normalizeFactValue(value)
  if (!clean) return null
  const facts = sanitizeLearnerFacts(model.learnerFacts)
  const at = new Date(atMs).toISOString()
  const idx = facts.findIndex(f => f.type === type && f.value.toLowerCase() === clean.toLowerCase())
  if (idx >= 0) {
    // said again → we believe it a little more, and it stays as one fact
    facts[idx] = { ...facts[idx], confidence: Math.min(1, facts[idx].confidence + 0.2), learnedAt: facts[idx].learnedAt || at }
  } else {
    facts.push({ type, value: clean, sourceEpisodeId, learnedAt: at, lastUsedAt: null, useCount: 0, confidence: 0.6 })
  }
  model.learnerFacts = sanitizeLearnerFacts(facts)
  return model.learnerFacts.find(f => f.type === type && f.value.toLowerCase() === clean.toLowerCase()) || null
}

/*
 * The fact A1 arc 1 is designed to remember, captured from a statement the
 * learner passed. Lives here rather than in the player so the engine, the player
 * and the checks all apply ONE rule — the capture used to be describable only by
 * reading a component, which no headless test could reach.
 *
 * The blueprint marks `work_or_study` as `store: true`, `semanticType: "place"`,
 * source "learner statement in arc 1", privacy "no employer names; a neutral
 * category is enough". Each of those becomes a condition:
 *
 *   WHAT   the taught place, never the sentence and never the verb. An employer
 *          name matches nothing and is dropped, so the privacy rule is enforced
 *          rather than trusted.
 *   WHEN   only a `state_life_fact` turn. Recognising the frame in a closed step
 *          proves nothing about the learner's life.
 *   WHOSE  the model answer is authored content, identical for every learner, so
 *          copying it stores nothing. Typing your own sentence stores it, even
 *          with help on screen: the existing rule for a captured fact is "what the
 *          learner volunteered, never a corrected mistake", and volunteering is
 *          about authorship, not about scoring. A fact is not mastery.
 */
export const LIFE_FACT_INTENT = 'state_life_fact'
export const LIFE_FACT_TYPE = 'work_or_study'

export function captureStatedLifeFact(model, { evalKind, reply, modelAnswer = '', sourceEpisodeId = null, atMs = Date.now() } = {}) {
  if (evalKind !== LIFE_FACT_INTENT) return null
  const said = String(reply || '').trim()
  if (!said) return null
  const shown = String(modelAnswer || '').trim()
  if (shown && said.toLowerCase() === shown.toLowerCase()) return null
  const place = taughtPlaceIn(said)
  if (!place) return null
  return recordLearnerFact(model, { type: LIFE_FACT_TYPE, value: place, sourceEpisodeId, atMs })
}

/*
 * A1 arc 2's fact, and the same three questions answered from the blueprint.
 *
 * `usual_time` is `store: true`, `semanticType: "time_point"`, source "learner
 * statement in arc 2", privacy "harmless", reused by `making_arrangements` — which
 * is the whole reason to keep it: proposing "shall we meet at seven?" needs to know
 * that seven means something to this person.
 *
 *   WHAT   the hour, as the word the level teaches. `taughtHourIn` reads "at seven"
 *          and "at 7" and refuses "at eleven", because eleven arrives in arc 5. A
 *          part of the day is not stored: "in the morning" cannot become a meeting.
 *   WHEN   only a `state_routine` turn the learner passed. A comprehension step
 *          about somebody else's morning says nothing about theirs.
 *   WHOSE  the same authorship rule arc 1 established: copying the model answer
 *          stores nothing, typing your own sentence stores it even with help on
 *          screen. A fact is not mastery, and the two are recorded separately.
 */
export const ROUTINE_FACT_INTENT = 'state_routine'
export const ROUTINE_FACT_TYPE = 'usual_time'

export function captureStatedUsualTime(model, { evalKind, reply, modelAnswer = '', sourceEpisodeId = null, atMs = Date.now() } = {}) {
  if (evalKind !== ROUTINE_FACT_INTENT) return null
  const said = String(reply || '').trim()
  if (!said) return null
  const shown = String(modelAnswer || '').trim()
  if (shown && said.toLowerCase() === shown.toLowerCase()) return null
  const hour = taughtHourIn(said)
  if (!hour) return null
  return recordLearnerFact(model, { type: ROUTINE_FACT_TYPE, value: hour, sourceEpisodeId, atMs })
}

export function factsOfType(model, type) {
  return sanitizeLearnerFacts(model.learnerFacts).filter(f => f.type === type)
}

/*
 * Choose a fact to colour ONE activity, or null.
 *
 * `avoidValue` is what the activity is already about — repeating it would not
 * be memory, just an echo. The seed makes the choice stable: the same session
 * gets the same fact across reloads, a new session may get another one.
 */
export function selectLearnerFact(model, { type = 'like', seed = '', atMs = Date.now(), avoidValue = null, allowRecent = false, dismissedIds = [], accept = null } = {}) {
  const declined = new Set((dismissedIds || []).map(id => String(id).toLowerCase()))
  const candidates = factsOfType(model, type).filter((fact) => {
    /*
     * `accept` lets the CALLER say what kind of value it can use, before the
     * cooldown and rotation rules run. Filtering afterwards would silently drop
     * the whole choice whenever the seed happened to land on a value the
     * activity could not use.
     */
    if (typeof accept === 'function' && !accept(fact)) return false
    if (fact.confidence < MIN_FACT_CONFIDENCE) return false
    // waved away for today: still a fact, just not this one right now
    if (declined.has(`${fact.type}:${fact.value.toLowerCase()}`)) return false
    if (avoidValue && fact.value.toLowerCase() === String(avoidValue).toLowerCase()) return false
    if (allowRecent) return true
    if (fact.useCount >= MAX_CONSECUTIVE_USES) return false
    if (fact.lastUsedAt && atMs - new Date(fact.lastUsedAt).getTime() < FACT_COOLDOWN_MS) return false
    return true
  })
  if (!candidates.length) return null
  // prefer the least-used, then a stable pick among equals
  const fewest = Math.min(...candidates.map(f => f.useCount))
  const pool = candidates.filter(f => f.useCount === fewest)
  return pool[seedFrom(String(seed)) % pool.length]
}

export function markFactUsed(model, fact, atMs = Date.now()) {
  if (!fact) return model
  const facts = sanitizeLearnerFacts(model.learnerFacts)
  const idx = facts.findIndex(f => f.type === fact.type && f.value.toLowerCase() === fact.value.toLowerCase())
  if (idx < 0) return model
  facts[idx] = { ...facts[idx], lastUsedAt: new Date(atMs).toISOString(), useCount: facts[idx].useCount + 1 }
  model.learnerFacts = sanitizeLearnerFacts(facts)
  return model
}

/*
 * Using a fact "resets" how tired the others are: once something else has been
 * the subject, an earlier fact is fair game again. This is what stops one
 * answer from following the learner around forever.
 */
export function rotateFactUsage(model, usedFact) {
  if (!usedFact) return model
  const facts = sanitizeLearnerFacts(model.learnerFacts).map(f => (
    f.type === usedFact.type && f.value.toLowerCase() !== usedFact.value.toLowerCase()
      ? { ...f, useCount: 0 }
      : f
  ))
  model.learnerFacts = sanitizeLearnerFacts(facts)
  return model
}

/*
 * What an activity should actually talk about, in order of preference:
 * something the learner told us, otherwise the interest they chose, otherwise
 * a neutral example. Never a raw id, never an explanation of why.
 */
export function getFactContext(model, { interestContext = null, seed = '', atMs = Date.now(), optOut = false, dismissedIds = [] } = {}) {
  if (optOut) return { source: 'neutral', value: null, fact: null }
  /*
   * A remembered like becomes the day's subject only if it is something a
   * person can be asked to like. Episode 7's gap stores whatever was typed, so
   * without this the session announced "Something you mentioned: tired" and
   * every sentence built around it inherited the nonsense.
   */
  const fact = selectLearnerFact(model, {
    type: 'like', seed, atMs, avoidValue: interestContext?.targetNoun, dismissedIds,
    accept: (candidate) => Boolean(asSubjectValue(candidate.value)),
  })
  if (fact) return { source: 'fact', value: fact.value, fact }
  if (interestContext?.interestId) return { source: 'interest', value: interestContext.targetNoun, fact: null }
  return { source: 'neutral', value: null, fact: null }
}
