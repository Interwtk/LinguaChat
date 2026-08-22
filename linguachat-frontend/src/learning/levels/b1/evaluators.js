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

/* Dispatcher for this arc's intents, mirroring `evaluateFree`'s own shape so a
 * future merge is mechanical. Grows as later arcs land. */
export function evaluateB1Free(kind, text, ctx = {}) {
  switch (kind) {
    case 'narrate_past_event': return evaluateNarratePastEvent(text, ctx)
    default: return { ...base(ctx.independent), understood: false, conclusive: true, retryRequired: true }
  }
}
