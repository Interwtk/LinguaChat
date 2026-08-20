/*
 * localizedMeaning — resolves the ONE auxiliary-language meaning for pedagogical
 * items.
 *
 * Fallback priority (never Spanish as a universal fallback):
 *   1. user_language full code   (e.g. ja-JP)
 *   2. user_language base        (e.g. ja)
 *   3. English
 *
 * Accepts a language info object ({ code, base }) or a plain string. There is
 * only ever one auxiliary language to resolve against: native and interface are
 * legacy names for the same `user_language` choice, so this never takes two.
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

export function getLocalizedMeaning(meaning, userLanguage) {
  if (!meaning) return ''
  if (typeof meaning === 'string') return meaning
  const candidates = [fullOf(userLanguage), baseOf(userLanguage), 'en']
  for (const code of candidates) {
    if (code && meaning[code]) return meaning[code]
  }
  // Last resort: English, then any available value — but never silently Spanish-first.
  return meaning.en || Object.values(meaning)[0] || ''
}

