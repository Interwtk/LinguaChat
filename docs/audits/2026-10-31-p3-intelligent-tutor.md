# LinguaChat 1.0 — Fase 4: tutor inteligente, aprendizaje personalizado y preparación de Pre-A1 / A1 (2026-10-31)

**Base de partida:**
- Estado final de la fase 3 (`docs/audits/2026-10-31-p2-product-hardening.md`).
- Se respaldó entero antes de editar en `C:\Users\Sebastian Gamboa\Music\LinguaChat-main\_snapshot-p2\`.
- Los informes y diffs anteriores, y los respaldos `_originals-086323c`, `_snapshot-p0` y `_snapshot-p1`, siguen intactos.

**Diff de esta fase:**
- `docs/audits/2026-10-31-p3-intelligent-tutor.diff` (36 archivos), calculado contra `_snapshot-p2`.
- No incluye secretos, `.env`, respaldos, `node_modules`, `dist`, `.venv` ni cachés.

**Matriz curricular:** `docs/curriculum/pre-a1-a1-readiness-matrix.md`. Sus tablas las genera el código y `check:all` falla si dejan de coincidir con él.

**Lo que no se hizo:**
- No hubo `git init`, clone, push, merge, deploy ni publicación.
- No se tocó Supabase, Vercel ni producción.
- No se usó ninguna API paga ni proveedor de IA; todo funciona con el motor local gratuito (`LINGUACHAT_PROVIDER=local`).
- No se añadieron dependencias.
- Se mantienen:
  - `CLOUD_PREFERENCES_RELEASED=false`;
  - Pre-A1 congelado sin cambios de contenido;
  - A1–C2 cerrados;
  - Lingua como tutora y Chatto como mascota;
  - los 8 idiomas.
- **No se probó autenticación real.**

---

## Resumen para el propietario

1. **Lingua recuerda dificultades entre días sin confundirlas con dominio.**
   - Antes, el servidor olvidaba la conversación tras unos turnos y el chat no alimentaba ningún registro de aprendizaje.
   - Ahora cada turno se clasifica en el dispositivo (error, copia, exposición reciente, ayuda, ambiguo, no evaluable, recuperación diferida, transferencia) y se guarda de forma compacta: solo ids de regla, tipo, hora y el verbo base, nunca la frase.
   - Al día siguiente Lingua ofrece una **recuperación en una frase nueva, con un verbo que el estudiante no practicó**.
   - **Probado de punta a punta por HTTP contra el motor real: 5/5 recorridos de varios días.**
2. **Cambia de método con datos, sin un motor paralelo.**
   - La elección entre «explicación breve», «contraste» y «recuperación guiada» entre días la hace la misma `chooseTeaching` de `teachingPolicy.js`, aplicada al registro del chat.
   - Con dos recuperaciones posteriores fallidas tras el mismo método, cambia (`switch_after_failure`).
3. **Se encontraron y corrigieron correcciones falsas.**
   - «I read a book yesterday» se «corregía» a **«readed»** y «I put… yesterday» a sí mismo.
   - Un corpus de 60 frases válidas pasó de 2 falsos positivos a **0**.
4. **Se eliminó contenido engañoso:**
   - el Archivo mostraba 6 conversaciones inventadas a estudiantes nuevos, con ánimo, «+N pts» y confianza inventados;
   - las misiones hablaban español en los 8 idiomas y podían mostrar la idea en el idioma del estudiante como «la corrección en inglés»;
   - Tú mostraba «Nivel 3» fijo y «hoy: N min», calculado como todos los mensajes ×1,5;
   - el error de conexión del chat prometía una «demo» en inglés.
5. **Pre-A1 está completo y probado por simulación. A1 está construido (21/21 episodios, 16/16 capacidades) pero no listo para abrirse.** Le faltan:
   - la readiness de A1 (no existe en el código);
   - la decisión del propietario;
   - un piloto real;
   - la evaluación oral.

---

## 1. Errores corregidos

| Error | Efecto visible | Corrección | Prueba |
|---|---|---|---|
| Archivo con `MOCK_ARCHIVE` | Un estudiante nuevo veía 6 conversaciones de otra persona, con ánimo, «+N pts» y «confianza» | Solo días reales del ledger y estado vacío honesto | `check-archive-honesty` (7) |
| Misiones en español fijo | Instrucciones, pistas, celebraciones y salida en español en los 8 idiomas | 73 claves × 8 idiomas; datos con `instructionKey`, `promptKey`, `hintKey` y `phrase`/`model` en inglés | `check-archive-honesty` (todas las misiones × 8 idiomas) |
| Corrección de misión en el idioma del estudiante | `step.feedbackHint` cortado en «:», o la consigna «Quiero viajar.» enviada como `prompt`, salían como «la corrección» | La corrección es `step.model` (inglés) o nada; el backend solo recibe material en inglés | Mismo |
| «Nivel 3» fijo, «hoy: N min» inventado, misiones = días | Cifras sin base en Tú (ruta) | Retirado «Nivel 3»; «Mensajes» reales; misiones completadas reales | `check-archive-honesty` |
| «Confianza» del Archivo | `45 + 2·mensajes + correcciones` | Retirado | Mismo |
| Botón principal y burbuja en oscuro | Texto a 2,57:1 | Token `--on-accent`: 5,81:1 (acento) y 7,57:1 (hover) | Contraste calculado en la prueba |
| «readed» / «put→put» | Corrección falsa de frases correctas | `SAME_FORM_PAST` y nunca corregir una palabra a sí misma | `test_explanation_quality` (88) |
| «Hallo, wie geht es?» respondido con «Nice!» | Alemán tomado por inglés | Palabras alemanas sin gemelo inglés; pruebas de no confundir el inglés | Mismo |
| Chat sin conexión | «You can keep exploring the demo» en inglés | `chatOfflineNotice` localizado | Build y banco |
| «Correccion clave» / «Mas practicado» | Sin tildes en el Archivo (es) | Corregido. Quedan ~31 cadenas `es` heredadas sin tildes (sección 8) | — |

## 2. Cómo quedó el Archivo

- **Fuente única:** `progress.sessions`, los resúmenes por día que el ledger pliega de turnos reales.
  - Por eso hereda el aislamiento por cuenta (A→B→A probado), la fusión entre pestañas (probado), el reinicio (probado) y el funcionamiento offline, sin un segundo almacén.
- **Por día muestra:**
  - la fecha;
  - los temas detectados por palabra clave, localizados;
  - «tus mensajes: N», real (el ledger cuenta 2 por turno);
  - tu último mensaje de ese día y tu última corrección, tal como se guardaron.
- **No genera títulos ni resúmenes** ni guarda transcripciones. Los campos antiguos `mood` y `confidence` se ignoran.
- **Estado vacío:** «Todavía no hay días de práctica… No aparece nada que no haya ocurrido de verdad», con botón para empezar.
- **Por qué no se mezclan conversaciones:** el Archivo trabaja con días, no con hilos, y no muestra transcripciones, así que no puede pasar el historial de una conversación a otra.
- **Accesibilidad:** cada día es un botón con `aria-expanded` y `aria-controls`; el estado vacío lleva `role="status"`.

## 3. Cómo se conectan las conversaciones con las observaciones pedagógicas

```
mensaje → POST /chat (motor local) → analysis {verdict, findings, uses, strategy, retrieval}
        → services/chatAnalysis.safeAnalysis   (descarta las palabras del estudiante)
        → chatEvidence.classifyChatTurn        (¿cuándo? ¿cómo? ¿qué día? ¿qué verbo?)
        → learnerModel.chatEvidence            (unión por id, ≤120, lápidas por regla)
        → chatEvidence.chatDifficulties        (estado, espaciado, chooseTeaching)
        → learning_memory en el siguiente POST (solo campos cerrados, validados en chat.py)
```

- **Procedencia** registrada en cada entrada: `free_chat`, `retrieval_prompt`, `mission`, `episode` o `review`.
- **Clasificación explícita de capacidades** (`CHAT_RULES`, según los blueprints):

| Regla | Capacidad del blueprint | Nivel |
|---|---|---|
| `past_irregular` | `simple_past_irregular_pattern` | A2 |
| `past_marker` | `past_time_expression_pattern` | A2 |
| `third_person` | `third_person_s_productive` | A2, **excluida por nombre de A1** |
| `article` | ninguna (la alternancia a/an no es patrón de ningún blueprint) | — |

- **Ninguna regla del chat es evidencia curricular de Pre-A1.** Por eso todas son `curricular: false`. No mueven nivel, can-do, readiness, andamiaje ni `recurringErrors` (comprobado: el modelo curricular queda byte a byte igual).
- **No se abrió A1 ni se cambió ninguna regla de aprobación.** Las dificultades de niveles superiores se recuerdan sin cambiar el nivel del alumno.
- **Memoria pedagógica:**
  - compacta (≤120 entradas, sin texto);
  - privada (`safeAnalysis` y el saneador del servidor descartan las frases);
  - idempotente (ids por turno);
  - reversible (`forgetChatRule` con lápida que gana la fusión entre pestañas);
  - acotada en el servidor (máx. 8 reglas, estados y estrategias de conjunto cerrado).

## 4. Qué evidencia cuenta para aprender y cuál no

| Tipo | ¿Cuenta como mejora? | Cuándo |
|---|---|---|
| `error` | — (dificultad) | La regla encontró un error con confianza alta o media |
| `ambiguous` | No | Hallazgo de confianza baja: ni siquiera crea una dificultad |
| `copied` | **No** | El estudiante teclea la corrección que Lingua acaba de mostrar |
| `recently_modeled` | **No** | Uso correcto menos de 10 min después de la corrección, o con la forma que Lingua mostró |
| `assisted` | **No** | Envió sin cambios una sugerencia de Lingua |
| `accepted` | No (informativo) | Correcto sin historia que lo juzgue, o el mismo día del error |
| `retrieval` | **Sí** | Otro día: respondió bien la recuperación ofrecida, o usó de nuevo el mismo verbo sin ayuda |
| `transfer` | **Sí** | Otro día, sin ayuda, con un verbo nunca corregido ni practicado |
| `retrieval_failed` | Cuenta en contra del método | Falló la recuperación ofrecida |
| `not_evaluable` / `insufficient` | No | Otro idioma, una palabra, traducción, silencio de las reglas, sin conexión |

- **Estados:** `observed` → `recurring` → `improving` (1 día con éxito posterior) → `holding` (2 días).
- **Nunca «dominado».** `holding` es solo del chat y no vale nada en el currículo. La banda de evidencia (`evidenceSummary`) sigue siendo `insufficient` con un único éxito.
- **Usos correctos que no se cuentan nunca:** formas idénticas a la base (`put`), formas con otro significado (`left`), el auxiliar `did`, `was`, y participios tras have/be.

## 5. Qué decisiones puede tomar Lingua

Verificadas con datos y con la razón registrada (`check-teaching-decisions`, 10/10):

| Decisión | Mecanismo | Razón registrada |
|---|---|---|
| Explicar o dejar intentar de nuevo | Un error deja el apoyo igual; dos lo aumentan | `recent_retries` |
| Pista y modelo | Según el nivel de apoyo (`showsHintByDefault`, `showsModelAnswer`) | — |
| Aumentar o retirar apoyo | 2 aciertos abiertos sin ayuda retiran apoyo; 4 aciertos con ayuda lo desvanecen | `recent_independent_success`, `faded_after_helped_success` |
| La estrategia falla | `chooseTeaching` en sesiones **y ahora en el chat entre días** | `switch_after_failure` |
| Actividad de recuperación | Repasos vencidos en el plan de sesión, más la recuperación diferida en el chat | — |
| Variar el contexto | Selección de temas; recuperación con verbo y frase nuevos | — |
| ¿Hay evidencia para avanzar? | Umbrales `evidenceSummary`; readiness con motivos | `reasonCodes` |

## 6. Qué métodos puede seleccionar

- **Sesiones:** instrucción `concise` / `worked_example`, canal `reading` / `listening` y formatos equivalentes (`formatChoice`).
- **Chat:**
  - `brief_explanation`, luego `contrast_example` (con contraste ✗/✓) y luego `guided_retrieval` (hueco en una frase nueva).
  - Dentro de una conversación escala por repetición.
  - Entre días usa `preferred_strategy` calculada por `chooseTeaching` o, si la dificultad es recurrente, empieza en contraste.
  - La conversación actual siempre manda sobre la memoria.

## 7. Cómo personaliza temas y dificultad

- **Temas** (sin cambios en esta fase, verificados):
  - los intereses son mayoría, pero nunca todos los días;
  - aparecen temas relacionados, nuevos y neutros;
  - un cambio de gustos se aplica;
  - un tema descartado no vuelve;
  - no hay categorías sensibles (`check-learning-loop`).
- **Transferencia:** la recuperación del chat usa **otro verbo en otra frase**, y la transferencia solo cuenta en otro día con un verbo nuevo. Así se mide retención y transferencia, no preferencia.
- **Dificultad** (`check-teaching-decisions`). No depende solo del número de errores; distingue:
  - falta de conocimiento: dos errores, más apoyo;
  - error ocasional: uno, sin cambio;
  - respuesta asistida: no es independencia;
  - modalidad: la escucha débil no rebaja la escritura;
  - no entender la tarea: pedir otra forma trae ayuda en ese turno;
  - falta de evidencia: «insuficiente»;
  - competencia demostrada en otro contexto: empieza con menos apoyo, pero solo si la habilidad se intentó, no por ítems sueltos.
- **El tiempo no penaliza:** la misma respuesta con 5 s o con 10 min produce la misma decisión.

## 8. Capacidades educativas que siguen limitadas

**Motor gratuito (reglas):**
- detecta solo 4 familias de error (pasado irregular, marcador de pasado con presente, he/she/it, a/an);
- detecta usos correctos solo de pasados irregulares inequívocos;
- deja fuera: «I am agree», «every days», «since 2010» con presente continuo, sujetos nominales («My sister work»), vocabulario, registro y coherencia. Ahí responde con prudencia (`no_issue_detected` con confianza baja) y sin elogiar la corrección (probado).

**Modalidades:**
- la expresión oral y la pronunciación no se evalúan;
- la escucha solo se evalúa con TTS en sesiones.

**Producto:**
- La memoria del chat todavía no se muestra en Tú; es informativa y actúa a través de lo que Lingua hace.
- Los temas del Archivo se infieren por palabras clave («cooking» no cuenta como comida).
- El locale `es` tiene unas 31 cadenas heredadas sin tildes, fuera del alcance.

## 9. Pre-A1 y A1: completo y pendiente

Detalle en `docs/curriculum/pre-a1-a1-readiness-matrix.md`.

**Pre-A1:**
- 17/17 episodios, todos con contenido real, abiertos y localizados al 8/8;
- 64 producciones abiertas y 28 recuerdos diferidos;
- las 13 capacidades exigidas tienen episodio.

**Limitaciones medidas en Pre-A1:**
- 4 capacidades exigidas no se reutilizan en otros episodios (su transferencia depende de las sesiones);
- la escucha solo está en sesiones;
- no hubo auditoría con lector de pantalla.

**No encontré defectos que justifiquen una excepción al congelamiento.**

**A1:**
- 21/21 episodios cargan y 0 son abribles por un estudiante;
- 16/16 capacidades del blueprint cubiertas (`ask_how_to_say_something` como secundaria);
- 77 producciones abiertas y 39 recuerdos;
- i18n 8/8;
- todos los episodios cubiertos por suites de id, arco o nivel.

**Bloqueos para abrir A1:**
1. la decisión del propietario (`LC-PROD-002`);
2. **no existe readiness ni hito A1** (`MILESTONE_LEVELS=['pre_a1']`);
3. Home y la planificación no se probaron con dos niveles abiertos;
4. no hay piloto real;
5. no hay evaluación oral.

No había contenido A1 pendiente que pudiera completarse sin tocar evaluadores, gates o progresión, así que no se cambió contenido.

## 10. Resultados de pruebas (reales y simuladas)

| Suite | Tipo | Resultado |
|---|---|---|
| `check:all` (frontend, por código de salida) | Simulada (módulos reales) | **PASS 94/94**, dos ciclos consecutivos |
| `pytest` backend | Real (motor local + HTTP TestClient) | **PASS 704** (P2: 597; +19 memoria; +88 calidad), dos ciclos |
| `e2e-chat-continuity` | **Real por HTTP** (uvicorn + motor local) + lógica real del frontend | **PASS 5/5** (principiante, error repetido con cambio de método, estudiante rápido, cambio de idioma es→ar, ambiguo/fuera de alcance). No está en `check:all` porque necesita servidor. |
| `check-chat-observations` | Simulada con fixtures capturados del motor real | PASS 6/6. Las mutaciones (quitar «copiado» o «expuesto hace minutos») se detectan. |
| `check-archive-honesty` | Simulada + almacenamiento real | PASS 7/7. La mutación (restaurar la ruta P2) se detecta. |
| `check-teaching-decisions` | Simulada | PASS 10/10 |
| `check-same-account-tabs` | Simulada (almacenamiento con caché obsoleta) | PASS 39/39 (sección 11) |
| `curriculum-readiness-matrix --check` | Runtime real | PASS |
| `build`, `check:i18n` (5 355 claves, 100 % × 8), foundry b1/b2/c1/c2/a2, cloud-scope (+self-test +tests), compileall, plantillas de email | — | **PASS** en ambos ciclos |
| Banco visual en el navegador | Real (Chromium, datos sintéticos) | **PASS:** 216 combinaciones (9 escenas × es/en/ja/ar × claro/oscuro × 390/768/1440): 0 desbordes, 0 claves crudas, 0 español filtrado, 0 datos inventados, árabe siempre RTL. Revisados a ojo el Archivo vacío (oscuro), el Archivo con días reales expandido y la misión en japonés (incluida la corrección en inglés). |
| `check:github-integration` | GitHub (bash+jq) | **BLOCKED** aquí (falta `jq`); corre como paso de CI |
| Recorrido en la app autenticada | — | **BLOCKED**: requiere una cuenta de prueba del propietario |
| Safari y Firefox, lector de pantalla | — | **NOT_TESTED** |
| Eficacia con estudiantes reales | — | **NOT_TESTED** (requiere piloto) |

## 11. Riesgos de concurrencia

Pruebas nuevas en `check-same-account-tabs`:
- **3 pestañas, 2 400 turnos** con caché obsoleta dentro de la ventana de asentamiento: 0 perdidos, y el ledger vuelve a ≤500 eventos tras asentarse.
- **Una pestaña pausada 2 h** que vuelve con memoria obsoleta mientras la otra compacta 900 turnos: total exacto de 960, sin perder ni contar dos veces.
- **Más allá de la ventana de protección (medido, no supuesto).** Escenario: el guardado de una pestaña falla (cuota) durante más de 10 minutos mientras otra compacta más de 500 eventos.
  - Resultado: **ese turno se pierde** al recuperarse, porque queda bajo la base plegada y la fusión lo trata como ya contado.
  - La pestaña afectada recibe `false` en cada guardado.
  - Queda fijado como **límite conocido** en la prueba.
  - Requiere a la vez un fallo de guardado de más de 10 min y más de 500 eventos de otra pestaña en ese intervalo.
  - Para eliminarlo hay que rediseñar las bases del ledger por escritor (contadores tipo G-counter), una refactorización mayor que no se hizo.

Cubiertos desde P2 y aún verdes: cierre y reapertura, limpieza de copias con Web Locks, A→B→A, cuota, migraciones v1/P0/P1 y recompensas repetidas tras la compactación.

**No afirmo «cero pérdida absoluta»:** las pruebas cubren un conjunto finito de casos, y el caso anterior muestra un límite real.

## 12. Rendimiento y tamaño del bundle

- **Entrada:** 713,0 kB (P2) → **724,8 kB** (+11,8 kB: 73 claves de misiones y 8 del Archivo en el inglés base, más `chatEvidence` y `chatAnalysis`).
- **Presupuesto sin cambios:** 850 kB. Lo comprueba su propio build en `check:all`.
- **Distribución:** 247,9 kB de app y 476,9 kB de datos curriculares (3,4 kB por episodio).
- **Coste por turno de chat:** una lectura y una escritura del modelo de aprendizaje, más un payload de memoria de ≤8 entradas pequeñas.

## 13. Cambios de código

**Nuevos:**
- `src/learning/engine/chatEvidence.js`
- `src/services/chatAnalysis.js`
- `src/services/conversationArchive.js`
- scripts:
  - `check-archive-honesty.mjs`
  - `check-chat-observations.mjs`
  - `check-teaching-decisions.mjs`
  - `curriculum-readiness-matrix.mjs`
  - `e2e-chat-continuity.mjs`
- backend: `tests/test_learning_memory.py` y `tests/test_explanation_quality.py`
- `docs/curriculum/pre-a1-a1-readiness-matrix.md`

**Modificados:**
- `ConversationArchive.jsx` (reescrito)
- `JourneyRail.jsx`
- `ConversationRoom.jsx` (asistido y celebración)
- `AppContext.jsx`:
  - memoria y clasificación del chat;
  - `tRef`;
  - misiones;
  - salida;
  - modo sin conexión.
- `api.js`
- `missions.js`
- `practiceMissions.js`
- `learnerModel.js` (`chatEvidence` y `chatForgotten`)
- `index.css` (`--on-accent`)
- `translations.js` y los 7 locales
- `bench/main.jsx`
- `package.json` (4 checks nuevos en `check:all`)
- `check-session-surfaces.mjs` (dependencias inyectadas y firma de `sendMessage`)
- `check-same-account-tabs.mjs` (3 escenarios)
- backend:
  - `grammar_check.py` (`correct_uses`, `SAME_FORM_PAST`, «don't» con he/she/it)
  - `local_engine.py` (`uses`, memoria entre días, `retrieval_action`, palabras propias)
  - `tutor_i18n.py` (`retrieval_lead` × 8)
  - `routes/chat.py` (`learning_memory` validada)

## 14. Funcionalidades que requieren autorización

| Cambio | Por qué espera |
|---|---|
| Abrir A1 | Decisión explícita del propietario (`LC-PROD-002`) |
| Readiness e hito A1; Home y planificación con dos niveles; graduación como puerta a A1 | Cambian progresión y gates |
| Mostrar la memoria del chat en Tú | Cambio visible; necesita diseño y copy en 8 idiomas |
| Bases del ledger por escritor | Refactorización de datos con migración |
| Reutilización adicional en episodios Pre-A1 o A1 | Pre-A1 congelado; A1 necesita criterio docente |
| Cualquier proveedor de IA (OpenAI, Anthropic, Gemini…) | Coste y privacidad; prohibido sin autorización escrita |
| Micrófono, STT o evaluación de pronunciación | Fuera del alcance autorizado |

## 15. Próxima prioridad

**Técnica:**
1. Readiness e hito A1 detrás del flag cerrado, con pruebas de transición desde Pre-A1. No abre nada, pero quita el bloqueo técnico.
2. Bases del ledger por escritor, para cerrar el límite medido en la sección 11.
3. Un contrato de proveedor intercambiable para el evaluador, con el motor local como referencia y las mismas pruebas de falsos positivos como puerta de entrada de cualquier modelo futuro.

**Educativa:**
1. Piloto pequeño con estudiantes reales que mida retención diferida y transferencia (no clics) en Pre-A1 y en la memoria del chat.
2. Revisión docente y nativa del contenido A1, y más reutilización de las 5 capacidades A1 sin transferencia.
3. Decidir con el propietario si Tú muestra «lo que trabajas en el chat».
