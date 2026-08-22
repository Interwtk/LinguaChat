/*
 * C1 arc 2 — "Getting the tone right" (`register_and_diplomacy`).
 *
 * Derived from docs/curriculum/blueprints/c1.json arc `register_and_diplomacy`
 * and c1.md section 4 (Arc B). Introduces adapt_register_to_audience,
 * hedge_and_mitigate_a_statement, disagree_diplomatically (all required) and
 * repair_a_register_slip (should). Reuses qualify_a_claim_precisely (guided)
 * and concede_a_counterpoint_gracefully (open retrieval) from Arc A.
 *
 * Per c1.md section 4/c1.json: personalizationMode "none" — the
 * interpersonal dynamic IS the lesson here, so every scenario below is a
 * neutral, real-life relationship-sensitive situation (workplace feedback, a
 * shared-living disagreement, declining an invitation), never a
 * personalized topic, matching the blueprint's own explicit rule.
 *
 * This is also C1's first arc where `registerAppropriateness`
 * (`c1EvaluationContracts.js`) is required, not just should-relevant — every
 * `adapt_register`/`hedge_statement`-evaluated step below is opted in via
 * that shared dimension for four of this arc's five capabilities
 * (repair_a_register_slip is should-relevant-signal only).
 *
 * EVIDENCE ACCOUNTING:
 *   adapt_register_to_audience (required, independent:3) — 1 independent in
 *     EP1, 1 independent+transfer in EP5 (this arc); 3rd lands in Arc G
 *     (reuseMatrix marks R at sustained_interaction, the level's last mark
 *     for this capability).
 *   hedge_and_mitigate_a_statement (required, independent:3) — 1 independent
 *     in EP2, 1 independent+transfer in EP5; 3rd lands in Arc G (reuseMatrix
 *     marks R at sustained_interaction).
 *   disagree_diplomatically (required, independent:3) — 1 independent in
 *     EP3, 1 independent+transfer in EP5; 3rd lands in Arc F (reuseMatrix's
 *     ONLY later mark for this capability — R at negotiation_and_complexity;
 *     unlike most Arc B capabilities it has no later mark in Arc G).
 *   repair_a_register_slip (should, independent:2) — 1 independent in EP4,
 *     1 independent+transfer in EP5. Fully satisfied within this arc.
 * Reused-from-Arc-A capabilities (qualify_a_claim_precisely,
 * concede_a_counterpoint_gracefully) get guided/open-retrieval touches
 * inside EP1/EP3 below per c1.json's own arc-level `capabilitiesReused`
 * list, contributing toward — but not solely satisfying — their own
 * evidence targets (Arc A + Arc D/F/G already carry the bulk of those).
 */

const ADAPT_01 = {
  id: 'c1_register_and_diplomacy_adapt',
  arc: 'register_and_diplomacy',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep6Title',
  goalKey: 'c1ep6Goal',
  canDoId: 'adapt_register_to_audience',
  canDoNameKey: 'c1ep6CanDoName',
  durationKey: 'c1ep6Duration',
  estimatedMinutes: 11,
  xp: 100,
  prerequisites: ['c1_abstract_argument_integrated'],
  skillPrerequisites: ['b2.adjust_register_to_context'],
  gardenItems: ['register_pair_pattern', 'would_it_be_possible_to_c1', 'could_you_possibly', 'can_you'],
  reuseSkills: ['qualify_a_claim_precisely'],
  registerAppropriateness: { checked: true, graduationRelevance: 'required' },
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep6RecallInstruction', evalKind: 'qualify_claim', canDoId: 'qualify_a_claim_precisely', itemIds: ['hedging_adverbial_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep6SceneTitle', bodyKey: 'c1ep6SceneBody', showGoal: true, ctaKey: 'c1ep6Start' },
    {
      type: 'model',
      target: "To a manager: 'Would it be possible to get some feedback on the report before Friday?' To a close colleague: 'Can you take a look at the report before Friday?'",
      meaningItems: ['register_pair_pattern', 'would_it_be_possible_to_c1'], explainKey: 'c1ep6ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep6ComprehensionInstruction',
      target: 'gimme a sec, I\'ll check the contract',
      itemId: 'register_pair_pattern',
      options: [{ key: 'c1ep6CompOptCorrect', correct: true }, { key: 'c1ep6CompOptWrong1' }, { key: 'c1ep6CompOptWrong2' }],
      explainKey: 'c1ep6ComprehensionExplain',
    },
    {
      type: 'choice', instructionKey: 'c1ep6NearMissInstruction',
      target: 'Can you get an update on the report?',
      itemId: 'would_it_be_possible_to_c1',
      options: [{ key: 'c1ep6NearMissOptCorrect', correct: true }, { key: 'c1ep6NearMissOptWrong1' }, { key: 'c1ep6NearMissOptWrong2' }],
      explainKey: 'c1ep6NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "You need to ask your landlord, someone you barely know, for a repair to be scheduled sooner. How would you phrase that?",
      instructionKey: 'c1ep6AssistedInstruction', evalKind: 'adapt_register', canDoId: 'adapt_register_to_audience',
      suggestionEn: 'Would it be possible to schedule the repair a little sooner? It would really help.',
      itemIds: ['register_pair_pattern', 'would_it_be_possible_to_c1'], evidenceType: 'assistedOpen',
      expectedRegister: 'formal',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Now ask a close friend the same kind of favor — to help you move a couch this weekend. How would you phrase that instead?",
      instructionKey: 'c1ep6IndependentInstruction', evalKind: 'adapt_register', canDoId: 'adapt_register_to_audience',
      itemIds: ['register_pair_pattern'], evidenceType: 'independent', expectedRegister: 'informal',
    },
    { type: 'recall', instructionKey: 'c1ep6FinalInstruction', evalKind: 'adapt_register', canDoId: 'adapt_register_to_audience', itemIds: ['register_pair_pattern'] },
    { type: 'completion', canDoNameKey: 'c1ep6CanDoName', titleKey: 'c1ep6CloseTitle', bodyKey: 'c1ep6CloseBody', ctaKey: 'c1ep6CloseCta' },
  ],
}

const HEDGE_02 = {
  id: 'c1_register_and_diplomacy_hedge',
  arc: 'register_and_diplomacy',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep7Title',
  goalKey: 'c1ep7Goal',
  canDoId: 'hedge_and_mitigate_a_statement',
  canDoNameKey: 'c1ep7CanDoName',
  durationKey: 'c1ep7Duration',
  estimatedMinutes: 10,
  xp: 95,
  prerequisites: ['c1_register_and_diplomacy_adapt'],
  skillPrerequisites: ['adapt_register_to_audience', 'qualify_a_claim_precisely'],
  gardenItems: ['mitigation_device_pattern', 'i_dont_want_to_overstate_this_but', 'it_might_be_worth_considering', 'i_wonder_if'],
  reuseSkills: ['adapt_register_to_audience'],
  registerAppropriateness: { checked: true, graduationRelevance: 'required' },
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep7RecallInstruction', evalKind: 'adapt_register', canDoId: 'adapt_register_to_audience', itemIds: ['register_pair_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep7SceneTitle', bodyKey: 'c1ep7SceneBody', ctaKey: 'c1ep7Start' },
    {
      type: 'model',
      target: "I don't want to overstate this, but I think the current draft still needs some work before it goes out — it might be worth considering another pass.",
      meaningItems: ['mitigation_device_pattern', 'i_dont_want_to_overstate_this_but'], explainKey: 'c1ep7ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep7ComprehensionInstruction',
      target: "It's not great, but whatever, it's fine.",
      itemId: 'mitigation_device_pattern',
      options: [{ key: 'c1ep7CompOptCorrect', correct: true }, { key: 'c1ep7CompOptWrong1' }, { key: 'c1ep7CompOptWrong2' }],
      explainKey: 'c1ep7ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "A colleague just showed you their first draft of a presentation. It's rushed and has some real gaps. What do you say?",
      instructionKey: 'c1ep7AssistedInstruction', evalKind: 'hedge_statement', canDoId: 'hedge_and_mitigate_a_statement',
      suggestionEn: "I don't want to overstate this, but I think it might be worth considering another pass before Thursday — a few sections feel rushed.",
      itemIds: ['mitigation_device_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'A roommate keeps leaving dishes in the sink for days. You need to raise it without starting a fight. What do you say?',
      instructionKey: 'c1ep7IndependentInstruction', evalKind: 'hedge_statement', canDoId: 'hedge_and_mitigate_a_statement',
      itemIds: ['mitigation_device_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c1ep7FinalInstruction', evalKind: 'hedge_statement', canDoId: 'hedge_and_mitigate_a_statement', itemIds: ['mitigation_device_pattern'] },
    { type: 'completion', canDoNameKey: 'c1ep7CanDoName', titleKey: 'c1ep7CloseTitle', bodyKey: 'c1ep7CloseBody', ctaKey: 'c1ep6CloseCta' },
  ],
}

const DISAGREE_03 = {
  id: 'c1_register_and_diplomacy_disagree',
  arc: 'register_and_diplomacy',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep8Title',
  goalKey: 'c1ep8Goal',
  canDoId: 'disagree_diplomatically',
  canDoNameKey: 'c1ep8CanDoName',
  durationKey: 'c1ep8Duration',
  estimatedMinutes: 10,
  xp: 95,
  prerequisites: ['c1_register_and_diplomacy_hedge'],
  skillPrerequisites: ['hedge_and_mitigate_a_statement', 'concede_a_counterpoint_gracefully'],
  gardenItems: ['i_see_it_a_bit_differently', 'id_push_back_on_that_slightly', 'im_not_sure_i_agree_because'],
  reuseSkills: ['hedge_and_mitigate_a_statement', 'concede_a_counterpoint_gracefully'],
  registerAppropriateness: { checked: true, graduationRelevance: 'required' },
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep8RecallInstruction', evalKind: 'concede_point', canDoId: 'concede_a_counterpoint_gracefully', itemIds: ['concessive_clause_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep8SceneTitle', bodyKey: 'c1ep8SceneBody', ctaKey: 'c1ep8Start' },
    {
      type: 'model',
      target: "I see it a bit differently, actually — I'm not sure I agree, because the timeline feels tight even with the extra help.",
      meaningItems: ['i_see_it_a_bit_differently', 'im_not_sure_i_agree_because'], explainKey: 'c1ep8ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep8ComprehensionInstruction',
      target: "That's completely wrong and you clearly don't understand the issue.",
      itemId: 'i_see_it_a_bit_differently',
      options: [{ key: 'c1ep8CompOptCorrect', correct: true }, { key: 'c1ep8CompOptWrong1' }, { key: 'c1ep8CompOptWrong2' }],
      explainKey: 'c1ep8ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Your manager suggests moving the whole team to a new tool you think is worse than the current one. How do you respond?",
      instructionKey: 'c1ep8AssistedInstruction', evalKind: 'hedge_statement', canDoId: 'disagree_diplomatically',
      suggestionEn: "I'd push back on that slightly — I'm not sure I agree, because the current tool already covers most of what we need.",
      itemIds: ['id_push_back_on_that_slightly'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "A friend insists the new restaurant everyone's raving about is overrated and you should skip it. You disagree. What do you say?",
      instructionKey: 'c1ep8IndependentInstruction', evalKind: 'hedge_statement', canDoId: 'disagree_diplomatically',
      itemIds: ['i_see_it_a_bit_differently'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'c1ep8CanDoName', titleKey: 'c1ep8CloseTitle', bodyKey: 'c1ep8CloseBody', ctaKey: 'c1ep6CloseCta' },
  ],
}

const REPAIR_04 = {
  id: 'c1_register_and_diplomacy_repair',
  arc: 'register_and_diplomacy',
  level: 'C1',
  role: 'secondary',
  titleKey: 'c1ep9Title',
  goalKey: 'c1ep9Goal',
  canDoId: 'repair_a_register_slip',
  canDoNameKey: 'c1ep9CanDoName',
  durationKey: 'c1ep9Duration',
  estimatedMinutes: 8,
  xp: 80,
  prerequisites: ['c1_register_and_diplomacy_disagree'],
  skillPrerequisites: ['adapt_register_to_audience', 'hedge_and_mitigate_a_statement'],
  gardenItems: ['self_repair_discourse_pattern', 'what_i_meant_to_say_was', 'let_me_rephrase_that', 'that_came_out_wrong'],
  reuseSkills: ['adapt_register_to_audience'],
  registerAppropriateness: { checked: true, graduationRelevance: 'should-relevant-signal' },
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep9RecallInstruction', evalKind: 'adapt_register', canDoId: 'adapt_register_to_audience', itemIds: ['register_pair_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep9SceneTitle', bodyKey: 'c1ep9SceneBody', ctaKey: 'c1ep9Start' },
    {
      type: 'model',
      target: "That came out wrong — what I meant to say was, could we possibly revisit the deadline? Let me rephrase that properly.",
      meaningItems: ['self_repair_discourse_pattern', 'that_came_out_wrong'], explainKey: 'c1ep9ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep9ComprehensionInstruction',
      target: "just get it done already",
      itemId: 'self_repair_discourse_pattern',
      options: [{ key: 'c1ep9CompOptCorrect', correct: true }, { key: 'c1ep9CompOptWrong1' }, { key: 'c1ep9CompOptWrong2' }],
      explainKey: 'c1ep9ComprehensionExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "You just told a client 'just get it done already' by accident, out loud on the call. Notice the slip and repair it, right now.",
      instructionKey: 'c1ep9AssistedInstruction', evalKind: 'adapt_register', canDoId: 'repair_a_register_slip',
      suggestionEn: "Sorry, that came out wrong — what I meant to say was, we'd really appreciate it if this could be finished by Friday.",
      itemIds: ['self_repair_discourse_pattern', 'that_came_out_wrong'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "You just told your boss 'can you' instead of a more formal request, and it landed a bit too casually. Notice it and repair it.",
      instructionKey: 'c1ep9IndependentInstruction', evalKind: 'adapt_register', canDoId: 'repair_a_register_slip',
      itemIds: ['self_repair_discourse_pattern'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'c1ep9CanDoName', titleKey: 'c1ep9CloseTitle', bodyKey: 'c1ep9CloseBody', ctaKey: 'c1ep6CloseCta' },
  ],
}

const INTEGRATED_05 = {
  id: 'c1_register_and_diplomacy_integrated',
  arc: 'register_and_diplomacy',
  level: 'C1',
  role: 'integrated',
  titleKey: 'c1ep10Title',
  goalKey: 'c1ep10Goal',
  canDoId: 'adapt_register_to_audience',
  canDoNameKey: 'c1ep10CanDoName',
  durationKey: 'c1ep10Duration',
  estimatedMinutes: 13,
  xp: 120,
  prerequisites: ['c1_register_and_diplomacy_repair'],
  skillPrerequisites: ['adapt_register_to_audience', 'hedge_and_mitigate_a_statement', 'disagree_diplomatically', 'repair_a_register_slip'],
  gardenItems: [],
  reuseSkills: ['adapt_register_to_audience', 'hedge_and_mitigate_a_statement', 'disagree_diplomatically', 'repair_a_register_slip', 'concede_a_counterpoint_gracefully'],
  registerAppropriateness: { checked: true, graduationRelevance: 'required' },
  /*
   * Transfer relationship: a new acquaintance at a professional networking
   * event — never used in EP1-EP4 (whose relationships were a landlord, a
   * colleague's draft, a manager's tool suggestion and a client call).
   */
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'c1ep10SceneTitle', bodyKey: 'c1ep10SceneBody', showGoal: true, ctaKey: 'c1ep10Start' },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "You've just met someone at a networking event who might be a useful contact. Ask them, politely, if they'd be willing to connect on email.",
      instructionKey: 'c1ep10AdaptInstruction', evalKind: 'adapt_register', canDoId: 'adapt_register_to_audience',
      itemIds: ['register_pair_pattern'], evidenceType: 'independent', transfer: true, expectedRegister: 'formal',
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "They mention their company's approach is 'always email first, never message.' You think that's outdated. Raise it gently.",
      instructionKey: 'c1ep10HedgeInstruction', evalKind: 'hedge_statement', canDoId: 'hedge_and_mitigate_a_statement',
      itemIds: ['mitigation_device_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "They insist email is just more professional, full stop. You disagree. Respond diplomatically.",
      instructionKey: 'c1ep10DisagreeInstruction', evalKind: 'hedge_statement', canDoId: 'disagree_diplomatically',
      itemIds: ['i_see_it_a_bit_differently'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Oops — you just said 'yeah whatever' out loud to a total stranger you're trying to network with. Catch it and repair it.",
      instructionKey: 'c1ep10RepairInstruction', evalKind: 'adapt_register', canDoId: 'repair_a_register_slip',
      itemIds: ['self_repair_discourse_pattern'], evidenceType: 'independent', transfer: true,
    },
    { type: 'recall', instructionKey: 'c1ep10FinalInstruction', evalKind: 'concede_point', canDoId: 'concede_a_counterpoint_gracefully', itemIds: ['concessive_clause_pattern'] },
    { type: 'completion', canDoNameKey: 'c1ep10CanDoName', titleKey: 'c1ep10CloseTitle', bodyKey: 'c1ep10CloseBody', ctaKey: 'c1ep6CloseCta' },
  ],
}

export const C1_ARC2 = [ADAPT_01, HEDGE_02, DISAGREE_03, REPAIR_04, INTEGRATED_05]
export const C1_ARC2_ID = 'register_and_diplomacy'
export const getC1Arc2Episode = (id) => C1_ARC2.find((ep) => ep.id === id) || null
