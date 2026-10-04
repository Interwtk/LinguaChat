/*
 * LinguaChat email/password Auth adapter.
 * Supabase's official client owns token handling/refresh and persistence; this
 * module does not store passwords, tokens or learners' local progress.
 * The actual client is injected so auth behavior is testable without network,
 * secrets, SMTP or account creation.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function requireEmail(value) {
  const email = String(value ?? '').trim().toLowerCase()
  if (!EMAIL.test(email) || email.length > 254) throw new Error('Enter a valid email address.')
  return email
}

function requirePassword(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) {
    throw new Error('Password must be 8–128 characters.')
  }
  return value
}

function redirect(origin, action) {
  // Only the current app's origin, never caller-provided return destinations.
  const parsed = new URL(origin)
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password ||
      parsed.pathname !== '/' || parsed.search || parsed.hash ||
      (parsed.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(parsed.hostname))) {
    throw new Error('Invalid LinguaChat application origin.')
  }
  const url = new URL('/', parsed.origin)
  url.searchParams.set('auth', action)
  return url.href
}

function unwrap(result) {
  if (!result || typeof result !== 'object') throw new Error('Auth provider did not respond.')
  if (result.error) throw result.error
  return result.data
}

export function createEmailPasswordAuth(client, { origin } = {}) {
  if (!client?.auth || typeof client.auth.signUp !== 'function' ||
      typeof client.auth.signInWithPassword !== 'function') {
    throw new Error('A Supabase Auth client is required.')
  }
  if (!origin) throw new Error('The application origin is required.')
  const confirmRedirect = redirect(origin, 'confirmed')
  const resetRedirect = redirect(origin, 'reset')

  return Object.freeze({
    async signUp({ name, email, password, language = 'en' }) {
      const displayName = String(name ?? '').trim().slice(0, 80)
      if (!displayName) throw new Error('Enter your name.')
      const locale = ['en', 'es', 'pt', 'fr', 'it', 'de', 'ja', 'ar'].includes(String(language).toLowerCase())
        ? String(language).toLowerCase()
        : 'en'
      const data = unwrap(await client.auth.signUp({
        email: requireEmail(email),
        password: requirePassword(password),
        options: {
          emailRedirectTo: confirmRedirect,
          data: { display_name: displayName, language: locale },
        },
      }))
      // A null session means confirmation is pending; do not log in locally.
      return { user: data?.user ?? null, session: data?.session ?? null, confirmationPending: !data?.session }
    },

    async signIn({ email, password }) {
      const data = unwrap(await client.auth.signInWithPassword({
        email: requireEmail(email),
        password: requirePassword(password),
      }))
      if (!data?.user || !data?.session) throw new Error('Sign-in did not create a session.')
      return data
    },

    async signOut() {
      unwrap(await client.auth.signOut({ scope: 'local' }))
    },

    async requestPasswordReset(email) {
      // Do not disclose whether a given address is registered in product copy.
      unwrap(await client.auth.resetPasswordForEmail(requireEmail(email), {
        redirectTo: resetRedirect,
      }))
      return { requested: true }
    },

    async changePassword(password) {
      const data = unwrap(await client.auth.updateUser({ password: requirePassword(password) }))
      return data?.user ?? null
    },

    async resendConfirmation(email) {
      const data = unwrap(await client.auth.resend({
        type: 'signup',
        email: requireEmail(email),
        options: { emailRedirectTo: confirmRedirect },
      }))
      return data ?? null
    },

    async getSession() {
      const data = unwrap(await client.auth.getSession())
      return data?.session ?? null
    },

    onAuthStateChange(listener) {
      if (typeof listener !== 'function') throw new Error('Auth listener required.')
      return client.auth.onAuthStateChange((event, session) => listener(event, session))
    },

    async consumeCallbackCode(code) {
      // The SDK also handles implicit/PKCE URLs when detectSessionInUrl is enabled.
      if (typeof code !== 'string' || !code.trim()) return null
      return unwrap(await client.auth.exchangeCodeForSession(code))
    },
  })
}

export const emailAuthRedirect = redirect
