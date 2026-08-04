export const LANGUAGE_OPTIONS = [
  { code: 'es', label: 'Espanol', nativeName: 'Español' },
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'pt', label: 'Portugues', nativeName: 'Português' },
  { code: 'fr', label: 'Francais', nativeName: 'Français' },
  { code: 'it', label: 'Italiano', nativeName: 'Italiano' },
  { code: 'de', label: 'Deutsch', nativeName: 'Deutsch' },
]

export function detectNativeLanguage() {
  try {
    const language = navigator.languages?.find(Boolean) || navigator.language || ''
    return language.split('-', 1)[0].toLowerCase() || 'en'
  } catch {}
  return 'en'
}

export function getLanguageName(code) {
  const baseCode = String(code || 'en').split('-', 1)[0]
  const fixed = LANGUAGE_OPTIONS.find(item => item.code === baseCode)?.nativeName
  if (fixed) return fixed
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) || 'English'
  } catch {
    return 'English'
  }
}

const base = {
  // Setup choice (recommended vs personalize)
  recommended: 'Recommended',
  setupChoiceEyebrow: 'One quick choice',
  setupChoiceTitle: 'How do you want to start?',
  setupChoiceBody: 'Start right away with a balanced setup, or fine-tune how Lingua teaches you. You can change everything later.',
  setupRecommendedTitle: 'Recommended setup',
  setupRecommendedDesc: 'A balanced, friendly experience ready to go. Great if you just want to start practicing.',
  setupRecommendedCta: 'Start with recommended',
  setupPersonalizeTitle: 'Personalize how Lingua teaches',
  setupPersonalizeDesc: 'Choose the tone, pace, corrections and topics that fit you best.',
  setupPersonalizeCta: 'Personalize Lingua',
  setupChoiceChatto: "I'll be right here with you either way.",
  useRecommendedInstead: 'Use the recommended setup instead',
  // Journey map
  youAreHere: 'You are here',
  journeyStart: 'Start',
  journeyBasics: 'Basics',
  journeyTravel: 'Travel',
  journeyConfidence: 'Confidence',
  journeyFluency: 'Fluency',
  pwWeak: 'Weak',
  pwFair: 'Fair',
  pwGood: 'Good',
  pwStrong: 'Strong',
  // Chatto guided tour
  tutorialAria: 'Getting started with LinguaChat',
  skipTutorial: 'Skip',
  tutorialNext: 'Next',
  tutorialFinish: "Let's go",
  tutorialHomeTitle: 'This is your home',
  tutorialHomeBody: "Your streak, today's mission and progress all live here on the Today screen.",
  tutorialPracticeTitle: 'Chat with Lingua',
  tutorialPracticeBody: 'Open Practice to talk with Lingua in English. Write anything — mistakes are always welcome.',
  tutorialPathTitle: 'Follow your path',
  tutorialPathBody: 'The path shows how far you have come and the next milestone ahead.',
  tutorialPersonalizeTitle: 'Lingua adapts to you',
  tutorialPersonalizeBody: 'Change the tone, pace and corrections anytime from your profile.',
  tutorialNotesTitle: "Lingua's notes",
  tutorialNotesBody: 'Your corrections and saved words are kept in the notes panel.',
  // Plans & pricing
  plansTitle: 'Plans',
  plansDesc: 'Basic & Premium',
  linguaReadyQuote: "I'm here when you're ready. Write anything, ask anything. No judgment, just practice.",
  // Onboarding: tutor personalities + learning preferences
  persGentleName: 'Gentle Guide',
  persGentleDesc: 'Patient, encouraging, celebrates every step. Perfect if you get nervous about mistakes.',
  persGentleSample: 'That was a wonderful try! Here is a tiny note...',
  persCasualName: 'Casual Friend',
  persCasualDesc: 'Relaxed and fun. Talks like a real friend, keeps it light and conversational.',
  persCasualSample: 'Hey, nice one! Just a tiny thing to fix...',
  persStrictName: 'Strict Coach',
  persStrictDesc: 'Precise and demanding. Calls out every mistake. For those who want fast improvement.',
  persStrictSample: 'Note the correction below. Precision matters.',
  persMentorName: 'Interview Mentor',
  persMentorDesc: 'Professional and goal-focused. Prepares you for work and formal situations.',
  persMentorSample: 'In a professional context, use this exact phrase.',
  goalOptTravel: 'Travel',
  goalOptWork: 'Work',
  goalOptStudy: 'Study',
  goalOptFriends: 'Friends',
  goalOptStreaming: 'Streaming',
  goalOptImmigration: 'Immigration',
  vibeMotivational: 'Motivational',
  vibeCalm: 'Calm',
  vibeChallenging: 'Challenging',
  corrEvery: 'Every mistake',
  corrBalanced: 'Balanced',
  corrOnlyBig: 'Only big errors',
  prefsSummary: '{style} · {daily} min/day · {correction} · {vibe}',
  // Missions (display labels; English is the backend canonical) + skills
  missionTypeTravel: 'Travel',
  missionTypeDaily: 'Daily Life',
  missionTypeWork: 'Work',
  missionTypeConfidence: 'Confidence',
  missionTypeQuestions: 'Questions',
  missionTypeGrammar: 'Grammar Basics',
  missionTravelA1Title: 'Ask for help while traveling',
  missionTravelA1Desc: 'Practice simple phrases to get around a city.',
  missionTravelA1Skill: 'asking for information',
  missionDailyA1Title: 'Tell your routine',
  missionDailyA1Desc: 'Build short sentences about your day.',
  missionDailyA1Skill: 'daily routine',
  missionWorkA2Title: 'Introduce yourself at work',
  missionWorkA2Desc: 'Practice a short, confident introduction.',
  missionWorkA2Skill: 'simple professional introduction',
  missionConfidenceA1Title: 'Speak without freezing',
  missionConfidenceA1Desc: 'Use simple phrases to answer even when you are unsure.',
  missionConfidenceA1Skill: 'answering calmly',
  missionQuestionsA2Title: 'Ask simple questions',
  missionQuestionsA2Desc: 'Practice word order in questions.',
  missionQuestionsA2Skill: 'question word order',
  missionGrammarA1Title: 'Sentences with I am',
  missionGrammarA1Desc: 'Learn a simple structure to talk about yourself.',
  missionGrammarA1Skill: 'I am + emotion',
  missionTravelB1Title: 'Explain a travel plan',
  missionTravelB1Desc: 'Connect a decision with a reason.',
  missionTravelB1Skill: 'opinions with because',
  skillQuestionOrder: 'Question order',
  skillIAmEmotion: 'I am + emotion',
  skillThirdPersonS: 'He/she/it + s',
  // First LinguaLoop episode (system text = interface language)
  ep1Title: 'Your first hello',
  ep1Goal: 'I can greet someone and say my name.',
  ep1CanDoName: 'Greet and say your name',
  ep1Duration: '5–8 min',
  ep1EpisodeBadge: 'Episode',
  ep1DoneTag: 'Completed',
  ep1ContinuePrefix: 'Continue',
  ep1StartCta: 'Start episode',
  ep1ReviewCta: 'Review',
  ep1FreeChatCta: 'Chat freely',
  ep1IntroTitle: "You're about to meet someone new",
  ep1IntroBody: "You're going to meet someone for the first time. Ready?",
  ep1Start: "Let's go",
  ep1ModelExplain: 'We use “I’m” right before a name.',
  ep1Continue: 'Continue',
  ep1ShowHelp: 'Show help',
  ep1HideHelp: 'Hide help',
  ep1ComprehensionInstruction: 'What does this mean?',
  ep1CompOptCorrect: 'Hi, my name is Lingua.',
  ep1CompOptWrong1: 'Where is Lingua?',
  ep1CompOptWrong2: 'Goodbye, Lingua.',
  ep1BuildInstruction: 'Put the words in order:',
  ep1BuildHint: 'Tap the words to build the sentence.',
  ep1Reset: 'Reset',
  ep1Check: 'Check',
  ep1BuildRetry: 'Almost — the correct order is:',
  ep1FillInstruction: 'Complete the greeting:',
  ep1FillHint: 'Type your name. For example:',
  ep1TypeName: 'your name',
  ep1RoleplayInstruction: 'Reply to Lingua. Introduce yourself.',
  ep1RecallInstruction: 'Greet and say your name one more time.',
  ep1VariationInstruction: 'Now meet Alex. Introduce yourself again.',
  ep1UseSuggestion: 'Use',
  epEvaluating: 'Lingua is reviewing your answer',
  screenLoading: "Loading…",
  screenLoadFailed: "This part could not load. Your progress is safe.",
  screenLoadRetry: "Try again",
  ctxSceneMusic: "Someone starts talking about music.",
  ctxSceneGames: "Someone starts talking about games.",
  ctxSceneMovies: "Someone starts talking about movies.",
  ctxSceneFood: "Someone starts talking about food.",
  ctxSceneTravel: "Someone starts talking about travel.",
  ctxSceneSports: "Someone starts talking about sports.",
  ctxSceneTechnology: "Someone starts talking about technology.",
  ctxSceneCulture: "Someone starts talking about art.",
  ctxSceneSchool: "Someone starts talking about books.",
  ctxSceneWork: "Someone starts talking about work.",
  ctxSceneFamily: "Someone starts talking about family.",
  ctxSceneNeutral: "Someone asks what you enjoy.",
  ep7Title: "What you like",
  ep7Goal: "I can say what I like and ask what someone likes.",
  ep7CanDoName: "Say and ask what you like",
  ep7Duration: "6–9 min",
  ep7RecallInstruction: "Warm up: ask how someone is.",
  ep7SceneTitle: "Talking about what you enjoy",
  ep7SceneBody: "People ask this early on. Now you can answer.",
  ep7ModelExplain: "“I like” says what you enjoy. “What do you like?” asks the other person.",
  ep7ComprehensionInstruction: "What is this person saying?",
  ep7CompOptCorrect: "Something they enjoy",
  ep7CompOptWrong1: "Where they live",
  ep7CompOptWrong2: "How old they are",
  ep7BuildInstruction: "Build the sentence:",
  ep7FillInstruction: "Now say something you really like:",
  ep7FillHint: "Anything you enjoy. For example:",
  ep7LikePlaceholder: "what you like",
  ep7DislikeExplain: "To say the opposite, English adds “don’t” before “like”.",
  ep7DislikeInstruction: "Say something you don’t like.",
  ep7ShortAnswerInstruction: "Answer in two or three words.",
  ep7AskInstruction: "Now ask what they like.",
  ep7FinalInstruction: "Last one — say what you like, with no model.",
  ep7CloseTitle: "You can talk about what you like",
  ep7CloseBody: "This is how conversations start to feel personal.",
  ep7PraiseIndependent: "You said that on your own.",
  ep7PraiseLiked: "Nice — that sounds natural.",
  ep7PraiseDisliked: "Good — you used “don’t like” correctly.",
  ep7PraiseAsked: "You asked it correctly.",
  ep7PraiseShortAnswer: "That short answer is exactly right.",
  ep7RetryPromptEmpty: "Write your answer in English.",
  ep7RetryExplainObject: "Almost — now add the thing you like:",
  ep7RetryPromptObject: "Try again: I like…",
  ep7RetryExplainLike: "I understood you. English needs “I like” before the thing:",
  ep7RetryPromptLike: "Try again: I like…",
  ep7RetryExplainDont: "To say you do not like something, use “don’t like”:",
  ep7RetryPromptDont: "Try again: I don’t like…",
  ep7RetryExplainDo: "I understood you. This question needs “do”:",
  ep7RetryPromptDo: "Try again: What do you…",
  ep7RetryExplainShort: "English answers this with a short “Yes, I do.” or “No, I don’t.”",
  ep7RetryPromptShort: "Try again: Yes, I…",
  ep8Title: "What you want",
  ep8Goal: "I can say what I want or need in a simple everyday situation.",
  ep8CanDoName: "Say what you want or need",
  ep8Duration: "6–9 min",
  ep8RecallInstruction: "Warm up: say something you like.",
  ep8SceneTitle: "An ordinary moment",
  ep8SceneBody: "You need something small. Let’s ask for it in English.",
  ep8ModelExplain: "“I want” is a wish. “I need” is something necessary.",
  ep8ComprehensionInstruction: "What is this person expressing?",
  ep8CompOptCorrect: "Something they need",
  ep8CompOptWrong1: "Something they like",
  ep8CompOptWrong2: "Where they are from",
  ep8BuildInstruction: "Build the sentence:",
  ep8ChoiceInstruction: "Any of these works. Choose what is true for you:",
  ep8NeedInstruction: "Say what you need.",
  ep8AskInstruction: "Now offer something to them.",
  ep8AcceptInstruction: "Accept politely.",
  ep8DeclineInstruction: "This time, say no politely.",
  ep8FinalInstruction: "Last one — ask for what you want, with no model.",
  ep8CloseTitle: "You can ask for what you need",
  ep8CloseBody: "With this you can get through a lot of real situations.",
  ep8PraiseIndependent: "You did that without the model.",
  ep8PraiseAsked: "That request sounds natural.",
  ep8PraiseNeeded: "Good — “I need” fits here.",
  ep8PraiseOffered: "Nice offer.",
  ep8PraiseAnswered: "Polite and clear.",
  ep8RetryPromptEmpty: "Write your answer in English.",
  ep8RetryExplainWant: "I understood you. Now say the whole sentence with “I want”:",
  ep8RetryPromptWant: "Try again: I want…",
  ep8RetryExplainNeed: "I understood you. Now say it with “I need”:",
  ep8RetryPromptNeed: "Try again: I need…",
  ep8RetryExplainDo: "To offer something, English starts with “Do you want”:",
  ep8RetryPromptDo: "Try again: Do you want…",
  ep8RetryExplainPolite: "English answers an offer politely:",
  ep8RetryPromptPolite: "Try again: Yes, please. / No, thank you.",
  ep9Title: "Let’s make a plan",
  ep9Goal: "I can use greetings, preferences and simple needs to make a small plan.",
  ep9CanDoName: "Make a small plan",
  ep9Duration: "8–12 min",
  ep9SceneTitle: "Everything together",
  ep9SceneBody: "Greet, share what you like, and agree on something to do.",
  ep9Start: "Start the plan",
  ep9TurnWellbeing: "Answer how you are.",
  ep9TurnLike: "Say what you like.",
  ep9TurnAsk: "Now ask what they like.",
  ep9TurnDecide: "Say yes or no — both are fine.",
  ep9TurnNeed: "Say what you want for the plan.",
  ep9TurnOffer: "Offer something back.",
  ep9FinalInstruction: "Final challenge — say what you like and suggest something, in one turn.",
  ep9CloseTitle: "You made a plan in English",
  ep9CloseBody: "Greeting, preferences and needs — all in one real conversation.",
  ep9PraiseIndependent: "A whole turn, on your own.",
  ep9PraiseCombined: "You joined two ideas in one turn.",
  ep9RetryPromptEmpty: "Write your answer in English.",
  ep9RetryExplainMore: "Good start! Now keep the plan going — add a question:",
  ep9RetryPromptMore: "Try again: I like… Do you want…?",
  ep9RetryExplainStart: "Start by saying what you like:",
  ep9RetryPromptStart: "Try again: I like…",
  sessionTopicToday: "Today: {topic}",

  sessionBadge: "TODAY’S SESSION",

  sessionStartCta: "Start session",

  sessionContinueCta: "Continue session",

  sessionPause: "Pause",

  sessionStepOf: "Step {done} of {total}",

  sessionBlockBadge: "QUICK PRACTICE",

  sessionTurnInstruction: "Answer in English.",

  sessionSkipBlock: "Skip for now",

  sessionReviewTitle: "Let’s bring one phrase back",

  sessionRetryTitle: "Let’s practise something you almost had",

  sessionRecallTitle: "Let’s make this one solid",

  sessionExtraTitle: "One more, your way",

  storyBadge: "SHORT STORY",

  storyTitle: "A small scene",

  storyNoteScene: "Read the scene. You will answer in a moment.",

  storyNoteClose: "That is the whole scene.",

  storyChooseReply: "Choose your reply:",

  storyReplyLike: "Say what you like.",

  storyReplyWant: "Say what you want.",

  storyReplyIntro: "Greet and say your name.",

  storyFinish: "Finish",

  sessionBuildInstruction: "Put the words in order.",

  sessionGapInstruction: "Complete the sentence.",

  sessionChoiceInstruction: "Choose the natural answer.",

  sessionChoiceRetry: "Not quite — the natural answer here is:",

  sessionGapRetry: "Almost — the missing word is:",

  altPractiseAnotherWay: "Practise another way",

  altGuidedInstruction: "Build the same sentence, word by word.",

  altGuidedHint: "Tap the words in the right order.",

  feedbackQuestion: "How was this way of practising?",

  feedbackQuestionFor: "How did {activity} go?",

  formatName_roleplay: "the conversation",

  formatName_mini_story: "the little story",

  formatName_free_reply: "answering in your own words",

  formatName_recall: "remembering the phrase",

  formatName_review: "the quick review",

  formatName_word_order: "putting the words in order",

  formatName_fill_blank: "completing the sentence",

  formatName_guided_reply: "the guided practice",

  formatName_choice: "choosing the answer",

  formatName_comprehension: "working out the meaning",

  replaySectionTitle: "What you can already do",

  replayCompletedTag: "Completed",

  replayPractiseAgain: "Practise again",

  replayTryOtherOption: "Try the other option",

  replayTimesPractised: "practised {count}×",

  memoryRememberedLike: "Last time you said you like {topic}. Want to talk about that?",

  memoryUseTopic: "Yes, let’s talk about it",

  memoryUseAnotherTopic: "Use another topic",

  sessionTopicRemembered: "Something you mentioned: {topic}",


  feedbackMoreLikeThis: "More like this",

  feedbackItsFine: "It’s fine",

  feedbackAnotherWay: "I’d prefer another way",

  feedbackThanks: "Noted, thank you.",

  sessionFreeChatTitle: "Free conversation",

  sessionFreeChatBody: "Use what you know with Lingua, with no exercises.",

  sessionFreeChatCta: "Open free chat",

  sessionDoneBadge: "SESSION COMPLETE",

  sessionDoneTitle: "You practised what you needed today",

  sessionDoneBody: "Your English grew a little in a real situation, not on a list.",

  sessionDoneNext: "Tomorrow we’ll build on this.",

  sessionDoneCount: "{count} activities completed",

  sessionDoneCta: "Back to today",

  sessionDurationLabel: "How long today?",

  sessionDurationLockedHint: "You can change the length next time.",

  sessionMinutes: "about {minutes} min",

  sessionDuration_quick: "Quick",

  sessionDuration_standard: "Normal",

  sessionDuration_deep: "Deep",

  sessionDurationHint_quick: "One essential goal.",

  sessionDurationHint_standard: "Review and progress, balanced.",

  sessionDurationHint_deep: "More practice and conversation.",

  ep4Title: "How are you?",

  ep4Goal: "I can ask how someone is and give a simple answer.",

  ep4CanDoName: "Ask and answer how you are",

  ep4Duration: "5–8 min",

  ep4RecallInstruction: "Warm up: introduce yourself.",

  ep4SceneTitle: "You meet again",

  ep4SceneBody: "You already know each other. Now you can ask how they are.",

  ep4ModelExplain: "“How are you?” asks about the other person. “I’m good” answers it.",

  ep4ComprehensionInstruction: "What is Lingua asking?",

  ep4CompOptCorrect: "How you are feeling",

  ep4CompOptWrong1: "Your name",

  ep4CompOptWrong2: "Where you live",

  ep4BuildInstruction: "Build the question:",

  ep4ChoiceInstruction: "Any of these works. Choose how you feel:",

  ep4AnswerInstruction: "Answer how you are.",

  ep4AskInstruction: "Now ask how they are.",

  ep4BounceInstruction: "Return the question in two words.",

  ep4FinalInstruction: "Last one — ask how they are, with no model.",

  ep4CloseTitle: "You can ask and answer",

  ep4CloseBody: "That short exchange is how most real conversations start.",

  ep4PraiseIndependent: "You did that without the model.",

  ep4PraiseAsked: "You asked it correctly.",

  ep4PraiseAnswered: "That answer sounds natural.",

  ep4PraiseBounce: "Nice — you returned the question.",

  ep4RetryPromptEmpty: "Write your answer in English.",

  ep4RetryExplainAux: "I understood you. English needs “are” in this question:",

  ep4RetryPromptAux: "Try again: How are…",

  ep4RetryExplainAsk: "To ask about the other person, use this question:",

  ep4RetryPromptAsk: "Try again: How…",

  ep4RetryExplainIm: "Good feeling! In English we add “I’m” before it:",

  ep4RetryPromptIm: "Try again: I’m…",

  ep4RetryExplainBounce: "To return the question, English uses two short words:",

  ep4RetryPromptBounce: "Try again: And…",

  ep5Title: "Where are you from?",

  ep5Goal: "I can ask where someone is from and say where I’m from.",

  ep5CanDoName: "Ask and say where you are from",

  ep5Duration: "6–9 min",

  ep5RecallInstruction: "First, greet and say your name.",

  ep5SceneTitle: "Someone from far away",

  ep5SceneBody: "You meet someone from another place. Where are they from?",

  ep5ModelExplain: "“Where are you from?” asks about a place. “I’m from…” answers it.",

  ep5ComprehensionInstruction: "What information is being asked?",

  ep5CompOptCorrect: "The place you come from",

  ep5CompOptWrong1: "How old you are",

  ep5CompOptWrong2: "How you feel",

  ep5BuildInstruction: "Build the question:",

  ep5FillInstruction: "Complete it with your own place:",

  ep5FillHint: "A country, a city or a region — whatever you say.",

  ep5PlacePlaceholder: "your place",

  ep5AnswerInstruction: "Now say where you are from.",

  ep5AskInstruction: "Ask where they are from.",

  ep5BounceInstruction: "Return the question another way.",

  ep5FinalInstruction: "Last one — say where you are from, with no model.",

  ep5CloseTitle: "You can talk about where you’re from",

  ep5CloseBody: "This is one of the first things people ask each other.",

  ep5PraiseIndependent: "You said it on your own.",

  ep5PraiseAsked: "You asked it correctly.",

  ep5PraiseAnswered: "You used the full structure.",

  ep5RetryPromptEmpty: "Write your answer in English.",

  ep5RetryExplainAux: "I understood you. This question needs “are”:",

  ep5RetryPromptAux: "Try again: Where are…",

  ep5RetryExplainAsk: "To ask about a place, use this question:",

  ep5RetryPromptAsk: "Try again: Where…",

  ep5RetryExplainIm: "Almost — English starts this answer with “I’m”:",

  ep5RetryPromptIm: "Try again: I’m from…",

  ep5RetryExplainFrom: "I understood the place. Now say the whole sentence:",

  ep5RetryPromptFrom: "Try again: I’m from…",

  ep6Title: "Your first conversation",

  ep6Goal: "I can greet someone, introduce myself, ask how they are and say where I’m from.",

  ep6CanDoName: "Hold a first conversation",

  ep6Duration: "8–12 min",

  ep6SceneTitle: "A real conversation",

  ep6SceneBody: "No cards this time. Just you and someone new — everything you have learned, together.",

  ep6Start: "Start the conversation",

  ep6TurnGreet: "Greet and introduce yourself.",

  ep6TurnAskName: "Ask for their name.",

  ep6TurnNice: "Close the introduction politely.",

  ep6TurnAskWellbeing: "Ask how they are.",

  ep6TurnAnswerWellbeing: "Now answer how you are.",

  ep6TurnAskOrigin: "Ask where they are from.",

  ep6TurnAnswerOrigin: "Say where you are from.",

  ep6FinalInstruction: "Final challenge — open a conversation and keep it going, in one turn.",

  ep6CloseTitle: "You had your first conversation",

  ep6CloseBody: "You did not complete a lesson — you met someone in English.",

  ep6PraiseIndependent: "A whole turn, on your own.",

  ep6PraiseCombined: "You joined two ideas in one turn.",

  ep6RetryPromptEmpty: "Write your answer in English.",

  ep6RetryExplainMore: "Good introduction! Now keep the conversation going — add a question:",

  ep6RetryPromptMore: "Try again: Hi, I’m… How are you?",
  ep1TypeReply: 'Type your reply…',
  ep1Send: 'Send',
  ep1FeedbackGood: 'Great — you greeted them and said your name!',
  ep1Correct: 'Correct!',
  ep1KeepGoing: "Let's look again.",
  ep1RetryTitle: 'Almost!',
  ep1RetryExplainIm: 'In English we use “I’m” before the name:',
  ep1RetryExplainGreet: 'Start with a greeting like “Hi” or “Hello”:',
  ep1CanDoBadge: 'New skill',
  ep1CloseTitle: 'You can greet and say your name in English!',
  ep1CloseBody: "You reached today's goal.",
  ep1CloseCta: 'Finish',
  // Episode 1 — flexible praise + retry
  ep1PraiseIndependent: 'You introduced yourself without the model. Great!',
  ep1PraiseIm: 'You used I’m before your name. Nice!',
  ep1PraiseGreetAndName: 'This time you added the greeting and your name.',
  ep1RetryExplainName: 'Add your name after I’m:',
  ep1RetryPromptEmpty: 'Try writing: Hi, I’m…',
  ep1RetryPromptIm: 'Try again: Hi, I’m…',
  ep1RetryPromptName: 'Try again and add your name.',
  // Planner
  planTodayBadge: 'Today',
  planReviewTag: 'quick review',
  // Episode 2 — Ask someone's name
  ep2Title: 'What’s your name?',
  ep2Goal: 'I can ask someone’s name and understand a simple answer.',
  ep2CanDoName: 'Ask and understand a name',
  ep2Duration: '5–8 min',
  ep2RecallInstruction: 'First, introduce yourself again.',
  ep2SceneTitle: 'Meet someone new',
  ep2SceneBody: 'Lingua introduces you to Alex. You want to know their name.',
  ep2ModelExplain: '“What’s” is short for “What is”.',
  ep2ComprehensionInstruction: 'What is this person asking?',
  ep2CompOptCorrect: 'They want to know your name.',
  ep2CompOptWrong1: 'They are saying goodbye.',
  ep2CompOptWrong2: 'They are asking where you live.',
  ep2BuildInstruction: 'Build the question:',
  ep2FillInstruction: 'Give your name:',
  ep2FillHint: 'Type your name. For example:',
  ep2AskInstruction: 'Now ask Alex their name.',
  ep2VariationInstruction: 'Alex answers. What did they say?',
  ep2VarOptCorrect: 'Their name is Sam.',
  ep2VarOptWrong1: 'They are asking your name.',
  ep2VarOptWrong2: 'They want to leave.',
  ep2RecallAskInstruction: 'Ask their name one more time, without the model.',
  ep2CloseTitle: 'You can ask someone’s name in English!',
  ep2CloseBody: 'You asked a question and understood the answer.',
  ep2PraiseIndependent: 'You asked the question on your own. Great!',
  ep2PraiseAsked: 'You asked their name correctly.',
  ep2RetryExplain: 'To ask a name we say:',
  ep2RetryPrompt: 'Try again: What’s your name?',
  ep2RetryPromptEmpty: 'Try writing: What’s your name?',
  // Episode 3 — Nice to meet you
  ep3Title: 'Nice to meet you',
  ep3Goal: 'I can greet, introduce myself, ask a name and close the exchange.',
  ep3CanDoName: 'Hold a first greeting',
  ep3Duration: '6–10 min',
  ep3RecallInstruction: 'Warm up: introduce yourself.',
  ep3SceneTitle: 'A short meeting',
  ep3SceneBody: 'You meet Alex at an event. Have the whole little exchange.',
  ep3ComprehensionInstruction: 'Alex greets you. What are they asking?',
  ep3CompOptCorrect: 'They greet you and ask your name.',
  ep3CompOptWrong1: 'They are leaving.',
  ep3CompOptWrong2: 'They are asking the time.',
  ep3ChoiceInstruction: 'Choose the most natural answer:',
  ep3BuildInstruction: 'Build the closing line:',
  ep3RoleplayIntro: 'Alex greets you. Reply and introduce yourself.',
  ep3RoleplayClose: 'Close the exchange politely.',
  ep3VariationInstruction: 'Sam answers differently. What did they say?',
  ep3VarOptCorrect: 'Their name is Sam, and they are glad to meet you.',
  ep3VarOptWrong1: 'They are asking your age.',
  ep3VarOptWrong2: 'They are saying goodbye.',
  ep3FinalInstruction: 'Last one — greet and introduce yourself, no model.',
  ep3CloseTitle: 'You can hold a first greeting in English!',
  ep3CloseBody: 'You greeted, introduced yourself and closed naturally.',
  ep3PraiseIndependent: 'You did the whole exchange on your own. Excellent!',
  ep3PraiseClose: 'You closed the greeting naturally.',
  ep3RetryExplain: 'A friendly way to close is:',
  ep3RetryPrompt: 'Try again: Nice to meet you.',
  ep3RetryPromptEmpty: 'Try writing: Nice to meet you.',
  pricingEyebrow: 'Plans',
  pricingTitle: 'Simple plans for real progress',
  pricingSubtitle: 'Start free. Premium is on the way, with pricing tuned to your region.',
  pricingRegion: 'Region',
  pricingPendingNote: 'Premium pricing is still being finalized. Basic stays free — you can keep learning today while we set fair, regional prices for Premium.',
  planFree: 'Free',
  planComingSoon: 'Coming soon',
  planPerMonth: '/mo',
  planPopular: 'Most popular',
  planBasicName: 'Basic',
  planBasicTagline: 'Everything you need to start speaking English every day.',
  planBasicCta: 'Keep using Basic',
  planPremiumName: 'Premium',
  planPremiumTagline: 'Go deeper and practice without limits.',
  planPremiumCta: 'Choose Premium',
  planFeatChatDaily: 'Daily conversation practice with Lingua',
  planFeatCorrections: 'Instant corrections and explanations',
  planFeatPlacement: 'Adaptive placement test',
  planFeatMissions: 'Guided daily missions',
  planFeatProgress: 'Progress, streak and saved words',
  planFeatEverythingBasic: 'Everything in Basic',
  planFeatUnlimited: 'Unlimited practice and missions',
  planFeatDeeperFeedback: 'Deeper feedback and review',
  planFeatVoiceSoon: 'Voice practice (coming soon)',
  planFeatPriority: 'Priority access to new features',
  regionUS: 'US',
  regionCL: 'Chile',
  regionMX: 'Mexico',
  regionES: 'Spain',
  regionBR: 'Brazil',
  entryEyebrow: 'Your English companion',
  entryTitle: 'Practice English',
  entryTitleAccent: 'without fear.',
  entrySubtitle: 'Tiny conversations. Real confidence. Lingua is here every day.',
  entryStart: 'Start a new journey',
  entryContinue: 'Continue your journey',
  entryNote: 'No judgment. No grammar tests to start.',
  loginTitle: 'Continue practicing',
  loginSubtitle: 'Your progress and notes are waiting.',
  loginBubble: 'Welcome back. Ready to practice?',
  signupTitle: 'Begin your journey',
  signupSubtitle: 'A quick test first so Lingua understands your English.',
  forgotTitle: 'Recover access',
  forgotSubtitle: 'Enter your email and we will send a recovery link.',
  email: 'Email',
  password: 'Password',
  confirmPassword: 'Confirm password',
  forgotPassword: 'Forgot password?',
  createAccount: 'Begin my journey',
  loginButton: 'Continue practicing',
  fillAllFields: 'Please fill in all fields.',
  validEmail: 'Enter a valid email address.',
  oneMoment: 'One moment...',
  newHere: 'New here?',
  startJourney: 'Start your journey',
  yourName: 'Your name',
  namePlaceholder: 'How should Lingua call you?',
  setupBubble: 'Let me set up your practice space.',
  passwordMin: 'Password must be at least 6 characters.',
  passwordMismatch: "Passwords don't match.",
  checkCommitment: 'Please check the commitment box.',
  commitment: 'I am ready to practice consistently. Mistakes are part of the journey.',
  settingUp: 'Setting up...',
  alreadyPracticing: 'Already practicing?',
  signIn: 'Sign in',
  progressSafe: 'Your progress is safe.',
  sending: 'Sending...',
  sendRecovery: 'Send recovery link',
  recoverySent: 'Recovery link sent',
  recoverySentText: 'Check your inbox. Your practice history is safe and waiting.',
  backToSignIn: 'Back to sign in',
  back: 'Back',
  languageTitle: 'Before we start...',
  languageText: 'Lingua will use your language to explain things better, but practice will be in English.',
  languageButton: 'Continue',
  placementTitle: 'First, let us understand your level',
  placementText: 'This is not a pass-or-fail exam. Lingua only wants to understand how you write in English so corrections, difficulty, and suggestions fit you.',
  placementBullet1: 'We will ask a few short questions.',
  placementBullet2: 'Answer with what you know.',
  placementBullet3: 'Mistakes are completely okay.',
  placementBullet4: 'At the end Lingua will estimate your starting level.',
  placementStart: 'Start the gentle test',
  placementAdaptiveTitle: 'Let us find your starting level',
  placementAdaptiveText: 'This is not a pass-or-fail exam. We only want to know where to start so Lingua can adapt corrections and difficulty.',
  placementAdaptiveBullet1: 'Short questions with answer choices.',
  placementAdaptiveBullet2: 'If a question is hard, the next one gets easier.',
  placementAdaptiveBullet3: 'If you answer correctly, we raise the difficulty a little.',
  placementAdaptiveBullet4: 'Your level can change as you practice.',
  placementAdaptiveStart: 'Start test',
  placementShortTest: 'Gentle test',
  placementPickBest: 'Choose the best answer. The examples stay in English because this measures your level.',
  placementExamplesNote: 'The answer choices are in English because they are the practice.',
  placementCorrect: 'Good. We will raise the difficulty a little.',
  placementIncorrect: 'No worries. Let us try something simpler.',
  placementPoint: 'Your starting point looks',
  alreadyDoWell: 'What you already do well',
  practiceNext: 'What we will practice',
  howLinguaCorrects: 'How Lingua will correct you',
  nextGoal: 'Next goal',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  conversation: 'Conversation',
  nextMilestone: 'Your next milestone',
  reachNextLevel: 'Build confidence with daily practice',
  placementMicrocopy: 'Your level can change with practice.',
  answerInEnglish: 'Answer in English. Do not worry about mistakes.',
  typeAnswer: 'Type your answer in English...',
  questionOf: 'Question',
  of: 'of',
  analyzing: 'Lingua is understanding your English...',
  resultBubble: 'I understand your English now. Here is what I found.',
  detectedLevel: 'Detected level',
  canDo: 'What you can already do',
  focusAreas: 'What we will improve',
  practiceRecommendation: 'Practice recommendation',
  correctionStyle: 'Recommended correction style',
  enterPractice: 'Enter my practice room',
  practiceRoom: 'Practice Room',
  listening: 'Lingua is listening',
  writing: 'Lingua is writing...',
  quickPrompts: 'Quick prompts',
  correctMe: 'Correct me',
  askMeQuestion: 'Ask me a question',
  roleplay: 'Roleplay',
  giveOptions: 'Give me options',
  increaseDifficulty: 'Increase difficulty',
  explainSimple: 'Explain it simply',
  inputPlaceholder: "Write in English or ask 'como se dice...'",
  inputHint: 'Enter to send. Shift+Enter for new line. Mistakes are welcome here.',
  learningAction: 'Mini goal',
  tryIt: 'Try it',
  tutorNotes: "Lingua's Notes",
  notesWriting: 'Writing...',
  notesListening: 'Listening closely...',
  currentFocus: 'Your focus now',
  workingError: 'Error we are working on',
  nextMiniGoal: 'Next mini goal',
  wordToUse: 'Word to use',
  recommendedPhrase: 'Recommended phrase',
  translation: 'Translation',
  correction: 'Correction',
  tinyFixProgress: 'Tiny fix, real progress.',
  quickWhy: 'Quick why',
  tinyFix: 'Tiny fix',
  tryNext: 'Try next',
  inEnglish: 'In English',
  askMeAnything: 'Ask me anything',
  notesEmptyHint: "Write one sentence. I'll show the next useful step here.",
  defaultFocus: 'Build complete English sentences.',
  defaultWorkingError: 'Questions, word order, and natural everyday phrases.',
  defaultMiniGoal: 'Write one sentence and add a reason with because.',
  confidenceScore: 'Confidence score',
  confidenceHint: 'Confidence grows by speaking.',
  wordsToday: 'Words today',
  lastFix: 'Last fix',
  resetProgress: 'Reset local progress',
  today: 'Today',
  goodMorning: 'Good morning',
  goodAfternoon: 'Good afternoon',
  goodEvening: 'Good evening',
  dayStreak: 'day streak',
  keepGoing: 'Keep going.',
  todaysMission: "Today's mission",
  startTodaysPractice: "Start today's practice",
  activeMission: 'Active mission',
  practiceMission: 'Practice mission',
  missionStep: 'Step',
  missionComplete: 'Mission complete',
  writeAnswer: 'Write your answer...',
  checkStep: 'Check step',
  continueMission: 'Continue mission',
  completedMissions: 'Completed missions',
  missions: 'Missions',
  yourProgress: 'Your progress',
  progress: 'Progress',
  path: 'Path',
  level: 'Level',
  xp: 'XP',
  streak: 'Streak',
  exitMission: 'Leave mission',
  missionInputPlaceholder: 'Answer Lingua here...',
  missionInputHint: 'Answer the mission step in the chat. Lingua will guide the next move.',
  phraseOfDay: 'Phrase of the day',
  linguaReady: 'Lingua is ready',
  onlineNow: 'Online now',
  openPracticeRoom: 'Open Practice Room',
  reviewMistakes: 'Review mistakes',
  lastMistakeFixed: 'Last mistake fixed',
  words: 'Words',
  confidence: 'Confidence',
  practiceEveryDay: 'Practice every day',
  toNextLevel: 'to next level',
  startMission: 'Start mission',
  yourJourney: 'Your journey',
  explore: 'Explore',
  memoryGarden: 'Memory Garden',
  conversationArchive: 'Conversation Archive',
  languageIdentity: 'Language Identity',
  learnerProfile: 'Your learner profile',
  phrasesSaved: 'phrases saved',
  sessionsRecorded: 'sessions recorded',
  sessions: 'Sessions',
  mastered: 'mastered',
  totalWords: 'total words',
  all: 'All',
  learning: 'Learning',
  new: 'New',
  noWords: 'No words here yet',
  practiceToFillGarden: 'Practice more to fill your garden.',
  addedThisWeek: 'Added this week',
  stillLearning: 'Still learning',
  everySessionSaved: 'Every session, saved',
  sessionDetails: 'Session details',
  messages: 'Messages',
  corrections: 'Corrections',
  correctionStyleLabel: 'Correction style',
  practiceVibeLabel: 'Practice vibe',
  keyFix: 'Key fix',
  practiceAgain: 'Practice this topic again',
  bestTopic: 'Best topic',
  mostPracticed: 'Most practiced',
  practice: 'Practice',
  identity: 'Identity',
  archive: 'Archive',
  journey: 'Journey',
  notes: 'Notes',
  hideNotes: 'Hide notes',
  showNotes: 'Show notes',
  appSettings: 'App settings',
  theme: 'Theme',
  dark: 'Dark',
  light: 'Light',
  system: 'System',
  chooseEnergyEyebrow: 'How Lingua will work with you',
  chooseEnergyTitle: "Choose Lingua's energy",
  chooseEnergyText: 'This shapes how Lingua corrects you, encourages you, and talks to you.',
  selectEnergy: 'Select an energy first',
  choose: 'Choose',
  prefsEyebrow: 'Your practice setup',
  prefsTitle: 'How do you want to practice?',
  prefsText: 'You can change all of this anytime.',
  whyLearning: 'Why are you learning English?',
  dailyTime: 'How much time per day?',
  correctionQuestion: 'How should Lingua correct you?',
  vibeQuestion: 'What vibe do you want?',
  yourSetup: 'Your setup',
  enterLinguaChat: 'Enter LinguaChat',
  languageIdentityEyebrow: 'Your language identity',
  languageIdentityTitle: 'Who you are as a learner',
  interfaceLanguage: 'Interface language',
  nativeLanguageLabel: 'Native language',
  nativeLanguageDescription: 'Lingua explains in this language. Practice stays in English.',
  learningEnglish: 'Learning English',
  changeLanguage: 'Change language',
  selectLanguage: 'Select language',
  searchLanguage: 'Search language...',
  cancel: 'Cancel',
  saved: 'Saved',
  save: 'Save',
  learner: 'Learner',
  moodColor: 'Your mood color',
  confidenceEvolution: 'Confidence evolution',
  withLingua: 'With Lingua',
  active: 'Active',
  practiceIdentity: 'Your practice identity',
  backToToday: 'Back to today',
  signOut: 'Sign out',
  personalizeTutor: 'Personalize your tutor',
  personalizeTutorDescription: 'Choose how LinguaChat corrects, explains, and practices with you. Saved only on this device.',
  correctionGentle: 'Gentle',
  correctionBalanced: 'Balanced',
  correctionStrict: 'Strict',
  aiTone: 'Tone',
  toneFriendly: 'Friendly',
  toneMotivating: 'Motivating',
  toneFun: 'Fun',
  toneProfessional: 'Professional',
  toneCalm: 'Calm',
  pace: 'Pace',
  paceSlow: 'Slow and clear',
  paceNormal: 'Normal',
  paceFast: 'Fast',
  explanations: 'Explanations',
  explanationsSimple: 'Very simple',
  explanationsNormal: 'Normal',
  explanationsDetailed: 'Detailed',
  interests: 'Interests',
  goal: 'Goal',
  goalDailyConversation: 'Daily conversation',
  goalTravel: 'Travel',
  goalWork: 'Work',
  goalSchool: 'School',
  goalConfidence: 'Confidence',
  learnerStyle: 'Learner style',
  learnerChild: 'Child',
  learnerTeen: 'Teen',
  learnerAdult: 'Adult',
  learnerOlderAdult: 'Older adult',
  preferNotSay: 'Prefer not to say',
  textSize: 'Text size',
  normal: 'Normal',
  large: 'Large',
  interest_travel: 'Travel',
  interest_music: 'Music',
  interest_games: 'Games',
  interest_work: 'Work',
  interest_food: 'Food',
  interest_school: 'School',
  interest_technology: 'Technology',
  interest_family: 'Family',
  interest_sports: 'Sports',
  interest_culture: 'Culture',
  interest_movies: 'Movies/series',
  // Chatto onboarding + Moti Moments
  motiPlacementTitle: "Done! I know where we should start.",
  motiPlacementMessage: "Now let's personalize Lingua so you can learn your way.",
  motiPersonalizeTitle: "Let's make Lingua yours",
  motiPersonalizeMessage: "This changes how Lingua corrects, explains, and practices with you.",
  motiSavedTitle: "All set!",
  motiSavedMessage: "Your preferences are saved on this device.",
  motiMissionTitle: "That was great!",
  motiMissionMessage: "Nice work! You can use this phrase in a real conversation now.",
  motiStruggleTitle: "You're doing fine",
  motiStruggleMessage: "Relax, making mistakes here is part of training. Let's try an easier version.",
  personalizeStepBadge: "Final step",
  personalizeEyebrow: "Personalize",
  personalizeTitle: "Now let's personalize Lingua",
  personalizeBody: "This affects the tone, pace, and corrections Lingua uses with you.",
  chattoCompanionHint: "Chatto stays with you while you set up your experience.",
  saveAndStart: "Save and start",
  welcomeTitle: "Welcome to LinguaChat!",
  welcomeMessage: "Lingua is ready to practice your way. Start today's mission or open the practice room.",
  welcomeStartMission: "Start mission",
  welcomeOpenPractice: "Open practice",
  welcomeLater: "Later",
}








/*
 * Interface locales are loaded on demand.
 *
 * Shipping all eight dictionaries to every learner cost ~270 kB in the entry
 * chunk, and nobody reads seven languages at once. English (`base`) stays here
 * because it is both a real locale and the final fallback; every other locale
 * lives in ./locales/<code>.js and is fetched when it becomes the interface or
 * native language.
 *
 * `translate` stays synchronous: until a locale has loaded, its keys resolve to
 * the English base, so the UI never shows raw keys. Callers that want to avoid
 * even a brief English flash can await `loadLocale` first (AppContext does).
 */
const LOADERS = {
  es: () => import('./locales/es.js'),
  pt: () => import('./locales/pt.js'),
  fr: () => import('./locales/fr.js'),
  it: () => import('./locales/it.js'),
  de: () => import('./locales/de.js'),
  ja: () => import('./locales/ja.js'),
  ar: () => import('./locales/ar.js'),
}

const dictionaries = { en: base }
const inFlight = new Map()

export const SUPPORTED_LOCALES = ['en', ...Object.keys(LOADERS)]
export const isLocaleReady = (language) => Boolean(dictionaries[normalizeLocale(language)])

export function normalizeLocale(language) {
  const code = String(language || 'en').split('-', 1)[0].toLowerCase()
  return code === 'en' || LOADERS[code] ? code : 'en'
}

/*
 * Resolve a locale's dictionary, fetching it once. Concurrent callers share the
 * same promise. A failed chunk resolves to English rather than rejecting: a
 * network hiccup must never leave the interface blank.
 */
export function loadLocale(language) {
  const code = normalizeLocale(language)
  if (dictionaries[code]) return Promise.resolve(dictionaries[code])
  if (inFlight.has(code)) return inFlight.get(code)
  const promise = LOADERS[code]()
    .then((mod) => {
      dictionaries[code] = { ...base, ...(mod.default || mod) }
      return dictionaries[code]
    })
    .catch(() => base)
    .finally(() => inFlight.delete(code))
  inFlight.set(code, promise)
  return promise
}

export function translate(language, key, params = {}) {
  const code = normalizeLocale(language)
  const template = dictionaries[code]?.[key] || base[key] || key
  return Object.entries(params).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  )
}
