/*
 * LinguaChat visual bench — development only, synthetic data (see
 * vite.bench.config.mjs). URL: /bench/?scene=tu|call|notes|chat|auth
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
    nativeLanguageInfo: languageInfo, interfaceLanguageInfo: languageInfo, targetLanguage: 'en',
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
      <AppProvider value={{ ...common, messages: lesson, sendMessage: text => window.__benchSent.push(text) }}>
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
