#!/usr/bin/env node
/*
 * check-archive-honesty — what the learner sees about their own past (P3).
 *
 * The conversation archive used to show six invented conversations to a new
 * learner and a mood, a "+N pts" badge and a confidence figure for every day.
 * Practice missions spoke Spanish to every interface language and could show
 * an idea in the learner's language as "the correct English". The primary
 * button and the learner's bubble read at 2.6:1 in dark mode.
 *
 * This proves, with the real modules and real storage paths: an empty history
 * is empty; real days come only from real turns; tabs merge; a reset and an
 * account switch leave nothing behind; old stored days still read; missions
 * speak each of the eight languages; and the dark-mode contrast is computed.
 *
 * Run: node scripts/check-archive-honesty.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { archiveDays, mostPracticedTopic } from '../src/services/conversationArchive.js'
import { createEmptyProgress, recordPractice, mergeLocalProgress, saveLocalProgress, loadLocalProgress } from '../src/services/localProgress.js'
import { activateLocalAccount } from '../src/auth/browserDataIsolation.js'
import { captureLearnerAccess } from '../src/auth/localLease.js'
import * as missions from '../src/services/missions.js'
import { PRACTICE_MISSIONS } from '../src/data/practiceMissions.js'
import { loadLocale, translate, SUPPORTED_LOCALES } from '../src/i18n/translations.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const read = p => readFileSync(ROOT + p, 'utf8')
let passed = 0
const failures = []
async function scenario(name, run) {
  try { await run(); passed++; console.log('  ok  ' + name) }
  catch (error) { failures.push(name); console.log('  FAIL ' + name + '\n       ' + String(error.message).split('\n')[0]) }
}
class Store {
  constructor() { this.values = new Map() }
  get length() { return this.values.size }
  key(i) { return [...this.values.keys()][i] ?? null }
  getItem(k) { return this.values.has(String(k)) ? this.values.get(String(k)) : null }
  setItem(k, v) { this.values.set(String(k), String(v)) }
  removeItem(k) { this.values.delete(String(k)) }
}
const DAY = 86400000
const now = Date.now()
const turn = (p, text, at, response = { mode: 'chat', reply: 'ok' }) => recordPractice(p, { userMessage: text, response, at })

await scenario('a new learner sees an empty archive — nothing invented', () => {
  const days = archiveDays(createEmptyProgress())
  assert.deepEqual(days, [])
  assert.equal(mostPracticedTopic(days), null)
  // code only: the file's comments describe what was removed
  const component = read('src/components/archive/ConversationArchive.jsx').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.ok(!/MOCK|London|interview|moodLabel|ConfidenceBadge|confidencePtsGained|\bpts\b|'Past tense'|Weekend hobbies/.test(component),
    'the component still carries invented content')
  assert.match(component, /archiveEmptyTitle/, 'and it has an honest empty state')
  // the path section on "Tú": a fixed "Level 3", minutes invented from message
  // counts, and days counted as missions
  const rail = read('src/components/layout/JourneyRail.jsx').replace(/\/\*[\s\S]*?\*\//g, '')
  assert.ok(!/t\('level'\)\} 3|minutesToday|\|\| sessionsTotal|'Learner'/.test(rail), 'the path rail invents a figure')
})

await scenario('real days come only from real turns, with what was really said', () => {
  let p = createEmptyProgress()
  p = turn(p, 'I want to travel to Rome by train', now - 2 * DAY)
  p = turn(p, 'Yesterday I goed to school', now - 2 * DAY + 60000, { mode: 'chat', reply: 'ok', correction: 'Yesterday I went to school.' })
  p = turn(p, 'I like cooking pasta', now)
  const days = archiveDays(p)
  assert.equal(days.length, 2, 'two learning days, not six conversations')
  assert.ok(days[0].day > days[1].day, 'newest first')
  const older = days[1]
  assert.equal(older.yourMessages, 2, 'the learner wrote two messages that day')
  assert.deepEqual([...older.topics].sort(), ['grammar', 'travel'])
  assert.equal(older.lastLine, 'Yesterday I goed to school')
  assert.match(older.correction, /Yesterday I goed to school -> Yesterday I went to school\./)
  assert.deepEqual(Object.keys(older).sort(), ['correction', 'day', 'lastLine', 'topics', 'yourMessages'],
    'no mood, score or confidence is produced')
  // "cooking" is not one of the ledger's keywords: that day is plain conversation,
  // so the most practised topic is a real one from the older day (ties: by name)
  assert.deepEqual(mostPracticedTopic(days), { id: 'grammar', days: 1 })
})

await scenario('days written by an older version still read; their invented fields are ignored', () => {
  const legacy = { sessions: [
    { id: '2026-10-20', date: '2026-10-20', topic: 'Travel', mood: 'LC', moodLabel: 'Practicing', confidence: 9, messages: 6, preview: 'I go to Paris', tags: ['travel'], correction: null },
    { id: 'garbage', date: 'not-a-day', messages: 99 },
    { id: '2026-10-20', date: '2026-10-20', messages: 2, tags: ['work'] },
  ] }
  const days = archiveDays(legacy)
  assert.equal(days.length, 1, 'a malformed or duplicated day is not shown twice')
  assert.equal(days[0].yourMessages, 3)
  assert.ok(!('mood' in days[0]) && !('confidence' in days[0]))
})

await scenario('two tabs’ turns end up in the same days; a reset empties the archive', () => {
  let a = createEmptyProgress(), b = createEmptyProgress()
  a = turn(a, 'I eat breakfast', now - DAY)
  b = turn(b, 'I work in an office', now - DAY + 1000)
  b = turn(b, 'Tonight I feel tired', now)
  const merged = mergeLocalProgress(a, b)
  const days = archiveDays(merged)
  assert.equal(days.length, 2)
  assert.equal(days.reduce((n, d) => n + d.yourMessages, 0), 3, 'every turn of both tabs is counted once')
  assert.deepEqual(archiveDays(createEmptyProgress({ reset: true })), [])
})

await scenario('an account switch A→B→A never shows one learner’s days to another', () => {
  const shared = new Store()
  globalThis.localStorage = shared; globalThis.sessionStorage = new Store()
  activateLocalAccount(shared, 'learner-A')
  let pa = turn(loadLocalProgress(), 'I like football', now)
  assert.notEqual(saveLocalProgress(pa, { access: captureLearnerAccess(shared) }), false)
  activateLocalAccount(shared, 'learner-B')
  assert.deepEqual(archiveDays(loadLocalProgress()), [], 'B starts empty')
  let pb = turn(loadLocalProgress(), 'I study chemistry', now)
  assert.notEqual(saveLocalProgress(pb, { access: captureLearnerAccess(shared) }), false)
  activateLocalAccount(shared, 'learner-A')
  const back = archiveDays(loadLocalProgress())
  assert.equal(back.length, 1)
  assert.equal(back[0].lastLine, 'I like football', 'A sees only A')
})

await scenario('missions speak every interface language; no Spanish leaks elsewhere', async () => {
  assert.equal(SUPPORTED_LOCALES.length, 8)
  // unambiguously Spanish ("Vamos" and "pista" are also Portuguese/Italian)
  const SPANISH = /\b(Elige|Escribe|Corrige|Responde|Probemos|Mision|misión|Mira esta pista|frase util|Buen intento|Quiero viajar|No entiendo)\b/
  for (const code of SUPPORTED_LOCALES) {
    await loadLocale(code)
    const t = (key, values) => translate(code, key, values)
    for (const mission of PRACTICE_MISSIONS) {
      const intro = missions.createMissionIntroMessage(mission, false, t)
      const texts = [intro.text, intro.feedback.suggestion, intro.feedback.focus]
      for (const [i, step] of mission.steps.entries()) {
        const details = { mission, step, currentStepNumber: i + 1, totalSteps: mission.steps.length, progressPercent: 0 }
        texts.push(missions.createMissionStepMessage(details, t).text)
        const wrong = missions.evaluateMissionStep(step, 'zzz', t)
        const right = missions.evaluateMissionStep(step, step.type === 'choose_option' ? step.expectedPattern : step.expectedPattern.split('|')[0], t)
        assert.equal(right.passed, true, `${mission.id}/${step.id}: the expected answer still passes`)
        assert.equal(wrong.passed, false)
        texts.push(wrong.feedback, wrong.explanation, wrong.nextSuggestion, right.feedback,
          missions.createMissionFeedbackMessage(mission, step, wrong, 5, t).text)
        // a correction is English material or nothing — never the learner-language idea
        if (wrong.correction) {
          // (in the English interface the idea and the model can coincide)
          assert.ok(code === 'en' || !step.promptKey || wrong.correction !== t(step.promptKey), `${step.id}: L1 prompt shown as the correction`)
          assert.ok(/^[\x20-\x7E’]+$/.test(wrong.correction), `${code} ${step.id}: correction is not English: ${wrong.correction}`)
        }
      }
      texts.push(missions.createMissionCompleteMessage(mission, { earnedXp: 40 }, t).text)
      for (const text of texts) {
        assert.ok(text && !/\{[a-z]+\}/.test(text), `${code} ${mission.id}: unfilled placeholder in "${text}"`)
        assert.ok(!/\bm[A-Z][A-Za-z0-9]+(Instr|Prompt|Hint)\b|\bmission[A-Z][A-Za-z]+\b/.test(text), `${code}: raw key in "${text}"`)
        if (code !== 'es') assert.ok(!SPANISH.test(text), `${code} ${mission.id}: Spanish in "${text}"`)
      }
    }
  }
  const data = read('src/data/practiceMissions.js')
  assert.ok(!/instruction: |feedbackHint: /.test(data), 'Spanish step text is back in the data')
  const context = read('src/context/AppContext.jsx')
  assert.ok(!/Salimos de la mision|Mision completada/.test(context))
  assert.match(context, /prompt: details\.step\.model \|\| \(details\.step\.promptKey \? null : details\.step\.prompt\)/,
    'the backend only ever receives English material as the prompt it echoes')
})

await scenario('dark mode: text on the accent is readable (computed, ≥ 4.5:1)', () => {
  const css = read('src/index.css')
  const block = sel => css.slice(css.indexOf(sel + ' {'), css.indexOf('}', css.indexOf(sel + ' {')))
  const hex = (src, name) => (src.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`)) || [])[1]
  const lum = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0)
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, k) => k - m); return (x + 0.05) / (y + 0.05) }
  const dark = block('.dark')
  const ink = hex(dark, 'on-accent')
  for (const fill of ['accent', 'accent-strong', 'positive', 'info']) {
    assert.ok(ratio(hex(dark, fill), ink) >= 4.5, `dark ${fill} vs on-accent: ${ratio(hex(dark, fill), ink).toFixed(2)}`)
  }
  assert.match(css, /\.btn-primary \{[\s\S]*?color: var\(--on-accent\)/, 'the primary button uses the token')
  assert.match(css, /\.bubble-user \{[\s\S]*?color: var\(--on-accent\)/, 'so does the learner’s bubble')
})

console.log(`\ncheck-archive-honesty — ${passed} passed, ${failures.length} failed`)
if (failures.length) process.exit(1)
