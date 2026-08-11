import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { TutorNotes } from './TutorNotes'
import { SKELETON_BY_ID } from '../../learning/curriculum/preA1Skeleton.generated.js'
import { PRE_A1, episodesOfLevel } from '../../learning/curriculum/levels.js'
import { loadLearnerModel, getEpisodeState } from '../../learning/engine/learnerModel.js'

/*
 * THE CONTEXT PANEL IS CONTEXTUAL.
 *
 * It used to be one global panel — Lingua's notes, on every route, including the
 * pricing page. The frames are explicit that the right column belongs to whatever
 * the learner is doing:
 *
 *   Home (3a)          Lingua, her last line, what you fixed last, words nearly yours
 *   Conversation (3b)  this episode's steps, the words in play, the notes
 *   Video (3c)         the transcript and quick phrases (inside the call surface)
 *   Words (3d)         your path and the counts
 *   Pricing / profile  nothing — a plan page has no tutor context
 *
 * So `contextPanelFor(view)` answers "is there a panel here, and which one", and
 * the shell asks it rather than assuming. A route with no context renders no
 * column at all, which is also how the centre gets its width back.
 */

const ARC = episodesOfLevel(PRE_A1)

export const CONTEXT_PANELS = {
  today: 'home',
  practice: 'conversation',
  chats: 'home',
  'memory-garden': 'path',
  identity: null,
  pricing: null,
  archive: null,
  call: null,
  video: null,
}

export function contextPanelFor(view) {
  return CONTEXT_PANELS[view] ?? null
}

function PanelSection({ label, children }) {
  return (
    <section className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <p className="eyebrow" style={{ marginBottom: 9 }}>{label}</p>
      {children}
    </section>
  )
}

/* HOME (3a): Lingua first, then the two small things worth glancing at. */
function HomeContext({ onOpenConversation }) {
  const { t, messages, localProgress } = useApp()
  const lastLingua = useMemo(
    () => [...messages].reverse().find(m => m.role === 'lingua') || null,
    [messages],
  )
  const lastFix = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const corrected = messages[i]?.feedback?.correction
      if (!corrected) continue
      const original = messages.slice(0, i).reverse().find(m => m.role === 'user')?.text || null
      return { original, corrected }
    }
    return null
  }, [messages])
  /* words the learner has met but does not own yet — the frame's "casi las tienes" */
  const almost = useMemo(() => (localProgress?.learnedItems || [])
    .filter(item => item?.word)
    .slice(0, 4)
    .map(item => item.word), [localProgress])

  return (
    <>
      <PanelSection label={t('linguaReady')}>
        <div className="flex items-center gap-3 mb-3">
          <LinguaAvatar size={40} online />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>{t('linguaReady')}</p>
            <p style={{ fontSize: 12, color: 'var(--positive-deep)', fontWeight: 600 }}>{t('linguaOnline')}</p>
          </div>
        </div>
        {lastLingua && (
          <p lang="en" dir="ltr" className="mini-window" style={{ fontSize: '0.875rem', color: 'var(--text)' }}>
            “{lastLingua.text}”
          </p>
        )}
        <button type="button" className="btn-primary w-full mt-3" onClick={onOpenConversation}>
          {t('linguaWriteTo')}
        </button>
      </PanelSection>

      {lastFix && (
        <PanelSection label={t('lastFixed')}>
          {lastFix.original && (
            <p lang="en" dir="ltr" className="correction-quote" style={{ fontSize: '0.8125rem' }}>{lastFix.original}</p>
          )}
          <p lang="en" dir="ltr" className="correction-natural" style={{ fontSize: '0.9375rem', marginTop: 3 }}>
            {lastFix.corrected}
          </p>
        </PanelSection>
      )}

      {almost.length > 0 && (
        <PanelSection label={t('wordsAlmostThere')}>
          <div className="flex flex-wrap gap-1.5">
            {almost.map(word => (
              <span key={word} lang="en" dir="ltr" className="tool-chip"
                style={{ minHeight: 30, padding: '4px 10px', fontSize: 12 }}>
                {word}
              </span>
            ))}
          </div>
        </PanelSection>
      )}
    </>
  )
}

/*
 * CONVERSATION (3b): what this episode is made of, the words in play, then the
 * notes. When no episode is running, the notes are the whole panel — there is no
 * episode context to invent.
 */
function ConversationContext() {
  const { t, episodeActiveId, episodeArcVersion, nativeLanguageInfo } = useApp()
  const episode = episodeActiveId ? SKELETON_BY_ID[episodeActiveId] : null
  const state = useMemo(
    () => (episodeActiveId ? getEpisodeState(loadLearnerModel(), episodeActiveId) : null),
    [episodeActiveId, episodeArcVersion],
  )

  /*
   * The steps of the running episode, as a checklist. Titles come from the
   * skeleton's step metadata; there is no prose here, so this panel never pulls
   * episode content into the shell's chunk.
   */
  const steps = episode?.steps || []
  const currentIndex = state?.stepIndex ?? 0
  const items = steps.map((step, index) => ({
    type: step.type,
    itemId: step.itemId || (step.meaningItems || [])[0] || null,
    done: index < currentIndex,
    current: index === currentIndex,
  }))
  const wordsInPlay = [...new Set(items.map(item => item.itemId).filter(Boolean))].slice(0, 6)

  return (
    <>
      {episode && (
        <PanelSection label={t('thisEpisode')}>
          <p className="font-display" lang={nativeLanguageInfo.base}
            style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)', marginBottom: 8 }}>
            {t(episode.titleKey)}
          </p>
          <ol className="flex flex-col gap-2" style={{ listStyle: 'none' }}>
            {items.map((item, index) => (
              <li key={index} className="flex items-center gap-2.5">
                <span aria-hidden="true" style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  display: 'grid', placeItems: 'center',
                  background: item.done ? 'var(--positive)' : item.current ? 'var(--accent)' : 'var(--surface-sunk)',
                  border: item.done || item.current ? 'none' : '1px solid var(--border)',
                  color: '#FFF8F4', fontSize: 10, fontWeight: 700,
                }}>
                  {item.done ? '✓' : ''}
                </span>
                <span style={{
                  fontSize: '0.8125rem',
                  color: item.current ? 'var(--ink)' : item.done ? 'var(--muted)' : 'var(--muted)',
                  fontWeight: item.current ? 700 : 500,
                }}>
                  {t(`stepType_${item.type}`)}
                </span>
              </li>
            ))}
          </ol>
        </PanelSection>
      )}

      {wordsInPlay.length > 0 && (
        <PanelSection label={t('wordsInPlay')}>
          <div className="flex flex-col gap-1.5">
            {wordsInPlay.map(id => (
              <span key={id} lang="en" dir="ltr" className="mini-window"
                style={{ padding: '9px 12px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                {id.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </PanelSection>
      )}

      <div style={{ flex: 1, minHeight: 0 }}>
        <TutorNotes />
      </div>
    </>
  )
}

/* WORDS (3d): the path, and the counts beside it. */
function PathContext() {
  const { t, localProgress, episodeArcVersion, nativeLanguageInfo } = useApp()
  const arcInfo = useMemo(() => {
    const model = loadLearnerModel()
    const completed = ARC.filter(episode => getEpisodeState(model, episode.id).status === 'completed').length
    const current = ARC.find(episode => getEpisodeState(model, episode.id).status !== 'completed') || null
    return { completed, total: ARC.length, current: current ? SKELETON_BY_ID[current.id] : null }
  }, [episodeArcVersion])

  return (
    <>
      <PanelSection label={t('yourPath')}>
        <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 10 }}>
          {t('preA1LevelBadge')} · {arcInfo.completed}/{arcInfo.total}
        </p>
        {arcInfo.current && (
          <div className="mini-window">
            <p className="eyebrow" style={{ marginBottom: 4 }}>{t('planTodayBadge')}</p>
            <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--ink)' }}>
              {t(arcInfo.current.titleKey)}
            </p>
          </div>
        )}
      </PanelSection>
      <PanelSection label={t('yourProgress')}>
        <div className="flex items-baseline gap-4">
          <span>
            <span className="font-display" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--ink)' }}>
              {(localProgress?.learnedItems || []).length}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--muted)', marginInlineStart: 5 }}>{t('yourWordsNav')}</span>
          </span>
          <span>
            <span className="font-display" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--ink)' }}>
              {(localProgress?.sessions || []).length}
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--muted)', marginInlineStart: 5 }}>{t('conversations')}</span>
          </span>
        </div>
      </PanelSection>
    </>
  )
}

export function ContextPanel({ kind, onOpenConversation }) {
  if (!kind) return null
  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: 'var(--surface)' }}>
      {kind === 'home' && <HomeContext onOpenConversation={onOpenConversation} />}
      {kind === 'conversation' && <ConversationContext />}
      {kind === 'path' && <PathContext />}
    </div>
  )
}

export default ContextPanel
