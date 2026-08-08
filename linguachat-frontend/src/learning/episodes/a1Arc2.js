/*
 * A1 arc 2 — "How your day goes" (`daily_rhythm`, episodes 21–23).
 *
 * Derived from docs/curriculum/a1-blueprint.json, not from memory. The arc's own
 * words for what it is for: "The learner can say what they do but not when or how
 * often, so they cannot describe a day or understand somebody else's."
 *
 * Three capabilities, all `required`, all `deterministic_local`:
 *
 *   21 my_day             talk_about_daily_routine     actions, with how often
 *   22 at_seven           say_when_something_happens   the same actions, in time
 *   23 what_does_it_mean  ask_what_something_means      a word taken out and kept
 *
 * WHAT THIS ARC SPENDS, and why it is spent this way. The blueprint calls arc 2
 * "the level's densest moment" and answers its own risk: "The verb budget is five
 * actions and the frequency set is two adverbs." So of eight productive entries,
 * FOUR are the pattern groups the arc must introduce, two are frequency adverbs,
 * and only two are new actions — the routine is built out of `get up`, `have
 * breakfast` and arc 1's `work` and `study`, which is four actions inside a budget
 * of five. Nothing here is a timetable and nothing is a verb list.
 *
 * WHAT IT REUSES. The blueprint's reuse matrix marks five old capabilities as `R`
 * in this column, and each one is exercised by a step that EVALUATES it rather
 * than by a mention: `use_small_numbers` (the hour is a number), `express_preferences`
 * (what you like doing in the evening), `ask_for_repair` (a time misheard),
 * `talk_about_work_or_study` and `ask_about_work_or_study` (arc 1's frame is the
 * routine's frame). This is why there is no "review Arc 1" unit: arc 1's language
 * comes back inside a situation that needs it.
 *
 * ONE new intent, not three. `state_routine` carries a `timeForm` subtype, exactly
 * as Pre-A1's repair carries `repairKind` — the blueprint's rule, and the reason
 * `say_when_something_happens` has no intent of its own. Asking what a word means
 * is `repair_request` with the new `ask_meaning` kind, which the blueprint
 * prescribes in the can-do itself (`intentReuse`).
 */

/*
 * 21 — "My day"
 *
 * Blueprint: primary, canDo `talk_about_daily_routine`, novelty high, budget 5,
 * one new pattern, reuse i_like/i_want, two open productions, integrated reuse of
 * `talk_about_work_or_study`, prerequisites [20], evidence "two unaided action
 * statements".
 *
 * The situation is Lingua asking what a day looks like. The frame is arc 1's, so
 * the episode opens by using it and then extends it: first an action, then how
 * often. The two open productions are the blueprint's, and the second one has no
 * model on screen, which is where the unaided evidence comes from.
 */
const RHYTHM_01 = {
  id: 'my_day',
  arc: 'daily_rhythm',
  level: 'A1',
  role: 'primary',
  titleKey: 'ep21Title',
  goalKey: 'ep21Goal',
  canDoId: 'talk_about_daily_routine',
  canDoNameKey: 'ep21CanDoName',
  durationKey: 'ep21Duration',
  estimatedMinutes: 9,
  xp: 75,
  prerequisites: ['meeting_someone_new'],
  skillPrerequisites: ['talk_about_work_or_study'],
  gardenItems: ['get_up', 'have_breakfast', 'usually', 'sometimes', 'frequency_pattern'],
  reuseSkills: ['talk_about_work_or_study', 'express_like'],
  steps: [
    /* Remember: arc 1's frame, because this episode is about extending it. */
    { type: 'recall', review: true, instructionKey: 'ep21RecallInstruction', evalKind: 'state_life_fact', itemIds: ['i_do_pattern'] },
    { type: 'scene', mood: 'curious', titleKey: 'ep21SceneTitle', bodyKey: 'ep21SceneBody', showGoal: true, ctaKey: 'ep21Start' },
    /* Discover: two new actions, in the frame the learner already owns. */
    { type: 'model', target: 'I get up. I have breakfast.', meaningItems: ['get_up', 'have_breakfast'], explainKey: 'ep21ModelExplain' },
    /*
     * Comprehend how often. `usually` and `sometimes` are the whole frequency set
     * the arc allows, and the difference between them is the thing to understand
     * before either is produced.
     */
    { type: 'comprehension', instructionKey: 'ep21ComprehensionInstruction', target: 'I sometimes study in the evening.', itemId: 'sometimes',
      options: [{ key: 'ep21CompOptCorrect', correct: true }, { key: 'ep21CompOptWrong1' }, { key: 'ep21CompOptWrong2' }] },
    /* Build: where the adverb goes, which is the only thing about it worth drilling. */
    { type: 'word_order', instructionKey: 'ep21OrderInstruction', hintKey: 'ep1BuildHint',
      tokens: ['I', 'usually', 'get', 'up', 'early', '.'], itemId: 'frequency_pattern' },
    /* Guided: the frame with the adverb left out, and both adverbs are true answers. */
    { type: 'fill_blank', instructionKey: 'ep21BlankInstruction', before: 'I', after: ' have breakfast at home.',
      expects: 'usually', alternatives: ['sometimes'], itemId: 'frequency_pattern', hintKey: 'ep21BlankHint' },
    /*
     * Open production 1 — one action, model available because the frame is new.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'So, {name} — what do you do every day?', instructionKey: 'ep21OpenInstruction',
      evalKind: 'state_routine', suggestionEn: 'I usually get up early.', itemIds: ['get_up', 'usually', 'frequency_pattern'] },
    /*
     * REUSE, BECAUSE THE SITUATION NEEDS IT. The blueprint lists
     * `express_preferences` among the arc's Pre-A1 reuse, and an evening is where
     * it belongs: what somebody does with their free time is what they like. The
     * subject comes from the existing interest/fact context, so this turn is also
     * where arc 2 is personalised — through the layer Pre-A1 already uses.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'And in the evening? Tell me one thing you like.', instructionKey: 'ep21LikeInstruction',
      evalKind: 'express_like', contextIntent: 'express_like', suggestionEn: 'I like {noun}.', itemIds: ['i_like'] },
    /*
     * Receptive: a longer routine told back, which is the blueprint's
     * `receptiveTarget`. Two actions and an adverb in one breath.
     */
    { type: 'choice', instructionKey: 'ep21ListenInstruction', promptEn: 'Ana says: “I usually get up at seven. I sometimes have breakfast at work.” Does Ana always have breakfast at home?', itemId: 'sometimes',
      options: [{ textEn: 'No, not always.', correct: true }, { textEn: 'Yes, always.' }, { textEn: 'She never has breakfast.' }] },
    /*
     * Open production 2, integrated with arc 1: what you do AND what your day
     * looks like, in one turn. NO model on screen — the arc's autonomy target says
     * support fades where the frame is reused, and this is the reused frame.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'One more time, all together: what do you do, and when?', instructionKey: 'ep21IntegratedInstruction',
      evalKind: 'state_routine', itemIds: ['i_do_pattern', 'get_up', 'usually'] },
    /* Remember: the same sentence, unaided, which is this episode's evidence. */
    { type: 'recall', instructionKey: 'ep21FinalInstruction', evalKind: 'state_routine', itemIds: ['frequency_pattern', 'get_up', 'have_breakfast'] },
    { type: 'completion', canDoNameKey: 'ep21CanDoName', titleKey: 'ep21CloseTitle', bodyKey: 'ep21CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 22 — "At seven, in the morning"
 *
 * Blueprint: primary, canDo `say_when_something_happens`, novelty high, budget 4,
 * TWO new patterns, reuse numbers_1_10, two open productions, integrated reuse of
 * `use_small_numbers` and `talk_about_daily_routine`, prerequisites [21], evidence
 * "one unaided statement with a time, and a repair used when a time is misheard".
 *
 * The same actions, now anchored. Two anchors, taught in the order they are
 * needed: the part of the day is vaguer and safer, the hour is exact and needs
 * Pre-A1's numbers. The repair is not decoration — the blueprint puts it in the
 * evidence line, because a time you did not catch is the commonest breakdown
 * there is.
 */
const RHYTHM_02 = {
  id: 'at_seven',
  arc: 'daily_rhythm',
  level: 'A1',
  role: 'primary',
  titleKey: 'ep22Title',
  goalKey: 'ep22Goal',
  canDoId: 'say_when_something_happens',
  canDoNameKey: 'ep22CanDoName',
  durationKey: 'ep22Duration',
  estimatedMinutes: 9,
  xp: 75,
  prerequisites: ['my_day'],
  skillPrerequisites: ['talk_about_daily_routine', 'use_small_numbers'],
  gardenItems: ['part_of_day_pattern', 'time_at_pattern'],
  reuseSkills: ['use_quantity', 'talk_about_daily_routine', 'ask_for_repair'],
  steps: [
    /* Remember: yesterday's routine, because time is what it is missing. */
    { type: 'recall', review: true, instructionKey: 'ep22RecallInstruction', evalKind: 'state_routine', itemIds: ['frequency_pattern'] },
    { type: 'scene', mood: 'welcoming', titleKey: 'ep22SceneTitle', bodyKey: 'ep22SceneBody', showGoal: true, ctaKey: 'ep22Start' },
    /* Discover: the two anchors, side by side, so the difference is visible. */
    { type: 'model', target: 'I work in the morning. I finish at five.', meaningItems: ['part_of_day_pattern', 'time_at_pattern'], explainKey: 'ep22ModelExplain' },
    /* Comprehend which anchor was used. */
    { type: 'comprehension', instructionKey: 'ep22ComprehensionInstruction', target: 'I have breakfast at eight.', itemId: 'time_at_pattern',
      options: [{ key: 'ep22CompOptCorrect', correct: true }, { key: 'ep22CompOptWrong1' }, { key: 'ep22CompOptWrong2' }] },
    /* Build: the part of the day, which is three words that travel together. */
    { type: 'word_order', instructionKey: 'ep22OrderInstruction', hintKey: 'ep1BuildHint',
      tokens: ['I', 'study', 'in', 'the', 'evening', '.'], itemId: 'part_of_day_pattern' },
    /*
     * Guided: the preposition is the whole pattern, so it is the gap.
     */
    { type: 'fill_blank', instructionKey: 'ep22BlankInstruction', before: 'I get up', after: ' seven.',
      expects: 'at', itemId: 'time_at_pattern', hintKey: 'ep22BlankHint' },
    /*
     * REUSE: the hour is a number, and Pre-A1 taught one to ten. Asking for it back
     * as a quantity is the honest way to exercise `use_small_numbers` — the
     * blueprint's `R` in this column — rather than mentioning a number in passing.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Quick one first: how many hours do you work? Two or three?', instructionKey: 'ep22NumberInstruction',
      evalKind: 'use_quantity', quantityForm: 'bare', count: 3, suggestionEn: 'Three.', itemIds: ['numbers_1_10'] },
    /*
     * Open production 1: an action with a part of the day, model available.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'When do you work or study — morning, afternoon or evening?', instructionKey: 'ep22OpenInstruction',
      evalKind: 'state_routine', timeForm: 'part_of_day', suggestionEn: 'I usually work in the morning.', itemIds: ['part_of_day_pattern', 'usually'] },
    /*
     * REUSE, BECAUSE THE SITUATION NEEDS IT: a time said too fast is exactly the
     * breakdown the blueprint names in this episode's evidence line, and repairing
     * it is Pre-A1's capability doing a job in a new situation.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Igetupatsixandifinishatnine.', instructionKey: 'ep22RepairInstruction',
      evalKind: 'repair_request', repairKind: 'repeat', suggestionEn: 'Can you repeat, please?', itemIds: ['can_you_repeat'] },
    /*
     * Open production 2: the hour, and NO model this time. This is the unaided
     * statement with a time that the episode's evidence line asks for — and the
     * turn a `usual_time` fact can be captured from.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Sorry! I get up at six and I finish at nine. And you — what time do you get up?', instructionKey: 'ep22ClockInstruction',
      evalKind: 'state_routine', timeForm: 'clock', itemIds: ['time_at_pattern', 'get_up'] },
    /* Remember: an action, a time, nothing on screen. */
    { type: 'recall', instructionKey: 'ep22FinalInstruction', evalKind: 'state_routine', timeForm: 'clock', itemIds: ['time_at_pattern'] },
    { type: 'completion', canDoNameKey: 'ep22CanDoName', titleKey: 'ep22CloseTitle', bodyKey: 'ep22CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 23 — "What does that mean?"
 *
 * Blueprint: primary, canDo `ask_what_something_means`, novelty medium, budget 2,
 * one new pattern, reuse i_dont_understand/can_you_repeat, THREE open productions,
 * integrated reuse of `ask_for_repair`, `talk_about_daily_routine` and
 * `say_when_something_happens`, prerequisites [22], evidence "integrated: routine
 * plus time plus a repair the learner chose to use", and a hosted story.
 *
 * The first repair that learns rather than pauses. Pre-A1 can stop a conversation
 * it does not follow; this takes one word out of it and keeps going, which is what
 * makes more input survivable. The story carries two words nobody taught — `early`
 * and `late` — so the question has something real to be about, and both of them
 * stay receptive: the learner is never asked to produce them.
 */
const RHYTHM_03 = {
  id: 'what_does_it_mean',
  arc: 'daily_rhythm',
  level: 'A1',
  role: 'primary',
  titleKey: 'ep23Title',
  goalKey: 'ep23Goal',
  canDoId: 'ask_what_something_means',
  canDoNameKey: 'ep23CanDoName',
  durationKey: 'ep23Duration',
  estimatedMinutes: 10,
  xp: 85,
  prerequisites: ['at_seven'],
  skillPrerequisites: ['ask_for_repair', 'talk_about_daily_routine', 'say_when_something_happens'],
  gardenItems: ['what_does_mean_pattern'],
  reuseSkills: ['ask_for_repair', 'ask_about_work_or_study', 'talk_about_daily_routine'],
  steps: [
    /* Remember: an action with a time, which is what the story will ask for back. */
    { type: 'recall', review: true, instructionKey: 'ep23RecallInstruction', evalKind: 'state_routine', timeForm: 'clock', itemIds: ['time_at_pattern'] },
    { type: 'scene', mood: 'thinking', titleKey: 'ep23SceneTitle', bodyKey: 'ep23SceneBody', showGoal: true, ctaKey: 'ep23Start' },
    /* Discover: the question, with the word in quotes so the shape is obvious. */
    { type: 'model', target: 'What does “early” mean?', meaningItems: ['what_does_mean_pattern', 'early'], explainKey: 'ep23ModelExplain' },
    /*
     * Comprehend the difference between the two repairs the learner now has. This
     * is the receptive half of the capability: knowing which tool to reach for.
     */
    { type: 'comprehension', instructionKey: 'ep23ComprehensionInstruction', target: 'What does “late” mean?', itemId: 'late',
      options: [{ key: 'ep23CompOptCorrect', correct: true }, { key: 'ep23CompOptWrong1' }, { key: 'ep23CompOptWrong2' }] },
    /*
     * The hosted story: somebody else's day, carrying both unknown words. The
     * learner chooses a repair, hears the answer, and says two things of their own.
     */
    { type: 'mini_story', storyObjective: 'state_routine' },
    /*
     * Guided: the question itself, with the model on offer because the frame is new.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'I usually finish late.', instructionKey: 'ep23OpenInstruction',
      evalKind: 'repair_request', repairKind: 'ask_meaning', meaningWord: 'late',
      suggestionEn: 'What does “late” mean?', itemIds: ['what_does_mean_pattern'] },
    /*
     * REUSE: Pre-A1's repair, which is a different tool for a different problem —
     * here nothing was unclear, it was too fast. Having both is the point.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Ifinishlateonmondaysandtuesdays.', instructionKey: 'ep23RepairInstruction',
      evalKind: 'repair_request', repairKind: 'repeat', suggestionEn: 'Can you repeat, please?', itemIds: ['can_you_repeat'] },
    /*
     * Open production: the meaning question again, with NO model. This is the
     * unaided use the capability's evidence needs.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Sorry! I finish late on Mondays. I am always busy then.', instructionKey: 'ep23AskAgainInstruction',
      evalKind: 'repair_request', repairKind: 'ask_meaning', meaningWord: 'busy', itemIds: ['what_does_mean_pattern'] },
    /*
     * REUSE: arc 1's question, turned back on Lingua. The blueprint's reuse matrix
     * marks `ask_about_work_or_study` as returning in this arc, and a conversation
     * about days is where asking what somebody does belongs.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Busy means a lot to do. Ask me something about my days.', instructionKey: 'ep23AskBackInstruction',
      evalKind: 'ask_life_fact', itemIds: ['do_you_pattern'] },
    /* Remember: routine plus time, integrated, with nothing on screen. */
    { type: 'recall', instructionKey: 'ep23FinalInstruction', evalKind: 'state_routine', timeForm: 'clock', itemIds: ['time_at_pattern', 'frequency_pattern'] },
    { type: 'completion', canDoNameKey: 'ep23CanDoName', titleKey: 'ep23CloseTitle', bodyKey: 'ep23CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

export const A1_ARC2 = [RHYTHM_01, RHYTHM_02, RHYTHM_03]
export const A1_ARC2_ID = 'daily_rhythm'
export const getA1Arc2Episode = (id) => A1_ARC2.find(ep => ep.id === id) || null
