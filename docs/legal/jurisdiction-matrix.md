# Matriz de jurisdicciones — LinguaChat beta (BORRADOR)

## Criterio de mercados habilitados (fase 3, 2026-11-03)

Ningún mercado está habilitado comercialmente. **No se promete cumplimiento legal mundial.** Antes de cualquier beta comercial, la política de privacidad y los términos deben revisarlos profesionales.

| Mercado | Beta gratuita limitada (adultos, por invitación) | Venta | Condición para habilitar la venta |
|---|---|---|---|
| **Chile** | Posible tras la QA real de autenticación y con el contacto de privacidad configurado | **Pendiente de revisión legal y tributaria** | Contador (inicio de actividades, régimen, documentos de venta), revisión legal (Ley 19.628 y Ley 21.719 desde el 1-12-2026, Ley 19.496 del consumidor), procesador aprobado por escrito |
| **Estados Unidos** | Posible con las mismas condiciones | **Pendiente de revisión de privacidad, consumidores y comercialización** | Revisión de privacidad estatal (CCPA/CPRA y otras), renovaciones automáticas (ROSCA y leyes estatales), COPPA (solo adultos), impuestos indirectos vía MoR |
| **UE/EEE** | No | **No habilitar** | Representante art. 27 RGPD, base jurídica y transferencias, AI Act art. 50 si hay IA generativa, IVA OSS vía MoR, derecho de desistimiento |
| **Japón** | No | **No habilitar** | Aviso APPI y transferencias, Ley de Transacciones Comerciales Especificadas (表示), consumo vía MoR |
| Resto | No | No | Caso por caso |

El bloqueo técnico por país no existe todavía. Mientras tanto, la beta se distribuye **por invitación**, no por registro abierto.


> **BORRADOR PARA REVISIÓN JURÍDICA. NO ES ASESORÍA LEGAL.**
> - **Fecha de consulta:** 2026-11-01.
> - **Fuentes:** primarias u oficiales cuando se pudieron obtener; `[SEC]` = fuente secundaria (despacho, prensa), usada solo para ubicar o corroborar.
> - **«NO VERIFICADO»:** no se pudo confirmar contra una fuente primaria.
> - **Supuestos del producto:**
>   - Operador en Chile, sin entidad legal todavía.
>   - Web en Vercel; backend FastAPI sin base de datos; Supabase Auth (correo y contraseña) opcional.
>   - El progreso vive en el navegador (`localStorage`).
>   - Tutor local por reglas, sin proveedor generativo activo.
>   - Beta solo para mayores de 18 años, freemium, sin cobros activos.
>
> **Conclusión operativa:** hoy **no** podemos afirmar que LinguaChat pueda comercializarse legalmente en ninguna de estas jurisdicciones. La beta **gratuita** para adultos es viable con las medidas de abajo. Cobrar requiere resolver los bloqueos marcados.

**Leyenda de la columna «Medida implementada»:**
- **SÍ:** existe en el código o en un documento.
- **PARCIAL:** existe en parte.
- **NO:** no existe.
- **DISEÑO:** solo está descrita.

## Chile

| Obligación | Fuente oficial | Aplicabilidad | Estado actual | Medida implementada | Bloqueo | Revisión profesional |
|---|---|---|---|---|---|---|
| Ley 21.719 (nuevo régimen de datos, Agencia, derechos ARCOP+, brechas) | https://www.bcn.cl/leychile/navegar?idNorma=1209272 | Sí (responsable establecido en Chile) | Publicada 13-12-2024; **vigencia 1-12-2026** (art. 1° transitorio, verificado). Boletín 18.623-07 propone postergar a 2027: **es un proyecto, no ley** (aprobado en general en comisión, 20-10-2026) | DISEÑO: aviso de privacidad (borrador), flujo de derechos y borrado (pendiente en producto) | **Sí** para cobrar a usuarios chilenos desde 1-12-2026 | Sí; revisar el boletín justo antes de lanzar |
| Ley 21.719, transferencias internacionales (arts. 27–29) | Ídem | Sí (Vercel y Supabase en EE. UU.) | Desde 1-12-2026; lista de adecuación de la Agencia NO VERIFICADA | NO: faltan los DPA firmados | Condicional | Sí |
| Ley 19.628 (régimen vigente hasta 21.719) | https://www.bcn.cl/leychile/navegar?idNorma=141599 | Sí | Vigente | PARCIAL: borrador de aviso; falta el consentimiento informado en el registro | Sí (base) | Sí |
| Ley 19.496 + Ley 21.398: retracto 10 días en contratos a distancia; confirmación art. 12 A | https://www.bcn.cl/leychile/navegar?idNorma=61438 · https://www.bcn.cl/leychile/navegar?idNorma=1170235 | Sí (B2C) | Vigente; texto consolidado NO VERIFICADO | DISEÑO (plan de monetización) | **Sí** para cobrar | Sí: cómo aplica a una suscripción de acceso inmediato |
| Decreto 52/2024 (exclusiones de retracto; aviso previo destacado) | https://www.diariooficial.interior.gob.cl/publicaciones/2024/08/27/43935/01/2535265.pdf | Sí, si se excluye el retracto | En vigor 28-02-2025 [SEC] | NO | Sí, si se usa la exclusión | Sí |
| IVA servicios (DL 825; Ley 21.420); posible exención educativa; exportación de servicios | https://www.sii.cl/preguntas_frecuentes/iva_serv_digitales/001_200_7767.htm | Sí (vendedor chileno) | Tratamiento exacto NO VERIFICADO | NO | **Sí** (inicio de actividades antes de cobrar) | Sí (contador) |
| Proyecto de ley de IA (Boletín 16.821-19) | https://www.senado.cl | Solo si se vuelve ley | **PROYECTO**, en el Senado | n/a | No | Monitorear |
| Ley 17.336, art. 71 B (fragmentos breves con cita) | https://www.bcn.cl/leychile/navegar?idNorma=28933 | Sí | Vigente | SÍ: política de contenido original (`content-copyright-policy.md`) | No | Sí |

## Estados Unidos

| Obligación | Fuente oficial | Aplicabilidad | Estado actual | Medida implementada | Bloqueo | Revisión profesional |
|---|---|---|---|---|---|---|
| COPPA (16 CFR 312, enmiendas 2025) | https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312 | Condicional: solo si el servicio se dirige a menores de 13 o hay conocimiento real | Cumplimiento general desde **22-04-2026** | DISEÑO: puerta de edad neutral y política de menores (`age-and-safety-policy.md`); **no implementada en el registro** | No, si el diseño adulto se mantiene | Sí (análisis de «dirigido a niños»: hay una mascota animada) |
| FTC Act §5 (prácticas engañosas, *dark patterns*) | https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title15-section45 | Sí | Vigente | PARCIAL: la beta no anuncia IA generativa ni niveles cerrados. **Pendiente:** la página de precios lista funciones Premium inexistentes | Sí (base) | Sí |
| ROSCA (renovación automática: divulgación, consentimiento expreso, cancelación simple) | https://uscode.house.gov/view.xhtml?path=/prelim@title15/chapter110 | Sí, si se cobra | Vigente | DISEÑO (plan de monetización) | **Sí** para cobrar | Sí |
| Regla FTC «Click-to-Cancel» 2024 | https://www.govinfo.gov/content/pkg/FR-2026-03-13/html/2026-04952.htm | — | **ANULADA** (8.º Circuito, 8-07-2025); ANPRM 13-03-2026; sin regla nueva [SEC] | Diseñar igual: cancelar tan fácil como suscribirse | No | Monitorear |
| California Automatic Renewal Law (AB 2863) | https://leginfo.legislature.ca.gov (el sitio respondió 403) | Sí, sin umbral | Operativa 1-07-2025 [SEC] | DISEÑO | **Sí** para cobrar en CA | Sí |
| CCPA/CPRA | https://cppa.ca.gov/regulations/cpi_adjustment.html | Probablemente no (umbral de ingresos US$26,625M, o 100k consumidores, o venta de datos) | Vigente | SÍ: sin píxeles ni venta de datos (no hay SDK de analítica en `package.json`) | No (a escala beta) | Sí |
| California SB 243 (chatbots acompañantes) | https://california.public.law/codes/business_and_professions_code_section_22601 [SEC] | Probablemente no (tutor por reglas, no acompañante) | Vigente 1-01-2026 [SEC] | SÍ: no se presenta como acompañante; Chatto no conversa | No hoy; reevaluar con IA generativa | Sí, si se añade IA |
| California AB 1043 (señales de edad) | [SEC] | Sobre todo apps instaladas | Operativa 1-01-2027 [SEC] | n/a (web) | No | Sí |
| Leyes estatales de privacidad (~20) | Varias | Probablemente bajo umbral | Varias | SÍ: no se venden ni comparten datos | No | Sí |

## Unión Europea / EEE

| Obligación | Fuente oficial | Aplicabilidad | Estado actual | Medida implementada | Bloqueo | Revisión profesional |
|---|---|---|---|---|---|---|
| RGPD: bases legales, aviso art. 13, registro art. 30, DPA art. 28 | https://eur-lex.europa.eu/eli/reg/2016/679/oj | Sí, si se ofrece a la UE | Vigente | PARCIAL: borrador de aviso | **Sí** para la UE | Sí |
| RGPD art. 27: representante en la UE | Ídem | Probable (tratamiento no ocasional) | Vigente | NO | **Sí** para la UE | Sí |
| Transferencias (cap. V); **Chile sin decisión de adecuación** (verificado: la lista tiene 17 entradas, sin Chile) | https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en | Sí | Vigente | NO (faltan SCC/DPF con los proveedores) | Condicional | Sí |
| ePrivacy art. 5(3): `localStorage` sujeto a consentimiento salvo lo estrictamente necesario | https://eur-lex.europa.eu/eli/dir/2002/58/oj · EDPB 2/2023 | Sí | Vigente | PARCIAL: hoy solo hay claves funcionales (progreso, sesión), sin analítica. **Pendiente:** Google Fonts desde CDN externo (IP al tercero) | Sí, si se añade algo no esencial | Sí |
| AI Act art. 50 (transparencia) | https://eur-lex.europa.eu/eli/reg/2024/1689/oj · Omnibus https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng | Solo si es un «sistema de IA»; un tutor por reglas probablemente no lo es | Aplica desde **2-08-2026**; el Omnibus (Reg. 2026/1744, adoptado) no lo pospuso, salvo 50(2) [SEC] | SÍ: no se presenta como IA generativa | No hoy | Sí (anexo III punto 3: evaluación educativa y ubicación) |
| Directiva 2011/83: desistimiento 14 días, consentimiento de inicio inmediato | https://eur-lex.europa.eu/eli/dir/2011/83/oj | Sí, si se cobra | Vigente | DISEÑO | **Sí** | Sí |
| Botón de desistimiento (art. 11a, Dir. 2023/2673) | https://eur-lex.europa.eu/eli/dir/2023/2673/oj | Sí, si se cobra | Desde 19-06-2026 [SEC] | DISEÑO | **Sí** | Sí |
| IVA OSS no-Unión (sin umbral para vendedores de fuera de la UE) | https://vat-one-stop-shop.ec.europa.eu | Sí, si se cobra | Vigente | DISEÑO: usar un *Merchant of Record* | **Sí** | Sí (fiscal) |
| DSA | https://eur-lex.europa.eu/eli/reg/2022/2065/oj | Dudoso (sin contenido público de usuarios) | Vigente | SÍ: la beta no tiene contenido público de usuarios | Condicional | Sí |

## Japón

| Obligación | Fuente oficial | Aplicabilidad | Estado actual | Medida implementada | Bloqueo | Revisión profesional |
|---|---|---|---|---|---|---|
| APPI (aviso de propósito, seguridad, brechas, derechos) | https://laws.e-gov.go.jp/law/415AC0000000057 · https://www.ppc.go.jp/en/legal/ | Sí, si hay usuarios en Japón | Vigente; enmienda 2026 [SEC] NO VERIFICADA | NO (falta el aviso en japonés) | **Sí** para Japón | Sí |
| APPI art. 28 (terceros en el extranjero: EE. UU., Chile) | Ídem | Sí | Vigente | NO | **Sí** | Sí |
| Ley de Transacciones Comerciales Específicas (表記 del vendedor + pantalla final de 6 elementos) | https://laws.e-gov.go.jp/law/351AC0000000057 | Sí, si se cobra | Vigente (pantalla final desde 1-06-2022) | NO | **Sí** | Sí |
| Impuesto al consumo (JCT) B2C digital | https://www.nta.go.jp/english/taxes/consumption_tax/05.htm | Sí, si se cobra | Vigente | DISEÑO: *Merchant of Record* | Condicional | Sí (fiscal) |
| Ley de Promoción de IA (2025) | https://laws.e-gov.go.jp | Baja (sin sanciones) | En vigor 1-09-2025 [SEC] | n/a | No | Bajo |

## Conclusiones para decidir

1. **Beta gratuita, solo adultos, sin datos de pago:** viable en Chile y EE. UU. con estas condiciones:
   - aviso de privacidad y términos revisados;
   - puerta de edad;
   - correo de contacto;
   - borrado de cuenta.
   - **UE y Japón:** no abrir hasta tener representante en la UE y el aviso APPI.
2. **Cobros:** bloqueados por:
   - entidad legal e inicio de actividades en el SII;
   - proveedor de pago aprobado;
   - textos de retracto y renovación (Chile, California, UE);
   - pantalla final en japonés si se vende en Japón.
   - Un *Merchant of Record* resuelve la mayor parte del IVA y del impuesto de ventas, **no** las obligaciones de privacidad ni de consumidor.
3. **1-12-2026:** la Ley 21.719 entra en vigor **un día después** de la fecha objetivo de la beta. La beta debe lanzarse ya alineada con 21.719.

Detalle completo, con las 14 dudas no verificadas: `docs/legal/research/2026-11-01-regulatory-research.md`.
