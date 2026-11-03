#!/usr/bin/env node
/*
 * check-learner-data — download and delete one's own data (services/learnerData.js),
 * with two real accounts sharing one browser (auth/localLease.js namespaces).
 *
 * Proves: the export contains every key of the asking account and nothing of
 * the other; deletion removes all of the asking account's keys and none of the
 * other's; a stale access (the account changed meanwhile) can neither read nor
 * delete; the privacy contact is never invented; the plans page lists only
 * features that exist (check-honest-plans, folded in here).
 */
import assert from 'node:assert/strict'
import { activateLocalAccount } from '../src/auth/browserDataIsolation.js'
import { learnerStorage, captureLearnerAccess } from '../src/auth/localLease.js'
import { exportLearnerData, deleteLearnerData, privacyContact, deletionRequestMailto, EXPORT_FORMAT } from '../src/services/learnerData.js'
import { FREE_PLAN, PREMIUM_PLAN, LATER } from '../src/services/pricing.js'
import { readFileSync } from 'node:fs'

let passed = 0
const ok = (cond, msg) => { assert.ok(cond, msg); passed++ }
class Store { values = new Map(); get length() { return this.values.size } key(i) { return [...this.values.keys()][i] } getItem(k) { return this.values.get(k) ?? null } setItem(k, v) { this.values.set(k, String(v)) } removeItem(k) { this.values.delete(k) } }

const shared = globalThis.localStorage = new Store()
const tabA = globalThis.sessionStorage = new Store()
activateLocalAccount(shared, 'A')
learnerStorage.setItem('lc2-profile', JSON.stringify({ name: 'Ana' }))
learnerStorage.setItem('lc2-learner-model-v1', JSON.stringify({ languageItems: { 'es:hola': {} } }))
learnerStorage.setItem('lc2-active-course', 'es')
const accessA = captureLearnerAccess()

globalThis.sessionStorage = new Store()
activateLocalAccount(shared, 'B')
learnerStorage.setItem('lc2-profile', JSON.stringify({ name: 'Bea' }))
learnerStorage.setItem('lc2-local-progress', '{"xp":40}')
const bKeysBefore = [...shared.values.keys()].filter(k => k.includes(':B:'))

// A's access is stale now (B is active): it can neither read nor delete
ok(exportLearnerData(accessA) === null, 'a stale access exports nothing')
ok(deleteLearnerData(accessA).ok === false, 'a stale access deletes nothing')
ok([...shared.values.keys()].filter(k => k.includes(':A:')).length === 3, "A's data untouched by the stale attempt")

// back to A, in A's tab
globalThis.sessionStorage = tabA
activateLocalAccount(shared, 'A')
const a = captureLearnerAccess()
const file = exportLearnerData(a, { accountId: 'A', now: Date.UTC(2026, 10, 2) })
ok(file.format === EXPORT_FORMAT && file.account.id === 'A', 'export is labelled and attributed')
ok(Object.keys(file.data).sort().join() === 'lc2-active-course,lc2-learner-model-v1,lc2-profile', 'export holds exactly A\'s keys')
ok(file.data['lc2-profile'].name === 'Ana' && !JSON.stringify(file).includes('Bea'), 'nothing of B is exported')
ok(!JSON.stringify(file).includes('access_token'), 'no auth token is exported')

const result = deleteLearnerData(a)
ok(result.ok && result.removed === 3 && result.remaining === 0, 'every key of A is deleted and checked')
ok([...shared.values.keys()].filter(k => k.includes(':A:')).length === 0, 'no physical key of A is left')
ok(JSON.stringify([...shared.values.keys()].filter(k => k.includes(':B:'))) === JSON.stringify(bKeysBefore), "B's data is untouched")

// contact is configuration, never invented
ok(privacyContact({}) === null && privacyContact({ VITE_PRIVACY_CONTACT_EMAIL: 'not an email' }) === null, 'no contact unless configured')
ok(privacyContact({ VITE_PRIVACY_CONTACT_EMAIL: ' privacy@example.test ' }) === 'privacy@example.test', 'a configured contact is used')
ok(deletionRequestMailto(null) === null, 'no mailto without a contact')
ok(deletionRequestMailto('privacy@example.test', { accountId: 'A' }).startsWith('mailto:privacy@example.test?subject='), 'the request is a prepared email')

/* honest plans: every listed free feature names a capability that exists */
const src = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8')
const PROOFS = {
  lessons: () => /contentStatus: 'complete', available: true/.test(src('learning/curriculum/levels.js')) && /es:/.test(src('learning/courses/es/skeleton.js')),
  corrections: () => /export function evaluateSpanish/.test(src('learning/courses/es/evaluator.js')) && /export function evaluateFree/.test(src('learning/engine/responseEvaluation.js')),
  reviews: () => /export function getDueReviews/.test(src('learning/engine/learnerModel.js')),
  practiceChat: () => readFileSync(new URL('../../linguachat-backend/ai/es_tutor.py', import.meta.url), 'utf8').includes('def respond') && /@router\.post\("\/chat"/.test(readFileSync(new URL('../../linguachat-backend/app/routes/chat.py', import.meta.url), 'utf8')),
  missions: () => /export const PRACTICE_MISSIONS/.test(src('data/practiceMissions.js')),
  progress: () => /export function loadLocalProgress/.test(src('services/localProgress.js')),
  dataControl: () => /export function exportLearnerData/.test(src('services/learnerData.js')) && /<DataControls \/>/.test(src('components/identity/LanguageIdentity.jsx')),
}
for (const feature of FREE_PLAN.features) ok(PROOFS[feature.proof] && PROOFS[feature.proof](), `plan feature ${feature.key} is backed by ${feature.proof}`)
ok(PREMIUM_PLAN.available === false && !('features' in PREMIUM_PLAN) && !('featureKeys' in PREMIUM_PLAN), 'Premium lists no features and is not for sale')
const en = src('i18n/translations.js')
const planCopy = [...FREE_PLAN.features.map(f => f.key), PREMIUM_PLAN.taglineKey, PREMIUM_PLAN.bodyKey, FREE_PLAN.taglineKey]
  .map(k => (en.match(new RegExp(`^  ${k}: (.*)$`, 'm')) || [])[1] || '')
ok(planCopy.every(Boolean), 'every plan string exists')
ok(planCopy.every(s => !/unlimited|ilimitad|priority access|\bvoice practice\b/i.test(s)), 'no unlimited / priority / voice promises in plan copy')
ok(LATER.every(k => /^planLater/.test(k)) && /planLaterTitle/.test(src('components/pricing/Pricing.jsx')), 'future items only under the "not available now" heading')
ok(!/PREMIUM_PRICING|formatPrice|planPerMonth/.test(src('components/pricing/Pricing.jsx')), 'no price is shown anywhere on the plans page')

console.log(`check-learner-data: ${passed} passed, 0 failed`)
