import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { SEED_VOCAB_BY_ID } from '../../data/vocabulary'
import { getLocalizedMeaning } from '../../services/learningContent'
import { loadEpisodeContent, EpisodeContentError } from '../../learning/curriculum/episodeContent.js'
import { ScreenFallback, ScreenError, useLazyContent } from '../ui/LazyBoundary'
import { evaluateFree, shouldEscalate, isDeclineReply } from '../../learning/engine/responseEvaluation.js'
import { selectCompatibleContext, otherNeutral, asSubjectValue, thingById, withArticle, countedThing } from '../../learning/engine/semanticContext.js'
import { evaluateEpisodeResponse } from '../../learning/engine/hybridEvaluation.js'
import { createSubmissionGuard } from '../../learning/engine/submitGuard.js'
import { partnerFor, placeFor } from '../../learning/engine/variation.js'
import { getLearnerInterests, getInterestContext, getInterestObject } from '../../learning/engine/interests.js'
import { evaluateLearningResponse } from '../../services/api'
import {
  loadLearnerModel, saveLearnerModel, recordItemAttempt, recordCanDoAttempt, markRecurringError,
  getEpisodeState, setEpisodeState, recordActivitySignalOnce,
} from '../../learning/engine/learnerModel.js'
import {
  deriveInitialScaffold, updateScaffoldAfterTurn, reviveScaffoldState,
  evidenceKindForStep, isIndependentEvidence, showsModelAnswer, showsHintByDefault,
} from '../../learning/engine/scaffolding.js'
import { dayKeyFor } from '../../learning/engine/session.js'
import { seedFrom } from '../../learning/engine/variation.js'
import { FormatFeedback } from './FormatFeedback'
import { MiniStory } from '../session/MiniStory'
import {
  beginEpisodeRun, completeEpisodeRun, updateActiveRun, runEarnsReward, otherBranch, RUN_BRANCH_REPLAY,
} from '../../learning/engine/episodeRuns.js'
import {
  recordLearnerFact, selectLearnerFact, factsOfType, captureStatedLifeFact, captureStatedUsualTime,
} from '../../learning/engine/learnerFacts.js'

// Fill {name} / {partner} / {place} / {partnerPlace} in the English target text.
// An unknown placeholder is left untouched rather than printed as "undefined".
const resolve = (str, vars = {}) =>
  String(str || '').replace(/\{(\w+)\}/g, (match, key) => (vars[key] == null || vars[key] === '' ? match : String(vars[key])))

/*
 * Which activity format each step is, for the preference model. An episode step
 * may override it (a multi-turn conversation turn is roleplay, not a free reply).
 */
const STEP_FORMAT = {
  comprehension: 'comprehension', choice: 'choice', word_order: 'word_order',
  fill_blank: 'fill_blank', free_reply: 'free_reply', recall: 'recall',
  mini_story: 'mini_story',
}
export const formatOfStep = (step) => (step && (step.format || STEP_FORMAT[step.type])) || null

/*
 * A deterministic shuffle for the "build the sentence" activity. Presenting the
 * words already in order asked nothing of the learner; the seed keeps the same
 * scramble across re-renders and reloads, and a single-token step is left alone.
 */
export function scrambleTokens(tokens, seedKey = '') {
  const list = [...tokens]
  if (list.length < 3) return list
  const rnd = (n, salt) => seedFrom(`${seedKey}:${salt}`) % n
  for (let i = list.length - 1; i > 0; i--) {
    const j = rnd(i + 1, i)
    const tmp = list[i]; list[i] = list[j]; list[j] = tmp
  }
  // Never hand back the solution itself.
  if (list.join(' ') === tokens.join(' ')) {
    const tmp = list[0]; list[0] = list[list.length - 1]; list[list.length - 1] = tmp
  }
  return list
}

function En({ children, className = '', style }) {
  return <span lang="en" dir="ltr" className={className} style={style}>{children}</span>
}

function LinguaLine({ children }) {
  return (
    <div className="flex gap-3 mb-3 animate-message-in">
      <LinguaAvatar size={34} online className="mt-0.5" />
      <div className="flex flex-col gap-0.5" style={{ maxWidth: '88%' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.04em' }}>Lingua</span>
        <div className="bubble-lingua">{children}</div>
      </div>
    </div>
  )
}

/*
 * The player, once its episode has been resolved.
 *
 * It receives a definition rather than fetching one, because "which episode may
 * this learner open, and where does its content live" is the content resolver's
 * question — see EpisodeShell below. Everything from here down is the same
 * component that has always run Pre-A1.
 *
 * `onComplete` lets a daily session take over what happens after the episode:
 * inside a session the next block follows, standalone it returns to Home.
 */
function EpisodeRunner({ episode, episodeId, onComplete = null, interestId = null, runOptions = null }) {
  const { t, profile, tutorPreferences, nativeLanguageInfo, interfaceLanguageInfo, exitEpisode, awardEpisode, finishEpisode } = useApp()
  const ep = episode
  const name = (profile.name || '').trim() || 'Alex'
  // deterministic roleplay partner — stable per learner, reproducible on reload
  const partner = useMemo(() => partnerFor(profile.name || 'guest'), [profile.name])
  const nativeLang = nativeLanguageInfo.base
  const meaningOf = (id) => getLocalizedMeaning(SEED_VOCAB_BY_ID[id]?.meaning, nativeLanguageInfo)

  /*
   * A run the planner opened to see whether the learner can hold the
   * conversation on their own: the same episode, without the sentence written
   * out in advance. Support still arrives the moment anything goes wrong.
   */
  const unaidedAttempt = Boolean(runOptions?.unaidedAttempt)
  const modelRef = useRef(loadLearnerModel())
  const awardedRef = useRef(false)
  const finishedRef = useRef(false)
  /*
   * Open (or rejoin) this run before anything else, so the rest of the shell
   * knows whether it is a first attempt or practice. Started once per mount
   * and persisted, so a remount or a reload rejoins the same run.
   */
  const runRef = useRef(null)
  if (ep && !runRef.current) {
    const wantsOtherBranch = Boolean(runOptions?.wantsOtherBranch)
    const preferred = wantsOtherBranch ? otherBranch(modelRef.current, ep) : null
    // Resolving the run only touches the in-memory model; it is written to
    // storage in the effect below, so rendering stays free of side effects.
    runRef.current = beginEpisodeRun(modelRef.current, ep.id, {
      source: runOptions?.source || (onComplete ? 'daily_session' : 'practice'),
      wantsOtherBranch,
      branchPreference: preferred,
    })
  }
  const run = runRef.current
  useEffect(() => {
    /*
     * Write the run AND the support level it was given, so a reload restores
     * the decision instead of taking it again. Re-deriving would usually agree,
     * but "usually" is not a guarantee: the model changes as the learner answers,
     * and a run must not silently become easier or harder halfway through.
     */
    if (!runRef.current) return
    if (initial.scaffold && !runRef.current.scaffold) {
      scaffoldRef.current = initial.scaffold
      persistScaffold(initial.scaffold)
    }
    saveLearnerModel(modelRef.current)
  }, [])

  const initial = useMemo(() => {
    if (!ep) return { step: 0, scaffold: null }
    const st = getEpisodeState(modelRef.current, ep.id)
    // resume, but never resume onto the completion step for a fresh replay
    const step = Math.min(st.status === 'completed' ? 0 : (st.stepIndex || 0), ep ? ep.steps.length - 1 : 0)
    /*
     * How much help this run offers is decided ONCE, here, from what the
     * learner has actually done — and a run already under way keeps the level
     * it was given rather than re-deriving it from a model that has moved on.
     * Nothing downstream recomputes it, so a re-render, a breakpoint change or
     * a language switch cannot alter the experience mid-episode.
     */
    const resumed = reviveScaffoldState(runRef.current?.scaffold)
    const scaffold = resumed || deriveInitialScaffold({
      learnerModel: modelRef.current,
      episode: ep,
      runMode: runRef.current?.mode || 'first_run',
    })
    return { step, scaffold }
  }, [ep])

  const [stepIndex, setStepIndex] = useState(initial.step)
  const [scaffoldState, setScaffoldState] = useState(initial.scaffold)
  /*
   * The same state, in a ref, because `advance()` runs from a timer: by the
   * time it persists, its closure still holds the level from BEFORE the turn
   * that triggered it, and writing that back silently undid every transition.
   */
  const scaffoldRef = useRef(initial.scaffold)
  const scaffold = scaffoldState?.currentLevel || 'high'
  const [showHelp, setShowHelp] = useState(true)
  const [usedSuggestion, setUsedSuggestion] = useState(false)

  const [choice, setChoice] = useState(null)
  const [buildOrder, setBuildOrder] = useState([])
  const [fillValue, setFillValue] = useState('')
  const [reply, setReply] = useState('')
  const [retry, setRetry] = useState(null)     // { explainKey, natural, promptKey }
  const [praise, setPraise] = useState(null)
  const [live, setLive] = useState('')
  const [reviewing, setReviewing] = useState(false)  // remote evaluation in flight
  // The learner asked to practise this step another way (see `switchActivity`).
  const [altStep, setAltStep] = useState(null)
  const [askFeedback, setAskFeedback] = useState(false)
  // The place the learner said they are from, captured inside the activity (see
  // episode 5) — never required up front, never part of the global profile.
  const [place, setPlace] = useState(() => modelRef.current.facts?.place || '')
  /*
   * The hour the learner already told us they get up, if they have. It is only
   * ever used to keep a model answer honest — "I usually get up at seven." should
   * be their seven, not an invented one — and it is empty for everybody who has
   * not said it yet, which is the normal path.
   */
  const usualTime = useMemo(() => factsOfType(modelRef.current, 'usual_time')[0]?.value || '', [])

  const guardRef = useRef(createSubmissionGuard())  // double-submit + late-response
  const abortRef = useRef(null)       // cancels the in-flight remote request
  const attemptsRef = useRef(0)       // attempts on the current step
  /*
   * The answer having been on the screen — the suggestion taken, or a correction
   * that spelled the sentence out after a wrong attempt — means this turn is not
   * unaided production, however correctly it ends. Retyping what was just shown
   * used to count towards `can_use`, which is meant to mean they can say it
   * themselves. `attemptsRef` is exactly "they have already had a go here".
   */
  const answerWasShown = () => usedSuggestion || attemptsRef.current > 0
  const replyInputRef = useRef(null)

  // Cancel any in-flight evaluation if the learner leaves mid-review.
  useEffect(() => () => {
    guardRef.current.invalidate()
    try { abortRef.current?.abort() } catch { /* noop */ }
  }, [])

  // The step actually on screen: normally the authored one, or the alternative
  // the learner asked for. Computed before any early return so the hooks below
  // always run in the same order.
  const authoredStep = ep ? ep.steps[Math.min(stepIndex, ep.steps.length - 1)] : null
  const step = altStep || authoredStep

  /*
   * "This activity is on screen" — recorded once per step per day. The id is
   * built from the day, the episode and the step, so every accidental repeat
   * (re-render, StrictMode's double effect, a language switch, crossing a
   * breakpoint, reloading onto the same step) resolves to the SAME id and is
   * counted once. Leaving and coming back later the same day is not new either.
   */
  useEffect(() => {
    const format = formatOfStep(step)
    if (!ep || !format) return
    const id = `${dayKeyFor()}:${ep.id}:${altStep ? 'alt' : stepIndex}:shown`
    if (recordActivitySignalOnce(modelRef.current, id, format, 'shown')) saveLearnerModel(modelRef.current)
  }, [ep, stepIndex, altStep, step])

  /*
   * Interest context for a personalised episode. The seed is the learner plus
   * the episode id, so the subject matter is fixed for the whole episode (it
   * cannot drift between renders or across a reload) while a different episode
   * may pick another interest the learner chose. With no interests we fall back
   * to neutral examples rather than asking them to configure anything.
   *
   * Inside a daily session the topic is already pinned in the plan, so it is
   * passed in and wins: Home and the episode can never promise different things.
   */
  const interestCtx = useMemo(
    () => (interestId
      ? getInterestContext([interestId], `${profile.name || 'guest'}:${episodeId}`)
      : getInterestContext(getLearnerInterests(tutorPreferences), `${profile.name || 'guest'}:${episodeId}`)),
    [tutorPreferences, profile.name, episodeId, interestId],
  )
  const interestObject = useMemo(
    () => getInterestObject(interestCtx, `${profile.name || 'guest'}:${episodeId}:object`),
    [interestCtx, profile.name, episodeId],
  )

  /*
   * Practising something again is the natural place to use what the learner
   * told Lingua the first time: the structure is familiar, so a familiar
   * subject makes the repetition feel like a conversation rather than a
   * rerun. A first run keeps the catalogue example.
   */
  const practiceFact = useMemo(() => {
    const mode = runRef.current?.mode
    if (mode !== 'replay' && mode !== 'branch_replay') return null
    return selectLearnerFact(modelRef.current, { type: 'like', seed: `${episodeId}:practice`, allowRecent: true, accept: (f) => Boolean(asSubjectValue(f.value)) })
  }, [episodeId])
  /*
   * A remembered like only colours the episode when it is the kind of thing a
   * person can be asked to like. Episode 7's gap stores whatever was typed, so
   * without this a replay asked "Do you like Bogota?" or "Do you like tired?".
   */
  const subjectNoun = (practiceFact && asSubjectValue(practiceFact.value)?.value) || interestCtx.targetNoun

  if (!ep) return null

  // The partner's own place is derived from the partner name, so it is stable
  // per learner and never hardcoded to one country.
  const partnerPlace = placeFor(partner)
  // Branch line for the small controlled story in episode 9 (two outcomes, one
  // objective). The branch is stored, so a reload keeps the same story.
  /*
   * Which way the little story is going THIS time. A practice run carries its
   * own outcome, so "try the other option" can show the other ending without
   * rewriting the decision the learner originally made.
   */
  const branch = run?.branchId || modelRef.current.facts?.[`branch:${ep.id}`] || 'accept'
  /*
   * How the story answers the decision. Each episode may bring its own pair,
   * because a line that fits one scene is nonsense in another: "No problem.
   * Maybe another day." is a kind refusal of a plan and a baffling reply to
   * "Anything else?" at a counter.
   */
  const branchLines = ep.story?.branchLines || { accept: 'Great! Let’s get ready.', decline: 'No problem. Maybe another day.' }
  const branchLine = branchLines[branch] || branchLines.accept

  /*
   * What the learner is asking for, when a step asks for something.
   *
   * The step's intent decides which KIND of thing may fill the slot, so a
   * remembered "I like music." can never become "Can I have music, please?".
   * A memory that does not fit is skipped in silence and the neutral catalogue
   * answers instead: a correct ordinary example beats a personalised absurdity.
   */
  /*
   * A step that is not evaluated can still talk about something — a gap-fill
   * has no `evalKind`, but its worked example still has to name a drink and
   * not the learner ("Can I have Sebastian, please?"). `contextIntent` lets
   * such a step say which slot it is filling.
   */
  const contextIntent = step.contextIntent || step.evalKind
  const contextItem = selectCompatibleContext({
    intent: contextIntent,
    facts: factsOfType(modelRef.current, 'like').map(f => f.value),
    interests: [interestCtx.targetNoun],
    seed: `${name}:${ep.id}:item`,
  })
  // A second visit to the same request asks for something else, so a variation
  // step is a real variation and not the same sentence twice.
  const otherItem = otherNeutral(contextIntent, `${name}:${ep.id}:other`, contextItem)

  /*
   * The sixth arc names its thing explicitly rather than inferring one from a
   * placeholder: a quantity needs to know WHICH thing and HOW MANY to build
   * "two sandwiches", and guessing from a string is how "I need music." got
   * shipped. Separate fields, because they mean separate things.
   */
  const stepThing = step?.thingId ? thingById(step.thingId) : null
  const stepCount = Number.isInteger(step?.count) ? step.count : null

  const vars = {
    name, partner, place, partnerPlace,
    noun: subjectNoun,
    object: interestObject,
    activity: interestCtx.activity,
    branchLine,
    item: contextItem?.value,
    otherItem: otherItem?.value,
    thing: stepThing ? withArticle(stepThing.id) : '',
    thingWord: stepThing ? stepThing.singular : '',
    counted: stepThing && stepCount ? countedThing(stepThing.id, stepCount) : '',
  }

  // The model answer must name the same thing the prompt did.
  const requestedThing = /\{otherItem\}/.test(step?.suggestionEn || '')
    ? vars.otherItem
    : (/\{item\}/.test(step?.suggestionEn || '') ? vars.item : null)

  const remoteEvaluator = (payload, abortSignal) => evaluateLearningResponse(payload, { signal: abortSignal })

  // Whether THIS run will actually pay out, which is what the completion card
  // is allowed to promise: a replay earns evidence and practice, not XP.
  const willReward = runEarnsReward(run?.mode) && !getEpisodeState(modelRef.current, ep.id).awarded

  // "Long" means the episode really was a conversation, not a single card.
  const longRoleplay = ep.steps.filter(s => s.type === 'free_reply' || s.type === 'recall').length >= 4

  function persistStep(nextIndex) {
    setEpisodeState(modelRef.current, ep.id, { status: nextIndex >= ep.steps.length - 1 ? getEpisodeState(modelRef.current, ep.id).status : 'in_progress', stepIndex: nextIndex })
    persistScaffold(scaffoldRef.current)
    saveLearnerModel(modelRef.current)
  }

  /*
   * Support belongs to the RUN, so practising the same episode again derives
   * its own level instead of inheriting the one a previous attempt ended on.
   * `scaffoldByEpisode` is still written for the planner, which only wants a
   * rough read of how supported the learner currently is.
   */
  function persistScaffold(next) {
    if (!next) return
    runRef.current = updateActiveRun(modelRef.current, { scaffold: next }) || runRef.current
    modelRef.current.scaffoldByEpisode[ep.id] = next.currentLevel
    /*
     * Written the moment it changes. A wrong answer does not advance the step,
     * so nothing else would have saved it — and a learner who reloads after
     * getting stuck must find the help that was just restored, not the level
     * they had before they struggled.
     */
    saveLearnerModel(modelRef.current)
  }

  /*
   * Record an activity signal for the step on screen, at most once. `suffix`
   * names the moment ('completed', 'assistance', 'retried'), so each kind is
   * counted once per step per day no matter how the UI is driven.
   */
  function signal(kind, suffix = kind) {
    const format = formatOfStep(step)
    if (!format) return
    const id = `${dayKeyFor()}:${ep.id}:${altStep ? 'alt' : stepIndex}:${suffix}`
    if (!recordActivitySignalOnce(modelRef.current, id, format, kind)) return
    // The run keeps a shape of how this attempt went — counts only, no answers.
    const current = runRef.current
    if (current) {
      const patch = { formatsUsed: [...new Set([...(current.formatsUsed || []), format])] }
      if (kind === 'assistance') patch.assistanceUsed = (current.assistanceUsed || 0) + 1
      if (kind === 'retried') patch.retriedSteps = (current.retriedSteps || 0) + 1
      runRef.current = updateActiveRun(modelRef.current, patch) || current
    }
    saveLearnerModel(modelRef.current)
  }

  function advance() {
    // invalidate any late remote response and cancel an in-flight one
    guardRef.current.invalidate()
    try { abortRef.current?.abort() } catch { /* noop */ }
    abortRef.current = null
    signal('completed')
    attemptsRef.current = 0
    setReviewing(false)
    setAltStep(null)
    setRetry(null); setPraise(null); setLive(''); setChoice(null); setBuildOrder([]); setFillValue(''); setReply(''); setUsedSuggestion(false)
    const next = Math.min(ep.steps.length - 1, stepIndex + 1)
    setStepIndex(next)
    persistStep(next)
    if (scaffold === 'high') setShowHelp(true)
  }

  /*
   * Support goes down only after two clean answers in a row.
   *
   * `usedHelp` here means the learner actually reached for the model answer —
   * NOT merely that support was still on screen. Counting "support is high" as
   * "help was used" made the streak reset every turn, so support could never be
   * reduced and no episode could ever produce independent evidence.
   */
  function adaptScaffold({ correct, usedHelp, evidenceKind = null, retried = false, switchedActivity = false }) {
    const next = updateScaffoldAfterTurn(scaffoldState, {
      correct, assistanceUsed: usedHelp, evidenceKind, retried, switchedActivity,
    })
    scaffoldRef.current = next
    setScaffoldState(next)
    persistScaffold(next)
    if (next.currentLevel === 'high') setShowHelp(true)
  }

  /*
   * "Practise this another way." Offered only after two attempts on a step that
   * has a model answer, and only as an EQUIVALENT activity: the learner still
   * produces the very same target sentence, with the words in front of them.
   * It records a soft negative for the format, never an abandonment, never XP,
   * and never counts as mastery — the objective is not skipped.
   */
  function switchActivity() {
    const target = resolve(step.suggestionEn, vars)
    const tokens = target.replace(/([.?!])$/, ' $1').split(/\s+/).filter(Boolean)
    signal('negative_soft', 'switched')
    adaptScaffold({ correct: true, usedHelp: true, evidenceKind: 'guided', switchedActivity: true })
    setAltStep({
      type: 'word_order', format: 'guided_reply', instructionKey: 'altGuidedInstruction',
      hintKey: 'altGuidedHint', itemId: (step.itemIds || [])[0] || null, tokens, assisted: true,
    })
    setRetry(null)
    setLive(t('altGuidedInstruction'))
  }

  // The worked example for a gap-fill: whatever the step is capturing.
  function fillExample(s) {
    if (s.captureFact === 'place') return place || partnerPlace
    if (s.captureFact === 'likes') return subjectNoun
    // A gap that is not capturing anything still has to be filled with the
    // right KIND of word: "Can I have Sebastian, please?" is not an example.
    // If the slot could not be resolved, show nothing rather than a wrong noun.
    if (s.exampleVar) return vars[s.exampleVar] || ''
    /*
     * A gap with one right answer shows that answer here — the hint is the
     * high-support affordance, and it is the only place the target may appear.
     * Without this the fallback below produced "Can you sebastian, please?".
     */
    if (s.expects) return s.expects
    return s.captureFact ? interestCtx.targetNoun : name
  }

  function recordItems(ids, { correct, independent, evidenceKind = null }) {
    const kind = evidenceKind || evidenceKindForStep(step) || 'open'
    ;(ids || []).forEach(id => recordItemAttempt(modelRef.current, id, { correct, independent, evidenceKind: kind }))
    saveLearnerModel(modelRef.current)
  }

  /* ---------- free reply (roleplay / recall) — hybrid evaluation ---------- */
  /*
   * The one fact A1 arc 1 is designed to remember. The rule itself lives in the
   * engine (`captureStatedLifeFact`) so the player, the session harness and the
   * checks cannot drift apart; this only supplies what is on screen — the model
   * answer as the learner actually saw it, resolved.
   *
   * It runs BESIDE `recordItems`, never instead of it: a stored fact is not
   * mastery, and reinforcing an existing value means a replay cannot grow the list.
   */
  function captureLifeFact(evalKind, text) {
    const payload = { evalKind, reply: text, modelAnswer: resolve(step.suggestionEn || '', vars), sourceEpisodeId: ep.id }
    /*
     * One call site, one fact per arc: arc 1 remembers where the learner's days
     * happen, arc 2 remembers when they start. Each rule decides for itself whether
     * this turn is one it may learn from, so adding an arc adds a line here and
     * nothing else.
     */
    const stored = [
      captureStatedLifeFact(modelRef.current, payload),
      captureStatedUsualTime(modelRef.current, payload),
    ].filter(Boolean)
    if (stored.length) saveLearnerModel(modelRef.current)
  }

  async function submitFree(evalKind, itemIds, { fromSuggestion } = {}) {
    const text = reply
    if (!text.trim()) return
    const token = guardRef.current.begin()
    if (token === null) return                // a submission is already in flight
    const independent = isIndependentEvidence({ step, assistanceUsed: fromSuggestion, correct: true })
    const turnContext = { linguaSaid: resolve(step.promptEn || step.sceneEn || '', vars) }

    // Decide up front whether we will need Lingua, only to show a calm status.
    // targetNoun keeps the model answer in the learner's own subject matter
    // targetThing is only set where the step actually asked for a thing, so the
    // arcs that never mention one keep their own catalogue examples.
    /*
     * WHO this turn is about. The roleplay partner by default; a step may name
     * somebody else with `personName` — arc 3 has turns about a person the episode
     * introduces, and a verdict built from the derived partner named the wrong one in
     * the sentence it offered as correct.
     */
    const aboutPerson = step.personName || partner
    const evalCtx = { name, independent, turnContext, place, partner: aboutPerson, targetNoun: subjectNoun, activity: interestCtx.activity, ...(requestedThing ? { targetThing: requestedThing } : {}), ...(step.repairKind ? { repairKind: step.repairKind } : {}), ...(step.meaningWord ? { meaningWord: step.meaningWord } : {}), ...(stepThing ? { targetThing: stepThing.id } : {}), ...(step.quantityForm ? { quantityForm: step.quantityForm } : {}), ...(step.timeForm ? { timeForm: step.timeForm } : {}), ...(usualTime ? { usualTime } : {}), ...(stepCount ? { targetCount: stepCount } : {}), /* arc 4: which public place the turn asks about, and which relation its situation implies */ ...(step.placeName ? { placeName: step.placeName } : {}), ...(step.relationHint ? { relationHint: step.relationHint } : {}), /* arc 6/7: ability polarity, arrangement stage, and which episode's confirm-stage praise applies */ ...(step.abilityForm ? { abilityForm: step.abilityForm } : {}), ...(step.arrangeStage ? { arrangeStage: step.arrangeStage } : {}), ...(step.praisePrefix ? { praisePrefix: step.praisePrefix } : {}), /* A2 arc 5: the name a spell_word turn asks the learner to spell */ ...(step.expectedSpelling ? { expected: step.expectedSpelling } : {}), /* B1: narrative form, problem tone, future-intent situation, and conversational role — see hybridEvaluation.js's own comment on these four fields */ ...(step.narrativeForm ? { narrativeForm: step.narrativeForm } : {}), ...(step.tone ? { tone: step.tone } : {}), ...(step.situationForm ? { situationForm: step.situationForm } : {}), ...(step.role ? { role: step.role } : {}) }
    const preview = evaluateFree(evalKind, text, evalCtx)
    const willEscalate = shouldEscalate(preview)

    const controller = new AbortController()
    abortRef.current = controller
    if (willEscalate) { setReviewing(true); setLive(t('epEvaluating')) }

    let result
    try {
      result = await evaluateEpisodeResponse({
        episode: ep, step, learnerResponse: text, learnerName: name, place,
        targetNoun: subjectNoun, targetThing: (stepThing && stepThing.id) || requestedThing || undefined, activity: interestCtx.activity, interestId: interestCtx.interestId,
        partner: aboutPerson,
        repairKind: step.repairKind || undefined,
        meaningWord: step.meaningWord || undefined,
        timeForm: step.timeForm || undefined,
        placeName: step.placeName || undefined,
        relationHint: step.relationHint || undefined,
        quantityForm: step.quantityForm || undefined,
        targetCount: stepCount || undefined,
        abilityForm: step.abilityForm || undefined,
        arrangeStage: step.arrangeStage || undefined,
        praisePrefix: step.praisePrefix || undefined,
        expected: step.expectedSpelling || undefined,
        narrativeForm: step.narrativeForm || undefined,
        tone: step.tone || undefined,
        situationForm: step.situationForm || undefined,
        role: step.role || undefined,
        nativeLanguage: nativeLang, interfaceLanguage: interfaceLanguageInfo?.base || nativeLang,
        targetLanguage: 'en', scaffoldLevel: scaffold, assistanceUsed: fromSuggestion, independent,
        previousAttempts: attemptsRef.current, turnContext,
        signal: controller.signal, remote: remoteEvaluator,
      })
    } catch {
      result = { ...preview, source: 'fallback' }
    }

    // Ignore a late response if the learner already advanced or left the step.
    if (!guardRef.current.isCurrent(token)) return
    guardRef.current.settle()
    abortRef.current = null
    setReviewing(false)

    if (result.completedObjective) {
      /*
       * A branching step records which way the little story went, so the next
       * turn follows it and a reload keeps the same outcome. Both branches lead
       * to the same can-do; only the wording differs.
       */
      if (step.branchOn === 'accept_decline') {
        // Read by the same rule the evaluator uses, so "That's all, thanks."
        // is a refusal here too instead of quietly counting as a yes.
        const chosen = isDeclineReply(text) ? 'decline' : 'accept'
        runRef.current = updateActiveRun(modelRef.current, { branchId: chosen }) || runRef.current
        // The historic outcome is written once, by the run that counted. Later
        // practice explores the other ending without erasing the first one.
        if (runEarnsReward(run?.mode) && !modelRef.current.facts?.[`branch:${ep.id}`]) {
          modelRef.current.facts = { ...(modelRef.current.facts || {}), [`branch:${ep.id}`]: chosen }
        }
        saveLearnerModel(modelRef.current)
      }
      /*
       * A reply can be right and still not be practice of the language this
       * step teaches — "Eleven." answers "How many?" without using any of the
       * ten words the level owns. The turn succeeds; the item is not credited.
       */
      if (result.targetEvidence === false) {
        setLive(t(result.praiseKey || 'ep1FeedbackGood'))
      } else {
        recordItems(itemIds, { correct: true, independent })
      }
      /*
       * The run remembers that it saw unaided open production, which is what
       * the can-do is credited from at the end. A component counter could not
       * do this job: it is lost on reload, and mastery is not allowed to depend
       * on whether the learner refreshed the page.
       */
      if (independent) runRef.current = updateActiveRun(modelRef.current, { independentEvidence: true }) || runRef.current
      captureLifeFact(evalKind, text)
      if (attemptsRef.current > 0) signal('retried')
      adaptScaffold({ correct: true, usedHelp: fromSuggestion, evidenceKind: evidenceKindForStep(step), retried: attemptsRef.current > 0 })
      setPraise(result.praiseKey || 'ep1FeedbackGood')
      setLive(t(result.praiseKey || 'ep1FeedbackGood'))
      setTimeout(advance, 700)
    } else {
      attemptsRef.current += 1
      recordItems(itemIds, { correct: false, independent: false })
      markRecurringError(modelRef.current, result.errorType)
      saveLearnerModel(modelRef.current)
      adaptScaffold({ correct: false, evidenceKind: evidenceKindForStep(step) })
      setRetry({ explainKey: result.explanation, natural: resolve(result.naturalVersion, vars), promptKey: result.retryPrompt })
      setLive(t('ep1RetryTitle'))
      // return focus to the input so a screen reader/keyboard user retries in place
      setTimeout(() => { try { replyInputRef.current?.focus() } catch { /* noop */ } }, 40)
    }
  }

  /* ---------- completion (idempotent award AND idempotent evidence) ---------- */
  function finish() {
    /*
     * Guarded as a whole, not just for XP. Tapping the button three times used
     * to record three can-do successes from a single completion, which could
     * hand out mastery the learner had not earned.
     */
    if (finishedRef.current) return
    finishedRef.current = true
    const m = modelRef.current
    const st = getEpisodeState(m, ep.id)
    // the can-do is only credited as independent if this run actually produced
    // unaided open production, which the scaffold state has been counting
    const independent = Boolean(runRef.current?.independentEvidence)
    recordCanDoAttempt(m, ep.canDoId, { success: true, independent, context: ep.id })
    /*
     * The reward is gated by the episode, not by the run: whatever this run
     * calls itself, an episode that has already paid out never pays again.
     * Practice still counts — the run is filed, the evidence is recorded, and
     * a due review can still be satisfied by it.
     */
    const firstCompletion = !st.awarded && !awardedRef.current
    if (firstCompletion) {
      awardedRef.current = true
      /*
       * The Garden grants, resolved here: this screen already has the seed
       * vocabulary loaded, so the app-wide context does not have to carry it.
       * Unknown ids are dropped exactly as before.
       */
      const grants = (ep.gardenItems || [])
        .filter(id => SEED_VOCAB_BY_ID[id])
        .map(id => ({ vocabId: id, word: SEED_VOCAB_BY_ID[id].term, kind: SEED_VOCAB_BY_ID[id].kind }))
      awardEpisode(ep, { grants })  // garden + XP, idempotent by awarded flag below
      setEpisodeState(m, ep.id, { status: 'completed', awarded: true, stepIndex: ep.steps.length - 1 })
    } else {
      setEpisodeState(m, ep.id, { status: 'completed', stepIndex: ep.steps.length - 1 })
    }
    completeEpisodeRun(m, { independentEvidence: independent, branchId: runRef.current?.branchId || null, rewarded: firstCompletion })
    saveLearnerModel(m)
    if (onComplete) onComplete(ep)
    else finishEpisode()
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6" style={{ background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
        {/* header */}
        <div className="rounded-2xl px-4 py-3 mb-5 flex items-center justify-between gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>{t('ep1EpisodeBadge')}</p>
            <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(ep.titleKey)}</p>
          </div>
          <button type="button" onClick={exitEpisode} className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.98]"
            style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{t('ep1FreeChatCta')}</button>
        </div>

        {/* progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4" aria-hidden="true">
          {ep.steps.map((_, i) => (
            <span key={i} style={{ width: i === stepIndex ? 16 : 5, height: 5, borderRadius: 999, background: i <= stepIndex ? 'var(--accent)' : 'var(--border)', transition: 'all 0.3s' }} />
          ))}
        </div>

        <p aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{live}</p>

        {/* ---------------- SCENE ---------------- */}
        {step.type === 'scene' && (
          <div className="animate-scale-in rounded-3xl p-6 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex justify-center"><ChattoMascot mood={step.mood || 'welcoming'} size="medium" intensity="enter" /></div>
            <h2 style={{ fontWeight: 800, fontSize: '1.1875rem', color: 'var(--ink)', marginTop: 14, marginBottom: 8 }}>{t(step.titleKey)}</h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', lineHeight: 1.55, marginBottom: 8 }}>{t(step.bodyKey)}</p>
            {step.showGoal && <p style={{ fontSize: '0.8125rem', color: 'var(--accent)', fontWeight: 700, marginBottom: 18 }}>{t(ep.goalKey)}</p>}
            <button onClick={advance} className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:-translate-y-px active:scale-[0.98]"
              style={{ background: 'var(--accent)' }}>{t(step.ctaKey || 'ep1Continue')}</button>
          </div>
        )}

        {/* ---------------- MODEL ---------------- */}
        {step.type === 'model' && (
          <div>
            <LinguaLine><En style={{ fontWeight: 700 }}>{resolve(step.target, vars)}</En>{step.response && <> <En style={{ opacity: 0.85 }}>{resolve(step.response, vars)}</En></>}</LinguaLine>
            {(showHelp || showsHintByDefault(scaffold)) && (
              <div className="rounded-2xl p-4 mb-3 animate-fade-up" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
                <p lang={nativeLang} style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{(step.meaningItems || []).map(meaningOf).join(' · ')}</p>
                {step.explainKey && <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5 }}>{t(step.explainKey)}</p>}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowHelp(h => !h)} className="px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]" style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{showHelp ? t('ep1HideHelp') : t('ep1ShowHelp')}</button>
              <button onClick={advance} className="flex-1 py-2.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]" style={{ background: 'var(--accent)' }}>{t('ep1Continue')}</button>
            </div>
          </div>
        )}

        {/* ---------------- COMPREHENSION ---------------- */}
        {step.type === 'comprehension' && (
          <div className="animate-fade-up">
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{t(step.instructionKey)}</p>
            <div className="rounded-2xl p-3 mb-4" style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)' }}><En style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>{resolve(step.target, vars)}</En></div>
            <div className="flex flex-col gap-2">
              {step.options.map((opt, i) => {
                const chosen = choice === i
                const done = choice != null
                return (
                  <button key={i} type="button" lang={nativeLang} aria-pressed={chosen} disabled={done}
                    onClick={() => {
                      setChoice(i)
                      recordItems([step.itemId].filter(Boolean), { correct: Boolean(opt.correct), independent: false })
                      setLive(opt.correct ? t('ep1Correct') : t('ep1KeepGoing'))
                      setTimeout(advance, 850)
                    }}
                    className="rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all active:scale-[0.99]"
                    style={{ background: done && opt.correct ? 'var(--positive-soft)' : chosen ? 'var(--accent-soft)' : 'var(--surface)', border: `1px solid ${done && opt.correct ? 'var(--positive)' : chosen ? 'var(--accent-tint)' : 'var(--border)'}`, color: 'var(--ink)' }}>
                    {t(opt.key)}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ---------------- CHOICE (most natural, English options) ---------------- */}
        {step.type === 'choice' && (
          <div className="animate-fade-up">
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{t(step.instructionKey)}</p>
            {step.promptEn && <LinguaLine><En style={{ fontWeight: 700 }}>{resolve(step.promptEn, vars)}</En></LinguaLine>}
            <div className="flex flex-col gap-2 mt-2">
              {step.options.map((opt, i) => {
                const chosen = choice === i
                const done = choice != null
                return (
                  <button key={i} type="button" aria-pressed={chosen} disabled={done}
                    onClick={() => {
                      setChoice(i)
                      recordItems([step.itemId].filter(Boolean), { correct: Boolean(opt.correct), independent: false })
                      if (opt.correct) { setLive(t('ep1Correct')); setTimeout(advance, 850) }
                      else { setLive(t('ep1KeepGoing')); setTimeout(() => setChoice(null), 800) }
                    }}
                    className="rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.99]"
                    style={{ background: done && opt.correct ? 'var(--positive-soft)' : chosen && !opt.correct ? 'var(--accent-soft)' : 'var(--surface)', border: `1px solid ${done && opt.correct ? 'var(--positive)' : chosen && !opt.correct ? 'var(--accent)' : 'var(--border)'}` }}>
                    <En style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)' }}>{resolve(opt.textEn, vars)}</En>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ---------------- WORD ORDER ---------------- */}
        {step.type === 'word_order' && (() => {
          const tokens = step.tokens.map(tk => resolve(tk, vars))
          // Shown scrambled — deterministically, so a reload keeps the same
          // arrangement. The answer is still compared against the real order.
          const shown = scrambleTokens(tokens, `${ep.id}:${stepIndex}:${altStep ? 'alt' : 'main'}`)
          return (
            <div className="animate-fade-up">
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>{t(step.instructionKey)}</p>
              <div className="rounded-2xl p-3 mb-3 flex items-center flex-wrap gap-2" style={{ minHeight: 52, background: 'var(--surface-soft)', border: '1px solid var(--accent)' }}>
                {buildOrder.length === 0 && <span lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{t(step.hintKey)}</span>}
                {buildOrder.map((tok, i) => (
                  <button key={i} onClick={() => setBuildOrder(o => o.filter((_, idx) => idx !== i))} className="rounded-xl px-3 py-1.5 text-sm font-bold" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--accent)' }} aria-label={`remove ${tok}`}><En>{tok}</En></button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {shown.map((tok, i) => {
                  const usedCount = buildOrder.filter(x => x === tok).length
                  const totalCount = tokens.filter(x => x === tok).length
                  const spent = usedCount >= totalCount
                  return (
                    <button key={i} disabled={spent} onClick={() => setBuildOrder(o => [...o, tok])} className="rounded-xl px-3.5 py-2 text-sm font-bold transition-all active:scale-[0.98]" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)', opacity: spent ? 0.4 : 1 }}><En>{tok}</En></button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setBuildOrder([])} className="px-4 py-2.5 rounded-2xl text-sm font-semibold" style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{t('ep1Reset')}</button>
                <button disabled={buildOrder.length < tokens.length} onClick={() => {
                  const correct = buildOrder.join(' ') === tokens.join(' ')
                  // An alternative offered after a struggle is support, so a
                  // success here is never counted as independent evidence.
                  recordItems([step.itemId].filter(Boolean), { correct, independent: false })
                  if (correct) { setLive(t('ep1Correct')); advance() } else { setRetry({ explainKey: 'ep1BuildRetry', natural: tokens.join(' ') }); setBuildOrder([]); setLive(t('ep1RetryTitle')) }
                }} className="flex-1 py-2.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]" style={{ background: 'var(--accent)', opacity: buildOrder.length < tokens.length ? 0.5 : 1 }}>{t('ep1Check')}</button>
              </div>
              {retry && <p lang={nativeLang} className="mt-3" style={{ fontSize: '0.8125rem', color: 'var(--accent)', fontWeight: 600 }}>{t(retry.explainKey)} <En style={{ fontWeight: 700 }}>{retry.natural}</En></p>}
            </div>
          )
        })()}

        {/* ---------------- FILL BLANK ---------------- */}
        {step.type === 'fill_blank' && (
          <div className="animate-fade-up">
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>{t(step.instructionKey)}</p>
            <div className="flex items-center gap-2 flex-wrap rounded-2xl p-3 mb-4" style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)' }}>
              <En style={{ fontSize: '1rem', fontWeight: 700 }}>{step.before}</En>
              <input value={fillValue} onChange={e => setFillValue(e.target.value)} lang="en" dir="ltr" placeholder={t(step.placeholderKey || 'ep1TypeName')} aria-label={t(step.instructionKey)} className="chat-input rounded-xl px-3 py-2 text-sm" style={{ flex: 1, minWidth: 120, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }} />
              <En style={{ fontSize: '1rem', fontWeight: 700 }}>{step.after}</En>
            </div>
            {/* The example must match what is being asked for: a place for the
                place step, something the learner enjoys for the likes step. */}
            {showsHintByDefault(scaffold) && <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: 12 }}>{t(step.hintKey)} <En style={{ fontWeight: 700 }}>{resolve(`${step.before} ${fillExample(step)}${step.after}`, vars)}</En></p>}
            <button disabled={!fillValue.trim()} onClick={() => {
              // A capture step stores what the learner typed (e.g. their place)
              // so later steps and model answers can use it. Never validated.
              if (step.captureFact) {
                const value = fillValue.trim()
                modelRef.current.facts = { ...(modelRef.current.facts || {}), [step.captureFact]: value }
                /*
                 * Also kept as a proper fact, so Lingua can bring it back later
                 * ("last time you said you like music"). Only what the learner
                 * volunteered here — never a corrected mistake.
                 */
                recordLearnerFact(modelRef.current, {
                  type: step.captureFact === 'place' ? 'place' : 'like',
                  value, sourceEpisodeId: ep.id,
                })
                saveLearnerModel(modelRef.current)
                if (step.captureFact === 'place') setPlace(value)
              }
              /*
               * A gap with a right answer is checked; a capture gap is not,
               * because there is nothing to check it against.
               *
               * `alternatives` exists because some frames have more than one true
               * filler: "I ____ at home" is completed truthfully with either
               * `work` or `study`, and marking one of them wrong would teach the
               * learner that their own life is a mistake. `expects` stays the one
               * shown in the hint and in the correction.
               */
              if (step.expects) {
                const typed = fillValue.trim().toLowerCase().replace(/[^\w'’\s]/g, '')
                const want = resolve(step.expects, vars).toLowerCase()
                const accepted = [want, ...(step.alternatives || []).map(alt => resolve(alt, vars).toLowerCase())]
                const correct = accepted.some(one => typed === one || typed === one.replace(/'/g, '’'))
                recordItems([step.itemId].filter(Boolean), { correct, independent: false })
                if (!correct) {
                  // its own wording: a gap has no word ORDER to get wrong
                  setRetry({ explainKey: 'ep1FillRetry', natural: resolve(`${step.before} ${want}${step.after}`, vars) })
                  setFillValue('')
                  setLive(t('ep1RetryTitle'))
                  return
                }
                setRetry(null)
              } else {
                recordItems([step.itemId].filter(Boolean), { correct: true, independent: false })
              }
              setLive(t('ep1Correct')); advance()
            }} className="w-full py-2.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]" style={{ background: 'var(--accent)', opacity: fillValue.trim() ? 1 : 0.5 }}>{t('ep1Check')}</button>
            {retry && <p lang={nativeLang} className="mt-3" style={{ fontSize: '0.8125rem', color: 'var(--accent)', fontWeight: 600 }}>{t(retry.explainKey)} <En style={{ fontWeight: 700 }}>{retry.natural}</En></p>}
          </div>
        )}

        {/* ---------------- FREE REPLY / RECALL ---------------- */}
        {(step.type === 'free_reply' || step.type === 'recall') && (
          <div className="animate-fade-up">
            {step.sceneEn
              ? <LinguaLine><En style={{ fontWeight: 700 }}>{resolve(step.sceneEn, vars)}</En></LinguaLine>
              : step.promptEn
                ? <LinguaLine><En style={{ fontWeight: 700 }}>{resolve(step.promptEn, vars)}</En></LinguaLine>
                : (
                  <div className="flex items-center gap-2 mb-3">
                    <ChattoMascot mood="supportive" size={40} intensity="support" decorative />
                    <p lang={nativeLang} style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>{t(step.instructionKey)}</p>
                  </div>
                )}
            {(step.promptEn || step.sceneEn) && <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: 10 }}>{t(step.instructionKey)}</p>}

            {/*
              * Being corrected looks the same everywhere in the product: the way it
              * is usually said, one calm line about why, and an invitation to try
              * again. Same `.correction-card` as the conversation uses — not a
              * warning panel, and not a different design for the same event.
              */}
            {retry && (
              <div role="status" className="correction-card mb-3">
                <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-strong)', marginBottom: 3 }}>{t('ep1RetryTitle')}</p>
                {retry.explainKey && <p lang={nativeLang} className="correction-why" style={{ marginBottom: 5 }}>{t(retry.explainKey)}</p>}
                {retry.natural && <En className="correction-natural" style={{ fontSize: '0.9375rem' }}>{retry.natural}</En>}
                {retry.promptKey && <p lang={nativeLang} className="correction-why" style={{ marginTop: 6 }}>{t(retry.promptKey)}</p>}
              </div>
            )}

            {step.suggestionEn && ((showsModelAnswer(scaffold) && !unaidedAttempt) || retry) && !reviewing && (
              <button type="button" onClick={() => { setReply(resolve(step.suggestionEn, vars)); setUsedSuggestion(true); signal('assistance') }} className="rounded-full px-3.5 py-1.5 text-xs font-bold mb-3 transition-all active:scale-[0.98]" style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)', color: 'var(--ink)' }}>
                {t('ep1UseSuggestion')}: <En>{resolve(step.suggestionEn, vars)}</En>
              </button>
            )}

            {/* Offered only after two real attempts, and only where an equivalent
                activity exists. It changes HOW the sentence is practised, never
                whether it is practised. */}
            {step.suggestionEn && attemptsRef.current >= 2 && !reviewing && (
              <button type="button" onClick={switchActivity} className="rounded-full px-3.5 py-1.5 text-xs font-bold mb-3 ms-2 transition-all active:scale-[0.98]"
                style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--accent)' }}>
                {t('altPractiseAnotherWay')}
              </button>
            )}

            {/* calm "Lingua is reviewing" state — Lingua evaluates, never Chatto */}
            {reviewing && (
              <div role="status" aria-live="polite" className="flex items-center gap-2 mb-3 animate-fade-up">
                <LinguaAvatar size={28} online />
                <span lang={nativeLang} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent)' }}>{t('epEvaluating')}</span>
              </div>
            )}

            <div className="flex items-end gap-2 rounded-2xl p-2.5" aria-busy={reviewing} style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)', opacity: reviewing ? 0.7 : 1 }}>
              <input ref={replyInputRef} value={reply} onChange={e => setReply(e.target.value)} disabled={reviewing} lang="en" dir="ltr" onKeyDown={e => { if (e.key === 'Enter' && reply.trim() && !reviewing) submitFree(step.evalKind, step.itemIds, { fromSuggestion: answerWasShown() }) }} placeholder={t('ep1TypeReply')} aria-label={t(step.instructionKey)} className="chat-input flex-1 bg-transparent text-sm" style={{ color: 'var(--ink)', border: 'none', outline: 'none', padding: '7px 4px' }} />
              <button onClick={() => submitFree(step.evalKind, step.itemIds, { fromSuggestion: answerWasShown() })} disabled={!reply.trim() || reviewing} className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all active:scale-[0.98]" style={{ background: reply.trim() && !reviewing ? 'var(--info)' : 'var(--border)' }}>{t('ep1Send')}</button>
            </div>
            {praise && <p role="status" lang={nativeLang} className="mt-2" style={{ fontSize: '0.8125rem', color: 'var(--positive)', fontWeight: 700 }}>{t(praise)}</p>}
          </div>
        )}

        {/* ---------------- COMPLETION ---------------- */}
        {/* ---------------- MINI STORY ----------------
            The very same component a daily session renders. An episode owns the
            run, so it hands the story its support level and run mode; the story
            keeps its own turn, branch and persistence, and finishing it simply
            advances the episode. There is no second story engine. */}
        {step.type === 'mini_story' && (
          <MiniStory
            key={`${ep.id}:${stepIndex}`}
            block={{ id: `${ep.id}:story`, objective: step.storyObjective, type: 'episode_story' }}
            vars={vars}
            scaffoldLevel={scaffold}
            runMode={run?.mode || 'first_run'}
            onDone={(branchId) => {
              /*
               * Recorded exactly the way a branching reply is: on the run, and
               * once in the facts by the run that counted, so a later replay can
               * offer the ending the learner has not seen.
               */
              if (branchId) {
                runRef.current = updateActiveRun(modelRef.current, { branchId }) || runRef.current
                if (runEarnsReward(run?.mode) && !modelRef.current.facts?.[`branch:${ep.id}`]) {
                  modelRef.current.facts = { ...(modelRef.current.facts || {}), [`branch:${ep.id}`]: branchId }
                }
                saveLearnerModel(modelRef.current)
              }
              advance()
            }}
          />
        )}

        {step.type === 'completion' && (
          <div className="animate-scale-in rounded-3xl p-6 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--positive)', boxShadow: '0 0 0 3px var(--positive-soft)' }}>
            <div className="flex justify-center"><ChattoMascot mood="celebrating" size="medium" variant="green" intensity="celebrate" /></div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--positive)', marginTop: 12 }}>{t('ep1CanDoBadge')}</p>
            <h2 style={{ fontWeight: 800, fontSize: '1.1875rem', color: 'var(--ink)', margin: '6px 0 8px' }}>{t(step.titleKey)}</h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', lineHeight: 1.55, marginBottom: 16 }}>{t(step.bodyKey)}</p>
            <div className="rounded-2xl px-4 py-3 mb-5 inline-flex items-center gap-2" style={{ background: 'var(--positive-soft)', border: '1px solid var(--positive)' }}>
              <span style={{ fontSize: 16 }}>✓</span>
              {/* Practice is worth doing and worth nothing extra. Announcing
                  "+55 XP" at the end of a replay was simply untrue. */}
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)' }}>{t(step.canDoNameKey)}{willReward ? ` · +${ep.xp} XP` : ''}</span>
            </div>
            {/* Only after a long conversational episode, never after every card. */}
            {longRoleplay && <FormatFeedback format="roleplay" momentId={ep.id} />}
            <button onClick={finish} className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:-translate-y-px active:scale-[0.98]" style={{ background: 'var(--positive)' }}>{t(step.ctaKey || 'ep1CloseCta')}</button>
          </div>
        )}
      </div>
    </div>
  )
}

/*
 * EpisodeShell — the one production path from an episode id to a playing episode.
 *
 * Before this existed, the player read its episode from `episodes/index.js`, a
 * synchronous registry that knows Pre-A1 and nothing else. A1 arc 1 could be
 * rendered only by substituting that module, which proved the component works and
 * proved the product could not reach it. There were two registries: the resolver,
 * which knew about levels and arcs and had no consumer, and the static import,
 * which had the consumer and knew about one level.
 *
 * Now there is one. `loadEpisodeContent` answers both halves in order:
 *
 *   gating          may this be opened? — synchronous, metadata only. A learner
 *                   asking for a closed level is refused before any import.
 *   content         the arc's own chunk, imported on demand. Home and the practice
 *                   listing never reach this line, so they never fetch it.
 *
 * GATING AND CONTENT RESOLUTION ARE DIFFERENT RESPONSIBILITIES. `forLearner`
 * defaults to true, so every product call site is gated; tooling and QA pass
 * false to run an episode of a level that is built but not open. That argument is
 * the only door, and a check asserts no product file passes it.
 *
 * Four states, and none of them is a blank screen: loading, a load that failed
 * (retryable, because a chunk can fail on a flaky network), a refusal (not
 * retryable, because it is a decision), and playing.
 */
export function EpisodeShell({ episodeId, forLearner = true, ...runnerProps }) {
  const { t } = useApp()
  const content = useLazyContent(
    () => loadEpisodeContent({ episodeId, forLearner }),
    [episodeId, forLearner],
    // a named refusal is the resolver's answer, not a transport problem
    (error) => (error instanceof EpisodeContentError ? error.reason : null),
  )

  if (content.status === 'loading') return <ScreenFallback label={t('screenLoading')} />
  if (content.status === 'failed') {
    return <ScreenError errorLabel={t('screenLoadFailed')} retryLabel={t('screenLoadRetry')} onRetry={content.retry} />
  }
  if (content.status === 'refused') {
    /*
     * Unavailable or unknown. The learner is told the episode cannot be opened —
     * never which ids exist behind a closed level, which is why the reason is not
     * printed. `episodeUnavailable` is the same message for both, on purpose.
     */
    return (
      <div role="alert" className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-10 text-center"
        style={{ background: 'var(--bg)', minHeight: 180 }}>
        <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>{t('episodeUnavailable')}</p>
      </div>
    )
  }
  return <EpisodeRunner episode={content.value} episodeId={episodeId} {...runnerProps} />
}

export default EpisodeShell
