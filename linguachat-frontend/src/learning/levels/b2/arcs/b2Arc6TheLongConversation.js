/*
 * B2 arc 6 — "The long conversation" (`the_long_conversation`), the level's
 * capstone. Derived from docs/curriculum/blueprints/b2.json arc
 * `the_long_conversation` and b2.md section 4/7.
 *
 * SHAPE. One extended (16-20 meaningful-turn) conversation, not four short
 * episodes like arcs 1-5 — the blueprint is explicit this is the level's
 * single longest task, matching a genuinely B2 exchange rather than a short
 * scene. It introduces three new capabilities (sustain_a_multi_topic_conversation,
 * handle_a_topic_shift_gracefully, negotiate_an_agreement_under_pushback) and
 * consolidates every arc 1-5 required/should capability inside the same
 * conversation, per the reuse matrix in `b2ReuseMatrix.js`.
 *
 * TWO VARIANTS, ONE SHAPE. `personalizationMode: 'themed'` with a mandatory
 * neutral fallback of equal capability (b2.md section 4/7: "every
 * personalized variant still requires all three new capstone capabilities
 * and all five reused families"; "a full neutral variant... must be at
 * least as capable of producing every required piece of evidence as any
 * themed variant"). Rather than hand-author two long step arrays that could
 * silently drift apart, `buildLongConversationSteps(theme)` below is the ONE
 * step schema (types, evalKind, canDoId, evidenceType, transfer, subtype —
 * everything the evidence/coherence/personalization checks read) and each
 * variant supplies only its own surface text. This makes the
 * personalization-invariant proof mechanical:
 * `scripts/foundry/b2/check-b2-personalization-invariant.mjs` can diff the
 * two variants' non-text fields and expect zero difference, the same
 * `invariantDrift` idea b2.md section 7 points to (A1 arc 1's own proof).
 *
 * EVIDENCE ACCOUNTING (must match b2.json#/canDos evidence + b2ReuseMatrix.js):
 *  - New capstone capabilities (each independent:2, transfer:1, by
 *    construction since the whole arc is a novel scenario — reuse matrix "C"):
 *    sustain_a_multi_topic_conversation, handle_a_topic_shift_gracefully,
 *    negotiate_an_agreement_under_pushback.
 *  - Every arc 1-5 REQUIRED capability gets at least one delayed-retrieval
 *    turn here (b2.md section 9's graduation minimum + section 8's "D"/"R"
 *    reuse-matrix rows) — 7 rows marked "D" (develop_and_defend_opinion,
 *    weigh_advantages_and_disadvantages, negotiate_a_resolution,
 *    hypothesize_about_unreal_situations, summarize_for_someone_else,
 *    adjust_register_to_context, soften_or_strengthen_a_statement) get
 *    `evidenceType: 'delayedRetrieval'`; the remaining required/should rows
 *    marked "R" (concede_a_point_and_counter, justify_a_request_for_change,
 *    express_frustration_diplomatically, speculate_about_cause_and_effect,
 *    express_regret_about_a_past_decision, reformulate_to_clarify,
 *    report_someone_elses_opinion) get `evidenceType: 'independent'` (open
 *    retrieval, unaided, but not the row the blueprint singles out as the
 *    formal delayed-retrieval instance). `infer_implied_meaning` (comprehension-
 *    only) gets one unaided recognition step, evidenceType 'independent'.
 *  - `use_idiomatic_expressions_naturally` (optional, recognition only) is
 *    woven in as comprehension, never required for evidence.
 */

const step = (partial) => ({ ...partial })

/*
 * The shared step sequence. `t` supplies every piece of theme-specific
 * surface text; every OTHER field (type, evalKind, canDoId, evidenceType,
 * transfer, subtype, itemIds) is identical across variants by construction.
 */
function buildLongConversationSteps(t) {
  return [
    step({ type: 'scene', mood: 'welcoming', titleKey: 'b2ep21SceneTitle', bodyKey: t.openingSceneBodyKey, showGoal: true, ctaKey: 'b2ep21Start', sceneEn: t.openingSceneEn }),

    // Topic 1: argument + weighing options (delayed retrieval for arc 1's required capabilities)
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.openOpinionPromptEn, instructionKey: 'b2ep21OpinionInstruction', evalKind: 'state_opinion_with_reason', canDoId: 'develop_and_defend_opinion', itemIds: ['opinion_stance_pattern'], evidenceType: 'delayedRetrieval' }),
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.weighPromptEn, instructionKey: 'b2ep21WeighInstruction', evalKind: 'weigh_options', canDoId: 'weigh_advantages_and_disadvantages', itemIds: ['contrast_connector_pattern', 'advantage_disadvantage_frame'], evidenceType: 'delayedRetrieval' }),
    /*
     * concede_a_point_and_counter already reaches its full evidence target
     * (independent:1, transfer:0) in arc 1 — folded into the opinion/weigh
     * exchange above as a light guided beat (t.concedePromptEn, delivered as
     * Lingua's own concession inside the scene narration) rather than a
     * separate scored turn, to keep this arc within the blueprint's
     * 16-20 meaningfulTurns ceiling.
     */

    // Topic shift 1 -> a complication (new capstone capability: sustain_a_multi_topic_conversation)
    step({ type: 'scene', mood: 'thoughtful', titleKey: 'b2ep21ShiftTitle', bodyKey: t.complicationSceneBodyKey, sceneEn: t.complicationSceneEn }),
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.topicShift1PromptEn, instructionKey: 'b2ep21TopicShift1Instruction', evalKind: 'shift_register', subtype: 'topic_shift', canDoId: 'sustain_a_multi_topic_conversation', itemIds: ['topic_shift_marker_pattern'], evidenceType: 'assistedOpen' }),
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.justifyPromptEn, instructionKey: 'b2ep21JustifyInstruction', evalKind: 'justify_a_request', canDoId: 'justify_a_request_for_change', itemIds: ['justification_pattern'], evidenceType: 'independent' }),
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.negotiatePromptEn, instructionKey: 'b2ep21NegotiateInstruction', evalKind: 'propose_a_resolution', canDoId: 'negotiate_a_resolution', itemIds: ['negotiation_proposal_pattern'], evidenceType: 'delayedRetrieval' }),
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.frustrationPromptEn, instructionKey: 'b2ep21FrustrationInstruction', evalKind: 'express_diplomatic_frustration', canDoId: 'express_frustration_diplomatically', itemIds: ['diplomatic_hedge_pattern'], evidenceType: 'independent' }),

    // Topic shift 2 -> a hypothetical tangent (handle_a_topic_shift_gracefully)
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.topicShift2PromptEn, instructionKey: 'b2ep21TopicShift2Instruction', evalKind: 'shift_register', subtype: 'topic_shift', canDoId: 'handle_a_topic_shift_gracefully', itemIds: ['topic_shift_marker_pattern'], evidenceType: 'assistedOpen' }),
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.hypothesisPromptEn, instructionKey: 'b2ep21HypothesisInstruction', evalKind: 'state_unreal_hypothesis', canDoId: 'hypothesize_about_unreal_situations', itemIds: ['second_conditional_pattern'], evidenceType: 'delayedRetrieval' }),
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.speculatePromptEn, instructionKey: 'b2ep21SpeculateInstruction', evalKind: 'speculate_cause_or_effect', canDoId: 'speculate_about_cause_and_effect', itemIds: ['modal_deduction_present_pattern'], evidenceType: 'independent' }),
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.regretPromptEn, instructionKey: 'b2ep21RegretInstruction', evalKind: 'express_past_regret', canDoId: 'express_regret_about_a_past_decision', itemIds: ['wish_past_perfect_pattern'], evidenceType: 'independent' }),

    // Mediation moment: a latecomer needs the conversation summarized (source text = the conversation so far)
    step({ type: 'scene', mood: 'welcoming', titleKey: 'b2ep21LatecomerTitle', bodyKey: t.latecomerSceneBodyKey, sceneEn: t.latecomerSceneEn }),
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.summarizePromptEn, instructionKey: 'b2ep21SummarizeInstruction', evalKind: 'summarize_for_third_party', canDoId: 'summarize_for_someone_else', sourceRef: true, itemIds: ['summary_connector_pattern'], evidenceType: 'delayedRetrieval' }),
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.reformulatePromptEn, instructionKey: 'b2ep21ReformulateInstruction', evalKind: 'reformulate_for_clarity', canDoId: 'reformulate_to_clarify', sourceRef: true, itemIds: ['reformulation_marker_pattern'], evidenceType: 'independent' }),
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.reportOpinionPromptEn, instructionKey: 'b2ep21ReportInstruction', evalKind: 'report_third_party_opinion', canDoId: 'report_someone_elses_opinion', itemIds: ['reported_speech_pattern'], evidenceType: 'independent' }),

    // Register moment: drafting the message that actually resolves this
    step({ type: 'choice', instructionKey: 'b2ep21RegisterChoiceInstruction', target: t.registerChoiceTargetEn, itemId: 'register_marker_pattern', canDoId: 'infer_implied_meaning', evidenceType: 'independent',
      options: [{ key: 'b2ep21RegisterChoiceOptCorrect', correct: true }, { key: 'b2ep21RegisterChoiceOptWrong1' }, { key: 'b2ep21RegisterChoiceOptWrong2' }] }),
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.registerFormalPromptEn, instructionKey: 'b2ep21RegisterFormalInstruction', evalKind: 'shift_register', subtype: 'formal_shift', canDoId: 'adjust_register_to_context', itemIds: ['register_marker_pattern'], evidenceType: 'delayedRetrieval', registerCheck: true, expectedRegister: 'formal' }),
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.softenPromptEn, instructionKey: 'b2ep21SoftenInstruction', evalKind: 'soften_or_intensify_claim', canDoId: 'soften_or_strengthen_a_statement', itemIds: ['hedging_pattern'], evidenceType: 'delayedRetrieval', registerCheck: true }),

    // Idiom recognition, optional, receptive only
    step({ type: 'comprehension', instructionKey: 'b2ep21IdiomInstruction', target: t.idiomLineEn, itemId: 'to_meet_halfway', canDoId: 'use_idiomatic_expressions_naturally',
      options: [{ key: 'b2ep21IdiomOptCorrect', correct: true }, { key: 'b2ep21IdiomOptWrong1' }, { key: 'b2ep21IdiomOptWrong2' }] }),

    // Pushback negotiation: the capstone's integrating move, recombines concession + proposal + diplomatic hedge
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.pushback1PromptEn, instructionKey: 'b2ep21Pushback1Instruction', evalKind: 'propose_a_resolution', subtype: 'pushback', canDoId: 'negotiate_an_agreement_under_pushback', itemIds: ['concession_counter_pattern', 'negotiation_proposal_pattern'], evidenceType: 'assistedOpen', discourseCoherenceCheck: true }),
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.pushback2PromptEn, instructionKey: 'b2ep21Pushback2Instruction', evalKind: 'propose_a_resolution', subtype: 'pushback', canDoId: 'negotiate_an_agreement_under_pushback', itemIds: ['diplomatic_hedge_pattern', 'negotiation_proposal_pattern'], evidenceType: 'independent', transfer: true, discourseCoherenceCheck: true }),
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.pushback3PromptEn, instructionKey: 'b2ep21Pushback3Instruction', evalKind: 'propose_a_resolution', subtype: 'pushback', canDoId: 'negotiate_an_agreement_under_pushback', itemIds: ['negotiation_proposal_pattern'], evidenceType: 'independent', transfer: true, discourseCoherenceCheck: true }),

    // Third topic shift, closing: sustain + handle-shift closed out with their own transfer instance
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.topicShift3PromptEn, instructionKey: 'b2ep21TopicShift3Instruction', evalKind: 'shift_register', subtype: 'topic_shift', canDoId: 'sustain_a_multi_topic_conversation', itemIds: ['topic_shift_marker_pattern'], evidenceType: 'independent', transfer: true, discourseCoherenceCheck: true }),
    step({ type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: t.closingPromptEn, instructionKey: 'b2ep21ClosingInstruction', evalKind: 'shift_register', subtype: 'topic_shift', canDoId: 'handle_a_topic_shift_gracefully', suggestionEn: t.closingSuggestionEn, itemIds: ['topic_shift_marker_pattern'], evidenceType: 'independent', transfer: true, discourseCoherenceCheck: true }),

    step({ type: 'recall', instructionKey: 'b2ep21FinalInstruction', evalKind: 'propose_a_resolution', subtype: 'pushback', canDoId: 'negotiate_an_agreement_under_pushback', itemIds: ['negotiation_proposal_pattern'] }),
    step({ type: 'completion', canDoNameKey: 'b2ep21CanDoName', titleKey: 'b2ep21CloseTitle', bodyKey: 'b2ep21CloseBody', ctaKey: 'b2ep1CloseCta' }),
  ]
}

/*
 * Themed variant — b2.md section 7's own example: "planning a shared trip".
 * Interest-linked at the point of use (the destination/activity choice);
 * the capability/evidence shape is identical to the neutral variant below.
 */
const THEMED_TRIP_TEXT = {
  openingSceneBodyKey: 'b2ep21ThemedSceneBody',
  openingSceneEn: "You and a friend are planning a long-weekend trip together. There's a lot to agree on before it's real.",
  openOpinionPromptEn: 'So — the mountains or the coast? What do you actually think, and why?',
  weighPromptEn: 'The mountain cabin is cheaper but a two-hour drive; the coastal place costs more but is right in town. Which would you recommend?',
  concedePromptEn: "Fair, the drive is a lot. But I still think the cabin's worth it for the view. React to that.",
  complicationSceneBodyKey: 'b2ep21ThemedComplicationBody',
  complicationSceneEn: "Oh — the cabin booking site just emailed. There's a problem with the reservation.",
  topicShift1PromptEn: "Before we lose the thread — we do need to sort this booking issue first.",
  justifyPromptEn: "They've moved our dates by two days without asking. Why does that matter to us — explain it so I understand why we need it changed back.",
  negotiatePromptEn: "Okay, so what should we actually ask them for?",
  frustrationPromptEn: "Honestly, this is the second booking site that's messed up our dates this year. How do you want to put that to them?",
  topicShift2PromptEn: "Anyway — speaking of things going wrong, remember that trip where the car broke down? That reminds me of something.",
  hypothesisPromptEn: "If the booking falls through completely, what would you actually do?",
  speculatePromptEn: "They haven't replied in six hours. What do you think is going on?",
  regretPromptEn: "Looking back, was there anything you wish we'd done differently when we first booked this?",
  latecomerSceneBodyKey: 'b2ep21ThemedLatecomerBody',
  latecomerSceneEn: "Our third friend just joined the chat — they missed this whole conversation and need to be caught up.",
  summarizePromptEn: "Hey, I just got here — what's going on with the trip?",
  reformulatePromptEn: "Wait, I don't really get the booking-dates thing. Can you say that more simply?",
  reportOpinionPromptEn: "What did the other one think about switching to the coastal place instead?",
  registerChoiceTargetEn: "Which message fits writing to the booking company, and which fits texting your friend?",
  registerFormalPromptEn: "Could you write the message to the booking company asking them to fix the dates?",
  softenPromptEn: "That message reads a bit harsh. Can you soften it slightly before we send it?",
  idiomLineEn: "Honestly, let's just meet halfway on the budget and stop going back and forth.",
  pushback1PromptEn: "I really don't want to pay extra for the coastal place, even with the booking mess.",
  pushback2PromptEn: "I hear you, but I still think it's not worth the extra cost for two nights.",
  pushback3PromptEn: "Okay, but only if we can also cut something else from the budget.",
  topicShift3PromptEn: "Right — before we forget, we still need to decide who's driving.",
  closingPromptEn: "Sounds good. Anything else before we lock this in?",
  closingSuggestionEn: "No, I think we've covered everything — glad we worked it out.",
}

/*
 * Neutral fallback — b2.md's own explicit neutral variant: "a shared-flat
 * dispute that needs a plan, a complaint, a compromise, and a topic change
 * to logistics." Same step schema as THEMED_TRIP_TEXT above.
 */
const NEUTRAL_FLAT_TEXT = {
  openingSceneBodyKey: 'b2ep21NeutralSceneBody',
  openingSceneEn: "You and your flatmate need to sort out a few things about the flat before the month is over.",
  openOpinionPromptEn: "So — should we hire someone to fix the kitchen tap, or try it ourselves first? What do you think?",
  weighPromptEn: "A plumber is faster but costs more; doing it ourselves is free but might take a whole weekend. Which would you recommend?",
  concedePromptEn: "Fair, a weekend's a lot to lose. But I still think it's worth trying first. React to that.",
  complicationSceneBodyKey: 'b2ep21NeutralComplicationBody',
  complicationSceneEn: "Oh — the letting agency just emailed about the deposit. There's a problem.",
  topicShift1PromptEn: "Before we lose the thread — we do need to sort this deposit issue first.",
  justifyPromptEn: "They've held back part of the deposit without explaining why. Why does that matter to us — explain it so I understand why we need it changed back.",
  negotiatePromptEn: "Okay, so what should we actually ask them for?",
  frustrationPromptEn: "Honestly, this is the second time they've been unclear about charges. How do you want to put that to them?",
  topicShift2PromptEn: "Anyway — speaking of things going wrong, remember when the boiler broke last winter? That reminds me of something.",
  hypothesisPromptEn: "If they refuse to explain the deposit at all, what would you actually do?",
  speculatePromptEn: "They haven't replied in six hours. What do you think is going on?",
  regretPromptEn: "Looking back, was there anything you wish we'd done differently when we first signed the lease?",
  latecomerSceneBodyKey: 'b2ep21NeutralLatecomerBody',
  latecomerSceneEn: "Your third flatmate just got home — they missed this whole conversation and need to be caught up.",
  summarizePromptEn: "Hey, I just got in — what's going on with the flat?",
  reformulatePromptEn: "Wait, I don't really get the deposit thing. Can you say that more simply?",
  reportOpinionPromptEn: "What did the other one think about calling a plumber instead of doing it ourselves?",
  registerChoiceTargetEn: "Which message fits writing to the letting agency, and which fits texting your flatmate?",
  registerFormalPromptEn: "Could you write the message to the letting agency asking them to explain the deposit?",
  softenPromptEn: "That message reads a bit harsh. Can you soften it slightly before we send it?",
  idiomLineEn: "Honestly, let's just meet halfway on the repair cost and stop going back and forth.",
  pushback1PromptEn: "I really don't want to pay for a plumber if we haven't even tried fixing it ourselves.",
  pushback2PromptEn: "I hear you, but I still think it's not worth risking making it worse.",
  pushback3PromptEn: "Okay, but only if we agree on a deadline for trying it ourselves first.",
  topicShift3PromptEn: "Right — before we forget, we still need to decide whose turn it is to deal with the bins this month.",
  closingPromptEn: "Sounds good. Anything else before we lock this in?",
  closingSuggestionEn: "No, I think we've covered everything — glad we worked it out.",
}

const LONG_CONVERSATION_THEMED = {
  id: 'b2_the_long_conversation_themed',
  arc: 'the_long_conversation',
  level: 'B2',
  role: 'capstone',
  variant: 'themed',
  titleKey: 'b2ep21Title',
  goalKey: 'b2ep21Goal',
  canDoId: 'sustain_a_multi_topic_conversation',
  canDoNameKey: 'b2ep21CanDoName',
  durationKey: 'b2ep21Duration',
  estimatedMinutes: 22,
  xp: 220,
  prerequisites: ['b2_making_the_case_integrated'],
  skillPrerequisites: [
    'develop_and_defend_opinion', 'weigh_advantages_and_disadvantages', 'concede_a_point_and_counter',
    'justify_a_request_for_change', 'negotiate_a_resolution', 'express_frustration_diplomatically',
    'hypothesize_about_unreal_situations', 'speculate_about_cause_and_effect', 'express_regret_about_a_past_decision',
    'summarize_for_someone_else', 'reformulate_to_clarify', 'report_someone_elses_opinion',
    'adjust_register_to_context', 'soften_or_strengthen_a_statement', 'infer_implied_meaning',
  ],
  gardenItems: ['topic_shift_marker_pattern', 'before_we_move_on', 'circling_back_to', 'on_a_different_note', 'that_being_said', 'having_said_that', 'lets_not_lose_sight_of', 'where_were_we', 'getting_back_to_what_you_said', 'one_more_thing'],
  reuseSkills: ['b1.sustain_topic_change'],
  personalizationSlot: { type: 'activity', neutralFallbackEpisodeId: 'b2_the_long_conversation_neutral' },
  steps: buildLongConversationSteps(THEMED_TRIP_TEXT),
}

const LONG_CONVERSATION_NEUTRAL = {
  ...LONG_CONVERSATION_THEMED,
  id: 'b2_the_long_conversation_neutral',
  variant: 'neutral',
  personalizationSlot: undefined,
  steps: buildLongConversationSteps(NEUTRAL_FLAT_TEXT),
}

export const B2_ARC6 = [LONG_CONVERSATION_THEMED, LONG_CONVERSATION_NEUTRAL]
export const B2_ARC6_ID = 'the_long_conversation'
export const getB2Arc6Episode = (id) => B2_ARC6.find((ep) => ep.id === id) || null

/*
 * Structural-only view of a variant's steps (drops every surface-text field),
 * used by `scripts/foundry/b2/check-b2-personalization-invariant.mjs` to
 * prove the two variants are pedagogically identical — same idea as A1's
 * `invariantDrift` (b2.md section 7).
 */
const TEXT_FIELDS = new Set(['promptEn', 'sceneEn', 'bodyKey', 'target', 'suggestionEn'])
export const structuralSignature = (episode) => episode.steps.map((s) => {
  const rest = {}
  Object.keys(s).sort().forEach((k) => { if (!TEXT_FIELDS.has(k)) rest[k] = s[k] })
  return rest
})
