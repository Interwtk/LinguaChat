/*
 * C1 arc 6 — "Working it out" (`negotiation_and_complexity`).
 *
 * Derived from docs/curriculum/blueprints/c1.json arc
 * `negotiation_and_complexity` and c1.md section 4 (Arc F). Introduces
 * negotiate_a_mutually_acceptable_outcome, clarify_an_ambiguous_instruction_precisely,
 * propose_and_defend_an_alternative (all required) and
 * handle_an_unexpected_complication (should).
 *
 * Reused per c1.json's arc-level `capabilitiesReused`: disagree_diplomatically
 * (R), develop_a_structured_argument (R), infer_implied_meaning_in_unfamiliar_context
 * (R), qualify_a_claim_precisely (D — THIS arc is c1ReuseMatrix.js's own
 * designated delayed-retrieval arc for qualify_a_claim_precisely, per its
 * `D` mark). Per Arc A's and Arc B's own file headers, this is also where
 * disagree_diplomatically's 3rd required independent+transfer instance
 * lands (its reuseMatrix row has no later mark at all, so Arc F is its only
 * possible delayed-retrieval home).
 *
 * `negotiated_item` (c1Patterns.js) is exercised here: every negotiation
 * scenario below is one of the blueprint's own neutral fallback contexts
 * (a returned purchase, a service booking gone wrong, a shared calendar
 * conflict) — a mix of problem-shaped and genuinely problem-free negotiable
 * objects, matching `docs/curriculum/semantic-types.md` section 2's
 * decision that `negotiated_item` generalizes `problem` rather than being
 * synonymous with it.
 *
 * EVIDENCE ACCOUNTING:
 *   negotiate_a_mutually_acceptable_outcome (required, independent:3) — 1
 *     independent in EP1, 1 independent+transfer in EP5; 3rd lands in Arc G
 *     (reuseMatrix's only later mark — T at sustained_interaction).
 *   clarify_an_ambiguous_instruction_precisely (required, independent:3) —
 *     1 independent in EP2, 1 independent+transfer in EP5; 3rd lands in Arc
 *     G (reuseMatrix's only later mark — D at sustained_interaction, the
 *     level's own designated delayed-retrieval arc for this capability).
 *   propose_and_defend_an_alternative (required, independent:3) — 1
 *     independent in EP3, 1 independent+transfer in EP5; 3rd lands in Arc G
 *     (reuseMatrix's only later mark — R at sustained_interaction).
 *   handle_an_unexpected_complication (should, independent:2) — 1
 *     independent in EP4, 1 independent+transfer in EP5. Fully satisfied
 *     within this arc — reuseMatrix has no later mark for it at all.
 *   qualify_a_claim_precisely (required, independent:3 — introduced Arc A)
 *     — reaches its 3rd independent+transfer instance HERE (EP3), completing
 *     its full level-wide evidence target.
 *   disagree_diplomatically (required, independent:3 — introduced Arc B) —
 *     reaches its 3rd independent+transfer instance HERE (EP4), completing
 *     its full level-wide evidence target.
 */

const NEGOTIATE_01 = {
  id: 'c1_negotiation_and_complexity_negotiate',
  arc: 'negotiation_and_complexity',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep26Title',
  goalKey: 'c1ep26Goal',
  canDoId: 'negotiate_a_mutually_acceptable_outcome',
  canDoNameKey: 'c1ep26CanDoName',
  durationKey: 'c1ep26Duration',
  estimatedMinutes: 12,
  xp: 105,
  prerequisites: ['c1_extended_structured_discourse_integrated'],
  skillPrerequisites: ['b2.negotiate_a_resolution', 'disagree_diplomatically'],
  gardenItems: ['conditional_alternative_pattern', 'what_if_we_c1', 'would_you_be_willing_to_c1', 'lets_find_a_middle_ground'],
  reuseSkills: ['develop_a_structured_argument', 'disagree_diplomatically'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep26RecallInstruction', evalKind: 'state_structured_argument', canDoId: 'develop_a_structured_argument', itemIds: ['emphatic_cleft_pattern'] },
    { type: 'recall', instructionKey: 'c1ep26WeighRecallInstruction', evalKind: 'state_structured_argument', canDoId: 'weigh_implications_of_a_position', itemIds: ['it_would_likely_mean_that'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep26SceneTitle', bodyKey: 'c1ep26SceneBody', showGoal: true, ctaKey: 'c1ep26Start' },
    {
      type: 'model',
      target: "What if we split the difference — you get the earlier slot next week, and I get it the week after? Would you be willing to try that?",
      meaningItems: ['what_if_we_c1', 'would_you_be_willing_to_c1', 'conditional_alternative_pattern'], explainKey: 'c1ep26ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep26ComprehensionInstruction',
      target: 'Just give me the slot.',
      itemId: 'what_if_we_c1',
      options: [{ key: 'c1ep26CompOptCorrect', correct: true }, { key: 'c1ep26CompOptWrong1' }, { key: 'c1ep26CompOptWrong2' }],
      explainKey: 'c1ep26ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "You and a colleague both need the same shared calendar slot this week for an important call. Propose an outcome that works for both of you.",
      instructionKey: 'c1ep26AssistedInstruction', evalKind: 'negotiate_outcome', canDoId: 'negotiate_a_mutually_acceptable_outcome',
      suggestionEn: "What if we split the difference — you take this week's slot, and I'll take next week's? That way neither of us loses out every time.",
      itemIds: ['what_if_we_c1', 'lets_find_a_middle_ground'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "A shop won't give you a full refund for a returned purchase, only store credit. Propose an outcome that could work for both sides.",
      instructionKey: 'c1ep26IndependentInstruction', evalKind: 'negotiate_outcome', canDoId: 'negotiate_a_mutually_acceptable_outcome',
      itemIds: ['would_you_be_willing_to_c1'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c1ep26FinalInstruction', evalKind: 'negotiate_outcome', canDoId: 'negotiate_a_mutually_acceptable_outcome', itemIds: ['conditional_alternative_pattern'] },
    { type: 'completion', canDoNameKey: 'c1ep26CanDoName', titleKey: 'c1ep26CloseTitle', bodyKey: 'c1ep26CloseBody', ctaKey: 'c1ep26CloseCta' },
  ],
}

const CLARIFY_02 = {
  id: 'c1_negotiation_and_complexity_clarify',
  arc: 'negotiation_and_complexity',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep27Title',
  goalKey: 'c1ep27Goal',
  canDoId: 'clarify_an_ambiguous_instruction_precisely',
  canDoNameKey: 'c1ep27CanDoName',
  durationKey: 'c1ep27Duration',
  estimatedMinutes: 10,
  xp: 95,
  prerequisites: ['c1_negotiation_and_complexity_negotiate'],
  skillPrerequisites: ['infer_implied_meaning_in_unfamiliar_context'],
  gardenItems: ['certainty_marking_pattern', 'when_you_say_x_do_you_mean', 'could_you_be_more_specific_about', 'just_to_make_sure_i_understood'],
  reuseSkills: ['infer_implied_meaning_in_unfamiliar_context'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep27RecallInstruction', evalKind: 'infer_meaning', canDoId: 'infer_implied_meaning_in_unfamiliar_context', itemIds: ['what_they_probably_mean_is'] },
    { type: 'recall', instructionKey: 'c1ep27CertaintyRecallInstruction', evalKind: 'qualify_claim', canDoId: 'express_degrees_of_certainty', itemIds: ['certainty_marking_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep27SceneTitle', bodyKey: 'c1ep27SceneBody', ctaKey: 'c1ep27Start' },
    {
      type: 'model',
      target: "When you say 'soon', do you mean today, or later this week? Just to make sure I understood correctly.",
      meaningItems: ['when_you_say_x_do_you_mean', 'just_to_make_sure_i_understood'], explainKey: 'c1ep27ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep27ComprehensionInstruction',
      target: 'What?',
      itemId: 'when_you_say_x_do_you_mean',
      options: [{ key: 'c1ep27CompOptCorrect', correct: true }, { key: 'c1ep27CompOptWrong1' }, { key: 'c1ep27CompOptWrong2' }],
      explainKey: 'c1ep27ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "A service provider tells you the repair for your booking gone wrong will happen 'sometime this week.' Ask a targeted question that actually resolves the ambiguity.",
      instructionKey: 'c1ep27AssistedInstruction', evalKind: 'clarify_ambiguity', canDoId: 'clarify_an_ambiguous_instruction_precisely',
      suggestionEn: "When you say 'this week', do you mean a specific day, or could it genuinely be any day? Could you be more specific about the timing?",
      itemIds: ['when_you_say_x_do_you_mean', 'could_you_be_more_specific_about'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Someone tells you the shared calendar conflict is 'basically sorted, don't worry about it.' Ask a precise question that actually confirms what's sorted.",
      instructionKey: 'c1ep27IndependentInstruction', evalKind: 'clarify_ambiguity', canDoId: 'clarify_an_ambiguous_instruction_precisely',
      itemIds: ['just_to_make_sure_i_understood'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'c1ep27CanDoName', titleKey: 'c1ep27CloseTitle', bodyKey: 'c1ep27CloseBody', ctaKey: 'c1ep26CloseCta' },
  ],
}

const PROPOSE_03 = {
  id: 'c1_negotiation_and_complexity_propose',
  arc: 'negotiation_and_complexity',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep28Title',
  goalKey: 'c1ep28Goal',
  canDoId: 'propose_and_defend_an_alternative',
  canDoNameKey: 'c1ep28CanDoName',
  durationKey: 'c1ep28Duration',
  estimatedMinutes: 11,
  xp: 100,
  prerequisites: ['c1_negotiation_and_complexity_clarify'],
  skillPrerequisites: ['negotiate_a_mutually_acceptable_outcome', 'develop_a_structured_argument'],
  gardenItems: ['if_that_doesnt_work_how_about', 'an_alternative_that_would_still', 'that_way_we_still_get'],
  reuseSkills: ['negotiate_a_mutually_acceptable_outcome', 'qualify_a_claim_precisely'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep28RecallInstruction', evalKind: 'negotiate_outcome', canDoId: 'negotiate_a_mutually_acceptable_outcome', itemIds: ['conditional_alternative_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep28SceneTitle', bodyKey: 'c1ep28SceneBody', ctaKey: 'c1ep28Start' },
    {
      type: 'model',
      target: "If that doesn't work, how about we push the whole trip back a week instead? An alternative that would still get everyone there on time.",
      meaningItems: ['if_that_doesnt_work_how_about', 'an_alternative_that_would_still'], explainKey: 'c1ep28ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep28ComprehensionInstruction',
      target: "It won't work, forget it.",
      itemId: 'if_that_doesnt_work_how_about',
      options: [{ key: 'c1ep28CompOptCorrect', correct: true }, { key: 'c1ep28CompOptWrong1' }, { key: 'c1ep28CompOptWrong2' }],
      explainKey: 'c1ep28ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "The original plan — everyone splitting a rescheduled trip's cost evenly — turns out not to work, since two people can't make it at all. Propose and defend an alternative.",
      instructionKey: 'c1ep28AssistedInstruction', evalKind: 'negotiate_outcome', canDoId: 'propose_and_defend_an_alternative',
      suggestionEn: "If that doesn't work, how about the rest of us cover the difference this time? That way we still get to go without anyone feeling shortchanged.",
      itemIds: ['if_that_doesnt_work_how_about', 'that_way_we_still_get'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "The shop's first offer — store credit only — doesn't work for you since you're moving abroad. Propose and defend a different outcome that still meets your actual need.",
      instructionKey: 'c1ep28IndependentInstruction', evalKind: 'negotiate_outcome', canDoId: 'propose_and_defend_an_alternative',
      itemIds: ['an_alternative_that_would_still'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'c1ep28CanDoName', titleKey: 'c1ep28CloseTitle', bodyKey: 'c1ep28CloseBody', ctaKey: 'c1ep26CloseCta' },
  ],
}

const COMPLICATION_04 = {
  id: 'c1_negotiation_and_complexity_complication',
  arc: 'negotiation_and_complexity',
  level: 'C1',
  role: 'secondary',
  titleKey: 'c1ep29Title',
  goalKey: 'c1ep29Goal',
  canDoId: 'handle_an_unexpected_complication',
  canDoNameKey: 'c1ep29CanDoName',
  durationKey: 'c1ep29Duration',
  estimatedMinutes: 9,
  xp: 85,
  prerequisites: ['c1_negotiation_and_complexity_propose'],
  skillPrerequisites: ['propose_and_defend_an_alternative', 'clarify_an_ambiguous_instruction_precisely'],
  gardenItems: ['self_repair_discourse_pattern', 'given_this_new_information', 'that_changes_things_slightly', 'lets_adjust_for_that'],
  reuseSkills: ['propose_and_defend_an_alternative', 'disagree_diplomatically'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep29RecallInstruction', evalKind: 'hedge_statement', canDoId: 'disagree_diplomatically', itemIds: ['id_push_back_on_that_slightly'] },
    { type: 'recall', instructionKey: 'c1ep29HedgeRecallInstruction', evalKind: 'hedge_statement', canDoId: 'hedge_and_mitigate_a_statement', itemIds: ['mitigation_device_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep29SceneTitle', bodyKey: 'c1ep29SceneBody', ctaKey: 'c1ep29Start' },
    {
      type: 'model',
      target: "Given this new information, that changes things slightly — let's adjust for that and move the deadline instead of the budget.",
      meaningItems: ['given_this_new_information', 'that_changes_things_slightly', 'lets_adjust_for_that'], explainKey: 'c1ep29ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep29ComprehensionInstruction',
      target: 'Never mind, forget the whole thing.',
      itemId: 'that_changes_things_slightly',
      options: [{ key: 'c1ep29CompOptCorrect', correct: true }, { key: 'c1ep29CompOptWrong1' }, { key: 'c1ep29CompOptWrong2' }],
      explainKey: 'c1ep29ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "You'd just agreed on splitting the shared calendar slot weekly — but you've now learned one of you is traveling for a whole month soon. Respond to this new complication.",
      instructionKey: 'c1ep29AssistedInstruction', evalKind: 'negotiate_outcome', canDoId: 'handle_an_unexpected_complication',
      suggestionEn: "Given this new information, that changes things slightly — let's adjust for that and skip the rotation entirely during the month you're away.",
      itemIds: ['given_this_new_information', 'lets_adjust_for_that'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "You'd just agreed on a refund for the returned purchase — but you've now learned the item was actually a final-sale item after all. Respond to this complication.",
      instructionKey: 'c1ep29IndependentInstruction', evalKind: 'negotiate_outcome', canDoId: 'handle_an_unexpected_complication',
      itemIds: ['that_changes_things_slightly'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'c1ep29CanDoName', titleKey: 'c1ep29CloseTitle', bodyKey: 'c1ep29CloseBody', ctaKey: 'c1ep26CloseCta' },
  ],
}

const INTEGRATED_05 = {
  id: 'c1_negotiation_and_complexity_integrated',
  arc: 'negotiation_and_complexity',
  level: 'C1',
  role: 'integrated',
  titleKey: 'c1ep30Title',
  goalKey: 'c1ep30Goal',
  canDoId: 'negotiate_a_mutually_acceptable_outcome',
  canDoNameKey: 'c1ep30CanDoName',
  durationKey: 'c1ep30Duration',
  estimatedMinutes: 14,
  xp: 130,
  prerequisites: ['c1_negotiation_and_complexity_complication'],
  skillPrerequisites: ['negotiate_a_mutually_acceptable_outcome', 'clarify_an_ambiguous_instruction_precisely', 'propose_and_defend_an_alternative', 'handle_an_unexpected_complication'],
  gardenItems: [],
  reuseSkills: ['negotiate_a_mutually_acceptable_outcome', 'clarify_an_ambiguous_instruction_precisely', 'propose_and_defend_an_alternative', 'handle_an_unexpected_complication', 'qualify_a_claim_precisely', 'disagree_diplomatically'],
  /*
   * Transfer negotiated_item: a double-booked house-sitting arrangement
   * between two friends — never used in EP1-EP4 (whose negotiated items
   * were a shared calendar slot, a returned purchase, a rescheduled trip,
   * and a shared calendar slot's rotation).
   */
  steps: [
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep30SceneTitle', bodyKey: 'c1ep30SceneBody', showGoal: true, ctaKey: 'c1ep30Start' },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "You and a friend both agreed to house-sit the same week by mistake. Propose an outcome that works for both of you.",
      instructionKey: 'c1ep30NegotiateInstruction', evalKind: 'negotiate_outcome', canDoId: 'negotiate_a_mutually_acceptable_outcome',
      itemIds: ['what_if_we_c1'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Your friend says 'I'll just handle it, don't worry.' That's vague. Ask a precise question that actually resolves what 'handle it' means.",
      instructionKey: 'c1ep30ClarifyInstruction', evalKind: 'clarify_ambiguity', canDoId: 'clarify_an_ambiguous_instruction_precisely',
      itemIds: ['when_you_say_x_do_you_mean'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Splitting the week in half turns out not to work — the owners actually need someone there the WHOLE week, no gaps. Propose and defend a different plan.",
      instructionKey: 'c1ep30ProposeInstruction', evalKind: 'negotiate_outcome', canDoId: 'propose_and_defend_an_alternative',
      itemIds: ['if_that_doesnt_work_how_about'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Just as you agree on a plan, you learn the owners are actually coming back two days early. Respond to this new complication.",
      instructionKey: 'c1ep30ComplicationInstruction', evalKind: 'negotiate_outcome', canDoId: 'handle_an_unexpected_complication',
      itemIds: ['given_this_new_information'], evidenceType: 'independent', transfer: true,
    },
    { type: 'recall', instructionKey: 'c1ep30QualifyRecallInstruction', evalKind: 'qualify_claim', canDoId: 'qualify_a_claim_precisely', itemIds: ['hedging_adverbial_pattern'] },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Someone just said, 'honestly, this whole arrangement was a bad idea from the start.' Qualify that claim precisely, rather than agreeing or disagreeing outright.",
      instructionKey: 'c1ep30QualifyInstruction', evalKind: 'qualify_claim', canDoId: 'qualify_a_claim_precisely',
      itemIds: ['hedging_adverbial_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Your friend snaps, 'well, this is completely your fault.' Disagree with that diplomatically.",
      instructionKey: 'c1ep30DisagreeInstruction', evalKind: 'hedge_statement', canDoId: 'disagree_diplomatically',
      itemIds: ['i_see_it_a_bit_differently'], evidenceType: 'independent', transfer: true,
    },
    { type: 'completion', canDoNameKey: 'c1ep30CanDoName', titleKey: 'c1ep30CloseTitle', bodyKey: 'c1ep30CloseBody', ctaKey: 'c1ep26CloseCta' },
  ],
}

export const C1_ARC6 = [NEGOTIATE_01, CLARIFY_02, PROPOSE_03, COMPLICATION_04, INTEGRATED_05]
export const C1_ARC6_ID = 'negotiation_and_complexity'
export const getC1Arc6Episode = (id) => C1_ARC6.find((ep) => ep.id === id) || null
