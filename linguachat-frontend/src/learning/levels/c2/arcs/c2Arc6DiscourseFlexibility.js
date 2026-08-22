/*
 * C2 arc 6 — "Keeping a long, unpredictable exchange coherent"
 * (`discourse_flexibility`).
 *
 * Derived from docs/curriculum/blueprints/c2.json arc `discourse_flexibility`
 * and docs/curriculum/implementation/c2/content-plan.json's matching arc
 * entry. Prerequisite arcs: argument_and_position, implication_and_subtext.
 * Introduces sustain_coherence_across_topic_shifts (required),
 * repair_a_misunderstanding_at_intention_level (required) and
 * function_inside_an_unfamiliar_high_ambiguity_exchange (should, subtype
 * `unfamiliar_exchange` of the `sustain_coherence` intent).
 * personalizationMode: none (c2.json) — no personalization variant
 * anywhere in this arc, by design; the blueprint requires neutral,
 * non-personalized contexts here specifically so discourse management is
 * provable independent of topic familiarity.
 *
 * MULTI-TURN SHAPE. This is the arc `coreEngineRequirements[0]`
 * (multi_turn_evaluation_span) exists for. Every evaluated step for
 * `sustain_coherence` (both the base intent and its `unfamiliar_exchange`
 * subtype) carries a `turnContext` array — the preceding turn(s) of the
 * exchange, `{ speaker, textEn }` — and `evaluationSpan: 'multiTurn'`,
 * matching `c2Capabilities.js`'s own `evaluationSpan` tag and
 * `c2EvaluationContracts.js`'s `C2_MULTI_TURN_SPAN_FIXTURES`
 * (`spanKind: 'topic_bridge'`). `repair_a_misunderstanding_at_intention_level`
 * is NOT blueprint-tagged `evaluationSpan: 'multiTurn'` (transcribed
 * faithfully — c2.json only tags the other two), but it still needs the
 * immediately preceding turn to judge correctly, so its steps carry
 * `turnContext` without the `evaluationSpan` flag — see
 * `c2EvaluationContracts.js`'s header comment for why this distinction is
 * an authored design choice, not a blueprint requirement.
 *
 * This is structure for `LC-INT-001` to implement grading logic against,
 * not the grading logic itself (out of this task's write scope).
 *
 * STRUCTURE. Four episodes: EP1 (sustain_coherence), EP2
 * (repair_a_misunderstanding_at_intention_level), EP3
 * (function_inside_an_unfamiliar_high_ambiguity_exchange, the
 * unfamiliar_exchange subtype), all three built around ONE continuous
 * six-turn flatmate transcript (content-plan.json's own `flatmate_transcript`,
 * extended here turn-by-turn exactly as that document's steps describe:
 * turn 2 = topic bridge, turn 4 = intention-level repair, turn 6 = response
 * to a genuinely ambiguous follow-up). EP4 is the arc-closing INTEGRATED
 * episode on a wholly new topic (a shared-tool borrowing dispute that
 * drifts into scheduling, content-plan.json's own transfer target) that
 * supplies each capability's transfer instance.
 *
 * EVIDENCE ACCOUNTING (must match c2.json#/canDos[].evidence):
 *   sustain_coherence_across_topic_shifts (required, independent:2, transfer:1) —
 *     1 independent in EP1 (step 5), 1 independent+transfer in EP4 (step 2).
 *   repair_a_misunderstanding_at_intention_level (required, independent:2, transfer:1) —
 *     1 independent in EP2 (step 5), 1 independent+transfer in EP4 (step 4).
 *   function_inside_an_unfamiliar_high_ambiguity_exchange (should, independent:1, transfer:1) —
 *     1 independent in EP3 (step 5), 1 transfer in EP4 (step 6).
 * `scripts/foundry/c2/check-c2-evidence-paths.mjs` counts these mechanically.
 *
 * All prose lives behind i18n keys; every English target/prompt/turn is
 * literal. Key namespace: c2ep21 (EP1) - c2ep24 (EP4).
 */

const SUSTAIN_01 = {
  id: 'c2_discourse_flexibility_sustain',
  arc: 'discourse_flexibility',
  level: 'C2',
  role: 'primary',
  titleKey: 'c2ep21Title',
  goalKey: 'c2ep21Goal',
  canDoId: 'sustain_coherence_across_topic_shifts',
  canDoNameKey: 'c2ep21CanDoName',
  durationKey: 'c2ep21Duration',
  estimatedMinutes: 14,
  xp: 110,
  prerequisites: [],
  skillPrerequisites: ['develop_an_extended_qualified_argument'],
  gardenItems: ['paragraph_scale_cohesion_pattern', 'insofar as', 'whereby', 'coherence'],
  reuseSkills: ['develop_an_extended_qualified_argument'],
  steps: [
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep21SceneTitle', bodyKey: 'c2ep21SceneBody', showGoal: true, ctaKey: 'c2ep21Start',
      turnContext: [{ speaker: 'flatmate', textEn: "Can we talk about the chore schedule? I feel like I'm doing the dishes every night." }] },
    {
      type: 'model',
      target: "Yeah, that's fair - and while we're on it, I think the grocery money split has been uneven too, since I've been buying most of the shared stuff lately.",
      meaningItems: ['paragraph_scale_cohesion_pattern'], explainKey: 'c2ep21ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep21ComprehensionInstruction',
      target: "Totally, and speaking of splitting things fairly, I feel like the grocery costs have been kind of one-sided too.",
      itemId: 'paragraph_scale_cohesion_pattern',
      options: [{ key: 'c2ep21CompOptCorrect', correct: true }, { key: 'c2ep21CompOptWrong1' }, { key: 'c2ep21CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep21NearMissInstruction',
      target: 'Also, did you see the game last night?',
      itemId: 'paragraph_scale_cohesion_pattern',
      options: [{ key: 'c2ep21NearMissOptCorrect', correct: true }, { key: 'c2ep21NearMissOptWrong1' }, { key: 'c2ep21NearMissOptWrong2' }],
      explainKey: 'c2ep21NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Respond to your flatmate, agreeing about the dishes, then bridge to a second fairness issue you've been meaning to raise.",
      instructionKey: 'c2ep21AssistedInstruction', evalKind: 'sustain_coherence', canDoId: 'sustain_coherence_across_topic_shifts',
      evaluationSpan: 'multiTurn', turnContext: [{ speaker: 'flatmate', textEn: "Can we talk about the chore schedule? I feel like I'm doing the dishes every night." }],
      suggestionEn: "Yeah, that's fair - and while we're on it, I think the grocery money split has been uneven too.",
      itemIds: ['paragraph_scale_cohesion_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "A colleague says: 'The report's basically done, just needs a final read-through.' Agree, then bridge to raising that the deadline itself might need to move.",
      instructionKey: 'c2ep21IndependentInstruction', evalKind: 'sustain_coherence', canDoId: 'sustain_coherence_across_topic_shifts',
      evaluationSpan: 'multiTurn', turnContext: [{ speaker: 'colleague', textEn: "The report's basically done, just needs a final read-through." }],
      itemIds: ['paragraph_scale_cohesion_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep21FinalInstruction', evalKind: 'sustain_coherence', canDoId: 'sustain_coherence_across_topic_shifts', itemIds: ['paragraph_scale_cohesion_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep21CanDoName', titleKey: 'c2ep21CloseTitle', bodyKey: 'c2ep21CloseBody', ctaKey: 'c2ep21CloseCta' },
  ],
}

const REPAIR_02 = {
  id: 'c2_discourse_flexibility_repair',
  arc: 'discourse_flexibility',
  level: 'C2',
  role: 'primary',
  titleKey: 'c2ep22Title',
  goalKey: 'c2ep22Goal',
  canDoId: 'repair_a_misunderstanding_at_intention_level',
  canDoNameKey: 'c2ep22CanDoName',
  durationKey: 'c2ep22Duration',
  estimatedMinutes: 12,
  xp: 110,
  prerequisites: ['c2_discourse_flexibility_sustain'],
  skillPrerequisites: ['recognize_implied_meaning', 'manage_face_in_disagreement'],
  gardenItems: ['face_saving_disagreement_pattern', 'that said', 'by the same token'],
  reuseSkills: ['manage_face_in_disagreement'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c2ep22RecallInstruction', evalKind: 'sustain_coherence', canDoId: 'sustain_coherence_across_topic_shifts', itemIds: ['paragraph_scale_cohesion_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep22SceneTitle', bodyKey: 'c2ep22SceneBody', ctaKey: 'c2ep22Start',
      turnContext: [
        { speaker: 'flatmate', textEn: "Can we talk about the chore schedule? I feel like I'm doing the dishes every night." },
        { speaker: 'learner', textEn: "Yeah, that's fair - and while we're on it, I think the grocery money split has been uneven too, since I've been buying most of the shared stuff lately." },
        { speaker: 'flatmate', textEn: "Wait, I thought we were splitting groceries evenly already?" },
      ] },
    {
      type: 'model',
      target: "Sorry, I didn't mean it as an accusation - I just meant we should double check the numbers together, since I think it's just gotten uneven by accident.",
      meaningItems: ['face_saving_disagreement_pattern'], explainKey: 'c2ep22ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep22ComprehensionInstruction',
      target: "Oh, I didn't mean to imply you weren't paying your share - I just think it's worth checking since it might've drifted without either of us noticing.",
      itemId: 'face_saving_disagreement_pattern',
      options: [{ key: 'c2ep22CompOptCorrect', correct: true }, { key: 'c2ep22CompOptWrong1' }, { key: 'c2ep22CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep22NearMissInstruction',
      target: 'No, we’re not splitting it evenly, I checked the receipts.',
      itemId: 'face_saving_disagreement_pattern',
      options: [{ key: 'c2ep22NearMissOptCorrect', correct: true }, { key: 'c2ep22NearMissOptWrong1' }, { key: 'c2ep22NearMissOptWrong2' }],
      explainKey: 'c2ep22NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Your flatmate sounds a little defensive. Repair the misunderstanding - you weren't accusing them, you just want to check the numbers together.",
      instructionKey: 'c2ep22AssistedInstruction', evalKind: 'repair_at_intention_level', canDoId: 'repair_a_misunderstanding_at_intention_level',
      turnContext: [{ speaker: 'flatmate', textEn: "Wait, I thought we were splitting groceries evenly already?" }],
      suggestionEn: "Sorry, I didn't mean it as an accusation - I just meant we should double check the numbers together, since I think it's just gotten uneven by accident.",
      itemIds: ['face_saving_disagreement_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "A colleague snaps: 'Are you saying I've been slacking on this?' after you mentioned the deadline might move. Repair the misunderstanding.",
      instructionKey: 'c2ep22IndependentInstruction', evalKind: 'repair_at_intention_level', canDoId: 'repair_a_misunderstanding_at_intention_level',
      turnContext: [{ speaker: 'colleague', textEn: "Are you saying I've been slacking on this?" }],
      itemIds: ['face_saving_disagreement_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep22FinalInstruction', evalKind: 'repair_at_intention_level', canDoId: 'repair_a_misunderstanding_at_intention_level', itemIds: ['face_saving_disagreement_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep22CanDoName', titleKey: 'c2ep22CloseTitle', bodyKey: 'c2ep22CloseBody', ctaKey: 'c2ep21CloseCta' },
  ],
}

const UNFAMILIAR_03 = {
  id: 'c2_discourse_flexibility_unfamiliar',
  arc: 'discourse_flexibility',
  level: 'C2',
  role: 'secondary',
  titleKey: 'c2ep23Title',
  goalKey: 'c2ep23Goal',
  canDoId: 'function_inside_an_unfamiliar_high_ambiguity_exchange',
  canDoNameKey: 'c2ep23CanDoName',
  durationKey: 'c2ep23Duration',
  estimatedMinutes: 10,
  xp: 100,
  prerequisites: ['c2_discourse_flexibility_repair'],
  skillPrerequisites: ['sustain_coherence_across_topic_shifts', 'repair_a_misunderstanding_at_intention_level'],
  gardenItems: ['paragraph_scale_cohesion_pattern', 'ambiguity', 'clarify'],
  reuseSkills: ['sustain_coherence_across_topic_shifts', 'repair_a_misunderstanding_at_intention_level'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c2ep23RecallInstruction', evalKind: 'repair_at_intention_level', canDoId: 'repair_a_misunderstanding_at_intention_level', itemIds: ['face_saving_disagreement_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep23SceneTitle', bodyKey: 'c2ep23SceneBody', ctaKey: 'c2ep23Start',
      turnContext: [{ speaker: 'flatmate', textEn: "Well, it's not like it's anyone's fault really - it's probably just uneven by accident, I guess." }] },
    {
      type: 'model',
      target: "I'm not totally sure what you mean by 'uneven by accident' - do you mean the amounts, or how often each of us pays?",
      meaningItems: ['paragraph_scale_cohesion_pattern'], explainKey: 'c2ep23ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep23ComprehensionInstruction',
      target: 'Sorry, can you say more about what you mean by that? I want to make sure I understand before we sort it out.',
      itemId: 'paragraph_scale_cohesion_pattern',
      options: [{ key: 'c2ep23CompOptCorrect', correct: true }, { key: 'c2ep23CompOptWrong1' }, { key: 'c2ep23CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep23NearMissInstruction',
      target: 'Nice weather we’re having.',
      itemId: 'paragraph_scale_cohesion_pattern',
      options: [{ key: 'c2ep23NearMissOptCorrect', correct: true }, { key: 'c2ep23NearMissOptWrong1' }, { key: 'c2ep23NearMissOptWrong2' }],
      explainKey: 'c2ep23NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Your flatmate's comment is genuinely ambiguous. Ask a clarifying question instead of guessing or changing the subject.",
      instructionKey: 'c2ep23AssistedInstruction', evalKind: 'sustain_coherence', canDoId: 'function_inside_an_unfamiliar_high_ambiguity_exchange',
      subtype: 'unfamiliar_exchange', evaluationSpan: 'multiTurn',
      turnContext: [{ speaker: 'flatmate', textEn: "Well, it's not like it's anyone's fault really - it's probably just uneven by accident, I guess." }],
      suggestionEn: "I'm not totally sure what you mean by 'uneven by accident' - do you mean the amounts, or how often each of us pays?",
      itemIds: ['paragraph_scale_cohesion_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "A new club member says: 'It's usually a bit informal about who pays for what, so don't worry about it too much.' Ask a clarifying question about what that actually means in practice.",
      instructionKey: 'c2ep23IndependentInstruction', evalKind: 'sustain_coherence', canDoId: 'function_inside_an_unfamiliar_high_ambiguity_exchange',
      subtype: 'unfamiliar_exchange', evaluationSpan: 'multiTurn',
      turnContext: [{ speaker: 'club_member', textEn: "It's usually a bit informal about who pays for what, so don't worry about it too much." }],
      itemIds: ['paragraph_scale_cohesion_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep23FinalInstruction', evalKind: 'sustain_coherence', canDoId: 'function_inside_an_unfamiliar_high_ambiguity_exchange', itemIds: ['paragraph_scale_cohesion_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep23CanDoName', titleKey: 'c2ep23CloseTitle', bodyKey: 'c2ep23CloseBody', ctaKey: 'c2ep21CloseCta' },
  ],
}

const INTEGRATED_04 = {
  id: 'c2_discourse_flexibility_integrated',
  arc: 'discourse_flexibility',
  level: 'C2',
  role: 'integrated',
  titleKey: 'c2ep24Title',
  goalKey: 'c2ep24Goal',
  canDoId: 'sustain_coherence_across_topic_shifts',
  canDoNameKey: 'c2ep24CanDoName',
  durationKey: 'c2ep24Duration',
  estimatedMinutes: 16,
  xp: 130,
  prerequisites: ['c2_discourse_flexibility_unfamiliar'],
  skillPrerequisites: ['sustain_coherence_across_topic_shifts', 'repair_a_misunderstanding_at_intention_level', 'function_inside_an_unfamiliar_high_ambiguity_exchange'],
  gardenItems: [],
  reuseSkills: ['sustain_coherence_across_topic_shifts', 'repair_a_misunderstanding_at_intention_level', 'function_inside_an_unfamiliar_high_ambiguity_exchange'],
  /*
   * Transfer topic: a shared-tool borrowing dispute that drifts into
   * scheduling — genuinely new, never used in EP1-EP3 (content-plan.json's
   * own suggested transfer topic for this arc), fully unrehearsed by
   * construction per the arc's `autonomyTarget`.
   */
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'c2ep24SceneTitle', bodyKey: 'c2ep24SceneBody', showGoal: true, ctaKey: 'c2ep24Start',
      turnContext: [{ speaker: 'neighbor', textEn: "Hey, could I borrow your ladder again this weekend? Also, sorry it came back a bit late last time." }] },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Respond to your neighbor about the ladder, then bridge to raising that you'd like a clearer plan for when borrowed tools come back.",
      instructionKey: 'c2ep24SustainInstruction', evalKind: 'sustain_coherence', canDoId: 'sustain_coherence_across_topic_shifts',
      evaluationSpan: 'multiTurn', turnContext: [{ speaker: 'neighbor', textEn: "Hey, could I borrow your ladder again this weekend? Also, sorry it came back a bit late last time." }],
      itemIds: ['paragraph_scale_cohesion_pattern'], evidenceType: 'independent', transfer: true,
    },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep24SecondSceneTitle', bodyKey: 'c2ep24SecondSceneBody', ctaKey: 'c2ep24SecondStart',
      turnContext: [{ speaker: 'neighbor', textEn: "Wait, are you saying I've been careless with your stuff?" }] },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Your neighbor sounds hurt. Repair the misunderstanding - you weren't calling them careless, you just want a clearer return-by time.",
      instructionKey: 'c2ep24RepairInstruction', evalKind: 'repair_at_intention_level', canDoId: 'repair_a_misunderstanding_at_intention_level',
      turnContext: [{ speaker: 'neighbor', textEn: "Wait, are you saying I've been careless with your stuff?" }],
      itemIds: ['face_saving_disagreement_pattern'], evidenceType: 'independent', transfer: true,
    },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep24ThirdSceneTitle', bodyKey: 'c2ep24ThirdSceneBody', ctaKey: 'c2ep24ThirdStart',
      turnContext: [{ speaker: 'neighbor', textEn: "I mean, it's not really a big deal either way, it just depends, you know?" }] },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "That's genuinely ambiguous. Ask a clarifying question instead of letting it drop.",
      instructionKey: 'c2ep24UnfamiliarInstruction', evalKind: 'sustain_coherence', canDoId: 'function_inside_an_unfamiliar_high_ambiguity_exchange',
      subtype: 'unfamiliar_exchange', evaluationSpan: 'multiTurn',
      turnContext: [{ speaker: 'neighbor', textEn: "I mean, it's not really a big deal either way, it just depends, you know?" }],
      itemIds: ['paragraph_scale_cohesion_pattern'], evidenceType: 'independent', transfer: true,
    },
    { type: 'recall', instructionKey: 'c2ep24FinalInstruction', evalKind: 'sustain_coherence', canDoId: 'sustain_coherence_across_topic_shifts', itemIds: ['paragraph_scale_cohesion_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep24CanDoName', titleKey: 'c2ep24CloseTitle', bodyKey: 'c2ep24CloseBody', ctaKey: 'c2ep21CloseCta' },
  ],
}

export const C2_ARC6 = [SUSTAIN_01, REPAIR_02, UNFAMILIAR_03, INTEGRATED_04]
export const C2_ARC6_ID = 'discourse_flexibility'
export const getC2Arc6Episode = (id) => C2_ARC6.find((ep) => ep.id === id) || null
