import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { archiveDays, mostPracticedTopic, topicKey } from '../../services/conversationArchive.js'

/*
 * The learner's own practice days — and nothing else.
 *
 * It used to fall back to six invented conversations for a new learner, and
 * gave every day a mood, a "+N pts" badge and a confidence figure that were
 * never measured. Now an empty history says so, and a real day shows only
 * what the ledger recorded: its date, the topics detected in it, how many
 * messages the learner wrote, their last line and their last correction.
 * See services/conversationArchive.js.
 */
export function ConversationArchive() {
  const { navigateTo, localProgress, t, interfaceLanguageInfo } = useApp()
  const [expanded, setExpanded] = useState(null)
  const days = useMemo(() => archiveDays(localProgress), [localProgress])
  const top = useMemo(() => mostPracticedTopic(days), [days])
  const topicLabel = id => t(topicKey(id) || 'topicConversation')

  function formatDate(day) {
    // a learning day is a calendar date, not an instant: read it as local noon
    const d = new Date(`${day}T12:00:00`)
    try {
      return d.toLocaleDateString(interfaceLanguageInfo?.code || 'en', { weekday: 'short', month: 'short', day: 'numeric' })
    } catch { return day }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 6 }}>
            {t('archiveEyebrow')}
          </p>
          <div className="flex items-end justify-between gap-3">
            <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', color: 'var(--ink)', lineHeight: 1.1 }}>
              {t('conversationArchive')}
            </h1>
            {days.length > 0 && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', textAlign: 'end' }}>
                {t('archiveDaysCount', { count: days.length })}
              </p>
            )}
          </div>
        </div>

        {days.length === 0 ? (
          <div className="rounded-2xl p-6 text-center animate-fade-up" role="status"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--ink)', marginBottom: 6 }}>{t('archiveEmptyTitle')}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.55, marginBottom: 16 }}>{t('archiveEmptyBody')}</p>
            <button type="button" onClick={() => navigateTo('practice')} className="btn-primary">
              {t('archiveStart')}
            </button>
          </div>
        ) : (
          <ol className="flex flex-col gap-4">
            {days.map((day, i) => {
              const isOpen = expanded === day.day
              const panelId = `archive-day-${day.day}`
              return (
                <li key={day.day} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 0.05}s` }}>
                  <div className="rounded-2xl overflow-hidden"
                    style={{
                      background: 'var(--surface)',
                      border: `1px solid ${isOpen ? 'var(--accent)' : 'var(--border)'}`,
                      boxShadow: isOpen ? 'var(--shadow-sm)' : 'none',
                    }}>
                    <button type="button" aria-expanded={isOpen} aria-controls={panelId}
                      onClick={() => setExpanded(isOpen ? null : day.day)}
                      className="w-full flex items-start justify-between gap-3 p-4 text-start"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <span>
                        <span style={{ display: 'block', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)', marginBottom: 3 }}>
                          {formatDate(day.day)}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--muted)' }}>
                          {day.topics.map(topicLabel).join(' · ')} · {t('archiveYourMessages', { count: day.yourMessages })}
                        </span>
                      </span>
                      <span aria-hidden="true" style={{
                        width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--surface-soft)', border: '1px solid var(--border)', color: 'var(--muted)',
                        transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none',
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                      </span>
                    </button>

                    {isOpen && (
                      <div id={panelId} style={{ borderTop: '1px solid var(--border)', margin: '0 16px' }} className="py-4">
                        {day.lastLine && (
                          <div className="mb-3">
                            <p className="eyebrow" style={{ marginBottom: 4 }}>{t('archiveLastLine')}</p>
                            <p dir="auto" style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.55 }}>{day.lastLine}</p>
                          </div>
                        )}
                        {day.correction && (
                          <div className="mb-3">
                            <p className="eyebrow" style={{ marginBottom: 4 }}>{t('keyFix')}</p>
                            <p dir="auto" style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.55 }}>{day.correction.replace(' -> ', ' → ')}</p>
                          </div>
                        )}
                        <button type="button" onClick={() => navigateTo('practice')} className="btn-primary w-full">
                          {t('practiceAgain')}
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        {top && (
          <div className="rounded-2xl p-4 mt-8 animate-fade-up" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 8 }}>
              {t('mostPracticed')}
            </p>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>{topicLabel(top.id)}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: 2 }}>{t('archiveTopicDays', { count: top.days })}</p>
          </div>
        )}
      </div>
    </div>
  )
}
