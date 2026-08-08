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
