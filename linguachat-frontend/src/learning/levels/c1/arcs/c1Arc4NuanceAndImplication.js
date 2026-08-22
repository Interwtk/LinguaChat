/*
 * C1 arc 4 — "Reading between the lines" (`nuance_and_implication`).
 *
 * Derived from docs/curriculum/blueprints/c1.json arc `nuance_and_implication`
 * and c1.md section 4 (Arc D). Introduces infer_implied_meaning_in_unfamiliar_context,
 * express_degrees_of_certainty, hold_a_nuanced_stance (all required) and
 * recognize_understatement_or_irony (should). Reuses qualify_a_claim_precisely
 * and concede_a_counterpoint_gracefully (both open retrieval) from Arc A.
 *
 * personalizationMode: none — implication/irony depend on shared context the
 * engine controls; personalizing the trigger risks an ambiguous or
 * unintentionally offensive remark (c1.md section 4). Scenarios below use
 * exactly the blueprint's own neutral fallback contexts: a friend being
 * vague about being busy, a colleague being diplomatic about a bad idea, a
 * mildly self-deprecating remark about a plan going wrong.
 *
 * EVIDENCE ACCOUNTING:
 *   infer_implied_meaning_in_unfamiliar_context (required, independent:3) —
 *     1 independent in EP1, 1 independent+transfer in EP5; 3rd lands in Arc
 *     G (reuseMatrix's later marks are R at negotiation_and_complexity and R
 *     at sustained_interaction — Arc F gets a lighter guided touch below via
 *     Arc F's own content, the independent 3rd instance lands in Arc G).
 *   express_degrees_of_certainty (required, independent:3) — 1 independent
 *     in EP2, 1 independent+transfer in EP5; 3rd lands in Arc G (same
 *     R-then-R pattern as above).
 *   hold_a_nuanced_stance (required, independent:3) — 1 independent in EP3,
 *     1 independent+transfer in EP5; 3rd lands in Arc G (reuseMatrix's ONLY
 *     later mark — R at sustained_interaction).
 *   recognize_understatement_or_irony (should, independent:2) — 1
 *     independent in EP4, 1 independent+transfer in EP5. Fully satisfied
 *     within this arc; Arc G still owes this capability a lightweight touch
 *     (any evidenceType) because c1ReuseMatrix.js marks T at
 *     sustained_interaction — content, not evidence-count, obligation.
 */

const INFER_01 = {
  id: 'c1_nuance_and_implication_infer',
  arc: 'nuance_and_implication',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep16Title',
  goalKey: 'c1ep16Goal',
  canDoId: 'infer_implied_meaning_in_unfamiliar_context',
  canDoNameKey: 'c1ep16CanDoName',
  durationKey: 'c1ep16Duration',
  estimatedMinutes: 11,
  xp: 100,
  prerequisites: ['c1_synthesis_and_mediation_integrated'],
  skillPrerequisites: ['b2.infer_implied_meaning'],
  gardenItems: ['evaluative_reporting_pattern', 'what_they_probably_mean_is', 'reading_between_the_lines_c1'],
  reuseSkills: ['qualify_a_claim_precisely'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep16RecallInstruction', evalKind: 'qualify_claim', canDoId: 'qualify_a_claim_precisely', itemIds: ['hedging_adverbial_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep16SceneTitle', bodyKey: 'c1ep16SceneBody', showGoal: true, ctaKey: 'c1ep16Start' },
    {
      type: 'model',
      target: "When a friend cancels a third catch-up in a row saying 'I've just been really busy,' what they probably mean is they're avoiding something, not that they're literally too busy every single time.",
      meaningItems: ['what_they_probably_mean_is', 'evaluative_reporting_pattern'], explainKey: 'c1ep16ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep16ComprehensionInstruction',
      target: "I've just been really busy lately.",
      itemId: 'what_they_probably_mean_is',
      options: [{ key: 'c1ep16CompOptCorrect', correct: true }, { key: 'c1ep16CompOptWrong1' }, { key: 'c1ep16CompOptWrong2' }],
      explainKey: 'c1ep16ComprehensionExplain',
    },
    {
      type: 'choice', instructionKey: 'c1ep16NearMissInstruction',
      target: "Hmm, interesting idea. Let's circle back to that sometime.",
      itemId: 'reading_between_the_lines_c1',
      options: [{ key: 'c1ep16NearMissOptCorrect', correct: true }, { key: 'c1ep16NearMissOptWrong1' }, { key: 'c1ep16NearMissOptWrong2' }],
      explainKey: 'c1ep16NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "A colleague responds to your project idea with: 'That's certainly one way to approach it.' What do you think they actually mean, reading between the lines?",
      instructionKey: 'c1ep16AssistedInstruction', evalKind: 'infer_meaning', canDoId: 'infer_implied_meaning_in_unfamiliar_context',
      suggestionEn: "Reading between the lines, what they probably mean is they don't think it's a good approach, but they don't want to say so directly.",
      itemIds: ['what_they_probably_mean_is'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "A friend says, about your plan to run a marathon with zero training so far: 'Well, that's certainly ambitious of you.' What do they probably mean?",
      instructionKey: 'c1ep16IndependentInstruction', evalKind: 'infer_meaning', canDoId: 'infer_implied_meaning_in_unfamiliar_context',
      itemIds: ['reading_between_the_lines_c1'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c1ep16FinalInstruction', evalKind: 'infer_meaning', canDoId: 'infer_implied_meaning_in_unfamiliar_context', itemIds: ['what_they_probably_mean_is'] },
    { type: 'completion', canDoNameKey: 'c1ep16CanDoName', titleKey: 'c1ep16CloseTitle', bodyKey: 'c1ep16CloseBody', ctaKey: 'c1ep16CloseCta' },
  ],
}

const CERTAINTY_02 = {
  id: 'c1_nuance_and_implication_certainty',
  arc: 'nuance_and_implication',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep17Title',
  goalKey: 'c1ep17Goal',
  canDoId: 'express_degrees_of_certainty',
  canDoNameKey: 'c1ep17CanDoName',
  durationKey: 'c1ep17Duration',
  estimatedMinutes: 10,
  xp: 95,
  prerequisites: ['c1_nuance_and_implication_infer'],
  skillPrerequisites: ['qualify_a_claim_precisely'],
  gardenItems: ['certainty_marking_pattern', 'im_fairly_sure_that', 'its_not_clear_whether', 'theres_a_good_chance_that_c1'],
  reuseSkills: ['qualify_a_claim_precisely', 'infer_implied_meaning_in_unfamiliar_context'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep17RecallInstruction', evalKind: 'infer_meaning', canDoId: 'infer_implied_meaning_in_unfamiliar_context', itemIds: ['what_they_probably_mean_is'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep17SceneTitle', bodyKey: 'c1ep17SceneBody', ctaKey: 'c1ep17Start' },
    {
      type: 'model',
      target: "I'm fairly sure that's what they meant, though it's not clear whether they'd actually say it outright — there's a good chance we're both reading it the same way.",
      meaningItems: ['im_fairly_sure_that', 'certainty_marking_pattern'], explainKey: 'c1ep17ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep17ComprehensionInstruction',
      target: "It's true. That's what happened. No question about it.",
      itemId: 'im_fairly_sure_that',
      options: [{ key: 'c1ep17CompOptCorrect', correct: true }, { key: 'c1ep17CompOptWrong1' }, { key: 'c1ep17CompOptWrong2' }],
      explainKey: 'c1ep17ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Someone asks if you think the new policy at work will actually get approved. You're not certain either way. How do you answer, marking your real degree of confidence?",
      instructionKey: 'c1ep17AssistedInstruction', evalKind: 'qualify_claim', canDoId: 'express_degrees_of_certainty',
      suggestionEn: "I'm fairly sure it'll go through, though it's not entirely clear whether the budget will actually support it.",
      itemIds: ['im_fairly_sure_that', 'its_not_clear_whether'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Someone asks whether you think it'll rain during the outdoor event this weekend. Answer with an honest degree of certainty, not a flat yes or no.",
      instructionKey: 'c1ep17IndependentInstruction', evalKind: 'qualify_claim', canDoId: 'express_degrees_of_certainty',
      itemIds: ['theres_a_good_chance_that_c1'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c1ep17FinalInstruction', evalKind: 'qualify_claim', canDoId: 'express_degrees_of_certainty', itemIds: ['certainty_marking_pattern'] },
    { type: 'completion', canDoNameKey: 'c1ep17CanDoName', titleKey: 'c1ep17CloseTitle', bodyKey: 'c1ep17CloseBody', ctaKey: 'c1ep16CloseCta' },
  ],
}

const NUANCED_03 = {
  id: 'c1_nuance_and_implication_nuanced',
  arc: 'nuance_and_implication',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep18Title',
  goalKey: 'c1ep18Goal',
  canDoId: 'hold_a_nuanced_stance',
  canDoNameKey: 'c1ep18CanDoName',
  durationKey: 'c1ep18Duration',
  estimatedMinutes: 10,
  xp: 95,
  prerequisites: ['c1_nuance_and_implication_certainty'],
  skillPrerequisites: ['express_degrees_of_certainty', 'concede_a_counterpoint_gracefully'],
  gardenItems: ['emphatic_cleft_pattern', 'i_can_see_your_point_but_i_still_think', 'its_not_that_simple'],
  reuseSkills: ['express_degrees_of_certainty', 'concede_a_counterpoint_gracefully'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep18RecallInstruction', evalKind: 'concede_point', canDoId: 'concede_a_counterpoint_gracefully', itemIds: ['concessive_clause_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep18SceneTitle', bodyKey: 'c1ep18SceneBody', ctaKey: 'c1ep18Start' },
    {
      type: 'model',
      target: "It's not that simple — what really matters is that the policy helps some people while genuinely hurting others, so I can't just call it good or bad.",
      meaningItems: ['its_not_that_simple', 'emphatic_cleft_pattern'], explainKey: 'c1ep18ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep18ComprehensionInstruction',
      target: "It's either completely right or completely wrong, there's no in-between.",
      itemId: 'its_not_that_simple',
      options: [{ key: 'c1ep18CompOptCorrect', correct: true }, { key: 'c1ep18CompOptWrong1' }, { key: 'c1ep18CompOptWrong2' }],
      explainKey: 'c1ep18ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Someone asks whether the new open-plan office is a good idea. You've heard real upsides and real downsides. What's your honest, nuanced answer?",
      instructionKey: 'c1ep18AssistedInstruction', evalKind: 'concede_point', canDoId: 'hold_a_nuanced_stance',
      suggestionEn: "I can see your point that it saves space, but I still think it hurts focus — it's not that simple, it genuinely depends on the kind of work people do.",
      itemIds: ['i_can_see_your_point_but_i_still_think'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Someone asks if remote learning is better than in-person learning. Give a genuinely mixed, nuanced answer — not a flat yes or no.",
      instructionKey: 'c1ep18IndependentInstruction', evalKind: 'concede_point', canDoId: 'hold_a_nuanced_stance',
      itemIds: ['its_not_that_simple'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'c1ep18CanDoName', titleKey: 'c1ep18CloseTitle', bodyKey: 'c1ep18CloseBody', ctaKey: 'c1ep16CloseCta' },
  ],
}

const IRONY_04 = {
  id: 'c1_nuance_and_implication_irony',
  arc: 'nuance_and_implication',
  level: 'C1',
  role: 'secondary',
  titleKey: 'c1ep19Title',
  goalKey: 'c1ep19Goal',
  canDoId: 'recognize_understatement_or_irony',
  canDoNameKey: 'c1ep19CanDoName',
  durationKey: 'c1ep19Duration',
  estimatedMinutes: 8,
  xp: 80,
  prerequisites: ['c1_nuance_and_implication_nuanced'],
  skillPrerequisites: ['infer_implied_meaning_in_unfamiliar_context'],
  gardenItems: ['i_dont_think_they_really_mean_that'],
  reuseSkills: ['infer_implied_meaning_in_unfamiliar_context'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep19RecallInstruction', evalKind: 'infer_meaning', canDoId: 'infer_implied_meaning_in_unfamiliar_context', itemIds: ['reading_between_the_lines_c1'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep19SceneTitle', bodyKey: 'c1ep19SceneBody', ctaKey: 'c1ep19Start' },
    {
      type: 'model',
      target: "A friend says, after missing their flight, spilling coffee on their laptop, and losing their wallet all in one morning: 'Yeah, it's been a pretty good day.' I don't think they really mean that literally.",
      meaningItems: ['i_dont_think_they_really_mean_that'], explainKey: 'c1ep19ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep19ComprehensionInstruction',
      target: "It's been a pretty good day.",
      itemId: 'i_dont_think_they_really_mean_that',
      options: [{ key: 'c1ep19CompOptCorrect', correct: true }, { key: 'c1ep19CompOptWrong1' }, { key: 'c1ep19CompOptWrong2' }],
      explainKey: 'c1ep19ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "After a plan falls apart completely — wrong date, wrong venue, half the guests never showed — a friend says: 'Well, that went exactly as planned.' What do they actually mean?",
      instructionKey: 'c1ep19AssistedInstruction', evalKind: 'infer_meaning', canDoId: 'recognize_understatement_or_irony',
      suggestionEn: "I don't think they really mean that literally — it's ironic, the plan actually went badly, and they're being self-deprecating about it.",
      itemIds: ['i_dont_think_they_really_mean_that'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "A colleague, after their presentation's slides crashed mid-talk in front of the whole department, says: 'That went smoothly.' What do they mean?",
      instructionKey: 'c1ep19IndependentInstruction', evalKind: 'infer_meaning', canDoId: 'recognize_understatement_or_irony',
      itemIds: ['i_dont_think_they_really_mean_that'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'c1ep19CanDoName', titleKey: 'c1ep19CloseTitle', bodyKey: 'c1ep19CloseBody', ctaKey: 'c1ep16CloseCta' },
  ],
}

const INTEGRATED_05 = {
  id: 'c1_nuance_and_implication_integrated',
  arc: 'nuance_and_implication',
  level: 'C1',
  role: 'integrated',
  titleKey: 'c1ep20Title',
  goalKey: 'c1ep20Goal',
  canDoId: 'infer_implied_meaning_in_unfamiliar_context',
  canDoNameKey: 'c1ep20CanDoName',
  durationKey: 'c1ep20Duration',
  estimatedMinutes: 13,
  xp: 120,
  prerequisites: ['c1_nuance_and_implication_irony'],
  skillPrerequisites: ['infer_implied_meaning_in_unfamiliar_context', 'express_degrees_of_certainty', 'hold_a_nuanced_stance', 'recognize_understatement_or_irony'],
  gardenItems: [],
  reuseSkills: ['infer_implied_meaning_in_unfamiliar_context', 'express_degrees_of_certainty', 'hold_a_nuanced_stance', 'recognize_understatement_or_irony', 'qualify_a_claim_precisely'],
  /*
   * Transfer trigger: a housemate being non-committal about splitting a
   * shared bill — never used in EP1-EP4 (whose triggers were a cancelled
   * catch-up, a colleague's idea, a workplace policy, and a chain of small
   * disasters).
   */
  steps: [
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep20SceneTitle', bodyKey: 'c1ep20SceneBody', showGoal: true, ctaKey: 'c1ep20Start' },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Your housemate says, when you bring up the shared electricity bill: 'Oh, yeah, we should definitely sort that out sometime.' What do you think they actually mean?",
      instructionKey: 'c1ep20InferInstruction', evalKind: 'infer_meaning', canDoId: 'infer_implied_meaning_in_unfamiliar_context',
      itemIds: ['what_they_probably_mean_is'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "How confident are you that they're actually avoiding it, versus genuinely just forgetting? Mark your real degree of certainty.",
      instructionKey: 'c1ep20CertaintyInstruction', evalKind: 'qualify_claim', canDoId: 'express_degrees_of_certainty',
      itemIds: ['im_fairly_sure_that'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "A mutual friend says, 'honestly, they're probably just broke and embarrassed about it' — but you also think they might just be forgetful by nature. Give a genuinely nuanced take.",
      instructionKey: 'c1ep20NuancedInstruction', evalKind: 'concede_point', canDoId: 'hold_a_nuanced_stance',
      itemIds: ['its_not_that_simple'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Your housemate finally pays their share three months late and says: 'See, right on schedule.' What do they mean by that?",
      instructionKey: 'c1ep20IronyInstruction', evalKind: 'infer_meaning', canDoId: 'recognize_understatement_or_irony',
      itemIds: ['i_dont_think_they_really_mean_that'], evidenceType: 'independent', transfer: true,
    },
    { type: 'recall', instructionKey: 'c1ep20FinalInstruction', evalKind: 'qualify_claim', canDoId: 'qualify_a_claim_precisely', itemIds: ['hedging_adverbial_pattern'] },
    { type: 'completion', canDoNameKey: 'c1ep20CanDoName', titleKey: 'c1ep20CloseTitle', bodyKey: 'c1ep20CloseBody', ctaKey: 'c1ep16CloseCta' },
  ],
}

export const C1_ARC4 = [INFER_01, CERTAINTY_02, NUANCED_03, IRONY_04, INTEGRATED_05]
export const C1_ARC4_ID = 'nuance_and_implication'
export const getC1Arc4Episode = (id) => C1_ARC4.find((ep) => ep.id === id) || null
