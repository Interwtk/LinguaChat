# Plan de monetización — beta noviembre 2026

> Estado: **diseño**. No hay cobros, ni proveedor de pago conectado, ni código de suscripción. Nada de este documento autoriza activar cobros.
> Fuentes: `docs/business/research/2026-11-01-payments-pricing-research.md` (proveedores, precios de competidores, cálculo de comisiones) y `docs/legal/jurisdiction-matrix.md`.

## 1. Principio

Se cobra solo por lo que **existe hoy** y aporta valor sostenible. Lo necesario para aprender —lecciones del nivel abierto, progreso, repasos, correcciones y seguridad— es **gratis** y no se bloquea por pago.

## 2. Catálogo honesto de funciones (al 2026-11-02)

| Función | Estado real | Plan |
|---|---|---|
| Inglés Pre-A1 (17 episodios), para hispanohablantes y los 8 idiomas de interfaz | **Disponible** | Gratis |
| Español Pre-A1 (12 episodios), explicado en inglés | **Disponible en la rama local** (no publicado) | Gratis |
| Progreso, racha, Jardín de palabras, repasos espaciados | Disponible | Gratis |
| Tutor local con correcciones (episodios) | Disponible | Gratis |
| Conversación libre con Lingua (`/chat`, motor local por reglas) | Disponible **solo en inglés** | Gratis, con límite diario razonable (**pendiente de implementar**; hoy no hay límite) |
| Sesión diaria adaptativa, misiones, minihistorias | Disponible **solo en inglés** | Gratis |
| Escucha con voz del dispositivo (TTS del navegador) | Disponible (inglés) | Gratis |
| Inglés A1 (21 episodios construidos) | **Cerrado** (`available: false`) | Candidato a Premium **solo tras** la decisión de apertura de A1 |
| Inglés A2–C2 (contenido construido) | Cerrado; sin puerta programada | Futuro |
| Español A1+ | No existe | Futuro |
| Práctica por voz, pronunciación, llamadas | No existe (fuera del alcance autorizado) | Futuro, no anunciar |
| Conversación con IA generativa | No existe (sin proveedor autorizado) | Futuro, no anunciar |

**Defecto actual que bloquea:** `src/services/pricing.js` y la pantalla de Planes listan para Premium «Unlimited practice and missions», «Deeper feedback and review», «Voice practice (coming soon)» y «Priority access». Ninguna existe como diferencia real: lo gratuito ya es ilimitado. Aunque Premium aparece como «coming soon», el texto promete funciones inexistentes. **Corrección propuesta (próximo bloque):** sustituir la tarjeta Premium por una de «Premium: en preparación» sin lista de funciones, o con la del catálogo de arriba marcada como futura.

## 3. Modelo propuesto

**Gratis (siempre):** todos los niveles abiertos de cada curso, progreso, repasos, correcciones, chat local con límite diario y todas las funciones de seguridad y privacidad (exportar y borrar datos).

**Premium (cuando exista algo real que vender), en orden de viabilidad:**

1. **Niveles siguientes ya construidos.** Inglés A1 tiene 21 episodios. Requiere la decisión de apertura que exige `CLAUDE.md`, además del QA pedagógico. Es el primer Premium honesto posible: contenido real, costo marginal casi nulo con motor local.
2. **Práctica extendida** sobre el motor existente: más variantes de transferencia por episodio y repasos adicionales opcionales. Los repasos **esenciales** siguen siendo gratis.
3. **Funciones avanzadas cuando estén implementadas** (voz, IA generativa con costos medidos). No antes.

**Lo que no se hará:** vender «conversaciones ilimitadas con IA» sin proveedor ni costo medido; bloquear repasos o seguridad; mecánicas de urgencia falsa o recompensas variables tipo azar (`CLAUDE.md`).

**Si el propietario quiere ingresos en noviembre sin A1 abierto:** la única opción honesta es una **lista de espera** con precio fundador, sin cobro, o un aporte voluntario («Supporter») que **no** prometa funciones. Esta segunda opción requiere revisión legal: los cobros recurrentes por «apoyo» siguen sujetos a ROSCA, a la ley de renovación automática de California y al retracto chileno.

## 4. Precios (escenarios, no pronósticos)

Banda de competidores (App Store de EE. UU., 2026-11-01):

- **Mensual:** entre ~US$10 y 25.
- **Anual:** entre ~US$60 y 170, es decir ~US$5–14 al mes.
- **Chile:** suele cobrarse el 40–60 % del precio de EE. UU. (CLP 4.200–19.990 al mes).

| Plan candidato | Neto por cobro, Polar Starter, tarjeta EE. UU. | Ídem, tarjeta no estadounidense | Nota |
|---|---|---|---|
| US$4,99/mes | 4,24 (85 %) | 4,17 | La comisión fija se come el 10–15 % |
| US$7,99/mes | 7,09 (89 %) | 6,97 | Recomendado si hay mensual |
| US$39,99/año | 37,49 (94 %) | 36,89 | **Recomendado** para la beta |
| US$59,99/año | 56,49 (94 %) | 55,59 | |
| CLP 4.990/mes vía Flow (sin MoR) | ≈ CLP 4.049 (81 %) | — | Tú eres vendedor de registro: pagas IVA y emites boleta |

**Fórmula (sin supuestos de demanda):**

```
neto_mensual = usuarios_activos × conversión × neto_por_cobro − costos_de_pago − disputas × 15 − reembolsos
```

Escenarios de conversión de 1 %, 3 % y 5 % en la tabla C.4 de la investigación. **No hay datos de demanda de LinguaChat.** Cualquier cifra de ingresos es ilustrativa.

**Infraestructura por estudiante (motor local):** Vercel y Supabase hoy no tienen costo marginal medido por estudiante. El chat no llama a ningún proveedor de pago. **No medido:** costo real a escala (invocaciones de funciones en Vercel, usuarios de autenticación en Supabase). Medir antes de fijar precios.

## 5. Procesador de pagos

**Recomendación para la beta: Polar.sh (plan Starter) como *Merchant of Record*; Paddle como alternativa en paralelo.**

- **Stripe no admite cuentas chilenas** (verificado). Su servicio de *Merchant of Record* tampoco admite Chile. La vía de una LLC en EE. UU. con Atlas es una decisión societaria y fiscal, no técnica.
- **Polar:**
  - admite pagos a Chile y actúa como vendedor de registro, por lo que gestiona el IVA de la UE, el impuesto de consumo de Japón y el impuesto de ventas de EE. UU.;
  - comisión publicada de 5 % + US$0,50, más 1,5 % con tarjetas no estadounidenses;
  - US$15 por disputa, se gane o no;
  - *webhooks* firmados (Standard Webhooks).
- **Paddle:**
  - productos de menos de US$10 requieren tarifa a medida;
  - pago mínimo de US$100;
  - transferencia SWIFT a Chile de unos US$15.
- **Lemon Squeezy: evitar.** Se está integrando en el *Merchant of Record* de Stripe, que no admite Chile.
- **Flow o Mercado Pago:** solo si hay volumen chileno real, con entidad registrada para IVA.

**Un *Merchant of Record* no resuelve:** privacidad (Ley 21.719, RGPD, APPI), retracto y desistimiento, consentimiento de renovación (California), ni la pantalla final japonesa. Siguen siendo nuestros.

## 6. Arquitectura de derechos premium (diseño, sin implementar)

**Requisito: el navegador nunca decide si alguien es Premium.**

```
Checkout (Polar, alojado) ──► webhook firmado ──► backend (función de Vercel /api)
                                                    │ 1. verificar firma (secreto en env del servidor)
                                                    │ 2. idempotencia por event_id (rechazar repetidos)
                                                    │ 3. transición de estado válida
                                                    ▼
                                         almacén de derechos (servidor)
                                                    │
Frontend ──(JWT de la sesión)──► GET /api/entitlement ──► lee el estado; nunca confía en el cliente
Contenido Premium ◄── el backend sirve o autoriza solo si active/grace
```

**Estados:** `none → active → (past_due → grace) → canceled_at_period_end → expired`, más `refunded` y `revoked` en caso de *chargeback*. Las transiciones vienen solo de *webhooks* verificados, o de una consulta de conciliación periódica a la API del proveedor.

**Reglas:**

- Comparar el importe y el producto del evento con el catálogo del servidor.
- Responder `2xx` solo tras persistir.
- Reintentos seguros.
- Registro de auditoría sin datos de tarjeta (el proveedor los guarda).
- Cancelación desde la app, con enlace al portal del cliente del proveedor, tan fácil como suscribirse.
- Al expirar se conserva el progreso; solo se cierra el acceso a lo Premium.

**Conflicto de alcance (decisión del propietario).** `CLAUDE.md` prohíbe hoy el Supabase de backend y las credenciales de rol de servicio. Un almacén de derechos en el servidor necesita una de estas opciones:

- **(a)** Ampliar el alcance autorizado: una tabla `entitlements` escrita solo por el *webhook*, con RLS de solo lectura para el dueño de la fila.
- **(b)** Sin base de datos propia: el backend consulta en cada solicitud el estado del cliente en la API de Polar, con caché corta. Exige que el backend verifique el JWT de la sesión de Supabase mediante JWKS.

Ambas requieren autorización escrita. Mi recomendación es **(b)** para la beta: menos datos guardados y menos superficie.

## 7. Bloqueos para cobrar (todos fuera del código)

1. Entidad legal (persona natural o empresa) e inicio de actividades en el SII.
2. Cuenta aprobada en Polar o Paddle (KYC). **No solicitada.**
3. Revisión de términos, retracto y renovación: Chile, California y UE si se vende allí.
4. Funcionalidad Premium real: apertura de A1 u otra.
5. Decisión de alcance del almacén de derechos (§6).
6. Corrección de la tarjeta Premium engañosa (§2).

**Hasta resolverlos: beta gratuita con lista de espera.**
