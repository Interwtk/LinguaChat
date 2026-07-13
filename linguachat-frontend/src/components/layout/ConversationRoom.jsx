import { useState, useRef, useEffect, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { MessageBubble, TypingIndicator } from '../chat/MessageBubble'
import { ChattoMascot } from '../mascot/ChattoMascot'

export function ConversationRoom() {
  const {
    messages,
    sendMessage,
    isTyping,
    profile,
    connectionNotice,
    memoryNotice,
    setMobileSheet,
    navigateTo,
    t,
    activeMissionDetails,
    missionCelebration,
    abandonMission,
  } = useApp()
  const [input, setInput] = useState('')
  const [sparkOpen, setSparkOpen] = useState(false)
  const textareaRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isTyping) return
    sendMessage(text)
    setInput('')
    setSparkOpen(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }, [input, isTyping, sendMessage])

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const usePrompt = useCallback((text) => {
    setInput(text)
    setSparkOpen(false)
    textareaRef.current?.focus()
  }, [])

  const canSend = input.trim().length > 0 && !isTyping
  const practiceInnerStyle = { width: '100%', maxWidth: 980, margin: '0 auto' }
  const practicePanelStyle = { width: 'calc(100% - 2rem)', maxWidth: 980, margin: '0 auto' }
  const quickPrompts = [
    { label: t('correctMe'), text: 'Correct my next sentence and give me one tiny challenge.' },
    { label: t('askMeQuestion'), text: 'Ask me one question for my level.' },
    { label: t('roleplay'), text: 'Start a short cafe roleplay with me.' },
    { label: t('giveOptions'), text: 'Give me two options and ask me to choose the best answer.' },
    { label: t('increaseDifficulty'), text: 'Make the next exercise a little harder.' },
    { label: t('explainSimple'), text: 'Explain the next correction in very simple words.' },
  ]

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-main)' }}>
      <div className="flex items-center justify-between px-4 md:px-6 py-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-paper)' }}>
        <div className="flex items-center justify-between" style={practiceInnerStyle}>
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden flex items-center justify-center rounded-xl transition-colors"
            style={{ width: 34, height: 34, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}
            onClick={() => setMobileSheet('journey')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="15" y2="18" />
            </svg>
          </button>

          <div>
            <button
              type="button"
              onClick={() => navigateTo('today')}
              className="hidden lg:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all active:scale-[0.98]"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)', marginBottom: 5 }}
            >
              <span aria-hidden="true">←</span> {t('backToToday')}
            </button>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              {t('practiceRoom')}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="inline-block rounded-full animate-glow-breathe"
                style={{ width: 6, height: 6, background: 'var(--green)' }} />
              <p style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
                {isTyping ? t('writing') : t('listening')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span style={{
            fontSize: 10, fontWeight: 700, background: 'var(--violet-soft)', color: 'var(--violet)',
            border: '1px solid var(--violet)', padding: '2px 8px', borderRadius: 999,
          }}>
            {profile.level}
          </span>
          <LinguaAvatar size={34} online />
        </div>
        </div>
      </div>

      {connectionNotice && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl animate-fade-up"
          role="status"
          style={{
            ...practicePanelStyle,
            background: 'var(--yellow-soft)',
            border: '1px solid var(--yellow)',
            color: 'var(--ink)',
            fontSize: '0.8125rem',
            lineHeight: 1.45,
          }}>
          {connectionNotice}
        </div>
      )}

      {memoryNotice && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl animate-fade-up"
          role="status"
          style={{
            ...practicePanelStyle,
            background: 'var(--green-soft)',
            border: '1px solid var(--green)',
            color: 'var(--ink)',
            fontSize: '0.8125rem',
            lineHeight: 1.45,
          }}>
          {memoryNotice}
        </div>
      )}

      {activeMissionDetails && (
        <div className="mt-3 rounded-2xl px-3.5 py-3 animate-fade-up"
          style={{ ...practicePanelStyle, background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between gap-3">
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--violet)' }}>
                {t('activeMission')}
              </p>
              <p style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeMissionDetails.mission.titleKey ? t(activeMissionDetails.mission.titleKey) : activeMissionDetails.mission.title} · {t('missionStep')} {activeMissionDetails.currentStepNumber} {t('of')} {activeMissionDetails.totalSteps}
              </p>
            </div>
            <button
              type="button"
              onClick={abandonMission}
              className="rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.98]"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}
            >
              {t('exitMission')}
            </button>
          </div>
          <div style={{ height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden', marginTop: 9 }}>
            <div style={{ width: `${activeMissionDetails.progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--violet), var(--blue))' }} />
          </div>
        </div>
      )}

      {missionCelebration && !activeMissionDetails && (
        <div className="mt-3 rounded-2xl px-3.5 py-3 animate-scale-in flex items-center gap-3"
          style={{ ...practicePanelStyle, background: 'var(--green-soft)', border: '1px solid var(--green)', boxShadow: '0 12px 30px -16px rgba(63,174,117,0.5)' }}>
          <ChattoMascot mood="celebrating" size={54} variant="green" />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--ink)' }}>{t('missionComplete')}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
              {missionCelebration.message} +{missionCelebration.xp} XP.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div style={practiceInnerStyle}>
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {sparkOpen && (
        <div className="px-4 md:px-6 pb-2 animate-fade-up">
          <div className="rounded-2xl p-3 flex flex-wrap gap-2"
            style={{ ...practiceInnerStyle, background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
            <p style={{ width: '100%', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 4 }}>
              {t('quickPrompts')}
            </p>
            {quickPrompts.map(p => (
              <button
                key={p.label}
                onClick={() => usePrompt(p.text)}
                className="transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  fontSize: '0.8125rem', fontWeight: 600,
                  background: 'var(--bg-elevated)', border: '1.5px solid var(--border)',
                  color: 'var(--ink)', padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 md:px-6 py-4 flex-shrink-0"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-paper)' }}>
        <div className="flex items-end gap-2.5 rounded-2xl p-2.5"
          style={{ ...practiceInnerStyle, background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', transition: 'border-color 0.2s' }}>
          <button
            onClick={() => setSparkOpen(o => !o)}
            title={t('quickPrompts')}
            className="flex-shrink-0 flex items-center justify-center rounded-xl transition-all hover:scale-105 active:scale-95"
            style={{
              width: 36, height: 36,
              background: sparkOpen ? 'var(--yellow)' : 'var(--bg-main)',
              border: '1.5px solid var(--border)',
              color: sparkOpen ? '#fff' : 'var(--ink-muted)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={sparkOpen ? '#fff' : 'none'}
              stroke={sparkOpen ? '#fff' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={activeMissionDetails ? t('missionInputPlaceholder') : t('inputPlaceholder')}
            rows={1}
            className="chat-input flex-1 resize-none bg-transparent text-sm"
            style={{
              color: 'var(--ink)', lineHeight: 1.5, maxHeight: 120,
              border: 'none', outline: 'none', padding: '7px 0',
              fontFamily: 'inherit',
            }}
          />

          <button
            disabled
            title="Voice input - coming soon"
            className="flex-shrink-0 flex items-center justify-center rounded-xl"
            style={{ width: 36, height: 36, background: 'var(--bg-main)', border: '1.5px solid var(--border)', color: 'var(--border)', cursor: 'not-allowed', opacity: 0.5 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex-shrink-0 flex items-center justify-center rounded-xl transition-all duration-200"
            style={{
              width: 36, height: 36,
              background: canSend ? 'var(--blue)' : 'var(--border)',
              color: '#fff', cursor: canSend ? 'pointer' : 'not-allowed',
              border: 'none',
              transform: canSend ? 'scale(1)' : 'scale(0.96)',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <p style={{ fontSize: 11, color: 'var(--ink-muted)', textAlign: 'center', marginTop: 8 }}>
          {activeMissionDetails ? t('missionInputHint') : t('inputHint')}
        </p>
      </div>
    </div>
  )
}
