/*
 * B1 arc 1 — "what_happened" (docs/curriculum/blueprints/b1.json, arc order 1).
 *
 * Three episodes teaching B1's two new narrative can-dos:
 *   narrate_connected_event     — a personal story as a connected sequence
 *   narrate_interrupted_action  — an ongoing action broken by an interrupting event
 * and reinforcing A2's `talk_about_what_you_did` (the arc's `a2Reuse` entry).
 *
 * SELF-CONTAINED BY NECESSITY, NOT DESIGN CHOICE: `LC-CONT-B1`'s write scope is
 * `linguachat-frontend/src/learning/levels/b1/**` only. This module cannot be
 * imported by `episodeContent.js`'s `CONTENT_LOADERS`, cannot appear in
 * `curriculum/levels.js`'s `LEVELS`, and its `evalKind`s have no case in the
 * shared `evaluateFree` switch — none of that is available from this write
 * scope. See `docs/curriculum/implementation/b1/README.md` for why that is
 * `LC-INT-001`'s job, not a defect in this file. This module is provably
 * correct on its own terms via `scripts/foundry/b1/lib/journey.mjs` +
 * `scripts/foundry/b1/check-b1-arc1.mjs`, which call its evaluators directly.
 *
 * i18n: `titleKey`/`goalKey`/instruction/hint/retry keys are NOT in the shared
 * `i18n/translations.js` yet (also out of scope — `src/i18n/**`). Every key this
 * arc needs is declared once in `../i18nDraft.js`'s `B1_ARC1_COPY`, and this
 * arc's own check script asserts every key a step references resolves there —
 * the same self-consistency guarantee `check-a1-arc1.mjs` gets from the real
 * locale files, until `LC-INT-001` merges these into the real ones. `promptEn`/
 * `sceneEn`/`suggestionEn`/`target`/`expects` are, as at every other level,
 * literal English — the language being taught, never translated.
 *
 * Episode-numbering: B1's global episode numbers (after Pre-A1's 1-17 and A1's
 * 18-38) depend on A2's final episode count, which is not fixed yet (A2 is a
 * sibling lane). Using a real-looking global number now would risk exactly the
 * cross-level id collision `levelMaps.js`/`check-cross-level-ids.mjs` exists to
 * prevent. Keys use a level-local `b1Ep<n>` prefix instead; `LC-INT-001`
 * renumbers if a single global sequence is wanted.
 */

const ARC = 'what_happened'
const LEVEL = 'B1'

const B1_EP1 = {
  id: 'one_thing_after_another',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep1Title',
  goalKey: 'b1Ep1Goal',
  canDoId: 'narrate_connected_event',
  canDoNameKey: 'b1Ep1CanDoName',
  durationKey: 'b1Ep1Duration',
  estimatedMinutes: 9,
  xp: 80,
  prerequisites: [],
  // A2's own capability, per b1.json arcs[0].a2Reuse — expected id per
  // prerequisiteReconciliation.reconciliation.mapping (LC-AUD-001/LC-FND-002).
  skillPrerequisites: ['talk_about_what_you_did'],
  gardenItems: [
    'b1_first', 'b1_then', 'b1_after_that', 'b1_before_that', 'b1_finally',
    'b1_sequence_connectors_pattern',
  ],
  reuseSkills: ['talk_about_what_you_did'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep1SceneTitle',
      sceneBodyKey: 'b1Ep1SceneBody',
    },
    {
      type: 'model',
      target: 'First I woke up. Then I made coffee. After that I read the news. Finally I left for work.',
      meaningItems: ['b1_first', 'b1_then', 'b1_after_that', 'b1_finally'],
      explainKey: 'b1Ep1ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep1ComprehensionInstruction',
      target: 'Which sentence correctly continues a story, in order?',
      itemId: 'b1_then',
      options: [
        { key: 'b1Ep1CompOptCorrect', correct: true },
        { key: 'b1Ep1CompOptWrong1' },
        { key: 'b1Ep1CompOptWrong2' },
      ],
    },
    {
      type: 'word_order',
      instructionKey: 'b1Ep1OrderInstruction',
      hintKey: 'b1Ep1OrderHint',
      tokens: ['After', 'that', ',', 'I', 'went', 'home', '.'],
      itemId: 'b1_after_that',
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep1BlankInstruction',
      before: '',
      after: ' I had breakfast.',
      expects: 'Then',
      alternatives: ['then'],
      itemId: 'b1_then',
      hintKey: 'b1Ep1BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "Tell me about yesterday, {name}. What did you do, in order?",
      instructionKey: 'b1Ep1OpenInstruction',
      evalKind: 'narrate_past_event',
      narrativeForm: 'sequence',
      suggestionEn: 'First I got up late. Then I made coffee. After that I checked my messages. Finally I left the house.',
      itemIds: ['b1_first', 'b1_then', 'b1_after_that', 'b1_finally', 'b1_sequence_connectors_pattern'],
    },
  ],
}

const B1_EP2 = {
  id: 'when_it_happened',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep2Title',
  goalKey: 'b1Ep2Goal',
  canDoId: 'narrate_interrupted_action',
  canDoNameKey: 'b1Ep2CanDoName',
  durationKey: 'b1Ep2Duration',
  estimatedMinutes: 10,
  xp: 85,
  prerequisites: ['narrate_connected_event'],
  skillPrerequisites: ['talk_about_what_you_did'],
  gardenItems: [
    'b1_past_continuous_pattern', 'b1_when_while_pattern', 'b1_suddenly', 'b1_just_then',
  ],
  reuseSkills: ['narrate_connected_event'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep2SceneTitle',
      sceneBodyKey: 'b1Ep2SceneBody',
    },
    {
      type: 'model',
      target: 'I was walking home when it started to rain. While I was waiting for the bus, I saw an old friend.',
      meaningItems: ['b1_past_continuous_pattern', 'b1_when_while_pattern'],
      explainKey: 'b1Ep2ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep2ComprehensionInstruction',
      target: 'Which sentence describes something that was already happening when something else happened?',
      itemId: 'b1_when_while_pattern',
      options: [
        { key: 'b1Ep2CompOptCorrect', correct: true },
        { key: 'b1Ep2CompOptWrong1' },
        { key: 'b1Ep2CompOptWrong2' },
      ],
    },
    {
      type: 'word_order',
      instructionKey: 'b1Ep2OrderInstruction',
      hintKey: 'b1Ep2OrderHint',
      tokens: ['I', 'was', 'cooking', 'when', 'the', 'phone', 'rang', '.'],
      itemId: 'b1_past_continuous_pattern',
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep2BlankInstruction',
      before: 'I ',
      after: ' watching TV when you called.',
      expects: 'was',
      alternatives: [],
      itemId: 'b1_past_continuous_pattern',
      hintKey: 'b1Ep2BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Think of a time something surprising happened while you were doing something else. What was happening when it happened?',
      instructionKey: 'b1Ep2OpenInstruction',
      evalKind: 'narrate_past_event',
      narrativeForm: 'interruption',
      suggestionEn: 'I was cooking dinner when the power went out.',
      itemIds: ['b1_past_continuous_pattern', 'b1_when_while_pattern', 'b1_suddenly'],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'One more — a different moment. What was happening when something else happened?',
      instructionKey: 'b1Ep2OpenInstruction2',
      evalKind: 'narrate_past_event',
      narrativeForm: 'interruption',
      // no suggestionEn: the arc's second unaided moment, ahead of the
      // capstone's fully unaided close (autonomyTarget, b1.json arc 1)
      itemIds: ['b1_past_continuous_pattern', 'b1_when_while_pattern', 'b1_just_then'],
    },
  ],
}

const B1_EP3 = {
  id: 'the_whole_story',
  arc: ARC,
  level: LEVEL,
  role: 'reinforcement',
  reinforces: true,
  titleKey: 'b1Ep3Title',
  goalKey: 'b1Ep3Goal',
  canDoId: 'narrate_interrupted_action',
  canDoNameKey: 'b1Ep3CanDoName',
  durationKey: 'b1Ep3Duration',
  estimatedMinutes: 9,
  xp: 90,
  prerequisites: ['narrate_connected_event', 'narrate_interrupted_action'],
  skillPrerequisites: ['talk_about_what_you_did'],
  gardenItems: [],
  // combines both of this arc's new can-dos in one longer narration, per
  // b1.json arc 1's `miniStory` note — implemented as ordinary steps rather
  // than the shared `engine/miniStory.js` STORIES table, which this task
  // cannot register a level-owned entry into (out of write scope); see
  // docs/curriculum/implementation/b1/arc1-what-happened.md.
  reuseSkills: ['narrate_connected_event', 'talk_about_what_you_did'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep3SceneTitle',
      sceneBodyKey: 'b1Ep3SceneBody',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Tell me the whole story of an interesting day — a sequence of things that happened, and include one moment when something else happened while you were doing something.',
      instructionKey: 'b1Ep3OpenInstruction',
      evalKind: 'narrate_past_event',
      narrativeForm: 'sequence',
      suggestionEn: 'First I went to the market. Then, while I was choosing vegetables, I met my neighbor. After that we had coffee together. Finally I went home.',
      itemIds: [
        'b1_first', 'b1_then', 'b1_after_that', 'b1_finally',
        'b1_past_continuous_pattern', 'b1_when_while_pattern',
      ],
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep3ComprehensionInstruction',
      target: 'In a good story, where does an interruption usually fit?',
      itemId: 'b1_when_while_pattern',
      options: [
        { key: 'b1Ep3CompOptCorrect', correct: true },
        { key: 'b1Ep3CompOptWrong1' },
        { key: 'b1Ep3CompOptWrong2' },
      ],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: "Your turn again — a different day this time. Tell me what happened, and what was happening when something interrupted it. No help this time.",
      instructionKey: 'b1Ep3OpenInstruction2',
      evalKind: 'narrate_past_event',
      narrativeForm: 'interruption',
      // capstone close, unaided by design (b1.json arc 1 autonomyTarget:
      // "withheld on the arc's last recall")
      itemIds: ['b1_past_continuous_pattern', 'b1_when_while_pattern'],
    },
  ],
}

export const B1_ARC1 = [B1_EP1, B1_EP2, B1_EP3]
export const B1_ARC1_ID = ARC
export const getB1Arc1Episode = (id) => B1_ARC1.find(ep => ep.id === id) || null
