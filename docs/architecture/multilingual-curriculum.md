# Currículo multilingüe: cursos, idioma objetivo e idioma auxiliar

> Estado al 2026-11-02 · rama local `beta/2026-11-es-for-en` · commit de código `738617f`
> Este documento describe lo **implementado y probado**. Lo pendiente está marcado como tal.

## 1. Tres idiomas, dos decisiones

| Concepto | Qué es | Dónde vive | Estado |
|---|---|---|---|
| Idioma de la interfaz | menús, botones, pantallas | `user_language` (`services/language.js`) | existente, 8 idiomas |
| Idioma de explicación | pistas, correcciones, significados | **el mismo** `user_language` (contrato de `CLAUDE.md`: una sola elección) | existente |
| Idioma objetivo | lo que el estudiante aprende | **curso activo** (`services/activeCourse.js`, clave `lc2-active-course`) | **nuevo**: `en` o `es` |

La interfaz y la explicación siguen siendo **una sola elección**, como exige `CLAUDE.md`, que no se reabrió. Lo que se separó es el **idioma objetivo**: ahora es el curso.

- **Caso A** (producto actual): un colombiano tiene `user_language=es` y curso `en`. Nada cambió para él.
- **Caso B** (nuevo): un estadounidense tiene `user_language=en` y curso `es`.

> **Conflicto con el contrato, a decidir por el propietario.** `CLAUDE.md` dice «a mobile-first app for learning English» y «target_language … currently **English**». Esta rama añade un segundo idioma objetivo por orden expresa del propietario (brief del 2026-11-01). Propuesta: actualizar `CLAUDE.md` en el mismo PR. No lo edité porque es el contrato del repositorio.

## 2. Registro de cursos (`src/learning/courses/registry.js`)

```
COURSES = {
  en: { targetLanguage: 'en', auxLanguages: null }            // todos los idiomas soportados
  es: { targetLanguage: 'es', auxLanguages: ['en'], levelId: 'es_pre_a1', loadContent: lazy }
}
```

- **`isCourseOffered(course, userLanguage)`**: el curso se ofrece solo si existe copia completa en el idioma auxiliar del estudiante y ese idioma no es el mismo que se aprende.
  - Un estudiante con interfaz en japonés **no ve** el curso de español: hoy le llegaría en inglés, y `CLAUDE.md` prohíbe anunciar un idioma que solo cae en inglés.
  - Un hispanohablante no puede «aprender español con explicaciones en español».
- **Si cambias de `user_language`** a uno no soportado por el curso activo, la app vuelve a inglés. No se borra nada.

## 3. Un solo almacén de progreso, IDs con espacio de nombres

**No hay una segunda fuente de verdad.** El curso de español escribe en los mismos almacenes de siempre: el modelo del estudiante, el registro de eventos de progreso, las copias por escritor y las ejecuciones de episodio.

- Todos sus identificadores llevan prefijo: `es:hola`, `es:me_llamo`, `es:introduce_self`.
- Lo mismo vale para sus errores recurrentes: `es:es_llamo_es`.
- Un identificador **sin prefijo** es del curso inglés.

Consecuencias:

1. **Migración nula.** Todo lo guardado antes de los cursos ya es inglés por definición. Hay una prueba que lo verifica: un modelo heredado conserva sus ítems y episodios, y el español empieza desde cero (`check-es-course` F).
2. **Habilidades independientes.** Saber «I'm» no acredita «me llamo». Son ítems distintos.
3. **Aislamiento entre cuentas heredado.** La clave nueva `lc2-active-course` usa el prefijo `lc2-`, así que vive en el espacio de la cuenta (`auth/localLease.js`) y se mueve con ella.
4. **Lo que se comparte a propósito:** XP, racha y cuenta. Miden la práctica de la persona, no un idioma. La recompensa sigue siendo idempotente por episodio (`episode-award:es:hola`).

**Lecturas que ahora filtran por curso:**

| Función | Antes | Ahora |
|---|---|---|
| `getDueReviews(model, at, { courseId })` | todos los ítems | solo el curso pedido. Por defecto `en`, que es exactamente el comportamiento anterior |
| `planDay(model, arc)` | repasos globales | repasos del curso del arco |
| `learnerSummary(model, at, { courseId })` | todos los ítems e historia | solo el curso. La preparación de Pre-A1 inglés solo aparece en `en` |
| `deriveInitialScaffold` → `recentStrain` | ejecuciones y errores globales | solo los del curso del episodio |
| `MemoryGarden` | todas las palabras | solo las del curso activo |
| `TodayView` (conteo de palabras) | todas | solo inglés |
| `copiesShownModel` | ignoraba mayúsculas y puntuación | además ignora tildes («como te llamas» copia «¿Cómo te llamas?») |

## 4. Transformación estructural (`src/learning/courses/transform.js`)

El curso inglés guarda sus textos como claves i18n en 8 idiomas. Además usa campos con nombres históricos (`promptEn`, `suggestionEn`, `textEn`, `sceneEn`) que para el reproductor significan «la línea en el idioma objetivo».

**Un curso nuevo se escribe de forma legible**: explicaciones en línea (por idioma auxiliar) y líneas objetivo en campos simples. `buildCourseEpisode` hace la parte mecánica:

- convierte cada texto auxiliar en una clave generada (`es.<episodio>.<paso>.<campo>`) dentro de la tabla de copia del curso;
- renombra los campos objetivo a los del reproductor;
- añade el prefijo a los IDs;
- pone el contexto del evaluador en `courseContext`, separado de los campos semánticos del motor inglés;
- rota las opciones de forma determinista. En el contenido inglés la respuesta correcta siempre va primera: es un fallo preexistente en Pre-A1, que está congelado y no toqué.

`validateCourseEpisode` comprueba lo que se construyó:

- cada paso termina en un cierre de lección (`completion`);
- hay instrucciones;
- los tipos de evaluación existen;
- toda respuesta modelo existe;
- las opciones tienen una correcta;
- la copia no falta;
- los ítems están en el vocabulario.

**Mapa objetivo inglés → español.** Se reutilizan el objetivo comunicativo y la secuencia pedagógica; no el idioma.

| Episodio ES | Fuente EN | Capacidad |
|---|---|---|
| `es:hola` | `first_greeting` | presentarse |
| `es:te_llamas` | `ask_name`, `nice_to_meet` | preguntar el nombre, mucho gusto |
| `es:como_estas` | `how_are_you` | cómo está alguien (estar) |
| `es:de_donde` | `where_from` | de dónde es (ser) |
| `es:no_entiendo` | `lost_you`, `say_again` | reparar: repetir, despacio, qué significa, cómo se dice |
| `es:primera_charla` | `first_conversation`, `we_can_continue` | conversación inicial y despedida |
| `es:me_gusta` | `what_you_like` | gustos (gustar, el/la) |
| `es:quiero` | `what_you_want` | quiero / necesito (un/una, el agua) |
| `es:numeros` | `how_many` | números 1–10, plural, uno→un |
| `es:que_es_esto` | `what_is_this` | identificar objetos, género, variantes regionales |
| `es:por_favor` | `a_coffee_please`, `anything_else` | pedir con cortesía, ¿algo más? |
| `es:en_el_cafe` | `your_first_order` | conversación completa en un café |

**12 episodios, no 17:**

- `make_a_plan` no es una capacidad que el brief pida para Pre-A1;
- los dos episodios ingleses de reparación se fusionan en uno;
- la reparación se adelanta antes de la primera conversación, porque quien empieza con español real necesita «más despacio, por favor» antes que nada.

## 5. Evaluador español (`src/learning/courses/es/evaluator.js`)

Es local, determinista y sin APIs. Devuelve **la misma forma** que el evaluador inglés (`base()`), más dos campos:

- `notEvaluable`: el evaluador no puede juzgar la respuesta;
- `spellingNote`: la frase del estudiante con las tildes corregidas.

Reglas:

1. **Precisión antes que cobertura.** Lo que no puede leer con confianza queda como `notEvaluable`. El reproductor muestra el patrón otra vez y **no registra nada en contra** (`EpisodeShell`: rama `!result.notEvaluable`).
2. **Las variantes regionales no son errores.**
   - Variantes aceptadas: `vos`, `¿mande?`, `¿me pone…?`, `¿me regala…?`, `chao/chau`, `más lento`.
   - Pares de vocabulario regional: móvil/celular/teléfono, ordenador/computadora, lapicera/bolígrafo/boli/pluma, zumo/jugo.
   - El sujeto antepuesto caribeño («¿Cómo tú estás?») también se acepta.
3. **Las tildes se enseñan, no se castigan.** «como te llamas» completa el objetivo y el elogio muestra «cómo te llamas». La `¿` inicial nunca es error. «tu» solo se corrige a «tú» al final de «¿y tú?», nunca en «tu nombre».
4. **Género, solo sobre sustantivos conocidos** (unos 70, incluidos los irregulares: el mapa, el día, la mano, la foto, el problema, y el caso del agua: el/un agua). Un sustantivo desconocido **nunca** se corrige por género.
5. **Ser/estar, solo donde este nivel lo enseña**: cómo estás (estar), de dónde eres (ser), qué es esto (ser).
6. **Calcos del inglés detectados**: «¿qué es tu nombre?», «¿dónde eres de?», «me llamo es», «yo gusto», «bueno conocerte», «estoy de Chile», «soy en».
7. **Respuesta en inglés** → «That’s English. Try it in Spanish».
8. **Los dígitos** («2 cafés») completan el turno, pero no dan evidencia de números (`targetEvidence: false`, como en inglés).
9. **Nunca se escala al evaluador remoto**: el backend solo sabe inglés y calificaría mal una frase correcta en español.

Hay 23 tipos de evaluación y unos 70 tipos de error, cada uno con su explicación en inglés (`evaluatorCopy.js`). Una prueba garantiza que no falte ninguna.

## 6. Reproductor (`EpisodeShell.jsx`)

Un episodio de curso trae `runtime = { courseId, targetLanguage, copy, vocab, evaluate, compareFill }`. Los episodios ingleses no lo traen y se comportan igual que antes. Los cambios son mínimos y retrocompatibles:

- `t` resuelve primero la copia del curso;
- `<En>` toma el `lang` del idioma objetivo (por contexto React; en inglés sigue con `lang="en"` literal);
- significados y Jardín usan el vocabulario del curso;
- el evaluador del curso sustituye a `evaluateFree` y al evaluador remoto;
- la comparación de huecos ignora tildes;
- se muestra la nota ortográfica junto al elogio;
- `before`/`after` del hueco resuelven los marcadores (antes `{name}` aparecía literal).

## 7. Qué no cambió

- Pre-A1 inglés (17 episodios), los blueprints y `levels.js` no se tocaron: A1–C2 siguen `available: false`.
- El chat libre (`/chat`) sigue siendo solo inglés. El Hoy del curso español lo dice («Lingua’s free conversation is English-only for now…»). No hay botón que finja una conversación en español.
- `CLOUD_PREFERENCES_RELEASED=false`. Sin proveedores de pago.

## 8. Regla «research-before-implementation» (`CLAUDE.md`)

1. **Problema del estudiante.** Un angloparlante sin español no tiene en LinguaChat ningún recorrido en su idioma objetivo.
2. **Evidencia medida en LinguaChat.** Ninguna sobre estudiantes de español: el curso es nuevo. Lo medido es interno (consistencia del recorrido simulado). **No hay evidencia de eficacia.**
3. **Principios** (`docs/research/learning-science-foundation.md`): recuperación diferida (cada episodio abre recordando el anterior), retroalimentación correctiva específica, andamiaje que se retira, transferencia a contextos nuevos (pasos `variation`), y evidencia independiente separada de la asistida.
4. **Qué falsaría el diseño.** En un piloto con consentimiento:
   - los estudiantes completan episodios, pero fallan el recuerdo sin ayuda a 2–7 días;
   - o el evaluador marca como error ≥10 % de respuestas que un nativo considera correctas;
   - o muestra `notEvaluable` en ≥20 % de los turnos.
5. **Medición independiente de los clics.** Tasa de recuerdo sin ayuda en el paso de calentamiento del episodio siguiente, días después. Más un muestreo de respuestas reales revisadas por un hablante nativo (falsos positivos y negativos del evaluador).

## 9. Fase 2 (2026-11-02): ya implementado

- **Sesión diaria del curso** (`learning/courses/courseSession.js`, `components/today/CourseSession.jsx`):
  - bloques de repaso, lección, reintento de error, transferencia y misión, armados solo con evidencia del curso;
  - mismas reglas de evidencia que el reproductor;
  - `check-es-session`.
- **Chat de práctica en español** (`linguachat-backend/ai/es_tutor.py` vía `/chat` con objetivo `es`; `CourseChat.jsx`):
  - reglas Pre-A1;
  - explicaciones en inglés;
  - «no entendí» en vez de corregir;
  - no otorga evidencia de dominio.
- **Voz del dispositivo en español** (`audio/speech.js`, `pickVoice`): nunca lee español con voz inglesa.
- **Seguridad del tutor** (`ai/safety.py`) delante de los dos chats.

## 10. Pendiente

- Diagnóstico de ubicación para español: todos empiezan en el episodio 1.
- Copia del curso de español en otros idiomas auxiliares (pt, fr, de, it, ja, ar).
- Evaluador español en el backend para `/learning/evaluate` (hoy los episodios evalúan en el cliente).
- Revisión del contenido por un hablante nativo.
