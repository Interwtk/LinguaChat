/*
 * Spanish for English speakers — Pre-A1 metadata (first chunk).
 *
 * Home, the Garden and the gate need to know which episodes exist, in which
 * order, what they are called and which words they grant — never their steps.
 * The steps, the copy that explains them and the evaluator live in
 * `preA1Content.js`, which only an opened episode imports.
 *
 * `sourceEpisodes` records the English Pre-A1 episodes each one was rebuilt
 * from (see docs/architecture/multilingual-curriculum.md): the communicative
 * objective and the pedagogical sequence are reused, the language is not.
 *
 * Twelve episodes, not seventeen: the English level's `make_a_plan` is not a
 * capability this level promises in Spanish, two English repair episodes
 * become one, and repair moves EARLIER (before the first full conversation)
 * because a beginner who meets native-speed Spanish needs "más despacio, por
 * favor" before they need anything else.
 */
export const ES_LEVEL = 'ES-Pre-A1'

const ep = (id, arc, canDoId, prerequisites, estimatedMinutes, xp, gardenItems, sourceEpisodes) => ({
  id: `es:${id}`,
  arc,
  level: ES_LEVEL,
  canDoId: `es:${canDoId}`,
  titleKey: `es.${id}.title`,
  goalKey: `es.${id}.goal`,
  canDoNameKey: `es.${id}.canDo`,
  estimatedMinutes,
  xp,
  prerequisites: prerequisites.map(p => `es:${p}`),
  gardenItems: gardenItems.map(g => `es:${g}`),
  sourceEpisodes,
})

export const ES_SKELETON = [
  ep('hola', 'es_hola', 'introduce_self', [], 6, 40, ['hola', 'buenos_dias', 'me_llamo', 'soy'], ['first_greeting']),
  ep('te_llamas', 'es_hola', 'ask_name', ['hola'], 7, 45, ['como_te_llamas', 'mucho_gusto', 'encantado'], ['ask_name', 'nice_to_meet']),
  ep('como_estas', 'es_hola', 'ask_wellbeing', ['te_llamas'], 7, 50, ['como_estas', 'que_tal', 'estoy_bien', 'y_tu', 'cansado', 'gracias'], ['how_are_you']),
  ep('de_donde', 'es_conectar', 'ask_origin', ['como_estas'], 8, 55, ['de_donde_eres', 'soy_de'], ['where_from']),
  ep('no_entiendo', 'es_conectar', 'ask_for_repair', ['de_donde'], 8, 55, ['no_entiendo', 'puede_repetir', 'mas_despacio', 'que_significa', 'como_se_dice'], ['lost_you', 'say_again']),
  ep('primera_charla', 'es_conectar', 'full_conversation', ['no_entiendo'], 10, 70, ['adios', 'hasta_luego'], ['first_conversation', 'we_can_continue']),
  ep('me_gusta', 'es_gustos', 'express_preferences', ['primera_charla'], 9, 55, ['me_gusta', 'no_me_gusta', 'te_gusta', 'el_cafe', 'la_musica'], ['what_you_like']),
  ep('quiero', 'es_gustos', 'express_needs', ['me_gusta'], 8, 55, ['quiero', 'necesito', 'el_agua', 'la_ayuda'], ['what_you_want']),
  ep('numeros', 'es_gustos', 'use_small_numbers', ['quiero'], 9, 75, ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'], ['how_many']),
  ep('que_es_esto', 'es_cafe', 'identify_things', ['numeros'], 8, 55, ['que_es_esto', 'el_libro', 'la_mesa', 'el_telefono', 'la_llave'], ['what_is_this']),
  ep('por_favor', 'es_cafe', 'polite_request', ['que_es_esto'], 8, 55, ['por_favor', 'me_da', 'quisiera', 'algo_mas'], ['a_coffee_please', 'anything_else']),
  ep('en_el_cafe', 'es_cafe', 'cafe_order', ['por_favor'], 10, 75, ['la_cuenta'], ['your_first_order']),
]

export const ES_SKELETON_BY_ID = Object.fromEntries(ES_SKELETON.map(e => [e.id, e]))

/*
 * The Garden's Spanish words. `term` is Spanish; `meaning` is keyed by the
 * auxiliary language, English only for now. `gender` is the noun's
 * grammatical gender where it has one — the evaluator reads the same table.
 */
const word = (id, term, kind, en, extra = {}) => ({ id: `es:${id}`, term, kind, meaning: { en }, ...extra })

export const ES_VOCAB = [
  word('hola', 'hola', 'expression', 'hi / hello'),
  word('buenos_dias', 'buenos días', 'expression', 'good morning'),
  word('me_llamo', 'me llamo…', 'chunk', 'my name is… (literally “I call myself…”)'),
  word('soy', 'soy', 'verb', 'I am (who or what you are)'),
  word('como_te_llamas', '¿cómo te llamas?', 'chunk', 'what’s your name? (friendly)'),
  word('mucho_gusto', 'mucho gusto', 'expression', 'nice to meet you'),
  word('encantado', 'encantado / encantada', 'expression', 'pleased to meet you'),
  word('como_estas', '¿cómo estás?', 'chunk', 'how are you? (friendly)'),
  word('que_tal', '¿qué tal?', 'chunk', 'how’s it going?'),
  word('estoy_bien', 'estoy bien', 'chunk', 'I’m fine / I’m well'),
  word('y_tu', '¿y tú?', 'chunk', 'and you?'),
  word('cansado', 'cansado / cansada', 'adjective', 'tired'),
  word('gracias', 'gracias', 'expression', 'thank you'),
  word('de_donde_eres', '¿de dónde eres?', 'chunk', 'where are you from?'),
  word('soy_de', 'soy de…', 'chunk', 'I’m from…'),
  word('no_entiendo', 'no entiendo', 'chunk', 'I don’t understand'),
  word('puede_repetir', '¿puede repetir?', 'chunk', 'can you repeat that?'),
  word('mas_despacio', 'más despacio', 'chunk', 'more slowly'),
  word('que_significa', '¿qué significa…?', 'chunk', 'what does … mean?'),
  word('como_se_dice', '¿cómo se dice…?', 'chunk', 'how do you say…?'),
  word('adios', 'adiós', 'expression', 'goodbye'),
  word('hasta_luego', 'hasta luego', 'expression', 'see you later'),
  word('me_gusta', 'me gusta…', 'chunk', 'I like… (literally “… pleases me”)'),
  word('no_me_gusta', 'no me gusta…', 'chunk', 'I don’t like…'),
  word('te_gusta', '¿te gusta…?', 'chunk', 'do you like…?'),
  word('el_cafe', 'el café', 'noun', 'coffee', { gender: 'm' }),
  word('la_musica', 'la música', 'noun', 'music', { gender: 'f' }),
  word('quiero', 'quiero…', 'verb', 'I want…'),
  word('necesito', 'necesito…', 'verb', 'I need…'),
  word('el_agua', 'el agua', 'noun', 'water (feminine, but “el agua”)', { gender: 'f' }),
  word('la_ayuda', 'la ayuda', 'noun', 'help', { gender: 'f' }),
  word('uno', 'uno', 'number', 'one'),
  word('dos', 'dos', 'number', 'two'),
  word('tres', 'tres', 'number', 'three'),
  word('cuatro', 'cuatro', 'number', 'four'),
  word('cinco', 'cinco', 'number', 'five'),
  word('seis', 'seis', 'number', 'six'),
  word('siete', 'siete', 'number', 'seven'),
  word('ocho', 'ocho', 'number', 'eight'),
  word('nueve', 'nueve', 'number', 'nine'),
  word('diez', 'diez', 'number', 'ten'),
  word('que_es_esto', '¿qué es esto?', 'chunk', 'what is this?'),
  word('el_libro', 'el libro', 'noun', 'book', { gender: 'm' }),
  word('la_mesa', 'la mesa', 'noun', 'table', { gender: 'f' }),
  word('el_telefono', 'el teléfono', 'noun', 'phone', { gender: 'm' }),
  word('la_llave', 'la llave', 'noun', 'key', { gender: 'f' }),
  word('por_favor', 'por favor', 'expression', 'please'),
  word('me_da', '¿me da…?', 'chunk', 'can I have…? (literally “do you give me…?”)'),
  word('quisiera', 'quisiera…', 'chunk', 'I would like…'),
  word('algo_mas', '¿algo más?', 'chunk', 'anything else?'),
  word('la_cuenta', 'la cuenta', 'noun', 'the bill / the check', { gender: 'f' }),
]

export const ES_VOCAB_BY_ID = Object.fromEntries(ES_VOCAB.map(item => [item.id, item]))

/* Home copy, by auxiliary language. */
export const ES_HOME_COPY = {
  en: {
    'es.hola.title': 'Hola!', 'es.hola.goal': 'Greet someone and say your name.', 'es.hola.canDo': 'Introduce myself in Spanish',
    'es.te_llamas.title': 'What’s your name?', 'es.te_llamas.goal': 'Ask someone’s name and say “nice to meet you”.', 'es.te_llamas.canDo': 'Ask someone’s name',
    'es.como_estas.title': 'How are you?', 'es.como_estas.goal': 'Ask how someone is, answer, and ask back.', 'es.como_estas.canDo': 'Ask and say how I am',
    'es.de_donde.title': 'Where are you from?', 'es.de_donde.goal': 'Say where you’re from and ask the other person.', 'es.de_donde.canDo': 'Talk about where I’m from',
    'es.no_entiendo.title': 'When Spanish is too fast', 'es.no_entiendo.goal': 'Ask someone to repeat, slow down, or explain a word.', 'es.no_entiendo.canDo': 'Keep a conversation going when I’m lost',
    'es.primera_charla.title': 'My first conversation', 'es.primera_charla.goal': 'Hold a short first conversation and say goodbye.', 'es.primera_charla.canDo': 'Have a short first conversation',
    'es.me_gusta.title': 'I like it', 'es.me_gusta.goal': 'Say what you like and don’t like, and ask others.', 'es.me_gusta.canDo': 'Talk about simple likes',
    'es.quiero.title': 'I want, I need', 'es.quiero.goal': 'Say what you want and what you need.', 'es.quiero.canDo': 'Say what I want and need',
    'es.numeros.title': 'One, two, three', 'es.numeros.goal': 'Count to ten and ask for a number of things.', 'es.numeros.canDo': 'Use numbers 1–10',
    'es.que_es_esto.title': 'What is this?', 'es.que_es_esto.goal': 'Ask what something is and name everyday objects.', 'es.que_es_esto.canDo': 'Name everyday objects',
    'es.por_favor.title': 'Please and thank you', 'es.por_favor.goal': 'Ask for something politely and answer “anything else?”.', 'es.por_favor.canDo': 'Ask for things politely',
    'es.en_el_cafe.title': 'At the café', 'es.en_el_cafe.goal': 'Order at a café from hello to goodbye.', 'es.en_el_cafe.canDo': 'Order at a café in Spanish',
  },
}
