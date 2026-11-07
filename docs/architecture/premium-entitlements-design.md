# Premium: diseño mínimo de derechos

> Fase 5, 2026-11-07. **Diseño. Nada está construido ni activo.** Premium sigue apagado. Sin cuentas, credenciales ni procesador.
> Base: `docs/architecture/premium-practice.md`. Depende de la propuesta JWT (`proposal/backend-jwt-verify`).

## 1. Piezas

| Pieza | Decisión | Depende de |
|---|---|---|
| Identidad | El `sub` verificado del token. Sin segundo sistema de cuentas. El pase debe coincidir con ese `sub` | Aprobar el cambio de `CLAUDE.md` |
| Base duradera | Una base gestionada detrás de la interfaz de `app/billing/usage_store.py`. Vercel no conserva disco | Autorización y elección del proveedor |
| Emisión | Solo un *webhook* con firma verificada crea un derecho. El navegador nunca lo hace | Procesador |
| Estado | Una fila por cuenta | Base duradera |
| Revocación | Ya existe por pase y por cuenta; pasa a la base | Base duradera |
| Sandbox | Pruebas con el modo de prueba del procesador antes de cualquier cobro | Cuenta del propietario |

## 2. Estados

| Estado | Acceso | Entra por |
|---|---|---|
| `none` | Gratis | Inicio |
| `active` | Premium | Pago válido |
| `canceled` | Premium hasta `period_end` | Cancelación |
| `past_due` | Premium durante la gracia del procesador | Pago fallido |
| `expired` | Gratis | Fin del periodo |
| `revoked` | Gratis, de inmediato | Reembolso o contracargo |

Reglas: eventos idempotentes por id del procesador; un evento viejo no retrocede el estado; si la base no responde, falla cerrado; el progreso y los controles de privacidad nunca dependen del pago.

## 3. Registro mínimo

`entitlements(subject, plan, status, period_end, processor, processor_ref, updated_at)` y `processed_events(event_id, received_at)`. Sin datos de tarjeta ni dirección: los guarda el procesador.

## 4. Orden de trabajo, cuando se autorice

1. JWT en el servidor. 2. Base duradera y migrar `usage_store`. 3. Tabla de derechos y máquina de estados con pruebas. 4. *Webhook* en sandbox. 5. Recorridos de compra, cancelación, reembolso y cambio de dispositivo. 6. Solo entonces, decidir ventas.

## 5. ¿Vale la pena Premium?

**Hoy no justifica una suscripción.** Gratis ya incluye lecciones, repaso, misiones y situaciones. Premium solo añade tres bloques al día de lo mismo, y A1 sigue cerrado. Además, el tutor local tiene costo casi cero: no hay costo que justifique limitar.

| Función con bajo costo marginal | Valor | Riesgo |
|---|---|---|
| Plan de repaso espaciado ampliado (ya hay datos locales) | Alto si `retained` predice retención | Bajo |
| Informe mensual: qué retuviste, qué perdiste | Alto y comprensible | Debe ser honesto |
| Más situaciones por nivel | Medio; el tutor las sigue | Requiere autoría y revisión |
| Niveles superiores | El mayor, cuando estén aprobados | Exige revisión humana y evidencia |
| Exportar progreso en PDF | Bajo a medio | Bajo |

**Recomendación:** no fijar precio hasta tener A1 abierto y datos de retención del piloto. Nunca poner tras un pago la seguridad, la eliminación de datos ni la privacidad.
