/*
 * LinguaChat public browser Supabase client.
 * Only Vite public browser configuration is accepted here.
 * The SDK factory is injected so this module stays network-free in fixtures.
 *
 * Capture the two allowed browser values through direct Vite substitutions.
 * Keeping them out of a dynamic import.meta.env-object dependency makes preview
 * builds deterministic and prevents a valid branch-scoped Vercel config from
 * being misread as absent at runtime.
 */
const BUILD_PUBLIC_AUTH_ENV = Object.freeze({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
})

function readPublicAuthConfig(env = BUILD_PUBLIC_AUTH_ENV) {
  const url = String(env?.VITE_SUPABASE_URL ?? '').trim()
  const anonKey = String(env?.VITE_SUPABASE_ANON_KEY ?? '').trim()
  if (!url || !anonKey) throw new Error('LinguaChat public auth configuration is missing.')

  const parsed = new URL(url)
  const local = ['localhost', '127.0.0.1'].includes(parsed.hostname)
  if (parsed.username || parsed.password || parsed.search || parsed.hash ||
      (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && local))) {
    throw new Error('VITE_SUPABASE_URL must be an allowed HTTPS Supabase URL.')
  }
  return Object.freeze({ url: parsed.origin, anonKey })
}

export function createLinguaChatSupabaseClient(sdkFactory, env = import.meta.env) {
  if (typeof sdkFactory !== 'function') throw new Error('Supabase SDK factory is required.')
  const { url, anonKey } = readPublicAuthConfig(env)
  return sdkFactory(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  })
}

export { readPublicAuthConfig }
