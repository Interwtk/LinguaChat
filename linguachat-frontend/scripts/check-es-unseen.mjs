#!/usr/bin/env node
/*
 * check-es-unseen — Spanish answers the evaluator rules were NOT written from
 * (phase 3, 2026-11-03). Measured before any change: 1 valid variant not
 * accepted ("me gustaría un agua") and 3 FALSE corrections of valid Spanish
 * ("holaaa", "el café me gusta", "quería un café"). Fixed, kept as regression.
 * Two answers are nudged on purpose (a bare name; "la cuenta" without "por
 * favor"): the lesson asks for the full, polite form.
 *
 * An automated review is not a native speaker's review; see
 * docs/curriculum/es-pre-a1-review.md.
 */
// ok = must complete the objective; err = must flag a learner error;
// open = anything but a false correction (complete, or not evaluable).
import { evaluateSpanish as E } from '../src/learning/courses/es/evaluator.js'

const cases = [
  ['ok', 'es_greet', 'hola, buenos días'],
  ['ok', 'es_greet', '¡Buenas noches!'],
  ['ok', 'es_greet', 'qué tal'],
  ['ok', 'es_greet', 'hola hola'],
  ['ok', 'es_introduce', 'Soy Alex', { name: 'Alex' }],
  ['ok', 'es_introduce', 'Hola, soy Alex.', { name: 'Alex' }],
  ['ok', 'es_introduce', 'mi nombre es Alex', { name: 'Alex' }],
  ['ok', 'es_introduce', 'Me llamo Alex, mucho gusto', { name: 'Alex' }],
  ['err', 'es_introduce', 'yo llamo Alex', { name: 'Alex' }],
  ['ok', 'es_ask_name', '¿Y tú, cómo te llamas?'],
  ['ok', 'es_ask_name', '¿Cómo se llama usted?'],
  ['ok', 'es_ask_name', 'cual es tu nombre'],
  ['err', 'es_ask_name', '¿Qué es tu nombre?'],
  ['ok', 'es_nice_to_meet', 'Encantada'],
  ['ok', 'es_nice_to_meet', 'un placer'],
  ['ok', 'es_nice_to_meet', 'igualmente, mucho gusto'],
  ['ok', 'es_answer_wellbeing', 'muy bien, gracias'],
  ['ok', 'es_answer_wellbeing', 'Estoy un poco cansado'],
  ['ok', 'es_answer_wellbeing', 'más o menos'],
  ['ok', 'es_answer_wellbeing', 'regular'],
  ['err', 'es_answer_wellbeing', 'soy bien'],
  ['ok', 'es_ask_wellbeing', '¿Qué tal estás?'],
  ['ok', 'es_ask_wellbeing', '¿Cómo está usted?'],
  ['ok', 'es_ask_wellbeing', 'como andas'],
  ['ok', 'es_reciprocal', '¿Y usted?'],
  ['ok', 'es_reciprocal', 'y vos'],
  ['ok', 'es_say_origin', 'Soy de Canadá', { place: 'Canadá' }],
  ['ok', 'es_say_origin', 'soy de canada', { place: 'Canadá' }],
  ['ok', 'es_say_origin', 'Vengo de Canadá', { place: 'Canadá' }],
  ['err', 'es_say_origin', 'estoy de Canadá', { place: 'Canadá' }],
  ['ok', 'es_ask_origin', '¿De dónde es usted?'],
  ['ok', 'es_ask_origin', 'de donde sos'],
  ['err', 'es_ask_origin', '¿Dónde eres de?'],
  ['ok', 'es_goodbye', 'chao'],
  ['ok', 'es_goodbye', 'nos vemos mañana'],
  ['ok', 'es_goodbye', 'hasta pronto'],
  ['ok', 'es_goodbye', 'adiós, cuídate'],
  ['ok', 'es_repair', '¿Puede repetir, por favor?', { repairKind: 'repeat' }],
  ['ok', 'es_repair', 'otra vez por favor', { repairKind: 'repeat' }],
  ['ok', 'es_repair', 'más despacio, por favor', { repairKind: 'slow_down' }],
  ['ok', 'es_repair', '¿Qué significa gato?', { repairKind: 'ask_meaning', meaningWord: 'gato' }],
  ['ok', 'es_express_like', 'me gusta mucho el café', { targetThing: 'cafe' }],
  ['ok', 'es_express_like', 'Me encanta el café', { targetThing: 'cafe' }],
  ['err', 'es_express_like', 'yo gusto el café', { targetThing: 'cafe' }],
  ['err', 'es_express_like', 'me gusta la café', { targetThing: 'cafe' }],
  ['ok', 'es_express_dislike', 'no me gusta el café', { targetThing: 'cafe' }],
  ['ok', 'es_ask_like', '¿Te gusta la música?', { targetThing: 'musica' }],
  ['ok', 'es_ask_like', '¿A ti te gusta la música?', { targetThing: 'musica' }],
  ['ok', 'es_want', 'quiero agua, por favor', { targetThing: 'agua' }],
  ['ok', 'es_want', 'Quisiera agua', { targetThing: 'agua' }],
  ['ok', 'es_want', 'Me gustaría un agua', { targetThing: 'agua' }],
  ['ok', 'es_need', 'necesito ayuda', { targetThing: 'ayuda' }],
  ['ok', 'es_polite_request', 'Un café, por favor', { targetThing: 'cafe' }],
  ['ok', 'es_polite_request', '¿Me da un café, por favor?', { targetThing: 'cafe' }],
  ['ok', 'es_polite_request', '¿Me pone un café?', { targetThing: 'cafe' }],
  ['ok', 'es_polite_request', 'Para mí un café, por favor', { targetThing: 'cafe' }],
  ['ok', 'es_thank', 'muchas gracias'],
  ['ok', 'es_thank', 'mil gracias'],
  ['ok', 'es_anything_else', 'no, nada más, gracias'],
  ['ok', 'es_anything_else', 'Eso es todo'],
  ['ok', 'es_ask_bill', 'La cuenta, por favor'],
  ['ok', 'es_ask_bill', '¿Me trae la cuenta?'],
  ['ok', 'es_ask_bill', '¿Cuánto es?'],
  ['ok', 'es_quantity', 'dos cafés, por favor', { targetThing: 'cafe', targetCount: 2 }],
  ['err', 'es_quantity', 'dos café', { targetThing: 'cafe', targetCount: 2 }],
  ['ok', 'es_ask_what', '¿Qué es eso?'],
  ['ok', 'es_ask_what', 'qué es esto'],
  ['ok', 'es_identify_thing', 'Es un libro', { targetThing: 'libro' }],
  ['ok', 'es_identify_thing', 'un libro', { targetThing: 'libro' }],
  ['err', 'es_identify_thing', 'es una libro', { targetThing: 'libro' }],
  // never a false correction
  ['open', 'es_greet', 'holaaa'],
  ['nudge', 'es_introduce', 'Alex', { name: 'Alex' }],
  ['open', 'es_answer_wellbeing', 'fenomenal, ¿y tú?'],
  ['open', 'es_answer_wellbeing', 'bien bien'],
  ['open', 'es_goodbye', 'hasta la vista'],
  ['open', 'es_express_like', 'el café me gusta', { targetThing: 'cafe' }],
  ['open', 'es_polite_request', 'quería un café', { targetThing: 'cafe' }],
  ['open', 'es_say_origin', 'soy canadiense', { place: 'Canadá' }],
  ['nudge', 'es_ask_bill', 'la cuenta'],
]

const outcome = (r) => r.completedObjective ? 'ok' : (r.notEvaluable || !r.errorType ? 'ne' : 'err')
let bad = 0
const tally = { ok: [0, 0], err: [0, 0], open: [0, 0], nudge: [0, 0] }
for (const [want, kind, text, ctx = {}] of cases) {
  const r = E(kind, text, { name: 'Alex', ...ctx })
  const got = outcome(r)
  const pass = want === 'open' ? got !== 'err' : want === 'nudge' ? got === 'err' && r.retryRequired : got === want
  tally[want][pass ? 0 : 1]++
  if (!pass) { bad++; console.log('MISS', want, '->', got, r.errorType || '', '|', kind, '|', text) }
}
if (bad) { console.error(`check-es-unseen: ${bad} failed`); process.exit(1) }
console.log(`check-es-unseen: ${cases.length} passed, 0 failed ${JSON.stringify(tally)}`)
