/*
 * A1 arc 4 — "Where things are" (`finding_your_way`, episodes 27–29).
 *
 * Derived from docs/curriculum/a1-blueprint.json. The arc's own words for the
 * problem it solves: "In a real place the learner cannot ask where anything is, and
 * cannot understand the short answer if somebody tells them."
 *
 *   27 where_is_it          ask_where_something_is      the question
 *   28 its_over_there       say_where_something_is      the answer
 *   29 how_do_i_get_there   ask_about_getting_somewhere moving, and surviving the reply
 *
 * THREE CAPABILITIES, ONE PER EPISODE — which is a different shape from arc 3, and
 * the blueprint's, not a preference: all three episodes are `role: primary`. The first
 * two are `required`, the third is `should` ("it opens a context of its own and the
 * core autonomy is already covered by the two required location skills").
 *
 * WHAT THIS ARC REFUSES TO BE is a directions lesson. The risk note is the design
 * constraint: "Directions creep. The arc stops at where-and-near; sequences of turns
 * are A2." So there is no left, no right, no straight on, no "second on your left" —
 * not even receptively. `follow_multi_step_directions` is deferred, and the way to
 * keep it deferred is to never write it.
 *
 * THE ANSWER IS HARDER THAN THE QUESTION, ON PURPOSE. The autonomy target says
 * "repair is planted deliberately because the answers carry unknown words": the
 * learner asks with eight words they own and hears `upstairs`, `opposite`, `platform`
 * — receptive, never required — and the way through is a repair they already have.
 *
 * THREE NEW INTENTS, from the blueprint's own list: `ask_location`, `state_location`,
 * `ask_transport`. The first two are `deterministic_local` — there is one frame and
 * it is checkable — and `ask_transport` is `hybrid`, because "how do I get to X" has
 * more good shapes than a pattern list should claim to know.
 *
 * ONE STORY. `miniStory.use: true`, and the blueprint says why: "Being lost is a
 * situation with a beginning and an end, and a branch — asking a passer-by or asking
 * at a desk — that is genuinely two valid choices." That is episode 29's story, and
 * those are its two branches.
 *
 * NO FACTS. `factsCaptured: []`. Where a learner happens to be is not something this
 * product stores, and `home_address` is `store: false` in the blueprint for the same
 * reason. Every place in this arc is a public one the episode names itself.
 */

/*
 * 27 — "Where is it?"
 *
 * Blueprint: primary, canDo `ask_where_something_is` (required), novelty medium,
 * budget 4, ONE new pattern, reuse its_a_pattern/whats_this/please, two open
 * productions, integrated reuse of `identify_things` and `polite_request`,
 * prerequisites [20], evidence "two unaided location questions".
 *
 * The learner needs something in a building. The frame is `its_a_pattern` turned into
 * a question — which is why the blueprint makes it the prerequisite of
 * `where_is_pattern` — and the answers are deliberately over their head.
 */
const PLACE_01 = {
  id: 'where_is_it',
  arc: 'finding_your_way',
  level: 'A1',
  role: 'primary',
  titleKey: 'ep27Title',
  goalKey: 'ep27Goal',
  canDoId: 'ask_where_something_is',
  canDoNameKey: 'ep27CanDoName',
  durationKey: 'ep27Duration',
  estimatedMinutes: 9,
  xp: 75,
  prerequisites: ['meeting_someone_new'],
  skillPrerequisites: ['identify_things', 'polite_request'],
  gardenItems: ['where_is_pattern', 'toilet', 'here', 'there'],
  reuseSkills: ['identify_thing', 'polite_request'],
  steps: [
    /* Remember: naming a thing, because asking where it is starts from naming it. */
    { type: 'recall', review: true, instructionKey: 'ep27RecallInstruction', evalKind: 'identify_thing', itemIds: ['its_a_pattern'] },
    { type: 'scene', mood: 'curious', titleKey: 'ep27SceneTitle', bodyKey: 'ep27SceneBody', showGoal: true, ctaKey: 'ep27Start' },
    /* Discover: the same three words, asked instead of told. */
    { type: 'model', target: 'Where is the toilet? Where’s the station?', meaningItems: ['where_is_pattern'], explainKey: 'ep27ModelExplain' },
    /*
     * Comprehend an answer that is BEYOND the learner's production — the blueprint's
     * `receptiveTarget`, "answers with unknown place words". The question being
     * checked is not the vocabulary, it is whether they know where to go.
     */
    { type: 'comprehension', instructionKey: 'ep27ComprehensionInstruction', target: 'It’s upstairs, opposite the exit.', itemId: 'upstairs',
      options: [{ key: 'ep27CompOptCorrect', correct: true }, { key: 'ep27CompOptWrong1' }, { key: 'ep27CompOptWrong2' }] },
    /* Build: the frame, in the order it is said. */
    { type: 'word_order', instructionKey: 'ep27OrderInstruction', hintKey: 'ep1BuildHint',
      tokens: ['Where', 'is', 'the', 'toilet', '?'], itemId: 'where_is_pattern' },
    /* Guided: the verb is the gap, because the inversion is the pattern. */
    { type: 'fill_blank', instructionKey: 'ep27BlankInstruction', before: 'Where', after: ' the station?',
      expects: 'is', alternatives: ['’s', 'is'], itemId: 'where_is_pattern', hintKey: 'ep27BlankHint' },
    /*
     * Open production 1 — the question, model available because the frame is new.
     * The place is the episode's own; nothing here asks where the learner lives.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'You are in a museum and you need the toilet. Ask me.', instructionKey: 'ep27OpenInstruction',
      evalKind: 'ask_location', placeName: 'the toilet', suggestionEn: 'Where is the toilet?', itemIds: ['where_is_pattern', 'toilet'] },
    /*
     * REUSE, BECAUSE THE SITUATION NEEDS IT: you ask a stranger politely. Pre-A1's
     * `polite_request`, doing a job it was built for. The blueprint lists
     * `polite_request` as this episode's integrated reuse.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'The person is busy. Ask politely for a moment of their time.', instructionKey: 'ep27PoliteInstruction',
      evalKind: 'polite_request', suggestionEn: 'Can I have a moment, please?', itemIds: ['please', 'can_i_have'] },
    /* Receptive again, and this time the answer is short and unhelpful — which happens. */
    { type: 'choice', instructionKey: 'ep27ListenInstruction', promptEn: '“Sorry, I don’t know. Ask at the desk — it’s behind you.” Where is the desk?', itemId: 'behind',
      options: [{ textEn: 'Behind me.', correct: true }, { textEn: 'Upstairs.' }, { textEn: 'At the station.' }] },
    /*
     * Open production 2 — a DIFFERENT thing, no model on screen. First unaided
     * location question.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Now you cannot find the way out. Ask me.', instructionKey: 'ep27AgainInstruction',
      evalKind: 'ask_location', placeName: 'the exit', itemIds: ['where_is_pattern'] },
    /* Remember: the frame, unaided. Second unaided location question. */
    { type: 'recall', instructionKey: 'ep27FinalInstruction', evalKind: 'ask_location', itemIds: ['where_is_pattern', 'toilet'] },
    { type: 'completion', canDoNameKey: 'ep27CanDoName', titleKey: 'ep27CloseTitle', bodyKey: 'ep27CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 28 — "It's over there"
 *
 * Blueprint: primary, canDo `say_where_something_is` (required), novelty medium,
 * budget 4, ONE new pattern, reuse its_a_pattern/book/bag, two open productions,
 * integrated reuse of `identify_things`, prerequisites [27], evidence "two unaided
 * answers, one using `next to` or `near`".
 *
 * Asking without being able to answer leaves the learner on one side of the exchange.
 * Four relations are enough — here, there, next to, near — and they are also what
 * makes somebody else's short answer comprehensible when they hear it.
 */
const PLACE_02 = {
  id: 'its_over_there',
  arc: 'finding_your_way',
  level: 'A1',
  role: 'primary',
  titleKey: 'ep28Title',
  goalKey: 'ep28Goal',
  canDoId: 'say_where_something_is',
  canDoNameKey: 'ep28CanDoName',
  durationKey: 'ep28Duration',
  estimatedMinutes: 9,
  xp: 75,
  prerequisites: ['where_is_it'],
  skillPrerequisites: ['ask_where_something_is', 'identify_things'],
  gardenItems: ['its_location_pattern', 'next_to', 'near'],
  reuseSkills: ['identify_thing', 'ask_location'],
  steps: [
    /* Remember: yesterday's question, because today is its other half. */
    { type: 'recall', review: true, instructionKey: 'ep28RecallInstruction', evalKind: 'ask_location', itemIds: ['where_is_pattern'] },
    { type: 'scene', mood: 'welcoming', titleKey: 'ep28SceneTitle', bodyKey: 'ep28SceneBody', showGoal: true, ctaKey: 'ep28Start' },
    /* Discover: one frame, four endings. */
    { type: 'model', target: 'It’s here. It’s next to the bag. It’s near the station.', meaningItems: ['its_location_pattern'], explainKey: 'ep28ModelExplain' },
    /*
     * Comprehend a relation the arc does NOT teach — the blueprint's `receptiveTarget`
     * for this episode is "two answers with relations not taught". This is the first.
     */
    { type: 'comprehension', instructionKey: 'ep28ComprehensionInstruction', target: 'It’s opposite the platform.', itemId: 'opposite',
      options: [{ key: 'ep28CompOptCorrect', correct: true }, { key: 'ep28CompOptWrong1' }, { key: 'ep28CompOptWrong2' }] },
    /* The one real decision in the pattern: `next to` keeps its `to`. */
    { type: 'choice', instructionKey: 'ep28ChoiceInstruction', promptEn: 'The book is at the side of the bag. Which is right?', itemId: 'next_to',
      options: [{ textEn: 'It’s next to the bag.', correct: true }, { textEn: 'It’s next the bag.' }, { textEn: 'It’s next of the bag.' }] },
    /* Build, then guide. */
    { type: 'word_order', instructionKey: 'ep28OrderInstruction', hintKey: 'ep1BuildHint',
      tokens: ['It', 'is', 'next', 'to', 'the', 'bag', '.'], itemId: 'its_location_pattern' },
    { type: 'fill_blank', instructionKey: 'ep28BlankInstruction', before: 'It’s ', after: ' the station.',
      expects: 'near', alternatives: ['next to'], itemId: 'near', hintKey: 'ep28BlankHint' },
    /*
     * Open production 1 — an answer, model available. The thing asked about is one
     * the learner already names (`book`, from Pre-A1), so the new part is the
     * relation and nothing else.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Your book is at the side of my bag. Where is my book?', instructionKey: 'ep28OpenInstruction',
      evalKind: 'state_location', relationHint: 'next_to', suggestionEn: 'It’s next to the bag.', itemIds: ['its_location_pattern', 'next_to'] },
    /* Receptive, the second untaught relation. */
    { type: 'choice', instructionKey: 'ep28ListenInstruction', promptEn: '“Your bag? It’s behind the door, downstairs.” Is the bag on this floor?', itemId: 'downstairs',
      options: [{ textEn: 'No — downstairs.', correct: true }, { textEn: 'Yes, here.' }, { textEn: 'It’s at the station.' }] },
    /*
     * REUSE: naming the thing before placing it. The blueprint's integrated reuse for
     * this episode is `identify_things`, and this is the turn that exercises it.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'I am pointing at something on the table. What is it?', instructionKey: 'ep28IdentifyInstruction',
      evalKind: 'identify_thing', thingId: 'book', suggestionEn: 'It’s a book.', itemIds: ['its_a_pattern'] },
    /*
     * Open production 2, NO model: the blueprint wants two unaided answers and one of
     * them using `next to` or `near`. This turn asks for a place, so `near` is the
     * natural one; the evaluator accepts either relation.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'Somebody asks you: “Where is the toilet?” It is close to the exit. Answer them.', instructionKey: 'ep28AgainInstruction',
      evalKind: 'state_location', relationHint: 'near', itemIds: ['its_location_pattern', 'near'] },
    /* Remember: the frame, unaided, once more. */
    { type: 'recall', instructionKey: 'ep28FinalInstruction', evalKind: 'state_location', itemIds: ['its_location_pattern'] },
    { type: 'completion', canDoNameKey: 'ep28CanDoName', titleKey: 'ep28CloseTitle', bodyKey: 'ep28CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

/*
 * 29 — "How do I get there?"
 *
 * Blueprint: primary, canDo `ask_about_getting_somewhere` (SHOULD), novelty medium,
 * budget 4, NO new patterns (it reuses `where_is_pattern`), reuse
 * please/thank_you/can_i_have, THREE open productions, integrated reuse of
 * `ask_where_something_is`, `ask_for_repair`, `polite_request` and
 * `close_an_encounter`, prerequisites [28], evidence "integrated: getting an answer
 * the learner did not fully understand and surviving it".
 *
 * A hosted story in a street, and the branch is the blueprint's: ask a passer-by, or
 * ask at a desk. Both are valid, both answer, and the answer is two clauses on
 * purpose — "deliberately beyond production". Surviving it is the episode.
 */
const PLACE_03 = {
  id: 'how_do_i_get_there',
  arc: 'finding_your_way',
  level: 'A1',
  role: 'primary',
  titleKey: 'ep29Title',
  goalKey: 'ep29Goal',
  canDoId: 'ask_about_getting_somewhere',
  canDoNameKey: 'ep29CanDoName',
  durationKey: 'ep29Duration',
  estimatedMinutes: 10,
  xp: 85,
  prerequisites: ['its_over_there'],
  skillPrerequisites: ['ask_where_something_is', 'ask_for_repair', 'polite_request', 'close_an_encounter'],
  gardenItems: ['station'],
  reuseSkills: ['ask_location', 'repair_request', 'polite_request', 'close_encounter'],
  steps: [
    /* Remember: the question this episode extends from a room to a city. */
    { type: 'recall', review: true, instructionKey: 'ep29RecallInstruction', evalKind: 'ask_location', itemIds: ['where_is_pattern'] },
    { type: 'scene', mood: 'thinking', titleKey: 'ep29SceneTitle', bodyKey: 'ep29SceneBody', showGoal: true, ctaKey: 'ep29Start' },
    /*
     * Comprehend the two-clause answer BEFORE having to live through it — the
     * blueprint's `receptiveTarget`. The learner is not asked to produce any of this.
     */
    { type: 'comprehension', instructionKey: 'ep29ComprehensionInstruction', target: 'Take the bus, and the station is near the museum.', itemId: 'bus',
      options: [{ key: 'ep29CompOptCorrect', correct: true }, { key: 'ep29CompOptWrong1' }, { key: 'ep29CompOptWrong2' }] },
    /*
     * Open production 1 — the transport question, model available once.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'You want to go to the station. Ask me.', instructionKey: 'ep29OpenInstruction',
      evalKind: 'ask_transport', placeName: 'the station', suggestionEn: 'How do I get to the station?', itemIds: ['where_is_pattern', 'station'] },
    /*
     * THE STORY. The blueprint asks for it by name and gives it its branch: asking a
     * passer-by, or asking at a desk. Its replies are open productions 2 and 3, and
     * the repair inside it is the arc's planted one.
     */
    { type: 'mini_story', storyObjective: 'ask_transport', instructionKey: 'ep29StoryInstruction' },
    /*
     * REUSE: closing an encounter you started by interrupting somebody. Pre-A1's
     * capability, and the blueprint lists it as this episode's integrated reuse.
     */
    { type: 'free_reply', speaker: 'lingua', promptEn: 'You have what you need. Thank them and go.', instructionKey: 'ep29CloseInstruction',
      evalKind: 'close_encounter', suggestionEn: 'Thank you. Bye!', itemIds: ['thank_you', 'bye'] },
    /* Remember: the transport question, unaided, with nothing on screen. */
    { type: 'recall', instructionKey: 'ep29FinalInstruction', evalKind: 'ask_transport', itemIds: ['where_is_pattern', 'station'] },
    { type: 'completion', canDoNameKey: 'ep29CanDoName', titleKey: 'ep29CloseTitle', bodyKey: 'ep29CloseBody', ctaKey: 'ep1CloseCta' },
  ],
}

export const A1_ARC4 = [PLACE_01, PLACE_02, PLACE_03]
export const A1_ARC4_ID = 'finding_your_way'
export const getA1Arc4Episode = (id) => A1_ARC4.find(ep => ep.id === id) || null
