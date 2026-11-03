/*
 * The learner's own data: download it, or delete it from this device.
 *
 * Everything LinguaChat keeps about a learner on a device lives under `lc2-`
 * keys in that account's namespace (auth/localLease.js). Both operations work
 * through a captured account access, so they can only ever see — and only ever
 * remove — the keys of the account that asked:
 *
 *   exportLearnerData   every key of this account, as one JSON document;
 *   deleteLearnerData   removes every key of this account, then checks that
 *                       none is left. Another account's data on the same
 *                       browser is not listed by this access, so it cannot be
 *                       touched.
 *
 * What this does NOT do (stated in the UI and the privacy policy draft): delete
 * the sign-in account held by the authentication provider. That needs a server
 * operation with private credentials the current contract does not authorize;
 * until it exists, a deletion request goes to the operator's privacy contact.
 */
export const EXPORT_FORMAT = 'linguachat-export/1'

const parse = (raw) => { try { return JSON.parse(raw) } catch { return raw } }

export function exportLearnerData(access, { now = Date.now(), accountId = null } = {}) {
  if (!access?.valid?.()) return null
  const data = {}
  for (const key of [...access.keys()].sort()) {
    const raw = access.getItem(key)
    if (raw !== null && raw !== undefined) data[key] = parse(raw)
  }
  if (!access.valid()) return null
  return {
    format: EXPORT_FORMAT,
    exportedAt: new Date(now).toISOString(),
    account: accountId ? { id: accountId } : null,
    note: 'Learning data stored by LinguaChat in this browser for this account. Your sign-in details are held by the authentication provider and are not included.',
    data,
  }
}

export function deleteLearnerData(access) {
  if (!access?.valid?.()) return { ok: false, removed: 0, remaining: null }
  const keys = [...access.keys()]
  let removed = 0
  for (const key of keys) {
    if (!access.valid()) break
    if (access.removeItem(key) !== false) removed++
  }
  const remaining = access.valid() ? access.keys().length : null
  return { ok: remaining === 0, removed, remaining }
}

/* The operator's privacy contact, configured at deployment; never invented. */
export function privacyContact(env = (typeof import.meta !== 'undefined' && import.meta.env) || {}) {
  const value = String(env.VITE_PRIVACY_CONTACT_EMAIL || '').trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null
}

export function deletionRequestMailto(contact, { accountId = null } = {}) {
  if (!contact) return null
  const subject = encodeURIComponent('LinguaChat account deletion request')
  const body = encodeURIComponent(`Please delete my LinguaChat account and the data associated with it.${accountId ? `\nAccount reference: ${accountId}` : ''}`)
  return `mailto:${contact}?subject=${subject}&body=${body}`
}

export function downloadJson(document, fileName, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = fileName; a.rel = 'noopener'
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
