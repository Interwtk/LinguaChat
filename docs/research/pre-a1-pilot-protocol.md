# Protocolo de piloto Pre-A1 — borrador para aprobación

> **Estado (fase 5 / P4, 2026-10-31): BORRADOR. No aprobado, no iniciado.**
>
> - No hay participantes ni datos, y no se ha recogido nada.
> - No hay formulario dentro de la aplicación ni mecanismo de exportación. Construirlos requiere autorización aparte.
> - Ninguna cifra de este documento es un resultado. Los números que aparecen son **parámetros de diseño propuestos**, que el propietario y un revisor de ética o privacidad deben confirmar.
>
> Base: `docs/research/learning-science-foundation.md` §11 («pre-test → periodo de aprendizaje → post-test inmediato → post-test diferido con ejemplos no vistos»).

## 1. Objetivo

Averiguar si una persona adulta que empieza desde cero puede, **después** de usar el recorrido Pre-A1 de LinguaChat:

1. **producir sin ayuda** las 13 capacidades requeridas de salida de Pre-A1 (`PRE_A1_EXIT_CRITERIA.requiredCanDos`);
2. **recordarlas más tarde**, una y cuatro semanas después;
3. **usarlas en un contexto nuevo** (transferencia);

y también si la experiencia es clara, accesible y no genera ansiedad.

**Fuera de alcance:**
- demostrar superioridad frente a otro método;
- medir el habla o la pronunciación, que la aplicación no evalúa;
- validar A1.

**Tipo de estudio:** piloto de **viabilidad** con medición pre/post. No establece eficacia causal (§13).

## 2. Preguntas e hipótesis que pueden fallar

| # | Pregunta | Lo que la **refutaría** |
|---|---|---|
| H1 | ¿Aumenta la producción independiente de las 13 capacidades del pre-test al post-test inmediato? | Mediana de capacidades logradas sin ayuda en el post-test ≤ la del pre-test + 2 |
| H2 | ¿Se mantiene en el diferido (≈ 4 semanas)? | Pérdida > 50 % de lo ganado entre el post inmediato y el diferido |
| H3 | ¿Hay transferencia a contextos no vistos? | Éxito en las tareas de transferencia < la mitad del éxito en las tareas familiares |
| H4 | ¿Coincide la evidencia de la aplicación con la medición externa? | Las capacidades que la app marca como `can_use` fallan en la prueba externa en > 30 % de los casos |
| H5 | ¿La experiencia es usable y poco ansiógena? | SUS < 68 en la mediana, o ansiedad media autoinformada que **sube** del inicio al final |

Los umbrales son propuestas de diseño que se fijan **antes** de ver datos y no se cambian después (§12).

## 3. Consentimiento y privacidad

- **Participantes:** solo **adultos (≥ 18)**. Los menores quedan excluidos hasta una revisión aparte de privacidad, consentimiento y cumplimiento (`CLAUDE.md`, *Age adaptation*).
- **Consentimiento informado**, por escrito y en el idioma auxiliar del participante. Debe explicar:
  - qué se mide;
  - cuánto dura;
  - que la participación es voluntaria;
  - que puede retirarse sin dar razones y pedir que se borren sus datos;
  - que **la app no es un curso certificado**.
- **Minimización:**
  - Sí se recoge: un id seudónimo, la franja de edad (no la fecha de nacimiento), el idioma auxiliar, la experiencia previa con el inglés (autoinformada) y las respuestas a las pruebas.
  - No se recoge: nombre en los datos de análisis, correo dentro del conjunto de datos, ni ubicación.
- **Datos de la aplicación:** el modelo del alumno vive en su dispositivo. Usarlo exige un **mecanismo de exportación con consentimiento explícito**, que **no existe** y requiere autorización y revisión de privacidad. Sin él, la medición es **solo externa** (las pruebas de §6).
- **Almacenamiento:**
  - fuera de la aplicación y fuera de Supabase, que no está autorizado para esto;
  - acceso limitado al equipo del piloto;
  - plazo de conservación definido antes de empezar;
  - borrado al terminar el análisis.
- **Revisión legal** según la jurisdicción de los participantes: tarea del propietario y requisito previo.
- **Los textos libres** de los participantes no se publican, ni siquiera anonimizados, sin un consentimiento adicional.

## 4. Participantes y nivel inicial

- **Inclusión:** adultos que se describen como principiantes absolutos o casi; tienen uno de los 8 idiomas auxiliares como lengua de comodidad; disponen de un dispositivo propio.
- **Exclusión:** nivel A1 o superior demostrado en el pre-test (techo). Aplicar un criterio de techo en la tarea de pre-test, por ejemplo ≥ 10 de las 13 capacidades sin ayuda.
- **Diversidad buscada:** varias franjas de edad, incluidos **mayores de 60**; al menos tres idiomas auxiliares, incluido **uno RTL (árabe)** y **uno no latino (japonés)**; usuarios de lectores de pantalla si se puede.
- **Tamaño propuesto:** entre 12 y 30 personas. Es suficiente para ver problemas de viabilidad, usabilidad y medición, y **no** para estimar efectos con precisión.
- **Nivel inicial:** se registra con el pre-test (§6), no con el *placement* de la app. Además se anota si la persona se salta parte del recorrido.

## 5. Periodo de aprendizaje

- Unas 4 semanas de uso libre de LinguaChat Pre-A1, tal como está: Pre-A1 congelado, A1 cerrado y modo local.
- **Sin** tiempo mínimo obligatorio ni recordatorios de presión. Se registra el uso autoinformado: días y minutos aproximados.
- Ningún miembro del equipo enseña inglés a los participantes durante el periodo.

## 6. Instrumentos — tareas comparables

Se preparan **dos formas paralelas** (A y B) de la prueba, contrabalanceadas: la mitad hace A en el pre-test y B en el inmediato, la otra mitad al revés. El diferido usa una **forma C** con los mismos tipos de tarea.

Para cada una de las 13 capacidades:

| Tipo de tarea | Qué mide | Ejemplo de forma (no son ítems definitivos) |
|---|---|---|
| **Producción familiar** | producción independiente en una situación del currículo | «Una persona te pregunta tu nombre y de dónde eres. Responde por escrito.» |
| **Producción en contexto nuevo** (transferencia) | la misma capacidad con un contexto o un léxico que no aparecen en los episodios | una situación de presentación en un lugar que la app no usa |
| **Comprensión escrita** | reconocimiento | elegir la respuesta adecuada |
| **Comprensión oral** (opcional) | escucha | audio grabado por una persona; no se usa el TTS de la app, para no favorecerla |

- **Formato:** escrito, sin diccionario, sin la app abierta y sin límite de tiempo estricto. **La velocidad no se puntúa** (coherente con el motor, que no infiere nada de la velocidad).
- **Rúbrica por capacidad**, de 0 a 2, fijada antes:
  - 0 = no comunica;
  - 1 = comunica con errores que no impiden la comprensión;
  - 2 = adecuada.
- Una capacidad está «lograda sin ayuda» con 2 en la producción familiar.
- **Fiabilidad:** dos evaluadores independientes y ciegos a la fase puntúan al menos el 25 % de las pruebas. Se informa el acuerdo, por ejemplo con kappa ponderado. Si es bajo, se revisa la rúbrica **antes** de puntuar el resto.
- **Evaluadores:** docentes de inglés. La evaluación local de la app **no** puntúa el piloto, para no medir la app con la app.

## 7. Calendario

| Momento | Qué |
|---|---|
| Día 0 | consentimiento, cuestionario breve, **pre-test** (forma A o B), cuestionario de ansiedad/confianza |
| Días 1–28 | uso de la app |
| Día 28 ± 2 | **post-test inmediato** (la otra forma), SUS, cuestionario de confianza, ansiedad, claridad, aburrimiento y utilidad percibida, entrevista corta opcional |
| Día 56 ± 4 | **post-test diferido** (forma C), sin haber usado la app durante las últimas 4 semanas *o* registrando si la usó; las dos opciones se definen antes |

## 8. Evidencia independiente y comparación con la app

- **En la prueba externa:** cuenta solo lo producido sin ayuda.
- **En la app,** solo con la exportación autorizada (§3), se comparan por capacidad:
  - el estado de aprendizaje (`learningState`);
  - los éxitos independientes frente a los asistidos;
  - los repasos vencidos;
  - la readiness Pre-A1 (`derivePreA1Readiness`) y el hito de graduación.

  Esa comparación responde a H4 y es la información que falta para **calibrar** A1 (`docs/curriculum/a1-readiness-design.md` §2.2).
- La evidencia asistida (pista, modelo, reintento) se analiza aparte y **nunca** se suma a la independiente.

## 9. Experiencia de usuario, errores frecuentes y accesibilidad

- **Usabilidad:** System Usability Scale (SUS, 10 ítems), traducida al idioma auxiliar; cinco preguntas Likert de confianza, ansiedad, claridad, aburrimiento y utilidad percibida; dos preguntas abiertas.
- **Errores frecuentes:** se registran a partir de las **pruebas externas**, con una categoría por error (orden de la pregunta, sujeto, verbo, artículo, léxico, ortografía, otro). Se cruzan con lo que la app detecta y lo que no (`docs/architecture/intelligent-evaluator-contract.md` §7).
- **Accesibilidad:**
  - observación de una sesión por participante mayor de 60 y por usuario de lector de pantalla, si lo hay;
  - checklist: tamaño de texto, objetivos táctiles, contraste claro/oscuro, RTL, Chatto no reflejado, teclado;
  - cualquier problema bloqueante detiene el piloto para ese grupo hasta corregirlo.

## 10. Abandono

- Se registra quién abandona, cuándo (antes del inmediato, antes del diferido) y, si quiere decirlo, por qué.
- Se informan **todos** los participantes que firmaron, no solo los que terminaron.
- Los resultados se presentan con y sin los abandonos, y se discute si quien abandona tenía un pre-test distinto.
- Un abandono > 40 % antes del post-test inmediato es por sí mismo un **hallazgo de viabilidad**: hay que revisar la experiencia antes de cualquier ampliación.

## 11. Condiciones de éxito (fijadas antes)

El piloto se considera **favorable para seguir** si se cumplen todas:

1. Se refutan las hipótesis nulas de H1 y H3 en la dirección esperada, con los umbrales de §2 aplicados a la mediana.
2. H2: la retención en el diferido es ≥ 50 % de lo ganado.
3. H4: concordancia aceptable entre la app y la prueba externa, o discrepancias explicadas y corregibles.
4. H5: SUS ≥ 68 en la mediana y ninguna barrera de accesibilidad bloqueante sin resolver.
5. Abandono ≤ 40 % antes del inmediato.
6. Acuerdo entre evaluadores aceptable antes de puntuar todo.

## 12. Criterios de revisión

Lo que cambia si el piloto falla en cada punto:

| Si falla… | Revisar |
|---|---|
| H1 | contenido de los episodios y objetivos de producción; ¿demasiado reconocimiento y poca producción? |
| H2 | programación de repaso (`scheduleReview`), recuerdo diferido |
| H3 | variedad de contextos e intereses; reutilización entre episodios |
| H4 | criterios de evidencia y estados de aprendizaje; umbrales de readiness Pre-A1; detector de copia |
| H5 | claridad de instrucciones, carga, tono de corrección, accesibilidad por franja de edad |
| abandono | ritmo, motivación, fricción del primer uso |

Reglas:
- **Sin ajuste a posteriori:** no se cambian umbrales ni hipótesis después de ver los datos. Cualquier análisis no planificado se etiqueta como **exploratorio**.
- **Ninguna conclusión pública de eficacia** sin un estudio posterior con grupo de comparación.

## 13. Límites que se declaran desde el principio

- Sin grupo de control no se puede atribuir la mejora a la app: también influyen la práctica fuera de ella, la motivación y el efecto de la propia prueba.
- La muestra es pequeña y autoseleccionada.
- No se mide el habla.
- Se mide Pre-A1 tal como está congelado; los resultados no se extrapolan a A1.

## 14. Requisitos previos

Antes de empezar:

1. Aprobación escrita del propietario.
2. Revisión legal y de privacidad para la jurisdicción.
3. Formas A, B y C escritas y revisadas por docentes, con la rúbrica.
4. Decidir si habrá exportación de datos de la app. En caso afirmativo, diseñarla, autorizarla y probarla aparte.
5. Pilotar el propio protocolo con 2 o 3 personas (prueba de instrumentos) y descartar esos datos.
