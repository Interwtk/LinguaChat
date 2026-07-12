import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../../context/AppContext'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { MOCK_STATS } from '../../data/mockData'
import { getLanguageOption, languageFromInput, searchLanguages } from '../../services/language'
import { COMPANIONS, TUTOR_OPTION_GROUPS, INTEREST_OPTIONS } from '../../services/tutorPreferences'

const MOOD_COLORS = [
  { id: 'violet', label: 'Calm', bg: 'linear-gradient(135deg, var(--violet), var(--blue))' },
  { id: 'coral', label: 'Energetic', bg: 'linear-gradient(135deg, var(--coral), var(--yellow))' },
  { id: 'green', label: 'Grounded', bg: 'linear-gradient(135deg, var(--green), var(--blue))' },
  { id: 'yellow', label: 'Playful', bg: 'linear-gradient(135deg, var(--yellow), var(--coral))' },
]

const RELATIONSHIP_STAGES = [
  { days: 0, label: 'New acquaintances' },
  { days: 3, label: 'Familiar faces' },
  { days: 7, label: 'Steady companions' },
  { days: 14, label: 'Close companions' },
  { days: 30, label: 'Long-time partners' },
]

function PreferenceButtons({ label, value, options, onChange, t }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', marginBottom: 8 }}>
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const selected = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className="rounded-xl px-3 py-2 text-xs font-bold transition-all active:scale-[0.98]"
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

function getRelationshipLabel(streak) {
  const stage = [...RELATIONSHIP_STAGES].reverse().find(s => streak >= s.days)
  return stage?.label || 'New acquaintances'
}

export function LanguageIdentity() {
  const {
    profile,
    updateProfile,
    navigateTo,
    logoutMock,
    localProgress,
    resetLocalProgress,
    nativeLanguageInfo,
    interfaceLanguageInfo,
    targetLanguage,
    setNativeLanguage,
    darkMode,
    setThemeDark,
    tutorPreferences,
    updateTutorPreferences,
    activeCompanion,
    setActiveCompanion,
    textSize,
    setTextSize,
    t,
  } = useApp()
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(profile.name || '')
  const [moodColor, setMoodColor] = useState(profile.moodColor || 'violet')
  const [languageOpen, setLanguageOpen] = useState(false)
  const [languageSearch, setLanguageSearch] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState(() => getLanguageOption(nativeLanguageInfo))
  const [languageSaved, setLanguageSaved] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState(null)
  const languagePickerRef = useRef(null)
  const languagePopoverRef = useRef(null)

  useEffect(() => {
    setSelectedLanguage(getLanguageOption(nativeLanguageInfo))
  }, [nativeLanguageInfo.code])

  useEffect(() => {
    if (!languageOpen) return undefined

    function handlePointerDown(event) {
      const isInsidePicker = languagePickerRef.current?.contains(event.target)
      const isInsidePopover = languagePopoverRef.current?.contains(event.target)
      if (!isInsidePicker && !isInsidePopover) {
        setLanguageOpen(false)
        setLanguageSearch('')
        setSelectedLanguage(getLanguageOption(nativeLanguageInfo))
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [languageOpen, nativeLanguageInfo])

  useEffect(() => {
    if (!languageOpen) return undefined

    function updateDropdownPosition() {
      const rect = languagePickerRef.current?.getBoundingClientRect()
      if (!rect) return

      const viewportPadding = 16
      const width = Math.min(460, Math.max(320, Math.min(rect.width, window.innerWidth - viewportPadding * 2)))
      const left = Math.min(
        Math.max(rect.left, viewportPadding),
        window.innerWidth - width - viewportPadding,
      )

      setDropdownPosition({
        top: rect.bottom + 10,
        left,
        width,
      })
    }

    updateDropdownPosition()
    window.addEventListener('resize', updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition, true)
    return () => {
      window.removeEventListener('resize', updateDropdownPosition)
      window.removeEventListener('scroll', updateDropdownPosition, true)
    }
  }, [languageOpen])

  const hasLocalProgress = localProgress.messagesSent > 0
  const confidence = hasLocalProgress ? localProgress.confidence : MOCK_STATS.confidence
  const streak = hasLocalProgress ? localProgress.streak : MOCK_STATS.streak
  const progressData = [45, 54, 62, Math.max(45, confidence - 5), confidence]
    .map((score, index) => ({ week: index === 4 ? 'Now' : `W${index + 1}`, score }))
  const practicedTopics = hasLocalProgress && localProgress.topics.length
    ? localProgress.topics
    : profile.preferences?.goals || [profile.goal || 'Travel']
  const currentMood = MOOD_COLORS.find(m => m.id === moodColor) || MOOD_COLORS[0]
  const relationship = getRelationshipLabel(streak)
  const currentLanguage = useMemo(() => getLanguageOption(nativeLanguageInfo), [nativeLanguageInfo])
  const languageResults = useMemo(
    () => searchLanguages(languageSearch, currentLanguage),
    [languageSearch, currentLanguage],
  )

  function saveName() {
    if (nameInput.trim()) updateProfile({ name: nameInput.trim() })
    setEditingName(false)
  }

  function saveMood(id) {
    setMoodColor(id)
    updateProfile({ moodColor: id })
  }

  function saveLanguage() {
    const nextLanguage = languageFromInput(selectedLanguage?.code || nativeLanguageInfo.code)
    setNativeLanguage(nextLanguage)
    setSelectedLanguage(getLanguageOption(nextLanguage))
    setLanguageOpen(false)
    setLanguageSearch('')
    setLanguageSaved(true)
    window.setTimeout(() => setLanguageSaved(false), 1600)
  }

  function toggleInterest(interest) {
    const current = tutorPreferences.interests || []
    const next = current.includes(interest)
      ? current.filter(item => item !== interest)
      : [...current, interest].slice(0, 6)
    updateTutorPreferences({ interests: next.length ? next : ['travel'] })
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8"
      dir={interfaceLanguageInfo.base === 'ar' ? 'rtl' : 'ltr'}
      style={{ background: 'var(--bg-main)' }}
    >
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 6 }}>
            {t('languageIdentityEyebrow')}
          </p>
          <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', color: 'var(--ink)', lineHeight: 1.1 }}>
            {t('languageIdentityTitle')}
          </h1>
        </div>

        {/* Avatar + identity card */}
        <div className="rounded-3xl p-6 mb-5 animate-fade-up" style={{ animationDelay: '0.04s', background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
          <div className="flex items-start gap-5">
            {/* Abstract avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: 24, flexShrink: 0,
              background: currentMood.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 8px 24px ${moodColor === 'violet' ? 'rgba(124,92,255,0.25)' : moodColor === 'coral' ? 'rgba(249,115,91,0.25)' : moodColor === 'green' ? 'rgba(63,174,117,0.25)' : 'rgba(246,196,83,0.25)'}`,
            }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>
                {(profile.name || 'L').charAt(0).toUpperCase()}
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {editingName ? (
                <div className="flex gap-2 mb-1">
                  <input
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    autoFocus
                    className="rounded-xl px-3 py-1.5 text-sm outline-none"
                    style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--violet)', color: 'var(--ink)', fontFamily: 'inherit', fontWeight: 700, flex: 1 }}
                  />
                  <button onClick={saveName}
                    className="px-3 py-1.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'var(--violet)', border: 'none', cursor: 'pointer' }}>
                    {t('save')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h2 style={{ fontWeight: 800, fontSize: '1.375rem', color: 'var(--ink)' }}>{profile.name || t('learner')}</h2>
                  <button onClick={() => setEditingName(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', display: 'flex' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <span style={{
                  fontSize: 10, fontWeight: 700, background: 'var(--violet)',
                  color: '#fff', padding: '2px 9px', borderRadius: 999,
                }}>
                  {profile.level || 'B1'}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                  {profile.email || 'linguachat.user'}
                </span>
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: 8 }}>
                {profile.tutorPersonality || 'Gentle Guide'} style
              </p>
            </div>
          </div>

          {/* Mood color picker */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 10 }}>
              {t('moodColor')}
            </p>
            <div className="flex gap-2">
              {MOOD_COLORS.map(m => (
                <button key={m.id} onClick={() => saveMood(m.id)}
                  className="flex flex-col items-center gap-1.5 transition-all"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: m.bg,
                    boxShadow: moodColor === m.id ? `0 0 0 3px var(--bg-paper), 0 0 0 5px ${m.id === 'violet' ? 'var(--violet)' : m.id === 'coral' ? 'var(--coral)' : m.id === 'green' ? 'var(--green)' : 'var(--yellow)'}` : 'none',
                    transition: 'all 0.2s',
                  }} />
                  <span style={{ fontSize: 10, color: moodColor === m.id ? 'var(--ink)' : 'var(--ink-muted)', fontWeight: moodColor === m.id ? 700 : 500 }}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 mb-5 animate-fade-up" style={{ animationDelay: '0.06s', background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 6 }}>
                {t('nativeLanguageLabel')}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                {t('nativeLanguageDescription')}
              </p>
            </div>
            {languageSaved && (
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--green)', whiteSpace: 'nowrap' }}>
                {t('saved')}
              </span>
            )}
          </div>
          <div ref={languagePickerRef} style={{ position: 'relative' }}>
            <div className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '1rem', color: 'var(--ink)', fontWeight: 800 }}>
                  {currentLanguage.nativeName}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 2 }}>
                  {currentLanguage.englishName} · {currentLanguage.code}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 2 }}>
                  {t('learningEnglish')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedLanguage(currentLanguage)
                  setLanguageOpen(value => !value)
                }}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                style={{ background: 'var(--violet-soft)', border: '1.5px solid var(--violet)', color: 'var(--violet)', whiteSpace: 'nowrap' }}
              >
                {t('changeLanguage')}
              </button>
            </div>

            {languageOpen && dropdownPosition && createPortal(
              <div
                ref={languagePopoverRef}
                className="rounded-2xl p-3 shadow-xl animate-popover-in"
                style={{
                  position: 'fixed',
                  zIndex: 1200,
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                  maxHeight: 'min(420px, calc(100dvh - 24px))',
                  overflow: 'hidden',
                  background: 'var(--bg-paper)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 20px 60px rgba(15, 23, 42, 0.18)',
                }}
              >
                <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>
                  {t('selectLanguage')}
                </p>
                <input
                  value={languageSearch}
                  onChange={event => setLanguageSearch(event.target.value)}
                  autoFocus
                  placeholder={t('searchLanguage')}
                  className="rounded-xl px-3 py-2 text-sm outline-none mb-2"
                  style={{ width: '100%', background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', color: 'var(--ink)' }}
                />
                <div style={{ maxHeight: 282, overflowY: 'auto', paddingInlineEnd: 4 }}>
                  {languageResults.map(option => {
                    const active = selectedLanguage?.code === option.code
                    return (
                      <button
                        key={option.code}
                        type="button"
                        onClick={() => setSelectedLanguage(option)}
                        className="w-full rounded-xl px-3 py-2 text-left transition-all"
                        style={{
                          background: active ? 'var(--violet-soft)' : 'transparent',
                          border: `1px solid ${active ? 'var(--violet)' : 'transparent'}`,
                          color: 'var(--ink)',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ display: 'block', fontSize: 14, fontWeight: 800 }}>
                          {option.nativeName}
                        </span>
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
                          {option.englishName} · {option.code}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguageOpen(false)
                      setLanguageSearch('')
                      setSelectedLanguage(currentLanguage)
                    }}
                    className="px-3 py-2 rounded-xl text-sm font-bold"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={saveLanguage}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]"
                    style={{ background: 'var(--violet)', border: 'none' }}
                  >
                    {t('save')}
                  </button>
                </div>
              </div>
            , document.body)}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 animate-fade-up" style={{ animationDelay: '0.08s' }}>
          {(hasLocalProgress ? [
            { label: 'Day streak', value: streak, emoji: '🔥', color: 'var(--coral)' },
            { label: 'Messages', value: localProgress.messagesSent, emoji: '💬', color: 'var(--blue)' },
            { label: t('corrections'), value: localProgress.correctionsReceived, emoji: 'OK', color: 'var(--yellow)' },
            { label: t('words'), value: localProgress.learnedItems.length, emoji: '📚', color: 'var(--green)' },
          ] : [
            { label: 'Day streak', value: MOCK_STATS.streak, emoji: '🔥', color: 'var(--coral)' },
            { label: 'Words known', value: MOCK_STATS.wordsLearned, emoji: '📚', color: 'var(--green)' },
            { label: 'Sessions', value: MOCK_STATS.sessionsTotal, emoji: '💬', color: 'var(--blue)' },
            { label: 'Confidence', value: `${MOCK_STATS.confidence}%`, emoji: '📈', color: 'var(--violet)' },
          ]).map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 20, marginBottom: 4 }}>{s.emoji}</p>
              <p style={{ fontWeight: 800, fontSize: '1.375rem', color: s.color }}>{s.value}</p>
              <p style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 500 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Confidence evolution */}
        <div className="rounded-2xl p-5 mb-5 animate-fade-up" style={{ animationDelay: '0.12s', background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 16 }}>
            {t('confidenceEvolution')}
          </p>
          <div className="flex items-end gap-2" style={{ height: 80 }}>
            {progressData.map((d, i) => (
              <div key={d.week} className="flex flex-col items-center gap-1.5 flex-1">
                <div style={{
                  width: '100%', borderRadius: '6px 6px 0 0',
                  height: `${(d.score / 100) * 72}px`,
                  background: i === progressData.length - 1
                    ? 'linear-gradient(180deg, var(--violet), var(--blue))'
                    : 'var(--border)',
                  transition: 'height 0.8s',
                  minHeight: 4,
                }} />
                <span style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: i === progressData.length - 1 ? 700 : 400 }}>{d.week}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: 12 }}>
            Confidence: <span style={{ fontWeight: 700, color: 'var(--violet)' }}>{confidence}%</span> (+{confidence - 45}% since you started)
          </p>
        </div>

        {/* Lingua relationship */}
        <div className="rounded-2xl p-5 mb-5 animate-fade-up" style={{ animationDelay: '0.16s', background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-4">
            <LinguaAvatar size={52} online />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 4 }}>
                {t('withLingua')}
              </p>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>{relationship}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: 2 }}>
                {streak} days practicing together
              </p>
            </div>
            <div style={{
              padding: '6px 14px', borderRadius: 999, flexShrink: 0,
              background: 'var(--green-soft)', border: '1px solid var(--green)',
            }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--green)' }}>{t('active')}</span>
            </div>
          </div>
        </div>

        {/* Topics + preferences */}
        <div className="rounded-2xl p-5 mb-6 animate-fade-up" style={{ animationDelay: '0.20s', background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 12 }}>
            {t('practiceIdentity')}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {practicedTopics.map(g => (
              <span key={g} style={{ fontSize: '0.8125rem', fontWeight: 600, padding: '4px 12px', borderRadius: 999, background: 'var(--violet-soft)', color: 'var(--violet)', border: '1px solid var(--violet)' }}>
                {g}
              </span>
            ))}
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, padding: '4px 12px', borderRadius: 999, background: 'var(--blue-soft)', color: 'var(--blue)', border: '1px solid var(--blue)' }}>
              {profile.preferences?.dailyGoal || profile.dailyGoal || 10} min/day
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
            {t('correctionStyleLabel')}: <strong style={{ color: 'var(--ink)' }}>{profile.preferences?.correctionIntensity || 'Balanced'}</strong>.
            {t('practiceVibeLabel')}: <strong style={{ color: 'var(--ink)' }}>{profile.preferences?.practiceVibe || 'Motivational'}</strong>.
          </p>
        </div>

        <div className="rounded-2xl p-5 mb-6 animate-fade-up" style={{ animationDelay: '0.21s', background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 6 }}>
            {t('personalizeTutor')}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5, marginBottom: 16 }}>
            {t('personalizeTutorDescription')}
          </p>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', marginBottom: 8 }}>
              {t('chooseCompanion')}
            </p>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
              {COMPANIONS.map(companion => {
                const selected = activeCompanion === companion.id
                return (
                  <button
                    key={companion.id}
                    type="button"
                    onClick={() => setActiveCompanion(companion.id)}
                    className="rounded-2xl p-3 text-left transition-all active:scale-[0.98]"
                    style={{
                      background: selected ? 'var(--violet-soft)' : 'var(--bg-elevated)',
                      border: `1.5px solid ${selected ? 'var(--violet)' : 'var(--border)'}`,
                      color: 'var(--ink)',
                    }}
                  >
                    <span style={{ display: 'block', fontSize: '0.9375rem', fontWeight: 900 }}>{companion.name}</span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 2 }}>{t(companion.roleKey)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {TUTOR_OPTION_GROUPS.map(group => (
              <PreferenceButtons
                key={group.key}
                label={t(group.labelKey)}
                value={tutorPreferences[group.key]}
                options={group.options}
                onChange={value => updateTutorPreferences({ [group.key]: value })}
                t={t}
              />
            ))}

            <div>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-muted)', marginBottom: 8 }}>
                {t('interests')}
              </p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map(interest => {
                  const selected = (tutorPreferences.interests || []).includes(interest)
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className="rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.98]"
                      style={{
                        background: selected ? 'var(--green-soft)' : 'var(--bg-elevated)',
                        border: `1.5px solid ${selected ? 'var(--green)' : 'var(--border)'}`,
                        color: selected ? 'var(--green)' : 'var(--ink-muted)',
                      }}
                    >
                      {t(`interest_${interest}`)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 mb-6 animate-fade-up" style={{ animationDelay: '0.22s', background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 12 }}>
            {t('appSettings')}
          </p>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ink)' }}>{t('theme')}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: 2 }}>
                {darkMode ? t('dark') : t('light')}
              </p>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'light', label: t('light'), value: false },
                { id: 'dark', label: t('dark'), value: true },
              ].map(option => {
                const selected = darkMode === option.value
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setThemeDark(option.value)}
                    className="rounded-xl px-3 py-2 text-sm font-bold transition-all active:scale-[0.98]"
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
          <div className="flex items-center justify-between gap-3" style={{ paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ink)' }}>{t('textSize')}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: 2 }}>
                {textSize === 'large' ? t('large') : t('normal')}
              </p>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'normal', label: t('normal') },
                { id: 'large', label: t('large') },
              ].map(option => {
                const selected = textSize === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTextSize(option.id)}
                    className="rounded-xl px-3 py-2 text-sm font-bold transition-all active:scale-[0.98]"
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
        </div>

        {/* Logout */}
        <div className="flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: '0.24s' }}>
          <button
            onClick={() => navigateTo('today')}
            className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-80 active:scale-[0.98]"
            style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--border)', color: 'var(--ink)' }}
          >
            {t('backToToday')}
          </button>
          <button
            onClick={resetLocalProgress}
            className="px-5 py-3 rounded-2xl font-semibold text-sm transition-all hover:opacity-80 active:scale-[0.98]"
            style={{ background: 'var(--yellow-soft)', border: '1.5px solid var(--yellow)', color: 'var(--ink)', cursor: 'pointer' }}
          >
            {t('resetProgress')}
          </button>
          <button
            onClick={logoutMock}
            className="px-5 py-3 rounded-2xl font-semibold text-sm transition-all hover:opacity-80 active:scale-[0.98]"
            style={{ background: 'none', border: '1.5px solid var(--coral)', color: 'var(--coral)', cursor: 'pointer' }}
          >
            {t('signOut')}
          </button>
        </div>

      </div>
    </div>
  )
}
