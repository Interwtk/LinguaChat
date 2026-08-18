/*
 * build-curriculum-skeleton — the shape of the curriculum, without its words.
 *
 * The planner, the readiness rules and Home all need to know things ABOUT the
 * curriculum: which episode teaches what, which language a capability produces,
 * which episodes are real conversations, what is unlocked. None of them need a
 * single line of what Lingua actually says. But because every one of those
 * answers was derived by walking the episode definitions, asking any of them
 * pulled all seventeen episodes — prompts, scenes, model answers, stories — into
 * the chunk every learner downloads before they see anything at all.
 *
 * So the structure is extracted here and written out as a skeleton: step types,
 * evaluation intents, item ids, keys, prerequisites, hosted-story turns opened
 * out. Everything a derivation reads, nothing a screen renders.
 *
 * The episode definitions stay the single source of truth. This file is
 * GENERATED from them, and `check-curriculum-loading` regenerates it and fails
 * if the committed copy differs — so the skeleton cannot quietly drift from the
 * curriculum it describes.
 *
 *   npm run build:skeleton
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs'

import { ARC } from '../src/learning/episodes/index.js'
/*
 * A1's arcs are imported SEPARATELY, one per arc, and that separation is the
 * point: the metadata of every level belongs in one skeleton, while the content
 * of each arc must stay in its own chunk. If Pre-A1's content module imported
 * A1's, loading one level would download the other.
 */
import { A1_ARC1 } from '../src/learning/episodes/a1Arc1.js'
import { A1_ARC2 } from '../src/learning/episodes/a1Arc2.js'
import { A1_ARC3 } from '../src/learning/episodes/a1Arc3.js'
import { A1_ARC4 } from '../src/learning/episodes/a1Arc4.js'
import { A1_ARC5 } from '../src/learning/episodes/a1Arc5.js'
import { getStory, storyTurns } from '../src/learning/engine/miniStory.js'

const OUT = 'src/learning/curriculum/preA1Skeleton.generated.js'

/* The step fields every derivation reads — and only those. */
const STEP_FIELDS = ['type', 'evalKind', 'itemId', 'itemIds', 'meaningItems', 'review', 'branchOn',
  'captureFact', 'contextIntent', 'storyObjective', 'variation', 'format', 'personalises',
  /* subtypes: the payload a step carries so one intent can cover several variants */
  'thingId', 'quantityForm', 'repairKind', 'timeForm', 'count']

/*
 * The one place where the English is an INPUT to a derivation rather than
 * something to render: which parts of the learner an episode uses is read from
 * the placeholders in its own text. The names are extracted here and the
 * sentences stay behind, so `personalisesOf` still answers from the episodes.
 */
const PROSE_FIELDS = ['promptEn', 'sceneEn', 'suggestionEn', 'target', 'response']

const placeholdersOf = (step) => {
  const text = [
    ...PROSE_FIELDS.map(f => step[f]),
    ...(step.options || []).map(o => o.textEn),
    ...(step.tokens || []),
  ].filter(Boolean).join(' ')
  return [...new Set([...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]))]
}

/* A story turn, reduced the same way. */
const TURN_FIELDS = ['kind', 'evalKind', 'itemIds', 'thingId', 'quantityForm', 'repairKind']

const pick = (source, fields) => {
  const out = {}
  for (const field of fields) {
    const value = source?.[field]
    if (value === undefined || value === null) continue
    if (Array.isArray(value) && !value.length) continue
    out[field] = value
  }
  return out
}

const skeletonStep = (step) => {
  const out = pick(step, STEP_FIELDS)
  const placeholders = placeholdersOf(step)
  if (placeholders.length) out.placeholders = placeholders
  if (step.type === 'mini_story') {
    /*
     * A hosted story is a whole conversation hiding inside one step: it
     * evaluates intents and records language that appears nowhere in the step.
     * Its turns travel with the skeleton so nothing has to open the story file
     * to know what the episode practises.
     */
    out.turns = storyTurns(getStory(step.storyObjective)).map(turn => pick(turn, TURN_FIELDS))
  }
  return out
}

const EPISODE_FIELDS = ['id', 'level', 'arc', 'titleKey', 'goalKey', 'canDoId', 'canDoNameKey',
  'durationKey', 'estimatedMinutes', 'xp', 'prerequisites', 'gardenItems', 'reinforces',
  'skillPrerequisites', 'role', 'reuseSkills']

/* every level's episodes, in curriculum order: Pre-A1, then A1 arc by arc */
const RUNTIME_EPISODES = [...ARC, ...A1_ARC1, ...A1_ARC2, ...A1_ARC3, ...A1_ARC4, ...A1_ARC5]

const skeleton = RUNTIME_EPISODES.map(ep => ({
  ...pick(ep, EPISODE_FIELDS),
  prerequisites: ep.prerequisites || [],
  steps: (ep.steps || []).map(skeletonStep),
}))

const body = `/*
 * GENERATED FILE — do not edit by hand.
 *
 * The shape of the curriculum without its words: what each episode teaches, which
 * intents its steps evaluate, which language items they produce, what unlocks
 * what. Written by \`scripts/build-curriculum-skeleton.mjs\` from the episode
 * definitions, which remain the single source of truth, and re-derived and
 * compared by \`check-curriculum-loading\` so it can never drift from them.
 *
 * It exists so that knowing ABOUT the curriculum does not mean downloading it:
 * the planner, the readiness rules and Home read this, while the prose lives
 * with the screens that render it.
 *
 * To regenerate:  npm run build:skeleton
 */
export const EPISODE_SKELETON = ${JSON.stringify(skeleton, null, 2)}

export const SKELETON_BY_ID = Object.fromEntries(EPISODE_SKELETON.map(ep => [ep.id, ep]))
`

const previous = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null
writeFileSync(OUT, body)

const steps = skeleton.reduce((n, ep) => n + ep.steps.length, 0)
const turns = skeleton.reduce((n, ep) => n + ep.steps.reduce((m, s) => m + (s.turns?.length || 0), 0), 0)
console.log(`\ncurriculum skeleton — ${skeleton.length} episodes, ${steps} steps, ${turns} story turns`)
console.log(`  ${(body.length / 1024).toFixed(1)} kB written to ${OUT}${previous === body ? ' (unchanged)' : ''}`)
