# LinguaChat 1.0 — Fase 1: corrección de P0 (2026-10-31)

**Base de partida:** `main@086323c41f5f93ff8af12ee70304c30b1633f2d0`, verificada byte a byte (607 archivos) en la auditoría `docs/audits/2026-10-31-claude-local-audit.md`. Ese informe no se modificó.

**Alcance:** solo P0-1 (pérdida de progreso entre pestañas) y P0-2 (perfil local corrupto). Ningún P1 se tocó.

**Copias de seguridad:**
- `C:\Users\<usuario>\Music\LinguaChat-main\_originals-086323c\` guarda una copia exacta de cada archivo existente antes de modificarlo. Las 17 copias tienen el mismo hash que `main` en GitHub.
- `docs/audits/2026-10-31-p0-hardening.diff` contiene el diff unificado completo para revisión (no hay `.git`).

---

## Resumen para el propietario

- **P0-1 resuelto.** Antes, dos pestañas abiertas con la misma cuenta se borraban mutuamente el XP, la racha, las palabras y los mensajes: ganaba la que guardaba última.
  - Ahora el progreso se guarda como una lista de **eventos con identificador único**: cada práctica, misión, episodio o bono. Al guardar, cada pestaña **une** su lista con la que ya está almacenada.
  - Nada se pierde y nada se paga dos veces. La racha sigue el calendario real, no el orden de guardado.
  - El chat se une igual. Borrar el chat en una pestaña ya no se deshace desde la otra.
- **P0-2 resuelto.** Antes, un perfil dañado bloqueaba la cuenta para siempre con el mensaje falso «almacenamiento lleno».
  - Ahora la app **guarda una copia exacta** del perfil dañado, conserva lo legible (nombre, objetivo, preferencias) y retoma la configuración desde el último punto válido.
  - Nunca inventa un nivel.
  - El XP, el progreso, las preferencias y el modelo de aprendizaje no se tocan.
  - Si el problema es del navegador (almacenamiento bloqueado o lleno), el mensaje lo dice en el idioma del usuario.
- **Pruebas:** 21/21 (P0-1) y 12/12 (P0-2) pasan; antes del arreglo fallaban 11/14 y 10/12. Hubo dos ciclos completos limpios y consecutivos: backend 469/469, build, i18n, correos y `check:all` 82/86, donde los 4 fallos son los del entorno Windows ya documentados.
- **Lo que no pude probar:**
  - Dos pestañas reales con una cuenta de QA autenticada. Sin la configuración pública de Supabase no se puede iniciar sesión en local, y no creé cuentas en el proyecto real.
  - El aviso visual de recuperación del perfil, por el mismo motivo.
- **Defecto previo descubierto:** el bloque JavaScript inicial ya superaba su presupuesto antes de mis cambios (859,3 kB frente a 850 kB). CI no lo detecta porque ejecuta la verificación antes del build. Mis cambios lo aumentan en 11,6 kB. No relajé el límite; queda como P2.

---

## 1. Problemas reproducidos

### P0-1 — Pérdida de progreso entre pestañas de la misma cuenta

`scripts/check-same-account-tabs.mjs` se escribió **antes** de tocar código.
- Simula dos pestañas reales: un `localStorage` compartido, un `sessionStorage` por pestaña y el lease real de cuenta (`activateLocalAccount`).
- Ejecuta las mismas llamadas que AppContext: cargar, mutar en memoria, guardar con el efecto pasivo y escuchar el evento `storage`.
- Con el código original, el último paso no hace nada, porque la app original no tenía listener.

**Resultado sobre el código original: 3 pasan y 11 fallan.**

```
FAIL dos pestañas practican a la vez — nada se pierde          (messagesSent 1, esperado 2)
FAIL escrituras obsoletas en orden inverso                      (la corrección de b borrada por a)
FAIL dos logros independientes en dos pestañas pagan ambos
FAIL el mismo premio desde dos pestañas se paga una vez         (reintento duplicaba XP)
FAIL la racha sigue el calendario, no el orden de guardado
FAIL recargar una pestaña ve todo lo guardado por ambas
FAIL escritura interrumpida por Storage se reintenta después
FAIL un premio no se confirma si su escritura es rechazada
FAIL dos pestañas chateando conservan ambas conversaciones
FAIL borrar el chat en una pestaña no lo deshace la otra
FAIL el progreso sobrevive a reiniciar el navegador
ok   pestaña cerrada antes de guardar pierde solo su turno no guardado
ok   A → B → A: una pestaña A obsoleta no escribe en B ni en la nueva A
ok   evidencia del modelo de aprendizaje de dos pestañas se une   (regresión)
```

### P0-2 — Perfil local corrupto bloquea la cuenta

`scripts/check-profile-recovery.mjs` se escribió **antes** de tocar código.
- Usa los módulos reales de lease, almacenamiento y restauración.
- Con el código original reproduce exactamente lo que hacía AppContext: `readVerifiedProfile` y, ante cualquier excepción, `storage_full`.

**Resultado sobre el código original: 2 pasan y 10 fallan.** Uno de los que pasaban, «almacenamiento lleno», pasaba por casualidad, porque el código original respondía siempre `storage_full`.

```
FAIL JSON corrupto: se conserva, se retoma la configuración, sin bucle al recargar
FAIL perfil completo sin nivel + checkpoint válido → retoma desde el checkpoint
FAIL nivel inválido se descarta, nunca se adivina
FAIL placement inconsistente sin checkpoint → se vuelve a evaluar
FAIL checkpoint inválido se ignora
FAIL lectura denegada → «almacenamiento no disponible», sin escrituras
FAIL escritura de reparación rechazada → «irrecuperable por ahora», copia conservada
FAIL cambio de cuenta durante la recuperación → se detiene, B intacta
FAIL lease ya obsoleto → no restaura nada
FAIL la app asigna a cada resultado su causa real
```

## 2. Causas raíz

### P0-1

1. **`AppContext.jsx` (efectos pasivos, originalmente líneas 473-479).**
   - Al cambiar el estado, `saveStoredMessages(messages)` y `saveLocalProgress(localProgress)` escribían el **objeto completo en memoria** de la pestaña.
   - `services/localProgress.js` (`saveLocalProgress`, `saveStoredMessages`) escribía ese objeto tal cual, sin leer lo almacenado.
2. **Contadores calculados desde la copia de la propia pestaña.** `recordPractice` / `recordMissionProgress` calculaban `xp`, `streak`, `messagesSent`, etc. desde la copia en memoria de la pestaña, que podía estar obsoleta.
3. **Ningún listener `storage`.** Una pestaña nunca se enteraba de lo que guardaba la otra (grep sin resultados en `src/`).
4. **Premios confirmados sin ser durables.**
   - `awardEpisode` y `finishSession` sumaban XP solo en el estado de React y lo guardaba el efecto pasivo, sin verificación. Aun así, el episodio quedaba marcado como «premiado».
   - Si esa escritura fallaba, el XP se perdía para siempre. Si se reintentaba, podía duplicarse.
5. **Borrar el chat escribía `[bienvenida]`.** Cualquier otra pestaña podía volver a escribir la conversación anterior.

**Aislamiento entre cuentas frente a concurrencia en la misma cuenta.** El aislamiento entre cuentas (lease por pestaña, namespaces por generación, A→B→A) **ya funcionaba** y no se modificó. El fallo era exclusivamente de concurrencia **dentro de la misma cuenta**.

**El modelo de aprendizaje ya estaba protegido.** `lc2-learner-model-v1` (evidencia, episodios, `episodeRuns`) ya fusionaba al guardar (`mergeActivityEvidence`). Se añadió una prueba de regresión que lo confirma.

### P0-2

1. **`auth/profileRestore.js` → `readVerifiedProfile`** lanza excepciones para causas muy distintas:
   - lease obsoleto (`Stale profile restore`, `Profile ownership changed`);
   - lectura denegada por el navegador;
   - JSON corrupto (`SyntaxError`);
   - forma inválida (`Invalid profile`);
   - placement inconsistente (`Invalid profile placement`);
   - perfil marcado como completo sin un placement verificable (`Invalid completed profile placement`).
2. **`AppContext.jsx` (`applyProviderSession`, originalmente líneas 302-306)** capturaba **todas** esas excepciones como `storage_full`, volvía a `entry` y **no cerraba la sesión del proveedor**. Cada recarga o login repetía lo mismo y no había salida dentro de la app.
3. **Las líneas 293-297** (importación de preferencias) tenían el mismo patrón.

## 3. Archivos modificados

| Archivo | Tipo | Motivo |
|---|---|---|
| `linguachat-frontend/src/services/progressLedger.js` | **nuevo** | Ledger de eventos puro y determinista: crear, sanear, unir, compactar y derivar totales |
| `linguachat-frontend/src/services/storageQuarantine.js` | **nuevo** | Cuarentena de bytes ilegibles, bajo el lease de la cuenta |
| `linguachat-frontend/src/services/localProgress.js` | modificado | Persistencia v2 con unión al guardar, época de conversación, lectura para el listener, commit verificado de eventos y migración v1 |
| `linguachat-frontend/src/context/AppContext.jsx` | modificado | Listener `storage`, premios durables con id estable, borrado y reset con nueva época, restauración de perfil clasificada y cierre de sesión compensatorio |
| `linguachat-frontend/src/auth/profileRestore.js` | modificado | `restoreProfile()` y `isQuotaError()`. `readVerifiedProfile` **no cambió** |
| `linguachat-frontend/src/components/auth/AuthFlow.jsx` | modificado | Traducción de los códigos `storage_unavailable` y `local_data_unreadable` |
| `linguachat-frontend/src/components/setup/SetupFlow.jsx` | modificado | Aviso de recuperación (`role="status"`) en `SetupShell`, con estilos y tokens ya existentes |
| `linguachat-frontend/src/i18n/translations.js` y `locales/{es,pt,fr,it,de,ja,ar}.js` | modificado | 3 claves nuevas en los 8 idiomas, con traducciones reales y el tono de cada archivo (tú / vous / du) |
| `linguachat-frontend/scripts/check-same-account-tabs.mjs` | **nuevo** | Prueba P0-1 (21 escenarios) |
| `linguachat-frontend/scripts/check-profile-recovery.mjs` | **nuevo** | Prueba P0-2 (12 escenarios) |
| `linguachat-frontend/scripts/check-session-surfaces.mjs` | modificado | Ajuste de arneses estructurales (ver §7) |
| `linguachat-frontend/scripts/check-setup-checkpoint.mjs` | modificado | La aserción de orden apunta a `restoreProfile(...)` (ver §7) |
| `linguachat-frontend/package.json` | modificado | Las 2 pruebas nuevas se añaden a `check:all`, más los atajos `check:same-account-tabs` y `check:profile-recovery`. Sin dependencias nuevas |

No se tocaron:
- currículo, evaluadores, Pre-A1, niveles (A1–C2 siguen con `available:false`);
- `CLOUD_PREFERENCES_RELEASED` (sigue en `false`);
- backend, Supabase, Vercel, `node_modules` ni el lockfile.

## 4. Soluciones implementadas

### P0-1: progreso como ledger de eventos idempotentes

**Formato almacenado** (`lc2-local-progress`, versión 2):

```
{ version: 2, epoch: {id, at}, base: {snapshot, startedAt, foldedBefore, folded}, events: [...] }
```

- **Eventos con identificador estable.**
  - Tipos:
    - `practice` (turno de chat);
    - `mission`;
    - `award` (episodio: XP y palabras del Garden);
    - `xp` (bono de sesión diaria).
  - Cada uno lleva `id` y `at`; los de práctica y misión llevan también el `day` local del momento en que ocurrió.
  - Identificadores deterministas donde hace falta deduplicar:
    - `episode-award:<episodeId>`;
    - `session-bonus:<sessionId>`.
  - El resto usa un UUID aleatorio.
- **Unión, no «último gana» ni «mayor contador».**
  - `mergeLedgers` une por `id`. Es conmutativa, asociativa e idempotente (probado).
  - Los totales (`xp`, `streak`, `confidence`, `topics`, `learnedItems`, `sessions`, contadores) se **derivan** aplicando los eventos en orden cronológico, con exactamente las mismas reglas de antes. Por eso la racha respeta el calendario.
- **Guardar = leer lo almacenado + unir + escribir + verificar.**
  - `saveLocalProgress` ya no escribe la copia de la pestaña, sino la unión.
  - Si lo almacenado es ilegible, primero se pone en cuarentena. Si la cuarentena falla, **no se sobrescribe** y el guardado devuelve `false`.
- **Listener `storage` en AppContext.**
  - Cuando otra pestaña guarda progreso o chat, esta pestaña lo une a su estado.
  - Si tiene algo que el almacenamiento no tiene, su efecto pasivo lo reescribe, y ambas pestañas convergen.
  - Lee con el mismo lease capturado: una pestaña revocada no escucha nada.
- **Premios durables antes de confirmarse.**
  - `awardEpisode` y `finishSession` ejecutan `commitProgressEvent` y verifican que el evento quedó en el almacenamiento antes de devolver `true` o marcar la sesión como completa.
  - Si falla, el botón sigue reintentable y el id evita el doble pago.
  - El bono diario se confirma **antes** de marcar la sesión completa: si la sesión no llega a guardarse, el reintento no paga dos veces.
- **Reset = nueva época.** Los eventos anteriores al reset se descartan en todas las pestañas. Lo que una pestaña obsoleta haga **después** del reset sí cuenta.
- **Compactación.**
  - Los eventos con más de 7 días, o los que excedan 500, se pliegan en `base`.
  - Una copia vieja que vuelva a enviar eventos ya plegados no los cuenta dos veces: se ignoran por `foldedBefore`.
- **Migración v1.** Un registro v1 existente se convierte en `base` con **todos sus totales intactos** (probado campo a campo) y los eventos nuevos se suman encima. También se verificó en el navegador real con datos de invitado de la sesión anterior.

### P0-1: chat

- Se sigue guardando como un array, con el mismo formato.
- **Guardar = unión.**
  - Cada mensaje se identifica por la combinación `id`, `ts`, `role` y `text`, porque dos pestañas pueden generar el mismo `u${Date.now()}`.
  - La lista se ordena por `ts` y se recorta a los últimos 100, igual que antes.
  - Se conserva una sola bienvenida por conversación.
- **Nueva época de conversación** (`lc2-chat-epoch`).
  - Borrar el chat y resetear escriben primero la época y luego `[bienvenida]`.
  - Los mensajes anteriores a la época se descartan en cualquier pestaña.
  - Si la escritura se interrumpe entre ambos pasos, la conversación borrada sigue oculta (probado).

### P0-2: `restoreProfile()` clasifica y recupera sin bloquear

| Resultado | Cuándo | Qué hace la app |
|---|---|---|
| `restored` | Perfil válido | Igual que antes, sin escrituras (probado) |
| `recovered` | JSON corrupto, forma inválida, nivel inválido, placement inconsistente, «completo» sin placement verificable | Ver los pasos de recuperación más abajo |
| `stale` | Lease cambiado (logout o cambio de cuenta) | No hace nada: otra activación manda |
| `storage_unavailable` | El navegador niega la lectura | Mensaje localizado y cierre de sesión compensatorio |
| `storage_full` | Cuota excedida al intentar conservar la copia | Mensaje localizado. **El original no se reemplaza** |
| `unrecoverable` | La reparación no puede escribirse de forma segura | Mensaje `local_data_unreadable` y cierre de sesión. La copia ya conservada se mantiene. No se aplica nada a medias |

Pasos de una recuperación (`recovered`):
1. **Copia exacta** de los bytes originales en `lc2-quarantine:lc2-profile:<hash>:<longitud>`. La operación es idempotente y queda bajo el lease de la cuenta.
2. Se escribe `lc2-onboarded=false`, para que Home no se abra sobre un perfil sin verificar.
3. Se guarda lo legible (nombre, objetivo, intereses, etc.) **sin** `level` ni `placementResult`. **Nunca se infiere un nivel.**
4. Si existe un checkpoint de placement válido (evidencia real), el lector estricto lo usa y la configuración se retoma en ese paso. Si no, vuelve al test de placement.
5. Se muestra el aviso localizado `profileRecoveredNotice` en la configuración. El XP, el progreso, las preferencias y el modelo de aprendizaje no se tocan (probado).

**Cierre de sesión compensatorio.** Usa el mismo patrón ya existente para `isolation.blocked`: el `SIGNED_OUT` del proveedor no borra el mensaje. Así, una recarga no repite el fallo con la sesión abierta. También se aplica a un fallo de importación de preferencias, que ahora distingue cuota de datos ilegibles.

**Mensajes nuevos** (8 idiomas):
- `authStorageUnavailable`;
- `authLocalDataUnreadable`;
- `profileRecoveredNotice`.

El botón del aviso reutiliza la clave existente `close`.

## 5. Pruebas que fallaban antes

| Prueba | Antes del arreglo | Evidencia |
|---|---|---|
| `scripts/check-same-account-tabs.mjs` (14 escenarios originales) | **11 FAIL / 3 ok** | §1 |
| `scripts/check-profile-recovery.mjs` (12 escenarios) | **10 FAIL / 2 ok** | §1 |

Escenarios de P0-1 añadidos después:
- Seis se añadieron mientras implementaba:
  - reset entre pestañas;
  - compactación sin doble conteo;
  - migración v1 exacta;
  - cuarentena de progreso corrupto;
  - conmutatividad;
  - interrupción entre época y mensajes.
- Uno salió de mi revisión del diff: dos bienvenidas en pestañas abiertas sobre un chat vacío.

Esos siete usan la API nueva y no se ejecutaron contra el código original. No se presentan como reproducciones.

## 6. Pruebas que pasan después

| Prueba | Resultado |
|---|---|
| `node scripts/check-same-account-tabs.mjs` | **PASS 21/21** |
| `node scripts/check-profile-recovery.mjs` | **PASS 12/12** |

Escenarios obligatorios cubiertos:
- **P0-1:**
  - dos pestañas escribiendo a la vez;
  - distinto orden;
  - dos logros independientes;
  - el mismo evento duplicado;
  - recarga de una pestaña;
  - cierre antes del guardado y escritura interrumpida;
  - A→B→A;
  - escrituras obsoletas;
  - denegación y cuota de Storage;
  - reinicio completo del navegador.
- **P0-2:**
  - JSON corrupto;
  - perfil incompleto;
  - nivel inválido;
  - placement inconsistente;
  - checkpoint válido e inválido;
  - datos recuperables e irrecuperables;
  - errores de lectura y de escritura;
  - cambio de cuenta durante la recuperación;
  - recuperación tras recargar;
  - preservación de XP, preferencias, progreso y modelo.

## 7. Pruebas de regresión

**Dos ciclos completos, consecutivos y limpios** sobre el mismo código final, sin cambios entre ambos. Se usó el orden de CI (`check:all` sin `dist/`, luego build), con `LINGUACHAT_PROVIDER=local` y `OPENAI_ENABLED=false`.

| Control | Ciclo 1 | Ciclo 2 |
|---|---|---|
| `check:all` (por código de salida, script a script como `qa.yml`) | 82/86 | 82/86 |
| …fallos, todos del entorno Windows y los mismos de la auditoría (ver más abajo) | 4 | 4 |
| `npm run build` | PASS | PASS |
| `npm run check:i18n` (8 locales al 100 %) | PASS | PASS |
| `check-pre-a1-freeze` (copia parcheada, sin la sección `git`) | PASS (7 grupos) | PASS |
| `check-a1-arc6-arc7-structure` (copia con `pathToFileURL`) | PASS | PASS |
| `check-a1-arc6-arc7-journeys` (copia con `pathToFileURL`) | PASS (95 trayectorias) | PASS |
| `check-linguachat-cloud-scope --self-test` | PASS | PASS |
| Backend `python -m compileall -q` | PASS | PASS |
| Backend `python -m pytest -q` | **469 passed** | **469 passed** |
| `node docs/auth-email/check-templates.mjs` | PASS | PASS |
| `check-bundle-boundaries` (después del build) | **FAIL (previo)**: 870,9 kB > 850 | igual |
| `check-curriculum-loading` (después del build) | PASS: 225,4 kB de app < 290 kB | — |

**Los 4 fallos de entorno de `check:all`, registrados por separado** (no son defectos funcionales; se mantienen idénticos a la auditoría):
1. `check-pre-a1-freeze.mjs`: llama a `git ls-files` y la carpeta no tiene `.git`. La copia parcheada pasa los 7 grupos de congelación.
2. `check-merge-blocker-gate.mjs`: necesita `jq`, que no está instalado en Windows. Solo prueba la automatización de GitHub, que está pausada.
3. `check-a1-arc6-arc7-structure.mjs`: `import()` de una ruta `C:\` sin `pathToFileURL` da `ERR_UNSUPPORTED_ESM_URL_SCHEME`. Es un bug de portabilidad (P3); la copia corregida pasa.
4. `check-a1-arc6-arc7-journeys.mjs`: misma causa.

**Defecto previo nuevo, separado de los 4 anteriores: `check-bundle-boundaries`.**
- Con el build **original** (antes de cualquier cambio), el bloque inicial ya medía 879 887 bytes (859,3 kB) frente a un presupuesto de 850 kB.
- En la auditoría y en CI pasa solo porque se ejecuta antes de que exista `dist/`, y entonces se salta (`qa.yml` ejecuta `check:all` antes de `build`).
- Mis cambios lo llevan a 891 828 bytes (870,9 kB, +11,6 kB, +1,4 %).
- **No relajé el presupuesto.** El presupuesto fino `check-curriculum-loading` (código de app < 290 kB) sí pasa.

**Pruebas existentes que tuve que ajustar** (sin debilitar ninguna aserción):
- **`check-session-surfaces.mjs`.**
  - Sus arneses extraen el texto de funciones de AppContext y `localProgress` y las ejecutan con dependencias inyectadas (`with (deps)`). Las funciones corregidas llaman a helpers nuevos, que hubo que inyectar.
  - Cambios:
    1. `finishSession` (dos arneses): se inyectan `commitProgressEvent` y `applyProgressEvent`. Se añaden los modos `rejected-bonus` y `revoked-bonus`, que deben fallar cerrados sin XP ni escrituras. Se añade la aserción de que el bono se confirma una vez, con id `session-bonus:<id>`.
    2. `awardEpisode`: se inyectan los mismos helpers. Se añaden los modos `rejected-award` y `revoked-award`, y la aserción del id `episode-award:<id>`.
    3. 7b `saveLocalProgress`: se inyectan `mergeIntoStoredProgress` y `serializeStoredProgress`. Los 6 modos y sus expectativas no cambian.
    4. Borrado de chat y reset: la dependencia `saveStoredMessages` pasa a ser `startStoredConversation`, que es lo que ahora llama el código. El arnés de lectura real extrae `startStoredConversation`, añade la aserción de la época y cuenta 2 escrituras en `stale-flush` (época más bienvenida, antes 1). El resto de aserciones no cambia.
  - Las expresiones regulares de los efectos pasivos (`saveLocalProgress(localProgress, …)` y `saveStoredMessages(messages, …)`) siguen pasando **sin cambios**.
- **`check-setup-checkpoint.mjs`.** La aserción «hidratar solo después del fencing de cuenta» buscaba el texto `readVerifiedProfile(captureLearnerAccess())`. Ahora busca `restoreProfile(captureLearnerAccess())`. Además se exige que la llamada exista: antes, si el texto desaparecía, `indexOf` devolvía `-1` y la aserción podía pasar en silencio.
- **`check-auth-ui-wiring.mjs`.** Pasa sin cambios: la ruta `isolation.blocked → storage_full → signOut` sigue intacta.

**Guardas del producto** (grep):
- `CLOUD_PREFERENCES_RELEASED = false`;
- A1–C2 con `available:false`;
- sin APIs de grabación;
- `speechSynthesis` solo en `speech.js`;
- sin claves privadas;
- sin dependencias nuevas;
- el lockfile no se modificó.

**Humo en navegador** (build nuevo, 390 px):
- la entrada carga sin errores de consola y sin desbordamiento;
- los datos v1 de invitado almacenados se migraron a v2 sin crear una cuarentena innecesaria.

## 8. Riesgos y limitaciones pendientes

1. **No probado con dos pestañas reales autenticadas (BLOCKED).** No hay `VITE_SUPABASE_*` ni modo de QA local, y no creé cuentas en el proyecto real. La concurrencia se probó con una simulación determinista que usa los módulos reales de lease y almacenamiento, no con React montado.
2. **Ventana mínima del navegador.** Chrome propaga `localStorage` entre procesos de forma asíncrona. Si la pestaña A guarda, la B sobrescribe con una lectura de microsegundos antes y **A se cierra antes de recibir el evento `storage`**, el evento de A puede perderse. No hay `Web Locks`, porque no garantizan esa visibilidad entre procesos. En la práctica es una ventana de milisegundos.
3. **Pestañas con versiones mezcladas durante un despliegue.** Una pestaña abierta con el código anterior escribe el formato v1 completo. El código nuevo lo trata como `base` y puede perder eventos v2 recientes. Mitigación: recargar las pestañas tras desplegar.
4. **Horizonte de compactación (7 días / 500 eventos).** Un evento que una pestaña no consiguió guardar durante más de 7 días se considera ya contado.
5. **Otros almacenes.** `lc2-daily-session-v1`, `lc2-completed-missions`, `lc2-active-mission`, `lc2-memory-context-v1` y `lc2-mini-story-v1` siguen escribiéndose con verificación pero sin unión. **No se auditaron en esta fase.** La evidencia de aprendizaje vive en el modelo, que sí se une. Conviene revisarlos en P1.
6. **Mensajes en memoria.** El historial en memoria se recorta a 100 al unir un evento de otra pestaña. Antes solo ocurría al recargar.
7. **Cuarentena sin interfaz.** La copia se puede recuperar manualmente (DevTools / `localStorage`), pero no hay pantalla de exportación o restauración. Las entradas solo crecen con cada corrupción distinta.
8. **Importación de preferencias (subsistema inactivo).**
   - Un fallo ahora informa de su causa y cierra la sesión, en lugar de mostrar «almacenamiento lleno» en bucle.
   - Su journal falla cerrado con los bytes intactos, pero no tiene recuperación automática.
   - Con `CLOUD_PREFERENCES_RELEASED=false` solo se alcanza con un journal corrupto.
9. **El usuario recuperado repite parte de la configuración.** Si no hay checkpoint válido, vuelve a hacer el placement, porque es la única forma de no inventar un nivel.
10. **Visual no verificado.** El aviso de recuperación y los mensajes nuevos de la entrada requieren iniciar sesión.
11. **El presupuesto de bundle se supera** (defecto previo, ver §7).
12. **Sin cambios en estos temas.** Misiones que podrían pagar XP completo al repetirse (sospecha de la auditoría) y P1-1 (error crudo «LinguaChat public auth configuration is missing.»).

## 9. Resultado final

| P0 | Estado | Base |
|---|---|---|
| **P0-1** Pérdida de progreso entre pestañas | **RESUELTO** (verificado por simulación determinista y humo en navegador; prueba autenticada real **BLOCKED**) | 21/21; antes 11/14 fallaban; 2 ciclos limpios |
| **P0-2** Perfil local corrupto | **RESUELTO** (verificado por pruebas con módulos reales; vista autenticada **BLOCKED**) | 12/12; antes 10/12 fallaban; 2 ciclos limpios |

No queda ningún P0 conocido sin documentar. Los P1 siguen pendientes y no se empezaron.

## 10. Lista de archivos para revisión

El diff unificado completo está en `docs/audits/2026-10-31-p0-hardening.diff`.

```
A linguachat-frontend/src/services/progressLedger.js
A linguachat-frontend/src/services/storageQuarantine.js
M linguachat-frontend/src/services/localProgress.js
M linguachat-frontend/src/context/AppContext.jsx
M linguachat-frontend/src/auth/profileRestore.js
M linguachat-frontend/src/components/auth/AuthFlow.jsx
M linguachat-frontend/src/components/setup/SetupFlow.jsx
M linguachat-frontend/src/i18n/translations.js
M linguachat-frontend/src/i18n/locales/{es,pt,fr,it,de,ja,ar}.js
A linguachat-frontend/scripts/check-same-account-tabs.mjs
A linguachat-frontend/scripts/check-profile-recovery.mjs
M linguachat-frontend/scripts/check-session-surfaces.mjs
M linguachat-frontend/scripts/check-setup-checkpoint.mjs
M linguachat-frontend/package.json
A docs/audits/2026-10-31-p0-hardening.md
A docs/audits/2026-10-31-p0-hardening.diff
```

Orden de revisión sugerido:
1. `progressLedger.js`;
2. `localProgress.js`;
3. los cambios en `AppContext.jsx`;
4. `profileRestore.js`;
5. las dos pruebas nuevas.

## 11. Instrucciones de continuación

- **Para volver al estado original:** copiar `C:\Users\<usuario>\Music\LinguaChat-main\_originals-086323c\` sobre la carpeta del proyecto y borrar los 4 archivos nuevos de código y pruebas.
- **Para reproducir la verificación:**
  - `cd linguachat-frontend`;
  - `node scripts/check-same-account-tabs.mjs`;
  - `node scripts/check-profile-recovery.mjs`;
  - el ciclo completo de la sección 12 del informe de auditoría.
  - En Windows, `check:all` se cuenta script a script; los 4 fallos de entorno están descritos en §7.
- **Antes de integrar en GitHub:**
  - rama y PR, nunca `main` directo (CLAUDE.md);
  - hacen falta `## Evidence` y dos ciclos limpios en CI (Linux, con `git` y `jq`);
  - el ciclo de CI no detectará el presupuesto de bundle mientras `qa.yml` ejecute `check:all` antes de `build`.
- **Recomendado antes de cerrar P0 «en producción»:**
  - una cuenta de QA en un entorno de prueba autorizado;
  - abrir dos pestañas reales y repetir los escenarios 1, 3, 4 y 12 de `check-same-account-tabs`;
  - forzar un `lc2-profile` corrupto en DevTools y observar el aviso a 390 y 1440 px, en es, ja y ar.
- **Siguiente fase (P1), según la auditoría:**
  - el contrato de idioma del tutor y del modo sin conexión;
  - los datos inventados en «Tú»;
  - el contraste de la llamada en modo oscuro;
  - «Notas de Lingua»;
  - Lingo y Chatto en el backend;
  - la portabilidad de la QA (que eliminaría los 4 fallos de entorno);
  - el orden de CI (build antes de `check-bundle-boundaries`) y el exceso del bundle;
  - revisar los almacenes del punto 5 de §8.
