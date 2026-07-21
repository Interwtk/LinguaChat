import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { EpisodeShell } from '../episode/EpisodeShell'
import { getEpisode } from '../../learning/episodes/index.js'
import { evaluateEpisodeResponse } from '../../learning/engine/hybridEvaluation.js'
import { evaluateFree, shouldEscalate } from '../../learning/engine/responseEvaluation.js'
import { createSubmissionGuard } from '../../learning/engine/submitGuard.js'
import { partnerFor, placeFor } from '../../learning/engine/variation.js'
import { evaluateLearningResponse } from '../../services/api'
import { currentBlock, sessionProgress } from '../../learning/engine/session.js'
import {
  loadLearnerModel, saveLearnerModel, recordItemAttempt, markRecurringError,
} from '../../learning/engine/learnerModel.js'

const En = ({ children, style }) => <span lang="en" dir="ltr" style={style}>{children}</span>

// The English model answer for a short practice block, by intent.
const MODEL_ANSWER = {
  introduction: (v) => `Hi, I'm ${v.name}.`,
  ask_name: () => "What's your name?",
  nice_to_meet: () => 'Nice to meet you.',
  ask_wellbeing: () => 'How are you?',
  answer_wellbeing: () => "I'm good.",
  reciprocal_question: () => 'And you?',
  ask_origin: () => 'Where are you from?',
  answer_origin: (v) => `I'm from ${v.place || v.partnerPlace}.`,
  full_intro_conversation: (v) => `Hi, I'm ${v.name}. How are you?`,
}
// What Lingua says to open the practice turn, so the reply has a real context.
const PROMPT = {
  introduction: () => 'Hi there!',
  ask_name: () => "I'm ready when you are.",
  nice_to_meet: () => 'Nice to meet you!',
  ask_wellbeing: (v) => `Hi! I'm ${v.partner}.`,
  answer_wellbeing: () => 'How are you?',
  reciprocal_question: () => "I'm good, thanks.",
  ask_origin: (v) => `I'm from ${v.partnerPlace}.`,
  answer_origin: () => 'Where are you from?',
  full_intro_conversation: () => 'Hi there!',
}

/*
 * A short practice turn used by review / targeted-retry / recall blocks. It
 * reuses the same hybrid evaluator as the episodes — there is no second
 * evaluation path — but stays to a single turn so a session never turns into a
 * list of corrections.
 */
function PracticeTurn({ block, onDone }) {
  const { t, profile, nativeLanguageInfo, interfaceLanguageInfo } = useApp()
  const kind = block.objective || 'introduction'
  const name = (profile.name || '').trim() || 'Alex'
  const partner = useMemo(() => partnerFor(profile.name || 'guest'), [profile.name])
  const modelRef = useRef(loadLearnerModel())
  const vars = {
    name, partner,
    partnerPlace: placeFor(partner),
    place: modelRef.current.facts?.place || '',
  }
  const nativeLang = nativeLanguageInfo.base

  const [reply, setReply] = useState('')
  const [retry, setRetry] = useState(null)
  const [praise, setPraise] = useState(null)
  const [reviewing, setReviewing] = useState(false)
  const [live, setLive] = useState('')
  const guardRef = useRef(createSubmissionGuard())
  const abortRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => () => {
    guardRef.current.invalidate()
    try { abortRef.current?.abort() } catch { /* noop */ }
  }, [])

  const modelAnswer = (MODEL_ANSWER[kind] || MODEL_ANSWER.introduction)(vars)
  const linguaSaid = (PROMPT[kind] || PROMPT.introduction)(vars)

  async function submit({ fromSuggestion = false } = {}) {
    const text = reply
    if (!text.trim()) return
    const token = guardRef.current.begin()
    if (token === null) return
    const turnContext = { linguaSaid }
    const preview = evaluateFree(kind, text, { name, independent: !fromSuggestion, turnContext, place: vars.place })
    const controller = new AbortController()
    abortRef.current = controller
    if (shouldEscalate(preview)) { setReviewing(true); setLive(t('epEvaluating')) }

    let result
    try {
      result = await evaluateEpisodeResponse({
        episode: null, step: { evalKind: kind, itemIds: block.payload?.itemId ? [block.payload.itemId] : [] },
        learnerResponse: text, learnerName: name, place: vars.place,
        nativeLanguage: nativeLang, interfaceLanguage: interfaceLanguageInfo?.base || nativeLang,
        targetLanguage: 'en', scaffoldLevel: 'medium', assistanceUsed: fromSuggestion,
        previousAttempts: 0, turnContext, signal: controller.signal,
        remote: (payload, signal) => evaluateLearningResponse(payload, { signal }),
      })
    } catch {
      result = { ...preview, source: 'fallback' }
    }
    if (!guardRef.current.isCurrent(token)) return
    guardRef.current.settle()
    abortRef.current = null
    setReviewing(false)

    const itemId = block.payload?.itemId
    if (result.completedObjective) {
      if (itemId) recordItemAttempt(modelRef.current, itemId, { correct: true, independent: !fromSuggestion })
      saveLearnerModel(modelRef.current)
      setPraise(result.praiseKey || 'ep1FeedbackGood')
      setLive(t(result.praiseKey || 'ep1FeedbackGood'))
      setTimeout(() => onDone(), 700)
    } else {
      if (itemId) recordItemAttempt(modelRef.current, itemId, { correct: false, independent: false })
      markRecurringError(modelRef.current, result.errorType)
      saveLearnerModel(modelRef.current)
      setRetry({ explainKey: result.explanation, natural: result.naturalVersion, promptKey: result.retryPrompt })
      setLive(t('ep1RetryTitle'))
      setTimeout(() => { try { inputRef.current?.focus() } catch { /* noop */ } }, 40)
    }
  }

  const titleKey = block.type === 'targeted_retry' ? 'sessionRetryTitle'
    : block.type === 'recall' ? 'sessionRecallTitle' : 'sessionReviewTitle'

  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-2 mb-3">
        <ChattoMascot mood="supportive" size={38} intensity="support" decorative />
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--violet)' }}>{t('sessionBlockBadge')}</p>
          <p lang={nativeLang} style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ink)' }}>{t(titleKey)}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-3">
        <LinguaAvatar size={32} online className="mt-0.5" />
        <div className="bubble-lingua"><En style={{ fontWeight: 700 }}>{linguaSaid}</En></div>
      </div>
      <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginBottom: 10 }}>{t('sessionTurnInstruction')}</p>

      {retry && (
        <div role="status" className="rounded-2xl p-4 mb-3 animate-scale-in" style={{ background: 'var(--coral-soft)', border: '1px solid var(--coral)' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>{t('ep1RetryTitle')}</p>
          {retry.explainKey && <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5, marginBottom: 6 }}>{t(retry.explainKey)}</p>}
          {retry.natural && <En style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>{retry.natural}</En>}
          {retry.promptKey && <p lang={nativeLang} style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 6 }}>{t(retry.promptKey)}</p>}
        </div>
      )}

      {!reviewing && (
        <button type="button" onClick={() => { setReply(modelAnswer) }} className="rounded-full px-3.5 py-1.5 text-xs font-bold mb-3 transition-all active:scale-[0.98]"
          style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', color: 'var(--ink)' }}>
          {t('ep1UseSuggestion')}: <En>{modelAnswer}</En>
        </button>
      )}

      {reviewing && (
        <div role="status" aria-live="polite" className="flex items-center gap-2 mb-3 animate-fade-up">
          <LinguaAvatar size={26} online />
          <span lang={nativeLang} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--violet)' }}>{t('epEvaluating')}</span>
        </div>
      )}

      <p aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{live}</p>

      <div className="flex items-end gap-2 rounded-2xl p-2.5" aria-busy={reviewing} style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', opacity: reviewing ? 0.7 : 1 }}>
        <input ref={inputRef} value={reply} onChange={e => setReply(e.target.value)} disabled={reviewing} lang="en" dir="ltr"
          onKeyDown={e => { if (e.key === 'Enter' && reply.trim() && !reviewing) submit({ fromSuggestion: reply === modelAnswer }) }}
          placeholder={t('ep1TypeReply')} aria-label={t('sessionTurnInstruction')} className="chat-input flex-1 bg-transparent text-sm"
          style={{ color: 'var(--ink)', border: 'none', outline: 'none', padding: '7px 4px' }} />
        <button onClick={() => submit({ fromSuggestion: reply === modelAnswer })} disabled={!reply.trim() || reviewing}
          className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: reply.trim() && !reviewing ? 'var(--blue)' : 'var(--border)' }}>{t('ep1Send')}</button>
      </div>
      {praise && <p role="status" lang={nativeLang} className="mt-2" style={{ fontSize: '0.8125rem', color: 'var(--green)', fontWeight: 700 }}>{t(praise)}</p>}

      <button type="button" onClick={() => onDone()} className="mt-4 w-full py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>{t('sessionSkipBlock')}</button>
    </div>
  )
}

function SessionCompletion({ session, onFinish }) {
  const { t, nativeLanguageInfo } = useApp()
  const nativeLang = nativeLanguageInfo.base
  const doneRef = useRef(false)
  const { total } = sessionProgress(session)
  return (
    <div className="animate-scale-in rounded-3xl p-6 text-center" style={{ background: 'var(--bg-paper)', border: '1px solid var(--green)', boxShadow: '0 0 0 3px var(--green-soft)' }}>
      <div className="flex justify-center"><ChattoMascot mood="celebrating" size="medium" variant="green" intensity="celebrate" /></div>
      <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--green)', marginTop: 12 }}>{t('sessionDoneBadge')}</p>
      <h2 lang={nativeLang} style={{ fontWeight: 800, fontSize: '1.1875rem', color: 'var(--ink)', margin: '6px 0 8px' }}>{t('sessionDoneTitle')}</h2>
      <p lang={nativeLang} style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 8 }}>{t('sessionDoneBody')}</p>
      <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--violet)', fontWeight: 700, marginBottom: 18 }}>{t('sessionDoneNext')}</p>
      <div className="rounded-2xl px-4 py-2 mb-5 inline-flex items-center gap-2" style={{ background: 'var(--green-soft)', border: '1px solid var(--green)' }}>
        <span style={{ fontSize: 15 }}>✓</span>
        <span lang={nativeLang} style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)' }}>{t('sessionDoneCount', { count: total })}</span>
      </div>
      <button onClick={() => { if (doneRef.current) return; doneRef.current = true; onFinish() }}
        className="cta-glow w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:-translate-y-px active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, var(--green), var(--blue))', '--cta-ring': 'rgba(63,174,117,0.2)' }}>{t('sessionDoneCta')}</button>
    </div>
  )
}

export function SessionRunner() {
  const { t, dailySession, advanceSession, finishSession, exitSession, setView, nativeLanguageInfo } = useApp()
  const nativeLang = nativeLanguageInfo.base
  const block = currentBlock(dailySession)
  const { done, total } = sessionProgress(dailySession)

  if (!dailySession || !block) return null

  const header = (
    <div className="rounded-2xl px-4 py-3 mb-5 flex items-center justify-between gap-3" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--violet)' }}>{t('sessionBadge')}</p>
        <p lang={nativeLang} style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t('sessionStepOf', { done: Math.min(done + 1, total), total })}
        </p>
      </div>
      <button type="button" onClick={exitSession} className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.98]"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>{t('sessionPause')}</button>
    </div>
  )

  // Episode blocks reuse the existing shell untouched; the session only decides
  // what happens when the episode finishes.
  if (block.type === 'continue_episode' || block.type === 'start_episode') {
    const ep = getEpisode(block.payload.episodeId)
    if (!ep) { advanceSession(); return null }
    return <EpisodeShell episodeId={ep.id} onComplete={() => advanceSession()} />
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6" style={{ background: 'var(--bg-main)' }}>
      <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
        {header}
        {(block.type === 'review' || block.type === 'targeted_retry' || block.type === 'recall') && (
          <PracticeTurn block={block} onDone={() => advanceSession()} />
        )}
        {block.type === 'free_chat_option' && (
          <div className="animate-fade-up rounded-3xl p-6 text-center" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
            <div className="flex justify-center"><ChattoMascot mood="welcoming" size="medium" intensity="enter" /></div>
            <h2 lang={nativeLang} style={{ fontWeight: 800, fontSize: '1.0625rem', color: 'var(--ink)', marginTop: 12, marginBottom: 8 }}>{t('sessionFreeChatTitle')}</h2>
            <p lang={nativeLang} style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 18 }}>{t('sessionFreeChatBody')}</p>
            <button onClick={() => { advanceSession(); setView('practice') }} className="cta-glow w-full py-3 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, var(--violet), var(--blue))', '--cta-ring': 'rgba(124,92,255,0.18)' }}>{t('sessionFreeChatCta')}</button>
            <button onClick={() => advanceSession()} className="mt-2 w-full py-2.5 rounded-2xl text-sm font-semibold"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>{t('sessionSkipBlock')}</button>
          </div>
        )}
        {block.type === 'session_completion' && (
          <SessionCompletion session={dailySession} onFinish={finishSession} />
        )}
      </div>
    </div>
  )
}

export default SessionRunner
