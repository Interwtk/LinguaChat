# Inglés A1 — revisión de preparación para abrir

> 2026-11-04 · rama local `beta/2026-11-es-for-en` · cabeza `23fab77`. Comprobaciones corridas sobre `bafb8cf`; hasta `23fab77` no cambió nada de inglés Pre-A1 ni A1, y los conteos de pasos se repitieron.
> **Diagnóstico, no decisión.** A1 sigue `contentStatus: 'partial'`, `available: false` (`src/learning/curriculum/levels.js`). Pre-A1 congelado, sin cambios. Fuente curricular: `a1-blueprint.json` gana.
> Rutas `src/…`, `scripts/…`, `prepared/…`: relativas a `linguachat-frontend/`.

## 1. Veredicto

| Estado | Pregunta | A1 hoy | Evidencia |
|---|---|---|---|
| **Construido** | ¿corre el contenido? | **Sí** | 7 arcos, 21 episodios, 237 pasos; 21/21 cargan; 0 abribles por un estudiante |
| **Aprobado pedagógicamente** | ¿lo firmó un docente humano? | **No** | `LINGUACHAT-MASTER.md` §0: «no aprobado pedagógicamente». El PASS de `final-supervisor-acceptance.md` §6 es estructural |
| **Probado con estudiantes** | ¿alguien aprendió? | **No** | 0 participantes. `pre-a1-pilot-protocol.md`: borrador, no aprobado, y excluye validar A1 |

Todo «pasa» abajo es consistencia interna simulada. Ninguna cifra mide aprendizaje.

## 2. Qué se verificó hoy (solo lectura)

| Comando / lectura | Resultado |
|---|---|
| `curriculum-readiness-matrix.mjs --check` | OK, documento coincide con runtime |
| `check-a1-arc1…5` | 14 / 15 / 18 / 19 / 19 grupos, exit 0 |
| `foundry/a1/check-a1-arc6-arc7-{structure,evaluators,journeys}` | OK; evaluadores 41/41 |
| `check-a1-blueprint`, `check-a1-readiness`, `check-learner-level` | exit 0; 12/12; 11/11 |
| `check-a1-longitudinal-journeys` | 7 pruebas, 38 episodios, 2 alumnos sintéticos |
| `check-pedagogical-journeys` | 298 recorridos, 13 arcos |
| Conteo con `loadEpisodeContent({forLearner:false})` | cifras de §3 y §4 |

Pasos A1: `free_reply` 77 · `recall` 39 · `scene` 21 · `completion` 21 · `comprehension` 18 · `choice` 17 · `model` 17 · `word_order` 12 · `fill_blank` 11 · `mini_story` 4.

## 3. Estado por dimensión

**Objetivos CEFR**
- Existe: 16 capacidades (13 `required`, 3 `should`), 7 familias (`a1-blueprint.json` `canDos`, `skillFamilies`). 16/16 con correspondencia a escalas CEFR en `blueprints/a1.json` `requiredCapabilityTable`, declarada «working correspondence».
- Falta: `a1-blueprint.json` no trae referencias CEFR por capacidad. Nadie humano validó la correspondencia. `cefrCaveats.arrangeToMeet` admite que roza A2. Solo cubre texto: sin escucha evaluada, habla ni pronunciación (`curriculum-master-a1-c2.md` §3).
- Siguiente: docente revisa las 16 filas contra el Companion Volume y resuelve `arrange_to_meet`.

**Vocabulario**
- Existe: presupuesto 50 productivos / 46 receptivos (suma por arco verificada). Runtime `A1_INTRODUCED_ITEMS` (`a1Map.js`) = 63: 29 léxicos + 19 patrones (incluye `numbers_11_100`) + 15 receptivos. 63/63 en `SEED_VOCAB`. `a1RequiredLevelItems()` = 44.
- Falta: 15 receptivos declarados frente a 46 presupuestados; sin auditoría de qué palabras de escena quedan sin catalogar. Sin justificación de frecuencia por humano.
- Siguiente: listar léxico de escena por episodio contra el catálogo; docente valida utilidad.

**Gramática**
- Existe: 19 patrones (16 `independent`, 3 `guided_production`: `frequency`, `possessive`, `price`). 12 exclusiones a A2 (pasado, `going to`, `because`, `-s` productiva). 25 `evalKind` en uso.
- Falta: 12 de los 14 intents nuevos del blueprint están en pasos. `state_price` se omite con motivo escrito (`src/learning/episodes/a1Arc5.js:22`). `ask_routine` no aparece en `src/` ni tiene motivo escrito: desviación sin registrar frente al blueprint.
- Siguiente: propietario decide si `ask_routine` se construye o se retira del blueprint. Docente revisa explicaciones.

**Comprensión**
- Existe: 35 pasos con opciones (18 `comprehension` + 17 `choice`), 4 `mini_story`. Escucha solo por TTS en sesiones, no en episodios (matriz §2.6).
- Falta: mientras dure el defecto de §4, acertar estos pasos no indica comprensión. Sin audio humano.
- Siguiente: decisión sobre la propuesta de §4. Comprensión nunca cuenta como dominio (`learning-science-foundation.md` §3).

**Producción**
- Existe: 77 abiertas + 39 recuerdos, 23 guiadas. 12 capacidades `deterministic_local`, 4 `hybrid`. Asistida separada de independiente en motor.
- Falta: inglés no tiene equivalente a `check-es-unseen`. `scripts/lib/pedagogyBank.mjs` sale de las regex del propio evaluador, así que no mide falsos rechazos reales. Sin habla.
- Siguiente: conjunto de respuestas escritas por docente, no usadas para reglas, por intent nuevo.

**Evaluación**
- Existe: `LC-PED-002` hecho (PR #91, `.ai/TASKS.md`). Casos de `can` ambiguo en `check-a1-arc6-arc7-evaluators`.
- Falta: tasa de error del evaluador sobre respuestas humanas: desconocida. Sin muestreo por revisor.
- Siguiente: medir falsos positivos y negativos (`human-review-plan.md` §6).

**Retención**
- Existe: 39 `recall`: 18 `review: true` (calentamiento) y 21 dentro de la misma lección. Crédito diferido exige éxito independiente previo en otra sesión (`src/learning/engine/learnerModel.js:890`). `scheduleReview` y `getDueReviews` activos.
- Falta: motor exige otra sesión, no tiempo mínimo. Retención solo simulada.
- Siguiente: medir recuerdo sin ayuda a 2–7 días en piloto. Definir si «diferido» pide intervalo.

**Transferencia**
- Existe: matriz da transferencia 0 a seis capacidades. Blueprint planifica R/C en cuatro.
- Falta: la columna cuenta `reuseSkills` por id de capacidad, y `reuseSkills` mezcla capacidades e intents. Lectura por paso:

| Capacidad | Matriz | Blueprint | Pasos reales fuera de su episodio |
|---|---|---|---|
| `say_what_you_can_do` | 0 | C en arco 7 | Abierta: `when_are_you_free` paso 7; calentamiento `can_you` paso 0 |
| `ask_someone_about_ability` | 0 | R en arco 7 | Solo calentamiento: `when_are_you_free` paso 0 |
| `say_when_something_happens` | 0 | R arco 5, C arco 7 | Sin `state_routine` ni ítems de hora fuera del arco 2; `arrange_pattern` lleva la hora implícita |
| `ask_how_to_say_something` | 0 | R en arco 7 | Ninguno: `repairKind: ask_how_to_say` solo en `can_you` paso 8 |
| `buy_something` | 0 | sin reutilización | Ninguno |
| `ask_about_getting_somewhere` | 0 | sin reutilización | Ninguno |

- Además: 0 pasos `variation: true` en A1, frente a 11 en Pre-A1.
- Siguiente: corregir métrica en una PR propia; añadir reutilización en PR de contenido, separada de traducciones. Para las dos sin plan decide el propietario (`a1-readiness-design.md` §4).

**Criterios de desbloqueo**
- Existe: evaluador inactivo `prepared/a1Readiness.js` (6 criterios estructurales, estados `insufficient` / `pending_calibration` / `verifiable`). `learnerLevel.js` deriva nivel de trabajo. Hito `a1` conservable (`PRESERVED_MILESTONE_LEVELS`), no escribible (`MILESTONE_LEVELS = ['pre_a1']`).
- Falta: `unaidedProductionsPerCapability` y `recentEvidenceDays` sin valor, a propósito (`a1-readiness-design.md` §2.2). Mejor estado alcanzable hoy: `pending_calibration`.
- Siguiente: calibrar con datos reales; no copiar umbrales de Pre-A1.

## 4. Defecto confirmado: respuesta correcta primero

| Conjunto | Pasos con opciones | Correcta en posición 1 |
|---|---|---|
| Pre-A1 | 21 | **21/21** |
| A1 arcos 1–5 | 26 | **26/26** |
| A1 arcos 6–7 (recuento de hoy, no citado en docs previos) | 9 | **9/9** |
| Español Pre-A1 (referencia, `transform.js` rota) | 17 | 7, resto en 2.ª y 3.ª |

`mini_story` no aplica: sus dos opciones son válidas (`MiniStory.jsx`).

**Rama `proposal/pre-a1-option-order` @ `7e6d48e`, pendiente de aprobación del propietario.**
- Cambia solo presentación: orden mostrado. No toca contenido, marcas `correct`, evidencia ni contratos.
- 5 archivos, +87/−4: `optionOrder.js`, `EpisodeShell.jsx`, `SetupFlow.jsx`, `check-option-order.mjs`, `package.json`.
- Toca Pre-A1 visible, por eso requiere excepción explícita al congelamiento.
- Dos notas: parte de `d788370`, no de la cabeza actual; y `check-option-order` importa solo `a1Arc1…5`, así que arcos 6–7 rotarían en pantalla sin medirse.

## 5. Condiciones para la decisión separada `LC-PROD-002`

Este documento no abre A1. Ninguna condición abre A1 sola. La decisión es del propietario, escrita (`.ai/TASKS.md`, `CLAUDE.md`).

| # | Condición exacta | Tipo | Estado |
|---|---|---|---|
| 1 | Aprobar o rechazar `proposal/pre-a1-option-order`. Si se aprueba: rebasar y medir también arcos 6–7 | decisión | pendiente |
| 2 | Revisión docente de los 21 episodios, sin hallazgos S0/S1 abiertos | humano | pendiente |
| 3 | Revisión nativa de copia auxiliar A1 (526 claves de episodio × 7 locales no ingleses) | humano | pendiente |
| 4 | Decidir `ask_routine` y reutilización de las seis capacidades de §3; corregir métrica | decisión + contenido | pendiente |
| 5 | Conjunto de respuestas no vistas para A1, con umbrales fijados antes | QA | pendiente |
| 6 | Calibrar los dos umbrales con datos reales, o aceptar por escrito valores provisionales rotulados | datos + decisión | pendiente |
| 7 | Piloto con adultos aprobado y ejecutado; o aceptación escrita de abrir sin él, sin afirmar eficacia | humano + decisión | pendiente |
| 8 | Fijar qué afirma el nivel: currículo textual, sin certificación (master §3) | decisión | pendiente |
| 9 | Mover `prepared/a1Readiness.js` a `src/`, retirar guardia de `check-a1-blueprint`, añadir `a1` a `MILESTONE_LEVELS` | motor | pendiente |
| 10 | Repetir `LC-PED-002` sobre la cabeza final si 1, 4 o 9 cambian contenido o motor | QA | pendiente |
| 11 | Recorrido real en navegador: 390 y 1440 px, claro/oscuro, RTL, transición Pre-A1 → A1 | QA | pendiente |
| 12 | Decisión escrita `LC-PROD-002`; cambio mínimo en `levels.js`; dos ciclos limpios sobre la cabeza exacta | decisión + QA | pendiente |

## 6. Límites de esta revisión

- Sin recorrido de navegador: A1 cerrado y fuera de alcance aquí.
- No se juzgó naturalidad ni calidad docente: requiere humanos.
- Conteos por paso reproducibles con `loadEpisodeContent`; cambian si cambia el contenido.
- No hubo revisión nativa externa de inglés ni de sus traducciones.
