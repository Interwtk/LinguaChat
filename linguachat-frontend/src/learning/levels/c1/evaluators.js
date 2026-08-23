/*
 * c1/evaluators — C1's own local-evaluator functions, one per intent except
 * `clarify_ambiguity` (a `repair_request` subtype dispatched directly in
 * `engine/responseEvaluation.js`, see that file's `REPAIR_KINDS` comment).
 * Same authoring pattern as `engine/responseEvaluation.js` and
 * `levels/a2/evaluators.js`/`levels/b1/evaluators.js`/`levels/b2/evaluators.js`
 * before it: a taught frame matched by regex, explicit near-miss/wrong-meaning
 * reject patterns each with their own `errorType`, and a catch-all that is
 * always `conclusive: false` so a genuine, unanticipated attempt is never
 * falsely rejected — never escalated to "wrong", only "not yet confirmed".
 *
 * `base()` is a deliberate, exact copy of the shared `base()` in
 * `engine/responseEvaluation.js` (not importable: it is not exported from
 * that module), matching every earlier level's own precedent.
 * `normalize` IS exported there and is imported directly rather than
 * duplicated, matching `levels/a2/evaluators.js`'s own precedent.
 * `discourseCoherenceJudgment` and its helpers are a deliberate copy of
 * `levels/b2/evaluators.js`'s own implementation rather than a cross-level
 * import — a level's own evaluator file does not depend on a peer level's
 * module, the same isolation `curriculum-isolation-plan.md` (`LC-FND-002`)
 * establishes for content.
 *
 * THREE REAL SCORING DIMENSIONS IMPLEMENTED HERE (per
 * `c1EvaluationContracts.js`, previously only a scaffolded `{ checked: false }`
 * default in every evaluator's `base()`):
 *
 *   - `registerAppropriateness` — REQUIRED (not should-relevant, B2's own
 *     capstone-only use of the same field) from `register_and_diplomacy`
 *     onward, for the six capabilities `C1_REGISTER_APPROPRIATENESS_OPT_IN`
 *     opts in. Local-first closed register-pair vocabulary lookup, the same
 *     shape B2's `registerShiftAppropriateness` established.
 *   - `discourseCoherence` — REQUIRED from `extended_structured_discourse`
 *     onward, for the six capabilities `C1_DISCOURSE_COHERENCE_OPT_IN` opts
 *     in. Generalizes B2's own N-sentence judgment; proven against all four
 *     `C1_DISCOURSE_COHERENCE_REFUSAL_FIXTURES` shapes (contradictory /
 *     flat_list / off_topic_drift / coherent control) by
 *     `scripts/foundry/c1/check-c1-discourse-coherence.mjs` (if present) or
 *     the equivalent journey checks.
 *   - `conversationStateTracking` — NEW, C1-only, kept deliberately separate
 *     from `discourseCoherence` (`core-engine-requirements.md` section 3:
 *     "coherent within a turn" vs. "accurately references an earlier turn").
 *     `refer_back_to_earlier_discourse`'s evaluator checks a later turn's
 *     reference against `ctx.conversationHistory` — a bounded, per-episode-run
 *     buffer of the turn text already exchanged in THIS episode, threaded in
 *     by `EpisodeShell.jsx`/`hybridEvaluation.js` the same way `sourceText`
 *     already is for B2's mediation intents. This is a STRUCTURAL floor (does
 *     the reply name a marker plus content that overlaps something actually
 *     said earlier in the buffer), never a claim of verified factual
 *     accuracy — the same honesty B2's `isVerbatimCopy` meaning-preservation
 *     floor already commits to.
 *
 * `canDoId` reaches every evaluator here via `ctx.canDoId` (threaded the same
 * way `subtype` already is for B2's capstone) because three C1 intents cover
 * MULTIPLE can-dos with genuinely different judgment: `adapt_register`
 * (`adapt_register_to_audience`/`shift_register_within_one_conversation` —
 * register-shift markers — vs. `repair_a_register_slip` — self-repair
 * markers) and `track_discourse` (topic-shift vs. refer-back vs.
 * closing-summary markers). C1's authored content never sets an explicit
 * `subtype` field for these (unlike B2's capstone), only a per-step
 * `canDoId` — see `core-engine-handoff.md` section 3 and
 * `c1Arc7SustainedInteraction.js`'s own track_discourse steps.
 *
 * THREE-TIER STRUCTURAL-FLOOR FALLBACK (`c1EvaluationContracts.js`'s
 * `C1_STRUCTURAL_FLOOR_FALLBACK`/`C1_MEANING_PRESERVATION_STRUCTURAL_FLOOR`):
 * this file's local judgment IS the declared structural floor for every
 * intent below — a clear structural match is a conclusive local accept
 * (provider not needed, the common case), a clear structural miss is a
 * conclusive local reject, and a genuinely ambiguous reply is
 * `conclusive: false`. The existing hybrid router (`engine/hybridEvaluation.js`)
 * already implements the three tiers on top of that shape: provider-graded
 * when `shouldEscalate()` is true and a remote is reachable; this file's
 * structural floor verdict reused, `source: 'fallback'`, when it is not —
 * never silently upgraded to a confirmed pass. Nothing here ever claims
 * verified meaning-preservation or verified factual accuracy (both need the
 * provider); the local floor only checks marker presence, contrast/overlap
 * shape and non-verbatim copying, exactly as declared.
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

/* not a verbatim (or near-verbatim) copy of the source text — the same hard
 * requirement every structural floor for mediation/summary shares (mirrors
 * `levels/b2/evaluators.js`'s own `isVerbatimCopy`). */
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

/*
 * A short reply dominated by one or two repeated content words reads as
 * nonsense rather than a genuine attempt, even though it may accidentally
 * contain a taught marker. Mirrors `levels/b2/evaluators.js`'s own
 * `isDegenerateRepetition`.
 */
const REPETITION_STOPWORDS = new Set(['they', 'this', 'that', 'with', 'from', 'your', 'what', 'were', 'been', 'then', 'them', 'than'])
function isDegenerateRepetition(n) {
  const words = n.split(' ').filter((w) => w.length >= 4 && /^[a-z']+$/.test(w) && !REPETITION_STOPWORDS.has(w))
  if (words.length < 2 || words.length > 8) return false
  const distinct = new Set(words)
  return distinct.size / words.length <= 0.8
}

/* ---------------------------------------------------------------------- */
/* Discourse coherence — copied from `levels/b2/evaluators.js` (see this   */
/* file's own header for why it is a copy, not a cross-level import).      */
/* ---------------------------------------------------------------------- */

const TOPIC_SHIFT_MARKERS = [
  'anyway', 'speaking of which', 'that reminds me', 'before i forget', 'by the way',
  'on a different note', 'before we move on', 'circling back to', 'having said that',
  'that being said', "let's not lose sight of", 'getting back to what you said', 'one more thing',
  'where were we', 'on a lighter note',
]
const CONTRADICTION_MARKERS = [
  'i take that back', "that's not true", 'actually no', "no, that's wrong",
  'on second thought no', 'wait thats not right', "wait, that's not right",
]
const LINKING_CONNECTORS = [' and ', ' so ', ' because ', ' but ', ' however ', ' whereas ', ' although ', ' though ', ' since ', ' as a result ']

function splitSentences(rawText) {
  return String(rawText || '')
    .split(/[.!?]+|,\s+(?:and|but|so)\s+/i)
    .map((s) => normalize(s))
    .filter((s) => wordCount(s) >= 2)
}

const CONTENT_WORD = /^[a-z]{4,}$/
function contentWords(sentence) {
  return new Set(sentence.split(' ').filter((w) => CONTENT_WORD.test(w)))
}

function hasRealTopicShiftMarker(text) {
  return splitSentences(text).some((s) => TOPIC_SHIFT_MARKERS.some((m) => s.includes(m)) && wordCount(s) >= 3)
}

/*
 * A multi-sentence turn can be held together by SEQUENCING ("first X, then
 * Y, as a result Z") or by a cohesive/contrastive DEVICE ("however", "on
 * top of that", "in this respect") repeated across sentences — neither
 * needs a shared topic NOUN in every sentence the way an argument does.
 * C1's own `produce_an_extended_structured_explanation`/
 * `use_cohesive_devices_across_a_turn` teach exactly these shapes
 * (`so_basically_what_happened_is`/`the_first_thing_to_say_is`/
 * `as_a_result_of_that`/`however_c1`/`on_top_of_that`/`in_this_respect`).
 * Without this, a genuinely correct account with a different concrete noun
 * in each sentence (a delivery date, then a different delivery date, then
 * an afternoon; or a project, a client, a result) was flagged
 * `off_topic_drift` by the lexical-overlap check alone, which measures
 * ARGUMENT continuity, not NARRATIVE/cohesive-device continuity.
 */
const MULTI_SENTENCE_COHESION_MARKERS = [
  'first', 'then', 'next', 'after that', 'finally', 'second', 'third', 'as a result',
  'so basically', 'the first thing', 'in the end', 'eventually',
  'however', 'having said that', 'on top of that', 'in this respect', 'nevertheless',
  'moreover', 'furthermore', 'besides that', 'by contrast', 'on the other hand',
]
function hasMultiSentenceCohesion(sentences) {
  const withMarker = sentences.filter((s) => MULTI_SENTENCE_COHESION_MARKERS.some((m) => s.startsWith(m) || s.includes(` ${m} `)))
  return withMarker.length >= 2
}

/*
 * `discourseCoherenceJudgment` — a multi-sentence turn, judged the same way
 * B2's own version judges it: each sentence must be a real attempt (length
 * floor), the turn must use a taught cohesive device rather than just
 * concatenating unrelated statements, and a later sentence must not flatly
 * contradict an earlier one. `incoherenceType` is the closed set
 * `core-engine-requirements.md` section 3 declares: contradictory | flat_list
 * | off_topic_drift. A single-sentence turn is not multi-sentence discourse —
 * `checked: true`, `coherent: true` by definition.
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
  const sharesTopic = hasMultiSentenceCohesion(sentences) || sentences.slice(1).some((s, i) => {
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
/* Register appropriateness — closed marker sets from C1's own vocabulary. */
/* ---------------------------------------------------------------------- */

const REGISTER_FORMAL = [
  'would it be possible to', 'i was wondering if you could', 'would you mind if',
  'could you possibly', 'with all due respect',
]
const REGISTER_INFORMAL = [
  'can you', "let's", 'hey', 'yeah', 'gonna', 'wanna', 'gimme', 'no worries', 'sure thing',
]
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

/* `repair_a_register_slip` — noticing and repairing a slip mid-turn, a
 * different judgment than picking the right register from the start. */
const SELF_REPAIR_RE = /\b(what i meant to say was|let me rephrase that|that came out wrong|sorry,? that sounded blunter than i meant|sorry,? that came out (wrong|blunt))\b/
function selfRepairAppropriateness(n) {
  const repaired = SELF_REPAIR_RE.test(n)
  return { checked: true, appropriate: repaired ? true : null, expectedRegister: 'self_repair', detectedRegister: repaired ? 'repaired' : 'unmarked' }
}

/* ---------------------------------------------------------------------- */
/* Arc A — abstract_argument                                               */
/* ---------------------------------------------------------------------- */

const STANCE_RE = /\b(what really matters (here|is)|the case for [\w\s]+ is|in my view|i'?d argue that|as i see it|i think(?: that)?|personally|the way i see it|honestly)\b/
const REASON_OR_EXAMPLE_RE = /\b(because|since|as|given that|take,? for example|to illustrate|for example)\b/
const IMPLICATION_RE = /\b(it would likely mean that|the knock-?on effect would be)\b/
const STANCE_ONLY_RE = /^i (just )?(don'?t|do not) like it\.?$/

export function evaluateStateStructuredArgument(text, { independent = false, canDoId = null } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "What really matters here is that forcing everyone back full-time ignores how differently people work best, because a lot of the team does its most focused work early morning."
  if (!n) return empty(r)
  if (isDegenerateRepetition(n)) {
    return { ...r, errorType: 'repetitive_nonsense', priorityCorrection: 'c1RetryExplainArgument', explanation: 'c1RetryExplainArgument', retryRequired: true, retryPrompt: 'c1RetryPromptArgument' }
  }
  if (STANCE_ONLY_RE.test(n)) {
    return { ...r, errorType: 'opinion_without_reasoning', priorityCorrection: 'c1RetryExplainArgumentReason', explanation: 'c1RetryExplainArgumentReason', retryRequired: true, retryPrompt: 'c1RetryPromptArgumentReason' }
  }
  const hasStance = STANCE_RE.test(n)
  const hasImplication = IMPLICATION_RE.test(n)
  const hasReason = REASON_OR_EXAMPLE_RE.test(n) || (/[—-]/.test(text) && wordCount(n) >= 10)
  if (canDoId === 'weigh_implications_of_a_position' && hasImplication) {
    r.completedObjective = true
    r.confidence = 0.9
    r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseArgumentIndependent' : 'c1PraiseArgumentHelped'
    return r
  }
  if (hasStance && (hasReason || hasImplication)) {
    r.completedObjective = true
    r.confidence = 0.91
    r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseArgumentIndependent' : 'c1PraiseArgumentHelped'
    return r
  }
  if (hasStance && !hasReason) {
    return { ...r, errorType: 'missing_reasoning', priorityCorrection: 'c1RetryExplainArgumentReason', explanation: 'c1RetryExplainArgumentReason', retryRequired: true, retryPrompt: 'c1RetryPromptArgumentReason' }
  }
  return { ...r, errorType: 'no_structured_argument', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c1RetryPromptArgument' }
}

const HEDGE_MARKER_RE = /\b(arguably|by and large|to some extent|not necessarily|might well|is unlikely to|kind of|sort of|i'?m fairly sure that|it'?s not clear whether|there'?s a good chance that|i'?m fairly confident that)\b/
const VAGUE_HEDGE_ONLY_RE = /^it'?s (kind of|sort of) (better|worse|good|bad),? (kind of|sort of)\.?$/
const UNQUALIFIED_ABSOLUTE_RE = /\b(definitely|absolutely|100%|completely)\b[\s\S]{0,20}\b(full stop|no doubt|for sure)\b|^it'?s (definitely|absolutely) the (better|best|right) (option|choice|answer),? full stop\.?$/

export function evaluateQualifyClaim(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "It's arguably the more efficient option, though that's not necessarily true for every team."
  if (!n) return empty(r)
  if (isDegenerateRepetition(n)) {
    return { ...r, errorType: 'repetitive_nonsense', priorityCorrection: 'c1RetryExplainQualify', explanation: 'c1RetryExplainQualify', retryRequired: true, retryPrompt: 'c1RetryPromptQualify' }
  }
  if (UNQUALIFIED_ABSOLUTE_RE.test(n)) {
    return { ...r, errorType: 'stated_as_absolute', priorityCorrection: 'c1RetryExplainQualifyHedge', explanation: 'c1RetryExplainQualifyHedge', retryRequired: true, retryPrompt: 'c1RetryPromptQualifyHedge' }
  }
  if (VAGUE_HEDGE_ONLY_RE.test(n)) {
    return { ...r, errorType: 'hedge_too_vague', priorityCorrection: 'c1RetryExplainQualifyPrecise', explanation: 'c1RetryExplainQualifyPrecise', retryRequired: true, retryPrompt: 'c1RetryPromptQualifyPrecise' }
  }
  if (HEDGE_MARKER_RE.test(n) && wordCount(n) >= 4) {
    r.completedObjective = true
    r.confidence = 0.89
    r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseQualifyIndependent' : 'c1PraiseQualifyHelped'
    return r
  }
  return { ...r, errorType: 'no_hedge', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c1RetryPromptQualify' }
}

const CONCESSION_RE = /\b(i take your point that|while it'?s true that|that said|fair enough,? but|i can see your point,? but i still think|it'?s not that simple)\b/
const HOLD_CONTINUATION_RE = /\b(but|still|however|though|nonetheless|nevertheless)\b/
const FULL_SURRENDER_ONLY_RE = /^(yeah,? )?maybe\.?$/

export function evaluateConcedePoint(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "I take your point that it costs more upfront, but it still pays for itself within a year, so I'd still go with it."
  if (!n) return empty(r)
  if (isDegenerateRepetition(n)) {
    return { ...r, errorType: 'repetitive_nonsense', priorityCorrection: 'c1RetryExplainConcede', explanation: 'c1RetryExplainConcede', retryRequired: true, retryPrompt: 'c1RetryPromptConcede' }
  }
  if (FULL_SURRENDER_ONLY_RE.test(n)) {
    return { ...r, errorType: 'vague_acknowledgment', priorityCorrection: 'c1RetryExplainConcedeSpecific', explanation: 'c1RetryExplainConcedeSpecific', retryRequired: true, retryPrompt: 'c1RetryPromptConcedeSpecific' }
  }
  const hasConcession = CONCESSION_RE.test(n)
  const hasHold = HOLD_CONTINUATION_RE.test(n) && wordCount(n) >= 8
  if (hasConcession && hasHold) {
    r.completedObjective = true
    r.confidence = 0.9
    r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseConcedeIndependent' : 'c1PraiseConcedeHelped'
    return r
  }
  if (hasConcession && !hasHold) {
    return { ...r, errorType: 'concession_without_hold', priorityCorrection: 'c1RetryExplainConcedeHold', explanation: 'c1RetryExplainConcedeHold', retryRequired: true, retryPrompt: 'c1RetryPromptConcedeHold' }
  }
  return { ...r, errorType: 'no_concession', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c1RetryPromptConcede' }
}

/* ---------------------------------------------------------------------- */
/* Arc B — register_and_diplomacy                                          */
/* ---------------------------------------------------------------------- */

export function evaluateAdaptRegister(text, {
  independent = false, canDoId = null, registerCheck = false, expectedRegister = null,
} = {}) {
  const n = normalize(text)
  const r = base(independent)

  if (canDoId === 'repair_a_register_slip') {
    r.naturalVersion = "Sorry, that came out wrong — what I meant to say was, could we possibly revisit the deadline?"
    if (!n) return empty(r)
    r.registerAppropriateness = selfRepairAppropriateness(n)
    if (SELF_REPAIR_RE.test(n)) {
      r.completedObjective = true
      r.confidence = 0.9
      r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseRepairIndependent' : 'c1PraiseRepairHelped'
      return r
    }
    return { ...r, errorType: 'no_self_repair', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c1RetryPromptRepair' }
  }

  // adapt_register_to_audience / shift_register_within_one_conversation
  r.naturalVersion = expectedRegister === 'informal' ? 'Can you take a look at this when you get a chance?' : 'Would it be possible to get some feedback on this before Friday?'
  if (!n) return empty(r)
  if (isDegenerateRepetition(n)) {
    return { ...r, errorType: 'repetitive_nonsense', priorityCorrection: 'c1RetryExplainRegister', explanation: 'c1RetryExplainRegister', retryRequired: true, retryPrompt: 'c1RetryPromptRegister' }
  }
  if (registerCheck || expectedRegister) {
    r.registerAppropriateness = registerShiftAppropriateness(n, expectedRegister)
  }
  const wantsFormal = expectedRegister !== 'informal'
  const markers = wantsFormal ? REGISTER_FORMAL : REGISTER_INFORMAL
  const wrongMarkers = wantsFormal ? REGISTER_INFORMAL : REGISTER_FORMAL
  const hasRight = markers.some((m) => n.includes(m))
  const hasWrong = wrongMarkers.some((m) => n.includes(m))
  if (hasRight) {
    r.completedObjective = true
    r.confidence = 0.89
    r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseRegisterIndependent' : 'c1PraiseRegisterHelped'
    return r
  }
  if (hasWrong) {
    return { ...r, errorType: 'wrong_register', priorityCorrection: 'c1RetryExplainRegisterMismatch', explanation: 'c1RetryExplainRegisterMismatch', retryRequired: true, retryPrompt: 'c1RetryPromptRegisterMismatch' }
  }
  return { ...r, errorType: 'no_register_marker', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c1RetryPromptRegister' }
}

const MITIGATION_RE = /\b(i don'?t want to overstate this,? but|it might be worth considering|i wonder if|just a thought,? but)\b/
const DISAGREE_DIPLOMATIC_RE = /\b(i see it a bit differently|i'?d push back on that slightly|i'?m not sure i agree,? because)\b/
const BLUNT_RE = /\b(that'?s completely wrong|you clearly don'?t understand|this is ridiculous|unacceptable|whatever|i don'?t care|that'?s stupid)\b/
const FLAT_DISMISSAL_RE = /^(it'?s not great,? but whatever,? it'?s fine)\.?$/

export function evaluateHedgeStatement(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "I don't want to overstate this, but I think the current draft still needs some work before it goes out."
  if (!n) return empty(r)
  if (BLUNT_RE.test(n) || FLAT_DISMISSAL_RE.test(n)) {
    return { ...r, errorType: 'blunt_not_diplomatic', priorityCorrection: 'c1RetryExplainHedgeDiplomatic', explanation: 'c1RetryExplainHedgeDiplomatic', retryRequired: true, retryPrompt: 'c1RetryPromptHedgeDiplomatic' }
  }
  if (isDegenerateRepetition(n)) {
    return { ...r, errorType: 'repetitive_nonsense', priorityCorrection: 'c1RetryExplainHedge', explanation: 'c1RetryExplainHedge', retryRequired: true, retryPrompt: 'c1RetryPromptHedge' }
  }
  const hasMitigation = MITIGATION_RE.test(n)
  const hasDisagree = DISAGREE_DIPLOMATIC_RE.test(n)
  const hasContent = wordCount(n) >= 6
  if ((hasMitigation || hasDisagree) && hasContent) {
    r.completedObjective = true
    r.confidence = 0.89
    r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseHedgeIndependent' : 'c1PraiseHedgeHelped'
    return r
  }
  if (hasMitigation || hasDisagree) {
    return { ...r, errorType: 'hedge_underdeveloped', priorityCorrection: 'c1RetryExplainHedgeDevelop', explanation: 'c1RetryExplainHedgeDevelop', retryRequired: true, retryPrompt: 'c1RetryPromptHedgeDevelop' }
  }
  return { ...r, errorType: 'missing_diplomatic_hedge', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c1RetryPromptHedge' }
}

/* ---------------------------------------------------------------------- */
/* Arc C — synthesis_and_mediation (meaning-preservation floor)            */
/* ---------------------------------------------------------------------- */

const SUMMARY_CONNECTORS = [
  /*
   * `basically` is B2's own `summary_connector_pattern` marker, reused
   * rather than retaught — C1's own summarize_message examples
   * (`c1Intents.js`) lead with it, and B2's catalogue already grants it.
   */
  'basically',
  'the essential point is', 'boiled down', 'to cut a long story short', 'to put it more simply',
  'in more technical terms', "for someone who hasn't seen this before", 'to put it another way',
  'or rather', 'in other words', 'the gist is', 'put simply',
]
function markerNearStart(n, phrases, limit = 6) {
  for (const phrase of phrases) {
    const idx = n.indexOf(phrase)
    if (idx === -1) continue
    const wordsBefore = n.slice(0, idx).split(' ').filter(Boolean).length
    if (wordsBefore <= limit) return true
  }
  return false
}

export function evaluateSummarizeMessage(text, { independent = false, sourceText = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "Basically, the repair will happen next week, but only if we cover the cost of the part ourselves."
  if (!n) return empty(r)
  if (isVerbatimCopy(n, sourceText)) {
    return { ...r, errorType: 'verbatim_not_reformulated', priorityCorrection: 'c1RetryExplainSummaryAttempt', explanation: 'c1RetryExplainSummaryAttempt', retryRequired: true, retryPrompt: 'c1RetryPromptSummaryAttempt' }
  }
  const hasMarker = markerNearStart(n, SUMMARY_CONNECTORS)
  const hasContent = wordCount(n) >= 5
  if (hasMarker && hasContent) {
    r.completedObjective = true
    r.confidence = 0.87
    r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseSummaryIndependent' : 'c1PraiseSummaryHelped'
    return r
  }
  if (!hasMarker && hasContent) {
    return { ...r, errorType: 'missing_summary_marker', priorityCorrection: 'c1RetryExplainSummaryMarker', explanation: 'c1RetryExplainSummaryMarker', retryRequired: true, retryPrompt: 'c1RetryPromptSummaryMarker' }
  }
  return { ...r, errorType: 'summary_too_short', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c1RetryPromptSummaryMarker' }
}

const BOTH_SOURCES_RE = /\b(both sources agree that|where they differ is|both (reviews|sources|of them|accounts) agree)\b/
const ONE_SIDED_RE = /\b(they seemed to suggest that|she implied that)\b/
const AGREE_RE = /\b(agree|agrees|agreed|on the same page)\b/
const DISAGREE_RE = /\b(disagree|disagrees|disagreed|differ|differs|differed)\b/
const CONTRAST_CONNECTOR_RE = /\b(on the other hand|whereas|but|however)\b/

export function evaluateSynthesizeViewpoints(text, { independent = false, sourceText = '' } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "Both reviews agree the location is great, but they disagree on the noise — one calls it lively, the other calls it too loud."
  if (!n) return empty(r)
  if (isVerbatimCopy(n, sourceText)) {
    return { ...r, errorType: 'verbatim_not_synthesized', priorityCorrection: 'c1RetryExplainSynthesizeAttempt', explanation: 'c1RetryExplainSynthesizeAttempt', retryRequired: true, retryPrompt: 'c1RetryPromptSynthesizeAttempt' }
  }
  /*
   * The taught markers are one way in; naming BOTH what the sources agree on
   * AND what they disagree on (in either order, with or without a contrast
   * connector between them) is the real, general shape a natural synthesis
   * takes — c1Intents.js's own `naturalVariant` example ("They're on the
   * same page about the location, though one review found it lively where
   * the other found it disruptively loud") uses this shape, not the exact
   * taught phrase.
   */
  const hasBoth = BOTH_SOURCES_RE.test(n) || (AGREE_RE.test(n) && DISAGREE_RE.test(n))
    || (ONE_SIDED_RE.test(n) && CONTRAST_CONNECTOR_RE.test(n))
  const hasOneSideOnly = ONE_SIDED_RE.test(n) && !CONTRAST_CONNECTOR_RE.test(n) && !BOTH_SOURCES_RE.test(n) && !hasBoth
  if (hasBoth) {
    r.completedObjective = true
    r.confidence = 0.87
    r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseSynthesizeIndependent' : 'c1PraiseSynthesizeHelped'
    return r
  }
  if (hasOneSideOnly) {
    return { ...r, errorType: 'only_one_source', priorityCorrection: 'c1RetryExplainSynthesizeBoth', explanation: 'c1RetryExplainSynthesizeBoth', retryRequired: true, retryPrompt: 'c1RetryPromptSynthesizeBoth' }
  }
  return { ...r, errorType: 'no_synthesis', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c1RetryPromptSynthesizeBoth' }
}

/* ---------------------------------------------------------------------- */
/* Arc D — nuance_and_implication                                          */
/* ---------------------------------------------------------------------- */

const INFERENCE_MARKER_RE = /\b(what they probably mean is|reading between the lines|i have a feeling they'?re actually saying|i don'?t think they really mean that)\b/
const LITERAL_ONLY_RE = /^(they|he|she) (said|means?) (theyre|they'?re|its|it'?s) (busy|fine|okay|ok)\.?$/

export function evaluateInferMeaning(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "What they probably mean is that they're avoiding the catch-up, not that they're genuinely too busy."
  if (!n) return empty(r)
  if (isDegenerateRepetition(n)) {
    return { ...r, errorType: 'repetitive_nonsense', priorityCorrection: 'c1RetryExplainInfer', explanation: 'c1RetryExplainInfer', retryRequired: true, retryPrompt: 'c1RetryPromptInfer' }
  }
  if (LITERAL_ONLY_RE.test(n)) {
    return { ...r, errorType: 'taken_literally', priorityCorrection: 'c1RetryExplainInferLiteral', explanation: 'c1RetryExplainInferLiteral', retryRequired: true, retryPrompt: 'c1RetryPromptInferLiteral' }
  }
  if (INFERENCE_MARKER_RE.test(n) && wordCount(n) >= 5) {
    r.completedObjective = true
    r.confidence = 0.82
    r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseInferIndependent' : 'c1PraiseInferHelped'
    return r
  }
  // no fixed marker required — an unanticipated but substantive interpretation
  // is a genuine attempt this local floor cannot confirm or reject on its own.
  return { ...r, errorType: 'no_clear_inference', conclusive: wordCount(n) < 4, confidence: wordCount(n) < 4 ? 0.85 : 0.5, retryRequired: true, retryPrompt: 'c1RetryPromptInfer' }
}

/* ---------------------------------------------------------------------- */
/* Arc E — extended_structured_discourse (discourseCoherence, REQUIRED)    */
/* ---------------------------------------------------------------------- */

const COHESIVE_CONNECTOR_RE = /\b(however|having said that|on top of that|in this respect|as a result( of that)?|so,? basically,? what happened is|the first thing to say is)\b/
const SELF_CORRECT_RE = /\b(what i mean is|or rather|let me put that differently|to go back to what i was saying)\b/
const ABANDONS_THREAD_RE = /\b(anyway,? )?never mind\.?$/
const OPEN_CLOSE_RE = /\b(so,? to start|to wrap up|that'?s the situation,? in a nutshell)\b/
/*
 * `discourseCoherence`'s `graduationRelevance` is per-capability
 * (`c1EvaluationContracts.js`'s `C1_DISCOURSE_COHERENCE_OPT_IN`): required
 * for `produce_an_extended_structured_explanation`/
 * `use_cohesive_devices_across_a_turn`/`self_correct_without_losing_the_thread`
 * (and `sustain_a_conversation_across_topic_shifts`, handled in
 * `evaluateTrackDiscourse`), should-relevant-signal only for
 * `open_and_close_an_extended_turn`. A should-relevant signal informs, it
 * does not gate — hard-rejecting a short, genuinely correct open/close
 * frame on the same coherence metric a much longer required turn is held to
 * would grade `open_and_close_an_extended_turn` by the wrong bar.
 */
const DISCOURSE_COHERENCE_GATES = new Set([
  'produce_an_extended_structured_explanation', 'use_cohesive_devices_across_a_turn',
  'self_correct_without_losing_the_thread',
])

export function evaluateExtendedExplanation(text, { independent = false, canDoId = null, discourseCoherenceCheck = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "So, basically, what happened is the delivery got rescheduled twice. As a result, I had to rearrange my whole morning. Anyway, that's the situation."
  if (!n) return empty(r)

  if (discourseCoherenceCheck || wordCount(n) >= 10) {
    r.discourseCoherence = discourseCoherenceJudgment(text)
  }
  const coherenceGates = !canDoId || DISCOURSE_COHERENCE_GATES.has(canDoId)
  if (coherenceGates && r.discourseCoherence.checked && r.discourseCoherence.coherent === false) {
    return { ...r, errorType: `discourse_${r.discourseCoherence.incoherenceType}`, priorityCorrection: 'c1RetryExplainExtendedCoherence', explanation: 'c1RetryExplainExtendedCoherence', retryRequired: true, retryPrompt: 'c1RetryPromptExtendedCoherence' }
  }

  if (canDoId === 'self_correct_without_losing_the_thread') {
    if (ABANDONS_THREAD_RE.test(n)) {
      return { ...r, errorType: 'abandons_thread', priorityCorrection: 'c1RetryExplainSelfCorrect', explanation: 'c1RetryExplainSelfCorrect', retryRequired: true, retryPrompt: 'c1RetryPromptSelfCorrect' }
    }
    if (SELF_CORRECT_RE.test(n)) {
      r.completedObjective = true
      r.confidence = 0.88
      r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseSelfCorrectIndependent' : 'c1PraiseSelfCorrectHelped'
      return r
    }
    return { ...r, errorType: 'no_self_correction', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c1RetryPromptSelfCorrect' }
  }

  if (canDoId === 'open_and_close_an_extended_turn') {
    if (OPEN_CLOSE_RE.test(n)) {
      r.completedObjective = true
      r.confidence = 0.87
      r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseOpenCloseIndependent' : 'c1PraiseOpenCloseHelped'
      return r
    }
    return { ...r, errorType: 'no_open_close_frame', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c1RetryPromptOpenClose' }
  }

  // produce_an_extended_structured_explanation / use_cohesive_devices_across_a_turn
  const hasConnector = COHESIVE_CONNECTOR_RE.test(n) || LINKING_CONNECTORS.some((c) => n.includes(c))
  const multiSentence = splitSentences(text).length >= 2
  if (hasConnector && multiSentence) {
    r.completedObjective = true
    r.confidence = 0.88
    r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseExtendedIndependent' : 'c1PraiseExtendedHelped'
    return r
  }
  if (multiSentence && !hasConnector) {
    return { ...r, errorType: 'flat_list_no_connector', priorityCorrection: 'c1RetryExplainExtendedConnector', explanation: 'c1RetryExplainExtendedConnector', retryRequired: true, retryPrompt: 'c1RetryPromptExtendedConnector' }
  }
  return { ...r, errorType: 'not_extended', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c1RetryPromptExtended' }
}

/* ---------------------------------------------------------------------- */
/* Arc F — negotiation_and_complexity                                      */
/* ---------------------------------------------------------------------- */

const PROPOSAL_RE = /\b(what if we|would you be willing to|let'?s find a middle ground|if that doesn'?t work,? how about|given this new information|that changes things slightly|let'?s adjust for that|as a gesture of goodwill|to meet you halfway)\b/
const BARE_DEMAND_RE = /^(just )?give me the (slot|refund|money)\.?$/

export function evaluateNegotiateOutcome(text, { independent = false } = {}) {
  const n = normalize(text)
  const r = base(independent)
  r.naturalVersion = "What if we split the difference — you get the earlier slot next week, and I get it the week after?"
  if (!n) return empty(r)
  if (BARE_DEMAND_RE.test(n)) {
    return { ...r, errorType: 'demand_not_negotiation', priorityCorrection: 'c1RetryExplainNegotiateProposal', explanation: 'c1RetryExplainNegotiateProposal', retryRequired: true, retryPrompt: 'c1RetryPromptNegotiateProposal' }
  }
  if (isDegenerateRepetition(n)) {
    return { ...r, errorType: 'repetitive_nonsense', priorityCorrection: 'c1RetryExplainNegotiate', explanation: 'c1RetryExplainNegotiate', retryRequired: true, retryPrompt: 'c1RetryPromptNegotiate' }
  }
  const hasProposal = PROPOSAL_RE.test(n)
  const wellDeveloped = wordCount(n) >= 6
  if (hasProposal && wellDeveloped) {
    r.completedObjective = true
    r.confidence = 0.89
    r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseNegotiateIndependent' : 'c1PraiseNegotiateHelped'
    return r
  }
  if (hasProposal && !wellDeveloped) {
    return { ...r, errorType: 'proposal_underdeveloped', priorityCorrection: 'c1RetryExplainNegotiateDevelop', explanation: 'c1RetryExplainNegotiateDevelop', retryRequired: true, retryPrompt: 'c1RetryPromptNegotiateDevelop' }
  }
  return { ...r, errorType: 'no_proposal', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c1RetryPromptNegotiateProposal' }
}

/* ---------------------------------------------------------------------- */
/* Arc G — sustained_interaction (track_discourse: three canDos, one       */
/* dispatch key, distinguished by `ctx.canDoId` — see this file's own      */
/* header on why C1's content needs `canDoId`, not `subtype`, here)        */
/* ---------------------------------------------------------------------- */

const REFER_BACK_MARKER_RE = /\b(going back to what you said(?: earlier)? about|that point you raised(?: earlier)?|as for the other thing|like i said before)\b/
const VAGUE_REFER_RE = /^(like i said before|as i mentioned|i already said that)\.?\.?\.?$/
const CLOSE_SUMMARY_MARKER_RE = /\b(so,? to sum up what we'?ve agreed|before we wrap up)\b/

/*
 * `conversationStateTracking` — the structural floor: a reference marker
 * PLUS content words that overlap something actually buffered in
 * `conversationHistory` (the episode's own turn text so far, threaded by
 * `EpisodeShell.jsx`). No overlap with anything in the buffer, despite
 * naming something specific, reads as `misattributed` — the closed set
 * `c1EvaluationContracts.js`'s `C1_CONVERSATION_STATE_TRACKING_FIXTURES`
 * declares. This never claims verified factual accuracy (only the provider
 * can do that); it is the same honesty B2's meaning-preservation floor
 * already commits to for `isVerbatimCopy`.
 */
function referBackJudgment(text, n, conversationHistory) {
  if (!REFER_BACK_MARKER_RE.test(n)) return null
  if (VAGUE_REFER_RE.test(n) || wordCount(n) <= 4) {
    return { checked: true, correct: false, failureType: 'insufficient_specificity' }
  }
  const replyContent = contentWords(n)
  const historyContent = new Set((conversationHistory || []).flatMap((t) => [...contentWords(normalize(t))]))
  const overlaps = [...replyContent].some((w) => historyContent.has(w))
  if (overlaps) return { checked: true, correct: true, failureType: null }
  return { checked: true, correct: false, failureType: 'misattributed' }
}

export function evaluateTrackDiscourse(text, {
  independent = false, canDoId = null, discourseCoherenceCheck = false, conversationHistory = [],
} = {}) {
  const n = normalize(text)
  const r = base(independent)

  if (canDoId === 'refer_back_to_earlier_discourse') {
    r.naturalVersion = "Going back to what you said earlier about the deadline — that point you raised actually matters even more now."
    if (!n) return empty(r)
    const judged = referBackJudgment(text, n, conversationHistory)
    if (judged) {
      r.conversationStateTracking = judged
      if (judged.correct) {
        r.completedObjective = true
        r.confidence = 0.87
        r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseReferBackIndependent' : 'c1PraiseReferBackHelped'
        return r
      }
      /*
       * `insufficient_specificity` (a bare "like I said before" with no
       * content at all) is a confident, conclusive local reject. `misattributed`
       * — no overlap between the reply's content and the buffered history —
       * is a WEAKER signal: a real paraphrase that happens to share no
       * lexical items would look identical to this structural floor, and
       * this dimension never claims verified factual accuracy (only the
       * provider can). So it escalates rather than confidently rejecting,
       * the same honesty B2's `isVerbatimCopy` meaning-preservation floor
       * already commits to for its own local-only limits.
       */
      const misattributed = judged.failureType === 'misattributed'
      const errorType = misattributed ? 'misattributed_reference' : 'vague_reference'
      return { ...r, errorType, conclusive: !misattributed, confidence: misattributed ? 0.5 : r.confidence, priorityCorrection: 'c1RetryExplainReferBack', explanation: 'c1RetryExplainReferBack', retryRequired: true, retryPrompt: 'c1RetryPromptReferBack' }
    }
    return { ...r, errorType: 'no_reference', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c1RetryPromptReferBack' }
  }

  if (canDoId === 'close_a_complex_interaction_with_a_summary') {
    r.naturalVersion = "So, to sum up what we've agreed: the launch stays in March if testing goes fine. Before we wrap up, anything else?"
    if (!n) return empty(r)
    /*
     * `close_a_complex_interaction_with_a_summary` is should-relevant-signal
     * only for `discourseCoherence` (`C1_DISCOURSE_COHERENCE_OPT_IN`,
     * unlike `sustain_a_conversation_across_topic_shifts` below) — recorded
     * but not gating, the same reasoning `evaluateExtendedExplanation`'s own
     * `DISCOURSE_COHERENCE_GATES` comment gives for
     * `open_and_close_an_extended_turn`.
     */
    if (discourseCoherenceCheck || wordCount(n) >= 10) r.discourseCoherence = discourseCoherenceJudgment(text)
    if (CLOSE_SUMMARY_MARKER_RE.test(n)) {
      r.completedObjective = true
      r.confidence = 0.87
      r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseCloseSummaryIndependent' : 'c1PraiseCloseSummaryHelped'
      return r
    }
    return { ...r, errorType: 'missing_closing_summary_marker', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c1RetryPromptCloseSummary' }
  }

  // sustain_a_conversation_across_topic_shifts (default)
  r.naturalVersion = "Anyway, before I forget — speaking of which, that reminds me, I should tell you about the trip too."
  if (!n) return empty(r)
  r.discourseCoherence = discourseCoherenceJudgment(text)
  if (discourseCoherenceCheck && r.discourseCoherence.checked && r.discourseCoherence.coherent === false) {
    return { ...r, errorType: `topic_shift_${r.discourseCoherence.incoherenceType}`, priorityCorrection: 'c1RetryExplainSustainMarker', explanation: 'c1RetryExplainSustainMarker', retryRequired: true, retryPrompt: 'c1RetryPromptSustainMarker' }
  }
  if (hasRealTopicShiftMarker(text)) {
    r.completedObjective = true
    r.confidence = 0.88
    r.praiseKey = r.masteryEvidence.independent ? 'c1PraiseSustainIndependent' : 'c1PraiseSustainHelped'
    return r
  }
  return { ...r, errorType: 'missing_topic_shift_marker', conclusive: false, confidence: 0.5, retryRequired: true, retryPrompt: 'c1RetryPromptSustainMarker' }
}

/* Dispatcher for this level's intents, mirroring `evaluateFree`'s own shape
 * so cross-checking against the central switch is mechanical. Not itself
 * called from `engine/responseEvaluation.js`, which imports each function
 * directly (matching `levels/b2/evaluators.js`'s own precedent) — kept here
 * for `scripts/foundry/c1/**` structural proofs and any future direct use. */
export function evaluateC1Free(kind, text, ctx = {}) {
  switch (kind) {
    case 'state_structured_argument': return evaluateStateStructuredArgument(text, ctx)
    case 'qualify_claim': return evaluateQualifyClaim(text, ctx)
    case 'concede_point': return evaluateConcedePoint(text, ctx)
    case 'adapt_register': return evaluateAdaptRegister(text, ctx)
    case 'hedge_statement': return evaluateHedgeStatement(text, ctx)
    case 'summarize_message': return evaluateSummarizeMessage(text, ctx)
    case 'synthesize_viewpoints': return evaluateSynthesizeViewpoints(text, ctx)
    case 'infer_meaning': return evaluateInferMeaning(text, ctx)
    case 'extended_explanation': return evaluateExtendedExplanation(text, ctx)
    case 'negotiate_outcome': return evaluateNegotiateOutcome(text, ctx)
    case 'track_discourse': return evaluateTrackDiscourse(text, ctx)
    default: return { ...base(ctx.independent), understood: false, conclusive: true, retryRequired: true }
  }
}
