import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { getTodayPhrase, MOCK_STATS, LAST_MISTAKES } from '../../data/mockData'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { getMissionForToday } from '../../services/missions'
import { getLocalizedMeaning } from '../../services/localizedMeaning'
import { ChattoMascot } from '../mascot/ChattoMascot'
// Home names episodes and shows their keys; it never renders their content
import { EPISODE_SKELETON as ARC, SKELETON_BY_ID } from '../../learning/curriculum/preA1Skeleton.generated.js'

const getEpisode = (id) => SKELETON_BY_ID[id] || null
import { planDay, arcProgress } from '../../learning/engine/planner.js'
import { derivePreA1Readiness, readinessFocus } from '../../learning/curriculum/readiness.js'
import { preA1Status } from '../../learning/curriculum/graduation.js'

/*
 * Whether this browser has already shown the graduation moment. It is UI state
 * on purpose: a learner's English does not depend on which device they opened,
 * and putting it in the milestone would make a pedagogical record answer to a
 * render.
 */
const CELEBRATION_KEY = 'lc2-pre-a1-celebrated'
import { DurationPicker } from '../session/DurationPicker'
import { sessionHasReview, sessionHeadline, sessionProgress } from '../../learning/engine/session.js'
import { loadLearnerModel } from '../../learning/engine/learnerModel.js'

function StatPill({ label, value, color }) {
  return (
    <div className="card-lift flex flex-col items-center justify-center py-3 px-4 rounded-2xl"
      style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
      <p style={{ fontWeight: 800, fontSize: '1.25rem', color }}>{value}</p>
      <p style={{ fontSize: 11, color: 'var(--ink-muted)', fontWeight: 500 }}>{label}</p>
    </div>
  )
}

export function TodayView() {
  const { navigateTo, profile, t, nativeLanguageInfo, interfaceLanguageInfo, startPracticeMission, activeMissionDetails, completedMissions, episodeArcVersion, startEpisode,
    dailySession, previewSession, beginSession } = useApp()
  const plan = planDay(loadLearnerModel(), ARC)
  const planEpisode = plan.episodeId ? getEpisode(plan.episodeId) : null
  /*
   * Once every episode is done there is no card to point at, and the honest
   * thing to show is where the learner stands: the road is finished, and
   * whether the language is theirs yet is a separate question with a separate
   * answer. Derived here, never stored, and never shown as a score.
   */
  const readiness = useMemo(() => derivePreA1Readiness(loadLearnerModel()), [episodeArcVersion])
  /*
   * Graduated, consolidating, or still on the road. `graduated` is a fact about
   * a moment that happened; the other two describe today, so only they move.
   */
  const levelState = useMemo(() => preA1Status(loadLearnerModel()).state, [episodeArcVersion])
  const graduated = levelState === 'graduated'
  const milestone = useMemo(() => preA1Status(loadLearnerModel()).milestone, [episodeArcVersion])
  /*
   * Seeing the celebration is a fact about this browser, not about the learner's
   * English — so it is kept here and never written into the milestone, which
   * would make a pedagogical record depend on whether a screen had rendered.
   */
  const [celebrating, setCelebrating] = useState(false)
  const celebrationClaimed = useRef(false)
  useEffect(() => {
    if (!graduated || celebrationClaimed.current) return
    celebrationClaimed.current = true
    try {
      if (localStorage.getItem(CELEBRATION_KEY) === '1') return
      localStorage.setItem(CELEBRATION_KEY, '1')
    } catch { return /* private mode: say nothing rather than say it twice */ }
    setCelebrating(true)
  }, [graduated])
  const graduatedOn = useMemo(() => {
    if (!milestone?.graduatedAt) return null
    try {
      return new Intl.DateTimeFormat(interfaceLanguageInfo?.code || nativeLanguageInfo?.code || 'en',
        { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(milestone.graduatedAt))
    } catch { return new Date(milestone.graduatedAt).toISOString().slice(0, 10) }
  }, [milestone, interfaceLanguageInfo, nativeLanguageInfo])
  const focus = readinessFocus(readiness)
  const focusLine = !focus ? null
    : focus.kind === 'strengthen_skill' ? t('preA1FocusSkill').replace('{skill}', t((ARC.find(e => e.canDoId === focus.canDoId) || {}).canDoNameKey || 'preA1LevelBadge'))
      : focus.kind === 'catch_up_reviews' ? t('preA1FocusReviews')
        : focus.kind === 'have_a_conversation' ? t('preA1FocusConversation')
          : focus.kind === 'finish_curriculum' ? t('preA1FocusFinish') : null
  const arc = arcProgress(loadLearnerModel(), ARC)
  // The recommended session for today. Read-only here: the plan is deterministic,
  // so this preview is exactly what beginSession will store — and rendering it
  // never writes state.
  const session = dailySession || previewSession()
  const headline = sessionHeadline(session)
  const sessionEpisode = headline?.episodeId ? getEpisode(headline.episodeId) : null
  const sessionStarted = session.status === 'active'
  // A localized topic name, or nothing at all when the session has no subject
  // matter to promise. Learners never see the interest id itself.
  /*
   * Today's promise, in one of three voices: something the learner told Lingua,
   * something they chose at onboarding, or simply an everyday situation. Never
   * the same formula every day, and never an id or a reason.
   */
  const topicLine = (() => {
    const topic = session.topic || {}
    if (topic.source === 'fact' && topic.factValue) return t('sessionTopicRemembered', { topic: topic.factValue })
    // kept exactly as the locale writes it — German capitalises its nouns
    if (topic.labelKey) return t('sessionTopicToday', { topic: t(topic.labelKey) })
    return null
  })()
  const { done: sessionDone, total: sessionTotal } = sessionProgress(session)
  const phrase = getTodayPhrase()
  const mission = activeMissionDetails?.mission || getMissionForToday(profile.level, profile.goal)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('goodMorning') : hour < 18 ? t('goodAfternoon') : t('goodEvening')

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8" style={{ background: 'var(--bg-main)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Greeting */}
        <div className="flex items-start justify-between mb-8 animate-fade-up">
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 6 }}>
              {new Date().toLocaleDateString(interfaceLanguageInfo.code || 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: 'var(--ink)', lineHeight: 1.1 }}>
              {greeting},<br />
              <span className="gradient-text">{profile.name || 'friend'}</span>
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--ink-muted)', marginTop: 8, lineHeight: 1.5 }}>
              {MOCK_STATS.streak} {t('dayStreak')}. {t('keepGoing')}
            </p>
          </div>
          <div className="card-lift flex items-center gap-2 px-3 py-2 rounded-2xl"
            style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
            <span className="animate-glow-breathe" style={{ fontSize: 20, display: 'inline-block' }}>🔥</span>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--coral)' }}>{MOCK_STATS.streak}</span>
          </div>
        </div>

        {/* Today's adaptive session — the main promise of the day */}
        <div className="rounded-3xl p-5 mb-6 animate-fade-up" style={{ background: 'linear-gradient(135deg, var(--violet-soft), var(--blue-soft))', border: '1.5px solid var(--violet)' }}>
          <div className="flex items-center gap-4">
            <ChattoMascot mood="welcoming" size={52} decorative intensity="ambient" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--violet)' }}>
                {t('sessionBadge')} · {arc.completed}/{arc.total}{sessionHasReview(session) ? ` · ${t('planReviewTag')}` : ''}
              </p>
              <p lang={nativeLanguageInfo.base} style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.25, marginTop: 2 }}>
                {sessionEpisode ? t(sessionEpisode.titleKey) : t('sessionFreeChatTitle')}
              </p>
              <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.45, marginTop: 3 }}>
                {sessionEpisode ? t(sessionEpisode.goalKey) : t('sessionFreeChatBody')}
              </p>
              {/* Today's subject matter, in plain words. Never an id, never a
                  score, never the reason it was chosen. It comes from the
                  stored plan, so it cannot drift while the session is running. */}
              {topicLine && (
                <p lang={interfaceLanguageInfo.base} style={{ fontSize: '0.8125rem', color: 'var(--ink)', fontWeight: 700, marginTop: 5 }}>
                  {topicLine}
                </p>
              )}
              <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.75rem', color: 'var(--violet)', fontWeight: 700, marginTop: 6 }}>
                {t(`sessionDuration_${session.durationMode}`)} · {t('sessionMinutes', { minutes: session.estimatedMinutes })}
              </p>
            </div>
          </div>

          {sessionStarted && (
            <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 700, marginTop: 12 }}>
              {t('sessionStepOf', { done: Math.min(sessionDone + 1, sessionTotal), total: sessionTotal })}
            </p>
          )}

          <button type="button" onClick={beginSession}
            className="cta-glow w-full mt-4 py-3 rounded-2xl font-bold text-white text-sm transition-all hover:-translate-y-px active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, var(--violet), var(--blue))', '--cta-ring': 'rgba(124,92,255,0.18)' }}>
            {sessionStarted ? t('sessionContinueCta') : t('sessionStartCta')}
          </button>

          <div className="mt-3">
            <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: 6 }}>
              {sessionStarted ? t('sessionDurationLockedHint') : t('sessionDurationLabel')}
            </p>
            <DurationPicker disabled={sessionStarted} />
          </div>
        </div>

        {/* The road is finished: say so, and say what is still worth doing */}
        {!planEpisode && readiness.curriculumComplete && (
          <div className="card-lift w-full rounded-3xl p-5 mb-6 flex items-center gap-4 animate-fade-up"
            style={{ animationDelay: '0.02s', background: 'linear-gradient(135deg, var(--violet-soft), var(--blue-soft))', border: '1.5px solid var(--violet)' }}>
            <ChattoMascot mood={graduated || readiness.ready ? 'celebrate' : 'welcoming'} size={56}
              decorative intensity={celebrating ? 'lively' : 'ambient'} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--violet)' }}>
                {t('preA1LevelBadge')} · {arc.completed}/{arc.total}
              </p>
              <p lang={nativeLanguageInfo.base} style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.25, marginTop: 2 }}>
                {graduated ? t('preA1GraduatedTitle') : readiness.ready ? t('preA1ReadyTitle') : t('preA1DoneTitle')}
              </p>
              <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.45, marginTop: 3 }}>
                {graduated ? t('preA1GraduatedBody') : readiness.ready ? t('preA1ReadyBody') : t('preA1DoneBody')}
              </p>
              {graduated && graduatedOn && (
                <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--violet)', marginTop: 5 }}>
                  {t('preA1GraduatedOn').replace('{date}', graduatedOn)}
                </p>
              )}
              {/*
                * Reviews falling due after graduating is practice, and is said as
                * practice. A graduate is never told they have become un-ready.
                */}
              {graduated && readiness.overdueReviews > 0 && (
                <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: 5 }}>
                  {t('preA1GraduatedReviewsDue')}
                </p>
              )}
              {graduated && celebrating && (
                <p role="status" lang={nativeLanguageInfo.base}
                  style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--violet)', marginTop: 6 }}>
                  {t('preA1CelebrationNote')}
                </p>
              )}
              {!graduated && !readiness.ready && focusLine && (
                <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--violet)', marginTop: 6 }}>{focusLine}</p>
              )}
            </div>
          </div>
        )}

        {/* Direct access to the planned episode is still available */}
        {planEpisode && (
          <button type="button" onClick={() => startEpisode(planEpisode.id)}
            className="card-lift w-full text-left rounded-3xl p-5 mb-6 flex items-center gap-4 animate-fade-up transition-all active:scale-[0.99]"
            style={{ animationDelay: '0.02s', background: 'linear-gradient(135deg, var(--violet-soft), var(--blue-soft))', border: '1.5px solid var(--violet)' }}>
            <ChattoMascot mood="welcoming" size={56} decorative intensity="ambient" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--violet)' }}>
                {t('planTodayBadge')} · {arc.completed}/{arc.total}{plan.hasReview ? ` · ${t('planReviewTag')}` : ''}
              </p>
              <p style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.25, marginTop: 2 }}>
                {plan.type === 'continue_episode' ? `${t('ep1ContinuePrefix')}: ${t(planEpisode.titleKey)}` : t(planEpisode.titleKey)}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.45, marginTop: 3 }}>{t(planEpisode.goalKey)}</p>
              <div className="flex items-center gap-2 mt-2">
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--violet)', background: 'var(--bg-paper)', border: '1px solid var(--violet)', borderRadius: 999, padding: '2px 8px' }}>{planEpisode.level}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', background: 'var(--bg-paper)', border: '1px solid var(--blue)', borderRadius: 999, padding: '2px 8px' }}>{t(planEpisode.durationKey)}</span>
              </div>
            </div>
            <span aria-hidden="true" style={{ fontSize: '1.3rem', color: 'var(--violet)', flexShrink: 0 }}>→</span>
          </button>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-up" style={{ animationDelay: '0.04s' }}>
          <StatPill label={t('today')} value={`${MOCK_STATS.minutesToday}m`} color="var(--blue)" />
          <StatPill label={t('words')} value={MOCK_STATS.wordsLearned} color="var(--green)" />
          <StatPill label={t('confidence')} value={`${MOCK_STATS.confidence}%`} color="var(--violet)" />
        </div>

        {/* Today's Mission */}
        <div className="mission-card card-lift p-5 mb-6 animate-fade-up" style={{ animationDelay: '0.08s' }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--coral)' }}>
                {t('todaysMission')}
              </span>
              <h2 style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--ink)', marginTop: 4, lineHeight: 1.3 }}>
                {mission.titleKey ? t(mission.titleKey) : mission.title}
              </h2>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, background: 'var(--coral)', color: '#fff',
              padding: '3px 10px', borderRadius: 999, flexShrink: 0,
            }}>
              +{mission.rewardXp} XP
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 16 }}>
            {mission.descKey ? t(mission.descKey) : mission.description}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--violet)', background: 'var(--violet-soft)', border: '1px solid var(--violet)', borderRadius: 999, padding: '2px 8px' }}>
              {mission.levelRange.join('-')}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', background: 'var(--blue-soft)', border: '1px solid var(--blue)', borderRadius: 999, padding: '2px 8px' }}>
              {mission.estimatedTime}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', background: 'var(--green-soft)', border: '1px solid var(--green)', borderRadius: 999, padding: '2px 8px' }}>
              {mission.skillKey ? t(mission.skillKey) : mission.targetSkill}
            </span>
          </div>
          <button
            onClick={() => activeMissionDetails ? navigateTo('practice') : startPracticeMission(mission)}
            className="cta-glow group w-full py-3 rounded-2xl font-bold text-white text-sm transition-all hover:opacity-95 hover:-translate-y-px active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, var(--coral) 0%, var(--yellow) 100%)', '--cta-ring': 'rgba(249,115,91,0.20)' }}
          >
            <span>{activeMissionDetails ? t('continueMission') : t('startTodaysPractice')}</span>
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" style={{ fontSize: '1.05em' }}>→</span>
          </button>
        </div>

        {/* Phrase of the day */}
        <div className="card-lift rounded-2xl p-5 mb-6 animate-fade-up" style={{
          animationDelay: '0.12s',
          background: 'var(--bg-paper)',
          border: '1px solid var(--border)',
        }}>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: 16 }}>💡</span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--yellow)' }}>
              {t('phraseOfDay')}
            </span>
          </div>
          <p lang="en" dir="ltr" style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', fontStyle: 'italic', marginBottom: 6 }}>
            "{phrase.phrase}"
          </p>
          <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
            {getLocalizedMeaning(phrase.meaning, nativeLanguageInfo, interfaceLanguageInfo)}
          </p>
        </div>

        {/* Lingua intro + continue */}
        <div className="card-lift rounded-2xl p-5 mb-6 animate-fade-up" style={{
          animationDelay: '0.16s',
          background: 'var(--bg-paper)',
          border: '1px solid var(--border)',
        }}>
          <div className="flex items-center gap-3 mb-3">
            <LinguaAvatar size={42} online />
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>{t('linguaReady')}</p>
              <p style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500 }}>{t('onlineNow')}</p>
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 14 }}>
            "{t('linguaReadyQuote')}"
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigateTo('practice')}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--violet)' }}
            >
              {t('openPracticeRoom')}
            </button>
            <button
              onClick={() => navigateTo('practice')}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-80 active:scale-[0.98]"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}
            >
              {t('reviewMistakes')}
            </button>
          </div>
          {completedMissions.length > 0 && (
            <p style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, marginTop: 10 }}>
              {completedMissions.length} {t('completedMissions').toLowerCase()}
            </p>
          )}
        </div>

        {/* Last mistake */}
        {LAST_MISTAKES[0] && (
          <div className="card-lift rounded-2xl p-5 animate-fade-up" style={{
            animationDelay: '0.20s',
            background: 'var(--bg-paper)', border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', display: 'block', marginBottom: 10 }}>
              {t('lastMistakeFixed')}
            </span>
            <div className="flex items-center gap-3">
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', textDecoration: 'line-through', marginBottom: 2 }}>
                  "{LAST_MISTAKES[0].original}"
                </p>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--green)' }}>
                  "{LAST_MISTAKES[0].fixed}"
                </p>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, background: 'var(--green-soft)',
                color: 'var(--green)', border: '1px solid var(--green)',
                padding: '3px 10px', borderRadius: 999,
              }}>
                {LAST_MISTAKES[0].topicKey ? t(LAST_MISTAKES[0].topicKey) : LAST_MISTAKES[0].topic}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
