/*
 * The daily session of a course other than English (today: Spanish).
 *
 * Same contract as the English session (engine/session.js): a small,
 * deterministic plan built once per day and duration from what the learner
 * model already knows, persisted per writer so a reload resumes it and two
 * tabs never undo each other. What differs is only where its blocks come from:
 *
 *   course_review    an item of THIS course that is due (getDueReviews by course)
 *   course_episode   the in-progress or next unlocked episode (same planner)
 *   course_retry     a recurring error of THIS course (`es:` errors only)
 *   course_transfer  a turn from an episode already completed, in its new
 *                    context (the `variation` steps the episodes were built with)
 *   course_mission   a short guided conversation stitched from completed
 *                    episodes' open turns (deep sessions)
 *
 * The plan names episodes, items and error types — never step text — so Home
 * can show it without loading any lesson content. The runner resolves each
 * block to real steps from the course's own content (`resolveBlockSteps`).
 *
 * Progress is NOT stored here: every answer is filed in the one learner model
 * under the course's ids. The session is only today's itinerary.
 */
import { learnerStorage } from '../../auth/localLease.js'
import { collectDeadCopies, ownKey, storedCopies } from '../../services/writerKeys.js'
import { getDueReviews, getEpisodeState } from '../engine/learnerModel.js'
import { isEpisodeUnlocked } from '../engine/planner.js'
import { DURATION_MODES, dayKeyFor, isDurationMode, mergeSessions } from '../engine/session.js'
import { belongsToCourse, courseSkeleton } from './registry.js'
import { seedFrom } from '../engine/variation.js'

export const COURSE_SESSION_VERSION = 1
export const courseSessionKey = (courseId) => `lc2-daily-session-${courseId}-v1`

/* Which open-turn kind practises which recurring Spanish error. */
const RETRY_KIND = {
  es_llamo_es: 'es_introduce', es_missing_me: 'es_introduce', es_mi_me: 'es_introduce', es_llamo_form: 'es_introduce', es_missing_es: 'es_introduce',
  es_que_cual: 'es_ask_name', es_missing_te: 'es_ask_name', es_te_llamas_form: 'es_ask_name',
  es_ser_estar_feeling: 'es_answer_wellbeing', es_bien_bueno: 'es_answer_wellbeing', es_ser_estar_question: 'es_ask_wellbeing',
  es_preposition_order: 'es_ask_origin', es_ser_estar_origin_q: 'es_ask_origin', es_live_vs_from_q: 'es_ask_origin',
  es_ser_estar_origin: 'es_say_origin', es_missing_de: 'es_say_origin', es_en_vs_de: 'es_say_origin',
  es_gustar_structure: 'es_express_like', es_gustar_form: 'es_express_like', es_gustar_plural: 'es_express_like',
  es_gustar_singular: 'es_express_like', es_missing_article_like: 'es_express_like', es_negation_position: 'es_express_dislike',
  es_gender_article: 'es_identify_thing', es_agua_article: 'es_want', es_missing_article_thing: 'es_identify_thing',
  es_uno_un: 'es_quantity', es_plural_number: 'es_quantity', es_wrong_number: 'es_quantity', es_singular_number: 'es_quantity',
  es_missing_politeness: 'es_polite_request', es_conjugation_yo: 'es_want', es_infinitive_verb: 'es_repair', es_infinitive_command: 'es_repair',
  es_word_order_q: 'es_ask_what', es_esto_neuter: 'es_ask_what',
}
export const retryKindFor = (errorType) => RETRY_KIND[String(errorType || '').replace(/^es:/, '')] || null

/* Short guided conversations, available once their episodes are completed. */
export const COURSE_MISSIONS = {
  es: [
    { id: 'es:mission_meet', titleKey: 'courseMissionMeet', episodes: ['es:te_llamas', 'es:como_estas', 'es:de_donde', 'es:primera_charla'] },
    { id: 'es:mission_cafe', titleKey: 'courseMissionCafe', episodes: ['es:numeros', 'es:por_favor', 'es:en_el_cafe'] },
    { id: 'es:mission_help', titleKey: 'courseMissionHelp', episodes: ['es:no_entiendo', 'es:quiero', 'es:que_es_esto'] },
  ],
}

const completed = (model, id) => getEpisodeState(model, id).status === 'completed'

function reviewBlocks(model, courseId, episodes, atMs, limit) {
  const day = dayKeyFor(atMs)
  const done = new Set(model.signalLog || [])
  const due = getDueReviews(model, atMs, { courseId })
    .filter(id => !done.has(`${day}:session:review:${id}:completed`))
  const home = id => episodes.find(ep => (ep.gardenItems || []).includes(id) && completed(model, ep.id))
    || episodes.find(ep => completed(model, ep.id) && ep.canDoId && id.startsWith(`${courseId}:`))
  // one review per lesson a day: three due words from the same lesson would
  // replay the same turn three times, which is repetition, not retrieval
  const seen = new Set()
  return due.map(itemId => ({ itemId, episode: home(itemId) }))
    .filter(x => x.episode && !seen.has(x.episode.id) && seen.add(x.episode.id))
    .slice(0, Math.max(0, limit))
    .map(({ itemId, episode }) => ({
      id: `review:${itemId}`, type: 'course_review', estimatedMinutes: 1,
      payload: { itemId, episodeId: episode.id },
    }))
}

function mainBlock(model, episodes) {
  const inProgress = episodes.find(ep => getEpisodeState(model, ep.id).status === 'in_progress' && isEpisodeUnlocked(model, ep))
  if (inProgress) return { id: `continue:${inProgress.id}`, type: 'course_episode', estimatedMinutes: inProgress.estimatedMinutes, payload: { episodeId: inProgress.id, resume: true } }
  const next = episodes.find(ep => !completed(model, ep.id) && isEpisodeUnlocked(model, ep))
  return next ? { id: `start:${next.id}`, type: 'course_episode', estimatedMinutes: next.estimatedMinutes, payload: { episodeId: next.id, resume: false } } : null
}

function retryBlock(model, courseId) {
  const err = (model.recurringErrors || [])
    .filter(e => belongsToCourse(e?.errorType, courseId) && e.count >= 2 && retryKindFor(e.errorType))
    .sort((a, b) => b.count - a.count)[0]
  return err ? { id: `retry:${err.errorType}`, type: 'course_retry', estimatedMinutes: 2, payload: { errorType: err.errorType, evalKind: retryKindFor(err.errorType) } } : null
}

function transferBlock(model, episodes, seed, exclude) {
  const pool = episodes.filter(ep => completed(model, ep.id) && !exclude.has(ep.id))
  if (!pool.length) return null
  const episode = pool[seedFrom(`${seed}:transfer`) % pool.length]
  return { id: `transfer:${episode.id}`, type: 'course_transfer', estimatedMinutes: 2, payload: { episodeId: episode.id } }
}

function missionBlock(model, courseId, seed) {
  const open = (COURSE_MISSIONS[courseId] || []).filter(m => m.episodes.every(id => completed(model, id)))
  if (!open.length) return null
  const mission = open[seedFrom(`${seed}:mission`) % open.length]
  return { id: `mission:${mission.id}`, type: 'course_mission', estimatedMinutes: 4, payload: { missionId: mission.id } }
}

export function buildCourseSessionPlan(model, courseId, { durationMode = 'standard', atMs = Date.now(), learnerKey = 'guest' } = {}) {
  const episodes = courseSkeleton(courseId)
  const mode = isDurationMode(durationMode) ? durationMode : 'standard'
  const { minutes, maxBlocks } = DURATION_MODES[mode]
  const dayKey = dayKeyFor(atMs)
  const seed = `${learnerKey}:${courseId}:${dayKey}`
  const blocks = []
  const room = () => blocks.length < maxBlocks - 1 // the completion slot is always reserved

  const reviews = reviewBlocks(model, courseId, episodes, atMs, maxBlocks)
  const main = mainBlock(model, episodes)
  if (reviews[0] && room()) blocks.push(reviews[0])
  if (main && room()) blocks.push(main)
  if (mode !== 'quick') {
    const retry = retryBlock(model, courseId)
    if (retry && room()) blocks.push(retry)
    for (const review of reviews.slice(1)) { if (!room()) break; blocks.push(review) }
    const used = new Set(blocks.map(b => b.payload?.episodeId).filter(Boolean))
    const transfer = transferBlock(model, episodes, seed, used)
    if (transfer && room()) blocks.push(transfer)
    if (mode === 'deep') { const mission = missionBlock(model, courseId, seed); if (mission && room()) blocks.push(mission) }
  }
  blocks.push({ id: 'completion', type: 'session_completion', estimatedMinutes: 0, payload: {} })

  const estimated = blocks.reduce((sum, b) => sum + (b.estimatedMinutes || 0), 0)
  return {
    version: COURSE_SESSION_VERSION, courseId,
    id: `${courseId}:${dayKey}:${mode}`, dayKey, createdAt: new Date(atMs).toISOString(), durationMode: mode,
    estimatedMinutes: Math.max(1, Math.min(estimated || minutes, minutes + 8)),
    status: 'planned', currentBlockIndex: 0, blocks,
  }
}

/* ---------- resolving a block into real steps (content is loaded by then) ---------- */

const OPEN = new Set(['free_reply', 'recall'])
const stepRef = (episode, step, index) => ({ episodeId: episode.id, stepIndex: index, step })

export function resolveBlockSteps(block, contentEpisodes, { seed = '' } = {}) {
  const byId = new Map(contentEpisodes.map(ep => [ep.id, ep]))
  const openSteps = (ep) => (ep?.steps || []).map((step, i) => [step, i]).filter(([s]) => OPEN.has(s.type) && !s.review)
  const pick = (list, salt) => (list.length ? list[seedFrom(`${seed}:${block.id}:${salt}`) % list.length] : null)
  switch (block.type) {
    case 'course_review': {
      const ep = byId.get(block.payload.episodeId)
      const withItem = openSteps(ep).filter(([s]) => (s.itemIds || []).includes(block.payload.itemId))
      const recall = withItem.find(([s]) => s.type === 'recall') || withItem[0] || openSteps(ep).find(([s]) => s.type === 'recall')
      return recall ? [stepRef(ep, recall[0], recall[1])] : []
    }
    case 'course_retry': {
      const candidates = contentEpisodes.flatMap(ep => openSteps(ep).filter(([s]) => s.evalKind === block.payload.evalKind).map(([s, i]) => [ep, s, i]))
      const chosen = pick(candidates, 'retry')
      return chosen ? [stepRef(chosen[0], chosen[1], chosen[2])] : []
    }
    case 'course_transfer': {
      const ep = byId.get(block.payload.episodeId)
      const variations = openSteps(ep).filter(([s]) => s.variation)
      const chosen = pick(variations.length ? variations : openSteps(ep), 'transfer')
      return chosen ? [stepRef(ep, chosen[0], chosen[1])] : []
    }
    case 'course_mission': {
      const mission = Object.values(COURSE_MISSIONS).flat().find(m => m.id === block.payload.missionId)
      if (!mission) return []
      return mission.episodes.map((id, n) => {
        const ep = byId.get(id)
        const chosen = pick(openSteps(ep).filter(([s]) => s.type === 'free_reply'), `mission:${n}`)
        return chosen ? stepRef(ep, chosen[0], chosen[1]) : null
      }).filter(Boolean)
    }
    default:
      return []
  }
}

/* ---------- persistence: one copy per writer, merged on read ---------- */

const access = {
  valid: () => true,
  keys: () => learnerStorage.keys(),
  getItem: key => learnerStorage.getItem(key),
  setItem: (key, value) => { learnerStorage.setItem(key, value); return true },
}

function normalize(parsed, courseId) {
  if (!parsed || typeof parsed !== 'object' || parsed.version !== COURSE_SESSION_VERSION || parsed.courseId !== courseId) return null
  if (!Array.isArray(parsed.blocks) || !parsed.blocks.length || typeof parsed.dayKey !== 'string') return null
  const index = Number.isInteger(parsed.currentBlockIndex) ? Math.max(0, Math.min(parsed.currentBlockIndex, parsed.blocks.length - 1)) : 0
  return { ...parsed, currentBlockIndex: index, status: ['planned', 'active', 'completed'].includes(parsed.status) ? parsed.status : 'planned' }
}

export function loadCourseSession(courseId, target = access) {
  let merged = null
  try {
    for (const copy of storedCopies(target, courseSessionKey(courseId))) {
      try { const parsed = normalize(JSON.parse(copy.raw), courseId); if (parsed) merged = mergeSessions(merged, parsed) } catch { /* unreadable copy ignored */ }
    }
  } catch { return null }
  return merged
}

export function saveCourseSession(session, target = access) {
  try {
    if (!target.valid()) return null
    const base = courseSessionKey(session.courseId)
    const merged = mergeSessions(loadCourseSession(session.courseId, target), { ...session, updatedAt: Date.now() })
    const key = ownKey(base)
    const serialized = JSON.stringify(merged)
    if (target.setItem(key, serialized) === false || target.getItem(key) !== serialized || !target.valid()) return null
    collectDeadCopies(target, base, parsed => JSON.stringify(mergeSessions(merged, parsed)) === serialized)
    return merged
  } catch { return null }
}

/* Today's stored plan, or a new one (a started plan is never rebuilt). */
export function getOrCreateCourseSession(model, courseId, { durationMode = 'standard', atMs = Date.now(), learnerKey = 'guest', stored } = {}) {
  const existing = stored === undefined ? loadCourseSession(courseId) : normalize(stored, courseId)
  if (existing && existing.dayKey === dayKeyFor(atMs) && (existing.status !== 'planned' || existing.durationMode === durationMode)) return existing
  return buildCourseSessionPlan(model, courseId, { durationMode, atMs, learnerKey })
}

export const advanceCourseSession = (session) => {
  const next = Math.min(session.blocks.length - 1, session.currentBlockIndex + 1)
  const last = session.blocks[next]?.type === 'session_completion'
  return { ...session, status: last && next === session.blocks.length - 1 ? 'completed' : 'active', currentBlockIndex: next }
}

/* ---------- Premium extra practice (decided by the server, built here) ---------- */

/*
 * One extra block of practice after today's session: the course's items whose
 * review comes soonest (reviewed early, one per lesson), the learner's most
 * frequent error, and a transfer turn from a lesson not used today. Built from
 * the same planner pieces as the daily session, so it adds no new lessons and
 * no rewards: only evidence, filed in the one learner model like any answer.
 *
 * `blockIndex` (0, 1, 2…) varies what each block picks. Whether a block may be
 * played at all is the server's answer (POST /practice/extra/authorize), never
 * this function's: it only says what the block would contain.
 */
export function buildExtraPracticePlan(model, courseId, { atMs = Date.now(), learnerKey = 'guest', blockIndex = 0, todayPlan = null } = {}) {
  const episodes = courseSkeleton(courseId)
  const dayKey = dayKeyFor(atMs)
  const seed = `${learnerKey}:${courseId}:${dayKey}:extra:${blockIndex}`
  const done = new Set(model.signalLog || [])
  const usedToday = new Set((todayPlan?.blocks || []).map(b => b.payload?.itemId || b.payload?.episodeId).filter(Boolean))
  const home = id => episodes.find(ep => completed(model, ep.id) && ((ep.gardenItems || []).includes(id) || (ep.canDoId && id.startsWith(`${courseId}:`))))

  const upcoming = Object.entries(model.languageItems || {})
    .filter(([id, it]) => belongsToCourse(id, courseId) && it.nextReviewAt && it.status !== 'new')
    .filter(([id]) => !usedToday.has(id) && !done.has(`${dayKey}:session:review:${id}:completed`))
    .sort((a, b) => new Date(a[1].nextReviewAt) - new Date(b[1].nextReviewAt))
    .map(([id]) => ({ itemId: id, episode: home(id) }))
    .filter(x => x.episode)
  const seen = new Set()
  const oneEach = upcoming.filter(x => !seen.has(x.episode.id) && seen.add(x.episode.id))
  const start = oneEach.length ? (blockIndex * 2) % oneEach.length : 0
  const reviews = [...oneEach.slice(start), ...oneEach.slice(0, start)].slice(0, 2).map(({ itemId, episode }) => ({
    id: `extra-review:${itemId}`, type: 'course_review', estimatedMinutes: 1, payload: { itemId, episodeId: episode.id },
  }))

  const blocks = [...reviews]
  const retry = retryBlock(model, courseId)
  if (retry) blocks.push({ ...retry, id: `extra-${retry.id}` })
  const transfer = transferBlock(model, episodes, seed, new Set([...usedToday, ...reviews.map(r => r.payload.episodeId)]))
  if (transfer) blocks.push({ ...transfer, id: `extra-${transfer.id}` })
  if (!blocks.length) return null
  blocks.push({ id: 'completion', type: 'session_completion', estimatedMinutes: 0, payload: {} })
  return {
    version: COURSE_SESSION_VERSION, courseId, extra: true, blockIndex,
    id: `${courseId}:${dayKey}:extra:${blockIndex}`, dayKey, createdAt: new Date(atMs).toISOString(), durationMode: 'quick',
    estimatedMinutes: Math.max(1, blocks.reduce((sum, b) => sum + (b.estimatedMinutes || 0), 0)),
    status: 'planned', currentBlockIndex: 0, blocks,
  }
}
