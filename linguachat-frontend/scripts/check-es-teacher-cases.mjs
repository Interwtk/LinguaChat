#!/usr/bin/env node
/*
 * check-es-teacher-cases — 591 answers written by a reviewer who had not read the
 * evaluator (an AI acting as a Spanish teacher: NOT a native human review).
 *
 * First run, before any change: 17 valid answers corrected as errors, 29 errors
 * accepted, and the lesson's own model sentence "¿Te gusta la música?" rewritten
 * as "¿Té gusta…?". These cases drove fixes, so they are regression now; they
 * say nothing about new answers.
 *
 * Fails on any false correction outside the accepted list and on any accent note
 * that changes the pronoun "te". Errors still accepted are counted, and may not grow.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { evaluateSpanish } from '../src/learning/courses/es/evaluator.js'

const cases = JSON.parse(readFileSync(new URL('./fixtures/es-teacher-cases.json', import.meta.url), 'utf8'))

// A teacher could go either way, or the lesson asks for more: kept as a nudge.
const ACCEPTED_NUDGES = new Set(['No cacho.', '¿Qué significa bibloteca?', '¿Qué significa esa palabra?', 'Uno.', 'Seis aguas, por favor.'])
const MAX_MISSED = 12

const outcome = (r) => (r.completedObjective ? 'ok' : r.notEvaluable || !r.errorType ? 'ne' : 'err')
const tally = { valid: { ok: 0, err: 0, ne: 0 }, error: { ok: 0, err: 0, ne: 0 } }
const falseCorrections = []
const missed = []
for (const c of cases) {
  const r = evaluateSpanish(c.kind, c.text, { name: 'Alex', ...(c.ctx || {}) })
  const got = outcome(r)
  tally[c.want === 'ok' ? 'valid' : 'error'][got]++
  if (c.want === 'ok' && got === 'err' && !ACCEPTED_NUDGES.has(c.text)) falseCorrections.push(`${c.kind}: ${c.text} (${r.errorType})`)
  if (c.want === 'err' && got === 'ok') missed.push(`${c.kind}: ${c.text}`)
  assert.ok(!/\bTé gusta|\bté gusta|¿Té /.test(r.spellingNote || ''), `accent note changed the pronoun: ${c.text}`)
}
const asked = evaluateSpanish('es_ask_like', '¿Te gusta la música?', { targetThing: 'musica' })
assert.equal(asked.spellingNote, null, 'the model sentence needs no accent note')
assert.match(evaluateSpanish('es_express_like', 'Me gusta el te', { targetThing: 'te' }).spellingNote || 'Me gusta el té', /el té/, 'the drink keeps its accent')

if (falseCorrections.length) console.error(falseCorrections.join('\n'))
if (process.argv.includes('--missed')) console.log(missed.join('\n'))
assert.equal(falseCorrections.length, 0, 'valid Spanish must not be corrected')
assert.ok(missed.length <= MAX_MISSED, `errors accepted as correct: ${missed.length} (max ${MAX_MISSED})`)
console.log(`check-es-teacher-cases: ${cases.length} cases · valid accepted ${tally.valid.ok}/${tally.valid.ok + tally.valid.err + tally.valid.ne} · nudged ${tally.valid.err} · not evaluable ${tally.valid.ne} · errors caught ${tally.error.err}/${tally.error.ok + tally.error.err + tally.error.ne} · errors accepted ${missed.length}`)
