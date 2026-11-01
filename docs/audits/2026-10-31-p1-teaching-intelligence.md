# LinguaChat 1.0 — Fase 2: inteligencia pedagógica, personalización y seguridad del aprendizaje (2026-10-31)

**Base de partida:**
- `main@086323c` más los cambios de P0 (`docs/audits/2026-10-31-p0-hardening.md`).
- Ese informe y la auditoría inicial no se modificaron.

**Diff de esta fase:**
- `docs/audits/2026-10-31-p1-teaching-intelligence.diff` contiene 34 archivos y se calculó contra el estado P0.
- No incluye secretos, archivos `.env`, copias de seguridad, `node_modules`, `dist` ni `.venv`.

**Copias de seguridad:**
- `C:\Users\Sebastian Gamboa\Music\LinguaChat-main\_snapshot-p0\` guarda el estado completo al terminar P0.
- `C:\Users\Sebastian Gamboa\Music\LinguaChat-main\_originals-086323c\` guarda los originales de `main`.

**Lo que no se hizo:**
- No hubo push, merge, despliegue ni cambios en Supabase o Vercel.
- No se usaron proveedores pagos.
- `CLOUD_PREFERENCES_RELEASED` sigue en `false`.
- A1–C2 siguen cerrados y Pre-A1 está intacto.
- No se añadieron dependencias y el lockfile no cambió.

---

## Resumen para el propietario

**1. P0-1 no estaba resuelto del todo.**
- En dos pestañas reales del navegador, la versión P0 **perdió los 300 guardados verificados** de una pestaña.
- Causa: cada pestaña lee `localStorage` desde una caché propia que se actualiza tarde. Mientras está ocupada, sobrescribe lo que guardó la otra.
- Solución implementada: **cada pestaña escribe solo su propia clave** y la lectura une todas las copias.
- Resultado en el navegador real: **0 pérdidas en 600 y en 800 guardados**. En simulación: 0 pérdidas en 200 intercalaciones aleatorias con caché obsoleta y cierres abruptos.
- Se aplicó también al modelo de aprendizaje.
- Además encontré y corregí un doble pago posible tras la compactación.

**2. Lingua ahora corrige y explica de verdad.**
- `Yesterday I goed to school.` → `Yesterday I went to school.`, con la explicación de por qué `go` es irregular.
- No es una frase codificada: hay reglas generales con niveles de confianza:
  - pasados regularizados (`eated`, `runned`, `writed`, `buyed`…);
  - marcadores de pasado con el verbo en presente;
  - concordancia `he/she/it`;
  - `a/an`.
- Ninguna de 30 frases naturales correctas recibe una corrección falsa.

**3. Lingua cambia de estrategia si una explicación no funciona.**
- Si el error se repite, pasa de la explicación breve al contraste con contraejemplo.
- Si vuelve a repetirse, pide recuperar la forma en una frase nueva, sin la respuesta a la vista.
- Cuando el error deja de aparecer, vuelve a lo simple.

**4. El idioma del alumno es real.**
- Las explicaciones del tutor llegan en los 8 idiomas, según un código explícito.
- Antes un alumno japonés o árabe recibía español.
- Lingo y Chatto ya no pueden actuar como tutores.

**5. El aprendizaje se mide con más honestidad.**
- Copiar la respuesta modelo visible ya no cuenta como dominio independiente.
- La evidencia se separa por habilidad: escrita y comprensión oral. Speaking y pronunciación quedan como «no evaluado».
- Se informa la incertidumbre: con menos de 3 pruebas, no se afirma nada.
- El gráfico de «Tú» ya no son las constantes 45, 54, 62: muestra respuestas propias reales por semana.
- La etiqueta de nivel ya no inventa «B1».

**6. Lo que todavía no podemos afirmar.**
- Que los alumnos reales aprendan mejor: eso requiere un piloto.
- Que el motor local entienda inglés en general. Solo detecta las familias de errores descritas; lo demás exige el evaluador remoto del contrato híbrido, con un proveedor autorizado.

---

## 1. Estado de la seguridad residual de P0

### 1.1 Reproducción con dos contextos reales de navegador

**Banco de pruebas** (fuera del repositorio, en el scratchpad):
- Una página servida con el Vite del proyecto y el origen aislado `127.0.0.1:5180`, que no toca los datos de la app.
- Importa los módulos **reales** `localProgress.js` y `localLease.js`.
- Dos pestañas del navegador integrado arrancan a la vez y escriben eventos de práctica con bucles síncronos, para que ninguna procese los eventos `storage` de la otra a mitad de carrera.
- La pestaña A tiene el listener de la app. La B no (`repair=0`), lo que equivale a cerrarse justo después de su última escritura. Después se cierra B y una tercera carga cuenta lo que quedó.

| Versión | Guardados verificados A + B | Sobrevivieron | Perdidos |
|---|---|---|---|
| P0 (código vigente al inicio de esta fase) | 300 + 300 | 300 | **300** |
| P0 (copia `_snapshot-p0`, repetición) | 300 + 300 | 300 | **300** |
| P1 (claves por escritor), corrida 1 | 300 + 300 | 600 (100 plegados por compactación) | **0** |
| P1, corrida 2 | 400 + 400 | 800 (299 plegados) | **0** |

**Causa raíz.**
- Cada pestaña de Chromium lee `localStorage` desde una caché por proceso, y las escrituras de otra pestaña le llegan de forma asíncrona.
- Con una clave compartida, la secuencia «leer, unir, escribir» se basa en una lectura obsoleta y borra lo que la otra guardó.
- El listener de P0 tampoco reparaba: releía el almacenamiento actual (ya sobrescrito) en vez de usar el valor del evento.
- El informe P0 describía esto como una «ventana de milisegundos». **Era incorrecto**: bajo una carga real del hilo principal, la pérdida fue total.

### 1.2 Decisión: claves por escritor, no IndexedDB

**IndexedDB** permitiría transacciones serializadas entre pestañas, pero se descartó:
- Todo el aislamiento por cuenta está construido sobre `localStorage`: namespaces por generación, instantáneas al cambiar de cuenta, fencing A→B→A.
- Toda la carga inicial de React es síncrona.
- Migrar exigía rehacer ese aislamiento a la vez, con riesgo de regresión de privacidad. Es la migración «demasiado grande» que pediste no improvisar.

**Diseño implementado** (`src/services/writerKeys.js`):
- **Cada pestaña** (id de `sessionStorage` más id de carga de página) **escribe solo su clave**: `lc2-local-progress~w~<escritor>`. Ninguna pestaña reescribe la clave de otra, así que no hay ninguna lectura obsoleta que pueda borrar nada.
- **La lectura une todas las copias**, incluida la clave compartida antigua de P0. La unión ya era idempotente y conmutativa (ledger de eventos), así que las copias extra son inofensivas.
- **Limpieza.** Se eliminan las copias de otras pestañas que no aportan nada a la propia y llevan ≥ 2 minutos sin escribirse. Si una pestaña viva ve borrada su copia, la reescribe (listener `storage`).
- **Alcance.** Se aplicó a:
  - progreso local (XP, racha, confianza, palabras, sesiones);
  - chat;
  - **modelo de aprendizaje** (`lc2-learner-model-v1`, la evidencia pedagógica), que tenía la misma ventana: en simulación, P0 perdía un ítem de la otra pestaña.
- **Aislamiento.** Las claves conservan el prefijo `lc2-`, así que viven en el namespace de la cuenta y se mueven con ella. Las pruebas A→B→A pasan.

### 1.3 Defectos adicionales encontrados por las pruebas adversariales (corregidos)

1. **Doble pago tras la compactación.**
   - Al plegar eventos viejos, el ledger olvidaba sus ids, así que un premio con id determinista reenviado más tarde se volvía a pagar.
   - Se reprodujo en el navegador: la recarga automática de Vite reenvió los eventos `A-0…A-99` ya plegados y `messagesSent` subió de 1200 a 1300.
   - Ahora `base.foldedIds` recuerda los ids estables (`episode-award:*`, `session-bonus:*`), con un tope de 2000.
2. **Premio ya plegado tratado como fallo.** `commitProgressEvent` devolvía `false` para un premio ya plegado, y el botón del episodio habría reintentado para siempre. Ahora cuenta como confirmado.
3. **Id de escritor inestable sin `sessionStorage`** (Node y entornos restringidos): cada llamada generaba un id nuevo. Ahora es estable por carga de página.

### 1.4 Pruebas adversariales (`scripts/check-same-account-tabs.mjs`, 27 escenarios)

Escenarios nuevos:
- escritura con caché obsoleta (P0: 30/60 sobreviven; ahora 60/60);
- **200 semillas** de intercalaciones aleatorias de 3 pestañas con cachés obsoletas, recuperaciones y cierres abruptos (0 guardados verificados perdidos);
- premio reenviado tras la compactación;
- limpieza de copias inactivas (se borran las redundantes y se conservan las únicas);
- modelo de aprendizaje con caché obsoleta (P0 perdía un ítem; ahora conserva ambos).

Se mantienen los 20 escenarios de P0: reset, A→B→A, cuota de Storage, reinicio, migración v1 y cuarentena.

### 1.5 Riesgo que sigue abierto (no declaro P0-1 «completamente resuelto»)

1. **Una pestaña que muere entre el cambio de estado y su efecto pasivo** (React escribe en el mismo ciclo) pierde ese único cambio no guardado. Es inherente a cualquier escritura posterior.
2. **Carrera de limpieza.** Una pestaña A puede borrar la copia de otra pestaña B, inactiva ≥ 2 min y redundante, justo cuando B escribe algo nuevo; si B se cierra en ese mismo instante, pierde ese evento. B repara su copia si sigue viva. La ventana requiere que coincidan las tres cosas.
3. **Otros almacenes siguen con clave compartida** y escritura verificada: `lc2-daily-session-v1`, `lc2-completed-missions`, `lc2-active-mission`, `lc2-memory-context-v1`, `lc2-mini-story-v1`. Bajo caché obsoleta pueden perder la última actualización de otra pestaña. **Riesgo abierto, sin prueba real todavía.** La evidencia de aprendizaje no vive ahí.
4. **Volver a una versión anterior** (código P0 u original) no lee las claves por escritor. Los datos siguen en el almacenamiento, pero esas versiones no los ven.
5. **Pestañas con versiones mezcladas** durante un despliegue: hay que recargar las pestañas antiguas.
6. **No se probó con una cuenta autenticada real** (no hay configuración de Supabase ni cuenta de QA). El navegador real ejercitó los módulos de almacenamiento con lease de invitado, que es el mismo código de escritura.

## 2. Defectos pedagógicos reproducidos (antes, con el código P0)

| # | Defecto | Evidencia «antes» |
|---|---|---|
| D1 | `Yesterday I goed to school.` no recibía corrección | Motor P0 con ja/ar: `mode=chat`, `correction=None`, sugerencia «Usa una frase simple…» en español |
| D2 | `She like music.` e `I eated a apple` sin corrección | Igual: ninguna corrección |
| D3 | El tutor respondía en español a todos los idiomas (backend y modo sin conexión) | Textos fijos en `local_engine.py` y `services/api.js` |
| D4 | Lingo y Chatto actuaban como tutores | `active_companion=lingo` → «Ejemplo: I like cheese…»; el prompt de OpenAI definía a Chatto como compañero de conversación |
| D5 | El modo sin conexión declaraba «Correcto» o «No hace falta corregir» sin evaluar nada | `getMockResponse` en `api.js` |
| D6 | Copiar la respuesta modelo visible contaba como evidencia independiente en episodios | `isIndependentEvidence(...)` → `true`; no existía ninguna comprobación de copia |
| D7 | Dos fallos seguidos con un método no cambiaban la estrategia | `chooseTeaching` → `null` con menos de 3 sondeos |
| D8 | Sin evidencia por habilidad ni incertidumbre | `skillEvidence` y `evidenceSummary` no existían |
| D9 | El gráfico de «Tú» eran las constantes `[45, 54, 62, …]` | `LanguageIdentity.jsx:178` |
| D10 | La etiqueta de nivel mostraba el CEFR crudo o `'B1'` inventado | `profile.level \|\| 'B1'` |
| D11 | «challenge» o «practice» dentro de cualquier frase secuestraban el turno | Coincidencia por subcadena |

## 3. Causas raíz

- **Corrección (D1, D2).** El motor local solo conocía 12 frases exactas, sin reglas lingüísticas generales.
- **Idioma (D3).** El motor no tenía catálogo de mensajes. El idioma se adivinaba con unas pocas palabras españolas en lugar de usar el código `native_language` que el cliente ya enviaba.
- **Identidad (D4).** Quedaban ramas heredadas del tiempo en que Lingo y Chatto eran compañeros de chat.
- **Evidencia (D5, D6).** No había distinción entre «no detecté errores» y «es correcto», ni entre producción propia y copia del modelo. Esto contradecía `learning-science-foundation.md` §3: «model answers shown first count as assistance».
- **Estrategia (D7, D8).** La política exigía 3 sondeos antes de actuar y no exponía la incertidumbre. La evidencia se agregaba por capacidad sin separar el canal.
- **Interfaz (D9, D10).** Eran datos de maqueta no sustituidos.

## 4. Decisiones arquitectónicas

1. **Una sola fuente de verdad.**
   - `teachingPolicy.js` sigue siendo el contrato de decisiones de enseñanza.
   - Su historial acotado (80 observaciones, idempotentes por id) ya registraba, por intento:
     - capacidad, método, instrucción (`concise` / `worked_example`), canal (`reading` / `listening`) y contexto;
     - si fue independiente, asistido o reintentado, cuándo, y la evidencia de escucha.
   - Esta fase **lo amplía**, sin estructuras paralelas:
     - `evidenceSummary` (incertidumbre);
     - `skillEvidence` (por habilidad, con recuperación diferida y transferencia);
     - la regla `switch_after_failure`.
2. **El modelo de aprendizaje no cambió de esquema.** Solo cambió dónde se guarda (claves por escritor), reutilizando su fusión existente.
3. **Backend: análisis honesto antes que respuesta.**
   - `ai/grammar_check.py` (reglas) produce hallazgos con nivel de confianza.
   - `local_engine.assess()` clasifica el mensaje: `error`, `no_issue_detected` (que **no** significa correcto), `insufficient`, `not_english` o `translation`.
   - La respuesta incluye `analysis`, una ampliación del contrato que el frontend ignora sin romperse.
4. **Idioma por código explícito.**
   - `ai/tutor_i18n.py` es un catálogo de 45 mensajes × 8 idiomas.
   - Un idioma no soportado recibe inglés con `localized=False`, nunca otro idioma disfrazado.
   - El material en inglés que se practica nunca se traduce.
5. **Lingua es la única tutora.** `ALLOWED_COMPANIONS = {"lingua"}`; el prompt de OpenAI se actualizó; las ramas de Lingo y Chatto se eliminaron.
6. **Memoria mínima.** La memoria de conversación guarda solo los ids de regla (`past_irregular`), nunca las palabras del alumno, para decidir la estrategia.

## 5. Métodos educativos implementados o mejorados

| Método | Dónde | Cómo se decide |
|---|---|---|
| Explicación breve | Chat (backend) | Primera vez que aparece una familia de error, o el nivel A1/A2 |
| Explicación detallada con contraste y contraejemplo (✗ / ✓) | Chat | El mismo tipo de error se repite en la ventana reciente, o el alumno prefiere `explanation_depth=detailed` |
| Recuperación guiada en un contexto nuevo (transferencia) | Chat | Tercera aparición: «sin mirar arriba», completar una frase **distinta** (`Last weekend we ____ (run)…`), con la respuesta esperada registrada |
| Reescritura con el modelo | Chat | Práctica de la forma corregida en los dos primeros niveles |
| Cambio de método tras dos fallos | `teachingPolicy.chooseTeaching` | Antes de que haya 3 sondeos: el método que falló en los dos últimos sondeos diferidos se reemplaza |
| Selección por recuperación diferida, con exploración | `teachingPolicy` (existente) | Con evidencia suficiente: mejor retención posterior; 1 de cada 5 decisiones explora |
| Aumento y retirada de apoyo | `scaffolding.js` (existente, verificado) | Errores y reintentos suben el apoyo; éxitos independientes lo bajan |
| Repaso espaciado | `learnerModel` / `retentionProfile` (existente, verificado) | Escalera de 2/4/8/16/30 días; la prioridad sube cuando falla un sondeo |

## 6. Personalización basada en evidencia

- **Separada por habilidad** (`skillEvidence`):
  - `written` y `listening` se calculan por separado, solo con primeros intentos independientes, un sondeo por día de aprendizaje;
  - `delayed` cuenta los éxitos en una sesión posterior;
  - `transfer` cuenta los éxitos en un contexto nunca usado antes para esa capacidad;
  - `speaking` y `pronunciation` = `not_assessed` siempre, porque la app no tiene micrófono.
- **Incertidumbre** (`evidenceSummary`):
  - resumen Beta(1+s, 1+f) con una banda de ±2 desviaciones estándar;
  - con menos de 3 observaciones = `insufficient`; con la banda > 0,5 = `uncertain`.
  - Es una **heurística de producto**, no una estimación psicométrica validada.
- **Reversible.** Todas las decisiones usan una ventana reciente: la estrategia del chat usa las últimas 8 interacciones, y la política usa los últimos 12 sondeos y 80 observaciones. La batería comprueba que la hipótesis se invierte cuando los resultados recientes la contradicen.
- **Preferencias frente a eficacia.** `explanation_depth` es un punto de partida, no una clasificación: la repetición del error cambia la estrategia igual. No hay estilos de aprendizaje («visual», «auditivo»).
- **Intereses.** La mezcla existente se verificó, sin cambiarla:
  - 67 % intereses elegidos, 20 % relacionados, 10 % exploración, 3 % neutros, con enfriamiento;
  - son constantes de producto no medidas, documentadas en `topicSelection.js`;
  - la batería comprueba que los temas siguen a los intereses nuevos, que los antiguos no se quedan pegados y que los temas ajenos siguen apareciendo;
  - los intereses no cambian objetivos, umbrales ni repasos.

## 7. Mejoras de explicación y corrección

**Reglas generales** (`grammar_check.py`):
- **Pasado irregular regularizado** (confianza alta): tabla de 60 verbos (136 formas erróneas generadas: `+ed`, `+d`, consonante doble, `-ied`, `went+ed`). Excluye palabras reales como `seed`, `singed`, `putted`, `costed`.
- **Marcador de pasado** (`yesterday`, `last week`, `two days ago`) con verbo en presente tras el sujeto (confianza media). Lo ignora tras un auxiliar (`didn't go`).
- **Concordancia** `he/she/it + verbo base`. Lo ignora tras `does`/`did` y cuando `it` es objeto (`let it go`).
- **`a/an` por el sonido.** Contempla excepciones como `a university` o `an hour`.
- **Las 12 frases fijas anteriores** se mantienen con su regla explicada.

**Taxonomía de la respuesta**, según tu lista:

| Caso | Tratamiento |
|---|---|
| Error real | `error`, con hallazgos y confianza |
| Correcto o variante natural | `no_issue_detected` con confianza `low`: no se declara correcto (30 variantes probadas) |
| Respuesta ambigua o falta de información | `insufficient` |
| Respuesta fuera del idioma objetivo | `not_english`, con invitación a intentarlo en inglés en el idioma del alumno |
| Respuesta asistida o copiada del modelo visible | `copiesShownModel` en episodios: normaliza mayúsculas, puntuación y apóstrofos, y detecta el modelo incluido completo. Se registra como asistida |
| Respuesta parcialmente válida o fuera del objetivo | En episodios ya lo resuelve el evaluador existente (`targetEvidence`, `completedObjective`); no se tocó |

**Contrato híbrido.** Cuando el motor local no tiene una regla, no inventa comprensión. Solo el evaluador remoto existente, con un proveedor autorizado, puede ir más allá.

## 8. Compatibilidad con los 8 idiomas auxiliares

- **Backend.** 45 mensajes en en/es/pt/fr/it/de/ja/ar. Una prueba exige los 8 idiomas y los mismos marcadores en cada mensaje.
- **Frontend.** 13 claves nuevas en los 8 idiomas: aviso sin conexión, avisos de memoria, etiquetas de acción y gráfico de evidencia. `check:i18n` = 100 % y el lint de textos fijos pasa.
- **Árabe.** El catálogo usa marcas de dirección donde mezcla `-ed`; el material en inglés va entre comillas. La dirección RTL la sigue aplicando la interfaz existente.
- **Revisión pendiente.** Los textos los escribí yo para este catálogo y **no han sido revisados por docentes nativos**; está documentado en el propio archivo.

## 9. Pruebas antes y después

| Suite | Antes | Después |
|---|---|---|
| `check-same-account-tabs.mjs` | P0: 21/21 (no cubría la caché obsoleta) | **27/27** (6 escenarios adversariales nuevos) |
| Escenarios clave contra el código P0 | caché obsoleta 30/60; modelo pierde un ítem | 60/60; conserva ambos |
| Navegador real, dos pestañas | **300 de 600 perdidos** (dos corridas) | **0 perdidos** (600 y 800) |
| `check-teaching-intelligence.mjs` (nuevo) | — (las funciones no existían) | **15/15**: 12 perfiles más incertidumbre, aislamiento por cuenta y puertas de nivel |
| `test_tutor_intelligence.py` (nuevo) | Motor P0: sin corrección en `goed`, `She like`, `eated`, `a apple`; español para ja/ar | **126/126** |
| pytest total | 469 (P0) | **596** |

**Los 12 escenarios pedidos, y dónde se cubren:**
1. Principiante con apoyo alto: frontend 1, y el backend A1 da explicación breve.
2. Progreso rápido con evidencia `supported`: frontend 2.
3. Errores reiterados: el apoyo vuelve y el método cambia (frontend 3); escalada breve → contraste → recuperación (backend).
4. Entiende con ayuda pero olvida: frontend 4.
5. Retiene y transfiere: frontend 5.
6. Fortalezas por habilidad, sin speaking inferido: frontend 6.
7. Cambio de intereses, sin temas bloqueados: frontend 7.
8. Copia el modelo: frontend 8 y backend «copiar la corrección».
9. Variante natural: frontend 9 y backend con 30 frases válidas.
10. Cambio de idioma: backend (cambio a mitad de sesión, 8 idiomas) y frontend 10 (la evidencia no depende del idioma).
11. Respuestas ambiguas: frontend 11 y backend `insufficient`.
12. Resultados recientes que contradicen hipótesis, en órdenes barajados con 4 semillas: frontend 12.

**Variantes para detectar sobreajuste:**
- 4 capacidades y 4 semillas;
- 20 verbos × 3 marcos de frase;
- 30 frases válidas;
- 8 idiomas;
- 5 valores de compañero.

**Pruebas existentes ajustadas** (sin borrar aserciones):
- `check-same-account-tabs.mjs`: selectores de claves para el esquema por escritor; el reinicio exige ahora «2 copias, nunca una clave compartida».
- `check-session-surfaces.mjs`: se inyectan los helpers nuevos (`ownKey`, `collectIdleCopies`, funciones del ledger, `translate`) en los cuerpos extraídos. Los modos y las expectativas no cambian.
- `check-failed-save-and-reconcile-learner-model.mjs`: la intercepción de escrituras del modelo usa `includes` en lugar de `endsWith` (clave por escritor). Sigue forzando los mismos fallos.
- `tests/test_api.py`:
  - el contrato añade `analysis`;
  - la prueba de significado envía `native_language: "es"` (antes se daba español a todos) y se añadió la contraprueba en japonés;
  - la prueba de «Lingo responde vocabulario» se reemplazó por «Lingua responde siempre, sea cual sea el compañero», porque exigía lo que el contrato prohíbe.
- **Regresiones reales detectadas por pruebas existentes y corregidas en el código, no en la prueba:**
  - `check-teaching-policy` (mi regla de cambio anulaba la exploración);
  - `check-graduation` y `check-activity-signals` (id de escritor inestable).

## 10. Resultados del QA

**Dos ciclos completos consecutivos y limpios** (ciclos 3 y 4) sobre el código final, sin cambios entre ellos y después de la última corrección. Usan el orden de CI, `LINGUACHAT_PROVIDER=local` y `OPENAI_ENABLED=false`.

| Control | Ciclo 3 | Ciclo 4 |
|---|---|---|
| `check:all` (por código de salida, script a script) | 83/87 | 83/87 |
| …los 4 fallos de entorno Windows (registrados aparte, ver abajo) | 4 | 4 |
| `npm run build` | PASS | PASS |
| `check:i18n` (8 locales al 100 %) | PASS | PASS |
| `check-pre-a1-freeze` (copia sin la sección `git`) | PASS (7 grupos) | PASS |
| `check-a1-arc6-arc7-structure` / `-journeys` (copias con `pathToFileURL`) | PASS / PASS (95) | PASS / PASS |
| `check-linguachat-cloud-scope --self-test` | PASS | PASS |
| Backend `compileall` | PASS | PASS |
| Backend `pytest` | **596 passed** | **596 passed** |
| Plantillas de correo | PASS | PASS |

**Los 4 fallos de entorno** (idénticos a la auditoría y a P0; no son regresiones):
1. `check-pre-a1-freeze`: necesita `git`.
2. `check-merge-blocker-gate`: necesita `jq`.
3. `check-a1-arc6-arc7-structure`: ruta `C:\` sin `pathToFileURL`.
4. `check-a1-arc6-arc7-journeys`: la misma causa.

**Defecto previo de bundle**, registrado aparte: `check-bundle-boundaries` después del build da 869,2 kB frente a un presupuesto de 850 kB (ver §11).

**Otros controles:**
- **Guardas:** `CLOUD_PREFERENCES_RELEASED = false`; A1–C2 con `available:false` (7 niveles revisados); sin APIs de grabación; `speechSynthesis` solo en `speech.js`; sin rutas de tutor Lingo; dependencias y lockfile sin cambios.
- **Navegador**, con el build nuevo:
  - la entrada a 390 px y 1440 px no tiene desbordamiento;
  - una carga limpia tiene 0 recursos fallidos;
  - el 403 de la consola era de la página anterior del banco de pruebas.
- **Alcance de lo visual.** Las pantallas internas (Hoy, Chats, Tú, configuración) siguen **sin verificarse visualmente**, porque requieren iniciar sesión.

## 11. Rendimiento y tamaño del bundle

| Build | Bloque inicial | Código de app (`check-curriculum-loading`, tope 290 kB) |
|---|---|---|
| Original `main@086323c` | 859,3 kB (879 887 B) | — |
| Final de P0 | 870,9 kB | 225,4 kB |
| **Final de P1** | **869,2 kB (890 052 B)** | **222,9 kB** |

- P1 reduce 1,7 kB frente a P0: eliminar el tutor falso del modo sin conexión compensa el código nuevo.
- El presupuesto de 850 kB ya se superaba antes de P0 (defecto previo, oculto en CI porque `check:all` se ejecuta antes de `build`). No se relajó.
- Coste de ejecución:
  - cada guardado lee y une N copias, una por pestaña abierta;
  - la limpieza mantiene N pequeño;
  - el modelo de aprendizaje se une por copia al cargar.
- No se midió el impacto en dispositivos lentos.

## 12. Archivos modificados en esta fase (34)

**Frontend:**
```
A src/services/writerKeys.js
M src/services/localProgress.js         (claves por escritor, unión de copias, limpieza)
M src/services/progressLedger.js        (foldedIds)
M src/auth/localLease.js                (keys() de solo lectura, validado por lease)
M src/learning/engine/learnerModel.js   (carga y guardado por escritor; misma fusión)
M src/learning/engine/teachingPolicy.js (evidenceSummary, switch_after_failure, skillEvidence)
M src/learning/engine/scaffolding.js    (copiesShownModel)
M src/components/episode/EpisodeShell.jsx    (copia del modelo = asistida)
M src/components/identity/LanguageIdentity.jsx (gráfico por evidencia; etiqueta de nivel real)
M src/components/chat/LearningAction.jsx (etiquetas localizadas)
M src/context/AppContext.jsx            (listener por escritor, reparación de la copia propia, aviso de memoria localizado)
M src/services/api.js                   (sin tutor falso en español; aviso honesto localizado)
M src/i18n/translations.js, src/i18n/locales/{es,pt,fr,it,de,ja,ar}.js (13 claves)
A scripts/check-teaching-intelligence.mjs
M scripts/check-same-account-tabs.mjs, scripts/check-session-surfaces.mjs,
  scripts/check-failed-save-and-reconcile-learner-model.mjs
M package.json                          (check:all + atajo check:teaching-intelligence)
```

**Backend:**
```
A ai/grammar_check.py
A ai/tutor_i18n.py
M ai/local_engine.py   (análisis honesto, estrategia, idioma; sin Lingo ni Chatto)
M ai/openai_tutor.py   (Lingua única; explicaciones en el idioma del alumno)
M ai/schemas.py        (campo analysis)
M app/routes/chat.py   (solo Lingua; recent_error_types)
M app/services/memory.py (ids de regla, sin texto)
A tests/test_tutor_intelligence.py
M tests/test_api.py
```

**Nota de proceso.** Siete archivos del backend que edité con Python quedaron por error con finales de línea CRLF (el modo texto de Windows). Los detecté al revisar el diff, los devolví a LF como los originales, y los dos ciclos finales se ejecutaron después.

## 13. Limitaciones del motor determinista

- Detecta **familias de errores concretas**. No detecta:
  - elección de palabras, colocaciones o preposiciones;
  - matices de tiempo verbal (*present perfect* frente a pasado);
  - orden de palabras general;
  - errores de significado;
  - registro.
- No genera explicaciones para errores nuevos: solo puede usar las plantillas del catálogo.
- La continuidad de la conversación es limitada: preguntas de seguimiento genéricas y temas por plantilla.
- La traducción local solo cubre unas 40 palabras españolas. Para otros idiomas lo dice honestamente.
- El reconocimiento de «escribió en su idioma» usa palabras funcionales o la escritura (ja/ar). Puede fallar con mensajes mezclados.
- La escalada de estrategia usa la memoria del servidor, que vive por instancia y sin persistencia. En Vercel puede perder la ventana entre peticiones (ya documentado en la auditoría, P2-4).
- `no_issue_detected` nunca equivale a «correcto»: el motor no puede saberlo.

## 14. Qué requerirá un proveedor de IA (autorizado por escrito)

- Evaluar respuestas abiertas sin regla aplicable: el contrato híbrido ya tiene la ruta remota (`/learning/evaluate`) y la incertidumbre explícita.
- Explicar errores fuera del catálogo, con la explicación sujeta a las mismas reglas de evidencia: una explicación no es aprendizaje demostrado.
- Conversación natural con continuidad real, siempre detrás del mismo contrato: Lingua como única tutora, idioma por código y sin conceder dominio desde el proveedor.
- Comprensión oral, speaking y pronunciación, que además requieren audio y micrófono, hoy **no autorizados** por CLAUDE.md.

## 15. Qué falta validar con estudiantes reales

Las pruebas sintéticas demuestran **consistencia interna, no eficacia**. Para un piloto, conforme a `learning-science-foundation.md` §11 (pre-test → práctica → post-test inmediato → post-test diferido, con ejemplos no vistos):

1. **Escalada breve → contraste → recuperación.**
   - ¿Reduce la recurrencia del mismo tipo de error frente a corregir siempre igual?
   - Falsación: si la tasa de recurrencia no baja o la frustración sube.
   - La base (§6, Lyster & Saito 2010) sugiere que los *prompts* superan a la reformulación. Mi diseño empieza con la reformulación corregida; **probar empezar con un *prompt*** es una hipótesis abierta.
2. **Detección de copia.**
   - ¿Hay falsos positivos cuando el alumno escribe por sí mismo una frase idéntica al modelo?
   - Falsación: alumnos que superan las recuperaciones diferidas de ítems marcados como copiados.
3. **Marcos de transferencia.** Medir la naturalidad y la dificultad de las frases nuevas.
4. **Constantes de producto** (mezcla de temas, tope de 3 sondeos, banda de incertidumbre, ventana de 8 interacciones). Ninguna está medida.
5. **Textos de los 8 idiomas.** Necesitan revisión por docentes nativos.

**Regla de investigación de CLAUDE.md**, para los cambios pedagógicos de esta fase:
- **Problema del alumno.** Dominio falso por copiar el modelo; explicaciones que no funcionan y se repiten igual; correcciones inexistentes o en otro idioma.
- **Evidencia de LinguaChat.** D1–D10, reproducidos con el código P0 (§2).
- **Principio.** `learning-science-foundation.md`:
  - §3: los modelos mostrados cuentan como asistencia; la repetición diferida es recuperación real;
  - §6: hacer que el alumno repare;
  - §11: medir el éxito sin ayuda, la recuperación diferida, la transferencia y la recurrencia por tipo.
- **Qué lo refutaría.** Los criterios de los puntos 1 y 2.
- **Medición independiente de los clics.** `skillEvidence` (independiente, diferido, transferido) y la recurrencia por tipo de error, nunca la finalización.

## 16. Guía de continuidad

**Reproducir:**
```
cd linguachat-frontend
node scripts/check-same-account-tabs.mjs
node scripts/check-teaching-intelligence.mjs
node scripts/check-profile-recovery.mjs
cd ../linguachat-backend
.venv/Scripts/python -m pytest -q tests/test_tutor_intelligence.py
```
El ciclo completo es el mismo que en P0 §11. En Windows, `check:all` se cuenta script a script.

**Siguientes pasos recomendados:**
1. Aplicar el esquema por escritor a `lc2-daily-session-v1`, misiones y memoria (riesgo abierto §1.5.3), con pruebas adversariales equivalentes.
2. Mostrar `skillEvidence` en «Tú» o en Palabras, con lenguaje honesto («todavía no evaluado»). Requiere diseño y no está hecho.
3. Probar un piloto pequeño con los criterios de §15 antes de afinar las constantes.
4. Dejar de bloquear la verificación visual: una cuenta de QA en un entorno de prueba autorizado, o un modo de QA solo para desarrollo (decisión pendiente desde la auditoría).
5. Quedan pendientes los P1 de la auditoría que no tocó esta fase:
   - contraste de la llamada en modo oscuro;
   - «Notas de Lingua»;
   - IME japonés;
   - `lang`/`dir` en las burbujas;
   - el bundle.
