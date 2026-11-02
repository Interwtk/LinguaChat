# Preparación de la beta — estado al 2026-11-02 (bloque 1)

> **Veredicto: la beta NO está lista.** El núcleo educativo de ambos cursos funciona en local con evidencia. Faltan la autenticación real, la seguridad del tutor, la puerta de edad, la revisión legal y una publicación autorizada. Los criterios están en §3.

## 1. Rama y commits

| | |
|---|---|
| Clon | `C:\Users\Sebastian Gamboa\Music\LinguaChat-integration` |
| Rama | `beta/2026-11-es-for-en` (local, sin *upstream*, `pushurl` deshabilitado) |
| Base | `integration/local-p0-p5` @ `e656e04` (fase 7), que sigue intacta; etiqueta `recovery/p6-integration-e656e04` |
| `738617f` | registro de cursos y español Pre-A1 para angloparlantes |
| `e0b75b8` | se elimina el almacén de usuarios sin autenticación del backend; comprobaciones al día |
| (docs) | los documentos de este bloque |
| `main` remoto | `086323c` (sin cambios) |

**Para deshacer:**
- volver a `e656e04` (`git switch integration/local-p0-p5`); o
- revertir un commit concreto (`git revert <sha>`).

El progreso de un estudiante de español queda bajo IDs `es:`; si se revierte el código, esos datos se ignoran, no se corrompen. **No probado en un navegador con código revertido.**

## 2. Evidencia de pruebas (bloque 1)

### 2.1 Ciclos completos (cuentan por *exit code*)
Resultados en la sección «Ciclos r1 y r2» al final de este documento.

### 2.2 Batería del curso español (`check-es-course`, 343 comprobaciones)
- **A. Contenido:**
  - 12 episodios válidos;
  - las 12 capacidades del brief se practican en producción abierta;
  - **las 47 respuestas modelo pasan por su propio evaluador**;
  - cada episodio tiene recuerdo sin ayuda y transferencia;
  - la respuesta correcta no siempre está en la misma posición;
  - no falta ninguna copia.
- **B. Evaluador:**
  - unas 100 frases (43 correctas, 43 erróneas, 4 fuera de alcance y una decena de casos de tildes y copia): variantes regionales (11), errores típicos de angloparlantes (26), género y concordancia, irregulares (el mapa, la mano), el/un agua, ser/estar (7), tildes (6), respuestas parciales, en inglés, fuera de alcance (no evaluable, sin corrección) y copias;
  - cada tipo de error tiene su explicación.
- **C. Recorrido sintético:**
  - una estudiante angloparlante completa los 12 episodios en el orden diseñado, a lo largo de 12 días simulados;
  - comete el error típico, recibe la corrección y luego acierta;
  - el XP se paga una vez por episodio aunque se reintente o haya otra pestaña;
  - el Jardín recibe las palabras una vez;
  - «me llamo» llega a `can_use`;
  - repetir un episodio no vuelve a dar recompensa.
- **D. Aislamiento:**
  - el plan inglés y el apoyo inicial inglés no cambian tras todo el recorrido español;
  - ningún repaso español aparece en inglés ni al revés;
  - el resumen de «Tú» separa los cursos;
  - los errores ingleses no añaden apoyo en español.
- **E. Restricciones de acceso:**
  - los episodios `es:` abren;
  - un ID desconocido se rechaza;
  - A1 inglés sigue cerrado;
  - el español solo se ofrece con la interfaz en inglés.
- **F. Migración:**
  - un modelo previo a los cursos conserva lo inglés y empieza el español desde cero;
  - un curso guardado desconocido, o no permitido, se lee como inglés;
  - la clave está en el espacio de nombres de la cuenta.
- **Prueba de mutación:** al romper la comprobación de género, fallan 5 casos; al hacer «aprobado» un tipo de evaluación desconocido, falla 1. La batería detecta regresiones reales.

### 2.3 Navegador real (banco visual, datos sintéticos, Chromium del panel)
- **Lección `es:hola` completa:**
  - escena, modelo, comprensión, ordenar palabras;
  - hueco con error («llama») → «Almost — the word is: Me llamo Ana» → acierto;
  - respuesta libre «Me llamo es Ana» → tarjeta de corrección con la explicación del calco;
  - acierto con una variante propia («hola, soy Ana»);
  - variación sin tilde «buenos dias, soy Ana» → «Correct! … buenos días, soy Ana»;
  - recuerdo sin ayuda → cierre «+40 XP».
  - El estado se reanudó tras una recarga.
- **`lang` correcto:** la línea objetivo tiene `lang="es"`, las explicaciones `lang="en"` y el campo de entrada `lang="es"`.
- **Modelo guardado:** todo con prefijo `es:` (episodio, 4 ítems, `es:introduce_self`, error recurrente `es:es_llamo_es`).
- **Hoy del curso:** progreso 1/12 y «What’s your name?» como siguiente lección. A 375 px (oscuro) y 1440 px (claro): **sin desbordamiento horizontal**.
- **Hoy inglés:** el selector aparece con la interfaz en inglés y **no** con la japonesa (no se ofrece un curso sin copia en ese idioma).
- **Defectos encontrados y corregidos durante la prueba:**
  - `{name}` aparecía sin sustituir en el texto del hueco;
  - la opción correcta siempre era la primera en el contenido del curso español (en el inglés Pre-A1, que está congelado, sigue ocurriendo: queda documentado, sin cambios).

### 2.4 No probado (y por qué)
- **Autenticación real** (registro, inicio de sesión, recuperación, cambio de cuenta, borrado): no hay entorno Supabase de prueba autorizado. Bloqueado.
- **La app completa con sesión real en el navegador:** sin autenticación local. Se usó el banco visual, que renderiza los componentes reales con un contexto sintético.
- `check:github-integration`: falta `jq` en local; corre en CI.
- **Revisión del español por un hablante nativo:** no hecha.
- **Preview de Vercel y producción:** sin autorización.
- **Eficacia del aprendizaje:** solo una simulación. **No demuestra que una persona aprenda.**

## 3. Criterios de beta lista (brief §12)

| Criterio | Estado | Evidencia / bloqueo |
|---|---|---|
| Registro e inicio de sesión funcionales | ❌ No verificado | Sin entorno de prueba autorizado |
| Recuperación de cuenta | ❌ No verificado | Ídem (plantillas de correo existen: PR #131) |
| Progreso persistente | ✅ Local | Registro de progreso con integridad 29/29 (+1 que solo corre en local) y reanudación en el navegador |
| Protección entre cuentas | ✅ Local / ❌ en la nube | *Lease* y espacio de nombres `lc2-` probados; RLS y sincronización no habilitadas |
| Curso inglés inicial utilizable | ✅ | Pre-A1, 17 episodios (existente) |
| Curso español inicial utilizable | ✅ Local | §2.2 y §2.3; falta la revisión nativa |
| Evaluación apropiada por idioma | ✅ | Evaluador español separado, sin escalar al evaluador inglés |
| Explicaciones en el idioma seleccionado | ✅ | Español: inglés; inglés: 8 idiomas |
| Repasos y personalización | 🟡 | Repasos por curso y recuerdo en cada episodio. Sin sesión diaria ni misiones en español |
| Interfaz móvil y escritorio | 🟡 | Banco a 375 y 1440 px; falta la app completa con sesión |
| Seguridad de contenido | ❌ | Especificación en `age-and-safety-policy.md`; no implementada |
| Restricción de edad | ❌ | Especificación; no implementada |
| Documentos legales revisados | ❌ | Borradores; falta la revisión jurídica |
| Licencias conocidas de activos | 🟡 | Inventario hecho; **Chatto sin documentar** |
| Precios transparentes si hay pago | n/a | Sin pago. La página de Planes tiene funciones Premium inexistentes: **corregir** |
| Cancelación y suscripciones verificadas | n/a | Sin pago |
| Sin secretos en el cliente | ✅ | Garantías 16/16 (búsqueda de secretos) |
| Sin funciones premium falsas | ❌ | La tarjeta Premium de Planes (ver arriba) |
| Sin niveles cerrados anunciados como abiertos | ✅ | A1–C2 `available:false`; garantías 16/16 |
| Pruebas de recuperación y reversión | 🟡 | Reversión de P3 probada en la fase 7; reversión por curso no probada en un navegador |
| Comportamiento seguro ante errores del proveedor | ✅ | Sin proveedor; `provider_policy` y respaldo local probados |
| Revisión de accesibilidad | 🟡 | `aria` y `role` en el selector y la lista; sin auditoría completa |
| QA de producción o Preview autorizado | ❌ | Sin autorización |

## 4. Plan de noviembre (objetivos, no autorización de despliegue)

| Ventana | Resultado | Estado |
|---|---|---|
| **1–7 nov.** | Separar idioma objetivo y auxiliar; ruta vertical de español; inventario legal; alcance | ✅ Hecho en local, **adelantado**: el español Pre-A1 completo ya está construido. Falta la decisión de integración en GitHub |
| **8–14 nov.** | Puerta de edad; filtro de seguridad en el servidor y pruebas adversariales (en, es, ja, ar); corregir la tarjeta Premium; revisión nativa; repaso diario español; TTS español; borrado de cuenta y exportación | Pendiente |
| **15–21 nov.** | Autenticación y sesiones reales en un entorno autorizado; QA en navegadores con sesión real; migraciones; Preview; revisión legal; diseño de derechos premium (sin cobrar) | Pendiente; depende de autorizaciones |
| **22–30 nov.** | Defectos críticos; piloto con consentimiento; lista de verificación final; publicación limitada **solo con autorización** | Pendiente |

## 5. Plan breve de integración en GitHub

1. **Decisiones previas:** correo del autor; los `.diff` de auditoría; actualizar `CLAUDE.md` y `.ai/` dentro del mismo PR, según el protocolo.
2. *Push* de `integration/local-p0-p5` y PR en borrador contra `main`, como se preparó en la fase 7.
3. *Push* de `beta/2026-11-es-for-en` y un **segundo PR en borrador apilado** sobre el primero, para revisar por separado P0–P5 y la beta.
4. **Efectos remotos:**
   - *push* → Preview de Vercel por cada commit;
   - PR → `frontend`, `backend` y `guards` (+ `evidence` y `qa-cycle` si no es borrador);
   - nada se fusiona solo (detalle en el informe de la fase 7).
5. *Merge* en orden (P0–P5, luego beta) solo tras dos ciclos limpios en CI y la revisión de la Preview.

**Nada de esto se ha ejecutado.**

## Ciclos finales (exit codes)

**Dos ciclos consecutivos e idénticos** sobre el head `69fb86f` (árbol `764d942`, sin cambios entre ambos, `dirty=0` antes y después):

| Suite | Ciclo f1 | Ciclo f2 |
|---|---|---|
| frontend `check:all` (101 pasos, por *exit code*) | 101/101 | 101/101 |
| `npm run build` | ok | ok |
| `check:i18n` (8 idiomas) | ok | ok |
| Foundry b1/b2/c1/c2 y a2-structure | 5/5 | 5/5 |
| integridad del registro de progreso (completa) | 29/29 (+1 que solo corre en local, igual que en la fase 7) | 29/29 |
| política de adaptación | 10/10 | 10/10 |
| alcance de la nube (git ls-files, autoprueba y pruebas) | ok | ok |
| backend `compileall` | ok | ok |
| backend `pytest` | 1243 passed / 28 skipped | 1243 passed / 28 skipped |
| e2e HTTP con uvicorn real: tutor 4/4, continuidad 5/5 | ok | ok |
| plantillas de correo | ok | ok |
| garantías del producto (A1–C2 cerrados, Pre-A1 intacto contra `main`, `CLOUD_PREFERENCES_RELEASED=false`, evaluador conectado, banco fuera del bundle, sin secretos, sin CRLF) | 16/16 | 16/16 |
| `check:github-integration` | BLOQUEADO (falta `jq`; corre en CI) | BLOQUEADO |

**Historia del conteo (sin ocultar fallos):**
- **`738617f`, ciclo 1: 99/101.**
  - La regex estructural del conteo de palabras de Hoy no aceptaba el filtro por curso: se adaptó conservando su intención.
  - La matriz de preparación generada quedó desfasada: se regeneró con `--write`.
- **`e0b75b8`, ciclos r1 y r2: 100/101 + alcance de la nube en rojo.** La descripción de la nueva prueba del backend nombraba al proveedor de autenticación, y el control de alcance lo rechazó con razón. Se cambió la redacción (`edee95c`).
- **El conteo de dos ciclos se reinició** tras cada corrección.
