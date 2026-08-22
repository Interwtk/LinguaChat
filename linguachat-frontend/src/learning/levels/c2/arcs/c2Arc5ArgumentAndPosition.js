/*
 * C2 arc 5 — "Building and defending a nuanced position" (`argument_and_position`).
 *
 * Derived from docs/curriculum/blueprints/c2.json arc `argument_and_position`
 * and docs/curriculum/implementation/c2/content-plan.json's matching arc
 * entry (source texts, intent test cases, steps, vocabulary — all
 * transcribed from there, not invented here). Fifth arc, prerequisite arc:
 * `register_and_pragmatics`. Introduces develop_an_extended_qualified_argument,
 * preempt_and_rebut_a_counterargument (both required) and
 * qualify_a_position_with_precision (should).
 *
 * `qualify_a_position_with_precision` does not mint a new intent: per
 * `c2Capabilities.js`'s own `intentReuse: 'qualify_claim'` field, it reuses
 * the `qualify_claim` intent already introduced in arc 4
 * (register_and_pragmatics) for `soften_or_intensify_a_claim`, applied here
 * to a different capability id. This is plain intent reuse, not a subtype —
 * `c2Intents.js`'s `qualify_claim.reuseExamples.qualify_a_position_with_precision`
 * block is the exact content transcribed verbatim below, and no `subtype`
 * field is added anywhere in this file (subtypes live only in
 * `c2Intents.js`, at the intent-catalog level).
 *
 * STRUCTURE. Four episodes, following arc 1's own established convention
 * (`c2Arc1DenseInputSynthesis.js`'s header comment): one teaching episode
 * per new capability (assisted-open production, then one unaided/
 * independent production on a second same-difficulty scenario), plus an
 * arc-closing INTEGRATED episode on a genuinely new debate topic (office
 * parking: first-come-first-served or assigned, per content-plan.json's own
 * suggested transfer topic) that supplies each capability's transfer
 * instance.
 *
 * SOURCE-TEXT SHAPE. Every teaching/integrated step group follows arc 1's
 * convention: a `scene` step carries an extra `sourceTextEn` field — a
 * harmless extra key on an existing step type, not a new step type — and
 * the `free_reply` step that follows carries `sourceRef: true` so a future
 * evaluator grades it against the preceding debate prompt rather than a
 * canonical frame match. This is structure, not implementation — the actual
 * grading logic is `LC-INT-001` work
 * (`docs/curriculum/implementation/c2/core-engine-handoff.md`).
 *
 * EP1 and EP3 reuse the SAME library late-fees debate (`library_fees_prompt`,
 * content-plan.json's own source text for this arc) across their teaching
 * steps — the debate carries more than one objection/question over the
 * course of the arc, exactly as a real debate does. EP2's single scene
 * embeds BOTH the debate's original objection (the one c2Intents.js's
 * `rebut_counterargument` worked examples are written against, verbatim)
 * and the second objection content-plan.json names as this arc's own
 * independent-step counterargument ("But an honor system is unfair to
 * people who can afford fees and don't mind paying them.") — used here as
 * this episode's ASSISTED step, per this task's explicit episode-structure
 * instruction. EP2's and EP3's second (independent) scenarios, and EP4's
 * transfer scenario, are newly authored for this file at matching
 * difficulty, following arc 1's own convention of a self-authored second
 * example per teaching episode.
 *
 * PERSONALIZATION. c2.json marks this arc `personalizationMode: "themed"`,
 * `neutralFallback: "a neutral public-interest debate topic"`. Per
 * content-plan.json's own `personalization` field (one interchangeable
 * example, not a parallel arc), personalization here is a single optional
 * step in the first teaching episode (EP1) carrying
 * `personalizationVariant: true` — an interest-flavored alternative debate
 * topic, never evaluated differently or required for evidence. Same
 * deliberately lighter design as arc 1's own personalization (see that
 * file's header and `docs/curriculum/implementation/c2/README.md`'s
 * personalization section) —
 * `scripts/foundry/c2/check-c2-personalization-invariant.mjs` is the proof
 * this stays structurally inert (same evalKind/canDoId/evidenceType,
 * different surface text only, never itself evaluated toward evidence).
 *
 * EVIDENCE ACCOUNTING (must match c2.json#/canDos[].evidence):
 *   develop_an_extended_qualified_argument (independent:2, transfer:1) —
 *     1 independent in EP1 (step 7), 1 independent+transfer in EP4 (step 2).
 *   preempt_and_rebut_a_counterargument (independent:2, transfer:1) —
 *     1 independent in EP2 (step 8), 1 independent+transfer in EP4 (step 3).
 *   qualify_a_position_with_precision (independent:1, transfer:1) —
 *     1 independent in EP3 (step 8), 1 (independent+)transfer in EP4 (step 4).
 * `scripts/foundry/c2/check-c2-evidence-paths.mjs` counts these
 * mechanically from `evidenceType`/`transfer` step fields.
 *
 * STEP TYPES. Only the nine types `EpisodeShell.jsx` already renders
 * (scene, model, comprehension, choice, word_order, fill_blank, free_reply,
 * recall, completion) — zero renderer work needed, only evaluator/dispatch
 * wiring (out of this task's scope; see `core-engine-handoff.md`).
 * `evalKind` values are C2 intent ids from `c2Intents.js`; `canDoId` is
 * added explicitly on every evaluated step.
 *
 * All prose lives behind i18n keys (never populated by this task — see
 * `list-c2-i18n-keys.mjs`); every English target/prompt/source text is
 * literal, exactly as every earlier level does it. Key namespace: c2ep17
 * (EP1) - c2ep20 (EP4).
 */

const DEVELOP_01 = {
  id: 'c2_argument_and_position_develop',
  arc: 'argument_and_position',
  level: 'C2',
  role: 'primary',
  titleKey: 'c2ep17Title',
  goalKey: 'c2ep17Goal',
  canDoId: 'develop_an_extended_qualified_argument',
  canDoNameKey: 'c2ep17CanDoName',
  durationKey: 'c2ep17Duration',
  estimatedMinutes: 12,
  xp: 100,
  prerequisites: [],
  skillPrerequisites: ['c1.develop_a_structured_argument', 'soften_or_intensify_a_claim'],
  gardenItems: ['academic_hedging_pattern', 'boosting_pattern', 'on balance', 'that said', 'concede'],
  reuseSkills: ['soften_or_intensify_a_claim'],
  steps: [
    {
      type: 'recall', review: true, instructionKey: 'c2ep17GuidedReuseInstruction',
      evalKind: 'qualify_claim', canDoId: 'soften_or_intensify_a_claim',
      itemIds: ['academic_hedging_pattern', 'boosting_pattern'],
      note: "reinforcement (marker 'R') per c2.json arc argument_and_position's own reuseMap — an extended argument is built out of proportionately hedged/boosted claims, so this arc briefly reactivates arc 4's skill before extending it across a whole position",
    },
    { type: 'scene', mood: 'focused', titleKey: 'c2ep17SceneTitle', bodyKey: 'c2ep17SceneBody', showGoal: true, ctaKey: 'c2ep17Start',
      sourceTextEn: "Debate topic: should city libraries replace physical late fees with an honor system? Counterargument surfaced explicitly: 'But without fees, some people will just never return books.'" },
    {
      type: 'model',
      target: "On balance, an honor system seems worth trying: late fees mostly punish people who already struggle to return books on time, and the fine revenue is small compared to the goodwill lost. That said, libraries would need some replacement - even a gentle reminder system - or borrowed books might simply stop coming back.",
      meaningItems: ['academic_hedging_pattern', 'boosting_pattern'], explainKey: 'c2ep17ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep17ComprehensionInstruction',
      target: "I think dropping late fees for an honor system makes sense overall, since fees mostly just hurt people already having a hard time, though they'd still need reminders so books actually get returned.",
      itemId: 'academic_hedging_pattern',
      options: [{ key: 'c2ep17CompOptCorrect', correct: true }, { key: 'c2ep17CompOptWrong1' }, { key: 'c2ep17CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep17NearMissInstruction',
      target: 'Late fees are bad and should be removed.',
      itemId: 'academic_hedging_pattern',
      options: [{ key: 'c2ep17NearMissOptCorrect', correct: true }, { key: 'c2ep17NearMissOptWrong1' }, { key: 'c2ep17NearMissOptWrong2' }],
      explainKey: 'c2ep17NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Read the debate topic above. Build an extended, qualified argument for one side - state your position, support it, and acknowledge one limitation.",
      instructionKey: 'c2ep17AssistedInstruction', evalKind: 'develop_argument', canDoId: 'develop_an_extended_qualified_argument', sourceRef: true,
      suggestionEn: "On balance, an honor system seems worth trying: late fees mostly punish people who already struggle to return books on time, and the fine revenue is small compared to the goodwill lost. That said, libraries would need some replacement - even a gentle reminder system - or borrowed books might simply stop coming back.",
      itemIds: ['academic_hedging_pattern', 'boosting_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'scene', mood: 'focused', titleKey: 'c2ep17SecondSceneTitle', bodyKey: 'c2ep17SecondSceneBody', ctaKey: 'c2ep17SecondStart',
      sourceTextEn: "Debate topic: should the community pool replace its annual membership fee with pay-per-visit pricing? Some members worry occasional swimmers would end up paying more overall, while regulars fear losing the guaranteed lane time membership currently reserves for them." },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Now try this one independently: build an extended, qualified argument for one side of this debate.",
      instructionKey: 'c2ep17IndependentInstruction', evalKind: 'develop_argument', canDoId: 'develop_an_extended_qualified_argument', sourceRef: true,
      itemIds: ['academic_hedging_pattern', 'boosting_pattern'], evidenceType: 'independent',
    },
    {
      type: 'free_reply', speaker: 'lingua', personalizationVariant: true, format: 'themed',
      promptEn: "Optional: here's a themed debate topic about {{learnerInterest}} instead - want to try building a qualified argument on that one too?",
      instructionKey: 'c2ep17PersonalizationInstruction', evalKind: 'develop_argument', canDoId: 'develop_an_extended_qualified_argument',
      itemIds: ['academic_hedging_pattern', 'boosting_pattern'], evidenceType: 'guided',
      note: 'not counted toward independent/transfer evidence — an optional interest-flavored alternative, per c2.json arc.personalizationMode "themed" and content-plan.json arc 5 personalization.interestFlavoredExample',
    },
    { type: 'recall', instructionKey: 'c2ep17FinalInstruction', evalKind: 'develop_argument', canDoId: 'develop_an_extended_qualified_argument', itemIds: ['academic_hedging_pattern', 'boosting_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep17CanDoName', titleKey: 'c2ep17CloseTitle', bodyKey: 'c2ep17CloseBody', ctaKey: 'c2ep17CloseCta' },
  ],
}

const REBUT_02 = {
  id: 'c2_argument_and_position_rebut',
  arc: 'argument_and_position',
  level: 'C2',
  role: 'primary',
  titleKey: 'c2ep18Title',
  goalKey: 'c2ep18Goal',
  canDoId: 'preempt_and_rebut_a_counterargument',
  canDoNameKey: 'c2ep18CanDoName',
  durationKey: 'c2ep18Duration',
  estimatedMinutes: 12,
  xp: 100,
  prerequisites: ['c2_argument_and_position_develop'],
  skillPrerequisites: ['develop_an_extended_qualified_argument', 'c1.concede_a_counterpoint_gracefully'],
  gardenItems: ['concession_then_position_pattern', 'while X has merit', 'granted that', 'nevertheless', 'even so', 'rebut'],
  reuseSkills: ['develop_an_extended_qualified_argument'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c2ep18RecallInstruction', evalKind: 'develop_argument', canDoId: 'develop_an_extended_qualified_argument', itemIds: ['academic_hedging_pattern', 'boosting_pattern'] },
    { type: 'scene', mood: 'focused', titleKey: 'c2ep18SceneTitle', bodyKey: 'c2ep18SceneBody', ctaKey: 'c2ep18Start',
      sourceTextEn: "Debate topic: should city libraries replace physical late fees with an honor system? One objection: 'But without fees, some people will just never return books.' A second objection has since come up: 'But an honor system is unfair to people who can afford fees and don't mind paying them.'" },
    {
      type: 'model',
      target: "That's a fair concern, and it's probably true for a small number of borrowers - but most studies on this show the honor system mainly changes who pays a fee, not whether books come back, since most late returns are already accidental rather than deliberate.",
      meaningItems: ['concession_then_position_pattern'], explainKey: 'c2ep18ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep18ComprehensionInstruction',
      target: "That's true for a few people, sure, but most late returns happen by accident anyway, so removing the fee probably won't change return rates much.",
      itemId: 'concession_then_position_pattern',
      options: [{ key: 'c2ep18CompOptCorrect', correct: true }, { key: 'c2ep18CompOptWrong1' }, { key: 'c2ep18CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep18NearMissInstruction',
      target: "No, that's not true, people will still return books.",
      itemId: 'concession_then_position_pattern',
      options: [{ key: 'c2ep18NearMissOptCorrect', correct: true }, { key: 'c2ep18NearMissOptWrong1' }, { key: 'c2ep18NearMissOptWrong2' }],
      explainKey: 'c2ep18NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "The debate above raises a second objection too: 'But an honor system is unfair to people who can afford fees and don't mind paying them.' How would you rebut that one - concede what's fair about it first, then make your case?",
      instructionKey: 'c2ep18AssistedInstruction', evalKind: 'rebut_counterargument', canDoId: 'preempt_and_rebut_a_counterargument', sourceRef: true,
      suggestionEn: "That's fair, and it's true that some members could afford the fees without any trouble - but the point was never about who can pay, it's about not penalizing everyone else who returns books late for reasons that have nothing to do with money.",
      itemIds: ['concession_then_position_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'scene', mood: 'focused', titleKey: 'c2ep18SecondSceneTitle', bodyKey: 'c2ep18SecondSceneBody', ctaKey: 'c2ep18SecondStart',
      sourceTextEn: "Debate topic: should this university replace printed textbooks with a universal digital-only reading list? Objection raised: 'But digital-only reading is much harder to annotate, and it's harder on the eyes during long study sessions.'" },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Now try this one independently: how would you rebut this objection?",
      instructionKey: 'c2ep18IndependentInstruction', evalKind: 'rebut_counterargument', canDoId: 'preempt_and_rebut_a_counterargument', sourceRef: true,
      itemIds: ['concession_then_position_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep18FinalInstruction', evalKind: 'rebut_counterargument', canDoId: 'preempt_and_rebut_a_counterargument', itemIds: ['concession_then_position_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep18CanDoName', titleKey: 'c2ep18CloseTitle', bodyKey: 'c2ep18CloseBody', ctaKey: 'c2ep17CloseCta' },
  ],
}

const QUALIFY_03 = {
  id: 'c2_argument_and_position_qualify',
  arc: 'argument_and_position',
  level: 'C2',
  role: 'primary',
  titleKey: 'c2ep19Title',
  goalKey: 'c2ep19Goal',
  canDoId: 'qualify_a_position_with_precision',
  canDoNameKey: 'c2ep19CanDoName',
  durationKey: 'c2ep19Duration',
  estimatedMinutes: 10,
  xp: 100,
  prerequisites: ['c2_argument_and_position_rebut'],
  skillPrerequisites: ['develop_an_extended_qualified_argument', 'soften_or_intensify_a_claim'],
  gardenItems: ['academic_hedging_pattern', 'boosting_pattern', 'qualify'],
  reuseSkills: ['develop_an_extended_qualified_argument', 'soften_or_intensify_a_claim'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c2ep19RecallInstruction', evalKind: 'rebut_counterargument', canDoId: 'preempt_and_rebut_a_counterargument', itemIds: ['concession_then_position_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep19SceneTitle', bodyKey: 'c2ep19SceneBody', ctaKey: 'c2ep19Start',
      sourceTextEn: "Back to the library debate: if the honor system replaces late fees, one financial question remains unanswered - what happens to the fee revenue the library currently collects?" },
    {
      type: 'model',
      target: "The honor system would likely reduce fee revenue somewhat, though probably not eliminate it entirely, since some libraries still charge for lost or badly damaged items.",
      meaningItems: ['academic_hedging_pattern', 'boosting_pattern'], explainKey: 'c2ep19ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep19ComprehensionInstruction',
      target: "Fee income would probably drop a fair bit, but not necessarily to zero, since damaged or lost items might still cost something.",
      itemId: 'academic_hedging_pattern',
      options: [{ key: 'c2ep19CompOptCorrect', correct: true }, { key: 'c2ep19CompOptWrong1' }, { key: 'c2ep19CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep19NearMissInstruction',
      target: 'The honor system will definitely eliminate all fee revenue forever.',
      itemId: 'academic_hedging_pattern',
      options: [{ key: 'c2ep19NearMissOptCorrect', correct: true }, { key: 'c2ep19NearMissOptWrong1' }, { key: 'c2ep19NearMissOptWrong2' }],
      explainKey: 'c2ep19NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "How would you qualify a claim about the honor system's effect on fee revenue - precise, not overstated?",
      instructionKey: 'c2ep19AssistedInstruction', evalKind: 'qualify_claim', canDoId: 'qualify_a_position_with_precision', sourceRef: true,
      suggestionEn: "The honor system would likely reduce fee revenue somewhat, though probably not eliminate it entirely, since some libraries still charge for lost or badly damaged items.",
      itemIds: ['academic_hedging_pattern', 'boosting_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'scene', mood: 'thoughtful', titleKey: 'c2ep19SecondSceneTitle', bodyKey: 'c2ep19SecondSceneBody', ctaKey: 'c2ep19SecondStart',
      sourceTextEn: "A related question comes up in the same debate: would dropping the fees change how many staff hours are needed at the front desk?" },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Now try this one independently: qualify a claim about the staffing effect - precise, not overstated.",
      instructionKey: 'c2ep19IndependentInstruction', evalKind: 'qualify_claim', canDoId: 'qualify_a_position_with_precision', sourceRef: true,
      itemIds: ['academic_hedging_pattern', 'boosting_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep19FinalInstruction', evalKind: 'qualify_claim', canDoId: 'qualify_a_position_with_precision', itemIds: ['academic_hedging_pattern', 'boosting_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep19CanDoName', titleKey: 'c2ep19CloseTitle', bodyKey: 'c2ep19CloseBody', ctaKey: 'c2ep17CloseCta' },
  ],
}

const INTEGRATED_04 = {
  id: 'c2_argument_and_position_integrated',
  arc: 'argument_and_position',
  level: 'C2',
  role: 'integrated',
  titleKey: 'c2ep20Title',
  goalKey: 'c2ep20Goal',
  canDoId: 'develop_an_extended_qualified_argument',
  canDoNameKey: 'c2ep20CanDoName',
  durationKey: 'c2ep20Duration',
  estimatedMinutes: 15,
  xp: 125,
  prerequisites: ['c2_argument_and_position_qualify'],
  skillPrerequisites: ['develop_an_extended_qualified_argument', 'preempt_and_rebut_a_counterargument', 'qualify_a_position_with_precision'],
  gardenItems: [],
  reuseSkills: ['develop_an_extended_qualified_argument', 'preempt_and_rebut_a_counterargument', 'qualify_a_position_with_precision'],
  /*
   * Transfer topic: office parking, first-come-first-served or assigned —
   * genuinely new, never used in EP1-EP3 (content-plan.json's own suggested
   * transfer topic for this arc: "an unseen debate topic and an unseen
   * counterargument entirely (should office parking be first-come-first-
   * served or assigned?)"). This is what makes the three production turns
   * below TRANSFER, not repetition.
   */
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'c2ep20SceneTitle', bodyKey: 'c2ep20SceneBody', showGoal: true, ctaKey: 'c2ep20Start',
      sourceTextEn: "New debate topic: should office parking be first-come-first-served or assigned to specific employees? Objection raised: 'But first-come-first-served means whoever arrives earliest always wins, and that's not fair to people with early morning drop-offs or long commutes.'" },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Here's a new debate. Build an extended, qualified argument for one side.",
      instructionKey: 'c2ep20DevelopInstruction', evalKind: 'develop_argument', canDoId: 'develop_an_extended_qualified_argument', sourceRef: true,
      itemIds: ['academic_hedging_pattern', 'boosting_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Now rebut the objection above: 'But first-come-first-served means whoever arrives earliest always wins, and that's not fair to people with early morning drop-offs or long commutes.'",
      instructionKey: 'c2ep20RebutInstruction', evalKind: 'rebut_counterargument', canDoId: 'preempt_and_rebut_a_counterargument', sourceRef: true,
      itemIds: ['concession_then_position_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "One more question: how would assigning parking spots affect the number of empty spots on any given day? Qualify your claim precisely.",
      instructionKey: 'c2ep20QualifyInstruction', evalKind: 'qualify_claim', canDoId: 'qualify_a_position_with_precision', sourceRef: true,
      itemIds: ['academic_hedging_pattern', 'boosting_pattern'], evidenceType: 'independent', transfer: true,
    },
    { type: 'recall', instructionKey: 'c2ep20FinalInstruction', evalKind: 'rebut_counterargument', canDoId: 'preempt_and_rebut_a_counterargument', itemIds: ['concession_then_position_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep20CanDoName', titleKey: 'c2ep20CloseTitle', bodyKey: 'c2ep20CloseBody', ctaKey: 'c2ep17CloseCta' },
  ],
}

export const C2_ARC5 = [DEVELOP_01, REBUT_02, QUALIFY_03, INTEGRATED_04]
export const C2_ARC5_ID = 'argument_and_position'
export const getC2Arc5Episode = (id) => C2_ARC5.find((ep) => ep.id === id) || null
