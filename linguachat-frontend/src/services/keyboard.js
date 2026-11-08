/*
 * Enter that means "send" — not the Enter that confirms an input-method
 * composition (Japanese, Chinese, Korean…).
 *
 * While a composition is open the browser marks the key event `isComposing`.
 * Safari ends the composition before the confirming keydown arrives, so that
 * Enter has `isComposing: false` but still carries keyCode 229 ("processed by
 * the IME"). Either one means the learner is choosing characters, not sending.
 *
 * `allowShift` keeps the old behaviour of single-line fields, where
 * Shift+Enter also submits; a multi-line composer leaves it off so
 * Shift+Enter can break a line.
 */
export function isSubmitEnter(event, { allowShift = false } = {}) {
  if (!event || event.key !== 'Enter') return false
  if (!allowShift && event.shiftKey) return false
  const native = event.nativeEvent || event
  if (native.isComposing || event.isComposing) return false
  if (native.keyCode === 229 || event.keyCode === 229) return false
  return true
}
