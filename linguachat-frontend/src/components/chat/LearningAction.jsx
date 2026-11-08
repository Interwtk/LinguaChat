import { useApp } from '../../context/AppContext'

// Labels follow the learner's language (they were hardcoded Spanish).
const ACTION_LABEL_KEYS = {
  complete_sentence: 'actionComplete',
  answer_question: 'actionAnswer',
  rewrite: 'actionRewrite',
  choose_option: 'actionChoose',
  ask_back: 'actionAskBack',
  use_word: 'actionUseWord',
  fill_blank: 'actionFillBlank',
}

function focusComposer() {
  const composer = document.querySelector('textarea.chat-input')
  if (!composer) return
  composer.focus()
  composer.scrollIntoView?.({ block: 'nearest' })
}

export function LearningAction({ action }) {
  const { t } = useApp()
  if (!action?.prompt) return null

  const label = ACTION_LABEL_KEYS[action.type] ? t(ACTION_LABEL_KEYS[action.type]) : t('learningAction')

  return (
    <div
      className="mt-2.5 rounded-2xl p-3 animate-fade-up"
      style={{
        background: 'var(--accent-soft)',
        border: '1px solid var(--info)',
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
              color: 'var(--info)',
            }}>
              {t('learningAction')}
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              color: 'var(--accent)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 999,
              padding: '1px 7px',
            }}>
              {label}
            </span>
          </div>
          {/* English material, sometimes framed in the learner's language */}
          <p dir="auto" style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.45 }}>
            {action.prompt}
          </p>
        </div>
        {/* It used to do nothing. It takes the learner to the place to answer.
            White on --info was 2.1:1 in dark mode; --surface reads in both. */}
        <button
          type="button"
          onClick={focusComposer}
          className="rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-px active:scale-[0.98]"
          style={{ background: 'var(--info)', color: 'var(--surface)', border: 'none', whiteSpace: 'nowrap' }}
        >
          {t('tryIt')}
        </button>
      </div>

      {action.options?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {action.options.map(option => (
            <span key={option} lang="en" dir="ltr" style={{
              fontSize: 11,
              fontWeight: 650,
              color: 'var(--ink)',
              background: 'var(--surface)',
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
