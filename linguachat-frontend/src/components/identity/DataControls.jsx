import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { captureLearnerAccess } from '../../auth/localLease.js'
import { exportLearnerData, deleteLearnerData, privacyContact, deletionRequestMailto, downloadJson } from '../../services/learnerData.js'

/*
 * "Your data": download it, delete it from this device, and ask for the
 * account itself to be deleted. Free for everyone, never behind a plan.
 * Every action captures THIS account's access first, so a slow confirmation
 * cannot act on another account that signed in meanwhile.
 */
export function DataControls() {
  const { t, authUser, logout } = useApp()
  const [status, setStatus] = useState(null)
  const contact = privacyContact()

  function download() {
    const access = captureLearnerAccess()
    const payload = exportLearnerData(access, { accountId: authUser?.id || null })
    if (!payload) { setStatus('dataExportFailed'); return }
    downloadJson(document, `linguachat-data-${new Date().toISOString().slice(0, 10)}.json`, payload)
    setStatus('dataExportDone')
  }

  async function removeLocal() {
    const access = captureLearnerAccess()
    if (!access.valid() || !window.confirm(t('dataDeleteConfirm'))) return
    const result = deleteLearnerData(access)
    if (!result.ok) { setStatus('dataDeleteFailed'); return }
    setStatus('dataDeleteDone')
    try { if (authUser) await logout() } finally { window.location.reload() }
  }

  return (
    <section aria-labelledby="data-controls-title" className="rounded-2xl p-4 mb-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h2 id="data-controls-title" style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--ink)', marginBottom: 4 }}>{t('dataTitle')}</h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12 }}>{t('dataBody')}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={download} className="btn-quiet" style={{ minHeight: 40, padding: '9px 14px' }}>{t('dataExport')}</button>
        <button type="button" onClick={removeLocal} className="btn-quiet" style={{ minHeight: 40, padding: '9px 14px', color: 'var(--accent-strong)' }}>{t('dataDeleteLocal')}</button>
      </div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5, marginTop: 12 }}>
        {contact ? t('dataAccountDeletion') : t('dataAccountDeletionNoContact')}
        {contact && authUser && <> <a href={deletionRequestMailto(contact, { accountId: authUser.id })} style={{ color: 'var(--accent)', fontWeight: 700 }}>{t('dataAccountDeletionLink')}</a></>}
      </p>
      {status && <p role="status" style={{ fontSize: '0.8125rem', fontWeight: 700, marginTop: 8, color: status.endsWith('Failed') ? 'var(--accent-strong)' : 'var(--positive-deep)' }}>{t(status)}</p>}
    </section>
  )
}
