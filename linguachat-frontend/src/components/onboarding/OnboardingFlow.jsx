import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { ChattoMascot } from '../mascot/ChattoMascot'

/* ─── Step data ─── */
const GOALS = [
  { id: 'travel',     emoji: '✈️', label: 'Travel',      desc: 'Explore the world with confidence' },
  { id: 'work',       emoji: '💼', label: 'Work',         desc: 'Speak better in professional settings' },
  { id: 'confidence', emoji: '💬', label: 'Confidence',   desc: 'Express myself without fear' },
  { id: 'interviews', emoji: '🎯', label: 'Interviews',   desc: 'Land my dream job in English' },
  { id: 'daily',      emoji: '🌿', label: 'Daily life',   desc: 'Handle everyday conversations' },
]

const STYLES = [
  { id: 'Friendly',  emoji: '🤝', label: 'Gentle corrections', desc: 'Warm, patient, encouraging' },
  { id: 'Strict',    emoji: '📐', label: 'Strict teacher',      desc: 'Precise, formal, rigorous' },
  { id: 'Casual',    emoji: '😊', label: 'Casual friend',       desc: 'Relaxed, fun, informal' },
  { id: 'Coach',     emoji: '🏆', label: 'Interview coach',     desc: 'Professional, goal-focused' },
]

const LEVELS = [
  { id: 'A1', label: 'A1', sub: 'Beginner',     desc: 'I know a few words' },
  { id: 'A2', label: 'A2', sub: 'Elementary',   desc: 'I can handle simple phrases' },
  { id: 'B1', label: 'B1', sub: 'Intermediate', desc: 'I get by in most situations' },
  { id: 'B2', label: 'B2', sub: 'Upper-int.',   desc: 'I hold conversations easily' },
  { id: 'C1', label: 'C1', sub: 'Advanced',     desc: 'I speak fluently and precisely' },
  { id: 'C2', label: 'C2', sub: 'Mastery',      desc: 'Near-native speaker' },
]

const DAILY_GOALS = [
  { id: 5,  label: '5 min',  sub: 'Quick spark',   emoji: '⚡', desc: 'A thought during your coffee break' },
  { id: 10, label: '10 min', sub: 'Daily habit',   emoji: '🌱', desc: 'The sweet spot for real growth' },
  { id: 15, label: '15 min', sub: 'Strong focus',  emoji: '🔥', desc: 'For the committed learner' },
  { id: 30, label: '30 min', sub: 'Deep practice', emoji: '🚀', desc: 'Rapid progress every day' },
]

/* ─── Reusable option card ─── */
function OptionCard({ selected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`option-card text-left w-full rounded-2xl p-4 transition-all ${selected ? 'selected' : ''}`}
      style={{
        background: selected ? 'var(--violet-soft)' : 'var(--bg-paper)',
        border: `1.5px solid ${selected ? 'var(--violet)' : 'var(--border)'}`,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

/* ─── Lingua speech bubble ─── */
function LinguaSays({ text }) {
  return (
    <div className="flex items-start gap-3 mb-8">
      <LinguaAvatar size={44} online />
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--violet)', marginBottom: 4 }}>Lingua</p>
        <div className="rounded-2xl rounded-tl-sm px-5 py-3.5"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', maxWidth: 380 }}>
          <p style={{ fontSize: '0.9375rem', color: 'var(--ink)', lineHeight: 1.55 }}>{text}</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Progress dots ─── */
function StepDots({ total, current }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 20 : 6,
          height: 6,
          borderRadius: 999,
          background: i === current ? 'var(--violet)' : i < current ? 'var(--blue)' : 'var(--border)',
          transition: 'all 0.35s cubic-bezier(0.32,0.72,0,1)',
        }} />
      ))}
    </div>
  )
}

/* ─── Main onboarding flow ─── */
export function OnboardingFlow() {
  const { completeOnboarding } = useApp()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [style, setStyle] = useState('')
  const [level, setLevel] = useState('')
  const [dailyGoal, setDailyGoal] = useState(10)

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => Math.max(0, s - 1))

  const finish = () => {
    completeOnboarding({ name: name || 'friend', goal, style, level: level || 'B1', dailyGoal })
  }

  const TOTAL = 4

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'var(--bg-main)' }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <ChattoMascot mood="happy" size={38} decorative={true} animated={false} />
        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--ink)' }}>LinguaChat</span>
      </div>

      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Step 0: Welcome + Name */}
        {step === 0 && (
          <div className="animate-fade-up">
            <LinguaSays text="Hi! I'm Lingua, your English companion. I'll help you practice naturally, without pressure. What should I call you?" />
            <div className="mb-6">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && next()}
                placeholder="Your name..."
                autoFocus
                className="w-full px-5 py-4 rounded-2xl text-base font-medium transition-all"
                style={{
                  background: 'var(--bg-paper)', border: '1.5px solid var(--border)',
                  color: 'var(--ink)', outline: 'none', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--violet)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <button
              onClick={next}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, var(--violet) 0%, var(--blue) 100%)' }}
            >
              {name ? `Nice to meet you, ${name}!` : 'Continue'}
            </button>
          </div>
        )}

        {/* Step 1: Goal */}
        {step === 1 && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-6">
              <StepDots total={TOTAL} current={0} />
              <button onClick={back} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Back</button>
            </div>
            <LinguaSays text={`${name || 'Friend'}, what brings you to LinguaChat?`} />
            <div className="grid grid-cols-1 gap-2.5 mb-6">
              {GOALS.map(g => (
                <OptionCard key={g.id} selected={goal === g.id} onClick={() => setGoal(g.id)}>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 22 }}>{g.emoji}</span>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>{g.label}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>{g.desc}</p>
                    </div>
                  </div>
                </OptionCard>
              ))}
            </div>
            <button
              onClick={next}
              disabled={!goal}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, var(--violet) 0%, var(--blue) 100%)', cursor: goal ? 'pointer' : 'not-allowed' }}
            >
              That's my goal
            </button>
          </div>
        )}

        {/* Step 2: Style */}
        {step === 2 && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-6">
              <StepDots total={TOTAL} current={1} />
              <button onClick={back} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Back</button>
            </div>
            <LinguaSays text="How would you like me to give you feedback?" />
            <div className="grid grid-cols-1 gap-2.5 mb-6">
              {STYLES.map(s => (
                <OptionCard key={s.id} selected={style === s.id} onClick={() => setStyle(s.id)}>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 22 }}>{s.emoji}</span>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>{s.label}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>{s.desc}</p>
                    </div>
                  </div>
                </OptionCard>
              ))}
            </div>
            <button
              onClick={next}
              disabled={!style}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, var(--violet) 0%, var(--blue) 100%)', cursor: style ? 'pointer' : 'not-allowed' }}
            >
              This is my style
            </button>
          </div>
        )}

        {/* Step 3: Level */}
        {step === 3 && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-6">
              <StepDots total={TOTAL} current={2} />
              <button onClick={back} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Back</button>
            </div>
            <LinguaSays text="Where are you starting from? No wrong answer!" />

            {/* Level ladder */}
            <div className="flex flex-col gap-2 mb-6">
              {LEVELS.map((l, i) => (
                <button
                  key={l.id}
                  onClick={() => setLevel(l.id)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all hover:-translate-y-px"
                  style={{
                    background: level === l.id ? 'var(--violet-soft)' : 'var(--bg-paper)',
                    border: `1.5px solid ${level === l.id ? 'var(--violet)' : 'var(--border)'}`,
                    marginLeft: `${i * 8}px`,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                    background: level === l.id ? 'var(--violet)' : 'var(--bg-elevated)',
                    border: `1.5px solid ${level === l.id ? 'var(--violet)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.875rem',
                    color: level === l.id ? '#fff' : 'var(--ink-muted)',
                  }}>
                    {l.label}
                  </span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--ink)' }}>{l.sub}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>{l.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={next}
              disabled={!level}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, var(--violet) 0%, var(--blue) 100%)', cursor: level ? 'pointer' : 'not-allowed' }}
            >
              That's my level
            </button>
          </div>
        )}

        {/* Step 4: Daily rhythm + enter */}
        {step === 4 && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-6">
              <StepDots total={TOTAL} current={3} />
              <button onClick={back} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Back</button>
            </div>
            <LinguaSays text="How much time can you practice each day? Even 5 minutes counts." />
            <div className="grid grid-cols-2 gap-3 mb-8">
              {DAILY_GOALS.map(d => (
                <OptionCard key={d.id} selected={dailyGoal === d.id} onClick={() => setDailyGoal(d.id)}>
                  <p style={{ fontSize: 24, marginBottom: 6 }}>{d.emoji}</p>
                  <p style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--ink)' }}>{d.label}</p>
                  <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>{d.sub}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 4 }}>{d.desc}</p>
                </OptionCard>
              ))}
            </div>

            {/* Summary */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)', marginBottom: 8 }}>
                Your practice room is ready
                {name ? `, ${name}` : ''}!
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: goal || 'Your goal' },
                  { label: style || 'Friendly' },
                  { label: level || 'B1' },
                  { label: `${dailyGoal} min / day` },
                ].map(t => (
                  <span key={t.label} style={{
                    fontSize: 11, fontWeight: 600, background: 'var(--violet-soft)',
                    color: 'var(--violet)', border: '1px solid var(--violet)',
                    padding: '2px 10px', borderRadius: 999,
                  }}>
                    {t.label}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={finish}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, var(--violet) 0%, var(--blue) 100%)',
                boxShadow: '0 8px 32px -8px rgba(124,92,255,0.35)',
              }}
            >
              Enter LinguaChat
            </button>
            <p style={{ fontSize: 11, color: 'var(--ink-muted)', textAlign: 'center', marginTop: 10 }}>
              Practice English without fear.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
