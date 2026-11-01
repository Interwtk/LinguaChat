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
 *   ledger stays small.
 * - P4: whether an event is already in the base is decided by its IDENTITY,
 *   not its time. New events carry their writer and a per-writer sequence
 *   (`w`, `seq`); the base records, per writer, the highest sequence it has
 *   folded (`coverage`). An event no fold has seen — a turn whose save kept
 *   failing while another tab compacted past it — is not covered, so it is
 *   kept and counted on arrival, however old its timestamp. (Until P3 the
 *   rule was "older than `foldedBefore` means counted", which dropped it.)
 *   Events written before P4 have no identity and keep the time rule, as do
 *   bases written by older code (no `coverage` field).
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
/*
 * The size cap never folds anything this recent (P2). Folding is a cut by
 * time: whatever sits below the cut and is not in this copy is treated as
 * already counted. Another tab's events can be invisible here for a moment —
 * a busy tab's storage cache lags — so a cut through the last seconds dropped
 * them: two real tabs writing 600 turns each lost 101 (P1 code too). Events
 * older than this margin have long reached every open tab, so a prefix cut
 * below it folds the same events in every copy. The ledger may briefly hold
 * more than LEDGER_MAX_EVENTS; the next save after the margin folds them.
 */
export const LEDGER_SETTLE_MS = 10 * 60 * 1000
/*
 * A writer's coverage entry is kept while it can still matter: 30 days after
 * the last event of that writer that was folded, and only once none of its
 * events is still pending in this ledger. After that its events are judged by
 * `prunedBefore` — so a turn stranded for MORE than 30 days behind a failing
 * save is the remaining, documented limit. Without pruning, every page load
 * (a new writer) would grow the base forever.
 */
export const COVERAGE_KEEP_MS = 30 * 86400000
const WRITER_ID = /^[A-Za-z0-9._:-]{1,80}$/
export const INITIAL_EPOCH = Object.freeze({ id: 'initial', at: 0 })
/*
 * Rewards with a stable id (an episode award, a daily bonus, a mission step)
 * may legitimately be sent again by a retry or a second tab. When their event
 * is folded into the base its id must still be remembered, or the same reward
 * would be paid twice.
 *
 * Remembering every id forever would grow without bound, and a plain cap (the
 * P1 design) silently forgot the oldest ones — the alphabetical cut dropped
 * every episode award first. Instead each family has an explicit guarantee:
 *
 *   episode-award:<episodeId>          one per curriculum episode: a finite
 *                                      set, kept in full, never pruned.
 *   session-bonus:<YYYY-MM-DD>:<mode>  time-keyed by its day.
 *   mission:<missionId>:<startedAt>:…  time-keyed by when the mission began.
 *
 * A time-keyed family keeps its newest REWARD_FAMILY_KEEP ids exactly; older
 * ones are replaced by a floor (the newest key ever pruned). Any id of that
 * family whose key is at or below the floor is refused as already paid. A new
 * reward always has a newer key (today's session, a mission started now), so
 * it is never refused — unless the device clock is set back past hundreds of
 * folded rewards, which is documented, not hidden.
 */
export const REWARD_FAMILY_KEEP = 400
const FAMILIES = [
  { name: 'episode', match: id => /^episode-award:/.test(id), key: null },
  { name: 'session', match: id => /^session-bonus:\d{4}-\d{2}-\d{2}/.test(id), key: id => id.slice(14, 24) },
  { name: 'mission', match: id => /^mission:[^:]+:\d+:/.test(id), key: id => id.split(':')[2].padStart(16, '0') },
]
const familyOf = id => FAMILIES.find(family => family.match(id)) || null
export const isStableEventId = id => typeof id === 'string' && Boolean(familyOf(id))

function sanitizeFloors(raw) {
  const out = {}
  for (const family of FAMILIES) {
    if (family.key && typeof raw?.[family.name] === 'string' && raw[family.name]) out[family.name] = raw[family.name]
  }
  return out
}

// Already paid: remembered exactly, or at/below its family's floor.
export function isFoldedReward(base, id) {
  if ((base?.foldedIds || []).includes(id)) return true
  const family = familyOf(id)
  const floor = family?.key ? base?.foldedFloors?.[family.name] : null
  return Boolean(floor && family.key(id) <= floor)
}

// Keep every episode id; keep each time-keyed family's newest ids, and move
// the rest into its floor. Deterministic, so every tab prunes the same way.
function pruneFolded(ids, floors) {
  const nextFloors = { ...floors }
  const keep = []
  for (const family of FAMILIES) {
    const own = [...new Set(ids.filter(family.match))]
    if (!family.key) { keep.push(...own); continue }
    const floor = nextFloors[family.name] || ''
    const live = own.filter(id => !floor || family.key(id) > floor)
      .sort((x, y) => (family.key(x) < family.key(y) ? -1 : family.key(x) > family.key(y) ? 1 : x < y ? -1 : 1))
    const cut = Math.max(0, live.length - REWARD_FAMILY_KEEP)
    if (cut) nextFloors[family.name] = live.slice(0, cut).map(family.key).reduce((a, b) => (a > b ? a : b), floor)
    keep.push(...live.slice(cut).filter(id => !nextFloors[family.name] || family.key(id) > nextFloors[family.name]))
  }
  return { foldedIds: keep.sort(), foldedFloors: nextFloors }
}

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
  if (typeof raw.w === 'string' && WRITER_ID.test(raw.w) && Number.isInteger(raw.seq) && raw.seq > 0) {
    base.w = raw.w
    base.seq = raw.seq
  }
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

/*
 * The calendar fields for one event. An event that arrives LATE — older than
 * the last practice day already counted (a recovered stranded turn) — is
 * counted in every total but cannot move the last practice day backwards or
 * restart the streak. (It cannot extend a streak retroactively either: the
 * days in between are not kept. A rare under-count of a streak, never a loss
 * of the turn itself.)
 */
function calendar(snapshot, day) {
  if (snapshot.lastPracticeDate && day < snapshot.lastPracticeDate) {
    return { lastPracticeDate: snapshot.lastPracticeDate, streak: snapshot.streak }
  }
  return { lastPracticeDate: day, streak: nextStreak(snapshot, day) }
}

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
        ...calendar(s, event.day),
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
        ...calendar(s, event.day),
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
    base: { snapshot: sanitizeSnapshot(snapshot), startedAt, foldedBefore: 0, folded: 0, foldedIds: [], foldedFloors: {}, coverage: {}, prunedBefore: 0 },
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
      // P1 ledgers kept up to 2000 ids and no floors: kept as they are, then
      // pruned by family on the next save.
      ...pruneFolded(Array.isArray(base.foldedIds) ? base.foldedIds.filter(isStableEventId) : [], sanitizeFloors(base.foldedFloors)),
      // absent on bases written before P4: those keep the time rule entirely
      ...(base.coverage && typeof base.coverage === 'object' && !Array.isArray(base.coverage)
        ? { coverage: sanitizeCoverage(base.coverage), prunedBefore: Math.max(0, finite(base.prunedBefore)) } : {}),
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

/*
 * Per writer, exactly which events were folded: the sequence range
 * [min, max] minus `holes` (numbers inside the range not folded yet — only
 * when a writer's clock disagreed with its own order, a backdated turn). No
 * time is involved, and the range does not need to start at 1 (after a reset
 * a tab's sequence simply continues).
 */
const HOLES_LIMIT = 64
function sanitizeCoverage(raw) {
  const out = {}
  for (const [w, entry] of Object.entries(raw)) {
    const { min, max, at } = entry || {}
    if (!WRITER_ID.test(w) || !Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min || !Number.isFinite(at)) continue
    const holes = Array.isArray(entry.holes)
      ? [...new Set(entry.holes.filter(n => Number.isInteger(n) && n > min && n < max))].sort((x, y) => x - y).slice(0, HOLES_LIMIT) : []
    out[w] = holes.length ? { min, max, at, holes } : { min, max, at }
  }
  return out
}

const coverageHas = (entry, seq) => Boolean(entry) && seq >= entry.min && seq <= entry.max && !entry.holes?.includes(seq)

/* The entry once `event` is folded too — or null if that would scatter it beyond HOLES_LIMIT. */
function coverageAdd(entry, event) {
  const n = event.seq
  if (!entry) return { min: n, max: n, at: event.at }
  const holes = new Set(entry.holes || [])
  let { min, max } = entry
  if (n > max) { for (let k = max + 1; k < n; k++) holes.add(k); max = n }
  else if (n < min) { for (let k = n + 1; k < min; k++) holes.add(k); min = n }
  else holes.delete(n)
  if (holes.size > HOLES_LIMIT) return null
  const out = { min, max, at: Math.max(entry.at, event.at) }
  if (holes.size) out.holes = [...holes].sort((x, y) => x - y)
  return out
}

const hasIdentity = event => typeof event.w === 'string' && Number.isInteger(event.seq)

/*
 * Is this event already counted in `base`? By identity when both sides have
 * one; by time for events and bases from before P4.
 */
export function isCovered(base, event) {
  if (!base) return false
  if (hasIdentity(event) && base.coverage) {
    const entry = base.coverage[event.w]
    return entry ? coverageHas(entry, event.seq) : event.at <= (base.prunedBefore || 0)
  }
  return event.at < (base.foldedBefore || 0)
}

/*
 * A base that does not contain everything another one folded. Both cannot be
 * kept (the folded events are gone), so this is reported, not hidden: tests
 * assert it never happens under the conditions they cover (see the P4 report).
 */
export const ledgerDiagnostics = { baseConflicts: 0 }
function noteConflict(chosen, other) {
  if (!chosen.coverage || !other.coverage) return
  for (const [w, entry] of Object.entries(other.coverage)) {
    const mine = chosen.coverage[w]
    const lost = !mine ? entry.at > (chosen.prunedBefore || 0)
      : entry.min < mine.min || entry.max > mine.max || (mine.holes || []).some(n => coverageHas(entry, n))
    if (lost) { ledgerDiagnostics.baseConflicts++; return }
  }
}

const newerEpoch = (a, b) => (a.at !== b.at ? (a.at > b.at ? a : b) : (a.id >= b.id ? a : b))

function preferredBase(a, b) {
  const chosen = choose(a, b)
  noteConflict(chosen, chosen === a ? b : a)
  return chosen
}
function choose(a, b) {
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
  const preferred = sameEpoch.map(l => l.base).reduce(preferredBase)
  // A reward folded in either copy stays counted, whichever base is kept:
  // the union of remembered ids and the higher floor of each family.
  const floors = {}
  for (const l of sameEpoch) {
    for (const [name, floor] of Object.entries(l.base.foldedFloors || {})) if (!floors[name] || floor > floors[name]) floors[name] = floor
  }
  const base = { ...preferred, ...pruneFolded(sameEpoch.flatMap(l => l.base.foldedIds || []), floors) }
  const events = dedupe([...a.events, ...b.events])
    .filter(event => event.at >= epoch.at && !isCovered(base, event) && !isFoldedReward(base, event.id))
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
  if (event.at < ledger.epoch.at || isCovered(ledger.base, event)) return ledger
  if (isFoldedReward(ledger.base, event.id)) return ledger
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
  if (events.length > LEDGER_MAX_EVENTS) {
    cutoff = Math.max(cutoff, Math.min(events[events.length - LEDGER_MAX_EVENTS].at, now - LEDGER_SETTLE_MS))
  }
  /*
   * Below the cut by time. For events with an identity, coverage records
   * exactly which ones were folded, so it can never claim an event that was
   * not folded, whatever order the clock gave them.
   */
  const folding = new Set()
  const byWriter = new Map()
  for (const event of events) {
    if (!hasIdentity(event)) { if (event.at < cutoff) folding.add(event); continue }
    if (!byWriter.has(event.w)) byWriter.set(event.w, [])
    byWriter.get(event.w).push(event)
  }
  const coverage = { ...(ledger.base.coverage || {}) }
  for (const [w, list] of byWriter) {
    list.sort((x, y) => x.seq - y.seq)
    for (const event of list) {
      if (event.at >= cutoff) continue
      const next = coverageAdd(coverage[w], event)
      if (!next) continue                    // too scattered for now: it stays an event, folded later
      coverage[w] = next
      folding.add(event)
    }
  }
  const remaining = events.filter(event => !folding.has(event))
  // forget writers that cannot matter any more (see COVERAGE_KEEP_MS)
  let prunedBefore = ledger.base.prunedBefore || 0
  const pending = new Set(remaining.filter(hasIdentity).map(event => event.w))
  for (const [w, entry] of Object.entries(coverage)) {
    if (entry.at < now - COVERAGE_KEEP_MS && !pending.has(w)) {
      prunedBefore = Math.max(prunedBefore, entry.at)
      delete coverage[w]
    }
  }
  const coverageChanged = JSON.stringify(coverage) !== JSON.stringify(ledger.base.coverage || {})
  if (!folding.size && !coverageChanged && ledger.base.coverage) return ledger
  const folded = [...folding].sort(byTime)
  return {
    ...ledger,
    base: {
      ...ledger.base,
      snapshot: foldEvents(ledger.base.snapshot, folded),
      foldedBefore: folded.length ? Math.max(ledger.base.foldedBefore, cutoff) : ledger.base.foldedBefore,
      folded: ledger.base.folded + folded.length,
      ...pruneFolded([...(ledger.base.foldedIds || []), ...folded.map(e => e.id).filter(isStableEventId)],
        ledger.base.foldedFloors || {}),
      coverage,
      prunedBefore,
    },
    events: remaining,
  }
}

export function deriveSnapshot(ledger) {
  return foldEvents(ledger.base.snapshot, ledger.events)
}

export function sameLedger(a, b) {
  return canonical(a) === canonical(b)
}
