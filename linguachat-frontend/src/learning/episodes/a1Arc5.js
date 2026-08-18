/*
 * A1 arc 5 — "What it costs" (`paying_and_choosing`, episodes 30–33).
 *
 * Derived from docs/curriculum/a1-blueprint.json. The arc's own words for the
 * problem it solves: "The learner can ask for something politely but cannot find
 * out what it costs, choose between two, or understand a number above ten."
 *
 *   30 more_than_ten          use_bigger_numbers  the number system, in the two
 *                                                  places it is needed
 *   31 how_much_is_it         ask_the_price        the question
 *   32 this_one_or_that_one   ask_the_price        choosing, quantifying, asking
 *   33 buying_it               buy_something        the whole transaction
 *
 * THE HEAVIEST ARC, BY THE BLUEPRINT'S OWN RISK NOTE: "a number system, a
 * question form and a transaction. Four episodes, and the numbers arrive as
 * prices rather than as counting." That is why it is FOUR episodes rather than
 * three, and why part 005a (this file) authors content and the resolver only —
 * evaluators, the eight-language copy and the arc's own check are separate
 * sprints (005b/c/d), exactly as the queue records.
 *
 * ONE NEW INTENT, NOT THREE. The blueprint's own evaluation strategy lists
 * `ask_price` and `state_price` as deterministic_local, but nothing in the arc
 * ever needs the learner to STATE a price — Lingua (the shopkeeper) says prices,
 * the learner only ever asks for one or hears one. So this arc introduces exactly
 * one new intent, `ask_price`, and `use_bigger_numbers` reuses `use_quantity`
 * with its taught range extended — the blueprint's own `intentReuse` note.
 * `buy_something`'s headline evidence reuses Pre-A1's `cafe_order_conversation`,
 * exactly as the blueprint says the capability itself does: "It reuses the café
 * shape Pre-A1 already owns and adds the money the café never mentioned." Its
 * `evaluation: "hybrid"` tag describes that reused conversational frame, not a
 * new intent invented to justify the label.
 *
 * NUMBERS ARE ONE ITEM, NOT NINETY. `numbers_11_100` is a single Garden entry,
 * exactly as `numbers_1_10` already is — the risk note the blueprint files under
 * `garden_explosion` and the reason `numbers_1_10` set the precedent for.
 *
 * NO NEW SEMANTIC TYPE. The arc's needs — `generic_object`, `food`, `time_point`
 * — all exist already; `time_point` because `use_bigger_numbers` is introduced
 * inside both prices and clock times, per the blueprint's own words, so episode
 * 30 also reuses arc 2's time language rather than teaching counting in a void.
 *
 * NO NEW FACT. `factsCaptured: []` for this arc in the blueprint — nothing about
 * what a learner buys or spends is personal data worth storing.
 *
 * ONE STORY, EPISODE-HOSTED. `miniStory.use: true` for episode 33 only — "A
 * purchase is the level's clearest whole transaction, and a hosted story can
 * carry the shopkeeper's turns while the learner keeps the decisions."
 */

/*
 * 30 — "More than ten"
 *
 * Blueprint: primary, canDo `use_bigger_numbers` (required), novelty high,
 * budget 3, ONE new pattern, reuse numbers_1_10/quantity_pattern, two open
 * productions, integrated reuse of `use_small_numbers` and `ask_for_repair`,
 * prerequisites [29], evidence "two unaided numbers above ten in context".
 *
 * Ten was never enough for a price or a clock. The extension is introduced for
 * those two uses only, never as a counting lesson on its own — so this episode
 * puts the new numbers straight into a price and a time, both already familiar
 * shapes.
 */
const PAY_01 = {
  id: 'more_than_ten',
  arc: 'paying_and_choosing',
  level: 'A1',
  role: 'primary',
  titleKey: 'ep30Title',
  goalKey: 'ep30Goal',
  canDoId: 'use_bigger_numbers',
  canDoNameKey: 'ep30CanDoName',
  durationKey: 'ep30Duration',
  estimatedMinutes: 9,
  xp: 75,
  prerequisites: ['how_do_i_get_there'],
  skillPrerequisites: ['use_small_numbers'],
  gardenItems: ['numbers_11_100'],
  reuseSkills: ['use_quantity'],
  steps: [
    /* Remember: the numbers this episode extends. */
    { type: 'recall', review: true, instructionKey: 'ep30RecallInstruction', evalKind: 'use_quantity', itemIds: ['numbers_1_10'] },
    { type: 'scene', mood: 'curious', titleKey: 'ep30SceneTitle', bodyKey: 'ep30SceneBody', showGoal: true, ctaKey: 'ep30Start' },
    /* Discover: the same counting shape, past ten. */
    { type: 'model', target: 'Eleven, twelve… twenty. Fifty. A hundred.', meaningItems: ['numbers_11_100'], explainKey: 'ep30ModelExplain' },
    /*
     * Comprehend a number said at speed — the blueprint's `receptiveTarget`,
     * "numbers said quickly, requiring repair".
     */
    { type: 'comprehension', instructionKey: 'ep30ComprehensionInstruction', target: 'It’s fifteen.', itemId: 'numbers_11_100',
      options: [{ key: 'ep30CompOptCorrect', correct: true }, { key: 'ep30CompOptWrong1' }, { key: 'ep30CompOptWrong2' }] },
    /* The one real decision: which number is which, side by side. */
    { type: 'choice', instructionKey: 'ep30ChoiceInstruction', promptEn: 'Which one is “thirty”?', itemId: 'numbers_11_100',
      options: [{ textEn: 'Thirty.', correct: true }, { textEn: 'Thirteen.' }, { textEn: 'Three.' }] },
    { type: 'fill_blank', instructionKey: 'ep30BlankInstruction', before: 'I have ', after: ' books.',
      expects: 'eleven', alternatives: ['11'], itemId: 'numbers_11_100', hintKey: 'ep30BlankHint' },
    /*
     * Open production 1 — a number used for a PRICE, model available because the
     * range is new.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'This ticket is 20. Say the number back to me.', instructionKey: 'ep30OpenInstruction',
      evalKind: 'use_quantity', quantityForm: 'bare', suggestionEn: 'Twenty.', itemIds: ['numbers_11_100'] },
    /*
     * REUSE, BECAUSE THE SITUATION NEEDS IT: a number said too fast, and the
     * repair that was always the way through it. The blueprint lists
     * `ask_for_repair` as this episode's integrated reuse.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'I say a number very fast and you do not catch it. What do you say?', instructionKey: 'ep30RepairInstruction',
      evalKind: 'repair_request', repairKind: 'repeat', suggestionEn: 'Can you repeat, please?', itemIds: ['can_you_repeat'] },
    /* A number used for a TIME — the other place the blueprint sends it. */
    { type: 'choice', instructionKey: 'ep30TimeInstruction', promptEn: 'The train leaves at seventeen. Which clock is right?', itemId: 'time_at_pattern',
      options: [{ textEn: 'Seventeen.', correct: true }, { textEn: 'Seven.' }, { textEn: 'Seventy.' }] },
    /*
     * Open production 2 — a DIFFERENT number, no model on screen. Second unaided
     * number above ten.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Now say this number: 45.', instructionKey: 'ep30AgainInstruction',
      evalKind: 'use_quantity', quantityForm: 'bare', itemIds: ['numbers_11_100'] },
    /* Remember: the range, unaided. */
    { type: 'recall', instructionKey: 'ep30FinalInstruction', evalKind: 'use_quantity', itemIds: ['numbers_11_100'] },
    { type: 'completion', canDoNameKey: 'ep30CanDoName', titleKey: 'ep30CloseTitle', bodyKey: 'ep30CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 31 — "How much is it?"
 *
 * Blueprint: primary, canDo `ask_the_price` (required), novelty medium, budget
 * 3, ONE new pattern, reuse can_i_have/please/numbers_11_100, two open
 * productions, integrated reuse of `polite_request` and `use_bigger_numbers`,
 * prerequisites [30], evidence "two unaided price questions and one number
 * understood correctly".
 *
 * Pre-A1 can ask for a thing politely but not find out what it costs. One shop,
 * one thing, one question, one number to catch.
 */
const PAY_02 = {
  id: 'how_much_is_it',
  arc: 'paying_and_choosing',
  level: 'A1',
  role: 'primary',
  titleKey: 'ep31Title',
  goalKey: 'ep31Goal',
  canDoId: 'ask_the_price',
  canDoNameKey: 'ep31CanDoName',
  durationKey: 'ep31Duration',
  estimatedMinutes: 9,
  xp: 75,
  prerequisites: ['more_than_ten'],
  skillPrerequisites: ['polite_request', 'use_bigger_numbers'],
  gardenItems: ['how_much_pattern', 'ticket'],
  reuseSkills: ['polite_request', 'use_quantity'],
  steps: [
    /* Remember: yesterday's numbers, because today catches one. */
    { type: 'recall', review: true, instructionKey: 'ep31RecallInstruction', evalKind: 'use_quantity', itemIds: ['numbers_11_100'] },
    { type: 'scene', mood: 'curious', titleKey: 'ep31SceneTitle', bodyKey: 'ep31SceneBody', showGoal: true, ctaKey: 'ep31Start' },
    /* Discover: the frame, singular and plural. */
    { type: 'model', target: 'How much is it? How much are they?', meaningItems: ['how_much_pattern'], explainKey: 'ep31ModelExplain' },
    /* Comprehend a price with a neutral unit — the blueprint's own phrase for it. */
    { type: 'comprehension', instructionKey: 'ep31ComprehensionInstruction', target: 'It’s twelve dollars.', itemId: 'dollars',
      options: [{ key: 'ep31CompOptCorrect', correct: true }, { key: 'ep31CompOptWrong1' }, { key: 'ep31CompOptWrong2' }] },
    /* Build, then guide. */
    { type: 'word_order', instructionKey: 'ep31OrderInstruction', hintKey: 'ep1BuildHint',
      tokens: ['How', 'much', 'is', 'it', '?'], itemId: 'how_much_pattern' },
    { type: 'fill_blank', instructionKey: 'ep31BlankInstruction', before: 'How much ', after: ' they?',
      expects: 'are', alternatives: ['is'], itemId: 'how_much_pattern', hintKey: 'ep31BlankHint' },
    /*
     * Open production 1 — the price question, model available because the frame
     * is new.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'You want to buy this ticket. Ask me the price.', instructionKey: 'ep31OpenInstruction',
      evalKind: 'ask_price', placeName: 'the ticket', suggestionEn: 'How much is it?', itemIds: ['how_much_pattern', 'ticket'] },
    /*
     * REUSE: asking politely for the thing before asking what it costs. The
     * blueprint lists `polite_request` as this episode's integrated reuse.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Ask me for a ticket, politely, before you ask the price.', instructionKey: 'ep31PoliteInstruction',
      evalKind: 'polite_request', suggestionEn: 'Can I have a ticket, please?', itemIds: ['can_i_have', 'ticket'] },
    /* Receptive: catching the number in the answer. */
    { type: 'choice', instructionKey: 'ep31ListenInstruction', promptEn: '“It’s eighteen dollars.” How much is it?', itemId: 'numbers_11_100',
      options: [{ textEn: 'Eighteen.', correct: true }, { textEn: 'Eighty.' }, { textEn: 'Eight.' }] },
    /*
     * Open production 2, NO model: second unaided price question, about a
     * different thing.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Now you want this bag. Ask me.', instructionKey: 'ep31AgainInstruction',
      evalKind: 'ask_price', placeName: 'the bag', itemIds: ['how_much_pattern'] },
    /* Remember: the question, unaided. */
    { type: 'recall', instructionKey: 'ep31FinalInstruction', evalKind: 'ask_price', itemIds: ['how_much_pattern', 'ticket'] },
    { type: 'completion', canDoNameKey: 'ep31CanDoName', titleKey: 'ep31CloseTitle', bodyKey: 'ep31CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 32 — "This one or that one"
 *
 * Blueprint: reinforcement, canDo `ask_the_price` (required), novelty medium,
 * budget 3, ONE new pattern, reuse quantity_pattern/i_want/i_like, two open
 * productions, integrated reuse of `use_small_numbers` and `express_preferences`,
 * prerequisites [31], evidence "one unaided choice with a quantity and a price
 * question".
 *
 * Choosing between two things, with a quantity and a price for each. `price_
 * pattern` — "It's + number (+ neutral unit)" — is introduced here, RECEPTIVELY:
 * Lingua is the one who states a price in this episode, exactly as the blueprint
 * schedules it (`reaches: guided_production`, not independent) and exactly as
 * this arc's own design note above explains — the learner asks and chooses, and
 * never has to state a price to pass.
 */
const PAY_03 = {
  id: 'this_one_or_that_one',
  arc: 'paying_and_choosing',
  level: 'A1',
  role: 'reinforcement',
  titleKey: 'ep32Title',
  goalKey: 'ep32Goal',
  canDoId: 'ask_the_price',
  canDoNameKey: 'ep32CanDoName',
  durationKey: 'ep32Duration',
  estimatedMinutes: 9,
  xp: 75,
  prerequisites: ['how_much_is_it'],
  skillPrerequisites: ['ask_the_price', 'use_small_numbers'],
  gardenItems: ['price_pattern', 'this_one', 'that_one'],
  reuseSkills: ['use_quantity', 'express_preference'],
  steps: [
    /* Remember: yesterday's question, because today it chooses first. */
    { type: 'recall', review: true, instructionKey: 'ep32RecallInstruction', evalKind: 'ask_price', itemIds: ['how_much_pattern'] },
    { type: 'scene', mood: 'thinking', titleKey: 'ep32SceneTitle', bodyKey: 'ep32SceneBody', showGoal: true, ctaKey: 'ep32Start' },
    /* Discover: how to point at one of two, in English. */
    { type: 'model', target: 'This one, please. Not that one — this one.', meaningItems: ['this_one', 'that_one'], explainKey: 'ep32ModelExplain' },
    /*
     * Comprehend Lingua STATING a price — the arc's one receptive introduction of
     * `price_pattern`.
     */
    { type: 'comprehension', instructionKey: 'ep32ComprehensionInstruction', target: 'This one is eleven. That one is twenty.', itemId: 'price_pattern',
      options: [{ key: 'ep32CompOptCorrect', correct: true }, { key: 'ep32CompOptWrong1' }, { key: 'ep32CompOptWrong2' }] },
    { type: 'choice', instructionKey: 'ep32ChoiceInstruction', promptEn: 'Two apples on the table. You want the one on the left. What do you say?', itemId: 'this_one',
      options: [{ textEn: 'This one, please.', correct: true }, { textEn: 'That one, please.' }, { textEn: 'Apple, please.' }] },
    { type: 'fill_blank', instructionKey: 'ep32BlankInstruction', before: 'Not this one — ', after: ' one, please.',
      expects: 'that', alternatives: [], itemId: 'that_one', hintKey: 'ep32BlankHint' },
    /*
     * Open production 1 — choose and quantify, model available. The blueprint's
     * production target: "choose, quantify, ask."
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Two oranges, side by side. You want two of this one. Say it.', instructionKey: 'ep32OpenInstruction',
      evalKind: 'use_quantity', quantityForm: 'bare', suggestionEn: 'Two of this one, please.', itemIds: ['this_one', 'quantity_pattern'] },
    /*
     * REUSE: what the learner likes decides which one they choose. The
     * blueprint lists `express_preferences` as this episode's integrated reuse.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'One apple and one orange. Which do you like?', instructionKey: 'ep32PreferInstruction',
      evalKind: 'express_like', suggestionEn: 'I like apples.', itemIds: ['i_like'] },
    /* Receptive: a third option offered, unplanned. */
    { type: 'choice', instructionKey: 'ep32ListenInstruction', promptEn: '“We also have a banana today.” Is a banana one of the two you were choosing between?', itemId: 'banana',
      options: [{ textEn: 'No — it’s a new one.', correct: true }, { textEn: 'Yes, the first one.' }, { textEn: 'Yes, the second one.' }] },
    /*
     * Open production 2, NO model: choose, quantify AND ask the price — the full
     * shape, unaided.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Now you want that one. Choose it and ask the price.', instructionKey: 'ep32AgainInstruction',
      evalKind: 'ask_price', placeName: 'that one', itemIds: ['that_one', 'how_much_pattern'] },
    /* Remember: asking the price, unaided, once more. */
    { type: 'recall', instructionKey: 'ep32FinalInstruction', evalKind: 'ask_price', itemIds: ['how_much_pattern'] },
    { type: 'completion', canDoNameKey: 'ep32CanDoName', titleKey: 'ep32CloseTitle', bodyKey: 'ep32CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 33 — "Buying it"
 *
 * Blueprint: primary, canDo `buy_something` (required, hybrid), novelty low,
 * budget 2, NO new patterns, reuse can_i_have/thats_all/thank_you/no_thank_you,
 * FOUR open productions, integrated reuse of `cafe_order`, `polite_request`,
 * `respond_anything_else`, `use_small_numbers` and `close_an_encounter`,
 * prerequisites [32], evidence "integrated: a purchase held unaided from
 * greeting to goodbye".
 *
 * The integrated transaction: choose, quantify, ask the price, understand the
 * answer, close. It reuses the café shape Pre-A1 already owns — headline
 * evidence intent `cafe_order_conversation` — and adds the money the café never
 * mentioned, with `ask_price` as this capability's second, reused intent.
 */
const PAY_04 = {
  id: 'buying_it',
  arc: 'paying_and_choosing',
  level: 'A1',
  role: 'primary',
  titleKey: 'ep33Title',
  goalKey: 'ep33Goal',
  canDoId: 'buy_something',
  canDoNameKey: 'ep33CanDoName',
  durationKey: 'ep33Duration',
  estimatedMinutes: 10,
  xp: 85,
  prerequisites: ['this_one_or_that_one'],
  skillPrerequisites: ['ask_the_price', 'cafe_order', 'use_small_numbers'],
  gardenItems: ['dollars'],
  reuseSkills: ['ask_price', 'cafe_order_conversation', 'polite_request', 'respond_anything_else', 'close_encounter'],
  steps: [
    /* Remember: the price question, because today it closes a whole purchase. */
    { type: 'recall', review: true, instructionKey: 'ep33RecallInstruction', evalKind: 'ask_price', itemIds: ['how_much_pattern'] },
    { type: 'scene', mood: 'welcoming', titleKey: 'ep33SceneTitle', bodyKey: 'ep33SceneBody', showGoal: true, ctaKey: 'ep33Start' },
    /*
     * Comprehend a question outside the script — the blueprint's own
     * `receptiveTarget`, "a shopkeeper who asks something unplanned".
     */
    { type: 'comprehension', instructionKey: 'ep33ComprehensionInstruction', target: 'Anything else today?', itemId: 'thats_all',
      options: [{ key: 'ep33CompOptCorrect', correct: true }, { key: 'ep33CompOptWrong1' }, { key: 'ep33CompOptWrong2' }] },
    /*
     * Open production 1 — ask politely for the thing. Reuses the café shape by
     * name.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'You are at the counter. Ask for a ticket.', instructionKey: 'ep33OpenInstruction',
      evalKind: 'cafe_order_conversation', suggestionEn: 'Can I have a ticket, please?', itemIds: ['can_i_have', 'ticket'] },
    /*
     * REUSE: the shopkeeper's own move, unplanned — the same phrase the
     * comprehension step above just taught the learner to recognise. The
     * blueprint lists `respond_anything_else` as this episode's integrated
     * reuse, and this is the turn that exercises it.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'The shopkeeper asks, "Anything else today?" What do you say?', instructionKey: 'ep33AnythingInstruction',
      evalKind: 'respond_anything_else', suggestionEn: 'No, thank you.', itemIds: ['thats_all'] },
    /*
     * THE STORY. The blueprint asks for it by name: "a hosted story at a
     * counter: the whole purchase, start to finish."
     */
    { type: 'mini_story', storyObjective: 'cafe_order_conversation', instructionKey: 'ep33StoryInstruction' },
    /*
     * REUSE: closing the transaction the way the café already taught. The
     * blueprint lists `close_an_encounter` as this episode's integrated reuse.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'You have what you need. Thank them and go.', instructionKey: 'ep33CloseInstruction',
      evalKind: 'close_encounter', suggestionEn: 'Thank you. Bye!', itemIds: ['thank_you', 'bye'] },
    /* Remember: the whole shape, unaided, with nothing on screen. */
    { type: 'recall', instructionKey: 'ep33FinalInstruction', evalKind: 'cafe_order_conversation', itemIds: ['can_i_have'] },
    { type: 'completion', canDoNameKey: 'ep33CanDoName', titleKey: 'ep33CloseTitle', bodyKey: 'ep33CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

export const A1_ARC5 = [PAY_01, PAY_02, PAY_03, PAY_04]
export const A1_ARC5_ID = 'paying_and_choosing'
export const getA1Arc5Episode = (id) => A1_ARC5.find(ep => ep.id === id) || null
