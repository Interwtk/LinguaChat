/*
 * learningContent — resolves NATIVE-language meanings for pedagogical items.
 *
 * Fallback priority (never Spanish as a universal fallback):
 *   1. native full code   (e.g. ja-JP)
 *   2. native base        (e.g. ja)
 *   3. interface base     (e.g. the UI language)
 *   4. English
 *
 * Accepts language info objects ({ code, base }) or plain strings.
 */
import { SEED_VOCAB, SEED_VOCAB_BY_ID } from '../data/vocabulary'

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

export function getVocabItem(id) {
  return SEED_VOCAB_BY_ID[id] || null
}

// Returns seed vocab with the native-resolved meaning attached, ready to render.
export function getLocalizedVocab(nativeLanguage, interfaceLanguage) {
  return SEED_VOCAB.map(item => ({
    ...item,
    trans: getLocalizedMeaning(item.meaning, nativeLanguage, interfaceLanguage),
  }))
}
