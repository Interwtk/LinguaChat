/*
 * hybridEvaluation — routes a learner free reply through three levels:
 *
 *   Level 1  deterministic  — local, instant, used for every closed step and for
 *                             any free reply the local evaluator can judge with
 *                             confidence (clear accept, empty, clear failure).
 *   Level 2  remote (Lingua)— consulted ONLY for a non-empty free reply the local
 *                             evaluator could not confirm (a plausible but
 *                             unrecognized natural variant). `remote` is injected
 *                             so routing is fully testable without a network.
 *   Level 3  fallback       — if no remote, or it errors/times out/returns junk,
 *                             the conservative local verdict is used. It never
 *                             blocks: the learner keeps a hint and a second try.
 *
 * The remote is trusted to answer a narrow question — "is this an acceptable
 * natural variant for this step?" (+ an optional model answer). It can never
 * mark mastery and its free prose is not injected into the localized UI; the
 * learner model decides mastery from the returned evidence.
 */
import { evaluateFree, shouldEscalate } from './responseEvaluation.js'
import { isIndependentEvidence } from './scaffolding.js'

const PRAISE = {
  introduction: { independent: 'ep1PraiseIndependent', helped: 'ep1PraiseIm' },
  ask_name: { independent: 'ep2PraiseIndependent', helped: 'ep2PraiseAsked' },
  nice_to_meet: { independent: 'ep3PraiseIndependent', helped: 'ep3PraiseClose' },
  ask_wellbeing: { independent: 'ep4PraiseIndependent', helped: 'ep4PraiseAsked' },
  answer_wellbeing: { independent: 'ep4PraiseIndependent', helped: 'ep4PraiseAnswered' },
  reciprocal_question: { independent: 'ep4PraiseIndependent', helped: 'ep4PraiseBounce' },
  ask_origin: { independent: 'ep5PraiseIndependent', helped: 'ep5PraiseAsked' },
  answer_origin: { independent: 'ep5PraiseIndependent', helped: 'ep5PraiseAnswered' },
  full_intro_conversation: { independent: 'ep6PraiseIndependent', helped: 'ep6PraiseCombined' },
  express_like: { independent: 'ep7PraiseIndependent', helped: 'ep7PraiseLiked' },
  express_dislike: { independent: 'ep7PraiseIndependent', helped: 'ep7PraiseDisliked' },
  ask_preference: { independent: 'ep7PraiseIndependent', helped: 'ep7PraiseAsked' },
  yes_no_preference: { independent: 'ep7PraiseIndependent', helped: 'ep7PraiseShortAnswer' },
  express_want: { independent: 'ep8PraiseIndependent', helped: 'ep8PraiseAsked' },
  express_need: { independent: 'ep8PraiseIndependent', helped: 'ep8PraiseNeeded' },
  ask_want: { independent: 'ep8PraiseIndependent', helped: 'ep8PraiseOffered' },
  accept_offer: { independent: 'ep8PraiseIndependent', helped: 'ep8PraiseAnswered' },
  decline_offer: { independent: 'ep8PraiseIndependent', helped: 'ep8PraiseAnswered' },
  simple_plan_conversation: { independent: 'ep9PraiseIndependent', helped: 'ep9PraiseCombined' },
  polite_request: { independent: 'ep10PraiseIndependent', helped: 'ep10PraiseAsked' },
  thank_service: { independent: 'ep10PraiseIndependent', helped: 'ep10PraiseThanked' },
  respond_anything_else: { independent: 'ep11PraiseIndependent', helped: 'ep11PraiseAnswered' },
  finish_order: { independent: 'ep11PraiseIndependent', helped: 'ep11PraiseClosed' },
  cafe_order_conversation: { independent: 'ep12PraiseIndependent', helped: 'ep12PraiseOrdered' },
}

/*
 * Praise has to be about what the learner just did. Falling back to episode 1
 * meant a remote-settled cafe order was congratulated with "You used I'm before
 * your name." — flattering, specific, and about a different sentence entirely.
 * An unknown intent now gets plain, honest encouragement instead.
 */
const GENERIC_PRAISE = 'ep1FeedbackGood'

function praiseFor(kind, independent) {
  const p = PRAISE[kind]
  if (!p) return GENERIC_PRAISE
  return independent ? p.independent : p.helped
}

// Strictly validate whatever the remote returned; return a normalized subset or
// null. Accepts snake_case (backend) or camelCase. Rejects contradictions.
export function validateRemoteEvaluation(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null
  const completed = o.completed_objective ?? o.completedObjective
  if (typeof completed !== 'boolean') return null
  const retry = o.retry_required ?? o.retryRequired
  if (completed === true && retry === true) return null
  if (completed === false && retry === false) return null
  const natural = o.natural_version ?? o.naturalVersion
  if (natural != null && (typeof natural !== 'string' || natural.length === 0 || natural.length > 120)) return null
  let confidence = o.confidence
  if (typeof confidence !== 'number' || !(confidence >= 0 && confidence <= 1)) confidence = undefined
  return {
    completedObjective: completed,
    understood: o.understood !== false,
    acceptedVariant: Boolean(o.accepted_variant ?? o.acceptedVariant),
    naturalVersion: natural || null,
    confidence,
  }
}

function buildRemotePayload(params, kind) {
  const { episode, step } = params
  return {
    episode_id: episode?.id ?? null,
    step_id: step?.id ?? String(params.stepIndex ?? ''),
    can_do_id: episode?.canDoId ?? null,
    step_type: step?.type ?? null,
    expected_intent: kind ?? null,
    required_elements: step?.itemIds || [],
    accepted_variants: [],
    target_items: step?.itemIds || [],
    learner_response: params.learnerResponse ?? '',
    learner_name: params.learnerName ?? '',
    learner_place: params.place ?? '',
    target_noun: params.targetNoun ?? '',
    target_thing: params.targetThing ?? '',
    target_activity: params.activity ?? '',
    /*
     * Which repair the turn asked for. Repair is one intent with three
     * strategies, so a verdict without this field is a verdict about a different
     * question — and Lingua would be asked to grade "Can you repeat, please?"
     * against "I don’t understand."
     */
    repair_kind: params.repairKind ?? '',
    /*
     * And the one word an `ask_meaning` turn is about, for the same reason: asking
     * Lingua to grade "What does 'late' mean?" without telling it which word was on
     * screen is asking about a different question.
     */
    meaning_word: params.meaningWord ?? '',
    /*
     * What shape of quantity the turn asked for, and how many of what. Separate
     * fields on purpose: "two" and "sandwiches" mean different things, and the
     * one time this project put two meanings in one string it produced "I need
     * music."
     */
    quantity_form: params.quantityForm ?? '',
    target_count: Number.isInteger(params.targetCount) ? params.targetCount : null,
    /*
     * WHO the turn is about. Arc 3's introductions name a roleplay partner, so a
     * verdict formed without this field says "This is Ana." to a learner whose
     * partner on screen is somebody else. It is a property of the TASK — the
     * episode chose the name — never a person from the learner's own life.
     */
    partner_name: params.partner ?? '',
    /*
     * WHICH PLACE, and WHICH RELATION. Arc 4's turns are about a public place the
     * episode named — a toilet, an exit, a station — and its answers imply one of
     * four relations. Both are properties of the TASK, like `partner_name`, and both
     * travel for the same reason: a verdict on "Where is ___?" formed without the
     * place models a question the learner was not asked. Nothing here is ever a
     * place from the learner's own life; the arc stores none.
     */
    place_name: params.placeName ?? '',
    relation_hint: params.relationHint ?? '',
    interest_id: params.interestId ?? null,
    native_language: params.nativeLanguage ?? 'en',
    interface_language: params.interfaceLanguage ?? 'en',
    target_language: params.targetLanguage ?? 'en',
    scaffold_level: params.scaffoldLevel ?? 'high',
    assistance_used: Boolean(params.assistanceUsed),
    previous_attempts: params.previousAttempts ?? 0,
    turn_context: params.turnContext ?? null,
  }
}

export async function evaluateEpisodeResponse(params) {
  const { step, learnerResponse, learnerName, scaffoldLevel, assistanceUsed = false, turnContext = null, place = '', targetNoun = '', targetThing = '', activity = '', partner = '', repairKind = '', meaningWord = '', quantityForm = '', timeForm = '', usualTime = '', targetCount = null, signal, remote } = params
  const kind = step?.evalKind
  /*
   * Whether this counts as unaided production, used only to choose the wording
   * of the praise. It comes from what the learner DID — the caller decides, and
   * the format decides if the caller does not. It used to be derived from the
   * support level, which meant a learner typing an unaided sentence while a
   * suggestion sat on screen was congratulated as if they had copied it.
   */
  const independent = typeof params.independent === 'boolean'
    ? params.independent
    : isIndependentEvidence({ step, assistanceUsed, correct: true })
  // The same context the caller previewed with, so the shown verdict and the
  // model answer can never disagree about what this episode is about.
  const local = evaluateFree(kind, learnerResponse, {
    name: learnerName, independent, turnContext, place,
    ...(targetNoun ? { targetNoun } : {}),
    ...(targetThing ? { targetThing } : {}),
    ...(activity ? { activity } : {}),
    ...(repairKind ? { repairKind } : {}),
    ...(partner ? { partner } : {}),
    /*
     * A step's SUBTYPE has to travel with it. Arc 2's routine turn says which kind
     * of "when" it wants and arc 2's repair says which word it is about; without
     * them here the router previewed one question and graded another — a turn
     * demanding an hour accepted a sentence with no time in it.
     */
    ...(meaningWord ? { meaningWord } : {}),
    ...(quantityForm ? { quantityForm } : {}),
    ...(timeForm ? { timeForm } : {}),
    ...(usualTime ? { usualTime } : {}),
    ...(Number.isInteger(targetCount) ? { targetCount } : {}),
  })

  // Conclusive local verdict (closed step, clear accept, empty, clear failure).
  if (!shouldEscalate(local)) return { ...local, source: 'deterministic' }

  // Ambiguous free reply → consult Lingua when a remote is available.
  if (typeof remote === 'function') {
    let raw = null
    try { raw = await remote(buildRemotePayload(params, kind), signal) } catch { raw = null }
    const v = validateRemoteEvaluation(raw)
    if (v) {
      if (v.completedObjective) {
        return {
          ...local,
          source: 'remote',
          understood: true,
          completedObjective: true,
          acceptedVariant: true,
          confidence: v.confidence ?? 0.8,
          conclusive: true,
          errorType: null,
          priorityCorrection: null,
          explanation: null,
          retryRequired: false,
          retryPrompt: null,
          naturalVersion: v.naturalVersion || local.naturalVersion,
          praiseKey: praiseFor(kind, independent),
        }
      }
      // Remote agrees it is not complete → keep the localized reject, optionally
      // adopting a cleaner model answer.
      return { ...local, source: 'remote', naturalVersion: v.naturalVersion || local.naturalVersion }
    }
  }

  // Level 3 — safe conservative fallback (never blocks the learner).
  return { ...local, source: 'fallback' }
}
