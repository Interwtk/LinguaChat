/*
 * A2 arc 6 — "When something's wrong" (`everyday_problems`, order 6, episodes
 * 55–57).
 *
 * Derived from docs/curriculum/blueprints/a2.json#arcs (id `everyday_problems`)
 * and its three episode entries (plannedNumber 55–57), cross-checked against
 * a2.md §§6–7 for the arc's personalization plan and autonomy target. Nothing
 * here was invented at the keyboard: the capabilities, the two new patterns,
 * the vocabulary budget, the reuse, the evidence targets and the risk note all
 * come from those files. `linguachat-frontend/src/learning/levels/a2/semanticTypes.js`
 * already proposes the `problem` semantic type this arc needs — its bounded
 * example list (`broken`, "doesn't work", `lost`, `the wrong one`, `cold`,
 * `noisy`) and its neutral-fallback value ("the room is cold") are reused
 * verbatim below rather than re-invented.
 *
 * WHY THIS ARC IS SIXTH. Every A1 and A2 transaction so far — buying
 * something, arranging to meet, booking a room — has assumed success. A
 * learner who can book a table cannot yet say the room is cold, that the
 * order is wrong, or that something is lost, and cannot ask for it to be
 * fixed. This arc needs something already booked or bought to go wrong WITH,
 * so it follows `booking_a_stay` directly and deliberately reuses that arc's
 * hotel scene rather than inventing a new situation for its own sake — the
 * same booking that succeeded in episodes 51–54 is the one that has a problem
 * on arrival here.
 *
 * THE RISK, NAMED IN THE BLUEPRINT: "Turning into a complaint-letter register
 * exercise. The arc stays informal and cooperative — the other person always
 * wants to help — because negotiation and register belong to B1/B2." So the
 * hotel receptionist in every episode below is warm, apologetic and
 * solution-oriented. There is no difficult customer-service standoff, no
 * bureaucratic excuse, no register shift and no confrontation — the one
 * genuinely new expectation this arc adds is that the learner sometimes has
 * to DECLINE a first offer and re-propose (a2.md §9's "late" autonomy note),
 * not that the other person makes that hard.
 *
 * PATTERNS. `problem_report_pattern` ("There's a problem with ___ / My ___
 * doesn't work / I lost my ___") is new in episode 55 and reaches
 * `independent` per its own blueprint entry. `help_request_pattern` ("Can you
 * help me with ___? What should I do?") is new in episode 56, prerequisite on
 * `problem_report_pattern`, and also reaches `independent`. Both canDos'
 * evaluation strategy is honoured exactly: `report_a_problem` is
 * `deterministic_local` (evalKind `report_problem`), `ask_for_help_solving_a_problem`
 * is `hybrid` (evalKind `ask_for_help`).
 *
 * AUTONOMY TARGET: "late: unaided by default, support returning after a wrong
 * answer." Unlike the level's early/mid arcs, episodes 55 and 56 do NOT open a
 * free_reply with `suggestionEn` on offer — scaffolding here is `word_order`/
 * `fill_blank` build-up BEFORE the open turn, not a model answer sitting on
 * top of it. Episode 57 goes further: no `suggestionEn` anywhere, on the
 * blueprint's explicit instruction, because it is the arc's fully unaided
 * integration story.
 *
 * PERSONALIZATION (a2.md §7, `semanticTypes.js#A2_ARC_PERSONALIZATION`): this
 * arc is `light`, one compatible slot, `problem`, drawn from a small BOUNDED
 * neutral set — a cold room, a wrong order, a lost item, and close variants
 * (noisy room, wrong item) — never an open-ended catalogue. The neutral
 * fallback a learner without a matching context (or a QA run) actually sees
 * is written literally below: "the room is cold". Slot type is noted inline
 * wherever the scene/prompt text carries it, per convention §7.
 */

/*
 * 55 — "There's a problem"
 *
 * Blueprint: primary, canDo `report_a_problem`, situation "something about
 * the booking is wrong on arrival", novelty medium, new language budget 4,
 * one new pattern (`problem_report_pattern`), reuse `book_a_room_or_table` +
 * `ask_for_repair` (Pre-A1), production target "the problem statement, guided
 * then open", receptive target "an apology and a question back", two open
 * productions, integrated reuse of `book_a_room_or_table`, prerequisites
 * NONE (arc's first episode — capability readiness comes from
 * `skillPrerequisites`, exactly as A1's own arc-openers work), evidence "two
 * unaided problem reports".
 */
const PROBLEM_01 = {
  id: 'theres_a_problem',
  arc: 'everyday_problems',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep55Title',
  goalKey: 'ep55Goal',
  canDoId: 'report_a_problem',
  canDoNameKey: 'ep55CanDoName',
  durationKey: 'ep55Duration',
  estimatedMinutes: 8,
  xp: 70,
  prerequisites: [],
  skillPrerequisites: ['ask_for_repair', 'book_a_room_or_table'],
  /*
   * Four new productive items, one per blueprint's budget, one per branch of
   * `problem_report_pattern` (`problem_with` / `doesnt_work` / `lost`) plus
   * the one concrete detail word (`cold`) the neutral personalization
   * fallback actually needs. No new item for "wrong order" or "the wrong
   * one" here — those stay receptive-only in this arc, exercised through
   * comprehension/choice, so the transfer test the blueprint asks for later
   * (a2.md §16: "reporting a problem type not directly taught") has a real
   * novel context to test against rather than every variant already drilled.
   */
  gardenItems: ['problem_with', 'doesnt_work', 'lost', 'cold', 'problem_report_pattern'],
  reuseSkills: ['book_a_room_or_table', 'ask_for_repair'],
  steps: [
    /* Remember: the booking this arc's whole situation depends on. */
    { type: 'recall', review: true, instructionKey: 'ep55RecallInstruction', evalKind: 'make_booking', itemIds: ['booking_pattern'] },
    /*
     * personalization slot: `problem` (bounded set: cold room / wrong order /
     * lost item). Neutral fallback written literally, per convention §7: "the
     * room is cold" — the same value semanticTypes.js#A2_ARC_PERSONALIZATION
     * already names for this arc.
     */
    { type: 'scene', mood: 'concerned', titleKey: 'ep55SceneTitle', bodyKey: 'ep55SceneBody', showGoal: true, ctaKey: 'ep55Start' },
    /* Discover: the frame, with its concrete neutral detail already in it. */
    { type: 'model', target: "There's a problem with the room. It's cold.", meaningItems: ['problem_with', 'cold'], explainKey: 'ep55ModelExplain' },
    /*
     * The apology-plus-question-back is RECEPTIVE here, exactly as the
     * blueprint's receptiveTarget asks: understanding that the other person
     * is on the learner's side, and is asking a genuine follow-up, is what
     * keeps this arc cooperative rather than adversarial from its first turn.
     */
    { type: 'comprehension', instructionKey: 'ep55ComprehensionInstruction', target: "I'm sorry about that. What's the problem exactly?", itemId: 'sorry_about_that',
      options: [{ key: 'ep55CompOptCorrect', correct: true }, { key: 'ep55CompOptWrong1' }, { key: 'ep55CompOptWrong2' }] },
    /* Build: the frame, assembled before it has to be produced unaided. */
    { type: 'word_order', instructionKey: 'ep55OrderInstruction', hintKey: 'ep55OrderHint',
      tokens: ['There’s', 'a', 'problem', 'with', 'the', 'room', '.'], itemId: 'problem_report_pattern' },
    /* Guided: the pattern's second branch ("My ___ doesn't work"), one word left in it. */
    { type: 'fill_blank', instructionKey: 'ep55BlankInstruction', before: 'My key card doesn’t ', after: '.',
      expects: 'work', itemId: 'doesnt_work', hintKey: 'ep55BlankHint' },
    /*
     * Open production 1, UNAIDED — no suggestionEn. The arc's late autonomy
     * target withdraws the model answer from here on; the word_order and
     * fill_blank steps above are the scaffolding that returns after a wrong
     * attempt, not a suggestion sitting on top of the open turn.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Good evening, welcome back! How is everything?', instructionKey: 'ep55OpenInstruction',
      evalKind: 'report_problem', itemIds: ['problem_with', 'cold', 'problem_report_pattern'] },
    /*
     * Receptive: the pattern's third branch ("I lost my ___"), and a
     * receptive nod to the arc's bounded problem set without spending
     * productive budget on it — the learner only has to recognise it here.
     */
    { type: 'choice', instructionKey: 'ep55ListenInstruction', promptEn: 'Two guests speak to the front desk. Ana says: "My key card doesn\'t work." Ben says: "I lost my room key." Who lost something?', itemId: 'lost',
      options: [{ textEn: 'Ben.', correct: true }, { textEn: 'Ana.' }, { textEn: 'Neither of them.' }] },
    /*
     * Open production 2, INTEGRATED with `book_a_room_or_table`: the desk
     * clerk checks the booking itself before the problem is repeated, so
     * this turn sits inside the booking, not next to it — which is what
     * "integrated reuse" means and the blueprint asks for by name.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Let me check... yes, I have your booking here, a room for two nights. Is everything all right?', instructionKey: 'ep55IntegratedInstruction',
      evalKind: 'report_problem', itemIds: ['problem_with', 'cold', 'doesnt_work'] },
    /* Remember: the same statement, unaided, nothing on screen — the arc's own evidence target. */
    { type: 'recall', instructionKey: 'ep55FinalInstruction', evalKind: 'report_problem', itemIds: ['problem_report_pattern', 'cold'] },
    { type: 'completion', canDoNameKey: 'ep55CanDoName', titleKey: 'ep55CloseTitle', bodyKey: 'ep55CloseBody', ctaKey: 'ep55CloseCta' },
  ],
}

/*
 * 56 — "What should I do?"
 *
 * Blueprint: primary, canDo `ask_for_help_solving_a_problem`, situation "the
 * problem is acknowledged; the learner asks for it to be fixed", novelty
 * medium, new language budget 3, one new pattern (`help_request_pattern`),
 * reuse `polite_request` (A1) + `report_a_problem`, production target "the
 * help request, unaided", receptive target "a solution offered that the
 * learner must understand and accept or decline", two open productions,
 * integrated reuse of `report_a_problem` + `polite_request`, prerequisites
 * [55], evidence "one unaided help request plus comprehension of a proposed
 * solution". No `scene` in the blueprint's likely formats — this episode
 * continues the SAME encounter episode 55 left open, exactly as A2's own
 * mid-arc booking episodes (52, 53) do not reopen a scene either.
 */
const PROBLEM_02 = {
  id: 'what_should_i_do',
  arc: 'everyday_problems',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep56Title',
  goalKey: 'ep56Goal',
  canDoId: 'ask_for_help_solving_a_problem',
  canDoNameKey: 'ep56CanDoName',
  durationKey: 'ep56Duration',
  estimatedMinutes: 8,
  xp: 70,
  prerequisites: ['theres_a_problem'],
  /*
   * The canDo's own prerequisite is `report_a_problem` alone; `polite_request`
   * is not required to ATTEMPT this episode but is exactly what its second
   * open turn integrates, matching A1's precedent (`a1Arc1.js` WORK_02) of
   * `reuseSkills` naming more than `skillPrerequisites` does.
   */
  skillPrerequisites: ['report_a_problem'],
  gardenItems: ['help_with', 'what_should_i_do', 'fix', 'help_request_pattern'],
  reuseSkills: ['polite_request', 'report_a_problem'],
  steps: [
    /* Remember: yesterday's capability, because today's builds directly on top of it. */
    { type: 'recall', review: true, instructionKey: 'ep56RecallInstruction', evalKind: 'report_problem', itemIds: ['problem_report_pattern'] },
    /* Discover: the new frame, both halves at once. */
    { type: 'model', target: 'Can you help me with this? What should I do?', meaningItems: ['help_with', 'what_should_i_do'], explainKey: 'ep56ModelExplain' },
    /*
     * RECEPTIVE: the problem is acknowledged, exactly as the blueprint's
     * situation names it. Understanding that the desk is already on the
     * learner's side is what keeps the next turn a request, not a demand.
     */
    { type: 'comprehension', instructionKey: 'ep56ComprehensionInstruction', target: 'Of course. Let me see what I can do.', itemId: 'of_course',
      options: [{ key: 'ep56CompOptCorrect', correct: true }, { key: 'ep56CompOptWrong1' }, { key: 'ep56CompOptWrong2' }] },
    /* Build: the request half of the frame. */
    { type: 'word_order', instructionKey: 'ep56OrderInstruction', hintKey: 'ep56OrderHint',
      tokens: ['Can', 'you', 'help', 'me', 'with', 'this', '?'], itemId: 'help_request_pattern' },
    /* Guided: the question half, one word left in it. */
    { type: 'fill_blank', instructionKey: 'ep56BlankInstruction', before: 'What ', after: ' I do?',
      expects: 'should', itemId: 'help_request_pattern', hintKey: 'ep56BlankHint' },
    /*
     * Open production 1, UNAIDED — the episode's own capability, and the
     * blueprint's exact evidence target: "one unaided help request".
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: "I'm sorry to hear that. That shouldn't happen.", instructionKey: 'ep56OpenInstruction',
      evalKind: 'ask_for_help', itemIds: ['help_with', 'help_request_pattern', 'what_should_i_do'] },
    /*
     * RECEPTIVE: the solution offered, which the learner has to understand —
     * not yet accept or decline (that branch is the whole point of episode
     * 57's integration story, so it is not pre-empted here).
     */
    { type: 'choice', instructionKey: 'ep56ListenInstruction', promptEn: 'The receptionist says: "I can bring you extra blankets right away." What does she offer?', itemId: 'extra_blankets',
      options: [{ textEn: 'Extra blankets.', correct: true }, { textEn: 'A different hotel.' }, { textEn: 'Nothing — she cannot help.' }] },
    /*
     * Open production 2, INTEGRATED reuse of `polite_request` (Pre-A1) in a
     * situation that is not about ordering food or drink — the blueprint
     * names `polite_request` as this episode's other reused capability, and
     * this is where it does real work: following up politely, unaided.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'I can bring extra blankets to your room right away.', instructionKey: 'ep56PoliteInstruction',
      evalKind: 'polite_request', itemIds: ['can_i_have', 'please', 'fix'] },
    /* Remember: the arc's own new capability, unaided, nothing on screen. */
    { type: 'recall', instructionKey: 'ep56FinalInstruction', evalKind: 'ask_for_help', itemIds: ['help_request_pattern', 'what_should_i_do'] },
    { type: 'completion', canDoNameKey: 'ep56CanDoName', titleKey: 'ep56CloseTitle', bodyKey: 'ep56CloseBody', ctaKey: 'ep56CloseCta' },
  ],
}

/*
 * 57 — "Fixed"
 *
 * Blueprint: REINFORCEMENT, canDo `report_a_problem` again (the arc's
 * integration episode), situation "a hosted story: the whole
 * problem-to-resolution exchange at the hotel from the booking arc", novelty
 * low, new language budget 1 (`instead` — one word left to spend, per the
 * arc's total budget of 8 productive items: 4 + 3 + 1), no new patterns,
 * reuse `problem_report_pattern` + `help_request_pattern` + `thank_you`
 * (A1), production target "the whole exchange, unaided", receptive target "a
 * solution offered on the second try, after the first is declined", THREE
 * open productions, integrated reuse of `report_a_problem` +
 * `ask_for_help_solving_a_problem` + `book_a_room_or_table`, prerequisites
 * [56], evidence "integrated: a problem raised, a first solution declined
 * with a reason, a second solution accepted, all unaided" — exactly three
 * productions, matching `openProductions: 3` exactly, so no fourth turn is
 * added here even though the episode also integrates
 * `ask_for_help_solving_a_problem`: that capability's own phrasing
 * ("help me with...") is folded into the decline-and-repropose turn itself
 * rather than given a separate assessed turn, the same way A1's own
 * integration episodes sometimes weave a reused capability into another
 * turn's content instead of spending a whole extra turn on it (see
 * `a1Arc1.js` WORK_01's final open turn).
 *
 * NO suggestionEn ANYWHERE in this episode, on the blueprint's explicit
 * instruction — this is the arc's fully unaided closing story.
 *
 * The decline turn's evalKind is `state_opinion_with_reason`
 * (`arc3`/`people_and_places`'s hybrid, two-clause "because" intent, reused
 * here rather than reinvented): a2.md §9 names "decline and re-propose" as
 * the one genuinely new support shape this level's late arcs add, and this
 * is where `everyday_problems` exercises it. A canonical two-clause example
 * for that evalKind already exists in arc 3's own content, so this episode
 * does not need to re-teach the connector — it only needs to reuse the
 * capability in a new, cooperative situation, exactly as a reinforcement
 * episode should.
 */
const PROBLEM_03 = {
  id: 'fixed',
  arc: 'everyday_problems',
  level: 'A2',
  role: 'reinforcement',
  reinforces: true,
  titleKey: 'ep57Title',
  goalKey: 'ep57Goal',
  canDoId: 'report_a_problem',
  canDoNameKey: 'ep57CanDoName',
  durationKey: 'ep57Duration',
  estimatedMinutes: 10,
  xp: 80,
  prerequisites: ['what_should_i_do'],
  skillPrerequisites: ['report_a_problem', 'ask_for_help_solving_a_problem', 'book_a_room_or_table'],
  gardenItems: ['instead'],
  reuseSkills: ['report_a_problem', 'ask_for_help_solving_a_problem', 'book_a_room_or_table'],
  steps: [
    /* Remember: both of the arc's own capabilities, before returning to the scene that needs them. */
    { type: 'recall', review: true, instructionKey: 'ep57RecallInstruction', evalKind: 'report_problem', itemIds: ['problem_report_pattern', 'help_request_pattern'] },
    /*
     * Not the arc's first scene, so no `showGoal`. The booking is reused
     * narratively here (integratedReuse names `book_a_room_or_table`) rather
     * than through a separate assessed turn — the same room, the same
     * booking, one more night, something still not right.
     */
    { type: 'scene', mood: 'hopeful', titleKey: 'ep57SceneTitle', bodyKey: 'ep57SceneBody', ctaKey: 'ep57Start' },
    /* Open production 1, UNAIDED: the problem, raised again, in a whole exchange this time. */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Welcome back! I hope everything is all right tonight.', instructionKey: 'ep57ReportInstruction',
      evalKind: 'report_problem', itemIds: ['problem_report_pattern', 'cold'] },
    /*
     * Open production 2, UNAIDED: the first solution offered (blankets, the
     * same offer episode 56 only had to be UNDERSTOOD) is now declined WITH A
     * REASON and a re-proposed alternative — the new productive item
     * `instead` does exactly that job. This is the level's "decline and
     * re-propose" ceiling, and it folds in `ask_for_help_solving_a_problem`'s
     * own phrasing ("Can you help me with...") rather than spending a fourth
     * turn on it separately.
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: "I'm sorry about that. I can bring you extra blankets right away.", instructionKey: 'ep57DeclineInstruction',
      evalKind: 'state_opinion_with_reason', itemIds: ['instead', 'help_request_pattern'] },
    /*
     * RECEPTIVE, woven into this turn's own promptEn rather than a separate
     * step: the second solution, offered after the first was declined —
     * exactly the blueprint's receptive target for this episode.
     */
    /* Open production 3, UNAIDED: the second solution is accepted, and thanked — the arc's `thank_you` (A1) reuse. */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Of course — I understand. Would you like to move to a different room instead? It has full heating.', instructionKey: 'ep57AcceptInstruction',
      evalKind: 'thank_service', itemIds: ['thank_you'] },
    /*
     * THE STORY. The blueprint asks for it by name: "a hosted story: the
     * whole problem-to-resolution exchange at the hotel from the booking
     * arc." The three turns above are what this file can assess directly;
     * the hosted retelling is the engine-rendered whole shape, exactly as
     * `a1Arc5.js`'s `cafe_order_conversation` story sits alongside its own
     * episode's explicit turns rather than replacing them.
     */
    { type: 'mini_story', storyObjective: 'problem_resolution_story', instructionKey: 'ep57StoryInstruction' },
    /* Remember: the whole shape, unaided, with nothing on screen — the level's delayed-retrieval evidence for this arc. */
    { type: 'recall', instructionKey: 'ep57FinalInstruction', evalKind: 'report_problem', itemIds: ['problem_report_pattern', 'help_request_pattern'] },
    { type: 'completion', canDoNameKey: 'ep57CanDoName', titleKey: 'ep57CloseTitle', bodyKey: 'ep57CloseBody', ctaKey: 'ep57CloseCta' },
  ],
}

export const A2_ARC6 = [PROBLEM_01, PROBLEM_02, PROBLEM_03]
export const A2_ARC6_ID = 'everyday_problems'
export const getA2Arc6Episode = (id) => A2_ARC6.find(ep => ep.id === id) || null
