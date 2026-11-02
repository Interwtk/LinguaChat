#!/usr/bin/env node
/*
 * check-es-course — the Spanish-for-English-speakers course, end to end.
 *
 *   A. content    every episode builds, validates, and every model answer it
 *                 shows passes its own evaluator (a lesson cannot reject the
 *                 sentence it taught);
 *   B. evaluator  correct forms, common English-speaker errors, gender and
 *                 agreement, ser/estar, regional variants, accents, partial,
 *                 English replies, out-of-scope replies (not evaluable, never
 *                 "corrected"), copy detection;
 *   C. journey    a synthetic English speaker walks all twelve episodes through
 *                 the same engine functions the player uses: order, delayed
 *                 retrieval, transfer, replay without double reward;
 *   D. isolation  Spanish evidence never reaches the English course (plan,
 *                 reviews, summary, support, Garden) and the reverse;
 *   E. gating     ids, refusals, offered pairs; English levels unchanged;
 *   F. migration  a pre-course learner model and progress read unchanged.
 *
 * A simulation proves internal consistency, not that a person learns Spanish.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ES_EPISODES, validateSpanishCourse, ES_COPY } from '../src/learning/courses/es/preA1Content.js'
import { ES_SKELETON, ES_VOCAB } from '../src/learning/courses/es/skeleton.js'
import { evaluateSpanish, accentNote, articleMismatch, fold } from '../src/learning/courses/es/evaluator.js'
import {
  COURSES, courseIdOf, belongsToCourse, isCourseOffered, offeredCourses, courseEpisodeRequest, courseSkeleton,
} from '../src/learning/courses/registry.js'
import { episodeRequest } from '../src/learning/curriculum/episodeContent.js'
import { episodesOfLevel } from '../src/learning/curriculum/levels.js'
import {
  createLearnerModel, migrateLearnerModel, recordItemAttempt, setEpisodeState, getEpisodeState, getDueReviews, markRecurringError,
} from '../src/learning/engine/learnerModel.js'
import { beginEpisodeRun, completeEpisodeRun, runEarnsReward } from '../src/learning/engine/episodeRuns.js'
import { planDay, arcProgress } from '../src/learning/engine/planner.js'
import { learnerSummary } from '../src/learning/engine/learnerSummary.js'
import { deriveInitialScaffold, copiesShownModel, isIndependentEvidence } from '../src/learning/engine/scaffolding.js'
import { createLedger, addEvent, deriveSnapshot } from '../src/services/progressLedger.js'
import { ACTIVE_COURSE_KEY, readActiveCourse } from '../src/services/activeCourse.js'

let passed = 0
const failures = []
const check = (label, cond) => { if (cond) passed++; else failures.push(label) }
const NAME = 'Ana'
const resolve = (s, vars = { name: NAME }) => String(s || '').replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m)

/* ================= A. content ================= */
const problems = validateSpanishCourse()
check(`content validates (${problems.slice(0, 3).join('; ')})`, problems.length === 0)
check('twelve episodes', ES_EPISODES.length === 12 && ES_SKELETON.length === 12)
check('every episode is non-trivial (>= 9 steps)', ES_EPISODES.every(e => e.steps.length >= 9))

const REQUIRED_KINDS = {
  greet: ['es_greet', 'es_introduce'], introduce: ['es_introduce'], ask_name: ['es_ask_name'], origin: ['es_say_origin', 'es_ask_origin'],
  wellbeing: ['es_ask_wellbeing', 'es_answer_wellbeing'], preferences: ['es_express_like', 'es_ask_like'], needs: ['es_want', 'es_need'],
  polite: ['es_polite_request'], numbers: ['es_quantity'], objects: ['es_identify_thing', 'es_ask_what'], repair: ['es_repair'],
  conversation: ['es_goodbye', 'es_anything_else', 'es_ask_bill'],
}
const kindsUsed = new Set(ES_EPISODES.flatMap(e => e.steps.map(s => s.evalKind).filter(Boolean)))
for (const [capability, kinds] of Object.entries(REQUIRED_KINDS)) check(`capability ${capability} is practised in open production`, kinds.every(k => kindsUsed.has(k)))

let modelAnswers = 0
for (const ep of ES_EPISODES) {
  for (const [i, step] of ep.steps.entries()) {
    if (step.type !== 'free_reply') continue
    const answer = resolve(step.suggestionEn)
    const r = evaluateSpanish(step.evalKind, answer, { name: NAME, independent: false, ...(step.courseContext || {}) })
    modelAnswers++
    check(`${ep.id} step ${i}: its own model answer "${answer}" passes`, r.completedObjective === true)
  }
  const recallFirst = ep.steps.findIndex(s => s.type === 'recall')
  check(`${ep.id}: has an unaided recall step`, recallFirst >= 0)
  check(`${ep.id}: has a transfer (variation) or capstone step`, ep.steps.some(s => s.variation) || ep.id === 'es:primera_charla' || ep.id === 'es:en_el_cafe')
}
check('model answers checked', modelAnswers >= 40)
check('every episode after the first recalls an earlier skill first (delayed retrieval)', ES_EPISODES.slice(1)
  .filter(e => !['es:primera_charla', 'es:en_el_cafe'].includes(e.id)).every(e => e.steps[0].type === 'recall' && e.steps[0].review))
check('every comprehension/choice has exactly the right options marked', ES_EPISODES.every(e => e.steps
  .filter(s => s.type === 'comprehension' || (s.type === 'choice' && !s.allValid)).every(s => s.options.filter(o => o.correct).length === 1)))
{
  const positions = ES_EPISODES.flatMap(e => e.steps.filter(s => s.options && !s.allValid).map(s => s.options.findIndex(o => o.correct)))
  check('the right option is not always in the same place', new Set(positions).size >= 2 && positions.filter(p => p === 0).length < positions.length)
}
check('copy is English (aux) and never empty', Object.values(ES_COPY).every(v => typeof v === 'string' && v.trim().length > 0))
check('vocabulary has English meanings', ES_VOCAB.every(v => v.meaning?.en))
check('no generated copy key is missing', ES_EPISODES.every(e => e.steps.every(s => ['instructionKey', 'hintKey', 'explainKey', 'titleKey', 'bodyKey']
  .every(k => !s[k] || !s[k].startsWith('es.') || ES_COPY[s[k]]))))

/* ================= B. evaluator ================= */
const E = (kind, text, ctx = {}) => evaluateSpanish(kind, text, { name: NAME, ...ctx })
const okCase = (kind, text, ctx, label) => { const r = E(kind, text, ctx); check(`accepts ${label || text}`, r.completedObjective === true) ; return r }
const errCase = (kind, text, ctx, type) => { const r = E(kind, text, ctx); check(`flags "${text}" as ${type} (got ${r.errorType})`, !r.completedObjective && r.errorType === type); return r }
const neCase = (kind, text, ctx) => { const r = E(kind, text, ctx); check(`"${text}" is not evaluable, not corrected`, !r.completedObjective && r.notEvaluable === true && r.conclusive === false); return r }

// correct and natural variants
okCase('es_introduce', 'Hola, me llamo Ana.')
okCase('es_introduce', 'Soy Ana')
okCase('es_introduce', 'Mi nombre es Ana')
okCase('es_introduce', 'Buenos días, me llamo Sebastián')
okCase('es_ask_name', '¿Cómo te llamas?')
okCase('es_ask_name', '¿Cómo se llama usted?')
okCase('es_ask_name', '¿Cuál es tu nombre?')
okCase('es_nice_to_meet', 'Encantada')
okCase('es_nice_to_meet', 'Igualmente')
okCase('es_answer_wellbeing', 'Muy bien, gracias')
okCase('es_answer_wellbeing', 'Estoy cansado')
okCase('es_answer_wellbeing', 'Más o menos')
okCase('es_ask_wellbeing', '¿Qué tal?')
okCase('es_ask_wellbeing', '¿Cómo está usted?')
okCase('es_say_origin', 'Soy de Estados Unidos')
okCase('es_say_origin', 'Soy estadounidense', {}, 'a nationality instead of soy de')
okCase('es_ask_origin', '¿De dónde es usted?')
okCase('es_goodbye', 'Chau', {}, 'regional goodbye (chau)')
okCase('es_express_like', 'Me gustan los perros', { targetThing: 'musica' })
okCase('es_express_like', 'Me gusta bailar', { targetThing: 'musica' }, 'an infinitive after gusta')
okCase('es_express_dislike', 'No me gusta el café', { targetThing: 'cafe' })
okCase('es_ask_like', '¿Te gusta el fútbol?')
okCase('es_want', 'Quiero un agua', { targetThing: 'agua' })
okCase('es_need', 'Necesito ayuda', { targetThing: 'ayuda' })
okCase('es_polite_request', 'Quisiera un té', { targetThing: 'te' })
okCase('es_quantity', 'Tres cafés, por favor', { targetThing: 'cafe', targetCount: 3, quantityForm: 'polite_request' })
okCase('es_quantity', 'Cuatro', { targetCount: 4, quantityForm: 'bare' })
okCase('es_ask_what', '¿Qué es eso?')
okCase('es_identify_thing', 'Es una mesa', { targetThing: 'mesa' })
okCase('es_repair', '¿Qué significa biblioteca?', { repairKind: 'ask_meaning', meaningWord: 'biblioteca' })
okCase('es_anything_else', 'Nada más, gracias')
okCase('es_ask_bill', '¿Me trae la cuenta, por favor?')

// regional variants (Spain / Latin America / voseo) are right, never errors
okCase('es_identify_thing', 'Es un móvil', { targetThing: 'telefono' }, 'móvil (Spain) for a phone')
okCase('es_identify_thing', 'Es un celular', { targetThing: 'telefono' }, 'celular (Latin America) for a phone')
okCase('es_identify_thing', 'Es un ordenador', { targetThing: 'computadora' }, 'ordenador (Spain)')
okCase('es_identify_thing', 'Es una lapicera', { targetThing: 'boligrafo' }, 'lapicera (Río de la Plata)')
okCase('es_polite_request', '¿Me pone un café?', { targetThing: 'cafe' }, '¿me pone…? (Spain)')
okCase('es_polite_request', '¿Me regala un café, por favor?', { targetThing: 'cafe' }, '¿me regala…? (Colombia)')
okCase('es_repair', '¿Mande?', { repairKind: 'repeat' }, '¿mande? (Mexico)')
okCase('es_ask_origin', '¿De dónde sos?', {}, 'voseo')
okCase('es_ask_wellbeing', '¿Cómo tú estás?', {}, 'Caribbean subject placement')
okCase('es_repair', 'Más lento, por favor', { repairKind: 'slow_down' }, 'más lento (Latin America)')

// common English-speaker errors
errCase('es_introduce', 'Me llamo es Ana', {}, 'es_llamo_es')
errCase('es_introduce', 'Yo llamo Ana', {}, 'es_missing_me')
errCase('es_introduce', 'Mi llamo Ana', {}, 'es_mi_me')
errCase('es_introduce', 'Soy de Chile', {}, 'es_origin_not_name')
errCase('es_ask_name', '¿Qué es tu nombre?', {}, 'es_que_cual')
errCase('es_ask_name', '¿Cómo llamas?', {}, 'es_missing_te')
errCase('es_nice_to_meet', 'Bueno conocerte', {}, 'es_calque_nice')
errCase('es_ask_origin', '¿Dónde eres de?', {}, 'es_preposition_order')
errCase('es_ask_origin', '¿Dónde vives?', {}, 'es_live_vs_from_q')
errCase('es_say_origin', 'Soy Chile', {}, 'es_missing_de')
errCase('es_say_origin', 'Estoy en Chile', {}, 'es_en_vs_de')
errCase('es_express_like', 'Yo gusto el café', { targetThing: 'cafe' }, 'es_gustar_structure')
errCase('es_express_like', 'Me gusto la música', { targetThing: 'musica' }, 'es_gustar_form')
errCase('es_express_dislike', 'Me no gusta el café', { targetThing: 'cafe' }, 'es_negation_position')
errCase('es_express_like', 'Me gusta los libros', {}, 'es_gustar_plural')
errCase('es_express_like', 'Me gusta café', { targetThing: 'cafe' }, 'es_missing_article_like')
errCase('es_want', 'Yo quiere agua', { targetThing: 'agua' }, 'es_conjugation_yo')
errCase('es_polite_request', 'Quiero un café', { targetThing: 'cafe' }, 'es_missing_politeness')
errCase('es_quantity', 'Uno café', { targetThing: 'cafe', targetCount: 1 }, 'es_uno_un')
errCase('es_quantity', 'Tres cafés', { targetThing: 'cafe', targetCount: 2 }, 'es_wrong_number')
errCase('es_quantity', 'Dos café', { targetThing: 'cafe', targetCount: 2 }, 'es_plural_number')
errCase('es_ask_what', '¿Qué esto es?', {}, 'es_word_order_q')
errCase('es_identify_thing', 'Es una mesa', { targetThing: 'libro' }, 'es_wrong_thing')
errCase('es_repair', 'No entender', { repairKind: 'not_understand' }, 'es_infinitive_verb')
errCase('es_repair', 'Más despacio, por favor', { repairKind: 'repeat' }, 'es_repair_other_repeat')
errCase('es_repair', '¿Qué significa?', { repairKind: 'ask_meaning', meaningWord: 'biblioteca' }, 'es_missing_word')

// gender and agreement — on known nouns only
errCase('es_express_like', 'Me gusta la café', { targetThing: 'cafe' }, 'es_gender_article')
errCase('es_identify_thing', 'Es un llave', { targetThing: 'llave' }, 'es_gender_article')
errCase('es_want', 'Quiero una agua', { targetThing: 'agua' }, 'es_agua_article')
errCase('es_ask_bill', 'El cuenta, por favor', {}, 'es_gender_article')
check('a noun the evaluator does not know is never gender-corrected', !articleMismatch(fold('me gusta la arquitectura')) && !articleMismatch(fold('me gusta el arquitectura')))
okCase('es_express_like', 'Me gusta la arquitectura', { targetThing: 'musica' }, 'an unknown noun (gender not judged)')
check('el agua / un agua are right, la agua is not', !articleMismatch(fold('el agua')) && !articleMismatch(fold('un agua')) && articleMismatch(fold('la agua'))?.type === 'es_agua_article')
check('el mapa / el día / la mano (irregular genders) are right', !articleMismatch(fold('el mapa')) && !articleMismatch(fold('el día')) && !articleMismatch(fold('la mano')))
check('la mapa / el mano are flagged', articleMismatch(fold('la mapa'))?.type === 'es_gender_article' && articleMismatch(fold('el mano'))?.type === 'es_gender_article')

// ser / estar where this level teaches it
errCase('es_answer_wellbeing', 'Soy bien', {}, 'es_ser_estar_feeling')
errCase('es_answer_wellbeing', 'Soy cansado', {}, 'es_ser_estar_feeling')
errCase('es_answer_wellbeing', 'Estoy bueno', {}, 'es_bien_bueno')
errCase('es_ask_wellbeing', '¿Cómo eres?', {}, 'es_ser_estar_question')
errCase('es_say_origin', 'Estoy de Chile', {}, 'es_ser_estar_origin')
errCase('es_ask_origin', '¿De dónde estás?', {}, 'es_ser_estar_origin_q')
errCase('es_identify_thing', 'Está un libro', { targetThing: 'libro' }, 'es_ser_estar_thing_answer')

// accents: completed, with the spelled form shown
{
  const r = E('es_ask_name', 'como te llamas')
  check('accentless "como te llamas" completes', r.completedObjective)
  check('...and shows "cómo te llamas"', r.spellingNote === 'cómo te llamas' && r.praiseKey === 'es.praise.accent')
  const y = E('es_reciprocal', 'bien, ¿y tu?')
  check('"y tu" at the end becomes "y tú"', y.completedObjective && y.spellingNote === 'bien, ¿y tú?')
  check('"tu nombre" is never accented', accentNote('¿Y tu nombre?', ['tú']) === null)
  const d = E('es_ask_origin', 'de donde eres')
  check('"de donde eres" → "de dónde eres"', d.completedObjective && d.spellingNote === 'de dónde eres')
  const already = E('es_ask_name', '¿Cómo te llamas?')
  check('a correctly accented answer gets no tip', already.completedObjective && already.spellingNote === null)
  check('a missing ¿ is never an error', E('es_ask_name', 'Cómo te llamas?').completedObjective)
}

// partial answers
errCase('es_introduce', 'Hola', {}, 'es_missing_name')
errCase('es_say_origin', 'Soy de', {}, 'es_missing_place')
errCase('es_express_dislike', 'Me gusta el café', { targetThing: 'cafe' }, 'es_missing_no')
{
  const digits = E('es_quantity', '2 cafés', { targetThing: 'cafe', targetCount: 2 })
  check('digits answer the question but earn no number-word evidence', digits.completedObjective && digits.targetEvidence === false)
}

// English replies
errCase('es_introduce', 'Hi, my name is Ana', {}, 'es_english_reply')
errCase('es_polite_request', 'A coffee please', { targetThing: 'cafe' }, 'es_english_reply')
errCase('es_repair', 'Can you repeat that please', { repairKind: 'repeat' }, 'es_english_reply')

// out of scope / ambiguous: not evaluable, nothing filed
neCase('es_express_like', 'El otro día fuimos a la playa con mis primos', { targetThing: 'cafe' })
neCase('es_introduce', 'Soy estudiante de medicina en la universidad')
neCase('es_identify_thing', 'Creo que es algo para escribir', { targetThing: 'libro' })
neCase('es_anything_else', 'Depende de lo que tengan hoy')
check('an unknown evalKind fails closed as not evaluable', evaluateSpanish('es_nope', 'hola').notEvaluable === true)
check('empty reply is not completed', E('es_greet', '   ').completedObjective === false)

// copied / assisted answers never count as independent
check('typing the shown model back is a copy', copiesShownModel('¿Cómo te llamas?', '¿Cómo te llamas?'))
check('...also without accents or punctuation', copiesShownModel('como te llamas', '¿Cómo te llamas?'))
check('...also with extra words around it', copiesShownModel('hola, buenos días, soy Ana, encantada', 'Buenos días, soy Ana'))
check('an own different sentence is not a copy', !copiesShownModel('Me llamo Ana', 'Buenos días, soy Ana.'))
check('a free reply with the suggestion used is not independent', isIndependentEvidence({ step: { type: 'free_reply' }, assistanceUsed: true }) === false)
check('recognising an option is not open evidence', isIndependentEvidence({ step: { type: 'choice' }, assistanceUsed: false }) === false)

// every error the evaluator can produce has an explanation
{
  const src = readFileSync(new URL('../src/learning/courses/es/evaluator.js', import.meta.url), 'utf8')
  const types = new Set([...src.matchAll(/miss\(r, '([a-z_]+)'/g)].map(m => m[1]))
  for (const k of ['repeat', 'slow_down', 'not_understand', 'ask_meaning', 'how_to_say']) types.add(`es_repair_other_${k}`)
  const missing = [...types].filter(t => !ES_COPY[`es.err.${t}`])
  check(`every error type has copy (missing: ${missing.join(', ')})`, missing.length === 0)
  const praises = new Set([...src.matchAll(/praise: '(es\.praise\.[a-z_]+)'/g)].map(m => m[1]))
  check('every praise key has copy', [...praises].every(p => ES_COPY[p]))
}

/* ================= C. journey ================= */
/*
 * The synthetic learner: an English speaker, name Ana. Each free reply is
 * first answered with a typical error (where the step has one), corrected,
 * then answered in their own words; recall steps unaided.
 */
const TYPICAL_ERROR = {
  es_introduce: 'Me llamo es Ana', es_ask_name: '¿Qué es tu nombre?', es_answer_wellbeing: 'Soy bien', es_ask_origin: '¿Dónde eres de?',
  es_say_origin: 'Estoy de Chile', es_express_like: 'Yo gusto la música', es_polite_request: 'Quiero un café', es_quantity: 'Dos café',
}
const model = createLearnerModel()
let ledger = createLedger({ startedAt: 0 })
let t0 = Date.UTC(2026, 10, 1, 9)
const englishBefore = JSON.stringify(planDay(model, episodesOfLevel('pre_a1'), { atMs: t0 }))
const englishScaffoldBefore = JSON.stringify(deriveInitialScaffold({ learnerModel: model, episodeId: 'first_greeting', atMs: t0 }).currentLevel)
let order = []
for (let day = 0; day < 20; day++) {
  const at = t0 + day * 86400000
  const plan = planDay(model, ES_SKELETON, { atMs: at })
  if (!plan.episodeId) break
  const ep = ES_EPISODES.find(e => e.id === plan.episodeId)
  order.push(ep.id)
  const run = beginEpisodeRun(model, ep.id, { source: 'practice', atMs: at })
  check(`${ep.id}: first run earns reward`, runEarnsReward(run.mode))
  let independentProduced = false
  for (const step of ep.steps) {
    if (step.type !== 'free_reply' && step.type !== 'recall') continue
    const ctx = { name: NAME, ...(step.courseContext || {}) }
    const wrong = TYPICAL_ERROR[step.evalKind]
    if (wrong && step.type === 'free_reply') {
      const r = evaluateSpanish(step.evalKind, wrong, ctx)
      check(`${ep.id}: typical error "${wrong}" is caught`, !r.completedObjective && !r.notEvaluable)
      ;(step.itemIds || []).forEach(id => recordItemAttempt(model, id, { correct: false, atMs: at }))
      markRecurringError(model, `es:${r.errorType}`, at)
    }
    const answer = step.type === 'recall' || !step.suggestionEn ? resolve(ownAnswer(step)) : resolve(step.suggestionEn)
    const r = evaluateSpanish(step.evalKind, answer, { ...ctx, independent: true })
    check(`${ep.id}: own answer "${answer}" accepted`, r.completedObjective)
    ;(step.itemIds || []).forEach(id => recordItemAttempt(model, id, { correct: true, independent: true, atMs: at }))
    independentProduced = true
  }
  setEpisodeState(model, ep.id, { status: 'completed', awarded: true, stepIndex: ep.steps.length - 1 })
  completeEpisodeRun(model, { canDoId: ep.canDoId, independentEvidence: independentProduced, rewarded: true, atMs: at, sessionId: `day-${day}` })
  const award = { id: `episode-award:${ep.id}`, kind: 'award', at, xp: ep.xp, grants: ep.gardenItems.map(id => ({ vocabId: id, word: id, kind: 'chunk' })) }
  ledger = addEvent(ledger, award)
  ledger = addEvent(ledger, award) // a second tab / retry: same id, paid once
}
function ownAnswer(step) {
  const own = {
    es_introduce: 'Hola, soy {name}.', es_ask_name: '¿Cómo te llamas?', es_answer_wellbeing: 'Estoy bien.', es_ask_wellbeing: '¿Qué tal?',
    es_say_origin: 'Soy de Chicago.', es_ask_origin: '¿De dónde eres?', es_goodbye: 'Hasta luego.', es_express_like: 'Me gusta la música.',
    es_want: 'Quiero agua.', es_quantity: null, es_ask_what: '¿Qué es esto?', es_identify_thing: null, es_polite_request: null, es_repair: null,
  }[step.evalKind]
  if (own) return own
  const c = step.courseContext || {}
  if (step.evalKind === 'es_quantity') return c.quantityForm === 'polite_request' ? `${['', 'un', 'dos', 'tres'][c.targetCount] || 'dos'} ${c.targetThing === 'cafe' ? (c.targetCount > 1 ? 'cafés' : 'café') : c.targetThing}, por favor` : 'Dos cafés'
  if (step.evalKind === 'es_identify_thing') return { libro: 'Es un libro', mesa: 'Es una mesa', telefono: 'Es un celular', llave: 'Es una llave' }[c.targetThing]
  if (step.evalKind === 'es_polite_request') return { cafe: 'Un café, por favor', te: 'Quisiera un té, por favor', agua: 'Un agua, por favor' }[c.targetThing]
  if (step.evalKind === 'es_repair') return { repeat: '¿Puedes repetir?', slow_down: 'Más despacio, por favor', not_understand: 'No entiendo', ask_meaning: `¿Qué significa ${c.meaningWord}?`, how_to_say: `¿Cómo se dice ${c.meaningWord}?` }[c.repairKind]
  return step.suggestionEn
}
check(`journey follows the designed order (${order.length}/12)`, JSON.stringify(order) === JSON.stringify(ES_SKELETON.map(e => e.id)))
check('journey completes the level', arcProgress(model, ES_SKELETON).completed === 12)
check('planner offers nothing more once done', planDay(model, ES_SKELETON, { atMs: t0 + 30 * 86400000 }).episodeId == null)
{
  const snap = deriveSnapshot(ledger)
  const xp = ES_SKELETON.reduce((a, e) => a + e.xp, 0)
  check(`XP paid once per episode (${snap.xp} = ${xp})`, snap.xp === xp)
  check('Garden got the Spanish words, once each', snap.learnedItems.filter(i => i.vocabId.startsWith('es:')).length === new Set(ES_SKELETON.flatMap(e => e.gardenItems)).size)
}
check('delayed retrieval: the first skill reached can_use', model.languageItems['es:me_llamo']?.learningState === 'can_use')
check('Spanish can-dos recorded under es: ids', Object.keys(model.canDo || {}).filter(k => k.startsWith('es:')).length >= 10)
{
  const replay = beginEpisodeRun(model, 'es:hola', { source: 'practice', atMs: t0 + 25 * 86400000 })
  check('replaying a finished episode never earns reward again', !runEarnsReward(replay.mode))
}

/* ================= D. isolation ================= */
check('English plan unchanged by the whole Spanish journey', JSON.stringify(planDay(model, episodesOfLevel('pre_a1'), { atMs: t0 })) === englishBefore)
check('English episode support unchanged by Spanish errors', JSON.stringify(deriveInitialScaffold({ learnerModel: model, episodeId: 'first_greeting', atMs: t0 }).currentLevel) === englishScaffoldBefore)
{
  const later = t0 + 60 * 86400000
  const esDue = getDueReviews(model, later, { courseId: 'es' })
  const enDue = getDueReviews(model, later)
  check('Spanish reviews come due in the Spanish course', esDue.length > 0 && esDue.every(id => id.startsWith('es:')))
  check('no Spanish review ever appears in the English course', enDue.every(id => !id.includes(':')))
  const enSummary = learnerSummary(model, later)
  const esSummary = learnerSummary(model, later, { courseId: 'es' })
  check('English summary counts no Spanish words', enSummary.words.canUse === 0 && enSummary.words.practicing === 0)
  check('Spanish summary counts the Spanish words', esSummary.words.canUse > 0)
  check('Spanish summary has no English Pre-A1 readiness', esSummary.focus == null)
}
{
  const both = createLearnerModel()
  recordItemAttempt(both, 'im', { correct: true, independent: true })
  recordItemAttempt(both, 'im', { correct: true, independent: true })
  check('an English skill is not a Spanish skill', both.languageItems.im.learningState === 'can_use' && !both.languageItems['es:me_llamo'])
  for (let i = 0; i < 6; i++) markRecurringError(both, 'missing_copula')
  const esLevel = deriveInitialScaffold({ learnerModel: both, episodeId: 'es:hola', episode: ES_EPISODES[0] }).reasonCodes
  check('English errors do not add Spanish support reasons', !esLevel.includes('recent_retries'))
}
check('course of an id: prefix or English', courseIdOf('es:hola') === 'es' && courseIdOf('first_greeting') === 'en' && courseIdOf('xx:thing') === 'en' && courseIdOf(null) === 'en')
check('belongsToCourse is exclusive', belongsToCourse('es:x', 'es') && !belongsToCourse('es:x', 'en') && belongsToCourse('im', 'en') && !belongsToCourse('im', 'es'))

/* ================= E. gating ================= */
check('a Spanish episode can be opened', episodeRequest({ episodeId: 'es:hola' }).ok === true)
check('an unknown Spanish id is refused', episodeRequest({ episodeId: 'es:nope' }).reason === 'unknown_episode')
check('an English Pre-A1 episode still opens', episodeRequest({ episodeId: 'first_greeting' }).ok === true)
{
  const a1 = episodesOfLevel('a1')[0]
  check('A1 stays closed to learners', a1 && episodeRequest({ episodeId: a1.id }).reason === 'level_unavailable')
}
check('Spanish is offered to English speakers', isCourseOffered('es', 'en') && isCourseOffered('es', { base: 'en', code: 'en-US' }))
check('Spanish is not offered with Spanish explanations', !isCourseOffered('es', 'es'))
check('Spanish is not offered in languages it has no copy for', ['ja', 'ar', 'fr', 'de', 'it', 'pt'].every(l => !isCourseOffered('es', l)))
check('English stays offered to every supported language', ['en', 'es', 'ja', 'ar', 'fr', 'de', 'it', 'pt'].every(l => isCourseOffered('en', l)))
check('a Spanish speaker sees only one course', offeredCourses('es').join() === 'en')
check('registry lists exactly en and es', Object.keys(COURSES).join() === 'en,es')
check('course skeleton for English is empty (English uses levels.js)', courseSkeleton('en').length === 0)
check('course request for an English id refuses', courseEpisodeRequest('first_greeting').ok === false)

/* ================= F. migration ================= */
{
  const legacy = { version: 3, languageItems: { im: { status: 'learning', correct: 1, incorrect: 0 } }, episodes: { first_greeting: { status: 'completed', awarded: true } }, canDo: {} }
  const migrated = migrateLearnerModel(JSON.parse(JSON.stringify(legacy)))
  check('a pre-course model keeps its English item', migrated.languageItems.im?.correct === 1)
  check('a pre-course model keeps its English episode', getEpisodeState(migrated, 'first_greeting').status === 'completed')
  check('a pre-course model starts the Spanish course fresh', getEpisodeState(migrated, 'es:hola').status === 'new')
}
{
  const mem = new Map()
  const store = { getItem: k => (mem.has(k) ? mem.get(k) : null) }
  check('no stored course reads as English', readActiveCourse('en', store) === 'en')
  mem.set(ACTIVE_COURSE_KEY, 'es')
  check('a stored Spanish choice is read', readActiveCourse('en', store) === 'es')
  check('...but not for a learner whose language it cannot be taught in', readActiveCourse('ja', store) === 'en')
  mem.set(ACTIVE_COURSE_KEY, 'klingon')
  check('an unknown stored course reads as English', readActiveCourse('en', store) === 'en')
  check('the course key lives in the account namespace (lc2-)', ACTIVE_COURSE_KEY.startsWith('lc2-'))
}

console.log(`check-es-course: ${passed} passed, ${failures.length} failed`)
if (failures.length) {
  for (const f of failures.slice(0, 40)) console.log('  FAIL: ' + f)
  process.exit(1)
}
assert.ok(passed > 150)
