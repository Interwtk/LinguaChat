/*
 * Spanish evaluator — the local, deterministic judge for the Spanish course.
 *
 * Same result shape as the English evaluator (responseEvaluation.js `base()`),
 * so EpisodeShell treats both alike. Three rules shape every function here:
 *
 *   1. PRECISION OVER COVERAGE. A reply this file cannot read with confidence
 *      is `notEvaluable` — the learner is shown the pattern again, and nothing
 *      is recorded against them. It is never "corrected" into a mistake.
 *   2. VARIANTS ARE NOT ERRORS. Spain and Latin America both count (vos,
 *      ¿mande?, móvil/celular, ordenador/computadora, ¿me pone…?). The model
 *      answer is one natural form, not the only right one.
 *   3. ACCENTS ARE TAUGHT, NOT PUNISHED. Typing "como estas" for "¿cómo estás?"
 *      completes the objective; the praise carries the spelled version so the
 *      learner sees it. A missing ¿ is never an error.
 *
 * Grammar that is checked at this level: gender of the article on nouns this
 * file knows (never on a noun it does not), ser/estar where the episode
 * teaches it (how you are vs where you are from), gustar's structure, number
 * agreement for 1–10, and a few calques English speakers reliably produce
 * ("¿qué es tu nombre?", "¿dónde eres de?", "me llamo es…").
 */

const ACCENT_MAP = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', à: 'a', è: 'e', ì: 'i', ò: 'o', ù: 'u' }

/* Lowercase, keep letters (accents and ñ included), digits and spaces. */
export function plain(text) {
  return String(text || '')
    .replace(/[’‘‛`´]/g, "'")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    // chat spelling: "holaaa", "graciaaas" — no Spanish word has a letter three times
    .replace(/(\p{L})\1{2,}/gu, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/* `plain` without accent marks — ñ is a letter of its own and stays. */
export function fold(text) {
  return plain(text).replace(/[áéíóúüàèìòù]/g, ch => ACCENT_MAP[ch])
}

const words = (f) => (f ? f.split(' ') : [])

/* Same as the English `base()`, plus the two Spanish-course fields. */
const base = (independent) => ({
  source: 'deterministic',
  targetLanguage: 'es',
  understood: true,
  completedObjective: false,
  acceptedVariant: false,
  confidence: 0.9,
  conclusive: true,
  notEvaluable: false,
  spellingNote: null,
  errorType: null,
  priorityCorrection: null,
  explanation: null,
  naturalVersion: null,
  retryRequired: false,
  retryPrompt: null,
  praiseKey: null,
  masteryEvidence: { independent: Boolean(independent), scaffoldUsed: !independent },
  registerAppropriateness: { checked: false, appropriate: null, expectedRegister: null, detectedRegister: null },
  discourseCoherence: { checked: false, coherent: null, clausesEvaluated: null, incoherenceType: null },
  conversationStateTracking: { checked: false, correct: null, failureType: null },
})

function ok(r, raw, { praise, variant = false, accents = [] } = {}) {
  r.completedObjective = true
  r.confidence = 0.95
  r.acceptedVariant = Boolean(variant)
  const note = accentNote(raw, accents)
  if (note) { r.spellingNote = note; r.praiseKey = 'es.praise.accent' } else {
    r.praiseKey = r.masteryEvidence.independent ? 'es.praise.independent' : (praise || 'es.praise.good')
  }
  return r
}

function miss(r, errorType, { conclusive = true, confidence = 0.88 } = {}) {
  return {
    ...r, errorType, conclusive, confidence,
    explanation: `es.err.${errorType}`, priorityCorrection: `es.err.${errorType}`,
    retryRequired: true, retryPrompt: 'es.retry.prompt',
  }
}

/* A reply this evaluator cannot judge: shown the pattern, never marked wrong. */
function notEvaluable(r) {
  return {
    ...r, understood: false, notEvaluable: true, conclusive: false, confidence: 0.4,
    errorType: 'es_not_evaluable', explanation: 'es.err.es_not_evaluable', priorityCorrection: null,
    retryRequired: true, retryPrompt: 'es.retry.prompt',
  }
}

function empty(r) {
  return { ...r, understood: false, confidence: 0.95, errorType: 'empty', explanation: 'es.err.empty', retryRequired: true, retryPrompt: 'es.retry.prompt' }
}

/*
 * The learner's own sentence with the accents it is missing, or null.
 * Only words the matched pattern made unambiguous are checked: "tu" is "tú"
 * only at the end of "¿y tú?", never in "tu nombre".
 */
export function accentNote(raw, canonical) {
  if (!canonical || !canonical.length) return null
  const want = new Map(canonical.map(c => [fold(c), c]))
  const tokens = String(raw || '').split(/(\s+)/)
  const lastWordIndex = tokens.map((t, i) => (/\S/.test(t) ? i : -1)).filter(i => i >= 0).pop()
  let changed = false
  const out = tokens.map((tok, i) => {
    const core = tok.replace(/^[¿¡"'(]+|[?!.,;:"')]+$/g, '')
    if (!core) return tok
    const key = fold(core)
    const canon = want.get(key)
    if (!canon || core.toLowerCase() === canon) return tok
    if (canon === 'tú' && i !== lastWordIndex) return tok
    // "te" is a pronoun ("¿te gusta?"); only after these words is it the drink
    const before = tokens.slice(0, i).filter(t => /\S/.test(t)).pop() || ''
    if (canon === 'té' && !/^(un|el|del|al|mi|tu|su|de|con|o|y)$/i.test(fold(before))) return tok
    if (core.toLowerCase().replace(/[áéíóúü]/g, ch => ACCENT_MAP[ch]) !== core.toLowerCase()) return tok
    changed = true
    const fixed = core[0] === core[0].toUpperCase() ? canon[0].toUpperCase() + canon.slice(1) : canon
    return tok.replace(core, fixed)
  })
  return changed ? out.join('') : null
}

/* ---------- lexicon ---------- */

/*
 * Nouns this level can judge, by folded singular. `stressedA` nouns are
 * feminine but take el/un in the singular (el agua). Regional words are
 * separate entries: both are right.
 */
const N = (g, sg, extra = {}) => ({ g, sg, ...extra })
export const NOUNS = {
  cafe: N('m', 'café'), te: N('m', 'té'), agua: N('f', 'agua', { stressedA: true }), leche: N('f', 'leche'),
  jugo: N('m', 'jugo'), zumo: N('m', 'zumo'), cerveza: N('f', 'cerveza'), vino: N('m', 'vino'), refresco: N('m', 'refresco'),
  sandwich: N('m', 'sándwich', { pl: 'sándwiches' }), bocadillo: N('m', 'bocadillo'), pan: N('m', 'pan', { pl: 'panes' }),
  galleta: N('f', 'galleta'), torta: N('f', 'torta'), pastel: N('m', 'pastel', { pl: 'pasteles' }), helado: N('m', 'helado'),
  medialuna: N('f', 'medialuna'), croissant: N('m', 'croissant', { pl: 'croissants' }), empanada: N('f', 'empanada'),
  tostada: N('f', 'tostada'), sopa: N('f', 'sopa'), ensalada: N('f', 'ensalada'), pizza: N('f', 'pizza'), fruta: N('f', 'fruta'),
  manzana: N('f', 'manzana'), chocolate: N('m', 'chocolate'), comida: N('f', 'comida'), cuenta: N('f', 'cuenta'),
  musica: N('f', 'música'), futbol: N('m', 'fútbol'), cine: N('m', 'cine'), pelicula: N('f', 'película'), playa: N('f', 'playa'),
  libro: N('m', 'libro'), mesa: N('f', 'mesa'), silla: N('f', 'silla'), telefono: N('m', 'teléfono'), celular: N('m', 'celular', { pl: 'celulares' }),
  movil: N('m', 'móvil', { pl: 'móviles' }), llave: N('f', 'llave'), boligrafo: N('m', 'bolígrafo'), boli: N('m', 'boli'),
  lapicera: N('f', 'lapicera'), pluma: N('f', 'pluma'), lapiz: N('m', 'lápiz', { pl: 'lápices' }), computadora: N('f', 'computadora'),
  ordenador: N('m', 'ordenador', { pl: 'ordenadores' }), computador: N('m', 'computador', { pl: 'computadores' }), mochila: N('f', 'mochila'),
  botella: N('f', 'botella'), vaso: N('m', 'vaso'), taza: N('f', 'taza'), ayuda: N('f', 'ayuda'), mapa: N('m', 'mapa'),
  dia: N('m', 'día'), problema: N('m', 'problema'), mano: N('f', 'mano'), foto: N('f', 'foto'), perro: N('m', 'perro'), gato: N('m', 'gato'),
  casa: N('f', 'casa'), ciudad: N('f', 'ciudad', { pl: 'ciudades' }), clase: N('f', 'clase'), bano: N('m', 'baño'), idioma: N('m', 'idioma'),
  arte: N('m', 'arte'), deporte: N('m', 'deporte'), viaje: N('m', 'viaje'), trabajo: N('m', 'trabajo'), tarea: N('f', 'tarea'),
}

const pluralOf = (noun) => noun.pl || (/[aeiouáéíóú]$/.test(noun.sg) ? `${noun.sg}s` : `${noun.sg}es`)

/* folded form → { key, plural } */
const NOUN_FORMS = new Map()
for (const [key, noun] of Object.entries(NOUNS)) {
  NOUN_FORMS.set(fold(noun.sg), { key, plural: false })
  NOUN_FORMS.set(fold(pluralOf(noun)), { key, plural: true })
}

/* The same object named regionally: every member is right. */
export const SYNONYMS = {
  boligrafo: ['boligrafo', 'boli', 'lapicera', 'pluma'],
  telefono: ['telefono', 'celular', 'movil'],
  computadora: ['computadora', 'ordenador', 'computador'],
  jugo: ['jugo', 'zumo'],
  sandwich: ['sandwich', 'bocadillo'],
  pastel: ['pastel', 'torta'],
}
const conceptOf = (key) => Object.keys(SYNONYMS).find(c => SYNONYMS[c].includes(key)) || key

export const nounForm = (folded) => NOUN_FORMS.get(folded) || null
export const nounKeyOf = (word) => nounForm(fold(word))?.key || null

const ARTICLES = { el: ['m', false, 'def'], la: ['f', false, 'def'], los: ['m', true, 'def'], las: ['f', true, 'def'], un: ['m', false, 'ind'], una: ['f', false, 'ind'], unos: ['m', true, 'ind'], unas: ['f', true, 'ind'] }

/* The article a known noun takes, e.g. ('cafe', 'def') → 'el'. */
export function articleFor(key, kind = 'def', plural = false) {
  const noun = NOUNS[key]
  if (!noun) return null
  if (plural) return kind === 'def' ? (noun.g === 'f' ? 'las' : 'los') : (noun.g === 'f' ? 'unas' : 'unos')
  if (noun.stressedA) return kind === 'def' ? 'el' : 'un'
  return kind === 'def' ? (noun.g === 'f' ? 'la' : 'el') : (noun.g === 'f' ? 'una' : 'un')
}

export const withArticleEs = (key, kind = 'def', plural = false) => {
  const noun = NOUNS[key]
  return noun ? `${articleFor(key, kind, plural)} ${plural ? pluralOf(noun) : noun.sg}` : ''
}

/*
 * Article–noun agreement on known nouns. Returns the first mismatch, or null.
 * An unknown noun is skipped: this file does not guess a gender.
 */
export function articleMismatch(folded) {
  const ws = words(folded)
  for (let i = 0; i < ws.length - 1; i++) {
    const art = ARTICLES[ws[i]]
    if (!art) continue
    const form = nounForm(ws[i + 1])
    if (!form) continue
    const [, artPlural, kind] = art
    if (artPlural !== form.plural) continue // number is checked where the episode teaches it
    const want = articleFor(form.key, kind, form.plural)
    if (want !== ws[i]) {
      const noun = NOUNS[form.key]
      const type = noun.stressedA ? 'es_agua_article' : 'es_gender_article'
      return { type, want: `${want} ${form.plural ? pluralOf(noun) : noun.sg}`, key: form.key }
    }
  }
  return null
}

/* Known nouns mentioned, in order. */
const nounsIn = (folded) => words(folded).map(w => nounForm(w)).filter(Boolean)

/* ---------- language checks ---------- */

const ENGLISH = /\b(my name|i am|i m|im|hello|hi|hey|what is|what s|whats|how are you|where are you|i like|i want|i need|nice to meet|good morning|thank you|thanks|please|don t|dont|understand|repeat|slowly|this is|it s|bye|goodbye|and you|a coffee|one coffee|the check|how much|what does|how do you say|do you|i do|it is|you|the|book|water)\b/
const SPANISH = /\b(hola|me|soy|estoy|eres|estas|esta|de|el|la|los|las|un|una|por favor|gracias|que|como|tu|usted|es|no|quiero|necesito|gusta|llamo|donde|bien|muy|mas|puede|entiendo)\b/

/* Mostly English and not Spanish: the learner answered in the wrong language. */
export function looksEnglish(folded) {
  if (!ENGLISH.test(folded)) return false
  const spanishHits = words(folded).filter(w => SPANISH.test(w)).length
  return spanishHits <= 1
}

/* ---------- shared patterns ---------- */

const GREET = /\b(hola|buenas|buenos dias|buenas tardes|buenas noches|que tal|buen dia)\b/
const NUMBERS = { uno: 1, un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 }
const NUMBER_WORD = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez']
const cleanName = (name) => String(name || '').trim().split(/\s+/)[0] || 'Alex'
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

/* ================= greetings and names ================= */

export function evaluateGreet(text, { independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = '¡Hola!'
  if (!f) return empty(r)
  const agreement = f.match(/\b(?:buenas? dias?|buenos? (tardes?|noches?)|buena (tarde|noche))\b/)
  if (agreement && !/\bbuenos dias\b|\bbuenas (tardes|noches)\b/.test(f)) {
    r.naturalVersion = agreement[1] || agreement[2] ? `Buenas ${(agreement[1] || agreement[2]).replace(/s$/, '')}s.` : 'Buenos días.'
    return miss(r, 'es_greeting_agreement')
  }
  if (GREET.test(f)) return ok(r, text, { praise: 'es.praise.greet', variant: !/^hola\b/.test(f), accents: ['días', 'qué'] })
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  return words(f).length <= 2 ? miss(r, 'es_missing_greeting') : notEvaluable(r)
}

export function evaluateIntroduce(text, { name = 'Alex', independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  const nm = cleanName(name)
  r.naturalVersion = `Hola, me llamo ${nm}.`
  if (!f) return empty(r)
  if (/\bme llamo es\b/.test(f)) return miss(r, 'es_llamo_es')
  if (/\bmi llamo\b/.test(f)) return miss(r, 'es_mi_me')
  if (/\bme llama\b/.test(f)) return miss(r, 'es_llamo_form')
  if (/(^|\s)(yo )?llamo\s+\S/.test(f) && !/\bme llamo\b/.test(f) && !/\bse llamo\b/.test(f)) return miss(r, 'es_missing_me')
  if (/\bmi nombre\s+(?!es\b)\S/.test(f)) return miss(r, 'es_missing_es')
  if (/\bsoy de\b/.test(f)) return miss(r, 'es_origin_not_name')
  if (/\bestoy\s+[a-zñ]+$/.test(f) && !/\bestoy (bien|mal|cansad[oa]|aqui)\b/.test(f)) return miss(r, 'es_estar_name')
  const called = f.match(/\b(?:me llamo|mi nombre es|me dicen)\s+([a-zñ]+)/)
  if (called) return ok(r, text, { praise: GREET.test(f) ? 'es.praise.intro_greet' : 'es.praise.intro', variant: !/\bme llamo\b/.test(f), accents: ['días'] })
  const soy = f.match(/\b(?:yo )?soy\s+([a-zñ]+)/)
  if (soy) {
    const after = String(text).match(/\b[Ss]oy\s+(\S+)/)
    const capitalised = after && /^[A-ZÁÉÍÓÚÑ]/.test(after[1])
    if (fold(soy[1]) === fold(nm) || capitalised) return ok(r, text, { praise: 'es.praise.intro', variant: true, accents: ['días'] })
    return notEvaluable(r)
  }
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  if (GREET.test(f) && words(f).length <= 3) return miss(r, 'es_missing_name')
  return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_missing_intro', { conclusive: words(f).length < 2 })
}

export function evaluateAskName(text, { independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = '¿Cómo te llamas?'
  if (!f) return empty(r)
  const accents = ['cómo', 'cuál', 'tú']
  if (/\bque es (tu|su) nombre\b/.test(f)) return miss(r, 'es_que_cual')
  if (/\bcomo (tu )?llamas\b/.test(f) && !/\bte llamas\b/.test(f)) return miss(r, 'es_missing_te')
  if (/\bcomo te llama\b/.test(f) && !/\busted\b/.test(f)) return miss(r, 'es_te_llamas_form')
  if (/\bcomo te llamas\b|\bcomo se llama( usted)?\b|\bcual es (tu|su) nombre\b|\bcomo te dicen\b|\bcomo te llamai\b/.test(f)) {
    return ok(r, text, { praise: 'es.praise.ask_name', variant: !/\bcomo te llamas\b/.test(f), accents })
  }
  // regional / conversational variants a real speaker uses
  if (/\bcomo es (tu|su) nombre\b|\by (tu|usted) nombre\b|\bcomo te llamas vos\b|\by vos\b/.test(f)) return ok(r, text, { praise: 'es.praise.ask_name', variant: true, accents })
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  if (/\bnombre\b/.test(f)) return miss(r, 'es_not_question')
  return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_not_question', { conclusive: false })
}

export function evaluateNiceToMeet(text, { independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = 'Mucho gusto.'
  if (!f) return empty(r)
  if (/\b(bueno|agradable|bonito) (conocerte|conocerle|conocer)\b|\bbien conocerte\b|\bsoy encantad[oa]\b/.test(f)) return miss(r, 'es_calque_nice')
  if (/\bmucho gusto\b|\bencantad[oa]\b|\bigualmente\b|\bun (placer|gusto)\b|\btanto gusto\b|\bel gusto es mio\b|\bmucho gusto tambien\b|\bun gusto conocerte\b/.test(f)) {
    return ok(r, text, { praise: 'es.praise.nice', variant: !/^mucho gusto$/.test(f), accents: ['mío', 'también'] })
  }
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_missing_nice', { conclusive: false })
}

/* ================= how are you ================= */

const FEELING = '(bien|muy bien|mal|regular|mas o menos|asi asi|genial|fenomenal|excelente|bastante bien|todo bien|cansad[oa]|muy cansad[oa]|feliz|content[oa]|enferm[oa]|tranquil[oa]|super bien)'

export function evaluateAnswerWellbeing(text, { independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = 'Bien, gracias.'
  if (!f) return empty(r)
  const accents = ['más', 'así', 'tú', 'súper']
  if (new RegExp(`\\b(yo )?(soy|tengo) ${FEELING}\\b`).test(f)) return miss(r, 'es_ser_estar_feeling')
  if (/^(yo )?estar\b/.test(f)) return miss(r, 'es_infinitive_verb')
  if (/\b(estoy )?(bueno|buena)\b/.test(f) && !/\bbien\b/.test(f)) return miss(r, 'es_bien_bueno')
  if (new RegExp(`(^|\\s)(estoy )?${FEELING}\\b`).test(f) || /^(todo )?bien\b/.test(f) || /\btengo (sueño|hambre|sed|frio|calor)\b/.test(f)) {
    return ok(r, text, { praise: 'es.praise.feeling', variant: !/^bien( gracias)?/.test(f), accents })
  }
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_missing_feeling', { conclusive: false })
}

export function evaluateAskWellbeing(text, { independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = '¿Cómo estás?'
  if (!f) return empty(r)
  const accents = ['cómo', 'estás', 'está', 'qué', 'tú']
  if (/\bcomo (eres|es usted)\b/.test(f)) return miss(r, 'es_ser_estar_question')
  if (/\bcomo (tu )?(estas|esta|andas|vas|te va|va)\b|\bque tal\b|\bque onda\b|\bque hubo\b|\bcomo esta usted\b|\btodo bien\b|\bcomo estai\b|\bcomo andai\b|\bcomo estas vos\b|\bcomo andas vos\b/.test(f)) {
    return ok(r, text, { praise: 'es.praise.ask_feeling', variant: !/\bcomo estas\b/.test(f), accents })
  }
  if (/\bestas bien\b/.test(f)) return ok(r, text, { praise: 'es.praise.ask_feeling', variant: true, accents })
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_not_question', { conclusive: false })
}

export function evaluateReciprocal(text, { independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = '¿Y tú?'
  if (!f) return empty(r)
  if (new RegExp(`\\b(yo )?soy ${FEELING}\\b`).test(f)) return miss(r, 'es_ser_estar_feeling')
  if (/\b(estoy )?(bueno|buena)\b/.test(f) && !/\bbien\b/.test(f)) return miss(r, 'es_bien_bueno')
  if (/\by a ti\b/.test(f) && !/\b(gusta|te va)\b/.test(f)) return miss(r, 'es_y_a_ti')
  if (/^(y )?(tu|usted|vos)( que tal| como estas| como esta)?$/.test(f) || /\by (tu|usted|vos)\b/.test(f) || /\bcomo (estas|esta|te va|has estado)\b/.test(f)) {
    return ok(r, text, { praise: 'es.praise.reciprocal', variant: !/^y tu$/.test(f), accents: ['tú', 'cómo', 'estás', 'está'] })
  }
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_missing_reciprocal', { conclusive: false })
}

/* ================= where from ================= */

const COUNTRIES = /\b(chile|estados unidos|eeuu|ee uu|usa|mexico|canada|inglaterra|reino unido|españa|colombia|argentina|peru|venezuela|ecuador|bolivia|uruguay|paraguay|cuba|puerto rico|guatemala|honduras|el salvador|nicaragua|costa rica|panama|republica dominicana|australia|irlanda|escocia|alemania|francia|italia|brasil|japon|china|india|nueva zelanda|sudafrica|filipinas|nigeria|jamaica|portugal)\b/
const NATIONALITY = /\b(estadounidense|american[oa]|norteamerican[oa]|canadiense|ingles|inglesa|britanic[oa]|australian[oa]|irlandes|irlandesa|escoces|escocesa|chilen[oa]|mexican[oa]|argentin[oa]|colombian[oa]|peruan[oa]|español|española|venezolan[oa]|cuban[oa]|puertorriqueñ[oa]|aleman|alemana|frances|francesa|italian[oa]|brasileñ[oa]|japones|japonesa|chin[oa]|indi[oa]|neozelandes|neozelandesa|sudafrican[oa]|filipin[oa]|nigerian[oa]|jamaican[oa]|portugues|portuguesa)\b/

export function evaluateSayOrigin(text, { independent = false, place = '' } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = `Soy de ${String(place || '').trim() || 'Chicago'}.`
  if (!f) return empty(r)
  const accents = ['méxico', 'canadá', 'perú', 'panamá', 'japón', 'españa', 'inglés', 'francés', 'alemán', 'japonés', 'portugués']
  if (/\bestoy de\b/.test(f)) return miss(r, 'es_ser_estar_origin')
  if (/^eres\b/.test(f)) return miss(r, 'es_conjugation_yo')
  if (/\b(soy|estoy) en\b/.test(f)) return miss(r, 'es_en_vs_de')
  if (/\bsoy de\s*$/.test(f)) return miss(r, 'es_missing_place')
  if (/\b(soy|vengo|somos) del?\s+\S/.test(f) || /^del?\s+\S/.test(f)) return ok(r, text, { praise: 'es.praise.origin', variant: !/\bsoy de\b/.test(f), accents })
  if (/\bsoy\b/.test(f) && NATIONALITY.test(f)) return ok(r, text, { praise: 'es.praise.origin', variant: true, accents })
  if (/\bsoy\b/.test(f) && COUNTRIES.test(f)) return miss(r, 'es_missing_de')
  if (/\bvivo en\b/.test(f)) return miss(r, 'es_live_vs_from')
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  if (COUNTRIES.test(f) && words(f).length <= 3) return ok(r, text, { praise: 'es.praise.origin', variant: true, accents })
  return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_missing_origin', { conclusive: false })
}

export function evaluateAskOrigin(text, { independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = '¿De dónde eres?'
  if (!f) return empty(r)
  const accents = ['dónde', 'qué', 'tú']
  if (/\bdonde (eres|es usted|es|sos) de\b/.test(f)) return miss(r, 'es_preposition_order')
  if (/\bde donde (estas|esta)\b/.test(f)) return miss(r, 'es_ser_estar_origin_q')
  if (/\bde donde (eres|es|sos|vienes|viene)\b|\bde que (pais|ciudad) (eres|es|sos)\b|\bde donde (tu )?eres\b/.test(f)) {
    return ok(r, text, { praise: 'es.praise.ask_origin', variant: !/\bde donde eres\b/.test(f), accents })
  }
  if (/\bdonde vives\b|\bdonde vive\b/.test(f)) return miss(r, 'es_live_vs_from_q')
  if (/^(y )?donde (eres|es usted)$/.test(f)) return miss(r, 'es_missing_de_q')
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_not_question', { conclusive: false })
}

export function evaluateGoodbye(text, { independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = '¡Adiós, hasta luego!'
  if (!f) return empty(r)
  if (/\b(adios|hasta luego|hasta mañana|hasta pronto|hasta la proxima|nos vemos|chao|chau|cuidate|que te vaya bien|hasta la vista)\b/.test(f)) {
    return ok(r, text, { praise: 'es.praise.goodbye', variant: !/\b(adios|hasta luego)\b/.test(f), accents: ['adiós', 'mañana', 'próxima', 'cuídate'] })
  }
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_missing_goodbye', { conclusive: false })
}

/* ================= repair ================= */

const REPAIR = {
  repeat: /\b(puede|puedes|podes|podria|podrias) repetir(lo)?\b|\bcomo dij(o|iste)\b|\buna vez mas\b|\brepeti\b|\b(me lo )?(repite|repita|repites)\b|\botra vez\b|^(como|perdon|perdona|disculpa|disculpe|mande|que)$|\bque dijiste\b|\bque dijo\b|\b(puede|puedes) decirlo otra vez\b/,
  slow_down: /\bmas despac(io|ito)\b|^despacio\b|\bmas lento\b|\bmas lentamente\b|\bhablar despacio\b/,
  not_understand: /\bno (te |le |lo )?(entiendo|comprendo|entendi|he entendido|estoy entendiendo)\b/,
  ask_meaning: /\bque (significa|quiere decir)\b/,
  how_to_say: /\bcomo se dice\b|\bcomo digo\b/,
}

export function evaluateRepair(text, { independent = false, repairKind = 'repeat', meaningWord = '' } = {}) {
  const r = base(independent)
  const f = fold(text)
  const mw = String(meaningWord || '').trim()
  r.naturalVersion = {
    repeat: '¿Puede repetir, por favor?',
    slow_down: 'Más despacio, por favor.',
    not_understand: 'Perdón, no entiendo.',
    ask_meaning: `¿Qué significa «${mw || 'despacio'}»?`,
    how_to_say: `¿Cómo se dice «${mw || 'thank you'}» en español?`,
  }[repairKind] || '¿Puede repetir, por favor?'
  if (!f) return empty(r)
  const accents = ['más', 'qué', 'cómo', 'perdón', 'español']
  if (/\bno (entender|comprender)\b/.test(f)) return miss(r, 'es_infinitive_verb')
  if (/^repetir( por favor)?$/.test(f)) return miss(r, 'es_infinitive_command')
  if (/\bque es significa\b/.test(f)) return miss(r, 'es_extra_es')
  if (looksEnglish(f) && !Object.values(REPAIR).some(re => re.test(f))) return miss(r, 'es_english_reply')
  const pattern = REPAIR[repairKind] || REPAIR.repeat
  if (!pattern.test(f)) {
    // a different, still correct repair move: right Spanish, not this turn's job
    const other = Object.entries(REPAIR).find(([, re]) => re.test(f))
    if (other) return miss(r, `es_repair_other_${repairKind}`, { conclusive: true, confidence: 0.8 })
    return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_missing_repair', { conclusive: false })
  }
  if ((repairKind === 'ask_meaning' || repairKind === 'how_to_say') && mw) {
    const has = fold(f).includes(fold(mw))
    if (!has) return miss(r, 'es_missing_word')
  }
  return ok(r, text, { praise: 'es.praise.repair', variant: true, accents })
}

/* ================= likes, wants, needs ================= */

function likeShape(f) {
  if (/\b(yo )?gusto\b/.test(f) && !/\bme gusto\b/.test(f)) return 'es_gustar_structure'
  if (/\byo me gusta\b/.test(f)) return 'es_gustar_structure'
  if (/(^|\s)(a )?mi gusta\b|\byo gusta\b|^no gusta\b/.test(f)) return 'es_gustar_structure'
  if (/\bgustan? (a|de) (?!mi\b|ti\b|el\b|usted\b)\S|\bgustan? [a-zñ]+ndo\b/.test(f)) return 'es_gustar_infinitive'
  if (/\bme gusto\b/.test(f)) return 'es_gustar_form'
  if (/\bme no gusta\b/.test(f)) return 'es_negation_position'
  return null
}

/* gusta + plural noun, or gustan + singular noun — on known nouns only */
function gustarNumber(f) {
  const m = f.match(/\bgustan?\s+(?:(el|la|los|las|mucho|muchos|muchas)\s+)?([a-zñ]+)/)
  if (!m) return null
  const verbPlural = /\bgustan\b/.test(f)
  // two things are plural whatever the first one is: "me gustan la música y el café"
  if (verbPlural && /\s(y|e) (el|la|los|las)\s/.test(f)) return null
  const form = nounForm(m[2])
  if (!form) return null
  if (form.plural !== verbPlural) return form.plural ? 'es_gustar_plural' : 'es_gustar_singular'
  return null
}

/* "me gusta café" — a known noun with no article, for a general like */
function missingArticle(f) {
  const m = f.match(/\bgustan?\s+(?:mucho\s+)?([a-zñ]+)/)
  if (!m) return null
  const form = nounForm(m[1])
  return form ? { key: form.key, plural: form.plural } : null
}

const likeAccents = ['café', 'música', 'fútbol', 'película', 'películas', 'té', 'sí', 'también']

export function evaluateExpressLike(text, { independent = false, targetThing = 'cafe', negative = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  const thing = withArticleEs(targetThing) || 'el café'
  r.naturalVersion = negative ? `No me gusta ${thing}.` : `Me gusta ${thing}.`
  if (!f) return empty(r)
  const shape = likeShape(f)
  if (shape) return miss(r, shape)
  const verb = negative ? /\bno me (gusta|gustan)\b|\bno me (gusta|gustan) mucho\b/ : /\bme (gusta|gustan|encanta|encantan)\b/
  if (!verb.test(f)) {
    if (negative && /\bme (gusta|gustan)\b/.test(f)) return miss(r, 'es_missing_no')
    if (looksEnglish(f)) return miss(r, 'es_english_reply')
    return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_missing_gustar', { conclusive: false })
  }
  const number = gustarNumber(f)
  if (number) {
    const named = nounForm(f.match(/\bgustan?\s+(?:(?:el|la|los|las|mucho|muchos|muchas)\s+)?([a-zñ]+)/)[1])
    r.naturalVersion = `${negative ? 'No me' : 'Me'} ${named.plural ? 'gustan' : 'gusta'} ${withArticleEs(named.key, 'def', named.plural)}.`
    return miss(r, number)
  }
  const mismatch = articleMismatch(f)
  if (mismatch) { r.naturalVersion = (negative ? 'No me gusta ' : 'Me gusta ') + mismatch.want + '.'; return miss(r, mismatch.type) }
  const bare = missingArticle(f)
  if (bare) {
    r.naturalVersion = `${negative ? 'No me' : 'Me'} ${bare.plural ? 'gustan' : 'gusta'} ${withArticleEs(bare.key, 'def', bare.plural)}.`
    return miss(r, 'es_missing_article_like')
  }
  // what follows gusta: a noun phrase or an infinitive; anything else is not ours to judge
  const after = f.split(/\bgustan?\b|\bencantan?\b/)[1]?.trim() || ''
  // "el café me gusta": the thing can come first
  const before = f.split(/\b(?:no )?me (?:gustan?|encantan?)\b/)[0].trim()
  // "No, no me gusta." answers a question: the thing was already said
  if (!after && !nounsIn(before).length && !/^(si|no)\b/.test(before)) return miss(r, 'es_missing_thing')
  return ok(r, text, { praise: negative ? 'es.praise.dislike' : 'es.praise.like', variant: true, accents: likeAccents })
}

export const evaluateExpressDislike = (text, ctx = {}) => evaluateExpressLike(text, { ...ctx, negative: true })

export function evaluateAskLike(text, { independent = false, targetThing = 'musica' } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = `¿Te gusta ${withArticleEs(targetThing) || 'la música'}?`
  if (!f) return empty(r)
  if (/\b(tu )?gustas\b/.test(f) && !/\bte gustas\b/.test(f)) return miss(r, 'es_gustar_structure_q')
  if (!/\b(te|le) (gusta|gustan)\b/.test(f)) {
    if (looksEnglish(f)) return miss(r, 'es_english_reply')
    return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_missing_gustar_q', { conclusive: false })
  }
  const number = gustarNumber(f)
  if (number) return miss(r, number)
  const mismatch = articleMismatch(f)
  if (mismatch) { r.naturalVersion = `¿Te gusta ${mismatch.want}?`; return miss(r, mismatch.type) }
  const bare = missingArticle(f)
  if (bare) {
    r.naturalVersion = `¿Te ${bare.plural ? 'gustan' : 'gusta'} ${withArticleEs(bare.key, 'def', bare.plural)}?`
    return miss(r, 'es_missing_article_like')
  }
  return ok(r, text, { praise: 'es.praise.ask_like', variant: true, accents: likeAccents })
}

function wantNeed(text, verbs, { independent, targetThing, praise }) {
  const r = base(independent)
  const f = fold(text)
  const verb = verbs[0]
  // "ayuda" is not counted: "necesito ayuda", never "una ayuda"
  r.naturalVersion = `${cap(verb)} ${targetThing === 'ayuda' ? 'ayuda' : withArticleEs(targetThing, 'ind') || 'un café'}.`
  if (!f) return empty(r)
  if (/\b(quere|quero|nesesito|necessito)\b/.test(f)) return miss(r, 'es_spelling_verb', { confidence: 0.75 })
  if (/\b(yo )?(quiere|queremos|necesita|necesitas)\b/.test(f) && !new RegExp(`\\b(${verbs.join('|')})\\b`).test(f)) return miss(r, 'es_conjugation_yo')
  if (/\b(yo )?(querer|necesitar)\b/.test(f)) return miss(r, 'es_infinitive_verb')
  if (!new RegExp(`\\b(${verbs.join('|')})\\b`).test(f)) {
    if (looksEnglish(f)) return miss(r, 'es_english_reply')
    return words(f).length >= 3 ? notEvaluable(r) : miss(r, verb === 'quiero' ? 'es_missing_quiero' : 'es_missing_necesito', { conclusive: false })
  }
  if (/\buno\s+[a-zñ]+/.test(f) && nounForm(f.match(/\buno\s+([a-zñ]+)/)[1])) return miss(r, 'es_uno_un')
  const mismatch = articleMismatch(f)
  if (mismatch) { r.naturalVersion = `${cap(verb)} ${mismatch.want}.`; return miss(r, mismatch.type) }
  const after = f.split(new RegExp(`\\b(?:${verbs.join('|')})\\b`))[1]?.trim() || ''
  if (!after) return miss(r, 'es_missing_thing')
  return ok(r, text, { praise, variant: true, accents: ['café', 'té', 'más'] })
}

export const evaluateWant = (text, { independent = false, targetThing = 'agua' } = {}) =>
  wantNeed(text, ['quiero', 'quisiera', 'me gustaria'], { independent, targetThing, praise: 'es.praise.want' })
export const evaluateNeed = (text, { independent = false, targetThing = 'ayuda' } = {}) =>
  wantNeed(text, ['necesito'], { independent, targetThing, praise: 'es.praise.need' })

/* ================= polite requests and the café ================= */

// "quería un café" is the courteous imperfect, not a past tense, in a café
const POLITE = /\bpor favor\b|\bquisiera\b|\bqueria\b|\b(me|nos) (da|das|pone|pones|trae|traes|regala|regalas|puede dar|puedes dar|podria dar|podrias dar|daria)\b|\bme gustaria\b|\bpara mi\b.*\bpor favor\b/

export function evaluatePoliteRequest(text, { independent = false, targetThing = 'cafe' } = {}) {
  const r = base(independent)
  const f = fold(text)
  const thing = withArticleEs(targetThing, 'ind') || 'un café'
  r.naturalVersion = `${cap(thing)}, por favor.`
  if (!f) return empty(r)
  const accents = ['café', 'té', 'podría', 'gustaría', 'mí']
  if (/\buno\s+([a-zñ]+)/.test(f) && nounForm(f.match(/\buno\s+([a-zñ]+)/)[1])) return miss(r, 'es_uno_un')
  if (/\bpuedo tener\b|\bvoy a tener\b|\byo tendre\b/.test(f)) return miss(r, 'es_calque_have')
  if (looksEnglish(f) && !POLITE.test(f)) return miss(r, 'es_english_reply')
  const named = nounsIn(f)
  if (!named.length && !/\b(algo|eso|esto)\b/.test(f)) {
    return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_missing_thing', { conclusive: false })
  }
  const mismatch = articleMismatch(f)
  if (mismatch) { r.naturalVersion = `${cap(mismatch.want)}, por favor.`; return miss(r, mismatch.type) }
  if (!POLITE.test(f)) {
    if (/\b(quiero|dame|deme|necesito)\b/.test(f) || named.length) return miss(r, 'es_missing_politeness', { confidence: 0.8 })
    return notEvaluable(r)
  }
  return ok(r, text, { praise: 'es.praise.polite', variant: !/^(un|una) [a-zñ]+ por favor$/.test(f), accents })
}

export function evaluateThank(text, { independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = 'Gracias.'
  if (!f) return empty(r)
  if (/\b(mucho|muy) gracias\b|\bgracias mucho\b/.test(f)) { r.naturalVersion = 'Muchas gracias.'; return miss(r, 'es_gracias_form') }
  if (/\bgracias+\b|\bte lo agradezco\b|\bse lo agradezco\b/.test(f)) return ok(r, text, { praise: 'es.praise.thanks', variant: !/^(muchas )?gracias$/.test(f) })
  if (/\bgrasias\b/.test(f)) return miss(r, 'es_spelling_gracias', { confidence: 0.75 })
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_missing_thanks', { conclusive: false })
}

/* "¿Algo más?" — "No, gracias." / "Nada más." / "Sí, un agua, por favor." */
export function evaluateAnythingElse(text, { independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = 'No, gracias. Nada más.'
  if (!f) return empty(r)
  const accents = ['más', 'sí']
  if (/\b(thanks|thank you)\b/.test(f)) return miss(r, 'es_english_reply')
  if (/^(no|nada|nada mas|eso es todo|es todo|no gracias|nada mas gracias|eso seria todo|no nada mas|asi esta bien|esta bien asi)\b/.test(f) && !/\bno quiero\b/.test(f)) {
    return ok(r, text, { praise: 'es.praise.anything_else', variant: true, accents })
  }
  if (/^si\b/.test(f)) {
    const request = evaluatePoliteRequest(text.replace(/^\s*s[ií][,.]?\s*/i, ''), { independent })
    if (request.completedObjective) return ok(r, text, { praise: 'es.praise.anything_else', variant: true, accents })
    if (request.errorType && request.errorType !== 'es_not_evaluable') return { ...miss(r, request.errorType), naturalVersion: `Sí, ${request.naturalVersion.charAt(0).toLowerCase()}${request.naturalVersion.slice(1)}` }
  }
  if (/\bno quiero nada\b/.test(f)) return ok(r, text, { praise: 'es.praise.anything_else', variant: true, accents })
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  return notEvaluable(r)
}

export function evaluateAskBill(text, { independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = 'La cuenta, por favor.'
  if (!f) return empty(r)
  if (/\bel cuenta\b/.test(f)) return miss(r, 'es_gender_article')
  if (/\bpuedo tener\b/.test(f)) return miss(r, 'es_calque_have')
  if (/\bla cuenta\b|\bla adicion\b|\bme cobra\b|\bcobrame\b|\bcuanto es\b|\bcuanto le debo\b|\bcuanto te debo\b|\bcuanto cuesta\b/.test(f)) {
    if (/\bla cuenta\b/.test(f) && !POLITE.test(f)) return miss(r, 'es_missing_politeness', { confidence: 0.75 })
    return ok(r, text, { praise: 'es.praise.bill', variant: !/^la cuenta por favor$/.test(f), accents: ['cuánto'] })
  }
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_missing_bill', { conclusive: false })
}

/* ================= numbers ================= */

/* The number a reply states in words, or null. Digits are reported apart. */
export function numberWordIn(f) {
  for (const w of words(f)) if (NUMBERS[w]) return NUMBERS[w]
  return null
}

export function evaluateQuantity(text, { independent = false, targetThing = 'cafe', targetCount = 2, quantityForm = 'with_object' } = {}) {
  const r = base(independent)
  const f = fold(text)
  const noun = NOUNS[targetThing] || NOUNS.cafe
  const counted = targetCount === 1 ? withArticleEs(targetThing, 'ind') : `${NUMBER_WORD[targetCount]} ${pluralOf(noun)}`
  r.naturalVersion = quantityForm === 'bare' ? `${cap(NUMBER_WORD[targetCount])}.`
    : quantityForm === 'polite_request' ? `${cap(counted)}, por favor.` : `${cap(counted)}.`
  if (!f) return empty(r)
  const accents = ['café', 'cafés', 'té', 'tés']
  if (/\buno\s+[a-zñ]+/.test(f) && nounForm(f.match(/\buno\s+([a-zñ]+)/)[1])) return miss(r, 'es_uno_un')
  const said = numberWordIn(f)
  if (said == null) {
    // "2 cafés" answers the question but practises none of the number words
    if (/\b\d+\b/.test(f)) { const done = ok(r, text, { praise: 'es.praise.digits' }); done.targetEvidence = false; return done }
    if (looksEnglish(f)) return miss(r, 'es_english_reply')
    return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_missing_number', { conclusive: false })
  }
  if (said !== targetCount) return miss(r, 'es_wrong_number')
  if (quantityForm !== 'bare') {
    const named = nounsIn(f).filter(n => conceptOf(n.key) === conceptOf(targetThing))
    if (!named.length) {
      const others = nounsIn(f)
      if (others.length) return miss(r, 'es_wrong_thing')
      if (words(f).length === 1) return miss(r, 'es_missing_thing')
      return notEvaluable(r)
    }
    if (targetCount > 1 && !named[0].plural) return miss(r, 'es_plural_number')
    if (targetCount === 1 && named[0].plural) return miss(r, 'es_singular_number')
    const mismatch = articleMismatch(f)
    if (mismatch) return miss(r, mismatch.type)
    if (targetCount === 1 && /\b(un|una)\b/.test(f)) {
      const art = f.match(/\b(un|una)\b/)[1]
      if (art !== articleFor(targetThing, 'ind')) return miss(r, noun.stressedA ? 'es_agua_article' : 'es_gender_article')
    }
    if (quantityForm === 'polite_request' && !POLITE.test(f)) return miss(r, 'es_missing_politeness', { confidence: 0.8 })
  }
  return ok(r, text, { praise: 'es.praise.number', variant: true, accents })
}

/* ================= things ================= */

export function evaluateAskWhat(text, { independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = '¿Qué es esto?'
  if (!f) return empty(r)
  const accents = ['qué', 'cómo', 'español']
  if (/\bque (esto|eso) es\b/.test(f)) return miss(r, 'es_word_order_q')
  if (/\bque esta (esto|eso)\b/.test(f)) return miss(r, 'es_ser_estar_thing')
  if (/\bque es (este|esta|ese|esa)$/.test(f)) return miss(r, 'es_esto_neuter')
  if (/\bque es (esto|eso|aquello)\b|\bque cosa es (esto|eso)\b|\bque es esta cosa\b|\by (esto|eso) que es\b|^que es$|\bcomo se llama (esto|eso)\b|\bcomo se dice (esto|eso)\b|^(y )?(esto|eso)$/.test(f)) {
    return ok(r, text, { praise: 'es.praise.ask_what', variant: !/\bque es esto\b/.test(f), accents })
  }
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  return words(f).length >= 3 ? notEvaluable(r) : miss(r, 'es_not_question', { conclusive: false })
}

export function evaluateIdentifyThing(text, { independent = false, targetThing = 'libro' } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = `Es ${withArticleEs(targetThing, 'ind') || 'un libro'}.`
  if (!f) return empty(r)
  const accents = ['teléfono', 'móvil', 'bolígrafo', 'lápiz']
  if (/\besta (un|una)\b/.test(f)) return miss(r, 'es_ser_estar_thing_answer')
  if (/\buno\s+([a-zñ]+)/.test(f) && nounForm(f.match(/\buno\s+([a-zñ]+)/)[1])) return miss(r, 'es_uno_un')
  const named = nounsIn(f)
  if (!named.length) {
    if (looksEnglish(f)) return miss(r, 'es_english_reply')
    return notEvaluable(r)
  }
  const right = named.find(n => conceptOf(n.key) === conceptOf(targetThing))
  if (!right) return miss(r, 'es_wrong_thing')
  const mismatch = articleMismatch(f)
  if (mismatch) { r.naturalVersion = `Es ${mismatch.want}.`; return miss(r, mismatch.type) }
  if (/\bes\s+[a-zñ]+$/.test(f) && !/\b(un|una|el|la)\b/.test(f)) return miss(r, 'es_missing_article_thing')
  return ok(r, text, { praise: 'es.praise.identify', variant: right.key !== targetThing, accents })
}

/* ================= A1: present tense, yo and tú (closed level) ================= */

const LIFE_VERB = /\b(trabajo|estudio)\b/
const LIFE_INFINITIVE = /^(yo )?(trabajar|estudiar|vivir)\b/
const PROFESSION = /\b(profesor|profesora|medico|medica|doctor|doctora|enfermero|enfermera|ingeniero|ingeniera|estudiante|camarero|camarera|cocinero|cocinera|abogado|abogada)\b/

export function evaluateSayLife(text, { independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = 'Trabajo en una oficina.'
  if (!f) return empty(r)
  if (LIFE_INFINITIVE.test(f)) return miss(r, 'es_infinitive_verb')
  if (/^(yo )?(trabaja|estudia|trabajas|estudias)\b/.test(f)) return miss(r, 'es_conjugation_yo')
  if (/^(yo )?(soy|estoy) (trabajo|estudio|trabajando|estudiando)\b/.test(f) && !/^estoy (trabajando|estudiando)\b/.test(f)) return miss(r, 'es_ser_plus_verb')
  if (/^(yo )?soy (un|una) /.test(f) && PROFESSION.test(f)) { r.naturalVersion = 'Soy profesora.'; return miss(r, 'es_profession_article') }
  const mismatch = articleMismatch(f)
  if (mismatch) return miss(r, mismatch.type)
  if (LIFE_VERB.test(f) || /^(yo )?soy\b/.test(f) && PROFESSION.test(f) || /^estoy (trabajando|estudiando)\b/.test(f)) {
    return words(f).length <= 9 ? ok(r, text, { praise: 'es.praise.good', variant: !/^trabajo en una oficina$/.test(f) }) : notEvaluable(r)
  }
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  return notEvaluable(r)
}

export function evaluateAskLife(text, { independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = '¿Trabajas?'
  if (!f) return empty(r)
  if (/\b(haces|hace) (tu )?trabajo\b/.test(f)) return miss(r, 'es_calque_do')
  if (/^(tu )?(trabajar|estudiar)\b/.test(f)) return miss(r, 'es_infinitive_verb')
  if (/^(yo )?(trabajo|estudio)\b/.test(f)) return miss(r, 'es_conjugation_tu')
  if (/\b(trabajas|estudias|trabaja|estudia|trabajais|a que te dedicas|a que se dedica|que haces|que hace)\b/.test(f)) {
    return words(f).length <= 8 ? ok(r, text, { praise: 'es.praise.ask_like', variant: !/^trabajas$/.test(f), accents: ['qué'] }) : notEvaluable(r)
  }
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  return notEvaluable(r)
}

export function evaluateSayLive(text, { independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = 'Vivo en Chicago.'
  if (!f) return empty(r)
  if (/^(yo )?vivir\b/.test(f)) return miss(r, 'es_infinitive_verb')
  if (/^(yo )?(vive|vives)\b/.test(f)) return miss(r, 'es_conjugation_yo')
  if (/^(yo )?estoy vivo\b/.test(f)) return miss(r, 'es_estar_vivo')
  if (/^(yo )?vivo (a|de)\b/.test(f)) return miss(r, 'es_live_preposition')
  if (/^(si )?(yo )?vivo( aqui| alli| cerca| lejos)?$/.test(f) || /^(si )?(yo )?vivo (en|cerca de) [a-zñ]+( [a-zñ]+){0,3}$/.test(f)) {
    return ok(r, text, { praise: 'es.praise.good', variant: !/^vivo en /.test(f), accents: ['aquí', 'allí'] })
  }
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  return notEvaluable(r)
}

export function evaluateAskLive(text, { independent = false } = {}) {
  const r = base(independent)
  const f = fold(text)
  r.naturalVersion = '¿Dónde vives?'
  if (!f) return empty(r)
  if (/\bdonde (tu )?vivir\b/.test(f)) return miss(r, 'es_infinitive_verb')
  if (/\bdonde (yo )?vivo\b/.test(f)) return miss(r, 'es_conjugation_tu')
  if (/\bdonde (estas )?(tu )?viviendo\b/.test(f)) return ok(r, text, { praise: 'es.praise.ask_like', variant: true, accents: ['dónde'] })
  if (/^(y )?(tu )?donde (vives|vive|vivis)( tu| usted)?( ahora)?$/.test(f) || /^(tu )?(vives|vive) (aqui|en [a-zñ]+)$/.test(f)) {
    return ok(r, text, { praise: 'es.praise.ask_like', variant: !/^donde vives$/.test(f), accents: ['dónde', 'aquí'] })
  }
  if (looksEnglish(f)) return miss(r, 'es_english_reply')
  return notEvaluable(r)
}

/* ================= dispatch ================= */

const EVALUATORS = {
  es_greet: evaluateGreet,
  es_introduce: evaluateIntroduce,
  es_ask_name: evaluateAskName,
  es_nice_to_meet: evaluateNiceToMeet,
  es_answer_wellbeing: evaluateAnswerWellbeing,
  es_ask_wellbeing: evaluateAskWellbeing,
  es_reciprocal: evaluateReciprocal,
  es_say_origin: evaluateSayOrigin,
  es_ask_origin: evaluateAskOrigin,
  es_goodbye: evaluateGoodbye,
  es_repair: evaluateRepair,
  es_express_like: evaluateExpressLike,
  es_express_dislike: evaluateExpressDislike,
  es_ask_like: evaluateAskLike,
  es_want: evaluateWant,
  es_need: evaluateNeed,
  es_polite_request: evaluatePoliteRequest,
  es_thank: evaluateThank,
  es_anything_else: evaluateAnythingElse,
  es_ask_bill: evaluateAskBill,
  es_quantity: evaluateQuantity,
  es_ask_what: evaluateAskWhat,
  es_identify_thing: evaluateIdentifyThing,
  es_a1_say_life: evaluateSayLife,
  es_a1_ask_life: evaluateAskLife,
  es_a1_say_live: evaluateSayLive,
  es_a1_ask_live: evaluateAskLive,
}

export const ES_EVAL_KINDS = Object.keys(EVALUATORS)

/* Unknown kinds fail closed as not evaluable — never as a wrong answer. */
export function evaluateSpanish(kind, text, ctx = {}) {
  const fn = EVALUATORS[kind]
  if (!fn) return notEvaluable(base(ctx.independent))
  return fn(text, ctx)
}
