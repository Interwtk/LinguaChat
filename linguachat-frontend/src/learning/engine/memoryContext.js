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
 *
 * Interest TOPICS live here too, for the same reason and with one deliberate
 * difference: a dismissed topic expires with the day, but the short list of
 * recently used topics survives it, because a cooldown that reset every midnight
 * would let a daily learner meet the same interest every single morning.
 */
import { dayKeyFor } from './session.js'
import { KNOWN_INTERESTS as KNOWN_TOPIC_IDS } from './interests.js'

export const MEMORY_CONTEXT_KEY = 'lc2-memory-context-v1'
export const MEMORY_CONTEXT_VERSION = 2
const MAX_DISMISSED = 20
/* a trailing window, not a history: enough for a cooldown and nothing more */
const MAX_RECENT_TOPICS = 8

// A stable id for a fact, independent of how it was capitalised.
export const factKey = (fact) =>
  (fact && fact.type && fact.value ? `${fact.type}:${String(fact.value).toLowerCase()}` : null)

export function emptyMemoryContext(atMs = Date.now()) {
  return {
    version: MEMORY_CONTEXT_VERSION,
    dayKey: dayKeyFor(atMs),
    dismissedFactIds: [],
    neutralRequested: false,
    dismissedTopicIds: [],
    recentTopics: [],
  }
}

/*
 * Normalize whatever is in storage. A context from another day is not repaired
 * — it is replaced, because yesterday's "not today" has expired.
 */
const cleanIds = (raw, { limit, valid = null } = {}) => (Array.isArray(raw)
  ? [...new Set(raw.filter(id => typeof id === 'string' && id.length > 0 && id.length <= 80))]
    .filter(id => (valid ? valid(id) : true))
    .slice(0, limit)
  : [])

/*
 * The recently used topics, most recent first. Entries from any day are kept —
 * that is the difference from a dismissal — but only ids the catalogue still
 * knows: an interest removed from the product must stop influencing rotation.
 */
const cleanRecentTopics = (raw) => (Array.isArray(raw)
  ? raw
    .filter(entry => entry && typeof entry.id === 'string' && KNOWN_TOPIC_IDS.includes(entry.id))
    .map(entry => ({ id: entry.id, dayKey: typeof entry.dayKey === 'string' ? entry.dayKey : null }))
    .filter((entry, i, all) => all.findIndex(other => other.id === entry.id) === i)
    .slice(0, MAX_RECENT_TOPICS)
  : [])

export function normalizeMemoryContext(parsed, atMs = Date.now()) {
  const today = dayKeyFor(atMs)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return emptyMemoryContext(atMs)
  if (parsed.version !== MEMORY_CONTEXT_VERSION) return emptyMemoryContext(atMs)
  /*
   * A new day clears what was declined and keeps the cooldown window. Yesterday's
   * "not today" has expired; yesterday's "we already talked about this" has not.
   */
  if (parsed.dayKey !== today) {
    return { ...emptyMemoryContext(atMs), recentTopics: cleanRecentTopics(parsed.recentTopics) }
  }
  return {
    version: MEMORY_CONTEXT_VERSION,
    dayKey: today,
    dismissedFactIds: cleanIds(parsed.dismissedFactIds, { limit: MAX_DISMISSED }),
    neutralRequested: Boolean(parsed.neutralRequested),
    dismissedTopicIds: cleanIds(parsed.dismissedTopicIds, { limit: MAX_DISMISSED, valid: (id) => KNOWN_TOPIC_IDS.includes(id) }),
    recentTopics: cleanRecentTopics(parsed.recentTopics),
  }
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

/* ---- interest topics ---- */

export const isTopicDismissed = (context, topicId) =>
  Boolean(topicId && (context?.dismissedTopicIds || []).includes(topicId))

export const recentTopicIds = (context) => (context?.recentTopics || []).map(entry => entry.id)

/*
 * "Another topic, please."
 *
 * Keeps the interest exactly as selected: this writes one id into a list that
 * expires tonight. It does not remove the interest, lower a score, record a
 * dislike, or touch activity preferences — the learner declined a subject for an
 * afternoon, which says nothing about what they enjoy.
 */
export function dismissTopic(topicId, { atMs = Date.now(), context = null } = {}) {
  const current = context ? normalizeMemoryContext(context, atMs) : loadMemoryContext(atMs)
  if (!topicId || !KNOWN_TOPIC_IDS.includes(topicId)) return current
  if (current.dismissedTopicIds.includes(topicId)) return current
  return saveMemoryContext({
    ...current,
    dismissedTopicIds: [...current.dismissedTopicIds, topicId].slice(-MAX_DISMISSED),
  })
}

/*
 * Remember that a conversation was about this, so the next one probably is not.
 * Re-using the same topic moves it back to the front rather than duplicating it.
 */
export function recordTopicUse(topicId, { atMs = Date.now(), context = null } = {}) {
  const current = context ? normalizeMemoryContext(context, atMs) : loadMemoryContext(atMs)
  if (!topicId || !KNOWN_TOPIC_IDS.includes(topicId)) return current
  const entry = { id: topicId, dayKey: dayKeyFor(atMs) }
  const rest = current.recentTopics.filter(other => other.id !== topicId)
  return saveMemoryContext({ ...current, recentTopics: [entry, ...rest].slice(0, MAX_RECENT_TOPICS) })
}

export function clearMemoryContext() {
  try { localStorage.removeItem(MEMORY_CONTEXT_KEY) } catch { /* noop */ }
}
