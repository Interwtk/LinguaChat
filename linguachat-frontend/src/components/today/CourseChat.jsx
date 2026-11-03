import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { ListeningTurn } from '../chat/ListeningTurn.jsx'
import { sendChatMessage } from '../../services/api'
import { captureLearnerAccess } from '../../auth/localLease.js'
import { getCourse } from '../../learning/courses/registry.js'

/*
 * Practice conversation for a course other than English (today: Spanish).
 *
 * The server answers with the course's rule-based partner (ai/es_tutor.py)
 * behind the same safety layer as every chat: Spanish lines, English
 * explanations, a correction only when it can name the error, and an honest
 * "I didn't follow" plus a guided question when it cannot. Practising here is
 * not mastery evidence, so nothing is filed in the learner model; the
 * conversation lives in its own course-scoped key and its own server session,
 * apart from the English chat.
 */
const MAX_KEPT = 30
const storageKey = (courseId) => `lc2-course-chat-${courseId}`

function loadMessages(courseId) {
  try {
    const raw = captureLearnerAccess().getItem(storageKey(courseId))
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter(m => m && typeof m.text === 'string' && (m.role === 'user' || m.role === 'lingua')).slice(-MAX_KEPT) : []
  } catch { return [] }
}

function saveMessages(courseId, list) {
  try { captureLearnerAccess().setItem(storageKey(courseId), JSON.stringify(list.slice(-MAX_KEPT))) } catch { /* the conversation still works for this visit */ }
}

const OPENING = { es: '¡Hola! Me llamo Lingua. ¿Cómo te llamas?' }

export function CourseChat({ onExit }) {
  const { t, activeCourse, nativeLanguageInfo, interfaceLanguageInfo, sessionId } = useApp()
  const course = getCourse(activeCourse)
  const lang = course?.targetLanguage || 'es'
  const [messages, setMessages] = useState(() => {
    const stored = loadMessages(activeCourse)
    return stored.length ? stored : [{ id: 'opening', role: 'lingua', text: OPENING[lang] || OPENING.es, focus: 'name' }]
  })
  const [draft, setDraft] = useState('')
  const [assisted, setAssisted] = useState(false)
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)
  useEffect(() => { saveMessages(activeCourse, messages); try { endRef.current?.scrollIntoView({ block: 'end' }) } catch { /* noop */ } }, [messages, activeCourse])

  const lastLingua = [...messages].reverse().find(m => m.role === 'lingua')
  async function send(e) {
    e?.preventDefault()
    const text = draft.trim()
    if (!text || sending) return
    const mine = { id: `u-${Date.now()}`, role: 'user', text }
    const next = [...messages, mine]
    setMessages(next); setDraft(''); setSending(true)
    const history = next.slice(-9, -1).map(m => ({ role: m.role === 'lingua' ? 'assistant' : 'user', text: m.text }))
    const reply = await sendChatMessage({
      message: text, level: 'A1', history, sessionId: `${sessionId}:${activeCourse}`,
      nativeLanguage: nativeLanguageInfo, interfaceLanguage: interfaceLanguageInfo,
      targetLanguage: { code: lang, base: lang, name: lang },
      topicContext: lastLingua?.focus ? { topic: lastLingua.focus } : null,
      assistance: assisted ? 'suggestion_sent' : 'none',
    })
    setAssisted(false); setSending(false)
    setMessages(list => [...list, {
      id: `l-${Date.now()}`, role: 'lingua', text: reply.reply, focus: reply.focus || lastLingua?.focus || null,
      correction: reply.correction, explanation: reply.explanation, suggestion: reply.suggestion,
      offline: Boolean(reply.isFallback),
      // a safety reply is written in the learner's own language, not the target one
      safety: reply.provider === 'safety',
    }])
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6" style={{ background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
        <div className="rounded-2xl px-4 py-3 mb-4 flex items-center justify-between gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>{t('courseChatTitle')}</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.45 }}>{t('courseChatNoticeLocal')}</p>
          </div>
          <button type="button" onClick={onExit} className="tool-chip flex-shrink-0">{t('backToToday')}</button>
        </div>

        <ol className="flex flex-col gap-3 mb-4" aria-live="polite">
          {messages.map(m => (
            <li key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex gap-2'}>
              {m.role === 'lingua' && <LinguaAvatar size={30} online className="mt-0.5" />}
              <div style={{ maxWidth: '86%' }}>
                <div className={m.role === 'user' ? 'bubble-user' : 'bubble-lingua'}>
                  <span lang={m.offline || m.safety ? undefined : lang} dir={m.offline || m.safety ? undefined : 'ltr'}>{m.text}</span>
                </div>
                {m.role === 'lingua' && !m.offline && !m.safety && <ListeningTurn textShown lang={lang} turnId={`course-chat:${m.id}`} text={m.text} />}
                {m.role === 'lingua' && (m.correction || m.explanation) && (
                  <div className="correction-card mt-2">
                    {m.correction && <span className="correction-natural" lang={lang} dir="ltr">{m.correction}</span>}
                    {m.explanation && <p className="correction-why" style={{ marginTop: 4 }}>{m.explanation}</p>}
                  </div>
                )}
                {m.role === 'lingua' && m.suggestion && m === lastLingua && (
                  <button type="button" className="tool-chip mt-2" onClick={() => { setDraft(m.suggestion); setAssisted(true) }}>
                    {t('ep1UseSuggestion')}: <span lang={lang} dir="ltr">{m.suggestion}</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
        <div ref={endRef} />
        <form onSubmit={send} className="flex gap-2 rounded-2xl p-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <input value={draft} onChange={e => setDraft(e.target.value)} lang={lang} dir="ltr" aria-label={t('courseChatTitle')} placeholder={t('ep1TypeReply')}
            disabled={sending} className="chat-input flex-1 bg-transparent text-sm" style={{ color: 'var(--ink)', border: 'none', outline: 'none', padding: '7px 4px', minWidth: 0 }} />
          <button type="submit" disabled={!draft.trim() || sending} className="rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: draft.trim() && !sending ? 'var(--info)' : 'var(--border)' }}>{t('ep1Send')}</button>
        </form>
      </div>
    </div>
  )
}
