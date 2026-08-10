import { useEffect, useState, useCallback } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { useIsDesktop } from './services/viewport'
import { JourneyRail } from './components/layout/JourneyRail'
import { TutorNotes } from './components/layout/TutorNotes'
import { TodayView } from './components/today/TodayView'
import { ThemeToggle } from './components/ui/ThemeToggle'
import { lazyScreen } from './components/ui/LazyBoundary'
import { WelcomeMascotCard } from './components/onboarding/WelcomeMascotCard'
import { ChattoTutorial } from './components/onboarding/ChattoTutorial'
import { ChattoMascot } from './components/mascot/ChattoMascot'
import { StreakFlame } from './components/ui/StreakFlame'

/*
 * Code splitting.
 *
 * Home is what almost every session opens on, so TodayView and the shell stay in
 * the entry chunk. Everything else is fetched when the learner actually goes
 * there: the sign-in and setup flows (a returning learner never sees them), the
 * secondary screens, and the whole practice surface — which pulls in the episode
 * engine, the daily-session runner and the evaluators.
 */
const AuthFlowScreen = lazyScreen(() => import('./components/auth/AuthFlow'), m => m.AuthFlow)
const SetupFlowScreen = lazyScreen(() => import('./components/setup/SetupFlow'), m => m.SetupFlow)
const ConversationRoomScreen = lazyScreen(() => import('./components/layout/ConversationRoom'), m => m.ConversationRoom)
const LanguageIdentityScreen = lazyScreen(() => import('./components/identity/LanguageIdentity'), m => m.LanguageIdentity)
const MemoryGardenScreen = lazyScreen(() => import('./components/memory/MemoryGarden'), m => m.MemoryGarden)
const ConversationArchiveScreen = lazyScreen(() => import('./components/archive/ConversationArchive'), m => m.ConversationArchive)
const PricingScreen = lazyScreen(() => import('./components/pricing/Pricing'), m => m.Pricing)

// Every lazy screen shows its loading and failure states in the interface
// language, so a chunk problem never surfaces as a blank page or English text.
function useScreenLabels() {
  const { t } = useApp()
  return {
    loadingLabel: t('screenLoading'),
    errorLabel: t('screenLoadFailed'),
    retryLabel: t('screenLoadRetry'),
  }
}

/*
 * ONE set of destinations for both layouts.
 *
 * The mobile bar and the desktop rail render the same four places, in the same
 * order, from this list — a phone and a laptop are the same product seen at two
 * widths, not two navigations that have to be kept in sync by hand. The panels
 * that used to be tabs of their own (the path, Lingua's notes) are reached from
 * the surface they belong to; they are still sheets on mobile.
 */
const DESTINATIONS = [
  {
    id: 'today', labelKey: 'today',
    icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5 12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20z"/></svg>,
  },
  {
    id: 'practice', labelKey: 'practice',
    icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 14.5a2 2 0 0 1-2 2H8l-4 3.5V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/></svg>,
  },
  {
    id: 'memory-garden', labelKey: 'yourWordsNav',
    icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>,
  },
  {
    id: 'identity', labelKey: 'youNav',
    icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>,
  },
]

/* ─── Mobile bottom navigation ─── */
function MobileNav() {
  const { view, navigateTo, t } = useApp()

  return (
    <nav
      aria-label={t('mainNavigation')}
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around px-1 pt-1.5"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))',
      }}
    >
      {DESTINATIONS.map(item => {
        const isActive = view === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => navigateTo(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl px-3"
            style={{
              color: isActive ? 'var(--accent)' : 'var(--muted)',
              background: 'none', border: 'none', cursor: 'pointer',
              minWidth: 62, minHeight: 52,
            }}
          >
            {item.icon}
            <span style={{ fontSize: 10.5, fontWeight: isActive ? 700 : 600, letterSpacing: '0.01em' }}>
              {t(item.labelKey)}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

/* ─── Mobile sheet overlay (the path) ─── */
function MobileSheet({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50" style={{ display: 'flex' }}>
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(28,35,51,0.38)' }}
        onClick={onClose}
      />
      <div
        className="relative animate-slide-in-left"
        style={{
          width: 'min(330px, 90vw)', height: '100%',
          background: 'var(--surface)',
          borderInlineEnd: '1px solid var(--border)',
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
  const { t } = useApp()
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(28,35,51,0.38)' }}
        onClick={onClose}
      />
      <div
        className="relative animate-sheet-up"
        style={{
          height: '72vh',
          background: 'var(--surface)',
          borderRadius: '22px 22px 0 0',
          borderTop: '1px solid var(--border)',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="font-display" style={{ fontWeight: 700, color: 'var(--ink)' }}>{t('tutorNotes')}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}
          >
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

const AUTH_STEPS = ['entry', 'login', 'signup', 'forgot']
const SETUP_STEPS = ['placement', 'level-reveal', 'setup-choice', 'tutor-personality', 'learning-prefs', 'personalize']
const NOTES_COLLAPSED_KEY = 'lc2-notes-panel-collapsed'
const FOCUS_MODE_KEY = 'lc2-focus-mode'

/*
 * FOCUS MODE.
 *
 * One switch, one job: decide which SURFACES are on screen. On a laptop it puts
 * the path and the notes away and leaves the conversation; on a phone it puts the
 * bottom bar away. It changes nothing else — not the route, not the learner
 * model, not the episode state, not what is available.
 *
 * It is remembered locally so a long session does not lose it on reload, and the
 * way out is always drawn: a mode you cannot leave is a trap, not a mode.
 */
function useFocusMode() {
  const [focusMode, setFocusMode] = useState(() => {
    try { return localStorage.getItem(FOCUS_MODE_KEY) === 'true' } catch { return false }
  })
  useEffect(() => {
    try { localStorage.setItem(FOCUS_MODE_KEY, String(focusMode)) } catch {}
  }, [focusMode])
  const toggle = useCallback(() => setFocusMode(value => !value), [])
  return { focusMode, setFocusMode, toggleFocusMode: toggle }
}

/* The way out of focus mode, drawn wherever focus mode is on. */
function FocusExitButton({ onExit }) {
  const { t } = useApp()
  return (
    <button
      type="button"
      onClick={onExit}
      className="tool-chip"
      style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)', borderColor: 'var(--accent-tint)' }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4"/>
      </svg>
      {t('exitFocusMode')}
    </button>
  )
}

/*
 * Desktop rail header: who is here, and how the streak is going. The flame is the
 * only moving thing in the chrome, and the number beside it is what a screen
 * reader reads, so the fire stays decorative.
 */
function DesktopIdentityStrip() {
  const { profile, localProgress, t } = useApp()
  const streak = localProgress?.streak ?? 0
  const name = (profile?.name || '').trim()

  return (
    <div className="flex items-center gap-3 px-1 pb-3 mb-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <span
        className="grid place-items-center rounded-full flex-shrink-0"
        style={{ width: 36, height: 36, background: 'var(--accent)', color: '#FFF8F4', fontWeight: 700 }}
        aria-hidden="true"
      >
        {(name || 'L').slice(0, 1).toUpperCase()}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name || t('you')}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
          {streak > 0 ? t('streakDaysShort', { count: streak }) : t('streakStartToday')}
        </p>
      </div>
      {streak > 0 && <StreakFlame days={streak} size={26} />}
    </div>
  )
}

/* ─── Desktop navigation rail (the four destinations + the path underneath) ─── */
function DesktopSidebar({ onOpenNotes, notesCollapsed }) {
  const { view, navigateTo, t } = useApp()

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface-sunk)' }}>
      <div className="px-3.5 pt-5">
        <div className="flex items-center gap-2 px-1 pb-4">
          <ChattoMascot mood="happy" size={26} decorative={true} animated={false} />
          <span className="font-display" style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>LinguaChat</span>
        </div>
        <DesktopIdentityStrip />
        <nav aria-label={t('mainNavigation')} className="flex flex-col gap-1">
          {DESTINATIONS.map(item => {
            const isActive = view === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className="flex items-center gap-2.5 rounded-2xl px-3 text-start"
                style={{
                  minHeight: 44,
                  background: isActive ? 'var(--surface)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--border)' : 'transparent'}`,
                  color: isActive ? 'var(--accent-strong)' : 'var(--muted)',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '0.875rem',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {item.icon}
                {t(item.labelKey)}
              </button>
            )
          })}
          {notesCollapsed && (
            <button
              type="button"
              onClick={onOpenNotes}
              className="flex items-center gap-2.5 rounded-2xl px-3 text-start"
              style={{ minHeight: 44, background: 'transparent', border: '1px solid transparent', color: 'var(--muted)', fontWeight: 600, fontSize: '0.875rem' }}
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>
              {t('showNotes')}
            </button>
          )}
        </nav>
      </div>

      {/* The path lives under the navigation: it is context, not a destination. */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', marginTop: 12 }}>
        <JourneyRail />
      </div>
    </div>
  )
}

/* ─── Main app shell ─── */
function AppShell() {
  const { authStep, view, mobileSheet, setMobileSheet, showWelcome, showTutorial, t } = useApp()
  const [notesCollapsed, setNotesCollapsed] = useState(() => {
    try { return localStorage.getItem(NOTES_COLLAPSED_KEY) === 'true' } catch { return false }
  })
  const { focusMode, setFocusMode, toggleFocusMode } = useFocusMode()
  // Exactly one shell is mounted. Rendering both and hiding one with CSS keeps a
  // second, stale copy of every stateful view alive (see services/viewport.js).
  const isDesktop = useIsDesktop()
  const screenLabels = useScreenLabels()

  /*
   * Focus mode is about practising. Landing anywhere else means it has no panels
   * left to hide, so it lets itself go rather than following the learner around.
   */
  useEffect(() => {
    if (focusMode && view !== 'practice') setFocusMode(false)
  }, [focusMode, view, setFocusMode])

  const showRail = !focusMode
  const showNotes = !focusMode && !notesCollapsed
  const mainMaxWidth = focusMode
    ? 980
    : view === 'practice'
      ? (notesCollapsed ? 1360 : 1180)
      : (notesCollapsed ? 1120 : 980)

  useEffect(() => {
    try { localStorage.setItem(NOTES_COLLAPSED_KEY, String(notesCollapsed)) } catch {}
  }, [notesCollapsed])

  if (authStep && AUTH_STEPS.includes(authStep)) return <AuthFlowScreen {...screenLabels} />
  if (authStep && SETUP_STEPS.includes(authStep)) return <SetupFlowScreen {...screenLabels} />

  const screens = (
    <>
      {view === 'today'          && <TodayView onOpenPath={() => setMobileSheet('journey')} onOpenNotes={() => setMobileSheet('notes')} />}
      {view === 'practice'       && <ConversationRoomScreen {...screenLabels} focusMode={focusMode} onToggleFocusMode={toggleFocusMode} onOpenNotes={() => setMobileSheet('notes')} />}
      {view === 'memory-garden'  && <MemoryGardenScreen {...screenLabels} />}
      {view === 'archive'        && <ConversationArchiveScreen {...screenLabels} />}
      {view === 'identity'       && <LanguageIdentityScreen {...screenLabels} onOpenPath={() => setMobileSheet('journey')} />}
      {view === 'pricing'        && <PricingScreen {...screenLabels} />}
    </>
  )

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* Chatto welcome — shown once on Home right after onboarding */}
      {showWelcome && view === 'today' && <WelcomeMascotCard />}

      {/* Chatto guided tour — once, after the welcome, only on Home */}
      {showTutorial && !showWelcome && view === 'today' && <ChattoTutorial />}

      {/* Desktop: rail · content · context panel — mounted only above the lg
          breakpoint. Mounting is the ONLY authority here: keeping `hidden lg:*`
          as a second source of truth would blank the screen if they disagreed. */}
      {isDesktop && (
      <div className="flex" style={{ height: '100dvh', overflow: 'hidden' }}>

        {/* LEFT: navigation and the path */}
        {showRail && (
          <aside style={{ width: 248, flexShrink: 0, borderInlineEnd: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <DesktopSidebar notesCollapsed={notesCollapsed} onOpenNotes={() => setNotesCollapsed(false)} />
          </aside>
        )}

        {/* CENTER: the work */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
          <div className="flex items-center justify-between px-5 py-2.5"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
            <p className="font-display" style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>
              {t(DESTINATIONS.find(d => d.id === view)?.labelKey || 'today')}
            </p>
            <div className="flex items-center gap-2">
              {focusMode && <FocusExitButton onExit={() => setFocusMode(false)} />}
              <ThemeToggle compact />
            </div>
          </div>
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              maxWidth: mainMaxWidth,
              margin: '0 auto',
            }}
          >
            {screens}
          </div>
        </main>

        {/* RIGHT: the contextual panel — Lingua's notes while you work */}
        {showNotes && (
          <aside style={{ width: 320, flexShrink: 0, borderInlineStart: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="eyebrow">{t('tutorNotes')}</p>
              <button
                type="button"
                onClick={() => setNotesCollapsed(true)}
                className="rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ background: 'var(--surface-sunk)', border: '1px solid var(--border)', color: 'var(--muted)' }}
              >
                {t('hideNotes')}
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <TutorNotes />
            </div>
          </aside>
        )}
      </div>
      )}

      {/* Mobile: single column — mounted only below the lg breakpoint */}
      {!isDesktop && (
      <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
        {/* Mobile top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="flex items-center gap-2">
            <ChattoMascot mood="happy" size={26} decorative={true} animated={false} />
            <span className="font-display" style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>LinguaChat</span>
          </div>
          <div className="flex items-center gap-2">
            {focusMode && <FocusExitButton onExit={() => setFocusMode(false)} />}
            <ThemeToggle compact />
          </div>
        </div>

        {/* Mobile content — the bar is out of the way in focus mode, so the
            padding that reserves room for it goes with it. */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: focusMode ? 0 : 74 }}>
          {screens}
        </div>

        {/* Mobile bottom nav */}
        {!focusMode && <MobileNav />}

        {/* Mobile sheets */}
        {mobileSheet === 'journey' && (
          <MobileSheet onClose={() => setMobileSheet(null)}>
            <JourneyRail onClose={() => setMobileSheet(null)} />
          </MobileSheet>
        )}
        {mobileSheet === 'notes' && (
          <MobileNotesSheet onClose={() => setMobileSheet(null)} />
        )}
      </div>
      )}
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
