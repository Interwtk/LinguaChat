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

/* ============================================================================
 * Second Pre-A1 arc — "connect": how you are, where you are from, and the first
 * short full conversation. Each episode opens by recovering something from the
 * first arc, so the two arcs read as one continuing story rather than two lists.
 * ==========================================================================*/

const CONNECT_01 = {
  id: 'how_are_you',
  arc: 'connect',
  level: 'Pre-A1',
  titleKey: 'ep4Title',
  goalKey: 'ep4Goal',
  canDoId: 'ask_wellbeing',
  canDoNameKey: 'ep4CanDoName',
  durationKey: 'ep4Duration',
  estimatedMinutes: 7,
  xp: 50,
  prerequisites: ['nice_to_meet'],
  targetItems: ['how_are_you', 'im_good', 'and_you', 'im_feeling_pattern'],
  reviewItems: ['hi', 'im'],
  gardenItems: ['how_are_you', 'im_good', 'and_you', 'good', 'fine', 'tired', 'im_feeling_pattern'],
  steps: [
    // 1. recover the first arc before adding anything new
    { type: 'recall', review: true, instructionKey: 'ep4RecallInstruction', evalKind: 'introduction', itemIds: ['im'] },
    { type: 'scene', mood: 'welcoming', titleKey: 'ep4SceneTitle', bodyKey: 'ep4SceneBody', showGoal: true, ctaKey: 'ep1Continue' },
    { type: 'model', target: 'Hi! How are you?', response: 'I’m good, thanks.', meaningItems: ['how_are_you', 'im_good'], explainKey: 'ep4ModelExplain' },
    { type: 'comprehension', instructionKey: 'ep4ComprehensionInstruction', target: 'How are you?', itemId: 'how_are_you',
      options: [{ key: 'ep4CompOptCorrect', correct: true }, { key: 'ep4CompOptWrong1' }, { key: 'ep4CompOptWrong2' }] },
    { type: 'word_order', instructionKey: 'ep4BuildInstruction', hintKey: 'ep1BuildHint', itemId: 'how_are_you', tokens: ['How', 'are', 'you', '?'] },
    // every feeling is a valid answer — no option here is "wrong"
    { type: 'choice', instructionKey: 'ep4ChoiceInstruction', promptEn: 'How are you?', itemId: 'im_good', allValid: true,
      options: [{ textEn: 'I’m good.', correct: true }, { textEn: 'I’m fine.', correct: true }, { textEn: 'I’m tired.', correct: true }] },
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Hi {name}! How are you?', instructionKey: 'ep4AnswerInstruction',
      evalKind: 'answer_wellbeing', suggestionEn: 'I’m good.', itemIds: ['im_good', 'good'] },
    { type: 'free_reply', speaker: 'lingua', promptEn: 'I’m {partner}. Nice to see you!', instructionKey: 'ep4AskInstruction',
      evalKind: 'ask_wellbeing', suggestionEn: 'How are you?', itemIds: ['how_are_you'] },
    { type: 'free_reply', variation: true, sceneEn: 'I’m good, thanks.', instructionKey: 'ep4BounceInstruction',
      evalKind: 'reciprocal_question', suggestionEn: 'And you?', itemIds: ['and_you'] },
    { type: 'recall', instructionKey: 'ep4FinalInstruction', evalKind: 'ask_wellbeing', itemIds: ['how_are_you'] },
    { type: 'completion', canDoNameKey: 'ep4CanDoName', titleKey: 'ep4CloseTitle', bodyKey: 'ep4CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

const CONNECT_02 = {
  id: 'where_from',
  arc: 'connect',
  level: 'Pre-A1',
  titleKey: 'ep5Title',
  goalKey: 'ep5Goal',
  canDoId: 'ask_origin',
  canDoNameKey: 'ep5CanDoName',
  durationKey: 'ep5Duration',
  estimatedMinutes: 8,
  xp: 55,
  prerequisites: ['how_are_you'],
  targetItems: ['where_from', 'im_from', 'im_from_pattern'],
  reviewItems: ['im', 'whats_your_name', 'how_are_you'],
  gardenItems: ['where_from', 'im_from', 'from', 'what_about_you', 'im_from_pattern'],
  steps: [
    { type: 'recall', review: true, instructionKey: 'ep5RecallInstruction', evalKind: 'introduction', itemIds: ['im'] },
    { type: 'scene', mood: 'welcoming', titleKey: 'ep5SceneTitle', bodyKey: 'ep5SceneBody', showGoal: true, ctaKey: 'ep1Continue' },
    { type: 'model', target: 'Where are you from?', response: 'I’m from {partnerPlace}.', meaningItems: ['where_from', 'im_from'], explainKey: 'ep5ModelExplain' },
    { type: 'comprehension', instructionKey: 'ep5ComprehensionInstruction', target: 'Where are you from?', itemId: 'where_from',
      options: [{ key: 'ep5CompOptCorrect', correct: true }, { key: 'ep5CompOptWrong1' }, { key: 'ep5CompOptWrong2' }] },
    { type: 'word_order', instructionKey: 'ep5BuildInstruction', hintKey: 'ep1BuildHint', itemId: 'where_from', tokens: ['Where', 'are', 'you', 'from', '?'] },
    // the learner supplies their own place here; it is remembered for later
    // steps and never validated geographically
    { type: 'fill_blank', instructionKey: 'ep5FillInstruction', before: 'I’m from', after: '.', hintKey: 'ep5FillHint',
      itemId: 'im_from', captureFact: 'place', placeholderKey: 'ep5PlacePlaceholder' },
    { type: 'free_reply', speaker: 'lingua', promptEn: 'I’m from {partnerPlace}. Where are you from?', instructionKey: 'ep5AnswerInstruction',
      evalKind: 'answer_origin', suggestionEn: 'I’m from {place}.', itemIds: ['im_from', 'from'] },
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Nice! I love meeting new people.', instructionKey: 'ep5AskInstruction',
      evalKind: 'ask_origin', suggestionEn: 'Where are you from?', itemIds: ['where_from'] },
    { type: 'free_reply', variation: true, sceneEn: 'I’m from {partnerPlace}.', instructionKey: 'ep5BounceInstruction',
      evalKind: 'reciprocal_question', suggestionEn: 'What about you?', itemIds: ['what_about_you'] },
    { type: 'recall', instructionKey: 'ep5FinalInstruction', evalKind: 'answer_origin', itemIds: ['im_from'] },
    { type: 'completion', canDoNameKey: 'ep5CanDoName', titleKey: 'ep5CloseTitle', bodyKey: 'ep5CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

const CONNECT_03 = {
  id: 'first_conversation',
  arc: 'connect',
  level: 'Pre-A1',
  titleKey: 'ep6Title',
  goalKey: 'ep6Goal',
  canDoId: 'full_conversation',
  canDoNameKey: 'ep6CanDoName',
  durationKey: 'ep6Duration',
  estimatedMinutes: 10,
  xp: 70,
  prerequisites: ['where_from'],
  targetItems: ['hi', 'im', 'whats_your_name', 'nice_to_meet', 'how_are_you', 'where_from'],
  reviewItems: ['im', 'whats_your_name', 'nice_to_meet', 'how_are_you', 'where_from'],
  gardenItems: ['how_are_you', 'where_from', 'nice_to_meet'],
  // Deliberately conversation-first: one short scene, then a real exchange of
  // turns instead of a deck of cards.
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'ep6SceneTitle', bodyKey: 'ep6SceneBody', showGoal: true, ctaKey: 'ep6Start' },
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Hi there!', instructionKey: 'ep6TurnGreet',
      evalKind: 'introduction', suggestionEn: 'Hi, I’m {name}.', itemIds: ['hi', 'im'] },
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Nice to meet you!', instructionKey: 'ep6TurnAskName',
      evalKind: 'ask_name', suggestionEn: 'What’s your name?', itemIds: ['whats_your_name'] },
    { type: 'free_reply', speaker: 'lingua', promptEn: 'I’m {partner}. Nice to meet you.', instructionKey: 'ep6TurnNice',
      evalKind: 'nice_to_meet', suggestionEn: 'Nice to meet you too.', itemIds: ['nice_to_meet'] },
    { type: 'free_reply', speaker: 'lingua', promptEn: 'So… we just met!', instructionKey: 'ep6TurnAskWellbeing',
      evalKind: 'ask_wellbeing', suggestionEn: 'How are you?', itemIds: ['how_are_you'] },
    { type: 'free_reply', speaker: 'lingua', promptEn: 'I’m good, thanks. And you?', instructionKey: 'ep6TurnAnswerWellbeing',
      evalKind: 'answer_wellbeing', suggestionEn: 'I’m good.', itemIds: ['im_good'] },
    { type: 'free_reply', speaker: 'lingua', promptEn: 'I’m from {partnerPlace}.', instructionKey: 'ep6TurnAskOrigin',
      evalKind: 'ask_origin', suggestionEn: 'Where are you from?', itemIds: ['where_from'] },
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Oh, nice! Tell me about you.', instructionKey: 'ep6TurnAnswerOrigin',
      evalKind: 'answer_origin', suggestionEn: 'I’m from {place}.', itemIds: ['im_from'] },
    // final challenge: one turn that carries the conversation, no model shown
    { type: 'recall', instructionKey: 'ep6FinalInstruction', evalKind: 'full_intro_conversation', itemIds: ['im', 'how_are_you'] },
    { type: 'completion', canDoNameKey: 'ep6CanDoName', titleKey: 'ep6CloseTitle', bodyKey: 'ep6CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

GREETINGS_01.arc = 'greetings'
GREETINGS_02.arc = 'greetings'
GREETINGS_03.arc = 'greetings'

export const ARC = [GREETINGS_01, GREETINGS_02, GREETINGS_03, CONNECT_01, CONNECT_02, CONNECT_03]
export const ARCS = ['greetings', 'connect']
export const getEpisode = (id) => ARC.find(e => e.id === id) || null
export const firstEpisode = () => ARC[0]
export const episodesInArc = (arcId) => ARC.filter(e => e.arc === arcId)
