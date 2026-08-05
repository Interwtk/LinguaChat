/*
 * episodeRuns — how an episode is being played THIS time.
 *
 * The same episode can be opened for very different reasons: the first time,
 * picking up where it was left, practising it again on purpose, arriving
 * through a session, or going back specifically to take the other option in
 * the little story. They all use the same shell and the same evaluation; what
 * changes is what the run may be rewarded for and what it is allowed to
 * overwrite.
 *
 * The rule the whole module exists to protect:
 *
 *     A first completion is rewarded once. Everything after it is practice —
 *     real practice, that can produce new evidence, but never a second prize.
 */
import { getEpisodeState, sanitizeRun, RUNS_PER_EPISODE } from './learnerModel.js'
import { dayKeyFor } from './session.js'
import { reconcileLevelMilestones } from '../curriculum/graduation.js'

export const RUN_FIRST = 'first_run'
export const RUN_RESUME = 'resume'
export const RUN_REPLAY = 'replay'
export const RUN_REVIEW = 'review'
export const RUN_BRANCH_REPLAY = 'branch_replay'

// Only a first completion may pay out. Everything else is practice.
export const runEarnsReward = (mode) => mode === RUN_FIRST || mode === RUN_RESUME

export function runsFor(model, episodeId) {
  return (model.episodeRuns || {})[episodeId] || []
}

/*
 * Decide, from the episode's own state, what kind of run this is. The caller
 * only says where it came from and whether the learner asked for the other
 * option — never what mode to use, so the mode cannot be faked.
 */
export function resolveRunMode(model, episodeId, { source = 'practice', wantsOtherBranch = false } = {}) {
  const state = getEpisodeState(model, episodeId)
  if (state.status === 'completed') {
    if (wantsOtherBranch) return RUN_BRANCH_REPLAY
    return source === 'daily_session' ? RUN_REVIEW : RUN_REPLAY
  }
  if (state.status === 'in_progress' && (state.stepIndex || 0) > 0) return RUN_RESUME
  return RUN_FIRST
}

/*
 * A run id that is stable for a given episode, day and attempt number, so a
 * remount or a reload rejoins the SAME run instead of inventing another one.
 * (Deliberately not random: two runs of one episode must be distinguishable
 * in a reproducible test.)
 */
export function makeRunId(model, episodeId, atMs = Date.now()) {
  const sameDay = runsFor(model, episodeId).filter(r => String(r.runId).includes(dayKeyFor(atMs))).length
  return `${episodeId}:${dayKeyFor(atMs)}:${sameDay + 1}`
}

/*
 * Start (or rejoin) a run. Reopening the same episode in the same mode on the
 * same day continues the existing active run rather than starting a second
 * one, so a breakpoint change or a reload never splits one practice in two.
 */
export function beginEpisodeRun(model, episodeId, { source = 'practice', wantsOtherBranch = false, branchPreference = null, atMs = Date.now() } = {}) {
  const mode = resolveRunMode(model, episodeId, { source, wantsOtherBranch })
  const active = sanitizeRun(model.activeRun)
  if (active && active.episodeId === episodeId && active.mode === mode && !active.completedAt) {
    return active
  }
  /*
   * Coming back to an episode already under way is the SAME attempt, even
   * though its mode changes from a first run to a resume. Carry what that
   * attempt had earned across — above all the support level, which must not be
   * derived a second time from a learner model that has moved on since. Losing
   * it made a learner who reloaded mid-episode start again from whatever the
   * evidence said at that moment rather than from where they actually were.
   */
  const continues = active && active.episodeId === episodeId && !active.completedAt
    && ((active.mode === RUN_FIRST && mode === RUN_RESUME) || (active.mode === RUN_RESUME && mode === RUN_FIRST))

  const run = sanitizeRun({
    runId: continues ? active.runId : makeRunId(model, episodeId, atMs),
    episodeId,
    mode,
    source,
    branchId: continues ? (branchPreference || active.branchId) : branchPreference,
    startedAt: continues ? active.startedAt : new Date(atMs).toISOString(),
    completedAt: null,
    independentEvidence: continues ? active.independentEvidence : false,
    assistanceUsed: continues ? active.assistanceUsed : 0,
    retriedSteps: continues ? active.retriedSteps : 0,
    formatsUsed: continues ? active.formatsUsed : [],
    rewarded: continues ? active.rewarded : false,
    scaffold: continues ? active.scaffold : null,
  })
  model.activeRun = run
  return run
}

export function updateActiveRun(model, patch) {
  const active = sanitizeRun(model.activeRun)
  if (!active) return null
  model.activeRun = sanitizeRun({ ...active, ...patch })
  return model.activeRun
}

/*
 * File a finished run into the history. Idempotent by run id: completing twice
 * (double tap, Back, a late remount) records one run, exactly as it records
 * one reward.
 */
export function completeEpisodeRun(model, { independentEvidence = false, branchId = null, rewarded = false, atMs = Date.now() } = {}) {
  const active = sanitizeRun(model.activeRun)
  if (!active) return null
  const finished = sanitizeRun({
    ...active,
    branchId: branchId || active.branchId,
    completedAt: new Date(atMs).toISOString(),
    independentEvidence: Boolean(independentEvidence || active.independentEvidence),
    rewarded: Boolean(rewarded),
  })
  model.episodeRuns = model.episodeRuns || {}
  const list = (model.episodeRuns[active.episodeId] || []).filter(r => r.runId !== finished.runId)
  model.episodeRuns[active.episodeId] = [...list, finished].slice(-RUNS_PER_EPISODE)
  model.activeRun = null
  /*
   * A finished run is the moment the learner's evidence changed, which is the
   * honest place to notice they have reached a milestone — not when a screen
   * next renders. Idempotent and silent: it records nothing unless the bar was
   * genuinely met, and never twice.
   */
  reconcileLevelMilestones(model, { atMs, source: 'episode_run' })
  return finished
}

/* ---- what the UI needs to know about a finished episode ---- */

export function timesPractised(model, episodeId) {
  return runsFor(model, episodeId).filter(r => r.completedAt).length
}

// Which outcomes of a branching episode the learner has actually seen — from
// the historic first run AND from any later practice.
export function branchesSeen(model, episodeId) {
  const seen = new Set()
  const historic = (model.facts || {})[`branch:${episodeId}`]
  if (historic) seen.add(historic)
  for (const run of runsFor(model, episodeId)) if (run.branchId) seen.add(run.branchId)
  return [...seen]
}

// The outcome of the most recent practice, or of the original story if this
// episode has not been practised again yet.
export function lastBranchPlayed(model, episodeId) {
  const played = runsFor(model, episodeId).filter(r => r.completedAt && r.branchId)
  if (played.length) return played[played.length - 1].branchId
  return (model.facts || {})[`branch:${episodeId}`] || null
}

/*
 * The outcome to steer a "try the other option" run towards. It never rewrites
 * the original story — the first decision stays exactly as the learner made it.
 *
 * An ending they have not seen comes first. Once both have been seen it
 * alternates away from whatever they did LAST, so the offer keeps meaning
 * something; comparing against the original decision instead would have pinned
 * the offer to one ending forever and made the first one unreachable again.
 */
export function otherBranch(model, episode) {
  const branches = episode?.story?.branches || []
  if (branches.length < 2) return null
  const unseen = branches.filter(b => !branchesSeen(model, episode.id).includes(b))
  if (unseen.length) return unseen[0]
  const last = lastBranchPlayed(model, episode.id)
  return branches.find(b => b !== last) || branches[0]
}

export const canTryOtherBranch = (model, episode) =>
  Boolean(otherBranch(model, episode)) && getEpisodeState(model, episode.id).status === 'completed'
