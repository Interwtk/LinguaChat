import { useApp } from '../../context/AppContext'
import { ProgressMap } from '../progress/ProgressMap'
import { getMissionForToday } from '../../services/missions'
import { ChattoMascot } from '../mascot/ChattoMascot'
import { StreakFlame } from '../ui/StreakFlame'

export function JourneyRail({ onClose }) {
  const { profile, navigateTo, view, localProgress, t, startPracticeMission, activeMissionDetails, completedMissions } = useApp()
  const isMobileSheet = Boolean(onClose)
  const mission = activeMissionDetails?.mission || getMissionForToday(profile.level, profile.goal)
  /*
    * Every number here is this learner's own. A new learner sees zeros, which is
    * the truth and also the invitation; example figures used to stand in for them
    * and made the first screen a stranger's progress.
    */
  const xp = localProgress.xp || 0
  const xpNextLevel = Math.max(200, Math.ceil((xp + 1) / 200) * 200)
  const streak = localProgress.streak || 0
  const wordsLearned = (localProgress.learnedItems || []).length
  const sessionsTotal = (localProgress.sessions || []).length
  const minutesToday = localProgress.messagesSent > 0 ? Math.max(1, Math.ceil(localProgress.messagesSent * 1.5)) : 0
  const xpPercent = Math.round((xp / xpNextLevel) * 100)

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--surface)' }}>
      {/*
        * On a phone this panel is the whole sheet, so it carries a header. In the
        * desktop rail the product name and the learner are already above it, and
        * repeating them was the same brand twice inside 200 pixels.
        */}
      {isMobileSheet && (
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <ChattoMascot mood="happy" size={32} decorative={true} animated={false} />
            <div>
              <p className="font-display" style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)', lineHeight: 1.1 }}>{t('yourPath')}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{t('practiceEveryDay')}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={t('close')}
            style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {/* User + stats */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)' }}>
          {!isMobileSheet && (
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 12 }}>
              {t('yourProgress')}
            </p>
          )}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--ink)' }}>
                {profile.name || 'Learner'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span style={{
                  fontSize: 10, fontWeight: 700, background: 'var(--accent)',
                  color: '#fff', padding: '1px 7px', borderRadius: 999,
                }}>
                  {profile.level}
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{t('level')} 3</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5" style={{
              background: 'var(--accent-soft)', border: '1px solid var(--border)',
              borderRadius: 999, padding: '3px 10px 3px 6px',
            }}>
              <StreakFlame days={streak} size={20} />
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--accent-strong)' }}>
                {streak}
              </span>
            </div>
          </div>

          {/* XP bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>
                {xp} {t('xp')}
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                {xpNextLevel - xp} {t('toNextLevel')}
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
              <div
                className="xp-bar-fill"
                style={{
                  width: `${xpPercent}%`, height: '100%', borderRadius: 999,
                  background: 'var(--accent)',
                }}
              />
            </div>
          </div>
          {!isMobileSheet && (
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>
              {t('streak')}: <strong style={{ color: 'var(--accent)' }}>{streak}</strong>
            </p>
          )}
        </div>

        {/* Today's Mission */}
        {isMobileSheet && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 8 }}>
            {t('todaysMission')}
          </p>
          <div className="mission-card p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.4 }}>
                {mission.titleKey ? t(mission.titleKey) : mission.title}
              </p>
              <span style={{
                fontSize: 10, fontWeight: 700, background: 'var(--accent)', color: '#fff',
                padding: '2px 8px', borderRadius: 999, flexShrink: 0,
              }}>
                +{mission.rewardXp} XP
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12 }}>
              {mission.descKey ? t(mission.descKey) : mission.description}
            </p>
            <div className="flex gap-1.5 mb-3">
              {[mission.typeKey ? t(mission.typeKey) : mission.type, mission.skillKey ? t(mission.skillKey) : mission.targetSkill].map(tag => (
                <span key={tag} style={{
                  fontSize: 10, fontWeight: 600, background: 'var(--accent-soft)',
                  color: 'var(--accent)', padding: '2px 8px', borderRadius: 999,
                }}>
                  {tag}
                </span>
              ))}
            </div>
            <button
              onClick={() => activeMissionDetails ? navigateTo('practice') : startPracticeMission(mission)}
              className="w-full py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'var(--accent)' }}
            >
              {activeMissionDetails ? t('continueMission') : t('startMission')}
            </button>
          </div>
        </div>
        )}

        {/* Journey Map */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 10 }}>
            {isMobileSheet ? t('yourJourney') : t('path')}
          </p>
          <ProgressMap level={profile.level} />
        </div>

        {/* Explore navigation */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 8 }}>
            {t('explore')}
          </p>
          <div className="flex flex-col gap-1.5">
            {[
              {
                id: 'memory-garden', label: t('memoryGarden'),
                desc: `${wordsLearned} ${t('phrasesSaved')}`,
                color: 'var(--positive)', soft: 'var(--positive-soft)',
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12M12 12C12 8 8 4 4 4s0 8 8 8zM12 12c0-4 4-8 8-8s0 8-8 8z"/></svg>,
              },
              {
                id: 'archive', label: t('conversationArchive'),
                desc: `${sessionsTotal} ${t('sessionsRecorded')}`,
                color: 'var(--info)', soft: 'var(--info-soft)',
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
              },
              {
                id: 'identity', label: t('languageIdentity'),
                desc: t('learnerProfile'),
                color: 'var(--accent)', soft: 'var(--accent-soft)',
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
              },
              {
                id: 'pricing', label: t('plansTitle'),
                desc: t('plansDesc'),
                color: 'var(--accent)', soft: 'var(--accent-soft)',
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 5 5.6.8-4 3.9 1 5.6L12 14.7 6 17.3l1-5.6-4-3.9 5.6-.8z"/></svg>,
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
                    background: isActive ? item.soft : 'var(--surface-soft)',
                    border: `1px solid ${isActive ? item.color : 'var(--border)'}`,
                    color: isActive ? item.color : 'var(--muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: isActive ? 700 : 600, color: isActive ? item.color : 'var(--ink)', lineHeight: 1.2 }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{item.desc}</p>
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
          { label: t('today'), value: `${minutesToday}m`, color: 'var(--info)' },
          { label: t('words'), value: wordsLearned, color: 'var(--positive)' },
          { label: t('missions'), value: completedMissions.length || sessionsTotal, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} className="text-center py-2 rounded-xl" style={{ background: 'var(--surface-soft)', border: '1px solid var(--border)' }}>
            <p style={{ fontWeight: 800, fontSize: '1rem', color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
