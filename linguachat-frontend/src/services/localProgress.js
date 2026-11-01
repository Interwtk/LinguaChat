import { learnerStorage as localStorage } from '../auth/localLease.js'
import {
  addEvent, applyToSnapshot, compactLedger, createLedger, deriveSnapshot, emptySnapshot,
  ledgerFromLegacy, ledgerFromStored, makeEventId, mergeLedgers, missionEvent, practiceEvent, stampUnsaved,
  isFoldedReward, isStableEventId, PROGRESS_VERSION, sameLedger, serializeLedger, snapshotFrom,
} from './progressLedger.js'
import { quarantineValue } from './storageQuarantine.js'
import { collectDeadCopies, ownKey, storedCopies, writerId } from './writerKeys.js'

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
 *
 * Each tab writes only its own copy (see writerKeys.js) and reads the union of
 * every copy, so no tab can overwrite what another tab saved, even when its
 * view of storage is momentarily stale.
 */

// The access the learner's own tab would capture, for the few unscoped callers.
const unscopedAccess = {
  valid: () => true,
  keys: () => localStorage.keys(),
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
/*
 * P5: when each of THIS page's events was first saved durably. The in-memory
 * copy never receives the stamps (only what is written does), so a tab left
 * open for weeks still holds old events without one. Stamping those with
 * "now" would make them look never-saved — and, once their writer is pruned,
 * count them again. So the first confirmed save time is remembered here and
 * reused; only events never confirmed get the time of the current attempt.
 */
const confirmedSaves = new Map()
let attemptedSaves = null

function withConfirmedSaves(ledger, writer) {
  if (!confirmedSaves.size) return ledger
  return { ...ledger, events: ledger.events.map(event => event.w === writer && !Number.isFinite(event.saved)
    && confirmedSaves.has(event.id) ? { ...event, saved: confirmedSaves.get(event.id) } : event) }
}

function confirmSaves() {
  for (const [id, at] of attemptedSaves || []) if (!confirmedSaves.has(id)) confirmedSaves.set(id, at)
  attemptedSaves = null
}

export function mergeIntoStoredProgress(access, progress, now = Date.now()) {
  // P5: this page's own never-saved events carry the time of this attempt
  const writer = writerId()
  let merged = progress ? stampUnsaved(withConfirmedSaves(ledgerOf(progress), writer), writer, now) : null
  for (const copy of storedCopies(access, STORAGE_KEYS.progress)) {
    const stored = parseStoredProgress(copy.raw)
    if (stored.unreadable) {
      if (!quarantineValue(access, copy.key, copy.raw)) throw new Error('Unreadable progress could not be preserved')
      continue
    }
    merged = mergeLedgers(merged, stored.ledger)
  }
  // the save time each own event will have once this write is confirmed (earliest copy wins the merge)
  attemptedSaves = merged ? merged.events.filter(event => event.w === writer && Number.isFinite(event.saved))
    .map(event => [event.id, event.saved]) : null
  return compactLedger(merged || createLedger(), now)
}

// This tab's copy: the ledger plus who wrote it and when (for cleanup).
export function serializeStoredProgress(ledger) {
  return JSON.stringify({ ...serializeLedger(ledger), writer: writerId(), writtenAt: Date.now() })
}

/*
 * Copies left by closed tabs that add nothing to this tab's own copy are
 * removed after a save (writerKeys.collectDeadCopies); they are never needed
 * again, and a copy whose tab may still be open is never touched.
 */
export { collectDeadCopies }

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
// A stored conversation copy: the shared key holds an array, a writer's copy
// holds { writer, writtenAt, messages }. Null if it is neither.
function messagesOf(parsed) {
  if (Array.isArray(parsed)) return parsed
  return Array.isArray(parsed?.messages) ? parsed.messages : null
}

export function mergeIntoStoredMessages(access, messages) {
  const epochAt = conversationEpochAt(access.getItem(STORAGE_KEYS.chatEpoch))
  let merged = Array.isArray(messages) ? messages : []
  for (const copy of storedCopies(access, STORAGE_KEYS.messages)) {
    let stored = null
    try { stored = messagesOf(JSON.parse(copy.raw)) } catch { stored = null }
    if (!stored) {
      if (!quarantineValue(access, copy.key, copy.raw)) throw new Error('Unreadable chat could not be preserved')
      continue
    }
    merged = mergeMessageLists(stored, merged, epochAt)
  }
  return mergeMessageLists([], merged, epochAt)
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
    const messages = readStoredConversation({ access: unscopedAccess })?.messages || []
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
      const merged = mergeIntoStoredMessages(access, messages)
      const key = ownKey(STORAGE_KEYS.messages)
      const serialized = JSON.stringify({ writer: writerId(), writtenAt: Date.now(), messages: merged })
      if (!access.valid() || access.setItem(key, serialized) === false
        || !access.valid() || access.getItem(key) !== serialized) return false
      const held = new Set(merged.map(messageKey))
      const epochAt = conversationEpochAt(access.getItem(STORAGE_KEYS.chatEpoch))
      collectDeadCopies(access, STORAGE_KEYS.messages, parsed => (messagesOf(parsed) || [])
        .every(message => held.has(messageKey(message)) || (Number(message?.ts) || 0) < epochAt))
      return access.valid()
    } catch {
      return false
    }
  }
  // Keep the existing best-effort path for passive state persistence.
  try { saveStoredMessages(messages, { access: unscopedAccess }) } catch {}
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
    const epochAt = conversationEpochAt(access.getItem(STORAGE_KEYS.chatEpoch))
    let messages = []
    for (const copy of storedCopies(access, STORAGE_KEYS.messages)) {
      let stored = null
      try { stored = messagesOf(JSON.parse(copy.raw)) } catch { stored = null }
      if (stored) messages = mergeMessageLists(stored, messages, epochAt)
    }
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
    // Unreadable copies are left out in memory; the first save quarantines
    // their bytes. Nothing replaces them.
    const ledger = readStoredLedger(unscopedAccess)
    if (ledger) return progressFromLedger({ ...ledger, base: { ...ledger.base, startedAt: ledger.base.startedAt ?? Date.now() } })
  } catch {}
  return createEmptyProgress()
}

/* What another tab saved, for the `storage` listener. Null if absent or unreadable. */
function readStoredLedger(access) {
  let merged = null
  for (const copy of storedCopies(access, STORAGE_KEYS.progress)) {
    const { ledger } = parseStoredProgress(copy.raw)
    if (ledger) merged = mergeLedgers(merged, ledger)
  }
  return merged
}

export function readStoredProgress({ access }) {
  try {
    if (!access.valid()) return null
    const ledger = readStoredLedger(access)
    return ledger && access.valid() ? progressFromLedger(ledger) : null
  } catch {
    return null
  }
}

/* Fold another copy into this one. Same object if it adds nothing. */
export function mergeLocalProgress(progress, other, now = Date.now()) {
  // P5: this page's own events carry their save time (confirmed, or this
  // moment if never saved) while they meet the stored copies, so a turn that
  // never reached storage is not mistaken for one a pruned writer folded.
  const writer = writerId()
  const mine = stampUnsaved(withConfirmedSaves(ledgerOf(progress), writer), writer, now)
  const merged = mergeLedgers(mine, ledgerOf(other))
  return sameLedger(merged, mine) ? progress : progressFromLedger(merged)
}

export function saveLocalProgress(progress, { access = null } = {}) {
  if (access) {
    // Merge with what storage holds now (another tab may have saved since this
    // copy was read) and verify the write before reporting success.
    try {
      if (!access.valid()) return false
      const ledger = mergeIntoStoredProgress(access, progress)
      const key = ownKey(STORAGE_KEYS.progress)
      const serialized = serializeStoredProgress(ledger)
      if (!access.valid() || access.setItem(key, serialized) === false
        || !access.valid() || access.getItem(key) !== serialized) return false
      confirmSaves()
      collectDeadCopies(access, STORAGE_KEYS.progress, parsed => {
        const theirs = ledgerFromStored(parsed)
        return Boolean(theirs) && sameLedger(mergeLedgers(ledger, theirs), ledger)
      })
      return access.valid()
    } catch {
      return false
    }
  }
  try { saveLocalProgress(progress, { access: unscopedAccess }) } catch {}
}

/*
 * Apply one identified event to an in-memory copy. Applying an event this copy
 * already holds changes nothing, so retries and replays never pay twice.
 */
/*
 * The identity of a new event (P4): this page's writer id and its next
 * sequence number. Rewards keep their stable ids instead (a retry or another
 * tab must find the SAME id), so they get none.
 */
const sequences = new Map()
function withIdentity(event) {
  if (!event || isStableEventId(event.id) || event.w) return event
  const w = writerId()
  const seq = (sequences.get(w) || 0) + 1
  sequences.set(w, seq)
  return { ...event, w, seq }
}

export function applyProgressEvent(progress, rawEvent) {
  const ledger = ledgerOf(progress)
  const event = withIdentity(rawEvent)
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
    const key = ownKey(STORAGE_KEYS.progress)
    const serialized = serializeStoredProgress(addEvent(mergeIntoStoredProgress(access, null), event))
    if (!access.valid() || access.setItem(key, serialized) === false || !access.valid()) return false
    const { ledger } = parseStoredProgress(access.getItem(key))
    // Already folded into the base (paid long ago) counts as committed: the
    // caller must not retry forever, and nothing is paid twice.
    const held = ledger?.events.some(stored => stored.id === event.id) || isFoldedReward(ledger?.base, event.id)
    return Boolean(held) && access.valid()
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
