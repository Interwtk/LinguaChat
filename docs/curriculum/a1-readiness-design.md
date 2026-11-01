# A1 — diseño de preparación (readiness), hito y transición

> **Estado (fase 5 / P4, 2026-10-31):** preparado, **inactivo**. A1 sigue
> `contentStatus: 'partial'`, `available: false`. Nada de este documento se puede
> alcanzar desde la aplicación. Abrir A1 exige la decisión explícita del propietario
> (`LC-PROD-002`). Las fuentes de verdad mandan: `a1-blueprint.json` →
> `a1-authoring-contract.md` → `a1-map.md` → runtime y tests.

## 1. Diagnóstico de lo que existe

| Pieza | Dónde | Lo que hace hoy | Lo que falta para A1 |
|---|---|---|---|
| `MILESTONE_LEVELS` | `src/learning/engine/learnerModel.js` | `['pre_a1']`: el producto **solo registra** el hito de Pre-A1. Los tests de los arcos A1 lo afirman. | No cambia en esta fase. |
| `PRESERVED_MILESTONE_LEVELS` (P4) | mismo archivo | `['pre_a1','a1']`. Sanear y fusionar **conservan** un hito `a1` si su `evidenceVersion` empieza por `a1.`. Así un modelo restaurado, migrado o fusionado entre pestañas no lo pierde. | Nada lo escribe en el producto. |
| `levelMilestones` | modelo del alumno | Forma `{graduatedAt, evidenceVersion, source}`. Es idempotente y, al fusionar, gana la fecha más antigua. | — |
| Readiness Pre-A1 | `src/learning/curriculum/readiness.js` | Umbrales propios de Pre-A1 (`independentEvidencePerCanDo`, `MAX_OVERDUE_REQUIRED_REVIEWS`, `MAX_ASSISTANCE_IN_EVIDENCE`). | **No se copian** a A1, salvo las dos reglas que el blueprint manda heredar (abajo). |
| `exitCriteria` | `docs/curriculum/a1-blueprint.json` | Cinco dimensiones y tres no-criterios. | Los números de dos dimensiones están **sin calibrar a propósito**. |
| Planificador | `src/learning/engine/session.js` | `buildSessionPlan` es neutral respecto al nivel. Con los episodios de los dos niveles, tras Pre-A1 propone el primer episodio de A1 (probado en un banco aislado). | — |
| Home / identidad / progreso | `TodayView.jsx`, `CompletedEpisodes.jsx`, `LearningSummaryCard.jsx`, `JourneyRail.jsx`, `SetupFlow.jsx` | Usan `playableLevelId()`, que es el **primer nivel abierto global**, no el nivel del alumno. `CompletedEpisodes` lo fija al cargar el módulo. | Con dos niveles abiertos, un alumno graduado seguiría viendo Pre-A1. Hace falta un «nivel actual del alumno» derivado del hito. Es un **cambio de producto: BLOQUEADO**, sin probar con A1 abierto. |
| Puertas | `levels.js` (`isLevelAvailable`), backend `level_unavailable` | El alumno que pide A1 recibe `level_unavailable` antes de cargar contenido. | Sin cambios. |
| Guardia | `scripts/check-a1-blueprint.mjs` | Prohíbe `deriveA1Readiness`, `a1Readiness` y `levelMilestones.a1` en `src/`. | Se mantiene. Por eso el evaluador vive en `linguachat-frontend/prepared/`. |

## 2. El evaluador aislado — `linguachat-frontend/prepared/a1Readiness.js`

Está fuera de `src/`: ningún archivo de producto lo importa y Vite nunca lo empaqueta. `check-bundle-boundaries` (6c) lo comprueba sobre el build real: ningún fragmento contiene `a1.v0-uncalibrated`, `deriveA1Readiness` ni `pending_calibration`, y nada en `src/` importa `prepared/`.

### 2.1 Criterios estructurales (el blueprint los dice exactamente)

| Dimensión del blueprint | Implementación | Motivo si falla |
|---|---|---|
| `curriculumCompleteA1`: los 21 episodios completados al menos una vez | `episodes[id].status === 'completed'` | `curriculum_incomplete` |
| Capacidades requeridas producidas sin ayuda (las 13) | `canDo.independentSuccesses ≥ 1` o algún ítem productivo propio con `independentCorrect ≥ 1` | `capability_not_produced_unaided` |
| Conversaciones integradas sin ayuda («al menos la de cierre») | una ejecución de un episodio del arco `making_arrangements` con `independentEvidence` y una ayuda dentro de `MAX_ASSISTANCE_IN_EVIDENCE`, la misma regla de Pre-A1 | `no_unaided_closing_conversation` |
| Salud de repaso: regla de Pre-A1 «extendida a la unión, no reemplazada» | repasos vencidos sobre los ítems requeridos de Pre-A1 ∪ A1 ≤ `MAX_OVERDUE_REQUIRED_REVIEWS` | `reviews_overdue` |
| Ninguna capacidad requerida frágil | si hay intentos, ítems al menos en `practicing` y alguno en `can_use` | `capability_fragile` |
| Amplitud: evidencia reciente de ≥ 5 de las 7 familias | familias de `skillFamilies`, copiadas y verificadas contra el blueprint | `evidence_from_too_few_skill_families` |

No-criterios del blueprint que se respetan: no exige «todo ítem en `can_use`», no da puntuación de 0 a 100, y completar un episodio no cuenta como dominio.

### 2.2 Calibración: sin inventar

El blueprint deja dos números para «cuando haya evidencia de recorridos reales»:

- `unaidedProductionsPerCapability`: cuántas producciones sin ayuda por capacidad;
- `recentEvidenceDays`: qué significa «reciente».

**No tienen valor por defecto.** Sin un objeto `calibration`, el mejor estado posible es `pending_calibration`.

> Nota: cada capacidad del blueprint trae `evidence.independent` (2 o 1). Es la **oportunidad de evidencia planificada en el diseño de episodios**, no un umbral de salida calibrado. Puede ser un candidato a calibrar, pero no se usa como umbral.

### 2.3 Estados y razones

| Estado | Significado | ¿Puede registrar el hito? |
|---|---|---|
| `insufficient` | Falla al menos un criterio estructural. Cada razón trae los ids exactos. | no |
| `pending_calibration` | Se cumple la estructura y faltan umbrales calibrados (se listan en `uncalibrated`). | no |
| `verifiable` | Se cumplen la estructura y una calibración explícita. | **solo** si `levelOpen === true`; hoy es `false` |

Si existe calibración y no se alcanza, la razón es `below_calibrated_threshold`.

### 2.4 Esquema del hito, compatible con migración

```json
{ "levelMilestones": { "pre_a1": { "graduatedAt": "…", "evidenceVersion": "pre_a1.…", "source": "evidence" },
                       "a1":     { "graduatedAt": "…", "evidenceVersion": "a1.v0-uncalibrated", "source": "evidence" } } }
```

- `evidenceVersion` con prefijo de nivel. Un `a1` etiquetado con otra versión se descarta.
- Al fusionar entre pestañas y dispositivos gana la fecha más antigua, en ambos sentidos.
- Registrar es idempotente: repetir la graduación no cambia nada.
- Un modelo antiguo sin campos A1 se lee como `insufficient`, nunca como error.
- `reconcileLevelMilestones`, que es solo de Pre-A1, ni borra ni reescribe un hito `a1`.
- Retroceder a código anterior: un hito `a1` lo ignora el código de la fase 4, que solo conservaba `pre_a1`. No es pérdida de aprendizaje: el hito se recalcula a partir de la evidencia.

## 3. Pruebas de transición — `scripts/check-a1-readiness.mjs` (12/12, en `check:all`)

Alumnos sintéticos recorren el currículo real por la ruta de herramientas (la misma `playEpisode` de las suites de arcos):

1. Las dimensiones del evaluador coinciden con el blueprint: familias, arcos, amplitud, no-criterios.
2. Alumno nuevo: `insufficient` con razones; A1 cerrado.
3. **Termina Pre-A1:** se gradúa de Pre-A1 exactamente igual que antes y A1 sigue cerrado (`level_unavailable`).
4. **Evidencia incompleta:** un alumno asistido recibe la lista exacta de lo que falta.
5. Alumno fuerte en todo A1, sin calibración: nunca pasa de `pending_calibration`.
6. **Necesita repaso:** tras meses fuera, los repasos vencidos vuelven como razón.
7. Con calibración de prueba explícita: `verifiable`, y aun así no registra nada con A1 cerrado.
8. **Banco aislado con A1 hipotéticamente abierto:** un único hito, idempotente; gana la fecha más antigua; Pre-A1 intacto; los **hitos duplicados** entre dispositivos se fusionan; el **progreso restaurado o migrado** lo conserva; uno mal etiquetado se descarta; la reconciliación del producto no lo toca.
9. **Cambio de cuenta A → B → A:** B empieza sin hito y sin propuesta; A lo conserva al volver.
10. **Formato antiguo:** `insufficient`, sin error.
11. **Dos niveles abiertos en el banco:** el planificador continúa hacia el primer episodio de A1.
12. Fuera del producto: no está en `src/`, no se importa y no aparece en la configuración del build.

La calibración usada en los tests (`{unaidedProductionsPerCapability: 1, recentEvidenceDays: 120}`) está marcada como **valor de prueba, no umbral de producto**.

## 4. Matriz de aceptación: las 5 capacidades A1 sin reutilización

Datos de `pre-a1-a1-readiness-matrix.md` (runtime) y de `a1-blueprint.json` (`canDos`, `reuseMatrix`). En el runtime, **ningún otro episodio reutiliza** estas cinco: la columna de transferencia vale 0. El blueprint sí planifica reutilización en tres de ellas; esa reutilización todavía no está construida.

| Capacidad | Alcance | Patrones | Plan del blueprint (I = introducida, R = reutilizada, C = consolidada) | Runtime hoy | Riesgo de evaluación |
|---|---|---|---|---|---|
| `say_when_something_happens` | required | `time_at_pattern`, `part_of_day_pattern` | I en daily_rhythm · R en paying_and_choosing · C en making_arrangements | `at_seven`: 4 abiertas / 2 de recuerdo / 0 de transferencia | Hora y parte del día; formatos de hora variantes |
| `buy_something` | required | `how_much_pattern`, `price_pattern` | I/C en paying_and_choosing | `buying_it`: 3 / 2 / 0 | Evaluación `hybrid`: cantidades y precios variantes |
| `say_what_you_can_do` | required | `can_ability_pattern` | I en what_you_can_do · C en making_arrangements | `i_can_i_cant`: 3 / 2 / 0 | Separar el *can* de habilidad del *can* de petición («Can you repeat, please?» ya existe en Pre-A1) |
| `ask_someone_about_ability` | should | `can_you_ability_pattern` | I en what_you_can_do · R en making_arrangements | `can_you`: 4 / 2 / 0 | El mismo, en pregunta |
| `ask_about_getting_somewhere` | should | `where_is_pattern` | I en finding_your_way | `how_do_i_get_there`: 2 / 2 / 0 | Evaluación `hybrid`; contexto propio |

### Criterios de aceptación propuestos (estructurales: ninguno inventa un umbral numérico)

Cada capacidad, antes de que A1 pueda abrirse:

1. **Transferencia:** al menos una producción abierta, en un episodio **distinto** del que la introduce y en otro contexto, evaluada por el evaluador ya existente. Para las tres con plan de reutilización, en los arcos que nombra el blueprint. Para `buy_something` y `ask_about_getting_somewhere` el blueprint no planifica reutilización: decidirlo es **decisión curricular del propietario**.
2. **Recuerdo diferido:** al menos un paso de recuerdo a ≥ 1 día, que ya existe (2 por capacidad), registrado como independiente solo sin modelo visible.
3. **Contraejemplos del evaluador:** casos negativos que demuestren que no acepta la forma vecina. Por ejemplo, *can* de petición presentado como habilidad, precio sin cantidad, o parte del día sin hora cuando se pidió la hora.
4. **Ayuda frente a independencia:** pista o modelo = asistido. Ya lo garantiza el motor.
5. **Recorridos `LC-PED-002`:** ≥ 20 recorridos con forma de alumno que incluyan las cuatro anteriores.

**No se implementó ninguno de los cinco** en esta fase: el mandato prohíbe alterar episodios integrados o evaluadores. Añadir reutilización es trabajo de **contenido**, en una PR propia separada de las traducciones (`CLAUDE.md`).

## 5. Qué falta para activar A1 (orden sugerido)

| # | Requisito | Tipo | Autorización |
|---|---|---|---|
| 1 | Reutilización y transferencia de las 5 capacidades (§4) | contenido | propietario + revisión docente |
| 2 | Revisión nativa de las traducciones de los 21 episodios | contenido | propietario |
| 3 | `LC-PED-002` sobre el head final de A1 | QA pedagógica | — |
| 4 | **Calibrar** `unaidedProductionsPerCapability` y `recentEvidenceDays` con recorridos reales (piloto, ver `docs/research/pre-a1-pilot-protocol.md`) | datos reales | consentimiento + propietario |
| 5 | «Nivel actual del alumno» derivado del hito en Home, identidad, archivo y progreso, en lugar de `playableLevelId()` global | producto | propietario |
| 6 | Mover el evaluador de `prepared/` a `src/`, retirar la guardia de `check-a1-blueprint`, añadir `a1` a `MILESTONE_LEVELS` | motor | propietario (`LC-PROD-002`) |
| 7 | `available: true` en `levels.js` | decisión | **propietario, explícita** |
| 8 | Dos ciclos limpios de QA completos tras 1–7 | QA | — |

Lo que **no** debe hacerse: abrir A1 porque «todo pasa» o porque «hay contenido» (`CLAUDE.md`), ni copiar los umbrales de Pre-A1.
