import { learnerStorage as localStorage } from '../auth/localLease.js'
import {
  addEvent, applyToSnapshot, compactLedger, createLedger, deriveSnapshot, emptySnapshot,
  ledgerFromLegacy, ledgerFromStored, makeEventId, mergeLedgers, missionEvent, practiceEvent,
  PROGRESS_VERSION, sameLedger, serializeLedger, snapshotFrom,
} from './progressLedger.js'
import { quarantineValue } from './storageQuarantine.js'

const STORAGE_KEYS = {
  sessionId: 'lc2-session-id',
  messages: 'lc2-chat-messages',
  progress: 'lc2-local-progress',
  // When the visible conversation last started over (clear chat or reset).
  // Messages older than this belong to an erased conversation.
  chatEpoch: 'lc2-chat-epoch',
}

/*
 * Local progress is a ledger of identified events (see progressLedger.js) so
 * that two tabs of the same account can both save without erasing each other.
 * The object the app holds is the totals it always read (xp, streak, topics,
 * ...) plus `ledger`, the record those totals were folded from.
 */

// The access the learner's own tab would capture, for the few unscoped callers.
const unscopedAccess = {
  valid: () => true,
  getItem: key => localStorage.getItem(key),
  setItem: (key, value) => { localStorage.setItem(key, value); return true },
}

function makeId(prefix = 'session') {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function progressFromLedger(ledger) {
  return {
    ...deriveSnapshot(ledger),
    version: PROGRESS_VERSION,
    startedAt: ledger.base.startedAt,
    ledger,
  }
}

// The ledger behind an in-memory progress object. An object without one (an
// older in-memory copy, or a test fixture) starts a ledger from its totals.
function ledgerOf(progress) {
  return progress?.ledger || ledgerFromLegacy(progress || {})
}

function parseStoredProgress(raw) {
  if (raw === null || raw === undefined) return { ledger: null, unreadable: false }
  try {
    const ledger = ledgerFromStored(JSON.parse(raw))
    return ledger ? { ledger, unreadable: false } : { ledger: null, unreadable: true }
  } catch {
    return { ledger: null, unreadable: true }
  }
}

/*
 * The ledger to write: what storage already holds merged with this copy, then
 * compacted. Unreadable stored bytes are copied to quarantine first; if that
 * copy fails this throws, so nothing replaces the only copy of the data.
 */
export function mergeIntoStoredProgress(access, progress, now = Date.now()) {
  const raw = access.getItem(STORAGE_KEYS.progress)
  const stored = parseStoredProgress(raw)
  if (stored.unreadable && !quarantineValue(access, STORAGE_KEYS.progress, raw)) {
    throw new Error('Unreadable progress could not be preserved')
  }
  const mine = progress ? ledgerOf(progress) : null
  return compactLedger(mergeLedgers(stored.ledger, mine) || createLedger(), now)
}

export function serializeStoredProgress(ledger) {
  return JSON.stringify(serializeLedger(ledger))
}

function conversationEpochAt(raw) {
  try {
    const epoch = raw ? JSON.parse(raw) : null
    return Number.isFinite(epoch?.at) ? epoch.at : 0
  } catch {
    return 0
  }
}

const messageKey = message => JSON.stringify([message?.id ?? null, message?.ts ?? null, message?.role ?? null, message?.text ?? null])

/*
 * One conversation from two copies: every message either copy holds, each
 * once, in time order, minus anything from before the conversation last
 * started over. Two different messages that happen to share an id (ids are
 * made from the millisecond) are both kept.
 */
export function mergeMessageLists(stored, local, epochAt = 0) {
  const seen = new Set()
  const merged = []
  for (const message of [...(Array.isArray(stored) ? stored : []), ...(Array.isArray(local) ? local : [])]) {
    if (!message || typeof message !== 'object') continue
    if ((Number(message.ts) || 0) < epochAt) continue
    const key = messageKey(message)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(message)
  }
  // Two tabs opened on an empty chat each greet the learner; a conversation
  // has one welcome, the earliest.
  let welcomed = false
  return merged
    .map((message, index) => ({ message, index }))
    .sort((a, b) => ((Number(a.message.ts) || 0) - (Number(b.message.ts) || 0)) || (a.index - b.index))
    .map(entry => entry.message)
    .filter(message => message.id !== 'welcome' || (!welcomed && (welcomed = true)))
    .slice(-100)
}

/*
 * The messages to write: storage merged with this copy. Unreadable stored
 * bytes are quarantined first, as for progress.
 */
export function mergeIntoStoredMessages(access, messages) {
  const epochAt = conversationEpochAt(access.getItem(STORAGE_KEYS.chatEpoch))
  const raw = access.getItem(STORAGE_KEYS.messages)
  let stored = []
  if (raw !== null) {
    try {
      stored = JSON.parse(raw)
      if (!Array.isArray(stored)) throw new Error('Not a conversation')
    } catch {
      if (!quarantineValue(access, STORAGE_KEYS.messages, raw)) throw new Error('Unreadable chat could not be preserved')
      stored = []
    }
  }
  return mergeMessageLists(stored, messages, epochAt)
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function createSessionId({ access = null } = {}) {
  const id = makeId()
  if (access) {
    try {
      if (!access.valid() || access.setItem(STORAGE_KEYS.sessionId, id) === false
        || !access.valid() || access.getItem(STORAGE_KEYS.sessionId) !== id) return null
      return access.valid() ? id : null
    } catch {
      return null
    }
  }
  try { localStorage.setItem(STORAGE_KEYS.sessionId, id) } catch {}
  return id
}

export function getOrCreateSessionId() {
  try {
    return localStorage.getItem(STORAGE_KEYS.sessionId) || createSessionId()
  } catch {
    return makeId()
  }
}

export function loadStoredMessages(welcomeMessage) {
  try {
    const messages = mergeMessageLists(JSON.parse(localStorage.getItem(STORAGE_KEYS.messages) || '[]'), [],
      conversationEpochAt(localStorage.getItem(STORAGE_KEYS.chatEpoch)))
    return messages.length ? messages : [welcomeMessage]
  } catch {
    return [welcomeMessage]
  }
}

export function saveStoredMessages(messages, { access = null } = {}) {
  if (access) {
    // Another tab of the same account may have saved since this copy was read:
    // write the union, never this copy alone. A rejected, stale or unverified
    // write must not look successful.
    try {
      if (!access.valid()) return false
      const serialized = JSON.stringify(mergeIntoStoredMessages(access, messages))
      if (!access.valid() || access.setItem(STORAGE_KEYS.messages, serialized) === false
        || !access.valid() || access.getItem(STORAGE_KEYS.messages) !== serialized) return false
      return access.valid()
    } catch {
      return false
    }
  }
  // Keep the existing best-effort path for passive state persistence.
  try { writeJSON(STORAGE_KEYS.messages, mergeIntoStoredMessages(unscopedAccess, messages)) } catch {}
}

/*
 * Start the conversation over (clear chat, reset): from now on only `welcome`
 * and later messages belong to it, whichever tab still holds older ones.
 * The epoch is written before the messages, so an interruption between the two
 * still hides the erased conversation.
 */
export function startStoredConversation(welcome, { access = null } = {}) {
  const target = access || unscopedAccess
  try {
    const epoch = JSON.stringify({ id: makeId('chat'), at: Number(welcome?.ts) || Date.now() })
    const serialized = JSON.stringify([welcome])
    if (!target.valid() || target.setItem(STORAGE_KEYS.chatEpoch, epoch) === false
      || !target.valid() || target.getItem(STORAGE_KEYS.chatEpoch) !== epoch) return false
    if (!target.valid() || target.setItem(STORAGE_KEYS.messages, serialized) === false
      || !target.valid() || target.getItem(STORAGE_KEYS.messages) !== serialized) return false
    return target.valid()
  } catch {
    return false
  }
}

/* What another tab saved, for the `storage` listener. Null if unreadable. */
export function readStoredConversation({ access }) {
  try {
    if (!access.valid()) return null
    const raw = access.getItem(STORAGE_KEYS.messages)
    const messages = raw === null ? [] : JSON.parse(raw)
    if (!Array.isArray(messages)) return null
    const epochAt = conversationEpochAt(access.getItem(STORAGE_KEYS.chatEpoch))
    return access.valid() ? { messages, epochAt } : null
  } catch {
    return null
  }
}

/* Fold another tab's conversation into this tab's. Same array if nothing new. */
export function mergeConversation(messages, { messages: stored = [], epochAt = 0 } = {}) {
  const merged = mergeMessageLists(stored, messages, epochAt)
  const same = merged.length === messages.length && merged.every((message, i) => message === messages[i])
  return same ? messages : merged
}

/*
 * A fresh progress record. `reset: true` starts a new epoch: every event from
 * before this moment, in any tab, no longer counts.
 */
export function createEmptyProgress({ reset = false } = {}) {
  const now = Date.now()
  return progressFromLedger(createLedger({
    ...(reset ? { epoch: { id: makeEventId('reset'), at: now } } : {}),
    startedAt: now,
    snapshot: emptySnapshot(),
  }))
}

export function loadLocalProgress() {
  try {
    const { ledger } = parseStoredProgress(localStorage.getItem(STORAGE_KEYS.progress))
    // Unreadable progress loads as empty in memory; the first save quarantines
    // the stored bytes before anything replaces them.
    if (ledger) return progressFromLedger({ ...ledger, base: { ...ledger.base, startedAt: ledger.base.startedAt ?? Date.now() } })
  } catch {}
  return createEmptyProgress()
}

/* What another tab saved, for the `storage` listener. Null if absent or unreadable. */
export function readStoredProgress({ access }) {
  try {
    if (!access.valid()) return null
    const { ledger } = parseStoredProgress(access.getItem(STORAGE_KEYS.progress))
    return ledger && access.valid() ? progressFromLedger(ledger) : null
  } catch {
    return null
  }
}

/* Fold another copy into this one. Same object if it adds nothing. */
export function mergeLocalProgress(progress, other) {
  const mine = ledgerOf(progress)
  const merged = mergeLedgers(mine, ledgerOf(other))
  return sameLedger(merged, mine) ? progress : progressFromLedger(merged)
}

export function saveLocalProgress(progress, { access = null } = {}) {
  if (access) {
    // Merge with what storage holds now (another tab may have saved since this
    // copy was read) and verify the write before reporting success.
    try {
      if (!access.valid()) return false
      const serialized = serializeStoredProgress(mergeIntoStoredProgress(access, progress))
      if (!access.valid() || access.setItem(STORAGE_KEYS.progress, serialized) === false
        || !access.valid() || access.getItem(STORAGE_KEYS.progress) !== serialized) return false
      return access.valid()
    } catch {
      return false
    }
  }
  try { writeJSON(STORAGE_KEYS.progress, serializeLedger(mergeIntoStoredProgress(unscopedAccess, progress))) } catch {}
}

/*
 * Apply one identified event to an in-memory copy. Applying an event this copy
 * already holds changes nothing, so retries and replays never pay twice.
 */
export function applyProgressEvent(progress, event) {
  const ledger = ledgerOf(progress)
  const next = addEvent(ledger, event)
  if (next === ledger) return progress
  // The newest event advances this copy's own totals, exactly as before. One
  // that sorts before events already held is folded from the ledger instead,
  // so the totals always follow the order the events happened in.
  const added = next.events.find(stored => stored.id === event.id)
  const newest = ledger.events.every(stored => stored.at < added.at || (stored.at === added.at && stored.id < added.id))
  return {
    ...(newest ? applyToSnapshot(snapshotFrom(progress), added) : deriveSnapshot(next)),
    version: PROGRESS_VERSION,
    startedAt: next.base.startedAt ?? progress?.startedAt ?? null,
    ledger: next,
  }
}

/*
 * Durably record one event before the caller reports success (episode awards,
 * the daily bonus). The event's id makes a retry or a second tab harmless.
 * True only when the event is verifiably in storage for this account.
 */
export function commitProgressEvent(event, { access }) {
  try {
    if (!access.valid()) return false
    const serialized = serializeStoredProgress(addEvent(mergeIntoStoredProgress(access, null), event))
    if (!access.valid() || access.setItem(STORAGE_KEYS.progress, serialized) === false || !access.valid()) return false
    const { ledger } = parseStoredProgress(access.getItem(STORAGE_KEYS.progress))
    return Boolean(ledger?.events.some(stored => stored.id === event.id)) && access.valid()
  } catch {
    return false
  }
}

export function recordPractice(previous, { userMessage, response, at = Date.now(), eventId } = {}) {
  return applyProgressEvent(previous, practiceEvent({ userMessage, response, at, ...(eventId ? { id: eventId } : {}) }))
}

export function recordMissionProgress(previous, { mission, step, earnedXp = 0, completed = false, at = Date.now(), eventId } = {}) {
  return applyProgressEvent(previous, missionEvent({ mission, step, earnedXp, completed, at, ...(eventId ? { id: eventId } : {}) }))
}

export function clearStoredProgress({ access = null } = {}) {
  if (access) {
    // Reset is an explicit destructive action. A revoked account lease or
    // denied Storage removal must not be presented as a successful reset.
    try {
      if (!access.valid()) return false
      for (const key of Object.values(STORAGE_KEYS)) {
        if (!access.valid() || access.removeItem(key) === false
          || !access.valid() || access.getItem(key) !== null) return false
      }
      return access.valid()
    } catch {
      return false
    }
  }
  try {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
  } catch {}
}
