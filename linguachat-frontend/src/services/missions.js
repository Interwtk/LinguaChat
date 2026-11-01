import { learnerStorage as localStorage } from '../auth/localLease.js'
import { PRACTICE_MISSIONS } from '../data/practiceMissions.js'
import { collectDeadCopies, ownKey, storedCopies } from './writerKeys.js'

const ACTIVE_KEY = 'lc2-active-mission'
const COMPLETED_KEY = 'lc2-completed-missions'
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

function levelIndex(level) {
  return Math.max(0, LEVELS.indexOf(level || 'A2'))
}

function inLevelRange(mission, level) {
  const [min, max] = mission.levelRange
  const current = levelIndex(level)
  return current >= levelIndex(min) && current <= levelIndex(max)
}

function normalize(text) {
  return String(text || '').trim().toLowerCase().replace(/[.!?]+$/g, '')
}

function friendlyPrompt(step) {
  if (!step) return ''
  const prompt = step.prompt ? `\n\n${step.prompt}` : ''
  const typeHint = {
    translate: 'Probemos una frase util.',
    choose_option: 'Elige la opcion que suena mas natural.',
    write_sentence: 'Escribe una respuesta corta en ingles.',
    reply_to_lingua: 'Imagina que estamos conversando.',
    rewrite: 'Mejoremos esta frase juntos.',
  }[step.type] || 'Vamos con el siguiente paso.'
  return `${typeHint} ${step.instruction}${prompt}`
}

export function loadActiveMission() {
  return readJSON(ACTIVE_KEY, null)
}

export function saveActiveMission(activeMission, { access = null } = {}) {
  if (access) {
    // Interactive mission actions must retain the account lease that began
    // the action. A revoked tab, denied write or mismatched read-back must
    // never be presented as saved to the learner.
    try {
      if (!access.valid()) return false
      if (!activeMission) {
        if (access.removeItem(ACTIVE_KEY) === false
          || !access.valid() || access.getItem(ACTIVE_KEY) !== null) return false
      } else {
        const serialized = JSON.stringify(activeMission)
        if (access.setItem(ACTIVE_KEY, serialized) === false
          || !access.valid() || access.getItem(ACTIVE_KEY) !== serialized) return false
      }
      return access.valid()
    } catch {
      return false
    }
  }
  // Preserve the best-effort legacy path for non-interactive callers.
  if (!activeMission) {
    try { localStorage.removeItem(ACTIVE_KEY) } catch {}
    return
  }
  writeJSON(ACTIVE_KEY, activeMission)
}

/*
 * The completed-mission history is append-only, so each tab writes its own
 * copy (writerKeys.js) and a read is the union of every copy: a tab whose view
 * of storage is stale can never erase another tab's completion. One entry per
 * mission run (missionId + startedAt), newest first, at most 50.
 * An unreadable copy throws: completing a mission without being able to check
 * its history fails closed, as before, and the bytes are left untouched.
 */
export function readCompletedMissions(access) {
  const byRun = new Map()
  for (const copy of storedCopies(access, COMPLETED_KEY)) {
    const list = JSON.parse(copy.raw)
    if (!Array.isArray(list)) throw new Error('Unreadable mission history')
    for (const item of list) {
      if (!item || typeof item.missionId !== 'string') continue
      const run = `${item.missionId}:${item.startedAt}`
      if (!byRun.has(run)) byRun.set(run, item)
    }
  }
  return [...byRun.values()].sort((a, b) => (Number(b.completedAt) || 0) - (Number(a.completedAt) || 0)).slice(0, 50)
}

const learnerAccess = {
  valid: () => true,
  keys: () => localStorage.keys(),
  getItem: key => localStorage.getItem(key),
}

export function loadCompletedMissions() {
  try { return readCompletedMissions(learnerAccess) } catch { return [] }
}

/*
 * The progress-ledger id of a mission reward: one per mission run and step,
 * plus one for the completion bonus. Answering the same step again (a retry,
 * a second tab, a stale cursor) is then the same reward, paid once.
 */
export function missionRewardId(activeMission, part) {
  return `mission:${activeMission.missionId}:${Number(activeMission.startedAt) || 0}:${part}`
}

export function saveCompletedMissions(completed) {
  writeJSON(COMPLETED_KEY, completed.slice(-50))
}

export function getMissionById(id) {
  return PRACTICE_MISSIONS.find(mission => mission.id === id) || null
}

export function getMissionForToday(level = 'A2', preferredType = null) {
  const candidates = PRACTICE_MISSIONS.filter(mission => inLevelRange(mission, level))
  if (preferredType) {
    const normalizedType = normalize(preferredType)
    const preferred = candidates.find(mission => normalize(mission.type) === normalizedType)
    if (preferred) return preferred
  }
  const easy = candidates.find(mission => ['Travel', 'Daily Life'].includes(mission.type))
  return easy || candidates[0] || PRACTICE_MISSIONS[0]
}

export function startMission(mission, { access = null } = {}) {
  if (!mission || (access && !access.valid())) return null
  const active = {
    missionId: mission.id,
    currentStepIndex: 0,
    earnedXp: 0,
    answers: [],
    startedAt: Date.now(),
    completedAt: null,
  }
  if (saveActiveMission(active, { access }) === false) return null
  return active
}

export function getActiveMissionDetails(activeMission) {
  if (!activeMission) return null
  const mission = getMissionById(activeMission.missionId)
  if (!mission) return null
  const step = mission.steps[activeMission.currentStepIndex] || null
  return {
    mission,
    step,
    currentStepNumber: Math.min(activeMission.currentStepIndex + 1, mission.steps.length),
    totalSteps: mission.steps.length,
    progressPercent: Math.round((activeMission.currentStepIndex / mission.steps.length) * 100),
  }
}

export function createMissionIntroMessage(mission, isContinuation = false) {
  const text = isContinuation
    ? `Continuemos donde quedamos. Seguimos con "${mission.title}" y te guio paso a paso.`
    : `Hoy practicaremos ${mission.title.toLowerCase()}. Te guiare paso a paso.`
  return {
    id: `mission-intro-${Date.now()}`,
    role: 'lingua',
    text,
    feedback: {
      focus: mission.targetSkill,
      suggestion: `Meta de hoy: ${mission.description}`,
    },
    missionId: mission.id,
    missionType: 'intro',
    ts: Date.now(),
  }
}

export function createMissionStepMessage(details) {
  if (!details?.step) return null
  return {
    id: `mission-step-${details.mission.id}-${details.step.id}-${Date.now()}`,
    role: 'lingua',
    text: friendlyPrompt(details.step),
    feedback: null,
    missionId: details.mission.id,
    missionStepId: details.step.id,
    missionType: 'step',
    missionOptions: details.step.type === 'choose_option' ? details.step.options : null,
    missionProgress: {
      current: details.currentStepNumber,
      total: details.totalSteps,
      percent: details.progressPercent,
      targetSkill: details.mission.targetSkill,
    },
    ts: Date.now(),
  }
}

export function createMissionFeedbackMessage(mission, step, evaluation, earnedXp) {
  return {
    id: `mission-feedback-${step.id}-${Date.now()}`,
    role: 'lingua',
    text: evaluation.passed
      ? `Bien. ${evaluation.feedback} +${earnedXp} XP.`
      : `Buen intento. ${evaluation.feedback} +${earnedXp} XP por practicar.`,
    feedback: {
      correction: evaluation.correction || null,
      why: evaluation.explanation || null,
      suggestion: evaluation.nextSuggestion || 'Sigue con una frase corta y clara.',
      focus: mission.targetSkill,
    },
    missionId: mission.id,
    missionStepId: step.id,
    missionType: 'feedback',
    ts: Date.now(),
  }
}

export function createMissionCompleteMessage(mission, completed) {
  return {
    id: `mission-complete-${mission.id}-${Date.now()}`,
    role: 'lingua',
    text: `Mision completada. Hoy practicaste ${mission.targetSkill} y frases utiles. +${completed.earnedXp || mission.rewardXp} XP.`,
    feedback: {
      focus: mission.targetSkill,
      suggestion: 'Vuelve manana y hacemos otra mini practica.',
    },
    missionId: mission.id,
    missionType: 'complete',
    ts: Date.now(),
  }
}

export function evaluateMissionStep(step, value) {
  const normalized = normalize(value)
  if (!step) return { passed: false, feedback: 'No encontre este paso.' }

  if (step.type === 'choose_option') {
    const selected = step.options?.find(option =>
      normalize(option.id) === normalized || normalize(option.text) === normalized
    )
    const passed = normalize(selected?.id || value) === normalize(step.expectedPattern)
    return {
      passed,
      feedback: passed ? step.feedbackHint : `Casi. Mira esta pista: ${step.feedbackHint}`,
      correction: passed ? null : step.options?.find(option => normalize(option.id) === normalize(step.expectedPattern))?.text || null,
      explanation: passed ? null : 'La opcion correcta suena mas natural en ingles.',
      nextSuggestion: 'Leamos la siguiente situacion.',
    }
  }

  const pattern = step.expectedPattern
  const passed = pattern
    ? new RegExp(pattern, 'i').test(normalized)
    : normalized.length > 2

  return {
    passed,
    feedback: passed
      ? step.feedbackHint
      : `Prueba usando esta idea: ${step.feedbackHint}`,
    correction: passed ? null : step.feedbackHint.replace(/^[^:]+:\s*/, ''),
    explanation: passed ? null : 'La idea esta bien; solo ajustemos la forma.',
    nextSuggestion: 'Vamos paso a paso.',
  }
}

export function advanceMission(activeMission, step, answerValue, evaluation, { access = null, deferSave = false } = {}) {
  if ((deferSave && !access) || (access && !access.valid())) return null
  const nextAnswers = [
    ...(activeMission.answers || []),
    {
      stepId: step.id,
      type: step.type,
      value: answerValue,
      passed: evaluation.passed,
      xp: evaluation.passed ? step.xp : Math.max(1, Math.round(step.xp / 2)),
      answeredAt: Date.now(),
    },
  ]
  const earnedThisStep = nextAnswers[nextAnswers.length - 1].xp
  const nextIndex = activeMission.currentStepIndex + 1
  const nextActive = {
    ...activeMission,
    answers: nextAnswers,
    currentStepIndex: nextIndex,
    earnedXp: (activeMission.earnedXp || 0) + earnedThisStep,
  }
  // The final step is committed with the completed record, not ahead of it.
  // Otherwise a failed completion would leave an unresumable final-step cursor.
  if (!deferSave && saveActiveMission(nextActive, { access }) === false) return null
  if (access && !access.valid()) return null
  return { activeMission: nextActive, earnedThisStep }
}

export function completeMission(activeMission, { access = null } = {}) {
  if (!activeMission || (access && !access.valid())) return null
  const mission = getMissionById(activeMission.missionId)
  const completed = {
    missionId: activeMission.missionId,
    title: mission?.title || 'Practice mission',
    type: mission?.type || 'Practice',
    earnedXp: activeMission.earnedXp || 0,
    answers: activeMission.answers || [],
    startedAt: activeMission.startedAt,
    completedAt: Date.now(),
  }
  if (access) {
    // The last step was only prepared in memory. Require its previous cursor
    // to remain durable before publishing completion for the same account.
    try {
      if (!mission?.steps?.length || activeMission.currentStepIndex !== mission.steps.length) return null
      const rawActive = access.getItem(ACTIVE_KEY)
      if (!access.valid() || !rawActive) return null
      const savedActive = JSON.parse(rawActive)
      if (savedActive?.missionId !== activeMission.missionId
        || savedActive.startedAt !== activeMission.startedAt
        || savedActive.currentStepIndex !== activeMission.currentStepIndex - 1) return null
      const previous = readCompletedMissions(access)
      if (!access.valid()) return null
      // If the completed record was saved but clearing the active cursor
      // failed, retry the clear without duplicating a reward/history entry.
      const existing = previous.find(item => item?.missionId === completed.missionId
        && item.startedAt === completed.startedAt)
      const result = existing || completed
      if (!existing) {
        const key = ownKey(COMPLETED_KEY)
        const serialized = JSON.stringify([completed, ...previous].slice(0, 50))
        if (access.setItem(key, serialized) === false
          || !access.valid() || access.getItem(key) !== serialized) return null
        // A closed tab's history copy whose every run is in this one can go.
        const runs = new Set([completed, ...previous].map(item => `${item.missionId}:${item.startedAt}`))
        collectDeadCopies(access, COMPLETED_KEY, parsed => Array.isArray(parsed)
          && parsed.every(item => runs.has(`${item?.missionId}:${item?.startedAt}`)))
      }
      if (saveActiveMission(null, { access }) === false || !access.valid()) return null
      return result
    } catch {
      return null
    }
  }
  // Legacy non-interactive callers keep their best-effort behavior.
  const previous = loadCompletedMissions()
  saveCompletedMissions([completed, ...previous])
  saveActiveMission(null)
  return completed
}

export function clearMissionStorage({ access = null } = {}) {
  if (access) {
    // Reset both mission stores only while the originating account still
    // owns the lease, and verify each removal before reporting success.
    try {
      if (!access.valid()) return false
      // Every tab's copy of the history goes, not only this tab's.
      const historyKeys = storedCopies(access, COMPLETED_KEY).map(copy => copy.key)
      for (const key of [ACTIVE_KEY, COMPLETED_KEY, ...historyKeys]) {
        if (!access.valid() || access.removeItem(key) === false
          || !access.valid() || access.getItem(key) !== null) return false
      }
      return access.valid()
    } catch {
      return false
    }
  }
  try {
    localStorage.removeItem(ACTIVE_KEY)
    localStorage.removeItem(COMPLETED_KEY)
  } catch {}
}
