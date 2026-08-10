import { useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ThemeToggle } from '../ui/ThemeToggle'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { TUTOR_OPTION_GROUPS, INTEREST_OPTIONS, MAX_INTERESTS, toggleInterestId } from '../../services/tutorPreferences'

function ChipRow({ label, value, options, onChange, t }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', marginBottom: 8 }}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const selected = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
              className="rounded-xl px-3.5 py-2 text-sm font-bold transition-all hover:-translate-y-px active:scale-[0.98] inline-flex items-center gap-1.5"
              style={{
                background: selected ? 'var(--accent-soft)' : 'var(--surface-soft)',
                border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                color: selected ? 'var(--accent)' : 'var(--muted)',
                boxShadow: selected ? '0 0 0 3px var(--accent-soft)' : 'none',
              }}
            >
              {selected && <span aria-hidden="true" style={{ fontSize: '0.85em' }}>✓</span>}
              {t(option.labelKey)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function TutorPersonalizationStep() {
  const {
    t,
    tutorPreferences,
    updateTutorPreferences,
    textSize,
    setTextSize,
    completePersonalization,
    applyRecommendedSetup,
  } = useApp()

  // Chatto briefly cheers whenever the user picks something.
  const [mood, setMood] = useState('supportive')
  const moodTimer = useRef(null)
  function react() {
    setMood('cheering')
    if (moodTimer.current) clearTimeout(moodTimer.current)
    moodTimer.current = setTimeout(() => setMood('supportive'), 1100)
  }

  function choose(key, id) {
    updateTutorPreferences({ [key]: id })
    react()
  }

  /*
   * Choosing nothing is an answer. It used to snap back to `travel`, which meant
   * a learner who wanted plain everyday conversation could not say so.
   */
  function toggleInterest(interest) {
    updateTutorPreferences({ interests: toggleInterestId(tutorPreferences.interests, interest) })
    react()
  }

  const selectedInterests = tutorPreferences.interests || []

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <ChattoMascot mood="happy" size={30} decorative={true} animated={false} />
          <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--ink)' }}>LinguaChat</span>
        </div>
        <div className="flex items-center gap-3">
          <span style={{
            fontSize: 11, fontWeight: 700, color: 'var(--accent)',
            background: 'var(--accent-soft)', border: '1px solid var(--accent)',
            padding: '3px 10px', borderRadius: 999,
          }}>
            {t('personalizeStepBadge')}
          </span>
          <ThemeToggle compact />
        </div>
      </div>

      {/* Body: 2 columns on desktop, stacked on mobile */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-7 lg:py-10" style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
          <div className="flex flex-col lg:flex-row gap-7 lg:gap-10 items-start">

            {/* Chatto + explanation */}
            <div
              className="w-full lg:sticky"
              style={{ flex: '0 0 auto', maxWidth: 360, top: 32 }}
            >
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                <ChattoMascot mood={mood} size={104} variant="accent" />
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)', marginTop: 18, marginBottom: 8 }}>
                  {t('personalizeEyebrow')}
                </p>
                <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.4rem, 3.5vw, 1.75rem)', color: 'var(--ink)', lineHeight: 1.2, marginBottom: 12 }}>
                  {t('personalizeTitle')}
                </h1>
                <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 14 }}>
                  {t('personalizeBody')}
                </p>
                <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                    {t('chattoCompanionHint')}
                  </p>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="w-full" style={{ flex: 1, minWidth: 0 }}>
              <div className="rounded-3xl p-5 md:p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {TUTOR_OPTION_GROUPS.map(group => (
                  <ChipRow
                    key={group.key}
                    label={t(group.labelKey)}
                    value={tutorPreferences[group.key]}
                    options={group.options}
                    onChange={id => choose(group.key, id)}
                    t={t}
                  />
                ))}

                {/* Interests (multi-select) */}
                <div style={{ marginBottom: 18 }}>
                  <div className="flex items-baseline justify-between gap-3" style={{ marginBottom: 4 }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)' }}>{t('interests')}</p>
                    {/* discreet, and only once something is chosen */}
                    {selectedInterests.length > 0 && (
                      <p aria-hidden="true" style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
                        {selectedInterests.length}/{MAX_INTERESTS}
                      </p>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.45, marginBottom: 10 }}>
                    {t('interestsHelp')}
                  </p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label={t('interests')}>
                    {INTEREST_OPTIONS.map(interest => {
                      const selected = selectedInterests.includes(interest)
                      return (
                        <button
                          key={interest}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleInterest(interest)}
                          className="rounded-xl px-3.5 py-2 text-sm font-bold transition-all hover:-translate-y-px active:scale-[0.98] inline-flex items-center gap-1.5"
                          style={{
                            background: selected ? 'var(--info-soft)' : 'var(--surface-soft)',
                            border: `1px solid ${selected ? 'var(--info)' : 'var(--border)'}`,
                            color: selected ? 'var(--info)' : 'var(--muted)',
                            boxShadow: selected ? '0 0 0 3px var(--info-soft)' : 'none',
                          }}
                        >
                          {selected && <span aria-hidden="true" style={{ fontSize: '0.85em' }}>✓</span>}
                          {t(`interest_${interest}`)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Text size */}
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', marginBottom: 8 }}>{t('textSize')}</p>
                  <div className="flex gap-2">
                    {[{ id: 'normal', label: t('normal') }, { id: 'large', label: t('large') }].map(option => {
                      const selected = textSize === option.id
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => { setTextSize(option.id); react() }}
                          className="rounded-xl px-4 py-2 text-sm font-bold transition-all active:scale-[0.98]"
                          style={{
                            background: selected ? 'var(--accent-soft)' : 'var(--surface-soft)',
                            border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                            color: selected ? 'var(--accent)' : 'var(--muted)',
                          }}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={completePersonalization}
                className="group w-full mt-5 py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-95 hover:-translate-y-px active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ background: 'var(--accent)' }}
              >
                <span>{t('saveAndStart')}</span>
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" style={{ fontSize: '1.05em' }}>→</span>
              </button>

              <button
                type="button"
                onClick={applyRecommendedSetup}
                className="w-full mt-2.5 py-2.5 rounded-2xl font-semibold text-sm transition-all hover:opacity-80 active:scale-[0.98]"
                style={{ background: 'transparent', border: 'none', color: 'var(--muted)' }}
              >
                {t('useRecommendedInstead')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
