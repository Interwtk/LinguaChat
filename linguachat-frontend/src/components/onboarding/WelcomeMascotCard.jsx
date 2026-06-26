import { useApp } from '../../context/AppContext'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { getMissionForToday } from '../../services/missions'

/*
 * A small, premium welcome from Chatto shown once on Home after onboarding.
 * Dismisses on any action and never returns (lc2-welcome-seen).
 */
export function WelcomeMascotCard() {
  const { t, profile, navigateTo, startPracticeMission, activeMissionDetails, dismissWelcome } = useApp()

  function openMission() {
    const mission = activeMissionDetails?.mission || getMissionForToday(profile.level, profile.goal)
    dismissWelcome()
    if (activeMissionDetails) navigateTo('practice')
    else startPracticeMission(mission)
  }

  function openPractice() {
    dismissWelcome()
    navigateTo('practice')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(2px)' }}
      onClick={dismissWelcome}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-fade-up w-full"
        style={{ maxWidth: 420 }}
        onClick={event => event.stopPropagation()}
      >
        <div className="rounded-3xl p-6 text-center" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(15,23,42,0.22)' }}>
          <div className="flex justify-center">
            <ChattoMascot mood="welcoming" size={92} variant="violet" />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--ink)', lineHeight: 1.25, marginTop: 16, marginBottom: 8 }}>
            {t('welcomeTitle')}
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 20 }}>
            {t('welcomeMessage')}
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={openMission}
              className="w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, var(--coral), var(--yellow))' }}
            >
              {t('welcomeStartMission')}
            </button>
            <button
              onClick={openPractice}
              className="w-full py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--violet-soft)', border: '1.5px solid var(--violet)', color: 'var(--violet)' }}
            >
              {t('welcomeOpenPractice')}
            </button>
            <button
              onClick={dismissWelcome}
              className="w-full py-2.5 rounded-2xl font-semibold text-sm transition-all hover:opacity-80 active:scale-[0.98]"
              style={{ background: 'transparent', border: 'none', color: 'var(--ink-muted)' }}
            >
              {t('welcomeLater')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
