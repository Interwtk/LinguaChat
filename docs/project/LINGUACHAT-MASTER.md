# LINGUACHAT — MAESTRO DEL PROYECTO

> **Documento vivo.** Se actualiza al terminar cada bloque significativo.
> - Última actualización: **2026-11-02**, bloque 1 de la «Operación Beta 30-N».
> - Regla: nada se marca «listo» si solo está diseñado. Cada afirmación cita su evidencia.
>
> **Relación con el protocolo de `CLAUDE.md`:**
> - `.ai/STATE.md`, `.ai/HANDOFF.md` y `.ai/TASKS.md` son los registros del flujo autónomo en la nube. `TASKS.md` funciona como lock. **Este maestro no los sustituye ni los edita.**
> - Esos archivos están desactualizados respecto de `main` (todavía describen el PR #123 como borrador). Actualizarlos corresponde al protocolo, dentro del PR que integre este trabajo.
> - Las rutinas y automatizaciones de LinguaChat están **pausadas** y no se reactivaron.

---

## 1. Visión del producto
- **LinguaChat:** una plataforma multidioma de práctica conversacional. El estudiante elige qué idioma aprender. Un solo motor educativo para todos los cursos.
- **Lingua:** la única tutora. **Chatto:** mascota y compañía, nunca enseña.
- **Objetivo inmediato:** una beta real, segura, honesta y comercialmente viable al **30-11-2026**. Pequeña, pero completa dentro de su alcance (`docs/release/2026-11-beta-scope.md`).

## 2. Estado técnico actual

| Elemento | Valor | Evidencia |
|---|---|---|
| `main` remoto | `086323c` (sin cambios desde la fase 6) | `git fetch` 2026-11-02 |
| Rama de integración P0–P5 (punto de recuperación) | `integration/local-p0-p5` @ `e656e04`; etiqueta local `recovery/p6-integration-e656e04` | fase 7 |
| **Rama de trabajo de la beta** | `beta/2026-11-es-for-en` (local, sin *upstream*, *push* deshabilitado) | `git branch -vv` |
| Commits de código del bloque 1 | `738617f` — registro de cursos y español Pre-A1 · `e0b75b8` — se elimina el almacén de usuarios sin autenticación | ver §11 |
| Clon | `C:\Users\Sebastian Gamboa\Music\LinguaChat-integration` | — |
| Carpeta original y respaldos | `Music\LinguaChat-main\LinguaChat-main`, `_snapshot-*`, `_originals-*`. **No se tocaron.** | — |
| Bundle de entrada | 757,3 kB (antes 748,4 kB; +8,8 kB por los metadatos del curso español) | `vite build` |

## 3. Idiomas enseñados
- **Inglés (`en`):** curso original.
- **Español (`es`):** nuevo; solo para quien tiene la interfaz en inglés.

## 4. Idiomas auxiliares (interfaz y explicación)
- Curso de inglés: en, es, pt, fr, it, de, ja, ar (completos, controlados por `check-i18n`).
- Curso de español: **solo en**. No se ofrece en otros idiomas: anunciarlo sería caer en inglés sin avisar.

## 5. Currículos abiertos y cerrados

| Curso / nivel | Contenido | ¿Abierto? |
|---|---|---|
| Inglés Pre-A1 | 17 episodios (congelado) | **Sí** |
| Inglés A1 | 21 episodios | **No** (`available:false`; requiere la decisión del propietario, issue #101) |
| Inglés A2–C2 | Construido | **No** |
| Español Pre-A1 | 12 episodios, 136 pasos, 51 palabras, 23 tipos de evaluación | **Sí, en la rama local** (no publicado) |
| Español A1+ | No existe | — |

## 6. Seguridad
- **Existe:**
  - aislamiento por cuenta (`lc2-` + *lease*);
  - integridad del registro de progreso (30/30 con historia);
  - sin proveedores de pago activos;
  - `provider_policy`;
  - backend sin base de datos.
- **Hallazgo nuevo (2026-11-02):** `POST /user` (`linguachat-backend/app/routes/user.py`):
  - no tiene autenticación;
  - el frontend no lo usa;
  - escribe en un diccionario en memoria sin límite;
  - `app/db.py` contiene como dato de ejemplo un **nombre completo real** en un repositorio público.
  - **Corregido** en `e0b75b8`: ruta, módulo y datos eliminados, con una prueba de regresión (`tests/test_no_unauthenticated_user_store.py`).
- **No existe todavía:**
  - puerta de edad;
  - filtro de seguridad de entrada y salida;
  - pruebas adversariales multilingües (especificación en `docs/legal/age-and-safety-policy.md`).

## 7. Monetización
**Estado: sin cobros, sin proveedor, sin código de suscripción.**
- **Plan:** `docs/business/monetization-plan.md`.
- **Recomendación:** beta gratuita con lista de espera. Polar.sh como *Merchant of Record* cuando haya entidad legal y un Premium real (candidato: inglés A1 tras su apertura).
- **Stripe no admite Chile.**
- **Defecto a corregir:** la página de Planes lista funciones Premium inexistentes.

## 8. Protección legal
- Borradores (todos **BORRADOR**, pendientes de revisión jurídica):
  - `docs/legal/privacy-policy-draft.md` (en/es);
  - `terms-draft.md` (en/es);
  - `content-copyright-policy.md` (incluye el inventario de activos);
  - `age-and-safety-policy.md`;
  - `jurisdiction-matrix.md`.
- Investigación con fuentes: `docs/legal/research/2026-11-01-regulatory-research.md`.
- **Fechas críticas:**
  - **Ley 21.719 (Chile) en vigor el 1-12-2026**, un día después de la beta; el proyecto de postergación es solo un proyecto;
  - COPPA, cumplimiento desde el 22-04-2026;
  - AI Act art. 50 desde el 2-08-2026 (no aplica a un tutor por reglas);
  - Chile **sin** adecuación de la UE.
- **Conclusión:** hoy no se puede afirmar que la comercialización sea legal en ningún mercado. La beta gratuita para adultos en CL y US es viable con medidas.

## 9. Decisiones aprobadas
| Fecha | Decisión | Fuente |
|---|---|---|
| 2026-11-01 | LinguaChat pasa a ser multidioma; el primer mercado nuevo es el español para angloparlantes | brief del propietario |
| 2026-11-01 | Beta exclusivamente para mayores de 18 años | brief |
| 2026-11-01 | Sin cobros, *push*, *merge* ni *deploy* sin autorización expresa | brief |
| 2026-11-02 | Diseño: una sola fuente de progreso con IDs por curso (`es:`); XP y racha compartidos | implementación, `docs/architecture/multilingual-curriculum.md` |
| 2026-11-02 | El curso de español se ofrece solo con explicaciones en inglés | idem |

## 10. Bloqueos (quién decide)
| # | Bloqueo | Decide / hace |
|---|---|---|
| 1 | Autorizar *push*, PR, *merge* y Preview | Propietario |
| 2 | Correo del autor de los commits (repositorio público) y si se incluyen los `.diff` de auditoría | Propietario |
| 3 | Actualizar `CLAUDE.md`, que hoy dice «app for learning English» y «target English» | Propietario |
| 4 | Entorno Supabase de prueba autorizado, para probar autenticación real | Propietario |
| 5 | Entidad legal, SII y proveedor de pago | Propietario y contador |
| 6 | Autoría y derechos de **Chatto**; búsqueda de marca «LinguaChat» | Propietario |
| 7 | Revisión jurídica de los borradores | Abogado |
| 8 | Revisión del curso de español por un hablante nativo | Propietario (contratar o designar) |
| 9 | Alcance del almacén de derechos premium (Supabase de backend o verificación contra la API del proveedor) | Propietario |

## 11. Cambios recientes
- **Bloque 1 (2026-11-01/02):**
  - registro de cursos, transformación estructural, español Pre-A1 (contenido original), evaluador español local;
  - selector de curso y Hoy del curso;
  - aislamiento por curso de repasos, plan, resumen, apoyo, Jardín y conteo;
  - detección de copia sin tildes;
  - la opción correcta ya no es siempre la primera en el curso español;
  - el hueco resuelve `{name}`;
  - 19 cadenas de interfaz en 8 idiomas;
  - `check-es-course` (343 comprobaciones);
  - escenas del banco visual.
  - Documentos: los 10 entregables y dos memorias de investigación.
- **`e0b75b8`:** eliminado `POST /user` y los datos personales de ejemplo; la regex de `check-visual-identity` acepta el conteo filtrado por curso; matriz de preparación regenerada.

## 12. Archivos y ramas clave
- **Código del curso:** `linguachat-frontend/src/learning/courses/` (`registry.js`, `transform.js`, `es/skeleton.js`, `es/preA1Content.js`, `es/evaluator.js`, `es/evaluatorCopy.js`).
- **Integración:**
  - `src/learning/curriculum/episodeContent.js`;
  - `src/components/episode/EpisodeShell.jsx`;
  - `src/context/AppContext.jsx` (`activeCourse`, `chooseCourse`);
  - `src/services/activeCourse.js`;
  - `src/components/today/CourseSwitcher.jsx`, `CourseToday.jsx`.
- **Pruebas:** `linguachat-frontend/scripts/check-es-course.mjs`. El `check:all` tiene ahora 101 pasos.
- **Banco visual:** `bench/main.jsx`, escenas `course-today` y `course-episode`.

## 13. Últimas pruebas
Ver `docs/release/2026-11-beta-readiness.md` §2 (resultados de ciclo con exit codes).

## 14. Próxima prioridad
1. Confirmar los dos ciclos limpios sobre `e0b75b8` (ver la preparación de la beta) y hacer commit de la documentación.
2. **Ventana 2 (8 al 14 de noviembre):**
   - puerta de edad;
   - filtro de seguridad en el servidor con pruebas adversariales en en, es, ja y ar;
   - corregir la tarjeta Premium;
   - revisión nativa del español;
   - repaso diario del curso español;
   - TTS español.
3. Con autorización: *push* de la rama, PR en borrador, Preview y prueba de autenticación real.

## 15. Fecha límite
**30-11-2026.** Ventanas: 1–7, 8–14, 15–21 y 22–30 de noviembre (`docs/release/2026-11-beta-readiness.md` §4).

## 16. Riesgos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| Sin autorización de *push* y Preview, nada se puede probar en la nube | Alto | Pedir decisión esta semana; el trabajo local continúa |
| Ley 21.719 vigente desde el 1-12 | Alto | Lanzar ya alineados: aviso, derechos, borrado y DPA |
| El evaluador español rechaza respuestas correctas | Medio | Lo dudoso queda como «no evaluable»; revisión nativa; muestreo en el piloto |
| Derechos de Chatto no documentados | Medio | Confirmación del propietario |
| Sin autenticación probada en un entorno real | Alto | Entorno Supabase de prueba autorizado |
| Contenido sin eficacia demostrada | Medio | Piloto con consentimiento; no prometer resultados |

## 17. Instrucciones para continuar (otro agente)
1. Lee `CLAUDE.md`, este maestro y `docs/architecture/multilingual-curriculum.md`.
2. Trabaja en el clon `Music\LinguaChat-integration`, rama `beta/2026-11-es-for-en`. No hagas *push* (`pushurl` deshabilitado a propósito).
3. **Git en Windows:**
   - usa `-c core.autocrlf=false` (el clon ya lo tiene);
   - `MSYS_NO_PATHCONV=1` para rutas `ref:path`;
   - edita en Python con `newline=''`;
   - todo en LF (`check-line-endings`).
4. **QA:**
   - `npm run check:all` (101 pasos, cuenta por *exit code*) y `npm run build` en `linguachat-frontend`;
   - en `linguachat-backend`: `.venv/Scripts/python -m compileall` y `-m pytest` con `LINGUACHAT_PROVIDER=local`;
   - **dos ciclos limpios** tras cualquier corrección.
5. **Prueba visual sin cuenta:**
   - `npx vite --config bench/vite.bench.config.mjs`;
   - luego abre `http://127.0.0.1:5190/bench/?scene=course-episode&ep=es:hola&lang=en`.
6. **Un curso nuevo:**
   - entrada en `COURSES` (`registry.js`);
   - `skeleton.js` (metadatos, vocabulario y copia de Hoy);
   - contenido escrito con `buildCourseEpisode`;
   - evaluador que devuelva la forma `base()`;
   - comprobaciones al estilo de `check-es-course`.
7. Nunca abras A1–C2. Nunca actives cobros. Nunca reactives rutinas.
8. Actualiza este maestro al terminar cada bloque.
