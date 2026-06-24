import { AppProvider, useApp } from './context/AppContext'
import { AuthFlow } from './components/auth/AuthFlow'
import { SetupFlow } from './components/setup/SetupFlow'
import { JourneyRail } from './components/layout/JourneyRail'
import { ConversationRoom } from './components/layout/ConversationRoom'
import { TutorNotes } from './components/layout/TutorNotes'
import { TodayView } from './components/today/TodayView'
import { ThemeToggle } from './components/ui/ThemeToggle'
import { LanguageIdentity } from './components/identity/LanguageIdentity'
import { MemoryGarden } from './components/memory/MemoryGarden'
import { ConversationArchive } from './components/archive/ConversationArchive'

/* ─── Mobile bottom navigation ─── */
function MobileNav() {
  const { view, navigateTo, setMobileSheet, t } = useApp()

  const items = [
    {
      id: 'today', label: t('today'), sheet: false,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    },
    {
      id: 'practice', label: t('practice'), sheet: false,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    },
    {
      id: 'journey', label: t('journey'), sheet: true,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
    },
    {
      id: 'notes', label: t('notes'), sheet: true,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-2"
      style={{
        background: 'var(--bg-paper)',
        borderTop: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
      {items.map(item => {
        const isActive = !item.sheet && view === item.id
        return (
          <button
            key={item.id}
            onClick={() => item.sheet ? setMobileSheet(item.id) : navigateTo(item.id)}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
            style={{
              color: isActive ? 'var(--violet)' : 'var(--ink-muted)',
              background: 'none', border: 'none', cursor: 'pointer',
              minWidth: 56,
            }}
          >
            <span style={{ opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

/* ─── Mobile sheet overlay ─── */
function MobileSheet({ id, onClose, children }) {
  return (
    <div className="lg:hidden fixed inset-0 z-50" style={{ display: 'flex' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />
      <div
        className="relative animate-slide-in-left"
        style={{
          width: 'min(320px, 88vw)', height: '100%',
          background: 'var(--bg-paper)',
          borderRight: '1px solid var(--border)',
          overflowY: 'auto',
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  )
}

function MobileNotesSheet({ onClose }) {
  return (
    <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />
      <div
        className="relative animate-sheet-up"
        style={{
          height: '70vh',
          background: 'var(--bg-paper)',
          borderRadius: '20px 20px 0 0',
          borderTop: '1px solid var(--border)',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontWeight: 700, color: 'var(--ink)' }}><MobileNotesTitle /></p>
          <button onClick={onClose} style={{ color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style={{ overflowY: 'auto', height: 'calc(100% - 60px)' }}>
          <TutorNotes />
        </div>
      </div>
    </div>
  )
}

function MobileNotesTitle() {
  const { t } = useApp()
  return t('tutorNotes')
}

const AUTH_STEPS = ['entry', 'login', 'signup', 'forgot']
const SETUP_STEPS = ['placement', 'tutor-personality', 'learning-prefs']

/* ─── Main app shell ─── */
function AppShell() {
  const { authStep, view, mobileSheet, setMobileSheet, t } = useApp()

  if (authStep && AUTH_STEPS.includes(authStep)) return <AuthFlow />
  if (authStep && SETUP_STEPS.includes(authStep)) return <SetupFlow />

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* Desktop 3-column cockpit layout */}
      <div className="hidden lg:flex" style={{ height: '100dvh', overflow: 'hidden' }}>

        {/* LEFT: Journey Rail */}
        <aside style={{ width: 288, flexShrink: 0, borderRight: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <JourneyRail />
        </aside>

        {/* CENTER: Main content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Top bar (only when not in practice) */}
          {view !== 'practice' && (
            <div className="flex items-center justify-between px-6 py-3"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-paper)', flexShrink: 0 }}>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>
                {view === 'today'
                  ? t('today')
                  : view === 'memory-garden'
                    ? t('memoryGarden')
                    : view === 'archive'
                      ? t('conversationArchive')
                      : view === 'identity'
                        ? t('languageIdentity')
                        : t('practiceRoom')}
              </p>
              <ThemeToggle />
            </div>
          )}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {view === 'today'          && <TodayView />}
            {view === 'practice'       && <ConversationRoom />}
            {view === 'memory-garden'  && <MemoryGarden />}
            {view === 'archive'        && <ConversationArchive />}
            {view === 'identity'       && <LanguageIdentity />}
          </div>
        </main>

        {/* RIGHT: Tutor Notes */}
        <aside style={{ width: 296, flexShrink: 0, borderLeft: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Notes header with theme toggle */}
          <div className="flex items-center justify-end px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <ThemeToggle compact />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <TutorNotes />
          </div>
        </aside>
      </div>

      {/* Mobile layout: single column */}
      <div className="lg:hidden flex flex-col" style={{ minHeight: '100dvh' }}>
        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-paper)' }}>
          <div className="flex items-center gap-2">
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--violet), var(--blue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  fill="rgba(255,255,255,0.3)" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--ink)' }}>LinguaChat</span>
          </div>
          <ThemeToggle compact />
        </div>

        {/* Mobile content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 72 }}>
          {view === 'today'         && <TodayView />}
          {view === 'practice'      && <ConversationRoom />}
          {view === 'memory-garden' && <MemoryGarden />}
          {view === 'archive'       && <ConversationArchive />}
          {view === 'identity'      && <LanguageIdentity />}
        </div>

        {/* Mobile bottom nav */}
        <MobileNav />

        {/* Mobile sheets */}
        {mobileSheet === 'journey' && (
          <MobileSheet id="journey" onClose={() => setMobileSheet(null)}>
            <JourneyRail onClose={() => setMobileSheet(null)} />
          </MobileSheet>
        )}
        {mobileSheet === 'notes' && (
          <MobileNotesSheet onClose={() => setMobileSheet(null)} />
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
