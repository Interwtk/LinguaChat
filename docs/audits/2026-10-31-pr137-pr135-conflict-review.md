# LinguaChat — revisión de PR #137 y PR #135 frente a la integración local P0–P5

> **Fecha:** 2026-10-31.
> **Solo lectura respecto a GitHub:**
> - Los PR se consultaron con `gh api` (GET).
> - Sus cabezas se trajeron a refs locales del clon de integración (`refs/pr/137`, `refs/pr/135`) con `git fetch`.
> - Los merges de prueba se hicieron con `git merge-tree` (no toca ningún árbol de trabajo) y en un worktree desechable.
> - Las sondas de §2.2 están en `p6-pr137-probes.mjs` (directorio temporal de la sesión); su salida literal va en el anexo del informe de preparación.
> - **No se comentó, cerró, rebasó ni fusionó ningún PR.**
>
> **Rama comparada:** `integration/local-p0-p5`, en el clon `Music/LinguaChat-integration`.

## 0. Corrección del traspaso anterior (importante)

El traspaso consolidado (§5) decía que #137 comparte **32 archivos** con nuestro trabajo y que había que resolverlos a mano. **Revalidado hoy, eso no describe lo que haría un merge real.**

- Esos 32 archivos salen de la lista de archivos que GitHub muestra para #137 (331 archivos), calculada contra la base registrada del PR, `38ab2f3`, que es antigua.
- El **merge-base real** entre #137 y `main` es `09879ee` (2026-10-15): la rama del PR incorporó `main` en ese punto.
  - `gh api …/compare/main...<rama>` lo confirma: `merge_base_commit = 09879ee`, `ahead_by 246`, `behind_by 262`, **234 archivos**.
- Desde `09879ee`, #137 solo cambia **234 archivos, todos bajo `docs/curriculum/`**: 233 nuevos y 1 modificado.
  - Uno de los 233 «nuevos», `longitudinal-fixture-f28-cross-skill-method-generalization.md`, ya llegó a `main` por otra vía y con el mismo contenido.
  - Lo que el PR añadiría de verdad son **232 archivos nuevos y 1 modificado**.
- De los 32 archivos «compartidos», la versión del PR es **idéntica a la de `09879ee`** en todos. En 16, `main` sigue igual al PR; en los otros 16, `main` es más reciente: de 1 a 64 commits por delante, por ejemplo 64 en `AppContext.jsx` y 18 en `learnerModel.js`.
  - Un merge de tres vías conserva automáticamente la versión de `main`, porque el PR no tocó esos archivos desde la base común.
- **Consecuencia:** #137 no modifica ninguno de nuestros 143 archivos. `git merge-tree integration/local-p0-p5 refs/pr/137` termina **sin conflictos**.

**El riesgo real con #137 es otro.** Si alguien lo integrara «a mano» copiando las versiones que muestra la vista de GitHub (las de `09879ee`), revertiría hasta 64 commits de `main` en archivos de progreso, como `AppContext`, `localProgress`, `localLease` y `learnerModel`. Eso sí podría perder progreso. **Nunca debe resolverse con «aceptar los cambios del PR».**

## 1. Estado actual (2026-10-31, revalidado)

| | PR #137 | PR #135 |
|---|---|---|
| Título | docs(curriculum): longitudinal adaptation acceptance fixtures F15–F23 | test(b1): prove Arc 7 delayed retrieval longitudinally |
| Estado | abierto, **Draft** | abierto, listo (no Draft) |
| Rama / cabeza | `curr/longitudinal-fixtures-f15-f18-20261015-r11` @ `868e0c4` (2026-10-30) | `curr/b1-arc7-delayed-retrieval-proof` @ `5aafd16` (2026-10-06) |
| Base registrada en GitHub | `38ab2f3` | `38ab2f3` |
| Merge-base real con `main` | `09879ee` (2026-10-15) | `db53280` (2026-10-06) |
| Cambio neto frente a `main` | 234 archivos en `docs/curriculum/` (+19 839 líneas, 0 borradas) | 3 archivos (+47 / −1) |
| Mergeable según GitHub | `clean` | `clean`. Contradice el merge local (ver §3); probablemente un cálculo de GitHub desactualizado. |
| Conflicto con `main@086323c` | ninguno | **sí, en los 3 archivos** |
| Conflicto con `integration/local-p0-p5` | ninguno | sí, en los mismos 3 archivos (nuestra rama solo comparte `SessionRunner.jsx`) |
| Previews de Vercel | sí (último Preview, 2026-10-31 02:58) | — |

## 2. PR #137 — qué aporta

### 2.1 Contenido

- **207 documentos** `docs/curriculum/longitudinal-fixture-fNN-*.md`: fixtures de diseño de aceptación longitudinal (F15–F227).
- **13 JSON sintéticos** (`docs/curriculum/fixtures/f215…f227-*.synthetic.json`), todos con `"status": "DESIGN_ONLY_UNSUPPORTED"`.
- **13 scripts** `*-structural-check.mjs` que solo importan `node:fs`: validan la estructura de su propio JSON y no ejecutan el runtime.
- **1 índice modificado:** `docs/curriculum/longitudinal-adaptation-fixtures.md` (+40 líneas).

Ningún archivo es código de producción, currículo ejecutable, i18n, workflow, autenticación, RLS ni preferencias. **No toca Pre-A1, `levels.js` ni los blueprints.** Todos los archivos son LF (comprobado byte a byte con Node), así que nuestro `check-line-endings` no los rechazaría.

### 2.2 Lo valioso: documenta defectos reales de `teachingEstimates()`

Los fixtures F14–F18 describen defectos que el autor reprodujo en `09879ee`. **Los volví a ejecutar con un arnés** (`p6-pr137-probes.mjs`) que importa el `teachingPolicy.js` real, sin copiarlo ni parchearlo:

| Fixture | Defecto | `main@086323c` | `integration/local-p0-p5` |
|---|---|---|---|
| F14 | con 80 eventos en el historial, `transfer` pasa de 12 a **0** (`history.length < 80 && …`) aunque la evidencia sea la misma | se reproduce | **se reproduce** (79 → 12, 80 → 0) |
| F15 | una prueba independiente se atribuye a la prueba anterior como si fuera enseñanza (`recall`: 0 → 1 sin haber enseñado `recall`) | se reproduce | **se reproduce** |
| F16 | tres aciertos con 1 ms de diferencia, en sesiones distintas, cuentan como retención | no ejecutado: en la app real la sesión es el día de aprendizaje (`learning-day:`), lo que limita el efecto | sin cambio de diseño |
| F17 | un contexto previo desconocido (`null`) cuenta como transferencia | se reproduce | **se reproduce** (`transfer = 1`) |
| F18 | `independent: 'false'` (cadena) cuenta como independiente | se reproduce | **se reproduce** (1 frente a 0 del control booleano) |

**Ni `main` ni P0–P5 corrigen F14, F15, F17 ni F18.** P5 cambió la ponderación (`CHANGE_RUN`, el prior por habilidad), pero no estas reglas de atribución.

- **Alcance:** afectan a la **estimación de qué estrategia de enseñanza funciona**, no a XP, nivel ni hitos.
- **Otros mecanismos no dependen de esto:** la evidencia de dominio y la recuperación diferida usan `learnerModel` (`recordCanDoAttempt` y `recordDelayedRetrievalEvidence`), que exige un booleano `independent` en su propia ruta.
- **Matiz para F15:** el modelo actual registra cada observación a la vez como exposición y como prueba. Corregirlo es una **decisión de diseño**, no un parche.

#137 **no trae las correcciones**: solo los documentos y los fixtures. Corregirlas es trabajo nuevo y separado, que requiere la regla de investigación previa de `CLAUDE.md`.

### 2.3 Relación con lo que ya hicimos

| Fixture de #137 | Qué existe ya en P0–P5 |
|---|---|
| F221 · procedencia de ayudas externas | P5: `assistance` y detección de copia en `/chat`, que **solo bajan** la evidencia |
| F223 · frescura de evidencia y cambios de estado | P5: `CHANGE_RUN` en `teachingPolicy` |
| F222 · confusión al elegir método | P5 compara la política P4 con la P5 y mantiene la exploración cada n%5 |

Que existan mecanismos parecidos **no** significa que cumplan esos fixtures: los JSON piden arneses ejecutables que aún no existen.

## 3. PR #135 — qué aporta

**Objetivo:** que la evidencia de recuperación diferida de B1 Arc 7 sea realmente longitudinal. La práctica diaria pasa a llevar la frontera `learning-day:<día>` hasta `recordCanDoAttempt`.

**Cambio neto (4 commits sobre `db53280`):**

- `SessionRunner.jsx`: +3 / −1;
- `check-learner-model.mjs`: +34;
- `check-adaptive-scaffolding.mjs`: +9.

**Ya está en `main`, en una forma mejor.** El mismo día, `main` recibió `2557e42`, `58a241b` y `50e26db`:

- `PracticeTurn` recibe `sessionId` como **prop**: `sessionId={learningSessionId}` desde `SessionRunner`;
- llama a `recordDelayedRetrievalEvidence(...)` y a `recordCanDoAttempt(..., sessionId)`;
- se aplica igual en nuestra rama, en las líneas 733–734.

Pruebas: **27 de las 31 líneas** de prueba que añade #135 ya están literalmente en `main`. Las 4 restantes comprueban el texto `sessionId: learningSessionId`, que `main` sustituyó por el paso de la prop.

**La cabeza de #135 tiene un defecto latente** (análisis estático, no ejecutado en navegador):

- usa `learningSessionId` dentro de `function PracticeTurn` (línea 697), que es una función de nivel superior;
- pero la variable se declara dentro de `SessionRunner` (línea 957), y no hay ninguna otra declaración en el archivo;
- al completar una práctica de sesión con `canDoId`, saltaría un `ReferenceError`;
- sus chequeos son textuales (`runner.includes(...)`), por eso no lo detectan.

**Conflictos.** `#135` choca ya con **`main`** en sus 3 archivos, con independencia de nuestro trabajo. Con nuestra rama choca en los mismos 3; de ellos, solo `SessionRunner.jsx` lo cambiamos nosotros (en P1 y P5).

## 4. Matriz de decisiones

| Elemento | Clasificación | Motivo |
|---|---|---|
| #137 · 32 archivos de la vista de GitHub | **Ya incorporado / obsoleto en esa vista** | copias de `main@09879ee`; `main` es igual o más reciente; un merge real no los toca |
| #137 · 207 documentos de fixtures, 13 JSON y 13 scripts estructurales | **Útil y pendiente; conservar separado** | solo documentación; no choca con nada; integrable después en su propio PR de currículo, como pide `CLAUDE.md` |
| #137 · índice `longitudinal-adaptation-fixtures.md` | **Útil y pendiente** | único archivo modificado; nosotros no lo tocamos |
| #137 · defectos F14, F15, F17 y F18 que documenta | **Requiere revisión: trabajo nuevo** | se reproducen en `main` y en nuestra rama; la corrección no está en ningún PR |
| #137 · resolverlo copiando las versiones mostradas por GitHub | **Incompatible: riesgo de pérdida de progreso** | revertiría hasta 64 commits de `main` en archivos de persistencia |
| #135 · cambio de `SessionRunner.jsx` | **Obsoleto e incompatible** | ya está en `main` como prop; la versión del PR referencia una variable fuera de alcance |
| #135 · pruebas de procedencia diaria | **Ya incorporado** (27/31 líneas); el resto, **obsoleto** | las 4 líneas que faltan comprueban un texto que ya no existe |
| #135 · relación con currículo congelado, auth, RLS y preferencias | No afecta | solo toca B1 (cerrado), un componente de sesión y dos chequeos |
| #137 · relación con evaluadores, auth, RLS, preferencias y personalización | No afecta al código | describe personalización y evaluación, sin cambiarlas |

## 5. Respuestas pedidas

- **¿Qué añade cada PR?**
  - #137: documentación de aceptación longitudinal (fixtures de diseño), incluido el hallazgo útil de 4 defectos reproducibles en `teachingEstimates()`.
  - #135: procedencia diaria para la recuperación diferida en B1, que ya está en `main`.
- **¿Qué ya está en `main`?**
  - De #137, todo lo que aparece en los 32 archivos.
  - De #135, la funcionalidad completa, en mejor forma.
- **¿Qué también tenemos nosotros?** Lo mismo, porque partimos de `main@086323c`.
- **¿Qué es nuevo y valioso?** Los 234 documentos de #137 y, sobre todo, sus hallazgos F14/F15/F17/F18. De #135, nada nuevo.
- **¿Qué se contradice?** La versión de `SessionRunner.jsx` de #135 frente a `main` y nuestra rama.
- **¿Qué podría causar pérdida de progreso?** Resolver #137 aceptando las versiones de su vista de GitHub, o fusionar #135 resolviendo `SessionRunner.jsx` a su favor.
- **¿Qué modificaría el currículo congelado?** Ninguno de los dos: ni Pre-A1, ni `levels.js`, ni los blueprints.
- **¿Qué afecta a evaluadores, autenticación, RLS, preferencias o personalización?**
  - #137 solo los describe.
  - #135 toca la evidencia de recuperación diferida, que ya resolvió `main`.
- **¿Qué puede integrarse de forma segura después?**
  - #137, en un PR propio de currículo y después de esta integración: el merge de prueba con nuestra rama no tiene conflictos (§6).
  - #135, ninguna parte, salvo que su autor lo rehaga sobre `main`.

## 6. Merge de prueba de #137 sobre la rama de integración

**Cómo se hizo:**
- árbol de `git merge-tree integration/local-p0-p5 refs/pr/137` (`182f685`), sin conflictos;
- commit local `3d37aed`, guardado solo en `refs/trial/p0-p5-plus-137`, que no se publica;
- worktree desechable en el directorio temporal de la sesión, con los `node_modules` del clon enlazados.

| Comprobación sobre el árbol fusionado | Resultado |
|---|---|
| archivos frente a la rama | +232 nuevos y 1 modificado, todos en `docs/curriculum/` |
| `check:all` (por código de salida) | **100/100** |
| `npm run build` | ok |
| `npm run check:i18n` | ok |
| los 13 `docs/curriculum/fixtures/*-structural-check.mjs` de #137 | **13/13** salen con 0 |
| árbol de trabajo después | limpio (0 cambios) |

**Conclusión:** #137 puede integrarse después de esta rama sin conflictos y sin romper ninguna suite del frontend.
- Backend no ejecutado sobre este árbol: #137 no toca ningún archivo de backend.

## 7. Recomendación (decide el propietario; aquí no se cierra nada)

1. **#135:** proponer cerrarlo como **sustituido por `main`** (`2557e42`, `58a241b`, `50e26db`). No aporta nada que falte y su cabeza contiene una referencia fuera de alcance. Si se prefiere conservar algo, rehacerlo sobre `main` añadiendo solo una prueba que ejecute el componente, en lugar de comparar texto.
2. **#137:** **no bloquea** esta integración ni choca con ella. Orden sugerido:
   1. integrar primero esta rama;
   2. actualizar #137 desde `main` (un merge, **nunca** copiando sus versiones de archivos);
   3. revisarlo como PR de currículo separado.

   Abrir una tarea aparte para F14/F15/F17/F18, con la plantilla de investigación de `CLAUDE.md`.
3. **No se debe usar** «aceptar todos los cambios nuevos» ni «aceptar todos los actuales» en ninguno de los dos.
