# Cumplimiento tributario y comercial en Chile — LinguaChat

> **Fase 3 (2026-11-03): verificado contra fuentes oficiales** en `docs/business/research/2026-11-03-sii-official-verification.md`. Correcciones principales:
> - **Inicio de actividades:** desde el 2-ene-2026 (Ley 21.713), Flow, Mercado Pago y otros medios de pago constituidos en Chile **deben exigir el inicio de actividades** antes de contratar. La venta directa no puede abrirse antes.
> - **Polar:** la comisión es **5 % + 50¢** en el plan Starter (4 % + 40¢ es «Early Member»). Sigue sin resolverse la contradicción con Stripe sobre cuentas `recipient`.
> - **Patente municipal:** se paga entre 2,5 ‰ y 5 ‰ del capital propio, con mínimo de 1 UTM. Las **8.000 UTM son el máximo legal anual, no el costo previsto**: para una empresa pequeña el monto depende de su capital propio y de la comuna. Revisar la Ley 21.850 (DO 17-10-2026).
> - **Factura de exportación (DTE 110):** requiere petición o el F2117 en el portal gratuito.
> - **Exportación:** se puede autocalificar si el servicio figura en el listado de Aduanas. DUS vía SICEX es optativo.
> - **Comisiones del MoR:** considerar el art. 12 E N°7 (exención si hay impuesto adicional).
> - **F29:** el día 20 aplica solo a facturadores electrónicos que declaran en línea.
> - **Contabilidad en USD:** pedirla **en el inicio de actividades**.
> - **Descripción del producto:** tutor **por reglas, sin IA generativa** (la AUP de Polar restringe el contenido IA y los chatbots).

> **No es asesoría tributaria ni legal.** Es la síntesis operativa para decidir con un contador chileno.
> - Fecha: 2026-11-02.
> - Fuentes y citas completas, incluidas las marcadas NO VERIFICADO:
>   - `docs/business/research/2026-11-01-payments-pricing-research.md` (precios, comisiones);
>   - `docs/business/research/2026-11-02-chile-sii-briefing.md` (SII, Aduanas, estructura, INAPI/USPTO);
>   - `docs/business/research/2026-11-02-polar-paddle-eligibility.md` (elegibilidad, KYC, impuestos, webhooks).
> - **Nada de esto se ha hecho:** no hay entidad constituida, inicio de actividades, cuenta en ningún procesador ni cobro alguno.

## 1. Lo que hay que saber antes de cobrar el primer peso

1. **Un SaaS operado desde Chile parte afecto a IVA del 19 %, incluso cuando vende a extranjeros.**
   - Fuente: Ley 21.420; Circular SII 50/2022: «todo servicio prestado en Chile, aun cuando el beneficiario no tenga domicilio».
   - Solo queda exento si el Servicio Nacional de Aduanas lo **califica como exportación** (DL 825, art. 12 E N°16).
   - **No suponemos** que una venta a EE. UU. está exenta.
2. **La exención educacional (art. 13 N°4) está en duda.**
   - Cubre «actividad docente» de institutos, incluidos los de idiomas.
   - Una app automatizada sin docentes probablemente se trata como software o plataforma (afecta).
   - Es la pregunta n.º 1 para el contador; conviene una consulta formal al SII.
3. **Usar un *Merchant of Record* (MoR) no elimina las obligaciones en Chile.**
   - El MoR (Polar, Paddle) vende al consumidor y cobra sus impuestos.
   - Ambos figuran inscritos en el registro de IVA de servicios digitales del SII: `PADDLE.COM MARKET LTD`, `POLAR SOFTWARE INC.`, `POLAR LIMITED`.
   - **LinguaChat sigue teniendo que documentar y declarar en Chile lo que le vende al MoR, es decir, el *payout*.**
   - Sin calificación de exportación, ese ingreso podría quedar afecto al 19 % sin poder trasladarlo, lo que sale del margen.
4. **La boleta de honorarios no corresponde.** Vender suscripciones es actividad comercial de 1.ª categoría (boleta o factura), no un servicio profesional de 2.ª categoría.

## 2. Estructura del negocio (recomendación para revisar con el contador)

| | Persona natural (1.ª categoría) | EIRL | **SpA** |
|---|---|---|---|
| Constitución | Inicio de actividades en el SII | Registro de Empresas y Sociedades («Tu Empresa en un Día») | Ídem |
| Costo | $0 | $0 (más FEA) | $0 (más FEA) |
| Responsabilidad | **Ilimitada** | Limitada | **Limitada** |
| Socios o inversión futura | No | No | **Sí** |
| Régimen posible | 14 D N°3 / 14 D N°8 / 14 A | ídem | ídem |
| KYC con procesadores | Persona (Polar y Paddle lo aceptan) | Empresa | Empresa (lo que más esperan) |
| Cuenta bancaria | Mezcla riesgosa con lo personal | Cuenta de empresa | Cuenta de empresa |

**Recomendación razonada (no decisión):**
- **SpA unipersonal** si se va a cobrar de forma sostenida: responsabilidad limitada, separa el dinero, es flexible para inversión y cuesta $0 constituirla.
- **Persona natural con giro** solo como paso rápido para validar las primeras ventas, aceptando la responsabilidad ilimitada.
- **Régimen candidato:** Pro Pyme General 14 D N°3.
  - Impuesto de Primera Categoría transitorio del **12,5 %** en 2025–2027 (Ley 21.755, Circular 53/2025).
  - PPM de **0,125 %** el año de inicio.
  - Alternativa: Pro Pyme Transparente 14 D N°8.
  - **Lo decide el contador según el tramo de impuesto global complementario y la reinversión.** No elegimos régimen automáticamente.

## 3. Obligaciones desde el primer cobro (resumen)

1. **Inicio de actividades** (F4415) dentro de 2 meses de comenzar la actividad, con domicilio acreditado (rol y comuna, o contrato de arriendo).
2. **Códigos de actividad candidatos:**
   - **582000** Edición de programas informáticos (afecto);
   - **631200** Portales web (afecto);
   - **854909** Otros tipos de enseñanza (no afecto) solo si el contador sostiene la exención.
3. **Documentos tributarios electrónicos:**
   - boleta electrónica (39/41) por cada venta directa a consumidor, enviada al SII en ≤ 1 h;
   - factura (33/34) a contribuyentes;
   - factura de exportación (110) solo con calificación de Aduanas;
   - factura de compra (46) por servicios recibidos del extranjero (cambio de sujeto).
4. **Mensual:** Registro de Compras y Ventas (RCV) y **F29** (IVA débito − crédito + PPM).
5. **Anual:** **F22** (abril) y declaraciones juradas según régimen (1948 o 1947; otras por confirmar).
6. **Patente municipal** en la comuna del domicilio (mínimo 1 UTM). Verificar si aplica microempresa familiar (MEF) u oficina virtual.
7. **Moneda extranjera:** registrar los ingresos en USD en pesos al tipo de cambio que indique el contador. Llevar contabilidad en USD requiere autorización del SII (Código Tributario, art. 18).
8. **Reembolsos:**
   - en venta directa, nota de crédito (61, o 112 si es exportación);
   - en el MoR, el reembolso lo hace el MoR. Definir cómo se refleja.
9. **Conservación documental:** 6 años como regla práctica (Código Tributario, arts. 17 y 200; confirmar tras la Ley 21.713).

## 4. Cuatro flujos de dinero, cuatro tratamientos

| # | Flujo | Quién vende al consumidor | Documento de LinguaChat | IVA en Chile |
|---|---|---|---|---|
| 1 | Venta directa a consumidor chileno (Flow o Mercado Pago, CLP) | LinguaChat | Boleta electrónica | 19 % (salvo exención educacional, en duda) |
| 1b | Venta directa a consumidor de EE. UU. | LinguaChat | Boleta afecta; con calificación de Aduanas, factura 110 + DUS/DUSSI | 19 % sin calificación; exento con ella |
| 2 | Venta a través del MoR | **El MoR** | **Ninguno** al consumidor | Lo cobra y entera el MoR (régimen simplificado, art. 35 A y siguientes) |
| 3 | *Payout* del MoR a LinguaChat (USD) | LinguaChat le vende o licencia al MoR | **Por definir:** factura 110 (si Aduanas califica) o factura afecta. La *reverse invoice* de Polar o la autofactura de Paddle **no reemplazan** el documento chileno (interpretación) | Sin calificación: posible 19 % a cargo de LinguaChat. Con calificación: exento. Requisito de «uso exclusivo en el extranjero» problemático si el MoR también vende en Chile |
| 4 | Comisiones del MoR, impuestos de venta retenidos y utilidad | — | Factura de compra (46) por las comisiones extranjeras | Cambio de sujeto. Revisar la **retención de impuesto adicional del 35 %** (Ley de la Renta, arts. 59 y 74). El IVA o *sales tax* que cobra el MoR no es ingreso ni gasto de LinguaChat |

**Implicación de diseño:** para la primera etapa, un MoR (Polar) simplifica los impuestos **ante los consumidores de EE. UU., la UE y Japón**, pero **no** resuelve la pregunta del flujo 3. Esa pregunta decide el margen real y debe contestarla el contador **antes** de cobrar.

## 5. Procesador de pagos

**Investigar primero: Polar.sh. Paddle, como alternativa con *sandbox* en paralelo.**

**Por qué Polar:**
- **Elegibilidad chilena confirmada en Stripe** (cuenta CL, `individual` o `company`, Express, acuerdo `recipient`, solo transferencias): sirve para una persona natural y para una futura SpA.
- **Estado del cliente por identificador externo:** el backend puede verificar la suscripción **sin base de datos propia**. Es lo que permite respetar hoy el contrato de `CLAUDE.md` (ver el plan de monetización, §6).
- **Pagos al vendedor:** retiro a demanda a una cuenta chilena **en CLP** (mínimo ≈ USD 40, comisión de cambio de hasta 1 %), sin la transferencia SWIFT de Paddle.
- **Sin precio a medida para planes de menos de US$10.**
- **Una *reverse invoice* por cada pago**, útil como respaldo contable.

**Lo que hay que confirmar por escrito con Polar antes de comprometerse:**
1. Que un tutor de idiomas por reglas no cae en la categoría restringida de *chatbots* de IA, o qué salvaguardas pide.
2. Que cobra y entera el **IVA chileno** a los consumidores (Paddle lo lista oficialmente; Polar no publica lista).
3. Que el alta de cuentas chilenas funciona hoy: la documentación de Stripe sobre pagos transfronterizos se contradice con la lista de Polar.

**Cuándo preferir Paddle:**
- si Polar rechaza el caso o no confirma el IVA chileno;
- si se quiere que el MoR conteste los contracargos (Paddle lo hace; en Polar no está documentado).

**Costos de Paddle:** pago mensual con mínimo de US$100, SWIFT de US$15 y precio a medida para planes de menos de US$10.

**Términos que hay que conocer:**
- Polar puede retener fondos hasta 120 días y hasta 9 meses tras el término (ley de Delaware).
- Paddle, hasta 6 meses (ley inglesa).
- Contracargos: US$15 en Polar; hasta US$20 en Paddle.

## 6. Marca

- **INAPI (Chile):**
  - 3 UTM por clase, ≈ $217.320 con la UTM de noviembre de 2026;
  - clases 9, 41 y 42 ≈ **$651.960**, más la publicación en el Diario Oficial.
  - **No se hizo la búsqueda:** el buscador tiene reCAPTCHA y no se elude. El procedimiento manual está en el briefing §8.
- **USPTO (EE. UU.):**
  - **0 resultados** para «LINGUACHAT» y variantes (consulta del 2026-11-02);
  - existe «LINGUACHET» cancelada (2021), en la clase 9 de idiomas;
  - el prefijo «LINGUA*» tiene 90 registros vivos, muchos en las clases 9/41/42 (campo concurrido).
- **Recomendación:** búsqueda profesional y solicitud a nombre de la entidad que vaya a explotar la marca. Sin esto, el nombre queda como **riesgo de publicación**, no como bloqueo del código.

## 7. Qué decide quién

| Decisión | Quién | Bloquea |
|---|---|---|
| Persona natural o SpA; régimen tributario; códigos de actividad | Propietario + contador | Cualquier cobro |
| ¿Exención educacional? ¿Calificación de exportación? ¿Documento hacia el MoR? | Contador (± consulta SII / Aduanas) | Precio y margen |
| Polar o Paddle; confirmaciones escritas | Propietario | Integración real (el *sandbox* no) |
| Marca | Propietario + abogado | Lanzamiento público con nombre |
