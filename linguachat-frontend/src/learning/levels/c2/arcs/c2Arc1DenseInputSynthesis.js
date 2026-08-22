/*
 * C2 arc 1 — "Making sense of dense material" (`dense_input_synthesis`).
 *
 * Derived from docs/curriculum/blueprints/c2.json arc `dense_input_synthesis`
 * and docs/curriculum/implementation/c2/content-plan.json's matching arc
 * entry (source texts, intent test cases, steps, vocabulary — all
 * transcribed from there, not invented here). First arc, prerequisite: C1
 * exit only. Introduces extract_key_argument_from_dense_text,
 * synthesize_multiple_viewpoints and identify_authors_stance_and_bias (all
 * three required).
 *
 * STRUCTURE. Four episodes, following B1/B2's own established convention
 * (see `docs/curriculum/implementation/b2/README.md` / `b2Arc1MakingTheCase.js`):
 * one teaching episode per new capability (assisted-open production, then
 * one unaided/independent production on a second same-difficulty source),
 * plus an arc-closing INTEGRATED episode on a genuinely new topic (a city
 * recycling program, per content-plan.json's own suggested transfer topic)
 * that supplies each capability's transfer instance.
 *
 * SOURCE-TEXT SHAPE. Every teaching/integrated step group follows B2 arc
 * 4's mediation convention (`b2Arc4TalkingAroundASubject.js`'s header
 * comment): a `scene` step carries an extra `sourceTextEn` (and, where two
 * texts are compared, `sourceTextBEn`) field — a harmless extra key on an
 * existing step type, not a new step type — and the `free_reply` step that
 * follows carries `sourceRef: true` so a future evaluator grades it against
 * the preceding source text rather than a canonical frame match. This is
 * structure, not implementation — the actual grading logic is
 * `LC-INT-001` work (`docs/curriculum/implementation/c2/core-engine-handoff.md`).
 *
 * PERSONALIZATION. c2.json marks this arc `personalizationMode: "themed"`.
 * Per content-plan.json's own `personalization` field (one interchangeable
 * example, not a parallel arc), personalization here is a single optional
 * step per teaching episode carrying `personalizationVariant: true` — an
 * interest-flavored alternative to the neutral independent-production
 * prompt, never evaluated differently or required for evidence. This is a
 * deliberately lighter design than B1/B2's capstone-only full-duplicate-arc
 * personalization (their capstones needed identical structure in two
 * surface variants; this arc needs only one swappable example per episode)
 * — see `docs/curriculum/implementation/c2/README.md` section on
 * personalization for the reasoning, and
 * `scripts/foundry/c2/check-c2-personalization-invariant.mjs` for the proof
 * this stays structurally inert (same evalKind/canDoId/evidenceType,
 * different surface text only, never itself evaluated toward evidence).
 *
 * EVIDENCE ACCOUNTING (must match c2.json#/canDos[].evidence — all three
 * capabilities: independent:2, transfer:1):
 *   extract_key_argument_from_dense_text — 1 independent in EP1 (step 6),
 *     1 independent+transfer in EP4 (step 2).
 *   synthesize_multiple_viewpoints — 1 independent in EP2 (step 7),
 *     1 independent+transfer in EP4 (step 5).
 *   identify_authors_stance_and_bias — 1 independent in EP3 (step 7),
 *     1 independent+transfer in EP4 (step 3).
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
 * literal, exactly as every earlier level does it. Key namespace: c2ep1
 * (EP1) - c2ep4 (EP4).
 */

const EXTRACT_01 = {
  id: 'c2_dense_input_synthesis_extract',
  arc: 'dense_input_synthesis',
  level: 'C2',
  role: 'primary',
  titleKey: 'c2ep1Title',
  goalKey: 'c2ep1Goal',
  canDoId: 'extract_key_argument_from_dense_text',
  canDoNameKey: 'c2ep1CanDoName',
  durationKey: 'c2ep1Duration',
  estimatedMinutes: 12,
  xp: 100,
  prerequisites: [],
  skillPrerequisites: ['c1.synthesize_two_conflicting_viewpoints', 'c1.infer_implied_meaning_in_unfamiliar_context'],
  gardenItems: ['evidentiality_stance_pattern', 'presumably', 'allegedly', 'claim', 'support'],
  reuseSkills: ['c1.infer_implied_meaning_in_unfamiliar_context'],
  steps: [
    { type: 'scene', mood: 'focused', titleKey: 'c2ep1SceneTitle', bodyKey: 'c2ep1SceneBody', showGoal: true, ctaKey: 'c2ep1Start',
      sourceTextEn: "Our office's new 'flexible hours' policy claims to boost productivity, but three months in, the data tells a different story. Attendance at team meetings has dropped by a third, and two major projects slipped their deadlines. Management insists this is a temporary adjustment period. Perhaps it is - but if the numbers haven't improved by the next quarter, it will be hard to defend keeping a policy that, on the evidence so far, seems to be costing more than it saves." },
    {
      type: 'model',
      target: "The author's claim is that the flexible-hours policy may be doing more harm than good, based on falling meeting attendance and missed deadlines, though the author hedges by admitting it could still be an adjustment period.",
      meaningItems: ['evidentiality_stance_pattern', 'claim'], explainKey: 'c2ep1ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep1ComprehensionInstruction',
      target: "Basically the writer thinks the new schedule policy might not be worth it - meetings are being missed and two projects were late, even though they say give it more time.",
      itemId: 'evidentiality_stance_pattern',
      options: [{ key: 'c2ep1CompOptCorrect', correct: true }, { key: 'c2ep1CompOptWrong1' }, { key: 'c2ep1CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep1NearMissInstruction',
      target: 'The office started a flexible hours policy and meetings and deadlines got worse.',
      itemId: 'evidentiality_stance_pattern',
      options: [{ key: 'c2ep1NearMissOptCorrect', correct: true }, { key: 'c2ep1NearMissOptWrong1' }, { key: 'c2ep1NearMissOptWrong2' }],
      explainKey: 'c2ep1NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Read the memo above. What is the author's claim, and what two pieces of evidence support it?",
      instructionKey: 'c2ep1AssistedInstruction', evalKind: 'extract_argument', canDoId: 'extract_key_argument_from_dense_text', sourceRef: true,
      suggestionEn: "The author's claim is that the flexible-hours policy may be doing more harm than good, citing falling meeting attendance and missed deadlines as evidence, though they hedge by allowing it could still be an adjustment period.",
      itemIds: ['evidentiality_stance_pattern'], evidenceType: 'assistedOpen',
    },
    {
      type: 'scene', mood: 'focused', titleKey: 'c2ep1SecondSceneTitle', bodyKey: 'c2ep1SecondSceneBody', ctaKey: 'c2ep1SecondStart',
      sourceTextEn: "The library's Sunday hours were extended to 6pm last month to boost weekend visits, but staff say foot traffic barely changed and evening cleaning now runs into closing time. It might simply be too soon to tell - though if visits don't climb by spring, the extra Sunday hour will be hard to justify against the added staffing cost." },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Now try this one independently: what is the author's claim, and what supports it?",
      instructionKey: 'c2ep1IndependentInstruction', evalKind: 'extract_argument', canDoId: 'extract_key_argument_from_dense_text', sourceRef: true,
      itemIds: ['evidentiality_stance_pattern'], evidenceType: 'independent',
    },
    {
      type: 'free_reply', speaker: 'lingua', personalizationVariant: true, format: 'themed',
      promptEn: "Optional: here's a short conflicting-reviews pair about {{learnerInterest}} instead - want to try extracting the claim and support from that one too?",
      instructionKey: 'c2ep1PersonalizationInstruction', evalKind: 'extract_argument', canDoId: 'extract_key_argument_from_dense_text',
      itemIds: ['evidentiality_stance_pattern'], evidenceType: 'guided',
      note: 'not counted toward independent/transfer evidence — an optional interest-flavored alternative, per c2.json arc.personalizationMode "themed" and content-plan.json arc 1 personalization.interestFlavoredExample',
    },
    { type: 'recall', instructionKey: 'c2ep1FinalInstruction', evalKind: 'extract_argument', canDoId: 'extract_key_argument_from_dense_text', itemIds: ['evidentiality_stance_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep1CanDoName', titleKey: 'c2ep1CloseTitle', bodyKey: 'c2ep1CloseBody', ctaKey: 'c2ep1CloseCta' },
  ],
}

const SYNTHESIZE_02 = {
  id: 'c2_dense_input_synthesis_synthesize',
  arc: 'dense_input_synthesis',
  level: 'C2',
  role: 'primary',
  titleKey: 'c2ep2Title',
  goalKey: 'c2ep2Goal',
  canDoId: 'synthesize_multiple_viewpoints',
  canDoNameKey: 'c2ep2CanDoName',
  durationKey: 'c2ep2Duration',
  estimatedMinutes: 12,
  xp: 100,
  prerequisites: ['c2_dense_input_synthesis_extract'],
  skillPrerequisites: ['extract_key_argument_from_dense_text'],
  gardenItems: ['evidentiality_stance_pattern', 'ostensibly', 'according to'],
  reuseSkills: ['extract_key_argument_from_dense_text'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c2ep2RecallInstruction', evalKind: 'extract_argument', canDoId: 'extract_key_argument_from_dense_text', itemIds: ['evidentiality_stance_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep2SceneTitle', bodyKey: 'c2ep2SceneBody', ctaKey: 'c2ep2Start',
      sourceTextEn: 'The new bike lane on Elm Street has cut car traffic outside the school by half. It’s exactly the kind of change this neighborhood needed.',
      sourceTextBEn: 'The bike lane looks nice on paper, but delivery trucks now double-park on the only remaining lane, so traffic near the school is actually worse at drop-off time.' },
    {
      type: 'model',
      target: "One resident feels the bike lane has clearly reduced car traffic near the school, while another agrees it looks good on paper but argues delivery-truck double-parking has actually made drop-off traffic worse - so the two accounts genuinely disagree on the real-world effect, not just its framing.",
      meaningItems: ['evidentiality_stance_pattern'], explainKey: 'c2ep2ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep2ComprehensionInstruction',
      target: "The two neighbors don't agree: one says the bike lane cut traffic a lot, the other says trucks parking in the road made it worse at pickup time.",
      itemId: 'evidentiality_stance_pattern',
      options: [{ key: 'c2ep2CompOptCorrect', correct: true }, { key: 'c2ep2CompOptWrong1' }, { key: 'c2ep2CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep2NearMissInstruction',
      target: 'The bike lane cut car traffic outside the school by half.',
      itemId: 'evidentiality_stance_pattern',
      options: [{ key: 'c2ep2NearMissOptCorrect', correct: true }, { key: 'c2ep2NearMissOptWrong1' }, { key: 'c2ep2NearMissOptWrong2' }],
      explainKey: 'c2ep2NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Two neighbors reviewed the new bike lane above. What do they actually disagree about?',
      instructionKey: 'c2ep2AssistedInstruction', evalKind: 'synthesize_viewpoints', canDoId: 'synthesize_multiple_viewpoints', sourceRef: true,
      suggestionEn: "They disagree about the real-world effect: one thinks the lane clearly cut car traffic, the other thinks delivery trucks double-parking has actually made drop-off traffic worse.",
      itemIds: ['evidentiality_stance_pattern'], evidenceType: 'assistedOpen',
    },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep2SecondSceneTitle', bodyKey: 'c2ep2SecondSceneBody', ctaKey: 'c2ep2SecondStart',
      sourceTextEn: "The new self-checkout machines at the corner shop are great - no more waiting behind someone with a full trolley.",
      sourceTextBEn: "The self-checkout machines might be quicker for a few items, but they still can't scan loose vegetables properly, so a staff member ends up helping half the queue anyway." },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Now try this pair independently: what do these two reviews actually disagree about?',
      instructionKey: 'c2ep2IndependentInstruction', evalKind: 'synthesize_viewpoints', canDoId: 'synthesize_multiple_viewpoints', sourceRef: true,
      itemIds: ['evidentiality_stance_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep2FinalInstruction', evalKind: 'synthesize_viewpoints', canDoId: 'synthesize_multiple_viewpoints', itemIds: ['evidentiality_stance_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep2CanDoName', titleKey: 'c2ep2CloseTitle', bodyKey: 'c2ep2CloseBody', ctaKey: 'c2ep1CloseCta' },
  ],
}

const STANCE_03 = {
  id: 'c2_dense_input_synthesis_stance',
  arc: 'dense_input_synthesis',
  level: 'C2',
  role: 'primary',
  titleKey: 'c2ep3Title',
  goalKey: 'c2ep3Goal',
  canDoId: 'identify_authors_stance_and_bias',
  canDoNameKey: 'c2ep3CanDoName',
  durationKey: 'c2ep3Duration',
  estimatedMinutes: 10,
  xp: 100,
  prerequisites: ['c2_dense_input_synthesis_synthesize'],
  skillPrerequisites: ['extract_key_argument_from_dense_text'],
  gardenItems: ['evidentiality_stance_pattern', 'unstated', 'imply'],
  reuseSkills: ['extract_key_argument_from_dense_text'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'c2ep3RecallInstruction', evalKind: 'synthesize_viewpoints', canDoId: 'synthesize_multiple_viewpoints', itemIds: ['evidentiality_stance_pattern'] },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep3SceneTitle', bodyKey: 'c2ep3SceneBody', ctaKey: 'c2ep3Start',
      sourceTextEn: "Our office's new 'flexible hours' policy claims to boost productivity, but three months in, the data tells a different story. Attendance at team meetings has dropped by a third, and two major projects slipped their deadlines. Management insists this is a temporary adjustment period. Perhaps it is - but if the numbers haven't improved by the next quarter, it will be hard to defend keeping a policy that, on the evidence so far, seems to be costing more than it saves." },
    {
      type: 'model',
      target: "The author is skeptical of the policy but not fully committed to condemning it yet - the hedge 'perhaps it is' shows they're leaving room for the adjustment-period explanation before drawing a final conclusion.",
      meaningItems: ['evidentiality_stance_pattern'], explainKey: 'c2ep3ModelExplain',
    },
    {
      type: 'comprehension', instructionKey: 'c2ep3ComprehensionInstruction',
      target: "The writer seems doubtful about the new hours policy, though they admit it might just need more time.",
      itemId: 'evidentiality_stance_pattern',
      options: [{ key: 'c2ep3CompOptCorrect', correct: true }, { key: 'c2ep3CompOptWrong1' }, { key: 'c2ep3CompOptWrong2' }],
    },
    {
      type: 'choice', instructionKey: 'c2ep3NearMissInstruction',
      target: "The author doesn't like the new policy.",
      itemId: 'evidentiality_stance_pattern',
      options: [{ key: 'c2ep3NearMissOptCorrect', correct: true }, { key: 'c2ep3NearMissOptWrong1' }, { key: 'c2ep3NearMissOptWrong2' }],
      explainKey: 'c2ep3NearMissExplain',
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Looking at the memo again - how confident does the author actually seem, and what one phrase shows that?',
      instructionKey: 'c2ep3AssistedInstruction', evalKind: 'identify_stance', canDoId: 'identify_authors_stance_and_bias', sourceRef: true,
      suggestionEn: "The author sounds doubtful rather than certain - the phrase 'perhaps it is' shows they're leaving room for the adjustment-period explanation.",
      itemIds: ['evidentiality_stance_pattern'], evidenceType: 'assistedOpen',
    },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep3SecondSceneTitle', bodyKey: 'c2ep3SecondSceneBody', ctaKey: 'c2ep3SecondStart',
      sourceTextEn: "The library's Sunday hours were extended to 6pm last month to boost weekend visits, but staff say foot traffic barely changed and evening cleaning now runs into closing time. It might simply be too soon to tell - though if visits don't climb by spring, the extra Sunday hour will be hard to justify against the added staffing cost." },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Now try this one independently: how confident does this author sound, and what shows it?',
      instructionKey: 'c2ep3IndependentInstruction', evalKind: 'identify_stance', canDoId: 'identify_authors_stance_and_bias', sourceRef: true,
      itemIds: ['evidentiality_stance_pattern'], evidenceType: 'independent',
    },
    { type: 'recall', instructionKey: 'c2ep3FinalInstruction', evalKind: 'identify_stance', canDoId: 'identify_authors_stance_and_bias', itemIds: ['evidentiality_stance_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep3CanDoName', titleKey: 'c2ep3CloseTitle', bodyKey: 'c2ep3CloseBody', ctaKey: 'c2ep1CloseCta' },
  ],
}

const INTEGRATED_04 = {
  id: 'c2_dense_input_synthesis_integrated',
  arc: 'dense_input_synthesis',
  level: 'C2',
  role: 'integrated',
  titleKey: 'c2ep4Title',
  goalKey: 'c2ep4Goal',
  canDoId: 'extract_key_argument_from_dense_text',
  canDoNameKey: 'c2ep4CanDoName',
  durationKey: 'c2ep4Duration',
  estimatedMinutes: 14,
  xp: 120,
  prerequisites: ['c2_dense_input_synthesis_stance'],
  skillPrerequisites: ['extract_key_argument_from_dense_text', 'synthesize_multiple_viewpoints', 'identify_authors_stance_and_bias'],
  gardenItems: [],
  reuseSkills: ['extract_key_argument_from_dense_text', 'synthesize_multiple_viewpoints', 'identify_authors_stance_and_bias'],
  /*
   * Transfer topic: a city curbside recycling program — genuinely new,
   * never used in EP1-EP3 (content-plan.json's own suggested transfer
   * topic for this arc: "a short passage about a city's new recycling
   * program"). This is what makes the three production turns below
   * TRANSFER, not repetition.
   */
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'c2ep4SceneTitle', bodyKey: 'c2ep4SceneBody', showGoal: true, ctaKey: 'c2ep4Start',
      sourceTextEn: "The city's new curbside recycling program promises to cut landfill waste by a quarter, but six months in, contamination rates in recycling bins have tripled, forcing the sorting facility to reject entire truckloads. City officials say residents just need better instructions. That may be true - but if contamination doesn't fall by next year's review, the program's environmental savings could be wiped out by the extra truck trips needed to re-sort or discard the rejected loads." },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "Here's a new memo about the city's recycling program. What's the author's claim, and what supports it?",
      instructionKey: 'c2ep4ExtractInstruction', evalKind: 'extract_argument', canDoId: 'extract_key_argument_from_dense_text', sourceRef: true,
      itemIds: ['evidentiality_stance_pattern'], evidenceType: 'independent', transfer: true,
    },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: "How confident does the author sound about the program's future, and how do you know?",
      instructionKey: 'c2ep4StanceInstruction', evalKind: 'identify_stance', canDoId: 'identify_authors_stance_and_bias', sourceRef: true,
      itemIds: ['evidentiality_stance_pattern'], evidenceType: 'independent', transfer: true,
    },
    { type: 'scene', mood: 'thoughtful', titleKey: 'c2ep4SecondSceneTitle', bodyKey: 'c2ep4SecondSceneBody', ctaKey: 'c2ep4SecondStart',
      sourceTextEn: "Recycling pickup used to be confusing, but the new color-coded bins make it obvious what goes where - I've barely made a mistake since they arrived.",
      sourceTextBEn: "The color-coded bins look clear enough, but nobody explained that pizza boxes with grease stains still count as contamination, so half our street's bin got rejected last month." },
    {
      type: 'free_reply', speaker: 'lingua', promptEn: 'Two residents reviewed the new color-coded bins above. What do they actually disagree about?',
      instructionKey: 'c2ep4SynthesizeInstruction', evalKind: 'synthesize_viewpoints', canDoId: 'synthesize_multiple_viewpoints', sourceRef: true,
      itemIds: ['evidentiality_stance_pattern'], evidenceType: 'independent', transfer: true,
    },
    { type: 'recall', instructionKey: 'c2ep4FinalInstruction', evalKind: 'synthesize_viewpoints', canDoId: 'synthesize_multiple_viewpoints', itemIds: ['evidentiality_stance_pattern'] },
    { type: 'completion', canDoNameKey: 'c2ep4CanDoName', titleKey: 'c2ep4CloseTitle', bodyKey: 'c2ep4CloseBody', ctaKey: 'c2ep1CloseCta' },
  ],
}

export const C2_ARC1 = [EXTRACT_01, SYNTHESIZE_02, STANCE_03, INTEGRATED_04]
export const C2_ARC1_ID = 'dense_input_synthesis'
export const getC2Arc1Episode = (id) => C2_ARC1.find((ep) => ep.id === id) || null
