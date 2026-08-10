/*
 * A1 arc 3 — "Who this is" (`people_around_you`, episodes 24–26).
 *
 * Derived from docs/curriculum/a1-blueprint.json. The arc's own words for the
 * problem it solves: "The learner can introduce themselves but not anybody else, so
 * a conversation with two other people is closed to them."
 *
 *   24 this_is       introduce_someone_else   presenting a third person
 *   25 shes_a_student  (reinforcement)        one true thing about them
 *   26 three_of_us     (reinforcement)        the whole three-way exchange
 *
 * ONE capability, three episodes. That is the blueprint's shape rather than a
 * shortcut: `introduce_someone_else` is `required`, episode 24 teaches it, and 25
 * and 26 are `role: reinforcement` — which is also why this arc reaches its
 * evidence target inside itself where arcs 1 and 2 could not. The engine records a
 * can-do once per episode run, and three episodes teach the same one.
 *
 * WHAT THIS ARC REFUSES TO BE is a family vocabulary list. The risk note is the
 * design constraint: "Family vocabulary and cultural assumptions. The budget is
 * three neutral relations plus a fallback that needs none, and no episode assumes a
 * family structure." So the three relations are `friend`, `colleague`, `classmate`,
 * the fallback is introducing somebody by name alone, and no step asks the learner
 * who they live with.
 *
 * TWO NEW INTENTS, and the first two in A1 the blueprint marks `hybrid`:
 * `introduce_person` and `state_person_fact`. Hybrid means the canonical frame is
 * still judged locally and only an inconclusive reply escalates — there are more
 * good ways to introduce a person than a pattern list should claim to know.
 *
 * NO STORY. `miniStory.use: false`, and the blueprint says why: "Three-way
 * introductions are better felt as a roleplay with a named partner than as a
 * narrated scene." Episode 26 is that roleplay.
 *
 * NO FACTS. `factsCaptured: []` — the arc captures nothing, and that is deliberate:
 * remembering who somebody's colleague is would be storing a third party's data to
 * teach a grammar pattern.
 */

/*
 * 24 — "This is…"
 *
 * Blueprint: primary, canDo `introduce_someone_else`, novelty medium, budget 4, TWO
 * new patterns, reuse im/nice_to_meet, two open productions, integrated reuse of
 * `introduce_self` and `full_greeting`, prerequisites [20], evidence "one unaided
 * introduction of a third person".
 *
 * Two people meet through the learner. The frame is `im_pattern` with the person
 * moved out of the subject — which is why the blueprint makes `im_pattern` the
 * prerequisite of `this_is_pattern` — and the possessive arrives with it because
 * "my friend Ana" is how anybody actually says this.
 */
const PEOPLE_01 = {
  id: 'this_is',
  arc: 'people_around_you',
  level: 'A1',
  role: 'primary',
  titleKey: 'ep24Title',
  goalKey: 'ep24Goal',
  canDoId: 'introduce_someone_else',
  canDoNameKey: 'ep24CanDoName',
  durationKey: 'ep24Duration',
  estimatedMinutes: 9,
  xp: 75,
  prerequisites: ['meeting_someone_new'],
  skillPrerequisites: ['introduce_self', 'full_greeting'],
  gardenItems: ['this_is_pattern', 'possessive_pattern', 'friend', 'colleague'],
  reuseSkills: ['introduction', 'nice_to_meet'],
  steps: [
    /* Remember: the sentence this arc is about to rebuild around somebody else. */
    { type: 'recall', review: true, instructionKey: 'ep24RecallInstruction', evalKind: 'introduction', itemIds: ['im'] },
    { type: 'scene', mood: 'welcoming', titleKey: 'ep24SceneTitle', bodyKey: 'ep24SceneBody', showGoal: true, ctaKey: 'ep24Start' },
    /* Discover: the same two words, a different subject. */
    { type: 'model', target: 'This is Ana. Ana, this is Ben.', meaningItems: ['this_is_pattern'], explainKey: 'ep24ModelExplain' },
    /*
     * Comprehend who is being spoken TO and who ABOUT — the only thing that is
     * genuinely new here, and the thing a learner gets wrong first.
     */
    { type: 'comprehension', instructionKey: 'ep24ComprehensionInstruction', target: 'Ben, this is my colleague Ana.', itemId: 'this_is_pattern',
      options: [{ key: 'ep24CompOptCorrect', correct: true }, { key: 'ep24CompOptWrong1' }, { key: 'ep24CompOptWrong2' }] },
    /* Build: the frame, in the order it is said. */
    { type: 'word_order', instructionKey: 'ep24OrderInstruction', hintKey: 'ep1BuildHint',
      tokens: ['This', 'is', 'my', 'friend', 'Ana', '.'], itemId: 'this_is_pattern' },
    /*
     * Guided: the possessive is the gap, and BOTH relations are true answers — the
     * learner is introducing somebody of their own, so the arc must not decide who.
     */
    { type: 'fill_blank', instructionKey: 'ep24BlankInstruction', before: 'This is my', after: ' Ana.',
      expects: 'friend', alternatives: ['colleague', 'classmate'], itemId: 'possessive_pattern', hintKey: 'ep24BlankHint' },
    /*
     * Open production 1 — the introduction, model available because the frame is new.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'I have not met your friend. Introduce us.', instructionKey: 'ep24OpenInstruction',
      evalKind: 'introduce_person', suggestionEn: 'This is my friend {partner}.', itemIds: ['this_is_pattern', 'friend'] },
    /*
     * Receptive: both partners reply, which is the blueprint's `receptiveTarget` and
     * the reason an introduction is worth making — something happens next.
     */
    { type: 'choice', instructionKey: 'ep24ListenInstruction', promptEn: '{partner}: “Nice to meet you!” Ben: “Nice to meet you too. Are you a colleague of Sam?”  Who is Ben talking to?', itemId: 'nice_to_meet',
      options: [{ textEn: '{partner}.', correct: true }, { textEn: 'Sam.' }, { textEn: 'Nobody.' }] },
    /*
     * REUSE, BECAUSE THE SITUATION NEEDS IT: a greeting sequence is where an
     * introduction lives. The blueprint marks `full_greeting` as returning in this
     * arc, and `nice_to_meet` is the capability behind it.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Ben: “Hi! I’m Ben.”', instructionKey: 'ep24GreetInstruction',
      evalKind: 'nice_to_meet', suggestionEn: 'Nice to meet you.', itemIds: ['nice_to_meet'] },
    /*
     * Open production 2, integrated with Pre-A1: introduce yourself AND them, in one
     * turn, with NO model on screen. This is the episode's unaided evidence.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Somebody new joins. Introduce yourself and your friend.', instructionKey: 'ep24IntegratedInstruction',
      evalKind: 'introduce_person', itemIds: ['im', 'this_is_pattern'] },
    /* Remember: the frame, unaided. */
    { type: 'recall', instructionKey: 'ep24FinalInstruction', evalKind: 'introduce_person', itemIds: ['this_is_pattern', 'possessive_pattern'] },
    { type: 'completion', canDoNameKey: 'ep24CanDoName', titleKey: 'ep24CloseTitle', bodyKey: 'ep24CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 25 — "She's a student"
 *
 * Blueprint: REINFORCEMENT, same canDo, novelty medium, budget 3, one new pattern,
 * reuse im and arc 1's work-or-study language, two open productions, integrated
 * reuse of `talk_about_work_or_study`, prerequisites [24], evidence "two unaided
 * third-person statements using `is`".
 *
 * An introduction that stops at a name leaves the other two people with nothing to
 * say. This is the cheapest possible next sentence: `he/she is` + something the
 * learner can already say about themselves. Arc 1's frame, in the third person.
 */
const PEOPLE_02 = {
  id: 'shes_a_student',
  arc: 'people_around_you',
  level: 'A1',
  role: 'reinforcement',
  reinforces: true,
  titleKey: 'ep25Title',
  goalKey: 'ep25Goal',
  canDoId: 'introduce_someone_else',
  canDoNameKey: 'ep25CanDoName',
  durationKey: 'ep25Duration',
  estimatedMinutes: 9,
  xp: 75,
  prerequisites: ['this_is'],
  skillPrerequisites: ['introduce_someone_else', 'talk_about_work_or_study'],
  gardenItems: ['he_she_is_pattern', 'classmate'],
  reuseSkills: ['state_life_fact', 'ask_name'],
  steps: [
    /* Remember: yesterday's introduction, because this episode continues it. */
    { type: 'recall', review: true, instructionKey: 'ep25RecallInstruction', evalKind: 'introduce_person', itemIds: ['this_is_pattern'] },
    { type: 'scene', mood: 'curious', titleKey: 'ep25SceneTitle', bodyKey: 'ep25SceneBody', showGoal: true, ctaKey: 'ep25Start' },
    /* Discover: arc 1's sentence, said about somebody else. */
    { type: 'model', target: 'She is a student. He is a teacher.', meaningItems: ['he_she_is_pattern'], explainKey: 'ep25ModelExplain' },
    /*
     * Comprehend the -s form. The blueprint hears it and never requires it, so this
     * is where the learner meets it: understood here, answered with `is`.
     */
    { type: 'comprehension', instructionKey: 'ep25ComprehensionInstruction', target: 'She works at the office.', itemId: 'works_third',
      options: [{ key: 'ep25CompOptCorrect', correct: true }, { key: 'ep25CompOptWrong1' }, { key: 'ep25CompOptWrong2' }] },
    /* Choose the form that matches the person — the one real decision in the pattern. */
    { type: 'choice', instructionKey: 'ep25ChoiceInstruction', promptEn: 'You are talking about Ana. Which is right?', itemId: 'he_she_is_pattern',
      options: [{ textEn: 'She is a student.', correct: true }, { textEn: 'She am a student.' }, { textEn: 'I is a student.' }] },
    /* Build, then guide: the verb is the gap, because the verb is the pattern. */
    { type: 'word_order', instructionKey: 'ep25OrderInstruction', hintKey: 'ep1BuildHint',
      tokens: ['He', 'is', 'my', 'classmate', '.'], itemId: 'he_she_is_pattern' },
    { type: 'fill_blank', instructionKey: 'ep25BlankInstruction', before: 'She', after: ' a student.',
      expects: 'is', itemId: 'he_she_is_pattern', hintKey: 'ep25BlankHint' },
    /*
     * Open production 1 — one thing about them, model available.
     *
     * THE PERSON IS THE EPISODE'S, AND SO IS THEIR PRONOUN. This turn used to ask
     * about `{partner}` — the name the shell derives per learner — while modelling
     * "She is a student.", so a learner whose partner is Leo was shown a sentence
     * that decided Leo's gender. The arc refuses assumptions of exactly that kind,
     * so the turn names somebody it introduces itself and states the pronoun in the
     * prompt. The pattern being taught is unchanged.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Ben is in your class. Tell me one thing about him.', instructionKey: 'ep25OpenInstruction',
      evalKind: 'state_person_fact', personName: 'Ben', suggestionEn: 'He is my classmate.', itemIds: ['he_she_is_pattern'] },
    /*
     * REUSE: arc 1's own frame, about the learner. Saying what somebody else does is
     * only useful next to being able to say what you do — the blueprint marks
     * `talk_about_work_or_study` as returning in this arc, and this is the turn.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'And you? What do you do?', instructionKey: 'ep25SelfInstruction',
      evalKind: 'state_life_fact', suggestionEn: 'I work at home.', itemIds: ['i_do_pattern'] },
    /*
     * REUSE: asking a name, because you cannot say anything about somebody whose
     * name you never asked for. Pre-A1's question, doing a job in a group.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'A third person is here and you have not met.', instructionKey: 'ep25AskNameInstruction',
      evalKind: 'ask_name', suggestionEn: 'What’s your name?', itemIds: ['whats_your_name'] },
    /*
     * Open production 2: another third-person statement, NO model. The blueprint asks
     * this episode for TWO unaided ones, so this and the recall below are both bare.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Her name is Mia and she studies with you. Tell Ben about her.', instructionKey: 'ep25AgainInstruction',
      evalKind: 'state_person_fact', personName: 'Mia', itemIds: ['he_she_is_pattern', 'classmate'] },
    /* Remember: the third person, unaided, one more time. */
    { type: 'recall', instructionKey: 'ep25FinalInstruction', evalKind: 'state_person_fact', itemIds: ['he_she_is_pattern'] },
    { type: 'completion', canDoNameKey: 'ep25CanDoName', titleKey: 'ep25CloseTitle', bodyKey: 'ep25CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 26 — "Three of us"
 *
 * Blueprint: REINFORCEMENT, novelty low, budget 1 (unspent — the arc's six items are
 * taught), no new patterns, reuse hi/how_are_you/bye/see_you, THREE open
 * productions, integrated reuse of `full_greeting`, `ask_wellbeing`,
 * `close_an_encounter` and `talk_about_work_or_study`, prerequisites [25], evidence
 * "integrated: a three-person exchange held unaided".
 *
 * One continuous group conversation, no model on screen for the arc's own capability.
 * The blueprint's `reuseMatrix` marks `full_conversation` as CONSOLIDATED in this
 * column — this episode is where that happens — and `ask_what_something_means` as
 * returning, because a group conversation is exactly where a word gets past you.
 *
 * Nothing new is granted. A reinforcement episode that hands out vocabulary is a new
 * episode wearing a costume.
 */
const PEOPLE_03 = {
  id: 'three_of_us',
  arc: 'people_around_you',
  level: 'A1',
  role: 'reinforcement',
  reinforces: true,
  titleKey: 'ep26Title',
  goalKey: 'ep26Goal',
  canDoId: 'introduce_someone_else',
  canDoNameKey: 'ep26CanDoName',
  durationKey: 'ep26Duration',
  estimatedMinutes: 10,
  xp: 85,
  prerequisites: ['shes_a_student'],
  skillPrerequisites: ['introduce_someone_else', 'full_greeting', 'ask_wellbeing', 'close_an_encounter'],
  gardenItems: [],
  reuseSkills: ['nice_to_meet', 'ask_wellbeing', 'close_encounter', 'state_life_fact', 'repair_request'],
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'ep26SceneTitle', bodyKey: 'ep26SceneBody', showGoal: true, ctaKey: 'ep26Start' },
    /*
     * One exchange from here to the end: greet, introduce, ask how they are, hear a
     * word you do not know, ask what it means, say what you do, close. Every turn is
     * a capability already owed, which is what makes this the arc's integrated
     * evidence rather than a lesson.
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Hi! Good to see you.', instructionKey: 'ep26GreetInstruction',
      evalKind: 'nice_to_meet', itemIds: ['nice_to_meet'] },
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: '{partner} arrives. You know them; Ben does not.', instructionKey: 'ep26IntroduceInstruction',
      evalKind: 'introduce_person', itemIds: ['this_is_pattern', 'possessive_pattern'] },
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Ben: “Nice to meet you, {partner}!”', instructionKey: 'ep26WellbeingInstruction',
      evalKind: 'ask_wellbeing', suggestionEn: 'How are you?', itemIds: ['how_are_you'] },
    /*
     * REUSE, BECAUSE A GROUP CONVERSATION IS WHERE IT HAPPENS: somebody says a word
     * you have not met. Arc 2's capability, in the situation it was built for.
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Ben: “I’m fine — a bit tired. Work is hectic.”', instructionKey: 'ep26MeaningInstruction',
      evalKind: 'repair_request', repairKind: 'ask_meaning', meaningWord: 'hectic',
      suggestionEn: 'What does “hectic” mean?', itemIds: ['what_does_mean_pattern'] },
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Ben: “Hectic means very busy. And what do you do?”', instructionKey: 'ep26SelfInstruction',
      evalKind: 'state_life_fact', itemIds: ['i_do_pattern'] },
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Ben: “Nice. And {partner}?”', instructionKey: 'ep26ThirdInstruction',
      evalKind: 'state_person_fact', itemIds: ['he_she_is_pattern'] },
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Ben: “I have to go. It was good to meet you both!”', instructionKey: 'ep26CloseInstruction',
      evalKind: 'close_encounter', suggestionEn: 'Bye. See you!', itemIds: ['bye', 'see_you'] },
    /* Remember: the arc's capability, one last time, with nothing on screen. */
    { type: 'recall', instructionKey: 'ep26FinalInstruction', evalKind: 'introduce_person', itemIds: ['this_is_pattern'] },
    { type: 'completion', canDoNameKey: 'ep26CanDoName', titleKey: 'ep26CloseTitle', bodyKey: 'ep26CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

export const A1_ARC3 = [PEOPLE_01, PEOPLE_02, PEOPLE_03]
export const A1_ARC3_ID = 'people_around_you'
export const getA1Arc3Episode = (id) => A1_ARC3.find(ep => ep.id === id) || null
