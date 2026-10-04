#!/usr/bin/env node
import assert from 'node:assert/strict'
import { createEmailPasswordAuth, emailAuthRedirect } from '../src/auth/emailPassword.js'

const calls = []
const session = { access_token: 'fake-test-only', user: { id: 'u-a' } }
let pending = true
const auth = {
  async signUp(args) {
    calls.push(['signup', args])
    return { data: { user: { id: 'u-a' }, session: pending ? null : session }, error: null }
  },
  async signInWithPassword(args) {
    calls.push(['login', args])
    return { data: { user: { id: 'u-a' }, session }, error: null }
  },
  async signOut(args) { calls.push(['logout', args]); return { error: null } },
  async resetPasswordForEmail(email, options) {
    calls.push(['reset', { email, options }])
    return { data: {}, error: null }
  },
  async updateUser(args) { calls.push(['change', args]); return { data: { user: { id: 'u-a' } }, error: null } },
  async resend(args) { calls.push(['resend', args]); return { data: {}, error: null } },
  async getSession() { return { data: { session }, error: null } },
  onAuthStateChange(listener) {
    listener('SIGNED_IN', session)
    return { data: { subscription: { unsubscribe() {} } } }
  },
  async exchangeCodeForSession(code) {
    calls.push(['callback', code])
    return { data: { session }, error: null }
  },
}
const service = createEmailPasswordAuth({ auth }, { origin: 'https://linguachat-blond.vercel.app' })
let passed = 0
function ok(condition, message) { assert.ok(condition, message); passed++ }

const signup = await service.signUp({ name: '  Alex  ', email: '  ALEX@EXAMPLE.COM  ', password: 'my-test-password', language: 'es' })
ok(signup.confirmationPending && signup.session === null, 'never invent a confirmed login')
const first = calls.at(-1)[1]
ok(first.email === 'alex@example.com' && first.options.data.display_name === 'Alex', 'sanitize signup metadata')
ok(first.options.data.language === 'es', 'persist normalized signup locale for localized Auth email templates')
ok(first.options.emailRedirectTo === 'https://linguachat-blond.vercel.app/?auth=confirmed', 'exact confirmation redirect')
pending = false
ok((await service.signUp({ name: 'Alex', email: 'alex@example.com', password: 'my-test-password', language: 'xx' })).confirmationPending === false, 'session result controls pending state')
ok(calls.at(-1)[1].options.data.language === 'en', 'unknown signup locale falls back to English')
ok((await service.signIn({ email: 'alex@example.com', password: 'my-test-password' })).session === session, 'real provider session returned')
await service.signOut()
ok(calls.at(-1)[1].scope === 'local', 'logout scope is local to this client')
ok((await service.requestPasswordReset(' ALEX@EXAMPLE.COM ')).requested, 'reset dispatched')
ok(calls.at(-1)[1].options.redirectTo === 'https://linguachat-blond.vercel.app/?auth=reset', 'exact reset redirect')
ok((await service.changePassword('new-test-password')).id === 'u-a', 'change-password delegates to SDK')
await service.resendConfirmation('alex@example.com')
ok(calls.at(-1)[1].type === 'signup', 'resend uses signup flow')
ok((await service.getSession()) === session, 'session restored through SDK')
let observed = null
service.onAuthStateChange((event, value) => { observed = [event, value] })
ok(observed[0] === 'SIGNED_IN' && observed[1] === session, 'session events forwarded')
ok((await service.consumeCallbackCode('one-time-code')).session === session, 'PKCE code exchange through SDK')
ok((await service.consumeCallbackCode('')) === null, 'no blank code exchange')

for (const bad of ['https://other.test/path', 'https://other.test/?next=evil', 'javascript:alert(1)', 'http://remote.test', 'https://a:pw@example.com']) {
  assert.throws(() => emailAuthRedirect(bad, 'reset'))
  passed++
}
ok(emailAuthRedirect('http://localhost:5173', 'reset') === 'http://localhost:5173/?auth=reset', 'local development origin allowed')
for (const badEmail of ['', 'not-an-email', 'a@b', 'a b@c.io']) {
  await assert.rejects(() => service.signIn({ email: badEmail, password: 'my-test-password' }))
  passed++
}
for (const badPassword of ['', 'short', '1234567']) {
  await assert.rejects(() => service.signUp({ name: 'Alex', email: 'alex@example.com', password: badPassword }))
  passed++
}
await assert.rejects(() => service.signUp({ name: '', email: 'alex@example.com', password: 'my-test-password' }))
passed++
const failure = new Error('Invalid login credentials')
const failing = createEmailPasswordAuth({
  auth: { ...auth, signInWithPassword: async () => ({ data: null, error: failure }) },
}, { origin: 'https://linguachat-blond.vercel.app' })
await assert.rejects(() => failing.signIn({ email: 'alex@example.com', password: 'my-test-password' }), /Invalid login credentials/)
passed++

console.log('check-auth-service — ' + passed + ' checks passed (SDK adapter, redirection, email, reset, recovery, session and negative cases)')
