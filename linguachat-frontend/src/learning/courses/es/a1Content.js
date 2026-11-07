/*
 * Spanish A1, arcs 1 and 2 — episodes (lazy chunk, CLOSED, no human review).
 *
 * Same engine as Pre-A1: same step types, same evaluator, same player. The
 * learner meets the present tense with yo/tú, and the mistakes that matter here
 * are the ones English speakers really make: the infinitive for everything, "soy
 * trabajo", an article before a profession.
 */
import { ES_A1_HOME_COPY, ES_A1_SKELETON, ES_A1_VOCAB } from './a1Skeleton.js'
import { buildCourseEpisode, validateCourseEpisode } from '../transform.js'
import { evaluateSpanish, fold, ES_EVAL_KINDS } from './evaluator.js'
import { ES_EVALUATOR_COPY } from './evaluatorCopy.js'

const AUTHORED = [
  {
    id: 'a1:trabajo_estudio',
    steps: [
      { type: 'scene', mood: 'welcoming', showGoal: true, title: 'What do you do?', body: 'Carmen, from Spain, is new at your language class. Today you’ll tell her what you do.', ctaKey: 'ep1Continue' },
      { type: 'model', target: 'Trabajo en una oficina.', meaning: ['a1:trabajo', 'a1:en_una_oficina'], explain: 'Trabajo = I work. Spanish doesn’t need “yo”: the -o already says “I”.' },
      { type: 'comprehension', instruction: 'What does Carmen say?', target: 'Estudio en la universidad.', item: 'a1:estudio',
        options: [{ label: 'She studies at university.', correct: true }, { label: 'She works at a university.' }, { label: 'She lives near a university.' }] },
      { type: 'fill_blank', instruction: 'Fill the gap: “I work in an office.”', hint: 'The “I” form ends in -o.', placeholder: 'missing word', item: 'a1:trabajo', before: '', after: ' en una oficina.', expects: 'Trabajo' },
      { type: 'word_order', instruction: 'Build the sentence: “I study at home.”', hint: 'Verb first.', item: 'a1:estudio', tokens: ['Estudio', 'en', 'casa.'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿Trabajas o estudias?', instruction: 'Tell Carmen what you do. Anything simple is fine.', eval: 'es_a1_say_life', suggestion: 'Trabajo en una oficina.', items: ['a1:trabajo'] },
      { type: 'free_reply', variation: true, scene: 'Hola, ¿y tú qué haces?', instruction: 'Someone at a party asks what you do. Answer in a new way.', eval: 'es_a1_say_life', suggestion: 'Estudio en la universidad.', items: ['a1:estudio'] },
      { type: 'recall', instruction: 'From memory: say what you do, in Spanish.', eval: 'es_a1_say_life', items: ['a1:trabajo'] },
      { type: 'completion', title: '¡Muy bien!', body: 'You can say what you do. Next: asking other people.', cta: 'Finish' },
    ],
  },
  {
    id: 'a1:y_tu_trabajas',
    steps: [
      { type: 'recall', review: true, instruction: 'Warm-up: say what you do.', eval: 'es_a1_say_life', items: ['a1:trabajo'] },
      { type: 'model', target: '¿Trabajas?', response: 'Sí, trabajo en un hospital.', meaning: ['a1:trabajas'], explain: 'To ask “you”, the verb ends in -as: trabajas, estudias. Spanish needs no “do”.' },
      { type: 'comprehension', instruction: 'What is this question about?', target: '¿En qué trabajas?', item: 'a1:en_que_trabajas',
        options: [{ label: 'What you do for work.', correct: true }, { label: 'Where you live.' }, { label: 'When you work.' }] },
      { type: 'word_order', instruction: 'Build the question: “What do you do for work?”', hint: 'Start with “en”.', item: 'a1:en_que_trabajas', tokens: ['¿En', 'qué', 'trabajas?'] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Yo trabajo en una escuela. ¿Y tú?', instruction: 'Answer, and then Lingua will ask you to ask back.', eval: 'es_a1_say_life', suggestion: 'Yo estudio en casa.', items: ['a1:estudio'] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Soy Diego.', instruction: 'Ask Diego if he works or what he does.', eval: 'es_a1_ask_life', suggestion: '¿Trabajas?', items: ['a1:trabajas'] },
      { type: 'free_reply', variation: true, scene: 'Una estudiante nueva se sienta contigo.', instruction: 'A new classmate sits next to you. Ask if she studies.', eval: 'es_a1_ask_life', suggestion: '¿Estudias?', items: ['a1:estudias'] },
      { type: 'recall', instruction: 'From memory: ask someone what they do for work.', eval: 'es_a1_ask_life', items: ['a1:en_que_trabajas'] },
      { type: 'completion', title: '¡Bien hecho!', body: 'You can ask about someone’s life. Next: where you live.', cta: 'Finish' },
    ],
  },
  {
    id: 'a1:donde_vives',
    steps: [
      { type: 'recall', review: true, instruction: 'Warm-up: ask someone if they work.', eval: 'es_a1_ask_life', items: ['a1:trabajas'] },
      { type: 'model', target: 'Vivo en Chicago.', meaning: ['a1:vivo_en'], explain: 'Vivo en… = I live in… It’s always “en” for the place.' },
      { type: 'comprehension', instruction: 'What does “¿Dónde vives?” ask?', target: '¿Dónde vives?', item: 'a1:donde_vives',
        options: [{ label: 'Where you live.', correct: true }, { label: 'Where you are from.' }, { label: 'Where you work.' }] },
      { type: 'fill_blank', instruction: 'Fill the gap.', hint: 'The place word.', placeholder: 'missing word', item: 'a1:vivo_en', before: 'Vivo', after: ' Madrid.', expects: 'en' },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿Dónde vives?', instruction: 'Tell Lingua where you live. A city is enough; you don’t need a real address.', eval: 'es_a1_say_live', suggestion: 'Vivo en Chicago.', items: ['a1:vivo_en'] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Soy de Chile.', instruction: 'Ask where she lives now.', eval: 'es_a1_ask_live', suggestion: '¿Dónde vives?', items: ['a1:donde_vives'] },
      { type: 'free_reply', variation: true, scene: '¿Vives aquí?', instruction: 'A neighbour asks if you live here. Say where you live.', eval: 'es_a1_say_live', suggestion: 'Sí, vivo aquí.', items: ['a1:vivo_en'] },
      { type: 'recall', instruction: 'From memory: ask someone where they live.', eval: 'es_a1_ask_live', items: ['a1:donde_vives'] },
      { type: 'completion', title: '¡Felicidades!', body: 'You can talk about your life in the present tense.', cta: 'Finish' },
    ],
  },
  {
    id: 'a1:mi_dia',
    steps: [
      { type: 'recall', review: true, instruction: 'Warm-up: say where you live.', eval: 'es_a1_say_live', items: ['a1:vivo_en'] },
      { type: 'scene', mood: 'welcoming', title: 'Your morning', body: 'Mateo, from Argentina, tells you about his morning. Some verbs take “me”: me levanto = I get up.', ctaKey: 'ep1Continue' },
      { type: 'model', target: 'Me levanto a las siete y desayuno.', meaning: ['a1:me_levanto', 'a1:desayuno'], explain: 'Me levanto = I get up (literally “I raise myself”). Desayuno = I have breakfast: one verb, no “have”.' },
      { type: 'comprehension', instruction: 'What does Mateo do first?', target: 'Me levanto, desayuno y voy al trabajo.', item: 'a1:me_levanto',
        options: [{ label: 'He gets up.', correct: true }, { label: 'He has lunch.' }, { label: 'He goes to bed.' }] },
      { type: 'fill_blank', instruction: 'Fill the gap: “I get up early.”', hint: 'This verb needs “me”.', placeholder: 'missing word', item: 'a1:me_levanto', before: 'Me', after: ' temprano.', expects: 'levanto' },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿Qué haces por la mañana?', instruction: 'Say one or two things you do in the morning.', eval: 'es_a1_say_routine', suggestion: 'Me levanto y desayuno.', items: ['a1:me_levanto'] },
      { type: 'free_reply', variation: true, scene: '¿Y al mediodía?', instruction: 'Now say what you do at midday.', eval: 'es_a1_say_routine', suggestion: 'Como en casa.', items: ['a1:como'] },
      { type: 'recall', instruction: 'From memory: say what you do in the morning.', eval: 'es_a1_say_routine', items: ['a1:desayuno'] },
      { type: 'completion', title: '¡Muy bien!', body: 'You can describe your morning. Next: at what time.', cta: 'Finish' },
    ],
  },
  {
    id: 'a1:a_las_siete',
    steps: [
      { type: 'recall', review: true, instruction: 'Warm-up: say what you do in the morning.', eval: 'es_a1_say_routine', items: ['a1:me_levanto'] },
      { type: 'model', target: 'Me levanto a las siete.', response: '¿A qué hora desayunas?', meaning: ['a1:a_las', 'a1:que_hora'], explain: 'A las + number: a las siete. One o’clock is singular: a la una. To ask: ¿A qué hora…?' },
      { type: 'comprehension', instruction: 'When does Carmen have lunch?', target: 'Como a las dos.', item: 'a1:a_las',
        options: [{ label: 'At two.', correct: true }, { label: 'At twelve.' }, { label: 'Two times a day.' }] },
      { type: 'word_order', instruction: 'Build the question: “At what time do you get up?”', hint: 'Start with “¿A”.', item: 'a1:que_hora', tokens: ['¿A', 'qué', 'hora', 'te', 'levantas?'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿A qué hora te levantas?', instruction: 'Say at what time you get up.', eval: 'es_a1_say_time', suggestion: 'Me levanto a las siete.', items: ['a1:a_las'] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Yo desayuno a las ocho.', instruction: 'Ask Lingua at what time she has lunch.', eval: 'es_a1_ask_time', suggestion: '¿A qué hora comes?', items: ['a1:que_hora'] },
      { type: 'free_reply', variation: true, scene: '¿Y a qué hora comes?', instruction: 'Say when you have lunch. Try one o’clock.', eval: 'es_a1_say_time', suggestion: 'Como a la una.', items: ['a1:a_la_una'] },
      { type: 'recall', instruction: 'From memory: ask someone at what time they get up.', eval: 'es_a1_ask_time', items: ['a1:que_hora'] },
      { type: 'completion', title: '¡Bien hecho!', body: 'You can say and ask the time of things. Next: days of the week.', cta: 'Finish' },
    ],
  },
  {
    id: 'a1:los_lunes',
    steps: [
      { type: 'recall', review: true, instruction: 'Warm-up: say at what time you get up.', eval: 'es_a1_say_time', items: ['a1:a_las'] },
      { type: 'model', target: 'Los lunes trabajo. El viernes voy al cine.', meaning: ['a1:los_lunes', 'a1:el_viernes'], explain: 'Days need no “on”: los lunes = on Mondays (every Monday), el viernes = on Friday (this one). Days are not capitalised.' },
      { type: 'comprehension', instruction: 'What does “los sábados” mean?', target: 'Los sábados juego al fútbol.', item: 'a1:los_lunes',
        options: [{ label: 'Every Saturday.', correct: true }, { label: 'Only this Saturday.' }, { label: 'Some Saturdays, in the past.' }] },
      { type: 'model', target: 'Siempre desayuno. Nunca como carne.', meaning: ['a1:siempre_nunca'], explain: 'Siempre = always. Nunca = never; with nunca first, no “no” is needed.' },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿Qué haces los lunes?', instruction: 'Say what you do on Mondays.', eval: 'es_a1_say_days', suggestion: 'Los lunes trabajo.', items: ['a1:los_lunes'] },
      { type: 'free_reply', variation: true, scene: '¿Y el fin de semana?', instruction: 'Say what you do on Saturdays or Sundays.', eval: 'es_a1_say_days', suggestion: 'Los domingos descanso.', items: ['a1:los_lunes'] },
      { type: 'recall', instruction: 'From memory: say one thing you do on a day of the week.', eval: 'es_a1_say_days', items: ['a1:el_viernes'] },
      { type: 'completion', title: '¡Felicidades!', body: 'You can talk about your week. This closes the second arc of A1.', cta: 'Finish' },
    ],
  },
]

const AUX = 'en'
const COPY = { ...ES_A1_HOME_COPY[AUX], ...ES_EVALUATOR_COPY[AUX] }
const VOCAB_BY_ID = Object.fromEntries(ES_A1_VOCAB.map(item => [item.id, item]))
const compareFill = (typed, want) => fold(typed) === fold(want)
const RUNTIME = Object.freeze({ courseId: 'es', targetLanguage: 'es', auxLanguage: AUX, copy: COPY, vocab: VOCAB_BY_ID, evaluate: evaluateSpanish, compareFill })

const BY_ID = new Map(AUTHORED.map(authored => {
  const meta = ES_A1_SKELETON.find(e => e.id === `es:${authored.id}`)
  const episode = buildCourseEpisode({ courseId: 'es', meta, authored, aux: AUX, copy: COPY })
  return [episode.id, { ...episode, runtime: RUNTIME }]
}))

export const ES_A1_EPISODES = [...BY_ID.values()]
export const getEpisode = (id) => BY_ID.get(id) || null

export function validateSpanishA1() {
  const vocabIds = new Set(Object.keys(VOCAB_BY_ID))
  const problems = []
  if (ES_A1_EPISODES.length !== ES_A1_SKELETON.length) problems.push('skeleton and content differ')
  for (const episode of ES_A1_EPISODES) problems.push(...validateCourseEpisode(episode, { copy: COPY, evalKinds: ES_EVAL_KINDS, vocabIds, courseId: 'es' }))
  return problems
}

export { COPY as ES_A1_COPY }
