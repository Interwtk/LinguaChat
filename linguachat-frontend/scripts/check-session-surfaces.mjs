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

/* ---------- stale daily-session completion must not award bonus twice ---------- */
{
  const context = read('src/context/AppContext.jsx')
  assert.match(context, /SESSION_KEY, normalizeSession/,
    'daily session completion must read and validate the durable session')
  const match = context.match(/const finishSession = useCallback\(\(\) => \{([\s\S]*?)\n  \}, \[dailySession\]\)/)
  assert.ok(match, 'daily session completion must remain executable for regression testing')
  const finish = new Function('deps', 'with (deps) { return (() => {' + match[1] + '\n})() }')
  for (const mode of [
    'double-click', 'already-awarded', 'missing', 'denied', 'invalid-json',
    'revoked-after-read', 'different-session', 'rejected-write',
  ]) {
    let valid = true
    let stored = {
      id: '2026-10-30:standard', version: 1, status: 'active',
      awarded: mode === 'already-awarded', dayKey: '2026-10-30',
      durationMode: 'standard', currentBlockIndex: 1,
      blocks: [{ id: 'episode', type: 'start_episode' }, { id: 'completion', type: 'session_completion' }],
    }
    let xp = 0
    let writes = 0
    const deps = {
      dailySession: { ...stored, awarded: false },
      SESSION_KEY: 'lc2-daily-session-v1',
      ARC: [],
      captureLearnerAccess: () => ({
        valid: () => valid,
        getItem: (key) => {
          assert.equal(key, 'lc2-daily-session-v1')
          if (mode === 'denied') throw new Error('Storage denied')
          if (mode === 'missing') return null
          if (mode === 'invalid-json') return '{'
          if (mode === 'revoked-after-read') valid = false
          return JSON.stringify(mode === 'different-session' ? { ...stored, id: 'other' } : stored)
        },
      }),
      normalizeSession: value => value,
      loadLearnerModel: () => ({}),
      completeSession: session => ({
        session: { ...session, status: 'completed', awarded: true },
        awarded: !session.awarded,
      }),
      saveLearnerModel: () => true,
      saveSession: session => {
        if (mode === 'rejected-write') return null
        stored = session
        writes++
        return session
      },
      setDailySession: () => {},
      setLocalProgress: updater => { xp = updater({ xp }).xp },
      setSessionActive: () => {},
      setEpisodeActiveId: () => {},
      setEpisodeArcVersion: () => {},
      setView: () => {},
      SESSION_BONUS_XP: 15,
    }
    const first = finish(deps)
    const second = finish(deps)
    if (mode === 'double-click') {
      assert.equal(first, true)
      assert.equal(second, false, 'stale second click must not finish an already completed cursor')
      assert.equal(xp, 15, 'two completions before React flush must award once')
      assert.equal(writes, 1)
    } else if (mode === 'already-awarded') {
      assert.equal(first, true)
      assert.equal(second, false, 'completed cursor cannot be replayed by a stale click')
      assert.equal(xp, 0, 'durable awarded flag overrides stale React state')
    } else {
      assert.equal(first, false, mode + ': completion must fail closed')
      assert.equal(second, false, mode + ': retry must fail closed')
      assert.equal(xp, 0, mode + ': no XP for failed persistence')
      assert.equal(writes, 0, mode + ': no successful session publication')
    }
  }
  ok()
}

/* ---------- passive chat/progress writes must retain their mount-time lease ---------- */
{
  const context = read('src/context/AppContext.jsx')
  assert.match(context, /const passiveStorageAccessRef = useRef\(captureLearnerAccess\(\)\)/,
    'passive persistence must capture an account lease at mount, not after React flush')
  assert.match(context, /if \(isolation\.claimedGuestData && !isolation\.reloadRequired\)\s*passiveStorageAccessRef\.current = captureLearnerAccess\(\)/,
    'a first guest claim must rebind passive persistence to the new authenticated lease')
  const messageEffect = context.match(/useEffect\(\(\) => \{\s*(saveStoredMessages\(messages, \{ access: passiveStorageAccessRef\.current \}\))\s*\}, \[messages\]\)/)
  const progressEffect = context.match(/useEffect\(\(\) => \{\s*(saveLocalProgress\(localProgress, \{ access: passiveStorageAccessRef\.current \}\))\s*\}, \[localProgress\]\)/)
  assert.ok(messageEffect && progressEffect,
    'passive writers must use their captured lease, never a fresh lease or unscoped storage')
  const runMessages = new Function('deps', 'with (deps) { ' + messageEffect[1] + ' }')
  const runProgress = new Function('deps', 'with (deps) { ' + progressEffect[1] + ' }')
  for (const mode of ['same-account', 'switched-account', 'revoked-tab', 'claimed-guest']) {
    let active = mode === 'same-account' || mode === 'claimed-guest'
    const captured = { valid: () => active }
    const passiveStorageAccessRef = { current: captured }
    const messages = [{ id: 'old-A' }]
    const localProgress = { xp: 42 }
    let writes = 0
    const deps = {
      passiveStorageAccessRef, messages, localProgress,
      saveStoredMessages: (_value, { access }) => {
        assert.equal(access, captured, mode + ': chat uses the original lease')
        if (!access.valid()) return false
        writes++
        return true
      },
      saveLocalProgress: (_value, { access }) => {
        assert.equal(access, captured, mode + ': progress uses the original lease')
        if (!access.valid()) return false
        writes++
        return true
      },
    }
    // These effects run after React commits, potentially after A lost its lease.
    if (mode === 'switched-account' || mode === 'revoked-tab') active = false
    runMessages(deps)
    runProgress(deps)
    assert.equal(writes, active ? 2 : 0, mode + ': stale effects must never persist into B')
  }
  ok()
}

/* ---------- onboarding checkpoint effects must not adopt another account ---------- */
{
  const context = read('src/context/AppContext.jsx')
  assert.doesNotMatch(context, /localStorage\.setItem\('lc2-onboarding-step'/,
    'setup checkpoint must not use a late, dynamically scoped storage write')
  const signature = '  useEffect(() => {\n    // This passive setup checkpoint belongs to the original account lease.'
  const start = context.indexOf(signature)
  const end = context.indexOf('\n  }, [authUser?.id, authStep])', start)
  assert.ok(start >= 0 && end > start, 'account-fenced setup effect must remain inspectable')
  const body = context.slice(start + '  useEffect(() => {\n'.length, end)
  const persistSetup = new Function('deps', 'with (deps) { ' + body + ' }')
  for (const mode of [
    'current', 'switched-account', 'revoked-tab', 'guest-claim',
    'no-user', 'not-setup', 'rejected-write', 'mismatch-read',
    'revoked-after-write', 'denied-storage',
  ]) {
    let valid = !['switched-account', 'revoked-tab'].includes(mode)
    const store = new Map()
    let writes = 0, reads = 0
    const captured = {
      valid: () => valid,
      setItem(key, value) {
        assert.equal(key, 'lc2-onboarding-step')
        writes++
        if (mode === 'denied-storage') throw new Error('Storage denied')
        if (mode === 'rejected-write') return false
        store.set(key, value)
        if (mode === 'revoked-after-write') valid = false
        return true
      },
      getItem(key) {
        reads++
        return mode === 'mismatch-read' ? 'other-step' : store.get(key) ?? null
      },
    }
    persistSetup({
      authUser: mode === 'no-user' ? null : { id: 'account-A' },
      authStep: mode === 'not-setup' ? 'entry' : 'level-reveal',
      SETUP_STEPS: ['level-reveal', 'setup-choice'],
      passiveStorageAccessRef: { current: captured },
    })
    const shouldWrite = !['switched-account', 'revoked-tab', 'no-user', 'not-setup'].includes(mode)
    assert.equal(writes, shouldWrite ? 1 : 0, mode + ': stale or irrelevant effect must not write')
    const shouldRead = ['current', 'guest-claim', 'mismatch-read'].includes(mode)
    assert.equal(reads, shouldRead ? 1 : 0, mode + ': readback must follow a valid committed write')
    if (mode === 'current' || mode === 'guest-claim')
      assert.equal(store.get('lc2-onboarding-step'), 'level-reveal')
  }
  ok()
}

/* ---------- Theme changes must persist under the initiating account lease ---------- */
{
  const context = read('src/context/AppContext.jsx')
  // A passive effect can run after account A has lost its lease and overwrite
  // account B's saved theme. Theme UI must only change after a verified write.
  assert.doesNotMatch(context,
    /useEffect\(\(\) => \{\s*const root = document\.documentElement\s*darkMode \?[^\n]*\n\s*try \{ localStorage\.setItem\('lc2-dark'/,
    'theme persistence must not be replayed by a passive React effect')
  assert.match(context, /const toggleDark = useCallback\(\(\) => persistThemeDark\(!darkModeRef\.current\)/,
    'rapid toggles must use the last verified theme rather than a stale render')
  assert.match(context, /const setThemeDark = useCallback\(\(value\) => persistThemeDark\(value\)/,
    'explicit theme changes must use the same verified writer')
  const signature = '  const persistThemeDark = useCallback((next) => {'
  const start = context.indexOf(signature)
  const end = context.indexOf('\n  }, [])', start)
  assert.ok(start >= 0 && end > start, 'verified theme callback must remain inspectable')
  const persist = new Function('next', 'deps',
    'with (deps) { ' + context.slice(start + signature.length, end) + ' }')

  for (const mode of [
    'current', 'second-toggle', 'stale-flush', 'denied', 'rejected-write',
    'mismatched-read', 'throwing-read', 'revoked-write', 'revoked-read',
  ]) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let writes = 0
    const storage = new Map()
    const darkModeRef = { current: mode === 'second-toggle' }
    const queued = []
    const access = {
      valid: () => owner === 'A',
      setItem(key, value) {
        assert.equal(key, 'lc2-dark')
        writes++
        if (mode === 'rejected-write') return false
        storage.set(key, value)
        if (mode === 'revoked-write') owner = 'B'
        return true
      },
      getItem(key) {
        if (mode === 'throwing-read') throw new Error('Storage denied')
        const value = mode === 'mismatched-read' ? 'unexpected' : storage.get(key) ?? null
        if (mode === 'revoked-read') owner = 'B'
        return value
      },
    }
    const deps = {
      captureLearnerAccess: () => access,
      darkModeRef,
      setDarkMode: updater => queued.push(updater),
    }
    const target = mode === 'second-toggle' ? false : true
    const result = persist(target, deps)
    if (mode === 'stale-flush') owner = 'B'
    let state = mode === 'second-toggle'
    for (const update of queued) {
      assert.equal(typeof update, 'function', mode + ': React must recheck the lease')
      state = update(state)
    }
    const accepted = ['current', 'second-toggle', 'stale-flush'].includes(mode)
    assert.equal(result, accepted, mode + ': persistence result')
    assert.equal(queued.length, accepted ? 1 : 0, mode + ': no false UI success')
    if (mode === 'current' || mode === 'second-toggle') {
      assert.equal(state, target)
      assert.equal(darkModeRef.current, target)
      assert.equal(storage.get('lc2-dark'), String(target))
    } else if (mode === 'stale-flush') {
      assert.equal(state, false, 'a delayed A theme must not repaint B')
      assert.equal(darkModeRef.current, true, 'verified A write stays associated with A')
    } else {
      assert.equal(state, false, mode + ': failed save must not change UI')
      assert.equal(darkModeRef.current, false, mode + ': failed save must not change ref')
    }
    if (mode === 'denied') assert.equal(writes, 0)
  }
  ok()
}

/* ---------- Mission persistence must not be replayed by React effects ---------- */
{
  const context = read('src/context/AppContext.jsx')
  // start/advance/complete/reset already commit under the captured account
  // lease. A delayed passive effect must not resurrect a completed cursor or
  // overwrite a newer completed-history snapshot from another tab.
  assert.doesNotMatch(context, /useEffect\(\(\) => \{\s*saveActiveMission\(activeMission\)/,
    'passive mission persistence can resurrect a completed active cursor')
  assert.doesNotMatch(context, /useEffect\(\(\) => \{\s*saveCompletedMissions\(completedMissions\)/,
    'passive history persistence can replace newer durable completions')
  assert.match(context, /completeMission\(advanced\.activeMission, \{ access \}\)/,
    'mission completion must persist under the original account lease')
  assert.match(context, /clearMissionStorage\(\{ access \}\)/,
    'mission reset must retain its original account lease')
  ok()
}

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
    let requestCount = 0
    const chatGenerationRef = { current: 0 }
    const chatInFlightRef = { current: null }
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
      chatGenerationRef, chatInFlightRef,
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
      sendChatMessage: () => {
        requestCount++
        return ['inflight', 'cleared-inflight', 'duplicate-inflight', 'duplicate-mid-flush'].includes(mode)
          ? new Promise(resolve => { resolveReply = resolve })
          : ['stale-error', 'error-settled'].includes(mode)
            ? Promise.reject(new Error('offline'))
            : Promise.resolve(reply)
      },
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
    let alreadyFlushed = 0
    if (mode === 'duplicate-mid-flush') {
      // React can render the learner message while HTTP is still pending.
      // That interim render must not unlock the turn before Lingua replies.
      for (const [key, update] of queued) state[key] = update(state[key])
      alreadyFlushed = queued.length
      deps.messages = state.messages
      await send('Hello', deps)
      assert.equal(requestCount, 1, 'publishing the user message must not unlock pending HTTP')
      assert.equal(queued.length, alreadyFlushed, 'interim render cannot queue a duplicate message')
    }
    if (mode === 'duplicate-inflight') {
      // React has not flushed isTyping yet. A second submit must not send or
      // award a second response/XP for the same in-flight conversation turn.
      await send('Hello', deps)
      assert.equal(requestCount, 1, 'rapid duplicate sends share one HTTP turn')
      assert.equal(queued.length, 3, 'duplicate must not enqueue a second user message')
    }
    let replacement = null
    if (['inflight', 'cleared-inflight', 'duplicate-inflight', 'duplicate-mid-flush'].includes(mode)) {
      if (mode === 'inflight') owner = 'B'
      if (mode === 'cleared-inflight') {
        chatGenerationRef.current++
        replacement = { generation: chatGenerationRef.current, access: { valid: () => true } }
        chatInFlightRef.current = replacement
      }
      assert.equal(typeof resolveReply, 'function', 'the HTTP request must have started')
      resolveReply(reply)
    }
    await pending
    if (['duplicate-settled', 'duplicate-mid-flush', 'error-settled'].includes(mode)) {
      // HTTP success or failure has settled, but React has not committed
      // the new message list. A second click cannot start the same turn.
      const before = queued.length
      await send('Hello', deps)
      assert.equal(requestCount, 1, mode + ': settled reply cannot be submitted twice before React flush')
      assert.equal(queued.length, before, mode + ': duplicate must not enqueue another learner message')
    }
    if (['current', 'duplicate-inflight', 'duplicate-settled', 'duplicate-mid-flush', 'error-settled', 'stale-success', 'stale-error', 'cleared-before-flush'].includes(mode)) {
      assert.equal(chatInFlightRef.current?.committed, true,
        mode + ': a settled turn stays locked until the message list commits')
    } else {
      assert.equal(chatInFlightRef.current, replacement,
        mode + ': old finally must not unlock a newer conversation')
    }
    if (mode === 'cleared-before-flush') chatGenerationRef.current++
    if (!['current', 'duplicate-inflight', 'duplicate-settled', 'duplicate-mid-flush', 'error-settled', 'cleared-inflight', 'cleared-before-flush'].includes(mode)) owner = 'B'
    assert.ok(queued.length > 0, mode + ': React callbacks must have been queued')
    for (const [key, update] of queued.slice(alreadyFlushed)) {
      assert.equal(typeof update, 'function', mode + ': every queued update must check the lease')
      state[key] = update(state[key])
    }
    if (['current', 'duplicate-inflight', 'duplicate-settled', 'duplicate-mid-flush'].includes(mode)) {
      assert.equal(state.messages.length, 3, 'the valid account still sees its own user/reply messages')
      assert.equal(state.progress.owner, 'A', 'valid practice still updates progress')
      assert.equal(state.connection, 'Connected as A')
      assert.equal(state.typing, false)
    } else if (mode === 'error-settled') {
      assert.equal(state.messages.length, 3, 'failed request retains learner message and fallback reply')
      assert.deepEqual(state.progress, original.progress, 'failed request earns no XP')
      assert.equal(state.typing, false)
    } else {
      assert.deepEqual(state, original, mode + ': A must not modify B after the lease is revoked')
    }
    if (['duplicate-settled', 'duplicate-mid-flush', 'error-settled'].includes(mode)) {
      // A new render with the committed messages must permit the next turn.
      deps.messages = state.messages
      // The first mid-flush request was deliberately held open; the next
      // request is a separate turn and must be allowed to settle normally.
      if (mode === 'duplicate-mid-flush') {
        deps.sendChatMessage = () => { requestCount++; return Promise.resolve(reply) }
      }
      await send('Next turn', deps)
      assert.equal(requestCount, 2, mode + ': next turn unlocks after React publishes messages')
    }
  }

  await checkChatLease('current')
  await checkChatLease('duplicate-inflight')
  await checkChatLease('duplicate-settled')
  await checkChatLease('duplicate-mid-flush')
  await checkChatLease('error-settled')
  await checkChatLease('stale-success')
  await checkChatLease('stale-error')
  await checkChatLease('inflight')
  await checkChatLease('cleared-inflight')
  await checkChatLease('cleared-before-flush')
  assert.match(context, /\+\+chatGenerationRef\.current\s+chatInFlightRef\.current = null/,
    'clearing a conversation must release the old in-flight request')
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
    let requests = 0
    const generation = { current: 0 }
    const missionInFlightRef = { current: null }
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
    const steps = ['complete', 'failed-completion'].includes(mode) ? [{ id: 's1', xp: 4 }] : [{ id: 's1', xp: 4 }, { id: 's2', xp: 4 }]
    const details = { mission: { id: 'A-mission', title: 'A mission', targetSkill: 'speaking', rewardXp: 8, steps }, step: steps[0] }
    const reply = {
      reply: 'A reply',
      mission_feedback: { should_advance: mode !== 'retry', feedback: 'A feedback' },
    }
    const deps = {
      activeMission: { missionId: 'A-mission', currentStepIndex: 0 },
      missionGenerationRef: generation, missionInFlightRef,
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
      sendChatMessage: () => {
        requests++
        return ['inflight', 'cancelled', 'duplicate-inflight', 'replaced-inflight'].includes(mode)
          ? new Promise(resolve => { resolveReply = resolve })
          : Promise.resolve(reply)
      },
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
        return mode === 'failed-completion' ? null : { missionId: 'A-mission', earnedXp: 4 }
      },
      recordMissionProgress: () => ({ owner: 'A' }),
      createMissionFeedbackMessage: () => ({ missionType: 'feedback' }),
      createMissionStepMessage: () => ({ missionType: 'step' }),
      createMissionCompleteMessage: () => ({ missionType: 'complete' }),
    }
    const pending = submit('answer', null, deps)
    if (mode === 'duplicate-inflight') {
      await submit('answer', null, deps)
      assert.equal(requests, 1, 'rapid mission submissions must share one HTTP turn')
      assert.equal(queued.length, 2, 'duplicate mission answer must not queue a second message')
      assert.equal(generation.current, 1, 'duplicate must not invalidate the original answer')
      resolveReply(reply)
    }
    let replacement = null
    if (mode === 'replaced-inflight') {
      generation.current++
      replacement = { generation: generation.current, access: { valid: () => true } }
      missionInFlightRef.current = replacement
      resolveReply(reply)
    }
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
    if (mode === 'duplicate-settled') {
      // The network already resolved, but React has not flushed the next cursor.
      // A second click must not award the same step twice.
      const queuedBefore = queued.length
      await submit('answer', null, deps)
      assert.equal(requests, 1, 'settled reply must not resubmit an uncommitted React cursor')
      assert.equal(queued.length, queuedBefore, 'settled duplicate must not queue another answer')
    }
    if (['current', 'complete', 'duplicate-inflight', 'duplicate-settled', 'stale-flush', 'stale-timer'].includes(mode)) {
      assert.equal(missionInFlightRef.current?.committed, true,
        mode + ': durable step must remain locked until React advances the cursor')
    } else {
      assert.equal(missionInFlightRef.current, replacement,
        mode + ': old mission completion must not release a replacement request lock')
    }
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
    if (['inflight', 'cancelled', 'replaced-inflight', 'stale-flush', 'stale-timer'].includes(mode)) {
      assert.deepEqual(state, original, mode + ': old mission must not modify new account/mission')
      if (['inflight', 'cancelled', 'replaced-inflight'].includes(mode)) assert.equal(advances, 0, 'stale HTTP cannot advance a mission')
    } else if (mode === 'failed-save') {
      assert.equal(state.messages.length, 2, 'failed save leaves the learner answer visible')
      assert.equal(state.typing, false, 'failed save clears typing')
      assert.equal(state.feedback.text, 'No se pudo guardar el avance. Intenta de nuevo.')
      assert.deepEqual(state.progress, original.progress, 'failed save grants no XP')
      assert.deepEqual(state.active, original.active, 'failed save does not advance')
      assert.equal(completions, 0)
      assert.equal(timers.length, 0)
    } else if (mode === 'failed-completion') {
      assert.equal(state.messages.length, 2, 'unsaved completion keeps the answer visible')
      assert.equal(state.typing, false)
      assert.equal(state.feedback.text, 'No se pudo guardar la misión completada. Intenta de nuevo.')
      assert.deepEqual(state.progress, original.progress, 'unsaved completion cannot grant final XP')
      assert.deepEqual(state.active, original.active, 'unsaved completion cannot close the mission')
      assert.deepEqual(state.completed, original.completed)
      assert.equal(state.celebration, original.celebration)
      assert.equal(completions, 1)
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
    if (mode === 'duplicate-settled') {
      // Once React shows the next step, the previous committed lock may be replaced.
      deps.activeMission = state.active
      deps.getActiveMissionDetails = () => ({ ...details, step: steps[1] })
      await submit('next answer', null, deps)
      assert.equal(requests, 2, 'next mission step must remain submit-able')
      assert.equal(generation.current, 2, 'next step owns a new request generation')
    }
  }

  for (const mode of ['current', 'retry', 'complete', 'failed-save', 'failed-completion', 'inflight', 'cancelled', 'duplicate-inflight', 'duplicate-settled', 'replaced-inflight', 'stale-flush', 'stale-timer']) {
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
    '\n  }, [profile])', ['updates'])
  const selectMessage = extract(
    '  const selectMessage = useCallback((msg) => {',
    '\n  }, [])', ['msg'])
  const clearMessages = extract(
    '  const clearMessages = useCallback(() => {',
    '\n  }, [interfaceLanguageInfo.base])', [])

  function checkDeferredControls(mode) {
    let owner = mode === 'denied' ? 'B' : 'A'
    const queued = []
    const chatGenerationRef = { current: 0 }
    const oldRequest = { generation: 0, access: { valid: () => true } }
    const chatInFlightRef = { current: oldRequest }
    const profileStore = new Map([['lc2-profile', JSON.stringify({ name: 'A old', level: 'A0' })]])
    const access = {
      valid: () => owner === 'A',
      getItem: key => profileStore.get(key) ?? null,
      setItem: (key, value) => { profileStore.set(key, value); return true },
    }
    const enqueue = key => update => queued.push([key, update])
    const state = {
      profile: { name: 'B profile', level: 'B1' },
      messages: [{ role: 'user', text: 'B private message' }],
      selected: { id: 'B-msg', text: 'B private message' },
      typing: true,
    }
    const original = structuredClone(state)
    const deps = {
      captureLearnerAccess: () => access,
      profile: { name: 'A old', level: 'A0' },
      chatGenerationRef, chatInFlightRef,
      setProfile: enqueue('profile'),
      setMessages: enqueue('messages'),
      setSelectedMessage: enqueue('selected'),
      setIsTyping: enqueue('typing'),
      createWelcomeMessage: language => ({ role: 'lingua', text: 'Welcome ' + language }),
      // This older deferred-React regression supplies a successful durable
      // writer; the new dedicated block below tests real read-back failures.
      saveStoredMessages: (_messages, { access }) => access.valid(),
      interfaceLanguageInfo: { base: 'es' },
    }
    updateProfile({ name: 'A profile', level: 'A1' }, deps)
    selectMessage({ id: 'A-msg', text: 'A private message' }, deps)
    clearMessages(deps)
    if (mode === 'stale-flush') owner = 'B'
    if (mode === 'denied') {
      assert.equal(queued.length, 0, 'denied capture must not schedule any state update')
    } else {
      assert.equal(queued.length, 5, 'profile, selection, typing and chat clear must queue protected updates')
    }
    assert.equal(chatGenerationRef.current, mode === 'denied' ? 0 : 1)
    assert.equal(chatInFlightRef.current, mode === 'denied' ? oldRequest : null,
      mode + ': only a successful clear releases its pending chat request')
    for (const [key, update] of queued) {
      assert.equal(typeof update, 'function', mode + ': no raw React state replacement is allowed')
      state[key] = update(state[key])
    }
    if (mode === 'current') {
      assert.deepEqual(state.profile, { name: 'A profile', level: 'A1' })
      assert.deepEqual(state.messages, [{ role: 'lingua', text: 'Welcome es' }])
      assert.equal(state.selected, null)
      assert.equal(state.typing, false)
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

/* ---------- 7. reset progress must fail closed on rejected durable writes ---------- */
{
  const context = read('src/context/AppContext.jsx')
  const signature = '  const resetLocalProgress = useCallback(() => {'
  const start = context.indexOf(signature)
  const end = context.indexOf('\n  }, [t, interfaceLanguageInfo.base])', start)
  assert.ok(start >= 0 && end > start, 'reset progress callback must remain inspectable')
  const reset = new Function('deps', 'with (deps) { ' + context.slice(start + signature.length, end) + ' }')

  function checkReset(mode) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let confirmations = 0, progressClears = 0, missionClears = 0, sessions = 0, chatWrites = 0, progressWrites = 0
    const access = { valid: () => owner === 'A' }
    const queued = []
    const state = {
      session: 'B-session', messages: [{ text: 'B private conversation' }],
      progress: { xp: 90 }, selected: { id: 'B-message' },
      typing: true, connection: 'B connection', memory: 'B memory',
      active: { missionId: 'B-mission' }, completed: ['B-mission'],
      feedback: 'B feedback', celebration: 'B celebration', view: 'chat',
    }
    const original = structuredClone(state)
    const generation = { current: 7 }
    const chatGenerationRef = { current: 0 }
    const oldRequest = { generation: 0, access: { valid: () => true } }
    const chatInFlightRef = { current: oldRequest }
    const enqueue = key => update => queued.push([key, update])
    const deps = {
      captureLearnerAccess: () => access,
      window: { confirm: () => {
        confirmations++
        if (mode === 'revoked-confirm') owner = 'B'
        return mode !== 'cancelled'
      } },
      t: key => key,
      clearStoredProgress: options => {
        assert.equal(options.access, access, 'progress removal must retain the original lease')
        progressClears++
        if (mode === 'revoked-clear') owner = 'B'
        return mode !== 'rejected-progress' && owner === 'A'
      },
      clearMissionStorage: options => {
        assert.equal(options.access, access, 'mission removal must retain the original lease')
        missionClears++
        if (mode === 'revoked-mission') owner = 'B'
        return mode !== 'rejected-mission' && owner === 'A'
      },
      createSessionId: options => {
        assert.equal(options.access, access, 'new session ID must be written under the original lease')
        sessions++
        return mode === 'rejected-session' ? null : 'A-new-session'
      },
      saveStoredMessages: (messages, options) => {
        assert.equal(options.access, access, 'welcome must be durably stored under the original lease')
        assert.equal(messages[0].text, 'Welcome es')
        chatWrites++
        return mode !== 'rejected-chat'
      },
      saveLocalProgress: (progress, options) => {
        assert.equal(options.access, access, 'empty progress must be durably stored under the original lease')
        assert.equal(progress.xp, 0)
        progressWrites++
        return mode !== 'rejected-empty-progress'
      },
      createWelcomeMessage: lang => ({ text: 'Welcome ' + lang }),
      createEmptyProgress: () => ({ xp: 0 }),
      missionGenerationRef: generation,
      chatGenerationRef, chatInFlightRef,
      interfaceLanguageInfo: { base: 'es' },
      setSessionId: enqueue('session'),
      setMessages: enqueue('messages'),
      setLocalProgress: enqueue('progress'),
      setSelectedMessage: enqueue('selected'),
      setIsTyping: enqueue('typing'),
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
    const accepted = ['current', 'stale-flush'].includes(mode)
    assert.equal(chatGenerationRef.current, accepted ? 1 : 0, mode + ': invalidate only after durable reset')
    assert.equal(chatInFlightRef.current, accepted ? null : oldRequest,
      mode + ': only a verified reset releases its pending chat request')
    assert.equal(generation.current, accepted ? 8 : 7, mode + ': mission invalidation follows durable reset')
    assert.equal(queued.length, accepted ? 12 : 0, mode + ': no UI reset after a failed durable step')
    if (mode === 'current') {
      assert.equal(confirmations, 1)
      assert.equal(progressClears, 1)
      assert.equal(missionClears, 1)
      assert.equal(sessions, 1)
      assert.equal(chatWrites, 1)
      assert.equal(progressWrites, 1)
      assert.deepEqual(state, {
        session: 'A-new-session', messages: [{ text: 'Welcome es' }],
        progress: { xp: 0 }, selected: null, typing: false,
        connection: null, memory: null, active: null, completed: [],
        feedback: null, celebration: null, view: 'today',
      })
    } else {
      assert.deepEqual(state, original, mode + ': failed or stale reset must not repaint account UI')
      if (mode === 'denied') assert.equal(confirmations, 0)
      if (['denied', 'cancelled', 'revoked-confirm'].includes(mode)) assert.equal(progressClears, 0)
      if (mode === 'rejected-progress' || mode === 'revoked-clear') assert.equal(missionClears, 0)
      if (mode === 'rejected-mission' || mode === 'revoked-mission') assert.equal(sessions, 0)
      if (mode === 'rejected-session') assert.equal(chatWrites, 0)
      if (mode === 'rejected-chat') assert.equal(progressWrites, 0)
    }
  }
  for (const mode of [
    'current', 'stale-flush', 'denied', 'cancelled', 'revoked-confirm', 'revoked-clear',
    'rejected-progress', 'rejected-mission', 'revoked-mission', 'rejected-session',
    'rejected-chat', 'rejected-empty-progress',
  ]) checkReset(mode)
  ok()
}

/* ---------- 7b. reset storage primitives must verify each account-scoped write ---------- */
{
  const localSource = read('src/services/localProgress.js')
  const missionSource = read('src/services/missions.js')
  const extract = (source, signature) => {
    const start = source.indexOf(signature)
    const end = source.indexOf('\n}', start + signature.length)
    assert.ok(start >= 0 && end > start, signature + ' must remain inspectable')
    return new Function('options', 'deps',
      'with (deps) { const { access = null } = options; ' + source.slice(start + signature.length, end) + ' }')
  }
  const clearProgress = extract(localSource, 'export function clearStoredProgress({ access = null } = {}) {')
  const clearMission = extract(missionSource, 'export function clearMissionStorage({ access = null } = {}) {')
  const saveProgress = new Function('progress', 'options', 'deps',
    'with (deps) { const { access = null } = options; ' +
    localSource.split('export function saveLocalProgress(progress, { access = null } = {}) {')[1]?.split('\n}')[0] + ' }')
  const createId = extract(localSource, 'export function createSessionId({ access = null } = {}) {')
  for (const mode of ['current', 'denied', 'rejected-write', 'mismatched-read', 'revoked-write', 'throwing-read']) {
    let owner = mode === 'denied' ? 'B' : 'A'
    const store = new Map([
      ['lc2-session-id', 'old-session'], ['lc2-chat-messages', 'old-chat'],
      ['lc2-local-progress', 'old-progress'], ['lc2-active-mission', 'active'],
      ['lc2-completed-missions', 'completed'],
    ])
    const access = {
      valid: () => owner === 'A',
      removeItem: key => {
        if (mode === 'rejected-write') return false
        store.delete(key)
        if (mode === 'revoked-write') owner = 'B'
        return true
      },
      setItem: (key, value) => {
        if (mode === 'rejected-write') return false
        store.set(key, value)
        if (mode === 'revoked-write') owner = 'B'
        return true
      },
      getItem: key => {
        if (mode === 'throwing-read') throw new Error('denied read')
        if (mode === 'mismatched-read') return 'stale-value'
        return store.get(key) ?? null
      },
    }
    const deps = {
      STORAGE_KEYS: { sessionId: 'lc2-session-id', messages: 'lc2-chat-messages', progress: 'lc2-local-progress' },
      ACTIVE_KEY: 'lc2-active-mission', COMPLETED_KEY: 'lc2-completed-missions',
      makeId: () => 'new-session',
      localStorage: { removeItem: () => { throw new Error('unscoped write') },
        setItem: () => { throw new Error('unscoped write') } },
      writeJSON: () => { throw new Error('unscoped write') },
    }
    const expected = mode === 'current'
    assert.equal(clearProgress({ access }, deps), expected, mode + ': progress keys')
    owner = mode === 'denied' ? 'B' : 'A'
    assert.equal(clearMission({ access }, deps), expected, mode + ': mission keys')
    owner = mode === 'denied' ? 'B' : 'A'
    assert.equal(createId({ access }, deps), expected ? 'new-session' : null, mode + ': session ID')
    owner = mode === 'denied' ? 'B' : 'A'
    assert.equal(saveProgress({ xp: 0 }, { access }, deps), expected, mode + ': empty progress')
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


/* ---------- 8a. legacy companion setter cannot repaint another account ---------- */
{
  const context = read('src/context/AppContext.jsx')
  const preferences = read('src/services/tutorPreferences.js')
  const extract = (source, signature) => {
    const start = source.indexOf(signature)
    const end = source.indexOf('\n}', start + signature.length)
    assert.ok(start >= 0 && end > start, signature + ' must remain inspectable')
    return source.slice(start + signature.length, end)
  }
  const change = new Function('companion', 'deps', 'with (deps) { ' +
    extract(context, '  const setActiveCompanion = useCallback((companion) => {').split('\n  }, [])')[0] + ' }')
  const save = new Function('_companion', 'options', 'deps', 'with (deps) { const { access = null } = options || {}; ' +
    extract(preferences, 'export function saveActiveCompanion(_companion, { access = null } = {}) {') + ' }')
  for (const mode of ['current', 'stale-flush', 'denied', 'revoked-write', 'rejected-write', 'mismatch-readback', 'storage-throws']) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let writes = 0
    const store = new Map()
    const queued = []
    const access = {
      valid: () => owner === 'A',
      setItem: (key, value) => {
        assert.equal(key, 'companion')
        writes++
        if (mode === 'storage-throws') throw new Error('Storage unavailable')
        if (mode === 'rejected-write') return false
        store.set(key, value)
        if (mode === 'revoked-write') owner = 'B'
        return true
      },
      getItem: key => mode === 'mismatch-readback' ? 'chatto' : store.get(key),
    }
    const deps = {
      captureLearnerAccess: () => access,
      saveActiveCompanion: (companion, options) => save(companion, options, {
        ACTIVE_COMPANION_KEY: 'companion', SOLE_COMPANION: 'lingua',
      }),
      setActiveCompanionState: updater => queued.push(updater),
    }
    const result = change('chatto', deps)
    if (mode === 'stale-flush') owner = 'B'
    let state = 'chatto'
    for (const update of queued) {
      assert.equal(typeof update, 'function', mode + ': state must be lease-checked')
      state = update(state)
    }
    const accepted = mode === 'current' || mode === 'stale-flush'
    assert.equal(result, accepted, mode + ': result')
    assert.equal(state, mode === 'current' ? 'lingua' : 'chatto', mode + ': no foreign repaint')
    assert.equal(queued.length, accepted ? 1 : 0, mode + ': queued updates')
    if (mode === 'denied') assert.equal(writes, 0)
  }
  ok()
}

/* ---------- 8a. profile hydration must not replay through a passive effect ---------- */
{
  const context = read('src/context/AppContext.jsx')
  // The pre-auth default or a queued A profile must never overwrite the
  // account-scoped restored profile when a lease is activated or replaced.
  // Onboarding commits and verified profile edits own the durable writes.
  assert.doesNotMatch(context, /localStorage\.setItem\(['"]lc2-profile['"]/,
    'unscoped profile persistence can overwrite a verified account profile')
  assert.match(context, /access\.setItem\('lc2-profile', serialized\)/,
    'profile edits must retain their captured account lease')
  assert.match(context, /commitOnboarding\(access, profileToCommit\)/,
    'onboarding must commit its profile explicitly before entering Home')
  ok()
}

/* ---------- 8b. profile edits must be durably account-scoped ---------- */
{
  const context = read('src/context/AppContext.jsx')
  const signature = '  const updateProfile = useCallback((updates) => {'
  const start = context.indexOf(signature)
  const end = context.indexOf('\n  }, [profile])', start)
  assert.ok(start >= 0 && end > start, 'profile edit must remain inspectable')
  const updateProfile = new Function('updates', 'deps',
    'with (deps) { ' + context.slice(start + signature.length, end) + ' }')

  for (const mode of [
    'current', 'stale-flush', 'denied', 'rejected-write', 'mismatch-readback',
    'revoked-read', 'revoked-write', 'throws-read', 'corrupt-profile',
  ]) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let reads = 0, writes = 0
    let stored = mode === 'corrupt-profile'
      ? '{invalid'
      : JSON.stringify({ name: 'Old', level: 'A1', dailyGoal: 20 })
    const queued = []
    const access = {
      valid: () => owner === 'A',
      getItem: key => {
        assert.equal(key, 'lc2-profile')
        reads++
        if (mode === 'throws-read') throw new Error('Storage denied')
        if (mode === 'revoked-read') owner = 'B'
        if (mode === 'mismatch-readback' && reads > 1) return 'another-tab-write'
        return stored
      },
      setItem: (key, value) => {
        assert.equal(key, 'lc2-profile')
        writes++
        if (mode === 'rejected-write') return false
        stored = value
        if (mode === 'revoked-write') owner = 'B'
        return true
      },
    }
    const deps = {
      captureLearnerAccess: () => access,
      profile: { name: 'Stale', level: 'B1', dailyGoal: 10 },
      setProfile: updater => queued.push(updater),
    }
    const result = updateProfile({ name: 'New' }, deps)
    if (mode === 'stale-flush') owner = 'B'
    const original = mode === 'stale-flush'
      ? { name: 'B-private', level: 'C1' }
      : { name: 'Old', level: 'A1', dailyGoal: 20 }
    let state = { ...original }
    for (const updater of queued) {
      assert.equal(typeof updater, 'function', mode + ': React update must check lease')
      state = updater(state)
    }
    if (mode === 'current') {
      assert.equal(result, true)
      assert.equal(writes, 1)
      assert.equal(queued.length, 1)
      assert.deepEqual(state, { name: 'New', level: 'A1', dailyGoal: 20 })
      assert.deepEqual(JSON.parse(stored), state, 'new name must preserve latest stored profile')
    } else if (mode === 'stale-flush') {
      assert.equal(result, true)
      assert.equal(queued.length, 1)
      assert.deepEqual(state, original, 'A edit cannot repaint B')
    } else {
      assert.equal(result, false, mode)
      assert.equal(queued.length, 0, mode + ': no UI success without verified save')
      assert.deepEqual(state, original, mode)
      if (mode === 'denied' || mode === 'revoked-read' || mode === 'throws-read'
        || mode === 'corrupt-profile') assert.equal(writes, 0, mode)
    }
  }
  const access = { valid: () => true, getItem: () => { throw new Error('unexpected read') } }
  assert.equal(updateProfile(null, {
    captureLearnerAccess: () => access, profile: {}, setProfile: () => {},
  }), false, 'invalid profile update must not read or write')
  const identity = read('src/components/identity/LanguageIdentity.jsx')
  assert.match(identity, /updateProfile\(\{ name: nameInput\.trim\(\) \}\) === true/,
    'name editor must only close after verified persistence')
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

  for (const mode of ['current', 'stale-flush', 'denied', 'revoked-load', 'revoked-grant', 'revoked-save', 'rejected-model-save']) {
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
      saveLearnerModel: (_model, options) => {
        assert.equal(options?.verified, true, 'episode rewards require verified model persistence')
        saves++
        if (mode === 'revoked-save') owner = 'B'
        return mode !== 'rejected-model-save'
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


/* ---------- 10. daily completion requires the current durable completion block ---------- */
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

  const initial = {
    version: 1, id: 'A-session', dayKey: '2026-10-30', durationMode: 'standard',
    currentBlockIndex: 2, status: 'active', awarded: false,
    blocks: [
      { id: 'episode', type: 'start_episode' },
      { id: 'review', type: 'review' },
      { id: 'completion', type: 'session_completion' },
    ],
  }
  for (const mode of [
    'current', 'stale-flush', 'denied', 'revoked-load', 'revoked-complete',
    'revoked-model-save', 'rejected-model-save', 'rejected-save', 'mismatch-save',
    'revoked-save', 'stale-id', 'stale-day', 'stale-index', 'stale-block',
    'stale-status', 'already-completed', 'wrong-visible-block',
    'wrong-durable-type', 'missing', 'invalid-json', 'blocked-read', 'revoked-read',
  ]) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let loads = 0, completions = 0, modelSaves = 0, writes = 0, reads = 0
    const visible = mode === 'wrong-visible-block'
      ? { ...initial, currentBlockIndex: 1 } : initial
    const durable = mode === 'stale-id' ? { ...initial, id: 'other-session' }
      : mode === 'stale-day' ? { ...initial, dayKey: '2026-10-31' }
        : mode === 'stale-index' ? { ...initial, currentBlockIndex: 1 }
          : mode === 'stale-block' ? { ...initial, blocks: [
            initial.blocks[0], initial.blocks[1], { id: 'replanned', type: 'session_completion' },
          ] }
            : mode === 'stale-status' ? { ...initial, status: 'planned' }
              : mode === 'already-completed' ? { ...initial, status: 'completed', awarded: true }
                : mode === 'wrong-durable-type' ? { ...initial, blocks: [
                  initial.blocks[0], initial.blocks[1], { id: 'completion', type: 'review' },
                ] }
                  : visible
    const storage = { 'daily-session': JSON.stringify(durable) }
    if (mode === 'missing') delete storage['daily-session']
    if (mode === 'invalid-json') storage['daily-session'] = '{'
    const queued = []
    const state = {
      daily: structuredClone(visible), progress: { xp: 3 }, active: true,
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
      getItem: key => {
        reads++
        if (mode === 'blocked-read') throw new Error('Storage denied')
        if (mode === 'revoked-read') owner = 'B'
        return mode === 'mismatch-save' && writes > 0 ? 'another-tab-value' : (storage[key] ?? null)
      },
    }
    const queue = key => update => queued.push([key, update])
    const deps = {
      SESSION_BONUS_XP: 15,
      SESSION_KEY: 'daily-session',
      ARC: [],
      normalizeSession: value => value,
      dailySession: structuredClone(visible),
      captureLearnerAccess: () => access,
      loadLearnerModel: () => {
        loads++
        if (mode === 'revoked-load') owner = 'B'
        return {}
      },
      completeSession: session => {
        completions++
        if (mode === 'revoked-complete') owner = 'B'
        return { session: { ...session, status: 'completed', awarded: true }, awarded: true }
      },
      saveLearnerModel: (_model, options) => {
        assert.equal(options?.verified, true, 'daily rewards require verified model persistence')
        modelSaves++
        if (mode === 'revoked-model-save') owner = 'B'
        return mode !== 'rejected-model-save'
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
      assert.equal(result, mode === 'stale-flush', mode + ': only a valid current completion may succeed')
      assert.deepEqual(state, original, mode + ': stale completion cannot mutate B or an older cursor')
      assert.equal(queued.length, mode === 'stale-flush' ? 6 : 0)
      if (mode === 'denied' || mode === 'wrong-visible-block') assert.equal(reads, 0)
      if (mode === 'revoked-load') assert.equal(completions, 0)
      if (mode === 'revoked-complete') assert.equal(modelSaves, 0)
      if (mode === 'revoked-model-save' || mode === 'rejected-model-save') assert.equal(writes, 0)
      if ([
        'stale-id', 'stale-day', 'stale-index', 'stale-block', 'stale-status',
        'already-completed', 'wrong-visible-block', 'wrong-durable-type',
        'missing', 'invalid-json', 'blocked-read', 'revoked-read',
      ].includes(mode)) {
        assert.equal(loads, 0, mode + ': do not read or award a model for stale completion')
        assert.equal(completions, 0, mode)
        assert.equal(modelSaves, 0, mode)
        assert.equal(writes, 0, mode)
      }
    }
  }
  ok()
}


/* ---------- 11. daily block advances must not rewind newer durable progress ---------- */
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

  const initial = {
    version: 1, id: 'A-session', dayKey: '2026-10-30', durationMode: 'standard',
    currentBlockIndex: 1, status: 'active',
    blocks: [{ id: 'first' }, { id: 'second' }, { id: 'completion' }],
  }
  for (const mode of [
    'current', 'double-click', 'stale-flush', 'denied', 'no-session',
    'stale-index', 'stale-block', 'stale-id', 'stale-day', 'stale-status', 'completed',
    'missing', 'invalid-json', 'blocked-read', 'revoked-read',
    'revoked-advance', 'rejected-save', 'mismatch-save', 'revoked-save',
  ]) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let advances = 0, writes = 0
    const durable = mode === 'stale-index' ? { ...initial, currentBlockIndex: 2 }
      : mode === 'stale-block' ? { ...initial, blocks: [{ id: 'first' }, { id: 'replanned' }, { id: 'completion' }] }
        : mode === 'stale-id' ? { ...initial, id: 'other-session' }
          : mode === 'stale-day' ? { ...initial, dayKey: '2026-10-29' }
          : mode === 'stale-status' ? { ...initial, status: 'planned' }
            : mode === 'completed' ? { ...initial, status: 'completed' } : initial
    const storage = { 'daily-session': JSON.stringify(durable) }
    if (mode === 'missing') delete storage['daily-session']
    if (mode === 'invalid-json') storage['daily-session'] = '{'
    const queued = []
    const state = { daily: structuredClone(initial), arc: 5 }
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
      getItem: key => {
        if (mode === 'blocked-read') throw new Error('Storage denied')
        if (mode === 'revoked-read') owner = 'B'
        return mode === 'mismatch-save' && writes > 0 ? 'newer-tab-value' : (storage[key] ?? null)
      },
    }
    const deps = {
      SESSION_KEY: 'daily-session',
      ARC: [],
      normalizeSession: value => value,
      captureLearnerAccess: () => access,
      dailySession: mode === 'no-session' ? null : structuredClone(initial),
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
    if (mode === 'double-click') {
      assert.equal(result, true)
      assert.equal(advance(deps), false, 'a second click before React flush must not advance again')
    }
    if (mode === 'stale-flush') owner = 'B'
    for (const [key, update] of queued) {
      assert.equal(typeof update, 'function', mode + ': React must receive a lease-checked updater')
      state[key] = update(state[key])
    }
    if (mode === 'current' || mode === 'double-click') {
      assert.equal(result, true)
      assert.equal(state.daily.currentBlockIndex, 2)
      assert.equal(state.arc, 6)
      assert.equal(writes, 1)
      assert.equal(advances, 1)
      assert.equal(queued.length, 2)
    } else {
      assert.equal(result, mode === 'stale-flush')
      assert.deepEqual(state, original, mode + ': stale or failed advance must not mutate UI')
      assert.equal(queued.length, mode === 'stale-flush' ? 2 : 0)
      if (mode === 'denied' || mode === 'no-session' || mode.startsWith('stale-')
        && mode !== 'stale-flush' || ['completed', 'missing', 'invalid-json', 'blocked-read', 'revoked-read'].includes(mode)) {
        assert.equal(advances, 0, mode + ': invalid durable cursor must never be advanced')
      }
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

  for (const mode of [
    'current', 'denied', 'rejected-save', 'revoked-before-save',
    'revoked-after-save', 'revoked-during-model', 'rejected-model-save',
    'revoked-after-model-save', 'stale-flush', 'stale-index', 'stale-id', 'stale-day',
    'stale-status', 'stale-block', 'missing', 'invalid-json', 'blocked-read',
    'revoked-during-read', 'absent-current', 'first-session',
    'old-completed', 'completed-today',
  ]) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let saved = 0, facts = 0, modelSaves = 0, reads = 0
    const queued = []
    const planned = {
      id: 'daily-A', dayKey: '2026-10-30', status: 'planned',
      currentBlockIndex: 0, blocks: [{ id: 'intro' }, { id: 'completion' }],
      topic: { source: 'fact', factValue: 'music' },
    }
    const oldCompleted = { ...planned, dayKey: '2026-10-29', status: 'completed' }
    const daily = mode === 'first-session' || mode === 'absent-current'
      ? null : mode === 'old-completed' ? oldCompleted
        : mode === 'completed-today' ? { ...planned, status: 'completed' } : planned
    const stored = mode === 'stale-index' ? { ...planned, currentBlockIndex: 1, status: 'active' }
      : mode === 'stale-id' ? { ...planned, id: 'another-session' }
        : mode === 'stale-day' ? { ...planned, dayKey: '2026-10-29' }
        : mode === 'stale-status' ? { ...planned, status: 'active' }
          : mode === 'stale-block' ? { ...planned, blocks: [{ id: 'replanned' }, { id: 'completion' }] }
            : mode === 'old-completed' ? oldCompleted : daily || planned
    const storage = { 'daily-session': JSON.stringify(stored) }
    if (mode === 'missing' || mode === 'first-session') delete storage['daily-session']
    if (mode === 'invalid-json') storage['daily-session'] = '{'
    const state = { session: daily, active: false, view: 'today', sheet: 'open' }
    const original = structuredClone(state)
    const access = {
      valid: () => owner === 'A',
      getItem: key => {
        assert.equal(key, 'daily-session')
        reads++
        if (mode === 'blocked-read') throw new Error('Storage denied')
        if (mode === 'revoked-during-read') owner = 'B'
        return storage[key] ?? null
      },
    }
    const deps = {
      captureLearnerAccess: () => access,
      SESSION_KEY: 'daily-session',
      normalizeSession: value => value,
      dailySession: daily,
      preferredDuration: 'standard',
      sessionContext: () => ({}),
      ARC: [],
      getOrCreateSession: () => {
        if (mode === 'first-session' || mode === 'old-completed' || mode === 'absent-current') return planned
        if (mode === 'completed-today') return daily
        throw new Error('existing plan should be used')
      },
      loadLearnerModel: () => {
        if (mode === 'revoked-during-model') owner = 'B'
        return {}
      },
      startSession: plan => {
        if (mode === 'revoked-before-save') owner = 'B'
        return { ...plan, status: 'active' }
      },
      saveSession: (next, { access: lease }) => {
        assert.ok(lease.valid())
        saved++
        if (mode === 'revoked-after-save') owner = 'B'
        if (mode === 'rejected-save') return null
        storage['daily-session'] = JSON.stringify(next)
        return next
      },
      markFactUsed: () => { facts++ },
      rotateFactUsage: () => { facts++ },
      saveLearnerModel: (_model, options) => {
        assert.equal(options?.verified, true, 'daily fact usage requires verified model persistence')
        modelSaves++
        if (mode === 'revoked-after-model-save') owner = 'B'
        return mode !== 'rejected-model-save'
      },
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
    if (['current', 'first-session', 'old-completed'].includes(mode)) {
      assert.equal(result.status, 'active', mode)
      assert.equal(saved, 1)
      assert.equal(facts, 2)
      assert.equal(modelSaves, 1)
      assert.equal(state.session.status, 'active')
      assert.equal(state.active, true)
      assert.equal(state.view, 'practice')
      assert.equal(state.sheet, null)
    } else {
      if (mode !== 'stale-flush') assert.equal(result, false, mode)
      assert.deepEqual(state, original, mode + ': stale start must not mutate UI')
      assert.equal(queued.length, mode === 'stale-flush' ? 4 : 0)
      if (['denied', 'stale-index', 'stale-id', 'stale-day', 'stale-status', 'stale-block',
        'missing', 'invalid-json', 'blocked-read', 'revoked-during-read',
        'absent-current', 'completed-today', 'revoked-before-save'].includes(mode)) {
        assert.equal(saved, 0, mode + ': no stale plan may overwrite storage')
        assert.equal(facts, 0)
        assert.equal(modelSaves, 0)
      }
      if (['rejected-save', 'revoked-after-save', 'revoked-during-model'].includes(mode)) {
        assert.equal(facts, 0)
        assert.equal(modelSaves, 0)
      }
    }
    if (mode === 'denied' || mode === 'completed-today') assert.equal(reads, 0)
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

/* ---------- duration changes must not overwrite another tab's daily cursor ---------- */
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
    'revoked-session', 'active-session', 'stale-id', 'stale-day', 'stale-status',
    'stale-index', 'stale-block', 'missing', 'invalid-json',
    'blocked-session-read', 'revoked-session-read', 'absent-current',
    'first-session', 'new-day',
  ]) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let models = 0, plans = 0, sessionSaves = 0, writes = 0
    const queued = []
    const planned = {
      version: 1, id: 'original', dayKey: '2026-10-30',
      durationMode: 'standard', status: 'planned',
      currentBlockIndex: 0, blocks: [{ id: 'intro' }, { id: 'finish' }],
    }
    const original = {
      duration: 'standard',
      daily: ['first-session', 'new-day', 'absent-current'].includes(mode)
        ? null : { ...planned, status: mode === 'active-session' ? 'active' : 'planned' },
    }
    const state = structuredClone(original)
    const storage = new Map()
    const persisted = mode === 'stale-id' ? { ...planned, id: 'other' }
      : mode === 'stale-day' ? { ...planned, dayKey: '2026-10-29' }
      : mode === 'stale-status' ? { ...planned, status: 'active' }
        : mode === 'stale-index' ? { ...planned, currentBlockIndex: 1 }
          : mode === 'stale-block' ? { ...planned, blocks: [{ id: 'other' }, { id: 'finish' }] }
            : mode === 'new-day' ? { ...planned, dayKey: '2026-10-29', status: 'completed' }
              : mode === 'absent-current' ? planned : original.daily
    if (persisted && !['missing', 'first-session'].includes(mode)) {
      storage.set('daily-session', JSON.stringify(persisted))
    }
    if (mode === 'invalid-json') storage.set('daily-session', '{')
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
        if (key === 'daily-session') {
          if (mode === 'blocked-session-read') throw new Error('Storage denied')
          if (mode === 'revoked-session-read') owner = 'B'
          return storage.get(key) ?? null
        }
        assert.equal(key, 'duration')
        if (mode === 'throwing-duration') throw new Error('Storage denied')
        if (mode === 'mismatched-duration') return 'another-tab-value'
        return storage.get(key) ?? null
      },
    }
    const deps = {
      DURATION_PREF_KEY: 'duration',
      SESSION_KEY: 'daily-session',
      normalizeSession: value => value,
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
        return { ...planned, id: 'new', durationMode: 'quick' }
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
    const accepted = ['current', 'stale-flush', 'active-session', 'first-session', 'new-day'].includes(mode)
    assert.equal(result, accepted, mode + ': duration result')
    if (['current', 'first-session', 'new-day'].includes(mode)) {
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
      assert.deepEqual(state, original, mode + ': stale or denied duration must not publish')
      assert.equal(queued.length, mode === 'stale-flush' ? 2 : 0)
    }
    if (mode === 'denied' || mode === 'invalid') {
      assert.equal(writes, 0)
      assert.equal(models, 0)
    }
    if (mode === 'revoked-model') assert.equal(plans, 0)
    if (mode === 'revoked-plan') assert.equal(writes, 0)
    if (mode === 'rejected-duration') assert.equal(sessionSaves, 0)
    if (['stale-id', 'stale-status', 'stale-index', 'stale-block',
      'missing', 'invalid-json', 'blocked-session-read', 'revoked-session-read',
      'absent-current'].includes(mode)) {
      assert.equal(writes, 0, mode + ': stale plan cannot rewrite duration')
      assert.equal(sessionSaves, 0, mode + ': stale plan cannot replace session')
    }
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
    'with (deps) { const { access = null, deferSave = false } = options || {}; ' +
    extract('export function advanceMission(activeMission, step, answerValue, evaluation, { access = null, deferSave = false } = {}) {',
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


/* ---------- final mission completion: no premature XP, idempotent durable record ---------- */
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
  const complete = new Function('activeMission', 'options', 'deps',
    'with (deps) { const { access = null } = options || {}; ' +
    extract('export function completeMission(activeMission, { access = null } = {}) {',
      '\n}\n\nexport function clearMissionStorage') + ' }')
  const advance = new Function('activeMission', 'step', 'answerValue', 'evaluation', 'options', 'deps',
    'with (deps) { const { access = null, deferSave = false } = options || {}; ' +
    extract('export function advanceMission(activeMission, step, answerValue, evaluation, { access = null, deferSave = false } = {}) {',
      '\n}\n\nexport function completeMission') + ' }')

  for (const mode of [
    'current', 'denied', 'rejected-completed', 'mismatched-completed',
    'throwing-read', 'revoked-completed', 'rejected-clear',
    'mismatched-clear', 'revoked-clear', 'stale-cursor', 'malformed-history',
    'retry-clear',
  ]) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let writes = 0, completionWrites = 0, clears = 0, completedReads = 0
    const storage = new Map()
    const saved = { missionId: 'A', currentStepIndex: 0, startedAt: 123, earnedXp: 0, answers: [] }
    if (mode === 'stale-cursor') saved.startedAt = 999
    storage.set('active-mission', JSON.stringify(saved))
    if (mode === 'malformed-history') storage.set('completed-missions', '{broken')
    const access = {
      valid: () => owner === 'A',
      getItem(key) {
        if (mode === 'throwing-read') throw new Error('Storage denied')
        if (key === 'completed-missions') {
          completedReads++
          if (mode === 'mismatched-completed' && completedReads > 1) return 'other-tab-value'
        }
        if (key === 'active-mission' && mode === 'mismatched-clear' && clears > 0) return 'stale-active'
        return storage.get(key) ?? null
      },
      setItem(key, value) {
        writes++
        if (key !== 'completed-missions') throw new Error('unscoped final-step write')
        completionWrites++
        if (mode === 'rejected-completed') return false
        storage.set(key, value)
        if (mode === 'revoked-completed') owner = 'B'
        return true
      },
      removeItem(key) {
        writes++
        clears++
        if (key !== 'active-mission') throw new Error('wrong key cleared')
        if (mode === 'rejected-clear' || (mode === 'retry-clear' && clears === 1)) return false
        storage.delete(key)
        if (mode === 'revoked-clear') owner = 'B'
        return true
      },
    }
    const save = (value, options) => persist(value, options, {
      ACTIVE_KEY: 'active-mission',
      localStorage: { removeItem: () => { throw new Error('unscoped clear') } },
    })
    const active = { ...saved, missionId: 'A', startedAt: 123, currentStepIndex: 1, earnedXp: 4,
      answers: [{ stepId: 's1', xp: 4 }] }
    const deps = {
      ACTIVE_KEY: 'active-mission', COMPLETED_KEY: 'completed-missions',
      getMissionById: () => ({ title: 'Practice', type: 'Daily', steps: [{ id: 's1' }] }),
      saveActiveMission: save,
      loadCompletedMissions: () => { throw new Error('unscoped history read') },
      saveCompletedMissions: () => { throw new Error('unscoped history write') },
    }
    const prepared = advance(saved, { id: 's1', type: 'write_sentence', xp: 4 },
      'hello', { passed: true }, { access, deferSave: true }, {
        saveActiveMission: () => { throw new Error('final step persisted prematurely') },
      })
    assert.equal(Boolean(prepared), mode !== 'denied', mode + ': final step must be memory-only')
    assert.equal(writes, 0, 'preparing final step must never write storage')
    const result = complete(active, { access }, deps)
    if (mode === 'current') {
      assert.equal(result?.missionId, 'A')
      assert.equal(result.earnedXp, 4)
      assert.equal(storage.has('active-mission'), false)
      assert.equal(JSON.parse(storage.get('completed-missions')).length, 1)
      assert.equal(writes, 2)
    } else if (mode === 'retry-clear') {
      assert.equal(result, null, 'failed clear cannot announce completion')
      assert.equal(storage.has('active-mission'), true, 'failed clear leaves retryable step')
      const retried = complete(active, { access }, deps)
      assert.equal(retried?.earnedXp, 4)
      assert.equal(storage.has('active-mission'), false)
      assert.equal(JSON.parse(storage.get('completed-missions')).length, 1)
      assert.equal(completionWrites, 1, 'retry must not duplicate completed history')
    } else {
      assert.equal(result, null, mode + ': unverified completion must fail closed')
      if (mode === 'denied' || mode === 'stale-cursor' || mode === 'throwing-read'
        || mode === 'malformed-history') assert.equal(writes, 0)
    }
  }
  ok()
}


/* ---------- clearing chat must persist to the originating account first ---------- */
{
  const context = read('src/context/AppContext.jsx')
  const progress = read('src/services/localProgress.js')
  const signature = '  const clearMessages = useCallback(() => {'
  const start = context.indexOf(signature)
  const end = context.indexOf('\n  }, [interfaceLanguageInfo.base])', start)
  assert.ok(start >= 0 && end > start, 'clearMessages must remain inspectable')
  const clear = new Function('deps', 'with (deps) { ' +
    context.slice(start + signature.length, end) + ' }')
  const saveStart = progress.indexOf('export function saveStoredMessages(messages, { access = null } = {}) {')
  const saveEnd = progress.indexOf('\n}\n\nexport function createEmptyProgress', saveStart)
  assert.ok(saveStart >= 0 && saveEnd > saveStart, 'durable chat writer must remain inspectable')
  const save = new Function('messages', 'options', 'deps', 'with (deps) { ' +
    'const { access = null } = options || {}; ' +
    progress.slice(saveStart + 'export function saveStoredMessages(messages, { access = null } = {}) {'.length, saveEnd) + ' }')

  for (const mode of [
    'current', 'stale-flush', 'denied', 'rejected-write', 'mismatched-read',
    'throwing-read', 'revoked-during-write', 'revoked-after-read',
  ]) {
    let owner = mode === 'denied' ? 'B' : 'A'
    let writes = 0
    const chatGenerationRef = { current: 0 }
    const oldRequest = { generation: 0, access: { valid: () => true } }
    const chatInFlightRef = { current: oldRequest }
    const stored = new Map([['chat', '[{"id":"old-A"}]']])
    const queued = []
    const state = { messages: [{ id: 'old-A' }], selected: { id: 'old-A' }, typing: true }
    const original = structuredClone(state)
    const access = {
      valid: () => owner === 'A',
      setItem(key, value) {
        writes++
        if (mode === 'rejected-write') return false
        stored.set(key, value)
        if (mode === 'revoked-during-write') owner = 'B'
        return true
      },
      getItem(key) {
        if (mode === 'throwing-read') throw new Error('Storage denied')
        if (mode === 'mismatched-read') return 'unexpected'
        const value = stored.get(key) ?? null
        if (mode === 'revoked-after-read') owner = 'B'
        return value
      },
    }
    const deps = {
      captureLearnerAccess: () => access,
      chatGenerationRef, chatInFlightRef,
      interfaceLanguageInfo: { base: 'es' },
      createWelcomeMessage: () => ({ id: 'welcome-es' }),
      saveStoredMessages: (messages, options) => save(messages, options, {
        STORAGE_KEYS: { messages: 'chat' },
        writeJSON: () => { throw new Error('Durable path bypassed') },
      }),
      setMessages: update => queued.push(['messages', update]),
      setSelectedMessage: update => queued.push(['selected', update]),
      setIsTyping: update => queued.push(['typing', update]),
    }
    const result = clear(deps)
    if (mode === 'stale-flush') owner = 'B'
    for (const [key, update] of queued) {
      assert.equal(typeof update, 'function', mode + ': React update must be fenced')
      state[key] = update(state[key])
    }
    const accepted = mode === 'current' || mode === 'stale-flush'
    assert.equal(result, accepted, mode + ': clear result')
    assert.equal(chatGenerationRef.current, accepted ? 1 : 0, mode + ': invalidate only after durable clear')
    assert.equal(chatInFlightRef.current, accepted ? null : oldRequest,
      mode + ': only a verified clear releases its pending request')
    if (mode === 'current') {
      assert.deepEqual(state, { messages: [{ id: 'welcome-es' }], selected: null, typing: false })
      assert.equal(stored.get('chat'), JSON.stringify([{ id: 'welcome-es' }]))
    } else {
      assert.deepEqual(state, original, mode + ': no unsaved or foreign UI reset')
    }
    if (mode === 'denied') assert.equal(writes, 0)
    if (mode === 'stale-flush') assert.equal(writes, 1, 'A was saved, B UI stays untouched')
  }
  ok()
}

/* ---------- no unscoped effect may replay companion/text size into another account ---------- */
{
  const context = read('src/context/AppContext.jsx')
  // The only writers must be the lease-verified interactive setters. An
  // effect on mount or a late React flush could otherwise overwrite B with A.
  assert.equal((context.match(/\bsaveActiveCompanion\s*\(/g) || []).length, 1,
    'companion must not have an unscoped persistence effect')
  assert.equal((context.match(/\bsaveTextSize\s*\(/g) || []).length, 1,
    'text size must not have an unscoped persistence effect')
  assert.match(context, /saveActiveCompanion\(companion, \{ access \}\)/,
    'companion write must keep the captured lease')
  assert.match(context, /saveTextSize\(size, \{ access \}\)/,
    'text size write must keep the captured lease')
  ok()
}

/* ---------- navigation must not move another account after a queued React flush ---------- */
{
  const context = read('src/context/AppContext.jsx')
  const signature = '  const navigateTo = useCallback((destination) => {'
  const start = context.indexOf(signature)
  const end = context.indexOf('\n  }, [])', start)
  assert.ok(start >= 0 && end > start, 'navigateTo must remain inspectable')
  const navigate = new Function('destination', 'deps',
    'with (deps) { ' + context.slice(start + signature.length, end) + ' }')

  for (const mode of ['current', 'denied', 'stale-flush', 'revoked-after-first-queue']) {
    let owner = mode === 'denied' ? 'B' : 'A'
    const queued = []
    const state = { view: 'today', sheet: 'journey' }
    const original = structuredClone(state)
    const result = navigate('words', {
      captureLearnerAccess: () => ({ valid: () => owner === 'A' }),
      setView: updater => {
        queued.push(['view', updater])
        if (mode === 'revoked-after-first-queue') owner = 'B'
      },
      setMobileSheet: updater => queued.push(['sheet', updater]),
    })
    if (mode === 'stale-flush') owner = 'B'
    for (const [key, updater] of queued) {
      assert.equal(typeof updater, 'function', mode + ': queued navigation must recheck the lease')
      state[key] = updater(state[key])
    }
    if (mode === 'current') {
      assert.equal(result, true)
      assert.deepEqual(state, { view: 'words', sheet: null })
      assert.equal(queued.length, 2)
    } else {
      assert.equal(result, mode === 'stale-flush', mode + ': result')
      assert.deepEqual(state, original, mode + ': stale navigation cannot move B')
      assert.equal(queued.length, mode === 'denied' ? 0 : mode === 'revoked-after-first-queue' ? 1 : 2)
    }
  }
  ok()
}

console.log(`check-session-surfaces — OK  (${n} surface groups verified)`)
