import { getBrowserPublicClient } from '../auth/provider.js'
import { createPreferenceTransport } from './preferenceTransport.js'
import { createPreferenceSync } from './preferenceSync.js'

// Owner gate: release only after reproducible schema/RLS, hosted A/B/anonymous
// denial, and measured storage-budget proof. No preference/progress rollout yet.
export const CLOUD_PREFERENCES_RELEASED = false

export function schedulePreferenceSync(sync, events, { schedule = setTimeout, clear = clearTimeout, online = () => navigator.onLine } = {}) {
  let timer = null, stopped = false, failures = 0
  const queue = (delay = 250) => {
    if (stopped) return
    clear(timer)
    timer = schedule(async () => {
      if (stopped || !online()) return
      try { await sync.sync(); failures = 0 }
      catch { if (!stopped) queue(Math.min(60000, 1000 * 2 ** Math.min(failures++, 6))) }
    }, delay)
  }
  const reconnect = () => queue(0)
  events.addEventListener('online', reconnect)
  queue(0)
  return { changed: () => queue(), stop() { stopped = true; clear(timer); events.removeEventListener('online', reconnect); sync.cancel() } }
}

export async function connectPreferenceSync(options) {
  const client = await getBrowserPublicClient()
  return createPreferenceSync({ ...options, transport: createPreferenceTransport(client) })
}
