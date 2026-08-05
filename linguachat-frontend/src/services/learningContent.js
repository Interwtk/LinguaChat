/*
 * learningContent — the seed vocabulary, looked up and localized.
 *
 * The language resolver itself lives in `localizedMeaning.js` and is re-exported
 * here: it is a pure function, and keeping it in this module meant every screen
 * that resolves a meaning also downloaded the entire catalogue. Home does that
 * before a learner has opened anything.
 */
import { SEED_VOCAB, SEED_VOCAB_BY_ID } from '../data/vocabulary'
import { getLocalizedMeaning } from './localizedMeaning'

export { getLocalizedMeaning }

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
