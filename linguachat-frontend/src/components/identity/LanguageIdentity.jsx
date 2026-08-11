import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../../context/AppContext'
import { JourneyRail } from '../layout/JourneyRail'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { getLanguageOption, languageFromInput, searchLanguages } from '../../services/language'
import { TUTOR_OPTION_GROUPS, INTEREST_OPTIONS, MAX_INTERESTS, toggleInterestId } from '../../services/tutorPreferences'

const MOOD_COLORS = [
  /*
   * `id` is a STORED value on the profile, so the ids stay as they are — a
   * rename here would silently reset the choice of every learner who already
   * picked one. What each id paints is a palette token, and none is purple.
   */
  { id: 'violet', label: 'Calm', bg: 'var(--accent)' },
  { id: 'coral', label: 'Energetic', bg: 'var(--accent)' },
  { id: 'green', label: 'Grounded', bg: 'var(--positive)' },
  { id: 'yellow', label: 'Playful', bg: 'var(--accent)' },
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
      <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', marginBottom: 8 }}>
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
                background: selected ? 'var(--accent-soft)' : 'var(--surface-soft)',
                border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                color: selected ? 'var(--accent)' : 'var(--muted)',
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
  const confidence = localProgress.confidence || 0
  const streak = localProgress.streak || 0
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

  /*
   * The same toggle onboarding uses. This copy capped the list at six, so a
   * learner who chose twenty lost fourteen the first time they changed their
   * mind about one — and, like onboarding, it refused to let the list be empty.
   */
  function toggleInterest(interest) {
    updateTutorPreferences({ interests: toggleInterestId(tutorPreferences.interests, interest) })
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8"
      dir={interfaceLanguageInfo.base === 'ar' ? 'rtl' : 'ltr'}
      style={{ background: 'var(--bg)' }}
    >
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 6 }}>
            {t('languageIdentityEyebrow')}
          </p>
          <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', color: 'var(--ink)', lineHeight: 1.1 }}>
            {t('languageIdentityTitle')}
          </h1>
        </div>

        {/* Avatar + identity card */}
        <div className="rounded-3xl p-6 mb-5 animate-fade-up" style={{ animationDelay: '0.04s', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-start gap-5">
            {/* Abstract avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: 24, flexShrink: 0,
              background: currentMood.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              /*
               * One soft shadow from the palette, whichever mood is chosen. This
               * line used to carry four hardcoded rgba values, one of them the
               * purple the product no longer uses.
               */
              boxShadow: 'var(--shadow-md)',
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
                    style={{ background: 'var(--surface-soft)', border: '1px solid var(--accent)', color: 'var(--ink)', fontFamily: 'inherit', fontWeight: 700, flex: 1 }}
                  />
                  <button onClick={saveName}
                    className="px-3 py-1.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'var(--accent)', border: 'none', cursor: 'pointer' }}>
                    {t('save')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h2 style={{ fontWeight: 800, fontSize: '1.375rem', color: 'var(--ink)' }}>{profile.name || t('learner')}</h2>
                  <button onClick={() => setEditingName(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <span style={{
                  fontSize: 10, fontWeight: 700, background: 'var(--accent)',
                  color: '#fff', padding: '2px 9px', borderRadius: 999,
                }}>
                  {profile.level || 'B1'}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                  {profile.email || 'linguachat.user'}
                </span>
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: 8 }}>
                {profile.tutorPersonality || 'Gentle Guide'} style
              </p>
            </div>
          </div>

          {/* Mood color picker */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 10 }}>
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
                    boxShadow: moodColor === m.id ? `0 0 0 3px var(--surface), 0 0 0 5px ${m.id === 'violet' ? 'var(--accent)' : m.id === 'coral' ? 'var(--accent)' : m.id === 'green' ? 'var(--positive)' : 'var(--accent-tint)'}` : 'none',
                    transition: 'all 0.2s',
                  }} />
                  <span style={{ fontSize: 10, color: moodColor === m.id ? 'var(--ink)' : 'var(--muted)', fontWeight: moodColor === m.id ? 700 : 500 }}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 mb-5 animate-fade-up" style={{ animationDelay: '0.06s', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 6 }}>
                {t('nativeLanguageLabel')}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                {t('nativeLanguageDescription')}
              </p>
            </div>
            {languageSaved && (
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--positive)', whiteSpace: 'nowrap' }}>
                {t('saved')}
              </span>
            )}
          </div>
          <div ref={languagePickerRef} style={{ position: 'relative' }}>
            <div className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '1rem', color: 'var(--ink)', fontWeight: 800 }}>
                  {currentLanguage.nativeName}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
                  {currentLanguage.englishName} · {currentLanguage.code}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
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
                style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--accent)', whiteSpace: 'nowrap' }}
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
                  background: 'var(--surface)',
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
                  style={{ width: '100%', background: 'var(--surface-soft)', border: '1px solid var(--border)', color: 'var(--ink)' }}
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
                          background: active ? 'var(--accent-soft)' : 'transparent',
                          border: `1px solid ${active ? 'var(--accent)' : 'transparent'}`,
                          color: 'var(--ink)',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ display: 'block', fontSize: 14, fontWeight: 800 }}>
                          {option.nativeName}
                        </span>
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
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
                    style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)', color: 'var(--muted)' }}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={saveLanguage}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]"
                    style={{ background: 'var(--accent)', border: 'none' }}
                  >
                    {t('save')}
                  </button>
                </div>
              </div>
            , document.body)}
          </div>
        </div>

        {/*
          * YOUR PLAN — the frame's last settings row, and the second way into the
          * plans page (the desktop user block is the first). Neither of them is the
          * old "Explore" menu.
          */}
        <button
          type="button"
          onClick={() => navigateTo('pricing')}
          className="flex items-center justify-between w-full rounded-2xl px-4 mb-5 animate-fade-up text-start"
          style={{
            minHeight: 56, background: 'var(--surface)', border: '1px solid var(--border)',
            animationDelay: '0.05s',
          }}
        >
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>{t('plansTitle')}</span>
          <span className="flex items-center gap-2">
            <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{t('planFree')}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </span>
        </button>

        {/*
          * YOUR PATH — moved here from the global sidebar. The frames put identity,
          * the path, the settings and the plan on one screen; a permanent progress
          * rail beside every other screen was the old interface's navigation.
          */}
        <section className="rounded-2xl overflow-hidden mb-5 animate-fade-up"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '0.06s' }}>
          <JourneyRail embedded />
        </section>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 animate-fade-up" style={{ animationDelay: '0.08s' }}>
          {/*
            * FOUR REAL NUMBERS, in the interface language. There used to be two
            * lists here — the learner's, and a set of example figures shown before
            * they had done anything — with English labels hardcoded in both.
            */}
          {[
            { label: t('dayStreak'), value: streak },
            { label: t('messages'), value: localProgress.messagesSent || 0 },
            { label: t('corrections'), value: localProgress.correctionsReceived || 0 },
            { label: t('words'), value: (localProgress.learnedItems || []).length },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="font-display" style={{ fontWeight: 700, fontSize: '1.375rem', color: 'var(--ink)' }}>{s.value}</p>
              <p style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500, marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Confidence evolution */}
        <div className="rounded-2xl p-5 mb-5 animate-fade-up" style={{ animationDelay: '0.12s', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 16 }}>
            {t('confidenceEvolution')}
          </p>
          <div className="flex items-end gap-2" style={{ height: 80 }}>
            {progressData.map((d, i) => (
              <div key={d.week} className="flex flex-col items-center gap-1.5 flex-1">
                <div style={{
                  width: '100%', borderRadius: '6px 6px 0 0',
                  height: `${(d.score / 100) * 72}px`,
                  background: i === progressData.length - 1
                    ? 'var(--accent)'
                    : 'var(--border)',
                  transition: 'height 0.8s',
                  minHeight: 4,
                }} />
                <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: i === progressData.length - 1 ? 700 : 400 }}>{d.week}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: 12 }}>
            Confidence: <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{confidence}%</span> (+{confidence - 45}% since you started)
          </p>
        </div>

        {/* Lingua relationship */}
        <div className="rounded-2xl p-5 mb-5 animate-fade-up" style={{ animationDelay: '0.16s', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-4">
            <LinguaAvatar size={52} online />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 4 }}>
                {t('withLingua')}
              </p>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>{relationship}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: 2 }}>
                {streak} days practicing together
              </p>
            </div>
            <div style={{
              padding: '6px 14px', borderRadius: 999, flexShrink: 0,
              background: 'var(--positive-soft)', border: '1px solid var(--positive)',
            }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--positive)' }}>{t('active')}</span>
            </div>
          </div>
        </div>

        {/* Topics + preferences */}
        <div className="rounded-2xl p-5 mb-6 animate-fade-up" style={{ animationDelay: '0.20s', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 12 }}>
            {t('practiceIdentity')}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {practicedTopics.map(g => (
              <span key={g} style={{ fontSize: '0.8125rem', fontWeight: 600, padding: '4px 12px', borderRadius: 999, background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                {g}
              </span>
            ))}
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, padding: '4px 12px', borderRadius: 999, background: 'var(--info-soft)', color: 'var(--info)', border: '1px solid var(--info)' }}>
              {profile.preferences?.dailyGoal || profile.dailyGoal || 10} min/day
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.6 }}>
            {t('correctionStyleLabel')}: <strong style={{ color: 'var(--ink)' }}>{profile.preferences?.correctionIntensity || 'Balanced'}</strong>.
            {t('practiceVibeLabel')}: <strong style={{ color: 'var(--ink)' }}>{profile.preferences?.practiceVibe || 'Motivational'}</strong>.
          </p>
        </div>

        <div className="rounded-2xl p-5 mb-6 animate-fade-up" style={{ animationDelay: '0.21s', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 6 }}>
            {t('personalizeTutor')}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 16 }}>
            {t('personalizeTutorDescription')}
          </p>

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
              <div className="flex items-baseline justify-between gap-3" style={{ marginBottom: 4 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)' }}>
                  {t('interests')}
                </p>
                {(tutorPreferences.interests || []).length > 0 && (
                  <p aria-hidden="true" style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
                    {(tutorPreferences.interests || []).length}/{MAX_INTERESTS}
                  </p>
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.45, marginBottom: 10 }}>
                {t('interestsHelp')}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t('interests')}>
                {INTEREST_OPTIONS.map(interest => {
                  const selected = (tutorPreferences.interests || []).includes(interest)
                  return (
                    <button
                      key={interest}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleInterest(interest)}
                      className="rounded-full px-3.5 py-2 text-xs font-bold transition-all active:scale-[0.98] inline-flex items-center gap-1.5"
                      style={{
                        background: selected ? 'var(--positive-soft)' : 'var(--surface-soft)',
                        border: `1px solid ${selected ? 'var(--positive)' : 'var(--border)'}`,
                        color: selected ? 'var(--positive)' : 'var(--muted)',
                        /* the same comfortable target the rest of the product uses;
                         * these chips were 30 px tall, which is a thumb-sized miss */
                        minHeight: 44,
                      }}
                    >
                      {selected && <span aria-hidden="true" style={{ fontSize: '0.85em' }}>✓</span>}
                      {t(`interest_${interest}`)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-5 mb-6 animate-fade-up" style={{ animationDelay: '0.22s', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 12 }}>
            {t('appSettings')}
          </p>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ink)' }}>{t('theme')}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: 2 }}>
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
          <div className="flex items-center justify-between gap-3" style={{ paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ink)' }}>{t('textSize')}</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: 2 }}>
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

        {/* Logout */}
        <div className="flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: '0.24s' }}>
          <button
            onClick={() => navigateTo('today')}
            className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-80 active:scale-[0.98]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}
          >
            {t('backToToday')}
          </button>
          <button
            onClick={resetLocalProgress}
            className="px-5 py-3 rounded-2xl font-semibold text-sm transition-all hover:opacity-80 active:scale-[0.98]"
            style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-tint)', color: 'var(--ink)', cursor: 'pointer' }}
          >
            {t('resetProgress')}
          </button>
          <button
            onClick={logoutMock}
            className="px-5 py-3 rounded-2xl font-semibold text-sm transition-all hover:opacity-80 active:scale-[0.98]"
            style={{ background: 'none', border: '1px solid var(--accent)', color: 'var(--accent)', cursor: 'pointer' }}
          >
            {t('signOut')}
          </button>
        </div>

      </div>
    </div>
  )
}
