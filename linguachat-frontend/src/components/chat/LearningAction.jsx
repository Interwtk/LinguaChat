import { useApp } from '../../context/AppContext'

const ACTION_LABELS = {
  complete_sentence: 'Completa',
  answer_question: 'Responde',
  rewrite: 'Reescribe',
  choose_option: 'Elige',
  ask_back: 'Pregunta',
  use_word: 'Usa palabra',
}

export function LearningAction({ action }) {
  const { t } = useApp()
  if (!action?.prompt) return null

  const label = ACTION_LABELS[action.type] || t('learningAction')

  return (
    <div
      className="mt-2.5 rounded-2xl p-3 animate-fade-up"
      style={{
        background: 'linear-gradient(135deg, var(--blue-soft), var(--violet-soft))',
        border: '1.5px solid var(--blue)',
        boxShadow: '0 8px 22px rgba(91,141,239,0.12)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span style={{
              fontSize: 10,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--blue)',
            }}>
              {t('learningAction')}
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              color: 'var(--violet)',
              background: 'var(--bg-paper)',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '1px 7px',
            }}>
              {label}
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.45 }}>
            {action.prompt}
          </p>
        </div>
        <button
          type="button"
          className="rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-px active:scale-[0.98]"
          style={{ background: 'var(--blue)', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}
        >
          {t('tryIt')}
        </button>
      </div>

      {action.options?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {action.options.map(option => (
            <span key={option} style={{
              fontSize: 11,
              fontWeight: 650,
              color: 'var(--ink)',
              background: 'var(--bg-paper)',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '3px 9px',
            }}>
              {option}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
