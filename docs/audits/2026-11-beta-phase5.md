# Informe técnico: Fase 5 (2026-11-07)

> **Rama local:** `beta/2026-11-es-for-en`, sin *push*. Base: `1c6005f`. **Código probado: `24065ba`.**
> **Sin acciones remotas:** ningún *push*, PR, *merge*, *deploy*, cobro, cuenta ni servicio externo. Rutinas pausadas sin tocar.
> Ciclos: `docs/release/2026-11-beta-readiness.md` § Ciclos de la fase 5.

## 1. Tutor guiado (prioridad A)

Detalle: `docs/architecture/guided-tutor.md`.

- 12 escenarios Pre-A1 abiertos (6 por curso, 36 preguntas) y 3 de A1 cerrados. Cinco clases de turno, coincidencia con el mensaje entero, recuperación en cuatro pasos, sin plantillas de elogio para lo desconocido. Ambos chats los abren.
- Evaluación nueva con autor que solo vio las preguntas: 220 de desarrollo, 440 sellados.

| Sellado, ambos cursos | Resultado |
|---|---|
| Válidas aceptadas | **63,1 %** (desarrollo: 96,6 %) |
| Correcciones falsas | 0,0 % |
| Errores detectados · aceptados | 61,8 % · 7,3 % |
| Preguntas de idioma | 40,9 % |
| Mensajes ajenos tratados como respuesta | 0,0 % |
| Seguridad: manejados · tratados como respuesta | 52,3 % · 0 de 44 |
| Sellado de seguridad de la fase 4 en escenarios | 35,0 % respuesta de seguridad; **0 de 294** como respuesta |

**Lectura.** La estructura evita tratar lo dañino como respuesta. La detección no mejoró: 35 %, y 5 % en crisis indirectas. Una de cada tres respuestas correctas recibe «no entendí». El chat libre sigue sin ser apto.

También: frases directas que el filtro no veía («I don't want to live anymore», una amenaza con cuchillo); «Si podrías actuar» corregido en la respuesta de crisis, que seguía mal escrita; la respuesta genérica ya no finge haber seguido al estudiante.

## 2. Curso × nivel (prioridad B)

Detalle: `docs/architecture/course-level-identity.md`. **Lector compatible, sin migración.** `es:hola` sigue igual; A1 usa `es:a1:…`. Una sola base de progreso. Niveles por curso en `COURSES.es.levels`, con A1 cerrado antes de cargar. 65 casos, con almacenes simulados.

## 3. Inglés

- Orden de opciones: solución general en el reproductor. **Corrección a la cifra:** el defecto real es 17/17 y 34/34; 4 y 1 preguntas aceptan todas las opciones. A1 (cerrado) ya rota: 11/11/12. Pre-A1 y prueba de nivel siguen igual hasta tu aprobación. Comparación: `docs/curriculum/option-order-comparison.md`.
- Pre-A1 congelado (`check-pre-a1-freeze`). A1 no aprobado ni abierto.

## 4. Español

- Evaluador medido con autor ciego: 180 de desarrollo, 360 sellados.

| Sellado | Resultado | Desarrollo |
|---|---|---|
| Válidas aceptadas | **89,4 %** | 99,0 % |
| Correcciones falsas | **2,5 %** | 0,0 % |
| Errores detectados | **48,9 %** | 79,1 % |
| Errores aceptados como válidos | **15,0 %** | 1,5 % |
| Errores no evaluables | 36,1 % | 19,4 % |

Por tema, válidas aceptadas: ser/estar 100, género 100, pronombres 100, independiente 94, conjugación 92, preguntas 89, artículos 86, vocabulario 78, regional 78. Errores detectados: ser/estar 78, género 57, pronombres 56, artículos 42, conjugación 36, preguntas 20 (muestra pequeña). Algunos «errores» dependen del turno, que el evaluador no ve.

- **Lectura.** Rara vez corrige mal. Deja pasar o no evalúa más de la mitad de los errores nuevos. Conjugación y vocabulario regional son lo más débil.
- A1: primer arco (`es_a1_vida`, 3 lecciones) construido y **cerrado**, con el mismo motor. 4 tipos de evaluación nuevos.
- `deriveCourseReadiness`: el paso a A1 pide lecciones, uso sin ayuda, 60 % retenido en otro día y poco perdido. Umbrales sin probar con personas.
- Corregido: «hasta mañana» se rechazaba por la ñ, también en `es_tutor.py`.

Sin revisión humana: esto es IA.

## 5. Personalización (prioridad C)

Detalle: `docs/architecture/learner-retention-signal.md`. Nueva señal por ítem: días distintos sin ayuda, olvidos, y `retained` frente a `same_day`. Medido: las 12 lecciones en un día dan 19 `can_use` y **0 retenidos**. El repaso trae primero lo perdido. `can_use` no cambió. Sin evidencia de personas.

## 6. Autenticación (prioridad D)

- Propuesta en rama aparte, **sin fusionar**: `proposal/backend-jwt-verify` @ `ff6e7d8`. Verifica firma, emisor, audiencia, vigencia y usuario con claves públicas. Sin clave de servicio. Apagada por defecto. 87 pruebas propias, con claves locales.
- Informe del autor: 1864 pruebas pasan en esa rama, guardia de alcance en verde. Dependencia nueva: `PyJWT[crypto]`.
- **Bloqueo:** el frontend aún no envía el token, así que encenderla hoy daría 401 a todos. Sin probar con un proveedor real.
- Cambio de `CLAUDE.md` propuesto, no aplicado: `docs/project/claude-md-jwt-proposal.md` en esa rama.
- Qué hace falta para los 10 recorridos: `docs/release/2026-11-real-validation-needs.md`.
- Edad: sigue siendo autodeclaración evitable. Medidas en ese mismo documento.

## 7. Premium y precios (prioridad E)

- Apagado. Diseño: `docs/architecture/premium-entitlements-design.md`. Valor: hoy no justifica suscripción.
- Precios: reembolsos, tipo de cambio y procesador en el modelo; `sellable` dice qué falta. Ninguna región es vendible. Polar y Paddle siguen sin confirmar. Nada nuevo en SII ni legal: sin hechos nuevos, no se rehízo la investigación.

## 8. Defectos encontrados en el camino

- **Fecha fija en una prueba:** `check-same-account-tabs` caducó el 2026-11-06 porque su fecha quedó fuera de la ventana de 7 días del registro. Fallaba también en `1c6005f`. Era la prueba, no el producto. Ahora se mueve con el reloj.
- El primer ciclo de esta fase dio 21/24 por un error de sintaxis mío en `evaluate.py`. Corregido antes de los ciclos finales.

## 9. Límites conocidos

- Tutor: una de cada tres respuestas correctas no se reconoce.
- Filtro: 35 %; crisis indirectas 5 %.
- Español: la mitad de los errores nuevos no se corrige.
- Autenticación real sin probar. `/chat` sin autenticación ni límite de peticiones.
- Las evaluaciones son imitaciones escritas por IA, un autor por conjunto. Sin estudiantes reales ni revisión humana.
