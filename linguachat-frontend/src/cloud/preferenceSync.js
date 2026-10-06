import { toCloudPreferenceFields, fromCloudPreferenceFields } from '../services/cloudPreferenceMapping.js'

const FIELDS = Object.keys(toCloudPreferenceFields())
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const copy = value => JSON.parse(JSON.stringify(value))
const fields = row => Object.fromEntries(FIELDS.filter(key => Object.hasOwn(row || {}, key)).map(key => [key, row[key]]))

const object = value => value && typeof value === 'object' && !Array.isArray(value)
const validFields = (value, partial = false) => {
  if (!object(value) || Object.keys(value).some(key => !FIELDS.includes(key))) return false
  if (!partial && FIELDS.some(key => !Object.hasOwn(value, key))) return false
  const normalized = toCloudPreferenceFields(fromCloudPreferenceFields(value), value)
  return Object.keys(value).every(key => same(value[key], normalized[key]))
}
const validJournal = (journal, id) => object(journal) && journal.version === 1 && journal.userId === id
  && (journal.base === null || validFields(journal.base))
  && validFields(journal.backup) && validFields(journal.conflicts, true)

// Three-way merge. Disjoint edits survive. For simultaneous edits of one field,
// the already committed remote value wins, irrespective of the device clock.
// The losing local choice remains in the account journal for explicit recovery.
export function reconcilePreferences(base, local, remote) {
  if (!remote) return { value: fields(local), conflicts: {} }
  if (!base) return { value: { ...fields(local), ...fields(remote) }, conflicts: fields(local) }
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
export function createPreferenceSync({ transport, store, readLocal, applyLocal, readOwner, onStatus = () => {} }) {
  let generation = 0, pending = null
  const check = (id, ticket) => {
    if (ticket !== generation || readOwner() !== id) throw new Error('account_changed')
  }
  async function run(ticket) {
    const user = await transport.user()
    if (!user?.id) throw new Error('signed_out')
    const id = user.id
    check(id, ticket)
    const key = 'lc-cloud-preferences:' + encodeURIComponent(id)
    let journal
    try { journal = JSON.parse(store.getItem(key) || 'null') } catch { throw new Error('invalid_sync_journal') }
    if (journal !== null && !validJournal(journal, id)) throw new Error('invalid_sync_journal')
    // Backup before any network write or local import. Quota errors fail closed.
    const initial = fields(readLocal())
    journal ||= { version: 1, userId: id, base: null, backup: initial, conflicts: {} }
    store.setItem(key, JSON.stringify(journal))
    for (let attempt = 0; attempt < 4; attempt++) {
      check(id, ticket)
      const remote = await transport.read(id)
      check(id, ticket)
      if (remote && remote.user_id !== id) throw new Error('account_changed')
      if (remote) {
        const normalized = toCloudPreferenceFields(fromCloudPreferenceFields(remote), remote)
        if (!same(fields(remote), normalized)) throw new Error('invalid_remote_preferences')
      }
      const local = fields(readLocal())
      const merged = reconcilePreferences(journal.base, local, remote)
      if (Object.keys(merged.conflicts).length) {
        journal.conflicts = { ...journal.conflicts, ...merged.conflicts }
        store.setItem(key, JSON.stringify(journal))
      }
      let accepted = remote
      if (!remote || !same(fields(remote), merged.value)) {
        accepted = await transport.compareAndSet(id, remote?.updated_at ?? null, merged.value)
        check(id, ticket)
        if (!accepted) continue // concurrent insert/update: refetch before retry
      }
      if (accepted.user_id !== id) throw new Error('account_changed')
      // Edits made while the request was in flight win locally and remain dirty.
      const latest = fields(readLocal())
      const imported = { ...fields(accepted) }
      for (const key of FIELDS) if (!same(latest[key], local[key])) imported[key] = latest[key]
      check(id, ticket)
      applyLocal(copy(imported))
      journal.base = fields(accepted)
      store.setItem(key, JSON.stringify(journal))
      if (same(imported, journal.base)) return { status: 'synced', conflicts: copy(journal.conflicts) }
    }
    throw new Error('sync_busy')
  }
  return {
    sync() {
      if (pending) return pending
      const ticket = generation
      onStatus('syncing')
      pending = run(ticket).then(result => {
        if (ticket === generation) onStatus(result.status)
        return result
      }).catch(error => {
        if (ticket === generation) onStatus('pending')
        throw error
      }).finally(() => { pending = null })
      return pending
    },
    cancel() { generation++; onStatus('local') },
  }
}
