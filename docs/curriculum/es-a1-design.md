# Español A1 para angloparlantes — primer diseño curricular

> 2026-11-04 · rama local `beta/2026-11-es-for-en`.
> **Fase 5:** el primer arco (`es_a1_vida`, 3 lecciones, `es/a1Content.js`) está construido, **cerrado** y sin revisión humana, con el mismo motor. El resto sigue siendo diseño. Nivel `es_a1` en `available: false`. Identidad: `docs/architecture/course-level-identity.md`.
> **Sin revisión humana.** Autoría IA. Lo marcado *propuesta* no tiene fuente en el repo; un docente de ELE debe contrastarlo con el Plan Curricular del Instituto Cervantes, que aquí no se consultó.
> No traduce inglés A1. Reutiliza arquitectura común: registro de cursos, un modelo del alumno, ids `es:`, evaluador por lengua.

## 1. Punto de partida (verificado)

| Pieza | Hoy | Fuente |
|---|---|---|
| Español Pre-A1 | 12 episodios, 136 pasos, 47 abiertas, 21 recuerdos, 10 `variation`, 51 ítems | `es/skeleton.js`, `es/preA1Content.js` |
| Ya enseñado | me llamo, soy, estoy bien, soy de, me gusta, quiero, 1–10, el/la, un/una, ¿me da…?, ¿puede repetir?, ¿qué significa?, ¿cómo se dice? | `ES_VOCAB` |
| Evaluador | 23 `evalKind`, 82 claves `es.err.*`, 70 sustantivos con género; local, determinista | `es/evaluator.js`, `es/evaluatorCopy.js` |
| Revisión por IA, no humana | 591 casos: válidas aceptadas 325/351, errores detectados 206/240, errores aceptados 12. Ya es regresión, no mide frases nuevas | `es-pre-a1-review.md` §1, `check-es-teacher-cases` |
| Salida de Pre-A1 | **No existe** readiness ni hito de español | sin referencias en `src/learning/courses/` |

## 2. Qué de inglés A1 no se transfiere

Se reutiliza objetivo comunicativo y forma de arco (`a1-blueprint.json`). No estructura lingüística.

| Patrón EN A1 | Por qué no sirve | Tratamiento ES (*propuesta*) |
|---|---|---|
| `i_do_life_pattern`, `do_you_question_pattern` | persona en la desinencia; sin auxiliar | presente yo/tú desde arco 1; ¿Trabajas? |
| `-s` en A2 (blueprint) | 3.ª persona no se aplaza; da `usted` gratis | él/ella/usted productivo en A1 |
| `he_she_is_pattern` | sin artículo con profesión; género | Es profesora |
| `possessive_pattern` | concuerda con lo poseído; `su` ambiguo | mi/mis, tu/tus, su/sus |
| `time_at_pattern`, `day_of_week_pattern` | artículo, concordancia; día sin preposición | a la una, a las siete; el viernes, los viernes |
| `where_is_pattern` | triángulo nuevo ser/estar/hay | ¿Dónde está el banco? frente a ¿Hay un banco? |
| `how_much_pattern`, `numbers_11_100` | concordancia, diptongo, formas propias, tildes | cuesta/cuestan; dieciséis, veintiún/veintiuna, cien |
| `this_one`, `that_one` | género | este/esta, ese/esa, frente a esto |
| `can_ability_pattern` | una forma inglesa, dos verbos | sé nadar frente a puedo ir |
| `what_does_mean`, `how_do_you_say` | español los enseñó en Pre-A1 (`no_entiendo`) | sin lección; solo reutilización |
| `get_up`, `have_breakfast` | reflexivo; verbo único | me levanto, desayuno |
| `arrange_pattern`; reuso de `make_plan` | «quedar» es regional; ES Pre-A1 omitió `make_plan` | ¿Nos vemos…? se enseña, no se reutiliza |

## 3. Arcos, lecciones y capacidades (*propuesta*: 6 arcos, 20 lecciones, 15 capacidades)

Techo heredado (`a1-map.md` §3): una situación, un tema, 10–12 turnos, reparación disponible. Ids con prefijo `es:`.

| Arco | Lecciones | Capacidades (el alumno puede…) | Foco |
|---|---|---|---|
| `es_a1_vida` | `trabajo_estudio`, `y_tu_trabajas`, `donde_vives` | `talk_about_life`, `ask_about_life` | yo/tú, -ar/-er/-ir |
| `es_a1_dia` | `mi_dia`, `a_las_siete`, `los_lunes` | `talk_about_routine`, `say_when` | reflexivo en bloque, hora, días, frecuencia |
| `es_a1_gente` | `este_es`, `es_profesora`, `mi_familia`, `tu_o_usted` | `introduce_someone`, `say_about_someone`, `choose_register` | 3.ª persona, género, posesivos, registro |
| `es_a1_lugares` | `donde_esta`, `hay_un`, `cerca_de` | `ask_where`, `say_where` | estar y hay, al/del, un solo paso |
| `es_a1_compras` | `de_once_a_cien`, `cuanto_cuesta`, `este_o_ese`, `en_la_tienda` | `use_big_numbers`, `ask_price`, `buy_something` | números, precio, adjetivos, usted en tienda |
| `es_a1_planes` | `se_nadar`, `nos_vemos`, `hasta_el_viernes` | `say_ability`, `ask_ability` (should), `arrange_to_meet` | saber y poder, cita, cierre integrado |

- 14 required, 1 should. Familia es contexto: tres relaciones neutras y salida sin familia (`a1-map.md` §5). Sin colores ni listas de profesiones.
- **Fuera:** pretérito, futuro, *porque*, direcciones de varios pasos, datos reales de contacto, edad real del alumno.
- **Pretérito: no; sin justificación.** El blueprint inglés aplaza el pasado porque duplica cada patrón; aquí pesa más por conjugación y tildes. `quería` sigue reconocido como cortesía. `voy a + infinitivo`: pregunta abierta al docente; por defecto, fuera.

## 4. Vocabulario: estimación sin calibrar

≈ 55–65 ítems productivos nuevos: verbos 12–15, personas 10–12, lugares y comercio 14–16, ubicación y tiempo 12–14, adjetivos de concordancia 5–6, más días y 11–100 como 2 ítems. Más 14–16 patrones y ≈ 40–50 receptivos. Inglés A1: 50 / 46 presupuestados. Regla heredada: el Jardín no crece por forma; `trabajo`, `trabajas`, `trabaja` son un ítem con patrón. Coste real: tablas del evaluador, no palabras.

## 5. Secuencia gramatical

| Orden | Elemento | Producción |
|---|---|---|
| 1 | presente regular yo/tú | independiente |
| 2 | `me levanto`, `te levantas` en bloque; hora | independiente |
| 3 | 3.ª persona = `usted`; ser + profesión | independiente |
| 4 | concordancia de género y número; mi/tu/su | guiada → independiente |
| 5 | estar frente a hay; al/del | independiente |
| 6 | `cuestan`; este/ese | guiada |
| 7 | saber frente a poder | independiente |
| — | `vos`, `ustedes`, `vosotros`, `nosotros` salvo `nos vemos` | solo reconocer |

Reglas heredadas (`multilingual-curriculum.md` §5), a mantener:
- **Tildes:** se enseñan, no se castigan (`spellingNote`). Pares nuevos a revisar: está/esta, sí/si, él/el. `¿` nunca es error.
- **tú/usted:** ambos válidos salvo en `tu_o_usted`, donde el registro es el objetivo y se explica sin castigar.
- **vos:** siempre aceptado, solo receptivo. Exige formas `trabajás`, `podés`, `sabés`, `vivís`.
- **Regional:** modelo internacional; pares aceptados (móvil/celular, coche/carro/auto, autobús/camión/colectivo). Modelos usan `tomar`, no `coger`. Lista cerrada por revisores de España y Latinoamérica.

## 6. Errores típicos de angloparlantes

| Error | Ejemplo | ¿Lo detecta hoy? |
|---|---|---|
| ser/estar en estado y origen; gustar transitivo; género | «estoy de Chile», «yo gusto», «la libro» | sí (`es_ser_estar_*`, `es_gustar_*`, `es_gender_article`), en vocabulario Pre-A1 |
| infinitivo por conjugado | «yo trabajar» | parcial (`es_infinitive_verb`) |
| persona equivocada | «yo trabaja» | no |
| ser por estar en lugar; estar por hay | «el banco es aquí», «¿está un banco?» | no |
| artículo con profesión | «soy un profesor» | no |
| preposición calcada; hora | «en viernes», «es las dos» | no |
| concordancia de adjetivo | «la casa caro» | no |
| poder por saber | «puedo nadar» | no; a veces válido, juzga docente |

Filas «no» son hipótesis del autor; validar con respuestas reales.

## 7. Evaluación necesaria

Regla del blueprint inglés: un intent por función, variantes como subtipo. 15 `evalKind` nuevos (*propuesta*): `es_say_life`, `es_ask_life`, `es_say_routine`, `es_say_time`, `es_introduce_person`, `es_person_fact`, `es_register`, `es_ask_where`, `es_ask_exists`, `es_say_where`, `es_ask_price`, `es_buy`, `es_say_ability`, `es_ask_ability`, `es_arrange`. `es_quantity` amplía rango.

- Tabla **cerrada** de verbos × persona, no conjugador general. Concordancia solo sobre palabras conocidas.
- `notEvaluable` y precisión antes que cobertura. Solo local: el backend no evalúa español (`multilingual-curriculum.md` §5).
- Conjunto de respuestas no vistas por `evalKind`, como `check-es-unseen`, escrito por docente.

## 8. Repaso y transferencia

- Cada lección abre con `recall` `review: true` y lleva ≥ 1 paso `variation` (`courseSession.js` los usa como `course_transfer`).
- Matriz de reutilización antes de escribir: ninguna capacidad required en un solo arco. Evita el caso de `buy_something` en inglés (`en-a1-readiness-review.md` §3).
- Plan: registro vuelve en lugares y tienda; hora vuelve en `nos_vemos`; números vuelven en hora; precio vuelve en cierre; reparación plantada en cada arco.
- Crédito diferido: otra sesión (`learnerModel.js:890`). Medir además 2–7 días.

## 9. Desbloqueo desde español Pre-A1 (*propuesta*)

Dos puertas: **abrir el nivel** (decisión del propietario) y **estar listo** (derivado por alumno). Estructurales, sin número inventado: 12 lecciones completadas; producción independiente en las 12 capacidades; `es:primera_charla` y `es:en_el_cafe` sin ayuda; repasos `es:` dentro del límite; sin capacidad frágil.

Umbrales sin calibrar: no copiar `independentEvidencePerCanDo: 2` ni `MAX_OVERDUE_REQUIRED_REVIEWS: 3` sin datos. Sin calibración, máximo `pending_calibration`, como `prepared/a1Readiness.js`. El hito exige ampliar `PRESERVED_MILESTONE_LEVELS`.

**Previos a construir:** revisión nativa de Pre-A1 cerrada (`es-pre-a1-review.md`); decisión sobre `CLAUDE.md` (`claude-md-multilingual-proposal.md`); registro con niveles (§11).

## 10. Riesgos y falsación

| Riesgo | Mitigación |
|---|---|
| Sobrecarga morfológica en arco 1 | solo yo/tú; pocas formas |
| Falsas correcciones por tabla incompleta | `notEvaluable`; muestreo nativo |
| Sesgo regional | dos revisores; variantes aceptadas |
| `transform.js` sin `mini_story` | cierres como `free_reply`, o ampliar `STEP_TYPES` |
| Multiplicar español no revisado | condición previa de §9 |

**Research-before-implementation.** Problema: tras Pre-A1 no hay continuación. Evidencia medida: ninguna con estudiantes. Principios: `learning-science-foundation.md` §1, §3, §4, §6. Falsa el diseño: umbrales de `multilingual-curriculum.md` §8. Medición: recuerdo sin ayuda y muestreo nativo, no clics.

## 11. Una tercera lengua sin duplicar el motor

| Dimensión | Hoy | ¿Separada? |
|---|---|---|
| Interfaz | `user_language`, 8 locales (`language.js`) | sí |
| Explicación | el mismo `user_language` | **no, por contrato** (`languagePreferencePersistence` escribe ambas iguales) |
| Lengua aprendida | curso: `activeCourse.js`, `lc2-active-course` | sí, con residuo: `language.js` fija `TARGET_LANGUAGE` en `en`; `CourseChat.jsx` arma el suyo |
| Nivel | inglés: `levels.js`; español: un `levelId` y un `available` por curso | **no**: falta curso × nivel; hitos sin curso |
| Progreso individual | un almacén, ids `es:`, lecturas por `courseId` | sí; XP y racha compartidos a propósito |

**Atado a `es`, a generalizar antes:** `registry.js:28,94,98,103,112` (import y ramas) · `courseSession.js:36–49` (`RETRY_KIND`, `/^es:/`) · `learnerData.js:48` · `CourseSwitcher.jsx:13,39` · `CourseChat.jsx:40` · `ai/es_tutor.py` (sin contrato común de tutor).

**Copia:** `textIn` admite objetos por idioma, pero `preA1Content.js` usa cadenas inglesas planas, y `ES_HOME_COPY` y `ES_EVALUATOR_COPY` solo tienen `en`. Otro idioma de explicación exige extraer copia.

**Receta tras generalizar:** carpeta `courses/<id>/` con metadatos, contenido, evaluador y copia; entrada en `COURSES`; `auxLanguages` honesto; ids `<id>:`. Reutiliza `transform`, reproductor, sesión, planificador, modelo y `pickVoice`. Separar interfaz de explicación no hace falta y cambiaría `CLAUDE.md`.
