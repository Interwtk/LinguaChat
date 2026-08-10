import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { MessageBubble, TypingIndicator } from '../chat/MessageBubble'
import { PracticeToolbar } from '../chat/PracticeToolbar'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { CompletedEpisodes } from '../episode/CompletedEpisodes'
import { lazyScreen } from '../ui/LazyBoundary'
import { PRE_A1, episodesOfLevel } from '../../learning/curriculum/levels.js'
import { SKELETON_BY_ID } from '../../learning/curriculum/preA1Skeleton.generated.js'
import { planDay } from '../../learning/engine/planner.js'
import { loadLearnerModel, getEpisodeState } from '../../learning/engine/learnerModel.js'
import { selectLearnerFact } from '../../learning/engine/learnerFacts.js'
import { loadMemoryContext, dismissFact } from '../../learning/engine/memoryContext.js'
import { asSubjectValue } from '../../learning/engine/semanticContext.js'

/*
 * The episodes this screen may talk about, as structure only.
 *
 * The practice screen used to import the episode definitions to name the
 * suggested episode and to hand the planner a list — and, because the import was
 * static, entering the practice list downloaded the whole level's prose before
 * the learner had asked to practise anything. Everything the list shows (title,
 * goal, duration, capability, arc, completion) is in the generated skeleton.
 */
const ARC = episodesOfLevel(PRE_A1)

/*
 * The two surfaces that genuinely need the content are loaded when they mount,
 * through the same boundary every other screen uses: a learner who opens the
 * practice list and stays there never fetches an episode, and one who starts,
 * resumes or replays gets a loading state and a real retry if the chunk fails.
 */
const EpisodePlayer = lazyScreen(() => import('../episode/EpisodeShell'), m => m.EpisodeShell)
const SessionPlayer = lazyScreen(() => import('../session/SessionRunner'), m => m.SessionRunner)

/*
 * `focusMode` / `onToggleFocusMode` come from the shell, which owns which panels
 * exist; this screen only offers the switch and draws the way out. `onOpenNotes`
 * is the phone's route to Lingua's notes, which on a laptop are already a panel.
 */
export function ConversationRoom({ focusMode = false, onToggleFocusMode, onOpenNotes }) {
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
    episodeActiveId,
    episodeRunOptions,
    episodeArcVersion,
    startEpisode,
    sessionActive,
    dailySession,
    beginSession,
    nativeLanguageInfo,
    useAnotherConversationTopic,
  } = useApp()
  const [input, setInput] = useState('')
  const [sparkOpen, setSparkOpen] = useState(false)
  /*
   * "Use another topic" is remembered for the day, not for the mount: walking
   * to Home and back used to bring the same suggestion straight back. Nothing
   * is deleted — the next fact is offered instead, and with none left there is
   * simply no suggestion.
   */
  const [memoryContext, setMemoryContext] = useState(() => loadMemoryContext())
  const rememberedFact = useMemo(
    () => (memoryContext.neutralRequested ? null : selectLearnerFact(loadLearnerModel(), {
      // never open with "you said you like tired"
      accept: (f) => Boolean(asSubjectValue(f.value)),
      type: 'like',
      seed: `chat:${episodeArcVersion}`,
      dismissedIds: memoryContext.dismissedFactIds,
    })),
    [episodeArcVersion, memoryContext],
  )
  /*
   * One button, both kinds of subject.
   *
   * "Another topic" used to mean only "not that thing you remembered about me".
   * Now that a conversation also has a chosen interest, declining applies to both
   * — otherwise the learner waves away the suggestion and Lingua opens with the
   * same interest anyway. Neither the fact nor the interest is deleted: both are
   * set aside for the day.
   */
  const useAnotherTopic = useCallback(() => {
    setMemoryContext(dismissFact(rememberedFact))
    useAnotherConversationTopic()
  }, [rememberedFact, useAnotherConversationTopic])
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

  // An active daily session drives the practice area; it renders episodes through
  // the same EpisodeShell, so there is never a second episode instance.
  // the labels the content boundary needs, in the learner's own language
  const playerLabels = {
    loadingLabel: t('screenLoading'),
    errorLabel: t('screenLoadFailed'),
    retryLabel: t('screenLoadRetry'),
  }

  if (sessionActive && dailySession) {
    return (
      <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
        <SessionPlayer {...playerLabels} />
      </div>
    )
  }

  // Guided LinguaLoop episode takes over the practice area; free chat is preserved.
  if (episodeActiveId) {
    return (
      <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
        <EpisodePlayer {...playerLabels} episodeId={episodeActiveId} runOptions={episodeRunOptions} />
      </div>
    )
  }

  // Deterministic planner picks what to offer (re-read on arc changes).
  const plan = planDay(loadLearnerModel(), ARC)
  const suggestedEpisode = plan.episodeId ? SKELETON_BY_ID[plan.episodeId] || null : null

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      {/* The conversation header: who you are talking to, and how to get out. */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center justify-between" style={practiceInnerStyle}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t('openPath')}
            className="lg:hidden flex items-center justify-center rounded-xl transition-colors"
            style={{ width: 38, height: 38, background: 'var(--surface-sunk)', border: '1px solid var(--border)', color: 'var(--muted)' }}
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
              style={{ background: 'var(--surface-sunk)', border: '1px solid var(--border)', color: 'var(--muted)', marginBottom: 5 }}
            >
              <span aria-hidden="true">←</span> {t('backToToday')}
            </button>
            <p className="font-display" style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>
              {t('conversationWithLingua')}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="inline-block rounded-full"
                style={{ width: 6, height: 6, background: 'var(--positive)' }} aria-hidden="true" />
              <p style={{ fontSize: 11.5, color: 'var(--positive-deep)', fontWeight: 600 }}>
                {isTyping ? t('writing') : t('listening')}
              </p>
            </div>
          </div>
        </div>

        {/*
          * The tools that belong to a conversation: put the room away to
          * concentrate, or open the notes. Both are labelled; neither is an
          * ambiguous icon on its own.
          */}
        <div className="flex items-center gap-2">
          {onOpenNotes && (
            <button type="button" className="tool-chip lg:hidden" onClick={onOpenNotes}>
              {t('notes')}
            </button>
          )}
          {onToggleFocusMode && (
            <button
              type="button"
              className="tool-chip"
              onClick={onToggleFocusMode}
              aria-pressed={focusMode}
              style={focusMode
                ? { background: 'var(--accent-soft)', color: 'var(--accent-strong)', borderColor: 'var(--accent-tint)' }
                : undefined}
            >
              {focusMode ? t('exitFocusMode') : t('focusMode')}
            </button>
          )}
          <LinguaAvatar size={34} online />
        </div>
        </div>
      </div>

      {connectionNotice && (
        <div className="mt-3 px-3.5 py-2.5 rounded-xl animate-fade-up"
          role="status"
          style={{
            ...practicePanelStyle,
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent-tint)',
            color: 'var(--text)',
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
            background: 'var(--positive-soft)',
            border: '1px solid var(--positive)',
            color: 'var(--text)',
            fontSize: '0.8125rem',
            lineHeight: 1.45,
          }}>
          {memoryNotice}
        </div>
      )}

      {activeMissionDetails && (
        <div className="mt-3 rounded-2xl px-3.5 py-3 animate-fade-up"
          style={{ ...practicePanelStyle, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between gap-3">
            <div style={{ minWidth: 0, flex: 1 }}>
              <p className="eyebrow">{t('activeMission')}</p>
              <p style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeMissionDetails.mission.titleKey ? t(activeMissionDetails.mission.titleKey) : activeMissionDetails.mission.title} · {t('missionStep')} {activeMissionDetails.currentStepNumber} {t('of')} {activeMissionDetails.totalSteps}
              </p>
            </div>
            <button
              type="button"
              onClick={abandonMission}
              className="tool-chip"
            >
              {t('exitMission')}
            </button>
          </div>
          <div style={{ height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden', marginTop: 9 }}>
            <div className="xp-bar-fill" style={{ width: `${activeMissionDetails.progressPercent}%`, height: '100%', background: 'var(--accent)' }} />
          </div>
        </div>
      )}

      {missionCelebration && !activeMissionDetails && (
        <div className="mt-3 rounded-2xl px-3.5 py-3 animate-scale-in flex items-center gap-3"
          style={{ ...practicePanelStyle, background: 'var(--positive-soft)', border: '1px solid var(--positive)' }}>
          <ChattoMascot mood="celebrating" size={54} variant="green" />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--ink)' }}>{t('missionComplete')}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              {missionCelebration.message} +{missionCelebration.xp} XP.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div style={practiceInnerStyle}>
          {!activeMissionDetails && suggestedEpisode && (
            <div className="rounded-2xl p-4 mb-5 flex items-center gap-3 animate-fade-up"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
              <ChattoMascot mood="happy" size={42} decorative intensity="ambient" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="eyebrow">
                  {t('ep1EpisodeBadge')}{plan.hasReview ? ` · ${t('planReviewTag')}` : ''}
                </p>
                <p className="font-display" style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.25, marginTop: 2 }}>{t(suggestedEpisode.titleKey)}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.4, marginTop: 2 }}>{t(suggestedEpisode.goalKey)}</p>
              </div>
              <button type="button" onClick={() => startEpisode(suggestedEpisode.id)} className="btn-primary flex-shrink-0"
                style={{ minHeight: 42, padding: '10px 16px', fontSize: '0.875rem' }}>
                {plan.type === 'continue_episode' ? t('ep1ContinuePrefix') : t('ep1StartCta')}
              </button>
            </div>
          )}
          {/*
            * An offer, not an assumption. Lingua may bring back something the
            * learner said, once, as a suggestion they can ignore or wave away —
            * saying "another topic" never deletes the memory, it just keeps it
            * out of this conversation.
            */}
          {!activeMissionDetails && rememberedFact && (
            <div className="rounded-2xl p-3.5 mb-5 flex items-start gap-3 animate-fade-up"
              style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)' }}>
              <LinguaAvatar size={30} online className="mt-0.5" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.8125rem', color: 'var(--ink)', lineHeight: 1.5 }}>
                  {t('memoryRememberedLike', { topic: rememberedFact.value })}
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button type="button" onClick={() => usePrompt(`Let's talk about ${rememberedFact.value}.`)}
                    className="tool-chip"
                    style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-tint)', color: 'var(--accent-strong)' }}>
                    <span lang={nativeLanguageInfo.base}>{t('memoryUseTopic')}</span>
                  </button>
                  <button type="button" onClick={useAnotherTopic} className="tool-chip">
                    <span lang={nativeLanguageInfo.base}>{t('memoryUseAnotherTopic')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          {!activeMissionDetails && <CompletedEpisodes />}
          {messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              /* the learner's own line, so a correction can quote it */
              previousUserText={messages.slice(0, index).reverse().find(m => m.role === 'user')?.text || null}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {sparkOpen && (
        <div className="px-4 md:px-6 pb-2 animate-fade-up">
          <div className="rounded-2xl p-3 flex flex-wrap gap-2"
            style={{ ...practiceInnerStyle, background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="eyebrow" style={{ width: '100%', marginBottom: 4 }}>{t('quickPrompts')}</p>
            {quickPrompts.map(p => (
              <button key={p.label} type="button" className="tool-chip" onClick={() => usePrompt(p.text)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/*
        * THE COMPOSER. Four labelled tools sit above the input where the learner is
        * already looking, and the input itself is one plain field with one send
        * button. The microphone that used to live here was permanently disabled
        * with an English-only tooltip — an affordance for a feature that does not
        * exist — so it is gone until voice actually is one.
        */}
      <div className="px-4 md:px-6 pt-2.5 pb-3 flex-shrink-0"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={practiceInnerStyle}>
          <div className="flex items-center gap-2 mb-2">
            <PracticeToolbar t={t} onUsePrompt={usePrompt} />
            <button
              type="button"
              onClick={() => setSparkOpen(o => !o)}
              aria-expanded={sparkOpen}
              aria-label={t('quickPrompts')}
              className="flex-shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: 34, height: 34,
                background: sparkOpen ? 'var(--accent-soft)' : 'var(--surface-sunk)',
                border: `1px solid ${sparkOpen ? 'var(--accent-tint)' : 'var(--border)'}`,
                color: sparkOpen ? 'var(--accent-strong)' : 'var(--muted)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          <div className="flex items-end gap-2.5 rounded-2xl p-2.5"
            style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={activeMissionDetails ? t('missionInputPlaceholder') : t('inputPlaceholder')}
              rows={1}
              /* the learner writes English here, whatever direction the app runs in */
              lang="en"
              dir="ltr"
              aria-label={t('inputPlaceholder')}
              className="chat-input flex-1 resize-none bg-transparent text-sm"
              style={{
                color: 'var(--text)', lineHeight: 1.5, maxHeight: 120,
                border: 'none', outline: 'none', padding: '8px 4px',
                fontFamily: 'inherit',
              }}
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              aria-label={t('send')}
              className="flex-shrink-0 flex items-center justify-center rounded-xl transition-colors"
              style={{
                width: 40, height: 40,
                background: canSend ? 'var(--accent)' : 'var(--surface-sunk)',
                color: canSend ? '#FFF8F4' : 'var(--muted)',
                cursor: canSend ? 'pointer' : 'not-allowed',
                border: canSend ? 'none' : '1px solid var(--border)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          <p style={{ fontSize: 11.5, color: 'var(--muted)', textAlign: 'center', marginTop: 7 }}>
            {activeMissionDetails ? t('missionInputHint') : t('inputHint')}
          </p>
        </div>
      </div>
    </div>
  )
}
