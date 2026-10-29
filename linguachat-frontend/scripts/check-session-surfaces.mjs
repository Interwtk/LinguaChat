/*
 * check-session-surfaces — the closing question, the session renderers, and
 * the two failure modes that must never leave a learner stranded.
 *
 * Three separate promises are protected here:
 *   1. the question at the end names what the session actually WAS;
 *   2. every format the planner can choose has a real activity behind it;
 *   3. a chunk that fails to load — a screen or a locale — degrades into
 *      something usable, never a blank page, raw keys, or a reload loop.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve as resolvePath } from 'node:path'
import { selectRepresentativeFormat, BLOCK_CANDIDATES, formatSupportsObjective } from '../src/learning/engine/formatChoice.js'
import { ACTIVITY_FORMATS } from '../src/learning/engine/learnerModel.js'

const here = dirname(fileURLToPath(import.meta.url))
const read = (p) => readFileSync(resolvePath(here, '..', p), 'utf8')
const runner = read('src/components/session/SessionRunner.jsx')
const feedback = read('src/components/episode/FormatFeedback.jsx')
const i18n = read('src/i18n/translations.js')

let n = 0
const ok = () => { n++ }
const block = (type, format, source = 'planner') => ({ id: `${type}:${format}`, type, format, source })

/* ---------- 1. the closing question ---------- */

// 1) it is NOT simply the first block
{
  const blocks = [block('review', 'fill_blank'), block('extra_practice', 'roleplay', 'preference')]
  const chosen = selectRepresentativeFormat({
    blocks, completedFormats: ['fill_blank', 'roleplay'], adaptedFormats: ['roleplay'], seed: 's',
  })
  assert.equal(chosen, 'roleplay', 'a ten-minute conversation represents the session; the opening review does not')
  ok()
}

// 2) a format the learner never finished is never asked about
{
  const blocks = [block('review', 'fill_blank'), block('extra_practice', 'roleplay')]
  const chosen = selectRepresentativeFormat({ blocks, completedFormats: ['fill_blank'], seed: 's' })
  assert.equal(chosen, 'fill_blank', 'the abandoned roleplay is not a fair thing to ask about')
  ok()
}

// 3) a one-line recall is too slight to deserve its own question
{
  const onlyRecall = selectRepresentativeFormat({ blocks: [block('recall', 'recall')], completedFormats: ['recall'], seed: 's' })
  assert.equal(onlyRecall, null, 'rather than ask about a three-word recall, ask nothing')
  const withMore = selectRepresentativeFormat({
    blocks: [block('recall', 'recall'), block('review', 'word_order')],
    completedFormats: ['recall', 'word_order'], seed: 's',
  })
  assert.equal(withMore, 'word_order')
  ok()
}

// 4) an activity chosen FOR the learner is the interesting one to ask about
{
  const blocks = [block('review', 'word_order'), block('targeted_retry', 'fill_blank', 'preference')]
  const chosen = selectRepresentativeFormat({
    blocks, completedFormats: ['word_order', 'fill_blank'], adaptedFormats: ['fill_blank'], seed: 's',
  })
  assert.equal(chosen, 'fill_blank')
  ok()
}

// 5) nothing finished → no question at all
{
  assert.equal(selectRepresentativeFormat({ blocks: [block('review', 'choice')], completedFormats: [], seed: 's' }), null)
  assert.equal(selectRepresentativeFormat({}), null)
  assert.equal(selectRepresentativeFormat({ blocks: [{ id: 'x', type: 'session_completion' }], completedFormats: [] }), null)
  ok()
}

// 6) a tie is broken by the seed, so the same session always asks the same thing
{
  const blocks = [block('review', 'word_order'), block('targeted_retry', 'fill_blank')]
  const args = { blocks, completedFormats: ['word_order', 'fill_blank'], seed: 'stable' }
  const runs = new Set(Array.from({ length: 15 }, () => selectRepresentativeFormat({ ...args })))
  assert.equal(runs.size, 1)
  ok()
}

// 7) the question names the activity, and every format has a name in English
{
  assert.match(feedback, /feedbackQuestionFor/, 'the question must name the activity')
  assert.match(feedback, /formatName_\$\{format\}/, 'the name comes from the format itself')
  for (const format of ACTIVITY_FORMATS) {
    assert.ok(new RegExp(`^\\s*formatName_${format}:`, 'm').test(i18n), `formatName_${format} is missing`)
  }
  // the signal must be applied to that same format, not a generic one
  assert.match(feedback, /recordActivitySignalOnce\(model, id, format,/)
  ok()
}

/* ---------- 2. the session renderers ---------- */

// 8) every format the planner can pick has an activity behind it
{
  const rendered = ['word_order', 'guided_reply', 'fill_blank', 'choice', 'recall', 'free_reply', 'roleplay', 'mini_story']
  for (const candidates of Object.values(BLOCK_CANDIDATES)) {
    for (const format of candidates) {
      assert.ok(rendered.includes(format), `${format} can be planned but has no renderer`)
    }
  }
  // and each renderer really exists in the runner
  assert.match(runner, /isBuildFormat/, 'word order / guided reply')
  assert.match(runner, /format === 'fill_blank'/, 'gap fill')
  assert.match(runner, /format === 'choice'/, 'choose the answer')
  assert.match(runner, /isOpenFormat/, 'free text')
  ok()
}

/*
 * 9) each block gets its OWN activity component.
 *    Without a key React reuses one instance for every block: the previous
 *    correction stayed on screen and the "already finished" guard stayed set,
 *    which left the session stuck on its second practice block.
 */
{
  assert.match(runner, /<PracticeTurn key=\{block\.id\}/, 'the practice turn must be keyed by block')
  ok()
}

// 10) choosing is a real radio group, and never colour alone
{
  assert.match(runner, /role="radiogroup"/)
  assert.match(runner, /role="radio" aria-checked=/)
  assert.match(runner, /isChosen \? '●' : '○'/, 'the selected option carries a symbol, not just a colour')
  ok()
}

// 11) a correction says what actually went wrong
{
  assert.match(runner, /sessionChoiceRetry/)
  assert.match(runner, /sessionGapRetry/)
  for (const key of ['sessionChoiceRetry', 'sessionGapRetry', 'sessionBuildInstruction', 'sessionGapInstruction', 'sessionChoiceInstruction']) {
    assert.ok(new RegExp(`^\\s*${key}:`, 'm').test(i18n), `${key} is missing from the base locale`)
  }
  ok()
}

// 12) an answer with the words on screen never counts as independent evidence
{
  /*
   * A closed activity shows the answer, so it is assisted by definition — and
   * it now also declares WHAT it proves. Recognising a sentence is evidence of
   * understanding, never of production, so the evidence kind travels with the
   * attempt instead of being inferred from the support level.
   */
  /*
   * The assertion moved from one item to the block's items: a recall or a
   * consolidation block names a can-do rather than an item, and recorded
   * nothing at all until this sprint. What must stay true is that a closed
   * activity is never independent, whatever it records against.
   */
  assert.match(runner, /recordItemAttempt\(modelRef\.current, id, \{ correct, independent: false, evidenceKind: evidence, capability: kind \}\)/,
    'a closed activity shows the answer, so it is assisted by definition')
  assert.match(runner, /const evidence = evidenceKindForStep\(/,
    'a closed activity must say what kind of evidence it produced')
  assert.match(runner, /const practisedItems = useMemo\(/,
    'a block must record the language it practised, not only an explicit item id')
  ok()
}

/* ---------- 3. failing chunks ---------- */

// 13) a screen that fails to load keeps the learner's state and offers a retry
{
  const boundary = read('src/components/ui/LazyBoundary.jsx')
  const app = read('src/App.jsx')
  // the boundary renders injected labels; the labels themselves are localized
  // where the screens are mounted
  assert.match(boundary, /ScreenError errorLabel=\{errorLabel\} retryLabel=\{retryLabel\}/, 'a failure is explained, not blank')
  assert.match(boundary, /onRetry=\{retry\}/, 'and it can be retried')
  assert.match(app, /errorLabel: t\('screenLoadFailed'\)/, 'the failure text is localized')
  assert.match(app, /retryLabel: t\('screenLoadRetry'\)/)
  assert.match(app, /loadingLabel: t\('screenLoading'\)/)
  assert.match(boundary, /sessionStorage/, 'the one automatic reload is guarded so it cannot loop')
  assert.ok(!/localStorage\.(clear|removeItem)/.test(boundary), 'a failed chunk must never touch saved progress')
  for (const key of ['screenLoading', 'screenLoadFailed', 'screenLoadRetry']) {
    assert.ok(new RegExp(`^\\s*${key}:`, 'm').test(i18n), `${key} is missing`)
  }
  ok()
}

// 14) a locale that fails to load falls back to English, never to raw keys
{
  const translations = read('src/i18n/translations.js')
  assert.match(translations, /\.catch\(\(\) => base\)/, 'a failed locale chunk resolves to English')
  assert.match(translations, /dictionaries\[code\]\?\.\[key\] \|\| base\[key\] \|\| key/, 'and lookup falls through to English')
  // it must be retryable: a failure is not cached as if it had succeeded
  assert.match(translations, /\.finally\(\(\) => inFlight\.delete\(code\)\)/)
  assert.ok(!/dictionaries\[code\] = base/.test(translations), 'a failure must not be remembered as a loaded dictionary')
  ok()
}

/*
 * 15) direction comes from the locale the learner CHOSE, not from the
 *     dictionary that happens to have loaded. Otherwise an Arabic learner
 *     whose chunk is slow or failing would be reading a left-to-right page.
 */
{
  const app = read('src/context/AppContext.jsx')
  assert.match(app, /root\.dir = interfaceLanguageInfo\.base === 'ar' \? 'rtl' : 'ltr'/,
    'RTL must not depend on the dictionary having loaded')
  ok()
}

/* ---- help is what the learner pressed, not what they happened to write ---- */
{
  const runner = readFileSync(new URL('../src/components/session/SessionRunner.jsx', import.meta.url), 'utf8')
  const shell = readFileSync(new URL('../src/components/episode/EpisodeShell.jsx', import.meta.url), 'utf8')

  /*
   * The runner used to decide this by comparing the reply with the model answer.
   * A learner who produced exactly the right sentence out of their own head was
   * recorded as helped — and on a recall or consolidation block, which shows no
   * suggestion at all, that reading is impossible: it silently threw away the one
   * piece of unaided evidence the block existed to collect, left the item short of
   * `can_use`, and kept its review coming back the next day for ever.
   */
  for (const [name, src] of [['the session runner', runner], ['the episode shell', shell]]) {
    assert.ok(!/fromSuggestion:\s*reply === modelAnswer/.test(src),
      `${name} must not infer help from the wording of the answer`)
    assert.ok(/setUsedSuggestion\(true\)/.test(src), `${name} must record the press itself`)
    /*
     * And a correction counts too. A wrong answer is answered by spelling the
     * sentence out — support arriving, as it should — but retyping what was just
     * displayed is not production from memory, and two of those used to be enough
     * to move a language item to `can_use`.
     */
    assert.ok(/const answerWasShown = \(\) => usedSuggestion \|\|/.test(src),
      `${name} must treat an answer shown by a correction as help too`)
    assert.ok(/fromSuggestion:\s*answerWasShown\(\)/.test(src), `${name} must submit what it observed`)
    assert.ok(!/fromSuggestion: usedSuggestion[,)\s]/.test(src),
      `${name} must not look only at the suggestion button`)
  }
  ok()
}


/* ---------- 4. free-chat callbacks must not cross accounts ---------- */

// Exercise the real async callback, not a parallel mock of its logic. React can
// flush queued state setters after an account switch, even if the HTTP reply
// arrived while the original account was still active.
{
  const context = read('src/context/AppContext.jsx')
  const signature = '  const sendMessage = useCallback(async (text) => {'
  const start = context.indexOf(signature)
  const end = context.indexOf('\n  }, [activeCompanion, activeMission, conversationTopic', start)
  assert.ok(start >= 0 && end > start, 'free chat must retain an inspectable async callback')
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
  const send = new AsyncFunction('text', 'deps', 'with (deps) { ' + context.slice(start + signature.length, end) + ' }')
  const reply = { reply: 'Reply from A', connectionMessage: 'Connected as A', correction: null }

  async function checkChatLease(mode) {
    let owner = 'A'
    let resolveReply
    const queued = []
    const enqueue = key => update => queued.push([key, update])
    const state = {
      messages: [{ role: 'lingua', text: 'B original' }],
      typing: false,
      selected: 'B selected',
      connection: 'B connection',
      memory: 'B memory',
      progress: { owner: 'B' },
    }
    const original = structuredClone(state)
    const deps = {
      captureLearnerAccess: () => ({ valid: () => owner === 'A' }),
      getActiveMissionDetails: () => null,
      activeMission: null,
      submitMissionStep: () => { throw new Error('unexpected mission') },
      setMessages: enqueue('messages'),
      setIsTyping: enqueue('typing'),
      setSelectedMessage: enqueue('selected'),
      setConnectionNotice: enqueue('connection'),
      setMemoryNotice: enqueue('memory'),
      setLocalProgress: enqueue('progress'),
      messages: [],
      sendChatMessage: () => mode === 'inflight'
        ? new Promise(resolve => { resolveReply = resolve })
        : mode === 'stale-error'
          ? Promise.reject(new Error('offline'))
          : Promise.resolve(reply),
      profile: { level: 'A1', style: 'friendly', goal: '', tutorPersonality: '' },
      sessionId: 'A-session',
      nativeLanguageInfo: { base: 'es' },
      interfaceLanguageInfo: { base: 'es' },
      targetLanguage: 'en',
      tutorPreferences: {},
      activeCompanion: null,
      selectLearnerFact: () => null,
      loadLearnerModel: () => ({}),
      asSubjectValue: () => false,
      loadMemoryContext: () => ({ dismissedFactIds: [] }),
      conversationTopic: { interestId: 'technology' },
      providerTopicContext: () => ({}),
      recordPractice: () => ({ owner: 'A' }),
      recordTopicUse: () => {},
    }
    const pending = send('Hello', deps)
    if (mode === 'inflight') {
      owner = 'B'
      assert.equal(typeof resolveReply, 'function', 'the HTTP request must have started')
      resolveReply(reply)
    }
    await pending
    if (mode !== 'current') owner = 'B'
    assert.ok(queued.length > 0, mode + ': React callbacks must have been queued')
    for (const [key, update] of queued) {
      assert.equal(typeof update, 'function', mode + ': every queued update must check the lease')
      state[key] = update(state[key])
    }
    if (mode === 'current') {
      assert.equal(state.messages.length, 3, 'the valid account still sees its own user/reply messages')
      assert.equal(state.progress.owner, 'A', 'valid practice still updates progress')
      assert.equal(state.connection, 'Connected as A')
      assert.equal(state.typing, false)
    } else {
      assert.deepEqual(state, original, mode + ': A must not modify B after the lease is revoked')
    }
  }

  await checkChatLease('current')
  await checkChatLease('stale-success')
  await checkChatLease('stale-error')
  await checkChatLease('inflight')
  ok()
}

/* ---------- 5. mission HTTP, timers and queued React setters ---------- */

// Execute the real mission callback and message helper. Merely checking a
// lease before scheduling a timeout is insufficient: the account (or mission)
// can change before the timeout fires or before React flushes its updaters.
{
  const context = read('src/context/AppContext.jsx')
  const missionSignature = '  const submitMissionStep = useCallback(async (value, displayText = null) => {'
  const missionStart = context.indexOf(missionSignature)
  const missionEnd = context.indexOf('\n  }, [activeCompanion, activeMission, appendLinguaMessages,', missionStart)
  const appendSignature = '  const appendLinguaMessages = useCallback((nextMessages, access = captureLearnerAccess()) => {'
  const appendStart = context.indexOf(appendSignature)
  const appendEnd = context.indexOf('\n  }, [])', appendStart)
  assert.ok(missionStart >= 0 && missionEnd > missionStart, 'real mission callback must be inspectable')
  assert.ok(appendStart >= 0 && appendEnd > appendStart, 'real message helper must be inspectable')
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
  const submit = new AsyncFunction('value', 'displayText', 'deps',
    'with (deps) { ' + context.slice(missionStart + missionSignature.length, missionEnd) + ' }')
  const append = new Function('nextMessages', 'access', 'deps',
    'with (deps) { ' + context.slice(appendStart + appendSignature.length, appendEnd) + ' }')

  async function checkMissionLease(mode) {
    let owner = 'A'
    let resolveReply
    let advances = 0
    let completions = 0
    const generation = { current: 0 }
    const queued = []
    const timers = []
    const enqueue = key => update => queued.push([key, update])
    const state = {
      messages: [{ role: 'lingua', text: 'B original' }],
      typing: false,
      selected: 'B selected',
      feedback: 'B feedback',
      active: { missionId: 'B', currentStepIndex: 0 },
      progress: { owner: 'B' },
      completed: [{ owner: 'B' }],
      celebration: 'B celebration',
    }
    const original = structuredClone(state)
    const steps = mode === 'complete' ? [{ id: 's1', xp: 4 }] : [{ id: 's1', xp: 4 }, { id: 's2', xp: 4 }]
    const details = { mission: { id: 'A-mission', title: 'A mission', targetSkill: 'speaking', rewardXp: 8, steps }, step: steps[0] }
    const reply = {
      reply: 'A reply',
      mission_feedback: { should_advance: mode !== 'retry', feedback: 'A feedback' },
    }
    const deps = {
      activeMission: { missionId: 'A-mission', currentStepIndex: 0 },
      missionGenerationRef: generation,
      captureLearnerAccess: () => ({ valid: () => owner === 'A' }),
      getActiveMissionDetails: () => details,
      setMessages: enqueue('messages'),
      setIsTyping: enqueue('typing'),
      setMissionFeedback: enqueue('feedback'),
      setActiveMission: enqueue('active'),
      setLocalProgress: enqueue('progress'),
      setCompletedMissions: enqueue('completed'),
      setMissionCelebration: enqueue('celebration'),
      setSelectedMessage: enqueue('selected'),
      setTimeout: fn => { timers.push(fn) },
      appendLinguaMessages: (messages, access) => append(messages, access, deps),
      messages: [],
      sendChatMessage: () => mode === 'inflight' || mode === 'cancelled'
        ? new Promise(resolve => { resolveReply = resolve })
        : Promise.resolve(reply),
      profile: { level: 'A1', style: 'friendly', goal: '', tutorPersonality: '' },
      sessionId: 'A-session',
      nativeLanguageInfo: { base: 'es' },
      interfaceLanguageInfo: { base: 'es' },
      targetLanguage: 'en',
      tutorPreferences: {},
      activeCompanion: null,
      missionContextFromDetails: () => ({}),
      evaluateMissionStep: () => ({ passed: true, feedback: 'local' }),
      advanceMission: () => {
        advances++
        return mode === 'failed-save' ? null
          : { activeMission: { missionId: 'A-mission', currentStepIndex: 1 }, earnedThisStep: 4 }
      },
      completeMission: () => {
        completions++
        return { missionId: 'A-mission', earnedXp: 4 }
      },
      recordMissionProgress: () => ({ owner: 'A' }),
      createMissionFeedbackMessage: () => ({ missionType: 'feedback' }),
      createMissionStepMessage: () => ({ missionType: 'step' }),
      createMissionCompleteMessage: () => ({ missionType: 'complete' }),
    }
    const pending = submit('answer', null, deps)
    if (mode === 'inflight') {
      owner = 'B'
      assert.equal(typeof resolveReply, 'function')
      resolveReply(reply)
    }
    if (mode === 'cancelled') {
      generation.current++ // abandon/restart before the old HTTP request returns
      resolveReply(reply)
    }
    await pending
    if (mode === 'stale-flush' || mode === 'stale-timer') owner = 'B'
    if (mode === 'stale-timer') {
      assert.equal(timers.length, 1, 'successful mission schedules delayed feedback')
    }
    for (const timer of timers) timer()
    assert.ok(queued.length >= 2, mode + ': real React updates must be exercised')
    for (const [key, update] of queued) {
      assert.equal(typeof update, 'function', mode + ': queued React update must be guarded')
      state[key] = update(state[key])
    }
    if (['inflight', 'cancelled', 'stale-flush', 'stale-timer'].includes(mode)) {
      assert.deepEqual(state, original, mode + ': old mission must not modify new account/mission')
      if (mode === 'inflight' || mode === 'cancelled') assert.equal(advances, 0, 'stale HTTP cannot advance a mission')
    } else if (mode === 'failed-save') {
      assert.equal(state.messages.length, 2, 'failed save leaves the learner answer visible')
      assert.equal(state.typing, false, 'failed save clears typing')
      assert.equal(state.feedback.text, 'No se pudo guardar el avance. Intenta de nuevo.')
      assert.deepEqual(state.progress, original.progress, 'failed save grants no XP')
      assert.deepEqual(state.active, original.active, 'failed save does not advance')
      assert.equal(completions, 0)
      assert.equal(timers.length, 0)
    } else if (mode === 'retry') {
      assert.equal(state.messages.length, 3, 'failed answer receives feedback')
      assert.equal(advances, 0, 'failed answer does not advance')
      assert.equal(state.typing, false)
    } else {
      assert.equal(state.progress.owner, 'A', 'valid mission earns progress')
      assert.equal(state.typing, false)
      assert.equal(state.messages.length, 4, 'valid mission receives feedback and next step/completion')
      assert.equal(advances, 1)
      if (mode === 'complete') {
        assert.equal(completions, 1)
        assert.equal(state.active, null)
        assert.equal(state.messages.at(-1).missionType, 'complete')
      } else {
        assert.equal(state.active.currentStepIndex, 1)
        assert.equal(state.messages.at(-1).missionType, 'step')
      }
    }
  }

  for (const mode of ['current', 'retry', 'complete', 'failed-save', 'inflight', 'cancelled', 'stale-flush', 'stale-timer']) {
    await checkMissionLease(mode)
  }
  ok()
}

/* ---------- 6. profile and chat controls must not cross accounts ---------- */

// Exercise the actual React callbacks: a setter queued by A can be flushed
// only after B is activated. Both a stale flush and a denied initial capture
// must leave B's visible state unchanged.
{
  const context = read('src/context/AppContext.jsx')
  function extract(signature, ending, args) {
    const start = context.indexOf(signature)
    const end = context.indexOf(ending, start)
    assert.ok(start >= 0 && end > start, signature + ' must remain inspectable')
    return new Function(...args, 'deps', 'with (deps) { ' + context.slice(start + signature.length, end) + ' }')
  }
  const updateProfile = extract(
    '  const updateProfile = useCallback((updates) => {',
    '\n  }, [])', ['updates'])
  const selectMessage = extract(
    '  const selectMessage = useCallback((msg) => {',
    '\n  }, [])', ['msg'])
  const clearMessages = extract(
    '  const clearMessages = useCallback(() => {',
    '\n  }, [interfaceLanguageInfo.base])', [])

  function checkDeferredControls(mode) {
    let owner = mode === 'denied' ? 'B' : 'A'
    const queued = []
    const enqueue = key => update => queued.push([key, update])
    const state = {
      profile: { name: 'B profile', level: 'B1' },
      messages: [{ role: 'user', text: 'B private message' }],
      selected: { id: 'B-msg', text: 'B private message' },
    }
    const original = structuredClone(state)
    const deps = {
      captureLearnerAccess: () => ({ valid: () => owner === 'A' }),
      setProfile: enqueue('profile'),
      setMessages: enqueue('messages'),
      setSelectedMessage: enqueue('selected'),
      createWelcomeMessage: language => ({ role: 'lingua', text: 'Welcome ' + language }),
      interfaceLanguageInfo: { base: 'es' },
    }
    updateProfile({ name: 'A profile', level: 'A1' }, deps)
    selectMessage({ id: 'A-msg', text: 'A private message' }, deps)
    clearMessages(deps)
    if (mode === 'stale-flush') owner = 'B'
    if (mode === 'denied') {
      assert.equal(queued.length, 0, 'denied capture must not schedule any state update')
    } else {
      assert.equal(queued.length, 4, 'profile, selection and chat clear must queue protected updates')
    }
    for (const [key, update] of queued) {
      assert.equal(typeof update, 'function', mode + ': no raw React state replacement is allowed')
      state[key] = update(state[key])
    }
    if (mode === 'current') {
      assert.deepEqual(state.profile, { name: 'A profile', level: 'A1' })
      assert.deepEqual(state.messages, [{ role: 'lingua', text: 'Welcome es' }])
      assert.equal(state.selected, null)
    } else {
      assert.deepEqual(state, original, mode + ': A cannot overwrite B after lease loss')
    }
  }
  for (const mode of ['current', 'stale-flush', 'denied']) checkDeferredControls(mode)

  // The selection toggle itself still works on the originating account.
  let selected = { id: 'A-msg' }
  const deps = {
    captureLearnerAccess: () => ({ valid: () => true }),
    setSelectedMessage: updater => { selected = updater(selected) },
  }
  selectMessage({ id: 'A-msg' }, deps)
  assert.equal(selected, null, 'selecting the active message toggles it off')
  selectMessage({ id: 'A-other' }, deps)
  assert.equal(selected.id, 'A-other', 'a new message can still be selected')
  ok()
}

/* ---------- 7. reset progress must never clear or repaint another account ---------- */
{
  const context = read('src/context/AppContext.jsx')
  const signature = '  const resetLocalProgress = useCallback(() => {'
  const start = context.indexOf(signature)
  const end = context.indexOf('\n  }, [t, interfaceLanguageInfo.base])', start)
  assert.ok(start >= 0 && end > start, 'reset progress callback must remain inspectable')
  const reset = new Function('deps', 'with (deps) { ' + context.slice(start + signature.length, end) + ' }')

  function checkReset(mode) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let confirmations = 0, progressClears = 0, missionClears = 0, sessions = 0
    const queued = []
    const state = {
      session: 'B-session',
      messages: [{ text: 'B private conversation' }],
      progress: { xp: 90 },
      selected: { id: 'B-message' },
      connection: 'B connection',
      memory: 'B memory',
      active: { missionId: 'B-mission' },
      completed: ['B-mission'],
      feedback: 'B feedback',
      celebration: 'B celebration',
      view: 'chat',
    }
    const original = structuredClone(state)
    const generation = { current: 7 }
    const enqueue = key => update => queued.push([key, update])
    const deps = {
      captureLearnerAccess: () => ({ valid: () => owner === 'A' }),
      window: { confirm: () => {
        confirmations++
        if (mode === 'revoked-confirm') owner = 'B'
        return mode !== 'cancelled'
      } },
      t: key => key,
      clearStoredProgress: () => { progressClears++; if (mode === 'revoked-clear') owner = 'B' },
      createSessionId: () => { sessions++; return 'A-new-session' },
      createWelcomeMessage: lang => ({ text: 'Welcome ' + lang }),
      createEmptyProgress: () => ({ xp: 0 }),
      clearMissionStorage: () => { missionClears++ },
      missionGenerationRef: generation,
      interfaceLanguageInfo: { base: 'es' },
      setSessionId: enqueue('session'),
      setMessages: enqueue('messages'),
      setLocalProgress: enqueue('progress'),
      setSelectedMessage: enqueue('selected'),
      setConnectionNotice: enqueue('connection'),
      setMemoryNotice: enqueue('memory'),
      setActiveMission: enqueue('active'),
      setCompletedMissions: enqueue('completed'),
      setMissionFeedback: enqueue('feedback'),
      setMissionCelebration: enqueue('celebration'),
      setView: enqueue('view'),
    }
    reset(deps)
    if (mode === 'stale-flush') owner = 'B'
    for (const [key, update] of queued) {
      assert.equal(typeof update, 'function', mode + ': reset must queue lease-checked functional updates')
      state[key] = update(state[key])
    }
    if (mode === 'current') {
      assert.equal(confirmations, 1)
      assert.equal(progressClears, 1)
      assert.equal(missionClears, 1)
      assert.equal(sessions, 1)
      assert.equal(generation.current, 8)
      assert.equal(queued.length, 11)
      assert.deepEqual(state, {
        session: 'A-new-session',
        messages: [{ text: 'Welcome es' }],
        progress: { xp: 0 },
        selected: null, connection: null, memory: null, active: null,
        completed: [], feedback: null, celebration: null, view: 'today',
      })
    } else {
      assert.deepEqual(state, original, mode + ': A reset must not change B UI')
      assert.equal(queued.length, mode === 'stale-flush' ? 11 : 0)
      if (mode === 'stale-flush') {
        assert.equal(progressClears, 1)
        assert.equal(missionClears, 1)
      } else {
        assert.equal(progressClears, mode === 'revoked-clear' ? 1 : 0)
        assert.equal(missionClears, 0)
        assert.equal(sessions, 0)
        assert.equal(generation.current, 7)
      }
      if (mode === 'denied') assert.equal(confirmations, 0)
    }
  }
  for (const mode of ['current', 'stale-flush', 'denied', 'cancelled', 'revoked-confirm', 'revoked-clear']) {
    checkReset(mode)
  }
  ok()
}

/* ---------- 8. visual preferences must not repaint a different account ---------- */
{
  const context = read('src/context/AppContext.jsx')
  const appearanceSource = read('src/services/chatAppearance.js')
  const preferencesSource = read('src/services/tutorPreferences.js')
  function body(source, signature, end = '\n}') {
    const start = source.indexOf(signature)
    const finish = source.indexOf(end, start + signature.length)
    assert.ok(start >= 0 && finish > start, signature + ' must remain inspectable')
    return source.slice(start + signature.length, finish)
  }
  const setAppearance = new Function('next', 'deps', 'with (deps) { ' +
    body(context, '  const setChatAppearance = useCallback((next) => {', '\n  }, [])') + ' }')
  const setSize = new Function('size', 'deps', 'with (deps) { ' +
    body(context, '  const setTextSize = useCallback((size) => {', '\n  }, [])') + ' }')
  const saveAppearance = new Function('appearance', 'options', 'deps',
    'with (deps) { const { access = null } = options || {}; ' +
    body(appearanceSource, 'export function saveChatAppearance(appearance, { access = null } = {}) {') + ' }')
  const saveSize = new Function('size', 'options', 'deps',
    'with (deps) { const { access = null } = options || {}; ' +
    body(preferencesSource, 'export function saveTextSize(size, { access = null } = {}) {') + ' }')

  for (const mode of ['current', 'stale-flush', 'denied', 'revoked-write', 'rejected-write', 'mismatch-readback', 'storage-throws']) {
    let owner = mode === 'denied' ? 'B' : 'A'
    const storage = {}
    let writes = 0
    const queued = []
    const state = { appearance: { background: 'dots' }, size: 'large' }
    const original = structuredClone(state)
    const access = {
      valid: () => owner === 'A',
      setItem: (key, value) => {
        writes++
        if (mode === 'storage-throws') throw new Error('Storage unavailable')
        if (mode === 'rejected-write') return false
        storage[key] = value
        if (mode === 'revoked-write') owner = 'B'
        return true
      },
      getItem: key => mode === 'mismatch-readback' ? 'other-tab-value' : storage[key],
    }
    const deps = {
      captureLearnerAccess: () => access,
      saveChatAppearance: (next, options) => saveAppearance(next, options, {
        KEY: 'appearance', sanitizeChatAppearance: value => ({ ...value }),
      }),
      saveTextSize: (size, options) => saveSize(size, options, { TEXT_SIZE_KEY: 'size' }),
      setChatAppearanceState: update => queued.push(['appearance', update]),
      setTextSizeState: update => queued.push(['size', update]),
    }
    const appearanceResult = setAppearance({ background: 'paper' }, deps)
    const sizeResult = setSize('normal', deps)
    if (mode === 'stale-flush') owner = 'B'
    for (const [key, update] of queued) {
      assert.equal(typeof update, 'function', mode + ': React must receive a lease-checked updater')
      state[key] = update(state[key])
    }
    if (mode === 'current') {
      assert.equal(appearanceResult, true)
      assert.equal(sizeResult, true)
      assert.deepEqual(state, { appearance: { background: 'paper' }, size: 'normal' })
      assert.equal(writes, 2)
      assert.equal(queued.length, 2)
    } else {
      assert.equal(appearanceResult, mode === 'stale-flush')
      assert.equal(sizeResult, mode === 'stale-flush')
      assert.deepEqual(state, original, mode + ': A appearance cannot repaint B')
      assert.equal(queued.length, mode === 'stale-flush' ? 2 : 0)
      if (mode === 'denied') assert.equal(writes, 0)
      if (mode === 'revoked-write') assert.equal(writes, 1)
    }
  }
  ok()
}


/* ---------- 9. episode XP/items cannot cross an account lease ---------- */
{
  const context = read('src/context/AppContext.jsx')
  const signature = '  const awardEpisode = useCallback((episode, { grants = [] } = {}) => {'
  const start = context.indexOf(signature)
  const end = context.indexOf('\n  }, [])', start)
  assert.ok(start >= 0 && end > start, 'episode award callback must remain inspectable')
  const award = new Function('episode', 'options', 'deps',
    'with (deps) { const { grants = [] } = options || {}; ' +
    context.slice(start + signature.length, end) + ' }')

  for (const mode of ['current', 'stale-flush', 'denied', 'revoked-load', 'revoked-grant', 'revoked-save']) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let loads = 0, seen = 0, saves = 0
    const queued = []
    const model = { seen: [] }
    const progress = mode === 'current'
      ? { xp: 9, learnedItems: [{ vocabId: 'existing' }] }
      : { xp: 90, learnedItems: [{ vocabId: 'B-private' }] }
    const original = structuredClone(progress)
    const deps = {
      captureLearnerAccess: () => ({ valid: () => owner === 'A' }),
      loadLearnerModel: () => {
        loads++
        if (mode === 'revoked-load') owner = 'B'
        return model
      },
      recordItemSeen: (learner, id) => {
        seen++
        learner.seen.push(id)
        if (mode === 'revoked-grant') owner = 'B'
      },
      saveLearnerModel: () => {
        saves++
        if (mode === 'revoked-save') owner = 'B'
      },
      setLocalProgress: updater => queued.push(updater),
    }
    const result = award({ xp: 5 }, {
      grants: [{ vocabId: 'new-word' }, { vocabId: 'existing' }],
    }, deps)
    if (mode === 'stale-flush') owner = 'B'
    for (const update of queued) {
      assert.equal(typeof update, 'function', mode + ': React update must be lease-checked')
      Object.assign(progress, update(progress))
    }
    if (mode === 'current') {
      assert.equal(result, true)
      assert.equal(loads, 1)
      assert.equal(seen, 2)
      assert.equal(saves, 1)
      assert.equal(queued.length, 1)
      assert.equal(progress.xp, 14)
      assert.deepEqual(progress.learnedItems.map(item => item.vocabId), ['new-word', 'existing'])
    } else {
      assert.deepEqual(progress, original, mode + ': stale episode must not award B')
      assert.equal(queued.length, mode === 'stale-flush' ? 1 : 0)
      if (mode === 'denied') assert.equal(loads, 0)
      if (mode === 'revoked-load') assert.equal(seen, 0)
      if (mode === 'revoked-grant') assert.equal(saves, 0)
      if (mode === 'revoked-save') assert.equal(saves, 1)
    }
  }
  ok()
}


/* ---------- 10. daily-session completion must not award another account ---------- */
{
  const context = read('src/context/AppContext.jsx')
  const sessionSource = read('src/learning/engine/session.js')
  const extract = (source, signature, ending) => {
    const start = source.indexOf(signature)
    const end = source.indexOf(ending, start + signature.length)
    assert.ok(start >= 0 && end > start, signature + ' must remain inspectable')
    return source.slice(start + signature.length, end)
  }
  const finish = new Function('deps', 'with (deps) { ' +
    extract(context, '  const finishSession = useCallback(() => {', '\n  }, [dailySession])') + ' }')
  const save = new Function('session', 'options', 'deps',
    'with (deps) { const { access = null } = options || {}; ' +
    extract(sessionSource, 'export function saveSession(session, { access = null } = {}) {', '\n}') + ' }')

  for (const mode of [
    'current', 'stale-flush', 'denied', 'revoked-load', 'revoked-complete',
    'revoked-model-save', 'rejected-save', 'mismatch-save', 'revoked-save',
  ]) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let loads = 0
    let completions = 0
    let modelSaves = 0
    let writes = 0
    const storage = {}
    const queued = []
    const state = {
      daily: { status: 'planned' }, progress: { xp: 3 }, active: true,
      episode: 'episode-A', arc: 2, view: 'practice',
    }
    const original = structuredClone(state)
    const access = {
      valid: () => owner === 'A',
      setItem: (key, value) => {
        writes++
        if (mode === 'rejected-save') return false
        storage[key] = value
        if (mode === 'revoked-save') owner = 'B'
        return true
      },
      getItem: key => mode === 'mismatch-save' ? 'another-tab-value' : storage[key],
    }
    const queue = key => update => queued.push([key, update])
    const deps = {
      SESSION_BONUS_XP: 15,
      dailySession: { id: 'A-session', status: 'planned' },
      captureLearnerAccess: () => access,
      loadLearnerModel: () => {
        loads++
        if (mode === 'revoked-load') owner = 'B'
        return {}
      },
      completeSession: session => {
        completions++
        if (mode === 'revoked-complete') owner = 'B'
        return { session: { ...session, status: 'completed' }, awarded: true }
      },
      saveLearnerModel: () => {
        modelSaves++
        if (mode === 'revoked-model-save') owner = 'B'
      },
      saveSession: (session, options) => save(session, options, {
        SESSION_KEY: 'daily-session',
        localStorage: { setItem: () => { throw new Error('unscoped write') } },
      }),
      setDailySession: queue('daily'),
      setLocalProgress: queue('progress'),
      setSessionActive: queue('active'),
      setEpisodeActiveId: queue('episode'),
      setEpisodeArcVersion: queue('arc'),
      setView: queue('view'),
    }
    const result = finish(deps)
    if (mode === 'stale-flush') owner = 'B'
    for (const [key, update] of queued) {
      assert.equal(typeof update, 'function', mode + ': React must receive a guarded updater')
      state[key] = update(state[key])
    }
    if (mode === 'current') {
      assert.equal(result, true)
      assert.equal(state.daily.status, 'completed')
      assert.equal(state.progress.xp, 18)
      assert.equal(state.active, false)
      assert.equal(state.episode, null)
      assert.equal(state.arc, 3)
      assert.equal(state.view, 'today')
      assert.equal(writes, 1)
      assert.equal(loads, 1)
      assert.equal(completions, 1)
      assert.equal(modelSaves, 1)
      assert.equal(queued.length, 6)
    } else {
      assert.deepEqual(state, original, mode + ': A completion cannot mutate B UI')
      assert.equal(queued.length, mode === 'stale-flush' ? 6 : 0)
      if (mode === 'denied') assert.equal(loads, 0)
      if (mode === 'revoked-load') assert.equal(completions, 0)
      if (mode === 'revoked-complete') assert.equal(modelSaves, 0)
      if (mode === 'revoked-model-save') assert.equal(writes, 0)
    }
  }
  ok()
}


/* ---------- 11. advancing a daily block must remain in the originating account ---------- */
{
  const context = read('src/context/AppContext.jsx')
  const sessionSource = read('src/learning/engine/session.js')
  const extract = (source, signature, ending) => {
    const start = source.indexOf(signature)
    const end = source.indexOf(ending, start + signature.length)
    assert.ok(start >= 0 && end > start, signature + ' must remain inspectable')
    return source.slice(start + signature.length, end)
  }
  const advance = new Function('deps', 'with (deps) { ' +
    extract(context, '  const advanceSession = useCallback(() => {', '\n  }, [dailySession])') + ' }')
  const save = new Function('session', 'options', 'deps',
    'with (deps) { const { access = null } = options || {}; ' +
    extract(sessionSource, 'export function saveSession(session, { access = null } = {}) {', '\n}') + ' }')

  for (const mode of [
    'current', 'stale-flush', 'denied', 'no-session', 'revoked-advance',
    'rejected-save', 'mismatch-save', 'revoked-save',
  ]) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let advances = 0, writes = 0
    const storage = {}, queued = []
    const state = {
      daily: { id: 'A-session', currentBlockIndex: 1, status: 'active' },
      arc: 5,
    }
    const original = structuredClone(state)
    const access = {
      valid: () => owner === 'A',
      setItem: (key, value) => {
        writes++
        if (mode === 'rejected-save') return false
        storage[key] = value
        if (mode === 'revoked-save') owner = 'B'
        return true
      },
      getItem: key => mode === 'mismatch-save' ? 'newer-tab-value' : storage[key],
    }
    const deps = {
      captureLearnerAccess: () => access,
      dailySession: mode === 'no-session' ? null : original.daily,
      advanceBlock: session => {
        advances++
        if (mode === 'revoked-advance') owner = 'B'
        return { ...session, currentBlockIndex: session.currentBlockIndex + 1 }
      },
      saveSession: (session, options) => save(session, options, {
        SESSION_KEY: 'daily-session',
        localStorage: { setItem: () => { throw new Error('unscoped write') } },
      }),
      setEpisodeArcVersion: update => queued.push(['arc', update]),
      setDailySession: update => queued.push(['daily', update]),
    }
    const result = advance(deps)
    if (mode === 'stale-flush') owner = 'B'
    for (const [key, update] of queued) {
      assert.equal(typeof update, 'function', mode + ': React must receive a lease-checked updater')
      state[key] = update(state[key])
    }
    if (mode === 'current') {
      assert.equal(result, true)
      assert.equal(state.daily.currentBlockIndex, 2)
      assert.equal(state.arc, 6)
      assert.equal(writes, 1)
      assert.equal(advances, 1)
      assert.equal(queued.length, 2)
    } else {
      assert.equal(result, mode === 'stale-flush')
      assert.deepEqual(state, original, mode + ': A cannot advance B session')
      assert.equal(queued.length, mode === 'stale-flush' ? 2 : 0)
      if (mode === 'denied' || mode === 'no-session') assert.equal(advances, 0)
      if (mode === 'revoked-advance') assert.equal(writes, 0)
    }
  }
  ok()
}


/* ---------- 12. episode navigation belongs to the account that clicked ---------- */
{
  const context = read('src/context/AppContext.jsx')
  const extract = (signature) => {
    const start = context.indexOf(signature)
    const end = context.indexOf('\n  }, [])', start + signature.length)
    assert.ok(start >= 0 && end > start, signature + ' must remain inspectable')
    // import.meta is valid in the source module, but not in a Function constructor.
    return context.slice(start + signature.length, end).replace('import.meta.env?.DEV', 'false')
  }
  const startEpisode = new Function('episodeId', 'options', 'deps',
    'with (deps) { ' + extract('  const startEpisode = useCallback((episodeId, options = {}) => {') + ' }')
  const exitEpisode = new Function('deps',
    'with (deps) { ' + extract('  const exitEpisode = useCallback(() => {') + ' }')
  const finishEpisode = new Function('deps',
    'with (deps) { ' + extract('  const finishEpisode = useCallback(() => {') + ' }')

  for (const mode of ['current', 'stale-flush', 'denied', 'revoked-request', 'invalid']) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let requests = 0
    const queued = []
    const state = { options: { source: 'previous' }, episode: null, view: 'today', sheet: 'open' }
    const original = structuredClone(state)
    const deps = {
      captureLearnerAccess: () => ({ valid: () => owner === 'A' }),
      episodeRequest: ({ episodeId }) => {
        requests++
        if (mode === 'revoked-request') owner = 'B'
        return mode === 'invalid' ? { ok: false, reason: 'invalid_episode' } : { ok: true, episodeId }
      },
      setEpisodeRunOptions: update => queued.push(['options', update]),
      setEpisodeActiveId: update => queued.push(['episode', update]),
      setView: update => queued.push(['view', update]),
      setMobileSheet: update => queued.push(['sheet', update]),
    }
    const result = startEpisode('episode-A', { source: 'home', wantsOtherBranch: true }, deps)
    if (mode === 'stale-flush') owner = 'B'
    for (const [key, update] of queued) {
      assert.equal(typeof update, 'function', mode + ': React updater must check the captured lease')
      state[key] = update(state[key])
    }
    if (mode === 'current') {
      assert.equal(result.ok, true)
      assert.deepEqual(state, { options: { source: 'home', wantsOtherBranch: true }, episode: 'episode-A', view: 'practice', sheet: null })
      assert.equal(queued.length, 4)
    } else {
      assert.equal(result.ok, mode === 'stale-flush')
      assert.deepEqual(state, original, mode + ': A must not navigate B')
      assert.equal(queued.length, mode === 'stale-flush' ? 4 : 0)
      if (mode === 'denied') assert.equal(requests, 0)
      if (mode === 'invalid') assert.equal(result.reason, 'invalid_episode')
    }
  }

  for (const action of ['exit', 'finish']) {
    for (const mode of ['current', 'stale-flush', 'denied']) {
      let owner = mode === 'denied' ? 'B' : 'A'
      const queued = []
      const state = { episode: 'episode-A', arc: 7, view: 'practice' }
      const original = structuredClone(state)
      const deps = {
        captureLearnerAccess: () => ({ valid: () => owner === 'A' }),
        setEpisodeActiveId: update => queued.push(['episode', update]),
        setEpisodeArcVersion: update => queued.push(['arc', update]),
        setView: update => queued.push(['view', update]),
      }
      const result = action === 'exit' ? exitEpisode(deps) : finishEpisode(deps)
      if (mode === 'stale-flush') owner = 'B'
      for (const [key, update] of queued) {
        assert.equal(typeof update, 'function')
        state[key] = update(state[key])
      }
      if (mode === 'current') {
        assert.equal(result, true)
        assert.equal(state.episode, null)
        assert.equal(state.arc, action === 'finish' ? 8 : 7)
        assert.equal(state.view, action === 'finish' ? 'today' : 'practice')
      } else {
        assert.equal(result, mode === 'stale-flush')
        assert.deepEqual(state, original, action + ': stale A cannot mutate B')
      }
    }
  }
  ok()
}


/* ---------- 13. daily session start and exit retain the initiating lease ---------- */
{
  const context = read('src/context/AppContext.jsx')
  const extract = (signature, suffix) => {
    const start = context.indexOf(signature)
    const end = context.indexOf(suffix, start + signature.length)
    assert.ok(start >= 0 && end > start, signature + ' must remain inspectable')
    return context.slice(start + signature.length, end)
  }
  const begin = new Function('deps', 'with (deps) { ' +
    extract('  const beginSession = useCallback(() => {', '\n  }, [dailySession, preferredDuration, sessionContext])') + ' }')
  const exit = new Function('deps', 'with (deps) { ' +
    extract('  const exitSession = useCallback(() => {', '\n  }, [])') + ' }')

  for (const mode of ['current', 'denied', 'rejected-save', 'revoked-before-save', 'revoked-after-save', 'revoked-during-model', 'stale-flush']) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let saved = 0, facts = 0, modelSaves = 0
    const queued = []
    const planned = { id: 'daily-A', status: 'planned', topic: { source: 'fact', factValue: 'music' } }
    const state = { session: planned, active: false, view: 'today', sheet: 'open' }
    const original = structuredClone(state)
    const deps = {
      captureLearnerAccess: () => ({ valid: () => owner === 'A' }),
      dailySession: planned,
      preferredDuration: 'standard',
      sessionContext: () => ({}),
      ARC: [],
      getOrCreateSession: () => { throw new Error('existing plan should be used') },
      loadLearnerModel: () => {
        if (mode === 'revoked-during-model') owner = 'B'
        return {}
      },
      startSession: plan => {
        if (mode === 'revoked-before-save') owner = 'B'
        return { ...plan, status: 'active' }
      },
      saveSession: (next, { access }) => {
        assert.ok(access.valid())
        saved++
        if (mode === 'revoked-after-save') owner = 'B'
        return mode === 'rejected-save' ? null : next
      },
      markFactUsed: () => { facts++ },
      rotateFactUsage: () => { facts++ },
      saveLearnerModel: () => { modelSaves++ },
      setDailySession: update => queued.push(['session', update]),
      setSessionActive: update => queued.push(['active', update]),
      setView: update => queued.push(['view', update]),
      setMobileSheet: update => queued.push(['sheet', update]),
    }
    const result = begin(deps)
    if (mode === 'stale-flush') owner = 'B'
    for (const [key, update] of queued) {
      assert.equal(typeof update, 'function', 'React publication must recheck the lease')
      state[key] = update(state[key])
    }
    if (mode === 'current') {
      assert.equal(result.status, 'active')
      assert.equal(saved, 1)
      assert.equal(facts, 2)
      assert.equal(modelSaves, 1)
      assert.equal(state.session.status, 'active')
      assert.equal(state.active, true)
      assert.equal(state.view, 'practice')
      assert.equal(state.sheet, null)
    } else {
      if (mode !== 'stale-flush') assert.equal(result, false, mode)
      assert.deepEqual(state, original, mode + ': A cannot start B session')
      assert.equal(queued.length, mode === 'stale-flush' ? 4 : 0)
      if (mode === 'denied' || mode === 'revoked-before-save') assert.equal(saved, 0)
      if (mode === 'rejected-save' || mode === 'revoked-after-save' || mode === 'revoked-during-model') {
        assert.equal(facts, 0)
        assert.equal(modelSaves, 0)
      }
    }
  }

  for (const mode of ['current', 'denied', 'stale-flush']) {
    let owner = mode === 'denied' ? 'B' : 'A'
    const queued = []
    const state = { active: true, episode: 'episode-A', view: 'practice' }
    const original = structuredClone(state)
    const deps = {
      captureLearnerAccess: () => ({ valid: () => owner === 'A' }),
      setSessionActive: update => queued.push(['active', update]),
      setEpisodeActiveId: update => queued.push(['episode', update]),
      setView: update => queued.push(['view', update]),
    }
    const result = exit(deps)
    if (mode === 'stale-flush') owner = 'B'
    for (const [key, update] of queued) {
      assert.equal(typeof update, 'function')
      state[key] = update(state[key])
    }
    if (mode === 'current') {
      assert.equal(result, true)
      assert.deepEqual(state, { active: false, episode: null, view: 'today' })
    } else {
      assert.equal(result, mode === 'stale-flush')
      assert.deepEqual(state, original, mode + ': A cannot exit B session')
    }
  }
  ok()
}


/* ---------- 12. welcome and Chatto tour stay with their account ---------- */

// Exercise the actual callbacks, including delayed React updaters and Storage
// failures. A stale A click must neither dismiss B's overlays nor start B's
// tour; a rejected write must not be presented as a completed step.
{
  const context = read('src/context/AppContext.jsx')
  function callback(name) {
    const signature = `  const ${name} = useCallback(() => {`
    const start = context.indexOf(signature)
    const end = context.indexOf('\n  }, [])', start)
    assert.ok(start >= 0 && end > start, name + ': callback must be inspectable')
    return new Function('deps', 'with (deps) { ' + context.slice(start + signature.length, end) + ' }')
  }
  const welcome = callback('dismissWelcome')
  const tutorial = callback('dismissTutorial')
  for (const action of ['welcome', 'tutorial']) {
    for (const mode of ['current', 'denied', 'stale-flush', 'rejected-write',
      'mismatched-read', 'throwing-read', 'revoked-during-write', 'already-seen']) {
      if (action === 'tutorial' && mode === 'already-seen') continue
      let owner = mode === 'denied' ? 'B' : 'A'
      const storage = new Map()
      if (mode === 'already-seen') storage.set('lc2-tutorial-seen', 'true')
      const state = action === 'welcome'
        ? { welcome: true, tutorial: false }
        : { welcome: false, tutorial: true }
      const original = structuredClone(state)
      const queued = []
      let writes = 0
      const writtenKey = action === 'welcome' ? 'lc2-welcome-seen' : 'lc2-tutorial-seen'
      const access = {
        valid: () => owner === 'A',
        setItem(key, value) {
          writes++
          if (mode === 'rejected-write') return false
          if (mode === 'revoked-during-write') owner = 'B'
          storage.set(key, value)
          return true
        },
        getItem(key) {
          if (key === writtenKey && mode === 'throwing-read') throw new Error('Storage denied')
          if (key === writtenKey && mode === 'mismatched-read') return null
          return storage.get(key) ?? null
        },
      }
      const deps = {
        captureLearnerAccess: () => access,
        setShowWelcome: fn => queued.push(['welcome', fn]),
        setShowTutorial: fn => queued.push(['tutorial', fn]),
      }
      const result = (action === 'welcome' ? welcome : tutorial)(deps)
      if (mode === 'stale-flush') owner = 'B'
      for (const [key, update] of queued) {
        assert.equal(typeof update, 'function', action + ': deferred UI must be lease-checked')
        state[key] = update(state[key])
      }
      const accepted = ['current', 'stale-flush', 'already-seen'].includes(mode)
      assert.equal(result, accepted, action + '/' + mode + ': completion result')
      if (mode === 'current') {
        assert.deepEqual(state, action === 'welcome'
          ? { welcome: false, tutorial: true }
          : { welcome: false, tutorial: false })
      } else if (mode === 'already-seen') {
        assert.deepEqual(state, { welcome: false, tutorial: false },
          'a learner who already finished the tour must not restart it')
      } else {
        assert.deepEqual(state, original, action + '/' + mode + ': no B UI mutation')
      }
      if (mode === 'denied') assert.equal(writes, 0, 'denied lease must not write')
    }
  }
  ok()
}

/* ---------- duration changes cannot replan a different learner's session ---------- */
{
  const context = read('src/context/AppContext.jsx')
  const signature = '  const chooseDuration = useCallback((mode) => {'
  const start = context.indexOf(signature)
  const end = context.indexOf('\n  }, [dailySession, sessionContext])', start)
  assert.ok(start >= 0 && end > start, 'duration callback must remain inspectable')
  const choose = new Function('mode', 'deps',
    'with (deps) { ' + context.slice(start + signature.length, end) + ' }')

  for (const mode of [
    'current', 'stale-flush', 'denied', 'invalid', 'revoked-model',
    'revoked-plan', 'rejected-duration', 'mismatched-duration',
    'throwing-duration', 'revoked-duration', 'rejected-session',
    'revoked-session', 'active-session',
  ]) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let models = 0, plans = 0, sessionSaves = 0, writes = 0
    const queued = []
    const original = {
      duration: 'standard',
      daily: { id: 'original', status: mode === 'active-session' ? 'active' : 'planned' },
    }
    const state = structuredClone(original)
    const storage = new Map()
    const access = {
      valid: () => owner === 'A',
      setItem(key, value) {
        writes++
        if (mode === 'rejected-duration') return false
        if (mode === 'revoked-duration') owner = 'B'
        storage.set(key, value)
        return true
      },
      getItem(key) {
        if (mode === 'throwing-duration') throw new Error('Storage denied')
        if (mode === 'mismatched-duration') return 'another-tab-value'
        return storage.get(key) ?? null
      },
    }
    const deps = {
      DURATION_PREF_KEY: 'duration',
      ARC: [],
      dailySession: original.daily,
      captureLearnerAccess: () => access,
      isDurationMode: value => value === 'quick',
      loadLearnerModel: () => {
        models++
        if (mode === 'revoked-model') owner = 'B'
        return {}
      },
      getOrCreateSession: () => {
        plans++
        if (mode === 'revoked-plan') owner = 'B'
        return { id: 'new', status: 'planned', durationMode: 'quick' }
      },
      sessionContext: () => ({}),
      saveSession: (next, options) => {
        assert.equal(options.access, access, 'save must retain initiating lease')
        sessionSaves++
        if (mode === 'revoked-session') owner = 'B'
        return mode === 'rejected-session' ? null : next
      },
      setPreferredDuration: update => queued.push(['duration', update]),
      setDailySession: update => queued.push(['daily', update]),
    }
    const result = choose(mode === 'invalid' ? 'unknown' : 'quick', deps)
    if (mode === 'stale-flush') owner = 'B'
    for (const [key, update] of queued) {
      assert.equal(typeof update, 'function', mode + ': queued UI must recheck lease')
      state[key] = update(state[key])
    }
    const accepted = ['current', 'stale-flush', 'active-session'].includes(mode)
    assert.equal(result, accepted, mode + ': duration result')
    if (mode === 'current') {
      assert.equal(state.duration, 'quick')
      assert.equal(state.daily.id, 'new')
      assert.equal(sessionSaves, 1)
    } else if (mode === 'active-session') {
      assert.equal(state.duration, 'quick')
      assert.deepEqual(state.daily, original.daily, 'an active session cannot be replanned')
      assert.equal(models, 0)
      assert.equal(plans, 0)
      assert.equal(sessionSaves, 0)
    } else {
      assert.deepEqual(state, original, mode + ': A must not replan B or publish an unsaved preference')
      assert.equal(queued.length, mode === 'stale-flush' ? 2 : 0)
    }
    if (mode === 'denied' || mode === 'invalid') {
      assert.equal(writes, 0)
      assert.equal(models, 0)
    }
    if (mode === 'revoked-model') assert.equal(plans, 0)
    if (mode === 'revoked-plan') assert.equal(writes, 0)
    if (mode === 'rejected-duration') assert.equal(sessionSaves, 0)
  }
  ok()
}


/* ---------- practice mission start/exit must commit to the initiating account ---------- */
{
  const context = read('src/context/AppContext.jsx')
  const missions = read('src/services/missions.js')
  const extract = (source, signature, ending) => {
    const start = source.indexOf(signature)
    const end = source.indexOf(ending, start + signature.length)
    assert.ok(start >= 0 && end > start, signature + ' must remain inspectable')
    return source.slice(start + signature.length, end)
  }
  const persist = new Function('activeMission', 'options', 'deps',
    'with (deps) { const { access = null } = options || {}; ' +
    extract(missions, 'export function saveActiveMission(activeMission, { access = null } = {}) {',
      '\n}\n\nexport function loadCompletedMissions') + ' }')
  const create = new Function('mission', 'options', 'deps',
    'with (deps) { const { access = null } = options || {}; ' +
    extract(missions, 'export function startMission(mission, { access = null } = {}) {',
      '\n}\n\nexport function getActiveMissionDetails') + ' }')
  const start = new Function('mission', 'deps', 'with (deps) { ' +
    extract(context, '  const startPracticeMission = useCallback((mission = null) => {',
      '\n  }, [appendLinguaMessages, profile.goal, profile.level])') + ' }')
  const abandon = new Function('deps', 'with (deps) { ' +
    extract(context, '  const abandonMission = useCallback(() => {',
      '\n  }, [appendLinguaMessages])') + ' }')

  for (const action of ['start', 'abandon']) {
    for (const mode of [
      'current', 'stale-flush', 'denied', 'rejected-write', 'mismatched-read',
      'throwing-read', 'revoked-write',
    ]) {
      let owner = mode === 'denied' ? 'B' : 'A'
      let writes = 0, appends = 0, generations = 0
      const storage = new Map()
      if (action === 'abandon') storage.set('active-mission', '{"missionId":"old"}')
      const queued = []
      const state = {
        mission: action === 'start' ? null : { missionId: 'old' },
        feedback: 'previous', celebration: 'previous',
        view: 'today', sheet: 'open', typing: true,
      }
      const original = structuredClone(state)
      const access = {
        valid: () => owner === 'A',
        setItem(key, value) {
          writes++
          if (mode === 'rejected-write') return false
          storage.set(key, value)
          if (mode === 'revoked-write') owner = 'B'
          return true
        },
        removeItem(key) {
          writes++
          if (mode === 'rejected-write') return false
          storage.delete(key)
          if (mode === 'revoked-write') owner = 'B'
          return true
        },
        getItem(key) {
          if (mode === 'throwing-read') throw new Error('Storage denied')
          if (mode === 'mismatched-read') return 'other-tab-value'
          return storage.get(key) ?? null
        },
      }
      const persistFor = (value, options) => persist(value, options, {
        ACTIVE_KEY: 'active-mission',
        localStorage: { setItem: () => { throw new Error('unscoped mission write') },
          removeItem: () => { throw new Error('unscoped mission clear') } },
      })
      const mission = { id: 'mission-A', title: 'Practice' }
      const deps = {
        captureLearnerAccess: () => access,
        missionGenerationRef: { current: generations },
        profile: { level: 'A1', goal: 'travel' },
        getMissionForToday: () => mission,
        createActiveMission: (selected, options) => create(selected, options, {
          saveActiveMission: persistFor,
        }),
        saveActiveMission: persistFor,
        getActiveMissionDetails: active => ({ mission, step: { id: 'step-A' }, active }),
        createMissionIntroMessage: () => ({ id: 'intro-A' }),
        createMissionStepMessage: () => ({ id: 'step-A' }),
        appendLinguaMessages: (_messages, publication) => {
          appends++
          queued.push(['messages', () => publication.valid()])
        },
        setActiveMission: fn => queued.push(['mission', fn]),
        setMissionFeedback: fn => queued.push(['feedback', fn]),
        setMissionCelebration: fn => queued.push(['celebration', fn]),
        setIsTyping: fn => queued.push(['typing', fn]),
        setView: fn => queued.push(['view', fn]),
        setMobileSheet: fn => queued.push(['sheet', fn]),
      }
      const result = action === 'start' ? start(null, deps) : abandon(deps)
      if (mode === 'stale-flush') owner = 'B'
      for (const [key, update] of queued) {
        assert.equal(typeof update, 'function', action + '/' + mode + ': guarded React update')
        if (key === 'messages') {
          assert.equal(update(), mode === 'current', 'stale mission messages cannot publish')
        } else {
          state[key] = update(state[key])
        }
      }
      assert.equal(result, mode === 'current' || mode === 'stale-flush', action + '/' + mode)
      if (mode === 'current') {
        assert.equal(state.mission?.missionId, action === 'start' ? 'mission-A' : undefined)
        assert.equal(state.feedback, null)
        assert.equal(state.celebration, null)
        assert.equal(state.view, action === 'start' ? 'practice' : 'today')
        assert.equal(appends, 1)
        assert.equal(writes, 1)
        if (action === 'abandon') assert.equal(state.typing, false)
      } else {
        assert.deepEqual(state, original, action + '/' + mode + ': A cannot publish to B')
        assert.equal(appends, mode === 'stale-flush' ? 1 : 0)
        if (mode === 'denied') assert.equal(writes, 0)
      }
    }
  }
  // A null mission or revoked lease must not be saved, even if a caller
  // bypasses the UI and invokes the service directly.
  const denied = { valid: () => false, setItem: () => { throw new Error('write') } }
  assert.equal(create(null, { access: denied }, { saveActiveMission: () => true }), null)
  assert.equal(create({ id: 'x' }, { access: denied }, { saveActiveMission: () => true }), null)
  ok()
}


/* ---------- practice mission advancement must be durably saved under its original lease ---------- */
{
  const missions = read('src/services/missions.js')
  const extract = (signature, ending) => {
    const start = missions.indexOf(signature)
    const end = missions.indexOf(ending, start + signature.length)
    assert.ok(start >= 0 && end > start, signature + ' must remain inspectable')
    return missions.slice(start + signature.length, end)
  }
  const persist = new Function('activeMission', 'options', 'deps',
    'with (deps) { const { access = null } = options || {}; ' +
    extract('export function saveActiveMission(activeMission, { access = null } = {}) {',
      '\n}\n\nexport function loadCompletedMissions') + ' }')
  const advance = new Function('activeMission', 'step', 'answerValue', 'evaluation', 'options', 'deps',
    'with (deps) { const { access = null } = options || {}; ' +
    extract('export function advanceMission(activeMission, step, answerValue, evaluation, { access = null } = {}) {',
      '\n}\n\nexport function completeMission') + ' }')
  for (const mode of ['current', 'denied', 'rejected-write', 'mismatched-read', 'throwing-read', 'revoked-write']) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let writes = 0
    const storage = new Map()
    const access = {
      valid: () => owner === 'A',
      setItem(key, value) {
        writes++
        if (mode === 'rejected-write') return false
        storage.set(key, value)
        if (mode === 'revoked-write') owner = 'B'
        return true
      },
      getItem(key) {
        if (mode === 'throwing-read') throw new Error('Storage denied')
        if (mode === 'mismatched-read') return 'another-tab-value'
        return storage.get(key) ?? null
      },
    }
    const save = (value, options) => persist(value, options, {
      ACTIVE_KEY: 'active-mission',
      localStorage: { setItem: () => { throw new Error('unscoped write') } },
    })
    const result = advance(
      { missionId: 'A', currentStepIndex: 0, earnedXp: 0, answers: [] },
      { id: 's1', type: 'write_sentence', xp: 4 }, 'hello', { passed: true },
      { access }, { saveActiveMission: save },
    )
    if (mode === 'current') {
      assert.equal(result?.activeMission.currentStepIndex, 1)
      assert.equal(result.earnedThisStep, 4)
      assert.equal(JSON.parse(storage.get('active-mission')).earnedXp, 4)
      assert.equal(writes, 1)
    } else {
      assert.equal(result, null, mode + ': unverified write cannot advance')
      if (mode === 'denied') assert.equal(writes, 0)
    }
  }
  ok()
}

console.log(`check-session-surfaces — OK  (${n} surface groups verified)`)
