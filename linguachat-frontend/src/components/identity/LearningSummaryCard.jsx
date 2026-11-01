import { useApp } from '../../context/AppContext'
import { episodesOfLevel, playableLevelId } from '../../learning/curriculum/levels.js'

/*
 * "Your learning" on the Tú screen: what the learner practises, can already do
 * on their own, should review, and what is not evaluated at all.
 *
 * It renders a `learnerSummary()` (learning/engine/learnerSummary.js) and
 * nothing else — counts and plain words, never an invented score. Its own
 * component so it can be checked with synthetic summaries (empty, early,
 * further along) without a signed-in account.
 */
const SKILL_KEYS = {
  insufficient: 'youSkillInsufficient',
  uncertain: 'youSkillUncertain',
  holding: 'youSkillHolding',
  needs_practice: 'youSkillNeedsPractice',
}

export function LearningSummaryCard({ summary }) {
  const { t } = useApp()
  const skillName = canDoId => t((episodesOfLevel(playableLevelId()).find(e => e.canDoId === canDoId) || {}).canDoNameKey || 'preA1LevelBadge')
  const focusLine = !summary.focus ? null
    : summary.focus.kind === 'strengthen_skill' ? t('preA1FocusSkill').replace('{skill}', skillName(summary.focus.canDoId))
      : summary.focus.kind === 'catch_up_reviews' ? t('preA1FocusReviews')
        : summary.focus.kind === 'have_a_conversation' ? t('preA1FocusConversation')
          : summary.focus.kind === 'finish_curriculum' ? t('preA1FocusFinish') : null
  const skillLine = skill => skill.status === 'not_assessed' ? t('youSkillNotAssessed')
    : t(SKILL_KEYS[skill.status] || 'youSkillInsufficient', { count: skill.successes })
  const row = (key, skill) => t('youSkillRow', { skill: t(key), status: skillLine(skill) })

  return (
    <section aria-labelledby="you-learning-title" className="rounded-2xl p-5 mb-5 animate-fade-up" style={{ animationDelay: '0.10s', background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h3 id="you-learning-title" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 12 }}>
        {t('youLearningTitle')}
      </h3>
      {summary.empty ? (
        <p style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{t('youLearningEmpty')}</p>
      ) : (
        <dl className="flex flex-col gap-3" style={{ fontSize: '0.875rem' }}>
          <div>
            <dt style={{ fontWeight: 800, color: 'var(--ink)' }}>{t('youPractisingTitle')}</dt>
            <dd style={{ color: 'var(--text)' }}>{t('youWordsLine', { canUse: summary.words.canUse, practicing: summary.words.practicing })}</dd>
            <dd style={{ color: 'var(--muted)' }}>{summary.toReview ? t('youReviewDue', { count: summary.toReview }) : t('youReviewNone')}</dd>
          </div>
          <div>
            <dt style={{ fontWeight: 800, color: 'var(--ink)' }}>{t('youDemonstratedTitle')}</dt>
            <dd style={{ color: 'var(--text)' }}>{row('youSkillWritten', summary.skills.written)}</dd>
            <dd style={{ color: 'var(--text)' }}>{row('youSkillListening', summary.skills.listening)}</dd>
            <dd style={{ color: 'var(--muted)' }}>{row('youSkillSpeaking', summary.skills.speaking)}</dd>
            {summary.improved > 0 && <dd style={{ color: 'var(--positive-deep)', fontWeight: 700 }}>{t('youImproved', { count: summary.improved })}</dd>}
          </div>
          {(summary.strengthen.length > 0 || focusLine || summary.notStarted > 0) && (
            <div>
              <dt style={{ fontWeight: 800, color: 'var(--ink)' }}>{t('youNextTitle')}</dt>
              {summary.strengthen.length > 0 && <dd style={{ color: 'var(--text)' }}>{t('youStrengthen', { skills: summary.strengthen.map(skillName).join(' · ') })}</dd>}
              {focusLine && <dd style={{ color: 'var(--text)' }}>{focusLine}</dd>}
              {summary.notStarted > 0 && <dd style={{ color: 'var(--muted)' }}>{t('youNotStarted', { count: summary.notStarted })}</dd>}
            </div>
          )}
          <div>
            <dt style={{ fontWeight: 800, color: 'var(--ink)' }}>{t('youHelpTitle')}</dt>
            <dd style={{ color: 'var(--text)' }}>{t('youHelpLine', { own: summary.help.own, assisted: summary.help.assisted })}</dd>
            <dd style={{ color: 'var(--muted)' }}>{t('youHelpMeaning')}</dd>
          </div>
        </dl>
      )}
    </section>
  )
}

export default LearningSummaryCard
