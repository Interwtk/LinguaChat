import { useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { SEED_VOCAB_BY_ID } from '../../data/vocabulary'
import { getLocalizedMeaning } from '../../services/learningContent'
import { getEpisode } from '../../learning/episodes/index.js'
import { evaluateFree } from '../../learning/engine/responseEvaluation.js'
import {
  loadLearnerModel, saveLearnerModel, recordItemAttempt, recordCanDoAttempt, markRecurringError,
  getRecommendedScaffold, getEpisodeState, setEpisodeState,
} from '../../learning/engine/learnerModel.js'

const resolve = (str, name) => String(str || '').replace(/\{name\}/g, name)

function En({ children, className = '', style }) {
  return <span lang="en" dir="ltr" className={className} style={style}>{children}</span>
}

function LinguaLine({ children }) {
  return (
    <div className="flex gap-3 mb-3 animate-message-in">
      <LinguaAvatar size={34} online className="mt-0.5" />
      <div className="flex flex-col gap-0.5" style={{ maxWidth: '88%' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--violet)', letterSpacing: '0.04em' }}>Lingua</span>
        <div className="bubble-lingua">{children}</div>
      </div>
    </div>
  )
}

export function EpisodeShell({ episodeId }) {
  const { t, profile, nativeLanguageInfo, interfaceLanguageInfo, exitEpisode, awardEpisode, finishEpisode } = useApp()
  const ep = getEpisode(episodeId)
  const name = (profile.name || '').trim() || 'Alex'
  const nativeLang = nativeLanguageInfo.base
  const meaningOf = (id) => getLocalizedMeaning(SEED_VOCAB_BY_ID[id]?.meaning, nativeLanguageInfo, interfaceLanguageInfo)

  const modelRef = useRef(loadLearnerModel())
  const awardedRef = useRef(false)
  const initial = useMemo(() => {
    if (!ep) return { step: 0, scaffold: 'high' }
    const st = getEpisodeState(modelRef.current, ep.id)
    const savedScaffold = modelRef.current.scaffoldByEpisode[ep.id] || 'high'
    // resume, but never resume onto the completion step for a fresh replay
    const step = Math.min(st.status === 'completed' ? 0 : (st.stepIndex || 0), ep ? ep.steps.length - 1 : 0)
    return { step, scaffold: savedScaffold }
  }, [ep])

  const [stepIndex, setStepIndex] = useState(initial.step)
  const [scaffold, setScaffold] = useState(initial.scaffold)
  const [cleanStreak, setCleanStreak] = useState(0)
  const [showHelp, setShowHelp] = useState(true)
  const [usedSuggestion, setUsedSuggestion] = useState(false)

  const [choice, setChoice] = useState(null)
  const [buildOrder, setBuildOrder] = useState([])
  const [fillValue, setFillValue] = useState('')
  const [reply, setReply] = useState('')
  const [retry, setRetry] = useState(null)     // { explainKey, natural, promptKey }
  const [praise, setPraise] = useState(null)
  const [live, setLive] = useState('')

  if (!ep) return null
  const step = ep.steps[stepIndex]

  function persistStep(nextIndex) {
    setEpisodeState(modelRef.current, ep.id, { status: nextIndex >= ep.steps.length - 1 ? getEpisodeState(modelRef.current, ep.id).status : 'in_progress', stepIndex: nextIndex })
    modelRef.current.scaffoldByEpisode[ep.id] = scaffold
    saveLearnerModel(modelRef.current)
  }

  function advance() {
    setRetry(null); setPraise(null); setLive(''); setChoice(null); setBuildOrder([]); setFillValue(''); setReply(''); setUsedSuggestion(false)
    const next = Math.min(ep.steps.length - 1, stepIndex + 1)
    setStepIndex(next)
    persistStep(next)
    if (scaffold === 'high') setShowHelp(true)
  }

  function adaptScaffold({ correct, usedHelp }) {
    const nextStreak = correct && !usedHelp ? cleanStreak + 1 : 0
    setCleanStreak(nextStreak)
    const next = getRecommendedScaffold(scaffold, { cleanSuccessStreak: nextStreak, justFailed: !correct, usedHelp })
    setScaffold(next)
    modelRef.current.scaffoldByEpisode[ep.id] = next
    if (next === 'high') setShowHelp(true)
  }

  function recordItems(ids, { correct, independent }) {
    (ids || []).forEach(id => recordItemAttempt(modelRef.current, id, { correct, independent }))
    saveLearnerModel(modelRef.current)
  }

  /* ---------- free reply (roleplay / recall) ---------- */
  function submitFree(evalKind, itemIds, { fromSuggestion } = {}) {
    const independent = !fromSuggestion && scaffold !== 'high' && !step.showModelDefault
    const result = evaluateFree(evalKind, reply, { name, independent })
    if (result.completedObjective) {
      recordItems(itemIds, { correct: true, independent })
      adaptScaffold({ correct: true, usedHelp: fromSuggestion || scaffold === 'high' })
      setPraise(result.praiseKey || 'ep1FeedbackGood')
      setLive(t(result.praiseKey || 'ep1FeedbackGood'))
      setTimeout(advance, 700)
    } else {
      recordItems(itemIds, { correct: false, independent: false })
      markRecurringError(modelRef.current, result.errorType)
      saveLearnerModel(modelRef.current)
      adaptScaffold({ correct: false })
      setRetry({ explainKey: result.explanation, natural: resolve(result.naturalVersion, name), promptKey: result.retryPrompt })
      setLive(t('ep1RetryTitle'))
    }
  }

  /* ---------- completion (idempotent award) ---------- */
  function finish() {
    const m = modelRef.current
    const st = getEpisodeState(m, ep.id)
    const independent = cleanStreak >= 1
    recordCanDoAttempt(m, ep.canDoId, { success: true, independent, context: ep.id })
    if (!st.awarded && !awardedRef.current) {
      awardedRef.current = true
      awardEpisode(ep)  // garden + XP, idempotent by awarded flag below
      setEpisodeState(m, ep.id, { status: 'completed', awarded: true, stepIndex: ep.steps.length - 1 })
    } else {
      setEpisodeState(m, ep.id, { status: 'completed', stepIndex: ep.steps.length - 1 })
    }
    saveLearnerModel(m)
    finishEpisode()
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6" style={{ background: 'var(--bg-main)' }}>
      <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
        {/* header */}
        <div className="rounded-2xl px-4 py-3 mb-5 flex items-center justify-between gap-3" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--violet)' }}>{t('ep1EpisodeBadge')}</p>
            <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(ep.titleKey)}</p>
          </div>
          <button type="button" onClick={exitEpisode} className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.98]"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>{t('ep1FreeChatCta')}</button>
        </div>

        {/* progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4" aria-hidden="true">
          {ep.steps.map((_, i) => (
            <span key={i} style={{ width: i === stepIndex ? 16 : 5, height: 5, borderRadius: 999, background: i <= stepIndex ? 'var(--violet)' : 'var(--border)', transition: 'all 0.3s' }} />
          ))}
        </div>

        <p aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{live}</p>

        {/* ---------------- SCENE ---------------- */}
        {step.type === 'scene' && (
          <div className="animate-scale-in rounded-3xl p-6 text-center" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
            <div className="flex justify-center"><ChattoMascot mood={step.mood || 'welcoming'} size="medium" intensity="enter" /></div>
            <h2 style={{ fontWeight: 800, fontSize: '1.1875rem', color: 'var(--ink)', marginTop: 14, marginBottom: 8 }}>{t(step.titleKey)}</h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 8 }}>{t(step.bodyKey)}</p>
            {step.showGoal && <p style={{ fontSize: '0.8125rem', color: 'var(--violet)', fontWeight: 700, marginBottom: 18 }}>{t(ep.goalKey)}</p>}
            <button onClick={advance} className="cta-glow w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:-translate-y-px active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, var(--violet), var(--blue))', '--cta-ring': 'rgba(124,92,255,0.18)' }}>{t(step.ctaKey || 'ep1Continue')}</button>
          </div>
        )}

        {/* ---------------- MODEL ---------------- */}
        {step.type === 'model' && (
          <div>
            <LinguaLine><En style={{ fontWeight: 700 }}>{step.target}</En>{step.response && <> <En style={{ opacity: 0.85 }}>{step.response}</En></>}</LinguaLine>
            {(showHelp || scaffold === 'high') && (
              <div className="rounded-2xl p-4 mb-3 animate-fade-up" style={{ background: 'var(--violet-soft)', border: '1px solid var(--violet)' }}>
                <p lang={nativeLang} style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{(step.meaningItems || []).map(meaningOf).join(' · ')}</p>
                {step.explainKey && <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>{t(step.explainKey)}</p>}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowHelp(h => !h)} className="px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>{showHelp ? t('ep1HideHelp') : t('ep1ShowHelp')}</button>
              <button onClick={advance} className="flex-1 py-2.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]" style={{ background: 'var(--violet)' }}>{t('ep1Continue')}</button>
            </div>
          </div>
        )}

        {/* ---------------- COMPREHENSION ---------------- */}
        {step.type === 'comprehension' && (
          <div className="animate-fade-up">
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{t(step.instructionKey)}</p>
            <div className="rounded-2xl p-3 mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}><En style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>{resolve(step.target, name)}</En></div>
            <div className="flex flex-col gap-2">
              {step.options.map((opt, i) => {
                const chosen = choice === i
                const done = choice != null
                return (
                  <button key={i} type="button" lang={nativeLang} aria-pressed={chosen} disabled={done}
                    onClick={() => {
                      setChoice(i)
                      recordItems([step.itemId].filter(Boolean), { correct: Boolean(opt.correct), independent: scaffold !== 'high' })
                      setLive(opt.correct ? t('ep1Correct') : t('ep1KeepGoing'))
                      setTimeout(advance, 850)
                    }}
                    className="rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all active:scale-[0.99]"
                    style={{ background: done && opt.correct ? 'var(--green-soft)' : chosen ? 'var(--yellow-soft)' : 'var(--bg-paper)', border: `1.5px solid ${done && opt.correct ? 'var(--green)' : chosen ? 'var(--yellow)' : 'var(--border)'}`, color: 'var(--ink)' }}>
                    {t(opt.key)}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ---------------- CHOICE (most natural, English options) ---------------- */}
        {step.type === 'choice' && (
          <div className="animate-fade-up">
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{t(step.instructionKey)}</p>
            {step.promptEn && <LinguaLine><En style={{ fontWeight: 700 }}>{resolve(step.promptEn, name)}</En></LinguaLine>}
            <div className="flex flex-col gap-2 mt-2">
              {step.options.map((opt, i) => {
                const chosen = choice === i
                const done = choice != null
                return (
                  <button key={i} type="button" aria-pressed={chosen} disabled={done}
                    onClick={() => {
                      setChoice(i)
                      recordItems([step.itemId].filter(Boolean), { correct: Boolean(opt.correct), independent: scaffold !== 'high' })
                      if (opt.correct) { setLive(t('ep1Correct')); setTimeout(advance, 850) }
                      else { setLive(t('ep1KeepGoing')); setTimeout(() => setChoice(null), 800) }
                    }}
                    className="rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.99]"
                    style={{ background: done && opt.correct ? 'var(--green-soft)' : chosen && !opt.correct ? 'var(--coral-soft)' : 'var(--bg-paper)', border: `1.5px solid ${done && opt.correct ? 'var(--green)' : chosen && !opt.correct ? 'var(--coral)' : 'var(--border)'}` }}>
                    <En style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)' }}>{resolve(opt.textEn, name)}</En>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ---------------- WORD ORDER ---------------- */}
        {step.type === 'word_order' && (() => {
          const tokens = step.tokens.map(tk => resolve(tk, name))
          const remaining = tokens.filter(tok => buildOrder.filter(x => x === tok).length < tokens.filter(x => x === tok).length || !buildOrder.includes(tok))
          return (
            <div className="animate-fade-up">
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>{t(step.instructionKey)}</p>
              <div className="rounded-2xl p-3 mb-3 flex items-center flex-wrap gap-2" style={{ minHeight: 52, background: 'var(--bg-elevated)', border: '1.5px solid var(--violet)' }}>
                {buildOrder.length === 0 && <span lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>{t(step.hintKey)}</span>}
                {buildOrder.map((tok, i) => (
                  <button key={i} onClick={() => setBuildOrder(o => o.filter((_, idx) => idx !== i))} className="rounded-xl px-3 py-1.5 text-sm font-bold" style={{ background: 'var(--violet-soft)', border: '1px solid var(--violet)', color: 'var(--violet)' }} aria-label={`remove ${tok}`}><En>{tok}</En></button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {tokens.map((tok, i) => {
                  const usedCount = buildOrder.filter(x => x === tok).length
                  const totalCount = tokens.filter(x => x === tok).length
                  const spent = usedCount >= totalCount
                  return (
                    <button key={i} disabled={spent} onClick={() => setBuildOrder(o => [...o, tok])} className="rounded-xl px-3.5 py-2 text-sm font-bold transition-all active:scale-[0.98]" style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--border)', color: 'var(--ink)', opacity: spent ? 0.4 : 1 }}><En>{tok}</En></button>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setBuildOrder([])} className="px-4 py-2.5 rounded-2xl text-sm font-semibold" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>{t('ep1Reset')}</button>
                <button disabled={buildOrder.length < tokens.length} onClick={() => {
                  const correct = buildOrder.join(' ') === tokens.join(' ')
                  recordItems([step.itemId].filter(Boolean), { correct, independent: scaffold !== 'high' })
                  if (correct) { setLive(t('ep1Correct')); advance() } else { setRetry({ explainKey: 'ep1BuildRetry', natural: tokens.join(' ') }); setBuildOrder([]); setLive(t('ep1RetryTitle')) }
                }} className="flex-1 py-2.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]" style={{ background: 'var(--violet)', opacity: buildOrder.length < tokens.length ? 0.5 : 1 }}>{t('ep1Check')}</button>
              </div>
              {retry && <p lang={nativeLang} className="mt-3" style={{ fontSize: '0.8125rem', color: 'var(--coral)', fontWeight: 600 }}>{t(retry.explainKey)} <En style={{ fontWeight: 700 }}>{retry.natural}</En></p>}
            </div>
          )
        })()}

        {/* ---------------- FILL BLANK ---------------- */}
        {step.type === 'fill_blank' && (
          <div className="animate-fade-up">
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>{t(step.instructionKey)}</p>
            <div className="flex items-center gap-2 flex-wrap rounded-2xl p-3 mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <En style={{ fontSize: '1rem', fontWeight: 700 }}>{step.before}</En>
              <input value={fillValue} onChange={e => setFillValue(e.target.value)} lang="en" dir="ltr" placeholder={t('ep1TypeName')} aria-label={t(step.instructionKey)} className="chat-input rounded-xl px-3 py-2 text-sm" style={{ flex: 1, minWidth: 120, background: 'var(--bg-paper)', border: '1.5px solid var(--border)', color: 'var(--ink)' }} />
              <En style={{ fontSize: '1rem', fontWeight: 700 }}>{step.after}</En>
            </div>
            {scaffold === 'high' && <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginBottom: 12 }}>{t(step.hintKey)} <En style={{ fontWeight: 700 }}>{resolve(`${step.before} ${name}${step.after}`, name)}</En></p>}
            <button disabled={!fillValue.trim()} onClick={() => { recordItems([step.itemId].filter(Boolean), { correct: true, independent: scaffold !== 'high' }); setLive(t('ep1Correct')); advance() }} className="w-full py-2.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]" style={{ background: 'var(--violet)', opacity: fillValue.trim() ? 1 : 0.5 }}>{t('ep1Check')}</button>
          </div>
        )}

        {/* ---------------- FREE REPLY / RECALL ---------------- */}
        {(step.type === 'free_reply' || step.type === 'recall') && (
          <div className="animate-fade-up">
            {step.sceneEn
              ? <LinguaLine><En style={{ fontWeight: 700 }}>{resolve(step.sceneEn, name)}</En></LinguaLine>
              : step.promptEn
                ? <LinguaLine><En style={{ fontWeight: 700 }}>{resolve(step.promptEn, name)}</En></LinguaLine>
                : (
                  <div className="flex items-center gap-2 mb-3">
                    <ChattoMascot mood="supportive" size={40} intensity="support" decorative />
                    <p lang={nativeLang} style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>{t(step.instructionKey)}</p>
                  </div>
                )}
            {(step.promptEn || step.sceneEn) && <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginBottom: 10 }}>{t(step.instructionKey)}</p>}

            {retry && (
              <div role="status" className="rounded-2xl p-4 mb-3 animate-scale-in" style={{ background: 'var(--coral-soft)', border: '1px solid var(--coral)' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>{t('ep1RetryTitle')}</p>
                {retry.explainKey && <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5, marginBottom: 6 }}>{t(retry.explainKey)}</p>}
                {retry.natural && <En style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>{retry.natural}</En>}
                {retry.promptKey && <p lang={nativeLang} style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 6 }}>{t(retry.promptKey)}</p>}
              </div>
            )}

            {step.suggestionEn && (scaffold !== 'low' || retry) && (
              <button type="button" onClick={() => { setReply(resolve(step.suggestionEn, name)); setUsedSuggestion(true) }} className="rounded-full px-3.5 py-1.5 text-xs font-bold mb-3 transition-all active:scale-[0.98]" style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', color: 'var(--ink)' }}>
                {t('ep1UseSuggestion')}: <En>{resolve(step.suggestionEn, name)}</En>
              </button>
            )}

            <div className="flex items-end gap-2 rounded-2xl p-2.5" style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)' }}>
              <input value={reply} onChange={e => setReply(e.target.value)} lang="en" dir="ltr" onKeyDown={e => { if (e.key === 'Enter' && reply.trim()) submitFree(step.evalKind, step.itemIds, { fromSuggestion: usedSuggestion }) }} placeholder={t('ep1TypeReply')} aria-label={t(step.instructionKey)} className="chat-input flex-1 bg-transparent text-sm" style={{ color: 'var(--ink)', border: 'none', outline: 'none', padding: '7px 4px' }} />
              <button onClick={() => submitFree(step.evalKind, step.itemIds, { fromSuggestion: usedSuggestion })} disabled={!reply.trim()} className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all active:scale-[0.98]" style={{ background: reply.trim() ? 'var(--blue)' : 'var(--border)' }}>{t('ep1Send')}</button>
            </div>
            {praise && <p role="status" lang={nativeLang} className="mt-2" style={{ fontSize: '0.8125rem', color: 'var(--green)', fontWeight: 700 }}>{t(praise)}</p>}
          </div>
        )}

        {/* ---------------- COMPLETION ---------------- */}
        {step.type === 'completion' && (
          <div className="animate-scale-in rounded-3xl p-6 text-center" style={{ background: 'var(--bg-paper)', border: '1px solid var(--green)', boxShadow: '0 0 0 3px var(--green-soft)' }}>
            <div className="flex justify-center"><ChattoMascot mood="celebrating" size="medium" variant="green" intensity="celebrate" /></div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--green)', marginTop: 12 }}>{t('ep1CanDoBadge')}</p>
            <h2 style={{ fontWeight: 800, fontSize: '1.1875rem', color: 'var(--ink)', margin: '6px 0 8px' }}>{t(step.titleKey)}</h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 16 }}>{t(step.bodyKey)}</p>
            <div className="rounded-2xl px-4 py-3 mb-5 inline-flex items-center gap-2" style={{ background: 'var(--green-soft)', border: '1px solid var(--green)' }}>
              <span style={{ fontSize: 16 }}>✓</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)' }}>{t(step.canDoNameKey)} · +{ep.xp} XP</span>
            </div>
            <button onClick={finish} className="cta-glow w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:-translate-y-px active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, var(--green), var(--blue))', '--cta-ring': 'rgba(63,174,117,0.2)' }}>{t(step.ctaKey || 'ep1CloseCta')}</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default EpisodeShell
