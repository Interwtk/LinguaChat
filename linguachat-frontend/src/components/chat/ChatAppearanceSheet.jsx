import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import chattoOfficial from '../../assets/chatto/gen/chatto-official-128.webp'
import {
  CHAT_BACKGROUNDS, CHAT_BUBBLES, CHAT_TEXT_SIZES,
  chatAppearanceStyle, sanitizeChatAppearance,
} from '../../services/chatAppearance'

/*
 * "Personalizar el chat" — frame 2l, and the result is frame 2m.
 *
 * Opened from Lingua's name in the conversation header. Everything is visible at
 * once, the preview at the top wears the choice as it is made, and Save closes and
 * keeps it. It edits ONLY appearance: the learner model, the captured facts and the
 * interests are not reachable from here, by construction.
 *
 * The controls are real radio groups rather than styled divs, so a keyboard and a
 * screen reader can work them.
 */

function RadioRow({ legend, options, value, onChange, renderOption }) {
  return (
    <fieldset style={{ border: 'none', marginBottom: 18 }}>
      <legend className="eyebrow" style={{ marginBottom: 9 }}>{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2">
        {options.map(option => {
          const selected = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className="tool-chip"
              style={selected
                ? { background: 'var(--accent-soft)', color: 'var(--accent-strong)', borderColor: 'var(--accent)' }
                : undefined}
            >
              {renderOption ? renderOption(option, selected) : option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function Switch({ label, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full"
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        padding: '11px 0', minHeight: 46, borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{ fontSize: '0.9375rem', color: 'var(--text)' }}>{label}</span>
      <span aria-hidden="true" style={{
        width: 42, height: 25, borderRadius: 999, flexShrink: 0,
        background: checked ? 'var(--accent)' : 'var(--surface-sunk)',
        border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
        position: 'relative', transition: 'background-color 0.18s ease',
      }}>
        <span style={{
          position: 'absolute', top: 2, insetInlineStart: checked ? 19 : 2,
          width: 19, height: 19, borderRadius: '50%', background: 'var(--surface)',
          transition: 'inset-inline-start 0.18s ease',
        }} />
      </span>
    </button>
  )
}

export function ChatAppearanceSheet({ onClose }) {
  const { t, chatAppearance, setChatAppearance, darkMode, toggleDark } = useApp()
  /* edited locally so the preview can move before anything is committed */
  const [draft, setDraft] = useState(() => sanitizeChatAppearance(chatAppearance))
  const set = (patch) => setDraft(previous => sanitizeChatAppearance({ ...previous, ...patch }))

  /* Escape closes it, like any sheet */
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const previewStyle = chatAppearanceStyle(draft, { chattoUrl: chattoOfficial })

  const backgroundLabel = {
    paper: t('chatBgPaper'), dots: t('chatBgDots'), chatto: t('chatBgChatto'),
  }
  const bubbleLabel = {
    terracotta: t('chatBubbleTerracotta'), sage: t('chatBubbleSage'), ink: t('chatBubbleInk'),
  }
  const sizeLabel = {
    normal: t('chatSizeNormal'), large: t('chatSizeLarge'), huge: t('chatSizeHuge'),
  }
  const swatch = (id) => (id === 'sage' ? 'var(--positive)' : id === 'ink' ? 'var(--info)' : 'var(--accent)')

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      <div className="absolute inset-0" style={{ background: 'rgba(28,35,51,0.38)' }} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('customizeChat')}
        className="relative animate-sheet-up"
        style={{
          background: 'var(--surface)',
          borderRadius: '22px 22px 0 0',
          borderTop: '1px solid var(--border)',
          width: '100%', maxWidth: 460, maxHeight: '88vh',
          overflowY: 'auto', zIndex: 1,
        }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3"
          style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)' }}>
          <p className="font-display" style={{ fontWeight: 700, fontSize: '1.0625rem', color: 'var(--ink)' }}>
            {t('customizeChat')}
          </p>
          <button type="button" onClick={onClose} aria-label={t('close')}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-5 pt-4 pb-5">
          {/* LIVE PREVIEW — the change is visible before it is saved */}
          <p className="eyebrow" style={{ marginBottom: 8 }}>{t('preview')}</p>
          <div className="chat-canvas rounded-2xl p-3 mb-5"
            style={{ ...previewStyle, border: '1px solid var(--border)', background: 'var(--surface-soft)' }}>
            <div className="chat-canvas-inner flex flex-col gap-2">
              <span className="bubble-lingua" lang="en" dir="ltr" style={{ alignSelf: 'flex-start', maxWidth: '86%' }}>
                Small or large?
              </span>
              <span className="bubble-user" lang="en" dir="ltr" style={{ alignSelf: 'flex-end', maxWidth: '86%' }}>
                Large, please
              </span>
            </div>
          </div>

          <RadioRow
            legend={t('chatBackground')}
            options={CHAT_BACKGROUNDS.map(id => ({ id, label: backgroundLabel[id] }))}
            value={draft.background}
            onChange={(id) => set({ background: id })}
          />

          <RadioRow
            legend={t('chatBubbleColor')}
            options={CHAT_BUBBLES.map(id => ({ id, label: bubbleLabel[id] }))}
            value={draft.bubble}
            onChange={(id) => set({ bubble: id })}
            renderOption={(option) => (
              <>
                <span aria-hidden="true" style={{
                  width: 13, height: 13, borderRadius: '50%', background: swatch(option.id), flexShrink: 0,
                }} />
                {option.label}
              </>
            )}
          />

          <RadioRow
            legend={t('chatTextSize')}
            options={CHAT_TEXT_SIZES.map(id => ({ id, label: sizeLabel[id] }))}
            value={draft.textSize}
            onChange={(id) => set({ textSize: id })}
          />

          <div style={{ borderTop: '1px solid var(--border)' }}>
            {/* the theme is a whole-app setting; the sheet offers it because the
                design does, and it takes effect immediately like everywhere else */}
            <Switch label={t('theme')} checked={darkMode} onChange={toggleDark} />
            <Switch label={t('alwaysTranslate')} checked={draft.alwaysTranslate}
              onChange={(value) => set({ alwaysTranslate: value })} />
            <Switch label={t('chattoReactions')} checked={draft.chattoReactions}
              onChange={(value) => set({ chattoReactions: value })} />
          </div>

          <button type="button" className="btn-primary w-full mt-5"
            onClick={() => { setChatAppearance(draft); onClose() }}>
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatAppearanceSheet
