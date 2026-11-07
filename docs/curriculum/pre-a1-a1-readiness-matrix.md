# Pre-A1 / A1 — matriz de preparación curricular (2026-10-31, fase P3)

**Qué es:** una revisión curricular específica de Pre-A1 y A1, separada de la auditoría general.

**Cómo se obtienen los números:** salen del runtime y no se escribieron a mano. Las tablas entre las marcas `generated` las produce `node scripts/curriculum-readiness-matrix.mjs --write`, y `--check` (incluido en `check:all`) falla si este documento deja de coincidir con el código. El script hace lo siguiente:
- carga de verdad el contenido de cada episodio;
- pregunta al gate de nivel si un estudiante puede abrirlo;
- lee los ocho diccionarios como lo hacen las pruebas de i18n;
- cruza el blueprint de A1;
- cuenta las suites que cubren cada episodio.

**Qué NO prueba esta matriz:** que alguien aprenda. Que haya contenido, evaluadores y recorridos simulados demuestra coherencia interna. La eficacia con personas requiere el piloto con estudiantes reales previsto en `docs/research/learning-science-foundation.md`. Tener arcos integrados no equivale a aprendizaje comprobado.

Leyenda de estado: **PASS**, comprobado con evidencia ejecutable · **PARCIAL**, existe pero con un límite medido · **NO PROBADO**, no hay evidencia · **BLOQUEADO**, depende de una autorización o de un proveedor.

---

## 1. Pre-A1 (abierto, congelado)

| Dimensión | Estado | Evidencia |
|---|---|---|
| Contenido realmente disponible | PASS | 17/17 episodios cargan y se pueden abrir (tabla generada); `check-episodes`, `check-curriculum-loading` |
| Objetivos y descriptores | PASS | 13 capacidades exigidas para salir (`PRE_A1_EXIT_CRITERIA`), cada una con episodio propio; `check-curriculum-map`, `check-pre-a1-freeze` |
| Actividades | PASS | 64 producciones abiertas, 28 recuerdos diferidos y actividades cerradas por episodio (tabla) |
| Evaluaciones | PASS | Evaluadores locales deterministas; ayuda ≠ independencia y reconocimiento ≠ producción (`check-hybrid-evaluation`, `check-teaching-decisions`, `check-learning-loop`) |
| Prerrequisitos | PASS | Cadena de prerrequisitos y alcanzabilidad desde cero (`check-pre-a1-freeze`, grupo 4) |
| Revisión espaciada | PASS | `scheduleReview`/`getDueReviews`; la sesión diaria recupera lo vencido (`check-daily-session`, `check-teaching-decisions`) |
| Transferencia | PARCIAL | Hay 4 capacidades exigidas que ningún **otro episodio** reutiliza: `full_conversation`, `express_needs`, `cafe_order` e `identify_things`. Su transferencia depende de los bloques de consolidación y repaso de la sesión diaria y de los episodios integrados, no de episodios posteriores. |
| Accesibilidad | PARCIAL | Entradas en inglés con `lang="en" dir="ltr"`, IME seguro (`check-ime-enter`) y RTL verificado en el banco visual. No hubo una auditoría completa con lector de pantalla en esta fase (NO PROBADO). |
| Compatibilidad de idiomas | PASS | 17/17 episodios con i18n completo en 8 idiomas (`check-i18n` al 100 %). La calidad nativa de las traducciones no se revisó con hablantes en esta fase. |
| Progresión y finalización | PASS | Readiness, foco y graduación sin maestría prematura (`check-pre-a1-readiness`, `check-graduation`, `check-pre-a1-journeys`) |
| Hablar y pronunciación | BLOQUEADO | Sin micrófono, STT ni evaluación de pronunciación, por diseño. Se muestran como «no se evalúa». |
| Comprensión auditiva | PARCIAL | Turnos de escucha con TTS del navegador **solo en sesiones**. Los episodios de Pre-A1 no tienen pasos de escucha propios. |

**Defectos que requieran una excepción al congelamiento:** no encontré ninguno en el contenido de Pre-A1. Las dos observaciones de arriba (la transferencia de 4 capacidades y la escucha solo en sesiones) son límites de diseño, no errores.

No propongo cambiar el contenido congelado sin evidencia medida de estudiantes reales. Si el piloto muestra baja retención en esas 4 capacidades, la propuesta sería añadir **reutilización en episodios existentes** (no episodios nuevos) mediante una excepción explícita del propietario.

## 2. A1 (construido, cerrado al público)

1. **Arcos implementados:** 7 de 7 (`work_and_study` … `making_arrangements`), con 21 de 21 episodios (ids 18–38).
2. **Episodios conectados con el frontend:**
   - Los 21 cargan contenido real por el cargador por arco.
   - **Ninguno** puede abrirlo un estudiante: `available: false`, y el gate devuelve `level_unavailable` antes de cargar nada.
   - Solo las herramientas (`forLearner: false`) pueden abrirlos.
3. **Actividades utilizables:** 77 producciones abiertas, 39 recuerdos diferidos y actividades cerradas, todas ejecutables por `EpisodeShell` (tabla generada). En esta fase no se recorrieron en el navegador, porque el nivel está cerrado. LC-PED-002 (PR #91) dejó prueba en navegador de los arcos 6–7 en es/ja/ar.
4. **Contenido con pruebas:**
   - Ningún episodio queda sin cobertura: 6 no se nombran por id, pero los recorren las suites de arco y de nivel.
   - Suites de arco: `check-a1-arc1…5` y foundry `arc6-arc7`.
   - Suites de nivel: `check-a1-blueprint`, `check-a1-longitudinal-journeys` y `check-pedagogical-journeys`.
5. **Objetivos CEFR cubiertos:**
   - Las 16 capacidades del blueprint tienen episodio, propio o secundario: 13 `required` y 3 `should` (tabla).
   - `ask_how_to_say_something` se acredita como `secondaryCanDoId` de `can_you`.
6. **Habilidades que todavía no pueden evaluarse:**
   - Expresión oral, pronunciación e interacción oral en vivo: sin micrófono, por decisión de producto.
   - La comprensión auditiva solo se evalúa con TTS en sesiones.
   - La escritura libre se evalúa con reglas deterministas e híbridas acotadas. No hay evaluación abierta por un modelo de lenguaje en el modo gratuito.
7. **Traducciones, audio e interacciones que faltan:**
   - i18n completo en 8 idiomas para los 21 episodios (machine-checked). Falta una revisión nativa.
   - Audio grabado: no hay (solo TTS del navegador, permitido).
   - No hay interacciones de voz.
8. **Condiciones que impiden abrir A1:**
   - (a) **Decisión explícita del propietario** (`LC-PROD-002`, BLOQUEADO a propósito).
   - (b) **No existe readiness de A1:**
     - `MILESTONE_LEVELS = ['pre_a1']`;
     - no hay función de preparación A1 ni hito `levelMilestones.a1`;
     - el blueprint fija las dimensiones, pero dice que los umbrales se eligen «cuando haya evidencia de recorridos reales».
   - (c) **La transición de graduación** Pre-A1 → A1 en Home y en la planificación (`playableLevelId` toma el primer nivel abierto) no se probó con A1 abierto.
   - (d) **Sin piloto con estudiantes reales.**
   - (e) **La expresión oral sigue sin evaluarse**, lo que limita lo que A1 puede certificar.
9. **Tareas exclusivamente de contenido:**
   - revisión nativa de las traducciones de los 21 episodios;
   - más reutilización de `say_when_something_happens`, `buy_something`, `say_what_you_can_do`, `ask_someone_about_ability` y `ask_about_getting_somewhere`, que **ningún otro episodio reutiliza** (columna de transferencia);
   - revisión de los textos de escena y retroalimentación con un docente.
10. **Tareas que requieren cambios del motor pedagógico** (todas necesitan autorización; ninguna se aplicó):
    - función de readiness A1 y su hito (`MILESTONE_LEVELS`);
    - Home y la planificación con dos niveles abiertos;
    - graduación como puerta a A1;
    - evidencia de escucha en episodios;
    - umbrales de salida de A1 calibrados con datos reales.

**Qué se implementó en esta fase para A1:** nada de contenido. No había bloques de contenido pendientes que pudieran completarse sin tocar evaluadores, gates o progresión: los 21 episodios ya existen y están localizados. Las tareas restantes de contenido (reutilización, revisión nativa) requieren criterio docente o tocan episodios integrados, así que quedan como propuesta.

## 3. Tablas calculadas

<!-- generated:start (node scripts/curriculum-readiness-matrix.mjs --write) -->

### Resumen calculado

| Medida | Pre-A1 | A1 |
|---|---|---|
| Nivel abierto a estudiantes | sí | no |
| Episodios en runtime / planificados | 17 / 17 | 21 / 21 |
| Episodios cuyo contenido carga de verdad | 17 | 21 |
| Episodios que un estudiante puede abrir hoy | 17 | 0 |
| Episodios con i18n completo en los 8 idiomas | 17 | 21 |
| Producciones abiertas (free_reply) | 64 | 77 |
| Pasos de recuerdo diferido (recall) | 28 | 39 |
| Episodios sin prueba que los nombre por id | 0 | 6 |
| Episodios sin ninguna prueba (ni por id ni por arco/nivel) | 0 | 0 |
| Capacidades del blueprint sin episodio (propio o secundario) | — | ninguna |

### Pre-A1 — episodios

| Episodio | Arco | Capacidad | Abiertas | Recuerdo | Cerradas | Contenido carga (pasos) | Estudiante puede abrir | Claves i18n | Idiomas completos | Pruebas: por id / por arco o nivel |
|---|---|---|---|---|---|---|---|---|---|---|
| `first_greeting` | greetings | introduce_self | 2 | 1 | 3 | sí (9) | sí | 53 | 8/8 | 19 / 11 |
| `ask_name` | greetings | ask_name | 1 | 2 | 4 | sí (10) | sí | 28 | 8/8 | 21 / 11 |
| `nice_to_meet` | greetings | full_greeting | 2 | 2 | 4 | sí (10) | sí | 27 | 8/8 | 15 / 11 |
| `how_are_you` | connect | ask_wellbeing | 3 | 2 | 3 | sí (11) | sí | 33 | 8/8 | 11 / 9 |
| `where_from` | connect | ask_origin | 3 | 2 | 3 | sí (11) | sí | 34 | 8/8 | 11 / 9 |
| `first_conversation` | connect | full_conversation | 7 | 1 | 0 | sí (10) | sí | 22 | 8/8 | 9 / 9 |
| `what_you_like` | choose | express_preferences | 3 | 2 | 3 | sí (12) | sí | 39 | 8/8 | 10 / 11 |
| `what_you_want` | choose | express_needs | 4 | 2 | 3 | sí (12) | sí | 35 | 8/8 | 4 / 11 |
| `make_a_plan` | choose | make_plan | 6 | 1 | 0 | sí (9) | sí | 23 | 8/8 | 7 / 11 |
| `a_coffee_please` | cafe | polite_request | 3 | 2 | 4 | sí (12) | sí | 34 | 8/8 | 2 / 14 |
| `anything_else` | cafe | respond_anything_else | 3 | 2 | 3 | sí (11) | sí | 28 | 8/8 | 6 / 14 |
| `your_first_order` | cafe | cafe_order | 4 | 1 | 0 | sí (7) | sí | 21 | 8/8 | 5 / 14 |
| `lost_you` | repair | ask_for_repair | 3 | 2 | 3 | sí (11) | sí | 36 | 8/8 | 5 / 9 |
| `say_again` | repair | ask_for_repair | 4 | 2 | 3 | sí (13) | sí | 22 | 8/8 | 5 / 9 |
| `we_can_continue` | repair | close_an_encounter | 5 | 1 | 0 | sí (10) | sí | 22 | 8/8 | 7 / 9 |
| `what_is_this` | things | identify_things | 5 | 1 | 2 | sí (12) | sí | 30 | 8/8 | 3 / 9 |
| `how_many` | things | use_small_numbers | 6 | 2 | 2 | sí (13) | sí | 33 | 8/8 | 9 / 9 |

### Pre-A1 — capacidades exigidas para graduarse

| Capacidad | Alcance | Episodios (propio o secundario) | Producciones abiertas | Pasos de recuerdo diferido | Reutilizada en otros episodios (transferencia) |
|---|---|---|---|---|---|
| introduce_self | required (exit) | 1 | 2 | 1 | 2 |
| ask_name | required (exit) | 1 | 1 | 2 | 3 |
| ask_wellbeing | required (exit) | 1 | 3 | 2 | 2 |
| ask_origin | required (exit) | 1 | 3 | 2 | 1 |
| full_conversation | required (exit) | 1 | 7 | 1 | 0 |
| express_preferences | required (exit) | 1 | 3 | 2 | 1 |
| express_needs | required (exit) | 1 | 4 | 2 | 0 |
| polite_request | required (exit) | 1 | 3 | 2 | 6 |
| cafe_order | required (exit) | 1 | 4 | 1 | 0 |
| ask_for_repair | required (exit) | 2 | 7 | 4 | 7 |
| close_an_encounter | required (exit) | 1 | 5 | 1 | 2 |
| identify_things | required (exit) | 1 | 5 | 1 | 0 |
| use_small_numbers | required (exit) | 1 | 6 | 2 | 1 |

### A1 — episodios

| Episodio | Arco | Capacidad | Abiertas | Recuerdo | Cerradas | Contenido carga (pasos) | Estudiante puede abrir | Claves i18n | Idiomas completos | Pruebas: por id / por arco o nivel |
|---|---|---|---|---|---|---|---|---|---|---|
| `what_you_do` | work_and_study | talk_about_work_or_study | 2 | 2 | 4 | sí (11) | no (cerrado) | 29 | 8/8 | 2 / 13 |
| `and_you` | work_and_study | ask_about_work_or_study | 4 | 2 | 3 | sí (12) | no (cerrado) | 30 | 8/8 | 5 / 13 |
| `meeting_someone_new` | work_and_study | talk_about_work_or_study | 6 | 1 | 0 | sí (9) | no (cerrado) | 15 | 8/8 | 1 / 13 |
| `my_day` | daily_rhythm | talk_about_daily_routine | 3 | 2 | 4 | sí (12) | no (cerrado) | 30 | 8/8 | 3 / 13 |
| `at_seven` | daily_rhythm | say_when_something_happens | 4 | 2 | 3 | sí (12) | no (cerrado) | 27 | 8/8 | 1 / 13 |
| `what_does_it_mean` | daily_rhythm | ask_what_something_means | 4 | 2 | 1 | sí (11) | no (cerrado) | 22 | 8/8 | 1 / 13 |
| `this_is` | people_around_you | introduce_someone_else | 3 | 2 | 4 | sí (12) | no (cerrado) | 30 | 8/8 | 2 / 11 |
| `shes_a_student` | people_around_you | introduce_someone_else | 4 | 2 | 4 | sí (13) | no (cerrado) | 29 | 8/8 | 0 / 11 |
| `three_of_us` | people_around_you | introduce_someone_else | 7 | 1 | 0 | sí (10) | no (cerrado) | 17 | 8/8 | 0 / 11 |
| `where_is_it` | finding_your_way | ask_where_something_is | 3 | 2 | 4 | sí (12) | no (cerrado) | 30 | 8/8 | 1 / 9 |
| `its_over_there` | finding_your_way | say_where_something_is | 3 | 2 | 5 | sí (13) | no (cerrado) | 31 | 8/8 | 1 / 9 |
| `how_do_i_get_there` | finding_your_way | ask_about_getting_somewhere | 2 | 2 | 1 | sí (8) | no (cerrado) | 23 | 8/8 | 1 / 9 |
| `more_than_ten` | paying_and_choosing | use_bigger_numbers | 3 | 2 | 4 | sí (12) | no (cerrado) | 23 | 8/8 | 2 / 8 |
| `how_much_is_it` | paying_and_choosing | ask_the_price | 3 | 2 | 4 | sí (12) | no (cerrado) | 28 | 8/8 | 1 / 8 |
| `this_one_or_that_one` | paying_and_choosing | ask_the_price | 3 | 2 | 4 | sí (12) | no (cerrado) | 23 | 8/8 | 1 / 8 |
| `buying_it` | paying_and_choosing | buy_something | 3 | 2 | 1 | sí (9) | no (cerrado) | 19 | 8/8 | 1 / 8 |
| `i_can_i_cant` | what_you_can_do | say_what_you_can_do | 3 | 2 | 3 | sí (11) | no (cerrado) | 24 | 8/8 | 0 / 8 |
| `can_you` | what_you_can_do | ask_someone_about_ability (+ask_how_to_say_something) | 4 | 2 | 3 | sí (13) | no (cerrado) | 28 | 8/8 | 1 / 8 |
| `when_are_you_free` | making_arrangements | arrange_to_meet | 3 | 2 | 4 | sí (12) | no (cerrado) | 25 | 8/8 | 0 / 8 |
| `where_shall_we_meet` | making_arrangements | arrange_to_meet | 4 | 2 | 2 | sí (11) | no (cerrado) | 24 | 8/8 | 0 / 8 |
| `see_you_on_friday` | making_arrangements | arrange_to_meet | 6 | 1 | 0 | sí (10) | no (cerrado) | 19 | 8/8 | 0 / 8 |

### A1 — capacidades del blueprint

| Capacidad | Alcance | Episodios (propio o secundario) | Producciones abiertas | Pasos de recuerdo diferido | Reutilizada en otros episodios (transferencia) |
|---|---|---|---|---|---|
| talk_about_work_or_study | required | 2 | 8 | 3 | 2 |
| ask_about_work_or_study | required | 1 | 4 | 2 | 2 |
| talk_about_daily_routine | required | 1 | 3 | 2 | 4 |
| say_when_something_happens | required | 1 | 4 | 2 | 0 |
| ask_what_something_means | required | 1 | 4 | 2 | 1 |
| introduce_someone_else | required | 3 | 14 | 5 | 1 |
| ask_where_something_is | required | 1 | 3 | 2 | 1 |
| say_where_something_is | required | 1 | 3 | 2 | 2 |
| ask_about_getting_somewhere | should | 1 | 2 | 2 | 0 |
| use_bigger_numbers | required | 1 | 3 | 2 | 1 |
| ask_the_price | required | 2 | 6 | 4 | 1 |
| buy_something | required | 1 | 3 | 2 | 0 |
| say_what_you_can_do | required | 1 | 3 | 2 | 0 |
| ask_someone_about_ability | should | 1 | 4 | 2 | 0 |
| ask_how_to_say_something | should | 1 | 4 | 2 | 0 |
| arrange_to_meet | required | 3 | 13 | 5 | 3 |

<!-- generated:end -->
