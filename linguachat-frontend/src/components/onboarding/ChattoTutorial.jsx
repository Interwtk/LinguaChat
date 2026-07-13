import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ChattoMascot } from '../mascot/ChattoMascot'

/*
 * A short, one-time guided tour narrated by Chatto. It never blocks the app for
 * long: Skip closes it instantly, and it only ever appears once
 * (lc2-tutorial-seen). Chatto here is the mascot/guide — not a tutor.
 * Each step moves Chatto's mood and accent so it feels alive without pixel
 * anchoring that would break on mobile.
 */
const STEPS = [
  { mood: 'welcoming',  variant: 'violet', titleKey: 'tutorialHomeTitle',        bodyKey: 'tutorialHomeBody' },
  { mood: 'happy',      variant: 'violet', titleKey: 'tutorialPracticeTitle',    bodyKey: 'tutorialPracticeBody' },
  { mood: 'cheering',   variant: 'green',  titleKey: 'tutorialPathTitle',        bodyKey: 'tutorialPathBody' },
  { mood: 'supportive', variant: 'violet', titleKey: 'tutorialPersonalizeTitle', bodyKey: 'tutorialPersonalizeBody' },
  { mood: 'calm',       variant: 'violet', titleKey: 'tutorialNotesTitle',       bodyKey: 'tutorialNotesBody' },
]

export function ChattoTutorial() {
  const { t, dismissTutorial } = useApp()
  const [index, setIndex] = useState(0)
  const step = STEPS[index]
  const isLast = index === STEPS.length - 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(2px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={t('tutorialAria')}
      onClick={dismissTutorial}
    >
      <div
        className="animate-scale-in w-full"
        style={{ maxWidth: 400 }}
        onClick={event => event.stopPropagation()}
      >
        <div className="rounded-3xl p-6 text-center" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(15,23,42,0.22)' }}>
          <div className="flex justify-center">
            {/* key forces a soft re-entry animation as Chatto changes mood */}
            <ChattoMascot key={index} mood={step.mood} size="medium" variant={step.variant} />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.1875rem', color: 'var(--ink)', lineHeight: 1.25, marginTop: 16, marginBottom: 8 }}>
            {t(step.titleKey)}
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 18 }}>
            {t(step.bodyKey)}
          </p>

          {/* progress dots */}
          <div className="flex justify-center items-center gap-1.5 mb-5" aria-hidden="true">
            {STEPS.map((_, idx) => (
              <span key={idx} style={{
                width: idx === index ? 18 : 6, height: 6, borderRadius: 999,
                background: idx <= index ? 'var(--violet)' : 'var(--border)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={dismissTutorial}
              className="flex-shrink-0 px-4 py-3 rounded-2xl font-semibold text-sm transition-all hover:opacity-80 active:scale-[0.98]"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}
            >
              {t('skipTutorial')}
            </button>
            <button
              onClick={() => (isLast ? dismissTutorial() : setIndex(value => value + 1))}
              className="flex-1 py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-95 hover:-translate-y-px active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, var(--violet), var(--blue))' }}
            >
              {isLast ? t('tutorialFinish') : t('tutorialNext')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChattoTutorial
