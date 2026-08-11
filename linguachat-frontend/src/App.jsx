import { useEffect, useState, useCallback } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { useIsDesktop } from './services/viewport'
import { TodayView } from './components/today/TodayView'
import { ChatsView } from './components/chats/ChatsView'
import { ContextPanel, contextPanelFor } from './components/layout/ContextPanel'
import { ThemeToggle } from './components/ui/ThemeToggle'
import { lazyScreen } from './components/ui/LazyBoundary'
import { WelcomeMascotCard } from './components/onboarding/WelcomeMascotCard'
import { ChattoTutorial } from './components/onboarding/ChattoTutorial'
import { ChattoMascot } from './components/mascot/ChattoMascot'
import { StreakFlame } from './components/ui/StreakFlame'

/*
 * Code splitting.
 *
 * Home and Chats are what a session opens on, so they stay in the entry chunk with
 * the shell. Everything else is fetched when the learner actually goes there: the
 * sign-in and setup flows, the secondary screens, the call surfaces, and the whole
 * practice surface — which pulls in the episode engine, the session runner and the
 * evaluators.
 */
const AuthFlowScreen = lazyScreen(() => import('./components/auth/AuthFlow'), m => m.AuthFlow)
const SetupFlowScreen = lazyScreen(() => import('./components/setup/SetupFlow'), m => m.SetupFlow)
const ConversationRoomScreen = lazyScreen(() => import('./components/layout/ConversationRoom'), m => m.ConversationRoom)
const LanguageIdentityScreen = lazyScreen(() => import('./components/identity/LanguageIdentity'), m => m.LanguageIdentity)
const MemoryGardenScreen = lazyScreen(() => import('./components/memory/MemoryGarden'), m => m.MemoryGarden)
const ConversationArchiveScreen = lazyScreen(() => import('./components/archive/ConversationArchive'), m => m.ConversationArchive)
const PricingScreen = lazyScreen(() => import('./components/pricing/Pricing'), m => m.Pricing)
const CallScreen = lazyScreen(() => import('./components/call/CallSurface'), m => m.CallSurface)

function useScreenLabels() {
  const { t } = useApp()
  return {
    loadingLabel: t('screenLoading'),
    errorLabel: t('screenLoadFailed'),
    retryLabel: t('screenLoadRetry'),
  }
}

/*
 * THE FOUR DESTINATIONS, and only these four.
 *
 * Hoy · Chats · Palabras · Tú, exactly as the design's frames show them, rendered
 * from one list by both layouts.
 *
 * `practice` is deliberately NOT here. The practice surface is where a conversation
 * or an episode actually happens, and it is reached from the places that lead to
 * it — today's session, the Lingua thread in Chats, an episode row, a quick action.
 * An internal route is not the same thing as a primary destination, and the previous
 * shell confused the two, which cost the product its inbox.
 */
const DESTINATIONS = [
  {
    id: 'today', labelKey: 'today',
    icon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5 12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20z"/></svg>,
  },
  {
    id: 'chats', labelKey: 'chatsTitle',
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

/*
 * Which primary destination a route belongs to, so a screen reached from inside a
 * destination still highlights it. Practice belongs to Chats — it is what opening a
 * thread does — and pricing belongs to You, which is where the plan lives.
 */
const DESTINATION_OF = {
  today: 'today',
  chats: 'chats',
  practice: 'chats',
  call: 'chats',
  video: 'chats',
  archive: 'chats',
  'memory-garden': 'memory-garden',
  identity: 'identity',
  pricing: 'identity',
}

/* ─── Mobile bottom navigation ─── */
function MobileNav() {
  const { view, navigateTo, t } = useApp()
  const active = DESTINATION_OF[view] || view

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
        const isActive = active === item.id
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

const AUTH_STEPS = ['entry', 'login', 'signup', 'forgot']
const SETUP_STEPS = ['placement', 'level-reveal', 'setup-choice', 'tutor-personality', 'learning-prefs', 'personalize']
const FOCUS_MODE_KEY = 'lc2-focus-mode'

/*
 * FOCUS MODE. One switch, one job: leave the conversation and nothing else.
 *
 * On a laptop that means no navigation column, no chat list and no context panel;
 * on a phone it means no bottom bar. It changes nothing else — not the route, not
 * the learner model, not episode state, not availability — it is remembered so a
 * long session survives a reload, and the way out is always drawn.
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
 * The desktop navigation column: the product, the four destinations, and a small
 * block for who you are, your streak and your plan.
 *
 * What is NOT here, on purpose: "TU PROGRESO", "CAMINO", "EXPLORAR", and a list of
 * secondary screens. That rail was the old interface's main navigation, and leaving
 * it beside the new one meant the app wore two navigations at once. The path now
 * lives where the frames put it — in You and beside your words — and the plan is
 * one click from the user block below.
 */
function DesktopSidebar() {
  const { view, navigateTo, profile, localProgress, t } = useApp()
  const active = DESTINATION_OF[view] || view
  const streak = localProgress?.streak ?? 0
  const name = (profile?.name || '').trim()

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface-sunk)' }}>
      <div className="flex items-center gap-2 px-4 pt-5 pb-4">
        <ChattoMascot mood="happy" size={26} decorative={true} animated={false} />
        <span className="font-display" style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>LinguaChat</span>
      </div>

      <nav aria-label={t('mainNavigation')} className="flex flex-col gap-1 px-3">
        {DESTINATIONS.map(item => {
          const isActive = active === item.id
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
      </nav>

      <div style={{ flex: 1 }} />

      {/*
        * The user block at the foot of the column, as the frame places it: the
        * streak, the name, and the plan — which is also the way to the plans page,
        * so Plans no longer depends on an "Explore" list that should not exist.
        */}
      <div className="px-3 pb-4">
        {streak > 0 && (
          <div className="flex items-center gap-2 px-2 pb-3">
            <StreakFlame days={streak} scale={0.62} />
            <div>
              <p className="font-display" style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)', lineHeight: 1 }}>{streak}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{t('dayStreak')}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => navigateTo('pricing')}
          className="flex items-center gap-2.5 w-full rounded-2xl px-2.5 py-2 text-start"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <span className="grid place-items-center rounded-full flex-shrink-0" aria-hidden="true"
            style={{ width: 32, height: 32, background: 'var(--accent)', color: '#FFF8F4', fontWeight: 700 }}>
            {(name || 'L').slice(0, 1).toUpperCase()}
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 700, fontSize: '0.8125rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name || t('you')}
            </span>
            <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)' }}>{t('planFree')}</span>
          </span>
        </button>
      </div>
    </div>
  )
}

/* ─── Main app shell ─── */
function AppShell() {
  const { authStep, view, navigateTo, showWelcome, showTutorial, t } = useApp()
  const { focusMode, setFocusMode, toggleFocusMode } = useFocusMode()
  // Exactly one shell is mounted. Rendering both and hiding one with CSS keeps a
  // second, stale copy of every stateful view alive (see services/viewport.js).
  const isDesktop = useIsDesktop()
  const screenLabels = useScreenLabels()

  useEffect(() => {
    if (focusMode && view !== 'practice') setFocusMode(false)
  }, [focusMode, view, setFocusMode])

  if (authStep && AUTH_STEPS.includes(authStep)) return <AuthFlowScreen {...screenLabels} />
  if (authStep && SETUP_STEPS.includes(authStep)) return <SetupFlowScreen {...screenLabels} />

  /*
   * Inside a conversation, the left column is the CHAT LIST, not the navigation —
   * the design's 3b. Two columns of navigation at once (nav + list) is the stack
   * this sprint exists to remove, so the list replaces it and the way back to Home
   * is drawn at the top of the list.
   */
  const inConversation = view === 'practice'
  const isCall = view === 'call' || view === 'video'
  const panelKind = focusMode ? null : contextPanelFor(view)

  const screens = (
    <>
      {view === 'today'          && <TodayView />}
      {view === 'chats'          && <ChatsView />}
      {view === 'practice'       && <ConversationRoomScreen {...screenLabels} focusMode={focusMode} onToggleFocusMode={toggleFocusMode} />}
      {view === 'call'           && <CallScreen {...screenLabels} mode="voice" onClose={() => navigateTo('practice')} />}
      {view === 'video'          && <CallScreen {...screenLabels} mode="video" onClose={() => navigateTo('practice')} />}
      {view === 'memory-garden'  && <MemoryGardenScreen {...screenLabels} />}
      {view === 'archive'        && <ConversationArchiveScreen {...screenLabels} />}
      {view === 'identity'       && <LanguageIdentityScreen {...screenLabels} />}
      {view === 'pricing'        && <PricingScreen {...screenLabels} />}
    </>
  )

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {showWelcome && view === 'today' && <WelcomeMascotCard />}
      {showTutorial && !showWelcome && view === 'today' && <ChattoTutorial />}

      {/* Desktop — mounted only above the lg breakpoint. Mounting is the ONLY
          authority: `hidden lg:*` as a second source of truth could blank the
          screen if the two disagreed. */}
      {isDesktop && (
      <div className="flex" style={{ height: '100dvh', overflow: 'hidden' }}>

        {/* LEFT: navigation, or the chat list while a conversation is open */}
        {!focusMode && !isCall && (
          <aside style={{
            width: inConversation ? 316 : 248, flexShrink: 0,
            borderInlineEnd: '1px solid var(--border)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            {inConversation ? (
              <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
                <div className="px-3 pt-4 pb-1">
                  <button type="button" onClick={() => navigateTo('today')} className="tool-chip">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    {t('backToToday')}
                  </button>
                </div>
                <ChatsView compact activeId="lingua" onOpenThread={() => navigateTo('practice')} />
              </div>
            ) : (
              <DesktopSidebar />
            )}
          </aside>
        )}

        {/* CENTRE: the work */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
          {!isCall && (
            <div className="flex items-center justify-between px-5 py-2.5"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
              <p className="font-display" style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>
                {t(DESTINATIONS.find(d => d.id === (DESTINATION_OF[view] || view))?.labelKey || 'today')}
              </p>
              <div className="flex items-center gap-2">
                {focusMode && <FocusExitButton onExit={() => setFocusMode(false)} />}
                <ThemeToggle compact />
              </div>
            </div>
          )}
          <div style={{
            flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            width: '100%', maxWidth: inConversation || isCall ? 980 : 860, margin: '0 auto',
          }}>
            {screens}
          </div>
        </main>

        {/* RIGHT: whatever this route's context actually is — or nothing */}
        {panelKind && (
          <aside style={{
            width: 320, flexShrink: 0,
            borderInlineStart: '1px solid var(--border)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            <ContextPanel kind={panelKind} onOpenConversation={() => navigateTo('practice')} />
          </aside>
        )}
      </div>
      )}

      {/* Mobile — mounted only below the lg breakpoint */}
      {!isDesktop && (
      <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
        {/* The top bar belongs to Home and the list screens; a conversation and a
            call bring their own headers, so this one steps aside for them. */}
        {!inConversation && !isCall && (
          <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div className="flex items-center gap-2">
              <ChattoMascot mood="happy" size={26} decorative={true} animated={false} />
              <span className="font-display" style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>LinguaChat</span>
            </div>
            <ThemeToggle compact />
          </div>
        )}

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          paddingBottom: focusMode || isCall ? 0 : 74,
        }}>
          {focusMode && (
            <div className="flex items-center justify-end px-4 py-2 flex-shrink-0">
              <FocusExitButton onExit={() => setFocusMode(false)} />
            </div>
          )}
          {screens}
        </div>

        {!focusMode && !isCall && <MobileNav />}
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
