# Historial publicable: plan de reescritura

> Fase 8, 2026-11-07. **No ejecutado en las ramas reales.** Ensayado en un clon desechable. Requiere tu autorización.

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
