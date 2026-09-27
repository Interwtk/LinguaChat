/*
 * LinguaChat public browser Supabase client.
 * Only Vite's public URL + anon key are accepted here; never service-role/private keys.
 * createClient is injected so this module stays network-free in fixtures.
 */
function readPublicAuthConfig(env = import.meta.env) {
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

export function createLinguaChatSupabaseClient(createClient, env = import.meta.env) {
  if (typeof createClient !== 'function') throw new Error('Supabase createClient is required.')
  const { url, anonKey } = readPublicAuthConfig(env)
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  })
}

export { readPublicAuthConfig }
