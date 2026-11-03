# Verificación contra fuentes oficiales: SII, Aduanas, Polar y Paddle

> **Fecha:** 2026-11-03 (fase 3). Investigación web de solo lectura. **No es asesoría tributaria ni legal.** No se contactó a nadie, no se crearon cuentas, no se aceptaron condiciones.
> **Revisa:** `chile-tax-and-commercial-compliance.md`, `research/2026-11-02-chile-sii-briefing.md`, `research/2026-11-02-polar-paddle-eligibility.md`, `accountant-handoff.md`.
> **Estados:**
> - **CONFIRMADO:** lo respalda una fuente oficial leída hoy.
> - **CORREGIDO:** nuestro documento decía otra cosa o le faltaba un matiz relevante.
> - **PENDIENTE:** no hay fuente oficial suficiente, o depende de una interpretación.
>
> **Cómo se consultó cada fuente:**
> - **[F]** página leída;
> - **[PDF]** PDF descargado y leído;
> - **[B]** solo se vio el resultado del buscador.
>
> El texto legal vigente (DL 825, Código Tributario, DL 3.063) se leyó con la API JSON de LeyChile (BCN).

## 1. Inicio de actividades

| Afirmación | Estado | Fuente | Nota |
|---|---|---|---|
| Hay que declarar el inicio dentro de los 2 meses siguientes al comienzo (CT art. 68) | **CONFIRMADO** | Res. Ex. SII N° 79/2025, https://www.sii.cl/normativa_legislacion/resoluciones/2025/reso79.pdf [PDF]. ChileAtiende, ficha 3025, https://www.chileatiende.gob.cl/fichas/3025-inicio-de-actividades-persona-natural [F] | Trámite en línea con Clave Tributaria o ClaveÚnica |
| El plazo no autoriza a operar sin cumplir obligaciones | **CONFIRMADO, con novedad** | Res. 79/2025 [PDF]. Noticia SII del 29-09-2025, https://www.sii.cl/noticias/2025/290925noti03pcr.htm [F] | **Ley 21.713:** desde el **2-ene-2026**, los medios de pago electrónicos constituidos en Chile (p. ej. Flow, Mercado Pago) y las plataformas de intermediación **deben exigir el inicio de actividades** antes de contratar, y verifican cada semestre el cumplimiento. La venta directa no puede abrirse antes del inicio. No alcanza a Polar ni a Paddle (no constituidos en Chile) |
| Sanción por iniciar tarde | **PENDIENTE** | Solo buscador [B]: art. 97 N°1 CT | Confirmar con el contador |
| Contabilidad en USD (CT art. 18) | **CONFIRMADO, con matiz** | Código Tributario, art. 18 (BCN) [F] | Se autoriza por resolución fundada. Rige desde el primer ejercicio **si se pide en la declaración de inicio**. Se mantiene al menos 2 años. **Decidirlo antes del inicio** |

## 2. Persona natural o SpA

| Afirmación | Estado | Fuente | Nota |
|---|---|---|---|
| La SpA se constituye en «Tu Empresa en un Día» sin costo (solo FEA o notario) | **CONFIRMADO** | https://www.chileatiende.gob.cl/fichas/21409-tu-empresa-en-un-dia [F] | Requiere ClaveÚnica |
| Responsabilidad: ilimitada en la persona natural, limitada en la SpA | **PENDIENTE** | No se leyó la ley | Doctrina estándar, no verificada hoy |
| Las suscripciones son renta de 1.ª categoría (art. 20), no honorarios (art. 42 N°2) | **CONFIRMADO en la norma; interpretación en el caso** | Res. 79/2025 [PDF] | Pedir confirmación escrita al contador |
| Pro Pyme 14 D N°3: impuesto de 12,5 % en 2025–2027 | **CONFIRMADO** (buscador) | Circular SII 53/2025 [B] | Condicionado a la cotización de la Ley 21.735 |
| DJ 1948 para 14 A y 14 D N°3 | **CONFIRMADO** | https://www.sii.cl/preguntas_frecuentes/ddjj/001_135_8928.htm [F] | La DJ 1947 (14 D N°8) queda PENDIENTE |

## 3. Códigos de actividad (catálogo del SII)

Fuente: https://www.sii.cl/ayudas/ayudas_por_servicios/1956-codigos-1959.html [F]. **CONFIRMADO.**

| Código | Glosa SII | Afecto a IVA | Comentario |
|---|---|---|---|
| **582000** | Edición de programas informáticos | Sí (1.ª) | Candidato principal |
| **631200** | Portales web | Sí (1.ª) | Candidato |
| 631100 | Procesamiento de datos, hospedaje y actividades conexas | Sí | Alternativa |
| 620900 | Otras actividades de TI y servicios informáticos | Sí | Alternativa |
| 639900 | Otras actividades de servicios de información n.c.p. | Sí | Nuevo en nuestra lista |
| 854909 | Otros tipos de enseñanza n.c.p. | No | Solo si el contador sostiene la exención del art. 13 N°4 |
| 854902 | Servicios personales de educación | No (2.ª) | No calza |

La marca «afecto» del catálogo no decide la tributación real (interpretación).

## 4. IVA sobre servicios

| Afirmación | Estado | Fuente | Nota |
|---|---|---|---|
| Desde el 1-ene-2023 (Ley 21.420) están gravados los servicios en general | **CONFIRMADO** | DL 825, art. 2 N°2 (BCN) [F] | |
| Gravado el servicio prestado en Chile aunque el beneficiario no tenga domicilio | **CONFIRMADO** | Circular 50/2022, https://www.sii.cl/normativa_legislacion/circulares/2022/circu50.pdf [PDF] | Salvo calificación de exportación. **Matiz nuevo:** art. 12 E N°7, exentos los servicios afectos al impuesto adicional (art. 59 LIR). Relevante para las comisiones del MoR |
| Los no domiciliados tributan en el régimen simplificado (arts. 35 A y ss.) | **CONFIRMADO** | https://www.sii.cl/vat/faq1_esp.html [F] | Un prestador chileno tributa en el régimen general |
| Paddle y Polar inscritos en la nómina de IVA digital | **CONFIRMADO** | https://www.sii.cl/vat/dwn_esp.html [F] | PADDLE.COM MARKET LTD, POLAR LIMITED, POLAR SOFTWARE INC. **PENDIENTE:** qué entidad de Polar contrata |
| Exención educacional (art. 13 N°4) limitada a la «actividad docente» | **CONFIRMADO** (texto) | DL 825, art. 13 N°4 (BCN) [F] | Aplicarla a una app sigue **PENDIENTE**. El Oficio 2034/2022 (extracto secundario) apunta a «gravado» |

## 5. Exportación de servicios (art. 12 E N°16)

| Afirmación | Estado | Fuente | Nota |
|---|---|---|---|
| Exención solo si **Aduanas califica** el servicio como exportación | **CONFIRMADO** | DL 825, art. 12 E N°16 (BCN) [F] | |
| Requisitos: beneficiario sin domicilio, uso **exclusivo** en el extranjero, prestador domiciliado en Chile | **CONFIRMADO** | Aduanas, https://www.aduana.cl/calificacion-de-servicios-como-exportacion/aduana/2018-12-16/222609.html [F]. Compendio Cap. IV, Apéndice III (Res. 1931/2024) [F] | |
| Un servicio que ya figura en el listado puede **autocalificarse** | **CORREGIDO** (el briefing no lo decía) | Apéndice III, num. 2.1 [F] | |
| Hasta US$2.000 se usa DUSSI. Opcional: DUS de **cualquier monto vía SICEX** para servicios sin soporte material | **CONFIRMADO, con matiz** | Apéndice III, num. 9–10 [F] | |
| Sobre US$2.000 hace falta agente de aduanas | **PENDIENTE** | No aparece en el Apéndice III | Confirmar con Aduanas |
| Respaldo durante 5 años y registro por operación | **CONFIRMADO** | Apéndice III, num. 11 [F] | |
| ¿Un código del listado sirve para SaaS o educación online? | **PARCIAL** | https://www.aduana.cl/clasificacion-de-servicios-de-exportacion/aduana/2016-08-10/104402.html [F] | Existen «Servicios de Enseñanza» (p. ej. 00550022, seminarios online a residentes en el extranjero) e «Informática». **No se vio** una suscripción B2C de software |
| Factura de exportación electrónica (DTE 110) | **CORREGIDO** | https://www.sii.cl/preguntas_frecuentes/factura_electronica/001_003_6920.htm [F] | En el portal gratuito requiere una petición administrativa o el F2117, y autorización |

## 6. Venta directa, a intermediario y vía MoR

| Caso | Confirmado oficialmente | Práctica o interpretación | Desconocido |
|---|---|---|---|
| Venta directa a un consumidor chileno | IVA 19 %, boleta electrónica. El voucher de pago con tarjeta vale como boleta (SII) [F] | Giro 582000 o 631200 | Si el voucher de Flow o Mercado Pago basta en una venta web |
| Venta directa a un extranjero | Gravada salvo calificación (Circ. 50). Exportación = calificación + DUS/DUSSI | Costosa para tickets pequeños | Si existe un DUS consolidado |
| Vía MoR | El MoR cobra el IVA chileno B2C (Paddle lista «Chile 19 % VAT, B2C») [F] | Hacia el MoR: factura 110 (si hay calificación) o factura afecta | **Pendiente todo lo documental:** uso «exclusivo en el extranjero» si el MoR también vende en Chile; base bruta o *payout* neto |
| Documento del MoR | Polar: hay que facturarle cada *payout* [F]. Paddle emite una *Reverse Invoice* y no se le factura [F] | No reemplazan el DTE chileno | Confirmación del contador |
| Comisiones del MoR | Factura de compra (art. 11 e) o exención si hay impuesto adicional (art. 12 E N°7) [PDF] | Retención del 35 % (arts. 59 y 74 LIR) | Cuál aplica; convenios con EE. UU. y el Reino Unido |

## 7. Obligaciones periódicas

| Afirmación | Estado | Fuente | Nota |
|---|---|---|---|
| Boleta electrónica obligatoria desde 2021 | **CONFIRMADO** | https://www.sii.cl/destacados/boletas_electronicas/index.html [F] | La Res. 53/2022 eliminó el resumen diario [B] |
| F29: día 12, o día 20 si se declara por internet | **CORREGIDO (precisión)** | FAQ SII [B] | El día 20 es para 1.ª categoría **facturadora electrónica** que declara y paga en línea. «Sin pago», hasta el día 28 |
| F22 en abril | Sin cambio | — | No se reverificó |
| Patente municipal: 2,5 ‰ a 5 ‰ del capital propio, mínimo 1 UTM | **CORREGIDO** | DL 3.063, arts. 23 y 24 (BCN) [F] | **Tope de 8.000 UTM**, no 4.000. La BCN registra la Ley 21.850 (DO 17-10-2026): revisar qué cambió (PENDIENTE) |
| Conservar documentos 6 años | **CONFIRMADO** | https://www.sii.cl/preguntas_frecuentes/declaracion_renta/001_140_4628.htm [F] | Más tiempo para pérdidas o remanentes |
| Tipo de cambio para ingresos en USD | **PENDIENTE** | Solo indicios del buscador (dólar observado) [B] | Pregunta al contador |

## 8. Polar

| Afirmación | Estado | Fuente | Nota |
|---|---|---|---|
| Chile admitido para *payouts* (Stripe Connect Express) | **CONFIRMADO** | https://polar.sh/docs/merchant-of-record/supported-countries [F] | |
| Persona natural o empresa | **PENDIENTE** | Misma página | Polar remite al «Business Type» de Stripe |
| Contradicción con Stripe sobre cuentas `recipient` | **PENDIENTE (bloqueante)** | https://docs.stripe.com/connect/cross-border-payouts [F] | Stripe dice que no hay *payout* transfronterizo *self-serve* fuera de EE. UU., Reino Unido, EEE, Canadá y Suiza. Pedir respuesta escrita a Polar |
| Cuenta bancaria local en CLP | **CONFIRMADO** | https://polar.sh/docs/features/finance/accounts [F] | |
| *Payout* manual: mínimo ≈ US$40 en CLP, costos de Stripe, retención de 7 días | **CONFIRMADO** | https://polar.sh/docs/features/finance/payouts [F] | |
| Comisión de 4 % + 40¢ | **CORREGIDO** | https://polar.sh/docs/merchant-of-record/fees [F] | **Starter: 5 % + 50¢** (+1,5 % con tarjetas no estadounidenses). 4 % + 40¢ es el plan «Early Member». Disputa: US$15 |
| Reembolsos | **CONFIRMADO** | https://polar.sh/docs/features/refunds [F] | El impuesto se devuelve y las comisiones no. El reembolso no revoca la suscripción |
| AUP: IA y chatbots | **CONFIRMADO** | https://polar.sh/docs/merchant-of-record/acceptable-use [F] (vigente desde el 1-oct-2026) | «AI Content Generation tools» y los generadores de chatbot están **restringidos** (requieren revisión). «Tutoring» no se menciona |
| Webhooks Standard Webhooks; *sandbox* | **CONFIRMADO** | https://polar.sh/docs/integrate/webhooks/delivery [F], https://polar.sh/docs/integrate/sandbox [F] | Coincide con `verify_standard_webhook` |

## 9. Paddle

| Afirmación | Estado | Fuente | Nota |
|---|---|---|---|
| Acepta vendedores en Chile | **CONFIRMADO** (por omisión) | https://www.paddle.com/help/start/account-verification/which-countries-are-supported-by-paddle [F] | Chile no está entre los excluidos |
| Persona natural o *sole trader* | **CONFIRMADO** | https://www.paddle.com/help/start/account-verification/what-is-business-verification [F] | La verificación de empresa no se exige a individuos |
| Prohibidos y restringidos | **CONFIRMADO** | https://www.paddle.com/help/start/account-verification/what-am-i-not-allowed-to-sell-on-paddle [F] | Los tutores o chatbots IA **no** se mencionan |
| Comisión de 5 % + 50¢ (incluye contracargos) | **CONFIRMADO** | https://www.paddle.com/pricing [F] | |
| Términos: contracargo de hasta 20 USD/EUR/GBP, reembolsos, retención, ley inglesa | **CONFIRMADO** | https://www.paddle.com/legal/terms [F] | |
| *Payouts* mensuales, mínimo US$100, SWIFT US$15, conversión hasta 1,5 %; CLP no listado | **CONFIRMADO** | Ayuda de Paddle [F] | |
| Paddle emite una *Reverse Invoice* | **CONFIRMADO** | https://www.paddle.com/help/manage/get-paid/do-i-need-to-invoice-paddle-for-my-payout [F] | |
| Chile: 19 % IVA, B2C | **CONFIRMADO** | https://www.paddle.com/help/sell/tax/which-countries-does-paddle-charge-sales-tax-or-vat-for [F] | |
| *Sandbox* y firma de webhooks (`Paddle-Signature`, HMAC-SHA256, 5 s) | **CONFIRMADO** | https://developer.paddle.com/webhooks/about/signature-verification [F] | **Distinto** de Standard Webhooks: hará falta un verificador propio para Paddle |

## 10. Consistencia del producto (importante para el procesador)

Algunos documentos describen LinguaChat como tutor «asistido por IA». El producto **real** de la beta es un **tutor por reglas, sin IA generativa** (`LINGUACHAT_PROVIDER=local`).
- Para la AUP de Polar, los generadores de contenido IA y de chatbots están **restringidos**.
- Hay que describir el producto **tal como es** al solicitar la cuenta, y actualizar la descripción si algún día se activa un proveedor generativo.

## 11. Preguntas por escrito

**Al contador, al SII o a Aduanas:**
1. ¿Exención educacional (art. 13 N°4) para una app sin docentes? ¿Conviene una consulta formal?
2. ¿Qué documento se emite al MoR (110 o factura afecta) y sobre qué base? ¿Cómo se cumple el «uso exclusivo en el extranjero»?
3. ¿Hay un código del listado de Aduanas aplicable o hay que pedir calificación? ¿En qué plazo?
4. ¿Hace falta agente de aduanas vía SICEX?
5. Comisiones del MoR: ¿impuesto adicional con exención de IVA, o IVA por cambio de sujeto?
6. Tipo de cambio de los *payouts* en USD. ¿Conviene la contabilidad en USD?
7. ¿El voucher de Flow o Mercado Pago basta como boleta en una venta web?
8. ¿Qué cambió la Ley 21.850 en la patente? ¿Qué corresponde en la comuna del domicilio?
9. ¿Qué DDJJ corresponden en 14 D N°8? ¿Cómo se cumple la condición de la Ley 21.735?
10. ¿Qué sanción tiene el inicio tardío?

**A Polar:**
1. ¿El *onboarding* para Chile funciona hoy (persona natural y SpA), pese a lo que dice Stripe?
2. ¿Qué entidad contrata con el vendedor? ¿Cobra el IVA chileno?
3. ¿Cómo clasifica un tutor de idiomas por reglas según la AUP?
4. ¿Quién contesta las disputas?
5. ¿Pide KYC en el *sandbox*?
6. ¿En qué moneda paga y a qué tipo de cambio?

**A Paddle:**
1. ¿Persona natural chilena sin entidad en la práctica? ¿Qué prueba de domicilio acepta?
2. ¿Restricciones para tutores de idiomas?
3. ¿Moneda del *payout* a Chile?
4. ¿Contesta los contracargos?

## Límites

- No se leyeron el Excel del listado de Aduanas ni la Res. 2976/2016 (escaneada).
- El Oficio 2034/2022 no está disponible en sii.cl (404).
- El art. 200 del CT se verificó vía la FAQ del SII.
- Los requisitos KYC de Stripe para Chile no se reconsultaron.
