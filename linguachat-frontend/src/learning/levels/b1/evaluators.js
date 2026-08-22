/*
 * b1/evaluators — B1's own local-evaluator functions, one per new intent,
 * grown one arc at a time. Same authoring pattern as
 * `engine/responseEvaluation.js` (taught-frame regex match, explicit
 * near-miss/wrong-meaning reject patterns each with their own `errorType`, a
 * catch-all that is always `conclusive: false` so an unanticipated genuine
 * attempt is never falsely rejected — see
 * `docs/curriculum/implementation/b1/core-engine-findings.md` §15.1).
 *
 * `base()` below is a deliberate, exact copy of the shared `base()` in
 * `engine/responseEvaluation.js` (not importable: it is not exported from that
 * module, and this task cannot add an export to it). `LC-INT-001` merges these
 * functions into the shared switch directly; the contract shape must match
 * exactly today so nothing has to change at merge time.
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
})

export function normalize(text) {
  return String(text || '')
    .replace(/[’‘‛`´]/g, "'")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
const wordCount = (n) => (n ? n.split(' ').filter(Boolean).length : 0)

/* ---------------------------------------------------------------------------
 * arc 1 — narrate_past_event (subtype narrativeForm: 'sequence' | 'interruption')
 * ------------------------------------------------------------------------- */

const CONNECTOR_RES = [
  ['first', /\bfirst\b/],
  ['then', /\bthen\b/],
  ['after_that', /\bafter\s+that\b/],
  ['before_that', /\bbefore\s+that\b/],
  ['finally', /\bfinally\b/],
  ['next', /\bnext\b/],
]
const PAST_CONTINUOUS = /\b(i|he|she|it|we|they|you)\s+(was|were)\s+\w+ing\b/
const WHEN_WHILE = /\b(when|while)\b/
const SIMPLE_PAST_VERB = /\b\w+ed\b|\b(went|had|got|made|saw|took|came|left|found|said|did|ate|drank|met|woke|read|wrote|ran|rang|bought|thought|felt|heard|began|started|stopped)\b/
const PRESENT_TENSE_LEAK = /\b(i|you|we|they)\s+(am|are|go|have|make|see|take|come|leave|find|say|do|eat|drink|meet)\b/

function countConnectors(n) {
  return CONNECTOR_RES.filter(([, re]) => re.test(n)).length
}

function countClauses(n) {
  // rough clause count: split on connectors, "and", and sentence-final periods
  return n.split(/\.|,\s*(?:and\s+)?|\bthen\b|\bfirst\b|\bafter that\b|\bbefore that\b|\bfinally\b/)
    .map(s => s.trim()).filter(s => s.split(' ').filter(Boolean).length >= 2).length
}

function evaluateSequence(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'First I got up. Then I had breakfast. After that I went to work. Finally I came home.'
  if (!n) return { ...r, understood: false, completedObjective: false, errorType: 'empty', retryRequired: true, retryPrompt: 'b1RetryPromptSequenceEmpty' }

  const connectors = countConnectors(n)
  const clauses = countClauses(n)
  const hasPast = SIMPLE_PAST_VERB.test(n)

  if (!hasPast && PRESENT_TENSE_LEAK.test(n)) {
    return { ...r, errorType: 'wrong_tense_present', priorityCorrection: 'b1RetryExplainSequenceTense', explanation: 'b1RetryExplainSequenceTense', retryRequired: true, retryPrompt: 'b1RetryPromptSequenceTense' }
  }
  if (connectors >= 2 && clauses >= 3 && hasPast) {
    r.completedObjective = true
    r.confidence = 0.93
    r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseSequenceIndependent' : 'b1PraiseSequenceHelped'
    return r
  }
  if (connectors === 1 && hasPast) {
    return { ...r, errorType: 'near_miss_one_connector', priorityCorrection: 'b1RetryExplainSequenceMore', explanation: 'b1RetryExplainSequenceMore', retryRequired: true, retryPrompt: 'b1RetryPromptSequenceMore' }
  }
  if (connectors === 0 && hasPast && clauses >= 1) {
    return { ...r, errorType: 'no_connectors', priorityCorrection: 'b1RetryExplainSequenceConnector', explanation: 'b1RetryExplainSequenceConnector', retryRequired: true, retryPrompt: 'b1RetryPromptSequenceConnector' }
  }
  // genuinely unrecognized attempt: never a confident reject (§15.1)
  return { ...r, errorType: 'no_sequence', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptSequenceConnector' }
}

function evaluateInterruption(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'I was walking home when it started to rain.'
  if (!n) return { ...r, understood: false, completedObjective: false, errorType: 'empty', retryRequired: true, retryPrompt: 'b1RetryPromptInterruptionEmpty' }

  const hasContinuous = PAST_CONTINUOUS.test(n)
  const hasConnector = WHEN_WHILE.test(n)
  const hasSimplePast = SIMPLE_PAST_VERB.test(n)

  if (hasContinuous && hasConnector && hasSimplePast) {
    r.completedObjective = true
    r.confidence = 0.93
    r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseInterruptionIndependent' : 'b1PraiseInterruptionHelped'
    return r
  }
  if (hasContinuous && !hasConnector) {
    return { ...r, errorType: 'missing_when_while', priorityCorrection: 'b1RetryExplainInterruptionConnector', explanation: 'b1RetryExplainInterruptionConnector', retryRequired: true, retryPrompt: 'b1RetryPromptInterruptionConnector' }
  }
  if (!hasContinuous && hasConnector) {
    return { ...r, errorType: 'missing_continuous', priorityCorrection: 'b1RetryExplainInterruptionForm', explanation: 'b1RetryExplainInterruptionForm', retryRequired: true, retryPrompt: 'b1RetryPromptInterruptionForm' }
  }
  if (!hasContinuous && !hasConnector && hasSimplePast) {
    return { ...r, errorType: 'no_interruption_shape', priorityCorrection: 'b1RetryExplainInterruptionForm', explanation: 'b1RetryExplainInterruptionForm', retryRequired: true, retryPrompt: 'b1RetryPromptInterruptionForm' }
  }
  return { ...r, errorType: 'no_interruption', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptInterruptionForm' }
}

export function evaluateNarratePastEvent(text, ctx = {}) {
  return ctx.narrativeForm === 'interruption' ? evaluateInterruption(text, ctx) : evaluateSequence(text, ctx)
}

/* ---------------------------------------------------------------------------
 * arc 2 — state_opinion, agree_or_disagree
 * ------------------------------------------------------------------------- */

const OPINION_FRAME_RE = /\b(i think(?:\s+that)?|in my opinion|personally|i believe)\b/
const REASON_RE = /\bbecause\b/
const AGREE_RE = /\b(i agree|i think so too|you'?re right|that'?s true)\b/
const DISAGREE_RE = /\b(i don'?t think so|i disagree|i don'?t agree|i'?m not so sure)\b/

export function evaluateStateOpinion(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'I think that weekend trips are great, because they help you relax.'
  if (!n) return { ...r, understood: false, completedObjective: false, errorType: 'empty', retryRequired: true, retryPrompt: 'b1RetryPromptOpinionEmpty' }

  const hasFrame = OPINION_FRAME_RE.test(n)
  const hasReason = REASON_RE.test(n)

  if (hasFrame && hasReason) {
    r.completedObjective = true
    r.confidence = 0.92
    r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseOpinionIndependent' : 'b1PraiseOpinionHelped'
    return r
  }
  if (hasFrame && !hasReason) {
    return { ...r, errorType: 'missing_reason', priorityCorrection: 'b1RetryExplainOpinionReason', explanation: 'b1RetryExplainOpinionReason', retryRequired: true, retryPrompt: 'b1RetryPromptOpinionReason' }
  }
  if (!hasFrame && hasReason) {
    return { ...r, errorType: 'missing_opinion_frame', priorityCorrection: 'b1RetryExplainOpinionFrame', explanation: 'b1RetryExplainOpinionFrame', retryRequired: true, retryPrompt: 'b1RetryPromptOpinionFrame' }
  }
  // genuinely unrecognized attempt: never a confident reject (§15.1)
  return { ...r, errorType: 'no_opinion', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptOpinionFrame' }
}

export function evaluateAgreeOrDisagree(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "I agree, because there's more to do in a city."
  if (!n) return { ...r, understood: false, completedObjective: false, errorType: 'empty', retryRequired: true, retryPrompt: 'b1RetryPromptAgreeEmpty' }

  const agrees = AGREE_RE.test(n)
  const disagrees = DISAGREE_RE.test(n)
  const hasStance = agrees || disagrees
  const hasReason = REASON_RE.test(n)

  if (hasStance && hasReason) {
    r.completedObjective = true
    r.confidence = 0.92
    r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseAgreeIndependent' : 'b1PraiseAgreeHelped'
    return r
  }
  if (hasStance && !hasReason) {
    return { ...r, errorType: 'missing_reason', priorityCorrection: 'b1RetryExplainAgreeReason', explanation: 'b1RetryExplainAgreeReason', retryRequired: true, retryPrompt: 'b1RetryPromptAgreeReason' }
  }
  if (!hasStance && hasReason) {
    return { ...r, errorType: 'missing_stance', priorityCorrection: 'b1RetryExplainAgreeStance', explanation: 'b1RetryExplainAgreeStance', retryRequired: true, retryPrompt: 'b1RetryPromptAgreeStance' }
  }
  return { ...r, errorType: 'no_agree_disagree', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptAgreeStance' }
}

/* ---------------------------------------------------------------------------
 * arc 3 — compare_and_choose, describe_experience, recommend_or_warn
 * ------------------------------------------------------------------------- */

const COMPARATIVE_RE = /\b(more|less)\s+\w+\s+than\b|\b\w{3,}er\s+than\b/
const SUPERLATIVE_RE = /\bthe\s+most\s+\w+\b|\b\w{3,}est\b/
const PREFERENCE_RE = /\bi\s+(think|prefer|choose|would choose|would pick)\b|\bi'?d\s+(choose|pick|go with)\b|\bmy\s+favou?rite\s+is\b/

export function evaluateCompareAndChoose(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "The city is busier than the countryside, but it's more exciting. Of the three, I think the coast is the most relaxing."
  if (!n) return { ...r, understood: false, completedObjective: false, errorType: 'empty', retryRequired: true, retryPrompt: 'b1RetryPromptCompareEmpty' }

  const hasComparative = COMPARATIVE_RE.test(n)
  const hasChoice = SUPERLATIVE_RE.test(n) || PREFERENCE_RE.test(n)

  if (hasComparative && hasChoice) {
    r.completedObjective = true
    r.confidence = 0.9
    r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseCompareIndependent' : 'b1PraiseCompareHelped'
    return r
  }
  if (hasComparative && !hasChoice) {
    return { ...r, errorType: 'missing_choice', priorityCorrection: 'b1RetryExplainCompareChoice', explanation: 'b1RetryExplainCompareChoice', retryRequired: true, retryPrompt: 'b1RetryPromptCompareChoice' }
  }
  if (!hasComparative && hasChoice) {
    return { ...r, errorType: 'missing_comparison', priorityCorrection: 'b1RetryExplainCompareComparison', explanation: 'b1RetryExplainCompareComparison', retryRequired: true, retryPrompt: 'b1RetryPromptCompareComparison' }
  }
  return { ...r, errorType: 'no_comparison', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptCompareComparison' }
}

// normalize() strips commas, so a list like "was quiet, beautiful, and
// relaxing" arrives as "was quiet beautiful and relaxing" — match "was"
// followed by one or more attribute words, then "and" + a final attribute.
const MULTI_ATTR_RE = /\bwas\s+(\w+\s+){1,4}and\s+\w+\b/
const FEELING_RE = /\bit\s+made\s+me\s+feel\b|\bi\s+felt\b/

export function evaluateDescribeExperience(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'It was quiet, beautiful, and relaxing. It made me feel really peaceful.'
  if (!n) return { ...r, understood: false, completedObjective: false, errorType: 'empty', retryRequired: true, retryPrompt: 'b1RetryPromptDescribeEmpty' }

  const hasAttrs = MULTI_ATTR_RE.test(n)
  const hasFeeling = FEELING_RE.test(n)

  if (hasAttrs && hasFeeling) {
    r.completedObjective = true
    r.confidence = 0.9
    r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseDescribeIndependent' : 'b1PraiseDescribeHelped'
    return r
  }
  if (hasAttrs && !hasFeeling) {
    return { ...r, errorType: 'missing_feeling', priorityCorrection: 'b1RetryExplainDescribeFeeling', explanation: 'b1RetryExplainDescribeFeeling', retryRequired: true, retryPrompt: 'b1RetryPromptDescribeFeeling' }
  }
  if (!hasAttrs && hasFeeling) {
    return { ...r, errorType: 'missing_attributes', priorityCorrection: 'b1RetryExplainDescribeAttributes', explanation: 'b1RetryExplainDescribeAttributes', retryRequired: true, retryPrompt: 'b1RetryPromptDescribeAttributes' }
  }
  return { ...r, errorType: 'no_description', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptDescribeAttributes' }
}

const RECOMMEND_RE = /\bi'?d\s+recommend\b|\bi\s+would\s+recommend\b/
const WARN_RE = /\bi\s+wouldn'?t\s+recommend\b|\bi\s+would\s+not\s+recommend\b|\bi'?d\s+avoid\b|\bi\s+would\s+avoid\b/

export function evaluateRecommendOrWarn(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "I'd recommend the coast, because it's quiet and relaxing."
  if (!n) return { ...r, understood: false, completedObjective: false, errorType: 'empty', retryRequired: true, retryPrompt: 'b1RetryPromptRecommendEmpty' }

  const hasStance = RECOMMEND_RE.test(n) || WARN_RE.test(n)
  const hasReason = REASON_RE.test(n)

  if (hasStance && hasReason) {
    r.completedObjective = true
    r.confidence = 0.9
    r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseRecommendIndependent' : 'b1PraiseRecommendHelped'
    return r
  }
  if (hasStance && !hasReason) {
    return { ...r, errorType: 'missing_reason', priorityCorrection: 'b1RetryExplainRecommendReason', explanation: 'b1RetryExplainRecommendReason', retryRequired: true, retryPrompt: 'b1RetryPromptRecommendReason' }
  }
  if (!hasStance && hasReason) {
    return { ...r, errorType: 'missing_recommendation', priorityCorrection: 'b1RetryExplainRecommendStance', explanation: 'b1RetryExplainRecommendStance', retryRequired: true, retryPrompt: 'b1RetryPromptRecommendStance' }
  }
  return { ...r, errorType: 'no_recommendation', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptRecommendStance' }
}

/* ---------------------------------------------------------------------------
 * arc 4 — report_problem (subtype tone: neutral | frustrated), negotiate_solution
 * ------------------------------------------------------------------------- */

const PROBLEM_RE = /\bthere'?s\s+a\s+problem\s+with\b|\b(ordered|booked|asked for|wanted|paid for)\b.{0,40}\bbut\b.{0,15}\bgot\b|\bthis\s+is(?:n'?t|\s+not)\s+what\s+i\s+(ordered|expected|booked)\b/
const EXPECTATION_RE = /\bi\s+ordered\b|\bi\s+expected\b|\bi\s+booked\b|\bshould\s+(be|have)\b|\bsupposed\s+to\b|\binstead\s+of\b|\b(ordered|booked|asked for|wanted|paid for)\b.{0,40}\bbut\b.{0,15}\bgot\b/
const FRUSTRATION_RE = /\bthis\s+isn'?t\s+ideal\b|\bi\s+understand,?\s+but\b|\bi'?m\s+a\s+(little|bit)\s+frustrated\b|\bthis\s+is\s+frustrating,?\s+but\b/
const UNCOOPERATIVE_RE = /\bthis\s+is\s+ridiculous\b|\bunacceptable\b|\bterrible\s+service\b|\bworst\b/

export function evaluateReportProblem(text, { tone = 'neutral', independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = tone === 'frustrated'
    ? "This isn't ideal, but I understand these things happen."
    : "There's a problem with my order. I ordered a chicken sandwich, but I got a cheese one."
  if (!n) return { ...r, understood: false, completedObjective: false, errorType: 'empty', retryRequired: true, retryPrompt: 'b1RetryPromptProblemEmpty' }

  if (UNCOOPERATIVE_RE.test(n)) {
    // grammatically a real problem statement, but violates the arc's
    // cooperative-tone ceiling (b1.json arc 4 risk: "every model turn stays
    // firmly on the polite side") — express_frustration_politely is
    // evaluated on staying cooperative, not just on using a frustration word
    return { ...r, errorType: 'too_harsh', priorityCorrection: 'b1RetryExplainProblemHarsh', explanation: 'b1RetryExplainProblemHarsh', retryRequired: true, retryPrompt: 'b1RetryPromptProblemHarsh' }
  }

  const hasProblem = PROBLEM_RE.test(n)
  const hasExpectation = EXPECTATION_RE.test(n)
  const hasFrustration = FRUSTRATION_RE.test(n)

  if (tone === 'frustrated') {
    if (hasFrustration && (hasProblem || hasExpectation)) {
      r.completedObjective = true
      r.confidence = 0.9
      r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseFrustrationIndependent' : 'b1PraiseFrustrationHelped'
      return r
    }
    if (hasFrustration && !(hasProblem || hasExpectation)) {
      return { ...r, errorType: 'missing_problem_detail', priorityCorrection: 'b1RetryExplainFrustrationDetail', explanation: 'b1RetryExplainFrustrationDetail', retryRequired: true, retryPrompt: 'b1RetryPromptFrustrationDetail' }
    }
    if (!hasFrustration && (hasProblem || hasExpectation)) {
      return { ...r, errorType: 'missing_frustration_marker', priorityCorrection: 'b1RetryExplainFrustrationMarker', explanation: 'b1RetryExplainFrustrationMarker', retryRequired: true, retryPrompt: 'b1RetryPromptFrustrationMarker' }
    }
    return { ...r, errorType: 'no_frustration', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptFrustrationMarker' }
  }

  if (hasProblem && hasExpectation) {
    r.completedObjective = true
    r.confidence = 0.9
    r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseProblemIndependent' : 'b1PraiseProblemHelped'
    return r
  }
  if (hasProblem && !hasExpectation) {
    return { ...r, errorType: 'missing_expectation', priorityCorrection: 'b1RetryExplainProblemExpectation', explanation: 'b1RetryExplainProblemExpectation', retryRequired: true, retryPrompt: 'b1RetryPromptProblemExpectation' }
  }
  if (!hasProblem && hasExpectation) {
    return { ...r, errorType: 'missing_problem_statement', priorityCorrection: 'b1RetryExplainProblemStatement', explanation: 'b1RetryExplainProblemStatement', retryRequired: true, retryPrompt: 'b1RetryPromptProblemStatement' }
  }
  return { ...r, errorType: 'no_problem', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptProblemStatement' }
}

// negotiate_solution's canonical/reject frames, adapted from the draft
// evaluator that resolved b1.md section 15.1 — see
// docs/curriculum/implementation/b1/core-engine-findings.md and
// scripts/foundry/b1/measure-hybrid-evaluation-density.mjs.
const NEGOTIATE_FRAME_RE = /\b(would it be possible|could i (possibly )?(exchange|get|have)|is there any way i could)\b/
const OFFER_TO_BUY_RE = /\bi'?d like to buy\b/
const IMPERATIVE_DEMAND_RE = /\b(give me|i need)\b.{0,30}\b(now|right now|immediately)\b/
const STATES_GOAL_ONLY_RE = /^i want (a|to)\b/

export function evaluateNegotiateSolution(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'Would it be possible to get a replacement instead?'
  if (!n) return { ...r, understood: false, completedObjective: false, errorType: 'empty', retryRequired: true, retryPrompt: 'b1RetryPromptNegotiateEmpty' }

  if (NEGOTIATE_FRAME_RE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.9
    r.acceptedVariant = !/would it be possible/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseNegotiateIndependent' : 'b1PraiseNegotiateHelped'
    return r
  }
  if (OFFER_TO_BUY_RE.test(n)) {
    return { ...r, errorType: 'wrong_speech_act_offer_not_negotiate', priorityCorrection: 'b1RetryExplainNegotiateSpeechAct', explanation: 'b1RetryExplainNegotiateSpeechAct', retryRequired: true, retryPrompt: 'b1RetryPromptNegotiateFrame' }
  }
  if (IMPERATIVE_DEMAND_RE.test(n)) {
    // grammatically fine, but violates the arc's cooperative-negotiation
    // ceiling — a plain reject with its own errorType, exactly like
    // `evaluatePoliteRequest`'s existing hardcoded pragmatic special case.
    // Needs no shared `registerAppropriateness` field (core-engine-findings.md).
    return { ...r, errorType: 'pragmatically_inappropriate_demand', priorityCorrection: 'b1RetryExplainNegotiateDemand', explanation: 'b1RetryExplainNegotiateDemand', retryRequired: true, retryPrompt: 'b1RetryPromptNegotiateFrame' }
  }
  if (STATES_GOAL_ONLY_RE.test(n)) {
    return { ...r, errorType: 'near_miss_underdeveloped_negotiation', priorityCorrection: 'b1RetryExplainNegotiateUnderdeveloped', explanation: 'b1RetryExplainNegotiateUnderdeveloped', retryRequired: true, retryPrompt: 'b1RetryPromptNegotiateFrame' }
  }
  return { ...r, errorType: 'no_negotiation_frame', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptNegotiateFrame' }
}

/* ---------------------------------------------------------------------------
 * arc 5 — state_future_intent (subtype intentForm: will_going_to |
 * hope_would_like; within will_going_to, evaluator-only situationForm:
 * decision | plan | prediction), state_real_condition, state_hypothetical
 *
 * The will_going_to/hope_would_like distinction resolves b1.md section 15.1's
 * hardest case — adapted from the draft evaluator that measurement produced,
 * see docs/curriculum/implementation/b1/core-engine-findings.md and
 * scripts/foundry/b1/measure-hybrid-evaluation-density.mjs.
 * ------------------------------------------------------------------------- */

const FUTURE_VERB = '(have|take|get|go|do|make|eat|call|check|see|try|order|visit|book|send|ask|stay|wait|learn|travel|start|finish|move|buy|open|begin|meet|study|work|cook|watch|write|build)'
const WILL_DECISION_RE = new RegExp(`\\bi'?ll\\s+${FUTURE_VERB}\\b`)
const GOING_TO_PLAN_RE = new RegExp(`\\bi'?m\\s+going\\s+to\\s+${FUTURE_VERB}\\b`)
const PREDICTION_RE = /\b(i think|i'?m sure|i bet|i expect)\b.{0,20}\b(will|won'?t|'ll)\b|\b(it|there)\s+(will|won'?t|'ll)\b/
const HOPE_RE = /\bi\s+hope\s+to\b|\bi'?d\s+like\s+to\b|\bone\s+day\s+i'?ll\b|\bmy\s+dream\s+is\s+to\b/
const PAST_TENSE_INTENT_RE = /\b(had|did|went|was|were|visited|called)\b/
const BARE_VERB_NO_SUBJECT_RE = /^(have|get|go|do|make|take|call|visit)\b/

export function evaluateStateFutureIntent(text, { situationForm = 'decision', independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  const NATURAL_BY_FORM = {
    decision: "I'll have the pasta, thanks.",
    plan: "I'm going to visit my sister next week.",
    prediction: 'It will probably rain later.',
    hope: 'I hope to travel more one day.',
  }
  r.naturalVersion = NATURAL_BY_FORM[situationForm] || NATURAL_BY_FORM.decision
  if (!n) return { ...r, understood: false, completedObjective: false, errorType: 'empty', retryRequired: true, retryPrompt: 'b1RetryPromptFutureEmpty' }
  if (PAST_TENSE_INTENT_RE.test(n)) {
    return { ...r, errorType: 'wrong_tense_past', priorityCorrection: 'b1RetryExplainFuturePast', explanation: 'b1RetryExplainFuturePast', retryRequired: true, retryPrompt: 'b1RetryPromptFuturePast' }
  }
  if (BARE_VERB_NO_SUBJECT_RE.test(n) && wordCount(n) <= 2) {
    return { ...r, errorType: 'insufficient_form_telegraphic', priorityCorrection: 'b1RetryExplainFutureForm', explanation: 'b1RetryExplainFutureForm', retryRequired: true, retryPrompt: 'b1RetryPromptFutureForm' }
  }

  const forms = {
    decision: WILL_DECISION_RE.test(n),
    plan: GOING_TO_PLAN_RE.test(n),
    prediction: PREDICTION_RE.test(n),
    hope: HOPE_RE.test(n),
  }

  if (forms[situationForm]) {
    r.completedObjective = true
    r.confidence = 0.9
    r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseFutureIndependent' : 'b1PraiseFutureHelped'
    return r
  }
  const usedOtherForm = Object.entries(forms).some(([key, matched]) => key !== situationForm && matched)
  if (usedOtherForm) {
    return { ...r, errorType: 'near_miss_wrong_function', priorityCorrection: 'b1RetryExplainFutureFunction', explanation: 'b1RetryExplainFutureFunction', retryRequired: true, retryPrompt: 'b1RetryPromptFutureFunction' }
  }
  return { ...r, errorType: 'no_future_form', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptFutureForm' }
}

// either clause order is valid English: "if X, will Y" or "will Y if X"
const FIRST_CONDITIONAL_RE = /\bif\b[\s\S]{2,50}\b(will|won'?t|'ll)\b|\b(will|won'?t|'ll)\b[\s\S]{2,50}\bif\b/
const IF_CLAUSE_RE = /\bif\b/
const WILL_OR_LL_RE = /\b(will|won'?t|'ll)\b/
const WOULD_LEAK_RE = /\bwould\b|\b\w+'d\b/

export function evaluateStateRealCondition(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "If it rains tomorrow, I'll stay home."
  if (!n) return { ...r, understood: false, completedObjective: false, errorType: 'empty', retryRequired: true, retryPrompt: 'b1RetryPromptConditionEmpty' }

  if (WOULD_LEAK_RE.test(n) && IF_CLAUSE_RE.test(n)) {
    return { ...r, errorType: 'wrong_conditional_hypothetical', priorityCorrection: 'b1RetryExplainConditionReal', explanation: 'b1RetryExplainConditionReal', retryRequired: true, retryPrompt: 'b1RetryPromptConditionReal' }
  }
  if (FIRST_CONDITIONAL_RE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.9
    r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseConditionIndependent' : 'b1PraiseConditionHelped'
    return r
  }
  if (IF_CLAUSE_RE.test(n) && !WILL_OR_LL_RE.test(n)) {
    return { ...r, errorType: 'missing_will_clause', priorityCorrection: 'b1RetryExplainConditionWill', explanation: 'b1RetryExplainConditionWill', retryRequired: true, retryPrompt: 'b1RetryPromptConditionWill' }
  }
  if (!IF_CLAUSE_RE.test(n) && WILL_OR_LL_RE.test(n)) {
    return { ...r, errorType: 'missing_if_clause', priorityCorrection: 'b1RetryExplainConditionIf', explanation: 'b1RetryExplainConditionIf', retryRequired: true, retryPrompt: 'b1RetryPromptConditionIf' }
  }
  return { ...r, errorType: 'no_condition', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptConditionIf' }
}

const HYPOTHETICAL_FRAME_RE = /\bif\s+i\s+were\s+you\b|\bin\s+your\s+position\b/
const ADVICE_RE = /\bi'?d\s+\w+/

export function evaluateStateHypothetical(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "If I were you, I'd ask for more details before deciding."
  if (!n) return { ...r, understood: false, completedObjective: false, errorType: 'empty', retryRequired: true, retryPrompt: 'b1RetryPromptHypotheticalEmpty' }

  const hasFrame = HYPOTHETICAL_FRAME_RE.test(n)
  const hasAdvice = ADVICE_RE.test(n)

  if (hasFrame && hasAdvice) {
    r.completedObjective = true
    r.confidence = 0.9
    r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseHypotheticalIndependent' : 'b1PraiseHypotheticalHelped'
    return r
  }
  if (hasFrame && !hasAdvice) {
    return { ...r, errorType: 'missing_advice', priorityCorrection: 'b1RetryExplainHypotheticalAdvice', explanation: 'b1RetryExplainHypotheticalAdvice', retryRequired: true, retryPrompt: 'b1RetryPromptHypotheticalAdvice' }
  }
  if (!hasFrame && hasAdvice) {
    return { ...r, errorType: 'missing_hypothetical_frame', priorityCorrection: 'b1RetryExplainHypotheticalFrame', explanation: 'b1RetryExplainHypotheticalFrame', retryRequired: true, retryPrompt: 'b1RetryPromptHypotheticalFrame' }
  }
  return { ...r, errorType: 'no_hypothetical', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptHypotheticalFrame' }
}

/* ---------------------------------------------------------------------------
 * arc 6 — change_topic (role: initiate | follow), ask_follow_up, summarize_other
 *
 * b1.json arc 6's `risk` flags discourse-level evaluation as needing the
 * immediately preceding partner turn. Resolved read-only in
 * core-engine-findings.md §15.2: the runtime already threads a `turnContext`
 * (`{ linguaSaid }`) through every free-reply evaluation call. These
 * evaluators read `ctx.turnContext.linguaSaid` the same way any other B1
 * evaluator reads an ordinary context field — no new mechanism.
 * ------------------------------------------------------------------------- */

function tooSimilarToPriorTurn(n, turnContext) {
  if (!turnContext || !turnContext.linguaSaid) return false
  return normalize(turnContext.linguaSaid) === n
}

const TOPIC_CHANGE_MARKER_RE = /\bby the way\b|\banyway\b|\bspeaking of\b/

export function evaluateChangeTopic(text, { role = 'initiate', independent = false, turnContext } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'Anyway, have you tried the new café downtown?'
  if (!n) return { ...r, understood: false, completedObjective: false, errorType: 'empty', retryRequired: true, retryPrompt: 'b1RetryPromptTopicEmpty' }
  if (tooSimilarToPriorTurn(n, turnContext)) {
    return { ...r, errorType: 'just_repeating_partner', priorityCorrection: 'b1RetryExplainTopicRepeat', explanation: 'b1RetryExplainTopicRepeat', retryRequired: true, retryPrompt: 'b1RetryPromptTopicRepeat' }
  }

  const hasMarker = TOPIC_CHANGE_MARKER_RE.test(n)
  // a plain word count is a weak content signal on its own (nonsense text
  // can easily clear a low bar) — kept intentionally high enough that
  // genuine nonsense falls through to the inconclusive catch-all rather
  // than a false-confident "missing marker" reject (see §15.1)
  const hasContent = wordCount(n) >= 5

  if (role === 'follow') {
    // following someone else's change: genuine engagement with the new
    // topic matters more than reusing an initiating marker
    if (hasContent) {
      r.completedObjective = true
      r.confidence = 0.85
      r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseTopicFollowIndependent' : 'b1PraiseTopicFollowHelped'
      return r
    }
    return { ...r, errorType: 'insufficient_follow', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptTopicFollow' }
  }

  if (hasMarker && hasContent) {
    r.completedObjective = true
    r.confidence = 0.9
    r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseTopicChangeIndependent' : 'b1PraiseTopicChangeHelped'
    return r
  }
  if (hasMarker && !hasContent) {
    return { ...r, errorType: 'topic_change_no_content', priorityCorrection: 'b1RetryExplainTopicContent', explanation: 'b1RetryExplainTopicContent', retryRequired: true, retryPrompt: 'b1RetryPromptTopicContent' }
  }
  if (!hasMarker && hasContent) {
    return { ...r, errorType: 'missing_topic_change_marker', priorityCorrection: 'b1RetryExplainTopicMarker', explanation: 'b1RetryExplainTopicMarker', retryRequired: true, retryPrompt: 'b1RetryPromptTopicMarker' }
  }
  return { ...r, errorType: 'no_topic_change', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptTopicMarker' }
}

const FOLLOW_UP_MARKER_RE = /\breally\b|\bwhy\b|\bwhat happened\b|\bhow come\b|\bwhat do you mean\b|\btell me more\b|\bwhat was that like\b/

export function evaluateAskFollowUp(text, { independent = false, turnContext } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = 'Really? What happened?'
  if (!n) return { ...r, understood: false, completedObjective: false, errorType: 'empty', retryRequired: true, retryPrompt: 'b1RetryPromptFollowUpEmpty' }
  if (tooSimilarToPriorTurn(n, turnContext)) {
    return { ...r, errorType: 'just_repeating_partner', priorityCorrection: 'b1RetryExplainFollowUpRepeat', explanation: 'b1RetryExplainFollowUpRepeat', retryRequired: true, retryPrompt: 'b1RetryPromptFollowUpRepeat' }
  }

  if (FOLLOW_UP_MARKER_RE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.9
    r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseFollowUpIndependent' : 'b1PraiseFollowUpHelped'
    return r
  }
  if (wordCount(n) <= 1) {
    return { ...r, errorType: 'insufficient_form', priorityCorrection: 'b1RetryExplainFollowUpForm', explanation: 'b1RetryExplainFollowUpForm', retryRequired: true, retryPrompt: 'b1RetryPromptFollowUpForm' }
  }
  return { ...r, errorType: 'no_follow_up_marker', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptFollowUpForm' }
}

const SUMMARY_MARKER_RE = /\bso basically\b|\bwhat you'?re saying is\b|\bso what you mean is\b|\bin other words\b/

export function evaluateSummarizeOther(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "So basically, you're saying the flight got delayed."
  if (!n) return { ...r, understood: false, completedObjective: false, errorType: 'empty', retryRequired: true, retryPrompt: 'b1RetryPromptSummaryEmpty' }

  const hasMarker = SUMMARY_MARKER_RE.test(n)
  const hasContent = wordCount(n) >= 6

  if (hasMarker && hasContent) {
    r.completedObjective = true
    r.confidence = 0.88
    r.praiseKey = r.masteryEvidence.independent ? 'b1PraiseSummaryIndependent' : 'b1PraiseSummaryHelped'
    return r
  }
  if (hasMarker && !hasContent) {
    return { ...r, errorType: 'summary_too_short', priorityCorrection: 'b1RetryExplainSummaryContent', explanation: 'b1RetryExplainSummaryContent', retryRequired: true, retryPrompt: 'b1RetryPromptSummaryContent' }
  }
  if (!hasMarker && hasContent) {
    return { ...r, errorType: 'missing_summary_marker', priorityCorrection: 'b1RetryExplainSummaryMarker', explanation: 'b1RetryExplainSummaryMarker', retryRequired: true, retryPrompt: 'b1RetryPromptSummaryMarker' }
  }
  return { ...r, errorType: 'no_summary', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b1RetryPromptSummaryMarker' }
}

/* Dispatcher for this arc's intents, mirroring `evaluateFree`'s own shape so a
 * future merge is mechanical. Grows as later arcs land. */
export function evaluateB1Free(kind, text, ctx = {}) {
  switch (kind) {
    case 'narrate_past_event': return evaluateNarratePastEvent(text, ctx)
    case 'state_opinion': return evaluateStateOpinion(text, ctx)
    case 'agree_or_disagree': return evaluateAgreeOrDisagree(text, ctx)
    case 'compare_and_choose': return evaluateCompareAndChoose(text, ctx)
    case 'describe_experience': return evaluateDescribeExperience(text, ctx)
    case 'recommend_or_warn': return evaluateRecommendOrWarn(text, ctx)
    case 'report_problem': return evaluateReportProblem(text, ctx)
    case 'negotiate_solution': return evaluateNegotiateSolution(text, ctx)
    case 'state_future_intent': return evaluateStateFutureIntent(text, ctx)
    case 'state_real_condition': return evaluateStateRealCondition(text, ctx)
    case 'state_hypothetical': return evaluateStateHypothetical(text, ctx)
    case 'change_topic': return evaluateChangeTopic(text, ctx)
    case 'ask_follow_up': return evaluateAskFollowUp(text, ctx)
    case 'summarize_other': return evaluateSummarizeOther(text, ctx)
    default: return { ...base(ctx.independent), understood: false, conclusive: true, retryRequired: true }
  }
}
