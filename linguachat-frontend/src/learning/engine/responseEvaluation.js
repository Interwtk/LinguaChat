/*
 * responseEvaluation — deterministic (Level 1) evaluation of learner free replies.
 *
 * Returns a consistent contract the UI never shows raw:
 *   {
 *     source: 'deterministic',
 *     understood, completedObjective, acceptedVariant, confidence, conclusive,
 *     errorType, priorityCorrection (key), explanation (key), naturalVersion,
 *     retryRequired, retryPrompt (key), praiseKey,
 *     masteryEvidence: { independent, scaffoldUsed }
 *   }
 *
 * `conclusive` tells the hybrid router whether this local verdict is trustworthy
 * on its own. Clear accepts and clear failures are conclusive; a non-empty reply
 * that looks like a genuine but unrecognized attempt is NOT conclusive, so the
 * router may escalate it to Lingua (Level 2). When no remote is available the
 * deterministic verdict is still used as a safe, conservative fallback (Level 3).
 */

import { thingById, withArticle, countedThing } from './semanticContext.js'
/*
 * A1 arc 6/7's three new intents (`state_ability`/`ask_ability`/
 * `arrange_meeting`) were authored as level-owned reference evaluators against
 * this file's own `base()` contract (`levels/a1/evaluators.js`'s header
 * explains why: that task's write scope did not include `engine/**`). This is
 * a circular import by module graph, not by runtime order: `evaluators.js`
 * only uses `normalize`/`fold`, both hoisted function declarations, so it
 * resolves safely regardless of which module finishes evaluating first — the
 * same shape `levels/a2/evaluators.js` already relies on.
 */
import { evaluateStateAbility, evaluateAskAbility, evaluateArrangeMeeting } from '../levels/a1/evaluators.js'
/*
 * A2's 17 new intents were authored the same way, against the same `base()`
 * contract, in `levels/a2/evaluators.js` — see that file's own header and
 * `docs/curriculum/implementation/a2/core-requirements.md` §3. Also imports
 * `evaluateSpellWord` (used directly for the `spell_word` intent) and
 * `evaluateRespondToInvitation`, which internally reuses `twoClauseJudgment`
 * for its decline-with-reason branch — no logic is duplicated here.
 *
 * `evaluateStateAvailability` is deliberately NOT imported/dispatched: no A2
 * episode's steps use the `state_availability` intent (every availability
 * turn in `booking_a_stay` is `ask_availability`), and `check-curriculum-map.mjs`
 * asserts no dispatched intent goes unused — a real, enforced "no dead
 * evaluator" rule, not an oversight. The reference implementation stays in
 * `levels/a2/evaluators.js` for `check-a2-evaluators.mjs` and any future
 * episode that needs it; wiring it into dispatch is that future content's job.
 */
import {
  evaluateStatePastEvent, evaluateAskPastEvent, evaluateNarratePastSequence,
  evaluateStateFuturePlan, evaluateAskFuturePlan,
  evaluateDescribePersonOrPlace, evaluateCompareThings, evaluateStateOpinionWithReason,
  evaluateGiveMultiStepDirections,
  evaluateAskAvailability, evaluateMakeBooking, evaluateSpellWord,
  evaluateReportProblem, evaluateAskForHelp,
  evaluateInviteSomeone, evaluateRespondToInvitation,
} from '../levels/a2/evaluators.js'
/*
 * B1's 14 new intents were authored the same way, against the same `base()`
 * contract, in `levels/b1/evaluators.js` — see that file's own header and
 * `docs/curriculum/implementation/b1/README.md`.
 *
 * `evaluateReportProblem` is imported ALIASED as `evaluateEscalateProblemB1`:
 * B1's own `levels/b1/evaluators.js` exports a function with the exact same
 * name as A2's `levels/a2/evaluators.js` one immediately above — two
 * different modules, so no JS collision on its own, but this file already
 * imports A2's `evaluateReportProblem` into this same scope, so a second,
 * un-aliased import of the same name here would be a real `SyntaxError`
 * (duplicate binding), not just a style question. The alias also keeps the
 * dispatcher below honest about which evaluator answers which intent: B1's
 * function is dispatched under `escalate_problem`, never `report_problem` —
 * see `curriculum/b1Map.js`'s `B1_CAN_DO_INTENT` comment for the full
 * account of the collision this avoids.
 */
import {
  evaluateNarratePastEvent as evaluateNarratePastEventB1,
  evaluateStateOpinion as evaluateStateOpinionB1,
  evaluateAgreeOrDisagree as evaluateAgreeOrDisagreeB1,
  evaluateCompareAndChoose as evaluateCompareAndChooseB1,
  evaluateDescribeExperience as evaluateDescribeExperienceB1,
  evaluateRecommendOrWarn as evaluateRecommendOrWarnB1,
  evaluateReportProblem as evaluateEscalateProblemB1,
  evaluateNegotiateSolution as evaluateNegotiateSolutionB1,
  evaluateStateFutureIntent as evaluateStateFutureIntentB1,
  evaluateStateRealCondition as evaluateStateRealConditionB1,
  evaluateStateHypothetical as evaluateStateHypotheticalB1,
  evaluateChangeTopic as evaluateChangeTopicB1,
  evaluateAskFollowUp as evaluateAskFollowUpB1,
  evaluateSummarizeOther as evaluateSummarizeOtherB1,
} from '../levels/b1/evaluators.js'
/*
 * B2's 14 new intents were authored the same way, against the same `base()`
 * contract, in `levels/b2/evaluators.js` — see that file's own header for
 * the two real scoring dimensions it implements (`registerAppropriateness`,
 * `discourseCoherence`) and the three-tier structural-floor fallback.
 * `argue_opinion_with_reason` is B2's runtime-renamed dispatch key for
 * `develop_and_defend_opinion` — b2.json's own `state_opinion_with_reason`
 * collides with A2's own, unrelated intent of that exact bare id (see
 * `levels/b2/b2Capabilities.js`'s `B2_CAN_DO_INTENT` comment for the full
 * account, the same collision class B1's `escalate_problem` rename resolved
 * against A2 above).
 */
import {
  evaluateArgueOpinionWithReason, evaluateWeighOptions, evaluateConcedeAndCounter,
  evaluateJustifyARequest, evaluateProposeAResolution, evaluateExpressDiplomaticFrustration,
  evaluateStateUnrealHypothesis, evaluateSpeculateCauseOrEffect, evaluateExpressPastRegret,
  evaluateSummarizeForThirdParty, evaluateReformulateForClarity, evaluateReportThirdPartyOpinion,
  evaluateShiftRegister, evaluateSoftenOrIntensifyClaim,
} from '../levels/b2/evaluators.js'
/*
 * C1's 11 new (non-repair) intents were authored the same way, against the
 * same `base()` contract, in `levels/c1/evaluators.js` — see that file's own
 * header for how it implements `registerAppropriateness`/`discourseCoherence`
 * as REQUIRED (not should-relevant, B2's own use of the same two fields) and
 * the new `conversationStateTracking` dimension. The 12th C1 intent,
 * `clarify_ambiguity`, has no entry here — it dispatches through
 * `evaluateRepairRequest` above with a forced `repairKind`, per
 * `REPAIR_KINDS`'s own comment.
 */
import {
  evaluateStateStructuredArgument, evaluateQualifyClaim, evaluateConcedePoint,
  evaluateAdaptRegister, evaluateHedgeStatement, evaluateSummarizeMessage,
  evaluateSynthesizeViewpoints, evaluateInferMeaning, evaluateExtendedExplanation,
  evaluateNegotiateOutcome, evaluateTrackDiscourse,
} from '../levels/c1/evaluators.js'
/*
 * C2's 10 exclusive new intents were authored the same way, against the
 * same `base()` contract, in `levels/c2/evaluators.js` — see that file's
 * own header for the two real scoring dimensions it populates
 * (`registerAppropriateness`, `discourseCoherence`), the multi-turn
 * evaluation span mechanism (`ctx.spanTurns`) and the three-tier
 * structural-floor fallback. `qualify_claim`, `synthesize_viewpoints` and
 * `shift_register` are C2's THREE REUSED bare intent ids (from C1/C1/B2
 * respectively) — each still has exactly one `case` below; the case itself
 * branches on `ctx.canDoId` membership in `levels/c2/evaluators.js`'s own
 * `C2_..._CAN_DO_IDS` sets, calling C1's/B2's existing function unchanged
 * for their own can-dos and C2's own function otherwise. See that file's
 * header for why a bare intent id may be reused across levels at all (the
 * same precedent `cafe_order_conversation`/`repair_request`/`use_quantity`
 * already set for Pre-A1/A1/A2).
 */
import {
  evaluateExtractArgument, evaluateC2SynthesizeViewpoints, evaluateIdentifyStance,
  evaluateReformulateForAudience, evaluateRecognizeImplication, evaluateC2ShiftRegister,
  evaluateC2QualifyClaim, evaluateDevelopArgument, evaluateRebutCounterargument,
  evaluateSustainCoherence, evaluateRepairAtIntentionLevel, evaluateEditForPrecision,
  evaluateMediateDisagreement,
  C2_QUALIFY_CLAIM_CAN_DO_IDS, C2_SYNTHESIZE_VIEWPOINTS_CAN_DO_IDS, C2_SHIFT_REGISTER_CAN_DO_IDS,
} from '../levels/c2/evaluators.js'

// Normalize: lowercase, unify apostrophes, drop emojis/symbols, keep letters
// (incl. accents) + digits + spaces + apostrophes, collapse spaces.
export function normalize(text) {
  return String(text || '')
    .replace(/[’‘‛`´]/g, "'")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Accent-fold for lenient name matching (é -> e).
const DIACRITICS = /[̀-ͯ]/g
export function fold(text) {
  return String(text || '').normalize('NFD').replace(DIACRITICS, '').toLowerCase()
}

const wordCount = (n) => (n ? n.split(' ').filter(Boolean).length : 0)

const GREETING = /\b(hi|hello|hey|hey there|good morning|good afternoon|good evening)\b/
const GREETING_G = /\b(hi|hello|hey|there|good morning|good afternoon|good evening)\b/g
// Copula / self-naming patterns accepted for a Pre-A1 introduction.
const INTRO = /\b(i'?m called|i'?m|i am called|i am|my name'?s|my name is|name'?s|name is|(?:you can |they |people |everyone |friends )?call me|i go by|go by)\b/
const INTRO_G = /\b(i'?m called|i'?m|i am called|i am|my name'?s|my name is|name'?s|name is|call me|i go by|go by|you can|they|people|everyone|friends)\b/g
// Ask-name question forms (incl. politely prefixed variants).
const ASK_NAME = /\b((and )?(what'?s|what is) your name|(may|can) i ask (for )?your name|and your name)\b/
const NICE = /\bnice (to meet|meeting) you\b/
// Short reciprocal closings — only valid as a REPLY to "nice to meet you".
const RECIPROCAL = /^(you too|same|same here|likewise|and you)\.?!?$/

function hasNameToken(normalized, name) {
  const rest = normalized.replace(GREETING_G, ' ').replace(INTRO_G, ' ').replace(/\s+/g, ' ').trim()
  if (rest && /\p{L}/u.test(rest)) return true
  if (name && fold(normalized).includes(fold(String(name).trim())) && fold(name).trim()) return true
  return false
}

/*
 * `registerAppropriateness` and `discourseCoherence` are the two shared
 * evaluator dimensions B2 and C1 each independently requested
 * (docs/curriculum/core-engine-requirements.md, resolving LC-AUD-001 F8).
 * Every evaluator gets the same `checked: false` / null-valued default here:
 * no Pre-A1 or A1 capability exercises either dimension today, and a
 * capability that needs one sets `checked: true` and the rest of the shape
 * explicitly when that capability's own evaluator is written. This is the
 * shared contract, not the scoring logic — see the design doc for how a
 * future B2/C1 evaluator should populate it.
 *
 * `conversationStateTracking` is C1-only (core-engine-requirements.md
 * section 3, kept deliberately separate from `discourseCoherence` — "coherent
 * within a turn" vs. "accurately references an earlier turn" are different
 * mechanisms). Same shared-default treatment: every evaluator gets
 * `checked: false` here, and only `refer_back_to_earlier_discourse`'s own
 * evaluator (`levels/c1/evaluators.js`) populates it.
 */
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

/* ---- Episode 1 & 3: introduce yourself ---- */
export function evaluateIntroduction(text, { name = 'Alex', independent = false } = {}) {
  const n = normalize(text)
  const natural = `Hi, I'm ${String(name).trim() || 'Alex'}.`
  const r = base(independent)
  r.naturalVersion = natural
  if (!n) {
    return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep1RetryPromptEmpty' }
  }
  const greeting = GREETING.test(n)
  const copula = INTRO.test(n)
  const nameOk = hasNameToken(n, name)

  if (copula && nameOk) {
    r.completedObjective = true
    r.confidence = 0.96
    r.acceptedVariant = !(greeting && /i'?m|i am|my name is/.test(n))
    // specific, non-repetitive praise
    if (r.masteryEvidence.independent) r.praiseKey = 'ep1PraiseIndependent'
    else if (!greeting) r.praiseKey = 'ep1PraiseIm'
    else r.praiseKey = 'ep1PraiseGreetAndName'
    return r
  }
  // A non-empty reply that carries a name plus extra, unrecognized wording (e.g.
  // "Sebastián here", "I'm known as Sam") is a plausible attempt we cannot
  // confirm locally → mark non-conclusive so the router may consult Lingua.
  const words = wordCount(n)
  const looksLikeAttempt = nameOk && !copula && (/\b(here|known|goes|goes by)\b/.test(n) || words >= 3)

  if (!copula && nameOk) {
    return { ...r, errorType: 'missing_copula', confidence: looksLikeAttempt ? 0.5 : 0.85, conclusive: !looksLikeAttempt, priorityCorrection: 'ep1RetryExplainIm', explanation: 'ep1RetryExplainIm', retryRequired: true, retryPrompt: 'ep1RetryPromptIm' }
  }
  if (copula && !nameOk) {
    return { ...r, errorType: 'missing_name', priorityCorrection: 'ep1RetryExplainName', explanation: 'ep1RetryExplainName', retryRequired: true, retryPrompt: 'ep1RetryPromptName' }
  }
  if (greeting) {
    return { ...r, errorType: 'greeting_only', priorityCorrection: 'ep1RetryExplainName', explanation: 'ep1RetryExplainName', retryRequired: true, retryPrompt: 'ep1RetryPromptName' }
  }
  return { ...r, errorType: 'no_intro', confidence: words >= 3 ? 0.5 : 0.8, conclusive: words < 3, priorityCorrection: 'ep1RetryExplainIm', explanation: 'ep1RetryExplainIm', retryRequired: true, retryPrompt: 'ep1RetryPromptIm' }
}

/* ---- Episode 2: ask someone's name ---- */
export function evaluateAskName(text, { independent = false } = {}) {
  const n = normalize(text)
  const natural = "What's your name?"
  const r = base(independent)
  r.naturalVersion = natural
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep2RetryPromptEmpty' }
  if (ASK_NAME.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    // a politely-prefixed question is a natural (slightly formal) variant
    r.acceptedVariant = !/^what'?s your name$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep2PraiseIndependent' : 'ep2PraiseAsked'
    return r
  }
  // has "name" but not the question form
  if (/\bname\b/.test(n)) {
    return { ...r, errorType: 'question_order', priorityCorrection: 'ep2RetryExplain', explanation: 'ep2RetryExplain', retryRequired: true, retryPrompt: 'ep2RetryPrompt' }
  }
  return { ...r, errorType: 'no_question', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep2RetryExplain', explanation: 'ep2RetryExplain', retryRequired: true, retryPrompt: 'ep2RetryPrompt' }
}

/* ---- Episode 3: close naturally with "nice to meet you" ---- */
export function evaluateNiceToMeet(text, { independent = false, turnContext = null } = {}) {
  const n = normalize(text)
  const natural = 'Nice to meet you.'
  const r = base(independent)
  r.naturalVersion = natural
  const linguaSaid = normalize(turnContext && turnContext.linguaSaid)
  const asResponse = /nice (to meet|meeting) you/.test(linguaSaid)
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep3RetryPromptEmpty' }
  if (NICE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = /too\b/.test(n) || /meeting you/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep3PraiseIndependent' : 'ep3PraiseClose'
    return r
  }
  // "You too" / "likewise" close the exchange only when replying to the phrase.
  if (RECIPROCAL.test(n)) {
    if (asResponse) {
      r.completedObjective = true
      r.confidence = 0.9
      r.acceptedVariant = true
      r.praiseKey = r.masteryEvidence.independent ? 'ep3PraiseIndependent' : 'ep3PraiseClose'
      return r
    }
    // said as an opener — not a valid close on its own
    return { ...r, errorType: 'missing_close', priorityCorrection: 'ep3RetryExplain', explanation: 'ep3RetryExplain', retryRequired: true, retryPrompt: 'ep3RetryPrompt' }
  }
  return { ...r, errorType: 'missing_close', conclusive: wordCount(n) < 3, confidence: wordCount(n) < 3 ? 0.85 : 0.5, priorityCorrection: 'ep3RetryExplain', explanation: 'ep3RetryExplain', retryRequired: true, retryPrompt: 'ep3RetryPrompt' }
}

/* ---- Episode 4: ask how someone is ---- */
const ASK_WELLBEING = /\b(how are you( doing| today)?|how'?re you|how are things|how'?s it going)\b/
// "How you?" / "how you doing" — intent is clear, the auxiliary is missing.
const WELLBEING_NO_AUX = /\bhow (you|u)\b/

export function evaluateAskWellbeing(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'How are you?'
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep4RetryPromptEmpty' }
  if (ASK_WELLBEING.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = !/^how are you$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep4PraiseIndependent' : 'ep4PraiseAsked'
    return r
  }
  if (WELLBEING_NO_AUX.test(n)) {
    // understood, but the auxiliary "are" is missing — one priority correction
    return { ...r, errorType: 'missing_auxiliary', priorityCorrection: 'ep4RetryExplainAux', explanation: 'ep4RetryExplainAux', retryRequired: true, retryPrompt: 'ep4RetryPromptAux' }
  }
  return { ...r, errorType: 'no_question', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep4RetryExplainAsk', explanation: 'ep4RetryExplainAsk', retryRequired: true, retryPrompt: 'ep4RetryPromptAsk' }
}

/* ---- Episode 4: answer how you are ---- */
// Any of these feelings is a valid answer — a feeling is never "wrong".
const FEELING = /\b(good|fine|okay|ok|great|well|tired|happy|sleepy|so so|not bad|alright)\b/
const WELLBEING_FULL = /\b(i'?m|i am)\b/

export function evaluateAnswerWellbeing(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "I'm good."
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep4RetryPromptEmpty' }
  const feeling = FEELING.test(n)
  const full = WELLBEING_FULL.test(n)
  // "Good, thanks." / "Fine, thank you." are natural complete answers too.
  const politeShort = feeling && /\b(thanks|thank you)\b/.test(n)
  if (feeling && (full || politeShort)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = !/^i'?m good$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep4PraiseIndependent' : 'ep4PraiseAnswered'
    return r
  }
  if (feeling) {
    // partial evidence: the feeling is understood, the structure is missing
    return { ...r, errorType: 'missing_copula', priorityCorrection: 'ep4RetryExplainIm', explanation: 'ep4RetryExplainIm', retryRequired: true, retryPrompt: 'ep4RetryPromptIm' }
  }
  return { ...r, errorType: 'no_answer', conclusive: wordCount(n) < 3, confidence: wordCount(n) < 3 ? 0.85 : 0.5, priorityCorrection: 'ep4RetryExplainIm', explanation: 'ep4RetryExplainIm', retryRequired: true, retryPrompt: 'ep4RetryPromptIm' }
}

/* ---- Episodes 4 & 5: bounce the question back ---- */
const RECIPROCAL_Q = /\b(and you|what about you|how about you|and yourself|and your ?self)\b\??/

export function evaluateReciprocalQuestion(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'And you?'
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep4RetryPromptEmpty' }
  if (RECIPROCAL_Q.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = !/^and you$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep4PraiseIndependent' : 'ep4PraiseBounce'
    return r
  }
  return { ...r, errorType: 'no_question', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep4RetryExplainBounce', explanation: 'ep4RetryExplainBounce', retryRequired: true, retryPrompt: 'ep4RetryPromptBounce' }
}

/* ---- Episode 5: ask where someone is from ---- */
const ASK_ORIGIN = /\b((and )?where are you from|what country are you from|where do you come from|where are you from)\b/
const ORIGIN_NO_AUX = /\bwhere (you|u) from\b/

export function evaluateAskOrigin(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'Where are you from?'
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep5RetryPromptEmpty' }
  if (ASK_ORIGIN.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = !/^where are you from$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep5PraiseIndependent' : 'ep5PraiseAsked'
    return r
  }
  if (ORIGIN_NO_AUX.test(n)) {
    // "Where you from?" — intent recognised, only the auxiliary is missing
    return { ...r, errorType: 'missing_auxiliary', priorityCorrection: 'ep5RetryExplainAux', explanation: 'ep5RetryExplainAux', retryRequired: true, retryPrompt: 'ep5RetryPromptAux' }
  }
  return { ...r, errorType: 'no_question', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep5RetryExplainAsk', explanation: 'ep5RetryExplainAsk', retryRequired: true, retryPrompt: 'ep5RetryPromptAsk' }
}

/* ---- Episode 5: say where you are from ----
 * The place is never judged geographically: any country, city or region the
 * learner names is accepted. Only the English structure is taught.
 */
const FROM_PLACE = /\bfrom\s+\p{L}[\p{L}\s'.-]*/u
// Leading words to peel off an incomplete answer ("I'm Lima" / "From Lima").
const ORIGIN_LEAD = /^\s*(i\s*'?\s*m|i\s+am|i)?\s*(from)?\s*/i

/*
 * The place the learner just named, taken from THEIR OWN words so the model
 * answer echoes what they said ("Colombia." -> "I'm from Colombia.") instead of
 * a previously stored place, which would read as a correction of their answer.
 * Returns '' when nothing place-like is left.
 */
// A reply that ASKS something is not naming a place, however short it is.
const LOOKS_LIKE_QUESTION = /^(where|what|who|when|why|how|which|do|does|are|is|can)\b/i

export function placeFromAnswer(text) {
  const raw = String(text || '').trim().replace(/[.!?¡¿,;:]+$/u, '')
  if (!raw) return ''
  /*
   * Someone answering "where are you from?" with another question has not
   * given us a place. Treating their words as one produced model answers like
   * "I'm from Where you from." — nonsense offered as the correct version.
   */
  if (String(text).includes('?') || LOOKS_LIKE_QUESTION.test(raw)) return ''
  const rest = raw.replace(ORIGIN_LEAD, '').trim()
  if (!rest || !/\p{L}/u.test(rest)) return ''
  // keep it to a short place-like phrase, never a whole sentence
  return rest.split(/\s+/).length <= 4 ? rest : ''
}

export function evaluateAnswerOrigin(text, { independent = false, place = '' } = {}) {
  const n = normalize(text)
  // Prefer the place the learner just named; fall back to the one they gave
  // earlier in the episode, and only then to a neutral example.
  const named = placeFromAnswer(text)
  const natural = `I'm from ${named || String(place || '').trim() || 'Colombia'}.`
  const r = base(independent)
  r.naturalVersion = natural
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep5RetryPromptEmpty' }
  const copula = /\b(i'?m|i am)\b/.test(n)
  const fromPlace = FROM_PLACE.test(n)
  if (copula && fromPlace) {
    r.completedObjective = true
    r.confidence = 0.96
    r.acceptedVariant = !/^i'?m from /.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep5PraiseIndependent' : 'ep5PraiseAnswered'
    return r
  }
  if (fromPlace && !copula) {
    return { ...r, errorType: 'missing_copula', priorityCorrection: 'ep5RetryExplainIm', explanation: 'ep5RetryExplainIm', retryRequired: true, retryPrompt: 'ep5RetryPromptIm' }
  }
  // A bare place name is understood but incomplete: partial evidence, ask for
  // the full structure rather than calling it wrong.
  if (/\p{L}/u.test(n) && wordCount(n) <= 3) {
    return { ...r, errorType: 'missing_from', priorityCorrection: 'ep5RetryExplainFrom', explanation: 'ep5RetryExplainFrom', retryRequired: true, retryPrompt: 'ep5RetryPromptFrom' }
  }
  return { ...r, errorType: 'no_answer', conclusive: false, confidence: 0.5, priorityCorrection: 'ep5RetryExplainFrom', explanation: 'ep5RetryExplainFrom', retryRequired: true, retryPrompt: 'ep5RetryPromptFrom' }
}

/* ---- Episode 6: a combined opening turn (greet + introduce, plus one more) ---- */
export function evaluateFullIntroConversation(text, { name = 'Alex', independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = `Hi, I'm ${String(name).trim() || 'Alex'}. How are you?`
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep6RetryPromptEmpty' }
  const intro = evaluateIntroduction(text, { name, independent })
  const extra = ASK_WELLBEING.test(n) || ASK_ORIGIN.test(n) || ASK_NAME.test(n) || NICE.test(n)
  if (intro.completedObjective && extra) {
    r.completedObjective = true
    r.confidence = 0.94
    r.acceptedVariant = true
    r.praiseKey = r.masteryEvidence.independent ? 'ep6PraiseIndependent' : 'ep6PraiseCombined'
    return r
  }
  if (intro.completedObjective) {
    // introduced correctly but did not carry the conversation forward
    return { ...r, errorType: 'incomplete_turn', priorityCorrection: 'ep6RetryExplainMore', explanation: 'ep6RetryExplainMore', retryRequired: true, retryPrompt: 'ep6RetryPromptMore' }
  }
  return { ...r, errorType: intro.errorType, conclusive: intro.conclusive, confidence: intro.confidence, priorityCorrection: intro.priorityCorrection, explanation: intro.explanation, retryRequired: true, retryPrompt: intro.retryPrompt }
}

/* ============================================================================
 * Third Pre-A1 arc — preferences, wants and needs.
 *
 * A preference is never "wrong": these evaluators only ever teach the English
 * structure. Liking or wanting something different from the example is accepted
 * as-is, and a bare noun counts as understood-but-incomplete, never as a
 * failure.
 * ==========================================================================*/
const LIKE = /\b(i (really |kind of |sort of )?like|i love|i enjoy)\b/
const DISLIKE = /\b(i (really )?(don'?t|do not) (really )?like|i dislike|i hate)\b/
const ASK_PREF = /\b((and )?what (kind of |type of )?\w*\s?do you like|what do you like|do you like\b|how about you)\b/
const ASK_PREF_NO_AUX = /\b(what you like|you like\b)/
const WANT = /\b(i want|i'?d like|i would like|can i (have|get))\b/
const NEED = /\b(i need|i really need)\b/
const ASK_WANT = /\b(do you want|would you like|do you need)\b/
const ACCEPT = /\b(yes,? please|yes,? thank you|yes,? thanks|sure|ok(ay)?,? (please|thanks)|sounds good|i'?d love to|let'?s do it)\b/
const DECLINE = /\b(no,? thank you|no,? thanks|not now|maybe later|i'?m ok(ay)?)\b/
const YES_DO = /\b(yes,? i do|yes|yeah|yep)\b/
const NO_DONT = /\b(no,? i (don'?t|do not)|no|nope)\b/
// a noun-ish remainder means the learner did name something
const hasObject = (n) => /\p{L}/u.test(n.replace(/\b(i|like|want|need|don'?t|do|not|really|the|a|an|please|thank|you|yes|no)\b/g, '').trim())

/* ---- Fourth arc: the cafe ----
 *
 * The polite request is a QUESTION form ("Can I have ...?"), which is why it
 * gets its own object test: `hasObject` would see the words "can" and "have"
 * and happily report an object in "Can I have, please?".
 */
const REQUEST_FORM = /\b(can i have|can i get|could i have|could i get|may i have|may i get|i'?d like|i would like)\b/
const REQUEST_FORM_G = /\b(can i have|can i get|could i have|could i get|may i have|may i get|i'?d like|i would like)\b/g
const PLEASE = /\bplease\b/
const THANKS = /\b(thank you|thanks|thank u|thank you very much|thanks a lot|many thanks)\b/
const FINISH = /\b(that'?s all|that is all|that'?s it|nothing else|no more|that'?ll be all|that will be all)\b/
const BARE_YES = /^(yes|yeah|yep|yup|ok|okay|sure)$/
const BARE_NO = /^(no|nope|nah)$/

// What is left once the request frame and its politeness are removed.
const requestedThing = (n) => n
  .replace(REQUEST_FORM_G, ' ')
  .replace(/\b(please|thanks|thank you|thank|you|some|a|an|the|of|and|for|me)\b/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
const namesAThing = (n) => /\p{L}/u.test(requestedThing(n))

/*
 * Which way a cafe decision went. Shared with the episode shell so a branch is
 * decided by the same reading of the answer that evaluates it — "That's all,
 * thanks." is a refusal even though it never says "no".
 */
/* ---- Fifth arc: staying in the conversation ----
 *
 * Repair is ONE communicative function with three ways of doing it, not three
 * intents. "I don't understand.", "Can you repeat, please?" and "Please speak
 * slowly." all do the same job — they keep an exchange alive — and a learner
 * who has one of them has the strategy. The step names which one it is asking
 * for (`repairKind`); the evaluator accepts any repair as understood and holds
 * the requested one to its own target.
 *
 * The alternative was five intents for five sentences, which is how a flat
 * list of intents becomes three hundred.
 */
/*
 * A1 arc 2 adds a fourth, and it is the blueprint's own instruction rather than a
 * choice: `ask_what_something_means` declares `intentReuse: "repair_request with a
 * new repairKind subtype"`. It is the first repair that LEARNS rather than pauses
 * — Pre-A1 can stop a conversation it does not follow, and this takes one word out
 * of it and keeps going.
 */
/*
 * A1 arc 6 adds a fifth, per `ask_how_to_say_something`'s own `intentReuse`:
 * "repair_request with a new repairKind subtype" — the same shape arc 2's
 * `ask_meaning` already established. Reference implementation and the exact
 * ask are in `levels/a1/evaluators.js`'s `evaluateAskHowToSay`.
 */
/*
 * A2 arc 5 adds a sixth, per `spell_a_name_for_a_booking`'s reuse note
 * (`intentStrategy.newSubtypesOnExistingIntents`): "repair_request gains
 * repairKind: 'ask_to_spell'" — the learner asking the OTHER speaker to spell
 * something unclear (a confirmation code), the mirror image of `spell_word`
 * where the learner spells their own name.
 */
/*
 * C1 adds a seventh, per `clarify_an_ambiguous_instruction_precisely`'s own
 * `intentReuse` field (`c1Intents.js`): "repair_request with a new
 * repairKind subtype: ask_for_precision" — the same convention every repair
 * kind above already establishes. Unlike the six kinds above, C1's authored
 * content dispatches this directly as `evalKind: 'clarify_ambiguity'`
 * (matching `c1.json#/evaluationIntents`'s own literal id, per
 * `c1Capabilities.js`'s own comment on `C1_CAN_DO_INTENT`), so `evaluateFree`
 * routes that case here with `repairKind` forced to `ask_for_precision`
 * rather than reading it off the step.
 */
export const REPAIR_KINDS = ['signal_nonunderstanding', 'repeat', 'slow_down', 'ask_meaning', 'ask_how_to_say', 'ask_to_spell', 'ask_for_precision']

const NOT_UNDERSTAND = /\b(i (really )?(don'?t|do not) understand|i (don'?t|do not) get (it|that)|i'?m (not sure|lost)|i didn'?t (understand|catch|get) (that|it))\b/
const NOT_UNDERSTAND_LOOSE = /\b((don'?t|do not|not) understand|no understand|understand not)\b/
const ASK_REPEAT = /\b((can|could|would) you (please )?(repeat|say (that|it) again)|please repeat|repeat that|say (that|it) again)\b/
const ASK_REPEAT_LOOSE = /\b(repeat|again)\b/
/*
 * The adverb is the target. "Speak slow." and "Slow, please." communicate
 * perfectly and are not the sentence this arc teaches, so they land as
 * incomplete with the natural form offered — the same treatment "Water,
 * please." gets in the cafe.
 */
const ASK_SLOW = /\b((can|could) you (please )?speak (more )?slowly|please speak (more )?slowly|speak (more )?slowly|slowly,? please)\b/
const ASK_SLOW_LOOSE = /\b(slow(ly)?|slow down)\b/
/*
 * "What does ___ mean?" — the arc-2 pattern. The word may be quoted or bare, and
 * "What is ___?" is the same question asked another way, so it is understood as a
 * variant rather than refused. `ASK_MEANING_LOOSE` catches the reach: a learner who
 * writes "mean?" or "meaning?" has signalled the right kind of trouble.
 */
const ASK_MEANING = /\bwhat\s+(does|do)\s+.{1,30}?\s*mean\b/
/*
 * "What is late?" — the same question, asked another way. ONE word after the verb,
 * because that is what makes it a question about a word: "What is your name?" has
 * two and is a different intent entirely, and `normalize` has already removed the
 * question mark, so the shape has to carry the meaning on its own.
 */
const ASK_MEANING_VARIANT = /\b(what\s+(is|are)|what'?s)\s+[\p{L}'’]+\s*$/u
const ASK_MEANING_LOOSE = /\b(mean|means|meaning)\b/
/*
 * "How do you say ___?" — arc 6's pattern, requiring a complement after "say"
 * so a bare "how do you say" falls through to the loose check. Kept identical
 * to `levels/a1/evaluators.js`'s own `ASK_HOW_TO_SAY_RE`/`_LOOSE_RE` (that
 * file's reference for this branch) — keep the two in sync at any future edit.
 */
const ASK_HOW_TO_SAY = /\bhow\s+do\s+(you|i)\s+say\s+\S+/
const ASK_HOW_TO_SAY_LOOSE = /\bhow\s+(do\s+you\s+)?(say|spell)\b/
/*
 * "Can you spell that, please?" — A2 arc 5's sixth repair kind. Requires
 * "that"/"it"/"this" as the object, so it stays distinct from `ask_how_to_say`
 * ("How do you spell that?" is ALSO caught by `ASK_HOW_TO_SAY_LOOSE`'s bare
 * "spell" match above, which is why this check runs first in the dispatcher).
 */
const ASK_TO_SPELL = /\b((can|could) you (please )?spell (that|it|this)|please spell (that|it|this)|spell (that|it|this),? please)\b/
const ASK_TO_SPELL_LOOSE = /\bspell\b/
/*
 * C1's seventh repair kind — a TARGETED follow-up that resolves genuine
 * ambiguity, not a generic "I don't understand". "When you say X, do you
 * mean...?" and "Could you be more specific about...?" both name the
 * specific thing that is unclear, which is what distinguishes this from a
 * bare `signal_nonunderstanding`/"What?" (c1Intents.js's own `nearMiss`
 * note: "a generic repair request that does not target the specific
 * ambiguity").
 */
const ASK_FOR_PRECISION = /\b(when you say\b[\s\S]{0,40}\bdo you mean\b|could you be more specific about|just to make sure i understood|to make sure i (got|understood) that right)\b/
const ASK_FOR_PRECISION_LOOSE = /\b(more specific|do you mean|make sure i understood)\b/
/* "I don't know" answers a question; it does not report a breakdown. */
const DONT_KNOW = /\b(i (don'?t|do not) know|no idea|dunno)\b/
const BARE_CONFUSION = /^(what|sorry|huh|eh|again|pardon|excuse me)[?!.]*$/
const SORRY = /\b(sorry|excuse me|pardon)\b/

const CLOSE = /\b(good ?bye|bye bye|bye|see you( later| soon| tomorrow)?|see ya|catch you later|take care)\b/
const THANKS_ONLY = /^(thank you|thanks|thank you very much|thanks a lot)[.!]*$/

/* Any of the three counts as "the learner tried to repair". */
export const isRepairAttempt = (text) => {
  const n = normalize(text)
  return NOT_UNDERSTAND.test(n) || ASK_REPEAT.test(n) || ASK_SLOW.test(n)
}

export const isDeclineReply = (text) => {
  const n = normalize(text)
  return DECLINE.test(n) || FINISH.test(n) || BARE_NO.test(n)
}


export function evaluateExpressLike(text, { independent = false, targetNoun = 'music' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = `I like ${targetNoun}.`
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep7RetryPromptEmpty' }
  if (DISLIKE.test(n)) {
    // saying they do NOT like it is a perfectly good sentence for this step
    r.completedObjective = true; r.confidence = 0.93; r.acceptedVariant = true
    r.praiseKey = r.masteryEvidence.independent ? 'ep7PraiseIndependent' : 'ep7PraiseLiked'
    return r
  }
  if (LIKE.test(n) && hasObject(n)) {
    r.completedObjective = true
    r.confidence = 0.96
    r.acceptedVariant = !/^i like /.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep7PraiseIndependent' : 'ep7PraiseLiked'
    return r
  }
  if (LIKE.test(n)) {
    return { ...r, errorType: 'missing_object', priorityCorrection: 'ep7RetryExplainObject', explanation: 'ep7RetryExplainObject', retryRequired: true, retryPrompt: 'ep7RetryPromptObject' }
  }
  // "Music." / "I music." — understood, structure missing
  if (hasObject(n) && wordCount(n) <= 3) {
    return { ...r, errorType: 'missing_verb', priorityCorrection: 'ep7RetryExplainLike', explanation: 'ep7RetryExplainLike', retryRequired: true, retryPrompt: 'ep7RetryPromptLike' }
  }
  return { ...r, errorType: 'no_preference', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep7RetryExplainLike', explanation: 'ep7RetryExplainLike', retryRequired: true, retryPrompt: 'ep7RetryPromptLike' }
}

export function evaluateExpressDislike(text, { independent = false, targetThing = 'coffee' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = `I don't like ${targetThing}.`
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep7RetryPromptEmpty' }
  if (DISLIKE.test(n) && hasObject(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = !/^i don'?t like /.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep7PraiseIndependent' : 'ep7PraiseDisliked'
    return r
  }
  if (LIKE.test(n)) {
    // they said the positive instead — guide, do not judge the preference
    return { ...r, errorType: 'missing_negation', priorityCorrection: 'ep7RetryExplainDont', explanation: 'ep7RetryExplainDont', retryRequired: true, retryPrompt: 'ep7RetryPromptDont' }
  }
  return { ...r, errorType: 'missing_negation', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep7RetryExplainDont', explanation: 'ep7RetryExplainDont', retryRequired: true, retryPrompt: 'ep7RetryPromptDont' }
}

export function evaluateAskPreference(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'What do you like?'
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep7RetryPromptEmpty' }
  if (ASK_PREF.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = !/^what do you like$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep7PraiseIndependent' : 'ep7PraiseAsked'
    return r
  }
  if (ASK_PREF_NO_AUX.test(n)) {
    // "What you like?" / "You like music?" — intent clear, auxiliary missing
    return { ...r, errorType: 'missing_auxiliary', priorityCorrection: 'ep7RetryExplainDo', explanation: 'ep7RetryExplainDo', retryRequired: true, retryPrompt: 'ep7RetryPromptDo' }
  }
  return { ...r, errorType: 'no_question', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep7RetryExplainDo', explanation: 'ep7RetryExplainDo', retryRequired: true, retryPrompt: 'ep7RetryPromptDo' }
}

export function evaluateYesNoPreference(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'Yes, I do.'
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep7RetryPromptEmpty' }
  if (NO_DONT.test(n) || YES_DO.test(n)) {
    r.completedObjective = true
    r.confidence = 0.94
    r.acceptedVariant = !/^(yes,? i do|no,? i don'?t)$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep7PraiseIndependent' : 'ep7PraiseShortAnswer'
    return r
  }
  return { ...r, errorType: 'no_answer', conclusive: wordCount(n) < 4, confidence: 0.8, priorityCorrection: 'ep7RetryExplainShort', explanation: 'ep7RetryExplainShort', retryRequired: true, retryPrompt: 'ep7RetryPromptShort' }
}

export function evaluateExpressWant(text, { independent = false, targetThing = 'water' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = `I want ${targetThing}.`
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep8RetryPromptEmpty' }
  if ((WANT.test(n) || NEED.test(n)) && hasObject(n)) {
    // want vs need is not a serious error when the request is understood
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = !/^i want /.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep8PraiseIndependent' : 'ep8PraiseAsked'
    return r
  }
  // "Water, please." — polite and understood, but not the structure being taught
  if (/please/.test(n) && hasObject(n)) {
    return { ...r, errorType: 'missing_verb', priorityCorrection: 'ep8RetryExplainWant', explanation: 'ep8RetryExplainWant', retryRequired: true, retryPrompt: 'ep8RetryPromptWant' }
  }
  if (hasObject(n) && wordCount(n) <= 3) {
    return { ...r, errorType: 'missing_verb', priorityCorrection: 'ep8RetryExplainWant', explanation: 'ep8RetryExplainWant', retryRequired: true, retryPrompt: 'ep8RetryPromptWant' }
  }
  return { ...r, errorType: 'no_request', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep8RetryExplainWant', explanation: 'ep8RetryExplainWant', retryRequired: true, retryPrompt: 'ep8RetryPromptWant' }
}

export function evaluateExpressNeed(text, { independent = false, targetThing = 'help' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = `I need ${targetThing}.`
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep8RetryPromptEmpty' }
  if ((NEED.test(n) || WANT.test(n)) && hasObject(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = !/^i need /.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep8PraiseIndependent' : 'ep8PraiseNeeded'
    return r
  }
  if (hasObject(n) && wordCount(n) <= 3) {
    return { ...r, errorType: 'missing_verb', priorityCorrection: 'ep8RetryExplainNeed', explanation: 'ep8RetryExplainNeed', retryRequired: true, retryPrompt: 'ep8RetryPromptNeed' }
  }
  return { ...r, errorType: 'no_request', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep8RetryExplainNeed', explanation: 'ep8RetryExplainNeed', retryRequired: true, retryPrompt: 'ep8RetryPromptNeed' }
}

export function evaluateAskWant(text, { independent = false, targetThing = 'water' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = `Do you want ${targetThing}?`
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep8RetryPromptEmpty' }
  if (ASK_WANT.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = !/^do you want /.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep8PraiseIndependent' : 'ep8PraiseOffered'
    return r
  }
  if (/\byou want\b/.test(n)) {
    return { ...r, errorType: 'missing_auxiliary', priorityCorrection: 'ep8RetryExplainDo', explanation: 'ep8RetryExplainDo', retryRequired: true, retryPrompt: 'ep8RetryPromptDo' }
  }
  return { ...r, errorType: 'no_question', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep8RetryExplainDo', explanation: 'ep8RetryExplainDo', retryRequired: true, retryPrompt: 'ep8RetryPromptDo' }
}

export function evaluateAcceptOffer(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'Yes, please.'
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep8RetryPromptEmpty' }
  if (ACCEPT.test(n) || DECLINE.test(n)) {
    // accepting or declining are both valid replies to an offer
    r.completedObjective = true
    r.confidence = 0.94
    r.acceptedVariant = !/^yes,? please$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep8PraiseIndependent' : 'ep8PraiseAnswered'
    return r
  }
  return { ...r, errorType: 'no_answer', conclusive: wordCount(n) < 4, confidence: 0.8, priorityCorrection: 'ep8RetryExplainPolite', explanation: 'ep8RetryExplainPolite', retryRequired: true, retryPrompt: 'ep8RetryPromptPolite' }
}

export function evaluateDeclineOffer(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'No, thank you.'
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep8RetryPromptEmpty' }
  if (DECLINE.test(n) || ACCEPT.test(n)) {
    r.completedObjective = true
    r.confidence = 0.94
    r.acceptedVariant = !/^no,? thank you$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep8PraiseIndependent' : 'ep8PraiseAnswered'
    return r
  }
  return { ...r, errorType: 'no_answer', conclusive: wordCount(n) < 4, confidence: 0.8, priorityCorrection: 'ep8RetryExplainPolite', explanation: 'ep8RetryExplainPolite', retryRequired: true, retryPrompt: 'ep8RetryPromptPolite' }
}

/* Episode 9: a turn that both states a preference and moves the plan forward. */
export function evaluateSimplePlanConversation(text, { independent = false, targetNoun = 'music', activity = 'listen to music' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  // The model answer proposes what THIS episode is about — offering "listen to
  // music" to someone whose episode is about trips is not a model, it is noise.
  r.naturalVersion = `I like ${targetNoun}. Do you want to ${activity}?`
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep9RetryPromptEmpty' }
  const states = LIKE.test(n) || DISLIKE.test(n) || WANT.test(n) || NEED.test(n)
  const carries = ASK_PREF.test(n) || ASK_WANT.test(n) || ACCEPT.test(n) || DECLINE.test(n)
  if (states && carries) {
    r.completedObjective = true
    r.confidence = 0.93
    r.acceptedVariant = true
    r.praiseKey = r.masteryEvidence.independent ? 'ep9PraiseIndependent' : 'ep9PraiseCombined'
    return r
  }
  if (states) {
    return { ...r, errorType: 'incomplete_turn', priorityCorrection: 'ep9RetryExplainMore', explanation: 'ep9RetryExplainMore', retryRequired: true, retryPrompt: 'ep9RetryPromptMore' }
  }
  return { ...r, errorType: 'no_preference', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep9RetryExplainStart', explanation: 'ep9RetryExplainStart', retryRequired: true, retryPrompt: 'ep9RetryPromptStart' }
}


/* ---- Episode 10: ask for something politely ---- */
export function evaluatePoliteRequest(text, { independent = false, targetThing = 'water' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = `Can I have ${targetThing}, please?`
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep10RetryPromptEmpty' }
  if (REQUEST_FORM.test(n) && namesAThing(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    // The frame is what is being taught; "please" is warmth on top of it, and
    // withholding success for a missing "please" would teach fear, not English.
    r.acceptedVariant = !PLEASE.test(n) || !/^can i have /.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep10PraiseIndependent' : 'ep10PraiseAsked'
    return r
  }
  // The frame is there but nothing was named — "Can I have, please?".
  if (REQUEST_FORM.test(n)) {
    return { ...r, errorType: 'missing_request_object', priorityCorrection: 'ep10RetryExplainThing', explanation: 'ep10RetryExplainThing', retryRequired: true, retryPrompt: 'ep10RetryPromptThing' }
  }
  // "Water, please." — perfectly polite, perfectly understood, and not yet the
  // structure this episode exists to teach.
  if (PLEASE.test(n) && namesAThing(n)) {
    return { ...r, errorType: 'missing_request_form', priorityCorrection: 'ep10RetryExplainForm', explanation: 'ep10RetryExplainForm', retryRequired: true, retryPrompt: 'ep10RetryPromptForm' }
  }
  // "I want water." — the previous episode's structure. Understood, and blunt
  // in a cafe; the correction is about register, never about being wrong.
  if ((WANT.test(n) || NEED.test(n)) && hasObject(n)) {
    return { ...r, errorType: 'previous_structure', priorityCorrection: 'ep10RetryExplainPolite', explanation: 'ep10RetryExplainPolite', retryRequired: true, retryPrompt: 'ep10RetryPromptForm' }
  }
  if (namesAThing(n) && wordCount(n) <= 3) {
    return { ...r, errorType: 'missing_request_form', priorityCorrection: 'ep10RetryExplainForm', explanation: 'ep10RetryExplainForm', retryRequired: true, retryPrompt: 'ep10RetryPromptForm' }
  }
  return { ...r, errorType: 'no_request', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep10RetryExplainForm', explanation: 'ep10RetryExplainForm', retryRequired: true, retryPrompt: 'ep10RetryPromptForm' }
}

/* ---- Episode 10 & 12: thank whoever served you ---- */
export function evaluateThankService(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'Thank you.'
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep10RetryPromptEmpty' }
  if (THANKS.test(n)) {
    r.completedObjective = true
    r.confidence = 0.96
    r.acceptedVariant = !/^thank you$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep10PraiseIndependent' : 'ep10PraiseThanked'
    return r
  }
  return { ...r, errorType: 'no_thanks', conclusive: wordCount(n) < 4, confidence: 0.85, priorityCorrection: 'ep10RetryExplainThanks', explanation: 'ep10RetryExplainThanks', retryRequired: true, retryPrompt: 'ep10RetryPromptThanks' }
}

/* ---- Episode 11: answer "Anything else?" ---- */
export function evaluateRespondAnythingElse(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'No, thank you.'
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep11RetryPromptEmpty' }
  // Wanting more and wanting nothing more are equally correct answers.
  if (ACCEPT.test(n) || DECLINE.test(n) || FINISH.test(n) || (REQUEST_FORM.test(n) && namesAThing(n))) {
    r.completedObjective = true
    r.confidence = 0.94
    r.acceptedVariant = !/^no,? thank you$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep11PraiseIndependent' : 'ep11PraiseAnswered'
    return r
  }
  /*
   * A bare "Yes." or "No." IS understood — it answers the question — but in a
   * cafe it lands as abrupt, and the episode is about the polite pair. So it is
   * received as an answer and sent back for the missing half, never treated as
   * a failure to understand.
   */
  if (BARE_YES.test(n) || BARE_NO.test(n)) {
    return { ...r, errorType: 'incomplete_politeness', confidence: 0.9, priorityCorrection: 'ep11RetryExplainPolite', explanation: 'ep11RetryExplainPolite', retryRequired: true, retryPrompt: 'ep11RetryPromptPolite' }
  }
  return { ...r, errorType: 'no_answer', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep11RetryExplainAnswer', explanation: 'ep11RetryExplainAnswer', retryRequired: true, retryPrompt: 'ep11RetryPromptPolite' }
}

/* ---- Episode 11 & 12: close the order ---- */
export function evaluateFinishOrder(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'That’s all, thanks.'
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep11RetryPromptEmpty' }
  if (FINISH.test(n) || DECLINE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.94
    r.acceptedVariant = !/^that'?s all,? thanks$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep11PraiseIndependent' : 'ep11PraiseClosed'
    return r
  }
  if (BARE_NO.test(n)) {
    return { ...r, errorType: 'incomplete_politeness', confidence: 0.9, priorityCorrection: 'ep11RetryExplainClose', explanation: 'ep11RetryExplainClose', retryRequired: true, retryPrompt: 'ep11RetryPromptClose' }
  }
  return { ...r, errorType: 'no_close', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep11RetryExplainClose', explanation: 'ep11RetryExplainClose', retryRequired: true, retryPrompt: 'ep11RetryPromptClose' }
}

/* ---- Episode 12: the whole order in one turn ---- */
export function evaluateCafeOrderConversation(text, { independent = false, targetThing = 'water' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = `Can I have ${targetThing}, please? That’s all, thanks.`
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep12RetryPromptEmpty' }
  const asks = REQUEST_FORM.test(n) && namesAThing(n)
  const closes = THANKS.test(n) || FINISH.test(n) || PLEASE.test(n)
  if (asks && closes) {
    r.completedObjective = true
    r.confidence = 0.93
    r.acceptedVariant = true
    r.praiseKey = r.masteryEvidence.independent ? 'ep12PraiseIndependent' : 'ep12PraiseOrdered'
    return r
  }
  if (asks) {
    return { ...r, errorType: 'incomplete_turn', priorityCorrection: 'ep12RetryExplainMore', explanation: 'ep12RetryExplainMore', retryRequired: true, retryPrompt: 'ep12RetryPromptMore' }
  }
  return { ...r, errorType: 'no_order', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep12RetryExplainStart', explanation: 'ep12RetryExplainStart', retryRequired: true, retryPrompt: 'ep12RetryPromptStart' }
}


/* ---- Episodes 13-15: keep the conversation alive ----
 *
 * One evaluator, three targets. `repairKind` says which one this turn asked
 * for; a learner who repairs a different way is understood and told what the
 * turn was practising, never marked wrong for communicating.
 */
export function evaluateRepairRequest(text, { independent = false, repairKind = 'signal_nonunderstanding', meaningWord = '' } = {}) {
  const n = normalize(text)
  const kind = REPAIR_KINDS.includes(repairKind) ? repairKind : 'signal_nonunderstanding'
  const r = base(independent)
  const word = String(meaningWord || '').trim() || 'that'
  const TARGET = {
    signal_nonunderstanding: 'I don’t understand.',
    repeat: 'Can you repeat, please?',
    slow_down: 'Please speak slowly.',
    ask_meaning: `What does “${word}” mean?`,
    ask_how_to_say: 'How do you say that in English?',
    ask_to_spell: 'Can you spell that, please?',
    ask_for_precision: 'Could you be more specific about that?',
  }
  r.naturalVersion = TARGET[kind]
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep13RetryPromptEmpty' }

  const signalled = NOT_UNDERSTAND.test(n)
  const askedRepeat = ASK_REPEAT.test(n)
  const askedSlow = ASK_SLOW.test(n)
  const askedMeaning = ASK_MEANING.test(n) || ASK_MEANING_VARIANT.test(n)
  const askedHowToSay = ASK_HOW_TO_SAY.test(n)
  const askedToSpell = ASK_TO_SPELL.test(n)
  const askedForPrecision = ASK_FOR_PRECISION.test(n)

  /* the requested strategy, done properly */
  const done = kind === 'signal_nonunderstanding' ? signalled
    : kind === 'repeat' ? askedRepeat
      : kind === 'slow_down' ? askedSlow
        : kind === 'ask_meaning' ? askedMeaning
          : kind === 'ask_how_to_say' ? askedHowToSay
            : kind === 'ask_to_spell' ? askedToSpell
              : askedForPrecision
  if (done) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = normalize(TARGET[kind]) !== n
    r.praiseKey = r.masteryEvidence.independent ? 'ep13PraiseIndependent' : 'ep13PraiseRepaired'
    return r
  }

  /*
   * A reach for the meaning question that did not get there — "mean?", "early
   * meaning?". The learner has the right idea and needs the frame, so this is its
   * own correction rather than the generic "that is not a repair".
   */
  if (kind === 'ask_meaning' && ASK_MEANING_LOOSE.test(n)) {
    return { ...r, errorType: 'incomplete_meaning_question', confidence: 0.85, priorityCorrection: 'ep23RetryExplainMeaning', explanation: 'ep23RetryExplainMeaning', retryRequired: true, retryPrompt: 'ep23RetryPromptMeaning' }
  }

  /*
   * A reach for "How do you say...?" that never named what — "how do you say?",
   * "how do you spell?". Mirrors `ask_meaning`'s own loose check above and
   * `levels/a1/evaluators.js`'s `evaluateAskHowToSay` reference exactly.
   */
  if (kind === 'ask_how_to_say' && ASK_HOW_TO_SAY_LOOSE.test(n)) {
    return { ...r, errorType: 'incomplete_how_to_say', confidence: 0.7,
      priorityCorrection: 'ep35RetryExplainHowToSay', explanation: 'ep35RetryExplainHowToSay', retryRequired: true }
  }

  /*
   * A reach for "Can you spell that, please?" that never got there — "spell?",
   * "can you spell". Mirrors `ask_meaning`/`ask_how_to_say`'s own loose checks.
   */
  if (kind === 'ask_to_spell' && ASK_TO_SPELL_LOOSE.test(n)) {
    return { ...r, errorType: 'incomplete_ask_to_spell', confidence: 0.7,
      priorityCorrection: 'ep54RetryExplainAskToSpell', explanation: 'ep54RetryExplainAskToSpell', retryRequired: true }
  }

  /*
   * A reach for a targeted clarifying question that never named what — "more
   * specific?", "what do you mean?" with nothing pinned down. Mirrors the
   * three loose checks above.
   */
  if (kind === 'ask_for_precision' && ASK_FOR_PRECISION_LOOSE.test(n)) {
    return { ...r, errorType: 'incomplete_precision_question', confidence: 0.7,
      priorityCorrection: 'c1RetryExplainAskForPrecision', explanation: 'c1RetryExplainAskForPrecision', retryRequired: true }
  }

  /*
   * A different repair. The learner kept the conversation alive, which is the
   * whole skill — so this is understood and praised, and the turn simply says
   * what it was practising.
   */
  if (signalled || askedRepeat || askedSlow || askedMeaning || askedHowToSay || askedToSpell || askedForPrecision) {
    return { ...r, errorType: 'other_repair', confidence: 0.9, priorityCorrection: 'ep14RetryExplainOther', explanation: 'ep14RetryExplainOther', retryRequired: true, retryPrompt: `ep13RetryPrompt_${kind}` }
  }

  /*
   * "I don't know." is a real English sentence that means something else: it
   * answers a question instead of reporting that one was not understood. Worth
   * naming precisely rather than rejecting.
   */
  if (DONT_KNOW.test(n)) {
    return { ...r, errorType: 'means_dont_know', confidence: 0.92, priorityCorrection: 'ep13RetryExplainKnow', explanation: 'ep13RetryExplainKnow', retryRequired: true, retryPrompt: `ep13RetryPrompt_${kind}` }
  }

  /* the idea is there, the sentence is not: "Don't understand.", "Repeat please." */
  const loose = kind === 'signal_nonunderstanding' ? NOT_UNDERSTAND_LOOSE.test(n)
    : kind === 'repeat' ? ASK_REPEAT_LOOSE.test(n) : ASK_SLOW_LOOSE.test(n)
  if (loose) {
    return { ...r, errorType: 'incomplete_repair', confidence: 0.88, priorityCorrection: `ep13RetryExplain_${kind}`, explanation: `ep13RetryExplain_${kind}`, retryRequired: true, retryPrompt: `ep13RetryPrompt_${kind}` }
  }

  /*
   * "What?" and a bare "Sorry?" DO signal a breakdown, and a real speaker uses
   * them. They are understood — and they are not the polite full sentence this
   * arc exists to teach, so they do not complete the objective.
   */
  if (BARE_CONFUSION.test(n) || SORRY.test(n)) {
    return { ...r, errorType: 'too_short_repair', confidence: 0.9, priorityCorrection: `ep13RetryExplain_${kind}`, explanation: `ep13RetryExplain_${kind}`, retryRequired: true, retryPrompt: `ep13RetryPrompt_${kind}` }
  }

  return { ...r, errorType: 'no_repair', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: `ep13RetryExplain_${kind}`, explanation: `ep13RetryExplain_${kind}`, retryRequired: true, retryPrompt: `ep13RetryPrompt_${kind}` }
}

/* ---- Episode 15: end the encounter ---- */
export function evaluateCloseEncounter(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'Bye.'
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep15RetryPromptEmpty' }
  if (CLOSE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = !/^(bye|good ?bye)$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep15PraiseIndependent' : 'ep15PraiseClosed'
    return r
  }
  /*
   * Thanking someone is warm and it is not a goodbye. The learner is understood
   * and asked for the one thing this turn is about.
   */
  if (THANKS_ONLY.test(n) || THANKS.test(n)) {
    return { ...r, errorType: 'not_a_close', confidence: 0.9, priorityCorrection: 'ep15RetryExplainClose', explanation: 'ep15RetryExplainClose', retryRequired: true, retryPrompt: 'ep15RetryPromptClose' }
  }
  return { ...r, errorType: 'no_close_yet', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep15RetryExplainClose', explanation: 'ep15RetryExplainClose', retryRequired: true, retryPrompt: 'ep15RetryPromptClose' }
}


/* ===========================================================================
 * SIXTH ARC — things, and how many
 *
 * Asking and answering are two intents, not one with a subtype. Repair was one
 * function done three ways; this is two different jobs — the same distinction
 * the curriculum already makes between `ask_origin` and `answer_origin`.
 *
 * Quantity is one intent whose SHAPE depends on what the turn asked for, so it
 * carries `quantityForm` the way repair carries `repairKind`: a bare number is a
 * complete answer to "How many?" and is not a complete answer to "Ask for two
 * sandwiches."
 * ==========================================================================*/
export const QUANTITY_FORMS = ['bare', 'with_object', 'polite_request']

const ASK_WHAT = /\b(what'?s (this|that)|what is (this|that))\b/
/* "What's this called?" is a real question and is not what the arc teaches. */
const ASK_WHAT_WIDER = /\b((what'?s|what is) (this|that) called|what do you call (this|that)|what are (these|those))\b/
const ASK_WHAT_LOOSE = /\b(what|this|that)\b/
/* the two questions most easily confused with it, and they are not it */
const ASK_WHERE = /\b(where'?s|where is|where are)\b/
const ASK_WHO = /\b(who'?s|who is|who are)\b/

const IDENTIFY = /\b(it'?s (a|an)|it is (a|an)|this is (a|an)|that'?s (a|an)|that is (a|an))\s+\p{L}+/u
/* bare `it`/`this` too: "It book." is a reach for the frame, not silence */
const IDENTIFY_LOOSE = /\b(it'?s|it is|this is|that'?s|that is|it|this|that|a|an)\b/

/*
 * The arc TEACHES one to ten. It RECOGNISES further, because a learner who
 * answers "Eleven." has answered the question, and telling them they gave no
 * quantity would simply be false.
 */
const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100,
}
/* the ten this level owns: the first ten entries above, and only those */
export const TAUGHT_NUMBERS = Object.keys(NUMBER_WORDS).slice(0, 10)
const TENS_AND_UNIT = /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-]+(one|two|three|four|five|six|seven|eight|nine)\b/
const VAGUE_QUANTITY = /\b(many|a lot|lots|some|a few|several|much)\b/

/* The number a reply names, as a word or a digit, or null. */
export function numberIn(text) {
  const n = normalize(text)
  if (!n) return null
  /*
   * Compounds first: scanning the single words in order would find "one" inside
   * "twenty-one" and answer 1, which is worse than not understanding at all.
   */
  const compound = n.match(TENS_AND_UNIT)
  if (compound) return NUMBER_WORDS[compound[1]] + NUMBER_WORDS[compound[2]]
  for (const [word, value] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(n)) return value
  }
  const digits = n.match(/\b(\d{1,3})\b/)
  if (digits) return Number(digits[1])
  return null
}

export function evaluateAskWhatThing(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'What\u2019s this?'
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep16RetryPromptEmpty' }

  if (ASK_WHAT.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = !/^what'?s this$/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep16PraiseIndependent' : 'ep16PraiseAsked'
    return r
  }
  /*
   * A wider, perfectly good way of asking the same thing. Accepted — a learner
   * is never wrong for being correct — and flagged as a variant so the arc can
   * still show the sentence it teaches.
   */
  if (ASK_WHAT_WIDER.test(n)) {
    r.completedObjective = true
    r.confidence = 0.9
    r.acceptedVariant = true
    r.praiseKey = r.masteryEvidence.independent ? 'ep16PraiseIndependent' : 'ep16PraiseAsked'
    return r
  }
  /* asking a real question, about the wrong thing */
  if (ASK_WHERE.test(n) || ASK_WHO.test(n)) {
    return { ...r, errorType: 'wrong_question_word', confidence: 0.92, priorityCorrection: 'ep16RetryExplainWh', explanation: 'ep16RetryExplainWh', retryRequired: true, retryPrompt: 'ep16RetryPromptAsk' }
  }
  /* "What this?" / "This?" — the idea is there, the sentence is not */
  if (ASK_WHAT_LOOSE.test(n)) {
    return { ...r, errorType: 'incomplete_question', confidence: 0.88, priorityCorrection: 'ep16RetryExplainAsk', explanation: 'ep16RetryExplainAsk', retryRequired: true, retryPrompt: 'ep16RetryPromptAsk' }
  }
  return { ...r, errorType: 'no_question', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep16RetryExplainAsk', explanation: 'ep16RetryExplainAsk', retryRequired: true, retryPrompt: 'ep16RetryPromptAsk' }
}

export function evaluateIdentifyThing(text, { independent = false, targetThing = 'book' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  const thing = thingById(targetThing)
  const named = thing ? withArticle(thing.id) : 'a book'
  r.naturalVersion = `It\u2019s ${named}.`
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep16RetryPromptEmpty' }

  if (IDENTIFY.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = !n.startsWith('it\'s a') && !n.startsWith('its a')
    r.praiseKey = r.masteryEvidence.independent ? 'ep16PraiseIndependent' : 'ep16PraiseIdentified'
    return r
  }
  /*
   * A bare noun. It identifies the thing perfectly and it is not the sentence
   * being practised, so it is understood and does not complete the objective —
   * the same treatment "Water, please." gets in the caf\u00e9.
   */
  const bare = wordCount(n) <= 2 && /^(a |an )?\p{L}+$/u.test(n)
  if (bare) {
    return { ...r, errorType: 'bare_noun', confidence: 0.9, priorityCorrection: 'ep16RetryExplainSay', explanation: 'ep16RetryExplainSay', retryRequired: true, retryPrompt: 'ep16RetryPromptSay' }
  }
  /* "It book." / "Is a book." — half the frame */
  if (IDENTIFY_LOOSE.test(n)) {
    return { ...r, errorType: 'incomplete_identification', confidence: 0.88, priorityCorrection: 'ep16RetryExplainSay', explanation: 'ep16RetryExplainSay', retryRequired: true, retryPrompt: 'ep16RetryPromptSay' }
  }
  return { ...r, errorType: 'no_identification', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep16RetryExplainSay', explanation: 'ep16RetryExplainSay', retryRequired: true, retryPrompt: 'ep16RetryPromptSay' }
}

/*
 * One evaluator, three shapes.
 *
 *   bare            answering "How many?" — "Two." is the whole answer
 *   with_object     "Two books." — the number has to carry its noun
 *   polite_request  "Can I have two sandwiches, please?" — the caf\u00e9 frame,
 *                   now with a quantity in it
 */
export function evaluateUseQuantity(text, { independent = false, quantityForm = 'bare', targetThing = 'book', targetCount = 2 } = {}) {
  const form = QUANTITY_FORMS.includes(quantityForm) ? quantityForm : 'bare'
  const n = normalize(text)
  const r = base(independent)
  const thing = thingById(targetThing)
  const counted = thing ? countedThing(thing.id, targetCount) : ''
  const numberWord = TAUGHT_NUMBERS[Math.min(Math.max(1, Number(targetCount) || 2), 10) - 1] || 'two'
  const TARGET = {
    bare: `${numberWord[0].toUpperCase()}${numberWord.slice(1)}.`,
    with_object: `${numberWord[0].toUpperCase()}${numberWord.slice(1)} ${counted || 'books'}.`,
    polite_request: `Can I have ${numberWord} ${counted || 'books'}, please?`,
  }
  r.naturalVersion = TARGET[form]
  if (!n) return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep17RetryPromptEmpty' }
  /*
   * "two water" is not a sentence this level should ever be asked to produce.
   * A step that names an uncountable thing for a counted form is a content bug;
   * the check forbids it and this is the backstop that refuses to invent a
   * plural for it.
   */
  if (form !== 'bare' && thing && thing.countability !== 'count') {
    return { ...r, understood: false, conclusive: true, errorType: 'uncountable_target', confidence: 0.5, retryRequired: true, retryPrompt: 'ep17RetryPromptEmpty' }
  }

  const count = numberIn(n)
  /*
   * The form has to MATCH the number the learner actually said: "two book" is
   * not a sentence, and accepting it because the noun appears somewhere would
   * teach exactly the mistake the catalogue exists to prevent. The expected
   * word is looked up, never built by adding an "s".
   */
  const expected = thing && count !== null ? countedThing(thing.id, count) : ''
  const namesThing = thing ? new RegExp(`\\b(${thing.singular}|${thing.plural})\\b`).test(n) : /\b\p{L}{3,}\b/u.test(n)
  const namesCorrectForm = expected ? new RegExp(`\\b${expected}\\b`).test(n) : namesThing
  const asks = REQUEST_FORM.test(n)

  if (count === null) {
    /* "Many." / "A lot." communicate a quantity and are not a number */
    if (VAGUE_QUANTITY.test(n)) {
      return { ...r, errorType: 'not_a_number', confidence: 0.9, priorityCorrection: 'ep17RetryExplainNumber', explanation: 'ep17RetryExplainNumber', retryRequired: true, retryPrompt: `ep17RetryPrompt_${form}` }
    }
    return { ...r, errorType: 'no_quantity', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, priorityCorrection: 'ep17RetryExplainNumber', explanation: 'ep17RetryExplainNumber', retryRequired: true, retryPrompt: `ep17RetryPrompt_${form}` }
  }

  const done = form === 'bare' ? true
    : form === 'with_object' ? namesCorrectForm
      : asks && namesCorrectForm
  if (done) {
    r.completedObjective = true
    r.confidence = 0.94
    /*
     * A number outside one-to-ten is still a number and still answers the
     * question. The arc teaches ten of them; it does not own the rest.
     *
     * `targetEvidence` is how the two claims are kept apart: the turn succeeded
     * (completedObjective) and the taught language was not what carried it, so
     * nothing records practice of one-to-ten. Saying "Eleven." is not a mistake
     * and is not evidence of the curriculum item either.
     */
    r.targetEvidence = count >= 1 && count <= 10
    r.acceptedVariant = count > 10 || normalize(TARGET[form]) !== n
    r.praiseKey = r.masteryEvidence.independent ? 'ep17PraiseIndependent' : 'ep17PraiseCounted'
    return r
  }
  /* the noun is there in the wrong shape: "two book" */
  if (namesThing && !namesCorrectForm) {
    return { ...r, errorType: 'wrong_number_form', confidence: 0.9, priorityCorrection: 'ep17RetryExplainPlural', explanation: 'ep17RetryExplainPlural', retryRequired: true, retryPrompt: `ep17RetryPrompt_${form}` }
  }
  if (form === 'with_object') {
    return { ...r, errorType: 'missing_counted_noun', confidence: 0.88, priorityCorrection: 'ep17RetryExplainObject', explanation: 'ep17RetryExplainObject', retryRequired: true, retryPrompt: 'ep17RetryPrompt_with_object' }
  }
  return { ...r, errorType: 'missing_request_frame', confidence: 0.88, priorityCorrection: 'ep17RetryExplainRequest', explanation: 'ep17RetryExplainRequest', retryRequired: true, retryPrompt: 'ep17RetryPrompt_polite_request' }
}

/* ==========================================================================
 * A1 ARC 1 — what you do, and asking back.
 *
 * Two intents, both deterministic per the blueprint, and both about the same
 * frame from opposite sides: saying "I work / I study (+ where)" and asking
 * "Do you work?" / "What do you do?".
 *
 * What these deliberately do NOT do is check a profession. "I'm a nurse" is a
 * fine sentence and a vocabulary list is not a capability, so the objective is
 * the FRAME: a first-person verb the learner can extend with a place, and a
 * do-question they can ask anybody. A learner who says "I'm a student" has
 * communicated exactly what was asked, so it counts — as an accepted variant,
 * because the taught frame is the other one.
 * ==========================================================================*/

/* the two verbs the arc teaches, and the natural third answer nobody taught */
const LIFE_VERB = /\b(work|works|working|study|studies|studying)\b/
const LIFE_FIRST_PERSON = /\bi\s+(work|study)\b/
const STUDENT_VARIANT = /\b(i'?m|i am)\s+(a\s+)?(student|teacher)\b/
/* where it happens: at home / at the office / at university / at school */
const LIFE_PLACE = /\bat\s+(home|the\s+office|an?\s+office|university|school|the\s+university|the\s+school)\b/
const LIFE_WRONG_PERSON = /\b(he|she|they|we|you)\s+(work|works|study|studies)\b/

export function evaluateStateLifeFact(text, { independent = false, workOrStudy = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  /*
   * The model answer prefers what the learner just said, then what they told us
   * earlier in the arc, and only then a neutral example — the same ladder the
   * origin answer uses, for the same reason: never hand back an invented life.
   */
  const known = String(workOrStudy || '').trim()
  r.naturalVersion = LIFE_FIRST_PERSON.test(n)
    ? `${String(text).trim().replace(/[.!?]*$/, '')}.`
    : (known ? `I work at ${known}.` : 'I work at home.')

  if (!n) {
    return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep18RetryPromptEmpty' }
  }
  if (LIFE_FIRST_PERSON.test(n)) {
    r.completedObjective = true
    r.confidence = LIFE_PLACE.test(n) ? 0.96 : 0.93
    /* the frame alone is the objective; a place is a bonus, not a requirement */
    r.acceptedVariant = false
    r.praiseKey = r.masteryEvidence.independent ? 'ep18PraiseIndependent' : 'ep18PraiseAnswered'
    return r
  }
  if (STUDENT_VARIANT.test(n)) {
    r.completedObjective = true
    r.confidence = 0.9
    r.acceptedVariant = true
    r.praiseKey = r.masteryEvidence.independent ? 'ep18PraiseIndependent' : 'ep18PraiseAnswered'
    return r
  }
  /* the right verb about the wrong person: understood, and not the objective */
  if (LIFE_WRONG_PERSON.test(n)) {
    return { ...r, errorType: 'wrong_person', confidence: 0.9, priorityCorrection: 'ep18RetryExplainI', explanation: 'ep18RetryExplainI', retryRequired: true, retryPrompt: 'ep18RetryPromptI' }
  }
  /* a bare verb — "work" — is a reach for the frame, missing its subject */
  if (LIFE_VERB.test(n) && wordCount(n) <= 3) {
    return { ...r, errorType: 'missing_subject', confidence: 0.9, priorityCorrection: 'ep18RetryExplainI', explanation: 'ep18RetryExplainI', retryRequired: true, retryPrompt: 'ep18RetryPromptI' }
  }
  /* a place with no verb — "at home" — answered where, not what */
  if (LIFE_PLACE.test(n)) {
    return { ...r, errorType: 'missing_verb', confidence: 0.88, priorityCorrection: 'ep18RetryExplainVerb', explanation: 'ep18RetryExplainVerb', retryRequired: true, retryPrompt: 'ep18RetryPromptVerb' }
  }
  return { ...r, errorType: 'no_life_statement', conclusive: false, confidence: 0.5, priorityCorrection: 'ep18RetryExplainVerb', explanation: 'ep18RetryExplainVerb', retryRequired: true, retryPrompt: 'ep18RetryPromptVerb' }
}

/* ==========================================================================
 * A1 ARC 2 — how your day goes.
 *
 * ONE intent, not two. The blueprint's rule is explicit: "One intent per
 * communicative function. Variants travel as a subtype on the step payload, the
 * way Pre-A1 already carries repairKind, quantityForm and thingId — not as a new
 * intent." Saying what you do every day and saying WHEN you do it are the same
 * function said with more detail, so `state_routine` carries a `timeForm`:
 *
 *   null          a routine statement; a time is welcome and not required
 *   part_of_day   the statement must place the action in the morning / afternoon /
 *                 evening
 *   clock         the statement must name an hour the level has taught
 *
 * That is also why `say_when_something_happens` has no intent of its own. The
 * capability is credited from the episode that teaches it, and the episode's
 * steps demand a time through the subtype, so a routine with no hour cannot
 * satisfy it.
 *
 * The frequency adverbs are DELIBERATELY not required. `frequency_pattern`
 * "reaches: guided_production" in the blueprint — it is practised, not demanded,
 * and a learner who says "I get up at seven" has said something true and complete.
 * ==========================================================================*/

/* the actions this arc owns, plus the two it inherits from arc 1 */
const ROUTINE_VERB = /\b(get\s+up|wake\s+up|have\s+breakfast|eat\s+breakfast|work|study|go\s+home|start|finish)\b/
const ROUTINE_FIRST_PERSON = /\bi\s+(usually\s+|sometimes\s+|always\s+|never\s+)?(get\s+up|wake\s+up|have\s+breakfast|eat\s+breakfast|work|study|go\s+home|start|finish)\b/
const ROUTINE_WRONG_PERSON = /\b(he|she|they|we|you)\s+(usually\s+|sometimes\s+)?(gets?\s+up|wakes?\s+up|ha(s|ve)\s+breakfast|works?|study|studies|goes?\s+home)\b/
const PART_OF_DAY = /\bin\s+the\s+(morning|afternoon|evening)\b/
const AT_NIGHT = /\bat\s+night\b/
/* "at seven" — the hours the level owns, as a word or a digit */
const CLOCK_TIME = /\bat\s+(one|two|three|four|five|six|seven|eight|nine|ten|\d{1,2})\b/
const FREQUENCY = /\b(usually|sometimes)\b/

export function evaluateStateRoutine(text, { independent = false, timeForm = null, usualTime = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  const hour = String(usualTime || '').trim() || 'seven'
  /*
   * The model answer prefers what the learner already told us, exactly as the
   * origin and life-fact answers do, so it never invents somebody's morning.
   */
  r.naturalVersion = timeForm === 'clock'
    ? `I usually get up at ${hour}.`
    : timeForm === 'part_of_day'
      ? 'I usually work in the morning.'
      : 'I usually get up early.'

  if (!n) {
    return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep21RetryPromptEmpty' }
  }

  const hasFrame = ROUTINE_FIRST_PERSON.test(n)
  const hasClock = CLOCK_TIME.test(n)
  const hasPartOfDay = PART_OF_DAY.test(n) || AT_NIGHT.test(n)

  if (hasFrame) {
    /*
     * The frame is there. Whether the turn is SATISFIED depends on what it asked
     * for — and a missing time is not a broken sentence, so the learner is told
     * what is missing rather than that they were wrong.
     */
    if (timeForm === 'clock' && !hasClock) {
      return { ...r, errorType: 'missing_time', confidence: 0.9, priorityCorrection: 'ep22RetryExplainClock', explanation: 'ep22RetryExplainClock', retryRequired: true, retryPrompt: 'ep22RetryPromptClock' }
    }
    if (timeForm === 'part_of_day' && !hasPartOfDay) {
      return { ...r, errorType: 'missing_time', confidence: 0.9, priorityCorrection: 'ep22RetryExplainPartOfDay', explanation: 'ep22RetryExplainPartOfDay', retryRequired: true, retryPrompt: 'ep22RetryPromptPartOfDay' }
    }
    r.completedObjective = true
    r.confidence = hasClock || hasPartOfDay ? 0.96 : 0.93
    r.acceptedVariant = Boolean(timeForm) && !FREQUENCY.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'ep21PraiseIndependent' : 'ep21PraiseAnswered'
    return r
  }

  /* the right action about the wrong person — understood, and not the objective */
  if (ROUTINE_WRONG_PERSON.test(n)) {
    return { ...r, errorType: 'wrong_person', confidence: 0.9, priorityCorrection: 'ep21RetryExplainI', explanation: 'ep21RetryExplainI', retryRequired: true, retryPrompt: 'ep21RetryPromptI' }
  }
  /* a bare action — "get up" — reaching for the frame without its subject */
  if (ROUTINE_VERB.test(n) && wordCount(n) <= 3) {
    return { ...r, errorType: 'missing_subject', confidence: 0.9, priorityCorrection: 'ep21RetryExplainI', explanation: 'ep21RetryExplainI', retryRequired: true, retryPrompt: 'ep21RetryPromptI' }
  }
  /* a time on its own answered when, not what */
  if (hasClock || hasPartOfDay) {
    return { ...r, errorType: 'missing_action', confidence: 0.88, priorityCorrection: 'ep21RetryExplainAction', explanation: 'ep21RetryExplainAction', retryRequired: true, retryPrompt: 'ep21RetryPromptAction' }
  }
  return { ...r, errorType: 'no_routine_statement', conclusive: false, confidence: 0.5, priorityCorrection: 'ep21RetryExplainAction', explanation: 'ep21RetryExplainAction', retryRequired: true, retryPrompt: 'ep21RetryPromptAction' }
}

/* ==========================================================================
 * A1 ARC 3 — who this is.
 *
 * Two intents, and the FIRST TWO IN A1 THE BLUEPRINT MARKS `hybrid`. That word has
 * a precise meaning here, and it is not "ask a provider": the rule says "The
 * canonical frame is always judged locally. Escalation is for a reply that is
 * inconclusive, exactly as Pre-A1 routes it. No capability is designed to depend on
 * the provider being reachable."
 *
 * So both evaluators below judge the taught frames themselves and, where a reply is
 * plausibly a correct introduction they were not written to recognise, return
 * `conclusive: false` — which is the flag `shouldEscalate` reads. With no provider
 * the conservative local verdict stands and the learner keeps a hint and a retry.
 * That is a wider inconclusive band than arc 1 or arc 2 needed, which is exactly
 * what "hybrid" buys: introducing a person has more good wordings than saying what
 * you do.
 *
 * WHAT THESE DO NOT DO is check a relationship. The arc's risk note is explicit —
 * "Family vocabulary and cultural assumptions… no episode assumes a family
 * structure" — so `This is Ana.` is a complete, correct introduction, and naming a
 * relation is a bonus rather than a requirement.
 * ==========================================================================*/

/* "This is Ana." / "This is my friend Ana." / "Ana, this is Ben." */
const THIS_IS = /\bthis\s+is\b/
const HERE_IS = /\b(here\s+is|meet)\b/
const POSSESSIVE_RELATION = /\b(my|his|her|your)\s+(friend|colleague|classmate|teacher|neighbour|neighbor)\b/
/* the learner introducing THEMSELVES when the turn asked for somebody else */
const SELF_INTRO = /\b(i'?m|i am|my name is)\b/
const NAMED_PERSON = /\b[A-Z][a-z]{1,15}\b/

export function evaluateIntroducePerson(text, { independent = false, partner = '' } = {}) {
  const raw = String(text || '').trim()
  const n = normalize(raw)
  const r = base(independent)
  const who = String(partner || '').trim() || 'Ana'
  r.naturalVersion = `This is ${who}.`

  if (!n) {
    return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep24RetryPromptEmpty' }
  }

  /* the frame, with or without a relation — both are complete introductions */
  if (THIS_IS.test(n)) {
    r.completedObjective = true
    r.confidence = POSSESSIVE_RELATION.test(n) ? 0.96 : 0.93
    r.acceptedVariant = false
    r.praiseKey = r.masteryEvidence.independent ? 'ep24PraiseIndependent' : 'ep24PraiseIntroduced'
    return r
  }
  /* "Meet Ana." / "Here is Ana." — communicates exactly this, in words nobody taught */
  if (HERE_IS.test(n) && NAMED_PERSON.test(raw)) {
    r.completedObjective = true
    r.confidence = 0.88
    r.acceptedVariant = true
    r.praiseKey = r.masteryEvidence.independent ? 'ep24PraiseIndependent' : 'ep24PraiseIntroduced'
    return r
  }
  /* introducing yourself when the turn asked for the third person */
  if (SELF_INTRO.test(n)) {
    return { ...r, errorType: 'introduced_self', confidence: 0.9, priorityCorrection: 'ep24RetryExplainThird', explanation: 'ep24RetryExplainThird', retryRequired: true, retryPrompt: 'ep24RetryPromptThird' }
  }
  /* a bare name is the reach: the person is right, the frame is missing */
  if (NAMED_PERSON.test(raw) && wordCount(n) <= 2) {
    return { ...r, errorType: 'missing_frame', confidence: 0.88, priorityCorrection: 'ep24RetryExplainFrame', explanation: 'ep24RetryExplainFrame', retryRequired: true, retryPrompt: 'ep24RetryPromptFrame' }
  }
  /*
   * Anything else: this is the hybrid band. There are more ways to introduce
   * somebody than a local pattern list should pretend to know, so the verdict is
   * inconclusive and escalates when Lingua is reachable.
   */
  return { ...r, errorType: 'no_introduction', conclusive: false, confidence: 0.5, priorityCorrection: 'ep24RetryExplainFrame', explanation: 'ep24RetryExplainFrame', retryRequired: true, retryPrompt: 'ep24RetryPromptFrame' }
}

/* "She is a student." / "He works at the office." — the third person, said with `is` */
const HE_SHE_IS = /\b(he|she)('?s|\s+is)\b/
const THEY_ARE = /\bthey('?re|\s+are)\b/
/* third-person -s: heard in the arc, never required of the learner */
const THIRD_PERSON_S = /\b(he|she)\s+(works|studies|lives|likes)\b/
const FIRST_PERSON_FACT = /\bi\s+(work|study|am|'m)\b/

export function evaluateStatePersonFact(text, { independent = false, partner = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  const who = String(partner || '').trim() || 'Ana'
  r.naturalVersion = `${who} is a student.`

  if (!n) {
    return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep25RetryPromptEmpty' }
  }

  /* the taught frame: he/she + is + something */
  if (HE_SHE_IS.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.acceptedVariant = false
    r.praiseKey = r.masteryEvidence.independent ? 'ep25PraiseIndependent' : 'ep25PraiseSaid'
    return r
  }
  /*
   * The -s form. The blueprint hears it and never asks for it, so a learner who
   * produces it has done MORE than the turn required and is accepted as a variant
   * rather than corrected towards the easier sentence.
   */
  if (THIRD_PERSON_S.test(n)) {
    r.completedObjective = true
    r.confidence = 0.9
    r.acceptedVariant = true
    r.praiseKey = r.masteryEvidence.independent ? 'ep25PraiseIndependent' : 'ep25PraiseSaid'
    return r
  }
  /* "They are…" is a real sentence about the wrong number of people */
  if (THEY_ARE.test(n)) {
    return { ...r, errorType: 'wrong_person', confidence: 0.88, priorityCorrection: 'ep25RetryExplainHeShe', explanation: 'ep25RetryExplainHeShe', retryRequired: true, retryPrompt: 'ep25RetryPromptHeShe' }
  }
  /* talking about yourself when the turn asked about them */
  if (FIRST_PERSON_FACT.test(n)) {
    return { ...r, errorType: 'wrong_person', confidence: 0.9, priorityCorrection: 'ep25RetryExplainHeShe', explanation: 'ep25RetryExplainHeShe', retryRequired: true, retryPrompt: 'ep25RetryPromptHeShe' }
  }
  /* the hybrid band again: understood as an attempt, judged inconclusively */
  return { ...r, errorType: 'no_person_statement', conclusive: false, confidence: 0.5, priorityCorrection: 'ep25RetryExplainHeShe', explanation: 'ep25RetryExplainHeShe', retryRequired: true, retryPrompt: 'ep25RetryPromptHeShe' }
}

/* "Do you work?" / "Do you study?" / "What do you do?" — and "And you?" is not it */
const DO_YOU_QUESTION = /\bdo\s+you\s+(work|study)\b/
const WHAT_DO_YOU_DO = /\bwhat\s+do\s+you\s+do\b/
const BARE_RETURN = /^(and|what about)\s+you\s*\??$/

export function evaluateAskLifeFact(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'Do you work?'

  if (!n) {
    return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep19RetryPromptEmpty' }
  }
  if (DO_YOU_QUESTION.test(n) || WHAT_DO_YOU_DO.test(n)) {
    r.completedObjective = true
    r.confidence = 0.96
    r.acceptedVariant = WHAT_DO_YOU_DO.test(n) && !DO_YOU_QUESTION.test(n)
    r.naturalVersion = `${String(text).trim().replace(/[.!?]*$/, '')}?`
    r.praiseKey = r.masteryEvidence.independent ? 'ep19PraiseIndependent' : 'ep19PraiseAsked'
    return r
  }
  /*
   * "And you?" returns the turn without asking the question, which is a Pre-A1
   * capability doing a job A1 asked for. Understood, not the objective.
   */
  if (BARE_RETURN.test(n)) {
    return { ...r, errorType: 'returns_without_asking', confidence: 0.92, priorityCorrection: 'ep19RetryExplainDo', explanation: 'ep19RetryExplainDo', retryRequired: true, retryPrompt: 'ep19RetryPromptDo' }
  }
  /* the words with no question — "you work" — is the frame without the auxiliary */
  if (/\byou\s+(work|study)\b/.test(n)) {
    return { ...r, errorType: 'missing_auxiliary', confidence: 0.9, priorityCorrection: 'ep19RetryExplainDo', explanation: 'ep19RetryExplainDo', retryRequired: true, retryPrompt: 'ep19RetryPromptDo' }
  }
  /* a statement about themselves answers the question instead of asking it */
  if (LIFE_FIRST_PERSON.test(n)) {
    return { ...r, errorType: 'answered_instead_of_asking', confidence: 0.9, priorityCorrection: 'ep19RetryExplainAsk', explanation: 'ep19RetryExplainAsk', retryRequired: true, retryPrompt: 'ep19RetryPromptAsk' }
  }
  return { ...r, errorType: 'no_question', conclusive: false, confidence: 0.5, priorityCorrection: 'ep19RetryExplainDo', explanation: 'ep19RetryExplainDo', retryRequired: true, retryPrompt: 'ep19RetryPromptDo' }
}

// Dispatcher used by the engine for free_reply / roleplay steps.
export function evaluateFree(kind, text, ctx = {}) {
  switch (kind) {
    case 'state_life_fact': return evaluateStateLifeFact(text, ctx)
    case 'ask_life_fact': return evaluateAskLifeFact(text, ctx)
    case 'introduction': return evaluateIntroduction(text, ctx)
    case 'ask_name': return evaluateAskName(text, ctx)
    case 'nice_to_meet': return evaluateNiceToMeet(text, ctx)
    case 'ask_wellbeing': return evaluateAskWellbeing(text, ctx)
    case 'answer_wellbeing': return evaluateAnswerWellbeing(text, ctx)
    case 'reciprocal_question': return evaluateReciprocalQuestion(text, ctx)
    case 'ask_origin': return evaluateAskOrigin(text, ctx)
    case 'answer_origin': return evaluateAnswerOrigin(text, ctx)
    case 'full_intro_conversation': return evaluateFullIntroConversation(text, ctx)
    case 'express_like': return evaluateExpressLike(text, ctx)
    case 'express_dislike': return evaluateExpressDislike(text, ctx)
    case 'ask_preference': return evaluateAskPreference(text, ctx)
    case 'yes_no_preference': return evaluateYesNoPreference(text, ctx)
    case 'express_want': return evaluateExpressWant(text, ctx)
    case 'express_need': return evaluateExpressNeed(text, ctx)
    case 'ask_want': return evaluateAskWant(text, ctx)
    case 'accept_offer': return evaluateAcceptOffer(text, ctx)
    case 'decline_offer': return evaluateDeclineOffer(text, ctx)
    case 'simple_plan_conversation': return evaluateSimplePlanConversation(text, ctx)
    case 'polite_request': return evaluatePoliteRequest(text, ctx)
    case 'thank_service': return evaluateThankService(text, ctx)
    case 'respond_anything_else': return evaluateRespondAnythingElse(text, ctx)
    case 'finish_order': return evaluateFinishOrder(text, ctx)
    case 'cafe_order_conversation': return evaluateCafeOrderConversation(text, ctx)
    case 'repair_request': return evaluateRepairRequest(text, ctx)
    case 'state_routine': return evaluateStateRoutine(text, ctx)
    case 'introduce_person': return evaluateIntroducePerson(text, ctx)
    case 'state_person_fact': return evaluateStatePersonFact(text, ctx)
    case 'close_encounter': return evaluateCloseEncounter(text, ctx)
    case 'ask_what_thing': return evaluateAskWhatThing(text, ctx)
    case 'identify_thing': return evaluateIdentifyThing(text, ctx)
    case 'use_quantity': return evaluateUseQuantity(text, ctx)
    case 'ask_location': return evaluateAskLocation(text, ctx)
    case 'state_location': return evaluateStateLocation(text, ctx)
    case 'ask_transport': return evaluateAskTransport(text, ctx)
    case 'ask_price': return evaluateAskPrice(text, ctx)
    /* A1 arc 6/7 — implementations authored in `levels/a1/evaluators.js` */
    case 'state_ability': return evaluateStateAbility(text, ctx)
    case 'ask_ability': return evaluateAskAbility(text, ctx)
    case 'arrange_meeting': return evaluateArrangeMeeting(text, ctx)
    /* A2 — implementations authored in `levels/a2/evaluators.js` */
    case 'state_past_event': return evaluateStatePastEvent(text, ctx)
    case 'ask_past_event': return evaluateAskPastEvent(text, ctx)
    case 'narrate_past_sequence': return evaluateNarratePastSequence(text, ctx)
    case 'state_future_plan': return evaluateStateFuturePlan(text, ctx)
    case 'ask_future_plan': return evaluateAskFuturePlan(text, ctx)
    case 'describe_person_or_place': return evaluateDescribePersonOrPlace(text, ctx)
    case 'compare_things': return evaluateCompareThings(text, ctx)
    case 'state_opinion_with_reason': return evaluateStateOpinionWithReason(text, ctx)
    case 'give_multi_step_directions': return evaluateGiveMultiStepDirections(text, ctx)
    case 'ask_availability': return evaluateAskAvailability(text, ctx)
    case 'make_booking': return evaluateMakeBooking(text, ctx)
    case 'spell_word': return evaluateSpellWord(text, ctx)
    case 'report_problem': return evaluateReportProblem(text, ctx)
    case 'ask_for_help': return evaluateAskForHelp(text, ctx)
    case 'invite_someone': return evaluateInviteSomeone(text, ctx)
    case 'respond_to_invitation': return evaluateRespondToInvitation(text, ctx)
    /*
     * B1 — implementations authored in `levels/b1/evaluators.js`.
     * `escalate_problem` (not b1.json's own `report_problem`, which A2
     * already occupies here) is the level's runtime-renamed dispatch key —
     * see `curriculum/b1Map.js`'s `B1_CAN_DO_INTENT` comment.
     */
    case 'narrate_past_event': return evaluateNarratePastEventB1(text, ctx)
    case 'state_opinion': return evaluateStateOpinionB1(text, ctx)
    case 'agree_or_disagree': return evaluateAgreeOrDisagreeB1(text, ctx)
    case 'compare_and_choose': return evaluateCompareAndChooseB1(text, ctx)
    case 'describe_experience': return evaluateDescribeExperienceB1(text, ctx)
    case 'recommend_or_warn': return evaluateRecommendOrWarnB1(text, ctx)
    case 'escalate_problem': return evaluateEscalateProblemB1(text, ctx)
    case 'negotiate_solution': return evaluateNegotiateSolutionB1(text, ctx)
    case 'state_future_intent': return evaluateStateFutureIntentB1(text, ctx)
    case 'state_real_condition': return evaluateStateRealConditionB1(text, ctx)
    case 'state_hypothetical': return evaluateStateHypotheticalB1(text, ctx)
    case 'change_topic': return evaluateChangeTopicB1(text, ctx)
    case 'ask_follow_up': return evaluateAskFollowUpB1(text, ctx)
    case 'summarize_other': return evaluateSummarizeOtherB1(text, ctx)
    /* B2 — implementations authored in `levels/b2/evaluators.js` */
    case 'argue_opinion_with_reason': return evaluateArgueOpinionWithReason(text, ctx)
    case 'weigh_options': return evaluateWeighOptions(text, ctx)
    case 'concede_and_counter': return evaluateConcedeAndCounter(text, ctx)
    case 'justify_a_request': return evaluateJustifyARequest(text, ctx)
    case 'propose_a_resolution': return evaluateProposeAResolution(text, ctx)
    case 'express_diplomatic_frustration': return evaluateExpressDiplomaticFrustration(text, ctx)
    case 'state_unreal_hypothesis': return evaluateStateUnrealHypothesis(text, ctx)
    case 'speculate_cause_or_effect': return evaluateSpeculateCauseOrEffect(text, ctx)
    case 'express_past_regret': return evaluateExpressPastRegret(text, ctx)
    case 'summarize_for_third_party': return evaluateSummarizeForThirdParty(text, ctx)
    case 'reformulate_for_clarity': return evaluateReformulateForClarity(text, ctx)
    case 'report_third_party_opinion': return evaluateReportThirdPartyOpinion(text, ctx)
    /*
     * `shift_register` is reused by C2 (`levels/c2/evaluators.js`'s own
     * header) — branch on `ctx.canDoId` before falling back to B2's own
     * function, which stays completely unchanged for B2's own can-dos.
     */
    case 'shift_register': return C2_SHIFT_REGISTER_CAN_DO_IDS.has(ctx.canDoId) ? evaluateC2ShiftRegister(text, ctx) : evaluateShiftRegister(text, ctx)
    case 'soften_or_intensify_claim': return evaluateSoftenOrIntensifyClaim(text, ctx)
    /*
     * C1 — implementations authored in `levels/c1/evaluators.js`.
     * `clarify_ambiguity` is C1's own literal evaluationIntents id
     * (c1.json, mirrored in `c1Capabilities.js`'s `C1_CAN_DO_INTENT`
     * comment) but its evaluator MECHANISM is a `repair_request` subtype —
     * see `REPAIR_KINDS`'s own comment on `ask_for_precision` above.
     */
    case 'clarify_ambiguity': return evaluateRepairRequest(text, { ...ctx, repairKind: 'ask_for_precision' })
    case 'state_structured_argument': return evaluateStateStructuredArgument(text, ctx)
    /*
     * `qualify_claim` and `synthesize_viewpoints` are reused by C2 — same
     * branch-on-`ctx.canDoId` shape as `shift_register` above, falling back
     * to C1's own unchanged functions for C1's own can-dos.
     */
    case 'qualify_claim': return C2_QUALIFY_CLAIM_CAN_DO_IDS.has(ctx.canDoId) ? evaluateC2QualifyClaim(text, ctx) : evaluateQualifyClaim(text, ctx)
    case 'concede_point': return evaluateConcedePoint(text, ctx)
    case 'adapt_register': return evaluateAdaptRegister(text, ctx)
    case 'hedge_statement': return evaluateHedgeStatement(text, ctx)
    case 'summarize_message': return evaluateSummarizeMessage(text, ctx)
    case 'synthesize_viewpoints': return C2_SYNTHESIZE_VIEWPOINTS_CAN_DO_IDS.has(ctx.canDoId) ? evaluateC2SynthesizeViewpoints(text, ctx) : evaluateSynthesizeViewpoints(text, ctx)
    case 'infer_meaning': return evaluateInferMeaning(text, ctx)
    case 'extended_explanation': return evaluateExtendedExplanation(text, ctx)
    case 'negotiate_outcome': return evaluateNegotiateOutcome(text, ctx)
    case 'track_discourse': return evaluateTrackDiscourse(text, ctx)
    /*
     * C2 — implementations authored in `levels/c2/evaluators.js`. See that
     * file's own header, and the import comment above, for the three
     * reused-intent cases already wired above (`qualify_claim`,
     * `synthesize_viewpoints`, `shift_register`).
     */
    case 'extract_argument': return evaluateExtractArgument(text, ctx)
    case 'identify_stance': return evaluateIdentifyStance(text, ctx)
    case 'reformulate_for_audience': return evaluateReformulateForAudience(text, ctx)
    case 'recognize_implication': return evaluateRecognizeImplication(text, ctx)
    case 'develop_argument': return evaluateDevelopArgument(text, ctx)
    case 'rebut_counterargument': return evaluateRebutCounterargument(text, ctx)
    case 'sustain_coherence': return evaluateSustainCoherence(text, ctx)
    case 'repair_at_intention_level': return evaluateRepairAtIntentionLevel(text, ctx)
    case 'edit_for_precision': return evaluateEditForPrecision(text, ctx)
    case 'mediate_disagreement': return evaluateMediateDisagreement(text, ctx)
    default: return { ...base(ctx.independent), understood: false, conclusive: true, retryRequired: true }
  }
}

/*
 * --- A1 arc 4 - "Where things are" -------------------------------------------
 *
 * Three intents, and two of them are `deterministic_local` in the blueprint because
 * the frame is genuinely checkable: a location question is `where` plus a thing, and
 * a location answer is `it's` plus one of four relations. The third,
 * `ask_transport`, is `hybrid` - there are more good ways to ask how to reach a place
 * than a pattern list should claim to know, so an unrecognised attempt is
 * INCONCLUSIVE rather than wrong, and escalates when Lingua is reachable.
 *
 * NO DIRECTIONS ARE EVER ACCEPTED AS EVIDENCE. The arc's risk note is "directions
 * creep", so a learner who produces "go left and take the second street" has not
 * demonstrated an A1 capability - they have produced A2 - and the evaluator says so
 * rather than rewarding it.
 */

/* "Where is the toilet?" / "Where's the station?" - the question */
const WHERE_IS = /\bwhere('?s|\s+is|\s+are)\b/
/* "How do I get to the station?" / "How can I get there?" - the transport question */
const HOW_GET_TO = /\bhow\s+(do|can)\s+i\s+(get|go)\s+(to|there)\b/
/* "Which bus goes to X?" / "Is there a bus to X?" - the same function, said another way */
const WHICH_TRANSPORT = /\b(which|what)\s+(bus|train)\b|\bis\s+there\s+a\s+(bus|train)\b/
/* the four relations the arc teaches */
const TAUGHT_RELATION = /\b(here|there|next\s+to|near)\b/
/* "It's ..." - the frame a location answer is built on */
const ITS_FRAME = /\bit('?s|\s+is)\b/
/* left / right / straight on: A2, refused as evidence rather than praised */
const DIRECTIONS = /\b(left|right|straight\s+on|straight\s+ahead|first\s+street|second\s+street|turn)\b/
/* a polite opener is welcome and never required */
const EXCUSE_ME = /\bexcuse\s+me\b|\bsorry\b/
/* "the toilet, please?" - it works in a real building, and it is not the pattern */
const BARE_PLEASE = /\bplease\b/

/*
 * ask_location - "Where is the toilet?"
 *
 * `placeName` is the thing the step asked about. It sharpens the praise and is NEVER
 * required: a learner who asks where something else is has still asked a location
 * question, and the step's own copy is what says which one was wanted.
 */
export function evaluateAskLocation(text, { independent = false, placeName = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  const what = String(placeName || '').trim() || 'the toilet'
  r.naturalVersion = 'Where is ' + what + '?'

  if (!n) {
    return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep27RetryPromptEmpty' }
  }
  /* the frame, and it needs a noun after it - "where is?" is not a question yet */
  if (WHERE_IS.test(n) && wordCount(n) >= 3) {
    r.completedObjective = true
    r.confidence = EXCUSE_ME.test(n) ? 0.97 : 0.95
    r.praiseKey = r.masteryEvidence.independent ? 'ep27PraiseIndependent' : 'ep27PraiseAsked'
    return r
  }
  /* the noun and a please: understood, and one word short of the capability */
  if (BARE_PLEASE.test(n) && wordCount(n) <= 4) {
    return { ...r, errorType: 'missing_where', confidence: 0.85,
      priorityCorrection: 'ep27RetryExplainFrame', explanation: 'ep27RetryExplainFrame', retryRequired: true, retryPrompt: 'ep27RetryPromptFrame' }
  }
  /* a statement where a question was asked: the commonest first attempt */
  if (ITS_FRAME.test(n)) {
    return { ...r, errorType: 'answered_instead', confidence: 0.9,
      priorityCorrection: 'ep27RetryExplainQuestion', explanation: 'ep27RetryExplainQuestion', retryRequired: true, retryPrompt: 'ep27RetryPromptFrame' }
  }
  /* the word is there and the verb is not: "where the toilet" */
  if (/\bwhere\b/.test(n)) {
    return { ...r, errorType: 'missing_verb', confidence: 0.88,
      priorityCorrection: 'ep27RetryExplainVerb', explanation: 'ep27RetryExplainVerb', retryRequired: true, retryPrompt: 'ep27RetryPromptFrame' }
  }
  return { ...r, errorType: 'no_question', confidence: 0.86,
    priorityCorrection: 'ep27RetryExplainFrame', explanation: 'ep27RetryExplainFrame', retryRequired: true, retryPrompt: 'ep27RetryPromptFrame' }
}

/*
 * state_location - "It's next to the bag."
 *
 * `relationHint` is the relation the step's situation implies. ANY taught relation is
 * accepted, because the arc teaches four interchangeable ways to place a thing and the
 * learner is describing something they were told; the hint only sharpens the model.
 */
export function evaluateStateLocation(text, { independent = false, relationHint = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  const hint = String(relationHint || '').replace(/_/g, ' ').trim() || 'here'
  const tail = (hint === 'next to' || hint === 'near') ? hint + ' the bag' : hint
  r.naturalVersion = "It's " + tail + '.'

  if (!n) {
    return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep28RetryPromptEmpty' }
  }
  /*
   * DIRECTIONS ARE NOT THIS CAPABILITY, and this is checked FIRST so that "it's left"
   * is not accepted merely because it starts correctly.
   */
  if (DIRECTIONS.test(n)) {
    return { ...r, errorType: 'directions_not_taught', confidence: 0.9,
      priorityCorrection: 'ep28RetryExplainRelation', explanation: 'ep28RetryExplainRelation', retryRequired: true, retryPrompt: 'ep28RetryPromptRelation' }
  }
  /* the taught answer: the frame and one of the four relations */
  if (ITS_FRAME.test(n) && TAUGHT_RELATION.test(n)) {
    r.completedObjective = true
    r.confidence = 0.96
    r.praiseKey = r.masteryEvidence.independent ? 'ep28PraiseIndependent' : 'ep28PraiseAnswered'
    return r
  }
  /* the relation alone - "next to the bag" - communicates it without the frame */
  if (TAUGHT_RELATION.test(n)) {
    r.completedObjective = true
    r.confidence = 0.88
    r.acceptedVariant = true
    r.praiseKey = r.masteryEvidence.independent ? 'ep28PraiseIndependent' : 'ep28PraiseAnswered'
    return r
  }
  /* "next the bag" - the missing `to`, which is the episode's one real decision */
  if (/\bnext\b/.test(n) && !/\bnext\s+to\b/.test(n)) {
    return { ...r, errorType: 'missing_to', confidence: 0.92,
      priorityCorrection: 'ep28RetryExplainNextTo', explanation: 'ep28RetryExplainNextTo', retryRequired: true, retryPrompt: 'ep28RetryPromptRelation' }
  }
  /* a question where an answer was asked for */
  if (WHERE_IS.test(n)) {
    return { ...r, errorType: 'asked_instead', confidence: 0.9,
      priorityCorrection: 'ep28RetryExplainAnswer', explanation: 'ep28RetryExplainAnswer', retryRequired: true, retryPrompt: 'ep28RetryPromptRelation' }
  }
  /* the frame with no relation: "it's the bag" says something else entirely */
  if (ITS_FRAME.test(n)) {
    return { ...r, errorType: 'missing_relation', confidence: 0.9,
      priorityCorrection: 'ep28RetryExplainRelation', explanation: 'ep28RetryExplainRelation', retryRequired: true, retryPrompt: 'ep28RetryPromptRelation' }
  }
  return { ...r, errorType: 'no_location', confidence: 0.86,
    priorityCorrection: 'ep28RetryExplainRelation', explanation: 'ep28RetryExplainRelation', retryRequired: true, retryPrompt: 'ep28RetryPromptRelation' }
}

/*
 * ask_transport - "How do I get to the station?"
 *
 * HYBRID, per the blueprint. The canonical frame and two real alternatives are judged
 * here; anything else is inconclusive and escalates, because this is the one A1
 * question with many idiomatic shapes ("is there a bus?", "which train?") and a local
 * pattern list that guessed would be wrong in both directions.
 */
export function evaluateAskTransport(text, { independent = false, placeName = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  const where = String(placeName || '').trim() || 'the station'
  r.naturalVersion = 'How do I get to ' + where + '?'

  if (!n) {
    return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep29RetryPromptEmpty' }
  }
  /* the canonical question */
  if (HOW_GET_TO.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.praiseKey = r.masteryEvidence.independent ? 'ep29PraiseIndependent' : 'ep29PraiseAsked'
    return r
  }
  /* naming the transport instead - the same function, and how many people ask */
  if (WHICH_TRANSPORT.test(n)) {
    r.completedObjective = true
    r.confidence = 0.9
    r.acceptedVariant = true
    r.praiseKey = r.masteryEvidence.independent ? 'ep29PraiseIndependent' : 'ep29PraiseAsked'
    return r
  }
  /*
   * Asking where it IS when the turn asked how to GET there. Close, taught in this
   * very arc, and a different question - so it is named rather than accepted.
   */
  if (WHERE_IS.test(n)) {
    return { ...r, errorType: 'asked_location_instead', confidence: 0.88,
      priorityCorrection: 'ep29RetryExplainGet', explanation: 'ep29RetryExplainGet', retryRequired: true, retryPrompt: 'ep29RetryPromptGet' }
  }
  /* the hybrid band: not recognised locally, not therefore wrong */
  return { ...r, errorType: 'no_transport_question', conclusive: false, confidence: 0.5,
    priorityCorrection: 'ep29RetryExplainGet', explanation: 'ep29RetryExplainGet', retryRequired: true, retryPrompt: 'ep29RetryPromptGet' }
}

/*
 * --- A1 arc 5 - "What it costs" ----------------------------------------------
 *
 * `ask_price`, the arc's one new intent and `deterministic_local` in the
 * blueprint: "How much is it?" / "How much are they?" is the whole frame, and
 * no idiomatic variant needs a provider to judge. Written now because
 * `check-curriculum-map` requires every intent an episode uses to have a real
 * dispatched evaluator the moment it is used — LC-CURR-005b is the routing,
 * provider-payload and backend-parity pass over this and the rest of the arc.
 */
const HOW_MUCH = /\bhow\s+much\s+(is|are)\b/

export function evaluateAskPrice(text, { independent = false, placeName = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  const what = String(placeName || '').trim() || 'it'
  r.naturalVersion = 'How much is ' + what + '?'

  if (!n) {
    return { ...r, understood: false, confidence: 0.95, errorType: 'empty', retryRequired: true, retryPrompt: 'ep31RetryPromptEmpty' }
  }
  /* the frame, singular or plural */
  if (HOW_MUCH.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    r.praiseKey = r.masteryEvidence.independent ? 'ep31PraiseIndependent' : 'ep31PraiseAsked'
    return r
  }
  /* a statement where a question was asked - the commonest first attempt */
  if (ITS_FRAME.test(n)) {
    return { ...r, errorType: 'answered_instead', confidence: 0.9,
      priorityCorrection: 'ep31RetryExplainFrame', explanation: 'ep31RetryExplainFrame', retryRequired: true, retryPrompt: 'ep31RetryPromptFrame' }
  }
  /* "how much" without is/are - one word short of the capability */
  if (/\bhow\s+much\b/.test(n)) {
    return { ...r, errorType: 'missing_verb', confidence: 0.88,
      priorityCorrection: 'ep31RetryExplainFrame', explanation: 'ep31RetryExplainFrame', retryRequired: true, retryPrompt: 'ep31RetryPromptFrame' }
  }
  return { ...r, errorType: 'no_question', confidence: 0.86,
    priorityCorrection: 'ep31RetryExplainFrame', explanation: 'ep31RetryExplainFrame', retryRequired: true, retryPrompt: 'ep31RetryPromptFrame' }
}

// Whether the hybrid router should consider escalating this verdict to Lingua.
export function shouldEscalate(result) {
  return Boolean(result) && result.completedObjective === false && result.conclusive === false
}
