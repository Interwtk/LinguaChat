import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { createSpeechController } from '../../audio/speech.js'

export function ListeningTurn({ text, turnId = text, onSignals }) {
  // A new turn owns fresh playback evidence and a hidden transcript, even when
  // React reuses the surrounding message/practice component.
  return <ListeningTurnContent key={JSON.stringify([turnId, text])} text={text} onSignals={onSignals} />
}

function ListeningTurnContent({ text, onSignals }) {
  const { t } = useApp()
  const controller = useRef(null)
  if (!controller.current) controller.current = createSpeechController()
  const [state, setState] = useState('stopped')
  const [transcript, setTranscript] = useState(!controller.current.supported)
  const stats = useRef({ plays: 0, completed: 0, slow: false, unavailable: !controller.current.supported, transcript: !controller.current.supported })
  const callback = useRef(onSignals); callback.current = onSignals
  const publish = () => callback.current?.({ ...stats.current })
  useEffect(() => {
    publish()
    return () => controller.current.stop()
  }, [text])
  function play(slow = false) {
    stats.current.plays++; stats.current.slow ||= slow; publish()
    controller.current.play(text, { slow, onState: next => {
      setState(next)
      if (next === 'error') { stats.current.unavailable = true; stats.current.transcript = true; setTranscript(true); publish() }
    }, onFinished: () => { stats.current.completed++; publish() } })
  }
  return <section aria-label={t('listeningAudio')} className="rounded-2xl p-3 my-2" style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)' }}>
    <p className="font-bold text-sm">{t('listeningAudio')}</p>
    <div className="flex flex-wrap gap-2 my-2">
      <button type="button" className="tool-chip" disabled={!controller.current.supported || state === 'playing'} onClick={() => play()}>{t(stats.current.plays ? 'listeningReplay' : 'listeningPlay')}</button>
      <button type="button" className="tool-chip" disabled={!controller.current.supported || state === 'playing'} onClick={() => play(true)}>{t('listeningSlow')}</button>
      {state === 'playing' && <button type="button" className="tool-chip" onClick={() => controller.current.stop()}>{t('listeningStop')}</button>}
      <button type="button" className="tool-chip" aria-expanded={transcript} onClick={() => { stats.current.transcript = true; setTranscript(v => !v); publish() }}>{t(transcript ? 'listeningHide' : 'listeningTranscript')}</button>
    </div>
    <p role="status" aria-live="polite" className="text-xs">{t(!controller.current.supported || state === 'error' ? 'listeningUnavailable' : state === 'playing' ? 'listeningPlaying' : 'listeningStopped')}</p>
    {transcript && <p lang="en" className="mt-2">{text}</p>}
  </section>
}
