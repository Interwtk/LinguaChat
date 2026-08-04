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

  express_like: ['interest', 'activity', 'food', 'drink', 'generic_object'],
  express_dislike: ['interest', 'food', 'drink', 'generic_object'],
  ask_preference: ['interest', 'activity'],
  yes_no_preference: ['interest', 'food', 'drink', 'generic_object'],
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
  generic_object: [typedValue('water', 'water', 'drink')],
  interest: [typedValue('music', 'music', 'interest'), typedValue('movies', 'movies', 'interest'), typedValue('games', 'games', 'interest')],
  activity: [typedValue('listen_music', 'listen to music', 'activity')],
  place: [],       // a place is the learner's own; never invent one
  feeling: [typedValue('good', 'good', 'feeling')],
  person: [],
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
