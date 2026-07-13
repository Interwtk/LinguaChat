import { useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { FIRST_EPISODE } from '../../data/episodes'
import { SEED_VOCAB_BY_ID } from '../../data/vocabulary'
import { getLocalizedMeaning } from '../../services/learningContent'
import {
  loadLearnerModel, saveLearnerModel, recordItemAttempt, recordCanDoAttempt, getRecommendedScaffold,
} from '../../services/learnerModel'

const STEPS = ['intro', 'model', 'comprehension', 'build', 'fill', 'roleplay', 'variation', 'recall', 'close']

const normalize = (s) => String(s || '').toLowerCase().replace(/[.,!?¿¡]/g, '').replace(/\s+/g, ' ').trim()

// Target-English block: forces LTR + lang even inside an RTL interface.
function En({ children, className = '', style }) {
  return <span lang="en" dir="ltr" className={className} style={style}>{children}</span>
}

function StepDots({ index }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-1" aria-hidden="true">
      {STEPS.map((_, i) => (
        <span key={i} style={{
          width: i === index ? 16 : 5, height: 5, borderRadius: 999,
          background: i <= index ? 'var(--violet)' : 'var(--border)', transition: 'all 0.3s',
        }} />
      ))}
    </div>
  )
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

export function EpisodePlayer() {
  const { t, profile, nativeLanguageInfo, interfaceLanguageInfo, exitEpisode, completeEpisode } = useApp()
  const ep = FIRST_EPISODE
  const name = (profile.name || '').trim() || 'Alex'
  const meaningOf = (id) => getLocalizedMeaning(SEED_VOCAB_BY_ID[id]?.meaning, nativeLanguageInfo, interfaceLanguageInfo)

  const [stepIndex, setStepIndex] = useState(0)
  const [scaffold, setScaffold] = useState('high')
  const [cleanStreak, setCleanStreak] = useState(0)
  const [showHelp, setShowHelp] = useState(true)
  const modelRef = useRef(loadLearnerModel())
  const step = STEPS[stepIndex]

  // per-activity state
  const [compChoice, setCompChoice] = useState(null)
  const [buildOrder, setBuildOrder] = useState([])
  const [fillValue, setFillValue] = useState('')
  const [reply, setReply] = useState('')
  const [retry, setRetry] = useState(null)   // { explainKey, natural }
  const [live, setLive] = useState('')

  const greeting = `Hi, I’m ${name}.`
  const buildTokens = useMemo(() => ['Hi', 'I’m', `${name}.`], [name])

  function advance() {
    setRetry(null)
    setLive('')
    setStepIndex(i => Math.min(STEPS.length - 1, i + 1))
    if (scaffold === 'high') setShowHelp(true)
  }

  function registerResult({ itemId, correct, usedHelp, errorId }) {
    const m = modelRef.current
    if (itemId) recordItemAttempt(m, itemId, { correct, usedHelp })
    saveLearnerModel(m)
    // adapt scaffolding deterministically
    const nextStreak = correct && !usedHelp ? cleanStreak + 1 : 0
    setCleanStreak(nextStreak)
    const next = getRecommendedScaffold(scaffold, { cleanSuccessStreak: nextStreak, justFailed: !correct })
    setScaffold(next)
    if (next === 'high') setShowHelp(true)
  }

  /* ---------- deterministic greeting evaluation ---------- */
  function evaluateGreeting(text) {
    const n = normalize(text)
    const hasGreeting = /\b(hi|hello|hey)\b/.test(n)
    const hasIm = /\b(i'?m|i am)\b/.test(n)
    if (hasGreeting && hasIm) return { correct: true }
    // pick ONE priority error
    if (!hasIm && n) return { correct: false, explainKey: 'ep1RetryExplainIm', natural: greeting }
    if (!hasGreeting) return { correct: false, explainKey: 'ep1RetryExplainGreet', natural: greeting }
    return { correct: false, explainKey: 'ep1RetryExplainIm', natural: greeting }
  }

  function submitReply(fromSuggestion) {
    const result = evaluateGreeting(reply)
    if (result.correct) {
      registerResult({ itemId: 'im', correct: true, usedHelp: Boolean(fromSuggestion) })
      recordItemAttempt(modelRef.current, 'hi', { correct: true, usedHelp: Boolean(fromSuggestion) })
      setLive(t('ep1FeedbackGood'))
      setReply('')
      advance()
    } else {
      registerResult({ itemId: 'im', correct: false })
      setRetry({ explainKey: result.explainKey, natural: result.natural })
      setLive(t('ep1RetryTitle'))
    }
  }

  /* ---------- close ---------- */
  function finish() {
    const m = modelRef.current
    recordCanDoAttempt(m, ep.canDoId, { success: cleanStreak >= 0 })
    saveLearnerModel(m)
    completeEpisode(ep)
  }

  const nativeLang = nativeLanguageInfo.base

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6" style={{ background: 'var(--bg-main)' }}>
      <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
        {/* Episode header */}
        <div className="rounded-2xl px-4 py-3 mb-5 flex items-center justify-between gap-3"
          style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--violet)' }}>
              {t('ep1EpisodeBadge')}
            </p>
            <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t(ep.titleKey)}
            </p>
          </div>
          <button type="button" onClick={exitEpisode}
            className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.98]"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>
            {t('ep1FreeChatCta')}
          </button>
        </div>

        <StepDots index={stepIndex} />

        {/* Live region for assistive tech */}
        <p aria-live="polite" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{live}</p>

        {/* ---------------- STEP: INTRO ---------------- */}
        {step === 'intro' && (
          <div className="animate-scale-in rounded-3xl p-6 text-center" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
            <div className="flex justify-center"><ChattoMascot mood="welcoming" size="medium" intensity="enter" /></div>
            <h2 style={{ fontWeight: 800, fontSize: '1.1875rem', color: 'var(--ink)', marginTop: 14, marginBottom: 8 }}>{t('ep1IntroTitle')}</h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 8 }}>{t('ep1IntroBody')}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--violet)', fontWeight: 700, marginBottom: 18 }}>{t(ep.goalKey)}</p>
            <button onClick={advance} className="cta-glow w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:-translate-y-px active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, var(--violet), var(--blue))', '--cta-ring': 'rgba(124,92,255,0.18)' }}>
              {t('ep1Start')}
            </button>
          </div>
        )}

        {/* ---------------- STEP: MODEL ---------------- */}
        {step === 'model' && (
          <div>
            <LinguaLine>
              <En style={{ fontWeight: 700 }}>{ep.target.model}</En>
            </LinguaLine>
            {(showHelp || scaffold === 'high') && (
              <div className="rounded-2xl p-4 mb-3 animate-fade-up" style={{ background: 'var(--violet-soft)', border: '1px solid var(--violet)' }}>
                <p lang={nativeLang} style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                  {meaningOf('hi')} · {meaningOf('im')}
                </p>
                <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>{t('ep1ModelExplain')}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowHelp(h => !h)} className="px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98]"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>
                {showHelp ? t('ep1HideHelp') : t('ep1ShowHelp')}
              </button>
              <button onClick={advance} className="flex-1 py-2.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]"
                style={{ background: 'var(--violet)' }}>{t('ep1Continue')}</button>
            </div>
          </div>
        )}

        {/* ---------------- STEP: COMPREHENSION ---------------- */}
        {step === 'comprehension' && (
          <div className="animate-fade-up">
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{t('ep1ComprehensionInstruction')}</p>
            <div className="rounded-2xl p-3 mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <En style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>{ep.target.model}</En>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { id: 'a', key: 'ep1CompOptCorrect', correct: true },
                { id: 'b', key: 'ep1CompOptWrong1', correct: false },
                { id: 'c', key: 'ep1CompOptWrong2', correct: false },
              ].map(opt => {
                const chosen = compChoice === opt.id
                const showState = compChoice != null
                return (
                  <button key={opt.id} type="button" lang={nativeLang} aria-pressed={chosen}
                    disabled={showState}
                    onClick={() => {
                      setCompChoice(opt.id)
                      const correct = opt.correct
                      registerResult({ itemId: 'whats_your_name', correct, usedHelp: scaffold === 'high' })
                      setLive(correct ? t('ep1Correct') : t('ep1KeepGoing'))
                      setTimeout(advance, 900)
                    }}
                    className="rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all active:scale-[0.99]"
                    style={{
                      background: showState && opt.correct ? 'var(--green-soft)' : chosen ? 'var(--yellow-soft)' : 'var(--bg-paper)',
                      border: `1.5px solid ${showState && opt.correct ? 'var(--green)' : chosen ? 'var(--yellow)' : 'var(--border)'}`,
                      color: 'var(--ink)',
                    }}>
                    {t(opt.key)}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ---------------- STEP: BUILD (word order) ---------------- */}
        {step === 'build' && (
          <div className="animate-fade-up">
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>{t('ep1BuildInstruction')}</p>
            <div className="rounded-2xl p-3 mb-3 min-h-[52px] flex items-center flex-wrap gap-2" style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--violet)' }}>
              {buildOrder.length === 0 && <span lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>{t('ep1BuildHint')}</span>}
              {buildOrder.map((tok, i) => (
                <button key={i} onClick={() => setBuildOrder(o => o.filter((_, idx) => idx !== i))}
                  className="rounded-xl px-3 py-1.5 text-sm font-bold" style={{ background: 'var(--violet-soft)', border: '1px solid var(--violet)', color: 'var(--violet)' }}>
                  <En>{tok}</En>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {buildTokens.map((tok, i) => {
                const used = buildOrder.filter(x => x === tok).length > buildTokens.slice(0, i).filter(x => x === tok).length
                return (
                  <button key={i} disabled={buildOrder.includes(tok) && buildOrder.filter(x=>x===tok).length >= buildTokens.filter(x=>x===tok).length}
                    onClick={() => setBuildOrder(o => [...o, tok])}
                    className="rounded-xl px-3.5 py-2 text-sm font-bold transition-all active:scale-[0.98]"
                    style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--border)', color: 'var(--ink)', opacity: buildOrder.filter(x=>x===tok).length >= buildTokens.filter(x=>x===tok).length ? 0.4 : 1 }}>
                    <En>{tok}</En>
                  </button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setBuildOrder([])} className="px-4 py-2.5 rounded-2xl text-sm font-semibold" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>{t('ep1Reset')}</button>
              <button disabled={buildOrder.length < buildTokens.length}
                onClick={() => {
                  const correct = buildOrder.join(' ') === buildTokens.join(' ')
                  registerResult({ itemId: 'hi', correct, usedHelp: scaffold === 'high' })
                  if (correct) { setLive(t('ep1Correct')); advance() }
                  else { setRetry({ explainKey: 'ep1BuildRetry', natural: greeting }); setBuildOrder([]); setLive(t('ep1RetryTitle')) }
                }}
                className="flex-1 py-2.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]"
                style={{ background: 'var(--violet)', opacity: buildOrder.length < buildTokens.length ? 0.5 : 1 }}>
                {t('ep1Check')}
              </button>
            </div>
            {retry && (
              <p lang={nativeLang} className="mt-3" style={{ fontSize: '0.8125rem', color: 'var(--coral)', fontWeight: 600 }}>
                {t(retry.explainKey)} <En style={{ fontWeight: 700 }}>{retry.natural}</En>
              </p>
            )}
          </div>
        )}

        {/* ---------------- STEP: FILL ---------------- */}
        {step === 'fill' && (
          <div className="animate-fade-up">
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>{t('ep1FillInstruction')}</p>
            <div className="flex items-center gap-2 flex-wrap rounded-2xl p-3 mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <En style={{ fontSize: '1rem', fontWeight: 700 }}>Hi, I’m</En>
              <input value={fillValue} onChange={e => setFillValue(e.target.value)} lang="en" dir="ltr"
                placeholder={t('ep1TypeName')} aria-label={t('ep1TypeName')}
                className="chat-input rounded-xl px-3 py-2 text-sm" style={{ flex: 1, minWidth: 120, background: 'var(--bg-paper)', border: '1.5px solid var(--border)', color: 'var(--ink)' }} />
              <En style={{ fontSize: '1rem', fontWeight: 700 }}>.</En>
            </div>
            {scaffold === 'high' && <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginBottom: 12 }}>{t('ep1FillHint')} <En style={{ fontWeight: 700 }}>{greeting}</En></p>}
            <button disabled={!fillValue.trim()}
              onClick={() => { registerResult({ itemId: 'im', correct: true, usedHelp: scaffold === 'high' }); setLive(t('ep1Correct')); advance() }}
              className="w-full py-2.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]"
              style={{ background: 'var(--violet)', opacity: fillValue.trim() ? 1 : 0.5 }}>{t('ep1Check')}</button>
          </div>
        )}

        {/* ---------------- STEP: ROLEPLAY ---------------- */}
        {(step === 'roleplay' || step === 'recall') && (
          <div className="animate-fade-up">
            {step === 'roleplay'
              ? <LinguaLine><En style={{ fontWeight: 700 }}>{ep.target.linguaAsk}</En></LinguaLine>
              : (
                <div className="flex items-center gap-2 mb-3">
                  <ChattoMascot mood="supportive" size={40} intensity="support" decorative />
                  <p lang={nativeLang} style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>{t('ep1RecallInstruction')}</p>
                </div>
              )}
            <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginBottom: 10 }}>{t('ep1RoleplayInstruction')}</p>

            {retry && (
              <div role="status" className="rounded-2xl p-4 mb-3 animate-scale-in" style={{ background: 'var(--coral-soft)', border: '1px solid var(--coral)' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>{t('ep1RetryTitle')}</p>
                <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5, marginBottom: 6 }}>{t(retry.explainKey)}</p>
                <En style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>{retry.natural}</En>
              </div>
            )}

            {(scaffold !== 'low' || retry) && (
              <button type="button" onClick={() => { setReply(greeting) }}
                className="rounded-full px-3.5 py-1.5 text-xs font-bold mb-3 transition-all active:scale-[0.98]"
                style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', color: 'var(--ink)' }}>
                {t('ep1UseSuggestion')}: <En>{greeting}</En>
              </button>
            )}

            <div className="flex items-end gap-2 rounded-2xl p-2.5" style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)' }}>
              <input value={reply} onChange={e => setReply(e.target.value)} lang="en" dir="ltr"
                onKeyDown={e => { if (e.key === 'Enter' && reply.trim()) submitReply(reply === greeting) }}
                placeholder={t('ep1TypeReply')} aria-label={t('ep1RoleplayInstruction')}
                className="chat-input flex-1 bg-transparent text-sm" style={{ color: 'var(--ink)', border: 'none', outline: 'none', padding: '7px 4px' }} />
              <button onClick={() => submitReply(reply === greeting)} disabled={!reply.trim()}
                className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all active:scale-[0.98]"
                style={{ background: reply.trim() ? 'var(--blue)' : 'var(--border)' }}>{t('ep1Send')}</button>
            </div>
          </div>
        )}

        {/* ---------------- STEP: VARIATION ---------------- */}
        {step === 'variation' && (
          <div className="animate-fade-up">
            <LinguaLine><En style={{ fontWeight: 700 }}>{ep.target.variation}</En></LinguaLine>
            <p lang={nativeLang} style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.5, marginBottom: 12 }}>{t('ep1VariationInstruction')}</p>
            <div className="flex items-end gap-2 rounded-2xl p-2.5 mb-2" style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)' }}>
              <input value={reply} onChange={e => setReply(e.target.value)} lang="en" dir="ltr"
                onKeyDown={e => { if (e.key === 'Enter' && reply.trim()) submitReply(false) }}
                placeholder={t('ep1TypeReply')} aria-label={t('ep1RoleplayInstruction')}
                className="chat-input flex-1 bg-transparent text-sm" style={{ color: 'var(--ink)', border: 'none', outline: 'none', padding: '7px 4px' }} />
              <button onClick={() => submitReply(false)} disabled={!reply.trim()}
                className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all active:scale-[0.98]"
                style={{ background: reply.trim() ? 'var(--blue)' : 'var(--border)' }}>{t('ep1Send')}</button>
            </div>
            {retry && (
              <div role="status" className="rounded-2xl p-4 animate-scale-in" style={{ background: 'var(--coral-soft)', border: '1px solid var(--coral)' }}>
                <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5, marginBottom: 6 }}>{t(retry.explainKey)}</p>
                <En style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{retry.natural}</En>
              </div>
            )}
          </div>
        )}

        {/* ---------------- STEP: CLOSE ---------------- */}
        {step === 'close' && (
          <div className="animate-scale-in rounded-3xl p-6 text-center" style={{ background: 'var(--bg-paper)', border: '1px solid var(--green)', boxShadow: '0 0 0 3px var(--green-soft)' }}>
            <div className="flex justify-center"><ChattoMascot mood="celebrating" size="medium" variant="green" intensity="celebrate" /></div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--green)', marginTop: 12 }}>{t('ep1CanDoBadge')}</p>
            <h2 style={{ fontWeight: 800, fontSize: '1.1875rem', color: 'var(--ink)', margin: '6px 0 8px' }}>{t('ep1CloseTitle')}</h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 16 }}>{t('ep1CloseBody')}</p>
            <div className="rounded-2xl px-4 py-3 mb-5 inline-flex items-center gap-2" style={{ background: 'var(--green-soft)', border: '1px solid var(--green)' }}>
              <span style={{ fontSize: 16 }}>✓</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)' }}>{t(ep.canDoNameKey)} · +{ep.xp} XP</span>
            </div>
            <button onClick={finish} className="cta-glow w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:-translate-y-px active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, var(--green), var(--blue))', '--cta-ring': 'rgba(63,174,117,0.2)' }}>
              {t('ep1CloseCta')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default EpisodePlayer
