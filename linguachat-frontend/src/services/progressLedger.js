/*
 * Local progress as a ledger of identified events.
 *
 * WHY
 * ---
 * Every open tab holds its own copy of the learner's local progress and used to
 * persist that copy whole, so the tab that saved last erased what the other tab
 * had earned in the meantime: XP, streak days, words, chat turns. Taking the
 * larger counter or the newest copy would only hide the loss differently.
 *
 * So progress is stored as what happened, not as totals:
 *
 *   { version: 2, epoch, base, events }
 *
 * - `events` are the recent things that changed progress (a practice turn, a
 *   mission step, an episode award, a session bonus), each with a stable `id`.
 *   Two copies merge by the union of their ids, so the same reward reaching
 *   storage twice is applied once, and two different rewards are both kept.
 * - The totals the UI reads (xp, streak, confidence, topics, ...) are a fold of
 *   `base` plus `events` in time order, with the same rules the app always used.
 *   A streak therefore follows the calendar of the events, never the order in
 *   which two tabs happened to save.
 * - `base` is the folded snapshot of events older than the horizon, so the
 *   ledger stays small. An event older than `base.foldedBefore` is already in
 *   it and is ignored on merge.
 * - `epoch` marks an explicit reset. Everything before the newest reset is
 *   gone, including a stale tab's older copy; anything that tab does after the
 *   reset still counts.
 *
 * Everything here is pure and deterministic: the same two inputs always merge
 * to the same output, whichever tab does it.
 */

export const PROGRESS_VERSION = 2
export const LEDGER_HORIZON_MS = 7 * 86400000
export const LEDGER_MAX_EVENTS = 500
export const INITIAL_EPOCH = Object.freeze({ id: 'initial', at: 0 })

const EVENT_KINDS = new Set(['practice', 'mission', 'award', 'xp'])

const TOPIC_RULES = [
  ['travel', /\b(travel|trip|city|country|flight|hotel|train)\b/i],
  ['work', /\b(work|job|interview|office|career)\b/i],
  ['food', /\b(food|eat|restaurant|cook|meal)\b/i],
  ['hobbies', /\b(game|music|sport|movie|hobby|play)\b/i],
  ['feelings', /\b(feel|happy|sad|nervous|excited|tired)\b/i],
]

export function emptySnapshot() {
  return {
    lastPracticeDate: null,
    streak: 0,
    messagesSent: 0,
    correctionsReceived: 0,
    xp: 0,
    confidence: 45,
    topics: [],
    learnedItems: [],
    sessions: [],
    missionsCompleted: 0,
  }
}

const SNAPSHOT_FIELDS = Object.keys(emptySnapshot())

export function makeEventId(prefix = 'progress') {
  if (globalThis.crypto?.randomUUID) return `${prefix}:${globalThis.crypto.randomUUID()}`
  return `${prefix}:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export function dateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dayDifference(from, to) {
  if (!from || !to) return null
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  return Math.round((end - start) / 86400000)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

const finite = (value, fallback = 0) => (Number.isFinite(value) ? value : fallback)
const clip = (text, max) => (typeof text === 'string' ? text.slice(0, max) : null)

/* ------------------------------------------------------------ the events -- */

function inferTopics(message, response) {
  const topics = TOPIC_RULES
    .filter(([, pattern]) => pattern.test(message))
    .map(([topic]) => topic)
  if (response.mode === 'translation') topics.push('translation')
  if (response.correction) topics.push('grammar')
  if (!topics.length) topics.push('conversation')
  return unique(topics)
}

function learnedCandidate(response) {
  if (response.correction) {
    return { phrase: response.correction, kind: 'correction', mastery: 0.55, marker: 'Fix' }
  }
  if (response.mode === 'translation') {
    return { phrase: String(response.reply || '').split('(')[0].trim(), kind: 'translation', mastery: 0.45, marker: 'Aa' }
  }
  // Suggestions and action prompts are teaching instructions, not typed
  // vocabulary. Do not manufacture learned items from these arbitrary fields.
  return null
}

/*
 * Everything a chat turn changes, computed once when it happens. The message
 * text itself is not kept: only what the totals need (topics, the session
 * preview line, the correction line), clipped so the ledger stays bounded.
 */
export function practiceEvent({ userMessage = '', response = {}, at = Date.now(), id = makeEventId('practice') } = {}) {
  const message = String(userMessage || '')
  const candidate = learnedCandidate(response)
  return {
    id,
    kind: 'practice',
    at,
    day: dateKey(new Date(at)),
    xp: 10 + (response.correction ? 5 : 0),
    corrected: Boolean(response.correction),
    topics: inferTopics(message, response),
    learned: candidate?.phrase && candidate.phrase.length <= 100
      ? { ...candidate, example: clip(response.suggestion || response.reply || '', 300) }
      : null,
    preview: message.slice(0, 140),
    correctionLine: response.correction ? clip(`${message} -> ${response.correction}`, 1000) : null,
  }
}

export function missionEvent({ mission, step, earnedXp = 0, completed = false, at = Date.now(), id = makeEventId('mission') } = {}) {
  return {
    id,
    kind: 'mission',
    at,
    day: dateKey(new Date(at)),
    xp: Math.max(0, finite(earnedXp)),
    completed: Boolean(completed),
    topics: unique([mission?.type?.toLowerCase(), step?.type]),
  }
}

function sanitizeGrant(grant) {
  if (!grant || typeof grant !== 'object' || typeof grant.vocabId !== 'string') return null
  const out = { vocabId: grant.vocabId }
  if (typeof grant.word === 'string') out.word = grant.word
  if (typeof grant.kind === 'string') out.kind = grant.kind
  return out
}

/* An event read back from storage is untrusted: keep only what the fold uses. */
export function sanitizeEvent(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id) return null
  if (!EVENT_KINDS.has(raw.kind) || !Number.isFinite(raw.at)) return null
  const xp = Math.max(0, Math.min(100000, finite(raw.xp)))
  const base = { id: raw.id, kind: raw.kind, at: raw.at, xp }
  if (raw.kind === 'xp') return base
  if (raw.kind === 'award') return { ...base, grants: Array.isArray(raw.grants) ? raw.grants.map(sanitizeGrant).filter(Boolean) : [] }
  const day = typeof raw.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.day) ? raw.day : dateKey(new Date(raw.at))
  const topics = Array.isArray(raw.topics) ? raw.topics.filter(t => typeof t === 'string').slice(0, 12) : []
  if (raw.kind === 'mission') return { ...base, day, topics, completed: Boolean(raw.completed) }
  const learned = raw.learned && typeof raw.learned === 'object' && typeof raw.learned.phrase === 'string'
    ? {
        phrase: raw.learned.phrase.slice(0, 100),
        kind: String(raw.learned.kind || ''),
        mastery: finite(raw.learned.mastery, 0.45),
        marker: String(raw.learned.marker || ''),
        example: clip(raw.learned.example, 300) || '',
      }
    : null
  return {
    ...base, day, topics, learned,
    corrected: Boolean(raw.corrected),
    preview: clip(raw.preview, 140) || '',
    correctionLine: clip(raw.correctionLine, 1000),
  }
}

/* -------------------------------------------------------------- the fold -- */

function nextStreak(snapshot, day) {
  const difference = dayDifference(snapshot.lastPracticeDate, day)
  return difference === 0
    ? snapshot.streak
    : difference === 1
      ? snapshot.streak + 1
      : 1
}

function updateLearnedItems(items, learned, at) {
  if (!learned?.phrase) return items
  const id = learned.phrase.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (!id) return items
  const existing = items.find(item => item.id === id)
  const nextItem = existing
    ? {
        ...existing,
        mastery: Math.min(0.95, existing.mastery + 0.08),
        seen: (existing.seen || 1) + 1,
        lastSeenAt: at,
        example: learned.example,
      }
    : {
        id,
        word: learned.phrase,
        trans: learned.kind,
        mastery: learned.mastery,
        emoji: learned.marker,
        example: learned.example,
        addedAt: at,
        lastSeenAt: at,
        seen: 1,
      }
  return [nextItem, ...items.filter(item => item.id !== id)].slice(0, 40)
}

function updateSessions(sessions, event, confidence) {
  const existing = sessions.find(session => session.id === event.day)
  const updated = {
    id: event.day,
    date: event.day,
    topic: event.topics[0]?.replace(/^./, letter => letter.toUpperCase()) || 'Conversation',
    mood: 'LC',
    moodLabel: 'Practicing',
    confidence: Math.max(5, Math.min(10, Math.round(confidence / 10))),
    messages: (existing?.messages || 0) + 2,
    preview: event.preview,
    tags: unique([...(existing?.tags || []), ...event.topics]).slice(0, 4),
    correction: event.correctionLine || existing?.correction || null,
  }
  return [updated, ...sessions.filter(session => session.id !== event.day)].slice(0, 30)
}

/* One event applied to totals: the rules the app has always used. */
export function applyToSnapshot(snapshot, event) {
  const s = snapshot
  switch (event.kind) {
    case 'practice': {
      const messagesSent = s.messagesSent + 1
      const correctionsReceived = s.correctionsReceived + (event.corrected ? 1 : 0)
      const confidence = Math.min(95, 45 + messagesSent * 2 + correctionsReceived)
      return {
        ...s,
        lastPracticeDate: event.day,
        streak: nextStreak(s, event.day),
        messagesSent,
        correctionsReceived,
        xp: s.xp + event.xp,
        confidence,
        topics: unique([...event.topics, ...s.topics]).slice(0, 12),
        learnedItems: updateLearnedItems(s.learnedItems, event.learned, event.at),
        sessions: updateSessions(s.sessions, event, confidence),
      }
    }
    case 'mission':
      return {
        ...s,
        lastPracticeDate: event.day,
        streak: nextStreak(s, event.day),
        xp: (s.xp || 0) + event.xp,
        confidence: Math.min(95, (s.confidence || 45) + (event.completed ? 2 : 1)),
        topics: unique([...event.topics, ...(s.topics || [])]).slice(0, 12),
        missionsCompleted: (s.missionsCompleted || 0) + (event.completed ? 1 : 0),
      }
    case 'award': {
      const existing = new Set((s.learnedItems || []).map(item => item.vocabId).filter(Boolean))
      const additions = event.grants
        .filter(grant => !existing.has(grant.vocabId))
        .map(grant => ({ ...grant, lastSeenAt: event.at }))
      return {
        ...s,
        learnedItems: [...additions, ...(s.learnedItems || [])],
        xp: (s.xp || 0) + event.xp,
      }
    }
    case 'xp':
      return { ...s, xp: (s.xp || 0) + event.xp }
    default:
      return s
  }
}

const byTime = (a, b) => (a.at - b.at) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

export function foldEvents(snapshot, events) {
  return [...events].sort(byTime).reduce(applyToSnapshot, snapshot)
}

/* ----------------------------------------------------------- the ledger -- */

export function snapshotFrom(raw) {
  return sanitizeSnapshot(raw)
}

function sanitizeSnapshot(raw) {
  const empty = emptySnapshot()
  const out = { ...empty }
  if (!raw || typeof raw !== 'object') return out
  for (const field of SNAPSHOT_FIELDS) {
    const value = raw[field]
    if (Array.isArray(empty[field])) out[field] = Array.isArray(value) ? value : []
    else if (field === 'lastPracticeDate') out[field] = typeof value === 'string' ? value : null
    else out[field] = Number.isFinite(value) ? value : empty[field]
  }
  return out
}

function sanitizeEpoch(raw) {
  return raw && typeof raw.id === 'string' && Number.isFinite(raw.at) ? { id: raw.id, at: raw.at } : { ...INITIAL_EPOCH }
}

export function createLedger({ epoch = INITIAL_EPOCH, startedAt = Date.now(), snapshot = emptySnapshot() } = {}) {
  return {
    epoch: { ...epoch },
    base: { snapshot: sanitizeSnapshot(snapshot), startedAt, foldedBefore: 0, folded: 0 },
    events: [],
  }
}

/*
 * A version-1 record (the totals themselves) becomes the base of a ledger with
 * no events: its numbers are kept exactly, and new events are added on top.
 */
export function ledgerFromLegacy(saved) {
  return createLedger({
    startedAt: Number.isFinite(saved?.startedAt) ? saved.startedAt : null,
    snapshot: sanitizeSnapshot(saved),
  })
}

/* Parse what storage holds. Returns null for anything that is not progress. */
export function ledgerFromStored(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  if (value.version !== PROGRESS_VERSION) return ledgerFromLegacy(value)
  if (!value.base || typeof value.base !== 'object' || !Array.isArray(value.events)) return null
  const base = value.base
  return {
    epoch: sanitizeEpoch(value.epoch),
    base: {
      snapshot: sanitizeSnapshot(base.snapshot),
      startedAt: Number.isFinite(base.startedAt) ? base.startedAt : null,
      foldedBefore: Math.max(0, finite(base.foldedBefore)),
      folded: Math.max(0, finite(base.folded)),
    },
    events: dedupe(value.events.map(sanitizeEvent).filter(Boolean)),
  }
}

export function serializeLedger(ledger) {
  return { version: PROGRESS_VERSION, epoch: ledger.epoch, base: ledger.base, events: ledger.events }
}

function canonical(value) { return JSON.stringify(value) }

// One event per id. Should two copies ever disagree about the same id, keep a
// deterministic one so every tab converges on the same result.
function dedupe(events) {
  const byId = new Map()
  for (const event of events) {
    const current = byId.get(event.id)
    if (!current || canonical(event) < canonical(current)) byId.set(event.id, event)
  }
  return [...byId.values()].sort(byTime)
}

const newerEpoch = (a, b) => (a.at !== b.at ? (a.at > b.at ? a : b) : (a.id >= b.id ? a : b))

function preferredBase(a, b) {
  if (a.foldedBefore !== b.foldedBefore) return a.foldedBefore > b.foldedBefore ? a : b
  if (a.folded !== b.folded) return a.folded > b.folded ? a : b
  return canonical(a) <= canonical(b) ? a : b
}

/*
 * The union of two copies. Commutative, associative and idempotent, so it does
 * not matter which tab merges or how often.
 */
export function mergeLedgers(a, b) {
  if (!a) return b
  if (!b) return a
  const epoch = newerEpoch(a.epoch, b.epoch)
  const sameEpoch = [a, b].filter(l => l.epoch.id === epoch.id && l.epoch.at === epoch.at)
  const base = sameEpoch.map(l => l.base).reduce(preferredBase)
  const events = dedupe([...a.events, ...b.events])
    .filter(event => event.at >= epoch.at && event.at >= base.foldedBefore)
  return { epoch: { ...epoch }, base, events }
}

export function hasEvent(ledger, id) {
  return Boolean(ledger?.events.some(event => event.id === id))
}

export function addEvent(ledger, raw) {
  const event = sanitizeEvent(raw)
  if (!event) throw new Error('Invalid progress event')
  if (hasEvent(ledger, event.id)) return ledger
  // An event from before a reset or already folded into the base cannot be
  // added again; it was either erased by the learner or already counted.
  if (event.at < ledger.epoch.at || event.at < ledger.base.foldedBefore) return ledger
  return { ...ledger, events: dedupe([...ledger.events, event]) }
}

/*
 * Fold old events into the base so the ledger stays bounded. Only events older
 * than the horizon (or beyond the size cap) are folded; a copy still holding
 * one of them later will see it as already counted.
 */
export function compactLedger(ledger, now = Date.now()) {
  const events = [...ledger.events].sort(byTime)
  let cutoff = now - LEDGER_HORIZON_MS
  if (events.length > LEDGER_MAX_EVENTS) cutoff = Math.max(cutoff, events[events.length - LEDGER_MAX_EVENTS].at)
  const folding = events.filter(event => event.at < cutoff)
  if (!folding.length) return ledger
  return {
    ...ledger,
    base: {
      ...ledger.base,
      snapshot: foldEvents(ledger.base.snapshot, folding),
      foldedBefore: Math.max(ledger.base.foldedBefore, cutoff),
      folded: ledger.base.folded + folding.length,
    },
    events: events.filter(event => event.at >= cutoff),
  }
}

export function deriveSnapshot(ledger) {
  return foldEvents(ledger.base.snapshot, ledger.events)
}

export function sameLedger(a, b) {
  return canonical(a) === canonical(b)
}
