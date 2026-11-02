import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { StreakFlame } from '../ui/StreakFlame'
import { CourseSwitcher } from './CourseSwitcher'
import { loadLearnerModel, getEpisodeState } from '../../learning/engine/learnerModel.js'
import { planDay, arcProgress, isEpisodeUnlocked } from '../../learning/engine/planner.js'
import { courseSkeleton, courseHomeCopy } from '../../learning/courses/registry.js'

/*
 * Home for a course other than English (today: Spanish Pre-A1).
 *
 * The same planner as the English Home decides what comes next — an episode in
 * progress, then the next unlocked one — over this course's own episodes and
 * this course's own reviews. What the English Home shows and this one does not
 * is left out on purpose rather than faked: there is no Spanish daily session,
 * mission or free conversation yet, and the card says where the Spanish
 * practice lives instead of offering a button that would open English.
 */
export function CourseToday() {
  const { t, profile, localProgress, activeCourse, startEpisode, episodeArcVersion, nativeLanguageInfo, interfaceLanguageInfo } = useApp()
  const episodes = courseSkeleton(activeCourse)
  const copy = courseHomeCopy(activeCourse, nativeLanguageInfo) || {}
  const say = (key) => copy[key] || ''
  const model = useMemo(() => loadLearnerModel(), [episodeArcVersion, activeCourse])
  const plan = planDay(model, episodes)
  const next = plan.episodeId ? episodes.find(e => e.id === plan.episodeId) : null
  const { completed, total } = arcProgress(model, episodes)
  const streak = localProgress?.streak ?? 0
  const levelDone = total > 0 && completed === total
  const reviewCount = plan.reviewItems?.length || 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('goodMorning') : hour < 18 ? t('goodAfternoon') : t('goodEvening')

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-7 py-5 md:py-7" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <header className="flex items-start justify-between gap-4 mb-5 animate-fade-up">
          <div style={{ minWidth: 0 }}>
            <p className="eyebrow" style={{ marginBottom: 5 }}>
              {new Date().toLocaleDateString(interfaceLanguageInfo.code || 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(1.5rem, 5vw, 2.05rem)', color: 'var(--ink)', lineHeight: 1.08 }}>
              {greeting}{profile.name ? `, ${profile.name}` : ''}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {streak > 0 ? (
              <>
                <StreakFlame days={streak} />
                <div>
                  <p className="font-display" style={{ fontWeight: 700, fontSize: '1.35rem', color: 'var(--ink)', lineHeight: 1 }}>{streak}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{t('dayStreak')}</p>
                </div>
              </>
            ) : (
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, maxWidth: 108, textAlign: 'end' }}>{t('streakStartToday')}</p>
            )}
          </div>
        </header>

        <CourseSwitcher />

        <section className="mission-card p-5 mb-4 animate-fade-up" style={{ animationDelay: '0.04s' }}>
          <div className="flex items-start gap-3.5">
            <ChattoMascot mood="welcoming" size={46} decorative intensity="ambient" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="eyebrow" style={{ marginBottom: 4 }}>{t('courseSpanishLevel')}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{t('courseLessonsDone', { done: completed, total })}</p>
              <div aria-hidden="true" style={{ height: 6, borderRadius: 999, background: 'var(--border)', marginTop: 8, overflow: 'hidden' }}>
                <div style={{ width: `${total ? (completed / total) * 100 : 0}%`, height: '100%', background: 'var(--positive)', transition: 'width 0.4s' }} />
              </div>
            </div>
          </div>

          {next && (
            <div className="mt-4">
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)' }}>
                {plan.type === 'continue_episode' ? t('courseContinueLabel') : t('courseNextLabel')}
              </p>
              <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--ink)', margin: '4px 0 4px' }}>{say(next.titleKey)}</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5 }}>{say(next.goalKey)}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{t('courseMinutes', { minutes: next.estimatedMinutes })}</p>
              <button type="button" onClick={() => startEpisode(next.id)} className="btn-primary w-full mt-3" style={{ minHeight: 46 }}>
                {plan.type === 'continue_episode' ? t('courseContinueCta') : t('courseStartCta')}
              </button>
              {reviewCount > 0 && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>{t('courseReviewsDue', { count: reviewCount })}</p>}
            </div>
          )}
          {levelDone && (
            <p className="mt-4" style={{ fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.55 }}>{t('courseLevelDone')}</p>
          )}
        </section>

        <p className="rounded-2xl p-4 mb-4" style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5, background: 'var(--surface-soft)', border: '1px solid var(--border)' }}>
          {t('courseChatNotice')}
        </p>

        <section aria-labelledby="course-lessons" className="mb-6">
          <h2 id="course-lessons" style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--ink)', marginBottom: 8 }}>{t('courseAllLessons')}</h2>
          <ol className="flex flex-col gap-2">
            {episodes.map((ep, index) => {
              const state = getEpisodeState(model, ep.id)
              const done = state.status === 'completed'
              const open = isEpisodeUnlocked(model, ep)
              return (
                <li key={ep.id}>
                  <button type="button" disabled={!open} onClick={() => startEpisode(ep.id, { source: 'practice' })}
                    className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 text-start transition-all active:scale-[0.99]"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', opacity: open ? 1 : 0.6, minHeight: 56 }}>
                    <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 999, flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800,
                      background: done ? 'var(--positive)' : 'var(--surface-soft)', color: done ? '#fff' : 'var(--muted)', border: '1px solid var(--border)' }}>
                      {done ? '✓' : index + 1}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)' }}>{say(ep.titleKey)}</span>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>{say(ep.canDoNameKey)}</span>
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: done ? 'var(--positive-deep)' : 'var(--muted)', flexShrink: 0 }}>
                      {done ? t('courseLessonDone') : open ? t('courseMinutes', { minutes: ep.estimatedMinutes }) : t('courseLessonLocked')}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
      </div>
    </div>
  )
}
