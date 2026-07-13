import { useApp } from '../../context/AppContext'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { MOCK_STATS, WORDS_LEARNED, LAST_MISTAKES } from '../../data/mockData'

function NoteSection({ label, children }) {
  return (
    <div className="notes-line">
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 8 }}>
        {label}
      </p>
      {children}
    </div>
  )
}

function ConfidenceMeter({ value }) {
  const { t } = useApp()
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink)' }}>{t('confidenceScore')}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--green)' }}>{value}%</span>
      </div>
      <div style={{ height: 7, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          width: `${value}%`, height: '100%', borderRadius: 999,
          background: `linear-gradient(90deg, var(--blue), var(--green))`,
          transition: 'width 0.8s cubic-bezier(0.32,0.72,0,1)',
        }} />
      </div>
      <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 5 }}>
        {t('confidenceHint')}
      </p>
    </div>
  )
}

export function TutorNotes() {
  const { selectedMessage, isTyping, localProgress, profile, t } = useApp()
  const feedback = selectedMessage?.feedback
  const latestLearned = localProgress?.learnedItems?.[0]
  const latestTopic = localProgress?.topicsPracticed?.[0]
  const currentFocus = feedback?.focus || profile.placementResult?.placementFocusAreas?.[0] || latestTopic || t('defaultFocus')
  const nextMiniGoal = feedback?.learningAction?.prompt || t('defaultMiniGoal')
  const wordToUse = feedback?.wordToUse || latestLearned?.word || 'because'

  return (
    <div className="notes-panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <LinguaAvatar size={40} online />
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>{t('tutorNotes')}</p>
          <p style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500 }}>
            {isTyping ? t('notesWriting') : t('notesListening')}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-0">

        {/* If a message with feedback is selected */}
        {feedback && (feedback.correction || feedback.why || feedback.suggestion || feedback.translation) ? (
          <>
            {feedback.translation && (
              <NoteSection label={t('translation')}>
                <div style={{ background: 'var(--violet-soft)', border: '1px solid var(--violet)', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}>"{feedback.translation}"</p>
                </div>
              </NoteSection>
            )}

            {feedback.correction && (
              <NoteSection label={t('correction')}>
                <div style={{ background: 'var(--yellow-soft)', border: '1.5px solid var(--yellow)', borderRadius: 10, padding: '10px 12px', transform: 'rotate(-0.3deg)' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--ink)', fontWeight: 600 }}>{feedback.correction}</p>
                  <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 3 }}>{t('tinyFixProgress')}</p>
                </div>
              </NoteSection>
            )}

            {feedback.why && (
              <NoteSection label={t('quickWhy')}>
                <div style={{ borderLeft: '3px solid var(--blue)', paddingLeft: 10, paddingTop: 2, paddingBottom: 2 }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--ink)', lineHeight: 1.55 }}>{feedback.why}</p>
                </div>
              </NoteSection>
            )}

            {feedback.suggestion && (
              <NoteSection label={t('recommendedPhrase')}>
                <div style={{ background: 'var(--green-soft)', border: '1.5px solid var(--green)', borderRadius: 999, padding: '8px 14px', display: 'inline-block' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--ink)', fontStyle: 'italic', fontWeight: 500 }}>"{feedback.suggestion}"</p>
                </div>
              </NoteSection>
            )}
          </>
        ) : (
          /* Default state: encouragement */
          <div className="notes-line text-center py-4">
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'linear-gradient(135deg, var(--violet), var(--blue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  fill="rgba(255,255,255,0.25)" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
              {t('askMeAnything')}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
              {t('notesEmptyHint')}
            </p>
          </div>
        )}

        <NoteSection label={t('currentFocus')}>
          <div style={{ borderLeft: '3px solid var(--violet)', paddingLeft: 10, paddingTop: 2, paddingBottom: 2 }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink)', lineHeight: 1.55 }}>{currentFocus}</p>
          </div>
        </NoteSection>

        <NoteSection label={t('workingError')}>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink)', lineHeight: 1.55 }}>
              {feedback?.correction ? feedback.correction : t('defaultWorkingError')}
            </p>
          </div>
        </NoteSection>

        <NoteSection label={t('nextMiniGoal')}>
          <div style={{ background: 'var(--blue-soft)', border: '1.5px solid var(--blue)', borderRadius: 10, padding: '10px 12px' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink)', lineHeight: 1.55, fontWeight: 600 }}>{nextMiniGoal}</p>
          </div>
        </NoteSection>

        <NoteSection label={t('wordToUse')}>
          <span style={{
            fontSize: 12,
            fontWeight: 700,
            background: 'var(--violet-soft)',
            border: '1px solid var(--violet)',
            color: 'var(--violet)',
            padding: '4px 10px',
            borderRadius: 999,
          }}>
            {wordToUse}
          </span>
        </NoteSection>

        {/* Confidence meter */}
        <div className="notes-line">
          <ConfidenceMeter value={MOCK_STATS.confidence} />
        </div>

        {/* Words learned today */}
        <NoteSection label={t('wordsToday')}>
          <div className="flex flex-wrap gap-1.5">
            {WORDS_LEARNED.slice(0, 4).map(w => (
              <span key={w.word} style={{
                fontSize: 11, fontWeight: 600,
                background: w.known ? 'var(--green-soft)' : 'var(--bg-elevated)',
                border: `1px solid ${w.known ? 'var(--green)' : 'var(--border)'}`,
                color: w.known ? 'var(--green)' : 'var(--ink-muted)',
                padding: '3px 9px', borderRadius: 999,
              }}>
                {w.emoji} {w.word}
              </span>
            ))}
          </div>
        </NoteSection>

        {/* Last mistake fixed */}
        {LAST_MISTAKES[0] && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 8 }}>
              {t('lastFix')}
            </p>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
                {LAST_MISTAKES[0].topicKey ? t(LAST_MISTAKES[0].topicKey) : LAST_MISTAKES[0].topic}
              </p>
              <p style={{ fontSize: 11, color: 'var(--ink-muted)', textDecoration: 'line-through' }}>
                "{LAST_MISTAKES[0].original}"
              </p>
              <p style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
                "{LAST_MISTAKES[0].fixed}"
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
