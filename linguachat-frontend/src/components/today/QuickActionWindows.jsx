import { useApp } from '../../context/AppContext'

/*
 * QuickActionWindows — "at hand".
 *
 * A small contextual surface on Home for the four things a learner opens most.
 * Every action calls a function the product already has: the session the planner
 * has prepared, the practice room, the words they have met, the conversations
 * they have had. NOTHING here is decorative — a tile that looks pressable and
 * does nothing is worse than no tile, and a tile for a feature that does not
 * exist yet is not offered at all.
 *
 * Labels are always visible. Icons help people who already know the app; the
 * words are what make it usable for somebody who does not, or who cannot read
 * a 16-pixel glyph. They are also deliberately SHORT — a two-up grid at 390px
 * turns a long label into three lines, and the hint underneath is where the
 * explaining belongs.
 */
function Icon({ type }) {
  const common = {
    width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round',
    'aria-hidden': 'true',
  }
  if (type === 'session') return <svg {...common}><path d="M8 5.5v13l10-6.5z" /></svg>
  if (type === 'practice') return <svg {...common}><path d="M21 14.5a2 2 0 0 1-2 2H8l-4 3.5V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" /></svg>
  if (type === 'words') return <svg {...common}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
  if (type === 'notes') return <svg {...common}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>
  return <svg {...common}><path d="M3 6.5A2 2 0 0 1 5 4.5h4l2 2.5h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
}

export function QuickActionWindows({ sessionStarted = false, onOpenNotes }) {
  const { t, beginSession, navigateTo } = useApp()

  const actions = [
    {
      id: 'session',
      label: sessionStarted ? t('sessionContinueCta') : t('sessionStartCta'),
      hint: t('quickSessionHint'),
      onClick: beginSession,
    },
    {
      id: 'practice',
      label: t('practice'),
      hint: t('quickPracticeHint'),
      onClick: () => navigateTo('practice'),
    },
    {
      id: 'words',
      label: t('yourWordsNav'),
      hint: t('quickWordsHint'),
      onClick: () => navigateTo('memory-garden'),
    },
    /*
     * The fourth tile is the notes on a phone (where they live in a sheet) and
     * the conversation archive on a laptop (where the notes are already a panel
     * on the right, so offering them again would be a duplicate).
     */
    onOpenNotes
      ? { id: 'notes', label: t('notes'), hint: t('quickNotesHint'), onClick: onOpenNotes }
      : { id: 'archive', label: t('conversationArchive'), hint: t('quickArchiveHint'), onClick: () => navigateTo('archive') },
  ]

  return (
    <section className="quick-window" aria-labelledby="quick-access-title">
      <p className="eyebrow" id="quick-access-title" style={{ marginBottom: 12 }}>{t('quickAccess')}</p>
      <div className="quick-window-grid">
        {actions.map(action => (
          <button key={action.id} type="button" className="quick-action" onClick={action.onClick}>
            <span className="quick-action-icon"><Icon type={action.id} /></span>
            <span style={{ minWidth: 0 }}>
              <strong>{action.label}</strong>
              <small>{action.hint}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default QuickActionWindows
