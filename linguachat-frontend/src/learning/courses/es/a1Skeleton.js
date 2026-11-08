/*
 * Spanish A1 — metadata of the first two arcs (CLOSED).
 *
 * `docs/curriculum/es-a1-design.md` proposes six arcs; `es_a1_vida` and `es_a1_dia`
 * are built (six lessons of twenty). No human review. The level stays
 * `available: false` in the registry: a learner
 * asking for these episodes gets `level_unavailable` before any content loads.
 *
 * Ids use the level form `es:a1:…` (curriculumIdentity.js), so nothing here can
 * collide with Pre-A1's `es:…`.
 */
export const ES_A1_LEVEL = 'ES-A1'

const scoped = (id) => `es:a1:${id}`
const ep = (id, canDoId, prerequisites, estimatedMinutes, xp, gardenItems, arc = 'es_a1_vida') => ({
  id: scoped(id),
  arc,
  level: ES_A1_LEVEL,
  canDoId: scoped(canDoId),
  titleKey: `es.a1.${id}.title`,
  goalKey: `es.a1.${id}.goal`,
  canDoNameKey: `es.a1.${id}.canDo`,
  estimatedMinutes,
  xp,
  prerequisites: prerequisites.map(scoped),
  gardenItems: gardenItems.map(scoped),
  sourceEpisodes: [],
})

export const ES_A1_SKELETON = [
  ep('trabajo_estudio', 'talk_about_life', [], 9, 60, ['trabajo', 'estudio', 'en_una_oficina']),
  ep('y_tu_trabajas', 'ask_about_life', ['trabajo_estudio'], 9, 60, ['trabajas', 'estudias', 'en_que_trabajas']),
  ep('donde_vives', 'talk_about_life', ['y_tu_trabajas'], 9, 60, ['vivo_en', 'donde_vives']),
  ep('mi_dia', 'talk_about_routine', ['donde_vives'], 10, 65, ['me_levanto', 'desayuno', 'como'], 'es_a1_dia'),
  ep('a_las_siete', 'say_when', ['mi_dia'], 9, 60, ['a_las', 'a_la_una', 'que_hora'], 'es_a1_dia'),
  ep('los_lunes', 'say_when', ['a_las_siete'], 9, 60, ['los_lunes', 'el_viernes', 'siempre_nunca'], 'es_a1_dia'),
]

export const ES_A1_SKELETON_BY_ID = Object.fromEntries(ES_A1_SKELETON.map(e => [e.id, e]))

const word = (id, term, kind, en) => ({ id: scoped(id), term, kind, meaning: { en } })

export const ES_A1_VOCAB = [
  word('trabajo', 'trabajo', 'pattern', 'I work'),
  word('estudio', 'estudio', 'pattern', 'I study'),
  word('en_una_oficina', 'en una oficina', 'phrase', 'in an office'),
  word('trabajas', '¿trabajas?', 'pattern', 'do you work?'),
  word('estudias', '¿estudias?', 'pattern', 'do you study?'),
  word('en_que_trabajas', '¿en qué trabajas?', 'pattern', 'what do you do for work?'),
  word('vivo_en', 'vivo en…', 'pattern', 'I live in…'),
  word('donde_vives', '¿dónde vives?', 'pattern', 'where do you live?'),
  word('me_levanto', 'me levanto', 'pattern', 'I get up'),
  word('desayuno', 'desayuno', 'pattern', 'I have breakfast'),
  word('como', 'como', 'pattern', 'I eat (lunch)'),
  word('a_las', 'a las…', 'pattern', 'at … o’clock'),
  word('a_la_una', 'a la una', 'phrase', 'at one o’clock'),
  word('que_hora', '¿a qué hora…?', 'pattern', 'at what time…?'),
  word('los_lunes', 'los lunes', 'phrase', 'on Mondays'),
  word('el_viernes', 'el viernes', 'phrase', 'on Friday'),
  word('siempre_nunca', 'siempre / nunca', 'pattern', 'always / never'),
]

export const ES_A1_VOCAB_BY_ID = Object.fromEntries(ES_A1_VOCAB.map(item => [item.id, item]))

export const ES_A1_HOME_COPY = {
  en: {
    'es.a1.trabajo_estudio.title': 'Work or study', 'es.a1.trabajo_estudio.goal': 'Say what you do.', 'es.a1.trabajo_estudio.canDo': 'Talk about my life',
    'es.a1.y_tu_trabajas.title': 'And you?', 'es.a1.y_tu_trabajas.goal': 'Ask someone what they do.', 'es.a1.y_tu_trabajas.canDo': 'Ask about someone’s life',
    'es.a1.donde_vives.title': 'Where you live', 'es.a1.donde_vives.goal': 'Say where you live and ask back.', 'es.a1.donde_vives.canDo': 'Talk about my life',
    'es.a1.mi_dia.title': 'My day', 'es.a1.mi_dia.goal': 'Say what you do in the morning.', 'es.a1.mi_dia.canDo': 'Talk about my routine',
    'es.a1.a_las_siete.title': 'At seven', 'es.a1.a_las_siete.goal': 'Say and ask at what time.', 'es.a1.a_las_siete.canDo': 'Say when I do things',
    'es.a1.los_lunes.title': 'On Mondays', 'es.a1.los_lunes.goal': 'Say which days and how often.', 'es.a1.los_lunes.canDo': 'Say when I do things',
  },
}
