import { useApp } from '../../context/AppContext'
import { getTodayPhrase, MOCK_STATS, LAST_MISTAKES } from '../../data/mockData'
import { LinguaAvatar } from '../ui/LinguaAvatar'
import { getMissionForToday } from '../../services/missions'

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
  const { navigateTo, profile, t, nativeLanguage, startPracticeMission, activeMissionDetails, completedMissions } = useApp()
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
              {new Date().toLocaleDateString(nativeLanguage === 'es' ? 'es-CL' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
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
                {mission.title}
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
            {mission.description}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--violet)', background: 'var(--violet-soft)', border: '1px solid var(--violet)', borderRadius: 999, padding: '2px 8px' }}>
              {mission.levelRange.join('-')}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', background: 'var(--blue-soft)', border: '1px solid var(--blue)', borderRadius: 999, padding: '2px 8px' }}>
              {mission.estimatedTime}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', background: 'var(--green-soft)', border: '1px solid var(--green)', borderRadius: 999, padding: '2px 8px' }}>
              {mission.targetSkill}
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
          <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', fontStyle: 'italic', marginBottom: 6 }}>
            "{phrase.phrase}"
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
            {phrase.meaning}
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
                {LAST_MISTAKES[0].topic}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
