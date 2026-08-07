import { useApp } from '../../context/AppContext'
import { PRE_A1, episodesOfLevel } from '../../learning/curriculum/levels.js'

/* one level's episodes: a replay list must not offer another level's content */
const ARC = episodesOfLevel(PRE_A1)
import { getEpisodeState, loadLearnerModel } from '../../learning/engine/learnerModel.js'
import { timesPractised, canTryOtherBranch } from '../../learning/engine/episodeRuns.js'

/*
 * What you can already do — and a way back in.
 *
 * A finished episode used to be unreachable: the only door into an episode was
 * the one the planner opened next, so nobody could ever practise something
 * again. This lists what the learner has completed and offers to play it once
 * more. It leads with the capability, not the reward, because replaying is
 * about keeping something alive, not about collecting XP again (and it does
 * not pay out a second time).
 */
export function CompletedEpisodes() {
  const { t, startEpisode, episodeArcVersion, nativeLanguageInfo } = useApp()
  const model = loadLearnerModel()
  const nativeLang = nativeLanguageInfo.base
  const done = ARC.filter(ep => getEpisodeState(model, ep.id).status === 'completed')
  if (!done.length) return null

  return (
    <section className="mb-5 animate-fade-up" aria-labelledby="completed-episodes-title" key={episodeArcVersion}>
      <p id="completed-episodes-title" lang={nativeLang}
        style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)', marginBottom: 8 }}>
        {t('replaySectionTitle')}
      </p>
      <ul className="flex flex-col gap-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {done.map(ep => {
          const played = timesPractised(model, ep.id)
          const otherOption = canTryOtherBranch(model, ep)
          return (
            <li key={ep.id} className="rounded-2xl p-3.5"
              style={{ background: 'var(--bg-paper)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p lang={nativeLang} style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.25 }}>
                    {t(ep.canDoNameKey)}
                  </p>
                  <p lang={nativeLang} style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 2 }}>
                    {t('replayCompletedTag')} · {t(ep.durationKey)}
                    {played > 0 ? ` · ${t('replayTimesPractised', { count: played })}` : ''}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => startEpisode(ep.id, { source: 'practice' })}
                    className="rounded-full px-3.5 py-2 text-xs font-bold transition-all active:scale-[0.98]"
                    style={{ background: 'var(--violet-soft)', border: '1.5px solid var(--violet)', color: 'var(--violet)', minHeight: 40 }}>
                    <span lang={nativeLang}>{t('replayPractiseAgain')}</span>
                  </button>
                  {otherOption && (
                    <button type="button" onClick={() => startEpisode(ep.id, { source: 'practice', wantsOtherBranch: true })}
                      className="rounded-full px-3.5 py-2 text-xs font-bold transition-all active:scale-[0.98]"
                      style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', color: 'var(--ink)', minHeight: 40 }}>
                      <span lang={nativeLang}>{t('replayTryOtherOption')}</span>
                    </button>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default CompletedEpisodes
