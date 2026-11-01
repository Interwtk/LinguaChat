# Contrato del evaluador intercambiable — `lingua-evaluator/1`

> **Estado (fase 5 / P4, 2026-10-31):**
> - Contrato, validador, implementación de referencia y ruta segura escritos y probados.
> - **No hay ningún proveedor comercial conectado.** `evaluate_safely` todavía no está cableado a `/chat`; cablearlo es un paso aparte que requiere autorización.
> - Los adaptadores guionizados existen **solo en los tests**, con el nombre `ScriptedTestAdapter` / `scripted_test_tool`, y no representan inteligencia alguna.
>
> Código:
> - `linguachat-backend/ai/evaluator_contract.py`
> - `linguachat-backend/ai/evaluator_adapters.py`
> - `linguachat-backend/tests/test_evaluator_contract.py` (139 pruebas)
> - `linguachat-frontend/scripts/check-chat-observations.mjs` (escenario P4)

## 1. Principio

Un evaluador responde a una sola pregunta: **¿qué hay en este texto del alumno respecto a este objetivo pedagógico?**

Devuelve hallazgos, una explicación, pistas y el *tipo* de evidencia que podría ser el turno. Nada más.

**Nunca concede dominio.** Tampoco puede:
- cambiar el nivel;
- mover XP;
- abrir contenido;
- registrar hitos;
- alterar el currículo.

Esos campos no existen en el esquema (`extra="forbid"`), y una respuesta que los traiga se rechaza entera.

Lo que vale un turno para el aprendizaje lo decide después el motor de aprendizaje, en el dispositivo del alumno y con su procedencia (`chatEvidence.js`). Esa decisión depende de:
- el momento;
- si fue tras una corrección;
- si hubo ayuda;
- si el contexto es nuevo.

## 2. Petición — `EvaluatorRequest` (cerrada)

| Campo | Tipo | Notas |
|---|---|---|
| `contract_version` | `"lingua-evaluator/1"` | versión explícita |
| `learner_language` | uno de los 8 idiomas auxiliares | idioma de las explicaciones |
| `target_language` | `"en"` | |
| `level` | `pre_a1` … `c2` | con `purpose="learner"` solo se admite un nivel **abierto** (hoy `pre_a1`) → `level_not_available` |
| `capability` | id cerrado | 13 de Pre-A1 + 16 de A1 (verificados contra `preA1Map.js` y `a1-blueprint.json`) + reglas de chat + `free_conversation` → `unknown_capability` |
| `modality` | `written` \| `listening` | el habla no se evalúa por diseño |
| `objective` | texto ≤ 200 | |
| `response_text` | 1…2000 | el texto del alumno |
| `assistance` | `none` / `hint_shown` / `model_shown` / `retry` / `suggestion_sent` | estado de ayuda |
| `prompt_text` | ≤ 400, opcional | **único contexto autorizado**: lo último que dijo Lingua |
| `purpose` | `learner` \| `tooling` | `tooling` permite a los bancos nombrar un nivel construido pero cerrado |

**No viaja:**
- identidad;
- correo;
- historial;
- memoria personal;
- datos de otros turnos.

Cualquier campo adicional hace fallar la construcción.

## 3. Resultado — `EvaluatorResult` (cerrado)

| Campo | Valores |
|---|---|
| `verdict` | `error_found`, `no_issue_detected`, `ambiguous`, `not_evaluable`, `off_objective` |
| `certainty` | **categoría**: `confident` / `tentative` / `unsure`. Nunca es una probabilidad: ningún proveedor tiene una calibrada. |
| `findings[]` (≤ 6) | `rule` (cerrada), `original` (debe aparecer en el texto del alumno), `replacement`, `justification` (8–240, **obligatoria**), `certainty` |
| `explanation` | ≤ 400, en el idioma del alumno |
| `hints[]` | ≤ 3 |
| `next_activity` | `continue`, `rewrite`, `fill_blank`, `guided_retrieval`, `explain_again`, `none` |
| `evidence.kind` | **lo que se puede registrar:** `error`, `accepted_under_criterion` (con `criterion` obligatorio). **Lo que no es dominio:** `ambiguous`, `assisted`, `copied`, `not_evaluable`, `insufficient` |
| `source` | `local_rules` \| `provider` |

`retrieval`, `transfer`, `mastery`, `can_use`, `independent`… **no existen como tipo de evidencia del evaluador**. El recuerdo diferido y la transferencia dependen de cuándo y dónde reaparece una forma; eso lo decide el modelo del alumno.

## 4. Validación — rechazos (`RejectedResult.codes`)

| Fallo pedido | Código | Prueba |
|---|---|---|
| Campos inesperados (mastery, xp, level, milestone, unlock, curriculum, confidence numérica) | `unexpected_field` | `test_unexpected_fields_are_rejected` |
| Capacidad inexistente | `unknown_capability` (petición, **antes** de llamar) | `test_unknown_capability_and_closed_level_…` |
| Nivel no disponible | `level_not_available` (antes de llamar) | ídem |
| Dominio concedido sin evidencia | `malformed` (tipo de evidencia fuera del conjunto) / `acceptance_without_criterion` | `test_evidence_cannot_claim_mastery…` |
| Texto manipulador como instrucción | `manipulative_text` (explicación, pistas, justificaciones) | `test_manipulative_text_is_rejected` |
| Pérdida de contexto | `context_lost` (responde a otra capacidad) | `test_context_loss_is_rejected` |
| Correcciones contradictorias | `contradictory_corrections` | ✓ |
| Hallazgos sin justificación / inventados / que no cambian nada / regla desconocida | `malformed`, `finding_not_in_response`, `correction_changes_nothing`, `unknown_rule` | `test_unjustified_or_invented_findings…` |
| Veredicto incoherente | `error_without_finding`, `finding_without_error_verdict`, `evidence_contradicts_verdict` | ✓ |
| Idioma incorrecto | `wrong_language` | `test_wrong_language_is_rejected` |
| Fuera del objetivo pedagógico | `off_objective` solo puede llevar evidencia `not_evaluable`; si no, `evidence_contradicts_verdict` | `test_off_objective_answer_is_not_evidence` |
| Error de red | incidente `network_error` | `test_failures_fall_back…` |
| Timeout | incidente `timeout` (presupuesto por defecto: 4 s) | `test_timeout_falls_back_within_budget` |
| Respuesta vacía / no objeto | `empty_response`, `not_an_object` | ✓ |
| Versión distinta | `malformed` | ✓ |

**Ayuda ≠ independencia.** Si la petición trae ayuda, el validador degrada cualquier `accepted_under_criterion` o `insufficient` a `assisted`, diga lo que diga el proveedor.

**Detección de idioma.** Antes de juzgar, el validador aparta el material citado y las palabras del propio alumno. Después:
- en japonés y árabe exige la escritura propia;
- en los idiomas latinos compara palabras funcionales del idioma frente a las del inglés.

## 5. Ruta segura — `evaluate_safely(adapter, request, timeout_s)`

1. Comprueba la petición: capacidad y nivel. Si falla, devuelve `used="refused"` sin llamar a nadie.
2. Llama al adaptador en un hilo, con presupuesto de tiempo.
3. Valida la respuesta.
4. Ante **cualquier** fallo (rechazo, timeout, red, excepción o respuesta vacía), responde la **referencia local** y registra el incidente.

`SafeEvaluation` devuelve `{result, used, incidents, elapsed_s}`.

Un proveedor nunca puede, por diseño:
- cambiar el currículo;
- abrir niveles;
- alterar XP;
- conceder hitos.

En el frontend, `safeAnalysis` es una lista blanca. El escenario P4 de `check-chat-observations` envía una respuesta hostil con mastery, xp, level, levelMilestones, unlock y learningState, y comprueba que el modelo del alumno (canDo, ítems, hitos) **no cambia**.

## 6. Límites por responsabilidad

| Ámbito | Lo que el evaluador puede | Lo que no |
|---|---|---|
| Generación | explicación ≤ 400 caracteres y ≤ 3 pistas, en el idioma del alumno | texto en inglés de práctica nuevo que se registre como evidencia; instrucciones al sistema |
| Evaluación abierta | hallazgos con justificación sobre el texto real | juzgar habla, pronunciación o identidad |
| Selección pedagógica | **proponer** `next_activity` | elegir método, dificultad o repaso: lo deciden `chooseTeaching` y el planificador a partir de la evidencia |
| Memoria | — (solo ve el turno y `prompt_text`) | leer el historial o datos personales |
| Validación | — | saltarse `validate_result` |
| Errores y fallback | — | dejar al alumno sin respuesta: siempre responde la referencia |
| Privacidad | — | recibir identidad, correo o historial (el esquema lo impide) |
| Presupuesto | timeout por llamada (4 s); sin reintentos automáticos | costes: **ningún servicio de pago activo** |
| Latencia | la referencia local: ~0,05 ms por turno de media (1.360 evaluaciones, máquina local, medición puntual en P4, no es un SLA) | — |

## 7. Implementación de referencia — `LocalReferenceEvaluator`

Es el motor de reglas gratuito y determinista de siempre (`assess`, `grammar_check`, `tutor_i18n`), hablando el contrato.

**Qué puede hacer:**
- pasado irregular sobrerregularizado («goed»);
- marcador de pasado con verbo en presente;
- tercera persona con sujeto pronombre;
- artículo a/an por sonido;
- frases fijas de principiante («how you are», «me good»…);
- explicaciones cortas en 8 idiomas;
- reconoce el idioma propio del alumno;
- registra el uso correcto de formas irregulares como `accepted_under_criterion` con criterio explícito.

**Puerta de calidad sobre la referencia** (`test_evaluator_contract.py`, sección *quality gate*):

| Dimensión | Corpus | Resultado |
|---|---|---|
| Falsos positivos | 60 frases válidas, varias elegidas para tentar reglas ingenuas | 0 |
| Falsos negativos (errores conocidos, tramo y reemplazo exactos) | 8 | 8/8 |
| Errores combinados | 3 | 3/3 |
| Contextos nuevos (fuera del corpus) | 4 | 4/4 |
| Variantes (mayúsculas, orden, puntuación) | 3 | aceptadas con criterio |
| Ambigüedad / demasiado poco («Hi», «ok», «?») | 3 | `not_evaluable` / `insufficient` |
| Traducción (el alumno escribe en su idioma) | es, fr, de | `not_evaluable`, sin corrección en inglés |
| Principiantes | 2 frases fijas | corregidas |
| Cambio de idioma de explicación | 8 idiomas × 8 errores | todas válidas, ≤ 400 caracteres, ≤ 4 frases |
| Ayuda frente a independencia | 4 estados de ayuda | siempre `assisted` |
| Recuerdo diferido / transferencia | — | no son decisión del evaluador (comprobado en el tipo) |
| Correcciones innecesarias | — | cubierto por los falsos positivos y por `correction_changes_nothing` |

**Límites conocidos, con prueba propia y sin ocultar:**
- **Falso negativo:** «My sister like cats.» no se detecta, porque la regla de tercera persona solo conoce sujetos pronombre. El resultado es honesto: `unsure` / `insufficient`, sin elogio ni aceptación.
- **Español límite:** «Ayer fui a la escuela con mi hermano.» no se reconoce como español (3 de 8 palabras funcionales). Aun así no se corrige ni se acredita.
- Las reglas son pocas. Que no salte ninguna **no es** un veredicto de corrección.

## 8. Qué necesitará un modelo más fuerte

1. **Pasar `validate_result` en cada turno**, sin excepción, y la misma puerta de calidad con un umbral **igual o mejor que la referencia**: 0 falsos positivos en el corpus válido y 100 % de los errores conocidos.
2. Un corpus ampliado y revisado por docentes, con frases reales de alumnos obtenidas con consentimiento. Hoy solo hay corpus sintético.
3. **Medir** el acuerdo frente a la referencia caso por caso, incluidos los rechazos (`CLAUDE.md`, «backend or evaluator»).
4. Autorización escrita del propietario. Además: `provider_policy.py` seguiría impidiendo que una clave active el proveedor por sí sola.
5. Presupuesto y latencia medidos con tráfico de prueba, nunca de alumnos reales sin consentimiento.
6. Un plan de privacidad: el contrato ya limita lo que sale, pero el proveedor concreto necesita su propia revisión.

## 9. Lo que no se hizo, a propósito

- No se conectó ningún proveedor: ni OpenAI, ni Anthropic, ni Gemini, ni ningún otro.
- No se cableó `evaluate_safely` a `/chat`. El endpoint sigue con su ruta actual (motor local, con `provider_policy`).
- No se cambió el `EvaluationResult` de episodios (`ai/schemas.py`, con `confidence` numérica). Migrarlo a este contrato es un paso posterior.
