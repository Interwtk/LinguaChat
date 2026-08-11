import { useApp } from '../../context/AppContext'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { ChattoMascot } from '../mascot/ChattoMascot'

/*
 * A CALL WITH LINGUA — frames 2g (voice) and 2f / 3c (video).
 *
 * The surface is real; the media is not, and the surface says so. There is no
 * WebRTC here, no speech recognition, no speech synthesis and no provider: what
 * exists is the place the feature will live, so the product's shape is visible
 * instead of hidden, and one honest line inside it explains that the audio and
 * video part is still coming.
 *
 * That is the difference between showing the architecture and pretending: the
 * buttons in the conversation header really open this, and nothing in here claims
 * to be listening. Every control that would need media is disabled and announces
 * itself as upcoming.
 */

function UpcomingNotice({ children }) {
  return (
    <div role="status" className="mini-window flex items-start gap-3"
      style={{ background: 'var(--surface-soft)' }}>
      <ChattoMascot mood="calm" size={34} decorative animated={false} />
      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5 }}>{children}</p>
    </div>
  )
}

/* A control that will work when the media layer exists, and is honest until then. */
function UpcomingControl({ label, icon, wide = false }) {
  const { t } = useApp()
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      /* the state is in the accessible name, so it is announced and not only seen */
      aria-label={`${label} — ${t('upcoming')}`}
      title={t('upcoming')}
      className="flex flex-col items-center justify-center gap-1.5"
      style={{
        width: wide ? 'auto' : 62, minWidth: 62, minHeight: 62, padding: wide ? '12px 18px' : 0,
        borderRadius: wide ? 'var(--radius)' : '50%',
        background: 'var(--surface-sunk)', border: '1px solid var(--border)',
        color: 'var(--muted)', cursor: 'not-allowed', opacity: 0.7,
      }}
    >
      {icon}
      <span style={{ fontSize: 10.5, fontWeight: 600 }}>{label}</span>
    </button>
  )
}

const ICON = {
  mic: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 11v1a7 7 0 0 1-14 0v-1" /><line x1="12" y1="19" x2="12" y2="22" /></svg>,
  speaker: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z" /><path d="M16 9a4 4 0 0 1 0 6" /></svg>,
  camera: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><path d="M15 8.5V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1.5l6 3.5v-14z" /></svg>,
  subtitles: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 14h4M14 14h3" /></svg>,
  speed: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="13" r="7" /><path d="M12 13l3-3M12 4v1" /></svg>,
}

/**
 * @param mode  'voice' (2g) or 'video' (2f / 3c)
 * @param onClose  back to the conversation
 */
export function CallSurface({ mode = 'voice', onClose }) {
  const { t, profile, nativeLanguageInfo } = useApp()
  const isVideo = mode === 'video'
  const name = (profile?.name || '').trim()

  return (
    <div className="flex-1 flex flex-col overflow-hidden"
      style={{ background: 'var(--ink)', color: '#F1EEE8' }}>

      {/* Header: what this is, and the way out, always drawn. */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
        <p className="eyebrow" style={{ color: 'rgba(241,238,232,0.62)' }}>
          {isVideo ? t('videoCall') : t('voiceCall')}
        </p>
        <button type="button" onClick={onClose} className="tool-chip"
          style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)', color: '#F1EEE8' }}>
          {t('backToChat')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* WHO IS ON THE CALL. In video this is where Lingua's picture goes, and
              the frame calls it a hole to fill with real material — so it says so
              rather than showing a fake video feed. */}
          <div className="rounded-2xl grid place-items-center mb-4"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px dashed rgba(255,255,255,0.16)',
              minHeight: isVideo ? 260 : 190,
              position: 'relative',
            }}>
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <LinguaAvatar size={isVideo ? 74 : 88} online />
              <div>
                <p className="font-display" style={{ fontWeight: 700, fontSize: '1.125rem' }}>{t('linguaReady')}</p>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(241,238,232,0.62)', marginTop: 2 }}>
                  {isVideo ? t('videoPlaceholder') : t('callNotStarted')}
                </p>
              </div>
            </div>

            {/* the learner's own camera, in the corner, equally unimplemented */}
            {isVideo && (
              <div className="rounded-xl grid place-items-center"
                style={{
                  position: 'absolute', bottom: 12, insetInlineEnd: 12,
                  width: 78, height: 104,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px dashed rgba(255,255,255,0.16)',
                }}>
                <span style={{ fontSize: 10.5, color: 'rgba(241,238,232,0.62)', textAlign: 'center', padding: 4 }}>
                  {name ? t('yourCamera') : t('yourCamera')}
                </span>
              </div>
            )}
          </div>

          {/* SUBTITLES / TRANSCRIPT — the design's own idea: English with the
              learner's language underneath so nobody is left behind. Empty until
              there is a call to transcribe. */}
          {isVideo && (
            <div className="rounded-2xl p-4 mb-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <p className="eyebrow" style={{ color: 'rgba(241,238,232,0.62)', marginBottom: 8 }}>
                {t('liveSubtitles')}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(241,238,232,0.72)', lineHeight: 1.5 }}>
                {t('subtitlesWhenAvailable')}
              </p>
            </div>
          )}

          {/* CONTROLS. Everything that needs media is disabled and says why. */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            <UpcomingControl label={t('mic')} icon={ICON.mic} />
            <UpcomingControl label={t('speaker')} icon={ICON.speaker} />
            {isVideo && <UpcomingControl label={t('camera')} icon={ICON.camera} />}
            {isVideo && <UpcomingControl label={t('subtitles')} icon={ICON.subtitles} />}
            {isVideo && <UpcomingControl label={t('speed')} icon={ICON.speed} />}
          </div>

          <div className="mb-4">
            <UpcomingNotice>
              {isVideo ? t('videoUpcomingBody') : t('callUpcomingBody')}
            </UpcomingNotice>
          </div>

          {/* The reassurance the frames carry: a call is practice, not an exam. */}
          <p lang={nativeLanguageInfo.base}
            style={{ fontSize: '0.8125rem', color: 'rgba(241,238,232,0.55)', textAlign: 'center', lineHeight: 1.5 }}>
            {t('callNotRecorded')}
          </p>

          {/* And the honest way to practise right now. */}
          <button type="button" onClick={onClose} className="btn-primary w-full mt-4">
            {t('backToChat')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CallSurface
