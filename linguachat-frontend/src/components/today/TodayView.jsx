import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { getTodayPhrase } from '../../data/mockData'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { getMissionForToday } from '../../services/missions'
import { getLocalizedMeaning } from '../../services/localizedMeaning'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { StreakFlame } from '../ui/StreakFlame'
// Home names episodes and shows their keys; it never renders their content
import { SKELETON_BY_ID } from '../../learning/curriculum/preA1Skeleton.generated.js'
import { PRE_A1, episodesOfLevel } from '../../learning/curriculum/levels.js'

/*
 * The level Home is about. Progress, the next episode and the completion card all
 * describe one level: with A1 in the curriculum an unfiltered list would show a
 * learner 17/38 and offer them an episode from a level they cannot open.
 */
const ARC = episodesOfLevel(PRE_A1)

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

/*
 * HOME ANSWERS THREE QUESTIONS, IN THIS ORDER: what do I do today, how is it
 * going, and what did Lingua last help me with. Everything below is one of those
 * three; nothing on this screen is a widget for its own sake.
 *
 * Every number comes from real state — the streak from local progress, the words
 * from the learner model, the episodes from the planner. The mockup's "12 days"
 * and "76 words" were example data and are treated as such.
 */

/* One number and its name. Three of them, on one line, and no percentages. */
function StatCell({ value, unit, label }) {
  return (
    <div className="flex flex-col items-center justify-center py-3 px-2 text-center">
      <p className="font-display" style={{ fontWeight: 700, fontSize: '1.3rem', color: 'var(--ink)', lineHeight: 1.1 }}>
        {value}
        {unit && <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--muted)' }}> {unit}</span>}
      </p>
      <p style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500, marginTop: 2 }}>{label}</p>
    </div>
  )
}

/* A small window for a secondary thing: today's challenge, the phrase, a note. */
function SmallWindow({ eyebrow, children, tone = 'paper', className = '', style }) {
  const background = tone === 'accent' ? 'var(--accent-soft)'
    : tone === 'positive' ? 'var(--positive-soft)'
      : 'var(--surface)'
  return (
    <section
      className={`rounded-2xl p-4 ${className}`}
      style={{ background, border: '1px solid var(--border)', ...style }}
    >
      {eyebrow && <p className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</p>}
      {children}
    </section>
  )
}

export function TodayView({ onOpenPath }) {
  const { navigateTo, profile, t, nativeLanguageInfo, interfaceLanguageInfo, startPracticeMission, activeMissionDetails, completedMissions, episodeArcVersion, startEpisode,
    dailySession, previewSession, beginSession, localProgress, messages } = useApp()
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

  /*
   * REAL PROGRESS, NOT EXAMPLE DATA. The streak is what local progress recorded,
   * the words are what the learner model holds, the episodes are what the planner
   * counts. The mockup's numbers were illustrations.
   */
  const streak = localProgress?.streak ?? 0
  const wordCount = useMemo(() => Object.keys(loadLearnerModel().languageItems || {}).length, [episodeArcVersion])
  /*
   * The most recent thing Lingua helped fix, taken from the conversation itself:
   * what the learner wrote, and the version Lingua offered back. An internal
   * error id would be neither translated nor meaningful to a learner, so if no
   * correction has happened yet this block simply is not there.
   */
  const lastFix = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i]
      const corrected = message?.feedback?.correction
      if (!corrected) continue
      // the learner's own line is the closest preceding user message
      const original = messages.slice(0, i).reverse().find(m => m.role === 'user')?.text || null
      return { original, corrected, why: message.feedback.why || null }
    }
    return null
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-7 py-5 md:py-7" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* ─── 1. Where the learner is: the day, their name, the fire ─── */}
        <header className="flex items-start justify-between gap-4 mb-5 animate-fade-up">
          <div style={{ minWidth: 0 }}>
            <p className="eyebrow" style={{ marginBottom: 5 }}>
              {new Date().toLocaleDateString(interfaceLanguageInfo.code || 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="font-display" style={{ fontWeight: 700, fontSize: 'clamp(1.5rem, 5vw, 2.05rem)', color: 'var(--ink)', lineHeight: 1.08 }}>
              {greeting}{profile.name ? `, ${profile.name}` : ''}
            </h1>
            {/* What the learner said they came for, in their own words. */}
            {profile.goal && (
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: 6, lineHeight: 1.45 }}>
                {t('yourGoalIs', { goal: profile.goal })}
              </p>
            )}
          </div>
          {/* The streak: the flame carries the number, the number carries the meaning. */}
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
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, maxWidth: 108, textAlign: 'end' }}>
                {t('streakStartToday')}
              </p>
            )}
          </div>
        </header>

        {/* ─── 2. Lingua, present rather than hidden behind a button ─── */}
        <section className="rounded-2xl p-4 mb-4 animate-fade-up"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex items-center gap-3">
            <LinguaAvatar size={44} online />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>{t('linguaReady')}</p>
              <p style={{ fontSize: 12, color: 'var(--positive-deep)', fontWeight: 600 }}>{t('linguaOnline')}</p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('practice')}
              className="btn-quiet flex-shrink-0"
              style={{ minHeight: 40, padding: '9px 14px' }}
            >
              {t('linguaWriteTo')}
            </button>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5, marginTop: 10 }}>
            “{t('linguaReadyQuote')}”
          </p>
        </section>

        {/*
          * THERE IS NO "AT HAND" BOX HERE ANY MORE.
          *
          * A four-tile grid sat between Lingua and today's session. The design's own
          * Home (frame 2a) has no such block, and the screenshot audit showed what it
          * cost: it pushed the session — the one thing the screen is for — below the
          * fold and gave four secondary actions the same weight as the main CTA.
          *
          * Nothing it offered was lost, because none of it was only there:
          *   · continue / start the session → the filled CTA in the session card below
          *   · free practice               → Lingua's own card above, and the Chats tab
          *   · the words                   → the Palabras destination
          *   · the notes and the archive   → rows in Chats
          */}

        {/* ─── 3. Today's session: the main promise, and the main action ─── */}
        <section className="mission-card p-5 mb-4 animate-fade-up" style={{ animationDelay: '0.04s' }}>
          <div className="flex items-start gap-3.5">
            <ChattoMascot mood="welcoming" size={46} decorative intensity="ambient" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="eyebrow">
                {t('sessionTodayEyebrow')} · {arc.completed}/{arc.total}{sessionHasReview(session) ? ` · ${t('planReviewTag')}` : ''}
              </p>
              <h2 className="font-display" lang={nativeLanguageInfo.base}
                style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.25, marginTop: 3 }}>
                {sessionEpisode ? t(sessionEpisode.titleKey) : t('sessionFreeChatTitle')}
              </h2>
              <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5, marginTop: 4 }}>
                {sessionEpisode ? t(sessionEpisode.goalKey) : t('sessionFreeChatBody')}
              </p>
              {/* Today's subject matter, in plain words. Never an id, never a
                  score, never the reason it was chosen. It comes from the
                  stored plan, so it cannot drift while the session is running. */}
              {topicLine && (
                <p lang={interfaceLanguageInfo.base} style={{ fontSize: '0.8125rem', color: 'var(--accent-strong)', fontWeight: 700, marginTop: 6 }}>
                  {topicLine}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className="tool-chip" style={{ minHeight: 30, padding: '5px 11px', fontSize: 12 }}>
                  {t('sessionMinutes', { minutes: session.estimatedMinutes })}
                </span>
                <span className="tool-chip" style={{ minHeight: 30, padding: '5px 11px', fontSize: 12 }}>
                  {t(`sessionDuration_${session.durationMode}`)}
                </span>
                {sessionStarted && (
                  <span className="tool-chip" style={{ minHeight: 30, padding: '5px 11px', fontSize: 12, background: 'var(--accent-soft)', color: 'var(--accent-strong)' }}>
                    {t('sessionStepOf', { done: Math.min(sessionDone + 1, sessionTotal), total: sessionTotal })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button type="button" onClick={beginSession} className="btn-primary w-full mt-4">
            {sessionStarted ? t('sessionContinueCta') : t('sessionStartCta')}
          </button>

          <div className="mt-3">
            <p lang={nativeLanguageInfo.base} className="eyebrow" style={{ marginBottom: 6 }}>
              {sessionStarted ? t('sessionDurationLockedHint') : t('sessionDurationLabel')}
            </p>
            <DurationPicker disabled={sessionStarted} />
          </div>
        </section>

        {/* The road is finished: say so, and say what is still worth doing */}
        {!planEpisode && readiness.curriculumComplete && (
          <section className="rounded-2xl p-5 mb-4 flex items-start gap-4 animate-fade-up"
            style={{ animationDelay: '0.05s', background: 'var(--positive-soft)', border: '1px solid var(--positive)' }}>
            <ChattoMascot mood={graduated || readiness.ready ? 'celebrate' : 'welcoming'} size={50}
              decorative intensity={celebrating ? 'lively' : 'ambient'} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="eyebrow" style={{ color: 'var(--positive-deep)' }}>
                {t('preA1LevelBadge')} · {arc.completed}/{arc.total}
              </p>
              <h2 className="font-display" lang={nativeLanguageInfo.base}
                style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.25, marginTop: 3 }}>
                {graduated ? t('preA1GraduatedTitle') : readiness.ready ? t('preA1ReadyTitle') : t('preA1DoneTitle')}
              </h2>
              <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.5, marginTop: 4 }}>
                {graduated ? t('preA1GraduatedBody') : readiness.ready ? t('preA1ReadyBody') : t('preA1DoneBody')}
              </p>
              {graduated && graduatedOn && (
                <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--positive-deep)', marginTop: 5 }}>
                  {t('preA1GraduatedOn').replace('{date}', graduatedOn)}
                </p>
              )}
              {/*
                * Reviews falling due after graduating is practice, and is said as
                * practice. A graduate is never told they have become un-ready.
                */}
              {graduated && readiness.overdueReviews > 0 && (
                <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: 5 }}>
                  {t('preA1GraduatedReviewsDue')}
                </p>
              )}
              {graduated && celebrating && (
                <p role="status" lang={nativeLanguageInfo.base}
                  style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--positive-deep)', marginTop: 6 }}>
                  {t('preA1CelebrationNote')}
                </p>
              )}
              {!graduated && !readiness.ready && focusLine && (
                <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--positive-deep)', marginTop: 6 }}>{focusLine}</p>
              )}
            </div>
          </section>
        )}

        {/* Direct access to the planned episode is still available */}
        {planEpisode && (
          <button type="button" onClick={() => startEpisode(planEpisode.id)}
            className="card-lift w-full text-start rounded-2xl p-4 mb-4 flex items-center gap-3.5 animate-fade-up"
            style={{ animationDelay: '0.05s', background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="grid place-items-center rounded-xl flex-shrink-0"
              style={{ width: 38, height: 38, background: 'var(--accent-soft)', color: 'var(--accent-strong)' }} aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M8 5.5v13l10-6.5z"/></svg>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="eyebrow">
                {t('planTodayBadge')}{plan.hasReview ? ` · ${t('planReviewTag')}` : ''}
              </p>
              <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3, marginTop: 2 }}>
                {plan.type === 'continue_episode' ? `${t('ep1ContinuePrefix')}: ${t(planEpisode.titleKey)}` : t(planEpisode.titleKey)}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.45, marginTop: 2 }}>{t(planEpisode.goalKey)}</p>
            </div>
          </button>
        )}

        {/* ─── 4. Today's challenge and, on a laptop, the phrase beside it ─── */}
        <div className="grid gap-3 mb-4 animate-fade-up md:grid-cols-2" style={{ animationDelay: '0.06s' }}>
          <SmallWindow eyebrow={t('todaysMission')} tone="accent">
            <h3 className="font-display" style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', lineHeight: 1.3 }}>
              {mission.titleKey ? t(mission.titleKey) : mission.title}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5, marginTop: 4 }}>
              {mission.descKey ? t(mission.descKey) : mission.description}
            </p>
            <button
              type="button"
              onClick={() => activeMissionDetails ? navigateTo('practice') : startPracticeMission(mission)}
              className="btn-quiet mt-3"
              style={{ background: 'var(--surface)', minHeight: 40 }}
            >
              {activeMissionDetails ? t('continueMission') : t('startTodaysPractice')}
            </button>
          </SmallWindow>

          <SmallWindow eyebrow={t('phraseOfDay')}>
            <p lang="en" dir="ltr" className="font-display"
              style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', lineHeight: 1.35 }}>
              “{phrase.phrase}”
            </p>
            <p lang={nativeLanguageInfo.base} style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5, marginTop: 6 }}>
              {getLocalizedMeaning(phrase.meaning, nativeLanguageInfo)}
            </p>
          </SmallWindow>
        </div>

        {/* ─── 5. How it is going: three numbers, all of them real ─── */}
        <section className="rounded-2xl mb-4 grid grid-cols-3 animate-fade-up"
          style={{ animationDelay: '0.08s', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <StatCell value={arc.completed} unit={`/${arc.total}`} label={t('episodesLabel')} />
          <div style={{ borderInlineStart: '1px solid var(--border)', borderInlineEnd: '1px solid var(--border)' }}>
            <StatCell value={wordCount} label={t('yourWordsNav')} />
          </div>
          <StatCell value={completedMissions.length} label={t('completedMissions')} />
        </section>

        {/* ─── 6. Secondary: the last thing Lingua helped fix, and the path ─── */}
        {lastFix && (
          <SmallWindow eyebrow={t('lastFixed')} className="mb-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {lastFix.original && (
              <p lang="en" dir="ltr" className="correction-quote" style={{ fontSize: '0.8125rem' }}>
                {lastFix.original}
              </p>
            )}
            <p lang="en" dir="ltr" className="correction-natural" style={{ fontSize: '0.9375rem', marginTop: 3 }}>
              {lastFix.corrected}
            </p>
          </SmallWindow>
        )}

        {/* On a phone the path is a sheet; on a laptop it is already in the rail. */}
        {onOpenPath && (
          <button type="button" onClick={onOpenPath} className="btn-quiet w-full animate-fade-up"
            style={{ animationDelay: '0.12s' }}>
            {t('openPath')}
          </button>
        )}
      </div>
    </div>
  )
}
