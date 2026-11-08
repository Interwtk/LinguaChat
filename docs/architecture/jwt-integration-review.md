# Verificación del token en el servidor: revisión para decidir

> Fase 6, 2026-11-07. **Nada de esto está activo.** Backend: `proposal/backend-jwt-verify` @ `ff6e7d8`, sin fusionar. Frontend: `src/auth/sessionToken.js` en la rama beta, apagado (`VITE_AUTH_SEND_TOKEN=false`).
> `CLAUDE.md` no se editó. Texto propuesto: `docs/project/claude-md-jwt-proposal.md`.

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | Qué cambia en `CLAUDE.md` | Una excepción: el servidor puede verificar la firma del token con las claves **públicas** del proyecto LinguaChat, solo para identificar a quien llama a `/chat`, `/chat/forget` y Premium. Sigue prohibido: clave de servicio, base directa, SDK del proveedor en el servidor, Storage y Edge Functions |
| 2 | Cómo viaja el token | `Authorization: Bearer <token>`, en memoria, tomado de la sesión del proveedor en cada evento (entrada, renovación, salida). Nunca en almacenamiento, registros ni URL. Solo a nuestra API, solo en las rutas que pueden exigirlo |
| 3 | Cómo se verifica la firma | Solo ES256 o RS256, lista fija en el código. Rechaza `none` y todo HS*. Claves del JWKS del proyecto, en caché 10 min. Un `kid` desconocido provoca a lo sumo una nueva consulta por minuto |
| 4 | Emisor y audiencia | Emisor exacto y audiencia por variables de entorno. Valores esperados del proveedor: emisor `https://<proyecto>.supabase.co/auth/v1`, audiencia `authenticated`. **Por confirmar con el proyecto de prueba**; no se inventan |
| 5 | Expiración | `exp` obligatorio y `nbf` respetado, con 30 s de margen. Sin `sub`: rechazo |
| 6 | Aislamiento | La única identidad es el `sub` verificado. `user_id` del cuerpo se ignora. La memoria del chat se indexa por `hash(sub, sesión)`: el id de otra cuenta no alcanza nada |
| 7 | Sin token | Interruptor apagado: todo igual que hoy. Encendido: 401, motivo solo en el registro. También 401 si faltan las claves o la configuración (falla cerrado) |
| 8 | Sesiones existentes | Al cargar, la sesión guardada se lee y su token se anota. Al encender, la memoria de chat anterior (24 h como máximo) deja de alcanzarse: se pierde contexto, no progreso, que vive en el dispositivo. Pases Premium anteriores: solo valen si su `sub` coincide |
| 9 | Efecto en `/chat` | Encendido: exige sesión. Cierra el acceso directo sin cuenta y hace posible un límite por cuenta. No cambia escenarios ni filtro |
| 10 | Efecto en Premium | Un pase de otra cuenta recibe 403 y no gasta bloques. El límite diario pasa a ser de la cuenta verificada |
| 11 | Pruebas adversariales | 87 en la rama, sin red, con claves locales: vencido, futuro, carga alterada, firma alterada, emisor y audiencia ajenos, sin `sub`, `none`, HS256 con la clave pública, `kid` desconocido, JWKS caído, pase de otra cuenta, `user_id` falso, cambio de usuario, interruptor apagado. Frontend: `check-session-token`, 7 casos |
| 12 | Reversión | Apagar `LINGUACHAT_AUTH_REQUIRED` y `VITE_AUTH_SEND_TOKEN` restaura el comportamiento actual sin desplegar código. Para quitar el código: revertir el commit de la rama. No hay datos que migrar |

## Orden para encenderlo (después de aprobar)

1. Aprobar el cambio de `CLAUDE.md` y la dependencia `PyJWT[crypto]`.
2. Fusionar la rama en un PR propio, con el interruptor apagado.
3. Proyecto de prueba con firma asimétrica (`2026-11-supabase-test-project-guide.md`).
4. En **Preview** solamente: emisor, audiencia y JWKS; luego `VITE_AUTH_SEND_TOKEN=true` y `LINGUACHAT_AUTH_REQUIRED=true` **a la vez**.
5. Recorridos reales, más token válido, vencido, alterado y de otra cuenta.

**Nunca encender el backend sin el frontend**: daría 401 a todos.

## Lo que no resuelve

- Cerrar sesión no invalida un token antes de su `exp`.
- `/learning/evaluate` y `/chat/scenarios` siguen abiertos (no guardan datos).
- Sin límite de peticiones todavía: el token lo hace posible, no lo implementa.
- No se ha probado con un proveedor real.
