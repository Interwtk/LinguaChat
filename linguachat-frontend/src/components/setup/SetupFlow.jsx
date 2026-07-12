import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { ThemeToggle } from '../ui/ThemeToggle'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { TutorPersonalizationStep } from '../onboarding/TutorPersonalizationStep'
import { getMotiMoment } from '../../services/motiMoments'
import {
  calculatePlacementResult,
  evaluateAnswer,
  getInitialPlacementState,
  getNextQuestion,
  shouldFinishPlacement,
} from '../../services/placement'

function SetupShell({ children, step, totalSteps }) {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
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
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} style={{
                width: i === step ? 18 : 6, height: 6, borderRadius: 999,
                background: i <= step ? 'var(--violet)' : 'var(--border)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
          <ThemeToggle compact />
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}

function PlacementTest() {
  const { completePlacement, t } = useApp()
  const [phase, setPhase] = useState('intro')
  const [placementState, setPlacementState] = useState(() => getInitialPlacementState('A2'))
  const [selectedOption, setSelectedOption] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const question = useMemo(() => getNextQuestion(placementState), [placementState])

  function start() {
    setPhase('quiz')
  }

  function chooseOption(optionId) {
    if (selectedOption || phase !== 'quiz') return
    const evaluated = evaluateAnswer(question, optionId, placementState)
    setSelectedOption(optionId)
    setFeedback(evaluated.feedback)
    window.setTimeout(() => {
      if (shouldFinishPlacement(evaluated.nextState)) {
        completePlacement(calculatePlacementResult(evaluated.nextState))
        return
      }
      setPlacementState(evaluated.nextState)
      setSelectedOption(null)
      setFeedback(null)
    }, 1200)
  }

  if (phase === 'intro') {
    return (
      <SetupShell step={0} totalSteps={3}>
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 text-center animate-fade-up">
          <LinguaAvatar size={72} online />
          <div style={{ marginTop: 24, marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--violet)' }}>
              LinguaChat
            </p>
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.625rem', color: 'var(--ink)', marginBottom: 12, lineHeight: 1.2 }}>
            {t('placementAdaptiveTitle')}
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', lineHeight: 1.65, maxWidth: 360, marginBottom: 32 }}>
            {t('placementAdaptiveText')}
          </p>
          <div className="grid gap-2 mb-7" style={{ maxWidth: 380, width: '100%' }}>
            {[t('placementAdaptiveBullet1'), t('placementAdaptiveBullet2'), t('placementAdaptiveBullet3'), t('placementAdaptiveBullet4')].map(item => (
              <div key={item} className="rounded-2xl px-4 py-3 text-left"
                style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.45 }}>{item}</p>
              </div>
            ))}
          </div>
          <button
            onClick={start}
            className="px-8 py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-px active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, var(--violet), var(--blue))' }}
          >
            {t('placementAdaptiveStart')}
          </button>
        </div>
      </SetupShell>
    )
  }

  return (
    <SetupShell step={0} totalSteps={3}>
      <div className="flex-1 overflow-y-auto px-5 py-8" style={{ maxWidth: 640, width: '100%', margin: '0 auto' }}>
        <div className="animate-fade-up">
          <div className="flex items-center justify-between mb-5">
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--violet)' }}>
              {t('questionOf')} {placementState.answers.length + 1} {t('of')} {placementState.maxQuestions}
            </p>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--ink-muted)',
              background: 'var(--bg-paper)',
              border: '1px solid var(--border)',
              padding: '3px 9px',
              borderRadius: 999,
            }}>
              {t('placementShortTest')}
            </span>
          </div>

          <div className="rounded-3xl p-5 md:p-6 mb-5" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', fontWeight: 600, marginBottom: 8 }}>
              {question.instruction}
            </p>
            <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--ink)', lineHeight: 1.25 }}>
              {question.prompt}
            </h2>
            <p style={{ fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.45, marginTop: 10 }}>
              {t('placementExamplesNote')}
            </p>
          </div>

          <div className="grid gap-3">
            {question.options.map((option, index) => {
              const isSelected = selectedOption === option.id
              const isCorrect = option.id === question.correctOptionId
              const showResult = Boolean(selectedOption)
              return (
                <button
                  key={option.id}
                  onClick={() => chooseOption(option.id)}
                  disabled={Boolean(selectedOption)}
                  className="w-full rounded-2xl px-4 py-4 text-left transition-all hover:-translate-y-px active:scale-[0.99]"
                  style={{
                    background: showResult && isCorrect
                      ? 'var(--green-soft)'
                      : isSelected
                        ? 'var(--yellow-soft)'
                        : 'var(--bg-paper)',
                    border: `1.5px solid ${showResult && isCorrect ? 'var(--green)' : isSelected ? 'var(--yellow)' : 'var(--border)'}`,
                    color: 'var(--ink)',
                    cursor: selectedOption ? 'default' : 'pointer',
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--violet)', marginRight: 10 }}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 650 }}>{option.text}</span>
                </button>
              )
            })}
          </div>

          {feedback && (
            <div className="rounded-2xl p-4 mt-5 animate-fade-up"
              style={{
                background: feedback.isCorrect ? 'var(--green-soft)' : 'var(--blue-soft)',
                border: `1px solid ${feedback.isCorrect ? 'var(--green)' : 'var(--blue)'}`,
              }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>
                {feedback.isCorrect ? t('placementCorrect') : t('placementIncorrect')}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                {feedback.explanation}
              </p>
            </div>
          )}
        </div>
      </div>
    </SetupShell>
  )
}

/* ---- LEVEL REVEAL ---- */
function LevelReveal() {
  const { profile, setAuthStep, t } = useApp()
  const moti = getMotiMoment('placementDone')
  const result = profile.placementResult || { level: 'B1', vocab: 72, grammar: 65, conversation: 78 }
  const strengths = result.strengths || result.placementStrengths || ['You can communicate simple ideas.']
  const focusAreas = result.focusAreas || result.placementFocusAreas || ['word order', 'questions', 'everyday vocabulary']

  return (
    <SetupShell step={1} totalSteps={3}>
      <div className="flex-1 overflow-y-auto px-5 py-8" style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>
        <div className="animate-fade-up">
          {/* Chatto Moti Moment — celebrates finishing the placement */}
          <div className="animate-scale-in rounded-3xl p-5 mb-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
            style={{ background: 'var(--bg-paper)', border: '1px solid var(--violet)', boxShadow: '0 0 0 4px var(--violet-soft), 0 12px 32px -16px rgba(124,92,255,0.4)' }}>
            <ChattoMascot mood={moti.mood} size={84} variant={moti.variant} />
            <div>
              <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)', marginBottom: 4 }}>{t(moti.titleKey)}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>{t(moti.messageKey)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <LinguaAvatar size={52} online />
            <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.5 }}>
                {t('resultBubble')}
              </p>
            </div>
          </div>

          {/* Level badge */}
          <div className="rounded-3xl p-6 mb-6 text-center" style={{ background: 'var(--bg-paper)', border: '2px solid var(--violet)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--violet)', marginBottom: 10 }}>
              {t('detectedLevel')}
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 80, height: 80, borderRadius: '50%', marginBottom: 12,
              background: 'linear-gradient(135deg, var(--violet), var(--blue))',
            }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff' }}>{result.level}</span>
            </div>
            <p style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
              {t('placementPoint')} {result.level}.
            </p>
          </div>

          <div className="grid gap-3 mb-6">
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--green)', marginBottom: 8 }}>
                {t('alreadyDoWell')}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.6 }}>{strengths.join(' ')}</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--blue)', marginBottom: 8 }}>
                {t('practiceNext')}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                {focusAreas.join(', ')}.
              </p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'var(--green-soft)', border: '1px solid var(--green)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--green)', marginBottom: 8 }}>
                {t('nextGoal')}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                {result.practiceRecommendation || 'Lingua will start with short replies and one active mini goal per turn.'}
              </p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'var(--violet-soft)', border: '1px solid var(--violet)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--violet)', marginBottom: 8 }}>
                {t('howLinguaCorrects')}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                {result.recommendedCorrectionStyle || 'Balanced corrections with short examples.'}
              </p>
            </div>
          </div>

          {/* Confidence bars */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 14 }}>
            {t('confidenceScore')}
            </p>
            {[
              { label: t('vocabulary'), value: result.vocab, color: 'var(--green)' },
              { label: t('grammar'), value: result.grammar, color: 'var(--blue)' },
              { label: t('conversation'), value: result.conversation, color: 'var(--violet)' },
            ].map(bar => (
              <div key={bar.label} style={{ marginBottom: 14 }}>
                <div className="flex justify-between mb-1.5">
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)' }}>{bar.label}</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: bar.color }}>{bar.value}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${bar.value}%`, height: '100%', borderRadius: 999, background: bar.color, transition: 'width 0.8s' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Next milestone */}
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3" style={{ background: 'var(--yellow-soft)', border: '1px solid var(--yellow)' }}>
            <span style={{ fontSize: 20 }}>🎯</span>
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ink)' }}>{t('nextMilestone')}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                {t('reachNextLevel')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setAuthStep('tutor-personality')}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-px active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, var(--violet), var(--blue))' }}
          >
            {t('enterPractice')}
          </button>
        </div>
      </div>
    </SetupShell>
  )
}

/* ---- TUTOR PERSONALITY ---- */
const PERSONALITIES = [
  {
    id: 'Gentle Guide',
    emoji: '🌿',
    name: 'Gentle Guide',
    desc: 'Patient, encouraging, celebrates every step. Perfect if you get nervous about mistakes.',
    sample: 'That was a wonderful try! Here is a tiny note...',
    aura: 'var(--green)',
    soft: 'var(--green-soft)',
  },
  {
    id: 'Casual Friend',
    emoji: '😊',
    name: 'Casual Friend',
    desc: 'Relaxed and fun. Talks like a real friend, keeps it light and conversational.',
    sample: 'Hey, nice one! Just a tiny thing to fix...',
    aura: 'var(--coral)',
    soft: 'var(--coral-soft)',
  },
  {
    id: 'Strict Coach',
    emoji: '📐',
    name: 'Strict Coach',
    desc: 'Precise and demanding. Calls out every mistake. For those who want fast improvement.',
    sample: 'Note the correction below. Precision matters.',
    aura: 'var(--blue)',
    soft: 'var(--blue-soft)',
  },
  {
    id: 'Interview Mentor',
    emoji: '🎯',
    name: 'Interview Mentor',
    desc: 'Professional and goal-focused. Prepares you for work and formal situations.',
    sample: 'In a professional context, use this exact phrase.',
    aura: 'var(--violet)',
    soft: 'var(--violet-soft)',
  },
]

function TutorPersonality() {
  const { completeTutorPersonality, t } = useApp()
  const [selected, setSelected] = useState(null)

  return (
    <SetupShell step={1} totalSteps={3}>
      <div className="flex-1 overflow-y-auto px-5 py-8" style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
        <div className="animate-fade-up">
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--violet)', marginBottom: 10 }}>
            {t('chooseEnergyEyebrow')}
          </p>
          <h2 style={{ fontWeight: 800, fontSize: '1.625rem', color: 'var(--ink)', marginBottom: 8, lineHeight: 1.2 }}>
            {t('chooseEnergyTitle')}
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: 28 }}>
            {t('chooseEnergyText')}
          </p>

          <div className="grid grid-cols-1 gap-3 mb-7" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {PERSONALITIES.map(p => {
              const isSelected = selected === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className="rounded-2xl p-5 cursor-pointer transition-all"
                  style={{
                    background: isSelected ? p.soft : 'var(--bg-paper)',
                    border: `2px solid ${isSelected ? p.aura : 'var(--border)'}`,
                    boxShadow: isSelected ? `0 0 0 4px ${p.aura}22` : 'none',
                    transform: isSelected ? 'translateY(-1px)' : 'none',
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span style={{ fontSize: 24 }}>{p.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', marginBottom: 4 }}>{p.name}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>{p.desc}</p>
                    </div>
                    {isSelected && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: p.aura, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl px-3 py-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{p.sample}"
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => selected && completeTutorPersonality(selected)}
            disabled={!selected}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, var(--violet), var(--blue))', opacity: selected ? 1 : 0.5, cursor: selected ? 'pointer' : 'not-allowed' }}
          >
            {selected ? `${t('choose')} ${selected}` : t('selectEnergy')}
          </button>
        </div>
      </div>
    </SetupShell>
  )
}

/* ---- LEARNING PREFERENCES ---- */
const GOALS_OPTIONS = ['Travel', 'Work', 'Study', 'Friends', 'Streaming', 'Immigration']
const VIBES = ['Motivational', 'Calm', 'Challenging']
const CORRECTION_LEVELS = ['Every mistake', 'Balanced', 'Only big errors']
const DAILY_OPTIONS = [5, 10, 15, 30]

function LearningPreferences() {
  const { completeLearningPrefs, profile, t } = useApp()
  const [goals, setGoals] = useState(['Travel'])
  const [daily, setDaily] = useState(10)
  const [correction, setCorrection] = useState('Balanced')
  const [vibe, setVibe] = useState('Motivational')

  function toggleGoal(g) {
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  function finish() {
    if (goals.length === 0) return
    completeLearningPrefs({ goals, dailyGoal: daily, correctionIntensity: correction, practiceVibe: vibe })
  }

  return (
    <SetupShell step={2} totalSteps={3}>
      <div className="flex-1 overflow-y-auto px-5 py-8" style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>
        <div className="animate-fade-up">
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--violet)', marginBottom: 10 }}>
            {t('prefsEyebrow')}
          </p>
          <h2 style={{ fontWeight: 800, fontSize: '1.625rem', color: 'var(--ink)', marginBottom: 6, lineHeight: 1.2 }}>
            {t('prefsTitle')}
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', marginBottom: 28 }}>
            {t('prefsText')}
          </p>

          {/* Why you practice */}
          <Section label={t('whyLearning')}>
            <div className="flex flex-wrap gap-2">
              {GOALS_OPTIONS.map(g => (
                <button key={g} onClick={() => toggleGoal(g)}
                  className="px-4 py-2 rounded-2xl text-sm font-semibold transition-all"
                  style={{
                    background: goals.includes(g) ? 'var(--violet)' : 'var(--bg-paper)',
                    color: goals.includes(g) ? '#fff' : 'var(--ink)',
                    border: `1.5px solid ${goals.includes(g) ? 'var(--violet)' : 'var(--border)'}`,
                  }}>
                  {g}
                </button>
              ))}
            </div>
          </Section>

          {/* Daily time */}
          <Section label={t('dailyTime')}>
            <div className="grid grid-cols-4 gap-2">
              {DAILY_OPTIONS.map(d => (
                <button key={d} onClick={() => setDaily(d)}
                  className="py-3 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: daily === d ? 'var(--violet)' : 'var(--bg-paper)',
                    color: daily === d ? '#fff' : 'var(--ink)',
                    border: `1.5px solid ${daily === d ? 'var(--violet)' : 'var(--border)'}`,
                  }}>
                  {d}m
                </button>
              ))}
            </div>
          </Section>

          {/* Correction style */}
          <Section label={t('correctionQuestion')}>
            <div className="flex flex-col gap-2">
              {CORRECTION_LEVELS.map(c => (
                <button key={c} onClick={() => setCorrection(c)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-left transition-all"
                  style={{
                    background: correction === c ? 'var(--blue-soft)' : 'var(--bg-paper)',
                    color: 'var(--ink)',
                    border: `1.5px solid ${correction === c ? 'var(--blue)' : 'var(--border)'}`,
                  }}>
                  {c}
                </button>
              ))}
            </div>
          </Section>

          {/* Practice vibe */}
          <Section label={t('vibeQuestion')}>
            <div className="grid grid-cols-3 gap-2">
              {VIBES.map(v => (
                <button key={v} onClick={() => setVibe(v)}
                  className="py-2.5 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: vibe === v ? 'var(--coral-soft)' : 'var(--bg-paper)',
                    color: 'var(--ink)',
                    border: `1.5px solid ${vibe === v ? 'var(--coral)' : 'var(--border)'}`,
                  }}>
                  {v}
                </button>
              ))}
            </div>
          </Section>

          {/* Summary */}
          {goals.length > 0 && (
            <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 8 }}>
                {t('yourSetup')}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.65 }}>
                {profile.tutorPersonality} style, {daily} minutes/day, correcting {correction.toLowerCase()}, with a {vibe.toLowerCase()} vibe.
              </p>
            </div>
          )}

          <button
            onClick={finish}
            disabled={goals.length === 0}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-px active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, var(--coral), var(--violet))', opacity: goals.length > 0 ? 1 : 0.5 }}
          >
            {t('enterLinguaChat')}
          </button>
        </div>
      </div>
    </SetupShell>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>{label}</p>
      {children}
    </div>
  )
}

/* ---- ROUTER ---- */
export function SetupFlow() {
  const { authStep } = useApp()
  const screens = {
    placement: <PlacementTest />,
    'level-reveal': <LevelReveal />,
    'tutor-personality': <TutorPersonality />,
    'learning-prefs': <LearningPreferences />,
    personalize: <TutorPersonalizationStep />,
  }
  return screens[authStep] || <PlacementTest />
}
