/*
 * How the CHAT looks. Not what the learner is learning.
 *
 * This is deliberately its own small store, separate from the learner model, the
 * captured facts and the interests: choosing a sage bubble says nothing about
 * anybody's English, and it must never be able to move a mastery record or bump a
 * model version. It lives in one localStorage key, it is sanitised on read, and an
 * unknown value falls back to the default rather than reaching the DOM.
 *
 * The options are the ones the design draws (frames 2l / 2m): a background, the
 * colour of the learner's own bubbles, the text size, and whether it is night.
 * There is no free-form colour picker — an arbitrary hex would break contrast in
 * one theme or the other, and nothing in the design offers one.
 */

const KEY = 'lc2-chat-appearance-v1'

/* Backgrounds: paper, soft dots, or Chatto as wallpaper at a very low ink. */
export const CHAT_BACKGROUNDS = ['paper', 'dots', 'chatto']
/* Bubble colours: the identity's own, all of them contrast-checked in both themes. */
export const CHAT_BUBBLES = ['terracotta', 'sage', 'ink']
/* Text sizes: the design's three. */
export const CHAT_TEXT_SIZES = ['normal', 'large', 'huge']

export const DEFAULT_CHAT_APPEARANCE = {
  background: 'paper',
  bubble: 'terracotta',
  textSize: 'normal',
  /* Two switches the design shows beside the visual ones. */
  alwaysTranslate: false,
  chattoReactions: true,
}

const oneOf = (list, value, fallback) => (list.includes(value) ? value : fallback)

/**
 * Coerce anything at all into a valid appearance. Hand-edited storage, a value
 * from an older build, or a half-written object all resolve to something safe.
 */
export function sanitizeChatAppearance(raw) {
  const input = raw && typeof raw === 'object' ? raw : {}
  return {
    background: oneOf(CHAT_BACKGROUNDS, input.background, DEFAULT_CHAT_APPEARANCE.background),
    bubble: oneOf(CHAT_BUBBLES, input.bubble, DEFAULT_CHAT_APPEARANCE.bubble),
    textSize: oneOf(CHAT_TEXT_SIZES, input.textSize, DEFAULT_CHAT_APPEARANCE.textSize),
    alwaysTranslate: input.alwaysTranslate === true,
    chattoReactions: input.chattoReactions !== false,
  }
}

export function loadChatAppearance() {
  try {
    return sanitizeChatAppearance(JSON.parse(localStorage.getItem(KEY) || 'null'))
  } catch {
    return { ...DEFAULT_CHAT_APPEARANCE }
  }
}

export function saveChatAppearance(appearance) {
  const clean = sanitizeChatAppearance(appearance)
  try { localStorage.setItem(KEY, JSON.stringify(clean)) } catch {}
  return clean
}

/*
 * The style the conversation surface should wear. Returned as CSS custom
 * properties so the bubbles and the composer read one source and the sheet's live
 * preview can wear the same thing without duplicating the mapping.
 *
 * The Chatto wallpaper is the official artwork, tiled, at 6 % ink — under the
 * design's 8 % ceiling, so text never has to fight it — and it is never mirrored.
 */
export function chatAppearanceStyle(appearance, { chattoUrl } = {}) {
  const clean = sanitizeChatAppearance(appearance)
  const bubble = clean.bubble === 'sage' ? 'var(--positive)'
    : clean.bubble === 'ink' ? 'var(--info)'
      : 'var(--accent)'
  const fontSize = clean.textSize === 'huge' ? '1.0625rem'
    : clean.textSize === 'large' ? '1rem'
      : '0.9375rem'

  const style = {
    '--chat-bubble': bubble,
    '--chat-font-size': fontSize,
  }

  if (clean.background === 'dots') {
    style.backgroundImage = 'radial-gradient(var(--border-strong) 1px, transparent 1px)'
    style.backgroundSize = '18px 18px'
  } else if (clean.background === 'chatto' && chattoUrl) {
    style.backgroundImage = `url(${chattoUrl})`
    style.backgroundSize = '108px'
    style.backgroundRepeat = 'repeat'
    /* the wallpaper is barely there; the conversation stays the protagonist */
    style.backgroundBlendMode = 'luminosity'
    style.opacity = 1
    style['--chat-wallpaper-ink'] = '0.06'
  }

  return style
}
