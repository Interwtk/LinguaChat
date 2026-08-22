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
  /*
   * A1 arc 6/7. Only reached on the remote-escalation path (the common,
   * locally-conclusive path uses each evaluator's own `praiseKey` directly,
   * per `levels/a1/evaluators.js`'s `withPraise` helper) — added anyway so an
   * ambiguous, remote-confirmed reply is never congratulated with an unrelated
   * episode's praise, the exact gap `docs/curriculum/implementation/a1/
   * core-requirements.md` §2 names.
   */
  state_ability: { independent: 'ep34PraiseIndependent', helped: 'ep34PraiseGuided' },
  ask_ability: { independent: 'ep35PraiseIndependent', helped: 'ep35PraiseGuided' },
  arrange_meeting: { independent: 'ep38PraiseIndependent', helped: 'ep38PraiseGuided' },
  /*
   * A2's 17 new intents. Same reason as A1 arc 6/7's three above — added so an
   * ambiguous, remote-confirmed A2 reply is never congratulated with an
   * unrelated episode's praise. Keyed to the episode each intent is FIRST
   * introduced in (per `levels/a2/episodes/**`'s own `evalKind` usage);
   * `state_availability` has no entry: it is not dispatched (see
   * `responseEvaluation.js`'s own comment) because no A2 episode uses it.
   */
  state_past_event: { independent: 'ep39PraiseIndependent', helped: 'ep39PraiseGuided' },
  ask_past_event: { independent: 'ep41PraiseIndependent', helped: 'ep41PraiseGuided' },
  narrate_past_sequence: { independent: 'ep42PraiseIndependent', helped: 'ep42PraiseGuided' },
  state_future_plan: { independent: 'ep43PraiseIndependent', helped: 'ep43PraiseGuided' },
  ask_future_plan: { independent: 'ep44PraiseIndependent', helped: 'ep44PraiseGuided' },
  describe_person_or_place: { independent: 'ep45PraiseIndependent', helped: 'ep45PraiseGuided' },
  compare_things: { independent: 'ep46PraiseIndependent', helped: 'ep46PraiseGuided' },
  state_opinion_with_reason: { independent: 'ep47PraiseIndependent', helped: 'ep47PraiseGuided' },
  give_multi_step_directions: { independent: 'ep49PraiseIndependent', helped: 'ep49PraiseGuided' },
  ask_availability: { independent: 'ep52PraiseIndependent', helped: 'ep52PraiseGuided' },
  make_booking: { independent: 'ep53PraiseIndependent', helped: 'ep53PraiseGuided' },
  spell_word: { independent: 'ep54PraiseIndependent', helped: 'ep54PraiseGuided' },
  report_problem: { independent: 'ep55PraiseIndependent', helped: 'ep55PraiseGuided' },
  ask_for_help: { independent: 'ep56PraiseIndependent', helped: 'ep56PraiseGuided' },
  invite_someone: { independent: 'ep58PraiseIndependent', helped: 'ep58PraiseGuided' },
  respond_to_invitation: { independent: 'ep59PraiseIndependent', helped: 'ep59PraiseGuided' },
  /*
   * B1's 14 new intents. Same reason as A1 arc 6/7's and A2's own additions
   * above — added so an ambiguous, remote-confirmed B1 reply is never
   * congratulated with an unrelated intent's praise. UNLIKE A2's own
   * additions (which needed brand new `ep<N>Praise...` keys), B1's own
   * `levels/b1/evaluators.js` already sets a specific `praiseKey` directly on
   * every conclusive local accept (mirroring A1 arc 6/7's `withPraise`
   * pattern) — these entries are reached ONLY on the remote-escalation path,
   * where no local `praiseKey` was set. Where an intent carries a subtype
   * with two independently authored praise keys (`narrate_past_event`:
   * sequence/interruption; `escalate_problem`: neutral/frustrated tone;
   * `change_topic`: initiate/follow), the primary/neutral variant's own key
   * is reused rather than inventing a fifteenth key for one fallback path —
   * every other B1 intent has exactly one praise key already, reused as-is.
   * `escalate_problem` is B1's runtime-renamed dispatch key for b1.json's
   * own `report_problem` — see `curriculum/b1Map.js`'s `B1_CAN_DO_INTENT`
   * comment for why.
   */
  narrate_past_event: { independent: 'b1PraiseSequenceIndependent', helped: 'b1PraiseSequenceHelped' },
  state_opinion: { independent: 'b1PraiseOpinionIndependent', helped: 'b1PraiseOpinionHelped' },
  agree_or_disagree: { independent: 'b1PraiseAgreeIndependent', helped: 'b1PraiseAgreeHelped' },
  compare_and_choose: { independent: 'b1PraiseCompareIndependent', helped: 'b1PraiseCompareHelped' },
  describe_experience: { independent: 'b1PraiseDescribeIndependent', helped: 'b1PraiseDescribeHelped' },
  recommend_or_warn: { independent: 'b1PraiseRecommendIndependent', helped: 'b1PraiseRecommendHelped' },
  escalate_problem: { independent: 'b1PraiseProblemIndependent', helped: 'b1PraiseProblemHelped' },
  negotiate_solution: { independent: 'b1PraiseNegotiateIndependent', helped: 'b1PraiseNegotiateHelped' },
  state_future_intent: { independent: 'b1PraiseFutureIndependent', helped: 'b1PraiseFutureHelped' },
  state_real_condition: { independent: 'b1PraiseConditionIndependent', helped: 'b1PraiseConditionHelped' },
  state_hypothetical: { independent: 'b1PraiseHypotheticalIndependent', helped: 'b1PraiseHypotheticalHelped' },
  change_topic: { independent: 'b1PraiseTopicChangeIndependent', helped: 'b1PraiseTopicChangeHelped' },
  ask_follow_up: { independent: 'b1PraiseFollowUpIndependent', helped: 'b1PraiseFollowUpHelped' },
  summarize_other: { independent: 'b1PraiseSummaryIndependent', helped: 'b1PraiseSummaryHelped' },
  /*
   * B2's 14 new intents. Same reason as every level above — reached ONLY on
   * the remote-escalation path, where `levels/b2/evaluators.js`'s own
   * `praiseKey` (set on every conclusive local accept) was not set.
   * `argue_opinion_with_reason` is B2's runtime-renamed dispatch key for
   * `develop_and_defend_opinion` — see `responseEvaluation.js`'s own comment.
   */
  argue_opinion_with_reason: { independent: 'b2PraiseOpinionIndependent', helped: 'b2PraiseOpinionHelped' },
  weigh_options: { independent: 'b2PraiseWeighIndependent', helped: 'b2PraiseWeighHelped' },
  concede_and_counter: { independent: 'b2PraiseConcedeIndependent', helped: 'b2PraiseConcedeHelped' },
  justify_a_request: { independent: 'b2PraiseJustifyIndependent', helped: 'b2PraiseJustifyHelped' },
  propose_a_resolution: { independent: 'b2PraiseProposeIndependent', helped: 'b2PraiseProposeHelped' },
  express_diplomatic_frustration: { independent: 'b2PraiseFrustrationIndependent', helped: 'b2PraiseFrustrationHelped' },
  state_unreal_hypothesis: { independent: 'b2PraiseHypothesisIndependent', helped: 'b2PraiseHypothesisHelped' },
  speculate_cause_or_effect: { independent: 'b2PraiseSpeculateIndependent', helped: 'b2PraiseSpeculateHelped' },
  express_past_regret: { independent: 'b2PraiseRegretIndependent', helped: 'b2PraiseRegretHelped' },
  summarize_for_third_party: { independent: 'b2PraiseSummaryIndependent', helped: 'b2PraiseSummaryHelped' },
  reformulate_for_clarity: { independent: 'b2PraiseReformulateIndependent', helped: 'b2PraiseReformulateHelped' },
  report_third_party_opinion: { independent: 'b2PraiseReportIndependent', helped: 'b2PraiseReportHelped' },
  shift_register: { independent: 'b2PraiseRegisterIndependent', helped: 'b2PraiseRegisterHelped' },
  soften_or_intensify_claim: { independent: 'b2PraiseSoftenIndependent', helped: 'b2PraiseSoftenHelped' },
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
    /*
     * `arrange_meeting` is the level's one `hybrid` capability and can reach
     * this payload; without its stage a remote judge cannot tell episode 36's
     * propose turn from episode 37/38's place/confirm ones.
     */
    arrange_stage: params.arrangeStage ?? '',
    /*
     * B1's own subtype fields — the intent's communicative FORM/tone/role,
     * not its topic. Same bug class as `arrange_stage` above: a remote judge
     * that does not know a `state_future_intent` turn asked for a `decision`
     * rather than a `hope` is grading a different question, and a
     * `change_topic` turn without its `role` cannot tell "start a new topic"
     * from "engage with one Lingua just raised".
     */
    narrative_form: params.narrativeForm ?? '',
    tone: params.tone ?? '',
    situation_form: params.situationForm ?? '',
    conversational_role: params.role ?? '',
    /*
     * B2's own subtype/context fields, same bug class as the fields above
     * them: without `subtype` a remote judge cannot tell a capstone
     * `shift_register` topic-shift turn from a plain register-formality one;
     * without `register_check`/`expected_register` it cannot tell which
     * register the turn actually asked for; without `source_text` a
     * mediation turn (`summarize_for_third_party`/`reformulate_for_clarity`/
     * `report_third_party_opinion`) cannot be judged for meaning-preservation
     * against anything, and a verbatim copy would look indistinguishable
     * from a real summary.
     */
    subtype: params.subtype ?? '',
    register_check: Boolean(params.registerCheck),
    expected_register: params.expectedRegister ?? '',
    discourse_coherence_check: Boolean(params.discourseCoherenceCheck),
    source_text: params.sourceText ?? '',
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
  const { step, learnerResponse, learnerName, scaffoldLevel, assistanceUsed = false, turnContext = null, place = '', targetNoun = '', targetThing = '', activity = '', partner = '', repairKind = '', meaningWord = '', quantityForm = '', timeForm = '', usualTime = '', targetCount = null, placeName = '', relationHint = '', abilityForm = '', arrangeStage = '', praisePrefix = '', expected = '', narrativeForm = '', tone = '', situationForm = '', role = '', subtype = '', registerCheck = false, expectedRegister = '', discourseCoherenceCheck = false, sourceText = '', signal, remote } = params
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
    /*
     * WHICH PLACE, and WHICH RELATION — arc 4's `ask_location`/`state_location` and
     * arc 5's `ask_price` all shape their model answer from these. They already
     * reached the provider payload (`buildRemotePayload` reads them off `params`
     * directly); this function's OWN local re-evaluation did not, so the verdict it
     * returns — the one actually shown, since both intents are deterministic_local
     * and never escalate — fell back to "the toilet" / "it" / "here" regardless of
     * the step's real place or relation. Same bug class as the repairKind/partner/
     * timeForm gaps above; see check-memory-and-story.mjs for the story-path twin.
     */
    ...(placeName ? { placeName } : {}),
    ...(relationHint ? { relationHint } : {}),
    /*
     * A1 arc 6/7's own subtype fields — `abilityForm` (`state_ability`'s
     * polarity), `arrangeStage` (`arrange_meeting`'s propose/place/confirm) and
     * `praisePrefix` (which episode's praise copy a shared `confirm` stage
     * uses). Same bug class as the fields above: without them here the
     * evaluator falls back to its own default (`arrangeStage`'s default is
     * `'propose'`), which graded episode 37/38's place/confirm turns as if
     * they were episode 36's proposal.
     */
    ...(abilityForm ? { abilityForm } : {}),
    ...(arrangeStage ? { arrangeStage } : {}),
    ...(praisePrefix ? { praisePrefix } : {}),
    /*
     * A2 arc 5's `spell_word`: the name the turn asks the learner to spell.
     * `evaluateSpellWord` has no default and returns `incomplete_spelling`
     * forever without it — same bug class as the fields above.
     */
    ...(expected ? { expected } : {}),
    /*
     * B1's own subtype fields, same bug class as the fields above them:
     * without these, `narrate_past_event` defaults to its `sequence` form
     * regardless of which one the turn asked for, `escalate_problem`
     * defaults to a neutral tone even on a frustration turn,
     * `state_future_intent` defaults to `decision` even on a hope/plan/
     * prediction turn, and `change_topic` defaults to `initiate` even on a
     * turn asking the learner to follow someone else's change.
     */
    ...(narrativeForm ? { narrativeForm } : {}),
    ...(tone ? { tone } : {}),
    ...(situationForm ? { situationForm } : {}),
    ...(role ? { role } : {}),
    /*
     * B2's own subtype/context fields — same bug class as every field above:
     * without `subtype`, `shift_register`/`propose_a_resolution` default to
     * their base (no-subtype) judgment even on a capstone topic-shift/
     * pushback turn; without `registerCheck`/`expectedRegister`, a register
     * turn is graded with no target register to hold it to; without
     * `sourceText`, a mediation turn's meaning-preservation floor cannot
     * tell a reformulation from a verbatim copy.
     */
    ...(subtype ? { subtype } : {}),
    ...(registerCheck ? { registerCheck } : {}),
    ...(expectedRegister ? { expectedRegister } : {}),
    ...(discourseCoherenceCheck ? { discourseCoherenceCheck } : {}),
    ...(sourceText ? { sourceText } : {}),
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
