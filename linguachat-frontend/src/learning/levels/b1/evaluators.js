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
    default: return { ...base(ctx.independent), understood: false, conclusive: true, retryRequired: true }
  }
}
