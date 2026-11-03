# Ficha para el contador — LinguaChat

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

> Documento para entregar a un contador o abogado tributario chileno. Fecha: 2026-11-02.
> **Estado:** no hay entidad ni inicio de actividades, ni cobros ni cuenta en procesadores. Queremos operar correctamente desde el primer cobro.
> Detalle de fuentes: `docs/business/research/2026-11-02-chile-sii-briefing.md`.

## 1. Qué es LinguaChat

- Aplicación web (también usable en el móvil desde el navegador) para practicar idiomas:
  - inglés para hispanohablantes (y otras siete lenguas de interfaz);
  - español para angloparlantes.
- **Contenido:**
  - lecciones cortas automatizadas;
  - repasos espaciados;
  - correcciones automáticas;
  - un chat de práctica con una tutora automatizada **basada en reglas**.
- **No hay profesores humanos, clases en vivo, certificados oficiales ni IA generativa.**
- Los usuarios son **solo adultos** durante la beta.

## 2. Dónde opera

- **Operador:** [persona natural / SpA por decidir], domicilio en [comuna], Chile.
- **Infraestructura:** proveedores en EE. UU.
  - Vercel: alojamiento web y servidor.
  - Supabase: cuentas y correos de acceso.
  - El progreso de aprendizaje se guarda en el navegador del usuario.

## 3. Qué se vendería

- **Producto:** suscripción mensual o anual a funciones adicionales («Premium»).
  - Hoy **no existe ninguna función Premium a la venta**. El primer candidato es un nivel de contenido adicional (inglés A1, ya construido pero cerrado) cuando se apruebe abrirlo.
  - Lo esencial seguirá siendo gratis.
- **Precios en evaluación:** US$39,99 al año o US$7,99 al mes. En Chile, alrededor de CLP 4.990 al mes.
- **Países iniciales:** Chile y Estados Unidos. Más adelante, quizá la UE y Japón.

## 4. Cómo funcionaría el cobro (opción preferida a confirmar)

**Opción A — *Merchant of Record* (Polar.sh, EE. UU.; alternativa Paddle, Reino Unido):**
1. El usuario paga en un *checkout* del MoR, que aparece como **vendedor** y emite el recibo o la factura al usuario.
2. El MoR cobra los impuestos del país del usuario y los entera.
   - IVA 19 % a consumidores chilenos: ambos inscritos en el registro de IVA digital del SII.
   - *Sales tax* de EE. UU.
3. El MoR descuenta su comisión (≈ 5 % + US$0,50, +1,5 % con tarjetas no estadounidenses) y acumula un saldo en USD.
4. LinguaChat retira el saldo.
   - **Polar:** a demanda, a una cuenta chilena en **CLP**. Polar entrega una *reverse invoice* por cada pago.
   - **Paddle:** mensual, en USD vía SWIFT. Paddle emite una autofactura y un reporte de conciliación.
5. Las suscripciones se renuevan solas. Cancelaciones, reembolsos y contracargos pasan por el MoR.

**Opción B — Venta directa en Chile** (Flow o Mercado Pago, en CLP): LinguaChat sería el vendedor y emitiría la boleta. Solo si hay volumen chileno que lo justifique.

## 5. Documentación que generaría el procesador

| Procesador | Para el usuario | Para LinguaChat |
|---|---|---|
| Polar | Recibo y factura del MoR | *Reverse invoice* por cada pago (ventas menos comisiones), reportes del panel |
| Paddle | Factura del MoR y notas de crédito en reembolsos | Autofactura de comisiones por cada pago y reporte de conciliación |
| Flow / Mercado Pago | Comprobante de pago (¿sirve como boleta? pregunta 19) | Liquidaciones y factura por comisión |

## 6. Preguntas que necesitamos resolver antes del primer cobro

**A. Estructura y régimen**
1. ¿Persona natural con giro de 1.ª categoría o **SpA** desde el primer día? ¿A partir de qué nivel de ingresos se justifica la SpA?
2. Confirmar que la boleta de honorarios **no** corresponde a la venta de suscripciones.
3. ¿Pro Pyme General 14 D N°3 (12,5 % + PPM 0,125 % hasta 2027) o Pro Pyme Transparente 14 D N°8? Considerar mi tramo de IGC y si reinvertiré.
4. ¿Contabilidad simplificada o completa, teniendo ingresos en USD y una posible exportación?
5. ¿Qué códigos de actividad declaro (582000, 631200, 854909)? ¿Es riesgoso declarar uno «no afecto»?

**B. IVA**

6. ¿Puede una app de idiomas **automatizada y sin docentes** acogerse a la exención del art. 13 N°4 (Circular 11/2004, Oficio 2050/2021)? ¿Conviene una consulta formal al SII?
7. En la venta directa a consumidores de EE. UU., ¿emito boleta afecta al 19 %? ¿Me conviene más derivar todo lo extranjero al MoR?
8. Con un MoR, ¿qué documento emito al MoR: factura de exportación 110 (con calificación de Aduanas) o factura afecta? ¿Sobre qué base: venta bruta o pago neto de comisiones?
9. Si Aduanas no califica el servicio, ¿pago 19 % de IVA sobre los pagos del MoR aunque el MoR ya cobró IVA o VAT al consumidor?
10. ¿Cómo cumplir el «uso exclusivo en el extranjero» si el MoR también vende a consumidores chilenos? ¿Prorrateo? ¿Dos líneas de facturación?
11. ¿El listado de Aduanas incluye algún servicio aplicable (software, e-learning, portales) o pido una calificación específica? ¿Plazos?
12. ¿Sigue vigente el DUS o DUSSI por operación en la exportación de servicios? ¿Existe un DUS consolidado? ¿Necesito agente de aduanas sobre US$2.000?

**C. Renta, comisiones y moneda**

13. Las comisiones de Polar o Paddle, ¿son un servicio del exterior con factura de compra (cambio de sujeto) y **retención de impuesto adicional del 35 %** (LIR arts. 59 y 74)? ¿O son un menor precio, al ser el MoR revendedor?
14. ¿La *reverse invoice* o autofactura del MoR sirve como respaldo contable, o siempre emito mi propio documento tributario?
15. ¿Con qué tipo de cambio registro los pagos en USD (devengo o percepción, dólar observado)? ¿Cómo trato las diferencias de cambio?
16. ¿Pido autorización para llevar contabilidad en USD (Código Tributario, art. 18)?
17. ¿Hay que informar al Banco Central los ingresos en divisas por pagos o exportación de servicios?
18. ¿El MoR retiene impuestos en EE. UU. o el Reino Unido sobre los pagos a un no residente (W-8BEN o W-8BEN-E)? ¿Puedo usar crédito en Chile?

**D. Documentos y operación**

19. ¿El sistema gratuito de boleta del SII sirve para un *checkout* web automatizado, o necesito un proveedor con API? ¿Flow o Mercado Pago emiten la boleta por mí?
20. Reembolsos y contracargos: en venta directa, ¿nota de crédito dentro de qué plazo? Con el MoR, ¿cómo se reflejan?
21. ¿Necesito patente municipal operando desde mi casa? ¿Califico como microempresa familiar? ¿Mi comuna acepta oficina virtual?
22. ¿Qué declaraciones juradas anuales me corresponden (1948 o 1947, 1847, 1926, operaciones con el exterior)?
23. ¿Puedo deducir los gastos previos al inicio de actividades (alojamiento, dominios, herramientas pagadas con tarjeta personal)? ¿Cómo se documentan?
24. ¿Cuánto tiempo debo conservar los documentos y cómo archivo los reportes del MoR?
25. ¿Registro la marca a nombre de la SpA desde el inicio? Si la registro como persona natural, ¿cómo la aporto o licencio después (IVA por uso de marca, art. 8 h)?
26. Si en el futuro vendo en la UE o Japón **sin** MoR, ¿qué registros extranjeros necesitaría (OSS, JCT)? Lo confirmamos para descartarlo por ahora.

## 7. Qué necesitamos de vuelta

- **Recomendación por escrito de:** estructura, régimen, códigos de actividad, tratamiento del IVA (exención o exportación), documento hacia el MoR y tratamiento de las comisiones.
- **Lista de obligaciones mensuales y anuales** con fechas.
- **Honorarios** del servicio contable mensual.

## Preguntas adicionales (fase 3, tras la verificación oficial)

27. ¿Puede una app sin docentes ampararse en la exención educacional del art. 13 N°4? ¿Conviene una consulta formal al SII? (El Oficio 2034/2022 apunta a «gravado».)
28. Venta vía MoR: ¿qué documento se emite al MoR (factura de exportación 110 o factura afecta) y sobre qué base (venta bruta o *payout* neto)? ¿Cómo se cumple el «uso exclusivo en el extranjero» si el MoR también vende en Chile?
29. ¿Sirve un código del listado de Aduanas (p. ej. 00550022 u 00120546) para autocalificar, o hay que pedir una calificación? ¿Hace falta agente de aduanas vía SICEX?
30. Comisiones del MoR: ¿impuesto adicional (arts. 59 y 74 LIR) con exención de IVA (art. 12 E N°7), o IVA por cambio de sujeto con factura de compra? ¿Qué efecto tienen los convenios con EE. UU. y el Reino Unido?
31. ¿Qué tipo de cambio se usa para los *payouts* en USD? ¿Conviene pedir contabilidad en USD (CT art. 18) en la misma declaración de inicio?
32. Venta directa: ¿el voucher de Flow o Mercado Pago vale como boleta en una venta web? ¿Hace falta un proveedor de boleta con API?
33. Patente: ¿qué cambió la Ley 21.850 (DO 17-10-2026)? ¿Qué corresponde en la comuna del domicilio?
34. Si se elige 14 D N°8: ¿qué DDJJ corresponden? ¿Cómo se acredita la condición de la Ley 21.735 para la tasa rebajada?
35. ¿Qué sanción tiene un inicio de actividades tardío?
36. Considerando que Flow y Mercado Pago exigirán el inicio de actividades (Ley 21.713), ¿cuál es el orden recomendado: inicio, procesador, primera venta?
