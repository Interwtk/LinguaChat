import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { ListeningTurn } from './ListeningTurn.jsx'
import { listScenarios, sendChatMessage } from '../../services/api'

/*
 * Guided situations: the chat that really teaches.
 *
 * The server knows what an answer to each step looks like (ai/scenarios.py) and
 * tells every turn apart: valid, a known mistake, a language question, not
 * understood, or a safety reply. This screen only shows that and echoes back the
 * state it was given (`scenario`), so nothing here decides anything.
 *
 * It is practice, not evidence: nothing is filed in the learner model and the
 * conversation lives in this component only. Leaving the screen forgets it.
 */
const lineId = (() => { let n = 0; return (prefix) => `${prefix}-${++n}` })()

export function ScenarioPractice({ courseId = 'en', targetLanguage = 'en', onExit }) {
  const { t, nativeLanguageInfo, interfaceLanguageInfo, sessionId } = useApp()
  const [list, setList] = useState(null)
  const [active, setActive] = useState(null)
  const [state, setState] = useState(null)
  const [lines, setLines] = useState([])
  const [draft, setDraft] = useState('')
  const [assisted, setAssisted] = useState(false)
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)
  const aux = interfaceLanguageInfo?.base || nativeLanguageInfo?.base || 'en'

  useEffect(() => {
    let live = true
    listScenarios({ target: targetLanguage, aux }).then(items => { if (live) setList(items) })
    return () => { live = false }
  }, [targetLanguage, aux])
  useEffect(() => { try { endRef.current?.scrollIntoView({ block: 'end' }) } catch { /* noop */ } }, [lines])

  function open(item) {
    setActive(item)
    setState({ id: item.id, step: 0, attempt: 0, done: false })
    setLines([{ id: lineId('l'), role: 'lingua', text: item.opening, target: true }])
    setDraft('')
  }

  async function submit(text) {
    if (!text || sending || !state || state.done) return
    setLines(list => [...list, { id: lineId('u'), role: 'user', text }])
    setDraft(''); setSending(true)
    const reply = await sendChatMessage({
      message: text, history: [], sessionId: `${sessionId}:${courseId}:scenario`,
      nativeLanguage: nativeLanguageInfo, interfaceLanguage: interfaceLanguageInfo,
      targetLanguage: { code: targetLanguage, base: targetLanguage, name: targetLanguage },
      scenario: { id: state.id, step: state.step, attempt: state.attempt },
      assistance: assisted ? 'suggestion_sent' : 'none',
    })
    setAssisted(false); setSending(false)
    if (reply.scenario) setState(reply.scenario)
    setLines(list => [...list, {
      id: lineId('l'), role: 'lingua', text: reply.reply, offline: Boolean(reply.isFallback),
      // a safety reply is written in the learner's own language, not the target one
      target: reply.provider === 'scenario', correction: reply.correction, explanation: reply.explanation,
      suggestion: reply.suggestion, options: reply.learning_action?.options || null, prompt: reply.learning_action?.prompt || null,
    }])
  }

  const header = (
    <div className="rounded-2xl px-4 py-3 mb-4 flex items-center justify-between gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>{active ? active.title : t('scenarioTitle')}</p>
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>{t('scenarioNotice')}</p>
        <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.45, marginTop: 3 }}>{t('chatSafetyNote')}</p>
      </div>
      <button type="button" onClick={() => (active ? setActive(null) : onExit?.())} className="tool-chip flex-shrink-0">{active ? t('scenarioOther') : t('scenarioBack')}</button>
    </div>
  )

  if (!active) {
    return (
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6" style={{ background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
          {header}
          {list === null && <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t('screenLoading')}</p>}
          {list?.length === 0 && <p role="status" style={{ fontSize: 13, color: 'var(--muted)' }}>{t('scenarioOffline')}</p>}
          <div className="flex flex-col gap-2">
            {(list || []).map(item => (
              <button key={item.id} type="button" onClick={() => open(item)} className="rounded-2xl px-4 py-3 text-left text-sm font-semibold"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}>
                {item.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const last = lines[lines.length - 1]
  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6" style={{ background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
        {header}
        <ol className="flex flex-col gap-3 mb-4" aria-live="polite">
          {lines.map(m => (
            <li key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex gap-2'}>
              {m.role === 'lingua' && <LinguaAvatar size={30} online className="mt-0.5" />}
              <div style={{ maxWidth: '86%' }}>
                <div className={m.role === 'user' ? 'bubble-user' : 'bubble-lingua'}>
                  <span lang={m.target ? targetLanguage : undefined} dir={m.target ? 'ltr' : undefined}>{m.text}</span>
                </div>
                {m.role === 'lingua' && m.target && <ListeningTurn textShown lang={targetLanguage} turnId={`scenario:${m.id}`} text={m.text} />}
                {m.role === 'lingua' && (m.correction || m.explanation) && (
                  <div className="correction-card mt-2">
                    {m.correction && <span className="correction-natural" lang={targetLanguage} dir="ltr">{m.correction}</span>}
                    {m.explanation && <p className="correction-why" style={{ marginTop: m.correction ? 4 : 0 }}>{m.explanation}</p>}
                  </div>
                )}
                {m === last && m.suggestion && (
                  <button type="button" className="tool-chip mt-2" onClick={() => { setDraft(m.suggestion); setAssisted(true) }}>
                    {t('ep1UseSuggestion')}: <span lang={targetLanguage} dir="ltr">{m.suggestion}</span>
                  </button>
                )}
                {m === last && m.options && (
                  <div className="mt-2 flex flex-col gap-1.5" role="group" aria-label={m.prompt || undefined}>
                    {m.prompt && <p style={{ fontSize: 12, color: 'var(--muted)' }}>{m.prompt}</p>}
                    {m.options.map(option => (
                      <button key={option} type="button" className="tool-chip" lang={targetLanguage} dir="ltr" onClick={() => { setAssisted(true); submit(option) }}>{option}</button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
        <div ref={endRef} />
        {state?.done
          ? <button type="button" className="tool-chip" onClick={() => setActive(null)}>{t('scenarioOther')}</button>
          : (
            <form onSubmit={e => { e.preventDefault(); submit(draft.trim()) }} className="flex gap-2 rounded-2xl p-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <input value={draft} onChange={e => setDraft(e.target.value)} lang={targetLanguage} dir="ltr" maxLength={200} aria-label={active.title} placeholder={t('ep1TypeReply')}
                disabled={sending} className="chat-input flex-1 bg-transparent text-sm" style={{ color: 'var(--ink)', border: 'none', outline: 'none', padding: '7px 4px', minWidth: 0 }} />
              <button type="submit" disabled={!draft.trim() || sending} className="rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: draft.trim() && !sending ? 'var(--info)' : 'var(--border)' }}>{t('ep1Send')}</button>
            </form>
          )}
      </div>
    </div>
  )
}
