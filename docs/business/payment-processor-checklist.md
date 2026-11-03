# Procesador de pagos: lista de resolución (Polar y Paddle)

> Fase 3, 2026-11-03.
> - **No se activó ninguna cuenta, no se aceptaron condiciones y no se pidieron credenciales.**
> - Fuente de cada fila: `research/2026-11-03-sii-official-verification.md` §8–9.
> - **«Escrito»** = hace falta una respuesta escrita del procesador antes de decidir.

| Punto | Polar | Paddle |
|---|---|---|
| Elegibilidad desde Chile | Chile en la lista de *payouts* (Stripe Connect Express). **Contradicción con la documentación de Stripe sobre cuentas `recipient`: bloqueante, «escrito»** | Chile no está excluido |
| Persona natural o empresa | Lo decide el «Business Type» de Stripe: **escrito** | Individuos y *sole traders* aceptados (sin verificación de empresa) |
| Clasificación «tutor de idiomas» | La AUP (1-oct-2026) **restringe** generadores de contenido IA y de chatbots (requieren revisión). Hay que describir el producto **tal como es: por reglas, sin IA generativa**. «Escrito» | Los tutores IA no se mencionan; prohíbe *voice impersonation* y *deepfakes*. «Escrito» |
| Países de venta | MoR global; impuestos según su registro; inscrito en la nómina de IVA digital del SII | MoR; Chile 19 % B2C; inscrito en el SII |
| Tarifa | **Starter 5 % + 50¢** (+1,5 % con tarjetas no estadounidenses); disputa US$15 | 5 % + 50¢ (incluye contracargos); contracargo de hasta 20 USD/EUR/GBP según los términos |
| *Payouts* | Manuales, cuenta local en **CLP**, mínimo ≈ US$40, costos de Stripe, retención de 7 días | Mensuales, mínimo US$100, SWIFT US$15, conversión hasta 1,5 %; CLP no listado |
| Impuestos indirectos | Los cobra el MoR (lista de jurisdicciones no publicada): **escrito** | Los cobra Paddle |
| Documentos comerciales | Hay que **facturar a Polar** cada *payout* (y emitir el DTE chileno: contador) | Paddle emite una *Reverse Invoice* (y el DTE chileno: contador) |
| Contrato MoR | Términos de Polar: lectura legal pendiente | Términos de Paddle (ley inglesa): lectura legal pendiente |
| Suscripciones | Sí | Sí |
| Reembolsos | Totales o parciales; el impuesto se devuelve y las comisiones no; **el reembolso no revoca la suscripción** (hay que revocarla aparte) | Discrecional en 14 días según los términos |
| Contracargos | US$15; quién contesta: **escrito** | Incluidos; quién contesta: **escrito** |
| Webhooks y verificación | **Standard Webhooks**: coincide con `app/billing/entitlements.py::verify_standard_webhook` | `Paddle-Signature` (`ts:raw_body`, HMAC-SHA256, tolerancia 5 s): **hace falta un verificador propio** |
| *Sandbox* | Sí (`sandbox-api.polar.sh`, tarjeta 4242); KYC: escrito | Sí, sin verificación; simulador de webhooks |

## Decisión sugerida (no tomada)

1. **Primero Polar**, por los *payouts* en CLP y porque su webhook ya está implementado. **Condición:** la respuesta escrita resuelve la contradicción de Stripe y la clasificación en la AUP.
2. **Si Polar no confirma:** Paddle (individuo aceptado; *payout* en USD por SWIFT; hay que escribir su verificador de webhooks).
3. **Venta directa (Flow o Mercado Pago):** solo **después** del inicio de actividades (Ley 21.713, desde el 2-ene-2026), y con boleta e IVA a cargo del vendedor.

## Lo que el propietario debe hacer (y Claude no hará)

- Crear la cuenta del procesador, aceptar sus términos y pasar el KYC.
- Enviar las preguntas «escrito» (`research/2026-11-03-sii-official-verification.md` §11).
- Autorizar el *sandbox* y entregar, por un canal seguro, la clave de webhook **de sandbox** (nunca en el chat ni en el repositorio).
