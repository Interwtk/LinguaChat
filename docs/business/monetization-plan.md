# Plan de monetización — beta noviembre 2026

> **Estado (2026-11-02, fase 2):**
> - **Sin cobros, sin proveedor conectado y sin credenciales.**
> - Hay un núcleo de derechos premium **preparado e inactivo** en el servidor (`linguachat-backend/app/billing/entitlements.py`, 10 pruebas), sin ninguna ruta que lo exponga.
> - Nada de este documento autoriza activar cobros.
>
> **Fuentes:**
> - `docs/business/research/2026-11-01-payments-pricing-research.md` (precios y comisiones);
> - `docs/business/research/2026-11-02-polar-paddle-eligibility.md`;
> - `docs/business/chile-tax-and-commercial-compliance.md`;
> - `docs/business/accountant-handoff.md`.

## 1. Principio

Solo se cobra por lo que **existe** y aporta valor sostenible. Siempre son gratis:
- aprender (lecciones de los niveles abiertos, repasos esenciales, correcciones);
- la seguridad;
- los controles de privacidad (descargar y borrar datos).

## 2. Catálogo honesto (verificado por `check-learner-data` contra el código)

| Función | Estado | Plan |
|---|---|---|
| Lecciones Pre-A1: inglés (17) y español (12) | **Disponible** | Gratis |
| Correcciones y explicaciones | Disponible | Gratis |
| Repasos espaciados por curso | Disponible | Gratis |
| Sesión diaria: inglés y **español** (repaso, lección, reintento de error, transferencia, misión) | **Disponible** (español nuevo en fase 2) | Gratis |
| Chat de práctica con Lingua: inglés y **español** (reglas, sin IA generativa) | **Disponible** (español nuevo) | Gratis |
| Voz del dispositivo (inglés y español) | Disponible donde el navegador tenga voz | Gratis |
| Descargar o borrar los propios datos | **Disponible** (nuevo) | Gratis, siempre |
| Inglés A1 (21 episodios) | **Cerrado** | **No se anuncia** hasta su apertura |
| Español A1+, voz evaluada, IA generativa | No existe | Futuro, no se anuncia |

La **pantalla de Planes ya fue corregida** (commit `e434e60`):
- solo lista funciones reales, cada una con su prueba;
- Premium aparece como «No disponible: no vendemos nada durante esta beta», sin lista de funciones;
- lo futuro va bajo «En construcción — no disponible ahora»;
- no hay precio, selector de región ni botón que parezca comprar algo.

## 3. ¿Qué Premium honesto puede existir pronto?

Evalué lo que se puede construir **reutilizando el motor** sin prometer nada que no exista:

| Candidato | ¿Qué es? | Costo marginal | ¿Honesto? | Esfuerzo |
|---|---|---|---|---|
| **Práctica extra del día** | Rondas adicionales tras la sesión diaria: más transferencias y misiones, con el mismo planificador y evaluador | ≈ 0 (motor local) | **Sí**, si la sesión diaria y los repasos vencidos siguen gratis | Bajo (1–2 días): el planificador ya produce estos bloques |
| **Más misiones** (guiones nuevos sobre lecciones completadas) | Contenido adicional de práctica | ≈ 0 | Sí, si existen al lanzarse | Medio (contenido) |
| **Informe de progreso descargable** | Resumen por capacidad, con evidencia independiente frente a asistida | ≈ 0 | Sí | Bajo |
| Inglés A1 | Nivel siguiente ya construido | ≈ 0 | **Solo tras la decisión de apertura** (`CLAUDE.md`, issue #101) | Ya hecho |
| IA generativa | Conversación más natural | **Variable, sin medir** | No hasta medir costos y tener autorización | Alto |

**Recomendación:**
- **Primer Premium posible:** «Práctica extra» más «Informe de progreso».
- **Segundo:** inglés A1, cuando el propietario lo apruebe.
- **No se construye antes de tener:** entidad legal, procesador aprobado y respuesta del contador.
- **El 15 de noviembre la beta sale gratuita.**

### 3.1 Fase 3: primera función Premium construida (no a la venta)

**Práctica adaptativa adicional:**
- **qué ofrece:** hasta 3 bloques al día después de la sesión gratuita;
- **cómo se arma:** con el planificador existente;
- **quién decide:** el servidor, mediante un pase firmado;
- **activación:** apagada por defecto;
- **costo variable:** sin costo de IA.

**Pendiente para venderla:**
- procesador aprobado por escrito (`payment-processor-checklist.md`);
- inicio de actividades y respuestas del contador;
- emisión del pase vía *webhook*;
- contador persistente;
- recomendado: verificar el JWT en el servidor (cambio de `CLAUDE.md`).

**Correcciones de comisiones** (fuente oficial, fase 3):
- Polar Starter: **5 % + 50¢**, +1,5 % con tarjetas no estadounidenses;
- Paddle: 5 % + 50¢.

Detalle: `docs/architecture/premium-practice.md`.

## 4. Precios (escenarios, no pronósticos)

| Plan candidato | Neto con Polar Starter, tarjeta de EE. UU. | Ídem, tarjeta no estadounidense |
|---|---|---|
| US$7,99/mes | 7,09 (89 %) | 6,97 |
| **US$39,99/año (recomendado)** | 37,49 (94 %) | 36,89 |
| CLP 4.990/mes (MoR) | ≈ 85 % antes de impuestos chilenos: **depende de la respuesta del contador** (flujo 3, IVA sobre el pago) | — |

- **Banda de competidores:** entre ~US$10 y 25 al mes, o entre ~US$60 y 170 al año.
- **Demanda de LinguaChat:** desconocida. Fórmula de escenarios en la memoria de pagos, C.4.
- **Margen real en Chile:** puede bajar hasta 19 puntos si el pago del MoR queda afecto a IVA. Hay que resolverlo **antes** de fijar precio.

## 5. Procesador

**Investigar primero Polar; Paddle como alternativa con *sandbox* en paralelo.** Razones y riesgos en `chile-tax-and-commercial-compliance.md` §5.

Resumen:
- **Polar:**
  - elegibilidad chilena confirmada (persona o empresa);
  - pagos al vendedor en CLP;
  - estado del cliente sin base de datos propia;
  - *sandbox*.
- **Por confirmar con Polar:**
  - la clasificación de un tutor por reglas (la IA de chat está «restringida»);
  - el IVA chileno.

## 6. Arquitectura de derechos premium

**Hecho (inactivo, probado):** `app/billing/entitlements.py`
- **Verificación de *webhooks* firmados:**
  - esquema Standard Webhooks (el de Polar): HMAC-SHA256 sobre `id.timestamp.body`, ventana de 5 minutos;
  - pruebas de manipulación del cuerpo, firma falsa, cabecera ausente y reenvío fuera de la ventana.
- **Máquina de estados idempotente:**
  - estados: activo, prueba, gracia por pago vencido, cancelado al fin del periodo, expirado, reembolsado y revocado;
  - eventos repetidos o fuera de orden no cambian nada;
  - un producto desconocido no otorga acceso;
  - cancelar mantiene el acceso hasta el fin del periodo;
  - reembolsar o revocar lo corta.
- **Ninguna ruta lo expone** (también hay prueba de ello).

**Falta (requiere autorización):**

```
Checkout alojado (Polar) ──► webhook firmado ──► /api/billing/webhook (verifica, aplica, responde 2xx)
Frontend (sesión) ──► GET /api/entitlement ──► el servidor pregunta a Polar "customer state" por user_id
                                              (external_id) y responde active/none; el navegador nunca decide
```

**Conflicto de contrato (`CLAUDE.md`):** el servidor tiene que saber **quién** pregunta (el `user_id` de la sesión). El contrato prohíbe el «backend Supabase» y las claves privadas. Propongo el **cambio mínimo**:

| | Propuesta mínima | Alternativa |
|---|---|---|
| **Qué** | El backend **solo verifica** el JWT de sesión con las **claves públicas** (JWKS) del proyecto. Sin `service_role`, sin cliente Supabase en el backend, sin leer ni escribir la base de datos. El estado de suscripción lo guarda el MoR (Polar Customer State). | Tabla `entitlements` en Supabase escrita por el *webhook* con `service_role` y lectura con RLS (más superficie; requiere clave privada) |
| **Riesgos** | Caché y rotación de JWKS; disponibilidad de la API de Polar (con caché corta y respuesta «sin acceso» ante la duda) | Clave privada en el servidor; migraciones; RLS |
| **Pruebas necesarias** | Token inválido, expirado o de otro proyecto → 401; usuario A nunca ve el derecho de B; Polar caído → sin acceso y sin error 500; *webhook* falso → 401 | Las mismas, más RLS de denegación cruzada |
| **Autorización** | Escrita, del propietario, que modifique `CLAUDE.md` § Cloud persistence | Ídem, más el alcance de `service_role` |

**Cancelaciones y reembolsos:**
- Cancelar es posible desde la app con un enlace al portal del cliente del MoR, tan fácil como suscribirse (ROSCA y la ley de renovación automática de California).
- Los reembolsos los decide y ejecuta el MoR. El acceso termina por evento `revoked` o `refunded`.
- Los derechos irrenunciables del consumidor no se reducen: retracto en Chile y desistimiento en la UE.

## 7. Bloqueos para cobrar (sin cambios en lo esencial)

1. Entidad legal e inicio de actividades (ver la ficha del contador).
2. Respuesta del contador sobre el IVA del flujo MoR y la exención educacional.
3. Cuenta del procesador aprobada, con las confirmaciones escritas de Polar.
4. Autorización del cambio mínimo de contrato (§6) y su implementación con las pruebas listadas.
5. Términos con renovación, cancelación y reembolso revisados por un abogado (Chile y California como mínimo).
6. Un Premium que exista (§3).
7. QA real de pagos en *sandbox* y de autenticación con una cuenta de prueba.

**Hasta resolverlos: beta gratuita, con lista de espera opcional y sin cobros improvisados.**
