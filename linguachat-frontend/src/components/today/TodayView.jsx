import { useApp } from '../../context/AppContext'
import { getTodayPhrase, MOCK_STATS, LAST_MISTAKES } from '../../data/mockData'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { getMissionForToday } from '../../services/missions'
import { getLocalizedMeaning } from '../../services/learningContent'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { ARC, getEpisode } from '../../learning/episodes/index.js'
import { planDay, arcProgress } from '../../learning/engine/planner.js'
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
  const arc = arcProgress(loadLearnerModel(), ARC)
  // The recommended session for today. Read-only here: the plan is deterministic,
  // so this preview is exactly what beginSession will store — and rendering it
  // never writes state.
  const session = dailySession || previewSession()
  const headline = sessionHeadline(session)
  const sessionEpisode = headline?.episodeId ? getEpisode(headline.episodeId) : null
  const sessionStarted = session.status === 'active'
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
