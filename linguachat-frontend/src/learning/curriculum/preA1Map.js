/*
 * preA1Map — what Pre-A1 currently teaches, and what it still owes the learner.
 *
 * Two kinds of knowledge live here, and only one of them is written by hand.
 *
 *   DERIVED   — everything that is already a fact of the episodes (which arc,
 *               which prerequisite, which can-do, which items, which intents).
 *               It is computed from ARC on demand, never copied, so a manifest
 *               can never quietly disagree with the curriculum it describes.
 *
 *   DECLARED  — the judgements an audit makes and code cannot: whether a
 *               capability is covered or fragile, whether a word is meant to be
 *               produced or only understood, what Pre-A1 still needs before it
 *               can be called finished.
 *
 * The rule that keeps the two apart: if a question can be answered by reading
 * the episodes, it MUST be answered by reading the episodes.
 */
import { ARC, ARCS, getEpisode, episodesInArc } from '../episodes/index.js'

export const LEVEL = 'pre_a1'

/* ---------------------------------------------------------------- derived --*/

export const episodesForLevel = (level = LEVEL) => (level === LEVEL ? ARC : [])
export const arcsForLevel = (level = LEVEL) => (level === LEVEL ? ARCS : [])
export const getArcForEpisode = (id) => getEpisode(id)?.arc || (getEpisode(id) ? 'greetings' : null)
export const getPrerequisites = (id) => getEpisode(id)?.prerequisites || []
export const getCanDoForEpisode = (id) => getEpisode(id)?.canDoId || null

/* The whole chain a learner must finish before `id` unlocks, in order. */
export function prerequisiteChain(id, seen = new Set()) {
  const chain = []
  for (const p of getPrerequisites(id)) {
    if (seen.has(p)) continue          // a cycle is a bug; do not spin on it
    seen.add(p)
    chain.push(...prerequisiteChain(p, seen), p)
  }
  return [...new Set(chain)]
}

/* Every intent an episode actually evaluates. */
export const intentsForEpisode = (id) =>
  [...new Set((getEpisode(id)?.steps || []).map(s => s.evalKind).filter(Boolean))]

/*
 * Where a language item is PRODUCED, as opposed to merely granted. A free
 * reply or recall records its `itemIds`; a build/gap/choice records its
 * `itemId`. Anything else the learner only has to understand.
 */
export function episodesProducing(itemId) {
  const out = []
  for (const ep of ARC) {
    const produces = (ep.steps || []).some(s =>
      ((s.type === 'free_reply' || s.type === 'recall') && (s.itemIds || []).includes(itemId))
      || (['word_order', 'fill_blank', 'choice'].includes(s.type) && s.itemId === itemId))
    if (produces) out.push(ep.id)
  }
  return out
}

/* Where a can-do is first earned, and everywhere its intent comes back. */
export function canDoCoverage(canDoId) {
  const home = ARC.find(e => e.canDoId === canDoId)
  if (!home) return null
  const intent = CAN_DO_INTENT[canDoId] || null
  const reusedIn = intent ? ARC.filter(e => e.id !== home.id && intentsForEpisode(e.id).includes(intent)).map(e => e.id) : []
  return { canDoId, intent, introducedIn: home.id, arc: home.arc || 'greetings', reusedIn }
}

/*
 * Which intent stands for each can-do. This is the one mapping the episodes do
 * not state outright — an episode names its can-do and its steps name their
 * intents, but nothing says which of those intents IS the can-do.
 */
export const CAN_DO_INTENT = {
  introduce_self: 'introduction',
  ask_name: 'ask_name',
  full_greeting: 'nice_to_meet',
  ask_wellbeing: 'ask_wellbeing',
  ask_origin: 'ask_origin',
  full_conversation: 'full_intro_conversation',
  express_preferences: 'express_like',
  express_needs: 'express_want',
  make_plan: 'simple_plan_conversation',
  polite_request: 'polite_request',
  respond_anything_else: 'respond_anything_else',
  cafe_order: 'cafe_order_conversation',
}

/* --------------------------------------------------------------- declared --*/

/*
 * Language the learner meets but is never asked to say.
 *
 * A café is full of sentences you only ever hear — "Here you are." is one of
 * them. Understanding them is real learning and they belong in the Memory
 * Garden; counting them as production would inflate the curriculum with things
 * nobody ever practised.
 */
export const RECEPTIVE_ITEMS = ['hello', 'here_you_are', 'anything_else']

/*
 * Words the learner does say, but only inside a phrase that is tracked as a
 * whole. "Can I have coffee, please?" is practised; `coffee` on its own is not
 * a separate exercise, and the review engine deliberately does not schedule it.
 *
 * Listed explicitly so the gap between what the Garden shows and what the
 * learner model tracks is a decision on the page rather than an accident.
 */
export const INCIDENTAL_ITEMS = ['name', 'fine', 'tired', 'help', 'water', 'coffee', 'tea', 'juice']

/*
 * The patterns Pre-A1 puts in front of the learner, and how far each one gets.
 *
 *   comprehension        it is explained or recognised
 *   guided_production    built with the words supplied (gap-fill, word order)
 *   independent          produced from scratch in a free reply or recall
 */
export const PATTERN_COVERAGE = {
  /*
   * Only two patterns are ever produced from scratch, and both because they are
   * tracked through the phrase that carries them. The other five are practised
   * with the words supplied — a gap to fill or options to choose — and then the
   * learner moves on. They can say the sentences; the pattern itself has never
   * had to come out of their own head.
   */
  im_pattern: { term: 'I’m + name', reaches: 'independent', trackedAs: 'im' },
  whats_your_pattern: { term: 'What’s your + noun', reaches: 'independent', trackedAs: 'whats_your_name' },
  im_feeling_pattern: { term: 'I’m + feeling', reaches: 'guided_production', trackedAs: 'im_feeling_pattern' },
  im_from_pattern: { term: 'I’m from + place', reaches: 'guided_production', trackedAs: 'im_from_pattern' },
  i_like_pattern: { term: 'I like + noun', reaches: 'guided_production', trackedAs: 'i_like_pattern' },
  i_want_pattern: { term: 'I want + noun', reaches: 'guided_production', trackedAs: 'i_want_pattern' },
  can_i_have_pattern: { term: 'Can I have + item + please?', reaches: 'guided_production', trackedAs: 'can_i_have_pattern' },
}

/*
 * THE COMPLETION MAP.
 *
 * status
 *   covered           taught and practised often enough to rely on
 *   fragile           taught, but produced in only one episode
 *   needs_reuse       taught and then dropped; it must come back, not be retaught
 *   missing_required  Pre-A1 cannot honestly be called finished without it
 *   optional          would help, would not be missed
 *   defer_a1          real English, wrong level
 *
 * `covers` names the can-do or intent that already carries the capability, so
 * a check can confirm the claim instead of trusting it.
 */
export const CAPABILITY_MAP = [
  /* ---- already carried by the twelve episodes ---- */
  { id: 'greet_and_introduce', status: 'covered', covers: { canDo: 'introduce_self' }, note: 'produced in six episodes; the most reused skill in Pre-A1' },
  { id: 'ask_someones_name', status: 'covered', covers: { canDo: 'ask_name' } },
  { id: 'close_a_greeting', status: 'covered', covers: { canDo: 'full_greeting' } },
  { id: 'ask_and_answer_wellbeing', status: 'covered', covers: { canDo: 'ask_wellbeing' } },
  { id: 'ask_and_answer_origin', status: 'covered', covers: { canDo: 'ask_origin' } },
  { id: 'hold_a_first_conversation', status: 'covered', covers: { canDo: 'full_conversation' } },
  { id: 'express_a_preference', status: 'covered', covers: { canDo: 'express_preferences' } },
  { id: 'express_a_want_or_need', status: 'covered', covers: { canDo: 'express_needs' } },
  { id: 'agree_a_small_plan', status: 'covered', covers: { canDo: 'make_plan' } },
  { id: 'make_a_polite_request', status: 'covered', covers: { canDo: 'polite_request' } },
  { id: 'answer_a_follow_up_offer', status: 'covered', covers: { canDo: 'respond_anything_else' } },
  { id: 'complete_a_transaction', status: 'covered', covers: { canDo: 'cafe_order' } },

  /* ---- taught once and never asked for again ---- */
  { id: 'say_what_you_dislike', status: 'fragile', covers: { intent: 'express_dislike' },
    note: 'produced only in episode 7; "I don’t like…" never returns' },
  { id: 'answer_a_yes_no_preference', status: 'fragile', covers: { intent: 'yes_no_preference' },
    note: 'produced only in episode 7' },
  { id: 'say_what_you_need', status: 'fragile', covers: { intent: 'express_need' },
    note: 'produced only in episode 8; the café practises wanting, never needing' },
  { id: 'decline_an_offer', status: 'needs_reuse', covers: { intent: 'decline_offer' },
    note: 'episode 8 only as its own turn; later arcs let the learner decline but never require it' },
  { id: 'bounce_a_question_back', status: 'needs_reuse', covers: { intent: 'reciprocal_question' },
    note: '"And you?" is produced in episodes 4 and 5 and then disappears for seven episodes' },

  /* ---- Pre-A1 is not finished without these ---- */
  { id: 'repair_understanding', status: 'missing_required', priority: 'must',
    why: 'A learner who cannot say "I don’t understand." leaves every conversation the moment it goes off-script. This is the difference between language that works and language that only works when nothing surprising happens — and every capability already taught is exposed to it.',
    canDo: 'ask_for_repair',
    prerequisites: ['full_conversation'],
    vocabularyBudget: 5,
    newPatterns: ['I don’t understand.', 'Can you repeat, please?'],
    reuseTargets: ['polite_request', 'answer_wellbeing', 'introduction'],
    idealContext: 'inside a conversation the learner is already having, not a lesson about failure' },

  { id: 'say_thank_you_and_goodbye', status: 'missing_required', priority: 'must',
    why: 'The curriculum can open a conversation and can close an order, but it cannot end an encounter. "Bye." and "See you." are the other half of "Hi." and are assumed by every roleplay already written.',
    canDo: 'close_an_encounter',
    prerequisites: ['full_conversation'],
    vocabularyBudget: 4,
    newPatterns: ['Goodbye.', 'See you.'],
    reuseTargets: ['nice_to_meet', 'thank_service'] },

  { id: 'name_and_ask_about_things', status: 'missing_required', priority: 'should',
    why: 'Every later level needs a way to acquire vocabulary from the world. "What’s this?" / "It’s a…" is the smallest engine for that, and it also gives the café arc something to point at.',
    canDo: 'identify_things',
    prerequisites: ['express_preferences'],
    vocabularyBudget: 8,
    newPatterns: ['What’s this?', 'It’s a + noun'],
    reuseTargets: ['express_like', 'polite_request'] },

  { id: 'small_numbers_and_quantity', status: 'missing_required', priority: 'should',
    why: 'The café already asks for things and cannot ask for two of them. One to ten plus "How much is it?" is the minimum that makes the transaction the learner can already start actually finishable.',
    canDo: 'use_small_numbers',
    prerequisites: ['polite_request'],
    vocabularyBudget: 12,
    newPatterns: ['two + noun', 'How much is it?'],
    reuseTargets: ['polite_request', 'finish_order'] },

  /* ---- would help, would not be missed ---- */
  { id: 'say_your_age', status: 'optional', priority: 'optional',
    why: 'One sentence, and it rides on numbers the learner would already have.' },
  { id: 'introduce_another_person', status: 'optional', priority: 'optional',
    why: '"This is my friend." adds a third person to a curriculum that has only ever had two, which is a real jump in complexity for one sentence of value.' },
  { id: 'say_what_you_do', status: 'optional', priority: 'optional',
    why: '"I work." / "I study." is personal information rather than a routine, so it fits Pre-A1 — but nothing already taught depends on it.' },
  { id: 'here_and_there', status: 'optional', priority: 'optional',
    why: 'Useful in a café; not required by anything the learner can currently do.' },

  /* ---- real English, wrong level ---- */
  { id: 'daily_routines', status: 'defer_a1', why: 'a routine needs frequency and time expressions, which need the present simple as a system rather than as a phrase' },
  { id: 'talk_about_the_past', status: 'defer_a1', why: 'a second tense doubles every pattern already taught' },
  { id: 'describe_people_and_places', status: 'defer_a1', why: 'adjectives before a noun, plurals and "there is/are" — a grammar layer Pre-A1 deliberately avoids' },
  { id: 'give_directions', status: 'defer_a1', why: 'prepositions of place plus imperatives; "Where is…?" alone is optional Pre-A1, the answer is not' },
  { id: 'explain_a_reason', status: 'defer_a1', why: '"because" turns one clause into two' },
  { id: 'tell_the_time', status: 'defer_a1', why: 'numbers beyond ten, plus its own question form' },
]

export const capabilitiesWithStatus = (status) => CAPABILITY_MAP.filter(c => c.status === status)

/*
 * What "Pre-A1 complete" means, derived from the map above rather than from a
 * count of episodes. A learner is ready for A1 when they can start, sustain
 * and survive a very short exchange — not when they have seen every screen.
 */
export const PRE_A1_EXIT_CRITERIA = {
  requiredCanDos: [
    'introduce_self', 'ask_name', 'ask_wellbeing', 'ask_origin',
    'full_conversation', 'express_preferences', 'express_needs',
    'polite_request', 'cafe_order',
    'ask_for_repair',        // not built yet — see CAPABILITY_MAP
    'close_an_encounter',    // not built yet
  ],
  /* every required can-do produced at least twice with no model answer on screen */
  independentEvidencePerCanDo: 2,
  /* nothing required may be sitting in the "learning" state */
  noFragileRequiredSkills: true,
  /* the learner is not carrying a backlog of forgotten language */
  maxOverdueReviews: 3,
  /* the last long conversation was finished without help */
  lastConversationIndependent: true,
}

export const LAST_PRE_A1_CAPABILITY = 'small_numbers_and_quantity'
export const FIRST_A1_CAPABILITY = 'daily_routines'
