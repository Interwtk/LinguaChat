# Solicitud de autorización: publicar dos PR en borrador

> 2026-11-07, verificación de solo lectura en `Music\LinguaChat-integration`. **No se ejecutó nada remoto** salvo `git fetch origin` y `gh` de lectura (GET). Push sigue deshabilitado (`pushurl = PUSH-DISABLED-local-integration-only`). Procedimiento base: `docs/release/2026-11-pr-procedure.md`.
>
> **Aviso:** otro agente sigue haciendo commits en `beta/2026-11-es-for-en`. Las cifras de PR B corresponden a `d421f0d`, la punta que había al verificar. Al cerrar este documento, la punta ya era `0b6dafd` (18:23, 51 commits), con dos commits más de código `beta6` (`6864e7b`, `0b6dafd`). Cambiarán otra vez.

## Resumen

- El repositorio `Interwtk/LinguaChat` es **público**. Hacer *push* publica el contenido y los metadatos de autor de 57 commits.
- Un *push* de estas ramas no dispara ningún workflow de GitHub Actions. Abrir un PR en borrador ejecuta solo los jobs `frontend`, `backend` y `guards` de `qa.yml`, sin secretos, sin despliegues y sin comentarios propios.
- **Vercel sí actúa:** cada *push* crea un despliegue **Preview**, y `vercel[bot]` comenta en cada PR. No se pudo comprobar si las Preview son privadas.
- No hay secretos detectados, no hay `.env` reales en el repositorio, no hay migraciones y no hay dependencias nuevas.
- PR B incluye código posterior al último commit probado (`24065ba`), así que hay que repetir los ciclos de QA antes de publicar.

---

## 1. Ramas

| Comprobación | Comando | Resultado |
|---|---|---|
| Puntas | `git rev-parse --short=7 <ref>` | `main` = `origin/main` = `086323c`; A `integration/local-p0-p5` = `e656e04`; B `beta/2026-11-es-for-en` = `d421f0d` (18:19:57) |
| `main` es ancestro de A | `git merge-base --is-ancestor origin/main integration/local-p0-p5` | sí |
| A es ancestro de B | `git merge-base --is-ancestor integration/local-p0-p5 beta/2026-11-es-for-en` | sí |
| PR A (A frente a `main`) | `git rev-list --count origin/main..A`; `git diff --shortstat origin/main...A` | **8 commits, 146 archivos**, +128 128 / −4 173. De esas líneas, 96 636 están en 7 archivos `docs/audits/*.diff` |
| PR B (B frente a A) | igual, con base A | **49 commits, 188 archivos**, +24 375 / −552 |
| Código probado en B | `git log integration/local-p0-p5..beta` | Los ciclos limpios se hicieron sobre `24065ba` (maestro §0). Después llegaron `96ec410` (solo documentación) y **`d421f0d` (código)**: el envío del token desde el frontend, apagado por defecto (`VITE_AUTH_SEND_TOKEN=false`), en 6 archivos |
| Dependencias y migraciones | `git diff --stat` sobre `requirements.txt`, `package-lock.json` y `*.sql` | Sin cambios en A ni en B |
| `vercel.json` y `api/` | `git diff --stat origin/main beta -- vercel.json api/` | `vercel.json` sin cambios; `api/index.py` añade 5 líneas que fuerzan `LINGUACHAT_PROVIDER=local`, `OPENAI_ENABLED=false` y `LINGUACHAT_PREMIUM_ENABLED=false` |
| Cambios en `origin/main` desde el 2026-11-04 | `git fetch origin`; `git log --since=2026-11-04 origin/main`; `git rev-list --count main..origin/main` | **Ninguno** (0 commits; último commit de 2026-10-31) |
| Otros cambios en origin | salida de `git fetch` | Dos ramas nuevas del propietario, del 2026-11-07: `gh-pages` (GitHub Pages activo: workflow `pages-build-deployment`) y `design-lab/linguachat-five-concepts-2026-11-07`. No afectan a A ni a B |
| Nombres libres en remoto | `git ls-remote --heads origin integration/local-p0-p5 beta/2026-11-es-for-en` | vacío: no hay ramas con esos nombres |
| PR #135 | `gh pr view 135 --json ...` | abierto, no borrador, **CONFLICTING**, actualizado por última vez el 2026-10-06 (sin cambios) |
| PR #137 | `gh pr view 137 --json ...` | abierto, borrador, **MERGEABLE**, actualizado por última vez el 2026-10-31 (sin cambios) |
| #135 con A y con B | `git merge-tree --write-tree --name-only <rama> 5aafd16` | exit 1: conflicto en 3 archivos (`check-adaptive-scaffolding.mjs`, `check-learner-model.mjs`, `SessionRunner.jsx`), los mismos de antes |
| #137 con A y con B | `git merge-tree --write-tree <rama> 868e0c4` | exit 0: **sin conflictos** |
| Protección de `main` | `gh api repos/Interwtk/LinguaChat/branches/main --jq .protected` | `false`: no hay protección de rama; el *merge* depende solo de la disciplina |

## 2. Workflows

Hay cuatro archivos en `.github/workflows/`, iguales de nombre en `main`, A y B. Sus cambios: A modifica `qa.yml` (+5) y el guardia de alcance; B modifica `qa.yml` (+7). Estado en GitHub, según `gh api .../actions/workflows`: todos `active`.

| Workflow | Disparador | ¿Corre con *push* de A/B? | ¿Corre al abrir PR en borrador? | Secretos | ¿Despliega o comenta? |
|---|---|---|---|---|---|
| `qa.yml` | `push` solo a `main`; `pull_request`; `workflow_dispatch` | **No** | **Sí:** `frontend` (check:all, build, i18n, ledger-rollback 30/30, github-integration), `backend` (compileall, pytest) y `guards`. Los jobs `evidence` y `clean_cycle` se omiten en borrador; `merge_handoff` solo corre con `workflow_dispatch` | Ninguno (permisos `contents: read` y `pull-requests: read`) | No |
| `cloud-preferences-qa.yml` | `pull_request` con filtro de rutas | No | **No:** ni A ni B tocan esas rutas (`git diff --name-only` vacío) | Ninguno | No |
| `claude-auth-probe.yml` | solo `workflow_dispatch` | No | No | `CLAUDE_CODE_OAUTH_TOKEN`, solo si alguien lo lanza a mano | No |
| `claude-auth-bounded-manual.yml` | `workflow_dispatch` e `issue_comment` | No | El comentario de `vercel[bot]` en el PR crea una ejecución desde `main`, pero el job queda **skipped**: exige que el actor sea `Interwtk`, el issue #126 y el texto exacto `/linguachat-auth-once`. Ya ocurrió así el 2026-10-31 (`gh run list`: `skipped`) | Ninguno usado | No |

**Automatizaciones `claude-*` pausadas:**
- Están en `.github/workflows-paused/`, que GitHub no ejecuta: `claude-chain`, `claude-task`, `claude-mention`, `claude-i18n`, `claude-foundry-*`, `qa-merge-handoff`, entre otros.
- Siguen vivas en `.github/workflows/` de **ramas antiguas** de origin (por ejemplo, 35 ramas con `claude-chain.yml`). Esto no se activa con nuestros PR, por tres razones:
  - `pull_request` usa los workflows de la rama del PR;
  - `issue_comment` usa los de `main`;
  - ninguno usa `pull_request_target`.
- `claude-restart-readiness.yml` aparece `active`, pero solo existe en `origin/ops/claude-restart-readiness` y se dispara únicamente por *push* o PR que toquen ese mismo archivo.
- Conclusión: **ninguna se dispara.**

**Matiz:** si el PR se marca «listo» (deja de ser borrador), se ejecutan `evidence` y `clean_cycle`, que leen el cuerpo del PR. `docs/audits/2026-11-beta-phase3.md` (cuerpo de PR B) **no tiene `## Evidence`** y fallaría. El de PR A sí lo tiene. Mientras los PR sigan en borrador, esto no aplica.

## 3. Vercel

**Comprobado:**
- `vercel.json` no tiene `git.deploymentEnabled` ni `ignoreCommand`, así que se despliega toda rama sin filtro. Usa `buildCommand` para el frontend y la función `api/index.py`.
- `gh api repos/Interwtk/LinguaChat/deployments` muestra que la integración Git de Vercel está **activa**: `vercel[bot]` creó despliegues `Preview` para cada *push* de ramas que no son `main`, incluidas `gh-pages` y `design-lab` el 2026-11-07, y despliegues `Production` solo para `main` (`086323c`, 2026-10-31).
- `vercel[bot]` también **comenta en los PR** (visto en #137).
- Por tanto, cada *push* de A o de B crea una Preview con URL pública del tipo `linguachat-<hash>-<equipo>.vercel.app`, más el alias de la rama. **No toca Production.**

**No verificado (no tuve acceso al proyecto de Vercel, por diseño):**
- **No pude leer la configuración *Deployment Protection* del proyecto.** Una URL Preview **no es privada** salvo que esté activada *Vercel Authentication* o *Password Protection*. Sin eso, cualquiera con la URL ve la app, y el repositorio público y el comentario del bot la hacen fácil de encontrar.
- **No pude leer las variables de entorno del entorno Preview.** Si `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están definidas para «All Environments», la Preview se conectaría al **Supabase de producción**, no a uno de prueba. `api/index.py` sí fuerza el proveedor local y apaga OpenAI y Premium.

**Qué debe revisar el propietario en el panel de Vercel antes del *push*:**
1. *Settings → Deployment Protection*: que *Vercel Authentication* (o *Password Protection*) esté activa para Preview.
2. *Settings → Environment Variables*, filtradas por **Preview**: que no haya claves de producción (Supabase, OpenAI, firma de pases). Lo ideal es que no haya ninguna o solo las de un proyecto de prueba.
3. *Settings → Git*: confirmar que la rama de producción es `main`.

## 4. Secretos

| Comprobación | Comando | Resultado |
|---|---|---|
| Escaneo de árbol e historial | `node scripts/secret-scan.mjs --history` (con HEAD `d421f0d`) | exit 0: autocomprobación 9/9 · 816 archivos rastreados, 773 leídos, 42 binarios omitidos, 1 omitido (el propio script) · historial `git log --all -p`: 586 099 líneas de diff · 9 patrones · **0 aciertos** |
| Límites del escaneo | lectura del script | Solo detecta 9 formas de credencial. En el historial revisa solo líneas añadidas y no los diffs de *merge*. «0» no prueba que no haya secretos |
| Archivos `.env`, de claves o de credenciales rastreados | `git ls-tree -r --name-only <rama> \| grep -iE 'env\|pem\|key\|credential\|secret\|token…'` | A y B: solo `*.env.example` (backend, frontend y `docs/release/2026-11-auth-qa.env.example`), todos con valores vacíos o marcadores `<…>`. Ningún `.pem`, `.key` ni cuenta de servicio. Los demás aciertos son código (`pass_token.py`, `sessionToken.js`) |
| `.gitignore` | `git show beta:.gitignore` | ignora `.env`, `.env.local` y `.env.*.local`; `git check-ignore` lo confirma para la raíz, el frontend y el backend |
| Contraseñas de prueba | `git grep` | Solo literales falsos en pruebas con servicios simulados (`my-test-password` con `example.com` o `.test`). Ningún proyecto real de `*.supabase.co` |
| Datos personales en el contenido | `git grep` | El correo personal ya está en `main`: `docs/auth-email/README.md`, público desde antes. A y B añaden rutas locales `C:\Users\<nombre>\...` en documentos de `docs/audits` (8 archivos en A, 10 en B): exponen el nombre, no credenciales |

## 5. Correo de autor

**Comprobado:**
- `git log --format='%an <%ae> | %cn <%ce>'`: los **57 commits** (8 de A y 49 de B) tienen como autor y como *committer* el correo personal de Outlook (`s…7@outlook.com`).
- `main` usa `119076338+Interwtk@users.noreply.github.com` (200 de 200 commits recientes).
- Forma `noreply`, obtenida con `gh api user --jq '.id,.login'` (resultado `119076338`, `Interwtk`): **`119076338+Interwtk@users.noreply.github.com`**.

**No verificado:**
- No pude leer si GitHub tiene activado *Block command line pushes that expose my email*: `gh api user/emails` responde 404 porque falta el scope `user`.
- Si está activado, el *push* tal cual sería **rechazado**.

| Opción | Qué implica |
|---|---|
| **(a) Reescribir autor y *committer* antes del *push*** | En una copia, por ejemplo: `git rebase --exec 'git commit --amend --no-edit --reset-author' origin/main` sobre B, con `user.email` puesto al `noreply` (A queda incluida); o `git filter-repo --mailmap`. Cambian **todos** los hashes, también `e656e04`, `24065ba` y las etiquetas `recovery/*`, que seguirían apuntando a los commits viejos. Las referencias a hashes dentro de los documentos quedan desactualizadas, y **hay que repetir los dos ciclos de QA** sobre la nueva punta. Hay que confirmar que el otro agente ya no hace commits |
| **(b) *Push* tal cual** | Sin trabajo extra. El correo personal queda público y **no se puede retirar**: aunque se cierre el PR y se borre la rama, los commits quedan accesibles en `refs/pull/N/head`, y quitarlos exige soporte de GitHub |

## 6. *Rollback*

| Paso | Cómo deshacer | Qué no se deshace |
|---|---|---|
| *Push* de una rama | `git push origin --delete <rama>` (requiere autorización y un *pushurl* real) | Clones o *forks* que alguien haya hecho; la Preview de Vercel ya creada |
| PR abierto | `gh pr close <n>` | El PR cerrado y sus commits siguen visibles (`refs/pull/<n>/head`); GitHub no permite borrar un PR. El comentario de `vercel[bot]` queda |
| Preview de Vercel | Panel de Vercel, *Deployments*: eliminar la Preview, o `vercel remove <url>` con la sesión del propietario. Borrar la rama **no** borra la Preview | La URL deja de responder solo cuando se elimina |
| Ejecuciones de Actions | Nada que deshacer: solo leen. Se pueden borrar desde *Actions* si se quiere | — |
| *Merge* (no se solicita ahora) | `git revert -m 1 <merge>` en un PR nuevo, o *Instant Rollback* de Vercel al despliegue de producción anterior (`086323c`). Sin migraciones ni datos en servidor | El historial público conserva el *merge* |

## Solicitud

**Requisito previo (lo hace el propietario, no yo):** completar los 3 puntos del §3 en el panel de Vercel y confirmar que el otro agente terminó en `beta/2026-11-es-for-en`. Luego, dos ciclos limpios de QA sobre la punta final de B.

1. **Decidir el correo de autor.**
   - **Acción (a):** reescribir el autor y el *committer* de A y B a `119076338+Interwtk@users.noreply.github.com`, en una copia local, y repetir el QA.
   - **Consecuencia:** cambian todos los hashes, el QA anterior deja de valer y aparecen ramas nuevas.
   - **Cómo se deshace:** las ramas y etiquetas actuales quedan intactas como respaldo; basta descartar la copia.
   - **Alternativa (b):** publicar tal cual. El correo personal queda público de forma irreversible.
2. **Autorizar el *push* de `integration/local-p0-p5`.**
   - **Acción:** `git remote set-url --push origin https://github.com/Interwtk/LinguaChat.git`; luego `git push -u origin integration/local-p0-p5`; luego volver a deshabilitar el *pushurl*.
   - **Consecuencia:** la rama queda pública, con los 7 `.diff` de auditoría (96 636 líneas). Vercel crea una Preview y no corre ningún workflow de Actions.
   - **Cómo se deshace:** borrar la rama remota y eliminar la Preview en Vercel.
3. **Autorizar el PR A en borrador.**
   - **Acción:** `gh pr create --draft --base main --head integration/local-p0-p5 --body-file docs/audits/2026-10-31-integration-pr-draft.md`.
   - **Consecuencia:**
     - QA corre `frontend`, `backend` y `guards`;
     - `vercel[bot]` comenta con la URL;
     - aparece una ejecución `skipped` de `claude-auth-bounded-manual`;
     - no hay *merge*.
   - **Cómo se deshace:** `gh pr close`. El PR cerrado sigue visible.
4. **Autorizar el *push* de `beta/2026-11-es-for-en` y el PR B en borrador**, apilado sobre A.
   - **Acción:** `git push -u origin beta/2026-11-es-for-en`; luego `gh pr create --draft --base integration/local-p0-p5 --head beta/2026-11-es-for-en --body-file docs/audits/2026-11-beta-phase3.md`.
   - **Consecuencia:** los mismos efectos que en los puntos 2 y 3. El cuerpo no tiene `## Evidence`: hay que añadirlo antes de marcar el PR como «listo».
   - **Cómo se deshace:** cerrar el PR, borrar la rama y eliminar la Preview.
5. **Decidir sobre los `.diff` de `docs/audits/` en PR A.**
   - **Acción:** incluirlos tal cual, o quitarlos reescribiendo A antes del *push* (cambian los hashes, igual que en el punto 1).
   - **Consecuencia:** un commit que los borre después del *push* **no** los elimina del historial público.
   - **Cómo se deshace:** antes del *push*, cualquier opción es reversible; después, no.

No se solicita: *merge*, *promote* a producción, ni cambios en Vercel o Supabase.
