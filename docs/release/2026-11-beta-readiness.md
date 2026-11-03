# Preparación de la beta — estado al 2026-11-02 (fase 2)

> **Veredicto: lista para una prueba interna limitada en local. NO lista para usuarios reales.**
> - Lo educativo y lo de seguridad que dependen solo del código están hechos y probados.
> - Lo que falta depende de autorizaciones externas:
>   - *push*, Preview y entorno de autenticación;
>   - revisión legal y nativa;
>   - contacto de privacidad;
>   - derechos de Chatto.
>
> Historia del bloque 1: commits `738617f` a `ee50e1a` (ver §6).

## 1. Rama y commits

- **Clon:** `C:\Users\Sebastian Gamboa\Music\LinguaChat-integration`.
- **Rama:** `beta/2026-11-es-for-en`, local, sin *upstream*, *push* deshabilitado.
- **Puntos de recuperación:**
  - `recovery/p6-integration-e656e04`: fases P0–P5;
  - `recovery/beta-block1-ee50e1a`: bloque 1 de la beta.
- **`main` remoto:** `086323c`, sin cambios.

| Commit | Contenido |
|---|---|
| `e434e60` | Planes honestos; seguridad del tutor en el servidor; pregunta de edad |
| `ecfabe6`, `c1bb8ce` | Sesión diaria de español, misiones, voz del dispositivo; carga diferida (bundle de entrada a 758,7 kB) |
| `decd99f` | Chat de práctica en español (reglas locales) |
| `f856925` | Descargar y borrar los propios datos; Planes verificados contra el código |
| `793f3ee` | Correcciones de la QA en navegador; revisión automática del contenido español |
| (siguiente) | Derechos Premium preparados e inactivos; documentación de la fase 2 |

**Para deshacer:** `git switch` a una etiqueta de recuperación, o `git revert <sha>`. Los datos nuevos (`lc2-age-confirmed`, `lc2-course-chat-es`, `lc2-daily-session-es-v1`) son claves aparte, así que un código anterior las ignora. **No probado en un navegador con código revertido.**

## 2. Evidencia

### 2.1 Pruebas automáticas nuevas de la fase 2

| Prueba | Casos | Qué demuestra |
|---|---|---|
| `tests/test_safety.py` | 164 | ≥25 casos dañinos por idioma (en/es/ja/ar), evasiones, un conjunto legítimo que **debe pasar**, respuestas en 8 idiomas, ruta: bloquea antes del motor, no guarda, no registra texto |
| `tests/test_es_tutor.py` | 12 | Temas en orden, variantes regionales, correcciones nombrables explicadas en inglés, **no corrige lo que no entiende**, redirige el inglés, responde preguntas, el objetivo `es` se rechaza para hispanohablantes, seguridad aplicada |
| `tests/test_entitlements.py` | 10 | Firma Standard Webhooks (manipulación, reenvío), idempotencia, eventos fuera de orden, cancelar mantiene el acceso hasta el fin del periodo, reembolso o revocación lo cortan, **ninguna ruta expone billing** |
| `check-age-gate` | 32 | Tres tramos sin fecha de nacimiento; menor de 18 = sin cuenta y solo una marca de tiempo de 24 h; adulto = solo «18_plus»; cuentas existentes; el formulario de registro no se puede abrir antes de la pregunta |
| `check-es-session` | 187 | Plan solo con evidencia española; las duraciones lo limitan; misiones y transferencias solo con lecciones completadas; cada bloque da un paso real cuyo modelo pasa; un repaso por lección al día; el plan inglés no cambia; persistencia y reanudación |
| `check-learner-data` | 26 | Dos cuentas reales en un navegador: la exportación y el borrado solo tocan la cuenta propia; un acceso caducado no hace nada; el contacto nunca se inventa; **cada función del plan gratuito está respaldada por código** |
| `check-es-course` | 347 (antes 343) | Más revisión automática de cada línea en español (¿ ¡, tildes interrogativas) |

### 2.2 Navegador real (banco visual con datos sintéticos; Chromium del panel)

- **Planes (390 px):** solo funciones reales; Premium «No disponible»; sin precio; sin desbordamiento.
- **Pregunta de edad (es):**
  - tres botones de igual peso;
  - «De 13 a 17» → pantalla de no disponible; solo se guarda `lc2-age-gate-block` con una marca de tiempo, y persiste tras recargar;
  - «18 o más» → registro, sin guardar nada.
- **Cuenta existente (ar, RTL):** «Menos de 13» → bloqueo → cerrar sesión; sin desbordamiento.
- **Sesión diaria en español (profunda):**
  - repaso → reintento de error frecuente («Soy bien» → explicación de ser/estar → acierto) → repasos → completada;
  - se reanudó tras recargar.
- **Chat de español contra el backend real (uvicorn local):**
  - «me llamo es Ana» → corrección;
  - nombre → «¡Mucho gusto, Ana!»;
  - «Soy bien» → ser/estar;
  - frase fuera de alcance → «Perdón, no entendí bien» sin corrección;
  - inglés → «¡En español, por favor!»;
  - «quiero suicidarme» → respuesta de apoyo con 988 y \*4141.
- **Hoy del curso** (tarjetas de sesión y chat) y **Tú → Tus datos** (ja): sin desbordamiento.
- **Defectos encontrados y corregidos en esta QA:**
  1. un repaso sobre un paso de recuerdo no tenía ejemplo y podía atascarse;
  2. tres repasos de la misma lección en un día;
  3. la respuesta de seguridad en el chat se marcaba en español y ofrecía voz española;
  4. el compañero no contestaba «¿y tú?»;
  5. «1 activities»;
  6. el texto de Planes decía «(English course)»;
  7. el bundle de entrada subió a 1.546 kB por una importación estática (detectado por `check-bundle-boundaries`).

### 2.3 No probado (y por qué)

- **Autenticación real:** sin entorno autorizado (§5).
- **App completa con sesión iniciada:** sin autenticación local; se usó el banco visual.
- **Preview de Vercel:** sin autorización.
- **`check:github-integration`:** falta `jq`; corre en CI.
- **Voces reales en español:** el panel no reproduce audio. Se probó la lógica de elección de voz (`check-listening` + `pickVoice`), no el sonido.
- **Revisión por un hablante nativo:** no hecha. **No se marca como validada.**
- **Eficacia del aprendizaje:** sin estudiantes reales.

## 3. Criterios de la beta (actualizados)

| Criterio | Estado |
|---|---|
| Usuario adulto: pregunta de edad | ✅ Implementado y probado |
| Registro y recuperación de cuenta | ❌ No probado: sin entorno (§5) |
| Elegir entre aprender inglés o español | ✅ |
| Aprender inglés desde español | ✅ (existente) |
| Aprender español desde inglés | ✅ Local (falta la revisión nativa) |
| Lecciones reales y correcciones apropiadas | ✅ Evaluadores separados por idioma |
| Practicar con Lingua dentro de su capacidad | ✅ Chat en inglés y español; honesto sobre sus límites |
| Voz del dispositivo | ✅ Lógica; 🟡 sonido no verificado aquí |
| Repasar | ✅ Sesión diaria por curso |
| Progreso real y cursos sin mezclar | ✅ Probado (aislamiento) |
| Eliminar la propia información | ✅ Local; 🟡 cuenta de acceso por solicitud (contacto por configurar) |
| Privacidad y términos | 🟡 Borradores contrastados con el código; falta la revisión jurídica |
| Funciones gratis y futuras sin engaño | ✅ Verificado por `check-learner-data` |
| Seguridad del tutor | ✅ Servidor, 164 pruebas; límites documentados |
| Licencias de activos | 🟡 Dependencias OK; **Chatto sin documentar = bloqueo de publicación** |
| Sin secretos en el cliente | ✅ Garantías |
| Sin niveles cerrados anunciados | ✅ |
| Reversión | 🟡 Etiquetas de recuperación; no probada en un navegador |
| QA en Preview o producción | ❌ Sin autorización |

## 4. Plan hacia el 15 de noviembre

| Fecha | Qué | Quién |
|---|---|---|
| 3–4 nov. | Decisiones: *push* y PR, correo del autor, `CLAUDE.md`, entorno de autenticación, contacto de privacidad, Chatto | Propietario |
| 4–6 nov. | *Push* de los dos PR en borrador; CI; Preview; QA en Preview a 390 y 1440 px | Claude (con autorización) |
| 6–9 nov. | Autenticación real en el entorno de prueba: registro, confirmación, inicio y cierre de sesión, recuperación, cambio de cuenta, aislamiento, borrado | Claude + propietario (cuentas de prueba) |
| 8–12 nov. | Revisión nativa del español; revisión legal (CL y US); recursos de crisis verificados | Propietario (contratar o designar) |
| 13–14 nov. | Correcciones; dos ciclos limpios; lista de verificación final | Claude |
| 15 nov. | Beta limitada por invitación, **solo con autorización** | Propietario |

## 5. Plan exacto: entorno de autenticación de prueba (no existe todavía)

**Qué necesita el propietario:**
1. Crear un **proyecto Supabase nuevo y separado**, por ejemplo `linguachat-staging`. Nunca un proyecto de EvoLabs ni el de producción.
2. En ese proyecto:
   - activar correo y contraseña;
   - instalar las plantillas de `docs/auth-email/`;
   - fijar el Site URL y los Redirect URLs a la Preview de Vercel.
3. Entregar **solo** `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del proyecto de prueba, configurados como variables de **Preview** en Vercel. Nunca la clave `service_role`.
4. Autorizar por escrito la QA contra ese entorno con cuentas de prueba (correos de dominio de prueba o alias del propietario).

**Qué ejecutaré** (recorridos reproducibles; ninguno contra producción):

| # | Recorrido | Evidencia esperada |
|---|---|---|
| 1 | Pregunta de edad → registro → correo de confirmación → inicio de sesión | Cuenta con la declaración `18_plus` en los metadatos |
| 2 | Recuperación de contraseña (correo → enlace → nueva contraseña) | Sesión válida con la nueva contraseña |
| 3 | Cuenta A estudia español; cerrar sesión; cuenta B en el mismo navegador | B no ve nada de A (claves `lc2-`, curso activo, chat, sesión) |
| 4 | Volver a A | El progreso de A está intacto |
| 5 | Tú → Descargar mis datos (A) | El archivo solo trae claves de A |
| 6 | Tú → Borrar de este dispositivo (A) | Las claves de A desaparecen y las de B no |
| 7 | Cuenta antigua sin declaración | Ve la pregunta de edad una vez |
| 8 | Persistencia tras recargar y en dos pestañas | Sin pérdida (pruebas de concurrencia existentes) |
| 9 | Sincronización en la nube | **No se habilita:** `CLOUD_PREFERENCES_RELEASED=false` |
| 10 | Derechos premium | **No aplica:** sin cobros |

## 6. Checklist de integración en GitHub

1. **Antes de subir:**
   - correo de autor que no exponga datos: el `noreply` de GitHub del propietario, reescribiendo el autor en local antes del *push* (sin cambiar el contenido; volver a verificar la igualdad del árbol);
   - decidir si se incluyen los `.diff` de auditoría.
2. **PR 1 (P0–P5):**
   - rama `integration/local-p0-p5` → borrador contra `main`;
   - cuerpo: `docs/audits/2026-10-31-integration-pr-draft.md` (incluye `## Evidence`);
   - efectos: Preview de Vercel por cada commit; CI con `frontend`, `backend` y `guards` (más `evidence` y `qa-cycle` si deja de ser borrador); nada se fusiona solo.
3. **PR 2 (beta):**
   - `beta/2026-11-es-for-en` → borrador **apilado** sobre el PR 1, para revisarlos por separado;
   - cuerpo con `## Evidence` (los ciclos de este documento);
   - incluir la propuesta de `CLAUDE.md` si se aprueba, y la actualización de `.ai/` según el protocolo.
4. **Controles de GitHub:**
   - CI verde, incluido `check:github-integration` (con `jq` en CI);
   - el `check:all` de CI debe dar 104/104.
5. **Vercel Preview:**
   - revisar a 390 y 1440 px en claro, oscuro y árabe;
   - confirmar las variables de Preview: la clave de prueba, nunca `service_role`;
   - confirmar si la Preview está protegida.
6. **Migraciones y reversión:**
   - un usuario con datos de P5 abre la beta y sus datos siguen (las claves nuevas son aditivas);
   - revertir el PR 2 en la Preview y comprobar que el inglés sigue intacto.
7. **QA con una cuenta de prueba:** los 10 recorridos de §5.
8. **Fusión:** P0–P5 primero y luego la beta, solo con dos ciclos limpios en CI y aprobación del propietario.

**Nada de esto se ha ejecutado.**

## Ciclos finales (exit codes)

(Se completa al terminar los dos ciclos sobre el *head* definitivo de la fase 2.)
