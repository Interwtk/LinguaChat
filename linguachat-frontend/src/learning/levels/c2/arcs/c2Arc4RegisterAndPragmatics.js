/*
 * C2 arc 4 — "Saying it the right way for the moment" (`register_and_pragmatics`).
 *
 * Derived from docs/curriculum/blueprints/c2.json arc `register_and_pragmatics`
 * and docs/curriculum/implementation/c2/content-plan.json's matching arc
 * entry (source texts, intent test cases, steps, vocabulary — all
 * transcribed from there, not invented here). Order 4, prerequisite arc:
 * implication_and_subtext. Introduces shift_register_deliberately (required),
 * soften_or_intensify_a_claim (required) and manage_face_in_disagreement
 * (should, subtype `face_saving_disagreement` of the `shift_register` intent).
 *
 * personalizationMode: none (c2.json) — no personalization variant anywhere
 * in this arc, by design; the blueprint requires neutral, non-personalized
 * contexts here specifically so register control is provable independent of
 * topic familiarity (content-plan.json's own `neutralFallback`: "same
 * neutral workplace/service situations used for every learner"). Same
 * treatment as arc 6 (`c2Arc6DiscourseFlexibility.js`)'s own `none`-mode
 * header note.
 *
 * SOURCE TEXTS. `out_of_stock_register_pairs` (the taught formal/neutral/
 * informal triad for the same proposition) and `informal_stock_draft` (the
 * draft to be shifted to formal) are transcribed verbatim from
 * content-plan.json and carried on `scene` steps as `sourceTextEn`, per B2
 * arc 4's mediation convention (a harmless extra key on an existing step
 * type, not a new one). Unlike arc 1's dense-text capabilities, none of this
 * arc's three capabilities declare `source_text` in `c2Patterns.js`'s
 * `semanticNeeds` (they need `register_level`/`audience_profile`/
 * `stance_marker` instead), so `free_reply` steps here do NOT carry
 * `sourceRef: true` — the draft/context being responded to is instead
 * quoted directly inside each step's own `promptEn`, matching how arc 6
 * (also semantically source-text-free) uses `turnContext` rather than
 * `sourceRef`. This is structure for `LC-INT-001` to implement grading logic
 * against, not the grading logic itself (out of this task's write scope) —
 * see `docs/curriculum/implementation/c2/core-engine-handoff.md`.
 *
 * STRUCTURE. Four episodes: EP1 (shift_register_deliberately, using
 * out_of_stock_register_pairs + informal_stock_draft, then a second
 * self-authored register-shift task for independent production), EP2
 * (soften_or_intensify_a_claim, teaching both academic_hedging_pattern via
 * the launch-delay scenario and boosting_pattern via a strong-evidence
 * scenario, then a self-authored hedge/boost calibration task for
 * independent), EP3 (manage_face_in_disagreement — should-scope, so one
 * assisted + one independent step is sufficient, following arc 6's own
 * `function_inside_an_unfamiliar_high_ambiguity_exchange` shape for its own
 * should-scope capability: no second `scene` step, the independent step's
 * new scenario is embedded directly in its `promptEn`), and EP4, the
 * arc-closing INTEGRATED episode built around content-plan.json's own
 * transfer target for this arc — "a new audience/register pairing not used
 * in teaching (a formal complaint vs. a casual note about the same issue)" —
 * which supplies each capability's transfer instance.
 *
 * EVIDENCE ACCOUNTING (must match c2.json#/canDos[].evidence, checked as
 * minimums by `scripts/foundry/c2/check-c2-evidence-paths.mjs`):
 *   shift_register_deliberately (required, independent:2, transfer:1) —
 *     1 independent in EP1 (step 7), 1 independent+transfer in EP4 (step 2).
 *   soften_or_intensify_a_claim (required, independent:2, transfer:1) —
 *     1 independent in EP2 (step 12), 1 independent+transfer in EP4 (step 4).
 *   manage_face_in_disagreement (should, independent:1, transfer:1) —
 *     1 independent in EP3 (step 7), 1 independent+transfer in EP4 (step 6)
 *     — same "the transfer step is also independent, so it over-satisfies
 *     rather than exactly equalling the should-scope minimum" shape arc 6
 *     uses for its own should-scope capability.
 *
 * STEP TYPES. Only the nine types `EpisodeShell.jsx` already renders
 * (scene, model, comprehension, choice, word_order, fill_blank, free_reply,
 * recall, completion) — zero renderer work needed, only evaluator/dispatch
 * wiring (out of this task's scope; see `core-engine-handoff.md`).
 * `evalKind` values are C2 intent ids from `c2Intents.js`; `canDoId` is
 * added explicitly on every evaluated step; `subtype` is added on every
 * evaluated step for `manage_face_in_disagreement`, which reuses the
 * `shift_register` intent under its `face_saving_disagreement` subtype.
 *
 * All prose lives behind i18n keys (never populated by this task — see
 * `list-c2-i18n-keys.mjs`); every English target/prompt/source text is
 * literal, exactly as every earlier level does it. Key namespace: c2ep13
 * (EP1) - c2ep16 (EP4).
 */

const SHIFT_01 = {
  id: 'c2_register_and_pragmatics_shift',
  arc: 'register_and_pragmatics',
  level: 'C2',
  role: 'primary',
  titleKey: 'c2ep13Title',
  goalKey: 'c2ep13Goal',
  canDoId: 'shift_register_deliberately',
  canDoNameKey: 'c2ep13CanDoName',
  durationKey: 'c2ep13Duration',
  estimatedMinutes: 12,
  xp: 100,
  prerequisites: [],
  skillPrerequisites: ['c1.adapt_register_to_audience'],
  gardenItems: ['register_shift_lexis_pattern', 'formality', 'register', 'diplomatic', 'bureaucratic'],
  reuseSkills: ['c1.adapt_register_to_audience'],
  steps: [
    { type: 'scene', mood: 'focused', titleKey: 'c2ep13SceneTitle', bodyKey: 'c2ep13SceneBody', showGoal: true, ctaKey: 'c2ep13Start',
      sourceTextEn: "Formal: 'We regret to inform you that the item is currently unavailable.' Neutral: 'Unfortunately, this item isn't available right now.' Informal: 'Sorry, we're out of that one.'" },
    {
      type: 'model',
      target: 'We regret to inform you that the item is currently out of stock; we will notify you as soon as it becomes available.',
      meaningItems: ['register_shift_lexis_pattern'], explainKey: 'c2ep13ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep13ComprehensionInstruction',
      target: 'We apologize, but this item is currently unavailable. We will contact you once it is back in stock.',
      itemId: 'register_shift_lexis_pattern',
      options: [{ key: 'c2ep13CompOptCorrect', correct: true }, { key: 'c2ep13CompOptWrong1' }, { key: 'c2ep13CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep13NearMissInstruction',
      target: 'Sorry we don’t have that right now, we will inform you.',
      itemId: 'register_shift_lexis_pattern',
      options: [{ key: 'c2ep13NearMissOptCorrect', correct: true }, { key: 'c2ep13NearMissOptWrong1' }, { key: 'c2ep13NearMissOptWrong2' }],
      explainKey: 'c2ep13NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "A colleague drafted this reply to a customer: \"hey sorry we're out of that, ill let u know when its back\". Rewrite it in the formal register, like the formal example above.",
      instructionKey: 'c2ep13AssistedInstruction', evalKind: 'shift_register', canDoId: 'shift_register_deliberately',
      suggestionEn: 'We regret to inform you that the item is currently out of stock; we will notify you as soon as it becomes available.',
      itemIds: ['register_shift_lexis_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'scene', mood: 'focused', titleKey: 'c2ep13SecondSceneTitle', bodyKey: 'c2ep13SecondSceneBody', ctaKey: 'c2ep13SecondStart',
      sourceTextEn: 'hey heads up the meeting got moved to 3pm today, my bad for the late notice' },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Now rewrite this one on your own, in a formal register: "hey heads up the meeting got moved to 3pm today, my bad for the late notice"',
      instructionKey: 'c2ep13IndependentInstruction', evalKind: 'shift_register', canDoId: 'shift_register_deliberately',
      itemIds: ['register_shift_lexis_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep13FinalInstruction', evalKind: 'shift_register', canDoId: 'shift_register_deliberately', itemIds: ['register_shift_lexis_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep13CanDoName', titleKey: 'c2ep13CloseTitle', bodyKey: 'c2ep13CloseBody', ctaKey: 'c2ep13CloseCta' },
  ],
}

const QUALIFY_02 = {
  id: 'c2_register_and_pragmatics_qualify',
  arc: 'register_and_pragmatics',
  level: 'C2',
  role: 'primary',
  titleKey: 'c2ep14Title',
  goalKey: 'c2ep14Goal',
  canDoId: 'soften_or_intensify_a_claim',
  canDoNameKey: 'c2ep14CanDoName',
  durationKey: 'c2ep14Duration',
  estimatedMinutes: 13,
  xp: 105,
  prerequisites: ['c2_register_and_pragmatics_shift'],
  skillPrerequisites: ['shift_register_deliberately'],
  gardenItems: ['academic_hedging_pattern', 'boosting_pattern', 'could be argued', 'arguably', 'to some extent', 'not necessarily', 'undeniably', 'there is little doubt that'],
  reuseSkills: ['shift_register_deliberately'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c2ep14RecallInstruction', evalKind: 'shift_register', canDoId: 'shift_register_deliberately', itemIds: ['register_shift_lexis_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep14SceneTitle', bodyKey: 'c2ep14SceneBody', ctaKey: 'c2ep14Start',
      sourceTextEn: "Your team lead asks how confident you are that the product launch will stay on schedule. Testing has turned up a few minor bugs, but one module still hasn't been fully tested." },
    {
      type: 'model',
      target: "The launch will probably slip by about a week, though it's too early to be certain.",
      meaningItems: ['academic_hedging_pattern'], explainKey: 'c2ep14ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep14ComprehensionInstruction',
      target: "It looks like the launch might be pushed back roughly a week, but that's not confirmed yet.",
      itemId: 'academic_hedging_pattern',
      options: [{ key: 'c2ep14CompOptCorrect', correct: true }, { key: 'c2ep14CompOptWrong1' }, { key: 'c2ep14CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep14NearMissInstruction',
      target: 'The launch might maybe possibly slip, I guess, perhaps.',
      itemId: 'academic_hedging_pattern',
      options: [{ key: 'c2ep14NearMissOptCorrect', correct: true }, { key: 'c2ep14NearMissOptWrong1' }, { key: 'c2ep14NearMissOptWrong2' }],
      explainKey: 'c2ep14NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Your team lead asks how confident you are that the launch will stay on schedule, given the untested module. Give one proportionate hedge - not a stack of them.',
      instructionKey: 'c2ep14AssistedInstruction', evalKind: 'qualify_claim', canDoId: 'soften_or_intensify_a_claim',
      suggestionEn: "The launch will probably slip by about a week, though it's too early to be certain.",
      itemIds: ['academic_hedging_pattern'], evidenceType: 'assistedOpen',
    },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep14BoostSceneTitle', bodyKey: 'c2ep14BoostSceneBody', ctaKey: 'c2ep14BoostStart',
      sourceTextEn: 'Error logs for the new checkout process are in: the rate dropped from 12% to under 2%, consistently, across every store, for the whole month.' },
    {
      type: 'model',
      target: 'There is little doubt that the new checkout process reduced errors.',
      meaningItems: ['boosting_pattern'], explainKey: 'c2ep14BoostModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep14BoostComprehensionInstruction',
      target: "It's pretty clear the new checkout process cut down on errors.",
      itemId: 'boosting_pattern',
      options: [{ key: 'c2ep14BoostCompOptCorrect', correct: true }, { key: 'c2ep14BoostCompOptWrong1' }, { key: 'c2ep14BoostCompOptWrong2' }],
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Summarize what the error logs show, using appropriately confident language - the evidence is strong here.',
      instructionKey: 'c2ep14BoostAssistedInstruction', evalKind: 'qualify_claim', canDoId: 'soften_or_intensify_a_claim',
      suggestionEn: 'There is little doubt that the new checkout process reduced errors.',
      itemIds: ['boosting_pattern'], evidenceType: 'assistedOpen',
    },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep14SecondSceneTitle', bodyKey: 'c2ep14SecondSceneBody', ctaKey: 'c2ep14SecondStart',
      sourceTextEn: "A colleague asks whether the new supplier will really cut delivery times. Early results look promising - three test shipments arrived a day faster - but you've only tried it with one supplier so far." },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Respond to your colleague with a proportionate hedge or boost, on your own - is the evidence strong enough for confidence, or does it call for a hedge?',
      instructionKey: 'c2ep14IndependentInstruction', evalKind: 'qualify_claim', canDoId: 'soften_or_intensify_a_claim',
      itemIds: ['academic_hedging_pattern', 'boosting_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep14FinalInstruction', evalKind: 'qualify_claim', canDoId: 'soften_or_intensify_a_claim', itemIds: ['academic_hedging_pattern', 'boosting_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep14CanDoName', titleKey: 'c2ep14CloseTitle', bodyKey: 'c2ep14CloseBody', ctaKey: 'c2ep13CloseCta' },
  ],
}

const FACE_03 = {
  id: 'c2_register_and_pragmatics_face',
  arc: 'register_and_pragmatics',
  level: 'C2',
  role: 'secondary',
  titleKey: 'c2ep15Title',
  goalKey: 'c2ep15Goal',
  canDoId: 'manage_face_in_disagreement',
  canDoNameKey: 'c2ep15CanDoName',
  durationKey: 'c2ep15Duration',
  estimatedMinutes: 10,
  xp: 100,
  prerequisites: ['c2_register_and_pragmatics_qualify'],
  skillPrerequisites: ['soften_or_intensify_a_claim', 'recognize_implied_meaning'],
  gardenItems: ['face_saving_disagreement_pattern', 'I take your point', "that's fair"],
  reuseSkills: ['soften_or_intensify_a_claim'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c2ep15RecallInstruction', evalKind: 'qualify_claim', canDoId: 'soften_or_intensify_a_claim', itemIds: ['academic_hedging_pattern', 'boosting_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep15SceneTitle', bodyKey: 'c2ep15SceneBody', ctaKey: 'c2ep15Start',
      sourceTextEn: "A colleague on your team says: 'Honestly, let's just skip the testing phase this time - we're behind schedule and I don't think it's worth the delay.'" },
    {
      type: 'model',
      target: "I take your point about speed, but I'd push back on skipping testing - I think we lose more time later if something breaks.",
      meaningItems: ['face_saving_disagreement_pattern'], explainKey: 'c2ep15ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep15ComprehensionInstruction',
      target: "That's fair, though I'm a bit worried that skipping testing might cost us more time down the line.",
      itemId: 'face_saving_disagreement_pattern',
      options: [{ key: 'c2ep15CompOptCorrect', correct: true }, { key: 'c2ep15CompOptWrong1' }, { key: 'c2ep15CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep15NearMissInstruction',
      target: "No, that's a bad idea, we should test first.",
      itemId: 'face_saving_disagreement_pattern',
      options: [{ key: 'c2ep15NearMissOptCorrect', correct: true }, { key: 'c2ep15NearMissOptWrong1' }, { key: 'c2ep15NearMissOptWrong2' }],
      explainKey: 'c2ep15NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Respond to your colleague - push back on skipping testing, but acknowledge their point about the schedule first.",
      instructionKey: 'c2ep15AssistedInstruction', evalKind: 'shift_register', canDoId: 'manage_face_in_disagreement', subtype: 'face_saving_disagreement',
      suggestionEn: "I take your point about speed, but I'd push back on skipping testing - I think we lose more time later if something breaks.",
      itemIds: ['face_saving_disagreement_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "A friend says: 'Honestly, let's just cancel the group trip and everyone do their own separate thing instead - way less hassle.' You disagree, but don't want to hurt their feelings. Push back, on your own, face-savingly.",
      instructionKey: 'c2ep15IndependentInstruction', evalKind: 'shift_register', canDoId: 'manage_face_in_disagreement', subtype: 'face_saving_disagreement',
      itemIds: ['face_saving_disagreement_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep15FinalInstruction', evalKind: 'shift_register', canDoId: 'manage_face_in_disagreement', itemIds: ['face_saving_disagreement_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep15CanDoName', titleKey: 'c2ep15CloseTitle', bodyKey: 'c2ep15CloseBody', ctaKey: 'c2ep13CloseCta' },
  ],
}

const INTEGRATED_04 = {
  id: 'c2_register_and_pragmatics_integrated',
  arc: 'register_and_pragmatics',
  level: 'C2',
  role: 'integrated',
  titleKey: 'c2ep16Title',
  goalKey: 'c2ep16Goal',
  canDoId: 'shift_register_deliberately',
  canDoNameKey: 'c2ep16CanDoName',
  durationKey: 'c2ep16Duration',
  estimatedMinutes: 14,
  xp: 120,
  prerequisites: ['c2_register_and_pragmatics_face'],
  skillPrerequisites: ['shift_register_deliberately', 'soften_or_intensify_a_claim', 'manage_face_in_disagreement'],
  gardenItems: [],
  reuseSkills: ['shift_register_deliberately', 'soften_or_intensify_a_claim', 'manage_face_in_disagreement'],
  /*
   * Transfer target: a new audience/register pairing not used in teaching —
   * a formal complaint vs. a casual note about the same issue
   * (content-plan.json's own suggested transfer target for this arc,
   * step order 4). Genuinely new material, never used in EP1-EP3. This is
   * what makes the three production turns below TRANSFER, not repetition.
   */
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'c2ep16SceneTitle', bodyKey: 'c2ep16SceneBody', showGoal: true, ctaKey: 'c2ep16Start',
      sourceTextEn: "hey this is the third time our order's been late, kind of annoyed tbh, can someone sort this out" },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'You need to send this as a formal complaint instead, to the company\'s customer service department. Rewrite it in a formal register: "hey this is the third time our order\'s been late, kind of annoyed tbh, can someone sort this out"',
      instructionKey: 'c2ep16ShiftInstruction', evalKind: 'shift_register', canDoId: 'shift_register_deliberately',
      itemIds: ['register_shift_lexis_pattern'], evidenceType: 'independent', transfer: true,
    },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep16SecondSceneTitle', bodyKey: 'c2ep16SecondSceneBody', ctaKey: 'c2ep16SecondStart',
      sourceTextEn: 'Customer service replies that a new courier contract starts next month, and early results from the pilot region show on-time delivery improved from 70% to 95% over six weeks.' },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'A colleague asks whether switching couriers will really fix the late-delivery problem. Respond with proportionate confidence, based on the pilot results.',
      instructionKey: 'c2ep16QualifyInstruction', evalKind: 'qualify_claim', canDoId: 'soften_or_intensify_a_claim',
      itemIds: ['academic_hedging_pattern', 'boosting_pattern'], evidenceType: 'independent', transfer: true,
    },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep16ThirdSceneTitle', bodyKey: 'c2ep16ThirdSceneBody', ctaKey: 'c2ep16ThirdStart',
      sourceTextEn: "A colleague suggests: 'Let's just tell every customer their order's delayed because of the courier switch, even the ones where that's not actually true - it's simpler than explaining each case.'" },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'You disagree with blanket-blaming the courier switch for every case. Push back, face-savingly, on your own.',
      instructionKey: 'c2ep16FaceInstruction', evalKind: 'shift_register', canDoId: 'manage_face_in_disagreement', subtype: 'face_saving_disagreement',
      itemIds: ['face_saving_disagreement_pattern'], evidenceType: 'independent', transfer: true,
    },
    { type: 'recall', instructionKey: 'c2ep16FinalInstruction', evalKind: 'shift_register', canDoId: 'shift_register_deliberately', itemIds: ['register_shift_lexis_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep16CanDoName', titleKey: 'c2ep16CloseTitle', bodyKey: 'c2ep16CloseBody', ctaKey: 'c2ep13CloseCta' },
  ],
}

export const C2_ARC4 = [SHIFT_01, QUALIFY_02, FACE_03, INTEGRATED_04]
export const C2_ARC4_ID = 'register_and_pragmatics'
export const getC2Arc4Episode = (id) => C2_ARC4.find((ep) => ep.id === id) || null
