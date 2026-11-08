# LinguaChat 1.0 — Fase 5 (P4): integridad definitiva, base técnica de A1 y arquitectura del evaluador

- **Fecha:** 2026-10-31.
- **Alcance:** local. Sin git, push, despliegues ni publicaciones; sin Supabase, Vercel ni servicios remotos; sin proveedores de IA comerciales.
- **Respaldo previo a cualquier cambio:** `Music/LinguaChat-main/_snapshot-p3/`, que es el estado final de la fase 4.
- **Diff:** `docs/audits/2026-10-31-p4-data-and-a1-foundation.diff`, calculado contra `_snapshot-p3`. Excluye `node_modules`, `dist`, `.venv`, cachés, `.env*` y este informe.
- **Documentos nuevos:**
  - `docs/curriculum/a1-readiness-design.md`;
  - `docs/architecture/intelligent-evaluator-contract.md`;
  - `docs/research/pre-a1-pilot-protocol.md`.

Lo que se mantiene sin cambios:
- `CLOUD_PREFERENCES_RELEASED=false`;
- Pre-A1 congelado; A1–C2 cerrados;
- Lingua es la única tutora y Chatto la mascota;
- 8 idiomas auxiliares;
- React, Vite y FastAPI;
- aislamiento de cuentas;
- arquitectura local y gratuita.

---

## 1. Problema de concurrencia reproducido

**Defecto encontrado en P4:** una pestaña cuyo guardado falla durante más de 10 minutos mientras otra compacta más de 500 eventos **pierde** sus turnos.

**Causa raíz.** La compactación decidía por **tiempo** qué eventos ya estaban contados. Todo lo que tuviera `at < foldedBefore` se daba por incluido en la base. Un evento que ninguna compactación había visto, porque su guardado seguía fallando, quedaba por debajo del corte y se descartaba al llegar.

**Reproducción determinista.** Se creó un arnés nuevo:
- `scripts/lib/tabsHarness.mjs`: almacenamiento con fallos inyectables, reloj controlado y pestañas con `sessionStorage` propio.
- `scripts/check-ledger-integrity.mjs`: la matriz de escenarios. Admite `--impl <src>`, de modo que **el mismo arnés** se ejecuta contra el código anterior y el nuevo.

| Implementación (mismo arnés, matriz completa) | Pasan | Fallan |
|---|---|---|
| **Antes:** código de la fase 4 (`_snapshot-p3`) | 9 | **16** (de 25 aplicables; los 2 escenarios de migración y conflictos de base no aplican a ese código) |
| **Después:** código P4 | **27** | **0** |

### 1.1 Escenarios y resultado antes y después

| Escenario | Antes | Después |
|---|---|---|
| Guardado que falla 1 min; 2, 3 o 5 pestañas; 1.200 turnos en otra | pasa | pasa |
| Guardado que falla **10,5 min, 1 h y 25 h**; 2, 3 o 5 pestañas | **falla** (9 casos) | pasa |
| 1 h de fallos con 500 turnos en otra pestaña | pasa | pasa |
| 1 h de fallos con **2.400 y 4.000** turnos | **falla** | pasa |
| Caché obsoleta en otra pestaña | **falla** | pasa |
| Turnos con marcas de tiempo de días antes (reloj viejo, fuera de orden) | **falla** | pasa |
| Recompensa que la pestaña varada también tiene: se paga una vez, incluso tras un año de compactación | **falla** | pasa |
| Cambio de cuenta A→B→A con una pestaña varada | **falla** | pasa |
| Cierre abrupto antes de cualquier guardado | pasa | pasa |
| Reinicio (reset) con una pestaña varada | pasa | pasa |
| Todas las escrituras fallan 15 min (almacenamiento lleno) | pasa | pasa |
| Turno varado 29 días | **falla** | pasa |
| **LÍMITE** documentado: 35 días tras un escritor olvidado | se pierde (pasa como límite) | se pierde 1 turno de 1.221 (afirmado como límite) |
| 60 días × 4 cargas × 15 turnos: crecimiento acotado | pasa (94,0 KiB) | pasa (117,6 KiB, 1 copia, 93 escritores en cobertura: +23,6 KiB por la identidad) |
| Migración v1 + copias P3; migración interrumpida; vuelta atrás | n/a | pasa |
| Ninguna fusión descartó una base con eventos que la elegida no tenía | n/a | pasa (0 conflictos) |

Una primera corrida del «antes», sin los escenarios de 29 y 35 días, dio 8 pasan y 15 fallan sobre 23. La corrida final, con la matriz completa, da **9 pasan y 16 fallan** sobre 25 aplicables. «Después» da **27/27**. Salida literal en el anexo.

## 2. Solución

**Identidad de evento por escritor** (`progressLedger.js`, `localProgress.js`):

- Cada evento nuevo que **no** es una recompensa estable recibe:
  - `w`: el escritor, que es la pestaña más la carga de página;
  - `seq`: un contador propio de ese escritor.

  Las recompensas conservan su id estable, para que un reintento o una segunda pestaña encuentren **el mismo** id.
- La base guarda la **cobertura** por escritor, `coverage[w] = {min, max, at, holes?}`: exactamente qué secuencias de ese escritor ya se plegaron. Admite huecos (hasta 64 por escritor) para eventos que llegan desordenados.
- `isCovered(base, event)`:
  - **regla de identidad** cuando el evento y la base tienen identidad: un evento que ninguna compactación vio **nunca** se considera contado, por viejo que sea su reloj;
  - **regla de tiempo** (la anterior) solo para eventos sin identidad (los escritos antes de P4) y para bases escritas por código antiguo.
- La compactación ya no descarta eventos desconocidos: pliega solo lo que tiene en la mano y lo anota en la cobertura.
- **Escritores inactivos:** una entrada de cobertura se poda a los 30 días (`COVERAGE_KEEP_MS`) y solo si no quedan eventos pendientes de ese escritor. Después rige `prunedBefore`.
- **Bases en conflicto:** `ledgerDiagnostics.baseConflicts` cuenta cualquier fusión que tuviera que elegir entre dos bases incompatibles. Los tests afirman 0.
- **Calendario tolerante al orden** (`calendar()`): un evento tardío nunca mueve `lastPracticeDate` hacia atrás ni reinicia la racha.
- **Sin** contadores G para todos los campos y **sin** fusión por máximo: los totales siguen siendo un pliegue de eventos únicos por id.

## 3. Garantías y límites

**Garantías,** dentro de lo probado. No es seguridad absoluta.

- Cada turno con identidad que llega a cualquier copia se cuenta **exactamente una vez**, cualquiera que sea:
  - el número de pestañas (2, 3 o 5);
  - el volumen (500 a 4.000 eventos);
  - la duración del fallo (1 min a 25 h, y hasta 29 días);
  - el orden de llegada o la antigüedad del reloj.
- Las recompensas con id estable se pagan una vez, también años después.
- Reset: nada anterior al reset vuelve.
- Cuentas: cada cuenta conserva solo lo suyo (aislamiento P0).
- Almacenamiento lleno: no se pierde nada cuando vuelve el espacio.
- Crecimiento acotado: 60 días de uso intenso ocupan una copia de 117,6 KiB.

**Límites declarados:**

1. Un turno varado **más de 30 días** detrás de un escritor ya podado se pierde (medido: 1 de 1.221 a los 35 días).
2. El turno no guardado de una pestaña de una **sesión reemplazada** (otra cuenta) se rechaza **a propósito** (aislamiento).
3. Una pestaña que se cierra antes de **cualquier** guardado no deja nada que recuperar.
4. Un evento tardío no extiende una racha de forma retroactiva.
5. Los eventos escritos **antes** de P4 no tienen identidad y siguen con la regla de tiempo. Esa ventana desaparece con la compactación normal.

## 4. Migraciones

- Lectura compatible de:
  - v1 (totales);
  - P0, P1, P2 y P3 (ledger v2 sin cobertura).

  Los eventos y bases sin identidad usan la regla de tiempo. La primera compactación con código P4 empieza a registrar la cobertura.
- **Migración interrumpida:** no cambia nada (probado).
- **Vuelta atrás** al código de la fase 4: lee los totales (probado contra `_snapshot-p3`). Los campos `w`, `seq` y `coverage` se ignoran sin error.
- **Learner model:** `PRESERVED_MILESTONE_LEVELS = ['pre_a1','a1']` conserva un hito `a1` bien etiquetado al sanear, fusionar o migrar. `MILESTONE_LEVELS` sigue en `['pre_a1']`.

## 5. Protección contra doble pago

- Las recompensas (episodio, misión, bono de sesión) conservan sus **ids estables**, sin `w` ni `seq`, y la unión por id las aplica una sola vez.
- Las `foldedIds` y sus suelos protegen esos ids después de la compactación. Escenario: «paid once — even after a year of compaction».
- `addEvent` rechaza un evento ya cubierto por identidad. Así, el mismo turno que vuelve desde una caché vieja **no** se suma dos veces (`check-same-account-tabs`, 39/39).

## 6. Readiness de A1

Detalle en `docs/curriculum/a1-readiness-design.md`.

- **Evaluador aislado:** `linguachat-frontend/prepared/a1Readiness.js`, **fuera de `src/`**. No se importa, no se empaqueta y lo vigila `check-bundle-boundaries` 6c.
- **Criterios estructurales** tomados literalmente de `exitCriteria` del blueprint:
  - los 21 episodios;
  - las 13 capacidades sin ayuda;
  - la conversación de cierre sin ayuda;
  - la salud de repaso sobre Pre-A1 ∪ A1;
  - ninguna capacidad frágil;
  - 5 de 7 familias.
- **Sin inventar umbrales:** `unaidedProductionsPerCapability` y `recentEvidenceDays` quedan **sin calibrar**. Sin calibración, el mejor estado posible es `pending_calibration`.
- **Estados:** `insufficient` (con razones e ids), `pending_calibration`, `verifiable`. Ni siquiera `verifiable` registra nada mientras A1 está cerrado.
- **`check-a1-readiness`:** 12/12, incluido en `check:all`. Cubre:
  - el alumno que termina Pre-A1;
  - evidencia incompleta;
  - necesidad de repaso;
  - acceso anticipado (`level_unavailable`);
  - dos niveles abiertos en un banco aislado;
  - cambio de cuenta A→B→A;
  - progreso restaurado;
  - hitos duplicados;
  - graduación repetida;
  - formatos antiguos.

## 7. Hito de A1 y lo que falta

- **Esquema:** `{graduatedAt, evidenceVersion: 'a1.v0-uncalibrated', source}`. Es idempotente y, al fusionar, gana la fecha más antigua. Un hito con versión de otro nivel se descarta.
- **Para activar A1** (detalle en el documento de diseño, §5):
  1. reutilización y transferencia de las 5 capacidades que hoy no se reutilizan;
  2. revisión nativa de las traducciones;
  3. `LC-PED-002`;
  4. **calibrar** los dos umbrales con datos reales del piloto;
  5. un «nivel actual del alumno» en Home, identidad y progreso;
  6. mover el evaluador a `src/` y añadir `a1` a `MILESTONE_LEVELS`;
  7. `available: true` por decisión explícita del propietario;
  8. dos ciclos limpios.
- **Matriz de aceptación de las 5 capacidades sin reutilización:** `say_when_something_happens`, `buy_something`, `say_what_you_can_do`, `ask_someone_about_ability` y `ask_about_getting_somewhere`. Está en el documento de diseño, §4, con los criterios de transferencia, recuerdo diferido, contraejemplos del evaluador, ayuda e independencia, y `LC-PED-002`. **No se implementó contenido:** el mandato prohibía alterar episodios y evaluadores.

## 8. Pruebas de Home y progresión

- **Banco aislado (PASS):** con los episodios de Pre-A1 y A1, el planificador (`buildSessionPlan`) continúa hacia el primer episodio de A1 después de Pre-A1. La graduación de Pre-A1 no cambia y la reconciliación del producto ni borra ni reescribe un hito `a1`.
- **Home (BLOCKED):** `TodayView`, `CompletedEpisodes`, `LearningSummaryCard`, `JourneyRail` y `SetupFlow` usan `playableLevelId()`, que es el **primer nivel abierto global**. `CompletedEpisodes` lo fija al cargar el módulo. Con dos niveles abiertos, un alumno graduado seguiría viendo Pre-A1. Probarlo exige un cambio de producto (el nivel actual del alumno) y A1 abierto. Ninguna de las dos cosas está autorizada.

## 9. Arquitectura del evaluador

Detalle en `docs/architecture/intelligent-evaluator-contract.md`.

- **Contrato `lingua-evaluator/1`** (`ai/evaluator_contract.py`): modelos pydantic con `extra="forbid"`.
  - **Petición:** idioma auxiliar, nivel (solo los abiertos para alumnos), capacidad (ids cerrados, verificados contra `preA1Map.js` y el blueprint), modalidad (escrita o escucha), objetivo, texto, estado de ayuda y el único contexto autorizado: lo último que dijo Lingua.
  - **Resultado:** veredicto; certeza **categórica** (nunca una probabilidad); hallazgos con justificación obligatoria; explicación de 400 caracteres como máximo en el idioma del alumno; pistas; actividad siguiente; y tipo de evidencia, separando lo registrable (`error`, `accepted_under_criterion` con criterio) de lo que no es dominio (`assisted`, `copied`, `ambiguous`, `not_evaluable`, `insufficient`).
- **Validador:** rechaza:
  - campos inesperados (mastery, xp, level, milestone, unlock, curriculum, confianza numérica);
  - capacidades inexistentes;
  - niveles cerrados;
  - dominio sin evidencia;
  - texto manipulador;
  - pérdida de contexto;
  - correcciones contradictorias;
  - hallazgos sin justificación, inventados o que no cambian nada;
  - idioma incorrecto;
  - respuestas fuera del objetivo;
  - respuestas vacías o que no son un objeto.

  Además, una respuesta con ayuda **siempre** se degrada a `assisted`.
- **Ruta segura** `evaluate_safely`: comprueba la petición antes de llamar, aplica un presupuesto de tiempo (4 s) y valida la respuesta. Ante cualquier fallo (red, timeout, excepción o rechazo) responde la referencia local y registra el incidente.
- **Adaptadores:**
  - `EvaluatorAdapter`: la frontera abstracta, sin implementación comercial;
  - `LocalReferenceEvaluator`: el motor gratuito de siempre;
  - `ScriptedTestAdapter`: **solo en los tests**, con nombre de herramienta de prueba.
- **No conectado:** ni a `/chat` ni a ningún proveedor. El `EvaluationResult` de episodios no se tocó.
- **Frontend:** un nuevo escenario de `check-chat-observations` envía un análisis hostil con mastery, xp, level, levelMilestones, unlock y learningState. `safeAnalysis` lo reduce a su lista blanca y el modelo del alumno no cambia.

## 10. Calidad del motor local

Puerta de calidad aplicada a la referencia, dentro de `tests/test_evaluator_contract.py` (139 pruebas en total):

| Dimensión | Resultado |
|---|---|
| Falsos positivos en 60 frases válidas | **0** |
| Errores conocidos (tramo y reemplazo exactos) | 8/8 |
| Errores combinados | 3/3 |
| Contextos nuevos | 4/4 |
| Variantes (mayúsculas, orden, puntuación) | aceptadas con criterio |
| Demasiado poco («Hi», «ok», «?») | `insufficient` |
| Traducción (es, fr, de) | `not_evaluable`, sin corrección en inglés |
| Principiantes (frases fijas) | corregidas |
| Explicaciones en 8 idiomas | todas válidas, ≤ 400 caracteres, ≤ 4 frases |
| Ayuda | siempre `assisted` |
| Latencia | ~0,05 ms por turno (medición puntual, no es un SLA) |

**Límites encontrados y declarados**, cada uno con una prueba que afirma un comportamiento honesto:
- «My sister like cats.» **no** se detecta: la regla solo conoce sujetos pronombre. El resultado es `unsure` / `insufficient`, sin elogio.
- «Ayer fui a la escuela con mi hermano.» no se reconoce como español (3 de 8 palabras funcionales). Aun así no se corrige ni se acredita.

**Corrección durante la fase:** el detector de idioma del validador rechazaba explicaciones legítimas de la referencia en es, pt, it, de y fr. Una comilla de elisión («d'un») se tomaba por cita. Se reemplazó por una comparación de palabras funcionales que aparta el material citado y las palabras del propio alumno. Las pruebas de idioma incorrecto siguen rechazando el inglés y la escritura equivocada.

## 11. Personalización real (sin ajustes nuevos)

Conexiones verificadas en el código de producto, no solo en pruebas:

| Decisión | Dónde se decide | Conectada en |
|---|---|---|
| Método de explicación (conciso o ejemplo resuelto) y canal (lectura o escucha) por evidencia | `teachingPolicy.chooseTeaching` | `SessionRunner.jsx`, `chatEvidence.js`, `formatChoice.js` |
| Profundidad de explicación en el chat | backend `choose_strategy` (breve → contraste → recuerdo guiado) | `/chat` |
| Dificultad y apoyo | `scaffolding` (`deriveInitialScaffold`, `updateScaffoldAfterTurn`, `skillStrength`, `noveltyOf`) | `EpisodeShell`, `SessionRunner`, `MiniStory` |
| Adaptación por habilidad | `skillEvidence` (escrita y escucha por separado; habla `not_assessed`) | `readiness.js`, `learnerSummary.js`, `session.js` |
| Retención | `scheduleReview`, `getDueReviews`, `retentionProfile` | `learnerModel`, `planner`, `session.js` |
| Transferencia | contextos nuevos en `teachingEstimates` y `skillEvidence` | ídem |
| Temas e intereses | `selectTopic`, `getInterestContext` | `AppContext`, `session.js` |
| Errores recurrentes | `markRecurringError`, `chatDifficulties` | `EpisodeShell`, `SessionRunner`, `MiniStory`, chat |
| Continuidad entre días | `learningMemoryPayload` → `learning_memory` | `AppContext` → `api.js` → backend |

Ninguna decisión lee tiempos de respuesta. Lo comprueba un escaneo del código del motor.

## 12. Resultados longitudinales

`scripts/check-personalization-longitudinal.mjs`: 9/9, incluido en `check:all`.

**Diseño de la simulación:**
- 4 alumnos **simulados**, 28 días y 2 capacidades;
- 8 semillas;
- decisiones del motor real, con las mismas llamadas que hace `SessionRunner`;
- tasas ocultas inventadas para la prueba.

**Resultados:**

- **Las decisiones difieren entre alumnos y entre capacidades de un mismo alumno**: ≥ 75 % de decisiones informadas hacia el método mejor para cada uno.
- **Cambian con la evidencia nueva:** Dana pasa de ≤ 30 % a ≥ 70 % de explicaciones concisas tras su cambio.
- **No hay inferencia por velocidad:** se repitieron los mismos resultados con tiempos rápidos, aleatorios y absurdos, y ninguna decisión cambia.
- **Un error aislado** no cambia el método (40/40 semillas) ni el apoyo. Un segundo error sí trae ayuda.
- **Escrita ≠ escucha:** Ben lee mejor de lo que escucha y la evidencia lo refleja.
- **Las métricas no premian completar ni recibir ayuda:** seis «éxitos» con ayuda o reintento suman cero evidencia.
- **Métrica = éxito independiente posterior esperado** de los métodos elegidos:

| Alumno | Días | Motor | Alternancia fija | Máximo posible |
|---|---|---|---|---|
| Ana | 14–27 | 0,79 | 0,57 | 0,85 |
| Ben | 14–27 | 0,77 | 0,60 | 0,85 |
| Chen | 14–27 | 0,77 | 0,57 | 0,85 |
| Dana | 7–13 | 0,72 | 0,54 | 0,85 |
| **Dana** | **14–21** | **0,43** | 0,57 | 0,85 |
| Dana | 22–27 | 0,68 | 0,58 | 0,85 |

**Limitación medida y no ocultada:** justo después de un cambio real del alumno, el motor tarda alrededor de una semana en revertir su elección (su ventana son los últimos 12 sondeos posteriores). Durante ese tiempo lo hace **peor** que alternar. Es un candidato para la próxima fase: por ejemplo, ponderar más los sondeos recientes. Solo se cambiaría con evidencia; no se tocó.

Esto **no** demuestra que personas reales aprendan más. Para eso está el piloto.

## 13. Protocolo de piloto

`docs/research/pre-a1-pilot-protocol.md` es un borrador para aprobación. Cubre:

- objetivo e hipótesis que pueden fallar;
- consentimiento, solo adultos, minimización y la ausencia de exportación;
- nivel inicial mediante pre-test;
- formas paralelas A, B y C contrabalanceadas;
- post-test inmediato y diferido (≈ 4 semanas);
- transferencia con contextos que la app no usa;
- evidencia independiente puntuada por docentes, con fiabilidad entre evaluadores;
- SUS y escalas de confianza y ansiedad;
- errores frecuentes;
- accesibilidad para mayores de 60, lector de pantalla y RTL;
- abandono;
- condiciones de éxito y criterios de revisión fijados antes.

**No hay** datos, participantes, formulario en la app ni recogida de datos.

## 14. Bundle

- **Entrada:** 724,8 kB (P3) → **727,2 kB** (+2,4 kB). Son 250,4 kB de app y 476,9 kB de datos curriculares. El aumento viene de la identidad y la cobertura del ledger.
- **Presupuesto sin cambios:** 850 kB, comprobado con su propio build en `check:all`.
- **`prepared/`, el contrato y los adaptadores** no entran en el bundle: los dos últimos son del backend, y `prepared/` lo vigila la comprobación 6c.

## 15. Archivos

**Frontend, código:**
- `src/services/progressLedger.js`: identidad, cobertura, `isCovered`, `ledgerDiagnostics`, `calendar()`.
- `src/services/localProgress.js`: `withIdentity`.
- `src/learning/engine/learnerModel.js`: `PRESERVED_MILESTONE_LEVELS`.
- `prepared/a1Readiness.js` (nuevo, fuera de `src`).

**Frontend, pruebas:**
- Nuevas: `scripts/lib/tabsHarness.mjs`, `scripts/check-ledger-integrity.mjs`, `scripts/check-a1-readiness.mjs`, `scripts/check-personalization-longitudinal.mjs`.
- Modificadas, con aserciones conservadas o reforzadas:
  - `scripts/check-same-account-tabs.mjs`: «beyond protection window» ahora exige 601, y el escenario de reloj atrasado se reescribió con aserciones más fuertes;
  - `scripts/check-chat-observations.mjs`: escenario hostil;
  - `scripts/check-bundle-boundaries.mjs`: 6c.
- `package.json`: `check:all` pasa de 94 a **97** pasos. Se añadieron `check:ledger-integrity`, `check:a1-readiness` y `check:personalization-longitudinal`.

**Backend:**
- `ai/evaluator_contract.py` y `ai/evaluator_adapters.py` (nuevos).
- `tests/test_evaluator_contract.py` (nuevo, 139 pruebas).

**Documentos:**
- los tres nuevos de la cabecera y este informe;
- `docs/curriculum/pre-a1-a1-readiness-matrix.md`: **regenerado por su propio script** (`--write`). Solo cambió un número: las referencias de prueba de `ask_name` pasan de 20 a 21, porque el test nuevo la menciona. Ver §16.

## 16. QA, bloqueos y autorizaciones

**Ciclos completos** (`cycle2.sh`: `check:all` por código de salida, build, i18n, integración de GitHub, foundry B1–C2 y A2, cloud-scope, `compileall`, `pytest` y plantillas de correo):

| Ciclo | `check:all` | build | i18n | foundry ×5 | cloud-scope ×3 | compileall | pytest | email | github-integration |
|---|---|---|---|---|---|---|---|---|---|
| p4-1 | **FAIL** 96/97 | PASS | PASS | PASS | PASS | PASS | PASS 843 | PASS | BLOCKED (falta jq) |
| p4-2 | PASS 97/97 | PASS | PASS | PASS | PASS | PASS | PASS 843 | PASS | BLOCKED (falta jq) |
| p4-3 | PASS 97/97 | PASS | PASS | PASS | PASS | PASS | PASS 843 | PASS | BLOCKED (falta jq) |

- **p4-1:** falló `curriculum-readiness-matrix --check` porque el documento generado estaba desactualizado (un conteo de referencias de prueba). Se regeneró con `--write` y el conteo se reinició.
- **p4-2 y p4-3: dos ciclos completos limpios consecutivos**, sin cambios de código entre ellos (`check:all` 97/97 en 101 s y 104 s; pytest 843).
- **`check:github-integration`:** BLOCKED en local por falta de `jq`; se ejecuta en CI. Se mantiene separado y no cuenta como PASS.

**Pruebas específicas:**

| Suite | Resultado |
|---|---|
| `check-ledger-integrity`, completa | 27/27 |
| `check-ledger-integrity --quick` (en `check:all`) | PASS |
| `check-same-account-tabs` | 39/39 |
| `check-a1-readiness` | 12/12 |
| `check-personalization-longitudinal` | 9/9 |
| `check-chat-observations` | 7/7 |
| `test_evaluator_contract.py` | 139/139 |
| `check-a1-blueprint`, `check-graduation`, `check-a1-arc*`, `check-learner-model`, `check-failed-save-*`, `check-bundle-boundaries` | PASS |

**Estado de otras verificaciones:**
- **Seguridad y privacidad:** cloud-scope PASS. El contrato no transporta identidad ni historial. El diff (19 archivos, 2.848 líneas) no contiene `.env`, claves ni datos privados: el escaneo de patrones de claves (`sk-`, JWT, `service_role`, claves privadas, `*_API_KEY=`, contraseñas) dio 0 coincidencias.
- **Autenticación real: NOT_TESTED.** Solo se usaron fixtures (`activateLocalAccount`, el arnés de pestañas). No se afirma que se haya probado autenticación real.
- **QA visual del frontend: NOT_TESTED** en esta fase. No hubo cambios de UI: ningún `.jsx` ni `.css` cambió.

**Autorizaciones necesarias (no concedidas, no usadas):**
- abrir A1 (`LC-PROD-002`);
- el nivel actual del alumno en Home;
- mover el evaluador A1 a `src/`;
- cablear `evaluate_safely` a `/chat`;
- cualquier proveedor de IA;
- la exportación de datos de la app para el piloto;
- el propio piloto (consentimiento y revisión legal);
- el contenido de reutilización de las 5 capacidades A1.

## 17. Próximos pasos

1. **Aprobación del protocolo de piloto** y de sus instrumentos. Es lo único que puede calibrar A1 y medir aprendizaje real.
2. **Contenido de reutilización** de las 5 capacidades A1, en una PR propia, con revisión docente.
3. **Nivel actual del alumno** en Home, identidad y progreso; requisito para cualquier apertura de A1.
4. **Adaptación más rápida tras un cambio real** del alumno (§12), con evidencia antes de tocar `chooseTeaching`.
5. **Ampliar la regla de tercera persona** a sujetos nominales, con el corpus de falsos positivos como red.
6. Migrar el `EvaluationResult` de episodios al contrato `lingua-evaluator/1`.
7. Revisión de nativos de las traducciones de A1.

---

## Anexo — salidas literales

**`check-ledger-integrity` (matriz completa), «antes»** (`--impl _snapshot-p3/linguachat-frontend/src`):

```
check-ledger-integrity — implementation: …\_snapshot-p3\linguachat-frontend\src
  ok  2 tabs, a save failing for 1 min, 1,200 turns elsewhere: every turn counted once
  ok  3 tabs, a save failing for 1 min, 1,200 turns elsewhere: every turn counted once
  ok  5 tabs, a save failing for 1 min, 1,200 turns elsewhere: every turn counted once
  FAIL 2 tabs, a save failing for 10.5 min, 1,200 turns elsewhere: every turn counted once
       Expected values to be strictly equal:
  FAIL 3 tabs, a save failing for 10.5 min, 1,200 turns elsewhere: every turn counted once
       Expected values to be strictly equal:
  FAIL 5 tabs, a save failing for 10.5 min, 1,200 turns elsewhere: every turn counted once
       Expected values to be strictly equal:
  FAIL 2 tabs, a save failing for 1 h, 1,200 turns elsewhere: every turn counted once
       Expected values to be strictly equal:
  FAIL 3 tabs, a save failing for 1 h, 1,200 turns elsewhere: every turn counted once
       Expected values to be strictly equal:
  FAIL 5 tabs, a save failing for 1 h, 1,200 turns elsewhere: every turn counted once
       Expected values to be strictly equal:
  FAIL 2 tabs, a save failing for 25 h, 1,200 turns elsewhere: every turn counted once
       Expected values to be strictly equal:
  FAIL 3 tabs, a save failing for 25 h, 1,200 turns elsewhere: every turn counted once
       Expected values to be strictly equal:
  FAIL 5 tabs, a save failing for 25 h, 1,200 turns elsewhere: every turn counted once
       Expected values to be strictly equal:
  ok  3 tabs, 1 h of failing saves, 500 turns elsewhere: every turn counted once
  FAIL 3 tabs, 1 h of failing saves, 2400 turns elsewhere: every turn counted once
       Expected values to be strictly equal:
  FAIL 3 tabs, 1 h of failing saves, 4000 turns elsewhere: every turn counted once
       Expected values to be strictly equal:
  FAIL a stale cache in another tab while one tab is stranded: every turn counted once
       Expected values to be strictly equal:
  FAIL stranded turns stamped days earlier (out of order, old clock): counted once
       Expected values to be strictly equal:
  ok  a tab closed abruptly before any save succeeded: the others are intact, nothing invented
  FAIL a reward the stranded tab also holds is paid once — even after a year of compaction
       Expected values to be strictly equal:
  FAIL an account switch while a tab is stranded: each account keeps exactly its own turns (A→B→A)
       Expected values to be strictly equal:
  ok  a reset while a tab is stranded: nothing from before the reset comes back
  ok  every write failing for 15 minutes (storage full): nothing lost once space returns
  FAIL a turn stranded for 29 days is still counted once
       Expected values to be strictly equal:
       (measured: 1220 of 1221)
  ok  LIMIT (documented): stranded for 35 days behind a forgotten writer, the turn is not counted
       (3600 turns, 1 copies, 94.0 KiB, 0 writers in coverage)
  ok  60 days × 4 page loads × 15 turns: every turn kept, storage bounded
  --  migration from P3 code: NOT_TESTED (no _snapshot-p3 next to the project)
  --  base conflicts: not measurable in this implementation

check-ledger-integrity — 9 passed, 16 failed
```

**«Después» (código P4):**

```
check-ledger-integrity — implementation: …\LinguaChat-main\linguachat-frontend\src
  ok  2 tabs, a save failing for 1 min, 1,200 turns elsewhere: every turn counted once
  ok  3 tabs, a save failing for 1 min, 1,200 turns elsewhere: every turn counted once
  ok  5 tabs, a save failing for 1 min, 1,200 turns elsewhere: every turn counted once
  ok  2 tabs, a save failing for 10.5 min, 1,200 turns elsewhere: every turn counted once
  ok  3 tabs, a save failing for 10.5 min, 1,200 turns elsewhere: every turn counted once
  ok  5 tabs, a save failing for 10.5 min, 1,200 turns elsewhere: every turn counted once
  ok  2 tabs, a save failing for 1 h, 1,200 turns elsewhere: every turn counted once
  ok  3 tabs, a save failing for 1 h, 1,200 turns elsewhere: every turn counted once
  ok  5 tabs, a save failing for 1 h, 1,200 turns elsewhere: every turn counted once
  ok  2 tabs, a save failing for 25 h, 1,200 turns elsewhere: every turn counted once
  ok  3 tabs, a save failing for 25 h, 1,200 turns elsewhere: every turn counted once
  ok  5 tabs, a save failing for 25 h, 1,200 turns elsewhere: every turn counted once
  ok  3 tabs, 1 h of failing saves, 500 turns elsewhere: every turn counted once
  ok  3 tabs, 1 h of failing saves, 2400 turns elsewhere: every turn counted once
  ok  3 tabs, 1 h of failing saves, 4000 turns elsewhere: every turn counted once
  ok  a stale cache in another tab while one tab is stranded: every turn counted once
  ok  stranded turns stamped days earlier (out of order, old clock): counted once
  ok  a tab closed abruptly before any save succeeded: the others are intact, nothing invented
  ok  a reward the stranded tab also holds is paid once — even after a year of compaction
  ok  an account switch while a tab is stranded: each account keeps exactly its own turns (A→B→A)
  ok  a reset while a tab is stranded: nothing from before the reset comes back
  ok  every write failing for 15 minutes (storage full): nothing lost once space returns
  ok  a turn stranded for 29 days is still counted once
       (measured: 1220 of 1221)
  ok  LIMIT (documented): stranded for 35 days behind a forgotten writer, the turn is not counted
       (3600 turns, 1 copies, 117.6 KiB, 93 writers in coverage)
  ok  60 days × 4 page loads × 15 turns: every turn kept, storage bounded
  ok  a v1 record plus P3-written copies migrate exactly; an interrupted migration changes nothing; a rollback reads them back
  ok  no merge ever had to discard a base that held events the chosen one lacked

check-ledger-integrity — 27 passed, 0 failed
```

**Ciclos p4-2 y p4-3** (salida de `cycle2.sh`, idéntica en ambos salvo los tiempos):

```
check:all exit=0 :: check:all — 97/97 green in 104s
build exit=0
check:i18n exit=0
check:github-integration exit=1 :: check-merge-blocker-gate — cannot run here: needs jq (GitHub-integration check; runs in CI)
foundry b1 exit=0
foundry b2 exit=0
foundry c1 exit=0
foundry c2 exit=0
foundry a2-structure exit=0
cloud-scope exit=0 :: check-linguachat-cloud-scope — scanning working tree (no git checkout)
cloud-scope --self-test exit=0
cloud-scope tests exit=0
compileall exit=0
pytest exit=0 :: 843 passed in 4.19s
email exit=0
```
