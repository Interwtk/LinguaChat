# LinguaChat — traspaso consolidado del trabajo local (auditoría + P0…P5)

> **Fecha:** 2026-10-31.
> **Nada se ha subido.** No hubo `git init`, `clone`, `push`, `merge` ni despliegues. Las consultas a GitHub fueron **solo de lectura** (`gh api` con GET).
> **La integración remota requiere una autorización aparte.**
>
> **Diff consolidado:** `docs/audits/2026-10-31-consolidated-local-handoff.diff`. Compara este árbol con `main@086323c` y es revisable archivo por archivo.

## 1. Estado base remoto original

| Dato | Valor |
|---|---|
| Repositorio | `Interwtk/LinguaChat` |
| Base | `main@086323c41f5f93ff8af12ee70304c30b1633f2d0` (2026-10-31T03:50:42Z) — el ZIP del que salió esta carpeta, verificado byte a byte en la auditoría inicial (607 archivos, 0 diferencias) |
| `main` remoto hoy (consulta de solo lectura, 2026-10-31) | **el mismo `086323c`**: `compare` → `identical`, 0 commits por delante y 0 por detrás |

Por tanto, a día de hoy **no hay conflicto con `main`**: nadie ha cambiado `main` desde la base.

## 2. Cambios acumulados (todas las fases locales)

Se calcularon con el hash de blob de git (`sha1("blob <n>\0" + contenido)`) de cada archivo local, comparado con el árbol remoto de `086323c`.

**Se excluyen:** `node_modules`, `.venv`, `dist`, `__pycache__`, `.pytest_cache`, `.vite`, `*.pyc`, `*.zip` y los `.env` reales (no hay ninguno; los `.env.example` sí se comparan). También se excluyen estos entregables de traspaso.

| | Archivos |
|---|---|
| En `main@086323c` | 607 |
| Sin cambios | 536 |
| **Modificados** | **71** |
| **Nuevos** | **68** |
| **Eliminados** | **0** |

**Por zona:**

| Zona | Modificados | Nuevos |
|---|---|---|
| `linguachat-frontend/src` | 42 | 13 |
| `linguachat-frontend/scripts` (checks) | 19 | 21 |
| `linguachat-frontend/bench`, `prepared`, `package.json` | 1 | 5 |
| `linguachat-backend/ai`, `app` | 5 | 6 |
| `linguachat-backend/tests` | 1 | 8 |
| `.github` | 3 | 0 |
| `docs/` (auditoría, informes, diseño A1, contrato, protocolo) | 0 | 15 |

La lista completa, archivo por archivo, está en las cabeceras `diff -ruN a/… b/…` del `.diff` consolidado.

**Contenido de cada fase:**

| Fase | Informe |
|---|---|
| Auditoría | `2026-10-31-claude-local-audit.md` |
| P0 | `2026-10-31-p0-hardening.md` / `.diff` |
| P1 | `2026-10-31-p1-teaching-intelligence.md` / `.diff` |
| P2 | `2026-10-31-p2-product-hardening.md` / `.diff` |
| P3 | `2026-10-31-p3-intelligent-tutor.md` / `.diff` |
| P4 | `2026-10-31-p4-data-and-a1-foundation.md` / `.diff` |
| P5 | `2026-10-31-p5-tutor-runtime-integration.md` / `.diff` |

## 3. Los respaldos de cada fase siguen intactos

Están en `Music/LinguaChat-main/`, junto a la carpeta de trabajo. **No se tocaron.**

| Respaldo | Archivos | Comprobación | Resultado |
|---|---|---|---|
| `_originals-086323c` | 25 | cada copia tiene el hash de `main` | se usó para reconstruir los originales: 0 tuvieron que descargarse |
| `_snapshot-p0` (copia parcial: `docs`, backend, frontend) | 445 | frente a `main`: los cambios = los archivos de `p0-hardening.diff` | ✓ (la única diferencia extra es el propio informe de auditoría, anterior a P0) |
| `_snapshot-p1` | 621 | frente a P0 = `p1-teaching-intelligence.diff` | ✓ (169 «extras» faltaban en la copia parcial de P0 y son idénticos a `main`) |
| `_snapshot-p2` | 637 | frente a P1 = `p2-product-hardening.diff` | ✓ 69 = 69 |
| `_snapshot-p3` | 650 | frente a P2 = `p3-intelligent-tutor.diff` | ✓ 36 = 36 |
| `_snapshot-p4` | 663 | frente a P3 = `p4-data-and-a1-foundation.diff` | ✓ 19 = 19 |

Cada snapshot reproduce exactamente su diff registrado (comparación con finales de línea normalizados). Los originales de los 71 archivos modificados se reconstruyeron todos desde esos respaldos y se verificaron por hash; **ninguno** tuvo que pedirse a GitHub.

## 4. Seguridad del contenido que se subiría

- **Secretos.** Se escanearon los 139 archivos nuevos o modificados en busca de `sk-…`, JWT, claves privadas, `*_API_KEY=valor` y `service_role`. Hay 4 coincidencias y **ninguna es un secreto**:
  - la palabra `service_role` en dos informes, explicando que está prohibida;
  - el nombre `SUPABASE_SERVICE_ROLE` en el verificador de alcance de nube y en su test, que lo **buscan para bloquearlo**.
- **`.env`.** No hay ningún `.env` real en la carpeta; solo los dos `.env.example`, sin cambios.
- **Finales de línea.** En P5 se detectaron y corrigieron 17 archivos que las ediciones en Windows habían convertido a CRLF; 5 de ellos ya estaban en los entregables de P4. Ahora todo es LF y el nuevo `check-line-endings` (en `check:all`) lo vigila.
- **No se incluye nada de esto:**
  - los respaldos `_snapshot-*` / `_originals-*` (están fuera de la carpeta del repo);
  - los ZIP del propietario;
  - `node_modules`, `dist`, `.venv`;
  - capturas o arneses temporales. El banco visual `bench/` sí se incluye: es parte del repo desde P2, solo de desarrollo y vigilado por `check-bundle-boundaries`.

## 5. Posibles conflictos con el remoto (solo lectura)

Con `main` no hay ninguno (§1). Con los **PRs abiertos**, comparando su lista de archivos con los 139 de este trabajo:

| PR | Rama | Base | Archivos | Coinciden con este trabajo |
|---|---|---|---|---|
| #137 «docs(curriculum): longitudinal adaptation acceptance fixtures F15–F23» | `curr/longitudinal-fixtures-f15-f18-20261015-r11` | `main@38ab2f3` (anterior a la base) | 331 | **32**: `AppContext.jsx`, `localProgress.js`, `teachingPolicy.js`, `learnerModel.js`, `session.js`, `scaffolding.js`, `SessionRunner.jsx`, `EpisodeShell.jsx`, `MiniStory.jsx`, `TodayView.jsx`, `SetupFlow.jsx`, `api.js`, `missions.js`, `localLease.js`, `AuthFlow.jsx`, `App.jsx`, `MessageBubble.jsx`, `ListeningTurn.jsx`, los 8 catálogos i18n, `package.json`, `qa.yml`, 3 checks y `memoryContext.js` |
| #135 «test(b1): prove Arc 7 delayed retrieval longitudinally» | `curr/b1-arc7-delayed-retrieval-proof` | `main@38ab2f3` | 10 | **3**: `EpisodeShell.jsx`, `SessionRunner.jsx`, `learnerModel.js` |
| #134, #124, #119, #111 | ops / email / chore | — | 1–7 | 0 |

**Riesgo principal: el PR #137.**
- Es anterior a la base y toca el mismo núcleo.
- Cualquier orden de integración exige resolver esos 32 archivos **a mano, con revisión**.
- **No es seguro** dejar que una herramienta elija automáticamente «mi versión» o «la suya»: ambas cambian invariantes probados, como el ledger, el lease o la política de enseñanza.

## 6. Cómo integrar después, de forma segura (cuando se autorice)

Siguiendo `CLAUDE.md`: rama y PR, dos ciclos limpios, una sección `## Evidence` y nada directo a `main`.

1. **Trabajar en un clon nuevo** de `Interwtk/LinguaChat`, en otra carpeta. **Nunca** se hace `git init` sobre esta carpeta ni se reemplaza.
2. Crear la rama `local/p0-p5-consolidated` desde `086323c`. Hoy coincide con `main`; comprobarlo de nuevo antes de empezar.
3. **Reconstruir la historia por fases**, para que la revisión sea legible: una serie de commits copiando, en orden, cada respaldo sobre el clon y confirmando:

   | Commit | Copiar desde | Mensaje |
   |---|---|---|
   | 1 | `_snapshot-p0` | `P0 hardening` |
   | 2 | `_snapshot-p1` | `P1 teaching intelligence` |
   | 3 | `_snapshot-p2` | `P2 product hardening` |
   | 4 | `_snapshot-p3` | `P3 intelligent tutor` |
   | 5 | `_snapshot-p4` | `P4 data and A1 foundation` |
   | 6 | la carpeta de trabajo | `P5 tutor runtime integration` |

   - Cada copia excluye lo de §2 y el commit mensaje lleva la línea de atribución acordada.
   - **Nota sobre `_snapshot-p0`:** es parcial, así que en el commit 1 solo se copian sus tres carpetas.
   - **Nota sobre los finales de línea:** los snapshots P4 y anteriores contienen los archivos CRLF accidentales. Normalizar a LF antes de cada commit, por ejemplo con `.gitattributes` `* text=auto eol=lf` en el commit 1 o con un `dos2unix` previo.
4. **Alternativa más simple:** `git apply --check` y luego `git apply` con `2026-10-31-consolidated-local-handoff.diff`, en un único commit. Se pierde la granularidad por fases.
5. **Verificar en el clon:**
   - `git status` debe dar 71 modificados, 68 nuevos y 0 eliminados respecto a `086323c`;
   - escanear secretos otra vez;
   - `npm ci && npm run check:all && npm run build`;
   - `pytest`;
   - el `check:github-integration` (con `jq`).
6. **Abrir un PR borrador** con la sección `## Evidence` y los dos ciclos. Resolver primero la relación con el #137 y el #135: decidir con el propietario si se cierran, se rebasan sobre este trabajo o se integran antes.
7. **Valorar dividirlo** en PRs separados de código, i18n (las claves nuevas de los 8 idiomas) y documentación, como pide `CLAUDE.md` («curriculum work and translation work in separate PRs»). Las claves i18n de P2…P5 son pocas y van ligadas a su código; separarlas exige cuidado para que ningún PR intermedio deje claves sin traducir.
8. **No tocar** `.ai/TASKS.md` ni el resto de la coordinación autónoma sin seguir su protocolo, que es el lock del sistema de agentes.

## 7. Qué no se hizo

- No se hizo push, merge, rama remota ni PR.
- No se escribió nada en GitHub: solo hubo GET de lectura.
- No se tocaron Supabase ni Vercel.
- No se modificaron los ZIP del propietario ni los respaldos.
