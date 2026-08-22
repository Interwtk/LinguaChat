/*
 * A2 arc 4 — "How to get there" (`getting_around`, episodes 49–50).
 *
 * Derived from docs/curriculum/blueprints/a2.json#arcs (id `getting_around`, order 4)
 * and #episodes (plannedNumber 49–50). Nothing curricular here was invented at the
 * keyboard — capabilities, patterns, budgets, reuse and risk all come from that file.
 *
 * THE PROBLEM, IN THE BLUEPRINT'S OWN WORDS: "A1 left the learner able to ask where
 * something is and understand a one-step answer. A real answer is rarely one step,
 * and the learner cannot follow it or give one back." A1's `finding_your_way` arc
 * (episodes 27–29) stopped deliberately at where-and-near; this arc is the deferred
 * multi-step load, now that the learner has something to hold a sequence together
 * with.
 *
 * WHY NOW, NOT RIGHT AFTER A1: the blueprint's `whyNow` is explicit — this arc needs
 * the sequencing connector (`first` / `then` / `after that` / `later`) that
 * `what_happened` built for narrating past events. `multi_step_direction_pattern`
 * literally has `sequencing_connector_pattern` as its prerequisite pattern, and this
 * arc is that connector's second job: holding together not memories, but turns.
 *
 * TWO CAPABILITIES, ONE PATTERN, TWO WEIGHTS.
 *   49 turn_left_then              follow_directions_with_more_than_one_step (REQUIRED)
 *   50 go_straight_then_turn_right give_simple_directions                    (SHOULD)
 * `give_simple_directions` is `should`, not `required`, because the blueprint's own
 * `why` says the receptive side is the higher-value autonomy skill for a learner who
 * is themselves lost — and per `reuseMatrix.quietRows`, no later arc reuses it, so its
 * evidence here is deliberately lighter (`independent: 1, transfer: 0,
 * delayedRetrieval: false`) rather than overbuilt. Episode 49 carries the heavier
 * evidence load (`transfer: 1, delayedRetrieval: true`) because it is the required
 * capability the level actually depends on.
 *
 * THE RISK, NAMED IN THE BLUEPRINT: "Direction creep into full route-planning or
 * maps. The arc stops at three steps, verbal only, exactly as A1 stopped at
 * where-and-near." So no direction in this file ever exceeds three clauses, and none
 * of them ever gestures at a map, a pin or a visual aid — every direction is spoken,
 * exactly the way a passer-by on a street actually gives one.
 *
 * NO STORY, ON PURPOSE. `miniStory.use: false`, and the blueprint's own reason is the
 * design instruction: "Directions are best felt as an interactive roleplay where a
 * wrong turn has a visible consequence, not as a narrated scene." So both episodes
 * use `format: 'roleplay'` free_reply turns instead of a hosted `mini_story` step —
 * episode 50 in particular is written as one continuous encounter, the same shape as
 * A1 arc1's `WORK_03` closer.
 *
 * VOCABULARY IS RECEPTIVE-HEAVY BY DESIGN. `vocabularyBudget` allows 8 new productive
 * and 8 new receptive items, and this arc leans into the receptive side structurally,
 * not just by count: both canDos carry `evidence.comprehension: true`, and episode
 * 49's whole shape is built around one receptive event — a three-step direction that
 * deliberately outruns first-pass production — rather than around teaching more
 * words. The file ends up spending far fewer than 8 items on either side; the budget
 * is a ceiling, not a quota, and a direction lesson that hands out landmark nouns
 * nobody asked for is the same mistake A1 arc1 refused with job titles.
 *
 * REUSE, NOT REVIEW. `a1Reuse`: `ask_where_something_is`, `ask_for_repair`,
 * `ask_about_getting_somewhere` — the first two do real jobs below (asking is what
 * earns a multi-step answer in the first place; repair is what survives one).
 * `a2Reuse`: `narrate_a_sequence_of_past_events` returns as a skill prerequisite,
 * because what it actually hands this arc is the sequencing connector, not a
 * situation to revisit. `reinforcedCanDos`: `ask_where_something_is` and
 * `say_where_something_is` both get a real turn — the latter is not a review, it is
 * the exact clause every direction in this arc ends on ("...it's on the right").
 *
 * NO PERSONALIZATION. `a2.json#arcs[].personalization` for this arc is explicit:
 * "the situation is the lesson, exactly as A1's finding_your_way stayed
 * unpersonalized." Every place named below — the market, the bakery, the bank, the
 * corner, the crossing — is a fixed, neutral scene element, not a slot standing in
 * for a learner's interest. There is deliberately no personalization-slot comment
 * anywhere in this file, matching the arc's own instruction.
 */

/*
 * 49 — "Turn left, then..."
 *
 * Blueprint: primary, canDo `follow_directions_with_more_than_one_step` (required),
 * situation "asking the way and following a three-step spoken answer", novelty
 * medium, new language budget 5, ONE new pattern, reuse where_is_pattern /
 * sequencing_connector_pattern / ask_for_repair, two open productions, integrated
 * reuse of `ask_where_something_is` and `ask_for_repair`, prerequisites NONE (it
 * needs the CAPABILITY of asking where something is and narrating a sequence, not
 * the completion of a specific earlier episode), evidence "one unaided
 * comprehension of a three-step direction, with a repair used when a step is
 * missed".
 *
 * THE SHAPE OF THE EPISODE IS THE EVIDENCE. The learner asks (A1's job), receives an
 * answer that runs together at native speed (the planted repair — "a real
 * multi-step answer will always outrun the learner's vocabulary at some point"),
 * asks again, and THEN the three-step answer is checked for real. Confirming the
 * route back afterwards, unaided, is the blueprint's own `productionTarget`.
 */
const GETTING_01 = {
  id: 'turn_left_then',
  arc: 'getting_around',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep49Title',
  goalKey: 'ep49Goal',
  canDoId: 'follow_directions_with_more_than_one_step',
  canDoNameKey: 'ep49CanDoName',
  durationKey: 'ep49Duration',
  estimatedMinutes: 10,
  xp: 85,
  /*
   * Empty on purpose, matching A1's own precedent (a1Arc1.js WORK_01): this episode
   * needs the CAPABILITY of asking where something is and holding a short sequence
   * together, not the completion of whichever A2 episode happens to be numbered 48.
   */
  prerequisites: [],
  skillPrerequisites: ['ask_where_something_is', 'narrate_a_sequence_of_past_events'],
  gardenItems: ['multi_step_direction_pattern', 'straight', 'turn', 'left', 'right'],
  reuseSkills: ['ask_where_something_is', 'ask_for_repair'],
  steps: [
    /* Remember: the one-step question A1 built, because a three-step answer only ever arrives after it. */
    { type: 'recall', review: true, instructionKey: 'ep49RecallInstruction', evalKind: 'ask_location', itemIds: ['where_is_pattern'] },
    { type: 'scene', mood: 'curious', titleKey: 'ep49SceneTitle', bodyKey: 'ep49SceneBody', showGoal: true, ctaKey: 'ep49Start' },
    /*
     * Discover: the pattern in its own canonical form — three actions, one
     * sequencing frame, and the arc stops exactly here, at three, per the risk note.
     */
    { type: 'model', target: 'Go straight, then turn left, it’s on the right.', meaningItems: ['multi_step_direction_pattern', 'straight', 'turn', 'left', 'right'], explainKey: 'ep49ModelExplain' },
    /*
     * Reinforce, not review: the blueprint lists `say_where_something_is` among this
     * arc's reinforced canDos, and this is where it earns its place — the word that
     * finishes any direction is exactly its own location pattern.
     */
    { type: 'choice', instructionKey: 'ep49ChoiceInstruction', promptEn: 'The direction ends: “Go straight, then turn right. It’s ___ the market.” Which word is right?', itemId: 'next_to',
      options: [{ textEn: 'next to', correct: true }, { textEn: 'on' }, { textEn: 'from' }] },
    /* Build: the frame, in the order it is spoken. */
    { type: 'word_order', instructionKey: 'ep49OrderInstruction', hintKey: 'ep1BuildHint',
      tokens: ['Go', 'straight', ',', 'then', 'turn', 'left', '.'], itemId: 'multi_step_direction_pattern' },
    /* Guided: either direction is right, whichever the learner means. */
    { type: 'fill_blank', instructionKey: 'ep49BlankInstruction', before: 'Go straight, then turn ', after: ', it’s on the right.',
      expects: 'left', alternatives: ['right'], itemId: 'multi_step_direction_pattern', hintKey: 'ep49BlankHint' },
    /*
     * REUSE, BECAUSE THE SITUATION NEEDS IT FIRST: a three-step answer only ever
     * arrives after someone asks. This is `ask_where_something_is` doing the job it
     * was built for, one arc later.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Excuse me — you look like you know this street.', instructionKey: 'ep49AskInstruction',
      evalKind: 'ask_location', placeName: 'the market', suggestionEn: 'Where is the market?', itemIds: ['where_is_pattern'] },
    /*
     * THE PLANTED REPAIR. The autonomy target says it plainly: "a real multi-step
     * answer will always outrun the learner's vocabulary at some point." Three steps
     * arrive run together, at native speed, and asking for it again is A1's
     * `ask_for_repair`, doing a job a one-step answer never demanded of it.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Gostraightthenturnrightthenit’snexttothebank.', instructionKey: 'ep49RepairInstruction',
      evalKind: 'repair_request', repairKind: 'repeat', suggestionEn: 'Sorry, can you say that again?', itemIds: ['can_you_repeat'] },
    /*
     * Repeated, clearly, and NOW checked — this is the episode's real evidence line:
     * one unaided comprehension of a three-step direction, right after the repair
     * that made understanding it possible. `bank` is deliberately unfamiliar —
     * receptive only, never added to gardenItems, exactly as A1's `upstairs` was.
     */
    { type: 'comprehension', instructionKey: 'ep49ComprehensionInstruction', target: 'Go straight, then turn right, then it’s next to the bank.', itemId: 'bank',
      options: [{ key: 'ep49CompOptCorrect', correct: true }, { key: 'ep49CompOptWrong1' }, { key: 'ep49CompOptWrong2' }] },
    /*
     * Open production 1, unaided on purpose — the blueprint's `productionTarget`,
     * "confirming the route back in the learner's own words". No suggestion on
     * screen: this is the arc's own capability, produced, not recognised.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Just to be sure I understood you too — can you tell me the way back, in your own words?', instructionKey: 'ep49ConfirmInstruction',
      evalKind: 'give_multi_step_directions', itemIds: ['multi_step_direction_pattern'] },
    /*
     * Open production 2 — a new place this time, nothing here was modeled for it,
     * which is the transfer evidence the canDo's evaluation asks for. Episode 50's
     * own opening recall is where this capability's delayed retrieval runs.
     */
    { type: 'recall', instructionKey: 'ep49FinalInstruction', evalKind: 'give_multi_step_directions', itemIds: ['multi_step_direction_pattern'] },
    { type: 'completion', canDoNameKey: 'ep49CanDoName', titleKey: 'ep49CloseTitle', bodyKey: 'ep49CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 50 — "Go straight, then turn right"
 *
 * Blueprint: primary, canDo `give_simple_directions` (SHOULD — the quiet one,
 * `reuseMatrix.quietRows`: no reuse arc after this one, carried only by the review
 * scheduler and delayed retrieval), situation "somebody asks the learner the way
 * this time", novelty low, new language budget 2, NO new patterns (reuses
 * `multi_step_direction_pattern` and `say_where_something_is`), two open
 * productions, integrated reuse of `follow_directions_with_more_than_one_step` and
 * `say_where_something_is`, prerequisites [49], evidence "integrated: one direction
 * given unaided and one followed unaided in the same roleplay".
 *
 * ONE CONTINUOUS ENCOUNTER, the same shape as a1Arc1.js's `WORK_03` closer: a
 * stranger stops the learner, the learner gives a direction unaided, the stranger
 * asks a clarifying follow-up (the blueprint's `receptiveTarget`), the learner
 * answers it, and the stranger gives one back — which the learner has to follow.
 * Both halves of the arc's capability, in one exchange, is what "integrated" means
 * here; it is deliberately lean rather than overbuilt, matching the should-have's
 * lighter evidence (`independent: 1, transfer: 0, delayedRetrieval: false`).
 */
const GETTING_02 = {
  id: 'go_straight_then_turn_right',
  arc: 'getting_around',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep50Title',
  goalKey: 'ep50Goal',
  canDoId: 'give_simple_directions',
  canDoNameKey: 'ep50CanDoName',
  durationKey: 'ep50Duration',
  estimatedMinutes: 9,
  xp: 75,
  prerequisites: ['turn_left_then'],
  skillPrerequisites: ['follow_directions_with_more_than_one_step', 'say_where_something_is'],
  gardenItems: ['corner', 'crossing'],
  reuseSkills: ['follow_directions_with_more_than_one_step', 'say_where_something_is'],
  steps: [
    /*
     * Remember: yesterday's capability, one day later, with nothing on screen — the
     * delayed retrieval episode 49's own evidence target asks for.
     */
    { type: 'recall', review: true, instructionKey: 'ep50RecallInstruction', evalKind: 'give_multi_step_directions', itemIds: ['multi_step_direction_pattern'] },
    { type: 'scene', mood: 'welcoming', titleKey: 'ep50SceneTitle', bodyKey: 'ep50SceneBody', showGoal: true, ctaKey: 'ep50Start' },
    /* Discover: the same frame, from the other side — nothing new to build, only to give. */
    { type: 'model', target: 'Go straight, then turn right, it’s on the corner.', meaningItems: ['corner'], explainKey: 'ep50ModelExplain' },
    /* Guided, once, before the roleplay asks for it unaided. */
    { type: 'fill_blank', instructionKey: 'ep50BlankInstruction', before: 'Go straight, then turn ', after: ', it’s on the corner.',
      expects: 'right', alternatives: ['left'], itemId: 'multi_step_direction_pattern', hintKey: 'ep50BlankHint' },
    /*
     * Open production 1 — unaided, in role, the blueprint's `productionTarget`: "a
     * two-to-three-step direction, unaided". No suggestion: this is the episode's
     * own new capability, `give_simple_directions`, doing its first real job.
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Excuse me — how do I get to the bakery?', instructionKey: 'ep50GiveInstruction',
      evalKind: 'give_multi_step_directions', itemIds: ['multi_step_direction_pattern', 'corner'] },
    /*
     * Receptive: the blueprint's `receptiveTarget`, "a follow-up clarifying
     * question" — a real answer gets questioned back, and understanding that is
     * this episode's own comprehension evidence.
     */
    { type: 'choice', instructionKey: 'ep50ChoiceInstruction', promptEn: 'They ask: “Sorry — straight, and then which way?” What do they want to know?', itemId: 'which_way',
      options: [{ textEn: 'Which way to turn.', correct: true }, { textEn: 'How far it is.' }, { textEn: 'What time it is.' }] },
    /* Open production 2 — answering the follow-up, still unaided, still in role. */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Sorry — straight, and then which way?', instructionKey: 'ep50ClarifyInstruction',
      evalKind: 'give_multi_step_directions', itemIds: ['multi_step_direction_pattern', 'crossing'] },
    /*
     * THE OTHER HALF, IN THE SAME ROLEPLAY: the stranger gives a direction back, and
     * the learner has to follow it — the blueprint's `integratedReuse` of
     * `follow_directions_with_more_than_one_step`, and the episode's "one followed
     * unaided" evidence. `church` is deliberately unfamiliar, receptive only.
     */
    { type: 'comprehension', instructionKey: 'ep50ComprehensionInstruction', target: 'Thanks! Actually — go straight, then turn left, it’s next to the church.', itemId: 'church',
      options: [{ key: 'ep50CompOptCorrect', correct: true }, { key: 'ep50CompOptWrong1' }, { key: 'ep50CompOptWrong2' }] },
    /* Remember: giving a direction, unaided, one last time, nothing on screen. */
    { type: 'recall', instructionKey: 'ep50FinalInstruction', evalKind: 'give_multi_step_directions', itemIds: ['multi_step_direction_pattern'] },
    { type: 'completion', canDoNameKey: 'ep50CanDoName', titleKey: 'ep50CloseTitle', bodyKey: 'ep50CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

export const A2_ARC4 = [GETTING_01, GETTING_02]
export const A2_ARC4_ID = 'getting_around'
export const getA2Arc4Episode = (id) => A2_ARC4.find(ep => ep.id === id) || null
