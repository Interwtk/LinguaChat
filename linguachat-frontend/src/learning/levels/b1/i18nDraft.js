/*
 * b1/i18nDraft — draft English copy for every key B1's episodes/evaluators
 * reference, keyed exactly like `src/i18n/translations.js`.
 *
 * `src/i18n/**` is out of this task's write scope (see the file header of
 * `episodes/b1Arc1.js`), so this is NOT a locale file the app loads — it is
 * this task's own source of truth for what English copy each key means, and
 * `scripts/foundry/b1/check-b1-arc1.mjs` asserts every key an arc step or
 * evaluator references resolves here, catching a typo'd key now instead of at
 * `LC-INT-001` merge time. `LC-INT-001` copies these into `translations.js`
 * (English) and originates the other seven locale files' translations from
 * them, exactly as A1's own keys were added.
 *
 * Grows one arc at a time.
 */
export const B1_ARC1_COPY = {
  // episode 1 — one_thing_after_another
  b1Ep1Title: 'One Thing After Another',
  b1Ep1Goal: 'Tell a story that connects, one step to the next.',
  b1Ep1CanDoName: 'Tell a connected story',
  b1Ep1Duration: '9 min',
  b1Ep1SceneTitle: 'Not just facts — a story',
  b1Ep1SceneBody: "You already know how to say what you did. Today, let's connect it: first this, then that.",
  b1Ep1ModelExplain: '"First", "then", "after that" and "finally" put events in order for your listener.',
  b1Ep1ComprehensionInstruction: 'Which sentence correctly continues a story, in order?',
  b1Ep1CompOptCorrect: 'Then I had breakfast.',
  b1Ep1CompOptWrong1: 'I have breakfast every day.',
  b1Ep1CompOptWrong2: 'Breakfast is my favorite meal.',
  b1Ep1OrderInstruction: 'Put the words in order.',
  b1Ep1OrderHint: 'The connector comes first, then a comma.',
  b1Ep1BlankInstruction: 'Complete the story with the right connector.',
  b1Ep1BlankHint: 'It comes right after "first".',
  b1Ep1OpenInstruction: 'Tell your story using at least two connectors.',

  // episode 2 — when_it_happened
  b1Ep2Title: 'When It Happened',
  b1Ep2Goal: 'Say what was happening when something else happened.',
  b1Ep2CanDoName: 'Describe an interrupted action',
  b1Ep2Duration: '10 min',
  b1Ep2SceneTitle: 'Right in the middle of something',
  b1Ep2SceneBody: 'Some stories need two things happening at once — one going on, and one that breaks in.',
  b1Ep2ModelExplain: '"Was/were + -ing" is something already in progress; "when/while" connects it to what interrupted it.',
  b1Ep2ComprehensionInstruction: 'Which sentence describes something already happening when something else happened?',
  b1Ep2CompOptCorrect: 'I was walking home when it started to rain.',
  b1Ep2CompOptWrong1: 'I walked home and then it rained.',
  b1Ep2CompOptWrong2: 'It rains a lot in my city.',
  b1Ep2OrderInstruction: 'Put the words in order.',
  b1Ep2OrderHint: '"Was/were" comes right after the subject.',
  b1Ep2BlankInstruction: 'Complete the sentence.',
  b1Ep2BlankHint: 'One word: the past continuous of "be" for "I".',
  b1Ep2OpenInstruction: 'What was happening when something surprising happened?',
  b1Ep2OpenInstruction2: 'Now a different moment — no model this time, just your own words.',

  // episode 3 — the_whole_story
  b1Ep3Title: 'The Whole Story',
  b1Ep3Goal: 'Tell a longer story that connects events and includes an interruption.',
  b1Ep3CanDoName: 'Tell a complete story',
  b1Ep3Duration: '9 min',
  b1Ep3SceneTitle: 'Put it all together',
  b1Ep3SceneBody: "One more story — this time, use everything: a sequence, and a moment when something else happened.",
  b1Ep3OpenInstruction: 'Tell a story using connectors, and include one interruption.',
  b1Ep3ComprehensionInstruction: 'In a good story, where does an interruption usually fit?',
  b1Ep3CompOptCorrect: 'In the middle of something else that was already happening',
  b1Ep3CompOptWrong1: 'Always at the very beginning',
  b1Ep3CompOptWrong2: 'It never fits in a story',
  b1Ep3OpenInstruction2: 'One more time, completely on your own — no model shown.',

  // evaluator copy — narrate_past_event (sequence)
  b1RetryPromptSequenceEmpty: 'Tell me what happened — start with "First..."',
  b1RetryExplainSequenceTense: 'This already happened, so use the past: "I went", not "I go".',
  b1RetryPromptSequenceTense: 'Try again, in the past this time.',
  b1PraiseSequenceIndependent: "Great — that's a real connected story, in your own words.",
  b1PraiseSequenceHelped: 'Nice — you connected the events clearly.',
  b1RetryExplainSequenceMore: 'Good start — now add at least one more connector, like "then" or "after that".',
  b1RetryPromptSequenceMore: 'Add another step to your story.',
  b1RetryExplainSequenceConnector: 'You told me what happened, but not the order — try "first... then...".',
  b1RetryPromptSequenceConnector: 'Use a connector to show the order.',

  // evaluator copy — narrate_past_event (interruption)
  b1RetryPromptInterruptionEmpty: 'Tell me what was happening when it happened.',
  b1PraiseInterruptionIndependent: "Perfect — you showed exactly what was going on when it happened.",
  b1PraiseInterruptionHelped: 'Good — that shows the two actions clearly.',
  b1RetryExplainInterruptionConnector: 'Good use of "was/were" — now connect it with "when" or "while".',
  b1RetryPromptInterruptionConnector: 'Add "when" or "while" to connect the two actions.',
  b1RetryExplainInterruptionForm: 'For an ongoing action, use "was/were" + "-ing": "I was cooking when...".',
  b1RetryPromptInterruptionForm: 'Try describing what was already happening.',
}

export const B1_ARC2_COPY = {
  // episode 4 — what_i_think
  b1Ep4Title: 'What I Think',
  b1Ep4Goal: 'State an opinion and give a reason for it.',
  b1Ep4CanDoName: 'Give an opinion',
  b1Ep4Duration: '8 min',
  b1Ep4SceneTitle: 'Not just facts — your view',
  b1Ep4SceneBody: "You already know how to give a reason for an opinion about yourself. Now let's use that for opinions about anything.",
  b1Ep4ModelExplain: '"I think that" and "in my opinion" introduce a view; "because" gives the reason behind it.',
  b1Ep4ComprehensionInstruction: 'Which sentence gives an opinion, not just a fact?',
  b1Ep4CompOptCorrect: 'I think that weekend trips are a great idea.',
  b1Ep4CompOptWrong1: 'The train leaves at nine.',
  b1Ep4CompOptWrong2: 'Weekend trips usually last two days.',
  b1Ep4BlankInstruction: 'Complete the sentence with an opinion frame.',
  b1Ep4BlankHint: 'Three words, then the rest of the sentence.',
  b1Ep4OpenInstruction: 'Give your opinion and a reason.',
  b1Ep4OpenInstruction2: 'Now a different topic — no model this time, just your own words.',

  // episode 5 — agree_to_disagree
  b1Ep5Title: 'Agree to Disagree',
  b1Ep5Goal: "Agree or disagree with someone else's opinion, politely, with a reason.",
  b1Ep5CanDoName: 'Agree or disagree',
  b1Ep5Duration: '9 min',
  b1Ep5SceneTitle: 'A real exchange',
  b1Ep5SceneBody: "An opinion nobody can respond to is just a monologue. Let's make it a conversation.",
  b1Ep5ModelExplain: '"I agree" or "I don\'t think so" always come with a reason, the same way your own opinions do.',
  b1Ep5ComprehensionInstruction: 'Which reply politely disagrees, with a reason?',
  b1Ep5CompOptCorrect: "I don't think so, because I prefer to go at my own pace.",
  b1Ep5CompOptWrong1: 'Team sports have eleven players.',
  b1Ep5CompOptWrong2: 'No.',
  b1Ep5BlankInstruction: 'Complete the sentence.',
  b1Ep5BlankHint: 'Two words that show you share the opinion.',
  b1Ep5OpenInstruction: 'Say whether you agree or disagree, and why.',
  b1Ep5OpenInstruction2: 'One more — a different opinion, no model this time.',

  // episode 6 — having_a_real_exchange
  b1Ep6Title: 'Having a Real Exchange',
  b1Ep6Goal: 'Give an opinion, then respond to someone else\'s, in one exchange.',
  b1Ep6CanDoName: 'Hold an opinion exchange',
  b1Ep6Duration: '8 min',
  b1Ep6SceneTitle: 'Put it all together',
  b1Ep6SceneBody: "One more exchange — this time, give your own opinion and then respond to someone else's.",
  b1Ep6OpenInstruction: 'Give your opinion and a reason.',
  b1Ep6ComprehensionInstruction: 'When someone disagrees politely, what do they always add?',
  b1Ep6CompOptCorrect: 'A reason for their view',
  b1Ep6CompOptWrong1: 'Nothing — just "no"',
  b1Ep6CompOptWrong2: 'A question back',
  b1Ep6OpenInstruction2: 'Now agree or disagree, completely on your own — no model shown.',

  // evaluator copy — state_opinion
  b1RetryPromptOpinionEmpty: 'Tell me what you think — start with "I think that..."',
  b1PraiseOpinionIndependent: "Great — that's a real opinion, with your own reason.",
  b1PraiseOpinionHelped: 'Nice — you stated an opinion and gave a reason.',
  b1RetryExplainOpinionReason: 'Good opinion — now add "because" and say why.',
  b1RetryPromptOpinionReason: 'Add a reason with "because".',
  b1RetryExplainOpinionFrame: 'You gave a reason, but not the opinion itself — try "I think that... because...".',
  b1RetryPromptOpinionFrame: 'Start with "I think that" or "in my opinion".',

  // evaluator copy — agree_or_disagree
  b1RetryPromptAgreeEmpty: 'Tell me if you agree or disagree, and why.',
  b1PraiseAgreeIndependent: "Perfect — you took a clear position, with a reason.",
  b1PraiseAgreeHelped: 'Good — that shows agreement or disagreement clearly.',
  b1RetryExplainAgreeReason: 'Good — now add "because" and say why.',
  b1RetryPromptAgreeReason: 'Add a reason with "because".',
  b1RetryExplainAgreeStance: 'You gave a reason, but not whether you agree — try "I agree..." or "I don\'t think so...".',
  b1RetryPromptAgreeStance: 'Start with "I agree" or "I don\'t think so".',
}

export const B1_ARC3_COPY = {
  // episode 7 — more_than_two
  b1Ep7Title: 'More Than Two',
  b1Ep7Goal: 'Compare more than two things and choose one, with a reason.',
  b1Ep7CanDoName: 'Compare options',
  b1Ep7Duration: '9 min',
  b1Ep7SceneTitle: 'So many choices',
  b1Ep7SceneBody: "You already know how to compare two things. Now let's compare several, and pick one.",
  b1Ep7ModelExplain: '"More/less ... than" and "the most" let you compare several things and pick a winner.',
  b1Ep7ComprehensionInstruction: 'Which sentence compares more than two things and picks one?',
  b1Ep7CompOptCorrect: 'Of the three, I think the lake is the most peaceful.',
  b1Ep7CompOptWrong1: 'The lake is nice.',
  b1Ep7CompOptWrong2: 'There are three lakes near here.',
  b1Ep7BlankInstruction: 'Complete the comparison.',
  b1Ep7BlankHint: 'Two words: "more" plus an adjective.',
  b1Ep7OpenInstruction: 'Compare the three places and say which you prefer.',
  b1Ep7OpenInstruction2: 'Now a different set of three — no model this time.',

  // episode 8 — the_trip_i_took
  b1Ep8Title: 'The Trip I Took',
  b1Ep8Goal: 'Describe a place or event richly, including how it made you feel.',
  b1Ep8CanDoName: 'Describe an experience',
  b1Ep8Duration: '10 min',
  b1Ep8SceneTitle: 'More than just "nice"',
  b1Ep8SceneBody: "One attribute isn't enough to help someone decide. Let's paint a fuller picture.",
  b1Ep8ModelExplain: '"It was X, Y, and Z" lists several qualities; "it made me feel" or "I felt" adds the reaction.',
  b1Ep8ComprehensionInstruction: 'Which sentence uses three attributes to describe a place?',
  b1Ep8CompOptCorrect: 'It was quiet, beautiful, and relaxing.',
  b1Ep8CompOptWrong1: 'It was nice.',
  b1Ep8CompOptWrong2: 'I went there last month.',
  b1Ep8BlankInstruction: 'Complete the sentence.',
  b1Ep8BlankHint: 'Four words.',
  b1Ep8OpenInstruction: 'Describe the place or trip, and how it made you feel.',
  b1Ep8OpenInstruction2: 'Now describe an event — no model this time.',

  // episode 9 — id_recommend
  b1Ep9Title: "I'd Recommend",
  b1Ep9Goal: 'Recommend or warn based on a comparison or experience, with a reason.',
  b1Ep9CanDoName: 'Recommend or warn',
  b1Ep9Duration: '8 min',
  b1Ep9SceneTitle: 'Useful to someone else',
  b1Ep9SceneBody: 'A comparison or a description becomes really useful once it turns into advice.',
  b1Ep9ModelExplain: '"I\'d recommend" and "I wouldn\'t recommend" both need a reason to be useful advice.',
  b1Ep9ComprehensionInstruction: 'Which sentence warns against something, with a reason?',
  b1Ep9CompOptCorrect: "I wouldn't recommend the city in summer, because it's too busy.",
  b1Ep9CompOptWrong1: "I'd recommend the coast.",
  b1Ep9CompOptWrong2: 'The city is busy in summer.',
  b1Ep9BlankInstruction: 'Complete the warning.',
  b1Ep9BlankHint: 'Three words.',
  b1Ep9OpenInstruction: 'Recommend a place you know well, and say why.',
  b1Ep9OpenInstruction2: 'Now warn me about somewhere to avoid, and say why.',

  // episode 10 — the_perfect_trip
  b1Ep10Title: 'The Perfect Trip',
  b1Ep10Goal: 'Compare, describe, and recommend — all in one exchange.',
  b1Ep10CanDoName: 'Compare, describe, and recommend',
  b1Ep10Duration: '9 min',
  b1Ep10SceneTitle: 'Put it all together',
  b1Ep10SceneBody: "One more exchange — compare some options, describe one richly, and give your advice.",
  b1Ep10OpenInstruction: 'Compare three holiday destinations and say which you prefer.',
  b1Ep10OpenInstruction2: 'Now describe a place that really stood out, and how it made you feel.',
  b1Ep10ComprehensionInstruction: 'A good recommendation always includes what?',
  b1Ep10CompOptCorrect: 'A reason',
  b1Ep10CompOptWrong1: 'Just a place name',
  b1Ep10CompOptWrong2: 'A question',
  b1Ep10OpenInstruction3: 'Recommend or warn me about one of those places — no help this time.',

  // evaluator copy — compare_and_choose
  b1RetryPromptCompareEmpty: 'Tell me how they compare, and which one you prefer.',
  b1PraiseCompareIndependent: "Great — a real comparison, with a clear choice.",
  b1PraiseCompareHelped: 'Nice — that compares them and picks one.',
  b1RetryExplainCompareChoice: 'Good comparison — now say which one you prefer, like "the most..." or "I think...".',
  b1RetryPromptCompareChoice: 'Say which one you choose.',
  b1RetryExplainCompareComparison: 'You picked one, but you need to compare them first, like "more... than...".',
  b1RetryPromptCompareComparison: 'Compare them using "more/less ... than".',

  // evaluator copy — describe_experience
  b1RetryPromptDescribeEmpty: 'Tell me what it was like, and how it made you feel.',
  b1PraiseDescribeIndependent: "Great — a rich description, with a real reaction.",
  b1PraiseDescribeHelped: 'Nice — that describes it clearly with a feeling.',
  b1RetryExplainDescribeFeeling: 'Good description — now add how it made you feel.',
  b1RetryPromptDescribeFeeling: 'Add "it made me feel..." or "I felt...".',
  b1RetryExplainDescribeAttributes: 'You gave a feeling, but not what it was actually like — try "it was X, Y, and Z".',
  b1RetryPromptDescribeAttributes: 'Describe it with a few attributes first.',

  // evaluator copy — recommend_or_warn
  b1RetryPromptRecommendEmpty: 'Tell me whether you recommend it or not, and why.',
  b1PraiseRecommendIndependent: "Perfect — clear advice, with a real reason.",
  b1PraiseRecommendHelped: 'Good — that gives advice with a reason.',
  b1RetryExplainRecommendReason: 'Good — now add "because" and say why.',
  b1RetryPromptRecommendReason: 'Add a reason with "because".',
  b1RetryExplainRecommendStance: "You gave a reason, but not the advice itself — try \"I'd recommend...\" or \"I wouldn't recommend...\".",
  b1RetryPromptRecommendStance: "Start with \"I'd recommend\" or \"I wouldn't recommend\".",
}

export const B1_ARC4_COPY = {
  // episode 11 — somethings_not_right
  b1Ep11Title: "Something's Not Right",
  b1Ep11Goal: 'Explain a problem clearly enough for someone else to help.',
  b1Ep11CanDoName: 'Raise a problem',
  b1Ep11Duration: '9 min',
  b1Ep11SceneTitle: 'Not quite right',
  b1Ep11SceneBody: "You already know how to respond when someone tells you about a problem. Now let's raise one yourself.",
  b1Ep11ModelExplain: '"There\'s a problem with" names the issue; "I ordered X, but I got Y" says what was expected instead.',
  b1Ep11ComprehensionInstruction: 'Which sentence explains a problem clearly enough for someone else to help?',
  b1Ep11CompOptCorrect: "There's a problem with my order. I ordered fish, but I got chicken.",
  b1Ep11CompOptWrong1: 'This food is bad.',
  b1Ep11CompOptWrong2: "I don't like this.",
  b1Ep11BlankInstruction: 'Complete the sentence.',
  b1Ep11BlankHint: "Four words: \"there's a problem...\"",
  b1Ep11OpenInstruction: "Tell me what's wrong, and what you expected instead.",
  b1Ep11OpenInstruction2: 'Now a different problem — no model this time.',

  // episode 12 — lets_sort_this_out
  b1Ep12Title: "Let's Sort This Out",
  b1Ep12Goal: 'Ask for and negotiate a solution to a problem.',
  b1Ep12CanDoName: 'Negotiate a solution',
  b1Ep12Duration: '9 min',
  b1Ep12SceneTitle: 'Past the first offer',
  b1Ep12SceneBody: "Raising a problem is only half the job. Let's actually get it fixed.",
  b1Ep12ModelExplain: '"Would it be possible to..." and "could I possibly..." politely ask for a specific solution.',
  b1Ep12ComprehensionInstruction: 'Which sentence politely negotiates a solution, rather than just demanding one?',
  b1Ep12CompOptCorrect: 'Would it be possible to get a replacement instead?',
  b1Ep12CompOptWrong1: 'Give me a replacement now.',
  b1Ep12CompOptWrong2: "I'd like to buy another one.",
  b1Ep12BlankInstruction: 'Complete the sentence.',
  b1Ep12BlankHint: 'Three words: "Would it be..."',
  b1Ep12OpenInstruction: 'Ask for a solution to the problem.',
  b1Ep12OpenInstruction2: 'Now negotiate a different solution — no help this time.',

  // episode 13 — staying_calm
  b1Ep13Title: 'Staying Calm',
  b1Ep13Goal: 'Show mild frustration without being rude, and stay cooperative.',
  b1Ep13CanDoName: 'Express frustration politely',
  b1Ep13Duration: '7 min',
  b1Ep13SceneTitle: 'Annoyed, but still polite',
  b1Ep13SceneBody: "Real problems are sometimes frustrating. Let's say so, without losing the cooperative tone.",
  b1Ep13ModelExplain: '"This isn\'t ideal, but..." and "I understand, but..." show frustration while staying cooperative.',
  b1Ep13ComprehensionInstruction: 'Which response shows frustration while staying cooperative?',
  b1Ep13CompOptCorrect: "This isn't ideal, but I understand these things happen.",
  b1Ep13CompOptWrong1: 'This is ridiculous and unacceptable.',
  b1Ep13CompOptWrong2: "It's fine, don't worry about it.",
  b1Ep13BlankInstruction: 'Complete the sentence.',
  b1Ep13BlankHint: "Three words: \"This isn't...\"",
  b1Ep13OpenInstruction: 'Show how you feel about it — politely.',
  b1Ep13OpenInstruction2: 'One more time — no help this time.',

  // episode 14 — problem_solved
  b1Ep14Title: 'Problem Solved',
  b1Ep14Goal: 'Raise a problem and negotiate a solution, start to finish.',
  b1Ep14CanDoName: 'Sort out a problem, start to finish',
  b1Ep14Duration: '10 min',
  b1Ep14SceneTitle: 'One whole conversation',
  b1Ep14SceneBody: 'One more time — this time, the whole thing: the problem, the solution, and staying polite.',
  b1Ep14ModelExplain: 'A real negotiation moves from the problem, to a request for a solution, to a polite close.',
  b1Ep14OpenInstruction: 'Raise your own problem, start to finish.',
  b1Ep14ComprehensionInstruction: 'What should come right after you raise a problem, to actually resolve it?',
  b1Ep14CompOptCorrect: 'Ask for a specific solution',
  b1Ep14CompOptWrong1: 'Nothing — the problem is already clear',
  b1Ep14CompOptWrong2: 'Ask an unrelated question',
  b1Ep14OpenInstruction2: 'Now negotiate a solution to that same problem — completely on your own.',

  // evaluator copy — report_problem (neutral)
  b1RetryPromptProblemEmpty: "Tell me what's wrong, and what you expected instead.",
  b1PraiseProblemIndependent: 'Great — a clear problem, with what you expected.',
  b1PraiseProblemHelped: 'Nice — that names the problem and what was expected.',
  b1RetryExplainProblemExpectation: 'Good — now say what you expected instead.',
  b1RetryPromptProblemExpectation: 'Add what you expected, or ordered, instead.',
  b1RetryExplainProblemStatement: "You said what you expected, but not what's wrong — try \"there's a problem with...\".",
  b1RetryPromptProblemStatement: "Start with \"there's a problem with...\".",
  b1RetryExplainProblemHarsh: 'Try saying it a little more calmly — the person helping you is not the cause.',
  b1RetryPromptProblemHarsh: 'Try again, a bit more politely.',

  // evaluator copy — report_problem (frustrated tone)
  b1PraiseFrustrationIndependent: 'Perfect — you showed you were frustrated, but stayed cooperative.',
  b1PraiseFrustrationHelped: 'Good — that stays polite while showing frustration.',
  b1RetryExplainFrustrationDetail: 'Good tone — now add what actually went wrong.',
  b1RetryPromptFrustrationDetail: 'Say what the problem actually is.',
  b1RetryExplainFrustrationMarker: 'You named the problem, but not how you feel — try "this isn\'t ideal, but...".',
  b1RetryPromptFrustrationMarker: 'Add "this isn\'t ideal, but..." or "I understand, but...".',

  // evaluator copy — negotiate_solution
  b1RetryPromptNegotiateEmpty: 'Ask for a solution — a replacement, a refund, anything that would help.',
  b1PraiseNegotiateIndependent: 'Great — a real, polite negotiation.',
  b1PraiseNegotiateHelped: 'Nice — that politely asks for a solution.',
  b1RetryExplainNegotiateSpeechAct: "That's an offer to buy something new, not a request for a solution — try \"would it be possible to...\".",
  b1RetryExplainNegotiateDemand: 'That works, but sounds like a demand — try a softer frame like "would it be possible to...".',
  b1RetryExplainNegotiateUnderdeveloped: 'Good start — now make it a full, polite request, like "would it be possible to..." or "could I possibly...".',
  b1RetryPromptNegotiateFrame: 'Try "would it be possible to..." or "could I possibly...".',
}
