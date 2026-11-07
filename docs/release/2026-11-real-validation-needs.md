# Qué hace falta para validar en real

> Fase 5, 2026-11-07. Plan para Vercel Preview y Supabase de prueba. **Nada de esto se ha ejecutado.** Procedimiento de PR: `2026-11-pr-procedure.md`. Recorridos: `2026-11-auth-journeys.md`.

## Lo que el propietario debe entregar o autorizar

| # | Qué | Para qué | Quién |
|---|---|---|---|
| 1 | Autorización de *push* y dos PR en borrador | Crear Vercel Preview | Propietario |
| 2 | Proyecto Supabase **de prueba**, nuevo, sin ningún dato de EvoLabs | Autenticación real | Propietario lo crea |
| 3 | URL del proyecto y clave **pública** (`anon`). Nunca `service_role` | `.env` de QA y variables de Preview | Propietario |
| 4 | Firma con claves asimétricas en ese proyecto | Permite la propuesta JWT | Propietario |
| 5 | Dos alias de correo de prueba y una contraseña desechable | Cuenta A y cuenta B | Propietario; se escriben solo en su `.env` local |
| 6 | URL de redirección de Preview en el proyecto de prueba | Confirmación y recuperación | Propietario |
| 7 | Variables en Vercel solo para Preview: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Que Preview use el proyecto de prueba | Propietario |
| 8 | Decidir el cambio de `CLAUDE.md` (JWT) | `/chat` con sesión, Premium por cuenta | Propietario |

Producción no se toca. `CLOUD_PREFERENCES_RELEASED` sigue en `false`.

## Orden

1. PR A y PR B en borrador (decisión 1). Revisar CI y Preview.
2. Con el proyecto de prueba: `node src/auth/qa-real-journeys.mjs` (se niega fuera de un proyecto autorizado).
3. Los 10 recorridos en navegador sobre Preview: registro, inicio de sesión, recuperación, cambio de cuenta, aislamiento A→B→A, progreso de inglés, progreso de español, persistencia, eliminación y fallos de conexión.
4. Registrar cada resultado. **Si uno falla, no hay beta externa.**
5. Con JWT aprobado: repetir entrada a `/chat` con token válido, vencido, alterado y de otra cuenta.

## Tipos de prueba

| Tipo | Estado |
|---|---|
| Simuladas | 10 recorridos, `check-auth-journeys`; curso × nivel con almacenes simulados |
| Locales reales | Backend real por HTTP, navegador real con banco de pruebas |
| Propuesta JWT | Token real firmado localmente, claves de prueba, sin red |
| Preview y Supabase de prueba | **Pendientes** |
| Producción | **Nunca como laboratorio** |

## Edad

Beta solo para adultos. Medidas que existen hoy: pregunta neutral antes del formulario, bloqueo de 24 h en el dispositivo, sin fecha de nacimiento guardada, contenido sin material adulto, chat guiado y procedimiento de eliminación ante aviso. Medida de lanzamiento: invitación individual.

**Es evitable** (`docs/architecture/authz-review.md` §5). Reducir exposición: beta por invitación, sin enlace público ni indexación, y con `/chat` exigiendo sesión si se aprueba JWT. Esto **no** es verificación de edad ni cumplimiento completo de normas sobre menores.
