/*
 * B1 arc 3 — "which_one" (docs/curriculum/blueprints/b1.json, arc order 3).
 *
 * Four episodes teaching B1's three new comparison/description can-dos:
 *   compare_options_with_reasons — compare more than two things, justify a choice
 *   describe_an_experience       — describe a place/event richly, including a feeling
 *   recommend_or_warn (should)   — recommend or warn based on the above two
 * and reinforcing A2's `compare_two_things`/`describe_a_person_or_place` plus
 * B1's own `give_an_opinion` (the arc's `a2Reuse`/`b1Reuse` entries).
 *
 * Self-contained for the same reason arc 1/2 are — see arc 1's file header.
 *
 * MINI-STORY (b1.json arc 3 `miniStory.use: true`): implemented as ordinary
 * `scene`/`model` steps inside episode 2, exactly like arc 1's episode 3 did —
 * not the shared `engine/miniStory.js` STORIES table, which this task cannot
 * register a level-owned entry into (out of write scope).
 */

const ARC = 'which_one'
const LEVEL = 'B1'

const B1_EP1 = {
  id: 'more_than_two',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep7Title',
  goalKey: 'b1Ep7Goal',
  canDoId: 'compare_options_with_reasons',
  canDoNameKey: 'b1Ep7CanDoName',
  durationKey: 'b1Ep7Duration',
  estimatedMinutes: 9,
  xp: 85,
  prerequisites: [],
  // A2's own capability, per b1.json arcs[2].a2Reuse.
  skillPrerequisites: ['compare_two_things'],
  gardenItems: [
    'b1_more_than', 'b1_less_than', 'b1_the_most', 'b1_of_the_three',
    'b1_comparative_superlative_pattern', 'b1_multi_attribute_compare_pattern',
  ],
  reuseSkills: ['compare_two_things'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep7SceneTitle',
      sceneBodyKey: 'b1Ep7SceneBody',
    },
    {
      type: 'model',
      target: "The mountains are more relaxing than the beach, but the beach is more fun. Of the three, I think the lake is the most peaceful.",
      meaningItems: ['b1_more_than', 'b1_the_most', 'b1_of_the_three', 'b1_comparative_superlative_pattern', 'b1_multi_attribute_compare_pattern'],
      explainKey: 'b1Ep7ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep7ComprehensionInstruction',
      target: 'Which sentence compares more than two things and picks one?',
      itemId: 'b1_comparative_superlative_pattern',
      options: [
        { key: 'b1Ep7CompOptCorrect', correct: true },
        { key: 'b1Ep7CompOptWrong1' },
        { key: 'b1Ep7CompOptWrong2' },
      ],
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep7BlankInstruction',
      before: 'The mountains are ',
      after: ' than the beach.',
      expects: 'more relaxing',
      alternatives: ['more peaceful', 'more calming'],
      itemId: 'b1_comparative_superlative_pattern',
      hintKey: 'b1Ep7BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Compare three places you could go on holiday — a beach, a city, and the mountains, {name}. Which do you prefer, and why?',
      instructionKey: 'b1Ep7OpenInstruction',
      evalKind: 'compare_and_choose',
      suggestionEn: "The city is busier than the countryside, but it's more exciting. Of the three, I think the coast is the most relaxing.",
      itemIds: ['b1_more_than', 'b1_the_most', 'b1_of_the_three', 'b1_comparative_superlative_pattern'],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Now compare three restaurants, cafés or shops you know. Which is the best, and why?',
      instructionKey: 'b1Ep7OpenInstruction2',
      evalKind: 'compare_and_choose',
      // no suggestionEn: this arc's evidenceTarget "one unaided multi-option
      // comparison"
      itemIds: ['b1_less_than', 'b1_multi_attribute_compare_pattern'],
    },
  ],
}

const B1_EP2 = {
  id: 'the_trip_i_took',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep8Title',
  goalKey: 'b1Ep8Goal',
  canDoId: 'describe_an_experience',
  canDoNameKey: 'b1Ep8CanDoName',
  durationKey: 'b1Ep8Duration',
  estimatedMinutes: 10,
  xp: 90,
  prerequisites: [],
  skillPrerequisites: ['describe_a_person_or_place'],
  gardenItems: [
    'b1_multi_attribute_description_pattern', 'b1_feeling_reaction_pattern',
    'b1_it_made_me_feel', 'b1_i_felt', 'b1_peaceful', 'b1_exhausting', 'b1_unforgettable',
  ],
  reuseSkills: ['describe_a_person_or_place'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep8SceneTitle',
      sceneBodyKey: 'b1Ep8SceneBody',
    },
    {
      // mini-story, told as an ordinary model step (see file header)
      type: 'model',
      target: 'Last month I went to the coast. It was quiet, beautiful, and relaxing. It made me feel really peaceful.',
      meaningItems: ['b1_multi_attribute_description_pattern', 'b1_feeling_reaction_pattern', 'b1_it_made_me_feel', 'b1_peaceful'],
      explainKey: 'b1Ep8ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep8ComprehensionInstruction',
      target: 'Which sentence uses three attributes to describe a place?',
      itemId: 'b1_multi_attribute_description_pattern',
      options: [
        { key: 'b1Ep8CompOptCorrect', correct: true },
        { key: 'b1Ep8CompOptWrong1' },
        { key: 'b1Ep8CompOptWrong2' },
      ],
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep8BlankInstruction',
      before: 'The concert was amazing. ',
      after: ' so happy.',
      expects: 'It made me feel',
      alternatives: ['I felt'],
      itemId: 'b1_it_made_me_feel',
      hintKey: 'b1Ep8BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Describe a place or trip you experienced recently, {name} — what was it like, and how did it make you feel?',
      instructionKey: 'b1Ep8OpenInstruction',
      evalKind: 'describe_experience',
      suggestionEn: 'It was quiet, beautiful, and relaxing. It made me feel really peaceful.',
      itemIds: ['b1_multi_attribute_description_pattern', 'b1_feeling_reaction_pattern', 'b1_i_felt'],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Now describe an event you went to recently — a concert, a party, a match, anything. What was it like?',
      instructionKey: 'b1Ep8OpenInstruction2',
      evalKind: 'describe_experience',
      // no suggestionEn: this arc's evidenceTarget wants two unaided
      // descriptions, split across this episode and the arc's close
      itemIds: ['b1_exhausting', 'b1_unforgettable'],
    },
  ],
}

const B1_EP3 = {
  id: 'id_recommend',
  arc: ARC,
  level: LEVEL,
  role: 'primary',
  titleKey: 'b1Ep9Title',
  goalKey: 'b1Ep9Goal',
  canDoId: 'recommend_or_warn',
  canDoNameKey: 'b1Ep9CanDoName',
  durationKey: 'b1Ep9Duration',
  estimatedMinutes: 8,
  xp: 85,
  prerequisites: ['more_than_two', 'the_trip_i_took'],
  skillPrerequisites: [],
  gardenItems: ['b1_id_recommend', 'b1_i_wouldnt_recommend', 'b1_recommend_warn_pattern', 'b1_id_avoid'],
  reuseSkills: ['compare_options_with_reasons', 'describe_an_experience'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep9SceneTitle',
      sceneBodyKey: 'b1Ep9SceneBody',
    },
    {
      type: 'model',
      target: "I'd recommend the coast, because it's quiet and relaxing. I wouldn't recommend the city in summer, because it's too busy.",
      meaningItems: ['b1_id_recommend', 'b1_i_wouldnt_recommend', 'b1_recommend_warn_pattern'],
      explainKey: 'b1Ep9ModelExplain',
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep9ComprehensionInstruction',
      target: 'Which sentence warns against something, with a reason?',
      itemId: 'b1_recommend_warn_pattern',
      options: [
        { key: 'b1Ep9CompOptCorrect', correct: true },
        { key: 'b1Ep9CompOptWrong1' },
        { key: 'b1Ep9CompOptWrong2' },
      ],
    },
    {
      type: 'fill_blank',
      instructionKey: 'b1Ep9BlankInstruction',
      before: '',
      after: ' the mountains in winter, because the roads are dangerous.',
      expects: "I wouldn't recommend",
      alternatives: ['I would not recommend'],
      itemId: 'b1_i_wouldnt_recommend',
      hintKey: 'b1Ep9BlankHint',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Recommend a place you know well, {name}, and say why.',
      instructionKey: 'b1Ep9OpenInstruction',
      evalKind: 'recommend_or_warn',
      suggestionEn: "I'd recommend the coast, because it's quiet and relaxing.",
      itemIds: ['b1_id_recommend', 'b1_recommend_warn_pattern'],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Now warn me about somewhere or something to avoid, and say why.',
      instructionKey: 'b1Ep9OpenInstruction2',
      evalKind: 'recommend_or_warn',
      // no suggestionEn: this arc's evidenceTarget "one unaided
      // recommendation and one unaided warning"
      itemIds: ['b1_i_wouldnt_recommend', 'b1_id_avoid'],
    },
  ],
}

const B1_EP4 = {
  id: 'the_perfect_trip',
  arc: ARC,
  level: LEVEL,
  role: 'reinforcement',
  reinforces: true,
  titleKey: 'b1Ep10Title',
  goalKey: 'b1Ep10Goal',
  canDoId: 'recommend_or_warn',
  canDoNameKey: 'b1Ep10CanDoName',
  durationKey: 'b1Ep10Duration',
  estimatedMinutes: 9,
  xp: 95,
  prerequisites: ['more_than_two', 'the_trip_i_took', 'id_recommend'],
  skillPrerequisites: [],
  gardenItems: [],
  // combines all three new can-dos in one exchange, per b1.json arc 3's
  // autonomyTarget ("recommendation keeps a hint the longest")
  reuseSkills: ['compare_options_with_reasons', 'describe_an_experience', 'recommend_or_warn'],
  steps: [
    {
      type: 'scene',
      sceneTitleKey: 'b1Ep10SceneTitle',
      sceneBodyKey: 'b1Ep10SceneBody',
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Compare three holiday destinations and tell me which you prefer, and why.',
      instructionKey: 'b1Ep10OpenInstruction',
      evalKind: 'compare_and_choose',
      // no suggestionEn: description support fades first (autonomyTarget)
      itemIds: ['b1_the_most', 'b1_multi_attribute_compare_pattern'],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Now describe a place you visited that really stood out — what was it like, and how did it make you feel?',
      instructionKey: 'b1Ep10OpenInstruction2',
      evalKind: 'describe_experience',
      // second unaided description, completing the arc's "two unaided rich
      // descriptions" evidenceTarget
      itemIds: ['b1_multi_attribute_description_pattern', 'b1_feeling_reaction_pattern'],
    },
    {
      type: 'comprehension',
      instructionKey: 'b1Ep10ComprehensionInstruction',
      target: 'A good recommendation always includes what?',
      itemId: 'b1_recommend_warn_pattern',
      options: [
        { key: 'b1Ep10CompOptCorrect', correct: true },
        { key: 'b1Ep10CompOptWrong1' },
        { key: 'b1Ep10CompOptWrong2' },
      ],
    },
    {
      type: 'free_reply',
      speaker: 'lingua',
      promptEn: 'Based on your comparison, recommend or warn me about one of those places. No help this time.',
      instructionKey: 'b1Ep10OpenInstruction3',
      evalKind: 'recommend_or_warn',
      // capstone close, unaided by design — recommendation keeps a hint the
      // longest, but the arc's own capstone still withholds it
      itemIds: ['b1_id_recommend', 'b1_i_wouldnt_recommend'],
    },
  ],
}

export const B1_ARC3 = [B1_EP1, B1_EP2, B1_EP3, B1_EP4]
export const B1_ARC3_ID = ARC
export const getB1Arc3Episode = (id) => B1_ARC3.find(ep => ep.id === id) || null
