/*
 * storyPersonalization — the same skill, a different setting.
 *
 * A future A1 story should be able to happen in a café, at a station or before a
 * film without becoming a different exercise. This module is the contract that
 * makes that safe, and it is deliberately written before the first A1 episode
 * exists so that episode can be authored against it instead of inventing its own
 * rules.
 *
 * THE INVARIANT, and it is the whole file:
 *
 *   Personalisation may change what the story is ABOUT.
 *   It may never change what the learner has to DO.
 *
 * So `canDoId`, every step's `evalKind`, the expected patterns, the required
 * evidence, the difficulty, the XP and which branch counts as correct are copied
 * through untouched and then checked. A template that tries to personalise one of
 * them is refused rather than obeyed: a story that grades differently depending
 * on the learner's hobbies is not personalisation, it is a broken assessment.
 *
 * Pre-A1 is frozen and no Pre-A1 story is touched by any of this. Nothing here
 * runs unless a template opts in by declaring a mode.
 */
import { describeTopic } from './topicSelection.js'
import { isCountableThing, thingById } from './semanticContext.js'

/*
 * How much of the setting a template lets a topic move.
 *
 *   none    the situation is the lesson. A story about buying a train ticket
 *           stays about buying a train ticket.
 *   light   safe details only — the object being asked for, a background noun,
 *           the thing the conversation mentions.
 *   themed  the situation itself has a controlled variant per topic, declared by
 *           the template. The steps, the intents and the evidence are the same
 *           story; the framing is not.
 */
export const PERSONALIZATION_MODES = ['none', 'light', 'themed']

/* The slot kinds a template may declare, and what each will accept. */
export const SLOT_TYPES = {
  /* a thing that can be pointed at, asked for and counted: THINGS ids only */
  object: (topic) => (topic.object && isCountableThing(topic.object) ? thingById(topic.object).singular : null),
  /* something you can propose doing: gerund/verb phrase from the catalogue */
  activity: (topic) => topic.activity || null,
  /* what the conversation is about — never graded, never a sentence on its own */
  topic: (topic) => topic.topic || null,
  /* the noun in "I like ___" — always present, always classifiable */
  subject: (topic) => topic.targetNoun || null,
}

export const KNOWN_SLOT_TYPES = Object.keys(SLOT_TYPES)

/* What may never differ between two personalisations of the same story. */
export const INVARIANT_FIELDS = ['canDoId', 'intent', 'evidence', 'xp', 'difficulty', 'correctBranch']

export class StoryPersonalizationError extends Error {
  constructor(reason, detail) {
    super(`story personalization refused: ${reason}${detail ? ` (${detail})` : ''}`)
    this.name = 'StoryPersonalizationError'
    this.reason = reason
  }
}

/*
 * Is this template allowed to be personalised at all, and does it say how?
 *
 * Returns a list of problems, empty when the template is well formed — the same
 * shape the authoring check uses, so a future episode's template can be validated
 * without running it.
 */
export function templateProblems(template) {
  const problems = []
  if (!template || typeof template !== 'object') return ['a template must be an object']
  const mode = template.personalizationMode
  if (!PERSONALIZATION_MODES.includes(mode)) {
    problems.push(`declares mode "${mode}", which is not one of ${PERSONALIZATION_MODES.join(' | ')}`)
  }
  for (const field of INVARIANT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(template.slots || {}, field)) {
      problems.push(`tries to personalise "${field}", which decides what the learner must do`)
    }
  }
  for (const [name, type] of Object.entries(template.slots || {})) {
    if (!KNOWN_SLOT_TYPES.includes(type)) {
      problems.push(`slot "${name}" wants "${type}", which is not a known slot type`)
    }
  }
  if (mode === 'none' && Object.keys(template.slots || {}).length) {
    problems.push('declares mode "none" and then declares slots')
  }
  if (mode === 'themed' && !template.themes) {
    problems.push('declares mode "themed" without any themed variants')
  }
  return problems
}

/*
 * Fill a template's declared slots from a topic.
 *
 * A slot the topic cannot supply falls back to the template's own
 * `neutralFallback` for that slot. If the template has no fallback for it, the
 * whole personalisation is declined and the neutral story is returned — never a
 * half-personalised sentence with a hole in it.
 *
 * Returns { story, applied }, where `applied` is what actually changed. `applied`
 * is for tests and debugging; nothing sends it to a provider or shows it to a
 * learner.
 */
export function personalizeStory(template, topic, { seed = '' } = {}) {
  const problems = templateProblems(template)
  if (problems.length) throw new StoryPersonalizationError('invalid_template', problems[0])

  const resolvedTopic = topic && typeof topic === 'object' ? topic : describeTopic(null, { seed })
  const invariants = Object.fromEntries(INVARIANT_FIELDS
    .filter(field => Object.prototype.hasOwnProperty.call(template, field))
    .map(field => [field, template[field]]))

  const neutral = { ...template.neutralFallback }
  if (template.personalizationMode === 'none' || !resolvedTopic.interestId) {
    return { story: { ...invariants, ...neutral, personalizedWith: null }, applied: {} }
  }

  const applied = {}
  for (const [name, type] of Object.entries(template.slots || {})) {
    const value = SLOT_TYPES[type](resolvedTopic)
    if (value == null) {
      /*
       * The interest has nothing of this type. That is normal — most interests
       * have no countable object — so the template's neutral value is used, and
       * if it has none the story simply stays neutral.
       */
      if (!Object.prototype.hasOwnProperty.call(neutral, name)) {
        return { story: { ...invariants, ...neutral, personalizedWith: null }, applied: {} }
      }
      continue
    }
    applied[name] = value
  }

  const theme = template.personalizationMode === 'themed'
    ? (template.themes?.[resolvedTopic.interestId] || null)
    : null

  return {
    story: {
      ...invariants,
      ...neutral,
      ...applied,
      ...(theme || {}),
      personalizedWith: resolvedTopic.interestId,
    },
    applied: theme ? { ...applied, theme: resolvedTopic.interestId } : applied,
  }
}

/*
 * Did personalisation keep its promise?
 *
 * Compares two personalisations of the same template and reports any invariant
 * that moved. Used by the checks; also the honest way for a future author to
 * prove their episode still teaches the same thing to everybody.
 */
export function invariantDrift(storyA, storyB) {
  return INVARIANT_FIELDS.filter((field) => {
    const a = JSON.stringify(storyA?.[field] ?? null)
    const b = JSON.stringify(storyB?.[field] ?? null)
    return a !== b
  })
}
