import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { ListeningTurn } from '../chat/ListeningTurn.jsx'
import { EpisodeShell } from '../episode/EpisodeShell'
import { getCourse } from '../../learning/courses/registry.js'
import { resolveBlockSteps, saveCourseSession, advanceCourseSession, COURSE_MISSIONS } from '../../learning/courses/courseSession.js'
import {
  loadLearnerModel, saveLearnerModel, recordItemAttempt, recordCanDoAttempt, markRecurringError, recordActivitySignalOnce,
} from '../../learning/engine/learnerModel.js'
import { copiesShownModel } from '../../learning/engine/scaffolding.js'
import { dayKeyFor } from '../../learning/engine/session.js'
import { partnerFor } from '../../learning/engine/variation.js'

const fill = (text, vars) => String(text || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] ? String(vars[k]) : m))

/*
 * One open turn taken from a course episode, played outside the episode: a due
 * review, a targeted retry, a transfer to a new situation or a mission turn.
 *
 * The same evidence rules as the episode player: nothing is shown first (this
 * is retrieval), asking to see the model makes the answer assisted, typing the
 * model back is a copy, and a reply the evaluator cannot read files nothing.
 */
export function CoursePracticeTurn({ episode, stepIndex, blockType, onDone }) {
  const { t: appT, profile } = useApp()
  const runtime = episode.runtime
  const step = episode.steps[stepIndex]
  const t = (key, vars) => runtime.copy[key] ?? appT(key, vars)
  const vars = { name: (profile?.name || '').trim() || 'Alex', partner: partnerFor(profile?.name || 'guest') }
  /*
   * A recall step has no model of its own (it is asked from memory); its example
   * is the model of the same kind of turn in the same lesson, with the same context.
   */
  const model = useMemo(() => {
    if (step.suggestionEn) return fill(step.suggestionEn, vars)
    const same = JSON.stringify(step.courseContext || {})
    const sibling = episode.steps.find(s => s.suggestionEn && s.evalKind === step.evalKind && JSON.stringify(s.courseContext || {}) === same)
      || episode.steps.find(s => s.suggestionEn && s.evalKind === step.evalKind)
    return sibling ? fill(sibling.suggestionEn, vars) : ''
  }, [step])
  const [reply, setReply] = useState('')
  const [shown, setShown] = useState(false)
  const [result, setResult] = useState(null)
  const firstTry = useRef(true)
  const filed = useRef(false)
  const lang = runtime.targetLanguage

  function check() {
    if (!reply.trim()) return
    const assisted = shown || copiesShownModel(reply, shown ? model : '')
    const independent = !assisted
    const verdict = runtime.evaluate(step.evalKind, reply, { name: vars.name, partner: vars.partner, independent, ...(step.courseContext || {}) })
    setResult(verdict)
    if (filed.current) return
    const m = loadLearnerModel()
    if (verdict.completedObjective) {
      for (const id of step.itemIds || []) recordItemAttempt(m, id, { correct: true, independent: independent && firstTry.current, evidenceKind: 'open', capability: episode.canDoId })
      if (blockType === 'course_transfer' || blockType === 'course_mission') {
        recordCanDoAttempt(m, episode.canDoId, { success: true, independent: independent && firstTry.current, context: `${blockType}:${episode.id}` })
      }
      for (const id of step.itemIds || []) recordActivitySignalOnce(m, `${dayKeyFor()}:session:review:${id}:completed`, 'recall', 'completed')
      filed.current = true
      saveLearnerModel(m)
    } else if (!verdict.notEvaluable) {
      for (const id of step.itemIds || []) recordItemAttempt(m, id, { correct: false, independent: false, evidenceKind: 'open', capability: episode.canDoId })
      if (verdict.errorType) markRecurringError(m, `${runtime.courseId}:${verdict.errorType}`)
      saveLearnerModel(m)
      firstTry.current = false
    }
  }

  const prompt = fill(step.promptEn || step.sceneEn, vars)
  return (
    <div className="animate-fade-up">
      {prompt ? (
        <div className="flex gap-3 mb-2">
          <LinguaAvatar size={34} online className="mt-0.5" />
          <div className="bubble-lingua"><span lang={lang} dir="ltr" style={{ fontWeight: 700 }}>{prompt}</span></div>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-3"><ChattoMascot mood="supportive" size={40} decorative /></div>
      )}
      {prompt && <ListeningTurn textShown lang={lang} turnId={`${episode.id}:${stepIndex}:practice`} text={prompt} />}
      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)', margin: '8px 0 10px' }}>{t(step.instructionKey)}</p>
      {shown && <p className="rounded-xl p-3 mb-3" style={{ background: 'var(--accent-soft)', fontSize: '0.875rem' }}>{t('courseModelAnswer')} <span lang={lang} dir="ltr" style={{ fontWeight: 700 }}>{model}</span></p>}
      <form onSubmit={e => { e.preventDefault(); check() }} className="flex gap-2 rounded-2xl p-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <input value={reply} onChange={e => { setReply(e.target.value); setResult(null) }} lang={lang} dir="ltr" aria-label={t(step.instructionKey)}
          placeholder={appT('ep1TypeReply')} className="chat-input flex-1 bg-transparent text-sm" style={{ color: 'var(--ink)', border: 'none', outline: 'none', padding: '7px 4px', minWidth: 0 }} />
        <button type="submit" disabled={!reply.trim()} className="rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: reply.trim() ? 'var(--info)' : 'var(--border)' }}>{appT('ep1Check')}</button>
      </form>
      {!shown && !result?.completedObjective && (
        <button type="button" onClick={() => setShown(true)} className="tool-chip mt-2">{appT('courseShowModel')}</button>
      )}
      {result && (result.completedObjective ? (
        <div role="status" className="mt-3">
          <p style={{ fontSize: '0.875rem', color: 'var(--positive)', fontWeight: 700 }}>{t(result.praiseKey || 'es.praise.good')}{result.spellingNote && <> <span lang={lang} dir="ltr">{result.spellingNote}</span></>}</p>
          <button type="button" onClick={() => onDone(true)} className="btn-primary w-full mt-3" style={{ minHeight: 44 }}>{appT('ep1Continue')}</button>
        </div>
      ) : (
        <div role="status" className="correction-card mt-3">
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-strong)', marginBottom: 3 }}>{appT('ep1RetryTitle')}</p>
          {result.explanation && <p className="correction-why" style={{ marginBottom: 5 }}>{t(result.explanation)}</p>}
          {result.naturalVersion && <span className="correction-natural" lang={lang} dir="ltr">{result.naturalVersion}</span>}
          {result.retryPrompt && <p className="correction-why" style={{ marginTop: 6 }}>{t(result.retryPrompt)}</p>}
        </div>
      ))}
    </div>
  )
}

const BLOCK_LABEL = {
  course_review: 'courseBlockReview', course_episode: 'courseBlockLesson', course_retry: 'courseBlockRetry',
  course_transfer: 'courseBlockTransfer', course_mission: 'courseBlockMission',
}

/* Today's course session: one block at a time, persisted after each. */
export function CourseSessionRunner({ session: initial, onExit }) {
  const { t, activeCourse } = useApp()
  const [session, setSession] = useState(initial)
  const [content, setContent] = useState(null)
  const [turn, setTurn] = useState(0)
  const [failed, setFailed] = useState(false)
  const block = session.blocks[session.currentBlockIndex]

  useEffect(() => {
    let alive = true
    getCourse(activeCourse).loadContent().then(mod => { if (alive) setContent(mod) }).catch(() => { if (alive) setFailed(true) })
    return () => { alive = false }
  }, [activeCourse])
  useEffect(() => {
    if (session.status === 'planned') { const started = { ...session, status: 'active' }; setSession(saveCourseSession(started) || started) }
  }, [])

  const steps = useMemo(() => (content && block ? resolveBlockSteps(block, content.ES_EPISODES, { seed: session.id }) : []), [content, block, session.id])

  function next() {
    setTurn(0)
    const advanced = advanceCourseSession(session)
    setSession(saveCourseSession(advanced) || advanced)
  }

  const practiceBlocks = session.blocks.filter(b => b.type !== 'session_completion').length
  const position = Math.min(session.currentBlockIndex + 1, practiceBlocks)
  const mission = block?.type === 'course_mission' ? Object.values(COURSE_MISSIONS).flat().find(m => m.id === block.payload.missionId) : null

  if (failed) return <p role="alert" className="p-6">{t('screenLoadFailed')}</p>
  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6" style={{ background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
        <div className="rounded-2xl px-4 py-3 mb-5 flex items-center justify-between gap-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>{t('courseSessionTitle')}</p>
            <p style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ink)' }}>
              {block?.type === 'session_completion' ? t('courseSessionDone') : `${t(BLOCK_LABEL[block?.type] || 'courseBlockLesson')} · ${t('courseSessionStep', { n: position, total: practiceBlocks })}`}
            </p>
          </div>
          <button type="button" onClick={onExit} className="tool-chip flex-shrink-0">{t('backToToday')}</button>
        </div>

        {!block || block.type === 'session_completion' ? (
          <div className="rounded-3xl p-6 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex justify-center"><ChattoMascot mood="celebrating" size="medium" decorative /></div>
            <h2 style={{ fontWeight: 800, fontSize: '1.1875rem', color: 'var(--ink)', margin: '12px 0 8px' }}>{t('courseSessionDone')}</h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', marginBottom: 16 }}>{t('courseSessionDoneBody')}</p>
            <button type="button" onClick={onExit} className="btn-primary w-full" style={{ minHeight: 46 }}>{t('backToToday')}</button>
          </div>
        ) : block.type === 'course_episode' ? (
          <EpisodeShell episodeId={block.payload.episodeId} onComplete={() => { next(); return true }} />
        ) : !content ? (
          <p className="p-6">{t('screenLoading')}</p>
        ) : !steps.length ? (
          <div className="rounded-2xl p-4" style={{ background: 'var(--surface-soft)' }}>
            <p style={{ marginBottom: 12 }}>{t('courseBlockUnavailable')}</p>
            <button type="button" onClick={next} className="btn-primary w-full">{t('ep1Continue')}</button>
          </div>
        ) : (
          <>
            {mission && <p style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 10 }}>{t(mission.titleKey)} · {t('courseSessionStep', { n: turn + 1, total: steps.length })}</p>}
            <CoursePracticeTurn key={`${block.id}:${turn}`} episode={content.getEpisode(steps[turn].episodeId)} stepIndex={steps[turn].stepIndex} blockType={block.type}
              onDone={() => { if (turn + 1 < steps.length) setTurn(turn + 1); else next() }} />
          </>
        )}
      </div>
    </div>
  )
}
