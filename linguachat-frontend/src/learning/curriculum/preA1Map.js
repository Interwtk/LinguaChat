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
 *
 * What it reads them THROUGH is the generated skeleton: the same episodes with
 * every rendered word left out. Nothing here has ever needed what Lingua says,
 * only what each step does — and importing the definitions to find out meant
 * the whole level travelled in the chunk a learner downloads before they have
 * opened anything. The skeleton is regenerated and compared by
 * `check-curriculum-loading`, so it cannot drift from the curriculum.
 */
import { SKELETON_BY_ID } from './preA1Skeleton.generated.js'
import { PRE_A1, episodesOfLevel } from './levels.js'

/*
 * Pre-A1's own episodes. This registry describes one level, so it filters by it:
 * with A1 present in the skeleton, an unfiltered walk would report another
 * level's capabilities as Pre-A1's coverage.
 */
const ARC = episodesOfLevel(PRE_A1)

/* the capabilities the seventeen episodes teach, in curriculum order */
export const ARC_CAN_DOS = [...new Set(ARC.map(ep => ep.canDoId).filter(Boolean))]
const getEpisode = (id) => SKELETON_BY_ID[id] || null
const ARCS = [...new Set(ARC.map(ep => ep.arc))]
const episodesInArc = (arc) => ARC.filter(ep => ep.arc === arc)

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
const innerTurns = (step) => step?.turns || []

/* Every intent an episode actually evaluates, story turns included. */
export const intentsForEpisode = (id) =>
  [...new Set((getEpisode(id)?.steps || [])
    .flatMap(s => [s.evalKind, ...innerTurns(s).map(t => t.evalKind)])
    .filter(Boolean))]

/*
 * The same walk as `intentsForEpisode`, but keeping each step's `subtype`
 * alongside its intent rather than collapsing to a bare, deduplicated intent
 * list. Needed because B2's capstone reuses one intent id for several
 * different can-dos, distinguished only by `subtype`
 * (`curriculum/levelMaps.js`'s `canDoForIntent(intent, subtype)`) — a caller
 * that only had the deduplicated intent, like `scaffolding.js`'s own
 * novelty check, could not tell "this episode's `shift_register` step is
 * really about `sustain_a_multi_topic_conversation`" from "...is really
 * about `adjust_register_to_context`", and would silently credit/measure
 * novelty against the wrong capability. Deduplicated by (intent, subtype)
 * pair, so a level with no `subtype` field at all produces exactly the same
 * set `intentsForEpisode` does (each pair's subtype is simply `null`).
 */
export const intentSubtypesForEpisode = (id) => {
  const seen = new Set()
  const pairs = []
  const consider = (evalKind, subtype = null) => {
    if (!evalKind) return
    const key = `${evalKind}|${subtype || ''}`
    if (seen.has(key)) return
    seen.add(key)
    pairs.push({ intent: evalKind, subtype: subtype || null })
  }
  for (const s of (getEpisode(id)?.steps || [])) {
    consider(s.evalKind, s.subtype)
    for (const t of innerTurns(s)) consider(t.evalKind, t.subtype)
  }
  return pairs
}

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
/*
 * The intents that make up a capability.
 *
 * Most capabilities are one function and need no entry here. Two are not:
 * identifying a thing is asking AND answering, and a learner who has only ever
 * asked has not got the capability. Declared rather than inferred, because
 * "which functions is this skill made of" is a pedagogical judgement.
 */
export const CAN_DO_INTENTS = {
  identify_things: ['ask_what_thing', 'identify_thing'],
}

export const intentsOfCanDo = (canDoId) =>
  CAN_DO_INTENTS[canDoId] || (CAN_DO_INTENT[canDoId] ? [CAN_DO_INTENT[canDoId]] : [])

/*
 * The language items a capability is actually made of: what the learner
 * PRODUCES in the turns that practise it, with anything only ever heard or
 * carried inside a larger phrase left out.
 *
 * Derived from the steps, so it cannot drift from the episodes the way a
 * hand-kept list would.
 */
export function productiveItemsOf(canDoId) {
  const intents = intentsOfCanDo(canDoId)
  if (!intents.length) return []
  const out = new Set()
  const collect = (step) => {
    if (!intents.includes(step.evalKind)) return
    for (const id of step.itemIds || []) {
      if (RECEPTIVE_ITEMS.includes(id) || INCIDENTAL_ITEMS.includes(id)) continue
      out.add(id)
    }
  }
  for (const ep of ARC.filter(e => e.canDoId === canDoId)) {
    for (const step of ep.steps || []) {
      if (step.type === 'free_reply' || step.type === 'recall') { collect(step); continue }
      /*
       * A hosted story's reply turns are produced sentences like any other, and
       * leaving them out made `close_an_encounter` blind to "Bye." — which the
       * learner says twice, inside the story and again at the counter.
       */
      if (step.type === 'mini_story') {
        for (const turn of innerTurns(step)) {
          if (turn.kind === 'reply') collect(turn)
        }
      }
    }
  }
  return [...out]
}

/*
 * The language a practice turn of this intent always produces.
 *
 * A session block asks for ONE sentence, so it must record the items that
 * sentence actually contains — not every item the capability touches. Taking
 * what is COMMON to every step of the intent gives exactly the frame: every
 * "It's a ___." practice carries `its_a_pattern`, while the noun changes from
 * step to step and belongs to whichever step asked for it.
 *
 * Falls back to the union when steps share nothing, so an intent is never left
 * recording nothing at all.
 */
/*
 * The productive language the level cannot be left without.
 *
 * Readiness already worked this out privately in order to decide which overdue
 * reviews matter; the daily planner needs the same answer to decide which
 * overdue review to offer first, and two copies of it would drift.
 */
export function requiredLevelItems() {
  return [...new Set(PRE_A1_EXIT_CRITERIA.requiredCanDos.flatMap(id => productiveItemsOf(id)))]
}

export function coreItemsOfIntent(intent) {
  if (!intent) return []
  const perStep = []
  for (const ep of ARC) {
    for (const step of ep.steps || []) {
      const turns = step.type === 'mini_story' ? innerTurns(step) : [step]
      for (const turn of turns) {
        if (turn.evalKind !== intent) continue
        if (turn.type !== 'free_reply' && turn.type !== 'recall' && turn.kind !== 'reply') continue
        const ids = (turn.itemIds || []).filter(id => !RECEPTIVE_ITEMS.includes(id) && !INCIDENTAL_ITEMS.includes(id))
        if (ids.length) perStep.push(ids)
      }
    }
  }
  if (!perStep.length) return []
  const shared = perStep.reduce((acc, ids) => acc.filter(id => ids.includes(id)))
  if (shared.length) return shared
  return [...new Set(perStep.flat())]
}

/*
 * The episodes that are a conversation rather than a set of exercises.
 *
 * Derived from shape, not from a list: several productive turns in a row and
 * several different things to do in them. The arc finales qualify; an episode
 * that drills one sentence eight times does not, however long it is.
 */
export const INTEGRATED_MIN_TURNS = 5
export const INTEGRATED_MIN_INTENTS = 4

/* The steps a learner actually walks, with a hosted story opened out. */
function walkableSteps(ep) {
  return (ep.steps || []).flatMap((step) => {
    if (step.type !== 'mini_story') return [step]
    return innerTurns(step).map(turn => (turn.kind === 'reply'
      ? { type: 'free_reply', evalKind: turn.evalKind, inStory: true }
      : turn.kind === 'choose' ? { type: 'choice', inStory: true } : { type: 'scene', inStory: true }))
  })
}

/* The longest unbroken run of turns the learner speaks in, and how varied it is. */
export function longestExchange(episodeId) {
  const ep = getEpisode(episodeId)
  if (!ep) return { turns: 0, intents: 0 }
  let run = 0
  let intents = new Set()
  let best = { turns: 0, intents: 0 }
  for (const step of walkableSteps(ep)) {
    if (step.type === 'free_reply' || step.type === 'recall') {
      run += 1
      if (step.evalKind) intents.add(step.evalKind)
      if (run > best.turns || (run === best.turns && intents.size > best.intents)) {
        best = { turns: run, intents: intents.size }
      }
    } else if (step.type === 'scene' || step.inStory) {
      /* a scene sets up the next turn, and a choice inside a story IS a turn */
    } else {
      run = 0
      intents = new Set()
    }
  }
  return best
}

export function integratedEpisodes() {
  return ARC.filter((ep) => {
    const { turns, intents } = longestExchange(ep.id)
    return turns >= INTEGRATED_MIN_TURNS && intents >= INTEGRATED_MIN_INTENTS
  }).map(ep => ep.id)
}

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
  /*
   * `identify_things` covers two functions — asking and answering — and the
   * intent named here is the one coverage and the planner use. The evidence a
   * learner needs for it is declared separately, below, precisely so that
   * asking "What's this?" once cannot stand in for never having identified
   * anything.
   */
  identify_things: 'identify_thing',
  use_small_numbers: 'use_quantity',
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
/*
 * `how_many` joins these deliberately: the learner has to UNDERSTAND the
 * question to answer it, and Pre-A1 never needs to ask it. Declaring it here is
 * what stops the Garden from claiming it as something they can say.
 */
export const RECEPTIVE_ITEMS = ['hello', 'here_you_are', 'anything_else', 'how_many']

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
    /*
     * The placeholder names, extracted from the episode's own text when the
     * skeleton was generated. Same answer as reading the sentences here, without
     * the sentences having to be in the room.
     */
    for (const name of s.placeholders || []) slots.add(name)
    if (s.captureFact) slots.add(`fact:${s.captureFact}`)
    if (s.contextIntent) slots.add('semantic')
  }
  return [...slots]
}

export const isPersonalised = (episodeId) => personalisesOf(episodeId).length > 0
