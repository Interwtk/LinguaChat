// Swappable source boundary: future fixed assets can implement the same controller.
let active = null

/* The voice for a target language: a local one first, then the common regions. */
const PREFERRED = { en: [/^en[-_]US$/i, /^en[-_]GB$/i], es: [/^es[-_]ES$/i, /^es[-_](MX|US|419)$/i, /^es[-_]/i] }
const DEFAULT_TAG = { en: 'en-US', es: 'es-ES' }
export function pickVoice(voices, lang = 'en') {
  const base = String(lang || 'en').split('-')[0].toLowerCase()
  const own = (voices || []).filter(v => new RegExp(`^${base}(?:[-_]|$)`, 'i').test(v.lang || ''))
  if (base === 'en') {
    return own.find(v => v.localService && /^en[-_]US$/i.test(v.lang))
      || own.find(v => v.localService) || own.find(v => /^en[-_](US|GB)$/i.test(v.lang)) || own[0] || null
  }
  for (const pattern of PREFERRED[base] || []) {
    const match = own.find(v => v.localService && pattern.test(v.lang)) || own.find(v => pattern.test(v.lang))
    if (match) return match
  }
  return own[0] || null
}
export function createSpeechController(host = globalThis.window) {
  const synth = host?.speechSynthesis
  const Utterance = host?.SpeechSynthesisUtterance
  let utterance = null, notify = () => {}, serial = 0
  const supported = Boolean(synth && Utterance)
  const controller = {
    supported,
    stop() {
      serial++
      if (active === controller) {
        try { synth?.cancel(); active = null }
        catch { utterance = null; notify('error'); return false }
      }
      utterance = null; notify('stopped')
      return true
    },
    play(text, { slow = false, lang = 'en', onState = () => {}, onFinished = () => {} } = {}) {
      if (!supported || !String(text).trim()) return false
      if (active?.stop() === false) { onState('error'); return false }
      controller.stop(); active = controller; notify = onState
      const token = ++serial
      const finish = (state, completed = false) => {
        if (serial !== token) return
        serial++ // Browser error/end/late-start events are terminal exactly once.
        if (active === controller) active = null
        utterance = null
        notify(state)
        if (completed) onFinished()
      }
      try {
      utterance = new Utterance(String(text).slice(0, 1500))
      const voices = synth.getVoices?.() || []
      const voice = pickVoice(voices, lang)
      /*
       * Never read Spanish with an English voice: a device that lists voices but
       * none in the language says so (the transcript opens) instead of teaching
       * a wrong pronunciation. An empty list means voices have not loaded yet;
       * then the language tag alone is the best request we can make.
       */
      if (!voice && voices.length && lang !== 'en') { finish('error'); return false }
      utterance.voice = voice
      utterance.lang = voice?.lang || DEFAULT_TAG[lang] || 'en-US'
      utterance.rate = slow ? 0.75 : 1
      utterance.onstart = () => { if (serial === token) notify('playing') }
      utterance.onend = () => finish('stopped', true)
      utterance.onerror = () => finish('error')
      notify('playing'); synth.speak(utterance); return true
      } catch { finish('error'); return false }
    },
  }
  return controller
}
export function listeningEvidence(signals = {}) {
  const independent = signals.completed === 1 && signals.plays === 1 && !signals.slow && !signals.transcript
  return { independent, firstListenSuccessEligible: independent, replayCount: Math.max(0, (signals.plays || 0)-1),
    slowReplay: Boolean(signals.slow), transcriptRevealed: Boolean(signals.transcript) }
}
