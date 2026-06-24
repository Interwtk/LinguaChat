import { useApp } from '../../context/AppContext'

export function TutorFeedback({ feedback, compact = false }) {
  const { t } = useApp()
  if (!feedback) return null
  const { correction, why, suggestion, translation } = feedback
  const hasAny = correction || why || suggestion || translation
  if (!hasAny) return null

  return (
    <div className="flex flex-col gap-2 mt-2.5" style={{ maxWidth: compact ? '100%' : '80%' }}>
      {translation && (
        <div className="chip-translation">
          <div className="flex items-center gap-1.5 mb-1">
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t('inEnglish')}
            </span>
          </div>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>"{translation}"</p>
        </div>
      )}

      {correction && (
        <div className="stamp-correction">
          <span style={{
            fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.1em',
            background: 'var(--yellow)', padding: '1px 6px', borderRadius: 4,
            color: '#fff', opacity: 0.9,
          }}>
            {t('tinyFix')}
          </span>
          <span style={{ color: 'var(--ink-muted)', textDecoration: 'line-through', fontSize: '0.8125rem' }}>
            {typeof correction === 'string' ? correction.split(' ')[0] : ''}
          </span>
          <span style={{ color: 'var(--ink)', fontWeight: 600, fontSize: '0.875rem' }}>
            {correction}
          </span>
        </div>
      )}

      {why && (
        <div className="note-why">
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--blue)', display: 'block', marginBottom: 3,
          }}>
            {t('quickWhy')}
          </span>
          <span style={{ color: 'var(--ink)', lineHeight: 1.5 }}>{why}</span>
        </div>
      )}

      {suggestion && (
        <div className="chip-try">
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--green)',
          }}>
            {t('tryNext')}
          </span>
          <span style={{ color: 'var(--ink)', fontStyle: 'italic' }}>"{suggestion}"</span>
        </div>
      )}

    </div>
  )
}
