# LinguaChat: briefing tributario y societario (Chile) para el contador

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

Fecha de la investigación: 2026-11-02. Investigación web de solo lectura. **No es asesoría tributaria**: es un insumo para revisar con un contador o abogado tributario chileno.
Convenciones: fuente oficial = sin marca; **[SEC]** = fuente secundaria (blog, estudio, agregador); **NO VERIFICADO** = no se confirmó en fuente oficial vigente.

Supuestos: persona natural chilena, sin entidad constituida y sin inicio de actividades. Producto: suscripción SaaS de idiomas con lecciones automatizadas, sin profesores humanos. Primeros mercados: Chile y EE. UU. Hay dos flujos posibles:
- **(a) Venta directa.** LinguaChat cobra en CLP con Flow o Mercado Pago y es el vendedor ante el consumidor.
- **(b) Merchant of Record (MoR) extranjero.** Polar (EE. UU.) o Paddle (Reino Unido) es el vendedor legal ante el consumidor y paga a LinguaChat liquidaciones (payouts) en USD.

---

## 1. Resumen ejecutivo

1. **IVA sobre servicios.** Desde el 1-ene-2023, la Ley 21.420 grava con IVA toda prestación de servicios remunerada. Según la Circular SII 50/2022, está gravado "todo servicio prestado en Chile, aun cuando el beneficiario no tenga domicilio o residencia en nuestro país", salvo que Aduanas lo califique como exportación. Un SaaS operado desde Chile parte, en principio, como **afecto al 19%**, incluidas las ventas a extranjeros. https://www.sii.cl/normativa_legislacion/circulares/2022/circu50.pdf
2. **Exención educacional (art. 13 N°4 DL 825): en duda.** La Circular 11/2004 incluye "academias o institutos particulares" de idiomas, pero limitada a la "actividad docente propiamente tal". El Oficio 2050/2021 [SEC] admite cursos online si son docencia. Sin embargo, una app automatizada sin docentes puede calificarse como software o acceso a plataforma, que está afecto. **Este es el punto n°1 a resolver con el contador; considerar una consulta formal al SII.**
3. **Exportación de servicios (art. 12 E N°16 DL 825).** Exige que el Servicio Nacional de Aduanas califique el servicio. La exportación se documenta con factura de exportación (DTE 110) y, según la guía de Aduanas de 2019, con DUS/DUSSI (hasta US$2.000 la tramita el propio exportador; sobre ese monto, un agente de aduanas). Para miles de suscripciones B2C pequeñas puede ser inviable operativamente.
4. **Paddle y Polar están inscritos en el SII** para IVA digital: "PADDLE.COM MARKET LTD" (ID 592943409), "POLAR SOFTWARE INC." (ID 592594803) y "POLAR LIMITED" (ID 593293408). Cobran y enteran el 19% a los consumidores chilenos. https://www.sii.cl/vat/dwn_esp.html
5. **Con un MoR, LinguaChat no emite boletas a consumidores.** Sí debe documentar y declarar en Chile su venta o licencia al MoR, que es el payout bruto. Si Aduanas no la califica como exportación, ese ingreso quedaría afecto al 19% a cargo de LinguaChat, sin poder trasladarlo al MoR. **Riesgo de margen.** La documentación (factura 110 o factura afecta) debe definirla el contador.
6. **Estructura recomendable a evaluar: SpA unipersonal vía "Tu Empresa en un Día".** La constitución no tiene costo (solo la firma electrónica avanzada, FEA), la responsabilidad queda limitada al capital y no hay capital mínimo. La alternativa más simple, persona natural con giro de 1ª categoría, implica responsabilidad ilimitada. La boleta de honorarios (2ª categoría) **no calza** con la venta de un SaaS.
7. **Régimen Pro Pyme General (14 D N°3).** La Ley 21.755 rebajó transitoriamente el impuesto de primera categoría (IDPC) a **12,5%** para los años comerciales 2025, 2026 y 2027, y a 15% en 2028. El PPM baja a **0,125%** en el año de inicio, desde ingresos de agosto 2025 hasta diciembre 2027 (Circular SII 53/2025). La alternativa es Pro Pyme Transparente (14 D N°8), sin IDPC: los dueños tributan directo en el impuesto global complementario (IGC).
8. **Obligaciones desde el primer cobro:** inicio de actividades (F4415), boleta electrónica en ventas B2C directas, factura electrónica en ventas B2B, Registro de Compras y Ventas (RCV), F29 mensual (IVA + PPM), F22 anual en abril, DDJJ (1948 o 1947 según régimen), patente municipal y conservación documental.
9. **Comisiones del MoR o del procesador extranjero.** Un servicio prestado desde el extranjero y utilizado en Chile por un contribuyente de IVA se documenta con **factura de compra** (cambio de sujeto del art. 11 e). Hay que revisar también el impuesto adicional (art. 59 LIR). Las comisiones de Flow o Mercado Pago (Chile) generan crédito fiscal si vienen con factura afecta.
10. **Marca.** INAPI cobra 1 UTM al solicitar y 2 UTM al registrar, por clase: 3 UTM por clase, unos **$217.320 por clase** con la UTM de noviembre 2026 ($72.440). Para 3 clases (9, 41 y 42) son unos $651.960, más la publicación en el Diario Oficial. En la USPTO no hay registros para "LINGUACHAT" (consulta API del 2026-11-02), pero el prefijo "LINGUA" está muy poblado. La búsqueda en INAPI no se ejecutó porque tiene reCAPTCHA.

---

## 2. Tabla comparativa de estructuras

| Ítem | Persona natural, 1ª categoría | EIRL (Ley 19.857) | SpA (Código de Comercio art. 424 y ss.) |
|---|---|---|---|
| Quién | La misma persona con giro comercial | Solo 1 titular, persona natural | 1 o más accionistas, personas naturales o jurídicas |
| Constitución | Solo inicio de actividades en el SII (F4415 online) | Registro de Empresas y Sociedades (RES), Ley 20.659 | RES (Ley 20.659) |
| Costo de constitución | $0 | $0 en el RES; solo la FEA o el notario si no se tiene FEA | $0 en el RES; solo la FEA o el notario si no se tiene FEA |
| Tiempo | Inmediato online; si emite facturas, puede haber verificación del domicilio | ~1 día en el RES, más el inicio de actividades | ~1 día en el RES, más el inicio de actividades |
| Capital mínimo | No aplica | No hay [SEC] | No hay [SEC] |
| Responsabilidad | **Ilimitada**: responde con el patrimonio personal | Limitada al patrimonio de la EIRL | Limitada a los aportes |
| Flexibilidad | Baja; no admite socios | No admite socios (hay que transformarla) | Alta: admite inversionistas, clases de acciones y un pacto en el estatuto |
| Contabilidad posible | Pro Pyme: simplificada o completa (opcional); 14 A: completa | Igual | Igual |
| Régimen tributario posible | 14 D N°3, 14 D N°8 o 14 A. Renta presunta no aplica (es solo para agrícola, minería y transporte) | 14 D N°3, 14 D N°8 o 14 A | 14 D N°3, 14 D N°8 (si todos los dueños son contribuyentes de impuestos finales) o 14 A |
| Retiros y utilidades | Separación difusa entre patrimonio personal y del negocio | Retiros del titular, registrados en DJ 1948 (14 D N°3) | Dividendos o retiros, registrados en DJ 1948 (14 D N°3) o atribución vía DJ 1947 (14 D N°8) |
| Cuenta bancaria | Cuenta de persona natural "con giro" o cuenta personal; mezcla riesgosa | Cuenta empresa (con RUT de la EIRL) | Cuenta empresa (con RUT de la SpA) |
| Payouts internacionales en USD | Posible, pero el MoR hace KYC sobre la persona | KYC de empresa | KYC de empresa; es lo que más esperan Paddle y Polar (Stripe Connect) |
| Patente municipal | Sí, si ejerce actividad lucrativa (DL 3.063 art. 23) | Sí | Sí |
| Domicilio | Casa propia o arrendada, o microempresa familiar (MEF) | Ídem; la MEF para personas jurídicas está NO VERIFICADA | Ídem; oficina virtual [SEC] |

Fuentes:
- Tu Empresa en un Día (ChileAtiende). Permite crear EIRL, Ltda., SpA, S.A. cerrada, etc. "No tienes costo"; los socios sin FEA pagan su firma; requiere ClaveÚnica. https://www.chileatiende.gob.cl/fichas/21409-tu-empresa-en-un-dia · RES: https://www.registrodeempresasysociedades.cl/
- Gasto real del primer mes de una SpA simple bajo $150.000 [SEC]: https://simplo.cl/cuanto-cuesta-crear-empresa-chile-2026/
- Requisitos Pro Pyme: capital al inicio ≤ 85.000 UF; promedio de ingresos de 3 años ≤ 75.000 UF (incluye relacionados). https://www.sii.cl/preguntas_frecuentes/declaracion_renta/001_140_7530.htm
- Pro Pyme General: contabilidad completa o simplificada; los dueños tributan sobre retiros efectivos. https://www.sii.cl/preguntas_frecuentes/declaracion_renta/001_140_7529.htm
- Pro Pyme Transparente: liberado del IDPC; todos los propietarios deben ser contribuyentes de impuestos finales; la opción se ejerce del 1-ene al 30-abr. https://www.sii.cl/preguntas_frecuentes/declaracion_renta/001_140_7532.htm
- Tipos de régimen: https://www.sii.cl/destacados/modernizacion/tipos_regimenes_mt.html

**Tasas IDPC y PPM vigentes (Circular SII 53/2025, Ley 21.755, DO 11-jul-2025)**, solo para **14 D N°3**:
- IDPC: 12,5% para los años comerciales 2025, 2026 y 2027; 15% en 2028. La tasa permanente es 25%. La condición de cotización previsional (Ley 21.735) "se entiende cumplida" hasta 2028.
- PPM 14 D N°3, tasa permanente: 0,25% el año de inicio o si los ingresos del año anterior fueron ≤ 50.000 UF; 0,5% si superan 50.000 UF.
- PPM 14 D N°3, rebaja transitoria: **0,125%** (o 0,25% sobre 50.000 UF), aplicable a los ingresos de ago-2025 a dic-2027. La ley no rebaja el PPM de 2028.
- **14 D N°8 no tiene IDPC ni rebaja de PPM**. Su tasa de PPM (se cita 0,2%) está **NO VERIFICADA**.
- Fuente: https://www.sii.cl/normativa_legislacion/circulares/2025/circu53.pdf

**Persona natural: honorarios versus 1ª categoría.** La boleta de honorarios corresponde a actividades del art. 42 N°2 LIR (profesiones y ocupaciones lucrativas personales), y su emisión exige inicio de actividades de 2ª categoría (https://www.sii.cl/como_se_hace_para/boletas/guia_emitir_bhe.htm). Vender suscripciones a un software o plataforma es una actividad comercial o de empresa (art. 20 LIR) y se documenta con boleta o factura. **Interpretación: los honorarios no sirven para LinguaChat. Confirmar con el contador.**

**Domicilio y patente.**
- Para el inicio de actividades en 1ª categoría se informan obligatoriamente el ROL y la comuna, la calidad de ocupación y el RUT del propietario. Un inmueble arrendado se acredita con un contrato notarial de más de 6 meses de vigencia. https://www.sii.cl/servicios_online/guia_ayuda_inicio_persona_natural_juridica.pdf
- La microempresa familiar (MEF) requiere actividad en la casa habitación, no más de 5 trabajadores ajenos a la familia y capital inicial ≤ 1.000 UF. Se inscribe primero en la municipalidad y luego en el SII. https://www.chileatiende.gob.cl/fichas/3268-inicio-de-actividades-como-microempresa-familiar-mef
- Patente (DL 3.063 art. 24 [SEC iura.cl]): entre 2,5‰ y 5‰ del capital propio, con un mínimo de 1 UTM. Quien no está obligado a llevar balance paga 1 UTM por 12 meses. El tope (4.000 vs. 8.000 UTM) está NO VERIFICADO contra la BCN. https://iura.cl/dl-3063-ministerio-del-interior/24
- La oficina virtual como domicilio tributario y para la patente es práctica habitual [SEC] (https://www.oficinavirtual.cl/blog/2026/6/9/puedo-usar-mi-casa-como-domicilio-tributario-chile). Su aceptación por la municipalidad específica está NO VERIFICADA.

**Riesgos de operar con cuentas personales.** Mezclar fondos personales y del negocio dificulta acreditar ingresos y gastos ante el SII, expone el patrimonio personal (en persona natural) y complica la conciliación de payouts en USD y el KYC de los MoR. Es una recomendación general, no una cita.

---

## 3. Obligaciones SII desde el primer cobro (checklist)

| # | Obligación | Fuente legal u oficial | Nota |
|---|---|---|---|
| 1 | Inicio de actividades (F4415) **dentro de los 2 meses** siguientes al comienzo de la actividad | Código Tributario art. 68; https://www.sii.cl/servicios_online/guia_ayuda_inicio_persona_natural_juridica.pdf | Online con clave tributaria; en 1ª categoría hay que acreditar el domicilio |
| 2 | Elegir códigos de actividad (ver §7) y régimen (14 D N°3, N°8 o 14 A) | LIR art. 14; FAQ SII 7531 | El régimen se elige al iniciar actividades |
| 3 | **Boleta electrónica** (DTE 39 afecta, 41 exenta) por cada venta B2C directa; envío al SII ≤ 1 hora | Ley 21.210 (obligatoria desde 2021); Res. Ex. SII 74/2020; https://www.sii.cl/destacados/boletas_electronicas/index.html | El sistema gratuito del SII (e-Boleta) solo exige 1ª categoría vigente (FAQ 7799). Para checkout web automatizado se necesita un proveedor de mercado o una API; la integración con el sistema gratuito está NO VERIFICADA |
| 4 | **Factura electrónica** (DTE 33 afecta, 34 exenta) en ventas a contribuyentes chilenos | Ley 20.727; DL 825 art. 52-53 | |
| 5 | **Factura de exportación** (DTE 110) y notas de crédito y débito de exportación (112, 111) si el servicio está calificado por Aduanas | DL 825 art. 12 E N°16; https://www.sii.cl/preguntas_frecuentes/factura_electronica/001_003_6920.htm | Requiere estar habilitado como emisor electrónico |
| 6 | **Factura de compra** por servicios recibidos del extranjero (cambio de sujeto) | DL 825 art. 11 e); Circ. 50/2022; FAQ IVA digital https://www.sii.cl/preguntas_frecuentes/iva_serv_digitales/arbol_faqs_iva_serv_digitales_1642.htm | Aplica a fees de MoR o procesadores extranjeros, hosting, SaaS, etc. Informar al proveedor extranjero la calidad de contribuyente de IVA |
| 7 | **Registro de Compras y Ventas (RCV)** electrónico | Ley 20.727; Res. Ex. SII 61/2017 (NO VERIFICADO el número) | Base de la propuesta del F29 |
| 8 | **F29 mensual**: IVA débito − crédito + PPM (+ retenciones) | DL 825 art. 64; LIR art. 84 | Vence el día 12, o el 20 si declara online como facturador electrónico (NO VERIFICADO vigente) |
| 9 | PPM: 0,125% del ingreso bruto mensual (14 D N°3, año de inicio, 2025-2027) | Circ. SII 53/2025 | |
| 10 | **F22 anual (abril)** | LIR art. 65 y 69 | |
| 11 | **DDJJ anuales**: 1948 (retiros y dividendos, 14 A y 14 D N°3) o 1947 (14 D N°8; vence ~28-mar) | https://www.sii.cl/preguntas_frecuentes/ddjj/001_135_8928.htm | Otras (1847 balance, 1926 base imponible, DJ de operaciones con el exterior) quedan NO VERIFICADAS: depende del régimen y la contabilidad |
| 12 | **Patente municipal** en la comuna del domicilio | DL 3.063 art. 23-24 | La municipalidad pide el inicio de actividades y la acreditación de domicilio o zonificación |
| 13 | Tipo de cambio: registrar los ingresos en USD en pesos | DL 825 / LIR (tipo de cambio observado BCCh, NO VERIFICADO la regla exacta) | Llevar contabilidad en USD requiere **autorización del SII** (Código Tributario art. 18) |
| 14 | Devoluciones y reembolsos: **nota de crédito** (61, o 112 si es exportación) | DL 825 art. 21 y 70 | Los reembolsos que hace el MoR al consumidor **no** generan nota de crédito de LinguaChat al consumidor (ver §4) |
| 15 | Conservación de libros y documentos **mientras esté pendiente el plazo de prescripción** (3 años, 6 años en ciertos casos) | Código Tributario art. 17 y 200; FAQ SII https://www.sii.cl/preguntas_frecuentes/declaracion_renta/001_140_4628.htm | Usar 6 años como regla práctica. Los cambios de la Ley 21.713 a la prescripción están NO VERIFICADOS en detalle |
| 16 | Exportación: registro por operación y respaldo durante 5 años (guía de Aduanas) | https://www.aduana.cl/aduana/site/docs/20190424/20190424180105/expservicios.pdf | |

---

## 4. Flujos de dinero y documentos (4 casos)

| Caso | Quién vende al consumidor | Documento que emite LinguaChat | IVA Chile | Renta Chile |
|---|---|---|---|---|
| **(1) Venta directa a un consumidor chileno** (Flow o Mercado Pago, CLP) | LinguaChat | **Boleta electrónica** (39 afecta, o 41 si se acredita la exención del art. 13 N°4) | 19% débito incluido en el precio, salvo exención educacional (en duda, §1 punto 2) | Ingreso bruto del giro |
| **(1b) Venta directa a un consumidor de EE. UU.** (cobro directo) | LinguaChat | Sin calificación de Aduanas: **boleta afecta** (Circ. 50: el servicio prestado en Chile está gravado aunque el beneficiario resida afuera). Con calificación: **factura de exportación 110** + DUS/DUSSI | 19% sin calificación; exento con calificación (más recuperación del crédito vía art. 36) | Ingreso del giro (renta mundial, LIR art. 3). Sales tax de EE. UU.: obligación del vendedor según el estado (fuera del alcance; NO VERIFICADO) |
| **(2) Venta a través del MoR** (Polar o Paddle venden al consumidor) | **El MoR** (factura al consumidor y cobra VAT, sales tax o IVA) | **Ninguno al consumidor** | El IVA del consumidor chileno lo declara el MoR en el régimen simplificado (art. 35 A y ss.) | No es ingreso directo de LinguaChat: su ingreso es el payout (caso 3) |
| **(3) Payout del MoR a LinguaChat** (USD) | LinguaChat le vende o licencia al MoR | **A definir**: factura de exportación 110 al MoR si Aduanas califica el servicio o la licencia, o factura (o boleta) afecta. Polar exige además una "reverse invoice" comercial por payout; Paddle emite una "Reverse Invoice" (autofacturación) y dice que el vendedor no necesita facturarle. **Ninguno de esos documentos reemplaza el DTE chileno** (interpretación) | Sin calificación: 19% sobre el monto que factura LinguaChat (el MoR, extranjero, no lo paga: sale del margen). Con calificación: exento | Ingreso = monto facturado al MoR. Definir con el contador si el ingreso bruto es la venta bruta o el neto de fees (depende de si el MoR es revendedor o comisionista) |
| **(4) Comisiones, sales taxes y utilidad** | — | Factura de compra (DTE 46) por los fees del MoR o procesador extranjero, si se tratan como servicio recibido del extranjero | Cambio de sujeto: IVA débito y crédito en el F29 (neutral si hay crédito pleno). Las comisiones de Flow o Mercado Pago llegan con factura afecta chilena y dan crédito fiscal | Los fees son gasto (LIR art. 31). Revisar la **retención de impuesto adicional del 35%** (LIR art. 59 y 74 N°4) por pagos a extranjeros. VAT y sales tax retenidos por el MoR **no** son ingreso ni gasto de LinguaChat si el MoR es el vendedor; no dan crédito en Chile. Utilidad = payout − costos, tributa según el régimen |

Puntos de apoyo:
- Polar: "you'll need to invoice Polar in return for each payout". Los retiros son manuales. Fee de 4% + 40¢ por transacción; Stripe cobra $2/mes + 0,25% + $0,25 por payout y hasta 1% de conversión. **Chile figura entre los países de payout** (vía Stripe Connect Express). https://polar.sh/docs/features/finance/payouts.md · https://polar.sh/docs/merchant-of-record/supported-countries.md
- Paddle: "you do not have to invoice us"; emite una Reverse Invoice en cada payout. https://www.paddle.com/help/manage/get-paid/do-i-need-to-invoice-paddle-for-my-payout. Paddle no cobra impuesto sobre el payout porque aplica reverse charge en el Reino Unido. https://www.paddle.com/help/manage/get-paid/should-i-charge-paddle-vattax-for-payouts
- Precedente análogo: el Oficio SII 2034/2022 [SEC vLex, texto parcial] trata a una SpA chilena que vende cursos grabados mediante una plataforma extranjera inscrita en IVA digital, que cobra en USD y le remesa el neto de comisión. El SII señala que la prestación "se encuentra gravada con IVA" y aplica el criterio del art. 5 (actividad desarrollada en Chile). Las conclusiones sobre exportación no se pudieron leer: NO VERIFICADO. https://vlex.cl/vid/ordinario-n-2034-servicio-907082772
- Comisiones por venta de cursos online cobradas a personas sin domicilio: afectas, salvo calificación de exportación por Aduanas (Oficio 1237/2021 [SEC]). https://transtecnia.cl/?p=60201

---

## 5. Exportación de servicios

- **Base legal.** DL 825 art. 12 E N°16 exime "los ingresos percibidos por la prestación de servicios a personas sin domicilio ni residencia en el país, siempre que el Servicio Nacional de Aduanas califique dichos servicios como exportación" (redacción citada por SII y Aduanas; el texto vigente en la BCN no fue leído). El art. 36 permite recuperar el IVA crédito de los insumos.
- **Software estándar.** El SII señala que las empresas de software cerrado están afectas a IVA (art. 8 h). Solo con la calificación de Aduanas, las licencias a clientes sin domicilio en Chile se consideran exportación (art. 12 E N°16 y art. 36). https://www.sii.cl/preguntas_frecuentes/impuestos_mensuales/001_130_5731.htm
- **Requisitos** (Aduanas, Res. Ex. 1931 del 16-05-2024): (i) el servicio se realiza en Chile y se presta a personas sin domicilio ni residencia en el país; (ii) se utiliza **exclusivamente en el extranjero**; (iii) su existencia y su valor son verificables; (iv) el prestador tiene domicilio o residencia en Chile. https://www.aduana.cl/calificacion-de-servicios-como-exportacion/aduana/2018-12-16/222609.html
- **Trámite.** Es online (aduana.cerofilas.gob.cl) o presencial, y **sin costo**. Se presenta una solicitud que describa el servicio, sus etapas, dónde ocurre cada una y el medio de envío. Para persona natural se acompaña el certificado de inicio de actividades del SII (≤ 60 días de antigüedad). Para sociedades, la escritura o los antecedentes de constitución, certificados y poderes. Opcional: un informe de costos.
- **Listado de servicios ya calificados** (Res. Ex. 2511/2007, anexo reemplazado por la Res. Ex. 2976/2016 y actualizado por la Res. Ex. 2806/2020). Incluye "desarrollo de sistemas informáticos" y "diseño de páginas web". **No se pudo confirmar que incluya educación online, e-learning o SaaS** (NO VERIFICADO). Si no aparece, hay que pedir la calificación específica. https://www.aduana.cl/resolucion-exenta-n-2976-19-05-2016/aduana/2016-05-24/110031.html
- **Formalidad aduanera** (guía de Aduanas 2019, posiblemente desactualizada): hasta US$2.000 se tramita un DUSSI personalmente; sobre US$2.000 se necesita un agente de aduanas. Se lleva registro por operación y respaldo durante 5 años. https://www.aduana.cl/aduana/site/docs/20190424/20190424180105/expservicios.pdf. **No se encontró un régimen de DUS consolidado o mensual para servicios** (NO VERIFICADO): clave para el modelo B2C.
- **¿La venta directa a un consumidor de EE. UU. es exportación?** Cumple los requisitos (i) y, probablemente, (ii), pero solo es exportación si Aduanas la califica. El costo operativo (DUS por operación) puede superar el beneficio en tickets pequeños. Sin calificación aplica el 19% (Circ. 50/2022).
- **¿Venderle al MoR (empresa extranjera) es exportación?** Es un mejor candidato: un solo cliente B2B extranjero y payouts periódicos de monto mayor. El problema está en el requisito de "uso exclusivo en el extranjero": el MoR revende también a consumidores chilenos. Habría que prorratear o excluir las ventas a Chile. **Pregunta crítica para el contador y para Aduanas.**
- **Factura de exportación electrónica** (DTE 110): "respalda la venta de bienes o servicios a personas sin domicilio ni residencia". Requiere habilitación como emisor electrónico. https://www.sii.cl/preguntas_frecuentes/factura_electronica/001_003_6920.htm
- **Beneficio en renta.** Crédito por impuestos pagados en el exterior por servicios calificados (guía de Aduanas; LIR art. 41 A). Verificar si los MoR retienen withholding en EE. UU. o el Reino Unido (NO VERIFICADO).

---

## 6. IVA a servicios digitales de proveedores extranjeros y el MoR

- **Ley 21.210 (2020)** creó el IVA a servicios digitales prestados por extranjeros a consumidores no contribuyentes. La **Ley 21.713** (DO 24-oct-2024) lo amplió a **todos los servicios** prestados de forma remota por no domiciliados y utilizados en Chile (B2C), y desde el 25-oct-2025 incluye bienes de hasta US$500. https://www.sii.cl/vat/faq1_esp.html · https://www.sii.cl/noticias/2026/PPTIVASD08062026_2.pdf
- **Régimen simplificado** (DL 825 art. 35 A a 35 J): tasa del 19% recargada en el precio; sin obligación de emitir documentos tributarios; sin crédito fiscal; declaración y pago hasta el día 20 del mes siguiente; las devoluciones al cliente se rebajan (art. 35 G).
- **Nómina de extranjeros inscritos** (https://www.sii.cl/vat/dwn_esp.html, consultada el 2026-11-02):
  - `Servicios | 592943409 | PADDLE.COM MARKET LTD`
  - `Servicios | 592594803 | POLAR SOFTWARE INC.`
  - `Servicios | 593293408 | POLAR LIMITED`
  - También aparecen Digital River (GmbH e Ireland). No aparecen Lemon Squeezy, Stripe, FastSpring ni Gumroad.
  - Que "POLAR SOFTWARE INC." corresponda a la entidad de polar.sh es probable pero NO VERIFICADO (contrastar con los términos de Polar).
- **Nómina de "Empresas Extranjeras No Inscritas"** (cambio de sujeto total vía emisores de tarjetas): **no** incluye a Paddle, Polar, Stripe, Lemon Squeezy ni Gumroad. https://www.sii.cl/vat/neni_esp.html
- **Implicancias:**
  - Un consumidor chileno que compra LinguaChat vía Paddle o Polar paga el IVA del 19% cobrado por el MoR, que lo entera al SII. LinguaChat no emite boleta ni declara ese IVA.
  - **Doble capa potencial.** Si la venta de LinguaChat al MoR no se califica como exportación, también existiría IVA chileno en la relación LinguaChat → MoR. Es la pregunta crítica del §5.
  - Si LinguaChat, como contribuyente de IVA, contrata servicios a un proveedor inscrito (p. ej. el fee del MoR, hosting o herramientas), el SII indica que debe informarle su calidad de contribuyente de IVA y documentar con factura de compra. https://www.sii.cl/preguntas_frecuentes/iva_serv_digitales/001_200_7778.htm

---

## 7. Códigos de actividad candidatos (CIIU4.CL 2012, catálogo SII)

Catálogo del SII: https://www.sii.cl/ayudas/ayudas_por_servicios/1956-codigos-1959.html. Homologación: Res. Ex. SII 56/2018. https://www.sii.cl/normativa_legislacion/resoluciones/2018/reso56.pdf

| Código | Descripción (SII) | Afecto IVA | Categoría | ¿Disponible online? | Encaje con LinguaChat |
|---|---|---|---|---|---|
| **582000** | Edición de programas informáticos | SÍ | 1 | SÍ | Alto: venta o licencia de software estándar / SaaS |
| **631200** | Portales web | SÍ | 1 | SÍ | Medio-alto: plataforma web por suscripción |
| 631100 | Procesamiento de datos, hospedaje y actividades conexas | SÍ | 1 | SÍ | Medio: hosting y SaaS |
| 620900 | Otras actividades de tecnología de la información y servicios informáticos | SÍ | 1 | SÍ | Medio |
| 620100 | Actividades de programación informática | G (depende) | G | SÍ | Bajo: desarrollo a medida |
| 620200 | Consultoría informática y gestión de instalaciones | SÍ | 1 | SÍ | Bajo |
| **854909** | Otros tipos de enseñanza n.c.p. | **NO** | 1 | SÍ | Educacional; respaldaría la exención del art. 13 N°4 **solo si** califica como actividad docente |
| 855000 | Actividades de apoyo a la enseñanza | G | G | SÍ | Bajo-medio |
| 854902 | Servicios personales de educación (independientes) | NO | 2 | SÍ | No calza: 2ª categoría, docente persona natural |

Las descripciones en español se reconstruyeron a partir del resumen de la página; verificar la glosa exacta en el SII. La marca "Afecto IVA" del catálogo es orientativa: **no determina** la tributación real. Sugerencia a validar: código principal 582000 o 631200, y evaluar 854909 como secundario solo si el contador sostiene la exención.

**Art. 13 N°4 (establecimientos de educación):**
- La Circular 11/2004 lista academias o institutos particulares, incluidos los de idiomas. La exención se limita a la actividad docente (matrícula, aranceles, cursos dictados por el establecimiento); la venta de textos o materiales está afecta. No aborda la educación a distancia. https://www.sii.cl/documentos/circulares/2004/circu11.htm
- El Oficio 2050/2021 [SEC] admite cursos online, aun en una plataforma extranjera, si son "docencia propiamente tal", "cualquiera sea el carácter o la forma jurídica" de quien enseña. https://transtecnia.cl/noticias/sii-analiza-aplicacion-de-iva-a-cursos-de-formacion-on-line-prestados-desde-el-extranjero/
- Un oficio de 2005 sobre una "Biblioteca Virtual" excluyó la venta de contenidos digitales de la exención [SEC].
- **Conclusión: no está resuelto para una app automatizada sin docentes. NO VERIFICADO; probablemente afecto.**

---

## 8. Marca (INAPI / USPTO)

**INAPI (Chile)**
- Tasas oficiales: **1 UTM inicial + 2 UTM final = 3 UTM por clase**. La renovación cuesta 6 UTM por clase. La publicación en el Diario Oficial se paga aparte y su costo varía según la extensión de la cobertura. https://www.inapi.cl/marcas/para-informarse?acordeon=4
- Con la UTM de noviembre 2026 ($72.440; https://www.sii.cl/valores_y_fechas/utm/utm2026.htm):
  - 1 clase: ≈ $217.320
  - Clases 9 (software descargable/app), 41 (educación y enseñanza de idiomas) y 42 (SaaS / software no descargable): ≈ **$651.960**, más el Diario Oficial (más honorarios si actúa un abogado).
- Solicitud y pago en línea: https://tramites.inapi.cl/Trademark/TrademarkApplication/IndexTrademark
- **Búsqueda.** El buscador está en https://buscadormarcas.inapi.cl/Marca/BuscarMarca.aspx. Tiene **reCAPTCHA**, así que no se ejecutó (no se elude). Procedimiento manual:
  1. "Nombre de Marca" = `LINGUACHAT`, con los modos "exacta" y luego "que contenga" (`LINGUA`, `CHAT`, `LINGO`).
  2. "N° Clase" = 9, 41 y 42, cada una por separado.
  3. "Estado Trámite" = todos.
  4. Revisar también las variantes fonéticas a mano (`LINGOCHAT`, `LINGUA CHAT`, `LINGUACHET`): el buscador **no tiene modo fonético**, y la ley permite rechazar por similitud fonética, gráfica o conceptual.
- Otros buscadores de INAPI: https://www.inapi.cl/marcas/buscadores

**USPTO (EE. UU.)** — consulta directa a la API pública de tmsearch.uspto.gov, 2026-11-02:
- Sin resultados (0 hits) para `linguachat`, `linguachat*`, `"lingua chat"`, `lingua AND chat`, `*chat* AND lingu*` y `lingochat`.
- Antecedente cercano: **LINGUACHET**, Reg. 4703714 (IC 009, software educativo de idiomas), de George A. Rietz (Franklin, TN). Estado: "CANCELLED - SECTION 8" (03-dic-2021). Hay además una segunda solicitud LINGUACHET muerta.
- El prefijo `LINGUA*` arroja 314 registros (90 vivos). Varios están en las clases 9, 41 y 42 y en el campo de idiomas: LINGUA (Reg. 3350085, IC 009, vigente), LINGUALEO (IC 9/41), LINGUATRIP (IC 41), LINGUALEAP (IC 9/41, aprobada para publicación), LINGUAAI (IC 42, notice of allowance), LINGUAWAVE (IC 9), LINGUANATION (IC 9/41), entre otros. **Campo concurrido: riesgo de oposición o de rechazo por similitud. Conviene una búsqueda profesional.**
- [SEC] Existe una startup "LinguaChat" de Almaty (Kazajistán), app de inglés para niños (CB Insights la marca como cerrada), y un producto "Lingua Chat" listado en directorios de IA. No se encontró una marca registrada de su parte. https://www.cbinsights.com/company/linguachat

---

## 9. Preguntas concretas para el contador

1. ¿Una app de idiomas automatizada, sin docentes, puede ampararse en la exención del art. 13 N°4 DL 825 (Circ. 11/2004, Oficio 2050/2021)? ¿O es software o acceso a plataforma afecto? ¿Conviene una consulta formal al SII antes de partir?
2. ¿Persona natural de 1ª categoría o SpA desde el día 1? ¿En qué umbral de ingresos se justifica la SpA?
3. Confirmar que la boleta de honorarios no es aplicable a la venta de suscripciones SaaS.
4. ¿14 D N°3 (IDPC 12,5% y PPM 0,125% hasta 2027) o 14 D N°8 (transparente)? Considerar mi tramo de IGC y si reinvertiré las utilidades.
5. ¿Contabilidad simplificada o completa? ¿Conviene la completa por tener ingresos en USD y la posible exportación?
6. ¿Qué códigos de actividad declaro (582000, 631200, 854909)? ¿Declarar un código "NO afecto" genera riesgo si el SII considera la actividad afecta?
7. En el flujo MoR, ¿cuál es el DTE correcto hacia Paddle o Polar: factura de exportación 110 (con calificación de Aduanas) o factura afecta? ¿Sobre qué base: venta bruta o payout neto de fees?
8. Si no obtengo la calificación de Aduanas, ¿debo pagar 19% de IVA sobre los payouts del MoR aunque el MoR ya cobró IVA o VAT a los consumidores finales?
9. ¿Cómo cumplir el requisito de "uso exclusivo en el extranjero" si el MoR también vende a consumidores en Chile? ¿Prorrateo? ¿Dos líneas de facturación?
10. ¿El listado vigente de Aduanas incluye algún código aplicable (software, e-learning, portales)? ¿O tramito una calificación específica? ¿Plazo estimado?
11. ¿Sigue vigente la exigencia de DUS o DUSSI por operación en exportación de servicios? ¿Existe DUS consolidado? ¿Necesito agente de aduanas sobre US$2.000?
12. En la venta directa a consumidores de EE. UU. (sin MoR), ¿emito boleta afecta (19%)? ¿Me conviene exportar (factura 110 + DUS) o derivar todo lo extranjero al MoR?
13. ¿Con qué tipo de cambio registro los payouts en USD (fecha de devengo o de percepción; dólar observado)? ¿Cómo trato las diferencias de cambio?
14. ¿Pido autorización para llevar contabilidad en USD (Código Tributario art. 18)? ¿O sigo en CLP?
15. Los fees de Paddle o Polar: ¿son un servicio del exterior que exige factura de compra (cambio de sujeto) y una **retención de impuesto adicional del 35%** (LIR art. 59 y 74)? ¿O se tratan como menor precio de venta, al ser el MoR revendedor?
16. ¿La "reverse invoice" de Paddle o Polar sirve como respaldo contable, o debo emitir siempre mi propio DTE?
17. Reembolsos y chargebacks: en venta directa, ¿nota de crédito (61) dentro de qué plazo (DL 825 art. 21)? En MoR, ¿los reembolsos que descuenta el MoR se reflejan con nota de crédito de exportación (112) o con una menor facturación del período?
18. ¿El sistema gratuito de boleta del SII sirve para un checkout web automatizado? ¿Qué proveedor de boleta electrónica con API recomiendas? ¿Costo?
19. ¿Flow o Mercado Pago emiten boleta por mí, o solo el comprobante de pago? ¿El voucher de pago electrónico sirve como boleta en ventas online?
20. ¿Necesito patente municipal operando desde mi casa? ¿Califico como MEF? ¿Mi comuna acepta oficina virtual? ¿Cuánto pagaría (mínimo 1 UTM)?
21. ¿Qué DDJJ anuales me corresponden según régimen y contabilidad (1948/1947, 1847, 1926, otras)? ¿Hay DJ por operaciones con el exterior?
22. ¿Hay obligación de informar al Banco Central (Compendio de Normas de Cambios Internacionales) los ingresos por exportación de servicios o los payouts en USD?
23. ¿Puedo deducir como gasto el hosting y las APIs extranjeras (p. ej. LLM, TTS) pagados con tarjeta personal antes del inicio de actividades? ¿Cómo documento esos gastos de "organización y puesta en marcha"?
24. ¿El sales tax de EE. UU. (nexus económico por estado) me afecta si vendo directo con Flow o Mercado Pago a usuarios de EE. UU., o solo vía MoR?
25. ¿Qué conservación documental exacta exige la ley hoy (art. 17 y 200 del Código Tributario tras la Ley 21.713)? ¿Cómo archivo los reportes del MoR?
26. ¿Conviene registrar la marca a nombre de la SpA desde el inicio? Si la registro como persona natural, ¿cómo la aporto o licencio a la SpA (art. 8 h DL 825: IVA en el uso de marcas)?

---

## 10. No verificado / pendientes

- Texto vigente de los artículos 5, 12 E N°16 y 13 N°4 del DL 825, y de los artículos 17 y 200 del Código Tributario en leychile (BCN). No se leyó el texto consolidado; se usaron citas de circulares y FAQ del SII y de Aduanas.
- Conclusión final del **Oficio SII 2034/2022** sobre la exportación de cursos vendidos vía plataforma extranjera (solo se vio un extracto parcial en vLex).
- Que el listado de Aduanas de servicios calificados (Res. 2976/2016 y 2806/2020) incluya e-learning, SaaS o software estándar.
- Vigencia del umbral DUS/DUSSI de US$2.000 y existencia de un DUS consolidado para servicios.
- Tasa de PPM del 14 D N°8 (se menciona 0,2%) y DDJJ 1847/1926 para Pro Pyme.
- Tope de la patente municipal (4.000 vs. 8.000 UTM) y aceptación de la oficina virtual por la municipalidad específica; si una SpA o EIRL puede ser MEF.
- Plazos exactos del F29 (12 vs. 20) para el caso concreto; número de la resolución del RCV.
- Que "POLAR SOFTWARE INC." del SII sea la entidad contratante de polar.sh; moneda real del payout de Polar a Chile (Stripe Connect podría pagar en CLP).
- Si el sistema gratuito de boleta del SII admite boleta exenta (41) e integración por API.
- Costo actual de la FEA comprada dentro del RES (sin cifra oficial; las fuentes [SEC] hablan de ~$700 a $20.000).
- Resultado en INAPI para "LinguaChat": no ejecutado por el reCAPTCHA.
- Withholding del MoR en EE. UU. o el Reino Unido sobre los payouts a un no residente (formularios W-8BEN / W-8BEN-E) y crédito en Chile.
- Obligaciones ante el Banco Central por divisas de exportación de servicios.
