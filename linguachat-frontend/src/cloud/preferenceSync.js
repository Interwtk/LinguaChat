import { toCloudPreferenceFields, validCloudPreferenceFields as validFields } from '../services/cloudPreferenceMapping.js'
import { captureLearnerAccess } from '../auth/localLease.js'
import { preferenceRevisionTime } from './preferenceTransport.js'

const FIELDS = Object.keys(toCloudPreferenceFields())
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const copy = value => JSON.parse(JSON.stringify(value))
const fields = row => Object.fromEntries(FIELDS.filter(key => Object.hasOwn(row || {}, key)).map(key => [key, Array.isArray(row[key]) ? [...row[key]] : row[key]]))

const object = value => value && typeof value === 'object' && !Array.isArray(value)
const validJournal = (journal, id) => object(journal) && journal.version === 1 && journal.userId === id
  && Object.keys(journal).every(key => ['version', 'userId', 'base', 'backup', 'conflicts', 'pendingImport'].includes(key))
  && (journal.base === null || validFields(journal.base))
  && validFields(journal.backup) && validFields(journal.conflicts, true)
  && (!Object.hasOwn(journal, 'pendingImport') || journal.pendingImport === null
    || (journal.base !== null && object(journal.pendingImport)
      && Object.keys(journal.pendingImport).every(key => ['before', 'value'].includes(key)) && validFields(journal.pendingImport.before)
      && validFields(journal.pendingImport.value)))

// Three-way merge. Disjoint edits survive. For simultaneous edits of one field,
// the already committed remote value wins, irrespective of the device clock.
// The losing local choice remains in the account journal for explicit recovery.
export function reconcilePreferences(base, local, remote) {
  if (!remote) return { value: fields(local), conflicts: {} }
  if (!base) {
    const localFields = fields(local), remoteFields = fields(remote)
    return {
      value: { ...localFields, ...remoteFields },
      conflicts: Object.fromEntries(Object.entries(localFields).filter(([key, value]) => !same(value, remoteFields[key]))),
    }
  }
  const value = {}, conflicts = {}
  for (const key of FIELDS) {
    const localChanged = !same(local[key], base[key])
    const remoteChanged = !same(remote[key], base[key])
    value[key] = localChanged && !remoteChanged ? local[key] : remote[key]
    if (localChanged && remoteChanged && !same(local[key], remote[key])) conflicts[key] = local[key]
  }
  return { value, conflicts }
}

// A fixture-friendly coordinator; the transport alone owns verified identity.
// It never reads/writes the learner model, messages, XP or mastery.
export function createPreferenceSync({ transport, store, readLocal, applyLocal, readOwner, captureAccess = captureLearnerAccess, onStatus = () => {} }) {
  let generation = 0, pending = null, pendingCurrent = () => false
  async function run(id, check) {
    check()
    const user = await transport.user()
    if (!user?.id) throw new Error('signed_out')
    check()
    if (user.id !== id) throw new Error('account_changed')
    const key = 'lc-cloud-preferences:' + encodeURIComponent(id)
    const persist = () => { check(); store.setItem(key, JSON.stringify(journal)); check() }
    const localFields = () => {
      check()
      const value = fields(readLocal())
      check()
      if (!validFields(value)) throw new Error('invalid_local_preferences')
      return value
    }
    let journal
    let raw
    check(); raw = store.getItem(key); check()
    try { journal = raw === null ? null : JSON.parse(raw) } catch { throw new Error('invalid_sync_journal') }
    if (journal !== null && !validJournal(journal, id)) throw new Error('invalid_sync_journal')
    // Backup before any network write or local import. Quota errors fail closed.
    const initial = localFields()
    journal ||= { version: 1, userId: id, base: null, backup: initial, conflicts: {} }
    persist()
    // Recover a staged import before old local values can be misread as new edits.
    if (journal.pendingImport) {
      const { before, value } = journal.pendingImport
      const current = localFields()
      const recovered = { ...value }
      const conflicts = { ...journal.conflicts }
      for (const field of FIELDS) {
        if (!same(current[field], before[field]) && !same(current[field], value[field])) {
          recovered[field] = current[field]
        }
        // A crash after apply followed by a user reverting to `before` is
        // indistinguishable from an unapplied import. Preserve that choice as
        // recovery evidence; never silently discard it while replaying the WAL.
        if (same(current[field], before[field]) && !same(current[field], value[field])) conflicts[field] = current[field]
      }
      if (!same(conflicts, journal.conflicts)) { journal.conflicts = conflicts; persist() }
      check()
      applyLocal(copy(recovered))
      check()
      journal.pendingImport = null
      persist()
    }
    for (let attempt = 0; attempt < 4; attempt++) {
      check()
      const remote = await transport.read(id, check)
      check()
      if (remote && remote.user_id !== id) throw new Error('account_changed')
      if (remote) {
        if (!validFields(fields(remote))) throw new Error('invalid_remote_preferences')
        preferenceRevisionTime(remote.updated_at)
      }
      const local = localFields()
      const merged = reconcilePreferences(journal.base, local, remote)
      if (Object.keys(merged.conflicts).length) {
        journal.conflicts = { ...journal.conflicts, ...merged.conflicts }
        persist()
      }
      let accepted = remote
      if (!remote || !same(fields(remote), merged.value)) {
        check()
        accepted = await transport.compareAndSet(id, remote?.updated_at ?? null, merged.value, check)
        check()
        if (!accepted) continue // concurrent insert/update: refetch before retry
      }
      if (accepted.user_id !== id) throw new Error('account_changed')
      // Validate a successful CAS response before importing it or recording a new base.
      if (!validFields(fields(accepted))) throw new Error('invalid_remote_preferences')
      preferenceRevisionTime(accepted.updated_at)
      // Edits made while the request was in flight win locally and remain dirty.
      const latest = localFields()
      const imported = { ...fields(accepted) }
      for (const key of FIELDS) if (!same(latest[key], local[key])) imported[key] = latest[key]
      check()
      // Stage accepted base and pending import before touching local preferences.
      journal.base = fields(accepted)
      journal.pendingImport = { before: latest, value: imported }
      persist()
      check()
      applyLocal(copy(imported))
      check()
      journal.pendingImport = null
      persist()
      if (same(localFields(), journal.base)) return { status: 'synced', conflicts: copy(journal.conflicts) }
    }
    throw new Error('sync_busy')
  }
  return {
    sync() {
      if (pending && pendingCurrent()) return pending
      if (pending) { generation++; pending = null }
      const ticket = generation
      // Capture both identity and the existing local lease before the first await.
      const id = readOwner(), access = captureAccess()
      const current = () => ticket === generation && readOwner() === id && access.valid()
      const check = () => { if (!current()) throw new Error('account_changed') }
      pendingCurrent = current
      onStatus('syncing')
      pending = run(id, check).then(result => {
        check()
        onStatus(result.status)
        return result
      }).catch(error => {
        if (current()) onStatus('pending')
        throw error
      }).finally(() => { if (ticket === generation) pending = null })
      return pending
    },
    cancel() { generation++; pending = null; onStatus('local') },
  }
}
