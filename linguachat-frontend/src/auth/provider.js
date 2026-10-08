import { createLinguaChatSupabaseClient } from './client.js'
import { createEmailPasswordAuth } from './emailPassword.js'

let browserClientPromise = null
export function getBrowserPublicClient() {
  // Keep the SDK out of the initial curriculum/UI chunk. Cache initialization,
  // but permit another attempt after a transient chunk/network load failure.
  if (!browserClientPromise) browserClientPromise = import('@supabase/supabase-js')
    .then(({ createClient }) => createLinguaChatSupabaseClient(createClient))
    .catch(error => { browserClientPromise = null; throw error })
  return browserClientPromise
}

export function createLazyAuthService(loadService) {
  let ready = null
  const load = () => ready ||= Promise.resolve().then(loadService).catch(error => { ready = null; throw error })
  const service = {}
  for (const method of ['signUp', 'signIn', 'signOut', 'requestPasswordReset', 'changePassword', 'resendConfirmation', 'getSession', 'consumeCallbackCode']) {
    service[method] = async (...args) => (await load())[method](...args)
  }
  service.onAuthStateChange = listener => {
    let active = true, subscription = null
    // Register before getSession's result is applied. A late chunk cannot revive
    // listeners from an unmounted StrictMode effect.
    load().then(adapter => {
      if (!active) return
      const registration = adapter.onAuthStateChange(listener)
      subscription = registration?.data?.subscription || registration?.subscription
    }).catch(() => { /* getSession reports initialization errors to the UI. */ })
    return { data: { subscription: { unsubscribe() { active = false; subscription?.unsubscribe() } } } }
  }
  return Object.freeze(service)
}

const HAS_VITE_ENV = typeof import.meta.env === 'object' && import.meta.env !== null

export function resolveBrowserAuthOrigin(currentOrigin, env = HAS_VITE_ENV ? import.meta.env : {}) {
  const configured = String(env?.VITE_AUTH_REDIRECT_ORIGIN ?? '').trim()
  return configured || currentOrigin
}

let browserAuthService = null
export function getBrowserAuthService() {
  if (!browserAuthService) browserAuthService = createLazyAuthService(async () =>
    createEmailPasswordAuth(await getBrowserPublicClient(), {
      origin: resolveBrowserAuthOrigin(window.location.origin),
    }))
  return browserAuthService
}
