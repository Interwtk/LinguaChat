# Inglés A1 — defectos pedagógicos (fase 6)

> 2026-11-07 · clon `LinguaChat-integration`, cabeza `03514a5` (inglés A1, motor y evaluador sin cambios desde `96ec410`).
> **Diagnóstico, no aprobación.** A1 sigue `contentStatus: 'partial'`, `available: false` (`src/learning/curriculum/levels.js:67`). Nada de este documento aprueba A1. Pre-A1 no se tocó.
> Rutas `src/…`, `scripts/…`, `prepared/…`: relativas a `linguachat-frontend/`. «Contenido» = episodios o copia i18n autorados; «motor» = evaluador, reproductor o QA.

## Método

- Las 52 respuestas modelo (`suggestionEn`) de pasos `free_reply`/`recall` pasaron por el evaluador real (`evaluateFree`), con el mismo contexto que arma `EpisodeShell.jsx` (`placeName`, `timeForm`, `abilityForm`, `repairKind`…).
- 222 variantes plausibles en 34 turnos (5–12 por turno). Resultado: 131 aceptadas, 54 inconclusas, 37 rechazadas. En el subconjunto que el agente considera inglés correcto y pertinente (183): **72 no aceptadas (39 %)**. Sin evaluador remoto, «inconcluso» acaba como no aceptado (`hybridEvaluation.js`, `source: 'fallback'`).
- Las variantes las escribió un agente, no un docente. No sirven como conjunto no visto (condición 5).
- Checks corridos, todos con exit 0: `check-a1-arc1…5`, `check-a1-blueprint`, `check-a1-readiness` (12/12), `check-a1-longitudinal-journeys`, `check-pedagogical-journeys` (298), `foundry/a1/*` (41/41), `check-option-order` (345). **Ninguno detecta los defectos de abajo**: los recorridos responden con una frase canónica por `evalKind` (`scripts/lib/journey.mjs:80`), no con la respuesta modelo del paso.

## Defectos

| id | dónde | evidencia | sev. | arreglo sugerido | ¿contenido? |
|---|---|---|---|---|---|
| D1 | `more_than_ten` pasos 6, 9 y 10; `evaluateUseQuantity` (`responseEvaluation.js:1259`) | Para «This ticket is 20» y «say this number: 45» acepta cualquier número: «Two.», «Five.», «Fourteen.» → OK. El modelo que muestra es siempre «Two.». Un «Forty-five.» correcto sale con `targetEvidence:false` y no acredita `numbers_11_100` (`EpisodeShell.jsx:699`); un «Five.» incorrecto sí lo acredita. No existe el rango por nivel que pide el blueprint (`intentStrategy.newSubtypesOnExistingIntents`) | alta | Rango 11–100 en A1. Comprobar `count` cuando el paso fija el número. `naturalVersion` desde `count` | motor + contenido (`count: 20/45`) |
| D2 | `see_you_on_friday` paso 2 (`makingArrangements.json:422`) | `evalKind: ask_wellbeing`, pero la instrucción dice «Say how you are» y el modelo es «I’m good, thanks.». El modelo se rechaza (`no_question`), igual que «Good, thanks!» y «Fine.». Retroalimentación: «para preguntar por la otra persona…». Es la única respuesta modelo de A1 rechazada (1/52) | alta | Cambiar a `answer_wellbeing`. Añadir un check que evalúe cada `suggestionEn` con su paso | contenido + QA |
| D3 | `how_much_is_it` 6, 9 y 10; `this_one_or_that_one` 9 y 10; `HOW_MUCH` (`responseEvaluation.js:1989`) | Rechaza «How much does it cost?», «How much?», «What’s the price?» y «How much for the ticket?» (4 de 6 variantes correctas). Dice «falta el verbo», que es falso | alta | Aceptar `how much does it/do they cost`, `how much?` y `what's the price` como variante. Corregir el diagnóstico | motor |
| D4 | `at_seven` 9 y 10, `what_does_it_mean` 9; `CLOCK_TIME` (`:1433`) | Hora solo hasta «ten». «I get up at eleven.» se rechaza con «Añade la hora: at y un número». También se rechazan «half past six», «At seven.» y «At 7 am.». Pero `more_than_ten` 8 enseña «leaves at seventeen» | alta | Aceptar de 11 a 12, `o’clock`, `half past` y respuestas elípticas «At seven.» | motor |
| D5 | Arco 6 y `when_are_you_free` 7 (`whatYouCanDo.json:112,137`; `makingArrangements.json:130`) | Las invitaciones («Can you come?», «Do you want to come dancing…?») exigen una frase de habilidad: «Yes, I can swim.». Quedan inconclusas «Yes, I can.», «Yes, I can come.», «Sorry, I can’t.» y «No, I can’t.». Pero `ep35ModelExplain` enseña «Yes, I can» como respuesta corta, y ningún paso la acepta. Mezcla disponibilidad y habilidad, el riesgo `can_ambiguity` del blueprint. Para ES/PT es doble confusión: *saber nadar* frente a *poder venir* | alta | Usar preguntas de habilidad («Can you swim?») en pasos `state_ability`. Aceptar la respuesta corta. Las invitaciones van en otro intent o se retiran | contenido + motor |
| D6 | `three_of_us` 1 (`a1Arc3.js:247`), `see_you_on_friday` 1 (`makingArrangements.json:407`) | «Hi! Good to see you.» → «Hi!» se rechaza y la retroalimentación habla de cerrar la conversación. «Good to see you too» queda inconclusa. A «Hi again!» de alguien conocido, el modelo responde «Hi, I’m {name}.» (presentarse otra vez). «Hi! Nice to see you too.» y «Hello again!» se rechazan | alta | Un intent de respuesta a saludo, o aceptar saludo + `you too`. Cambiar el modelo | contenido + motor |
| D7 | `and_you` 9, `meeting_someone_new` 5, `what_does_it_mean` 8 (`a1Arc1.js:168,229`; `a1Arc2.js:268`) | Piden «pregunta por eso» o «pregunta sobre mis días», pero `ask_life_fact` solo acepta `do you work/study` y `what do you do`. Alex ya dijo dónde trabaja; Maya ya dijo qué hace. No se aceptan 5/8 seguimientos naturales («Do you like it?», «Where is the shop?») ni «When do you get up?». `ask_routine` sigue sin existir (0 apariciones en `src/`) | alta | Reescribir el prompt para que la pregunta enseñada sea coherente, o implementar `ask_routine` | contenido (+ motor si `ask_routine`) |
| D8 | `state_life_fact`, todos los pasos (`:1351`) | Quedan inconclusas «I’m a doctor.», «I’m a nurse.» e «I’m an engineer.». También «I’m retired.»: perfil adulto mayor. «I don’t work.» se rechaza con «Di quién: empieza con I». Pero acepta «I’m a teacher.» | media | Aceptar `I'm a/an + sustantivo`, `I'm retired` y la negación. Retroalimentación honesta | motor |
| D9 | `introduce_person` (`:1516`), `ask_location` (`:1817`) | Falsos positivos: «This is a book.» y «This is the station.» cuentan como presentar a una persona; «Where are you from?» cuenta como preguntar por un lugar | media | Exigir nombre propio o relación (`my friend`). Excluir `where are you from` | motor |
| D10 | `state_person_fact` (`:1567`); `shes_a_student` 10, `three_of_us` 6 | La instrucción es «Tell Ben about her», pero quedan inconclusas «Mia is my classmate.», «Ben is my classmate.» y «Mia is student.»: solo vale `he/she` | media | Aceptar el nombre como sujeto + `is`/`-s` | motor |
| D11 | `state_life_fact` (`:1365`), `ask_life_fact` | `naturalVersion` repite el error del alumno: «I work in home.» e «I study in the university.» se aceptan y se muestran como versión natural | media | No usar el texto del alumno como modelo si no coincide con un patrón limpio | motor |
| D12 | Errores de transferencia L1 | «I study in the night» (ES/PT) → «añade la parte del día». «I works at home» → «añade qué haces». Glosa ES de `evening`: «tarde», igual que `afternoon` (`es.js:1559-1562`, `ep22*`). PT la traduce «à noite». Copula omitida (árabe, japonés): «She my classmate» queda inconclusa y sin pista | media | Diagnósticos `wrong_preposition`, `third_person_on_I` y `missing_be`. Revisar la glosa ES de evening | motor + copia i18n |
| D13 | 7 pasos con «Listen…» (`where_is_it` 8, `its_over_there` 8, `more_than_ten` 3, `how_much_is_it` 3 y 8, `this_one_or_that_one` 3 y 8) | Los episodios ingleses no tienen audio: `ListeningTurn` solo se monta con `runtime`, que es el curso de español (`EpisodeShell.jsx:855,1042`). El texto está en pantalla | media | Audio TTS en inglés para esos pasos, o cambiar «Listen» por «Read» | motor o contenido |
| D14 | `more_than_ten` 4 y 8, `how_much_is_it` 8, `when_are_you_free` 5 | La opción correcta aparece literal en el enunciado: «Which one is “thirty”?» → «Thirty.»; «Which day is “Monday”?» → «Monday.». Se aciertan copiando, y rotar el orden no lo arregla. «Which clock is right?» tiene opciones en palabras, sin relojes, y usa una hora de 24 h hablada («seventeen») | media | Enunciado en L1 o número en cifras con opciones en palabras. Quitar «clock» o mostrar relojes | contenido |
| D15 | 21 `recall` no-repaso | En 15 de 21, el recuerdo va un paso después de un `free_reply` del mismo intent. En `where_shall_we_meet` 8 y 9, el texto es idéntico. Es repetición inmediata, no recuperación | media | Mover el recuerdo a otra sesión o al calentamiento siguiente. Rotularlo como práctica | contenido |
| D16 | Instrucciones dobles que el paso no juzga | `what_you_do` 8 («tu nombre y qué haces»): «I work at home.» basta; «Hi, I’m Sebastian.» queda inconclusa. `this_is` 9 («tú y tu amigo»): basta «This is Ana.». `this_one_or_that_one` 6 y 9 («elige y…»): no se comprueba la elección. `see_you_on_friday` 8: «mantén toda la conversación» se juzga con una sola frase | media | Reescribir las instrucciones a lo que se juzga, o juzgar ambas partes | contenido (o motor) |
| D17 | `i_can_i_cant` 7 (`whatYouCanDo.json:125`) | Lingua «busca una palabra» y la instrucción pide preguntar qué significa. El modelo, «What does “cook” mean?», exige la palabra que falta. Lógica invertida; el paso no tiene `meaningWord` | media | Lingua dice «cook» y se pregunta el significado. O usar `ask_how_to_say` | contenido |
| D18 | `can_you` 7 (`whatYouCanDo.json:275`) | Modelo fijo: «How do you say “nadar” in English?», con una palabra española para todos los locales (ja, ar, de, fr, it) | media | Palabra por locale, o «that» | contenido |
| D19 | Capacidades del blueprint | `ask_how_to_say_something`: 0 pasos sin modelo; el blueprint pide 1 independiente. `ask_routine`: 0. `state_price`: el alumno nunca dice un precio. `use_bigger_numbers`: los 2 pasos sin modelo no prueban nada (D1) | media | Decisión del propietario + pasos | contenido |
| D20 | `how_much_is_it` 5 (`a1Arc5.js:165`) | El hueco «How much ___ they?» acepta «is»: «How much is they?» queda marcado como correcto | media | Quitar `alternatives: ['is']` | contenido |
| D21 | Registro | «Can I have a moment, please?» (`a1Arc4.js:101`) no es natural, y «Excuse me, do you have a moment?» no se acepta. «at the side of the bag» (`:171`). «It is close to the exit» (`:187`), pero «It’s close to the exit.» se rechaza; también «by» y «beside». «the one on the left» → «This one» confunde izquierda con cercanía (`a1Arc5.js:237`) | media | Revisión nativa. Aceptar `close to`; en el prompt, «next to» | contenido + motor |
| D22 | `express_like` en contexto de idea o elección (`see_you_on_friday` 3, `this_one_or_that_one` 7) | «Sounds good!», «Yes, great idea.», «The apple.» y «This one.» se rechazan como «falta el verbo» | baja | Aceptar el acuerdo y el sustantivo elegido en esos pasos | motor |
| D23 | `buying_it` 3; `how_do_i_get_there` 3 | «Can I have a ticket?» (sin please) y «A ticket, please.» se rechazan. «Excuse me, how to get to the station?» (transferencia ES/PT) queda inconclusa. «Where is the bus to the station?» se rechaza | baja | Revisión docente de la exigencia de «please». Variante transporte | motor |
| D24 | Exposición léxica | Tipos de palabra inglesa vistos por primera vez (prompts y opciones, sin mini-historias) frente a Pre-A1 + episodios previos: `my_day` 20, `more_than_ten` 19, `where_is_it` 16, `i_can_i_cant` 15. Días antes de enseñarse: «Fridays» en ep 20, «Mondays» en ep 23, «Friday» en ep 34; se enseñan en ep 36. 4 prompts «rápidos» sin espacios («I’malexandIwork…»): acertijo de lectura, ilegible para lector de pantalla | baja | Revisión docente de carga. Usar marcador de velocidad en vez de pegar palabras | contenido |

## Las 12 condiciones de `en-a1-readiness-review.md` §5

| # | Estado | Una línea |
|---|---|---|
| 1 | no cumplida | A1 ya rota en el reproductor (`optionOrder.js`; `check-option-order` 345 OK, 11/11/12, incluye arcos 6–7). Pre-A1 y la prueba de nivel siguen esperando la decisión del propietario. D14 no lo arregla la rotación |
| 2 | no cumplida | No hay revisión docente de los 21 episodios. Este documento no la sustituye |
| 3 | no cumplida | No hay registro de revisión nativa de la copia A1 |
| 4 | no cumplida | `ask_routine` sin decidir ni construir (D7, D19). Métrica de reutilización sin corregir |
| 5 | no cumplida | No existe `check-en-unseen`. Las 222 variantes de esta fase son del agente, sin umbral previo |
| 6 | no cumplida | `prepared/a1Readiness.js:68`: `A1_UNCALIBRATED` sigue con los dos umbrales |
| 7 | no cumplida | 0 participantes. Piloto no aprobado |
| 8 | desconocido | No verificado en esta fase |
| 9 | no cumplida | `prepared/a1Readiness.js` sigue fuera de `src/`. `MILESTONE_LEVELS = ['pre_a1']` (`learnerModel.js:155`) |
| 10 | no cumplida | Pendiente. Arreglar D1–D7 cambia motor y contenido, así que habrá que repetir `LC-PED-002` |
| 11 | no cumplida | Sin recorrido en navegador (A1 cerrado, fuera de alcance aquí) |
| 12 | no cumplida | Sin decisión `LC-PROD-002`. `levels.js:67` `available: false` |

## Qué debe comprobar un revisor humano

1. Si las 72 variantes no aceptadas del subconjunto «correcto» lo son de verdad. Fijar qué falta tolera A1 (please, artículo, cópula) **antes** de tocar reglas.
2. D5: si las invitaciones se responden con `can` de habilidad. Explicación ES/PT de *saber* frente a *poder*.
3. Naturalidad y registro: D21; «Thanks, bye.» para cerrar; inglés británico/americano (toilet, university, shall).
4. Glosas L1: evening/afternoon en ES y PT; «nadar» en ja/ar; copia de los 7 locales (condición 3).
5. Carga léxica y orden de días y horas (D24); si «seventeen» como hora hablada es aceptable en A1.
6. Si los recuerdos inmediatos (D15) se rotulan como práctica o se mueven.
7. Recorrido con un estudiante real con lector de pantalla y en RTL (árabe) para los prompts sin espacios y la escritura en inglés.
8. Firmar o rechazar cada fila; nada aquí está aprobado.
