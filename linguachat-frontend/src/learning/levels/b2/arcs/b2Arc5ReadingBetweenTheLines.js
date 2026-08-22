/*
 * B2 arc 5 — "Reading between the lines" (`reading_between_the_lines`).
 *
 * Derived from docs/curriculum/blueprints/b2.json arc `reading_between_the_lines`
 * and b2.md section 4 (arc 5) / section 11 (the `adjust_register_to_context`
 * worked example, "gimme a sec" landlord case). Prerequisite: `making_the_case`
 * only (register needs an opinion to modulate, not the mediation arc) —
 * b2.json's `prerequisiteArcs` for this arc is `['making_the_case']`, so
 * REGISTER_17 below chains off `b2_making_the_case_integrated`, not off any
 * arc 2-4 episode.
 *
 * STRUCTURE. Same four-episode shape as arc 1 (b2Arc1MakingTheCase.js): one
 * teaching episode per new capability, then one arc-closing INTEGRATED
 * episode that reuses everything inside a single longer exchange and carries
 * each required capability's second independent-production instance plus its
 * transfer instance.
 *
 * THIS ARC'S TWO DEPARTURES FROM ARC 1'S SHAPE (both required by
 * b2.json/b2.md, not invented here):
 *
 * 1. Zero personalization. b2.json's `personalizationMode` for this arc is
 *    explicit: "none — register is about the relationship between speakers
 *    and the situation's formality, not about topic; forcing a personal
 *    interest into it would not change the skill and risks trivializing it."
 *    Every scenario below is a plain, neutral real-life situation (a
 *    landlord, a flatmate, a colleague, a professor's office, a friend) —
 *    no hobby/interest theming anywhere in this arc.
 *
 * 2. Paired scenes for register contrast. b2.md's own miniStory note: "The
 *    same problem told to a landlord and to a flatmate is best shown as two
 *    parallel short scenes, so the register contrast is directly
 *    comparable." REGISTER_17 opens with exactly that: the same broken-heater
 *    problem as two back-to-back `scene` steps (one addressed formally to a
 *    landlord, one addressed informally to a flatmate — b2.md's own neutral
 *    fallback context for this arc), then `choice` steps asking the learner
 *    to match each version to its correct addressee, then `free_reply`
 *    production. Register-sensitive `free_reply` steps carry two extra,
 *    harmless fields (not new step types) — `registerCheck: true` and
 *    `expectedRegister: 'formal' | 'informal'` — for the evaluator/UI wiring
 *    this task does not do.
 *
 * THE "CORRECT MEANING, WRONG REGISTER" FAILURE MODE. Per b2.md section 11
 * and `b2Intents.js`'s `shift_register.examples.formInsufficient`, a
 * semantically fine but register-inappropriate reply is its own distinct
 * failure mode, not folded into "wrong." REGISTER_17 has two `choice` steps
 * built around exactly this: one using the blueprint's own worked example
 * verbatim ("gimme a sec, I'll check the contract" to a landlord), and one
 * original, comparable pair authored here ("yeah, no worries, I'll get it
 * sorted for ya!" to a senior manager).
 *
 * EVIDENCE ACCOUNTING (must match b2.json#/canDos[].evidence):
 *   adjust_register_to_context (required, independent:2, transfer:1) —
 *     1 independent (informal_shift) in EP17; 1 independent + 1 transfer
 *     (formal_shift, new "running late" scenario) in EP20.
 *   soften_or_strengthen_a_statement (required, independent:2, transfer:1) —
 *     1 independent (intensify direction) in EP18; 1 independent + 1
 *     transfer (soften direction, new "running late" scenario) in EP20.
 *   infer_implied_meaning (should, independent:1, transfer:0,
 *     evaluation: comprehension_only — no production intent, per
 *     `B2_COMPREHENSION_ONLY_CAN_DOS` in b2Intents.js) — 1 independent
 *     `choice` step (no `evalKind`) in EP19; EP20 reinforces it with a plain
 *     recognition `choice` step that carries no `evidenceType`, matching its
 *     lighter (transfer:0) target exactly.
 *   develop_and_defend_opinion (already fully evidenced by arc 1 —
 *     independent:2, transfer:1 met there) — reused in EP20 as a `guided`
 *     reinforcement turn only; this arc adds no further required evidence
 *     for it, matching b2.json's own reuse note ("softened/strengthened
 *     opinions").
 *
 * STEP TYPES. Only the nine `EpisodeShell.jsx` renders (scene, model,
 * comprehension, choice, word_order, fill_blank, free_reply, recall,
 * completion). `recall` shares free_reply's open-production UI, so it is
 * never used for `infer_implied_meaning` (receptive-only, no production
 * intent) — EP19 is built entirely from `scene`/`model`/`comprehension`/
 * `choice` steps.
 *
 * All prose lives behind i18n keys (never populated by this task); every
 * English target/prompt/suggestion is literal, exactly as every earlier
 * level does it. i18n key namespace for this file: `b2ep17`-`b2ep20`
 * (`b2ep1`-`b2ep16` already belong to arcs 1-4).
 */

const REGISTER_17 = {
  id: 'b2_reading_between_the_lines_register',
  arc: 'reading_between_the_lines',
  level: 'B2',
  role: 'primary',
  titleKey: 'b2ep17Title',
  goalKey: 'b2ep17Goal',
  canDoId: 'adjust_register_to_context',
  canDoNameKey: 'b2ep17CanDoName',
  durationKey: 'b2ep17Duration',
  estimatedMinutes: 11,
  xp: 95,
  prerequisites: ['b2_making_the_case_integrated'],
  skillPrerequisites: ['b1.sustain_topic_change'],
  gardenItems: [
    'register_marker_pattern', 'if_you_dont_mind_me_asking', 'would_you_mind', 'with_all_due_respect', 'just_between_us',
    'tactless', 'blunt', 'diplomatic_adj', 'to_beat_around_the_bush', 'to_get_straight_to_the_point',
  ],
  reuseSkills: ['b1.sustain_topic_change'],
  /*
   * Neutral fallback context, verbatim from b2.md section 4: "a message to a
   * landlord versus a message to a flatmate about the same broken
   * appliance."
   */
  steps: [
    { type: 'scene', mood: 'thinking', titleKey: 'b2ep17SceneTitle', bodyKey: 'b2ep17SceneBody', showGoal: true, ctaKey: 'b2ep17Start' },
    {
      type: 'scene', mood: 'calm', titleKey: 'b2ep17FormalSceneTitle', bodyKey: 'b2ep17FormalSceneBody',
      target: "With all due respect, it's been over a week now — could you possibly send someone to take a look at the heater this week?",
      register: 'formal', itemId: 'register_marker_pattern', ctaKey: 'b2ep17FormalContinue',
    },
    {
      type: 'scene', mood: 'supportive', titleKey: 'b2ep17InformalSceneTitle', bodyKey: 'b2ep17InformalSceneBody',
      target: "Hey, heads up — the heater's broken again. Can you take a look, or should I just call someone?",
      register: 'informal', itemId: 'register_marker_pattern', ctaKey: 'b2ep17InformalContinue',
    },
    {
      type: 'choice', instructionKey: 'b2ep17MatchFormalInstruction',
      target: "With all due respect, it's been over a week now — could you possibly send someone to take a look at the heater this week?",
      itemId: 'register_marker_pattern',
      options: [{ key: 'b2ep17MatchFormalOptLandlord', correct: true }, { key: 'b2ep17MatchFormalOptFlatmate' }, { key: 'b2ep17MatchFormalOptStranger' }],
      explainKey: 'b2ep17MatchFormalExplain',
    },
    {
      type: 'choice', instructionKey: 'b2ep17MatchInformalInstruction',
      target: "Hey, heads up — the heater's broken again. Can you take a look, or should I just call someone?",
      itemId: 'register_marker_pattern',
      options: [{ key: 'b2ep17MatchInformalOptFlatmate', correct: true }, { key: 'b2ep17MatchInformalOptLandlord' }, { key: 'b2ep17MatchInformalOptStranger' }],
      explainKey: 'b2ep17MatchInformalExplain',
    },
    {
      type: 'model', target: 'Could you possibly let me know when the report will be ready?',
      meaningItems: ['register_marker_pattern', 'would_you_mind'], explainKey: 'b2ep17ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'b2ep17ComprehensionInstruction',
      target: "Can you let me know when the report's ready?",
      itemId: 'register_marker_pattern',
      options: [{ key: 'b2ep17CompOptCorrect', correct: true }, { key: 'b2ep17CompOptWrong1' }, { key: 'b2ep17CompOptWrong2' }],
    },
    /*
     * Failure mode A — the blueprint's own worked example, verbatim
     * (b2.md section 11 / b2Intents.js shift_register.examples.formInsufficient):
     * semantically fine, register-inappropriate, gradable as its own failure
     * mode rather than folded into "wrong."
     */
    {
      type: 'choice', instructionKey: 'b2ep17FailureAInstruction',
      target: "Gimme a sec, I'll check the contract.",
      itemId: 'register_marker_pattern',
      options: [{ key: 'b2ep17FailureAOptCorrect', correct: true }, { key: 'b2ep17FailureAOptWrong1' }, { key: 'b2ep17FailureAOptWrong2' }],
      explainKey: 'b2ep17FailureAExplain',
    },
    /*
     * Failure mode B — an original, comparable pair: correct meaning,
     * register-inappropriate for the addressee (a senior manager rather
     * than a landlord), same failure category as A.
     */
    {
      type: 'choice', instructionKey: 'b2ep17FailureBInstruction',
      target: "Yeah, no worries, I'll get it sorted for ya!",
      itemId: 'register_marker_pattern',
      options: [{ key: 'b2ep17FailureBOptCorrect', correct: true }, { key: 'b2ep17FailureBOptWrong1' }, { key: 'b2ep17FailureBOptWrong2' }],
      explainKey: 'b2ep17FailureBExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua',
      promptEn: "Your landlord still hasn't fixed the heater after a week. Ask them again — formally, in writing.",
      instructionKey: 'b2ep17AssistedInstruction', evalKind: 'shift_register', canDoId: 'adjust_register_to_context',
      subtype: 'formal_shift', registerCheck: true, expectedRegister: 'formal',
      suggestionEn: "If you don't mind me asking, would you mind letting me know when someone could come by? It's been over a week now.",
      itemIds: ['register_marker_pattern', 'would_you_mind'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua',
      promptEn: "Your flatmate keeps leaving dirty dishes in the sink. Ask them to sort it out — the way you'd actually say it to a flatmate.",
      instructionKey: 'b2ep17IndependentInstruction', evalKind: 'shift_register', canDoId: 'adjust_register_to_context',
      subtype: 'informal_shift', registerCheck: true, expectedRegister: 'informal',
      itemIds: ['register_marker_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'b2ep17FinalInstruction', evalKind: 'shift_register', canDoId: 'adjust_register_to_context', itemIds: ['register_marker_pattern'] },
    { type: 'completion', canDoNameKey: 'b2ep17CanDoName', titleKey: 'b2ep17CloseTitle', bodyKey: 'b2ep17CloseBody', ctaKey: 'b2ep17CloseCta' },
  ],
}

const SOFTEN_18 = {
  id: 'b2_reading_between_the_lines_soften',
  arc: 'reading_between_the_lines',
  level: 'B2',
  role: 'primary',
  titleKey: 'b2ep18Title',
  goalKey: 'b2ep18Goal',
  canDoId: 'soften_or_strengthen_a_statement',
  canDoNameKey: 'b2ep18CanDoName',
  durationKey: 'b2ep18Duration',
  estimatedMinutes: 11,
  xp: 95,
  prerequisites: ['b2_reading_between_the_lines_register'],
  skillPrerequisites: ['adjust_register_to_context', 'develop_and_defend_opinion'],
  gardenItems: [
    'hedging_pattern', 'intensifying_pattern', 'i_hope_you_dont_mind_me_saying', 'no_offense_but',
    'for_what_its_worth', 'strictly_speaking', 'if_im_honest', 'an_understatement', 'an_overstatement',
  ],
  reuseSkills: ['adjust_register_to_context', 'develop_and_defend_opinion'],
  /*
   * Neutral scenario: a colleague's project timeline. Both directions are
   * taught — softening a concern, then strengthening a recommendation — not
   * just softening.
   */
  steps: [
    { type: 'scene', mood: 'thinking', titleKey: 'b2ep18SceneTitle', bodyKey: 'b2ep18SceneBody', showGoal: true, ctaKey: 'b2ep18Start' },
    {
      type: 'scene', mood: 'calm', titleKey: 'b2ep18SoftenSceneTitle', bodyKey: 'b2ep18SoftenSceneBody',
      target: "I hope you don't mind me saying, but it's sort of a problem, to be honest — I'd say it needs looking at soon.",
      intent: 'soften', itemId: 'hedging_pattern', ctaKey: 'b2ep18SoftenContinue',
    },
    {
      type: 'scene', mood: 'cheering', titleKey: 'b2ep18IntensifySceneTitle', bodyKey: 'b2ep18IntensifySceneBody',
      target: "I'm absolutely convinced this needs fixing today, without a doubt.",
      intent: 'intensify', itemId: 'intensifying_pattern', ctaKey: 'b2ep18IntensifyContinue',
    },
    {
      type: 'choice', instructionKey: 'b2ep18MatchSoftenInstruction',
      target: "I hope you don't mind me saying, but it's sort of a problem, to be honest — I'd say it needs looking at soon.",
      itemId: 'hedging_pattern',
      options: [{ key: 'b2ep18MatchSoftenOptCorrect', correct: true }, { key: 'b2ep18MatchSoftenOptWrong1' }, { key: 'b2ep18MatchSoftenOptWrong2' }],
      explainKey: 'b2ep18MatchSoftenExplain',
    },
    {
      type: 'choice', instructionKey: 'b2ep18MatchIntensifyInstruction',
      target: "I'm absolutely convinced this needs fixing today, without a doubt.",
      itemId: 'intensifying_pattern',
      options: [{ key: 'b2ep18MatchIntensifyOptCorrect', correct: true }, { key: 'b2ep18MatchIntensifyOptWrong1' }, { key: 'b2ep18MatchIntensifyOptWrong2' }],
      explainKey: 'b2ep18MatchIntensifyExplain',
    },
    {
      type: 'model', target: 'It tends to be an issue around this time of year, more or less.',
      meaningItems: ['hedging_pattern'], explainKey: 'b2ep18ModelExplain',
    },
    {
      type: 'fill_blank', instructionKey: 'b2ep18FillInstruction', hintKey: 'b2ep18FillHint', itemId: 'hedging_pattern',
      before: "It's", after: "a problem, to be honest — I'd say it needs looking at soon.",
      expects: 'sort of', alternatives: ['kind of'],
    },
    {
      type: 'comprehension', instructionKey: 'b2ep18ComprehensionInstruction', target: "It's a problem.",
      itemId: 'hedging_pattern',
      options: [{ key: 'b2ep18CompOptCorrect', correct: true }, { key: 'b2ep18CompOptWrong1' }, { key: 'b2ep18CompOptWrong2' }],
    },
    /*
     * Wrong-meaning failure mode from b2Intents.js soften_or_intensify_claim:
     * "a hedge applied so that the claim reverses its intended force (a
     * strong claim reads as denial)."
     */
    {
      type: 'choice', instructionKey: 'b2ep18WrongMeaningInstruction',
      target: "No offense, but it's sort of not really a problem, if I'm honest.",
      itemId: 'hedging_pattern',
      options: [{ key: 'b2ep18WrongMeaningOptCorrect', correct: true }, { key: 'b2ep18WrongMeaningOptWrong1' }, { key: 'b2ep18WrongMeaningOptWrong2' }],
      explainKey: 'b2ep18WrongMeaningExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua',
      promptEn: "You think the new project timeline is too tight, but you don't want to sound alarmist in front of the team. What do you say?",
      instructionKey: 'b2ep18AssistedInstruction', evalKind: 'soften_or_intensify_claim', canDoId: 'soften_or_strengthen_a_statement',
      suggestionEn: "If I'm honest, the timeline's sort of tight — I'd say we should keep an eye on it.",
      itemIds: ['hedging_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua',
      promptEn: "You're completely sure the team should switch vendors after this last delay. Convince them.",
      instructionKey: 'b2ep18IndependentInstruction', evalKind: 'soften_or_intensify_claim', canDoId: 'soften_or_strengthen_a_statement',
      itemIds: ['intensifying_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'b2ep18FinalInstruction', evalKind: 'soften_or_intensify_claim', canDoId: 'soften_or_strengthen_a_statement', itemIds: ['hedging_pattern'] },
    { type: 'completion', canDoNameKey: 'b2ep18CanDoName', titleKey: 'b2ep18CloseTitle', bodyKey: 'b2ep18CloseBody', ctaKey: 'b2ep17CloseCta' },
  ],
}

const INFER_19 = {
  id: 'b2_reading_between_the_lines_infer',
  arc: 'reading_between_the_lines',
  level: 'B2',
  role: 'secondary',
  titleKey: 'b2ep19Title',
  goalKey: 'b2ep19Goal',
  canDoId: 'infer_implied_meaning',
  canDoNameKey: 'b2ep19CanDoName',
  durationKey: 'b2ep19Duration',
  estimatedMinutes: 8,
  xp: 75,
  prerequisites: ['b2_reading_between_the_lines_soften'],
  skillPrerequisites: ['adjust_register_to_context'],
  gardenItems: [
    'a_hint', 'an_undertone', 'a_backhanded_compliment', 'to_read_between_the_lines',
    'condescending', 'a_euphemism', 'loaded_language', 'passive_aggressive',
  ],
  reuseSkills: ['adjust_register_to_context'],
  /*
   * Receptive-only per B2_COMPREHENSION_ONLY_CAN_DOS in b2Intents.js — no
   * `evalKind`, no free_reply/recall anywhere in this episode. Built entirely
   * from scene/model/comprehension/choice, the same convention A1 uses for
   * receptive-only items.
   */
  steps: [
    { type: 'scene', mood: 'thinking', titleKey: 'b2ep19SceneTitle', bodyKey: 'b2ep19SceneBody', showGoal: true, ctaKey: 'b2ep19Start' },
    {
      type: 'model', target: "That's... an interesting choice of colour for the cover.",
      meaningItems: ['a_backhanded_compliment', 'an_undertone'], explainKey: 'b2ep19ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'b2ep19ComprehensionInstruction', target: "We've decided to let Sam go.",
      itemId: 'a_euphemism',
      options: [{ key: 'b2ep19CompOptCorrect', correct: true }, { key: 'b2ep19CompOptWrong1' }, { key: 'b2ep19CompOptWrong2' }],
    },
    /*
     * The one required independent evidence step for infer_implied_meaning —
     * comprehension_only, so `canDoId` + `evidenceType` are set with no
     * `evalKind` at all.
     */
    {
      type: 'choice', instructionKey: 'b2ep19IndependentInstruction',
      target: "Oh, don't worry about replying to my email — whenever you get a chance. No rush at all.",
      itemId: 'passive_aggressive', canDoId: 'infer_implied_meaning', evidenceType: 'independent',
      options: [{ key: 'b2ep19IndependentOptCorrect', correct: true }, { key: 'b2ep19IndependentOptWrong1' }, { key: 'b2ep19IndependentOptWrong2' }],
      explainKey: 'b2ep19IndependentExplain',
    },
    {
      type: 'choice', instructionKey: 'b2ep19UnderstatementInstruction', target: "It's just a small scratch.",
      itemId: 'an_understatement',
      options: [{ key: 'b2ep19UnderstatementOptCorrect', correct: true }, { key: 'b2ep19UnderstatementOptWrong1' }, { key: 'b2ep19UnderstatementOptWrong2' }],
      explainKey: 'b2ep19UnderstatementExplain',
    },
    {
      type: 'choice', instructionKey: 'b2ep19CondescendingInstruction', target: "Wow, that's... a really brave outfit choice.",
      itemId: 'condescending',
      options: [{ key: 'b2ep19CondescendingOptCorrect', correct: true }, { key: 'b2ep19CondescendingOptWrong1' }, { key: 'b2ep19CondescendingOptWrong2' }],
      explainKey: 'b2ep19CondescendingExplain',
    },
    { type: 'completion', canDoNameKey: 'b2ep19CanDoName', titleKey: 'b2ep19CloseTitle', bodyKey: 'b2ep19CloseBody', ctaKey: 'b2ep17CloseCta' },
  ],
}

const INTEGRATED_20 = {
  id: 'b2_reading_between_the_lines_integrated',
  arc: 'reading_between_the_lines',
  level: 'B2',
  role: 'integrated',
  titleKey: 'b2ep20Title',
  goalKey: 'b2ep20Goal',
  canDoId: 'adjust_register_to_context',
  canDoNameKey: 'b2ep20CanDoName',
  durationKey: 'b2ep20Duration',
  estimatedMinutes: 12,
  xp: 110,
  prerequisites: ['b2_reading_between_the_lines_infer'],
  skillPrerequisites: ['adjust_register_to_context', 'soften_or_strengthen_a_statement', 'infer_implied_meaning', 'develop_and_defend_opinion'],
  gardenItems: [],
  reuseSkills: ['adjust_register_to_context', 'soften_or_strengthen_a_statement', 'infer_implied_meaning', 'develop_and_defend_opinion'],
  /*
   * Transfer topic: running late for two very different appointments in the
   * same day — genuinely new, never used in EP17-EP19 (b2.json's transfer
   * target: "a register shift not used during teaching" /
   * "softening/strengthening a claim not used during teaching"), while
   * staying strictly neutral throughout (no interest personalization, per
   * this arc's explicit exclusion).
   */
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'b2ep20SceneTitle', bodyKey: 'b2ep20SceneBody', showGoal: true, ctaKey: 'b2ep20Start' },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua',
      promptEn: "Hi, this is Dr. Alvarez's office calling — she's asking whether you'll still make the 2 o'clock meeting today.",
      instructionKey: 'b2ep20FormalInstruction', evalKind: 'shift_register', canDoId: 'adjust_register_to_context',
      subtype: 'formal_shift', registerCheck: true, expectedRegister: 'formal',
      itemIds: ['register_marker_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua',
      promptEn: "Meanwhile your friend Jordan texts: 'yo you still coming for coffee or nah'",
      instructionKey: 'b2ep20InformalInstruction', evalKind: 'shift_register', canDoId: 'adjust_register_to_context',
      subtype: 'informal_shift', registerCheck: true, expectedRegister: 'informal',
      itemIds: ['register_marker_pattern'], evidenceType: 'guided',
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua',
      promptEn: "Your colleague asks why you're running behind — you think the new train timetable might be part of the reason, but you're not fully sure yet. What do you say?",
      instructionKey: 'b2ep20SoftenInstruction', evalKind: 'soften_or_intensify_claim', canDoId: 'soften_or_strengthen_a_statement',
      itemIds: ['hedging_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua',
      promptEn: "Now, after checking twice, you're completely sure the new timetable is the problem. Tell your manager.",
      instructionKey: 'b2ep20IntensifyInstruction', evalKind: 'soften_or_intensify_claim', canDoId: 'soften_or_strengthen_a_statement',
      itemIds: ['intensifying_pattern'], evidenceType: 'guided',
    },
    {
      type: 'choice', instructionKey: 'b2ep20InferInstruction',
      target: "Oh, take your time getting here — I'm sure Dr. Alvarez has nothing better to do than wait around.",
      itemId: 'passive_aggressive',
      options: [{ key: 'b2ep20InferOptCorrect', correct: true }, { key: 'b2ep20InferOptWrong1' }, { key: 'b2ep20InferOptWrong2' }],
      explainKey: 'b2ep20InferExplain',
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua',
      promptEn: "Looking back at today — was switching to the new train timetable actually a good idea, despite all this?",
      instructionKey: 'b2ep20OpinionInstruction', evalKind: 'argue_opinion_with_reason', canDoId: 'develop_and_defend_opinion',
      suggestionEn: "On balance, I'd say it was a good idea — it's sort of a rough first week, but I'm convinced it'll save time once everyone adjusts.",
      itemIds: ['opinion_stance_pattern'], evidenceType: 'guided',
    },
    { type: 'recall', instructionKey: 'b2ep20FinalInstruction', evalKind: 'shift_register', canDoId: 'adjust_register_to_context', itemIds: ['register_marker_pattern'] },
    { type: 'completion', canDoNameKey: 'b2ep20CanDoName', titleKey: 'b2ep20CloseTitle', bodyKey: 'b2ep20CloseBody', ctaKey: 'b2ep17CloseCta' },
  ],
}

export const B2_ARC5 = [REGISTER_17, SOFTEN_18, INFER_19, INTEGRATED_20]
export const B2_ARC5_ID = 'reading_between_the_lines'
export const getB2Arc5Episode = (id) => B2_ARC5.find((ep) => ep.id === id) || null
