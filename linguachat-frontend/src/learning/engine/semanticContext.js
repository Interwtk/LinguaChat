/*
 * semanticContext — what a personalised value actually IS.
 *
 * Every ugly sentence this project has shipped came from the same hole: a
 * value travelled from one activity into another that had no idea what kind of
 * thing it was. "I like travel." "I want traveling." "I need music." "I'm from
 * Where you from." Each was a value used in a slot it did not belong in.
 *
 * The fix is small and deliberately boring: a value carries a type, an intent
 * declares which types its slot accepts, and a value that does not fit is never
 * used. There is no ontology here and no inference — just enough information to
 * refuse a nonsense sentence.
 *
 * The rule, when the two are in tension:
 *
 *     A correct neutral example beats an incorrect personalised one.
 */
import { seedFrom } from './variation.js'

export const SEMANTIC_TYPES = [
  'interest',        // music, games, movies — things you can like
  'activity',        // listen to music, plan a trip — things you can do
  'drink',           // water, coffee, tea
  'food',            // a sandwich
  'consumable',      // anything orderable that is neither clearly food nor drink
  'place',           // Bogotá, Japan
  'feeling',         // good, tired
  'person',          // Emma
  'generic_object',  // a thing you can ask for
  /*
   * A1 arc 2. An hour is neither a place nor an object, and the blueprint says
   * why the type has to exist: a slot that accepts it must reject "Madrid" and
   * "water". Only this one of the blueprint's four proposed A1 types is
   * registered — `day`, `relation` and `transport_mode` belong to arcs that do
   * not exist, and a type with no consumer makes coverage look real.
   */
  'time_point',      // seven, in the morning
  /*
   * A1 arc 3. The blueprint's reason for it is precise: "`person` holds a name; a
   * relation takes a possessive and cannot be substituted for one ('This is my
   * Alex')." So the slot in "This is my ___" accepts a relation and refuses a name,
   * which is a distinction no existing type could make.
   *
   * Registered now because arc 3 uses it. `day` and `transport_mode` are still
   * proposed for arcs that do not exist and stay unregistered.
   */
  'relation',        // friend, colleague, classmate
  /*
   * A1 arc 4. The blueprint's reason, and its own caveat: "Only needed if the
   * should-have transport episode is built; drop the type with the episode." The
   * episode is built, so the type is registered — and it is incompatible with
   * `place` on purpose, because a slot that accepted both would build "How do I get
   * to the bus?" out of a place and "Take the station" out of a transport mode.
   *
   * `day` remains the one proposed type with no consumer, and stays unregistered.
   */
  'transport_mode',  // bus, train
  /*
   * A1 arc 7. Proposed independently, and identically in substance, by both
   * A1's own blueprint (`a1-blueprint.json#semanticTypes.proposed`, arc
   * `making_arrangements`) and A2's already-shipped `levels/a2/semanticTypes.js`
   * ("reused-from-A1-proposal"). The two disagreed on `incompatibleWith`
   * (A1: `time_point`/`place`; A2: `time_point`/`relation`) — `SEMANTIC_TYPES`
   * here is a flat list with no `incompatibleWith` enforcement of its own (that
   * property is documentary, read by neither this file nor any check), so this
   * registration resolves the mismatch the only way that matters mechanically:
   * one shared entry, with both proposals' incompatibilities recorded as the
   * union (`time_point`, `place`, `relation`) rather than picking one and
   * silently dropping the other. `arrange_meeting`'s own evaluator
   * (`levels/a1/evaluators.js`) matches day/time/place directly against the
   * free-text reply rather than through `INTENT_SLOTS`'s personalisation
   * pipeline — arc 7 declares `personalizationMode: none` — so this type has no
   * `INTENT_SLOTS` consumer today; it is registered for the design record and
   * for whichever future level's intent does personalise a day.
   */
  'day',             // Monday, Friday
  /*
   * A2. Six more types, proposed and validated in `levels/a2/semanticTypes.js`
   * (`A2_SEMANTIC_TYPE_DEFS`) and registered here now that A2's content exists.
   * None of A2's 23 episodes personalise a free-text slot through this
   * pipeline (only `{name}` appears anywhere in the level's prose, handled
   * elsewhere) — every `INTENT_SLOTS` entry the new intents get below is
   * therefore explicitly empty, the same documented decision A1 arc 6/7 made
   * for `state_ability`/`ask_ability`/`arrange_meeting`. These types are
   * registered for the design record and so a later level's intent that does
   * personalise one of them does not have to invent it again.
   */
  'past_time',       // yesterday, last week
  'future_time',     // tomorrow, next week
  'month',           // January, March
  'date_ordinal',    // the first, the twentieth
  'quality',         // big, quiet, expensive
  /*
   * `problem` — broken, lost, the wrong one — was proposed independently by
   * both A2 (`levels/a2/semanticTypes.js`, `report_problem`) and B1
   * (`levels/b1/semanticSlots.js`'s `B1_NEW_SEMANTIC_TYPES`, reconciled with
   * B2/C1 in `docs/curriculum/semantic-types.md`), the same "two levels
   * proposed the identical type" shape `day` resolved above for A1/A2. One
   * shared entry serves both; B1's own intents personalise nothing through
   * this pipeline (see the `INTENT_SLOTS` comment below), so it needs no
   * second registration, only reuse.
   *
   * B2 independently proposed `problem_type` (`b2Patterns.js`'s
   * `B2_SEMANTIC_TYPES`, required by `justify_a_request_for_change`,
   * `negotiate_a_resolution`, `express_frustration_diplomatically`,
   * `negotiate_an_agreement_under_pushback`) — a categorized escalation of
   * this same `problem` family, resolved in
   * `docs/curriculum/semantic-types.md` section 1: ONE type
   * (`problem`, owned by B1), with an optional `category` field
   * (`delay`/`damage`/`wrong_item`/`missed_appointment`) rather than a
   * second, duplicate `SEMANTIC_TYPES` entry. No B2 evaluator currently
   * reads a categorized `problem` value through this pipeline either (see
   * the `INTENT_SLOTS` comment below — B2's problem-related turns are
   * literal English, not personalised), so this is a design-record
   * reconciliation rather than a live consumer today.
   */
  'problem',         // broken, lost, the wrong one
  /*
   * C1. `negotiated_item` (`levels/c1/c1Patterns.js`'s `C1_SEMANTIC_TYPES`,
   * resolved by `LC-FND-002`/`LC-AUD-001` F9 — see that file's own comment)
   * generalizes `problem` above: every `problem` value (a delay, damage, a
   * wrong item, a missed appointment) is a valid `negotiated_item`, plus
   * C1's own problem-free negotiable objects (a meeting slot, a compromise
   * plan) that `problem` alone must keep rejecting. Registered as its own,
   * separate type rather than collapsing into `problem` for exactly that
   * reason — a `problem`-scoped capability must never accept a calendar slot
   * as if it were a malfunction. No C1 evaluator currently reads a
   * personalised value through this pipeline (see the `INTENT_SLOTS`
   * comment below — C1's negotiation turns are literal English), so this is
   * a design-record registration, the same status `day` had until A1 arc 7
   * gave it a real consumer.
   */
  'negotiated_item', // a returned purchase, a shared calendar conflict, a compromise plan
  /*
   * C2. Four types proposed by `levels/c2/c2Patterns.js`'s `C2_SEMANTIC_TYPES.proposed`
   * (authored directly against the blueprint's `semanticTypes.proposed` field,
   * per that file's own header) and registered here now that C2's content
   * exists — the same "design-record until an intent personalises through
   * this pipeline" status `day`/`negotiated_item` held before their own first
   * consumer. No C2 evaluator currently reads a personalised value through
   * `INTENT_SLOTS` (see that object's own C2 comment below — every C2 source
   * text/audience/register/stance value in real episode content is literal
   * English, authored per scene, not filled from a learner-chosen topic).
   */
  'source_text',      // a two-paragraph opinion column, two short conflicting reviews
  /*
   * `incompatibleWith` is documentary only (see the note above this array),
   * so `register_level`'s blueprint-authored incompatibility with a type
   * this registry has never named (`free_text`) is transcribed verbatim
   * rather than silently corrected — it asserts nothing this file or any
   * check reads.
   */
  'audience_profile',  // a colleague outside the field, a worried customer, a child
  'register_level',    // formal, neutral, informal, technical
  'stance_marker',     // presumably, undeniably, to some extent
]

export const isSemanticType = (type) => SEMANTIC_TYPES.includes(type)

/*
 * What each intent's personalised slot will accept.
 *
 * An intent that is NOT listed takes no personalised value at all, which is
 * the safest default: silence rather than a wrong noun.
 */
export const INTENT_SLOTS = {
  /*
   * Most of the first two arcs personalise nothing at all: the learner's own
   * name and place are handled by the episode data, and there is no slot here
   * for a memory to slip into. They are listed anyway, explicitly empty, so
   * "this intent takes no value" is a decision on the page rather than an
   * omission somebody has to infer.
   */
  introduction: [],
  ask_name: [],
  nice_to_meet: [],
  ask_wellbeing: [],
  reciprocal_question: [],
  ask_origin: [],
  full_intro_conversation: [],
  accept_offer: [],
  decline_offer: [],

  /*
   * A1 arc 1. Saying what you do takes a PLACE and nothing else: "I work at
   * home" is the frame, and the slot must refuse everything a workplace is not —
   * a drink, a feeling, an interest. Asking takes no personalised value at all,
   * because the question is the same question whoever is being asked.
   */
  state_life_fact: ['place'],
  ask_life_fact: [],

  /*
   * A1 arc 2. A routine statement takes a TIME and nothing else: "I usually work
   * in the morning" is the frame, and the slot must refuse everything a time is
   * not. A place would build "I usually work at home in at home"; a drink would
   * build "I get up at water". The blueprint's reason for the type, enforced.
   */
  state_routine: ['time_point'],

  /*
   * A1 arc 3. Introducing somebody takes a RELATION and nothing else: "This is my
   * friend Ana" is the frame, and the slot exists precisely to refuse a name —
   * "This is my Ana" is the sentence the blueprint names as the reason the type had
   * to be invented. A place or a drink would be worse.
   *
   * Saying something about that person takes NO personalised value at all: nothing
   * the learner told us about themselves may be asserted about somebody else.
   */
  introduce_person: ['relation'],
  state_person_fact: [],

  express_like: ['interest', 'activity', 'food', 'drink', 'generic_object'],
  express_dislike: ['interest', 'food', 'drink', 'generic_object'],
  ask_preference: ['interest', 'activity'],
  /*
   * What may be offered as something to have an opinion about.
   *
   * `activity` is here because the interest catalogue produces gerunds — "Do
   * you like traveling?" is exactly as ordinary as "Do you like music?".
   *
   * `place` is deliberately NOT here, and that is the interesting exclusion:
   * "Do you like Bogota?" is perfectly grammatical, but the only place this
   * project stores is where the learner is FROM, captured as an origin and not
   * as a preference. Offering it back asserts an opinion they never expressed.
   * A slot is defined by its communicative function, not by whether the
   * sentence parses. `feeling` and `person` are excluded for the same reason.
   */
  yes_no_preference: ['interest', 'activity', 'food', 'drink', 'generic_object'],
  // wanting and needing are about things you can hold or have, never about
  // "travel" or "music" — that is where "I want traveling." came from
  express_want: ['drink', 'food', 'consumable', 'generic_object'],
  express_need: ['drink', 'food', 'consumable', 'generic_object'],
  ask_want: ['drink', 'food', 'consumable', 'generic_object'],
  // the café arc
  polite_request: ['drink', 'food', 'consumable', 'generic_object'],
  respond_anything_else: ['drink', 'food', 'consumable', 'generic_object'],
  finish_order: [],
  thank_service: [],
  cafe_order_conversation: ['drink', 'food', 'consumable'],
  // where you are from is a place, and nothing else is
  answer_origin: ['place'],
  answer_wellbeing: ['feeling'],
  simple_plan_conversation: ['interest', 'activity'],
  /*
   * Repair takes no personalised value at all. "Can you repeat, please?" is the
   * whole sentence; dropping a noun into it would produce "Can you repeat
   * music, please?". Personalisation belongs to the question being rescued, not
   * to the rescue.
   */
  repair_request: [],
  close_encounter: [],
  /*
   * The sixth arc. Asking what something is personalises nothing: the whole
   * point is that the learner does not know the word yet.
   *
   * Identifying and counting DO take a value, and only from the thing
   * catalogue: `generic_object` and `food` are the types it contains, and a
   * quantity additionally requires the entry to be countable — which the
   * catalogue knows and a semantic type alone could not.
   */
  ask_what_thing: [],
  identify_thing: ['generic_object', 'food'],
  use_quantity: ['generic_object', 'food'],
  /*
   * ARC 4. What each of the three location intents will accept in its slot, and the
   * exclusions are the point:
   *
   *   ask_location    a public place the episode names, or a thing you can look for.
   *                   NOT a `person` — "Where is Ana?" is a different question with
   *                   different politeness, and NOT a drink or a feeling.
   *   state_location  the same, because the answer is about the same noun.
   *   ask_transport   a place to go to and, separately, the mode. `place` and
   *                   `transport_mode` are declared incompatible in the blueprint,
   *                   and the slot list is where that stops being a comment.
   */
  ask_location: ['place', 'generic_object'],
  state_location: ['place', 'generic_object'],
  ask_transport: ['place', 'transport_mode'],
  /*
   * A1 arc 5. What you can ask the price OF: a generic thing or something
   * orderable — the same pool `polite_request` already draws on, minus `drink`,
   * because nothing in this arc's shop scene sells one.
   */
  ask_price: ['generic_object', 'food', 'consumable'],
  /*
   * A1 arc 6/7. All three take no personalised value: `state_ability`/
   * `ask_ability` judge a closed taught-activity set inline
   * (`levels/a1/evaluators.js`'s `ABILITY_ACTIVITIES`), and `arrange_meeting`
   * matches day/time/place directly against the reply rather than through this
   * pipeline — both arcs declare `personalizationMode: none` explicitly. Listed
   * here, explicitly empty, for the same reason `introduction`/`ask_name` are:
   * so "this intent takes no value" reads as a decision, not an omission.
   */
  state_ability: [],
  ask_ability: [],
  arrange_meeting: [],
  /*
   * A2's 17 new intents. All explicitly empty, for the same reason A1 arc
   * 6/7's three are above: none of A2's episodes drop a personalised value
   * into these turns (`levels/a2/semanticTypes.js`'s `A2_ARC_PERSONALIZATION`
   * describes per-arc slot compatibility for a FUTURE consumer, but no
   * episode step actually reads a `{noun}`/`{activity}`-style placeholder for
   * any of them today — a real grep across `levels/a2/episodes/**` finds only
   * `{name}`, already handled outside this pipeline). Listed here, explicitly
   * empty, so "this intent takes no value" reads as a decision, not a gap.
   */
  state_past_event: [],
  ask_past_event: [],
  narrate_past_sequence: [],
  state_future_plan: [],
  ask_future_plan: [],
  describe_person_or_place: [],
  compare_things: [],
  state_opinion_with_reason: [],
  give_multi_step_directions: [],
  /*
   * `state_availability` has no `INTENT_SLOTS` entry: it is not dispatched
   * (see `responseEvaluation.js`'s own comment) because no A2 episode uses it.
   */
  ask_availability: [],
  make_booking: [],
  spell_word: [],
  report_problem: [],
  ask_for_help: [],
  invite_someone: [],
  respond_to_invitation: [],
  /*
   * B1's 14 new intents. All explicitly empty, for the same reason A1 arc
   * 6/7's three and A2's seventeen are above: a real grep across
   * `levels/b1/episodes/**` finds only `{name}` placeholders, already
   * handled outside this pipeline — no B1 episode drops a personalised value
   * into these turns. `levels/b1/semanticSlots.js`'s own `B1_INTENT_SLOTS`
   * describes richer per-intent compatible types (`place`, `activity`,
   * `feeling`, `problem`, ...) for a FUTURE consumer, the same documented gap
   * A2's own `A2_ARC_PERSONALIZATION` left; listed here, explicitly empty, so
   * "this intent takes no value today" reads as a decision, not a gap.
   * `escalate_problem` is B1's runtime-renamed dispatch key for b1.json's own
   * `report_problem` — see `curriculum/b1Map.js`'s `B1_CAN_DO_INTENT` comment.
   */
  narrate_past_event: [],
  state_opinion: [],
  agree_or_disagree: [],
  compare_and_choose: [],
  describe_experience: [],
  recommend_or_warn: [],
  escalate_problem: [],
  negotiate_solution: [],
  state_future_intent: [],
  state_real_condition: [],
  state_hypothetical: [],
  change_topic: [],
  ask_follow_up: [],
  summarize_other: [],
  /*
   * B2's 14 new intents (`levels/b2/b2Intents.js`). Same reason as every
   * level above: a grep across `levels/b2/arcs/**` finds no `{placeholder}`
   * personalization at all (every prompt/target is literal English) — no B2
   * episode drops a personalised value into these turns through this
   * pipeline, matching B1's own documented decision. `argue_opinion_with_reason`
   * is B2's runtime-renamed dispatch key for `develop_and_defend_opinion`
   * (collides with A2's own, unrelated `state_opinion_with_reason` — see
   * `levels/b2/b2Capabilities.js`'s `B2_CAN_DO_INTENT` comment). `shift_register`
   * and `propose_a_resolution` each cover more than one B2 can-do via a
   * `subtype` field on the step (`topic_shift`/`formal_shift`/`informal_shift`,
   * `pushback`) rather than through this slot-personalization pipeline —
   * unrelated mechanisms, so one INTENT_SLOTS entry per intent is still
   * correct here regardless of how many can-dos reuse it.
   */
  argue_opinion_with_reason: [],
  weigh_options: [],
  concede_and_counter: [],
  justify_a_request: [],
  propose_a_resolution: [],
  express_diplomatic_frustration: [],
  state_unreal_hypothesis: [],
  speculate_cause_or_effect: [],
  express_past_regret: [],
  summarize_for_third_party: [],
  reformulate_for_clarity: [],
  report_third_party_opinion: [],
  shift_register: [],
  soften_or_intensify_claim: [],
  /*
   * C1's 11 new (non-repair) intents (`levels/c1/c1Intents.js`). Same reason
   * as every level above: a grep across `levels/c1/arcs/**` finds no
   * `{placeholder}` personalization at all — every prompt/target is literal
   * English. `track_discourse` and `adapt_register` each cover more than one
   * C1 can-do, distinguished by the step's own `canDoId` rather than a
   * `subtype` field (unlike B2's capstone) — see `levels/c1/evaluators.js`'s
   * own header for why, and its `canDoForIntent()` novelty-resolution
   * limitation this leaves as a documented gap. `clarify_ambiguity` is
   * listed too, explicitly empty like every intent above — it dispatches
   * through `repair_request` for its evaluator (see `responseEvaluation.js`'s
   * `REPAIR_KINDS` comment), but it is still C1's own literal evalKind in
   * real episode content, so it needs its own declared (empty) slot.
   */
  state_structured_argument: [],
  qualify_claim: [],
  concede_point: [],
  adapt_register: [],
  hedge_statement: [],
  summarize_message: [],
  synthesize_viewpoints: [],
  infer_meaning: [],
  extended_explanation: [],
  negotiate_outcome: [],
  clarify_ambiguity: [],
  track_discourse: [],
  /*
   * C2's 13 new intents (`levels/c2/c2Intents.js`). Same reason as every
   * level above: a grep across `levels/c2/arcs/**` finds no single-brace
   * `{placeholder}` personalization anywhere — every source text, audience,
   * register and stance value in real episode content is literal English,
   * authored per scene. (Five steps across arcs 1/2/3/5/7 do carry a
   * `personalizationVariant: true` flag with a `{{learnerInterest}}`-style
   * double-brace token in their prompt text — a different, informal
   * "optional interest-flavored alternative" idea the content task sketched
   * but never wired to any real consumer; not this slot-personalization
   * pipeline, which only ever recognizes single-brace tokens. Left as a
   * design note here rather than invented into a new engine feature, since
   * no `coreEngineRequirements` entry asks for it.) `reformulate_for_audience`,
   * `recognize_implication` and `edit_for_precision` each cover more than one
   * C2 can-do via the step's own `canDoId` (C1's pattern, not B2's `subtype`
   * field) — see `curriculum/c2Map.js`'s own header for why one INTENT_SLOTS
   * entry per intent is still correct regardless of how many can-dos reuse
   * it. `shift_register`, `qualify_claim` and `synthesize_viewpoints` are
   * NOT re-declared here — C2 reuses those three bare intent ids from
   * B2/C1 respectively (`curriculum/levelMaps.js`'s registry already shows
   * this precedent for `cafe_order_conversation`/`repair_request`/
   * `use_quantity` across Pre-A1/A1/A2), so their one shared INTENT_SLOTS
   * entry already above (still `[]`) covers C2's steps too; see
   * `responseEvaluation.js`'s own comment on these three cases for how
   * dispatch resolves which level's evaluator logic actually runs.
   */
  extract_argument: [],
  identify_stance: [],
  reformulate_for_audience: [],
  recognize_implication: [],
  develop_argument: [],
  rebut_counterargument: [],
  sustain_coherence: [],
  repair_at_intention_level: [],
  edit_for_precision: [],
  mediate_disagreement: [],
}

export const slotsFor = (intent) => INTENT_SLOTS[intent] || []

/*
 * A typed value. `id` is stable, `value` is what appears in the sentence.
 * Anything without a known type is refused rather than guessed at.
 */
export function typedValue(id, value, semanticType) {
  if (!id || !value || !isSemanticType(semanticType)) return null
  return { id: String(id), value: String(value), semanticType }
}

export const isContextCompatible = (intent, contextualValue) => {
  if (!contextualValue || !isSemanticType(contextualValue.semanticType)) return false
  return slotsFor(intent).includes(contextualValue.semanticType)
}

/*
 * The neutral catalogue: correct, unremarkable values for every slot, so
 * "no suitable memory" always has a good answer instead of a bad one.
 */
export const NEUTRAL_CATALOG = {
  drink: [typedValue('water', 'water', 'drink'), typedValue('tea', 'tea', 'drink'), typedValue('coffee', 'coffee', 'drink')],
  food: [typedValue('sandwich', 'a sandwich', 'food')],
  consumable: [typedValue('water', 'water', 'drink')],
  /*
   * Objects, not drinks. This slot used to fall back to water, so a turn that
   * asked for an object produced "It's a water." and — worse, since water
   * cannot be counted — "Two waters." These three are the objects episode 16
   * already teaches, and they carry their article for the sentences that need
   * one.
   */
  generic_object: [typedValue('book', 'a book', 'generic_object'), typedValue('phone', 'a phone', 'generic_object'), typedValue('bag', 'a bag', 'generic_object')],
  interest: [typedValue('music', 'music', 'interest'), typedValue('movies', 'movies', 'interest'), typedValue('games', 'games', 'interest')],
  activity: [typedValue('listen_music', 'listen to music', 'activity')],
  place: [],       // a place is the learner's own; never invent one
  feeling: [typedValue('good', 'good', 'feeling')],
  person: [],
  /*
   * Arc 4's transport modes ARE inventable, unlike a place: "the bus" is nobody's
   * personal detail, so a turn that needs one has a correct neutral answer instead
   * of going bare.
   */
  transport_mode: [typedValue('bus', 'the bus', 'transport_mode'), typedValue('train', 'the train', 'transport_mode')],
}

/*
 * The intent that defines what an activity's SUBJECT may be — the value that
 * fills `{noun}` in "Do you like {noun}?" and in the lines around it.
 *
 * Anything the learner told us is a candidate and nothing is a candidate by
 * default: a fact is used only when its type fits the slot, and the curated
 * interest catalogue answers when it does not. Fallback beats a wrong
 * personalisation — the rule this file exists for.
 */
export const SUBJECT_INTENT = 'yes_no_preference'

export function asSubjectValue(value) {
  const typed = value && typeof value === 'object' && value.semanticType ? value : classifyValue(value?.value ?? value)
  return isContextCompatible(SUBJECT_INTENT, typed) ? typed : null
}

/*
 * THE THING CATALOGUE.
 *
 * Four facts per entry, each of which a sentence needs:
 *
 *   singular / plural  because "two sandwichs" is not a word, and forming a
 *                      plural by adding "s" is exactly the naive rule that
 *                      would produce it
 *   article            because "an apple" is not "a apple", and the learner is
 *                      never taught the rule in Pre-A1 — the material simply has
 *                      to be right
 *   countability       because "It’s a water." and "two coffee" are the two
 *                      sentences this arc could most easily have shipped
 *
 * `mass` entries are listed precisely so they can be REFUSED where a count is
 * needed. They stay perfectly usable where the café already uses them.
 */
export const COUNTABILITY = ['count', 'mass']

export const THINGS = {
  book: { id: 'book', singular: 'book', plural: 'books', article: 'a', semanticType: 'generic_object', countability: 'count' },
  phone: { id: 'phone', singular: 'phone', plural: 'phones', article: 'a', semanticType: 'generic_object', countability: 'count' },
  bag: { id: 'bag', singular: 'bag', plural: 'bags', article: 'a', semanticType: 'generic_object', countability: 'count' },
  cup: { id: 'cup', singular: 'cup', plural: 'cups', article: 'a', semanticType: 'generic_object', countability: 'count' },
  sandwich: { id: 'sandwich', singular: 'sandwich', plural: 'sandwiches', article: 'a', semanticType: 'food', countability: 'count' },
  apple: { id: 'apple', singular: 'apple', plural: 'apples', article: 'an', semanticType: 'food', countability: 'count' },
  /* known, and known to be uncountable here */
  water: { id: 'water', singular: 'water', plural: 'water', article: null, semanticType: 'drink', countability: 'mass' },
  coffee: { id: 'coffee', singular: 'coffee', plural: 'coffee', article: null, semanticType: 'drink', countability: 'mass' },
  tea: { id: 'tea', singular: 'tea', plural: 'tea', article: null, semanticType: 'drink', countability: 'mass' },
  music: { id: 'music', singular: 'music', plural: 'music', article: null, semanticType: 'interest', countability: 'mass' },
}

export const thingById = (id) => THINGS[String(id || '').toLowerCase()] || null

/* A thing you can point at and say "It's a ...". */
export const isCountableThing = (id) => thingById(id)?.countability === 'count'

/* The countable things this arc may talk about, in a stable order. */
export const COUNTABLE_THINGS = Object.keys(THINGS).filter(isCountableThing)

/*
 * "a book" / "an apple" / and nothing at all for water. Built from the entry
 * rather than from the first letter, so a silent-h or a "a university" style
 * exception is a data change and never a rule change.
 */
export function withArticle(id) {
  const thing = thingById(id)
  if (!thing) return ''
  return thing.article ? `${thing.article} ${thing.singular}` : thing.singular
}

/*
 * "one book" / "two books" / "" for anything that cannot be counted.
 *
 * Refusing outright is deliberate: a quantity of an uncountable thing is a
 * sentence this level should never have to produce, and returning something
 * plausible would hide the mistake at the call site.
 */
export function countedThing(id, count) {
  const thing = thingById(id)
  const n = Number(count)
  if (!thing || thing.countability !== 'count' || !Number.isInteger(n) || n < 1) return ''
  return `${n === 1 ? thing.singular : thing.plural}`
}

/* Whether a value may be pointed at and identified: "It's a ___". */
export function asIdentifiableThing(value) {
  const thing = thingById(value)
  if (thing && thing.countability === 'count') return thing
  return null
}

export function neutralFor(intent, seed = '') {
  for (const slot of slotsFor(intent)) {
    const options = NEUTRAL_CATALOG[slot] || []
    if (options.length) return options[seedFrom(String(seed)) % options.length]
  }
  return null
}

/*
 * A neutral value that is deliberately NOT the one already in play, for a
 * "now try it with something else" turn. If the slot only knows one thing,
 * repeating it is better than inventing a second.
 */
export function otherNeutral(intent, seed = '', avoid = null) {
  const pool = slotsFor(intent).flatMap(slot => NEUTRAL_CATALOG[slot] || [])
  if (!pool.length) return null
  const others = pool.filter(v => v.value !== avoid?.value)
  const list = others.length ? others : pool
  return list[seedFrom(String(seed)) % list.length]
}

/*
 * Words the learner has met that we know the type of. Kept here because the
 * catalogue of what CAN be said is a language question, not a profile.
 */
const KNOWN_VALUES = {
  water: 'drink', coffee: 'drink', tea: 'drink', juice: 'drink',
  sandwich: 'food', 'a sandwich': 'food',
  music: 'interest', movies: 'interest', games: 'interest', sports: 'interest',
  books: 'interest', art: 'interest', technology: 'interest', food: 'interest',
  traveling: 'activity', 'my work': 'interest', 'my family': 'interest',
  good: 'feeling', fine: 'feeling', tired: 'feeling',
  /*
   * The interests added by the personalization sprint. Every catalogue noun has
   * to be typed here or it cannot be used in "I like ___" — which is exactly the
   * guard that stops a new interest from arriving with an ungrammatical noun.
   */
  history: 'interest', animals: 'interest', nature: 'interest', business: 'interest',
  photography: 'interest', architecture: 'interest', cars: 'interest',
  cooking: 'interest', science: 'interest',
  /*
   * A1 arc 1's workplaces. Typed as places because that is what they are, and
   * typed at all because an untyped value cannot be used: without these,
   * "I work at home" could not be built and the slot would fall back to neutral.
   *
   * Three, and no employer names ever. The learner's own answer is stored as a
   * `work_or_study` fact with the same type, so it fits the same slot.
   */
  home: 'place', 'at home': 'place',
  'the office': 'place', 'at the office': 'place',
  university: 'place', 'at university': 'place',
  /*
   * A1 arc 2's times. Two kinds, one type: the part of the day, and the hour.
   *
   * The hours stop at ten because the level's numbers do — `time_at_pattern`
   * declares `numbers_1_10` as its prerequisite and eleven upwards arrives in
   * arc 5. Writing "at eleven" here would let the engine build a sentence out of
   * a number the learner has never met.
   */
  'in the morning': 'time_point', 'in the afternoon': 'time_point', 'in the evening': 'time_point',
  morning: 'time_point', afternoon: 'time_point', evening: 'time_point',
  one: 'time_point', two: 'time_point', three: 'time_point', four: 'time_point', five: 'time_point',
  six: 'time_point', seven: 'time_point', eight: 'time_point', nine: 'time_point', ten: 'time_point',
  /*
   * A1 arc 3's relations. Three, and neutral, which is the arc's own risk note
   * enforced: "Family vocabulary and cultural assumptions. The budget is three
   * neutral relations plus a fallback that needs none, and no episode assumes a
   * family structure." So no `sister`, no `wife`, no `son` — the fallback is
   * introducing somebody by name alone, which needs no relation at all.
   */
  friend: 'relation', colleague: 'relation', classmate: 'relation',
  /*
   * A1 arc 4's places and transport. The two places are PUBLIC ones the episodes
   * name themselves — a station and a toilet belong to nobody, which is why the arc
   * can teach location without storing where a learner is. `TAUGHT_PLACES` reads
   * this map, so adding them here is also what lets the engine recognise them
   * inside a learner's own sentence.
   *
   * The two modes are typed separately, because the blueprint declares
   * `transport_mode` incompatible with `place`: without the distinction a slot
   * could build "How do I get to the bus?" and think it had personalised something.
   */
  station: 'place', 'the station': 'place', toilet: 'place', 'the toilet': 'place',
  bus: 'transport_mode', 'the bus': 'transport_mode',
  train: 'transport_mode', 'the train': 'transport_mode',
}

/*
 * Type a bare value the learner produced. Unknown values are typed as
 * `generic_object` ONLY when the caller says the value came from a slot where
 * that is safe; otherwise they stay untyped and unusable.
 */
export function classifyValue(value, { assumeType = null } = {}) {
  const clean = String(value || '').trim().toLowerCase()
  if (!clean) return null
  const known = KNOWN_VALUES[clean]
  if (known) return typedValue(clean, String(value).trim(), known)
  if (assumeType && isSemanticType(assumeType)) return typedValue(clean, String(value).trim(), assumeType)
  return null
}

/*
 * The taught places, longest first, so "the office" wins over a bare "office"
 * would-be match and "at home" normalises to "home".
 */
const TAUGHT_PLACES = Object.keys(KNOWN_VALUES)
  .filter(key => KNOWN_VALUES[key] === 'place')
  .map(key => key.replace(/^at\s+/, ''))
  .filter((place, i, all) => all.indexOf(place) === i)
  .sort((a, b) => b.length - a.length)

/*
 * The place a learner named inside their own sentence, or null.
 *
 * This is how the blueprint's `work_or_study` fact gets a value: it is typed
 * `place`, and its privacy note says "no employer names; a neutral category is
 * enough". So only the places this level actually teaches are recognised —
 * "I work at Contoso" yields nothing rather than an employer, and "I study"
 * yields nothing rather than a guess. Whole-word matching, so "homework" is not
 * a home.
 */
/*
 * The taught clock hour a learner named, as a word, or null.
 *
 * This is how the blueprint's `usual_time` fact gets a value: `semanticType:
 * time_point`, and the level teaches `at + hour` over the numbers it owns. A part
 * of the day is deliberately NOT accepted here — "in the morning" is when the
 * routine happens broadly, and `making_arrangements` needs an hour to propose a
 * meeting. Digits are read too, because a learner types "at 7".
 */
const TAUGHT_HOURS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

export function taughtHourIn(text) {
  const clean = String(text || '').toLowerCase()
  const digit = clean.match(/\bat\s+(\d{1,2})\b/)
  if (digit) {
    const n = Number(digit[1])
    return n >= 1 && n <= TAUGHT_HOURS.length ? TAUGHT_HOURS[n - 1] : null
  }
  const word = clean.replace(/[^\p{L}\s]/gu, ' ')
  for (const hour of TAUGHT_HOURS) {
    if (new RegExp(`\\bat\\s+${hour}\\b`, 'u').test(word)) return hour
  }
  return null
}

export function taughtPlaceIn(text) {
  const clean = String(text || '').toLowerCase().replace(/[^\p{L}\s]/gu, ' ')
  for (const place of TAUGHT_PLACES) {
    if (new RegExp(`(?:^|\\s)${place}(?:\\s|$)`, 'u').test(clean)) return place
  }
  return null
}

/*
 * Choose the value an activity should talk about.
 *
 * Order: something the learner told us (if it FITS this slot), then the
 * interest they chose (if it fits), then a neutral catalogue value. A value of
 * the wrong type is skipped entirely — it is never coerced, never reworded and
 * never used "close enough".
 */
export function selectCompatibleContext({
  intent,
  facts = [],
  interests = [],
  seed = '',
  fallback = true,
} = {}) {
  const slots = slotsFor(intent)
  if (!slots.length) return null

  const typedFacts = facts
    .map(f => (f && f.semanticType ? f : classifyValue(f?.value ?? f)))
    .filter(Boolean)
    .filter(v => isContextCompatible(intent, v))
  if (typedFacts.length) return typedFacts[seedFrom(String(seed)) % typedFacts.length]

  const typedInterests = interests
    .map(i => (i && i.semanticType ? i : classifyValue(i?.value ?? i)))
    .filter(Boolean)
    .filter(v => isContextCompatible(intent, v))
  if (typedInterests.length) return typedInterests[seedFrom(`${seed}:interest`) % typedInterests.length]

  return fallback ? neutralFor(intent, seed) : null
}
