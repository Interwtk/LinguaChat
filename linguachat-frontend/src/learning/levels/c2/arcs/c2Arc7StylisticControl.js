/*
 * C2 arc 7 — "Shaping your own language on purpose" (`stylistic_control`).
 *
 * Derived from docs/curriculum/blueprints/c2.json arc `stylistic_control`
 * and docs/curriculum/implementation/c2/content-plan.json's matching arc
 * entry (source texts, intent test cases, steps, vocabulary — all
 * transcribed from there, not invented here, except where explicitly noted
 * below). Prerequisite arcs: register_and_pragmatics, precise_reformulation.
 * Introduces edit_own_text_for_precision_and_tone (required),
 * vary_expression_to_avoid_flattening_meaning (should, subtype
 * `lexical_variety` of the `edit_for_precision` intent) and
 * adapt_a_text_across_genre_and_register (optional, subtype
 * `genre_adaptation` of the `shift_register` intent already introduced in
 * arc 4 — reused, not re-taught from scratch).
 *
 * SCOPE MIX. Unlike arc 1 (three required capabilities) or arc 6 (two
 * required + one should), this arc mixes all three scopes in one family,
 * and `adapt_a_text_across_genre_and_register`'s own evidence target is
 * deliberately lighter than every other should/optional capability at this
 * level: `independent: 1, transfer: 0` (c2Capabilities.js), not the
 * `independent: 1, transfer: 1` every other should-scope capability
 * carries. One independent instance fully closes this capability's
 * evidence everywhere in the arc — see EP3 below.
 *
 * STRUCTURE. Four episodes, following arc 1's own established convention:
 * one teaching episode per new capability (assisted-open production, then
 * one unaided/independent production on a second same-difficulty source —
 * EP3 is the deliberate exception, see its own note), plus an arc-closing
 * INTEGRATED episode on a genuinely new draft that supplies transfer for
 * the two capabilities that still need it.
 *
 * PERSONALIZATION. c2.json marks this arc `personalizationMode: "light"`,
 * the same lighter-than-"themed" mode arc 3 uses: at most ONE optional
 * `personalizationVariant: true` step in the whole arc, placed only in the
 * arc-closing integrated episode (not once per teaching episode, unlike
 * arc 1's "themed" mode). content-plan.json's own `personalization` field
 * calls this "not structurally required" and gives a single interchangeable
 * example (editing a message tied to the learner's stated interest club or
 * group), never evaluated differently or required for evidence. Every
 * other production step in this arc uses the neutral fallback
 * (content-plan.json's own note: "editing a neutral notice/message rather
 * than a hobby text") — see EP4's single personalizationVariant step.
 *
 * SOURCE-TEXT SHAPE. Every teaching/integrated step group follows arc 1's
 * mediation convention: a `scene` step carries an extra `sourceTextEn`
 * field, and the `free_reply` step that follows carries `sourceRef: true`
 * so a future evaluator grades it against the preceding source text rather
 * than a canonical frame match. This is structure, not implementation — the
 * actual grading logic is `LC-INT-001` work.
 *
 * TRANSFER DIRECTION. content-plan.json names EP4's transfer target as "an
 * unseen draft with an unfamiliar tone mismatch (an overly stiff apology
 * text that needs warming up, the reverse direction of adjustment)" — EP1
 * teaches casual-to-formal (elevator_draft), so EP4 deliberately teaches the
 * opposite direction, stiff-to-warm, on a new self-authored draft
 * (`stiff_apology_draft`, not in content-plan.json's own `sourceTexts` list,
 * authored here per this task's instructions for the required capability's
 * own second/transfer material). That same draft also repeats one word
 * three times, so it doubles as the transfer instance for
 * `vary_expression_to_avoid_flattening_meaning` without inventing a second,
 * unrelated scene — the same scene-reuse economy arc 1's EP4 already uses
 * for its own two co-located capabilities.
 *
 * EVIDENCE ACCOUNTING (must match c2.json#/canDos[].evidence):
 *   edit_own_text_for_precision_and_tone (required, independent:2, transfer:1) —
 *     1 independent in EP1 (step 7), 1 independent+transfer in EP4 (step 2).
 *   vary_expression_to_avoid_flattening_meaning (should, independent:1, transfer:1) —
 *     1 independent in EP2 (step 7), 1 independent+transfer in EP4 (step 3)
 *     (this exceeds the independent:1 minimum by one, the same pattern arc
 *     6's own should-scope capability uses across its EP3/EP4).
 *   adapt_a_text_across_genre_and_register (optional, independent:1, transfer:0) —
 *     1 independent in EP3 (step 6) fully closes this capability; nothing
 *     further is added for it in EP4, per its own `transferContexts: []`.
 * `scripts/foundry/c2/check-c2-evidence-paths.mjs` counts these
 * mechanically from `evalKind`/`canDoId`/`evidenceType`/`transfer` step
 * fields.
 *
 * STEP TYPES. Only the nine types `EpisodeShell.jsx` already renders
 * (scene, model, comprehension, choice, word_order, fill_blank, free_reply,
 * recall, completion) — zero renderer work needed, only evaluator/dispatch
 * wiring (out of this task's scope; see `core-engine-handoff.md`).
 * `evalKind` values are C2 intent ids from `c2Intents.js`; `canDoId` is
 * added explicitly on every evaluated step, and a `subtype` field is added
 * wherever a step evaluates a capability that reuses another intent under a
 * subtype (`vary_expression_to_avoid_flattening_meaning` reuses
 * `edit_for_precision` as subtype `lexical_variety`;
 * `adapt_a_text_across_genre_and_register` reuses `shift_register` as
 * subtype `genre_adaptation`), mirroring arc 6's own
 * `function_inside_an_unfamiliar_high_ambiguity_exchange` convention.
 *
 * All prose lives behind i18n keys (never populated by this task — see
 * `list-c2-i18n-keys.mjs`); every English target/prompt/source text is
 * literal, exactly as every earlier level does it. Key namespace: c2ep25
 * (EP1) - c2ep28 (EP4).
 */

const EDIT_01 = {
  id: 'c2_stylistic_control_edit',
  arc: 'stylistic_control',
  level: 'C2',
  role: 'primary',
  titleKey: 'c2ep25Title',
  goalKey: 'c2ep25Goal',
  canDoId: 'edit_own_text_for_precision_and_tone',
  canDoNameKey: 'c2ep25CanDoName',
  durationKey: 'c2ep25Duration',
  estimatedMinutes: 12,
  xp: 100,
  prerequisites: [],
  skillPrerequisites: ['shift_register_deliberately', 'reformulate_dense_source_for_a_new_audience'],
  gardenItems: ['lexical_precision_substitution_pattern', 'precision', 'notice', 'revise'],
  reuseSkills: ['shift_register_deliberately', 'reformulate_dense_source_for_a_new_audience'],
  steps: [
    {
      type: 'recall', review: true, instructionKey: 'c2ep25GuidedReuseInstructionShift',
      evalKind: 'shift_register', canDoId: 'shift_register_deliberately',
      itemIds: ['register_shift_lexis_pattern'],
      note: "reinforcement (marker 'R') per c2.json arc stylistic_control's own reuseMap — editing for tone is register shifting applied to your own draft, so this arc briefly reactivates arc 4's skill first",
    },
    {
      type: 'recall', review: true, instructionKey: 'c2ep25GuidedReuseInstructionReformulate',
      evalKind: 'reformulate_for_audience', canDoId: 'reformulate_dense_source_for_a_new_audience',
      itemIds: ['reformulation_connector_pattern'],
      note: "reinforcement (marker 'R') per c2.json arc stylistic_control's own reuseMap — precision editing reuses arc 2's audience-reformulation skill",
    },
    { type: 'scene', mood: 'focused', titleKey: 'c2ep25SceneTitle', bodyKey: 'c2ep25SceneBody', showGoal: true, ctaKey: 'c2ep25Start',
      sourceTextEn: "Hey everyone, just a heads up, the elevator's gonna be broken next week lol, so yeah, use the stairs I guess." },
    {
      type: 'model',
      target: 'Notice: the elevator will be out of service next week. Please use the stairs during this time.',
      meaningItems: ['lexical_precision_substitution_pattern', 'notice'], explainKey: 'c2ep25ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep25ComprehensionInstruction',
      target: 'Please note that the elevator will be unavailable next week; residents are asked to use the stairs.',
      itemId: 'lexical_precision_substitution_pattern',
      options: [{ key: 'c2ep25CompOptCorrect', correct: true }, { key: 'c2ep25CompOptWrong1' }, { key: 'c2ep25CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep25NearMissInstruction',
      target: 'Hey everyone, the elevator won’t work next week, please use the stairs.',
      itemId: 'lexical_precision_substitution_pattern',
      options: [{ key: 'c2ep25NearMissOptCorrect', correct: true }, { key: 'c2ep25NearMissOptWrong1' }, { key: 'c2ep25NearMissOptWrong2' }],
      explainKey: 'c2ep25NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Rewrite the message above so it reads as an official building notice, not a casual heads-up.',
      instructionKey: 'c2ep25AssistedInstruction', evalKind: 'edit_for_precision', canDoId: 'edit_own_text_for_precision_and_tone', sourceRef: true,
      suggestionEn: 'Notice: the elevator will be out of service next week. Please use the stairs during this time.',
      itemIds: ['lexical_precision_substitution_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'scene', mood: 'focused', titleKey: 'c2ep25SecondSceneTitle', bodyKey: 'c2ep25SecondSceneBody', ctaKey: 'c2ep25SecondStart',
      sourceTextEn: "hey team, quick heads up, the parking lot's gonna be closed friday for repairs, so yeah, park on the street instead lol" },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Now edit this one independently, for the same kind of official notice.',
      instructionKey: 'c2ep25IndependentInstruction', evalKind: 'edit_for_precision', canDoId: 'edit_own_text_for_precision_and_tone', sourceRef: true,
      itemIds: ['lexical_precision_substitution_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep25FinalInstruction', evalKind: 'edit_for_precision', canDoId: 'edit_own_text_for_precision_and_tone', itemIds: ['lexical_precision_substitution_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep25CanDoName', titleKey: 'c2ep25CloseTitle', bodyKey: 'c2ep25CloseBody', ctaKey: 'c2ep25CloseCta' },
  ],
}

const VARIETY_02 = {
  id: 'c2_stylistic_control_variety',
  arc: 'stylistic_control',
  level: 'C2',
  role: 'secondary',
  titleKey: 'c2ep26Title',
  goalKey: 'c2ep26Goal',
  canDoId: 'vary_expression_to_avoid_flattening_meaning',
  canDoNameKey: 'c2ep26CanDoName',
  durationKey: 'c2ep26Duration',
  estimatedMinutes: 10,
  xp: 90,
  prerequisites: ['c2_stylistic_control_edit'],
  skillPrerequisites: ['edit_own_text_for_precision_and_tone'],
  gardenItems: ['lexical_precision_substitution_pattern', 'repetition', 'flatten'],
  reuseSkills: ['edit_own_text_for_precision_and_tone'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c2ep26RecallInstruction', evalKind: 'edit_for_precision', canDoId: 'edit_own_text_for_precision_and_tone', itemIds: ['lexical_precision_substitution_pattern'] },
    { type: 'scene', mood: 'focused', titleKey: 'c2ep26SceneTitle', bodyKey: 'c2ep26SceneBody', ctaKey: 'c2ep26Start',
      sourceTextEn: 'The problem is the schedule. The problem is also the budget. This problem needs a fix. We should solve this problem soon.' },
    {
      type: 'model',
      target: 'The main issue is the schedule; the budget is a second concern. Both need addressing, and the sooner the better.',
      meaningItems: ['lexical_precision_substitution_pattern'], explainKey: 'c2ep26ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep26ComprehensionInstruction',
      target: 'There are two issues - the schedule and the budget - and both should be sorted out soon.',
      itemId: 'lexical_precision_substitution_pattern',
      options: [{ key: 'c2ep26CompOptCorrect', correct: true }, { key: 'c2ep26CompOptWrong1' }, { key: 'c2ep26CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep26NearMissInstruction',
      target: 'The problem is the schedule. The problem is also the budget. This issue needs a fix.',
      itemId: 'lexical_precision_substitution_pattern',
      options: [{ key: 'c2ep26NearMissOptCorrect', correct: true }, { key: 'c2ep26NearMissOptWrong1' }, { key: 'c2ep26NearMissOptWrong2' }],
      explainKey: 'c2ep26NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Rewrite the message above so 'problem' isn't repeated four times - vary your word choice without losing the meaning.",
      instructionKey: 'c2ep26AssistedInstruction', evalKind: 'edit_for_precision', canDoId: 'vary_expression_to_avoid_flattening_meaning', subtype: 'lexical_variety', sourceRef: true,
      suggestionEn: 'The main issue is the schedule; the budget is a second concern. Both need addressing, and the sooner the better.',
      itemIds: ['lexical_precision_substitution_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'scene', mood: 'focused', titleKey: 'c2ep26SecondSceneTitle', bodyKey: 'c2ep26SecondSceneBody', ctaKey: 'c2ep26SecondStart',
      sourceTextEn: 'The meeting was too long. The meeting was also too disorganized. This meeting needs better planning. We should fix this meeting format.' },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Now try this one independently: vary the repeated word without losing any of the meaning.',
      instructionKey: 'c2ep26IndependentInstruction', evalKind: 'edit_for_precision', canDoId: 'vary_expression_to_avoid_flattening_meaning', subtype: 'lexical_variety', sourceRef: true,
      itemIds: ['lexical_precision_substitution_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep26FinalInstruction', evalKind: 'edit_for_precision', canDoId: 'vary_expression_to_avoid_flattening_meaning', itemIds: ['lexical_precision_substitution_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep26CanDoName', titleKey: 'c2ep26CloseTitle', bodyKey: 'c2ep26CloseBody', ctaKey: 'c2ep25CloseCta' },
  ],
}

const GENRE_03 = {
  id: 'c2_stylistic_control_genre',
  arc: 'stylistic_control',
  level: 'C2',
  role: 'secondary',
  titleKey: 'c2ep27Title',
  goalKey: 'c2ep27Goal',
  canDoId: 'adapt_a_text_across_genre_and_register',
  canDoNameKey: 'c2ep27CanDoName',
  durationKey: 'c2ep27Duration',
  estimatedMinutes: 10,
  xp: 90,
  prerequisites: ['c2_stylistic_control_variety'],
  skillPrerequisites: ['edit_own_text_for_precision_and_tone', 'shift_register_deliberately'],
  gardenItems: ['register_shift_lexis_pattern', 'tone-fit', 'apparent', 'register-appropriate'],
  reuseSkills: ['edit_own_text_for_precision_and_tone', 'shift_register_deliberately'],
  /*
   * This capability's own evidence target is `independent: 1, transfer: 0`
   * (c2Capabilities.js) — the lightest of any should/optional capability at
   * this level. One independent free_reply step (step 6 below) fully closes
   * it; unlike EP1/EP2 there is no second source text and no transfer
   * instance anywhere in the arc for it, per content-plan.json's own
   * `transferContexts: []` for this capability.
   */
  steps: [
    { type: 'recall', review: true, instructionKey: 'c2ep27RecallInstruction', evalKind: 'edit_for_precision', canDoId: 'vary_expression_to_avoid_flattening_meaning', subtype: 'lexical_variety', itemIds: ['lexical_precision_substitution_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep27SceneTitle', bodyKey: 'c2ep27SceneBody', ctaKey: 'c2ep27Start',
      sourceTextEn: 'hey the pipes are gonna get fixed thurs, sry for the noise' },
    {
      type: 'model',
      target: 'Notice: plumbing repairs are scheduled for Thursday. We apologize in advance for any noise during this work.',
      meaningItems: ['register_shift_lexis_pattern'], explainKey: 'c2ep27ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep27ComprehensionInstruction',
      target: 'Please be advised that plumbing repairs will take place on Thursday; we apologize for any inconvenience.',
      itemId: 'register_shift_lexis_pattern',
      options: [{ key: 'c2ep27CompOptCorrect', correct: true }, { key: 'c2ep27CompOptWrong1' }, { key: 'c2ep27CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep27NearMissInstruction',
      target: 'The pipes will be fixed Thursday, sorry for noise.',
      itemId: 'register_shift_lexis_pattern',
      options: [{ key: 'c2ep27NearMissOptCorrect', correct: true }, { key: 'c2ep27NearMissOptWrong1' }, { key: 'c2ep27NearMissOptWrong2' }],
      explainKey: 'c2ep27NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Rewrite the message above as a formal notice for building residents - independently, no model to copy this time.',
      instructionKey: 'c2ep27IndependentInstruction', evalKind: 'shift_register', canDoId: 'adapt_a_text_across_genre_and_register', subtype: 'genre_adaptation', sourceRef: true,
      itemIds: ['register_shift_lexis_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep27FinalInstruction', evalKind: 'shift_register', canDoId: 'adapt_a_text_across_genre_and_register', subtype: 'genre_adaptation', itemIds: ['register_shift_lexis_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep27CanDoName', titleKey: 'c2ep27CloseTitle', bodyKey: 'c2ep27CloseBody', ctaKey: 'c2ep25CloseCta' },
  ],
}

const INTEGRATED_04 = {
  id: 'c2_stylistic_control_integrated',
  arc: 'stylistic_control',
  level: 'C2',
  role: 'integrated',
  titleKey: 'c2ep28Title',
  goalKey: 'c2ep28Goal',
  canDoId: 'edit_own_text_for_precision_and_tone',
  canDoNameKey: 'c2ep28CanDoName',
  durationKey: 'c2ep28Duration',
  estimatedMinutes: 14,
  xp: 120,
  prerequisites: ['c2_stylistic_control_genre'],
  skillPrerequisites: ['edit_own_text_for_precision_and_tone', 'vary_expression_to_avoid_flattening_meaning', 'adapt_a_text_across_genre_and_register'],
  gardenItems: [],
  reuseSkills: ['edit_own_text_for_precision_and_tone', 'vary_expression_to_avoid_flattening_meaning', 'adapt_a_text_across_genre_and_register'],
  /*
   * Transfer draft: `stiff_apology_draft` — genuinely new, never used in
   * EP1-EP3, self-authored per content-plan.json's own transfer target for
   * this arc ("an unseen draft with an unfamiliar tone mismatch ... the
   * reverse direction of adjustment"): EP1 warmed casual language INTO a
   * formal notice; this draft is already overly stiff and needs warming
   * back down into something a real person would send. It also repeats
   * "regret" three times, so the same scene supplies transfer evidence for
   * both edit_own_text_for_precision_and_tone (step 2) and
   * vary_expression_to_avoid_flattening_meaning (step 3) without a second,
   * unrelated scene — the same source-reuse economy arc 1's own EP4 uses
   * for its co-located capabilities.
   *
   * adapt_a_text_across_genre_and_register is deliberately NOT revisited
   * here: its independent:1/transfer:0 evidence target is already fully
   * closed by EP3 alone (see that episode's own note).
   */
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'c2ep28SceneTitle', bodyKey: 'c2ep28SceneBody', showGoal: true, ctaKey: 'c2ep28Start',
      sourceTextEn: 'We regret to inform you that your request has been denied. We regret that the necessary documentation was insufficient. We regret any inconvenience this denial may cause. Please resubmit at your earliest convenience.' },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Here's a new draft - a stiff, cold rejection letter. Rewrite it so it still sounds professional, but genuinely warm rather than cold and repetitive.",
      instructionKey: 'c2ep28EditInstruction', evalKind: 'edit_for_precision', canDoId: 'edit_own_text_for_precision_and_tone', sourceRef: true,
      itemIds: ['lexical_precision_substitution_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Now look again at how many times the word 'regret' appears in the original. Rewrite the message so that repetition is replaced with precise, non-repeating alternatives.",
      instructionKey: 'c2ep28VarietyInstruction', evalKind: 'edit_for_precision', canDoId: 'vary_expression_to_avoid_flattening_meaning', subtype: 'lexical_variety', sourceRef: true,
      itemIds: ['lexical_precision_substitution_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', personalizationVariant: true, format: 'themed',
      promptEn: "Optional: here's a short, overly stiff message about {{learnerInterest}} instead - want to try warming up the tone on that one too?",
      instructionKey: 'c2ep28PersonalizationInstruction', evalKind: 'edit_for_precision', canDoId: 'edit_own_text_for_precision_and_tone',
      itemIds: ['lexical_precision_substitution_pattern'], evidenceType: 'guided',
      note: 'not counted toward independent/transfer evidence — an optional interest-flavored alternative, per c2.json arc.personalizationMode "light" and content-plan.json arc 7 personalization.interestFlavoredExample; the neutral fallback stays elevator_draft/repetitive_draft/pipes_draft/stiff_apology_draft above',
    },
    { type: 'recall', instructionKey: 'c2ep28FinalInstruction', evalKind: 'edit_for_precision', canDoId: 'edit_own_text_for_precision_and_tone', itemIds: ['lexical_precision_substitution_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep28CanDoName', titleKey: 'c2ep28CloseTitle', bodyKey: 'c2ep28CloseBody', ctaKey: 'c2ep25CloseCta' },
  ],
}

export const C2_ARC7_EPISODES = [EDIT_01, VARIETY_02, GENRE_03, INTEGRATED_04]
export const C2_ARC7_ID = 'stylistic_control'
export const getC2Arc7Episode = (id) => C2_ARC7_EPISODES.find((ep) => ep.id === id) || null
