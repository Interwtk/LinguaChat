import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { EpisodeShell, scrambleTokens } from '../episode/EpisodeShell'
import { FormatFeedback } from '../episode/FormatFeedback'
import { MiniStory } from './MiniStory'
import { episodeRequest } from '../../learning/curriculum/episodeContent.js'
import { evaluateEpisodeResponse } from '../../learning/engine/hybridEvaluation.js'
import { evaluateFree, shouldEscalate, TAUGHT_NUMBERS } from '../../learning/engine/responseEvaluation.js'
import { repairKindForItem } from '../../learning/engine/session.js'
import { createSubmissionGuard } from '../../learning/engine/submitGuard.js'
import { partnerFor, placeFor } from '../../learning/engine/variation.js'
import { getInterestContext } from '../../learning/engine/interests.js'
import { selectRepresentativeFormat } from '../../learning/engine/formatChoice.js'
import { evaluateLearningResponse } from '../../services/api'
import { currentBlock, sessionProgress, dayKeyFor } from '../../learning/engine/session.js'
import {
  loadLearnerModel, saveLearnerModel, recordItemAttempt, recordCanDoAttempt, markRecurringError, recordActivitySignalOnce,
} from '../../learning/engine/learnerModel.js'
import { selectCompatibleContext, asSubjectValue, thingById } from '../../learning/engine/semanticContext.js'
import { factsOfType } from '../../learning/engine/learnerFacts.js'
import { coreItemsOfIntent } from '../../learning/curriculum/preA1Map.js'
import { SEED_VOCAB_BY_ID } from '../../data/vocabulary'
import {
  deriveInitialScaffold, updateScaffoldAfterTurn, evidenceKindForStep,
  isIndependentEvidence, showsModelAnswer,
} from '../../learning/engine/scaffolding.js'

const En = ({ children, style }) => <span lang="en" dir="ltr" style={style}>{children}</span>

// The English model answer for a short practice block, by intent.
const MODEL_ANSWER = {
  /*
   * A1 arc 1. A short practice turn for these has to ask the arc's question, not
   * a greeting: the sixth Pre-A1 arc shipped with these entries missing and the
   * session showed an introduction prompt while grading an identification.
   */
  state_life_fact: (v) => (v.workOrStudy ? `I work at ${v.workOrStudy}.` : 'I work at home.'),
  ask_life_fact: () => 'Do you work?',
  /*
   * A1 arc 2. The model answer follows the turn's own subtype, because "say when"
   * and "say what you do every day" are the same intent asking for different
   * detail — and it prefers the hour the learner already told us over an invented
   * one, exactly as the life-fact answer prefers their workplace.
   */
  state_routine: (v) => (v.timeForm === 'part_of_day'
    ? 'I usually work in the morning.'
    : `I usually get up at ${v.usualTime || 'seven'}.`),
  /*
   * A1 arc 3. The person being introduced is the session's own partner, so the model
   * answer names somebody who is actually on screen rather than inventing a third
   * party — and the third-person statement stays with `is`, which is the form the
   * arc teaches.
   */
  introduce_person: (v) => `This is my friend ${v.partner}.`,
  state_person_fact: (v) => `${v.partner} is a student.`,
  /*
   * A1 arc 4. The place is a PUBLIC one the session names itself - a station or a
   * toilet belongs to nobody, so no model answer here can leak where a learner is.
   */
  ask_location: () => 'Where is the toilet?',
  state_location: () => "It's next to the bag.",
  ask_transport: () => 'How do I get to the station?',

  introduction: (v) => `Hi, I'm ${v.name}.`,
  ask_name: () => "What's your name?",
  nice_to_meet: () => 'Nice to meet you.',
  ask_wellbeing: () => 'How are you?',
  answer_wellbeing: () => "I'm good.",
  reciprocal_question: () => 'And you?',
  ask_origin: () => 'Where are you from?',
  answer_origin: (v) => `I'm from ${v.place || v.partnerPlace}.`,
  full_intro_conversation: (v) => `Hi, I'm ${v.name}. How are you?`,
  // third arc — without these a session block would ask for a preference and
  // then evaluate the answer as an introduction
  express_like: (v) => `I like ${v.noun}.`,
  express_dislike: () => "I don't like coffee.",
  ask_preference: () => 'What do you like?',
  yes_no_preference: () => 'Yes, I do.',
  express_want: () => 'I want water.',
  express_need: () => 'I need help.',
  ask_want: () => 'Do you want water?',
  accept_offer: () => 'Yes, please.',
  decline_offer: () => 'No, thank you.',
  simple_plan_conversation: (v) => `I like ${v.noun}. Do you want to ${v.activity}?`,
  // fourth arc — the thing asked for comes from the semantic layer, so a
  // remembered interest can never turn into "Can I have music, please?"
  polite_request: (v) => `Can I have ${v.item}, please?`,
  thank_service: () => 'Thank you.',
  respond_anything_else: () => 'No, thank you.',
  finish_order: () => 'That’s all, thanks.',
  cafe_order_conversation: (v) => `Can I have ${v.item}, please? That’s all, thanks.`,
  /*
   * Sixth arc. Without these three a block carrying one of them fell back to the
   * introduction: the learner was asked to greet somebody and graded on
   * identifying an object, which no answer could satisfy.
   */
  ask_what_thing: () => 'What’s this?',
  identify_thing: (v) => `It’s ${v.thingValue}.`,
  use_quantity: (v) => `${v.countWord[0].toUpperCase()}${v.countWord.slice(1)}.`,
  // fifth arc — the strategy the block practises decides the sentence
  repair_request: (v) => {
    const target = REPAIR_TARGET[v.repairKind] || REPAIR_TARGET.signal_nonunderstanding
    return typeof target === 'function' ? target(v) : target
  },
  close_encounter: () => 'Bye.',
}

/* The three ways out, and what a turn practising each one asks for. */
const REPAIR_TARGET = {
  signal_nonunderstanding: 'I don’t understand.',
  repeat: 'Can you repeat, please?',
  slow_down: 'Please speak slowly.',
  /* arc 2's: the repair that learns rather than pauses */
  ask_meaning: (v) => `What does “${v.meaningWord || 'that'}” mean?`,
}
const REPAIR_PROMPT = {
  signal_nonunderstanding: (v) => `So, mmm… mmm… ${v.noun}?`,
  repeat: () => `And… mmm… where…`,
  slow_down: () => 'Sorry—whatdoyoulike?',
  /*
   * A sentence with one word in it the learner has not met, so there is something
   * real to ask about. The word is named on the block so the target and the prompt
   * cannot drift apart.
   */
  ask_meaning: (v) => `I usually finish ${v.meaningWord || 'late'}.`,
}
// What Lingua says to open the practice turn, so the reply has a real context.
const PROMPT = {
  state_life_fact: (v) => `Hi again${v.name ? ', ' + v.name : ''}. What do you do?`,
  ask_life_fact: () => 'I work at the office. Your turn to ask me.',
  /* arc 2: the question has to be about a day, and about the right kind of when */
  state_routine: (v) => (v.timeForm === 'part_of_day'
    ? 'When do you work or study — morning, afternoon or evening?'
    : `Tell me about your day${v.name ? ', ' + v.name : ''}. What time do you get up?`),
  /* arc 3: somebody has to be there to introduce, and somebody to introduce them to */
  introduce_person: (v) => `${v.partner} is here and we have not met.`,
  state_person_fact: (v) => `Tell me one thing about ${v.partner}.`,
  /* arc 4: a building to be lost in, a thing to place, and somewhere to go */
  ask_location: () => 'You are in a museum and you need the toilet. Ask me.',
  state_location: () => 'Your book is at the side of my bag. Where is it?',
  ask_transport: () => 'You want to go to the station. Ask me.',

  introduction: () => 'Hi there!',
  ask_name: () => "I'm ready when you are.",
  nice_to_meet: () => 'Nice to meet you!',
  ask_wellbeing: (v) => `Hi! I'm ${v.partner}.`,
  answer_wellbeing: () => 'How are you?',
  reciprocal_question: () => "I'm good, thanks.",
  ask_origin: (v) => `I'm from ${v.partnerPlace}.`,
  answer_origin: () => 'Where are you from?',
  full_intro_conversation: () => 'Hi there!',
  repair_request: (v) => (REPAIR_PROMPT[v.repairKind] || REPAIR_PROMPT.signal_nonunderstanding)(v),
  close_encounter: () => 'I have to go now!',
  express_like: () => 'Tell me something you like.',
  express_dislike: () => 'And something you don’t like?',
  ask_preference: () => 'There is a lot I enjoy.',
  yes_no_preference: (v) => `Do you like ${v.noun}?`,
  express_want: () => 'What do you want right now?',
  express_need: () => 'Tell me what you need today.',
  ask_want: () => 'I have water and coffee here.',
  accept_offer: () => 'Do you want some water?',
  decline_offer: () => 'Do you want coffee too?',
  simple_plan_conversation: () => 'Hi! What do you like?',
  polite_request: () => 'Hi! What can I get for you?',
  thank_service: () => 'Here you are.',
  respond_anything_else: () => 'Anything else?',
  finish_order: () => 'Anything else?',
  cafe_order_conversation: () => 'Hi! What can I get for you?',
  // sixth arc — Lingua holds something up, or offers a countable number of them
  ask_what_thing: () => 'Look — I have something here.',
  identify_thing: () => 'Now you show me one. What’s this?',
  use_quantity: (v) => `I have some ${v.thingPlural} for you. How many?`,
}

/*
 * A short practice turn used by review / targeted-retry / recall / extra blocks.
 *
 * The block carries a FORMAT chosen by the planner, and the format genuinely
 * changes the activity: the same objective can be practised by writing the
 * sentence, by arranging its words, by filling a gap, or by choosing the
 * natural reply. It always ends in the same hybrid evaluator — there is no
 * second evaluation path — and formats that give the answer away are recorded
 * as assisted, so variety can never manufacture mastery.
 */
/*
 * Which object, and how many, a sixth-arc turn is about. Deterministic from the
 * block so the prompt, the answer and the evaluation cannot disagree, and always
 * countable so "How many?" is a fair question.
 */
const COUNTABLE_FOR_SESSIONS = ['book', 'phone', 'bag', 'cup']
const seedNumber = (seed) => [...String(seed)].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) % 100000, 7)
const countableThing = (seed) => thingById(COUNTABLE_FOR_SESSIONS[seedNumber(seed) % COUNTABLE_FOR_SESSIONS.length])
const countFor = (seed) => (seedNumber(`${seed}:count`) % 9) + 2   // two … ten

/* Words only, for comparing a target phrase against the sentence on screen. */
const plainText = (text) => String(text || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()

function blankOf(sentence) {
  const words = sentence.replace(/([.?!])$/, ' $1').split(/\s+/).filter(Boolean)
  const idx = Math.max(0, words.findIndex((w, i) => i > 0 && /^[a-z']+$/i.test(w) && w.length > 2))
  return {
    before: words.slice(0, idx).join(' '),
    answer: words[idx] || '',
    after: words.slice(idx + 1).join(' '),
  }
}

function PracticeTurn({ block, topic = null, onDone }) {
  const { t, profile, nativeLanguageInfo, interfaceLanguageInfo } = useApp()
  const kind = block.objective || 'introduction'
  const format = block.format || 'free_reply'
  /*
   * A session block is not a small episode, and it must not inherit an
   * episode's support level. Every block derives its own from the skill it
   * practises and why the planner chose it — a targeted retry exists because
   * something went wrong, a recall of a mastered skill does not.
   *
   * Derived once per block. `PracticeTurn` is keyed by block id, so moving on
   * builds a fresh component rather than carrying the previous block's state.
   */
  const scaffoldRef = useRef(null)
  if (!scaffoldRef.current) {
    scaffoldRef.current = deriveInitialScaffold({
      learnerModel: loadLearnerModel(),
      targetIntent: kind,
      runMode: 'review',
      blockType: block.type,
    })
  }
  const [scaffoldState, setScaffoldState] = useState(scaffoldRef.current)
  const scaffold = scaffoldState.currentLevel
  const name = (profile.name || '').trim() || 'Alex'
  const partner = useMemo(() => partnerFor(profile.name || 'guest'), [profile.name])
  const modelRef = useRef(loadLearnerModel())
  // The session's own subject matter, so a practice turn talks about the same
  // thing Home promised this morning.
  const ctx = useMemo(() => getInterestContext(topic?.interestId ? [topic.interestId] : [], `session:${topic?.interestId || ''}`), [topic])
  /*
   * Which repair this block is about. A due review knows its item, so the
   * strategy comes from the phrase that fell due; anything else practises the
   * one the arc teaches first rather than guessing.
   */
  const repairKind = kind === 'repair_request'
    ? (repairKindForItem(block.payload?.itemId) || 'signal_nonunderstanding')
    : null
  const vars = {
    name, partner, repairKind,
    partnerPlace: placeFor(partner),
    place: modelRef.current.facts?.place || '',
    /*
     * A1's two remembered facts, so a practice turn about the learner's day uses
     * their own hour and their own workplace instead of inventing either. Both are
     * empty for anybody who has not said them, which is the ordinary path.
     */
    workOrStudy: factsOfType(modelRef.current, 'work_or_study')[0]?.value || '',
    usualTime: factsOfType(modelRef.current, 'usual_time')[0]?.value || '',
    /*
     * Which subtype an arc-2 block practises. A due review knows its item, so the
     * time form comes from the phrase that fell due; anything else practises the
     * hour, which is the form later arcs need.
     */
    timeForm: kind === 'state_routine'
      ? (block.payload?.itemId === 'part_of_day_pattern' ? 'part_of_day' : 'clock')
      : null,
    /* the one word an `ask_meaning` turn is about, named once for prompt and target */
    meaningWord: 'late',
    // if today is built around something the learner told Lingua, practise
    // with their own words rather than a catalogue noun
    // the same gate as an episode: today's topic reaches the sentence only when
    // it is something a person can be asked to like
    noun: (topic?.factValue && asSubjectValue(topic.factValue)?.value) || ctx.targetNoun,
    activity: ctx.activity,
    /*
     * What a cafe turn asks for. The objective decides which KIND of thing may
     * fill the slot, so today's topic reaches the sentence only when it makes
     * sense there — otherwise the neutral catalogue answers and the English
     * stays correct.
     */
    item: selectCompatibleContext({
      intent: kind,
      facts: [topic?.factValue].filter(Boolean),
      interests: [ctx.targetNoun],
      seed: `session:${kind}:${name}`,
    })?.value || 'water',
    /*
     * The object and the number a sixth-arc turn is about. Both are picked from
     * the countable things the arc teaches, deterministically from the block, so
     * the prompt, the model answer and the evaluator all describe the same turn —
     * and so "how many" is never asked about something uncountable.
     */
    ...(() => {
      const thing = countableThing(`session:${kind}:${name}`)
      const count = countFor(`session:${kind}:${name}`)
      return {
        thingId: thing.id,
        thingValue: `${thing.article} ${thing.singular}`,
        thingPlural: thing.plural,
        count,
        countWord: TAUGHT_NUMBERS[count - 1],
      }
    })(),
  }
  const nativeLang = nativeLanguageInfo.base

  const [reply, setReply] = useState('')
  const [retry, setRetry] = useState(null)
  const [praise, setPraise] = useState(null)
  const [reviewing, setReviewing] = useState(false)
  const [live, setLive] = useState('')
  const [buildOrder, setBuildOrder] = useState([])
  const [gap, setGap] = useState('')
  const [chosen, setChosen] = useState(null)
  /*
   * Whether this block's answer was taken from the suggestion. It has to be the
   * press, not a comparison with the model answer: a learner who says exactly
   * the right sentence unaided was otherwise recorded as helped — and on a block
   * that shows no suggestion at all, that reading is not merely unkind, it is
   * impossible, and it lost the very evidence the block was created to collect.
   */
  const [usedSuggestion, setUsedSuggestion] = useState(false)
  /*
   * Whether the answer has been on the screen at all during this block: either
   * the learner took the suggestion, or they got it wrong and the correction
   * spelled the sentence out. Retyping something just displayed is not unaided
   * production, and counting it as such was a way to reach `can_use` without
   * ever having said the sentence from memory.
   */
  const answerWasShown = () => usedSuggestion || Boolean(retry)
  const guardRef = useRef(createSubmissionGuard())
  const abortRef = useRef(null)
  const inputRef = useRef(null)
  const doneRef = useRef(false)

  const modelAnswer = (MODEL_ANSWER[kind] || MODEL_ANSWER.introduction)(vars)
  /*
   * What this block will record.
   *
   * A review names its own item. Everything else — a recall of a fragile
   * capability, a targeted retry, a consolidation turn — names a can-do or an
   * error, and used to record nothing at all: the learner produced the sentence
   * and the model forgot. The intent's core language is what every practice of
   * it produces, and where there is more than one candidate frame the sentence
   * on screen decides which one was actually said.
   */
  const practisedItems = useMemo(() => {
    /*
     * The item under review, not the whole queue: `payload.itemIds` tells the
     * planner which items this session is about, and crediting all four for
     * one sentence would be four attempts the learner never made.
     */
    const explicit = block.payload?.itemId ? [block.payload.itemId] : (block.payload?.itemIds || null)
    if (explicit) return explicit
    const core = coreItemsOfIntent(kind)
    if (core.length <= 1) return core
    const shown = plainText(modelAnswer)
    const matching = core.filter(id => shown.includes(plainText(SEED_VOCAB_BY_ID[id]?.term || '')))
    return matching.length ? matching : core.slice(0, 1)
  }, [block.payload?.itemId, block.payload?.itemIds, kind, modelAnswer])
  const linguaSaid = (PROMPT[kind] || PROMPT.introduction)(vars)
  const eventId = `${dayKeyFor()}:session:${block.id}`

  // One "shown" per block per day, whatever the UI does in between.
  useEffect(() => {
    if (recordActivitySignalOnce(modelRef.current, `${eventId}:shown`, format, 'shown')) {
      saveLearnerModel(modelRef.current)
    }
  }, [eventId, format])

  useEffect(() => () => {
    guardRef.current.invalidate()
    try { abortRef.current?.abort() } catch { /* noop */ }
  }, [])

  function mark(kindOfSignal, suffix = kindOfSignal) {
    if (recordActivitySignalOnce(modelRef.current, `${eventId}:${suffix}`, format, kindOfSignal)) {
      saveLearnerModel(modelRef.current)
    }
  }

  // Completing the block: recorded once, then the session moves on.
  function complete() {
    if (doneRef.current) return
    doneRef.current = true
    mark('completed')
    onDone()
  }

  /*
   * Leaving a block on purpose is the ONE reliable abandonment signal we have.
   * Reloads, breakpoints, network errors and navigation are not abandonment and
   * are never recorded as such.
   */
  function leaveOnPurpose() {
    if (doneRef.current) return
    doneRef.current = true
    mark('abandoned')
    onDone()
  }

  async function submit({ fromSuggestion = false } = {}) {
    const text = reply
    if (!text.trim()) return
    const token = guardRef.current.begin()
    if (token === null) return
    const turnContext = { linguaSaid }
    // Same context the model answer was built from, so a correction can never
    // name something the prompt never mentioned.
    const stepShape = { type: 'free_reply', format }
    const independent = isIndependentEvidence({ step: stepShape, assistanceUsed: fromSuggestion, correct: true })
    /*
     * A quantity turn is graded against a specific thing and number, and an
     * identification against a specific object. Passing them keeps the verdict
     * about the turn the learner was actually shown.
     */
    const thingContext = kind === 'use_quantity' || kind === 'identify_thing'
      ? { targetThing: vars.thingId, targetCount: vars.count, quantityForm: 'bare' }
      : { targetThing: vars.item }
    const evalCtx = { name, independent, turnContext, place: vars.place, targetNoun: vars.noun, partner: vars.partner, ...thingContext, ...(repairKind ? { repairKind } : {}) }
    const preview = evaluateFree(kind, text, evalCtx)
    const controller = new AbortController()
    abortRef.current = controller
    if (shouldEscalate(preview)) { setReviewing(true); setLive(t('epEvaluating')) }

    let result
    try {
      result = await evaluateEpisodeResponse({
        episode: null, step: { evalKind: kind, itemIds: block.payload?.itemId ? [block.payload.itemId] : [] },
        learnerResponse: text, learnerName: name, place: vars.place,
        targetNoun: vars.noun, ...thingContext, partner: vars.partner,
        // the strategy travels to Lingua too, or the remote grades another question
        ...(repairKind ? { repairKind } : {}),
        nativeLanguage: nativeLang, interfaceLanguage: interfaceLanguageInfo?.base || nativeLang,
        targetLanguage: 'en', scaffoldLevel: scaffold, assistanceUsed: fromSuggestion,
        previousAttempts: 0, turnContext, signal: controller.signal,
        remote: (payload, signal) => evaluateLearningResponse(payload, { signal }),
      })
    } catch {
      result = { ...preview, source: 'fallback' }
    }
    if (!guardRef.current.isCurrent(token)) return
    guardRef.current.settle()
    abortRef.current = null
    setReviewing(false)

    if (result.completedObjective) {
      // the same distinction a step makes: a correct reply that used none of the
      // taught language is not recorded as practice of it
      for (const id of (result.targetEvidence === false ? [] : practisedItems)) {
        recordItemAttempt(modelRef.current, id, { correct: true, independent, evidenceKind: evidenceKindForStep(stepShape) })
      }
      saveLearnerModel(modelRef.current)
      setScaffoldState(prev => updateScaffoldAfterTurn(prev, {
        correct: true, assistanceUsed: fromSuggestion, evidenceKind: evidenceKindForStep(stepShape), retried: Boolean(retry),
      }))
      /*
       * A block that exists to consolidate a capability credits that capability,
       * the way finishing an episode does. Without it the can-do counter never
       * moves outside an episode and a consolidated skill still looks untouched.
       */
      const canDoId = block.payload?.canDoId
      if (canDoId) recordCanDoAttempt(modelRef.current, canDoId, { success: true, independent, context: `session:${block.type}` })
      saveLearnerModel(modelRef.current)
      if (retry) mark('retried')
      setPraise(result.praiseKey || 'ep1FeedbackGood')
      setLive(t(result.praiseKey || 'ep1FeedbackGood'))
      setTimeout(complete, 700)
    } else {
      for (const id of practisedItems) {
        recordItemAttempt(modelRef.current, id, { correct: false, independent: false, evidenceKind: evidenceKindForStep(stepShape) })
      }
      setScaffoldState(prev => updateScaffoldAfterTurn(prev, { correct: false, evidenceKind: evidenceKindForStep(stepShape) }))
      markRecurringError(modelRef.current, result.errorType)
      saveLearnerModel(modelRef.current)
      setRetry({ explainKey: result.explanation, natural: result.naturalVersion, promptKey: result.retryPrompt })
      setLive(t('ep1RetryTitle'))
      setTimeout(() => { try { inputRef.current?.focus() } catch { /* noop */ } }, 40)
    }
  }

  /*
   * A closed activity (arranging words, filling a gap, choosing the natural
   * reply). The model answer is visible in the material itself, so a success is
   * recorded as assisted — never as independent evidence.
   */
  function settleClosed(correct) {
    const evidence = evidenceKindForStep({ type: format === 'choice' ? 'choice' : 'word_order', format })
    for (const id of practisedItems) {
      recordItemAttempt(modelRef.current, id, { correct, independent: false, evidenceKind: evidence })
    }
    saveLearnerModel(modelRef.current)
    if (correct) { setLive(t('ep1Correct')); setTimeout(complete, 600) }
    else {
      mark('retried')
      // Say what actually went wrong: an order, a missing word, or a choice.
      const explainKey = format === 'choice' ? 'sessionChoiceRetry'
        : format === 'fill_blank' ? 'sessionGapRetry' : 'ep1BuildRetry'
      setRetry({ explainKey, natural: modelAnswer })
      // the chosen option stays marked while the correction is on screen, so a
      // screen reader still reports what was picked
      setBuildOrder([]); setLive(t('ep1RetryTitle'))
    }
  }

  const titleKey = block.type === 'targeted_retry' ? 'sessionRetryTitle'
    : block.type === 'recall' ? 'sessionRecallTitle'
      : block.type === 'extra_practice' ? 'sessionExtraTitle' : 'sessionReviewTitle'

  const isBuildFormat = format === 'word_order' || format === 'guided_reply'
  // mini_story has its own renderer; everything else falls back to free text
  const isOpenFormat = !isBuildFormat && format !== 'fill_blank' && format !== 'choice' && format !== 'mini_story'
  // Distractors are other real English replies — wrong here, never nonsense.
  const choiceOptions = [modelAnswer, MODEL_ANSWER.nice_to_meet(vars), MODEL_ANSWER.ask_wellbeing(vars)]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 3)
  // Instruction depends on what the learner is actually being asked to do.
  const howKey = isBuildFormat ? 'sessionBuildInstruction'
    : format === 'fill_blank' ? 'sessionGapInstruction'
      : format === 'choice' ? 'sessionChoiceInstruction' : 'sessionTurnInstruction'

  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-2 mb-3">
        <ChattoMascot mood="supportive" size={38} intensity="support" decorative />
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--accent)' }}>{t('sessionBlockBadge')}</p>
          <p lang={nativeLang} style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ink)' }}>{t(titleKey)}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-3">
        <LinguaAvatar size={32} online className="mt-0.5" />
        <div className="bubble-lingua"><En style={{ fontWeight: 700 }}>{linguaSaid}</En></div>
      </div>
      <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: 10 }}>{t(howKey)}</p>

      {retry && (
        <div role="status" className="rounded-2xl p-4 mb-3 animate-scale-in" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>{t('ep1RetryTitle')}</p>
          {retry.explainKey && <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 6 }}>{t(retry.explainKey)}</p>}
          {retry.natural && <En style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>{retry.natural}</En>}
          {retry.promptKey && <p lang={nativeLang} style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 6 }}>{t(retry.promptKey)}</p>}
        </div>
      )}

      {/*
        * The suggestion used to be offered on every open block, whatever the
        * block was for and however much support the learner had earned. Two
        * things were wrong with that. The support level had no effect here at
        * all, and — worse — a block the planner created precisely to obtain an
        * unaided production arrived with the sentence already written out, so
        * the one piece of evidence the learner needed could never be produced.
        * Nobody is left stranded: the retry after a wrong answer still shows
        * the model sentence, which is support arriving when it is needed.
        */}
      {!reviewing && isOpenFormat && showsModelAnswer(scaffold) && block.payload?.requiredPractice !== 'recall' && (
        <button type="button" onClick={() => { setReply(modelAnswer); setUsedSuggestion(true); mark('assistance') }} className="rounded-full px-3.5 py-1.5 text-xs font-bold mb-3 transition-all active:scale-[0.98]"
          style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)', color: 'var(--ink)' }}>
          {t('ep1UseSuggestion')}: <En>{modelAnswer}</En>
        </button>
      )}

      {reviewing && (
        <div role="status" aria-live="polite" className="flex items-center gap-2 mb-3 animate-fade-up">
          <LinguaAvatar size={26} online />
          <span lang={nativeLang} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent)' }}>{t('epEvaluating')}</span>
        </div>
      )}

      <p aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{live}</p>

      {isOpenFormat && (
        <div className="flex items-end gap-2 rounded-2xl p-2.5" aria-busy={reviewing} style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)', opacity: reviewing ? 0.7 : 1 }}>
          <input ref={inputRef} value={reply} onChange={e => setReply(e.target.value)} disabled={reviewing} lang="en" dir="ltr"
            onKeyDown={e => { if (e.key === 'Enter' && reply.trim() && !reviewing) submit({ fromSuggestion: answerWasShown() }) }}
            placeholder={t('ep1TypeReply')} aria-label={t('sessionTurnInstruction')} className="chat-input flex-1 bg-transparent text-sm"
            style={{ color: 'var(--ink)', border: 'none', outline: 'none', padding: '7px 4px' }} />
          <button onClick={() => submit({ fromSuggestion: answerWasShown() })} disabled={!reply.trim() || reviewing}
            className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: reply.trim() && !reviewing ? 'var(--info)' : 'var(--border)' }}>{t('ep1Send')}</button>
        </div>
      )}

      {/* Arrange the words — same sentence, more support. */}
      {isBuildFormat && (() => {
        const tokens = modelAnswer.replace(/([.?!])$/, ' $1').split(/\s+/).filter(Boolean)
        const shown = scrambleTokens(tokens, block.id)
        return (
          <div>
            <div className="rounded-2xl p-3 mb-3 flex items-center flex-wrap gap-2" style={{ minHeight: 52, background: 'var(--surface-soft)', border: '1px solid var(--accent)' }}>
              {buildOrder.length === 0 && <span lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{t('ep1BuildHint')}</span>}
              {buildOrder.map((tok, i) => (
                <button key={i} onClick={() => setBuildOrder(o => o.filter((_, idx) => idx !== i))} aria-label={`remove ${tok}`}
                  className="rounded-xl px-3 py-1.5 text-sm font-bold" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--accent)' }}><En>{tok}</En></button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {shown.map((tok, i) => {
                const spent = buildOrder.filter(x => x === tok).length >= tokens.filter(x => x === tok).length
                return (
                  <button key={i} disabled={spent} onClick={() => setBuildOrder(o => [...o, tok])} className="rounded-xl px-3.5 py-2 text-sm font-bold transition-all active:scale-[0.98]"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)', opacity: spent ? 0.4 : 1 }}><En>{tok}</En></button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setBuildOrder([])} className="px-4 py-2.5 rounded-2xl text-sm font-semibold" style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{t('ep1Reset')}</button>
              <button disabled={buildOrder.length < tokens.length} onClick={() => settleClosed(buildOrder.join(' ') === tokens.join(' '))}
                className="flex-1 py-2.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]"
                style={{ background: 'var(--accent)', opacity: buildOrder.length < tokens.length ? 0.5 : 1 }}>{t('ep1Check')}</button>
            </div>
          </div>
        )
      })()}

      {/* Fill the gap — the pattern with one word missing. */}
      {format === 'fill_blank' && (() => {
        const { before, answer, after } = blankOf(modelAnswer)
        return (
          <div>
            <div className="flex items-center gap-2 flex-wrap rounded-2xl p-3 mb-4" style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)' }}>
              <En style={{ fontSize: '1rem', fontWeight: 700 }}>{before}</En>
              <input ref={inputRef} value={gap} onChange={e => setGap(e.target.value)} lang="en" dir="ltr" aria-label={t('sessionTurnInstruction')}
                className="chat-input rounded-xl px-3 py-2 text-sm" style={{ flex: 1, minWidth: 110, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }} />
              <En style={{ fontSize: '1rem', fontWeight: 700 }}>{after}</En>
            </div>
            <button disabled={!gap.trim()} onClick={() => settleClosed(gap.trim().toLowerCase().replace(/[.?!,]/g, '') === answer.toLowerCase().replace(/[.?!,]/g, ''))}
              className="w-full py-2.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]"
              style={{ background: 'var(--accent)', opacity: gap.trim() ? 1 : 0.5 }}>{t('ep1Check')}</button>
          </div>
        )
      })()}

      {/* Choose the natural reply. A real radio group, so it works from the
          keyboard and is announced as a choice — and the chosen option is
          marked with a symbol, never with colour alone. */}
      {format === 'choice' && (
        <div role="radiogroup" aria-label={t('sessionChoiceInstruction')} className="flex flex-col gap-2">
          {choiceOptions.map((opt, i) => {
            const isChosen = chosen === opt
            return (
              <button key={i} type="button" role="radio" aria-checked={isChosen}
                onClick={() => { setChosen(opt); settleClosed(opt === modelAnswer) }}
                className="rounded-2xl px-4 py-3 text-start transition-all active:scale-[0.99] flex items-center gap-2"
                style={{
                  background: isChosen ? 'var(--accent-soft)' : 'var(--surface)',
                  border: `1px solid ${isChosen ? 'var(--accent)' : 'var(--border)'}`,
                  minHeight: 48,
                }}>
                <span aria-hidden="true" style={{ fontSize: 13, width: 14, color: 'var(--accent)' }}>{isChosen ? '●' : '○'}</span>
                <En style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)' }}>{opt}</En>
              </button>
            )
          })}
        </div>
      )}

      {praise && <p role="status" lang={nativeLang} className="mt-2" style={{ fontSize: '0.8125rem', color: 'var(--positive)', fontWeight: 700 }}>{t(praise)}</p>}

      {/* Leaving on purpose — the only reliable "not this one" we accept. */}
      <button type="button" onClick={leaveOnPurpose} className="mt-4 w-full py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
        style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{t('sessionSkipBlock')}</button>
    </div>
  )
}

function SessionCompletion({ session, onFinish }) {
  const { t, nativeLanguageInfo } = useApp()
  const nativeLang = nativeLanguageInfo.base
  const doneRef = useRef(false)
  const { total } = sessionProgress(session)
  /*
   * Ask about what the session actually WAS, not whatever happened to come
   * first. Only formats the learner really finished are eligible, a one-line
   * recall is not worth a question, and an activity chosen for them by
   * preference is the most interesting one to ask about.
   */
  const practisedFormat = useMemo(() => {
    const model = loadLearnerModel()
    const day = dayKeyFor()
    const log = model.signalLog || []
    const blocks = session?.blocks || []
    const completedFormats = blocks
      .filter(b => b.format && log.includes(`${day}:session:${b.id}:completed`))
      .map(b => b.format)
    return selectRepresentativeFormat({
      blocks,
      completedFormats,
      adaptedFormats: blocks.filter(b => b.source === 'preference').map(b => b.format),
      durationMode: session?.durationMode,
      seed: session?.id || '',
    })
  }, [session])
  return (
    <div className="animate-scale-in rounded-3xl p-6 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--positive)', boxShadow: '0 0 0 3px var(--positive-soft)' }}>
      <div className="flex justify-center"><ChattoMascot mood="celebrating" size="medium" variant="green" intensity="celebrate" /></div>
      <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--positive)', marginTop: 12 }}>{t('sessionDoneBadge')}</p>
      <h2 lang={nativeLang} style={{ fontWeight: 800, fontSize: '1.1875rem', color: 'var(--ink)', margin: '6px 0 8px' }}>{t('sessionDoneTitle')}</h2>
      <p lang={nativeLang} style={{ fontSize: '0.9375rem', color: 'var(--muted)', lineHeight: 1.55, marginBottom: 8 }}>{t('sessionDoneBody')}</p>
      <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--accent)', fontWeight: 700, marginBottom: 18 }}>{t('sessionDoneNext')}</p>
      <div className="rounded-2xl px-4 py-2 mb-5 inline-flex items-center gap-2" style={{ background: 'var(--positive-soft)', border: '1px solid var(--positive)' }}>
        <span style={{ fontSize: 15 }}>✓</span>
        <span lang={nativeLang} style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)' }}>{t('sessionDoneCount', { count: total })}</span>
      </div>
      {/* One optional question about the way today was practised. Never blocks
          the close button, never grants XP. */}
      {practisedFormat && <FormatFeedback format={practisedFormat} momentId={session.id} />}
      <button onClick={() => { if (doneRef.current) return; doneRef.current = true; onFinish() }}
        className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:-translate-y-px active:scale-[0.98]"
        style={{ background: 'var(--positive)' }}>{t('sessionDoneCta')}</button>
    </div>
  )
}

export function SessionRunner() {
  const { t, dailySession, advanceSession, finishSession, exitSession, setView, nativeLanguageInfo, profile } = useApp()
  const nativeLang = nativeLanguageInfo.base
  const block = currentBlock(dailySession)
  const { done, total } = sessionProgress(dailySession)
  const isStoryBlock = block?.format === 'mini_story'
  // the story talks about whatever this session is already about
  const storyVars = useMemo(() => {
    const model = loadLearnerModel()
    const ctx = getInterestContext(dailySession?.topic?.interestId ? [dailySession.topic.interestId] : [], `story:${dailySession?.id || ''}`)
    const name = (profile.name || '').trim() || 'Alex'
    const partner = partnerFor(profile.name || 'guest')
    return {
      name, partner, place: model.facts?.place || '', partnerPlace: placeFor(partner),
      noun: dailySession?.topic?.factValue || ctx.targetNoun, activity: ctx.activity,
      // a story that asks for something must ask for something orderable
      item: selectCompatibleContext({
        intent: block?.objective,
        facts: [dailySession?.topic?.factValue].filter(Boolean),
        interests: [ctx.targetNoun],
        seed: `story:${dailySession?.id || ''}`,
      })?.value || 'water',
    }
  }, [dailySession, profile.name, block?.objective])

  if (!dailySession || !block) return null

  const header = (
    <div className="rounded-2xl px-4 py-3 mb-5 flex items-center justify-between gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>{t('sessionBadge')}</p>
        <p lang={nativeLang} style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t('sessionStepOf', { done: Math.min(done + 1, total), total })}
        </p>
      </div>
      <button type="button" onClick={exitSession} className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.98]"
        style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{t('sessionPause')}</button>
    </div>
  )

  // Episode blocks reuse the existing shell untouched; the session only decides
  // what happens when the episode finishes.
  if (block.type === 'continue_episode' || block.type === 'start_episode' || block.type === 'integrated_practice') {
    /*
     * Asked of the resolver, not of a level's content module: a session block only
     * needs to know the id may be opened, and EpisodeShell fetches the definition
     * itself. A block naming something this learner cannot open is skipped rather
     * than played — the same answer as before, from the one registry.
     */
    const request = episodeRequest({ episodeId: block.payload.episodeId })
    if (!request.ok) { advanceSession(); return null }
    // The topic was pinned when the plan was made, so the episode talks about
    // exactly what Home promised — even if interests changed in between.
    return <EpisodeShell episodeId={request.episodeId} interestId={dailySession.topic?.interestId || null}
      runOptions={{ source: 'daily_session', unaidedAttempt: Boolean(block.payload?.unaidedAttempt) }}
      onComplete={() => advanceSession()} />
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6" style={{ background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
        {header}
        {/* A planned mini story gets its own small scene rather than the
            generic reply turn it used to borrow. */}
        {isStoryBlock && (
          <MiniStory key={block.id} block={block} vars={storyVars} onDone={() => advanceSession()} />
        )}
        {!isStoryBlock && (block.type === 'review' || block.type === 'targeted_retry' || block.type === 'recall' || block.type === 'extra_practice') && (
          /*
           * Keyed by block: without this React reuses ONE PracticeTurn across
           * every block of the session, so the previous block's correction was
           * still on screen and — far worse — its "already finished" guard was
           * still set, which left the session stuck on the second block.
           */
          <PracticeTurn key={block.id} block={block} topic={dailySession.topic} onDone={() => advanceSession()} />
        )}
        {block.type === 'free_chat_option' && (
          <div className="animate-fade-up rounded-3xl p-6 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex justify-center"><ChattoMascot mood="welcoming" size="medium" intensity="enter" /></div>
            <h2 lang={nativeLang} style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--ink)', marginTop: 12, marginBottom: 8 }}>{t('sessionFreeChatTitle')}</h2>
            <p lang={nativeLang} style={{ fontSize: '0.9375rem', color: 'var(--muted)', lineHeight: 1.55, marginBottom: 18 }}>{t('sessionFreeChatBody')}</p>
            <button onClick={() => { advanceSession(); setView('practice') }} className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]"
              style={{ background: 'var(--accent)' }}>{t('sessionFreeChatCta')}</button>
            <button onClick={() => advanceSession()} className="mt-2 w-full py-2.5 rounded-2xl text-sm font-semibold"
              style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)', color: 'var(--muted)' }}>{t('sessionSkipBlock')}</button>
          </div>
        )}
        {block.type === 'session_completion' && (
          <SessionCompletion session={dailySession} onFinish={finishSession} />
        )}
      </div>
    </div>
  )
}

export default SessionRunner
