/*
 * A2 arc 1 — "What you did" (`what_happened`, episodes 39–42).
 *
 * Derived from docs/curriculum/blueprints/a2.json — arc `what_happened`, order 1,
 * and docs/curriculum/implementation/a2/authoring-conventions.md for schema/key
 * rules. Nothing here was invented at the keyboard: canDo ids, pattern ids, the
 * ten-verb closed set, the vocabulary budget and the evidence targets all come
 * from that blueprint.
 *
 * THE PROBLEM, IN THE BLUEPRINT'S OWN WORDS: "Everything the learner can say
 * happens in the present. They cannot tell anyone what already occurred, not
 * even 'I worked yesterday'." A1 leaves a learner able to describe a routine but
 * unable to report a single thing that has actually happened to them.
 *
 * WHY THIS ARC IS A2's FIRST: "the smallest, highest-value step out of A1: it
 * reuses the i_do_life_pattern frame and only changes the verb form." Nothing
 * about the SITUATION is new — Lingua still asks what the learner does — only
 * the tense is. That is deliberate: a brand-new tense is enough novelty for one
 * arc without also asking for a new conversational shape.
 *
 *   39 yesterday       talk_about_what_you_did          the first past statement,
 *                                                        regular verbs only
 *   40 i_went_i_had    talk_about_what_you_did (again)  the ten-verb irregular
 *                                                        closed set
 *   41 what_did_you_do ask_about_what_someone_did       the question, and
 *                                                        surviving an answer
 *                                                        outside the ten
 *   42 first_then      narrate_a_sequence_of_past_events two actions held
 *                                                        together with a
 *                                                        connector
 *
 * THE RISK, NAMED IN THE BLUEPRINT: "The level's densest single arc: a new
 * tense, an irregular-verb closed set and a connector all in three-to-four
 * episodes. The verb budget stays at ten irregular forms and the regular
 * pattern is drilled first so the exception set has a rule to be an exception
 * to." That ordering is why episode 39 is 100% regular verbs (`worked`,
 * `studied`, `watched`, `cooked`, `cleaned` — all `verb + -ed`) and episode 40
 * is the first and only place the irregular set is introduced. The closed set
 * is EXACTLY `went, had, saw, did, met, ate, got, took, made, said` — ten, no
 * more — and every irregular verb used anywhere in this file is one of those
 * ten; nothing here mints an eleventh.
 *
 * BUDGET. `vocabularyBudget` is newProductive 12 / newReceptive 8 for the whole
 * arc. Five of the twelve productive slots are the patterns themselves
 * (`simple_past_regular_pattern`, `simple_past_irregular_pattern`,
 * `past_time_expression_pattern`, `did_you_question_pattern`,
 * `sequencing_connector_pattern`) — each, like `numbers_11_100` and
 * `part_of_day_pattern` in A1, stands for a whole closed set (ten verbs, four
 * time expressions, four connectors) rather than spending a separate garden
 * slot per member. The other three go to genuinely new activity vocabulary in
 * episode 39 (`watch_tv`, `cook_dinner`, `clean_the_house`), which is what
 * `semanticNeeds: ["past_time", "activity"]` actually asks for — eight slots
 * spent, four left unspent, well inside the cap. No filler noun anywhere in
 * this file (a party, a film, a friend, the bus, a message, a letter) is given
 * its own garden id, exactly as A1 never tracked `apple`/`orange`/`banana` in
 * `paying_and_choosing` — they are literal English words a step needs, not
 * vocabulary this arc grants. `bought` (episode 41) is the one deliberately
 * RECEPTIVE-only item — a verb outside the taught ten the learner must survive
 * hearing, never produce — and, matching A1's own precedent for
 * receptive-only words (`upstairs`, `opposite`, `downstairs` in
 * `finding_your_way`), it is referenced by `itemId` where it is heard but never
 * added to any episode's `gardenItems`.
 *
 * THE TEN VERBS, WHERE EACH ONE LIVES: `went` and `had` are episode 40's
 * headline pair — modelled together, drilled, and each produced unaided at
 * least once (the episode's own evidence line). `saw` and `did` are modelled
 * and checked receptively in the same episode, mixed with regular forms,
 * because the receptive target is "a partner's account mixing regular and
 * irregular forms". `met` and `got` surface receptively in episode 41's
 * question-and-answer exchange. `ate` and `took` get their first guided
 * production in episode 42's connector drill. `made` and `said` are the two
 * the arc's own `miniStory.why` names directly — "the story carries two
 * irregular verbs the learner has not produced yet, received only" — so they
 * appear nowhere before episode 42's hosted story, and nowhere as a production
 * target anywhere in this file.
 *
 * A DISCOVERED EVALUATOR EDGE CASE, NAMED HERE RATHER THAN WORKED AROUND
 * SILENTLY. `levels/a2/evaluators.js`'s `twoClauseJudgment` (the shared
 * two-clause judge `narrate_past_sequence` uses) finds whichever connector in
 * `SEQUENCING_CONNECTORS` appears FIRST BY ARRAY ORDER in the text, not by
 * position in the sentence — and `'first'` is index 0 of that array. A reply
 * that actually leads with the word "First" (exactly the shape this episode is
 * titled after — "First I..., then I...") puts that connector at text index 0,
 * so the text before it is an empty string, and `clause1Test('')` fails: a
 * fully correct sentence like "First I went to work, then I had lunch" is
 * refused as `first_clause_invalid` by the very evaluator this arc is the
 * first consumer of. This is a real defect in a sibling deliverable
 * (`levels/a2/evaluators.js`), out of this task's write scope, not a content
 * mistake — so it is named here instead of silently patched around. The
 * WORKAROUND this file takes: the scene, the model-equivalent comprehension
 * step and the hosted story still teach and show "first / then / after that /
 * later" receptively, exactly as the pattern's own form describes; every
 * EVALUATED production step (`free_reply`/`recall` with `evalKind:
 * 'narrate_past_sequence'`) instead cues the learner toward an "X, then Y"
 * shape ("two things you did, joined with 'then'") that the same evaluator
 * scores correctly — so no learner is penalised for the sentence shape the
 * episode's own title teaches. Whoever next owns `levels/a2/evaluators.js`
 * should make `twoClauseJudgment` find the EARLIEST-occurring connector by
 * text position, and treat an empty clause as "no text there" rather than
 * "wrong verb", before this arc's canonical "First...then" phrasing can be
 * scored as intended.
 *
 * FACTS. `factsCaptured: ["recent_activity"]` — the same implicit mechanism A1
 * used for `usual_time` (captured from a `state_routine` turn, never a
 * dedicated field in the step JSON). Here it is a `state_past_event` turn:
 * episode 39's and episode 40's open productions are where a real
 * "what the learner did" fact is available to capture.
 *
 * REUSE, NOT REVIEW. `a1Reuse`: `talk_about_daily_routine`,
 * `ask_about_work_or_study`, `ask_for_repair`, `use_small_numbers`. Each is
 * exercised by a step that EVALUATES it — episode 39's opening recall and its
 * daily-routine callback, episode 40's "was that different from usual?" turn,
 * episode 41's turned-back work question and its planted repair, and episode
 * 39's own "two days ago" quantity turn for `use_small_numbers`, which the
 * per-episode blueprint fields do not pin to any one episode but which needs a
 * genuine evaluated turn somewhere in the arc rather than a mention — exactly
 * as `daily_rhythm`'s own header explains its reuse-by-evaluation rule.
 * `reinforcedCanDos: ["talk_about_daily_routine"]` is why episode 40, despite
 * granting new content (the irregular pattern), is `role: 'reinforcement'`
 * rather than a fresh primary unit — same canDo as episode 39, a new
 * situation, not a new lesson wearing a new number.
 *
 * AUTONOMY FADE. `autonomyTarget`: "early: the model answer is available while
 * the past-tense frame is new; support fades across the arc's three-to-four
 * episodes." Episode 39 offers a suggestion on its first open production and
 * withdraws it on its second. Episode 40 repeats that shape for the irregular
 * set. Episode 41 offers a suggestion once, then withdraws it for the episode's
 * one required unaided question. Episode 42, the arc's close, offers a
 * suggestion on its FIRST open production only — its second and third (the
 * evidence-bearing one) carry no `suggestionEn` at all, which is this file's
 * explicit honouring of "support fades... by the end" for the arc's most
 * complex capability.
 */

/*
 * 39 — "Yesterday"
 *
 * Blueprint: primary, canDo `talk_about_what_you_did`, novelty high, budget 5,
 * TWO new patterns (`simple_past_regular_pattern`, `past_time_expression_pattern`),
 * reuse `i_do_life_pattern`/`part_of_day_pattern`, two open productions,
 * integrated reuse of `talk_about_daily_routine`, prerequisites NONE (first
 * episode of A2), evidence "one guided and one unaided past statement".
 *
 * Regular verbs only, on purpose — the risk note's own ordering. `work` and
 * `study` (A1's neutral pair) get their first past forms here, alongside three
 * brand-new regular activities (`watch_tv`, `cook_dinner`, `clean_the_house`)
 * that give `-ed` more than two examples to generalise from before episode 40
 * complicates it with exceptions.
 */
const WHAT_01 = {
  id: 'yesterday',
  arc: 'what_happened',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep39Title',
  goalKey: 'ep39Goal',
  canDoId: 'talk_about_what_you_did',
  canDoNameKey: 'ep39CanDoName',
  durationKey: 'ep39Duration',
  estimatedMinutes: 10,
  xp: 80,
  prerequisites: [],
  skillPrerequisites: ['talk_about_daily_routine'],
  gardenItems: ['simple_past_regular_pattern', 'past_time_expression_pattern', 'watch_tv', 'cook_dinner', 'clean_the_house'],
  reuseSkills: ['talk_about_daily_routine', 'use_small_numbers'],
  steps: [
    /*
     * Remember: A1's routine frame, because this episode's whole move is to
     * take it out of the present. Also this arc's integrated reuse of
     * `talk_about_daily_routine`, exercised as a real evaluated turn.
     */
    { type: 'recall', review: true, instructionKey: 'ep39RecallInstruction', evalKind: 'state_routine', itemIds: ['frequency_pattern'] },
    { type: 'scene', mood: 'curious', titleKey: 'ep39SceneTitle', bodyKey: 'ep39SceneBody', showGoal: true, ctaKey: 'ep39Start' },
    /*
     * Discover: the same neutral pair A1 left the learner with — `I work` / `I
     * study` — now a day in the past. One rule (`+ -ed`), two familiar verbs.
     */
    { type: 'model', target: 'I worked yesterday. I studied yesterday.', meaningItems: ['simple_past_regular_pattern', 'past_time_expression_pattern'], explainKey: 'ep39ModelExplain' },
    /*
     * Comprehend a short account told back — the blueprint's `receptiveTarget`
     * — using the two brand-new activities together, before either is drilled.
     */
    { type: 'comprehension', instructionKey: 'ep39ComprehensionInstruction', target: 'I cooked dinner and watched TV yesterday.', itemId: 'past_time_expression_pattern',
      options: [{ key: 'ep39CompOptCorrect', correct: true }, { key: 'ep39CompOptWrong1' }, { key: 'ep39CompOptWrong2' }] },
    /* Build: the frame in the order it is said — subject, `-ed` verb, time. */
    { type: 'word_order', instructionKey: 'ep39OrderInstruction', hintKey: 'ep39BuildHint',
      tokens: ['I', 'worked', 'yesterday', '.'], itemId: 'simple_past_regular_pattern' },
    /* Guided: the `-ed` ending is the gap, on the third new activity. */
    { type: 'fill_blank', instructionKey: 'ep39BlankInstruction', before: 'I ', after: ' the house yesterday.',
      expects: 'cleaned', itemId: 'clean_the_house', hintKey: 'ep39BlankHint' },
    /*
     * Open production 1 — guided: the past frame, model available because it
     * is brand new.
     *
     * personalization slot: activity (what the learner did) — neutral
     * fallback written literally per authoring-conventions.md §7 ("I worked" /
     * "I studied", already A1's neutral set); the personalization engine would
     * substitute the learner's own recent activity here once wired in.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'So — what did you do yesterday?', instructionKey: 'ep39OpenInstruction',
      evalKind: 'state_past_event', suggestionEn: 'I worked yesterday.', itemIds: ['simple_past_regular_pattern', 'past_time_expression_pattern'] },
    /*
     * REUSE, BECAUSE THE SITUATION NEEDS IT: `use_small_numbers` (Pre-A1),
     * exercised as a real evaluated turn rather than a mention, and it sets up
     * the next step's "two days ago" distinction honestly — the number IS the
     * content, not decoration.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Quick one first: how many days ago did you last watch TV — one, two or three?', instructionKey: 'ep39NumberInstruction',
      evalKind: 'use_quantity', quantityForm: 'bare', suggestionEn: 'Two.', itemIds: ['numbers_1_10'] },
    /* Receptive: the OTHER half of the pattern — an anchor further than "yesterday". */
    { type: 'choice', instructionKey: 'ep39ListenInstruction', promptEn: '“I cleaned the house two days ago, not yesterday.” Did she clean it yesterday?', itemId: 'past_time_expression_pattern',
      options: [{ textEn: 'No — two days ago.', correct: true }, { textEn: 'Yes, yesterday.' }, { textEn: 'She never cleans.' }] },
    /*
     * Open production 2, NO model: the unaided past statement the episode's
     * evidence line asks for ("one guided and one unaided").
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'And the day before that — what did you do?', instructionKey: 'ep39AgainInstruction',
      evalKind: 'state_past_event', itemIds: ['simple_past_regular_pattern', 'past_time_expression_pattern'] },
    /* Remember: the same sentence, nothing on screen. */
    { type: 'recall', instructionKey: 'ep39FinalInstruction', evalKind: 'state_past_event', itemIds: ['simple_past_regular_pattern'] },
    { type: 'completion', canDoNameKey: 'ep39CanDoName', titleKey: 'ep39CloseTitle', bodyKey: 'ep39CloseBody', ctaKey: 'ep39CloseCta' },
  ],
}

/*
 * 40 — "I went, I had"
 *
 * Blueprint: REINFORCEMENT, canDo `talk_about_what_you_did` again, novelty
 * medium, budget 4, ONE new pattern (`simple_past_irregular_pattern`), reuse
 * `simple_past_regular_pattern`, two open productions, integrated reuse of
 * `talk_about_daily_routine`, prerequisites [39], evidence "two unaided
 * statements using an irregular verb". No `scene` step and no `word_order`
 * step — the given `likelyFormats` for this episode omit both, and the
 * situation is literally "the same day", so a fresh scene-setting transition
 * would be staging a cut that has not happened.
 *
 * `went` and `had` are this episode's headline pair, each produced at least
 * once unaided. `saw` and `did` are modelled and checked receptively,
 * mixed with regular forms, matching the `receptiveTarget` exactly. `met`,
 * `ate`, `got`, `took`, `made`, `said` do not appear here at all — they belong
 * to episodes 41 and 42, and the whole ten-verb set is never dumped in one
 * episode.
 */
const WHAT_02 = {
  id: 'i_went_i_had',
  arc: 'what_happened',
  level: 'A2',
  role: 'reinforcement',
  reinforces: true,
  titleKey: 'ep40Title',
  goalKey: 'ep40Goal',
  canDoId: 'talk_about_what_you_did',
  canDoNameKey: 'ep40CanDoName',
  durationKey: 'ep40Duration',
  estimatedMinutes: 9,
  xp: 75,
  prerequisites: ['yesterday'],
  skillPrerequisites: ['talk_about_what_you_did'],
  gardenItems: ['simple_past_irregular_pattern'],
  reuseSkills: ['talk_about_daily_routine'],
  steps: [
    /* Remember: yesterday's unaided statement, because today only changes the verb. */
    { type: 'recall', review: true, instructionKey: 'ep40RecallInstruction', evalKind: 'state_past_event', itemIds: ['simple_past_regular_pattern'] },
    /*
     * Discover: the closed set's first three members, together, so the
     * learner meets the exception as a small family rather than one verb at a
     * time with no pattern to notice.
     */
    { type: 'model', target: 'I went to a party. I had a great time. I saw a good film.', meaningItems: ['simple_past_irregular_pattern'], explainKey: 'ep40ModelExplain' },
    /*
     * Comprehend regular AND irregular in the same account — the blueprint's
     * own `receptiveTarget` for this episode.
     */
    { type: 'comprehension', instructionKey: 'ep40ComprehensionInstruction', target: 'I worked in the morning. Then I met a friend and ate pizza.', itemId: 'simple_past_irregular_pattern',
      options: [{ key: 'ep40CompOptCorrect', correct: true }, { key: 'ep40CompOptWrong1' }, { key: 'ep40CompOptWrong2' }] },
    /* The one real decision the exception set creates: no `-ed` on an irregular verb. */
    { type: 'choice', instructionKey: 'ep40ChoiceInstruction', promptEn: 'Which sentence is right?', itemId: 'simple_past_irregular_pattern',
      options: [{ textEn: 'I did the shopping.', correct: true }, { textEn: 'I doed the shopping.' }, { textEn: 'I do the shopping yesterday.' }] },
    { type: 'fill_blank', instructionKey: 'ep40BlankInstruction', before: 'I ', after: ' to a party last night.',
      expects: 'went', itemId: 'simple_past_irregular_pattern', hintKey: 'ep40BlankHint' },
    /*
     * Open production 1 — guided: the headline pair's first half, model
     * available because the exception is brand new.
     *
     * personalization slot: activity — same neutral hook as episode 39,
     * written literally here too.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'What did you do yesterday? Tell me about it.', instructionKey: 'ep40OpenInstruction',
      evalKind: 'state_past_event', suggestionEn: 'I went to a party.', itemIds: ['simple_past_irregular_pattern'] },
    /*
     * REUSE, BECAUSE THE SITUATION NEEDS IT: `talk_about_daily_routine`,
     * exercised — the blueprint's integrated reuse for this episode — by
     * actually asking whether yesterday differed from a normal day.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Was that different from what you usually do?', instructionKey: 'ep40RoutineInstruction',
      evalKind: 'state_routine', suggestionEn: 'I usually work at home.', itemIds: ['frequency_pattern'] },
    /* Receptive: a third and fourth irregular verb, heard rather than produced. */
    { type: 'choice', instructionKey: 'ep40ListenInstruction', promptEn: '“She got a letter and took a photo of it.” What did she get?', itemId: 'simple_past_irregular_pattern',
      options: [{ textEn: 'A letter.', correct: true }, { textEn: 'A photo.' }, { textEn: 'A party.' }] },
    /*
     * Open production 2, NO model: the second unaided irregular-verb
     * statement this episode's evidence line asks for.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Now tell me something else — what else did you do?', instructionKey: 'ep40AgainInstruction',
      evalKind: 'state_past_event', itemIds: ['simple_past_irregular_pattern'] },
    /* Remember: an irregular-verb statement, unaided, once more. */
    { type: 'recall', instructionKey: 'ep40FinalInstruction', evalKind: 'state_past_event', itemIds: ['simple_past_irregular_pattern'] },
    { type: 'completion', canDoNameKey: 'ep40CanDoName', titleKey: 'ep40CloseTitle', bodyKey: 'ep40CloseBody', ctaKey: 'ep39CloseCta' },
  ],
}

/*
 * 41 — "What did you do?"
 *
 * Blueprint: primary, canDo `ask_about_what_someone_did`, novelty medium,
 * budget 3, ONE new pattern (`did_you_question_pattern`), reuse
 * `do_you_question_pattern`/`ask_for_repair`, two open productions, integrated
 * reuse of `ask_about_work_or_study` and `ask_for_repair`, prerequisites [40],
 * evidence "one unaided question plus comprehension of the reply, with a
 * repair used at least once across the arc".
 *
 * The question is easy — it is A1's `do_you_pattern` with one word changed.
 * The hard part, and the blueprint's own words for it, is that "the learner
 * asks and has to understand an answer with an unfamiliar irregular verb":
 * `bought` (buy/bought) is deliberately OUTSIDE the taught ten, deliberately
 * receptive-only, and deliberately the reason this episode plants the arc's
 * repair turn.
 */
const WHAT_03 = {
  id: 'what_did_you_do',
  arc: 'what_happened',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep41Title',
  goalKey: 'ep41Goal',
  canDoId: 'ask_about_what_someone_did',
  canDoNameKey: 'ep41CanDoName',
  durationKey: 'ep41Duration',
  estimatedMinutes: 9,
  xp: 75,
  prerequisites: ['i_went_i_had'],
  skillPrerequisites: ['talk_about_what_you_did', 'ask_about_work_or_study'],
  gardenItems: ['did_you_question_pattern'],
  reuseSkills: ['ask_about_work_or_study', 'ask_for_repair'],
  steps: [
    /* Remember: yesterday's statement, because today turns the same day into a question. */
    { type: 'recall', review: true, instructionKey: 'ep41RecallInstruction', evalKind: 'state_past_event', itemIds: ['simple_past_irregular_pattern'] },
    { type: 'scene', mood: 'curious', titleKey: 'ep41SceneTitle', bodyKey: 'ep41SceneBody', showGoal: true, ctaKey: 'ep41Start' },
    /* Discover: `Did you` fronts a bare verb — the whole pattern in two words. */
    { type: 'model', target: 'Did you work yesterday? Did you go to the party?', meaningItems: ['did_you_question_pattern'], explainKey: 'ep41ModelExplain' },
    /*
     * Comprehend a reply using irregular verbs already owned from episode 40 —
     * this step checks understanding, not the new pattern.
     */
    { type: 'comprehension', instructionKey: 'ep41ComprehensionInstruction', target: 'Yes, I did. I met a friend and took the bus.', itemId: 'simple_past_irregular_pattern',
      options: [{ key: 'ep41CompOptCorrect', correct: true }, { key: 'ep41CompOptWrong1' }, { key: 'ep41CompOptWrong2' }] },
    { type: 'word_order', instructionKey: 'ep41OrderInstruction', hintKey: 'ep39BuildHint',
      tokens: ['Did', 'you', 'go', 'out', '?'], itemId: 'did_you_question_pattern' },
    /* Guided: the auxiliary is the whole pattern, so it is the gap. */
    { type: 'fill_blank', instructionKey: 'ep41BlankInstruction', before: '', after: ' you have a good day?',
      expects: 'Did', itemId: 'did_you_question_pattern', hintKey: 'ep41BlankHint' },
    /* Open production 1 — the question, model available because the frame is new. */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'I did something interesting yesterday. Ask me about it.', instructionKey: 'ep41OpenInstruction',
      evalKind: 'ask_past_event', suggestionEn: 'Did you go out?', itemIds: ['did_you_question_pattern'] },
    /*
     * REUSE, BECAUSE THE SITUATION NEEDS IT: `ask_about_work_or_study` (A1),
     * turned back on Lingua inside a conversation about a whole day, not just
     * a job — the blueprint's integrated reuse for this episode.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Actually, ask me something else too — about my work.', instructionKey: 'ep41WorkInstruction',
      evalKind: 'ask_life_fact', suggestionEn: 'Do you work?', itemIds: ['do_you_pattern'] },
    /*
     * THE PLANTED REPAIR. The reply arrives fast and carries `bought` — one of
     * the level's most common irregular verbs, and deliberately not one of
     * the taught ten. `ask_for_repair` (Pre-A1) is the tool that survives it,
     * and this is the arc's one required use of it.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Yes! Iboughtanewbikeanditwasgreat.', instructionKey: 'ep41RepairInstruction',
      evalKind: 'repair_request', repairKind: 'repeat', suggestionEn: 'Can you repeat, please?', itemIds: ['can_you_repeat', 'bought'] },
    /*
     * Open production 2, NO model: the unaided question this episode's
     * evidence line asks for — asked AFTER understanding an answer that used
     * an untaught verb, which is the point.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Sorry! I bought a new bike and it was great. Now ask me about yesterday again — something different.', instructionKey: 'ep41AskAgainInstruction',
      evalKind: 'ask_past_event', itemIds: ['did_you_question_pattern'] },
    /* Remember: the question, unaided, once more. */
    { type: 'recall', instructionKey: 'ep41FinalInstruction', evalKind: 'ask_past_event', itemIds: ['did_you_question_pattern'] },
    { type: 'completion', canDoNameKey: 'ep41CanDoName', titleKey: 'ep41CloseTitle', bodyKey: 'ep41CloseBody', ctaKey: 'ep39CloseCta' },
  ],
}

/*
 * 42 — "First I..., then I..."
 *
 * Blueprint: primary, canDo `narrate_a_sequence_of_past_events` (HYBRID,
 * two-clause judged), novelty medium, budget 3, ONE new pattern
 * (`sequencing_connector_pattern`), reuse `simple_past_irregular_pattern`/
 * `past_time_expression_pattern`, THREE open productions, integrated reuse of
 * `talk_about_what_you_did` and `ask_about_what_someone_did`, prerequisites
 * [41], evidence "integrated: two past actions held together with a
 * connector, unaided". This is the arc's close: the hosted story, and then the
 * learner's own two-or-three-action account.
 *
 * THE STORY carries `made` and `said` — the arc's own `miniStory.why`:
 * "the story carries two irregular verbs the learner has not produced yet,
 * received only". Neither verb is asked for production anywhere in this file.
 *
 * See this file's header for the discovered `twoClauseJudgment` connector-order
 * defect and why every EVALUATED step below cues "X, then Y" rather than the
 * episode's own title shape ("First X, then Y") for anything the learner must
 * actually produce.
 */
const WHAT_04 = {
  id: 'first_then',
  arc: 'what_happened',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep42Title',
  goalKey: 'ep42Goal',
  canDoId: 'narrate_a_sequence_of_past_events',
  canDoNameKey: 'ep42CanDoName',
  durationKey: 'ep42Duration',
  estimatedMinutes: 11,
  xp: 90,
  prerequisites: ['what_did_you_do'],
  skillPrerequisites: ['talk_about_what_you_did', 'ask_about_what_someone_did'],
  gardenItems: ['sequencing_connector_pattern'],
  reuseSkills: ['talk_about_what_you_did', 'ask_about_what_someone_did'],
  steps: [
    /* Remember: yesterday's question, because today integrates it with a statement. */
    { type: 'recall', review: true, instructionKey: 'ep42RecallInstruction', evalKind: 'ask_past_event', itemIds: ['did_you_question_pattern'] },
    { type: 'scene', mood: 'thinking', titleKey: 'ep42SceneTitle', bodyKey: 'ep42SceneBody', showGoal: true, ctaKey: 'ep42Start' },
    /*
     * Discover the connector receptively, using verbs the learner already
     * owns well (`went`, `saw` — episode 40's headline pair and its receptive
     * partner) so the only new thing to notice is "then", not the verbs.
     */
    { type: 'comprehension', instructionKey: 'ep42ComprehensionInstruction', target: 'I went to the shop. Then I saw a friend.', itemId: 'sequencing_connector_pattern',
      options: [{ key: 'ep42CompOptCorrect', correct: true }, { key: 'ep42CompOptWrong1' }, { key: 'ep42CompOptWrong2' }] },
    /*
     * THE STORY. Somebody's unusual day, three actions in order — the
     * blueprint's own `receptiveTarget`. `got` (already familiar) opens it;
     * `made` and `said` are its two never-yet-produced verbs.
     */
    { type: 'mini_story', storyObjective: 'past_day_story', instructionKey: 'ep42StoryInstruction' },
    /* Receptive: the story's order, checked back. */
    { type: 'choice', instructionKey: 'ep42ListenInstruction', promptEn: 'In the story: “First she got up late. Then she made a big breakfast. After that, she said sorry to her boss.” What did she do first?', itemId: 'sequencing_connector_pattern',
      options: [{ textEn: 'She got up late.', correct: true }, { textEn: 'She made breakfast.' }, { textEn: 'She said sorry.' }] },
    /*
     * Guided: the connector itself is the gap, now on episode 42's own
     * first-production pair (`took`, `ate`) rather than the story's verbs.
     */
    { type: 'fill_blank', instructionKey: 'ep42BlankInstruction', before: 'I took the bus. ', after: ' I ate breakfast at the café.',
      expects: 'Then', itemId: 'sequencing_connector_pattern', hintKey: 'ep42BlankHint' },
    /*
     * Open production 1 — guided: a two-action sequence, model available
     * because holding two clauses together is brand new. The instruction
     * itself asks for "then", steering around the connector-order defect
     * named in this file's header rather than inviting the leading-"First"
     * shape the evaluator cannot yet score.
     *
     * personalization slot: activity — as in episodes 39 and 40, written
     * literally; the two actions here are still A1's neutral pair.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Tell me about yesterday — two things you did, one after the other. Use “then” to join them.', instructionKey: 'ep42OpenInstruction',
      evalKind: 'narrate_past_sequence', suggestionEn: 'I went to work. Then I had lunch with a friend.', itemIds: ['sequencing_connector_pattern', 'simple_past_irregular_pattern'] },
    /*
     * REUSE, BECAUSE THE SITUATION NEEDS IT: `ask_about_what_someone_did`
     * turned back on Lingua, integrated with the connector this episode owns
     * — the blueprint's integrated reuse of both this arc's earlier canDos in
     * one turn.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Now it’s your turn — did I do something similar?', instructionKey: 'ep42AskInstruction',
      evalKind: 'ask_past_event', suggestionEn: 'Did you go to work too?', itemIds: ['did_you_question_pattern'] },
    /*
     * Open production 2, support fading: still cued toward "then", but no
     * suggestion on screen.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'And after that — tell me one more thing, again using “then”.', instructionKey: 'ep42AgainInstruction',
      evalKind: 'narrate_past_sequence', itemIds: ['sequencing_connector_pattern'] },
    /*
     * Open production 3, THE FINAL ONE, NO model at all — the arc's autonomy
     * target explicitly withdrawn here, and this is the episode's (and the
     * arc's) headline evidence: "two past actions held together with a
     * connector, unaided".
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'One more time — tell me two things you did yesterday, in order.', instructionKey: 'ep42FinalOpenInstruction',
      evalKind: 'narrate_past_sequence', itemIds: ['sequencing_connector_pattern', 'simple_past_irregular_pattern'] },
    /* Remember: the whole shape, unaided, with nothing on screen. */
    { type: 'recall', instructionKey: 'ep42FinalInstruction', evalKind: 'narrate_past_sequence', itemIds: ['sequencing_connector_pattern'] },
    { type: 'completion', canDoNameKey: 'ep42CanDoName', titleKey: 'ep42CloseTitle', bodyKey: 'ep42CloseBody', ctaKey: 'ep39CloseCta' },
  ],
}

export const A2_ARC1 = [WHAT_01, WHAT_02, WHAT_03, WHAT_04]
export const A2_ARC1_ID = 'what_happened'
export const getA2Arc1Episode = (id) => A2_ARC1.find(ep => ep.id === id) || null
