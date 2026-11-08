# Revisión de autenticación y autorización

> Fase 4, 2026-11-04. Rama local. **La autenticación real sigue sin probar:** no hay proyecto de prueba autorizado.

## 1. Qué decide el servidor y qué decide el navegador

El backend no tiene base de datos de usuarios y no verifica sesiones (`CLAUDE.md` no lo autoriza). Consecuencia: **el servidor no sabe quién llama.**

| Control | Dónde vive | Confianza |
|---|---|---|
| Inicio de sesión, contraseña, recuperación, expiración de sesión | Proveedor de autenticación, con su SDK en el navegador | Del proveedor; sin probar en real |
| Aislamiento del progreso entre cuentas | Navegador (`auth/localLease.js`, espacios por cuenta) | Protege de errores y de otra cuenta en el mismo navegador. **No** de quien controla ese navegador |
| Progreso, preferencias, exportación y borrado | Navegador, datos locales | El dueño del navegador tiene sus datos; no hay datos ajenos que pedir |
| Seguridad del tutor | **Servidor** | No evitable desde el navegador |
| Chat guiado | **Servidor** | No evitable desde el navegador |
| Premium (pase, límite, revocación) | **Servidor** | Firma y límite no evitables; pase al portador (§4) |
| Edad | Navegador y metadatos de la cuenta | Autodeclaración (§5) |

## 2. Rutas del servidor

| Ruta | Identificador del navegador | ¿Da acceso a datos ajenos? | Control |
|---|---|---|---|
| `POST /chat` | `session_id` | Solo con el id exacto de otra conversación | Solo se recuerda bajo ids de 24+ caracteres; la app envía `session-<uuid>`. Ids cortos o adivinables: se atiende y **no se recuerda**. Sin id: nada compartido |
| `POST /chat` | `user_id` | No | Se ignora: no autoriza nada y no se guarda (prueba) |
| `POST /chat/forget` | `session_ids` (máx. 4) | Solo borra, y solo con el id exacto | Responde un número, nunca contenido |
| `POST /learning/evaluate` | Ninguno | No | Sin estado |
| `GET /premium/status` | Ninguno | No | Solo dice si existe |
| `POST /practice/extra/authorize` | `pass_token` | No | Firma del servidor; el bloque lo asigna el servidor; un campo `block` en la petición se ignora |

**Conclusión:** ninguna operación se autoriza con un identificador adivinable que el navegador elija. Un id de conversación es una capacidad: quien lo tiene puede continuar o borrar esa conversación, igual que el dueño. La memoria dura 24 h y no contiene datos de cuenta.

**Pendiente, sin autenticación en el servidor:** no hay límite de peticiones por usuario en `/chat`. Requiere un límite en el borde (Vercel) o una verificación de sesión: acción remota, no autorizada.

## 3. Comprobaciones

| Tema | Evidencia | Nivel |
|---|---|---|
| Autenticación, recuperación | `check-auth-service`, `check-auth-journeys` J1–J3 | Simulado |
| Aislamiento entre usuarios y cambio de cuenta | `check-browser-data-isolation`, `check-local-lease`, `check-stale-tab-*`, J4–J5 | Simulado |
| Progreso por idioma | J6–J7, `check-es-session` | Simulado |
| Recuperación y expiración de sesión | `check-auth-service`; real en `qa-real-journeys` (J8, token alterado, cierre revoca) | Simulado; real **listo, sin ejecutar** |
| Preferencias | `check-cloud-preferences`, `CLOUD_PREFERENCES_RELEASED=false` | Sin nube |
| Exportación y borrado | J9, `check-learner-data` | Simulado |
| Premium | `tests/test_premium_practice.py` | Servidor local |
| Peticiones manipuladas | `tests/test_server_memory_privacy.py`, `test_premium_practice.py` | Servidor local |

## 4. Atar Premium y `/chat` a la cuenta

Hoy el pase es al portador. Atarlo exige que el servidor verifique el JWT de la sesión con claves públicas (JWKS). Eso **no** usa `service_role` ni escribe en el proveedor, pero sí amplía `CLAUDE.md`: decisión pendiente del propietario (`docs/project/claude-md-multilingual-proposal.md`). Sin eso:
- Un pase copiado funciona en otro navegador. El límite diario sigue siendo por cuenta.
- `/chat` queda abierto, con filtro y modo guiado.

## 5. Control de edad

| Vía | Resultado |
|---|---|
| Registro en la app | Pregunta antes del formulario; declaración en metadatos |
| Cuenta creada fuera de la app | Pregunta tras iniciar sesión; nada se abre antes |
| Sin sesión | Solo la entrada; no hay modo invitado |
| Respuesta «menos de 18» y reintento | Bloqueo de 24 h en el dispositivo |
| Borrar datos u otro navegador | **Evita el bloqueo** |
| Mentir | **Evita el control**: es una autodeclaración, no verificación |
| Frontend modificado | **Evita el control** |
| `POST /chat` directo | **Evita el control.** El servidor no conoce la edad. Aplican filtro y chat guiado; el motor no genera contenido adulto |

**Implementado:** pregunta neutral, sin fecha de nacimiento; solo el hecho «declaró 18+» y su fecha.
**Riesgo restante:** un menor puede usar el servicio mintiendo. Mitigación: contenido sin material adulto, chat guiado y procedimiento de eliminación ante aviso.
**Antes de publicar:** revisión jurídica de esta posición, y decidir si `/chat` exige sesión verificada (§4).

## 6. Entorno real

- Script del lado proveedor: `linguachat-frontend/src/auth/qa-real-journeys.mjs`. Se niega sin autorización explícita, con un host distinto, con pinta de producción o con una clave privada; su autoprueba corre en `check:all`.
- Configuración: `docs/release/2026-11-auth-qa.env.example`.
- Recorridos del navegador: `docs/release/2026-11-auth-journeys.md`.
