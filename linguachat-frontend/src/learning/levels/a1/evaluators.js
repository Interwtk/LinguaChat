/*
 * A1 arc 6/7 evaluator reference implementations — level-owned, not dispatched.
 *
 * `engine/responseEvaluation.js`'s per-intent `evaluateFree` switch is a
 * shared, flat dispatcher (`docs/curriculum/curriculum-isolation-plan.md`'s
 * survey names it explicitly). This task's write scope does not include
 * `engine/**`, so nothing here is wired into that switch — see
 * `docs/curriculum/implementation/a1/core-requirements.md` for the exact,
 * content-informed ask to whichever task does have that scope (`LC-INT-001`),
 * mirroring the pattern `levels/a2/evaluators.js` and `levels/b2/**` already
 * established for their own levels.
 *
 * What IS delivered here: a full, working, testable reference implementation
 * for A1 arc 6/7's three new intents (`docs/curriculum/a1-blueprint.json
 * #intentStrategy.newIntents`: `state_ability`, `ask_ability`,
 * `arrange_meeting`), built against the exact same result contract
 * `engine/responseEvaluation.js`'s `base()` already returns. `normalize`/`fold`
 * are imported (read-only) from that module rather than duplicated, since they
 * are pure string utilities with no level awareness — the same reuse A2's own
 * `evaluators.js` already does.
 *
 * Also implements, as real working code, the level's one documented
 * architectural debt (`a1-blueprint.json#coreEngineRequirements.canAmbiguity`):
 * `evaluateAskAbility` must tell "Can you swim?" (ability) from "Can you
 * repeat, please?" (Pre-A1's existing repair request) apart, by the semantic
 * type of what follows the verb, exactly as the blueprint's own
 * `proposedSharedBehaviour` describes. Because this file never touches
 * `engine/responseEvaluation.js`, the blueprint's own stated regression risk
 * ("must not break Pre-A1's existing 'Can you repeat, please?' request
 * handling") cannot be introduced by this change — no existing code is
 * modified, only new, additive reference code that LC-INT-001 wires in.
 *
 * A fourth reference function, `evaluateAskHowToSay`, implements
 * `canDos.ask_how_to_say_something.intentReuse`: "repair_request with a new
 * repairKind subtype" — a fifth `REPAIR_KINDS` entry
 * (`engine/responseEvaluation.js`'s current list has four:
 * `signal_nonunderstanding`, `repeat`, `slow_down`, `ask_meaning`). This is a
 * REFERENCE for what `evaluateRepairRequest`'s `ask_how_to_say` branch should
 * do once merged — it is not itself wired into that function, and is exported
 * separately rather than mutating engine state.
 */

import { normalize, fold } from '../../engine/responseEvaluation.js'

const base = (independent) => ({
  source: 'deterministic',
  understood: true,
  completedObjective: false,
  acceptedVariant: false,
  confidence: 0.9,
  conclusive: true,
  errorType: null,
  priorityCorrection: null,
  explanation: null,
  naturalVersion: null,
  retryRequired: false,
  retryPrompt: null,
  praiseKey: null,
  masteryEvidence: { independent: Boolean(independent), scaffoldUsed: !independent },
  registerAppropriateness: { checked: false, appropriate: null, expectedRegister: null, detectedRegister: null },
  discourseCoherence: { checked: false, coherent: null, clausesEvaluated: null, incoherenceType: null },
  conversationStateTracking: { checked: false, correct: null, failureType: null },
})

const empty = (r) => ({ ...r, understood: false, confidence: 0.95, errorType: 'empty', conclusive: true, retryRequired: true })
const nonsense = (r) => ({ ...r, understood: false, errorType: 'nonsense', confidence: 0.85, retryRequired: true })
const withPraise = (r, prefix) => { r.praiseKey = r.masteryEvidence.independent ? `${prefix}PraiseIndependent` : `${prefix}PraiseGuided`; return r }

/* ---------------------------------------------------------------------- */
/* Closed vocabulary — the arc's own taught set, plus a small receptive     */
/* extension (a1-blueprint.json arc `what_you_can_do`'s own                */
/* `receptiveTarget`: "abilities named that the learner has not met").      */
/* ---------------------------------------------------------------------- */

export const ABILITY_ACTIVITIES = ['swim', 'cook', 'drive', 'dance', 'sing']
const ABILITY_ACTIVITIES_RECEPTIVE = ['ski', 'draw', 'paint', 'cycle', 'ride a bike', 'play chess', 'play the guitar', 'speak spanish']
const KNOWN_ABILITY_RE = new RegExp(`\\b(${[...ABILITY_ACTIVITIES, ...ABILITY_ACTIVITIES_RECEPTIVE].join('|')})\\b`)

/*
 * THE DISAMBIGUATION SET. Mirrors `engine/responseEvaluation.js`'s own
 * `ASK_REPEAT`/`ASK_SLOW` phrasing (those regexes are internal, not exported,
 * so this is a deliberate, documented parallel — `core-requirements.md` asks
 * LC-INT-001 to keep the two in sync at merge time rather than silently
 * drift). A communicative-act complement here means the surface sentence is
 * Pre-A1's existing repair request, not this arc's new ability question, no
 * matter how closely the two share the "Can you ___?" shell.
 */
const REPAIR_COMPLEMENT_RE = /\b((repeat|say (that|it) again)|speak (more )?slowly|slow down|spell (that|it))\b/

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_RE = new RegExp(`\\b(${DAYS.join('|')})\\b`)
const NUMBER_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
const TIME_RE = new RegExp(`\\bat\\s+(${NUMBER_WORDS.join('|')}|\\d{1,2})\\b`)
/*
 * A closed place set rather than a loose "at + word" regex, deliberately: a
 * loose regex would match "at seven" as a place too (a number is also
 * "[a-z]+"-shaped after normalization strips digits from view in prose, and
 * `time_at_pattern`'s own shape is "at + number"). Keeping PLACE its own
 * closed vocabulary — arc 7's own gardenItems (`the_station`, `the_cinema`)
 * plus a few neutral A1 places already taught (arc 1's `home`/`the_office`,
 * arc 4's `the_entrance`) — means TIME and PLACE can never collide on the
 * same "at ___" shell.
 */
const PLACE_WORDS = ['the station', 'the cinema', 'home', 'the office', 'the entrance', 'the market']
const PLACE_RE = new RegExp(`\\b(at|near|next to)\\s+(${PLACE_WORDS.join('|')})\\b`)

/* ---------------------------------------------------------------------- */
/* state_ability — "I can / I can't + verb"                                */
/* ---------------------------------------------------------------------- */

/**
 * Judges an ability STATEMENT. `abilityForm`: 'positive' | 'negative' |
 * undefined (either accepted — used when the step does not require a
 * specific polarity, e.g. a free-choice recall).
 */
export function evaluateStateAbility(text, { independent = false, abilityForm } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)

  /*
   * Tolerates ONE intervening adverb between "I" and "can" — "I definitely
   * can't cook." is a natural reply. Capped at one word (not more) so this
   * stays "I [adverb] can(')t ___" and does not start matching a sentence
   * about someone else's ability, e.g. "I think you can help" (two words,
   * "think you", between "I" and "can" — correctly NOT matched as the
   * learner's own ability).
   */
  const negative = /\bi\s+(?:\w+\s+)?(can'?t|cannot|can not)\b/.test(n)
  const positive = !negative && /\bi\s+(?:\w+\s+)?can\b/.test(n)
  if (!negative && !positive) {
    /* a real attempt with no recognisable frame at all */
    if (KNOWN_ABILITY_RE.test(n)) {
      return { ...r, understood: false, errorType: 'missing_can_frame', confidence: 0.7, conclusive: false, retryRequired: true }
    }
    return nonsense(r)
  }

  const polarity = negative ? 'negative' : 'positive'
  if (abilityForm && abilityForm !== polarity) {
    return { ...r, understood: false, errorType: 'wrong_polarity', confidence: 0.9,
      priorityCorrection: 'ep34RetryExplainPolarity', explanation: 'ep34RetryExplainPolarity', retryRequired: true }
  }

  if (!KNOWN_ABILITY_RE.test(n)) {
    /* the frame is right, no taught (or receptive) activity is named */
    return { ...r, understood: false, errorType: 'insufficient_form', confidence: 0.6, conclusive: false, retryRequired: true }
  }

  r.completedObjective = true
  r.confidence = 0.92
  r.acceptedVariant = !/^i\s+can'?t?\s+\w+\.?$/.test(n)
  return withPraise(r, 'ep34')
}

/* ---------------------------------------------------------------------- */
/* ask_ability — "Can you + verb?" — THE canAmbiguity disambiguation.       */
/* ---------------------------------------------------------------------- */

export function evaluateAskAbility(text, { independent = false } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)

  const shellPresent = /\bcan\s+you\b/.test(n)

  /*
   * THE CORE CHECK. A "Can you ___?" sentence whose complement is a
   * communicative-act request (repeat/slow down/spell) is Pre-A1's existing
   * repair request, not this arc's ability question — refused with a named
   * errorType so the learner is told why, not just marked wrong.
   */
  if (shellPresent && REPAIR_COMPLEMENT_RE.test(n)) {
    return { ...r, understood: false, errorType: 'ability_request_confusion', confidence: 0.93, conclusive: true,
      priorityCorrection: 'ep35RetryExplainAbilityVsRequest', explanation: 'ep35RetryExplainAbilityVsRequest', retryRequired: true }
  }

  if (shellPresent && KNOWN_ABILITY_RE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.92
    r.acceptedVariant = !/^can\s+you\s+\w+(\s\w+){0,2}\??$/.test(n)
    return withPraise(r, 'ep35')
  }

  if (shellPresent) {
    /* the right shell, an unrecognised complement — genuinely ambiguous, not nonsense */
    return { ...r, understood: false, errorType: 'unknown_ability_complement', confidence: 0.55, conclusive: false, retryRequired: true }
  }

  /*
   * A common L1-transfer near miss: "Do you can swim?" — the learner reaches
   * for the ability question with the wrong auxiliary. Named so the
   * correction can be specific rather than "try again".
   */
  if (/\bdo\s+you\s+can\b/.test(n)) {
    return { ...r, understood: false, errorType: 'wrong_question_form', confidence: 0.85,
      priorityCorrection: 'ep35RetryExplainForm', explanation: 'ep35RetryExplainForm', retryRequired: true }
  }

  return nonsense(r)
}

/* ---------------------------------------------------------------------- */
/* repair_request / ask_how_to_say — REFERENCE for a fifth REPAIR_KINDS     */
/* entry, per canDos.ask_how_to_say_something.intentReuse.                  */
/* ---------------------------------------------------------------------- */

/* requires a complement after "say" — a bare "how do you say" falls through to the loose check below */
const ASK_HOW_TO_SAY_RE = /\bhow\s+do\s+(you|i)\s+say\s+\S+/
const ASK_HOW_TO_SAY_LOOSE_RE = /\bhow\s+(do\s+you\s+)?(say|spell)\b/

export function evaluateAskHowToSay(text, { independent = false } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)

  if (ASK_HOW_TO_SAY_RE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.94
    r.acceptedVariant = !/^how\s+do\s+you\s+say\s+.+\??$/.test(n)
    return withPraise(r, 'ep35')
  }
  if (ASK_HOW_TO_SAY_LOOSE_RE.test(n)) {
    return { ...r, understood: false, errorType: 'incomplete_how_to_say', confidence: 0.7, conclusive: false,
      priorityCorrection: 'ep35RetryExplainHowToSay', explanation: 'ep35RetryExplainHowToSay', retryRequired: true }
  }
  return nonsense(r)
}

/* ---------------------------------------------------------------------- */
/* arrange_meeting — "Let's meet on + day at + time" / place / confirm      */
/* ---------------------------------------------------------------------- */

/**
 * `arrangeStage`: 'propose' (day + time, episode 36), 'place' (a place,
 * episode 37), 'confirm' (day + time + place together — the arc's headline
 * evidence, exercised by BOTH episode 37's confirmation turns and episode
 * 38's closing turns). Because 'confirm' is genuinely shared by two
 * episodes, `praisePrefix` lets the caller (the step, via its own
 * `praisePrefix` field) say which episode's praise copy applies — it
 * defaults to `'ep38'` (the more common case: most 'confirm' turns across
 * the arc are episode 38's) and episode 37's own confirm steps override it
 * explicitly, rather than this function guessing from stage alone.
 */
export function evaluateArrangeMeeting(text, { independent = false, arrangeStage = 'propose', praisePrefix } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)

  const hasDay = DAY_RE.test(n)
  const hasTime = TIME_RE.test(n)
  const hasPlace = PLACE_RE.test(n)

  if (arrangeStage === 'propose') {
    if (hasDay && hasTime) {
      r.completedObjective = true
      r.confidence = 0.9
      r.acceptedVariant = !/^let'?s\s+meet\s+on\s+\w+\s+at\s+/.test(n)
      return withPraise(r, praisePrefix || 'ep36')
    }
    const missing = !hasDay && !hasTime ? 'day_and_time' : !hasDay ? 'day' : 'time'
    if (hasDay || hasTime) {
      return { ...r, understood: false, errorType: `missing_${missing}`, confidence: 0.65, conclusive: false,
        priorityCorrection: 'ep36RetryExplainMissing', explanation: 'ep36RetryExplainMissing', retryRequired: true }
    }
    return nonsense(r)
  }

  if (arrangeStage === 'place') {
    if (hasPlace) {
      r.completedObjective = true
      r.confidence = 0.88
      return withPraise(r, praisePrefix || 'ep37')
    }
    return { ...r, understood: false, errorType: 'missing_place', confidence: 0.6, conclusive: false, retryRequired: true }
  }

  /* 'confirm' — the headline evidence: day, time AND place, all three */
  if (hasDay && hasTime && hasPlace) {
    r.completedObjective = true
    r.confidence = 0.93
    return withPraise(r, praisePrefix || 'ep38')
  }
  const missingParts = [!hasDay && 'day', !hasTime && 'time', !hasPlace && 'place'].filter(Boolean)
  if (missingParts.length < 3) {
    return { ...r, understood: false, errorType: 'incomplete_confirmation', confidence: 0.6, conclusive: false,
      priorityCorrection: 'ep37RetryExplainConfirm', explanation: 'ep37RetryExplainConfirm', retryRequired: true,
      naturalVersion: `missing: ${missingParts.join(', ')}` }
  }
  return nonsense(r)
}

/* ---------------------------------------------------------------------- */
/* Coverage tables — the shape `check-a1-arc6-arc7-structure.mjs` and a      */
/* future dispatch-table merge both read.                                   */
/* ---------------------------------------------------------------------- */

export const A1_ARC6_ARC7_NEW_INTENTS = ['state_ability', 'ask_ability', 'arrange_meeting']
export const A1_ARC6_ARC7_EVALUATORS = {
  state_ability: evaluateStateAbility,
  ask_ability: evaluateAskAbility,
  arrange_meeting: evaluateArrangeMeeting,
}

/*
 * `evaluateAskHowToSay` is deliberately NOT in `A1_ARC6_ARC7_EVALUATORS`
 * above — it is not dispatched by `evalKind` (episode 35's step declares
 * `evalKind: 'repair_request'`, the EXISTING shared intent, with
 * `repairKind: 'ask_how_to_say'`), so it is keyed by `repairKind` here
 * instead. `check-a1-arc6-arc7-structure.mjs`'s suggestionEn self-check
 * reads this map for `repair_request` steps specifically, so the one step
 * that actually exercises this function is not silently skipped.
 */
export const A1_ARC6_ARC7_REPAIR_KIND_EVALUATORS = {
  ask_how_to_say: evaluateAskHowToSay,
}

/* fold is re-exported so a future consumer never has to import it from two places */
export { fold }
