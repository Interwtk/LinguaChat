/*
 * transform — turns a course's authored episodes into the step shape
 * EpisodeShell already plays.
 *
 * The English curriculum stores its copy as i18n keys in eight languages and
 * its target English in fields named `promptEn`, `suggestionEn`, `textEn`,
 * `sceneEn`. Those names are historical: to the player they mean "the
 * target-language line". A new course is authored readably instead —
 * explanations inline, keyed by auxiliary language, target lines in plain
 * fields — and this module does the mechanical part:
 *
 *   - every auxiliary-language string becomes a generated key
 *     (`es.<episode>.<step>.<field>`) in the course's copy table;
 *   - target fields are renamed to the player's names;
 *   - item ids are namespaced with the course prefix;
 *   - the evaluator context stays on `courseContext`, apart from the English
 *     engine's own semantic fields, so neither can read the other's.
 *
 * It also validates what it builds (`validateCourseEpisode`), so the checks
 * and the runtime agree on what a well-formed course step is.
 */

const COPY_FIELDS = { title: 'titleKey', body: 'bodyKey', cta: 'ctaKey', instruction: 'instructionKey', hint: 'hintKey', explain: 'explainKey', placeholder: 'placeholderKey' }
const TARGET_FIELDS = { prompt: 'promptEn', scene: 'sceneEn', suggestion: 'suggestionEn' }
const PASS_THROUGH = ['type', 'target', 'response', 'tokens', 'before', 'after', 'expects', 'alternatives', 'speaker', 'variation', 'review', 'showGoal', 'mood', 'allValid']

const textIn = (value, aux) => (value && typeof value === 'object' ? value[aux] : value)

/*
 * Options are authored with the right answer first, which is easy to read and
 * easy to game: a learner who always taps the top one never has to understand
 * anything. So the built step rotates them by a stable hash of its position —
 * the same order on every reload, a different place from step to step.
 */
function placeOptions(options, seed) {
  if (options.length < 2) return options
  let h = 2166136261
  for (const ch of seed) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) }
  const shift = (h >>> 0) % options.length
  return [...options.slice(shift), ...options.slice(0, shift)]
}

export function buildCourseEpisode({ courseId, meta, authored, aux, copy }) {
  const scope = (id) => `${courseId}:${id}`
  const steps = authored.steps.map((step, index) => {
    const out = {}
    for (const field of PASS_THROUGH) if (step[field] !== undefined) out[field] = step[field]
    for (const [field, keyField] of Object.entries(COPY_FIELDS)) {
      if (step[field] === undefined) continue
      const key = `${courseId}.${authored.id}.${index}.${field}`
      copy[key] = textIn(step[field], aux)
      out[keyField] = key
    }
    for (const field of ['titleKey', 'bodyKey', 'ctaKey', 'canDoNameKey', 'placeholderKey']) if (step[field]) out[field] = step[field]
    for (const [field, shellField] of Object.entries(TARGET_FIELDS)) if (step[field] !== undefined) out[shellField] = step[field]
    if (step.options) {
      out.options = placeOptions(step.options, `${authored.id}:${index}`).map((option, i) => {
        if (option.text !== undefined) return { textEn: option.text, ...(option.correct ? { correct: true } : {}) }
        const key = `${courseId}.${authored.id}.${index}.opt${i}`
        copy[key] = textIn(option.label, aux)
        return { key, ...(option.correct ? { correct: true } : {}) }
      })
    }
    if (step.item) out.itemId = scope(step.item)
    if (step.items) out.itemIds = step.items.map(scope)
    if (step.meaning) out.meaningItems = step.meaning.map(scope)
    if (step.eval) out.evalKind = step.eval
    if (step.ctx) out.courseContext = { ...step.ctx }
    if (step.type === 'completion') out.canDoNameKey = meta.canDoNameKey
    return out
  })
  return { ...meta, courseId, steps }
}

const STEP_TYPES = new Set(['scene', 'model', 'comprehension', 'word_order', 'fill_blank', 'choice', 'free_reply', 'recall', 'completion'])

/* Problems with one built episode, as readable strings (empty when sound). */
export function validateCourseEpisode(episode, { copy, evalKinds, vocabIds, courseId }) {
  const problems = []
  const say = (i, msg) => problems.push(`${episode.id} step ${i}: ${msg}`)
  if (!episode.steps.length) problems.push(`${episode.id}: no steps`)
  if (episode.steps[episode.steps.length - 1]?.type !== 'completion') problems.push(`${episode.id}: must end with completion`)
  episode.steps.forEach((step, i) => {
    if (!STEP_TYPES.has(step.type)) say(i, `unknown type ${step.type}`)
    for (const keyField of ['titleKey', 'bodyKey', 'instructionKey', 'hintKey', 'explainKey', 'placeholderKey']) {
      const key = step[keyField]
      if (key && key.startsWith(`${courseId}.`) && !copy[key]) say(i, `missing copy ${key}`)
    }
    if (['comprehension', 'word_order', 'fill_blank', 'choice', 'free_reply', 'recall'].includes(step.type) && !step.instructionKey) say(i, 'no instruction')
    if ((step.type === 'free_reply' || step.type === 'recall') && !evalKinds.includes(step.evalKind)) say(i, `unknown evalKind ${step.evalKind}`)
    if (step.type === 'free_reply' && !step.suggestionEn) say(i, 'free reply without a model answer')
    if ((step.type === 'comprehension' || step.type === 'choice')) {
      if (!step.options?.length) say(i, 'no options')
      else if (!step.options.some(o => o.correct)) say(i, 'no correct option')
      for (const o of step.options || []) if (o.key && !copy[o.key]) say(i, `missing option copy ${o.key}`)
    }
    if (step.type === 'word_order' && !(step.tokens?.length >= 2)) say(i, 'word order needs tokens')
    if (step.type === 'fill_blank' && !step.expects) say(i, 'gap without an expected answer')
    for (const id of [...(step.itemIds || []), ...(step.meaningItems || []), ...(step.itemId ? [step.itemId] : [])]) {
      if (!vocabIds.has(id)) say(i, `unknown item ${id}`)
    }
  })
  return problems
}
