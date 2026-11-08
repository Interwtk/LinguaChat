# Plan de validación humana — inglés y español

> 2026-11-04 · rama local `beta/2026-11-es-for-en`. **Plan, no resultado.**
> **No ha ocurrido ninguna revisión nativa externa**, ni de inglés ni de español ni de las traducciones. Solo hay pruebas automáticas y revisión por IA, incluidos los 591 casos de español (`es-pre-a1-review.md` §1); ninguna cuenta como revisión humana.
> Todo está pendiente. Cifras de horas y personas: estimaciones de diseño, sin confirmar; ninguna es dato.
> Nada aquí abre un nivel, descongela Pre-A1 ni autoriza un piloto.

## 1. Qué se valida

| Alcance | Tamaño verificado | Tipo de revisión | Efecto de hallazgos |
|---|---|---|---|
| Inglés Pre-A1 | 17 episodios, 183 pasos, 520 claves | muestra + opciones | congelado: solo excepción del propietario |
| Inglés A1 | 21 episodios, 237 pasos, 526 claves | completa | condición de `en-a1-readiness-review.md` §5 |
| Español Pre-A1 | 12 lecciones, 136 pasos, 51 ítems, 111 textos de evaluador | completa | retira «sin revisión nativa» |
| Español A1 | 0 construido; `es-a1-design.md` | solo diseño | corrige el diseño antes de construir |
| Inglés A2–C2 | contenido cerrado | fuera de esta ronda | sin apertura programada |

Claves de episodio: `pre-a1-a1-readiness-matrix.md`.

## 2. Quién

| Perfil | Requisito | Cuántos | Revisa |
|---|---|---|---|
| R1 Docente ELE, España | A1, alumnos angloparlantes | 1 | español Pre-A1 y diseño A1 |
| R2 Docente ELE, Latinoamérica | igual; variedad distinta a R1 | 1 | igual |
| R3 Docente de inglés, nativo | A1 adultos | 1 | inglés Pre-A1 y A1 |
| R4 Docente de inglés para hispanohablantes | A1, no nativo admitido | 1 | progresión y explicaciones |
| R5 Revisores de locale | nativo; pt, fr, it, de, ja, ar, es | 7 (1 por idioma) | copia auxiliar inglés |
| R6 Anglohablante sin español | adulto, no docente | 1 | claridad de explicaciones ES |
| R7 Mayor de 60 / usuario de lector de pantalla | adulto | 1–2 | accesibilidad |
| R8 Privacidad y legal | jurisdicción de participantes | 1 | consentimiento y datos del piloto |

Mínimo: 2 por lengua meta, para contrastar. Ningún revisor evalúa contenido propio.

## 3. Materiales

| Material | Para | Fuente |
|---|---|---|
| Banco visual | todos | `course-episode`, `course-session`, `course-chat` (`es-pre-a1-review.md` §2) |
| Contenido y respuestas de español | R1, R2, R6 | `src/learning/courses/es/`, `scripts/check-es-unseen.mjs`, `scripts/fixtures/es-teacher-cases.json` (casos de IA, a validar) |
| Contenido inglés y copia por idioma | R3–R5 | exportación legible, sin código; **por construir** |
| Plantilla e instructivo de 1 página | todos | columnas de §6, severidad, qué no revisar |

## 4. Qué se revisa por nivel

| Dimensión | Pre-A1 EN | A1 EN | Pre-A1 ES | A1 ES (diseño) |
|---|---|---|---|---|
| Naturalidad y variantes aceptables | muestra | sí | sí | lista regional |
| Explicaciones correctas; ninguna corrección falsa | muestra | sí | sí | — |
| Registro tú/usted | — | — | sí | sí |
| Progresión y carga | — | sí | sí | sí |
| Correspondencia CEFR | — | 16 filas | — | can-dos |
| Transferencia y reutilización | — | sí | sí | plan |
| Estereotipos, referencias neutras | sí | sí | sí | sí |
| Audio con voz real del dispositivo | 1 lección | 1 episodio | 1 lección | — |
| Distractores y orden de opciones | sí | sí | sí | — |

Se excluye: gusto personal, rediseño visual, navegación, Chatto.

## 5. Severidad

| Nivel | Definición | Ejemplo | Regla |
|---|---|---|---|
| **S0 bloqueante** | enseña algo falso, ofende o daña | gramática errónea como modelo | detiene ese contenido |
| **S1 alta** | rechaza español o inglés correcto; explicación engañosa | corrección falsa | corregir antes de abrir |
| **S2 media** | artificial, poco natural, variante ausente | giro de manual | corregir o justificar |
| **S3 baja** | mejora opcional | sinónimo preferido | a criterio |

Si dos revisores discrepan: gana la severidad mayor hasta que decida un tercero o el propietario. Una variante regional válida nunca es error.

## 6. Registro de hallazgos

- **Una fila por hallazgo:** `id`, curso, nivel, episodio, paso, campo, texto actual, dimensión, severidad, revisor (código), fecha, propuesta, decisión, commit, estado (`pendiente` → `aceptado` / `rechazado con motivo` → `corregido` → `verificado`).
- **Dónde:** español Pre-A1, hoja de `es-pre-a1-review.md` §3. Inglés y A1: documento nuevo, solo cuando empiece.
- **Muestreo del evaluador:** por curso, ≥ 100 respuestas reales o escritas por docente, sin usar para reglas. Dos jueces ciegos al veredicto de la app. Se informa aceptación falsa, rechazo falso y `notEvaluable`.
- Sin nombres de participantes; revisores, solo con su permiso. Correcciones en PR propia; curricular y traducción, separadas (`CLAUDE.md`).

## 7. Criterios de aceptación

Un alcance se acepta solo si:

1. Todas las filas de la hoja están completas.
2. S0 y S1: cero abiertos y verificados por quien los halló.
3. S2: cada uno corregido o justificado por escrito.
4. Evaluador: rechazo falso < 10 % y `notEvaluable` < 20 %, los umbrales de `multilingual-curriculum.md` §8. Inglés: fijar propio umbral antes de medir.
5. Firma de ≥ 2 revisores por lengua meta, con variedades distintas en español.
6. QA repetida tras correcciones: dos ciclos limpios (`CLAUDE.md`).

Aceptar no abre nada: el nivel sigue su propia decisión del propietario. Retirar «sin revisión nativa» exige además lo de `es-pre-a1-review.md` §3.

## 8. Piloto pequeño con estudiantes reales

Base: `docs/research/pre-a1-pilot-protocol.md`, **borrador no aprobado**, que cubre inglés Pre-A1 y excluye A1. Requiere extensión aprobada para español y A1. Cifras: parámetros propuestos.

| Aspecto | Propuesta |
|---|---|
| Orden | tras §7 en el contenido usado. Probar instrumentos con 2–3 personas y descartar esos datos |
| Participantes | **solo adultos ≥ 18**. 12–15 por curso; rango del protocolo: 12–30. Principiantes; incluir > 60 |
| Consentimiento | informado, escrito, en lengua auxiliar. Voluntario, retiro sin motivo, borrado a petición, «no es curso certificado» |
| Datos | id seudónimo, franja de edad, sin ubicación. Fuera de la app y de Supabase. Plazo de conservación fijado antes |
| Diseño | pre-test → 4 semanas → post inmediato → post diferido (≈ 4 semanas), formas paralelas A/B/C |
| Exportación de la app | no existe; sin autorización aparte, medición solo externa |
| Puntuación | docentes con rúbrica 0–2, 25 % doble ciego; la app nunca puntúa |

| Medida de resultado | Cómo |
|---|---|
| Producción sin ayuda por capacidad | prueba externa escrita, sin app ni diccionario |
| Recuerdo diferido | post diferido; en español, además 2–7 días (`multilingual-curriculum.md` §8) |
| Transferencia | tareas en contextos no vistos |
| Concordancia app–prueba externa | solo con exportación autorizada; alimenta calibración A1 |
| Falsas correcciones | muestreo de §6 |
| Usabilidad y afecto | SUS, Likert de confianza, ansiedad, claridad, aburrimiento, utilidad |
| Abandono | todos los firmantes; > 40 % antes del inmediato es hallazgo |

**No medimos:** habla ni pronunciación. Tampoco minutos en pantalla como éxito.

**Sin afirmaciones de eficacia.** Antes del piloto no se publica ninguna. Después tampoco, sin un estudio posterior con grupo de comparación (protocolo §12–13). Hipótesis y umbrales se fijan antes de ver datos.

## 9. Esfuerzo aproximado

| Bloque | Horas |
|---|---|
| Preparar materiales, exportaciones e instructivo | 16–24 |
| Inglés: Pre-A1 muestra + A1 completo (R3, R4) | 38–52 |
| Español: Pre-A1 + diseño A1 (R1, R2) | 26–40 |
| Locales (7 × 1 046 claves) | 70–105 |
| Accesibilidad y claridad (R6, R7) | 6–10 |
| Muestreo del evaluador, 2 cursos | 16–24 |
| Privacidad y legal; protocolo, instrumentos y rúbricas | 26–42 |
| Piloto: puntuar, analizar, informar (excluye tiempo de participantes) | 40–60 |
| Corregir hallazgos | sin estimar: depende de severidad |
| **Total sin corregir** | **≈ 240–360** |

## 10. Estado

| # | Ítem | Responsable | Estado |
|---|---|---|---|
| 1 | Aprobar este plan | propietario | pendiente |
| 2 | Presupuesto y contratación de revisores | propietario | pendiente |
| 3 | Exportaciones, plantilla e instructivo | desarrollo | pendiente |
| 4 | Revisión español Pre-A1, España y Latinoamérica | R1, R2 | pendiente |
| 5 | Revisión diseño español A1 | R1, R2 | pendiente |
| 6 | Claridad de explicaciones español | R6 | pendiente |
| 7 | Revisión inglés Pre-A1 (muestra) | R3, R4 | pendiente |
| 8 | Revisión inglés A1 y correspondencia CEFR | R3, R4 | pendiente |
| 9 | Copia auxiliar pt, fr, it, de, ja, ar, es | R5 | pendiente |
| 10 | Audio con voz real | R1–R4 | pendiente |
| 11 | Accesibilidad | R7 | pendiente |
| 12 | Muestreo del evaluador, inglés y español | R1–R4 | pendiente |
| 13 | Correcciones S0/S1 y QA | desarrollo | pendiente |
| 14 | Firma por alcance | revisores | pendiente |
| 15 | Revisión legal y de privacidad | R8 | pendiente |
| 16 | Aprobar protocolo extendido | propietario + R8 | pendiente |
| 17 | Instrumentos A/B/C, rúbricas y su prueba | docentes | pendiente |
| 18 | Piloto inglés | equipo | pendiente |
| 19 | Piloto español | equipo | pendiente |
| 20 | Informe sin afirmación de eficacia | equipo | pendiente |
