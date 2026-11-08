/*
 * The sign-in token, for the backend — sent only when the owner turns it on.
 *
 * OFF unless VITE_AUTH_SEND_TOKEN=true. Off, nothing changes: no request carries
 * a token, exactly as before. The switch exists so the frontend half of server-
 * side verification (proposal/backend-jwt-verify) can ship first and be turned on
 * in Preview together with the backend, never one without the other: a backend
 * that requires a token from a frontend that sends none answers 401 to everyone.
 *
 * The token lives in memory only, follows the provider's session events (sign-in,
 * refresh, sign-out) and is never written to storage, logged or put in a URL. It
 * goes in one header to our own API, nowhere else.
 */
const HAS_VITE_ENV = typeof import.meta.env === 'object' && import.meta.env !== null

let current = null

/* Called by the auth adapter with every session it sees; null signs out. */
export function noteSession(session) {
  const token = session && typeof session.access_token === 'string' ? session.access_token : null
  current = token && token.length <= 8192 ? token : null
}

export function sendsToken(env = HAS_VITE_ENV ? import.meta.env : {}) {
  return env?.VITE_AUTH_SEND_TOKEN === 'true'
}

/* Headers for a request to LinguaChat's own API: empty while the switch is off. */
export function authHeaders(env) {
  return sendsToken(env) && current ? { Authorization: `Bearer ${current}` } : {}
}
