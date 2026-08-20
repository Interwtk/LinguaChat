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
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <ChattoMascot mood="happy" size={30} decorative={true} animated={false} />
          <span style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--ink)' }}>LinguaChat</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} style={{
                width: i === step ? 18 : 6, height: 6, borderRadius: 999,
                background: i <= step ? 'var(--accent)' : 'var(--border)',
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
  const { completePlacement, t, interfaceLanguage } = useApp()
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
        completePlacement(calculatePlacementResult(evaluated.nextState, interfaceLanguage))
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
          <ChattoMascot mood="thinking" size={80} variant="blue" intensity="guide" />
          <div style={{ marginTop: 24, marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)' }}>
              LinguaChat
            </p>
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.625rem', color: 'var(--ink)', marginBottom: 12, lineHeight: 1.2 }}>
            {t('placementAdaptiveTitle')}
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', lineHeight: 1.65, maxWidth: 360, marginBottom: 32 }}>
            {t('placementAdaptiveText')}
          </p>
          <div className="grid gap-2 mb-7" style={{ maxWidth: 380, width: '100%' }}>
            {[t('placementAdaptiveBullet1'), t('placementAdaptiveBullet2'), t('placementAdaptiveBullet3'), t('placementAdaptiveBullet4')].map(item => (
              <div key={item} className="rounded-2xl px-4 py-3 text-left"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.45 }}>{item}</p>
              </div>
            ))}
          </div>
          <button
            onClick={start}
            className="px-8 py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-px active:scale-[0.98]"
            style={{ background: 'var(--accent)' }}
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
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)' }}>
              {t('questionOf')} {placementState.answers.length + 1} {t('of')} {placementState.maxQuestions}
            </p>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--muted)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              padding: '3px 9px',
              borderRadius: 999,
            }}>
              {t('placementShortTest')}
            </span>
          </div>

          <div className="rounded-3xl p-5 md:p-6 mb-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', fontWeight: 600, marginBottom: 8 }}>
              {t(question.instructionKey)}
            </p>
            <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--ink)', lineHeight: 1.25 }}>
              {t(question.promptKey)}
            </h2>
            <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.45, marginTop: 10 }}>
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
                      ? 'var(--positive-soft)'
                      : isSelected
                        ? 'var(--accent-soft)'
                        : 'var(--surface)',
                    border: `1px solid ${showResult && isCorrect ? 'var(--positive)' : isSelected ? 'var(--accent-tint)' : 'var(--border)'}`,
                    color: 'var(--ink)',
                    cursor: selectedOption ? 'default' : 'pointer',
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', marginRight: 10 }}>
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
                background: feedback.isCorrect ? 'var(--positive-soft)' : 'var(--info-soft)',
                border: `1px solid ${feedback.isCorrect ? 'var(--positive)' : 'var(--info)'}`,
              }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>
                {feedback.isCorrect ? t('placementCorrect') : t('placementIncorrect')}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                {t(feedback.explanationKey)}
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
  const strengths = result.strengths || result.placementStrengths || [t('placementFallbackStrength')]
  const focusAreas = result.focusAreas || result.placementFocusAreas || [
    t('placementFallbackFocus1'), t('placementFallbackFocus2'), t('placementFallbackFocus3'),
  ]

  return (
    <SetupShell step={1} totalSteps={3}>
      <div className="flex-1 overflow-y-auto px-5 py-8" style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>
        <div className="animate-fade-up">
          {/* Chatto Moti Moment — celebrates finishing the placement */}
          <div className="animate-scale-in rounded-3xl p-5 mb-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
            style={{ background: 'var(--surface)', border: '1px solid var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft), var(--shadow-md)' }}>
            <ChattoMascot mood={moti.mood} size={84} variant={moti.variant} />
            <div>
              <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)', marginBottom: 4 }}>{t(moti.titleKey)}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5 }}>{t(moti.messageKey)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <LinguaAvatar size={52} online />
            <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.5 }}>
                {t('resultBubble')}
              </p>
            </div>
          </div>

          {/* Level badge */}
          <div className="rounded-3xl p-6 mb-6 text-center" style={{ background: 'var(--surface)', border: '1.5px solid var(--accent)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: 10 }}>
              {t('detectedLevel')}
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 80, height: 80, borderRadius: '50%', marginBottom: 12,
              background: 'var(--accent)',
            }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff' }}>{result.level}</span>
            </div>
            <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
              {t('placementPoint')} {result.level}.
            </p>
          </div>

          <div className="grid gap-3 mb-6">
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--positive)', marginBottom: 8 }}>
                {t('alreadyDoWell')}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.6 }}>{strengths.join(' ')}</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--info)', marginBottom: 8 }}>
                {t('practiceNext')}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                {focusAreas.join(', ')}.
              </p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'var(--positive-soft)', border: '1px solid var(--positive)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--positive)', marginBottom: 8 }}>
                {t('nextGoal')}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                {result.practiceRecommendation || t('placementFallbackRecommendation')}
              </p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 8 }}>
                {t('howLinguaCorrects')}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.6 }}>
                {result.recommendedCorrectionStyle || t('placementFallbackCorrection')}
              </p>
            </div>
          </div>

          {/* Confidence bars */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 14 }}>
            {t('confidenceScore')}
            </p>
            {[
              { label: t('vocabulary'), value: result.vocab, color: 'var(--positive)' },
              { label: t('grammar'), value: result.grammar, color: 'var(--info)' },
              { label: t('conversation'), value: result.conversation, color: 'var(--accent)' },
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
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-tint)' }}>
            <span style={{ fontSize: 20 }}>🎯</span>
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ink)' }}>{t('nextMilestone')}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                {t('reachNextLevel')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setAuthStep('setup-choice')}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-px active:scale-[0.98]"
            style={{ background: 'var(--accent)' }}
          >
            {t('enterPractice')}
          </button>
        </div>
      </div>
    </SetupShell>
  )
}

/* ---- SETUP CHOICE: recommended vs personalize ---- */
function SetupChoice() {
  const { setAuthStep, applyRecommendedSetup, t } = useApp()

  return (
    <SetupShell step={1} totalSteps={3}>
      <div className="flex-1 overflow-y-auto px-5 py-8" style={{ maxWidth: 620, margin: '0 auto', width: '100%' }}>
        <div className="animate-fade-up">
          {/* Chatto guides the choice — it never decides for you */}
          <div className="flex flex-col items-center text-center mb-8">
            <ChattoMascot mood="supportive" size="medium" variant="accent" intensity="guide" />
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)', marginTop: 16, marginBottom: 8 }}>
              {t('setupChoiceEyebrow')}
            </p>
            <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.4rem, 4vw, 1.75rem)', color: 'var(--ink)', lineHeight: 1.2, marginBottom: 10 }}>
              {t('setupChoiceTitle')}
            </h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', lineHeight: 1.6, maxWidth: 420 }}>
              {t('setupChoiceBody')}
            </p>
          </div>

          <div className="grid gap-3">
            {/* Recommended — one tap to a balanced Lingua */}
            <button
              type="button"
              onClick={applyRecommendedSetup}
              className="card-lift group text-left rounded-3xl p-5 transition-all active:scale-[0.99]"
              style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', boxShadow: '0 0 0 3px var(--accent-soft)' }}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--ink)' }}>{t('setupRecommendedTitle')}</span>
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', background: 'var(--accent)', padding: '3px 9px', borderRadius: 999, flexShrink: 0 }}>
                  {t('recommended')}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.55, marginBottom: 14 }}>{t('setupRecommendedDesc')}</p>
              <span className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 font-bold text-white text-sm"
                style={{ background: 'var(--accent)' }}>
                {t('setupRecommendedCta')}
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </button>

            {/* Personalize — go into the guided flow */}
            <button
              type="button"
              onClick={() => setAuthStep('tutor-personality')}
              className="card-lift group text-left rounded-3xl p-5 transition-all active:scale-[0.99]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <span style={{ display: 'block', fontWeight: 800, fontSize: '1.0625rem', color: 'var(--ink)', marginBottom: 6 }}>{t('setupPersonalizeTitle')}</span>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.55, marginBottom: 12 }}>{t('setupPersonalizeDesc')}</p>
              <span className="inline-flex items-center gap-1.5 font-bold text-sm" style={{ color: 'var(--accent)' }}>
                {t('setupPersonalizeCta')}
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
              </span>
            </button>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', textAlign: 'center', marginTop: 18, lineHeight: 1.5 }}>
            {t('setupChoiceChatto')}
          </p>
        </div>
      </div>
    </SetupShell>
  )
}

/* ---- TUTOR PERSONALITY ---- */
// `id` is the stored value (also used by the backend/profile) and stays English.
// The visible name/desc/sample are localized via i18n keys.
const PERSONALITIES = [
  { id: 'Gentle Guide',    emoji: '🌿', nameKey: 'persGentleName', descKey: 'persGentleDesc', sampleKey: 'persGentleSample', aura: 'var(--positive)',  soft: 'var(--positive-soft)' },
  { id: 'Casual Friend',   emoji: '😊', nameKey: 'persCasualName', descKey: 'persCasualDesc', sampleKey: 'persCasualSample', aura: 'var(--accent)',  soft: 'var(--accent-soft)' },
  { id: 'Strict Coach',    emoji: '📐', nameKey: 'persStrictName', descKey: 'persStrictDesc', sampleKey: 'persStrictSample', aura: 'var(--info)',   soft: 'var(--info-soft)' },
  { id: 'Interview Mentor',emoji: '🎯', nameKey: 'persMentorName', descKey: 'persMentorDesc', sampleKey: 'persMentorSample', aura: 'var(--accent)', soft: 'var(--accent-soft)' },
]
const personalityName = (id) => PERSONALITIES.find(p => p.id === id)?.nameKey

function TutorPersonality() {
  const { completeTutorPersonality, t } = useApp()
  const [selected, setSelected] = useState(null)

  return (
    <SetupShell step={1} totalSteps={3}>
      <div className="flex-1 overflow-y-auto px-5 py-8" style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
        <div className="animate-fade-up">
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: 10 }}>
            {t('chooseEnergyEyebrow')}
          </p>
          <h2 style={{ fontWeight: 800, fontSize: '1.625rem', color: 'var(--ink)', marginBottom: 8, lineHeight: 1.2 }}>
            {t('chooseEnergyTitle')}
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 28 }}>
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
                    background: isSelected ? p.soft : 'var(--surface)',
                    border: `2px solid ${isSelected ? p.aura : 'var(--border)'}`,
                    boxShadow: isSelected ? `0 0 0 4px ${p.aura}22` : 'none',
                    transform: isSelected ? 'translateY(-1px)' : 'none',
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span style={{ fontSize: 24 }}>{p.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', marginBottom: 4 }}>{t(p.nameKey)}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5 }}>{t(p.descKey)}</p>
                    </div>
                    {isSelected && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: p.aura, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl px-3 py-2" style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{t(p.sampleKey)}"
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
            style={{ background: 'var(--accent)', opacity: selected ? 1 : 0.5, cursor: selected ? 'pointer' : 'not-allowed' }}
          >
            {selected ? `${t('choose')} · ${t(personalityName(selected))}` : t('selectEnergy')}
          </button>
        </div>
      </div>
    </SetupShell>
  )
}

/* ---- LEARNING PREFERENCES ---- */
// `id` stays English (stored/sent); the visible label is localized.
const GOAL_OPTIONS = [
  { id: 'Travel', key: 'goalOptTravel' }, { id: 'Work', key: 'goalOptWork' },
  { id: 'Study', key: 'goalOptStudy' }, { id: 'Friends', key: 'goalOptFriends' },
  { id: 'Streaming', key: 'goalOptStreaming' }, { id: 'Immigration', key: 'goalOptImmigration' },
]
const VIBE_OPTIONS = [
  { id: 'Motivational', key: 'vibeMotivational' }, { id: 'Calm', key: 'vibeCalm' }, { id: 'Challenging', key: 'vibeChallenging' },
]
const CORRECTION_OPTIONS = [
  { id: 'Every mistake', key: 'corrEvery' }, { id: 'Balanced', key: 'corrBalanced' }, { id: 'Only big errors', key: 'corrOnlyBig' },
]
const DAILY_OPTIONS = [5, 10, 15, 30]
const labelKeyFor = (list, id) => list.find(o => o.id === id)?.key

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
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)', marginBottom: 10 }}>
            {t('prefsEyebrow')}
          </p>
          <h2 style={{ fontWeight: 800, fontSize: '1.625rem', color: 'var(--ink)', marginBottom: 6, lineHeight: 1.2 }}>
            {t('prefsTitle')}
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', marginBottom: 28 }}>
            {t('prefsText')}
          </p>

          {/* Why you practice */}
          <Section label={t('whyLearning')}>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map(o => (
                <button key={o.id} onClick={() => toggleGoal(o.id)}
                  className="px-4 py-2 rounded-2xl text-sm font-semibold transition-all"
                  style={{
                    background: goals.includes(o.id) ? 'var(--accent)' : 'var(--surface)',
                    color: goals.includes(o.id) ? '#fff' : 'var(--ink)',
                    border: `1px solid ${goals.includes(o.id) ? 'var(--accent)' : 'var(--border)'}`,
                  }}>
                  {t(o.key)}
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
                    background: daily === d ? 'var(--accent)' : 'var(--surface)',
                    color: daily === d ? '#fff' : 'var(--ink)',
                    border: `1px solid ${daily === d ? 'var(--accent)' : 'var(--border)'}`,
                  }}>
                  {d}m
                </button>
              ))}
            </div>
          </Section>

          {/* Correction style */}
          <Section label={t('correctionQuestion')}>
            <div className="flex flex-col gap-2">
              {CORRECTION_OPTIONS.map(o => (
                <button key={o.id} onClick={() => setCorrection(o.id)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-left transition-all"
                  style={{
                    background: correction === o.id ? 'var(--info-soft)' : 'var(--surface)',
                    color: 'var(--ink)',
                    border: `1px solid ${correction === o.id ? 'var(--info)' : 'var(--border)'}`,
                  }}>
                  {t(o.key)}
                </button>
              ))}
            </div>
          </Section>

          {/* Practice vibe */}
          <Section label={t('vibeQuestion')}>
            <div className="grid grid-cols-3 gap-2">
              {VIBE_OPTIONS.map(o => (
                <button key={o.id} onClick={() => setVibe(o.id)}
                  className="py-2.5 rounded-xl font-semibold text-sm transition-all"
                  style={{
                    background: vibe === o.id ? 'var(--accent-soft)' : 'var(--surface)',
                    color: 'var(--ink)',
                    border: `1px solid ${vibe === o.id ? 'var(--accent)' : 'var(--border)'}`,
                  }}>
                  {t(o.key)}
                </button>
              ))}
            </div>
          </Section>

          {/* Summary */}
          {goals.length > 0 && (
            <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 8 }}>
                {t('yourSetup')}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.65 }}>
                {t('prefsSummary', {
                  style: t(personalityName(profile.tutorPersonality) || 'persGentleName'),
                  daily,
                  correction: t(labelKeyFor(CORRECTION_OPTIONS, correction) || 'corrBalanced'),
                  vibe: t(labelKeyFor(VIBE_OPTIONS, vibe) || 'vibeMotivational'),
                })}
              </p>
            </div>
          )}

          <button
            onClick={finish}
            disabled={goals.length === 0}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-90 hover:-translate-y-px active:scale-[0.98]"
            style={{ background: 'var(--accent)', opacity: goals.length > 0 ? 1 : 0.5 }}
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
    'setup-choice': <SetupChoice />,
    'tutor-personality': <TutorPersonality />,
    'learning-prefs': <LearningPreferences />,
    personalize: <TutorPersonalizationStep />,
  }
  return screens[authStep] || <PlacementTest />
}
