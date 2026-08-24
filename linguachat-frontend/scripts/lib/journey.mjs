/*
 * journey — play the whole curriculum the way the product does.
 *
 * Not a fixture. Every episode is walked step by step through the REAL episode
 * definitions, the REAL evaluators, the REAL scaffolding and the REAL learner
 * model, in the same order and with the same recording calls `EpisodeShell`
 * makes. Nothing here sets mastery, marks a can-do, or skips a step: if a
 * learner cannot reach a state by playing, this harness cannot reach it either.
 *
 * That is the entire point. A readiness rule that only a hand-built model can
 * satisfy is a rule nobody can ever meet, and the only way to find one is to
 * play the curriculum honestly and see what it produces.
 *
 * Two learners are modelled:
 *
 *   strong    types their own answers, taps the model answer only where the
 *             episode gives no other way through, retries rarely
 *   assisted   reaches for the suggestion whenever one is on screen, needs a
 *             second attempt now and then, and finishes everything correctly
 *
 * The clock is injected. Reviews and readiness both depend on time, and a
 * harness that mixes a fixed fixture date with `Date.now()` measures the gap
 * between them instead of the rule — which is exactly the bug that cost an
 * afternoon in the previous sprint.
 */
import { ARC, getEpisode as getPreA1Episode } from '../../src/learning/episodes/index.js'
import { getA1Arc1Episode } from '../../src/learning/episodes/a1Arc1.js'
import { getA1Arc2Episode } from '../../src/learning/episodes/a1Arc2.js'
import { getA1Arc3Episode } from '../../src/learning/episodes/a1Arc3.js'
import { getA1Arc4Episode } from '../../src/learning/episodes/a1Arc4.js'
import { getA1Arc5Episode } from '../../src/learning/episodes/a1Arc5.js'
import { getA1Arc6Episode } from '../../src/learning/episodes/a1Arc6Content.js'
import { getA1Arc7Episode } from '../../src/learning/episodes/a1Arc7Content.js'

/*
 * The harness plays any runtime episode, whatever level it belongs to. Content is
 * still one module per arc — this only means the harness can hold more than one at
 * a time, which is exactly the difference between tooling and the product.
 */
/*
 * Every level and arc with runtime content. Arc 3 was imported here when it
 * landed and never added to this chain, so the harness could not play it —
 * which is why a journey through arcs 3 and 4 reported an unknown episode.
 * Arc 5 (`paying_and_choosing`) had the same gap: its module was never added to
 * this chain, so `playEpisode(model, 'more_than_ten', ...)` threw `unknown
 * episode` — found by LC-PED-001, which needs every runtime arc playable.
 * Arcs 6/7 (`what_you_can_do`/`making_arrangements`) are added by LC-PED-002,
 * the same way, now that they are implemented and integrated runtime content.
 */
const getEpisode = (id) => getPreA1Episode(id) || getA1Arc1Episode(id) || getA1Arc2Episode(id)
  || getA1Arc3Episode(id) || getA1Arc4Episode(id) || getA1Arc5Episode(id)
  || getA1Arc6Episode(id) || getA1Arc7Episode(id)
import { evaluateFree } from '../../src/learning/engine/responseEvaluation.js'
import { getStory, storyTurns, storyBranches, turnText } from '../../src/learning/engine/miniStory.js'
import {
  recordItemAttempt, recordItemSeen, recordCanDoAttempt, setEpisodeState, getEpisodeState,
} from '../../src/learning/engine/learnerModel.js'
import {
  beginEpisodeRun, completeEpisodeRun, updateActiveRun, runEarnsReward,
} from '../../src/learning/engine/episodeRuns.js'
import {
  deriveInitialScaffold, updateScaffoldAfterTurn, evidenceKindForStep,
  isIndependentEvidence, showsModelAnswer,
} from '../../src/learning/engine/scaffolding.js'
import {
  recordLearnerFact, captureStatedLifeFact, captureStatedUsualTime,
} from '../../src/learning/engine/learnerFacts.js'
import { SEED_VOCAB_BY_ID } from '../../src/data/vocabulary.js'
import { buildSessionPlan, repairKindForItem } from '../../src/learning/engine/session.js'
import { coreItemsOfIntent } from '../../src/learning/curriculum/preA1Map.js'
import { derivePreA1Readiness, readinessFocus } from '../../src/learning/curriculum/readiness.js'
import { reconcileLevelMilestones } from '../../src/learning/curriculum/graduation.js'

export const NAME = 'Sebastian'
/* the person arc 3 introduces; a name so the frame has somebody in it */
const PARTNER_IN_ARC3 = 'Ana'
export const PLACE = 'Bogotá'

/* The English a learner types, per objective. Canonical, never a paraphrase. */
const ANSWERS = {
  introduction: `Hi, I'm ${NAME}.`,
  ask_name: "What's your name?",
  nice_to_meet: 'Nice to meet you too.',
  ask_wellbeing: 'How are you?',
  answer_wellbeing: "I'm good.",
  reciprocal_question: 'And you?',
  ask_origin: 'Where are you from?',
  answer_origin: `I'm from ${PLACE}.`,
  full_intro_conversation: `Hi, I'm ${NAME}. How are you?`,
  /* A1 arc 1: the frame the arc teaches, and the question it teaches back */
  state_life_fact: 'I work at home.',
  ask_life_fact: 'Do you work?',
  /* A1 arc 2: the routine frame. A time is added by `answerFor` when the step asks. */
  state_routine: 'I usually get up.',
  /* A1 arc 3: presenting a person, and saying one thing about them */
  introduce_person: `This is my friend ${PARTNER_IN_ARC3}.`,
  state_person_fact: 'She is a student.',
  /* A1 arc 4: the question, the answer, and the one that moves */
  ask_location: 'Where is the toilet?',
  state_location: "It's next to the bag.",
  ask_transport: 'How do I get to the station?',

  express_like: 'I like music.',
  express_dislike: "I don't like coffee.",
  ask_preference: 'What do you like?',
  yes_no_preference: 'Yes, I do.',
  express_want: 'I want water.',
  express_need: 'I need help.',
  ask_want: 'Do you want water?',
  accept_offer: 'Yes, please.',
  decline_offer: 'No, thank you.',
  simple_plan_conversation: 'I like music. Do you want to listen to music?',
  polite_request: 'Can I have water, please?',
  thank_service: 'Thank you.',
  respond_anything_else: 'No, thank you.',
  finish_order: 'That’s all, thanks.',
  cafe_order_conversation: 'Can I have water, please? That’s all, thanks.',
  close_encounter: 'Bye.',
  ask_what_thing: "What's this?",
  /* A1 arc 6: ability, both directions, and asking someone else's */
  ask_ability: 'Can you swim?',
  ask_price: 'How much is it?',
}
const REPAIR = {
  signal_nonunderstanding: "I don't understand.",
  repeat: 'Can you repeat, please?',
  slow_down: 'Please speak slowly.',
  /* arc 2's fourth strategy: take one word out and keep going */
  ask_meaning: 'What does “late” mean?',
  /* arc 6's fifth strategy: a repair_request subtype, reference-implemented
   * in `levels/a1/evaluators.js`'s `evaluateAskHowToSay` and wired into the
   * shared `evaluateRepairRequest` */
  ask_how_to_say: 'How do you say that in English?',
}
const QUANTITY = {
  bare: (step) => `${step.count === 3 ? 'Three' : 'Two'}.`,
  with_object: (step) => `${step.count === 3 ? 'Three' : 'Two'} ${step.thingId === 'sandwich' ? 'sandwiches' : 'books'}.`,
  polite_request: (step) => `Can I have two ${step.thingId === 'sandwich' ? 'sandwiches' : 'books'}, please?`,
}

export function answerFor(step) {
  if (step.evalKind === 'repair_request') return REPAIR[step.repairKind] || REPAIR.signal_nonunderstanding
  /*
   * A1 arc 2's subtype. The step says which kind of "when" it wants, so the
   * canonical answer carries it — a routine turn asking for an hour must be
   * answered with an hour, exactly as the product demands.
   */
  if (step.evalKind === 'state_routine') {
    if (step.timeForm === 'clock') return 'I usually get up at seven.'
    if (step.timeForm === 'part_of_day') return 'I usually work in the morning.'
    return ANSWERS.state_routine
  }
  if (step.evalKind === 'use_quantity') return (QUANTITY[step.quantityForm] || QUANTITY.bare)(step)
  if (step.evalKind === 'identify_thing') return `It's a ${step.thingId || 'book'}.`
  /*
   * A1 arc 6's `state_ability`: the step names which polarity it wants, same
   * as `state_routine`'s subtype above — a step with no declared `abilityForm`
   * (a free-choice turn) accepts either, so the positive default is safe there.
   */
  if (step.evalKind === 'state_ability') return step.abilityForm === 'negative' ? "I can't dance." : 'I can swim.'
  /*
   * A1 arc 7's `arrange_meeting`: the step names which stage it wants —
   * `propose` (day+time), `place`, or `confirm` (all three together, the
   * arc's headline evidence).
   */
  if (step.evalKind === 'arrange_meeting') {
    if (step.arrangeStage === 'place') return "Let's meet at the station."
    if (step.arrangeStage === 'confirm') return "Let's meet on Friday at seven at the station."
    return "Let's meet on Friday at seven."
  }
  const answer = ANSWERS[step.evalKind]
  if (!answer) throw new Error(`journey: no answer for ${step.evalKind}`)
  return answer
}

/* What a learner types on a gap, a build or a capture — never validated blind. */
function fillFor(step) {
  if (step.expects) return step.expects
  if (step.captureFact === 'place') return PLACE
  if (step.captureFact === 'likes') return 'music'
  return NAME
}

const DAY = 24 * 60 * 60 * 1000

/*
 * One episode, played.
 *
 * `profile.usesSuggestion(step)` decides whether the learner reaches for the
 * model answer on a productive turn, and `profile.retries(step)` whether they
 * get it wrong once first. Everything else follows the shell exactly.
 */
export function playEpisode(model, episodeId, {
  profile, atMs, mode = null, wantsOtherBranch = false, trace = null, unaidedAttempt = false,
  /*
   * Three optional hooks, each defaulting to the exact behaviour above so every
   * existing caller (the two-learner Pre-A1 journey, every `check-a1-arc*`
   * curriculum check) is unaffected:
   *
   *   answerOverride(step)  what a learner would actually type, when it needs to
   *                         be something other than the single canonical answer
   *                         `answerFor` returns — a natural paraphrase, or a
   *                         value from a novel context nothing in the episode
   *                         itself ever names, so a pass proves the evaluator
   *                         judges structure rather than a memorised string.
   *   ctxOverride(step)     extra evaluation context to merge over `ctxFor`'s
   *                         own — for the same novel-context substitutions.
   *   wrongText(step)       what a first, wrong attempt types before recovering
   *                         with the real answer, when a genuine near-miss or a
   *                         nonsense reply is being exercised instead of the
   *                         fixed 'hmm' every profile used before this.
   */
  answerOverride = null, ctxOverride = null, wrongText = null,
} = {}) {
  const ep = getEpisode(episodeId)
  if (!ep) throw new Error(`journey: unknown episode ${episodeId}`)

  const run = beginEpisodeRun(model, ep.id, {
    source: 'practice', wantsOtherBranch, atMs,
  })
  let scaffold = deriveInitialScaffold({
    learnerModel: model, episode: ep, runMode: run.mode, atMs,
  })
  /*
   * What the shell persists on every turn: the run's own support state, and the
   * planner's rough read of how supported this learner currently is. Leaving the
   * second one out made the harness diverge from the product in a way that mattered
   * — with no level recorded anywhere the planner assumes maximum fragility, so a
   * learner who had finished the whole level was still never offered anything
   * unaided, and nothing in the journey could ever notice.
   */
  const persistScaffold = (extra = {}) => {
    updateActiveRun(model, { scaffold, ...extra })
    model.scaffoldByEpisode = { ...(model.scaffoldByEpisode || {}), [ep.id]: scaffold.currentLevel }
  }

  persistScaffold()
  const initialLevel = scaffold.currentLevel
  let assistance = 0
  let retries = 0
  let independentEvidence = false
  let branchId = null

  const exercised = new Set()

  const productive = (step, { storyTurn = false } = {}) => {
    const evidenceKind = evidenceKindForStep(step)
    if (step.evalKind) exercised.add(step.evalKind)
    /* on an unaided attempt the product offers nothing to copy, so neither does this */
    const usesSuggestion = !unaidedAttempt
      && profile.usesSuggestion({ step, scaffold: scaffold.currentLevel })
      && (Boolean(step.suggestionEn) || storyTurn)
    /*
     * A retry is a real wrong answer first: the model records the failure, the
     * support engine sees it, and only then does the learner get it right.
     */
    if (profile.retries({ step, scaffold: scaffold.currentLevel })) {
      retries += 1
      const wrongReply = wrongText ? wrongText(step) : 'hmm'
      const wrongCtx = { ...ctxFor(step, model, false), ...(ctxOverride ? ctxOverride(step) : {}) }
      const wrong = evaluateFree(step.evalKind, wrongReply, wrongCtx)
      if (wrong.completedObjective) throw new Error(`journey: "${wrongReply}" should never pass ${step.evalKind}`)
      if (!wrong.retryRequired) throw new Error(`journey: a rejected ${step.evalKind} reply must ask for another go`)
      for (const id of step.itemIds || []) {
        recordItemAttempt(model, id, { correct: false, independent: false, evidenceKind, atMs })
      }
      scaffold = updateScaffoldAfterTurn(scaffold, { correct: false, evidenceKind, retried: true })
      persistScaffold({ retriedSteps: retries })
    }

    const independent = isIndependentEvidence({ step, assistanceUsed: usesSuggestion, correct: true })
    const reply = answerOverride ? answerOverride(step) : answerFor(step)
    const ctx = { ...ctxFor(step, model, independent), ...(ctxOverride ? ctxOverride(step) : {}) }
    const result = evaluateFree(step.evalKind, reply, ctx)
    if (!result.completedObjective) {
      throw new Error(`journey: ${ep.id}/${step.evalKind} rejected "${reply}" → ${result.errorType}`)
    }
    /*
     * The same call the player makes, so a fact the blueprint asks an arc to
     * capture is captured here too. Without this the capture rule would live only
     * inside a React component and no headless check could reach it.
     */
    const capturePayload = {
      evalKind: step.evalKind, reply, modelAnswer: usesSuggestion ? (step.suggestionEn || '') : '',
      sourceEpisodeId: ep.id, atMs,
    }
    captureStatedLifeFact(model, capturePayload)
    captureStatedUsualTime(model, capturePayload)
    for (const id of step.itemIds || []) {
      recordItemAttempt(model, id, { correct: true, independent, evidenceKind, atMs })
    }
    if (independent) {
      independentEvidence = true
      updateActiveRun(model, { independentEvidence: true })
    }
    if (usesSuggestion) {
      assistance += 1
      updateActiveRun(model, { assistanceUsed: assistance })
    }
    scaffold = updateScaffoldAfterTurn(scaffold, {
      correct: true, evidenceKind, assistanceUsed: usesSuggestion,
    })
    persistScaffold()
  }

  for (let i = 0; i < ep.steps.length; i++) {
    const step = ep.steps[i]
    setEpisodeState(model, ep.id, { status: 'in_progress', stepIndex: i })

    if (step.type === 'free_reply' || step.type === 'recall') {
      productive(step)
      if (step.branchOn === 'accept_decline') {
        branchId = 'accept'
        updateActiveRun(model, { branchId })
        if (runEarnsReward(run.mode) && !model.facts?.[`branch:${ep.id}`]) {
          model.facts = { ...(model.facts || {}), [`branch:${ep.id}`]: branchId }
        }
      }
      if (step.captureFact) {
        recordLearnerFact(model, { type: step.captureFact === 'place' ? 'place' : 'like', value: fillFor(step), sourceEpisodeId: ep.id, atMs })
      }
    } else if (step.type === 'comprehension' || step.type === 'choice') {
      if (step.itemId) {
        recordItemAttempt(model, step.itemId, {
          correct: true, independent: false, evidenceKind: evidenceKindForStep(step), atMs,
        })
      }
      scaffold = updateScaffoldAfterTurn(scaffold, { correct: true, evidenceKind: evidenceKindForStep(step) })
      persistScaffold()
    } else if (step.type === 'word_order' || step.type === 'fill_blank') {
      if (step.captureFact) {
        recordLearnerFact(model, { type: step.captureFact === 'place' ? 'place' : 'like', value: fillFor(step), sourceEpisodeId: ep.id, atMs })
      }
      if (step.itemId) {
        recordItemAttempt(model, step.itemId, {
          correct: true, independent: false, evidenceKind: evidenceKindForStep(step), atMs,
        })
      }
      scaffold = updateScaffoldAfterTurn(scaffold, { correct: true, evidenceKind: evidenceKindForStep(step) })
      persistScaffold()
    } else if (step.type === 'mini_story') {
      const story = getStory(step.storyObjective)
      const branches = storyBranches(story)
      branchId = wantsOtherBranch ? branches[1] : branches[0]
      for (const turn of storyTurns(story)) {
        if (turn.kind !== 'reply') continue
        /*
         * Mirrors `MiniStory.jsx`'s own `evalCtx` construction: a turn that
         * declares a subtype (`arrangeStage`, so far — arc 7's confirm turn)
         * must carry it through, or the evaluator falls back to its default
         * ('propose', its least strict stage) and the harness would prove a
         * turn easier than the product actually asks for. Found by LC-PED-002
         * extending this harness to arc 7: the story's `confirm` turn threw
         * `pedagogyBank: no variant bank for arrange_meeting/` because this
         * synthetic step silently dropped the field.
         */
        productive({
          type: 'free_reply', evalKind: turn.evalKind, suggestionEn: turn.suggestionEn,
          itemIds: turn.itemIds || [], format: 'mini_story',
          ...(turn.arrangeStage ? { arrangeStage: turn.arrangeStage } : {}),
          ...(turn.abilityForm ? { abilityForm: turn.abilityForm } : {}),
          ...(turn.praisePrefix ? { praisePrefix: turn.praisePrefix } : {}),
        }, { storyTurn: true })
      }
      updateActiveRun(model, { branchId })
      if (runEarnsReward(run.mode) && !model.facts?.[`branch:${ep.id}`]) {
        model.facts = { ...(model.facts || {}), [`branch:${ep.id}`]: branchId }
      }
    } else if (step.type === 'model') {
      for (const id of step.meaningItems || []) recordItemSeen(model, id, atMs)
    }
  }

  /* finish(), exactly as the shell does it */
  const state = getEpisodeState(model, ep.id)
  const firstCompletion = !state.awarded
  recordCanDoAttempt(model, ep.canDoId, { success: true, independent: independentEvidence, context: ep.id, atMs })
  setEpisodeState(model, ep.id, {
    status: 'completed', stepIndex: ep.steps.length - 1,
    ...(firstCompletion ? { awarded: true } : {}),
  })
  /*
   * What `awardEpisode` does in the app: meeting an episode's language is
   * recorded at `seen`, which is what the Memory Garden reads. Without it the
   * journey grew a Garden the learner model had never heard of.
   */
  if (firstCompletion) {
    for (const id of ep.gardenItems || []) {
      if (SEED_VOCAB_BY_ID[id]) recordItemSeen(model, id, atMs)
    }
  }
  const finished = completeEpisodeRun(model, {
    independentEvidence, branchId, rewarded: firstCompletion, atMs,
  })

  const record = {
    episodeId: ep.id,
    /* every objective this run evaluated, so reuse across arcs is checkable */
    objectives: [...exercised],
    mode: run.mode,
    initialScaffold: initialLevel,
    finalScaffold: scaffold.currentLevel,
    reasonCodes: scaffold.reasonCodes,
    assistance,
    retries,
    independentEvidence,
    branchId,
    rewarded: Boolean(finished?.rewarded),
    xp: firstCompletion ? ep.xp : 0,
  }
  if (trace) trace.push(record)
  return record
}

/* The evaluation context the shell builds for a step. */
function ctxFor(step, model, independent) {
  return {
    name: NAME,
    place: PLACE,
    independent,
    targetNoun: 'music',
    ...(step.thingId ? { targetThing: step.thingId } : {}),
    ...(step.repairKind ? { repairKind: step.repairKind } : {}),
    ...(step.meaningWord ? { meaningWord: step.meaningWord } : {}),
    ...(step.timeForm ? { timeForm: step.timeForm } : {}),
    /* arc 3's turns are about a third person, so the evaluator needs to know who */
    partner: PARTNER_IN_ARC3,
    ...(step.quantityForm ? { quantityForm: step.quantityForm } : {}),
    /* arc 6/7's own subtype fields — `evaluateStateAbility`/`evaluateArrangeMeeting` */
    ...(step.abilityForm ? { abilityForm: step.abilityForm } : {}),
    ...(step.arrangeStage ? { arrangeStage: step.arrangeStage } : {}),
    ...(step.praisePrefix ? { praisePrefix: step.praisePrefix } : {}),
    ...(Number.isInteger(step.count) ? { targetCount: step.count } : {}),
    turnContext: { linguaSaid: step.promptEn || step.sceneEn || '' },
  }
}

export const STRONG = {
  name: 'strong',
  /*
   * Types their own answer wherever the episode leaves room for one. A closed
   * step has no suggestion to reach for, so this only ever applies to open
   * turns — which is where independence is measured.
   */
  usesSuggestion: () => false,
  retries: () => false,
}

export const ASSISTED = {
  name: 'assisted',
  /*
   * Reaches for the model answer whenever one is offered. Not a bad learner:
   * everything is answered correctly in the end, and closed steps are as right
   * as anyone's. What they do not yet do is produce the language unaided.
   */
  /*
   * Takes the help when the help is there. At low support the product does not
   * show the model answer, so there is nothing to lean on — which is exactly the
   * moment this learner has to show what they can do on their own.
   */
  usesSuggestion: ({ step, scaffold }) => showsModelAnswer(scaffold)
    && (Boolean(step.suggestionEn) || step.format === 'mini_story'),
  retries: ({ step }) => step.type === 'recall' && !step.review,
}

/*
 * The reviews the app would have offered that day, played.
 *
 * Only review blocks: the point is to keep the queue honest, not to consolidate
 * ahead of time. Returns how many were done so a journey can report it.
 */
export function playDueReviews(model, { profile, atMs } = {}) {
  // the session the product offers by default, not the shortest one
  const plan = buildSessionPlan(model, ARC, { durationMode: 'standard', atMs, learnerKey: 'journey' })
  const reviews = plan.blocks.filter(b => b.type === 'review' && b.objective)
  for (const block of reviews) playBlock(model, block, { profile, atMs })
  return reviews.length
}

/*
 * Play the whole curriculum, one episode a day, in order — with the day's
 * review before it, the way a learner who opens the app actually meets them.
 */
export function playCurriculum(model, { profile, startMs, trace = [], withReviews = true, upTo = null } = {}) {
  let at = startMs
  let reviewsDone = 0
  /* `upTo` stops part way, for the many things that are only true mid-level */
  for (const ep of (upTo ? ARC.slice(0, upTo) : ARC)) {
    if (withReviews) reviewsDone += playDueReviews(model, { profile, atMs: at })
    playEpisode(model, ep.id, { profile, atMs: at, trace })
    at += DAY
  }
  return { trace, endedAt: at, reviewsDone }
}

export { DAY }

/* ------------------------------------------------------------ session blocks -*/

/*
 * One practice block, played exactly as `SessionRunner` records it.
 *
 * Mirrored deliberately rather than imported: the runner is a React component,
 * and what matters here is that the RECORDING rules are the same — which items,
 * which evidence kind, which can-do, and whether the learner leaned on the
 * model answer. If those ever drift, the consolidation journey stops proving
 * anything, so `check-pre-a1-assisted-journey` asserts the rule in both places.
 */
export function playBlock(model, block, { profile, atMs } = {}) {
  const kind = block.objective
  if (!kind) return { blockId: block.id, played: false, reason: 'no objective' }

  if (block.type === 'integrated_practice' || block.type === 'start_episode' || block.type === 'continue_episode') {
    const record = playEpisode(model, block.payload.episodeId, {
      profile, atMs, unaidedAttempt: Boolean(block.payload?.unaidedAttempt),
    })
    return { blockId: block.id, played: true, kind: 'episode', episodeId: block.payload.episodeId, independent: record.independentEvidence }
  }

  const format = block.format || 'free_reply'
  const stepShape = { type: 'free_reply', format }
  const evidenceKind = evidenceKindForStep(stepShape)
  const explicit = block.payload?.itemId ? [block.payload.itemId] : (block.payload?.itemIds || null)
  const core = coreItemsOfIntent(kind)
  const items = explicit || (core.length <= 1 ? core : core.slice(0, 1))

  /*
   * A closed format shows the answer in the material, so it is assisted however
   * confidently it is completed — the same rule the shell applies.
   */
  const closed = ['choice', 'word_order', 'fill_blank', 'guided_reply'].includes(format)
  /*
   * On a block that exists to get an unaided production the runner offers no
   * suggestion, so there is nothing here to lean on either — the same screen,
   * the same evidence.
   */
  const offersSuggestion = block.payload?.requiredPractice !== 'recall'
  const usesSuggestion = closed || (offersSuggestion
    && profile.usesSuggestion({ step: { ...stepShape, suggestionEn: 'shown' }, scaffold: planScaffold(model) }))
  const independent = isIndependentEvidence({ step: stepShape, assistanceUsed: usesSuggestion, correct: true })

  const answer = answerFor({ evalKind: kind, repairKind: repairKindForBlock(block, kind), quantityForm: 'bare', thingId: 'book', count: 2 })
  const result = evaluateFree(kind, answer, {
    name: NAME, place: PLACE, independent, targetNoun: 'music', targetThing: 'book',
    quantityForm: 'bare', targetCount: 2, repairKind: repairKindForBlock(block, kind),
  })
  if (!result.completedObjective) {
    throw new Error(`journey: block ${block.id} (${kind}) rejected "${answer}" → ${result.errorType}`)
  }
  for (const id of items) {
    recordItemAttempt(model, id, { correct: true, independent, evidenceKind, atMs })
  }
  if (block.payload?.canDoId) {
    recordCanDoAttempt(model, block.payload.canDoId, { success: true, independent, context: `session:${block.type}`, atMs })
  }
  return { blockId: block.id, played: true, kind: block.type, objective: kind, format, items, independent }
}

/* the support level the plan was built with, so the learner sees what the app shows */
const planScaffold = (model) => {
  const levels = Object.values(model?.scaffoldByEpisode || {})
  if (levels.includes('high')) return 'high'
  if (levels.includes('medium')) return 'medium'
  return levels.length ? 'low' : 'high'
}

const repairKindForBlock = (block, kind) => (kind === 'repair_request'
  ? (repairKindForItem(block.payload?.itemId) || 'signal_nonunderstanding')
  : undefined)

/*
 * Consolidate until ready, or until the guard says the route does not work.
 *
 * The planner is asked what to do and the answer is played — nothing here
 * chooses the practice, which is the whole point: if a learner can only recover
 * by being handed evidence, this loop cannot do it.
 */
export const MAX_CONSOLIDATION_STEPS = 12

export function consolidate(model, { profile = STRONG, startMs, trace = [] } = {}) {
  let at = startMs
  for (let step = 0; step < MAX_CONSOLIDATION_STEPS; step += 1) {
    const readiness = derivePreA1Readiness(model, { atMs: at })
    if (readiness.ready) return { trace, steps: step, ready: true, endedAt: at }

    const focus = readinessFocus(readiness)
    const plan = buildSessionPlan(model, ARC, { durationMode: 'standard', atMs: at, learnerKey: 'journey' })
    const blocks = plan.blocks.filter(b => b.objective)
    if (!blocks.length) {
      trace.push({ step, blocked: true, focus: focus?.kind || null, reasons: readiness.reasonCodes })
      return { trace, steps: step, ready: false, endedAt: at, blocked: true }
    }
    const played = []
    for (const b of blocks) played.push(playBlock(model, b, { profile, atMs: at }))
    reconcileLevelMilestones(model, { atMs: at, source: 'daily_session' })
    trace.push({
      step,
      focus: focus?.kind || null,
      focusSkill: focus?.canDoId || null,
      reasons: readiness.reasonCodes,
      blocks: played.map(p => `${p.kind}:${p.objective || p.episodeId}${p.independent ? '' : ' (assisted)'}`),
    })
    at += DAY
  }
  const readiness = derivePreA1Readiness(model, { atMs: at })
  return { trace, steps: MAX_CONSOLIDATION_STEPS, ready: readiness.ready, endedAt: at, exhausted: !readiness.ready }
}
