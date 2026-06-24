import { useApp } from '../../context/AppContext'
import { ProgressMap } from '../progress/ProgressMap'
import { MOCK_STATS } from '../../data/mockData'
import { getMissionForToday } from '../../services/missions'

export function JourneyRail({ onClose }) {
  const { profile, navigateTo, view, localProgress, t, startPracticeMission, activeMissionDetails, completedMissions } = useApp()
  const mission = activeMissionDetails?.mission || getMissionForToday(profile.level, profile.goal)
  const hasLocalProgress = localProgress.messagesSent > 0
  const xp = hasLocalProgress ? localProgress.xp : MOCK_STATS.xp
  const xpNextLevel = hasLocalProgress ? Math.max(200, Math.ceil((xp + 1) / 200) * 200) : MOCK_STATS.xpNextLevel
  const streak = hasLocalProgress ? localProgress.streak : MOCK_STATS.streak
  const wordsLearned = hasLocalProgress ? localProgress.learnedItems.length : MOCK_STATS.wordsLearned
  const sessionsTotal = hasLocalProgress ? localProgress.sessions.length : MOCK_STATS.sessionsTotal
  const minutesToday = hasLocalProgress ? Math.max(1, Math.ceil(localProgress.messagesSent * 1.5)) : MOCK_STATS.minutesToday
  const xpPercent = Math.round((xp / xpNextLevel) * 100)

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-paper)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          {/* Logo mark */}
          <div className="flex-shrink-0 flex items-center justify-center rounded-xl" style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, var(--violet) 0%, var(--blue) 100%)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                fill="rgba(255,255,255,0.3)" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--ink)', lineHeight: 1.1 }}>LinguaChat</p>
            <p style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 500 }}>{t('practiceEveryDay')}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
        {/* User + stats */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>
                {profile.name || 'Learner'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span style={{
                  fontSize: 10, fontWeight: 700, background: 'var(--violet)',
                  color: '#fff', padding: '1px 7px', borderRadius: 999,
                }}>
                  {profile.level}
                </span>
                <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>Level 3</span>
              </div>
            </div>
            <div className="flex items-center gap-1" style={{
              background: 'var(--coral-soft)', border: '1px solid var(--coral)',
              borderRadius: 999, padding: '4px 10px',
            }}>
              <span style={{ fontSize: 16 }}>🔥</span>
              <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--coral)' }}>
                {streak}
              </span>
            </div>
          </div>

          {/* XP bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-muted)' }}>
                {xp} XP
              </span>
              <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                {xpNextLevel - xp} {t('toNextLevel')}
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
              <div
                className="xp-bar-fill"
                style={{
                  width: `${xpPercent}%`, height: '100%', borderRadius: 999,
                  background: 'linear-gradient(90deg, var(--violet), var(--blue))',
                }}
              />
            </div>
          </div>
        </div>

        {/* Today's Mission */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 8 }}>
            {t('todaysMission')}
          </p>
          <div className="mission-card p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.4 }}>
                {mission.title}
              </p>
              <span style={{
                fontSize: 10, fontWeight: 700, background: 'var(--coral)', color: '#fff',
                padding: '2px 8px', borderRadius: 999, flexShrink: 0,
              }}>
                +{mission.rewardXp} XP
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', lineHeight: 1.5, marginBottom: 12 }}>
              {mission.description}
            </p>
            <div className="flex gap-1.5 mb-3">
              {[mission.type, mission.targetSkill].map(tag => (
                <span key={tag} style={{
                  fontSize: 10, fontWeight: 600, background: 'var(--coral-soft)',
                  color: 'var(--coral)', padding: '2px 8px', borderRadius: 999,
                }}>
                  {tag}
                </span>
              ))}
            </div>
            <button
              onClick={() => activeMissionDetails ? navigateTo('practice') : startPracticeMission(mission)}
              className="w-full py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--coral)' }}
            >
              {activeMissionDetails ? t('continueMission') : t('startMission')}
            </button>
          </div>
        </div>

        {/* Journey Map */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 10 }}>
            {t('yourJourney')}
          </p>
          <ProgressMap level={profile.level} />
        </div>

        {/* Explore navigation */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-muted)', marginBottom: 8 }}>
            {t('explore')}
          </p>
          <div className="flex flex-col gap-1.5">
            {[
              {
                id: 'memory-garden', label: t('memoryGarden'),
                desc: `${wordsLearned} ${t('phrasesSaved')}`,
                color: 'var(--green)', soft: 'var(--green-soft)',
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12M12 12C12 8 8 4 4 4s0 8 8 8zM12 12c0-4 4-8 8-8s0 8-8 8z"/></svg>,
              },
              {
                id: 'archive', label: t('conversationArchive'),
                desc: `${sessionsTotal} ${t('sessionsRecorded')}`,
                color: 'var(--blue)', soft: 'var(--blue-soft)',
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
              },
              {
                id: 'identity', label: t('languageIdentity'),
                desc: t('learnerProfile'),
                color: 'var(--violet)', soft: 'var(--violet-soft)',
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
              },
            ].map(item => {
              const isActive = view === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left w-full transition-all"
                  style={{
                    background: isActive ? item.soft : 'transparent',
                    border: `1px solid ${isActive ? item.color : 'transparent'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                    background: isActive ? item.soft : 'var(--bg-elevated)',
                    border: `1px solid ${isActive ? item.color : 'var(--border)'}`,
                    color: isActive ? item.color : 'var(--ink-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: isActive ? 700 : 600, color: isActive ? item.color : 'var(--ink)', lineHeight: 1.2 }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 1 }}>{item.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="px-5 py-4 grid grid-cols-3 gap-2" style={{ borderTop: '1px solid var(--border)' }}>
        {[
          { label: t('today'), value: `${minutesToday}m`, color: 'var(--blue)' },
          { label: 'Phrases', value: wordsLearned, color: 'var(--green)' },
          { label: t('completedMissions'), value: completedMissions.length || sessionsTotal, color: 'var(--violet)' },
        ].map(s => (
          <div key={s.label} className="text-center py-2 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <p style={{ fontWeight: 800, fontSize: '1rem', color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 10, color: 'var(--ink-muted)', fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
