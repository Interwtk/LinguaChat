import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { SKELETON_BY_ID } from '../../learning/curriculum/preA1Skeleton.generated.js'
import { PRE_A1, episodesOfLevel } from '../../learning/curriculum/levels.js'
import { loadLearnerModel, getEpisodeState } from '../../learning/engine/learnerModel.js'

/*
 * CHATS — the inbox, frame 2c.
 *
 * This is the destination the product was missing. The idea it comes from is that
 * everything conversational already IS a conversation, so it does not need a tab of
 * its own: Lingua is the main thread, an episode in progress is a thread, Lingua's
 * notes are a thread, and the archive is the thread at the bottom. Four rows of
 * navigation instead of a menu with seven items.
 *
 * Every row is built from real state — the stored conversation, the learner model's
 * episode progress, the archive count. There is no invented preview, no invented
 * timestamp, and the unread badge appears only when there is something real to
 * count. A row with nothing behind it is not rendered.
 *
 * Rows are buttons, in reading order, so a keyboard reaches all of them.
 */

const ARC = episodesOfLevel(PRE_A1)

/* "14:32" for today, a weekday for this week, a date beyond that. */
function useStamp() {
  const { interfaceLanguageInfo } = useApp()
  const locale = interfaceLanguageInfo?.code || 'en'
  return (ts) => {
    if (!ts) return ''
    const then = new Date(ts)
    const now = new Date()
    const sameDay = then.toDateString() === now.toDateString()
    try {
      if (sameDay) return then.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
      const days = Math.floor((now - then) / 86400000)
      if (days < 7) return then.toLocaleDateString(locale, { weekday: 'short' })
      return then.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
    } catch {
      return ''
    }
  }
}

function ChatRow({ avatar, title, preview, stamp, unread, onClick, lang }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full text-start px-4"
      style={{
        minHeight: 72, background: 'none', border: 'none', cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{ flexShrink: 0 }}>{avatar}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="flex items-baseline justify-between gap-2">
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </span>
          {stamp && <span style={{ fontSize: 11.5, color: 'var(--muted)', flexShrink: 0 }}>{stamp}</span>}
        </span>
        <span className="flex items-center justify-between gap-2" style={{ marginTop: 2 }}>
          <span lang={lang} style={{
            fontSize: '0.8125rem', color: 'var(--muted)', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
          }}>
            {preview}
          </span>
          {unread > 0 && (
            <span style={{
              flexShrink: 0, minWidth: 20, height: 20, borderRadius: 999,
              background: 'var(--accent)', color: '#FFF8F4',
              fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center', padding: '0 6px',
            }}>
              {unread}
            </span>
          )}
        </span>
      </span>
    </button>
  )
}

/**
 * @param compact  true inside the desktop conversation layout, where this list IS
 *                 the left column and the screen title lives elsewhere.
 * @param activeId which thread is open, so the list can show it as current.
 */
export function ChatsView({ compact = false, activeId = null, onOpenThread }) {
  const {
    t, messages, navigateTo, startEpisode, setMobileSheet,
    localProgress, nativeLanguageInfo, episodeArcVersion,
  } = useApp()
  const [query, setQuery] = useState('')
  const stamp = useStamp()

  /* The main thread: the real conversation, with its real last line. */
  const lastMessage = messages.length ? messages[messages.length - 1] : null
  /* Unread means "Lingua has spoken since the learner last did", counted, not invented. */
  const unreadFromLingua = useMemo(() => {
    let count = 0
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'user') break
      count += 1
    }
    /* the seeded welcome line on its own is not an unread conversation */
    return messages.some(m => m.role === 'user') ? count : 0
  }, [messages])

  /* An episode the learner has actually started and not finished. */
  const episodeInProgress = useMemo(() => {
    const model = loadLearnerModel()
    for (const episode of ARC) {
      const state = getEpisodeState(model, episode.id)
      if (state.status === 'in_progress') {
        return { episode: SKELETON_BY_ID[episode.id] || episode, step: state.stepIndex }
      }
    }
    return null
  }, [episodeArcVersion])

  /* Chatto writes when there is something to say, and only about real content. */
  const chattoLine = episodeInProgress ? t('chattoRowResume') : t('chattoRowStory')

  const archiveCount = (localProgress?.sessions || []).length

  const threads = [
    {
      id: 'lingua',
      avatar: <LinguaAvatar size={46} online />,
      title: t('linguaReady'),
      preview: lastMessage?.text || t('linguaReadyQuote'),
      previewLang: 'en',
      stamp: stamp(lastMessage?.ts),
      unread: unreadFromLingua,
      onClick: () => (onOpenThread ? onOpenThread('lingua') : navigateTo('practice')),
    },
    {
      id: 'chatto',
      avatar: <ChattoMascot mood="happy" size={44} decorative animated={false} />,
      title: 'Chatto',
      preview: chattoLine,
      stamp: '',
      unread: 0,
      /*
       * Chatto is a companion, never a tutor: its row leads to the thing it is
       * talking about — the session — and never to a free conversation with it.
       */
      onClick: () => navigateTo('today'),
    },
    episodeInProgress && {
      id: `episode:${episodeInProgress.episode.id}`,
      avatar: (
        <span className="grid place-items-center rounded-full" aria-hidden="true"
          style={{ width: 46, height: 46, background: 'var(--accent-soft)', color: 'var(--accent-strong)', fontWeight: 700 }}>
          {String(t(episodeInProgress.episode.titleKey) || '·').slice(0, 1)}
        </span>
      ),
      title: t(episodeInProgress.episode.titleKey),
      preview: t('chatRowEpisodeStep', { step: episodeInProgress.step + 1 }),
      stamp: '',
      unread: 0,
      onClick: () => startEpisode(episodeInProgress.episode.id),
    },
    {
      id: 'notes',
      avatar: (
        <span className="grid place-items-center rounded-full" aria-hidden="true"
          style={{ width: 46, height: 46, background: 'var(--positive-soft)', color: 'var(--positive-deep)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>
        </span>
      ),
      title: t('tutorNotes'),
      preview: t('chatRowNotes'),
      stamp: '',
      unread: 0,
      onClick: () => (onOpenThread ? onOpenThread('notes') : setMobileSheet('notes')),
    },
    archiveCount > 0 && {
      id: 'archive',
      avatar: (
        <span className="grid place-items-center rounded-full" aria-hidden="true"
          style={{ width: 46, height: 46, background: 'var(--surface-sunk)', color: 'var(--muted)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="5" rx="1" /><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4" /></svg>
      </span>
      ),
      title: t('conversationArchive'),
      preview: t('chatRowArchive', { count: archiveCount }),
      stamp: '',
      unread: 0,
      onClick: () => navigateTo('archive'),
    },
  ].filter(Boolean)

  const needle = query.trim().toLowerCase()
  const shown = needle
    ? threads.filter(thread => `${thread.title} ${thread.preview}`.toLowerCase().includes(needle))
    : threads

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      {!compact && (
        <div className="px-4 pt-5 pb-3" style={{ background: 'var(--bg)' }}>
          <h1 className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(1.5rem, 5vw, 1.95rem)', color: 'var(--ink)' }}>
            {t('chatsTitle')}
          </h1>
        </div>
      )}

      {/* Search: one field, over the rows, exactly where the frame puts it. */}
      <div className={compact ? 'px-3 pt-3 pb-2' : 'px-4 pb-3'}>
        <label className="flex items-center gap-2 rounded-2xl px-3"
          style={{ background: 'var(--surface-sunk)', border: '1px solid var(--border)', minHeight: 42 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={t('chatsSearchPlaceholder')}
            aria-label={t('chatsSearchPlaceholder')}
            className="chat-input flex-1 bg-transparent"
            style={{ border: 'none', outline: 'none', fontSize: '0.875rem', color: 'var(--text)', padding: '8px 0' }}
          />
        </label>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--surface)' }}>
        {shown.map(thread => (
          <div key={thread.id} style={thread.id === activeId
            ? { background: 'var(--accent-soft)' }
            : undefined}>
            <ChatRow
              avatar={thread.avatar}
              title={thread.title}
              preview={thread.preview}
              lang={thread.previewLang || nativeLanguageInfo.base}
              stamp={thread.stamp}
              unread={thread.unread}
              onClick={thread.onClick}
            />
          </div>
        ))}
        {shown.length === 0 && (
          <p className="px-4 py-6" style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
            {t('chatsNoMatches')}
          </p>
        )}
      </div>
    </div>
  )
}

export default ChatsView
