import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { loadLearnerModel } from '../../learning/engine/learnerModel.js'
import { teachingHistory } from '../../learning/engine/teachingPolicy.js'

/*
 * LINGUA'S NOTES — a notebook at the side of the conversation.
 *
 * This used to look like a smart panel: a bright block at the top, a percentage
 * bar, tilted "sticker" cards. It also showed example data — a fixed confidence
 * number, four invented words and an invented mistake — in a surface that claims
 * to be about THIS learner. Both are gone.
 *
 * What it is now: paper, ruled lines, one thing per line, and every line read
 * from real state — the selected message's feedback, the learner model's items,
 * the conversation's own corrections. When there is nothing to say, it says that
 * instead of filling the space.
 */

function NoteSection({ label, children }) {
  return (
    <div className="notes-line">
      <p className="eyebrow" style={{ marginBottom: 8 }}>{label}</p>
      {children}
    </div>
  )
}

/*
 * What the learner did on their own this week: first attempts, no help, no
 * retry, counted from the teaching history (the same rule as the Tú screen).
 *
 * It replaces a "confidence" percentage that was 45 + 2 per message + 1 per
 * correction received, capped at 95 — it went UP when the learner was
 * corrected and measured activity, not ability. A number a learner reads as
 * "how good I am" has to come from evidence.
 */
function OwnAnswersThisWeek() {
  const { t } = useApp()
  const count = useMemo(() => {
    const since = Date.now() - 7 * 86400000
    return teachingHistory(loadLearnerModel().teachingHistory)
      .filter(x => x.at >= since && x.independent && !x.assisted && !x.retried && x.success === true).length
  }, [])
  return (
    <p style={{ fontSize: '0.8125rem', color: count ? 'var(--text)' : 'var(--muted)', lineHeight: 1.5 }}>
      {count ? t('evidenceWeeklySummary', { count }) : t('evidenceWeeklyEmpty')}
    </p>
  )
}

export function TutorNotes() {
  const { selectedMessage, isTyping, localProgress, profile, messages, t } = useApp()
  const feedback = selectedMessage?.feedback
  const latestTopic = localProgress?.topicsPracticed?.[0]
  const currentFocus = feedback?.focus || profile.placementResult?.placementFocusAreas?.[0] || latestTopic || t('defaultFocus')
  const nextMiniGoal = feedback?.learningAction?.prompt || t('defaultMiniGoal')

  /*
   * The words this learner has actually met, most recently first, with the state
   * the learner model recorded for each.
   *
   * The labels come from local progress rather than from the vocabulary
   * catalogue on purpose: this panel is mounted in the shell, so importing the
   * catalogue here would put every word in the product into the entry chunk —
   * which is what `check:curriculum-loading` caught when it did.
   */
  const recentWords = useMemo(() => {
    const model = loadLearnerModel()
    return (localProgress?.learnedItems || [])
      .filter(item => item?.word)
      .slice(0, 5)
      .map(item => ({
        id: item.vocabId || item.word,
        term: item.word,
        state: item.vocabId ? model.languageItems?.[item.vocabId]?.learningState : null,
      }))
  }, [localProgress, messages.length, selectedMessage])

  const wordToUse = feedback?.wordToUse || recentWords[0]?.term || null

  /* The most recent real correction from this conversation. */
  const lastFix = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const corrected = messages[i]?.feedback?.correction
      if (!corrected) continue
      const original = messages.slice(0, i).reverse().find(m => m.role === 'user')?.text || null
      return { original, corrected }
    }
    return null
  }, [messages])

  const hasSelectedFeedback = Boolean(feedback && (feedback.correction || feedback.why || feedback.suggestion || feedback.translation))

  return (
    <div className="notes-panel flex flex-col h-full overflow-hidden">
      {/* Header: who is writing these notes, and whether they are writing now */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <LinguaAvatar size={38} online />
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>{t('tutorNotes')}</p>
          <p style={{ fontSize: 11.5, color: 'var(--positive-deep)', fontWeight: 600 }}>
            {isTyping ? t('notesWriting') : t('notesListening')}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-0">

        {hasSelectedFeedback ? (
          <>
            {feedback.correction && (
              <NoteSection label={t('correction')}>
                <div className="correction-card">
                  <p lang="en" dir="ltr" className="correction-natural" style={{ fontSize: '0.875rem' }}>
                    {feedback.correction}
                  </p>
                  {feedback.why && <p className="correction-why" style={{ marginTop: 4 }}>{feedback.why}</p>}
                </div>
              </NoteSection>
            )}

            {!feedback.correction && feedback.why && (
              <NoteSection label={t('quickWhy')}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.55 }}>{feedback.why}</p>
              </NoteSection>
            )}

            {feedback.suggestion && (
              <NoteSection label={t('recommendedPhrase')}>
                <p lang="en" dir="ltr" style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 600 }}>
                  {feedback.suggestion}
                </p>
              </NoteSection>
            )}

            {feedback.translation && (
              <NoteSection label={t('translation')}>
                <p lang="en" dir="ltr" style={{ fontSize: '0.9375rem', color: 'var(--ink)', fontWeight: 700 }}>
                  {feedback.translation}
                </p>
              </NoteSection>
            )}
          </>
        ) : (
          /* Nothing selected: say what this panel is for, once, quietly. */
          <div className="notes-line py-2">
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
              {t('askMeAnything')}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              {t('notesEmptyHint')}
            </p>
          </div>
        )}

        <NoteSection label={t('currentFocus')}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.55 }}>{currentFocus}</p>
        </NoteSection>

        <NoteSection label={t('nextMiniGoal')}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text)', lineHeight: 1.55, fontWeight: 600 }}>{nextMiniGoal}</p>
        </NoteSection>

        {wordToUse && (
          <NoteSection label={t('wordToUse')}>
            <span lang="en" dir="ltr" className="tool-chip"
              style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-tint)', color: 'var(--accent-strong)', minHeight: 32, padding: '5px 12px' }}>
              {wordToUse}
            </span>
          </NoteSection>
        )}

        {/* What they did on their own this week — evidence, not a percentage */}
        <NoteSection label={t('evidenceWeeklyTitle')}>
          <OwnAnswersThisWeek />
        </NoteSection>

        {/* The words this learner has met, with the state the model recorded */}
        {recentWords.length > 0 && (
          <NoteSection label={t('wordsToday')}>
            <div className="flex flex-wrap gap-1.5">
              {recentWords.map(word => {
                const owned = word.state === 'can_use' || word.state === 'practicing'
                return (
                  <span key={word.id} lang="en" dir="ltr" style={{
                    fontSize: 11.5, fontWeight: 600,
                    background: owned ? 'var(--positive-soft)' : 'var(--surface-sunk)',
                    border: `1px solid ${owned ? 'var(--positive)' : 'var(--border)'}`,
                    color: owned ? 'var(--positive-deep)' : 'var(--muted)',
                    padding: '3px 9px', borderRadius: 999,
                  }}>
                    {word.term}
                  </span>
                )
              })}
            </div>
          </NoteSection>
        )}

        {/* The last thing actually fixed in this conversation */}
        {lastFix && (
          <div>
            <p className="eyebrow" style={{ marginBottom: 8 }}>{t('lastFix')}</p>
            <div className="mini-window">
              {lastFix.original && (
                <p lang="en" dir="ltr" className="correction-quote" style={{ fontSize: 11.5 }}>{lastFix.original}</p>
              )}
              <p lang="en" dir="ltr" style={{ fontSize: '0.8125rem', color: 'var(--positive-deep)', fontWeight: 700, marginTop: 2 }}>
                {lastFix.corrected}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
