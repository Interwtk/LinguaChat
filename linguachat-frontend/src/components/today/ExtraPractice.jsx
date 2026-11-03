import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { captureLearnerAccess } from '../../auth/localLease.js'
import { buildExtraPracticePlan } from '../../learning/courses/courseSession.js'
import { premiumStatus, authorizeExtraBlock, PREMIUM_PASS_KEY } from '../../services/api.js'

/*
 * Premium extra practice, offered after today's session is done.
 *
 * Shown only when the SERVER says Premium exists (it does not, until payments
 * are authorized: then nothing renders at all — no teaser, no lock, no
 * countdown). Every block needs the server's yes; a refusal, an error or no
 * connection never opens one. Nothing here is a stored premium flag: the
 * only thing kept is the server's signed pass, which the browser cannot edit.
 */
export function ExtraPractice({ model, todayPlan, onStart }) {
  const { t, activeCourse, profile } = useApp()
  const [status, setStatus] = useState(null)
  const [note, setNote] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    premiumStatus().then(s => { if (alive) setStatus(s) })
    return () => { alive = false }
  }, [])

  if (!status?.available) return null

  async function start() {
    setBusy(true)
    setNote(null)
    const access = captureLearnerAccess()
    const passToken = access.valid() ? access.getItem(PREMIUM_PASS_KEY) : null
    // the server picks the block: coming back to this screen never replays one
    const answer = await authorizeExtraBlock({ passToken, course: activeCourse })
    setBusy(false)
    if (answer.granted !== true) { setNote(`extraPractice_${answer.reason || 'offline'}`); return }
    const plan = buildExtraPracticePlan(model, activeCourse, { blockIndex: answer.block, todayPlan, learnerKey: profile?.name || 'guest' })
    if (!plan) { setNote('extraPractice_nothing'); return }
    onStart(plan)
  }

  return (
    <section aria-labelledby="extra-practice-title" className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h2 id="extra-practice-title" style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--ink)' }}>{t('extraPracticeTitle')}</h2>
      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 10px', lineHeight: 1.5 }}>{t('extraPracticeBody', { n: status.perDay })}</p>
      <button type="button" onClick={start} disabled={busy} className="btn-quiet w-full" style={{ minHeight: 44 }}>{t('extraPracticeStart')}</button>
      {note && <p role="status" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>{t(note)}</p>}
    </section>
  )
}
