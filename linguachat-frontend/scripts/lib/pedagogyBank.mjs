/*
 * pedagogyBank — real natural variants, near-misses and novel-context values,
 * one bank per `evalKind` (further keyed by `repairKind`/`timeForm`/
 * `quantityForm` where the evaluator itself branches on one).
 *
 * Every entry is read out of `responseEvaluation.js`'s own accepted regex
 * families, not invented: a variant is only listed here because the evaluator
 * that will judge it already contains the pattern that accepts it. That is
 * what lets `check-pedagogical-journeys.mjs` treat a rejection as a real
 * finding rather than a bad fixture — if `playEpisode` throws on one of these,
 * either this bank drifted from the evaluator or the evaluator regressed.
 *
 * `NONSENSE` is one shared, genuinely meaningless reply used everywhere a
 * refusal boundary is being proven; every evaluator must reject it.
 */

/*
 * Deliberately number-word-free: `use_quantity` in its `bare` form accepts ANY
 * recognised number word by design (answering "How many?" with any number IS
 * the objective), so a shared nonsense probe containing one — the original
 * draft used "seventeen" — would silently pass instead of being refused. The
 * arc-5 curriculum check hit the same trap first; this is the same lesson,
 * applied to a shared probe used across every arc rather than one arc's own.
 */
export const NONSENSE = 'banana purple hallway'

/* Variants: natural, distinct phrasings a real learner might type. */
export const VARIANTS = {
  introduction: ({ name }) => [
    `Hi, I'm ${name}.`, `Hello, I'm ${name}.`, `I'm ${name}.`, `My name's ${name}.`,
  ],
  ask_name: () => ["What's your name?", 'May I ask your name?', 'And your name?'],
  nice_to_meet: () => ['Nice to meet you.', 'Nice meeting you.'],
  ask_wellbeing: () => ['How are you?', 'How are you doing?', "How's it going?", 'How are things?'],
  answer_wellbeing: () => ["I'm good.", "I'm great.", "I'm tired.", 'Fine, thanks.', "I'm okay."],
  reciprocal_question: () => ['And you?', 'What about you?', 'How about you?'],
  ask_origin: () => ['Where are you from?', 'Where do you come from?', 'What country are you from?'],
  answer_origin: ({ place }) => [`I'm from ${place}.`, `I am from ${place}.`],
  full_intro_conversation: ({ name }) => [`Hi, I'm ${name}. How are you?`, `Hi, I'm ${name}. Where are you from?`],
  express_like: ({ targetNoun }) => [
    `I like ${targetNoun}.`, `I really like ${targetNoun}.`, `I love ${targetNoun}.`, `I enjoy ${targetNoun}.`,
  ],
  express_dislike: ({ targetThing }) => [
    `I don't like ${targetThing}.`, `I do not like ${targetThing}.`, `I dislike ${targetThing}.`, `I hate ${targetThing}.`,
  ],
  ask_preference: () => ['What do you like?', 'What kind of music do you like?', 'How about you?'],
  yes_no_preference: () => ['Yes, I do.', "No, I don't.", 'Yeah.', 'Nope.'],
  express_want: ({ targetThing }) => [
    `I want ${targetThing}.`, `I'd like ${targetThing}.`, `I would like ${targetThing}.`, `Can I have ${targetThing}?`,
  ],
  express_need: ({ targetThing }) => [`I need ${targetThing}.`, `I really need ${targetThing}.`],
  ask_want: ({ targetThing }) => [`Do you want ${targetThing}?`, `Would you like ${targetThing}?`, `Do you need ${targetThing}?`],
  accept_offer: () => ['Yes, please.', 'Sure.', 'Sounds good.', 'Okay, please.'],
  decline_offer: () => ['No, thank you.', 'No, thanks.', 'Not now.', 'Maybe later.'],
  simple_plan_conversation: ({ targetNoun, activity }) => [
    `I like ${targetNoun}. Do you want to ${activity}?`, `I love ${targetNoun}. Would you like to ${activity}?`,
  ],
  polite_request: ({ targetThing }) => [
    `Can I have ${targetThing}, please?`, `Could I have ${targetThing}?`, `May I have ${targetThing}, please?`, `I'd like ${targetThing}, please.`,
  ],
  thank_service: () => ['Thank you.', 'Thanks.', 'Thank you very much.', 'Thanks a lot.'],
  respond_anything_else: () => ['No, thank you.', 'Yes, please.', 'That’s all, thanks.'],
  finish_order: () => ['That’s all, thanks.', 'That’s it.', "That'll be all, thanks."],
  cafe_order_conversation: ({ targetThing }) => [
    `Can I have ${targetThing}, please? That’s all, thanks.`, `Could I have ${targetThing}? That’s it, thank you.`,
  ],
  close_encounter: () => ['Bye.', 'Goodbye.', 'See you later.', 'Take care.'],
  ask_what_thing: () => ["What's this?", 'What is this?', "What's that?"],
  identify_thing: ({ targetThing }) => [`It's a ${targetThing}.`, `It is a ${targetThing}.`, `That's a ${targetThing}.`],
  state_life_fact: () => ['I work at home.', 'I study at university.', "I'm a student.", 'I work in an office.'],
  ask_life_fact: () => ['Do you work?', 'Do you study?', 'What do you do?'],
  introduce_person: ({ partner }) => [`This is ${partner}.`, `This is my friend ${partner}.`, `Meet ${partner}.`],
  /* the evaluator's taught frame is the PRONOUN + is, not the name — "Ana is a
   * student" does not match it, and only "She is…"/"He is…" does */
  state_person_fact: () => ['She is a student.', "He's a student.", 'She is a teacher.'],
  ask_location: ({ placeName }) => [`Where is ${placeName}?`, `Where's ${placeName}?`, `Excuse me, where is ${placeName}?`],
  ask_transport: ({ placeName }) => [`How do I get to ${placeName}?`, 'How can I get there?', 'Which bus goes there?'],
  ask_price: ({ placeName }) => ['How much is it?', 'How much are they?', `How much is ${placeName}?`],
  /* subtype banks, keyed by the field the evaluator itself branches on */
  repair_request: {
    /* a step with no declared `repairKind` defaults to the evaluator's own default */
    none: () => ["I don't understand.", "I don't get it.", "I'm lost."],
    signal_nonunderstanding: () => ["I don't understand.", "I don't get it.", "I'm lost."],
    repeat: () => ['Can you repeat, please?', 'Could you say that again?', 'Please repeat.'],
    slow_down: () => ['Please speak slowly.', 'Can you speak more slowly?', 'Speak slowly, please.'],
    ask_meaning: ({ meaningWord }) => [`What does "${meaningWord}" mean?`, `What's "${meaningWord}"?`],
  },
  state_routine: {
    none: () => ['I usually get up early.', 'I usually have breakfast.', 'I sometimes work at home.'],
    part_of_day: () => ['I usually work in the morning.', 'I study in the evening.'],
    clock: ({ usualTime }) => [`I usually get up at ${usualTime}.`, `I work at ${usualTime}.`],
  },
  state_location: {
    /* a closing recall may ask for the relation with no hint at all — any of
     * the four taught relations is a complete answer there */
    none: () => ["It's here.", "It's next to the bag."],
    here: () => ["It's here."],
    there: () => ["It's there."],
    next_to: () => ["It's next to the bag.", 'Next to the bag.'],
    near: () => ["It's near the bag.", 'Near the bag.'],
  },
  use_quantity: {
    /* a step with no declared `quantityForm` defaults to the evaluator's own 'bare' */
    none: ({ numberWord }) => [`${cap(numberWord)}.`],
    bare: ({ numberWord }) => [`${cap(numberWord)}.`],
    with_object: ({ numberWord, counted }) => [`${cap(numberWord)} ${counted}.`],
    polite_request: ({ numberWord, counted }) => [`Can I have ${numberWord} ${counted}, please?`],
  },
}

/*
 * Near-miss: understood, but incomplete/wrong-shaped — a real "wrong answer"
 * that must fail with `completedObjective: false` and `retryRequired: true`,
 * never an exception or a silent pass. Chosen so the errorType is deterministic
 * (`conclusive: true` in the evaluator), not the hybrid escalation band, so a
 * retry test never depends on a remote provider being reachable.
 */
export const NEAR_MISS = {
  introduction: ({ name }) => name,
  ask_name: () => 'your name',
  nice_to_meet: () => 'Thanks.',
  ask_wellbeing: () => 'How you?',
  answer_wellbeing: () => 'Good.',
  reciprocal_question: () => 'You?',
  ask_origin: () => 'Where you from?',
  answer_origin: ({ place }) => place,
  full_intro_conversation: ({ name }) => `Hi, I'm ${name}.`,
  express_like: () => 'Music.',
  express_dislike: ({ targetThing }) => `I like ${targetThing}.`,
  ask_preference: () => 'What you like?',
  yes_no_preference: () => 'Music.',
  express_want: ({ targetThing }) => `${cap(targetThing)}, please.`,
  express_need: () => 'Help.',
  ask_want: ({ targetThing }) => `You want ${targetThing}?`,
  accept_offer: () => 'Maybe.',
  decline_offer: () => 'Maybe.',
  simple_plan_conversation: ({ targetNoun }) => `I like ${targetNoun}.`,
  polite_request: ({ targetThing }) => `${cap(targetThing)}, please.`,
  thank_service: () => 'Hi.',
  respond_anything_else: () => 'Yes.',
  finish_order: () => 'No.',
  cafe_order_conversation: ({ targetThing }) => `Can I have ${targetThing}?`,
  close_encounter: () => 'Thank you.',
  ask_what_thing: () => 'This?',
  identify_thing: ({ targetThing }) => cap(targetThing),
  state_life_fact: () => 'Work.',
  ask_life_fact: () => 'You work?',
  introduce_person: ({ partner }) => partner,
  state_person_fact: () => 'I am a student.',
  ask_location: () => 'Where toilet?',
  state_location: () => "It's the bag.",
  ask_transport: ({ placeName }) => `Where is ${placeName}?`,
  ask_price: () => "It's ten dollars.",
  repair_request: {
    none: () => "Don't understand.",
    signal_nonunderstanding: () => "Don't understand.",
    repeat: () => 'Again?',
    slow_down: () => 'Slow down.',
    ask_meaning: () => 'mean?',
  },
  state_routine: {
    none: () => 'Get up.',
    part_of_day: () => 'I usually work.',
    clock: () => 'I usually get up.',
  },
  use_quantity: {
    none: () => 'Many.',
    bare: () => 'Many.',
    with_object: ({ numberWord }) => cap(numberWord),
    polite_request: ({ numberWord, counted }) => `${cap(numberWord)} ${counted}.`,
  },
}

/*
 * Novel-context substitutions: values no episode's own canonical script uses,
 * drawn from the SAME catalogue (`THINGS` in `semanticContext.js`) so a step
 * that names a real thing never becomes an `uncountable_target` refusal by
 * accident. A journey that swaps these in and still completes the objective is
 * evidence the evaluator judges the taught STRUCTURE, not a memorised phrase.
 */
export const NOVEL_CONTEXT = {
  targetNoun: 'football',
  targetThing: 'tea',
  thingId: 'cup',
  place: 'Tokyo',
  partner: 'Chen',
  placeName: 'the bank',
}

const cap = (s) => `${String(s || '').charAt(0).toUpperCase()}${String(s || '').slice(1)}`

/* Resolve a bank entry (plain or subtype-keyed) for a step, or null if none exists. */
export function bankFor(bank, step) {
  const entry = bank[step.evalKind]
  if (!entry) return null
  if (typeof entry === 'function') return entry
  const sub = step.repairKind || step.timeForm || step.quantityForm || step.relationHint || 'none'
  return entry[sub] || null
}
