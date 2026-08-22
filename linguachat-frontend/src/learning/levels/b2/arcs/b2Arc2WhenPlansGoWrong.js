/*
 * B2 arc 2 — "When plans go wrong" (`when_plans_go_wrong`).
 *
 * Derived from docs/curriculum/blueprints/b2.json arc `when_plans_go_wrong`
 * and b2.md section 4. Prerequisite arc: `making_the_case`. Introduces
 * justify_a_request_for_change, negotiate_a_resolution (both required) and
 * express_frustration_diplomatically (should). Reuses arc 1's
 * develop_and_defend_opinion and concede_a_point_and_counter (guided reuse,
 * not new evidence) plus real B1 capabilities b1.negotiate_a_solution and
 * b1.give_an_opinion (referenced as skillPrerequisites/reuseSkills id
 * strings only — no B1 content is built here).
 *
 * STRUCTURE. Same four-episode shape as arc 1 (see b2Arc1MakingTheCase.js's
 * own header): one teaching episode per new capability (assisted-open
 * production, then one unaided production) plus one arc-closing integrated
 * episode that reuses everything the arc taught in a single longer roleplay
 * exchange, on a genuinely new problem type. Cross-arc episode chaining
 * mirrors A1's own convention (a1Arc2.js's first episode lists a1Arc1's
 * last episode id as its prerequisite) — this arc's first episode lists
 * arc 1's closer as its prerequisite.
 *
 * SCENARIOS. Teaching episodes use the two neutral fallback contexts named
 * in b2.md section 4 ("a delayed home repair appointment; a wrong item in
 * an online order"): EP5 is a wrong-item online order, EP6-EP7 continue a
 * delayed/missed home-repair appointment. The closer (EP8) transfers to a
 * genuinely new problem type not used in teaching — a cancelled restaurant
 * reservation — matching b2.md's own worked example ("taught on a
 * delivery, transferred to a cancelled reservation").
 *
 * EVIDENCE ACCOUNTING (must match b2.json#/canDos[].evidence):
 *   justify_a_request_for_change (required, independent:2, transfer:1) —
 *     1 independent in EP5; 1 independent + 1 transfer (same step) in EP8.
 *   negotiate_a_resolution (required, independent:2, transfer:1) —
 *     1 independent in EP6; 1 independent + 1 transfer (same step) in EP8.
 *   express_frustration_diplomatically (should, independent:1, transfer:0) —
 *     1 independent in EP7; EP8 reinforces it (guided reuse, assistedOpen)
 *     without requiring transfer, matching its lighter evidence target.
 *   develop_and_defend_opinion / concede_a_point_and_counter (arc 1,
 *     already satisfied there) — woven back in here only as guided reuse
 *     (a review `recall` in EP5, a `guided` free_reply in EP8), never as
 *     new evidence, per this task's brief.
 * `scripts/foundry/b2/check-b2-evidence-paths.mjs` counts these mechanically
 * from `evidenceType`/`transfer` step fields rather than trusting this
 * comment.
 *
 * STEP TYPES. Only the nine types `EpisodeShell.jsx` already renders (scene,
 * model, comprehension, choice, word_order, fill_blank, free_reply, recall,
 * completion) — same convention as arc 1, no `mini_story` step used.
 * `evalKind` values are B2 intent ids from `b2Intents.js`; `canDoId` is added
 * explicitly on every evaluated step so validation never has to infer it
 * from the intent map.
 *
 * All prose lives behind i18n keys (never populated by this task — see
 * `i18nKeysNeeded.js`); every English target/prompt is literal, exactly as
 * arc 1 and every earlier level does it. Keys use the `b2ep5`-`b2ep8`
 * prefixes (arc 1 owns `b2ep1`-`b2ep4`).
 */

const JUSTIFY_05 = {
  id: 'b2_when_plans_go_wrong_justify',
  arc: 'when_plans_go_wrong',
  level: 'B2',
  role: 'primary',
  titleKey: 'b2ep5Title',
  goalKey: 'b2ep5Goal',
  canDoId: 'justify_a_request_for_change',
  canDoNameKey: 'b2ep5CanDoName',
  durationKey: 'b2ep5Duration',
  estimatedMinutes: 10,
  xp: 90,
  prerequisites: ['b2_making_the_case_integrated'],
  skillPrerequisites: ['b1.give_an_opinion', 'develop_and_defend_opinion'],
  gardenItems: ['justification_pattern', 'the_issue_is_that', 'could_you_look_into', 'id_appreciate_it_if', 'at_your_earliest_convenience'],
  reuseSkills: ['develop_and_defend_opinion'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'b2ep5RecallInstruction', evalKind: 'state_opinion_with_reason', canDoId: 'develop_and_defend_opinion', itemIds: ['opinion_stance_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'b2ep5SceneTitle', bodyKey: 'b2ep5SceneBody', showGoal: true, ctaKey: 'b2ep5Start' },
    {
      type: 'model',
      target: "The issue is that the jacket I received is a small, not a medium — since I need it for a trip next week, could you look into sending the right size?",
      meaningItems: ['justification_pattern', 'the_issue_is_that'], explainKey: 'b2ep5ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'b2ep5ComprehensionInstruction',
      target: "The reason I'm asking is that I'm travelling on Friday, so I'd appreciate it if you could send the replacement by Thursday.",
      itemId: 'justification_pattern',
      options: [{ key: 'b2ep5CompOptCorrect', correct: true }, { key: 'b2ep5CompOptWrong1' }, { key: 'b2ep5CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'b2ep5NearMissInstruction',
      target: 'Just send me a refund.',
      itemId: 'justification_pattern',
      options: [{ key: 'b2ep5NearMissOptCorrect', correct: true }, { key: 'b2ep5NearMissOptWrong1' }, { key: 'b2ep5NearMissOptWrong2' }],
      explainKey: 'b2ep5NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Thanks for contacting us — I can see your order arrived. What's the issue, and what would you like us to do about it?",
      instructionKey: 'b2ep5AssistedInstruction', evalKind: 'justify_a_request', canDoId: 'justify_a_request_for_change',
      suggestionEn: "The issue is that the jacket is the wrong size — since I need it for a trip next week, I'd appreciate it if you could send a medium instead.",
      itemIds: ['justification_pattern', 'the_issue_is_that'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "I see the same order also had a second item — a phone case in the wrong color. Tell me what's wrong with it and what you need from us.",
      instructionKey: 'b2ep5IndependentInstruction', evalKind: 'justify_a_request', canDoId: 'justify_a_request_for_change',
      itemIds: ['justification_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'b2ep5FinalInstruction', evalKind: 'justify_a_request', canDoId: 'justify_a_request_for_change', itemIds: ['justification_pattern'] },
    { type: 'completion', canDoNameKey: 'b2ep5CanDoName', titleKey: 'b2ep5CloseTitle', bodyKey: 'b2ep5CloseBody', ctaKey: 'b2ep5CloseCta' },
  ],
}

const NEGOTIATE_06 = {
  id: 'b2_when_plans_go_wrong_negotiate',
  arc: 'when_plans_go_wrong',
  level: 'B2',
  role: 'primary',
  titleKey: 'b2ep6Title',
  goalKey: 'b2ep6Goal',
  canDoId: 'negotiate_a_resolution',
  canDoNameKey: 'b2ep6CanDoName',
  durationKey: 'b2ep6Duration',
  estimatedMinutes: 10,
  xp: 90,
  prerequisites: ['b2_when_plans_go_wrong_justify'],
  skillPrerequisites: ['b1.negotiate_a_solution', 'justify_a_request_for_change'],
  gardenItems: ['negotiation_proposal_pattern', 'what_id_like_is', 'would_it_be_possible_to', 'i_was_wondering_if_you_could', 'as_a_gesture_of_goodwill', 'in_that_case', 'lets_see_what_we_can_do'],
  reuseSkills: ['justify_a_request_for_change'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'b2ep6RecallInstruction', evalKind: 'justify_a_request', canDoId: 'justify_a_request_for_change', itemIds: ['justification_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'b2ep6SceneTitle', bodyKey: 'b2ep6SceneBody', ctaKey: 'b2ep6Start' },
    {
      type: 'model',
      target: "What I'd like is a new appointment this week — would you be willing to send someone tomorrow instead?",
      meaningItems: ['negotiation_proposal_pattern', 'what_id_like_is'], explainKey: 'b2ep6ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'b2ep6ComprehensionInstruction',
      target: "Would it be possible to reschedule for Thursday morning? I'd suggest sometime between nine and eleven.",
      itemId: 'negotiation_proposal_pattern',
      options: [{ key: 'b2ep6CompOptCorrect', correct: true }, { key: 'b2ep6CompOptWrong1' }, { key: 'b2ep6CompOptWrong2' }],
    },
    {
      type: 'word_order', instructionKey: 'b2ep6BuildInstruction', hintKey: 'b2ep6BuildHint', itemId: 'negotiation_proposal_pattern',
      tokens: ['Would', 'it', 'be', 'possible', 'to', 'send', 'someone', 'tomorrow', 'instead', '?'],
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "I'm sorry about that — the technician should have called ahead to let you know. What would you like us to do?",
      instructionKey: 'b2ep6AssistedInstruction', evalKind: 'propose_a_resolution', canDoId: 'negotiate_a_resolution',
      suggestionEn: "What I'd like is a new appointment this week — would you be willing to send someone tomorrow, or is Thursday possible?",
      itemIds: ['negotiation_proposal_pattern', 'what_id_like_is'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Let's see what we can do. What timing would actually work best for you, and what should we do differently this time so it doesn't happen again?",
      instructionKey: 'b2ep6IndependentInstruction', evalKind: 'propose_a_resolution', canDoId: 'negotiate_a_resolution',
      itemIds: ['negotiation_proposal_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'b2ep6FinalInstruction', evalKind: 'propose_a_resolution', canDoId: 'negotiate_a_resolution', itemIds: ['negotiation_proposal_pattern'] },
    { type: 'completion', canDoNameKey: 'b2ep6CanDoName', titleKey: 'b2ep6CloseTitle', bodyKey: 'b2ep6CloseBody', ctaKey: 'b2ep5CloseCta' },
  ],
}

const DIPLOMATIC_07 = {
  id: 'b2_when_plans_go_wrong_diplomatic',
  arc: 'when_plans_go_wrong',
  level: 'B2',
  role: 'secondary',
  titleKey: 'b2ep7Title',
  goalKey: 'b2ep7Goal',
  canDoId: 'express_frustration_diplomatically',
  canDoNameKey: 'b2ep7CanDoName',
  durationKey: 'b2ep7Duration',
  estimatedMinutes: 8,
  xp: 75,
  prerequisites: ['b2_when_plans_go_wrong_negotiate'],
  skillPrerequisites: ['justify_a_request_for_change'],
  gardenItems: ['diplomatic_hedge_pattern', 'thats_not_really_acceptable', 'i_understand_but', 'to_be_fair', 'i_take_your_point'],
  reuseSkills: ['justify_a_request_for_change', 'negotiate_a_resolution'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'b2ep7RecallInstruction', evalKind: 'propose_a_resolution', canDoId: 'negotiate_a_resolution', itemIds: ['negotiation_proposal_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'b2ep7SceneTitle', bodyKey: 'b2ep7SceneBody', ctaKey: 'b2ep7Start' },
    {
      type: 'model',
      target: "I understand things get busy, but this is the second missed appointment, and I'd appreciate it if it didn't happen again.",
      meaningItems: ['diplomatic_hedge_pattern'], explainKey: 'b2ep7ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'b2ep7ComprehensionInstruction',
      target: "To be fair, I know things go wrong sometimes — but this really isn't acceptable, and I need it resolved today.",
      itemId: 'diplomatic_hedge_pattern',
      options: [{ key: 'b2ep7CompOptCorrect', correct: true }, { key: 'b2ep7CompOptWrong1' }, { key: 'b2ep7CompOptWrong2' }],
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "I'm really sorry — I can see this is the second missed visit. What would you like to say to me about that?",
      instructionKey: 'b2ep7AssistedInstruction', evalKind: 'express_diplomatic_frustration', canDoId: 'express_frustration_diplomatically',
      suggestionEn: "I understand things get busy, but this is the second time now, and that's not really acceptable — I need it sorted this week.",
      itemIds: ['diplomatic_hedge_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "I hear you, and I'm sorry again. Go ahead — tell me honestly how this has affected you and what you need from us now.",
      instructionKey: 'b2ep7IndependentInstruction', evalKind: 'express_diplomatic_frustration', canDoId: 'express_frustration_diplomatically',
      itemIds: ['diplomatic_hedge_pattern'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'b2ep7CanDoName', titleKey: 'b2ep7CloseTitle', bodyKey: 'b2ep7CloseBody', ctaKey: 'b2ep5CloseCta' },
  ],
}

const INTEGRATED_08 = {
  id: 'b2_when_plans_go_wrong_integrated',
  arc: 'when_plans_go_wrong',
  level: 'B2',
  role: 'integrated',
  titleKey: 'b2ep8Title',
  goalKey: 'b2ep8Goal',
  canDoId: 'justify_a_request_for_change',
  canDoNameKey: 'b2ep8CanDoName',
  durationKey: 'b2ep8Duration',
  estimatedMinutes: 12,
  xp: 110,
  prerequisites: ['b2_when_plans_go_wrong_diplomatic'],
  skillPrerequisites: ['justify_a_request_for_change', 'negotiate_a_resolution', 'express_frustration_diplomatically'],
  gardenItems: [],
  reuseSkills: ['justify_a_request_for_change', 'negotiate_a_resolution', 'express_frustration_diplomatically', 'develop_and_defend_opinion', 'concede_a_point_and_counter'],
  /*
   * Transfer topic: a cancelled restaurant reservation on the night of a
   * birthday dinner — genuinely new problem type, never used in EP5-EP7
   * (which used a wrong-item order and a delayed/missed repair
   * appointment). Matches b2.md's own worked example verbatim ("taught on
   * a delivery, transferred to a cancelled reservation"). This is what
   * makes the two independent+transfer production turns below TRANSFER,
   * not repetition.
   */
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'b2ep8SceneTitle', bodyKey: 'b2ep8SceneBody', showGoal: true, ctaKey: 'b2ep8Start' },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "I'm so sorry — I don't see a reservation under that name tonight. Can you tell me what happened, from what you understood, and what you need from us?",
      instructionKey: 'b2ep8JustifyInstruction', evalKind: 'justify_a_request', canDoId: 'justify_a_request_for_change',
      itemIds: ['justification_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "To be fair, Saturday nights are always fully booked here, so a short wait isn't unusual for us.",
      instructionKey: 'b2ep8ConcedeInstruction', evalKind: 'concede_and_counter', canDoId: 'concede_a_point_and_counter',
      itemIds: ['concession_counter_pattern'], evidenceType: 'guided',
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Let's see what we can do — what would actually work for you tonight?",
      instructionKey: 'b2ep8NegotiateInstruction', evalKind: 'propose_a_resolution', canDoId: 'negotiate_a_resolution',
      itemIds: ['negotiation_proposal_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "We can offer a free dessert and drinks while you wait, as a gesture of goodwill. How does that sound?",
      instructionKey: 'b2ep8CloseInstruction', evalKind: 'express_diplomatic_frustration', canDoId: 'express_frustration_diplomatically',
      suggestionEn: "I understand it's a busy night, but I did book this weeks ago — I'd appreciate it if this didn't happen again. The dessert is a nice gesture, though, thank you.",
      itemIds: ['diplomatic_hedge_pattern'], evidenceType: 'assistedOpen',
    },
    { type: 'recall', instructionKey: 'b2ep8FinalInstruction', evalKind: 'propose_a_resolution', canDoId: 'negotiate_a_resolution', itemIds: ['negotiation_proposal_pattern'] },
    { type: 'completion', canDoNameKey: 'b2ep8CanDoName', titleKey: 'b2ep8CloseTitle', bodyKey: 'b2ep8CloseBody', ctaKey: 'b2ep5CloseCta' },
  ],
}

export const B2_ARC2 = [JUSTIFY_05, NEGOTIATE_06, DIPLOMATIC_07, INTEGRATED_08]
export const B2_ARC2_ID = 'when_plans_go_wrong'
export const getB2Arc2Episode = (id) => B2_ARC2.find((ep) => ep.id === id) || null
