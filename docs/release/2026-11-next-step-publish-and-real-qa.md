# Siguiente paso: publicar y primeras pruebas reales

> 2026-11-07, después de la reescritura local autorizada. **Nada publicado.** Cada paso remoto de este documento necesita su propia autorización.

## 1. Ramas listas para publicar

| Rama | Último commit | Base | Commits | Estado |
|---|---|---|---|---|
| `integration/local-p0-p5` (PR A) | `f146170` | `main` @ `086323c` | 8 | Lista |
| `beta/2026-11-es-for-en` (PR B) | `31367fb` (código probado) y sus commits de documentación | PR A | 84 propios | Lista |
| `proposal/backend-jwt-verify` | `8b52636` | beta (anterior) | 52 desde `main` | **No** publicar todavía: requiere aprobar `CLAUDE.md` |
| `proposal/pre-a1-option-order` | `1c9a7b6` | beta (fase 3) | 27 desde `main` | **No**: sustituida por la política del reproductor |

En todas: autor y *committer* solo con tu noreply, sin conjuntos sellados en el historial, cadena `main` → A → B correcta.

## 2. Qué pasa en GitHub

**Comandos exactos**, solo con autorización. Nunca `--all`, `--mirror`, `--tags` ni `--force`:

```
git -c remote.origin.pushurl=https://github.com/Interwtk/LinguaChat.git push origin refs/heads/integration/local-p0-p5:refs/heads/integration/local-p0-p5
git -c remote.origin.pushurl=https://github.com/Interwtk/LinguaChat.git push origin refs/heads/beta/2026-11-es-for-en:refs/heads/beta/2026-11-es-for-en
```

- `pushurl` sigue deshabilitado en la configuración; `-c` lo habilita solo para ese comando.
- Cada *push* crea una rama pública nueva. No toca `main` ni #135/#137.
- Los commits quedan visibles para cualquiera. Un PR en borrador **no** los oculta.
- **PR A:** base `main`, cabeza `integration/local-p0-p5`, en borrador.
- **PR B:** base `integration/local-p0-p5`, cabeza `beta/2026-11-es-for-en`, en borrador. B no se fusiona antes que A.
- **CI:** un PR en borrador ejecuta `qa.yml` (`frontend`, `backend`, `guards`), sin secretos ni despliegues. Un *push* de rama sin PR no ejecuta nada. `check-es-blind` informa «no medido» en CI porque los conjuntos sellados no se publican; se miden en el ciclo local.
- El cuerpo de PR B debe llevar `## Evidence` con `check:all`, o el job `evidence` fallará al marcarlo listo.

## 3. Qué Previews crea Vercel

- Una Preview por *push* de cada rama, más una por PR. El bot comenta la URL en el PR, visible para todos.
- Producción sigue saliendo solo de `main`.
- Las Previews usan las variables del entorno *Preview*, que apuntan al **mismo** Supabase que producción.

## 4. Cómo verificar que están protegidas

1. Antes del *push*: Vercel → Settings → Deployment Protection → **revocar el enlace compartible** si existe.
2. Después del *push*: abrir la URL de la Preview en una ventana **de incógnito, sin sesión de Vercel**. Debe pedir iniciar sesión en Vercel. Si carga la app, **parar**, borrar la rama remota y revisar.
3. Repetir con la URL generada del PR.
4. No usar dominios personalizados para la beta: no los cubre *Standard Protection*.

## 5. Los diez recorridos con dos cuentas `+lcqa`

Guía completa: `docs/release/2026-11-supabase-existing-project-qa.md`.

1. Consultas de solo lectura en el SQL Editor (§3). Anota disparadores sobre `auth.users`.
2. Con autorización: añadir la URL de la Preview en *Redirect URLs*.
3. Archivo privado **fuera del repositorio** con:
   - URL y clave pública;
   - `QA_AUTH_CONFIRM_LINGUACHAT_PROJECT=yes`;
   - `tu+lcqa-a@…` y `tu+lcqa-b@…`;
   - contraseña desechable.
4. `node --env-file=<archivo> linguachat-frontend/src/auth/qa-real-journeys.mjs` desde una carpeta tuya. Crea las dos cuentas si faltan, prueba contraseña errónea y correcta, token alterado, renovación, cierre de sesión y recuperación.
5. En la Preview, según `2026-11-auth-journeys.md` §3: registro, verificación de correo, inicio de sesión, recuperación, cuenta B, A → B → A, progreso de inglés y de español, persistencia y cierre de sesión, exportación y borrado.
6. Al terminar: borrar las dos cuentas `+lcqa` en *Authentication → Users*, y las filas que haya creado un disparador.

## 6. JWT, de forma coordinada (después de 5)

1. Aprobar el cambio de `CLAUDE.md` y `PyJWT[crypto]`. Fusionar la propuesta en un PR propio, **apagada**.
2. Abrir `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json`. Si está vacío, **parar**: migrar claves de un proyecto en uso necesita un plan propio.
3. Solo en *Preview*:
   - emisor `https://<ref>.supabase.co/auth/v1`;
   - audiencia `authenticated`;
   - URL del JWKS;
   - **en el mismo despliegue**, `LINGUACHAT_AUTH_REQUIRED=true` y `VITE_AUTH_SEND_TOKEN=true`.
4. Repetir el ejecutor con `QA_API_URL`: sin token → 401; token alterado → 401; `user_id` falso ignorado; B no alcanza la conversación de A.

## 7. Aislamiento y persistencia

| Comprobación | Dónde | Esperado |
|---|---|---|
| A y B tienen ids distintos | Ejecutor | Sí |
| B empieza en blanco tras A | Navegador | Sin progreso, curso ni chat de A |
| A conserva inglés y español tras B | Navegador | Sí |
| Claves locales por cuenta | DevTools → Application | Solo bajo el prefijo de cada cuenta |
| Sesión cerrada no se renueva | Ejecutor | 401 en la renovación |
| Exportación de A | Tú → Descargar mis datos | Solo datos de A |
| Conversación de A con el token de B | Ejecutor con JWT | `forgotten: 0` |

## 8. Reversión sin tocar datos

| Paso | Reversión | Datos afectados |
|---|---|---|
| Reescritura local | `git branch -f <rama> recovery/pre-noreply-<rama>`, o el *bundle* privado | Ninguno |
| *Push* | Cerrar el PR y borrar la rama remota (lo publicado queda en `refs/pull`) | Ninguno |
| Preview | Borrar el despliegue en Vercel | Ninguno |
| *Redirect URLs* | Quitar la URL | Ninguno |
| Cuentas `+lcqa` | Borrarlas en el panel | Solo esas dos |
| JWT | Apagar las dos variables y volver a desplegar | Ninguno: el progreso vive en el dispositivo |

## 9. Bloqueos que siguen impidiendo la beta externa

1. Autorización de *push* y PR.
2. Enlace compartible revocado y Preview verificada en incógnito.
3. Revisión de solo lectura del proyecto y *Redirect URLs*.
4. Los 10 recorridos reales aprobados.
5. Contacto de privacidad y nombre del operador.
6. Derechos de Chatto y de los activos.
7. Revisión humana del contenido y de los mensajes de crisis para el piloto.
8. Aceptar el nivel medido del tutor (crisis indirectas: 5 %) para una beta limitada.
