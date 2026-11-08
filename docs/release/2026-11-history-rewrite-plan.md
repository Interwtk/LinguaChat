# Historial publicable: plan de reescritura

> Fase 8, 2026-11-07. **Ejecutado el 2026-11-07 con tu autorización**, solo en local. Nada publicado. Resultado en el §5.

## 1. Qué está publicado y qué no

| | Commits | Correo personal |
|---|---|---|
| `origin/main` (público) | — | **Ya contiene 129 commits** con tus correos de Outlook y Gmail |
| Otras 103 ramas remotas | — | Ninguna añade más |
| `integration/local-p0-p5` (PR A) | 8 sin publicar | Sí |
| `beta/2026-11-es-for-en` (PR B) | 85 sin publicar hasta `d0448cc`, más los de documentación | Sí |
| `proposal/backend-jwt-verify` | 52 sin publicar | Sí |
| `proposal/pre-a1-option-order` | 27 sin publicar | Sí |

**Corrección a las fases 6 y 7:** se dijo que publicar los commits locales expondría tu correo de forma irreversible. **Ya está expuesto en `main`.** Reescribir los commits locales evita sumar más, pero no retira lo publicado. Retirarlo exigiría reescribir `main` con *force push*: rompe *forks* y PR y no borra las copias existentes. **No se hará.**

## 2. Conjuntos sellados

Cinco archivos `*holdout*.jsonl` estaban versionados. Desde `165451c`:
- **Fuera del árbol versionado**, ignorados por git. Siguen en disco para que los evaluadores midan.
- **Copia privada** con hashes en `%USERPROFILE%\LinguaChat-private\sealed\` (`SHA256SUMS.txt`), fuera de cualquier ruta publicable. Hashes iguales a los de sus README.
- `scripts/check-sealed-private.mjs` falla si alguno vuelve a versionarse. Es una etapa del ciclo de QA.
- Comprobado sin abrir los textos: ningún archivo versionado los copia (solo coinciden frases comunes que ya estaban en las lecciones), y ningún ZIP de exportación los contiene.

**Siguen en el historial local** de los commits anteriores. Un *push* sin reescribir los publicaría.

## 3. La reescritura (`scripts/rewrite-unpublished-author.sh`)

Solo sobre commits **no publicados**. Para cada uno:
- cambia el correo de autor y *committer* por tu dirección noreply;
- quita los cinco conjuntos sellados.

**Garantías del script:**
- Se niega si el árbol está sucio, si la dirección no es noreply o si una rama ya está en el remoto.
- Crea `recovery/pre-noreply-*`.
- Prueba que cada rama difiere **solo** por los conjuntos sellados.
- Prueba que no queda ningún conjunto sellado ni otra dirección.

**Ensayo en un clon desechable**, con una dirección de ejemplo:
- 8 + 83 + 52 + 27 commits reescritos.
- Las cuatro ramas difieren solo por los sellados.
- 0 sellados en el historial nuevo.
- `main` sigue siendo ancestro de A, y A de B.
- Escaneo del historial: 0 coincidencias.
- El ensayo encontró un error del propio script (una verificación que se detenía en silencio), ya corregido.

## 4. Pasos, cuando lo autorices

1. Copia tu dirección desde GitHub → Settings → Emails. Se pega en el comando, nunca se inventa.
2. `bash scripts/rewrite-unpublished-author.sh <dirección>`: prueba en seco.
3. `bash scripts/rewrite-unpublished-author.sh <dirección> --apply`.
4. Escaneo de secretos del historial y `check-sealed-private`.
5. Dos ciclos de QA sobre los hashes nuevos. Actualizar el maestro con los hashes.
6. Recién entonces, el *push* autorizado: ramas nuevas, nunca *force push* sobre ramas ajenas ni sobre `main`.

**Reversión antes del *push*:** `git branch -f <rama> recovery/pre-noreply-<rama>` para cada rama. Después del *push*: cerrar el PR y borrar la rama remota. Lo publicado queda en `refs/pull`.

## 5. Resultado de la reescritura autorizada

- **Dirección:** `119076338+Interwtk@users.noreply.github.com`. Salió de tu cuenta autenticada (`gh api user`) y coincide con 529 commits de `main`. No se inventó.
- **Respaldo previo, privado:** `%USERPROFILE%\LinguaChat-private\backups\pre-noreply-2026-11-07.bundle`, con su SHA-256, las referencias anteriores y el mapa de hashes viejos a nuevos (`noreply-commit-map.txt`). `git bundle verify`: correcto.
- **Recuperación local**, nunca para publicar: etiquetas `recovery/pre-noreply-*` y `refs/original/*`.

| Rama | Antes | Ahora | Commits | Sellados en el historial | Otras direcciones |
|---|---|---|---|---|---|
| `integration/local-p0-p5` | `e656e04` | `f146170` | 8 | 0 | 0 |
| `beta/2026-11-es-for-en` | `819ce43` | `31367fb` | 91 | 0 | 0 |
| `proposal/backend-jwt-verify` | `ff6e7d8` | `8b52636` | 52 | 0 | 0 |
| `proposal/pre-a1-option-order` | `7e6d48e` | `1c9a7b6` | 27 | 0 | 0 |

- **Árboles:** iguales en A, B y orden de opciones. La propuesta JWT difiere solo en los dos conjuntos sellados que contenía.
- **Cadena:** `main` → A → B correcta, 83 commits propios de B. La propuesta JWT comparte la historia reescrita.
- **Contenido:** ningún correo personal en el árbol de B. Queda una URL de Vercel con tu usuario en `docs/auth-email/README.md`, que **ya está en `main`** y no se modificó.
- **Equivalencias de hashes citados en informes anteriores:** `54f5f27` → `2bf3cb5`, `4778fb8` → `51c9f5c`, `409bbf0` → `3d68de9`, `24065ba` → `b882094`, `fc55417` → `e10ae97`.
- **QA sobre `31367fb`:** dos ciclos idénticos, 26/26, `check:all` 119/119, pytest 1799 / 28 omitidas, garantías 16/16, *rollback* desde git 30/30. Escaneo del historial: 0 coincidencias.
- **Incidente encontrado y corregido.** El bloqueo de *push* del repositorio (`pushurl`) se había perdido en la fase 7. El primer ensayo falló al clonar por rutas largas, y sus comandos de remoto se ejecutaron en el repositorio real. Restaurado el 2026-11-07. Comprobado en GitHub: ninguna de las cuatro ramas ni ninguna etiqueta `recovery/*` existe en el remoto, y `main` sigue en `086323c`. No hubo *push*.

