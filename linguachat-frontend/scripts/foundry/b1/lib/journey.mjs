/*
 * b1/lib/journey — play B1 episodes the way the product will, once
 * `LC-INT-001` wires this level in.
 *
 * Mirrors `scripts/lib/journey.mjs`'s `playEpisode` exactly in spirit: real
 * scaffolding, real learner-model recording, real episode-run bookkeeping —
 * all imported unedited from `engine/**` (importing and calling a shared
 * module read-only is not a write-scope violation; only editing one is). The
 * ONE substitution is the evaluator dispatch and the episode lookup, which
 * use B1's own `evaluateB1Free`/`b1EpisodeById` instead of the shared
 * `evaluateFree`/episode-skeleton lookup, because B1 has no entry in either
 * yet. `deriveInitialScaffold` is always called with the resolved `episode`
 * object (never `episodeId`), specifically to avoid its internal fallback to
 * `SKELETON_BY_ID`, which does not know about B1.
 *
 * Scoped to the step types B1 arc 1 actually uses today (`scene`, `model`,
 * `comprehension`, `word_order`, `fill_blank`, `free_reply`). Extend as later
 * arcs need `mini_story`/`recall`/branching, the same way `scripts/lib/
 * journey.mjs` grew one arc at a time.
 */
import { b1EpisodeById } from '../../../../src/learning/levels/b1/b1Map.js'
import { evaluateB1Free } from '../../../../src/learning/levels/b1/evaluators.js'
import {
  recordItemAttempt, setEpisodeState, getEpisodeState,
} from '../../../../src/learning/engine/learnerModel.js'
import {
  beginEpisodeRun, completeEpisodeRun, updateActiveRun,
} from '../../../../src/learning/engine/episodeRuns.js'
import {
  deriveInitialScaffold, updateScaffoldAfterTurn, evidenceKindForStep,
  isIndependentEvidence, showsModelAnswer,
} from '../../../../src/learning/engine/scaffolding.js'

export const NAME = 'Sebastian'
export const PLACE = 'Bogotá'

/* The English a learner types, per evalKind (a plain string), or per
 * (evalKind, subtype) when the intent carries a subtype
 * (`narrativeForm`/`intentForm`/`tone` — b1.json intentStrategy.
 * newSubtypesOnExistingIntents). The evaluators judge structure, not exact
 * wording, so one canonical answer per (evalKind[, subtype]) is enough
 * regardless of the specific prompt/topic a step uses. */
const ANSWERS = {
  narrate_past_event: {
    sequence: 'First I got up. Then I made coffee. After that I read the news. Finally I left for work.',
    interruption: 'I was cooking dinner when the power went out.',
  },
  state_opinion: 'I think that weekend trips are great, because they help you relax.',
  agree_or_disagree: "I agree, because there's more to do in a city.",
  compare_and_choose: "The city is busier than the countryside, but it's more exciting. Of the three, I think the coast is the most relaxing.",
  describe_experience: 'It was quiet, beautiful, and relaxing. It made me feel really peaceful.',
  recommend_or_warn: "I'd recommend the coast, because it's quiet and relaxing.",
  report_problem: {
    neutral: "There's a problem with my order. I ordered a chicken sandwich, but I got a cheese one.",
    frustrated: "This isn't ideal — I ordered this three days ago, but I understand these things happen.",
  },
  negotiate_solution: 'Would it be possible to get a replacement instead?',
  state_future_intent: {
    decision: "I'll have the pasta, thanks.",
    plan: "I'm going to visit my sister next week.",
    prediction: 'It will probably rain later.',
    hope: 'I hope to travel more one day.',
  },
  state_real_condition: "If it rains tomorrow, I'll stay home.",
  state_hypothetical: "If I were you, I'd ask for more details before deciding.",
}

export function answerFor(step) {
  const entry = ANSWERS[step.evalKind]
  if (entry === undefined) throw new Error(`b1 journey: no answer for ${step.evalKind}`)
  if (typeof entry === 'string') return entry
  const subtypeKey = step.situationForm || step.narrativeForm || step.intentForm || step.tone
  const answer = entry[subtypeKey]
  if (!answer) throw new Error(`b1 journey: no answer for ${step.evalKind}/${subtypeKey}`)
  return answer
}

function ctxFor(step, independent) {
  return {
    name: NAME,
    place: PLACE,
    independent,
    narrativeForm: step.narrativeForm,
    intentForm: step.intentForm,
    tone: step.tone,
    situationForm: step.situationForm,
  }
}

const DAY = 24 * 60 * 60 * 1000

export function playEpisode(model, episodeId, {
  profile, atMs, wantsOtherBranch = false, trace = null, unaidedAttempt = false,
  answerOverride = null, ctxOverride = null, wrongText = null,
} = {}) {
  const ep = b1EpisodeById(episodeId)
  if (!ep) throw new Error(`b1 journey: unknown episode ${episodeId}`)

  const run = beginEpisodeRun(model, ep.id, { source: 'practice', wantsOtherBranch, atMs })
  let scaffold = deriveInitialScaffold({ learnerModel: model, episode: ep, targetCanDo: ep.canDoId, runMode: run.mode, atMs })

  const persistScaffold = (extra = {}) => {
    updateActiveRun(model, { scaffold, ...extra })
    model.scaffoldByEpisode = { ...(model.scaffoldByEpisode || {}), [ep.id]: scaffold.currentLevel }
  }
  persistScaffold()
  const initialLevel = scaffold.currentLevel
  let assistance = 0
  let retries = 0
  let independentEvidence = false
  const exercised = new Set()

  const productive = (step) => {
    const evidenceKind = evidenceKindForStep(step)
    if (step.evalKind) exercised.add(`${step.evalKind}:${step.narrativeForm || ''}`)
    const usesSuggestion = !unaidedAttempt
      && profile.usesSuggestion({ step, scaffold: scaffold.currentLevel })
      && Boolean(step.suggestionEn)

    if (profile.retries({ step, scaffold: scaffold.currentLevel })) {
      retries += 1
      const wrongReply = wrongText ? wrongText(step) : 'hmm'
      const wrongCtx = { ...ctxFor(step, false), ...(ctxOverride ? ctxOverride(step) : {}) }
      const wrong = evaluateB1Free(step.evalKind, wrongReply, wrongCtx)
      if (wrong.completedObjective) throw new Error(`b1 journey: "${wrongReply}" should never pass ${step.evalKind}/${step.narrativeForm}`)
      if (!wrong.retryRequired) throw new Error(`b1 journey: a rejected ${step.evalKind} reply must ask for another go`)
      for (const id of step.itemIds || []) recordItemAttempt(model, id, { correct: false, independent: false, evidenceKind, atMs })
      scaffold = updateScaffoldAfterTurn(scaffold, { correct: false, evidenceKind, retried: true })
      persistScaffold({ retriedSteps: retries })
    }

    const independent = isIndependentEvidence({ step, assistanceUsed: usesSuggestion, correct: true })
    const reply = answerOverride ? answerOverride(step) : answerFor(step)
    const ctx = { ...ctxFor(step, independent), ...(ctxOverride ? ctxOverride(step) : {}) }
    const result = evaluateB1Free(step.evalKind, reply, ctx)
    if (!result.completedObjective) {
      throw new Error(`b1 journey: ${ep.id}/${step.evalKind}/${step.narrativeForm} rejected "${reply}" → ${result.errorType}`)
    }
    for (const id of step.itemIds || []) recordItemAttempt(model, id, { correct: true, independent, evidenceKind, atMs })
    if (independent) { independentEvidence = true; updateActiveRun(model, { independentEvidence: true }) }
    if (usesSuggestion) { assistance += 1; updateActiveRun(model, { assistanceUsed: assistance }) }
    scaffold = updateScaffoldAfterTurn(scaffold, { correct: true, evidenceKind, assistanceUsed: usesSuggestion })
    persistScaffold()
  }

  for (let i = 0; i < ep.steps.length; i++) {
    const step = ep.steps[i]
    setEpisodeState(model, ep.id, { status: 'in_progress', stepIndex: i })
    if (step.type === 'free_reply') {
      productive(step)
    } else if (step.type === 'comprehension') {
      if (step.itemId) recordItemAttempt(model, step.itemId, { correct: true, independent: false, evidenceKind: evidenceKindForStep(step), atMs })
      scaffold = updateScaffoldAfterTurn(scaffold, { correct: true, evidenceKind: evidenceKindForStep(step) })
      persistScaffold()
    } else if (step.type === 'word_order' || step.type === 'fill_blank') {
      if (step.itemId) recordItemAttempt(model, step.itemId, { correct: true, independent: false, evidenceKind: evidenceKindForStep(step), atMs })
      scaffold = updateScaffoldAfterTurn(scaffold, { correct: true, evidenceKind: evidenceKindForStep(step) })
      persistScaffold()
    }
    // 'scene' / 'model' steps: no recording, matches the shared shell's own behavior
  }

  const state = getEpisodeState(model, ep.id)
  const firstCompletion = !state.awarded
  setEpisodeState(model, ep.id, { status: 'completed', stepIndex: ep.steps.length - 1, ...(firstCompletion ? { awarded: true } : {}) })
  const finished = completeEpisodeRun(model, { independentEvidence, rewarded: firstCompletion, atMs })

  const record = {
    episodeId: ep.id,
    objectives: [...exercised],
    mode: run.mode,
    initialScaffold: initialLevel,
    finalScaffold: scaffold.currentLevel,
    assistance,
    retries,
    independentEvidence,
    rewarded: Boolean(finished?.rewarded),
    xp: firstCompletion ? ep.xp : 0,
  }
  if (trace) trace.push(record)
  return record
}

export const STRONG = {
  name: 'strong',
  usesSuggestion: () => false,
  retries: () => false,
}

export const ASSISTED = {
  name: 'assisted',
  usesSuggestion: ({ step, scaffold }) => showsModelAnswer(scaffold) && Boolean(step.suggestionEn),
  retries: () => false,
}

export { DAY }
