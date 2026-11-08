# Precios regionales: modelo y política (borrador)

> Fase 4, 2026-11-04. **Ningún precio está aprobado ni se anuncia.** Código: `app/billing/regional_pricing.py`, ejemplo en `regional_pricing.example.json` (todo en `draft`), 9 pruebas. Ninguna ruta lo usa.

## 1. Modelo configurable

Cada región define: países, moneda, tasa de impuesto, comisión (porcentaje y fija), índice de poder adquisitivo, costo variable, precio local por plan y estado (`draft` o `approved`). Cada plan define sus *entitlements*, iguales en todas las regiones.

`quote()` muestra por precio: lo que paga el cliente, impuesto, comisiones, neto, costo variable, margen y si está aprobado. Un precio local no se elige sin ver su margen.

**Fase 5.** Cada región declara también procesador, tasa de reembolso esperada y tipo de cambio con fecha. `quote` resta los reembolsos del margen y da el margen en moneda base para comparar regiones. `sellable` responde si una región puede venderse y qué falta: precio aprobado, confirmación escrita del procesador, país cubierto, tipo de cambio fechado y tasa de reembolso. **Hoy ninguna región es vendible.** Polar y Paddle siguen `unverified`: estar disponible técnicamente no autoriza nada. Todos los valores del ejemplo son marcadores.

## 2. Política de residencia, moneda y cambio de país

| Regla | Detalle |
|---|---|
| Quién decide | El país de facturación **y** el del medio de pago, tal como los informe el procesador. Deben coincidir |
| IP | Solo puede decidir qué mostrar primero. **Nunca** desbloquea un precio |
| Sin dos señales coincidentes | Región base |
| País no listado | Región base |
| Moneda | La de la región resuelta. El cobro lo hace el procesador |
| Cambio de país | Aplica en la siguiente renovación, con aviso. El precio queda fijo en el periodo pagado |
| Progreso | Nunca depende del país ni del plan |
| VPN o datos falsos | Sin dos señales no hay precio regional. El procesador puede aportar más señales |

## 3. Qué no se hace

- No se anuncian descuentos regionales ni precios sin aprobar.
- No se usan contadores, urgencia ni precios tachados.
- No se fijan precios definitivos sin datos.

## 4. Datos que faltan para decidir

- Disposición a pagar: encuesta o prueba tras la beta.
- Tasa real de impuesto por región y su tratamiento (contador).
- Comisión del procesador elegido, con la conversión de moneda.
- Costo de soporte por usuario.
- Comparación con precios de mercado (`research/2026-11-01-payments-pricing-research.md`).

## 5. ¿Tres bloques extra al día justifican una suscripción?

**Probablemente no por sí solos.** Evaluación sin datos de usuarios:

- **A favor:** práctica real con buena base (recuperación espaciada, error frecuente, transferencia), sin costo de IA.
- **En contra:**
  - la sesión gratuita ya cubre lo esencial;
  - es más de lo mismo, no algo nuevo;
  - un estudiante constante en Pre-A1 agota pronto el material (12–17 lecciones);
  - los competidores ofrecen mucho más contenido.
- **Conclusión:** sirve para probar el circuito de pago y medir interés, pero el valor sostenible llegará con A1 y niveles superiores abiertos, informes de progreso o un tutor mejor. El límite de 3 es **provisional** (`EXTRA_BLOCKS_PER_DAY`).
- **Medir en la beta:** cuántos completan la sesión diaria, cuántos querrían más práctica y si la práctica extra mejora la retención a 7 días.
