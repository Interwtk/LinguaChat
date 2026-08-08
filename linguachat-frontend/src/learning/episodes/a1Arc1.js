/*
 * A1 arc 1 — "What you do". The first real A1 content.
 *
 * Derived from docs/curriculum/a1-blueprint.json, arc `work_and_study`, planned
 * episodes 18–20. Nothing here was invented at the keyboard: the capabilities,
 * the patterns, the vocabulary budget, the reuse, the evidence targets and the
 * risk note all come from that file, and the check script compares this content
 * back against it.
 *
 * WHY THIS ARC IS FIRST. A Pre-A1 learner can greet somebody, give their name and
 * say where they are from — and then the conversation stops, because they cannot
 * say what fills their days and cannot ask. This is the smallest step from that
 * cliff, and it introduces the statement frame every later A1 arc reuses.
 *
 * THE RISK, NAMED IN THE BLUEPRINT: "the statement frame invites a profession
 * list. The budget is spent on the frame and on two or three neutral workplaces,
 * not on jobs." So there is no `nurse`, no `engineer`, no `teacher`. The learner
 * leaves with `I work` / `I study` (+ where), which is a sentence they can extend
 * for the rest of the level, rather than one noun they cannot use anywhere else.
 *
 * REUSE, NOT REVIEW. Pre-A1 language returns because a new situation needs it: the
 * arc opens by introducing yourself (because you have to, before saying what you
 * do), and closes with a whole exchange where the new capability sits inside
 * greeting, name, origin and goodbye. No episode is a review unit.
 *
 * All prose lives behind i18n keys and every English target is literal, exactly as
 * Pre-A1 does it: the target language is never translated, and everything the
 * learner reads about the target is in their own.
 */

/*
 * 18 — "I work, I study"
 *
 * Blueprint: primary, canDo `talk_about_work_or_study`, new language budget 3,
 * one new pattern, reuse im/im_from/hi, two open productions, integrated reuse of
 * `introduce_self`, curriculum prerequisites NONE (it does not require finishing
 * episode 17; it requires the capabilities below), evidence "one guided and one
 * unaided statement".
 */
const WORK_01 = {
  id: 'what_you_do',
  arc: 'work_and_study',
  level: 'A1',
  role: 'primary',
  titleKey: 'ep18Title',
  goalKey: 'ep18Goal',
  canDoId: 'talk_about_work_or_study',
  canDoNameKey: 'ep18CanDoName',
  durationKey: 'ep18Duration',
  estimatedMinutes: 8,
  xp: 70,
  /*
   * Empty on purpose, and it is the blueprint's decision rather than an omission:
   * what this episode needs is the CAPABILITY of introducing yourself, not the
   * completion of the episode that happens to be numbered before it.
   */
  prerequisites: [],
  skillPrerequisites: ['introduce_self', 'ask_origin'],
  gardenItems: ['work', 'study', 'i_do_pattern', 'at_home'],
  reuseSkills: ['introduce_self'],
  steps: [
    /* Remember: the conversation this arc extends, in the learner's own words. */
    { type: 'recall', review: true, instructionKey: 'ep18RecallInstruction', evalKind: 'introduction', itemIds: ['im'] },
    { type: 'scene', mood: 'welcoming', titleKey: 'ep18SceneTitle', bodyKey: 'ep18SceneBody', showGoal: true, ctaKey: 'ep18Start' },
    /* Discover: two verbs, one frame. */
    { type: 'model', target: 'I work. I study.', meaningItems: ['work', 'study'], explainKey: 'ep18ModelExplain' },
    /*
     * The question is RECEPTIVE here. Understanding "What do you do?" is what the
     * next six turns depend on; asking it is episode 19's capability, and giving
     * it away now would leave that episode with nothing to teach.
     */
    { type: 'comprehension', instructionKey: 'ep18ComprehensionInstruction', target: 'What do you do?', itemId: 'what_do_you_do',
      options: [{ key: 'ep18CompOptCorrect', correct: true }, { key: 'ep18CompOptWrong1' }, { key: 'ep18CompOptWrong2' }] },
    /* Build: the frame, assembled before it has to be produced. */
    { type: 'word_order', instructionKey: 'ep18OrderInstruction', target: 'I work at home.', itemId: 'i_do_pattern' },
    /* Guided: the frame with one decision left in it. */
    { type: 'fill_blank', instructionKey: 'ep18BlankInstruction', promptEn: 'I ____ at home.', answerEn: 'work',
      alternatives: ['study'], itemId: 'i_do_pattern', hintKey: 'ep18BlankHint' },
    /*
     * Open production 1. The model answer is on offer because the frame is new —
     * the blueprint's autonomy target for this arc — and taking it is honest
     * practice that is not counted as independent.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'So — what do you do?', instructionKey: 'ep18OpenInstruction',
      evalKind: 'state_life_fact', suggestionEn: 'I work at home.', itemIds: ['work', 'study', 'i_do_pattern', 'at_home'],
      personalizes: ['work_or_study'] },
    /*
     * Receptive: two other people answer, one of them from a place the learner has
     * never been taught. Understanding an unknown workplace is the point.
     */
    { type: 'choice', instructionKey: 'ep18ListenInstruction', promptEn: 'Ana says: “I work at the office.” Ben says: “I study at university.” Who studies?', itemId: 'at_the_office',
      options: [{ textEn: 'Ben.', correct: true }, { textEn: 'Ana.' }, { textEn: 'Nobody.' }] },
    /*
     * Open production 2, integrated with Pre-A1: a new person, so the learner has
     * to introduce themselves AND say what they do. Two capabilities, one turn,
     * which is what "integrated reuse" means.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'This is Ana. Ana: “Hi! I’m Ana. I work at the office.”', instructionKey: 'ep18IntegratedInstruction',
      evalKind: 'state_life_fact', suggestionEn: 'Hi, I’m Sam. I study at home.', itemIds: ['im', 'work', 'study', 'i_do_pattern'],
      personalizes: ['name', 'work_or_study'] },
    /* Remember: the same sentence, without a model on screen. */
    { type: 'recall', instructionKey: 'ep18FinalInstruction', evalKind: 'state_life_fact', itemIds: ['i_do_pattern', 'work', 'study'] },
    { type: 'completion', canDoNameKey: 'ep18CanDoName', titleKey: 'ep18CloseTitle', bodyKey: 'ep18CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 19 — "And you?"
 *
 * Blueprint: primary, canDo `ask_about_work_or_study`, budget 2, one new pattern,
 * reuse whats_your_name/what_about_you, two open productions, prerequisites [18],
 * evidence "one unaided question plus comprehension of the reply".
 */
const WORK_02 = {
  id: 'and_you',
  arc: 'work_and_study',
  level: 'A1',
  role: 'primary',
  titleKey: 'ep19Title',
  goalKey: 'ep19Goal',
  canDoId: 'ask_about_work_or_study',
  canDoNameKey: 'ep19CanDoName',
  durationKey: 'ep19Duration',
  estimatedMinutes: 8,
  xp: 70,
  prerequisites: ['what_you_do'],
  skillPrerequisites: ['talk_about_work_or_study', 'ask_name'],
  gardenItems: ['what_do_you_do', 'do_you_pattern', 'at_the_office', 'at_university'],
  reuseSkills: ['ask_name', 'talk_about_work_or_study', 'ask_for_repair'],
  steps: [
    /* Remember: yesterday's capability, because this episode answers before it asks. */
    { type: 'recall', review: true, instructionKey: 'ep19RecallInstruction', evalKind: 'state_life_fact', itemIds: ['i_do_pattern'] },
    { type: 'scene', mood: 'curious', titleKey: 'ep19SceneTitle', bodyKey: 'ep19SceneBody', showGoal: true, ctaKey: 'ep19Start' },
    /* Discover: the question the learner could only understand until now. */
    { type: 'model', target: 'Do you work?', meaningItems: ['do_you_pattern', 'what_do_you_do'], explainKey: 'ep19ModelExplain' },
    /* Comprehend the REPLY, which is half of this episode's evidence. */
    { type: 'comprehension', instructionKey: 'ep19ComprehensionInstruction', target: 'I study at university.', itemId: 'at_university',
      options: [{ key: 'ep19CompOptCorrect', correct: true }, { key: 'ep19CompOptWrong1' }, { key: 'ep19CompOptWrong2' }] },
    { type: 'word_order', instructionKey: 'ep19OrderInstruction', target: 'Do you work?', itemId: 'do_you_pattern' },
    { type: 'fill_blank', instructionKey: 'ep19BlankInstruction', promptEn: '____ you study?', answerEn: 'Do',
      itemId: 'do_you_pattern', hintKey: 'ep19BlankHint' },
    /* Open production 1: ask, with the model still available. */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'I work at the office. Your turn — ask me something.', instructionKey: 'ep19OpenInstruction',
      evalKind: 'ask_life_fact', suggestionEn: 'Do you study?', itemIds: ['do_you_pattern', 'what_do_you_do'] },
    /* Reuse: the Pre-A1 question, in a conversation that is not about names. */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'We have not met properly. Go on — ask me.', instructionKey: 'ep19NameInstruction',
      evalKind: 'ask_name', suggestionEn: 'What’s your name?', itemIds: ['whats_your_name'] },
    /*
     * REUSE, BECAUSE THE SITUATION NEEDS IT. The blueprint lists `ask_for_repair`
     * among the arc's Pre-A1 reuse, and this is where it belongs: an answer arrives
     * too fast and mentions a workplace nobody taught. Asking for a repeat is the
     * capability the fifth Pre-A1 arc built, doing a job in a conversation that is
     * not about repair.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'I’malexandIworkatasmallshopnearhere.', instructionKey: 'ep19RepairInstruction',
      evalKind: 'repair_request', repairKind: 'repeat', suggestionEn: 'Can you repeat, please?', itemIds: ['can_you_repeat'] },
    /*
     * Open production 2: ask again, now that the answer was understood — and with
     * NO model this time. The can-do's evidence target is two independent uses, and
     * an episode where every open turn offers the answer can only ever produce one
     * (on the final recall). So the model is withheld from here on, which is also
     * the arc's autonomy target: available while the frame is new, gone by the end.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Sorry! I’m Alex. I work at a small shop near here.', instructionKey: 'ep19AskAgainInstruction',
      evalKind: 'ask_life_fact', itemIds: ['do_you_pattern'] },
    /* Remember: the question, unaided, which is the arc's evidence for it. */
    { type: 'recall', instructionKey: 'ep19FinalInstruction', evalKind: 'ask_life_fact', itemIds: ['do_you_pattern', 'what_do_you_do'] },
    { type: 'completion', canDoNameKey: 'ep19CanDoName', titleKey: 'ep19CloseTitle', bodyKey: 'ep19CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 20 — "Meeting someone new"
 *
 * Blueprint: REINFORCEMENT, canDo `talk_about_work_or_study` again, novelty low,
 * budget 1 (unspent — the arc's six productive items are already taught), no new
 * patterns, three open productions, reuse hi/im/whats_your_name/im_from/bye,
 * prerequisites [19], evidence "integrated: the arc's capability inside a Pre-A1
 * conversation", and no hosted story: "the arc's value is a two-way exchange,
 * which roleplay carries better".
 *
 * So this is one continuous encounter, five productive turns, no model on screen
 * for the arc's own capability. Nothing new is granted: a reinforcement episode
 * that hands out vocabulary is a new episode wearing a costume.
 */
const WORK_03 = {
  id: 'meeting_someone_new',
  arc: 'work_and_study',
  level: 'A1',
  role: 'reinforcement',
  reinforces: true,
  titleKey: 'ep20Title',
  goalKey: 'ep20Goal',
  canDoId: 'talk_about_work_or_study',
  canDoNameKey: 'ep20CanDoName',
  durationKey: 'ep20Duration',
  estimatedMinutes: 10,
  xp: 80,
  prerequisites: ['and_you'],
  skillPrerequisites: ['introduce_self', 'ask_name', 'ask_origin', 'close_an_encounter'],
  gardenItems: [],
  reuseSkills: ['introduce_self', 'ask_name', 'ask_origin', 'close_an_encounter'],
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'ep20SceneTitle', bodyKey: 'ep20SceneBody', showGoal: true, ctaKey: 'ep20Start' },
    /*
     * One exchange from here to the end: greet, give your name, ask theirs, say
     * what you do, hear an extra detail you were not asked about, and close. Every
     * turn is a capability already owed, which is what makes this the arc's
     * integrated evidence rather than a lesson.
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Oh, hi!', instructionKey: 'ep20GreetInstruction',
      evalKind: 'introduction', itemIds: ['hi', 'im'], personalizes: ['name'] },
    /*
     * She has not said her name, so asking is the natural next turn — and it is the
     * `ask_name` reuse the blueprint asks this episode to integrate. Written the
     * other way round first, with Maya introducing herself, the reuse was a claim in
     * a metadata list that no turn honoured.
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Nice to meet you!', instructionKey: 'ep19NameInstruction',
      evalKind: 'ask_name', itemIds: ['whats_your_name'] },
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'I’m Maya.', instructionKey: 'ep20AskInstruction',
      evalKind: 'ask_origin', suggestionEn: 'Where are you from?', itemIds: ['where_from'] },
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'I’m from Lima. And I study at university. What do you do?', instructionKey: 'ep20LifeInstruction',
      evalKind: 'state_life_fact', itemIds: ['i_do_pattern', 'work', 'study'], personalizes: ['work_or_study'] },
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Oh, nice. I also work at home on Fridays.', instructionKey: 'ep20AskBackInstruction',
      evalKind: 'ask_life_fact', itemIds: ['do_you_pattern'] },
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Yes, I do. It was good to meet you!', instructionKey: 'ep20CloseInstruction',
      evalKind: 'close_encounter', suggestionEn: 'Thanks, bye.', itemIds: ['bye'] },
    /* Remember: the arc's capability, one last time, with nothing on screen. */
    { type: 'recall', instructionKey: 'ep20FinalInstruction', evalKind: 'state_life_fact', itemIds: ['i_do_pattern'] },
    { type: 'completion', canDoNameKey: 'ep20CanDoName', titleKey: 'ep20CloseTitle', bodyKey: 'ep20CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

export const A1_ARC1 = [WORK_01, WORK_02, WORK_03]
export const A1_ARC1_ID = 'work_and_study'
export const getA1Arc1Episode = (id) => A1_ARC1.find(ep => ep.id === id) || null
