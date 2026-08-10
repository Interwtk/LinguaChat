import { useApp } from '../../context/AppContext'

/*
 * A CORRECTION IS A REPLY FROM LINGUA, NOT A VERDICT.
 *
 * This used to render as a stamp with an uppercase badge, a strikethrough taken
 * from the wrong string and a blue "analysis" note underneath — the visual
 * language of an error box. A learner who is already nervous about speaking reads
 * that as being marked.
 *
 * So the shape is the shape of somebody answering you: your sentence quoted, the
 * way it is usually said underneath it, and at most one calm line about why. What
 * to try next is an invitation, not a requirement. No warning colour, no score,
 * no badge.
 *
 * `original` is the learner's own line when the caller knows it. Without it the
 * quote is simply omitted rather than faked.
 */
export function TutorFeedback({ feedback, original = null, compact = false }) {
  const { t } = useApp()
  if (!feedback) return null
  const { correction, why, suggestion, translation } = feedback
  const hasAny = correction || why || suggestion || translation
  if (!hasAny) return null

  return (
    <div className="flex flex-col gap-2 mt-2.5" style={{ maxWidth: compact ? '100%' : '86%' }}>
      {correction && (
        <div className="correction-card">
          {original && (
            <p lang="en" dir="ltr" className="correction-quote" style={{ fontSize: '0.8125rem' }}>
              {original}
            </p>
          )}
          <p lang="en" dir="ltr" className="correction-natural" style={{ fontSize: '0.9375rem', marginTop: original ? 3 : 0 }}>
            {correction}
          </p>
          {why && <p className="correction-why" style={{ marginTop: 5 }}>{why}</p>}
        </div>
      )}

      {/* A "why" with no correction attached is still worth one quiet line. */}
      {!correction && why && (
        <div className="note-why">
          <span style={{ color: 'var(--text)', lineHeight: 1.5 }}>{why}</span>
        </div>
      )}

      {suggestion && (
        <div className="chip-try">
          <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {t('tryNext')}
          </span>
          <span lang="en" dir="ltr" style={{ color: 'var(--text)' }}>{suggestion}</span>
        </div>
      )}

      {translation && (
        <div className="chip-translation">
          <p className="eyebrow" style={{ marginBottom: 3 }}>{t('inEnglish')}</p>
          <p lang="en" dir="ltr" style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>{translation}</p>
        </div>
      )}
    </div>
  )
}
