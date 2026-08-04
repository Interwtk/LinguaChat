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
import { getStory, storyTurns } from '../engine/miniStory.js'

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

/*
 * The turns hidden inside a step. A `mini_story` step is a whole conversation:
 * it evaluates intents and records language items that appear nowhere in the
 * step itself. Reading only `step.evalKind` would leave the registry blind to
 * everything episode 15's story practises — exactly the kind of inert
 * metadata this project keeps having to dig back out.
 */
const innerTurns = (step) =>
  (step?.type === 'mini_story' ? storyTurns(getStory(step.storyObjective)) : [])

/* Every intent an episode actually evaluates, story turns included. */
export const intentsForEpisode = (id) =>
  [...new Set((getEpisode(id)?.steps || [])
    .flatMap(s => [s.evalKind, ...innerTurns(s).map(t => t.evalKind)])
    .filter(Boolean))]

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
      || (['word_order', 'fill_blank', 'choice'].includes(s.type) && s.itemId === itemId)
      // a story's reply turn is a produced sentence like any other
      || innerTurns(s).some(t => t.kind === 'reply' && (t.itemIds || []).includes(itemId)))
    if (produces) out.push(ep.id)
  }
  return out
}

/*
 * Where a can-do is first earned, where it is deliberately reinforced, and
 * everywhere its intent comes back.
 *
 * A capability can need more than one episode — repair has three strategies and
 * two episodes teaching them — without becoming two capabilities. The episode
 * that owns it is the one that does not declare `reinforces`, so coverage still
 * has exactly one answer for "where is this taught".
 */
export function canDoCoverage(canDoId) {
  const primary = ARC.find(e => e.canDoId === canDoId && !e.reinforces)
  if (!primary) return null
  const intent = CAN_DO_INTENT[canDoId] || null
  const reinforcedIn = ARC.filter(e => e.canDoId === canDoId && e.reinforces).map(e => e.id)
  const reusedIn = intent ? ARC.filter(e => e.id !== primary.id && intentsForEpisode(e.id).includes(intent)).map(e => e.id) : []
  return { canDoId, intent, introducedIn: primary.id, arc: primary.arc || 'greetings', reinforcedIn, reusedIn }
}

/*
 * The skills an episode genuinely leans on, as opposed to the episode that
 * merely precedes it. Ordering a coffee is the curricular gate before the
 * repair arc; it is not what makes repair possible, and telling the support
 * engine otherwise would be a lie it acts on.
 */
export function skillPrerequisitesOf(episodeId) {
  const ep = getEpisode(episodeId)
  if (!ep) return []
  if (Array.isArray(ep.skillPrerequisites)) return ep.skillPrerequisites
  return (ep.prerequisites || []).map(id => getEpisode(id)?.canDoId).filter(Boolean)
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
  ask_for_repair: 'repair_request',
  close_an_encounter: 'close_encounter',
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
  /*
   * Guided only, and it will stay guided while the arc says "Please speak
   * slowly." rather than "Can you speak slowly, please?": the frame is filled in
   * once, with the verb supplied. Claiming more would be the overstatement this
   * table exists to catch.
   */
  repair_pattern: { term: 'Can you + verb + please?', reaches: 'guided_production', trackedAs: 'repair_pattern' },
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
  { id: 'answer_a_yes_no_preference', status: 'covered', covers: { intent: 'yes_no_preference' },
    note: 'episode 7, then episode 13 and inside episode 15’s story — answering a yes/no question is now what a repaired conversation leads back into' },
  { id: 'say_what_you_need', status: 'fragile', covers: { intent: 'express_need' },
    note: 'produced only in episode 8; the café practises wanting, never needing' },
  { id: 'decline_an_offer', status: 'covered', covers: { intent: 'decline_offer' },
    note: 'episode 8, then required again in episode 15 seven episodes later' },
  { id: 'bounce_a_question_back', status: 'covered', covers: { intent: 'reciprocal_question' },
    note: 'episodes 4 and 5, then produced again in episode 14 after a nine-episode gap' },

  /* ---- built by the fifth arc ---- */
  { id: 'repair_understanding', status: 'covered', covers: { canDo: 'ask_for_repair' },
    note: 'episodes 13 and 14; three strategies under one function, and every repair leads back into the conversation' },
  /*
   * Taught, and honestly not yet safe. Closing an encounter is produced twice
   * inside episode 15 — the story’s last turn and the variation after it — and
   * then never again, because episode 15 is where the curriculum currently ends.
   * That is the definition of `needs_reuse`, and calling it covered would be the
   * same optimism this map exists to prevent. The next arc has to ASK for a
   * goodbye rather than teach one.
   */
  { id: 'say_thank_you_and_goodbye', status: 'needs_reuse',
    covers: { canDo: 'close_an_encounter', intent: 'close_encounter' },
    note: 'episode 15 only; the first capability arc 6 should require rather than introduce' },

  /* ---- Pre-A1 is still not finished without these ---- */

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
    'ask_for_repair', 'close_an_encounter',   // arc 5
    /*
     * Still not built. These two are the reason finishing episode 15 does not
     * mean "ready for A1": the audit declared both required, and both are
     * waiting in CAPABILITY_MAP as `missing_required`. They stay on this list
     * precisely so the criteria keep failing while they are missing.
     */
    'identify_things', 'use_small_numbers',
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

/* ------------------------------------------------- derived episode metadata -*/

/*
 * `targetItems`, `reviewItems` and `personalized` used to be declared on every
 * episode and read by nothing. Three hand-maintained lists describing content
 * that the steps already state outright is exactly how a declared curriculum
 * drifts from the executed one — and it did.
 *
 * They are gone from the episode data. Each is now DERIVED from the steps, so
 * the answer cannot be stale, and each has a real consumer:
 *
 *   targetsOf()      what the episode teaches for the first time — used by the
 *                    scaffolding engine to decide whether a skill is new
 *   reviewsOf()      what it deliberately brings back, read from its own
 *                    review steps
 *   personalisesOf() which slots it fills from the learner, taken from the
 *                    placeholders and captures actually present
 */

/* Every item the episode asks the learner to produce or recognise. */
export function itemsOf(episodeId) {
  const ep = getEpisode(episodeId)
  const out = new Set()
  for (const s of ep?.steps || []) {
    ;(s.itemIds || []).forEach(i => out.add(i))
    if (s.itemId) out.add(s.itemId)
    ;(s.meaningItems || []).forEach(i => out.add(i))
  }
  return [...out]
}

/*
 * What this episode teaches first. An item belongs to the first episode in
 * curriculum order that grants it, so "target" means "new here" rather than
 * "mentioned here".
 */
export function targetsOf(episodeId) {
  const ep = getEpisode(episodeId)
  if (!ep) return []
  return (ep.gardenItems || []).filter(id => {
    const first = ARC.find(e => (e.gardenItems || []).includes(id))
    return first && first.id === ep.id
  })
}

/* What the episode brings back on purpose: the items on its review steps. */
export function reviewsOf(episodeId) {
  const ep = getEpisode(episodeId)
  const out = new Set()
  for (const s of ep?.steps || []) {
    if (!s.review) continue
    ;(s.itemIds || []).forEach(i => out.add(i))
    if (s.itemId) out.add(s.itemId)
  }
  return [...out]
}

/*
 * Which parts of the learner this episode actually uses. Read from the
 * placeholders in its own text and the facts it captures — never a boolean
 * somebody remembered to set. semanticContext still decides whether a value
 * may fill a slot; this only reports which slots exist.
 */
export function personalisesOf(episodeId) {
  const ep = getEpisode(episodeId)
  const slots = new Set()
  for (const s of ep?.steps || []) {
    const strings = [s.promptEn, s.sceneEn, s.suggestionEn, s.target, s.response]
      .concat((s.options || []).map(o => o.textEn))
      .concat(s.tokens || [])
      .filter(Boolean)
      .join(' ')
    for (const m of strings.matchAll(/\{(\w+)\}/g)) slots.add(m[1])
    if (s.captureFact) slots.add(`fact:${s.captureFact}`)
    if (s.contextIntent) slots.add('semantic')
  }
  return [...slots]
}

export const isPersonalised = (episodeId) => personalisesOf(episodeId).length > 0
