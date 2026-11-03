/*
 * LinguaChat visual bench — development only, synthetic data (see
 * vite.bench.config.mjs). URL: /bench/?scene=tu|call|notes|chat|auth|archive|archive-empty|chats|mission|today|identity|course-today|course-episode|course-session|course-chat|plans|age|account-age
 * &lang=en|es|ja|ar|…&theme=light|dark
 *
 * Every learner shown here is invented. The summaries are derived by the real
 * engine (learnerSummary over models built with the real learner-model and
 * teaching-policy functions), so the screen shows what the code would say.
 */
import { createRoot } from 'react-dom/client'
import '../src/index.css'
import { AppProvider } from './fakeAppContext.jsx'
import { loadLocale, translate } from '../src/i18n/translations.js'
import { createLearnerModel, recordItemAttempt } from '../src/learning/engine/learnerModel.js'
import { observeTeaching } from '../src/learning/engine/teachingPolicy.js'
import { learnerSummary } from '../src/learning/engine/learnerSummary.js'
import { LearningSummaryCard } from '../src/components/identity/LearningSummaryCard.jsx'
import { CallSurface } from '../src/components/call/CallSurface.jsx'
import { NotesSheet } from '../src/components/layout/NotesSheet.jsx'
import { ConversationRoom } from '../src/components/layout/ConversationRoom.jsx'
import { AuthFlow } from '../src/components/auth/AuthFlow.jsx'
import { sanitizeChatAppearance } from '../src/services/chatAppearance.js'
import { ConversationArchive } from '../src/components/archive/ConversationArchive.jsx'
import { ChatsView } from '../src/components/chats/ChatsView.jsx'
import { createEmptyProgress, recordPractice } from '../src/services/localProgress.js'
import { PRACTICE_MISSIONS } from '../src/data/practiceMissions.js'
import { TodayView } from '../src/components/today/TodayView.jsx'
import { LanguageIdentity } from '../src/components/identity/LanguageIdentity.jsx'
import { getOrCreateSession } from '../src/learning/engine/session.js'
import { episodesOfLevel } from '../src/learning/curriculum/levels.js'
import { workingLevelId } from '../src/learning/curriculum/learnerLevel.js'
import { CourseToday } from '../src/components/today/CourseToday.jsx'
import { EpisodeShell } from '../src/components/episode/EpisodeShell.jsx'
import { CourseSessionRunner } from '../src/components/today/CourseSession.jsx'
import { CourseChat } from '../src/components/today/CourseChat.jsx'
import { Pricing } from '../src/components/pricing/Pricing.jsx'
import { buildCourseSessionPlan, saveCourseSession } from '../src/learning/courses/courseSession.js'
import { loadLearnerModel, saveLearnerModel } from '../src/learning/engine/learnerModel.js'
import { ES_SKELETON } from '../src/learning/courses/es/skeleton.js'
import { setEpisodeState, markRecurringError } from '../src/learning/engine/learnerModel.js'
import { createMissionIntroMessage, createMissionStepMessage, createMissionFeedbackMessage, evaluateMissionStep } from '../src/services/missions.js'

const BENCH_MARKER = 'LC_VISUAL_BENCH' // asserted absent from every production build
const params = new URLSearchParams(location.search)
const scene = params.get('scene') || 'tu'
const lang = params.get('lang') || 'en'
const dark = params.get('theme') === 'dark'

const DAY = 86400000
const NOW = Date.now()
function syntheticModel(days) {
  const m = createLearnerModel()
  const turn = (day, { success, independent = true, assisted = false, instruction = 'concise', context = 'neutral' }) => {
    const at = NOW - (days - day) * DAY
    observeTeaching(m, { id: `bench:${day}:${assisted}`, capability: 'introduction', format: 'free_text', session: `d${day}`,
      context, at, success, independent: independent && !assisted, assisted, instruction, channel: 'reading', retried: false })
    recordItemAttempt(m, 'hello', { correct: success, independent: independent && !assisted, atMs: at, capability: 'introduction' })
    if (day % 2) recordItemAttempt(m, 'whats_your_name', { correct: success, independent: false, atMs: at, capability: 'introduction' })
  }
  if (days >= 1) turn(0, { success: false })
  if (days >= 2) turn(1, { success: true, independent: false, assisted: true })
  if (days >= 4) turn(3, { success: false })
  if (days >= 6) { turn(4, { success: true, assisted: true, instruction: 'worked_example' }); turn(5, { success: true, instruction: 'worked_example', context: 'travel' }) }
  if (days >= 9) turn(8, { success: true, instruction: 'worked_example', context: 'food' })
  return m
}

function Scene({ t }) {
  const base = lang.split('-')[0]
  const languageInfo = { code: lang, base, name: lang }
  const common = {
    t, darkMode: dark, profile: { name: 'Ana', preferences: { dailyGoal: 10 } },
    nativeLanguageInfo: languageInfo, interfaceLanguageInfo: languageInfo, targetLanguage: 'en', activeCourse: 'en',
    localProgress: { learnedItems: [{ word: 'hello', vocabId: 'hello' }], topics: [], topicsPracticed: [] },
    messages: [], isTyping: false, chatAppearance: sanitizeChatAppearance({}), episodeArcVersion: 0,
  }
  const card = (title, summary) => (
    <div style={{ marginBottom: 24 }}>
      <p className="eyebrow" style={{ marginBottom: 8 }}>{title}</p>
      <LearningSummaryCard summary={summary} />
    </div>
  )
  if (scene === 'tu') {
    return (
      <AppProvider value={common}>
        <main className="px-4 py-6" style={{ maxWidth: 760, margin: '0 auto' }}>
          {card('synthetic: new learner', learnerSummary(createLearnerModel(), NOW))}
          {card('synthetic: 2 days', learnerSummary(syntheticModel(2), NOW))}
          {card('synthetic: 9 days', learnerSummary(syntheticModel(9), NOW))}
        </main>
      </AppProvider>
    )
  }
  if (scene === 'call') {
    return (
      <AppProvider value={common}>
        {['voice', 'video'].map(mode => (
          <div key={mode} style={{ height: 760, display: 'flex', flexDirection: 'column' }}><CallSurface mode={mode} onClose={() => { window.__benchClosed = mode }} /></div>
        ))}
      </AppProvider>
    )
  }
  const lesson = [
    { id: 'u1', role: 'user', text: 'Yesterday I goed to the park.', ts: NOW - 60000 },
    { id: 'l1', role: 'lingua', ts: NOW - 50000, text: 'Nice! Who did you go with?',
      feedback: { correction: 'Yesterday I went to the park.', why: t('youHelpMeaning'), learningAction: { type: 'fill_blank', prompt: 'Last weekend we ____ (buy) some bread.', options: ['bought', 'buyed'], expected: 'bought' }, focus: 'past' } },
    { id: 'u2', role: 'user', text: base === 'ar' ? 'ماذا تعني كلمة went؟' : 'Last weekend we bought some bread.', ts: NOW - 40000 },
  ]
  if (scene === 'notes') {
    return (
      <AppProvider value={{ ...common, messages: lesson, selectedMessage: lesson[1] }}>
        <main className="px-4 py-6"><p>{t('tutorNotes')}</p></main>
        <NotesSheet onClose={() => { window.__benchClosed = 'notes' }} />
      </AppProvider>
    )
  }
  if (scene === 'chat') {
    window.__benchSent = []
    return (
      <AppProvider value={{ ...common, messages: lesson, sendMessage: text => window.__benchSent.push(text), progressSaveFailing: params.get('saveFailing') === '1' }}>
        <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}><ConversationRoom /></div>
      </AppProvider>
    )
  }
  if (scene === 'auth') {
    const failing = async () => { throw Object.assign(new Error('Invalid login credentials'), { code: 'invalid_credentials', status: 400 }) }
    return (
      <>
        <AppProvider value={{ ...common, authStep: 'entry', authProviderError: 'auth_unavailable' }}><AuthFlow /></AppProvider>
        <AppProvider value={{ ...common, authStep: 'login', login: failing }}><AuthFlow /></AppProvider>
      </>
    )
  }
  if (scene === 'archive' || scene === 'archive-empty' || scene === 'chats') {
    // real days, folded by the real ledger from synthetic turns
    let progress = createEmptyProgress()
    if (scene !== 'archive-empty') {
      progress = recordPractice(progress, { userMessage: 'I want to travel to Rome by train', response: { mode: 'chat', reply: 'ok' }, at: NOW - 2 * DAY })
      progress = recordPractice(progress, { userMessage: 'Yesterday I goed to school', response: { mode: 'chat', reply: 'ok', correction: 'Yesterday I went to school.' }, at: NOW - 2 * DAY + 60000 })
      progress = recordPractice(progress, { userMessage: 'I like my new job', response: { mode: 'chat', reply: 'ok' }, at: NOW })
    }
    return (
      <AppProvider value={{ ...common, localProgress: progress, messages: [] }}>
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
          {scene === 'chats' ? <ChatsView /> : <ConversationArchive />}
        </div>
      </AppProvider>
    )
  }
  if (scene === 'mission') {
    const mission = PRACTICE_MISSIONS[0]
    const step = mission.steps[0]
    const details = { mission, step, currentStepNumber: 1, totalSteps: mission.steps.length, progressPercent: 0 }
    const wrong = evaluateMissionStep(step, 'I travel want', t)
    const msgs = [
      createMissionIntroMessage(mission, false, t),
      createMissionStepMessage(details, t),
      { id: 'u-m', role: 'user', text: 'I travel want', ts: NOW },
      createMissionFeedbackMessage(mission, step, wrong, 5, t),
    ]
    return (
      <AppProvider value={{ ...common, messages: msgs }}>
        <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}><ConversationRoom /></div>
      </AppProvider>
    )
  }
  // P5: the screens that now ask for the learner's working level (learnerLevel.js)
  if (scene === 'today' || scene === 'identity') {
    const model = createLearnerModel()
    const arc = episodesOfLevel(workingLevelId(model))
    const value = { ...common, dailySession: null, previewSession: mode => getOrCreateSession(model, arc, { durationMode: mode || 'standard' }),
      completedMissions: [], tutorPreferences: {}, textSize: 'standard', profile: { ...common.profile, level: 'A2', placementResult: { level: 'A2' } } }
    return (
      <AppProvider value={value}>
        <main className='px-4 py-6' style={{ maxWidth: 1100, margin: '0 auto' }}>
          {scene === 'today' ? <TodayView onOpenPath={() => {}} /> : <LanguageIdentity />}
        </main>
      </AppProvider>
    )
  }
  // The Spanish course (learning/courses): its Home, and one episode played for real
  if (scene === 'course-today' || scene === 'course-episode') {
    // ?extra=<test pass>: six lessons done, today's session completed, the pass stored (Premium QA)
    if (scene === 'course-today' && params.get('extra') && !localStorage.getItem('lc2-premium-pass')) {
      const seeded = loadLearnerModel()
      for (const ep of ES_SKELETON.slice(0, 6)) setEpisodeState(seeded, ep.id, { status: 'completed', awarded: true })
      for (const id of ['es:me_llamo', 'es:como_te_llamas', 'es:estoy_bien', 'es:soy_de', 'es:no_entiendo']) recordItemAttempt(seeded, id, { correct: true, independent: true, atMs: Date.now() - 3 * 86400000 })
      markRecurringError(seeded, 'es:es_ser_estar_feeling'); markRecurringError(seeded, 'es:es_ser_estar_feeling')
      saveLearnerModel(seeded)
      const today = buildCourseSessionPlan(seeded, 'es', { durationMode: 'standard', learnerKey: 'Ana' })
      saveCourseSession({ ...today, status: 'completed', currentBlockIndex: today.blocks.length - 1 })
      if (params.get('extra') !== 'none') localStorage.setItem('lc2-premium-pass', params.get('extra'))
    }
    const value = { ...common, activeCourse: 'es', localProgress: { learnedItems: [], topics: [], topicsPracticed: [], streak: 2 },
      awardEpisode: () => true, finishEpisode: () => { document.title = 'bench: episode finished'; return true }, tutorPreferences: {} }
    return (
      <AppProvider value={value}>
        <main style={{ maxWidth: 1100, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {scene === 'course-today' ? <CourseToday /> : <EpisodeShell episodeId={params.get('ep') || 'es:hola'} />}
        </main>
      </AppProvider>
    )
  }
  // Phase 2: the Spanish daily session, the practice chat, plans, and the age question
  if (scene === 'course-session' || scene === 'course-chat') {
    const value = { ...common, activeCourse: 'es', sessionId: 'bench-session', tutorPreferences: {}, awardEpisode: () => true, finishEpisode: () => true }
    let body
    if (scene === 'course-chat') body = <CourseChat onExit={() => { document.title = 'bench: chat exit' }} />
    else {
      const m = createLearnerModel()
      const DAY = 86400000
      for (const ep of ES_SKELETON) setEpisodeState(m, ep.id, { status: 'completed', awarded: true })
      for (const ep of ES_SKELETON) for (const id of ep.gardenItems) recordItemAttempt(m, id, { correct: true, independent: true, atMs: Date.now() - 30 * DAY })
      markRecurringError(m, 'es:es_ser_estar_feeling'); markRecurringError(m, 'es:es_ser_estar_feeling')
      const plan = buildCourseSessionPlan(m, 'es', { durationMode: params.get('mode') || 'deep' })
      body = <CourseSessionRunner session={plan} onExit={() => { document.title = 'bench: session exit' }} />
    }
    return <AppProvider value={value}><main style={{ maxWidth: 1100, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>{body}</main></AppProvider>
  }
  if (scene === 'plans') return <AppProvider value={common}><Pricing /></AppProvider>
  if (scene === 'age' || scene === 'account-age') {
    const value = scene === 'age'
      ? { ...common, authStep: 'age', setAuthStep: step => { document.title = `bench: step ${step}` } }
      : { ...common, authStep: null, ageConfirmationNeeded: true, confirmAdultAge: () => { document.title = 'bench: adult confirmed'; return true }, logout: () => { document.title = 'bench: signed out' } }
    return <AppProvider value={value}><AuthFlow /></AppProvider>
  }
  return <p>Unknown scene</p>
}

async function start() {
  await loadLocale(lang).catch(() => {})
  const root = document.documentElement
  root.lang = lang
  root.dir = lang.startsWith('ar') ? 'rtl' : 'ltr'
  root.classList.toggle('dark', dark)
  document.body.style.background = 'var(--bg)'
  document.body.dataset.bench = BENCH_MARKER
  const t = (key, values) => translate(lang, key, values)
  createRoot(document.getElementById('bench-root')).render(<Scene t={t} />)
}
start()
