# LinguaChat 1.0 — Fase 3: integridad educativa, personalización visible y calidad funcional (2026-10-31)

**Base de partida:**
- Estado al cerrar P1 (`docs/audits/2026-10-31-p1-teaching-intelligence.md`), sobre `main@086323c` + P0.
- Los informes anteriores (auditoría, P0, P1) y sus `.diff` no se modificaron.

**Diff de esta fase:**
- `docs/audits/2026-10-31-p2-product-hardening.diff`, calculado contra la copia `_snapshot-p1`: 69 archivos, unos 600 kB.
- La mayor parte del tamaño son las 2 841 líneas de copia B1–C2 movidas tal cual de `translations.js` a `closedLevelsEn.js`.
- No incluye secretos, archivos `.env`, copias de seguridad, `node_modules`, `dist`, `.venv` ni cachés.

**Copia de seguridad previa a editar:**
- `C:\Users\<usuario>\Music\LinguaChat-main\_snapshot-p1\` guarda el estado completo de P1.
- `_snapshot-p0\` y `_originals-086323c\` siguen intactos.

**Lo que no se hizo:**
- No hubo `git init`, clone, push, merge, despliegue ni publicación.
- No se tocó Supabase, Vercel ni ningún proveedor de IA.
- No se usó ninguna API paga y no se añadieron dependencias (el lockfile no cambió).
- `CLOUD_PREFERENCES_RELEASED=false`.
- Pre-A1 está congelado y A1–C2 siguen cerrados.
- Lingua sigue siendo la única tutora y Chatto la mascota.
- Siguen los ocho idiomas auxiliares.
- No hubo cambios de currículo ni servicios multimedia nuevos (Cloudflare, Resend, Gemini Live y LiveKit no se tocaron).

**Autenticación:**
- **No se probó autenticación real.**
- Las pantallas de acceso se vieron en un banco visual con contexto sintético y errores simulados con la forma de Supabase.
- Ninguna cuenta real, sesión ni token intervino.

---

## Resumen para el propietario

1. **Ya no se pierde información del estudiante en los cinco stores restantes**, y apareció (y se corrigió) una pérdida que P1 tampoco cubría.
   - En dos pestañas reales con 600 turnos cada una, P1 perdía 101 de 1 200 turnos.
   - Con P2: **0 de 1 200**, con y sin el listener de reparación.
   - Las recompensas antiguas ya no se pueden volver a pagar cuando su id sale de la ventana retenida, y eso sin subir ningún límite.
2. **La pantalla "Tú" muestra el aprendizaje real**, siempre con conteos y palabras, nunca porcentajes:
   - qué practica y qué ya usa por su cuenta;
   - qué toca repasar;
   - qué demostró otro día, con escritura y escucha por separado;
   - que hablar y pronunciación **no se evalúan**;
   - qué mejoró con evidencia;
   - qué sigue;
   - qué significa usar ayuda.
3. **Errores visibles corregidos:**
   - Notas de Lingua en móvil era un botón que no hacía nada.
   - La llamada en modo oscuro tenía texto claro sobre fondo claro (contraste 1:1).
   - El IME japonés enviaba la palabra a medio componer.
   - Había mensajes técnicos en inglés en todos los idiomas, incluidos nombres de variables de configuración.
   - El botón "Pruébalo" no hacía nada.
   - Había un porcentaje de "confianza" inventado que subía cuando corregían al estudiante.
4. **Las pruebas corren completas en Windows y sin `.git`.**
   - `check:all` pasa de 86/91 con 4 fallos ambientales a **90/90**.
   - La única verificación que necesita bash+jq (el gate de merge de GitHub) ahora es un paso CI propio.
5. **El presupuesto del bundle se aplica por fin en CI** (antes se saltaba en silencio). La entrada bajó de **877,3 kB a 713,0 kB (−18,7 %)** sin quitar funciones y sin tocar el presupuesto de 850 kB.

---

## 1. Estado de los stores

| Store | Defecto reproducido (P1) | Estrategia P2 | Prueba |
|---|---|---|---|
| `lc2-local-progress` | Con más de 500 eventos, la compactación por tamaño cortaba eventos de hace segundos; los de otra pestaña con caché obsoleta se perdían (101/1 200 en Chromium real, también con el código P1) | El pliegue por tamaño nunca corta dentro de `LEDGER_SETTLE_MS` = 10 min | `check-same-account-tabs` "past the size cap…" (falla sin el arreglo y pasa con él), más el arnés real |
| `lc2-daily-session-v1` | Un save desde caché obsoleta retrocedía el avance de la sesión y podía repetir el bono diario | `mergeSessions`: misma sesión → la más avanzada (`awarded` se combina con OR); sesiones distintas → la más reciente. Clave por escritor, lectura fusionada | `check-store-concurrency` (sesión sin regresión, bono una vez) |
| `lc2-completed-missions` | El historial de una pestaña sobrescribía el de la otra | Unión por `missionId:startedAt` sobre todas las copias, más reciente primero, máx. 50; una copia ilegible falla cerrada | `check-store-concurrency` (historial de dos pestañas) |
| `lc2-active-mission` | La misma recompensa de misión podía pagarse dos veces | Ids deterministas `mission:<id>:<startedAt>:<paso>` → recompensas idempotentes | `check-store-concurrency` (paga una vez, dos veces) |
| `lc2-memory-context-v1` | Se perdían descartes de temas hechos en otra pestaña | `mergeMemoryContexts` al guardar: unión de descartes, temas recientes más nuevos por id | `check-store-concurrency` |
| `lc2-mini-story-v1` | Una pestaña rebobinaba la historia de otra | `saveStoryState` guarda el turno más avanzado para la misma semilla | `check-store-concurrency` |

Con el código P1, `check-store-concurrency` falla en 6 de 8 escenarios; con P2 pasa 8 de 8.

## 2. Problemas reproducidos (antes de corregir)

- **Los cinco stores de la tabla:** reproducidos con vistas obsoletas deterministas (`staleView`) sobre los módulos reales.
- **Limpieza por inactividad (P1):** borraba copias de pestañas inactivas pero abiertas. Se reprodujo con un gestor de locks controlado por la prueba.
- **Ventana `foldedIds` (P1):** su corte alfabético expulsaba los `episode-award` antes que los bonos diarios. Tras años de bonos, un premio de episodio se volvía a pagar.
- **Compactación por tamaño:** perdió 101/1 200 turnos en Chromium real, tanto con P2 antes del arreglo como con la copia `_snapshot-p1`.
- **Notas de Lingua en móvil:** `setMobileSheet('notes')` cambiaba un estado que nadie dibujaba.
- **Llamada en modo oscuro:** `background: var(--ink)` vale `#F1EEE8` en oscuro y el texto también era `#F1EEE8` (contraste 1:1).
- **IME:** los seis manejadores de Enter usaban `e.key === 'Enter'`. El chat, las respuestas y hasta el campo de nombre se enviaban al confirmar kana o kanji.
- **Errores de acceso:** se mostraba `err.message` tal cual, por ejemplo `VITE_SUPABASE_URL must be an allowed HTTPS Supabase URL.` o `Invalid login credentials`, en inglés en los ocho idiomas.
- **CI:** el presupuesto de bundle y las aserciones de build de `check-curriculum-loading` se saltaban en silencio, porque `check:all` corre antes de `npm run build` (SKIPPED sin `dist/`).
- **Portabilidad:**
  - `import(join(...))` con rutas `C:\`;
  - `new URL(...).pathname` en los cuatro `run-all.mjs` de foundry;
  - `git ls-files` sin checkout;
  - `jq` dentro de `check:all`.

## 3. Correcciones

**Integridad (Bloque A):**
- Las seis estrategias de la tabla de la sección 1.
- `foldedIds` organizado por familias con pisos (`foldedFloors`):
  - los premios de episodio se recuerdan siempre;
  - bonos y misiones guardan 400 ids más un piso temporal.
- Ningún id que salga de la ventana puede volver a pagarse. Los datos v1, P0 y P1 se migran solos: la ventana de 2 000 ids de P1 se poda a pisos.
- **Limpieza segura de copias por escritor.** Cada página mantiene un Web Lock `lc2-writer:<id>`. Otra pestaña borra una copia solo si se cumplen las tres condiciones:
  - nadie tiene su lock;
  - todo su contenido ya está en la copia propia verificada;
  - los bytes no cambiaron al releer.
- Sin Web Locks no se borra nada: se conservan los datos y se acepta el crecimiento.
- `LEDGER_SETTLE_MS` en la compactación por tamaño (sección 1).

**UI (Bloque C):**
- `NotesSheet` (hoja inferior modal, solo a petición; no es un panel global).
- Tokens `--stage` y `--on-stage*` para la llamada.
- `isSubmitEnter` para IME.
- `authErrorKey` y códigos de error del proveedor.
- `lang`/`dir`.
- "Pruébalo" funcional.
- Medidor de confianza sustituido por evidencia (sección 7).

**Técnico (Bloque D):**
- `pathToFileURL`/`fileURLToPath`.
- Escaneo del árbol de trabajo en el guardián de alcance cloud cuando no hay git.
- `check:github-integration` como paso CI propio.
- Checks de bundle que construyen su propio build.
- Copia en inglés de B1–C2 movida a un chunk perezoso.

## 4. Riesgos abiertos

- **Cursor de misión activa:** con caché obsoleta puede retroceder un paso visualmente. Es solo UX: las recompensas son idempotentes y nunca se pagan dos veces.
- **Contexto de memoria e historia corta:** usan fusión al guardar. Un residuo con caché obsoleta es solo UX: un descarte puede reaparecer una vez.
- **Inicio de página:** antes de registrar el lock, una copia podría parecer "cerrada". Lo mitigan la relectura de bytes y la reparación por listener (probado).
- **Sin Web Locks** (navegadores muy antiguos) no hay limpieza: las copias crecen, aunque acotadas por la compactación.
- **Volver a código P0/P1** no lee las claves por escritor ni los pisos.
- **Bases divergentes:** dos copias cuyas bases plegaron conjuntos distintos no se suman. Con P2 solo podría ocurrir si una pestaña ve un evento más de 10 minutos tarde, es decir, si un renderer queda colgado ese tiempo. Más de 7 días tarde se rechaza a propósito (evento retroactivo).
- **Reloj atrasado:** si el reloj del dispositivo se atrasa más allá de un piso, podría rechazar recompensas nuevas legítimas hasta que el reloj avance.
- **Ledger temporalmente más grande:** puede superar 500 eventos durante 10 minutos (≈150 B/evento).
- **Contraste del botón primario:** en oscuro, `.btn-primary` (#D98A66 con #FFF8F4) mide ≈2,5:1. Es un token del sistema visual congelado, así que no se rediseñó (ver sección 16).
- **Archivo de conversaciones:**
  - un estudiante sin sesiones ve conversaciones de ejemplo (`MOCK_ARCHIVE`);
  - se muestran "puntos de confianza" del mismo métrico inventado, con un `9` fijo cuando no hay datos;
  - queda fuera del alcance listado; es lo primero de la sección 16.
- **Misiones:** siguen con textos de pista en español fijo (`feedbackHint`, «Casi. Mira esta pista…»), contenido heredado documentado. Se localizó la celebración de misión completada.

## 5. Pruebas de concurrencia

**Deterministas (Node, módulos reales):**
- **`check-store-concurrency`: 8/8.** Con P1, 6 de 8 fallan.
- **`check-same-account-tabs`: 36/36.**
  - Sin pérdidas:
    - 200 intercalaciones aleatorias de 3 pestañas;
    - años de bonos diarios sin repago (base < 60 kB);
    - cuota casi llena;
    - eventos retroactivos y plegados;
    - restauración de datos v1, P0 y P1.
  - Recolección por locks:
    - pestaña cerrada → se borra;
    - pestaña abierta → nunca;
    - copia única → se conserva;
    - carrera en la relectura;
    - reparación por listener;
    - sin locks → nada se borra;
    - modelo de aprendizaje.
  - Nuevo: el límite de tamaño con caché obsoleta.
- Prueba de mutación:
  - sin `LEDGER_SETTLE_MS`, el escenario nuevo falla («every verified turn of both tabs survives»);
  - con él, pasa.

**Navegador real (Chromium del panel; dos pestañas que giran en bucle síncrono y escriben a la vez):**

| Código | Turnos por pestaña | Listener de reparación | Perdidos |
|---|---|---|---|
| `_snapshot-p1` | 600 | sí | **101 / 1 200** |
| P2 antes del arreglo | 600 | sí | **101 / 1 200** |
| P2 final | 600 | sí | **0 / 1 200** |
| P2 final | 600 | no (pestaña cerrada tras escribir) | **0 / 1 200** |

En P1 solo se había medido con 300 y 400 turnos por pestaña. El límite de 500 eventos no se alcanzaba, por eso el defecto no apareció.

## 6. Integración de la personalización (ciclo de 8 pasos)

`check-learning-loop` sigue a un estudiante durante días con los módulos reales:

1. **Error.** Un `missing_copula` queda registrado en `recurringErrors`.
2. **Habilidad.** Un solo fallo todavía no es patrón, así que no hay bloque. A la segunda vez, `buildSessionPlan` inserta un `targeted_retry` dirigido a la capacidad que falló.
3. **Explicación según nivel.** La primera vez es `concise`.
4. **Ayuda.** Un acierto con ayuda cuenta como práctica: 0 evidencias y nunca `can_use`.
5. **Recuperación independiente.** Dos recuperaciones posteriores fallidas con el mismo método llevan a `chooseTeaching` → `switch_after_failure` → `worked_example`.
6. **Recuperación posterior.** Acierta solo, otro día y en un contexto nuevo (`travel`): cuenta como transferencia.
7. **Recuerdo y transferencia.**
   - El resumen de Tú marca **1 mejora con evidencia**.
   - La escritura queda en `uncertain`, nunca en `holding` con tan poco.
   - Hablar y pronunciación quedan en `not_assessed`.
8. **Ajuste.**
   - Con dos usos independientes en días distintos, el ítem pasa a `can_use`.
   - Cuatro sondeos, dos de ellos fallidos, siguen siendo `uncertain`.
   - La readiness **no** declara el nivel terminado.

Otras comprobaciones:
- 30 días de respuestas con ayuda dan 0 evidencia.
- 10 respuestas en la misma sesión cuentan como una sola ocasión.
- Leer bien no dice nada de escuchar.
- Una prueba de mutación confirma que se detecta contar como "mejora" algo que nunca falló.

Backend (`test_full_learning_flow_irregular_past`):
1. `goed` → `brief_explanation`.
2. `eated` → `contrast_example`.
3. `buyed` → `guided_retrieval`, con un hueco en una oración nueva.
4. Una respuesta correcta propia devuelve `no_issue_detected` con confianza baja, nunca maestría.
5. Más tarde, en otro contexto, sigue sin declarar maestría; una recaída vuelve a empezar ligera.

**Chat → modelo del estudiante (dependencia identificada, no conectada):**
- Las reglas del chat (`past_irregular`, `third_person`, `article`, `past_marker`) pertenecen a capacidades A1+, que están cerradas.
- No tienen mapeo en `ERROR_KIND` de Pre-A1.
- Sumarlas a `recurringErrors` alteraría el andamiaje global (`scaffolding.js` suma todos los errores recurrentes) sin una actividad que las practique.
- El ciclo del chat vive completo en el backend: memoria corta de ids de regla y escalada de estrategia.
- Conectarlo exige primero una actividad A1 abierta (decisión de currículo, fuera de esta fase).

**Intereses:**
- En 60 días con `music`+`travel`, sus intereses son mayoría pero nunca todos los días; siguen apareciendo temas nuevos o neutros.
- Al cambiar a `cooking`, el nuevo gusto toma efecto y el viejo deja de dominar.
- Un tema descartado no se elige.
- El catálogo no contiene categorías sensibles: salud, religión, política, sexualidad, etnia, discapacidad o dinero.

## 7. Cambios educativos visibles

**Tarjeta "Tu aprendizaje" en Tú** (`LearningSummaryCard` + `learnerSummary`):

| Sección | Qué dice | De dónde sale |
|---|---|---|
| Lo que estás practicando | Expresiones que ya usas por tu cuenta y las que están en práctica; lo que está listo para repasar | `learningState`, `getDueReviews` |
| Lo que has demostrado otros días | Lectura y escritura / comprensión auditiva con cuatro estados honestos («aún no hay pruebas suficientes», «va tomando forma», «se mantiene con el tiempo», «conviene practicarlo más») y el número de respuestas propias; «Hablar y pronunciación: no se evalúa — LinguaChat no usa tu micrófono» | Sondeos de recuperación de `teachingPolicy` + banda Beta de `evidenceSummary` |
| Mejoras con evidencia | Algo que fallabas y luego hiciste solo, otro día | Sondeo fallido seguido de un sondeo exitoso |
| Lo que sigue | Habilidades para reforzar, el siguiente objetivo y las habilidades sin empezar | `derivePreA1Readiness` / `readinessFocus` |
| La ayuda y lo que significa | Respuestas propias frente a respuestas con ayuda en 30 días; la ayuda cuenta como práctica | `teachingHistory` |

- Estado vacío: «Aún no hay nada que mostrar…».
- Ningún porcentaje.
- Todo traducido a los ocho idiomas, sin plurales frágiles (formato «etiqueta: número»).

**Notas de Lingua:**
- El «Puntaje de confianza N %» se calculaba como `min(95, 45 + 2·mensajes + correcciones)`: subía cuando corregían al estudiante.
- Ahora se muestra «Respuestas por tu cuenta, por semana», con el mismo criterio que Tú y un estado vacío honesto.

## 8. Correcciones de UI

- **Notas de Lingua (móvil):**
  - `NotesSheet` es un diálogo modal (`aria-modal`) con etiqueta.
  - Al abrir, el foco va a «Cerrar».
  - Escape, el fondo o el botón la cierran, y el foco vuelve a quien la abrió.
  - Es la misma `TutorNotes`, solo a petición.
  - Invariantes en `check-visual-identity`.
- **Llamada en modo oscuro:**
  - El escenario es nocturno en ambos temas.
  - Contraste calculado (WCAG) ≥ 4,5:1 para `--on-stage` y `--on-stage-muted` en claro y oscuro, verificado automáticamente; una prueba de mutación lo detecta.
  - Los controles deshabilitados siguen con `disabled` + `aria-disabled` + nombre accesible «… — Próximamente», con borde discontinuo y etiqueta legible (antes estaban al 70 % de opacidad).
  - No hay micrófono, WebRTC ni llamadas reales; el invariante «no media API» sigue verde.
- **IME:** `isSubmitEnter` ignora `isComposing` y `keyCode 229` (Safari). Se aplicó al chat, al reproductor de sesión, a los episodios, a la mini-historia, al nombre en Tú y al onboarding heredado.
- **"Pruébalo" (LearningAction):** antes no hacía nada; ahora lleva al compositor. El texto blanco sobre `--info` (2,1:1 en oscuro) pasó a `--surface`.
- **Celebración de misión:** «Mision completada…» estaba fijo en español; ahora es una clave i18n.

## 9. Idiomas y accesibilidad

- **Inglés dentro de RTL:**
  - las burbujas del estudiante y de Lingua usan `dir="auto"` (el primer carácter fuerte decide);
  - las opciones de misión y las de LearningAction llevan `lang="en" dir="ltr"`;
  - la transcripción de escucha lleva `dir="ltr"`;
  - el prompt de acción usa `dir="auto"`, porque mezcla instrucción en el idioma del estudiante con material en inglés.
- **Errores visibles:**
  - `authErrorKey` traduce los códigos de Supabase y los mensajes locales a 7 claves nuevas, más las existentes;
  - lo desconocido muestra la frase genérica;
  - el proveedor guarda códigos (`auth_unavailable`, `session_restore_failed`), nunca texto;
  - `check-visible-errors` (6/6) prueba los 8 idiomas, que no haya caída al inglés y que no se filtren `VITE_`, URLs, `localhost` ni `.env`.
- `title="Click to see notes"`, fijo en inglés, pasó a `t('showNotes')`.
- 31 claves nuevas × 8 idiomas (23 de Tú, 7 de acceso, 1 de misión). `check:i18n`: 5 274 claves al 100 % en todos los idiomas, sin extras.

## 10. Resultados en navegador

**Banco visual de desarrollo** (`linguachat-frontend/bench/`):
- Es una entrada Vite aparte que reemplaza `useApp()` por un contexto sintético con un plugin de resolución.
- Su config **se niega a construir** (verificado: «never built»).
- Solo sirve en `127.0.0.1:5190`.
- No usa autenticación, sesión ni datos reales.
- Los guards de producción no cambiaron.
- `check-bundle-boundaries` (grupo 6b) comprueba en cada build:
  - que ningún archivo del build contiene código del banco;
  - que ningún archivo de `src/` lo importa (estático, de efecto o dinámico; mutación detectada);
  - que la config de producción no lo menciona.

**Barrido automático:** 5 escenas (Tú, llamada, notas, chat, acceso) × es/en/ja/ar × claro/oscuro × 390/768/1440 px = **120 combinaciones**. Resultado:
- 0 desbordes horizontales;
- 0 claves crudas;
- 0 escenas vacías;
- árabe siempre `dir=rtl`.

**Revisión visual** (capturas inspeccionadas):
- Tú en español a 390 px: vacío, 2 días y 9 días.
- Llamada en árabe oscuro: legible.
- Chat en árabe oscuro: burbujas en inglés LTR con puntuación correcta.
- Notas en japonés claro y español oscuro.
- Acceso en japonés.

**IME con eventos reales en el compositor real:**

| Evento | Resultado |
|---|---|
| Enter durante composición | no envía |
| Enter de confirmación de Safari (229) | no envía |
| Escape de cancelación | no envía |
| Shift+Enter | no envía |
| Enter normal | envía `こんにちは` y vacía el campo |

Acceso con un error simulado con la forma de Supabase: se ve el texto japonés correcto y no aparece «Invalid login», `VITE_` ni «supabase». **No es autenticación real.**

Limitaciones de esta verificación:
- El banco renderiza componentes, no la app completa detrás del login.
- Recorrer la app autenticada de punta a punta sigue requiriendo una cuenta de prueba del propietario (no se creó ninguna).

## 11. Resultados en Windows y CI

**Dos ciclos completos consecutivos limpios** tras el último cambio funcional, sin copias parcheadas:

| Paso | Ciclo 1 | Ciclo 2 |
|---|---|---|
| `check:all` (por código de salida) | 90/90 | 90/90 |
| `npm run build` | 0 | 0 |
| `check:i18n` | 0 | 0 |
| foundry `run-all` b1/b2/c1/c2 + a2 | 0 | 0 |
| cloud-scope (sin git) / `--self-test` / tests | 0 / 0 / 0 | 0 / 0 / 0 |
| `compileall` | 0 | 0 |
| `pytest` | 597 passed | 597 passed |
| plantillas de email | 0 | 0 |
| `check:github-integration` | **1 (entorno: falta `jq`)** | **1 (entorno: falta `jq`)** |

- **Antes:** 86/91, con 4 fallos ambientales y 1 regresión de bloque A que P2 corrigió (`check-memory-and-story`).
- **`check:github-integration`** ejecuta los scripts reales del workflow contra un `gh` falso y necesita bash+jq.
  - Salió de `check:all` y tiene **su propio paso en `qa.yml`**, así que corre en cada PR; la cobertura de CI se mantiene.
  - En Windows sin jq falla con un mensaje claro; no se salta.
  - **No pude ejecutarlo aquí** (no descargué jq).
- **Guardián cloud-scope:**
  - sin checkout git escanea el árbol de trabajo (un superconjunto de lo versionado, con las exclusiones de `.gitignore`) y anuncia el modo;
  - una violación sembrada se detecta;
  - en CI sigue usando `git ls-files`.
- `check-pre-a1-freeze`, los dos foundry A1 arc6-7 y los cuatro `run-all`/a2 corren sin parches en Windows.
- **`qa.yml`:** solo se añadió el paso `check:github-integration`. `check-cloud-automation`, `check-continuous-automation`, `check-autonomy-audit` y `check-two-clean-cycles` siguen verdes.

## 12. Bundle antes / después

| Medida | kB (1024 B) |
|---|---|
| Original `086323c` | 859,3 |
| Final P1 | 869,2 |
| P2 antes de la optimización | 877,3 (**sobre** el presupuesto de 850; CI no lo veía) |
| **P2 final** | **713,0** (−164,3 kB, −18,7 %; gzip ≈180 kB) |

Cómo se midió y qué se cambió:
1. **Medición por módulo** (plugin `generateBundle` sobre un build temporal).
   - Lo más pesado era el diccionario base `translations.js`: 324 kB renderizados, de los que unos 177 kB eran copia en inglés de **B1–C2**, niveles cerrados a los que ningún estudiante puede llegar.
   - El esqueleto (338 kB) y react-dom (134 kB) siguen después.
2. **Cambio:**
   - esas secciones se movieron **sin alterar texto ni claves** a `i18n/closedLevelsEn.js`, un chunk propio de 168 kB;
   - `loadEpisodeContent` las carga junto con el contenido B1–C2, **después** del gate de producto;
   - una petición de estudiante a un nivel cerrado sigue devolviendo `level_unavailable` sin cargar nada (probado).
3. **Herramientas i18n:** leen ambos archivos como fuente inglesa. La cobertura, los placeholders y los duplicados entre archivos se juzgan igual que antes, con el mismo total de 5 274 claves.
4. **Presupuesto:** **no se tocó (850 kB).**
   - `check-bundle-boundaries` y `check-curriculum-loading` ahora **construyen su propio build** en un directorio temporal (o el de `--dist`), así que el orden de CI ya no importa.
   - `check-curriculum-loading` pasó de 3 a 9 grupos verificados.
   - Mutaciones:
     - con un presupuesto de 700, falla;
     - con un import ansioso de la copia cerrada, la entrada vuelve a 877,8 kB y falla.
5. Siguiente paso posible (no hecho): dividir el esqueleto por nivel (A2–C2 ≈ 169 kB), con un índice `id → nivel` en la entrada para conservar `level_unavailable` síncrono.

## 13. Archivos modificados (contra `_snapshot-p1`)

**Nuevos:**
- Motor e i18n:
  - `src/learning/engine/learnerSummary.js`
  - `src/i18n/closedLevelsEn.js`
  - `src/services/keyboard.js`
  - `src/auth/authErrorKey.js`
- Componentes:
  - `src/components/identity/LearningSummaryCard.jsx`
  - `src/components/layout/NotesSheet.jsx`
- Banco visual: `bench/` (`index.html`, `main.jsx`, `fakeAppContext.jsx`, `vite.bench.config.mjs`).
- Pruebas:
  - `scripts/check-store-concurrency.mjs`
  - `scripts/check-learning-loop.mjs`
  - `scripts/check-ime-enter.mjs`
  - `scripts/check-visible-errors.mjs`

**Motor y servicios:**
- `services/progressLedger.js`
- `services/localProgress.js`
- `services/writerKeys.js`
- `services/missions.js`
- `learning/engine/session.js`
- `learning/engine/memoryContext.js`
- `learning/engine/miniStory.js`
- `learning/engine/learnerModel.js`
- `learning/engine/teachingPolicy.js` (exporta `retentionProbes`)
- `learning/curriculum/episodeContent.js`

**UI:**
- `App.jsx`
- `context/AppContext.jsx`
- `components/auth/AuthFlow.jsx`
- `components/call/CallSurface.jsx`
- `components/chat/{LearningAction,ListeningTurn,MessageBubble}.jsx`
- `components/episode/EpisodeShell.jsx`
- `components/identity/LanguageIdentity.jsx`
- `components/layout/{ConversationRoom,TutorNotes}.jsx`
- `components/onboarding/OnboardingFlow.jsx`
- `components/session/{MiniStory,SessionRunner}.jsx`
- `index.css`

**i18n:**
- `i18n/translations.js`
- `i18n/locales/{es,pt,fr,it,de,ja,ar}.js`

**Pruebas y herramientas:**
- `package.json`
- `scripts/check-{bundle-boundaries,curriculum-authoring,curriculum-loading,hybrid-evaluation,memory-and-story,merge-blocker-gate,same-account-tabs,session-surfaces,visual-identity}.mjs`
- `scripts/lib/i18nSource.mjs`
- `scripts/foundry/a1/check-a1-arc6-arc7-{journeys,structure}.mjs`
- `scripts/foundry/a2/check-a2-structure.mjs`
- `scripts/foundry/{b1,b2,c1,c2}/run-all.mjs`

**Repositorio y backend:**
- `.github/scripts/check-linguachat-cloud-scope{,.test}.mjs`
- `.github/workflows/qa.yml`
- `linguachat-backend/tests/test_tutor_intelligence.py`

## 14. Regresiones

**Encontradas y corregidas dentro de P2:**
- **`check-memory-and-story`** buscaba `localStorage.setItem(STORY_STORAGE_KEY` en `MiniStory.jsx`, pero el guardado pasó a `saveStoryState` (Bloque A).
  - Se actualizó para verificar la llamada **y** que el motor escribe la misma clave.
  - No se debilitó: la persistencia se comprueba en el lugar donde ahora ocurre.
- **Arnés del banco:** el `ConversationRoom` cargado de forma ansiosa cambiaba la división de chunks. Por eso el banco no se importa nunca desde `src/`, cosa que el guardián 6b comprueba.

No se eliminó ninguna prueba ni ninguna aserción. Pasaron a leer también `closedLevelsEn.js`:
- las dos aserciones de texto sobre `translations.js` (`check-curriculum-authoring`, `check-hybrid-evaluation`);
- `extractBase`.

**Sin regresiones conocidas abiertas:**
- `check:all` 90/90 (incluye P0/P1: tabs de la misma cuenta, aislamiento A→B→A, lease, recuperación de perfil, inteligencia pedagógica).
- `pytest` 597.

## 15. Limitaciones que requieren proveedores externos o acciones del propietario

- **Autenticación real** (Supabase): no probada; hace falta una cuenta de prueba en un entorno de pruebas autorizado.
- **`check:github-integration`:** necesita jq. Corre en GitHub Actions; aquí no se ejecutó.
- **Hablar y pronunciación:** siguen «no evaluados» por diseño (sin micrófono, STT ni WebRTC). Evaluarlos exige proveedores que esta fase no autoriza.
- **Eficacia pedagógica en personas reales:** las simulaciones prueban la coherencia interna, no el aprendizaje. Hace falta el piloto con estudiantes reales previsto en `learning-science-foundation.md`.
- **Pruebas en Safari/Firefox reales** (IME, Web Locks): solo se usó Chromium.

## 16. Recomendaciones para la fase 4

1. **Archivo de conversaciones honesto:**
   - quitar `MOCK_ARCHIVE` y el `9` fijo;
   - mostrar un estado vacío;
   - retirar los «puntos de confianza», derivados del métrico inventado. Su campo `confidence` también alimenta `sessions[].confidence`.
2. **Localizar el subsistema de misiones:** `feedbackHint`, «Casi. Mira esta pista», «La idea esta bien…» y el texto `Mision completada. Hoy practicaste…` de `missions.js`.
3. **Contraste del botón primario en oscuro** (≈2,5:1): necesita decidir un token, dentro del sistema visual congelado.
4. **Dividir el esqueleto por nivel**, con un índice `id → nivel` en la entrada (≈ −160 kB adicionales).
5. **Conectar los errores del chat al modelo del estudiante** cuando exista una actividad A1 abierta que los practique.
6. **Recorrido autenticado de punta a punta** con una cuenta de prueba del propietario (390/768/1440, claro/oscuro, es/en/ja/ar), más Safari y Firefox para IME y locks.
7. **Instalar jq en el entorno local de Windows**, o documentar `check:github-integration` como exclusivo de CI en `CLAUDE.md`.
8. **Quitar el prop muerto `onOpenNotes` de `ConversationRoom` y el `OnboardingFlow.jsx` sin uso**, tras confirmarlo.
