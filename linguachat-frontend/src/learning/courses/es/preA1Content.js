/*
 * Spanish for English speakers — Pre-A1 episodes (lazy chunk).
 *
 * Original content written for LinguaChat. Each episode reuses the shape of
 * its English source (see `sourceEpisodes` in skeleton.js): open by recalling
 * the previous episode, model, check comprehension, build, produce with
 * support, produce in a new situation (transfer), recall unaided, close.
 * The Spanish itself is not translated from the English episodes: Spanish
 * says "me llamo", not "my name is", and asks "¿de dónde eres?", not
 * "¿dónde eres de?" — those differences are what the lessons teach.
 *
 * Characters come from several Spanish-speaking places on purpose (Lucía,
 * Mexico; Diego, Chile; Carmen, Spain; Mateo, Argentina), and the model
 * answers use international Spanish while the evaluator accepts the regional
 * forms a learner will really hear.
 *
 * Explanations are English (the only auxiliary language of this course).
 */
import { ES_SKELETON } from './skeleton.js'
import { ES_VOCAB } from './skeleton.js'
import { ES_HOME_COPY } from './skeleton.js'
import { buildCourseEpisode, validateCourseEpisode } from '../transform.js'
import { evaluateSpanish, fold, ES_EVAL_KINDS } from './evaluator.js'
import { ES_EVALUATOR_COPY } from './evaluatorCopy.js'

const AUTHORED = [
  {
    id: 'hola',
    steps: [
      { type: 'scene', mood: 'welcoming', showGoal: true, title: 'Your first Spanish words', body: 'Lingua is going to greet you in Spanish. By the end of this short lesson you’ll introduce yourself — no Spanish needed to start.', cta: 'Let’s go' },
      { type: 'model', target: '¡Hola! Me llamo Lingua.', meaning: ['hola', 'me_llamo'], explain: 'Hola = hi. Me llamo… = my name is… (literally “I call myself…”). Spanish opens exclamations with ¡ — you don’t have to type it.' },
      { type: 'comprehension', instruction: 'What did Lingua tell you?', target: '¡Hola! Me llamo Lingua.', item: 'me_llamo',
        options: [{ label: 'Her name is Lingua.', correct: true }, { label: 'She’s asking your name.' }, { label: 'She’s saying goodbye.' }] },
      { type: 'model', target: 'Buenos días. Soy Diego.', meaning: ['buenos_dias', 'soy'], explain: 'Buenos días = good morning. Soy… = I am… — another simple way to say your name.' },
      { type: 'word_order', instruction: 'Build the sentence: “Hi, my name is (you).”', hint: 'Start with the greeting.', item: 'me_llamo', tokens: ['Hola,', 'me', 'llamo', '{name}.'] },
      { type: 'fill_blank', instruction: 'Fill the gap.', hint: 'Like this:', placeholder: 'missing word', item: 'me_llamo', before: 'Me', after: ' {name}.', expects: 'llamo' },
      { type: 'free_reply', speaker: 'lingua', prompt: '¡Hola! Me llamo Lingua. ¿Y tú?', instruction: 'Greet Lingua and tell her your name.', eval: 'es_introduce', suggestion: 'Hola, me llamo {name}.', items: ['hola', 'me_llamo'] },
      { type: 'free_reply', variation: true, scene: 'Buenos días. Soy Carmen.', instruction: 'Someone new says good morning. Introduce yourself — try “soy” this time if you like.', eval: 'es_introduce', suggestion: 'Buenos días, soy {name}.', items: ['soy', 'buenos_dias'] },
      { type: 'recall', instruction: 'From memory: say hello and your name in Spanish.', eval: 'es_introduce', items: ['me_llamo'] },
      { type: 'completion', title: '¡Muy bien!', body: 'You just introduced yourself in Spanish. Next: asking other people their name.', cta: 'Finish' },
    ],
  },
  {
    id: 'te_llamas',
    steps: [
      { type: 'recall', review: true, instruction: 'Warm-up from last time: introduce yourself in Spanish.', eval: 'es_introduce', items: ['me_llamo'] },
      { type: 'scene', mood: 'welcoming', title: 'Your turn to ask', body: 'At a party, Lucía from Mexico says hi. You’ll ask her name and say “nice to meet you”.', ctaKey: 'ep1Continue' },
      { type: 'model', target: '¿Cómo te llamas?', response: 'Me llamo Lucía.', meaning: ['como_te_llamas'], explain: 'Literally “how do you call yourself?” — the everyday way to ask a name. With someone older or in a formal setting: ¿Cómo se llama usted?' },
      { type: 'comprehension', instruction: 'What is this person asking?', target: '¿Cómo se llama usted?', item: 'como_te_llamas',
        options: [{ label: 'Your name (politely).', correct: true }, { label: 'Where you’re from.' }, { label: 'How you are.' }] },
      { type: 'word_order', instruction: 'Build the question: “What’s your name?”', hint: 'Question word first.', item: 'como_te_llamas', tokens: ['¿Cómo', 'te', 'llamas?'] },
      { type: 'model', target: 'Mucho gusto.', response: 'Encantada.', meaning: ['mucho_gusto', 'encantado'], explain: 'Both mean “nice to meet you”. Encantado/encantada follows the speaker: men usually say encantado, women encantada. Mucho gusto never changes.' },
      { type: 'free_reply', speaker: 'lingua', prompt: '¡Hola!', instruction: 'Lucía says hi. Ask her name.', eval: 'es_ask_name', suggestion: '¿Cómo te llamas?', items: ['como_te_llamas'] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Me llamo Lucía. ¿Y tú?', instruction: 'Now tell her your name.', eval: 'es_introduce', suggestion: 'Me llamo {name}.', items: ['me_llamo'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¡Mucho gusto, {name}!', instruction: 'Say “nice to meet you” back.', eval: 'es_nice_to_meet', suggestion: 'Mucho gusto.', items: ['mucho_gusto'] },
      { type: 'free_reply', variation: true, scene: 'Buenas tardes.', instruction: 'An older man greets you at a meeting. Ask his name — the polite “usted” form fits, but “tú” is understood too.', eval: 'es_ask_name', suggestion: '¿Cómo se llama usted?', items: ['como_te_llamas'] },
      { type: 'recall', instruction: 'From memory: ask someone their name in Spanish.', eval: 'es_ask_name', items: ['como_te_llamas'] },
      { type: 'completion', title: '¡Mucho gusto!', body: 'You can ask names and answer politely. Next: “how are you?”', cta: 'Finish' },
    ],
  },
  {
    id: 'como_estas',
    steps: [
      { type: 'recall', review: true, instruction: 'Warm-up: ask someone their name.', eval: 'es_ask_name', items: ['como_te_llamas'] },
      { type: 'scene', mood: 'welcoming', title: 'How’s it going?', body: 'Diego, from Chile, is in your class. Every morning he asks how you are. For how you feel today, Spanish uses the verb estar: estoy bien.', ctaKey: 'ep1Continue' },
      { type: 'model', target: '¿Cómo estás?', response: 'Bien, gracias. ¿Y tú?', meaning: ['como_estas', 'estoy_bien', 'y_tu'], explain: '¿Cómo estás? = how are you? Bien, gracias = fine, thanks. ¿Y tú? = and you? The accent matters: tú is “you”, tu is “your”.' },
      { type: 'comprehension', instruction: 'What does “¿Qué tal?” mean?', target: '¿Qué tal?', item: 'que_tal',
        options: [{ label: 'How’s it going?', correct: true }, { label: 'What is that?' }, { label: 'What time is it?' }] },
      { type: 'choice', allValid: true, instruction: 'How do you feel today? Every answer here is right.', prompt: '¿Cómo estás?', item: 'estoy_bien',
        options: [{ text: 'Muy bien.', correct: true }, { text: 'Bien, gracias.', correct: true }, { text: 'Estoy cansado. / Estoy cansada.', correct: true }] },
      { type: 'model', target: 'Estoy cansada.', meaning: ['cansado'], explain: 'Feelings take estar: estoy bien, estoy cansado. The adjective follows the speaker — a man says cansado, a woman cansada. LinguaChat accepts either form from you.' },
      { type: 'free_reply', speaker: 'lingua', prompt: '¡Hola, {name}! ¿Cómo estás?', instruction: 'Tell Diego how you are.', eval: 'es_answer_wellbeing', suggestion: 'Bien, gracias.', items: ['estoy_bien'] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Hola, soy Diego.', instruction: 'Greet Diego and ask how he is.', eval: 'es_ask_wellbeing', suggestion: 'Hola, ¿cómo estás?', items: ['como_estas'] },
      { type: 'free_reply', variation: true, scene: '¿Qué tal, {name}?', instruction: 'Answer, then ask him back — two short pieces.', eval: 'es_reciprocal', suggestion: 'Bien, gracias. ¿Y tú?', items: ['y_tu'] },
      { type: 'recall', instruction: 'From memory: ask someone how they are.', eval: 'es_ask_wellbeing', items: ['como_estas'] },
      { type: 'completion', title: '¡Genial!', body: 'You can ask and answer “how are you?”. Next: where people are from.', cta: 'Finish' },
    ],
  },
  {
    id: 'de_donde',
    steps: [
      { type: 'recall', review: true, instruction: 'Warm-up: say how you are today.', eval: 'es_answer_wellbeing', items: ['estoy_bien'] },
      { type: 'scene', mood: 'welcoming', title: 'Where are you from?', body: 'Carmen is from Spain; Mateo is from Argentina. Where you’re from never changes, so Spanish uses ser for it: soy de…, ¿de dónde eres?', ctaKey: 'ep1Continue' },
      { type: 'model', target: '¿De dónde eres?', response: 'Soy de España.', meaning: ['de_donde_eres', 'soy_de'], explain: 'Word for word: “from where are you?”. In Spanish “de” comes first — a question never ends with it.' },
      { type: 'comprehension', instruction: 'What did Mateo say?', target: 'Soy de Argentina. ¿Y tú?', item: 'soy_de',
        options: [{ label: 'He’s from Argentina and asks where you’re from.', correct: true }, { label: 'He’s going to Argentina.' }, { label: 'He likes Argentina.' }] },
      { type: 'word_order', instruction: 'Build the question: “Where are you from?”', hint: 'The little word “de” goes first.', item: 'de_donde_eres', tokens: ['¿De', 'dónde', 'eres?'] },
      { type: 'fill_blank', instruction: 'Fill the gap: “I’m from Chile.”', hint: 'Remember the word for “from”:', placeholder: 'missing word', item: 'soy_de', before: 'Soy', after: ' Chile.', expects: 'de' },
      { type: 'free_reply', speaker: 'lingua', prompt: '¡Hola! Soy Carmen, de España. ¿De dónde eres?', instruction: 'Tell Carmen where you’re from.', eval: 'es_say_origin', suggestion: 'Soy de Estados Unidos.', items: ['soy_de'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¡Hola! Me llamo Mateo.', instruction: 'Ask Mateo where he’s from.', eval: 'es_ask_origin', suggestion: '¿De dónde eres?', items: ['de_donde_eres'] },
      { type: 'free_reply', variation: true, scene: 'Buenas tardes. Soy la profesora Gómez.', instruction: 'Your teacher introduces herself. Ask where she’s from — with usted if you can.', eval: 'es_ask_origin', suggestion: '¿De dónde es usted?', items: ['de_donde_eres'] },
      { type: 'recall', instruction: 'From memory: say where you’re from.', eval: 'es_say_origin', items: ['soy_de'] },
      { type: 'completion', title: '¡Excelente!', body: 'You can say and ask where people are from. Next: what to say when Spanish is too fast.', cta: 'Finish' },
    ],
  },
  {
    id: 'no_entiendo',
    steps: [
      { type: 'recall', review: true, instruction: 'Warm-up: ask someone where they’re from.', eval: 'es_ask_origin', items: ['de_donde_eres'] },
      { type: 'scene', mood: 'supportive', title: 'When Spanish goes too fast', body: 'Real Spanish is fast. Not understanding is normal — the skill is knowing what to say next. Here are five phrases that keep any conversation alive.', ctaKey: 'ep1Continue' },
      { type: 'model', target: 'Perdón, no entiendo.', meaning: ['no_entiendo'], explain: 'No entiendo = I don’t understand. Perdón softens it, like “sorry”.' },
      { type: 'model', target: '¿Puede repetir, por favor?', response: 'Más despacio, por favor.', meaning: ['puede_repetir', 'mas_despacio'], explain: 'Can you repeat that, please? / More slowly, please. With friends: ¿Puedes repetir? In Mexico you’ll also hear ¿Mande? for “sorry, what?”.' },
      { type: 'comprehension', instruction: 'What is this person asking?', target: '¿Qué significa «despacio»?', item: 'que_significa',
        options: [{ label: 'What “despacio” means.', correct: true }, { label: 'How to spell “despacio”.' }, { label: 'To speak more slowly.' }] },
      { type: 'choice', instruction: 'Lingua said that far too fast. What do you say?', prompt: '¿Dequépaíseresyquéhacesaquí?', item: 'mas_despacio',
        options: [{ text: 'Más despacio, por favor.', correct: true }, { text: 'Mucho gusto.' }, { text: 'Me llamo Lingua.' }] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Bueno, entonces nos vemos mañana a las nueve en la biblioteca, ¿vale?', instruction: 'That was a lot. Ask Lingua to repeat it.', eval: 'es_repair', ctx: { repairKind: 'repeat' }, suggestion: '¿Puede repetir, por favor?', items: ['puede_repetir'] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Nos vemos mañana a las nueve, ¿vale?', instruction: 'Still too fast. Ask her to speak more slowly.', eval: 'es_repair', ctx: { repairKind: 'slow_down' }, suggestion: 'Más despacio, por favor.', items: ['mas_despacio'] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Mañana. En la biblioteca.', instruction: 'You don’t know the word “biblioteca”. Ask what it means.', eval: 'es_repair', ctx: { repairKind: 'ask_meaning', meaningWord: 'biblioteca' }, suggestion: '¿Qué significa «biblioteca»?', items: ['que_significa'] },
      { type: 'free_reply', variation: true, scene: '«Biblioteca» es “library”.', instruction: 'Now ask how to say “see you tomorrow” in Spanish.', eval: 'es_repair', ctx: { repairKind: 'how_to_say', meaningWord: 'see you tomorrow' }, suggestion: '¿Cómo se dice «see you tomorrow» en español?', items: ['como_se_dice'] },
      { type: 'recall', instruction: 'From memory: tell someone you don’t understand.', eval: 'es_repair', ctx: { repairKind: 'not_understand' }, items: ['no_entiendo'] },
      { type: 'completion', title: '¡Muy útil!', body: 'You can keep a conversation going even when you’re lost. Next: your first full conversation.', cta: 'Finish' },
    ],
  },
  {
    id: 'primera_charla',
    steps: [
      { type: 'scene', mood: 'welcoming', showGoal: true, title: 'Your first real conversation', body: 'You meet Mateo at a language exchange. Use everything so far: hello, names, how you are, where you’re from — and goodbye.', ctaKey: 'ep1Continue' },
      { type: 'free_reply', speaker: 'lingua', prompt: '¡Hola! Me llamo Mateo. ¿Cómo te llamas?', instruction: 'Introduce yourself.', eval: 'es_introduce', suggestion: 'Hola, me llamo {name}.', items: ['me_llamo'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¡Mucho gusto, {name}!', instruction: 'Answer politely.', eval: 'es_nice_to_meet', suggestion: 'Igualmente.', items: ['mucho_gusto'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿Cómo estás?', instruction: 'Say how you are — and ask him back.', eval: 'es_reciprocal', suggestion: 'Muy bien, gracias. ¿Y tú?', items: ['estoy_bien', 'y_tu'] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Bien también. ¿De dónde eres?', instruction: 'Tell him where you’re from.', eval: 'es_say_origin', suggestion: 'Soy de Estados Unidos.', items: ['soy_de'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¡Qué bien! Yo soy de Rosario, en Argentina.', instruction: 'You didn’t catch the city. Ask him to repeat.', eval: 'es_repair', ctx: { repairKind: 'repeat' }, suggestion: '¿Puedes repetir, por favor?', items: ['puede_repetir'] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Ro-sa-rio. Bueno, me tengo que ir. ¡Chau!', instruction: 'Mateo has to go. Say goodbye.', eval: 'es_goodbye', suggestion: '¡Adiós, hasta luego!', items: ['adios', 'hasta_luego'] },
      { type: 'model', target: '¡Chao! · ¡Chau!', meaning: ['adios'], explain: 'Chao (Chile, Colombia…) and chau (Argentina, Uruguay) are casual goodbyes borrowed from Italian “ciao”. Adiós and hasta luego work everywhere.' },
      { type: 'recall', instruction: 'From memory: say goodbye in Spanish.', eval: 'es_goodbye', items: ['hasta_luego'] },
      { type: 'completion', title: '¡Tu primera conversación!', body: 'Hello, names, how you are, where you’re from, a repair and a goodbye — all in Spanish.', cta: 'Finish' },
    ],
  },
  {
    id: 'me_gusta',
    steps: [
      { type: 'recall', review: true, instruction: 'Warm-up: introduce yourself.', eval: 'es_introduce', items: ['me_llamo'] },
      { type: 'scene', mood: 'welcoming', title: 'Things you like', body: 'In Spanish you don’t “like” things — things please you. Me gusta el café = coffee pleases me. It feels odd for a day, then it clicks.', ctaKey: 'ep1Continue' },
      { type: 'model', target: 'Me gusta la música.', response: 'No me gusta el café.', meaning: ['me_gusta', 'no_me_gusta'], explain: 'Me gusta = I like. No me gusta = I don’t like (no goes first). For things in general Spanish keeps the article: el café, la música.' },
      { type: 'model', target: 'Me gustan los libros.', meaning: ['me_gusta'], explain: 'With several things, gusta becomes gustan. Every noun is masculine (el) or feminine (la) — learn it together with its article.' },
      { type: 'comprehension', instruction: 'What does this person say?', target: 'No me gusta el café.', item: 'no_me_gusta',
        options: [{ label: 'They don’t like coffee.', correct: true }, { label: 'They want a coffee.' }, { label: 'They like coffee a lot.' }] },
      { type: 'choice', instruction: 'Pick the natural answer.', prompt: '¿Te gusta la música?', item: 'me_gusta',
        options: [{ text: 'Sí, me gusta mucho.', correct: true }, { text: 'Sí, yo gusto la música.' }, { text: 'Sí, me gusto.' }] },
      { type: 'fill_blank', instruction: 'Fill the gap: “I like coffee.”', hint: 'Café is masculine:', placeholder: 'article', item: 'el_cafe', before: 'Me gusta', after: ' café.', expects: 'el' },
      { type: 'free_reply', speaker: 'lingua', prompt: 'A mí me gusta mucho el fútbol. ¿Y a ti? ¿Qué te gusta?', instruction: 'Tell Lingua something you like.', eval: 'es_express_like', ctx: { targetThing: 'musica' }, suggestion: 'Me gusta la música.', items: ['me_gusta', 'la_musica'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿Te gusta el café?', instruction: 'Say you don’t like it (even if you do!).', eval: 'es_express_dislike', ctx: { targetThing: 'cafe' }, suggestion: 'No me gusta el café.', items: ['no_me_gusta', 'el_cafe'] },
      { type: 'free_reply', variation: true, scene: 'Me gusta el cine.', instruction: 'Ask Lingua if she likes music.', eval: 'es_ask_like', ctx: { targetThing: 'musica' }, suggestion: '¿Te gusta la música?', items: ['te_gusta'] },
      { type: 'recall', instruction: 'From memory: say one thing you like.', eval: 'es_express_like', ctx: { targetThing: 'cafe' }, items: ['me_gusta'] },
      { type: 'completion', title: '¡Me gusta!', body: 'You can talk about what you like and don’t like. Next: what you want and need.', cta: 'Finish' },
    ],
  },
  {
    id: 'quiero',
    steps: [
      { type: 'recall', review: true, instruction: 'Warm-up: say something you like.', eval: 'es_express_like', ctx: { targetThing: 'musica' }, items: ['me_gusta'] },
      { type: 'scene', mood: 'welcoming', title: 'Want and need', body: 'Quiero = I want. Necesito = I need. The thing follows right after: quiero agua, necesito ayuda.', ctaKey: 'ep1Continue' },
      { type: 'model', target: 'Quiero un café.', response: 'Necesito ayuda.', meaning: ['quiero', 'necesito'], explain: 'Un/una = a: un café (masculine), una mesa (feminine). Famous exception: agua is feminine but says un agua, el agua.' },
      { type: 'comprehension', instruction: 'What does this person need?', target: 'Necesito ayuda, por favor.', item: 'necesito',
        options: [{ label: 'Help.', correct: true }, { label: 'Water.' }, { label: 'A coffee.' }] },
      { type: 'word_order', instruction: 'Build: “I want a coffee.”', hint: 'Verb first, then the thing.', item: 'quiero', tokens: ['Quiero', 'un', 'café.'] },
      { type: 'fill_blank', instruction: 'Fill the gap: “I want a water.”', hint: 'Agua takes the masculine article in the singular:', placeholder: 'article', item: 'el_agua', before: 'Quiero', after: ' agua.', expects: 'un', alternatives: ['el'] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Hace mucho calor. ¿Quieres algo?', instruction: 'It’s hot. Say you want water.', eval: 'es_want', ctx: { targetThing: 'agua' }, suggestion: 'Quiero agua.', items: ['quiero', 'el_agua'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿Qué pasa? ¿Estás bien?', instruction: 'You’re lost in the city. Say you need help.', eval: 'es_need', ctx: { targetThing: 'ayuda' }, suggestion: 'Necesito ayuda.', items: ['necesito', 'la_ayuda'] },
      { type: 'free_reply', variation: true, scene: 'Mañana tenemos clase.', instruction: 'You need a book for class. Say so.', eval: 'es_need', ctx: { targetThing: 'libro' }, suggestion: 'Necesito un libro.', items: ['necesito'] },
      { type: 'recall', instruction: 'From memory: say something you want.', eval: 'es_want', ctx: { targetThing: 'cafe' }, items: ['quiero'] },
      { type: 'completion', title: '¡Claro!', body: 'You can say what you want and need. Next: numbers.', cta: 'Finish' },
    ],
  },
  {
    id: 'numeros',
    steps: [
      { type: 'recall', review: true, instruction: 'Warm-up: say you want something.', eval: 'es_want', ctx: { targetThing: 'agua' }, items: ['quiero'] },
      { type: 'scene', mood: 'welcoming', title: 'Uno, dos, tres', body: 'Numbers 1 to 10. Two tricks: before a noun, uno becomes un or una (un café), and from dos up the noun goes plural (dos cafés).', ctaKey: 'ep1Continue' },
      { type: 'model', target: 'uno, dos, tres, cuatro, cinco', meaning: ['uno', 'dos', 'tres', 'cuatro', 'cinco'], explain: 'Every vowel is short and clear: cuatro sounds like “KWAH-troh”. Cinco is “SEEN-koh” in Latin America and “THEEN-koh” in much of Spain — both are right.' },
      { type: 'model', target: 'seis, siete, ocho, nueve, diez', meaning: ['seis', 'siete', 'ocho', 'nueve', 'diez'], explain: 'Seis rhymes with “base”. Diez is ten.' },
      { type: 'comprehension', instruction: 'Which number is “ocho”?', target: 'ocho', item: 'ocho',
        options: [{ label: '8', correct: true }, { label: '4' }, { label: '6' }] },
      { type: 'comprehension', instruction: 'How many coffees?', target: 'Tres cafés, por favor.', item: 'tres',
        options: [{ label: 'Three.', correct: true }, { label: 'Two.' }, { label: 'Ten.' }] },
      { type: 'choice', instruction: 'There are two books. Pick the right answer.', prompt: '¿Cuántos libros hay?', item: 'dos',
        options: [{ text: 'Dos libros.', correct: true }, { text: 'Dos libro.' }, { text: 'Uno libros.' }] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿Cuántos cafés quieren?', instruction: 'You and a friend each want one. Say “two coffees”.', eval: 'es_quantity', ctx: { targetThing: 'cafe', targetCount: 2, quantityForm: 'with_object' }, suggestion: 'Dos cafés.', items: ['dos'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿Cuántas personas son?', instruction: 'There are four of you. Answer with just the number.', eval: 'es_quantity', ctx: { targetThing: 'cafe', targetCount: 4, quantityForm: 'bare' }, suggestion: 'Cuatro.', items: ['cuatro'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿Y cuántos libros necesitas?', instruction: 'Say you need one book.', eval: 'es_quantity', ctx: { targetThing: 'libro', targetCount: 1, quantityForm: 'with_object' }, suggestion: 'Un libro.', items: ['uno'] },
      { type: 'free_reply', variation: true, scene: 'Una mesa para un grupo grande.', instruction: 'Ask for six bottles of water, politely.', eval: 'es_quantity', ctx: { targetThing: 'botella', targetCount: 6, quantityForm: 'polite_request' }, suggestion: 'Seis botellas de agua, por favor.', items: ['seis'] },
      { type: 'recall', instruction: 'From memory: ask for three coffees, politely.', eval: 'es_quantity', ctx: { targetThing: 'cafe', targetCount: 3, quantityForm: 'polite_request' }, items: ['tres'] },
      { type: 'completion', title: '¡Uno, dos, tres!', body: 'You can count to ten and ask for a number of things. Next: naming everyday objects.', cta: 'Finish' },
    ],
  },
  {
    id: 'que_es_esto',
    steps: [
      { type: 'recall', review: true, instruction: 'Warm-up: ask for two coffees, politely.', eval: 'es_quantity', ctx: { targetThing: 'cafe', targetCount: 2, quantityForm: 'polite_request' }, items: ['dos'] },
      { type: 'scene', mood: 'welcoming', title: 'What is this?', body: 'Point, ask, learn. ¿Qué es esto? works for anything you can’t name yet. And every noun is un (masculine) or una (feminine).', ctaKey: 'ep1Continue' },
      { type: 'model', target: '¿Qué es esto?', response: 'Es un libro.', meaning: ['que_es_esto', 'el_libro'], explain: 'Esto = this (thing). Es un… / Es una… = it’s a…' },
      { type: 'model', target: 'Es una llave.', response: 'Es un teléfono.', meaning: ['la_llave', 'el_telefono'], explain: 'Many nouns in -a are feminine (una mesa) and many in -o masculine (un libro) — but not all: llave is feminine, teléfono masculine. A phone is also un celular in Latin America and un móvil in Spain; all three are right.' },
      { type: 'comprehension', instruction: 'What is it?', target: 'Es una mesa.', item: 'la_mesa',
        options: [{ label: 'A table.', correct: true }, { label: 'A key.' }, { label: 'A book.' }] },
      { type: 'choice', instruction: 'Lingua holds up a key. Choose the correct answer.', prompt: '¿Qué es esto?', item: 'la_llave',
        options: [{ text: 'Es una llave.', correct: true }, { text: 'Es un llave.' }, { text: 'Está una llave.' }] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Mira esto.', instruction: 'Ask Lingua what it is.', eval: 'es_ask_what', suggestion: '¿Qué es esto?', items: ['que_es_esto'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿Qué es esto?', instruction: 'Lingua points to a book. Tell her what it is.', eval: 'es_identify_thing', ctx: { targetThing: 'libro' }, suggestion: 'Es un libro.', items: ['el_libro'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿Y esto?', instruction: 'Now she points to a table.', eval: 'es_identify_thing', ctx: { targetThing: 'mesa' }, suggestion: 'Es una mesa.', items: ['la_mesa'] },
      { type: 'free_reply', variation: true, scene: '¿Y esto?', instruction: 'She holds up her phone. Name it — any regional word works.', eval: 'es_identify_thing', ctx: { targetThing: 'telefono' }, suggestion: 'Es un teléfono.', items: ['el_telefono'] },
      { type: 'recall', instruction: 'From memory: ask what something is.', eval: 'es_ask_what', items: ['que_es_esto'] },
      { type: 'completion', title: '¡Muy bien!', body: 'You can ask what things are and name them with the right article. Next: asking politely.', cta: 'Finish' },
    ],
  },
  {
    id: 'por_favor',
    steps: [
      { type: 'recall', review: true, instruction: 'Warm-up: Lingua shows you a key. Say what it is.', eval: 'es_identify_thing', ctx: { targetThing: 'llave' }, items: ['la_llave'] },
      { type: 'scene', mood: 'welcoming', title: 'Please and thank you', body: 'In a café, the thing plus por favor is enough: un café, por favor. Quisiera… (I’d like…) is extra polite. In Spain you’ll hear ¿me pone…?, in Colombia ¿me regala…? — all correct.', ctaKey: 'ep1Continue' },
      { type: 'model', target: 'Un café, por favor.', response: 'Gracias.', meaning: ['por_favor', 'gracias'], explain: 'Por favor = please. Gracias = thank you. Short and perfectly polite.' },
      { type: 'model', target: '¿Me da un agua, por favor?', response: 'Quisiera un té.', meaning: ['me_da', 'quisiera'], explain: '¿Me da…? is literally “do you give me…?” — normal and polite in Spanish. Quisiera = I would like.' },
      { type: 'comprehension', instruction: 'The waiter asks this. What does it mean?', target: '¿Algo más?', item: 'algo_mas',
        options: [{ label: 'Anything else?', correct: true }, { label: 'Something to drink?' }, { label: 'Is everything OK?' }] },
      { type: 'choice', instruction: 'The waiter asks what you’d like. Which answer is the most polite?', prompt: '¿Qué desea?', item: 'quisiera',
        options: [{ text: 'Quisiera un café, por favor.', correct: true }, { text: 'Quiero café.' }, { text: 'Dame café.' }] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Buenos días. ¿Qué desea?', instruction: 'Order a coffee, politely.', eval: 'es_polite_request', ctx: { targetThing: 'cafe' }, suggestion: 'Un café, por favor.', items: ['por_favor'] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Aquí tiene.', instruction: 'The waiter hands it to you. Thank him.', eval: 'es_thank', suggestion: 'Gracias.', items: ['gracias'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿Algo más?', instruction: 'You’re done — say “no, thanks”.', eval: 'es_anything_else', suggestion: 'No, gracias. Nada más.', items: ['algo_mas'] },
      { type: 'free_reply', variation: true, scene: '¿Y para usted?', instruction: 'Your friend’s turn — order a water for them with “¿me da…?” or “quisiera…”.', eval: 'es_polite_request', ctx: { targetThing: 'agua' }, suggestion: '¿Me da un agua, por favor?', items: ['me_da'] },
      { type: 'recall', instruction: 'From memory: ask for a tea, politely.', eval: 'es_polite_request', ctx: { targetThing: 'te' }, items: ['quisiera'] },
      { type: 'completion', title: '¡Muchas gracias!', body: 'You can ask for things politely. Last stop: a whole order at a café.', cta: 'Finish' },
    ],
  },
  {
    id: 'en_el_cafe',
    steps: [
      { type: 'scene', mood: 'welcoming', showGoal: true, title: 'At the café', body: 'A café in Madrid. The full order, start to finish: greet, order for two, catch what the waiter says, ask for the bill and say goodbye. You know all of it.', ctaKey: 'ep1Continue' },
      { type: 'free_reply', speaker: 'lingua', prompt: '¡Buenas tardes!', instruction: 'Greet the waiter.', eval: 'es_greet', suggestion: '¡Buenas tardes!', items: ['hola'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿Qué van a tomar?', instruction: 'Order two coffees, politely.', eval: 'es_quantity', ctx: { targetThing: 'cafe', targetCount: 2, quantityForm: 'polite_request' }, suggestion: 'Dos cafés, por favor.', items: ['dos', 'por_favor'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿Los queréis con leche o solos, y algo para comer también?', instruction: 'That was fast (and very Spain — “queréis”). Ask him to repeat.', eval: 'es_repair', ctx: { repairKind: 'repeat' }, suggestion: '¿Puede repetir, por favor?', items: ['puede_repetir'] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Con leche o solos. ¿Algo más?', instruction: 'Add a sandwich to the order.', eval: 'es_anything_else', suggestion: 'Sí, un sándwich, por favor.', items: ['algo_mas'] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Aquí tienen.', instruction: 'Thank the waiter.', eval: 'es_thank', suggestion: 'Muchas gracias.', items: ['gracias'] },
      { type: 'free_reply', speaker: 'lingua', prompt: '¿Todo bien?', instruction: 'You’ve finished. Ask for the bill.', eval: 'es_ask_bill', suggestion: 'La cuenta, por favor.', items: ['la_cuenta'] },
      { type: 'free_reply', speaker: 'lingua', prompt: 'Son ocho euros. ¡Hasta luego!', instruction: 'Pay and say goodbye.', eval: 'es_goodbye', suggestion: '¡Gracias, hasta luego!', items: ['hasta_luego'] },
      { type: 'recall', instruction: 'From memory, one last time: order a coffee politely.', eval: 'es_polite_request', ctx: { targetThing: 'cafe' }, items: ['por_favor'] },
      { type: 'completion', title: '¡Felicidades!', body: 'You ordered at a café entirely in Spanish. That completes the first level: greetings, names, feelings, origin, repair, likes, needs, numbers, objects and polite requests.', cta: 'Finish' },
    ],
  },
]

const AUX = 'en'
const COPY = { ...ES_HOME_COPY[AUX], ...ES_EVALUATOR_COPY[AUX] }
const VOCAB_BY_ID = Object.fromEntries(ES_VOCAB.map(item => [item.id, item]))

/*
 * A gap is compared without accents and punctuation: typing "llamo" for
 * "llamo" or "de" for "de" is the point; "dónde"/"donde" is a spelling tip,
 * not a wrong word.
 */
const compareFill = (typed, want) => fold(typed) === fold(want)

const RUNTIME = Object.freeze({ courseId: 'es', targetLanguage: 'es', auxLanguage: AUX, copy: COPY, vocab: VOCAB_BY_ID, evaluate: evaluateSpanish, compareFill })

const BY_ID = new Map(AUTHORED.map(authored => {
  const meta = ES_SKELETON.find(e => e.id === `es:${authored.id}`)
  const episode = buildCourseEpisode({ courseId: 'es', meta, authored, aux: AUX, copy: COPY })
  return [episode.id, { ...episode, runtime: RUNTIME }]
}))

export const ES_EPISODES = [...BY_ID.values()]
export const getEpisode = (id) => BY_ID.get(id) || null

/* For the checks: every built episode's problems, flattened. */
export function validateSpanishCourse() {
  const vocabIds = new Set(Object.keys(VOCAB_BY_ID))
  const problems = []
  if (ES_EPISODES.length !== ES_SKELETON.length) problems.push(`built ${ES_EPISODES.length} of ${ES_SKELETON.length} skeleton episodes`)
  for (const episode of ES_EPISODES) problems.push(...validateCourseEpisode(episode, { copy: COPY, evalKinds: ES_EVAL_KINDS, vocabIds, courseId: 'es' }))
  for (const meta of ES_SKELETON) {
    for (const g of meta.gardenItems) if (!vocabIds.has(g)) problems.push(`${meta.id}: garden item ${g} not in vocabulary`)
    for (const key of [meta.titleKey, meta.goalKey, meta.canDoNameKey]) if (!COPY[key]) problems.push(`${meta.id}: missing copy ${key}`)
  }
  return problems
}

export { COPY as ES_COPY }
