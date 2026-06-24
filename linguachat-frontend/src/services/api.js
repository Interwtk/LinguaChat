const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const VALID_MODES = new Set(['chat', 'translation', 'correction'])
const CONNECTION_MESSAGE = 'Lingua tuvo un problema de conexion. Puedes seguir practicando en modo local.'
const LOCAL_FALLBACK_MESSAGE = 'Lingua esta usando practica local mientras OpenAI no esta disponible.'

/* ─── Spanish detection ─── */
const SPANISH_WORDS = /\b(como se dice|que significa|como|quiero|viajar|hablar|necesito|puedo|tengo|hace|gracias|por favor|bueno|malo|mucho|poco|hola|adios|ayuda|dinero|trabajo|familia|comida|agua|casa|tiempo|amigo|amor|feliz|triste)\b/i
const SPANISH_CHARS = /[áéíóúüñ¿¡]/

/* ─── Translation map ─── */
const TRANSLATIONS = {
  'quiero viajar':          'I want to travel',
  'quiero comer':           'I want to eat',
  'me llamo':               'My name is',
  'no entiendo':            'I do not understand',
  'necesito ayuda':         'I need help',
  'gracias por todo':       'Thank you for everything',
  'cuanto cuesta':          'How much does it cost',
  'donde esta':             'Where is',
  'como te llamas':         'What is your name',
  'estoy cansado':          'I am tired',
  'tengo hambre':           'I am hungry',
  'quiero aprender ingles': 'I want to learn English',
  'buenos dias':            'Good morning',
  'buenas noches':          'Good night',
}

/* ─── Error patterns ─── */
const PATTERNS = [
  {
    test: /\bhow (you|u) are\b/i,
    correction: 'How are you?',
    why: 'En esta pregunta el orden natural es: How + are + you.',
    suggestion: "I'm doing great, thanks! What about you?",
  },
  {
    test: /\bme happy today\b/i,
    correction: "I'm happy today.",
    why: "Usa I'm antes de una emocion.",
    suggestion: "I'm happy today because I am learning.",
  },
  {
    test: /\bi am (boring|bored today|boring today)\b/i,
    correction: 'I feel bored.',
    why: 'Bored describe como se siente una persona. Boring describe una cosa.',
    suggestion: 'I feel bored today. The weather is so boring!',
  },
  {
    test: /\bi (don't|dont|do not) knows?\b/i,
    correction: "I don't know.",
    why: 'Con I usamos don\'t para negar.',
    suggestion: "I don't know the answer. Can you explain it?",
  },
  {
    test: /\bi (went|go) there yesterday\b/i,
    correction: 'I went there yesterday.',
    why: 'Yesterday pide pasado. Went es el pasado de go.',
    suggestion: 'I went to the market yesterday and bought vegetables.',
  },
  {
    test: /\bi want (go|eat|travel|learn|practice)\b/i,
    correction: text => text.replace(/i want (\w+)/i, (_, v) => `I want to ${v}`),
    why: 'Despues de want usa to + verbo.',
    suggestion: 'I want to travel to London next summer.',
  },
  {
    test: /\bi no (like|have|want|know|understand)\b/i,
    correction: text => text.replace(/i no (\w+)/i, (_, v) => `I don't ${v}`),
    why: 'Para negar una accion, usa don\'t o doesn\'t.',
    suggestion: "I don't like spicy food. What about you?",
  },
  {
    test: /\bshe (have|go|like|work|live)\b/i,
    correction: text => text.replace(/she (\w+)/i, (_, v) => `she ${v}s`),
    why: 'Con she, he o it, el verbo suele llevar -s.',
    suggestion: 'She works at a hospital. She goes there every morning.',
  },
]

/* ─── Natural responses by mode ─── */
const RESPONSES = {
  casual: [
    "Buen intento. Mira este ajuste breve.",
    "Vas bien. Te dejo una correccion util.",
    "Buena idea. Solo ajustemos la frase.",
    "Eso sirve para practicar. Probemos una version mejor.",
    "Bien. Hagamos que suene mas natural.",
  ],
  strict: [
    "Revisa este patron. Es importante.",
    "Casi. Este ajuste cambia el sentido.",
    "Buen intento. Corrijamos lo esencial.",
    "Este patron aparece mucho.",
    "Aqui esta lo que conviene ajustar.",
  ],
  friendly: [
    "Muy buen intento. Solo un ajuste pequeno.",
    "Me gusta que lo intentaste. Mira esta version.",
    "Casi perfecto. Ajustemos una cosa.",
    "Bien. Te dejo una nota corta.",
    "Estas cerca. Mira la correccion.",
  ],
  interview: [
    "Para contexto profesional, usa esta version.",
    "Buena estructura. Ajustemos el tono formal.",
    "Casual esta bien; para entrevista, mejor esta frase.",
    "Buen intento. Esta version es mas precisa.",
    "Buena respuesta. La version formal cambia un poco.",
  ],
  default: [
    "Buen intento. Te dejo una nota corta.",
    "Buena frase. Ajustemos una cosa.",
    "Vas por buen camino. Mira la nota.",
    "Sigue practicando. Estas cerca.",
    "Buen intento. Asi suena mejor.",
  ],
}

function pickResponse(mode) {
  const pool = RESPONSES[mode?.toLowerCase()] || RESPONSES.default
  return pool[Math.floor(Math.random() * pool.length)]
}

function randomDelay(min = 1200, max = 2200) {
  return new Promise(r => setTimeout(r, min + Math.random() * (max - min)))
}

function getMockResponse({ message, mode }) {
  const text = message.trim()

  /* Spanish translation request */
  const isSpanish = SPANISH_WORDS.test(text) || SPANISH_CHARS.test(text)
  if (isSpanish) {
    const lower = text.toLowerCase()
    let translation = null
    for (const [es, en] of Object.entries(TRANSLATIONS)) {
      if (lower.includes(es)) { translation = en; break }
    }
    if (!translation) {
      const wordMap = {
        quiero: 'I want', viajar: 'to travel', hablar: 'to speak',
        comer: 'to eat', necesito: 'I need', tengo: 'I have',
        hola: 'Hello', gracias: 'Thank you', ayuda: 'help',
        trabajo: 'work', familia: 'family', agua: 'water',
        casa: 'house', tiempo: 'weather/time', amigo: 'friend',
      }
      const parts = lower.split(/\s+/).map(w => wordMap[w] || w)
      translation = parts.join(' ')
    }
    return {
      message: 'Se dice asi en ingles:',
      translation,
      suggestion: `Usa la frase: ${translation}.`,
      learning_action: {
        type: 'complete_sentence',
        prompt: `Completala: "${translation} to ____."`,
        options: null,
      },
      focus: 'Traduccion util',
    }
  }

  /* Pattern matching */
  for (const p of PATTERNS) {
    if (p.test.test(text)) {
      const correction = typeof p.correction === 'function'
        ? p.correction(text)
        : p.correction
      return {
        message: pickResponse(mode),
        correction,
        why: p.why,
        suggestion: p.suggestion,
        learning_action: {
          type: 'rewrite',
          prompt: correction === 'How are you?'
            ? "Ahora responde: \"I'm good, thanks. And you?\""
            : correction === "I'm happy today."
              ? "Agrega una razon: \"I'm happy today because ____.\""
              : `Escribela otra vez con: "${correction}"`,
          options: null,
        },
        focus: 'Orden de palabras',
      }
    }
  }

  /* Clean sentence - positive feedback */
  const positives = [
    "Suena natural. Sigamos con una frase mas.",
    "Bien escrito. No hace falta corregir esa frase.",
    "Muy bien. Ahora puedes agregar un detalle.",
    "Correcto. Practiquemos una respuesta un poco mas completa.",
    "Esta frase esta bien. Buen punto de partida.",
    "Bien dicho. Una frase clara tambien cuenta.",
  ]
  return {
    message: positives[Math.floor(Math.random() * positives.length)],
    suggestion: text.length < 30
      ? `Agrega una idea: "${text} because ____."`
      : null,
    learning_action: {
      type: 'ask_back',
      prompt: 'Haz una pregunta de vuelta sobre el mismo tema.',
      options: null,
    },
    focus: 'Conversacion natural',
    word_to_use: 'because',
  }
}

/* ─── Public API ─── */
export function normalizeChatResponse(payload) {
  const data = typeof payload === 'string' ? { reply: payload } : (payload || {})
  const inferredMode = data.translation
    ? 'translation'
    : data.correction
      ? 'correction'
      : 'chat'
  const normalizedMode = VALID_MODES.has(data.mode) ? data.mode : inferredMode
  const translatedReply = data.translation
    ? `${data.message || "Here's that in English:"} ${data.translation}`
    : null

  return {
    reply: String(data.reply ?? data.response ?? translatedReply ?? data.message ?? 'Tell me more.'),
    correction: data.correction ?? null,
    explanation: data.explanation ?? data.why ?? null,
    suggestion: data.suggestion ?? null,
    mode: normalizedMode,
    learning_action: data.learning_action && data.learning_action.prompt
      ? {
          type: data.learning_action.type || 'answer_question',
          prompt: String(data.learning_action.prompt),
          options: Array.isArray(data.learning_action.options) ? data.learning_action.options : null,
        }
      : null,
    focus: data.focus ?? null,
    word_to_use: data.word_to_use ?? null,
  }
}

export async function sendChatMessage({ message, level, mode, history, sessionId, preferences, missionContext = null }) {
  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        level,
        mode,
        history,
        session_id: sessionId,
        preferences,
        missionContext,
      }),
      signal: AbortSignal.timeout(8000),
    })

    const payload = await res.json().catch(() => null)
    if (!res.ok) throw new Error(payload?.reply || `Backend error ${res.status}`)
    const isLocalFallback = res.headers.get('X-LinguaChat-Provider') === 'local'

    return {
      ...normalizeChatResponse(payload),
      isFallback: isLocalFallback,
      connectionMessage: isLocalFallback ? LOCAL_FALLBACK_MESSAGE : null,
    }
  } catch {
    await randomDelay(450, 850)
    return {
      ...normalizeChatResponse(getMockResponse({ message, mode })),
      isFallback: true,
      connectionMessage: CONNECTION_MESSAGE,
    }
  }
}
