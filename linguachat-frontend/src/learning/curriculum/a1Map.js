/*
 * a1Map — what A1's implemented capabilities are, and nothing about Pre-A1.
 *
 * Pre-A1 has `preA1Map.js`; this is the same idea for the level above it, and it
 * is deliberately a SEPARATE file rather than a section of that one. The reason is
 * the bug class this architecture spent a whole sprint removing: a registry named
 * after one level that quietly answers for two. Pre-A1's required core, its exit
 * criteria and its readiness must not move because A1 gained content, and the
 * simplest way to guarantee that is for A1's facts to live somewhere Pre-A1 does
 * not read.
 *
 * ARCS 1, 2, 3 AND 4 ARE HERE. A1 is designed in full (seven arcs, twenty-one
 * episodes, in docs/curriculum/a1-blueprint.json) and implemented one arc at a time.
 * Listing capabilities nobody can practise yet would make coverage look real, so the
 * capabilities appear here as their arcs are built.
 */
import { A1, episodesOfLevel } from './levels.js'
import { SKELETON_BY_ID } from './preA1Skeleton.generated.js'

/* The arcs of A1 with runtime content today, in the blueprint's order. */
export const A1_RUNTIME_ARCS = ['work_and_study', 'daily_rhythm', 'people_around_you', 'finding_your_way', 'paying_and_choosing']

/*
 * The capability each A1 can-do is evidenced by, in the same shape Pre-A1 uses:
 * one intent per can-do, which is what coverage and the planner read.
 */
export const A1_CAN_DO_INTENT = {
  talk_about_work_or_study: 'state_life_fact',
  ask_about_work_or_study: 'ask_life_fact',
  /*
   * Arc 2. Two capabilities share `state_routine` on purpose, and it is the
   * blueprint's rule rather than a shortcut: "One intent per communicative
   * function. Variants travel as a subtype on the step payload." Saying what you
   * do every day and saying when you do it are the same function with more
   * detail, so the difference lives in the step's `timeForm` and the capability is
   * credited by the episode that teaches it.
   *
   * Asking what a word means reuses `repair_request`, which the can-do itself
   * prescribes (`intentReuse`); the new `ask_meaning` kind is the subtype.
   */
  talk_about_daily_routine: 'state_routine',
  say_when_something_happens: 'state_routine',
  ask_what_something_means: 'repair_request',
  /*
   * Arc 3. The DEFINING intent, which is what coverage and the planner read: a
   * capability has one headline function. Introducing somebody is that function.
   */
  introduce_someone_else: 'introduce_person',
  /*
   * Arc 4. Three capabilities, three intents — the arc that finally makes the
   * one-intent-per-function rule look like arithmetic. Asking where something is,
   * saying where it is and asking how to get somewhere are three different things
   * to do with English, and the blueprint names all three.
   */
  ask_where_something_is: 'ask_location',
  say_where_something_is: 'state_location',
  ask_about_getting_somewhere: 'ask_transport',
  /*
   * Arc 5. `use_bigger_numbers` reuses `use_quantity` with its taught range
   * extended, exactly as the blueprint's own `intentReuse` note prescribes — not
   * a new intent. `ask_the_price` is the arc's one genuinely new intent.
   * `buy_something`'s headline is Pre-A1's `cafe_order_conversation`, reused: the
   * blueprint says the capability itself "reuses the café shape Pre-A1 already
   * owns and adds the money the café never mentioned", and its second intent
   * (below) is where that money enters.
   */
  use_bigger_numbers: 'use_quantity',
  ask_the_price: 'ask_price',
  buy_something: 'cafe_order_conversation',
}

/*
 * A capability may be evidenced by more than one intent, and arc 3 is the first case:
 * the blueprint gives `introduce_someone_else` three patterns — `this_is_pattern`,
 * `he_she_is_pattern`, `possessive_pattern` — and the middle one is a different
 * communicative function ("she is a student") from presenting a person ("this is
 * Ana"). Both are the same capability.
 *
 * Kept as a SEPARATE map rather than by turning `A1_CAN_DO_INTENT` into lists,
 * because every reader of that map — coverage, the planner, the authoring contract —
 * asks it "which one intent headlines this capability" and would have to learn a new
 * shape for one arc's sake.
 */
export const A1_CAN_DO_EXTRA_INTENTS = {
  introduce_someone_else: ['state_person_fact'],
  /*
   * Arc 5. Buying is the café shape PLUS asking what something costs — the money
   * the café never mentioned, in the blueprint's own words — so its second
   * intent is `ask_price`, reused from episode 31/32 rather than duplicated.
   */
  buy_something: ['ask_price'],
}

/* Every intent a capability may be evidenced by, headline first. */
export const a1IntentsOf = (canDoId) => [
  A1_CAN_DO_INTENT[canDoId],
  ...(A1_CAN_DO_EXTRA_INTENTS[canDoId] || []),
].filter(Boolean)

/*
 * Which of them a learner must own to be considered done with the LEVEL. Both of
 * arc 1's are `required` in the blueprint — but this list is not an exit
 * criterion and must not be mistaken for one: A1 has no exit criteria yet,
 * because six of its arcs do not exist. It records scope, so a later arc cannot
 * quietly demote a capability to optional.
 */
export const A1_REQUIRED_CAN_DOS = [
  'talk_about_work_or_study', 'ask_about_work_or_study',
  'talk_about_daily_routine', 'say_when_something_happens', 'ask_what_something_means',
  'introduce_someone_else',
  /*
   * Arc 4's two required ones. `ask_about_getting_somewhere` is deliberately absent:
   * the blueprint scopes it `should`, and a should-have listed as required would
   * quietly promote it — the opposite of the drift this list exists to prevent.
   */
  'ask_where_something_is', 'say_where_something_is',
  /* Arc 5's three — all required in the blueprint, no should-have among them. */
  'use_bigger_numbers', 'ask_the_price', 'buy_something',
]

/*
 * Understood, not produced. `at_the_office` and `at_university` are places other
 * people mention in the arc's listening turns; the learner is never asked to say
 * them, and nothing here counts them as production.
 */
export const A1_RECEPTIVE_ITEMS = [
  'at_the_office', 'at_university',
  /*
   * Arc 2's two: the words episode 23's story carries so the learner has
   * something real to ask the meaning of. Understood, asked about, never produced.
   */
  'early', 'late',
  /*
   * Arc 3's two: the third-person -s. The blueprint is explicit — "third-person -s
   * heard, never required" — so the learner meets "she works" in somebody else's
   * sentence and answers with "she is".
   */
  'works_third', 'studies_third',
  /*
   * Arc 4's eight, and the largest receptive block in the level so far — because
   * that IS the arc. The learner asks with words they own and hears an answer that
   * is deliberately over their head: floors, relations they were never taught, a
   * platform, a bus. None of it is ever asked for; the repair is what carries them.
   */
  'bus', 'train', 'upstairs', 'downstairs', 'opposite', 'behind', 'exit', 'platform',
  /*
   * Arc 5's one: the third option a shopkeeper offers unplanned. Understood,
   * never asked for — the learner is never required to buy or name it.
   */
  'banana',
]

/*
 * Nothing yet. The arc's budget is small enough that everything it shows is
 * either produced or declared receptive above — the list exists so a later arc
 * has somewhere honest to put language it mentions without teaching.
 */
export const A1_INCIDENTAL_ITEMS = []

export const a1Episodes = () => episodesOfLevel(A1)

export const A1_ARC_CAN_DOS = [...new Set(a1Episodes().map(ep => ep.canDoId).filter(Boolean))]

/* Which episodes teach a capability — derived, never declared twice. */
export function a1EpisodesForCanDo(canDoId) {
  return a1Episodes().filter(ep => ep.canDoId === canDoId).map(ep => ep.id)
}

/*
 * The items an A1 capability is PRODUCED with, taken from the steps that ask the
 * learner to produce it. Structural, like Pre-A1's version: a step that only
 * shows an item does not count.
 */
export function a1ProductiveItemsOf(canDoId) {
  const intents = a1IntentsOf(canDoId)
  if (!intents.length) return []
  const out = new Set()
  for (const ep of a1Episodes()) {
    for (const step of ep.steps || []) {
      const producedHere = intents.includes(step.evalKind)
        || (step.turns || []).some(turn => intents.includes(turn.evalKind))
      if (!producedHere) continue
      ;(step.itemIds || []).forEach(id => out.add(id))
      for (const turn of step.turns || []) (turn.itemIds || []).forEach(id => out.add(id))
    }
  }
  return [...out]
}

/*
 * A1's required core: the language a learner must be able to USE for the
 * capabilities this level requires. Scoped to A1's own episodes, so it can never
 * add anything to what Pre-A1 requires.
 */
export function a1RequiredLevelItems() {
  return [...new Set(A1_REQUIRED_CAN_DOS.flatMap(id => a1ProductiveItemsOf(id)))]
}

/*
 * How much of A1 exists. Reported honestly rather than as a boolean, because
 * "the level has content" and "the level is finished" are different facts and
 * conflating them is how a partially built level gets shown to a learner.
 */
export function a1ImplementationStatus() {
  const episodes = a1Episodes()
  return {
    runtimeArcs: [...new Set(episodes.map(ep => ep.arc))],
    runtimeEpisodes: episodes.map(ep => ep.id),
    canDos: A1_ARC_CAN_DOS,
    /* the design totals live in the blueprint; nothing here derives them */
    complete: false,
  }
}

/*
 * Which catalogue entries belong to A1.
 *
 * The vocabulary catalogue is shared by every level, so "how much language does
 * Pre-A1 ship" can only be answered by subtracting the levels above it. Declaring
 * A1's share here — derived from what its episodes grant and refer to, plus the
 * receptive and incidental lists — is what lets the Pre-A1 freeze stay exact while
 * the shelf they both sit on grows.
 */
export const A1_INTRODUCED_ITEMS = [
  /* arc 1 — what you do */
  'study', 'at_home', 'what_do_you_do', 'i_do_pattern', 'do_you_pattern',
  /* arc 2 — how your day goes: two actions, two adverbs, four pattern groups */
  'get_up', 'have_breakfast', 'usually', 'sometimes',
  'frequency_pattern', 'part_of_day_pattern', 'time_at_pattern', 'what_does_mean_pattern',
  /* arc 3 — who this is: three neutral relations, three pattern groups */
  'friend', 'colleague', 'classmate',
  'this_is_pattern', 'he_she_is_pattern', 'possessive_pattern',
  /* arc 4 — where things are: two patterns, two places, four relations */
  'where_is_pattern', 'its_location_pattern', 'here', 'there', 'next_to', 'near', 'toilet', 'station',
  /* arc 5 — what it costs: three patterns, two choosing words, a ticket, a unit */
  'numbers_11_100', 'how_much_pattern', 'price_pattern', 'this_one', 'that_one', 'ticket', 'dollars',
  /* receptive: heard, never asked for */
  'at_the_office', 'at_university', 'early', 'late', 'works_third', 'studies_third',
  'bus', 'train', 'upstairs', 'downstairs', 'opposite', 'behind', 'exit', 'platform', 'banana',
]

/*
 * Which catalogue entries THIS LEVEL ADDED. Declared rather than derived, and the
 * distinction matters: "everything A1 refers to" includes the Pre-A1 language it
 * reuses, and reuse must never move an item from one level's budget to another.
 * `work` is the example — it was already in the catalogue, unreferenced, and arc 1
 * is the first content that teaches it, so it stays Pre-A1's entry and A1 simply
 * grants it.
 */
export function a1ItemIds() {
  return new Set(A1_INTRODUCED_ITEMS)
}

export const a1EpisodeById = (id) => (SKELETON_BY_ID[id]?.level === 'A1' ? SKELETON_BY_ID[id] : null)
