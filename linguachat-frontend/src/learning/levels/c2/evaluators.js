/*
 * c2/evaluators — C2's own local-evaluator functions, one per intent
 * (`levels/c2/c2Intents.js`'s 13 entries, five of them multi-canDo via
 * subtype/canDoId, matching `c2EvaluationContracts.js`'s exact contracts).
 * Same authoring pattern as every level before it: a taught frame matched by
 * regex, explicit near-miss/wrong-meaning reject patterns each with their
 * own `errorType`, and a catch-all that is always `conclusive: false` so a
 * genuine, unanticipated attempt is never falsely rejected.
 *
 * `base()`, `discourseCoherenceJudgment` and its helpers are a deliberate
 * copy of `levels/c1/evaluators.js`'s own implementation (itself a copy of
 * B2's) rather than a cross-level import — a level's own evaluator file does
 * not depend on a peer level's module, the isolation
 * `curriculum-isolation-plan.md` (`LC-FND-002`) establishes for content.
 * `normalize` IS exported from `engine/responseEvaluation.js` and is
 * imported directly, matching every level's own precedent.
 *
 * PRAGMATICALLY INAPPROPRIATE IS A BASE CATEGORY HERE (c2.md section 11),
 * unlike every level below: `looksDismissive()` is a shared, deliberately
 * narrow structural floor (casual dismissal markers — "lol", "whatever",
 * "ugh", "duh", "who cares" — never a claim of verified tone), checked
 * before the positive match in every evaluator below so a grammatically
 * fine but dismissive reply cannot pass on marker presence alone.
 *
 * THREE BARE INTENT IDS ARE REUSED FROM LOWER LEVELS, NOT MINTED FRESH
 * (`c2Capabilities.js`'s own header comment on `C2_CAN_DO_INTENT`, and
 * `curriculum/levelMaps.js`'s own registry — the same bare-intent-across-
 * levels shape Pre-A1/A1/A2 already established for `cafe_order_conversation`/
 * `repair_request`/`use_quantity`): `qualify_claim` and `synthesize_viewpoints`
 * from C1, `shift_register` from B2. Each is dispatched from a SINGLE
 * `case` in `engine/responseEvaluation.js`'s switch (a duplicate case label
 * is a `SyntaxError`, and a second one would silently be dead code even if
 * it weren't) — the case itself branches on `ctx.canDoId` membership in this
 * file's own `C2_..._CAN_DO_IDS` sets, calling the lower level's existing
 * function unchanged for its own can-dos and this file's C2-specific
 * function otherwise. See `responseEvaluation.js`'s own comment on those
 * three cases for the exact wiring.
 *
 * TWO REAL SCORING DIMENSIONS ARE POPULATED HERE, PER `c2EvaluationContracts.js`:
 *   - `registerAppropriateness` — for the five capabilities
 *     `C2_REGISTER_APPROPRIATENESS_OPT_IN` opts in, closed register-pair
 *     vocabulary matched against C2's own `register_shift_lexis_pattern`/
 *     `face_saving_disagreement_pattern`/`lexical_precision_substitution_pattern`
 *     forms (deliberately NOT C1's/B2's own marker lists — different taught
 *     vocabulary, crediting one against the other's spaced-retrieval record
 *     would credit language the learner was never taught here, the same
 *     `academic_hedging_pattern`/`renamedFrom` discipline `c2Patterns.js`
 *     itself documents for hedging).
 *   - `discourseCoherence` — for the four capabilities
 *     `C2_DISCOURSE_COHERENCE_OPT_IN` opts in, generalizing C1's own
 *     sentence-boundary judgment to a multi-turn SPAN when the step supplies
 *     one (`ctx.spanTurns`, see below).
 *
 * MULTI-TURN EVALUATION SPAN (`coreEngineRequirements[0]`) is additive and
 * new to this file: a step carrying `evaluationSpan: 'multiTurn'` supplies
 * `ctx.spanTurns` (`{ speaker, textEn }[]`, the preceding turn(s) — wired by
 * `components/episode/EpisodeShell.jsx` straight off the step's own
 * `turnContext` field, kept as a SEPARATE ctx key from the pre-existing
 * scalar `turnContext` object every level's `submitFree()` already builds
 * for a different purpose (`{ linguaSaid }`), never overloaded). Three
 * capabilities need it structurally (`sustain_coherence_across_topic_shifts`,
 * `function_inside_an_unfamiliar_high_ambiguity_exchange`,
 * `mediate_a_complex_disagreement_for_a_third_party`); a fourth,
 * `repair_a_misunderstanding_at_intention_level`, receives `spanTurns` too
 * (arc 6's own authored exception, `core-engine-handoff.md` section 4.1) but
 * without the level's own `evaluationSpan` flag — its evaluator reads
 * `ctx.spanTurns` directly rather than gating on the flag.
 *
 * SOURCE TEXT (`sourceRef`/`sourceTextEn`) needed NO new engine work: the
 * mechanism `EpisodeShell.jsx` already built for B2's mediation intents
 * (walk back to the nearest preceding `scene` step's own `sourceTextEn`)
 * is generic over string length, so C2's longer (1-4 sentence) source
 * passages resolve through the exact same `ctx.sourceText` path B2 used for
 * one clause — confirmed by reading that resolution code directly rather
 * than assuming.
 *
 * THREE-TIER STRUCTURAL-FLOOR FALLBACK: this file's local judgment IS the
 * declared structural floor (`c2EvaluationContracts.js`'s
 * `C2_STRUCTURAL_FLOOR_FALLBACK`/`C2_MEANING_PRESERVATION_STRUCTURAL_FLOOR`)
 * for every hybrid intent below — most positive-accept conditions here are a
 * direct, literal implementation of that file's own declared floor string,
 * not an independently invented heuristic. `edit_for_precision`'s base
 * (hybrid) canDo, `edit_own_text_for_precision_and_tone`, has NO entry in
 * `C2_STRUCTURAL_FLOOR_FALLBACK` at all — a real gap in that file's own
 * authored table (its header already flags the two opt-in tables as this
 * task's own design choice, "worth a deliberate human/second-opinion check")
 * — filled here with the same register-notice-vs-casual-tone floor its own
 * worked examples demonstrate, documented at that function.
 */
import { normalize } from '../../engine/responseEvaluation.js'

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
const wordCount = (n) => (n ? n.split(' ').filter(Boolean).length : 0)

/* Which C2 can-dos this file's function must handle for each reused bare
 * intent id — see this file's own header for why. */
export const C2_QUALIFY_CLAIM_CAN_DO_IDS = new Set(['soften_or_intensify_a_claim', 'qualify_a_position_with_precision'])
export const C2_SYNTHESIZE_VIEWPOINTS_CAN_DO_IDS = new Set(['synthesize_multiple_viewpoints'])
export const C2_SHIFT_REGISTER_CAN_DO_IDS = new Set([
  'shift_register_deliberately', 'manage_face_in_disagreement', 'adapt_a_text_across_genre_and_register',
])

/* not a verbatim (or near-verbatim) copy of the source text — mirrors
 * `levels/b2/evaluators.js`'s/`levels/c1/evaluators.js`'s own `isVerbatimCopy`. */
function isVerbatimCopy(normalizedReply, sourceText) {
  if (!sourceText) return false
  const src = normalize(sourceText)
  if (!src) return false
  if (normalizedReply === src) return true
  const srcWords = src.split(' ')
  const replyWords = normalizedReply.split(' ')
  if (replyWords.length < 6) return false
  for (let i = 0; i + 8 <= srcWords.length; i++) {
    const slice = srcWords.slice(i, i + 8).join(' ')
    if (normalizedReply.includes(slice)) return true
  }
  return false
}

const REPETITION_STOPWORDS = new Set(['they', 'this', 'that', 'with', 'from', 'your', 'what', 'were', 'been', 'then', 'them', 'than'])
function isDegenerateRepetition(n) {
  const words = n.split(' ').filter((w) => w.length >= 4 && /^[a-z']+$/.test(w) && !REPETITION_STOPWORDS.has(w))
  if (words.length < 2 || words.length > 8) return false
  const distinct = new Set(words)
  return distinct.size / words.length <= 0.8
}

const CONTENT_WORD = /^[a-z]{4,}$/
function contentWords(text) {
  return new Set(normalize(text).split(' ').filter((w) => CONTENT_WORD.test(w)))
}

/* references at least one real content word from the source — the general
 * "attempted engagement with the actual source" floor several C2 hybrid
 * intents share, per `c2EvaluationContracts.js`'s `C2_STRUCTURAL_FLOOR_FALLBACK`. */
function referencesSource(n, sourceText) {
  if (!sourceText) return true // nothing to check against — do not fabricate a requirement
  const src = contentWords(sourceText)
  if (!src.size) return true
  return [...contentWords(n)].some((w) => src.has(w))
}

const DISMISSIVE_RE = /\b(lol|whatever|ugh+|duh|who cares?|honestly disgusting|forget it)\b/

/*
 * `pragmaticallyInappropriate` is a base category for every C2 intent
 * (c2.md section 11) — this is deliberately narrow (casual dismissal only,
 * never a claim of verified tone) rather than an attempt at a general
 * politeness classifier.
 */
function looksDismissive(n) {
  return DISMISSIVE_RE.test(n)
}

/* ---------------------------------------------------------------------- */
/* Discourse coherence — copied from `levels/c1/evaluators.js` (itself a   */
/* copy of B2's), generalized to an optional multi-turn SPAN.              */
/* ---------------------------------------------------------------------- */

const TOPIC_SHIFT_MARKERS = [
  'anyway', 'speaking of which', 'that reminds me', 'before i forget', 'by the way',
  'on a different note', 'while we\'re on it', 'and while we\'re at it', 'on top of that',
  'while on the subject', 'one more thing',
]
const CONTRADICTION_MARKERS = [
  'i take that back', "that's not true", 'actually no', "no, that's wrong",
  'on second thought no', "wait, that's not right",
]
const LINKING_CONNECTORS = [' and ', ' so ', ' because ', ' but ', ' however ', ' whereas ', ' although ', ' though ', ' since ', ' as a result ']

function splitSentences(rawText) {
  return String(rawText || '')
    .split(/[.!?]+|,\s+(?:and|but|so)\s+/i)
    .map((s) => normalize(s))
    .filter((s) => wordCount(s) >= 2)
}

function hasRealTopicShiftMarker(text) {
  return splitSentences(text).some((s) => TOPIC_SHIFT_MARKERS.some((m) => s.includes(m)) && wordCount(s) >= 3)
}

/*
 * `discourseCoherenceJudgment` — evaluated over the reply alone (the
 * within-turn case every level below C2 uses), OR, when `spanTurns` is
 * supplied, over the preceding turn(s)' text concatenated with the reply —
 * "coherent across a span" is the same shape as "coherent across sentences"
 * one level up: a real bridge/cohesion marker or genuine lexical overlap
 * with what came immediately before, not a flat, unconnected restart.
 */
export function discourseCoherenceJudgment(text, spanTurns = []) {
  const spanPrefix = (spanTurns || []).map((t) => t?.textEn || '').filter(Boolean).join('. ')
  const combined = spanPrefix ? `${spanPrefix}. ${text}` : text
  const n = normalize(combined)
  const sentences = splitSentences(combined)
  if (sentences.length < 2) {
    return { checked: true, coherent: true, clausesEvaluated: sentences.length, incoherenceType: null }
  }
  if (CONTRADICTION_MARKERS.some((m) => n.includes(m))) {
    return { checked: true, coherent: false, clausesEvaluated: sentences.length, incoherenceType: 'contradictory' }
  }
  if (hasRealTopicShiftMarker(combined)) {
    return { checked: true, coherent: true, clausesEvaluated: sentences.length, incoherenceType: null }
  }
  const hasConnector = LINKING_CONNECTORS.some((c) => n.includes(c))
  if (!hasConnector) {
    return { checked: true, coherent: false, clausesEvaluated: sentences.length, incoherenceType: 'flat_list' }
  }
  const sharesTopic = sentences.slice(1).some((s, i) => {
    const prev = contentWords(sentences[i])
    const cur = contentWords(s)
    return [...cur].some((w) => prev.has(w))
  })
  if (!sharesTopic) {
    return { checked: true, coherent: false, clausesEvaluated: sentences.length, incoherenceType: 'off_topic_drift' }
  }
  return { checked: true, coherent: true, clausesEvaluated: sentences.length, incoherenceType: null }
}

/* ---------------------------------------------------------------------- */
/* Register appropriateness — closed marker sets from C2's OWN vocabulary  */
/* (`register_shift_lexis_pattern`/`face_saving_disagreement_pattern`/     */
/* `lexical_precision_substitution_pattern`), never C1's/B2's own lists.   */
/* ---------------------------------------------------------------------- */

const REGISTER_FORMAL_C2 = [
  'we regret to inform you', 'we apologize', 'please be advised', 'please note that',
  'residents are asked to', 'notice:', 'would be advisable', 'we will notify you',
]
const REGISTER_INFORMAL_C2 = [
  'hey', "we don't have that", 'gonna', 'wanna', "won't work", 'sorry we', 'hey everyone',
]
function registerShiftAppropriateness(n, expectedRegister) {
  if (!expectedRegister) return { checked: false, appropriate: null, expectedRegister: null, detectedRegister: null }
  const hasFormal = REGISTER_FORMAL_C2.some((m) => n.includes(m))
  const hasInformal = REGISTER_INFORMAL_C2.some((m) => n.includes(m))
  const detected = hasFormal && !hasInformal ? 'formal' : hasInformal && !hasFormal ? 'informal' : hasFormal && hasInformal ? 'mixed' : 'unmarked'
  if (detected === 'mixed' || detected === 'unmarked') {
    return { checked: true, appropriate: null, expectedRegister, detectedRegister: detected }
  }
  return { checked: true, appropriate: detected === expectedRegister, expectedRegister, detectedRegister: detected }
}

const FACE_SAVING_RE = /\b(i take your point|that'?s fair,? though|that'?s fair,? but|i see what you mean,? but|fair enough,? but)\b/
function faceSavingAppropriateness(n) {
  const has = FACE_SAVING_RE.test(n)
  return { checked: true, appropriate: has ? true : null, expectedRegister: 'face_saving', detectedRegister: has ? 'face_saving' : 'unmarked' }
}

/* ---------------------------------------------------------------------- */
/* arc 1 — dense_input_synthesis                                           */
/* ---------------------------------------------------------------------- */

export function evaluateExtractArgument(text, { independent = false, sourceText = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "The author's claim is that the new policy may be doing more harm than good, based on falling attendance, though they hedge by admitting it could still be an adjustment period."
  if (!n) return empty(r)
  if (looksDismissive(n)) {
    return { ...r, errorType: 'pragmatically_inappropriate', priorityCorrection: 'c2RetryExplainExtractTone', explanation: 'c2RetryExplainExtractTone', retryRequired: true, retryPrompt: 'c2RetryPromptExtractTone' }
  }
  if (isVerbatimCopy(n, sourceText)) {
    return { ...r, errorType: 'verbatim_not_extracted', priorityCorrection: 'c2RetryExplainExtractAttempt', explanation: 'c2RetryExplainExtractAttempt', retryRequired: true, retryPrompt: 'c2RetryPromptExtractAttempt' }
  }
  if (wordCount(n) >= 6 && referencesSource(n, sourceText)) {
    r.completedObjective = true
    r.confidence = 0.86
    r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseExtractIndependent' : 'c2PraiseExtractHelped'
    return r
  }
  return { ...r, errorType: 'missing_claim_structure', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptExtractClaim' }
}

const AGREE_RE = /\b(agree|agrees|agreed|on the same page)\b/
const DISAGREE_RE = /\b(disagree|disagrees|disagreed|differ|differs|differed)\b/
const BOTH_SOURCES_RE = /\b(both (residents|reviews|sources|accounts|sides|of them) (agree|say)|where they differ is|one (says|feels|argues).* the other)\b/
const CONTRAST_CONNECTOR_RE = /\b(on the other hand|whereas|but|however|while)\b/

/* `synthesize_multiple_viewpoints` — the C2-specific implementation of the
 * bare `synthesize_viewpoints` intent, dispatched only for this canDo. */
export function evaluateC2SynthesizeViewpoints(text, { independent = false, sourceText = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "One resident feels the bike lane has clearly reduced traffic, while another argues the real effect was worse delivery-truck congestion - so the two accounts genuinely disagree, not just in framing."
  if (!n) return empty(r)
  if (looksDismissive(n)) {
    return { ...r, errorType: 'pragmatically_inappropriate', priorityCorrection: 'c2RetryExplainSynthesizeTone', explanation: 'c2RetryExplainSynthesizeTone', retryRequired: true, retryPrompt: 'c2RetryPromptSynthesizeTone' }
  }
  if (isVerbatimCopy(n, sourceText)) {
    return { ...r, errorType: 'verbatim_not_synthesized', priorityCorrection: 'c2RetryExplainSynthesizeAttempt', explanation: 'c2RetryExplainSynthesizeAttempt', retryRequired: true, retryPrompt: 'c2RetryPromptSynthesizeAttempt' }
  }
  const hasBoth = BOTH_SOURCES_RE.test(n) || (AGREE_RE.test(n) && DISAGREE_RE.test(n)) || (CONTRAST_CONNECTOR_RE.test(n) && wordCount(n) >= 12)
  if (hasBoth && referencesSource(n, sourceText)) {
    r.completedObjective = true
    r.confidence = 0.86
    r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseSynthesizeIndependent' : 'c2PraiseSynthesizeHelped'
    return r
  }
  return { ...r, errorType: 'only_one_viewpoint', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptSynthesizeBoth' }
}

const EVIDENTIALITY_RE = /\b(presumably|ostensibly|allegedly|according to|skeptical|doubtful|hedges?|uncommitted|not fully|not (certain|sure)|leaves? room for|admits?)\b/

export function evaluateIdentifyStance(text, { independent = false, sourceText = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "The author is skeptical of the policy but not fully committed to condemning it - the hedge shows they're leaving room for the adjustment-period explanation."
  if (!n) return empty(r)
  if (looksDismissive(n)) {
    return { ...r, errorType: 'pragmatically_inappropriate', priorityCorrection: 'c2RetryExplainStanceTone', explanation: 'c2RetryExplainStanceTone', retryRequired: true, retryPrompt: 'c2RetryPromptStanceTone' }
  }
  if (EVIDENTIALITY_RE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.86
    r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseStanceIndependent' : 'c2PraiseStanceHelped'
    return r
  }
  if (wordCount(n) >= 4 && referencesSource(n, sourceText)) {
    return { ...r, errorType: 'missing_certainty_evidence', priorityCorrection: 'c2RetryExplainStanceEvidence', explanation: 'c2RetryExplainStanceEvidence', retryRequired: true, retryPrompt: 'c2RetryPromptStanceEvidence' }
  }
  return { ...r, errorType: 'no_stance_read', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptStance' }
}

/* ---------------------------------------------------------------------- */
/* arc 2 — precise_reformulation                                           */
/* ---------------------------------------------------------------------- */

const REFORMULATION_CONNECTOR_RE = /\b(in other words|to put it another way|put simply|basically|so basically)\b/
const HEDGE_TOKEN_RE = /\b(if|unless|otherwise|might|may|could|probably|likely|roughly|about)\b/

export function evaluateReformulateForAudience(text, { independent = false, subtype = null, sourceText = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = subtype === 'summarize'
    ? 'New rule: receipts and a reason are required for expenses over $50, or reimbursement is delayed a few days.'
    : subtype === 'paraphrase'
      ? "If a claim is missing the receipt or the justification, it won't be processed - it'll just be sent back."
      : "From next month, if you spend more than $50, you'll need a receipt and a short note, or it gets sent back."
  if (!n) return empty(r)
  if (looksDismissive(n)) {
    return { ...r, errorType: 'pragmatically_inappropriate', priorityCorrection: 'c2RetryExplainReformulateTone', explanation: 'c2RetryExplainReformulateTone', retryRequired: true, retryPrompt: 'c2RetryPromptReformulateTone' }
  }
  if (isVerbatimCopy(n, sourceText)) {
    return { ...r, errorType: 'verbatim_not_reformulated', priorityCorrection: 'c2RetryExplainReformulateAttempt', explanation: 'c2RetryExplainReformulateAttempt', retryRequired: true, retryPrompt: 'c2RetryPromptReformulateAttempt' }
  }
  const hasConnector = REFORMULATION_CONNECTOR_RE.test(n) || wordCount(n) >= 10
  if (subtype === 'summarize') {
    const shorter = sourceText ? wordCount(n) < wordCount(normalize(sourceText)) : true
    if (hasConnector && shorter) {
      r.completedObjective = true
      r.confidence = 0.85
      r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseReformulateSummarizeIndependent' : 'c2PraiseReformulateSummarizeHelped'
      return r
    }
    return { ...r, errorType: shorter ? 'missing_summary_marker' : 'not_condensed', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptReformulateSummarize' }
  }
  if (subtype === 'paraphrase') {
    const sourceHasHedge = sourceText ? HEDGE_TOKEN_RE.test(normalize(sourceText)) : false
    const replyHasHedge = HEDGE_TOKEN_RE.test(n)
    if (hasConnector && (!sourceHasHedge || replyHasHedge)) {
      r.completedObjective = true
      r.confidence = 0.85
      r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseReformulateParaphraseIndependent' : 'c2PraiseReformulateParaphraseHelped'
      return r
    }
    return { ...r, errorType: sourceHasHedge ? 'flattened_condition' : 'missing_paraphrase_marker', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptReformulateParaphrase' }
  }
  // base — reformulate_dense_source_for_a_new_audience
  if (hasConnector) {
    r.completedObjective = true
    r.confidence = 0.85
    r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseReformulateIndependent' : 'c2PraiseReformulateHelped'
    return r
  }
  return { ...r, errorType: 'missing_reformulation_marker', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptReformulate' }
}

/* ---------------------------------------------------------------------- */
/* arc 3 — implication_and_subtext                                         */
/* ---------------------------------------------------------------------- */

const IMPLICATION_MARKER_RE = /\b(politely (saying|turning)|actual refusal|not (saying|directly)|means the opposite|ironic|sarcastic|actually|implied|implies?|inverted|the opposite)\b/
const LITERAL_ECHO_RE = /^(she|he|they) (said|is) /

export function evaluateRecognizeImplication(text, { independent = false, subtype = null, sourceText = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = subtype === 'irony'
    ? "They're being sarcastic - the meeting was actually really long, not quick at all."
    : subtype === 'indirect_speech_act'
      ? "Sorry about that - let me close the door and turn the music down."
      : "The stylist is politely saying no for this afternoon - the cancellation-list offer is a genuine but separate alternative, not a promise."
  if (!n) return empty(r)
  if (looksDismissive(n)) {
    return { ...r, errorType: 'pragmatically_inappropriate', priorityCorrection: 'c2RetryExplainImplicationTone', explanation: 'c2RetryExplainImplicationTone', retryRequired: true, retryPrompt: 'c2RetryPromptImplicationTone' }
  }
  if (subtype === 'indirect_speech_act') {
    // this subtype asks the learner to ACT on the implied request, not describe it
    const acts = wordCount(n) >= 3 && !/^(yes|it is|it'?s)\b/.test(n)
    if (acts) {
      r.completedObjective = true
      r.confidence = 0.85
      r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseImplicationIndirectIndependent' : 'c2PraiseImplicationIndirectHelped'
      return r
    }
    return { ...r, errorType: 'treated_as_literal_observation', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptImplicationIndirect' }
  }
  if (isVerbatimCopy(n, sourceText) || LITERAL_ECHO_RE.test(n)) {
    return { ...r, errorType: 'literal_restatement', priorityCorrection: 'c2RetryExplainImplicationLiteral', explanation: 'c2RetryExplainImplicationLiteral', retryRequired: true, retryPrompt: 'c2RetryPromptImplicationLiteral' }
  }
  if (IMPLICATION_MARKER_RE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.85
    r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseImplicationIndependent' : 'c2PraiseImplicationHelped'
    return r
  }
  return { ...r, errorType: 'no_implication_read', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptImplication' }
}

/* ---------------------------------------------------------------------- */
/* arc 4 — register_and_pragmatics (shift_register base + subtypes,        */
/* qualify_claim reuse)                                                    */
/* ---------------------------------------------------------------------- */

const NOTICE_REGISTER_RE = /\b(notice:|please be advised|we apologize (for|in advance))\b/

export function evaluateC2ShiftRegister(text, { independent = false, canDoId = null, registerCheck = false, expectedRegister = null } = {}) {
  const n = normalize(text)
  const r = base(independent)

  if (canDoId === 'manage_face_in_disagreement') {
    r.naturalVersion = "I take your point about speed, but I'd push back on skipping testing - I think we lose more time later if something breaks."
    if (!n) return empty(r)
    if (looksDismissive(n)) {
      return { ...r, errorType: 'pragmatically_inappropriate', priorityCorrection: 'c2RetryExplainFaceSaveTone', explanation: 'c2RetryExplainFaceSaveTone', retryRequired: true, retryPrompt: 'c2RetryPromptFaceSaveTone' }
    }
    r.registerAppropriateness = faceSavingAppropriateness(n)
    if (FACE_SAVING_RE.test(n)) {
      r.completedObjective = true
      r.confidence = 0.87
      r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseFaceSaveIndependent' : 'c2PraiseFaceSaveHelped'
      return r
    }
    return { ...r, errorType: 'missing_face_saving_concession', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptFaceSave' }
  }

  if (canDoId === 'adapt_a_text_across_genre_and_register') {
    r.naturalVersion = 'Notice: plumbing repairs are scheduled for Thursday. We apologize in advance for any noise during this work.'
    if (!n) return empty(r)
    r.registerAppropriateness = registerShiftAppropriateness(n, 'formal')
    if (NOTICE_REGISTER_RE.test(n)) {
      r.completedObjective = true
      r.confidence = 0.86
      r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseGenreIndependent' : 'c2PraiseGenreHelped'
      return r
    }
    return { ...r, errorType: 'not_genre_shifted', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptGenre' }
  }

  // shift_register_deliberately (base)
  r.naturalVersion = 'We regret to inform you that the item is currently out of stock; we will notify you as soon as it becomes available.'
  if (!n) return empty(r)
  if (looksDismissive(n)) {
    return { ...r, errorType: 'pragmatically_inappropriate', priorityCorrection: 'c2RetryExplainRegisterTone', explanation: 'c2RetryExplainRegisterTone', retryRequired: true, retryPrompt: 'c2RetryPromptRegisterTone' }
  }
  if (isDegenerateRepetition(n)) {
    return { ...r, errorType: 'repetitive_nonsense', priorityCorrection: 'c2RetryExplainRegisterForm', explanation: 'c2RetryExplainRegisterForm', retryRequired: true, retryPrompt: 'c2RetryPromptRegisterForm' }
  }
  if (registerCheck || expectedRegister) {
    r.registerAppropriateness = registerShiftAppropriateness(n, expectedRegister || 'formal')
  }
  const wantsInformal = expectedRegister === 'informal'
  const markers = wantsInformal ? REGISTER_INFORMAL_C2 : REGISTER_FORMAL_C2
  const wrongMarkers = wantsInformal ? REGISTER_FORMAL_C2 : REGISTER_INFORMAL_C2
  const hasRight = markers.some((m) => n.includes(m))
  const hasWrong = wrongMarkers.some((m) => n.includes(m))
  const hasMismatchedBlend = hasRight && hasWrong
  if (hasMismatchedBlend) {
    return { ...r, errorType: 'mismatched_register_blend', priorityCorrection: 'c2RetryExplainRegisterMismatch', explanation: 'c2RetryExplainRegisterMismatch', retryRequired: true, retryPrompt: 'c2RetryPromptRegisterMismatch' }
  }
  if (hasRight) {
    r.completedObjective = true
    r.confidence = 0.88
    r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseRegisterIndependent' : 'c2PraiseRegisterHelped'
    return r
  }
  if (hasWrong) {
    return { ...r, errorType: 'wrong_register', priorityCorrection: 'c2RetryExplainRegisterMismatch', explanation: 'c2RetryExplainRegisterMismatch', retryRequired: true, retryPrompt: 'c2RetryPromptRegisterMismatch' }
  }
  return { ...r, errorType: 'no_register_marker', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptRegisterForm' }
}

const HEDGE_RE = /\b(it could be argued that|arguably|to some extent|not necessarily|probably|likely|might|may|perhaps)\b/g
const BOOST_RE = /\b(undeniably|there is little doubt that|it is clear that|clearly|definitely)\b/g
const OVER_HEDGE_RE = /\b(maybe possibly|possibly perhaps|maybe.*possibly.*perhaps|might maybe)\b/
const OVER_BOOST_RE = /\b(undeniably.*(forever|always)|100%|exactly \w+ (month|week|day|year))\b/

export function evaluateC2QualifyClaim(text) {
  const n = normalize(text)
  const r = base(false)
  r.naturalVersion = "The launch will probably slip by about a week, though it's too early to be certain."
  if (!n) return empty(r)
  if (looksDismissive(n)) {
    return { ...r, errorType: 'pragmatically_inappropriate', priorityCorrection: 'c2RetryExplainQualifyTone', explanation: 'c2RetryExplainQualifyTone', retryRequired: true, retryPrompt: 'c2RetryPromptQualifyTone' }
  }
  if (OVER_HEDGE_RE.test(n) || (n.match(HEDGE_RE) || []).length >= 3) {
    return { ...r, errorType: 'over_hedged', priorityCorrection: 'c2RetryExplainQualifyProportion', explanation: 'c2RetryExplainQualifyProportion', retryRequired: true, retryPrompt: 'c2RetryPromptQualifyProportion' }
  }
  if (OVER_BOOST_RE.test(n)) {
    return { ...r, errorType: 'over_boosted', priorityCorrection: 'c2RetryExplainQualifyProportion', explanation: 'c2RetryExplainQualifyProportion', retryRequired: true, retryPrompt: 'c2RetryPromptQualifyProportion' }
  }
  if (HEDGE_RE.test(n) || BOOST_RE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.87
    r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseQualifyIndependent' : 'c2PraiseQualifyHelped'
    return r
  }
  return { ...r, errorType: 'no_hedge_or_boost', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptQualify' }
}

/* ---------------------------------------------------------------------- */
/* arc 5 — argument_and_position                                           */
/* ---------------------------------------------------------------------- */

const CONCESSION_RE = /\b(while .+ has merit|granted that|nevertheless|even so|that said|that'?s (a )?fair)\b/
const BARE_DISAGREE_RE = /^(no,?\s*that'?s not true|that'?s not true)/

export function evaluateDevelopArgument(text) {
  const n = normalize(text)
  const r = base(false)
  r.naturalVersion = "On balance, an honor system seems worth trying, since fees mostly punish people already struggling. That said, libraries would need some replacement, or books might not come back."
  if (!n) return empty(r)
  if (looksDismissive(n)) {
    return { ...r, errorType: 'pragmatically_inappropriate', priorityCorrection: 'c2RetryExplainArgumentTone', explanation: 'c2RetryExplainArgumentTone', retryRequired: true, retryPrompt: 'c2RetryPromptArgumentTone' }
  }
  const hasQualifier = HEDGE_RE.test(n) || BOOST_RE.test(n)
  const hasConcession = CONCESSION_RE.test(n)
  if (hasQualifier && hasConcession) {
    r.completedObjective = true
    r.confidence = 0.86
    r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseArgumentIndependent' : 'c2PraiseArgumentHelped'
    return r
  }
  if (wordCount(n) >= 5) {
    return { ...r, errorType: hasConcession ? 'missing_qualification' : 'missing_concession', priorityCorrection: 'c2RetryExplainArgumentStructure', explanation: 'c2RetryExplainArgumentStructure', retryRequired: true, retryPrompt: 'c2RetryPromptArgumentStructure' }
  }
  return { ...r, errorType: 'no_structured_argument', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptArgument' }
}

export function evaluateRebutCounterargument(text) {
  const n = normalize(text)
  const r = base(false)
  r.naturalVersion = "That's a fair concern, and it's probably true for a few people - but most late returns happen by accident anyway, so removing the fee likely won't change return rates much."
  if (!n) return empty(r)
  if (looksDismissive(n)) {
    return { ...r, errorType: 'pragmatically_inappropriate', priorityCorrection: 'c2RetryExplainRebutTone', explanation: 'c2RetryExplainRebutTone', retryRequired: true, retryPrompt: 'c2RetryPromptRebutTone' }
  }
  if (CONCESSION_RE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.86
    r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseRebutIndependent' : 'c2PraiseRebutHelped'
    return r
  }
  if (BARE_DISAGREE_RE.test(n)) {
    return { ...r, errorType: 'rebuttal_without_concession', priorityCorrection: 'c2RetryExplainRebutConcession', explanation: 'c2RetryExplainRebutConcession', retryRequired: true, retryPrompt: 'c2RetryPromptRebutConcession' }
  }
  return { ...r, errorType: 'no_rebuttal_structure', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptRebut' }
}

/* ---------------------------------------------------------------------- */
/* arc 6 — discourse_flexibility                                           */
/* ---------------------------------------------------------------------- */

const BRIDGE_MARKER_RE = /\b(insofar as|whereby|that said|by the same token|and while we'?re (on it|at it)|speaking of which)\b/
const CLARIFY_RE = /\b(not (totally|entirely) sure what you mean|can you say more|before we sort it out|what do you mean by)\b/
const EVADES_RE = /\b(nice weather|forget it,? it doesn'?t matter)\b/

export function evaluateSustainCoherence(text, { independent = false, subtype = null, spanTurns = [] } = {}) {
  const n = normalize(text)
  const r = base(independent)

  if (subtype === 'unfamiliar_exchange') {
    r.naturalVersion = "I'm not totally sure what you mean by that - do you mean the amounts, or how often each of us pays?"
    if (!n) return empty(r)
    if (looksDismissive(n) || EVADES_RE.test(n)) {
      return { ...r, errorType: 'evaded_ambiguity', priorityCorrection: 'c2RetryExplainUnfamiliarEngage', explanation: 'c2RetryExplainUnfamiliarEngage', retryRequired: true, retryPrompt: 'c2RetryPromptUnfamiliarEngage' }
    }
    r.discourseCoherence = discourseCoherenceJudgment(text, spanTurns)
    if (CLARIFY_RE.test(n)) {
      r.completedObjective = true
      r.confidence = 0.85
      r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseUnfamiliarIndependent' : 'c2PraiseUnfamiliarHelped'
      return r
    }
    return { ...r, errorType: 'no_clarification_attempt', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptUnfamiliar' }
  }

  // sustain_coherence_across_topic_shifts (base)
  r.naturalVersion = "Yeah, that's fair - and while we're on it, I think the grocery money split has been uneven too."
  if (!n) return empty(r)
  if (looksDismissive(n)) {
    return { ...r, errorType: 'pragmatically_inappropriate', priorityCorrection: 'c2RetryExplainSustainTone', explanation: 'c2RetryExplainSustainTone', retryRequired: true, retryPrompt: 'c2RetryPromptSustainTone' }
  }
  r.discourseCoherence = discourseCoherenceJudgment(text, spanTurns)
  if (r.discourseCoherence.checked && r.discourseCoherence.coherent === false) {
    return { ...r, errorType: `topic_bridge_${r.discourseCoherence.incoherenceType}`, priorityCorrection: 'c2RetryExplainSustainBridge', explanation: 'c2RetryExplainSustainBridge', retryRequired: true, retryPrompt: 'c2RetryPromptSustainBridge' }
  }
  if (BRIDGE_MARKER_RE.test(n) || hasRealTopicShiftMarker(text)) {
    r.completedObjective = true
    r.confidence = 0.86
    r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseSustainIndependent' : 'c2PraiseSustainHelped'
    return r
  }
  return { ...r, errorType: 'unsignalled_topic_shift', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptSustainBridge' }
}

const REPAIR_INTENTION_RE = /\b(i didn'?t mean (it as|to)|sorry,? i didn'?t mean|i didn'?t mean to imply|that'?s not what i meant)\b/
const FACT_ONLY_REPAIR_RE = /\b(i checked|the receipts show|no,? we'?re not)\b/

export function evaluateRepairAtIntentionLevel(text, { independent = false, spanTurns = [] } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "Sorry, I didn't mean it as an accusation - I just meant we should double check the numbers together, since I think it's gotten uneven by accident."
  if (!n) return empty(r)
  if (looksDismissive(n)) {
    return { ...r, errorType: 'pragmatically_inappropriate', priorityCorrection: 'c2RetryExplainRepairTone', explanation: 'c2RetryExplainRepairTone', retryRequired: true, retryPrompt: 'c2RetryPromptRepairTone' }
  }
  r.discourseCoherence = discourseCoherenceJudgment(text, spanTurns)
  if (REPAIR_INTENTION_RE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.87
    r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseRepairIndependent' : 'c2PraiseRepairHelped'
    return r
  }
  if (FACT_ONLY_REPAIR_RE.test(n)) {
    return { ...r, errorType: 'repaired_fact_not_intention', priorityCorrection: 'c2RetryExplainRepairIntention', explanation: 'c2RetryExplainRepairIntention', retryRequired: true, retryPrompt: 'c2RetryPromptRepairIntention' }
  }
  return { ...r, errorType: 'no_intention_repair', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptRepair' }
}

/* ---------------------------------------------------------------------- */
/* arc 7 — stylistic_control                                               */
/* ---------------------------------------------------------------------- */

const CASUAL_OPENER_RE = /^(hey|hi) /

/*
 * `edit_own_text_for_precision_and_tone`'s structural floor has no entry in
 * `c2EvaluationContracts.js`'s `C2_STRUCTURAL_FLOOR_FALLBACK` — see this
 * file's own header. Authored directly against this capability's own
 * worked examples: a notice-register marker present, no casual opener.
 */
export function evaluateEditForPrecision(text, { independent = false, subtype = null } = {}) {
  const n = normalize(text)
  const r = base(independent)

  if (subtype === 'lexical_variety') {
    r.naturalVersion = 'The main issue is the schedule; the budget is a second concern. Both need addressing, and the sooner the better.'
    if (!n) return empty(r)
    if (looksDismissive(n)) {
      return { ...r, errorType: 'pragmatically_inappropriate', priorityCorrection: 'c2RetryExplainVarietyTone', explanation: 'c2RetryExplainVarietyTone', retryRequired: true, retryPrompt: 'c2RetryPromptVarietyTone' }
    }
    const repeatedProblemWord = /\b(problem|issue)\b.*\b(problem|issue)\b/.test(n)
    if (repeatedProblemWord) {
      return { ...r, errorType: 'repeated_vague_noun', priorityCorrection: 'c2RetryExplainVarietySubstitute', explanation: 'c2RetryExplainVarietySubstitute', retryRequired: true, retryPrompt: 'c2RetryPromptVarietySubstitute' }
    }
    if (wordCount(n) >= 6) {
      r.completedObjective = true
      r.confidence = 0.85
      r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseVarietyIndependent' : 'c2PraiseVarietyHelped'
      return r
    }
    return { ...r, errorType: 'too_short_to_judge_variety', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptVariety' }
  }

  // edit_own_text_for_precision_and_tone (base)
  r.naturalVersion = 'Notice: the elevator will be out of service next week. Please use the stairs during this time.'
  if (!n) return empty(r)
  if (looksDismissive(n)) {
    return { ...r, errorType: 'pragmatically_inappropriate', priorityCorrection: 'c2RetryExplainEditTone', explanation: 'c2RetryExplainEditTone', retryRequired: true, retryPrompt: 'c2RetryPromptEditTone' }
  }
  r.registerAppropriateness = registerShiftAppropriateness(n, 'formal')
  if (CASUAL_OPENER_RE.test(n)) {
    return { ...r, errorType: 'still_casual_tone', priorityCorrection: 'c2RetryExplainEditTone2', explanation: 'c2RetryExplainEditTone2', retryRequired: true, retryPrompt: 'c2RetryPromptEditTone' }
  }
  if (wordCount(n) >= 6) {
    r.completedObjective = true
    r.confidence = 0.84
    r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseEditIndependent' : 'c2PraiseEditHelped'
    return r
  }
  return { ...r, errorType: 'too_short_to_judge_edit', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptEdit' }
}

/* ---------------------------------------------------------------------- */
/* arc 8 — integrated_mediation (capstone)                                 */
/* ---------------------------------------------------------------------- */

const TAKES_SIDE_RE = /\b(the \w+ is right that|the \w+ is wrong that|shouldn'?t have to pay yet|should have to pay)\b/
const FIRST_PERSON_STANCE_RE = /\bi (think|believe|feel like|agree|side with) (the|that)\b/
const BOTH_SIDES_RE = /\b(both sides|both parties|on one hand.*on the other)\b/

export function evaluateMediateDisagreement(text, { independent = false, spanTurns = [] } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "The landlord believes the tenant owes the increased rent because notice was given; the tenant disputes this, saying nothing was received in writing. A useful next step might be for the landlord to produce any written notice and for both sides to agree on a clear cutoff date."
  if (!n) return empty(r)
  if (looksDismissive(n)) {
    return { ...r, errorType: 'pragmatically_inappropriate', priorityCorrection: 'c2RetryExplainMediateTone', explanation: 'c2RetryExplainMediateTone', retryRequired: true, retryPrompt: 'c2RetryPromptMediateTone' }
  }
  r.discourseCoherence = discourseCoherenceJudgment(text, spanTurns)
  r.registerAppropriateness = registerShiftAppropriateness(n, 'formal')
  if (TAKES_SIDE_RE.test(n) || FIRST_PERSON_STANCE_RE.test(n)) {
    return { ...r, errorType: 'editorializes_instead_of_mediating', priorityCorrection: 'c2RetryExplainMediateNeutral', explanation: 'c2RetryExplainMediateNeutral', retryRequired: true, retryPrompt: 'c2RetryPromptMediateNeutral' }
  }
  const namesBothParties = spanTurns.length >= 2
    ? spanTurns.every((t) => t?.speaker && normalize(t.speaker).split(' ').some((w) => n.includes(w)))
    : BOTH_SIDES_RE.test(n)
  if ((namesBothParties || BOTH_SIDES_RE.test(n)) && wordCount(n) >= 15) {
    r.completedObjective = true
    r.confidence = 0.85
    r.praiseKey = r.masteryEvidence.independent ? 'c2PraiseMediateIndependent' : 'c2PraiseMediateHelped'
    return r
  }
  return { ...r, errorType: 'incomplete_mediation', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c2RetryPromptMediate' }
}
