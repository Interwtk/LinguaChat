#!/usr/bin/env node
/*
 * check-auth-journeys — the ten beta sign-in journeys, SIMULATED.
 *
 * The authentication provider is a stub (no network, no real account): this
 * proves what LinguaChat's own code does around sign-up, sign-in, recovery,
 * switching accounts, per-course progress, persistence, deletion and lost
 * connections. It does NOT prove that a real Supabase project behaves the same
 * (e-mails, links, sessions): that is docs/release/2026-11-auth-journeys.md,
 * to be run against an authorized test project.
 */
import assert from 'node:assert/strict'
import { createEmailPasswordAuth } from '../src/auth/emailPassword.js'
import { activateLocalAccount } from '../src/auth/browserDataIsolation.js'
import { learnerStorage, captureLearnerAccess } from '../src/auth/localLease.js'
import { loadLearnerModel, saveLearnerModel, recordItemAttempt, getDueReviews } from '../src/learning/engine/learnerModel.js'
import { readActiveCourse, writeActiveCourse } from '../src/services/activeCourse.js'
import { exportLearnerData, deleteLearnerData, conversationIdsOf } from '../src/services/learnerData.js'
import { forgetServerConversations, sendChatMessage } from '../src/services/api.js'
import { answerAgeGate, ageGatePassed, resetAgeGateForTests } from '../src/services/ageGate.js'

let passed = 0
const ok = (cond, msg) => { assert.ok(cond, msg); passed++ }
class Store { values = new Map(); get length() { return this.values.size } key(i) { return [...this.values.keys()][i] ?? null } getItem(k) { return this.values.get(k) ?? null } setItem(k, v) { this.values.set(k, String(v)) } removeItem(k) { this.values.delete(k) } }

const calls = []
const auth = {
  async signUp(args) { calls.push(['signUp', args]); return { data: { user: { id: 'A' }, session: null }, error: null } },
  async signInWithPassword(args) {
    calls.push(['signIn', args])
    return args.password === 'right-test-password'
      ? { data: { user: { id: 'A' }, session: { user: { id: 'A' } } }, error: null }
      : { data: {}, error: { message: 'Invalid login credentials', status: 400 } }
  },
  async signOut(args) { calls.push(['signOut', args]); return { error: null } },
  async resetPasswordForEmail(email, options) { calls.push(['reset', { email, options }]); return { data: {}, error: null } },
  async updateUser(args) { calls.push(['update', args]); return { data: { user: { id: 'A' } }, error: null } },
  async resend() { return { data: {}, error: null } },
  async getSession() { return { data: { session: null }, error: null } },
  onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } } },
  async exchangeCodeForSession() { return { data: { session: null }, error: null } },
}
const service = createEmailPasswordAuth({ auth }, { origin: 'https://preview.example.test' })

// 1. sign-up: only after the age question, with the declaration, never a fake session
globalThis.localStorage = new Store()
globalThis.sessionStorage = new Store()
resetAgeGateForTests()
ok(answerAgeGate('18_plus') === 'continue' && ageGatePassed(), 'J1 the age question opens sign-up')
const signup = await service.signUp({ name: 'Ana', email: 'ana@example.test', password: 'right-test-password', adultDeclaredAt: '2026-11-03T00:00:00.000Z' })
ok(signup.confirmationPending === true && !signup.session, 'J1 sign-up waits for the confirmation e-mail: no invented session')
ok(calls.at(-1)[1].options.data.age_declaration === '18_plus', 'J1 the account carries the 18+ declaration')
ok(String(calls.at(-1)[1].options.emailRedirectTo || '').startsWith('https://preview.example.test'), 'J1 the confirmation link returns to this deployment')

// 2. sign-in: a wrong password is an error, the right one a session
await assert.rejects(() => service.signIn({ email: 'ana@example.test', password: 'wrong-test-password' }))
passed++
const signedIn = await service.signIn({ email: 'ana@example.test', password: 'right-test-password' })
ok(signedIn?.user?.id === 'A' || signedIn?.session?.user?.id === 'A', 'J2 the right password signs in')

// 3. recovery: the link returns to the reset screen; the answer never says whether the address exists
const reset = await service.requestPasswordReset('nobody@example.test')
ok(reset.requested === true, 'J3 recovery answers the same for any address')
ok(/auth=reset/.test(calls.at(-1)[1].options.redirectTo), 'J3 the e-mail link opens the reset step')

// 4–5. account switch and A → B → A isolation, with both courses
const shared = globalThis.localStorage
const tabA = globalThis.sessionStorage
activateLocalAccount(shared, 'A')
const day = Date.UTC(2026, 10, 3)
let modelA = loadLearnerModel()
recordItemAttempt(modelA, 'hello', { correct: true, independent: true, atMs: day })
recordItemAttempt(modelA, 'es:hola', { correct: true, independent: true, atMs: day })
ok(saveLearnerModel(modelA, { verified: true }) !== false, 'J5 A saves English and Spanish progress')
ok(writeActiveCourse(captureLearnerAccess(), 'es'), 'J5 A is studying Spanish')
learnerStorage.setItem('lc2-session-id', 'sess-A')

globalThis.sessionStorage = new Store()
activateLocalAccount(shared, 'B')
const modelB = loadLearnerModel()
ok(!modelB.languageItems.hello && !modelB.languageItems['es:hola'], 'J4 B sees none of A\'s progress')
ok(readActiveCourse({ base: 'en' }) === 'en', 'J4 B starts on its own course choice')
ok(learnerStorage.getItem('lc2-session-id') === null, 'J4 B does not continue A\'s conversations')
recordItemAttempt(modelB, 'goodbye', { correct: true, independent: true, atMs: day })
saveLearnerModel(modelB, { verified: true })

globalThis.sessionStorage = tabA
activateLocalAccount(shared, 'A')
modelA = loadLearnerModel()
ok(modelA.languageItems.hello && modelA.languageItems['es:hola'] && !modelA.languageItems.goodbye, 'J5 back on A: A\'s progress intact, nothing of B')
ok(readActiveCourse({ base: 'en' }) === 'es', 'J5 A is still on Spanish')

// 6–7. each course owns its progress and reviews
const later = day + 40 * 86400000
const dueEn = getDueReviews(modelA, later, { courseId: 'en' })
const dueEs = getDueReviews(modelA, later, { courseId: 'es' })
ok(dueEn.includes('hello') && !dueEn.includes('es:hola'), 'J6 English reviews hold only English items')
ok(dueEs.includes('es:hola') && !dueEs.includes('hello'), 'J7 Spanish reviews hold only Spanish items')

// 8. persistence: a reload (new tab of the same account) finds the same data
globalThis.sessionStorage = new Store()
activateLocalAccount(shared, 'A')
ok(loadLearnerModel().languageItems['es:hola'], 'J8 a reload keeps the progress')

// 9. deletion: server memory first (by this account's ids), then every local key of A only
const access = captureLearnerAccess()
ok(JSON.stringify(conversationIdsOf(access)) === '["sess-A","sess-A:es"]', 'J9 deletion names A\'s conversations')
const before = exportLearnerData(access, { accountId: 'A' })
ok(before && Object.keys(before.data).length > 0, 'J9 A can download its data first')
const bKeys = [...shared.values.keys()].filter(k => k.includes(':B:')).sort().join()
const removed = deleteLearnerData(access)
ok(removed.ok && removed.remaining === 0, 'J9 every local key of A is deleted')
ok([...shared.values.keys()].filter(k => k.includes(':B:')).sort().join() === bKeys, 'J9 B is untouched')

// 10. lost connection: nothing is claimed, nothing is invented
globalThis.fetch = async () => { throw new TypeError('network down') }
ok(await forgetServerConversations(['sess-A']) === false, 'J10 an unreachable server is reported, not assumed done')
const offline = await sendChatMessage({ message: 'I goed', history: [], sessionId: 'sess-A' })
ok(offline.isFallback === true && offline.correction === null && !offline.analysis?.verdict, 'J10 offline chat checks nothing and says so')
globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({ reply: 'boom' }), headers: { get: () => null } })
ok((await sendChatMessage({ message: 'hi', history: [], sessionId: 'sess-A' })).isFallback === true, 'J10 a server error is treated as offline')

console.log(`check-auth-journeys: ${passed} passed, 0 failed (simulated provider; real journeys: docs/release/2026-11-auth-journeys.md)`)
