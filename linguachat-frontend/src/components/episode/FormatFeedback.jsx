import { useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { dayKeyFor } from '../../learning/engine/session.js'
import { loadLearnerModel, saveLearnerModel, recordActivitySignalOnce } from '../../learning/engine/learnerModel.js'

/*
 * One optional question, one tap, at the end of something long.
 *
 * Deliberately not a survey: it never blocks the close button, it grants no XP,
 * it appears at most once per moment, and "Está bien" is a real answer that
 * records nothing. Chatto is here to keep it warm — Chatto does not interpret
 * the answer; the learner model does.
 */
export function FormatFeedback({ format, momentId }) {
  const { t, nativeLanguageInfo } = useApp()
  const [answered, setAnswered] = useState(null)
  const doneRef = useRef(false)
  const nativeLang = nativeLanguageInfo.base
  if (!format) return null

  function answer(choice) {
    if (doneRef.current) return
    doneRef.current = true
    setAnswered(choice)
    if (choice === 'neutral') return          // "it's fine" changes nothing
    const model = loadLearnerModel()
    const id = `${dayKeyFor()}:feedback:${momentId}:${choice}`
    if (recordActivitySignalOnce(model, id, format, choice === 'more' ? 'positive' : 'negative_soft')) {
      saveLearnerModel(model)
    }
  }

  const options = [
    { key: 'more', label: 'feedbackMoreLikeThis' },
    { key: 'neutral', label: 'feedbackItsFine' },
    { key: 'other', label: 'feedbackAnotherWay' },
  ]

  return (
    <div className="rounded-2xl p-4 mt-2 mb-4 text-start" style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <ChattoMascot mood="welcoming" size={32} intensity="ambient" decorative />
        {/* Name the activity the learner actually did, so the question is
            about something they remember doing. */}
        <p lang={nativeLang} style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ink)' }}>
          {t('feedbackQuestionFor', { activity: t(`formatName_${format}`) })}
        </p>
      </div>
      {answered ? (
        <p role="status" lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--positive)', fontWeight: 700 }}>{t('feedbackThanks')}</p>
      ) : (
        <div role="group" aria-label={t('feedbackQuestionFor', { activity: t(`formatName_${format}`) })} className="flex flex-wrap gap-2">
          {options.map(o => (
            <button key={o.key} type="button" onClick={() => answer(o.key)}
              className="rounded-full px-3.5 py-2 text-xs font-bold transition-all active:scale-[0.98]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)', minHeight: 40 }}>
              <span lang={nativeLang}>{t(o.label)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default FormatFeedback
