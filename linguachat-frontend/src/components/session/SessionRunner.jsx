import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { EpisodeShell, scrambleTokens } from '../episode/EpisodeShell'
import { FormatFeedback } from '../episode/FormatFeedback'
import { getEpisode } from '../../learning/episodes/index.js'
import { evaluateEpisodeResponse } from '../../learning/engine/hybridEvaluation.js'
import { evaluateFree, shouldEscalate } from '../../learning/engine/responseEvaluation.js'
import { createSubmissionGuard } from '../../learning/engine/submitGuard.js'
import { partnerFor, placeFor } from '../../learning/engine/variation.js'
import { getInterestContext } from '../../learning/engine/interests.js'
import { evaluateLearningResponse } from '../../services/api'
import { currentBlock, sessionProgress, dayKeyFor } from '../../learning/engine/session.js'
import {
  loadLearnerModel, saveLearnerModel, recordItemAttempt, markRecurringError, recordActivitySignalOnce,
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
  // third arc — without these a session block would ask for a preference and
  // then evaluate the answer as an introduction
  express_like: (v) => `I like ${v.noun}.`,
  express_dislike: () => "I don't like coffee.",
  ask_preference: () => 'What do you like?',
  yes_no_preference: () => 'Yes, I do.',
  express_want: () => 'I want water.',
  express_need: () => 'I need help.',
  ask_want: () => 'Do you want water?',
  accept_offer: () => 'Yes, please.',
  decline_offer: () => 'No, thank you.',
  simple_plan_conversation: (v) => `I like ${v.noun}. Do you want to ${v.activity}?`,
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
  express_like: () => 'Tell me something you like.',
  express_dislike: () => 'And something you don’t like?',
  ask_preference: () => 'There is a lot I enjoy.',
  yes_no_preference: (v) => `Do you like ${v.noun}?`,
  express_want: () => 'What do you want right now?',
  express_need: () => 'Tell me what you need today.',
  ask_want: () => 'I have water and coffee here.',
  accept_offer: () => 'Do you want some water?',
  decline_offer: () => 'Do you want coffee too?',
  simple_plan_conversation: () => 'Hi! What do you like?',
}

/*
 * A short practice turn used by review / targeted-retry / recall / extra blocks.
 *
 * The block carries a FORMAT chosen by the planner, and the format genuinely
 * changes the activity: the same objective can be practised by writing the
 * sentence, by arranging its words, by filling a gap, or by choosing the
 * natural reply. It always ends in the same hybrid evaluator — there is no
 * second evaluation path — and formats that give the answer away are recorded
 * as assisted, so variety can never manufacture mastery.
 */
function blankOf(sentence) {
  const words = sentence.replace(/([.?!])$/, ' $1').split(/\s+/).filter(Boolean)
  const idx = Math.max(0, words.findIndex((w, i) => i > 0 && /^[a-z']+$/i.test(w) && w.length > 2))
  return {
    before: words.slice(0, idx).join(' '),
    answer: words[idx] || '',
    after: words.slice(idx + 1).join(' '),
  }
}

function PracticeTurn({ block, topic = null, onDone }) {
  const { t, profile, nativeLanguageInfo, interfaceLanguageInfo } = useApp()
  const kind = block.objective || 'introduction'
  const format = block.format || 'free_reply'
  const name = (profile.name || '').trim() || 'Alex'
  const partner = useMemo(() => partnerFor(profile.name || 'guest'), [profile.name])
  const modelRef = useRef(loadLearnerModel())
  // The session's own subject matter, so a practice turn talks about the same
  // thing Home promised this morning.
  const ctx = useMemo(() => getInterestContext(topic?.interestId ? [topic.interestId] : [], `session:${topic?.interestId || ''}`), [topic])
  const vars = {
    name, partner,
    partnerPlace: placeFor(partner),
    place: modelRef.current.facts?.place || '',
    noun: ctx.targetNoun,
    activity: ctx.activity,
  }
  const nativeLang = nativeLanguageInfo.base

  const [reply, setReply] = useState('')
  const [retry, setRetry] = useState(null)
  const [praise, setPraise] = useState(null)
  const [reviewing, setReviewing] = useState(false)
  const [live, setLive] = useState('')
  const [buildOrder, setBuildOrder] = useState([])
  const [gap, setGap] = useState('')
  const guardRef = useRef(createSubmissionGuard())
  const abortRef = useRef(null)
  const inputRef = useRef(null)
  const doneRef = useRef(false)

  const modelAnswer = (MODEL_ANSWER[kind] || MODEL_ANSWER.introduction)(vars)
  const linguaSaid = (PROMPT[kind] || PROMPT.introduction)(vars)
  const eventId = `${dayKeyFor()}:session:${block.id}`

  // One "shown" per block per day, whatever the UI does in between.
  useEffect(() => {
    if (recordActivitySignalOnce(modelRef.current, `${eventId}:shown`, format, 'shown')) {
      saveLearnerModel(modelRef.current)
    }
  }, [eventId, format])

  useEffect(() => () => {
    guardRef.current.invalidate()
    try { abortRef.current?.abort() } catch { /* noop */ }
  }, [])

  function mark(kindOfSignal, suffix = kindOfSignal) {
    if (recordActivitySignalOnce(modelRef.current, `${eventId}:${suffix}`, format, kindOfSignal)) {
      saveLearnerModel(modelRef.current)
    }
  }

  // Completing the block: recorded once, then the session moves on.
  function complete() {
    if (doneRef.current) return
    doneRef.current = true
    mark('completed')
    onDone()
  }

  /*
   * Leaving a block on purpose is the ONE reliable abandonment signal we have.
   * Reloads, breakpoints, network errors and navigation are not abandonment and
   * are never recorded as such.
   */
  function leaveOnPurpose() {
    if (doneRef.current) return
    doneRef.current = true
    mark('abandoned')
    onDone()
  }

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
      if (retry) mark('retried')
      setPraise(result.praiseKey || 'ep1FeedbackGood')
      setLive(t(result.praiseKey || 'ep1FeedbackGood'))
      setTimeout(complete, 700)
    } else {
      if (itemId) recordItemAttempt(modelRef.current, itemId, { correct: false, independent: false })
      markRecurringError(modelRef.current, result.errorType)
      saveLearnerModel(modelRef.current)
      setRetry({ explainKey: result.explanation, natural: result.naturalVersion, promptKey: result.retryPrompt })
      setLive(t('ep1RetryTitle'))
      setTimeout(() => { try { inputRef.current?.focus() } catch { /* noop */ } }, 40)
    }
  }

  /*
   * A closed activity (arranging words, filling a gap, choosing the natural
   * reply). The model answer is visible in the material itself, so a success is
   * recorded as assisted — never as independent evidence.
   */
  function settleClosed(correct) {
    const itemId = block.payload?.itemId
    if (itemId) recordItemAttempt(modelRef.current, itemId, { correct, independent: false })
    saveLearnerModel(modelRef.current)
    if (correct) { setLive(t('ep1Correct')); setTimeout(complete, 600) }
    else { mark('retried'); setRetry({ explainKey: 'ep1BuildRetry', natural: modelAnswer }); setBuildOrder([]); setLive(t('ep1RetryTitle')) }
  }

  const titleKey = block.type === 'targeted_retry' ? 'sessionRetryTitle'
    : block.type === 'recall' ? 'sessionRecallTitle'
      : block.type === 'extra_practice' ? 'sessionExtraTitle' : 'sessionReviewTitle'

  const isBuildFormat = format === 'word_order' || format === 'guided_reply'
  const isOpenFormat = !isBuildFormat && format !== 'fill_blank' && format !== 'choice'
  // Distractors are other real English replies — wrong here, never nonsense.
  const choiceOptions = [modelAnswer, MODEL_ANSWER.nice_to_meet(vars), MODEL_ANSWER.ask_wellbeing(vars)]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 3)
  // Instruction depends on what the learner is actually being asked to do.
  const howKey = isBuildFormat ? 'sessionBuildInstruction'
    : format === 'fill_blank' ? 'sessionGapInstruction'
      : format === 'choice' ? 'sessionChoiceInstruction' : 'sessionTurnInstruction'

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
      <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginBottom: 10 }}>{t(howKey)}</p>

      {retry && (
        <div role="status" className="rounded-2xl p-4 mb-3 animate-scale-in" style={{ background: 'var(--coral-soft)', border: '1px solid var(--coral)' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>{t('ep1RetryTitle')}</p>
          {retry.explainKey && <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5, marginBottom: 6 }}>{t(retry.explainKey)}</p>}
          {retry.natural && <En style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>{retry.natural}</En>}
          {retry.promptKey && <p lang={nativeLang} style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 6 }}>{t(retry.promptKey)}</p>}
        </div>
      )}

      {!reviewing && isOpenFormat && (
        <button type="button" onClick={() => { setReply(modelAnswer); mark('assistance') }} className="rounded-full px-3.5 py-1.5 text-xs font-bold mb-3 transition-all active:scale-[0.98]"
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

      {isOpenFormat && (
        <div className="flex items-end gap-2 rounded-2xl p-2.5" aria-busy={reviewing} style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', opacity: reviewing ? 0.7 : 1 }}>
          <input ref={inputRef} value={reply} onChange={e => setReply(e.target.value)} disabled={reviewing} lang="en" dir="ltr"
            onKeyDown={e => { if (e.key === 'Enter' && reply.trim() && !reviewing) submit({ fromSuggestion: reply === modelAnswer }) }}
            placeholder={t('ep1TypeReply')} aria-label={t('sessionTurnInstruction')} className="chat-input flex-1 bg-transparent text-sm"
            style={{ color: 'var(--ink)', border: 'none', outline: 'none', padding: '7px 4px' }} />
          <button onClick={() => submit({ fromSuggestion: reply === modelAnswer })} disabled={!reply.trim() || reviewing}
            className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{ background: reply.trim() && !reviewing ? 'var(--blue)' : 'var(--border)' }}>{t('ep1Send')}</button>
        </div>
      )}

      {/* Arrange the words — same sentence, more support. */}
      {isBuildFormat && (() => {
        const tokens = modelAnswer.replace(/([.?!])$/, ' $1').split(/\s+/).filter(Boolean)
        const shown = scrambleTokens(tokens, block.id)
        return (
          <div>
            <div className="rounded-2xl p-3 mb-3 flex items-center flex-wrap gap-2" style={{ minHeight: 52, background: 'var(--bg-elevated)', border: '1.5px solid var(--violet)' }}>
              {buildOrder.length === 0 && <span lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>{t('ep1BuildHint')}</span>}
              {buildOrder.map((tok, i) => (
                <button key={i} onClick={() => setBuildOrder(o => o.filter((_, idx) => idx !== i))} aria-label={`remove ${tok}`}
                  className="rounded-xl px-3 py-1.5 text-sm font-bold" style={{ background: 'var(--violet-soft)', border: '1px solid var(--violet)', color: 'var(--violet)' }}><En>{tok}</En></button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {shown.map((tok, i) => {
                const spent = buildOrder.filter(x => x === tok).length >= tokens.filter(x => x === tok).length
                return (
                  <button key={i} disabled={spent} onClick={() => setBuildOrder(o => [...o, tok])} className="rounded-xl px-3.5 py-2 text-sm font-bold transition-all active:scale-[0.98]"
                    style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--border)', color: 'var(--ink)', opacity: spent ? 0.4 : 1 }}><En>{tok}</En></button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setBuildOrder([])} className="px-4 py-2.5 rounded-2xl text-sm font-semibold" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>{t('ep1Reset')}</button>
              <button disabled={buildOrder.length < tokens.length} onClick={() => settleClosed(buildOrder.join(' ') === tokens.join(' '))}
                className="flex-1 py-2.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]"
                style={{ background: 'var(--violet)', opacity: buildOrder.length < tokens.length ? 0.5 : 1 }}>{t('ep1Check')}</button>
            </div>
          </div>
        )
      })()}

      {/* Fill the gap — the pattern with one word missing. */}
      {format === 'fill_blank' && (() => {
        const { before, answer, after } = blankOf(modelAnswer)
        return (
          <div>
            <div className="flex items-center gap-2 flex-wrap rounded-2xl p-3 mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <En style={{ fontSize: '1rem', fontWeight: 700 }}>{before}</En>
              <input ref={inputRef} value={gap} onChange={e => setGap(e.target.value)} lang="en" dir="ltr" aria-label={t('sessionTurnInstruction')}
                className="chat-input rounded-xl px-3 py-2 text-sm" style={{ flex: 1, minWidth: 110, background: 'var(--bg-paper)', border: '1.5px solid var(--border)', color: 'var(--ink)' }} />
              <En style={{ fontSize: '1rem', fontWeight: 700 }}>{after}</En>
            </div>
            <button disabled={!gap.trim()} onClick={() => settleClosed(gap.trim().toLowerCase().replace(/[.?!,]/g, '') === answer.toLowerCase().replace(/[.?!,]/g, ''))}
              className="w-full py-2.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]"
              style={{ background: 'var(--violet)', opacity: gap.trim() ? 1 : 0.5 }}>{t('ep1Check')}</button>
          </div>
        )
      })()}

      {/* Choose the natural reply. */}
      {format === 'choice' && (
        <div className="flex flex-col gap-2">
          {choiceOptions.map((opt, i) => (
            <button key={i} type="button" onClick={() => settleClosed(opt === modelAnswer)}
              className="rounded-2xl px-4 py-3 text-start transition-all active:scale-[0.99]"
              style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--border)', minHeight: 48 }}>
              <En style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)' }}>{opt}</En>
            </button>
          ))}
        </div>
      )}

      {praise && <p role="status" lang={nativeLang} className="mt-2" style={{ fontSize: '0.8125rem', color: 'var(--green)', fontWeight: 700 }}>{t(praise)}</p>}

      {/* Leaving on purpose — the only reliable "not this one" we accept. */}
      <button type="button" onClick={leaveOnPurpose} className="mt-4 w-full py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>{t('sessionSkipBlock')}</button>
    </div>
  )
}

function SessionCompletion({ session, onFinish }) {
  const { t, nativeLanguageInfo } = useApp()
  const nativeLang = nativeLanguageInfo.base
  const doneRef = useRef(false)
  const { total } = sessionProgress(session)
  // Ask about the format this session actually used most, not a generic one.
  const practisedFormat = (session?.blocks || []).map(b => b.format).filter(Boolean)[0] || null
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
      {/* One optional question about the way today was practised. Never blocks
          the close button, never grants XP. */}
      {practisedFormat && <FormatFeedback format={practisedFormat} momentId={session.id} />}
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
    // The topic was pinned when the plan was made, so the episode talks about
    // exactly what Home promised — even if interests changed in between.
    return <EpisodeShell episodeId={ep.id} interestId={dailySession.topic?.interestId || null} onComplete={() => advanceSession()} />
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6" style={{ background: 'var(--bg-main)' }}>
      <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
        {header}
        {(block.type === 'review' || block.type === 'targeted_retry' || block.type === 'recall' || block.type === 'extra_practice') && (
          <PracticeTurn block={block} topic={dailySession.topic} onDone={() => advanceSession()} />
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
