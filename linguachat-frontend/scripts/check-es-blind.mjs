#!/usr/bin/env node
/*
 * check-es-blind — the Spanish evaluator on sentences written by an author who
 * never saw its rules. Measures; does not approve. It fails only if the set is
 * missing or changed, never because a percentage moved.
 *
 *   node scripts/check-es-blind.mjs                aggregates of the sealed set
 *   node scripts/check-es-blind.mjs --dev --show   the development set, misses shown
 *
 * `es-blind-holdout.jsonl` is sealed: aggregates only, no rule is written from it.
 * AI-written imitation of learners. It is not a native teacher's review.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { evaluateSpanish } from '../src/learning/courses/es/evaluator.js'

const HOLDOUT_SHA256 = 'cfe8b9ade1bfdd01eb0dc860acdfcc9c0dd54cd860456c02cda07bf554261cdb'
const dev = process.argv.includes('--dev')
const show = process.argv.includes('--show')
if (show && !dev) { console.error('the holdout is sealed: aggregates only'); process.exit(2) }

const raw = readFileSync(new URL(`./fixtures/es-blind-${dev ? 'dev' : 'holdout'}.jsonl`, import.meta.url))
if (!dev && createHash('sha256').update(raw).digest('hex') !== HOLDOUT_SHA256) { console.error('the sealed set changed'); process.exit(1) }
const items = raw.toString('utf8').split('\n').filter(Boolean).map(line => JSON.parse(line))

const verdictOf = (item) => {
  const r = evaluateSpanish(item.kind, item.text, { independent: true, ...(item.context || {}) })
  return r.completedObjective ? 'accepted' : r.notEvaluable || r.conclusive === false ? 'not_evaluable' : 'corrected'
}
const rows = items.map(item => ({ item, verdict: verdictOf(item) }))
const pct = (n, d) => (d ? `${(100 * n / d).toFixed(1)}%` : 'n/a')
const count = (list, verdict) => list.filter(r => r.verdict === verdict).length
const summary = (list) => {
  const good = list.filter(r => r.item.expect === 'accept')
  const bad = list.filter(r => r.item.expect === 'reject')
  return { good: good.length, accepted: pct(count(good, 'accepted'), good.length), falseCorrections: pct(count(good, 'corrected'), good.length),
    bad: bad.length, caught: pct(count(bad, 'corrected'), bad.length), wronglyAccepted: pct(count(bad, 'accepted'), bad.length), notEvaluable: pct(count(bad, 'not_evaluable'), bad.length) }
}
const all = summary(rows)
if (show) {
  for (const { item, verdict } of rows) {
    const fine = item.expect === 'unsure' || (item.expect === 'accept' ? verdict === 'accepted' : verdict === 'corrected')
    if (!fine) console.log(`${item.expect.padEnd(7)} ${verdict.padEnd(14)} ${item.kind} ${JSON.stringify(item.text)}`)
  }
}
for (const topic of [...new Set(items.map(i => i.topic))].sort()) {
  const s = summary(rows.filter(r => r.item.topic === topic))
  console.log(`  ${topic.padEnd(24)} valid accepted ${s.accepted} (${s.good}) · false corrections ${s.falseCorrections} · errors caught ${s.caught} (${s.bad}) · errors accepted ${s.wronglyAccepted}`)
}
console.log(`check-es-blind ${dev ? 'dev' : 'sealed'}: ${items.length} items · valid accepted ${all.accepted} · false corrections ${all.falseCorrections} · errors caught ${all.caught} · errors accepted ${all.wronglyAccepted} · errors not evaluable ${all.notEvaluable}`)
