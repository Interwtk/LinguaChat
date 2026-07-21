/*
 * Pre-A1 greetings arc — three connected, data-driven episodes.
 *
 * Each episode is mostly configuration. Steps are typed and rendered generically
 * by EpisodeShell, so navigation, progress, scaffolding, evaluation, persistence
 * and styling are never duplicated. Target English lives literally (with a
 * {name} placeholder resolved at render); all system text uses i18n keys and
 * native meanings come from the seed vocabulary.
 *
 * Step types: scene · model · comprehension · word_order · fill_blank · choice ·
 *             free_reply · recall · completion
 */

const GREETINGS_01 = {
  id: 'first_greeting',
  level: 'Pre-A1',
  titleKey: 'ep1Title',
  goalKey: 'ep1Goal',
  canDoId: 'introduce_self',
  canDoNameKey: 'ep1CanDoName',
  durationKey: 'ep1Duration',
  estimatedMinutes: 6,
  xp: 40,
  prerequisites: [],
  targetItems: ['hi', 'im', 'im_pattern'],
  reviewItems: [],
  gardenItems: ['hi', 'hello', 'im', 'whats_your_name'],
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'ep1IntroTitle', bodyKey: 'ep1IntroBody', showGoal: true, ctaKey: 'ep1Start' },
    { type: 'model', target: 'Hi, I’m Lingua.', meaningItems: ['hi', 'im'], explainKey: 'ep1ModelExplain' },
    { type: 'comprehension', instructionKey: 'ep1ComprehensionInstruction', target: 'Hi, I’m Lingua.', itemId: 'whats_your_name',
      options: [{ key: 'ep1CompOptCorrect', correct: true }, { key: 'ep1CompOptWrong1' }, { key: 'ep1CompOptWrong2' }] },
    { type: 'word_order', instructionKey: 'ep1BuildInstruction', hintKey: 'ep1BuildHint', itemId: 'hi', tokens: ['Hi', 'I’m', '{name}.'] },
    { type: 'fill_blank', instructionKey: 'ep1FillInstruction', before: 'Hi, I’m', after: '.', hintKey: 'ep1FillHint', itemId: 'im' },
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Hi! I’m Lingua. What’s your name?', instructionKey: 'ep1RoleplayInstruction',
      evalKind: 'introduction', suggestionEn: 'Hi, I’m {name}.', itemIds: ['hi', 'im'] },
    { type: 'free_reply', variation: true, sceneEn: 'Hello! I’m {partner}.', instructionKey: 'ep1VariationInstruction',
      evalKind: 'introduction', suggestionEn: 'Hi, I’m {name}.', itemIds: ['im'] },
    { type: 'recall', instructionKey: 'ep1RecallInstruction', evalKind: 'introduction', itemIds: ['im'] },
    { type: 'completion', canDoNameKey: 'ep1CanDoName', titleKey: 'ep1CloseTitle', bodyKey: 'ep1CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

const GREETINGS_02 = {
  id: 'ask_name',
  level: 'Pre-A1',
  titleKey: 'ep2Title',
  goalKey: 'ep2Goal',
  canDoId: 'ask_name',
  canDoNameKey: 'ep2CanDoName',
  durationKey: 'ep2Duration',
  estimatedMinutes: 7,
  xp: 45,
  prerequisites: ['first_greeting'],
  targetItems: ['whats_your_name', 'my_name_is', 'whats_your_pattern'],
  reviewItems: ['hi', 'im'],
  gardenItems: ['whats_your_name', 'my_name_is', 'name'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'ep2RecallInstruction', evalKind: 'introduction', itemIds: ['im'] },
    { type: 'scene', mood: 'welcoming', titleKey: 'ep2SceneTitle', bodyKey: 'ep2SceneBody', ctaKey: 'ep1Continue' },
    { type: 'model', target: 'What’s your name?', response: 'I’m {partner}.', meaningItems: ['whats_your_name', 'im'], explainKey: 'ep2ModelExplain' },
    { type: 'comprehension', instructionKey: 'ep2ComprehensionInstruction', target: 'What’s your name?', itemId: 'whats_your_name',
      options: [{ key: 'ep2CompOptCorrect', correct: true }, { key: 'ep2CompOptWrong1' }, { key: 'ep2CompOptWrong2' }] },
    { type: 'word_order', instructionKey: 'ep2BuildInstruction', hintKey: 'ep1BuildHint', itemId: 'whats_your_name', tokens: ['What’s', 'your', 'name', '?'] },
    { type: 'fill_blank', instructionKey: 'ep2FillInstruction', before: 'My name is', after: '.', hintKey: 'ep2FillHint', itemId: 'my_name_is' },
    { type: 'free_reply', speaker: 'lingua', promptEn: 'I’m {partner}.', instructionKey: 'ep2AskInstruction',
      evalKind: 'ask_name', suggestionEn: 'What’s your name?', itemIds: ['whats_your_name'] },
    { type: 'comprehension', variation: true, instructionKey: 'ep2VariationInstruction', target: 'My name is Sam.', itemId: 'my_name_is',
      options: [{ key: 'ep2VarOptCorrect', correct: true }, { key: 'ep2VarOptWrong1' }, { key: 'ep2VarOptWrong2' }] },
    { type: 'recall', instructionKey: 'ep2RecallAskInstruction', evalKind: 'ask_name', itemIds: ['whats_your_name'] },
    { type: 'completion', canDoNameKey: 'ep2CanDoName', titleKey: 'ep2CloseTitle', bodyKey: 'ep2CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

const GREETINGS_03 = {
  id: 'nice_to_meet',
  level: 'Pre-A1',
  titleKey: 'ep3Title',
  goalKey: 'ep3Goal',
  canDoId: 'full_greeting',
  canDoNameKey: 'ep3CanDoName',
  durationKey: 'ep3Duration',
  estimatedMinutes: 8,
  xp: 55,
  prerequisites: ['ask_name'],
  targetItems: ['nice_to_meet'],
  reviewItems: ['hi', 'im', 'whats_your_name', 'my_name_is'],
  gardenItems: ['nice_to_meet', 'my_name_is', 'name'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'ep3RecallInstruction', evalKind: 'introduction', itemIds: ['im'] },
    { type: 'scene', mood: 'welcoming', titleKey: 'ep3SceneTitle', bodyKey: 'ep3SceneBody', ctaKey: 'ep1Continue' },
    { type: 'comprehension', instructionKey: 'ep3ComprehensionInstruction', target: 'Hi! What’s your name?', itemId: 'whats_your_name',
      options: [{ key: 'ep3CompOptCorrect', correct: true }, { key: 'ep3CompOptWrong1' }, { key: 'ep3CompOptWrong2' }] },
    { type: 'choice', instructionKey: 'ep3ChoiceInstruction', promptEn: 'What’s your name?', itemId: 'my_name_is',
      options: [{ textEn: 'My name is {name}.', correct: true }, { textEn: 'Name {name}.' }, { textEn: 'I name {name}.' }] },
    { type: 'word_order', instructionKey: 'ep3BuildInstruction', hintKey: 'ep1BuildHint', itemId: 'nice_to_meet', tokens: ['Nice', 'to', 'meet', 'you', '.'] },
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Hi! I’m {partner}. What’s your name?', instructionKey: 'ep3RoleplayIntro',
      evalKind: 'introduction', suggestionEn: 'Hi, I’m {name}.', itemIds: ['hi', 'im'] },
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Nice to meet you!', instructionKey: 'ep3RoleplayClose',
      evalKind: 'nice_to_meet', suggestionEn: 'Nice to meet you too.', itemIds: ['nice_to_meet'] },
    { type: 'comprehension', variation: true, instructionKey: 'ep3VariationInstruction', target: 'My name is Sam. Nice to meet you.', itemId: 'nice_to_meet',
      options: [{ key: 'ep3VarOptCorrect', correct: true }, { key: 'ep3VarOptWrong1' }, { key: 'ep3VarOptWrong2' }] },
    { type: 'recall', instructionKey: 'ep3FinalInstruction', evalKind: 'introduction', itemIds: ['im', 'hi'] },
    { type: 'completion', canDoNameKey: 'ep3CanDoName', titleKey: 'ep3CloseTitle', bodyKey: 'ep3CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

export const ARC = [GREETINGS_01, GREETINGS_02, GREETINGS_03]
export const getEpisode = (id) => ARC.find(e => e.id === id) || null
export const firstEpisode = () => ARC[0]
