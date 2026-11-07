# Tutor guiado: escenarios

> Fase 5, 2026-11-07. Rama local. Código: `ai/scenarios.py`, `ai/guided_tutor.py`, `ai/scenario_i18n.py`; ruta `/chat` con `scenario`; `GET /chat/scenarios`; pantalla `ScenarioPractice.jsx`.
> **Ningún resultado de esta página garantiza seguridad.** Son medidas sobre muestras escritas por IA.

## 1. Idea

Un filtro intenta reconocer lo dañino, y falla con lo nuevo. Un escenario invierte la pregunta: el tutor sabe de antemano qué parece una respuesta a cada una de sus preguntas. Lo demás no lo entiende, y lo dice.

No hay comprensión semántica. No hay modelo. Cada frase de Lingua es una plantilla, y el mensaje del estudiante no llega a ningún *prompt*, así que no puede darle instrucciones.

## 2. Cinco clases de turno

| Clase | Cuándo | Qué hace |
|---|---|---|
| `safety` | La capa de seguridad lo tomó, antes que nada | Respuesta de seguridad. El ejercicio espera en su paso |
| `valid` | **Todo** el mensaje es una respuesta aceptada | Reacción y siguiente pregunta |
| `error` | Todo el mensaje es un error conocido, o una reescritura conocida lo vuelve válido | Corrige, explica, repite la pregunta |
| `question` | Pregunta de idioma con respuesta cerrada: significado, cómo se dice, repetir, ayuda, quién eres | Responde, repite la pregunta. Palabra fuera de lista: no adivina ni la repite |
| `not_understood` | Todo lo demás, dañino o no | No reacciona: repite la pregunta, luego el modelo, luego una elección, luego avanza |

**Coincidencia con el mensaje entero.** Una frase no puede colarse dentro de una respuesta aceptada.

**Recuperación.** Intento 1: la pregunta otra vez. Intento 2: una respuesta modelo. Intento 3: dos opciones. Después: siguiente pregunta.

**Situaciones delicadas.** Texto que no parece el ejercicio recibe además «soy una herramienta, habla con alguien de confianza». Si responde «triste» o «mal» a «¿cómo estás?», acepta la respuesta sin celebrar y añade una línea amable.

**Límites.** 120 caracteres y 14 palabras. Más allá de 9 palabras no parece una respuesta.

**Lo abierto no se muestra.** Nombres y lugares nunca vuelven al estudiante: la corrección usa una muestra («Mi nombre es Ana.»). Una forma ambigua («I'm Sad») exige mayúscula y una palabra que no sea cotidiana.

**Evidencia.** Practicar aquí no se registra en el modelo del estudiante. La respuesta incluye si fue independiente, para usarlo después si hay evidencia de que sirve.

## 3. Catálogo

6 escenarios Pre-A1 por curso, 36 preguntas en total. A1, cerrado: `en_a1_routine`, `es_a1_vida`, `es_a1_dia`. El servidor rechaza un id cerrado como si no existiera.

Fuera de un escenario, el chat guiado de la fase 4 sigue. Cambio: la respuesta genérica («Thanks. Tell me one more thing.») fingía seguir al estudiante; ahora dice que solo revisa frases cortas y ofrece una situación.

## 4. Evaluación (separada de la regresión)

- **Regresión:** `tests/test_guided_scenarios.py`. Prueba que el comportamiento se mantiene, no que generaliza.
- **Independiente:** `tests/guided_eval/`. Un autor que solo vio las 36 preguntas escribió 220 ítems de desarrollo y 440 sellados. Detalle y límites: `tests/guided_eval/README.md`.
- El conjunto sellado se midió **después** de ajustar con desarrollo. Ninguna regla salió de él.

| Medida (ambos cursos) | Desarrollo (ajustado) | **Sellado** |
|---|---|---|
| Respuestas válidas aceptadas | 96,6 % | **63,1 %** |
| Correcciones falsas a una respuesta válida | 0,0 % | **0,0 %** |
| Errores detectados | 81,5 % | **61,8 %** |
| Errores aceptados como válidos | 5,6 % | **7,3 %** |
| Correcciones detectadas con las palabras esperadas | 97,7 % | **94,1 %** |
| Preguntas de idioma respondidas | 81,8 % | **40,9 %** |
| Mensajes ajenos tratados como respuesta | 0,0 % | **0,0 %** |
| Mensajes de seguridad con respuesta de seguridad | 90,9 % | **52,3 %** |
| Mensajes de seguridad tratados como respuesta | 0,0 % | **0,0 %** (0 de 44) |

Por curso, en sellado: inglés 63,6 % válidas y 60,0 % errores; español 62,5 % y 63,6 %. Correcciones con las palabras esperadas: inglés 100 %, español 88,6 %.

**Conjunto sellado de seguridad de la fase 4, enviado a los escenarios** (294 dañinos): respuesta de seguridad 35,0 %; no entendido 65,0 %; **tratado como respuesta 0 de 294**. Detección por tipo: directo 67 %, mezcla de idiomas 65 %, manipulación 37 %, ofuscado 38 %, reformulado 28 %, contextual 9 %, indirecto 5 %. De 173 legítimos, 4 recibieron respuesta de seguridad.

Fuera de escenarios, el mismo conjunto: detección 35,4 % en inglés y 39,7 % en español; respuesta insegura 0 %; falsos positivos 2,3 % y 0,8 %.

## 5. Qué significa

- **Lo que mejoró de verdad.** Dentro de un escenario, un mensaje dañino no se confunde con una respuesta. Se cerró el límite de la fase 4: una frase dañina con palabras comunes ya no recibe un turno normal. Eso viene de la estructura, no de reconocer el daño.
- **Lo que sigue igual.** La detección no mejoró: sigue en 35 %, y 5 % en crisis indirectas. Una persona en crisis indirecta recibe casi siempre «no puedo seguir eso» más el aviso, no apoyo específico.
- **El costo real.** Una de cada tres respuestas correctas de un estudiante recibe «no entendí». La distancia de 96,6 % a 63,1 % prueba que las listas se ajustan a lo visto. El estudiante pierde tiempo, no seguridad, y a la segunda vez ve un modelo. Es la debilidad educativa principal. Se reduce con frases reales de estudiantes, no con más reglas escritas por mí.
- **Preguntas de idioma: 41 %.** Muchas llegan en el idioma del estudiante con formas que el catálogo no cubre.

## 5b. Fase 6

Ajuste solo con conjuntos de desarrollo (v1 y un v2 nuevo, de otro autor ciego). Medido después: sellado v1 válidas 69,9 %, preguntas 61,4 %; **sellado v2** (480) válidas 75,5 %, correcciones falsas 0,9 %, errores 61,5 %, preguntas 63,9 %, seguridad manejada **29,2 %** (desarrollo 87,5 %), dañinos como respuesta 0 de 48. Las reglas de crisis indirecta no generalizan; la contención estructural sí. Nuevos: preguntas en el idioma del estudiante, «eso responde a otra pregunta», categoría `being_harmed`, corrección ortográfica solo de errores de tecleo.

## 6. Qué no se debe decir

- Que el tutor entiende al estudiante.
- Que es seguro para chat libre.
- Que 0 % significa que nunca fallará. Significa 0 en estas muestras, con esta definición.
