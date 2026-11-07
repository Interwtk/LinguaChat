# Propuesta: verificar el token de sesión en el servidor (pendiente de autorización)

> `CLAUDE.md` **no se ha editado** y esta rama (`proposal/backend-jwt-verify`) **no debe fusionarse** sin aprobación del propietario.
> Copia de lectura en la rama beta: el código solo existe en `proposal/backend-jwt-verify` @ `ff6e7d8`.
> Fecha: 2026-11-07. Sustituye a «Cambio 4» de `docs/project/claude-md-multilingual-proposal.md`.

## Por qué

Hoy el servidor no sabe quién llama (`docs/architecture/authz-review.md` §1 y §4):
- el pase Premium es al portador: copiado, funciona en otro navegador;
- `/chat` queda abierto;
- la memoria de una conversación se alcanza con su id.

Verificar la firma del token con claves públicas cierra esos tres puntos sin dar al servidor ninguna credencial.

## Cambio exacto en `CLAUDE.md` (sin aplicar)

```diff
@@ Cloud persistence @@
 `VITE_SUPABASE_URL` plus `VITE_SUPABASE_ANON_KEY`. This permission does not authorize
-backend Supabase, service-role/private keys, direct Postgres, Storage, pgvector,
+backend Supabase (except the token verification under Infrastructure boundaries),
+service-role/private keys, direct Postgres, Storage, pgvector,
 Edge Functions, production deployment, billing, or reuse/inspection of any EvoLabs

@@ Infrastructure boundaries @@
   reused or modified for LinguaChat. Cloud implementation remains separately gated
   and must not be inferred from planning/history.
+- **One backend exception, authorized <fecha>:** `app/auth/token_verify.py` may verify
+  the signature of a sign-in JWT with the **public** JWKS of the LinguaChat project,
+  only to identify the caller of `/chat`, `/chat/forget` and the Premium routes. It
+  grants no SDK, no database, no private key and no shared secret; the provider's name
+  stays out of backend code, and issuer, audience and JWKS URL come from the environment.
 - **No migration to Next.js.** Vite + React stays; FastAPI stays as the
```

`check-linguachat-cloud-scope.mjs` **no cambia**: el código no nombra al proveedor y el guardia pasa tal como está.

## Qué permite y qué no

**Permite solo:** leer el JWKS público por https y comprobar firma, `iss`, `aud`, `exp`, `nbf` y `sub`.

**Sigue prohibido:**
- SDK del proveedor en el servidor, `service_role`, secretos compartidos (HS*);
- base de datos, Postgres directo, Storage, pgvector, Edge Functions;
- crear, leer o modificar usuarios en el proveedor; guardar usuarios en el servidor;
- cualquier proyecto EvoLabs.

**No resuelve:**
- **Cierre de sesión:** la verificación no consulta al proveedor, así que un token robado vale hasta su `exp`.
- **Edad:** sigue siendo una autodeclaración.
- **Límite de peticiones por cuenta en `/chat`:** ahora sería posible, pero no está incluido.
- **Rutas sin token:** `/learning/evaluate` y `/chat/scenarios` siguen abiertas (sin estado, sin datos de cuenta).

## Qué hace la rama

- Con el interruptor apagado (por defecto) nada cambia y no se lee ninguna cabecera.
- Encendido: `/chat`, `/chat/forget`, `/premium/status` y `/practice/extra/authorize` responden 401 sin token válido.
- `user_id` del cuerpo nunca es identidad.
- Un pase de otra cuenta recibe 403, incluso vencido, y no gasta bloques.
- La memoria de conversación pasa a depender de cuenta + id (con hash), para que un cambio de usuario no herede nada. Por eso `/chat/forget` también exige token: sin él no encontraría la conversación.
- Claves caducadas (10 min), JWKS caído o configuración incompleta: 401, nunca acceso. Una caída del proveedor corta `/chat` para todos mientras dure.

**Dependencia nueva:** `PyJWT[crypto]` (trae `cryptography`), en `requirements.txt` raíz y de `linguachat-backend/`. Se importa siempre, aunque el interruptor esté apagado: el despliegue debe instalarla.

## Qué debe configurar el propietario

1. **El proyecto de prueba debe firmar con claves asimétricas (ES256 o RS256).** Un proyecto con secreto compartido heredado no se puede verificar así sin ese secreto, y esta propuesta no lo acepta: su JWKS no tendrá claves útiles y todo responderá 401.
2. **Frontend (fuera de esta rama, requisito previo):** `linguachat-frontend/src/services/api.js` no envía `Authorization` hoy. Encender el interruptor sin ese cambio deja a todos en 401. `forgetServerConversations` debe llamarse antes de cerrar sesión.
3. Variables del servidor:

| Variable | Valor |
|---|---|
| `LINGUACHAT_AUTH_ISSUER` | El `iss` exacto de los tokens del proyecto |
| `LINGUACHAT_AUTH_AUDIENCE` | El `aud` de los tokens (sesión iniciada) |
| `LINGUACHAT_AUTH_JWKS_URL` | URL https del JWKS público del proyecto |
| `LINGUACHAT_AUTH_REQUIRED` | `true` para encender |

**Sin probar contra un proveedor real:** no hay proyecto de prueba autorizado. Copiar `iss` y `aud` de un token real del proyecto de prueba y comprobarlo allí antes de cualquier otro entorno.

## Encender y apagar

- **Encender:** las tres variables, el frontend enviando el token y `LINGUACHAT_AUTH_REQUIRED=true`; reiniciar.
- **Apagar:** quitar la variable o ponerla en `false`; reiniciar. Vuelve el comportamiento de hoy sin tocar código.
- Al cambiar en cualquier sentido, la memoria del servidor (24 h) deja de alcanzarse; el navegador sigue enviando su historial.

## Pruebas que añade

`linguachat-backend/tests/test_token_verify.py` (87 casos, sin red, claves generadas en la prueba):
- **Token:** válido (ES256, RS256), vencido, aún no válido, carga y firma alteradas, otra clave, emisor y audiencia incorrectos, `sub` ausente o vacío, `alg: none`, HS256 firmado con la clave pública, `kid` desconocido.
- **Claves:** caché, una recarga por intervalo, rotación, JWKS caído o malformado, claves simétricas o privadas ignoradas, tamaño acotado.
- **Rutas:** 401 sin token, pase de otra cuenta (403), `user_id` contradictorio, cambio de usuario entre peticiones, adaptador de Preview, y `required=false` deja todo igual.

## Si se aprueba, actualizar también

`docs/architecture/authz-review.md` (§1, §2, §4), `docs/architecture/premium-practice.md` (§3, §8, §11) y el docstring de `app/billing/pass_token.py`.
