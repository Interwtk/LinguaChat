#!/usr/bin/env node
/*
 * check-learning-content — verifies that pedagogical DATA (not just interface
 * strings) is localized by the learner's native language.
 *
 * It imports the data modules directly (they are pure ESM data, no side effects)
 * and checks:
 *   - every seed vocab item + phrase-of-day has a `meaning` for all required langs
 *   - Japanese meanings actually contain Japanese, Arabic contains Arabic — this
 *     catches the exact bug where a ja/ar learner saw Spanish meanings
 *   - no unknown language codes leak into meaning maps
 *   - every mission exposes display keys (title/desc/skill/type) and every
 *     last-mistake exposes a topicKey, so skills/topics follow interface language
 *
 * Exits 1 if any required pedagogical content is missing or looks un-localized.
 *
 *   node scripts/check-learning-content.mjs
 */
import { SEED_VOCAB } from '../src/data/vocabulary.js'
import { PHRASES_OF_DAY, LAST_MISTAKES } from '../src/data/mockData.js'
import { PRACTICE_MISSIONS } from '../src/data/practiceMissions.js'

const REQUIRED_LANGS = ['en', 'es', 'pt', 'fr', 'it', 'de', 'ja', 'ar']
const KNOWN = new Set(REQUIRED_LANGS)
const hasJapanese = (s) => /[぀-ヿ一-鿿]/.test(s)
const hasArabic = (s) => /[؀-ۿ]/.test(s)

const errors = []

function checkMeaning(label, meaning) {
  if (!meaning || typeof meaning !== 'object') {
    errors.push(`${label}: missing meaning map`)
    return
  }
  for (const lang of REQUIRED_LANGS) {
    if (!meaning[lang] || !String(meaning[lang]).trim()) errors.push(`${label}: missing meaning.${lang}`)
  }
  for (const lang of Object.keys(meaning)) {
    if (!KNOWN.has(lang)) errors.push(`${label}: unknown language '${lang}'`)
  }
  // Native-language leak guard: ja must read as Japanese, ar as Arabic.
  if (meaning.ja && !hasJapanese(meaning.ja)) errors.push(`${label}: ja meaning is not Japanese (leak?): "${meaning.ja}"`)
  if (meaning.ar && !hasArabic(meaning.ar)) errors.push(`${label}: ar meaning is not Arabic (leak?): "${meaning.ar}"`)
}

// Seed vocabulary
for (const item of SEED_VOCAB) {
  if (!item.id) { errors.push('vocab item without id'); continue }
  if (!item.term) errors.push(`vocab ${item.id}: missing term`)
  if (!item.kind) errors.push(`vocab ${item.id}: missing kind`)
  checkMeaning(`vocab ${item.id}`, item.meaning)
}

// Phrase of the day
for (const p of PHRASES_OF_DAY) {
  if (!p.phrase) errors.push('phrase-of-day without target phrase')
  checkMeaning(`phrase "${p.phrase}"`, p.meaning)
}

// Missions must expose localizable display keys (backend keeps English canonical)
for (const m of PRACTICE_MISSIONS) {
  for (const key of ['titleKey', 'descKey', 'skillKey', 'typeKey']) {
    if (!m[key]) errors.push(`mission ${m.id}: missing ${key}`)
  }
}

// Last mistakes must expose a topicKey so the skill name follows interface language
for (const lm of LAST_MISTAKES) {
  if (!lm.topicKey) errors.push(`last-mistake "${lm.topic}": missing topicKey`)
}

const vocabCount = SEED_VOCAB.length
console.log(`\nlearning-content check — ${vocabCount} vocab items, ${PHRASES_OF_DAY.length} phrases, ${PRACTICE_MISSIONS.length} missions`)
console.log(`required native languages: ${REQUIRED_LANGS.join(', ')}\n`)

if (errors.length) {
  console.log(`FAIL — ${errors.length} issue(s):`)
  for (const e of errors) console.log('  - ' + e)
  console.log('')
  process.exit(1)
}

console.log('OK — all pedagogical content is localized for every native language.\n')
process.exit(0)
