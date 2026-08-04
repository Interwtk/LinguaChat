/*
 * memoryContext — "not that one, today".
 *
 * When a learner waves away a remembered topic, that choice used to last only
 * as long as the screen stayed mounted: walking to Home and back brought the
 * same suggestion straight back, which is exactly the nagging the memory rules
 * are meant to prevent.
 *
 * So the choice is kept for the day, beside the daily session it belongs to:
 *
 *   - it survives navigation, a reload, a language switch and a breakpoint;
 *   - it never deletes the fact, lowers its confidence, records a dislike, or
 *     touches activity preferences — declining a TOPIC says nothing about the
 *     ACTIVITY, and nothing about whether the learner still likes music;
 *   - a new day starts fresh, because a preference about today is not a
 *     permanent instruction.
 *
 * With every fact declined, the answer is simply the neutral context.
 */
import { dayKeyFor } from './session.js'

export const MEMORY_CONTEXT_KEY = 'lc2-memory-context-v1'
export const MEMORY_CONTEXT_VERSION = 1
const MAX_DISMISSED = 20

// A stable id for a fact, independent of how it was capitalised.
export const factKey = (fact) =>
  (fact && fact.type && fact.value ? `${fact.type}:${String(fact.value).toLowerCase()}` : null)

export function emptyMemoryContext(atMs = Date.now()) {
  return { version: MEMORY_CONTEXT_VERSION, dayKey: dayKeyFor(atMs), dismissedFactIds: [], neutralRequested: false }
}

/*
 * Normalize whatever is in storage. A context from another day is not repaired
 * — it is replaced, because yesterday's "not today" has expired.
 */
export function normalizeMemoryContext(parsed, atMs = Date.now()) {
  const today = dayKeyFor(atMs)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return emptyMemoryContext(atMs)
  if (parsed.version !== MEMORY_CONTEXT_VERSION) return emptyMemoryContext(atMs)
  if (parsed.dayKey !== today) return emptyMemoryContext(atMs)
  const ids = Array.isArray(parsed.dismissedFactIds)
    ? [...new Set(parsed.dismissedFactIds.filter(id => typeof id === 'string' && id.length > 0 && id.length <= 80))].slice(0, MAX_DISMISSED)
    : []
  return { version: MEMORY_CONTEXT_VERSION, dayKey: today, dismissedFactIds: ids, neutralRequested: Boolean(parsed.neutralRequested) }
}

export function loadMemoryContext(atMs = Date.now()) {
  try {
    const raw = localStorage.getItem(MEMORY_CONTEXT_KEY)
    if (raw) return normalizeMemoryContext(JSON.parse(raw), atMs)
  } catch { /* unreadable storage behaves like a fresh day */ }
  return emptyMemoryContext(atMs)
}

export function saveMemoryContext(context) {
  try { localStorage.setItem(MEMORY_CONTEXT_KEY, JSON.stringify(context)) } catch { /* storage full/blocked */ }
  return context
}

export const isFactDismissed = (context, fact) => {
  const key = factKey(fact)
  return Boolean(key && (context?.dismissedFactIds || []).includes(key))
}

/*
 * Record that this topic is not wanted today. Returns the new context; the
 * caller decides what to show instead (another fact, or nothing at all).
 */
export function dismissFact(fact, { atMs = Date.now(), context = null } = {}) {
  const current = context ? normalizeMemoryContext(context, atMs) : loadMemoryContext(atMs)
  const key = factKey(fact)
  if (!key) return current
  if (current.dismissedFactIds.includes(key)) return current
  const next = { ...current, dismissedFactIds: [...current.dismissedFactIds, key].slice(-MAX_DISMISSED) }
  return saveMemoryContext(next)
}

// Explicitly ask for a plain, everyday context regardless of what is known.
export function requestNeutral({ atMs = Date.now(), context = null } = {}) {
  const current = context ? normalizeMemoryContext(context, atMs) : loadMemoryContext(atMs)
  return saveMemoryContext({ ...current, neutralRequested: true })
}

export function clearMemoryContext() {
  try { localStorage.removeItem(MEMORY_CONTEXT_KEY) } catch { /* noop */ }
}
