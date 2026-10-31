import { getBrowserPublicClient } from '../auth/provider.js'
import { createPreferenceTransport } from './preferenceTransport.js'
import { createPreferenceSync } from './preferenceSync.js'

// Owner gate: release only after reproducible schema/RLS, hosted A/B/anonymous
// denial, and measured storage-budget proof. No preference/progress rollout yet.
export const CLOUD_PREFERENCES_RELEASED = false

export function schedulePreferenceSync(sync, events, { schedule = setTimeout, clear = clearTimeout, online = () => navigator.onLine } = {}) {
  let timer = null, stopped = false, failures = 0, running = false, dirty = false, epoch = 0
  const queue = (delay = 250) => {
    if (stopped) return
    clear(timer)
    const ticket = ++epoch
    timer = schedule(async () => {
      if (stopped || ticket !== epoch) return
      timer = null
      if (!online()) return
      if (running) { dirty = true; return }
      running = true
      dirty = false
      let retry = null
      try { await sync.sync(); failures = 0 }
      catch { retry = Math.min(60000, 1000 * 2 ** Math.min(failures++, 6)) }
      finally {
        running = false
        if (!stopped && timer === null) {
          if (retry !== null) queue(retry)
          else if (dirty) queue()
        }
      }
    }, delay)
  }
  const reconnect = () => queue(0)
  events.addEventListener('online', reconnect)
  queue(0)
  return { changed() { dirty = true; queue() }, stop() { stopped = true; epoch++; clear(timer); timer = null; events.removeEventListener('online', reconnect); sync.cancel() } }
}

export async function connectPreferenceSync(options) {
  const client = await getBrowserPublicClient()
  return createPreferenceSync({ ...options, transport: createPreferenceTransport(client) })
}
