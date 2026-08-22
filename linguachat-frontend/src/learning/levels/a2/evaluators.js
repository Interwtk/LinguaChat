/*
 * A2 evaluator reference implementations — level-owned, not dispatched.
 *
 * `engine/responseEvaluation.js`'s per-intent `evaluateFree` switch is a shared,
 * flat dispatcher (curriculum-isolation-plan.md's survey names it explicitly,
 * and names A2 as "most likely" the level that builds the first real per-level
 * extension of it). This task's write scope does not include `engine/**`, so
 * nothing here is wired into that switch — see
 * `docs/curriculum/implementation/a2/core-requirements.md` for the exact,
 * content-informed ask to whichever task does have that scope (`LC-INT-001`).
 *
 * What IS delivered here: a full, working, testable reference implementation
 * for every one of A2's 17 new intents (`a2.json#intentStrategy.newIntents`),
 * built against the exact same result contract `engine/responseEvaluation.js`'s
 * `base()` already returns — so wiring this in later is a dispatch-table edit,
 * not a rewrite. `normalize`/`fold` are imported (read-only) from that module
 * rather than duplicated, since they are pure string utilities with no level
 * awareness; nothing is imported the other way.
 *
 * Also implements, as real working code rather than only a proposal, the
 * two-clause judgment `a2.json#coreEngineRequirements` asks for: a canonical
 * clause + connector + clause shape, refusing a correct-clause-1 paired with a
 * nonsense/irrelevant clause-2 (and vice versa), and refusing an untaught
 * connector. `check-a2-evaluators.mjs` runs the refusal battery this
 * requirement's `testsRequired` field describes.
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
})

const empty = (r) => ({ ...r, understood: false, confidence: 0.95, errorType: 'empty', conclusive: true, retryRequired: true })

/*
 * The level's one closed irregular-past set (a2.json#patterns
 * simple_past_irregular_pattern). Exactly ten verbs — see a2.md's risk note
 * on why the set stays bounded.
 */
export const IRREGULAR_PAST = ['went', 'had', 'saw', 'did', 'met', 'ate', 'got', 'took', 'made', 'said']
const IRREGULAR_PAST_RE = new RegExp(`\\b(${IRREGULAR_PAST.join('|')})\\b`)
const REGULAR_PAST_RE = /\b\w+ed\b/
const SEQUENCING_CONNECTORS = ['first', 'then', 'after that', 'later']
const CLAUSE_CONNECTORS = ['and', 'but', 'so', 'because', 'when']

/* ---------------------------------------------------------------------- */
/* Two-clause judgment — the CORE requirement, implemented and testable.   */
/* ---------------------------------------------------------------------- */

/**
 * Judges a canonical "clause + connector + clause" reply.
 * `connectors`: the closed set of connectors this capability accepts.
 * `clause1Test`/`clause2Test`: (normalizedClauseText) => boolean.
 * Refuses (understood:false, conclusive:true) when either clause fails its own
 * test, or when the connector present is not in the taught closed set — never a
 * silent pass. A connector-free reply with two independently-passing clause-like
 * fragments is NOT accepted: the connector is part of the capability.
 */
export function twoClauseJudgment(text, { connectors, clause1Test, clause2Test, independent = false }) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)

  // Find the EARLIEST connector occurrence that actually sits BETWEEN two
  // clauses (index > 0, and not running to the end of the string) — not just
  // the first connector name in array order. A leading "First I went to work,
  // then I had lunch" must split at "then", not at "first" (which sits at
  // index 0 and would produce an empty first clause).
  let best = null
  for (const c of connectors) {
    const re = new RegExp(`\\b${c}\\b`, 'g')
    let m
    while ((m = re.exec(n))) {
      if (m.index > 0 && m.index + m[0].length < n.length) {
        if (!best || m.index < best.index) best = { connector: m[0], index: m.index }
      }
    }
  }
  if (!best) {
    // No connector in a valid mid-sentence position: could be a single clause
    // (near miss, not nonsense) — non-conclusive so a hybrid router may still
    // escalate, per a2.md's evaluator strategy ("escalation is for a reply
    // that is inconclusive").
    return { ...r, understood: false, errorType: 'missing_connector', confidence: 0.6, conclusive: false, retryRequired: true }
  }
  const clause1 = n.slice(0, best.index).trim()
  const clause2 = n.slice(best.index + best.connector.length).trim()
  const c1ok = clause1Test(clause1)
  const c2ok = clause2Test(clause2)

  if (c1ok && c2ok) {
    r.completedObjective = true
    r.confidence = 0.93
    r.discourseCoherence = { checked: true, coherent: true, clausesEvaluated: 2, incoherenceType: null }
    return r
  }
  // Explicit refusal cases the CORE requirement's testsRequired names:
  // correct-clause-1 + nonsense-clause-2 must fail, and vice versa.
  return {
    ...r,
    understood: false,
    completedObjective: false,
    errorType: !c1ok && !c2ok ? 'both_clauses_invalid' : !c1ok ? 'first_clause_invalid' : 'second_clause_invalid',
    confidence: 0.85,
    conclusive: true,
    discourseCoherence: { checked: true, coherent: false, clausesEvaluated: 2, incoherenceType: !c1ok ? 'first_clause' : 'second_clause' },
    retryRequired: true,
  }
}

/* ---------------------------------------------------------------------- */
/* Arc 1 — what_happened                                                   */
/* ---------------------------------------------------------------------- */

export function evaluateStatePastEvent(text, { independent = false, timeExpression = null } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)
  const hasPast = REGULAR_PAST_RE.test(n) || IRREGULAR_PAST_RE.test(n)
  const hasSubject = /\bi\b/.test(n)
  if (hasPast && hasSubject) {
    r.completedObjective = true
    r.confidence = 0.94
    r.acceptedVariant = IRREGULAR_PAST_RE.test(n)
    if (timeExpression && !new RegExp(`\\b${timeExpression}\\b`).test(n)) r.acceptedVariant = true
    return r
  }
  // A present-tense statement where a past was asked for is the level's own
  // named evaluator-design problem: "correct meaning but insufficient target
  // form" (a2.md §11) — must be judged, not silently accepted.
  if (hasSubject && /\b(work|study|live|go|eat|have|see|do|get|make|say|meet|take)\b/.test(n) && !hasPast) {
    return { ...r, understood: true, completedObjective: false, errorType: 'wrong_tense_present_for_past', confidence: 0.8, conclusive: true, retryRequired: true }
  }
  return { ...r, understood: false, errorType: 'no_past_verb', confidence: 0.7, conclusive: false, retryRequired: true }
}

export function evaluateAskPastEvent(text, { independent = false } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)
  if (/^did you\b.*\?$|^did you\b/.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    return r
  }
  if (/^(do|are) you\b/.test(n)) {
    return { ...r, understood: true, errorType: 'wrong_tense_present_for_past', confidence: 0.75, conclusive: true, retryRequired: true }
  }
  return { ...r, understood: false, errorType: 'not_a_question', confidence: 0.6, conclusive: false, retryRequired: true }
}

export function evaluateNarratePastSequence(text, { independent = false } = {}) {
  return twoClauseJudgment(text, {
    connectors: SEQUENCING_CONNECTORS,
    clause1Test: (c) => REGULAR_PAST_RE.test(c) || IRREGULAR_PAST_RE.test(c),
    clause2Test: (c) => REGULAR_PAST_RE.test(c) || IRREGULAR_PAST_RE.test(c),
    independent,
  })
}

/* ---------------------------------------------------------------------- */
/* Arc 2 — making_plans                                                    */
/* ---------------------------------------------------------------------- */

export function evaluateStateFuturePlan(text, { independent = false } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)
  if (/\bi'?m going to\b|\bi am going to\b/.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    return r
  }
  if (REGULAR_PAST_RE.test(n) || IRREGULAR_PAST_RE.test(n)) {
    return { ...r, understood: true, errorType: 'wrong_tense_past_for_future', confidence: 0.75, conclusive: true, retryRequired: true }
  }
  return { ...r, understood: false, errorType: 'no_going_to', confidence: 0.65, conclusive: false, retryRequired: true }
}

export function evaluateAskFuturePlan(text, { independent = false } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)
  if (/^are you going to\b/.test(n)) {
    r.completedObjective = true
    r.confidence = 0.95
    return r
  }
  return { ...r, understood: false, errorType: 'wrong_question_form', confidence: 0.6, conclusive: false, retryRequired: true }
}

/* ---------------------------------------------------------------------- */
/* Arc 3 — people_and_places                                               */
/* ---------------------------------------------------------------------- */

const QUALITY_WORD = /\b(?:big|small|quiet|noisy|expensive|cheap|friendly|unfriendly|clean|dirty|old|new|modern|crowded|empty|safe|central|nice|good|bad)\b/
const QUALITY_WORD_G = new RegExp(QUALITY_WORD.source, 'g')

export function evaluateDescribePersonOrPlace(text, { independent = false } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)
  // Non-capturing QUALITY_WORD + a global counting variant: a capturing group
  // would double-count each match (match[0] + match[1]) under String.match.
  const attributeCount = (n.match(QUALITY_WORD_G) || []).length + (/\bthere (is|are)\b/.test(n) ? 1 : 0)
  const hasThirdPersonS = /\b(he|she|it)'?s?\b.*\b\w+s\b/.test(n) || /\bhe\s+\w+s\b|\bshe\s+\w+s\b/.test(n)
  const multiAttribute = attributeCount >= 2 || /\band\b/.test(n)
  if (attributeCount >= 1 && multiAttribute) {
    r.completedObjective = true
    r.confidence = 0.88
    r.acceptedVariant = hasThirdPersonS
    return r
  }
  if (attributeCount === 1) {
    // Single attribute is A1's own ceiling ("She's a student") — insufficient
    // for A2's evidence target, not wrong, just not yet the capability.
    return { ...r, understood: true, errorType: 'single_attribute_only', confidence: 0.75, conclusive: true, retryRequired: true }
  }
  return { ...r, understood: false, errorType: 'no_attribute', confidence: 0.6, conclusive: false, retryRequired: true }
}

export function evaluateCompareThings(text, { independent = false } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)
  // Explicitly refuse a superlative — A2's deferred-to-B1 ceiling, named in
  // a2.json#deferredToB1.
  if (/\bthe (biggest|smallest|quietest|most\s+\w+|best|worst)\b/.test(n)) {
    return { ...r, understood: true, errorType: 'superlative_not_taught', confidence: 0.85, conclusive: true, retryRequired: true }
  }
  const comparative = /\b\w+er than\b/.test(n) || /\bmore \w+ than\b/.test(n) || /\b(better|worse) than\b/.test(n)
  if (comparative) {
    r.completedObjective = true
    r.confidence = 0.93
    return r
  }
  return { ...r, understood: false, errorType: 'no_comparative', confidence: 0.6, conclusive: false, retryRequired: true }
}

export function evaluateStateOpinionWithReason(text, { independent = false } = {}) {
  return twoClauseJudgment(text, {
    connectors: ['because'],
    clause1Test: (c) => /\b(i (like|love|prefer|think|don'?t like))\b/.test(c) || QUALITY_WORD.test(c),
    // A real reason needs a subject or a quality word, not just two tokens —
    // "banana purple" is two words but not a reason.
    clause2Test: (c) => c.split(' ').filter(Boolean).length >= 2 && (/\b(i|it|it'?s|he|she|they|we|there)\b/.test(c) || QUALITY_WORD.test(c)),
    independent,
  })
}

/* ---------------------------------------------------------------------- */
/* Arc 4 — getting_around                                                  */
/* ---------------------------------------------------------------------- */

export function evaluateGiveMultiStepDirections(text, { independent = false } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)
  // Count OCCURRENCES of a sequencing connector, not distinct connector types —
  // "then...then...then" is three steps' worth of "then", not one.
  const stepConnectors = SEQUENCING_CONNECTORS.reduce((sum, c) => sum + (n.match(new RegExp(`\\b${c}\\b`, 'g')) || []).length, 0)
  const hasDirectionVerb = /\b(turn|go|walk)\b/.test(n)
  // A2's own explicit ceiling: verbal, at most three steps, never a map.
  const stepCount = 1 + stepConnectors
  if (hasDirectionVerb && stepConnectors >= 1 && stepCount <= 3) {
    r.completedObjective = true
    r.confidence = 0.88
    return r
  }
  if (stepCount > 3) {
    return { ...r, understood: true, errorType: 'exceeds_three_step_ceiling', confidence: 0.8, conclusive: true, retryRequired: true }
  }
  return { ...r, understood: false, errorType: 'no_direction', confidence: 0.6, conclusive: false, retryRequired: true }
}

/* ---------------------------------------------------------------------- */
/* Arc 5 — booking_a_stay                                                  */
/* ---------------------------------------------------------------------- */

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
const MONTH_RE = new RegExp(`\\b(${MONTHS.join('|')})\\b`)
const ORDINAL_RE = /\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|twenty-first|thirtieth|thirty-first)\b/

export function evaluateAskAvailability(text, { independent = false } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)
  if (/\b(do you have|is there)\b.*\b(for|on)\b/.test(n) && (MONTH_RE.test(n) || ORDINAL_RE.test(n) || /\bthat date\b/.test(n))) {
    r.completedObjective = true
    r.confidence = 0.9
    return r
  }
  if (/\b(do you have|is there)\b/.test(n)) {
    // Availability asked without a date is a near miss, not nonsense.
    return { ...r, understood: true, errorType: 'missing_date', confidence: 0.7, conclusive: true, retryRequired: true }
  }
  return { ...r, understood: false, errorType: 'no_availability_question', confidence: 0.6, conclusive: false, retryRequired: true }
}

export function evaluateStateAvailability(text, { independent = false } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)
  if (/\b(yes|no)\b/.test(n) && (MONTH_RE.test(n) || ORDINAL_RE.test(n) || /\b(available|free|full|booked)\b/.test(n))) {
    r.completedObjective = true
    r.confidence = 0.87
    return r
  }
  return { ...r, understood: false, errorType: 'no_availability_statement', confidence: 0.6, conclusive: false, retryRequired: true }
}

export function evaluateMakeBooking(text, { independent = false } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)
  const hasBookingVerb = /\bi'?d like to book\b|\bi would like to book\b|\bcan i book\b/.test(n)
  const hasDate = MONTH_RE.test(n) || ORDINAL_RE.test(n)
  const hasPartySize = /\b(for )?(a table for |a room for )?\d+( people)?\b/.test(n) || /\btwo\b|\bthree\b|\bfour\b/.test(n)
  if (hasBookingVerb && (hasDate || hasPartySize)) {
    r.completedObjective = true
    r.confidence = 0.88
    return r
  }
  if (hasBookingVerb) return { ...r, understood: true, errorType: 'missing_detail', confidence: 0.7, conclusive: true, retryRequired: true }
  return { ...r, understood: false, errorType: 'no_booking_request', confidence: 0.6, conclusive: false, retryRequired: true }
}

/**
 * `spell_word` — letter-by-letter production only. NEVER treats the spelled
 * value as capturable personal data: this function returns no fact-worthy
 * field at all, on purpose (see core-requirements.md's privacy-boundary ask).
 */
export function evaluateSpellWord(text, { expected, independent = false } = {}) {
  const r = base(independent)
  const raw = String(text || '').trim()
  if (!raw) return empty(r)
  // fold() first so a spelled name with an accent (e.g. "e acute" for é) still
  // matches a plain-letter target — accent-lenient, same as A1's name matching.
  const letters = fold(raw).replace(/[^a-zA-Z]/g, '').toUpperCase()
  const target = fold(String(expected || '')).replace(/[^a-zA-Z]/g, '').toUpperCase()
  if (target && letters === target) {
    r.completedObjective = true
    r.confidence = 0.97
    return r
  }
  if (target && letters.length === target.length) {
    return { ...r, understood: true, errorType: 'letter_mismatch', confidence: 0.7, conclusive: true, retryRequired: true }
  }
  return { ...r, understood: letters.length > 0, errorType: 'incomplete_spelling', confidence: 0.6, conclusive: false, retryRequired: true }
}

/* ---------------------------------------------------------------------- */
/* Arc 6 — everyday_problems                                               */
/* ---------------------------------------------------------------------- */

const PROBLEM_PHRASE = /\b(there'?s a problem|doesn'?t work|isn'?t working|i lost|i'?ve lost|the wrong one|it'?s (too )?(cold|noisy)|not what i ordered)\b/

export function evaluateReportProblem(text, { independent = false } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)
  if (PROBLEM_PHRASE.test(n)) {
    r.completedObjective = true
    r.confidence = 0.9
    return r
  }
  // A feeling statement ("I'm cold") is deliberately refused here — a malfunction
  // is not an emotional state (semanticTypes.js `problem` vs `feeling`).
  if (/^i'?m (cold|tired|hungry|sad)\.?$/.test(n)) {
    return { ...r, understood: true, errorType: 'feeling_not_problem', confidence: 0.8, conclusive: true, retryRequired: true }
  }
  return { ...r, understood: false, errorType: 'no_problem_stated', confidence: 0.6, conclusive: false, retryRequired: true }
}

export function evaluateAskForHelp(text, { independent = false } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)
  if (/\bcan you help me\b|\bwhat should i do\b|\bcould you help\b/.test(n)) {
    r.completedObjective = true
    r.confidence = 0.92
    return r
  }
  return { ...r, understood: false, errorType: 'no_help_request', confidence: 0.6, conclusive: false, retryRequired: true }
}

/* ---------------------------------------------------------------------- */
/* Arc 7 — lets_do_something                                               */
/* ---------------------------------------------------------------------- */

export function evaluateInviteSomeone(text, { independent = false } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)
  if (/\bwould you like to\b|\bdo you want to\b/.test(n)) {
    r.completedObjective = true
    r.confidence = 0.94
    return r
  }
  return { ...r, understood: false, errorType: 'no_invitation_form', confidence: 0.6, conclusive: false, retryRequired: true }
}

export function evaluateRespondToInvitation(text, { independent = false } = {}) {
  const r = base(independent)
  const n = normalize(text)
  if (!n) return empty(r)
  const accepts = /\byes\b|\bi'?d love to\b|\bi would love to\b|\bi'?d like that\b|\bsounds good\b/.test(n)
  const declinesWithReason = twoClauseJudgment(n, {
    connectors: ['but', 'because'],
    clause1Test: (c) => /\b(i'?d love to|no|sorry|i can'?t)\b/.test(c),
    clause2Test: (c) => c.split(' ').filter(Boolean).length >= 2,
    independent,
  })
  if (accepts && !/\bbut\b|\bbecause\b/.test(n)) {
    r.completedObjective = true
    r.confidence = 0.9
    return r
  }
  if (declinesWithReason.completedObjective) return declinesWithReason
  if (/\bno\b|\bsorry\b|\bi can'?t\b/.test(n)) {
    // A bare decline with no reason is a real, named near-miss: A2's evidence
    // target requires a because-clause on a decline (a2.md §9/§11).
    return { ...r, understood: true, errorType: 'decline_missing_reason', confidence: 0.75, conclusive: true, retryRequired: true }
  }
  return { ...r, understood: false, errorType: 'no_response', confidence: 0.6, conclusive: false, retryRequired: true }
}

/**
 * `keep_a_longer_conversation_going` reuses `respond_to_invitation`'s intent
 * for its accept/decline half and layers a topic-shift connector judgment on
 * top — a2.json does not list it as an 18th distinct intent (only 17 are
 * named), so this level treats it as a subtype rather than inventing an id
 * outside the blueprint.
 */
export function evaluateKeepConversationGoing(text, { independent = false } = {}) {
  return twoClauseJudgment(text, {
    connectors: CLAUSE_CONNECTORS,
    clause1Test: (c) => c.split(' ').filter(Boolean).length >= 1,
    clause2Test: (c) => c.split(' ').filter(Boolean).length >= 2,
    independent,
  })
}

export const A2_EVALUATORS = {
  state_past_event: evaluateStatePastEvent,
  ask_past_event: evaluateAskPastEvent,
  narrate_past_sequence: evaluateNarratePastSequence,
  state_future_plan: evaluateStateFuturePlan,
  ask_future_plan: evaluateAskFuturePlan,
  describe_person_or_place: evaluateDescribePersonOrPlace,
  compare_things: evaluateCompareThings,
  state_opinion_with_reason: evaluateStateOpinionWithReason,
  give_multi_step_directions: evaluateGiveMultiStepDirections,
  ask_availability: evaluateAskAvailability,
  state_availability: evaluateStateAvailability,
  make_booking: evaluateMakeBooking,
  spell_word: evaluateSpellWord,
  report_problem: evaluateReportProblem,
  ask_for_help: evaluateAskForHelp,
  invite_someone: evaluateInviteSomeone,
  respond_to_invitation: evaluateRespondToInvitation,
}

/*
 * Sanity check against the blueprint: exactly the 17 intents
 * `a2.json#intentStrategy.newIntents` names, no more, no fewer. Exported so
 * `check-a2-structure.mjs` can assert it without re-deriving the list.
 */
export const A2_NEW_INTENTS = [
  'state_past_event', 'ask_past_event', 'narrate_past_sequence',
  'state_future_plan', 'ask_future_plan',
  'describe_person_or_place', 'compare_things', 'state_opinion_with_reason',
  'give_multi_step_directions',
  'ask_availability', 'state_availability', 'make_booking', 'spell_word',
  'report_problem', 'ask_for_help',
  'invite_someone', 'respond_to_invitation',
]

