# Informe técnico: Fase 8, preparación de la beta externa (2026-11-07)

> **Rama local:** `beta/2026-11-es-for-en`, sin *push*. Base: `19b4146`. Código probado: `docs/release/2026-11-beta-readiness.md` § Ciclos de la fase 8.
> **Sin acciones remotas:** ningún *push*, PR, *merge*, *deploy*, cambio en Vercel o Supabase, cuenta ni cobro. Solo lectura: `git fetch`. Rutinas pausadas sin tocar.

## 1. Ramas

| Rama | Estado | Sin publicar |
|---|---|---|
| `origin/main` | `086323c`, público, sin protección | — |
| `integration/local-p0-p5` (PR A) | local, lista para PR | 8 |
| `beta/2026-11-es-for-en` (PR B) | local, lista para PR tras reescritura | 85 más los commits de documentación |
| `proposal/backend-jwt-verify` | local, sin fusionar | 52 |
| `proposal/pre-a1-option-order` | local, antecedente | 27 |

Ninguna rama local está en el remoto.

## 2. Riesgos del historial que impiden el *push*

1. **Conjuntos sellados** en commits locales: un *push* los publicaría y dejarían de medir. Ya están fuera del árbol versionado (`165451c`), con copia privada y una comprobación; siguen en el historial local.
2. **Correo personal:** **ya es público en `main`** (129 commits). Las fases 6 y 7 lo describieron mal. Reescribir evita sumar 172 commits más, no retira los publicados.

Plan y garantías: `docs/release/2026-11-history-rewrite-plan.md`. Ensayado en un clon: correcto.

## 3. Preview de Vercel

| Dato | Fuente | Estado |
|---|---|---|
| Vercel Authentication con *Standard Protection* | Captura del propietario y `ssoProtection.enabled=true`, alcance `all_except_custom_domains` | **Confirmado** |
| Dominios personalizados | Fuera de esa protección por diseño | **No protegidos.** No servir la beta en uno sin otra protección |
| Enlace compartible activo | Evidencia previa | **Revisar y revocar** antes de publicar: entra sin autenticación |
| Acceso desde incógnito | — | **Sin verificar** |
| Variables de Preview | El código solo lee las `VITE_*` públicas y, en el servidor, claves anuladas o sin uso (`2026-11-beta-phase7.md` §2) | **Valores reales sin revisar**: hazlo tú, sin mostrarlos |
| Supabase de la Preview | El **mismo** proyecto que producción | Protección imprescindible |

## 4. Autenticación

- **Simulada:** 10/10 (25 casos).
- **Real:** 0 de 10.
- **Ejecutor revisado.** Escribe solo:
  - `/signup` de las dos cuentas `+lcqa`;
  - `/recover` (envía dos correos a tus alias);
  - `/logout`.
- **El ejecutor no hace:** borrados, llamadas de administrador, tablas, RPC ni cambios de configuración.
- **JWT, ensayo de fusión con la beta actual:** 1886 pruebas pasan. Los conjuntos sellados no vuelven al árbol.
- **Pruebas locales adversariales** (44 funciones, 87 casos): token válido, vencido, futuro, carga y firma alteradas, otra clave con el mismo `kid`, emisor y audiencia ajenos, sin `sub`, `none`, HS256 con la clave pública, `kid` desconocido o ausente, rotación, JWKS caído, pase de otra cuenta, `user_id` falso, cambio de usuario.
- **Frontend:** listo para enviar el token, apagado.
- **Activación:** atómica, solo en Preview (`2026-11-beta-phase7.md` §4). **No se activa** sin recorridos reales previos ni reversión probada.

## 5. Mejoras independientes

- **Inglés A1 (cerrado), D1:** «di 45» aceptaba cualquier número y acreditaba 11–100 con «Five.». Ahora acepta solo el número pedido y muestra el modelo correcto. Pre-A1 sin cambios.
- **Inglés A1, D2:** «How are you?» evaluaba una pregunta en vez de una respuesta.
- **Nueva comprobación:** las 52 respuestas modelo de A1 pasan su propio evaluador. Antes una no pasaba.
- **Sellados privados:** fuera del árbol, comprobación en `check-sealed-private` y en el ciclo de QA.
- **Script de reescritura:** quita también los sellados. El ensayo destapó un error del script, corregido.

## 6. Qué falta para B

| Requisito | Estado | Quién |
|---|---|---|
| Historial publicable (reescritura) | Script listo y ensayado | Tu autorización |
| Revocar el enlace compartible y verificar en incógnito | Pendiente | Tú |
| *Push* y PR en borrador | Pendiente | Tu autorización |
| Revisión de solo lectura del proyecto, *Redirect URLs* | Consultas listas | Tú |
| 10 recorridos reales con cuentas `+lcqa` | Ejecutor listo | Tu autorización |
| Verificación JWT en el servidor | Lista, apagada | Tu autorización, después de los recorridos |
| Contacto de privacidad y nombre del operador | Pendiente | Tú |
| Derechos de Chatto y de los activos | Sin documentar | Tú |
| Revisión de contenido y mensajes de crisis para el piloto | No ocurrida | Revisor humano |
| Alcance honesto del tutor | Hecho: aviso permanente; chat libre cerrado | — |

## 7. Qué falta para C

Todo B, más:
- formalización en Chile y tratamiento tributario con contador;
- procesador aprobado (Polar o Paddle);
- suscripciones, derechos por cuenta y base gestionada;
- renovaciones, cancelaciones y reembolsos;
- precios regionales aprobados;
- revisión legal;
- pruebas en sandbox;
- hosting que permita uso comercial (no Hobby).

**No se activa nada de C.**
