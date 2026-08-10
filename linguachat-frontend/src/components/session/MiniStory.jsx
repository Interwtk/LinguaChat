import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { evaluateEpisodeResponse } from '../../learning/engine/hybridEvaluation.js'
import { evaluateFree, shouldEscalate } from '../../learning/engine/responseEvaluation.js'
import { deriveInitialScaffold, isIndependentEvidence } from '../../learning/engine/scaffolding.js'
import { createSubmissionGuard } from '../../learning/engine/submitGuard.js'
import { evaluateLearningResponse } from '../../services/api'
import { dayKeyFor } from '../../learning/engine/session.js'
import {
  loadLearnerModel, saveLearnerModel, recordItemAttempt, markRecurringError, recordActivitySignalOnce,
} from '../../learning/engine/learnerModel.js'
import {
  getStory, storyTurns, turnText, createStoryState, normalizeStoryState, advanceStory,
  isStoryFinished, defaultBranch, STORY_STORAGE_KEY,
} from '../../learning/engine/miniStory.js'

const En = ({ children, style }) => <span lang="en" dir="ltr" style={style}>{children}</span>

const resolve = (str, vars = {}) =>
  String(str || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null || vars[k] === '' ? m : String(vars[k])))

/*
 * A tiny scene told inside the practice area — not a separate screen, not a
 * minigame. Lingua sets it up, the learner makes one decision, the story
 * answers, they say one thing in English, and it closes.
 *
 * The decision is judged locally (it is a choice between two correct English
 * replies, so there is nothing to evaluate); the one free reply goes through
 * the SAME hybrid evaluator as everywhere else. There is no second evaluation
 * path and no generated text: every line below comes from the story data.
 *
 * Where the story is — turn, branch, seed — is persisted, so a reload or a
 * breakpoint change picks it up exactly where it was rather than restarting a
 * story the learner has already half-heard.
 */
/*
 * `scaffoldLevel` and `runMode` let an EPISODE hand the story its own support
 * instead of the story deriving a second one. Omitted — as a daily session
 * omits them — the story derives its own from the objective, exactly as before.
 */
export function MiniStory({ block, vars, onDone, scaffoldLevel = null, runMode = 'review' }) {
  const { t, nativeLanguageInfo, interfaceLanguageInfo } = useApp()
  const nativeLang = nativeLanguageInfo.base
  const story = useMemo(() => getStory(block.objective), [block.objective])
  const seed = `${block.id}:${dayKeyFor()}`

  const modelRef = useRef(loadLearnerModel())
  /*
   * A story keeps its own support, derived from the objective it serves. It is
   * read once: a scene the learner is halfway through must not change shape
   * because something else in the model moved.
   */
  const storyScaffoldRef = useRef(null)
  if (!storyScaffoldRef.current) {
    storyScaffoldRef.current = deriveInitialScaffold({
      learnerModel: modelRef.current,
      targetIntent: block.objective,
      runMode,
      blockType: block.type,
    })
  }
  // the host's level wins when there is one; there is never a second scale
  const storyScaffold = scaffoldLevel || storyScaffoldRef.current.currentLevel
  const [state, setState] = useState(() => {
    try {
      const stored = normalizeStoryState(JSON.parse(localStorage.getItem(STORY_STORAGE_KEY) || 'null'), story)
      if (stored && stored.seed === seed) return stored
    } catch { /* unreadable storage starts a fresh story */ }
    return createStoryState(story, { seed, branch: defaultBranch(seed, story) })
  })
  const [reply, setReply] = useState('')
  const [retry, setRetry] = useState(null)
  const [reviewing, setReviewing] = useState(false)
  const [live, setLive] = useState('')
  const guardRef = useRef(createSubmissionGuard())
  const abortRef = useRef(null)
  const inputRef = useRef(null)
  const doneRef = useRef(false)

  const turns = storyTurns(story)
  const turn = turns[state.currentTurn]

  /*
   * NO STORY FOR THIS OBJECTIVE. `getStory` returns null rather than substituting
   * somebody else's scene, so a block that should never have been planned as a story
   * is skipped instead of rendering a conversation about the wrong thing. The host
   * decides what happens next, exactly as it does when a story finishes.
   */
  useEffect(() => {
    if (story) return
    if (import.meta.env?.DEV) console.error('[MiniStory] no story for objective', block.objective)
    if (doneRef.current) return
    doneRef.current = true
    onDone?.(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story])

  // Persist where the story is, so a reload resumes instead of restarting.
  useEffect(() => {
    try { localStorage.setItem(STORY_STORAGE_KEY, JSON.stringify(state)) } catch { /* noop */ }
  }, [state])

  // One "shown" per story block per day, whatever the UI does in between.
  useEffect(() => {
    if (recordActivitySignalOnce(modelRef.current, `${dayKeyFor()}:story:${block.id}:shown`, 'mini_story', 'shown')) {
      saveLearnerModel(modelRef.current)
    }
  }, [block.id])

  useEffect(() => () => {
    guardRef.current.invalidate()
    try { abortRef.current?.abort() } catch { /* noop */ }
  }, [])

  function mark(kind, suffix = kind) {
    if (recordActivitySignalOnce(modelRef.current, `${dayKeyFor()}:story:${block.id}:${suffix}`, 'mini_story', kind)) {
      saveLearnerModel(modelRef.current)
    }
  }

  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    mark('completed')
    try { localStorage.removeItem(STORY_STORAGE_KEY) } catch { /* noop */ }
    /*
     * The host is told which way the story went. A session block has nothing to
     * do with it and ignores the argument; an episode needs it, because the
     * "try the other way" offer is meaningless if the run does not know which
     * ending the learner actually played.
     */
    onDone(state.branchId || null)
  }

  function next() {
    if (isStoryFinished(state, story)) { finish(); return }
    setState(s => advanceStory(s, story))
    setRetry(null)
    setLive('')
  }

  function choose(option) {
    // Both options are correct English; the branch only changes what happens.
    setState(s => ({ ...advanceStory(s, story), branchId: option.branch }))
    setLive(resolve(option.textEn, vars))
  }

  async function submit({ fromSuggestion = false } = {}) {
    const text = reply
    if (!text.trim()) return
    const token = guardRef.current.begin()
    if (token === null) return
    const turnContext = { linguaSaid: resolve(turnText(turns[state.currentTurn - 1], state.branchId, story), vars) }
    const independent = isIndependentEvidence({ step: { type: 'free_reply', format: 'mini_story' }, assistanceUsed: fromSuggestion, correct: true })
    const evalCtx = { name: vars.name, independent, turnContext, place: vars.place, targetNoun: vars.noun, targetThing: vars.item, activity: vars.activity }
    const preview = evaluateFree(turn.evalKind, text, evalCtx)
    const controller = new AbortController()
    abortRef.current = controller
    if (shouldEscalate(preview)) { setReviewing(true); setLive(t('epEvaluating')) }

    let result
    try {
      result = await evaluateEpisodeResponse({
        episode: null, step: { evalKind: turn.evalKind, itemIds: turn.itemIds || [] },
        learnerResponse: text, learnerName: vars.name, place: vars.place,
        targetNoun: vars.noun, targetThing: vars.item, activity: vars.activity,
        nativeLanguage: nativeLang, interfaceLanguage: interfaceLanguageInfo?.base || nativeLang,
        targetLanguage: 'en', scaffoldLevel: storyScaffold, assistanceUsed: fromSuggestion,
        previousAttempts: 0, turnContext, signal: controller.signal,
        remote: (payload, abortSignal) => evaluateLearningResponse(payload, { signal: abortSignal }),
      })
    } catch {
      result = { ...preview, source: 'fallback' }
    }
    if (!guardRef.current.isCurrent(token)) return
    guardRef.current.settle()
    abortRef.current = null
    setReviewing(false)

    /*
     * A story's free reply is open production, so it can reach `can_use` — but
     * only when the learner wrote it themselves. The closed branch decision is
     * evidence of a strategy, not of production, and is deliberately not
     * recorded here.
     */
    ;(turn.itemIds || []).forEach(id => recordItemAttempt(modelRef.current, id, {
      correct: result.completedObjective,
      independent: result.completedObjective && independent,
      evidenceKind: 'open',
    }))
    if (!result.completedObjective) markRecurringError(modelRef.current, result.errorType)
    saveLearnerModel(modelRef.current)

    if (result.completedObjective) {
      setReply('')
      setRetry(null)
      setLive(t('ep1Correct'))
      setTimeout(next, 600)
    } else {
      mark('retried')
      setRetry({ explainKey: result.explanation, natural: resolve(result.naturalVersion, vars), promptKey: result.retryPrompt })
      setLive(t('ep1RetryTitle'))
      setTimeout(() => { try { inputRef.current?.focus() } catch { /* noop */ } }, 40)
    }
  }

  const suggestion = turn?.suggestionEn ? resolve(turn.suggestionEn, vars) : null

  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-2 mb-3">
        <ChattoMascot mood="welcoming" size={38} intensity="enter" decorative />
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--violet)' }}>{t('storyBadge')}</p>
          <p lang={nativeLang} style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ink)' }}>{t('storyTitle')}</p>
        </div>
      </div>

      <p aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{live}</p>

      {/* everything said so far, so the scene reads as one conversation */}
      <div className="flex flex-col gap-2 mb-3">
        {turns.slice(0, state.currentTurn + 1).map((tn, i) => {
          if (tn.kind === 'choose' || tn.kind === 'reply') return null
          const text = resolve(turnText(tn, state.branchId, story), vars)
          if (!text) return null
          return (
            <div key={i} className="flex gap-3">
              <LinguaAvatar size={30} online className="mt-0.5" />
              <div style={{ maxWidth: '88%' }}>
                <div className="bubble-lingua"><En style={{ fontWeight: 700 }}>{text}</En></div>
                {tn.noteKey && <p lang={nativeLang} style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 4 }}>{t(tn.noteKey)}</p>}
              </div>
            </div>
          )
        })}
      </div>

      {/* the single decision — a real radio group, both options valid English */}
      {turn?.kind === 'choose' && (
        <div role="radiogroup" aria-label={t(turn.promptKey)} className="flex flex-col gap-2">
          <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginBottom: 2 }}>{t(turn.promptKey)}</p>
          {turn.options.map((opt, i) => {
            const chosen = state.branchId === opt.branch && state.currentTurn > turns.indexOf(turn)
            return (
              <button key={i} type="button" role="radio" aria-checked={chosen} onClick={() => choose(opt)}
                className="rounded-2xl px-4 py-3 text-start transition-all active:scale-[0.99] flex items-center gap-2"
                style={{ background: 'var(--bg-paper)', border: '1.5px solid var(--border)', minHeight: 48 }}>
                <span aria-hidden="true" style={{ fontSize: 13, width: 14, color: 'var(--violet)' }}>{chosen ? '●' : '○'}</span>
                <En style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--ink)' }}>{resolve(opt.textEn, vars)}</En>
              </button>
            )
          })}
        </div>
      )}

      {/* the one turn the learner produces themselves */}
      {turn?.kind === 'reply' && (
        <div>
          <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginBottom: 8 }}>{t(turn.instructionKey)}</p>

          {retry && (
            <div role="status" className="rounded-2xl p-4 mb-3 animate-scale-in" style={{ background: 'var(--coral-soft)', border: '1px solid var(--coral)' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--ink)', marginBottom: 4 }}>{t('ep1RetryTitle')}</p>
              {retry.explainKey && <p lang={nativeLang} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5, marginBottom: 6 }}>{t(retry.explainKey)}</p>}
              {retry.natural && <En style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)' }}>{retry.natural}</En>}
            </div>
          )}

          {suggestion && !reviewing && (
            <button type="button" onClick={() => { setReply(suggestion); mark('assistance') }}
              className="rounded-full px-3.5 py-1.5 text-xs font-bold mb-3 transition-all active:scale-[0.98]"
              style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', color: 'var(--ink)' }}>
              {t('ep1UseSuggestion')}: <En>{suggestion}</En>
            </button>
          )}

          {reviewing && (
            <div role="status" aria-live="polite" className="flex items-center gap-2 mb-3 animate-fade-up">
              <LinguaAvatar size={26} online />
              <span lang={nativeLang} style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--violet)' }}>{t('epEvaluating')}</span>
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl p-2.5" aria-busy={reviewing}
            style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', opacity: reviewing ? 0.7 : 1 }}>
            <input ref={inputRef} value={reply} onChange={e => setReply(e.target.value)} disabled={reviewing} lang="en" dir="ltr"
              onKeyDown={e => { if (e.key === 'Enter' && reply.trim() && !reviewing) submit({ fromSuggestion: reply === suggestion }) }}
              placeholder={t('ep1TypeReply')} aria-label={t(turn.instructionKey)} className="chat-input flex-1 bg-transparent text-sm"
              style={{ color: 'var(--ink)', border: 'none', outline: 'none', padding: '7px 4px' }} />
            <button onClick={() => submit({ fromSuggestion: reply === suggestion })} disabled={!reply.trim() || reviewing}
              className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all active:scale-[0.98]"
              style={{ background: reply.trim() && !reviewing ? 'var(--blue)' : 'var(--border)' }}>{t('ep1Send')}</button>
          </div>
        </div>
      )}

      {/* scene / line / close simply move on */}
      {turn && turn.kind !== 'choose' && turn.kind !== 'reply' && (
        <button onClick={next} className="w-full py-2.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]"
          style={{ background: 'var(--violet)' }}>
          {isStoryFinished(state, story) ? t('storyFinish') : t('ep1Continue')}
        </button>
      )}
    </div>
  )
}

export default MiniStory
