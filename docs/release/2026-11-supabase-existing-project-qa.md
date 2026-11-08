# Pruebas reales de autenticación en el proyecto Supabase actual

> Fase 7, 2026-11-07. **Decisión del propietario:** no se crea otro proyecto ni se contrata nada. Se prueba en el proyecto Supabase **actual** de LinguaChat, sin borrarlo, reiniciarlo ni alterar sus datos.
> **Nada de esto se ha ejecutado.** Ningún recorrido real ha pasado. Sustituye a `2026-11-supabase-test-project-guide.md` en lo que se refiere al proyecto; sus pasos de Vercel siguen valiendo.

> ⚠️ **Nunca compartas** con nadie, tampoco en un chat con una IA: contraseñas, la clave `service_role` o cualquier `sb_secret_…`, el secreto JWT, tokens de sesión ni el valor de *bypass* de Vercel. Solo la **URL del proyecto** y la **clave pública** (`anon` o `sb_publishable_…`) pueden compartirse.

## 1. Reglas de esta prueba

| Regla | Cómo se cumple |
|---|---|
| Ninguna cuenta real de estudiante | El ejecutor se niega si los dos correos no llevan `+lcqa` (por ejemplo `tu+lcqa-a@…`) |
| Sin cambios destructivos | El ejecutor solo crea dos cuentas de prueba si faltan, inicia y cierra sesión, y pide recuperación. **Nunca borra** ni cambia ajustes |
| Sin claves privadas | Solo la clave pública. Rechaza una clave secreta |
| Nunca otro proyecto | Se niega con un proyecto o correo de otra organización (`CLAUDE.md`) |
| Sin migraciones, permisos ni configuración remota | Nada de eso está en el ejecutor. Los cambios del §3 los aprueba y hace el propietario |
| JWT en el servidor apagado | No se enciende hasta comprobar que el frontend envía el token y probar la reversión (`docs/architecture/jwt-integration-review.md`) |

## 2. Qué toca la app en Supabase (inventario desde el código)

| Recurso | Uso | En esta prueba |
|---|---|---|
| Supabase Auth | Registro, inicio y cierre de sesión, recuperación, reenvío, cambio de contraseña, intercambio de código, lectura de sesión | **Sí**: dos cuentas `+lcqa` |
| Metadatos de usuario | Solo la declaración «18 o más» y su fecha | Sí, en las dos cuentas de prueba |
| Correo de Auth | Confirmación y recuperación | Sí: a tus alias. Límite del correo integrado (ver §5) |
| Tabla `learner_preferences` | Solo si `CLOUD_PREFERENCES_RELEASED=true` | **No**: está en `false` |
| Otras tablas, Storage, Edge Functions, RPC | Ninguno en el código | No |
| Backend (Vercel) | No llama a Supabase. Con la propuesta JWT, solo leería las claves **públicas** (JWKS) | No en esta fase |

## 3. Revisión previa, solo lectura (la haces tú en el panel)

No consulté el proyecto remoto: no tengo autorización para abrirlo, y listar proyectos con el conector mostraría también los de otra organización, lo que `CLAUDE.md` prohíbe. Estas consultas solo leen. Pega cada una en **SQL Editor** y **guarda el resultado sin compartirlo**:

```sql
-- tablas públicas y si tienen RLS
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;
-- políticas existentes
select tablename, policyname, cmd, roles from pg_policies where schemaname = 'public' order by 1, 2;
-- disparadores sobre usuarios: crear una cuenta podría escribir filas en otras tablas
select event_object_schema, event_object_table, trigger_name, action_statement
from information_schema.triggers where event_object_schema in ('auth', 'public') order by 1, 2;
-- funciones propias
select routine_name from information_schema.routines where routine_schema = 'public' order by 1;
-- cuántas cuentas hay (solo el número) y si ya existen cuentas de prueba
select count(*) from auth.users;
select count(*) from auth.users where email ilike '%+lcqa%';
```

**Qué mirar:**
- Un disparador sobre `auth.users`, por ejemplo uno que crea un perfil: las cuentas de prueba crearán esas filas. Anótalo para borrarlas después.
- Una tabla pública **sin RLS**: no la usa la app, pero es un riesgo propio. No se cambia sin aprobación.
- Que el número de cuentas no cambie salvo por las dos `+lcqa`.

## 4. Ajustes que **tú** decides (cambian el proyecto)

| Ajuste | Para qué | Riesgo |
|---|---|---|
| Añadir la URL de la Preview en *Authentication → URL Configuration → Redirect URLs* | Confirmación y recuperación desde la Preview | Bajo: solo añade un destino permitido |
| Revisar el JWKS: `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json` (abrir la URL solo lee) | Saber si el proyecto ya firma con claves asimétricas | Ninguno |
| **Migrar o rotar las claves JWT** | Necesario solo si el JWKS sale vacío, para la verificación en el servidor | **Alto en un proyecto en uso**: afecta a todas las sesiones. **No hacerlo** sin un plan propio aprobado |

## 5. Ejecutar los diez recorridos

1. **Vercel:** Preview protegida (*Standard Protection* con *Vercel Authentication*, ver `2026-11-hosting-and-preview-protection.md`). Comprobar en una ventana de incógnito que pide iniciar sesión en Vercel. Las variables de Preview apuntan al **mismo** proyecto, solo con la clave pública.
2. **Archivo privado:** copia `docs/release/2026-11-auth-qa.env.example` **fuera del repositorio** y rellénalo con:
   - la URL y la clave pública;
   - `QA_AUTH_CONFIRM_LINGUACHAT_PROJECT=yes`;
   - dos alias `+lcqa`;
   - una contraseña desechable.
3. **Proveedor:** `node --env-file=<tu archivo> linguachat-frontend/src/auth/qa-real-journeys.mjs`, desde una carpeta tuya fuera del repositorio. Escribe `auth-qa-result.json` allí.
4. **Navegador**, según la tabla de `2026-11-auth-journeys.md` §3:

| # | Recorrido | Dónde |
|---|---|---|
| 1 | Registro de A | Navegador y ejecutor |
| 2 | Verificación de correo, si está activada | Tu buzón |
| 3 | Inicio de sesión (contraseña errónea y correcta) | Ejecutor y navegador |
| 4 | Recuperación de contraseña (misma respuesta para correos existentes y no) | Ejecutor y navegador |
| 5 | Registro de B | Ejecutor y ventana privada |
| 6 | Cambio A → B → A sin mezclar datos | Navegador |
| 7 | Progreso de inglés | Navegador |
| 8 | Progreso de español | Navegador |
| 9 | Persistencia y cierre de sesión (la sesión cerrada ya no se renueva) | Ejecutor y navegador |
| 10 | Exportación, borrado en el dispositivo y aislamiento | Navegador |

**Negativas incluidas en el ejecutor:**
- Token alterado: rechazado.
- Sesión cerrada: no se renueva.
- Con `QA_API_URL` y JWT encendido en la Preview:
  - sin token → 401;
  - token alterado → 401;
  - `user_id` falso ignorado;
  - B no alcanza la conversación de A.

**Correo:** el correo integrado de Supabase tiene un límite bajo por hora y puede entregar solo a direcciones del equipo. Si un correo no llega, **para**. No cambies SMTP sin decidirlo antes.

## 6. Después

- Borra las dos cuentas `+lcqa` en *Authentication → Users*, y las filas que haya creado un disparador del §3.
- Quita la URL de Preview de *Redirect URLs* si no vas a seguir probando.
- Guarda `auth-qa-result.json` y tus capturas. **Un solo recorrido fallido impide la beta externa.**
