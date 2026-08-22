/*
 * C1 arc 1 — "Taking a position" (`abstract_argument`).
 *
 * Derived from docs/curriculum/blueprints/c1.json arc `abstract_argument`
 * and c1.md section 4 (Arc A). First arc, prerequisite: B2 exit only
 * (b2.develop_and_defend_opinion). Introduces develop_a_structured_argument,
 * qualify_a_claim_precisely, concede_a_counterpoint_gracefully (all
 * required) and weigh_implications_of_a_position (should).
 *
 * STRUCTURE. Five episodes: one teaching episode per new capability
 * (assisted-open production, then one unaided production) plus one
 * arc-closing integrated episode that reuses every capability the arc just
 * taught on a genuinely new topic (transfer), the same B2/A1 arc-closer
 * convention `docs/curriculum/implementation/b2/README.md` documents. C1's
 * higher evidence bar (independent:3/transfer:2/delayedRetrieval:1 for
 * required capabilities, vs. B2's independent:2/transfer:1) means the home
 * arc supplies only the FIRST TWO of three required independent instances;
 * the third (also carrying transfer:true and, where the reuse matrix marks
 * it, delayedRetrieval:true) is supplied by a later arc's reuse episode —
 * see EVIDENCE ACCOUNTING below and each later arc's own file.
 *
 * EVIDENCE ACCOUNTING (must match c1Capabilities.js's independentEvidence,
 * cross-checked against c1ReuseMatrix.js's marks for which arc supplies the
 * 3rd/delayed touch):
 *   develop_a_structured_argument (required, independent:3) —
 *     1 independent in EP1, 1 independent+transfer in EP5 (this arc);
 *     3rd independent+transfer+delayedRetrieval lands in Arc G
 *     (sustain_a_conversation_across_topic_shifts's home episode reuses it,
 *     reuseMatrix marks R at sustained_interaction).
 *   qualify_a_claim_precisely (required, independent:3) —
 *     1 independent in EP2, 1 independent+transfer in EP5; 3rd lands in
 *     Arc F (reuseMatrix marks D at negotiation_and_complexity — the
 *     blueprint's OWN designated delayed-retrieval arc for this capability).
 *   concede_a_counterpoint_gracefully (required, independent:3) —
 *     1 independent in EP3, 1 independent+transfer in EP5; 3rd lands in
 *     Arc G (reuseMatrix marks R at sustained_interaction).
 *   weigh_implications_of_a_position (should, independent:2) —
 *     1 independent in EP4, 1 independent+transfer in EP5. Fully satisfied
 *     within this arc — should capabilities carry no mandatory
 *     delayedRetrieval (c1.json evidence.thresholds.should.delayedRetrieval: 0).
 * `scripts/foundry/c1/check-c1-evidence-paths.mjs` counts these mechanically.
 *
 * HONEST NOTE: weigh_implications_of_a_position's own c1.json
 * languageInfrastructure lists `conditional_alternative_pattern`, whose OWN
 * `firstAppearance` (c1Patterns.js) is `negotiation_and_complexity` (Arc F)
 * — a forward reference inside the blueprint's own capability entry. EP4
 * below uses ordinary conditional language for this should-priority
 * capability without tagging `conditional_alternative_pattern` as a
 * `gardenItems` entry here (it is only tracked as a Garden item once Arc F
 * actually introduces it), consistent with not inventing an earlier
 * "first appearance" than the blueprint itself declares.
 *
 * STEP TYPES. Only the nine types `EpisodeShell.jsx` already renders (scene,
 * model, comprehension, choice, word_order, fill_blank, free_reply, recall,
 * completion) — C1 needs zero new renderer work, only evaluator/dispatch
 * wiring (out of this task's scope; see
 * docs/curriculum/implementation/c1/core-engine-handoff.md). `evalKind`
 * values are C1 intent ids from `c1Intents.js`; `canDoId` is added
 * explicitly on every evaluated step.
 *
 * All prose lives behind i18n keys (never populated by this task — see
 * `scripts/foundry/c1/list-c1-i18n-keys.mjs`); every English target/prompt
 * is literal, exactly as every earlier level does it.
 */

const ARGUMENT_01 = {
  id: 'c1_abstract_argument_position',
  arc: 'abstract_argument',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep1Title',
  goalKey: 'c1ep1Goal',
  canDoId: 'develop_a_structured_argument',
  canDoNameKey: 'c1ep1CanDoName',
  durationKey: 'c1ep1Duration',
  estimatedMinutes: 11,
  xp: 100,
  prerequisites: [],
  skillPrerequisites: ['b2.develop_and_defend_opinion'],
  gardenItems: ['emphatic_cleft_pattern', 'hedging_modal_pattern', 'what_really_matters_is', 'the_case_for_x_is'],
  reuseSkills: ['b2.develop_and_defend_opinion'],
  steps: [
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep1SceneTitle', bodyKey: 'c1ep1SceneBody', showGoal: true, ctaKey: 'c1ep1Start' },
    {
      type: 'model',
      target: "What really matters here is that screen limits might well help some families, but they're unlikely to fix the underlying issue on their own — take, for example, a household where the real problem is the daily routine, not the device.",
      meaningItems: ['emphatic_cleft_pattern', 'hedging_modal_pattern', 'take_for_example'], explainKey: 'c1ep1ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep1ComprehensionInstruction',
      target: "The case for a shorter work week is that people are more focused when they're not exhausted, and burnout might well be the bigger cost long-term.",
      itemId: 'emphatic_cleft_pattern',
      options: [{ key: 'c1ep1CompOptCorrect', correct: true }, { key: 'c1ep1CompOptWrong1' }, { key: 'c1ep1CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c1ep1NearMissInstruction',
      target: "I don't think everyone should have to go back to the office.",
      itemId: 'emphatic_cleft_pattern',
      options: [{ key: 'c1ep1NearMissOptCorrect', correct: true }, { key: 'c1ep1NearMissOptWrong1' }, { key: 'c1ep1NearMissOptWrong2' }],
      explainKey: 'c1ep1NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Some people say screen-time limits are the answer to kids being distracted. What's your position, and why?",
      instructionKey: 'c1ep1AssistedInstruction', evalKind: 'state_structured_argument', canDoId: 'develop_a_structured_argument',
      suggestionEn: 'What really matters is the daily routine, not the device itself — a strict limit might well help, but it treats the symptom, not the cause.',
      itemIds: ['emphatic_cleft_pattern', 'hedging_modal_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Some people think a four-day work week should become standard everywhere. What do you think, and why — with a concrete example if you can?',
      instructionKey: 'c1ep1IndependentInstruction', evalKind: 'state_structured_argument', canDoId: 'develop_a_structured_argument',
      itemIds: ['emphatic_cleft_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c1ep1FinalInstruction', evalKind: 'state_structured_argument', canDoId: 'develop_a_structured_argument', itemIds: ['hedging_modal_pattern'] },
    { type: 'completion', canDoNameKey: 'c1ep1CanDoName', titleKey: 'c1ep1CloseTitle', bodyKey: 'c1ep1CloseBody', ctaKey: 'c1ep1CloseCta' },
  ],
}

const QUALIFY_02 = {
  id: 'c1_abstract_argument_qualify',
  arc: 'abstract_argument',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep2Title',
  goalKey: 'c1ep2Goal',
  canDoId: 'qualify_a_claim_precisely',
  canDoNameKey: 'c1ep2CanDoName',
  durationKey: 'c1ep2Duration',
  estimatedMinutes: 10,
  xp: 95,
  prerequisites: ['c1_abstract_argument_position'],
  skillPrerequisites: ['develop_a_structured_argument'],
  gardenItems: ['hedging_adverbial_pattern', 'to_some_extent', 'by_and_large', 'not_necessarily'],
  reuseSkills: ['develop_a_structured_argument'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep2RecallInstruction', evalKind: 'state_structured_argument', canDoId: 'develop_a_structured_argument', itemIds: ['emphatic_cleft_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep2SceneTitle', bodyKey: 'c1ep2SceneBody', ctaKey: 'c1ep2Start' },
    {
      type: 'model',
      target: "By and large, remote work suits people with a quiet home, but that's not necessarily true for everyone — to some extent it depends on the household.",
      meaningItems: ['hedging_adverbial_pattern'], explainKey: 'c1ep2ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep2ComprehensionInstruction',
      target: "It's arguably the safer option, though that's not necessarily true in every case.",
      itemId: 'hedging_adverbial_pattern',
      options: [{ key: 'c1ep2CompOptCorrect', correct: true }, { key: 'c1ep2CompOptWrong1' }, { key: 'c1ep2CompOptWrong2' }],
    },
    {
      type: 'word_order', instructionKey: 'c1ep2BuildInstruction', hintKey: 'c1ep2BuildHint', itemId: 'hedging_modal_pattern',
      tokens: ['That', 'might', 'well', 'be', 'true', ',', 'but', 'it', "isn't", 'always', '.'],
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Someone just told you social media is definitely bad for teenagers, full stop, no exceptions. How would you respond, with a bit more precision than that?",
      instructionKey: 'c1ep2AssistedInstruction', evalKind: 'qualify_claim', canDoId: 'qualify_a_claim_precisely',
      suggestionEn: "By and large it can be, but that's not necessarily true for everyone — it might well depend on how it's used.",
      itemIds: ['hedging_adverbial_pattern', 'hedging_modal_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Is it true that working from a coffee shop is always more productive than working from home? Qualify that claim precisely.',
      instructionKey: 'c1ep2IndependentInstruction', evalKind: 'qualify_claim', canDoId: 'qualify_a_claim_precisely',
      itemIds: ['hedging_adverbial_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c1ep2FinalInstruction', evalKind: 'qualify_claim', canDoId: 'qualify_a_claim_precisely', itemIds: ['hedging_adverbial_pattern'] },
    { type: 'completion', canDoNameKey: 'c1ep2CanDoName', titleKey: 'c1ep2CloseTitle', bodyKey: 'c1ep2CloseBody', ctaKey: 'c1ep1CloseCta' },
  ],
}

const CONCEDE_03 = {
  id: 'c1_abstract_argument_concede',
  arc: 'abstract_argument',
  level: 'C1',
  role: 'primary',
  titleKey: 'c1ep3Title',
  goalKey: 'c1ep3Goal',
  canDoId: 'concede_a_counterpoint_gracefully',
  canDoNameKey: 'c1ep3CanDoName',
  durationKey: 'c1ep3Duration',
  estimatedMinutes: 10,
  xp: 95,
  prerequisites: ['c1_abstract_argument_qualify'],
  skillPrerequisites: ['develop_a_structured_argument', 'qualify_a_claim_precisely'],
  gardenItems: ['concessive_clause_pattern', 'i_take_your_point_that', 'while_its_true_that', 'that_said'],
  reuseSkills: ['develop_a_structured_argument', 'qualify_a_claim_precisely'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep3RecallInstruction', evalKind: 'qualify_claim', canDoId: 'qualify_a_claim_precisely', itemIds: ['hedging_adverbial_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep3SceneTitle', bodyKey: 'c1ep3SceneBody', ctaKey: 'c1ep3Start' },
    {
      type: 'model',
      target: "While it's true that the tourism brings jobs, that said, the strain on local housing is a real cost — I still think the benefits outweigh it overall.",
      meaningItems: ['concessive_clause_pattern', 'that_said'], explainKey: 'c1ep3ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep3ComprehensionInstruction',
      target: 'Yes, you\'re right about that.',
      itemId: 'concessive_clause_pattern',
      options: [{ key: 'c1ep3CompOptCorrect', correct: true }, { key: 'c1ep3CompOptWrong1' }, { key: 'c1ep3CompOptWrong2' }],
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "I still think the local resource should be open to everyone, no restrictions — even though it means it gets crowded fast. What's your honest reaction?",
      instructionKey: 'c1ep3AssistedInstruction', evalKind: 'concede_point', canDoId: 'concede_a_counterpoint_gracefully',
      suggestionEn: "I take your point that open access is fairer — that said, I still think some limits would keep it usable for everyone long-term.",
      itemIds: ['concessive_clause_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Honestly, I think screen limits are just controlling and unnecessary — kids will figure it out on their own. React to that, acknowledging what's fair about it before you push back.",
      instructionKey: 'c1ep3IndependentInstruction', evalKind: 'concede_point', canDoId: 'concede_a_counterpoint_gracefully',
      itemIds: ['concessive_clause_pattern'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'c1ep3CanDoName', titleKey: 'c1ep3CloseTitle', bodyKey: 'c1ep3CloseBody', ctaKey: 'c1ep1CloseCta' },
  ],
}

const WEIGH_04 = {
  id: 'c1_abstract_argument_weigh',
  arc: 'abstract_argument',
  level: 'C1',
  role: 'secondary',
  titleKey: 'c1ep4Title',
  goalKey: 'c1ep4Goal',
  canDoId: 'weigh_implications_of_a_position',
  canDoNameKey: 'c1ep4CanDoName',
  durationKey: 'c1ep4Duration',
  estimatedMinutes: 8,
  xp: 80,
  prerequisites: ['c1_abstract_argument_concede'],
  skillPrerequisites: ['concede_a_counterpoint_gracefully', 'b2_weigh_advantages_and_disadvantages'],
  gardenItems: ['it_would_likely_mean_that', 'the_knock_on_effect_would_be'],
  reuseSkills: ['develop_a_structured_argument', 'concede_a_counterpoint_gracefully'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c1ep4RecallInstruction', evalKind: 'concede_point', canDoId: 'concede_a_counterpoint_gracefully', itemIds: ['concessive_clause_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep4SceneTitle', bodyKey: 'c1ep4SceneBody', ctaKey: 'c1ep4Start' },
    {
      type: 'model',
      target: "If the shared resource stayed open to everyone, it would likely mean longer queues — the knock-on effect would be fewer people using it at all.",
      meaningItems: ['it_would_likely_mean_that', 'the_knock_on_effect_would_be'], explainKey: 'c1ep4ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c1ep4ComprehensionInstruction',
      target: "If the four-day week became standard, it would likely mean tighter deadlines — the knock-on effect would be more pressure during the days people do work.",
      itemId: 'it_would_likely_mean_that',
      options: [{ key: 'c1ep4CompOptCorrect', correct: true }, { key: 'c1ep4CompOptWrong1' }, { key: 'c1ep4CompOptWrong2' }],
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Suppose the office dropped its dress code entirely. What's the likely knock-on effect of that, do you think?",
      instructionKey: 'c1ep4AssistedInstruction', evalKind: 'state_structured_argument', canDoId: 'weigh_implications_of_a_position',
      suggestionEn: "It would likely mean people take the workplace a little less seriously at first — the knock-on effect might be a more relaxed culture overall, for better or worse.",
      itemIds: ['it_would_likely_mean_that'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Suppose your city banned cars from the whole downtown area. What would that likely mean, and what would the knock-on effect be?',
      instructionKey: 'c1ep4IndependentInstruction', evalKind: 'state_structured_argument', canDoId: 'weigh_implications_of_a_position',
      itemIds: ['the_knock_on_effect_would_be'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'c1ep4CanDoName', titleKey: 'c1ep4CloseTitle', bodyKey: 'c1ep4CloseBody', ctaKey: 'c1ep1CloseCta' },
  ],
}

const INTEGRATED_05 = {
  id: 'c1_abstract_argument_integrated',
  arc: 'abstract_argument',
  level: 'C1',
  role: 'integrated',
  titleKey: 'c1ep5Title',
  goalKey: 'c1ep5Goal',
  canDoId: 'develop_a_structured_argument',
  canDoNameKey: 'c1ep5CanDoName',
  durationKey: 'c1ep5Duration',
  estimatedMinutes: 13,
  xp: 120,
  prerequisites: ['c1_abstract_argument_weigh'],
  skillPrerequisites: ['develop_a_structured_argument', 'qualify_a_claim_precisely', 'concede_a_counterpoint_gracefully', 'weigh_implications_of_a_position'],
  gardenItems: [],
  reuseSkills: ['develop_a_structured_argument', 'qualify_a_claim_precisely', 'concede_a_counterpoint_gracefully', 'weigh_implications_of_a_position'],
  /*
   * Transfer topic: whether streaming services should be legally required to
   * show how their recommendation algorithm works — genuinely new, never
   * used in EP1-EP4 (whose topics were screen limits, the four-day week,
   * tourism/local resources and dress codes). This is what makes the two
   * production turns marked `transfer: true` below TRANSFER, not repetition.
   */
  steps: [
    { type: 'scene', mood: 'thoughtful', titleKey: 'c1ep5SceneTitle', bodyKey: 'c1ep5SceneBody', showGoal: true, ctaKey: 'c1ep5Start' },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "So — should streaming services be legally required to explain how their recommendation algorithm actually works? What's your position?",
      instructionKey: 'c1ep5ArgumentInstruction', evalKind: 'state_structured_argument', canDoId: 'develop_a_structured_argument',
      itemIds: ['emphatic_cleft_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Fair, but wouldn't that just mean companies keep secrets in a different way, or give a technically-true-but-useless explanation?",
      instructionKey: 'c1ep5QualifyInstruction', evalKind: 'qualify_claim', canDoId: 'qualify_a_claim_precisely',
      itemIds: ['hedging_adverbial_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "I still think full transparency is the only real fix, even if some companies find a loophole. What do you say to that?",
      instructionKey: 'c1ep5ConcedeInstruction', evalKind: 'concede_point', canDoId: 'concede_a_counterpoint_gracefully',
      itemIds: ['concessive_clause_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'If a law like that actually passed, what do you think the likely knock-on effect would be for smaller companies specifically?',
      instructionKey: 'c1ep5WeighInstruction', evalKind: 'state_structured_argument', canDoId: 'weigh_implications_of_a_position',
      itemIds: ['it_would_likely_mean_that'], evidenceType: 'independent', transfer: true,
    },
    { type: 'recall', instructionKey: 'c1ep5FinalInstruction', evalKind: 'concede_point', canDoId: 'concede_a_counterpoint_gracefully', itemIds: ['concessive_clause_pattern'] },
    { type: 'completion', canDoNameKey: 'c1ep5CanDoName', titleKey: 'c1ep5CloseTitle', bodyKey: 'c1ep5CloseBody', ctaKey: 'c1ep1CloseCta' },
  ],
}

export const C1_ARC1 = [ARGUMENT_01, QUALIFY_02, CONCEDE_03, WEIGH_04, INTEGRATED_05]
export const C1_ARC1_ID = 'abstract_argument'
export const getC1Arc1Episode = (id) => C1_ARC1.find((ep) => ep.id === id) || null
