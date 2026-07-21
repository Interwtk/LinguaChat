/*
 * hybridEvaluation — routes a learner free reply through three levels:
 *
 *   Level 1  deterministic  — local, instant, used for every closed step and for
 *                             any free reply the local evaluator can judge with
 *                             confidence (clear accept, empty, clear failure).
 *   Level 2  remote (Lingua)— consulted ONLY for a non-empty free reply the local
 *                             evaluator could not confirm (a plausible but
 *                             unrecognized natural variant). `remote` is injected
 *                             so routing is fully testable without a network.
 *   Level 3  fallback       — if no remote, or it errors/times out/returns junk,
 *                             the conservative local verdict is used. It never
 *                             blocks: the learner keeps a hint and a second try.
 *
 * The remote is trusted to answer a narrow question — "is this an acceptable
 * natural variant for this step?" (+ an optional model answer). It can never
 * mark mastery and its free prose is not injected into the localized UI; the
 * learner model decides mastery from the returned evidence.
 */
import { evaluateFree, shouldEscalate } from './responseEvaluation.js'

const PRAISE = {
  introduction: { independent: 'ep1PraiseIndependent', helped: 'ep1PraiseIm' },
  ask_name: { independent: 'ep2PraiseIndependent', helped: 'ep2PraiseAsked' },
  nice_to_meet: { independent: 'ep3PraiseIndependent', helped: 'ep3PraiseClose' },
  ask_wellbeing: { independent: 'ep4PraiseIndependent', helped: 'ep4PraiseAsked' },
  answer_wellbeing: { independent: 'ep4PraiseIndependent', helped: 'ep4PraiseAnswered' },
  reciprocal_question: { independent: 'ep4PraiseIndependent', helped: 'ep4PraiseBounce' },
  ask_origin: { independent: 'ep5PraiseIndependent', helped: 'ep5PraiseAsked' },
  answer_origin: { independent: 'ep5PraiseIndependent', helped: 'ep5PraiseAnswered' },
  full_intro_conversation: { independent: 'ep6PraiseIndependent', helped: 'ep6PraiseCombined' },
}

function praiseFor(kind, independent) {
  const p = PRAISE[kind] || PRAISE.introduction
  return independent ? p.independent : p.helped
}

// Strictly validate whatever the remote returned; return a normalized subset or
// null. Accepts snake_case (backend) or camelCase. Rejects contradictions.
export function validateRemoteEvaluation(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null
  const completed = o.completed_objective ?? o.completedObjective
  if (typeof completed !== 'boolean') return null
  const retry = o.retry_required ?? o.retryRequired
  if (completed === true && retry === true) return null
  if (completed === false && retry === false) return null
  const natural = o.natural_version ?? o.naturalVersion
  if (natural != null && (typeof natural !== 'string' || natural.length === 0 || natural.length > 120)) return null
  let confidence = o.confidence
  if (typeof confidence !== 'number' || !(confidence >= 0 && confidence <= 1)) confidence = undefined
  return {
    completedObjective: completed,
    understood: o.understood !== false,
    acceptedVariant: Boolean(o.accepted_variant ?? o.acceptedVariant),
    naturalVersion: natural || null,
    confidence,
  }
}

function buildRemotePayload(params, kind) {
  const { episode, step } = params
  return {
    episode_id: episode?.id ?? null,
    step_id: step?.id ?? String(params.stepIndex ?? ''),
    can_do_id: episode?.canDoId ?? null,
    step_type: step?.type ?? null,
    expected_intent: kind ?? null,
    required_elements: step?.itemIds || [],
    accepted_variants: [],
    target_items: step?.itemIds || [],
    learner_response: params.learnerResponse ?? '',
    learner_name: params.learnerName ?? '',
    learner_place: params.place ?? '',
    native_language: params.nativeLanguage ?? 'en',
    interface_language: params.interfaceLanguage ?? 'en',
    target_language: params.targetLanguage ?? 'en',
    scaffold_level: params.scaffoldLevel ?? 'high',
    assistance_used: Boolean(params.assistanceUsed),
    previous_attempts: params.previousAttempts ?? 0,
    turn_context: params.turnContext ?? null,
  }
}

export async function evaluateEpisodeResponse(params) {
  const { step, learnerResponse, learnerName, scaffoldLevel, assistanceUsed = false, turnContext = null, place = '', signal, remote } = params
  const kind = step?.evalKind
  const independent = !assistanceUsed && scaffoldLevel !== 'high'
  const local = evaluateFree(kind, learnerResponse, { name: learnerName, independent, turnContext, place })

  // Conclusive local verdict (closed step, clear accept, empty, clear failure).
  if (!shouldEscalate(local)) return { ...local, source: 'deterministic' }

  // Ambiguous free reply → consult Lingua when a remote is available.
  if (typeof remote === 'function') {
    let raw = null
    try { raw = await remote(buildRemotePayload(params, kind), signal) } catch { raw = null }
    const v = validateRemoteEvaluation(raw)
    if (v) {
      if (v.completedObjective) {
        return {
          ...local,
          source: 'remote',
          understood: true,
          completedObjective: true,
          acceptedVariant: true,
          confidence: v.confidence ?? 0.8,
          conclusive: true,
          errorType: null,
          priorityCorrection: null,
          explanation: null,
          retryRequired: false,
          retryPrompt: null,
          naturalVersion: v.naturalVersion || local.naturalVersion,
          praiseKey: praiseFor(kind, independent),
        }
      }
      // Remote agrees it is not complete → keep the localized reject, optionally
      // adopting a cleaner model answer.
      return { ...local, source: 'remote', naturalVersion: v.naturalVersion || local.naturalVersion }
    }
  }

  // Level 3 — safe conservative fallback (never blocks the learner).
  return { ...local, source: 'fallback' }
}
