# Polar.sh vs Paddle: elegibilidad y operación para LinguaChat (vendedor chileno)

> **Fase 3 (2026-11-03): verificado contra fuentes oficiales** en `docs/business/research/2026-11-03-sii-official-verification.md`. Correcciones principales:
> - **Inicio de actividades:** desde el 2-ene-2026 (Ley 21.713), Flow, Mercado Pago y otros medios de pago constituidos en Chile **deben exigir el inicio de actividades** antes de contratar. La venta directa no puede abrirse antes.
> - **Polar:** la comisión es **5 % + 50¢** en el plan Starter (4 % + 40¢ es «Early Member»). Sigue sin resolverse la contradicción con Stripe sobre cuentas `recipient`.
> - **Patente municipal:** el tope es **8.000 UTM**. Revisar la Ley 21.850 (DO 17-10-2026).
> - **Factura de exportación (DTE 110):** requiere petición o el F2117 en el portal gratuito.
> - **Exportación:** se puede autocalificar si el servicio figura en el listado de Aduanas. DUS vía SICEX es optativo.
> - **Comisiones del MoR:** considerar el art. 12 E N°7 (exención si hay impuesto adicional).
> - **F29:** el día 20 aplica solo a facturadores electrónicos que declaran en línea.
> - **Contabilidad en USD:** pedirla **en el inicio de actividades**.
> - **Descripción del producto:** tutor **por reglas, sin IA generativa** (la AUP de Polar restringe el contenido IA y los chatbots).

Fecha de investigación: 2026-11-02. Solo lectura, fuentes oficiales (polar.sh/docs, polar.sh/legal, docs.stripe.com, paddle.com/help, paddle.com/legal, developer.paddle.com).
Etiquetas: **[SEC]** = fuente secundaria; **NO VERIFICADO** = no confirmado en doc oficial.
No repite pricing general (memo previo): Polar Starter 5%+$0.50 (+1.5% tarjetas no-US); Paddle 5%+$0.50, <$10 precio a medida, mínimo payout $100, checkout CLP desde 2026-03.

---

## 1. Tabla comparativa

| Tema | Polar.sh | Paddle |
|---|---|---|
| **1a. Persona natural vs empresa** | Persona natural OK si Stripe Connect Express soporta `individual` en el país. Verificado vía endpoint oficial de Stripe (plataforma US → cuenta CL): `entity_type_structures` incluye `individual`, `company` (sole_proprietorship, private_corporation, etc.) y `non_profit`. → Persona natural chilena **sí** puede. SpA futura también (`company/private_corporation`). https://polar.sh/docs/merchant-of-record/supported-countries · https://docs.stripe.com/connect/required-verification-information | Acepta "individuals or sole traders" explícitamente (verificación de identidad: "you personally"); paso de verificación de empresa "not required for individuals or sole traders". Chile no está en lista de países no soportados. https://www.paddle.com/help/start/account-verification/what-is-identity-verification · https://www.paddle.com/help/start/account-verification/what-is-business-verification · https://www.paddle.com/help/start/account-verification/which-countries-are-supported-by-paddle |
| **1b. País titular + cuenta bancaria** | Chile en lista de payouts (Stripe Connect Express). Persona: país de residencia; empresa: país de residencia tributaria. **Cuenta bancaria debe estar en el mismo país y en moneda local** (Chile → cuenta chilena en **CLP**). Wise/Payoneer/Revolut normalmente rechazados. Persona natural puede usar cuenta personal; empresa necesita cuenta empresa. https://polar.sh/docs/features/finance/accounts · https://polar.sh/docs/features/finance/payouts | Banco no necesita ser local-moneda: wire (ACH/SEPA/SWIFT), Payoneer o servicios online con BIC/SWIFT+IBAN. CLP **no** listado como moneda de payout → cuenta chilena en USD vía SWIFT (o Payoneer). https://www.paddle.com/help/manage/get-paid/when-and-how-do-i-get-paid · https://www.paddle.com/help/manage/get-paid/is-there-a-fee-taken-for-payouts |
| **1c. KYC / documentos** | Antes del 1er payout: (1) descripción del negocio, (2) KYC del owner con **pasaporte, cédula o licencia + selfie vía Stripe Identity**, (3) onboarding Stripe Express (identidad, datos negocio si aplica, banco). Stripe (CL/individual/recipient/transfers) lista como requisito actualmente debido solo ToS + `external_account`; demás campos (RUT, DOB, dirección) NO VERIFICADO vía endpoint. Términos: Polar puede pedir accionistas/UBO vía KYC/KYB (cl. 9.1) y formularios **W-8/W-9** (cl. 4.3 → persona chilena: W-8BEN; SpA: W-8BEN-E, inferido). https://polar.sh/docs/merchant-of-record/account-reviews · https://polar.sh/legal/terms | 3 fases: dominio → negocio → identidad. Empresa: docs de registro gubernamental (PDF o link registro público sin login) + desglose de dueños ≥25%. **No aceptan** cuentas de servicios básicos, docs contables ni tax IDs (EIN) como prueba. Identidad vía **Sumsub**: ID oficial + prueba de domicilio, a veces video liveness; solo si se requiere más info. Tiempos: negocio 2-4 días hábiles, identidad 1-3 (manual). https://www.paddle.com/help/start/account-verification/what-is-business-verification · https://www.paddle.com/help/start/account-verification/what-is-identity-verification |
| **1d. Stripe Connect Express en Chile ("recipient")** | Endpoint oficial Stripe (plataforma US, cuenta CL): `tos_types: ["recipient"]` únicamente, `capabilities: ["transfers"]` únicamente, dashboards `express`/`none`. Acuerdo recipient = Stripe sin relación directa con el receptor; **no puede procesar pagos ni pedir `card_payments`**; solo recibe transferencias (+24 h extra de disponibilidad); soporte solo vía plataforma (Polar). Encaja con MoR: todas las ventas las cobra Polar (US). **Contradicción**: doc genérica de Stripe dice que cross-border self-serve a cuentas recipient no aplica fuera US/UK/EEA/CA/CH ("use Global Payouts"); pero el selector oficial y Polar listan Chile → Polar parece tener arreglo propio. NO VERIFICADO cómo. https://docs.stripe.com/connect/service-agreement-types · https://docs.stripe.com/connect/cross-border-payouts · https://stripe.com/connect-account/legal/recipient | No aplica (Paddle paga directo por wire/Payoneer). |
| **2a. AUP: educación / SaaS** | Permitido: "Software & SaaS", "Premium content & access" (cursos, contenido por suscripción). Prohibido: **servicios humanos** como oferta principal, test prep que revende preguntas reales de exámenes. Restringido (revisión extra): **herramientas de generación de contenido IA (texto, imagen, video, voz)**, **chatbot/audio generators** (restricciones a voice cloning, NSFW, IP), herramientas de examen/CV. Política vigente desde 2026-10-01; Polar puede rechazar a discreción. https://polar.sh/docs/merchant-of-record/acceptable-use | Prohibido: servicios humanos no ligados a software (coaching, consultoría puros); certificación/test prep (essay mills, cursos sin derechos de reventa); generación de contenido con deepfakes, **voice impersonation**, likeness sin consentimiento, categorización automatizada de personas; caras humanas = restringido. SaaS educativo con IA no prohibido per se; Paddle "reserves the right to exercise judgment". [SEC/partner] productos de IA generativa deben prohibir outputs dañinos en sus términos. https://www.paddle.com/help/start/account-verification/what-am-i-not-allowed-to-sell-on-paddle · https://developer.paddle.com/partners/embed-billing/seller-go-live/minimum-seller-terms |
| **2b. Tutor IA** | Probable categoría "restricted" (chatbot/AI text/voice) → revisión más estricta, posible pedir salvaguardas. Tutoría humana en vivo como oferta principal → prohibida. NO VERIFICADO clasificación exacta de "AI tutor" de idiomas. | Sin categoría explícita. Riesgo si usa TTS clonando voces reales o avatares humanos (restricted). Coaching humano como oferta principal → prohibido. |
| **2c. Requisitos web antes de aprobar** | Productos+benefits configurados, integración (checkout links, API keys, webhooks), **sitio live apuntando a la integración**, redes sociales (confidencial), posible demo (código 100% descuento o video del flujo pagado). No exige explícitamente ToS/privacidad/reembolso (NO VERIFICADO; tenerlos igual). Review inicial hasta **14 días**. https://polar.sh/docs/merchant-of-record/account-reviews | **Domain review** obligatorio para checkout live: descripción producto, **precios/pricing page** (screenshot si no está live), features, **Términos, Política de Reembolso y Privacidad** accesibles desde navegación, nombre de empresa (o **nombre legal** del sole proprietor) en Términos, HTTPS. Cada subdominio con checkout se aprueba aparte. Mayoría auto-aprobada; manual 5-7 días hábiles. https://www.paddle.com/help/start/account-verification/what-is-domain-verification |
| **3a. Impuestos MoR** | Polar asume sales tax vía Stripe Tax: ejemplos EU VAT (OSS EU372061545), GST Canadá, US Sales Tax; "registered in jurisdictions around the world" sin lista. **Chile IVA y Japón JCT: NO VERIFICADO** (no hay lista pública). Vendedor responsable de su impuesto a la renta. https://polar.sh/docs/merchant-of-record/introduction · https://polar.sh/legal/terms (cl. 4) | Lista oficial (act. 2025-08-01): **Chile 19% VAT, solo B2C**; **Japón 10% consumo, B2B y B2C**; UE OSS B2C por estado; EE.UU. lista de estados; UK 20%. >100 jurisdicciones. https://www.paddle.com/help/sell/tax/which-countries-does-paddle-charge-sales-tax-or-vat-for |
| **3b. Docs al comprador** | Recibos de pago + facturas descargables/editables (nombre empresa, VAT, dirección) en Customer Portal; API "Generate/Get Order Invoice". https://polar.sh/docs/features/customer-portal/introduction | Factura PDF (Paddle como revendedor), notas de crédito PDF automáticas en reembolsos, facturas revisables. https://developer.paddle.com/build/transactions/create-transaction-adjustments |
| **3c. Docs al vendedor (contabilidad CL)** | **"Reverse invoice" por payout** (Finance → Payouts → Download invoice): ventas hechas por Polar en tu nombre menos fees; editable nombre/dirección/ID tributario/numeración (POLAR-0001) antes de generar; inmutable después. Términos: reporta y paga en **USD** (cl. 7.1); dashboard con reportes. https://polar.sh/docs/features/finance/payouts | **Self-billed invoicing** de Supplier Fees (cl. 7.3 términos); factura enviada por email en cada payout; reportes Transactions, Adjustments, **Payout reconciliation**. Venta a Paddle = B2B cross-border con reverse charge en UK. https://www.paddle.com/legal/terms · https://developer.paddle.com/build/reports/payout-reconciliation · https://www.paddle.com/help/manage/get-paid/should-i-charge-paddle-vattax-for-payouts |
| **4a. Trials** | Sí, por producto/checkout link/sesión API; recolecta tarjeta; recordatorio email 3 días antes; "Prevent trial abuse" (email normalizado + fingerprint tarjeta). https://polar.sh/docs/features/subscriptions/trials | Sí, free o paid trial en price; extender/activar. Trial sin método de pago: NO VERIFICADO. https://developer.paddle.com/build/trials/create-trial |
| **4b. Proration / upgrade-downgrade** | `invoice`, `prorate`, `next_period`, `reset` (preview, plan pago); default por org o por llamada; si pago inmediato falla, no cambia. https://polar.sh/docs/features/subscriptions/proration | `prorated_immediately`, `prorated_next_billing_period`, `full_immediately`, `full_next_billing_period`. No se pueden cambiar items con scheduled change pendiente. https://developer.paddle.com/concepts/subscriptions/proration |
| **4c. Cancelación / portal** | Customer Portal: cancelar, actualizar tarjeta, facturas/recibos; cambio de plan/pausa opcional (toggle). Link pre-autenticado vía customer session. https://polar.sh/docs/features/customer-portal/introduction | Portal hosteado: pagos, facturas, actualizar tarjeta, cancelar (obligatorio por compliance); links autenticados vía API. Cambio de plan desde portal: NO VERIFICADO. https://developer.paddle.com/concepts/sell/customer-portal |
| **4d. Dunning** | `past_due` + reintentos día 2, 7, 14, 21; luego revoke. Grace period configurable (0/2/7/14/21 días). https://polar.sh/docs/features/subscriptions/failed-payments | Sin Retain: hasta 7 reintentos en 30 días y luego cancela. Con Retain: Tactical Retries, pausar o cancelar. https://developer.paddle.com/build/retain/configure-payment-recovery-dunning |
| **4e. Reembolsos** | Vendedor: total o parcial desde dashboard/API; impuestos se devuelven proporcional; **fees no se devuelven**; reembolso **no** corta acceso de suscripción (hay que cancelar). Polar puede reembolsar a discreción hasta **60 días**. Vendedor no puede reembolsar fuera de Polar (cl. 10.1). https://polar.sh/docs/features/refunds | Vía "adjustments" (total/parcial). Live: `pending_approval`; auto-aprobado si cuenta verificada, ≤ USD 400, < balance, no transferencia bancaria. Paddle puede reembolsar a discreción en 14 días (cl. 10.2). https://developer.paddle.com/build/transactions/create-transaction-adjustments |
| **4f. Chargebacks** | Fee **$15** por disputa, gane o pierda. Meta interna 0.4%; >0.7% excesivo; ventana 120 días. Polar auto-reembolsa ante alertas tempranas. Quién disputa: NO VERIFICADO. https://polar.sh/docs/merchant-of-record/fees · https://polar.sh/docs/merchant-of-record/account-reviews | Fee **hasta USD/EUR/GBP 20** por chargeback o pre-chargeback alert (cl. 10.4). **Paddle contesta los chargebacks**. https://www.paddle.com/legal/terms · https://developer.paddle.com/build/transactions/create-transaction-adjustments |
| **4g. Webhooks entitlement** | `subscription.created/active/updated/canceled/uncanceled/revoked/past_due/paused/resumed/cycled`, `order.paid/refunded`, `refund.*`, `benefit_grant.*`, **`customer.state_changed`**. `canceled` ≠ fin de acceso (cancel_at_period_end); `revoked` = fin. Firma **Standard Webhooks** (`webhook-id/timestamp/signature`) para secretos desde 2026-09-08; Python `validate_event` (`polar.v2026_10.webhooks`). Timeout 10 s (responder <2 s); 10 reintentos; endpoint deshabilitado tras 10 fallos. https://polar.sh/docs/integrate/webhooks/events · https://polar.sh/docs/integrate/webhooks/delivery | Recomendado: `subscription.created` + `subscription.updated` (cubre renovación, cambio plan, estado); opcional `transaction.completed`. Firma `Paddle-Signature: ts=…;h1=HMAC-SHA256`; SDK tolera 5 s. At-least-once, posible desorden (dedupe `event_id`, comparar `occurred_at`). Reintentos: NO VERIFICADO. https://developer.paddle.com/build/subscriptions/provision-access-webhooks · https://developer.paddle.com/webhooks/about/signature-verification |
| **4h. Entitlement sin BD** | **Customer State por External ID** (`polar.customers.get_state_external(user_id)`): suscripciones activas + benefits + meters en 1 llamada. Usable server-side sin BD propia (doc no dice explícitamente "sin BD"). https://polar.sh/docs/integrate/customer-state | Recomienda "lean cache" en BD (customer_id, subscription_id, status…). Sin BD: posible vía API list customers/subscriptions + `custom_data` (NO VERIFICADO filtro por email/custom_data). Menos directo. https://developer.paddle.com/build/subscriptions/provision-access-webhooks |
| **5a. Moneda / frecuencia** | Balance en USD; payout a cuenta chilena en **CLP** (Stripe exige moneda local). Retiro **manual, a demanda** (sin calendario); Polar puede forzar payout si hay meses sin retirar. Delay settlement **7 días** (orgs creadas ≥2026-05-12). Llegada 4-7 días hábiles. https://polar.sh/docs/features/finance/payouts | **Mensual**: se crea el día 1, se envía antes del 15; no retiro a demanda. USD/EUR/GBP balance; CLP no listado. https://www.paddle.com/help/manage/get-paid/when-and-how-do-i-get-paid |
| **5b. Mínimos / fees / FX** | Mínimo equiv. **USD 40 para CLP**. Stripe: $2/mes con payout activo + 0.25% + $0.25 por payout + FX/cross-border **hasta 1%** fuera UE. Sin markup Polar. https://polar.sh/docs/features/finance/payouts · https://polar.sh/docs/merchant-of-record/fees | Mínimo $100 (ajustable). SWIFT **$15** si moneda ≠ país del banco (Chile en USD → SWIFT); conversión hasta **1.5%** si moneda payout ≠ balance; Payoneer cobra lo suyo; banco intermediario/receptor cobra aparte. https://www.paddle.com/help/manage/get-paid/is-there-a-fee-taken-for-payouts |
| **5c. Statements** | Reverse invoice por payout (ver 3c). | Invoice por email + payout reconciliation report (ver 3c). |
| **6a. Checkout front** | Checkout Links (URL persistente), Checkout Session API, **Embedded Checkout** en sitio. Multi-moneda (CLP soportado; pasar `customer_ip_address` en sesiones server-side). https://polar.sh/docs/features/checkout/embed · https://polar.sh/docs/features/products | Paddle.js **overlay** o **inline**; dominio aprobado para live. https://developer.paddle.com/build/checkout/build-overlay-checkout |
| **6b. SDK Python** | `polar-sdk` (Python ≥3.11), sync/async, `environment="sandbox"`; versión API pinneada por import (`polar.v2026_10`). https://polar.sh/docs/integrate/sdk/python | `paddle-python-sdk` (`paddle_billing`), `Environment.SANDBOX`, verificador de firmas incluido. https://developer.paddle.com/sdks/libraries/python |
| **6c. Sandbox sin cuenta aprobada** | **Sí**: sandbox.polar.sh, cuenta/org separada, API `sandbox-api.polar.sh`, tarjeta 4242; doc no menciona KYC (NO VERIFICADO explícito, pero no se requiere payout). Emails solo a miembros de la org. No usar tarjetas reales en live para test. https://polar.sh/docs/integrate/sandbox | **Sí, explícito**: "You don't need to verify a sandbox account"; sin domain approval; reembolsos auto-aprobados cada 10 min; **webhook simulator**. https://developer.paddle.com/build/go-live-checklist |
| **7a. Holds / reservas** | Puede establecer reserva, demorar o suspender pagos, exigir prefunding; demoras hasta **120 días** para suspendidos/alto riesgo (cl. 7.2). Payouts "Held for review" en revisiones. Escalamiento chargebacks: reembolsos → hold hasta cerrar 120 días → pausa pagos → bloqueo. Soporte: responder tickets en **48 h** o reembolsos/offboarding. https://polar.sh/legal/terms · https://polar.sh/docs/merchant-of-record/account-reviews | Sin % de rolling reserve en términos; retiene fees "as it reasonably determines necessary" al suspender/terminar (cl. 17.2); set-off sin aviso; puede exigir top-up (cl. 8.3). Dormancy fee posible (cl. 15). https://www.paddle.com/legal/terms |
| **7b. Terminación** | 30 días aviso cualquiera; inmediata por fraude/chargebacks excesivos (cl. 17.3); fondos retenidos hasta lo último de: 9 meses post-terminación, resolución chargebacks, fin de suscripción más larga (cl. 18.4). Inactividad 6 meses → desactivación. Ley **Delaware**, arbitraje JAMS (opt-out 30 días). Violación AUP: 48 h para responder; suscripciones canceladas y reembolsadas. | 30 días aviso; 14 días para remediar; inmediata por fraude/chargebacks/petición del procesador (cl. 16). Retención hasta lo último de 6 meses o fin de última suscripción (cl. 17.4). Ley **inglesa**, tribunales ingleses. |

---

## 2. Recomendación para investigar primero

**Investigar/construir primero con Polar; mantener Paddle como plan B (sandbox paralelo, costo cero).**

Razones:
1. **Elegibilidad chilena confirmada en fuente oficial de Stripe**: CL + `individual` + Express + recipient + transfers. Persona natural puede empezar sin SpA.
2. **Entitlement sin BD**: Customer State por External ID calza con arquitectura FastAPI-on-Vercel stateless; Paddle recomienda guardar estado en BD.
3. **Sandbox inmediato** en ambos; Polar además da `polar-sdk` Python con `validate_event` (Standard Webhooks).
4. **Payout más flexible para volumen bajo**: retiro a demanda, mínimo ~USD 40 en CLP, directo a cuenta CLP (sin SWIFT $15 ni cuenta USD). Paddle: mensual, $100 mín., SWIFT a Chile.
5. **Ticket bajo**: Paddle exige pricing a medida <$10 (memo previo); Polar no.
6. **Reverse invoice por payout** útil para respaldo contable en Chile.

Riesgos de Polar a validar antes de comprometerse:
- **AUP**: tutor IA puede caer en "restricted" (chatbot / AI text-voice). Escribir a soporte describiendo el producto antes de construir mucho.
- **Chile IVA y Japón JCT**: no hay lista pública; Paddle sí lista Chile 19% B2C. Clientes chilenos son mercado prioritario → pedir confirmación escrita a Polar.
- Contradicción doc Stripe cross-border vs. lista Polar (ver 1d): confirmar con Polar que onboarding CL funciona hoy.
- Delay 7 días + review inicial ≤14 días + FX ≤1% CLP.

Cuándo preferir Paddle: si Polar rechaza el caso IA, si Polar no confirma IVA Chile, o si se quiere que el MoR pelee chargebacks (Paddle contesta; Polar no documentado).

---

## 3. Qué necesita el propietario para abrir cuenta

**Común**
- [ ] Email de negocio y dominio propio con HTTPS (Vercel OK).
- [ ] Sitio live: descripción del producto, features, **página de precios**.
- [ ] **Términos y Condiciones** con nombre legal (persona natural) o razón social (SpA); **Política de Reembolso**; **Política de Privacidad**; todo enlazado en navegación.
- [ ] Términos de uso con cláusulas para salida IA (prohibir contenido dañino); no clonar voces reales ni usar caras humanas sin consentimiento.
- [ ] Producto entregado por software (no clases humanas como oferta principal).
- [ ] Cuenta demo o código 100% descuento / video del flujo pagado.
- [ ] Redes sociales del proyecto (Polar las pide).
- [ ] Capacidad de responder soporte en <48 h.

**Polar (persona natural chilena)**
- [ ] Cédula de identidad o pasaporte vigente + selfie (Stripe Identity).
- [ ] Datos personales para Stripe Express (nombre, fecha nacimiento, dirección, RUT probable — NO VERIFICADO campos exactos).
- [ ] **Cuenta bancaria chilena en CLP** a nombre del titular (cuenta corriente/vista; persona → personal OK).
- [ ] Formulario fiscal US (W-8BEN persona; W-8BEN-E si SpA) — inferido de cl. 4.3.
- [ ] Productos + benefits + checkout + webhooks configurados en live antes de pedir review.
- **Si SpA**: escritura/registro, RUT empresa, cuenta bancaria empresa en CLP, datos de dueños/representante.

**Paddle**
- [ ] Cuenta sandbox (sandbox-vendors.paddle.com/signup) para construir.
- [ ] Domain review aprobado por cada dominio/subdominio con checkout.
- [ ] Identidad vía Sumsub: documento oficial soportado + prueba de domicilio (no cuenta de servicios básicos para negocio; para identidad doc de domicilio aceptado NO VERIFICADO) + posible video liveness.
- [ ] **Si SpA**: documentos de registro (PDF o link registro público sin login), desglose de dueños ≥25%.
- [ ] Método de payout: cuenta bancaria en Chile que reciba **USD por SWIFT** (con SWIFT/BIC) o Payoneer.
- [ ] Precio ≥ USD 10 o negociar pricing a medida.

---

## 4. No verificado

- Polar: si recauda/remite **IVA Chile** (servicios digitales) y **JCT Japón**; lista de jurisdicciones registradas.
- Polar: quién contesta disputas (doc solo indica fee $15).
- Polar: clasificación exacta de "tutor IA de idiomas" bajo AUP (allowed vs restricted).
- Polar: requisitos legales del sitio (ToS/privacidad/reembolso) — no listados explícitamente.
- Polar: sandbox sin KYC — implícito, no dicho explícitamente.
- Polar: cómo se compatibiliza "paga en USD" (cl. 7.1) con exigencia Stripe de CLP local; tasa FX real aplicada.
- Stripe: campos KYC completos para CL individual recipient (endpoint solo devolvió ToS + cuenta bancaria como requisito); umbrales que gatillan más KYC.
- Stripe: base contractual del payout cross-border a CL (doc pública dice recipient → Global Payouts; selector oficial y Polar dicen Chile OK).
- Paddle: moneda de payout para Chile (CLP no listado; USD vía SWIFT asumido); política de reintentos de webhooks; trial sin método de pago; cambio de plan desde portal.
- Paddle: listar clientes/suscripciones por email o `custom_data` para operar sin BD.
- Paddle: aceptación práctica de persona natural chilena sin inicio de actividades / tipo de documento de domicilio aceptado por Sumsub en Chile.
- Ambos: tratamiento tributario chileno de payouts (renta, boleta de honorarios/exportación de servicios, IVA exportación) — requiere contador chileno, fuera de alcance.

**[SEC]** usados solo como contexto (no en tabla): resultados de búsqueda sobre Ruul blog (servicios coaching en Paddle) y PayPro Global (JCT), no utilizados para conclusiones.
