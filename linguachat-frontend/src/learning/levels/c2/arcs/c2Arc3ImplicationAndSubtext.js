/*
 * C2 arc 3 — "Reading between the lines" (`implication_and_subtext`).
 *
 * Derived from docs/curriculum/blueprints/c2.json arc `implication_and_subtext`
 * and docs/curriculum/implementation/c2/content-plan.json's matching arc
 * entry (source texts, intent test cases, steps, vocabulary — all
 * transcribed from there, not invented here, except where explicitly noted
 * below). Third arc, prerequisiteArc: `dense_input_synthesis` (arc 1).
 * Introduces recognize_implied_meaning (required), recognize_irony_and_
 * understatement (required) and respond_appropriately_to_an_indirect_speech_
 * act (should).
 *
 * STRUCTURE. Four episodes, following arc 1's own established convention:
 * one teaching episode per new capability (assisted-open production, then
 * one unaided/independent production on a second same-difficulty exchange),
 * plus an arc-closing INTEGRATED episode on a genuinely new topic (a
 * neighbor's remarks about loud music, per content-plan.json's own
 * suggested transfer topic) that supplies each capability's transfer
 * instance. The should-scope capability (respond_appropriately_to_an_
 * indirect_speech_act) only needs evidence.independent:1/transfer:1 total,
 * so EP3 supplies one plain independent step and EP4 supplies the transfer
 * instance, rather than the two-step independent+transfer pairing the two
 * required capabilities each get.
 *
 * SOURCE-TEXT SHAPE. Unlike arc 1's dense-paragraph capabilities (which
 * declare `semanticNeeds: ['source_text']`), every capability in this arc
 * declares `semanticNeeds: ['stance_marker']` instead — c2Capabilities.js
 * never lists `source_text` for recognize_implied_meaning, recognize_irony_
 * and_understatement or respond_appropriately_to_an_indirect_speech_act.
 * This arc therefore follows arc 6's short-exchange convention
 * (`c2Arc6DiscourseFlexibility.js`), not arc 1's: a `scene` step carries a
 * `turnContext` array of `{ speaker, textEn }` lines (the exchange itself),
 * and the `free_reply` step that follows repeats the same `turnContext` so
 * the learner can see it while responding — no `sourceRef` field, since
 * there is no dense source text being graded against. This is structure,
 * not implementation — the actual grading logic is `LC-INT-001` work
 * (`docs/curriculum/implementation/c2/core-engine-handoff.md`).
 *
 * IRONY DISTRACTOR. c2.md's arc 3 risk note names a plausible literal
 * reading of an ironic/understated remark as this arc's highest false-
 * positive risk. EP2's `choice` near-miss step encodes exactly that: the
 * literal reading "The meeting was quick." is offered as the near-miss
 * target, not an invented unrelated distractor — matching `c2Intents.js`'s
 * `recognize_implication.subtypes[irony].nearMissNote` verbatim.
 *
 * PERSONALIZATION. c2.json marks this arc `personalizationMode: "light"`,
 * with `neutralFallback: "a neutral workplace or service exchange carrying
 * an indirect refusal"`. Per content-plan.json's own `personalization`
 * field, this is explicitly lighter than arc 1's "themed" treatment ("not
 * structurally required"): a single optional step carrying
 * `personalizationVariant: true` lives only in the arc-closing integrated
 * episode (EP4), not once per teaching episode — see
 * `docs/curriculum/implementation/c2/README.md` section on personalization.
 *
 * EVIDENCE ACCOUNTING (must match c2.json#/canDos[].evidence):
 *   recognize_implied_meaning (independent:2, transfer:1) — 1 independent
 *     in EP1 (step 7), 1 independent+transfer in EP4 (step 2).
 *   recognize_irony_and_understatement (independent:2, transfer:1) — 1
 *     independent in EP2 (step 8), 1 independent+transfer in EP4 (step 6).
 *   respond_appropriately_to_an_indirect_speech_act (independent:1,
 *     transfer:1) — 1 independent in EP3 (step 8), 1 independent+transfer
 *     in EP4 (step 3).
 * `scripts/foundry/c2/check-c2-evidence-paths.mjs` counts these
 * mechanically from `evidenceType`/`transfer` step fields.
 *
 * STEP TYPES. Only the nine types `EpisodeShell.jsx` already renders
 * (scene, model, comprehension, choice, word_order, fill_blank, free_reply,
 * recall, completion) — zero renderer work needed, only evaluator/dispatch
 * wiring (out of this task's scope; see `core-engine-handoff.md`).
 * `evalKind` values are C2 intent ids from `c2Intents.js`; `canDoId` is
 * added explicitly on every evaluated step; `subtype` is added on the
 * `free_reply` steps for the two subtype capabilities (irony,
 * indirect_speech_act), matching `c2Arc6DiscourseFlexibility.js`'s own
 * subtype-step precedent.
 *
 * All prose lives behind i18n keys (never populated by this task — see
 * `list-c2-i18n-keys.mjs`); every English target/prompt/exchange line is
 * literal, exactly as every earlier level does it. Key namespace: c2ep9
 * (EP1) - c2ep12 (EP4).
 */

const RECOGNIZE_01 = {
  id: 'c2_implication_and_subtext_recognize',
  arc: 'implication_and_subtext',
  level: 'C2',
  role: 'primary',
  titleKey: 'c2ep9Title',
  goalKey: 'c2ep9Goal',
  canDoId: 'recognize_implied_meaning',
  canDoNameKey: 'c2ep9CanDoName',
  durationKey: 'c2ep9Duration',
  estimatedMinutes: 12,
  xp: 100,
  prerequisites: [],
  skillPrerequisites: ['c1.infer_implied_meaning_in_unfamiliar_context', 'identify_authors_stance_and_bias'],
  gardenItems: ['irony_understatement_marker_pattern', 'implication', 'indirect', 'imply'],
  reuseSkills: ['identify_authors_stance_and_bias'],
  steps: [
    { type: 'scene', mood: 'focused', titleKey: 'c2ep9SceneTitle', bodyKey: 'c2ep9SceneBody', showGoal: true, ctaKey: 'c2ep9Start',
      turnContext: [
        { speaker: 'customer', textEn: 'Would you be able to fit me in for a haircut this afternoon?' },
        { speaker: 'stylist', textEn: "We're fully booked until Thursday, but I can check the cancellation list for you." },
      ] },
    {
      type: 'model',
      target: "The stylist is politely saying no for this afternoon - 'fully booked' is the actual refusal, and the cancellation-list offer is a genuine but separate alternative, not a promise.",
      meaningItems: ['irony_understatement_marker_pattern'], explainKey: 'c2ep9ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep9ComprehensionInstruction',
      target: "She's basically turning the customer down for today, just not saying 'no' directly - she offers the waitlist instead.",
      itemId: 'irony_understatement_marker_pattern',
      options: [{ key: 'c2ep9CompOptCorrect', correct: true }, { key: 'c2ep9CompOptWrong1' }, { key: 'c2ep9CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep9NearMissInstruction',
      target: "She said she's fully booked until Thursday.",
      itemId: 'irony_understatement_marker_pattern',
      options: [{ key: 'c2ep9NearMissOptCorrect', correct: true }, { key: 'c2ep9NearMissOptWrong1' }, { key: 'c2ep9NearMissOptWrong2' }],
      explainKey: 'c2ep9NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "What is the stylist actually telling the customer, and how do you know, given she never says 'no'?",
      instructionKey: 'c2ep9AssistedInstruction', evalKind: 'recognize_implication', canDoId: 'recognize_implied_meaning',
      turnContext: [
        { speaker: 'customer', textEn: 'Would you be able to fit me in for a haircut this afternoon?' },
        { speaker: 'stylist', textEn: "We're fully booked until Thursday, but I can check the cancellation list for you." },
      ],
      suggestionEn: "The stylist is politely saying no for this afternoon - 'fully booked' is the actual refusal, and the cancellation-list offer is a genuine but separate alternative, not a promise.",
      itemIds: ['irony_understatement_marker_pattern'], evidenceType: 'assistedOpen',
    },
    { type: 'scene', mood: 'focused', titleKey: 'c2ep9SecondSceneTitle', bodyKey: 'c2ep9SecondSceneBody', ctaKey: 'c2ep9SecondStart',
      turnContext: [
        { speaker: 'employee', textEn: 'Could you possibly review my draft before the end of the day?' },
        { speaker: 'manager', textEn: "I've got back-to-back meetings until six, but I'll try to glance at it if anything frees up." },
      ] },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Now try this one independently: what is the manager actually telling the employee, and how do you know?',
      instructionKey: 'c2ep9IndependentInstruction', evalKind: 'recognize_implication', canDoId: 'recognize_implied_meaning',
      turnContext: [
        { speaker: 'employee', textEn: 'Could you possibly review my draft before the end of the day?' },
        { speaker: 'manager', textEn: "I've got back-to-back meetings until six, but I'll try to glance at it if anything frees up." },
      ],
      itemIds: ['irony_understatement_marker_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep9FinalInstruction', evalKind: 'recognize_implication', canDoId: 'recognize_implied_meaning', itemIds: ['irony_understatement_marker_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep9CanDoName', titleKey: 'c2ep9CloseTitle', bodyKey: 'c2ep9CloseBody', ctaKey: 'c2ep9CloseCta' },
  ],
}

const IRONY_02 = {
  id: 'c2_implication_and_subtext_irony',
  arc: 'implication_and_subtext',
  level: 'C2',
  role: 'primary',
  titleKey: 'c2ep10Title',
  goalKey: 'c2ep10Goal',
  canDoId: 'recognize_irony_and_understatement',
  canDoNameKey: 'c2ep10CanDoName',
  durationKey: 'c2ep10Duration',
  estimatedMinutes: 12,
  xp: 100,
  prerequisites: ['c2_implication_and_subtext_recognize'],
  skillPrerequisites: ['recognize_implied_meaning'],
  gardenItems: ['irony_understatement_marker_pattern', 'irony', 'understatement'],
  reuseSkills: ['recognize_implied_meaning'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c2ep10RecallInstruction', evalKind: 'recognize_implication', canDoId: 'recognize_implied_meaning', itemIds: ['irony_understatement_marker_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep10SceneTitle', bodyKey: 'c2ep10SceneBody', ctaKey: 'c2ep10Start',
      turnContext: [{ speaker: 'colleague', textEn: 'Well, that was a quick meeting.' }] },
    {
      type: 'model',
      target: "Saying 'that was a quick meeting' after it ran three hours over is ironic - the speaker means the opposite: it dragged on far too long.",
      meaningItems: ['irony_understatement_marker_pattern'], explainKey: 'c2ep10ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep10ComprehensionInstruction',
      target: "They're being sarcastic - the meeting was actually really long, not quick at all.",
      itemId: 'irony_understatement_marker_pattern',
      options: [{ key: 'c2ep10CompOptCorrect', correct: true }, { key: 'c2ep10CompOptWrong1' }, { key: 'c2ep10CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep10NearMissInstruction',
      target: 'The meeting was quick.',
      itemId: 'irony_understatement_marker_pattern',
      options: [{ key: 'c2ep10NearMissOptCorrect', correct: true }, { key: 'c2ep10NearMissOptWrong1' }, { key: 'c2ep10NearMissOptWrong2' }],
      explainKey: 'c2ep10NearMissExplain',
      note: 'the literal-reading distractor required by c2.md arc 3\'s stated highest false-positive risk, per c2Intents.js recognize_implication.subtypes[irony].nearMissNote',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "What does the colleague actually mean by 'that was a quick meeting'? A literal reading - that it really was short - might seem plausible, but explain why it's wrong.",
      instructionKey: 'c2ep10AssistedInstruction', evalKind: 'recognize_implication', canDoId: 'recognize_irony_and_understatement', subtype: 'irony',
      turnContext: [{ speaker: 'colleague', textEn: 'Well, that was a quick meeting.' }],
      suggestionEn: "Saying 'that was a quick meeting' after it ran three hours over is ironic - the speaker means the opposite: it dragged on far too long.",
      itemIds: ['irony_understatement_marker_pattern'], evidenceType: 'assistedOpen',
    },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep10SecondSceneTitle', bodyKey: 'c2ep10SecondSceneBody', ctaKey: 'c2ep10SecondStart',
      turnContext: [{ speaker: 'colleague', textEn: 'Oh, this is going brilliantly.' }] },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Now try this one independently: what is the colleague actually saying with 'this is going brilliantly', and how do you know?",
      instructionKey: 'c2ep10IndependentInstruction', evalKind: 'recognize_implication', canDoId: 'recognize_irony_and_understatement', subtype: 'irony',
      turnContext: [{ speaker: 'colleague', textEn: 'Oh, this is going brilliantly.' }],
      itemIds: ['irony_understatement_marker_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep10FinalInstruction', evalKind: 'recognize_implication', canDoId: 'recognize_irony_and_understatement', itemIds: ['irony_understatement_marker_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep10CanDoName', titleKey: 'c2ep10CloseTitle', bodyKey: 'c2ep10CloseBody', ctaKey: 'c2ep9CloseCta' },
  ],
}

const INDIRECT_03 = {
  id: 'c2_implication_and_subtext_indirect',
  arc: 'implication_and_subtext',
  level: 'C2',
  role: 'primary',
  titleKey: 'c2ep11Title',
  goalKey: 'c2ep11Goal',
  canDoId: 'respond_appropriately_to_an_indirect_speech_act',
  canDoNameKey: 'c2ep11CanDoName',
  durationKey: 'c2ep11Duration',
  estimatedMinutes: 10,
  xp: 100,
  prerequisites: ['c2_implication_and_subtext_irony'],
  skillPrerequisites: ['recognize_implied_meaning'],
  gardenItems: ['irony_understatement_marker_pattern', 'hint'],
  reuseSkills: ['recognize_implied_meaning'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c2ep11RecallInstruction', evalKind: 'recognize_implication', canDoId: 'recognize_irony_and_understatement', itemIds: ['irony_understatement_marker_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep11SceneTitle', bodyKey: 'c2ep11SceneBody', ctaKey: 'c2ep11Start',
      turnContext: [{ speaker: 'colleague', textEn: "It's getting pretty loud in here." }] },
    {
      type: 'model',
      target: 'Sorry about that - let me close the door and turn the music down.',
      meaningItems: ['irony_understatement_marker_pattern'], explainKey: 'c2ep11ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep11ComprehensionInstruction',
      target: "Oh sorry, I'll quiet things down over here.",
      itemId: 'irony_understatement_marker_pattern',
      options: [{ key: 'c2ep11CompOptCorrect', correct: true }, { key: 'c2ep11CompOptWrong1' }, { key: 'c2ep11CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep11NearMissInstruction',
      target: 'Yes, it is quite loud today.',
      itemId: 'irony_understatement_marker_pattern',
      options: [{ key: 'c2ep11NearMissOptCorrect', correct: true }, { key: 'c2ep11NearMissOptWrong1' }, { key: 'c2ep11NearMissOptWrong2' }],
      explainKey: 'c2ep11NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Respond appropriately to your colleague's comment about the noise.",
      instructionKey: 'c2ep11AssistedInstruction', evalKind: 'recognize_implication', canDoId: 'respond_appropriately_to_an_indirect_speech_act', subtype: 'indirect_speech_act',
      turnContext: [{ speaker: 'colleague', textEn: "It's getting pretty loud in here." }],
      suggestionEn: 'Sorry about that - let me close the door and turn the music down.',
      itemIds: ['irony_understatement_marker_pattern'], evidenceType: 'assistedOpen',
    },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep11SecondSceneTitle', bodyKey: 'c2ep11SecondSceneBody', ctaKey: 'c2ep11SecondStart',
      turnContext: [{ speaker: 'colleague', textEn: 'The font on this slide is pretty small.' }] },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Now try this one independently: respond appropriately to your colleague's comment about the slide.",
      instructionKey: 'c2ep11IndependentInstruction', evalKind: 'recognize_implication', canDoId: 'respond_appropriately_to_an_indirect_speech_act', subtype: 'indirect_speech_act',
      turnContext: [{ speaker: 'colleague', textEn: 'The font on this slide is pretty small.' }],
      itemIds: ['irony_understatement_marker_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep11FinalInstruction', evalKind: 'recognize_implication', canDoId: 'respond_appropriately_to_an_indirect_speech_act', itemIds: ['irony_understatement_marker_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep11CanDoName', titleKey: 'c2ep11CloseTitle', bodyKey: 'c2ep11CloseBody', ctaKey: 'c2ep9CloseCta' },
  ],
}

const INTEGRATED_04 = {
  id: 'c2_implication_and_subtext_integrated',
  arc: 'implication_and_subtext',
  level: 'C2',
  role: 'integrated',
  titleKey: 'c2ep12Title',
  goalKey: 'c2ep12Goal',
  canDoId: 'recognize_implied_meaning',
  canDoNameKey: 'c2ep12CanDoName',
  durationKey: 'c2ep12Duration',
  estimatedMinutes: 14,
  xp: 120,
  prerequisites: ['c2_implication_and_subtext_indirect'],
  skillPrerequisites: ['recognize_implied_meaning', 'recognize_irony_and_understatement', 'respond_appropriately_to_an_indirect_speech_act'],
  gardenItems: [],
  reuseSkills: ['recognize_implied_meaning', 'recognize_irony_and_understatement', 'respond_appropriately_to_an_indirect_speech_act'],
  /*
   * Transfer topic: a neighbor's remarks after loud music — genuinely new,
   * never used in EP1-EP3 (content-plan.json's own suggested transfer
   * topic for this arc: "an unseen exchange carrying an unfamiliar
   * implicature (a neighbor saying 'I suppose the noise doesn't bother
   * everyone' after loud music)"). The neighbor's line does double duty by
   * construction: it is itself an indirect complaint (feeding
   * respond_appropriately_to_an_indirect_speech_act's transfer instance)
   * as well as the implicature recognize_implied_meaning's transfer
   * instance is built on. A second, self-authored ironic remark from the
   * same neighbor supplies recognize_irony_and_understatement's transfer
   * instance, since the noise scene itself is a plain implicature rather
   * than an ironic one.
   */
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'c2ep12SceneTitle', bodyKey: 'c2ep12SceneBody', showGoal: true, ctaKey: 'c2ep12Start',
      turnContext: [{ speaker: 'neighbor', textEn: "I suppose the noise doesn't bother everyone." }] },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "What is your neighbor actually implying by saying 'I suppose the noise doesn't bother everyone'?",
      instructionKey: 'c2ep12RecognizeInstruction', evalKind: 'recognize_implication', canDoId: 'recognize_implied_meaning',
      turnContext: [{ speaker: 'neighbor', textEn: "I suppose the noise doesn't bother everyone." }],
      itemIds: ['irony_understatement_marker_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Now respond appropriately to your neighbor's comment about the noise.",
      instructionKey: 'c2ep12IndirectInstruction', evalKind: 'recognize_implication', canDoId: 'respond_appropriately_to_an_indirect_speech_act', subtype: 'indirect_speech_act',
      turnContext: [{ speaker: 'neighbor', textEn: "I suppose the noise doesn't bother everyone." }],
      itemIds: ['irony_understatement_marker_pattern'], evidenceType: 'independent', transfer: true,
    },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep12SecondSceneTitle', bodyKey: 'c2ep12SecondSceneBody', ctaKey: 'c2ep12SecondStart',
      turnContext: [{ speaker: 'neighbor', textEn: 'Oh, of course - because everyone just loves a midnight concert.' }] },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "What is your neighbor actually communicating with 'because everyone just loves a midnight concert'?",
      instructionKey: 'c2ep12IronyInstruction', evalKind: 'recognize_implication', canDoId: 'recognize_irony_and_understatement', subtype: 'irony',
      turnContext: [{ speaker: 'neighbor', textEn: 'Oh, of course - because everyone just loves a midnight concert.' }],
      itemIds: ['irony_understatement_marker_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', personalizationVariant: true, format: 'light',
      promptEn: "Optional: here's a short indirect-refusal or irony exchange set in {{learnerInterest}} instead - want to try identifying the implication in that one too?",
      instructionKey: 'c2ep12PersonalizationInstruction', evalKind: 'recognize_implication', canDoId: 'recognize_implied_meaning',
      itemIds: ['irony_understatement_marker_pattern'], evidenceType: 'guided',
      note: 'not counted toward independent/transfer evidence — an optional interest-flavored alternative, per c2.json arc.personalizationMode "light" and content-plan.json arc 3 personalization.interestFlavoredExample; the neutral default it replaces is c2.json arc.neutralFallback, "a neutral workplace or service exchange carrying an indirect refusal" (EP1\'s salon exchange already fills that neutral role).',
    },
    { type: 'recall', instructionKey: 'c2ep12FinalInstruction', evalKind: 'recognize_implication', canDoId: 'recognize_implied_meaning', itemIds: ['irony_understatement_marker_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep12CanDoName', titleKey: 'c2ep12CloseTitle', bodyKey: 'c2ep12CloseBody', ctaKey: 'c2ep9CloseCta' },
  ],
}

export const C2_ARC3 = [RECOGNIZE_01, IRONY_02, INDIRECT_03, INTEGRATED_04]
export const C2_ARC3_ID = 'implication_and_subtext'
export const getC2Arc3Episode = (id) => C2_ARC3.find((ep) => ep.id === id) || null
