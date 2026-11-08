#!/usr/bin/env node
/*
 * check-premium-practice — the first Premium feature, built but NOT for sale.
 *
 * Proves: extra practice is built from the existing course planner (reviews
 * brought forward, the frequent error, a transfer turn), never a new lesson
 * and never a reward; each block differs; nothing to practise means no block;
 * the browser opens a block only on the server's exact "granted: true", and
 * fails closed on anything else (refusal, error, no connection); no browser
 * flag says "premium"; the screen shows nothing while the server says Premium
 * is not available; free features stay free.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ES_SKELETON } from '../src/learning/courses/es/skeleton.js'
import { buildCourseSessionPlan, buildExtraPracticePlan } from '../src/learning/courses/courseSession.js'
import { createLearnerModel, recordItemAttempt, setEpisodeState, markRecurringError } from '../src/learning/engine/learnerModel.js'
import { premiumStatus, authorizeExtraBlock, PREMIUM_PASS_KEY } from '../src/services/api.js'
import { FREE_PLAN, PREMIUM_PLAN, LATER } from '../src/services/pricing.js'

let passed = 0
const ok = (cond, msg) => { assert.ok(cond, msg); passed++ }
const DAY = 86400000
const T0 = Date.UTC(2026, 10, 3, 9)

// nothing learned yet: nothing to practise
ok(buildExtraPracticePlan(createLearnerModel(), 'es', { atMs: T0 }) === null, 'a new learner gets no extra block')

const m = createLearnerModel()
for (const ep of ES_SKELETON.slice(0, 6)) setEpisodeState(m, ep.id, { status: 'completed', awarded: true })
for (const id of ['es:me_llamo', 'es:como_te_llamas', 'es:estoy_bien', 'es:soy_de', 'es:no_entiendo', 'es:mucho_gusto']) {
  recordItemAttempt(m, id, { correct: true, independent: true, atMs: T0 - 3 * DAY })
}
markRecurringError(m, 'es:es_ser_estar_feeling'); markRecurringError(m, 'es:es_ser_estar_feeling')
recordItemAttempt(m, 'hello', { correct: true, independent: true, atMs: T0 - 3 * DAY })

const today = buildCourseSessionPlan(m, 'es', { atMs: T0, durationMode: 'deep' })
const plans = [0, 1, 2].map(blockIndex => buildExtraPracticePlan(m, 'es', { atMs: T0, blockIndex, todayPlan: today }))
ok(plans.every(Boolean), 'a learner with completed lessons gets extra blocks')
const kinds = new Set(plans.flatMap(p => p.blocks.map(b => b.type)))
ok(!kinds.has('course_episode'), 'extra practice never starts a new lesson (lessons stay free)')
ok([...kinds].every(k => ['course_review', 'course_retry', 'course_transfer', 'session_completion'].includes(k)), 'only practice blocks from the existing planner')
ok(plans.every(p => p.extra === true && p.courseId === 'es' && p.id.includes(':extra:')), 'marked as extra, owned by the course')
ok(new Set(plans.map(p => p.id)).size === 3, 'each block has its own id')
ok(JSON.stringify(plans[0].blocks) !== JSON.stringify(plans[1].blocks), 'consecutive blocks are not the same practice')
const todayItems = new Set(today.blocks.map(b => b.payload?.itemId).filter(Boolean))
ok(plans.every(p => p.blocks.every(b => !todayItems.has(b.payload?.itemId))), "today's session reviews are not repeated")
ok(plans.every(p => p.blocks.some(b => b.type === 'course_retry' && b.payload.evalKind === 'es_answer_wellbeing')), 'the frequent error is practised')
ok(plans.every(p => p.blocks.every(b => !b.payload?.itemId || b.payload.itemId.startsWith('es:'))), 'no English item is practised in the Spanish course')
ok(JSON.stringify(buildExtraPracticePlan(m, 'es', { atMs: T0, blockIndex: 1, todayPlan: today })) === JSON.stringify(plans[1]), 'deterministic: a reload builds the same block')

// the server's word, fail closed
const respond = (body, okStatus = true) => { globalThis.fetch = async () => ({ ok: okStatus, json: async () => body }) }
respond({ available: false, extra_blocks_per_day: 3 })
ok((await premiumStatus()).available === false, 'server says not available: not available')
respond({ available: 'true' })
ok((await premiumStatus()).available === false, 'anything but a literal true is not available')
globalThis.fetch = async () => { throw new TypeError('offline') }
ok((await premiumStatus()).available === false, 'no connection: not available')
ok((await authorizeExtraBlock({ passToken: 'x', course: 'es', block: 0 })).granted === false, 'no connection: not granted')
respond({ granted: 'true' })
ok((await authorizeExtraBlock({ passToken: 'x', course: 'es', block: 0 })).granted === false, 'a non-boolean grant is not a grant')
respond({ granted: true, blocks_left: 2 }, false)
ok((await authorizeExtraBlock({ passToken: 'x', course: 'es', block: 0 })).granted === false, 'an error status is not a grant')
respond({ granted: false, reason: 'expired' })
ok((await authorizeExtraBlock({ passToken: 'x', course: 'es', block: 0 })).reason === 'expired', 'expiry is reported as such')
respond({ granted: true, blocks_left: 2 })
ok((await authorizeExtraBlock({ passToken: 'x', course: 'es' })).granted === false, 'a grant without the block the server allocated is not a grant')
respond({ granted: true, block: 1, blocks_left: 1 })
const yes = await authorizeExtraBlock({ passToken: 'x', course: 'es' })
ok(yes.granted === true && yes.block === 1, 'the server yes is a yes, for the block it allocated')
let sent = null
globalThis.fetch = async (_url, init) => { sent = JSON.parse(init.body); return { ok: true, json: async () => ({ granted: true, block: 0, blocks_left: 2 }) } }
await authorizeExtraBlock({ passToken: 'x', course: 'es' })
ok(!('block' in sent), 'the screen asks for "the next block": the server allocates it')

// the browser keeps no flag of its own
const src = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8')
const ui = src('components/today/ExtraPractice.jsx')
ok(/if \(!status\?\.available\) return null/.test(ui), 'nothing is shown while Premium is not available (no teaser, no lock)')
ok(/if \(answer\.granted !== true\)/.test(ui) && ui.indexOf('answer.granted !== true') < ui.indexOf('buildExtraPracticePlan(model'), 'a block is built only after the server granted it')
ok(/blockIndex: answer\.block/.test(ui), 'the block built is the one the server allocated')
ok(PREMIUM_PASS_KEY === 'lc2-premium-pass' && !/setItem\(/.test(ui), 'the screen stores nothing; the only kept value is the server pass')
const all = ['services/api.js', 'components/today/ExtraPractice.jsx', 'components/today/CourseToday.jsx', 'learning/courses/courseSession.js', 'services/pricing.js'].map(src).join('\n')
ok(!/isPremium|premium:\s*true|lc2-premium(?!-pass)/.test(all), 'no "isPremium" flag anywhere in the browser')
ok(/persist=\{!running\.extra\}/.test(src('components/today/CourseToday.jsx')), "an extra block never overwrites today's saved session")
ok(!/\bxp\b|awardXp|addXp/i.test(src('components/today/CourseSession.jsx')), 'practice turns award no points: no repeated rewards')
ok(/session\.status === 'completed' && <ExtraPractice/.test(src('components/today/CourseToday.jsx')), "offered only after today's free session is done")

// free stays free, Premium is still not for sale
ok(PREMIUM_PLAN.available === false, 'Premium is not for sale')
ok(['lessons', 'corrections', 'reviews', 'dataControl'].every(p => FREE_PLAN.features.some(f => f.proof === p)), 'lessons, corrections, reviews and data controls stay in the free plan')
ok(LATER[0] === 'planLaterExtraPractice', 'the plans page lists extra practice as "in testing, not for sale"')
const api = readFileSync(new URL('../../api/index.py', import.meta.url), 'utf8')
ok(/os\.environ\['LINGUACHAT_PREMIUM_ENABLED'\] = 'false'/.test(api), 'the Preview deployment forces Premium off')

console.log(`check-premium-practice: ${passed} passed, 0 failed`)
