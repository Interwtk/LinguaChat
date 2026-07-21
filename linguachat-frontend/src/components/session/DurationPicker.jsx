import { useApp } from '../../context/AppContext'
import { DURATION_MODES, DURATION_ORDER } from '../../learning/engine/session.js'

/*
 * Duration picker — a light inline radiogroup, not a settings screen.
 *
 * Real radio semantics (role="radiogroup" + role="radio" + aria-checked) so a
 * screen reader announces it as a choice and arrow keys move between options.
 * It works with keyboard, mouse and touch, and mirrors correctly in RTL because
 * it uses logical flex order rather than absolute positioning.
 */
export function DurationPicker({ disabled = false, onPick = null }) {
  const { t, preferredDuration, chooseDuration, nativeLanguageInfo } = useApp()
  const nativeLang = nativeLanguageInfo.base

  const pick = (mode) => {
    if (disabled) return
    chooseDuration(mode)
    if (onPick) onPick(mode)
  }

  const onKeyDown = (event, index) => {
    if (disabled) return
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    const back = event.key === 'ArrowLeft' || event.key === 'ArrowUp'
    if (!forward && !back) return
    event.preventDefault()
    const next = (index + (forward ? 1 : DURATION_ORDER.length - 1)) % DURATION_ORDER.length
    pick(DURATION_ORDER[next])
  }

  return (
    <div role="radiogroup" aria-label={t('sessionDurationLabel')} className="flex flex-wrap gap-2">
      {DURATION_ORDER.map((mode, index) => {
        const selected = preferredDuration === mode
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => pick(mode)}
            onKeyDown={(e) => onKeyDown(e, index)}
            lang={nativeLang}
            className="rounded-2xl px-3.5 py-2.5 text-left transition-all active:scale-[0.99]"
            style={{
              flex: '1 1 30%',
              minWidth: 116,
              minHeight: 60,
              background: selected ? 'var(--violet-soft)' : 'var(--bg-paper)',
              border: `1.5px solid ${selected ? 'var(--violet)' : 'var(--border)'}`,
              color: 'var(--ink)',
              opacity: disabled ? 0.55 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800 }}>{t(`sessionDuration_${mode}`)}</span>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--violet)' }}>
              {t('sessionMinutes', { minutes: DURATION_MODES[mode].minutes })}
            </span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--ink-muted)', lineHeight: 1.35, marginTop: 2 }}>
              {t(`sessionDurationHint_${mode}`)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default DurationPicker
