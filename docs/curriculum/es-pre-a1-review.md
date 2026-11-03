# Español Pre-A1 para angloparlantes — estado de revisión

> Fase 3, 2026-11-03. Rama local `beta/2026-11-es-for-en`.
> **Revisión nativa: NO REALIZADA.** Lo que existe es revisión automática y revisión hecha por una IA. Ninguna de las dos sustituye a un hablante nativo con formación docente, y este documento no la marca como completada.

## 1. Qué está verificado y cómo

| Área | Verificación | Resultado |
|---|---|---|
| Estructura de las 12 lecciones (pasos, vocabulario, `evalKind`, copias) | `check-es-course` (347) | Pasa |
| Sesión diaria, misiones, repasos, reintento, transferencia y aislamiento del inglés | `check-es-session` (187) | Pasa |
| Evaluador con respuestas **no usadas para escribir las reglas** | `check-es-unseen` (79), fase 3 | Antes de corregir: 1 variante válida rechazada y **3 correcciones falsas** de español correcto. Ahora: 0 |
| Chat de práctica (reglas, temas Pre-A1) | `tests/test_es_tutor.py` (12) | Pasa |
| Voz | `pickVoice`: no lee español con voz inglesa | Pasa (sin escuchar el audio real) |
| Progreso por cuenta y curso | `check-auth-journeys` J5–J7 (simulado) | Pasa |

**Correcciones falsas encontradas y resueltas en la fase 3:**
- «holaaa»: se trataba como saludo ausente. Ahora se colapsan las letras repetidas del chat.
- «el café me gusta»: se marcaba «falta la cosa». Ahora se acepta el orden con la cosa delante.
- «quería un café»: se marcaba «falta cortesía». Ahora se reconoce el imperfecto de cortesía.
- Variante aceptada: «me gustaría un agua» como forma de pedir.

**Empujes deliberados (no son errores, son la forma completa que enseña la lección):**
- un nombre suelto («Alex») en la presentación;
- «la cuenta» sin «por favor».

## 2. Qué debe revisar un hablante nativo

Perfil: profesor/a de ELE, preferentemente con experiencia en A1 y con alumnos angloparlantes. Idealmente dos revisores: España y Latinoamérica.

Para cada una de las 12 lecciones (hola, te_llamas, como_estas, de_donde, no_entiendo, primera_charla, me_gusta, quiero, numeros, que_es_esto, por_favor, en_el_cafe):

1. **Naturalidad** de los modelos y diálogos (¿lo diría así un nativo?).
2. **Variantes** que deben aceptarse y hoy podrían no aceptarse (vos, usted, ustedes; léxico regional).
3. **Explicaciones en inglés**: correctas, breves y no engañosas.
4. **Correcciones**: que ninguna marque como error algo correcto.
5. **Registro**: tú frente a usted en el café y con desconocidos.
6. **Contenido cultural**: sin estereotipos y con referencias neutras.
7. **Audio**: escuchar al menos una lección completa con voz española real del dispositivo.

Material para el revisor:
- banco visual (`course-episode`, `course-session`, `course-chat`);
- `src/learning/courses/es/skeleton.js`, `preA1Content.js`, `evaluatorCopy.js`;
- la lista de respuestas de `scripts/check-es-unseen.mjs`.

## 3. Hoja de revisión (llenar)

| Lección | Revisor | Fecha | Naturalidad | Variantes | Explicaciones | Correcciones | Hallazgos |
|---|---|---|---|---|---|---|---|
| 1–12 | — | — | pendiente | pendiente | pendiente | pendiente | — |

**Criterio para retirar «sin revisión nativa» de la interfaz y del alcance:** las 12 filas completas, los hallazgos bloqueantes corregidos y la firma del revisor en este documento.
