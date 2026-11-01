import { useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { TutorNotes } from './TutorNotes'

/*
 * Lingua's notes on a phone.
 *
 * On a wide screen the notes sit in the conversation's side panel. Below that
 * breakpoint there is no side panel, and the "Lingua's notes" row in Chats
 * used to set a sheet that nothing ever drew — a button that did nothing.
 * This is that sheet: the same notes, opened only on request, never a global
 * panel. Escape, the backdrop and the close button dismiss it, and focus
 * returns to whatever opened it.
 */
export function NotesSheet({ onClose }) {
  const { t } = useApp()
  const closeRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Once per opening: a new onClose on every parent render must not move focus.
  useEffect(() => {
    const opener = document.activeElement
    closeRef.current?.focus()
    const onKey = (event) => { if (event.key === 'Escape') onCloseRef.current() }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      try { opener?.focus?.() } catch { /* the opener may be gone */ }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0" style={{ background: 'rgba(28,35,51,0.38)' }} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('tutorNotes')}
        className="relative animate-sheet-up flex flex-col"
        style={{
          background: 'var(--surface)',
          borderRadius: '22px 22px 0 0',
          borderTop: '1px solid var(--border)',
          width: '100%', height: 'min(84dvh, 680px)', zIndex: 1,
        }}
      >
        {/* The notes carry their own heading; this row only closes the sheet. */}
        <div className="flex items-center justify-between ps-5 pe-2 pt-2 flex-shrink-0">
          <span aria-hidden="true" style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--border)', marginInline: 'auto' }} />
          <button ref={closeRef} type="button" onClick={onClose} aria-label={t('close')}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 10, minWidth: 44, minHeight: 44 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div style={{ overflowY: 'auto', minHeight: 0, flex: 1 }}>
          <TutorNotes />
        </div>
      </div>
    </div>
  )
}

export default NotesSheet
