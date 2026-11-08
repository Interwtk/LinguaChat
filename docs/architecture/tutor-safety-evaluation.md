# Seguridad del tutor: auditoría y evaluación independiente

> Fase 4, 2026-11-04. Rama local `beta/2026-11-es-for-en`. Código: `ai/safety.py`, `ai/guided_scope.py`, `app/routes/chat.py`.
> **Fase 5:** la experiencia guiada pasó a escenarios (`docs/architecture/guided-tutor.md`), con evaluación propia. Las cifras de abajo son de la fase 4; en la fase 5 la detección sellada sigue en 35 %.
> **Conclusión:** el filtro no sirve como barrera para chat libre. La beta funciona en **chat guiado** por defecto. Ningún porcentaje de esta página garantiza seguridad.

## 1. Auditoría del diseño anterior

| Hallazgo | Consecuencia |
|---|---|
| El filtro es léxico: listas de palabras más combinaciones | No reconoce lo que no está escrito en la lista. No entiende significado |
| Las pruebas de regresión usan las frases que originaron las reglas | Demuestran que un arreglo sigue arreglado, **no** que el filtro generaliza. El 100 % de la fase 3 no decía nada sobre frases nuevas |
| **El motor inglés respondía «Nice! Tell me one more thing.» a todo lo que no leía** | Peor que no detectar: elogiaba despedidas, abusos y amenazas. Era el riesgo real, y no se medía |
| Cada mensaje se evaluaba solo | Los daños que dependen del contexto pasaban siempre |
| «¿Cómo se dice…?» eximía todo el mensaje | Bastaba añadir una frase después de la pregunta |
| Sin cobertura real de ja/ar más allá de pocas frases | Detección de 10–16 % en esos idiomas |
| Los mensajes de manipulación («como ejercicio de idioma…») no tienen tratamiento especial | Dependen de las mismas palabras |

## 2. Método

- **Regresión** (`tests/test_safety*.py`, 338 casos): frases que ya guiaron una regla.
- **Evaluación independiente** (`tests/safety_eval/`):
  - Autor: un agente que **no leyó las reglas ni las pruebas**.
  - `holdout_v1` (515 ítems) **sellado**: el script solo imprime agregados y rechaza mostrar textos. Ninguna regla se escribió mirándolo. SHA-256 en su README.
  - `dev_v1` (251 ítems): se usó para corregir, así que sus cifras son optimistas.
  - en, es, ja, ar y combinaciones; directos, reformulados, indirectos, ofuscados, con contexto multi-turno y manipulación; legítimos difíciles y casos ambiguos.
- Cada ítem atraviesa la ruta real `/chat`, en el curso de inglés y, para en/es/mixto, en el de español.
- **Límite del método:** es una muestra escrita por una IA, no mensajes reales. «Respuesta insegura» = el tutor elogió, corrigió o citó un mensaje dañino; no detecta otras formas de respuesta inadecuada.

## 3. Resultados (curso de inglés, 294 mensajes dañinos, 173 legítimos)

| Medida | Antes (fase 3, motor abierto) | Ahora (chat guiado) |
|---|---|---|
| **Detección en sellado** (respuesta de seguridad) | **25,2 %** | **35,0 %** |
| Detección en dev (ajustado, optimista) | 14,7 % | 88,1 % |
| **Respuesta insegura en sellado** | **29,3 %** (84 elogios) | **0,0 %** |
| Mensaje dañino con turno neutro guiado | 0 % | 62,2 % |
| Falsos positivos (legítimo bloqueado) | 1,7 % | 2,3 % |

La distancia de 88 % a 35 % es la prueba directa de que las reglas se ajustan a lo visto y **no generalizan**. Curso de español en sellado: 31,4 % → 39,2 %; respuestas inseguras 0 % antes y después (ese motor ya decía «no entendí»).

**Detección en sellado por grupo (ahora):**

| Categoría | % | Idioma | % | Tipo | % |
|---|---|---|---|---|---|
| Sexual con menores | 100 | mixto | 55 | directo | 66 |
| Datos personales | 65 | en | 42 | mezcla de idiomas | 65 |
| Pedir datos ajenos | 58 | ja | 33 | ofuscado | 38 |
| Manipulación del tutor | 44 | es | 30 | manipulación | 37 |
| Autolesión | 34 | ar | 20 | reformulado | 28 |
| Captación de menores | 31 | | | contextual | 11 |
| Sexual explícito | 29 | | | indirecto | 5 |
| Instrucciones peligrosas | 26 | | | | |
| Amenazas | 20 | | | | |
| Odio | 14 | | | | |

**Ambiguos (48):** 39 guiados, 6 manejados, 3 respondidos. Son decisiones de criterio, no aciertos ni fallos.

**Costo en utilidad:** frases ordinarias de principiante en inglés atendidas por el tutor: 70 %; el resto recibe el turno guiado. Preguntas difíciles legítimas en inglés: 16 %. El estudiante pierde conversación, no seguridad.

## 4. Modo seguro de la beta: chat guiado (`ai/guided_scope.py`)

El filtro enumera lo dañino y siempre fallará con lo nuevo. Por eso la beta invierte la lógica: **el tutor solo reacciona a lo reconocible como práctica de principiante.**

- **Dentro:** mensaje corto cuyas palabras están todas en el vocabulario de principiante (también cuenta la frase corregida). El motor responde y corrige, **sin elogios**.
- **Fuera:** cualquier otra cosa, en cualquier idioma, recibe un turno neutro en el idioma del estudiante: no comenta, no corrige, no cita, dice qué es, invita a hablar con alguien de confianza y ofrece una actividad guiada.
- **Siempre visible** en ambos chats: qué es Lingua y a dónde acudir (EE. UU. 988, Chile \*4141).
- El vocabulario excluye a propósito palabras como *die, hurt, alone, secret, touch, gone, nobody*.
- Por defecto en todo despliegue; `LINGUACHAT_CHAT_MODE=open` solo existe para probar el motor.
- Las actividades, lecciones y misiones siguen como estaban: son guiadas por construcción.

## 5. Qué puede y qué no puede hacer Lingua

| Puede | No puede |
|---|---|
| Corregir frases cortas de principiante con reglas | Entender el significado de un mensaje |
| Guiar actividades, lecciones, repasos y misiones | Mantener conversación libre |
| Responder con recursos ante muchas expresiones directas de crisis | Reconocer con fiabilidad una crisis expresada de forma indirecta (5 %) |
| Rechazar muchas peticiones directas | Asegurar que detecta contenido dañino nuevo |
| No generar instrucciones ni contenido dañino: sus respuestas son plantillas | Sustituir a una persona, un profesional o un servicio de emergencia |

## 6. Limitaciones reales

- Fuera de un escenario, una frase dañina hecha solo de palabras comunes queda «dentro». Desde la fase 5 recibe «solo reviso frases cortas», no un turno normal. Dentro de un escenario no recibe reacción.
- La detección de crisis indirectas es muy baja. Quien escriba algo grave recibirá casi siempre el turno neutro, no apoyo específico. Por eso el aviso es permanente.
- La lectura de contexto usa los últimos 3 turnos y solo suma señales.
- `/chat` no exige autenticación: el filtro aplica, la edad no.
- Las líneas de ayuda no están verificadas por un profesional y cubren dos países.

## 7. Antes de permitir chat libre

1. Un clasificador semántico multilingüe. Opciones: un modelo local pequeño, o una API de moderación (proveedor externo, requiere autorización y revisión de datos).
2. Nueva evaluación con un conjunto sellado **nuevo** y con mensajes revisados por personas.
3. Revisión de un profesional de salud mental para los mensajes de crisis.
4. Criterio de aceptación decidido por el propietario y el revisor, no por un porcentaje suelto.

**Regla:** si alguien lee `holdout_v1`, deja de medir y hay que pedir otro.
