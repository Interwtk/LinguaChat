/*
 * formatChoice — choosing BETWEEN ACTIVITIES THAT TEACH THE SAME THING.
 *
 * The rule this module exists to protect:
 *
 *     Preference changes variety. Pedagogical need changes priority.
 *
 * So a preference may decide whether a learner practises "I want water" by
 * building it from words or by filling a gap — it may never decide that they
 * skip building sentences, that a needed skill is dropped because it is hard,
 * or that everything becomes the one activity they liked once.
 *
 * Nothing here is random: given the same learner, the same objective and the
 * same seed, the same format comes out, so a plan can be reproduced and tested.
 */
import { ACTIVITY_FORMATS, activityPreference, CONFIDENT_PREFERENCE, formatOverused } from './learnerModel.js'
import { seedFrom } from './variation.js'

/*
 * Small, deliberately narrow equivalence groups. Two formats are only in the
 * same group when they exercise the same skill on the same material.
 */
export const EQUIVALENCE_GROUPS = {
  // building a target pattern with support
  guided_practice: ['word_order', 'fill_blank', 'guided_reply'],
  // recognising meaning
  comprehension: ['comprehension', 'choice'],
  // using the pattern again in context
  reuse: ['roleplay', 'guided_reply', 'mini_story'],
  // producing it from memory, unaided
  recall: ['recall', 'free_reply'],
}

export const GROUP_OF_FORMAT = (() => {
  const map = {}
  for (const [group, formats] of Object.entries(EQUIVALENCE_GROUPS)) {
    for (const f of formats) (map[f] = map[f] || []).push(group)
  }
  return map
})()

export function equivalentFormats(format) {
  const groups = GROUP_OF_FORMAT[format] || []
  const out = []
  for (const g of groups) for (const f of EQUIVALENCE_GROUPS[g]) if (!out.includes(f)) out.push(f)
  return out.length ? out : [format]
}

// True only when both formats practise the same skill on the same material.
export function areEquivalent(a, b) {
  if (a === b) return true
  return (GROUP_OF_FORMAT[a] || []).some(g => EQUIVALENCE_GROUPS[g].includes(b))
}

/*
 * Formats that ask the learner to produce language with no model in front of
 * them. Offering these while support is still high is not "variety", it is
 * setting someone up to fail, so high scaffolding filters them out.
 */
const UNSUPPORTED_AT_HIGH_SCAFFOLD = ['free_reply', 'recall', 'roleplay']

/*
 * The mirror image: formats that hand the learner the words. They are a safety
 * net for someone who needs one, not a "variety" option — offering them to a
 * learner who no longer needs support quietly makes recall easier than it is
 * supposed to be, and recall is where memory is actually built.
 */
const SUPPORT_ONLY = ['guided_reply']

// Quick sessions stay calm: one main goal, no experimenting with formats.
const ADVENTUROUS_MODES = ['standard', 'deep']

/*
 * Pick the activity format for one block.
 *
 * Order of consideration — need first, taste last:
 *   1. pedagogical need   a format the learner demonstrably has to practise wins
 *   2. compatibility      only formats that teach this objective survive
 *   3. scaffolding        no unsupported production while support is high
 *   4. recent repetition  a format used twice lately steps aside
 *   5. preference         only when confidence is high enough to mean something
 *   6. duration           quick sessions do not experiment
 *   7. seed               a stable tie-break, never Math.random()
 */
export function selectEquivalentActivityFormat({
  objective = null,
  requiredPractice = null,
  candidates = [],
  learnerModel = null,
  recentFormats = null,
  scaffold = 'medium',
  durationMode = 'standard',
  seed = '',
} = {}) {
  const pool = candidates.filter(f => ACTIVITY_FORMATS.includes(f))
  if (!pool.length) return null
  const model = learnerModel || { activityPreferences: {}, recentFormats: [] }
  if (recentFormats) model.recentFormats = recentFormats

  // 1. Pedagogical need beats everything, including a strong preference.
  if (requiredPractice && pool.includes(requiredPractice)) return requiredPractice

  // 2 + 3. Compatibility and scaffolding.
  const compatible = objective ? pool.filter(f => formatSupportsObjective(f, objective)) : pool
  let viable = compatible.length ? compatible : pool
  if (scaffold === 'high') {
    const supported = viable.filter(f => !UNSUPPORTED_AT_HIGH_SCAFFOLD.includes(f))
    if (supported.length) viable = supported
  } else {
    const earned = viable.filter(f => !SUPPORT_ONLY.includes(f))
    if (earned.length) viable = earned
  }
  if (viable.length === 1) return viable[0]

  // 4. Step away from a format that has just been repeated.
  const fresh = viable.filter(f => !formatOverused(model, f))
  if (fresh.length) viable = fresh

  // 6. A quick session keeps the caller's first (safest) choice.
  if (!ADVENTUROUS_MODES.includes(durationMode)) return viable[0]

  // 5. Preference, but only when we actually have evidence.
  const scored = viable.map((format, index) => {
    const { score, confidence } = activityPreference(model, format)
    const confident = score != null && confidence >= CONFIDENT_PREFERENCE
    return { format, index, confident, score: confident ? score : 0.5 }
  })
  const best = Math.max(...scored.map(s => s.score))
  const top = scored.filter(s => s.score === best)
  if (top.length === 1) return top[0].format

  // 7. Deterministic tie-break.
  return top[seedFrom(String(seed)) % top.length].format
}

/*
 * Which formats can carry which objective. A "no" here is a pedagogical
 * statement: you cannot practise producing a question by ticking a box.
 */
/*
 * `mini_story` is only offered where an actual story exists (see miniStory.js).
 * A long conversation objective is better served by roleplay than by a scene
 * that would have to be invented for it.
 */
const OBJECTIVE_FORMATS = {
  introduction: ['guided_reply', 'word_order', 'fill_blank', 'free_reply', 'recall', 'roleplay', 'mini_story'],
  ask_name: ['guided_reply', 'word_order', 'free_reply', 'recall', 'roleplay'],
  nice_to_meet: ['guided_reply', 'word_order', 'free_reply', 'recall', 'roleplay'],
  ask_wellbeing: ['guided_reply', 'word_order', 'free_reply', 'recall', 'roleplay'],
  // recognising a natural answer is fine for a reply; it is NOT a way to
  // practise producing a question, so ask_* never lists `choice`
  answer_wellbeing: ['guided_reply', 'word_order', 'fill_blank', 'free_reply', 'recall', 'roleplay', 'choice'],
  reciprocal_question: ['guided_reply', 'word_order', 'free_reply', 'recall'],
  ask_origin: ['guided_reply', 'word_order', 'free_reply', 'recall', 'roleplay'],
  answer_origin: ['guided_reply', 'word_order', 'fill_blank', 'free_reply', 'recall', 'roleplay'],
  express_like: ['guided_reply', 'word_order', 'fill_blank', 'free_reply', 'recall', 'roleplay', 'mini_story', 'choice'],
  express_dislike: ['guided_reply', 'word_order', 'fill_blank', 'free_reply', 'recall'],
  ask_preference: ['guided_reply', 'word_order', 'free_reply', 'recall', 'roleplay'],
  yes_no_preference: ['guided_reply', 'choice', 'free_reply', 'recall'],
  express_want: ['guided_reply', 'word_order', 'fill_blank', 'free_reply', 'recall', 'roleplay', 'mini_story', 'choice'],
  express_need: ['guided_reply', 'word_order', 'fill_blank', 'free_reply', 'recall', 'roleplay', 'choice'],
  ask_want: ['guided_reply', 'word_order', 'free_reply', 'recall', 'roleplay'],
  accept_offer: ['guided_reply', 'choice', 'free_reply', 'recall'],
  decline_offer: ['guided_reply', 'choice', 'free_reply', 'recall'],
  full_intro_conversation: ['roleplay', 'free_reply', 'recall'],
  simple_plan_conversation: ['roleplay', 'free_reply', 'recall'],
  // the cafe. A request is a question form, so it is never practised by
  // ticking a box; the short polite replies legitimately can be.
  polite_request: ['guided_reply', 'word_order', 'fill_blank', 'free_reply', 'recall', 'roleplay', 'mini_story'],
  thank_service: ['guided_reply', 'choice', 'free_reply', 'recall'],
  respond_anything_else: ['guided_reply', 'choice', 'free_reply', 'recall'],
  finish_order: ['guided_reply', 'word_order', 'choice', 'free_reply', 'recall'],
  cafe_order_conversation: ['roleplay', 'free_reply', 'recall'],
  /*
   * Repair. `mini_story` is deliberately absent: the repair story belongs to
   * episode 15, which hosts it, and a daily session should not hand out an
   * episode's scene as a two-minute block.
   */
  repair_request: ['guided_reply', 'word_order', 'fill_blank', 'free_reply', 'recall', 'roleplay', 'choice'],
  close_encounter: ['guided_reply', 'word_order', 'choice', 'free_reply', 'recall'],
  /*
   * Things and quantities. `mini_story` is absent from all three for the same
   * reason repair's is: the only story that exists belongs to episode 15.
   */
  ask_what_thing: ['guided_reply', 'word_order', 'free_reply', 'recall', 'roleplay', 'choice'],
  identify_thing: ['guided_reply', 'word_order', 'fill_blank', 'free_reply', 'recall', 'roleplay', 'choice'],
  use_quantity: ['guided_reply', 'choice', 'fill_blank', 'free_reply', 'recall', 'roleplay'],
}

export function formatSupportsObjective(format, objective) {
  const allowed = OBJECTIVE_FORMATS[objective]
  if (!allowed) return true          // unknown objective → never block a format
  return allowed.includes(format)
}

/*
 * Alternatives offered for a block, in the order the engine would default to.
 * `guided_reply` is always last-resort safe: the learner still produces the
 * target sentence, just with the words in front of them.
 */
export const BLOCK_CANDIDATES = {
  // recognising the phrase again is a legitimate way to bring one back
  review: ['guided_reply', 'word_order', 'fill_blank', 'choice'],
  targeted_retry: ['guided_reply', 'fill_blank', 'word_order'],
  recall: ['recall', 'free_reply', 'guided_reply'],
  extra_practice: ['roleplay', 'mini_story', 'guided_reply'],
}

/*
 * How much of a session a format really represents. This is not a score shown
 * to anyone — it only decides which activity is worth asking about at the end.
 * A three-word recall is not what the session was; a conversation is.
 */
const FORMAT_WEIGHT = {
  roleplay: 5, mini_story: 5, free_reply: 4,
  word_order: 3, fill_blank: 3, guided_reply: 3,
  comprehension: 2, choice: 2,
  recall: 1, review: 1,
}
// Below this, a format is too slight to be worth a question of its own.
const MIN_REPRESENTATIVE_WEIGHT = 2

/*
 * Which activity the closing question should be about.
 *
 * Asking about the first block was wrong: a session that opened with a
 * one-line review and then spent ten minutes in a roleplay was asking about
 * the review. This picks what the session actually WAS — weighted by how much
 * of it the format carried, restricted to what the learner really finished,
 * with a nudge towards an activity chosen for them by preference, and a stable
 * seed so the same session always asks the same thing.
 */
export function selectRepresentativeFormat({ blocks = [], completedFormats = [], adaptedFormats = [], durationMode = 'standard', seed = '' } = {}) {
  const completed = new Set(completedFormats.filter(Boolean))
  const adapted = new Set(adaptedFormats.filter(Boolean))
  const scored = []
  const seen = new Set()
  for (const block of blocks) {
    const format = block?.format
    if (!format || seen.has(format)) continue
    seen.add(format)
    // never ask about something that was skipped or left unfinished
    if (!completed.has(format)) continue
    let weight = FORMAT_WEIGHT[format] ?? 2
    // an activity picked FOR the learner is the one worth asking about
    if (adapted.has(format)) weight += 1
    if (block.type === 'extra_practice') weight += 1
    if (weight < MIN_REPRESENTATIVE_WEIGHT) continue
    scored.push({ format, weight })
  }
  if (!scored.length) return null
  const best = Math.max(...scored.map(s => s.weight))
  const top = scored.filter(s => s.weight === best)
  if (top.length === 1) return top[0].format
  return top[seedFrom(String(seed)) % top.length].format
}
