import { useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ThemeToggle } from '../ui/ThemeToggle'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { TUTOR_OPTION_GROUPS, INTEREST_OPTIONS, COMPANIONS } from '../../services/tutorPreferences'

function ChipRow({ label, value, options, onChange, t }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', marginBottom: 8 }}>{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const selected = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className="rounded-xl px-3.5 py-2 text-sm font-bold transition-all active:scale-[0.98]"
              style={{
                background: selected ? 'var(--violet-soft)' : 'var(--bg-elevated)',
                border: `1.5px solid ${selected ? 'var(--violet)' : 'var(--border)'}`,
                color: selected ? 'var(--violet)' : 'var(--ink-muted)',
              }}
            >
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
    activeCompanion,
    setActiveCompanion,
    textSize,
    setTextSize,
    completePersonalization,
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

  function toggleInterest(interest) {
    const current = tutorPreferences.interests || []
    const next = current.includes(interest)
      ? current.filter(item => item !== interest)
      : [...current, interest]
    updateTutorPreferences({ interests: next.length ? next : ['travel'] })
    react()
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'linear-gradient(135deg, var(--violet), var(--blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                fill="rgba(255,255,255,0.3)" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--ink)' }}>LinguaChat</span>
        </div>
        <div className="flex items-center gap-3">
          <span style={{
            fontSize: 11, fontWeight: 700, color: 'var(--violet)',
            background: 'var(--violet-soft)', border: '1px solid var(--violet)',
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
                <ChattoMascot mood={mood} size={104} variant="violet" />
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--violet)', marginTop: 18, marginBottom: 8 }}>
                  {t('personalizeEyebrow')}
                </p>
                <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.4rem, 3.5vw, 1.75rem)', color: 'var(--ink)', lineHeight: 1.2, marginBottom: 12 }}>
                  {t('personalizeTitle')}
                </h1>
                <p style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: 14 }}>
                  {t('personalizeBody')}
                </p>
                <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                    {t('chattoCompanionHint')}
                  </p>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="w-full" style={{ flex: 1, minWidth: 0 }}>
              <div className="rounded-3xl p-5 md:p-6" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
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
                  <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', marginBottom: 8 }}>{t('interests')}</p>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map(interest => {
                      const selected = (tutorPreferences.interests || []).includes(interest)
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className="rounded-xl px-3.5 py-2 text-sm font-bold transition-all active:scale-[0.98]"
                          style={{
                            background: selected ? 'var(--blue-soft)' : 'var(--bg-elevated)',
                            border: `1.5px solid ${selected ? 'var(--blue)' : 'var(--border)'}`,
                            color: selected ? 'var(--blue)' : 'var(--ink-muted)',
                          }}
                        >
                          {t(`interest_${interest}`)}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Text size */}
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', marginBottom: 8 }}>{t('textSize')}</p>
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
                            background: selected ? 'var(--violet-soft)' : 'var(--bg-elevated)',
                            border: `1.5px solid ${selected ? 'var(--violet)' : 'var(--border)'}`,
                            color: selected ? 'var(--violet)' : 'var(--ink-muted)',
                          }}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Companion */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', marginBottom: 8 }}>{t('chooseCompanion')}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {COMPANIONS.map(companion => {
                      const selected = activeCompanion === companion.id
                      return (
                        <button
                          key={companion.id}
                          type="button"
                          onClick={() => { setActiveCompanion(companion.id); react() }}
                          className="rounded-2xl px-3 py-3 text-center transition-all active:scale-[0.98]"
                          style={{
                            background: selected ? 'var(--violet-soft)' : 'var(--bg-elevated)',
                            border: `1.5px solid ${selected ? 'var(--violet)' : 'var(--border)'}`,
                          }}
                        >
                          <span style={{ display: 'block', fontSize: '0.9375rem', fontWeight: 900, color: selected ? 'var(--violet)' : 'var(--ink)' }}>{companion.name}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 2 }}>{t(companion.roleKey)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={completePersonalization}
                className="w-full mt-5 py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-px active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, var(--violet), var(--blue))' }}
              >
                {t('saveAndStart')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
