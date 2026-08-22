/*
 * B2 arc 3 — "What if" (`what_if`).
 *
 * Derived from docs/curriculum/blueprints/b2.json arc `what_if` and b2.md
 * section 4. `prerequisiteArcs: []` — independent of arcs 1-2, only needs B1
 * exit (`b1.talk_about_plans_and_intentions`, `b1.narrate_connected_event`,
 * referenced as skillPrerequisites/reuseSkills id strings only — no B1
 * content is built here). Introduces hypothesize_about_unreal_situations,
 * speculate_about_cause_and_effect (both required) and
 * express_regret_about_a_past_decision (should).
 *
 * STRUCTURE. Same four-episode shape as arc 1/arc 2 (see
 * b2Arc1MakingTheCase.js's own header): one teaching episode per new
 * capability (assisted-open production, then one unaided production) plus
 * one arc-closing integrated episode that reuses everything the arc taught
 * in a single longer roleplay exchange, on a genuinely new hypothetical/
 * mystery scenario. This is the level's densest arc — six new pattern
 * groups behind three capabilities (b2.json arc.risk: "the level's densest
 * arc") — so EP9 gives each of the three conditional patterns its own
 * model/comprehension step before any production is asked for, per the
 * blueprint's autonomyTarget ("heaviest support of any arc given six new
 * pattern groups; fades only after each conditional form is independently
 * produced once").
 *
 * `mini_story` was considered (b2.json miniStory.use: true, "an everyday
 * mystery... gives speculation a genuine reason to happen") but is NOT used
 * here: every existing `mini_story` step is keyed to a `storyObjective` the
 * engine already recognizes (`engine/miniStory.js`), and registering a new
 * objective for this arc's mystery is out of this task's write scope (no
 * file outside the two deliverables may be touched). EP10's mystery is
 * instead carried by plain `scene` + `model`/`comprehension` steps narrating
 * the missing-package situation directly, which reaches the same
 * "speculation has a genuine reason to happen" effect without inventing an
 * unregistered engine shape.
 *
 * SCENARIOS. EP9 (hypothesize) follows a friend, Maya, deciding whether to
 * quit a stable job to travel for a year — advising a friend on a
 * hypothetical decision, per b2.json's communicative situation. EP10
 * (speculate) is an everyday mystery: a package marked "delivered" that
 * isn't on the porch. EP11 (regret) looks back on Jae's decision to open a
 * shop on a loan without much research. The closer (EP12) transfers to a
 * genuinely new scenario not used in teaching — an old friend, Priya, who
 * moved abroad six months ago and has gone quiet, combining a fresh
 * hypothesis (imagining yourself in her position) with a fresh mystery
 * (why she's gone quiet) and a guided reuse of regret (forgetting to save
 * her new address).
 *
 * EVIDENCE ACCOUNTING (must match b2.json#/canDos[].evidence):
 *   hypothesize_about_unreal_situations (required, independent:2, transfer:1) —
 *     1 independent in EP9; 1 independent + 1 transfer (same step) in EP12.
 *   speculate_about_cause_and_effect (required, independent:2, transfer:1) —
 *     1 independent in EP10; 1 independent + 1 transfer (same step) in EP12.
 *   express_regret_about_a_past_decision (should, independent:1, transfer:0) —
 *     1 independent in EP11; EP12 reinforces it (guided reuse) without
 *     requiring transfer, matching its lighter evidence target.
 * `scripts/foundry/b2/check-b2-evidence-paths.mjs` counts these mechanically
 * from `evidenceType`/`transfer` step fields rather than trusting this
 * comment.
 *
 * STEP TYPES. Only the nine types `EpisodeShell.jsx` already renders (scene,
 * model, comprehension, choice, word_order, fill_blank, free_reply, recall,
 * completion) — same convention as arc 1/arc 2. `evalKind` values are B2
 * intent ids from `b2Intents.js`; `canDoId` is added explicitly on every
 * evaluated step so validation never has to infer it from the intent map.
 * Near-miss `choice` steps use the exact `nearMiss` error shapes recorded on
 * `state_unreal_hypothesis`, `speculate_cause_or_effect` and
 * `express_past_regret` in `b2Intents.js` (real-conditional-for-unreal-
 * situation, missing modal-deduction marker, future-facing advice instead
 * of past regret) — these three intents are `deterministic_local_with_
 * hybrid_escalation`, so the model targets and near-misses below are kept
 * crisp and formulaic on purpose, matching the blueprint's evaluator-signal
 * intent.
 *
 * All prose lives behind i18n keys (never populated by this task — see
 * `i18nKeysNeeded.js`); every English target/prompt is literal, exactly as
 * arc 1/arc 2 and every earlier level does it. Keys use the `b2ep9`-`b2ep12`
 * prefixes (arc 1 owns `b2ep1`-`b2ep4`, arc 2 owns `b2ep5`-`b2ep8`).
 */

const HYPOTHESIZE_09 = {
  id: 'b2_what_if_hypothesize',
  arc: 'what_if',
  level: 'B2',
  role: 'primary',
  titleKey: 'b2ep9Title',
  goalKey: 'b2ep9Goal',
  canDoId: 'hypothesize_about_unreal_situations',
  canDoNameKey: 'b2ep9CanDoName',
  durationKey: 'b2ep9Duration',
  estimatedMinutes: 10,
  xp: 90,
  prerequisites: [],
  skillPrerequisites: ['b1.talk_about_plans_and_intentions'],
  gardenItems: ['second_conditional_pattern', 'third_conditional_pattern', 'mixed_conditional_pattern', 'what_would_you_do_if'],
  reuseSkills: ['b1.talk_about_plans_and_intentions'],
  steps: [
    { type: 'scene', mood: 'thoughtful', titleKey: 'b2ep9SceneTitle', bodyKey: 'b2ep9SceneBody', showGoal: true, ctaKey: 'b2ep9Start' },
    {
      type: 'model', target: "If I were in your position, I'd ask for more time before deciding.",
      meaningItems: ['second_conditional_pattern'], explainKey: 'b2ep9Model1Explain',
    },
    {
      type: 'comprehension', instructionKey: 'b2ep9Comp1Instruction',
      target: "If I had more savings, I'd quit today and not think twice.",
      itemId: 'second_conditional_pattern',
      options: [{ key: 'b2ep9Comp1OptCorrect', correct: true }, { key: 'b2ep9Comp1OptWrong1' }, { key: 'b2ep9Comp1OptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'b2ep9NearMissInstruction',
      target: 'If I am you, I ask for more time.',
      itemId: 'second_conditional_pattern',
      options: [{ key: 'b2ep9NearMissOptCorrect', correct: true }, { key: 'b2ep9NearMissOptWrong1' }, { key: 'b2ep9NearMissOptWrong2' }],
      explainKey: 'b2ep9NearMissExplain',
    },
    {
      type: 'model', target: "If I'd known about the pay cut, I would have looked for a new job months ago.",
      meaningItems: ['third_conditional_pattern'], explainKey: 'b2ep9Model2Explain',
    },
    {
      type: 'comprehension', instructionKey: 'b2ep9Comp2Instruction',
      target: 'If she had asked for feedback last year, she would have gotten the promotion.',
      itemId: 'third_conditional_pattern',
      options: [{ key: 'b2ep9Comp2OptCorrect', correct: true }, { key: 'b2ep9Comp2OptWrong1' }, { key: 'b2ep9Comp2OptWrong2' }],
    },
    {
      type: 'model', target: "If I hadn't taken this job in the first place, I wouldn't be feeling so stuck right now.",
      meaningItems: ['mixed_conditional_pattern'], explainKey: 'b2ep9Model3Explain',
    },
    {
      type: 'word_order', instructionKey: 'b2ep9BuildInstruction', hintKey: 'b2ep9BuildHint', itemId: 'mixed_conditional_pattern',
      tokens: ['If', 'I', "hadn't", 'quit', 'my', 'job', ',', 'I', 'would', 'still', 'have', 'savings', '.'],
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Maya still can't decide whether to quit her job and travel for a year. If you were her, what would you do?",
      instructionKey: 'b2ep9AssistedInstruction', evalKind: 'state_unreal_hypothesis', canDoId: 'hypothesize_about_unreal_situations',
      suggestionEn: "If I were her, I'd take the year off — you don't get a chance like this twice.",
      itemIds: ['second_conditional_pattern', 'what_would_you_do_if'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Now imagine it's five years later and Maya never took that trip — she just kept the safe job. Looking back, what would have been different for her?",
      instructionKey: 'b2ep9IndependentInstruction', evalKind: 'state_unreal_hypothesis', canDoId: 'hypothesize_about_unreal_situations',
      itemIds: ['third_conditional_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'b2ep9FinalInstruction', evalKind: 'state_unreal_hypothesis', canDoId: 'hypothesize_about_unreal_situations', itemIds: ['second_conditional_pattern'] },
    { type: 'completion', canDoNameKey: 'b2ep9CanDoName', titleKey: 'b2ep9CloseTitle', bodyKey: 'b2ep9CloseBody', ctaKey: 'b2ep9CloseCta' },
  ],
}

const SPECULATE_10 = {
  id: 'b2_what_if_speculate',
  arc: 'what_if',
  level: 'B2',
  role: 'primary',
  titleKey: 'b2ep10Title',
  goalKey: 'b2ep10Goal',
  canDoId: 'speculate_about_cause_and_effect',
  canDoNameKey: 'b2ep10CanDoName',
  durationKey: 'b2ep10Duration',
  estimatedMinutes: 10,
  xp: 90,
  prerequisites: ['b2_what_if_hypothesize'],
  skillPrerequisites: ['hypothesize_about_unreal_situations'],
  gardenItems: ['modal_deduction_present_pattern', 'modal_deduction_past_pattern', 'i_bet', 'chances_are', 'theres_a_good_chance_that', 'its_likely_that', 'its_unlikely_that', 'i_doubt_that', 'i_have_a_feeling_that', 'who_knows'],
  reuseSkills: ['hypothesize_about_unreal_situations'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'b2ep10RecallInstruction', evalKind: 'state_unreal_hypothesis', canDoId: 'hypothesize_about_unreal_situations', itemIds: ['second_conditional_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'b2ep10SceneTitle', bodyKey: 'b2ep10SceneBody', ctaKey: 'b2ep10Start' },
    {
      type: 'model', target: "The tracking says 'delivered,' but there's nothing on the porch — someone must have taken it.",
      meaningItems: ['modal_deduction_present_pattern'], explainKey: 'b2ep10Model1Explain',
    },
    {
      type: 'comprehension', instructionKey: 'b2ep10Comp1Instruction',
      target: "It's late and the lights are off — they might already be asleep.",
      itemId: 'modal_deduction_present_pattern',
      options: [{ key: 'b2ep10Comp1OptCorrect', correct: true }, { key: 'b2ep10Comp1OptWrong1' }, { key: 'b2ep10Comp1OptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'b2ep10NearMissInstruction',
      target: 'They left early.',
      itemId: 'modal_deduction_present_pattern',
      options: [{ key: 'b2ep10NearMissOptCorrect', correct: true }, { key: 'b2ep10NearMissOptWrong1' }, { key: 'b2ep10NearMissOptWrong2' }],
      explainKey: 'b2ep10NearMissExplain',
    },
    {
      type: 'model', target: "The porch camera didn't catch anyone — the driver must have left it at the wrong house.",
      meaningItems: ['modal_deduction_past_pattern'], explainKey: 'b2ep10Model2Explain',
    },
    {
      type: 'comprehension', instructionKey: 'b2ep10Comp2Instruction',
      target: "The label's torn and the box is empty — it could have been damaged in transit.",
      itemId: 'modal_deduction_past_pattern',
      options: [{ key: 'b2ep10Comp2OptCorrect', correct: true }, { key: 'b2ep10Comp2OptWrong1' }, { key: 'b2ep10Comp2OptWrong2' }],
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "The delivery app says 'delivered,' but there's nothing on the porch, and the neighbours didn't see anyone. What do you think happened?",
      instructionKey: 'b2ep10AssistedInstruction', evalKind: 'speculate_cause_or_effect', canDoId: 'speculate_about_cause_and_effect',
      suggestionEn: 'It might have been left at the wrong address — or someone could have taken it before you got home.',
      itemIds: ['modal_deduction_present_pattern', 'i_bet'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Now your neighbour mentions she heard a van outside around 2pm, but nobody rang the doorbell. What's your best guess about what happened?",
      instructionKey: 'b2ep10IndependentInstruction', evalKind: 'speculate_cause_or_effect', canDoId: 'speculate_about_cause_and_effect',
      itemIds: ['modal_deduction_past_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'b2ep10FinalInstruction', evalKind: 'speculate_cause_or_effect', canDoId: 'speculate_about_cause_and_effect', itemIds: ['modal_deduction_present_pattern'] },
    { type: 'completion', canDoNameKey: 'b2ep10CanDoName', titleKey: 'b2ep10CloseTitle', bodyKey: 'b2ep10CloseBody', ctaKey: 'b2ep9CloseCta' },
  ],
}

const REGRET_11 = {
  id: 'b2_what_if_regret',
  arc: 'what_if',
  level: 'B2',
  role: 'secondary',
  titleKey: 'b2ep11Title',
  goalKey: 'b2ep11Goal',
  canDoId: 'express_regret_about_a_past_decision',
  canDoNameKey: 'b2ep11CanDoName',
  durationKey: 'b2ep11Duration',
  estimatedMinutes: 8,
  xp: 75,
  prerequisites: ['b2_what_if_speculate'],
  skillPrerequisites: ['b1.narrate_connected_event', 'hypothesize_about_unreal_situations'],
  gardenItems: ['wish_past_perfect_pattern'],
  reuseSkills: ['hypothesize_about_unreal_situations', 'speculate_about_cause_and_effect'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'b2ep11RecallInstruction', evalKind: 'speculate_cause_or_effect', canDoId: 'speculate_about_cause_and_effect', itemIds: ['modal_deduction_present_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'b2ep11SceneTitle', bodyKey: 'b2ep11SceneBody', ctaKey: 'b2ep11Start' },
    {
      type: 'model', target: 'I wish I had checked the reviews before booking — I would have chosen somewhere else.',
      meaningItems: ['wish_past_perfect_pattern'], explainKey: 'b2ep11ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'b2ep11ComprehensionInstruction',
      target: "If only I'd asked more questions first, I wouldn't have signed up.",
      itemId: 'wish_past_perfect_pattern',
      options: [{ key: 'b2ep11CompOptCorrect', correct: true }, { key: 'b2ep11CompOptWrong1' }, { key: 'b2ep11CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'b2ep11NearMissInstruction',
      target: 'I should ask more questions next time.',
      itemId: 'wish_past_perfect_pattern',
      options: [{ key: 'b2ep11NearMissOptCorrect', correct: true }, { key: 'b2ep11NearMissOptWrong1' }, { key: 'b2ep11NearMissOptWrong2' }],
      explainKey: 'b2ep11NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Jae still thinks about that shop sometimes — the loan, the location, all of it. If you were in Jae's position, looking back now, what would you say?",
      instructionKey: 'b2ep11AssistedInstruction', evalKind: 'express_past_regret', canDoId: 'express_regret_about_a_past_decision',
      suggestionEn: 'I wish I had done more research before signing the lease — I would have known it was too risky.',
      itemIds: ['wish_past_perfect_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'The shop was also tucked away on a quiet side street, easy to miss. Looking back, what does Jae probably regret most about that choice?',
      instructionKey: 'b2ep11IndependentInstruction', evalKind: 'express_past_regret', canDoId: 'express_regret_about_a_past_decision',
      itemIds: ['wish_past_perfect_pattern'], evidenceType: 'independent',
    },
    { type: 'completion', canDoNameKey: 'b2ep11CanDoName', titleKey: 'b2ep11CloseTitle', bodyKey: 'b2ep11CloseBody', ctaKey: 'b2ep9CloseCta' },
  ],
}

const INTEGRATED_12 = {
  id: 'b2_what_if_integrated',
  arc: 'what_if',
  level: 'B2',
  role: 'integrated',
  titleKey: 'b2ep12Title',
  goalKey: 'b2ep12Goal',
  canDoId: 'hypothesize_about_unreal_situations',
  canDoNameKey: 'b2ep12CanDoName',
  durationKey: 'b2ep12Duration',
  estimatedMinutes: 12,
  xp: 110,
  prerequisites: ['b2_what_if_regret'],
  skillPrerequisites: ['hypothesize_about_unreal_situations', 'speculate_about_cause_and_effect', 'express_regret_about_a_past_decision'],
  gardenItems: [],
  reuseSkills: ['hypothesize_about_unreal_situations', 'speculate_about_cause_and_effect', 'express_regret_about_a_past_decision'],
  /*
   * Transfer topic: an old friend, Priya, who moved abroad for a job six
   * months ago and has gone quiet — genuinely new, never used in EP9-EP11
   * (which used Maya's job/travel decision, a missing package, and Jae's
   * shop). This is what makes the two independent+transfer production
   * turns below TRANSFER, not repetition.
   */
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'b2ep12SceneTitle', bodyKey: 'b2ep12SceneBody', showGoal: true, ctaKey: 'b2ep12Start' },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Priya moved abroad for a big new job six months ago. Imagine you were the one starting fresh somewhere completely new, knowing nobody. What would you do differently to stay in touch with old friends?',
      instructionKey: 'b2ep12HypothesizeInstruction', evalKind: 'state_unreal_hypothesis', canDoId: 'hypothesize_about_unreal_situations',
      itemIds: ['second_conditional_pattern', 'third_conditional_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "Here's the strange part: no replies for weeks, and a card you sent came back marked 'address unknown.' What's your best guess about what's actually going on?",
      instructionKey: 'b2ep12SpeculateInstruction', evalKind: 'speculate_cause_or_effect', canDoId: 'speculate_about_cause_and_effect',
      itemIds: ['modal_deduction_present_pattern', 'modal_deduction_past_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'You just remembered — she told you her new address before she left, and you meant to save it, but never did. How do you feel about that now?',
      instructionKey: 'b2ep12RegretInstruction', evalKind: 'express_past_regret', canDoId: 'express_regret_about_a_past_decision',
      itemIds: ['wish_past_perfect_pattern'], evidenceType: 'guided',
    },
    {
      type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Thinking about it all — what will you actually do: message her directly, or wait and see?',
      instructionKey: 'b2ep12CloseInstruction', evalKind: 'state_unreal_hypothesis', canDoId: 'hypothesize_about_unreal_situations',
      suggestionEn: "If it were me, I'd just message her directly and ask if everything's okay — better than guessing.",
      itemIds: ['second_conditional_pattern'], evidenceType: 'assistedOpen',
    },
    { type: 'recall', instructionKey: 'b2ep12FinalInstruction', evalKind: 'speculate_cause_or_effect', canDoId: 'speculate_about_cause_and_effect', itemIds: ['modal_deduction_past_pattern'] },
    { type: 'completion', canDoNameKey: 'b2ep12CanDoName', titleKey: 'b2ep12CloseTitle', bodyKey: 'b2ep12CloseBody', ctaKey: 'b2ep9CloseCta' },
  ],
}

export const B2_ARC3 = [HYPOTHESIZE_09, SPECULATE_10, REGRET_11, INTEGRATED_12]
export const B2_ARC3_ID = 'what_if'
export const getB2Arc3Episode = (id) => B2_ARC3.find((ep) => ep.id === id) || null
