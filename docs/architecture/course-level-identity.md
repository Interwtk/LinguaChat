# Curso × nivel: identidad curricular

> Fase 5, 2026-11-07. Código: `src/learning/courses/curriculumIdentity.js`, `registry.js`. Prueba: `scripts/check-course-levels.mjs` (60 casos, almacenes simulados).

## Decisión

**Lector compatible, sin migración.** Una migración puede perder datos; leer no. El progreso sigue en un solo almacén por cuenta y ninguna clave antigua cambia.

| Forma del id | Significa | Ejemplo |
|---|---|---|
| sin prefijo | Inglés; el nivel sale de los mapas del currículo | `first_greeting` |
| `es:<id>` | Español Pre-A1, para siempre | `es:hola` |
| `es:<nivel>:<id>` | Español de ese nivel y siguientes | `es:a1:donde_vives` |

`es:hola` y `es:a1:hola` nunca son el mismo registro. El curso sigue siendo el primer segmento, así que todo lo que filtra por curso sigue funcionando. Un segmento solo cuenta como nivel si el curso lo declara.

## Las ocho dimensiones

| Dimensión | Dónde está |
|---|---|
| Idioma objetivo | `COURSES[id].targetLanguage` |
| Idioma de explicación | Junto al id, nunca dentro (`describeCurriculumId`). Cambiarlo no cambia resultados |
| Nivel CEFR | Segmento del id, o los mapas en inglés |
| Episodio | `es:a1:donde_vives` |
| Competencia | `es:a1:talk_about_life` |
| Evaluación | `evalKind` del paso, en el evaluador del curso |
| Evidencia | `languageItems`, `canDo`, `teachingHistory`, bajo los mismos ids |
| Progreso | El modelo único. Sin segunda base |

**Excepción deliberada.** Los errores recurrentes son por curso, no por nivel: un error de género en A1 es el mismo hábito que en Pre-A1, y el apoyo debe seguirlo.

## Apertura por nivel

`COURSES.es.levels` declara cada nivel. `a1` está en `available: false`: se rechaza con `level_unavailable` antes de cargar su bloque. Abrirlo es cambiar esa bandera, con decisión del propietario. Home y el plan solo ven el nivel abierto.

## Qué se probó

Formas de id, escritura idéntica a la antigua, ids entre niveles sin choque, cierre antes de cargar, apertura con el mismo motor, separación entre niveles y cursos, cambio de curso, modelos de versiones anteriores, datos parciales y dañados, exportación y lectura tras reinicio, dos pestañas, conflictos, dos cuentas.

**Simulado.** Sin cuenta real ni navegador real con dos usuarios: eso queda en los 10 recorridos.
