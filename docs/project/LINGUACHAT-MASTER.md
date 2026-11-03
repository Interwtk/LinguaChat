# LINGUACHAT — MAESTRO DEL PROYECTO

> **Documento vivo.** Se actualiza al terminar cada bloque significativo.
> - **Última actualización: 2026-11-03, fin de la Fase 3** («Cerrar los bloqueos de lanzamiento, preparar las primeras ventas y garantizar la entrega de informes»). El §0 resume el estado actual; los §1–§18 conservan el detalle de la fase 2, con las correcciones marcadas.
> - Regla: nada se marca «listo» si solo está diseñado. Cada afirmación cita su evidencia.
>
> **Relación con el protocolo de `CLAUDE.md`:**
> - `.ai/STATE.md`, `.ai/HANDOFF.md` y `.ai/TASKS.md` son los registros del flujo autónomo en la nube; `TASKS.md` funciona como lock. **Este maestro no los edita.** Están desactualizados respecto de `main`, y su actualización viaja en el PR según el protocolo.
> - Las rutinas y automatizaciones de LinguaChat siguen **pausadas**: no se reactivó ninguna.
> - `CLAUDE.md` **no se editó**. La propuesta de cambio mínimo, pendiente de autorización, está en `docs/project/claude-md-multilingual-proposal.md`.

---

## 0. Estado al cierre de la Fase 3 (2026-11-03)

**Rama y commit.** `beta/2026-11-es-for-en`, solo local; la cabeza exacta está en `docs/release/2026-11-beta-readiness.md` § Ciclos. Propuesta aparte: `proposal/pre-a1-option-order` @ `7e6d48e`. Respaldos: etiquetas `recovery/*` y las ramas anteriores, intactas.

**Entrega de informes (permanente).** `python scripts/export_reports.py --label <fase> --report <informe>` escribe en `Descargas\LinguaChat-Reportes-ChatGPT\<fase>\`: TXT, ZIP, manifiesto con SHA-256 y verificación.

| Área | Estado |
|---|---|
| **Inglés** | Pre-A1 completo y congelado. Defecto reproducido: la opción correcta aparece primera en 21/21 preguntas (también en 26/26 de A1 y 14/18 de la prueba de nivel). Corrección lista en la rama de propuesta, **pendiente de tu aprobación**. A1 construido y **cerrado** (no aprobado pedagógicamente) |
| **Español** | Pre-A1, 12 lecciones, sesión, misiones, chat y voz. Evaluador probado con 79 respuestas nuevas: 3 correcciones falsas corregidas. **Sin revisión nativa** (protocolo en `docs/curriculum/es-pre-a1-review.md`) |
| **Autenticación** | 10 recorridos **simulados** en verde (`check-auth-journeys`). **Real: no probada** (no hay entorno). Procedimiento en `docs/release/2026-11-auth-journeys.md` |
| **Seguridad** | Filtro medido con 174 frases nuevas: ≈40 % de detección sin ajustar y 100 % de regresión tras corregir. **No cumple ≥95 % en frases nuevas** (declarado). Bloqueo de edad por dispositivo. `/chat` sin autenticación en el servidor |
| **Privacidad** | La memoria del servidor caduca a las 24 h, no se comparte sin identificador y se borra con «Borrar mis datos». Textos actualizados. Revisión profesional pendiente |
| **SII** | Afirmaciones verificadas con fuentes oficiales (`docs/business/research/2026-11-03-sii-official-verification.md`). Novedad: Flow y Mercado Pago exigen el inicio de actividades desde el 2-ene-2026. **Sin inicio de actividades, sin régimen y sin entidad** (decisiones tuyas y del contador) |
| **Procesador** | Polar primero, condicionado a: la respuesta escrita sobre las cuentas `recipient` de Stripe, la AUP (IA y chatbots restringidos) y la comisión de 5 % + 50¢. Paddle como alternativa. **Nada activado** (`docs/business/payment-processor-checklist.md`) |
| **Premium** | **Práctica adaptativa adicional construida y probada, apagada y no a la venta.** El servidor decide con un pase firmado, máximo 3 bloques al día; la Preview lo fuerza apagado |
| **Integridad** | 30/30 reproducible desde git (`check:ledger-rollback`), añadido a CI |

**Decisiones pendientes del propietario** (actualiza el §11):

| # | Decisión | Bloquea |
|---|---|---|
| 1 | Autorizar el *push* y los dos PR en borrador (`docs/release/2026-11-pr-procedure.md`); correo `noreply` | Preview, CI y beta |
| 2 | Crear el Supabase **de prueba** y entregar la URL y la clave pública para Preview | Autenticación real y beta externa |
| 3 | Aprobar la corrección del orden de opciones en Pre-A1 (rama de propuesta) | Calidad del inglés |
| 4 | Aprobar el cambio de `CLAUDE.md` (verificar el JWT con JWKS) | Atar Premium y `/chat` a la cuenta |
| 5 | Correo de privacidad y nombre del operador | Beta pública |
| 6 | Derechos de Chatto | Publicación |
| 7 | Revisión nativa del español y revisión legal (CL y US) | Beta pública |
| 8 | Contador (preguntas 1–36) e inicio de actividades | Cualquier cobro |
| 9 | Escribir a Polar y Paddle (preguntas «escrito») y abrir el *sandbox* | Integración de pagos |
| 10 | Aceptar o no la cobertura medida del filtro para la beta limitada | Beta externa |
| 11 | Apertura de inglés A1 | Ese contenido |

**Riesgos principales:**
- autenticación real sin probar;
- el filtro de seguridad no detecta frases nuevas (≈40 %);
- `/chat` y el pase Premium son al portador;
- el español no tiene revisión nativa;
- la elegibilidad de Polar sin confirmar;
- la dependencia de un contador para emitir los primeros documentos.

**Meta del 15 de noviembre:**
- **Beta gratuita, limitada y por invitación**, solo si se cumplen tres condiciones: decisiones 1 y 2 tomadas, los 10 recorridos reales de autenticación aprobados en Preview y el contacto de privacidad (decisión 5) configurado.
- **Si falta algo:** solo una prueba interna.
- **Nunca cobros** antes de 8–9.

**Del 16 al 30:**
- práctica extra en inglés;
- persistencia del contador Premium;
- emisión del pase con el *sandbox* del procesador;
- más español;
- A1 si se aprueba;
- mejoras del tutor y la retención.

**Próximo paso:** tu respuesta a las decisiones 1–3. Con 1 y 2 ejecuto el procedimiento de PR y los 10 recorridos reales.

## 1. Visión del producto
- **Qué es:** una plataforma multidioma de práctica conversacional. El estudiante elige qué idioma aprender. Un solo motor educativo.
- **Lingua** es la única tutora; **Chatto**, la mascota.
- **Objetivo:**
  - beta limitada, gratuita y solo para adultos hacia el **15-11-2026**;
  - desarrollo continuo del 16 al 30;
  - preparación de las primeras ventas sin incumplir obligaciones legales ni tributarias.

## 2. Estado técnico (rama y commits)

| Elemento | Valor |
|---|---|
| Clon | `C:\Users\Sebastian Gamboa\Music\LinguaChat-integration` |
| Rama de trabajo | `beta/2026-11-es-for-en` (local, sin *upstream*, *push* deshabilitado) |
| Puntos de recuperación | `recovery/p6-integration-e656e04` (P0–P5) · `recovery/beta-block1-ee50e1a` (bloque 1) |
| Último commit de código | `f9f77b5` (dos ciclos limpios); antes `d603ef2` (derechos inactivos y documentos) y `793f3ee` (QA en navegador) |
| `main` remoto | `086323c` (sin cambios) |
| Bundle de entrada | 760,5 kB de un presupuesto de 850 (`check-bundle-boundaries`) |
| `check:all` | **104 pasos** (P6 100 + `check-es-course`, `check-age-gate`, `check-es-session`, `check-learner-data`) |

## 3. Qué funciona hoy (en la rama local)

**Inglés:**
- Pre-A1 (17 episodios);
- sesión diaria;
- misiones;
- chat local;
- voz;
- 8 idiomas de interfaz.

**Español para angloparlantes:**
- Pre-A1 (12 episodios, 136 pasos);
- **sesión diaria** (repaso, lección, reintento de error, transferencia y misión);
- **3 misiones**;
- **chat de práctica** con reglas, honesto sobre lo que no entiende;
- **voz del dispositivo** (es-ES, es-MX, es-US, es-419);
- evaluador local de español.

**Común a ambos cursos:**
- selector de curso;
- progreso separado por curso (`es:`);
- pregunta de edad;
- **seguridad del tutor en el servidor**;
- **descargar y borrar los propios datos**;
- **planes honestos**.

**Preparado, inactivo:** núcleo de derechos premium (`app/billing/entitlements.py`), sin ruta.

## 4. Idiomas
- **Enseñados:** inglés y español.
- **Auxiliares:**
  - del curso de inglés: en, es, pt, fr, it, de, ja, ar;
  - del curso de español: solo en (no se ofrece en otros idiomas).

## 5. Currículos

| Curso / nivel | ¿Abierto? |
|---|---|
| Inglés Pre-A1 (17) | Sí (congelado) |
| Inglés A1 (21) | **No** (decisión del propietario, issue #101) |
| Inglés A2–C2 | No |
| Español Pre-A1 (12) | Sí, en la rama local. **Sin revisión nativa: no validado** |
| Español A1+ | No existe |

## 6. Seguridad y edad
- **Seguridad del tutor:**
  - `ai/safety.py` en `/chat` (inglés y español), antes de cualquier motor o memoria, y también sobre la respuesta;
  - 164 pruebas en en/es/ja/ar;
  - solo registra la categoría.
  - **Límites:** reglas; no entiende ironía ni manipulación de varios turnos (`docs/legal/age-and-safety-policy.md`).
- **Edad:**
  - pregunta neutral de tres tramos, sin fecha de nacimiento;
  - menor de 18: sin cuenta, con una marca de 24 h;
  - adulto: solo «18_plus»;
  - las cuentas existentes la responden una vez.
  - **No equivale a verificación de edad ni a cumplimiento de COPPA por sí sola.**
- **Hallazgos de seguridad corregidos:**
  - `POST /user` sin autenticación (bloque 1);
  - la política de privacidad decía que los mensajes del chat no se guardan en el servidor, pero en realidad se guardan 8 turnos en memoria (corregida).

## 7. Monetización
- **Estado: sin cobros, sin proveedor, sin credenciales.**
- **Recomendación:** beta gratuita.
- **Primer Premium honesto posible:** «práctica extra» e «informe de progreso». Inglés A1 solo tras su apertura.
- **Procesador a investigar primero:** **Polar** (persona natural chilena admitida vía Stripe Connect Express; pagos en CLP; estado del cliente sin base de datos propia). Paddle como alternativa con *sandbox*.
- **Por confirmar por escrito con Polar:** la clasificación de un tutor por reglas y el IVA chileno.
- **Derechos premium:** el núcleo está probado. Para activarlo falta el cambio mínimo de contrato (verificar el JWT con JWKS públicas) y autorización.
- Detalle: `docs/business/monetization-plan.md`.

## 8. SII y formalización (Chile)
- **No se ha constituido nada ni iniciado actividades.**
- **Hechos clave:**
  - un SaaS desde Chile parte **afecto al 19 %** de IVA, aun vendiendo al extranjero, salvo calificación de exportación de Aduanas;
  - la exención educacional está en duda;
  - **el MoR no elimina el IVA ni la renta en Chile**: el pago que hace el MoR se documenta y puede quedar afecto;
  - Paddle y Polar están inscritos en el registro de IVA digital del SII;
  - la boleta de honorarios no corresponde.
- **Recomendación a revisar:** SpA unipersonal; Pro Pyme 14 D N°3; códigos 582000 o 631200.
- **Documentos:**
  - `docs/business/chile-tax-and-commercial-compliance.md`;
  - `docs/business/accountant-handoff.md` (26 preguntas concretas).

## 9. Privacidad, copyright y legal
- **Borradores contrastados con el código el 2026-11-02:**
  - privacidad: memoria de 8 turnos, edad, registros de seguridad, exportar y borrar, voces;
  - términos: chat de práctica y datos;
  - edad y seguridad: implementado más límites;
  - copyright: licencias de dependencias, búsqueda en USPTO.
- **Pendiente:**
  - revisión jurídica;
  - contacto de privacidad (`VITE_PRIVACY_CONTACT_EMAIL`);
  - **derechos de Chatto (bloqueo de publicación)**;
  - búsqueda de marca en INAPI (manual, tiene reCAPTCHA);
  - borrado automatizado de la cuenta de acceso (requiere un cambio de contrato).
- **Fechas clave:**
  - Ley 21.719 vigente desde el **1-12-2026**;
  - COPPA, cumplimiento desde el 22-04-2026;
  - AI Act art. 50 desde el 2-08-2026 (no aplica a reglas).

## 10. Decisiones aprobadas
| Fecha | Decisión | Fuente |
|---|---|---|
| 2026-11-01 | Plataforma multidioma; español para angloparlantes | Propietario |
| 2026-11-01 | Beta solo para mayores de 18 | Propietario |
| 2026-11-02 | Beta hacia el 15-11; desarrollo hasta el 30; preparar ventas sin incumplir obligaciones | Propietario (fase 2) |
| 2026-11-02 | Una sola fuente de progreso con IDs `es:`; XP y racha compartidos | Implementación |
| 2026-11-02 | El chat de práctica no otorga evidencia de dominio | Implementación (se dice en la interfaz) |

## 11. Bloqueos y decisiones pendientes del propietario
| # | Decisión / bloqueo | Bloquea |
|---|---|---|
| — | **Sustituida por la tabla del §0 (fase 3).** Se conserva abajo como registro de la fase 2 | — |
| 1 | Autorizar *push* y los dos PR en borrador; correo del autor (`noreply`); `.diff` de auditoría | Preview, CI, beta |
| 2 | Aprobar la propuesta de `CLAUDE.md` (cambios 1–3; el 4 solo si se cobra) | Coherencia del contrato |
| 3 | Crear el proyecto Supabase **de prueba** y entregar URL y clave pública para la Preview | Autenticación real, beta |
| 4 | Contacto de privacidad (correo) y entidad o nombre del operador para los textos legales | Beta pública |
| 5 | Autoría y derechos de Chatto | Publicación |
| 6 | Revisión nativa del español; revisión legal (CL y US) | Beta pública |
| 7 | Contador: estructura, régimen, IVA del flujo MoR | Cualquier cobro |
| 8 | Escribir a Polar (tutor por reglas, IVA chileno) y abrir el *sandbox* | Integración de pagos |
| 9 | Apertura de inglés A1 | Ese contenido y su posible Premium |

## 12. Cambios recientes
- **Bloque 1 (01–02 nov.):** cursos, español Pre-A1, evaluador, aislamiento; eliminado `POST /user`.
- **Fase 2 (02 nov.):**
  - `e434e60`: planes honestos, seguridad del tutor y edad;
  - `ecfabe6` + `c1bb8ce`: sesión diaria de español, misiones, voz y carga diferida;
  - `decd99f`: chat de español;
  - `f856925`: exportar y borrar datos, planes verificados;
  - `793f3ee`: correcciones de la QA en navegador y revisión automática del contenido;
  - último commit: derechos premium inactivos y documentos (comercial, legal, *release*, auditoría).

## 13. Archivos clave
- **Cursos:** `linguachat-frontend/src/learning/courses/` (`registry`, `transform`, `courseSession`, `es/*`).
- **UI:**
  - `components/today/` (`CourseToday`, `CourseSession`, `CourseChat`, `CourseSwitcher`);
  - `components/identity/DataControls.jsx`;
  - `components/pricing/Pricing.jsx`;
  - `components/auth/AuthFlow.jsx`.
- **Servicios:** `ageGate.js`, `learnerData.js`, `pricing.js`, `activeCourse.js`.
- **Backend:**
  - `ai/safety.py`, `ai/es_tutor.py`, `app/routes/chat.py`, `app/billing/entitlements.py`;
  - pruebas `test_safety`, `test_es_tutor`, `test_entitlements`.
- **Pruebas frontend:** `check-es-course`, `check-es-session`, `check-age-gate`, `check-learner-data`.
- **Documentos:** `docs/release/*`, `docs/business/*`, `docs/legal/*`, `docs/architecture/multilingual-curriculum.md`, `docs/audits/2026-11-beta-phase2.md`.

## 14. Últimas pruebas
**Dos ciclos limpios sobre `f9f77b5`:**
- `check:all` 104/104, `build` e i18n ok;
- `pytest` **1429 passed / 28 skipped** (incluye seguridad 164, tutor de español 12 y derechos 10);
- e2e 4/4 y 5/5;
- integridad 29/29 (+1 que solo corre en local);
- alcance de la nube ok;
- garantías 16/16.
- **Bloqueado:** `check:github-integration` (falta `jq`).

Detalle: `docs/release/2026-11-beta-readiness.md` § Ciclos finales.

## 15. Próximo paso ejecutable
1. Con las decisiones 1 y 3: *push* de los PR en borrador → CI → Preview → los 10 recorridos de autenticación (`2026-11-beta-readiness.md` §5).
2. **Sin autorización (sigue en local):**
   - inglés en el planificador de cursos si hace falta;
   - «práctica extra» como Premium candidato **sin cobro**;
   - más misiones de español;
   - auditoría de accesibilidad con teclado.

## 16. Fecha límite
- Beta limitada: **15-11-2026** (objetivo, no excepción a la seguridad ni a la legalidad).
- Desarrollo continuo: hasta el **30-11-2026**.

## 17. Riesgos
| Riesgo | Mitigación |
|---|---|
| Sin autorización de *push* ni entorno de autenticación, no hay beta real el 15 | Decisión esta semana; plan de §5 listo |
| IVA sobre los pagos del MoR reduce el margen hasta 19 puntos | Contador antes de fijar precio |
| Ley 21.719 desde el 1-12 | Exportar y borrar ya hecho; faltan DPA y revisión |
| Evaluador o chat de español rechazan formas correctas | «No evaluable» en lugar de corregir; revisión nativa; muestreo |
| Chatto sin derechos documentados | Confirmación del propietario |
| Seguridad por reglas incompleta ante ataques de varios turnos | Límite documentado; reforzar antes de cualquier IA generativa |

## 18. Instrucciones para continuar (otro agente)
1. Lee `CLAUDE.md`, este maestro, `docs/architecture/multilingual-curriculum.md` y `docs/release/2026-11-beta-readiness.md`.
2. Trabaja en el clon y la rama de arriba. **No hagas *push*.** El `pushurl` está deshabilitado a propósito.
3. **Windows:**
   - `-c core.autocrlf=false`, `MSYS_NO_PATHCONV=1`;
   - edita en Python con `newline=''` (o con un script en archivo si hay comillas complejas);
   - todo en LF.
4. **i18n:** `node scripts/i18n-apply.mjs src/i18n <spec.json>`, con un JSON `{remove, add}` con los 8 idiomas. `check-i18n` exige completitud.
5. **QA:**
   - `npm run check:all` (107 pasos desde la fase 3, por *exit code*), `npm run build` y `npm run check:ledger-rollback` (30/30) en el frontend;
   - en el backend: `.venv/Scripts/python -m pytest` con `LINGUACHAT_PROVIDER=local`;
   - **dos ciclos limpios** tras cualquier corrección.
6. **Navegador sin cuenta:**
   - banco visual: `npx vite --config bench/vite.bench.config.mjs`;
   - escenas: `course-today`, `course-episode`, `course-session`, `course-chat`, `plans`, `age`, `account-age`, `identity`.
   - El chat necesita el backend local con CORS para `127.0.0.1:5190` (variable `CORS_ORIGINS`).
7. Nunca abras A1–C2, actives cobros ni reactives rutinas. Actualiza este maestro al cerrar cada bloque.
8. **Al cerrar cada fase:** ejecuta `python scripts/export_reports.py --label faseN-AAAA-MM-DD --report docs/audits/<informe>.md` y entrega las rutas absolutas de Windows de la carpeta y del ZIP. Los enlaces Markdown al clon no los puede abrir el propietario.
9. **Premium en modo de prueba (solo en local):**
   - inicia el backend con `LINGUACHAT_PREMIUM_ENABLED=true` y `LINGUACHAT_PASS_SIGNING_KEY` (32 caracteres o más, solo local);
   - emite un pase con `python scripts/issue_test_pass.py --sub qa-1`;
   - usa la escena del banco `course-today&extra=<pase>`.
