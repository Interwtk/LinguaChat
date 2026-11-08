# Informe técnico: Fase 6 (2026-11-07)

> **Rama local:** `beta/2026-11-es-for-en`, sin *push*. Base: `96ec410`. **Código probado: `409bbf0`.**
> **Sin acciones remotas:** ningún *push*, PR, *merge*, *deploy*, cobro, cuenta ni servicio externo. Solo lectura: `git fetch` y `gh` de consulta. Rutinas pausadas sin tocar.
> Ciclos: `docs/release/2026-11-beta-readiness.md` § Ciclos de la fase 6.

## Estado: A, no B, no C

| Estado | Hoy |
|---|---|
| A. Beta interna (datos sintéticos, cuentas simuladas) | **Sí**, en local |
| B. Beta externa gratuita | **No**: autenticación real sin probar, sin revisión humana ni legal, sin contacto de privacidad, Chatto sin documentar |
| C. Beta comercial | **No** |

Detalle: `docs/business/commercial-readiness-checklist.md`.

## 1. Autenticación (P0)

- Revisión punto por punto de la propuesta JWT: `docs/architecture/jwt-integration-review.md`. Backend sigue en `proposal/backend-jwt-verify` @ `ff6e7d8`, sin fusionar.
- **Pieza local hecha:** el frontend puede enviar el token, **apagado** por defecto (`VITE_AUTH_SEND_TOKEN`). Solo en memoria, una cabecera, solo a las rutas que el servidor puede exigir. `check-session-token`: 7 casos.
- Nada produce 401: el backend no exige nada en esta rama.
- Guía para el proyecto Supabase de prueba: `docs/release/2026-11-supabase-test-project-guide.md`, contrastada con la documentación oficial, con los pasos no verificables marcados. Riesgos que señala: el correo integrado de Supabase podría no entregar a alias de prueba; el plan gratuito permite dos proyectos activos.

## 2. Tutor guiado (P0)

Ajustes solo con conjuntos de desarrollo. Conjunto sellado **nuevo** (v2, 480 ítems, otro autor ciego, la mitad de seguridad indirecta) medido una vez después.

| Medida | Sellado v1, fase 5 | Sellado v1, ahora | **Sellado v2, nuevo** | Desarrollo v2 antes · después |
|---|---|---|---|---|
| Válidas aceptadas | 63,1 % | 69,9 % | **75,5 %** | 75,0 · 99,4 |
| Correcciones falsas | 0,0 % | 0,0 % | **0,9 %** | 0,6 · 0,0 |
| Errores detectados | 61,8 % | 62,7 % | **61,5 %** | 62,5 · 67,5 |
| Errores aceptados como válidos | 7,3 % | 8,2 % | **5,2 %** | 5,0 · 2,5 |
| Preguntas de idioma respondidas | 40,9 % | 61,4 % | **63,9 %** | 48,3 · 83,3 |
| Seguridad manejada | 52,3 % | 52,3 % | **29,2 %** | 27,5 · 87,5 |
| Dañinos tratados como respuesta | 0 de 44 | 0 de 44 | **0 de 48** | 0 · 0 |

Por idioma, sellado v2: inglés válidas 73,1 %, preguntas 52,8 %, seguridad 16,7 %; español 77,8 %, 75,0 %, 41,7 %.

**Seguridad global, sin cambio:** detección 35,4 % (inglés) y 39,7 % (español) en el sellado de la fase 4; crisis indirectas 5 %. Por escenarios: 35,0 % respuesta de seguridad, 0 de 294 como respuesta, 6 de 294 recibieron una respuesta cerrada de pregunta de idioma (no reacción al contenido).

**Lectura honesta.**
- Lo educativo mejoró en datos nuevos: más respuestas naturales aceptadas, más preguntas respondidas.
- **Crisis indirecta: las reglas no generalizan.** 87,5 % en desarrollo, 29,2 % en sellado. Una frase de despedida o de entregar las cosas solo se reconoce si se parece a lo visto.
- **Control estructural que sí se sostiene:** dentro de una situación, nada desconocido se trata como respuesta (0 de 48, 0 de 294). Recibe «no puedo seguir eso, no soy una persona, habla con alguien de confianza» y el aviso permanente con líneas de ayuda.
- Categoría nueva `being_harmed` (alguien que dice que lo golpean o que no está seguro en casa), respuesta en 8 idiomas sin números no verificados.
- Defecto corregido: la corrección ortográfica podía convertir una palabra real («killing») en una respuesta válida. Ahora solo corrige errores de tecleo.
- Defecto corregido: «¿Repetir? No. Hoy me despido de todos» se trataba como pregunta de idioma.

## 3. Inglés (P1)

- Orden de opciones: prueba de equivalencia añadida (mismos objetos, corrección por la opción, posición nunca guardada, prueba de nivel por id). 345 casos. Pre-A1 y prueba de nivel siguen esperando tu aprobación.
- A1: revisión con 24 defectos medidos (`docs/curriculum/en-a1-defects-phase6.md`). Corregidos D3 y D4 en el evaluador (preguntas de precio y horas después de las diez), sin tocar contenido. 11 de 12 condiciones sin cumplir. A1 sigue cerrado.

## 4. Español (P1)

| Sellado | v1 fase 5 | v1 ahora | **v2 nuevo** |
|---|---|---|---|
| Válidas aceptadas | 89,4 % | 93,0 % | **91,7 %** |
| Correcciones falsas | 2,5 % | 1,5 % | **1,3 %** |
| Errores detectados | 48,9 % | 52,6 % | **60,5 %** |
| Errores aceptados como válidos | 15,0 % | 12,0 % | **15,8 %** |

v2 por tema: género 72 % de errores detectados; conjugación 60 %; **variantes regionales 0 de 8 errores**; vocabulario 49 %. Lo más débil sigue siendo lo regional y los errores de vocabulario.

- Reglas nuevas, generales: concordancia de adjetivo con sustantivo conocido, persona del verbo, mezcla de voseo, saludos que no concuerdan, diminutivos y formas regionales.
- **Español A1:** segundo arco construido y cerrado (`mi_dia`, `a_las_siete`, `los_lunes`). Total: 6 de 20 lecciones. A1 **no** está completo ni abierto.

## 5. Experiencia del estudiante (P1)

Recorrido en navegador con el banco de pruebas (375 px, es y en): edad, Hoy en inglés, Hoy en español, lección, sesión, chat, situaciones, Tú.

| # | Problema | Estado |
|---|---|---|
| 1 | Hoy prometía «Escribe lo que sea, pregunta lo que sea»: el tutor no puede | **Corregido** en 8 idiomas |
| 2 | Las situaciones, lo que mejor enseña, estaban detrás de un botón «Roleplay» | **Corregido:** el botón dice «Situaciones» |
| 3 | La lección ofrecía «Chat freely» | **Corregido:** «Practicar conversación» |
| 4 | Una de cada cuatro respuestas correctas en situaciones recibe «no entendí» | Mejorado (63 → 75 %), sigue abierto |
| 5 | Hoy en inglés muestra cuatro entradas a un estudiante nuevo, incluida una misión de viaje | **Sin cambiar**: la arquitectura visual está congelada; decisión de diseño |

No se probó el registro real: no hay proyecto de autenticación.

## 6. GitHub y Preview (P1)

Solicitud verificada: `docs/release/2026-11-pr-authorization-request.md`. Hallazgos que importan:
- El repositorio es **público** y `main` **no tiene protección**.
- Los 57+ commits llevan tu correo personal. Publicar lo deja público de forma irreversible; la alternativa (noreply) cambia todos los hashes y obliga a repetir QA.
- No se pudo leer *Deployment Protection* de Vercel: una Preview **no es privada** sin ella, y podría usar el Supabase de producción si sus variables están en todos los entornos.
- Un PR en borrador solo ejecuta `qa.yml` (sin secretos ni despliegues). Los `claude-*` pausados no se disparan.
- Escaneo de secretos del historial: 0 coincidencias.

## 7. Premium y legal (P2)

- Premium apagado. Propuestas de valor sin quitar nada a lo gratuito (`premium-entitlements-design.md` §5).
- Privacidad: filas nuevas para situaciones y token (aún no activo).
- Pendientes legales y comerciales por estado A/B/C: `docs/business/commercial-readiness-checklist.md`.
- Sin investigación tributaria nueva; ninguna cuenta creada.

## 8. QA

Dos ciclos sobre `409bbf0`, 25/25 etapas, idénticos y limpios: `check:all` 117/117, pytest 1799 / 28 omitidas, e2e 4/4 y 5/5, garantías 16/16, rollback 30/30. Antes, un ciclo no pudo ni empezar: mi cambio había roto una cadena en `scripts/qa-cycle.mjs`. Detalle: `docs/release/2026-11-beta-readiness.md`.
