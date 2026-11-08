# LinguaChat 1.0 — Fase 6 (P5): el tutor integrado, adaptación más rápida y nivel individual

- **Fecha:** 2026-10-31.
- **Alcance:** local. Sin git, push, despliegues ni publicaciones; sin Supabase, Vercel ni proveedores comerciales. Las únicas consultas a GitHub fueron de solo lectura.
- **Respaldo previo a cualquier cambio:** `Music/LinguaChat-main/_snapshot-p4/`, que es el estado final de la fase 5.
- **Diff de esta fase:** `docs/audits/2026-10-31-p5-tutor-runtime-integration.diff`, calculado contra `_snapshot-p4`, ignorando el CR final de línea (§15).
- **Traspaso consolidado de todas las fases:** `docs/audits/2026-10-31-consolidated-local-handoff.md` y su `.diff`.

**Se mantiene:**
- `CLOUD_PREFERENCES_RELEASED=false`;
- Pre-A1 congelado;
- A1–C2 cerrados (`available: false`, sin tocar);
- `prepared/a1Readiness.js` fuera de `src`;
- sin calibraciones inventadas;
- Lingua es la única tutora y Chatto la mascota;
- 8 idiomas auxiliares;
- aislamiento de cuentas.

**Autorizaciones de esta fase que se usaron:**
- integrar el evaluador **local** en `/chat`;
- preparar y conectar el nivel individual del alumno sin abrir A1.

Ninguna otra.

---

## 1. Estado de la integración del evaluador en `/chat`

**Conectado y en uso en cada mensaje libre.** La ruta exacta:

```
frontend AppContext.sendMessage ─▶ services/api.sendChatMessage ─ POST /chat (assistance, learning_memory)
  └▶ routes/chat.py ─▶ ai/engine.generate_response ─▶ ai/local_engine.generate_local_response
        └▶ ai/chat_evaluation.evaluate_chat_turn  ── capa versionada «chat-evaluation/1»
              └▶ ai/evaluator_adapters.evaluate_safely(LocalReferenceEvaluator) ─▶ validate_result
        ◀── reply / correction / explanation / learning_action / analysis (forma histórica) + evaluation (nuevo)
  ◀── services/chatAnalysis.safeAnalysis(analysis, evaluation) ─▶ chatEvidence.classifyChatTurn ─▶ recordChatTurn
```

Cómo se cumplen los requisitos:

- **Una sola evaluación por mensaje.** `LocalReferenceEvaluator.evaluate_detailed` devuelve la respuesta del contrato **y** el análisis del motor que la produjo, con una única llamada a `assess`. La prueba `test_one_evaluation_per_message` cuenta las llamadas.
- **Todo se valida antes de usarse** (`validate_result`).
  - Si la propia referencia no pasa la validación, el chat **no corrige nada** y lo registra (`reference_rejected:*`). Se prueba inyectando un campo `xp`.
  - Ante un fallo, un timeout o una respuesta hostil de un adaptador, responde la referencia local y el incidente queda en `evaluation.incidents`.
- **El formato histórico se conserva.** La capa `chat-evaluation/1` es explícita y versionada:
  - con la referencia, el `analysis` histórico es exactamente el que produjo el resultado validado;
  - lo nuevo viaja en un campo aparte, `evaluation`, con `version`, `contract_version`, `verdict`, `certainty`, `evidence`, `source`, `used` e `incidents`.
- **El evaluador solo propone.**
  - La estrategia sigue en `choose_strategy` (servidor, dentro de una conversación) y en `teachingPolicy.js` / `chatEvidence.js` (dispositivo, entre días).
  - En el frontend, `safeAnalysis` conserva de `evaluation` **solo** las dos propuestas que **bajan** el valor de un turno: `copied` y `assisted`. Independencia, recuperación y transferencia las sigue decidiendo `classifyChatTurn`.
- **Nada puede tocar el progreso.** XP, nivel, progreso, hitos y currículo no tienen campo en el contrato ni en `evaluation`. Se prueba en el backend, en el frontend y por HTTP.
- **Los 8 idiomas se conservan.** Las explicaciones de la referencia pasan la validación de idioma en los 8.
- **`no_issue_detected` nunca se convierte en corrección ni dominio.** La certeza queda en `unsure`, la evidencia en `insufficient` (o `accepted_under_criterion` **con** criterio explícito), y no hay elogio. Se prueba.
- **No se puede elegir el adaptador** ni por petición (`evaluator`, `adapter`) ni por entorno (`LINGUACHAT_EVALUATOR`): se prueba. El cambio de adaptador para pruebas (`use_adapter_for_tests`) existe solo dentro de los tests.
- **Ayuda y copia, de extremo a extremo.**
  - La petición admite `assistance`, un conjunto cerrado. El frontend envía `suggestion_sent` cuando el alumno manda una sugerencia de Lingua; cualquier otro valor cuenta como `none`.
  - Copiar la corrección que Lingua acaba de dar se detecta en el servidor (`copied`), además de en el dispositivo.

**Comportamiento anterior capturado como referencia** antes de cambiar nada:
- `tests/fixtures/chat_golden_p4.json` guarda 189 conversaciones y 192 respuestas HTTP grabadas del código de la fase 5: 31 frases × 4 idiomas, 4 errores × 8 idiomas, preferencias, escalada de estrategia, recuerdo diferido, copia y niveles A2/B1/C1.
- `test_chat_runtime.py` las reproduce **campo por campo** por HTTP real.
  - Tras el Bloque A: **las 189 idénticas** (salvo el campo nuevo `evaluation`).
  - Tras el Bloque C cambian 28 casos. Todos son de 7 frases listadas en `INTENDED_CHANGES` con su motivo, y cada uno tiene una prueba del **nuevo** comportamiento. Un cambio no listado, o uno listado que ya no ocurre, hace fallar la suite.

**Casos obligatorios**, todos con prueba (`test_chat_runtime.py`, `e2e-tutor-runtime.mjs`):

| Caso | Resultado |
|---|---|
| `Yesterday I goed to school.` | Corrección exacta, explicación en el idioma del alumno, evidencia `error` |
| `My sister like cats.` | **Ahora** corregido: `likes`, explicación propia para sujeto nominal (Bloque C) |
| `I read a book yesterday.` / `I put the book there yesterday.` | Sin corrección: pasados con la misma forma que el infinitivo |
| Frase correcta poco frecuente («Notwithstanding the drizzle…») | `no_issue_detected`, `unsure`, `insufficient`, sin elogio |
| Ambigua («Me school yesterday.») | Sin corrección, sin evidencia |
| Parcialmente válida («Yesterday I go to school and I am happy.») | Solo se corrige `go`; la evidencia es el error |
| Español, alemán, japonés, árabe | `not_english`: sin corrección y `not_evaluable` |
| Corrección copiada de Lingua | `copied` |
| Después de recibir ayuda | `assisted` |
| Fallo de evaluación | Responde la referencia local, incidente `network_error` |
| Timeout | Incidente `timeout` dentro del presupuesto (prueba con 0,2 s) |
| Adaptador hostil (mastery/xp, manipulación, hallazgo inventado, no-objeto) | Rechazado; la respuesta la da la referencia; nada hostil llega al alumno |

## 2. Diferencias entre el tutor anterior y el nuevo

| | Fase 5 | Fase 6 |
|---|---|---|
| Evaluación en `/chat` | `assess()` directo, sin validar | Contrato `lingua-evaluator/1`, validado en cada mensaje, con incidentes |
| Respuesta | `analysis` | `analysis` (idéntico) + `evaluation` (nuevo) |
| Ayuda y copia | Solo en el dispositivo | También en el servidor, como propuesta que solo baja el valor del turno |
| Sujeto nominal («My sister like») | Sin detectar | Detectado con alta precisión |
| Texto en otro idioma | Solo el idioma del alumno, con una lista corta | 5 idiomas latinos y 8 escrituras, para cualquier alumno |
| Método entre días | Ventana de 12 sondeos; un cambio tardaba una semana | Detecta el fallo persistente; adapta en 4–9 días, según el alumno |
| Elección por habilidad | Combinada | Por habilidad, con prudencia estadística |
| Nivel en pantallas | Primer nivel abierto global | Nivel de trabajo del alumno |
| Guardado fallido | Silencioso, sin reintento | Reintento cada 15 s y aviso en 8 idiomas |

## 3. Correcciones lingüísticas mejoradas

**Concordancia con sujeto nominal singular** (`grammar_check._noun_subjects`). Solo actúa donde la estructura no deja dudas:

- El sujeto abre la cláusula: al inicio de la frase, tras puntuación, tras «, and», tras una palabra de cláusula (`because`, `when`…), tras un verbo de opinión (`I think…`) o tras una expresión de tiempo (`Yesterday`, `Last week`, `Every morning`).
- **Nunca** actúa tras `let` / `see` / `help` / `make` (infinitivo sin `to`), tras `that` (subjuntivo) ni tras un «and» sin coma, porque podría ser un sujeto compuesto.
- La forma es un determinante singular + una o dos palabras + un verbo base conocido, con un adverbio de frecuencia como mucho entre medias y **sin puntuación**.
- El núcleo no termina en -s. Tampoco es un colectivo (`family`, `team`, `police`…), un plural irregular (`children`, `people`, `sheep`…) ni una palabra de tiempo (en «This week go…» el verbo es un imperativo).
- La palabra siguiente no es otro verbo: en «The school work is hard» hay un sustantivo compuesto, no sujeto + verbo.
- **No se revisan los nombres propios.** Una palabra con mayúscula desconocida podría ser un plural sin -s.
- La misma lógica cubre `past_marker` con sujeto nominal («Yesterday my sister go» → `went`) y «My sister don't» → `doesn't`.

**Identificación de idioma** (`ai/language_id.py`, módulo único):
- reconoce las escrituras no latinas;
- cuenta palabras funcionales de es / pt / fr / it / de **sin solapes con el inglés**;
- un idioma solo gana con 3 palabras o más, al menos el 30 % y al menos el doble que el inglés;
- un texto corto o mixto queda como «sin afirmar».

**Explicaciones para principiantes.** Hay claves nuevas en 8 idiomas: `third_person_noun.brief` y `.detailed`. Nombran el sujeto real del alumno («My sister es una sola persona o cosa, como he o she…»), tienen 220 caracteres como máximo y pasan la validación de idioma del contrato.

**No es una gramática completa.** Lo que no se entiende sigue siendo `unsure` / `insufficient`, nunca un error inventado.

## 4. Resultados del corpus adversarial

`tests/test_grammar_adversarial.py`: 183 pruebas.

| Conjunto | Tamaño | Resultado |
|---|---|---|
| Errores que deben marcarse (tramo y reemplazo exactos) | 24 | **24/24** |
| Construcciones que **no** deben tocarse: plurales, colectivos, compuestos, preguntas, infinitivos sin `to`, subjuntivo, sustantivos compuestos, comas, relativos, imperativos, nombres | 60 | **0 falsos positivos** |
| Fallos conocidos y declarados («Maria like», «The bus arrive», «My other sister like», «Each of them like», relativo, «Everybody like», sintagma largo, «I like dogs and my sister like») | 8 | Sin corrección y **nunca elogiados**: `unsure` / `insufficient` |
| Texto en otro idioma (es, pt, fr, it, de, ja, ar, ko, ru) | 13 | 13/13 reconocidos con su idioma |
| Inglés con nombres o palabras extranjeras | 8 + 59 | ninguno tomado por extranjero |
| Textos cortos («Hola», «Danke!») | 5 | ninguno afirmado |

- **Recall** en este corpus: 24/32 = 0,75.
- **Durante el desarrollo, el propio corpus encontró un falso positivo real:** «My mother and my father cook» se habría corregido. El origen era que «and» abría cláusula; se corrigió antes de integrar.
- Es un corpus **escrito por el desarrollador**, no datos de alumnos reales.
- El corpus de 60 frases válidas de P3 (`test_explanation_quality.py`) sigue con 0 falsos positivos.

## 5. Resultados de la adaptación personalizada

`scripts/check-adaptation-policy.mjs` en `check:all`, con un informe con `--report`.

**Método de comparación:**
- Compara la política de P4 (copia congelada `scripts/lib/teachingPolicyP4.mjs`, solo para pruebas) con la actual.
- Usa 18 alumnos sintéticos, 32 días, 2 capacidades, 2 habilidades y 40 semillas.
- Las decisiones se toman igual que en `SessionRunner`: canal primero y luego el estilo para esa habilidad.

**La política nueva** (`teachingPolicy.js`, pequeña y transparente) tiene dos piezas:

1. **Detección de un método que dejó de funcionar.** Cuando los últimos 3 sondeos posteriores de un método (en 3 días de aprendizaje distintos) **fallaron** y sus sondeos anteriores habían salido mayoritariamente bien, la estimación sigue esa racha.
   - Un fallo aislado nunca la activa.
   - La evidencia anterior no se borra: queda en `durable` y vuelve en cuanto un éxito rompe la racha.
   - Solo los fallos cuentan como cambio: una racha de éxitos con suerte de un método poco usado le daba crédito de más (medido en la ronda 3).
2. **Elección por habilidad.** El estilo se ordena con los sondeos de **esa** habilidad (escrita o escucha), contraídos hacia la estimación combinada con `K = 4` pseudo-observaciones.

**Proceso honesto:**
- **Escenarios de ajuste:** ana, ben, chen, dana (los de P4).
- **Reservados**, escritos antes de ejecutar: eve, finn, gia, hal, ivy, jon, kim.
- **Diagnóstico:** kim se usó para diagnosticar un fallo en la ronda 1 y pasó a llamarse «diagnosed».
- **Frescos:** lea, max y noa (antes de la ronda 2); oli, pam y quin (antes de la ronda 4).
- **Precisión:** zed, un método que siempre funciona más dos fallos aislados.
- **Objetivos prerregistrados antes de la ronda 1:** **1 cumplido y 2 no cumplidos**. Se informan; no se escondieron moviendo el umbral.
- **Defectos encontrados y corregidos en el camino:**
  - la estimación por habilidad no tenía el prior Beta(1, 1): zed cambiaba tras un fallo aislado;
  - el «sobrecrédito» de las rachas de éxito.

| Alumno | Conjunto | Éxito independiente posterior esperado (P4 → P5) | Transferencia | Días hasta adaptarse (P4 → P5) | Decisiones erróneas tras un fallo aislado |
|---|---|---|---|---|---|
| ana | ajuste | 0,79 → 0,80 | 9,5 → 9,6 | — | — |
| ben | ajuste | 0,67 → 0,70 | 8,3 → 8,6 | — | — |
| chen | ajuste | 0,79 → 0,79 | 9,4 → 9,4 | — | — |
| dana | ajuste | 0,58 → **0,64** | 7,2 → 8,0 | **12 → 9** | — |
| eve | reservado | 0,58 → **0,65** | 7,6 → 8,2 | **14 → 7** | — |
| finn | reservado | 0,56 → 0,56 | 6,9 → 7,0 | — | — |
| gia | reservado | 0,55 → 0,60 | 7,2 → 7,6 | 10 → 10 (vuelta: 7 → 6) | — |
| hal | reservado | 0,38 → 0,38 | 4,8 → 5,0 | — | — |
| ivy (por habilidad) | reservado | 0,66 → 0,68 | 7,9 → 8,1 | — | — |
| jon (practica cada 3 días) | reservado | 0,51 → 0,55 | 11,1 → 11,4 | 17 → 17 (ninguna de las dos se adapta en el mes) | — |
| kim | diagnosticado | 0,84 → 0,84 | 8,2 → 8,2 | — | 0,10 → **0,17** |
| lea | fresco | 0,71 → 0,71 | 8,3 → 8,3 | — | 0,50 → 0,53 |
| max (solo cambia la escucha) | fresco | 0,71 → 0,71 | 8,6 → 8,7 | 1 → 1 | — |
| noa | fresco | 0,70 → 0,72 | 8,5 → 8,7 | **10 → 4** | — |
| oli | fresco-2 | 0,77 → 0,78 | 9,3 → 9,3 | — | 0,35 → **0,23** |
| pam | fresco-2 | 0,56 → **0,64** | 6,8 → 7,7 | **11 → 8** | — |
| quin (métodos iguales) | fresco-2 | 0,70 → 0,70 | 8,5 → 8,5 | — | — |
| zed (precisión) | — | 0,93 → 0,93 | 9,3 → 9,3 | — | **0,00 → 0,00** |

**Garantías** (`check-adaptation-policy`, 10/10):
- nunca se adapta más lento, y se adapta más rápido en al menos 4 de 6 alumnos con cambio (lo hace en exactamente 4: dana, eve, noa y pam);
- ninguna regresión del éxito esperado mayor de 0,02, en ningún alumno ni en el mes completo;
- ganancia media en los alumnos con cambio: **+0,05**;
- un fallo aislado no mueve nada (zed: 0);
- estabilidad media en alumnos ruidosos no peor que antes;
- nada se ordena con menos de 3 sondeos;
- ivy recibe un estilo distinto para escuchar y para escribir;
- la exploración se mantiene entre el 10 % y el 30 %;
- la transferencia no empeora.

**Objetivos no cumplidos:**
- gia y jon no se adaptan antes;
- kim empeora de 0,10 a 0,17: cuando a su fallo forzado se suman dos fallos naturales hay **3 fallos seguidos**, que es exactamente lo que la regla debe considerar persistente.

En la simulación de P4 (`check-personalization-longitudinal`), Dana en los días 14–21 pasa de **0,43 a 0,54**; la alternancia fija está en 0,57. El retraso se reduce pero **no desaparece**.

**Esto valida el algoritmo, no su eficacia con personas.**

## 6. Tiempo de adaptación ante cambios

Mediana de días desde un cambio persistente hasta dos decisiones informadas seguidas con el método nuevo:

| Alumno | Días (P4 → P5) |
|---|---|
| dana | 12 → 9 |
| eve | 14 → 7 |
| noa | 10 → 4 |
| pam | 11 → 8 |
| gia | 10 → 10 |
| jon | sin adaptación en ambas |

**Límite estructural:** hacen falta 3 sondeos posteriores en 3 días de aprendizaje distintos. Un alumno que practica cada tercer día necesita 9 días naturales solo para reunirlos.

**Cambio de preferencias:** gia vuelve a su método anterior el día 20. P4 tardaba 7 días en notarlo y P5 tarda 6; el método anterior **sí** se recupera.

## 7. Estado de la personalización por habilidad

- **Elección del estilo por habilidad:** conectada en `SessionRunner`, que ahora decide primero el canal y luego el estilo con `{ skill }`.
- **Evidencia por habilidad** (`skillEvidence`): escrita y escucha por separado; habla y pronunciación `not_assessed`. Sin cambios.
- **El chat entre días** usa la misma política (`chatEvidence.chatDifficulties` → `chooseTeaching`), así que también se beneficia de la detección de cambio.
- **Velocidad:** ninguna decisión lee tiempos de respuesta. Lo comprueba un escaneo del código del motor y un experimento que repite las decisiones con tiempos alterados (`check-personalization-longitudinal`).

## 8. Funcionamiento de la memoria entre días

Probado de punta a punta por **HTTP real** con `e2e-tutor-runtime` (4/4) y `e2e-chat-continuity` (5/5), contra un servidor local nuevo en cada ciclo de QA. Los diez pasos del brief:

1. Frase errónea.
2. El hallazgo validado (`used: local_rules`, `evidence: error`).
3. La corrección en español.
4. El alumno envía la sugerencia.
5. Queda registrado como `assisted` / `copied`.
6. Error el día 2.
7. Error el día 4, y la estrategia cambia de `brief_explanation` a `contrast_example`. La decisión sale del registro del dispositivo, porque cada día es una sesión nueva del servidor.
8. El día 7 Lingua ofrece un recuerdo diferido y el alumno lo resuelve solo: `retrieval`.
9. El día 10, un verbo nunca corregido: `transfer`. El servidor solo `accepted_under_criterion`.
10. Nada de esto es evidencia curricular, nivel ni hito.

**Lo que viaja al servidor:** solo identificadores de regla, un estado y bases verbales. Nunca frases (se comprueba).

Una ejecución inicial encontró que las ejecuciones repetidas contaminaban la memoria de sesión del servidor por reutilizar los mismos ids. Se corrigió en el **arnés** con ids únicos por ejecución; no era un fallo del producto.

## 9. Estado del nivel individual del alumno

`src/learning/curriculum/learnerLevel.js` (`deriveLearnerLevel`) separa cinco conceptos:

| Concepto | Fuente | Comportamiento |
|---|---|---|
| **Estimación del placement** | `profile.placementResult.level` | Solo informativa: **no abre ni salta nada** |
| **Niveles disponibles** | `levels.js` (`available: true`) | Hoy solo `pre_a1` |
| **Nivel de trabajo** | primer nivel disponible no completado; si todos lo están, el último | Hoy siempre `pre_a1` |
| **Completados** | hitos **válidos** en orden | Un hito sin los niveles anteriores se ignora y se informa en `inconsistencies` |
| **Siguiente** | el nivel tras el último completado, con `open` | Un graduado de Pre-A1 ve `{ a1, open: false }` y la transición `next_level_closed` |

- Se **deriva en cada llamada** y nunca se almacena: no hay nada que migrar ni nada que el alumno pueda escribir.
- Las pantallas usan `workingLevelId`: Hoy, el plan de sesiones de `AppContext`, `CompletedEpisodes`, `JourneyRail`, `LearningSummaryCard`, la insignia de `LanguageIdentity`, `SetupFlow` y `placement`.
- No queda **ningún** llamador de `playableLevelId()`. Se eliminó el último, `episodeContent.currentLevelId`, que era código muerto.
- **`check-learner-level`, 11/11.** Cubre:
  - alumno nuevo;
  - placement sin verificar (A2 o C1 no abren nada);
  - campos falsos escritos en el modelo (`level`, `currentLevel`…), que no cambian nada;
  - Pre-A1 en progreso;
  - graduado con A1 cerrado;
  - evidencia contradictoria (un hito A1 sin Pre-A1, o un graduado con repasos vencidos que sigue graduado);
  - un hito inválido (4 formas);
  - cambio de cuenta A→B→A;
  - progreso restaurado;
  - un **banco aislado con dos niveles abiertos**: el graduado trabaja en A1 y el planificador propone el primer episodio de A1, mientras que el no graduado sigue en Pre-A1;
  - las pantallas usan el nivel de trabajo.
- Las comprobaciones estructurales que exigían `playableLevelId()` (`check-curriculum-authoring`, `check-placement-honesty`) pasan ahora a exigir el nivel de trabajo **y** prohibir el nivel global. Su intención se conserva: derivar del registro y no codificar ningún nivel a mano.

## 10. Garantía de que A1 sigue cerrado

- `levels.js` no se modificó: A1 tiene `available: false`.
- `prepared/a1Readiness.js` sigue fuera de `src`. `check-bundle-boundaries` 6c lo comprueba sobre el build.
- Ninguna calibración se inventó.
- `check-learner-level` comprueba que, para un alumno nuevo, un graduado y un graduado con un hito A1 **falsificado**:
  - el nivel de trabajo es `pre_a1`;
  - ni sus episodios ni el plan del día incluyen episodios de A1;
  - `episodeRequest` de un episodio A1 devuelve `level_unavailable`.
- El chat nombra `pre_a1` en la petición al evaluador solo porque el contrato exige un nivel abierto. La evidencia del chat no cuenta para ningún nivel (`chatEvidence.js`).
- Las suites de A1 (`check-a1-*`, `check-a1-readiness`) siguen verdes.

## 11. Integridad y riesgo residual del almacenamiento

**El límite de P4** era que un turno varado más de 30 días detrás de un escritor podado se perdía (1 de 1.221 a los 35 días).

**Investigación:**
- **Podar menos** solo mueve el horizonte, y el almacenamiento crece con cada carga de página.
- **Identificar escritores con datos pendientes** no basta: el escritor varado **nunca** escribió, así que no tiene entrada de cobertura que proteger.
- **La clave:** las demás pestañas solo ven lo que hay en el almacenamiento, de modo que **un evento nunca guardado no puede haber sido plegado en ningún sitio**.

**Corrección** (`progressLedger.js`, `localProgress.js`):
- Cada evento registra `saved`: el momento de su **primer guardado durable**. Hasta que una escritura tiene éxito, cada intento lo vuelve a sellar; después queda fijo, porque en las fusiones gana la copia sellada más antigua.
- Al podar un escritor, la base guarda `prunedSaved`, el último sello entre lo que había plegado.
- Un evento de un escritor sin entrada solo cuenta como cubierto si su sello es anterior a esa marca.
- Las bases o entradas antiguas sin sellos conservan la regla de tiempo. Al podar una entrada sin sello, se asume «ahora», que es lo conservador.
- **Un riesgo que la propia corrección introducía, y que se cerró antes de integrar:** una pestaña inactiva durante semanas guarda en memoria eventos viejos **sin** sello. Sellarlos con «ahora» los haría contar dos veces una vez podado su escritor. Por eso cada página recuerda la hora confirmada de su primer guardado (`confirmedSaves`).
- El mismo sellado se aplica al **escuchar** el almacenamiento (`mergeLocalProgress`). Sin eso, la fusión descartaba el turno varado antes de que pudiera guardarse.
- **Error recuperable visible:** un guardado fallido se reintenta cada 15 s con el mismo lease. Mientras falla, Lingua muestra en la conversación un aviso tranquilo, en 8 idiomas y RTL incluido, que pide no cerrar la pestaña. Desaparece en cuanto funciona.

**Matriz completa** (`check-ledger-integrity`, mismo arnés):

| Implementación | Pasan | Fallan |
|---|---|---|
| P4 (`_snapshot-p4`) | 28 | **2**: varado 35 y 120 días |
| P5 | **30** | **0** |

Escenarios nuevos:
- varado 35 días: 1.221/1.221;
- varado 120 días;
- copia obsoleta de un escritor podado, meses después: nada se cuenta dos veces;
- pestaña inactiva 40 días que vuelve a guardar: nada se cuenta dos veces.

**Crecimiento:** 60 días × 4 cargas × 15 turnos ocupan 117,6 → **128,7 KiB** (+9 %, por los sellos), en una sola copia.

**Lo que sigue sin garantizarse:**

1. **Una pestaña que se cierra sin haber guardado nunca.** Lo que solo existía en su memoria se pierde: no hay dónde recuperarlo. El aviso existe para reducir este riesgo.
2. **Un turno sí guardado, pero invisible para todas las pestañas que compactan durante más de 30 días** (una copia en una clave que nadie lee), cuyo escritor se poda entretanto. Es teórico en un único navegador, porque todas las pestañas leen todas las copias. No se puede probar en el arnés sin simular un almacenamiento parcialmente ilegible.
3. **Si el almacenamiento no permite guardar durante semanas,** nada sale de la memoria de la pestaña: la única garantía es avisar y reintentar.
4. El turno no guardado de una sesión reemplazada por otra cuenta se rechaza **a propósito** (aislamiento).

**No se afirma cero pérdidas absolutas.**

## 12. Pruebas HTTP y visuales

**HTTP real**, con un servidor `uvicorn` local nuevo en cada ciclo y el proveedor `local`:
- `e2e-tutor-runtime`, 4/4: los diez pasos; la regla nueva en 8 idiomas; texto extranjero y un mensaje de 3.500 caracteres; peticiones hostiles que intentan elegir el evaluador o conceder XP o dominio.
- `e2e-chat-continuity`, 5/5.
- Además, `test_chat_runtime.py` (pytest) recorre `/chat` con `TestClient`: las 192 respuestas grabadas y los casos obligatorios.

**Banco visual de desarrollo** (`bench/`, datos sintéticos, nunca empaquetado):
- **Escenas nuevas:**
  - `today` y `identity`, con un alumno con placement A2: muestran «0/17» de Pre-A1 y la insignia «PRE-A1», que es el nivel de trabajo y no la estimación;
  - `chat&saveFailing=1`, con el aviso de guardado.
- **Barrido automático** en iframes reales (mide el desbordamiento horizontal, claves i18n sin traducir y página vacía):

  | Barrido | Combinaciones | Resultado |
  |---|---|---|
  | escenas `today`, `identity`, `chat`, `tu` × en / es / ja / ar × claro / oscuro × 390 / 768 / 1440 | **96** | 0 desbordamientos, 0 claves, 0 vacías; árabe en RTL |
  | aviso de guardado × 8 idiomas × 2 temas × 3 anchos | **48** | visible en todas y sin desbordamiento |

- Se revisaron capturas: identidad en árabe oscuro a 390 px, Hoy en japonés oscuro y el aviso en árabe oscuro a 390 px.

**Autenticación real: BLOCKED / NOT_TESTED.**
- No existe en este entorno un proyecto de pruebas autorizado ni credenciales de prueba, y `CLOUD_PREFERENCES_RELEASED=false`.
- No se usaron cuentas reales ni credenciales de terceros, y no se incrustó ninguna clave.
- Todo lo de cuentas se probó con *fixtures* (`activateLocalAccount`, el arnés de pestañas y leases) y **no se declara como autenticación real**.
- **Qué hace falta para hacerla:**
  1. un proyecto Supabase **de pruebas** autorizado por el propietario, separado de cualquier proyecto real o de EvoLabs;
  2. `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` de ese proyecto, en un `.env.local` no versionado;
  3. dos o tres cuentas de prueba creadas para ello;
  4. habilitar el alcance de nube según `CLAUDE.md`;
  5. un plan de prueba: alta, inicio de sesión, cambio de cuenta, aislamiento con RLS, sin conexión y migración del estado local.

## 13. Resultados completos de QA

**Línea base de la fase 5:**

| Medida | Valor |
|---|---|
| `check:all` | 97/97 |
| Backend | 843 pruebas |
| Integridad | 27 escenarios |
| Evaluador | 139 pruebas |
| Bundle | 727,2 kB |

**Dos ciclos completos consecutivos, sin cambios de código entre ellos** (`cycle-p5.sh`):

| Paso | Ciclo c1 | Ciclo c2 |
|---|---|---|
| `check:all` (por código de salida) | **PASS 100/100** | **PASS 100/100** |
| build | PASS | PASS |
| `check:i18n` (8 idiomas al 100 %) | PASS | PASS |
| foundry B1, B2, C1, C2 y estructura A2 | PASS | PASS |
| `check-ledger-integrity` completa | PASS 30/30 | PASS 30/30 |
| `check-adaptation-policy --report` | PASS 10/10 | PASS 10/10 |
| cloud-scope + self-test + tests | PASS | PASS |
| compileall | PASS | PASS |
| pytest | **PASS 1.241 superadas, 28 omitidas** | PASS 1.241 / 28 |
| HTTP `e2e-tutor-runtime` | PASS 4/4 | PASS 4/4 |
| HTTP `e2e-chat-continuity` | PASS 5/5 | PASS 5/5 |
| plantillas de correo | PASS | PASS |
| `check:github-integration` | **BLOCKED** (falta `jq`; se ejecuta en CI) | BLOCKED |

- **Las 28 omisiones** son los casos del fixture dorado con un cambio intencionado (§1). Se comparan en `test_intended_changes_are_the_only_ones` y se prueban en `test_intended_changes_have_their_effect`.
- **`check:all` pasa de 97 a 100** con `check-line-endings`, `check-learner-level` y `check-adaptation-policy`. `check-personalization-longitudinal` ya estaba.
- **Portabilidad en Windows:**
  - el nuevo `check-line-endings` (§15);
  - la matriz completa necesita `--max-old-space-size=4096`, porque el arnés retiene memoria entre escenarios. El script `check:ledger-integrity` ya lo incluye y `check:all` usa `--quick`.
- **Seguridad:** cloud-scope OK; el escaneo de secretos del diff dio 0 secretos reales (§15).

**Visual:** PASS (§12). **Autenticación real:** BLOCKED / NOT_TESTED (§12).

**Comprobaciones estructurales adaptadas** a un cambio legítimo de API, con aserciones conservadas o reforzadas:
- `check-session-surfaces`: inyecta `currentArc`; el escritor pasivo de progreso se ejecuta ahora con reintento y aviso, con aserciones nuevas sobre ese reintento con el mismo lease;
- `check-curriculum-authoring` y `check-placement-honesty`: nivel de trabajo y prohibición del nivel global;
- `test_api.py`: la clave `evaluation` y su forma;
- `check-chat-observations`: la clave `proposed` y su escenario;
- `test_evaluator_contract.py`: el límite conocido de P4, ya cerrado, se convierte en prueba de detección, y la honestidad se traslada al fallo restante («Maria like cats.»);
- `check-ledger-integrity`: el escenario «LÍMITE 35 días» exige ahora que se cuente.

## 14. Rendimiento y tamaño del bundle

- **Entrada:** 727,2 kB (P4) → **730,9 kB** (+3,7 kB: nivel individual, sellos del ledger, política y aviso). Son 253,8 kB de app y 477,1 kB de currículo.
- **Presupuesto sin cambios:** 850 kB.
- **Backend:** ~0,05 ms por evaluación de referencia, medido en P4; la integración no añade una segunda evaluación.
- **El ledger** escribe unos 20 bytes más por evento.

## 15. Archivos modificados

**El cambio no se limitó a documentos.** Lista completa en el `.diff` de la fase.

**Backend:**
- nuevos: `ai/chat_evaluation.py`, `ai/language_id.py`;
- modificados: `ai/evaluator_adapters.py`, `ai/grammar_check.py`, `ai/local_engine.py`, `ai/schemas.py`, `ai/tutor_i18n.py`, `app/routes/chat.py`.

**Pruebas del backend:**
- nuevas: `tests/chat_golden.py`, `tests/fixtures/chat_golden_p4.json`, `tests/test_chat_runtime.py`, `tests/test_grammar_adversarial.py`;
- adaptadas: `tests/test_api.py`, `tests/test_evaluator_contract.py`.

**Frontend:**
- `src/learning/curriculum/learnerLevel.js` (nuevo) y `src/learning/curriculum/episodeContent.js`;
- `src/learning/engine/teachingPolicy.js`, `src/learning/engine/chatEvidence.js`;
- `src/services/chatAnalysis.js`, `src/services/api.js`, `src/services/progressLedger.js`, `src/services/localProgress.js`, `src/services/placement.js`;
- `src/context/AppContext.jsx`;
- componentes: `SessionRunner.jsx`, `TodayView.jsx`, `CompletedEpisodes.jsx`, `JourneyRail.jsx`, `LearningSummaryCard.jsx`, `LanguageIdentity.jsx`, `SetupFlow.jsx`, `ConversationRoom.jsx`;
- i18n: `translations.js` y los 7 catálogos.

**Pruebas del frontend:**
- nuevas: `check-adaptation-policy.mjs`, `lib/teachingPolicyP4.mjs`, `check-learner-level.mjs`, `check-line-endings.mjs`, `e2e-tutor-runtime.mjs`;
- adaptadas: `check-chat-observations`, `check-ledger-integrity`, `check-session-surfaces`, `check-curriculum-authoring`, `check-placement-honesty`;
- también: `package.json` y `bench/main.jsx` (escenas nuevas).

**Documentos:**
- actualizados: `docs/architecture/intelligent-evaluator-contract.md` (ya conectado) y `docs/curriculum/a1-readiness-design.md` (nivel individual hecho);
- nuevos: este informe y el traspaso consolidado.

**Finales de línea.**
- Las ediciones con Python en Windows (modo texto) habían convertido **17 archivos a CRLF**: 5 de ellos ya estaban en los entregables de P4 y 12 los tocó esta fase.
- Eso rompía un arnés que busca firmas con `\n`.
- Todos volvieron a LF, y el nuevo `check-line-endings` lo vigila.
- Por eso el `.diff` de esta fase se calcula ignorando el CR final.

**Secretos.** El escaneo del diff (`sk-`, JWT, `service_role`, claves privadas, `*_API_KEY=`) dio 0 secretos.

## 16. Limitaciones del motor local

- Detecta pocas familias: pasado irregular, marcador de pasado, tercera persona (pronombre o sujeto nominal seguro), a/an y frases fijas de principiante.
- No detecta: nombres propios como sujeto, sintagmas largos, «each of», relativos, indefinidos («everybody»), «and» sin coma, orden de palabras, preposiciones, vocabulario ni sentido.
- No evalúa el habla ni la pronunciación.
- La identificación de idioma es por palabras funcionales: un texto corto o mezclado queda sin afirmar.
- `no_issue_detected` significa «ninguna regla saltó», nunca «correcto».

## 17. Bloqueos reales para una futura IA generativa

1. **La autorización escrita del propietario** y la elección del proveedor. `provider_policy.py` impide que una clave lo active por sí sola.
2. **Un corpus de evaluación real.** Frases reales de alumnos con consentimiento, revisadas por docentes. Hoy todo el corpus es sintético o del desarrollador.
3. **La puerta de calidad:** el proveedor debe igualar o superar a la referencia en las 139 pruebas del contrato, las 183 del corpus adversarial y las 192 respuestas grabadas, y medirse caso por caso frente a ella.
4. **Privacidad:** el contrato ya limita lo que sale (sin identidad ni historial), pero cada proveedor necesita su propia revisión.
5. **Coste y latencia** medidos con tráfico de prueba. El presupuesto actual de timeout es de 4 s.
6. **Generación fuera del contrato.** La respuesta conversacional (`reply`) sigue siendo de reglas. Generarla con un modelo exige un contrato propio de generación (tono, nivel, longitud, idioma, seguridad) con su validador, que aún no existe.

## 18. Cambios pendientes de autorización

- Abrir A1 (`LC-PROD-002`).
- Calibrar los umbrales de A1 con datos reales, para lo que primero hay que aprobar el piloto.
- Cualquier proveedor remoto de evaluación o generación.
- La exportación de datos del alumno para el piloto.
- QA autenticada en un proyecto de pruebas (§12).
- Integrar todo en GitHub (§19).
- Un aviso global de guardado fuera del chat: hoy solo aparece en la conversación, por respeto a la arquitectura visual congelada.

**Piloto y A1:**
- Las mejoras no invalidan los instrumentos del piloto: las pruebas externas no dependen de la app.
- `derivePreA1Readiness` y la graduación no cambiaron; `check-graduation` y `check-pre-a1-*` siguen verdes.
- El diseño de preparación A1 sigue siendo válido: `check-a1-readiness` 12/12.
- El piloto sigue siendo un **borrador pendiente de autorización**.

## 19. Preparación del trabajo acumulado para GitHub

Detalle en `docs/audits/2026-10-31-consolidated-local-handoff.md`.

- **Base y estado del remoto:** `main@086323c`, y el `main` remoto sigue **idéntico** (consulta de solo lectura).
- **Cambios acumulados:** 71 modificados, 68 nuevos y 0 eliminados. Todos los originales se reconstruyeron desde los respaldos y se verificaron por hash.
- **Respaldos:** los cinco snapshots reproducen exactamente sus diffs registrados.
- **Conflictos posibles:** con el PR abierto #137 (32 archivos en común) y con el #135 (3).
- **Integración propuesta:** un clon nuevo, una rama `local/p0-p5-consolidated` y un commit por fase a partir de los snapshots; luego verificación, PR borrador con `## Evidence` y decisión del propietario sobre los PRs #137 y #135.
- **Nada se subió.**

---

## Anexo — salidas literales de los dos ciclos

**Ciclo c1:**

```
check:all exit=0 :: check:all — 100/100 green in 130s
build exit=0
check:i18n exit=0
check:github-integration exit=1 :: check-merge-blocker-gate — cannot run here: needs jq (GitHub-integration check; runs in CI)
foundry b1 exit=0
foundry b2 exit=0
foundry c1 exit=0
foundry c2 exit=0
foundry a2-structure exit=0
ledger-integrity (full) exit=0 :: check-ledger-integrity — 30 passed, 0 failed
adaptation-policy exit=0 :: check-adaptation-policy — 10 passed, 0 failed
cloud-scope exit=0 :: check-linguachat-cloud-scope — scanning working tree (no git checkout)
cloud-scope --self-test exit=0
cloud-scope tests exit=0
compileall exit=0
pytest exit=0 :: 1241 passed, 28 skipped in 7.55s
e2e-tutor-runtime (HTTP) exit=0 :: e2e-tutor-runtime — 4 passed, 0 failed  (http://127.0.0.1:8162)
e2e-chat-continuity (HTTP) exit=0 :: e2e-chat-continuity — 5 passed, 0 failed  (http://127.0.0.1:8162)
email exit=0
```

**Ciclo c2** (sin cambios de código desde c1):

```
check:all exit=0 :: check:all — 100/100 green in 128s
build exit=0
check:i18n exit=0
check:github-integration exit=1 :: check-merge-blocker-gate — cannot run here: needs jq (GitHub-integration check; runs in CI)
foundry b1 exit=0
foundry b2 exit=0
foundry c1 exit=0
foundry c2 exit=0
foundry a2-structure exit=0
ledger-integrity (full) exit=0 :: check-ledger-integrity — 30 passed, 0 failed
adaptation-policy exit=0 :: check-adaptation-policy — 10 passed, 0 failed
cloud-scope exit=0 :: check-linguachat-cloud-scope — scanning working tree (no git checkout)
cloud-scope --self-test exit=0
cloud-scope tests exit=0
compileall exit=0
pytest exit=0 :: 1241 passed, 28 skipped in 7.65s
e2e-tutor-runtime (HTTP) exit=0 :: e2e-tutor-runtime — 4 passed, 0 failed  (http://127.0.0.1:8438)
e2e-chat-continuity (HTTP) exit=0 :: e2e-chat-continuity — 5 passed, 0 failed  (http://127.0.0.1:8438)
email exit=0
```

