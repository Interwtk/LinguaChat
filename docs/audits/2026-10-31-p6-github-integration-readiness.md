# LinguaChat — Fase 7 (P6): consolidación de P0–P5 y preparación de la integración en GitHub

> **Fecha:** 2026-10-31.
>
> **Estado: rama local preparada y verificada. Nada se ha publicado.**
> - No hubo push, PR remoto, merge, despliegue, cierre de PRs ni cambio de configuración remota.
> - GitHub solo se usó en lectura: `gh api` GET, `git clone` y `git fetch`.
> - En el clon, el push está desactivado a propósito: `remote.origin.pushurl = PUSH-DISABLED-local-integration-only`.
>
> **Entregables:**
> - este informe;
> - `2026-10-31-pr137-pr135-conflict-review.md`;
> - `2026-10-31-integration-pr-draft.md`.

## 1. Rutas

| | Ruta |
|---|---|
| Proyecto original (fuente de verdad, intacto) | `C:\Users\Sebastian Gamboa\Music\LinguaChat-main\LinguaChat-main` |
| Respaldos (intactos) | `C:\Users\Sebastian Gamboa\Music\LinguaChat-main\_originals-086323c`, `_snapshot-p0` … `_snapshot-p4` |
| **Clon de integración** (nuevo) | `C:\Users\Sebastian Gamboa\Music\LinguaChat-integration` |

**La carpeta original no se tocó:**
- no hubo `git init` ni ningún cambio dentro;
- se volvió a hashear al final de cada ciclo: 679 archivos y 29 455 904 bytes, iguales al manifiesto tomado al empezar (§4).

**Configuración local del clon** (no afecta al remoto):
- `core.autocrlf=false` y `core.eol=lf`, para que Windows no reescriba los finales de línea;
- `core.longpaths=true`, porque algunos fixtures de #137 tienen rutas largas;
- `remote.origin.pushurl` inválida, para que un push accidental falle.

## 2. Base remota verificada (solo lectura, hoy)

| Dato | Valor |
|---|---|
| Repositorio | `Interwtk/LinguaChat` (**público**) |
| `main` | `086323c41f5f93ff8af12ee70304c30b1633f2d0` (2026-10-31T03:50:42Z), el mismo que la base del ZIP |
| `compare 086323c...main` | `identical`, 0 por delante y 0 por detrás |
| PRs abiertos | #137 (Draft), #135, #134, #124 (Draft), #119 (Draft), #111 (Draft) |
| #137 | cabeza `868e0c4` (2026-10-30), merge-base real `09879ee` |
| #135 | cabeza `5aafd16` (2026-10-06), merge-base real `db53280` |

El clon recién hecho tenía `HEAD = 086323c`, 607 archivos y un árbol de trabajo limpio.

## 3. Rama local preparada

**Rama:** `integration/local-p0-p5`, creada desde `086323c` y **sin upstream** (no rastrea ninguna rama remota).

| # | Commit | Contenido | Archivos | Origen |
|---|---|---|---|---|
| 1 | `ad8b061` | auditoría previa (solo el documento) | 1 | `_snapshot-p0` |
| 2 | `60542ee` | **P0** integridad inicial | 22 | `_snapshot-p0` (copia parcial: docs, backend, frontend) |
| 3 | `acb0f06` | **P1** inteligencia pedagógica | 36 | `_snapshot-p1` |
| 4 | `8395e6f` | **P2** endurecimiento del producto | 71 | `_snapshot-p2` |
| 5 | `a9f5bac` | **P3** tutor y currículo | 38 | `_snapshot-p3` |
| 6 | `64f9b02` | **P4** persistencia y preparación A1 (A1 cerrado) | 21 | `_snapshot-p4` |
| 7 | `b9d3065` | **P5** evaluador en `/chat` y nivel individual | 58 | la carpeta de trabajo |
| 8 | el commit que añade estos informes (su hash se da en el resumen final) | estos tres informes de P6 (artefactos de integración) | 3 | escritos en el clon |

- Árbol del commit 7: `d14ee11215611d4b1f4d2e4bbb350a4f0f351159`.
- **Autor:** cada commit lleva la identidad de la configuración global de git de esta máquina, más la línea `Co-Authored-By: Claude Opus 5.5`. Las fechas son las reales de hoy; no se fingió ninguna fecha histórica.

**Refs que solo existen en el clon y nunca deben publicarse:**
- `refs/pr/137` y `refs/pr/135`: lectura de los PRs;
- `refs/trial/p0-p5-plus-137`: merge de prueba, §12.

## 4. Comparación de hashes

Método:
- hash de blob de git (`sha1("blob <n>\0" + bytes)`) de cada archivo;
- se excluyen solo `node_modules`, `.venv`, `dist`, `__pycache__`, `.pytest_cache`, `.git`, `.vite`, `*.pyc`, `*.zip` y los `.env` reales (no hay ninguno);
- script: `p6-compare-trees.mjs`, salida literal en el anexo.

| Comparación | Archivos | Bytes | Solo en fuente | Solo en rama | Distintos | Resultado |
|---|---|---|---|---|---|---|
| carpeta original ahora vs manifiesto inicial | 679 | 29 455 904 | 0 | 0 | 0 | **IGUAL** |
| **`integration/local-p0-p5` (commit 7) vs carpeta original** | 679 | 29 455 904 | 0 | 0 | 0 | **IGUAL** |
| commit P0 vs `_snapshot-p0` (archivos de la copia parcial) | 445 | 21 034 420 | 0 | 0 | 0 | IGUAL |
| commit P1 vs `_snapshot-p1` | 621 | 23 774 737 | 0 | 0 | 0 | IGUAL |
| commit P2 vs `_snapshot-p2` | 637 | 24 532 738 | 0 | 0 | 0 | IGUAL |
| commit P3 vs `_snapshot-p3` | 650 | 24 952 804 | 0 | 0 | 0 | IGUAL |
| commit P4 vs `_snapshot-p4` | 663 | 25 303 775 | 0 | 0 | 0 | IGUAL |
| cabeza final (commit 8) vs carpeta original | 679 iguales + 3 informes P6 (único extra documentado); comprobado después del commit (salida en el resumen final, no aquí, porque el informe forma parte de ese commit) | | | | | solo difiere en los 3 informes P6 documentados |

Notas sobre los snapshots:
- Se comparan con los CRLF accidentales normalizados a LF (ver §6).
- Cada commit de fase también reproduce **exactamente** la lista de archivos de su `.diff` registrado en `docs/audits`: 0 de más y 0 de menos en las seis fases. Los extras son solo el propio informe y el propio diff de la fase, y en P5 además los dos entregables del traspaso.

## 5. Archivos añadidos, modificados y eliminados

| | Archivos |
|---|---|
| frente a `main@086323c`, en el commit 7 | **71 modificados, 72 añadidos, 0 eliminados** (143) |
| de ellos, código, tests y documentos de fase | 71 modificados, 68 añadidos |
| entregables del traspaso de P5 (`p5-…md/.diff`, `consolidated-local-handoff.md/.diff`) | 4 añadidos |
| commit 8 (estos informes) | 3 añadidos |

Comparado con el traspaso consolidado, que contó 71 y 68 **excluyendo** sus propios 4 entregables, las listas coinciden archivo por archivo (`matchesHandoff: true`). **No hay ninguna diferencia nueva que explicar.**

| Comprobación previa (carpeta original) | Resultado |
|---|---|
| Finales de línea | 0 archivos con CRLF |
| Dependencias | `package-lock.json`, `requirements.txt` (raíz y backend) **sin cambios** frente a `main`; solo `package.json` cambia (los scripts de `check:all`) |
| Archivos temporales accidentales (`.log`, capturas, `.tmp`, `.bak`, `.orig`…) | 0 |
| Ignorados presentes en la carpeta y no copiados | `node_modules`, `dist`, `.venv`, 7 `__pycache__`, `.pytest_cache` |
| Secretos | 0 valores. 7 coincidencias de texto: `service_role` en 5 informes que lo describen como prohibido, y `SUPABASE_SERVICE_ROLE` en el verificador de alcance y su test, que lo bloquean |
| Instalación reproducible en el clon | `npm ci` desde el lockfile; venv nuevo de Python 3.12.14 (la misma versión que el original) con `pip install -r requirements.txt`. **`pip freeze` es idéntico** al del venv original (30 paquetes) |

## 6. Estrategia de commits

**Se reconstruyeron los seis commits por fase**, y no un único commit consolidado. Es seguro y verificable:

- Cada snapshot se tomó al final de su fase.
- Los snapshots se habían verificado en P5 contra los diffs registrados, y hoy otra vez (§4).
- Ningún commit inventa contenido: cada árbol es exactamente su respaldo, y el último es la carpeta original.
- La revisión gana: cada commit enlaza a su informe y a su diff.

**Detalles:**

- **Respaldo parcial de P0.** `_snapshot-p0` solo copió `docs`, el backend y el frontend. En una primera pasada el script trató los archivos ausentes como borrados, y P0 aparecía con 89 eliminaciones que P1 «restauraba».
  - Lo detecté al compararlo con el diff registrado (89 extras).
  - Rehíce la rama: en un respaldo parcial, la ausencia no significa borrado.
  - El resultado final tiene 0 eliminaciones y coincide exactamente con el diff de P0. La rama defectuosa se borró y nunca salió de la máquina.
- **CRLF.** Solo hubo que normalizar **5 archivos**, en el commit P4: el informe P4, `evaluator_adapters.py`, `evaluator_contract.py`, `test_evaluator_contract.py` y `check-personalization-longitudinal.mjs`. Son los que P5 detectó y corrigió.
  - La normalización solo cambia los CRLF por LF; no toca ningún otro byte.
  - Los snapshots P0–P3 no tenían ninguno.
  - **No se añadió `.gitattributes`**, para no cambiar el comportamiento del repositorio.
- **El commit de la auditoría** va separado de P0, porque es anterior a P0 y es solo un documento.

## 7. QA completo

Todo se ejecutó **en el clon**, no en la carpeta original, con el script `cycle-p6.sh`:

- dependencias recién instaladas;
- `LINGUACHAT_PROVIDER=local`;
- cada suite contada por su código de salida.

Hubo dos ciclos completos seguidos, sin ningún cambio en la rama entre ellos. Ambos verificaron que el commit y el árbol no cambiaron durante el ciclo.

| Suite | Línea base P5 | Ciclo 1 | Ciclo 2 |
|---|---|---|---|
| cabeza / árbol / limpio | — | `b9d3065` / `d14ee11` / 0 sucios antes y después | `b9d3065` / `d14ee11` / 0 sucios antes y después |
| frontend `check:all` (por código de salida) | 100/100 | **100/100** (los mismos 100 nombres que P5) | 100/100 |
| build | ok | **ok** (entrada 730,9 kB, presupuesto 850; 66 chunks) | ok (entry 730.9 kB / 850) |
| `check:i18n` (8 idiomas) | ok | **ok** | ok |
| currículo Foundry `b1`/`b2`/`c1`/`c2` + `a2-structure` | ok | **5/5 ok** | 5/5 |
| integridad / concurrencia completa (`check-ledger-integrity`) | 30/30 | **29/29 + 1 NOT_TESTED** (ver nota) | 29/29 + 1 NOT_TESTED ¹ |
| la misma, con el árbol P3 extraído de git (`a9f5bac`) | — | **30/30** (incluido «a v1 record plus P3-written copies migrate exactly; … a rollback reads them back») | |
| política de adaptación (antigua vs nueva) | 10/10 | **10/10** | 10/10 |
| alcance de nube: self-test, tests y escaneo | ok | **ok** (ahora en modo git: `scanning git ls-files`) | ok |
| backend `compileall` | ok | **ok** | ok |
| backend `pytest` | 1241 / 28 omitidas | **1241 / 28 omitidas** | 1241 passed / 28 skipped |
| contrato del evaluador (dentro de pytest: `test_evaluator_contract`, `test_chat_runtime`) | ok | **ok** | **ok** |
| HTTP real (uvicorn local): tutor / continuidad | 4/4 · 5/5 | **4/4 · 5/5** | 4/4 · 5/5 |
| plantillas de correo | ok | **ok** | ok |
| garantías del producto (`p6-guarantees.mjs`, §8) | — | **16/16** | 16/16 |
| job `guards` de `qa.yml`, reproducido paso a paso | — | **8/8** (+1 N/A: foundry-scope, solo para ramas `foundry/*`) | 8/8 |
| escaneo de secretos de los archivos cambiados | 0 | **0** | **0** |
| igualdad de bytes con la carpeta original | — | **IGUAL** | EQUAL (679 / 0 differ) |
| `check:github-integration` | BLOCKED | **BLOCKED**: falta `jq`; no se debilitó el control; lo corre CI | BLOCKED |

**Nota sobre integridad (29 + 1 NOT_TESTED):**
- **Por qué:** el escenario «migración desde P3 y vuelta atrás» busca `../_snapshot-p3` **junto al proyecto**. En la carpeta original existe; en el clon, no. El script lo dice honestamente (`NOT_TESTED`) y no lo da por superado.
- **No es una regresión del código.** Para cubrirlo extraje el árbol P3 desde el propio historial de la rama (`git archive a9f5bac`) junto a un worktree de la rama, y ejecuté la suite completa. Resultado: **30/30** (incluido «a v1 record plus P3-written copies migrate exactly; … a rollback reads them back»).
- **Consecuencia para CI:** en GitHub Actions ese escenario **tampoco correrá nunca**, porque no hay ningún snapshot en el repositorio. Ver §11.

**Comportamiento del bundle:** `check-bundle-boundaries` pasa y el banco de desarrollo no aparece en `dist`, comprobado tanto por nombre como por contenido.

## 8. Guardas de seguridad y garantías del producto

`p6-guarantees.mjs` las comprueba directamente sobre la rama, importando los módulos reales cuando es posible. **Todas pasan:**

| Garantía | Cómo se comprobó | Resultado |
|---|---|---|
| `CLOUD_PREFERENCES_RELEASED=false` | importando `src/cloud/runtime.js` | PASS |
| Pre-A1 congelado | `preA1Map.js`, `preA1Skeleton.generated.js`, `preA1Content.js`, `pre-a1-freeze.md`, `pre-a1-map.md`: diff vacío frente a `main`; además `check-pre-a1-freeze` dentro de `check:all` | PASS |
| A1–C2 cerrados | importando `levels.js`: solo `pre_a1` disponible; además el paso «A1 must still be closed» de `guards` | PASS |
| A1 readiness aislada en `prepared/` | existe `prepared/a1Readiness.js`; ningún archivo de `src/` importa `prepared/` | PASS |
| blueprints sin tocar | `a1-blueprint.json` y `blueprints/`: diff vacío | PASS |
| Lingua tutora única, Chatto mascota | ningún «Lingo» en cadenas de UI; `check-visual-identity` dentro de `check:all` | PASS |
| ocho idiomas auxiliares | `translations.js` + 7 locales (ar, de, es, fr, it, ja, pt); `check:i18n` | PASS |
| evaluador local conectado a `/chat` | `local_engine.py` importa y llama a `evaluate_chat_turn`; HTTP real 4/4 | PASS |
| sin proveedores comerciales | `DEFAULT_MODE = MODE_LOCAL`; tests de `provider_policy` en pytest | PASS |
| progreso por eventos con aislamiento de cuenta | `check-ledger-integrity` + `check-session-surfaces` | PASS |
| compatibilidad con formatos anteriores | escenario de migración v1/P3 en la integridad | **30/30** (incluido «a v1 record plus P3-written copies migrate exactly; … a rollback reads them back») |
| sin recompensas duplicadas | escenarios de integridad («nothing paid twice») | PASS |
| detección de ayuda y copia | `check-chat-observations` + `test_chat_runtime` | PASS |
| incertidumbre pedagógica, memoria entre días, adaptación por habilidad | `check-adaptation-policy` 10/10 + los chequeos de `teachingPolicy` en `check:all` | PASS |
| nivel individual derivado, sin saltarse gates | `check-learner-level` + `check-placement-honesty` | PASS |
| banco de desarrollo fuera del bundle | `check-bundle-boundaries` + inspección de `dist` | PASS |
| nada prohibido versionado (deps, builds, `.env`, ZIP, respaldos) | `git ls-files` | PASS |
| 0 CRLF versionados | `git ls-files --eol` | PASS |

**Ninguna garantía retrocedió. Nada bloquea la integración por este motivo.**

## 9. Resultado: las seis fases integradas

**Sí, localmente.**
- La rama contiene la auditoría, P0, P1, P2, P3, P4 y P5, cada fase en su commit.
- El árbol final del código es **idéntico byte a byte** a la carpeta de desarrollo.
- Dos ciclos completos de QA seguidos pasaron en el clon, recién instalado.

## 10. Diferencias no explicadas

**Ninguna.** Las únicas diferencias encontradas están todas explicadas:

1. **Integridad 29 + 1 NOT_TESTED, frente a 30 en la carpeta original.** Es el entorno (no hay `_snapshot-p3` al lado del clon), no el código. Se cubrió desde el historial git (§7).
2. **El cloud-scope** imprime `scanning git ls-files` en vez de `scanning working tree`, porque ahora hay checkout de git. Es el modo que usa CI.
3. **El traspaso decía «32 archivos compartidos con #137».** Revalidado: era una vista desactualizada de GitHub. El merge real comparte **0** (ver la revisión de conflictos, §0).

## 11. Riesgos para producción

| Riesgo | Detalle | Mitigación |
|---|---|---|
| Vercel Preview al publicar la rama | Vercel ha creado un Preview para cada commit empujado a cualquier rama (por ejemplo, los de #137, el 2026-10-31). Ese Preview ejecuta `npm ci && npm run build` y despliega `api/index.py` con el backend. | Producción solo se despliega desde `main`. Revisar el Preview antes de marcar el PR como listo. |
| Variables de entorno de Preview | **No se pueden verificar** sin entrar en Vercel. | `provider_policy` exige un modo explícito; una clave sola no activa OpenAI (tests en pytest). |
| Protección de los Preview | No verificable. | Decisión del propietario. |
| Repositorio público | Publicar la rama expone los commits y su autor. | Revisar la identidad del autor antes del push. |
| Vuelta atrás de datos hasta `main@086323c` | Está probado que el código de P3 lee lo que escribe el ledger P4; que lo lea el código de `086323c` **no está probado**. | Añadir esa prueba antes de fusionar, si se exige una reversión total sin pérdida. |
| Pérdidas residuales documentadas en P5 §F | Por ejemplo, una pestaña cerrada antes de cualquier guardado. | Sin cambios; declaradas. |
| Defectos de `teachingEstimates()` (F14/F15/F17/F18 de #137) | Presentes en `main` y en la rama; afectan a la elección de estrategia, no a XP, nivel ni hitos. | Tarea aparte. |
| El escenario de rollback P3 no corre en CI | El script lo reporta como NOT_TESTED allí. | Se puede corregir en un PR aparte (por ejemplo, con la ruta por argumento); no se cambió ahora. |

## 12. Riesgos de conflictos

| Contra | Resultado (`git merge-tree`, sin tocar árboles de trabajo) |
|---|---|
| `main@086323c` | ninguno: la rama sale de ahí y `main` no ha cambiado |
| PR #137 | **ninguno**: 232 docs nuevos y 1 doc modificado que no tocamos. **Merge de prueba en un worktree desechable:** **`check:all` 100/100, build ok, i18n ok, 13/13 chequeos estructurales de #137, sin conflictos** |
| PR #135 | conflicto en sus 3 archivos, **también con `main`**. Su funcionalidad ya está en `main` (ver la revisión de conflictos) |
| #134, #124, #119, #111 | 0 archivos en común (traspaso anterior; no cambió) |

**Coordinación `.ai/`:**
- `TASKS.md`, `STATE.md` y `HANDOFF.md` en `main` están **desactualizados**: dicen que #123 sigue en Draft y que `LC-CLOUD-001` está IN_PROGRESS, pero #123 se fusionó el 2026-10-31 a las 03:50 UTC.
- Esta rama **no los modifica**: su actualización corresponde al protocolo de coordinación y al propietario.
- `main` ya no contiene los workflows de la cadena autónoma (solo `qa.yml`, `cloud-preferences-qa.yml` y dos de auth manuales), así que ningún trabajador automático reaccionará al push.

## 13. Estado de Vercel y CI (comprobado sin modificar nada)

- **`vercel.json`:** `buildCommand: cd linguachat-frontend && npm ci && npm run build`, salida `linguachat-frontend/dist`, función `api/index.py` con `linguachat-backend/**`.
- **Despliegues** (`gh api …/deployments`): `Production` para `086323c` (el `main` actual) y `Preview` para cada commit de PR. Los crea `vercel[bot]`, con los entornos `Preview` y `Production`.
- **Webhooks del repositorio:** ninguno visible. La integración con Vercel es una GitHub App.
- **Checks en una cabeza de PR (#137):**
  - `frontend — checks and build`, `backend — compile and tests`, `guards`: los tres en success;
  - `evidence`, `qa-cycle` y `handoff`: skipped en Draft;
  - además, `Vercel Preview Comments`.
- **Lo que haría cada acción:**
  - **Push de la rama:** un Vercel Preview y **ningún** workflow de Actions, porque `qa.yml` solo escucha `push` en `main`.
  - **Abrir el PR en Draft:** `frontend`, `backend` y `guards`. `cloud-preferences-qa` **no** se dispara, porque la rama no cambia ninguna de sus rutas.
  - **Marcarlo como listo:** además `evidence`, que exige `## Evidence` en la descripción, y `qa-cycle`.
  - `merge_handoff` solo se dispara con un `workflow_dispatch` manual, y el workflow al que llama (`qa-merge-handoff.yml`) **no existe** en `main`. **Ningún flujo fusiona solo.**
- **Cambio de esta rama en `qa.yml`** (de P2): solo **añade** el paso `npm run check:github-integration` al job `frontend`. No cambia disparadores, permisos ni condiciones; endurece CI, no lo relaja.
- **Diferencia de entorno:** CI usa Node 22 y Python 3.12; aquí se usaron Node 24.14.1 y Python 3.12.14.

## 14. Pasos pendientes para abrir el PR remoto (cuando se autorice)

1. **Decidir la identidad del autor.** Si se prefiere el correo `noreply` de GitHub, reescribir el autor de los 8 commits en local y repetir la verificación de hashes de §4. El contenido de los árboles no cambia.
2. **Decidir si los `.diff` de auditoría van en el PR.** Son unos 4,8 MB y 96 000 líneas, y duplican el historial. Si se quitan, la igualdad con la carpeta original pasa a excluirlos y hay que documentarlo.
3. En el clon, restaurar la URL de push: `git remote set-url --push origin https://github.com/Interwtk/LinguaChat.git`.
4. `git fetch origin` y confirmar que `main` sigue en `086323c`. Si avanzó, hacer merge (no rebase) de `main` y repetir los dos ciclos.
5. `git push -u origin integration/local-p0-p5`. Solo esa rama; **nunca** `refs/pr/*` ni `refs/trial/*`.
6. Crear el PR en **Draft** con el título y el cuerpo de `2026-10-31-integration-pr-draft.md`: la parte bajo la línea `---`, completando el hash del commit 8.
7. Esperar a CI. En particular, que `check:github-integration` (con `jq`) pase en `frontend`.
8. Revisar el Vercel Preview a 390 y 1440 px.
9. Pasar el PR a listo y lanzar el segundo ciclo, según el protocolo de `CLAUDE.md`.
10. Fusión: decisión del propietario.

## 15. Condiciones que impedirían la fusión

- Cualquier fallo de `check:all`, build, i18n, pytest, `guards` o `check:github-integration` en CI.
- Que `main` avance y el merge produzca conflictos, o que los ciclos no se repitan después de actualizar.
- Que `levels.js` muestre algún nivel distinto de Pre-A1 con `available: true`, o que `CLOUD_PREFERENCES_RELEASED` cambie.
- Que la igualdad de bytes con la carpeta original falle por algo que no sea un artefacto documentado.
- Que el Preview muestre regresiones visuales (desbordes, claves sin traducir, RTL roto).
- Que falte `## Evidence` en la descripción del PR (lo exige `qa.yml`).
- Que el propietario no haya decidido sobre #135, para no fusionarlo después por error, y sobre la actualización de `.ai/`.
- Que el propietario exija probar la vuelta atrás de datos hasta `main@086323c` y esa prueba falle o no exista.

## Anexo — salidas literales

### Verificación inicial de la carpeta original (`p6-verify-original.mjs`)

```
{
 "files": 679,
 "handoffDeliverablesPresent": 4,
 "counts": {
  "added": 68,
  "modified": 71,
  "deleted": 0
 },
 "matchesHandoff": {
  "added": true,
  "modified": true,
  "deleted": true
 },
 "addedNotInHandoff": [],
 "modifiedNotInHandoff": [],
 "crlf": [],
 "temp": [],
 "secretHits": [
  "docs/audits/2026-10-31-claude-local-audit.md :: service_role",
  "docs/audits/2026-10-31-p4-data-and-a1-foundation.md :: service_role",
  ".github/scripts/check-linguachat-cloud-scope.mjs :: SUPABASE_SERVICE_ROLE",
  ".github/scripts/check-linguachat-cloud-scope.test.mjs :: SUPABASE_SERVICE_ROLE",
  "docs/audits/2026-10-31-consolidated-local-handoff.md :: service_role",
  "docs/audits/2026-10-31-consolidated-local-handoff.diff :: service_role",
  "docs/audits/2026-10-31-p5-tutor-runtime-integration.md :: service_role"
 ],
 "skippedDirs": [
  "linguachat-backend/.pytest_cache",
  "linguachat-backend/.venv",
  "linguachat-backend/ai/__pycache__",
  "linguachat-backend/app/models/__pycache__",
  "linguachat-backend/app/routes/__pycache__",
  "linguachat-backend/app/services/__pycache__",
  "linguachat-backend/app/__pycache__",
  "linguachat-backend/tests/__pycache__",
  "linguachat-backend/__pycache__",
  "linguachat-frontend/dist",
  "linguachat-frontend/node_modules"
 ],
 "skippedFiles": [],
 "lockfiles": [
  "linguachat-backend/requirements.txt unchanged",
  "linguachat-frontend/package-lock.json unchanged",
  "requirements.txt unchanged"
 ],
 "packageJson": [
  "linguachat-frontend/package.json MODIFIED"
 ]
}
```

### Reconstrucción por fases (`p6-rebuild-phases.mjs`, resumen)

```
docs(audit): local audit of main@086323c before P0         changed   1 A  1 M  0 D 0 | CRLF->LF 0 | vs recorded diff: n/a (document only)
P0: initial integrity hardening                            changed  22 A  6 M 16 D 0 | CRLF->LF 0 | vs recorded diff: recorded 20, extra 0, missing 0
P1: teaching intelligence                                  changed  36 A  7 M 29 D 0 | CRLF->LF 0 | vs recorded diff: recorded 34, extra 0, missing 0
P2: product hardening                                      changed  71 A 16 M 55 D 0 | CRLF->LF 0 | vs recorded diff: recorded 69, extra 0, missing 0
P3: tutor and curriculum                                   changed  38 A 13 M 25 D 0 | CRLF->LF 0 | vs recorded diff: recorded 36, extra 0, missing 0
P4: persistence and A1 preparation (A1 stays closed)       changed  21 A 13 M  8 D 0 | CRLF->LF 5 | vs recorded diff: recorded 19, extra 0, missing 0
P5: local evaluator in /chat and individual learner level  changed  58 A 16 M 42 D 0 | CRLF->LF 0 | vs recorded diff: recorded 54, extra 0, missing 0
```

### Ciclo 1 (`cycle-p6.sh c1`)

```
head b9d30650c44b53d7a8cade59a2b1a9be4ea5504d tree d14ee11215611d4b1f4d2e4bbb350a4f0f351159 branch integration/local-p0-p5 dirty=0
check:all exit=0 :: check:all — 100/100 green in 166s
build exit=0 :: dist/assets/index-JGjiU3Xu.js 221.02 kB │ gzip: 57.85 kB
check:i18n exit=0
check:github-integration exit=1 :: check-merge-blocker-gate — cannot run here: needs jq (GitHub-integration check; runs in CI)
foundry b1 exit=0
foundry b2 exit=0
foundry c1 exit=0
foundry c2 exit=0
foundry a2-structure exit=0
ledger-integrity (full) exit=0 :: check-ledger-integrity — 29 passed, 0 failed
adaptation-policy exit=0 :: check-adaptation-policy — 10 passed, 0 failed
cloud-scope exit=0 :: check-linguachat-cloud-scope — scanning git ls-files
cloud-scope --self-test exit=0
cloud-scope tests exit=0
compileall exit=0
pytest exit=0 :: 1241 passed, 28 skipped in 9.43s
e2e-tutor-runtime (HTTP) exit=0 :: e2e-tutor-runtime — 4 passed, 0 failed  (http://127.0.0.1:8768)
e2e-chat-continuity (HTTP) exit=0 :: e2e-chat-continuity — 5 passed, 0 failed  (http://127.0.0.1:8768)
email exit=0
guarantees exit=0 :: guarantees — 16 passed, 0 failed
tree-compare exit=0 :: EQUAL  branch integration/local-p0-p5 vs working folder: 679 files / 29455904 bytes; branch 679; onlySource 0 onlyBranch 0 differ 0
after: dirty=0 head b9d30650c44b53d7a8cade59a2b1a9be4ea5504d
```

### Ciclo 1 — guards de `qa.yml` reproducidos

```
PASS A1 must still be closed to learners
PASS cloud/Auth scope stays public-client only (git mode)
PASS native listening only; no recording or remote voice
PASS TTS stays inside the device adapter
PASS no build output, archives or env files tracked
PASS the coordination files exist
PASS the task queue keeps its structural boundaries
PASS foundry automation contract is internally valid
N/A  foundry PR scope (branch is not foundry/*)
ci-guards — all passed
```

### Ciclo 1 — garantías

```
PASS CLOUD_PREFERENCES_RELEASED === false
PASS only Pre-A1 available; A1–C2 closed — open=pre_a1
PASS A1 contentStatus partial
PASS frozen curriculum paths exist
PASS Pre-A1 content, freeze docs and blueprints untouched vs main
PASS prepared/a1Readiness.js isolated (no src import)
PASS no "Lingo" in UI strings
PASS eight auxiliary languages (en + 7 locales) — ar.js,de.js,es.js,fr.js,it.js,ja.js,pt.js
PASS local evaluator wired into /chat (evaluate_chat_turn)
PASS provider default is local
PASS check:all keeps the guarantee suites
PASS check:all step count is 100 — 100
PASS dev bench absent from production bundle
PASS no forbidden tracked paths (deps, builds, env, zips, backups)
PASS no CRLF in tracked text
PASS secret scan over changed files: no key/token/JWT/private key values
guarantees — 16 passed, 0 failed
```

### Ciclo 1 — comparación de árboles

```
EQUAL  working folder now vs step-1 manifest: 679 files / 29455904 bytes; branch 679; onlySource 0 onlyBranch 0 differ 0
EQUAL  branch integration/local-p0-p5 vs working folder: 679 files / 29455904 bytes; branch 679; onlySource 0 onlyBranch 0 differ 0
EQUAL  P0: commit 60542ee vs _snapshot-p0 (LF): 445 files / 21034420 bytes; branch 445; onlySource 0 onlyBranch 0 differ 0
EQUAL  P1: commit acb0f06 vs _snapshot-p1 (LF): 621 files / 23774737 bytes; branch 621; onlySource 0 onlyBranch 0 differ 0
EQUAL  P2: commit 8395e6f vs _snapshot-p2 (LF): 637 files / 24532738 bytes; branch 637; onlySource 0 onlyBranch 0 differ 0
EQUAL  P3: commit a9f5bac vs _snapshot-p3 (LF): 650 files / 24952804 bytes; branch 650; onlySource 0 onlyBranch 0 differ 0
EQUAL  P4: commit 64f9b02 vs _snapshot-p4 (LF): 663 files / 25303775 bytes; branch 663; onlySource 0 onlyBranch 0 differ 0
```

### Extra — integridad con P3 extraído de git y merge de prueba con #137

```
ledger (P3 tree from git a9f5bac beside a branch worktree) exit=0 :: check-ledger-integrity — 30 passed, 0 failed
  ok  a v1 record plus P3-written copies migrate exactly; an interrupted migration changes nothing; a rollback reads them back
trial head 3d37aed
trial137 check:all exit=0 :: check:all — 100/100 green in 147s
trial137 build exit=0
trial137 i18n exit=0
     13 0 docs/curriculum/fixtures/f215-cross-language-structural-check.mjs
trial dirty after: 0
```

### Extra — sondas F14/F15/F17/F18 de #137 sobre la rama

```
== integration/local-p0-p5
[
 {
  "fixture": "F14 bounded history erases transfer",
  "at79": 12,
  "at80": 0,
  "reproduced": true
 },
 {
  "fixture": "F15 probe becomes a teaching exposure",
  "recallCountBefore": 0,
  "recallCountAfter": 1,
  "reproduced": true
 },
 {
  "fixture": "F17 unknown prior context = transfer",
  "transfer": 1,
  "reproduced": true
 },
 {
  "fixture": "F18 independent:'false' counted",
  "controlCount": 0,
  "stringCount": 1,
  "reproduced": true
 }
]
== main@086323c (teachingPolicy.js + variation.js via git show)
[
 {
  "fixture": "F14 bounded history erases transfer",
  "at79": 12,
  "at80": 0,
  "reproduced": true
 },
 {
  "fixture": "F15 probe becomes a teaching exposure",
  "recallCountBefore": 0,
  "recallCountAfter": 1,
  "reproduced": true
 },
 {
  "fixture": "F17 unknown prior context = transfer",
  "transfer": 1,
  "reproduced": true
 },
 {
  "fixture": "F18 independent:'false' counted",
  "controlCount": 0,
  "stringCount": 1,
  "reproduced": true
 }
]
```

### Ciclo 2 (`cycle-p6.sh c2`)

```
head b9d30650c44b53d7a8cade59a2b1a9be4ea5504d tree d14ee11215611d4b1f4d2e4bbb350a4f0f351159 branch integration/local-p0-p5 dirty=0
check:all exit=0 :: check:all — 100/100 green in 139s
build exit=0 :: dist/assets/index-JGjiU3Xu.js 221.02 kB │ gzip: 57.85 kB
check:i18n exit=0
check:github-integration exit=1 :: check-merge-blocker-gate — cannot run here: needs jq (GitHub-integration check; runs in CI)
foundry b1 exit=0
foundry b2 exit=0
foundry c1 exit=0
foundry c2 exit=0
foundry a2-structure exit=0
ledger-integrity (full) exit=0 :: check-ledger-integrity — 29 passed, 0 failed
adaptation-policy exit=0 :: check-adaptation-policy — 10 passed, 0 failed
cloud-scope exit=0 :: check-linguachat-cloud-scope — scanning git ls-files
cloud-scope --self-test exit=0
cloud-scope tests exit=0
compileall exit=0
pytest exit=0 :: 1241 passed, 28 skipped in 8.69s
e2e-tutor-runtime (HTTP) exit=0 :: e2e-tutor-runtime — 4 passed, 0 failed  (http://127.0.0.1:8665)
e2e-chat-continuity (HTTP) exit=0 :: e2e-chat-continuity — 5 passed, 0 failed  (http://127.0.0.1:8665)
email exit=0
guarantees exit=0 :: guarantees — 16 passed, 0 failed
tree-compare exit=0 :: EQUAL  branch integration/local-p0-p5 vs working folder: 679 files / 29455904 bytes; branch 679; onlySource 0 onlyBranch 0 differ 0
after: dirty=0 head b9d30650c44b53d7a8cade59a2b1a9be4ea5504d
ci-guards exit=0
```

### Ciclo 2 — guards de `qa.yml` reproducidos

```
PASS A1 must still be closed to learners
PASS cloud/Auth scope stays public-client only (git mode)
PASS native listening only; no recording or remote voice
PASS TTS stays inside the device adapter
PASS no build output, archives or env files tracked
PASS the coordination files exist
PASS the task queue keeps its structural boundaries
PASS foundry automation contract is internally valid
N/A  foundry PR scope (branch is not foundry/*)
ci-guards — all passed
```

### Ciclo 2 — comparación de árboles

```
EQUAL  working folder now vs step-1 manifest: 679 files / 29455904 bytes; branch 679; onlySource 0 onlyBranch 0 differ 0
EQUAL  branch integration/local-p0-p5 vs working folder: 679 files / 29455904 bytes; branch 679; onlySource 0 onlyBranch 0 differ 0
EQUAL  P0: commit 60542ee vs _snapshot-p0 (LF): 445 files / 21034420 bytes; branch 445; onlySource 0 onlyBranch 0 differ 0
EQUAL  P1: commit acb0f06 vs _snapshot-p1 (LF): 621 files / 23774737 bytes; branch 621; onlySource 0 onlyBranch 0 differ 0
EQUAL  P2: commit 8395e6f vs _snapshot-p2 (LF): 637 files / 24532738 bytes; branch 637; onlySource 0 onlyBranch 0 differ 0
EQUAL  P3: commit a9f5bac vs _snapshot-p3 (LF): 650 files / 24952804 bytes; branch 650; onlySource 0 onlyBranch 0 differ 0
EQUAL  P4: commit 64f9b02 vs _snapshot-p4 (LF): 663 files / 25303775 bytes; branch 663; onlySource 0 onlyBranch 0 differ 0
```

