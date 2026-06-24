import { useState } from 'react'
import { useApp } from '../../context/AppContext'

const MOCK_ARCHIVE = [
  {
    id: 1,
    date: '2025-12-10',
    topic: 'Travel plans',
    mood: '😊',
    moodLabel: 'Excited',
    confidence: 8,
    messages: 14,
    preview: 'I want to visit London next summer. Lingua helped me plan the conversation...',
    tags: ['travel', 'future tense'],
    correction: 'I want go vs I want to go',
  },
  {
    id: 2,
    date: '2025-12-09',
    topic: 'Job interview prep',
    mood: '💪',
    moodLabel: 'Motivated',
    confidence: 7,
    messages: 18,
    preview: 'Can you tell me about yourself? I practiced formal introductions and key phrases...',
    tags: ['interview', 'formal English'],
    correction: 'I have experience in vs I have an experience in',
  },
  {
    id: 3,
    date: '2025-12-08',
    topic: 'Weekend hobbies',
    mood: '😄',
    moodLabel: 'Relaxed',
    confidence: 9,
    messages: 11,
    preview: 'I like to play football on Sundays. We talked about hobbies and leisure...',
    tags: ['casual', 'present simple'],
    correction: null,
  },
  {
    id: 4,
    date: '2025-12-07',
    topic: 'Telling a story',
    mood: '🤔',
    moodLabel: 'Focused',
    confidence: 6,
    messages: 22,
    preview: 'I went to the market yesterday. Lingua helped me narrate past events...',
    tags: ['storytelling', 'past tense'],
    correction: 'I goed vs I went',
  },
  {
    id: 5,
    date: '2025-12-06',
    topic: 'Ordering at a restaurant',
    mood: '😊',
    moodLabel: 'Comfortable',
    confidence: 8,
    messages: 9,
    preview: 'I would like to order the pasta, please. Practical phrases for real situations...',
    tags: ['practical', 'conditionals'],
    correction: null,
  },
  {
    id: 6,
    date: '2025-12-05',
    topic: 'Talking about feelings',
    mood: '😌',
    moodLabel: 'Open',
    confidence: 7,
    messages: 16,
    preview: 'I feel anxious when I speak English with strangers. Emotional vocabulary...',
    tags: ['emotional', 'adjectives'],
    correction: 'I am feeling vs I feel',
  },
]

function ConfidenceBadge({ value }) {
  const color = value >= 8 ? 'var(--green)' : value >= 6 ? 'var(--blue)' : 'var(--yellow)'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      background: value >= 8 ? 'var(--green-soft)' : value >= 6 ? 'var(--blue-soft)' : 'var(--yellow-soft)',
      border: `1px solid ${color}`,
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color }}>+{value}</span>
      <span style={{ fontSize: 10, color, fontWeight: 500 }}>pts</span>
    </div>
  )
}

export function ConversationArchive() {
  const { navigateTo, localProgress, t, nativeLanguage } = useApp()
  const [expanded, setExpanded] = useState(null)
  const hasRealSessions = localProgress.sessions.length > 0
  const conversations = hasRealSessions ? localProgress.sessions : MOCK_ARCHIVE
  const bestTopic = hasRealSessions ? localProgress.topics[0] || 'Conversation' : 'Weekend hobbies'

  function formatDate(dateStr) {
    const d = new Date(dateStr)
    return d.toLocaleDateString(nativeLanguage === 'es' ? 'es-CL' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8" style={{ background: 'var(--bg-main)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 6 }}>
            {t('everySessionSaved')}
          </p>
          <div className="flex items-end justify-between">
            <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', color: 'var(--ink)', lineHeight: 1.1 }}>
              {t('conversationArchive')}
            </h1>
            <div className="text-right">
              <p style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--violet)' }}>{conversations.length}</p>
              <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{t('sessions')}</p>
            </div>
          </div>
        </div>

        {/* Timeline cards */}
        <div className="relative">
          {/* Timeline line */}
          <div className="hidden md:block absolute left-[22px] top-0 bottom-0" style={{ width: 2, background: 'var(--border)', marginTop: 12 }} />

          <div className="flex flex-col gap-4">
            {conversations.map((convo, i) => {
              const isOpen = expanded === convo.id
              return (
                <div key={convo.id} className="flex gap-4 animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  {/* Timeline dot */}
                  <div className="hidden md:flex flex-col items-center" style={{ flexShrink: 0 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', marginTop: 20,
                      background: 'var(--bg-paper)',
                      border: `2px solid ${i === 0 ? 'var(--violet)' : 'var(--border)'}`,
                      boxShadow: i === 0 ? '0 0 0 3px var(--violet-soft)' : 'none',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                    }} />
                  </div>

                  {/* Card */}
                  <div
                    className="flex-1 rounded-2xl overflow-hidden cursor-pointer transition-all"
                    style={{
                      background: 'var(--bg-paper)',
                      border: `1.5px solid ${isOpen ? 'var(--violet)' : 'var(--border)'}`,
                      boxShadow: isOpen ? '0 4px 20px rgba(124,92,255,0.12)' : 'none',
                    }}
                    onClick={() => setExpanded(isOpen ? null : convo.id)}
                  >
                    {/* Card header */}
                    <div className="flex items-start justify-between p-4">
                      <div className="flex items-start gap-3">
                        <span style={{ fontSize: 24, lineHeight: 1 }}>{convo.mood}</span>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)', marginBottom: 3 }}>
                            {convo.topic}
                          </p>
                          <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
                            {formatDate(convo.date)} &middot; {convo.messages} messages
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ConfidenceBadge value={convo.confidence} />
                        <div style={{
                          width: 24, height: 24, borderRadius: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                          transition: 'transform 0.2s',
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9l6 6 6-6"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Preview text */}
                    <div style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: isOpen ? 0 : 14 }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
                        {convo.preview}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex gap-1.5 px-4 pb-3 flex-wrap">
                      {convo.tags.map(tag => (
                        <span key={tag} style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                          background: 'var(--bg-elevated)', color: 'var(--ink-muted)', border: '1px solid var(--border)',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div style={{ borderTop: '1px solid var(--border)', margin: '0 16px' }}>
                        <div className="py-4">
                          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 10 }}>
                            {t('sessionDetails')}
                          </p>
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {[
                              { label: 'Mood', value: convo.moodLabel },
                              { label: t('messages'), value: convo.messages },
                              { label: t('confidence'), value: `+${convo.confidence} pts` },
                            ].map(d => (
                              <div key={d.label} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                                <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)', marginBottom: 2 }}>{d.value}</p>
                                <p style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{d.label}</p>
                              </div>
                            ))}
                          </div>

                          {convo.correction && (
                            <div className="stamp-correction mb-3" style={{ width: '100%' }}>
                              <span style={{
                                fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                                letterSpacing: '0.1em', background: 'var(--yellow)', padding: '1px 6px',
                                borderRadius: 4, color: '#fff',
                              }}>
                                {t('keyFix')}
                              </span>
                              <span style={{ color: 'var(--ink)', fontSize: '0.875rem' }}>{convo.correction}</span>
                            </div>
                          )}

                          <button
                            onClick={e => { e.stopPropagation(); navigateTo('practice') }}
                            className="w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
                            style={{ background: 'var(--violet)', color: '#fff', border: 'none', cursor: 'pointer' }}
                          >
                            {t('practiceAgain')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary footer */}
        <div className="grid grid-cols-2 gap-3 mt-8 animate-fade-up">
          <div className="rounded-2xl p-4" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 8 }}>
              {t('bestTopic')}
            </p>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>{bestTopic}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--green)', fontWeight: 600, marginTop: 2 }}>+{hasRealSessions ? Math.max(1, Math.round((localProgress.confidence - 45) / 5)) : 9} confidence pts</p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 8 }}>
              {t('mostPracticed')}
            </p>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>{hasRealSessions ? localProgress.topics[1] || bestTopic : 'Past tense'}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--blue)', fontWeight: 600, marginTop: 2 }}>{conversations.length} {t('sessions')}</p>
          </div>
        </div>

      </div>
    </div>
  )
}
