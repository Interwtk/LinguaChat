import { captureLearnerAccess } from '../auth/localLease.js'
import { normalizeTutorPreferences, TUTOR_PREFERENCES_KEY } from '../services/tutorPreferences.js'
import { languagePreferencePersistence, isSupportedLanguage } from '../services/language.js'
import { toCloudPreferenceFields, fromCloudPreferenceFields, validCloudPreferenceFields } from '../services/cloudPreferenceMapping.js'

export const LOCAL_IMPORT_KEY = 'lc2-cloud-preference-import'
export const LOCAL_IMPORT_CONFLICTS_KEY = 'lc2-cloud-preference-import-conflicts'
const OPTIONS_KEY = 'lc2-cloud-preference-options'
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const exactKeys = (value, keys) => object(value) && Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k))

// Synchronous local WAL, independent of React and of the remote coordinator.
// Captured physical keys fence the entire transaction, including cleanup.
export function createPreferenceImport({ userId, access = captureLearnerAccess() }) {
  const check = () => {
    if (typeof userId !== 'string' || !userId || !access.valid()) throw new Error('Stale preference import')
    const owner = access.getItem('lc2-auth-owner-id')
    if (!access.valid() || owner !== encodeURIComponent(userId)) throw new Error('Preference import owner changed')
  }
  const get = key => { check(); const value = access.getItem(key); check(); return value }
  const set = (key, value) => {
    check()
    if (access.setItem(key, value) === false) throw new Error('Stale preference import')
    if (get(key) !== value) throw new Error('Preference import not durable')
  }
  const parse = (raw, error) => {
    try { return JSON.parse(raw) } catch { throw new Error(error) }
  }
  const readObject = key => {
    const raw = get(key), value = raw === null ? {} : parse(raw, 'Invalid local preferences')
    if (!object(value)) throw new Error('Invalid local preferences')
    return value
  }
  const readConflicts = () => {
    const raw = get(LOCAL_IMPORT_CONFLICTS_KEY)
    if (raw === null) return {}
    const record = parse(raw, 'Invalid local import conflicts')
    if (!exactKeys(record, ['version', 'userId', 'values']) || record.version !== 1 || record.userId !== userId
      || !validCloudPreferenceFields(record.values, true)) throw new Error('Invalid local import conflicts')
    return record.values
  }
  const snapshot = () => {
    const tutorPreferences = normalizeTutorPreferences(readObject(TUTOR_PREFERENCES_KEY))
    const options = readObject(OPTIONS_KEY)
    const language = languagePreferencePersistence(get('lc2-native-language-code') || get('lc2-native-language') || 'en')
    if (!isSupportedLanguage(language.preferences.nativeLanguage.base)) throw new Error('Invalid local preference language')
    return { tutorPreferences, options, languagePreferences: language.preferences,
      fields: toCloudPreferenceFields(tutorPreferences, { ...options, user_language: language.preferences.nativeLanguage.base }) }
  }
  const writesFor = (fields, current) => {
    const tutorPreferences = normalizeTutorPreferences(fromCloudPreferenceFields(fields, current.tutorPreferences))
    const options = { ...current.options, english_variant: fields.english_variant, conversation_register: fields.conversation_register }
    // Preserve a regional code if the user selected it and its base is unchanged.
    const language = languagePreferencePersistence(current.languagePreferences.nativeLanguage.base === fields.user_language
      ? current.languagePreferences.nativeLanguage : fields.user_language)
    return { tutorPreferences, languagePreferences: language.preferences, fields,
      entries: [[OPTIONS_KEY, JSON.stringify(options)], [TUTOR_PREFERENCES_KEY, JSON.stringify(tutorPreferences)], ...language.entries] }
  }
  const readJournal = () => {
    const raw = get(LOCAL_IMPORT_KEY)
    if (raw === null) return null
    const journal = parse(raw, 'Invalid local import journal')
    if (!exactKeys(journal, ['version', 'userId', 'phase', 'before', 'value', 'conflicts'])
      || journal.version !== 1 || journal.userId !== userId || !['prepared', 'applied'].includes(journal.phase)
      || !validCloudPreferenceFields(journal.before) || !validCloudPreferenceFields(journal.value)
      || !validCloudPreferenceFields(journal.conflicts, true)) throw new Error('Invalid local import journal')
    return journal
  }
  const persistJournal = journal => set(LOCAL_IMPORT_KEY, JSON.stringify(journal))
  const finish = journal => {
    const start = snapshot()
    const desired = writesFor(journal.value, start)
    // Storage has no cross-tab CAS. Detect intervening changes to any physical
    // preference key before continuing a multi-key import; leave the WAL for
    // recovery rather than silently overwriting a second tab's edit.
    const expected = new Map(desired.entries.map(([key]) => [key, get(key)]))
    const confirmed = snapshot()
    if (!same(start.fields, confirmed.fields)
      || !same(desired.entries, writesFor(journal.value, confirmed).entries)) {
      throw new Error('Concurrent local preference edit')
    }
    for (const [key, value] of desired.entries) {
      for (const [observedKey, observedValue] of expected) {
        if (get(observedKey) !== observedValue) throw new Error('Concurrent local preference edit')
      }
      if (expected.get(key) !== value) {
        set(key, value)
        expected.set(key, value)
      }
    }
    // Confirm the whole set, not just the final write, before acknowledging apply.
    for (const [key, value] of desired.entries) if (get(key) !== value) throw new Error('Incomplete preference import')
    if (Object.keys(journal.conflicts).length) {
      const values = { ...readConflicts(), ...journal.conflicts }
      set(LOCAL_IMPORT_CONFLICTS_KEY, JSON.stringify({ version: 1, userId, values }))
    }
    persistJournal({ ...journal, phase: 'applied' })
    check()
    if (access.removeItem(LOCAL_IMPORT_KEY) === false) throw new Error('Stale preference import')
    if (get(LOCAL_IMPORT_KEY) !== null) throw new Error('Preference import cleanup failed')
    // A result is publishable only after durable confirmation and cleanup.
    return snapshot()
  }
  const recover = () => {
    const journal = readJournal()
    if (!journal) return null
    readConflicts() // existing recovery evidence must be valid before any replay
    const current = snapshot().fields
    for (const field of Object.keys(journal.value)) {
      if (journal.phase === 'applied' || (!same(current[field], journal.before[field]) && !same(current[field], journal.value[field]))) {
        journal.value[field] = current[field]
      } else if (same(current[field], journal.before[field]) && !same(current[field], journal.value[field])) {
        // Prepared alone cannot distinguish unapplied state from an exact revert.
        journal.conflicts[field] = current[field]
      }
    }
    journal.phase = 'prepared'
    persistJournal(journal) // preserved user edits must survive another crash, too
    return finish(journal)
  }
  return {
    recover,
    read() { recover(); return snapshot() },
    apply(value) {
      if (!validCloudPreferenceFields(value)) throw new Error('Invalid cloud preference import')
      // Finish an outstanding import before accepting another intent. The
      // coordinator's subsequent local read sees any preserved dirty edits.
      const recovered = recover()
      if (recovered) return recovered
      const current = snapshot(), desired = writesFor(value, current)
      readConflicts() // fail closed on malformed recovery evidence
      if (desired.entries.every(([key, text]) => get(key) === text)) return current
      const journal = { version: 1, userId, phase: 'prepared', before: current.fields, value, conflicts: {} }
      persistJournal(journal)
      return finish(journal)
    },
  }
}

// Restore an existing own-account WAL before normalizers or React save effects
// can reinterpret partial keys. This performs no authentication/network work.
export function recoverCurrentPreferenceImport() {
  const access = captureLearnerAccess()
  if (!access.valid()) throw new Error('Stale preference import')
  const owner = access.getItem('lc2-auth-owner-id')
  if (!access.valid()) throw new Error('Stale preference import')
  if (!owner) return null
  return createPreferenceImport({ userId: decodeURIComponent(owner), access }).recover()
}
