/*
 * Spanish A1 — metadata of the first arc (CLOSED).
 *
 * `docs/curriculum/es-a1-design.md` proposes six arcs; only `es_a1_vida` is built,
 * so the engine can be proved on a second level before more is written. It has no
 * human review. The level stays `available: false` in the registry: a learner
 * asking for these episodes gets `level_unavailable` before any content loads.
 *
 * Ids use the level form `es:a1:…` (curriculumIdentity.js), so nothing here can
 * collide with Pre-A1's `es:…`.
 */
export const ES_A1_LEVEL = 'ES-A1'

const scoped = (id) => `es:a1:${id}`
const ep = (id, canDoId, prerequisites, estimatedMinutes, xp, gardenItems) => ({
  id: scoped(id),
  arc: 'es_a1_vida',
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
]

export const ES_A1_VOCAB_BY_ID = Object.fromEntries(ES_A1_VOCAB.map(item => [item.id, item]))

export const ES_A1_HOME_COPY = {
  en: {
    'es.a1.trabajo_estudio.title': 'Work or study', 'es.a1.trabajo_estudio.goal': 'Say what you do.', 'es.a1.trabajo_estudio.canDo': 'Talk about my life',
    'es.a1.y_tu_trabajas.title': 'And you?', 'es.a1.y_tu_trabajas.goal': 'Ask someone what they do.', 'es.a1.y_tu_trabajas.canDo': 'Ask about someone’s life',
    'es.a1.donde_vives.title': 'Where you live', 'es.a1.donde_vives.goal': 'Say where you live and ask back.', 'es.a1.donde_vives.canDo': 'Talk about my life',
  },
}
