// Swappable source boundary: future fixed assets can implement the same controller.
let active = null
export function createSpeechController(host = globalThis.window) {
  const synth = host?.speechSynthesis
  const Utterance = host?.SpeechSynthesisUtterance
  let utterance = null, notify = () => {}, serial = 0
  const supported = Boolean(synth && Utterance)
  const controller = {
    supported,
    stop() {
      serial++
      if (active === controller) { synth?.cancel(); active = null }
      utterance = null; notify('stopped')
    },
    play(text, { slow = false, onState = () => {}, onFinished = () => {} } = {}) {
      if (!supported || !String(text).trim()) return false
      active?.stop(); controller.stop(); active = controller; notify = onState
      const token = ++serial
      utterance = new Utterance(String(text).slice(0, 1500))
      const voices = synth.getVoices?.() || []
      const english = voices.filter(v => /^en(?:-|_)/i.test(v.lang))
      utterance.voice = english.find(v => v.localService && /^en[-_]US$/i.test(v.lang))
        || english.find(v => v.localService) || english.find(v => /^en[-_](US|GB)$/i.test(v.lang)) || english[0] || null
      utterance.lang = utterance.voice?.lang || 'en-US'
      utterance.rate = slow ? 0.75 : 1
      utterance.onstart = () => { if (serial === token) notify('playing') }
      utterance.onend = () => { if (serial !== token) return; active = null; notify('stopped'); onFinished() }
      utterance.onerror = () => { if (serial === token) { active = null; notify('error') } }
      try { notify('playing'); synth.speak(utterance); return true } catch { active = null; notify('error'); return false }
    },
  }
  return controller
}
export function listeningEvidence(signals = {}) {
  const independent = signals.completed === 1 && signals.plays === 1 && !signals.slow && !signals.transcript
  return { independent, firstListenSuccessEligible: independent, replayCount: Math.max(0, (signals.plays || 0)-1),
    slowReplay: Boolean(signals.slow), transcriptRevealed: Boolean(signals.transcript) }
}
