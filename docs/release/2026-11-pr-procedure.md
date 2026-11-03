# Procedimiento exacto: llevar las ramas locales a GitHub (dos PR revisables)

> Fase 3, 2026-11-03. **Nada de esto se ejecutó.** Requiere la autorización expresa del propietario para cada paso remoto: *push*, apertura de PR y, más adelante, *merge*.
> Revalidado en solo lectura el 2026-11-03 (`git fetch` y `gh pr view`):
> - `main` @ `086323c`, sin cambios desde que se cortaron las ramas (0 commits nuevos);
> - #137 abierto, en borrador y `MERGEABLE`;
> - #135 abierto y `CONFLICTING`.

## 1. Qué se publica

| PR | Rama | Base | Contenido |
|---|---|---|---|
| **A** | `integration/local-p0-p5` @ `e656e04` | `main` | P0–P5 (fase 7): endurecimiento, tutor, datos, base A1 |
| **B** | `beta/2026-11-es-for-en` @ (HEAD de la fase 3) | `integration/local-p0-p5` (apilado sobre A) | Multidioma y español; fases 2 y 3 de la beta |
| (propuesta, no PR) | `proposal/pre-a1-option-order` | `beta/2026-11-es-for-en` | Orden de opciones en Pre-A1. **Requiere aprobación** por estar congelado |

**No se mezclan** #137 ni #135 ni otras ramas. Ambos PR quedan independientes de los existentes:
- #137 solo toca documentación de currículo;
- #135 tiene conflictos propios (ver `docs/audits/2026-10-31-pr137-pr135-conflict-review.md`).

## 2. Requisitos del propietario (antes de cualquier comando)

1. Autorización escrita: «Autorizo *push* de las ramas `integration/local-p0-p5` y `beta/2026-11-es-for-en` y apertura de dos PR en borrador».
2. Correo de autor: usar el `noreply` de GitHub para que los commits no expongan un correo personal. Si se decide reescribir el autor, se hace **antes** del *push* con `git rebase --exec` en una copia y con autorización: cambia los hashes.
3. Decidir sobre los `.diff` de `docs/audits/` (incluirlos o excluirlos del PR A).

## 3. Comandos (en el clon `Music\LinguaChat-integration`)

```bash
# 0. estado limpio y pruebas (ver §5)
git -c core.autocrlf=false status --short
# 1. restaurar la URL de push (hoy deshabilitada a propósito)
git remote set-url --push origin https://github.com/Interwtk/LinguaChat.git
# 2. PR A
git push -u origin integration/local-p0-p5
gh pr create --draft --base main --head integration/local-p0-p5 --title "integration: P0–P5 local hardening (FASE 7)" --body-file docs/audits/2026-10-31-integration-pr-draft.md
# 3. PR B, apilado
git push -u origin beta/2026-11-es-for-en
gh pr create --draft --base integration/local-p0-p5 --head beta/2026-11-es-for-en --title "beta: multilingual + Spanish for English speakers (phases 1–3)" --body-file docs/audits/2026-11-beta-phase3.md
# 4. volver a deshabilitar el push local
git remote set-url --push origin PUSH-DISABLED-local-integration-only
```

El cuerpo de cada PR debe llevar la sección *Evidence* que exige `qa.yml` (job `evidence`): las cifras de `check:all`, el *build* y `pytest`.

## 4. Efectos esperados al publicar

| Efecto | Detalle | Riesgo y control |
|---|---|---|
| **Vercel Preview** | Si el proyecto tiene la integración Git, cada *push* de rama crea un despliegue **Preview** (nunca Production) con las variables de entorno de Preview | `api/index.py` fuerza `LINGUACHAT_PROVIDER=local`, `OPENAI_ENABLED=false` y `LINGUACHAT_PREMIUM_ENABLED=false`. Sin `VITE_SUPABASE_*` de prueba, la Preview muestra el error de autenticación no disponible (no inventa sesión) |
| **CI `qa.yml`** | Jobs `frontend`, `backend`, `guards` y `evidence`; desde la fase 3, también `check:ledger-rollback --require` (30/30, necesita `fetch-depth: 0`, ya configurado) | `check:github-integration` (necesita `jq`) solo corre en CI |
| **Automatizaciones** | Workflows `claude-*` existentes | Siguen pausadas; no se reactivan. Los PR en **borrador** no disparan el carril de *merge* (`qa-cycle` exige un ciclo no borrador) |
| **Producción** | Ninguno | No hay *merge* ni *promote* |

## 5. Verificación previa al *push* (dos ciclos limpios)

Se registra en `docs/release/2026-11-beta-readiness.md` § Ciclos. Cada ciclo incluye:
- `npm run check:all`;
- `build`;
- `check:i18n`;
- `check:ledger-rollback` (30/30);
- backend `compileall` y `pytest`;
- QA HTTP;
- escaneo de secretos de los archivos cambiados.

## 6. Después de abrir los PR (sin *merge*)

1. Leer el CI de ambos.
2. Revisar la Preview: auth sin entorno (debe fallar de forma honesta), planes, Hoy, curso de español y datos.
3. Con un Supabase **de prueba** autorizado, ejecutar `docs/release/2026-11-auth-journeys.md`.
4. El *merge* de A y luego de B, **solo** con la autorización explícita del propietario y el CI en verde.
