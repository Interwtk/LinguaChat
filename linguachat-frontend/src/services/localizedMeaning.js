/*
 * localizedMeaning — resolves NATIVE-language meanings for pedagogical items.
 *
 * Fallback priority (never Spanish as a universal fallback):
 *   1. native full code   (e.g. ja-JP)
 *   2. native base        (e.g. ja)
 *   3. interface base     (e.g. the UI language)
 *   4. English
 *
 * Accepts language info objects ({ code, base }) or plain strings.
 */

function baseOf(lang) {
  if (!lang) return null
  const raw = typeof lang === 'string' ? lang : (lang.base || lang.code || '')
  return String(raw).split('-')[0].toLowerCase() || null
}

function fullOf(lang) {
  if (!lang) return null
  const raw = typeof lang === 'string' ? lang : (lang.code || lang.base || '')
  return String(raw).toLowerCase() || null
}

export function getLocalizedMeaning(meaning, nativeLanguage, interfaceLanguage) {
  if (!meaning) return ''
  if (typeof meaning === 'string') return meaning
  const candidates = [
    fullOf(nativeLanguage),
    baseOf(nativeLanguage),
    baseOf(interfaceLanguage),
    'en',
  ]
  for (const code of candidates) {
    if (code && meaning[code]) return meaning[code]
  }
  // Last resort: English, then any available value — but never silently Spanish-first.
  return meaning.en || Object.values(meaning)[0] || ''
}

