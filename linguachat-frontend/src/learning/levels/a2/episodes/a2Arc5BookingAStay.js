/*
 * A2 arc 5 — "Booking it" (`booking_a_stay`, episodes 51–54).
 *
 * Derived from docs/curriculum/blueprints/a2.json#arcs (order 5) and
 * #episodes (plannedNumber 51–54). Nothing here was invented at the
 * keyboard: canDos, patterns, vocabulary budget, reuse, evidence targets and
 * the risk note all come from that file, exactly as
 * docs/curriculum/implementation/a2/authoring-conventions.md requires.
 *
 * THE ARC'S OWN WORDS FOR THE PROBLEM: "The learner can buy a single item on
 * the spot but cannot reserve something for a future date, cannot say when
 * that date is, and cannot confirm a name for the booking."
 *
 *   51 the_tenth_of_june   use_dates_and_months     name and understand a date
 *   52 do_you_have_a_table ask_about_availability   ask if anything is free
 *   53 id_like_to_book     book_a_room_or_table      hold the whole booking
 *   54 can_you_spell_that  spell_a_name_for_a_booking reinforcement: the whole call
 *
 * WHY NOW. "Needs both dates (independent of the other branches) and future
 * time (from making_plans), so it sits after both and reuses A1's whole
 * transaction shape." `prerequisiteArcs: ["making_plans"]` is real: episode
 * 51 reviews `talk_about_future_plans` (`going_to_future_pattern`,
 * `future_time_expression_pattern`) before it ever names a date, because a
 * booking date is a future date.
 *
 * THE RISK, NAMED IN THE BLUEPRINT: "The heaviest arc after what_happened: a
 * date system, an availability question and a transaction with a new closing
 * step (spelling). Four episodes, and dates arrive as booking details, never
 * as a calendar lesson." So there is no step here that drills the twelve
 * months or the ordinals as a standalone list — every date example is
 * inside a scene about a party, a table or a booking, exactly the way A1's
 * `more_than_ten` put new numbers straight into a price and a clock rather
 * than counting in a void.
 *
 * ONE JUDGEMENT CALL, DOCUMENTED RATHER THAN INVENTED: `use_dates_and_months`
 * has no dedicated entry in `intentStrategy.newIntents` — the only place the
 * blueprint names its evaluation behaviour is
 * `evaluationStrategy.deterministic_local`, which lists it literally as
 * "use_dates_and_months's underlying quantity/date turns". Rather than
 * invent a new intent name (`state_date` or similar) with no basis in the
 * blueprint, every pure date-naming production in episode 51 reuses the
 * existing A1 `use_quantity` evalKind — a date is a number wearing a
 * calendar, exactly the way `numbers_11_100` already reused `use_quantity`
 * for bigger numbers. Where the blueprint DOES name a specific reuse
 * decision explicitly — party-size counts inside a booking — that is
 * followed to the letter: "party-size counts (2 people, a table for 4) reuse
 * the existing quantity intent rather than a new one"
 * (`intentStrategy.newSubtypesOnExistingIntents`).
 *
 * TWO HYBRID INTENTS, TWO-CLAUSE CANONICAL EXAMPLES. `book_a_room_or_table`
 * (`make_booking`) and `spell_a_name_for_a_booking` (`spell_word`) are both
 * listed under `evaluationStrategy.hybrid`, and this arc is one of the ones
 * the authoring conventions name (§3, "Two-clause steps — arcs 1, 3, 5, 6,
 * 7") as needing a canonical target/suggestion sentence that actually
 * contains a taught connector, not a single clause, so the evaluator
 * reference implementation has a real two-clause example to score. Every
 * `make_booking` model/suggestion below reads "I'd like to book a table for
 * <date>, AND there will be <n> of us" — two clauses joined by "and", not a
 * string of prepositional phrases. `spell_word`'s canonical shape is
 * documented the same way even though episode 54 shows no suggestionEn at
 * all (see below): "It's <name>, and that's <letters>."
 *
 * THE 'day' SEMANTIC TYPE IS CORE-ENGINE WORK, NOT YET BUILT — used anyway.
 * `coreEngineRequirements` flags a weekday production slot as needed by both
 * `use_dates_and_months` and `book_a_room_or_table`, not yet registered in
 * the runtime engine (A1's own arc 7 proposed it first and is still
 * designed-only). Per this task's brief, the content here is written AS IF
 * the type exists — episode 51 has a step that names a full
 * weekday-plus-date ("Monday, the third of March"), because avoiding a
 * weekday to dodge an unbuilt type would falsify what a learner will
 * actually need to produce once the type lands, and the blueprint says the
 * content lane should not wait for the core-engine lane.
 *
 * PRIVACY, NAMED WHERE THE RISK ACTUALLY LIVES. `spell_a_name_for_a_booking`
 * carries a `privacyNote` in the blueprint and a matching
 * `coreEngineRequirements` entry warning that a spelled string must never be
 * treated like a captured fact. The full note is repeated verbatim as a code
 * comment directly above episode 54 below, per this task's brief. Every
 * example name in this arc — "Sam" — is a short, gender-neutral, easy-to-
 * spell FICTIONAL first name, never framed as "your real name" or "your
 * surname", and `factsCaptured: []` for the whole arc (matching the
 * blueprint) — nothing about a booking date, a party size or a spelled name
 * is captured as a persistent learner fact anywhere in this file.
 *
 * PERSONALIZATION IS LIGHT (`a2.md`§7), COMPATIBLE SLOTS `activity` (table
 * vs room), `date_ordinal`, `month`. The neutral fallback is written
 * literally throughout — "a generic restaurant-table booking" — never a
 * hotel room, with an inline comment at the first occurrence of "table"
 * marking the `activity` slot a personalization engine would substitute
 * later. Episode 52's blueprint titleConcept is "Do you have a room?" but
 * the arc's own personalization table names the neutral fallback as the
 * table version, so the authored scene below is a restaurant call, not a
 * hotel — the concept title is conceptual, the content is the literal
 * neutral case, exactly as §7 requires.
 *
 * ONE STORY, EPISODE-HOSTED. `miniStory.use: true`, spent on episode 54 only
 * (`storyObjective: 'booking_call_story'`) — "A whole booking call —
 * availability, date, party size, name, spelled and confirmed — is the
 * arc's clearest integrated transaction, exactly like A1's purchase story."
 *
 * AUTONOMY. `autonomyTarget`: "mid-to-late: the integrated booking runs with
 * the suggestion withheld." Episodes 51–53 still open each new pattern with
 * one aided (`suggestionEn` present) production before withdrawing it for
 * the second, exactly as every A1 arc does. Episode 54 carries NO
 * `suggestionEn` at all, on any step — the whole call, including the spelled
 * name, runs unaided, which is the arc's own evidence target: "one whole
 * booking held unaided including a spelled name."
 */

/*
 * 51 — "The tenth of June"
 *
 * Blueprint: primary, canDo `use_dates_and_months` (required), situation
 * "Naming and understanding a date, ahead of a booking", novelty high,
 * budget 5, TWO new patterns (month_pattern, ordinal_date_pattern), reuse
 * numbers_11_100/day_of_week_pattern, two open productions, integrated reuse
 * of `use_bigger_numbers` and `ask_for_repair`, prerequisites NONE (it needs
 * the CAPABILITY of use_bigger_numbers and talk_about_future_plans, not the
 * completion of a numbered episode before it — the same distinction
 * a1Arc1.js's WORK_01 comment makes), evidence "two unaided full dates in
 * context".
 *
 * A date never appears alone here: it is always the answer to "when is it"
 * about something the learner is about to book, which is the arc's own risk
 * mitigation stated in the header comment above.
 */
const BOOK_01 = {
  id: 'the_tenth_of_june',
  arc: 'booking_a_stay',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep51Title',
  goalKey: 'ep51Goal',
  canDoId: 'use_dates_and_months',
  canDoNameKey: 'ep51CanDoName',
  durationKey: 'ep51Duration',
  estimatedMinutes: 9,
  xp: 75,
  prerequisites: [],
  skillPrerequisites: ['use_bigger_numbers', 'talk_about_future_plans'],
  gardenItems: ['month_pattern', 'ordinal_date_pattern'],
  reuseSkills: ['use_bigger_numbers', 'ask_for_repair'],
  steps: [
    /*
     * Remember: the future-tense frame this arc's whole date system will sit
     * inside — a booking date IS a future date. Reviews the other
     * prerequisite arc (making_plans) directly.
     */
    { type: 'recall', review: true, instructionKey: 'ep51RecallInstruction', evalKind: 'state_future_plan', itemIds: ['going_to_future_pattern'] },
    { type: 'scene', mood: 'curious', titleKey: 'ep51SceneTitle', bodyKey: 'ep51SceneBody', showGoal: true, ctaKey: 'ep51Start' },
    /*
     * Discover: months and ordinals together, as one answer to one question
     * — never a calendar list on its own. Two-turn model: the question is
     * receptive (comprehension only; `use_dates_and_months` teaches naming a
     * date, not asking "when is it", which stays implicit inside the answer
     * frame here).
     */
    { type: 'model', target: 'When is it?', response: 'It’s the tenth of June.', meaningItems: ['month_pattern', 'ordinal_date_pattern'], explainKey: 'ep51ModelExplain' },
    /*
     * Comprehend a full date inside a sentence, not a bare list entry —
     * the receptiveTarget's first half ("a date said quickly, requiring
     * repair") is realized two steps later, by a free_reply; this step is
     * the calmer comprehension check the blueprint's `likelyFormats` also
     * asks for.
     */
    { type: 'comprehension', instructionKey: 'ep51ComprehensionInstruction', target: 'The meeting is on the third of March.', itemId: 'ordinal_date_pattern',
      options: [{ key: 'ep51CompOptCorrect', correct: true }, { key: 'ep51CompOptWrong1' }, { key: 'ep51CompOptWrong2' }] },
    /*
     * A weekday inside a full date — "Monday, the third of March." This is
     * the one place this episode uses the `day` (weekday) semantic type the
     * header comment names as core-engine work, not yet built: written here
     * anyway, per this task's brief, because a learner will need exactly
     * this shape the moment the type lands and there is no pedagogical
     * reason to pretend a booking never mentions a weekday.
     */
    { type: 'choice', instructionKey: 'ep51ChoiceInstruction', promptEn: 'Someone says: “Monday, the third of March.” Which day of the week is it?', itemId: 'day_of_week_pattern',
      options: [{ textEn: 'Monday.', correct: true }, { textEn: 'Wednesday.' }, { textEn: 'Sunday.' }] },
    /* Guided: the ordinal slot, with the month already given. */
    { type: 'fill_blank', instructionKey: 'ep51BlankInstruction', before: 'The party is on the ', after: ' of June.',
      expects: 'tenth', alternatives: ['10th'], itemId: 'ordinal_date_pattern', hintKey: 'ep51BlankHint' },
    /*
     * Open production 1 — a full date, model available because the whole
     * system is new. `evalKind: 'use_quantity'` is the deliberate reuse this
     * file's header comment explains: the blueprint names no separate
     * intent for a bare date production, only "use_dates_and_months's
     * underlying quantity/date turns" under deterministic_local.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'When is the party?', instructionKey: 'ep51OpenInstruction',
      evalKind: 'use_quantity', suggestionEn: 'It’s the tenth of June.', itemIds: ['ordinal_date_pattern', 'month_pattern'] },
    /*
     * REUSE, BECAUSE THE SITUATION NEEDS IT: a date said too fast, run
     * together the way A1's `more_than_ten` and `and_you` model a rushed
     * reply. The blueprint lists `ask_for_repair` as this episode's
     * integrated reuse and its own receptiveTarget: "a date said quickly,
     * requiring repair."
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Ok,it’sonthetwentysecondofMarch!', instructionKey: 'ep51RepairInstruction',
      evalKind: 'repair_request', repairKind: 'repeat', suggestionEn: 'Can you say that again, please?', itemIds: ['can_you_repeat'] },
    /*
     * Open production 2, NO model: second unaided full date, about a
     * different occasion. Together with the final recall below, this is the
     * arc's "two unaided full dates in context."
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Great — now tell me: when is your birthday this year?', instructionKey: 'ep51AgainInstruction',
      evalKind: 'use_quantity', itemIds: ['ordinal_date_pattern', 'month_pattern'] },
    /* Remember: a full date, unaided, with nothing on screen. */
    { type: 'recall', instructionKey: 'ep51FinalInstruction', evalKind: 'use_quantity', itemIds: ['ordinal_date_pattern', 'month_pattern'] },
    { type: 'completion', canDoNameKey: 'ep51CanDoName', titleKey: 'ep51CloseTitle', bodyKey: 'ep51CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 52 — "Do you have a table?"
 *
 * Blueprint: primary, canDo `ask_about_availability` (required), situation
 * "Calling ahead: is anything free, on this date", novelty medium, budget 3,
 * ONE new pattern (availability_question_pattern), reuse
 * how_much_pattern/ordinal_date_pattern, two open productions, integrated
 * reuse of `ask_the_price` and `use_dates_and_months`, prerequisites [51],
 * evidence "two unaided availability questions and comprehension of an
 * alternative offered".
 *
 * NEUTRAL FALLBACK: a restaurant table, not a hotel room — see this file's
 * header comment on personalization. `table` is the first vocabulary this
 * arc grants that names the thing being booked; the `activity` slot a later
 * personalization engine would substitute here (room, appointment, …) is
 * marked inline below.
 */
const BOOK_02 = {
  id: 'do_you_have_a_table',
  arc: 'booking_a_stay',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep52Title',
  goalKey: 'ep52Goal',
  canDoId: 'ask_about_availability',
  canDoNameKey: 'ep52CanDoName',
  durationKey: 'ep52Duration',
  estimatedMinutes: 9,
  xp: 75,
  prerequisites: ['the_tenth_of_june'],
  skillPrerequisites: ['use_dates_and_months', 'ask_the_price'],
  gardenItems: ['availability_question_pattern', 'table'],
  reuseSkills: ['ask_the_price', 'use_dates_and_months'],
  steps: [
    /* Remember: yesterday's date, because today it becomes a booking detail. */
    { type: 'recall', review: true, instructionKey: 'ep52RecallInstruction', evalKind: 'use_quantity', itemIds: ['ordinal_date_pattern'] },
    { type: 'scene', mood: 'curious', titleKey: 'ep52SceneTitle', bodyKey: 'ep52SceneBody', showGoal: true, ctaKey: 'ep52Start' },
    /*
     * Discover: the question in both its shapes — `table` here is the
     * personalization `activity` slot (what is being booked); the neutral
     * fallback is a restaurant table, never a hotel room.
     */
    { type: 'model', target: 'Do you have a table for the tenth of June? Is there a table free?', meaningItems: ['availability_question_pattern'], explainKey: 'ep52ModelExplain' },
    /*
     * Comprehend an answer that offers an ALTERNATIVE date — the
     * receptiveTarget verbatim, and the second half of this episode's
     * evidence.
     */
    { type: 'comprehension', instructionKey: 'ep52ComprehensionInstruction', target: 'We don’t have a table on the tenth, but we have one on the eleventh.', itemId: 'availability_question_pattern',
      options: [{ key: 'ep52CompOptCorrect', correct: true }, { key: 'ep52CompOptWrong1' }, { key: 'ep52CompOptWrong2' }] },
    /* Build: the question, assembled before it has to be produced. */
    { type: 'word_order', instructionKey: 'ep52OrderInstruction', hintKey: 'ep1BuildHint',
      tokens: ['Do', 'you', 'have', 'a', 'table', 'for', 'the', 'tenth', 'of', 'June', '?'], itemId: 'availability_question_pattern' },
    /*
     * Open production 1 — the availability question, model available
     * because the frame is new.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Call the restaurant. Ask if they have a table for the tenth of June.', instructionKey: 'ep52OpenInstruction',
      evalKind: 'ask_availability', suggestionEn: 'Do you have a table for the tenth of June?', itemIds: ['availability_question_pattern', 'ordinal_date_pattern'] },
    /*
     * REUSE, BECAUSE THE SITUATION NEEDS IT: finding out the price before
     * you commit to booking. The blueprint lists `ask_the_price` as this
     * episode's integrated reuse.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Before you ask about a table, find out how much a set menu costs.', instructionKey: 'ep52PriceInstruction',
      evalKind: 'ask_price', suggestionEn: 'How much is it?', itemIds: ['how_much_pattern'] },
    /*
     * Open production 2, NO model: second unaided availability question,
     * about a different date — together with the final recall, this
     * episode's "two unaided availability questions."
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Now try a different date — the fifteenth of July. Ask if they have a table.', instructionKey: 'ep52AgainInstruction',
      evalKind: 'ask_availability', itemIds: ['availability_question_pattern'] },
    /* Remember: the question, unaided. */
    { type: 'recall', instructionKey: 'ep52FinalInstruction', evalKind: 'ask_availability', itemIds: ['availability_question_pattern'] },
    { type: 'completion', canDoNameKey: 'ep52CanDoName', titleKey: 'ep52CloseTitle', bodyKey: 'ep52CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 53 — "I'd like to book..."
 *
 * Blueprint: primary, canDo `book_a_room_or_table` (required, HYBRID),
 * situation "Confirming the booking: date, number of people, done", novelty
 * medium, budget 3, ONE new pattern (booking_pattern), reuse
 * can_i_have/"buy_something language", two open productions, integrated
 * reuse of `ask_about_availability` and `arrange_to_meet`, prerequisites
 * [52], evidence "one unaided booking held from request to confirmation".
 *
 * `book_a_room_or_table`'s own words: "reusing A1's buy_something shape
 * (choose, quantify, confirm) with a date and a party size instead of a
 * price and an item." Choose = the table (already asked about). Quantify =
 * the party size, which is why the party-size turn below is its own
 * `use_quantity` step, per `intentStrategy.newSubtypesOnExistingIntents`,
 * not folded silently into the booking sentence. Confirm = the hybrid
 * `make_booking` turn itself.
 */
const BOOK_03 = {
  id: 'id_like_to_book',
  arc: 'booking_a_stay',
  level: 'A2',
  role: 'primary',
  titleKey: 'ep53Title',
  goalKey: 'ep53Goal',
  canDoId: 'book_a_room_or_table',
  canDoNameKey: 'ep53CanDoName',
  durationKey: 'ep53Duration',
  estimatedMinutes: 10,
  xp: 85,
  prerequisites: ['do_you_have_a_table'],
  skillPrerequisites: ['ask_about_availability', 'arrange_to_meet'],
  gardenItems: ['booking_pattern', 'deposit'],
  reuseSkills: ['ask_about_availability', 'arrange_to_meet'],
  steps: [
    /* Remember: yesterday's question, because today it gets a "yes". */
    { type: 'recall', review: true, instructionKey: 'ep53RecallInstruction', evalKind: 'ask_availability', itemIds: ['availability_question_pattern'] },
    { type: 'scene', mood: 'welcoming', titleKey: 'ep53SceneTitle', bodyKey: 'ep53SceneBody', showGoal: true, ctaKey: 'ep53Start' },
    /*
     * Discover: the booking frame. TWO CLAUSES, joined by "and" — not a
     * string of prepositional phrases — because `make_booking` is a hybrid
     * evalKind and the shared evaluator needs a real two-clause canonical
     * shape to score against (this file's header comment explains why).
     */
    { type: 'model', target: 'I’d like to book a table for the tenth of June, and there will be four of us.', meaningItems: ['booking_pattern'], explainKey: 'ep53ModelExplain' },
    /*
     * Comprehend a confirmation with an UNEXPECTED detail — the
     * receptiveTarget verbatim: a deposit, mentioned nowhere in the model.
     */
    { type: 'comprehension', instructionKey: 'ep53ComprehensionInstruction', target: 'That’s confirmed — a table for four at seven, and we’ll need a small deposit.', itemId: 'deposit',
      options: [{ key: 'ep53CompOptCorrect', correct: true }, { key: 'ep53CompOptWrong1' }, { key: 'ep53CompOptWrong2' }] },
    /* Guided: the number-of-people slot, with the date already given. */
    { type: 'fill_blank', instructionKey: 'ep53BlankInstruction', before: 'I’d like to book a table for the twentieth of May, and there will be ', after: ' of us.',
      expects: 'two', alternatives: ['2'], itemId: 'booking_pattern', hintKey: 'ep53BlankHint' },
    /*
     * The QUANTIFY step of "choose, quantify, confirm" — party-size counts
     * reuse A1's `use_quantity` evalKind by the blueprint's own explicit
     * instruction, not a new intent invented for "how many people".
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'How many people is the table for?', instructionKey: 'ep53QuantityInstruction',
      evalKind: 'use_quantity', suggestionEn: 'A table for four, please.', itemIds: ['booking_pattern'] },
    /*
     * REUSE: opening the call politely, before the details. "buy_something
     * language" in the blueprint's own reusedLanguage field.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Start the call politely — ask for a table, before you give the details.', instructionKey: 'ep53PoliteInstruction',
      evalKind: 'polite_request', suggestionEn: 'Can I have a table, please?', itemIds: ['can_i_have'] },
    /*
     * Open production 1 — the CONFIRM step: the whole two-clause booking
     * sentence, model available because the frame is new.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Now make the whole booking — the table, the date, and how many people.', instructionKey: 'ep53OpenInstruction',
      evalKind: 'make_booking', suggestionEn: 'I’d like to book a table for the tenth of June, and there will be four of us.', itemIds: ['booking_pattern', 'ordinal_date_pattern', 'month_pattern'] },
    /*
     * REUSE, BECAUSE THE SITUATION NEEDS IT: confirming the unexpected time
     * detail from the comprehension step above. The blueprint lists
     * `arrange_to_meet` as this episode's integrated reuse.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'They say the table is ready at seven. Confirm you’ll be there.', instructionKey: 'ep53ArrangeInstruction',
      evalKind: 'arrange_meeting', suggestionEn: 'Yes, seven is perfect. See you then.', itemIds: ['time_at_pattern'] },
    /*
     * Open production 2, NO model: a whole DIFFERENT booking, unaided — the
     * arc's "one unaided booking held from request to confirmation".
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Now book a table for the fifth of August, for two people.', instructionKey: 'ep53AgainInstruction',
      evalKind: 'make_booking', itemIds: ['booking_pattern'] },
    /* Remember: the whole booking sentence, unaided, with nothing on screen. */
    { type: 'recall', instructionKey: 'ep53FinalInstruction', evalKind: 'make_booking', itemIds: ['booking_pattern'] },
    { type: 'completion', canDoNameKey: 'ep53CanDoName', titleKey: 'ep53CloseTitle', bodyKey: 'ep53CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 54 — "Can you spell that?"
 *
 * Blueprint: REINFORCEMENT, canDo `spell_a_name_for_a_booking` (SHOULD,
 * HYBRID), situation "A hosted story: the whole call, ending with the name
 * spelled letter by letter", novelty low, budget 2, NO new patterns (the
 * pattern `spelling_pattern` is granted here, but no explicit new-pattern
 * teaching step is needed the way month/ordinal/availability/booking each
 * got a `model` step — spelling is produced directly inside the hosted call
 * rather than drilled first, matching "novelty low"), reuse
 * booking_pattern/thank_you/close_an_encounter, FOUR open productions,
 * integrated reuse of `book_a_room_or_table`, `use_dates_and_months`,
 * `polite_request` and `close_an_encounter`, prerequisites [53], evidence
 * "integrated: a booking held unaided from availability to a spelled,
 * confirmed name".
 *
 * PRIVACY NOTE (verbatim from a2.json#canDos, spell_a_name_for_a_booking):
 * "The engine must never persist or request a real legal name; the spelled
 * value is a display name or fictional booking name only, consistent with
 * the never-collect-real-personal-data exclusion carried from A1." Every
 * name in this episode — "Sam" — is a short, fictional, easy-to-spell first
 * name. No step here asks for "your real name" or "your surname", no
 * FACT_TYPES entry is implied by any step below, and none should ever be
 * added for a spelling turn (see coreEngineRequirements, third entry).
 *
 * NO suggestionEn ANYWHERE IN THIS EPISODE. The arc's autonomyTarget is
 * explicit: "the integrated booking runs with the suggestion withheld." This
 * is the episode where that withdrawal is complete — every free_reply below,
 * new or reused, runs unaided.
 *
 * `spell_word` (NEW, this episode's own capability) and `repair_request`
 * with the NEW `ask_to_spell` repairKind (`intentStrategy
 * .newSubtypesOnExistingIntents`) are deliberately different turns here:
 * `spell_word` is the learner spelling THEIR OWN booking name when asked;
 * `repair_request`/`ask_to_spell` is the learner asking the OTHER speaker to
 * spell something the learner didn't catch — the same shape as episode 51's
 * `ask_for_repair` reuse, closing the arc's own repair thread.
 */
const BOOK_04 = {
  id: 'can_you_spell_that',
  arc: 'booking_a_stay',
  level: 'A2',
  role: 'reinforcement',
  reinforces: true,
  titleKey: 'ep54Title',
  goalKey: 'ep54Goal',
  canDoId: 'spell_a_name_for_a_booking',
  canDoNameKey: 'ep54CanDoName',
  durationKey: 'ep54Duration',
  estimatedMinutes: 11,
  xp: 90,
  prerequisites: ['id_like_to_book'],
  skillPrerequisites: ['book_a_room_or_table'],
  gardenItems: ['spelling_pattern', 'can_you_spell_that'],
  reuseSkills: ['book_a_room_or_table', 'use_dates_and_months', 'polite_request', 'close_an_encounter'],
  steps: [
    { type: 'scene', mood: 'welcoming', titleKey: 'ep54SceneTitle', bodyKey: 'ep54SceneBody', showGoal: true, ctaKey: 'ep54Start' },
    /*
     * One continuous call from here to the end, exactly like a1Arc1.js's
     * WORK_03: every turn is a capability already owed. Opens with the
     * availability question — the evidence target's own words are "from
     * availability to a spelled, confirmed name."
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Good evening, thanks for calling The Garden Restaurant.', instructionKey: 'ep54AvailabilityInstruction',
      evalKind: 'ask_availability', itemIds: ['availability_question_pattern'] },
    /*
     * REUSE, INTEGRATED: the whole booking sentence in one breath — table
     * (polite_request), date (use_dates_and_months) and party size, held
     * together by `make_booking`'s own two-clause shape. Canonical answer
     * this turn is scored against (no suggestionEn shown, per the autonomy
     * note above): "I'd like to book a table for the tenth of June, and
     * there will be two of us, please."
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Yes, we have a table free that evening. How can I help?', instructionKey: 'ep54BookInstruction',
      evalKind: 'make_booking', itemIds: ['booking_pattern', 'ordinal_date_pattern'] },
    /*
     * THE EPISODE'S OWN NEW CAPABILITY. Canonical two-clause answer this
     * turn is scored against: "It's Sam, and that's S-A-M." — a short
     * fictional first name, never a real surname.
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Can I take a name for the booking, and can you spell that for me, please?', instructionKey: 'ep54SpellInstruction',
      evalKind: 'spell_word', itemIds: ['spelling_pattern'] },
    /*
     * Receptive: the other side reads it back — the receptiveTarget verbatim
     * — with ONE letter wrong, so understanding the read-back (not just
     * producing the spelling) is what this step actually checks.
     */
    { type: 'choice', instructionKey: 'ep54ListenInstruction', promptEn: 'The receptionist reads it back: “So that’s S-A-N — is that right?” Is that correct?', itemId: 'spelling_pattern',
      options: [{ textEn: 'No — it’s S-A-M.', correct: true }, { textEn: 'Yes, that’s right.' }, { textEn: 'I don’t know.' }] },
    /*
     * REUSE, CLOSING THE ARC'S REPAIR THREAD: the learner, not the
     * receptionist, needs something spelled this time — the NEW
     * `ask_to_spell` repairKind on the existing `repair_request` intent.
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'Your confirmation code is J-Q-4-X-7. Please arrive ten minutes early.', instructionKey: 'ep54RepairInstruction',
      evalKind: 'repair_request', repairKind: 'ask_to_spell', itemIds: ['can_you_spell_that'] },
    /*
     * THE STORY. The blueprint asks for it by name: "a hosted story: the
     * whole call, ending with the name spelled letter by letter."
     */
    { type: 'mini_story', storyObjective: 'booking_call_story', instructionKey: 'ep54StoryInstruction' },
    /*
     * REUSE: closing the call the way A1's shop already taught. The
     * blueprint lists `close_an_encounter` as this episode's integrated
     * reuse.
     */
    { type: 'free_reply', format: 'roleplay', speaker: 'lingua', promptEn: 'All booked — thank you, and see you on the tenth!', instructionKey: 'ep54CloseInstruction',
      evalKind: 'close_encounter', itemIds: ['thank_you', 'bye'] },
    /* Remember: spelling a name, unaided, with nothing on screen — the arc's final evidence. */
    { type: 'recall', instructionKey: 'ep54FinalInstruction', evalKind: 'spell_word', itemIds: ['spelling_pattern'] },
    { type: 'completion', canDoNameKey: 'ep54CanDoName', titleKey: 'ep54CloseTitle', bodyKey: 'ep54CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

export const A2_ARC5 = [BOOK_01, BOOK_02, BOOK_03, BOOK_04]
export const A2_ARC5_ID = 'booking_a_stay'
export const getA2Arc5Episode = (id) => A2_ARC5.find(ep => ep.id === id) || null
