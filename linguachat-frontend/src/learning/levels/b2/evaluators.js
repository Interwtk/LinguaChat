/*
 * b2/evaluators — B2's own local-evaluator functions, one per new intent
 * (`b2Intents.js`'s 14 intents, examples authored there are the worked
 * correct/variant/near-miss/wrong-meaning/nonsense spec every function below
 * is written against). Same authoring pattern as `engine/responseEvaluation.js`
 * and `levels/a2/evaluators.js`/`levels/b1/evaluators.js` before it: a taught
 * frame matched by regex, explicit near-miss/wrong-meaning reject patterns
 * each with their own `errorType`, and a catch-all that is always
 * `conclusive: false` so a genuine, unanticipated attempt is never falsely
 * rejected — never escalated to "wrong", only "not yet confirmed".
 *
 * `base()` is a deliberate, exact copy of the shared `base()` in
 * `engine/responseEvaluation.js` (not importable: it is not exported from
 * that module), matching `levels/b1/evaluators.js`'s own precedent.
 * `normalize`/`fold` ARE exported there and are imported directly rather
 * than duplicated, matching `levels/a2/evaluators.js`'s own precedent.
 *
 * TWO REAL SCORING DIMENSIONS IMPLEMENTED HERE (per
 * `docs/curriculum/core-engine-requirements.md`, previously only a scaffolded
 * `{ checked: false }` default in every evaluator's `base()`):
 *
 *   - `registerAppropriateness` — local-first, closed register-pair
 *     vocabulary lookup (`REGISTER_FORMAL`/`REGISTER_INFORMAL`,
 *     `HEDGING`/`INTENSIFYING`, `DIPLOMATIC`/`BLUNT`), populated for exactly
 *     the three capabilities `b2EvaluationContracts.js`'s
 *     `B2_REGISTER_APPROPRIATENESS_OPT_IN` opts in.
 *   - `discourseCoherence` — generalizes A2's own `twoClauseJudgment` two-clause
 *     precedent (`levels/a2/evaluators.js`) from two clauses to N sentences
 *     within one turn, populated for exactly the three capstone capabilities
 *     `B2_DISCOURSE_COHERENCE_OPT_IN` opts in. `discourseCoherenceJudgment()`
 *     below is proven against all four `B2_DISCOURSE_COHERENCE_REFUSAL_FIXTURES`
 *     shapes (contradictory / flat_list / off_topic_drift / coherent control)
 *     by `scripts/foundry/b2/check-b2-discourse-coherence.mjs`.
 *
 * THREE-TIER STRUCTURAL-FLOOR FALLBACK (`b2EvaluationContracts.js`'s
 * `B2_STRUCTURAL_FLOOR_FALLBACK`/`B2_MEANING_PRESERVATION_STRUCTURAL_FLOOR`):
 * for `argue_opinion_with_reason`/`weigh_options`/`propose_a_resolution` and
 * `summarize_for_third_party`/`reformulate_for_clarity`/`report_third_party_opinion`,
 * this file's local judgment IS the declared structural floor — a clear
 * structural match is a conclusive local accept (provider not needed, the
 * common case), a clear structural miss is a conclusive local reject, and a
 * genuinely ambiguous reply is `conclusive: false`. The existing hybrid
 * router (`engine/hybridEvaluation.js`) already implements the three tiers
 * on top of that shape: provider-graded when `shouldEscalate()` is true and a
 * remote is reachable; this file's structural floor verdict reused,
 * `source: 'fallback'`, when it is not — never silently upgraded to a
 * confirmed pass. Nothing here ever claims verified meaning-preservation
 * (that needs the provider); the local floor only checks non-verbatim +
 * marker presence, exactly as declared.
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
})

const empty = (r) => ({ ...r, understood: false, confidence: 0.95, errorType: 'empty', conclusive: true, retryRequired: true })
const wordCount = (n) => (n ? n.split(' ').filter(Boolean).length : 0)

/* not a verbatim (or near-verbatim) copy of the source text — the one hard
 * requirement every structural floor for mediation/reformulation shares. */
function isVerbatimCopy(normalizedReply, sourceText) {
  if (!sourceText) return false
  const src = normalize(sourceText)
  if (!src) return false
  if (normalizedReply === src) return true
  // a reply that is mostly a long contiguous slice of the source (>=8 words
  // shared in order) is still "copied", not reformulated/summarized.
  const srcWords = src.split(' ')
  const replyWords = normalizedReply.split(' ')
  if (replyWords.length < 6) return false
  for (let i = 0; i + 8 <= srcWords.length; i++) {
    const slice = srcWords.slice(i, i + 8).join(' ')
    if (normalizedReply.includes(slice)) return true
  }
  return false
}

/*
 * A short reply dominated by one or two repeated content words ("that's
 * true, but that's true", "could you possibly could you possibly") reads as
 * nonsense rather than a genuine attempt, even though it may accidentally
 * contain a taught marker. Gated to short replies with low lexical
 * diversity so a legitimately longer correct answer that happens to repeat
 * one word (comparing two "slots", say) is never caught by this.
 */
const REPETITION_STOPWORDS = new Set(['they', 'this', 'that', 'with', 'from', 'your', 'what', 'were', 'been', 'then', 'them', 'than'])
function isDegenerateRepetition(n) {
  const words = n.split(' ').filter((w) => w.length >= 4 && /^[a-z']+$/.test(w) && !REPETITION_STOPWORDS.has(w))
  if (words.length < 2 || words.length > 8) return false
  const distinct = new Set(words)
  return distinct.size / words.length <= 0.8
}

/*
 * Whether a marker phrase from `phrases` appears within the first `limit`
 * words of the reply. Summary/reformulation connectors are naturally
 * sentence-initial in real use ("Basically, ...", "To sum up, ..."); a
 * marker phrase buried deep inside an otherwise unrelated ramble (the shape
 * a lazy "nonsense" attempt takes) does not count as a real summary move.
 */
function markerNearStart(n, phrases, limit = 6) {
  for (const phrase of phrases) {
    const idx = n.indexOf(phrase)
    if (idx === -1) continue
    const wordsBefore = n.slice(0, idx).split(' ').filter(Boolean).length
    if (wordsBefore <= limit) return true
  }
  return false
}

/* ---------------------------------------------------------------------- */
/* Discourse coherence — the CORE requirement, generalized to N sentences.  */
/* ---------------------------------------------------------------------- */

const TOPIC_SHIFT_MARKERS = [
  'anyway', 'speaking of which', 'that reminds me', 'before i forget', 'by the way',
  'on a different note', 'before we move on', 'circling back to', 'having said that',
  'that being said', "let's not lose sight of", 'getting back to what you said', 'one more thing',
  'where were we',
]
const CONTRADICTION_MARKERS = [
  'i take that back', "that's not true", 'actually no', "no, that's wrong",
  'on second thought no', 'wait thats not right', "wait, that's not right",
]
const LINKING_CONNECTORS = [' and ', ' so ', ' because ', ' but ', ' however ', ' whereas ', ' although ', ' though ', ' since ']

/*
 * Sentence boundaries have to be read off the RAW text: `normalize()`
 * strips `.`/`!`/`?` entirely (it keeps only letters/digits/spaces/
 * apostrophes), so splitting the already-normalized string on sentence
 * punctuation would never find any. Each piece is normalized separately
 * once split.
 */
function splitSentences(rawText) {
  return String(rawText || '')
    // terminal punctuation AND a comma-joined main clause boundary
    // (", and"/", but"/", so") — a single physical sentence with two
    // propositions ("the venue is booked, and my sister might switch jobs")
    // is two ideas for coherence purposes, not one.
    .split(/[.!?]+|,\s+(?:and|but|so)\s+/i)
    .map((s) => normalize(s))
    .filter((s) => wordCount(s) >= 2)
}

const CONTENT_WORD = /^[a-z]{4,}$/
function contentWords(sentence) {
  return new Set(sentence.split(' ').filter((w) => CONTENT_WORD.test(w)))
}

/*
 * Whether the reply contains a topic-shift marker actually attached to a
 * real sentence, not merely present as a bare filler word somewhere in the
 * whole text. Checking the whole joined string (as an earlier version of
 * this function did) let a leading "Anyway." grant blanket coherence to an
 * otherwise-disconnected flat list, and let it override even a later
 * contradiction. `splitSentences` already drops fragments under two words,
 * so a bare "Anyway." never reaches here as its own sentence — the marker
 * has to be doing real work in a sentence with content.
 */
function hasRealTopicShiftMarker(text) {
  return splitSentences(text).some((s) => TOPIC_SHIFT_MARKERS.some((m) => s.includes(m)) && wordCount(s) >= 3)
}

/*
 * `discourseCoherenceJudgment` — a multi-sentence turn, judged the same way
 * A2's `twoClauseJudgment` judges two: each sentence must be a real attempt
 * (length floor), the turn must use a taught cohesive device rather than
 * just concatenating unrelated statements, and a later sentence must not
 * flatly contradict an earlier one. `incoherenceType` is the closed set
 * `core-engine-requirements.md` section 3 declares:
 *   contradictory   — a later sentence contradicts an earlier one
 *   flat_list       — individually fine sentences, no connector at all
 *   off_topic_drift — connected by a plain connector, but topic changed with
 *                     no signalled shift and no shared content
 * A single-sentence turn is not multi-sentence discourse — `checked: true`,
 * `coherent: true` by definition, so this dimension never manufactures a
 * failure for a turn the capability's other checks already judge.
 */
export function discourseCoherenceJudgment(text) {
  const n = normalize(text)
  const sentences = splitSentences(text)
  if (sentences.length < 2) {
    return { checked: true, coherent: true, clausesEvaluated: sentences.length, incoherenceType: null }
  }
  if (CONTRADICTION_MARKERS.some((m) => n.includes(m))) {
    return { checked: true, coherent: false, clausesEvaluated: sentences.length, incoherenceType: 'contradictory' }
  }
  if (hasRealTopicShiftMarker(text)) {
    return { checked: true, coherent: true, clausesEvaluated: sentences.length, incoherenceType: null }
  }
  const hasConnector = LINKING_CONNECTORS.some((c) => n.includes(c))
  if (!hasConnector) {
    return { checked: true, coherent: false, clausesEvaluated: sentences.length, incoherenceType: 'flat_list' }
  }
  // connected, but does a later sentence still share the topic at all?
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
/* Register appropriateness — the CORE requirement, closed marker sets.    */
/* ---------------------------------------------------------------------- */

const REGISTER_FORMAL = [
  'could you possibly', 'would it be possible to', 'would you mind', 'i was wondering if',
  'with all due respect', 'if you would', "i'd be grateful if", 'at your earliest convenience',
  'i would appreciate it if',
]
const REGISTER_INFORMAL = [
  'can you', "can't you", 'gimme', 'hey', 'give me a sec', "i'll check", 'sure thing',
  'no worries', 'yeah', 'gonna', 'wanna',
]
const HEDGING = ['sort of', 'tend to', "i'd say", 'more or less', 'kind of', "if i'm honest", 'strictly speaking', 'somewhat']
const INTENSIFYING = ['absolutely', 'without a doubt', "i'm convinced that", 'definitely', 'completely', 'entirely']
const DIPLOMATIC = ["i hear what you're saying", 'i understand, but', "i don't want to make a fuss", 'to be fair', 'i take your point', 'that being said']
const BLUNT_INAPPROPRIATE = [
  "that's completely wrong", "you clearly don't understand", 'this is ridiculous', 'unacceptable',
  'whatever', "i don't care", "that's stupid",
]

/*
 * `registerAppropriateness` for a formal/informal register shift: which set
 * the reply's markers actually belong to, judged against which one the turn
 * asked for (`expectedRegister`). A reply with markers from BOTH sets, or
 * from neither, is left `checked: true, appropriate: null` — genuinely
 * inconclusive locally, not a confident pass or fail.
 */
function registerShiftAppropriateness(n, expectedRegister) {
  if (!expectedRegister) return { checked: false, appropriate: null, expectedRegister: null, detectedRegister: null }
  const hasFormal = REGISTER_FORMAL.some((m) => n.includes(m))
  const hasInformal = REGISTER_INFORMAL.some((m) => n.includes(m))
  const detected = hasFormal && !hasInformal ? 'formal' : hasInformal && !hasFormal ? 'informal' : hasFormal && hasInformal ? 'mixed' : 'unmarked'
  if (detected === 'mixed' || detected === 'unmarked') {
    return { checked: true, appropriate: null, expectedRegister, detectedRegister: detected }
  }
  return { checked: true, appropriate: detected === expectedRegister, expectedRegister, detectedRegister: detected }
}

/* `registerAppropriateness` for the diplomacy dimension of a pushback negotiation turn. */
function diplomaticRegisterAppropriateness(n) {
  const blunt = BLUNT_INAPPROPRIATE.some((m) => n.includes(m))
  if (blunt) return { checked: true, appropriate: false, expectedRegister: 'diplomatic', detectedRegister: 'blunt' }
  const diplomatic = DIPLOMATIC.some((m) => n.includes(m))
  return { checked: true, appropriate: diplomatic ? true : null, expectedRegister: 'diplomatic', detectedRegister: diplomatic ? 'diplomatic' : 'unmarked' }
}

/* ---------------------------------------------------------------------- */
/* arc 1 — making_the_case                                                 */
/* ---------------------------------------------------------------------- */

const STANCE_RE = /\b(in my view|i'?d argue that|as i see it|i think(?: that)?|i'?d say|i'?d rather|personally|the way i see it|honestly)\b/
const REASON_CONNECTOR_RE = /\b(because|since|as|given that)\b/
const STANCE_ONLY_RE = /^i (just )?think so\.?$/

export function evaluateArgueOpinionWithReason(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "In my view, we should go with the later start time, because most people struggle to get here by eight."
  if (!n) return empty(r)
  if (isDegenerateRepetition(n)) {
    return { ...r, errorType: 'repetitive_nonsense', priorityCorrection: 'b2RetryExplainOpinionReason', explanation: 'b2RetryExplainOpinionReason', retryRequired: true, retryPrompt: 'b2RetryPromptOpinionStance' }
  }
  if (STANCE_ONLY_RE.test(n)) {
    return { ...r, errorType: 'stance_without_reason', priorityCorrection: 'b2RetryExplainOpinionReason', explanation: 'b2RetryExplainOpinionReason', retryRequired: true, retryPrompt: 'b2RetryPromptOpinionReason' }
  }
  const hasStance = STANCE_RE.test(n)
  // an explicit connector, or a dash/comma-separated clause long enough to
  // be a real (if unmarked) justification — "I'd rather X — Y is hard" is a
  // natural variant, not a missing-reason reject.
  const hasReason = REASON_CONNECTOR_RE.test(n) || (/[—-]|,/.test(text) && wordCount(n) >= 10)
  if (hasStance && hasReason) {
    r.completedObjective = true
    r.confidence = 0.92
    r.praiseKey = r.masteryEvidence.independent ? 'b2PraiseOpinionIndependent' : 'b2PraiseOpinionHelped'
    return r
  }
  if (hasStance && !hasReason) {
    return { ...r, errorType: 'missing_reason', priorityCorrection: 'b2RetryExplainOpinionReason', explanation: 'b2RetryExplainOpinionReason', retryRequired: true, retryPrompt: 'b2RetryPromptOpinionReason' }
  }
  if (!hasStance && hasReason) {
    return { ...r, errorType: 'missing_stance', priorityCorrection: 'b2RetryExplainOpinionStance', explanation: 'b2RetryExplainOpinionStance', retryRequired: true, retryPrompt: 'b2RetryPromptOpinionStance' }
  }
  return { ...r, errorType: 'no_opinion', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b2RetryPromptOpinionStance' }
}

const CONTRAST_CONNECTOR_RE = /\b(whereas|on the other hand|by contrast|on the one hand)\b/
const ADV_DIS_FRAME_RE = /\b(the main advantage|the main drawback|the advantage of|the disadvantage of)\b/
const PREFERENCE_ONLY_RE = /^i (like|prefer) the \w+( \w+)?\.?$/

export function evaluateWeighOptions(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "The main advantage of the morning slot is that it's quieter, whereas the afternoon slot is more convenient for most people."
  if (!n) return empty(r)
  if (isDegenerateRepetition(n)) {
    return { ...r, errorType: 'repetitive_nonsense', priorityCorrection: 'b2RetryExplainWeighTradeoff', explanation: 'b2RetryExplainWeighTradeoff', retryRequired: true, retryPrompt: 'b2RetryPromptWeighTradeoff' }
  }
  if (PREFERENCE_ONLY_RE.test(n)) {
    return { ...r, errorType: 'preference_without_tradeoff', priorityCorrection: 'b2RetryExplainWeighTradeoff', explanation: 'b2RetryExplainWeighTradeoff', retryRequired: true, retryPrompt: 'b2RetryPromptWeighTradeoff' }
  }
  const hasContrast = CONTRAST_CONNECTOR_RE.test(n) || ADV_DIS_FRAME_RE.test(n)
  const wellDeveloped = wordCount(n) >= 8
  if (hasContrast && wellDeveloped) {
    r.completedObjective = true
    r.confidence = 0.9
    r.praiseKey = r.masteryEvidence.independent ? 'b2PraiseWeighIndependent' : 'b2PraiseWeighHelped'
    return r
  }
  if (hasContrast && !wellDeveloped) {
    return { ...r, errorType: 'tradeoff_underdeveloped', priorityCorrection: 'b2RetryExplainWeighDevelop', explanation: 'b2RetryExplainWeighDevelop', retryRequired: true, retryPrompt: 'b2RetryPromptWeighDevelop' }
  }
  return { ...r, errorType: 'no_tradeoff', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b2RetryPromptWeighTradeoff' }
}

const CONCESSION_RE = /\b(that'?s true|i take your point|fair point|you'?re right|i see what you mean)\b/
const COUNTER_RE = /\b(but|however|still|nonetheless|nevertheless)\b/
const FULL_AGREEMENT_ONLY_RE = /^(yes,? )?you'?re right\.?$/

export function evaluateConcedeAndCounter(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "That's true, the later slot is more convenient — but I still think mornings work better for most of the team."
  if (!n) return empty(r)
  if (isDegenerateRepetition(n)) {
    return { ...r, errorType: 'repetitive_nonsense', priorityCorrection: 'b2RetryExplainConcedeCounter', explanation: 'b2RetryExplainConcedeCounter', retryRequired: true, retryPrompt: 'b2RetryPromptConcedeCounter' }
  }
  if (FULL_AGREEMENT_ONLY_RE.test(n)) {
    return { ...r, errorType: 'agreement_without_counter', priorityCorrection: 'b2RetryExplainConcedeCounter', explanation: 'b2RetryExplainConcedeCounter', retryRequired: true, retryPrompt: 'b2RetryPromptConcedeCounter' }
  }
  const hasConcession = CONCESSION_RE.test(n)
  const hasCounter = COUNTER_RE.test(n)
  if (hasConcession && hasCounter) {
    r.completedObjective = true
    r.confidence = 0.91
    r.praiseKey = r.masteryEvidence.independent ? 'b2PraiseConcedeIndependent' : 'b2PraiseConcedeHelped'
    return r
  }
  if (hasConcession && !hasCounter) {
    return { ...r, errorType: 'missing_counter', priorityCorrection: 'b2RetryExplainConcedeCounter', explanation: 'b2RetryExplainConcedeCounter', retryRequired: true, retryPrompt: 'b2RetryPromptConcedeCounter' }
  }
  if (!hasConcession && hasCounter) {
    return { ...r, errorType: 'missing_concession', priorityCorrection: 'b2RetryExplainConcedeConcession', explanation: 'b2RetryExplainConcedeConcession', retryRequired: true, retryPrompt: 'b2RetryPromptConcedeConcession' }
  }
  return { ...r, errorType: 'no_concession', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b2RetryPromptConcedeConcession' }
}

/* ---------------------------------------------------------------------- */
/* arc 2 — when_plans_go_wrong                                             */
/* ---------------------------------------------------------------------- */

const REQUEST_FRAME_RE = /\b(could you|could we|would you|can you|can we|i'?d like|the issue is that|could you look into)\b/
const JUSTIFICATION_RE = /\b(since|because|given that|the reason (i'?m|i am) asking is that)\b/
const BARE_REQUEST_RE = /^(please )?(change|fix|send|cancel) (my|the|it)\b.{0,20}$/

export function evaluateJustifyARequest(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "The issue is that the jacket I received is a small, not a medium — since I need it for a trip next week, could you look into sending the right size?"
  if (!n) return empty(r)
  if (BARE_REQUEST_RE.test(n) && !JUSTIFICATION_RE.test(n)) {
    return { ...r, errorType: 'request_without_justification', priorityCorrection: 'b2RetryExplainJustifyReason', explanation: 'b2RetryExplainJustifyReason', retryRequired: true, retryPrompt: 'b2RetryPromptJustifyReason' }
  }
  const hasRequest = REQUEST_FRAME_RE.test(n)
  const hasJustification = JUSTIFICATION_RE.test(n)
  if (hasRequest && hasJustification) {
    r.completedObjective = true
    r.confidence = 0.91
    r.praiseKey = r.masteryEvidence.independent ? 'b2PraiseJustifyIndependent' : 'b2PraiseJustifyHelped'
    return r
  }
  if (hasRequest && !hasJustification) {
    return { ...r, errorType: 'missing_justification', priorityCorrection: 'b2RetryExplainJustifyReason', explanation: 'b2RetryExplainJustifyReason', retryRequired: true, retryPrompt: 'b2RetryPromptJustifyReason' }
  }
  if (!hasRequest && hasJustification) {
    return { ...r, errorType: 'missing_request', priorityCorrection: 'b2RetryExplainJustifyRequest', explanation: 'b2RetryExplainJustifyRequest', retryRequired: true, retryPrompt: 'b2RetryPromptJustifyRequest' }
  }
  return { ...r, errorType: 'no_justified_request', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b2RetryPromptJustifyRequest' }
}

const PROPOSAL_RE = /\b(would you be willing to|what if we|i'?d suggest that|what i'?d like is|would it be possible to|i was wondering if you could|could you|could we)\b/
const DISSATISFACTION_ONLY_RE = /^(just )?(fix it|sort it out)\.?$/

/*
 * `propose_a_resolution` — base (`negotiate_a_resolution`) and the `pushback`
 * subtype (`negotiate_an_agreement_under_pushback`) share the same core
 * structural judgment (a proposal marker, referencing the stated problem);
 * the pushback subtype additionally opts into `discourseCoherence` (does
 * this round of the negotiation still cohere with what came before) and
 * `registerAppropriateness` (is the pushback held diplomatically) per
 * `b2EvaluationContracts.js`'s opt-in tables.
 */
export function evaluateProposeAResolution(text, { independent = false, subtype = null, discourseCoherenceCheck = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "Could you move my appointment to Thursday instead? I explained why Tuesday doesn't work."
  if (!n) return empty(r)

  if (subtype === 'pushback') {
    r.registerAppropriateness = diplomaticRegisterAppropriateness(n)
  }
  if (subtype === 'pushback' || discourseCoherenceCheck) {
    r.discourseCoherence = discourseCoherenceJudgment(text)
  }

  if (DISSATISFACTION_ONLY_RE.test(n)) {
    return { ...r, errorType: 'dissatisfaction_without_proposal', priorityCorrection: 'b2RetryExplainProposeMarker', explanation: 'b2RetryExplainProposeMarker', retryRequired: true, retryPrompt: 'b2RetryPromptProposeMarker' }
  }
  const hasProposal = PROPOSAL_RE.test(n)
  const wellDeveloped = wordCount(n) >= 5
  if (hasProposal && wellDeveloped) {
    r.completedObjective = true
    r.confidence = 0.9
    r.praiseKey = r.masteryEvidence.independent ? 'b2PraiseProposeIndependent' : 'b2PraiseProposeHelped'
    // register-inappropriate: correct content, wrong diplomacy — a separate
    // verdict, per core-engine-requirements.md section 2, never folded into
    // completedObjective itself.
    return r
  }
  if (hasProposal && !wellDeveloped) {
    return { ...r, errorType: 'proposal_underdeveloped', priorityCorrection: 'b2RetryExplainProposeDevelop', explanation: 'b2RetryExplainProposeDevelop', retryRequired: true, retryPrompt: 'b2RetryPromptProposeDevelop' }
  }
  return { ...r, errorType: 'no_proposal', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b2RetryPromptProposeMarker' }
}

const DIPLOMATIC_HEDGE_RE = /\bi understand\b[\s\S]{0,40}\bbut\b|\bi get that\b[\s\S]{0,40}\bbut\b|\bi don'?t want to make a fuss\b[\s\S]{0,40}\bbut\b|\bto be fair\b/
const RAW_FRUSTRATION_RE = /^(this is so annoying|this is ridiculous)!?\.?$/

export function evaluateExpressDiplomaticFrustration(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "I understand things get busy, but this is the second time it's happened, and I need it sorted this week."
  if (!n) return empty(r)
  if (isDegenerateRepetition(n)) {
    return { ...r, errorType: 'repetitive_nonsense', priorityCorrection: 'b2RetryExplainFrustrationDiplomatic', explanation: 'b2RetryExplainFrustrationDiplomatic', retryRequired: true, retryPrompt: 'b2RetryPromptFrustrationDiplomatic' }
  }
  if (RAW_FRUSTRATION_RE.test(n)) {
    return { ...r, errorType: 'raw_frustration_not_diplomatic', priorityCorrection: 'b2RetryExplainFrustrationDiplomatic', explanation: 'b2RetryExplainFrustrationDiplomatic', retryRequired: true, retryPrompt: 'b2RetryPromptFrustrationDiplomatic' }
  }
  const hasHedge = DIPLOMATIC_HEDGE_RE.test(n)
  const hasContent = wordCount(n) >= 6
  if (hasHedge && hasContent) {
    r.completedObjective = true
    r.confidence = 0.9
    r.praiseKey = r.masteryEvidence.independent ? 'b2PraiseFrustrationIndependent' : 'b2PraiseFrustrationHelped'
    return r
  }
  if (hasHedge && !hasContent) {
    return { ...r, errorType: 'frustration_underdeveloped', priorityCorrection: 'b2RetryExplainFrustrationDevelop', explanation: 'b2RetryExplainFrustrationDevelop', retryRequired: true, retryPrompt: 'b2RetryPromptFrustrationDevelop' }
  }
  return { ...r, errorType: 'missing_diplomatic_hedge', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b2RetryPromptFrustrationDiplomatic' }
}

/* ---------------------------------------------------------------------- */
/* arc 3 — what_if                                                         */
/* ---------------------------------------------------------------------- */

const SECOND_CONDITIONAL_RE = /\bif i (were|had)\b[\s\S]{0,40}\b(i'?d|i would)\b|\bwere i\b[\s\S]{0,40}\b(i'?d|i would)\b/
const THIRD_CONDITIONAL_RE = /\bif i (had|'?d) \w+ed\b[\s\S]{0,40}\bwould have\b|\bif i had\b[\s\S]{0,40}\bwould have\b/
const REAL_CONDITIONAL_LEAK_RE = /\bif i am\b[\s\S]{0,30}\bi (ask|go|do)\b/

export function evaluateStateUnrealHypothesis(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "If I were in your position, I'd ask for more time before deciding."
  if (!n) return empty(r)
  if (REAL_CONDITIONAL_LEAK_RE.test(n)) {
    return { ...r, errorType: 'real_conditional_for_unreal', priorityCorrection: 'b2RetryExplainHypotheticalForm', explanation: 'b2RetryExplainHypotheticalForm', retryRequired: true, retryPrompt: 'b2RetryPromptHypotheticalForm' }
  }
  if (SECOND_CONDITIONAL_RE.test(n) || THIRD_CONDITIONAL_RE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.91
    r.acceptedVariant = THIRD_CONDITIONAL_RE.test(n) || /^were i/.test(n)
    r.praiseKey = r.masteryEvidence.independent ? 'b2PraiseHypothesisIndependent' : 'b2PraiseHypothesisHelped'
    return r
  }
  if (/\bif\b/.test(n) && (/\bi'?d\b|\bi would\b/.test(n))) {
    return { ...r, errorType: 'conditional_form_incomplete', priorityCorrection: 'b2RetryExplainHypotheticalForm', explanation: 'b2RetryExplainHypotheticalForm', retryRequired: true, retryPrompt: 'b2RetryPromptHypotheticalForm' }
  }
  return { ...r, errorType: 'no_hypothesis', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b2RetryPromptHypotheticalForm' }
}

const MODAL_DEDUCTION_RE = /\b(must be|might be|can'?t be|must have|might have|could have)\b/
const FLAT_ASSERTION_RE = /^(they|he|she|it) \w+ (early|late|already|home|there)\.?$/

export function evaluateSpeculateCauseOrEffect(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "The lights are off and the car's gone — they must have left early."
  if (!n) return empty(r)
  if (isDegenerateRepetition(n)) {
    return { ...r, errorType: 'repetitive_nonsense', priorityCorrection: 'b2RetryExplainSpeculateModal', explanation: 'b2RetryExplainSpeculateModal', retryRequired: true, retryPrompt: 'b2RetryPromptSpeculateModal' }
  }
  if (FLAT_ASSERTION_RE.test(n)) {
    return { ...r, errorType: 'flat_assertion_no_modal', priorityCorrection: 'b2RetryExplainSpeculateModal', explanation: 'b2RetryExplainSpeculateModal', retryRequired: true, retryPrompt: 'b2RetryPromptSpeculateModal' }
  }
  if (MODAL_DEDUCTION_RE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.9
    r.praiseKey = r.masteryEvidence.independent ? 'b2PraiseSpeculateIndependent' : 'b2PraiseSpeculateHelped'
    return r
  }
  return { ...r, errorType: 'no_speculation', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b2RetryPromptSpeculateModal' }
}

const REGRET_RE = /\bi wish i had\b|\bif only i'?d\b|\bif only i had\b/
const FUTURE_ADVICE_LEAK_RE = /\bi should\b[\s\S]{0,20}\bnext time\b/

export function evaluateExpressPastRegret(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "I wish I had checked the reviews before booking — I would have chosen somewhere else."
  if (!n) return empty(r)
  if (FUTURE_ADVICE_LEAK_RE.test(n)) {
    return { ...r, errorType: 'future_advice_not_regret', priorityCorrection: 'b2RetryExplainRegretForm', explanation: 'b2RetryExplainRegretForm', retryRequired: true, retryPrompt: 'b2RetryPromptRegretForm' }
  }
  if (REGRET_RE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.91
    r.praiseKey = r.masteryEvidence.independent ? 'b2PraiseRegretIndependent' : 'b2PraiseRegretHelped'
    return r
  }
  return { ...r, errorType: 'no_regret_form', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b2RetryPromptRegretForm' }
}

/* ---------------------------------------------------------------------- */
/* arc 4 — talking_around_a_subject (mediation: meaning-preservation floor) */
/* ---------------------------------------------------------------------- */

const SUMMARY_CONNECTORS = ['basically', 'the main point was', 'to sum up', 'so basically', 'long story short', 'the gist of it is']
const SUMMARY_CONNECTOR_RE = /\b(basically|the main point was|to sum up|so basically|long story short|the gist of it is)\b/
const REFORMULATION_MARKER_RE = /\b(in other words|what i mean is|put simply|to put it another way|essentially)\b/
const REPORTED_SPEECH_RE = /\b(she|he|they) (said|mentioned|thought|thinks|pointed out|suggested|claimed)\b/

export function evaluateSummarizeForThirdParty(text, { independent = false, sourceText = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "Basically, the shipment's delayed until next week because of a supplier issue, and they offered a partial refund."
  if (!n) return empty(r)
  if (isVerbatimCopy(n, sourceText)) {
    return { ...r, errorType: 'verbatim_not_summary', priorityCorrection: 'b2RetryExplainSummaryCondense', explanation: 'b2RetryExplainSummaryCondense', retryRequired: true, retryPrompt: 'b2RetryPromptSummaryCondense' }
  }
  const hasMarker = markerNearStart(n, SUMMARY_CONNECTORS)
  const hasContent = wordCount(n) >= 6
  if (hasMarker && hasContent) {
    r.completedObjective = true
    r.confidence = 0.87
    r.praiseKey = r.masteryEvidence.independent ? 'b2PraiseSummaryIndependent' : 'b2PraiseSummaryHelped'
    return r
  }
  if (!hasMarker && hasContent) {
    return { ...r, errorType: 'missing_summary_marker', priorityCorrection: 'b2RetryExplainSummaryMarker', explanation: 'b2RetryExplainSummaryMarker', retryRequired: true, retryPrompt: 'b2RetryPromptSummaryMarker' }
  }
  return { ...r, errorType: 'summary_too_short', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b2RetryPromptSummaryMarker' }
}

export function evaluateReformulateForClarity(text, { independent = false, sourceText = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "In other words, the account is on hold until it's verified."
  if (!n) return empty(r)
  if (isVerbatimCopy(n, sourceText)) {
    return { ...r, errorType: 'verbatim_not_reformulated', priorityCorrection: 'b2RetryExplainReformulateAttempt', explanation: 'b2RetryExplainReformulateAttempt', retryRequired: true, retryPrompt: 'b2RetryPromptReformulateAttempt' }
  }
  const hasMarker = REFORMULATION_MARKER_RE.test(n)
  const hasContent = wordCount(n) >= 4
  if (hasMarker && hasContent) {
    r.completedObjective = true
    r.confidence = 0.87
    r.praiseKey = r.masteryEvidence.independent ? 'b2PraiseReformulateIndependent' : 'b2PraiseReformulateHelped'
    return r
  }
  if (!hasMarker && hasContent) {
    return { ...r, errorType: 'missing_reformulation_marker', priorityCorrection: 'b2RetryExplainReformulateMarker', explanation: 'b2RetryExplainReformulateMarker', retryRequired: true, retryPrompt: 'b2RetryPromptReformulateMarker' }
  }
  return { ...r, errorType: 'reformulation_too_short', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b2RetryPromptReformulateMarker' }
}

const OPINION_ONLY_RE = /^(she|he|they) (likes?|prefers?) the \w+( \w+)?\.?$/

export function evaluateReportThirdPartyOpinion(text, { independent = false, sourceText = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "She said she thought the later time would work better for everyone."
  if (!n) return empty(r)
  if (isVerbatimCopy(n, sourceText)) {
    return { ...r, errorType: 'verbatim_not_reported', priorityCorrection: 'b2RetryExplainReportAttempt', explanation: 'b2RetryExplainReportAttempt', retryRequired: true, retryPrompt: 'b2RetryPromptReportAttempt' }
  }
  if (OPINION_ONLY_RE.test(n)) {
    return { ...r, errorType: 'missing_report_frame', priorityCorrection: 'b2RetryExplainReportFrame', explanation: 'b2RetryExplainReportFrame', retryRequired: true, retryPrompt: 'b2RetryPromptReportFrame' }
  }
  const hasFrame = REPORTED_SPEECH_RE.test(n)
  const hasContent = wordCount(n) >= 5
  if (hasFrame && hasContent) {
    r.completedObjective = true
    r.confidence = 0.88
    r.praiseKey = r.masteryEvidence.independent ? 'b2PraiseReportIndependent' : 'b2PraiseReportHelped'
    return r
  }
  return { ...r, errorType: 'no_report_frame', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b2RetryPromptReportFrame' }
}

/* ---------------------------------------------------------------------- */
/* arc 5 — reading_between_the_lines (registerAppropriateness)             */
/* ---------------------------------------------------------------------- */

const REGISTER_UNDERSPECIFIED_RE = /^(when|what) \w+ (ready|there|here)\??$/

/*
 * `shift_register` covers FOUR shapes via `subtype`: the base register shift
 * (`adjust_register_to_context`, no subtype — `registerCheck`/`expectedRegister`
 * carried on the step regardless), `formal_shift`/`informal_shift` (arc 5 and
 * the capstone's own register moment) and `topic_shift` (the capstone's
 * conversation-length capabilities, judged on `discourseCoherence` instead —
 * a topic change has no formality to grade). See `b2Capabilities.js`'s own
 * comment on why this reuse is intentional, not a naming accident.
 */
export function evaluateShiftRegister(text, {
  independent = false, subtype = null, registerCheck = false, expectedRegister = null, discourseCoherenceCheck = false,
} = {}) {
  const n = normalize(text)
  const r = base(independent)

  if (subtype === 'topic_shift') {
    r.naturalVersion = 'Anyway, before we move on — there is one more thing I wanted to mention.'
    if (!n) return empty(r)
    r.discourseCoherence = discourseCoherenceJudgment(text)
    /*
     * A hard incoherence verdict (contradictory / flat_list / off_topic_drift)
     * disqualifies the turn REGARDLESS of whether a shift marker also
     * appears somewhere in it — a marker is not a licence to contradict
     * yourself. Checked before the marker-presence accept, not after, so a
     * capstone turn that opens with "Anyway" and then contradicts itself
     * cannot pass on the marker alone.
     */
    if (discourseCoherenceCheck && r.discourseCoherence.checked && r.discourseCoherence.coherent === false) {
      return { ...r, errorType: `topic_shift_${r.discourseCoherence.incoherenceType}`, priorityCorrection: 'b2RetryExplainTopicShiftMarker', explanation: 'b2RetryExplainTopicShiftMarker', retryRequired: true, retryPrompt: 'b2RetryPromptTopicShiftMarker' }
    }
    if (hasRealTopicShiftMarker(text)) {
      r.completedObjective = true
      r.confidence = 0.9
      r.praiseKey = r.masteryEvidence.independent ? 'b2PraiseTopicShiftIndependent' : 'b2PraiseTopicShiftHelped'
      return r
    }
    return { ...r, errorType: 'missing_topic_shift_marker', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b2RetryPromptTopicShiftMarker' }
  }

  // formal_shift / informal_shift / base register shift
  r.naturalVersion = expectedRegister === 'informal' ? 'Hey, can you send that over when you get a chance?' : 'Could you possibly let me know when the report will be ready?'
  if (!n) return empty(r)
  if (isDegenerateRepetition(n)) {
    return { ...r, errorType: 'repetitive_nonsense', priorityCorrection: 'b2RetryExplainRegisterForm', explanation: 'b2RetryExplainRegisterForm', retryRequired: true, retryPrompt: 'b2RetryPromptRegisterForm' }
  }
  if (registerCheck || expectedRegister) {
    r.registerAppropriateness = registerShiftAppropriateness(n, expectedRegister || (subtype === 'informal_shift' ? 'informal' : 'formal'))
  }
  if (REGISTER_UNDERSPECIFIED_RE.test(n)) {
    return { ...r, errorType: 'register_and_grammar_underspecified', priorityCorrection: 'b2RetryExplainRegisterForm', explanation: 'b2RetryExplainRegisterForm', retryRequired: true, retryPrompt: 'b2RetryPromptRegisterForm' }
  }
  const wantsInformal = expectedRegister === 'informal' || subtype === 'informal_shift'
  const markers = wantsInformal ? REGISTER_INFORMAL : REGISTER_FORMAL
  const wrongMarkers = wantsInformal ? REGISTER_FORMAL : REGISTER_INFORMAL
  const hasRight = markers.some((m) => n.includes(m))
  const hasWrong = wrongMarkers.some((m) => n.includes(m))
  if (hasRight) {
    r.completedObjective = true
    r.confidence = 0.89
    r.praiseKey = r.masteryEvidence.independent ? 'b2PraiseRegisterIndependent' : 'b2PraiseRegisterHelped'
    return r
  }
  if (hasWrong) {
    // semantically fine, register-inappropriate — a gradable failure mode of
    // its own, per b2.md section 11, not folded into "wrong".
    return { ...r, errorType: 'wrong_register', priorityCorrection: 'b2RetryExplainRegisterMismatch', explanation: 'b2RetryExplainRegisterMismatch', retryRequired: true, retryPrompt: 'b2RetryPromptRegisterMismatch' }
  }
  return { ...r, errorType: 'no_register_marker', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b2RetryPromptRegisterForm' }
}

const CLAIM_ONLY_RE = /^it'?s a problem\.?$/

export function evaluateSoftenOrIntensifyClaim(text, { independent = false, subtype = null, registerCheck = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "It's sort of a problem, to be honest — I'd say it needs looking at soon."
  if (!n) return empty(r)
  if (registerCheck) {
    const hasHedge = HEDGING.some((m) => n.includes(m))
    const hasIntensify = INTENSIFYING.some((m) => n.includes(m))
    const detected = hasHedge && !hasIntensify ? 'softened' : hasIntensify && !hasHedge ? 'intensified' : hasHedge && hasIntensify ? 'mixed' : 'unmarked'
    r.registerAppropriateness = { checked: true, appropriate: detected === 'softened' || detected === 'intensified' ? true : detected === 'unmarked' ? null : null, expectedRegister: subtype || 'soften_or_intensify', detectedRegister: detected }
  }
  if (CLAIM_ONLY_RE.test(n)) {
    return { ...r, errorType: 'claim_without_hedge_or_intensifier', priorityCorrection: 'b2RetryExplainSoftenMarker', explanation: 'b2RetryExplainSoftenMarker', retryRequired: true, retryPrompt: 'b2RetryPromptSoftenMarker' }
  }
  const hasHedge = HEDGING.some((m) => n.includes(m))
  const hasIntensify = INTENSIFYING.some((m) => n.includes(m))
  if (hasHedge && hasIntensify) {
    // hedging AND intensifying the same claim at once cancels the intended
    // force rather than expressing it — a contradiction, not a double win.
    return { ...r, errorType: 'contradictory_hedge_and_intensify', priorityCorrection: 'b2RetryExplainSoftenMarker', explanation: 'b2RetryExplainSoftenMarker', retryRequired: true, retryPrompt: 'b2RetryPromptSoftenMarker' }
  }
  if (hasHedge || hasIntensify) {
    r.completedObjective = true
    r.confidence = 0.88
    r.praiseKey = r.masteryEvidence.independent ? 'b2PraiseSoftenIndependent' : 'b2PraiseSoftenHelped'
    return r
  }
  return { ...r, errorType: 'no_hedge_or_intensifier', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'b2RetryPromptSoftenMarker' }
}

/* Dispatcher for this level's intents, mirroring `evaluateFree`'s own shape
 * so merging into the shared switch is mechanical. */
export function evaluateB2Free(kind, text, ctx = {}) {
  switch (kind) {
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
    case 'shift_register': return evaluateShiftRegister(text, ctx)
    case 'soften_or_intensify_claim': return evaluateSoftenOrIntensifyClaim(text, ctx)
    default: return { ...base(ctx.independent), understood: false, conclusive: true, retryRequired: true }
  }
}
