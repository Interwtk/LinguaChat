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
import { ACTIVITY_FORMATS, getEpisodeState, sanitizeRun, sanitizeEpisodeRuns, recordDelayedRetrievalEvidence, recordCanDoAttempt } from './learnerModel.js'
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
  const day = dayKeyFor(atMs)
  const prefix = `${episodeId}:${day}:`
  // The run history is capped at 12. Counting retained runs would reuse the
  // thirteenth id forever and overwrite genuine later practice evidence.
  // Keep the highest retained sequence instead; the newest run survives trim.
  // A partially persisted completion can leave the episode marked completed
  // while an older tab still holds the first run as active, with no filed
  // history yet. Reserve that active ID too: switching to replay must never
  // reuse it and later mistake two distinct attempts for the same evidence.
  const candidates = [...runsFor(model, episodeId)]
  const active = sanitizeRun(model.activeRun)
  if (active?.episodeId === episodeId) candidates.push(active)
  const highest = candidates.reduce((max, run) => {
    const id = String(run.runId || '')
    if (!id.startsWith(prefix)) return max
    const suffix = id.slice(prefix.length)
    if (!/^[1-9]\d*$/.test(suffix)) return max
    const sequence = Number(suffix)
    return Number.isSafeInteger(sequence) ? Math.max(max, sequence) : max
  }, 0)
  return `${prefix}${highest + 1}`
}

/*
 * Start (or rejoin) a run. Reopening the same episode in the same mode on the
 * same day continues the existing active run rather than starting a second
 * one, so a breakpoint change or a reload never splits one practice in two.
 */
export function beginEpisodeRun(model, episodeId, { source = 'practice', wantsOtherBranch = false, branchPreference = null, atMs = Date.now() } = {}) {
  const mode = resolveRunMode(model, episodeId, { source, wantsOtherBranch })
  let active = sanitizeRun(model.activeRun)
  // A restored tab may carry a stale active pointer even after another copy
  // filed this exact run. Never rejoin that finished attempt or overwrite its
  // history/evidence with a new practice using the same runId.
  if (active && runsFor(model, active.episodeId).some(r => r.runId === active.runId && r.completedAt)) {
    model.activeRun = null
    active = null
  }
  // An unfinished run belongs to the local calendar day it started on.
  // Resuming the episode tomorrow preserves its step progress, but must not
  // reuse yesterday's run ID, assistance or independent-evidence counters.
  // Missing/invalid legacy timestamps are not proof of a same-day attempt.
  const startedAtMs = active ? Date.parse(active.startedAt) : NaN
  const sameDay = Number.isFinite(startedAtMs) && dayKeyFor(startedAtMs) === dayKeyFor(atMs)
  if (active && sameDay && active.episodeId === episodeId && active.mode === mode && !active.completedAt) {
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
  const continues = active && sameDay && active.episodeId === episodeId && !active.completedAt
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
    signalKeys: continues ? active.signalKeys : [],
    rewarded: continues ? active.rewarded : false,
    scaffold: continues ? active.scaffold : null,
    pendingRetrieval: continues ? active.pendingRetrieval : [],
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
 * Daily activity-preference signals are counted once per step/day, across
 * replays. That global dedupe must NOT suppress help or retries in a different
 * run of the same episode on the same day.
 *
 * Track a bounded set of per-run step/action markers. They survive same-day
 * reloads but reset on a new run/day; no learner answers are stored.
 * Returns null for duplicate/invalid signals so callers can skip the write.
 */
export function recordRunActivitySignal(model, { kind, format, key } = {}) {
  const active = sanitizeRun(model.activeRun)
  if (!active || active.completedAt || !ACTIVITY_FORMATS.includes(format)) return null
  if (!['completed', 'assistance', 'retried', 'negative_soft'].includes(kind)) return null
  if (typeof key !== 'string' || !/^\d{1,4}(?::alt)?:(?:completed|assistance|retried|switched)$/.test(key)) return null
  if (key.split(':').at(-1) !== (kind === 'negative_soft' ? 'switched' : kind)) return null
  if (active.signalKeys.includes(key)) return null
  const patch = {
    signalKeys: [...active.signalKeys, key].slice(-100),
    formatsUsed: [...new Set([...active.formatsUsed, format])],
  }
  if (kind === 'assistance') patch.assistanceUsed = active.assistanceUsed + 1
  if (kind === 'retried') patch.retriedSteps = active.retriedSteps + 1
  return updateActiveRun(model, patch)
}

// Pending observations belong to this run, never to earned can-do evidence.
export function stageDelayedRetrieval(model, canDoIds, { independent = false, sessionId = null, atMs = Date.now() } = {}) {
  const active = sanitizeRun(model.activeRun)
  if (!active || active.completedAt || !independent || !sessionId) return active
  const pending = [...active.pendingRetrieval]
  for (const canDoId of Array.isArray(canDoIds) ? canDoIds : []) {
    if (!canDoId || pending.some(p => p.canDoId === canDoId && p.sessionId === sessionId)) continue
    pending.push({ canDoId, sessionId, atMs })
  }
  return updateActiveRun(model, { pendingRetrieval: pending })
}

/*
 * File a finished run into the history. Idempotent by run id: completing twice
 * (double tap, Back, a late remount) records one run, exactly as it records
 * one reward.
 */
export function completeEpisodeRun(model, { independentEvidence = false, branchId = null, rewarded = false, atMs = Date.now(), canDoId = null, sessionId = null } = {}) {
  const active = sanitizeRun(model.activeRun)
  if (!active) return null
  // Clearing activeRun after completion only protects a single in-memory
  // instance. A stale tab or reconciled snapshot can restore the same pointer
  // alongside its already-filed history. Check BEFORE recording can-do or
  // delayed-retrieval evidence, not merely before replacing the history row.
  const filed = runsFor(model, active.episodeId).find(r => r.runId === active.runId && r.completedAt)
  if (filed) {
    model.activeRun = null
    return filed
  }
  if (active.completedAt) {
    model.activeRun = null
    return null
  }
  for (const observation of active.pendingRetrieval) {
    recordDelayedRetrievalEvidence(model, [observation.canDoId], { ...observation, independent: true })
  }
  if (canDoId) recordCanDoAttempt(model, canDoId, {
    success: true, independent: Boolean(independentEvidence || active.independentEvidence),
    context: active.episodeId, atMs, sessionId,
  })
  const finished = sanitizeRun({
    ...active,
    branchId: branchId || active.branchId,
    completedAt: new Date(atMs).toISOString(),
    pendingRetrieval: [],
    independentEvidence: Boolean(independentEvidence || active.independentEvidence),
    rewarded: Boolean(rewarded),
  })
  model.episodeRuns = model.episodeRuns || {}
  const list = (model.episodeRuns[active.episodeId] || []).filter(r => r.runId !== finished.runId)
  // A late/stale-tab completion may have started before all retained runs.
  // Apply the same chronological cap as migration and snapshot reconciliation;
  // append order is not evidence of when a practice actually happened.
  model.episodeRuns[active.episodeId] = sanitizeEpisodeRuns({
    [active.episodeId]: [...list, finished],
  })[active.episodeId] || []
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
